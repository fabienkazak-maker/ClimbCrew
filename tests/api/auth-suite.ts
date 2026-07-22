import { randomBytes } from "node:crypto";
import { ApiClient, requiredEnvironment } from "./api-client";
import {
  arrayField,
  assert,
  findRecord,
  jsonRecord,
  stringField,
} from "./assertions";
import type { TestContext } from "./test-context";

export async function runAuthSuite(): Promise<TestContext> {
  const backendPort = requiredEnvironment("TEST_BACKEND_PORT");
  const frontendPort = requiredEnvironment("TEST_FRONTEND_PORT");
  const baseUrl = `http://127.0.0.1:${backendPort}`;
  const setupToken = requiredEnvironment("TEST_SETUP_TOKEN");
  const adminEmail = requiredEnvironment("TEST_ADMIN_EMAIL");
  const adminPassword = requiredEnvironment("TEST_ADMIN_PASSWORD");
  const publicClient = new ApiClient(baseUrl);
  const root = await publicClient.request("/");
  const rootBody = await jsonRecord(root);
  assert(rootBody.ok === true, "Racine API invalide");
  const health = await publicClient.request("/api/v1/health");
  assert(
    health.headers.get("x-content-type-options") === "nosniff",
    "En-tête nosniff absent",
  );
  assert(
    health.headers.get("x-frame-options") === "DENY",
    "En-tête frame absent",
  );
  await publicClient.request("/setup-db", { expected: 403 });
  await publicClient.request("/setup-db", {
    headers: { "X-Setup-Token": setupToken },
  });
  await publicClient.request("/db-status", {
    headers: { "X-Setup-Token": setupToken },
  });
  const anonymousMe = await jsonRecord(await publicClient.request("/auth/me"));
  assert(
    anonymousMe.user === null,
    "Une session anonyme ne doit pas avoir d’utilisateur",
  );
  const allowedOrigin = `http://127.0.0.1:${frontendPort}`;
  const cors = await publicClient.request("/health", {
    headers: { Origin: allowedOrigin },
  });
  assert(
    cors.headers.get("access-control-allow-origin") === allowedOrigin,
    "CORS autorisé absent",
  );
  await publicClient.request("/auth/login", {
    method: "POST",
    expected: 401,
    body: { email: adminEmail, password: "incorrect" },
  });
  const admin = new ApiClient(baseUrl);
  const login = await admin.request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword },
  });
  const sessionCookie = login.headers
    .getSetCookie()
    .find((value) => value.startsWith("climbcrew_session="));
  const csrfCookie = login.headers
    .getSetCookie()
    .find((value) => value.startsWith("climbcrew_csrf="));
  assert(
    Boolean(sessionCookie?.toLowerCase().includes("httponly")),
    "Cookie de session non HttpOnly",
  );
  assert(
    Boolean(csrfCookie) && !csrfCookie?.toLowerCase().includes("httponly"),
    "Cookie CSRF illisible",
  );
  await admin.request("/auth/theme", {
    method: "PUT",
    expected: 403,
    csrf: false,
    body: { themePreference: "dark" },
  });
  await admin.request("/auth/theme", {
    method: "PUT",
    expected: 400,
    body: { themePreference: "violet" },
  });
  await admin.request("/auth/theme", {
    method: "PUT",
    body: { themePreference: "light" },
  });
  const userEmail = `member-${randomBytes(5).toString("hex")}@example.invalid`;
  const userPassword = `Bb2!${randomBytes(16).toString("hex")}`;
  await publicClient.request("/auth/request-access", {
    method: "POST",
    expected: 400,
    body: { prenom: "Test", nom: "Member", email: userEmail },
  });
  await publicClient.request("/auth/request-access", {
    method: "POST",
    expected: 201,
    body: {
      prenom: "Test",
      nom: "Member",
      email: userEmail,
      password: userPassword,
      confirmPassword: userPassword,
      acceptTerms: true,
    },
  });
  await publicClient.request("/auth/request-access", {
    method: "POST",
    expected: 409,
    body: {
      prenom: "Test",
      nom: "Member",
      email: userEmail,
      password: userPassword,
      confirmPassword: userPassword,
      acceptTerms: true,
    },
  });
  await publicClient.request("/auth/login", {
    method: "POST",
    expected: 403,
    body: { email: userEmail, password: userPassword },
  });
  const usersPayload = await jsonRecord(
    await admin.request("/admin/auth/users"),
  );
  const userRow = findRecord(
    arrayField(usersPayload, "users"),
    "email",
    userEmail,
  );
  const userId = stringField(userRow, "id");
  await admin.request(`/admin/auth/users/${userId}/approve`, {
    method: "POST",
  });
  const user = new ApiClient(baseUrl);
  await user.request("/auth/login", {
    method: "POST",
    body: { email: userEmail, password: userPassword },
  });
  await user.request("/admin/auth/users", { expected: 403 });
  await publicClient.request("/auth/forgot-password", {
    method: "POST",
    body: { email: userEmail },
  });
  return {
    baseUrl,
    setupToken,
    adminEmail,
    adminPassword,
    admin,
    user,
    userId,
    userEmail,
    userPassword,
  };
}

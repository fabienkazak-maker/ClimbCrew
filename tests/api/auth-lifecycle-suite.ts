import { randomBytes } from "node:crypto";
import { ApiClient } from "./api-client";
import { arrayField, assert, jsonRecord, stringField } from "./assertions";
import type { TestContext } from "./test-context";

export async function runAuthLifecycleSuite(
  context: TestContext,
): Promise<void> {
  await context.user.request("/auth/csrf");
  const resetPayload = await jsonRecord(
    await context.admin.request(
      `/admin/auth/users/${context.userId}/reset-token`,
      { method: "POST" },
    ),
  );
  const resetToken = stringField(resetPayload, "resetToken");
  const publicClient = new ApiClient(context.baseUrl);
  const nextPassword = `Cc3!${randomBytes(16).toString("hex")}`;
  await publicClient.request("/auth/reset-password", {
    method: "POST",
    expected: 400,
    body: {
      email: context.userEmail,
      token: "INVALID",
      password: nextPassword,
      confirmPassword: nextPassword,
    },
  });
  await publicClient.request("/auth/reset-password", {
    method: "POST",
    body: {
      email: context.userEmail,
      token: resetToken,
      password: nextPassword,
      confirmPassword: nextPassword,
    },
  });
  await context.user.request("/participants", { expected: 401 });
  await publicClient.request("/auth/login", {
    method: "POST",
    expected: 401,
    body: { email: context.userEmail, password: context.userPassword },
  });
  const activeUser = new ApiClient(context.baseUrl);
  await activeUser.request("/auth/login", {
    method: "POST",
    body: { email: context.userEmail, password: nextPassword },
  });
  await context.admin.request(`/admin/auth/users/${context.userId}/revoke`, {
    method: "POST",
    body: { reason: "Test automatisé" },
  });
  await activeUser.request("/participants", { expected: 401 });
  await publicClient.request("/auth/login", {
    method: "POST",
    expected: 403,
    body: { email: context.userEmail, password: nextPassword },
  });
  await context.admin.request(
    `/admin/auth/users/${context.userId}/reactivate`,
    { method: "POST" },
  );
  const reactivatedUser = new ApiClient(context.baseUrl);
  await reactivatedUser.request("/auth/login", {
    method: "POST",
    body: { email: context.userEmail, password: nextPassword },
  });
  await reactivatedUser.request("/auth/logout", { method: "POST" });
  await reactivatedUser.request("/participants", { expected: 401 });
  const limited = new ApiClient(context.baseUrl);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await limited.request("/auth/login", {
      method: "POST",
      expected: 401,
      headers: { "X-Forwarded-For": "203.0.113.50" },
      body: { email: "absent@example.invalid", password: "incorrect" },
    });
  }
  await limited.request("/auth/login", {
    method: "POST",
    expected: 429,
    headers: { "X-Forwarded-For": "203.0.113.50" },
    body: { email: "absent@example.invalid", password: "incorrect" },
  });
  const logs = await jsonRecord(
    await context.admin.request("/admin/auth/logs?limit=500"),
  );
  assert(arrayField(logs, "logs").length > 0, "Journaux d’accès absents");
}

import bcrypt from "bcryptjs";
import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import type { UserRow } from "../domain";
import { asyncRoute, bodyRecord } from "../http";
import { logAccess, requestIp } from "../security/access-log";
import { optionalAuth, requireAuth } from "../security/auth-middleware";
import {
  clearAuthCookies,
  setAuthCookies,
  setCsrfCookie,
} from "../security/cookies";
import {
  expiresAt,
  hashToken,
  randomToken,
  SESSION_DURATION_MS,
} from "../security/tokens";
import { serializeUser } from "../serializers";
import { cleanEmail } from "../validation";

export const authLoginRouter: RouterType = Router();

authLoginRouter.post(
  "/login",
  asyncRoute(async (request, response) => {
    const body = bodyRecord(request);
    const email = cleanEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const result = await pool.query<UserRow>(
      "select * from users where lower(email) = $1 limit 1",
      [email],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      await logAccess({
        userId: user?.id ?? null,
        eventType: "login_failed",
        success: false,
        request,
        details: { email },
      });
      response.status(401).json({ error: "Identifiants invalides" });
      return;
    }
    if (user.status !== "active") {
      response.status(403).json({ error: `Compte ${user.status}` });
      return;
    }
    const token = randomToken();
    const expiration = expiresAt(SESSION_DURATION_MS);
    await pool.query(
      `insert into user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     values ($1, $2, $3, $4, $5)`,
      [
        user.id,
        hashToken(token),
        expiration,
        request.headers["user-agent"] ?? null,
        requestIp(request),
      ],
    );
    const updated = await pool.query<UserRow>(
      "update users set last_login_at = now() where id = $1 returning *",
      [user.id],
    );
    const updatedUser = updated.rows[0];
    if (!updatedUser)
      throw new Error("Utilisateur introuvable après connexion");
    await logAccess({
      userId: user.id,
      eventType: "login_success",
      request,
      details: { email },
    });
    setAuthCookies(response, token, randomToken(24), expiration);
    response.json({ ok: true, user: serializeUser(updatedUser) });
  }),
);

authLoginRouter.get("/me", optionalAuth, (request, response) => {
  response.json({ ok: true, user: request.auth?.user ?? null });
});

authLoginRouter.get("/csrf", requireAuth, (_request, response) => {
  setCsrfCookie(response, randomToken(24), expiresAt(SESSION_DURATION_MS));
  response.json({ ok: true });
});

authLoginRouter.post(
  "/logout",
  requireAuth,
  asyncRoute(async (request, response) => {
    if (!request.auth) throw new Error("Authentification absente");
    await pool.query(
      "update user_sessions set revoked_at = now() where id = $1",
      [request.auth.sessionId],
    );
    await logAccess({
      userId: request.auth.user.id,
      eventType: "logout",
      request,
      details: { email: request.auth.user.email },
    });
    clearAuthCookies(response);
    response.json({ ok: true });
  }),
);

authLoginRouter.put(
  "/theme",
  requireAuth,
  asyncRoute(async (request, response) => {
    if (!request.auth) throw new Error("Authentification absente");
    const body = bodyRecord(request);
    const theme = body.themePreference ?? body.theme_preference;
    if (theme !== "auto" && theme !== "light" && theme !== "dark") {
      response.status(400).json({ error: "Préférence de thème invalide" });
      return;
    }
    const result = await pool.query<UserRow>(
      "update users set theme_preference = $2 where id = $1 returning *",
      [request.auth.user.id, theme],
    );
    const user = result.rows[0];
    if (!user) throw new Error("Utilisateur introuvable");
    response.json({ ok: true, user: serializeUser(user) });
  }),
);

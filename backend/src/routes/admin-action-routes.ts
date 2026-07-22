import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import type { UserRow } from "../domain";
import { asyncRoute, pathParam } from "../http";
import { logAccess } from "../security/access-log";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import {
  expiresAt,
  hashToken,
  RESET_TOKEN_DURATION_MS,
  randomToken,
} from "../security/tokens";
import { serializeUser } from "../serializers";

export const adminActionRouter: RouterType = Router();
adminActionRouter.use(requireAuth, requireAdmin);

async function statusAction(
  id: string,
  status: "active" | "revoked",
  reason: string | null,
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `update users set status = $2,
      approved_at = case when $2 = 'active' then coalesce(approved_at, now()) else approved_at end,
      revoked_at = case when $2 = 'revoked' then now() else null end,
      revoked_reason = $3 where id = $1 returning *`,
    [id, status, reason],
  );
  if (status === "revoked") {
    await pool.query(
      "update user_sessions set revoked_at = now() where user_id = $1 and revoked_at is null",
      [id],
    );
  }
  return result.rows[0] ?? null;
}

adminActionRouter.post(
  "/users/:id/approve",
  asyncRoute(async (request, response) => {
    const user = await statusAction(pathParam(request, "id"), "active", null);
    if (!user) {
      response.status(404).json({ error: "Compte introuvable" });
      return;
    }
    await logAccess({
      userId: user.id,
      eventType: "account_approved",
      request,
      details: { by: request.auth?.user.email ?? "" },
    });
    response.json({ ok: true, user: serializeUser(user) });
  }),
);

adminActionRouter.post(
  "/users/:id/revoke",
  asyncRoute(async (request, response) => {
    const user = await statusAction(
      pathParam(request, "id"),
      "revoked",
      "Révocation administrateur",
    );
    if (!user) {
      response.status(404).json({ error: "Compte introuvable" });
      return;
    }
    await logAccess({
      userId: user.id,
      eventType: "account_revoked",
      request,
      details: { by: request.auth?.user.email ?? "" },
    });
    response.json({ ok: true, user: serializeUser(user) });
  }),
);

adminActionRouter.post(
  "/users/:id/reactivate",
  asyncRoute(async (request, response) => {
    const user = await statusAction(pathParam(request, "id"), "active", null);
    if (!user) {
      response.status(404).json({ error: "Compte introuvable" });
      return;
    }
    await logAccess({
      userId: user.id,
      eventType: "account_reactivated",
      request,
      details: { by: request.auth?.user.email ?? "" },
    });
    response.json({ ok: true, user: serializeUser(user) });
  }),
);

adminActionRouter.post(
  "/users/:id/reset-token",
  asyncRoute(async (request, response) => {
    const user = await pool.query<{ id: string | number }>(
      "select id from users where id = $1",
      [pathParam(request, "id")],
    );
    if (!user.rows[0]) {
      response.status(404).json({ error: "Compte introuvable" });
      return;
    }
    const token = randomToken(4).toUpperCase();
    const expiration = expiresAt(RESET_TOKEN_DURATION_MS);
    await pool.query(
      `insert into password_reset_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
      [pathParam(request, "id"), hashToken(token), expiration],
    );
    response.json({ ok: true, resetToken: token, expiresAt: expiration });
  }),
);

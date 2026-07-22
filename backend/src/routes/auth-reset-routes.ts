import bcrypt from "bcryptjs";
import { Router, type Router as RouterType } from "express";
import type { PoolClient } from "pg";
import { config } from "../config";
import { pool } from "../database";
import type { UserRow } from "../domain";
import { asyncRoute, bodyRecord } from "../http";
import { logAccess } from "../security/access-log";
import { hashToken } from "../security/tokens";
import { cleanEmail, isStrongPassword } from "../validation";

export const authResetRouter: RouterType = Router();

interface ResetTokenRow {
  id: string | number;
}

async function applyReset(
  client: PoolClient,
  user: UserRow,
  token: string,
  password: string,
): Promise<boolean> {
  const tokenResult = await client.query<ResetTokenRow>(
    `select id from password_reset_tokens
     where user_id = $1 and token_hash = $2 and used_at is null and expires_at > now()
     limit 1`,
    [user.id, hashToken(token)],
  );
  const resetToken = tokenResult.rows[0];
  if (!resetToken) return false;
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await client.query(
    "update users set password_hash = $2, must_reset_password = false where id = $1",
    [user.id, passwordHash],
  );
  await client.query(
    "update password_reset_tokens set used_at = now() where id = $1",
    [resetToken.id],
  );
  await client.query(
    "update user_sessions set revoked_at = now() where user_id = $1 and revoked_at is null",
    [user.id],
  );
  return true;
}

authResetRouter.post(
  "/reset-password",
  asyncRoute(async (request, response) => {
    const body = bodyRecord(request);
    const email = cleanEmail(body.email);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmation =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (!email || !token || !isStrongPassword(password)) {
      response
        .status(400)
        .json({ error: "Données de réinitialisation invalides" });
      return;
    }
    if (password !== confirmation) {
      response
        .status(400)
        .json({ error: "Les mots de passe ne correspondent pas" });
      return;
    }
    const client = await pool.connect();
    try {
      await client.query("begin");
      const userResult = await client.query<UserRow>(
        "select * from users where lower(email) = $1 limit 1",
        [email],
      );
      const user = userResult.rows[0];
      if (!user || !(await applyReset(client, user, token, password))) {
        await client.query("rollback");
        response.status(400).json({ error: "Code invalide ou expiré" });
        return;
      }
      await client.query("commit");
      await logAccess({
        userId: user.id,
        eventType: "password_reset_completed",
        request,
        details: { email },
      });
      response.json({ ok: true, message: "Mot de passe mis à jour" });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }),
);

import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { serializeUser } from "./user-serializer.js";

function isAdminAccount(user) {
  return Boolean(user && (user.role === "admin" || user.is_admin === true));
}

/**
 * Révoque un compte sans permettre à l'administrateur courant de se verrouiller
 * lui-même ni de supprimer le dernier accès d'administration actif.
 */
export async function revokeAccountSafely(req, res) {
  const userId = Number(req.params?.id);
  const actorId = Number(req.auth?.user?.id || req.enhancementAuth?.user?.id || 0);
  const reason = String(req.body?.reason || "Révocation administrateur").trim().slice(0, 500)
    || "Révocation administrateur";

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Identifiant du compte invalide" });
  }
  if (Number.isInteger(actorId) && actorId > 0 && actorId === userId) {
    return res.status(409).json({
      error: "Vous ne pouvez pas révoquer votre propre compte administrateur.",
    });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const targetResult = await client.query(
      `select * from users where id = $1 for update`,
      [userId],
    );
    const target = targetResult.rows[0];

    if (!target) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }
    if (target.status === "revoked") {
      await client.query("rollback");
      return res.status(409).json({ error: "Ce compte est déjà révoqué." });
    }

    if (target.status === "active" && isAdminAccount(target)) {
      const remainingAdmins = await client.query(
        `
          select count(*)::int as count
          from users
          where id <> $1
            and status = 'active'
            and (role = 'admin' or is_admin = true)
        `,
        [userId],
      );
      if (remainingAdmins.rows[0].count < 1) {
        await client.query("rollback");
        return res.status(409).json({
          error: "Le dernier compte administrateur actif ne peut pas être révoqué.",
        });
      }
    }

    const updatedResult = await client.query(
      `
        update users
        set status = 'revoked',
            revoked_at = now(),
            revoked_reason = $2,
            receive_account_notifications = false
        where id = $1
        returning *
      `,
      [userId, reason],
    );
    await client.query(
      `update user_sessions set revoked_at = now() where user_id = $1 and revoked_at is null`,
      [userId],
    );
    await client.query("commit");

    await writeAccessLog({
      userId,
      eventType: "account_revoked",
      success: true,
      req,
      details: {
        by: req.auth?.user?.email || req.enhancementAuth?.user?.email || null,
        reason,
      },
    });

    return res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Révocation du compte impossible :", error);
    return res.status(500).json({ error: "Révocation du compte impossible" });
  } finally {
    client.release();
  }
}

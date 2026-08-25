import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { serializeUser } from "./user-serializer.js";

function isAdminAccount(user) {
  return Boolean(user && (user.role === "admin" || user.is_admin === true));
}

function actorId(req) {
  return Number(req.auth?.user?.id || req.enhancementAuth?.user?.id || 0);
}

function actorEmail(req) {
  return req.auth?.user?.email || req.enhancementAuth?.user?.email || null;
}

async function hasAnotherActiveAdmin(client, userId) {
  const result = await client.query(
    `
      select count(*)::int as count
      from users
      where id <> $1
        and status = 'active'
        and (role = 'admin' or is_admin = true)
    `,
    [userId],
  );
  return Number(result.rows[0]?.count || 0) > 0;
}

/**
 * Révoque un compte sans permettre à l'administrateur courant de se verrouiller
 * lui-même ni de supprimer le dernier accès d'administration actif.
 */
export async function revokeAccountSafely(req, res) {
  const userId = Number(req.params?.id);
  const currentActorId = actorId(req);
  const reason = String(req.body?.reason || "Révocation administrateur").trim().slice(0, 500)
    || "Révocation administrateur";

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Identifiant du compte invalide" });
  }
  if (Number.isInteger(currentActorId) && currentActorId > 0 && currentActorId === userId) {
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
      const hasAnother = await hasAnotherActiveAdmin(client, userId);
      if (!hasAnother) {
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
      details: { by: actorEmail(req), reason },
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

/**
 * Réactive un compte en recalculant systématiquement son rôle depuis la fiche
 * participant actuellement liée. Un compte sans fiche est réactivé comme simple
 * utilisateur : une ancienne valeur is_admin/role ne peut donc pas ressusciter.
 */
export async function reactivateAccountSafely(req, res) {
  const userId = Number(req.params?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Identifiant du compte invalide" });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const targetResult = await client.query(`select * from users where id = $1 for update`, [userId]);
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }
    if (target.status !== "revoked") {
      await client.query("rollback");
      return res.status(409).json({ error: "Seul un compte révoqué peut être réactivé." });
    }

    let isAdmin = false;
    if (target.participant_id) {
      const participantResult = await client.query(
        `select id, can_admin from participants where id = $1 for update`,
        [target.participant_id],
      );
      isAdmin = Boolean(participantResult.rows[0]?.can_admin);
    }

    const updatedResult = await client.query(
      `
        update users
        set status = 'active',
            revoked_at = null,
            revoked_reason = null,
            role = case when $2 then 'admin' else 'user' end,
            is_admin = $2,
            receive_account_notifications = false
        where id = $1
        returning *
      `,
      [userId, isAdmin],
    );
    await client.query("commit");

    await writeAccessLog({
      userId,
      eventType: "account_reactivated",
      success: true,
      req,
      details: { by: actorEmail(req), isAdmin, participantId: target.participant_id || null },
    });

    return res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Réactivation du compte impossible :", error);
    return res.status(500).json({ error: "Réactivation du compte impossible" });
  } finally {
    client.release();
  }
}

/**
 * Modifie le droit Administrateur depuis Gestion des comptes tout en maintenant
 * exactement la même valeur sur la fiche participant. Une promotion exige une
 * fiche liée ; le corps doit contenir un véritable booléen.
 */
export async function updateAdminRightSafely(req, res) {
  const userId = Number(req.params?.id);
  const isAdmin = req.body?.isAdmin;
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Identifiant du compte invalide" });
  }
  if (typeof isAdmin !== "boolean") {
    return res.status(400).json({ error: "Le droit Administrateur doit être un booléen." });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const targetResult = await client.query(`select * from users where id = $1 for update`, [userId]);
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }

    if (isAdmin && !target.participant_id) {
      await client.query("rollback");
      return res.status(409).json({
        error: "Associez d’abord ce compte à une fiche participant avant de lui attribuer le droit Administrateur.",
      });
    }

    if (!isAdmin && target.status === "active" && isAdminAccount(target)) {
      const hasAnother = await hasAnotherActiveAdmin(client, userId);
      if (!hasAnother) {
        await client.query("rollback");
        return res.status(409).json({ error: "Impossible de retirer le dernier administrateur actif." });
      }
    }

    if (target.participant_id) {
      const participantResult = await client.query(
        `select id from participants where id = $1 for update`,
        [target.participant_id],
      );
      if (!participantResult.rowCount) {
        await client.query("rollback");
        return res.status(409).json({ error: "La fiche participant associée est introuvable." });
      }
      await client.query(
        `update participants set can_admin = $2, login_email = lower(trim($3)) where id = $1`,
        [target.participant_id, isAdmin, target.email],
      );
    }

    const updatedResult = await client.query(
      `
        update users
        set role = case when $2 then 'admin' else 'user' end,
            is_admin = $2,
            receive_account_notifications = case when $2 then receive_account_notifications else false end
        where id = $1
        returning *
      `,
      [userId, isAdmin],
    );
    await client.query("commit");

    await writeAccessLog({
      userId,
      eventType: "administrator_right_changed",
      success: true,
      req,
      details: { isAdmin, changedBy: actorEmail(req), participantId: target.participant_id || null },
    });

    return res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Modification du droit administrateur impossible :", error);
    return res.status(500).json({ error: "Modification du droit administrateur impossible" });
  } finally {
    client.release();
  }
}

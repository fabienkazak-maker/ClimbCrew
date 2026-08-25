import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { serializeUser } from "./user-serializer.js";
import { setUserParticipantAssociationWithAdminRight } from "./participant-admin-right-service.js";

/**
 * Complète l'association synchronisée : lorsqu'un compte est dissocié de toute
 * fiche, il ne conserve jamais un rôle administrateur orphelin. Pour une
 * association vers une fiche, le service principal applique le droit de la fiche.
 */
export async function setAccountParticipantAssociation(req, res) {
  const rawParticipantId = req.body?.participantId;
  const isDissociation = rawParticipantId === null
    || rawParticipantId === undefined
    || rawParticipantId === "";

  if (!isDissociation) {
    return setUserParticipantAssociationWithAdminRight(req, res);
  }

  const userId = Number(req.params?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Identifiant du compte invalide" });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const userResult = await client.query(`select * from users where id = $1 for update`, [userId]);
    const user = userResult.rows[0];
    if (!user) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }

    const isActiveAdmin = user.status === "active" && (user.role === "admin" || user.is_admin === true);
    if (isActiveAdmin) {
      const remaining = await client.query(
        `
          select count(*)::int as count
          from users
          where id <> $1
            and status = 'active'
            and (role = 'admin' or is_admin = true)
        `,
        [userId],
      );
      if (Number(remaining.rows[0]?.count || 0) < 1) {
        await client.query("rollback");
        return res.status(409).json({
          error: "Le dernier administrateur actif ne peut pas être dissocié de sa fiche.",
        });
      }
    }

    const updatedResult = await client.query(
      `
        update users
        set participant_id = null,
            role = 'user',
            is_admin = false,
            receive_account_notifications = false
        where id = $1
        returning *
      `,
      [userId],
    );
    await client.query("commit");

    await writeAccessLog({
      userId: req.auth?.user?.id || req.enhancementAuth?.user?.id || null,
      eventType: "account_participant_dissociated",
      success: true,
      req,
      details: {
        targetUserId: String(userId),
        removedAdminRight: Boolean(user.role === "admin" || user.is_admin === true),
      },
    });

    return res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Dissociation du compte impossible :", error);
    return res.status(500).json({ error: "Dissociation du compte impossible" });
  } finally {
    client.release();
  }
}

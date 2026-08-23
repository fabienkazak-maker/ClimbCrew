import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";

/**
 * Supprime une fiche participant seulement lorsqu'aucun compte utilisateur ne
 * lui est encore associé. Cela évite de créer silencieusement un compte actif
 * sans fiche et, en particulier, un administrateur orphelin.
 */
export async function deleteParticipantSafely(req, res) {
  const participantId = Number(req.params?.id);
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return res.status(400).json({ error: "Identifiant du grimpeur invalide" });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const participantResult = await client.query(
      `select id, nom, prenom from participants where id = $1 for update`,
      [participantId],
    );
    const participant = participantResult.rows[0];
    if (!participant) {
      await client.query("rollback");
      return res.status(404).json({ error: "Grimpeur introuvable" });
    }

    const linkedAccounts = await client.query(
      `select id, email, status, role, is_admin from users where participant_id = $1 order by id asc for update`,
      [participantId],
    );
    if (linkedAccounts.rowCount) {
      await client.query("rollback");
      return res.status(409).json({
        error: "Un compte utilisateur est encore associé à cette fiche. Dissociez ou supprimez d’abord le compte dans Gestion des comptes.",
        linkedAccountCount: linkedAccounts.rowCount,
      });
    }

    const inscriptionsResult = await client.query(
      `delete from session_participants where participant_id = $1`,
      [participantId],
    );
    await client.query(`update sessions set encadrant_id = null where encadrant_id = $1`, [participantId]);
    await client.query(`update sessions set referent_id = null where referent_id = $1`, [participantId]);

    // Le grimpeur supprimé peut être l'assureur d'une réalisation d'un autre
    // membre. Cette référence est nettoyée avant la suppression de ses propres
    // réalisations pour ne conserver aucun identifiant orphelin.
    const assurerReferencesResult = await client.query(
      `update realisations set assureur_id = null where assureur_id = $1`,
      [String(participantId)],
    );
    const realisationsResult = await client.query(
      `delete from realisations where participant_id = $1`,
      [participantId],
    );

    await client.query(`delete from participants where id = $1`, [participantId]);
    await client.query("commit");

    await writeAccessLog({
      userId: req.auth?.user?.id || req.enhancementAuth?.user?.id || null,
      eventType: "participant_deleted",
      success: true,
      req,
      details: {
        participantId: String(participantId),
        participantName: `${participant.prenom || ""} ${participant.nom || ""}`.trim(),
        deletedInscriptions: inscriptionsResult.rowCount,
        deletedRealisations: realisationsResult.rowCount,
        clearedAssurerReferences: assurerReferencesResult.rowCount,
      },
    });

    return res.json({
      ok: true,
      deletedInscriptions: inscriptionsResult.rowCount,
      deletedRealisations: realisationsResult.rowCount,
      clearedAssurerReferences: assurerReferencesResult.rowCount,
    });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Suppression du grimpeur impossible :", error);
    return res.status(500).json({ error: "Suppression du grimpeur impossible" });
  } finally {
    client.release();
  }
}

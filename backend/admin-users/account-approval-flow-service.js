import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { hashToken } from "./security.js";
import { serializeUser } from "./user-serializer.js";
import { notifyAccountRequestReviewers } from "./account-notification-preference-service.js";
import { sendApprovalNotificationEmail } from "./account-service.js";

/**
 * Valide la propriété de l'adresse e-mail sans activer automatiquement le compte.
 * L'association à une fiche grimpeur puis l'approbation restent des actions
 * administrateur explicites.
 */
export async function verifyEmailPendingAdminApproval(req, res) {
  const rawToken = String(req.query?.token || req.body?.token || "").trim();
  if (!rawToken) return res.status(400).send("Lien de confirmation invalide.");

  const tokenHash = hashToken(rawToken);
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const tokenResult = await client.query(
      `
        select evt.id, evt.user_id, evt.expires_at, evt.used_at,
               u.id as user_id, u.email, u.prenom, u.nom, u.status,
               u.email_verified_at, u.participant_id
        from email_verification_tokens evt
        join users u on u.id = evt.user_id
        where evt.token_hash = $1
        limit 1
        for update of evt
      `,
      [tokenHash],
    );

    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) {
      await client.query("rollback");
      return res.status(404).send("Ce lien de confirmation est introuvable ou a déjà été supprimé.");
    }

    if (tokenRow.used_at && tokenRow.status === "active") {
      await client.query("rollback");
      return res.status(200).send("Cette adresse e-mail a déjà été confirmée et le compte est actif.");
    }
    if (tokenRow.used_at && tokenRow.status === "pending") {
      await client.query("rollback");
      return res.status(200).send(
        "Cette adresse e-mail a déjà été confirmée. Le compte reste en attente d’association et d’approbation par un administrateur.",
      );
    }
    if (!tokenRow.used_at && new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      await client.query("rollback");
      return res.status(410).send("Ce lien de confirmation a expiré.");
    }

    if (!tokenRow.used_at) {
      await client.query(
        `update email_verification_tokens set used_at = now() where id = $1`,
        [tokenRow.id],
      );
    }

    // La vérification de l'e-mail ne crée, n'associe ni n'active de fiche.
    const verifiedUserResult = await client.query(
      `
        update users
        set email_verified_at = coalesce(email_verified_at, now())
        where id = $1
        returning id, participant_id, email, prenom, nom, role, is_admin,
                  status, approved_at, email_verified_at
      `,
      [tokenRow.user_id],
    );
    await client.query("commit");

    const verifiedUser = verifiedUserResult.rows[0];

    await writeAccessLog({
      userId: verifiedUser.id,
      eventType: "account_request_email_verified",
      req,
      details: {
        email: verifiedUser.email,
        status: verifiedUser.status,
        autoActivated: false,
        awaitingAdminApproval: verifiedUser.status === "pending",
        participantId: verifiedUser.participant_id ? String(verifiedUser.participant_id) : null,
        isAdmin: Boolean(verifiedUser.is_admin),
      },
    });

    if (verifiedUser.status === "pending") {
      try {
        await notifyAccountRequestReviewers({ user: verifiedUser, req });
      } catch (error) {
        console.error("Recherche des administrateurs à notifier impossible :", error);
        await writeAccessLog({
          userId: verifiedUser.id,
          eventType: "account_request_ready_admin_lookup_failed",
          success: false,
          req,
          details: { error: String(error.message || error) },
        });
      }
    }

    if (verifiedUser.status === "pending") {
      return res.status(200).send(
        "Adresse e-mail confirmée. Un administrateur doit maintenant associer le compte à une fiche grimpeur puis l’approuver.",
      );
    }

    return res.status(200).send("Adresse e-mail confirmée.");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Confirmation de l’adresse e-mail impossible :", {
      requestId: req.requestId || null,
      code: error?.code || null,
      message: error?.message || String(error),
      stack: error?.stack || null,
    });
    await writeAccessLog({
      userId: null,
      eventType: "account_request_email_verification_failed",
      success: false,
      req,
      details: {
        requestId: req.requestId || null,
        code: error?.code || null,
        error: String(error?.message || error),
      },
    });
    return res.status(500).send("La confirmation de l’adresse e-mail a échoué.");
  } finally {
    client.release();
  }
}

/**
 * Le contrôleur d'approbation reste disponible lorsque la politique manuelle est
 * réactivée ou pour régulariser exceptionnellement un compte resté `pending`.
 */
export async function approveVerifiedAccount(req, res) {
  const userId = Number(req.params?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Utilisateur invalide" });
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
    if (!target.email_verified_at) {
      await client.query("rollback");
      return res.status(409).json({
        error: "L’adresse e-mail doit être confirmée avant l’approbation du compte.",
      });
    }
    if (!target.participant_id) {
      await client.query("rollback");
      return res.status(409).json({
        error: "Associez d’abord ce compte à une fiche grimpeur avant de l’approuver.",
      });
    }
    if (target.status !== "pending") {
      await client.query("rollback");
      return res.status(409).json({
        error: target.status === "active"
          ? "Ce compte est déjà actif."
          : "Un compte révoqué doit être réactivé avec l’action dédiée.",
      });
    }

    const updatedResult = await client.query(
      `
        update users
        set status = 'active',
            approved_at = now(),
            revoked_at = null,
            revoked_reason = null
        where id = $1
        returning *
      `,
      [userId],
    );
    await client.query("commit");

    const updatedUser = updatedResult.rows[0];
    await writeAccessLog({
      userId,
      eventType: "account_approved",
      success: true,
      req,
      details: { by: req.auth?.user?.email || req.enhancementAuth?.user?.email || null },
    });

    await sendApprovalNotificationEmail({ user: updatedUser, req });
    return res.json({ ok: true, user: serializeUser(updatedUser) });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Approbation du compte impossible :", error);
    return res.status(500).json({ error: "Approbation du compte impossible" });
  } finally {
    client.release();
  }
}

import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { hashToken } from "./security.js";
import { requestAccessWithAssociations } from "./association-service.js";
import { notifyAccountRequestReviewers } from "./account-notification-preference-service.js";

/**
 * Conserve le contrôleur robuste d'inscription existant mais corrige le message
 * fonctionnel : la vérification de l'e-mail prouve la possession de l'adresse,
 * elle ne remplace pas l'approbation d'un administrateur du club.
 */
export async function requestAccessPendingAdminApproval(req, res) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload?.ok && payload?.user?.status === "pending") {
      const message = payload.emailSent
        ? "Demande d’accès enregistrée. Confirmez d’abord votre adresse avec l’e-mail reçu. Après cette confirmation, un administrateur devra approuver le compte avant la première connexion."
        : "Demande d’accès enregistrée, mais l’e-mail de confirmation n’a pas pu être envoyé. Le compte restera en attente tant que l’adresse n’aura pas été confirmée puis le compte approuvé par un administrateur.";
      return originalJson({ ...payload, message });
    }
    return originalJson(payload);
  };

  try {
    return await requestAccessWithAssociations(req, res);
  } finally {
    res.json = originalJson;
  }
}

/**
 * Valide uniquement la propriété de l'adresse e-mail.
 *
 * Le compte reste `pending` jusqu'à l'action explicite d'un administrateur via
 * la route d'approbation existante. Les demandes vérifiées sont ensuite visibles
 * dans Gestion des comptes et peuvent déclencher la notification opt-in.
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
               u.email, u.prenom, u.nom, u.status, u.email_verified_at
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
    if (tokenRow.used_at) {
      await client.query("rollback");
      return res.status(200).send(
        tokenRow.status === "active"
          ? "Cette adresse e-mail a déjà été confirmée et le compte est actif."
          : "Cette adresse e-mail a déjà été confirmée. Le compte reste en attente d’approbation par un administrateur.",
      );
    }
    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      await client.query("rollback");
      return res.status(410).send("Ce lien de confirmation a expiré.");
    }

    await client.query(
      `update email_verification_tokens set used_at = now() where id = $1`,
      [tokenRow.id],
    );
    const verifiedUserResult = await client.query(
      `
        update users
        set email_verified_at = coalesce(email_verified_at, now())
        where id = $1
        returning id, email, prenom, nom, status, approved_at, email_verified_at
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
        awaitingAdminApproval: verifiedUser.status === "pending",
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

      return res.status(200).send(
        "Adresse e-mail confirmée. Votre demande est maintenant en attente d’approbation par un administrateur.",
      );
    }

    return res.status(200).send("Adresse e-mail confirmée.");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Confirmation de l’adresse e-mail impossible :", error);
    return res.status(500).send("La confirmation de l’adresse e-mail a échoué.");
  } finally {
    client.release();
  }
}

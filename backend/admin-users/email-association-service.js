import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "./config.js";
import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { cleanEmail, hashToken, isStrongPassword } from "./security.js";
import { serializeUser } from "./user-serializer.js";
import { sendAccountRequestConfirmation } from "./email-service.js";

const EMAIL_VERIFICATION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function getPublicUrl() {
  return String(
    process.env.PUBLIC_URL || process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || "",
  ).split(",")[0].trim().replace(/\/$/, "");
}

function buildEmailVerificationUrl(rawToken) {
  const publicUrl = getPublicUrl();
  return publicUrl
    ? `${publicUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`
    : "";
}

function emailLogDetails(result, email) {
  return {
    email,
    delivered: Boolean(result?.sent),
    skipped: Boolean(result?.skipped),
    reason: result?.reason || null,
    messageId: result?.messageId || null,
  };
}

/**
 * Cherche une fiche grimpeur uniquement par l'adresse e-mail canonique.
 * Le prénom et le nom ne sont jamais utilisés comme clé automatique : ils sont
 * trop ambigus pour établir une relation d'identité entre un compte et une fiche.
 */
export async function findParticipantByEmailOnly(client, { email, userId = null }) {
  const normalizedEmail = cleanEmail(email);
  if (!normalizedEmail) {
    return { participantId: null, matchingKey: null, issue: "email_missing" };
  }

  const matches = await client.query(
    `
      select p.id,
             exists(
               select 1
               from users u
               where u.participant_id = p.id
                 and ($2::bigint is null or u.id <> $2::bigint)
             ) as already_linked
      from participants p
      where lower(trim(coalesce(p.login_email, p.email, ''))) = $1
      order by p.id asc
      limit 3
    `,
    [normalizedEmail, userId],
  );

  if (matches.rowCount === 1 && !matches.rows[0].already_linked) {
    return {
      participantId: String(matches.rows[0].id),
      matchingKey: "email",
      issue: null,
    };
  }
  if (matches.rowCount > 1) {
    return { participantId: null, matchingKey: null, issue: "email_ambiguous" };
  }
  if (matches.rowCount === 1 && matches.rows[0].already_linked) {
    return { participantId: null, matchingKey: null, issue: "email_already_linked" };
  }
  return { participantId: null, matchingKey: null, issue: "email_not_found" };
}

/**
 * Création de compte avec association automatique exclusivement par e-mail.
 * Une demande sans correspondance reste sans participant_id et devra être
 * associée manuellement par un administrateur avant approbation.
 */
export async function requestAccessByEmailOnly(req, res) {
  const prenom = String(req.body?.prenom || "").trim();
  const nom = String(req.body?.nom || "").trim();
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const acceptTerms = Boolean(req.body?.acceptTerms);

  if (!prenom || !nom || !email) {
    return res.status(400).json({ error: "Prénom, nom et email sont requis" });
  }
  if (!acceptTerms) {
    return res.status(400).json({ error: "Les conditions d’utilisation doivent être acceptées" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "Mot de passe insuffisamment robuste" });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");

    const existing = await client.query(
      `select id from users where lower(email) = $1 limit 1`,
      [email],
    );
    if (existing.rowCount) {
      await client.query("rollback");
      return res.status(409).json({ error: "Un compte existe déjà pour cet email" });
    }

    const match = await findParticipantByEmailOnly(client, { email });
    const participantId = match.participantId || null;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationToken = crypto.randomBytes(24).toString("hex");
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_DURATION_MS,
    ).toISOString();

    const userResult = await client.query(
      `
        insert into users (
          participant_id, email, prenom, nom, password_hash,
          role, is_admin, status
        ) values ($1, $2, $3, $4, $5, 'user', false, 'pending')
        returning *
      `,
      [participantId, email, prenom, nom, passwordHash],
    );
    const user = userResult.rows[0];

    if (participantId) {
      // L'association ne doit jamais retirer un droit Administrateur existant.
      await client.query(
        `update participants set login_email = $2 where id = $1`,
        [participantId, email],
      );
    }

    await client.query(
      `
        insert into email_verification_tokens (user_id, token_hash, expires_at)
        values ($1, $2, $3)
      `,
      [user.id, verificationTokenHash, verificationExpiresAt],
    );

    await client.query("commit");

    await writeAccessLog({
      userId: user.id,
      eventType: "request_access",
      req,
      details: {
        email,
        participantId: participantId ? String(participantId) : null,
        participantCreated: false,
        matchingKey: match.matchingKey,
        associationIssue: match.issue,
      },
    });

    let emailSent = false;
    try {
      const emailResult = await sendAccountRequestConfirmation({
        email,
        prenom,
        nom,
        verificationUrl: buildEmailVerificationUrl(verificationToken),
      });
      emailSent = Boolean(emailResult.sent);
      await writeAccessLog({
        userId: user.id,
        eventType: emailResult.sent
          ? "account_request_confirmation_email_sent"
          : "account_request_confirmation_email_skipped",
        success: Boolean(emailResult.sent || emailResult.skipped),
        req,
        details: {
          ...emailLogDetails(emailResult, email),
          verificationExpiresAt,
        },
      });
    } catch (error) {
      console.error("Envoi de la confirmation de création de compte impossible :", error);
      await writeAccessLog({
        userId: user.id,
        eventType: "account_request_confirmation_email_failed",
        success: false,
        req,
        details: { email, error: String(error.message || error) },
      });
    }

    return res.json({
      ok: true,
      message: emailSent
        ? "Demande d’accès enregistrée. Confirmez d’abord votre adresse avec l’e-mail reçu. Après cette confirmation, un administrateur devra associer la demande à une fiche si nécessaire puis approuver le compte."
        : "Demande d’accès enregistrée, mais l’e-mail de confirmation n’a pas pu être envoyé. Le compte restera en attente de confirmation et d’approbation administrateur.",
      user: serializeUser(user),
      participantCreated: false,
      association: {
        participantId: participantId ? String(participantId) : null,
        matchingKey: match.matchingKey,
        issue: match.issue,
      },
      emailSent,
    });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Création de compte impossible :", error);
    return res.status(500).json({ error: "Création de compte momentanément impossible" });
  } finally {
    client.release();
  }
}

/**
 * Rattrapage des comptes existants : même règle stricte, e-mail uniquement.
 * Le champ `byName` reste présent à 0 pour ne pas casser l'interface existante.
 */
export async function associateExistingAccountsByEmail(req, res) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const usersResult = await client.query(
      `
        select id, participant_id, email, prenom, nom, role, is_admin
        from users
        where participant_id is null
        order by id asc
        for update
      `,
    );

    const summary = {
      associatedCount: 0,
      byEmail: 0,
      byName: 0,
      ambiguousCount: 0,
      unavailableCount: 0,
      unmatchedCount: 0,
      associatedUserIds: [],
    };

    for (const user of usersResult.rows) {
      const match = await findParticipantByEmailOnly(client, {
        email: user.email,
        userId: user.id,
      });

      if (!match.participantId) {
        if (match.issue === "email_ambiguous") summary.ambiguousCount += 1;
        else if (match.issue === "email_already_linked") summary.unavailableCount += 1;
        else summary.unmatchedCount += 1;
        continue;
      }

      await client.query(
        `update users set participant_id = $2 where id = $1`,
        [user.id, match.participantId],
      );
      await client.query(
        `update participants set login_email = $2 where id = $1`,
        [match.participantId, cleanEmail(user.email)],
      );

      summary.associatedCount += 1;
      summary.byEmail += 1;
      summary.associatedUserIds.push(String(user.id));
    }

    await client.query("commit");

    await writeAccessLog({
      userId: req.auth?.user?.id || req.enhancementAuth?.user?.id || null,
      eventType: "account_associations_auto",
      success: true,
      req,
      details: summary,
    });

    return res.json({ ok: true, ...summary });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("Association automatique des comptes impossible :", error);
    return res.status(500).json({ error: "Association automatique impossible" });
  } finally {
    client.release();
  }
}

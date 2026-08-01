import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS, RESET_TOKEN_DURATION_MS } from "./config.js";
import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { cleanEmail, hashToken, isStrongPassword } from "./security.js";
import { serializeUser } from "./user-serializer.js";
import {
  sendAccountRequestConfirmation,
  sendPasswordResetCode,
} from "./email-service.js";

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
 * Associe un compte à un participant existant ou crée un participant minimal.
 * La transaction garantit qu'aucun compte ne reste orphelin en cas d'erreur.
 */
export async function requestAccess(req, res) {
  const prenom = String(req.body?.prenom || "").trim();
  const nom = String(req.body?.nom || "").trim();
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const acceptTerms = Boolean(req.body?.acceptTerms);

  if (!prenom || !nom || !email) return res.status(400).json({ error: "Prénom, nom et email sont requis" });
  if (!acceptTerms) return res.status(400).json({ error: "Les conditions d’utilisation doivent être acceptées" });
  if (!isStrongPassword(password)) return res.status(400).json({ error: "Mot de passe insuffisamment robuste" });

  const client = await getPool().connect();
  try {
    await client.query("begin");

    const existing = await client.query(`select id from users where lower(email) = $1 limit 1`, [email]);
    if (existing.rowCount) {
      await client.query("rollback");
      return res.status(409).json({ error: "Un compte existe déjà pour cet email" });
    }

    let participantResult = await client.query(
      `
        select id
        from participants
        where lower(trim(prenom)) = lower($1)
          and lower(trim(nom)) = lower($2)
        order by id asc
        limit 1
      `,
      [prenom, nom]
    );

    let participantId = participantResult.rows[0]?.id || null;
    let participantCreated = false;

    if (!participantId) {
      participantResult = await client.query(
        `
          insert into participants (
            nom, prenom, passport, cotisation, ffme,
            can_encadrer, can_referer, can_admin, login_email
          ) values ($1, $2, 'sans', false, false, false, false, false, $3)
          returning id
        `,
        [nom, prenom, email]
      );
      participantId = participantResult.rows[0].id;
      participantCreated = true;
    } else {
      await client.query(`update participants set login_email = $2 where id = $1`, [participantId, email]);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userResult = await client.query(
      `
        insert into users (
          participant_id, email, prenom, nom, password_hash,
          role, is_admin, status
        ) values ($1, $2, $3, $4, $5, 'user', false, 'pending')
        returning *
      `,
      [participantId, email, prenom, nom, passwordHash]
    );

    await client.query("commit");

    const user = userResult.rows[0];
    await writeAccessLog({
      userId: user.id,
      eventType: "request_access",
      req,
      details: { email, participantId: String(participantId), participantCreated },
    });

    let emailSent = false;
    try {
      const emailResult = await sendAccountRequestConfirmation({ email, prenom, nom });
      emailSent = Boolean(emailResult.sent);
      await writeAccessLog({
        userId: user.id,
        eventType: emailResult.sent
          ? "account_request_confirmation_email_sent"
          : "account_request_confirmation_email_skipped",
        success: Boolean(emailResult.sent || emailResult.skipped),
        req,
        details: emailLogDetails(emailResult, email),
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

    res.json({
      ok: true,
      message: emailSent
        ? "Demande d’accès enregistrée. Un e-mail de confirmation a été envoyé. Un administrateur doit maintenant approuver le compte."
        : "Demande d’accès enregistrée. Un administrateur doit l’approuver. La confirmation par e-mail n’a pas pu être envoyée.",
      user: serializeUser(user),
      participantCreated,
      emailSent,
    });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error.message || error) });
  } finally {
    client.release();
  }
}

/**
 * Génère un code temporaire et l'envoie par e-mail lorsque le compte est actif.
 * La réponse reste volontairement générique afin de ne pas révéler si une adresse existe.
 */
export async function forgotPassword(req, res) {
  const email = cleanEmail(req.body?.email);
  const genericMessage = "Si un compte actif correspond à cette adresse, un code de réinitialisation valable une heure a été envoyé par e-mail. Vérifie également les courriers indésirables.";

  if (!email) return res.status(400).json({ error: "Email requis" });

  try {
    const userResult = await getPool().query(
      `select id, email, prenom, nom, status from users where lower(email) = $1 limit 1`,
      [email]
    );
    const user = userResult.rows[0] || null;

    await writeAccessLog({
      userId: user?.id || null,
      eventType: "forgot_password_requested",
      req,
      details: { email },
    });

    if (!user || user.status !== "active") {
      return res.json({ ok: true, message: genericMessage });
    }

    const resetCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS).toISOString();
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("begin");
      await client.query(
        `update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null`,
        [user.id]
      );
      await client.query(
        `
          insert into password_reset_tokens (user_id, token_hash, expires_at)
          values ($1, $2, $3)
        `,
        [user.id, hashToken(resetCode), expiresAt]
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    try {
      const emailResult = await sendPasswordResetCode({
        email: user.email,
        prenom: user.prenom,
        code: resetCode,
        expiresAt,
      });

      if (!emailResult.sent) {
        await pool.query(
          `update password_reset_tokens set used_at = now() where user_id = $1 and token_hash = $2 and used_at is null`,
          [user.id, hashToken(resetCode)]
        );
      }

      await writeAccessLog({
        userId: user.id,
        eventType: emailResult.sent
          ? "password_reset_email_sent"
          : "password_reset_email_skipped",
        success: Boolean(emailResult.sent),
        req,
        details: {
          ...emailLogDetails(emailResult, email),
          expiresAt,
        },
      });
    } catch (error) {
      await pool.query(
        `update password_reset_tokens set used_at = now() where user_id = $1 and token_hash = $2 and used_at is null`,
        [user.id, hashToken(resetCode)]
      );
      console.error("Envoi du code de réinitialisation impossible :", error);
      await writeAccessLog({
        userId: user.id,
        eventType: "password_reset_email_failed",
        success: false,
        req,
        details: { email, expiresAt, error: String(error.message || error) },
      });
    }

    return res.json({ ok: true, message: genericMessage });
  } catch (error) {
    console.error("Traitement mot de passe perdu impossible :", error);
    return res.status(500).json({ error: "La demande de réinitialisation ne peut pas être traitée pour le moment" });
  }
}

/** Liste les comptes pour l'écran réservé aux administrateurs. */
export async function listUsers(_req, res) {
  try {
    const result = await getPool().query(`
      select id, participant_id, email, prenom, nom, role, is_admin, status,
             must_reset_password, created_at, approved_at, revoked_at,
             revoked_reason, last_login_at, theme_preference
      from users
      order by case status when 'pending' then 0 when 'active' then 1 when 'revoked' then 2 else 3 end,
               created_at desc, email asc
    `);
    res.json({ ok: true, users: result.rows.map(serializeUser) });
  } catch (error) {
    res.status(500).json({ error: String(error.message || error) });
  }
}

/**
 * Active ou retire le droit administrateur et synchronise le participant lié.
 * Une protection empêche la suppression du dernier administrateur actif.
 */
export async function updateAdminRight(req, res) {
  const userId = Number(req.params.id);
  const isAdmin = Boolean(req.body?.isAdmin);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: "Utilisateur invalide" });

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const targetResult = await client.query(`select * from users where id = $1 for update`, [userId]);
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }

    const targetIsActiveAdmin = target.status === "active" && (target.role === "admin" || target.is_admin);
    if (!isAdmin && targetIsActiveAdmin) {
      const otherAdmins = await client.query(
        `select count(*)::int as count from users where id <> $1 and status = 'active' and (role = 'admin' or is_admin = true)`,
        [userId]
      );
      if (otherAdmins.rows[0].count < 1) {
        await client.query("rollback");
        return res.status(409).json({ error: "Impossible de retirer le dernier administrateur actif" });
      }
    }

    const updatedResult = await client.query(
      `
        update users
        set is_admin = $2,
            role = case when $2 then 'admin' else 'user' end
        where id = $1
        returning *
      `,
      [userId, isAdmin]
    );

    if (target.participant_id) {
      await client.query(
        `update participants set can_admin = $2, login_email = $3 where id = $1`,
        [target.participant_id, isAdmin, target.email]
      );
    }

    await client.query("commit");

    await writeAccessLog({
      userId,
      eventType: "administrator_right_changed",
      req,
      details: { isAdmin, changedBy: req.enhancementAuth.user.email },
    });

    res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error.message || error) });
  } finally {
    client.release();
  }
}

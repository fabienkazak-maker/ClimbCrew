import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "./config.js";
import { getPool } from "./database.js";
import { writeAccessLog } from "./access-log-service.js";
import { cleanEmail, isStrongPassword } from "./security.js";
import { serializeUser } from "./user-serializer.js";

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

    await writeAccessLog({
      userId: userResult.rows[0].id,
      eventType: "request_access",
      req,
      details: { email, participantId: String(participantId), participantCreated },
    });

    res.json({
      ok: true,
      message: "Demande d’accès enregistrée. Un administrateur doit l’approuver.",
      user: serializeUser(userResult.rows[0]),
      participantCreated,
    });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error.message || error) });
  } finally {
    client.release();
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

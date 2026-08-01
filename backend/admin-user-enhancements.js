import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import express from "express";
import pg from "pg";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "climbcrew_session";
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "climbcrew_csrf";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || (process.env.NODE_ENV === "production" ? 12 : 10));
const INSTALL_FLAG = Symbol.for("climbcrew.adminUserEnhancements.installed");

const OriginalPool = pg.Pool;
let capturedPool = null;

// Capture la même connexion PostgreSQL que celle créée par server.js.
pg.Pool = class ClimbCrewCapturedPool extends OriginalPool {
  constructor(...args) {
    super(...args);
    capturedPool = this;
  }
};

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function constantTimeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue || ""));
  const right = Buffer.from(String(rightValue || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getSessionToken(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || parseCookies(req)[SESSION_COOKIE_NAME] || "";
}

function hashToken(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isStrongPassword(value) {
  return typeof value === "string"
    && value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function serializeUser(row) {
  return {
    id: String(row.id),
    participantId: row.participant_id ? String(row.participant_id) : null,
    email: row.email,
    prenom: row.prenom,
    nom: row.nom,
    role: row.role,
    isAdmin: Boolean(row.is_admin || row.role === "admin"),
    status: row.status,
    created_at: row.created_at,
    approved_at: row.approved_at,
    revoked_at: row.revoked_at,
    revoked_reason: row.revoked_reason,
    last_login_at: row.last_login_at,
    must_reset_password: row.must_reset_password,
    theme_preference: row.theme_preference || "auto",
  };
}

async function loadAuthenticatedUser(req) {
  if (!capturedPool) return null;
  const rawToken = getSessionToken(req);
  if (!rawToken) return null;

  const result = await capturedPool.query(
    `
      select u.*, us.id as session_id
      from user_sessions us
      join users u on u.id = us.user_id
      where us.token_hash = $1
        and us.revoked_at is null
        and us.expires_at > now()
        and u.status = 'active'
      limit 1
    `,
    [hashToken(rawToken)]
  );
  return result.rows[0] || null;
}

async function requireAdmin(req, res, next) {
  try {
    const user = await loadAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentification requise" });
    if (!(user.role === "admin" || user.is_admin)) {
      return res.status(403).json({ error: "Accès administrateur requis" });
    }

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrfCookie = parseCookies(req)[CSRF_COOKIE_NAME];
      const csrfHeader = req.headers["x-csrf-token"];
      if (!csrfCookie || !csrfHeader || !constantTimeEqual(csrfCookie, csrfHeader)) {
        return res.status(403).json({ error: "Protection CSRF : jeton absent ou invalide" });
      }
    }

    req.enhancementAuth = { user };
    next();
  } catch (error) {
    res.status(500).json({ error: "Erreur de vérification des droits administrateur" });
  }
}

async function installSchema() {
  if (!capturedPool) throw new Error("Connexion PostgreSQL ClimbCrew introuvable");
  await capturedPool.query(`alter table users add column if not exists is_admin boolean not null default false`);
  await capturedPool.query(`alter table participants add column if not exists login_email text`);
  await capturedPool.query(`update users set is_admin = (role = 'admin') where is_admin is distinct from (role = 'admin')`);
  await capturedPool.query(`
    update participants p
    set can_admin = (u.role = 'admin' or u.is_admin),
        login_email = u.email
    from users u
    where u.participant_id = p.id
  `);
}

async function enhancedRequestAccess(req, res) {
  const prenom = String(req.body?.prenom || "").trim();
  const nom = String(req.body?.nom || "").trim();
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const acceptTerms = Boolean(req.body?.acceptTerms);

  if (!prenom || !nom || !email) return res.status(400).json({ error: "Prénom, nom et email sont requis" });
  if (!acceptTerms) return res.status(400).json({ error: "Les conditions d’utilisation doivent être acceptées" });
  if (!isStrongPassword(password)) return res.status(400).json({ error: "Mot de passe insuffisamment robuste" });
  if (!capturedPool) return res.status(503).json({ error: "Base de données indisponible" });

  const client = await capturedPool.connect();
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

    await client.query(
      `
        insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
        values ($1, 'request_access', true, $2, $3, $4::jsonb)
      `,
      [
        userResult.rows[0].id,
        req.ip || null,
        req.headers["user-agent"] || null,
        JSON.stringify({ email, participantId: String(participantId), participantCreated }),
      ]
    );

    await client.query("commit");
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

async function listUsers(_req, res) {
  try {
    const result = await capturedPool.query(`
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

async function updateAdminRight(req, res) {
  const userId = Number(req.params.id);
  const isAdmin = Boolean(req.body?.isAdmin);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: "Utilisateur invalide" });

  const client = await capturedPool.connect();
  try {
    await client.query("begin");
    const targetResult = await client.query(`select * from users where id = $1 for update`, [userId]);
    const target = targetResult.rows[0];
    if (!target) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }

    if (!isAdmin) {
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

    await client.query(
      `
        insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
        values ($1, 'administrator_right_changed', true, $2, $3, $4::jsonb)
      `,
      [
        userId,
        req.ip || null,
        req.headers["user-agent"] || null,
        JSON.stringify({ isAdmin, changedBy: req.enhancementAuth.user.email }),
      ]
    );

    await client.query("commit");
    res.json({ ok: true, user: serializeUser(updatedResult.rows[0]) });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error.message || error) });
  } finally {
    client.release();
  }
}

async function exportAllData(_req, res) {
  try {
    const tableQueries = {
      participants: `select * from participants order by id`,
      users: `select id, participant_id, email, prenom, nom, role, is_admin, status, must_reset_password, created_at, approved_at, revoked_at, revoked_reason, last_login_at, theme_preference from users order by id`,
      sessions: `select * from sessions order by date, slot, id`,
      sessionParticipants: `select * from session_participants order by session_id, participant_id`,
      ropes: `select * from ropes order by numero_corde`,
      routes: `select * from routes order by numero_corde nulls last, numero_voie_unique`,
      realisations: `select * from realisations order by date_realisation, id`,
      accessLogs: `select id, user_id, event_type, success, ip_address, user_agent, details, created_at from access_logs order by created_at desc`,
    };

    const entries = await Promise.all(
      Object.entries(tableQueries).map(async ([key, query]) => [key, (await capturedPool.query(query)).rows])
    );
    const data = Object.fromEntries(entries);

    res.setHeader("Content-Disposition", `attachment; filename="climbcrew-export-complet-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
      ok: true,
      data: {
        exportedAt: new Date().toISOString(),
        version: "climbcrew-complete-export-v2",
        securityNotice: "Les mots de passe et jetons de session ne sont jamais exportés.",
        ...data,
      },
    });
  } catch (error) {
    res.status(500).json({ error: String(error.message || error) });
  }
}

function replaceLastHandler(originalMethod, app, path, handlers, replacement) {
  const middlewares = handlers.slice(0, -1);
  return originalMethod.call(app, path, ...middlewares, replacement);
}

const originalPost = express.application.post;
express.application.post = function patchedPost(path, ...handlers) {
  if (path === "/auth/request-access" && handlers.length) {
    return replaceLastHandler(originalPost, this, path, handlers, enhancedRequestAccess);
  }
  return originalPost.call(this, path, ...handlers);
};

const originalGet = express.application.get;
express.application.get = function patchedGet(path, ...handlers) {
  if (path === "/admin/auth/users" && handlers.length) {
    return originalGet.call(this, path, requireAdmin, listUsers);
  }
  if (path === "/admin/export-data" && handlers.length) {
    return originalGet.call(this, path, requireAdmin, exportAllData);
  }
  return originalGet.call(this, path, ...handlers);
};

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  const app = this;
  const startListening = async () => {
    await installSchema();
    if (!app[INSTALL_FLAG]) {
      app.post("/admin/auth/users/:id/admin", requireAdmin, updateAdminRight);
      app[INSTALL_FLAG] = true;
    }
    return originalListen.apply(app, args);
  };

  startListening().catch((error) => {
    console.error("Erreur d’installation des évolutions utilisateurs :", error);
    process.exitCode = 1;
  });
  return app;
};

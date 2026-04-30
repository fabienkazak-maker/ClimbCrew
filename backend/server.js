import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import { readFile } from "node:fs/promises";

const app = express();
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const PORT = Number(process.env.PORT || 3000);

const DEFAULT_ADMIN_EMAIL = "climbcrew@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "climbcrew*2026";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours
const RESET_TOKEN_DURATION_MS = 1000 * 60 * 60; // 1 heure

if (!DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

function nowPlus(ms) {
  return new Date(Date.now() + ms).toISOString();
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function randomToken(size = 24) {
  return crypto.randomBytes(size).toString("hex");
}

function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function firstLetter(value = "") {
  return String(value || "").trim().charAt(0).toUpperCase();
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
  if (!row) return null;
  return {
    id: String(row.id),
    participantId: row.participant_id ? String(row.participant_id) : null,
    email: row.email,
    prenom: row.prenom,
    nom: row.nom,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    approved_at: row.approved_at,
    revoked_at: row.revoked_at,
    revoked_reason: row.revoked_reason,
    last_login_at: row.last_login_at,
    must_reset_password: row.must_reset_password,
    theme_preference: row.theme_preference || 'auto',
  };
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || null;
}

async function logAccess({ userId = null, eventType, success = true, req, details = null }) {
  try {
    await pool.query(
      `
        insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
        values ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        userId,
        eventType,
        success,
        getClientIp(req),
        req?.headers?.["user-agent"] || null,
        details ? JSON.stringify(details) : null,
      ]
    );
  } catch (error) {
    console.error("logAccess error:", error);
  }
}

async function ensureSchema() {
  await pool.query(`
    create table if not exists participants (
      id bigserial primary key,
      nom text not null,
      prenom text not null,
      passport text not null default 'sans',
      cotisation boolean not null default false,
      ffme boolean not null default false,
      can_encadrer boolean not null default false,
      can_referer boolean not null default false,
      created_at timestamptz not null default now()
    );

    create table if not exists sessions (
      id text primary key,
      date text not null,
      slot text not null check (slot in ('midi', 'soir')),
      status text not null default 'fermee',
      encadrant_id text,
      referent_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists session_participants (
      session_id text not null references sessions(id) on delete cascade,
      participant_id text not null,
      created_at timestamptz not null default now(),
      primary key (session_id, participant_id)
    );

    create index if not exists idx_sessions_date on sessions(date);
    create index if not exists idx_session_participants_participant on session_participants(participant_id);

    create table if not exists users (
      id bigserial primary key,
      participant_id bigint references participants(id) on delete set null,
      email text unique not null,
      prenom text not null,
      nom text not null,
      password_hash text not null,
      role text not null default 'user',
      status text not null default 'pending',
      must_reset_password boolean not null default false,
      created_at timestamptz not null default now(),
      approved_at timestamptz,
      revoked_at timestamptz,
      revoked_reason text,
      last_login_at timestamptz
    );

    create index if not exists idx_users_email on users(lower(email));
    create index if not exists idx_users_status on users(status);

    create table if not exists user_sessions (
      id bigserial primary key,
      user_id bigint not null references users(id) on delete cascade,
      token_hash text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      revoked_at timestamptz,
      user_agent text,
      ip_address text
    );

    create index if not exists idx_user_sessions_user on user_sessions(user_id);
    create index if not exists idx_user_sessions_token_hash on user_sessions(token_hash);

    create table if not exists password_reset_tokens (
      id bigserial primary key,
      user_id bigint not null references users(id) on delete cascade,
      token_hash text not null,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      used_at timestamptz
    );

    create index if not exists idx_password_reset_tokens_user on password_reset_tokens(user_id);
    create index if not exists idx_password_reset_tokens_hash on password_reset_tokens(token_hash);

    create table if not exists access_logs (
      id bigserial primary key,
      user_id bigint references users(id) on delete set null,
      event_type text not null,
      success boolean not null default true,
      ip_address text,
      user_agent text,
      details jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_access_logs_created_at on access_logs(created_at desc);
    create index if not exists idx_access_logs_event_type on access_logs(event_type);
  `);

  await pool.query(`alter table users add column if not exists theme_preference text not null default 'auto'`);
}

async function ensureDefaultAdmin() {
  const email = cleanEmail(DEFAULT_ADMIN_EMAIL);
  const existing = await pool.query(`select * from users where lower(email) = $1 limit 1`, [email]);

  if (existing.rowCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await pool.query(
    `
      insert into users (email, prenom, nom, password_hash, role, status, approved_at)
      values ($1, $2, $3, $4, 'admin', 'active', now())
    `,
    [email, "ClimbCrew", "Admin", passwordHash]
  );

  console.log(`Compte administrateur par défaut créé : ${DEFAULT_ADMIN_EMAIL}`);
}

async function findParticipantId(prenom, nom) {
  const result = await pool.query(
    `
      select id
      from participants
      where lower(prenom) = lower($1)
        and lower(nom) = lower($2)
      limit 1
    `,
    [String(prenom || "").trim(), firstLetter(nom)]
  );

  return result.rows[0]?.id || null;
}

async function loadSessionFromToken(rawToken) {
  const tokenHash = hashToken(rawToken);

  const result = await pool.query(
    `
      select
        us.id as session_id,
        us.user_id,
        us.expires_at,
        us.revoked_at,
        u.id,
        u.participant_id,
        u.email,
        u.prenom,
        u.nom,
        u.role,
        u.status,
        u.created_at,
        u.approved_at,
        u.revoked_at as user_revoked_at,
        u.revoked_reason,
        u.last_login_at,
        u.must_reset_password,
        u.theme_preference
      from user_sessions us
      join users u on u.id = us.user_id
      where us.token_hash = $1
        and us.revoked_at is null
        and us.expires_at > now()
      limit 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const rawToken = match?.[1];

  if (!rawToken) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const session = await loadSessionFromToken(rawToken);

  if (!session || session.status !== "active") {
    return res.status(401).json({ error: "Session invalide ou compte non actif" });
  }

  req.auth = {
    token: rawToken,
    sessionId: session.session_id,
    user: serializeUser(session),
  };

  next();
}

function requireAdmin(req, res, next) {
  if (req.auth?.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès administrateur requis" });
  }
  next();
}

function participantDbToApi(row) {
  return {
    id: String(row.id),
    nom: row.nom,
    prenom: row.prenom,
    passport: row.passport,
    cotisation: row.cotisation,
    ffme: row.ffme,
    canEncadrer: row.can_encadrer,
    canReferer: row.can_referer,
  };
}

function sessionDbToApi(row, participantIds = []) {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    status: row.status,
    encadrantId: row.encadrant_id ? String(row.encadrant_id) : null,
    referentId: row.referent_id ? String(row.referent_id) : null,
    participantIds: participantIds.map(String),
  };
}

app.get("/", (_req, res) => {
  res.send("ClimbCrew API running");
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

app.get("/setup-db", async (_req, res) => {
  try {
    await ensureSchema();
    await ensureDefaultAdmin();
    res.json({
      ok: true,
      message: "Schéma et compte par défaut prêts",
      defaultAdminEmail: DEFAULT_ADMIN_EMAIL,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

app.get("/db-status", async (_req, res) => {
  try {
    const result = await pool.query(`
      select
        current_database() as database,
        to_regclass('public.participants') as participants,
        to_regclass('public.sessions') as sessions,
        to_regclass('public.session_participants') as session_participants,
        to_regclass('public.users') as users,
        to_regclass('public.user_sessions') as user_sessions,
        to_regclass('public.password_reset_tokens') as password_reset_tokens,
        to_regclass('public.access_logs') as access_logs
    `);

    res.json({ ok: true, ...result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

/**
 * Auth
 */
app.post("/auth/login", async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || "");

  try {
    const result = await pool.query(`select * from users where lower(email) = $1 limit 1`, [email]);
    const user = result.rows[0];

    if (!user) {
      await logAccess({
        userId: null,
        eventType: "login_failed",
        success: false,
        req,
        details: { email, reason: "unknown_email" },
      });
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    if (user.status !== "active") {
      await logAccess({
        userId: user.id,
        eventType: "login_blocked",
        success: false,
        req,
        details: { email, status: user.status },
      });
      return res.status(403).json({ error: `Compte ${user.status}` });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAccess({
        userId: user.id,
        eventType: "login_failed",
        success: false,
        req,
        details: { email, reason: "bad_password" },
      });
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const rawToken = randomToken(32);
    const expiresAt = nowPlus(SESSION_DURATION_MS);

    await pool.query(
      `
        insert into user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
        values ($1, $2, $3, $4, $5)
      `,
      [user.id, hashToken(rawToken), expiresAt, req.headers["user-agent"] || null, getClientIp(req)]
    );

    const updatedUserResult = await pool.query(
      `update users set last_login_at = now() where id = $1 returning *`,
      [user.id]
    );

    await logAccess({
      userId: user.id,
      eventType: "login_success",
      success: true,
      req,
      details: { email },
    });

    res.json({
      ok: true,
      token: rawToken,
      user: serializeUser(updatedUserResult.rows[0]),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get("/auth/me", requireAuth, async (req, res) => {
  res.json({ ok: true, user: req.auth.user });
});


app.put("/auth/theme", requireAuth, async (req, res) => {
  const nextTheme = String(req.body?.theme_preference || "auto").trim().toLowerCase();
  const allowed = new Set(["auto", "light", "dark"]);

  if (!allowed.has(nextTheme)) {
    return res.status(400).json({ error: "Préférence de thème invalide" });
  }

  try {
    const result = await pool.query(
      `
        update users
        set theme_preference = $2
        where id = $1
        returning *
      `,
      [req.auth.user.id, nextTheme]
    );

    const user = serializeUser(result.rows[0]);

    await logAccess({
      userId: req.auth.user.id,
      eventType: "theme_changed",
      success: true,
      req,
      details: { theme_preference: nextTheme },
    });

    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    await pool.query(`update user_sessions set revoked_at = now() where id = $1`, [req.auth.sessionId]);

    await logAccess({
      userId: req.auth.user.id,
      eventType: "logout",
      success: true,
      req,
      details: { email: req.auth.user.email },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/auth/request-access", async (req, res) => {
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

  try {
    const existing = await pool.query(`select id from users where lower(email) = $1`, [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Un compte existe déjà pour cet email" });
    }

    const participantId = await findParticipantId(prenom, nom);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
        insert into users (participant_id, email, prenom, nom, password_hash, role, status)
        values ($1, $2, $3, $4, $5, 'user', 'pending')
        returning *
      `,
      [participantId, email, prenom, nom, passwordHash]
    );

    await logAccess({
      userId: result.rows[0].id,
      eventType: "request_access",
      success: true,
      req,
      details: { email, participantId },
    });

    res.json({
      ok: true,
      message: "Demande d’accès enregistrée. Un administrateur doit l’approuver.",
      user: serializeUser(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  const email = cleanEmail(req.body?.email);

  try {
    const result = await pool.query(`select id, email from users where lower(email) = $1 limit 1`, [email]);
    const user = result.rows[0] || null;

    await logAccess({
      userId: user?.id || null,
      eventType: "forgot_password_requested",
      success: true,
      req,
      details: { email },
    });

    res.json({
      ok: true,
      message: "La demande a été enregistrée. Un administrateur peut désormais générer un code de réinitialisation.",
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const rawToken = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");

  if (!email || !rawToken || !password) {
    return res.status(400).json({ error: "Email, code et nouveau mot de passe sont requis" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "Mot de passe insuffisamment robuste" });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const userResult = await client.query(`select * from users where lower(email) = $1 limit 1`, [email]);
    const user = userResult.rows[0];

    if (!user) {
      await client.query("rollback");
      return res.status(404).json({ error: "Compte introuvable" });
    }

    const tokenHash = hashToken(rawToken);
    const tokenResult = await client.query(
      `
        select *
        from password_reset_tokens
        where user_id = $1
          and token_hash = $2
          and used_at is null
          and expires_at > now()
        limit 1
      `,
      [user.id, tokenHash]
    );

    const resetToken = tokenResult.rows[0];
    if (!resetToken) {
      await client.query("rollback");
      return res.status(400).json({ error: "Code de réinitialisation invalide ou expiré" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      `
        update users
        set password_hash = $2,
            must_reset_password = false
        where id = $1
      `,
      [user.id, passwordHash]
    );

    await client.query(
      `update password_reset_tokens set used_at = now() where id = $1`,
      [resetToken.id]
    );

    await client.query(
      `update user_sessions set revoked_at = now() where user_id = $1 and revoked_at is null`,
      [user.id]
    );

    await client.query("commit");

    await logAccess({
      userId: user.id,
      eventType: "password_reset_completed",
      success: true,
      req,
      details: { email },
    });

    res.json({
      ok: true,
      message: "Mot de passe réinitialisé. Tu peux te reconnecter.",
    });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error) });
  } finally {
    client.release();
  }
});

/**
 * Admin auth
 */
app.get("/admin/auth/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `
        select id, participant_id, email, prenom, nom, role, status, must_reset_password, created_at, approved_at, revoked_at, revoked_reason, last_login_at
        from users
        order by
          case status
            when 'pending' then 0
            when 'active' then 1
            when 'revoked' then 2
            else 3
          end,
          created_at desc,
          email asc
      `
    );

    res.json({ ok: true, users: result.rows.map(serializeUser) });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get("/admin/auth/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 500);
    const result = await pool.query(
      `
        select
          al.id,
          al.event_type,
          al.success,
          al.ip_address,
          al.user_agent,
          al.created_at,
          al.details,
          coalesce(u.email, al.details->>'email') as email,
          coalesce(al.details::text, '') as details_text
        from access_logs al
        left join users u on u.id = al.user_id
        order by al.created_at desc
        limit $1
      `,
      [limit]
    );

    res.json({ ok: true, logs: result.rows });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/admin/auth/users/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const result = await pool.query(
      `
        update users
        set status = 'active',
            approved_at = now(),
            revoked_at = null,
            revoked_reason = null
        where id = $1
        returning *
      `,
      [userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    await logAccess({
      userId,
      eventType: "account_approved",
      success: true,
      req,
      details: { by: req.auth.user.email },
    });

    res.json({ ok: true, user: serializeUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/admin/auth/users/:id/revoke", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const reason = String(req.body?.reason || "Révocation administrateur");

    const result = await pool.query(
      `
        update users
        set status = 'revoked',
            revoked_at = now(),
            revoked_reason = $2
        where id = $1
        returning *
      `,
      [userId, reason]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    await pool.query(`update user_sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [userId]);

    await logAccess({
      userId,
      eventType: "account_revoked",
      success: true,
      req,
      details: { by: req.auth.user.email, reason },
    });

    res.json({ ok: true, user: serializeUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/admin/auth/users/:id/reactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const result = await pool.query(
      `
        update users
        set status = 'active',
            revoked_at = null,
            revoked_reason = null
        where id = $1
        returning *
      `,
      [userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    await logAccess({
      userId,
      eventType: "account_reactivated",
      success: true,
      req,
      details: { by: req.auth.user.email },
    });

    res.json({ ok: true, user: serializeUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/admin/auth/users/:id/reset-token", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const userResult = await pool.query(`select id, email from users where id = $1`, [userId]);

    if (!userResult.rowCount) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    const rawToken = randomToken(4).toUpperCase();
    const expiresAt = nowPlus(RESET_TOKEN_DURATION_MS);

    await pool.query(
      `
        insert into password_reset_tokens (user_id, token_hash, expires_at)
        values ($1, $2, $3)
      `,
      [userId, hashToken(rawToken), expiresAt]
    );

    await logAccess({
      userId,
      eventType: "password_reset_token_generated",
      success: true,
      req,
      details: { by: req.auth.user.email, expiresAt },
    });

    res.json({
      ok: true,
      resetToken: rawToken,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Participants
 */
app.get("/participants", async (_req, res) => {
  try {
    const result = await pool.query(`
      select id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer
      from participants
      order by prenom asc, nom asc
    `);
    res.json(result.rows.map(participantDbToApi));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post("/participants", async (req, res) => {
  try {
    const {
      nom = "",
      prenom = "",
      passport = "sans",
      cotisation = false,
      ffme = false,
      canEncadrer = false,
      canReferer = false,
    } = req.body || {};

    if (!nom || !prenom) {
      return res.status(400).json({ error: "nom and prenom are required" });
    }

    const result = await pool.query(
      `
        insert into participants
        (nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer)
        values ($1,$2,$3,$4,$5,$6,$7)
        returning id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer
      `,
      [nom, prenom, passport, cotisation, ffme, canEncadrer, canReferer]
    );

    res.status(201).json(participantDbToApi(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put("/participants/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      nom = "",
      prenom = "",
      passport = "sans",
      cotisation = false,
      ffme = false,
      canEncadrer = false,
      canReferer = false,
    } = req.body || {};

    const result = await pool.query(
      `
        update participants
        set nom = $2,
            prenom = $3,
            passport = $4,
            cotisation = $5,
            ffme = $6,
            can_encadrer = $7,
            can_referer = $8
        where id = $1
        returning id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer
      `,
      [id, nom, prenom, passport, cotisation, ffme, canEncadrer, canReferer]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "participant not found" });
    }

    res.json(participantDbToApi(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete("/participants/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("delete from participants where id = $1", [id]);

    if (!result.rowCount) {
      return res.status(404).json({ error: "participant not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Sessions + inscriptions
 */
app.get("/sessions", async (_req, res) => {
  try {
    const sessionsResult = await pool.query(`
      select id, date, slot, status, encadrant_id, referent_id
      from sessions
      order by date asc, slot asc
    `);

    const inscriptionsResult = await pool.query(`
      select session_id, participant_id
      from session_participants
      order by session_id asc
    `);

    const participantIdsBySession = new Map();

    for (const inscription of inscriptionsResult.rows) {
      const list = participantIdsBySession.get(inscription.session_id) || [];
      list.push(String(inscription.participant_id));
      participantIdsBySession.set(inscription.session_id, list);
    }

    const sessions = sessionsResult.rows.map((session) =>
      sessionDbToApi(session, participantIdsBySession.get(session.id) || [])
    );

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put("/sessions/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      date,
      slot,
      status = "fermee",
      encadrantId = null,
      referentId = null,
      participantIds = [],
    } = req.body || {};

    if (!id || !date || !slot) {
      return res.status(400).json({ error: "id, date and slot are required" });
    }

    await client.query("begin");

    const sessionResult = await client.query(
      `
        insert into sessions (id, date, slot, status, encadrant_id, referent_id)
        values ($1,$2,$3,$4,$5,$6)
        on conflict (id) do update set
          date = excluded.date,
          slot = excluded.slot,
          status = excluded.status,
          encadrant_id = excluded.encadrant_id,
          referent_id = excluded.referent_id,
          updated_at = now()
        returning id, date, slot, status, encadrant_id, referent_id
      `,
      [id, date, slot, status, encadrantId || null, referentId || null]
    );

    await client.query("delete from session_participants where session_id = $1", [id]);

    const uniqueParticipantIds = [...new Set(participantIds.map(String))];

    for (const participantId of uniqueParticipantIds) {
      await client.query(
        `
          insert into session_participants (session_id, participant_id)
          values ($1,$2)
          on conflict do nothing
        `,
        [id, participantId]
      );
    }

    await client.query("commit");

    res.json(sessionDbToApi(sessionResult.rows[0], uniqueParticipantIds));
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error) });
  } finally {
    client.release();
  }
});

app.delete("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("delete from sessions where id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Import des données transformées, si le fichier existe.
 */
app.get("/import-data", async (req, res) => {
  const importFilePath = new URL("./import-data.json", import.meta.url);
  if (!fs.existsSync(importFilePath)) {
    return res.status(404).json({ error: "import-data.json introuvable dans backend/" });
  }

  if (req.query.confirm !== "oui") {
    return res.status(400).json({ ok: false, error: "Ajoute ?confirm=oui pour confirmer l'import." });
  }

  const client = await pool.connect();

  try {
    const payload = JSON.parse(await readFile(importFilePath, "utf-8"));
    await client.query("begin");

    await client.query("delete from session_participants");
    await client.query("delete from sessions");
    await client.query("delete from participants");

    const participantIdMap = new Map();

    for (const participant of payload.participants || []) {
      const result = await client.query(
        `
          insert into participants
          (nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer)
          values ($1,$2,$3,$4,$5,$6,$7)
          returning id
        `,
        [
          participant.nom,
          participant.prenom,
          participant.passport || "sans",
          Boolean(participant.cotisation),
          Boolean(participant.ffme),
          Boolean(participant.canEncadrer),
          Boolean(participant.canReferer),
        ]
      );

      participantIdMap.set(String(participant.id), String(result.rows[0].id));
    }

    for (const session of payload.sessions || []) {
      const mappedEncadrantId = session.encadrantId
        ? participantIdMap.get(String(session.encadrantId)) || null
        : null;

      const mappedReferentId = session.referentId
        ? participantIdMap.get(String(session.referentId)) || null
        : null;

      await client.query(
        `
          insert into sessions (id, date, slot, status, encadrant_id, referent_id)
          values ($1,$2,$3,$4,$5,$6)
          on conflict (id) do update set
            date = excluded.date,
            slot = excluded.slot,
            status = excluded.status,
            encadrant_id = excluded.encadrant_id,
            referent_id = excluded.referent_id,
            updated_at = now()
        `,
        [session.id, session.date, session.slot, session.status || "fermee", mappedEncadrantId, mappedReferentId]
      );

      const uniqueParticipantIds = [
        ...new Set((session.participantIds || []).map((id) => participantIdMap.get(String(id))).filter(Boolean)),
      ];

      for (const mappedParticipantId of uniqueParticipantIds) {
        await client.query(
          `
            insert into session_participants (session_id, participant_id)
            values ($1,$2)
            on conflict do nothing
          `,
          [session.id, mappedParticipantId]
        );
      }
    }

    await client.query("commit");

    res.json({
      ok: true,
      message: "Import terminé",
      participantsImported: payload.participants?.length || 0,
      sessionsImported: payload.sessions?.length || 0,
      note: "Les voies / cordes restent dans import-data.json tant que leurs tables backend ne sont pas ajoutées.",
    });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ error: String(error) });
  } finally {
    client.release();
  }
});

async function start() {
  await ensureSchema();
  await ensureDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`ClimbCrew API listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Erreur au démarrage :", error);
  process.exit(1);
});

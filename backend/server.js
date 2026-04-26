import express from "express";
import cors from "cors";
import pg from "pg";
import fs from "node:fs/promises";

const app = express();
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const PORT = process.env.PORT || 3000;

const SETUP_TOKEN = process.env.SETUP_TOKEN || "";
const IMPORT_TOKEN = process.env.IMPORT_TOKEN || "";

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

app.get("/setup-db", async (req, res) => {
  try {
    if (SETUP_TOKEN && req.query.token !== SETUP_TOKEN) {
      return res.status(403).json({ ok: false, error: "Invalid setup token" });
    }

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

      create index if not exists idx_sessions_date
      on sessions(date);

      create index if not exists idx_session_participants_participant
      on session_participants(participant_id);
    `);

    res.json({
      ok: true,
      message: "Tables ClimbCrew créées ou déjà existantes",
      tables: ["participants", "sessions", "session_participants"],
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
        to_regclass('public.session_participants') as session_participants
    `);

    res.json({ ok: true, ...result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

/**
 * Import temporaire des données transformées depuis les fichiers Excel.
 *
 * URL :
 * /import-data?confirm=oui
 *
 * Si IMPORT_TOKEN est défini dans Render :
 * /import-data?confirm=oui&token=TON_TOKEN
 *
 * Cette route vide puis recharge :
 * - participants
 * - sessions
 * - session_participants
 */
app.get("/import-data", async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.query.confirm !== "oui") {
      return res.status(400).json({
        ok: false,
        error: "Ajoute ?confirm=oui pour confirmer l'import.",
      });
    }

    if (IMPORT_TOKEN && req.query.token !== IMPORT_TOKEN) {
      return res.status(403).json({ ok: false, error: "Invalid import token" });
    }

    const payload = JSON.parse(
      await fs.readFile(new URL("./import-data.json", import.meta.url), "utf-8")
    );

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
        [
          session.id,
          session.date,
          session.slot,
          session.status || "fermee",
          mappedEncadrantId,
          mappedReferentId,
        ]
      );

      const uniqueParticipantIds = [
        ...new Set(
          (session.participantIds || [])
            .map((id) => participantIdMap.get(String(id)))
            .filter(Boolean)
        ),
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
      sourceFiles: payload.metadata?.sourceFiles || [],
      participantsImported: payload.participants?.length || 0,
      sessionsImported: payload.sessions?.length || 0,
      routesInJsonButNotImportedYet: payload.routes?.length || 0,
      note: "Les ids p1/p2/... ont été convertis vers les ids numériques PostgreSQL. Les voies/cordes sont dans import-data.json mais pas encore persistées en base.",
    });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ ok: false, error: String(error) });
  } finally {
    client.release();
  }
});

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

app.listen(PORT, () => {
  console.log(`ClimbCrew API listening on port ${PORT}`);
});

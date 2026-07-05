import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL est obligatoire pour initialiser ClimbCrew.");
  process.exit(1);
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ALLOW_LOCAL_SEED_IN_PRODUCTION = String(process.env.ALLOW_LOCAL_SEED_IN_PRODUCTION || "false").toLowerCase() === "true";
const ALLOW_WEAK_DEV_ADMIN = !IS_PRODUCTION || String(process.env.ALLOW_WEAK_FIRST_ADMIN_PASSWORD || "false").toLowerCase() === "true";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: String(process.env.PG_SSL || "false").toLowerCase() === "true"
    ? { rejectUnauthorized: String(process.env.PG_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false" }
    : false,
});

function isStrongPassword(value) {
  return typeof value === "string"
    && value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

async function waitForDatabase(retries = 60) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("select 1");
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`PostgreSQL pas encore prêt (${attempt}/${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function applySchema() {
  const schemaUrl = new URL("./schema.sql", import.meta.url);
  const schema = await readFile(schemaUrl, "utf-8");
  await pool.query(schema);
  console.log("Schéma ClimbCrew vérifié.");
}

async function seedAdmin() {
  const defaultEnabled = IS_PRODUCTION ? "false" : "true";
  const enabled = String(process.env.DEV_ADMIN_ENABLED || defaultEnabled).toLowerCase() === "true";
  if (!enabled) return;
  if (IS_PRODUCTION && !ALLOW_LOCAL_SEED_IN_PRODUCTION) {
    console.log("Seed admin local désactivé en production.");
    return;
  }

  const email = cleanEmail(process.env.DEV_ADMIN_EMAIL || process.env.FIRST_ADMIN_EMAIL || "admin@test.local");
  const password = String(process.env.DEV_ADMIN_PASSWORD || process.env.FIRST_ADMIN_PASSWORD || "admin");
  if (!ALLOW_WEAK_DEV_ADMIN && !isStrongPassword(password)) {
    throw new Error("Mot de passe admin local trop faible pour cet environnement.");
  }
  const rounds = Number(process.env.BCRYPT_ROUNDS || (IS_PRODUCTION ? 12 : 10));
  const hash = await bcrypt.hash(password, rounds);

  await pool.query(
    `insert into users (email, prenom, nom, password_hash, role, status, approved_at, must_reset_password)
     values ($1, 'Admin', 'Test', $2, 'admin', 'active', now(), false)
     on conflict (email) do update set
       password_hash = excluded.password_hash,
       role = 'admin',
       status = 'active',
       approved_at = coalesce(users.approved_at, now()),
       revoked_at = null,
       revoked_reason = null,
       must_reset_password = false`,
    [email, hash]
  );

  console.log(`Compte admin local prêt : ${email}`);
}

async function importDataIfNeeded() {
  const defaultMode = IS_PRODUCTION ? "false" : "true";
  const mode = String(process.env.AUTO_IMPORT_DATA || defaultMode).toLowerCase();
  if (!["true", "1", "yes", "force"].includes(mode)) return;
  if (IS_PRODUCTION && !ALLOW_LOCAL_SEED_IN_PRODUCTION) {
    console.log("Import automatique désactivé en production.");
    return;
  }

  const count = await pool.query("select count(*)::int as count from participants");
  if (mode !== "force" && Number(count.rows[0].count) > 0) {
    console.log("Données déjà présentes : import initial ignoré.");
    return;
  }

  const importFileUrl = new URL("./import-data.json", import.meta.url);
  if (!existsSync(importFileUrl)) {
    console.log("Aucun import-data.json trouvé : import ignoré.");
    return;
  }

  const payload = JSON.parse(await readFile(importFileUrl, "utf-8"));
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query("delete from session_participants");
    await client.query("delete from sessions");
    await client.query("delete from realisations");
    await client.query("delete from routes");
    await client.query("delete from ropes");
    await client.query("delete from participants");

    for (const rope of payload.ropes || []) {
      await client.query(
        `insert into ropes (numero_corde, actif, couleur_corde)
         values ($1,$2,$3)
         on conflict (numero_corde) do update set
           actif = excluded.actif,
           couleur_corde = excluded.couleur_corde,
           updated_at = now()`,
        [Number(rope.numeroCorde), rope.actif !== false, String(rope.couleurCorde || "")]
      );
    }

    const participantIdMap = new Map();
    for (const participant of payload.participants || []) {
      const result = await client.query(
        `insert into participants
         (nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning id`,
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

    for (const route of payload.routes || []) {
      await client.query(
        `insert into routes (
           id, numero_voie_unique, numero_corde, couleur_prises, cotation_reference,
           cotation_ajustee, nom_voie, nom_ouvreur, moulinette_only, active, date_creation
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set
           numero_voie_unique = excluded.numero_voie_unique,
           numero_corde = excluded.numero_corde,
           couleur_prises = excluded.couleur_prises,
           cotation_reference = excluded.cotation_reference,
           cotation_ajustee = excluded.cotation_ajustee,
           nom_voie = excluded.nom_voie,
           nom_ouvreur = excluded.nom_ouvreur,
           moulinette_only = excluded.moulinette_only,
           active = excluded.active,
           date_creation = excluded.date_creation,
           updated_at = now()`,
        [
          route.id,
          route.numeroVoieUnique,
          Number(route.numeroCorde) || null,
          route.couleurPrises || "",
          route.cotationReference || "",
          route.cotationAjustee || route.cotationReference || "",
          route.nomVoie || "",
          route.nomOuvreur || "",
          Boolean(route.moulinetteOnly),
          route.active !== false,
          route.dateCreation || "",
        ]
      );
    }

    for (const session of payload.sessions || []) {
      const mappedEncadrantId = session.encadrantId ? participantIdMap.get(String(session.encadrantId)) || null : null;
      const mappedReferentId = session.referentId ? participantIdMap.get(String(session.referentId)) || null : null;

      await client.query(
        `insert into sessions (id, date, slot, status, encadrant_id, referent_id)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (id) do update set
           date = excluded.date,
           slot = excluded.slot,
           status = excluded.status,
           encadrant_id = excluded.encadrant_id,
           referent_id = excluded.referent_id,
           updated_at = now()`,
        [session.id, session.date, session.slot, session.status || "fermee", mappedEncadrantId, mappedReferentId]
      );

      const uniqueParticipantIds = [
        ...new Set((session.participantIds || []).map((id) => participantIdMap.get(String(id))).filter(Boolean)),
      ];

      for (const mappedParticipantId of uniqueParticipantIds) {
        await client.query(
          `insert into session_participants (session_id, participant_id)
           values ($1,$2)
           on conflict do nothing`,
          [session.id, mappedParticipantId]
        );
      }
    }

    for (const realisation of payload.realisations || []) {
      const mappedParticipantId = participantIdMap.get(String(realisation.participantId));
      if (!mappedParticipantId) continue;
      await client.query(
        `insert into realisations (
           id, participant_id, session_id, voie_id, date_realisation, style_realisation,
           commentaire, cotation_proposee, nb_essais
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set
           participant_id = excluded.participant_id,
           session_id = excluded.session_id,
           voie_id = excluded.voie_id,
           date_realisation = excluded.date_realisation,
           style_realisation = excluded.style_realisation,
           commentaire = excluded.commentaire,
           cotation_proposee = excluded.cotation_proposee,
           nb_essais = excluded.nb_essais,
           updated_at = now()`,
        [
          realisation.id,
          mappedParticipantId,
          realisation.sessionId,
          realisation.voieId,
          realisation.dateRealisation,
          realisation.styleRealisation,
          realisation.commentaire || "",
          realisation.cotationProposee || "",
          realisation.nbEssais || "",
        ]
      );
    }

    await client.query("commit");
    console.log(`Import initial terminé : ${payload.participants?.length || 0} participants, ${payload.sessions?.length || 0} séances, ${payload.routes?.length || 0} voies.`);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  await waitForDatabase();
  await applySchema();
  await seedAdmin();
  await importDataIfNeeded();
}

main()
  .catch((error) => {
    console.error("Erreur initialisation locale :", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });

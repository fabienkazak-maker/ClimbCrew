import { pool } from "../database";
import { serializeParticipant, serializeSession } from "../serializers";

interface ParticipantRow {
  id: string | number;
  nom: string;
  prenom: string;
  passport: string;
  cotisation: boolean;
  ffme: boolean;
  can_encadrer: boolean;
  can_referer: boolean;
  can_admin: boolean;
}

interface InscriptionRow {
  session_id: string;
  participant_id: string | number;
}

export async function exportDataset() {
  const [participants, sessions, inscriptions, ropes, routes, achievements] =
    await Promise.all([
      pool.query<ParticipantRow>(
        `select id, nom, prenom, passport, cotisation, ffme,
         can_encadrer, can_referer, can_admin from participants
         order by prenom, nom`,
      ),
      pool.query(`select id, date, slot, status, encadrant_id, referent_id
        from sessions order by date, slot`),
      pool.query<InscriptionRow>(
        `select session_id, participant_id from session_participants
         order by session_id, participant_id`,
      ),
      pool.query<{
        numeroCorde: number;
        actif: boolean;
        couleurCorde: string;
      }>(`select numero_corde as "numeroCorde", actif,
        couleur_corde as "couleurCorde" from ropes order by numero_corde`),
      pool.query(`select id, numero_voie_unique as "numeroVoieUnique",
        numero_corde as "numeroCorde", couleur_prises as "couleurPrises",
        cotation_reference as "cotationReference",
        cotation_ajustee as "cotationAjustee", nom_voie as "nomVoie",
        nom_ouvreur as "nomOuvreur", moulinette_only as "moulinetteOnly",
        active, date_creation as "dateCreation" from routes
        order by numero_corde nulls last, numero_voie_unique`),
      pool.query(`select id, participant_id as "participantId",
        session_id as "sessionId", voie_id as "voieId",
        date_realisation as "dateRealisation",
        style_realisation as "styleRealisation", commentaire,
        cotation_proposee as "cotationProposee", nb_essais as "nbEssais"
        from realisations order by date_realisation desc, created_at desc`),
    ]);
  const ids = new Map<string, string[]>();
  for (const row of inscriptions.rows) {
    const list = ids.get(row.session_id) ?? [];
    list.push(String(row.participant_id));
    ids.set(row.session_id, list);
  }
  return {
    exportedAt: new Date().toISOString(),
    version: "4.0.0",
    selectedDate: "",
    selectedParticipantProgress: "",
    participants: participants.rows.map(serializeParticipant),
    sessions: sessions.rows.map((row) =>
      serializeSession(row, ids.get(row.id) ?? []),
    ),
    ropes: ropes.rows,
    routes: routes.rows,
    realisations: achievements.rows.map((row) => ({
      ...row,
      nbEssais: row.nbEssais === null ? undefined : Number(row.nbEssais),
    })),
  };
}

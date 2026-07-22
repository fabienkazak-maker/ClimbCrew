import type { PoolClient } from "pg";
import type {
  ImportDataset,
  ImportedParticipant,
  ImportedSession,
} from "./import-types";

export async function clearBusinessData(client: PoolClient): Promise<void> {
  await client.query("delete from realisations");
  await client.query("delete from session_participants");
  await client.query("delete from sessions");
  await client.query("delete from routes");
  await client.query("delete from ropes");
  await client.query("delete from participants");
}

export async function writeParticipants(
  client: PoolClient,
  participants: ImportedParticipant[],
): Promise<Map<string, string>> {
  const identifiers = new Map<string, string>();
  for (const participant of participants) {
    const body = participant.body;
    const result = await client.query<{ id: string | number }>(
      `insert into participants
       (nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer, can_admin)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [
        body.nom,
        body.prenom,
        body.passport,
        body.cotisation,
        body.ffme,
        body.canEncadrer,
        body.canReferer,
        body.canAdmin,
      ],
    );
    const id = result.rows[0]?.id;
    if (id === undefined) throw new Error("Import participant impossible");
    identifiers.set(participant.sourceId, String(id));
  }
  return identifiers;
}

export async function writeRoutes(
  client: PoolClient,
  data: ImportDataset,
): Promise<void> {
  for (const rope of data.ropes) {
    await client.query(
      `insert into ropes (numero_corde, actif, couleur_corde)
       values ($1,$2,$3)`,
      [rope.numeroCorde, rope.actif, rope.couleurCorde],
    );
  }
  for (const route of data.routes) {
    await client.query(
      `insert into routes
       (id, numero_voie_unique, numero_corde, couleur_prises,
        cotation_reference, cotation_ajustee, nom_voie, nom_ouvreur,
        moulinette_only, active, date_creation)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        route.id,
        route.numeroVoieUnique,
        route.numeroCorde,
        route.couleurPrises,
        route.cotationReference,
        route.cotationAjustee,
        route.nomVoie,
        route.nomOuvreur,
        route.moulinetteOnly,
        route.active,
        route.dateCreation,
      ],
    );
  }
}

function mapped(
  identifiers: Map<string, string>,
  sourceId: string | null,
): string | null {
  if (sourceId === null) return null;
  const id = identifiers.get(sourceId);
  if (!id) throw new Error(`Participant importé introuvable: ${sourceId}`);
  return id;
}

async function writeSession(
  client: PoolClient,
  session: ImportedSession,
  identifiers: Map<string, string>,
): Promise<void> {
  await client.query(
    `insert into sessions (id, date, slot, status, encadrant_id, referent_id)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      session.sourceId,
      session.date,
      session.slot,
      session.status,
      mapped(identifiers, session.encadrantId),
      mapped(identifiers, session.referentId),
    ],
  );
  for (const sourceId of [...new Set(session.participantIds)]) {
    await client.query(
      `insert into session_participants (session_id, participant_id)
       values ($1,$2)`,
      [session.sourceId, mapped(identifiers, sourceId)],
    );
  }
}

export async function writeActivity(
  client: PoolClient,
  data: ImportDataset,
  identifiers: Map<string, string>,
): Promise<void> {
  for (const session of data.sessions) {
    await writeSession(client, session, identifiers);
  }
  for (const achievement of data.achievements) {
    await client.query(
      `insert into realisations
       (id, participant_id, session_id, voie_id, date_realisation,
        style_realisation, commentaire, cotation_proposee, nb_essais)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        achievement.id,
        mapped(identifiers, achievement.participantId),
        achievement.sessionId,
        achievement.voieId,
        achievement.dateRealisation,
        achievement.styleRealisation,
        achievement.commentaire,
        achievement.cotationProposee,
        achievement.nbEssais ?? null,
      ],
    );
  }
}

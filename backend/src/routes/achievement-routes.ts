import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import type { AchievementBody } from "../domain";
import { asyncRoute, bodyRecord, pathParam } from "../http";
import { requireAuth } from "../security/auth-middleware";
import { achievementBody } from "../validation";

interface AchievementRow {
  id: string;
  participantId: string;
  sessionId: string;
  voieId: string;
  dateRealisation: string;
  styleRealisation: string;
  commentaire: string | null;
  cotationProposee: string | null;
  nbEssais: string | null;
}

export const achievementRouter: RouterType = Router();
achievementRouter.use(requireAuth);

function serialize(row: AchievementRow): AchievementBody {
  const parsedAttempts = row.nbEssais ? Number(row.nbEssais) : null;
  return {
    id: row.id,
    participantId: row.participantId,
    sessionId: row.sessionId,
    voieId: row.voieId,
    dateRealisation: row.dateRealisation,
    styleRealisation: row.styleRealisation,
    commentaire: row.commentaire ?? "",
    cotationProposee: row.cotationProposee ?? "",
    ...(parsedAttempts && Number.isFinite(parsedAttempts)
      ? { nbEssais: parsedAttempts }
      : {}),
  };
}

achievementRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const result = await pool.query<AchievementRow>(`
    select id, participant_id as "participantId", session_id as "sessionId",
      voie_id as "voieId", date_realisation as "dateRealisation",
      style_realisation as "styleRealisation", commentaire,
      cotation_proposee as "cotationProposee", nb_essais as "nbEssais"
    from realisations order by date_realisation desc, created_at desc
  `);
    response.json(result.rows.map(serialize));
  }),
);

achievementRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const body = achievementBody(request.body);
    if (!body) {
      response.status(400).json({ error: "Réalisation invalide" });
      return;
    }
    await pool.query(
      `insert into realisations (id, participant_id, session_id, voie_id,
      date_realisation, style_realisation, commentaire, cotation_proposee, nb_essais)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        body.id,
        body.participantId,
        body.sessionId,
        body.voieId,
        body.dateRealisation,
        body.styleRealisation,
        body.commentaire,
        body.cotationProposee,
        body.nbEssais ?? null,
      ],
    );
    response.status(201).json(body);
  }),
);

achievementRouter.put(
  "/:id",
  asyncRoute(async (request, response) => {
    const body = achievementBody({
      ...bodyRecord(request),
      id: pathParam(request, "id"),
    });
    if (!body) {
      response.status(400).json({ error: "Réalisation invalide" });
      return;
    }
    const result = await pool.query(
      `update realisations set participant_id = $2, session_id = $3, voie_id = $4,
      date_realisation = $5, style_realisation = $6, commentaire = $7,
      cotation_proposee = $8, nb_essais = $9, updated_at = now() where id = $1`,
      [
        body.id,
        body.participantId,
        body.sessionId,
        body.voieId,
        body.dateRealisation,
        body.styleRealisation,
        body.commentaire,
        body.cotationProposee,
        body.nbEssais ?? null,
      ],
    );
    if (!result.rowCount) {
      response.status(404).json({ error: "Réalisation introuvable" });
      return;
    }
    response.json({ ok: true });
  }),
);

achievementRouter.delete(
  "/:id",
  asyncRoute(async (request, response) => {
    await pool.query("delete from realisations where id = $1", [
      pathParam(request, "id"),
    ]);
    response.status(204).send();
  }),
);

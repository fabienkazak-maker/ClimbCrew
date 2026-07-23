import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import { asyncRoute, pathParam } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { serializeParticipant } from "../serializers";
import { participantBody } from "../validation";

export const participantRouter: RouterType = Router();
participantRouter.use(requireAuth);

participantRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const result = await pool.query(`
    select id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer, can_admin
    from participants order by prenom asc, nom asc
  `);
    response.json(result.rows.map(serializeParticipant));
  }),
);

participantRouter.post(
  "/",
  requireAdmin,
  asyncRoute(async (request, response) => {
    const body = participantBody(request.body);
    if (!body) {
      response.status(400).json({ error: "Nom et prénom requis" });
      return;
    }
    const result = await pool.query(
      `insert into participants
      (nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer, can_admin)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer, can_admin`,
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
    const participant = result.rows[0];
    if (!participant) throw new Error("Création du participant impossible");
    response.status(201).json(serializeParticipant(participant));
  }),
);

participantRouter.put(
  "/:id",
  requireAdmin,
  asyncRoute(async (request, response) => {
    const body = participantBody(request.body);
    if (!body) {
      response.status(400).json({ error: "Participant invalide" });
      return;
    }
    const result = await pool.query(
      `update participants set nom = $2, prenom = $3, passport = $4,
      cotisation = $5, ffme = $6, can_encadrer = $7, can_referer = $8, can_admin = $9
     where id = $1
     returning id, nom, prenom, passport, cotisation, ffme, can_encadrer, can_referer, can_admin`,
      [
        pathParam(request, "id"),
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
    const participant = result.rows[0];
    if (!participant) {
      response.status(404).json({ error: "Participant introuvable" });
      return;
    }
    response.json(serializeParticipant(participant));
  }),
);

participantRouter.delete(
  "/:id",
  requireAdmin,
  asyncRoute(async (request, response) => {
    const id = pathParam(request, "id");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "delete from session_participants where participant_id = $1",
        [id],
      );
      await client.query("delete from realisations where participant_id = $1", [
        id,
      ]);
      await client.query(
        `update sessions set encadrant_id = null
         where encadrant_id = $1`,
        [id],
      );
      await client.query(
        `update sessions set referent_id = null
         where referent_id = $1`,
        [id],
      );
      const result = await client.query(
        "delete from participants where id = $1",
        [id],
      );
      if (!result.rowCount) {
        await client.query("rollback");
        response.status(404).json({ error: "Participant introuvable" });
        return;
      }
      await client.query("commit");
      response.status(204).send();
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }),
);

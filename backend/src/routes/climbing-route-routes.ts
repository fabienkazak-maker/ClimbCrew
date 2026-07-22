import { randomUUID } from "node:crypto";
import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import type { RouteBody } from "../domain";
import { asyncRoute, bodyRecord, pathParam } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { routeBody } from "../validation";

interface RouteRow {
  id: string;
  numero_voie_unique: string;
  numero_corde: number | null;
  couleur_prises: string;
  cotation_reference: string;
  cotation_ajustee: string;
  nom_voie: string;
  nom_ouvreur: string;
  moulinette_only: boolean;
  active: boolean;
  date_creation: string;
}

function serialize(row: RouteRow): RouteBody {
  return {
    id: row.id,
    numeroVoieUnique: row.numero_voie_unique,
    numeroCorde: row.numero_corde,
    couleurPrises: row.couleur_prises,
    cotationReference: row.cotation_reference,
    cotationAjustee: row.cotation_ajustee || row.cotation_reference,
    nomVoie: row.nom_voie,
    nomOuvreur: row.nom_ouvreur,
    moulinetteOnly: row.moulinette_only,
    active: row.active,
    dateCreation: row.date_creation,
  };
}

const columns = `id, numero_voie_unique, numero_corde, couleur_prises,
  cotation_reference, cotation_ajustee, nom_voie, nom_ouvreur,
  moulinette_only, active, date_creation`;

export const climbingRouteRouter: RouterType = Router();
climbingRouteRouter.use(requireAuth);

climbingRouteRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const result = await pool.query<RouteRow>(
      `select ${columns} from routes
       order by numero_corde asc nulls last, numero_voie_unique asc`,
    );
    response.json(result.rows.map(serialize));
  }),
);

climbingRouteRouter.post(
  "/",
  requireAdmin,
  asyncRoute(async (request, response) => {
    const record = bodyRecord(request);
    const id =
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : `route-${randomUUID()}`;
    const body = routeBody(id, record);
    if (!body) {
      response.status(400).json({ error: "Voie invalide" });
      return;
    }
    const result = await pool.query<RouteRow>(
      `insert into routes (${columns}) values
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning ${columns}`,
      values(body),
    );
    const route = result.rows[0];
    if (!route) throw new Error("Création de la voie impossible");
    response.status(201).json(serialize(route));
  }),
);

climbingRouteRouter.put(
  "/:id",
  requireAdmin,
  asyncRoute(async (request, response) => {
    const body = routeBody(pathParam(request, "id"), request.body);
    if (!body) {
      response.status(400).json({ error: "Voie invalide" });
      return;
    }
    const result = await pool.query<RouteRow>(
      `update routes set numero_voie_unique=$2, numero_corde=$3,
       couleur_prises=$4, cotation_reference=$5, cotation_ajustee=$6,
       nom_voie=$7, nom_ouvreur=$8, moulinette_only=$9, active=$10,
       date_creation=$11, updated_at=now() where id=$1 returning ${columns}`,
      values(body),
    );
    const route = result.rows[0];
    if (!route) {
      response.status(404).json({ error: "Voie introuvable" });
      return;
    }
    response.json(serialize(route));
  }),
);

function values(body: RouteBody): Array<string | number | boolean | null> {
  return [
    body.id,
    body.numeroVoieUnique,
    body.numeroCorde,
    body.couleurPrises,
    body.cotationReference,
    body.cotationAjustee,
    body.nomVoie,
    body.nomOuvreur,
    body.moulinetteOnly,
    body.active,
    body.dateCreation,
  ];
}

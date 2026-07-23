import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import { asyncRoute } from "../http";
import { requireAuth } from "../security/auth-middleware";

interface RopeRow {
  numero_corde: number;
  actif: boolean;
  couleur_corde: string;
}

export const ropeRouter: RouterType = Router();
ropeRouter.use(requireAuth);
ropeRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const result = await pool.query<RopeRow>(
      `select numero_corde, actif, couleur_corde
       from ropes order by numero_corde asc`,
    );
    response.json(
      result.rows.map((row) => ({
        numeroCorde: row.numero_corde,
        actif: row.actif,
        couleurCorde: row.couleur_corde,
      })),
    );
  }),
);

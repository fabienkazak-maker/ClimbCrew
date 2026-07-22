import { Router, type Router as RouterType } from "express";
import { ensureBootstrapAdmin, ensureSchema, pool } from "../database";
import { asyncRoute } from "../http";
import { requireSetupAccess } from "../security/setup-middleware";

export const systemRouter: RouterType = Router();

systemRouter.get("/", (_request, response) => {
  response.json({ ok: true, service: "ClimbCrew API" });
});

systemRouter.get(
  "/health",
  asyncRoute(async (_request, response) => {
    await pool.query("select 1");
    response.json({ ok: true });
  }),
);

systemRouter.get(
  "/setup-db",
  requireSetupAccess,
  asyncRoute(async (_request, response) => {
    await ensureSchema();
    await ensureBootstrapAdmin();
    response.json({ ok: true, message: "Schéma prêt" });
  }),
);

systemRouter.get(
  "/db-status",
  requireSetupAccess,
  asyncRoute(async (_request, response) => {
    const result = await pool.query<Record<string, string | null>>(`
    select current_database() as database,
      to_regclass('public.participants') as participants,
      to_regclass('public.sessions') as sessions,
      to_regclass('public.users') as users,
      to_regclass('public.realisations') as realisations
  `);
    response.json({ ok: true, ...result.rows[0] });
  }),
);

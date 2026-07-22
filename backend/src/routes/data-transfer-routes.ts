import { Router, type Router as RouterType } from "express";
import { asyncRoute } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { requireSetupAccess } from "../security/setup-middleware";
import { exportDataset } from "../services/export-service";
import { importDataset } from "../services/import-service";
import { parseImportDataset } from "../services/import-validation";

export const exportRouter: RouterType = Router();
exportRouter.use(requireAuth, requireAdmin);
exportRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    response.json(await exportDataset());
  }),
);

export const setupImportRouter: RouterType = Router();
setupImportRouter.use(requireSetupAccess);
setupImportRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const dataset = parseImportDataset(request.body);
    if (!dataset) {
      response.status(422).json({ error: "Données d’import invalides" });
      return;
    }
    response.json({ ok: true, ...(await importDataset(dataset)) });
  }),
);

import { Router, type Router as RouterType } from "express";
import { asyncRoute } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { importDataset } from "../services/import-service";
import { parseImportDataset } from "../services/import-validation";

export const importRouter: RouterType = Router();
importRouter.use(requireAuth, requireAdmin);
importRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const dataset = parseImportDataset(request.body);
    if (!dataset) {
      response.status(422).json({ error: "Données d’import invalides" });
      return;
    }
    const result = await importDataset(dataset);
    response.json({ ok: true, ...result });
  }),
);

import express from "express";
import {
  createManualBackupAndEmail,
  getBackupConfig,
  importBackupBuffer,
  listBackups,
  restoreBackup,
  sendBackupByEmail,
} from "./backup-service.js";
import { requireAdmin } from "./admin-users/security.js";

function restartProcessSoon(exitCode = 0) {
  setTimeout(() => process.exit(exitCode), 1200).unref?.();
}

/**
 * Routes d'exploitation réservées aux administrateurs authentifiés.
 * Les dumps restent dans /backups et ne sont jamais exposés comme fichiers statiques.
 */
export function installBackupRoutes(app) {
  app.get("/admin/backups", requireAdmin, async (_req, res) => {
    try {
      const backups = await listBackups();
      res.json({ ok: true, backups, config: getBackupConfig() });
    } catch (error) {
      console.error("GET /admin/backups", error);
      res.status(500).json({ error: "Chargement des sauvegardes impossible" });
    }
  });

  app.post("/admin/backups", requireAdmin, async (_req, res) => {
    try {
      const backup = await createManualBackupAndEmail();
      res.status(201).json({ ok: true, backup });
    } catch (error) {
      console.error("POST /admin/backups", error);
      res.status(500).json({ error: "Création de la sauvegarde impossible" });
    }
  });

  app.post("/admin/backups/:filename/email", requireAdmin, async (req, res) => {
    try {
      const result = await sendBackupByEmail(req.params.filename);
      res.json({ ok: true, sent: Boolean(result.sent), skipped: Boolean(result.skipped) });
    } catch (error) {
      console.error("POST /admin/backups/:filename/email", error);
      res.status(500).json({ error: "Envoi de la sauvegarde impossible" });
    }
  });

  app.post(
    "/admin/backups/import",
    requireAdmin,
    express.raw({ type: "application/octet-stream", limit: "50mb" }),
    async (req, res) => {
      try {
        const sourceName = String(req.query.filename || "").trim();
        const imported = await importBackupBuffer(req.body, sourceName);
        res.status(201).json({ ok: true, backup: imported });
      } catch (error) {
        console.error("POST /admin/backups/import", error);
        res.status(400).json({ error: error.message || "Import de la sauvegarde impossible" });
      }
    },
  );

  app.post("/admin/backups/:filename/restore", requireAdmin, async (req, res) => {
    if (String(req.body?.confirm || "") !== "RESTAURER") {
      return res.status(400).json({ error: "Confirmation RESTAURER requise" });
    }

    try {
      const result = await restoreBackup(req.params.filename);
      res.json({
        ok: true,
        ...result,
        message: "Sauvegarde restaurée. Toutes les sessions ont été révoquées et l'API redémarre.",
      });
      restartProcessSoon(0);
    } catch (error) {
      console.error("POST /admin/backups/:filename/restore", error);
      res.status(500).json({ error: error.message || "Restauration impossible" });
      if (error.restartRequired) restartProcessSoon(1);
    }
  });
}

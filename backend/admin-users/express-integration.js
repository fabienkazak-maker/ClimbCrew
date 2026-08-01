import express from "express";
import { INSTALL_FLAG } from "./config.js";
import { ensureAdminUserSchema } from "./database.js";
import {
  forgotPassword,
  listUsers,
  requestAccess,
  updateAdminRight,
} from "./account-service.js";
import { exportAllData } from "./export-service.js";
import { requireAdmin } from "./security.js";

/** Remplace seulement le dernier gestionnaire et conserve les middlewares existants. */
function replaceLastHandler(originalMethod, app, path, handlers, replacement) {
  const middlewares = handlers.slice(0, -1);
  return originalMethod.call(app, path, ...middlewares, replacement);
}

/**
 * Installe les extensions Express avant le chargement de server.js.
 * Les routes historiques gardent leur URL afin de ne pas casser le frontend.
 */
export function installExpressIntegration() {
  const originalPost = express.application.post;
  express.application.post = function patchedPost(path, ...handlers) {
    if (path === "/auth/request-access" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, requestAccess);
    }
    if (path === "/auth/forgot-password" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, forgotPassword);
    }
    return originalPost.call(this, path, ...handlers);
  };

  const originalGet = express.application.get;
  express.application.get = function patchedGet(path, ...handlers) {
    if (path === "/admin/auth/users" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, listUsers);
    }
    if (path === "/admin/export-data" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, exportAllData);
    }
    return originalGet.call(this, path, ...handlers);
  };

  const originalListen = express.application.listen;
  express.application.listen = function patchedListen(...args) {
    const app = this;

    const startListening = async () => {
      await ensureAdminUserSchema();

      if (!app[INSTALL_FLAG]) {
        app.post("/admin/auth/users/:id/admin", requireAdmin, updateAdminRight);
        app[INSTALL_FLAG] = true;
      }

      return originalListen.apply(app, args);
    };

    startListening().catch((error) => {
      console.error("Erreur d’installation des évolutions utilisateurs :", error);
      process.exitCode = 1;
    });

    return app;
  };
}

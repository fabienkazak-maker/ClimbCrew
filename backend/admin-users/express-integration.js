import express from "express";
import {
  CSRF_BRIDGE_FLAG,
  EXPRESS_PATCH_FLAG,
  INSTALL_FLAG,
} from "./config.js";
import { ensureAdminUserSchema } from "./database.js";
import {
  changePassword,
  confirmEmailChange,
  listUsers,
  requestEmailChange,
  updateAdminRight,
} from "./account-service.js";
import {
  secureAdminResetToken,
  secureForgotPassword,
  secureLogin,
  secureResetPassword,
} from "./auth-hardening-service.js";
import {
  approveVerifiedAccount,
  requestAccessPendingAdminApproval,
  verifyEmailPendingAdminApproval,
} from "./account-approval-flow-service.js";
import {
  getAccountNotificationPreference,
  listManagedAccountNotificationPreferences,
  updateAccountNotificationPreference,
  updateManagedAccountNotificationPreference,
} from "./account-notification-preference-service.js";
import {
  associateExistingAccounts,
  setUserParticipantAssociation,
} from "./association-service.js";
import { exportAllData } from "./export-service.js";
import {
  listParticipantsWithPrivacy,
  listRealisationsWithPrivacy,
} from "./participant-privacy-service.js";
import { updateSessionWithAuthorization } from "./session-authorization-service.js";
import { startAccessLogRetentionScheduler } from "./access-log-retention.js";
import { requireAdmin, requireAuthUser } from "./security.js";
import {
  blockLegacyFileImportInProduction,
  rejectMaintenanceTokenInQuery,
  safeHealthCheck,
} from "./maintenance-hardening.js";
import { createCrossOriginCsrfBridge } from "../deployment-compatibility.js";
import { installBackupRoutes } from "../backup-routes.js";
import { startBackupScheduler } from "../backup-service.js";

/**
 * Intégration des modules séparés dans l'application Express historique.
 *
 * Rôle : conserver les URL déjà utilisées par le frontend tout en remplaçant
 * certains contrôleurs par des versions plus robustes et mieux découpées.
 *
 * Impact visuel : les écrans restent identiques. Les changements se voient
 * uniquement par une meilleure fiabilité des demandes de compte, de la gestion
 * administrateur et des actions effectuées depuis un frontend Render séparé.
 */

/**
 * Remplace uniquement le dernier gestionnaire d'une route.
 * Les middlewares déjà déclarés dans server.js, comme l'authentification et la
 * limitation de débit, restent ainsi actifs et dans le même ordre.
 */
function replaceLastHandler(originalMethod, app, path, handlers, replacement) {
  const middlewares = handlers.slice(0, -1);
  return originalMethod.call(app, path, ...middlewares, replacement);
}

/**
 * Installe les extensions Express avant le chargement de server.js.
 * Les routes historiques gardent leur URL afin de ne pas casser le frontend,
 * les favoris ni les éventuels scripts d'administration existants.
 */
export function installExpressIntegration() {
  if (express.application[EXPRESS_PATCH_FLAG]) return;
  express.application[EXPRESS_PATCH_FLAG] = true;

  const originalUse = express.application.use;
  express.application.use = function patchedUse(...handlers) {
    if (!this[CSRF_BRIDGE_FLAG]) {
      originalUse.call(this, createCrossOriginCsrfBridge());
      this[CSRF_BRIDGE_FLAG] = true;
    }
    return originalUse.apply(this, handlers);
  };

  const originalPost = express.application.post;
  express.application.post = function patchedPost(path, ...handlers) {
    if (path === "/import-data" && handlers.length) {
      return originalPost.call(
        this,
        path,
        rejectMaintenanceTokenInQuery,
        blockLegacyFileImportInProduction,
        ...handlers,
      );
    }
    if (path === "/auth/login" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureLogin);
    }
    if (path === "/auth/request-access" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, requestAccessPendingAdminApproval);
    }
    if (path === "/auth/forgot-password" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureForgotPassword);
    }
    if (path === "/auth/reset-password" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureResetPassword);
    }
    if (path === "/admin/auth/users/:id/approve" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, approveVerifiedAccount);
    }
    if (path === "/admin/auth/users/:id/reset-token" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureAdminResetToken);
    }
    return originalPost.call(this, path, ...handlers);
  };

  const originalPut = express.application.put;
  express.application.put = function patchedPut(path, ...handlers) {
    if (path === "/sessions/:id" && handlers.length) {
      return replaceLastHandler(originalPut, this, path, handlers, updateSessionWithAuthorization);
    }
    return originalPut.call(this, path, ...handlers);
  };

  const originalGet = express.application.get;
  express.application.get = function patchedGet(path, ...handlers) {
    if ((path === "/setup-db" || path === "/db-status") && handlers.length) {
      return originalGet.call(this, path, rejectMaintenanceTokenInQuery, ...handlers);
    }
    if (path === "/health" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, safeHealthCheck);
    }
    if (path === "/participants" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, listParticipantsWithPrivacy);
    }
    if (path === "/realisations" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, listRealisationsWithPrivacy);
    }
    if (path === "/admin/auth/users" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, listUsers);
    }
    if (path === "/admin/export-data" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, exportAllData);
    }
    if (path === "/auth/verify-email" && handlers.length) {
      return replaceLastHandler(originalGet, this, path, handlers, verifyEmailPendingAdminApproval);
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
        app.post("/admin/auth/associations/auto", requireAdmin, associateExistingAccounts);
        app.put("/admin/auth/users/:id/participant", requireAdmin, setUserParticipantAssociation);
        app.get("/auth/verify-email", verifyEmailPendingAdminApproval);
        app.post("/auth/change-password", requireAuthUser, changePassword);
        app.post("/auth/change-email/request", requireAuthUser, requestEmailChange);
        app.get("/auth/change-email/confirm", confirmEmailChange);
        app.get("/auth/notification-preference", requireAuthUser, getAccountNotificationPreference);
        app.patch("/auth/notification-preference", requireAuthUser, updateAccountNotificationPreference);
        app.get(
          "/admin/auth/notification-preferences",
          requireAdmin,
          listManagedAccountNotificationPreferences,
        );
        app.put(
          "/admin/participants/:participantId/account-notifications",
          requireAdmin,
          updateManagedAccountNotificationPreference,
        );
        installBackupRoutes(app);
        app[INSTALL_FLAG] = true;
      }

      const server = originalListen.apply(app, args);
      startBackupScheduler();
      await startAccessLogRetentionScheduler();
      return server;
    };

    startListening().catch((error) => {
      console.error("Erreur d’installation des évolutions utilisateurs :", error);
      process.exitCode = 1;
    });

    return app;
  };
}

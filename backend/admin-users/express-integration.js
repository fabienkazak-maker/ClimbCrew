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
import { revokeAccountSafely } from "./account-lifecycle-service.js";
import {
  secureAdminResetToken,
  secureForgotPassword,
  secureLogin,
  secureResetPassword,
} from "./auth-hardening-service.js";
import { verifyEmailPendingAdminApproval } from "./account-approval-flow-service.js";
import {
  approveVerifiedAccountWithParticipantRole,
  setUserParticipantAssociationWithAdminRight,
  updateParticipantWithAdminRight,
} from "./participant-admin-right-service.js";
import {
  getAccountNotificationPreference,
  listManagedAccountNotificationPreferences,
  updateAccountNotificationPreference,
  updateManagedAccountNotificationPreference,
} from "./account-notification-preference-service.js";
import {
  associateExistingAccountsByEmail,
  requestAccessByEmailOnly,
} from "./email-association-service.js";
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

function replaceLastHandler(originalMethod, app, path, handlers, replacement) {
  const middlewares = handlers.slice(0, -1);
  return originalMethod.call(app, path, ...middlewares, replacement);
}

/**
 * Adapte progressivement le serveur historique sans changer les URL utilisées
 * par le frontend. Les middlewares historiques d'authentification, de CSRF et de
 * limitation de débit sont conservés lorsqu'un contrôleur final est remplacé.
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
      return replaceLastHandler(originalPost, this, path, handlers, requestAccessByEmailOnly);
    }
    if (path === "/auth/forgot-password" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureForgotPassword);
    }
    if (path === "/auth/reset-password" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureResetPassword);
    }
    if (path === "/admin/auth/users/:id/approve" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, approveVerifiedAccountWithParticipantRole);
    }
    if (path === "/admin/auth/users/:id/revoke" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, revokeAccountSafely);
    }
    if (path === "/admin/auth/users/:id/reset-token" && handlers.length) {
      return replaceLastHandler(originalPost, this, path, handlers, secureAdminResetToken);
    }
    return originalPost.call(this, path, ...handlers);
  };

  const originalPut = express.application.put;
  express.application.put = function patchedPut(path, ...handlers) {
    if (path === "/participants/:id" && handlers.length) {
      return replaceLastHandler(originalPut, this, path, handlers, updateParticipantWithAdminRight);
    }
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
        app.post("/admin/auth/associations/auto", requireAdmin, associateExistingAccountsByEmail);
        app.put(
          "/admin/auth/users/:id/participant",
          requireAdmin,
          setUserParticipantAssociationWithAdminRight,
        );
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

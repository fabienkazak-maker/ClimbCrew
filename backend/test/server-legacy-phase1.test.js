import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const serverSource = await readFile(new URL("../server.js", import.meta.url), "utf8");
const routeManagementSource = await readFile(new URL("../route-management-routes.js", import.meta.url), "utf8");
const realisationManagementSource = await readFile(new URL("../realisation-management-routes.js", import.meta.url), "utf8");
const sessionReadSource = await readFile(new URL("../session-read-routes.js", import.meta.url), "utf8");

const replacedRouteShells = [
  `app.post("/admin/import-data", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.get("/admin/export-data", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.get("/realisations", requireAuth, legacyReplacedRoute);`,
  `app.get("/health", legacyReplacedRoute);`,
  `app.post("/auth/login", authRateLimit, legacyReplacedRoute);`,
  `app.post("/auth/request-access", authRateLimit, legacyReplacedRoute);`,
  `app.post("/auth/forgot-password", resetRateLimit, legacyReplacedRoute);`,
  `app.post("/auth/reset-password", resetRateLimit, legacyReplacedRoute);`,
  `app.get("/admin/auth/users", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.post("/admin/auth/users/:id/approve", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.post("/admin/auth/users/:id/revoke", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.post("/admin/auth/users/:id/reactivate", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.post("/admin/auth/users/:id/reset-token", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.get("/participants", requireAuth, legacyReplacedRoute);`,
  `app.put("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.patch("/participants/me/profile", requireAuth, legacyReplacedRoute);`,
  `app.delete("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);`,
  `app.put("/sessions/:id", requireAuth, legacyReplacedRoute);`,
];

test("server.js ne conserve que les points d'ancrage des contrôleurs déjà remplacés", () => {
  for (const route of replacedRouteShells) {
    assert.match(serverSource, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("les anciennes implémentations remplacées ne reviennent pas dans server.js", () => {
  const forbiddenFragments = [
    "async function importLegacyPayload",
    "async function exportLegacyPayload",
    "findParticipantId(prenom, nom)",
    'eventType: "login_success"',
    'message: "Demande d’accès enregistrée. Un administrateur doit l’approuver."',
    'const customAvatarImage = String(req.body?.customAvatarImage || "");',
    'const resolvedStatus = status || defaultSessionStatus(date, slot);',
    "sendApprovalNotificationEmail",
    'app.post("/realisations", requireAuth, async',
    'app.put("/realisations/:id", requireAuth, async',
    'app.delete("/realisations/:id", requireAuth, async',
    'app.get("/sessions", requireAuth, async',
    'app.delete("/sessions/:id", requireAuth, requireAdmin, async',
    "function sessionDbToApi(row, participantIds = [])",
  ];

  for (const fragment of forbiddenFragments) {
    assert.equal(serverSource.includes(fragment), false, `fragment legacy revenu: ${fragment}`);
  }
});

test("les routes encore actives restent implémentées ou explicitement extraites", () => {
  assert.match(serverSource, /app\.post\("\/participants", requireAuth, requireAdmin, async/);

  assert.match(serverSource, /installSessionReadRoutes\(app, \{ requireAuth, requireAdmin, pool \}\)/);
  assert.match(serverSource, /app\.put\("\/sessions\/:id", requireAuth, legacyReplacedRoute\)/);
  assert.match(sessionReadSource, /app\.get\("\/sessions", requireAuth, async/);
  assert.match(sessionReadSource, /app\.delete\("\/sessions\/:id", requireAuth, requireAdmin, async/);
  assert.match(sessionReadSource, /delete from sessions where id = \$1/);

  assert.match(serverSource, /app\.get\("\/realisations", requireAuth, legacyReplacedRoute\)/);
  assert.match(serverSource, /installRealisationManagementRoutes\(app, \{ requireAuth, pool \}\)/);
  assert.match(realisationManagementSource, /app\.post\("\/realisations", requireAuth, async/);
  assert.match(realisationManagementSource, /app\.put\("\/realisations\/:id", requireAuth, async/);
  assert.match(realisationManagementSource, /app\.delete\("\/realisations\/:id", requireAuth, async/);
  assert.match(realisationManagementSource, /where id = \$1 and participant_id = \$13/);
  assert.match(realisationManagementSource, /delete from realisations where id = \$1 and participant_id = \$2/);

  assert.match(serverSource, /installRouteManagementRoutes\(app, \{ requireAuth, requireAdmin, pool \}\)/);
  assert.match(routeManagementSource, /app\.get\("\/ropes", requireAuth, async/);
  assert.match(routeManagementSource, /app\.get\("\/routes", requireAuth, async/);
  assert.match(routeManagementSource, /app\.post\("\/routes", requireAuth, requireAdmin, async/);
  assert.match(routeManagementSource, /app\.put\("\/routes\/:id", requireAuth, requireAdmin, async/);
  assert.match(routeManagementSource, /app\.delete\("\/routes\/:id", requireAuth, requireAdmin, async/);
  assert.match(serverSource, /app\.post\("\/import-data", requireSetupAccess, async/);
});

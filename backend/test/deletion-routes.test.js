import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("les suppressions administratives sont protégées et transactionnelles", async () => {
  const [server, routeManagement, integration, participantLifecycle] = await Promise.all([
    readFile(new URL("../server.js", import.meta.url), "utf8"),
    readFile(new URL("../route-management-routes.js", import.meta.url), "utf8"),
    readFile(new URL("../admin-users/express-integration.js", import.meta.url), "utf8"),
    readFile(new URL("../admin-users/participant-lifecycle-service.js", import.meta.url), "utf8"),
  ]);

  // La suppression de voie est désormais extraite de server.js mais conserve
  // la protection administrateur et sa transaction complète.
  assert.match(server, /installRouteManagementRoutes\(app, \{ requireAuth, requireAdmin, pool \}\)/);
  assert.match(routeManagement, /app\.delete\("\/routes\/:id", requireAuth, requireAdmin/);
  assert.match(routeManagement, /delete from realisations where voie_id = \$1/);
  assert.match(routeManagement, /await client\.query\("commit"\)/);
  assert.match(routeManagement, /await client\.query\("rollback"\)/);

  // La suppression de compte reste encore directement dans server.js.
  assert.match(server, /app\.delete\("\/admin\/auth\/users\/:id", requireAuth, requireAdmin/);
  assert.match(server, /Vous ne pouvez pas supprimer votre propre compte/);
  assert.match(server, /Le dernier compte administrateur actif ne peut pas être supprimé/);

  // La suppression participant est portée par le service sécurisé ; server.js
  // ne conserve volontairement que son point d'ancrage historique.
  assert.match(server, /app\.delete\("\/participants\/:id", requireAuth, requireAdmin, legacyReplacedRoute\)/);
  assert.match(integration, /path === "\/participants\/:id"[\s\S]*deleteParticipantSafely/);
  assert.match(participantLifecycle, /select id, email, status, role, is_admin from users where participant_id = \$1/);
  assert.match(participantLifecycle, /delete from session_participants where participant_id = \$1/);
  assert.match(participantLifecycle, /update realisations set assureur_id = null where assureur_id = \$1/);
  assert.match(participantLifecycle, /delete from realisations where participant_id = \$1/);
  assert.match(participantLifecycle, /await client\.query\("commit"\)/);
  assert.match(participantLifecycle, /await client\.query\("rollback"\)/);
});

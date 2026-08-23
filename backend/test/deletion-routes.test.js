import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("les suppressions administratives sont protégées et transactionnelles", async () => {
  const [server, integration, participantLifecycle] = await Promise.all([
    readFile(new URL("../server.js", import.meta.url), "utf8"),
    readFile(new URL("../admin-users/express-integration.js", import.meta.url), "utf8"),
    readFile(new URL("../admin-users/participant-lifecycle-service.js", import.meta.url), "utf8"),
  ]);

  // Les suppressions de voies et de comptes restent implémentées directement
  // dans server.js et conservent leurs protections administrateur.
  assert.match(server, /app\.delete\("\/routes\/:id", requireAuth, requireAdmin/);
  assert.match(server, /app\.delete\("\/admin\/auth\/users\/:id", requireAuth, requireAdmin/);
  assert.match(server, /Vous ne pouvez pas supprimer votre propre compte/);
  assert.match(server, /Le dernier compte administrateur actif ne peut pas être supprimé/);
  assert.match(server, /delete from realisations where voie_id = \$1/);

  // La suppression participant est désormais portée par le service sécurisé ;
  // server.js ne conserve volontairement que son point d'ancrage historique.
  assert.match(server, /app\.delete\("\/participants\/:id", requireAuth, requireAdmin, legacyReplacedRoute\)/);
  assert.match(integration, /path === "\/participants\/:id"[\s\S]*deleteParticipantSafely/);
  assert.match(participantLifecycle, /select id, email, status, role, is_admin from users where participant_id = \$1/);
  assert.match(participantLifecycle, /delete from session_participants where participant_id = \$1/);
  assert.match(participantLifecycle, /update realisations set assureur_id = null where assureur_id = \$1/);
  assert.match(participantLifecycle, /delete from realisations where participant_id = \$1/);
  assert.match(participantLifecycle, /await client\.query\("commit"\)/);
  assert.match(participantLifecycle, /await client\.query\("rollback"\)/);
});

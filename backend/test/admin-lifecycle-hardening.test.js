import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lifecycleSource = await readFile(
  new URL("../admin-users/account-lifecycle-service.js", import.meta.url),
  "utf8",
);
const integrationSource = await readFile(
  new URL("../admin-users/express-integration.js", import.meta.url),
  "utf8",
);
const deploymentSource = await readFile(
  new URL("../deployment-compatibility.js", import.meta.url),
  "utf8",
);
const productionEnvExample = await readFile(
  new URL("../../.env.production.example", import.meta.url),
  "utf8",
);

test("la révocation historique utilise le contrôleur avec garde-fous", () => {
  assert.match(
    integrationSource,
    /path === "\/admin\/auth\/users\/:id\/revoke"[\s\S]*revokeAccountSafely/,
  );
});

test("un administrateur ne peut pas révoquer son propre compte", () => {
  assert.match(lifecycleSource, /actorId === userId/);
  assert.match(lifecycleSource, /Vous ne pouvez pas révoquer votre propre compte administrateur/);
});

test("le dernier administrateur actif ne peut pas être révoqué", () => {
  assert.match(lifecycleSource, /status = 'active'/);
  assert.match(lifecycleSource, /role = 'admin' or is_admin = true/);
  assert.match(lifecycleSource, /remainingAdmins\.rows\[0\]\.count < 1/);
  assert.match(lifecycleSource, /Le dernier compte administrateur actif ne peut pas être révoqué/);
});

test("la révocation coupe les sessions et les notifications du compte", () => {
  assert.match(lifecycleSource, /receive_account_notifications = false/);
  assert.match(lifecycleSource, /update user_sessions set revoked_at = now\(\)/);
});

test("le bootstrap FIRST_ADMIN est explicitement désactivé par défaut en production", () => {
  assert.match(deploymentSource, /ALLOW_FIRST_ADMIN_BOOTSTRAP/);
  assert.match(deploymentSource, /delete process\.env\.FIRST_ADMIN_PASSWORD/);
  assert.match(productionEnvExample, /ALLOW_FIRST_ADMIN_BOOTSTRAP=false/);
});

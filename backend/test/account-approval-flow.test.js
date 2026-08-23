import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const approvalSource = await readFile(
  new URL("../admin-users/account-approval-flow-service.js", import.meta.url),
  "utf8",
);
const integrationSource = await readFile(
  new URL("../admin-users/express-integration.js", import.meta.url),
  "utf8",
);
const accountSource = await readFile(
  new URL("../admin-users/account-service.js", import.meta.url),
  "utf8",
);

test("la demande de compte annonce l'approbation administrateur obligatoire", () => {
  assert.match(approvalSource, /un administrateur devra approuver le compte avant la première connexion/);
  assert.match(integrationSource, /requestAccessPendingAdminApproval/);
});

test("la vérification de l'e-mail ne transforme plus un compte pending en active", () => {
  assert.match(approvalSource, /set email_verified_at = coalesce\(email_verified_at, now\(\)\)/);
  assert.doesNotMatch(approvalSource, /status = case when status = 'pending' then 'active'/);
  assert.match(approvalSource, /en attente d’approbation par un administrateur/);
  assert.match(integrationSource, /verifyEmailPendingAdminApproval/);
});

test("les demandes pending vérifiées restent visibles dans Gestion des comptes", () => {
  assert.match(accountSource, /where status <> 'pending'[\s\S]*or email_verified_at is not null/);
});

test("l'activation reste une action administrateur distincte", async () => {
  const serverSource = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(serverSource, /\/admin\/auth\/users\/:id\/approve/);
  assert.match(serverSource, /set status = 'active'/);
});

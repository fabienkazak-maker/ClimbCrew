import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const approvalSource = await readFile(
  new URL("../admin-users/account-approval-flow-service.js", import.meta.url),
  "utf8",
);
const emailAssociationSource = await readFile(
  new URL("../admin-users/email-association-service.js", import.meta.url),
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
  assert.match(emailAssociationSource, /un administrateur devra associer la demande à une fiche si nécessaire puis approuver le compte/);
  assert.match(integrationSource, /requestAccessByEmailOnly/);
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

test("l'approbation refuse une adresse non vérifiée ou un compte non associé", () => {
  assert.match(approvalSource, /if \(!target\.email_verified_at\)/);
  assert.match(approvalSource, /L’adresse e-mail doit être confirmée avant l’approbation du compte/);
  assert.match(approvalSource, /if \(!target\.participant_id\)/);
  assert.match(approvalSource, /Associez d’abord ce compte à une fiche grimpeur avant de l’approuver/);
  assert.match(approvalSource, /if \(target\.status !== "pending"\)/);
  assert.match(integrationSource, /path === "\/admin\/auth\/users\/:id\/approve"[\s\S]*approveVerifiedAccount/);
});

test("l'activation reste une action administrateur distincte", () => {
  assert.match(approvalSource, /set status = 'active'/);
  assert.match(approvalSource, /eventType: "account_approved"/);
  assert.match(approvalSource, /sendApprovalNotificationEmail/);
});

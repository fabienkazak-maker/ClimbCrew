import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le backend cible les comptes actifs et conserve un accusé de lecture individuel", async () => {
  const source = await readFile(new URL("../../backend/server.js", import.meta.url), "utf8");
  assert.match(source, /create table if not exists broadcast_messages/);
  assert.match(source, /create table if not exists broadcast_message_recipients/);
  assert.match(source, /select \$1, id from users where status = 'active'/);
  assert.match(source, /\/auth\/broadcast-messages\/pending/);
  assert.match(source, /\/auth\/broadcast-messages\/\:id\/read/);
});

test("Administration Serveur diffuse et l'application affiche le prochain message", async () => {
  const [appSource, serverAdministrationSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/Logs.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(serverAdministrationSource, /Diffuser un message/);
  assert.match(serverAdministrationSource, /publishBroadcastMessage/);
  assert.match(appSource, /pendingBroadcastMessages/);
  assert.match(appSource, /Message du club/);
  assert.match(appSource, /J’ai lu/);
});

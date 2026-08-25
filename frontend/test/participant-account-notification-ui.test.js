import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const entry = await readFile(new URL("../src/admin-user-management.js", import.meta.url), "utf8");
const ui = await readFile(new URL("../src/participant-account-notification-ui.js", import.meta.url), "utf8");
const profile = await readFile(new URL("../src/pages/Profil.jsx", import.meta.url), "utf8");

test("le réglage e-mail est chargé dans la gestion des participants", () => {
  assert.match(entry, /participant-account-notification-ui\.js/);
  assert.match(ui, /E-mail demandes/);
  assert.match(ui, /adminLabel\.after\(wrapper\)/);
});

test("la case reste inactive sans administrateur et compte actif associés", () => {
  assert.match(ui, /participant\.canAdmin/);
  assert.match(ui, /preference\?\.status === "active"/);
  assert.match(ui, /preference\?\.isAdmin/);
});

test("le réglage n'est plus affiché dans Mon profil", () => {
  assert.doesNotMatch(profile, /Notifications administrateur/);
  assert.doesNotMatch(profile, /notification-preference/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const administrationSource = await readFile(
  new URL("../src/pages/Administration.jsx", import.meta.url),
  "utf8",
);

test("aucune adresse de sauvegarde n'est codée en dur dans l'administration", () => {
  assert.doesNotMatch(administrationSource, /cristal\.climbcrew@gmail\.com/);
  assert.match(administrationSource, /backupConfig\?\.emailConfigured/);
  assert.match(administrationSource, /BACKUP_RECIPIENT n’est pas configuré/);
});

test("le bouton d'envoi est désactivé sans destinataire configuré", () => {
  assert.match(
    administrationSource,
    /disabled=\{backupBusy \|\| !backupConfig\?\.emailConfigured\}/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const sessionCardSource = await readFile(new URL("../src/components/SessionCard.jsx", import.meta.url), "utf8");

test("les rôles encadrant et référent ne sont jamais injectés automatiquement dans les inscrits", () => {
  const updateSessionBlock = appSource.slice(
    appSource.indexOf("function updateSession"),
    appSource.indexOf("function addParticipantToSession"),
  );

  assert.match(updateSessionBlock, /participantIds: \[\.\.\.new Set\(\(patchedSession\.participantIds \|\| \[\]\)\.map\(String\)\)\]/);
  assert.doesNotMatch(updateSessionBlock, /patchedSession\.encadrantId/);
  assert.doesNotMatch(updateSessionBlock, /patchedSession\.referentId/);
});

test("la désinscription d'un participant ne retire pas son rôle de séance", () => {
  const removeBlock = appSource.slice(
    appSource.indexOf("function removeParticipantFromSession"),
    appSource.indexOf("const updateRealisation"),
  );

  assert.match(removeBlock, /participantIds: currentSession\.participantIds\.filter/);
  assert.doesNotMatch(removeBlock, /encadrantId:/);
  assert.doesNotMatch(removeBlock, /referentId:/);
});

test("un référent non inscrit reste proposé à l'inscription", () => {
  assert.match(sessionCardSource, /!sessionParticipantIds\.includes\(String\(participant\.id\)\)/);
  assert.doesNotMatch(sessionCardSource, /participant\.id\) !== String\(session\.referentId/);
});

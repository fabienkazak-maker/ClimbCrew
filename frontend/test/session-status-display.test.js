import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  isEligibleForFreeSession,
  normalizeSessionPassport,
} from "../src/session-status-display-rules.js";

test("une séance libre accepte uniquement les passeports jaune, orange, vert et bleu", () => {
  assert.equal(isEligibleForFreeSession("jaune"), true);
  assert.equal(isEligibleForFreeSession("Orange"), true);
  assert.equal(isEligibleForFreeSession("VERT"), true);
  assert.equal(isEligibleForFreeSession("bleu"), true);

  assert.equal(isEligibleForFreeSession("sans"), false);
  assert.equal(isEligibleForFreeSession("découverte"), false);
  assert.equal(isEligibleForFreeSession(""), false);
});

test("la normalisation des passeports ignore casse, espaces et accents", () => {
  assert.equal(normalizeSessionPassport("  DÉCOUVERTE "), "decouverte");
  assert.equal(normalizeSessionPassport(" Bleu "), "bleu");
});

test("React applique directement la classe de couleur correspondant au statut de la séance", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const display = await readFile(new URL("../src/session-status-display.js", import.meta.url), "utf8");

  assert.match(app, /session-status-\$\{String\(session\.status \|\| "fermee"\)\.trim\(\)\.toLowerCase\(\)\}/);
  assert.doesNotMatch(display, /applySessionStatusClass/);
});

test("les couleurs de fond respectent la convention des inscriptions", async () => {
  const css = await readFile(new URL("../src/styles/session-status-colors.css", import.meta.url), "utf8");
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

  assert.match(css, /session-status-libre[\s\S]*22, 163, 74/); // vert
  assert.match(css, /session-status-encadree[\s\S]*37, 99, 235/); // bleu
  assert.match(css, /session-status-fermee,[\s\S]*session-status-renouvellement[\s\S]*220, 38, 38/); // rouge
  assert.match(css, /session-status-passeport[\s\S]*234, 88, 12/); // orange
  assert.match(css, /session-status-challenge[\s\S]*100, 116, 139/); // gris
  assert.match(main, /styles\/session-status-colors\.css/);
});

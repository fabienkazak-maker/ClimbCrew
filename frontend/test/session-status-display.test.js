import test from "node:test";
import assert from "node:assert/strict";

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

import test from "node:test";
import assert from "node:assert/strict";

import {
  prioritizeConnectedParticipantValues,
  shouldDefaultConnectedParticipant,
} from "../src/account-participant-priority-rules.js";

test("le grimpeur connecté passe en tête après l'option vide", () => {
  assert.deepEqual(
    prioritizeConnectedParticipantValues(["", "12", "8", "4"], "8"),
    ["", "8", "12", "4"],
  );
});

test("le grimpeur connecté passe en première position sans option vide", () => {
  assert.deepEqual(
    prioritizeConnectedParticipantValues(["12", "8", "4"], "8"),
    ["8", "12", "4"],
  );
});

test("seuls les champs de choix du grimpeur sont préremplis", () => {
  assert.equal(shouldDefaultConnectedParticipant("Participant"), true);
  assert.equal(shouldDefaultConnectedParticipant("Grimpeur"), true);
  assert.equal(shouldDefaultConnectedParticipant("Inscription"), false);
  assert.equal(shouldDefaultConnectedParticipant("Référent"), false);
  assert.equal(shouldDefaultConnectedParticipant("Encadrant"), false);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  ValidationError,
  validateLegacyImportPayload,
  validateParticipantPayload,
  validateRealisationPayload,
  validateRoutePayload,
  validateSessionPayload,
} from "../validation.js";

test("valide et normalise un participant", () => {
  const participant = validateParticipantPayload({
    nom: " Dupont ",
    prenom: " Alice ",
    email: " ALICE@example.com ",
    passport: "orange",
    sexe: "F",
    cotisation: "true",
    ffme: 0,
  });

  assert.equal(participant.nom, "Dupont");
  assert.equal(participant.email, "alice@example.com");
  assert.equal(participant.cotisation, true);
  assert.equal(participant.sexe, "f");
  assert.equal(participant.ffme, false);
});

test("refuse un email et un passeport invalides", () => {
  assert.throws(
    () => validateParticipantPayload({
      nom: "Dupont",
      prenom: "Alice",
      email: "adresse-invalide",
      passport: "violet",
    }),
    ValidationError,
  );
});

test("accepte uniquement les cordes 0 à 21 et les cotations connues", () => {
  const route = validateRoutePayload({
    id: "v1",
    numeroVoieUnique: "v1",
    numeroCorde: "0",
    couleurPrises: "Rouge",
    cotationReference: "6a",
    cotationAjustee: "6a+",
    nomOuvreur: "Alice",
    dateCreation: "2026-08-09",
  });
  assert.equal(route.numeroCorde, 0);

  assert.throws(
    () => validateRoutePayload({
      id: "v2",
      numeroVoieUnique: "v2",
      numeroCorde: 22,
      couleurPrises: "Bleu",
      cotationReference: "8a",
      nomOuvreur: "Bob",
      dateCreation: "2026-08-09",
    }),
    ValidationError,
  );
});

test("valide les statuts, créneaux et dates des séances", () => {
  const session = validateSessionPayload({
    date: "2026-08-09",
    slot: "midi",
    status: "libre",
    participantIds: [1, "1", 2],
  }, "2026-08-09-midi");

  assert.deepEqual(session.participantIds, ["1", "2"]);

  assert.throws(
    () => validateSessionPayload({
      date: "2026-02-30",
      slot: "nuit",
      participantIds: [],
    }, "session-invalide"),
    ValidationError,
  );
});

test("valide séparément le mode et le critère des réalisations", () => {
  const realisation = validateRealisationPayload({
    id: "r1",
    participantId: "1",
    sessionId: "s1",
    voieId: "v1",
    dateRealisation: "2026-08-09",
    modeRealisation: "moulinette",
    styleRealisation: "a_vue",
    cotationProposee: "6b",
  });
  assert.equal(realisation.modeRealisation, "moulinette");
  assert.equal(realisation.styleRealisation, "a_vue");
  assert.equal(realisation.nbEssais, "moulinette");

  assert.throws(
    () => validateRealisationPayload({
      id: "r2",
      participantId: "1",
      sessionId: "s1",
      voieId: "v1",
      dateRealisation: "2026-08-09",
      modeRealisation: "solo",
      styleRealisation: "a_vue",
    }),
    ValidationError,
  );
});

test("les anciennes réalisations sans mode explicite restent acceptées", () => {
  const lead = validateRealisationPayload({
    id: "r1",
    participantId: "1",
    sessionId: "s1",
    voieId: "v1",
    dateRealisation: "2026-08-09",
    styleRealisation: "en_tete",
  });
  const topRope = validateRealisationPayload({
    id: "r2",
    participantId: "1",
    sessionId: "s1",
    voieId: "v1",
    dateRealisation: "2026-08-09",
    styleRealisation: "moulinette",
  });
  assert.equal(lead.modeRealisation, "en_tete");
  assert.equal(topRope.modeRealisation, "moulinette");
});

test("un patch de réalisation ne valide que les champs fournis", () => {
  const patch = validateRealisationPayload(
    { commentaire: " Mise à jour " },
    { partial: true },
  );
  assert.equal(patch.commentaire, "Mise à jour");
  assert.equal(patch.participantId, undefined);

  const modePatch = validateRealisationPayload(
    { modeRealisation: "en_tete" },
    { partial: true },
  );
  assert.equal(modePatch.modeRealisation, "en_tete");
  assert.equal(modePatch.nbEssais, "en_tete");
});

test("normalise un import legacy avant toute transaction", () => {
  const payload = validateLegacyImportPayload({
    participants: [{
      id: "p1",
      nom: "Dupont",
      prenom: "Alice",
      passport: "sans",
    }],
    ropes: [{ numeroCorde: 0, couleurCorde: "Blanche", actif: true }],
    routes: [{
      id: "v1",
      numeroCorde: "",
      couleurPrises: "Rouge",
      cotationReference: "6a",
      tags: ["dalle", "technique"],
    }],
    sessions: [{
      id: "s1",
      date: "2026-08-09",
      slot: "midi",
      participantIds: ["p1"],
    }],
    realisations: [{
      participantId: "p1",
      sessionId: "s1",
      voieId: "v1",
      dateRealisation: "2026-08-09",
      styleRealisation: "en_tete",
      rating: 4,
    }],
  });

  assert.equal(payload.routes[0].numeroCorde, 0);
  assert.equal(payload.ropes[0].numeroCorde, 0);
  assert.equal(payload.routes[0].nomOuvreur, "Inconnu");
  assert.deepEqual(payload.routes[0].tags, ["dalle", "technique"]);
  assert.equal(payload.realisations[0].id, "real-import-1");
  assert.equal(payload.realisations[0].rating, 4);
  assert.equal(payload.realisations[0].modeRealisation, "en_tete");
});

test("refuse une corde legacy hors de la plage autorisée", () => {
  assert.throws(
    () => validateLegacyImportPayload({
      participants: [{ nom: "Dupont", prenom: "Alice" }],
      ropes: [{ numeroCorde: 22 }],
    }),
    ValidationError,
  );
});

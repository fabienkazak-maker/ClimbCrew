import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAppData,
  normalizeParticipant,
  normalizeRealisation,
  normalizeRoute,
  normalizeSession,
} from "../src/lib/normalize.js";

test("normalise les textes, emails, passeports et booléens d'un participant", () => {
  const participant = normalizeParticipant({
    id: 42,
    nom: "  DUPONT ",
    prenom: " Alice ",
    email: " Alice@Example.COM ",
    passport: "Découverte",
    sexe: "F",
    cotisation: "oui",
    ffme: "0",
    can_admin: 1,
  });

  assert.deepEqual(
    {
      id: participant.id,
      nom: participant.nom,
      prenom: participant.prenom,
      email: participant.email,
      passport: participant.passport,
      sexe: participant.sexe,
      cotisation: participant.cotisation,
      ffme: participant.ffme,
      canAdmin: participant.canAdmin,
    },
    {
      id: "42",
      nom: "DUPONT",
      prenom: "Alice",
      email: "alice@example.com",
      passport: "decouverte",
      sexe: "f",
      cotisation: true,
      ffme: false,
      canAdmin: true,
    },
  );
});

test("normalise une séance et dédoublonne les inscrits", () => {
  const session = normalizeSession({
    id: 7,
    date: "2026-08-09T12:00:00Z",
    slot: "MIDI",
    status: "ENCADREE",
    participant_ids: [1, "1", 2, null],
    encadrant_id: 9,
  });

  assert.equal(session.id, "7");
  assert.equal(session.date, "2026-08-09");
  assert.equal(session.slot, "midi");
  assert.equal(session.status, "encadree");
  assert.deepEqual(session.participantIds, ["1", "2"]);
  assert.equal(session.encadrantId, "9");
});

test("normalise les anciennes voies sans corde et leurs valeurs par défaut", () => {
  const route = normalizeRoute({
    id: "route-1",
    numero_corde: "",
    cotation_reference: "6a",
    cotation_ajustee: "",
    couleur_prises: " Rouge ",
    moulinette_only: "non",
  });

  assert.equal(route.numeroCorde, 0);
  assert.equal(route.cotationReference, "6a");
  assert.equal(route.cotationAjustee, "6a");
  assert.equal(route.couleurPrises, "Rouge");
  assert.equal(route.moulinetteOnly, false);
  assert.equal(route.active, true);
});

test("normalise une réalisation legacy et déduit son mode", () => {
  const realisation = normalizeRealisation({
    id: 5,
    participant_id: 10,
    voie_id: 20,
    session_id: 30,
    date_realisation: "2026-08-09T10:30:00Z",
    style_realisation: "EN_TETE",
    cotation_proposee: "6b",
  });

  assert.equal(realisation.id, "5");
  assert.equal(realisation.participantId, "10");
  assert.equal(realisation.voieId, "20");
  assert.equal(realisation.sessionId, "30");
  assert.equal(realisation.dateRealisation, "2026-08-09");
  assert.equal(realisation.modeRealisation, "en_tete");
  assert.equal(realisation.styleRealisation, "en_tete");
  assert.equal(realisation.cotationProposee, "6b");
});

test("normalise le mode stocké séparément du critère", () => {
  const lead = normalizeRealisation({
    id: "r1",
    participant_id: "p1",
    voie_id: "v1",
    session_id: "s1",
    date_realisation: "2026-08-09",
    style_realisation: "a_vue",
    nb_essais: "en_tete",
  });
  const topRope = normalizeRealisation({
    id: "r2",
    participant_id: "p1",
    voie_id: "v1",
    session_id: "s1",
    date_realisation: "2026-08-09",
    style_realisation: "flash",
    nb_essais: "moulinette",
  });

  assert.equal(lead.modeRealisation, "en_tete");
  assert.equal(lead.styleRealisation, "a_vue");
  assert.equal(topRope.modeRealisation, "moulinette");
  assert.equal(topRope.styleRealisation, "flash");
});

test("normalise toutes les collections et écarte les lignes sans identifiant", () => {
  const state = normalizeAppData({
    participants: [{ id: 1, nom: "A" }, { nom: "invalide" }],
    sessions: [{ id: "s1", participantIds: [1] }],
    ropes: [{ numeroCorde: 0 }],
    routes: [{ id: "v1", numeroCorde: "" }],
    realisations: [{ id: "r1", participantId: 1, voieId: "v1" }],
  });

  assert.equal(state.participants.length, 1);
  assert.equal(state.sessions[0].participantIds[0], "1");
  assert.equal(state.ropes[0].numeroCorde, 0);
  assert.equal(state.routes[0].numeroCorde, 0);
  assert.equal(state.realisations[0].participantId, "1");
});

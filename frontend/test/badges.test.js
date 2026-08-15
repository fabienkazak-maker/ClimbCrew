import test from "node:test";
import assert from "node:assert/strict";
import { calculateParticipantBadges, calculateSafetyBadges } from "../src/lib/badges.js";

function earned(input, id) {
  return calculateParticipantBadges(input).find((badge) => badge.id === id)?.earned;
}

test("badges de première réussite", () => {
  const routesById = { r1: { id: "r1", numeroCorde: 1, cotationReference: "6a", tags: ["dalle"] } };
  const realisations = [{ id: "x1", voieId: "r1", modeRealisation: "en_tete", styleRealisation: "a_vue" }];
  const input = { realisations, routesById, sessions: [] };
  assert.equal(earned(input, "premiere_croix"), true);
  assert.equal(earned(input, "premiere_tete"), true);
  assert.equal(earned(input, "premier_a_vue"), true);
  assert.equal(earned(input, "club_6a"), true);
  assert.equal(earned(input, "premiere_moulinette"), false);
});

test("moulinette et critère flash sont indépendants", () => {
  const routesById = { r1: { id: "r1", numeroCorde: 1, cotationReference: "5c", tags: [] } };
  const realisations = [{ id: "x1", voieId: "r1", modeRealisation: "moulinette", styleRealisation: "flash" }];
  const input = { realisations, routesById, sessions: [] };
  assert.equal(earned(input, "premiere_moulinette"), true);
  assert.equal(earned(input, "premier_flash"), true);
  assert.equal(earned(input, "premiere_tete"), false);
});

test("Cristal est plafonné au nombre de voies existantes", () => {
  const routesById = {
    r1: { id: "r1", numeroCorde: 1, cotationReference: "6a", tags: ["dalle", "technique"] },
    r2: { id: "r2", numeroCorde: 2, cotationReference: "6a", tags: ["devers", "physique"] },
    r3: { id: "r3", numeroCorde: 3, cotationReference: "6a", tags: ["a_doigts", "continuite"] },
  };
  const sessions = Array.from({ length: 25 }, (_, index) => ({
    id: `s${index + 1}`,
    date: `2026-07-${String((index % 28) + 1).padStart(2, "0")}`,
    slot: "soir",
  }));
  const twoRoutes = [
    { id: "x1", voieId: "r1", modeRealisation: "en_tete", styleRealisation: "a_vue" },
    { id: "x2", voieId: "r2", modeRealisation: "en_tete", styleRealisation: "travaillee" },
  ];
  assert.equal(earned({ realisations: twoRoutes, routesById, sessions }, "cristal"), false);

  const allRoutes = [
    ...twoRoutes,
    { id: "x3", voieId: "r3", modeRealisation: "en_tete", styleRealisation: "flash" },
  ];
  const cristal = calculateParticipantBadges({ realisations: allRoutes, routesById, sessions })
    .find((badge) => badge.id === "cristal");
  assert.equal(cristal.earned, true);
  assert.match(cristal.condition, /Réussir 3 voies actuelles/);
});


test("badges de jours d'inscription après trois séances passées", () => {
  const sessions = [
    { id: "ma1", date: "2026-07-07", slot: "midi" },
    { id: "ma2", date: "2026-07-14", slot: "midi" },
    { id: "ma3", date: "2026-07-21", slot: "midi" },
    { id: "je1", date: "2026-07-02", slot: "midi" },
    { id: "je2", date: "2026-07-09", slot: "midi" },
    { id: "je3", date: "2026-07-16", slot: "midi" },
    { id: "am1", date: "2026-07-01", slot: "matin" },
    { id: "am2", date: "2026-07-08", slot: "matin" },
    { id: "am3", date: "2026-07-15", slot: "matin" },
    { id: "pm1", date: "2026-07-03", slot: "soir" },
    { id: "pm2", date: "2026-07-10", slot: "soir" },
  ];
  const input = { realisations: [], routesById: {}, sessions, now: new Date("2026-08-15T12:00:00") };
  assert.equal(earned(input, "mardi_midi"), true);
  assert.equal(earned(input, "jeudi_midi"), true);
  assert.equal(earned(input, "matin"), true);
  assert.equal(earned(input, "soir"), false);
});


test("badges progressifs de vol et d’assurage aux seuils 1, 5, 10 et 50", () => {
  const ownFlights = Array.from({ length: 10 }, (_, index) => ({ id: `v${index}`, chute: true }));
  const retainedFlights = Array.from({ length: 50 }, (_, index) => ({
    id: `a${index}`,
    chute: true,
    assureurId: index < 50 ? "p1" : "p2",
  }));
  const badges = calculateSafetyBadges({
    participantId: "p1",
    realisations: ownFlights,
    allRealisations: retainedFlights,
  });
  const byId = Object.fromEntries(badges.map((badge) => [badge.id, badge]));

  assert.equal(byId.vol_1.earned, true);
  assert.equal(byId.vol_5.earned, true);
  assert.equal(byId.vol_10.earned, true);
  assert.equal(byId.vol_50.earned, false);
  assert.equal(byId.assurage_1.earned, true);
  assert.equal(byId.assurage_5.earned, true);
  assert.equal(byId.assurage_10.earned, true);
  assert.equal(byId.assurage_50.earned, true);
});

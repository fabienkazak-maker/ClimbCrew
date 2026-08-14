import test from "node:test";
import assert from "node:assert/strict";
import { calculateParticipantBadges } from "../src/lib/badges.js";

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

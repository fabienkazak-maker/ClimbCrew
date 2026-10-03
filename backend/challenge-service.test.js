import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateChallengeRanking,
  challengeBadgeDistinction,
  findMatchingRoutes,
  normalizeChallengeCriteria,
} from "./challenge-service.js";

test("normalizeChallengeCriteria accepte couleur, ouvreur et combinaison", () => {
  assert.deepEqual(normalizeChallengeCriteria({ color: " Jaune " }), { color: "Jaune", opener: "", activeOnly: true });
  assert.deepEqual(normalizeChallengeCriteria({ opener: " Sylvain ", activeOnly: false }), { color: "", opener: "Sylvain", activeOnly: false });
  assert.deepEqual(normalizeChallengeCriteria({ color: "Jaune", opener: "Sylvain" }), { color: "Jaune", opener: "Sylvain", activeOnly: true });
});

test("normalizeChallengeCriteria refuse un challenge sans critère", () => {
  assert.throws(() => normalizeChallengeCriteria({}), /au moins une couleur ou un ouvreur/i);
});

test("findMatchingRoutes accepte une couleur seule avec ouvreur vide", async () => {
  const db = {
    async query(sql, values) {
      assert.match(sql, /couleur_prises/);
      assert.deepEqual(values, ["Rose", "", true]);
      return { rows: [{ id: "rose-1", couleurPrises: "Rose", nomOuvreur: "" }] };
    },
  };
  const routes = await findMatchingRoutes(db, { color: "Rose", opener: "", activeOnly: true });
  assert.equal(routes.length, 1);
  assert.equal(routes[0].id, "rose-1");
});

test("challengeBadgeDistinction différencie podium et participation", () => {
  assert.equal(challengeBadgeDistinction(1), "or");
  assert.equal(challengeBadgeDistinction(2), "argent");
  assert.equal(challengeBadgeDistinction(3), "bronze");
  assert.equal(challengeBadgeDistinction(4), "participation");
});

test("calculateChallengeRanking compte chaque voie réussie une seule fois et départage par date", async () => {
  const calls = [];
  const db = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: [
        { id: "a1", participantId: "1", voieId: "r1", dateRealisation: "2026-10-02", styleRealisation: "a_vue", modeRealisation: "en_tete", prenom: "Alice", nom: "Alpha" },
        { id: "a2", participantId: "1", voieId: "r1", dateRealisation: "2026-10-03", styleRealisation: "flash", modeRealisation: "en_tete", prenom: "Alice", nom: "Alpha" },
        { id: "a3", participantId: "1", voieId: "r2", dateRealisation: "2026-10-04", styleRealisation: "travaillee", modeRealisation: "moulinette", prenom: "Alice", nom: "Alpha" },
        { id: "b1", participantId: "2", voieId: "r1", dateRealisation: "2026-10-02", styleRealisation: "a_vue", modeRealisation: "en_tete", prenom: "Bob", nom: "Beta" },
        { id: "b2", participantId: "2", voieId: "r2", dateRealisation: "2026-10-03", styleRealisation: "flash", modeRealisation: "en_tete", prenom: "Bob", nom: "Beta" },
        { id: "c1", participantId: "3", voieId: "r1", dateRealisation: "2026-10-02", styleRealisation: "projet", modeRealisation: "en_tete", prenom: "Chloé", nom: "Gamma" },
      ] };
    },
  };
  const ranking = await calculateChallengeRanking(db, { startsOn: "2026-10-01", endsOn: "2026-10-31" }, [{ id: "r1" }, { id: "r2" }]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].values, [["r1", "r2"], "2026-10-01", "2026-10-31"]);
  assert.deepEqual(ranking.map(({ participantId, score, rank, finalScoringAt }) => ({ participantId, score, rank, finalScoringAt })), [
    { participantId: "2", score: 2, rank: 1, finalScoringAt: "2026-10-03" },
    { participantId: "1", score: 2, rank: 2, finalScoringAt: "2026-10-04" },
  ]);
  assert.deepEqual(ranking[1].completedRouteIds.sort(), ["r1", "r2"]);
});

test("calculateChallengeRanking transmet la date de début qui exclut l'historique", async () => {
  const db = { async query(_sql, values) { assert.equal(values[1], "2026-10-05"); assert.equal(values[2], null); return { rows: [] }; } };
  const ranking = await calculateChallengeRanking(db, { startsOn: "2026-10-05", endsOn: null }, [{ id: "r1" }]);
  assert.deepEqual(ranking, []);
});

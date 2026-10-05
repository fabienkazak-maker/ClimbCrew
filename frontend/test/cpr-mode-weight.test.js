import test from "node:test";
import assert from "node:assert/strict";

import { GRADES, calculateSimpleCpr } from "../src/lib/domain.js";

test("le CPR pondère la moulinette à 85 % sans bonus lié au critère", () => {
  const now = new Date("2026-10-05T12:00:00Z").getTime();
  const routesById = { v1: { id: "v1", cotationAjustee: "6a" } };

  const lead = calculateSimpleCpr([
    {
      id: "lead",
      voieId: "v1",
      dateRealisation: "2026-10-04",
      modeRealisation: "en_tete",
      styleRealisation: "a_vue",
    },
  ], routesById, now);

  const workedLead = calculateSimpleCpr([
    {
      id: "worked",
      voieId: "v1",
      dateRealisation: "2026-10-04",
      modeRealisation: "en_tete",
      styleRealisation: "travaillee",
    },
  ], routesById, now);

  const topRope = calculateSimpleCpr([
    {
      id: "top",
      voieId: "v1",
      dateRealisation: "2026-10-04",
      modeRealisation: "moulinette",
      styleRealisation: "a_vue",
    },
  ], routesById, now);

  const gradeIndex = GRADES.indexOf("6a");
  assert.equal(lead.averageIndex, gradeIndex);
  assert.equal(workedLead.averageIndex, gradeIndex);
  assert.equal(topRope.averageIndex, gradeIndex * 0.85);
  assert.equal(lead.currentGrade, "6a");
  assert.equal(topRope.currentGrade, "5c");
});

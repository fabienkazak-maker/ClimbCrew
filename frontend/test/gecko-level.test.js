import test from "node:test";
import assert from "node:assert/strict";
import { getGeckoLevel, getGeckoLevelInfo } from "../src/lib/gecko-level.js";

test("le Gecko évolue selon le CPR", () => {
  assert.equal(getGeckoLevel("4c"), 1);
  assert.equal(getGeckoLevel("5c"), 2);
  assert.equal(getGeckoLevel("6a+"), 3);
  assert.equal(getGeckoLevel("6b"), 4);
  assert.equal(getGeckoLevel("6c"), 5);
  assert.equal(getGeckoLevel("6c+"), 6);
  assert.equal(getGeckoLevel("7a+"), 7);
  assert.equal(getGeckoLevel("7b"), 8);
});

test("la variante féminine adapte le libellé sans changer le niveau", () => {
  assert.deepEqual(getGeckoLevelInfo("6c", "F"), {
    level: 5,
    variant: "feminine",
    label: "Confirmée",
  });
  assert.equal(getGeckoLevelInfo("6c", "H").label, "Confirmé");
});

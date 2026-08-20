import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la surcouche de création de compte affiche bien la règle à 8 caractères", async () => {
  const source = await readFile(new URL("../src/issue-13-access-page.js", import.meta.url), "utf8");
  assert.match(source, /8 caractères minimum/);
  assert.doesNotMatch(source, /12 caractères/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la date de la vue semaine mobile reste dans le flux et ne chevauche pas les séances", async () => {
  // mobile-week-date-fix.css a été fusionné dans la feuille de style consolidée
  // styles/index.css lors de la restructuration du frontend.
  const styles = await readFile(new URL("../src/styles/index.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /\.week-day-card > \.week-day-header[\s\S]*position: static !important/);
  assert.match(styles, /\.week-day-card > \.week-day-header[\s\S]*margin: 0 0 12px !important/);
  assert.match(styles, /\.week-day-card > \.week-day-sessions[\s\S]*position: relative/);
});

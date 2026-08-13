import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { makeRealisationRatingOptional } from "../vite.config.js";

const here = dirname(fileURLToPath(import.meta.url));

test("l'évaluation d'une réalisation est facultative", async () => {
  const source = await readFile(resolve(here, "../src/App.jsx"), "utf8");
  const transformed = makeRealisationRatingOptional(source);

  assert.match(
    transformed,
    /if \(!newRealisation\.participantId \|\| !newRealisation\.selectedDay \|\| !newRealisation\.voieId\) \{/,
  );
  assert.doesNotMatch(
    transformed,
    /!newRealisation\.voieId \|\| !newRealisation\.rating/,
  );
  assert.match(
    transformed,
    /\.\.\.\(newRealisation\.rating \? \{ rating: newRealisation\.rating \} : \{\}\)/,
  );
  assert.match(transformed, /Évaluation de la voie \(facultative\)/);
  assert.match(
    transformed,
    /disabled=\{!newRealisation\.selectedDay \|\| !newRealisation\.participantId \|\| !newRealisation\.voieId \|\| modalEligibleParticipants\.length === 0\}/,
  );
});

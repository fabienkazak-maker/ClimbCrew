import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { APP_VERSION, APP_VERSION_PATTERN } from "../src/lib/version.js";

test("la version respecte le format aammjj.iii", () => {
  assert.match(APP_VERSION, APP_VERSION_PATTERN);
});

test("App.jsx ne définit plus sa propre version", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /const\s+APP_VERSION\s*=/);
  assert.match(source, /import\s+\{\s*APP_VERSION\s*\}\s+from\s+"\.\/lib\/version\.js"/);
  assert.match(source, /applicationVersion:\s*APP_VERSION/);
  assert.match(source, /climbcrew_export_\$\{APP_VERSION\}\.json/);
});

test("le script d'amélioration ne réécrit plus la version dans le DOM", async () => {
  const source = await readFile(
    new URL("../src/release-version-enhancements.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /APP_VERSION_LABEL|updateVisibleVersion|const\s+APP_VERSION/);
});

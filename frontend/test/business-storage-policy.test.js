import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mainSource = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const policySource = await readFile(new URL("../src/business-storage-policy.js", import.meta.url), "utf8");

test("la politique de stockage est chargée avant App", () => {
  const policyImport = mainSource.indexOf('import "./business-storage-policy.js"');
  const appImport = mainSource.indexOf('import App from "./App.jsx"');
  assert.ok(policyImport >= 0, "la politique de stockage doit être importée");
  assert.ok(appImport >= 0, "App doit être importé");
  assert.ok(policyImport < appImport, "la politique doit être installée avant App");
});

test("le cache métier historique est supprimé et ne peut plus être réécrit en mode API", () => {
  assert.match(policySource, /LEGACY_BUSINESS_STORAGE_KEY\s*=\s*"climbcrew_local_data_v2"/);
  assert.match(policySource, /if \(!USE_API/);
  assert.match(policySource, /localStorage\.removeItem\(LEGACY_BUSINESS_STORAGE_KEY\)/);
  assert.match(policySource, /Storage\.prototype\.setItem\s*=/);
  assert.match(policySource, /String\(key\) === LEGACY_BUSINESS_STORAGE_KEY/);
});

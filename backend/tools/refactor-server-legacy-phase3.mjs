// Script temporaire de migration des écritures de réalisations hors de server.js.
// Déclenchement contrôlé après installation du workflow de branche.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const validationImportBefore = `import {\n  validateParticipantPayload,\n  validateRealisationPayload,\n} from "./validation.js";\nimport { installRouteManagementRoutes } from "./route-management-routes.js";`;
const validationImportAfter = `import { validateParticipantPayload } from "./validation.js";\nimport { installRouteManagementRoutes } from "./route-management-routes.js";\nimport { installRealisationManagementRoutes } from "./realisation-management-routes.js";`;
if (source.includes(validationImportBefore)) {
  source = source.replace(validationImportBefore, validationImportAfter);
} else if (!source.includes("installRealisationManagementRoutes")) {
  throw new Error("Imports attendus introuvables");
}

const blockStart = source.indexOf('app.post("/realisations", requireAuth, async');
const blockEnd = source.indexOf("function participantDbToApi(row)", blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc d'écriture des réalisations introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  'app.post("/realisations"',
  'app.put("/realisations/:id"',
  'app.delete("/realisations/:id"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Route attendue absente du bloc: ${expected}`);
}
source = `${source.slice(0, blockStart)}installRealisationManagementRoutes(app, { requireAuth, pool });\n\n${source.slice(blockEnd)}`;

for (const forbidden of [
  'app.post("/realisations", requireAuth, async',
  'app.put("/realisations/:id", requireAuth, async',
  'app.delete("/realisations/:id", requireAuth, async',
  "validateRealisationPayload(",
]) {
  if (source.includes(forbidden)) throw new Error(`Écriture legacy encore présente: ${forbidden}`);
}
if (!source.includes('app.get("/realisations", requireAuth, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage GET /realisations perdu");
}
if (!source.includes("installRealisationManagementRoutes(app, { requireAuth, pool });")) {
  throw new Error("Installation du module réalisations absente");
}

await writeFile(serverUrl, source, "utf8");
console.log(`Extraction phase 3 terminée : ${extracted.split("\n").length} lignes sorties de server.js`);

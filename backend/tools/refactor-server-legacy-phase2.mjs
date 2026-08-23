import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const validationImportBefore = `import {\n  validateParticipantPayload,\n  validateRealisationPayload,\n  validateRoutePayload,\n} from "./validation.js";`;
const validationImportAfter = `import {\n  validateParticipantPayload,\n  validateRealisationPayload,\n} from "./validation.js";\nimport { installRouteManagementRoutes } from "./route-management-routes.js";`;
if (source.includes(validationImportBefore)) {
  source = source.replace(validationImportBefore, validationImportAfter);
} else if (!source.includes(`installRouteManagementRoutes`)) {
  throw new Error("Import de validation attendu introuvable");
}

const blockStart = source.indexOf("function ropeDbToApi(row)");
const blockEnd = source.indexOf('app.get("/", (_req, res) => {', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc cordes/voies introuvable dans server.js");
}
const extracted = source.slice(blockStart, blockEnd);
if (!extracted.includes('app.get("/ropes"') || !extracted.includes('app.delete("/routes/:id"')) {
  throw new Error("Bornes du bloc cordes/voies incohérentes");
}
source = `${source.slice(0, blockStart)}installRouteManagementRoutes(app, { requireAuth, requireAdmin, pool });\n\n${source.slice(blockEnd)}`;

for (const forbidden of [
  'function ropeDbToApi(row)',
  'function routeDbToApi(row)',
  'app.get("/ropes", requireAuth, async',
  'app.get("/routes", requireAuth, async',
  'app.post("/routes", requireAuth, requireAdmin, async',
  'app.put("/routes/:id", requireAuth, requireAdmin, async',
  'app.delete("/routes/:id", requireAuth, requireAdmin, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Bloc extrait encore présent: ${forbidden}`);
}
if (!source.includes("installRouteManagementRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module voies absente");
}

await writeFile(serverUrl, source, "utf8");
console.log(`Extraction phase 2 terminée : ${extracted.split("\n").length} lignes sorties de server.js`);

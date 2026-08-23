// Script temporaire : extrait GET/DELETE /sessions de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installRealisationManagementRoutes } from "./realisation-management-routes.js";`;
const importLine = `import { installSessionReadRoutes } from "./session-read-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

// Le convertisseur n'est utilisé que par GET /sessions et part avec ce module.
const helperStart = source.indexOf("function sessionDbToApi(row, participantIds = [])");
const helperEnd = source.indexOf("installRouteManagementRoutes", helperStart);
if (helperStart < 0 || helperEnd < 0 || helperEnd <= helperStart) {
  throw new Error("Helper sessionDbToApi introuvable");
}
source = `${source.slice(0, helperStart)}${source.slice(helperEnd)}`;

const getStart = source.indexOf('app.get("/sessions", requireAuth, async');
const putShell = source.indexOf('app.put("/sessions/:id", requireAuth, legacyReplacedRoute);', getStart);
if (getStart < 0 || putShell < 0 || putShell <= getStart) throw new Error("GET /sessions introuvable");
source = `${source.slice(0, getStart)}installSessionReadRoutes(app, { requireAuth, requireAdmin, pool });\n${source.slice(putShell)}`;

const deleteStart = source.indexOf('app.delete("/sessions/:id", requireAuth, requireAdmin, async');
const nextComment = source.indexOf("\n\n/**", deleteStart);
if (deleteStart < 0 || nextComment < 0 || nextComment <= deleteStart) throw new Error("DELETE /sessions/:id introuvable");
source = `${source.slice(0, deleteStart)}${source.slice(nextComment + 2)}`;

for (const forbidden of [
  "function sessionDbToApi(row, participantIds = [])",
  'app.get("/sessions", requireAuth, async',
  'app.delete("/sessions/:id", requireAuth, requireAdmin, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Fragment session encore présent: ${forbidden}`);
}
if (!source.includes('app.put("/sessions/:id", requireAuth, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage PUT /sessions/:id perdu");
}
if (!source.includes("installSessionReadRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module sessions absente");
}

await writeFile(serverUrl, source, "utf8");

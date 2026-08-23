// Script temporaire : extrait POST /participants de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

source = source.replace(`import { validateParticipantPayload } from "./validation.js";\n`, "");
const importAnchor = `import { installSessionReadRoutes } from "./session-read-routes.js";`;
const importLine = `import { installParticipantCreationRoute } from "./participant-creation-route.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const helperStart = source.indexOf("function participantDbToApi(row)");
const helperEnd = source.indexOf("installRouteManagementRoutes", helperStart);
if (helperStart < 0 || helperEnd < 0 || helperEnd <= helperStart) throw new Error("Helper participantDbToApi introuvable");
source = `${source.slice(0, helperStart)}${source.slice(helperEnd)}`;

const postStart = source.indexOf('app.post("/participants", requireAuth, requireAdmin, async');
const putShell = source.indexOf('app.put("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);', postStart);
if (postStart < 0 || putShell < 0 || putShell <= postStart) throw new Error("POST /participants introuvable");
source = `${source.slice(0, postStart)}installParticipantCreationRoute(app, { requireAuth, requireAdmin, pool });\n${source.slice(putShell)}`;

for (const forbidden of [
  "function participantDbToApi(row)",
  'app.post("/participants", requireAuth, requireAdmin, async',
  "validateParticipantPayload(",
]) {
  if (source.includes(forbidden)) throw new Error(`Fragment participant encore présent: ${forbidden}`);
}
if (!source.includes('app.get("/participants", requireAuth, legacyReplacedRoute);')) throw new Error("GET participants perdu");
if (!source.includes('app.put("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);')) throw new Error("PUT participant perdu");
if (!source.includes("installParticipantCreationRoute(app, { requireAuth, requireAdmin, pool });")) throw new Error("Installation participant absente");

await writeFile(serverUrl, source, "utf8");

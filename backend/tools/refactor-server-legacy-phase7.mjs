// Script temporaire : extrait les demandes d'évolution hors de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installBroadcastMessageRoutes } from "./broadcast-message-routes.js";`;
const importLine = `import { installEvolutionRequestRoutes } from "./evolution-request-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const helperStart = source.indexOf("function cleanEvolutionText(value, maxLength)");
const broadcastInstall = source.indexOf("installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });", helperStart);
if (helperStart < 0 || broadcastInstall < 0 || broadcastInstall <= helperStart) {
  throw new Error("Helpers des demandes d'évolution introuvables");
}
source = `${source.slice(0, helperStart)}${source.slice(broadcastInstall)}`;

const blockStart = source.indexOf('app.get("/evolution-requests", requireAuth, async');
const blockEnd = source.indexOf('app.get("/realisations", requireAuth, legacyReplacedRoute);', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc des demandes d'évolution introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  'app.get("/evolution-requests"',
  'app.post("/evolution-requests"',
  'app.put("/evolution-requests/:id/vote"',
  'app.post("/evolution-requests/:id/comments"',
  'app.put("/admin/evolution-requests/:id/status"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Route attendue absente du bloc: ${expected}`);
}
source = `${source.slice(0, blockStart)}installEvolutionRequestRoutes(app, { requireAuth, requireAdmin, pool });\n\n${source.slice(blockEnd)}`;

for (const forbidden of [
  "function cleanEvolutionText(value, maxLength)",
  "async function evolutionRequestsForUser(userId)",
  'app.get("/evolution-requests", requireAuth, async',
  'app.post("/evolution-requests", requireAuth, async',
  'app.put("/evolution-requests/:id/vote", requireAuth, async',
  'app.post("/evolution-requests/:id/comments", requireAuth, async',
  'app.put("/admin/evolution-requests/:id/status", requireAuth, requireAdmin, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Fragment évolution encore présent: ${forbidden}`);
}
if (!source.includes("installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module de diffusion perdue");
}
if (!source.includes("installEvolutionRequestRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module demandes d'évolution absente");
}

await writeFile(serverUrl, source, "utf8");

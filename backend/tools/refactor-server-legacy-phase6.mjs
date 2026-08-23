// Script temporaire : extrait les routes de diffusion des messages hors de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installParticipantCreationRoute } from "./participant-creation-route.js";`;
const importLine = `import { installBroadcastMessageRoutes } from "./broadcast-message-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf("/**\n * Messages ponctuels diffusés par les administrateurs.");
const blockEnd = source.indexOf('app.get("/evolution-requests", requireAuth, async', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc de diffusion des messages introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  'app.post("/admin/broadcast-messages"',
  'app.get("/auth/broadcast-messages/pending"',
  'app.post("/auth/broadcast-messages/:id/read"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Route attendue absente du bloc: ${expected}`);
}
source = `${source.slice(0, blockStart)}installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });\n\n${source.slice(blockEnd)}`;

for (const forbidden of [
  'app.post("/admin/broadcast-messages", requireAuth, requireAdmin, async',
  'app.get("/auth/broadcast-messages/pending", requireAuth, async',
  'app.post("/auth/broadcast-messages/:id/read", requireAuth, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Route de diffusion encore présente: ${forbidden}`);
}
if (!source.includes("installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module de diffusion absente");
}
if (!source.includes('app.get("/evolution-requests", requireAuth, async')) {
  throw new Error("Bloc des demandes d'évolution perdu");
}

await writeFile(serverUrl, source, "utf8");

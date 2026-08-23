// Script temporaire : extrait la consultation des logs administrateur hors de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installAuthSessionRoutes } from "./auth-session-routes.js";`;
const importLine = `import { installAdminAccessLogRoutes } from "./admin-access-log-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf('app.get("/admin/auth/logs", requireAuth, requireAdmin, async');
const blockEnd = source.indexOf('app.post("/admin/auth/users/:id/approve", requireAuth, requireAdmin, legacyReplacedRoute);', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc des logs administrateur introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
if (!extracted.includes("from access_logs al") || !extracted.includes("limit $1")) {
  throw new Error("Contenu du bloc des logs incohérent");
}
source = `${source.slice(0, blockStart)}installAdminAccessLogRoutes(app, { requireAuth, requireAdmin, pool });\n\n${source.slice(blockEnd)}`;

if (source.includes('app.get("/admin/auth/logs", requireAuth, requireAdmin, async')) {
  throw new Error("Route des logs encore présente dans server.js");
}
if (!source.includes("installAdminAccessLogRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation du module logs absente");
}
if (!source.includes('app.post("/admin/auth/users/:id/approve", requireAuth, requireAdmin, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage d'approbation des comptes perdu");
}

await writeFile(serverUrl, source, "utf8");

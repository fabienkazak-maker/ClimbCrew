// Script temporaire : extrait les routes de maintenance de la base hors de server.js.
// Ce fichier sert uniquement à appliquer de façon déterministe la phase 12.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { createAuthMiddleware } from "./auth-middleware.js";`;
const importLine = `import { installDatabaseMaintenanceRoutes } from "./database-maintenance-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf('app.get("/setup-db", requireSetupAccess, async');
const blockEnd = source.indexOf('/**\n * Auth\n */', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc de maintenance de base introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  'app.get("/db-status", requireSetupAccess, async',
  "await ensureSchema()",
  "await ensureDefaultAdmin()",
  "current_database() as database",
]) {
  if (!extracted.includes(expected)) throw new Error(`Garantie attendue absente: ${expected}`);
}

const install = `installDatabaseMaintenanceRoutes(app, {\n  requireSetupAccess,\n  ensureSchema,\n  ensureDefaultAdmin,\n  pool,\n  firstAdminEmail: FIRST_ADMIN_EMAIL,\n});\n\n`;
source = `${source.slice(0, blockStart)}${install}${source.slice(blockEnd)}`;

for (const forbidden of [
  'app.get("/setup-db", requireSetupAccess, async',
  'app.get("/db-status", requireSetupAccess, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Route maintenance encore présente: ${forbidden}`);
}
if (!source.includes("installDatabaseMaintenanceRoutes(app, {")) {
  throw new Error("Installation du module maintenance absente");
}
if (!source.includes('app.get("/health", legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage health perdu");
}

await writeFile(serverUrl, source, "utf8");

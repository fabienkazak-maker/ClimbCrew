// Script temporaire : extrait la suppression administrateur d'un compte hors de server.js.
// Ce fichier sert uniquement à appliquer de façon déterministe la phase 10.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installAdminAccessLogRoutes } from "./admin-access-log-routes.js";`;
const importLine = `import { installAdminAccountDeleteRoute } from "./admin-account-delete-route.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf('app.delete("/admin/auth/users/:id", requireAuth, requireAdmin, async');
const blockEnd = source.indexOf('app.post("/admin/auth/users/:id/reactivate", requireAuth, requireAdmin, legacyReplacedRoute);', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc de suppression de compte introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  "select id, email, role, status from users where id = $1 for update",
  "select count(*)::integer as count from users where role = 'admin' and status = 'active'",
  "delete from users where id = $1",
  'eventType: "account_deleted"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Garantie attendue absente: ${expected}`);
}

source = `${source.slice(0, blockStart)}installAdminAccountDeleteRoute(app, { requireAuth, requireAdmin, pool, logAccess });\n\n${source.slice(blockEnd)}`;

if (source.includes('app.delete("/admin/auth/users/:id", requireAuth, requireAdmin, async')) {
  throw new Error("Ancien handler de suppression encore présent");
}
if (!source.includes("installAdminAccountDeleteRoute(app, { requireAuth, requireAdmin, pool, logAccess });")) {
  throw new Error("Installation du module de suppression absente");
}
if (!source.includes('app.post("/admin/auth/users/:id/revoke", requireAuth, requireAdmin, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage revoke perdu");
}
if (!source.includes('app.post("/admin/auth/users/:id/reactivate", requireAuth, requireAdmin, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage reactivate perdu");
}

await writeFile(serverUrl, source, "utf8");

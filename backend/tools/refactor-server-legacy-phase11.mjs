// Script temporaire : extrait le middleware d'authentification hors de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installAdminAccountDeleteRoute } from "./admin-account-delete-route.js";`;
const importLine = `import { createAuthMiddleware } from "./auth-middleware.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf("async function loadSessionFromToken(rawToken)");
const blockEnd = source.indexOf("installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });", blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc du middleware d'authentification introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  "async function requireAuth(req, res, next)",
  "function requireAdmin(req, res, next)",
  'req.headers["x-csrf-token"]',
  'session.status !== "active"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Garantie attendue absente: ${expected}`);
}

const install = `const { requireAuth, requireAdmin } = createAuthMiddleware({\n  pool,\n  hashToken,\n  getRequestToken,\n  isSafeMethod,\n  getCookie,\n  csrfCookieName: CSRF_COOKIE_NAME,\n  constantTimeEqual,\n  serializeUser,\n});\n\n`;
source = `${source.slice(0, blockStart)}${install}${source.slice(blockEnd)}`;

for (const forbidden of [
  "async function loadSessionFromToken(rawToken)",
  "async function requireAuth(req, res, next)",
  "function requireAdmin(req, res, next)",
]) {
  if (source.includes(forbidden)) throw new Error(`Middleware encore présent dans server.js: ${forbidden}`);
}
if (!source.includes("const { requireAuth, requireAdmin } = createAuthMiddleware({")) {
  throw new Error("Initialisation du middleware extraite absente");
}
if (!source.includes("installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool });")) {
  throw new Error("Installation des routes de diffusion perdue");
}

await writeFile(serverUrl, source, "utf8");

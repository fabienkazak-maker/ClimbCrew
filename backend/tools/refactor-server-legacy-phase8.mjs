// Script temporaire : extrait les routes de session authentifiée hors de server.js.
import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const importAnchor = `import { installEvolutionRequestRoutes } from "./evolution-request-routes.js";`;
const importLine = `import { installAuthSessionRoutes } from "./auth-session-routes.js";`;
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error("Ancre d'import introuvable");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const blockStart = source.indexOf('app.get("/auth/me", requireAuth, async');
const blockEnd = source.indexOf('app.post("/auth/request-access", authRateLimit, legacyReplacedRoute);', blockStart);
if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) {
  throw new Error("Bloc de session authentifiée introuvable");
}
const extracted = source.slice(blockStart, blockEnd);
for (const expected of [
  'app.get("/auth/me"',
  'app.get("/auth/csrf"',
  'app.put("/auth/theme"',
  'app.post("/auth/logout"',
]) {
  if (!extracted.includes(expected)) throw new Error(`Route attendue absente du bloc: ${expected}`);
}

const install = `installAuthSessionRoutes(app, {\n  requireAuth,\n  pool,\n  randomToken,\n  nowPlus,\n  sessionDurationMs: SESSION_DURATION_MS,\n  setCsrfCookie,\n  serializeUser,\n  logAccess,\n  clearSessionCookie,\n});\n\n`;
source = `${source.slice(0, blockStart)}${install}${source.slice(blockEnd)}`;

for (const forbidden of [
  'app.get("/auth/me", requireAuth, async',
  'app.get("/auth/csrf", requireAuth, async',
  'app.put("/auth/theme", requireAuth, async',
  'app.post("/auth/logout", requireAuth, async',
]) {
  if (source.includes(forbidden)) throw new Error(`Route de session encore présente: ${forbidden}`);
}
if (!source.includes('app.post("/auth/login", authRateLimit, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage login perdu");
}
if (!source.includes('app.post("/auth/request-access", authRateLimit, legacyReplacedRoute);')) {
  throw new Error("Point d'ancrage request-access perdu");
}
if (!source.includes("installAuthSessionRoutes(app, {")) {
  throw new Error("Installation du module de session absente");
}

await writeFile(serverUrl, source, "utf8");

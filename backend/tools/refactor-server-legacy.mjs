import { readFile, writeFile } from "node:fs/promises";

const serverUrl = new URL("../server.js", import.meta.url);
let source = await readFile(serverUrl, "utf8");

const anchor = `const app = express();\napp.disable("x-powered-by");`;
const placeholder = `const app = express();\napp.disable("x-powered-by");\n\n/**\n * Point d'ancrage temporaire pour les routes dont le contrôleur historique a\n * déjà été remplacé par admin-user-enhancements.js au démarrage normal.\n * Cette fonction ne doit jamais être atteinte avec \`npm start\`.\n */\nfunction legacyReplacedRoute(_req, res) {\n  return res.status(503).json({ error: "Contrôleur moderne non initialisé" });\n}`;

if (!source.includes("function legacyReplacedRoute")) {
  if (!source.includes(anchor)) throw new Error("Ancre Express introuvable");
  source = source.replace(anchor, placeholder);
}

function replaceRouteBlock(start, replacement) {
  if (source.includes(replacement)) return;
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Route legacy introuvable: ${start}`);
  const nextRouteIndex = source.indexOf("\napp.", startIndex + start.length);
  if (nextRouteIndex < 0) throw new Error(`Route suivante introuvable après: ${start}`);
  const removed = source.slice(startIndex, nextRouteIndex);
  if (removed.length > 40_000) throw new Error(`Bloc anormalement grand pour: ${start}`);
  source = `${source.slice(0, startIndex)}${replacement}\n${source.slice(nextRouteIndex + 1)}`;
  console.log(`${start}: ${removed.split("\n").length} lignes remplacées`);
}

const routes = [
  [
    `app.post("/admin/import-data"`,
    `app.post("/admin/import-data", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.get("/admin/export-data"`,
    `app.get("/admin/export-data", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.get("/realisations"`,
    `app.get("/realisations", requireAuth, legacyReplacedRoute);`,
  ],
  [
    `app.get("/health"`,
    `app.get("/health", legacyReplacedRoute);`,
  ],
  [
    `app.post("/auth/login"`,
    `app.post("/auth/login", authRateLimit, legacyReplacedRoute);`,
  ],
  [
    `app.post("/auth/request-access"`,
    `app.post("/auth/request-access", authRateLimit, legacyReplacedRoute);`,
  ],
  [
    `app.post("/auth/forgot-password"`,
    `app.post("/auth/forgot-password", resetRateLimit, legacyReplacedRoute);`,
  ],
  [
    `app.post("/auth/reset-password"`,
    `app.post("/auth/reset-password", resetRateLimit, legacyReplacedRoute);`,
  ],
  [
    `app.get("/admin/auth/users"`,
    `app.get("/admin/auth/users", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.post("/admin/auth/users/:id/approve"`,
    `app.post("/admin/auth/users/:id/approve", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.post("/admin/auth/users/:id/revoke"`,
    `app.post("/admin/auth/users/:id/revoke", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.post("/admin/auth/users/:id/reactivate"`,
    `app.post("/admin/auth/users/:id/reactivate", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.post("/admin/auth/users/:id/reset-token"`,
    `app.post("/admin/auth/users/:id/reset-token", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.get("/participants"`,
    `app.get("/participants", requireAuth, legacyReplacedRoute);`,
  ],
  [
    `app.put("/participants/:id"`,
    `app.put("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.patch("/participants/me/profile"`,
    `app.patch("/participants/me/profile", requireAuth, legacyReplacedRoute);`,
  ],
  [
    `app.delete("/participants/:id"`,
    `app.delete("/participants/:id", requireAuth, requireAdmin, legacyReplacedRoute);`,
  ],
  [
    `app.put("/sessions/:id"`,
    `app.put("/sessions/:id", requireAuth, legacyReplacedRoute);`,
  ],
];

// Remplacement du bas vers le haut pour que les positions des routes précédentes
// ne soient jamais perturbées par la réduction d'un bloc situé plus loin.
const locatedRoutes = routes.map(([start, replacement]) => ({
  start,
  replacement,
  index: source.indexOf(start),
}));
for (const route of locatedRoutes) {
  if (route.index < 0 && !source.includes(route.replacement)) {
    throw new Error(`Route attendue absente: ${route.start}`);
  }
}
locatedRoutes
  .sort((left, right) => right.index - left.index)
  .forEach(({ start, replacement }) => replaceRouteBlock(start, replacement));

// Dépendances devenues mortes avec les handlers supprimés.
source = source.replace(`import { sendApprovalNotificationEmail } from "./admin-users/account-service.js";\n`, "");
source = source.replace("  ValidationError,\n", "");
source = source.replace("  validateSessionPayload,\n", "");
source = source.replace(/\nfunction firstLetter\(value = ""\) \{[\s\S]*?\n\}\n\nfunction isStrongPassword/, "\nfunction isStrongPassword");
source = source.replace(/\nasync function findParticipantId\(prenom, nom\) \{[\s\S]*?\n\}\n\nasync function loadSessionFromToken/, "\nasync function loadSessionFromToken");

const forbiddenLegacyFragments = [
  `eventType: "login_success"`,
  `message: "Demande d’accès enregistrée. Un administrateur doit l’approuver."`,
  `const customAvatarImage = String(req.body?.customAvatarImage || "");`,
  `const resolvedStatus = status || defaultSessionStatus(date, slot);`,
  `await sendApprovalNotificationEmail({ user: result.rows[0], req });`,
];
for (const fragment of forbiddenLegacyFragments) {
  if (source.includes(fragment)) throw new Error(`Fragment legacy encore présent: ${fragment}`);
}

await writeFile(serverUrl, source, "utf8");

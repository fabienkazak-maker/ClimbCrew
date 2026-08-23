import fs from "node:fs";

function fail(message) {
  console.error(`Validation source échouée : ${message}`);
  process.exitCode = 1;
}

const app = fs.readFileSync("frontend/src/App.jsx", "utf8");
const domain = fs.readFileSync("frontend/src/lib/domain.js", "utf8");
const dayStart = app.indexOf("const daySessions = useMemo");
const weekStart = app.indexOf("const weekDates = useMemo", dayStart);
const dayBlock = dayStart >= 0 && weekStart > dayStart ? app.slice(dayStart, weekStart) : "";
if (!dayBlock) fail("bloc daySessions introuvable");
if (dayBlock.includes("defaultSessionStatus(date, slot)")) fail("référence indéfinie date dans daySessions");
if (!dayBlock.includes("defaultSessionStatus(selectedDate, slot)")) fail("statut par défaut de daySessions non sécurisé");

const main = fs.readFileSync("frontend/src/main.jsx", "utf8");
if (!main.includes("<ErrorBoundary>")) fail("ErrorBoundary absent du point d’entrée React");

const backendPackage = JSON.parse(fs.readFileSync("backend/package.json", "utf8"));
const allowedBackendStartCommands = new Set([
  "node server.js",
  "node --import ./admin-user-enhancements.js server.js",
]);
if (!allowedBackendStartCommands.has(backendPackage.scripts?.start)) {
  fail("commande de démarrage backend non reconnue");
}
if (backendPackage.scripts?.start.includes("admin-user-enhancements.js")
    && !fs.existsSync("backend/admin-user-enhancements.js")) {
  fail("préchargement admin-user-enhancements.js introuvable");
}
if (fs.existsSync("backend/server-runtime.js")) fail("server-runtime.js ne doit plus être utilisé");

if (app.includes("multi-signup") || app.includes('name="participantIds"')) fail("la sélection multiple des inscriptions est encore présente");
if (app.includes("Sans nom") || app.includes("Voie sans nom")) fail("un libellé Sans nom est encore affiché");
if (!domain.includes("function formatRouteName(route)")) fail("formatage ouvreur puis nom de voie absent");
if (!app.includes("async function deleteRealisation(realisation)")) fail("suppression de réalisation absente de la progression");
if (!app.includes("state.routes.map((route) => normalizeRopeNumber(route.numeroCorde))")) fail("les cordes vides ne sont pas masquées");

const enhancements = fs.readFileSync("frontend/src/climbcrew-enhancements.js", "utf8");
if (enhancements.includes("l’ocre apparaît sur fond marron")) fail("mention ocre sur fond marron encore présente dans la FAQ");

const backend = fs.readFileSync("backend/server.js", "utf8");
const expressIntegration = fs.readFileSync("backend/admin-users/express-integration.js", "utf8");
const sessionAuthorization = fs.readFileSync("backend/admin-users/session-authorization-service.js", "utf8");

// PUT /sessions/:id est désormais un simple point d'ancrage dans server.js.
// Les règles métier doivent être contrôlées dans le contrôleur réellement injecté.
if (!backend.includes('app.put("/sessions/:id", requireAuth, legacyReplacedRoute);')) {
  fail("point d’ancrage de mise à jour des séances absent du backend");
}
if (!expressIntegration.includes('path === "/sessions/:id"')
    || !expressIntegration.includes("updateSessionWithAuthorization")) {
  fail("contrôleur sécurisé des séances non branché");
}
if (!sessionAuthorization.includes("function defaultSessionStatus(date, slot)")) {
  fail("règle de statut par défaut absente du contrôleur de séances");
}
if (!sessionAuthorization.includes("const resolvedStatus = requested.status")) {
  fail("statut de séance non résolu dans le contrôleur actif");
}
if (!sessionAuthorization.includes("const newlyAdded =")
    || !sessionAuthorization.includes("assertLibreEligibility")) {
  fail("contrôle des nouvelles inscriptions en séance libre absent");
}
if (!sessionAuthorization.includes('requestedStatus === "fermee"')) {
  fail("blocage des nouvelles inscriptions en séance fermée absent");
}

if (!backend.includes('app.delete("/realisations/:id"')) fail("API de suppression des réalisations absente");

if (!process.exitCode) console.log("Validation source ClimbCrew réussie.");

import fs from "node:fs";

function fail(message) {
  console.error(`Validation source échouée : ${message}`);
  process.exitCode = 1;
}

const app = fs.readFileSync("frontend/src/App.jsx", "utf8");
const dayStart = app.indexOf("const daySessions = useMemo");
const weekStart = app.indexOf("const weekDates = useMemo", dayStart);
const dayBlock = dayStart >= 0 && weekStart > dayStart ? app.slice(dayStart, weekStart) : "";
if (!dayBlock) fail("bloc daySessions introuvable");
if (dayBlock.includes("defaultSessionStatus(date, slot)")) fail("référence indéfinie date dans daySessions");
if (!dayBlock.includes("defaultSessionStatus(selectedDate, slot)")) fail("statut par défaut de daySessions non sécurisé");

const main = fs.readFileSync("frontend/src/main.jsx", "utf8");
if (!main.includes("<ErrorBoundary>")) fail("ErrorBoundary absent du point d’entrée React");

const backendPackage = JSON.parse(fs.readFileSync("backend/package.json", "utf8"));
if (backendPackage.scripts?.start !== "node server.js") fail("le backend ne démarre pas directement server.js");
if (fs.existsSync("backend/server-runtime.js")) fail("server-runtime.js ne doit plus être utilisé");

if (app.includes("multi-signup") || app.includes('name="participantIds"')) fail("la sélection multiple des inscriptions est encore présente");
if (app.includes("Sans nom") || app.includes("Voie sans nom")) fail("un libellé Sans nom est encore affiché");
if (!app.includes("function formatRouteName(route)")) fail("formatage ouvreur puis nom de voie absent");
if (!app.includes("async function deleteRealisation(realisation)")) fail("suppression de réalisation absente de la progression");
if (!app.includes("state.ropes.filter((rope) => state.routes.some")) fail("les cordes vides ne sont pas masquées");

const enhancements = fs.readFileSync("frontend/src/climbcrew-enhancements.js", "utf8");
if (enhancements.includes("l’ocre apparaît sur fond marron")) fail("mention ocre sur fond marron encore présente dans la FAQ");

const backend = fs.readFileSync("backend/server.js", "utf8");
if (!backend.includes("function defaultSessionStatus(date, slot)")) fail("règle de statut par défaut absente du backend");
if (!backend.includes("const resolvedStatus = status || defaultSessionStatus(date, slot);")) fail("statut de séance non résolu dans le backend");
if (!backend.includes("const newlyAddedParticipantIds")) fail("contrôle des nouvelles inscriptions en séance libre absent");
if (!backend.includes('app.delete("/realisations/:id"')) fail("API de suppression des réalisations absente");

if (!process.exitCode) console.log("Validation source ClimbCrew réussie.");

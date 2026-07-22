import fs from "node:fs";
import path from "node:path";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function replaceOnce(source, oldText, newText, marker) {
  if (marker && source.includes(marker)) return source;
  if (!source.includes(oldText)) {
    throw new Error(`Motif introuvable pendant la consolidation : ${oldText.slice(0, 120)}`);
  }
  return source.replace(oldText, newText);
}

function integrateBackend() {
  const serverPath = "backend/server.js";
  let source = read(serverPath);

  source = replaceOnce(
    source,
`function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}
`,
`function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function defaultSessionStatus(date, slot) {
  const day = new Date(\`${'${date}'}T12:00:00\`).getDay();
  return slot === "midi" && (day === 2 || day === 4) ? "encadree" : "libre";
}
`,
    "function defaultSessionStatus(date, slot)"
  );

  source = replaceOnce(
    source,
`      status = "fermee",
      encadrantId = null,
`,
`      status = null,
      encadrantId = null,
`,
`status = null,
      encadrantId = null,`
  );

  source = replaceOnce(
    source,
`    if (!id || !date || !slot) {
      return res.status(400).json({ error: "id, date and slot are required" });
    }

    await client.query("begin");
`,
`    if (!id || !date || !slot) {
      return res.status(400).json({ error: "id, date and slot are required" });
    }

    const resolvedStatus = status || defaultSessionStatus(date, slot);

    await client.query("begin");
`,
    "const resolvedStatus = status || defaultSessionStatus(date, slot);"
  );

  source = replaceOnce(
    source,
`      [id, date, slot, status, encadrantId || null, referentId || null]
    );

    await client.query("delete from session_participants where session_id = $1", [id]);

    const uniqueParticipantIds = [...new Set(participantIds.map(String))];

    if (status === "libre" && uniqueParticipantIds.length) {
      const eligibleResult = await client.query(
        \`select id from participants where id = any($1::bigint[]) and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')\`,
        [uniqueParticipantIds]
      );
      const eligibleIds = new Set(eligibleResult.rows.map((row) => String(row.id)));
      const ineligibleIds = uniqueParticipantIds.filter((participantId) => !eligibleIds.has(participantId));
      if (ineligibleIds.length) {
        await client.query("rollback");
        return res.status(400).json({
          error: "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu.",
        });
      }
    }
`,
`      [id, date, slot, resolvedStatus, encadrantId || null, referentId || null]
    );

    const previousParticipantsResult = await client.query(
      \`select participant_id from session_participants where session_id = $1\`,
      [id]
    );
    const previousParticipantIds = new Set(
      previousParticipantsResult.rows.map((row) => String(row.participant_id))
    );

    await client.query("delete from session_participants where session_id = $1", [id]);

    const uniqueParticipantIds = [...new Set(participantIds.map(String))];
    const newlyAddedParticipantIds = uniqueParticipantIds.filter(
      (participantId) => !previousParticipantIds.has(participantId)
    );

    if (resolvedStatus === "libre" && newlyAddedParticipantIds.length) {
      const eligibleResult = await client.query(
        \`select id from participants where id = any($1::bigint[]) and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')\`,
        [newlyAddedParticipantIds]
      );
      const eligibleIds = new Set(eligibleResult.rows.map((row) => String(row.id)));
      const ineligibleIds = newlyAddedParticipantIds.filter((participantId) => !eligibleIds.has(participantId));
      if (ineligibleIds.length) {
        await client.query("rollback");
        return res.status(400).json({
          error: "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu pour toute nouvelle inscription.",
        });
      }
    }
`,
    "const previousParticipantsResult = await client.query("
  );

  write(serverPath, source);

  const packagePath = "backend/package.json";
  const packageJson = JSON.parse(read(packagePath));
  packageJson.scripts.start = "node server.js";
  write(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  if (fs.existsSync("backend/server-runtime.js")) fs.rmSync("backend/server-runtime.js");
}

function fixFrontend() {
  const appPath = "frontend/src/App.jsx";
  let source = read(appPath);
  const start = source.indexOf("  const daySessions = useMemo(() => {");
  const end = source.indexOf("  const weekDates = useMemo(() => {", start);
  if (start < 0 || end < 0) throw new Error("Bloc daySessions introuvable");

  let block = source.slice(start, end);
  const broken = "status: defaultSessionStatus(date, slot),";
  const fixed = "status: defaultSessionStatus(selectedDate, slot),";
  if (block.includes(broken)) block = block.replace(broken, fixed);
  else if (!block.includes(fixed)) throw new Error("Expression de statut daySessions introuvable");
  source = source.slice(0, start) + block + source.slice(end);
  write(appPath, source);

  const enhancementsPath = "frontend/src/climbcrew-enhancements.js";
  let enhancements = read(enhancementsPath);
  const normalizeFunction = `function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "");
}
`;
  if (!enhancements.includes("function setTextIfChanged(element, value)")) {
    if (!enhancements.includes(normalizeFunction)) throw new Error("Fonction normalize introuvable");
    enhancements = enhancements.replace(
      normalizeFunction,
      `${normalizeFunction}\nfunction setTextIfChanged(element, value) {\n  if (element.textContent !== value) element.textContent = value;\n}\n`
    );
  }

  const faqColors = "Dans les inscriptions, le fond correspond au passeport. Le cadre vert indique une cotisation réglée et le rouge une cotisation non réglée. Le contour est plein avec une licence FFME ; sans licence, il alterne la couleur significative avec du noir. En séance Libre, un fond hachuré signale une personne déjà inscrite sans passeport requis ; les hachures disparaissent si la séance redevient Encadrée. Pour les voies, le texte est noir sur blanc, l’ocre apparaît sur fond marron et un cadre rouge indique une voie uniquement en moulinette.";
  const faqCpr = "Le CPR de ClimbCrew représente le niveau récent. Le calcul retient les réalisations des 90 derniers jours, classe les performances selon la cotation de la voie corrigée par le style, puis conserve les 10 meilleures. Coefficients : à vue 1,25 ; flash 1,20 ; en tête 1,00 ; moulinette 0,85 ; travaillée 0,75 ; avec repos 0,60 ; projet 0,30 ; non enchaînée 0,20 ; essai/test 0,10. La moyenne des indices pondérés est arrondie puis reconvertie en cotation. Une voie facile d’échauffement ne fait donc pas baisser le CPR si elle n’entre pas dans les 10 meilleures performances récentes.";

  for (const value of [faqColors, faqCpr]) {
    const oldLine = `answer.textContent = ${JSON.stringify(value)};`;
    const newLine = `setTextIfChanged(answer, ${JSON.stringify(value)});`;
    if (enhancements.includes(oldLine)) enhancements = enhancements.replace(oldLine, newLine);
    else if (!enhancements.includes(newLine)) throw new Error("Mise à jour FAQ introuvable");
  }
  write(enhancementsPath, enhancements);

  write("frontend/src/ErrorBoundary.jsx", `import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur de rendu ClimbCrew", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{ minHeight: "100vh", padding: 24, background: "#0f172a", color: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
        <section style={{ maxWidth: 720, margin: "10vh auto", padding: 24, border: "1px solid #475569", borderRadius: 16, background: "#111827" }}>
          <h1>ClimbCrew ne peut pas afficher cette page</h1>
          <p>Une erreur inattendue est survenue. Recharge la page. Si le problème persiste, transmets le message ci-dessous à l’administrateur.</p>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 12, borderRadius: 8, background: "#020617" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>
            Recharger
          </button>
        </section>
      </main>
    );
  }
}
`);

  write("frontend/src/main.jsx", `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./climbcrew-enhancements.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
`);
}

function addValidation() {
  write("scripts/validate-source.mjs", `import fs from "node:fs";

function fail(message) {
  console.error(\`Validation source échouée : \${message}\`);
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

const backend = fs.readFileSync("backend/server.js", "utf8");
if (!backend.includes("function defaultSessionStatus(date, slot)")) fail("règle de statut par défaut absente du backend");
if (!backend.includes("const resolvedStatus = status || defaultSessionStatus(date, slot);")) fail("statut de séance non résolu dans le backend");
if (!backend.includes("const newlyAddedParticipantIds")) fail("contrôle des nouvelles inscriptions en séance libre absent");

if (!process.exitCode) console.log("Validation source ClimbCrew réussie.");
`);

  write(".github/workflows/validate-linux.yml", `name: Validate ClimbCrew Linux

on:
  pull_request:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: climbcrew-linux-validation-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Validate Linux build and runtime
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Configure Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Validate source consistency
        run: node scripts/validate-source.mjs

      - name: Validate backend syntax
        run: node --check backend/server.js

      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci

      - name: Build frontend
        working-directory: frontend
        run: npm run build

      - name: Prepare validation environment
        run: cp .env.production.example .env.production

      - name: Validate Docker Compose
        run: docker compose --env-file .env.production -f docker-compose.prod.yml config

      - name: Build Linux images
        run: docker compose --env-file .env.production -f docker-compose.prod.yml build

      - name: Start stack and smoke test
        shell: bash
        run: |
          docker compose --env-file .env.production -f docker-compose.prod.yml up -d
          for attempt in {1..40}; do
            if curl --fail --silent http://127.0.0.1:3000/health >/dev/null \\
              && curl --fail --silent http://127.0.0.1:8080/ >/dev/null; then
              echo "ClimbCrew smoke test succeeded."
              exit 0
            fi
            sleep 3
          done
          docker compose --env-file .env.production -f docker-compose.prod.yml ps
          docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200
          exit 1

      - name: Stop validation stack
        if: always()
        run: docker compose --env-file .env.production -f docker-compose.prod.yml down -v
`);
}

function removeTemporaryAutomation() {
  for (const filePath of [
    ".github/workflows/apply-robustness-once.yml",
    ".github/workflows/apply-robustness-pr.yml",
    ".github/scripts/apply-robustness.mjs",
  ]) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath);
  }
}

integrateBackend();
fixFrontend();
addValidation();
removeTemporaryAutomation();
console.log("Consolidation ClimbCrew appliquée.");

import fs from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) process.exit(result.status || 1);
}

// 1. Applique une dernière fois les transformations frontend existantes.
run("node", ["apply-evolutions.mjs"], { cwd: "frontend" });

// 2. Désactive définitivement le mode de simulation, quel que soit le paramètre URL.
const appPath = "frontend/src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");
const demoConstants = [...app.matchAll(/const\s+([A-Za-z0-9_]*DEMO[A-Za-z0-9_]*)\s*=\s*[^;]+;/g)];
for (const match of demoConstants) {
  app = app.replace(match[0], `const ${match[1]} = false;`);
}
app = app
  .replace(/\?demo=1/g, "")
  .replace(/Mode simulation/gi, "Mode démonstration désactivé")
  .replace(/simulation accessible/gi, "simulation supprimée");
fs.writeFileSync(appPath, app, "utf8");

// 3. Matérialise les règles backend directement dans server.js.
const runtimePath = "backend/server-runtime.js";
if (fs.existsSync(runtimePath)) {
  let transformer = fs.readFileSync(runtimePath, "utf8");
  transformer = transformer.replace(
    /const runtimeDir = fs\.mkdtempSync[\s\S]*$/,
    'fs.writeFileSync(new URL("./server.js", import.meta.url), source, "utf8");\nconsole.log("Règles de séance intégrées dans backend/server.js");\n'
  );
  const materializerPath = "backend/.materialize-server.mjs";
  fs.writeFileSync(materializerPath, transformer, "utf8");
  run("node", [".materialize-server.mjs"], { cwd: "backend" });
  fs.rmSync(materializerPath, { force: true });
}

// 4. Supprime les mécanismes temporaires : le code produit devient le code source normal de main.
const frontendPackagePath = "frontend/package.json";
const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, "utf8"));
delete frontendPackage.scripts.prebuild;
fs.writeFileSync(frontendPackagePath, `${JSON.stringify(frontendPackage, null, 2)}\n`, "utf8");

const backendPackagePath = "backend/package.json";
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, "utf8"));
backendPackage.scripts.start = "node server.js";
fs.writeFileSync(backendPackagePath, `${JSON.stringify(backendPackage, null, 2)}\n`, "utf8");

for (const file of [
  "frontend/apply-evolutions.mjs",
  "backend/server-runtime.js",
  "docs/SIMULATION.md",
  "frontend/src/demo-data.js",
]) {
  fs.rmSync(file, { force: true });
}

// Si App.jsx importait encore demo-data, l'échec est volontaire plutôt que de publier un build cassé.
const finalApp = fs.readFileSync(appPath, "utf8");
if (/demo-data/i.test(finalApp)) {
  throw new Error("Une référence à demo-data subsiste dans App.jsx ; nettoyage manuel requis.");
}

run("node", ["--check", "backend/server.js"]);
run("npm", ["install", "--package-lock=false", "--no-audit", "--no-fund"], { cwd: "frontend" });
run("npm", ["run", "build"], { cwd: "frontend" });
console.log("Évolutions intégrées nativement et simulation retirée.");

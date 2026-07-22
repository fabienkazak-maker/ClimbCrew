import fs from "node:fs";

const appPath = new URL("./src/App.jsx", import.meta.url);
let source = fs.readFileSync(appPath, "utf8");

// Le mode de simulation est définitivement désactivé, même si l'URL contient ?demo=1.
source = source.replace(
  /const\s+([A-Za-z0-9_]*DEMO[A-Za-z0-9_]*)\s*=\s*[^;]+;/g,
  (_match, variableName) => `const ${variableName} = false;`
);
source = source
  .replace(/\?demo=1/g, "")
  .replace(/Mode simulation/gi, "Simulation désactivée")
  .replace(/simulation accessible/gi, "simulation supprimée");

fs.writeFileSync(appPath, source, "utf8");

// Les fichiers documentaires de simulation ne sont pas conservés dans le build.
for (const relativePath of ["../docs/SIMULATION.md"]) {
  try {
    fs.rmSync(new URL(relativePath, import.meta.url), { force: true });
  } catch {
    // Absence normale si le fichier n'a jamais été généré.
  }
}

console.log("Mode simulation ClimbCrew désactivé.");

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayLength(value: unknown, key: string): number {
  return isRecord(value) && Array.isArray(value[key]) ? value[key].length : 0;
}

const sourcePath = path.resolve(process.argv[2] ?? "./App.jsx");
const targetPath = path.resolve(
  process.argv[3] ?? "./backend/import-data.json",
);
const source = await readFile(sourcePath, "utf8");
const match = source.match(/const\s+IMPORTED_DATA\s*=\s*(\{[\s\S]*?\});\s*\n/);
const serialized = match?.[1];
if (!serialized) {
  console.error("Constante IMPORTED_DATA introuvable");
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(serialized);
} catch {
  console.error("La constante IMPORTED_DATA contient un JSON invalide");
  process.exit(1);
}

await mkdir(path.dirname(targetPath), { recursive: true });
await writeFile(targetPath, JSON.stringify(data, null, 2), "utf8");
console.log("Fichier d’import généré");
console.log(`Participants : ${arrayLength(data, "participants")}`);
console.log(`Séances : ${arrayLength(data, "sessions")}`);
console.log(`Cordes : ${arrayLength(data, "ropes")}`);
console.log(`Voies : ${arrayLength(data, "routes")}`);
console.log(`Réalisations : ${arrayLength(data, "realisations")}`);

import { readFile } from "node:fs/promises";
import path from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredArray(value: Record<string, unknown>, key: string): unknown[] {
  const array = value[key];
  if (!Array.isArray(array)) throw new Error(`${key} doit être un tableau`);
  return array;
}

function countBy(rows: unknown[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const value = isRecord(row) ? String(row[key] ?? "") : "";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right, "fr"),
    ),
  );
}

const filePath = path.resolve(process.argv[2] ?? "./backend/import-data.json");
const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
if (!isRecord(parsed)) throw new Error("Le fichier doit contenir un objet");

const participants = requiredArray(parsed, "participants");
const sessions = requiredArray(parsed, "sessions");
const ropes = requiredArray(parsed, "ropes");
const routes = requiredArray(parsed, "routes");
const achievements = requiredArray(parsed, "realisations");
console.log("Validation import-data.json réussie");
console.log({
  participants: participants.length,
  sessions: sessions.length,
  ropes: ropes.length,
  routes: routes.length,
  realisations: achievements.length,
});
console.log("Passeports :", countBy(participants, "passport"));
console.log("Couleurs cordes :", countBy(ropes, "couleurCorde"));
console.log("Couleurs voies :", countBy(routes, "couleurPrises"));

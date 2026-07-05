import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Extrait la constante IMPORTED_DATA d'un ancien App.jsx ClimbCrew
 * et génère un fichier JSON importable par le backend.
 *
 * Usage :
 *   node tools/extract-legacy-data.mjs ./App.jsx ./backend/import-data.json
 */
const [, , sourceArg = './App.jsx', targetArg = './backend/import-data.json'] = process.argv;
const sourcePath = path.resolve(sourceArg);
const targetPath = path.resolve(targetArg);

const source = await fs.readFile(sourcePath, 'utf-8');
const match = source.match(/const\s+IMPORTED_DATA\s*=\s*(\{[\s\S]*?\});\s*\n/);
if (!match) {
  console.error(`Impossible de trouver const IMPORTED_DATA dans ${sourcePath}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(match[1]);
} catch (error) {
  console.error('La constante IMPORTED_DATA existe mais le JSON est invalide :', error);
  process.exit(1);
}

await fs.mkdir(path.dirname(targetPath), { recursive: true });
await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Fichier généré : ${targetPath}`);
console.log(`Participants : ${data.participants?.length || 0}`);
console.log(`Séances      : ${data.sessions?.length || 0}`);
console.log(`Cordes       : ${data.ropes?.length || 0}`);
console.log(`Voies        : ${data.routes?.length || 0}`);
console.log(`Réalisations : ${data.realisations?.length || 0}`);

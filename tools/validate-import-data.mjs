import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Valide rapidement un fichier import-data.json et affiche les couleurs importées.
 * Usage : node tools/validate-import-data.mjs ./backend/import-data.json
 */
const [, , fileArg = './backend/import-data.json'] = process.argv;
const filePath = path.resolve(fileArg);
const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

function countBy(rows, key) {
  return Object.fromEntries(
    Object.entries(rows.reduce((acc, row) => {
      const value = String(row[key] ?? '');
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {})).sort(([a], [b]) => a.localeCompare(b, 'fr'))
  );
}

const requiredArrays = ['participants', 'sessions', 'ropes', 'routes', 'realisations'];
for (const name of requiredArrays) {
  if (!Array.isArray(data[name])) {
    console.error(`Erreur : ${name} doit être un tableau.`);
    process.exit(1);
  }
}

console.log('Validation import-data.json OK');
console.log({
  participants: data.participants.length,
  sessions: data.sessions.length,
  ropes: data.ropes.length,
  routes: data.routes.length,
  realisations: data.realisations.length,
});
console.log('Passeports :', countBy(data.participants, 'passport'));
console.log('Couleurs cordes :', countBy(data.ropes, 'couleurCorde'));
console.log('Couleurs voies :', countBy(data.routes, 'couleurPrises'));

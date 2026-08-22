import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const mediaDir = path.join(frontendDir, "public", "media");
const partsDir = path.join(mediaDir, "startup-parts");
const outputPath = path.join(mediaDir, "climbcrew-startup.mp4");
const expectedSha256 = "7ae8867a8f0e56804b8e8a4df7752f656d8d777b49568c9cda99281e1b596430";

const partNames = (await readdir(partsDir))
  .filter((name) => name.startsWith("climbcrew-startup.mp4.part-"))
  .sort();

if (partNames.length !== 14) {
  throw new Error(
    `Intro ClimbCrew incomplète : 14 fragments attendus, ${partNames.length} trouvés.`,
  );
}

const video = Buffer.concat(
  await Promise.all(partNames.map((name) => readFile(path.join(partsDir, name)))),
);

const sha256 = createHash("sha256").update(video).digest("hex");
if (sha256 !== expectedSha256) {
  throw new Error(
    `Intro ClimbCrew corrompue : SHA-256 ${sha256} au lieu de ${expectedSha256}.`,
  );
}

await mkdir(mediaDir, { recursive: true });

let shouldWrite = true;
try {
  const current = await readFile(outputPath);
  shouldWrite = !current.equals(video);
} catch {
  // Le fichier généré n'existe pas encore.
}

if (shouldWrite) {
  await writeFile(outputPath, video);
  console.log(`Vidéo de lancement générée (${video.length} octets).`);
}

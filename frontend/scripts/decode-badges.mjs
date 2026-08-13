import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = "public/badges/badges-sprite.png";
const target = "dist/badges/badges-sprite.png";
const encoded = (await readFile(source, "utf8")).replace(/\s+/g, "");

if (!encoded.startsWith("iVBORw0KGgo")) {
  throw new Error("Sprite de badges Base64 invalide");
}

await mkdir("dist/badges", { recursive: true });
await writeFile(target, Buffer.from(encoded, "base64"));
console.log("Sprite des badges converti en PNG binaire.");

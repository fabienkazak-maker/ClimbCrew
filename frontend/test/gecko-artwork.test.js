import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const cssUrl = new URL("../src/styles/profile-gecko.css", import.meta.url);
const artworkUrl = new URL("../public/geckos/gecko-evolution.webp", import.meta.url);

test("Mon Profil utilise la planche Gecko illustrée", () => {
  const component = readFileSync(componentUrl, "utf8");
  const css = readFileSync(cssUrl, "utf8");
  const artwork = readFileSync(artworkUrl);
  const header = artwork.subarray(0, 12);

  assert.match(component, /profile-gecko-artwork/);
  assert.doesNotMatch(component, /<svg/);
  assert.match(css, /\/geckos\/gecko-evolution\.webp/);
  assert.match(css, /background-size:\s*800%\s+200%/);
  assert.ok(artwork.length > 12, "la planche Gecko ne doit pas être vide");
  assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP");
});

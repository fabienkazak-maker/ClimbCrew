import assert from "node:assert/strict";
import { statSync, readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const cssUrl = new URL("../src/styles/profile-gecko.css", import.meta.url);
const artworkUrl = new URL("../public/geckos/gecko-evolution.webp", import.meta.url);

test("Mon Profil utilise la planche Gecko illustrée", () => {
  const component = readFileSync(componentUrl, "utf8");
  const css = readFileSync(cssUrl, "utf8");
  const artwork = statSync(artworkUrl);

  assert.match(component, /profile-gecko-artwork/);
  assert.doesNotMatch(component, /<svg/);
  assert.match(css, /\/geckos\/gecko-evolution\.webp/);
  assert.match(css, /background-size:\s*800%\s+200%/);
  assert.ok(artwork.size > 100_000, "la planche Gecko doit contenir les illustrations HD");
});

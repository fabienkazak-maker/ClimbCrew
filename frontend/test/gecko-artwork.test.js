import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const geckoUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const badgesUrl = new URL("../src/components/ParticipantBadges.jsx", import.meta.url);
const geckoAtlasUrl = new URL("../public/media/geckos/gecko-atlas.webp", import.meta.url);
const badgeAtlasUrl = new URL("../public/media/badges/badge-atlas.webp", import.meta.url);

const CURRENT_BADGE_IDS = [
  "premiere_croix",
  "premiere_tete",
  "premiere_moulinette",
  "premier_a_vue",
  "premier_flash",
  "cap_5c",
  "club_6a",
  "club_6b",
  "club_6c",
  "club_7a",
  "explorateur",
  "tour_de_salle",
  "polyvalent",
  "habitue",
  "fidele",
  "oeil_ouvreur",
  "critique_voies",
  "collectionneur",
  "centurion",
  "cristal",
];

function assertWebp(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
}

test("les 16 avatars Gecko utilisent un vrai atlas WebP", () => {
  const source = readFileSync(geckoUrl, "utf8");
  const atlas = readFileSync(geckoAtlasUrl);

  assertWebp(atlas);
  assert.ok(atlas.length > 100_000);
  assert.match(source, /\/media\/geckos\/gecko-atlas\.webp/);
  assert.match(source, /columns:\s*8/);
  assert.match(source, /rows:\s*2/);
  assert.match(source, /variant === "feminine" \? 1 : 0/);
  assert.doesNotMatch(source, /GeckoArtwork/);
});

test("les 20 badges courants utilisent un vrai atlas WebP", () => {
  const source = readFileSync(badgesUrl, "utf8");
  const atlas = readFileSync(badgeAtlasUrl);

  assertWebp(atlas);
  assert.ok(atlas.length > 20_000);
  assert.match(source, /\/media\/badges\/badge-atlas\.webp/);
  assert.match(source, /BADGE_ATLAS_COLUMNS\s*=\s*5/);
  assert.match(source, /BADGE_ATLAS_ROWS\s*=\s*4/);

  for (const id of CURRENT_BADGE_IDS) {
    assert.match(source, new RegExp(`${id}:\\s*\\d+`), `mapping image manquant pour ${id}`);
  }
});

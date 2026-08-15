import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const geckoUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const badgesUrl = new URL("../src/components/ParticipantBadges.jsx", import.meta.url);
const geckoAtlasUrl = new URL("../src/assets/gecko-avatar-atlas.js", import.meta.url);
const badgeAtlasUrl = new URL("../src/assets/badge-atlas.js", import.meta.url);

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
  assert.ok(buffer.length > 1024, "l'asset WebP ne doit pas être vide ou tronqué");
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
}

test("les 16 avatars Gecko utilisent un atlas WebP embarqué complet", () => {
  const source = readFileSync(geckoUrl, "utf8");
  const atlasModule = readFileSync(geckoAtlasUrl, "utf8");
  const encodedAtlas = atlasModule.match(/base64,([A-Za-z0-9+/=]+)"/)?.[1];

  assert.ok(encodedAtlas, "l'atlas Gecko embarqué doit contenir une image encodée");
  const atlas = Buffer.from(encodedAtlas, "base64");
  assertWebp(atlas);

  const declaredRiffSize = atlas.readUInt32LE(4) + 8;
  assert.equal(
    atlas.length,
    declaredRiffSize,
    "l'atlas Gecko ne doit pas être tronqué",
  );

  assert.match(source, /GECKO_ATLAS_DATA_URI/);
  assert.match(source, /<img/);
  assert.match(source, /src=\{GECKO_ATLAS\}/);
  assert.match(source, /GECKO_ATLAS_COLUMNS\s*=\s*4/);
  assert.match(source, /GECKO_ATLAS_ROWS\s*=\s*4/);
  assert.match(source, /variant === "feminine" \? 8 : 0/);
  assert.doesNotMatch(source, /\/media\/geckos\/gecko-atlas\.webp/);
});

test("les 20 badges courants utilisent un atlas WebP embarqué complet", () => {
  const source = readFileSync(badgesUrl, "utf8");
  const atlasModule = readFileSync(badgeAtlasUrl, "utf8");
  const encodedAtlas = atlasModule.match(/base64,([A-Za-z0-9+/=]+)"/)?.[1];

  assert.ok(encodedAtlas, "l'atlas des badges doit contenir une image encodée");
  const atlas = Buffer.from(encodedAtlas, "base64");
  assertWebp(atlas);

  const declaredRiffSize = atlas.readUInt32LE(4) + 8;
  assert.equal(
    atlas.length,
    declaredRiffSize,
    "l'atlas des badges ne doit pas être tronqué",
  );

  assert.match(source, /BADGE_ATLAS_DATA_URI/);
  assert.match(source, /participant-badge-atlas-tile/);
  assert.match(source, /backgroundImage/);
  assert.match(source, /backgroundSize/);
  assert.match(source, /backgroundPosition/);
  assert.match(source, /BADGE_ATLAS_COLUMNS\s*=\s*5/);
  assert.match(source, /BADGE_ATLAS_ROWS\s*=\s*4/);
  assert.doesNotMatch(source, /\/media\/badges\/badge-atlas\.webp/);

  for (const id of CURRENT_BADGE_IDS) {
    assert.ok(source.includes(`${id}:`), `mapping image manquant pour ${id}`);
  }
});

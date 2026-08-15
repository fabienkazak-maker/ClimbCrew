import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const geckoUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const badgesUrl = new URL("../src/components/ParticipantBadges.jsx", import.meta.url);
const avatarRoot = new URL("../public/media/avatars/split/", import.meta.url);
const badgeRoot = new URL("../public/media/badges/", import.meta.url);

const AVATAR_NAMES = [
  "gecko",
  "bouquetin",
  "capucin",
  "ecureuil",
  "paresseux",
  "leopard-neiges",
  "orang-outan",
  "pieuvre",
  "robot",
  "astronaute",
  "capybara",
  "chevalier",
  "humain-homme",
  "humain-femme"
];
const BADGE_IDS = [
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
  "cristal"
];

function assertWebp(url) {
  const buffer = readFileSync(url);
  assert.ok(buffer.length > 1024, `asset vide ou tronqué : ${url.pathname}`);
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
}

test("chaque avatar et chaque blason utilisent un fichier indépendant", () => {
  const source = readFileSync(geckoUrl, "utf8");

  for (const name of AVATAR_NAMES) {
    assertWebp(new URL(`${name}.webp`, avatarRoot));
    assertWebp(new URL(`${name}-crest.webp`, avatarRoot));
    assert.match(source, new RegExp(`avatarAsset\\("${name}"\\)`));
    assert.match(source, new RegExp(`avatarAsset\\("${name}-crest"\\)`));
  }

  assert.match(source, /profile-animal-image/);
  assert.match(source, /src=\{animal\.image\}/);
  assert.match(source, /src=\{animal\.crest\}/);
  assert.doesNotMatch(source, /AtlasTile|backgroundImage|backgroundPosition|crestIndex|avatarIndex/);
});

test("chaque badge utilise un fichier indépendant sans atlas", () => {
  const source = readFileSync(badgesUrl, "utf8");

  BADGE_IDS.forEach((id, index) => {
    assertWebp(new URL(`badge-${String(index).padStart(2, "0")}.webp`, badgeRoot));
    assert.ok(source.includes(`${id}:`), `mapping image manquant pour ${id}`);
  });

  assert.match(source, /participant-badge-image/);
  assert.match(source, /BADGE_IMAGE_PATH/);
  for (const role of ["encadrant", "referent", "ouvreur"]) {
    assertWebp(new URL(`../public/media/avatars/split/role-${role}.webp`, import.meta.url));
    assert.match(source, new RegExp(`role_${role}`));
  }

  assert.doesNotMatch(source, /BADGE_ATLAS|backgroundImage|backgroundPosition|BADGE_IMAGE_INDEX/);
});

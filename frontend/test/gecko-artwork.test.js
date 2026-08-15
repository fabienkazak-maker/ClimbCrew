import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const componentUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const splitRoot = new URL("../public/media/avatars/split/", import.meta.url);
const profileRoot = new URL("../public/media/avatars/profile/", import.meta.url);

const EXISTING_AVATARS = [
  "gecko", "bouquetin", "capucin", "ecureuil", "paresseux", "leopard-neiges",
  "orang-outan", "pieuvre", "robot", "astronaute", "capybara", "chevalier",
  "humain-homme", "humain-femme",
];
const NEW_AVATARS = [
  "avatar-fraise", "avatar-banane", "avatar-kiwi", "avatar-pasteque", "avatar-ananas",
  "avatar-chausson", "avatar-mousqueton", "avatar-gourde", "avatar-casque", "avatar-sac-magnesie",
];
const CRESTS = ["blason-cristal", "blason-sommet", "blason-corde", "blason-mousqueton", "blason-prise", "blason-etoile"];

test("les avatars utilisent des fichiers indépendants et le blason est absent du profil", () => {
  const source = readFileSync(componentUrl, "utf8");

  EXISTING_AVATARS.forEach((name) => assert.ok(existsSync(new URL(`${name}.webp`, splitRoot)), name));
  NEW_AVATARS.forEach((name) => {
    const url = new URL(`${name}.svg`, profileRoot);
    assert.ok(existsSync(url), name);
    assert.match(readFileSync(url, "utf8"), /<svg/);
    assert.ok(source.includes(name), `mapping manquant pour ${name}`);
  });
  CRESTS.forEach((name) => assert.ok(existsSync(new URL(`${name}.svg`, profileRoot)), name));

  assert.match(source, /AVATAR_OPTIONS/);
  assert.doesNotMatch(source, /CREST_OPTIONS|Blason|crestId|profile-avatar-crest/);
  assert.doesNotMatch(source, /gecko-crest|animal\.crest|avatarIndex|crestIndex/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const geckoUrl = new URL("../src/components/ProfileGecko.jsx", import.meta.url);
const badgesUrl = new URL("../src/components/ParticipantBadges.jsx", import.meta.url);
const cssUrl = new URL("../src/styles/profile-gecko.css", import.meta.url);

test("avatars et badges peuvent afficher de vrais assets WebP", () => {
  const gecko = readFileSync(geckoUrl, "utf8");
  const badges = readFileSync(badgesUrl, "utf8");
  const css = readFileSync(cssUrl, "utf8");

  assert.match(gecko, /gecko-neutral-4\.webp/);
  assert.match(gecko, /<img/);
  assert.match(gecko, /profile-gecko-real-image/);
  assert.match(css, /object-fit:\s*contain/);

  assert.match(badges, /premiere_tete:\s*"\/media\/badges\/premiere_tete\.webp"/);
  assert.match(badges, /function BadgeVisual/);
  assert.match(badges, /<img/);
  assert.match(badges, /<BadgeIllustration badge=\{badge\} \/>/);
});

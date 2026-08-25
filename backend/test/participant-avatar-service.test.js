import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeCustomAvatarDataUrl,
  resolveCustomAvatarUpdate,
} from "../admin-users/participant-avatar-service.js";

function minimalWebpDataUrl() {
  const buffer = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([4, 0, 0, 0]),
    Buffer.from("WEBP", "ascii"),
  ]);
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

test("un WebP valide est décodé avant stockage", () => {
  const buffer = decodeCustomAvatarDataUrl(minimalWebpDataUrl());
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
});

test("un faux WebP avec simple préfixe data URL est refusé", () => {
  const fake = `data:image/webp;base64,${Buffer.from("not-a-webp").toString("base64")}`;
  assert.throws(() => decodeCustomAvatarDataUrl(fake), /WebP valide/);
});

test("le marqueur remote conserve l image existante sans Base64", () => {
  assert.deepEqual(resolveCustomAvatarUpdate("remote"), {
    keepExisting: true,
    value: null,
  });
});

test("une chaîne vide demande explicitement la suppression", () => {
  assert.deepEqual(resolveCustomAvatarUpdate(""), {
    keepExisting: false,
    value: "",
  });
});

test("un nouveau WebP valide remplace l image", () => {
  const dataUrl = minimalWebpDataUrl();
  assert.deepEqual(resolveCustomAvatarUpdate(dataUrl), {
    keepExisting: false,
    value: dataUrl,
  });
});

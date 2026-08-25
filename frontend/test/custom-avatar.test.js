import test from "node:test";
import assert from "node:assert/strict";
import {
  customAvatarSource,
  REMOTE_CUSTOM_AVATAR_MARKER,
} from "../src/lib/custom-avatar.js";

test("un avatar distant utilise l endpoint dédié", () => {
  const source = customAvatarSource(
    { id: "42", hasCustomAvatar: true, customAvatarImage: REMOTE_CUSTOM_AVATAR_MARKER },
    { apiBase: "/api", useApi: true },
  );
  assert.equal(source, "/api/participants/42/avatar");
});

test("le marqueur remote ne devient jamais directement une URL image", () => {
  const source = customAvatarSource(
    { id: "a b", customAvatarImage: REMOTE_CUSTOM_AVATAR_MARKER },
    { apiBase: "https://api.example.test/api/", useApi: true },
  );
  assert.equal(source, "https://api.example.test/api/participants/a%20b/avatar");
});

test("le Base64 optimiste reste utilisable pendant un chargement", () => {
  const dataUrl = "data:image/webp;base64,UklGRg==";
  assert.equal(
    customAvatarSource({ id: "42", customAvatarImage: dataUrl }, { apiBase: "/api", useApi: true }),
    dataUrl,
  );
});

test("un profil sans image personnalisée utilise l avatar normal", () => {
  assert.equal(
    customAvatarSource({ id: "42", hasCustomAvatar: false, customAvatarImage: "" }, { apiBase: "/api", useApi: true }),
    "",
  );
});

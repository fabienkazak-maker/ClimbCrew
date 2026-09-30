import assert from "node:assert/strict";
import test from "node:test";
import { normalizeApiPath, normalizeOrigin, publicRequestOrigin } from "./http-stack.js";

test("normalise les préfixes API historiques sans perdre la query string", () => {
  assert.equal(normalizeApiPath("/api/participants?x=1"), "/participants?x=1");
  assert.equal(normalizeApiPath("/v1/routes"), "/routes");
  assert.equal(normalizeApiPath("/api/v1/sessions"), "/sessions");
  assert.equal(normalizeApiPath("/api"), "/");
});

test("conserve un chemin déjà canonique", () => {
  assert.equal(normalizeApiPath("/health"), "/health");
});


test("reconstruit l'origine publique HTTPS derrière le reverse proxy", () => {
  const req = {
    protocol: "http",
    headers: {
      host: "127.0.0.1:3000",
      "x-forwarded-proto": "https",
      "x-forwarded-host": "pre-climbcrew.dip-tcs.com",
    },
  };
  assert.equal(publicRequestOrigin(req), "https://pre-climbcrew.dip-tcs.com");
  assert.equal(normalizeOrigin("https://pre-climbcrew.dip-tcs.com/"), "https://pre-climbcrew.dip-tcs.com");
});

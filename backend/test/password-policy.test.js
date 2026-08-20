import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la politique de mot de passe utilise un minimum de 8 caractères partout", async () => {
  const [frontend, server, security] = await Promise.all([
    readFile(new URL("../../frontend/src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../server.js", import.meta.url), "utf8"),
    readFile(new URL("../admin-users/security.js", import.meta.url), "utf8"),
  ]);

  assert.match(frontend, /Minimum 8 caractères/);
  assert.match(frontend, /value\.length >= 8/);
  assert.match(server, /value\.length >= 8/);
  assert.match(security, /value\.length >= 8/);
  assert.doesNotMatch(frontend, /value\.length >= 12/);
  assert.doesNotMatch(server, /value\.length >= 12/);
  assert.doesNotMatch(security, /value\.length >= 12/);
});

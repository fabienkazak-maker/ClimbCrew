import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { rejectMaintenanceTokenInQuery } from "../admin-users/maintenance-hardening.js";

const integrationSource = await readFile(
  new URL("../admin-users/express-integration.js", import.meta.url),
  "utf8",
);
const hardeningSource = await readFile(
  new URL("../admin-users/maintenance-hardening.js", import.meta.url),
  "utf8",
);

function fakeResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("un jeton de maintenance dans l'URL est refusé", () => {
  const res = fakeResponse();
  let nextCalled = false;
  rejectMaintenanceTokenInQuery(
    { query: { setupToken: "secret" } },
    res,
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /X-Setup-Token/);
});

test("sans jeton dans l'URL, le contrôle d'accès historique continue", () => {
  const res = fakeResponse();
  let nextCalled = false;
  rejectMaintenanceTokenInQuery(
    { query: {} },
    res,
    () => { nextCalled = true; },
  );
  assert.equal(nextCalled, true);
});

test("setup-db et db-status reçoivent le filtre avant leur contrôle d'accès", () => {
  assert.match(integrationSource, /path === "\/setup-db" \|\| path === "\/db-status"/);
  assert.match(integrationSource, /rejectMaintenanceTokenInQuery, \.\.\.handlers/);
});

test("le health check public ne renvoie aucun détail PostgreSQL", () => {
  assert.match(integrationSource, /path === "\/health"[\s\S]*safeHealthCheck/);
  assert.match(hardeningSource, /status\(503\)\.json\(\{ ok: false, error: "Service temporairement indisponible" \}\)/);
  assert.doesNotMatch(hardeningSource, /json\(\{[^}]*String\(error\)/);
});

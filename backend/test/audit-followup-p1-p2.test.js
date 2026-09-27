import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  registerParticipantForSession,
} from "../admin-users/session-authorization-service.js";
import {
  getSchedulerHealthSnapshot,
  markSchedulerDegraded,
  markSchedulerDisabled,
  markSchedulerHealthy,
} from "../scheduler-health.js";

test("la règle d'inscription centralisée refuse une séance fermée et une séance pleine", async () => {
  await assert.rejects(
    registerParticipantForSession({}, {
      sessionId: "fermee",
      participantId: "19",
      session: { id: "fermee", status: "fermee", encadrant_id: null, referent_id: null },
      participantIds: [],
    }),
    /fermée/i,
  );

  const full = Array.from({ length: 18 }, (_, index) => String(index + 1));
  await assert.rejects(
    registerParticipantForSession({}, {
      sessionId: "pleine",
      participantId: "19",
      session: { id: "pleine", status: "encadree", encadrant_id: null, referent_id: null },
      participantIds: full,
    }),
    /18 participants/i,
  );
});

test("TheCrag réutilise la règle d'inscription et le statut métier par défaut", async () => {
  const source = await readFile(new URL("../realisation-management-routes.js", import.meta.url), "utf8");
  assert.match(source, /registerParticipantForSession/);
  assert.match(source, /getDefaultSessionStatus\(date, "midi"\)/);
});

test("le mode de réalisation possède sa colonne et la suppression de voie est restrictive", async () => {
  const migration = await readFile(
    new URL("../database/migrations/024_realisation_mode_route_history.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /mode_realisation/);
  assert.match(migration, /update realisations[\s\S]*set nb_essais = null/);
  assert.match(migration, /foreign key \(voie_id\) references routes\(id\)[\s\S]*on delete restrict/);
});

test("l'état des schedulers expose explicitement un mode dégradé", () => {
  markSchedulerHealthy("test-healthy");
  markSchedulerDisabled("test-disabled");
  markSchedulerDegraded("test-degraded");
  let snapshot = getSchedulerHealthSnapshot();
  assert.equal(snapshot.degraded, true);
  assert.equal(snapshot.schedulers.find((item) => item.name === "test-disabled")?.status, "disabled");

  markSchedulerHealthy("test-degraded");
  snapshot = getSchedulerHealthSnapshot();
  assert.equal(snapshot.schedulers.find((item) => item.name === "test-degraded")?.status, "healthy");
});

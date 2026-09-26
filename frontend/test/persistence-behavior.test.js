import test from "node:test";
import assert from "node:assert/strict";

import { useRealisationPersistence } from "../src/hooks/useRealisationPersistence.js";
import { useSessionPersistence } from "../src/hooks/useSessionPersistence.js";

function createStore(initialState) {
  let state = initialState;
  return {
    get: () => state,
    set: (update) => {
      state = typeof update === "function" ? update(state) : update;
    },
  };
}

function createDeferredRequestQueue() {
  const pending = [];
  const request = (path, options) => new Promise((resolve, reject) => {
    pending.push({ path, options, resolve, reject });
  });
  return { pending, request };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

test("les sauvegardes de séance sont sérialisées et un premier échec ne remplace pas une seconde modification", async () => {
  const initial = {
    id: "2026-09-28-midi",
    date: "2026-09-28",
    slot: "midi",
    status: "encadree",
    participantIds: [],
  };
  const firstUpdate = { ...initial, participantIds: ["1"] };
  const secondUpdate = { ...firstUpdate, participantIds: ["1", "2"] };
  const store = createStore({ sessions: [initial] });
  const network = createDeferredRequestQueue();
  const errors = [];
  const successes = [];

  const { persistSessionChange } = useSessionPersistence({
    useApi: true,
    setState: store.set,
    request: network.request,
    onSuccess: (message) => successes.push(message),
    onError: (message) => errors.push(message),
  });

  const firstSave = persistSessionChange(initial.id, initial, firstUpdate, true);
  const secondSave = persistSessionChange(initial.id, firstUpdate, secondUpdate, true);

  await flushPromises();
  assert.equal(network.pending.length, 1, "la seconde requête doit attendre la première");

  network.pending[0].reject(new Error("échec simulé"));
  await firstSave;
  await flushPromises();

  assert.equal(network.pending.length, 2, "la seconde requête démarre après la fin de la première");
  assert.deepEqual(store.get().sessions[0], secondUpdate, "le rollback ne doit pas effacer la modification plus récente");

  network.pending[1].resolve({ ok: true });
  await secondSave;

  assert.deepEqual(store.get().sessions[0], secondUpdate);
  assert.equal(errors.length, 1);
  assert.equal(successes.length, 1);
});

test("les sauvegardes de réalisation restent ordonnées et conservent la dernière version optimiste", async () => {
  const initial = {
    id: "real-behavior-1",
    participantId: "12",
    sessionId: "2026-09-28-midi",
    voieId: "voie-1",
    commentaire: "",
    rating: null,
  };
  const store = createStore({ realisations: [initial] });
  const network = createDeferredRequestQueue();
  const errors = [];

  const common = {
    useApi: true,
    authUser: { id: "user-12" },
    setState: store.set,
    myParticipantId: "12",
    sessionsById: {},
    request: network.request,
    onError: (message) => errors.push(message),
  };

  const firstController = useRealisationPersistence({ ...common, state: store.get() });
  const firstSave = firstController(initial.id, { commentaire: "première modification" });

  await flushPromises();
  assert.equal(network.pending.length, 1);

  const secondController = useRealisationPersistence({ ...common, state: store.get() });
  const secondSave = secondController(initial.id, { rating: 5 });

  await flushPromises();
  assert.equal(network.pending.length, 1, "la seconde requête doit rester dans la file");
  assert.equal(store.get().realisations[0].commentaire, "première modification");
  assert.equal(store.get().realisations[0].rating, 5);

  network.pending[0].reject(new Error("échec simulé"));
  await firstSave;
  await flushPromises();

  assert.equal(network.pending.length, 2);
  assert.equal(store.get().realisations[0].commentaire, "première modification");
  assert.equal(store.get().realisations[0].rating, 5);

  network.pending[1].resolve({ ok: true });
  await secondSave;

  assert.equal(errors.length, 1);
  assert.equal(store.get().realisations[0].rating, 5);
  assert.deepEqual(
    network.pending.map(({ options }) => JSON.parse(options.body)),
    [{ commentaire: "première modification" }, { rating: 5 }],
  );
});

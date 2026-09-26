import test from "node:test";
import assert from "node:assert/strict";
import { createAuthSessionActions } from "../src/lib/auth-session-actions.js";

function recorder() {
  const values = [];
  return { values, set: (value) => values.push(value) };
}

function baseSetters() {
  const keys = [
    "setAuthError", "setAuthMessage", "setAuthUser", "setThemePreference",
    "setAdminUnlocked", "setAuthView", "setGeneratedResetToken", "setAdminAuthUsers",
    "setAdminAccessLogs", "setPendingBroadcastMessages", "setBroadcastMessageError", "setSyncMessage",
  ];
  const recorders = Object.fromEntries(keys.map((key) => [key, recorder()]));
  return {
    recorders,
    args: Object.fromEntries(keys.map((key) => [key, recorders[key].set])),
  };
}

test("une déconnexion en échec conserve la session locale et affiche l'erreur", async () => {
  const { recorders, args } = baseSetters();
  const actions = createAuthSessionActions({
    ...args,
    loginForm: {},
    reloadApiState: async () => {},
    request: async () => { throw new Error("réseau indisponible"); },
  });

  const result = await actions.handleLogout();
  assert.equal(result, false);
  assert.deepEqual(recorders.setAuthUser.values, []);
  assert.match(recorders.setAuthError.values.at(-1), /Déconnexion impossible/);
});

test("une connexion réussie signale séparément une synchronisation secondaire en échec", async () => {
  const { recorders, args } = baseSetters();
  const actions = createAuthSessionActions({
    ...args,
    loginForm: { email: "a@example.test", password: "secret" },
    request: async () => ({ user: { id: "1", role: "user", theme_preference: "dark" } }),
    reloadApiState: async () => { throw new Error("données indisponibles"); },
  });

  await actions.handleLogin();
  assert.equal(recorders.setAuthUser.values.at(-1).id, "1");
  assert.equal(recorders.setAuthMessage.values.at(-1), "Connexion réussie.");
  assert.match(recorders.setSyncMessage.values.at(-1), /Erreur de synchronisation après connexion/);
});

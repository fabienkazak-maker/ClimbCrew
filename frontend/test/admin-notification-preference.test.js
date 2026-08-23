import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const profileSource = await readFile(new URL("../src/pages/Profil.jsx", import.meta.url), "utf8");
const participantNotificationSource = await readFile(
  new URL("../src/participant-account-notification-ui.js", import.meta.url),
  "utf8",
);

test("la préférence e-mail administrateur est gérée dans les participants et plus dans Mon profil", () => {
  assert.doesNotMatch(profileSource, /Notifications administrateur/);
  assert.doesNotMatch(profileSource, /\/auth\/notification-preference/);
  assert.match(participantNotificationSource, /E-mail demandes/);
  assert.match(participantNotificationSource, /\/admin\/auth\/notification-preferences/);
  assert.match(participantNotificationSource, /account-notifications/);
  assert.match(participantNotificationSource, /receiveAccountNotifications/);
});

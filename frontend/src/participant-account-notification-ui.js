import { apiFetch } from "./lib/api.js";

let scheduled = false;
let participantsPromise = null;
let preferencesPromise = null;

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadParticipants({ force = false } = {}) {
  if (force || !participantsPromise) {
    participantsPromise = apiFetch("/participants")
      .then((participants) => Array.isArray(participants) ? participants : [])
      .catch((error) => {
        participantsPromise = null;
        throw error;
      });
  }
  return participantsPromise;
}

function loadPreferences({ force = false } = {}) {
  if (force || !preferencesPromise) {
    preferencesPromise = apiFetch("/admin/auth/notification-preferences")
      .then((result) => Array.isArray(result?.preferences) ? result.preferences : [])
      .catch((error) => {
        preferencesPromise = null;
        throw error;
      });
  }
  return preferencesPromise;
}

function findParticipant(details, participants) {
  const email = String(details.querySelector('input[type="email"]')?.value || "").trim().toLowerCase();
  if (email) {
    const byEmail = participants.find((participant) => String(participant.email || "").trim().toLowerCase() === email);
    if (byEmail) return byEmail;
  }

  const summaryName = normalize(details.querySelector("summary")?.textContent);
  if (!summaryName) return null;

  return participants.find((participant) => {
    const firstLast = normalize(`${participant.prenom || ""} ${participant.nom || ""}`);
    const lastFirst = normalize(`${participant.nom || ""} ${participant.prenom || ""}`);
    return summaryName === firstLast || summaryName === lastFirst;
  }) || null;
}

function findRolesGroup(details) {
  return [...details.querySelectorAll(".group")].find((group) => {
    const text = String(group.textContent || "");
    return text.includes("Cotisation") && text.includes("FFME") && text.includes("Administrateur");
  }) || null;
}

function findAdminLabel(group) {
  return [...group.querySelectorAll("label")].find(
    (label) => normalize(label.textContent) === "administrateur"
  ) || null;
}

function updateControlAvailability(wrapper, participant, preference) {
  const input = wrapper.querySelector('input[type="checkbox"]');
  if (!input) return;

  const eligible = Boolean(
    participant.canAdmin
    && preference?.userId
    && preference?.status === "active"
    && preference?.isAdmin
  );

  input.checked = eligible && Boolean(preference?.receiveAccountNotifications);
  input.disabled = !eligible || wrapper.dataset.saving === "true";

  if (!participant.canAdmin) {
    wrapper.title = "Disponible uniquement pour un participant administrateur.";
  } else if (!preference?.userId) {
    wrapper.title = "Aucun compte utilisateur n'est associé à ce participant.";
  } else if (preference?.status !== "active") {
    wrapper.title = "Le compte associé doit être actif.";
  } else if (!preference?.isAdmin) {
    wrapper.title = "Le compte associé ne dispose pas encore du rôle administrateur.";
  } else {
    wrapper.title = "Recevoir un e-mail lorsqu'une nouvelle demande de compte est confirmée.";
  }
}

async function savePreference(wrapper, participant, preference, enabled) {
  const input = wrapper.querySelector('input[type="checkbox"]');
  const status = wrapper.querySelector(".participant-account-notification-status");
  const previous = Boolean(preference?.receiveAccountNotifications);

  wrapper.dataset.saving = "true";
  input.disabled = true;
  if (status) status.textContent = "…";

  try {
    const saved = await apiFetch(
      `/admin/participants/${encodeURIComponent(participant.id)}/account-notifications`,
      {
        method: "PUT",
        body: JSON.stringify({ receiveAccountNotifications: enabled }),
      },
    );

    preference.receiveAccountNotifications = Boolean(saved.receiveAccountNotifications);
    input.checked = preference.receiveAccountNotifications;
    if (status) status.textContent = "";
  } catch (error) {
    input.checked = previous;
    if (status) status.textContent = "Erreur";
    window.alert(error.message || String(error));
  } finally {
    wrapper.dataset.saving = "false";
    updateControlAvailability(wrapper, participant, preference);
  }
}

function installControl(details, participant, preference) {
  const rolesGroup = findRolesGroup(details);
  if (!rolesGroup) return;

  const adminLabel = findAdminLabel(rolesGroup);
  if (!adminLabel) return;

  let wrapper = rolesGroup.querySelector(".participant-account-notification-option");
  if (!wrapper) {
    wrapper = document.createElement("label");
    wrapper.className = "participant-account-notification-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("aria-label", `E-mails de demandes de compte pour ${participant.prenom || ""} ${participant.nom || ""}`.trim());

    const text = document.createElement("span");
    text.textContent = " E-mail demandes";

    const status = document.createElement("span");
    status.className = "small participant-account-notification-status";
    status.setAttribute("aria-live", "polite");

    wrapper.append(input, text, status);
    adminLabel.after(wrapper);

    input.addEventListener("change", () => {
      savePreference(wrapper, participant, preference, input.checked);
    });
  }

  wrapper.dataset.participantId = String(participant.id);
  updateControlAvailability(wrapper, participant, preference);

  const adminInput = adminLabel.querySelector('input[type="checkbox"]');
  if (adminInput && adminInput.dataset.notificationLinked !== "true") {
    adminInput.dataset.notificationLinked = "true";
    adminInput.addEventListener("change", () => {
      participant.canAdmin = adminInput.checked;
      if (!adminInput.checked && preference?.receiveAccountNotifications) {
        savePreference(wrapper, participant, preference, false);
      } else {
        updateControlAvailability(wrapper, participant, preference);
      }
    });
  }
}

async function updateControls() {
  const cards = [...document.querySelectorAll(".participant-admin-details")];
  if (!cards.length) return;

  let participants;
  let preferences;
  try {
    [participants, preferences] = await Promise.all([
      loadParticipants(),
      loadPreferences(),
    ]);
  } catch (error) {
    console.error("Chargement des préférences e-mail administrateur impossible", error);
    return;
  }

  const preferenceByParticipantId = Object.fromEntries(
    preferences.map((preference) => [String(preference.participantId || ""), preference])
  );

  cards.forEach((details) => {
    const participant = findParticipant(details, participants);
    if (!participant) return;

    const preference = preferenceByParticipantId[String(participant.id)] || {
      userId: null,
      participantId: participant.id,
      status: null,
      isAdmin: false,
      participantCanAdmin: Boolean(participant.canAdmin),
      receiveAccountNotifications: false,
    };
    installControl(details, participant, preference);
  });
}

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    updateControls();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleUpdate, { once: true });
} else {
  scheduleUpdate();
}

new MutationObserver(scheduleUpdate).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

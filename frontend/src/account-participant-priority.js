import {
  prioritizeConnectedParticipantValues,
  shouldDefaultConnectedParticipant,
} from "./account-participant-priority-rules.js";

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

let connectedParticipantId = "";
let authLookupInFlight = false;
let scheduled = false;
let initializedDefaultSelects = new WeakSet();

function selectFieldLabel(select) {
  const field = select.closest(".inline-field") || select.parentElement;
  const label = field?.querySelector("label");
  return String(label?.textContent || "").trim();
}

function reorderParticipantOption(select) {
  if (!connectedParticipantId) return false;

  const options = [...select.options];
  const currentValues = options.map((option) => String(option.value));
  if (!currentValues.includes(connectedParticipantId)) return false;

  const desiredValues = prioritizeConnectedParticipantValues(currentValues, connectedParticipantId);
  const alreadyOrdered = desiredValues.every((value, index) => currentValues[index] === value);
  if (alreadyOrdered) return true;

  const optionsByValue = new Map(options.map((option) => [String(option.value), option]));
  desiredValues.forEach((value) => {
    const option = optionsByValue.get(value);
    if (option) select.appendChild(option);
  });

  return true;
}

function defaultParticipantSelection(select) {
  if (!connectedParticipantId || initializedDefaultSelects.has(select)) return;
  if (String(select.value || "") !== "") return;
  if (!shouldDefaultConnectedParticipant(selectFieldLabel(select))) return;

  const ownOption = [...select.options].find(
    (option) => String(option.value) === connectedParticipantId && !option.disabled,
  );
  if (!ownOption) return;

  initializedDefaultSelects.add(select);
  select.value = connectedParticipantId;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function updateParticipantSelects() {
  if (!connectedParticipantId) return;

  document.querySelectorAll("select").forEach((select) => {
    if (!reorderParticipantOption(select)) return;
    defaultParticipantSelection(select);
  });
}

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    updateParticipantSelects();
  });
}

async function loadConnectedParticipant() {
  if (!API_BASE || authLookupInFlight || connectedParticipantId) return;
  authLookupInFlight = true;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return;
    const payload = await response.json();
    const participantId = String(payload?.user?.participantId || "");
    if (!participantId) return;

    connectedParticipantId = participantId;
    scheduleUpdate();
  } catch {
    // L'application principale gère déjà les erreurs d'authentification.
    // Ce module d'ergonomie ne doit jamais bloquer l'interface.
  } finally {
    authLookupInFlight = false;
  }
}

function refreshFromDomState() {
  // Après une déconnexion, on oublie l'association afin qu'un autre compte
  // puisse être détecté lors de la connexion suivante.
  if (document.querySelector(".auth-page")) {
    if (connectedParticipantId) {
      connectedParticipantId = "";
      initializedDefaultSelects = new WeakSet();
    }
    return;
  }

  if (!connectedParticipantId) {
    loadConnectedParticipant();
  } else {
    scheduleUpdate();
  }
}

const observer = new MutationObserver(refreshFromDomState);
observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener("change", scheduleUpdate);
window.addEventListener("focus", refreshFromDomState);

refreshFromDomState();

import { isEligibleForFreeSession, normalizeSessionPassport } from "./session-status-display-rules.js";

const INELIGIBLE_CLASS = "free-session-ineligible";
let scheduled = false;

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSessionStatus(card) {
  const statusField = [...card.querySelectorAll(".inline-field")]
    .find((field) => normalize(field.querySelector("label")?.textContent) === "statut");
  return normalize(statusField?.querySelector("select")?.value);
}


function updateSessionCardDisplay(card) {
  const status = getSessionStatus(card);
  const isFreeSession = status === "libre";

  card.querySelectorAll(".passport-row").forEach((row) => {
    const passport = normalizeSessionPassport(row.dataset.passport);
    const isIneligible = isFreeSession && !isEligibleForFreeSession(passport);

    row.classList.toggle(INELIGIBLE_CLASS, isIneligible);
    row.setAttribute("data-free-session-eligible", isIneligible ? "false" : "true");

    if (isIneligible) {
      row.title = "Passeport non autorisé pour une séance libre";
    } else if (row.title === "Passeport non autorisé pour une séance libre") {
      row.removeAttribute("title");
    }
  });
}

function updateAllSessionCards() {
  document.querySelectorAll(".session-card").forEach(updateSessionCardDisplay);
}

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    updateAllSessionCards();
  });
}

// Une modification de statut React remplace parfois une partie du DOM : on recalcule
// après chaque changement et après chaque mutation pertinente.
document.addEventListener("change", (event) => {
  if (event.target instanceof HTMLSelectElement) scheduleUpdate();
});

const observer = new MutationObserver(scheduleUpdate);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-passport", "value"],
});

scheduleUpdate();

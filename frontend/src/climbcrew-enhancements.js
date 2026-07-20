/**
 * Ajustements d’interface demandés pour ClimbCrew.
 * Le module agit uniquement sur la présentation ; les données et appels API
 * restent gérés par le composant React principal.
 */

const STYLE_ID = "climbcrew-ui-enhancements";
const SLOT_ORDER = ["midi", "soir", "matin"];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Palette noire, blanche et ardoise issue des teintes du logo ClimbCrew. */
    body,
    .app {
      background: linear-gradient(145deg, #020202, #111827, #334155) !important;
    }

    :root[data-theme="light"] body,
    :root[data-theme="light"] .app {
      background: linear-gradient(155deg, #ffffff, #f1f5f9, #e2e8f0) !important;
    }

    button:not(.danger):not(.remove-button),
    .side-tab.active,
    .bottom-tab.active,
    .tab.active {
      background: #111827 !important;
      color: #ffffff !important;
    }

    button.secondary,
    .side-tab:not(.active),
    .bottom-tab:not(.active) {
      background: #475569 !important;
      color: #ffffff !important;
    }

    :root[data-theme="light"] button.secondary,
    :root[data-theme="light"] .side-tab:not(.active),
    :root[data-theme="light"] .bottom-tab:not(.active) {
      background: #e2e8f0 !important;
      color: #111827 !important;
    }

    .hero,
    .toolbar,
    .card,
    .subcard,
    .stat,
    .auth-card,
    .modal-panel {
      border-color: rgba(100, 116, 139, .42) !important;
    }

    /* Une personne sans passeport reste inscrite, mais est signalée en Libre. */
    .passport-warning-hatched {
      background-image: repeating-linear-gradient(
        135deg,
        rgba(255, 255, 255, .32) 0,
        rgba(255, 255, 255, .32) 7px,
        rgba(15, 23, 42, .18) 7px,
        rgba(15, 23, 42, .18) 14px
      ) !important;
      background-blend-mode: overlay;
    }
  `;
  document.head.appendChild(style);
}

function sessionSlot(card) {
  const title = card.querySelector(":scope > .card-header h3, :scope > .card-header strong");
  const text = normalize(title?.textContent);
  return SLOT_ORDER.find((slot) => text === slot || text.endsWith(slot)) || "";
}

function reorderChildren(parent, cards) {
  const sorted = [...cards].sort((left, right) => {
    const leftIndex = SLOT_ORDER.indexOf(sessionSlot(left));
    const rightIndex = SLOT_ORDER.indexOf(sessionSlot(right));
    return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
  });

  if (cards.every((card, index) => card === sorted[index])) return;
  sorted.forEach((card) => parent.appendChild(card));
}

function reorderSessions() {
  const dayCards = [...document.querySelectorAll(".session-card")];
  if (dayCards.length && dayCards[0].parentElement) {
    reorderChildren(dayCards[0].parentElement, dayCards);
  }

  document.querySelectorAll(".grid.five > .card").forEach((dayCard) => {
    const stack = [...dayCard.children].find((child) => child.classList?.contains("stack"));
    if (!stack) return;
    const cards = [...stack.children].filter((child) => child.classList?.contains("subcard"));
    if (cards.length) reorderChildren(stack, cards);
  });
}

function sessionStatus(card) {
  const statusField = [...card.querySelectorAll(".inline-field")].find((field) =>
    normalize(field.querySelector("label")?.textContent) === "statut"
  );
  const select = statusField?.querySelector("select");
  if (select) return normalize(select.value);

  const statusLine = [...card.querySelectorAll(".small")].find((element) =>
    normalize(element.textContent).startsWith("statut :")
  );
  return normalize(statusLine?.textContent).replace("statut :", "").trim();
}

function hasNoPassport(row) {
  const inline = normalize(row.style.backgroundColor).replace(/\s/g, "");
  if (inline === "#334155" || inline === "rgb(51,65,85)") return true;
  return getComputedStyle(row).backgroundColor.replace(/\s/g, "") === "rgb(51,65,85)";
}

function updateHatching() {
  const cards = [
    ...document.querySelectorAll(".session-card"),
    ...document.querySelectorAll(".grid.five > .card > .stack > .subcard"),
  ];

  cards.forEach((card) => {
    const isFree = sessionStatus(card) === "libre";
    card.querySelectorAll(".passport-row").forEach((row) => {
      row.classList.toggle("passport-warning-hatched", isFree && hasNoPassport(row));
    });
  });
}

function updateFaq() {
  const faqHeading = [...document.querySelectorAll("h2")].find((heading) =>
    normalize(heading.textContent).startsWith("faq")
  );
  const faqCard = faqHeading?.closest(".card");
  if (!faqCard) return;

  faqCard.querySelectorAll(".faq-item").forEach((item) => {
    const question = normalize(item.querySelector("strong")?.textContent);
    const answer = item.querySelector(".small");

    if (question.startsWith("quelle version")) {
      item.remove();
      return;
    }

    if (!answer) return;

    if (question.startsWith("que signifient les couleurs")) {
      answer.textContent = "Dans les inscriptions, le fond correspond au passeport : gris foncé sans passeport, jaune, orange, vert ou bleu selon le niveau, et gris pour le passeport Découverte. Le cadre vert indique une cotisation réglée ; le cadre rouge une cotisation non réglée. En séance Libre, un fond hachuré signale une personne déjà inscrite sans passeport requis ; les hachures disparaissent si la séance redevient Encadrée. Pour les voies, le fond reprend la couleur des prises.";
    }

    if (question.startsWith("que signifie cpr")) {
      answer.textContent = "Le CPR de ClimbCrew représente le niveau récent. Le calcul retient les réalisations des 90 derniers jours, classe les performances selon la cotation de la voie corrigée par le style, puis conserve les 10 meilleures. Coefficients : à vue 1,25 ; flash 1,20 ; en tête 1,00 ; moulinette 0,85 ; travaillée 0,75 ; avec repos 0,60 ; projet 0,30 ; non enchaînée 0,20 ; essai/test 0,10. La moyenne des indices pondérés est arrondie puis reconvertie en cotation. Une voie facile d’échauffement ne fait donc pas baisser le CPR si elle n’entre pas dans les 10 meilleures performances récentes.";
    }
  });
}

let scheduled = false;
function refresh() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    reorderSessions();
    updateHatching();
    updateFaq();
  });
}

function start() {
  injectStyles();
  refresh();
  new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("change", refresh, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}

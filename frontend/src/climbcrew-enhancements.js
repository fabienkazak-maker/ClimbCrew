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

function setTextIfChanged(element, value) {
  if (element.textContent !== value) element.textContent = value;
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

    /* Interface compacte et cadres de grimpeurs alignés. */
    .hero {
      padding: 12px 14px !important;
    }

    .toolbar,
    .card {
      margin-top: 8px !important;
      padding: 10px !important;
    }

    .subcard,
    .stat,
    .modal-panel {
      padding: 8px !important;
    }

    .grid {
      gap: 8px !important;
    }

    .stack {
      gap: 6px !important;
    }

    .card-header {
      gap: 6px !important;
      margin-bottom: 6px !important;
    }

    .app h1,
    .app h2,
    .app h3,
    .app p {
      margin-top: 0 !important;
      margin-bottom: 4px !important;
    }

    .app label {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      line-height: 1.1 !important;
    }

    .participant-row {
      gap: 6px !important;
      min-height: 0 !important;
      padding: 3px 8px !important;
      line-height: 1.15 !important;
    }

    .participant-name {
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1.05 !important;
    }

    .session-participant-list .participant-row {
      min-height: 28px !important;
      padding: 2px 4px 2px 8px !important;
    }

    .session-participant-list .remove-button {
      width: 24px !important;
      min-width: 24px !important;
      height: 24px !important;
      min-height: 24px !important;
      font-size: 16px !important;
    }

    .app .small,
    .app strong {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      line-height: 1.1 !important;
    }

    .app span,
    .app .label,
    .app .value,
    .app .muted-box {
      line-height: 1.1 !important;
    }

    .muted-box {
      padding-top: 6px !important;
      padding-bottom: 6px !important;
    }

    .badge,
    .pill {
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }

    .faq-item {
      padding: 7px 0 !important;
    }

    .session-form-row {
      gap: 8px !important;
      margin-bottom: 8px !important;
    }

    .subcard > .stack {
      margin-top: 3px !important;
    }

    .passport-row {
      width: 100% !important;
      box-sizing: border-box !important;
      justify-content: space-between !important;
    }

    .session-participant-list {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 3px !important;
    }

    .shell {
      touch-action: pan-y;
      overscroll-behavior-x: contain;
    }

    /* Contraste renforcé dans l'onglet Voies. */
    .route-card {
      border: 2px solid rgba(15, 23, 42, .38) !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22) !important;
    }

    .route-card strong {
      font-weight: 900 !important;
      letter-spacing: .01em;
    }

    .route-card .small {
      font-weight: 700 !important;
      opacity: 1 !important;
    }

    .route-card .pill {
      background: rgba(255, 255, 255, .62) !important;
      color: #0f172a !important;
      border: 1px solid rgba(15, 23, 42, .45) !important;
      font-weight: 800 !important;
    }

    .route-card.moulinette-only {
      border: 3px solid #ef4444 !important;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, .22) !important;
    }

    .multi-signup {
      min-width: min(100%, 300px);
    }

    .signup-details {
      position: relative;
    }

    .signup-trigger {
      cursor: pointer;
      list-style: none;
      min-height: 42px !important;
      justify-content: center !important;
      background: #1e3a5f !important;
      color: #ffffff !important;
      border: 2px dashed #60a5fa !important;
      font-weight: 800;
    }

    .signup-trigger::-webkit-details-marker {
      display: none;
    }

    .signup-menu {
      position: absolute;
      z-index: 30;
      left: 0;
      top: calc(100% + 6px);
      width: min(360px, 85vw);
      max-height: 360px;
      overflow: auto;
      display: grid;
      gap: 6px;
      padding: 10px;
      border-radius: 14px;
      background: var(--theme-card-bg, #0f172a);
      border: 1px solid var(--theme-card-border, rgba(148,163,184,.3));
      box-shadow: 0 18px 45px rgba(0, 0, 0, .28);
    }

    .signup-option {
      cursor: pointer;
      grid-template-columns: auto 1fr;
      justify-content: flex-start !important;
    }

    .signup-option input {
      width: 18px !important;
      min-height: 18px !important;
      margin: 0 6px 0 0 !important;
    }

    .demo-badge {
      display: inline-flex;
      margin-top: 4px;
      background: #f59e0b !important;
      color: #111827 !important;
      border-color: #92400e !important;
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
      setTextIfChanged(answer, "Dans les inscriptions, le fond correspond au passeport. Le cadre vert indique une cotisation réglée et le rouge une cotisation non réglée. Le contour est plein avec une licence FFME ; sans licence, il alterne la couleur significative avec du noir. En séance Libre, un fond hachuré signale une personne déjà inscrite sans passeport requis ; les hachures disparaissent si la séance redevient Encadrée. Pour les voies, le texte est noir sur blanc, l’ocre apparaît sur fond marron et un cadre rouge indique une voie uniquement en moulinette.");
    }

    if (question.startsWith("que signifie cpr")) {
      setTextIfChanged(answer, "Le CPR de ClimbCrew représente le niveau récent. Le calcul retient les réalisations des 90 derniers jours, classe les performances selon la cotation de la voie corrigée par le style, puis conserve les 10 meilleures. Coefficients : à vue 1,25 ; flash 1,20 ; en tête 1,00 ; moulinette 0,85 ; travaillée 0,75 ; avec repos 0,60 ; projet 0,30 ; non enchaînée 0,20 ; essai/test 0,10. La moyenne des indices pondérés est arrondie puis reconvertie en cotation. Une voie facile d’échauffement ne fait donc pas baisser le CPR si elle n’entre pas dans les 10 meilleures performances récentes.");
    }
  });
}

function enableHorizontalSwipe() {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  document.addEventListener("touchstart", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button, input, select, textarea, a, .modal-overlay, .sidebar")) return;
    if (!document.querySelector(".date-nav")) return;

    const touch = event.touches[0];
    if (!touch) return;
    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;

    const navigationButtons = [...document.querySelectorAll(".date-nav .nav-symbol")];
    if (navigationButtons.length < 2) return;

    const button = deltaX < 0 ? navigationButtons.at(-1) : navigationButtons[0];
    button?.click();
  }, { passive: true });
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
  enableHorizontalSwipe();
  new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("change", refresh, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}


/**
 * Ajustements d'interface ClimbCrew.
 * Ce module ne modifie ni les données métier ni les appels API.
 */
const STYLE_ID = "climbcrew-ui-enhancements";
const SLOT_ORDER = ["midi", "soir", "matin"];
const SUPPORTED_THEMES = new Set(["light", "dark"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function setTextIfChanged(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap");

    /* Grès du soir - ambiance sombre. */
    :root, :root[data-theme="dark"] {
      --cc-bg:#0b0d10; --cc-surface:#171b1f; --cc-surface-2:#20262b;
      --cc-ink:#f2ede1; --cc-muted:#97a1a8; --cc-accent:#c9a6ff;
      --cc-accent-strong:#a873f0; --cc-accent-text:#20132e;
      --cc-hairline:rgba(242,237,225,.12); --cc-topo-opacity:.16;
      --theme-page-bg:var(--cc-bg)!important; --theme-app-bg:var(--cc-bg)!important;
      --theme-card-bg:var(--cc-surface)!important; --theme-card-soft:var(--cc-surface-2)!important;
      --theme-card-border:var(--cc-hairline)!important; --theme-text:var(--cc-ink)!important;
      --theme-text-muted:var(--cc-muted)!important; --theme-input-bg:var(--cc-surface-2)!important;
      --theme-input-border:var(--cc-hairline)!important; --theme-sidebar-bg:var(--cc-surface)!important;
      --theme-accent:var(--cc-accent)!important; --theme-accent-text:var(--cc-accent-text)!important;
      --theme-stat-bg:var(--cc-surface-2)!important;
    }

    /* Craie du matin - ambiance claire. */
    :root[data-theme="light"] {
      --cc-bg:#ece9e1; --cc-surface:#fffdf9; --cc-surface-2:#dfd9c9;
      --cc-ink:#201f1c; --cc-muted:#6f6a60; --cc-accent:#5b2e99;
      --cc-accent-strong:#3f1f70; --cc-accent-text:#fff;
      --cc-hairline:rgba(32,31,28,.14); --cc-topo-opacity:.22;
      --theme-page-bg:var(--cc-bg)!important; --theme-app-bg:var(--cc-bg)!important;
      --theme-card-bg:var(--cc-surface)!important; --theme-card-soft:var(--cc-surface-2)!important;
      --theme-card-border:var(--cc-hairline)!important; --theme-text:var(--cc-ink)!important;
      --theme-text-muted:var(--cc-muted)!important; --theme-input-bg:var(--cc-surface)!important;
      --theme-input-border:var(--cc-hairline)!important; --theme-sidebar-bg:var(--cc-surface)!important;
      --theme-accent:var(--cc-accent)!important; --theme-accent-text:var(--cc-accent-text)!important;
      --theme-stat-bg:var(--cc-surface-2)!important;
    }

    html, body, .app { background:var(--cc-bg)!important; color:var(--cc-ink)!important; font-family:Inter,Arial,sans-serif!important; }
    h1,h2,h3,.sidebar-brand,.brand { font-family:"Space Grotesk",Inter,Arial,sans-serif!important; }
    .badge,.pill,.date-input,.date-display,.route-card .small { font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace!important; }

    .hero,.toolbar,.card,.subcard,.stat,.auth-card,.modal-panel,.sidebar,.mobile-bottom-nav,.week-day-card {
      background:var(--cc-surface)!important; border-color:var(--cc-hairline)!important; color:var(--cc-ink)!important;
    }
    .subcard,.stat,.muted-box,.week-day-header,.view-toggle { background:var(--cc-surface-2)!important; }
    .small,.label,label,.muted-box,.auth-subtitle,.auth-helper-text { color:var(--cc-muted)!important; }
    input,select,textarea { background:var(--theme-input-bg)!important; color:var(--cc-ink)!important; border-color:var(--cc-hairline)!important; }
    input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible,a:focus-visible { outline:2px solid var(--cc-accent)!important; outline-offset:2px; }

    button:not(.danger):not(.remove-button):not(.secondary):not(.ghost),.side-tab.active,.bottom-tab.active,.tab.active {
      background:var(--cc-accent)!important; color:var(--cc-accent-text)!important;
    }
    button:not(.danger):not(.remove-button):not(.secondary):not(.ghost):hover,.side-tab.active:hover,.bottom-tab.active:hover,.tab.active:hover { background:var(--cc-accent-strong)!important; }
    button.secondary,.side-tab:not(.active),.bottom-tab:not(.active) { background:var(--cc-surface-2)!important; color:var(--cc-ink)!important; border:1px solid var(--cc-hairline)!important; }
    button.ghost,.menu-button,.sidebar-close { background:transparent!important; color:var(--cc-ink)!important; border-color:var(--cc-hairline)!important; }
    a { color:var(--cc-accent)!important; }

    /* Ligne topo, signature commune aux deux ambiances. */
    .hero::after { content:""; display:block; height:12px; margin-top:10px; opacity:var(--cc-topo-opacity); background-repeat:repeat-x; background-position:center; background-size:190px 12px; }
    :root[data-theme="dark"] .hero::after,:root:not([data-theme]) .hero::after { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='12' viewBox='0 0 190 12'%3E%3Cpath d='M0 7 C18 1 30 11 49 6 S82 2 99 7 S130 11 148 5 S174 2 190 7' fill='none' stroke='%23c9a6ff' stroke-width='2'/%3E%3C/svg%3E"); }
    :root[data-theme="light"] .hero::after { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='12' viewBox='0 0 190 12'%3E%3Cpath d='M0 7 C18 1 30 11 49 6 S82 2 99 7 S130 11 148 5 S174 2 190 7' fill='none' stroke='%235b2e99' stroke-width='2'/%3E%3C/svg%3E"); }

    /* Le choix de l'ambiance est uniquement dans le menu de gauche. */
    .theme-selector-inline { display:none!important; }
    .sidebar-theme { margin-top:4px; padding-top:12px; border-top:1px solid var(--cc-hairline)!important; }
    .sidebar-theme label { margin-bottom:6px!important; }

    /* Réglages compacts existants. */
    .hero { padding:12px 14px!important; }
    .toolbar,.card { margin-top:8px!important; padding:10px!important; }
    .subcard,.stat,.modal-panel { padding:8px!important; }
    .grid { gap:8px!important; } .stack { gap:6px!important; }
    .card-header { gap:6px!important; margin-bottom:6px!important; }
    .app h1,.app h2,.app h3,.app p { margin-top:0!important; margin-bottom:4px!important; }
    .app label { margin:0!important; padding:0!important; line-height:1.1!important; }
    .participant-row { gap:6px!important; min-height:0!important; padding:3px 8px!important; line-height:1.15!important; }
    .participant-name { display:block!important; margin:0!important; padding:0!important; line-height:1.05!important; }
    .session-participant-list { display:grid!important; grid-template-columns:minmax(0,1fr)!important; gap:3px!important; }
    .session-participant-list .participant-row { min-height:28px!important; padding:2px 4px 2px 8px!important; }
    .session-participant-list .remove-button { width:24px!important; min-width:24px!important; height:24px!important; min-height:24px!important; padding:0!important; font-size:20px!important; line-height:1!important; color:#000!important; background:transparent!important; border:0!important; box-shadow:none!important; }
    .app .small,.app strong { margin:0!important; padding:0!important; line-height:1.1!important; }
    .app span,.app .label,.app .value,.app .muted-box { line-height:1.1!important; }
    .muted-box { padding-top:6px!important; padding-bottom:6px!important; }
    .badge,.pill { padding-top:2px!important; padding-bottom:2px!important; }
    .faq-item { padding:7px 0!important; }
    .session-form-row { gap:8px!important; margin-bottom:8px!important; }
    .subcard>.stack { margin-top:3px!important; }
    .passport-row { width:100%!important; box-sizing:border-box!important; justify-content:space-between!important; }
    .shell { touch-action:pan-y; overscroll-behavior-x:contain; }

    /* Les couleurs de voies et de passeports restent des couleurs fonctionnelles. */
    .route-card { border:2px solid rgba(15,23,42,.38)!important; box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)!important; }
    .route-card strong,.route-card .small { color:inherit!important; font-weight:800!important; opacity:1!important; }
    .route-card .pill { background:rgba(255,255,255,.62)!important; color:#0f172a!important; border:1px solid rgba(15,23,42,.45)!important; font-weight:800!important; }
    .route-card.moulinette-only { border:3px solid #ef4444!important; box-shadow:0 0 0 2px rgba(239,68,68,.22)!important; }
    .demo-badge { display:inline-flex; margin-top:4px; background:#f59e0b!important; color:#111827!important; border-color:#92400e!important; }
    .passport-warning-hatched { background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.32) 0,rgba(255,255,255,.32) 7px,rgba(15,23,42,.18) 7px,rgba(15,23,42,.18) 14px)!important; background-blend-mode:overlay; }

    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; } }
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

/**
 * Trie chaque groupe de séances dans son propre jour.
 * L'ancienne logique utilisait le parent de la première séance pour toutes les
 * cartes, ce qui regroupait les séances de la semaine sous un seul jour.
 */
function reorderSessions() {
  const parents = new Set([...document.querySelectorAll(".session-card")].map((card) => card.parentElement).filter(Boolean));
  parents.forEach((parent) => {
    const cards = [...parent.children].filter((child) => child.classList?.contains("session-card"));
    if (cards.length > 1) reorderChildren(parent, cards);
  });

  /* Compatibilité avec l'ancienne structure HTML de la vue semaine. */
  document.querySelectorAll(".grid.five > .card").forEach((dayCard) => {
    const stack = [...dayCard.children].find((child) => child.classList?.contains("stack"));
    if (!stack) return;
    const cards = [...stack.children].filter((child) => child.classList?.contains("subcard"));
    if (cards.length > 1) reorderChildren(stack, cards);
  });
}

function preserveFunctionalRouteColors() {
  document.querySelectorAll(".route-card").forEach((card) => {
    const backgroundColor = card.style.backgroundColor;
    const color = card.style.color;
    if (backgroundColor) card.style.setProperty("background-color", backgroundColor, "important");
    if (color) card.style.setProperty("color", color, "important");
  });
}

function configureThemeSelector() {
  const root = document.documentElement;
  const theme = SUPPORTED_THEMES.has(root.dataset.theme) ? root.dataset.theme : "light";
  root.dataset.look = theme === "dark" ? "dusk" : "chalk";

  const selector = document.getElementById("sidebar-theme-selector");
  if (!selector) return;
  const labels = { light: "Craie du matin", dark: "Grès du soir" };

  [...selector.options].forEach((option) => {
    if (!SUPPORTED_THEMES.has(option.value)) option.remove();
    else setTextIfChanged(option, labels[option.value]);
  });

  if (!SUPPORTED_THEMES.has(selector.value)) {
    selector.value = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    selector.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function sessionStatus(card) {
  const field = [...card.querySelectorAll(".inline-field")].find((item) => normalize(item.querySelector("label")?.textContent) === "statut");
  const select = field?.querySelector("select");
  if (select) return normalize(select.value);
  const line = [...card.querySelectorAll(".small")].find((item) => normalize(item.textContent).startsWith("statut :"));
  return normalize(line?.textContent).replace("statut :", "").trim();
}

function hasNoPassport(row) {
  const inline = normalize(row.style.backgroundColor).replace(/\s/g, "");
  if (inline === "#334155" || inline === "rgb(51,65,85)") return true;
  return getComputedStyle(row).backgroundColor.replace(/\s/g, "") === "rgb(51,65,85)";
}

function updateHatching() {
  const cards = [...document.querySelectorAll(".session-card"), ...document.querySelectorAll(".grid.five > .card > .stack > .subcard")];
  cards.forEach((card) => {
    const isFree = sessionStatus(card) === "libre";
    card.querySelectorAll(".passport-row").forEach((row) => row.classList.toggle("passport-warning-hatched", isFree && hasNoPassport(row)));
  });
}

function updateFaq() {
  const heading = [...document.querySelectorAll("h2")].find((item) => normalize(item.textContent).startsWith("faq"));
  const card = heading?.closest(".card");
  if (!card) return;

  card.querySelectorAll(".faq-item").forEach((item) => {
    const question = normalize(item.querySelector("strong")?.textContent);
    const answer = item.querySelector(".small");
    if (question.startsWith("quelle version")) return item.remove();
    if (!answer) return;
    if (question.startsWith("que signifient les couleurs")) setTextIfChanged(answer, "Dans les inscriptions, le fond correspond au passeport. Le cadre vert indique une cotisation réglée et le rouge une cotisation non réglée. Le contour est plein avec une licence FFME ; sans licence, il alterne la couleur significative avec du noir. En séance Libre, un fond hachuré signale une personne déjà inscrite sans passeport requis ; les hachures disparaissent si la séance redevient Encadrée. Pour les voies, le texte est noir sur les fonds blancs et jaunes, et un cadre rouge indique une voie uniquement en moulinette.");
    if (question.startsWith("que signifie cpr")) setTextIfChanged(answer, "Le CPR de ClimbCrew représente le niveau récent. Le calcul retient les réalisations des 90 derniers jours, classe les performances selon la cotation de la voie corrigée par le style, puis conserve les 10 meilleures. Coefficients : à vue 1,25 ; flash 1,20 ; en tête 1,00 ; moulinette 0,85 ; travaillée 0,75 ; avec repos 0,60 ; projet 0,30 ; non enchaînée 0,20 ; essai/test 0,10. La moyenne des indices pondérés est arrondie puis reconvertie en cotation. Une voie facile d'échauffement ne fait donc pas baisser le CPR si elle n'entre pas dans les 10 meilleures performances récentes.");
  });
}

function enableHorizontalSwipe() {
  let startX = 0, startY = 0, tracking = false;
  document.addEventListener("touchstart", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("button,input,select,textarea,a,.modal-overlay,.sidebar") || !document.querySelector(".date-nav")) return;
    const touch = event.touches[0];
    if (!touch) return;
    startX = touch.clientX; startY = touch.clientY; tracking = true;
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX, deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    const buttons = [...document.querySelectorAll(".date-nav .nav-symbol")];
    if (buttons.length >= 2) (deltaX < 0 ? buttons.at(-1) : buttons[0])?.click();
  }, { passive: true });
}

let scheduled = false;
function refresh() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    configureThemeSelector();
    preserveFunctionalRouteColors();
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
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("change", refresh, true);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();

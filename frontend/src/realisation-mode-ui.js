import {
  REALISATION_CRITERIA,
  REALISATION_CRITERION_LABELS,
  REALISATION_MODE_LABELS,
  getRealisationMode,
} from "./lib/realisation-mode.js";
import { normalizeRopeNumber } from "./lib/domain.js";

/**
 * Intégration progressive du mode d'ascension dans l'interface historique.
 *
 * App.jsx est encore un composant monolithique. Ce module garde donc la logique
 * métier dans realisation-mode.js et ajoute uniquement la couche d'intégration :
 * - un sélecteur Mode (En tête / Moulinette) ;
 * - le champ Style devient Critère et ne contient plus les modes ;
 * - le mode est ajouté aux écritures /realisations ;
 * - les anciennes données restent lisibles via nbEssais, utilisé comme stockage
 *   de compatibilité tant qu'une migration dédiée n'est pas nécessaire.
 */

const LEGACY_MODE_VALUES = new Set(["en_tete", "moulinette"]);
const CRITERION_VALUES = new Set(REALISATION_CRITERIA);

let newRealisationMode = "en_tete";
let realisationsEndpoint = "";
let cachedRealisations = [];
let cachedRoutes = [];
let cachedParticipants = [];
let scheduled = false;

function readCookie(name) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

function endpointUrl(input) {
  if (typeof input === "string") return input;
  return String(input?.url || "");
}

function requestMethod(input, init = {}) {
  return String(init.method || input?.method || "GET").toUpperCase();
}

function isRealisationsCollection(url) {
  return /\/realisations(?:\?|$)/.test(url);
}

function isRealisationItem(url) {
  return /\/realisations\/[^/?]+(?:\?|$)/.test(url);
}

function parseJsonBody(body) {
  if (typeof body !== "string") return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cacheApiResponse(url, response) {
  if (!response?.ok) return;

  if (isRealisationsCollection(url)) {
    realisationsEndpoint = url.split("?")[0];
    response.clone().json().then((rows) => {
      if (!Array.isArray(rows)) return;
      cachedRealisations = rows;
      scheduleEnhancement();
    }).catch(() => {});
    return;
  }

  if (/\/routes(?:\?|$)/.test(url)) {
    response.clone().json().then((rows) => {
      if (!Array.isArray(rows)) return;
      cachedRoutes = rows;
      scheduleEnhancement();
    }).catch(() => {});
    return;
  }

  if (/\/participants(?:\?|$)/.test(url)) {
    response.clone().json().then((rows) => {
      if (!Array.isArray(rows)) return;
      cachedParticipants = rows;
      scheduleEnhancement();
    }).catch(() => {});
  }
}

// L'API historique sait déjà persister nbEssais. backend/validation.js mappe
// modeRealisation vers ce stockage de compatibilité. On enrichit ici les POST
// créés par le formulaire React sans modifier le reste de la requête.
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = endpointUrl(input);
    const method = requestMethod(input, init);
    let nextInit = init;

    if (method === "POST" && isRealisationsCollection(url)) {
      const payload = parseJsonBody(init.body);
      if (payload && !payload.modeRealisation) {
        payload.modeRealisation = newRealisationMode;
        nextInit = { ...init, body: JSON.stringify(payload) };
      }
    }

    const response = await nativeFetch(input, nextInit);

    if (method === "GET") cacheApiResponse(url, response);
    if (method === "POST" && isRealisationsCollection(url) && response.ok) {
      response.clone().json().then((created) => {
        if (created?.id) {
          cachedRealisations = [created, ...cachedRealisations.filter((item) => String(item.id) !== String(created.id))];
        }
        scheduleEnhancement();
      }).catch(() => {});
    }

    return response;
  };
}

function fullName(participant) {
  return `${participant?.nom || ""} ${participant?.prenom || ""}`.trim();
}

function routeById(id) {
  return cachedRoutes.find((route) => String(route.id) === String(id));
}

function participantById(id) {
  return cachedParticipants.find((participant) => String(participant.id) === String(id));
}

function formatRouteForRealisation(route) {
  if (!route) return "";
  const rope = `Corde ${normalizeRopeNumber(route.numeroCorde ?? route.numero_corde)}`;
  const grade = String(
    route.cotationAjustee
      || route.cotation_ajustee
      || route.cotationReference
      || route.cotation_reference
      || "nc",
  ).trim();
  const opener = String(route.nomOuvreur ?? route.nom_ouvreur ?? "").trim();
  const name = String(route.nomVoie ?? route.nom_voie ?? "").trim();
  return [rope, grade, opener, name].filter(Boolean).join(" · ");
}

function formatDateShort(dateValue) {
  const [year, month, day] = String(dateValue || "").slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : "";
}

function cachedMode(realisation, route) {
  return getRealisationMode({
    ...realisation,
    modeRealisation: realisation?.modeRealisation ?? realisation?.mode_realisation,
    nbEssais: realisation?.nbEssais ?? realisation?.nb_essais,
    styleRealisation: realisation?.styleRealisation ?? realisation?.style_realisation,
  }, route);
}

function criterionValue(realisation) {
  const value = String(realisation?.styleRealisation ?? realisation?.style_realisation ?? "");
  return CRITERION_VALUES.has(value) ? value : "";
}

function candidateRowsForCard(details) {
  const summaryText = String(details.querySelector("summary")?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!summaryText) return [];

  return cachedRealisations.filter((realisation) => {
    const route = routeById(realisation.voieId ?? realisation.voie_id);
    const participant = participantById(realisation.participantId ?? realisation.participant_id);
    const routeLabel = formatRouteForRealisation(route);
    const dateLabel = formatDateShort(realisation.dateRealisation ?? realisation.date_realisation);
    const participantLabel = fullName(participant);

    if (routeLabel && !summaryText.includes(routeLabel)) return false;
    if (dateLabel && !summaryText.includes(dateLabel)) return false;

    // Dans la vue par voie, le nom du grimpeur est présent dans le résumé.
    // Dans la vue par grimpeur il est volontairement omis : on ne l'impose donc
    // que lorsqu'il apparaît déjà dans le texte rendu.
    if (participantLabel && summaryText.includes("—") && !summaryText.includes(participantLabel)) return false;
    return true;
  });
}

function associateRealisationCards() {
  const usedIds = new Set();

  document.querySelectorAll("details.editable-realisation-card").forEach((details) => {
    if (details.dataset.realisationId) {
      usedIds.add(details.dataset.realisationId);
      return;
    }

    const styleSelect = [...details.querySelectorAll("select")].find((select) => {
      const label = select.closest("div")?.querySelector(":scope > label");
      return ["Style", "Critère"].includes(String(label?.textContent || "").trim());
    });
    const currentStyle = String(styleSelect?.value || "");

    const candidates = candidateRowsForCard(details)
      .filter((row) => !usedIds.has(String(row.id)))
      .sort((a, b) => String(b.dateRealisation || b.date_realisation || "")
        .localeCompare(String(a.dateRealisation || a.date_realisation || "")));

    const exactStyle = candidates.find((row) => {
      const rowStyle = String(row.styleRealisation ?? row.style_realisation ?? "");
      return rowStyle === currentStyle;
    });
    const selected = exactStyle || candidates[0];
    if (!selected?.id) return;

    details.dataset.realisationId = String(selected.id);
    usedIds.add(String(selected.id));
  });
}

function makeModeSelect(value, { disabled = false, onChange } = {}) {
  const select = document.createElement("select");
  select.className = "realisation-mode-select";
  select.setAttribute("aria-label", "Mode de réalisation");

  Object.entries(REALISATION_MODE_LABELS).forEach(([mode, label]) => {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = label;
    select.append(option);
  });

  select.value = value;
  select.disabled = disabled;
  if (onChange) select.addEventListener("change", onChange);
  return select;
}

function normalizeCriterionSelect(select, label, { historical = false } = {}) {
  label.textContent = "Critère";

  [...select.options].forEach((option) => {
    if (LEGACY_MODE_VALUES.has(option.value)) {
      if (historical && option.value === select.value) {
        option.textContent = "Non précisé (historique)";
        option.disabled = true;
        option.hidden = false;
      } else {
        option.hidden = true;
        option.disabled = true;
      }
      return;
    }

    if (CRITERION_VALUES.has(option.value)) {
      option.hidden = false;
      option.disabled = false;
      option.textContent = REALISATION_CRITERION_LABELS[option.value] || option.textContent;
    }
  });
}

function selectedModalRoute() {
  const modal = document.querySelector(".modal-panel");
  if (!modal) return null;
  const voieSelect = [...modal.querySelectorAll("select")].find((select) => (
    String(select.closest("div")?.querySelector(":scope > label")?.textContent || "").trim() === "Voie"
  ));
  return routeById(voieSelect?.value);
}

function enhanceModalCriterion() {
  const modal = document.querySelector(".modal-panel");
  if (!modal) return;

  const styleSelect = [...modal.querySelectorAll("select")].find((select) => {
    const text = String(select.closest("div")?.querySelector(":scope > label")?.textContent || "").trim();
    return text === "Style" || text === "Critère";
  });
  if (!styleSelect) return;

  const criterionField = styleSelect.closest("div");
  const criterionLabel = criterionField?.querySelector(":scope > label");
  if (!criterionField || !criterionLabel) return;
  normalizeCriterionSelect(styleSelect, criterionLabel);

  const route = selectedModalRoute();
  if (route?.moulinetteOnly ?? route?.moulinette_only) newRealisationMode = "moulinette";

  let modeField = modal.querySelector(".realisation-mode-field[data-context='new']");
  if (!modeField) {
    modeField = document.createElement("div");
    modeField.className = "realisation-mode-field";
    modeField.dataset.context = "new";
    const label = document.createElement("label");
    label.textContent = "Mode";
    modeField.append(label);
    criterionField.before(modeField);
  }

  const forcedMoulinette = Boolean(route?.moulinetteOnly ?? route?.moulinette_only);
  const desiredMode = forcedMoulinette ? "moulinette" : newRealisationMode;
  let modeSelect = modeField.querySelector("select");
  if (!modeSelect) {
    modeSelect = makeModeSelect(desiredMode, {
      disabled: forcedMoulinette,
      onChange: (event) => {
        newRealisationMode = event.currentTarget.value;
      },
    });
    modeField.append(modeSelect);
  }
  modeSelect.disabled = forcedMoulinette;
  modeSelect.value = desiredMode;

  if (forcedMoulinette && !modeField.querySelector(".small")) {
    const helper = document.createElement("div");
    helper.className = "small";
    helper.style.marginTop = "6px";
    helper.textContent = "Cette voie est configurée en moulinette uniquement.";
    modeField.append(helper);
  } else if (!forcedMoulinette) {
    modeField.querySelector(".small")?.remove();
  }

  const voieSelect = [...modal.querySelectorAll("select")].find((select) => (
    String(select.closest("div")?.querySelector(":scope > label")?.textContent || "").trim() === "Voie"
  ));
  if (voieSelect && !voieSelect.dataset.modeEnhancementBound) {
    voieSelect.dataset.modeEnhancementBound = "true";
    voieSelect.addEventListener("change", () => scheduleEnhancement());
  }
}

async function persistExistingMode(realisationId, mode) {
  if (!realisationId || !realisationsEndpoint) return false;
  const csrfToken = readCookie("climbcrew_csrf");
  const response = await window.fetch(`${realisationsEndpoint}/${encodeURIComponent(realisationId)}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify({ modeRealisation: mode }),
  });
  return response.ok;
}

function enhanceExistingCards() {
  associateRealisationCards();

  document.querySelectorAll("details.editable-realisation-card").forEach((details) => {
    const realisationId = details.dataset.realisationId;
    const cached = cachedRealisations.find((row) => String(row.id) === String(realisationId));
    const route = routeById(cached?.voieId ?? cached?.voie_id);

    const styleSelect = [...details.querySelectorAll("select")].find((select) => {
      const text = String(select.closest("div")?.querySelector(":scope > label")?.textContent || "").trim();
      return text === "Style" || text === "Critère";
    });
    if (!styleSelect) return;

    const criterionField = styleSelect.closest("div");
    const criterionLabel = criterionField?.querySelector(":scope > label");
    if (!criterionField || !criterionLabel) return;

    const legacyValue = LEGACY_MODE_VALUES.has(styleSelect.value);
    normalizeCriterionSelect(styleSelect, criterionLabel, { historical: legacyValue });

    let modeField = details.querySelector(".realisation-mode-field[data-context='existing']");
    if (!modeField) {
      modeField = document.createElement("div");
      modeField.className = "realisation-mode-field";
      modeField.dataset.context = "existing";
      const label = document.createElement("label");
      label.textContent = "Mode";
      modeField.append(label);
      criterionField.before(modeField);
    }

    const forcedMoulinette = Boolean(route?.moulinetteOnly ?? route?.moulinette_only);
    const currentMode = forcedMoulinette
      ? "moulinette"
      : cachedMode(cached || { styleRealisation: styleSelect.value }, route);

    let modeSelect = modeField.querySelector("select");
    if (!modeSelect) {
      modeSelect = makeModeSelect(currentMode);
      modeField.append(modeSelect);
      modeSelect.addEventListener("change", async (event) => {
        const nextMode = event.currentTarget.value;
        const id = details.dataset.realisationId;
        event.currentTarget.disabled = true;
        try {
          const ok = await persistExistingMode(id, nextMode);
          if (!ok) throw new Error("Échec de l'enregistrement du mode");

          const row = cachedRealisations.find((item) => String(item.id) === String(id));
          if (row) {
            row.modeRealisation = nextMode;
            row.nbEssais = nextMode;
          }

          // React possède sa propre copie des données. Un rechargement très court
          // garantit que CPR, points et Wall of Fame utilisent immédiatement le
          // nouveau mode. On revient automatiquement à Progression.
          sessionStorage.setItem("climbcrew-return-to-progression", "1");
          window.setTimeout(() => window.location.reload(), 80);
        } catch (error) {
          console.error(error);
          event.currentTarget.value = currentMode;
          event.currentTarget.disabled = forcedMoulinette;
          window.alert("Impossible d'enregistrer le mode de réalisation.");
        }
      });
    }

    modeSelect.disabled = forcedMoulinette;
    modeSelect.value = currentMode;
  });
}

function updateRenderedSummaries() {
  document.querySelectorAll("details.editable-realisation-card").forEach((details) => {
    const id = details.dataset.realisationId;
    const cached = cachedRealisations.find((row) => String(row.id) === String(id));
    if (!cached) return;

    const route = routeById(cached.voieId ?? cached.voie_id);
    const mode = cachedMode(cached, route);
    const criterion = criterionValue(cached);
    const modeLabel = REALISATION_MODE_LABELS[mode] || mode;
    const criterionLabel = criterion
      ? REALISATION_CRITERION_LABELS[criterion]
      : "Critère non précisé (historique)";

    const summarySmall = details.querySelector("summary .small");
    if (!summarySmall) return;
    const dateLabel = formatDateShort(cached.dateRealisation ?? cached.date_realisation);
    summarySmall.textContent = `${dateLabel} · ${modeLabel} · ${criterionLabel}`;
  });
}

function updateFaq() {
  document.querySelectorAll(".faq-item").forEach((details) => {
    const question = String(details.querySelector("summary")?.textContent || "").trim();
    const answer = details.querySelector(":scope > .small");
    if (!answer) return;

    if (question === "Comment enregistrer une voie réalisée ?") {
      answer.textContent = "Dans l’onglet Voies, le bouton « Réalisation » ouvre la saisie. Le mode d’ascension (En tête ou Moulinette) et le critère (À vue, Flash, Travaillée, Avec repos, Projet, Non enchaînée ou Essai/test) sont sélectionnés séparément. Si un jour est choisi, seuls les participants cotisants inscrits ce jour-là sont proposés. Si un participant est choisi, seuls ses jours d’inscription sont proposés.";
    }

    if (question === "Comment sont calculées les statistiques des réalisations en tête ?") {
      answer.textContent = "Une réussite en tête associe le mode « En tête » à un critère de réussite : À vue, Flash ou Travaillée. Les anciennes réalisations enregistrées directement comme « En tête » restent compatibles. Pour chaque cotation, l’application compte les voies disponibles et ces réussites en tête ; le ratio correspond au nombre de réussites en tête divisé par le nombre de voies de la cotation.";
    }

    if (question === "Comment fonctionne la règle des 1 000 points ?") {
      answer.textContent = "Chaque voie distribue exactement 1 000 points entre les grimpeurs distincts qui l’ont réussie en mode « En tête » avec un critère de réussite (À vue, Flash ou Travaillée). Une personne seule reçoit 1 000 points ; quatre personnes reçoivent 250 points chacune. Refaire plusieurs fois la même voie en tête ne donne qu’une seule part. Une réalisation en moulinette ne distribue jamais de points d’ascension en tête.";
    }
  });
}

function returnToProgressionAfterReload() {
  if (sessionStorage.getItem("climbcrew-return-to-progression") !== "1") return;
  const progressionButton = [...document.querySelectorAll("button")].find((button) => (
    String(button.textContent || "").trim() === "Progression"
  ));
  if (!progressionButton) return;
  sessionStorage.removeItem("climbcrew-return-to-progression");
  progressionButton.click();
}

function enhanceRealisationModeUi() {
  returnToProgressionAfterReload();
  enhanceModalCriterion();
  enhanceExistingCards();
  updateRenderedSummaries();
  updateFaq();
}

function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceRealisationModeUi();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once: true });
} else {
  scheduleEnhancement();
}

new MutationObserver(scheduleEnhancement).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

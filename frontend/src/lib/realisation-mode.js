/**
 * Modèle des réalisations.
 *
 * Le mode d'ascension (en tête / moulinette) est indépendant du critère
 * de réalisation (à vue, flash, travaillée, etc.). Les anciennes données
 * qui utilisaient "en_tete" ou "moulinette" dans styleRealisation restent
 * comprises afin de ne pas modifier l'historique existant.
 */

export const REALISATION_MODES = ["en_tete", "moulinette"];
export const REALISATION_CRITERIA = [
  "a_vue",
  "flash",
  "travaillee",
  "avec_repos",
  "projet",
  "non_enchainee",
  "test",
];

export const REALISATION_MODE_LABELS = {
  en_tete: "En tête",
  moulinette: "Moulinette",
};

export const REALISATION_CRITERION_LABELS = {
  a_vue: "À vue",
  flash: "Flash",
  travaillee: "Travaillée",
  avec_repos: "Avec repos",
  projet: "Projet",
  non_enchainee: "Non enchaînée",
  test: "Essai / test",
};

const SUCCESSFUL_CRITERIA = new Set(["a_vue", "flash", "travaillee"]);

export const REALISATION_CRITERION_WEIGHTS = {
  a_vue: 1.25,
  flash: 1.2,
  travaillee: 0.75,
  avec_repos: 0.6,
  projet: 0.3,
  non_enchainee: 0.2,
  test: 0.1,
};

export function normalizeRealisationMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return REALISATION_MODES.includes(normalized) ? normalized : "";
}

export function normalizeRealisationCriterion(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return REALISATION_CRITERIA.includes(normalized) ? normalized : "";
}

/**
 * Détermine le mode en privilégiant le champ explicite.
 * nbEssais est lu uniquement comme stockage de compatibilité : ce champ n'est
 * plus utilisé comme compteur d'essais dans l'interface actuelle.
 */
export function getRealisationMode(realisation, route = null) {
  if (route?.moulinetteOnly) return "moulinette";

  const explicitMode = normalizeRealisationMode(
    realisation?.modeRealisation
      ?? realisation?.mode_realisation
      ?? realisation?.nbEssais
      ?? realisation?.nb_essais,
  );
  if (explicitMode) return explicitMode;

  if (String(realisation?.styleRealisation || realisation?.style_realisation || "") === "moulinette") {
    return "moulinette";
  }
  return "en_tete";
}

/**
 * Retourne le critère moderne. Une ancienne réalisation enregistrée seulement
 * comme "en_tete" ou "moulinette" n'a pas de critère connu : on renvoie "".
 */
export function getRealisationCriterion(realisation) {
  return normalizeRealisationCriterion(
    realisation?.styleRealisation ?? realisation?.style_realisation,
  );
}

export function isSuccessfulRealisation(realisation) {
  const criterion = getRealisationCriterion(realisation);
  if (criterion) return SUCCESSFUL_CRITERIA.has(criterion);

  // Compatibilité historique : les anciennes valeurs représentaient une voie
  // effectivement réalisée, sans préciser le critère de réussite.
  const legacyStyle = String(realisation?.styleRealisation || realisation?.style_realisation || "");
  return legacyStyle === "en_tete" || legacyStyle === "moulinette";
}

export function isSuccessfulLeadRealisation(realisation, route = null) {
  if (getRealisationMode(realisation, route) !== "en_tete") return false;

  const criterion = getRealisationCriterion(realisation);
  if (criterion) return SUCCESSFUL_CRITERIA.has(criterion);

  // Une ancienne valeur "en_tete" reste une réussite en tête.
  return String(realisation?.styleRealisation || realisation?.style_realisation || "") === "en_tete";
}

export function getRealisationWeight(realisation, route = null) {
  const mode = getRealisationMode(realisation, route);
  if (mode === "moulinette") return 0.85;

  const criterion = getRealisationCriterion(realisation);
  if (criterion) return REALISATION_CRITERION_WEIGHTS[criterion] ?? 1;

  // Anciennes réalisations en tête : coefficient historique 1,00.
  return 1;
}

export function formatRealisationModeCriterion(realisation, route = null) {
  const mode = getRealisationMode(realisation, route);
  const criterion = getRealisationCriterion(realisation);
  const modeLabel = REALISATION_MODE_LABELS[mode] || mode;
  const criterionLabel = criterion
    ? REALISATION_CRITERION_LABELS[criterion]
    : "Critère non précisé (historique)";
  return `${modeLabel} · ${criterionLabel}`;
}

import { GRADES, isSuccessfulLeadRealisation, isSuccessfulRealisation, normalizeRopeNumber } from "./domain.js";
import { getRealisationCriterion, getRealisationMode } from "./realisation-mode.js";

export const BADGE_FAMILY_LABELS = {
  achievement: "Accomplissement",
  level: "Niveau",
  consistency: "Régularité",
  schedule: "Jours d’inscription",
  exploration: "Exploration",
  contribution: "Contribution",
  prestige: "Prestige",
};

export const BADGE_CATALOG = [
  { id: "premiere_croix", name: "Première croix", family: "achievement", shape: "flame", symbol: "✓", condition: "Première voie réussie enregistrée.", qualifies: (m) => m.successfulCount >= 1 },
  { id: "premiere_tete", name: "En tête !", family: "achievement", shape: "flame", symbol: "↑", condition: "Première voie réussie en tête.", qualifies: (m) => m.successfulLeadCount >= 1 },
  { id: "premiere_moulinette", name: "Moulinette", family: "achievement", shape: "flame", symbol: "↻", condition: "Première voie réussie en moulinette.", qualifies: (m) => m.successfulTopropeCount >= 1 },
  { id: "premier_a_vue", name: "À vue", family: "achievement", shape: "flame", symbol: "◉", condition: "Première réussite à vue.", qualifies: (m) => m.onsightCount >= 1 },
  { id: "premier_flash", name: "Flash", family: "achievement", shape: "flame", symbol: "⚡", condition: "Premier flash réussi.", qualifies: (m) => m.flashCount >= 1 },
  { id: "cap_5c", name: "Cap 5c", family: "level", shape: "shield", symbol: "5c", condition: "Réussir une voie cotée 5c ou plus.", qualifies: (m) => m.bestGradeIndex >= GRADES.indexOf("5c") },
  { id: "club_6a", name: "Club 6a", family: "level", shape: "shield", symbol: "6a", condition: "Réussir une voie cotée 6a ou plus.", qualifies: (m) => m.bestGradeIndex >= GRADES.indexOf("6a") },
  { id: "club_6b", name: "Club 6b", family: "level", shape: "shield", symbol: "6b", condition: "Réussir une voie cotée 6b ou plus.", qualifies: (m) => m.bestGradeIndex >= GRADES.indexOf("6b") },
  { id: "club_6c", name: "Club 6c", family: "level", shape: "shield", symbol: "6c", condition: "Réussir une voie cotée 6c ou plus.", qualifies: (m) => m.bestGradeIndex >= GRADES.indexOf("6c") },
  { id: "club_7a", name: "Club 7a", family: "level", shape: "shield", symbol: "7a", condition: "Réussir une voie cotée 7a ou plus.", qualifies: (m) => m.bestGradeIndex >= GRADES.indexOf("7a") },
  { id: "explorateur", name: "Explorateur", family: "exploration", shape: "patch", symbol: "⌖", condition: "Réussir des voies sur 5 cordes différentes.", qualifies: (m) => m.distinctRopeCount >= 5 },
  { id: "tour_de_salle", name: "Tour de salle", family: "exploration", shape: "patch", symbol: "◎", condition: "Réussir des voies sur 15 cordes différentes.", qualifies: (m) => m.distinctRopeCount >= 15 },
  { id: "polyvalent", name: "Polyvalent", family: "exploration", shape: "patch", symbol: "◇", condition: "Réussir des voies couvrant au moins 6 caractéristiques différentes.", qualifies: (m) => m.distinctTagCount >= 6 },
  { id: "habitue", name: "Habitué", family: "consistency", shape: "ribbon", symbol: "5×", condition: "Avoir participé à 5 séances passées.", qualifies: (m) => m.pastSessionCount >= 5 },
  { id: "fidele", name: "Fidèle", family: "consistency", shape: "ribbon", symbol: "25×", condition: "Avoir participé à 25 séances passées.", qualifies: (m) => m.pastSessionCount >= 25 },
  { id: "mardi_midi", name: "Grimpeur du mardi", family: "schedule", shape: "ribbon", symbol: "Ma", condition: "Participer à 3 séances du mardi midi.", qualifies: (m) => m.tuesdayLunchCount >= 3 },
  { id: "jeudi_midi", name: "Grimpeur du jeudi", family: "schedule", shape: "ribbon", symbol: "Je", condition: "Participer à 3 séances du jeudi midi.", qualifies: (m) => m.thursdayLunchCount >= 3 },
  { id: "matin", name: "Lève-tôt", family: "schedule", shape: "ribbon", symbol: "AM", condition: "Participer à 3 séances du matin.", qualifies: (m) => m.morningSessionCount >= 3 },
  { id: "soir", name: "Oiseau de nuit", family: "schedule", shape: "ribbon", symbol: "PM", condition: "Participer à 3 séances du soir.", qualifies: (m) => m.eveningSessionCount >= 3 },
  { id: "oeil_ouvreur", name: "Œil d'ouvreur", family: "contribution", shape: "rosette", symbol: "≋", condition: "Proposer une cotation sur 10 voies différentes.", qualifies: (m) => m.proposedGradeRouteCount >= 10 },
  { id: "critique_voies", name: "Critique de voies", family: "contribution", shape: "rosette", symbol: "★", condition: "Noter 20 voies différentes.", qualifies: (m) => m.ratedRouteCount >= 20 },
  { id: "collectionneur", name: "Collectionneur", family: "prestige", shape: "crystal", symbol: "50", condition: "Réussir 50 voies différentes.", qualifies: (m) => m.distinctSuccessfulRouteCount >= 50 },
  { id: "centurion", name: "Centurion", family: "prestige", shape: "crystal", symbol: "100", condition: "Atteindre 100 réalisations réussies.", qualifies: (m) => m.successfulCount >= 100 },
  {
    id: "cristal",
    name: "Cristal",
    family: "prestige",
    shape: "crystal",
    symbol: "◆",
    condition: "Réussir jusqu'à 100 voies actuelles, 25 séances, une réussite en tête et 6 caractéristiques différentes.",
    qualifies: (m) => m.cristalTargetRouteCount > 0
      && m.distinctExistingSuccessfulRouteCount >= m.cristalTargetRouteCount
      && m.pastSessionCount >= 25
      && m.successfulLeadCount >= 1
      && m.distinctTagCount >= 6,
  },
];

function localIsoDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "9999-12-31";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function routeTags(route) {
  if (Array.isArray(route?.tags)) return route.tags;
  if (typeof route?.tags === "string") return route.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

export function calculateParticipantBadgeMetrics({ realisations = [], routesById = {}, sessions = [], now = new Date() } = {}) {
  const successfulRealisations = realisations.filter(isSuccessfulRealisation);
  const successfulRouteIds = new Set(successfulRealisations.map((r) => String(r.voieId || "")).filter(Boolean));
  const existingRouteIds = new Set(
    Object.values(routesById)
      .filter((route) => route && route.active !== false)
      .map((route) => String(route.id || route.numeroVoieUnique || ""))
      .filter(Boolean),
  );
  const successfulExistingRouteIds = new Set(
    [...successfulRouteIds].filter((routeId) => existingRouteIds.has(routeId)),
  );

  const successfulLeadCount = successfulRealisations.filter((r) => isSuccessfulLeadRealisation(r, routesById[r.voieId])).length;
  const successfulTopropeCount = successfulRealisations.filter((r) => getRealisationMode(r, routesById[r.voieId]) === "moulinette").length;

  const distinctRopes = new Set();
  const distinctTags = new Set();
  let bestGradeIndex = -1;

  successfulRouteIds.forEach((routeId) => {
    const route = routesById[routeId];
    if (!route) return;
    distinctRopes.add(normalizeRopeNumber(route.numeroCorde));
    routeTags(route).forEach((tag) => distinctTags.add(String(tag).trim().toLowerCase()));
    const gradeIndex = GRADES.indexOf(route.cotationAjustee || route.cotationReference);
    if (gradeIndex > bestGradeIndex) bestGradeIndex = gradeIndex;
  });

  const today = localIsoDay(now);
  const pastSessionList = sessions.filter((session) => {
    const date = String(session?.date || "").slice(0, 10);
    return Boolean(date) && date <= today;
  });
  const pastSessions = new Set(
    pastSessionList.map((session) => String(session?.id || `${session?.date || ""}-${session?.slot || ""}`)),
  );
  const sessionWeekday = (session) => {
    const date = String(session?.date || "").slice(0, 10);
    const parsed = new Date(`${date}T12:00:00`);
    return Number.isFinite(parsed.getTime()) ? parsed.getDay() : -1;
  };
  const tuesdayLunchCount = pastSessionList.filter((session) => sessionWeekday(session) === 2 && session?.slot === "midi").length;
  const thursdayLunchCount = pastSessionList.filter((session) => sessionWeekday(session) === 4 && session?.slot === "midi").length;
  const morningSessionCount = pastSessionList.filter((session) => session?.slot === "matin").length;
  const eveningSessionCount = pastSessionList.filter((session) => session?.slot === "soir").length;

  const proposedGradeRoutes = new Set(realisations.filter((r) => String(r.cotationProposee || "").trim()).map((r) => String(r.voieId || "")).filter(Boolean));
  const ratedRoutes = new Set(realisations.filter((r) => Number(r.rating || 0) > 0).map((r) => String(r.voieId || "")).filter(Boolean));
  const cristalTargetRouteCount = Math.min(100, existingRouteIds.size);

  return {
    successfulCount: successfulRealisations.length,
    successfulLeadCount,
    successfulTopropeCount,
    onsightCount: successfulRealisations.filter((r) => getRealisationCriterion(r) === "a_vue").length,
    flashCount: successfulRealisations.filter((r) => getRealisationCriterion(r) === "flash").length,
    distinctSuccessfulRouteCount: successfulRouteIds.size,
    distinctExistingSuccessfulRouteCount: successfulExistingRouteIds.size,
    existingRouteCount: existingRouteIds.size,
    cristalTargetRouteCount,
    distinctRopeCount: distinctRopes.size,
    distinctTagCount: distinctTags.size,
    bestGradeIndex,
    bestGrade: bestGradeIndex >= 0 ? GRADES[bestGradeIndex] : null,
    pastSessionCount: pastSessions.size,
    tuesdayLunchCount,
    thursdayLunchCount,
    morningSessionCount,
    eveningSessionCount,
    proposedGradeRouteCount: proposedGradeRoutes.size,
    ratedRouteCount: ratedRoutes.size,
  };
}

export function calculateParticipantBadges(input = {}) {
  const metrics = calculateParticipantBadgeMetrics(input);
  return BADGE_CATALOG.map((definition) => ({
    ...definition,
    condition: definition.id === "cristal"
      ? `Réussir ${metrics.cristalTargetRouteCount} voie${metrics.cristalTargetRouteCount > 1 ? "s" : ""} actuelle${metrics.cristalTargetRouteCount > 1 ? "s" : ""} (maximum 100), participer à 25 séances, réussir au moins une voie en tête et couvrir 6 caractéristiques différentes.`
      : definition.condition,
    earned: Boolean(definition.qualifies(metrics)),
  }));
}

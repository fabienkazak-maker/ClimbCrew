import { getRealisationModeWeight } from "./realisation-mode.js";

export function calculateCpr({
  realisations,
  routesById,
  grades,
  isSuccessful,
  now = Date.now(),
  windowDays = 90,
  maxRealisations = 10,
}) {
  const cutoff = now - (windowDays * 24 * 60 * 60 * 1000);
  const gradeToIndex = (grade) => grades.indexOf(grade);
  const indexToGrade = (index) => grades[Math.max(0, Math.min(grades.length - 1, index))];

  const bestRecent = realisations
    .map((realisation) => {
      const route = routesById[realisation.voieId];
      const timestamp = new Date(realisation.dateRealisation).getTime();
      if (!route || !Number.isFinite(timestamp) || timestamp < cutoff || timestamp > now) return null;
      if (!isSuccessful(realisation, route)) return null;
      const grade = route.cotationAjustee || route.cotationReference;
      const gradeIndex = gradeToIndex(grade);
      if (gradeIndex < 0) return null;
      const modeWeight = getRealisationModeWeight(realisation, route);
      return {
        id: realisation.id,
        date: realisation.dateRealisation,
        grade,
        weightedIndex: gradeIndex * modeWeight,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weightedIndex - a.weightedIndex || b.date.localeCompare(a.date))
    .slice(0, maxRealisations);

  if (!bestRecent.length) return { currentGrade: null, averageIndex: null, timeline: [] };
  const averageIndex = bestRecent.reduce((sum, item) => sum + item.weightedIndex, 0) / bestRecent.length;
  return { currentGrade: indexToGrade(Math.round(averageIndex)), averageIndex, timeline: bestRecent };
}

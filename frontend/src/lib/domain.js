import { PASSPORT_STYLES } from "./ui-config.js";

export const GRADES = ["4a","4b","4c","5a","5b","5c","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b"];

export const STYLE_WEIGHTS = {
  a_vue: 1.25,
  flash: 1.2,
  en_tete: 1,
  moulinette: 0.85,
  avec_repos: 0.6,
  travaillee: 0.75,
  projet: 0.3,
  non_enchainee: 0.2,
  test: 0.1,
};

export const MAX_PARTICIPANTS = 18;

export function fullName(p) {
  return p ? `${p.nom} ${p.prenom}`.trim() : "";
}

export function formatRouteName(route) {
  const opener = String(route?.nomOuvreur || "").trim();
  const name = String(route?.nomVoie || "").trim();
  const label = [opener, name].filter(Boolean).join(" · ");
  return label || "Voie";
}

export function toLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  const date = new Date();
  const day = date.getDay();

  // Si l'application est ouverte le week-end, on positionne directement
  // la vue sur le prochain lundi, car les séances sont en semaine.
  if (day === 6) date.setDate(date.getDate() + 2);
  if (day === 0) date.setDate(date.getDate() + 1);

  return toLocalIso(date);
}

/**
 * Règle de création automatique des séances :
 * - toutes les séances sont libres par défaut ;
 * - les séances du mardi midi et du jeudi midi sont encadrées.
 */
export function defaultSessionStatus(dateStr, slot) {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return slot === "midi" && (day === 2 || day === 4) ? "encadree" : "libre";
}

export function normalizePassport(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isDiscoveryPassport(passport) {
  const normalized = normalizePassport(passport);
  return normalized === "decouverte" || normalized === "decouvertes";
}

export function getPassportStyle(participant) {
  const isCotisant = Boolean(participant?.cotisation);
  const hasFfmeLicence = Boolean(participant?.ffme);
  const borderColor = isCotisant ? "#22c55e" : "#ef4444";

  return {
    color: "inherit",
    background: "transparent",
    border: `2px ${hasFfmeLicence ? "solid" : "dashed"} ${borderColor}`,
    boxShadow: isCotisant
      ? "0 0 0 1px rgba(34,197,94,.18)"
      : "0 0 0 1px rgba(239,68,68,.18)",
  };
}

export function getPassportDotStyle(participant) {
  const baseStyle = isDiscoveryPassport(participant?.passport)
    ? PASSPORT_STYLES.decouverte
    : PASSPORT_STYLES[participant?.passport] || PASSPORT_STYLES.sans;

  return { backgroundColor: baseStyle.backgroundColor };
}

export function gradeToIndex(grade) {
  return GRADES.indexOf(grade);
}

export function indexToGrade(index) {
  const i = Math.max(0, Math.min(GRADES.length - 1, index));
  return GRADES[i];
}

export function getRouteBackgroundColor(color) {
  const normalized = String(color || "").trim().toLowerCase();
  const map = {
    bleu: "#60a5fa", blue: "#60a5fa", rouge: "#f87171", red: "#f87171",
    vert: "#4ade80", green: "#4ade80", jaune: "#facc15", yellow: "#facc15",
    orange: "#fb923c", violet: "#a78bfa", purple: "#a78bfa", rose: "#f472b6",
    pink: "#f472b6", noir: "#94a3b8", black: "#94a3b8", blanc: "#f8fafc",
    white: "#f8fafc", ocre: "#8b5a2b", ochre: "#8b5a2b", marron: "#8b5a2b", brown: "#8b5a2b",
    gris: "#cbd5e1", gray: "#cbd5e1", grey: "#cbd5e1",
  };
  return map[normalized] || "#f8fafc";
}

export function getContrastingTextColor(backgroundColor) {
  const hex = String(backgroundColor || "").trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#0f172a";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#0f172a" : "#f8fafc";
}

export function getRouteCardStyle(color) {
  const backgroundColor = getRouteBackgroundColor(color);
  const normalizedColor = normalizePassport(color);
  return {
    backgroundColor,
    color: ["blanc", "white"].includes(normalizedColor)
      ? "#0f172a"
      : getContrastingTextColor(backgroundColor),
  };
}

export function formatDateFr(dateStr) {
  const formatted = new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateShortFr(dateStr) {
  const [year, month, day] = String(dateStr || "").slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : String(dateStr || "");
}

export function formatPoints(value) {
  return Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function isWeekend(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function nextBusinessDay(dateStr, delta) {
  const d = new Date(`${dateStr}T12:00:00`);
  do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().slice(0, 10);
}

export function calculateSimpleCpr(realisations, routesById) {
  const now = Date.now();
  const cutoff = now - (90 * 24 * 60 * 60 * 1000);

  const bestRecent = realisations
    .map((r) => {
      const route = routesById[r.voieId];
      const dateTimestamp = new Date(r.dateRealisation).getTime();
      if (!route || !Number.isFinite(dateTimestamp) || dateTimestamp < cutoff || dateTimestamp > now) return null;

      return {
        id: r.id,
        date: r.dateRealisation,
        grade: route.cotationAjustee,
        weightedIndex: gradeToIndex(route.cotationAjustee) * (STYLE_WEIGHTS[r.styleRealisation] || 1),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weightedIndex - a.weightedIndex || b.date.localeCompare(a.date))
    .slice(0, 10);

  if (!bestRecent.length) return { currentGrade: null, averageIndex: null, timeline: [] };

  const averageIndex = bestRecent.reduce((sum, item) => sum + item.weightedIndex, 0) / bestRecent.length;
  return { currentGrade: indexToGrade(Math.round(averageIndex)), averageIndex, timeline: bestRecent };
}

export function weightedMedian(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => gradeToIndex(a.grade) - gradeToIndex(b.grade));
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= total / 2) return item.grade;
  }
  return sorted[sorted.length - 1].grade;
}

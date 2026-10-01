export const PASSPORT_OPTIONS = [
  { value: "sans", label: "Sans" },
  { value: "jaune", label: "Jaune" },
  { value: "jaune_d", label: "Jaune D" },
  { value: "orange", label: "Orange" },
  { value: "orange_d", label: "Orange D" },
  { value: "vert", label: "Vert" },
  { value: "vert_d", label: "Vert D" },
  { value: "bleu", label: "Bleu" },
  { value: "bleu_d", label: "Bleu D" },
  { value: "decouverte", label: "Découverte" },
];

export const PASSPORT_VALUES = PASSPORT_OPTIONS.map(({ value }) => value);

const PASSPORT_LABELS = Object.fromEntries(
  PASSPORT_OPTIONS.map(({ value, label }) => [value, label]),
);

const LIBRE_ELIGIBLE_COLORS = new Set(["jaune", "orange", "vert", "bleu"]);

export function normalizePassport(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getPassportColor(value) {
  const normalized = normalizePassport(value);
  if (normalized === "decouverte" || normalized === "decouvertes") return "decouverte";
  return normalized.endsWith("_d") ? normalized.slice(0, -2) : normalized;
}

export function hasPassportDiscoveryMark(value) {
  const normalized = normalizePassport(value);
  return normalized === "decouverte"
    || normalized === "decouvertes"
    || normalized.endsWith("_d");
}

export function isLibreEligiblePassport(value) {
  return LIBRE_ELIGIBLE_COLORS.has(getPassportColor(value));
}

export function formatPassportLabel(value) {
  const normalized = normalizePassport(value);
  if (normalized === "decouvertes") return "Découverte";
  return PASSPORT_LABELS[normalized] || String(value || "Sans");
}

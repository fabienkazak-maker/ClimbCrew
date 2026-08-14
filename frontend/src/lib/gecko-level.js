const GRADE_LEVELS = {
  "4a": 1,
  "4b": 1,
  "4c": 1,
  "5a": 1,
  "5b": 2,
  "5c": 2,
  "6a": 3,
  "6a+": 3,
  "6b": 4,
  "6b+": 4,
  "6c": 5,
  "6c+": 6,
  "7a": 7,
  "7a+": 7,
  "7b": 8,
};

const LEVEL_LABELS = {
  neutral: ["Novice", "Grimpeur", "Encordé", "En tête", "Confirmé", "Expert", "Maître", "Cristal"],
  feminine: ["Novice", "Grimpeuse", "Encordée", "En tête", "Confirmée", "Experte", "Maîtresse", "Cristal"],
};

export function getGeckoLevel(grade) {
  return GRADE_LEVELS[String(grade || "").trim().toLowerCase()] || 1;
}

export function getGeckoVariant(sexe) {
  return String(sexe || "").trim().toUpperCase() === "F" ? "feminine" : "neutral";
}

export function getGeckoLevelLabel(level, sexe) {
  const safeLevel = Math.min(8, Math.max(1, Number(level) || 1));
  const variant = getGeckoVariant(sexe);
  return LEVEL_LABELS[variant][safeLevel - 1];
}

export function getGeckoLevelInfo(grade, sexe) {
  const level = getGeckoLevel(grade);
  return {
    level,
    variant: getGeckoVariant(sexe),
    label: getGeckoLevelLabel(level, sexe),
  };
}

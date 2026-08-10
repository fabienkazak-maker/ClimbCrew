export const PASSPORT_STYLES = {
  sans: { backgroundColor: "#334155", color: "#f8fafc" },
  jaune: { backgroundColor: "#fde047", color: "#111827" },
  orange: { backgroundColor: "#fb923c", color: "#111827" },
  vert: { backgroundColor: "#22c55e", color: "#052e16" },
  bleu: { backgroundColor: "#60a5fa", color: "#0f172a" },

  decouverte: { backgroundColor: "#64748b", color: "#ffffff" },
  "dAccouverte": { backgroundColor: "#64748b", color: "#ffffff" },
  decouvertes: { backgroundColor: "#64748b", color: "#ffffff" },
  "dAccouvertes": { backgroundColor: "#64748b", color: "#ffffff" },
};

export const ROPE_NUMBERS = Array.from({ length: 22 }, (_, index) => index);

export const ROUTE_COLORS = ["Blanc", "Bleu", "Gris", "Jaune", "Marron", "Noir", "Ocre", "Orange", "Rose", "Rouge", "Vert", "Violet"];

export const STYLE_LABELS = {
  a_vue: "A? vue",
  flash: "Flash",
  en_tete: "En tAe",
  moulinette: "En moulinette",
  avec_repos: "Avec repos",
  travaillee: "TravaillAce",
  projet: "Projet",
  non_enchainee: "Non enchaArnAce",
  test: "Essai / test",
};

export const THECRAG_STYLE_BY_CLIMBCREW = {
  a_vue: "Onsight",
  flash: "Flash",
  en_tete: "Redpoint",
  moulinette: "Top rope",
  avec_repos: "Dog",
  travaillee: "Redpoint",
  projet: "Attempt",
  non_enchainee: "Attempt",
  test: "Attempt",
};

export const ROUTE_TAGS = [
  { value: "dalle", label: "Dalle" },
  { value: "devers", label: "DAcvers" },
  { value: "physique", label: "Physique" },
  { value: "technique", label: "Technique" },
  { value: "a_doigts", label: "A? doigts" },
  { value: "continuite", label: "ContinuitAc" },
  { value: "morphologique", label: "Morphologique" },
  { value: "engagee", label: "EngagAce" },
];

export function fullName(p) {
  return p ? `${p.nom} ${p.prenom}`.trim() : "";
}

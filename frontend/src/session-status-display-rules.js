// Règle d'éligibilité visuelle d'une séance libre.
// Les personnes déjà inscrites restent affichées lors du passage Encadrée -> Libre,
// mais celles qui ne possèdent pas un passeport autorisé sont signalées visuellement.
export const FREE_SESSION_ALLOWED_PASSPORTS = new Set(["jaune", "orange", "vert", "bleu"]);

export function normalizeSessionPassport(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isEligibleForFreeSession(passport) {
  return FREE_SESSION_ALLOWED_PASSPORTS.has(normalizeSessionPassport(passport));
}

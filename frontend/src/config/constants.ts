import type { NewAchievement, NewParticipant, NewRoute } from "../domain/types";

export const API_BASE = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  ""
).replace(/\/$/, "");
export const USE_API = API_BASE.length > 0;
export const STORAGE_KEY = "climbcrew_local_data_v2";
export const CSRF_COOKIE_NAME =
  import.meta.env.VITE_CSRF_COOKIE_NAME ?? "climbcrew_csrf";
export const MAX_PARTICIPANTS = 18;
export const APP_VERSION_LABEL = "Version 4.0.0";
export const GRADES = [
  "4a",
  "4b",
  "4c",
  "5a",
  "5b",
  "5c",
  "6a",
  "6a+",
  "6b",
  "6b+",
  "6c",
  "6c+",
  "7a",
  "7a+",
  "7b",
];
export const ACHIEVEMENT_STYLES: Record<string, string> = {
  a_vue: "À vue",
  flash: "Flash",
  en_tete: "En tête",
  moulinette: "En moulinette",
  avec_repos: "Avec repos",
  travaillee: "Travaillée",
  projet: "Projet",
  non_enchainee: "Non enchaînée",
  test: "Essai / test",
};

export const EMPTY_PARTICIPANT: NewParticipant = {
  nom: "",
  prenom: "",
  passport: "sans",
  cotisation: false,
  ffme: false,
  canEncadrer: false,
  canReferer: false,
  canAdmin: false,
};

export const EMPTY_ROUTE: NewRoute = {
  numeroVoieUnique: "",
  numeroCorde: "1",
  couleurPrises: "",
  cotationReference: "5c",
  nomVoie: "",
  nomOuvreur: "",
  moulinetteOnly: false,
};

export const EMPTY_ACHIEVEMENT: NewAchievement = {
  participantId: "",
  selectedDay: "",
  voieId: "",
  styleRealisation: "a_vue",
  commentaire: "",
  cotationProposee: "",
  nbEssais: "",
};

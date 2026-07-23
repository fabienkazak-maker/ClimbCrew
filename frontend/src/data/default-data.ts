import type {
  Achievement,
  AppData,
  ClimbingRoute,
  ClimbingSession,
  Participant,
  Rope,
} from "../domain/types";
import {
  hasBoolean,
  hasNullableString,
  hasNumber,
  hasString,
  isRecord,
  isStringArray,
} from "../lib/guards";

export function isParticipant(value: unknown): value is Participant {
  return (
    isRecord(value) &&
    ["id", "nom", "prenom", "passport"].every((key) => hasString(value, key)) &&
    ["cotisation", "ffme", "canEncadrer", "canReferer", "canAdmin"].every(
      (key) => hasBoolean(value, key),
    )
  );
}

export function isSession(value: unknown): value is ClimbingSession {
  if (!isRecord(value)) return false;
  const slot = value.slot;
  const status = value.status;
  return (
    ["id", "date"].every((key) => hasString(value, key)) &&
    (slot === "matin" || slot === "midi" || slot === "soir") &&
    (status === "fermee" || status === "libre" || status === "encadree") &&
    hasNullableString(value, "encadrantId") &&
    hasNullableString(value, "referentId") &&
    isStringArray(value.participantIds)
  );
}

export function isRope(value: unknown): value is Rope {
  return (
    isRecord(value) &&
    hasNumber(value, "numeroCorde") &&
    hasBoolean(value, "actif") &&
    hasString(value, "couleurCorde")
  );
}

export function isRoute(value: unknown): value is ClimbingRoute {
  if (!isRecord(value)) return false;
  const strings = [
    "id",
    "numeroVoieUnique",
    "couleurPrises",
    "cotationReference",
    "cotationAjustee",
    "nomVoie",
    "nomOuvreur",
    "dateCreation",
  ];
  return (
    strings.every((key) => hasString(value, key)) &&
    (value.numeroCorde === null || hasNumber(value, "numeroCorde")) &&
    hasBoolean(value, "moulinetteOnly") &&
    hasBoolean(value, "active")
  );
}

export function isAchievement(value: unknown): value is Achievement {
  if (!isRecord(value)) return false;
  const required = [
    "id",
    "participantId",
    "sessionId",
    "voieId",
    "dateRealisation",
    "styleRealisation",
    "commentaire",
    "cotationProposee",
  ];
  return (
    required.every((key) => hasString(value, key)) &&
    (value.nbEssais === undefined || typeof value.nbEssais === "number")
  );
}

export function isAppData(value: unknown): value is AppData {
  if (!isRecord(value)) return false;
  return (
    (value.exportedAt === null || hasString(value, "exportedAt")) &&
    ["version", "selectedDate", "selectedParticipantProgress"].every((key) =>
      hasString(value, key),
    ) &&
    Array.isArray(value.participants) &&
    value.participants.every(isParticipant) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isSession) &&
    Array.isArray(value.ropes) &&
    value.ropes.every(isRope) &&
    Array.isArray(value.routes) &&
    value.routes.every(isRoute) &&
    Array.isArray(value.realisations) &&
    value.realisations.every(isAchievement)
  );
}

export const DEFAULT_DATA: AppData = {
  exportedAt: null,
  version: "4.0.0",
  participants: [],
  sessions: [],
  ropes: [],
  routes: [],
  realisations: [],
  selectedDate: "",
  selectedParticipantProgress: "",
};

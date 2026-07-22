import type {
  AchievementBody,
  ParticipantBody,
  RouteBody,
  SessionBody,
} from "./domain";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

export function cleanEmail(value: unknown): string {
  return stringValue(value).toLowerCase();
}

export function isStrongPassword(value: string): boolean {
  return (
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function participantBody(value: unknown): ParticipantBody | null {
  if (!isRecord(value)) return null;
  const nom = stringValue(value.nom);
  const prenom = stringValue(value.prenom);
  if (!nom || !prenom) return null;
  return {
    nom,
    prenom,
    passport: stringValue(value.passport) || "sans",
    cotisation: booleanValue(value.cotisation),
    ffme: booleanValue(value.ffme),
    canEncadrer: booleanValue(value.canEncadrer),
    canReferer: booleanValue(value.canReferer),
    canAdmin: booleanValue(value.canAdmin),
  };
}

export function sessionBody(id: string, value: unknown): SessionBody | null {
  if (!isRecord(value)) return null;
  const date = stringValue(value.date);
  const slot = value.slot;
  const status = value.status;
  if (!id || !date || (slot !== "matin" && slot !== "midi" && slot !== "soir"))
    return null;
  if (status !== "fermee" && status !== "libre" && status !== "encadree")
    return null;
  if (
    !Array.isArray(value.participantIds) ||
    !value.participantIds.every(
      (item) => typeof item === "string" && /^\d+$/.test(item),
    )
  )
    return null;
  return {
    id,
    date,
    slot,
    status,
    encadrantId:
      typeof value.encadrantId === "string" && /^\d+$/.test(value.encadrantId)
        ? value.encadrantId
        : null,
    referentId:
      typeof value.referentId === "string" && /^\d+$/.test(value.referentId)
        ? value.referentId
        : null,
    participantIds: value.participantIds,
  };
}

export function routeBody(id: string, value: unknown): RouteBody | null {
  if (!id || !isRecord(value)) return null;
  const numeroVoieUnique = stringValue(value.numeroVoieUnique);
  const couleurPrises = stringValue(value.couleurPrises);
  const rawRope = value.numeroCorde;
  const numeroCorde = rawRope === null ? null : Number(rawRope);
  if (
    !numeroVoieUnique ||
    !couleurPrises ||
    (numeroCorde !== null && !Number.isInteger(numeroCorde))
  )
    return null;
  const cotationReference = stringValue(value.cotationReference);
  return {
    id,
    numeroVoieUnique,
    numeroCorde,
    couleurPrises,
    cotationReference,
    cotationAjustee: stringValue(value.cotationAjustee) || cotationReference,
    nomVoie: stringValue(value.nomVoie),
    nomOuvreur: stringValue(value.nomOuvreur),
    moulinetteOnly: booleanValue(value.moulinetteOnly),
    active: value.active !== false,
    dateCreation: stringValue(value.dateCreation),
  };
}

export function achievementBody(value: unknown): AchievementBody | null {
  if (!isRecord(value)) return null;
  const keys = [
    "id",
    "participantId",
    "sessionId",
    "voieId",
    "dateRealisation",
    "styleRealisation",
  ];
  if (!keys.every((key) => typeof value[key] === "string" && value[key] !== ""))
    return null;
  const id = stringValue(value.id);
  const participantId = stringValue(value.participantId);
  const sessionId = stringValue(value.sessionId);
  const voieId = stringValue(value.voieId);
  const dateRealisation = stringValue(value.dateRealisation);
  const styleRealisation = stringValue(value.styleRealisation);
  return {
    id,
    participantId,
    sessionId,
    voieId,
    dateRealisation,
    styleRealisation,
    commentaire: stringValue(value.commentaire),
    cotationProposee: stringValue(value.cotationProposee),
    ...(typeof value.nbEssais === "number" ? { nbEssais: value.nbEssais } : {}),
  };
}

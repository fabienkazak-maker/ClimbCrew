import type { AchievementBody } from "../domain";
import {
  achievementBody,
  isRecord,
  participantBody,
  routeBody,
} from "../validation";
import type {
  ImportDataset,
  ImportedParticipant,
  ImportedRope,
  ImportedSession,
} from "./import-types";

function identifier(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function participant(value: unknown): ImportedParticipant | null {
  if (!isRecord(value)) return null;
  const sourceId = identifier(value.id);
  const body = participantBody(value);
  return sourceId && body ? { sourceId, body } : null;
}

function session(value: unknown): ImportedSession | null {
  if (!isRecord(value)) return null;
  const sourceId = identifier(value.id);
  const date = typeof value.date === "string" ? value.date.trim() : "";
  const { slot, status } = value;
  if (
    !sourceId ||
    !date ||
    (slot !== "matin" && slot !== "midi" && slot !== "soir") ||
    (status !== "fermee" && status !== "libre" && status !== "encadree") ||
    !Array.isArray(value.participantIds)
  )
    return null;
  const participantIds = value.participantIds.map(identifier);
  if (participantIds.some((id) => !id)) return null;
  return {
    sourceId,
    date,
    slot,
    status,
    encadrantId: identifier(value.encadrantId) || null,
    referentId: identifier(value.referentId) || null,
    participantIds,
  };
}

function rope(value: unknown): ImportedRope | null {
  if (!isRecord(value)) return null;
  const numeroCorde = Number(value.numeroCorde);
  if (
    !Number.isInteger(numeroCorde) ||
    typeof value.couleurCorde !== "string"
  ) {
    return null;
  }
  return {
    numeroCorde,
    actif: value.actif !== false,
    couleurCorde: value.couleurCorde.trim(),
  };
}

function route(value: unknown) {
  if (!isRecord(value)) return null;
  return routeBody(identifier(value.id), value);
}

function achievement(value: unknown): AchievementBody | null {
  if (!isRecord(value)) return null;
  const normalized = {
    ...value,
    id: identifier(value.id),
    participantId: identifier(value.participantId),
    sessionId: identifier(value.sessionId),
    voieId: identifier(value.voieId),
  };
  return achievementBody(normalized);
}

function parseArray<T>(
  value: unknown,
  parser: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map(parser);
  return parsed.some((item) => item === null)
    ? null
    : parsed.filter((item) => item !== null);
}

export function parseImportDataset(value: unknown): ImportDataset | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.data) ? value.data : value;
  const participants = parseArray(source.participants, participant);
  const sessions = parseArray(source.sessions, session);
  const ropes = parseArray(source.ropes, rope);
  const routes = parseArray(source.routes, route);
  const achievements = parseArray(source.realisations, achievement);
  if (!participants || !sessions || !ropes || !routes || !achievements) {
    return null;
  }
  return { participants, sessions, ropes, routes, achievements };
}

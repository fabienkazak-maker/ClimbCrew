import { useCallback } from "react";
import { MAX_PARTICIPANTS, USE_API } from "../config/constants";
import type { ClimbingSession, SessionSlot } from "../domain/types";
import { requestJson } from "../lib/api";
import { useClimbData } from "./data-context";

type SessionPatch = Partial<Omit<ClimbingSession, "id" | "date" | "slot">>;
const SESSION_SLOTS: SessionSlot[] = ["matin", "midi", "soir"];

export interface SessionActions {
  ensureDate(date: string): void;
  updateSession(id: string, patch: SessionPatch): Promise<void>;
  addParticipant(id: string, participantId: string): Promise<void>;
  removeParticipant(id: string, participantId: string): Promise<void>;
}

function defaultStatus(
  date: string,
  slot: SessionSlot,
): ClimbingSession["status"] {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return slot === "midi" && (weekday === 2 || weekday === 4)
    ? "encadree"
    : "libre";
}

function createSession(date: string, slot: SessionSlot): ClimbingSession {
  return {
    id: `${date}-${slot}`,
    date,
    slot,
    status: defaultStatus(date, slot),
    encadrantId: null,
    referentId: null,
    participantIds: [],
  };
}

export function useSessionActions(): SessionActions {
  const { data, setData, setSyncStatus } = useClimbData();

  const ensureDate = useCallback(
    (date: string) => {
      setData((current) => {
        const additions = SESSION_SLOTS.filter(
          (slot) =>
            !current.sessions.some((item) => item.id === `${date}-${slot}`),
        ).map((slot) => createSession(date, slot));
        return additions.length
          ? { ...current, sessions: [...current.sessions, ...additions] }
          : current;
      });
    },
    [setData],
  );

  const persist = useCallback(
    async (session: ClimbingSession) => {
      if (!USE_API) return;
      await requestJson(`/sessions/${session.id}`, {
        method: "PUT",
        body: JSON.stringify(session),
      });
      setSyncStatus("Séance synchronisée");
    },
    [setSyncStatus],
  );

  const replace = useCallback(
    async (id: string, patch: SessionPatch) => {
      const current = data.sessions.find((item) => item.id === id);
      if (!current) throw new Error("Séance introuvable");
      const next = { ...current, ...patch };
      await persist(next);
      setData((value) => ({
        ...value,
        sessions: value.sessions.map((item) => (item.id === id ? next : item)),
      }));
    },
    [data.sessions, persist, setData],
  );

  const addParticipant = useCallback(
    async (id: string, participantId: string) => {
      const current = data.sessions.find((item) => item.id === id);
      if (
        !current ||
        !participantId ||
        current.participantIds.includes(participantId)
      )
        return;
      const occupied =
        current.participantIds.length +
        Number(Boolean(current.encadrantId)) +
        Number(Boolean(current.referentId));
      if (occupied >= MAX_PARTICIPANTS)
        throw new Error("La séance est complète.");
      await replace(id, {
        participantIds: [...current.participantIds, participantId],
      });
    },
    [data.sessions, replace],
  );

  const removeParticipant = useCallback(
    async (id: string, participantId: string) => {
      const current = data.sessions.find((item) => item.id === id);
      if (!current) return;
      await replace(id, {
        participantIds: current.participantIds.filter(
          (item) => item !== participantId,
        ),
      });
    },
    [data.sessions, replace],
  );

  return {
    ensureDate,
    updateSession: replace,
    addParticipant,
    removeParticipant,
  };
}

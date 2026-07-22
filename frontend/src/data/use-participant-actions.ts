import { useCallback } from "react";
import { EMPTY_PARTICIPANT, USE_API } from "../config/constants";
import type { NewParticipant, Participant } from "../domain/types";
import { requestJson } from "../lib/api";
import { useClimbData } from "./data-context";
import { isParticipant } from "./default-data";

export interface ParticipantActions {
  addParticipant(value: NewParticipant): Promise<NewParticipant>;
  updateParticipant(value: Participant): Promise<void>;
  deleteParticipant(id: string): Promise<void>;
}

export function useParticipantActions(): ParticipantActions {
  const { setData, setSyncStatus } = useClimbData();

  const addParticipant = useCallback(
    async (value: NewParticipant) => {
      if (!value.nom.trim() || !value.prenom.trim()) {
        throw new Error("Le nom et le prénom sont obligatoires.");
      }
      let participant: Participant = {
        ...value,
        id: `local-${crypto.randomUUID()}`,
        nom: value.nom.trim(),
        prenom: value.prenom.trim(),
      };
      if (USE_API) {
        const response = await requestJson("/participants", {
          method: "POST",
          body: JSON.stringify(value),
        });
        if (!isParticipant(response))
          throw new Error("Participant API invalide");
        participant = response;
      }
      setData((current) => ({
        ...current,
        participants: [...current.participants, participant],
      }));
      setSyncStatus(
        USE_API ? "Participant synchronisé" : "Participant ajouté localement",
      );
      return { ...EMPTY_PARTICIPANT };
    },
    [setData, setSyncStatus],
  );

  const updateParticipant = useCallback(
    async (value: Participant) => {
      if (USE_API) {
        const response = await requestJson(`/participants/${value.id}`, {
          method: "PUT",
          body: JSON.stringify(value),
        });
        if (!isParticipant(response))
          throw new Error("Participant API invalide");
      }
      setData((current) => ({
        ...current,
        participants: current.participants.map((item) =>
          item.id === value.id ? value : item,
        ),
      }));
    },
    [setData],
  );

  const deleteParticipant = useCallback(
    async (id: string) => {
      if (USE_API)
        await requestJson(`/participants/${id}`, { method: "DELETE" });
      setData((current) => ({
        ...current,
        participants: current.participants.filter((item) => item.id !== id),
        sessions: current.sessions.map((session) => ({
          ...session,
          participantIds: session.participantIds.filter((item) => item !== id),
        })),
        realisations: current.realisations.filter(
          (achievement) => achievement.participantId !== id,
        ),
      }));
    },
    [setData],
  );

  return { addParticipant, updateParticipant, deleteParticipant };
}

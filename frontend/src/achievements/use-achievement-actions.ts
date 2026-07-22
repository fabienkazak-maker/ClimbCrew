import { useCallback } from "react";
import { USE_API } from "../config/constants";
import { useClimbData } from "../data/data-context";
import { isAchievement } from "../data/default-data";
import type { Achievement, NewAchievement } from "../domain/types";
import { requestJson } from "../lib/api";

export interface AchievementActions {
  addAchievement(value: NewAchievement): Promise<void>;
  updateAchievement(value: Achievement): Promise<void>;
  deleteAchievement(id: string): Promise<void>;
}

export function useAchievementActions(): AchievementActions {
  const { data, setData } = useClimbData();

  const addAchievement = useCallback(
    async (value: NewAchievement) => {
      const session = data.sessions.find(
        (item) =>
          item.date === value.selectedDay &&
          item.participantIds.includes(value.participantId),
      );
      if (!session || !value.voieId)
        throw new Error("Participant, jour et voie requis.");
      let achievement: Achievement = {
        id: `achievement-${crypto.randomUUID()}`,
        participantId: value.participantId,
        sessionId: session.id,
        voieId: value.voieId,
        dateRealisation: value.selectedDay,
        styleRealisation: value.styleRealisation,
        commentaire: value.commentaire,
        cotationProposee: value.cotationProposee,
        ...(value.nbEssais ? { nbEssais: Number(value.nbEssais) } : {}),
      };
      if (USE_API) {
        const response = await requestJson("/realisations", {
          method: "POST",
          body: JSON.stringify(achievement),
        });
        if (!isAchievement(response))
          throw new Error("Réalisation API invalide");
        achievement = response;
      }
      setData((current) => ({
        ...current,
        realisations: [achievement, ...current.realisations],
      }));
    },
    [data.sessions, setData],
  );

  const updateAchievement = useCallback(
    async (value: Achievement) => {
      if (USE_API)
        await requestJson(`/realisations/${value.id}`, {
          method: "PUT",
          body: JSON.stringify(value),
        });
      setData((current) => ({
        ...current,
        realisations: current.realisations.map((item) =>
          item.id === value.id ? value : item,
        ),
      }));
    },
    [setData],
  );

  const deleteAchievement = useCallback(
    async (id: string) => {
      if (USE_API)
        await requestJson(`/realisations/${id}`, { method: "DELETE" });
      setData((current) => ({
        ...current,
        realisations: current.realisations.filter((item) => item.id !== id),
      }));
    },
    [setData],
  );

  return { addAchievement, updateAchievement, deleteAchievement };
}

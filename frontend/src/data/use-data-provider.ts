import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEY, USE_API } from "../config/constants";
import type { AppData } from "../domain/types";
import { requestJson } from "../lib/api";
import { todayIso } from "../lib/date";
import type { DataContextValue } from "./data-context";
import {
  DEFAULT_DATA,
  isAchievement,
  isAppData,
  isParticipant,
  isRope,
  isRoute,
  isSession,
} from "./default-data";

function initialData(): AppData {
  if (USE_API) return { ...DEFAULT_DATA, selectedDate: todayIso() };
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isAppData(parsed)) return { ...parsed, selectedDate: todayIso() };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return { ...DEFAULT_DATA, selectedDate: todayIso() };
}

function parseArray<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
  label: string,
): T[] {
  if (!Array.isArray(value) || !value.every(guard)) {
    throw new Error(`Contrat API invalide pour ${label}`);
  }
  return value;
}

export function useDataProvider(authenticated: boolean): DataContextValue {
  const [data, setData] = useState<AppData>(initialData);
  const [syncStatus, setSyncStatus] = useState(
    USE_API ? "En attente de connexion" : "Mode local",
  );

  useEffect(() => {
    if (!USE_API) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!USE_API || !authenticated) return;
    let active = true;
    setSyncStatus("Connexion à l’API");
    Promise.all([
      requestJson("/participants"),
      requestJson("/sessions"),
      requestJson("/realisations"),
      requestJson("/ropes"),
      requestJson("/routes"),
    ])
      .then(
        ([
          participantValue,
          sessionValue,
          achievementValue,
          ropeValue,
          routeValue,
        ]) => {
          const participants = parseArray(
            participantValue,
            isParticipant,
            "participants",
          );
          const sessions = parseArray(sessionValue, isSession, "sessions");
          const realisations = parseArray(
            achievementValue,
            isAchievement,
            "réalisations",
          );
          const ropes = parseArray(ropeValue, isRope, "cordes");
          const routes = parseArray(routeValue, isRoute, "voies");
          if (!active) return;
          setData((current) => ({
            ...current,
            participants,
            sessions,
            realisations,
            ropes,
            routes,
          }));
          setSyncStatus(`API connectée · ${participants.length} participants`);
        },
      )
      .catch((reason: Error) => active && setSyncStatus(reason.message));
    return () => {
      active = false;
    };
  }, [authenticated]);

  return useMemo(
    () => ({ data, setData, syncStatus, setSyncStatus }),
    [data, syncStatus],
  );
}

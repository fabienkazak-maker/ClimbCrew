import { useCallback } from "react";
import { EMPTY_ROUTE, USE_API } from "../config/constants";
import { useClimbData } from "../data/data-context";
import { isRoute } from "../data/default-data";
import type { ClimbingRoute, NewRoute } from "../domain/types";
import { requestJson } from "../lib/api";
import { todayIso } from "../lib/date";

export interface RouteActions {
  addRoute(value: NewRoute): Promise<NewRoute>;
  toggleRoute(id: string): Promise<void>;
}

export function useRouteActions(): RouteActions {
  const { data, setData } = useClimbData();
  const addRoute = useCallback(
    async (value: NewRoute) => {
      if (!value.numeroVoieUnique.trim() || !value.couleurPrises.trim()) {
        throw new Error("Le numéro et la couleur sont obligatoires.");
      }
      if (
        data.routes.some(
          (route) => route.numeroVoieUnique === value.numeroVoieUnique,
        )
      ) {
        throw new Error("Ce numéro de voie existe déjà.");
      }
      let route: ClimbingRoute = {
        ...value,
        id: `route-${crypto.randomUUID()}`,
        numeroCorde: Number(value.numeroCorde),
        cotationAjustee: value.cotationReference,
        active: true,
        dateCreation: todayIso(),
      };
      if (USE_API) {
        const response = await requestJson("/routes", {
          method: "POST",
          body: JSON.stringify(route),
        });
        if (!isRoute(response)) throw new Error("Voie API invalide");
        route = response;
      }
      setData((current) => ({
        ...current,
        routes: [...current.routes, route],
      }));
      return { ...EMPTY_ROUTE, numeroCorde: value.numeroCorde };
    },
    [data.routes, setData],
  );

  const toggleRoute = useCallback(
    async (id: string) => {
      const route = data.routes.find((item) => item.id === id);
      if (!route) throw new Error("Voie introuvable");
      const next = { ...route, active: !route.active };
      if (USE_API) {
        const response = await requestJson(`/routes/${id}`, {
          method: "PUT",
          body: JSON.stringify(next),
        });
        if (!isRoute(response)) throw new Error("Voie API invalide");
      }
      setData((current) => ({
        ...current,
        routes: current.routes.map((route) => (route.id === id ? next : route)),
      }));
    },
    [data.routes, setData],
  );

  return { addRoute, toggleRoute };
}

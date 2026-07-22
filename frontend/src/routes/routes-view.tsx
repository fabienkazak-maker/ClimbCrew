import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { EMPTY_ROUTE } from "../config/constants";
import { useClimbData } from "../data/data-context";
import type { NewRoute } from "../domain/types";
import { RouteCard } from "./route-card";
import { RouteForm } from "./route-form";
import { useRouteActions } from "./use-route-actions";

interface RoutesViewProps {
  onAchievement(routeId: string): void;
}

export function RoutesView({ onAchievement }: RoutesViewProps) {
  const { data } = useClimbData();
  const { user } = useAuth();
  const actions = useRouteActions();
  const [form, setForm] = useState<NewRoute>({ ...EMPTY_ROUTE });
  const [error, setError] = useState("");
  const canManage = user?.role === "admin";

  async function add(): Promise<void> {
    try {
      setForm(await actions.addRoute(form));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ajout impossible");
    }
  }

  return (
    <>
      {canManage && (
        <section className="card">
          <h2>Ajouter une voie</h2>
          <RouteForm
            value={form}
            ropes={data.ropes}
            setValue={setForm}
            onSubmit={() => void add()}
          />
          {error && <p className="error">{error}</p>}
        </section>
      )}
      <section className="card">
        <div className="card-header">
          <h2>Tableau des voies</h2>
          <span className="badge">
            {data.routes.filter((route) => route.active).length} actives
          </span>
        </div>
        <div className="stack">
          {data.ropes.map((rope) => (
            <section className="subcard" key={rope.numeroCorde}>
              <h3>
                Corde {rope.numeroCorde} · {rope.couleurCorde}
              </h3>
              <div className="stack">
                {data.routes
                  .filter((route) => route.numeroCorde === rope.numeroCorde)
                  .map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      achievements={data.realisations}
                      canManage={canManage}
                      onAchievement={onAchievement}
                      onToggle={actions.toggleRoute}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

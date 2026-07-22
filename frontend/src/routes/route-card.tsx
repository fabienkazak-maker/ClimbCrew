import type { Achievement, ClimbingRoute } from "../domain/types";
import { getRouteStyle } from "../lib/presentation";

interface RouteCardProps {
  route: ClimbingRoute;
  achievements: Achievement[];
  canManage: boolean;
  onAchievement(id: string): void;
  onToggle(id: string): Promise<void>;
}

export function RouteCard({
  route,
  achievements,
  canManage,
  onAchievement,
  onToggle,
}: RouteCardProps) {
  const routeAchievements = achievements.filter(
    (item) => item.voieId === route.id,
  );
  return (
    <article className="route-card" style={getRouteStyle(route.couleurPrises)}>
      <div className="card-header">
        <strong>
          {route.cotationAjustee} · {route.nomVoie || "Sans nom"}
        </strong>
        <div className="button-group">
          {route.moulinetteOnly && <span className="pill">Moulinette</span>}
          <span className="pill">{route.active ? "Active" : "Archivée"}</span>
          {route.active && (
            <button
              type="button"
              className="secondary"
              onClick={() => onAchievement(route.id)}
            >
              Réalisation
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="secondary"
              onClick={() => void onToggle(route.id)}
            >
              {route.active ? "Archiver" : "Réactiver"}
            </button>
          )}
        </div>
      </div>
      <p>
        Voie {route.numeroVoieUnique} · {route.couleurPrises} ·{" "}
        {route.nomOuvreur || "Ouvreur inconnu"}
      </p>
      <p className="small">
        Cotation de référence {route.cotationReference} ·{" "}
        {routeAchievements.length} réalisation(s)
      </p>
    </article>
  );
}

import React from "react";
import { GRADES, formatRouteName, getRouteCardStyle } from "../lib/domain.js";
import { ROPE_NUMBERS, ROUTE_COLORS } from "../lib/ui-config.js";

export default function Voies({
  adminUnlocked,
  newRoute,
  setNewRoute,
  addRoute,
  routeError,
  routes,
  ropes,
  routeAggregatesById,
  openRealisationModal,
  selectedParticipantProgress,
}) {
  return (
    <>
      {adminUnlocked && (
        <div className="card">
          <div className="card-header"><h2>Ajouter une voie</h2></div>
          <div className="grid four">
            <div><label>Corde</label><select value={newRoute.numeroCorde} onChange={(e) => setNewRoute((p) => ({ ...p, numeroCorde: e.target.value }))}>{ROPE_NUMBERS.map((numero) => <option key={numero} value={String(numero)}>Corde {numero}</option>)}</select></div>
            <div><label>Couleur voie</label><select value={newRoute.couleurPrises} onChange={(e) => setNewRoute((p) => ({ ...p, couleurPrises: e.target.value }))}>{ROUTE_COLORS.map((couleur) => <option key={couleur} value={couleur}>{couleur}</option>)}</select></div>
            <div><label>Cotation</label><select value={newRoute.cotationReference} onChange={(e) => setNewRoute((p) => ({ ...p, cotationReference: e.target.value }))}>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label>Nom de la voie</label><input value={newRoute.nomVoie} onChange={(e) => setNewRoute((p) => ({ ...p, nomVoie: e.target.value }))} /></div>
            <div><label>Ouvreur</label><input value={newRoute.nomOuvreur} onChange={(e) => setNewRoute((p) => ({ ...p, nomOuvreur: e.target.value }))} /></div>
            <div><label>Moulinette uniquement</label><select value={newRoute.moulinetteOnly ? "oui" : "non"} onChange={(e) => setNewRoute((p) => ({ ...p, moulinetteOnly: e.target.value === "oui" }))}><option value="non">Non</option><option value="oui">Oui</option></select></div>
            <div style={{ display: "flex", alignItems: "end" }}><button onClick={addRoute}>Ajouter</button></div>
          </div>
          {routeError && <div className="error" style={{ marginTop: 10 }}>{routeError}</div>}
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>Tableau des voies</h2></div>
        <div className="stack">
          {[...new Set(routes.map((route) => Number(route.numeroCorde)))].sort((a, b) => a - b).map((numeroCorde) => {
            const rope = ropes.find((item) => Number(item.numeroCorde) === numeroCorde);
            const ropeRoutes = routes.filter((route) => Number(route.numeroCorde) === numeroCorde);
            return (
              <div className="subcard" key={numeroCorde}>
                <div className="card-header">
                  <strong>Corde {numeroCorde}{rope?.couleurCorde ? ` · ${rope.couleurCorde}` : ""}</strong>
                  <span className="badge">{ropeRoutes.length} voie(s)</span>
                </div>
                {ropeRoutes.length === 0 ? (
                  <div className="small">Aucune voie sur cette corde.</div>
                ) : (
                  <div className="stack">
                    {ropeRoutes.map((route) => {
                      return (
                        <div className={`route-card ${route.moulinetteOnly ? "moulinette-only" : ""}`} key={route.id} style={getRouteCardStyle(route.couleurPrises)}>
                          <div className="card-header">
                            <strong>
                              Corde {route.numeroCorde} · {route.cotationAjustee} · {formatRouteName(route)}
                              {" · "}Consensus {routeAggregatesById[route.id]?.consensusGrade || "non calculé"}
                            </strong>
                            <div className="group">
                              {route.moulinetteOnly && <span className="pill">Moulinette uniquement</span>}
                              <button className="secondary" onClick={() => openRealisationModal(route.id, selectedParticipantProgress)}>Réalisation</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

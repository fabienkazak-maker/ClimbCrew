import React from "react";
import { GRADES, formatRouteName, getRouteCardStyle, normalizeRopeNumber } from "../lib/domain.js";
import { ROPE_NUMBERS, ROUTE_COLORS, ROUTE_TAGS } from "../lib/ui-config.js";

export default function Voies({
  adminUnlocked,
  newRoute,
  setNewRoute,
  addRoute,
  routeError,
  routeDisplayGroups,
  routeSortMode,
  setRouteSortMode,
  routeRatingsById,
  routeAggregatesById,
  openRealisationModal,
  selectedParticipantProgress,
  editingRouteId,
  routeEditDraft,
  setRouteEditDraft,
  startRouteEdition,
  saveRouteEdition,
  cancelRouteEdition,
  deleteRoute,
  savingRouteId,
}) {
  return (
    <>
      {adminUnlocked && (
        <div className="card">
          <div className="card-header">
            <h2>Ajouter une voie</h2>
            <button onClick={addRoute}>Ajouter</button>
          </div>
          <div className="grid four">
            <div><label>Corde</label><select value={newRoute.numeroCorde} onChange={(e) => setNewRoute((p) => ({ ...p, numeroCorde: e.target.value }))}><option value="" disabled>Choisir une corde</option>{ROPE_NUMBERS.map((numero) => <option key={numero} value={String(numero)}>Corde {numero}</option>)}</select></div>
            <div><label>Couleur voie</label><select value={newRoute.couleurPrises} onChange={(e) => setNewRoute((p) => ({ ...p, couleurPrises: e.target.value }))}><option value="" disabled>Choisir une couleur</option>{ROUTE_COLORS.map((couleur) => <option key={couleur} value={couleur}>{couleur}</option>)}</select></div>
            <div><label>Cotation</label><select value={newRoute.cotationReference} onChange={(e) => setNewRoute((p) => ({ ...p, cotationReference: e.target.value }))}><option value="" disabled>Choisir une cotation</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label>Nom de la voie</label><input value={newRoute.nomVoie} onChange={(e) => setNewRoute((p) => ({ ...p, nomVoie: e.target.value }))} /></div>
            <div><label>Ouvreur</label><input value={newRoute.nomOuvreur} onChange={(e) => setNewRoute((p) => ({ ...p, nomOuvreur: e.target.value }))} /></div>
            <div>
              <label className="checkbox-field">
                <input type="checkbox" checked={newRoute.moulinetteOnly} onChange={(event) => setNewRoute((p) => ({ ...p, moulinetteOnly: event.target.checked }))} />
                <span>Moulinette uniquement</span>
              </label>
            </div>
          </div>
          <div className="realisation-tags" style={{ marginTop: 10 }}>
            <label>Caractéristiques de la voie <span className="small">({newRoute.tags.length}/3 sélectionnées)</span></label>
            <div className="tag-selector" aria-label="Caractéristiques de la nouvelle voie">
              {ROUTE_TAGS.map((tag) => {
                const selected = newRoute.tags.includes(tag.value);
                const limitReached = newRoute.tags.length >= 3;
                return <button type="button" className={selected ? "tag-option selected" : "tag-option"} aria-pressed={selected} disabled={!selected && limitReached} key={tag.value} onClick={() => setNewRoute((prev) => ({ ...prev, tags: selected ? prev.tags.filter((value) => value !== tag.value) : [...prev.tags, tag.value] }))}>{selected && <span aria-hidden="true">✓ </span>}{tag.label}</button>;
              })}
            </div>
          </div>
          {routeError && <div className="error" style={{ marginTop: 10 }}>{routeError}</div>}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Tableau des voies</h2>
          <div className="group">
            <label htmlFor="route-sort-mode">Trier par</label>
            <select
              id="route-sort-mode"
              value={routeSortMode}
              onChange={(event) => setRouteSortMode(event.target.value)}
              style={{ width: "auto", minWidth: 150 }}
            >
              <option value="corde">Corde</option>
              <option value="cotation">Cotation</option>
            </select>
          </div>
        </div>
        <div className="stack">
          {routeDisplayGroups.map((group) => {
            return (
              <div className="subcard" key={group.key}>
                <div className="card-header">
                  <strong>{group.label}</strong>
                  <span className="badge">{group.routes.length} voie(s)</span>
                </div>
                {group.routes.length === 0 ? (
                  <div className="small">Aucune voie.</div>
                ) : (
                  <div className="stack">
                    {group.routes.map((route) => {
                      const routeRating = routeRatingsById[route.id] || { average: 0, count: 0 };
                      return (
                        <div className={`route-card ${route.moulinetteOnly ? "moulinette-only" : ""}`} key={route.id} style={getRouteCardStyle(route.couleurPrises)}>
                          {adminUnlocked && editingRouteId === route.id && routeEditDraft ? (
                            <>
                              <div className="grid three">
                                <div>
                                  <label>Corde</label>
                                  <select value={routeEditDraft.numeroCorde} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, numeroCorde: event.target.value }))}>
                                    {ROPE_NUMBERS.map((numero) => <option key={numero} value={String(numero)}>Corde {numero}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label>Couleur</label>
                                  <select value={routeEditDraft.couleurPrises} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, couleurPrises: event.target.value }))}>
                                    {ROUTE_COLORS.map((couleur) => <option key={couleur} value={couleur}>{couleur}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label>Cotation</label>
                                  <select value={routeEditDraft.cotationReference} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, cotationReference: event.target.value }))}>
                                    {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label>Nom de la voie</label>
                                  <input value={routeEditDraft.nomVoie} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, nomVoie: event.target.value }))} />
                                </div>
                                <div>
                                  <label>Ouvreur</label>
                                  <input value={routeEditDraft.nomOuvreur} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, nomOuvreur: event.target.value }))} />
                                </div>
                                <div>
                                  <label className="checkbox-field">
                                    <input type="checkbox" checked={routeEditDraft.moulinetteOnly} onChange={(event) => setRouteEditDraft((draft) => ({ ...draft, moulinetteOnly: event.target.checked }))} />
                                    <span>Moulinette uniquement</span>
                                  </label>
                                </div>
                              </div>
                              <div className="realisation-tags" style={{ marginTop: 8 }}>
                                <label>Caractéristiques de la voie <span className="small">({routeEditDraft.tags.length}/3 sélectionnées)</span></label>
                                <div className="tag-selector" aria-label="Modifier les caractéristiques de la voie">
                                  {ROUTE_TAGS.map((tag) => {
                                    const selected = routeEditDraft.tags.includes(tag.value);
                                    const limitReached = routeEditDraft.tags.length >= 3;
                                    return <button type="button" className={selected ? "tag-option selected" : "tag-option"} aria-pressed={selected} disabled={!selected && limitReached} key={tag.value} onClick={() => setRouteEditDraft((prev) => ({ ...prev, tags: selected ? prev.tags.filter((value) => value !== tag.value) : [...prev.tags, tag.value] }))}>{selected && <span aria-hidden="true">✓ </span>}{tag.label}</button>;
                                  })}
                                </div>
                              </div>
                              {routeError && <div className="error" style={{ marginTop: 8 }}>{routeError}</div>}
                              <div className="group" style={{ marginTop: 8 }}>
                                <button
                                  onClick={() => saveRouteEdition(route)}
                                  disabled={savingRouteId === route.id}
                                  aria-busy={savingRouteId === route.id}
                                >
                                  {savingRouteId === route.id ? "Enregistrement…" : "Enregistrer"}
                                </button>
                                <button className="secondary" onClick={cancelRouteEdition}>Annuler</button>
                                <button className="danger" onClick={() => deleteRoute(route)}>Supprimer la voie</button>
                              </div>
                            </>
                          ) : (
                            <div className="card-header">
                              <div className="route-summary">
                                <strong className="route-primary-line">
                                  {routeSortMode !== "corde" && <>Corde {normalizeRopeNumber(route.numeroCorde)} · </>}
                                  {route.cotationAjustee} · {formatRouteName(route)}
                                </strong>
                                <div className="route-secondary-line">
                                  <span>Consensus {routeAggregatesById[route.id]?.consensusGrade || "nc"}</span>
                                  {route.moulinetteOnly && <span className="pill moulinette-badge" title="Moulinette uniquement">Moulinette</span>}
                                </div>
                                <div className="route-characteristics" aria-label="Caractéristiques de la voie">
                                  <span className="route-characteristics-label">Caractéristiques :</span>
                                  {route.tags?.length > 0 ? route.tags.map((tag) => (
                                    <span className="route-characteristic" key={tag}>
                                      {ROUTE_TAGS.find((item) => item.value === tag)?.label || tag}
                                    </span>
                                  )) : <span className="route-characteristics-empty">non renseignées</span>}
                                </div>
                                <div className="route-rating">
                                  <span className="rating-average">
                                    {routeRating.count ? `★ ${routeRating.average.toFixed(1)} (${routeRating.count} réalisation${routeRating.count > 1 ? "s" : ""})` : "Pas encore notée (0 réalisation)"}
                                  </span>
                                </div>
                              </div>
                              <div className="group">
                                <button className="secondary" onClick={() => openRealisationModal(route.id, selectedParticipantProgress)}>Réalisation</button>
                                {adminUnlocked && <button className="secondary" onClick={() => startRouteEdition(route)}>Modifier</button>}
                              </div>
                            </div>
                          )}
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

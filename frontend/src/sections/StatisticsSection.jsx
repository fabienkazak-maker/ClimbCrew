import React from "react";
import { fullName } from "../climbing-ui-config.js";

export default function StatisticsSection({
  sessionStats,
  topRouteRankings,
  leadRealisationStats,
  formatRouteName,
  statsSortField,
  setStatsSortField,
  statsSortDirection,
  setStatsSortDirection,
  sortedStatsParticipants,
  getPassportStyle,
  normalizePassport,
  getPassportDotStyle,
  cprByParticipantId,
  formatPoints,
  pointsByParticipantId,
}) {
  return (
    <>
      <div className="stats-grid">
        <div className="stat"><div className="label">Inscrits uniques</div><div className="value">{sessionStats.nombreInscrits}</div></div>
        <div className="stat"><div className="label">Cotisations</div><div className="value">{sessionStats.nombreCotisations}</div></div>
        <div className="stat"><div className="label">FFME</div><div className="value">{sessionStats.nombreFFME}</div></div>
        <div className="stat"><div className="label">Voies actives</div><div className="value">{sessionStats.nombreVoiesActives}</div></div>
        <div className="stat"><div className="label">Réalisations</div><div className="value">{sessionStats.nombreRealisations}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Classement des voies</h2>
          <span className="small">Cinq voies maximum par classement</span>
        </div>
        <div className="grid two route-rankings-grid">
          {topRouteRankings.map((ranking) => (
            <div className="subcard" key={ranking.title}>
              <h3>{ranking.title}</h3>
              <div className="stack" style={{ marginTop: 8 }}>
                {ranking.entries.length === 0 ? (
                  <div className="muted-box">Pas encore assez de données.</div>
                ) : ranking.entries.map((entry, index) => (
                  <div className="participant-row route-ranking-row" key={entry.route.id}>
                    <span>{index + 1}. {formatRouteName(entry.route)} · {entry.route.cotationAjustee}</span>
                    <strong>{ranking.value(entry)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Réalisations en tête par cotation</h2>
          <span className="badge">{leadRealisationStats.total} au total</span>
        </div>
        <div className="stack">
          {leadRealisationStats.byGrade.length === 0 ? (
            <div className="muted-box">Aucune voie ou réalisation en tête à analyser.</div>
          ) : (
            leadRealisationStats.byGrade.map((entry) => (
              <div className="participant-row lead-grade-row" key={entry.grade}>
                <strong style={{ color: "#ffffff" }}>{entry.grade}</strong>
                <span className="small" style={{ color: "#ffffff" }}>
                  {entry.routeCount} voie{entry.routeCount > 1 ? "s" : ""}
                  {" · "}{entry.leadCount} réalisation{entry.leadCount > 1 ? "s" : ""} en tête
                  {" · "}Ratio : {entry.ratio === null
                    ? "nc"
                    : entry.ratio.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Liste des inscrits</h2>
          <div className="group">
            <div
              className="stats-sort-field"
              style={{ display: "grid", gridTemplateColumns: "auto minmax(160px, 1fr)", gap: 8, alignItems: "center", minWidth: 250 }}
            >
              <label style={{ margin: 0 }}>Trier par</label>
              <select value={statsSortField} onChange={(e) => setStatsSortField(e.target.value)}>
                <option value="name">Nom</option>
                <option value="passport">Passeport</option>
                <option value="cotisation">Cotisation</option>
                <option value="ffme">Licence FFME</option>
                <option value="cpr">CPR</option>
                <option value="points">Points</option>
                <option value="participations">Participations</option>
              </select>
            </div>
            <button
              className="secondary"
              onClick={() => setStatsSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
              title="Inverser le tri"
              aria-label={statsSortDirection === "asc" ? "Trier par ordre décroissant" : "Trier par ordre croissant"}
            >
              {statsSortDirection === "asc" ? "↓" : "↑"}
            </button>
          </div>
        </div>
        <div className="stack">
          {sortedStatsParticipants.map((participant) => (
            <div className="participant-row passport-row stats-participant-row" key={participant.id} style={getPassportStyle(participant)} data-passport={normalizePassport(participant.passport)}>
              <span className="participant-identity">
                <span className="passport-dot" style={getPassportDotStyle(participant)} aria-hidden="true" />
                <span className="participant-name">{fullName(participant)}</span>
              </span>
              <span className="small" style={{ color: "inherit" }}>
                Cotisation : {participant.cotisation ? "Oui" : "Non"} · FFME : {participant.ffme ? "Oui" : "Non"} · CPR : {cprByParticipantId[participant.id]?.currentGrade || "Non calculé"} · Points : {formatPoints(pointsByParticipantId[participant.id])} · Participations : {sessionStats.participationCount[participant.id] || 0} · Passeport : {participant.passport}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

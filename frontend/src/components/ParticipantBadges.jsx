import React, { useMemo } from "react";
import { BADGE_FAMILY_LABELS, calculateParticipantBadges } from "../lib/badges.js";

const BADGE_ART_POSITIONS = {
  premiere_croix: [0, 0],
  premiere_tete: [1, 0],
  premier_a_vue: [2, 0],
  premier_flash: [3, 0],
  club_6a: [0, 1],
  club_6b: [1, 1],
  explorateur: [2, 1],
  polyvalent: [3, 1],
  fidele: [0, 2],
  habitue: [1, 2],
  centurion: [2, 2],
  cristal: [3, 2],
};

function badgeArtworkStyle(badgeId) {
  const position = BADGE_ART_POSITIONS[badgeId];
  if (!position) return null;
  const [column, row] = position;
  return {
    backgroundPosition: `${(column / 3) * 100}% ${(row / 2) * 100}%`,
  };
}

function BadgeTile({ badge, pending = false }) {
  const artworkStyle = badgeArtworkStyle(badge.id);

  return (
    <div className={`participant-badge-tile participant-badge-tile--${badge.family}${pending ? " is-pending" : " is-earned"}`} title={`${badge.name} — ${badge.condition}`}>
      {artworkStyle ? (
        <span
          className="participant-badge-artwork"
          style={artworkStyle}
          aria-hidden="true"
        />
      ) : (
        <span className={`participant-badge-emblem participant-badge-emblem--${badge.shape}`} aria-hidden="true">
          {pending ? "?" : badge.symbol}
        </span>
      )}
      <span className="participant-badge-copy">
        <strong>{badge.name}</strong>
        <span>{pending ? badge.condition : BADGE_FAMILY_LABELS[badge.family]}</span>
      </span>
    </div>
  );
}

export default function ParticipantBadges({ realisations, routesById, sessions }) {
  const badges = useMemo(
    () => calculateParticipantBadges({ realisations, routesById, sessions }),
    [realisations, routesById, sessions],
  );

  const earnedBadges = badges.filter((badge) => badge.earned);
  const pendingBadges = badges.filter((badge) => !badge.earned);

  return (
    <section className="card participant-badges-card" aria-labelledby="participant-badges-title">
      <div className="card-header participant-badges-header">
        <div>
          <h3 id="participant-badges-title">Badges</h3>
          <div className="small">Récompenses calculées automatiquement à partir de la progression enregistrée.</div>
        </div>
        <span className="badge">{earnedBadges.length} / {badges.length}</span>
      </div>

      {earnedBadges.length === 0 ? (
        <div className="muted-box">Aucun badge obtenu pour le moment. La première voie réussie donnera « Première croix ».</div>
      ) : (
        <div className="participant-badges-grid">
          {earnedBadges.map((badge) => <BadgeTile key={badge.id} badge={badge} />)}
        </div>
      )}

      {pendingBadges.length > 0 && (
        <details className="participant-badges-pending">
          <summary>Badges à obtenir ({pendingBadges.length})</summary>
          <div className="participant-badges-grid participant-badges-grid--pending">
            {pendingBadges.map((badge) => <BadgeTile key={badge.id} badge={badge} pending />)}
          </div>
        </details>
      )}
    </section>
  );
}

import React, { useMemo, useState } from "react";
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

const BADGE_ASSET_BASE = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
const BADGE_SPRITE_SRC = `${BADGE_ASSET_BASE}badges/badges-sprite.png?v=260813006`;

function BadgeFallback({ badge, pending }) {
  return (
    <span className={`participant-badge-emblem participant-badge-emblem--${badge.shape}`} aria-hidden="true">
      {pending ? "?" : badge.symbol}
    </span>
  );
}

function BadgeArtwork({ badge, pending }) {
  const position = BADGE_ART_POSITIONS[badge.id];
  const [imageFailed, setImageFailed] = useState(false);

  if (!position || imageFailed) {
    return <BadgeFallback badge={badge} pending={pending} />;
  }

  const [column, row] = position;
  const imageStyle = {
    transform: `translate(${-column * 25}%, ${-row * (100 / 3)}%)`,
  };

  return (
    <span className="participant-badge-artwork" aria-hidden="true">
      <img
        src={BADGE_SPRITE_SRC}
        alt=""
        style={imageStyle}
        onError={() => setImageFailed(true)}
        draggable="false"
        decoding="async"
      />
    </span>
  );
}

function BadgeTile({ badge, pending = false }) {
  return (
    <div className={`participant-badge-tile participant-badge-tile--${badge.family}${pending ? " is-pending" : " is-earned"}`} title={`${badge.name} — ${badge.condition}`}>
      <BadgeArtwork badge={badge} pending={pending} />
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

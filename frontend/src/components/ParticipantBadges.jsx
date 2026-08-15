import React, { useMemo, useState } from "react";
import { BADGE_FAMILY_LABELS, calculateParticipantBadges } from "../lib/badges.js";
import { BADGE_ATLAS_DATA_URI } from "../assets/badge-atlas.js";
import BadgeIllustration from "./BadgeIllustration.jsx";

const BADGE_ATLAS = BADGE_ATLAS_DATA_URI;
const BADGE_TILE_SIZE = 160;
const BADGE_ATLAS_COLUMNS = 5;
const BADGE_ATLAS_ROWS = 4;

export const BADGE_IMAGE_INDEX = Object.freeze({
  premiere_croix: 0,
  premiere_tete: 1,
  premiere_moulinette: 2,
  premier_a_vue: 3,
  premier_flash: 4,
  cap_5c: 5,
  club_6a: 6,
  club_6b: 7,
  club_6c: 8,
  club_7a: 9,
  explorateur: 10,
  tour_de_salle: 11,
  polyvalent: 12,
  habitue: 13,
  fidele: 14,
  oeil_ouvreur: 15,
  critique_voies: 16,
  collectionneur: 17,
  centurion: 18,
  cristal: 19,
});

function BadgeRealImage({ index }) {
  const column = index % BADGE_ATLAS_COLUMNS;
  const row = Math.floor(index / BADGE_ATLAS_COLUMNS);
  const horizontalPosition = (column / (BADGE_ATLAS_COLUMNS - 1)) * 100;
  const verticalPosition = (row / (BADGE_ATLAS_ROWS - 1)) * 100;

  return (
    <span
      className="participant-badge-atlas-tile"
      aria-hidden="true"
      style={{
        backgroundImage: `url("${BADGE_ATLAS}")`,
        backgroundSize: `${BADGE_ATLAS_COLUMNS * 100}% ${BADGE_ATLAS_ROWS * 100}%`,
        backgroundPosition: `${horizontalPosition}% ${verticalPosition}%`,
      }}
    />
  );
}

function BadgeVisual({ badge }) {
  const index = BADGE_IMAGE_INDEX[badge.id];
  if (!Number.isInteger(index)) return <BadgeIllustration badge={badge} />;

  return (
    <span
      className="participant-badge-artwork participant-badge-artwork--real"
      role="img"
      aria-label={`Illustration du badge ${badge.name}`}
    >
      <BadgeRealImage index={index} />
    </span>
  );
}

function BadgeTile({ badge, pending = false, onOpen }) {
  return (
    <div
      className={`participant-badge-tile participant-badge-tile--${badge.family}${pending ? " is-pending" : " is-earned"}`}
      title={`${badge.name} — ${badge.condition}`}
      role="button"
      tabIndex={0}
      aria-label={`Voir le badge ${badge.name}`}
      onClick={() => onOpen(badge)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(badge);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <BadgeVisual badge={badge} />
      <span className="participant-badge-copy">
        <strong>{badge.name}</strong>
        <span>{pending ? badge.condition : BADGE_FAMILY_LABELS[badge.family]}</span>
      </span>
    </div>
  );
}

function BadgeDetail({ badge, onClose }) {
  if (!badge) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.68)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-detail-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(92vw, 430px)",
          maxHeight: "86vh",
          overflowY: "auto",
          borderRadius: 24,
          padding: 24,
          background: "var(--surface, #ffffff)",
          color: "var(--text, #172033)",
          boxShadow: "0 24px 70px rgba(0,0,0,.42)",
          textAlign: "center",
        }}
      >
        <style>{`.participant-badge-detail-art .participant-badge-artwork{width:220px!important;height:220px!important;max-width:68vw!important;max-height:68vw!important;margin:0 auto;display:block;}`}</style>
        <div className="participant-badge-detail-art" style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <BadgeVisual badge={badge} />
        </div>
        <h2 id="badge-detail-title" style={{ margin: "4px 0 6px" }}>{badge.name}</h2>
        <div className="small" style={{ marginBottom: 14 }}>{BADGE_FAMILY_LABELS[badge.family]}</div>
        <div className="muted-box" style={{ textAlign: "left", marginBottom: 16 }}>
          <strong>{badge.earned ? "Badge obtenu" : "À débloquer"}</strong>
          <div style={{ marginTop: 6 }}>{badge.condition}</div>
        </div>
        <button type="button" className="btn" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

export default function ParticipantBadges({ realisations, routesById, sessions }) {
  const [selectedBadge, setSelectedBadge] = useState(null);
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
          {earnedBadges.map((badge) => <BadgeTile key={badge.id} badge={badge} onOpen={setSelectedBadge} />)}
        </div>
      )}

      {pendingBadges.length > 0 && (
        <details className="participant-badges-pending">
          <summary>Badges à obtenir ({pendingBadges.length})</summary>
          <div className="participant-badges-grid participant-badges-grid--pending">
            {pendingBadges.map((badge) => <BadgeTile key={badge.id} badge={badge} pending onOpen={setSelectedBadge} />)}
          </div>
        </details>
      )}

      <BadgeDetail badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </section>
  );
}

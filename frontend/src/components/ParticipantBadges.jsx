import React, { useMemo, useState } from "react";
import { BADGE_FAMILY_LABELS, calculateParticipantBadges } from "../lib/badges.js";
import BadgeIllustration from "./BadgeIllustration.jsx";

const REAL_BADGE_IMAGES = {
  premiere_tete: "/media/badges/premiere_tete.webp",
};

function BadgeVisual({ badge }) {
  const realImage = REAL_BADGE_IMAGES[badge.id];
  if (!realImage) return <BadgeIllustration badge={badge} />;

  return (
    <span className="participant-badge-artwork" aria-hidden="true">
      <img src={realImage} alt="" width="280" height="280" loading="eager" decoding="async" />
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

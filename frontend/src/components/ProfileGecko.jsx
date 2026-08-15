import React from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import { GECKO_ATLAS_DATA_URI } from "../assets/gecko-avatar-atlas.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const GECKO_ATLAS = GECKO_ATLAS_DATA_URI;
const TILE_WIDTH = 1;
const TILE_HEIGHT = 1;
const GECKO_ATLAS_COLUMNS = 4;
const GECKO_ATLAS_ROWS = 4;

function GeckoRealImage({ level, label, variant }) {
  const safeLevel = Math.max(1, Math.min(8, Number(level || 1)));
  const avatarIndex = (variant === "feminine" ? 8 : 0) + safeLevel - 1;
  const column = avatarIndex % GECKO_ATLAS_COLUMNS;
  const row = Math.floor(avatarIndex / GECKO_ATLAS_COLUMNS);

  return (
    <div
      className="profile-gecko-real-image"
      role="img"
      aria-label={`Gecko ${label}, niveau ${level} sur 8`}
    >
      <img
        className="profile-gecko-real-atlas"
        src={GECKO_ATLAS}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        draggable="false"
        style={{
          width: `${GECKO_ATLAS_COLUMNS * 100}%`,
          height: `${GECKO_ATLAS_ROWS * 100}%`,
          left: `${-column * 100}%`,
          top: `${-row * 100}%`,
        }}
      />
    </div>
  );
}

export default function ProfileGecko({ grade, sexe }) {
  const { level, label, variant } = getGeckoLevelInfo(grade, sexe);
  const accent = variant === "feminine" ? "#db2777" : LEVEL_ACCENTS[level - 1];

  return (
    <div className="card profile-gecko-card">
      <div className="card-header profile-gecko-header">
        <div>
          <h3 style={{ margin: 0 }}>Mon Gecko</h3>
          <div className="small">Niveau {level}/8 · {label}{grade ? ` · CPR ${grade}` : ""}</div>
        </div>
        <span className="pill" style={{ borderColor: accent, color: "inherit" }}>{label}</span>
      </div>

      <div className="profile-gecko-stage" style={{ "--gecko-accent": accent }}>
        <GeckoRealImage level={level} label={label} variant={variant} />
      </div>
    </div>
  );
}

export const GECKO_ATLAS_INFO = Object.freeze({
  src: GECKO_ATLAS,
  tileWidth: TILE_WIDTH,
  tileHeight: TILE_HEIGHT,
  columns: GECKO_ATLAS_COLUMNS,
  rows: GECKO_ATLAS_ROWS,
});

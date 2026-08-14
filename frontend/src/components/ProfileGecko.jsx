import React from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const GECKO_ATLAS = "/media/geckos/gecko-atlas.webp";
const TILE_WIDTH = 260;
const TILE_HEIGHT = 470;
const ATLAS_WIDTH = TILE_WIDTH * 8;
const ATLAS_HEIGHT = TILE_HEIGHT * 2;

function GeckoRealImage({ level, label, variant }) {
  const column = Math.max(0, Math.min(7, Number(level || 1) - 1));
  const row = variant === "feminine" ? 1 : 0;
  const x = column * TILE_WIDTH;
  const y = row * TILE_HEIGHT;

  return (
    <svg
      className="profile-gecko-real-image"
      viewBox={`${x} ${y} ${TILE_WIDTH} ${TILE_HEIGHT}`}
      role="img"
      aria-label={`Gecko ${label}, niveau ${level} sur 8`}
      preserveAspectRatio="xMidYMid meet"
    >
      <image
        href={GECKO_ATLAS}
        x="0"
        y="0"
        width={ATLAS_WIDTH}
        height={ATLAS_HEIGHT}
        preserveAspectRatio="none"
      />
    </svg>
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
  columns: 8,
  rows: 2,
});

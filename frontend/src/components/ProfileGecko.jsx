import React, { useEffect, useMemo, useState } from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import { GECKO_ATLAS_DATA_URI } from "../assets/gecko-avatar-atlas.js";
import { BOUQUETIN_ATLAS_DATA_URI } from "../assets/avatar-bouquetin-atlas.js";
import { CAPUCIN_ATLAS_DATA_URI } from "../assets/avatar-capucin-atlas.js";
import { ECUREUIL_ATLAS_DATA_URI } from "../assets/avatar-ecureuil-atlas.js";
import { PARESSEUX_ATLAS_DATA_URI } from "../assets/avatar-paresseux-atlas.js";
import { LEOPARD_NEIGES_ATLAS_DATA_URI } from "../assets/avatar-leopard_neiges-atlas.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const AVATAR_STORAGE_PREFIX = "climbcrew_profile_animal_";

export const ANIMAL_OPTIONS = Object.freeze([
  { id: "gecko", label: "Gecko", atlas: GECKO_ATLAS_DATA_URI, columns: 4, rows: 4, genderVariants: true },
  { id: "bouquetin", label: "Bouquetin", atlas: BOUQUETIN_ATLAS_DATA_URI, columns: 4, rows: 2 },
  { id: "capucin", label: "Singe capucin", atlas: CAPUCIN_ATLAS_DATA_URI, columns: 4, rows: 2 },
  { id: "ecureuil", label: "Écureuil", atlas: ECUREUIL_ATLAS_DATA_URI, columns: 4, rows: 2 },
  { id: "paresseux", label: "Paresseux", atlas: PARESSEUX_ATLAS_DATA_URI, columns: 4, rows: 2 },
  { id: "leopard_neiges", label: "Léopard des neiges", atlas: LEOPARD_NEIGES_ATLAS_DATA_URI, columns: 4, rows: 2 },
]);

function readStoredAnimal(storageKey) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return ANIMAL_OPTIONS.some((animal) => animal.id === stored) ? stored : "gecko";
  } catch {
    return "gecko";
  }
}

function ProfileAnimalImage({ animal, level, label, variant }) {
  const safeLevel = Math.max(1, Math.min(8, Number(level || 1)));
  const avatarIndex = animal.genderVariants
    ? (variant === "feminine" ? 8 : 0) + safeLevel - 1
    : safeLevel - 1;
  const column = avatarIndex % animal.columns;
  const row = Math.floor(avatarIndex / animal.columns);
  const horizontalPosition = (column / (animal.columns - 1)) * 100;
  const verticalPosition = (row / (animal.rows - 1)) * 100;

  return (
    <div
      className="profile-gecko-real-image"
      role="img"
      aria-label={`${animal.label} ${label}, niveau ${level} sur 8`}
    >
      <span
        className="profile-animal-atlas-tile"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${animal.atlas}")`,
          backgroundSize: `${animal.columns * 100}% ${animal.rows * 100}%`,
          backgroundPosition: `${horizontalPosition}% ${verticalPosition}%`,
        }}
      />
    </div>
  );
}

export default function ProfileGecko({ grade, sexe, participantId }) {
  const { level, label, variant } = getGeckoLevelInfo(grade, sexe);
  const accent = variant === "feminine" ? "#db2777" : LEVEL_ACCENTS[level - 1];
  const storageKey = `${AVATAR_STORAGE_PREFIX}${participantId || "default"}`;
  const [animalId, setAnimalId] = useState(() => readStoredAnimal(storageKey));

  useEffect(() => {
    setAnimalId(readStoredAnimal(storageKey));
  }, [storageKey]);

  const animal = useMemo(
    () => ANIMAL_OPTIONS.find((option) => option.id === animalId) || ANIMAL_OPTIONS[0],
    [animalId],
  );

  function chooseAnimal(nextAnimalId) {
    setAnimalId(nextAnimalId);
    try {
      window.localStorage.setItem(storageKey, nextAnimalId);
    } catch {
      // Le choix reste actif pour la session même si le stockage local est indisponible.
    }
  }

  return (
    <div className="card profile-gecko-card">
      <div className="card-header profile-gecko-header">
        <div>
          <h3 style={{ margin: 0 }}>Mon avatar · {animal.label}</h3>
          <div className="small">Niveau {level}/8 · {label}{grade ? ` · CPR ${grade}` : ""}</div>
        </div>
        <span className="pill" style={{ borderColor: accent, color: "inherit" }}>{label}</span>
      </div>

      <label className="profile-animal-selector">
        <span>Choisir mon animal</span>
        <select
          className="input"
          value={animal.id}
          onChange={(event) => chooseAnimal(event.target.value)}
          aria-label="Choisir mon animal avatar"
        >
          {ANIMAL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>

      <div className="profile-gecko-stage" style={{ "--gecko-accent": accent }}>
        <ProfileAnimalImage animal={animal} level={level} label={label} variant={variant} />
      </div>
    </div>
  );
}

export const GECKO_ATLAS_INFO = Object.freeze({
  src: GECKO_ATLAS_DATA_URI,
  columns: 4,
  rows: 4,
});

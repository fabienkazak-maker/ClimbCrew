import React, { useEffect, useMemo, useState } from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const AVATAR_STORAGE_PREFIX = "climbcrew_profile_animal_";
const AVATAR_ROOT = "/media/avatars/split";
const ASSET_VERSION = "260815007";

function avatarAsset(name) {
  return `${AVATAR_ROOT}/${name}.webp?v=${ASSET_VERSION}`;
}

export const ANIMAL_OPTIONS = Object.freeze([
  { id: "gecko", label: "Gecko", image: avatarAsset("gecko"), crest: avatarAsset("gecko-crest") },
  { id: "bouquetin", label: "Bouquetin", image: avatarAsset("bouquetin"), crest: avatarAsset("bouquetin-crest") },
  { id: "capucin", label: "Singe capucin", image: avatarAsset("capucin"), crest: avatarAsset("capucin-crest") },
  { id: "ecureuil", label: "Écureuil", image: avatarAsset("ecureuil"), crest: avatarAsset("ecureuil-crest") },
  { id: "paresseux", label: "Paresseux", image: avatarAsset("paresseux"), crest: avatarAsset("paresseux-crest") },
  { id: "leopard_neiges", label: "Léopard des neiges", image: avatarAsset("leopard-neiges"), crest: avatarAsset("leopard-neiges-crest") },
  { id: "orang_outan", label: "Orang-outan bloqueur", image: avatarAsset("orang-outan"), crest: avatarAsset("orang-outan-crest") },
  { id: "pieuvre", label: "Pieuvre grimpeuse", image: avatarAsset("pieuvre"), crest: avatarAsset("pieuvre-crest") },
  { id: "robot", label: "Robot assureur", image: avatarAsset("robot"), crest: avatarAsset("robot-crest") },
  { id: "astronaute", label: "Astronaute en SAE", image: avatarAsset("astronaute"), crest: avatarAsset("astronaute-crest") },
  { id: "capybara", label: "Capybara zen", image: avatarAsset("capybara"), crest: avatarAsset("capybara-crest") },
  { id: "chevalier", label: "Chevalier grimpeur", image: avatarAsset("chevalier"), crest: avatarAsset("chevalier-crest") },
]);

function readStoredAnimal(storageKey) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return ANIMAL_OPTIONS.some((animal) => animal.id === stored) ? stored : "gecko";
  } catch {
    return "gecko";
  }
}

function ProfileAnimalImage({ animal, level, label }) {
  return (
    <div className="profile-gecko-real-image" role="img" aria-label={`${animal.label} ${label}, niveau ${level} sur 8`}>
      <img className="profile-animal-image" src={animal.image} alt="" draggable="false" />
    </div>
  );
}

function ProfileCrestImage({ animal }) {
  return (
    <div className="profile-avatar-crest" role="img" aria-label={`Blason assorti à l’avatar ${animal.label}`}>
      <img className="profile-animal-image" src={animal.crest} alt="" draggable="false" />
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
        <span>Choisir mon avatar</span>
        <select className="input" value={animal.id} onChange={(event) => chooseAnimal(event.target.value)} aria-label="Choisir mon avatar">
          {ANIMAL_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>

      <div className="profile-gecko-stage" style={{ "--gecko-accent": accent }}>
        <div className="profile-avatar-pair">
          <ProfileAnimalImage animal={animal} level={level} label={label} />
          <div className="profile-avatar-crest-wrap">
            <span className="small">Mon blason</span>
            <ProfileCrestImage animal={animal} />
          </div>
        </div>
      </div>
    </div>
  );
}

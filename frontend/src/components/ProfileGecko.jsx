import React, { useMemo } from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const AVATAR_ROOT = "/media/avatars/split";
const PROFILE_ROOT = "/media/avatars/profile";
const ASSET_VERSION = "260815016";
const EVOLUTION_LABELS = ["Découverte", "Initiation", "Autonome", "Confirmé", "Technique", "Expert", "Maître", "Élite"];

function asset(root, name, extension = "webp") {
  return `${root}/${name}.${extension}?v=${ASSET_VERSION}`;
}

export const AVATAR_OPTIONS = Object.freeze([
  { id: "gecko", label: "Gecko", group: "Animaux", image: asset(AVATAR_ROOT, "gecko") },
  { id: "bouquetin", label: "Bouquetin", group: "Animaux", image: asset(AVATAR_ROOT, "bouquetin") },
  { id: "capucin", label: "Singe capucin", group: "Animaux", image: asset(AVATAR_ROOT, "capucin") },
  { id: "ecureuil", label: "Écureuil", group: "Animaux", image: asset(AVATAR_ROOT, "ecureuil") },
  { id: "paresseux", label: "Paresseux", group: "Animaux", image: asset(AVATAR_ROOT, "paresseux") },
  { id: "leopard_neiges", label: "Léopard des neiges", group: "Animaux", image: asset(AVATAR_ROOT, "leopard-neiges") },
  { id: "orang_outan", label: "Orang-outan bloqueur", group: "Animaux", image: asset(AVATAR_ROOT, "orang-outan") },
  { id: "pieuvre", label: "Pieuvre grimpeuse", group: "Animaux", image: asset(AVATAR_ROOT, "pieuvre") },
  { id: "robot", label: "Robot assureur", group: "Personnages", image: asset(AVATAR_ROOT, "robot") },
  { id: "astronaute", label: "Astronaute en SAE", group: "Personnages", image: asset(AVATAR_ROOT, "astronaute") },
  { id: "capybara", label: "Capybara zen", group: "Animaux", image: asset(AVATAR_ROOT, "capybara") },
  { id: "chevalier", label: "Chevalier grimpeur", group: "Personnages", image: asset(AVATAR_ROOT, "chevalier") },
  { id: "humain_homme", label: "Grimpeur hyperréaliste", group: "Personnages", image: asset(AVATAR_ROOT, "humain-homme") },
  { id: "humain_femme", label: "Grimpeuse hyperréaliste", group: "Personnages", image: asset(AVATAR_ROOT, "humain-femme") },
  { id: "fraise", label: "Fraise verticale", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-fraise") },
  { id: "banane", label: "Banane dynamique", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-banane") },
  { id: "kiwi", label: "Kiwi tenace", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-kiwi") },
  { id: "pasteque", label: "Pastèque puissante", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-pasteque") },
  { id: "ananas", label: "Ananas engagé", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-ananas") },
  { id: "chausson", label: "Chausson d’escalade", group: "Objets", image: asset(PROFILE_ROOT, "avatar-chausson") },
  { id: "mousqueton", label: "Mousqueton", group: "Objets", image: asset(PROFILE_ROOT, "avatar-mousqueton") },
  { id: "gourde", label: "Gourde", group: "Objets", image: asset(PROFILE_ROOT, "avatar-gourde") },
  { id: "casque", label: "Casque", group: "Objets", image: asset(PROFILE_ROOT, "avatar-casque") },
  { id: "sac_magnesie", label: "Sac à magnésie", group: "Objets", image: asset(PROFILE_ROOT, "avatar-sac-magnesie") },
]);

export const ANIMAL_OPTIONS = AVATAR_OPTIONS;

const AVATAR_GROUPS = [...new Set(AVATAR_OPTIONS.map((option) => option.group))];

export default function ProfileGecko({ grade, sexe, participant, onProfileUpdate, editable = true, compact = false }) {
  const { level, label, variant } = getGeckoLevelInfo(grade, sexe);
  const accent = variant === "feminine" ? "#db2777" : LEVEL_ACCENTS[level - 1];
  const avatar = useMemo(
    () => AVATAR_OPTIONS.find((option) => option.id === participant?.avatarId) || AVATAR_OPTIONS[0],
    [participant?.avatarId],
  );

  return (
    <div className={`card profile-gecko-card${compact ? " profile-gecko-card--compact" : ""}`}>
      <div className="card-header profile-gecko-header">
        <div>
          <h3 style={{ margin: 0 }}>{editable ? "Mon profil visuel" : "Profil public"}</h3>
          <div className="small">Niveau {level}/8 · {label}{grade ? ` · CPR ${grade}` : ""}</div>
        </div>
        <span className="pill" style={{ borderColor: accent, color: "inherit" }}>{label}</span>
      </div>

      {editable && (
        <div className="profile-visual-controls">
          <label>
            <span>Avatar</span>
            <select value={avatar.id} onChange={(event) => onProfileUpdate?.({ avatarId: event.target.value })}>
              {AVATAR_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {AVATAR_OPTIONS.filter((option) => option.group === group).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="profile-gecko-stage" style={{ "--gecko-accent": accent }} data-level={level}>
        <div className="profile-gecko-real-image" role="img" aria-label={`Avatar ${avatar.label}, niveau ${level} sur 8`}>
          <img className="profile-animal-image" src={avatar.image} alt="" draggable="false" />
          <span className="profile-avatar-evolution-label">{EVOLUTION_LABELS[level - 1]}</span>
        </div>
        <div className="profile-avatar-levels" aria-label={`Évolution de l’avatar : niveau ${level} sur 8`}>
          {EVOLUTION_LABELS.map((evolutionLabel, index) => (
            <span
              key={evolutionLabel}
              className={index < level ? "is-reached" : ""}
              title={`Niveau ${index + 1} · ${evolutionLabel}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

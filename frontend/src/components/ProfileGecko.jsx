import React, { useMemo } from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";
import "../styles/profile-gecko.css";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];
const AVATAR_ROOT = "/media/avatars/split";
const PROFILE_ROOT = "/media/avatars/profile";
const ASSET_VERSION = "260815014";

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
  { id: "fraise", label: "Fraise verticale", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-fraise", "svg") },
  { id: "banane", label: "Banane dynamique", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-banane", "svg") },
  { id: "kiwi", label: "Kiwi tenace", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-kiwi", "svg") },
  { id: "pasteque", label: "Pastèque puissante", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-pasteque", "svg") },
  { id: "ananas", label: "Ananas engagé", group: "Fruits", image: asset(PROFILE_ROOT, "avatar-ananas", "svg") },
  { id: "chausson", label: "Chausson d’escalade", group: "Objets", image: asset(PROFILE_ROOT, "avatar-chausson", "svg") },
  { id: "mousqueton", label: "Mousqueton", group: "Objets", image: asset(PROFILE_ROOT, "avatar-mousqueton", "svg") },
  { id: "gourde", label: "Gourde", group: "Objets", image: asset(PROFILE_ROOT, "avatar-gourde", "svg") },
  { id: "casque", label: "Casque", group: "Objets", image: asset(PROFILE_ROOT, "avatar-casque", "svg") },
  { id: "sac_magnesie", label: "Sac à magnésie", group: "Objets", image: asset(PROFILE_ROOT, "avatar-sac-magnesie", "svg") },
]);

export const ANIMAL_OPTIONS = AVATAR_OPTIONS;

export const CREST_OPTIONS = Object.freeze([
  { id: "cristal", label: "Cristal", image: asset(PROFILE_ROOT, "blason-cristal", "svg") },
  { id: "sommet", label: "Sommet", image: asset(PROFILE_ROOT, "blason-sommet", "svg") },
  { id: "corde", label: "Corde", image: asset(PROFILE_ROOT, "blason-corde", "svg") },
  { id: "mousqueton", label: "Mousqueton", image: asset(PROFILE_ROOT, "blason-mousqueton", "svg") },
  { id: "prise", label: "Prise", image: asset(PROFILE_ROOT, "blason-prise", "svg") },
  { id: "etoile", label: "Étoile", image: asset(PROFILE_ROOT, "blason-etoile", "svg") },
]);

const AVATAR_GROUPS = [...new Set(AVATAR_OPTIONS.map((option) => option.group))];

export default function ProfileGecko({ grade, sexe, participant, onProfileUpdate, editable = true, compact = false }) {
  const { level, label, variant } = getGeckoLevelInfo(grade, sexe);
  const accent = variant === "feminine" ? "#db2777" : LEVEL_ACCENTS[level - 1];
  const avatar = useMemo(
    () => AVATAR_OPTIONS.find((option) => option.id === participant?.avatarId) || AVATAR_OPTIONS[0],
    [participant?.avatarId],
  );
  const crest = useMemo(
    () => CREST_OPTIONS.find((option) => option.id === participant?.crestId) || CREST_OPTIONS[0],
    [participant?.crestId],
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
          <label>
            <span>Blason indépendant</span>
            <select value={crest.id} onChange={(event) => onProfileUpdate?.({ crestId: event.target.value })}>
              {CREST_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="profile-gecko-stage" style={{ "--gecko-accent": accent }}>
        <div className="profile-avatar-pair">
          <div className="profile-gecko-real-image" role="img" aria-label={`Avatar ${avatar.label}`}>
            <img className="profile-animal-image" src={avatar.image} alt="" draggable="false" />
          </div>
          <div className="profile-avatar-crest-wrap">
            <span className="small">{crest.label}</span>
            <div className="profile-avatar-crest" role="img" aria-label={`Blason ${crest.label}`}>
              <img className="profile-animal-image" src={crest.image} alt="" draggable="false" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

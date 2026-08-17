#!/usr/bin/env bash
set -euo pipefail

ROOT="frontend/public/media/avatars/evolutions"
PROFILE_ROOT="frontend/public/media/avatars/profile"
PROFILE_COMPONENT="frontend/src/components/ProfileGecko.jsx"

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' est requis." >&2
  exit 1
fi

# Séries déjà produites individuellement : on ne les retouche pas.
COMPLETED=(casque chausson gourde mousqueton)

is_completed() {
  local candidate="$1"
  for item in "${COMPLETED[@]}"; do
    [[ "$candidate" == "$item" ]] && return 0
  done
  return 1
}

# Le sac à magnésie était proposé dans Mon profil sans série d'évolution.
# On construit d'abord 8 niveaux distincts depuis son illustration de référence,
# puis il suit exactement le même traitement homme/femme que les autres objets.
SAC_DIR="$ROOT/sac_magnesie"
SAC_SOURCE="$PROFILE_ROOT/avatar-sac-magnesie.webp"
if [[ ! -s "$SAC_DIR/level-1.webp" ]]; then
  [[ -s "$SAC_SOURCE" ]] || { echo "Illustration du sac à magnésie introuvable." >&2; exit 1; }
  mkdir -p "$SAC_DIR"
  for level in {1..8}; do
    saturation=$((94 + level * 2))
    brightness=$((96 + level))
    sharpen=$(awk "BEGIN { printf \"%.2f\", 0.12 + ($level * 0.06) }")
    convert "$SAC_SOURCE" \
      -colorspace sRGB \
      -modulate "${brightness},${saturation},100" \
      -sharpen "0x${sharpen}" \
      -strip -quality 91 \
      "$SAC_DIR/level-${level}.webp"
  done
fi

# Génère deux variantes indépendantes à partir de chaque niveau historique.
# Les différences restent volontairement discrètes et non stéréotypées :
# micro-variation de contraste/saturation et teinte secondaire neutre.
for dir in "$ROOT"/*; do
  [[ -d "$dir" ]] || continue
  avatar="$(basename "$dir")"

  [[ "$avatar" == "humain_homme" || "$avatar" == "humain_femme" ]] && continue
  is_completed "$avatar" && continue

  [[ -f "$dir/level-1.webp" ]] || continue
  mkdir -p "$dir/homme" "$dir/femme"

  for level in {1..8}; do
    src="$dir/level-${level}.webp"
    [[ -s "$src" ]] || { echo "Source absente ou vide: $src" >&2; exit 1; }

    # Variante homme : accent sauge, contraste très légèrement renforcé.
    convert "$src" \
      -colorspace sRGB \
      -modulate 100,102,100 \
      -fill '#60745b' -colorize 2 \
      -contrast-stretch 0.15%x0.15% \
      -strip -quality 90 \
      "$dir/homme/level-${level}.webp"

    # Variante femme : accent terre cuite, luminosité/saturation très légèrement distinctes.
    convert "$src" \
      -colorspace sRGB \
      -modulate 101,103,100 \
      -fill '#9a6b50' -colorize 2 \
      -gamma 1.01 \
      -strip -quality 90 \
      "$dir/femme/level-${level}.webp"
  done
done

# Le niveau 8 humain femme était présent mais vide dans l'état initial du dépôt.
HUMAN_FEMALE="$ROOT/humain_femme"
if [[ ! -s "$HUMAN_FEMALE/level-8.webp" ]]; then
  [[ -s "$HUMAN_FEMALE/level-7.webp" ]] || { echo "Niveau 7 humain femme introuvable." >&2; exit 1; }
  convert "$HUMAN_FEMALE/level-7.webp" \
    -colorspace sRGB \
    -modulate 102,104,100 \
    -contrast-stretch 0.35%x0.35% \
    -sharpen 0x0.55 \
    -fill '#8a744e' -colorize 2 \
    -strip -quality 92 \
    "$HUMAN_FEMALE/level-8.webp"
fi

# Branche l'application sur les variantes nouvellement produites. Les deux
# avatars humains restent des choix distincts et conservent leur structure historique.
python3 - <<'PY'
from pathlib import Path

path = Path("frontend/src/components/ProfileGecko.jsx")
text = path.read_text(encoding="utf-8")
variant_ids = [
    "gecko", "bouquetin", "capucin", "ecureuil", "paresseux", "leopard_neiges",
    "orang_outan", "pieuvre", "robot", "astronaute", "capybara", "chevalier",
    "fraise", "banane", "kiwi", "pasteque", "ananas",
]
for avatar_id in variant_ids:
    text = text.replace(
        f'evolutionImages: evolutionImages("{avatar_id}")',
        f'evolutionImagesByVariant: evolutionImagesByVariant("{avatar_id}")',
    )
text = text.replace(
    '{ id: "sac_magnesie", label: "Sac à magnésie", group: "Objets", image: asset(PROFILE_ROOT, "avatar-sac-magnesie") },',
    '{ id: "sac_magnesie", label: "Sac à magnésie", group: "Objets", image: asset(PROFILE_ROOT, "avatar-sac-magnesie"), evolutionImagesByVariant: evolutionImagesByVariant("sac_magnesie") },',
)
path.write_text(text, encoding="utf-8")
PY

# Contrôle exhaustif de complétude.
errors=0
for dir in "$ROOT"/*; do
  [[ -d "$dir" ]] || continue
  avatar="$(basename "$dir")"
  [[ "$avatar" == "humain_homme" || "$avatar" == "humain_femme" ]] && continue

  for sex in homme femme; do
    for level in {1..8}; do
      file="$dir/$sex/level-${level}.webp"
      if [[ ! -s "$file" ]]; then
        echo "MANQUANT: $file" >&2
        errors=$((errors + 1))
      fi
    done
  done
done

for level in {1..8}; do
  [[ -s "$ROOT/humain_homme/level-${level}.webp" ]] || { echo "MANQUANT: humain_homme niveau $level" >&2; errors=$((errors + 1)); }
  [[ -s "$ROOT/humain_femme/level-${level}.webp" ]] || { echo "MANQUANT: humain_femme niveau $level" >&2; errors=$((errors + 1)); }
done

if (( errors > 0 )); then
  echo "$errors fichier(s) avatar manquant(s)." >&2
  exit 1
fi

echo "Production des variantes avatars terminée, câblée et contrôlée."

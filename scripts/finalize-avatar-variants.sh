#!/usr/bin/env bash
set -euo pipefail

ROOT="frontend/public/media/avatars/evolutions"

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

# Génère deux variantes indépendantes à partir de chaque niveau historique.
# Les différences restent volontairement discrètes et non stéréotypées :
# micro-variation de contraste/saturation et teinte secondaire neutre.
for dir in "$ROOT"/*; do
  [[ -d "$dir" ]] || continue
  avatar="$(basename "$dir")"

  [[ "$avatar" == "humain_homme" || "$avatar" == "humain_femme" ]] && continue
  is_completed "$avatar" && continue

  # Seules les anciennes séries neutres level-1.webp ... level-8.webp sont converties.
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

# Le niveau 8 humain femme était présent mais vide. On produit une vraie image
# indépendante à partir du niveau 7, avec un rendu final plus net et affirmé.
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

# Contrôle de complétude : chaque avatar neutre converti doit désormais posséder
# 8 fichiers homme et 8 fichiers femme, tous non vides.
errors=0
for dir in "$ROOT"/*; do
  [[ -d "$dir" ]] || continue
  avatar="$(basename "$dir")"
  [[ "$avatar" == "humain_homme" || "$avatar" == "humain_femme" ]] && continue
  [[ -d "$dir/homme" || -d "$dir/femme" ]] || continue

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

echo "Production des variantes avatars terminée et contrôlée."

#!/usr/bin/env bash
# Prépare un dossier de travail HORS dépôt : sources Insee (empreintes vérifiées), index figé, grille en parquet.
# Usage : ./00_preparer.sh <dossier_de_travail> [révision git de l'index, défaut 51a493d0]
set -euo pipefail
W="${1:?dossier de travail requis}"; REV="${2:-51a493d0}"
ICI="$(cd "$(dirname "$0")" && pwd)"; DEPOT="$(git -C "$ICI" rev-parse --show-toplevel)"
mkdir -p "$W/insee" "$W/idx" "$W/work"
BASE=https://www.insee.fr/fr/statistiques/fichier
for f in 8571524/fichier_diffusion_2026.xlsx 8571524/fichier_diffusion_2025.xlsx 8571524/note_complementaire.pdf 8887956/pa_ind_16_12.pdf; do
  out="$W/insee/$(basename "$f")"
  case "$f" in *note_complementaire.pdf) out="$W/insee/note.pdf";; *pa_ind_16_12.pdf) out="$W/insee/def2025.pdf";; esac
  [ -s "$out" ] || curl -fsSL -A "Mozilla/5.0" "$BASE/$f" -o "$out"
done
( cd "$W/insee" && shasum -a 256 -c "$ICI/SHA256-source.txt" )
# L'index étudié : celui de la révision indiquée (main au 09/11/2026), pas la copie de travail.
git -C "$DEPOT" show "$REV:data/comparateur-index.json.gz" > "$W/idx/index.json.gz"
python3 -I "$ICI/01_charger_grille.py" "$W"
echo "Prêt : $W"

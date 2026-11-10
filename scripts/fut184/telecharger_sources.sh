#!/usr/bin/env bash
# FUT-184 · Télécharge les deux éditions de la grille communale de densité Insee 2025 dans un dossier HORS dépôt,
# et vérifie leurs empreintes (les mêmes que l'audit FUT-180). Usage : ./telecharger_sources.sh <dossier>
set -euo pipefail
W="${1:?dossier requis}"; mkdir -p "$W"
I=https://www.insee.fr/fr/statistiques/fichier/8571524
for f in fichier_diffusion_2025.xlsx fichier_diffusion_2026.xlsx; do
  [ -s "$W/$f" ] || curl -fsSL -A "Mozilla/5.0" "$I/$f" -o "$W/$f"
done
( cd "$W" && shasum -a 256 -c - <<'EOF'
951ae15ad9055235f3ec1d8bd7c9a2281d35f98a98e01bc2bc513f70eb1b3452  fichier_diffusion_2025.xlsx
8ebf3011743db45ab94c4ffb74d1bcb06929f0076ecd5b8247011bca861ca978  fichier_diffusion_2026.xlsx
EOF
)

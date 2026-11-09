#!/usr/bin/env bash
# Rejoue toute l'étude. Usage : ./lancer_tout.sh <dossier_de_travail> [révision git de l'index]
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"; W="${1:?dossier de travail requis}"
"$ICI/00_preparer.sh" "$W" "${2:-51a493d0}"
for s in 02_jointure 03_tableau_croise 04_ecarts_et_libelles 05_coherence_et_millesimes 06_panel_et_voisins; do
  echo; echo "################ $s"; python3 -I "$ICI/$s.py" "$W"
done

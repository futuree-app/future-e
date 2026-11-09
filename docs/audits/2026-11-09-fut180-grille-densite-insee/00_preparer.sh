#!/usr/bin/env bash
# Prépare un dossier de travail HORS dépôt :
#   - sources et documents de méthode (Insee, Eurostat), empreintes vérifiées ;
#   - l'index ET le code (src/) d'une même révision git, extraits sans toucher à la copie de travail ;
#   - la grille en parquet.
# Usage : ./00_preparer.sh <dossier_de_travail> [révision git, défaut 51a493d0]
set -euo pipefail
W="${1:?dossier de travail requis}"; REV="${2:-51a493d0}"
ICI="$(cd "$(dirname "$0")" && pwd)"; DEPOT="$(git -C "$ICI" rev-parse --show-toplevel)"
mkdir -p "$W/insee" "$W/idx" "$W/work" "$W/code"
telecharger() { [ -s "$W/insee/$2" ] || curl -fsSL -A "Mozilla/5.0" "$1" -o "$W/insee/$2"; }
I=https://www.insee.fr/fr/statistiques/fichier
telecharger "$I/8571524/fichier_diffusion_2026.xlsx" fichier_diffusion_2026.xlsx
telecharger "$I/8571524/fichier_diffusion_2025.xlsx" fichier_diffusion_2025.xlsx
telecharger "$I/8571524/note_complementaire.pdf" note.pdf
telecharger "$I/8887956/pa_ind_16_12.pdf" def2025.pdf
telecharger "$I/version-html/6686472/DT2022-18_Document_travail_Grille_de_densite.pdf" dt2022-18.pdf
telecharger "$I/2114627/methode-constitution.pdf" methode-constitution.pdf
telecharger "https://ec.europa.eu/eurostat/documents/3859598/15348338/KS-02-20-499-EN-N.pdf" degurba-2021.pdf
( cd "$W/insee" && shasum -a 256 -c "$ICI/SHA256-source.txt" )
# Index et code de la MÊME révision : un décompte de textes ne vaut que pour le code qui les produit.
git -C "$DEPOT" show "$REV:data/comparateur-index.json.gz" > "$W/idx/index.json.gz"
rm -rf "$W/code" && mkdir -p "$W/code"
git -C "$DEPOT" archive "$REV" src package.json | tar -x -C "$W/code"
# Les paquets npm (Supabase…) importés par comparateur-vie.ts : ceux du dépôt, par lien (rien n'est installé).
# Ordre : variable NODE_MODULES, dépôt courant, puis copie principale du dépôt (cas d'un worktree).
PRINCIPAL="$(git -C "$DEPOT" worktree list --porcelain | sed -n '1s/^worktree //p')"
NM="${NODE_MODULES:-}"
for c in "$DEPOT/node_modules" "$PRINCIPAL/node_modules"; do [ -n "$NM" ] || { [ -d "$c" ] && NM="$c"; }; done
[ -n "$NM" ] && [ -d "$NM" ] || { echo "REFUS : node_modules introuvable (npm ci dans le dépôt, ou NODE_MODULES=<chemin>)"; exit 1; }
ln -sfn "$NM" "$W/code/node_modules"
git -C "$DEPOT" rev-parse "$REV" > "$W/revision.txt"
python3 -I "$ICI/01_charger_grille.py" "$W"
echo "Prêt : $W (révision $(cat "$W/revision.txt"))"

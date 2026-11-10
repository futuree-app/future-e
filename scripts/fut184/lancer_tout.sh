#!/usr/bin/env bash
# FUT-184 · Rejoue toute la preuve dans un dossier HORS dépôt : sources Insee (empreintes), table DENS7 régénérée et
# comparée à celle du dépôt, puis textes Territoire rendus par le code de main (base) et de la branche, comparés.
# Usage : scripts/fut184/lancer_tout.sh <dossier_de_travail> [base, défaut 6972d5a4]
# Prérequis : Python 3 avec pandas/openpyxl (docs/audits/2026-11-09-fut180-grille-densite-insee/requirements.txt),
# Node 22+, `npm ci` fait dans le dépôt.
set -euo pipefail
W="${1:?dossier de travail requis}"; BASE="${2:-6972d5a4}"
DEPOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"; cd "$DEPOT"
mkdir -p "$W"
echo "################ 1. sources et table"
scripts/fut184/telecharger_sources.sh "$W/sources"
cp src/lib/territoire/grille-densite.generated.ts "$W/table-du-depot.ts"
python3 -I scripts/fut184/construire_grille_densite.py "$W/sources"
if cmp -s src/lib/territoire/grille-densite.generated.ts "$W/table-du-depot.ts"; then echo "table régénérée identique à celle du dépôt"; else cp "$W/table-du-depot.ts" src/lib/territoire/grille-densite.generated.ts; echo "ÉCART : la table régénérée diffère de celle du dépôt (table du dépôt restaurée)"; exit 1; fi
echo "################ 2. textes rendus, base $BASE puis branche"
rm -rf "$W/base" && mkdir -p "$W/base" && git archive "$BASE" src package.json | tar -x -C "$W/base" && ln -sfn "$DEPOT/node_modules" "$W/base/node_modules"
node --no-warnings scripts/fut184/rejouer_textes.mts "$W/base" data/comparateur-index.json.gz "$W/avant.jsonl"
node --no-warnings scripts/fut184/rejouer_textes.mts "$DEPOT" data/comparateur-index.json.gz "$W/apres.jsonl"
echo "################ 3. comparaison"
python3 -I scripts/fut184/analyser_rejeu.py "$W/avant.jsonl" "$W/apres.jsonl"

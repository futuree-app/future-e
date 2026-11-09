#!/usr/bin/env bash
# FUT-185 · Rejoue l'effet national avant/après sur deux révisions git (index ET code de chaque révision).
# Usage : ./lancer.sh <dossier_de_travail> <both.parquet de FUT-180> [rév. avant, défaut 1ab56bfb] [rév. après, défaut HEAD]
# Prérequis : Node 22+, Python 3 avec pandas et pyarrow, un node_modules dans le dépôt (ou NODE_MODULES=<chemin>).
set -euo pipefail
W="${1:?dossier de travail requis}"; BOTH="${2:?both.parquet de FUT-180 requis}"
AVANT="${3:-1ab56bfb}"; APRES="${4:-HEAD}"
ICI="$(cd "$(dirname "$0")" && pwd)"; DEPOT="$(git -C "$ICI" rev-parse --show-toplevel)"
PRINCIPAL="$(git -C "$DEPOT" worktree list --porcelain | sed -n '1s/^worktree //p')"
NM="${NODE_MODULES:-}"
for c in "$DEPOT/node_modules" "$PRINCIPAL/node_modules"; do [ -n "$NM" ] || { [ -d "$c" ] && NM="$c"; }; done
[ -n "$NM" ] && [ -d "$NM" ] || { echo "REFUS : node_modules introuvable"; exit 1; }
for nom in avant apres; do
  REV=$([ "$nom" = avant ] && echo "$AVANT" || echo "$APRES")
  rm -rf "$W/$nom" && mkdir -p "$W/$nom"
  git -C "$DEPOT" archive "$REV" src package.json | tar -x -C "$W/$nom"
  git -C "$DEPOT" show "$REV:data/comparateur-index.json.gz" > "$W/$nom/index.json.gz"
  ln -sfn "$NM" "$W/$nom/node_modules"
  echo "$nom = $(git -C "$DEPOT" rev-parse "$REV")"
  node --no-warnings "$ICI/01_rejouer.mts" "$W/$nom" "$W/$nom/index.json.gz" \
    "$ICI/catalogue-questions-2026-11-10.json" "$ICI/table-manuelle-2026-11-10.json" "$W/$nom.jsonl"
done
python3 -I "$ICI/02_comparer.py" "$W/avant.jsonl" "$W/apres.jsonl" "$BOTH"

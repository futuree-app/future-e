#!/usr/bin/env bash
# Snapshot MÉCANIQUE de passation, déposé automatiquement (hook PreCompact) avant chaque
# compaction de contexte. Ne contient QUE de l'état factuel (git) : le récit sémantique est
# écrit par la commande /handoff (model-driven). Filet de sécurité toujours frais.
# Rapide et hors-ligne (git seul, pas de réseau).
set -euo pipefail

# Se placer à la racine du repo (le hook peut être lancé depuis un cwd quelconque).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
OUT="docs/handoff/AUTO-SNAPSHOT.md"
mkdir -p "$(dirname "$OUT")"

BRANCH="$(git branch --show-current 2>/dev/null || echo '?')"
NOW="$(date '+%Y-%m-%d %H:%M:%S %z')"

{
  echo "# AUTO-SNAPSHOT (mécanique, déposé avant compaction)"
  echo
  echo "> Généré automatiquement par le hook PreCompact. État FACTUEL seulement."
  echo "> Le récit complet de reprise est dans \`docs/handoff/CURRENT.md\` (commande /handoff)."
  echo "> Si CURRENT.md est plus ancien que ce snapshot, le récit peut être en retard d'un pas."
  echo
  echo "- **Horodatage** : $NOW"
  echo "- **Branche** : \`$BRANCH\`"
  echo
  echo "## Derniers commits"
  echo '```'
  git log --oneline -8 2>/dev/null || echo '(git log indisponible)'
  echo '```'
  echo
  echo "## Modifications non commitées"
  echo '```'
  git status --short 2>/dev/null || echo '(git status indisponible)'
  echo '```'
  echo
  echo "## Commits non poussés (vs upstream)"
  echo '```'
  git log --oneline @{u}.. 2>/dev/null || echo '(pas d upstream ou tout est poussé)'
  echo '```'
} > "$OUT"

echo "handoff: snapshot mécanique écrit dans $OUT (branche $BRANCH)"

#!/bin/bash
# Enchaîne la production des lots de la campagne : un lot après l'autre, commit et poussée après chaque lot,
# arrêt au premier refus d'accès ou de quota (code 3 de campagne.py produire). Usage : outil/enchainer.sh 1 4
cd "$(dirname "$0")/.." || exit 1
PY="$(git rev-parse --path-format=absolute --git-common-dir)/../.venv-etudes/bin/python"
for n in $(seq "$1" "$2"); do
  PYTHONUNBUFFERED=1 "$PY" outil/campagne.py produire "$n" > "campagne-100/journaux/produire-$n-$(date -u +%H%M).log" 2>&1
  code=$?
  "$PY" outil/campagne.py bilan > /dev/null
  git add "lots/2026-10-lot-0$((n + 3))-campagne" campagne-100 outil/enchainer.sh
  if [ $code -eq 0 ]; then msg="Campagne mobilité : lot $n sur 4 produit"; else msg="Campagne mobilité : lot $n suspendu (code $code), état conservé"; fi
  git commit -q -m "$msg

Bilan cumulatif : campagne-100/BILAN.md ; mesures : campagne-100/mesures.csv.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q origin etude/mobilite-lots
  echo "LOT $n code $code $(git log --oneline -1)"
  [ $code -ne 0 ] && exit $code
done

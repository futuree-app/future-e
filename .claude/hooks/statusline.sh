#!/usr/bin/env bash
# Statusline futur·e : branche git + modèle + ESTIMATION de remplissage du contexte.
# But : voir venir le seuil (~98 %) pour lancer /handoff avant de changer de compte.
# L'estimation lit le dernier usage du transcript (input + cache) / fenêtre de contexte.
# Dégradation propre si jq absent.
set -uo pipefail

IN="$(cat)"
CTX_WINDOW=200000   # fenêtre approx. (Opus 4.x). Estimation, pas une mesure exacte.

if command -v jq >/dev/null 2>&1; then
  TRANSCRIPT="$(printf '%s' "$IN" | jq -r '.transcript_path // empty')"
  MODEL="$(printf '%s' "$IN" | jq -r '.model.display_name // "?"')"
  DIR="$(printf '%s' "$IN" | jq -r '.workspace.current_dir // .cwd // empty')"
else
  TRANSCRIPT=""; MODEL="?"; DIR="$PWD"
fi
[ -z "${DIR:-}" ] && DIR="$PWD"

BRANCH="$(git -C "$DIR" branch --show-current 2>/dev/null || echo '-')"

PCT=""
if [ -n "${TRANSCRIPT:-}" ] && [ -f "$TRANSCRIPT" ] && command -v jq >/dev/null 2>&1; then
  # dernier message avec usage (parcours depuis la fin), tokens du prompt = contexte courant.
  CTX="$(tail -r "$TRANSCRIPT" 2>/dev/null | while IFS= read -r line; do
    u="$(printf '%s' "$line" | jq -r 'try (.message.usage | (.input_tokens // 0)+(.cache_read_input_tokens // 0)+(.cache_creation_input_tokens // 0)) // empty' 2>/dev/null)"
    if [ -n "$u" ] && [ "$u" -gt 0 ] 2>/dev/null; then echo "$u"; break; fi
  done)"
  if [ -n "${CTX:-}" ]; then
    PCT=$(( CTX * 100 / CTX_WINDOW ))
  fi
fi

GAUGE=""
if [ -n "$PCT" ]; then
  ICON="🟢"; [ "$PCT" -ge 75 ] && ICON="🟡"; [ "$PCT" -ge 90 ] && ICON="🔴"
  GAUGE="${ICON} ctx ${PCT}%"
  [ "$PCT" -ge 90 ] && GAUGE="${GAUGE} → /handoff"
fi

printf '⌁ %s  ⎇ %s  %s' "$MODEL" "$BRANCH" "$GAUGE"

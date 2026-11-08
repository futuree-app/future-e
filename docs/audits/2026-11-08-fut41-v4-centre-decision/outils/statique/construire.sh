#!/usr/bin/env bash
# Construit la VERSION STATIQUE du prototype V4 dans ../../prototype-v4/ (page autonome, sans serveur).
# Usage : bash construire.sh   (depuis ce dossier ; esbuild via npx, rien n'est installé dans le dépôt)
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$ICI/../../../../.." && pwd)"
SORTIE="$ICI/../../prototype-v4"
TMP="$(mktemp -d)"
rm -rf "$SORTIE" && mkdir -p "$SORTIE/fonts"
cp "$RACINE"/public/fonts/{Archivo-Variable.woff2,Archivo-Variable-Italic.woff2,JetBrainsMono-Variable.woff2} "$SORTIE/fonts/"
# Les jetons tels quels, polices servies en relatif.
sed "s#url('/fonts/#url('fonts/#g" "$RACINE/src/app/design-tokens.css" > "$TMP/jetons.css"
cat "$TMP/jetons.css" "$ICI/base.css" > "$TMP/global.css"
npx -y esbuild@0.23.1 "$ICI/entree.tsx" --bundle --minify --format=iife --target=es2020 \
  --jsx=automatic --loader:.module.css=local-css --loader:.woff2=file \
  --alias:next/link="$ICI/lien-next.tsx" \
  --define:process.env.NODE_ENV='"production"' \
  --tsconfig="$RACINE/tsconfig.json" \
  --outfile="$SORTIE/app.js" --log-level=warning
npx -y esbuild@0.23.1 "$TMP/global.css" --bundle --minify --loader:.woff2=file --external:'fonts/*' --outfile="$TMP/global.min.css" --log-level=warning
cat "$TMP/global.min.css" "$SORTIE/app.css" > "$TMP/app.css" && mv "$TMP/app.css" "$SORTIE/app.css"
cp "$ICI/index.html" "$SORTIE/index.html"
rm -rf "$TMP"
ls -la "$SORTIE"

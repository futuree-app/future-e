#!/usr/bin/env bash
# Construit la VERSION STATIQUE du prototype V4 dans ../../prototype-v4/ (page autonome, sans serveur).
# Usage : bash construire.sh [v4|v41|v5|v51]   (depuis ce dossier ; esbuild via npx, rien n'est installé dans le dépôt)
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$ICI/../../../../.." && pwd)"
VERSION="${1:-v4}"
ENTREE="$ICI/entree.tsx"; [ "$VERSION" = "v41" ] && ENTREE="$ICI/entree41.tsx"; [ "$VERSION" = "v5" ] && ENTREE="$ICI/entree5.tsx"; [ "$VERSION" = "v51" ] && ENTREE="$ICI/entree51.tsx"
SORTIE="$ICI/../../prototype-$VERSION"
TMP="$(mktemp -d)"
rm -rf "$SORTIE" && mkdir -p "$SORTIE/fonts"
cp "$RACINE"/public/fonts/{Archivo-Variable.woff2,Archivo-Variable-Italic.woff2,JetBrainsMono-Variable.woff2} "$SORTIE/fonts/"
# Les jetons tels quels, polices servies en relatif.
sed "s#url('/fonts/#url('fonts/#g" "$RACINE/src/app/design-tokens.css" > "$TMP/jetons.css"
cat "$TMP/jetons.css" "$ICI/base.css" > "$TMP/global.css"
npx -y esbuild@0.23.1 "$ENTREE" --bundle --minify --format=iife --target=es2020 \
  --jsx=automatic --loader:.module.css=local-css --loader:.woff2=file \
  --alias:next/link="$ICI/lien-next.tsx" \
  --define:process.env.NODE_ENV='"production"' \
  --tsconfig="$RACINE/tsconfig.json" \
  --outfile="$SORTIE/app.js" --log-level=warning
npx -y esbuild@0.23.1 "$TMP/global.css" --bundle --minify --loader:.woff2=file --external:'fonts/*' --outfile="$TMP/global.min.css" --log-level=warning
cat "$TMP/global.min.css" "$SORTIE/app.css" > "$TMP/app.css" && mv "$TMP/app.css" "$SORTIE/app.css"
sed "s#prototype V4 (données fictives)#prototype $(echo "$VERSION" | sed "s/v41/V4.1/;s/v51/V5.1/;s/v5/V5/;s/v4/V4/") (données fictives)#" "$ICI/index.html" > "$SORTIE/index.html"
rm -rf "$TMP"
ls -la "$SORTIE"

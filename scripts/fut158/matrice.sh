#!/bin/bash
# Usage : GEORISQUES_API_TOKEN=… [VARIANTES="actuel actuelIdentity"] [REPET=3] bash scripts/fut158/matrice.sh
# Le jeton n'est jamais imprimé.
# Matrice de reproduction FUT-158 : chaque appel dans un processus Node neuf.
S="$(dirname "$0")"
CHEMINS=(
  "/api/v1/gaspar/risques?code_insee=57463"
  "/api/v1/zonage_sismique?code_insee=57463"
  "/api/v1/gaspar/catnat?code_insee=57463&page=1&page_size=500"
  "/api/v1/gaspar/risques?latlon=6.1757,49.1193"
  "/api/v1/cavites?latlon=6.1757,49.1193&rayon=500&page_size=100"
  "/api/v1/mvt?latlon=6.1757,49.1193&rayon=500&page_size=100"
  "/api/v2/gaspar/pprn?latitude=49.1193&longitude=6.1757&pageSize=10&pageNumber=0"
  "/api/v2/rga?latitude=49.1193&longitude=6.1757&pageSize=10&pageNumber=0"
  "/api/v2/zonage_sismique?latitude=49.1193&longitude=6.1757&pageSize=10&pageNumber=0"
)
for hote in https://georisques.gouv.fr https://www.georisques.gouv.fr; do
  for chemin in "${CHEMINS[@]}"; do
    for v in ${VARIANTES:-actuel sansAccept sansAcceptUA acceptUA acceptEtoile}; do
      r=""
      for i in $(seq 1 ${REPET:-2}); do r="$r | $(node "$S/un-appel.mjs" "$hote$chemin" "$v")"; done
      printf "%-28s %-26s %-13s%s\n" "${hote#https://}" "${chemin%%\?*}" "$v" "$r"
    done
  done
done

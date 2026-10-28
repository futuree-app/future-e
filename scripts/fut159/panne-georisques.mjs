// FUT-159 · Interrupteur de panne Géorisques pour la recette locale, chargé avant le serveur :
//   NODE_OPTIONS="--import ./scripts/fut159/panne-georisques.mjs" PANNE_FICHIER=<chemin> npx next dev -p 3159
// Le fichier contient `tout` (toute lecture Géorisques coupée), `catnat` (seuls les arrêtés coupés) ou rien.
// Coupe comme le 28/10/2026 : TypeError « fetch failed », cause ECONNRESET. Jamais chargé en production.
import { readFileSync } from "node:fs";

const fichier = process.env.PANNE_FICHIER;
const reel = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  let mode = "";
  try { mode = fichier ? readFileSync(fichier, "utf8").trim() : ""; } catch {}
  const georisques = /(^|\.)georisques\.gouv\.fr$/.test(url.hostname);
  if (georisques && (mode === "tout" || (mode === "catnat" && url.pathname.endsWith("/gaspar/catnat")))) {
    throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } });
  }
  return reel(input, init);
};

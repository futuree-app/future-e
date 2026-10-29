// FUT-152 · Interrupteur de réponse ATMO inattendue pour la recette locale, chargé avant le serveur :
//   NODE_OPTIONS="--import ./scripts/fut152/atmo-inattendu.mjs" ATMO_FICHIER=<chemin> npx next dev -p 3152
// Quand le fichier contient `inattendu`, chaque lecture de données ATMO reçoit un 200 au contenu non documenté
// (`{ "error": … }`) ; sinon la vraie réponse passe. Sert à vérifier, sur le même serveur, que l'erreur est
// dite indisponible puis que le retour réel du service est servi. Jamais chargé en production.
import { readFileSync } from "node:fs";

const fichier = process.env.ATMO_FICHIER;
const reel = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  let mode = "";
  try { mode = fichier ? readFileSync(fichier, "utf8").trim() : ""; } catch {}
  if (mode === "inattendu" && url.hostname === "admindata.atmo-france.org" && url.pathname.startsWith("/api/data/")) {
    return Response.json({ error: "Service temporairement indisponible" });
  }
  return reel(input, init);
};

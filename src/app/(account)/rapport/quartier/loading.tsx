import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Territoire. Le seul écran d'attente qui NOMME ses sources, parce que le rendu serveur de
// /rapport/quartier interroge réellement DRIAS, Géorisques, GASPAR, l'ADEME et VigiEau pendant
// que cet écran est à l'affiche.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.territoire} />;
}

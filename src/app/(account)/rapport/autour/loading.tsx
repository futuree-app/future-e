import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Autour de l'adresse. Ne nomme aucun organisme : BPE et OSM sont chargés APRÈS le rendu, par
// des routes API, donc les annoncer ici serait faux au moment où c'est écrit.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.autour} />;
}

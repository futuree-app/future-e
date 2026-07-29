import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Le bien lui-même. Même réserve que pour Autour : le diagnostic, la parcelle et les sinistres
// arrivent par des routes API après le rendu, donc on nomme la matière, pas la source.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.logement} />;
}

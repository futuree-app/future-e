import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Le hub du rapport, qui assemble le dossier de décision de la commune lue.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.rapport} />;
}

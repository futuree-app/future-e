import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Sélecteur de biens. Page légère, un seul état.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.dossiers} />;
}

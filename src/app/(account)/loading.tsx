import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES } from "@/lib/loading-messages";

// Fallback de navigation de tout l'espace compte : /compte et la mémoire. Les segments plus
// lourds ont leur propre loading.tsx, avec les messages de LEUR échelle.
export default function Loading() {
  return <RouteLoadingBar messages={LOADING_MESSAGES.compte} />;
}

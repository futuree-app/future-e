import { RouteLoadingBar } from "@/components/RouteLoadingBar";

// Fallback de navigation pour tout l'espace compte (compte, rapport, modules,
// mémoire). Montré instantanément au clic pendant le chargement des données.
export default function Loading() {
  return <RouteLoadingBar />;
}

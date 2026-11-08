// Point d'entrée de la VERSION STATIQUE du prototype V4 (lecture hors serveur, ex. raw.githack).
// Mêmes sources React que /dev/centre-decision ; seul le cadre change (pas de Next, pas de layout).
import { createRoot } from "react-dom/client";
import { CentreDecision } from "@/components/prototypes/fut41-v4/CentreDecision";

document.documentElement.dataset.theme = document.documentElement.dataset.theme || "dark";
createRoot(document.getElementById("racine")!).render(<CentreDecision />);

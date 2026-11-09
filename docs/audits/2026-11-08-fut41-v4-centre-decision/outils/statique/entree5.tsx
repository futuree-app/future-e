// Point d'entrée de la VERSION STATIQUE du prototype V5 (mêmes sources que /dev/centre-decision-v5).
import { createRoot } from "react-dom/client";
import { CentreDecision5 } from "@/components/prototypes/fut41-v5/CentreDecision5";

document.documentElement.dataset.theme = document.documentElement.dataset.theme || "dark";
createRoot(document.getElementById("racine")!).render(<CentreDecision5 lienV4="../prototype-v4/index.html" lienV41="../prototype-v41/index.html" />);

// Point d'entrée de la VERSION STATIQUE du prototype V4.1 (mêmes sources que /dev/centre-decision-v41).
import { createRoot } from "react-dom/client";
import { CentreDecision41 } from "@/components/prototypes/fut41-v41/CentreDecision41";

document.documentElement.dataset.theme = document.documentElement.dataset.theme || "dark";
createRoot(document.getElementById("racine")!).render(<CentreDecision41 lienV4="../prototype-v4/index.html" />);

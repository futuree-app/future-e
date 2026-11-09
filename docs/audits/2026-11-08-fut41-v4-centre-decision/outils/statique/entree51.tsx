// Point d'entrée de la VERSION STATIQUE du prototype V5.1 (mêmes sources que /dev/centre-decision-v51).
import { createRoot } from "react-dom/client";
import { CentreDecision51 } from "@/components/prototypes/fut41-v51/CentreDecision51";

document.documentElement.dataset.theme = document.documentElement.dataset.theme || "dark";
createRoot(document.getElementById("racine")!).render(<CentreDecision51 lienV5="../prototype-v5/index.html" />);

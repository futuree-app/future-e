import type { Posture } from "@/lib/logement-autour-types";

// Traduit le projet déclaré (sonde) en posture d'artefact (persistée, pilote le ton des blocs).
// Partagé entre l'orchestrateur (requestAutour, ProjectProbe) et Face2Implication.
export const POSTURE_FOR_PROJET: Record<string, Posture> = {
  reside: "residence",
  achat: "prospection",
  location: "prospection",
  autre: "residence",
};

// ════════════════════════════════════════════════════════════════════════════════════════════
// D'OÙ VIENT UN TEXTE DE SYNTHÈSE (FUT-76). Module minuscule et pur, importé côté serveur (pipeline,
// stockage) ET côté client (affichage) : il ne doit tirer aucune autre dépendance.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type SynthesisOrigin = "model" | "model_retry" | "deterministic";

/** Les seules origines d'une LECTURE ENRICHIE : un texte du modèle, passé par les contrôles. */
export type EnrichedOrigin = "model" | "model_retry";

/** Dans le doute (origine absente, inconnue, ou déterministe), ce n'est pas une lecture enrichie. */
export function isEnrichedOrigin(origin: unknown): origin is EnrichedOrigin {
  return origin === "model" || origin === "model_retry";
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE LE LECTEUR VOIT DE LA SYNTHÈSE, ET QUAND (FUT-6). Pur, testable.
//
//   1. La lecture IMMÉDIATE (déterministe) est visible tout de suite. C'est une vraie lecture de
//      premier niveau, jamais un brouillon ni un chargement.
//   2. Une lecture ENRICHIE déjà en cache s'affiche d'emblée.
//   3. Sinon, elle se prépare en arrière-plan ; quand elle est prête, elle est PROPOSÉE (« Lecture
//      enrichie disponible · l'afficher »), jamais substituée d'office. Décision du 30/09, après le
//      test réel : la génération prend ~15 s, un lecteur a presque toujours commencé à lire avant,
//      la substitution automatique était donc une branche quasi inatteignable.
//   4. Un texte IA non validé n'est JAMAIS montré : seul un texte contrôlé arrive jusqu'ici.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type EnrichedStatus = "preparing" | "ready" | "unavailable";

export type DisplayState = {
  shown: "deterministic" | "enriched";
  enrichedText: string | null;
  status: EnrichedStatus;
};

export type DisplayEvent =
  | { type: "enrichedArrived"; text: string }
  | { type: "enrichedUnavailable" }
  | { type: "showEnriched" };

export function initialDisplay(cachedEnriched: string | null): DisplayState {
  return cachedEnriched
    ? { shown: "enriched", enrichedText: cachedEnriched, status: "ready" }
    : { shown: "deterministic", enrichedText: null, status: "preparing" };
}

export function displayReducer(s: DisplayState, e: DisplayEvent): DisplayState {
  switch (e.type) {
    case "enrichedArrived":
      // PROPOSÉE, jamais substituée : le texte que le lecteur a sous les yeux ne change pas seul.
      return s.shown === "enriched" ? s : { ...s, enrichedText: e.text, status: "ready" };
    case "enrichedUnavailable":
      return s.shown === "enriched" ? s : { ...s, status: "unavailable" };
    case "showEnriched":
      return s.enrichedText ? { ...s, shown: "enriched" } : s;
  }
}

/** « Lecture enrichie disponible » : une version validée attend, la lecture immédiate est affichée. */
export function offersEnriched(s: DisplayState): boolean {
  return s.shown === "deterministic" && s.status === "ready" && s.enrichedText != null;
}

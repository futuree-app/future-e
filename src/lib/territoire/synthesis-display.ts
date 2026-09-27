// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE LE LECTEUR VOIT DE LA SYNTHÈSE, ET QUAND (FUT-6, décision UX du 28/09). Pur, testable.
//
//   1. La synthèse DÉTERMINISTE est visible tout de suite : c'est un premier niveau fiable, jamais un
//      « chargement ».
//   2. Une lecture ENRICHIE déjà en cache s'affiche d'emblée.
//   3. Sinon, elle se prépare en arrière-plan. Quand elle arrive :
//        - le lecteur n'a pas commencé à lire → elle remplace la déterministe (transition douce) ;
//        - il lit ou interagit déjà → on ne change pas le texte sous ses yeux : un signal discret,
//          « Lecture enrichie prête », lui laisse le choix.
//   4. Un texte IA non validé n'est JAMAIS montré : seul un texte contrôlé arrive jusqu'ici.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type EnrichedStatus = "preparing" | "ready" | "unavailable";

export type DisplayState = {
  shown: "deterministic" | "enriched";
  enrichedText: string | null;
  status: EnrichedStatus;
  /** Le lecteur a commencé à lire ou à interagir avec la synthèse affichée. */
  engaged: boolean;
};

export type DisplayEvent =
  | { type: "engaged" }
  | { type: "enrichedArrived"; text: string }
  | { type: "enrichedUnavailable" }
  | { type: "showEnriched" };

export function initialDisplay(cachedEnriched: string | null): DisplayState {
  return cachedEnriched
    ? { shown: "enriched", enrichedText: cachedEnriched, status: "ready", engaged: false }
    : { shown: "deterministic", enrichedText: null, status: "preparing", engaged: false };
}

export function displayReducer(s: DisplayState, e: DisplayEvent): DisplayState {
  switch (e.type) {
    case "engaged":
      return s.engaged ? s : { ...s, engaged: true };
    case "enrichedArrived":
      if (s.shown === "enriched") return s;
      return {
        ...s,
        enrichedText: e.text,
        status: "ready",
        // Pas de remplacement sous les yeux d'un lecteur engagé : il décidera (signal discret).
        shown: s.engaged ? "deterministic" : "enriched",
      };
    case "enrichedUnavailable":
      // La déterministe reste affichée ; le signal « en préparation » disparaît, sans alarme.
      return s.shown === "enriched" ? s : { ...s, status: "unavailable" };
    case "showEnriched":
      return s.enrichedText ? { ...s, shown: "enriched" } : s;
  }
}

/** Le signal « Lecture enrichie prête » : une version validée attend, et le lecteur lit l'autre. */
export function offersEnriched(s: DisplayState): boolean {
  return s.shown === "deterministic" && s.status === "ready" && s.enrichedText != null;
}

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
//   5. UN REPLI DÉTERMINISTE N'EST JAMAIS UNE LECTURE ENRICHIE (FUT-76). À Toulouse 2030, deux refus des
//      contrôles avaient produit le texte déterministe sous `ready` ; l'écran le proposait comme
//      « Lecture enrichie disponible », puis l'affichait sous ce badge : le même texte, deux identités.
//      Seule une origine modèle, et un texte qui n'est pas la lecture immédiate, entrent dans l'état enrichi.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { isEnrichedOrigin } from "./synthesis-origin.ts";

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

/**
 * L'état de départ. `deterministic`, quand il est fourni, sert de garde : un « enrichi » identique à la
 * lecture immédiate n'en est pas un, d'où qu'il vienne (ancien cache, repli mal étiqueté).
 */
export function initialDisplay(cachedEnriched: string | null, deterministic?: string): DisplayState {
  if (cachedEnriched != null && deterministic != null && memeTexte(cachedEnriched, deterministic)) cachedEnriched = null;
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

const memeTexte = (a: string, b: string) => a.trim() === b.trim();

/** Ce que répond l'API de synthèse. `origin` est absent des anciennes réponses : il vaut alors « inconnu ». */
export type SynthesisAnswer =
  | { status: "ready"; text: string; origin?: unknown }
  | { status: "pending" }
  | { status: "unavailable" }
  | { status: "absent" };

/**
 * LA RÉPONSE DE L'API, TRADUITE EN ÉVÉNEMENT D'AFFICHAGE. `null` : rien de décidé, on attend encore.
 *
 * `ready` ne suffit pas : seule une origine MODÈLE est une lecture enrichie, et jamais un texte identique
 * à la lecture immédiate. Tout le reste (repli déterministe, origine absente ou inconnue) est une lecture
 * enrichie indisponible : la lecture immédiate reste, sans second badge.
 */
export function eventFromAnswer(a: SynthesisAnswer, deterministic: string): DisplayEvent | null {
  if (a.status === "ready") {
    return isEnrichedOrigin(a.origin) && !memeTexte(a.text, deterministic)
      ? { type: "enrichedArrived", text: a.text }
      : { type: "enrichedUnavailable" };
  }
  if (a.status === "unavailable") return { type: "enrichedUnavailable" };
  return null;
}

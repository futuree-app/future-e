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
  | { type: "showEnriched" }
  // FUT-75 : revenir à la lecture immédiate, qui reste toujours accessible ; la lecture enrichie demeure proposée.
  | { type: "showDeterministic" };

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
    case "showDeterministic":
      return { ...s, shown: "deterministic" };
  }
}

/**
 * L'IDENTITÉ D'UNE DEMANDE de lecture enrichie : l'horizon, l'instantané des faits, la commune. Le
 * composant relance sa demande quand l'une change ; la ligne d'état est montée sous cette clé, si bien
 * que son temps d'attente repart de zéro avec chaque demande et n'est jamais hérité d'une autre.
 */
export function cleDemande(horizon: string, snapshotHash: string | null | undefined, inseeCode: string | null | undefined): string {
  return `${horizon}|${snapshotHash ?? ""}|${inseeCode ?? ""}`;
}

/**
 * FUT-75 · LA LIGNE D'ÉTAT DE LA LECTURE ENRICHIE : un seul élément qui change de fonction.
 *   preparation   ce qui se passe, et seulement au-delà de 10 s depuis combien de temps (par pas de 5 s :
 *                 un repère, pas un chronomètre). Jamais de pourcentage ni de temps restant ;
 *   proposition   une lecture validée attend : elle est PROPOSÉE, jamais substituée ;
 *   retour        la lecture enrichie est affichée : on peut revenir à la lecture immédiate ;
 *   indisponible  dit sans alarme, avec ce qui reste vrai : la lecture affichée est complète.
 */
export type LigneEtat = { type: "preparation" | "proposition" | "retour" | "indisponible"; texte: string };
export function ligneEtatLecture(s: DisplayState, ecouleMs: number): LigneEtat | null {
  if (s.shown === "enriched") return { type: "retour", texte: "Revenir à la lecture immédiate" };
  if (offersEnriched(s)) return { type: "proposition", texte: "Lecture enrichie prête · l'afficher" };
  if (s.status === "unavailable") return { type: "indisponible", texte: "Pas de lecture enrichie pour l'instant. La lecture ci-dessus est complète." };
  if (s.status === "preparing") {
    const sec = Math.floor(ecouleMs / 5000) * 5;
    return { type: "preparation", texte: sec >= 10 ? `Une lecture enrichie se prépare, depuis ${sec} s. La lecture ci-dessus est complète.` : "Une lecture enrichie se prépare. La lecture ci-dessus est complète." };
  }
  return null;
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

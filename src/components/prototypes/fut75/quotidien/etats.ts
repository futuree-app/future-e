// FUT-75 (2e itération) · LES ÉTATS HONNÊTES DES INTERACTIONS DU QUOTIDIEN, EN LOGIQUE PURE.
//
// Deux machines d'états, testées (`quotidien.test.ts`), que les composants consomment sans les
// réécrire. Leur règle commune : UN SUCCÈS NE S'AFFICHE QU'À LA RÉCEPTION D'UNE RÉPONSE RÉELLE. Aucun
// état n'avance avec le temps seul, sauf le retour au repos après une confirmation.

// ── Le bouton d'action (« Mettre à jour l'analyse ») ──────────────────────────────────────────

export type EtatAction = "repos" | "attente" | "succes" | "echec" | "ailleurs";
export type EvenementAction =
  | { type: "appui" }
  | { type: "reponse"; ok: boolean; statut?: string }
  | { type: "erreur_reseau" }
  | { type: "fin_confirmation" };

export function suivantAction(etat: EtatAction, ev: EvenementAction): EtatAction {
  switch (ev.type) {
    // Un appui pendant l'attente ne relance rien : une seule requête à la fois.
    case "appui": return etat === "attente" ? "attente" : "attente";
    case "reponse":
      if (etat !== "attente") return etat; // une réponse tardive d'une requête abandonnée ne change rien
      if (!ev.ok) return "echec";
      return ev.statut === "en_cours" ? "ailleurs" : ev.statut === "ok" ? "succes" : "echec";
    case "erreur_reseau": return etat === "attente" ? "echec" : etat;
    case "fin_confirmation": return etat === "succes" ? "repos" : etat;
  }
}

/** L'indicateur d'attente n'apparaît qu'au-delà de ce délai : une réponse rapide ne fait rien clignoter. */
export const DELAI_INDICATEUR = 300;
/** La confirmation reste lisible ce temps-là, puis le bouton revient au repos (le compte rendu reste). */
export const DUREE_CONFIRMATION = 2600;

// ── La lecture enrichie ────────────────────────────────────────────────────────────────────────

/**
 * `deterministe` : la lecture complète est affichée, rien n'est demandé.
 * `preparation`  : une lecture enrichie a été demandée au serveur, la lecture affichée reste complète.
 * `prete`        : le serveur l'a rendue ; elle est PROPOSÉE, jamais imposée à la place de l'autre.
 * `affichee`     : le lecteur l'a choisie.
 * `echec`        : elle n'a pas pu être préparée ; la lecture affichée reste la référence.
 */
export type EtatLecture = "deterministe" | "preparation" | "prete" | "affichee" | "echec";
export type EvenementLecture =
  | { type: "demande" } | { type: "reponse"; ok: boolean } | { type: "afficher" } | { type: "revenir" };

export function suivantLecture(etat: EtatLecture, ev: EvenementLecture): EtatLecture {
  switch (ev.type) {
    case "demande": return etat === "deterministe" || etat === "echec" ? "preparation" : etat;
    case "reponse": return etat === "preparation" ? (ev.ok ? "prete" : "echec") : etat;
    case "afficher": return etat === "prete" ? "affichee" : etat;
    case "revenir": return etat === "affichee" ? "prete" : etat;
  }
}

/** Ce que l'écran dit de l'attente : un temps écoulé réel, jamais un pourcentage. */
export function libelleAttente(ecouleMs: number): string {
  const s = Math.floor(ecouleMs / 1000);
  return s < 2 ? "Préparation demandée" : `Préparation en cours côté serveur · depuis ${s} s`;
}

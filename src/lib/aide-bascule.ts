// FUT-153 : l'état d'une aide de critère (LabelTip de la matrice du comparateur), en pur.
//
// Le défaut corrigé : sur écran tactile, le navigateur émet après le toucher des événements souris
// de compatibilité (mouseenter, mousedown, focus) PUIS le click. L'ancien composant ouvrait au
// mouseenter et au focus, puis le click inversait l'état : la bulle se refermait ~15 ms après l'appui.
// À la souris, survoler puis cliquer refermait de même.
//
// Le modèle : une aide est « ouverte » (visible) et éventuellement « épinglée » (ouverte par une
// activation : appui, clic, Entrée ou Espace). Le survol n'ouvre qu'à la souris, et ne referme en
// sortant que ce qu'il a ouvert. L'activation est le SEUL événement qui bascule : elle épingle une aide
// fermée ou seulement survolée, et ferme une aide épinglée. Le focus n'ouvre rien : au toucher il arrive
// avant le click et rejouerait la concurrence ; au clavier, Entrée et Espace suffisent.

export type EtatAide = { ouvert: boolean; epingle: boolean };

export type EvenementAide =
  // pointerenter / pointerleave : `pointeur` = PointerEvent.pointerType (« mouse », « touch », « pen »).
  | { type: "entree"; pointeur: string }
  | { type: "sortie"; pointeur: string }
  // click sur le contrôle : appui tactile, clic souris, Entrée ou Espace (bouton natif).
  | { type: "activation" }
  // pointerdown ou focus hors de l'aide, Échap, ou une autre aide qui s'ouvre.
  | { type: "fermeture" };

export const AIDE_FERMEE: EtatAide = { ouvert: false, epingle: false };

export function aideSuivante(etat: EtatAide, ev: EvenementAide): EtatAide {
  switch (ev.type) {
    case "entree":
      return ev.pointeur === "mouse" && !etat.ouvert ? { ouvert: true, epingle: false } : etat;
    case "sortie":
      return ev.pointeur === "mouse" && etat.ouvert && !etat.epingle ? AIDE_FERMEE : etat;
    case "activation":
      return etat.epingle ? AIDE_FERMEE : { ouvert: true, epingle: true };
    case "fermeture":
      return etat.ouvert ? AIDE_FERMEE : etat;
  }
}

// Décalage horizontal (px) qui ramène une bulle débordant à droite dans la fenêtre, sans la faire
// sortir à gauche. `gauche`/`droite` : bords mesurés de la bulle à décalage nul.
export function decalageHorizontal(gauche: number, droite: number, largeurVue: number, marge = 12): number {
  const exces = droite - (largeurVue - marge);
  if (exces <= 0) return 0;
  return -Math.min(exces, Math.max(0, gauche - marge)) || 0;
}

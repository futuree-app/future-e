// LE NOMBRE DE COMMUNES COMPARÉES, DIT SANS MENTIR (FUT-32). Lib PURE.
//
// « Où vivre » peut légitimement ne rendre qu'une ou deux communes : trois n'est jamais un quota. Cinq
// endroits écrivaient `n >= 3 ? "trois" : "deux"`, qui faisait de UNE commune « deux » territoires.
//
// Une commune seule n'est pas une comparaison : `motCardinal` ne rend alors aucun mot, et l'appelant
// ne parle pas de comparaison.

/** « deux » pour 2, « trois » pour 3, `null` sinon (une commune ne se compare à rien). */
export function motCardinal(n: number): "deux" | "trois" | null {
  if (n === 2) return "deux";
  if (n === 3) return "trois";
  return null;
}

/**
 * Le Pack Décision proposé depuis « Où vivre » est un REPLAY du projet : la page et le paiement exigent
 * exactement trois communes (« Trio de 3 communes requis »). À une ou deux communes, il n'est pas proposé :
 * un bouton visible y menait à une redirection vers « Où vivre » (décision porteur, 06/10/2026).
 */
export const COMMUNES_PACK_REPLAY = 3;

export function packReplayProposable(n: number): boolean {
  return n === COMMUNES_PACK_REPLAY;
}

/**
 * LA GARDE DU PAIEMENT (route create-payment-intent), extraite telle quelle pour être testée : mode
 * « choix » (communes nommées sur /comparateur) à 2 ou 3 communes, mode « replay » (trio de « Où vivre »)
 * à exactement 3. La route tronque déjà la liste à 3 avant d'appeler cette règle.
 */
export function cardinalPackValide(mode: "choix" | "replay", n: number): boolean {
  return mode === "choix" ? n >= 2 : n === COMMUNES_PACK_REPLAY;
}

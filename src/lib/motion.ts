// FUT-75 · LA GRAMMAIRE DU MOUVEMENT DE FUTUR•E. Pur, testable (`motion.test.ts`).
//
// Issue des prototypes `/dev/fut75` (branche `feat/fut-75-motion-releve`) et de leur revue. Les jetons
// CSS `--m-*` (`design-tokens.css`) portent les mêmes valeurs : le test les aligne.
//
// TROIS NIVEAUX, qui ne se mélangent pas :
//   geste      la réaction immédiate à la main (pression, survol, focus) : 90 à 160 ms. Seul niveau qui
//              admet le micro-ressort, et seulement sur une COMMANDE (bouton, indicateur), jamais une donnée.
//   etat       la continuité entre deux présentations d'un même élément (bouton qui devient attente,
//              zone qui se déploie, contenu qui s'échange) : 180 à 300 ms.
//   structure  la compréhension d'ensemble (navigation, dévoilement), déclenchée par le lecteur : ≤ 900 ms.
// LE REPÈRE BOUGE, LA DONNÉE RESTE : aucune valeur ne défile, aucune barre ne s'étire entre deux états.
// MOUVEMENT RÉDUIT : aucun déplacement ni ressort ; l'état final est appliqué tout de suite.

export const DUREES = {
  /** La réponse à la pression d'une commande. */
  pression: 90,
  /** La réponse au survol et au focus (teinte, contour). */
  geste: 120,
  /** Un contenu qui s'échange d'un bloc (fondu, flou court). */
  bascule: 180,
  /** Une zone qui s'ouvre ou se ferme, un élément qui change d'état. */
  etat: 240,
  /** Le micro-ressort d'une commande qui se pose. */
  ressort: 200,
  /** La plus longue séquence permise. */
  plafond: 900,
} as const;

export const COURBES = {
  /** Départ franc, arrivée posée : ce qui arrive. */
  releve: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  /** Ce qui libère la place. */
  sortie: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** L'indicateur d'attente n'apparaît qu'au-delà de ce délai : une réponse rapide ne fait rien clignoter. */
export const DELAI_INDICATEUR = 300;

/**
 * LE MICRO-RESSORT, EN FORME FERMÉE : un oscillateur amorti échantillonné en fonction CSS `linear()`.
 * Amortissement 0,78 : dépassement ≈ 2 %, la commande se pose sans rebondir. Aucune bibliothèque.
 */
export function ressortLineaire(amortissement = 0.78, points = 28): string {
  const z = amortissement;
  const wd = Math.sqrt(1 - z * z);
  const w = Math.log(1000) / z;
  const x = (t: number) => 1 - Math.exp(-z * w * t) * (Math.cos(w * wd * t) + (z / wd) * Math.sin(w * wd * t));
  const v = Array.from({ length: points }, (_, i) => (i === points - 1 ? 1 : x(i / (points - 1))));
  return `linear(${v.map((n) => Number(n.toFixed(3))).join(", ")})`;
}

export function depassement(courbe: string): number {
  const v = courbe.replace(/^linear\(|\)$/g, "").split(",").map((s) => Number.parseFloat(s));
  return Math.max(0, Math.max(...v) - 1);
}

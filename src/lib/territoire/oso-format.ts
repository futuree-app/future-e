// FUT-183 : UNE PART OSO S'AFFICHE AU DIXIÈME, LA PRÉCISION DE SA CATÉGORIE. `land.category` (facts.ts) se lit sur
// des parts au dixième, seuils de 20, 45 et 50 % ; arrondies à l'entier, elles faisaient lire « 45 % d'espaces
// naturels » sous « Occupation mixte » à Rochefort (44,9 %), et 318 communes montraient des chiffres d'une autre
// catégorie. Module sans dépendance : la carte (client) et la synthèse déterministe (serveur) le partagent.

//
// FUT-182 : LES PARTS SONT DÉSORMAIS NON ARRONDIES dans l'index (comptes de pixels), et les seuils se comparent avant
// arrondi. Un arrondi au plus proche referait au dixième ce que FUT-183 a corrigé à l'entier : 19,96 % (« Faible présence
// d'espaces naturels », sous 20 %) s'afficherait « 20 % ». La part s'affiche donc TRONQUÉE au dixième : une valeur sous
// un seuil multiple de 0,1 reste affichée sous ce seuil, une valeur au-dessus reste au-dessus (19,96 → 19,9 ;
// 70,04 → 70). L'écart à la valeur exacte est de moins de 0,1 point, toujours vers le bas.

/** Une part OSO tronquée au dixième (jamais arrondie vers un seuil). Le millionième absorbe le bruit flottant. */
export function dixiemeOso(n: number): number {
  return Math.floor(n * 10 + 1e-6) / 10;
}

/** Une part OSO en français : au dixième tronqué, virgule décimale, décimale nulle omise (44,9 ; 45 ; 7,7). */
export function pctOso(n: number): string {
  return String(dixiemeOso(n)).replace(".", ",");
}

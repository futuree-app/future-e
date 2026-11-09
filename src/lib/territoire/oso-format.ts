// FUT-183 : UNE PART OSO S'AFFICHE AU DIXIÈME, LA PRÉCISION DE SA CATÉGORIE. `land.category` (facts.ts) se lit sur
// des parts au dixième, seuils de 20, 45 et 50 % ; arrondies à l'entier, elles faisaient lire « 45 % d'espaces
// naturels » sous « Occupation mixte » à Rochefort (44,9 %), et 318 communes montraient des chiffres d'une autre
// catégorie. Module sans dépendance : la carte (client) et la synthèse déterministe (serveur) le partagent.

/** Une part OSO en français : au dixième, virgule décimale, décimale nulle omise (44,9 ; 45 ; 7,7). */
export function pctOso(n: number): string {
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

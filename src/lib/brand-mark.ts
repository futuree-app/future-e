// ════════════════════════════════════════════════════════════════════════════════════════════
// LA GÉOMÉTRIE DU MOT-SYMBOLE, EN UN SEUL ENDROIT.
//
// Elle vivait dans `components/Logo.tsx`, ce qui convenait tant que le logo n'était rendu qu'en
// React. La facture PDF en a besoin aussi, et pdfkit ne sait pas lire un composant : sans ce
// module, il aurait fallu recopier les tracés dans le générateur de PDF. Deux copies d'une
// géométrie auditée divergent tôt ou tard, et l'écart se découvre le jour où un client compare le
// logo de sa facture à celui du site. C'est le même raisonnement que `legal-entity.ts`, où
// l'identité du vendeur a été centralisée parce que la page publique et la facture la décrivaient
// toutes les deux.
//
// AUCUN RENDU ICI. Ce module ne connaît ni React, ni pdfkit, ni couleur : il porte des nombres.
// Chaque support décide comment les dessiner et avec quelles teintes.
//
// Géométrie strictement celle de `CHARTE/futur-e-logo-v1-7-final/svg/` : NE PAS RETOUCHER UN
// NOMBRE. Le master est audité (extrema sur ancres, jonctions G1 à 0,000°, sept fûts à 35,000, les
// deux `u` identiques par translation à 0,000000 px) et toute correction repart du pack.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le mot-symbole complet, à privilégier partout où la place existe. */
export const MOT = {
  viewBox: "404 308 968 240",
  /** Le cadre du viewBox, décomposé : un support qui n'a pas de viewBox (pdfkit) en a besoin. */
  box: { x: 404, y: 308, width: 968, height: 240 },
  ratio: 968 / 240,
  paths: [
    'M 488 313 L 523 313 L 523 343 L 490 343 C 479.5 343 471.5 351 471.5 363 L 471.5 384 L 523 384 L 523 412 L 471.5 412 L 471.5 539 L 436.5 539 L 436.5 412 L 411 412 L 411 384 L 436.5 384 L 436.5 357 C 437 332.5 458.8 313 488 313 Z',
    'M 550 384 L 585 384 L 585 488 C 585 504 598 514 619 514 C 642 514 657 497 657 472 L 657 384 L 692 384 L 692 539 L 659 539 L 657 522 C 646 535 631 542 614 542 C 576 542 550 522 550 491 L 550 384 Z',
    'M 747 337 L 782 337 L 782 384 L 830 384 L 830 412 L 782 412 L 782 490 C 782 503.5 789 511 802 511 L 830 511 L 830 539 L 791 539 C 763 539 747 523 747 497 L 747 412 L 717 412 L 717 384 L 747 384 L 747 337 Z',
    'M 860 384 L 895 384 L 895 488 C 895 504 908 514 929 514 C 952 514 967 497 967 472 L 967 384 L 1002 384 L 1002 539 L 969 539 L 967 522 C 956 535 941 542 924 542 C 886 542 860 522 860 491 L 860 384 Z',
    'M 1119 380 C 1125 380 1130 381 1133 382 L 1133 414 C 1113 414 1099 417 1090 427 C 1081 437 1076 445 1076 453 L 1076 517 L 1045 538 C 1044 539 1042 539 1041 539 L 1041 384 L 1076 384 L 1076 404 C 1086 391 1101 380 1119 380 Z',
  ],
  /** Le `e` porte `fill-rule="evenodd"` : sa contre-forme est un second sous-chemin, pas un trou
   *  implicite. Sans cette règle la boucle se remplit et la lettre devient un pâté. */
  pathEvenOdd:
    'M 1282 380 C 1331 380 1367 417 1367 462 C 1367 466 1367 469 1366 472 L 1245 472 C 1247 498 1267 516 1293 516 C 1310 516 1323 508 1330 494 L 1363 494 C 1360 523 1328 542 1293 542 C 1246 542 1210 508 1210 462 C 1210 416 1243 380 1282 380 Z M 1289 407 C 1311 407 1328 422 1332 446 L 1246 446 C 1250 423 1266 407 1289 407 Z',
} as const;

/** Le signe `r•`, réservé aux emplacements où le nom n'a matériellement pas la place. */
export const COMPACT = {
  viewBox: "1024 369 180 180",
  box: { x: 1024, y: 369, width: 180, height: 180 },
  ratio: 1,
  paths: [
    'M 1119 380 C 1125 380 1130 381 1133 382 L 1133 414 C 1113 414 1099 417 1090 427 C 1081 437 1076 445 1076 453 L 1076 517 L 1045 538 C 1044 539 1042 539 1041 539 L 1041 384 L 1076 384 L 1076 404 C 1086 391 1101 380 1119 380 Z',
  ],
  pathEvenOdd: null,
} as const;

/** Le point : `cx`, `cy` et `r` sont des valeurs décidées de la charte (centre à 461,5 = milieu
 *  exact de la hauteur d'x, diamètre 50), pas des mesures relevées. */
export const POINT = { cx: 1162.54, cy: 461.5, r: 25 } as const;

/**
 * LES MINIMUMS DE TAILLE, révisés le 04/08/2026.
 *
 * `screenPx` est descendu de 28 à 22 : les 28 px avaient été relevés sur des épreuves imprimées et
 * jamais mesurés dans une barre de navigation, où le mot-symbole faisait 105 px de large contre
 * 75 px au logo texte qu'il remplace.
 *
 * `printWidthMm` vient du pack et n'a pas bougé : à l'impression c'est la LARGEUR qui borne, pas la
 * hauteur.
 */
export const MOT_MINIMUM = { screenPx: 22, printWidthMm: 28 } as const;

/** Millimètres vers points PostScript, l'unité de pdfkit (72 points par pouce). */
export const mmToPt = (mm: number): number => (mm * 72) / 25.4;

/** La largeur qu'occupe le mot-symbole pour une hauteur donnée, dans la même unité. */
export const largeurMot = (hauteur: number): number => hauteur * MOT.ratio;

/**
 * LA HAUTEUR DU MOT-SYMBOLE SUR UN DOCUMENT IMPRIMABLE, en points PostScript.
 *
 * Elle vit ici plutôt que dans le générateur de PDF parce que c'est une décision de MARQUE bornée
 * par la charte, pas un réglage de mise en page : à l'impression, c'est la LARGEUR qui borne
 * (`MOT_MINIMUM.printWidthMm`), et la hauteur s'en déduit. Le test du module vérifie que la valeur
 * choisie reste au-dessus du plancher, ce qu'un commentaire ne peut pas garantir.
 */
export const HAUTEUR_MOT_IMPRIME_PT = 22;

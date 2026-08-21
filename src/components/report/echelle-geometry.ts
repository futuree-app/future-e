// GÉOMÉTRIE COMMUNE AUX REPÈRES D'ÉCHELLE.
//
// Le même emboîtement est dessiné à deux endroits : le navigateur du hub (`EchelleNavigator`, qui
// est cliquable et réagit au pointage) et l'en-tête de chaque module (`EchelleVisual`, qui dit
// seulement « vous êtes ici »). Une seule source de formes évite que les deux représentations du
// même système cessent de se ressembler à la première retouche.
//
// LE REPÈRE EST DÉCRIT DANS UNE BOÎTE DE 224 (21/08/2026), la taille à laquelle il est réellement
// rendu sur desktop. Les coordonnées du dessin sont donc des pixels, ce qui rend lisibles les
// distances qui comptent : la gouttière entre deux fenêtres, la marge d'une marque au bord, la
// longueur d'une graduation. L'ancienne boîte de 360 obligeait à convertir de tête.
export const ECHELLE_VIEWBOX = 224;
export const ECHELLE_CENTRE = ECHELLE_VIEWBOX / 2;

// LES TROIS FORMES SONT EMBOÎTÉES, ET ELLES RESPIRENT. Le losange mesure 35,4 de demi-diagonale
// dans un carré de 54 de demi-côté : la troisième fenêtre est CONTENUE dans la deuxième. Dans le
// dessin précédent elle en occupait presque toute la largeur, et l'emboîtement ne se lisait plus.
export const TERRITOIRE_RADIUS = 96;
export const COTE_AUTOUR = 108;
export const COTE_LOGEMENT = 50;

const BORD_AUTOUR = ECHELLE_CENTRE - COTE_AUTOUR / 2;

export const CERCLE_TERRITOIRE = {
  cx: ECHELLE_CENTRE,
  cy: ECHELLE_CENTRE,
  r: TERRITOIRE_RADIUS,
} as const;

export const CARRE_AUTOUR = {
  x: BORD_AUTOUR,
  y: BORD_AUTOUR,
  width: COTE_AUTOUR,
  height: COTE_AUTOUR,
  rx: 14,
} as const;

export const LOSANGE_LOGEMENT = {
  x: ECHELLE_CENTRE - COTE_LOGEMENT / 2,
  y: ECHELLE_CENTRE - COTE_LOGEMENT / 2,
  width: COTE_LOGEMENT,
  height: COTE_LOGEMENT,
  rx: 6,
  transform: `rotate(45 ${ECHELLE_CENTRE} ${ECHELLE_CENTRE})`,
} as const;

// COMPENSATION OPTIQUE. À épaisseur égale, un cercle de 192 px de diamètre pèse plus lourd qu'un
// losange de 70 px. Le trait actif décroît donc avec la taille de la forme : les trois états actifs
// pèsent alors pareil à l'œil, et aucun ne prend la main sur le verdict qu'il accompagne.
export const TRAIT_ACTIF = { commune: 2.2, autour: 2.6, logement: 2.9 } as const;
export const TRAIT_REPOS = { commune: 1.5, autour: 1.6, logement: 1.7 } as const;

// ══════════════════════════════════════════════════════════════════════════════════════════
// LA TRAME DE MESURE : TROIS MATIÈRES POUR TROIS PRÉCISIONS.
//
// Le dessin ne montre PAS le lieu. Il montre avec quelle finesse on le regarde. Des routes et des
// emprises de bâtiments, dessinées au jugé, seraient lues comme des informations sur l'adresse du
// lecteur, à quelques centimètres d'un verdict fondé sur des sources datées : c'est la seule chose
// que cet écran ne peut pas se permettre. Une trame de coordonnées ne se confond avec aucune donnée.
//
//   Commune   graduations de rive et points espacés, posés RADIALEMENT, dans la logique du cercle.
//   Voisinage croix de coordonnées, franchement orthogonales, dans la logique du carré.
//   Logement  grille continue : à ce pas, ce n'est plus un repère, c'est un plan.
//
// Le même signe répété à deux pas différents ne se voyait pas : le changement de pas était juste,
// l'œil ne lisait qu'un motif dupliqué. C'est le vocabulaire qui progresse, pas seulement l'échelle.
//
// UNE FENÊTRE OCCULTE CE QU'ELLE RECOUVRE. Aucune trame n'est posée sur un aplat : chacune est
// découpée à sa forme (`clipPath`) ET trouée de la forme suivante (`mask`). L'occultation est donc
// exacte sur le fond de la page, halos compris, dans les deux thèmes.
const PAS_AUTOUR = 16;
const PAS_LOGEMENT = 8;

function positionsDeTrame(pas: number, demiEtendue: number): number[] {
  const positions: number[] = [];
  for (let d = -Math.floor(demiEtendue / pas) * pas; d <= demiEtendue; d += pas) {
    positions.push(ECHELLE_CENTRE + d);
  }
  return positions;
}

// AUCUNE MARQUE COUPÉE PAR UN BORD. Une croix tranchée en deux par un contour se lit comme un défaut
// de découpe, jamais comme un motif : les marques trop proches d'un bord ne sont pas dessinées. Le
// découpage reste le fait du `clipPath`, il ne devient jamais visible.
const MARGE_AUTOUR = 9;

function dansCarreAutour(x: number, y: number): boolean {
  return (
    x > CARRE_AUTOUR.x + MARGE_AUTOUR
    && x < CARRE_AUTOUR.x + CARRE_AUTOUR.width - MARGE_AUTOUR
    && y > CARRE_AUTOUR.y + MARGE_AUTOUR
    && y < CARRE_AUTOUR.y + CARRE_AUTOUR.height - MARGE_AUTOUR
  );
}

export const CROIX_AUTOUR = (() => {
  const positions = positionsDeTrame(PAS_AUTOUR, CARRE_AUTOUR.width / 2);
  const croix: { cle: string; d: string }[] = [];
  const bras = 2.6;
  for (const x of positions) {
    for (const y of positions) {
      if (!dansCarreAutour(x, y)) continue;
      croix.push({ cle: `${x}-${y}`, d: `M${x - bras} ${y} H${x + bras} M${x} ${y - bras} V${y + bras}` });
    }
  }
  return croix;
})();

export const TRAITS_LOGEMENT = positionsDeTrame(PAS_LOGEMENT, LOSANGE_LOGEMENT.width);

// TOUTE COORDONNÉE CALCULÉE EST ARRONDIE AVANT D'ENTRER DANS LE MARKUP. `Math.cos` et `Math.sin` ne
// rendent pas les mêmes derniers bits sous Node et sous V8 dans le navigateur : le serveur écrivait
// `y1="37.521815274538284"`, le client recalculait `37.5218152745383`, et React signalait une
// divergence d'hydratation sur chaque graduation. Deux décimales dans une boîte de 224 sont très en
// dessous du pixel, et rendent le dessin identique des deux côtés.
const arrondi = (valeur: number) => Number(valeur.toFixed(2));

// Vingt-quatre graduations posées à l'intérieur de la rive, tous les 15°.
export const RIVE_TERRITOIRE = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 24;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: arrondi(ECHELLE_CENTRE + cos * (TERRITOIRE_RADIUS - 10)),
    y1: arrondi(ECHELLE_CENTRE + sin * (TERRITOIRE_RADIUS - 10)),
    x2: arrondi(ECHELLE_CENTRE + cos * (TERRITOIRE_RADIUS - 3)),
    y2: arrondi(ECHELLE_CENTRE + sin * (TERRITOIRE_RADIUS - 3)),
  };
});

// Une couronne de douze points alignée sur une graduation sur deux, et quatre points d'axe dans les
// lobes que le carré laisse libres. Il n'existe aucune couronne complète en dessous de 77 : les
// angles du carré occupent les diagonales.
export const POINTS_TERRITOIRE = [
  ...Array.from({ length: 12 }, (_, i) => ({ angle: (i * Math.PI * 2) / 12, rayon: 80 })),
  ...Array.from({ length: 4 }, (_, i) => ({ angle: (i * Math.PI) / 2, rayon: 66 })),
].map(({ angle, rayon }, i) => ({
  cle: `p${i}`,
  cx: arrondi(ECHELLE_CENTRE + Math.cos(angle) * rayon),
  cy: arrondi(ECHELLE_CENTRE + Math.sin(angle) * rayon),
}));

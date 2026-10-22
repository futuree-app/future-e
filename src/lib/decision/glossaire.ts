// FUT-126 · LE GLOSSAIRE DU DOSSIER : un terme technique s'explique là où il est lu, sans toucher au texte.
//
// Les constats viennent du moteur, et ceux des dossiers vendus sont figés dans leur artefact : les réécrire
// pour y glisser une définition est exclu. L'écran repère le terme dans ce qu'il affiche et propose, sous
// la carte, une définition DÉPLIABLE (un `<details>` natif : clavier, toucher, lecteur d'écran, recherche
// dans la page). Jamais une infobulle au survol, inaccessible au doigt et au clavier.
//
// Une définition dit ce qu'est la chose, et ce que le constat NE dit PAS : un aléa décrit un sol, pas un
// dommage. Elle ne conclut rien sur le lieu ; elle n'ajoute aucun chiffre. Une entrée nouvelle s'ajoute
// ici, avec son test.

export type Definition = {
  cle: string;
  /** La question posée par le dépliant, telle que le lecteur se la pose. */
  question: string;
  /** Le repère dans le texte affiché (accents et casse tolérés, trait d'union ou espace). */
  motif: RegExp;
  definition: string;
};

export const GLOSSAIRE: Definition[] = [
  {
    cle: "retrait-gonflement-argiles",
    question: "Qu'est-ce que le retrait-gonflement des argiles ?",
    motif: /retrait[\s-]+gonflement\s+des\s+(?:sols\s+)?argiles/i,
    definition:
      "Certains sols argileux gonflent quand ils s'humidifient et se rétractent quand ils sèchent. Ces mouvements, plus marqués après une sécheresse, peuvent fissurer les bâtiments aux fondations peu profondes. L'aléa décrit le sol à cet endroit : il ne dit pas si ce bâtiment a subi des dégâts.",
  },
];

/** Les définitions des termes présents dans ces textes, chacune une fois, dans l'ordre du glossaire. */
export function definitionsPour(textes: (string | undefined | null)[]): Definition[] {
  const tout = textes.filter((t): t is string => Boolean(t)).join("\n");
  return GLOSSAIRE.filter((d) => d.motif.test(tout));
}

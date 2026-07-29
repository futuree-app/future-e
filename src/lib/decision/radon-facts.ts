// LE RADON DANS LE DOSSIER. Lib PURE : aucune I/O, aucun `node:`.
//
// Table de vérité arrêtée avant le code : `docs/cadrage-radon.md`.
//
// LE POINT QUI GOUVERNE TOUT : LES CLASSES 1 ET 2 NE PRODUISENT AUCUN `satisfied`.
//
// C'est la leçon du bruit, le 29/07/2026 au matin. Un `satisfied` sans fait ne porte aucune carte,
// donc aucune limitation, et `criteria-registry` en tire « favorable » plus une montée de couverture.
// Le lecteur recevrait « pas de problème de radon » alors que le classement ne mesure RIEN dans son
// logement : un potentiel faible n'interdit pas une concentration élevée dans un bâtiment mal
// ventilé, et l'inverse est vrai aussi. Le silence est ici la seule position tenable.
//
// LE TEXTE EST LE NÔTRE. La source ne rend qu'un chiffre ("1", "2", "3") —
// aucune formulation officielle à reprendre. L'autre endpoint Géorisques dit « Risque Existant -
// important », où « risque » remplace « potentiel » : on ne le reprend pas, la source elle-même ne
// le fait pas.

import type { RadonClasse } from "../radon.ts";

// PAS DE VERSION DE CONVENTION ICI, et c'est délibéré — même raison que dans `sante-facts.ts`. J'en
// avais écrit une (`radon-conv-1`) ; le test des constantes mortes l'a attrapée dans la minute, avec
// la bonne formule : « une valeur qui a l'apparence d'une règle du produit sans aucun effet est une
// règle qui ment ». Ce fait est une VERIFICATION, et une vérification ne porte pas de `basis`, donc
// pas de `conventionId` : rien n'aurait pu estampiller cette version.

/**
 * LA SEULE CLASSE QUI PARLE. Mesurée le 29/07/2026 sur 200 communes de l'index : classe 3 = 19,5 %,
 * classe 2 = 5,5 %, classe 1 = 75,0 %. À 19,5 % le signal trie (repères : feu recensé 43 %,
 * boisement ≥ 70 % 9,4 %, inondation 86 % — universelle, donc écartée).
 */
export const RADON_CLASSE_SIGNALEE: RadonClasse = "3";

export type RadonFacts = {
  classe: RadonClasse;
  /** Le code réellement interrogé : la commune, ou l'arrondissement pour Paris, Lyon et Marseille. */
  codeInterroge: string;
  /** La lecture porte sur un arrondissement et non sur la commune entière. */
  parArrondissement: boolean;
};

/** Le constat mérite-t-il d'être dit ? Classes 1 et 2 : non — et surtout pas en « favorable ». */
export function radonSignale(f: RadonFacts | null | undefined): boolean {
  return f?.classe === RADON_CLASSE_SIGNALEE;
}

/**
 * LE CONSTAT. Il ouvre en disant CE QU'EST LE RADON, avant de dire ce qu'on a trouvé : c'est un sujet
 * que la plupart des lecteurs découvrent, et une carte qui commence par « catégorie 3 » ne veut rien
 * dire pour eux. La catégorie officielle vient après, comme précision.
 */
export function radonStatement(f: RadonFacts, nomCommune: string): string {
  const ou = f.parArrondissement ? "cet arrondissement" : `${nomCommune}`;
  return (
    `Le radon est un gaz radioactif naturel qui provient du sol et peut s'accumuler dans les ` +
    `bâtiments. Le sous-sol de ${ou} présente un potentiel plus important (catégorie 3 sur 3).`
  );
}

/**
 * LA LIMITE, obligatoire et jamais optionnelle : c'est elle qui empêche la carte de se lire comme une
 * mesure. Sans elle, « potentiel significatif » devient « votre logement est exposé ».
 */
export function radonLimitation(): string {
  return (
    "Ce classement décrit le sous-sol, pas ce logement. Deux logements voisins peuvent présenter des " +
    "situations très différentes selon leur construction, leur contact avec le sol et leur " +
    "ventilation : seule une mesure à l'intérieur établit la concentration réelle."
  );
}

/** Le sujet, tel que la conclusion le NOMME sans recopier la carte. */
export const RADON_TOPIC = "le potentiel radon du sol";

/** L'état établi, scannable. Jamais « risque » : la source dit potentiel. */
export const RADON_STATUS = "Potentiel du sol plus important";

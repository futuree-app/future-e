// LE RANG D'UNE COMMUNE PARMI TOUTES LES AUTRES.
//
// C'est le seul calcul du site qu'une réponse conversationnelle ne peut pas produire. Dire qu'une
// commune aura chaud n'apprend rien, c'est vrai presque partout. Savoir qu'elle est dans les 6 %
// les plus exposées de France demande d'avoir mesuré les 34 000 autres, avec la même méthode,
// AVANT que la question soit posée. Le montrer gratuitement est ce qui distingue futur•e d'un
// résumé, sans avoir à l'affirmer.
//
// Module PUR : aucune I/O, aucun `node:`, aucun `server-only`. Testable sous `node --test`.

export type Rang = {
  /** Position ascendante 0–100 : 0 = la plus faible valeur de France. */
  percentile: number;
  /** Rang descendant, 1 = la commune la PLUS haute (la plus exposée, pour un indicateur de chaleur). */
  rang: number;
  /** Le nombre de communes réellement comparées, jamais un chiffre rond de communication. */
  total: number;
};

/**
 * L'échelle nationale d'un indicateur : ses valeurs triées.
 *
 * On garde le tableau trié plutôt qu'un percentile pré-calculé par commune. Un percentile figé est
 * un seuil déguisé en donnée : le jour où l'échelle change (autre scénario, autre millésime), il
 * continue de répondre à une question qu'on ne pose plus. L'échelle, elle, se relit.
 */
export function construireEchelle(valeurs: Iterable<number>): Float64Array {
  const arr = Float64Array.from(
    [...valeurs].filter((v) => typeof v === "number" && Number.isFinite(v)),
  );
  arr.sort();
  return arr;
}

/** Nombre de valeurs strictement inférieures à `valeur`, par dichotomie sur l'échelle triée. */
function nbStrictementInferieures(echelle: Float64Array, valeur: number): number {
  let lo = 0;
  let hi = echelle.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (echelle[mid] < valeur) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Nombre de valeurs inférieures ou égales à `valeur`. */
function nbInferieuresOuEgales(echelle: Float64Array, valeur: number): number {
  let lo = 0;
  let hi = echelle.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (echelle[mid] <= valeur) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Le rang d'une valeur dans son échelle nationale.
 *
 * LES EX ÆQUO SONT TRAITÉS PAR LE MILIEU (midrank), et ce choix compte : les indicateurs DRIAS sont
 * des entiers sur de larges plateaux (des milliers de communes à « 3 nuits chaudes »). Compter les
 * strictement inférieures placerait toutes ces communes au bas de leur propre plateau, compter les
 * inférieures ou égales les placerait toutes en haut. Les deux mentent d'autant plus que le plateau
 * est peuplé, et c'est précisément là qu'il y a le plus de lecteurs. Le milieu ne privilégie
 * personne : une commune sur un plateau lit la position du plateau, pas un rang inventé à
 * l'intérieur d'un groupe où rien ne la distingue.
 *
 * Retourne `null` sur une échelle vide ou une valeur non finie : une absence se dit, elle ne
 * s'arrondit pas à zéro.
 */
export function rangDe(echelle: Float64Array, valeur: number): Rang | null {
  const total = echelle.length;
  if (total === 0 || !Number.isFinite(valeur)) return null;

  const inf = nbStrictementInferieures(echelle, valeur);
  const infEq = nbInferieuresOuEgales(echelle, valeur);
  const milieu = (inf + infEq) / 2;

  const percentile = (milieu / total) * 100;
  // Rang descendant : 1 = la plus haute. Sur un plateau, toutes les communes du plateau partagent
  // le même rang, celui du milieu du plateau.
  const rang = Math.max(1, Math.round(total - milieu));

  return { percentile, rang, total };
}

/**
 * « Parmi les N % les plus élevées », en pourcentage ENTIER et jamais 0.
 *
 * Un arrondi à 0 % dirait « aucune commune n'est au-dessus », ce qui est faux dès qu'il en existe
 * une seule. Le plancher à 1 % garde la phrase vraie pour les extrêmes. Le plafond à 100 % vaut
 * pour l'autre bout de l'échelle.
 */
export function partSuperieure(rang: Rang): number {
  const brut = 100 - rang.percentile;
  return Math.min(100, Math.max(1, Math.round(brut)));
}

/**
 * La phrase de position, ou `null` quand il n'y a rien d'assez saillant à dire.
 *
 * ELLE SUPPOSE UN INDICATEUR OÙ « HAUT » VAUT « PLUS EXPOSÉ » : jours de canicule, nuits chaudes,
 * pluies extrêmes. Ne pas la brancher telle quelle sur un indicateur dont le haut est désirable
 * (ensoleillement, accès aux services) : elle dirait d'une commune très ensoleillée qu'elle est
 * « parmi les plus exposées ». Un tel indicateur demande son propre vocabulaire, pas un
 * contournement en inversant le percentile.
 *
 * LE MILIEU DE DISTRIBUTION NE PRODUIT AUCUNE PHRASE. Une commune au 50e percentile est « dans la
 * moyenne », ce que le lecteur sait déjà en regardant le chiffre : l'écrire ajouterait une ligne
 * qui ne l'aide pas à décider, et diluerait celles qui comptent. Le silence est ici l'information
 * honnête, au même titre que la mention.
 */
export function phraseDePosition(rang: Rang | null): string | null {
  if (!rang) return null;
  const { percentile } = rang;

  if (percentile >= 75) {
    return `Parmi les ${partSuperieure(rang)} % des communes françaises les plus exposées`;
  }
  if (percentile <= 25) {
    const part = Math.min(100, Math.max(1, Math.round(percentile)));
    return `Parmi les ${part} % des communes françaises les moins exposées`;
  }
  return null;
}

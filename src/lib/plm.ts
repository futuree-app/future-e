// Paris, Lyon, Marseille (PLM) : une adresse est géocodée sur son ARRONDISSEMENT (ex. 75101 pour
// Paris 1er), mais la commune est stockée sur son code INSEE de commune (75056). Comparer les deux
// bruts échoue toujours, d'où le bug « un Parisien ne peut analyser aucune adresse de Paris ».
// `communeParent` ramène un arrondissement à sa commune.
//
// LE SENS INVERSE EXISTE AUSSI, ET IL COMPTE (29/07/2026). Plusieurs sources publiques ne connaissent
// QUE les arrondissements : `/radon?code_insee=75056` rend zéro résultat, `75104` répond. Le dataset
// IRIS de l'ADEME a la même propriété. Ce n'est pas une bizarrerie d'API — l'arrondissement EST la
// commune au sens INSEE ; c'est notre modèle qui les agrège pour parler de « Paris ».
//
// ET LA VALEUR PEUT VARIER D'UN ARRONDISSEMENT À L'AUTRE. Mesuré sur le radon le 29/07/2026 :
//   Paris     11111111111111111111  -> uniforme, classe 1
//   Lyon      111111113             -> le 9e est en classe 3, les huit autres en 1
//   Marseille 1111111111222215      -> les 11e à 15e en classe 2
// Interroger « un arrondissement représentatif » afficherait donc « classe 1 » à un habitant du
// 9e arrondissement de Lyon. Pour ces sources, la bonne maille est l'ARRONDISSEMENT, pas la commune :
// `arrondissementsDe` sert à les énumérer, et l'appelant qui a une adresse doit interroger SON
// arrondissement plutôt que d'agréger.
//
// Lib PURE, testable.

export function communeParent<T extends string | null | undefined>(insee: T): T {
  if (!insee) return insee;
  if (insee >= "75101" && insee <= "75120") return "75056" as T; // Paris
  if (insee >= "69381" && insee <= "69389") return "69123" as T; // Lyon
  if (insee >= "13201" && insee <= "13216") return "13055" as T; // Marseille
  return insee;
}

/** Les bornes d'arrondissements des trois communes concernées. */
const PLM: { commune: string; premier: number; dernier: number }[] = [
  { commune: "75056", premier: 75101, dernier: 75120 }, // Paris, 20 arrondissements
  { commune: "69123", premier: 69381, dernier: 69389 }, // Lyon, 9
  { commune: "13055", premier: 13201, dernier: 13216 }, // Marseille, 16
];

/**
 * Les codes d'arrondissement d'une commune PLM, dans l'ordre. `[]` pour toute autre commune — donc
 * `arrondissementsDe(insee)` est vide EXACTEMENT quand `insee` n'a pas d'arrondissements, et
 * l'appelant peut écrire `arrondissementsDe(x).length > 0 ? … : …` sans table à lui.
 */
export function arrondissementsDe(insee: string | null | undefined): string[] {
  const plm = PLM.find((p) => p.commune === insee);
  if (!plm) return [];
  const out: string[] = [];
  for (let c = plm.premier; c <= plm.dernier; c += 1) out.push(String(c));
  return out;
}

/**
 * LE CODE À INTERROGER pour une source qui ne connaît que les arrondissements.
 *
 * Rend le code tel quel dans le cas courant. Rend `null` pour une commune PLM sans point d'adresse :
 * il n'existe alors AUCUNE bonne réponse — pas de valeur « pour Lyon », seulement des valeurs par
 * arrondissement, qui diffèrent. Rendre un arrondissement au hasard serait inventer une réponse.
 *
 * `citycode` est le code que le géocodeur a donné à l'adresse : pour une adresse parisienne, c'est
 * DÉJÀ l'arrondissement. C'est donc lui qu'il faut passer, avant toute remontée par `communeParent`.
 */
export function codePourSourceParArrondissement(
  insee: string | null | undefined,
  citycode?: string | null,
): string | null {
  if (!insee) return null;
  if (arrondissementsDe(insee).length === 0) return insee; // commune ordinaire
  // Commune PLM : seul un code d'arrondissement est exploitable.
  return citycode && communeParent(citycode) === insee && citycode !== insee ? citycode : null;
}

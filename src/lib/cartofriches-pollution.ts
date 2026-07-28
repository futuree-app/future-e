// L'ÉTAT DE POLLUTION DU SOL D'UNE FRICHE, isolé de la couche d'accès (`cartofriches.ts` est
// `server-only`, donc intestable). Même geste que `eaufrance-ecoulement.ts` et `georisques-flags.ts`,
// et pour la même raison : la logique qui a menti vivait dans une fonction d'I/O.
//
// LE BUG FERMÉ ICI (29/07/2026). `toFriche` produisait un booléen :
//
//     sol_pollue: r.sol_pollution_existe === true || r.sol_pollution_existe === "true" || ... === "1"
//
// Or le champ ne vaut JAMAIS ces valeurs-là. Il porte sept libellés français
// (cf. `CARTOFRICHES_SOL_POLLUTION`), donc `sol_pollue` valait `false` pour les 28 373 friches de
// France — y compris les 485 en « pollution avérée ». Troisième défaut de la même famille après
// « feux de foret » au pluriel et `libelle_observation` : une valeur d'API jamais confrontée à la
// source. Il n'était pas visible parce que le champ n'est aujourd'hui affiché nulle part ; il
// l'aurait été à la première carte qui l'aurait lu.
//
// POURQUOI UN ÉTAT ET NON UN BOOLÉEN. « inconnu » couvre 86,6 % des friches, « pollution
// inexistante » 1,9 %. Les réduire tous deux à `false` efface la distinction qui fait la valeur du
// produit — la doctrine des quatre états de l'information dit qu'une donnée absente n'est pas une
// donnée rassurante. Un booléen ne PEUT PAS porter cette nuance : il fallait changer le type, pas
// corriger la comparaison.

/**
 * CE QUE LA SOURCE ÉTABLIT sur le sol d'une friche. Quatre états, dérivés des sept libellés ADEME.
 *
 *  `etablie`   — pollution avérée, ou traitée (le sol A ÉTÉ pollué : le fait est établi).
 *  `probable`  — supposée ou probable : un indice, jamais un diagnostic.
 *  `ecartee`   — inexistante ou peu probable : la source a regardé et n'a rien retenu.
 *  `inconnue`  — « inconnu », ou libellé non reconnu. NE VEUT PAS DIRE « sol sain ».
 */
export type SolPollution = "etablie" | "probable" | "ecartee" | "inconnue";

const ETABLIE = new Set(["pollution avérée", "pollution traitée"]);
const PROBABLE = new Set(["pollution supposée", "pollution probable"]);
const ECARTEE = new Set(["pollution inexistante", "pollution peu probable"]);

/**
 * Lit le champ brut. Tout ce qui n'est pas reconnu retombe sur `inconnue` — jamais sur `ecartee` :
 * un libellé qu'on ne sait pas lire ne prouve pas l'absence de pollution. C'est la règle qui
 * manquait au booléen.
 */
export function readSolPollution(raw: unknown): SolPollution {
  if (typeof raw !== "string") return "inconnue";
  const v = raw.trim().toLowerCase();
  if (ETABLIE.has(v)) return "etablie";
  if (PROBABLE.has(v)) return "probable";
  if (ECARTEE.has(v)) return "ecartee";
  return "inconnue";
}

/** Le libellé lisible, pour un lecteur — jamais le code interne. */
export const SOL_POLLUTION_LABEL: Record<SolPollution, string> = {
  etablie: "Pollution du sol établie",
  probable: "Pollution du sol supposée, sans diagnostic",
  ecartee: "Pollution du sol écartée par la source",
  inconnue: "État du sol non renseigné",
};

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
 * CE QUE LA SOURCE ÉTABLIT sur le sol d'une friche. Six états, un par sens réellement distinct.
 *
 * PREMIÈRE VERSION À QUATRE ÉTATS, CORRIGÉE LE MÊME JOUR. Elle rangeait « pollution traitée » avec
 * « avérée », et « peu probable » avec « inexistante ». C'était refaire en plus petit l'erreur du
 * booléen : écraser des états qui n'appellent pas la même décision.
 *   - un site DÉPOLLUÉ et un site pollué non traité ne demandent pas le même geste (8 sites en
 *     France, mais le principe ne dépend pas du volume) ;
 *   - « peu probable » est un jugement de VRAISEMBLANCE, « inexistante » une AFFIRMATION. 843 sites
 *     contre 528 : les confondre surinterprétait dans le sens rassurant, précisément le biais que la
 *     doctrine des quatre états surveille.
 *
 *  `etablie`     — pollution avérée : le fait est établi.
 *  `traitee`     — pollution traitée : le sol a été pollué, puis dépollué. Ni l'un ni l'autre.
 *  `supposee`    — supposée ou probable : un indice, jamais un diagnostic.
 *  `peu_probable`— la source juge la pollution peu vraisemblable. Elle ne l'exclut pas.
 *  `ecartee`     — « pollution inexistante » : la source a regardé et n'a rien retenu.
 *  `inconnue`    — « inconnu », ou libellé non reconnu. NE VEUT PAS DIRE « sol sain ».
 */
export type SolPollution =
  | "etablie" | "traitee" | "supposee" | "peu_probable" | "ecartee" | "inconnue";

/** Ce que la lecture rend : l'état normalisé ET le libellé brut de la source, conservé tel quel. */
export type SolPollutionLu = { etat: SolPollution; brut: string | null };

// Un libellé source -> un état. Aucune fusion : la table est plate, donc relisible d'un coup d'œil,
// et l'ajout d'une modalité par l'ADEME se voit comme une ligne manquante.
const PAR_LIBELLE: Record<string, SolPollution> = {
  "pollution avérée": "etablie",
  "pollution traitée": "traitee",
  "pollution supposée": "supposee",
  "pollution probable": "supposee",
  "pollution peu probable": "peu_probable",
  "pollution inexistante": "ecartee",
  inconnu: "inconnue",
};

/**
 * Lit le champ brut. Tout ce qui n'est pas reconnu retombe sur `inconnue` — jamais sur `ecartee` ni
 * `peu_probable` : un libellé qu'on ne sait pas lire ne rend pas une pollution moins vraisemblable.
 * C'est la règle qui manquait au booléen.
 *
 * LE BRUT EST CONSERVÉ. Il permet de vérifier une normalisation sans retourner à l'API, et de voir
 * qu'une modalité nouvelle est arrivée : `{ etat: "inconnue", brut: "pollution en cours de
 * traitement" }` se distingue d'un vrai « inconnu ».
 */
export function readSolPollution(raw: unknown): SolPollutionLu {
  if (typeof raw !== "string") return { etat: "inconnue", brut: null };
  const brut = raw.trim();
  if (!brut) return { etat: "inconnue", brut: null };
  return { etat: PAR_LIBELLE[brut.toLowerCase()] ?? "inconnue", brut };
}

/**
 * LE LIBELLÉ LISIBLE. Il nomme LA FRICHE, jamais le sol du logement analysé : Cartofriches décrit un
 * site recensé, et tant qu'aucune intersection avec la parcelle n'est établie, « pollution du sol »
 * tout court laisserait entendre « votre sol ». La distance, elle, est portée par la carte.
 */
export const SOL_POLLUTION_LABEL: Record<SolPollution, string> = {
  etablie: "Pollution avérée sur ce site",
  traitee: "Site dépollué après une pollution avérée",
  supposee: "Pollution supposée sur ce site, sans diagnostic",
  peu_probable: "Pollution jugée peu probable sur ce site",
  ecartee: "Pollution non retenue sur ce site",
  inconnue: "État du sol de ce site non renseigné",
};

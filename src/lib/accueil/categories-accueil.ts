// LES CATÉGORIES QUE L'ACCUEIL RETIENT POUR UNE COMMUNE (FUT-185). Module PUR, imports relatifs.
//
// Trois sources, par ordre de priorité, inchangé :
//   1. la table manuelle Supabase `communes_categorization` (44 communes affinées à la main) ;
//   2. l'index (`/api/landing-signals`, `deriveCategoriesFromEntry`) ;
//   3. le repli par département (`deriveCategories`), quand l'index ne répond pas.
//
// FUT-185 : la table manuelle n'est plus crue pour deux clés qu'aucune mesure n'y fonde.
//   - `rural_peri_urbain` : aucune source fiable de ruralité n'existe à ce jour (la grille Insee 2025, FUT-184,
//     n'est pas intégrée). L'index ne l'émet plus ; la table la portait pour 10 communes, dont Rodez (centre
//     urbain intermédiaire, 2 155 hab/km²). Elle ouvrait « S'installer à X ? » et « Quitter la ville pour X ? ».
//   - `periurbain_dependance_auto` : la table la portait pour 7 villes (Toulouse, Bordeaux…) sans la mesure
//     qui la fonde dans l'index (part voiture MOBPRO au 60e percentile ou plus). Elle n'est gardée que si
//     l'index la CONFIRME (Les Pennes-Mirabeau). Index muet (échec, commune hors index) : elle n'est pas
//     gardée, une absence ne devient jamais un fait. Et elle n'est jamais AJOUTÉE à une ligne qui ne la portait
//     pas : l'assainissement retire ce qu'aucune mesure ne confirme, il ne réécrit pas la table.
// Les autres clés de la table sont gardées telles quelles. Si plus rien ne reste de la ligne manuelle, l'accueil
// prend l'index, puis le département, exactement comme pour une commune hors table.
//
// UNE LIGNE NE VAUT QUE POUR LA COMMUNE QU'ELLE NOMME. 15 des 44 lignes portent le code INSEE d'une autre commune
// (« Sanary-sur-Mer » sur 83117, Saint-Paul-en-Forêt, dans les terres ; « La Crau » sur 83048, La Croix-Valmer).
// L'accueil cherchait d'abord par code : Saint-Paul-en-Forêt recevait `littoral_mediterranee`. Et la recherche par
// nom ignore le département : Saint-Jeannet (04) recevait la ligne de Saint-Jeannet (06). Une ligne n'est donc
// retenue que si elle NOMME la commune choisie, dans le MÊME DÉPARTEMENT (`ligneManuelleConcorde`) ; son code
// ne sert qu'à ce département (juste pour les 44 lignes), jamais comme code de la commune.
import { departementFromInsee } from "../insee-departement.ts";

/** Un nom de commune comparable : sans accents, casse ni ponctuation. */
export function normaliserNomCommune(nom: string): string {
  return nom.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Les deux noms désignent-ils la même commune ? Égalité des noms normalisés, ou nom court suivi d'un mot
 *  (« Chamonix » pour Chamonix-Mont-Blanc). Un nom absent ne concorde jamais. */
export function nomsConcordent(nomLigne: string | null | undefined, nomCommune: string | null | undefined): boolean {
  if (!nomLigne || !nomCommune) return false;
  const a = normaliserNomCommune(nomLigne);
  const b = normaliserNomCommune(nomCommune);
  return a.length > 0 && (a === b || b.startsWith(`${a} `));
}

/** La ligne manuelle vaut-elle pour la commune choisie ? Même nom (`nomsConcordent`) et même département que
 *  son code BAN. Sans code de la commune ou de la ligne, rien ne se vérifie : la ligne n'est pas retenue. */
export function ligneManuelleConcorde(
  ligne: { commune_name?: string | null; insee_code?: string | null } | null | undefined,
  commune: { name?: string | null; citycode?: string | null } | null | undefined,
): boolean {
  if (!ligne?.insee_code || !commune?.citycode || !nomsConcordent(ligne.commune_name, commune.name)) return false;
  const d = departementFromInsee(ligne.insee_code);
  return d != null && d === departementFromInsee(commune.citycode);
}

/** Les clés de la table manuelle qu'aucune mesure ne fonde par elle-même (voir ci-dessus). */
export const CLES_MANUELLES_SANS_MESURE: ReadonlySet<string> = new Set(["rural_peri_urbain", "periurbain_dependance_auto"]);

/** La seule de ces clés qu'une mesure de l'index peut confirmer. */
const CLE_VOITURE_MESUREE = "periurbain_dependance_auto";

export type OrigineCategories = "manuelle" | "index" | "departement" | "aucune";

export type CategoriesAccueil = {
  categories: string[];
  origine: OrigineCategories;
  /** Cadrage générique (aucune catégorie contextuelle) : même règle qu'avant FUT-185. */
  usedFallback: boolean;
};

const contextuelles = (cats: readonly string[]) => cats.length > 0 && !cats.every((c) => c === "all");

/** La ligne manuelle assainie, dans son ordre : clés sans mesure retirées, sauf la clé voiture que l'index confirme. */
export function assainirCategoriesManuelles(manuelles: readonly string[], index: readonly string[] | null | undefined): string[] {
  const confirmee = (k: string) => k === CLE_VOITURE_MESUREE && Boolean(index?.includes(k));
  return manuelles.filter((k) => !CLES_MANUELLES_SANS_MESURE.has(k) || confirmee(k));
}

/**
 * Les catégories de l'accueil pour une commune.
 * @param manuelles catégories de la ligne `communes_categorization`, ou `null` sans ligne
 * @param index catégories renvoyées par `/api/landing-signals` (index, ou repli département côté serveur), ou `null`
 * @param departement repli par département calculé localement (`deriveCategories`), si l'index n'a pas répondu
 */
export function categoriesAccueil(args: {
  manuelles: readonly string[] | null | undefined;
  index: readonly string[] | null | undefined;
  departement: readonly string[] | null | undefined;
}): CategoriesAccueil {
  const index = args.index && args.index.length > 0 ? args.index : null;
  if (args.manuelles && args.manuelles.length > 0) {
    const m = assainirCategoriesManuelles(args.manuelles, index);
    if (m.length > 0) return { categories: m, origine: "manuelle", usedFallback: false };
  }
  if (index) return { categories: [...index], origine: "index", usedFallback: !contextuelles(index) };
  if (args.departement && args.departement.length > 0) {
    return { categories: [...args.departement], origine: "departement", usedFallback: !contextuelles(args.departement) };
  }
  return { categories: ["all"], origine: "aucune", usedFallback: true };
}

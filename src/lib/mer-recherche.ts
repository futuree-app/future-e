// FUT-33 (phase 2B.1) : la vérité littorale telle que la RECHERCHE « Où vivre » la lit. Lib PURE.
//
// Trois questions, trois mesures, jamais mélangées :
//   - « près de la mer » (préférence graduée)        → centre de la commune → rivage marin (mer_centre_km) ;
//   - « à moins de N km de la mer » (nombre du lecteur) → même mesure, N appliqué tel quel (hard-constraints) ;
//   - « pas le littoral »                              → commune classée Mer (loi_effective), pas une distance.
// Le rivage marin comprend lagunes et bassins (D2) : jamais « plage », « océan », « baignade ».
// Aucune de ces mesures n'est une distance d'adresse : à l'adresse, ce sera point → rivage 5 m (non branché).

type CommuneMer = { mer_centre_km?: number | null; loi_effective?: string[] | null; mer_facade?: string | null };

// LA COURBE DE CLASSEMENT (FUT-33 2B.2, validée le 02/10/2026 ; étude : docs/audits/2026-10-02-fut33-phase2b2b-
// etude-courbe.md). Rationnelle, 100 / (1 + (d/20)²) : un plateau au bord de l'eau (≥ 94 jusqu'à 5 km, les
// communes riveraines se valent au grain du centre de commune), le point milieu (50) à 20 km, une longue traîne
// sans couperet. Elle CLASSE, et rien d'autre : aucun libellé (« en bord de mer », « proche du littoral »,
// « loin de la mer ») ne doit se déduire de ce score. Les libellés reposent sur des définitions explicites.
export const MER_POINT_MILIEU_KM = 20;
function courbeMer(d: number): number {
  return 100 / (1 + (d / MER_POINT_MILIEU_KM) ** 2);
}

/** Préférence « proximité de la mer ». Graduée, aucun seuil de rejet (D10). */
export function scoreProximiteMer(c: CommuneMer): number | null {
  return c.mer_centre_km == null ? null : courbeMer(c.mer_centre_km);
}

/** Préférence « éloignement de la mer » (« loin de la mer », « plutôt dans les terres », sans nombre) : l'exact
 *  inverse de la même courbe. 0 au rivage, 50 à 20 km, 80 à 40 km. Elle oriente, elle n'écarte jamais. */
export function scoreEloignementMer(c: CommuneMer): number | null {
  return c.mer_centre_km == null ? null : 100 - courbeMer(c.mer_centre_km);
}

/** Bonus d'exploration de « il nous faut la mer » sans nombre : la MÊME courbe, à l'échelle du bonus. L'ancien
 *  rayon de 30 km (une seconde convention, cachée) a disparu. Classement seulement. */
export function bonusMer(c: CommuneMer, bonusMax: number): number {
  return c.mer_centre_km == null ? 0 : (bonusMax * courbeMer(c.mer_centre_km)) / 100;
}

/** Commune littorale au sens de « pas le littoral » (D4) : classée Mer, héritage PLM compris. */
export function communeLittoraleMer(c: CommuneMer): boolean {
  return (c.loi_effective ?? []).includes("Mer");
}

/** D5 : une ville de référence suggère « proximité du littoral » si elle est classée Mer ET centre ≤ 5 km. */
export const ANCRE_LITTORALE_CENTRE_MAX_KM = 5;
export function ancreLittorale(c: CommuneMer): boolean {
  return communeLittoraleMer(c) && c.mer_centre_km != null && c.mer_centre_km <= ANCRE_LITTORALE_CENTRE_MAX_KM;
}

// LA FAÇADE, TRADUITE POUR LES TEXTES (FUT-33, 2B.2 D). L'index stocke la valeur SOURCE (planification maritime
// DGAMPA-Shom : MEMN, NAMO, SA, MED), jamais un mot du lecteur. Cette table est une CONVENTION ÉDITORIALE
// versionnée, qui choisit des angles de texte (les questions de l'accueil) ; elle ne prétend pas que la façade
// officielle « est » l'Atlantique. MEMN (Manche Est-mer du Nord) n'a pas de catégorie d'orientation : la commune
// reste « littorale », sans plus.
export const FACADE_EDITORIALE = {
  version: "facade-editoriale-v1",
  categories: { NAMO: "littoral_atlantique", SA: "littoral_atlantique", MED: "littoral_mediterranee" } as Record<string, string>,
} as const;

export function categorieDeFacade(c: CommuneMer): string | null {
  return c.mer_facade ? FACADE_EDITORIALE.categories[c.mer_facade] ?? null : null;
}

// LE REPÈRE DE PRÉSENTATION « près du rivage » (validé le 02/10/2026) : 8 km au plus du point de référence.
// Il ne sert qu'à choisir un texte (une promesse « au bord de l'eau ») ; il ne décide rien et ne s'affiche
// jamais sans la distance elle-même.
export const REPERE_PRES_DU_RIVAGE_KM = 8;
export function presDuRivage(c: CommuneMer): boolean {
  return c.mer_centre_km != null && c.mer_centre_km <= REPERE_PRES_DU_RIVAGE_KM;
}

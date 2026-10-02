// FUT-33 (phase 2B.1) : la vérité littorale telle que la RECHERCHE « Où vivre » la lit. Lib PURE.
//
// Trois questions, trois mesures, jamais mélangées :
//   - « près de la mer » (préférence graduée)        → centre de la commune → rivage marin (mer_centre_km) ;
//   - « à moins de N km de la mer » (nombre du lecteur) → même mesure, N appliqué tel quel (hard-constraints) ;
//   - « pas le littoral »                              → commune classée Mer (loi_effective), pas une distance.
// Le rivage marin comprend lagunes et bassins (D2) : jamais « plage », « océan », « baignade ».
// Aucune de ces mesures n'est une distance d'adresse : à l'adresse, ce sera point → rivage 5 m (non branché).

type CommuneMer = { mer_centre_km?: number | null; loi_effective?: string[] | null };

/** Préférence « proximité de la mer » : 100 au rivage, 0 à 150 km, linéaire. Aucun seuil de rejet (D10). */
export function scoreProximiteMer(c: CommuneMer): number | null {
  return c.mer_centre_km == null ? null : Math.max(0, Math.min(100, 100 - c.mer_centre_km / 1.5));
}

/** Bonus d'exploration « la mer » sans nombre : rampe vers 0 à `rayonKm`, classement seulement. */
export function bonusMer(c: CommuneMer, rayonKm: number, bonusMax: number): number {
  return c.mer_centre_km == null ? 0 : bonusMax * Math.max(0, 1 - c.mer_centre_km / rayonKm);
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

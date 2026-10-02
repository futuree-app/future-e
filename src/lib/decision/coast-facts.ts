// LA CONVENTION DE PROXIMITÉ MER, versionnée, et son classifieur. PURS.
//
// La distance à la côte mesure DIRECTEMENT la qualité recherchée (contrairement à une ligne de bus, cf.
// lot 2a) : la règle est donc SYMÉTRIQUE. Proche -> satisfied, loin -> mismatch, entre-deux -> neutral,
// donnée absente/corrompue -> uncertain. Les seuils NE réutilisent PAS la formule de tri du comparateur
// (courbe de mer-recherche.ts) : celle-ci sert au classement, pas au dossier.
//
// v2 (FUT-33, 02/10/2026) : LA MESURE CHANGE, PAS LES SEUILS. La v1 mesurait la distance à une liste de villes
// côtières (un proxy qui mettait Lannion à 58 km de la mer) ; la v2 mesure la distance du point de référence
// de la commune au RIVAGE MARIN (Limite terre-mer Shom-IGN, coupée aux limites transversales de la mer,
// lagunes comprises). Les seuils 15 / 100 km, calibrés sur l'imprécision du proxy, sont conservés tels quels :
// les resserrer est une convention à discuter, pas une conséquence de la nouvelle donnée.
// Cette convention ne se confond PAS avec la courbe de classement de la recherche (mer-recherche.ts).
export const COAST_PROXIMITY_CONVENTION = {
  id: "coast-proximity-v2",
  satisfiedMaxKm: 15,
  mismatchMinKm: 100,
  measure: "distance_point_reference_commune_rivage_marin_limtm",
} as const;

export function classifyCoastDistance(
  distanceKm: number | null,
): "satisfied" | "neutral" | "mismatch" | "uncertain" {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return "uncertain";
  if (distanceKm <= COAST_PROXIMITY_CONVENTION.satisfiedMaxKm) return "satisfied";
  if (distanceKm >= COAST_PROXIMITY_CONVENTION.mismatchMinKm) return "mismatch";
  return "neutral";
}

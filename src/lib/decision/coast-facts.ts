// LA CONVENTION DE PROXIMITÉ MER, versionnée, et son classifieur. PURS.
//
// La distance à la côte mesure DIRECTEMENT la qualité recherchée (contrairement à une ligne de bus, cf.
// lot 2a) : la règle est donc SYMÉTRIQUE. Proche -> satisfied, loin -> mismatch, entre-deux -> neutral,
// donnée absente/corrompue -> uncertain. Les seuils NE réutilisent PAS la formule de tri du comparateur
// (100 - distance / 1.5) : celle-ci sert au classement, pas au dossier.
//
// Seuils calibrés sur l'imprécision de la mesure V1 (distance à une LISTE DE VILLES CÔTIÈRES, pas au trait
// de côte) : 15 km (pas 10) pour ne pas perdre une commune littorale éloignée d'une ville listée ; 100 km
// (pas 80) pour un éloignement robuste malgré le proxy. Une v2 au trait de côte IGN pourra rapprocher le
// seuil de mismatch de 80 km.
export const COAST_PROXIMITY_CONVENTION = {
  id: "coast-proximity-v1",
  satisfiedMaxKm: 15,
  mismatchMinKm: 100,
  measure: "distance_haversine_to_reference_coastal_places",
} as const;

export function classifyCoastDistance(
  distanceKm: number | null,
): "satisfied" | "neutral" | "mismatch" | "uncertain" {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return "uncertain";
  if (distanceKm <= COAST_PROXIMITY_CONVENTION.satisfiedMaxKm) return "satisfied";
  if (distanceKm >= COAST_PROXIMITY_CONVENTION.mismatchMinKm) return "mismatch";
  return "neutral";
}

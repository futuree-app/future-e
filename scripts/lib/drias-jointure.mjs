// LA JOINTURE COMMUNE → POINT DE GRILLE DRIAS-TRACC, ET SES DEUX REFUS (hotfix FUT-104, 16/10/2026).
//
// La grille DRIAS-TRACC (17 couples de modèles EURO-CORDEX, maille SAFRAN ~8 km) ne couvre que l'Hexagone et la
// Corse. Sans garde-fou, le point « le plus proche » d'une commune ultramarine était cherché sur cette grille, en
// degrés bruts et sans limite : la Guadeloupe recevait les valeurs du Conquet (Finistère), La Réunion celles du sud
// de la Corse, la Guyane celles de la côte basque. 218 lignes 97xxx/98xxx de data/data_climat.json en viennent.
//
// RÈGLE : AUCUNE COMMUNE NE REÇOIT UNE VALEUR D'UNE GRILLE QUI NE COUVRE PAS SON TERRITOIRE.
//   1. Les codes ultramarins (97xxx, 98xxx) sont exclus AVANT la jointure : la grille ne les couvre pas, quelle que
//      soit la distance.
//   2. Une commune dont le point le plus proche est à plus de DISTANCE_MAX_DEG fait ÉCHOUER la construction, au lieu
//      de produire une ligne : une commune hors grille ne doit jamais recevoir la valeur d'un point lointain.

/** Codes du COG ultramarins : DROM, COM, Nouvelle-Calédonie, TAAF, Clipperton. */
export const EST_OUTREMER = (insee) => /^9[78]/.test(String(insee).padStart(5, "0"));

// Mesuré le 16/10/2026 sur les 34 788 communes métropolitaines et les 8 981 points de la grille réelle : médiane
// 0,035°, 99e centile 0,060°, maximum 0,155° (île de Sein ; Ouessant 0,147°, Granville 0,100°). Le seuil laisse une
// marge de 1,6 au-dessus du maximum, et reste 200 fois plus court que l'écart à la commune ultramarine la plus proche
// de la grille (Saint-Pierre, 975 : 51°).
export const DISTANCE_MAX_MESUREE_DEG = 0.1548;
export const DISTANCE_MAX_DEG = 0.25;

function distanceCarree(aLat, aLon, bLat, bLon) {
  const dLat = aLat - bLat;
  const dLon = aLon - bLon;
  return dLat * dLat + dLon * dLon;
}

/**
 * Associe chaque commune couverte à son point de grille le plus proche (distance en degrés bruts, comme
 * historiquement : on ne change pas l'association des communes métropolitaines).
 *
 * @param {{insee_code: string, commune_name: string, latitude: number, longitude: number}[]} communes
 * @param {{pointId: string, latitude: number, longitude: number}[]} points
 * @returns {{ associees: Array<object>, exclues: string[] }} les communes associées (avec `nearestPointId` et
 *   `nearestDistanceDeg`), et les codes ultramarins exclus.
 * @throws si une commune non ultramarine n'a aucun point à moins de DISTANCE_MAX_DEG.
 */
export function joindreAuPointLePlusProche(communes, points, distanceMaxDeg = DISTANCE_MAX_DEG) {
  const exclues = [];
  const associees = [];
  for (const commune of communes) {
    if (EST_OUTREMER(commune.insee_code)) {
      exclues.push(commune.insee_code);
      continue;
    }
    let nearestPointId = null;
    let nearest = Number.POSITIVE_INFINITY;
    for (const point of points) {
      const d = distanceCarree(commune.latitude, commune.longitude, point.latitude, point.longitude);
      if (d < nearest) {
        nearest = d;
        nearestPointId = point.pointId;
      }
    }
    const distanceDeg = Math.sqrt(nearest);
    if (!(distanceDeg <= distanceMaxDeg)) {
      throw new Error(
        `${commune.insee_code} ${commune.commune_name} : point DRIAS le plus proche à ${distanceDeg.toFixed(3)}°, ` +
          `au-delà de ${distanceMaxDeg}°. La grille ne couvre pas cette commune : aucune valeur ne lui est attribuée.`,
      );
    }
    associees.push({ ...commune, nearestPointId, nearestDistanceDeg: distanceDeg });
  }
  return { associees, exclues };
}

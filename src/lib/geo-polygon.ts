// LE PRÉDICAT GÉOMÉTRIQUE. PUR : aucune dépendance, aucun réseau.
//
// Il rend QUATRE états, pas deux. Une isochrone est une géométrie SIMPLIFIÉE : un point posé sur la
// frontière change de côté pour quelques mètres d'arrondi. Pour une condition NON NÉGOCIABLE, une zone
// grise assumée vaut mieux qu'une incompatibilité décidée par la simplification. Et une géométrie qu'on
// n'a pas su lire (« unusable ») n'est PAS une commune trop loin (« outside ») : les confondre, c'est
// reconstruire le mensonge que tout ce chantier démonte.
export type PolygonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type PointPosition = "inside" | "outside" | "border" | "unusable";

const M_PER_DEG_LAT = 111_320;

// GeoJSON écrit [lon, lat]. Notre code parle (lat, lon). L'inversion est l'erreur classique de ce fichier,
// et elle est SILENCIEUSE : un point de Toulouse lu à l'envers atterrit en Somalie, et rend un « outside »
// parfaitement crédible. Les tests la couvrent dans les deux sens.
//
// Un anneau doit être lisible ENTIÈREMENT : une coordonnée non finie ou hors bornes terrestres n'est pas un
// sommet qu'on peut sauter, c'est le signe que la géométrie n'est pas celle qu'on croit.
function ringIsValid(ring: unknown): ring is number[][] {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  return ring.every((p) => {
    if (!Array.isArray(p) || p.length < 2) return false;
    const [lon, lat] = p as [unknown, unknown];
    return (
      typeof lon === "number" && typeof lat === "number" &&
      Number.isFinite(lon) && Number.isFinite(lat) &&
      lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
    );
  });
}

// Ray casting sur un anneau, en [lon, lat].
function inRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]! as [number, number];
    const [xj, yj] = ring[j]! as [number, number];
    const intersecte = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersecte) inside = !inside;
  }
  return inside;
}

// Distance (mètres) du point au segment [a, b], en projection locale : la longitude est mise à l'échelle
// par cos(lat). À l'échelle d'une isochrone (quelques dizaines de km) et à nos latitudes, c'est exact au
// mètre près, et sans dépendance géodésique.
function distToSegmentM(lat: number, lon: number, a: number[], b: number[]): number {
  const k = Math.cos((lat * Math.PI) / 180);
  const px = lon * k * M_PER_DEG_LAT;
  const py = lat * M_PER_DEG_LAT;
  const ax = a[0]! * k * M_PER_DEG_LAT;
  const ay = a[1]! * M_PER_DEG_LAT;
  const bx = b[0]! * k * M_PER_DEG_LAT;
  const by = b[1]! * M_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distToRingM(lat: number, lon: number, ring: number[][]): number {
  let min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const d = distToSegmentM(lat, lon, ring[j]!, ring[i]!);
    if (d < min) min = d;
  }
  return min;
}

export function pointInPolygon(
  lat: number,
  lon: number,
  geometry: PolygonGeometry | null | undefined,
  toleranceMeters: number,
): PointPosition {
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return "unusable";
  const polys: unknown[] =
    geometry.type === "Polygon" ? [geometry.coordinates] : (geometry.coordinates as unknown[]);
  if (!Array.isArray(polys) || polys.length === 0) return "unusable";

  let dedans = false;
  let distMin = Infinity;

  for (const poly of polys) {
    // TOUT le polygone doit être lisible, TROUS COMPRIS. Un trou illisible qu'on « sauterait » ferait
    // déclarer DEDANS un point que la géométrie excluait peut-être.
    if (!Array.isArray(poly) || poly.length === 0 || !poly.every(ringIsValid)) return "unusable";
    const rings = poly as number[][][];
    const enveloppe = rings[0]!;
    distMin = Math.min(distMin, distToRingM(lat, lon, enveloppe));
    if (!inRing(lat, lon, enveloppe)) continue;

    // Un point dans un TROU est dehors : l'isochrone ne le couvre pas.
    let dansUnTrou = false;
    for (const trou of rings.slice(1)) {
      distMin = Math.min(distMin, distToRingM(lat, lon, trou));
      if (inRing(lat, lon, trou)) dansUnTrou = true;
    }
    if (!dansUnTrou) dedans = true;
  }

  // LA BANDE PRIME, des deux côtés de la frontière : à quelques mètres près, le verdict serait décidé par
  // la simplification de la géométrie, pas par le territoire.
  if (toleranceMeters > 0 && distMin <= toleranceMeters) return "border";
  return dedans ? "inside" : "outside";
}

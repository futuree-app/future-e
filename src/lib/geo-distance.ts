export type LngLat = { lat: number; lon: number };

const R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: LngLat, b: LngLat): number {
  const dphi = toRad(b.lat - a.lat);
  const dlmb = toRad(b.lon - a.lon);
  const s =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dlmb / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Projection équirectangulaire locale autour de `origin` -> mètres (exacte à ~qq km).
function toXY(origin: LngLat, p: LngLat): { x: number; y: number } {
  const x = toRad(p.lon - origin.lon) * Math.cos(toRad(origin.lat)) * R;
  const y = toRad(p.lat - origin.lat) * R;
  return { x, y };
}

function segDistM(origin: LngLat, a: LngLat, b: LngLat): number {
  const P = { x: 0, y: 0 }; // origin projeté sur lui-même
  const A = toXY(origin, a);
  const B = toXY(origin, b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx;
  const cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

export function distancePointToPolylineM(p: LngLat, line: LngLat[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversineM(p, line[0]);
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    min = Math.min(min, segDistM(p, line[i], line[i + 1]));
  }
  return min;
}

export function pointInRing(p: LngLat, ring: LngLat[]): boolean {
  // Ray casting sur coordonnées projetées autour de p (p = origine -> (0,0)).
  const pts = ring.map((v) => toXY(p, v));
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i].y, xi = pts[i].x, yj = pts[j].y, xj = pts[j].x;
    const intersect =
      yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * L'AIRE D'UN ANNEAU, EN MÈTRES CARRÉS (formule du lacet, sur la projection locale).
 *
 * Exacte à quelques pour mille sur les tailles qui nous intéressent (un parc, un bois de
 * quartier), ce qui suffit très largement à séparer un gazon de quatre cents mètres carrés d'un
 * jardin public. Rend 0 pour moins de trois points : une ligne n'a pas d'aire, et l'appelant doit
 * traiter ce cas plutôt que de lire un zéro comme une petite surface.
 */
export function ringAreaM2(ring: LngLat[]): number {
  if (ring.length < 3) return 0;
  const origin = ring[0];
  const pts = ring.map((q) => toXY(origin, q));
  let somme = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    somme += a.x * b.y - b.x * a.y;
  }
  return Math.abs(somme) / 2;
}

/**
 * L'ANNEAU EST-IL FERMÉ ? Par les COORDONNÉES de ses extrémités, jamais par l'identité des objets.
 *
 * L'ancienne comparaison `ring[0] === ring[ring.length - 1]` était toujours fausse : le parseur
 * reconstruit chaque sommet, donc le premier et le dernier sont deux objets distincts même quand
 * ils désignent le même point. Sans effet sur une distance (le segment ajouté était dégénéré), mais
 * l'assemblage des relations OSM repose sur ce test : là, une fausse réponse fabriquerait ou
 * refuserait un anneau à tort.
 */
export function isClosedRing(ring: LngLat[]): boolean {
  if (ring.length < 2) return false;
  const a = ring[0];
  const b = ring[ring.length - 1];
  return a.lat === b.lat && a.lon === b.lon;
}

/** La distance au CONTOUR seul, que le point soit dedans ou dehors. */
function distanceAuContourM(p: LngLat, ring: LngLat[]): number {
  return distancePointToPolylineM(p, isClosedRing(ring) ? ring : [...ring, ring[0]]);
}

export function distancePointToPolygonM(p: LngLat, ring: LngLat[]): number {
  if (ring.length < 3) return distancePointToPolylineM(p, ring);
  if (pointInRing(p, ring)) return 0;
  return distanceAuContourM(p, ring);
}

/**
 * UN MORCEAU DE MULTIPOLYGONE : un anneau extérieur et les trous qu'il contient.
 *
 * Les trous sont RATTACHÉS à leur anneau extérieur, pas mis en commun. Une clairière dans la forêt
 * est un trou de la forêt ; un bosquet au milieu de cette clairière, cartographié comme un second
 * anneau extérieur, est de nouveau de la forêt. Seul le rattachement permet de répondre juste dans
 * les deux cas.
 */
export type PolygoneAvecTrous = { outer: LngLat[]; inners: LngLat[][] };

/** Le point est-il DANS la surface : dans un extérieur, et dans aucun des trous de cet extérieur ? */
export function pointInMultiPolygon(p: LngLat, polygones: PolygoneAvecTrous[]): boolean {
  return polygones.some((m) => pointInRing(p, m.outer) && !m.inners.some((t) => pointInRing(p, t)));
}

/**
 * LA DISTANCE D'UN POINT À UN MULTIPOLYGONE : 0 s'il est dans la surface, sinon la distance au
 * contour le plus proche, extérieur OU trou. Un point au milieu d'une clairière est à la distance
 * du bord de la clairière, pas à zéro, et pas à la distance du bord extérieur de la forêt.
 *
 * Jamais de centroïde ni de sommet de substitution : le calcul porte sur les segments.
 */
export function distancePointToMultiPolygonM(p: LngLat, polygones: PolygoneAvecTrous[]): number {
  if (polygones.length === 0) return Infinity;
  if (pointInMultiPolygon(p, polygones)) return 0;
  let min = Infinity;
  for (const m of polygones) {
    min = Math.min(min, distanceAuContourM(p, m.outer));
    for (const t of m.inners) min = Math.min(min, distanceAuContourM(p, t));
  }
  return min;
}

/** La surface d'un multipolygone : la somme des extérieurs, moins la somme des trous. */
export function multiPolygonAreaM2(polygones: PolygoneAvecTrous[]): number {
  let somme = 0;
  for (const m of polygones) {
    somme += ringAreaM2(m.outer);
    for (const t of m.inners) somme -= ringAreaM2(t);
  }
  return Math.max(0, somme);
}


/**
 * LA SEULE CONVERSION MÈTRES -> DEGRÉS DU MODULE. Toute fenêtre géographique passe par ici.
 *
 * ELLE EST ISOLÉE PARCE QUE LA RECOPIER EST LE PIÈGE. Un degré de LATITUDE vaut ~111 km partout ;
 * un degré de LONGITUDE vaut `111 km × cos(lat)`, donc moins dès qu'on quitte l'équateur. Appliquer
 * `rayon / 111 000` aux DEUX axes rétrécit la fenêtre de 27 à 37 % en est-ouest aux latitudes
 * françaises (Lille : −37 %). L'erreur a été commise deux fois, à deux ans d'écart, par deux
 * appelants qui ne se connaissaient pas : `cartofriches`, puis `getTileGeoms` dans `logement-osm.ts`.
 * Les deux fois elle n'a levé aucune erreur ni cassé aucun test : juste des objets silencieusement
 * absents d'un résultat qui a l'air complet.
 *
 * `latRef` est la latitude à laquelle la conversion est faite. Pour une fenêtre autour d'un point,
 * c'est celle du point ; pour l'élargissement d'une emprise, c'est son bord le plus éloigné de
 * l'équateur (cf. `expandBBoxM`).
 */
export function metersToDegrees(latRef: number, radiusM: number): { dLat: number; dLon: number } {
  // cos(lat) borné : près des pôles la division exploserait au lieu de rendre une fenêtre utilisable.
  // Les latitudes françaises (42° à 51°) sont très loin de cette borne.
  return {
    dLat: radiusM / 111_000,
    dLon: radiusM / (111_000 * Math.max(0.1, Math.cos(toRad(latRef)))),
  };
}

/**
 * LA FENÊTRE QUI CONTIENT UN DISQUE, pour interroger une API qui ne sait filtrer que par rectangle.
 *
 * Elle rend un MAJORANT : elle contient le disque, avec des coins en trop. L'appelant doit donc
 * toujours filtrer les résultats par distance réelle. Le rectangle sélectionne, il ne conclut pas.
 */
export function bboxAround(p: LngLat, radiusM: number): { minLon: number; minLat: number; maxLon: number; maxLat: number } {
  const { dLat, dLon } = metersToDegrees(p.lat, radiusM);
  return { minLon: p.lon - dLon, minLat: p.lat - dLat, maxLon: p.lon + dLon, maxLat: p.lat + dLat };
}

/**
 * ÉLARGIT UNE EMPRISE EXISTANTE d'au moins `radiusM` dans toutes les directions.
 *
 * `bboxAround` construit une fenêtre autour d'un POINT ; celle-ci élargit une CELLULE, dont tous les
 * points doivent rester couverts. La conversion se fait donc à la latitude du bord le plus éloigné
 * de l'équateur, là où un degré de longitude est le plus court : le majorant vaut alors pour la
 * cellule entière. Prendre la latitude médiane sous-couvrirait le bord polaire, d'un cheveu sur une
 * cellule de 0,005° mais d'une marge réelle sur une cellule de 0,18°.
 *
 * Comme `bboxAround`, elle rend un MAJORANT : l'appelant filtre toujours par distance réelle.
 */
export function expandBBoxM(
  b: { s: number; w: number; n: number; e: number },
  radiusM: number,
): { s: number; w: number; n: number; e: number } {
  const latLaPlusEloignee = Math.abs(b.n) >= Math.abs(b.s) ? b.n : b.s;
  const { dLat, dLon } = metersToDegrees(latLaPlusEloignee, radiusM);
  return { s: b.s - dLat, w: b.w - dLon, n: b.n + dLat, e: b.e + dLon };
}

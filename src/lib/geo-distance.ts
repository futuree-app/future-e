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

function pointInRing(p: LngLat, ring: LngLat[]): boolean {
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

export function distancePointToPolygonM(p: LngLat, ring: LngLat[]): number {
  if (ring.length < 3) return distancePointToPolylineM(p, ring);
  if (pointInRing(p, ring)) return 0;
  const closed = ring[0] === ring[ring.length - 1] ? ring : [...ring, ring[0]];
  return distancePointToPolylineM(p, closed);
}

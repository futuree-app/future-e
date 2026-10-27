// LA GÉOMÉTRIE D'UNE PARCELLE FACE À UNE ZONE (FUT-81). Lib PURE, sans dépendance, testée sous `node --test`.
//
// ── POURQUOI UN CALCUL EXACT (revue indépendante du 27/10/2026) ──────────────────────────────
// La première version estimait la part d'une zone par une grille de 60 × 60 points. Une bande de 0,5 m
// de large sur 100 m (50 m², un emplacement réservé de voirie réel) passait ENTRE les points : la grille
// rendait 0, et la prescription disparaissait. Densifier la grille n'y change rien : il existe toujours
// une bande plus étroite que le pas. Une estimation nulle ne prouve pas une absence d'intersection.
//
// ── LA MÉTHODE ───────────────────────────────────────────────────────────────────────────────
// Aire(A ∩ B) se calcule sur le BORD de A ∩ B (formule de Green) : c'est la part du bord de A qui est
// dans B, plus la part du bord de B qui est dans A. Chaque arête est découpée à ses intersections avec
// l'autre polygone ; chaque morceau est classé par son milieu (dedans, dehors, sur le bord). Un bord
// COMMUN aux deux (limite partagée) n'est compté qu'une fois, et seulement si les deux régions sont du
// même côté. Exact pour les polygones concaves, à trous et multipolygones.
//
// Les coordonnées sont projetées en mètres par une projection équirectangulaire centrée sur la parcelle.
// Elle est AFFINE : les segments restent des segments et l'intérieur reste l'intérieur ; seule l'échelle
// des aires est approchée (moins de 0,5 % à l'échelle d'une parcelle).
//
// ── LES CONTACTS ─────────────────────────────────────────────────────────────────────────────
// « Sur le bord » se décide à une tolérance fixe (`TOLERANCE_M`), la même dans toutes les directions :
// un point posé sur la limite ouest et le même sur la limite est reçoivent la même réponse.

/** Une géométrie GeoJSON telle que la rendent l'API Carto et le cadastre. */
export type Geometrie = { type: string; coordinates: unknown } | null | undefined;

type Pt = [number, number];
/** Une région : des anneaux fermés, orientés extérieur anti-horaire, trous horaires (la région est à gauche). */
export type Region = Pt[][];

/** En deçà de cette distance (en mètres), un point est SUR une limite. Bien plus fin que tout tracé publié. */
export const TOLERANCE_M = 0.01;

export type Projection = { lon0: number; lat0: number; kx: number; ky: number };

export function projectionAutour(lon0: number, lat0: number): Projection {
  return { lon0, lat0, kx: 111_320 * Math.cos((lat0 * Math.PI) / 180), ky: 110_574 };
}

const fini = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function position(v: unknown, p: Projection): Pt | null {
  if (!Array.isArray(v) || v.length < 2 || !fini(v[0]) || !fini(v[1])) return null;
  return [(v[0] - p.lon0) * p.kx, (v[1] - p.lat0) * p.ky];
}

function aireSignee(r: Pt[]): number {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return s / 2;
}

/** Un anneau GeoJSON lu, fermé, sans doublon consécutif ; `null` s'il est mal formé ou d'aire nulle. */
function anneau(v: unknown, p: Projection): Pt[] | null {
  if (!Array.isArray(v)) return null;
  const pts: Pt[] = [];
  for (const c of v) {
    const q = position(c, p);
    if (!q) return null;
    const der = pts[pts.length - 1];
    if (!der || der[0] !== q[0] || der[1] !== q[1]) pts.push(q);
  }
  if (pts.length > 1 && (pts[0][0] !== pts[pts.length - 1][0] || pts[0][1] !== pts[pts.length - 1][1])) pts.push(pts[0]);
  if (pts.length < 4 || Math.abs(aireSignee(pts)) < 1e-6) return null;
  return pts;
}

/**
 * La région d'un Polygon ou d'un MultiPolygon, orientée. `null` si la géométrie est absente, vide ou mal
 * formée : on ne mesure JAMAIS à partir d'une géométrie qu'on n'a pas pu lire entièrement.
 */
export function regionDe(g: Geometrie, p: Projection): Region | null {
  if (!g || typeof g !== "object") return null;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : null;
  if (!Array.isArray(polys) || polys.length === 0) return null;
  const out: Region = [];
  for (const poly of polys) {
    if (!Array.isArray(poly) || poly.length === 0) return null;
    for (let i = 0; i < poly.length; i++) {
      const r = anneau(poly[i], p);
      if (!r) return null;
      const exterieur = i === 0;
      const antiHoraire = aireSignee(r) > 0;
      out.push(exterieur === antiHoraire ? r : [...r].reverse());
    }
  }
  return out;
}

export function aireRegion(r: Region): number {
  return r.reduce((s, a) => s + aireSignee(a), 0);
}

/** Lignes ou points d'une géométrie GeoJSON, projetés ; `null` si mal formés. */
export function lignesDe(g: Geometrie, p: Projection): Pt[][] | null {
  if (!g || typeof g !== "object") return null;
  const brut = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : null;
  if (!Array.isArray(brut) || brut.length === 0) return null;
  const out: Pt[][] = [];
  for (const l of brut) {
    if (!Array.isArray(l) || l.length < 2) return null;
    const pts = l.map((c) => position(c, p));
    if (pts.some((q) => !q)) return null;
    out.push(pts as Pt[]);
  }
  return out;
}

export function pointsDe(g: Geometrie, p: Projection): Pt[] | null {
  if (!g || typeof g !== "object") return null;
  const brut = g.type === "Point" ? [g.coordinates] : g.type === "MultiPoint" ? g.coordinates : null;
  if (!Array.isArray(brut) || brut.length === 0) return null;
  const pts = brut.map((c) => position(c, p));
  return pts.some((q) => !q) ? null : (pts as Pt[]);
}

// ── Primitives ───────────────────────────────────────────────────────────────────────────────

const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;

function distanceSegment(m: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((m[0] - a[0]) * dx + (m[1] - a[1]) * dy) / l2));
  return Math.hypot(m[0] - (a[0] + t * dx), m[1] - (a[1] + t * dy));
}

type Classe = { lieu: "dedans" | "dehors" } | { lieu: "bord"; dx: number; dy: number };

/** Dedans, dehors, ou sur le bord (avec la direction de l'arête touchée). Symétrique par construction. */
export function classer(m: Pt, r: Region, tol = TOLERANCE_M): Classe {
  for (const a of r) {
    for (let i = 0; i + 1 < a.length; i++) {
      if (distanceSegment(m, a[i], a[i + 1]) <= tol) return { lieu: "bord", dx: a[i + 1][0] - a[i][0], dy: a[i + 1][1] - a[i][1] };
    }
  }
  let dedans = false;
  for (const a of r) {
    for (let i = 0; i + 1 < a.length; i++) {
      const [xi, yi] = a[i];
      const [xj, yj] = a[i + 1];
      if ((yi > m[1]) !== (yj > m[1]) && m[0] < ((xj - xi) * (m[1] - yi)) / (yj - yi) + xi) dedans = !dedans;
    }
  }
  return { lieu: dedans ? "dedans" : "dehors" };
}

function boite(r: Region | Pt[][]): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const a of r) for (const [x, y] of a) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}

/** Les paramètres (0 < t < 1) où le segment a→b croise ou rejoint le bord de `r`, bords colinéaires compris. */
function coupures(a: Pt, b: Pt, r: Region): number[] {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const lr = Math.hypot(rx, ry);
  const ts: number[] = [];
  const [bx0, by0, bx1, by1] = [Math.min(a[0], b[0]) - TOLERANCE_M, Math.min(a[1], b[1]) - TOLERANCE_M, Math.max(a[0], b[0]) + TOLERANCE_M, Math.max(a[1], b[1]) + TOLERANCE_M];
  for (const ann of r) {
    for (let i = 0; i + 1 < ann.length; i++) {
      const c = ann[i];
      const d = ann[i + 1];
      if (Math.max(c[0], d[0]) < bx0 || Math.min(c[0], d[0]) > bx1 || Math.max(c[1], d[1]) < by0 || Math.min(c[1], d[1]) > by1) continue;
      const sx = d[0] - c[0];
      const sy = d[1] - c[1];
      const ls = Math.hypot(sx, sy);
      const den = cross(rx, ry, sx, sy);
      const qx = c[0] - a[0];
      const qy = c[1] - a[1];
      if (Math.abs(den) > 1e-12 * lr * ls) {
        const t = cross(qx, qy, sx, sy) / den;
        const u = cross(qx, qy, rx, ry) / den;
        if (u >= -1e-9 && u <= 1 + 1e-9 && t > 0 && t < 1) ts.push(t);
      } else if (Math.abs(cross(qx, qy, rx, ry)) <= TOLERANCE_M * lr) {
        // Colinéaires : le recouvrement commence ou finit aux projections de c et d.
        for (const e of [c, d]) {
          const t = ((e[0] - a[0]) * rx + (e[1] - a[1]) * ry) / (lr * lr);
          if (t > 0 && t < 1) ts.push(t);
        }
      }
      // Un sommet de `r` posé sur le segment, sans le croiser, le découpe aussi.
      if (distanceSegment(c, a, b) <= TOLERANCE_M) {
        const t = (qx * rx + qy * ry) / (lr * lr);
        if (t > 0 && t < 1) ts.push(t);
      }
    }
  }
  return ts;
}

/** Parcourt les morceaux de chaque arête de `p` et rend la part de l'intégrale de Green qui est dans `q`. */
function contribution(p: Region, q: Region, bordCommun: boolean): number {
  const [qx0, qy0, qx1, qy1] = boite(q);
  let s = 0;
  for (const ann of p) {
    for (let i = 0; i + 1 < ann.length; i++) {
      const a = ann[i];
      const b = ann[i + 1];
      // Une arête hors de la boîte de q n'a aucun morceau dedans.
      if (Math.max(a[0], b[0]) < qx0 - TOLERANCE_M || Math.min(a[0], b[0]) > qx1 + TOLERANCE_M
        || Math.max(a[1], b[1]) < qy0 - TOLERANCE_M || Math.min(a[1], b[1]) > qy1 + TOLERANCE_M) continue;
      const ts = [0, ...coupures(a, b, q), 1].sort((x, y) => x - y);
      const rx = b[0] - a[0];
      const ry = b[1] - a[1];
      for (let k = 0; k + 1 < ts.length; k++) {
        if (ts[k + 1] - ts[k] < 1e-12) continue;
        const pa: Pt = [a[0] + rx * ts[k], a[1] + ry * ts[k]];
        const pb: Pt = [a[0] + rx * ts[k + 1], a[1] + ry * ts[k + 1]];
        const c = classer([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], q);
        const compte = c.lieu === "dedans" || (c.lieu === "bord" && bordCommun && rx * c.dx + ry * c.dy > 0);
        if (compte) s += (pa[0] * pb[1] - pb[0] * pa[1]) / 2;
      }
    }
  }
  return s;
}

/** L'aire exacte (m²) de A ∩ B. Un simple contact de limites vaut 0. */
export function aireIntersection(a: Region, b: Region): number {
  const s = contribution(a, b, true) + contribution(b, a, false);
  return Math.max(0, s);
}

/** Longueur (m) d'une ligne strictement à l'intérieur de la région, et si elle en longe la limite. */
export function longueurDans(lignes: Pt[][], r: Region): { dedans: number; surLeBord: boolean } {
  let dedans = 0;
  let surLeBord = false;
  for (const l of lignes) {
    for (let i = 0; i + 1 < l.length; i++) {
      const a = l[i];
      const b = l[i + 1];
      const ts = [0, ...coupures(a, b, r), 1].sort((x, y) => x - y);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let k = 0; k + 1 < ts.length; k++) {
        if (ts[k + 1] - ts[k] < 1e-12) continue;
        const tm = (ts[k] + ts[k + 1]) / 2;
        const c = classer([a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm], r);
        if (c.lieu === "dedans") dedans += (ts[k + 1] - ts[k]) * len;
        else if (c.lieu === "bord") surLeBord = true;
      }
    }
  }
  return { dedans, surLeBord };
}

/** Distance (m) d'un point à une région : 0 dedans ou sur le bord. */
export function distanceRegion(m: Pt, r: Region): number {
  if (classer(m, r).lieu !== "dehors") return 0;
  let d = Infinity;
  for (const a of r) for (let i = 0; i + 1 < a.length; i++) d = Math.min(d, distanceSegment(m, a[i], a[i + 1]));
  return d;
}

/** La projection centrée sur le premier sommet d'une géométrie, ou sur un point de repli. */
export function projectionPour(g: Geometrie, repli: [number, number]): Projection {
  const premier = (v: unknown): number[] | null => {
    if (Array.isArray(v) && v.length >= 2 && fini(v[0]) && fini(v[1])) return v as number[];
    if (Array.isArray(v)) for (const w of v) { const r = premier(w); if (r) return r; }
    return null;
  };
  const p = g ? premier(g.coordinates) : null;
  return projectionAutour(p ? p[0] : repli[0], p ? p[1] : repli[1]);
}

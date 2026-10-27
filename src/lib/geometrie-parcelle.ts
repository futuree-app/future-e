// LA GÉOMÉTRIE D'UNE PARCELLE FACE À UNE ZONE (FUT-81). Lib PURE, testée sous `node --test`.
//
// ── POURQUOI UN CALCUL EXACT (revue indépendante du 27/10/2026) ──────────────────────────────
// La première version estimait la part d'une zone par une grille de 60 × 60 points. Une bande de 0,5 m
// de large sur 100 m (50 m², un emplacement réservé de voirie réel) passait ENTRE les points : la grille
// rendait 0, et la prescription disparaissait. Une estimation nulle ne prouve pas une absence d'intersection.
//
// ── POURQUOI UNE BIBLIOTHÈQUE ÉPROUVÉE (deuxième revue, 27/10/2026, SHA e73ec075) ─────────────
// La deuxième version intégrait le bord de A ∩ B (formule de Green) en classant chaque morceau d'arête
// « dedans », « dehors » ou « sur le bord » à 1 cm près. Ce classement n'était pas topologiquement
// cohérent : une bande de 4 mm posée CONTRE la parcelle avait ses deux bords à moins d'1 cm de la limite,
// le classement retenait le mauvais des deux, et l'arête entière de la parcelle était comptée.
// Aire(A ∩ B) = 5 000 m² au lieu de 0, et une prescription voisine couvrait la moitié de la parcelle.
// Aucune tolérance ne répare ce défaut : il existe toujours une bande plus étroite que deux fois elle.
//
// ── LA MÉTHODE ───────────────────────────────────────────────────────────────────────────────
// L'intersection est calculée par Clipper (Angus Johnson, 6.4.2, licence Boost), l'algorithme de Vatti
// sur des coordonnées ENTIÈRES : les prédicats y sont exacts (arithmétique 128 bits), il n'y a aucune
// tolérance, et deux frontières distinctes ne se confondent que si elles sont à moins d'une maille.
// La maille est le micromètre (`MAILLE_M`) : mille fois plus fine que le centimètre des tracés publiés.
//
// Les coordonnées sont projetées en mètres par une projection équirectangulaire centrée sur la parcelle,
// à l'échelle de l'ellipsoïde GRS80 en son centre (rayons de courbure méridien et transverse). Elle est
// AFFINE : les segments restent des segments et l'intérieur reste l'intérieur. Contrôlée contre une
// projection équivalente de Lambert (pyproj), les aires des relevés réels ne s'en écartent que de
// 0,01 % au plus ; les constantes sphériques d'avant (111 320 et 110 574 m par degré) les sous-estimaient
// de 0,7 % (oracle de la deuxième revue).
//
// ── UNE MESURE QU'ON NE PEUT PAS GARANTIR N'EST PAS RENDUE ──────────────────────────────────
// `aireIntersection` rend `null`, jamais un nombre douteux, si une région n'est pas un polygone valide
// (anneaux qui se croisent, trou hors de son contour) ou si le résultat viole un invariant : aire finie,
// positive, au plus celle de chaque région, identique dans les deux ordres. Les écarts admis sont ceux
// de l'arrondi à la maille, bornés par les périmètres (`ecartAdmis`). L'appelant lit `null` comme une
// géométrie non mesurable : la prescription devient « incertaine », jamais « confirmée ».
// La zone est d'abord découpée à une fenêtre d'1 m autour de la parcelle (`fenetre`), ce qui ne change
// rien à A ∩ B : sa validité est donc jugée là où elle compte, près de la parcelle.
//
// ── LES LIGNES ET LES POINTS ─────────────────────────────────────────────────────────────────
// Pour une ligne ou un point, « sur le bord » se décide à une tolérance fixe (`TOLERANCE_M`). Elle ne
// fait que retenir comme contact ce qui longe la limite : elle n'attribue jamais rien à la parcelle.

import ClipperLib from "clipper-lib";

/** Une géométrie GeoJSON telle que la rendent l'API Carto et le cadastre. */
export type Geometrie = { type: string; coordinates: unknown } | null | undefined;

type Pt = [number, number];
/** Une région : des anneaux fermés, orientés extérieur anti-horaire, trous horaires (la région est à gauche). */
export type Region = Pt[][];

/** En deçà de cette distance (en mètres), un point est SUR une limite. Bien plus fin que tout tracé publié. */
export const TOLERANCE_M = 0.01;

export type Projection = { lon0: number; lat0: number; kx: number; ky: number };

const GRS80_A = 6_378_137;
const GRS80_E2 = 0.006_694_380_022_9;

export function projectionAutour(lon0: number, lat0: number): Projection {
  const phi = (lat0 * Math.PI) / 180;
  const w = 1 - GRS80_E2 * Math.sin(phi) ** 2;
  const rayonMeridien = (GRS80_A * (1 - GRS80_E2)) / w ** 1.5;
  const rayonTransverse = GRS80_A / Math.sqrt(w);
  return { lon0, lat0, kx: (rayonTransverse * Math.cos(phi) * Math.PI) / 180, ky: (rayonMeridien * Math.PI) / 180 };
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

// ── L'aire d'intersection (Clipper) ─────────────────────────────────────────────────────────

/** La maille (m) sur laquelle les sommets sont arrondis avant le calcul exact. */
export const MAILLE_M = 1e-6;
const DEMI_DIAGONALE_M = (Math.SQRT2 / 2) * MAILLE_M;

/** Les anneaux en coordonnées entières (micromètres), sans le sommet de fermeture. */
function chemins(r: Region): { X: number; Y: number }[][] {
  return r.map((a) => a.slice(0, -1).map(([x, y]) => ({ X: Math.round(x / MAILLE_M), Y: Math.round(y / MAILLE_M) })));
}

/**
 * L'aire (m²) du résultat d'une opération Clipper ; `null` si Clipper échoue. Remplissage non nul : les
 * trous sont horaires. Clipper écarte les anneaux dégénérés (sommets tous alignés), qui ne couvrent
 * aucune surface : un opérande qui n'en a pas d'autre est vide, et le résultat est nul.
 */
function aireOperation(op: number, sujet: Region, clip: Region | null): number | null {
  const c = new ClipperLib.Clipper();
  const sujetVide = !c.AddPaths(chemins(sujet), ClipperLib.PolyType.ptSubject, true);
  const clipVide = clip != null && !c.AddPaths(chemins(clip), ClipperLib.PolyType.ptClip, true);
  if (sujetVide || (clipVide && op === ClipperLib.ClipType.ctIntersection)) return 0;
  const sortie: { X: number; Y: number }[][] = [];
  if (!c.Execute(op, sortie, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) return null;
  return Math.abs(sortie.reduce((s, p) => s + ClipperLib.Clipper.Area(p), 0)) * MAILLE_M * MAILLE_M;
}

function perimetre(r: Region): number {
  let s = 0;
  for (const a of r) for (let i = 0; i + 1 < a.length; i++) s += Math.hypot(a[i + 1][0] - a[i][0], a[i + 1][1] - a[i][1]);
  return s;
}

/**
 * L'écart (m²) dû à l'arrondi à la maille, borné. Déplacer chaque sommet d'au plus δ (la demi-diagonale
 * de la maille) déplace chaque arête d'au plus δ : l'aire d'une région varie d'au plus δ × son périmètre.
 * Les deux entrées sont arrondies (δ × (Pa + Pb)), les sommets du résultat aussi, et le bord du résultat
 * est fait de morceaux des deux bords (δ × (Pa + Pb) encore) : 2δ(Pa + Pb). Le micromètre carré ajouté
 * couvre l'arrondi flottant des sommes d'aires.
 */
export function ecartAdmis(a: Region, b: Region): number {
  return 2 * DEMI_DIAGONALE_M * (perimetre(a) + perimetre(b)) + 1e-12;
}

const coherence = new WeakMap<Region, boolean>();

/**
 * Les anneaux d'une région décrivent-ils sans ambiguïté une surface ? Oui si l'aire de leurs anneaux
 * orientés (formule des lacets) est celle de la surface qu'ils recouvrent (union Clipper). Des anneaux
 * qui se croisent, se recouvrent, ou un trou hors de son contour font diverger les deux. Mémorisé.
 */
function coherente(r: Region): boolean {
  const deja = coherence.get(r);
  if (deja != null) return deja;
  let ok = false;
  try {
    const aire = aireRegion(r);
    const union = aireOperation(ClipperLib.ClipType.ctUnion, r, null);
    ok = Number.isFinite(aire) && union != null && Math.abs(union - aire) <= ecartAdmis(r, r) / 2;
  } catch {
    ok = false; // coordonnées hors de la plage de Clipper
  }
  coherence.set(r, ok);
  return ok;
}

/** Une région est mesurable si c'est un polygone valide, d'aire non nulle (cf. `coherente`). */
export function regionMesurable(r: Region): boolean {
  return coherente(r) && aireRegion(r) > 0;
}

type Boite = [number, number, number, number];

function boite(r: Region): Boite {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const a of r) for (const [x, y] of a) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}

/** Marge (m) de la fenêtre de découpe autour de la parcelle : un million de mailles. */
const MARGE_FENETRE_M = 1;

/**
 * La région découpée à une fenêtre rectangulaire (Sutherland-Hodgman, anneau par anneau). À l'intérieur
 * de la fenêtre, chaque point garde son indice d'enroulement, donc son appartenance à la région : A ∩ B
 * ne change pas si la fenêtre contient A. Le découpage peut laisser des allers-retours d'aire nulle le
 * long du bord de la fenêtre ; le remplissage non nul de Clipper les ignore. Sans lui, une zone
 * communale de 20 000 sommets coûtait plusieurs secondes par parcelle.
 */
function fenetre(r: Region, [x0, y0, x1, y1]: Boite): Region {
  const bords: [(p: Pt) => boolean, (p: Pt, q: Pt) => Pt][] = [
    [(p) => p[0] >= x0, (p, q) => [x0, p[1] + ((q[1] - p[1]) * (x0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= x1, (p, q) => [x1, p[1] + ((q[1] - p[1]) * (x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= y0, (p, q) => [p[0] + ((q[0] - p[0]) * (y0 - p[1])) / (q[1] - p[1]), y0]],
    [(p) => p[1] <= y1, (p, q) => [p[0] + ((q[0] - p[0]) * (y1 - p[1])) / (q[1] - p[1]), y1]],
  ];
  const out: Region = [];
  for (const a of r) {
    let pts = a.slice(0, -1);
    for (const [dedans, coupe] of bords) {
      const suite: Pt[] = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        if (dedans(p)) suite.push(p);
        if (dedans(p) !== dedans(q)) suite.push(coupe(p, q));
      }
      pts = suite;
      if (pts.length < 3) break;
    }
    if (pts.length >= 3) out.push([...pts, pts[0]]);
  }
  return out;
}

/**
 * L'aire (m²) de A ∩ B, ou `null` si elle ne peut pas être garantie. Un contact de limites vaut 0 ; une
 * bande de quelques millimètres garde son aire. B est d'abord découpée à une fenêtre autour de A, puis le
 * calcul est fait dans les deux ordres : ils doivent concorder, comme l'aire doit rester entre 0 et
 * celle de chaque région, aux écarts d'arrondi près.
 */
export function aireIntersection(a: Region, b: Region): number | null {
  if (!regionMesurable(a)) return null;
  try {
    const [ax0, ay0, ax1, ay1] = boite(a);
    const [bx0, by0, bx1, by1] = boite(b);
    // Boîtes disjointes : aucun point de A n'est dans B, quel que soit le tracé de B.
    if (bx0 > ax1 || bx1 < ax0 || by0 > ay1 || by1 < ay0) return 0;
    const m = MARGE_FENETRE_M;
    const bf = fenetre(b, [ax0 - m, ay0 - m, ax1 + m, ay1 + m]);
    if (bf.length === 0) return 0;
    // Découpée, B peut n'avoir plus d'aire (la fenêtre tombe dans un de ses trous) : elle doit rester cohérente.
    if (!coherente(bf)) return null;
    const ab = aireOperation(ClipperLib.ClipType.ctIntersection, a, bf);
    const ba = aireOperation(ClipperLib.ClipType.ctIntersection, bf, a);
    if (ab == null || ba == null || !Number.isFinite(ab) || !Number.isFinite(ba)) return null;
    const ecart = ecartAdmis(a, bf);
    if (Math.abs(ab - ba) > ecart) return null;
    const aire = (ab + ba) / 2;
    if (aire > Math.min(aireRegion(a), aireRegion(bf)) + ecart) return null;
    return aire;
  } catch {
    return null;
  }
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

/** Distance (m) d'un point à des lignes (ou, segments d'un seul sommet, à des points). */
export function distanceLignes(m: Pt, lignes: Pt[][]): number {
  let d = Infinity;
  for (const l of lignes) {
    if (l.length === 1) d = Math.min(d, Math.hypot(m[0] - l[0][0], m[1] - l[0][1]));
    for (let i = 0; i + 1 < l.length; i++) d = Math.min(d, distanceSegment(m, l[i], l[i + 1]));
  }
  return d;
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

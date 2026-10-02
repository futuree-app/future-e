// LA DISTANCE D'UN POINT AU RIVAGE MARIN (FUT-33, phase 2B.2 C). Lib PURE : aucune I/O, aucun état global.
//
// Le rivage est celui de `data/mer/rivage-5m.f32.gz` : la Limite terre-mer Shom-IGN 2021, coupée aux limites
// transversales de la mer, lagunes et bassins compris, simplifiée à 5 m (D9). Des segments Float32
// [x1, y1, x2, y2] en Lambert 93 (EPSG:2154, mètres). Le chargement vit dans `server/rivage-mer.ts`.
//
// Ce qui est mesuré : la distance à vol d'oiseau d'un POINT au rivage marin le plus proche. Ni une plage, ni
// l'océan, ni un accès à l'eau, ni un temps de trajet. Erreur due à la simplification : au plus 5 m.

// ── WGS84 → Lambert 93 (RGF93, ellipsoïde GRS80), formule de l'IGN (conique conforme sécante) ────────────
const A = 6378137;
const F = 1 / 298.257222101;
const E = Math.sqrt(2 * F - F * F);
const rad = (d: number) => (d * Math.PI) / 180;
const latIso = (phi: number) =>
  Math.log(Math.tan(Math.PI / 4 + phi / 2) * Math.pow((1 - E * Math.sin(phi)) / (1 + E * Math.sin(phi)), E / 2));
const grandeNormale = (phi: number) => A / Math.sqrt(1 - E * E * Math.sin(phi) ** 2);
const P1 = rad(44), P2 = rad(49), P0 = rad(46.5), L0 = rad(3), X0 = 700000, Y0 = 6600000;
const N_ = Math.log((grandeNormale(P2) * Math.cos(P2)) / (grandeNormale(P1) * Math.cos(P1))) / (latIso(P1) - latIso(P2));
const C_ = ((grandeNormale(P1) * Math.cos(P1)) / N_) * Math.exp(N_ * latIso(P1));
const YS = Y0 + C_ * Math.exp(-N_ * latIso(P0));

export function versLambert93(lon: number, lat: number): [number, number] {
  const r = C_ * Math.exp(-N_ * latIso(rad(lat)));
  const g = N_ * (rad(lon) - L0);
  return [X0 + r * Math.sin(g), YS - r * Math.cos(g)];
}

// ── Index en grille : chaque cellule de 5 km liste les segments qui la touchent ─────────────────────────
const CELLULE_M = 5000;
const cle = (cx: number, cy: number) => cx * 100000 + cy;

export type IndexRivage = { segments: Float32Array; cellules: Map<number, Int32Array> };

export function construireIndexRivage(segments: Float32Array): IndexRivage {
  if (segments.length === 0 || segments.length % 4 !== 0) throw new Error("rivage : segments illisibles");
  const listes = new Map<number, number[]>();
  for (let i = 0; i < segments.length / 4; i++) {
    const x1 = segments[4 * i], y1 = segments[4 * i + 1], x2 = segments[4 * i + 2], y2 = segments[4 * i + 3];
    const cx0 = Math.floor(Math.min(x1, x2) / CELLULE_M), cx1 = Math.floor(Math.max(x1, x2) / CELLULE_M);
    const cy0 = Math.floor(Math.min(y1, y2) / CELLULE_M), cy1 = Math.floor(Math.max(y1, y2) / CELLULE_M);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k = cle(cx, cy);
        const l = listes.get(k);
        if (l) l.push(i);
        else listes.set(k, [i]);
      }
    }
  }
  const cellules = new Map<number, Int32Array>();
  for (const [k, l] of listes) cellules.set(k, Int32Array.from(l));
  return { segments, cellules };
}

function distanceSegment(px: number, py: number, s: Float32Array, i: number): number {
  const ax = s[4 * i], ay = s[4 * i + 1], bx = s[4 * i + 2], by = s[4 * i + 3];
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Au-delà, le point n'est pas en France métropolitaine (le rivage le plus lointain d'une commune est à ~ 400 km).
const ANNEAUX_MAX = 200;

/**
 * Distance en km d'un point WGS84 au rivage marin. Parcourt des anneaux de cellules croissants et s'arrête dès
 * qu'aucune cellule plus lointaine ne peut contenir un segment plus proche. `null` hors de portée : jamais un
 * nombre inventé.
 */
export function distanceAuRivageKm(index: IndexRivage, lat: number, lon: number): number | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const [px, py] = versLambert93(lon, lat);
  const cx = Math.floor(px / CELLULE_M), cy = Math.floor(py / CELLULE_M);
  let best = Infinity;
  for (let k = 0; k <= ANNEAUX_MAX; k++) {
    if (best <= (k - 1) * CELLULE_M) break;
    for (let x = cx - k; x <= cx + k; x++) {
      for (let y = cy - k; y <= cy + k; y++) {
        if (k > 0 && x !== cx - k && x !== cx + k && y !== cy - k && y !== cy + k) continue;
        const l = index.cellules.get(cle(x, y));
        if (!l) continue;
        for (const i of l) {
          const d = distanceSegment(px, py, index.segments, i);
          if (d < best) best = d;
        }
      }
    }
  }
  return Number.isFinite(best) ? best / 1000 : null;
}

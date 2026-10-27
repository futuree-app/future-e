/**
 * FUT-82 — outils partagés des sondes (lecture seule, aucune dépendance).
 *
 * Tout ce qui sort d'ici est une MESURE : un appel horodaté, sa latence, son statut. Aucune
 * interprétation produit. Les conversions de projection sont écrites à la main parce que les
 * couches de la Géoplateforme n'ont pas toutes la même projection native (Natura 2000 en
 * EPSG:3857, débroussaillement et potentiel solaire en EPSG:2154, BD TOPO en EPSG:4326) et
 * qu'un filtre CQL écrit dans la mauvaise projection rend « zéro objet » sans erreur : une
 * fausse absence silencieuse, vérifiée le 27/10/2026 sur la forêt de Fontainebleau.
 */

export const UA = "futur-e-audit-fut82/1.0 (lecture seule, sondes bornees)";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch chronométré, avec reprises bornées sur erreur réseau ou 5xx/429.
 * Rend toujours un objet : { ok, status, ms, body (texte), error, tentatives }.
 * Ne lève jamais : une source indisponible est une mesure, pas une exception.
 */
export async function timedFetch(url, { timeoutMs = 30000, retries = 2, headers = {}, pauseMs = 800 } = {}) {
  let last = null;
  for (let tentative = 1; tentative <= retries + 1; tentative++) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = await res.text();
      const ms = Math.round(performance.now() - t0);
      last = { ok: res.ok, status: res.status, ms, body, error: null, tentatives: tentative };
      if (res.ok || (res.status < 500 && res.status !== 429)) return last;
    } catch (e) {
      last = { ok: false, status: 0, ms: Math.round(performance.now() - t0), body: "", error: String(e?.message ?? e), tentatives: tentative };
    }
    if (tentative <= retries) await sleep(pauseMs * tentative);
  }
  return last;
}

export function tryJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ── Géométrie ──────────────────────────────────────────────────────────────────────────────

export function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** WGS84 → Web Mercator (EPSG:3857). */
export function to3857(lat, lon) {
  const R = 6378137, r = Math.PI / 180;
  return [R * lon * r, R * Math.log(Math.tan(Math.PI / 4 + (lat * r) / 2))];
}

/** WGS84 → Lambert-93 (EPSG:2154), formules IGN (conique conforme sécante, GRS80). */
export function to2154(lat, lon) {
  const e = 0.0818191910428158, n = 0.725607765053267, c = 11754255.426096;
  const xs = 700000, ys = 12655612.049876, lon0 = (3 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180, lam = (lon * Math.PI) / 180;
  const L = Math.log(Math.tan(Math.PI / 4 + phi / 2) * ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2));
  const R = c * Math.exp(-n * L), g = n * (lam - lon0);
  return [xs + R * Math.sin(g), ys - R * Math.cos(g)];
}

/** Point dans le CRS natif d'une couche, au format attendu par un filtre CQL. */
export function pointCql(lat, lon, crs) {
  if (crs === "4326") return `POINT(${lat} ${lon})`; // WFS 2.0 : axe latitude d'abord en EPSG:4326
  if (crs === "3857") { const [x, y] = to3857(lat, lon); return `POINT(${x.toFixed(2)} ${y.toFixed(2)})`; }
  if (crs === "2154") { const [x, y] = to2154(lat, lon); return `POINT(${x.toFixed(2)} ${y.toFixed(2)})`; }
  throw new Error(`CRS non géré : ${crs}`);
}

/** Distance (m) d'un point à une polyligne en degrés [ [lon,lat], ... ] — approximation locale. */
export function distancePointPolylineM(lat, lon, coords) {
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110540;
  let best = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = [(coords[i][0] - lon) * kx, (coords[i][1] - lat) * ky];
    const [x2, y2] = [(coords[i + 1][0] - lon) * kx, (coords[i + 1][1] - lat) * ky];
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / L2)) : 0;
    best = Math.min(best, Math.hypot(x1 + t * dx, y1 + t * dy));
  }
  return best;
}

// ── Petits utilitaires statistiques ──────────────────────────────────────────────────────────

export function quantile(values, q) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return Math.round(v[lo] + (v[hi] - v[lo]) * (pos - lo));
}

export function latencySummary(values) {
  const v = values.filter((x) => Number.isFinite(x));
  return { n: v.length, mediane_ms: quantile(v, 0.5), p90_ms: quantile(v, 0.9), max_ms: v.length ? Math.max(...v) : null };
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : l'échantillon se rejoue à l'identique. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]]] : [])));
}

// ── Lecture d'un pixel de carte WMS (PNG minimal, sans dépendance) ───────────────────────────
// Sert aux couches NON interrogeables (masques de la carte des nappes) : on lit si le pixel central
// est opaque. Gère les PNG 8 bits palette (+tRNS), RGB et RGBA, non entrelacés.
import { inflateSync } from "node:zlib";

export function pngPixelOpaque(buf, x, y) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let off = 8, w = 0, h = 0, depth = 0, ctype = 0, plte = null, trns = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    else if (type === "PLTE") plte = data; else if (type === "tRNS") trns = data; else if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  // Palette en 1, 2, 4 ou 8 bits ; RGB/RGBA/gris en 8 bits seulement.
  if (ctype !== 3 && depth !== 8) return null;
  const bitsPx = ctype === 3 ? depth : 8 * { 2: 3, 6: 4, 0: 1, 4: 2 }[ctype];
  const stride = Math.ceil((w * bitsPx) / 8), bpp = Math.max(1, bitsPx >> 3);
  const raw = inflateSync(Buffer.concat(idat)), img = Buffer.alloc(h * stride);
  for (let r = 0; r < h; r++) {
    const f = raw[r * (stride + 1)], line = raw.subarray(r * (stride + 1) + 1, (r + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? img[r * stride + i - bpp] : 0, b = r ? img[(r - 1) * stride + i] : 0, c = r && i >= bpp ? img[(r - 1) * stride + i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      img[r * stride + i] = v & 255;
    }
  }
  if (ctype === 3) {
    const bit = x * depth, octet = img[y * stride + (bit >> 3)];
    const idx = (octet >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
    return trns ? (idx < trns.length ? trns[idx] > 0 : true) : true;
  }
  const px = img.subarray(y * stride + x * bpp, y * stride + x * bpp + bpp);
  if (ctype === 6) return px[3] > 0;
  if (ctype === 4) return px[1] > 0;
  return true; // RGB sans alpha : opaque par construction
}

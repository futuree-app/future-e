#!/usr/bin/env node
// FUT-33, phase 1.5 : prototype Node « distance adresse → rivage marin ». NON branché au produit.
//
// Charge un rivage simplifié (segments Float32 en Lambert 93, produit par export_node.py), construit un index en
// grille, et mesure : poids du fichier (brut et gzip), temps d'initialisation, mémoire, latence par point
// (p50 / p95 / max) et erreur par rapport à la distance exacte au rivage source (panel.json).
// La projection WGS84 → Lambert 93 est faite ici (formule IGN, conique conforme sécante), sans dépendance.
//
// Usage : node scripts/mer/adresse-node.mjs <dossier contenant rivage-5m.f32, rivage-10m.f32, rivage-20m.f32, panel.json>
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ── Lambert 93 (RGF93, ellipsoïde GRS80) ─────────────────────────────────────────────────────────────
const A = 6378137, F = 1 / 298.257222101, E = Math.sqrt(2 * F - F * F);
const rad = (d) => (d * Math.PI) / 180;
const latIso = (phi) => Math.log(Math.tan(Math.PI / 4 + phi / 2) * Math.pow((1 - E * Math.sin(phi)) / (1 + E * Math.sin(phi)), E / 2));
const grandeNormale = (phi) => A / Math.sqrt(1 - E * E * Math.sin(phi) ** 2);
const P1 = rad(44), P2 = rad(49), P0 = rad(46.5), L0 = rad(3), X0 = 700000, Y0 = 6600000;
const N_ = Math.log((grandeNormale(P2) * Math.cos(P2)) / (grandeNormale(P1) * Math.cos(P1))) / (latIso(P1) - latIso(P2));
const C_ = ((grandeNormale(P1) * Math.cos(P1)) / N_) * Math.exp(N_ * latIso(P1));
const YS = Y0 + C_ * Math.exp(-N_ * latIso(P0));
export function versLambert93(lon, lat) {
  const r = C_ * Math.exp(-N_ * latIso(rad(lat)));
  const g = N_ * (rad(lon) - L0);
  return [X0 + r * Math.sin(g), YS - r * Math.cos(g)];
}

// ── Index en grille ─────────────────────────────────────────────────────────────────────────────────
const CELLULE = 5000;
export function construireIndex(segments) {
  const n = segments.length / 4;
  const cellules = new Map();
  for (let i = 0; i < n; i++) {
    const x1 = segments[4 * i], y1 = segments[4 * i + 1], x2 = segments[4 * i + 2], y2 = segments[4 * i + 3];
    const cx0 = Math.floor(Math.min(x1, x2) / CELLULE), cx1 = Math.floor(Math.max(x1, x2) / CELLULE);
    const cy0 = Math.floor(Math.min(y1, y2) / CELLULE), cy1 = Math.floor(Math.max(y1, y2) / CELLULE);
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
      const k = cx * 100000 + cy;
      let l = cellules.get(k);
      if (!l) cellules.set(k, (l = []));
      l.push(i);
    }
  }
  for (const [k, l] of cellules) cellules.set(k, Int32Array.from(l));
  return { segments, cellules };
}

function distSeg(px, py, s, i) {
  const ax = s[4 * i], ay = s[4 * i + 1], bx = s[4 * i + 2], by = s[4 * i + 3];
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance (m) d'un point WGS84 au rivage marin : anneaux de cellules croissants jusqu'à certitude. */
export function distanceAuRivage(index, lon, lat) {
  const [px, py] = versLambert93(lon, lat);
  const cx = Math.floor(px / CELLULE), cy = Math.floor(py / CELLULE);
  let best = Infinity;
  for (let k = 0; k < 400; k++) {
    if (best <= (k - 1) * CELLULE) break;
    for (let x = cx - k; x <= cx + k; x++) {
      for (let y = cy - k; y <= cy + k; y++) {
        if (k > 0 && x !== cx - k && x !== cx + k && y !== cy - k && y !== cy + k) continue;
        const l = index.cellules.get(x * 100000 + y);
        if (!l) continue;
        for (const i of l) { const d = distSeg(px, py, index.segments, i); if (d < best) best = d; }
      }
    }
  }
  return best;
}

const pct = (a, p) => a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];

function mesurer(dossier, tol, panel) {
  const brut = readFileSync(join(dossier, `rivage-${tol}m.f32`));
  const t0 = performance.now();
  const segments = new Float32Array(brut.buffer, brut.byteOffset, brut.byteLength / 4);
  const index = construireIndex(segments);
  const init = performance.now() - t0;
  // Mémoire tenue par les structures (segments + listes de la grille), comptée octet par octet : la mesure par
  // process.memoryUsage() est brouillée par le ramasse-miettes et le tampon de lecture.
  let octets = index.segments.byteLength;
  for (const l of index.cellules.values()) octets += l.byteLength + 64; // + entrée de Map (estimation)
  const mem = octets;
  const lat = [], err = [];
  for (const [lon, la, exact] of panel) {
    const t = performance.now();
    const d = distanceAuRivage(index, lon, la);
    lat.push(performance.now() - t);
    err.push(Math.abs(d - exact));
  }
  lat.sort((a, b) => a - b);
  err.sort((a, b) => a - b);
  return {
    tolerance_m: tol, segments: segments.length / 4,
    fichier_mo: +(brut.byteLength / 1e6).toFixed(1), gzip_mo: +(gzipSync(brut).byteLength / 1e6).toFixed(1),
    init_ms: Math.round(init), memoire_mo: +(mem / 1e6).toFixed(1), cellules: index.cellules.size,
    latence_ms: { p50: +pct(lat, 50).toFixed(3), p95: +pct(lat, 95).toFixed(3), max: +lat[lat.length - 1].toFixed(2) },
    erreur_m: { moyenne: +(err.reduce((s, x) => s + x, 0) / err.length).toFixed(2), p99: +pct(err, 99).toFixed(1), max: +err[err.length - 1].toFixed(1) },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dossier = process.argv[2];
  const panel = JSON.parse(readFileSync(join(dossier, "panel.json"), "utf8")).points;
  const res = [5, 10, 20].map((t) => mesurer(dossier, t, panel));
  console.log(JSON.stringify({ points: panel.length, niveaux: res }, null, 1));
}

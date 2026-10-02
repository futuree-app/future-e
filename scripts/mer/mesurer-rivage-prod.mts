// FUT-33 (2B.2 C) : mesure du calcul d'adresse TEL QU'IL TOURNE en production (src/lib/mer-rivage.ts sur
// data/mer/rivage-5m.f32.gz) : lecture + décompression + index à froid, mémoire, latence par point.
// Usage : node --expose-gc scripts/mer/mesurer-rivage-prod.mts
import { readFileSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { construireIndexRivage, distanceAuRivageKm } from "../../src/lib/mer-rivage.ts";

const FICHIER = "data/mer/rivage-5m.f32.gz";
const gc = (globalThis as { gc?: () => void }).gc;
gc?.();
const avant = process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers;
const t0 = performance.now();
const brut = gunzipSync(readFileSync(FICHIER));
const segments = new Float32Array(brut.byteLength / 4);
new Uint8Array(segments.buffer).set(brut);
const t1 = performance.now();
const index = construireIndexRivage(segments);
const t2 = performance.now();
gc?.();
const apres = process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers;

// 5 000 points tirés dans la France métropolitaine (boîte englobante), graine fixe : la latence se mesure loin
// et près du rivage.
let graine = 42;
const alea = () => ((graine = (graine * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const lat: number[] = [];
for (let i = 0; i < 5000; i++) {
  const la = 42.3 + alea() * 8.8, lo = -4.8 + alea() * 13;
  const t = performance.now();
  distanceAuRivageKm(index, la, lo);
  lat.push(performance.now() - t);
}
lat.sort((a, b) => a - b);
const pct = (p: number) => +lat[Math.floor((p / 100) * (lat.length - 1))].toFixed(3);
console.log(JSON.stringify({
  fichier_mo: +(statSync(FICHIER).size / 1e6).toFixed(2),
  decompresse_mo: +(brut.byteLength / 1e6).toFixed(2),
  segments: segments.length / 4,
  lecture_decompression_ms: Math.round(t1 - t0),
  index_ms: Math.round(t2 - t1),
  froid_total_ms: Math.round(t2 - t0),
  memoire_mo: +((apres - avant) / 1e6).toFixed(1),
  latence_ms: { p50: pct(50), p95: pct(95), p99: pct(99), max: +lat[lat.length - 1].toFixed(2) },
}, null, 1));

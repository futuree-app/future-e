#!/usr/bin/env node
/**
 * FUT-149 (revue du 29/10/2026) — Combien de VRAIES limites de zone sont exactement alignées sur la grille des
 * tuiles ? Pour chaque arête d'un morceau posée sur le bord de sa cellule, on regarde, tous les ~5 m, juste de
 * l'autre côté : si la cellule voisine n'y a pas de zone, c'est une vraie limite (que la première version écartait).
 *
 *   node scripts/research/fut149/limites-alignees.mjs <dossier de l'édition>
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const ED = process.argv[2];
const m = JSON.parse(readFileSync(path.join(ED, "manifest.json"), "utf8"));
const PAS = 1_000_000, EXAMEN = 500;
const cache = new Map();
function anneaux(k) {
  if (cache.has(k)) return cache.get(k);
  const t = m.tuiles[k];
  let v = null;
  if (t && "plein" in t) v = "plein";
  else if (t) v = JSON.parse(gunzipSync(readFileSync(path.join(ED, "t", `${k}.json.gz`))).toString()).morceaux.map((x) => x.r.map((c) => {
    const pts = [[c[0], c[1]]];
    for (let i = 2; i < c.length; i += 2) pts.push([pts.at(-1)[0] + c[i], pts.at(-1)[1] + c[i + 1]]);
    return pts;
  }));
  cache.set(k, v);
  return v;
}
const dans = (x, y, a) => { let d = false; for (let i = 0, j = a.length - 1; i < a.length; j = i++) if ((a[i][1] > y) !== (a[j][1] > y) && x < ((a[j][0] - a[i][0]) * (y - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) d = !d; return d; };
function couvert(ix, iy, x, y) {
  const v = anneaux(`${ix}_${iy}`);
  if (!v) return false;
  if (v === "plein") return true;
  return v.some((r) => dans(x, y, r[0]) && !r.slice(1).some((h) => dans(x, y, h)));
}
let alignees = 0, vraies = 0, cellulesTouchees = new Set();
for (const [k, t] of Object.entries(m.tuiles)) {
  const [ix, iy] = k.split("_").map(Number);
  const [X0, Y0, X1, Y1] = [ix * PAS, iy * PAS, (ix + 1) * PAS, (iy + 1) * PAS];
  const ringsDe = "plein" in t ? [[[[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]]]] : anneaux(k);
  for (const r of ringsDe) for (const a of r) {
    for (let i = 0; i < a.length; i++) {
      const [ax, ay] = a[i], [bx, by] = a[(i + 1) % a.length];
      const v = ax === bx && ax === X0 ? [ix - 1, iy, -1, 0] : ax === bx && ax === X1 ? [ix + 1, iy, 1, 0] : ay === by && ay === Y0 ? [ix, iy - 1, 0, -1] : ay === by && ay === Y1 ? [ix, iy + 1, 0, 1] : null;
      if (!v) continue;
      const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / EXAMEN));
      for (let s = 0; s < n; s++) {
        const mx = Math.round(ax + ((bx - ax) * (s + 0.5)) / n) + v[2], my = Math.round(ay + ((by - ay) * (s + 0.5)) / n) + v[3];
        const l = len / n;
        alignees += l;
        if (!couvert(v[0], v[1], mx, my)) { vraies += l; cellulesTouchees.add(k); }
      }
    }
  }
}
// 1e-7 degré ≈ 1,11 cm en latitude ; ordre de grandeur suffisant pour un décompte.
console.log(JSON.stringify({ edition: m.edition, aretesAligneesKm: Math.round(alignees * 0.0111 / 1000), vraiesLimitesAligneesM: Math.round(vraies * 0.0111), cellulesConcernees: cellulesTouchees.size, exemples: [...cellulesTouchees].slice(0, 12) }));

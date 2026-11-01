import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, ED] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const cache = new Map();
const tuile = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())); return cache.get(k); };
const temps: [number, string][] = [];
for (const k of Object.keys(man.tuiles)) {
  const [ix, iy] = k.split("_").map(Number);
  for (const [fx, fy] of [[0.5, 0.5], [0.0003, 0.5], [0.5, 0.9997], [0.0003, 0.0003]]) {
    const e = { point: [(ix + fx) / 10, (iy + fy) / 10] as [number, number], geocodage: null, insee: "83000", parcelle: null };
    const m = new Map(tuilesALire(man, e).map((x: string) => [x, tuile(x)]));
    const t = performance.now(); lireDebroussaillement(man, m, e); temps.push([performance.now() - t, `${k}@${fx},${fy}`]);
  }
}
temps.sort((a, b) => a[0] - b[0]);
const q = (p: number) => temps[Math.floor(p * (temps.length - 1))][0].toFixed(1);
console.log(JSON.stringify({ lectures: temps.length, medianeMs: q(0.5), p99Ms: q(0.99), maxMs: temps.at(-1)![0].toFixed(0), pires: temps.slice(-5).map(([t, c]) => `${c}:${t.toFixed(0)}ms`) }));

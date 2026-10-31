import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [A, B, ED] = process.argv.slice(2);
const la = (await import(`${A}/src/lib/debroussaillement.ts`)), lb = (await import(`${B}/src/lib/debroussaillement.ts`));
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8")); const cache = new Map();
const tuile = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())); return cache.get(k); };
let n = 0, diff = 0;
for (const k of Object.keys(man.tuiles)) { const [ix, iy] = k.split("_").map(Number);
  for (const [fx, fy] of [[0.5, 0.5], [0.0003, 0.5], [0.5, 0.9997], [0.0003, 0.0003], [0.9999, 0.3], [0.2, 0.0001]]) {
    const e = { point: [(ix + fx) / 10, (iy + fy) / 10] as [number, number], geocodage: null, insee: "83000", parcelle: null };
    const m = new Map(la.tuilesALire(man, e).map((x: string) => [x, tuile(x)]));
    n++; if (JSON.stringify(la.lireDebroussaillement(man, m, e)) !== JSON.stringify(lb.lireDebroussaillement(man, m, e))) diff++; } }
console.log({ lectures: n, differences: diff });

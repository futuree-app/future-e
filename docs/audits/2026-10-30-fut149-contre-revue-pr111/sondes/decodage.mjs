// Contre-revue FUT-149 : le coût de décodage (gunzip + JSON.parse) de chaque tuile d'une édition, et sa taille.
//   node decodage.mjs <sortie>/<édition>
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const ED = process.argv[2];
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const t = [], o = [];
for (const [k, e] of Object.entries(man.tuiles)) {
  if ("plein" in e) continue;
  const b = readFileSync(`${ED}/t/${k}.json.gz`);
  const t0 = performance.now(); JSON.parse(gunzipSync(b).toString()); t.push(performance.now() - t0); o.push(b.length);
}
const q = (a, p) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
console.log(JSON.stringify({ tuiles: t.length, octetsTotal: o.reduce((s, x) => s + x, 0), octetsMediane: q(o, 0.5), octetsP99: q(o, 0.99), octetsMax: Math.max(...o),
  decodageMedianeMs: +q(t, 0.5).toFixed(2), decodageP99Ms: +q(t, 0.99).toFixed(1), decodageMaxMs: +Math.max(...t).toFixed(1) }));

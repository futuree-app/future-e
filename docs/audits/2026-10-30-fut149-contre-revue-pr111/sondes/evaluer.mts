import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, ED, PTS, MODE] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const cache = new Map<string, unknown>();
const tuile = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())); return cache.get(k); };
const pts = JSON.parse(readFileSync(PTS, "utf8"));
const n: Record<string, number> = {}; const ex: Record<string, unknown[]> = {};
const t0 = performance.now(); let tmax = 0;
for (const p of pts) {
  const e = { point: [p.lon, p.lat] as [number, number], geocodage: null, insee: p.dep ? `${p.dep}000` : null, parcelle: null };
  const tt = performance.now();
  const r = lireDebroussaillement(man, new Map(tuilesALire(man, e).map((k: string) => [k, tuile(k)])), e);
  tmax = Math.max(tmax, performance.now() - tt);
  let cle: string;
  if (MODE === "partage") cle = `vérité en_zone (frontière réelle à ${p.distFrontiere >= 65 ? "≥65" : "<65"} m) → lib ${r.etat}`;
  else {
    if (p.ambigu) continue;
    const verite = p.dist <= 50 ? "en_limite" : p.dedans ? "en_zone" : "dehors";
    const lib = r.etat === "hors_zone" || r.etat === "non_couvert" ? "dehors" : r.etat;
    const bande = Math.abs(p.dist - 50) < 4 ? " [bande 46-54 m]" : "";
    const partage = verite === "en_zone" && lib === "en_limite" && p.distIndiv <= 50 ? " [arête partagée entre zones]" : "";
    cle = `vérité ${verite} → lib ${lib}${lib === verite ? "" : bande + partage}`;
  }
  n[cle] = (n[cle] ?? 0) + 1;
  (ex[cle] ??= []).length < 3 && ex[cle].push({ lon: +p.lon.toFixed(6), lat: +p.lat.toFixed(6), d: p.d, dist: p.dist, distIndiv: p.distIndiv, deps: p.deps, distPartage: p.distPartage });
}
console.log(JSON.stringify({ points: pts.length, ms: Math.round(performance.now() - t0), msMaxParLecture: Math.round(tmax) }));
for (const [k, v] of Object.entries(n).sort()) console.log(`${String(v).padStart(6)}  ${k}${k.includes("→ lib en_zone") && k.startsWith("vérité en_zone") ? "" : "  ex. " + JSON.stringify(ex[k][0])}`);

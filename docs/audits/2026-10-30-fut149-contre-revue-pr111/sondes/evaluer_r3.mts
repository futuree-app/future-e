// Contre-revue FUT-149, option A de R3 : la lecture de la lib (tuiles d'une édition) contre l'oracle indépendant
// `oracle_r3.py` (géométrie d'origine). Chaque désaccord est listé.
//   node evaluer_r3.mts <worktree> <sortie>/<édition> <points_r3.json>
// Vérité : à 50 m ou moins du bord de la réunion → en_limite ; sinon dedans → en_zone ; sinon dehors.
// « Dangereux » : une lecture « en zone » d'un point hors zone, ou « hors zone » d'un point dans la zone.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const [W, ED, PTS] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const cache = new Map<string, unknown>();
const tuile = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())); return cache.get(k); };
type P = { cat: string; lon: number; lat: number; dedans: boolean; dist: number; amb: boolean; dep: string | null; d?: number | string; dissoute?: boolean; largeur?: number };
const pts: P[] = JSON.parse(readFileSync(PTS, "utf8"));
const parCat: Record<string, Record<string, number>> = {};
const ecarts: unknown[] = [];
let dangereux = 0;
let ambigus = 0;
for (const p of pts) {
  if (p.amb) { ambigus++; continue; }
  const e = { point: [p.lon, p.lat] as [number, number], geocodage: null, insee: p.dep ? `${p.dep}000` : null, parcelle: null };
  const r = lireDebroussaillement(man, new Map(tuilesALire(man, e).map((k: string) => [k, tuile(k)])), e);
  const verite = p.dist <= 50 ? (p.dedans ? "en_limite·dedans" : "en_limite·dehors") : p.dedans ? "en_zone" : "dehors";
  const lib = r.etat === "en_limite" ? (r.limite?.distanceM == null ? "en_limite·dedans" : "en_limite·dehors")
    : r.etat === "hors_zone" || r.etat === "non_couvert" ? "dehors" : r.etat;
  const cat = p.cat === "jonction" ? `jonction ${p.dissoute ? "dissoute" : "NON dissoute"}` : p.cat;
  const ok = lib === verite;
  const cle = ok ? "accord" : Math.abs(p.dist - 50) < 1 ? "écart, bande 49-51 m" : `écart : vérité ${verite}, lib ${lib}`;
  (parCat[cat] ??= {})[cle] = (parCat[cat][cle] ?? 0) + 1;
  if ((lib === "en_zone" && !p.dedans) || (lib === "dehors" && p.dedans)) dangereux++;
  if (!ok) ecarts.push({ cat, lon: +p.lon.toFixed(6), lat: +p.lat.toFixed(6), dep: p.dep, dist: p.dist, dedans: p.dedans, lib: r.etat, distanceM: r.limite?.distanceM ?? null, ...(p.largeur != null ? { largeur: p.largeur } : {}) });
}
console.log(JSON.stringify({ points: pts.length, ambigusEcartes: ambigus, dangereux, ecarts: ecarts.length }));
for (const [c, v] of Object.entries(parCat).sort()) console.log(c.padEnd(26), JSON.stringify(v));
for (const x of ecarts) console.log("  ÉCART", JSON.stringify(x));

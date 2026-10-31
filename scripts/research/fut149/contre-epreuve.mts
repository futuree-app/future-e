// Contre-épreuve : la lecture de l'application (tuiles) contre l'oracle Shapely (polygones Lambert-93 d'origine).
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { lireDebroussaillement, tuilesALire, LIMITE_PROCHE_M } from "../../../src/lib/debroussaillement.ts";
const S = process.argv[2] ?? ".";
const ED = `${S}/out/2026-03-01`;
const m = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const cache = new Map<string, unknown>();
const charger = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())); return cache.get(k) as never; };
const pts = JSON.parse(readFileSync(`${S}/oracle-points.json`, "utf8")) as { lon: number; lat: number; dedans: boolean; d: number; ambigu: boolean }[];
const TOL = 0.5; // mètres : arrondi au 1e-7 degré, projection locale de la lib
let ok = 0; const ecarts: unknown[] = []; const compte: Record<string, number> = {};
const t0 = Date.now();
for (const p of pts) {
  const e = { point: [p.lon, p.lat] as [number, number], geocodage: null, insee: "33063", parcelle: null };
  const tuiles = new Map(tuilesALire(m, e).map((k) => [k, charger(k)]));
  const l = lireDebroussaillement(m, tuiles, e);
  compte[l.etat] = (compte[l.etat] ?? 0) + 1;
  let bon: boolean;
  if (p.ambigu) bon = l.etat === "incertain" || (!p.dedans && p.d > LIMITE_PROCHE_M - TOL);
  else if (Math.abs(p.d - LIMITE_PROCHE_M) <= TOL || p.d <= TOL) bon = true; // à la frontière de la convention : les deux lectures se défendent
  else if (p.d < LIMITE_PROCHE_M) bon = l.etat === "en_limite" && (l.limite?.distanceM == null) === p.dedans;
  else bon = p.dedans ? l.etat === "en_zone" : l.etat === "hors_zone";
  if (bon) ok++; else ecarts.push({ ...p, lu: l.etat, limite: l.limite });
}
console.log(JSON.stringify({ points: pts.length, concordants: ok, ecarts: ecarts.length, etats: compte, msParPoint: (Date.now() - t0) / pts.length }));
console.log(JSON.stringify(ecarts.slice(0, 10)));

#!/usr/bin/env node
/**
 * FUT-82 — contre-épreuves (lecture seule).
 *
 *  1. STABILITÉ AU VOISINAGE. Pour chaque point où une zone a été trouvée (nappe, PEB, débroussaillement),
 *     on interroge 8 points à 25, 50 et 100 m (N, NE, E, SE, S, SO, O, NO) et on compte les réponses qui
 *     diffèrent du point central. Une réponse qui change à 25 m ne peut pas être dite « à l'adresse »
 *     sans précaution : le géocodage BAN lui-même se trompe de cette distance (point de rue, entrée).
 *  2. COHÉRENCE ENTRE PRODUCTEURS. Le champ `nombre_dincendies` du jeu ADEME « data_communes », servi
 *     aujourd'hui au prompt d'AskFuture (« Incendies récents (nombre) »), sans source documentée, est
 *     comparé aux feux de forêt BDIFF 2006-2025 des mêmes communes.
 *
 *   node scripts/research/fut82/contre-epreuves.mjs [--out <json>]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { timedFetch, tryJson, parseArgs, sleep, pointCql, rng } from "./lib.mjs";

const args = parseArgs(process.argv);
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/contre-epreuves.json";
const sondes = JSON.parse(readFileSync("docs/audits/2026-10-27-fut82/mesures/sondes-adresses.json", "utf8")).resultats;

function decale(lat, lon, m, capDeg) {
  const r = (capDeg * Math.PI) / 180;
  return [lat + (m * Math.cos(r)) / 110540, lon + (m * Math.sin(r)) / (111320 * Math.cos((lat * Math.PI) / 180))];
}

function dansAnneau(lat, lon, ring) {
  let d = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
async function nappe(lat, lon) {
  const d = 0.002;
  const r = await timedFetch(`https://mapsref.brgm.fr/wxs/georisques/risques?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:REMNAPPE&MAXFEATURES=200&BBOX=${lat - d},${lon - d},${lat + d},${lon + d},urn:ogc:def:crs:EPSG::4326`, { timeoutMs: 45000 });
  for (const m of r.body.matchAll(/<ms:REMNAPPE [\s\S]*?<\/ms:REMNAPPE>/g)) {
    const g = m[0];
    const rings = [...g.matchAll(/<gml:posList[^>]*>([^<]+)<\/gml:posList>/g)].map((x) => { const v = x[1].trim().split(/\s+/).map(Number), ring = []; for (let i = 0; i + 1 < v.length; i += 2) ring.push([v[i], v[i + 1]]); return ring; });
    const [ext, ...trous] = rings;
    if (ext && dansAnneau(lat, lon, ext) && !trous.some((t) => dansAnneau(lat, lon, t))) return `${g.match(/<ms:gridcode>([^<]*)</)?.[1]}/${g.match(/<ms:fiab_tot>([^<]*)</)?.[1]}`;
  }
  return "aucune";
}
async function peb(lat, lon) {
  const d = 0.0005;
  const r = await timedFetch(`https://data.geopf.fr/wms-v/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=dgac_peb_plan_wmsv&QUERY_LAYERS=dgac_peb_plan_wmsv&CRS=EPSG:4326&BBOX=${lat - d},${lon - d},${lat + d},${lon + d}&WIDTH=11&HEIGHT=11&I=5&J=5&INFO_FORMAT=application/json&STYLES=&FEATURE_COUNT=5`);
  return (tryJson(r.body)?.features ?? []).map((f) => f.properties.zone).sort().join(",") || "aucune";
}
async function old(lat, lon) {
  const p = new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "DEBROUSSAILLEMENT:debroussaillement", RESULTTYPE: "hits", CQL_FILTER: `zonage=2 AND INTERSECTS(geom,${pointCql(lat, lon, "2154")})` });
  const r = await timedFetch(`https://data.geopf.fr/wfs/ows?${p}`);
  return Number(r.body.match(/numberMatched="(\d+)"/)?.[1] ?? NaN) > 0 ? "zone" : "hors zone";
}

const LECTURES = { nappe, peb, old };
const cibles = [];
for (const s of sondes) {
  if (s.type === "municipality") continue; // centroïdes : traités à part, ce ne sont pas des adresses
  if (s.nappeBrgm?.auPoint?.length) cibles.push([s, "nappe"]);
  if (s.peb?.features?.length) cibles.push([s, "peb"]);
  if (s.debroussaillement?.auPoint?.length) cibles.push([s, "old"]);
}
// Pour la nappe, on borne à 12 points tirés (graine fixe) : la lecture est la plus lente.
const alea = rng(27);
const nappeCibles = cibles.filter(([, k]) => k === "nappe").sort(() => alea() - 0.5).slice(0, 12);
const retenues = [...cibles.filter(([, k]) => k !== "nappe"), ...nappeCibles];

const stabilite = [];
for (const [s, k] of retenues) {
  const centre = await LECTURES[k](s.lat, s.lon);
  const parRayon = {};
  for (const m of [25, 50, 100]) {
    let differe = 0; const vus = [];
    for (const cap of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const [la, lo] = decale(s.lat, s.lon, m, cap);
      const v = await LECTURES[k](la, lo); vus.push(v); if (v !== centre) differe++;
      await sleep(k === "nappe" ? 150 : 60);
    }
    parRayon[`${m}m`] = { differe, sur: 8, valeurs: [...new Set(vus)] };
  }
  stabilite.push({ id: s.id, lecture: k, centre, typeBan: s.type, ...parRayon });
  process.stderr.write(`${s.id} ${k} centre=${centre} 25m:${parRayon["25m"].differe}/8 50m:${parRayon["50m"].differe}/8 100m:${parRayon["100m"].differe}/8\n`);
}

// ── 2. ADEME `nombre_dincendies` contre BDIFF ──────────────────────────────────────────────
// Agrégat BDIFF COMPLET (hors dépôt), produit par bdiff-export.mjs : `--bdiff <fichier>`.
const bdiff = JSON.parse(readFileSync(args.bdiff ?? join(tmpdir(), "fut82-bdiff", "bdiff-communes-complet.json"), "utf8")).communes;
const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const a2 = rng(2027);
const tirage = index.filter(() => a2() < 0.0035).slice(0, 120);
const inc = [];
for (const c of tirage) {
  const u = `https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462/lines?qs=${encodeURIComponent(`code_commune_insee:${c.insee}`)}&select=nombre_dincendies&size=1`;
  const r = await timedFetch(u);
  let v = tryJson(r.body)?.results?.[0]?.nombre_dincendies;
  inc.push({ insee: c.insee, nom: c.nom, ademe: v ?? null, bdiff: bdiff[c.insee]?.n ?? 0, bdiff1ha: bdiff[c.insee]?.n1ha ?? 0, statut: r.status });
  await sleep(60);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ genere: new Date().toISOString(), stabilite, incendiesAdemeContreBdiff: inc }, null, 1));
console.log(`stabilité : ${stabilite.length} points ; incendies : ${inc.length} communes`);

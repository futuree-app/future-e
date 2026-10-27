#!/usr/bin/env node
/**
 * FUT-82 — combien de LOGEMENTS chaque candidate « signale »-t-elle ? (lecture seule, bornée)
 *
 * Doctrine du projet : un signal qui touche presque tout le monde ne trie rien (inondation 86 %,
 * écartée) ; un signal rarissime ne vaut qu'au cas par cas. Avant de recommander une source, on mesure
 * donc la part d'adresses de logements qu'elle marque, au grain où elle serait lue.
 *
 * Méthode (celle de l'audit ABF du 09/07, scripts/research/abf-part-logements.mjs) : communes tirées
 * au prorata de la population (graine fixe) dans l'index du comparateur, puis adresses RÉELLES de
 * logements diagnostiqués (DPE ADEME existants), espacées dans le fichier. Biais nommé : les DPE
 * sur-représentent les biens vendus ou loués récemment. Résultat = part de logements DIAGNOSTIQUÉS.
 *
 *   node scripts/research/fut82/discrimination-logements.mjs [--communes 100] [--par-commune 2] [--graine 8282]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname } from "node:path";
import { timedFetch, tryJson, parseArgs, sleep, rng, pointCql, latencySummary } from "./lib.mjs";

const args = parseArgs(process.argv);
const N = Number(args.communes ?? 100), PAR = Number(args["par-commune"] ?? 2), GRAINE = Number(args.graine ?? 8282);
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/discrimination-logements.json";
const ADEME_DPE = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant";
const BRGM = "https://mapsref.brgm.fr/wxs/georisques/risques";
const WFS = "https://data.geopf.fr/wfs/ows";
const WMS = "https://data.geopf.fr/wms-v/ows";

// ── Tirage pondéré par la population (métropole + outre-mer présents dans l'index) ──────────
const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const communes = index.map((c) => ({ insee: c.insee, nom: c.nom, pop: Number(c.population) || 0 })).filter((c) => c.pop > 0);
const total = communes.reduce((s, c) => s + c.pop, 0);
const cumul = []; let acc = 0; for (const c of communes) { acc += c.pop; cumul.push(acc); }
const alea = rng(GRAINE);
const tirees = new Map();
while (tirees.size < N) {
  const x = alea() * total;
  let lo = 0, hi = cumul.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (cumul[m] < x) lo = m + 1; else hi = m; }
  tirees.set(communes[lo].insee, communes[lo]);
}

async function adresses(insee, n) {
  const qs = encodeURIComponent(`code_insee_ban:"${insee}"`);
  const j = tryJson((await timedFetch(`${ADEME_DPE}/lines?qs=${qs}&size=${n * 10}&select=adresse_ban,_geopoint`)).body);
  const rs = j?.results ?? [];
  const pas = Math.max(1, Math.floor(rs.length / n)), out = [];
  for (let i = 0; i < rs.length && out.length < n; i += pas) {
    const [lat, lon] = String(rs[i]._geopoint ?? "").split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ lat, lon });
  }
  return out;
}

// ── Lectures (mêmes règles que sondes-adresses.mjs) ─────────────────────────────────────────
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
  const r = await timedFetch(`${BRGM}?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:REMNAPPE&MAXFEATURES=200&BBOX=${lat - d},${lon - d},${lat + d},${lon + d},urn:ogc:def:crs:EPSG::4326`, { timeoutMs: 45000 });
  if (!r.ok || /Exception/.test(r.body)) return { ms: r.ms, erreur: true };
  for (const m of r.body.matchAll(/<ms:REMNAPPE [\s\S]*?<\/ms:REMNAPPE>/g)) {
    const g = m[0];
    const rings = [...g.matchAll(/<gml:posList[^>]*>([^<]+)<\/gml:posList>/g)].map((x) => { const v = x[1].trim().split(/\s+/).map(Number), ring = []; for (let i = 0; i + 1 < v.length; i += 2) ring.push([v[i], v[i + 1]]); return ring; });
    const [ext, ...trous] = rings;
    if (ext && dansAnneau(lat, lon, ext) && !trous.some((t) => dansAnneau(lat, lon, t))) {
      return { ms: r.ms, gridcode: g.match(/<ms:gridcode>([^<]*)</)?.[1], fiab: g.match(/<ms:fiab_tot>([^<]*)</)?.[1] };
    }
  }
  return { ms: r.ms, gridcode: null };
}
async function wfsN(tn, cql) {
  const p = new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: tn, OUTPUTFORMAT: "application/json", COUNT: "5", CQL_FILTER: cql, RESULTTYPE: "hits" });
  const r = await timedFetch(`${WFS}?${p}`);
  const j = tryJson(r.body);
  return { ms: r.ms, n: j?.numberMatched ?? (r.body.match(/numberMatched="(\d+)"/)?.[1] != null ? Number(r.body.match(/numberMatched="(\d+)"/)[1]) : null) };
}
async function peb(lat, lon) {
  const d = 0.0005;
  const r = await timedFetch(`${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=dgac_peb_plan_wmsv&QUERY_LAYERS=dgac_peb_plan_wmsv&CRS=EPSG:4326&BBOX=${lat - d},${lon - d},${lat + d},${lon + d}&WIDTH=11&HEIGHT=11&I=5&J=5&INFO_FORMAT=application/json&STYLES=&FEATURE_COUNT=5`);
  return { ms: r.ms, zones: tryJson(r.body)?.features?.map((f) => f.properties.zone) ?? null };
}
async function fcu(lat, lon) {
  const r = await timedFetch(`https://france-chaleur-urbaine.beta.gouv.fr/api/v1/eligibility?lat=${lat}&lon=${lon}`);
  const j = tryJson(r.body);
  return { ms: r.ms, eligible: j?.isEligible ?? null, distance: j?.distance ?? null, pdp: j?.inPDP ?? null };
}

// --recalcul <json> : recalcule les parts depuis les points bruts d'une mesure existante, sans réseau.
// Sert quand une règle de lecture change après coup (cas réel : la classe « ni l'un ni l'autre » porte
// le code 0, pas 3 ; corrigé le 27/10/2026 après la première exécution).
const points = args.recalcul ? JSON.parse(readFileSync(args.recalcul, "utf8")).points : [];
for (const c of args.recalcul ? [] : tirees.values()) {
  for (const a of await adresses(c.insee, PAR)) {
    const { lat, lon } = a;
    const p = { insee: c.insee, nom: c.nom, pop: c.pop };
    p.nappe = await nappe(lat, lon); await sleep(100);
    const pt3857 = pointCql(lat, lon, "3857");
    p.natura = (await wfsN("patrinat_sic:sic", `INTERSECTS(geom,${pt3857})`)).n + (await wfsN("patrinat_zps:zps", `INTERSECTS(geom,${pt3857})`)).n;
    p.pnr = (await wfsN("patrinat_pnr:pnr", `INTERSECTS(geom,${pt3857})`)).n;
    p.pn = (await wfsN("patrinat_pn:parc_national", `INTERSECTS(geom,${pt3857})`)).n;
    p.znieff = (await wfsN("patrinat_znieff1:znieff1", `INTERSECTS(geom,${pt3857})`)).n + (await wfsN("patrinat_znieff2:znieff2", `INTERSECTS(geom,${pt3857})`)).n;
    p.ligne100m = (await wfsN("BDTOPO_V3:ligne_electrique", `DWITHIN(geometrie,${pointCql(lat, lon, "4326")},100,meters)`)).n;
    p.ligne300m = (await wfsN("BDTOPO_V3:ligne_electrique", `DWITHIN(geometrie,${pointCql(lat, lon, "4326")},300,meters)`)).n;
    p.old = (await wfsN("DEBROUSSAILLEMENT:debroussaillement", `INTERSECTS(geom,${pointCql(lat, lon, "2154")})`)).n;
    p.peb = await peb(lat, lon);
    p.fcu = await fcu(lat, lon);
    points.push(p);
    process.stderr.write(`${points.length} ${c.nom}: nappe=${p.nappe.gridcode ?? "∅"} natura=${p.natura} pnr=${p.pnr} znieff=${p.znieff} l300=${p.ligne300m} old=${p.old} peb=${p.peb.zones?.join(",") || "-"} fcu=${p.fcu.eligible}\n`);
    await sleep(150);
  }
}

const n = points.length;
const part = (f) => ({ n: points.filter(f).length, pct: Math.round((1000 * points.filter(f).length) / n) / 10 });
const res = {
  genere: new Date().toISOString(), graine: GRAINE, communesTirees: new Set(points.map((p) => p.insee)).size, adresses: n,
  ...(args.recalcul ? { recalculeDepuis: "points bruts de la première exécution (parts recalculées après correction du code de classe 0)" } : {}),
  biais: "Adresses de logements DIAGNOSTIQUÉS (DPE existants ADEME), communes tirées au prorata de la population. Pas une statistique nationale du parc.",
  parts: {
    nappe_debordement: part((p) => p.nappe.gridcode === "1"),
    nappe_cave: part((p) => p.nappe.gridcode === "2"),
    // gridcode : 1 = débordement de nappe, 2 = inondation de cave, 0 = ni l'un ni l'autre (vérifié sur le WFS).
    nappe_ni_lun_ni_lautre: part((p) => p.nappe.gridcode === "0"),
    nappe_hors_carte_ou_masque: part((p) => !p.nappe.erreur && p.nappe.gridcode == null),
    nappe_erreur: part((p) => p.nappe.erreur),
    nappe_signal_fiabilite_forte: part((p) => ["1", "2"].includes(p.nappe.gridcode) && p.nappe.fiab === "FORTE"),
    // Règle de lecture de Géorisques (vérifiée 25/25 sur l'échantillon) : « sujet » en fiabilité FAIBLE → « Risque inconnu ».
    nappe_signal_fiabilite_moyenne_ou_forte: part((p) => ["1", "2"].includes(p.nappe.gridcode) && ["FORTE", "MOYENNE"].includes(p.nappe.fiab)),
    nappe_signal_fiabilite_faible: part((p) => ["1", "2"].includes(p.nappe.gridcode) && p.nappe.fiab === "FAIBLE"),
    nappe_debordement_fiabilite_moyenne_ou_forte: part((p) => p.nappe.gridcode === "1" && ["FORTE", "MOYENNE"].includes(p.nappe.fiab)),
    nappe_debordement_fiabilite_forte: part((p) => p.nappe.gridcode === "1" && p.nappe.fiab === "FORTE"),
    natura2000: part((p) => p.natura > 0),
    pnr: part((p) => p.pnr > 0),
    parc_national: part((p) => p.pn > 0),
    znieff: part((p) => p.znieff > 0),
    ligne_ht_100m: part((p) => p.ligne100m > 0),
    ligne_ht_300m: part((p) => p.ligne300m > 0),
    debroussaillement_old: part((p) => p.old > 0),
    peb_toutes_zones: part((p) => p.peb.zones?.length > 0),
    peb_zones_A_B_C: part((p) => p.peb.zones?.some((z) => ["A", "B", "C"].includes(z))),
    fcu_eligible: part((p) => p.fcu.eligible === true),
    fcu_pdp: part((p) => p.fcu.pdp === true),
  },
  latences: {
    nappe: latencySummary(points.map((p) => p.nappe.ms)),
    peb: latencySummary(points.map((p) => p.peb.ms)),
    fcu: latencySummary(points.map((p) => p.fcu.ms)),
  },
  points,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, points: undefined }, null, 1));

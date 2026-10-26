#!/usr/bin/env node
/**
 * FUT-81 — Mesure du chemin ADRESSE BAN -> PARCELLE -> DOCUMENT D'URBANISME -> ZONE -> PRESCRIPTIONS
 * -> RÈGLEMENT, sur un échantillon borné et contrasté d'adresses réelles.
 *
 * Lecture seule, API publiques sans clé (BAN, API Carto cadastre et GPU, API du Géoportail de
 * l'urbanisme). Volume borné : environ 15 appels par adresse, en série, avec une pause entre adresses.
 *
 * Il ne conclut rien sur la valeur produit : il établit ce qui est publié, à quel grain, avec quelle
 * ambiguïté et en combien de temps. Le rapport d'arbitrage le lit.
 *
 *   node scripts/research/fut81-urbanisme-parcelle.mjs --out docs/audits/2026-10-26-fut81-urbanisme/mesure.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { urlRechercheBan, urlReverseBan } from "../../src/lib/geocodeur-ban.ts";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const OUT = args.out ?? "tmp/fut81/mesure.json";
const CARTO = "https://apicarto.ign.fr/api";
const GPU_SITE = "https://www.geoportail-urbanisme.gouv.fr";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Échantillon : chaque cas vise une situation du cahier FUT-81. `q` passe par la BAN. */
const CAS = [
  { id: "centre-plui-psmv", vise: "Centre-ville, PLUi, secteur sauvegardé", q: "12 rue du Palais 17000 La Rochelle" },
  { id: "paris-marais", vise: "Centre-ville, PLU communal et PSMV", q: "14 rue des Francs-Bourgeois 75003 Paris" },
  { id: "residentiel-blagnac", vise: "Quartier résidentiel périurbain, PLUi-H", q: "8 avenue des Pins 31700 Blagnac" },
  { id: "residentiel-bourg-la-reine", vise: "Quartier résidentiel, PLU communal (Île-de-France)", q: "15 avenue du Général Leclerc 92340 Bourg-la-Reine" },
  { id: "plui-rennes", vise: "Commune couverte par un PLUi métropolitain", q: "12 rue de la Chalotais 35510 Cesson-Sévigné" },
  { id: "lyon-croix-rousse", vise: "Prescriptions patrimoniales et zone voisine en limite", q: "10 rue d'Austerlitz 69004 Lyon" },
  { id: "chamonix", vise: "Montagne, PLU communal", rev: [6.8694, 45.9237] },
  { id: "rural-bonnat", vise: "Bourg rural, PLUi", q: "3 rue de la Paix 23220 Bonnat" },
  { id: "cc-vauquois", vise: "Carte communale", q: "1 rue d’Orleans 55270 Vauquois" },
  { id: "rnu-chatelard", vise: "RNU", rev: "23055" },
  { id: "sans-doc-grandvals", vise: "Hors RNU mais aucun document versé au GPU (voie seule à la BAN)", q: "rue de l'École 48260 Grandvals" },
];
/** Une adresse BAN : par recherche (`q`), ou au numéro le plus proche d'un point ou du centre d'une commune (`rev`). */
async function geocoder(cas) {
  if (cas.q) return (await getJson(urlRechercheBan({ q: cas.q, limit: 1 }))).json.features?.[0] ?? null;
  let [lon, lat] = Array.isArray(cas.rev) ? cas.rev : [];
  if (typeof cas.rev === "string") {
    [lon, lat] = (await getJson(`https://geo.api.gouv.fr/communes/${cas.rev}?fields=centre`)).json.centre.coordinates;
  }
  const numero = (await getJson(urlReverseBan({ lon, lat, type: "housenumber", limit: 1 }))).json.features?.[0];
  // Petites communes : la BAN n'y porte parfois que des voies ou des lieux-dits.
  return numero ?? (await getJson(urlReverseBan({ lon, lat, limit: 1 }))).json.features?.[0] ?? null;
}

/** Tirage reproductible : communes pondérées par leur population, un point près de leur centre. */
async function tirage(n, graine) {
  let x = graine >>> 0;
  const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const communes = (await getJson("https://geo.api.gouv.fr/communes?fields=code,nom,centre,population&format=json")).json
    .filter((c) => c.centre && c.population);
  const total = communes.reduce((a, c) => a + c.population, 0);
  const cas = [];
  for (let i = 0; i < n; i++) {
    let t = rnd() * total;
    const c = communes.find((k) => (t -= k.population) < 0) ?? communes.at(-1);
    const [lon, lat] = c.centre.coordinates;
    // Décalage aléatoire de quelques centaines de mètres : on ne veut pas que la mairie.
    cas.push({ id: `alea-${i + 1}-${c.code}`, vise: `Tirage pondéré : ${c.nom}`, rev: [lon + (rnd() - 0.5) * 0.012, lat + (rnd() - 0.5) * 0.008] });
  }
  return cas;
}

async function timed(fn) {
  const t0 = performance.now();
  try {
    const value = await fn();
    return { ms: Math.round(performance.now() - t0), value, ok: true };
  } catch (e) {
    return { ms: Math.round(performance.now() - t0), value: null, ok: false, error: String(e?.message ?? e) };
  }
}

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return { json: JSON.parse(text), bytes: text.length };
}

const geomParam = (g) => encodeURIComponent(JSON.stringify(g));

async function carto(endpoint, geom) {
  const { json, bytes } = await getJson(`${CARTO}/${endpoint}?geom=${geomParam(geom)}`);
  return { features: json.features ?? [], bytes };
}

// ── Géométrie (calcul dérivé, approximatif) ───────────────────────────────────────────────────
// Projection locale équirectangulaire : suffisante à l'échelle d'une parcelle.
function rings(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates];
  if (geom.type === "MultiPolygon") return geom.coordinates;
  return [];
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeom(lon, lat, geom) {
  return rings(geom).some((poly) => inRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => inRing(lon, lat, h)));
}
/** Part de la parcelle couverte par chaque géométrie, par échantillonnage d'une grille de points. */
function parts(parcelGeom, zones, n = 40) {
  const pts = rings(parcelGeom).flatMap((p) => p[0]);
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const inside = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const lon = x0 + ((i + 0.5) / n) * (x1 - x0);
      const lat = y0 + ((j + 0.5) / n) * (y1 - y0);
      if (inGeom(lon, lat, parcelGeom)) inside.push([lon, lat]);
    }
  }
  return zones.map((z) => (inside.length ? inside.filter(([lo, la]) => inGeom(lo, la, z)).length / inside.length : null));
}

function square(lon, lat, m) {
  const dLat = m / 111_320;
  const dLon = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { type: "Polygon", coordinates: [[[lon - dLon, lat - dLat], [lon + dLon, lat - dLat], [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat]]] };
}

async function mesurer(cas) {
  const r = { id: cas.id, vise: cas.vise, q: cas.q, temps: {} };
  const ban = await timed(() => geocoder(cas));
  r.temps.ban = ban.ms;
  const f = ban.value;
  if (!f) return { ...r, echec: "adresse non géocodée" };
  const [lon, lat] = f.geometry.coordinates;
  r.adresse = { label: f.properties.label, type: f.properties.type, score: f.properties.score, citycode: f.properties.citycode, lon, lat };
  const pt = { type: "Point", coordinates: [lon, lat] };

  // 1. Parcelle au point, puis repli 3/8/15 m sur la plus petite parcelle (comme `cadastre.ts`), et
  // parcelles à moins de 5 m (ambiguïté adresse -> parcelle).
  const parc = await timed(async () => {
    const auPoint = (await carto("cadastre/parcelle", pt)).features[0];
    if (auPoint) return { f: auPoint, rattachement: "point" };
    for (const m of [3, 8, 15]) {
      const fs = (await carto("cadastre/parcelle", square(lon, lat, m))).features;
      if (fs.length) return { f: fs.sort((a, b) => (a.properties.contenance ?? Infinity) - (b.properties.contenance ?? Infinity))[0], rattachement: "repli", rayon: m };
    }
    return null;
  });
  r.temps.cadastre = parc.ms;
  const p = parc.value?.f;
  const proches = await timed(() => carto("cadastre/parcelle", square(lon, lat, 5)));
  r.parcellesA5m = proches.value?.features?.map((x) => x.properties.idu) ?? null;
  r.parcelle = p ? { idu: p.properties.idu, contenance: p.properties.contenance, rattachement: parc.value.rattachement, rayon: parc.value.rayon ?? null } : null;
  const parcelGeom = p?.geometry ?? null;
  const g = parcelGeom ?? pt; // sans parcelle : on retombe sur le point (grain plus faible).

  // 2. Régime de la commune (RNU) et documents.
  const [muni, docsPt, docsParc] = await Promise.all([
    timed(() => carto("gpu/municipality", pt)),
    timed(() => carto("gpu/document", pt)),
    timed(() => carto("gpu/document", g)),
  ]);
  r.temps.municipality = muni.ms;
  r.temps.document = docsPt.ms;
  r.commune = muni.value?.features?.map((x) => ({ insee: x.properties.insee, nom: x.properties.name, rnu: x.properties.is_rnu })) ?? null;
  const docs = docsParc.value?.features ?? [];
  r.documents = docs.map((d) => ({ id: d.properties.gpu_doc_id, type: d.properties.du_type, titre: d.properties.grid_title, nom: d.properties.name, statut: d.properties.gpu_status, maj: d.properties.gpu_timestamp }));
  r.documentsAuPoint = docsPt.value?.features?.length ?? null;

  // 3. Zones, secteurs de carte communale, prescriptions, informations : à la PARCELLE.
  const [zones, secteurs, psurf, plin, ppct, isurf] = await Promise.all([
    timed(() => carto("gpu/zone-urba", g)),
    timed(() => carto("gpu/secteur-cc", g)),
    timed(() => carto("gpu/prescription-surf", g)),
    timed(() => carto("gpu/prescription-lin", g)),
    timed(() => carto("gpu/prescription-pct", g)),
    timed(() => carto("gpu/info-surf", g)),
  ]);
  Object.assign(r.temps, { zone: zones.ms, secteur: secteurs.ms, prescSurf: psurf.ms, prescLin: plin.ms, prescPct: ppct.ms, infoSurf: isurf.ms });
  r.octets = { zone: zones.value?.bytes, prescSurf: psurf.value?.bytes };
  const zf = zones.value?.features ?? [];
  const zParts = parcelGeom ? parts(parcelGeom, zf.map((z) => z.geometry)) : zf.map(() => null);
  r.zones = zf.map((z, i) => ({
    libelle: z.properties.libelle, libelong: z.properties.libelong, typezone: z.properties.typezone,
    destdomi: z.properties.destdomi, datvalid: z.properties.datvalid, datappro: z.properties.datappro,
    nomfic: z.properties.nomfic, urlfic: z.properties.urlfic, doc: z.properties.gpu_doc_id,
    part: zParts[i] == null ? null : Math.round(zParts[i] * 1000) / 10,
  }));
  r.zoneAuPoint = parcelGeom
    ? zf.filter((z) => inGeom(lon, lat, z.geometry)).map((z) => z.properties.libelle)
    : null;
  const sf = secteurs.value?.features ?? [];
  r.secteursCC = sf.map((s, i) => ({ libelle: s.properties.libelle, libelong: s.properties.libelong, typesect: s.properties.typesect, part: parcelGeom ? Math.round((parts(parcelGeom, [s.geometry])[0] ?? 0) * 1000) / 10 : null, i }));
  const presc = (res, forme) => (res.value?.features ?? []).map((x) => ({
    forme, libelle: x.properties.libelle, typepsc: x.properties.typepsc, stypepsc: x.properties.stypepsc,
    txt: x.properties.txt, urlfic: x.properties.urlfic, nomfic: x.properties.nomfic,
    part: forme === "surf" && parcelGeom ? Math.round((parts(parcelGeom, [x.geometry])[0] ?? 0) * 1000) / 10 : null,
  }));
  r.prescriptions = [...presc(psurf, "surf"), ...presc(plin, "lin"), ...presc(ppct, "pct")];
  r.informations = (isurf.value?.features ?? []).map((x) => ({ libelle: x.properties.libelle, typeinf: x.properties.typeinf, stypeinf: x.properties.stypeinf }));
  r.echecs = Object.entries({ zones, secteurs, psurf, plin, ppct, isurf, muni, docsParc }).filter(([, v]) => !v.ok).map(([k, v]) => `${k}: ${v.error}`);

  // 4. Détail officiel de chaque document : statut juridique, date, pièces, règlement écrit.
  r.details = [];
  for (const d of r.documents) {
    const det = await timed(() => getJson(`${GPU_SITE}/api/document/${d.id}/details`));
    r.temps.details = (r.temps.details ?? 0) + det.ms;
    const j = det.value?.json;
    if (!j) { r.details.push({ id: d.id, echec: det.error }); continue; }
    const files = await timed(() => getJson(`${GPU_SITE}/api/document/${d.id}/files`));
    const pieces = files.value?.json ?? [];
    const reglements = pieces.filter((x) => /r[eè]glement/i.test(`${x.title} ${x.name}`) && !/graphique/i.test(`${x.title} ${x.name}`));
    let reglementHttp = null;
    if (reglements[0]) {
      const head = await timed(async () => (await fetch(`${GPU_SITE}/api/document/${d.id}/files/${encodeURIComponent(reglements[0].name)}`, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15_000) })).status);
      reglementHttp = head.value;
    }
    r.details.push({
      id: d.id, type: j.type, titre: j.title, legalStatus: j.legalStatus, effectiveStatus: j.effectiveStatus,
      publication: j.publicationDate, producteur: j.producer, nbPieces: pieces.length,
      reglements: reglements.map((x) => ({ name: x.name, title: x.title })), reglementHttp,
    });
  }
  r.temps.totalGpu = ["municipality", "document", "zone", "secteur", "prescSurf", "prescLin", "prescPct", "infoSurf"].reduce((a, k) => Math.max(a, r.temps[k] ?? 0), 0) + (r.temps.details ?? 0);
  return r;
}

const resultats = [];
const LISTE = args.aleatoire ? await tirage(Number(args.aleatoire), Number(args.graine ?? 81)) : CAS;
for (const cas of LISTE) {
  const r = await mesurer(cas);
  resultats.push(r);
  const z = (r.zones ?? []).map((x) => `${x.libelle}${x.part != null ? ` ${x.part}%` : ""}`).join(", ");
  console.log(`${cas.id.padEnd(22)} ${r.adresse?.label ?? "?"} | parcelle ${r.parcelle?.idu ?? "-"} ${r.parcelle?.rattachement ?? ""} (${r.parcellesA5m?.length ?? "?"} à 5 m) | rnu ${r.commune?.[0]?.rnu} | docs ${r.documents?.map((d) => d.type).join("+") || "aucun"} | zones ${z || "-"} | CC ${r.secteursCC?.map((s) => s.libelle).join(",") || "-"} | presc ${r.prescriptions?.length ?? 0} | ${r.temps.totalGpu} ms`);
  await sleep(400);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ mesureLe: new Date().toISOString(), resultats }, null, 2));
console.log(`\n-> ${OUT}`);

#!/usr/bin/env node
/**
 * FUT-81 — Capture les réponses BRUTES du cadastre et du Géoportail de l'urbanisme pour quelques
 * adresses réelles, dans `src/lib/__fixtures__/fut81/`. Les tests et le banc `/dev/fut81` les
 * rejouent par les fonctions de production, sans réseau.
 *
 * Lecture seule, API publiques sans clé, une dizaine d'appels par adresse.
 *
 *   node scripts/research/fut81-capture-fixtures.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { urlRechercheBan } from "../../src/lib/geocodeur-ban.ts";

const OUT = "src/lib/__fixtures__/fut81";
const CARTO = "https://apicarto.ign.fr/api";
const GPU_SITE = "https://www.geoportail-urbanisme.gouv.fr";

const CAS = {
  "lyon-croix-rousse": "10 rue d'Austerlitz 69004 Lyon",
  "six-fours-emplacement-reserve": "1682 avenue du Brusc 83140 Six-Fours-les-Plages",
  "merignac-deux-zones": "14 avenue Ariane 33700 Mérignac",
  "moissy-zone-unique": "80 rue de la Mauve 77550 Moissy-Cramayel",
  "la-rochelle-psmv": "12 rue du Palais 17000 La Rochelle",
  "vauquois-carte-communale": "1 rue d’Orleans 55270 Vauquois",
  "chatelard-rnu": "3 impasse du bois d'ardon 23700 Châtelard",
  "grandvals-sans-document": "rue de l'École 48260 Grandvals",
};

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000), headers: { accept: "application/json", "content-type": "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}
const post = (endpoint, geom) => getJson(`${CARTO}/${endpoint}`, { method: "POST", body: JSON.stringify({ geom }) });
const arrondi = (v) => (Array.isArray(v) ? v.map(arrondi) : typeof v === "number" ? Math.round(v * 1e7) / 1e7 : v);
// Découpe d'un anneau par un rectangle (Sutherland-Hodgman) : exacte, et l'intersection avec la
// parcelle, contenue dans le rectangle, est inchangée. Elle ramène une zone de plusieurs km² à son coin.
function clipRing(ring, [x0, y0, x1, y1]) {
  let out = ring;
  const bords = [
    (p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1,
  ];
  const coupe = [
    (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1],
  ];
  for (let k = 0; k < 4; k++) {
    const entree = out;
    out = [];
    for (let i = 0; i < entree.length; i++) {
      const a = entree[i];
      const b = entree[(i + 1) % entree.length];
      const ina = bords[k](a);
      const inb = bords[k](b);
      if (ina) out.push(a);
      if (ina !== inb) out.push(coupe[k](a, b));
    }
    if (!out.length) return [];
  }
  return out.length >= 3 ? [...out, out[0]] : [];
}
function clipGeom(g, rect) {
  if (!g || !rect) return g;
  if (g.type === "Point") return g;
  if (g.type === "LineString" || g.type === "MultiLineString") return g; // lignes : gardées entières
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const coupes = polys.map((poly) => poly.map((r) => clipRing(r.slice(0, -1), rect)).filter((r, i) => i === 0 || r.length)).filter((poly) => poly[0]?.length);
  return { type: "MultiPolygon", coordinates: coupes };
}
let RECT = null;
const sansGeomLourde = (fc) => ({ features: (fc.features ?? []).map((f) => ({ properties: f.properties, geometry: f.geometry ? (() => { const c = clipGeom(f.geometry, RECT); return { type: c.type, coordinates: arrondi(c.coordinates) }; })() : null })) });
function square(lon, lat, m) {
  const dLat = m / 111_320;
  const dLon = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { type: "Polygon", coordinates: [[[lon - dLon, lat - dLat], [lon + dLon, lat - dLat], [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat]]] };
}

mkdirSync(OUT, { recursive: true });
for (const [cle, q] of Object.entries(CAS)) {
  const ban = (await getJson(urlRechercheBan({ q, limit: 1 }))).features[0];
  const [lon, lat] = ban.geometry.coordinates;
  const point = { type: "Point", coordinates: [lon, lat] };
  // Même rattachement que `cadastre.ts` : au point, puis repli 3/8/15 m sur la plus petite parcelle.
  let parcelle = (await post("cadastre/parcelle", point)).features?.[0];
  let rattachement = "point";
  for (const m of [3, 8, 15]) {
    if (parcelle) break;
    const fs = (await post("cadastre/parcelle", square(lon, lat, m))).features ?? [];
    parcelle = fs.sort((a, b) => (a.properties.contenance ?? Infinity) - (b.properties.contenance ?? Infinity))[0];
    rattachement = "repli";
  }
  const geom = parcelle?.geometry ?? point;
  const pts = (parcelle?.geometry?.coordinates ?? []).flat(2);
  const marge = 20 / 111_320;
  RECT = pts.length ? [Math.min(...pts.map((p) => p[0])) - marge * 1.5, Math.min(...pts.map((p) => p[1])) - marge, Math.max(...pts.map((p) => p[0])) + marge * 1.5, Math.max(...pts.map((p) => p[1])) + marge] : null;
  const [municipality, document, zone, secteur, psurf, plin, ppct] = await Promise.all([
    post("gpu/municipality", point), post("gpu/document", geom), post("gpu/zone-urba", geom), post("gpu/secteur-cc", geom),
    post("gpu/prescription-surf", geom), post("gpu/prescription-lin", geom), post("gpu/prescription-pct", geom),
  ]);
  const details = {};
  const files = {};
  for (const d of document.features ?? []) {
    const id = d.properties.gpu_doc_id;
    details[id] = await getJson(`${GPU_SITE}/api/document/${id}/details`);
    files[id] = await getJson(`${GPU_SITE}/api/document/${id}/files`);
    delete details[id].writingMaterials; // redondant avec `files`
  }
  const fixture = {
    capture: new Date().toISOString(), q, ban: { id: ban.properties.id, label: ban.properties.label, citycode: ban.properties.citycode, lon, lat },
    parcelle: parcelle ? { properties: parcelle.properties, geometry: { type: parcelle.geometry.type, coordinates: arrondi(parcelle.geometry.coordinates) }, rattachement } : null,
    municipality: sansGeomLourde({ features: (municipality.features ?? []).map((f) => ({ properties: f.properties })) }),
    document: { features: (document.features ?? []).map((f) => ({ properties: f.properties })) },
    zone: sansGeomLourde(zone), secteur: sansGeomLourde(secteur),
    prescriptionSurf: sansGeomLourde(psurf), prescriptionLin: sansGeomLourde(plin), prescriptionPct: sansGeomLourde(ppct),
    details, files,
  };
  const texte = JSON.stringify(fixture);
  writeFileSync(`${OUT}/${cle}.json`, texte);
  console.log(cle.padEnd(32), ban.properties.label, `${Math.round(texte.length / 1024)} Ko`);
}

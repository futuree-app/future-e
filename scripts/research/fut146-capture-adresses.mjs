#!/usr/bin/env node
/**
 * FUT-146 — Capture les réponses BRUTES de la BAN et du cadastre pour les adresses de recette du bruit
 * aérien, dans `src/lib/__fixtures__/fut146/`. Les tests les rejouent par `lireBruitAerien`, contre la
 * copie officielle `data/bruit-aerien.json`, sans réseau : les zones attendues viennent du fichier DGAC,
 * jamais d'une valeur écrite à la main.
 *
 * Les adresses ont été choisies le 27/10/2026 en interrogeant la BAN autour de chaque aérodrome, puis en
 * lisant chaque adresse trouvée dans le fichier officiel (aucun zonage présumé).
 *
 * Lecture seule, API publiques sans clé, deux à cinq appels par adresse.
 *
 *   node scripts/research/fut146-capture-adresses.mjs [--seul a,b]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { urlRechercheBan } from "../../src/lib/geocodeur-ban.ts";
import { distanceRegion, projectionAutour, regionDe } from "../../src/lib/geometrie-parcelle.ts";

const OUT = "src/lib/__fixtures__/fut146";
const CARTO = "https://apicarto.ign.fr/api";

export const CAS = {
  // Marignane (aéroport Marseille-Provence) : la paire de l'audit FUT-82, et ses voisins.
  "marignane-zone-c": "20 Rue Henri Guillaumet 13700 Marignane",
  "marignane-hors-zone": "4 Rue Raphael Duca 13700 Marignane",
  "marignane-limite-c-d": "26 Lotissement Clos Saint-Marc 13700 Marignane",
  "marignane-zone-c-pgs": "19 Boulevard Francois Berenguer 13700 Marignane",
  "marignane-zone-a": "55 Impasse de la Piste 13700 Marignane",
  // Albi (aérodrome du Séquestre) : la seconde paire de l'audit.
  "albi-zone-d": "13 Rue Bir Hakeim 81000 Albi",
  "albi-hors-zone": "13 Quai Choiseul 81000 Albi",
  // La Rochelle (aéroport de La Rochelle-Île de Ré) : déterminé depuis le fichier, sans présumer.
  "la-rochelle-zone-c": "45 Rue de la Bergerie 17000 La Rochelle",
  "la-rochelle-limite-c-d": "20 Rue de la Bergerie 17000 La Rochelle",
  "la-rochelle-centre": "12 rue du Palais 17000 La Rochelle",
  // Orly et Roissy : plusieurs zones et un PGS.
  "villeneuve-le-roi": "12 Avenue de la République 94290 Villeneuve-le-Roi",
  "goussainville": "1 Rue de la Gare 95190 Goussainville",
  // Géocodage à la rue : la lecture décrit un secteur.
  "marignane-rue-seule": "Rue Henri Guillaumet 13700 Marignane",
  // Loin de tout aérodrome.
  "mende-centre": "1 Place Urbain V 48000 Mende",
};
const seul = process.argv.includes("--seul") ? process.argv[process.argv.indexOf("--seul") + 1].split(",") : null;

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000), headers: { accept: "application/json", "content-type": "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}
const post = (endpoint, geom, limite) => getJson(`${CARTO}/${endpoint}${limite ? `?_limit=${limite}` : ""}`, { method: "POST", body: JSON.stringify({ geom }) });
const arrondi = (v) => (Array.isArray(v) ? v.map(arrondi) : typeof v === "number" ? Math.round(v * 1e7) / 1e7 : v);
const distance = (lon, lat, g) => { const r = regionDe(g, projectionAutour(lon, lat)); return r ? distanceRegion([0, 0], r) : Infinity; };
function square(lon, lat, m) {
  const dLat = m / 111_320;
  const dLon = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { type: "Polygon", coordinates: [[[lon - dLon, lat - dLat], [lon + dLon, lat - dLat], [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat]]] };
}
const parcelleBrute = (f) => ({ properties: { idu: f.properties.idu, contenance: f.properties.contenance }, geometry: { type: f.geometry.type, coordinates: arrondi(f.geometry.coordinates) } });

mkdirSync(OUT, { recursive: true });
for (const [cle, q] of Object.entries(CAS)) {
  if (seul && !seul.includes(cle)) continue;
  const ban = (await getJson(urlRechercheBan({ q, limit: 1 }))).features[0];
  const [lon, lat] = ban.geometry.coordinates;
  // Même rattachement que `cadastre.ts` : deux résultats au point (une limite les touche tous les deux),
  // puis repli 3/8/15 m sur la parcelle la plus proche.
  const auPoint = (await post("cadastre/parcelle", { type: "Point", coordinates: [lon, lat] }, 2)).features ?? [];
  let parcelle = auPoint[0] ?? null;
  let rattachement = "point";
  let distanceM;
  for (const m of [3, 8, 15]) {
    if (parcelle) break;
    const fs = (await post("cadastre/parcelle", square(lon, lat, m), 8)).features ?? [];
    const proche = fs.map((f) => ({ f, d: distance(lon, lat, f.geometry) }))
      .sort((a, b) => (Math.abs(a.d - b.d) > 0.01 ? a.d - b.d : (a.f.properties.contenance ?? Infinity) - (b.f.properties.contenance ?? Infinity)))[0];
    parcelle = proche?.f ?? null;
    distanceM = proche ? Math.round(proche.d * 10) / 10 : undefined;
    rattachement = "repli";
  }
  const fixture = {
    capture: new Date().toISOString(), q,
    ban: { id: ban.properties.id, label: ban.properties.label, type: ban.properties.type, citycode: ban.properties.citycode, score: ban.properties.score, lon, lat },
    parcelle: parcelle ? {
      ...parcelleBrute(parcelle), rattachement,
      candidatsAuPoint: new Set(auPoint.map((f) => f.properties.idu)).size || undefined,
      ...(distanceM != null ? { distanceM } : {}),
    } : null,
  };
  writeFileSync(`${OUT}/${cle}.json`, JSON.stringify(fixture));
  console.log(cle.padEnd(26), ban.properties.type.padEnd(12), ban.properties.label, parcelle ? `· parcelle ${parcelle.properties.idu} (${rattachement})` : "· sans parcelle");
}

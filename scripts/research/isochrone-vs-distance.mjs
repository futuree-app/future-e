#!/usr/bin/env node
/**
 * Sept des 28 criteres de futur.e mesurent l'acces par une DISTANCE a vol d'oiseau
 * (haversine, rayons adaptatifs). Le trajet reel suit des routes, contourne des reliefs,
 * et s'arrete a la mer.
 *
 * Ce script mesure l'ecart, sans le supposer : pour chaque commune, il demande a l'IGN
 * l'isochrone « 15 minutes en voiture », calcule son aire, et en deduit le RAYON EQUIVALENT
 * (le rayon du disque de meme aire). Si ce rayon varie fortement d'une commune a l'autre,
 * alors un rayon fixe biaise les criteres d'acces, geographiquement.
 *
 *   node scripts/research/isochrone-vs-distance.mjs --minutes 15 --n 24
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const MINUTES = Number(args.minutes ?? 15);
const N = Number(args.n ?? 24);
const OUT = args.out ?? "tmp/fil/isochrone.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Aire d'un polygone lat/lon, en km2. Projection equirectangulaire locale : l'erreur est
 * negligeable a l'echelle d'un isochrone de quelques dizaines de km.
 */
function aireKm2(coords, lat0) {
  const R = 6371;
  const rad = Math.PI / 180;
  const cos0 = Math.cos(lat0 * rad);
  let somme = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lonA, latA] = coords[i];
    const [lonB, latB] = coords[(i + 1) % coords.length];
    const xA = lonA * rad * cos0 * R;
    const yA = latA * rad * R;
    const xB = lonB * rad * cos0 * R;
    const yB = latB * rad * R;
    somme += xA * yB - xB * yA;
  }
  return Math.abs(somme / 2);
}

async function isochrone(lat, lon, attempt = 0) {
  const url =
    `https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla` +
    `&point=${lon},${lat}&costValue=${MINUTES * 60}&costType=time&profile=car&direction=departure`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(40_000) });
    if (!res.ok) {
      if (res.status === 429 && attempt < 3) {
        await sleep(3000 * (attempt + 1));
        return isochrone(lat, lon, attempt + 1);
      }
      return null;
    }
    const j = await res.json();
    const g = j.geometry;
    if (!g) return null;
    // L'IGN rend un Polygon, parfois un MultiPolygon : on somme les anneaux exterieurs.
    const rings = g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]);
    return rings.reduce((t, r) => t + aireKm2(r, lat), 0);
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return isochrone(lat, lon, attempt + 1);
    }
    return null;
  }
}

const idx = JSON.parse(readFileSync("data/comparateur-index.json", "utf8"));
const communes = (Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray)).filter((c) => c.lat && c.lon);

/** Un echantillon volontairement contraste : relief, littoral, plaine, ville. */
const cible = [
  ["75056", "Paris"], ["13055", "Marseille"], ["17300", "La Rochelle"], ["31555", "Toulouse"],
  ["74010", "Annecy"], ["05061", "Gap"], ["73011", "Albertville"], ["64445", "Pau"],
  ["29232", "Quimper"], ["50129", "Cherbourg"], ["2A004", "Ajaccio"], ["2B033", "Bastia"],
  ["51454", "Reims"], ["45234", "Orléans"], ["36044", "Châteauroux"], ["15014", "Aurillac"],
  ["48095", "Mende"], ["09122", "Foix"], ["68066", "Colmar"], ["59350", "Lille"],
  ["83137", "Toulon"], ["06088", "Nice"], ["76540", "Rouen"], ["87085", "Limoges"],
].slice(0, N);

const rows = [];
for (const [insee, nom] of cible) {
  const c = communes.find((x) => x.insee === insee);
  if (!c) { process.stderr.write(`${nom}: absente de l'index\n`); continue; }
  const aire = await isochrone(c.lat, c.lon);
  if (aire === null) {
    rows.push({ insee, nom, fetch_status: "partial_or_failed" });
    process.stderr.write(`${nom}: ECHEC\n`);
    continue;
  }
  const rayonEq = Math.sqrt(aire / Math.PI);
  rows.push({ insee, nom, altitude: c.altitude ?? null, cote_km: c.distance_cote_km ?? null,
    aire_km2: Math.round(aire), rayon_equivalent_km: Number(rayonEq.toFixed(1)), fetch_status: "ok" });
  process.stderr.write(`${nom}: ${Math.round(aire)} km2, rayon eq. ${rayonEq.toFixed(1)} km\n`);
  await sleep(400);
}

const ok = rows.filter((r) => r.fetch_status === "ok").sort((a, b) => b.rayon_equivalent_km - a.rayon_equivalent_km);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ minutes: MINUTES, rows }, null, 1));

console.log(`\nisochrone ${MINUTES} min en voiture, ${ok.length} communes\n`);
console.log(`  commune            rayon equivalent   aire      altitude  cote`);
for (const r of ok) {
  console.log(
    `  ${r.nom.padEnd(16)} ${String(r.rayon_equivalent_km).padStart(8)} km ${String(r.aire_km2).padStart(9)} km2` +
      `${String(r.altitude ?? "-").padStart(9)} m ${String(r.cote_km == null ? "-" : Math.round(r.cote_km)).padStart(6)} km`,
  );
}
const rayons = ok.map((r) => r.rayon_equivalent_km);
const min = Math.min(...rayons);
const max = Math.max(...rayons);
console.log(`\n  rayon equivalent : de ${min} km a ${max} km  (facteur ${(max / min).toFixed(1)})`);
console.log(`  un rayon FIXE de 15 km surestime l'acces des communes basses (${min} km reels)`);
console.log(`  et sous-estime celui des communes bien desservies (${max} km reels)`);
console.log(`\necrit : ${OUT}`);

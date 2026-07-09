#!/usr/bin/env node
/**
 * Sept criteres d'acces de futur.e (acces_soins, acces_services, acces_ecoles, acces_culture,
 * acces_transports, mobilite_quotidienne, faible_dependance_auto) mesurent la proximite par une
 * DISTANCE A VOL D'OISEAU. Le trajet reel suit des routes.
 *
 * L'ecart se nomme l'INDICE DE DETOUR : distance routiere / distance a vol d'oiseau.
 * S'il etait constant, le vol d'oiseau serait un bon proxy (a un facteur pres). Ce script mesure
 * s'il varie, et de combien, selon la geographie.
 *
 * Pour chaque commune de l'echantillon : la ville de plus de 50 000 habitants la plus proche a vol
 * d'oiseau, puis l'itineraire reel (IGN, bdtopo-osrm).
 *
 *   node scripts/research/detour-routier.mjs --n 40 --out tmp/fil/detour.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const N = Number(args.n ?? 40);
const OUT = args.out ?? "tmp/fil/detour.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const haversineKm = (a, b) => {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

async function itineraire(a, b, attempt = 0) {
  const url =
    `https://data.geopf.fr/navigation/itineraire?resource=bdtopo-osrm` +
    `&start=${a.lon},${a.lat}&end=${b.lon},${b.lat}&profile=car&optimization=fastest`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(40_000) });
    if (!res.ok) {
      if (res.status === 429 && attempt < 3) {
        await sleep(3000 * (attempt + 1));
        return itineraire(a, b, attempt + 1);
      }
      return null;
    }
    const j = await res.json();
    if (typeof j.distance !== "number") return null;
    return { km: j.distance / 1000, minutes: j.duration / 60 };
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return itineraire(a, b, attempt + 1);
    }
    return null;
  }
}

const idx = JSON.parse(readFileSync("data/comparateur-index.json", "utf8"));
const all = (Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray)).filter((c) => c.lat && c.lon);
const poles = all.filter((c) => (c.population ?? 0) >= 50_000);

// Echantillon au prorata de la population, comme les autres spikes : on mesure le lecteur.
const total = all.reduce((t, c) => t + (c.population ?? 0), 0);
const step = total / N;
const sample = [];
let cursor = step / 2;
let cum = 0;
for (const c of all) {
  cum += c.population ?? 0;
  while (cum >= cursor && sample.length < N) {
    sample.push(c);
    cursor += step;
  }
}

const rows = [];
for (const c of sample) {
  // Le pole le plus proche, hors la commune elle-meme.
  let pole = null;
  let best = Infinity;
  for (const p of poles) {
    if (p.insee === c.insee) continue;
    const d = haversineKm(c, p);
    if (d < best) { best = d; pole = p; }
  }
  if (!pole || best > 150) continue;

  const route = await itineraire(c, pole);
  if (!route) {
    rows.push({ insee: c.insee, nom: c.nom, fetch_status: "partial_or_failed" });
    process.stderr.write(`${c.nom}: ECHEC\n`);
    await sleep(300);
    continue;
  }
  const detour = route.km / best;
  rows.push({ insee: c.insee, nom: c.nom, population: c.population, altitude: c.altitude ?? null,
    cote_km: c.distance_cote_km ?? null, pole: pole.nom,
    vol_oiseau_km: Number(best.toFixed(1)), route_km: Number(route.km.toFixed(1)),
    minutes: Number(route.minutes.toFixed(0)), detour: Number(detour.toFixed(2)), fetch_status: "ok" });
  process.stderr.write(`${c.nom} -> ${pole.nom}: detour ${detour.toFixed(2)}\n`);
  await sleep(350);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ rows }, null, 1));

const detours = ok.map((r) => r.detour).sort((a, b) => a - b);
const med = detours[Math.floor(detours.length / 2)];
console.log(`\nindice de detour (route / vol d'oiseau), ${ok.length} communes\n`);
console.log(`  mediane : ${med.toFixed(2)}`);
console.log(`  p10 : ${detours[Math.floor(detours.length * 0.1)].toFixed(2)}   p90 : ${detours[Math.floor(detours.length * 0.9)].toFixed(2)}`);
console.log(`  min : ${detours[0].toFixed(2)}   max : ${detours[detours.length - 1].toFixed(2)}`);

const tri = [...ok].sort((a, b) => b.detour - a.detour);
console.log(`\n  les plus penalisees par le vol d'oiseau :`);
for (const r of tri.slice(0, 6)) {
  console.log(`    ${r.nom.slice(0, 20).padEnd(20)} detour ${r.detour.toFixed(2)}  ${r.vol_oiseau_km} km -> ${r.route_km} km (${r.minutes} min)  alt ${r.altitude ?? "-"} m`);
}
console.log(`\n  les mieux servies :`);
for (const r of tri.slice(-4).reverse()) {
  console.log(`    ${r.nom.slice(0, 20).padEnd(20)} detour ${r.detour.toFixed(2)}  ${r.vol_oiseau_km} km -> ${r.route_km} km (${r.minutes} min)`);
}
console.log(`\n  ecart max/min : facteur ${(detours[detours.length - 1] / detours[0]).toFixed(1)}`);
console.log(`\necrit : ${OUT}`);

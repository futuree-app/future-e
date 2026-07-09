#!/usr/bin/env node
/**
 * Mesure, pour un echantillon de communes tire au sort en proportion de la POPULATION
 * (donc representatif d'un lecteur, pas d'une commune), combien de SIS / SUP se trouvent
 * a portee d'une adresse : rayons 200 m, 500 m, 1000 m autour du centre communal.
 *
 * Repond a : « une adresse de lecteur a-t-elle une servitude dans son voisinage ? »
 * Le centre communal est un PROXY d'adresse urbaine : il surestime pour les communes
 * etalees, il sous-estime pour les peripheries industrielles. C'est une borne, pas une verite.
 *
 *   node scripts/research/sup-sis-proximite.mjs --n 120 --out tmp/fil/sup-sis-proximite.json
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const N = Number(args.n ?? 120);
const OUT = args.out ?? "tmp/fil/sup-sis-proximite.json";
const RAYONS = [200, 500, 1000];
const BASE = "https://www.georisques.gouv.fr/api/v1/ssp";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const idx = JSON.parse(readFileSync("data/comparateur-index.json", "utf8"));
const communes = (Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray)).filter(
  (c) => c.lat && c.lon && (c.population ?? 0) > 0,
);

/**
 * Tirage proportionnel a la population, sans Math.random : on parcourt le cumul de population
 * par pas regulier. Deterministe, reproductible, et non biaise vers les petites communes.
 */
function sampleByPopulation(list, n) {
  const total = list.reduce((t, c) => t + c.population, 0);
  const step = total / n;
  const out = [];
  let cursor = step / 2;
  let cum = 0;
  for (const c of list) {
    cum += c.population;
    while (cum >= cursor && out.length < n) {
      out.push(c);
      cursor += step;
    }
  }
  return out;
}

async function count(layer, lat, lon, rayon, attempt = 0) {
  const url = `${BASE}/${layer}?latlon=${lon},${lat}&rayon=${rayon}&page_size=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (res.status === 429 && attempt < 4) {
      await sleep(2500 * (attempt + 1));
      return count(layer, lat, lon, rayon, attempt + 1);
    }
    if (!res.ok) return null;
    const j = await res.json();
    return j.results ?? 0;
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return count(layer, lat, lon, rayon, attempt + 1);
    }
    return null;
  }
}

const sample = sampleByPopulation(communes, N);
const rows = [];
for (const c of sample) {
  const row = { insee: c.insee, nom: c.nom, population: c.population };
  let failed = false;
  for (const r of RAYONS) {
    const [sup, sis] = await Promise.all([
      count("conclusions_sup", c.lat, c.lon, r),
      count("conclusions_sis", c.lat, c.lon, r),
    ]);
    if (sup === null || sis === null) failed = true;
    row[`sup_${r}`] = sup;
    row[`sis_${r}`] = sis;
    await sleep(150);
  }
  row.fetch_status = failed ? "partial_or_failed" : "ok";
  rows.push(row);
  process.stderr.write(`${c.nom}: ${row.sis_500 ?? "?"} SIS @500m\n`);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ n: rows.length, ok: ok.length, rayons: RAYONS, rows }, null, 1));

console.log(`\nechantillon : ${rows.length} communes tirees au prorata de la population (ok: ${ok.length})\n`);
for (const r of RAYONS) {
  const hit = ok.filter((x) => x[`sis_${r}`] + x[`sup_${r}`] > 0).length;
  const supHit = ok.filter((x) => x[`sup_${r}`] > 0).length;
  console.log(
    `  rayon ${String(r).padStart(4)} m : ${String(hit).padStart(3)}/${ok.length} communes ont >=1 servitude ` +
      `(${((hit / ok.length) * 100).toFixed(0)} %)   dont SUP : ${supHit}`,
  );
}
console.log(`\necrit : ${OUT}`);

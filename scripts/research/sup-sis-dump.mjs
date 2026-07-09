#!/usr/bin/env node
/**
 * Telecharge le stock national SUP + SIS (Georisques /ssp/conclusions_*) departement par
 * departement, sans les geometries, et le rapporte a la commune.
 *
 * But du spike : mesurer la COUVERTURE (combien de communes, quelle population, quelle surface),
 * pas encore construire une brique produit.
 *
 *   node scripts/research/sup-sis-dump.mjs --out tmp/fil/sup-sis-communes.json
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const OUT = args.out ?? "tmp/fil/sup-sis-communes.json";
const BASE = "https://www.georisques.gouv.fr/api/v1/ssp";
const PAGE = 100;

const DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 76 }, (_, i) => String(i + 21).padStart(2, "0")).filter((d) => d <= "95"),
  "971", "972", "973", "974", "976",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(layer, dept, page, attempt = 0) {
  const url = `${BASE}/${layer}?code_departement=${dept}&page=${page}&page_size=${PAGE}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429 && attempt < 4) {
      await sleep(2500 * (attempt + 1));
      return fetchPage(layer, dept, page, attempt + 1);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    if (attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return fetchPage(layer, dept, page, attempt + 1);
    }
    return null;
  }
}

/** Le champ `geom` pese lourd et ne sert pas au comptage : on ne garde que ce qu'on mesure. */
const slim = (x, layer) => ({
  layer: layer === "conclusions_sup" ? "SUP" : "SIS",
  insee: x.code_insee, commune: x.nom_commune, nom: x.nom,
  superficie_m2: Number(x.superficie) || 0, date_maj: x.date_maj, adresse: x.adresse,
});

const all = [];
let failed = 0;
for (const layer of ["conclusions_sup", "conclusions_sis"]) {
  for (const dept of DEPTS) {
    const first = await fetchPage(layer, dept, 1);
    if (!first) { failed++; continue; }
    const total = first.results ?? 0;
    if (!total) continue;
    all.push(...(first.data ?? []).map((x) => slim(x, layer)));
    const pages = Math.ceil(total / PAGE);
    for (let p = 2; p <= pages; p++) {
      const j = await fetchPage(layer, dept, p);
      if (!j) { failed++; continue; }
      all.push(...(j.data ?? []).map((x) => slim(x, layer)));
      await sleep(200);
    }
    process.stderr.write(`${layer} ${dept}: ${total}\n`);
    await sleep(200);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: BASE, failed_requests: failed, records: all }, null, 1));

const byInsee = new Map();
for (const r of all) {
  const cur = byInsee.get(r.insee) ?? { sup: 0, sis: 0, m2: 0 };
  cur[r.layer.toLowerCase()]++;
  cur.m2 += r.superficie_m2;
  byInsee.set(r.insee, cur);
}
console.log(`\nenregistrements : ${all.length} (requetes en echec : ${failed})`);
console.log(`communes touchees : ${byInsee.size}`);
console.log(`surface totale : ${(all.reduce((t, r) => t + r.superficie_m2, 0) / 1e6).toFixed(1)} km2`);
console.log(`ecrit : ${OUT}`);

#!/usr/bin/env node
/**
 * Recense le stock national des Servitudes d'Utilite Publique (SUP) et des Secteurs
 * d'Information sur les Sols (SIS) exposes par Georisques, departement par departement.
 *
 * Question a laquelle ce script repond : le stock est-il recuperable, et a quel grain ?
 * Il ne juge rien. Il compte, et il ecrit ce qu'il a vu.
 *
 *   node scripts/research/sup-sis-stock.mjs --out tmp/fil/sup-sis-stock.json
 *
 * Sortie : JSON detaille + resume stdout. Un departement en echec vaut `null`, jamais 0,
 * pour ne pas confondre un fetch rate avec une absence de servitude.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const OUT = args.out ?? "tmp/fil/sup-sis-stock.json";
const BASE = "https://www.georisques.gouv.fr/api/v1/ssp";

// 01..95 sans la Corse metropolitaine (2A/2B a la place de 20), plus l'outre-mer.
const DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 76 }, (_, i) => String(i + 21).padStart(2, "0")).filter((d) => d <= "95"),
  "971", "972", "973", "974", "976",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Un seul appel page_size=1 suffit : `results` porte le total, pas la page. */
async function count(layer, dept, attempt = 0) {
  const url = `${BASE}/${layer}?code_departement=${dept}&page_size=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (res.status === 429 && attempt < 4) {
      await sleep(2000 * (attempt + 1));
      return count(layer, dept, attempt + 1);
    }
    if (!res.ok) return null;
    const json = await res.json();
    const node = json.results !== undefined ? json : Object.values(json).find((v) => v && typeof v === "object" && "results" in v);
    return node?.results ?? null;
  } catch {
    if (attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return count(layer, dept, attempt + 1);
    }
    return null;
  }
}

const rows = [];
for (const dept of DEPTS) {
  const [sup, sis] = await Promise.all([count("conclusions_sup", dept), count("conclusions_sis", dept)]);
  rows.push({ dept, sup, sis, fetch_status: sup === null || sis === null ? "partial_or_failed" : "ok" });
  process.stderr.write(`${dept}: sup=${sup ?? "?"} sis=${sis ?? "?"}\n`);
  await sleep(250);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
const sum = (k) => ok.reduce((t, r) => t + r[k], 0);
const totalSup = sum("sup");
const totalSis = sum("sis");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ generated_for: "spike Le Fil / servitudes", source: BASE, rows,
  totals: { departements_ok: ok.length, departements_failed: rows.length - ok.length, sup: totalSup, sis: totalSis } }, null, 2));

console.log(`\ndepartements interroges : ${rows.length} (ok: ${ok.length}, echecs: ${rows.length - ok.length})`);
console.log(`STOCK NATIONAL SUP : ${totalSup}`);
console.log(`STOCK NATIONAL SIS : ${totalSis}`);
console.log(`\ntop 8 departements (SUP+SIS) :`);
for (const r of [...ok].sort((a, b) => b.sup + b.sis - (a.sup + a.sis)).slice(0, 8)) {
  console.log(`  ${r.dept}  sup=${String(r.sup).padStart(4)}  sis=${String(r.sis).padStart(5)}`);
}
console.log(`\necrit : ${OUT}`);

#!/usr/bin/env node
/**
 * Le DPE « logements neufs » (ADEME) comme substitut de Sitadel : un DPE neuf est un logement
 * LIVRE, date, geolocalise a l'adresse BAN. C'est la seule source ouverte qui dise « ce qui se
 * construit autour de chez vous », avec une API.
 *
 * Mesure, sur l'echantillon de communes tire au prorata de la population :
 *   - combien de logements neufs livres sur 12 mois ;
 *   - combien de communes franchissent un seuil de visibilite (>= 10 logements) ;
 *   - a titre de comparaison, le flux des DPE de logements existants (ventes, locations).
 *
 * Ne conclut rien sur la valeur : un logement neuf isole n'est pas un evenement, un lotissement
 * en est un. Le seuil est un choix, pas une verite.
 *
 *   node scripts/research/dpe-neuf-matiere.mjs --out tmp/fil/dpe-neuf.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const OUT = args.out ?? "tmp/fil/dpe-neuf.json";
const DEPUIS = args.depuis ?? "2025-07-09"; // fenetre 12 mois ancree au crawl, pas de Date.now()
const SEUIL = Number(args.seuil ?? 10);

const NEUF = "g3cgx7jb3cmys5voxz1mrm22";
const EXISTANT = "meg-83tjwtg8dyz4vv7h1dqe";
const API = "https://data.ademe.fr/data-fair/api/v1/datasets";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `total` suffit : on ne rapatrie aucune ligne. */
async function compte(dataset, insee, attempt = 0) {
  const qs = encodeURIComponent(`code_insee_ban:"${insee}" AND date_reception_dpe:[${DEPUIS} TO *]`);
  try {
    const res = await fetch(`${API}/${dataset}/lines?qs=${qs}&size=0`, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429 && attempt < 4) {
      await sleep(3000 * (attempt + 1));
      return compte(dataset, insee, attempt + 1);
    }
    if (!res.ok) return null;
    const j = await res.json();
    return j.total ?? null;
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return compte(dataset, insee, attempt + 1);
    }
    return null;
  }
}

const sample = JSON.parse(readFileSync("tmp/fil/sup-sis-proximite.json", "utf8")).rows;
const rows = [];
for (const c of sample) {
  const [neuf, existant] = await Promise.all([compte(NEUF, c.insee), compte(EXISTANT, c.insee)]);
  rows.push({ insee: c.insee, nom: c.nom, population: c.population, neuf, existant,
    fetch_status: neuf === null || existant === null ? "partial_or_failed" : "ok" });
  process.stderr.write(`${c.nom}: neufs=${neuf ?? "?"}\n`);
  await sleep(120);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
const popTot = ok.reduce((t, r) => t + r.population, 0);
const partPop = (pred) => ok.filter(pred).reduce((t, r) => t + r.population, 0) / popTot;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ depuis: DEPUIS, seuil: SEUIL, rows }, null, 1));

const au1 = ok.filter((r) => r.neuf > 0);
const auSeuil = ok.filter((r) => r.neuf >= SEUIL);
console.log(`\nfenetre : depuis le ${DEPUIS} | communes exploitables : ${ok.length}/${rows.length}\n`);
console.log(`  >= 1 logement neuf livre   : ${au1.length}/${ok.length} communes  (${(partPop((r) => r.neuf > 0) * 100).toFixed(0)} % des lecteurs)`);
console.log(`  >= ${SEUIL} logements neufs livres : ${auSeuil.length}/${ok.length} communes  (${(partPop((r) => r.neuf >= SEUIL) * 100).toFixed(0)} % des lecteurs)`);
const neufs = ok.reduce((t, r) => t + r.neuf, 0);
const exist = ok.reduce((t, r) => t + r.existant, 0);
console.log(`\n  total logements neufs livres : ${neufs}`);
console.log(`  total DPE de logements existants : ${exist}  (ventes / locations, pour comparaison)`);
const tri = [...ok].sort((a, b) => a.neuf - b.neuf);
console.log(`  mediane par commune : ${tri[Math.floor(ok.length / 2)].neuf} logements neufs`);
console.log(`\ntop 6 :`);
for (const r of [...ok].sort((a, b) => b.neuf - a.neuf).slice(0, 6)) {
  console.log(`  ${r.nom.slice(0, 22).padEnd(22)} ${String(r.neuf).padStart(4)} neufs  (pop ${r.population.toLocaleString("fr-FR")})`);
}
console.log(`\necrit : ${OUT}`);

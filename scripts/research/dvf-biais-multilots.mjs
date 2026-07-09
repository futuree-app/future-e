#!/usr/bin/env node
/**
 * AUDIT du calcul de prix en production (`scripts/populate-logement.mjs`).
 *
 * Le script de prod deduplique les LIGNES d'une mutation (`if (seen.has(id)) return`) et retient
 * la premiere ligne batie. Or `valeur_fonciere` porte sur la mutation ENTIERE. Quand une vente
 * comprend plusieurs lots (un appartement et sa cave, un immeuble de trois logements), le prix
 * retenu est celui du tout, rapporte a la surface d'un seul lot : le prix/m2 est surestime.
 *
 * Ce script rejoue le meme fichier DVF avec les deux methodes et mesure l'ecart :
 *
 *   A. « prod »   : premiere ligne batie de la mutation, valeur_fonciere du tout.
 *   B. « stricte » : uniquement les mutations a UN seul local bati et AUCUNE dependance.
 *
 * Il ne corrige rien. Il chiffre.
 *
 *   node scripts/research/dvf-biais-multilots.mjs --annee 2024
 */

import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const ANNEE = args.annee ?? "2024";
const OUT = args.out ?? "tmp/fil/dvf-biais.json";
const SEUIL = 10; // le seuil de production

const mediane = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function cellsQuoted(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${ANNEE}/full.csv.gz`;
console.error(`lecture ${url} ...`);
const res = await fetch(url);
if (!res.ok) { console.error(`echec HTTP ${res.status}`); process.exit(1); }
const rl = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity });

let col = null;
let courante = null;
let lots = [];
/** insee -> { A: {maison, appart}, B: {maison, appart} } */
const acc = new Map();
const stats = { mutations: 0, monoLot: 0, multiLot: 0, avecDependance: 0 };

const push = (methode, insee, type, prix) => {
  if (!acc.has(insee)) acc.set(insee, { A: { Maison: [], Appartement: [] }, B: { Maison: [], Appartement: [] } });
  acc.get(insee)[methode][type].push(prix);
};

function vider() {
  if (!lots.length) return;
  stats.mutations++;
  const bati = lots.filter((l) => l.type === "Appartement" || l.type === "Maison");
  const dep = lots.filter((l) => l.type === "Dépendance");
  if (!bati.length) { lots = []; return; }

  // A : ce que fait la prod. Premiere ligne batie, valeur de la mutation entiere.
  const a = bati[0];
  const va = Number(a.valeur);
  const sa = Number(a.surface);
  if (va > 0 && sa > 0) {
    const pm = va / sa;
    if (pm >= 300 && pm <= 20_000) push("A", a.insee, a.type, pm);
  }

  // B : strict. Un seul local bati, aucune dependance.
  if (bati.length === 1 && dep.length === 0) {
    stats.monoLot++;
    if (va > 0 && sa > 0) {
      const pm = va / sa;
      if (pm >= 300 && pm <= 20_000) push("B", a.insee, a.type, pm);
    }
  } else {
    stats.multiLot++;
    if (dep.length) stats.avecDependance++;
  }
  lots = [];
}

let n = 0;
for await (const line of rl) {
  if (!col) {
    const head = cellsQuoted(line);
    col = Object.fromEntries(head.map((h, i) => [h, i]));
    continue;
  }
  if (!line) continue;
  n++;
  const c = cellsQuoted(line);
  if (c[col.nature_mutation] !== "Vente") continue;
  const id = c[col.id_mutation];
  if (id !== courante) { vider(); courante = id; }
  lots.push({ type: c[col.type_local], valeur: c[col.valeur_fonciere], surface: c[col.surface_reelle_bati], insee: c[col.code_commune] });
  if (n % 1_000_000 === 0) console.error(`  ${n.toLocaleString("fr-FR")} lignes...`);
}
vider();

const ecarts = [];
const rows = [];
for (const [insee, m] of acc) {
  for (const type of ["Maison", "Appartement"]) {
    const A = m.A[type];
    const B = m.B[type];
    if (A.length < SEUIL || B.length < SEUIL) continue;
    const mA = mediane(A);
    const mB = mediane(B);
    const ecart = (mA - mB) / mB;
    ecarts.push(ecart);
    rows.push({ insee, type, prod_eur_m2: Math.round(mA), strict_eur_m2: Math.round(mB),
      ecart_pct: Number((ecart * 100).toFixed(1)), n_prod: A.length, n_strict: B.length });
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ annee: ANNEE, stats, rows }, null, 0));

ecarts.sort((a, b) => a - b);
const q = (p) => ecarts[Math.floor(ecarts.length * p)];
console.log(`\nmutations de vente : ${stats.mutations.toLocaleString("fr-FR")}`);
console.log(`  mono-lot sans dependance : ${stats.monoLot.toLocaleString("fr-FR")} (${((stats.monoLot / stats.mutations) * 100).toFixed(0)} %)`);
console.log(`  multi-lots ou avec dependance : ${stats.multiLot.toLocaleString("fr-FR")} (${((stats.multiLot / stats.mutations) * 100).toFixed(0)} %)`);
console.log(`     dont avec une dependance : ${stats.avecDependance.toLocaleString("fr-FR")}`);

console.log(`\necart du prix median : methode prod vs methode stricte, sur ${rows.length} couples (commune, type)`);
console.log(`  mediane : ${(q(0.5) * 100).toFixed(1)} %`);
console.log(`  p10 : ${(q(0.1) * 100).toFixed(1)} %   p90 : ${(q(0.9) * 100).toFixed(1)} %`);
const surestimes = ecarts.filter((e) => e > 0.05).length;
console.log(`  surestimation > 5 % : ${surestimes} / ${ecarts.length} (${((surestimes / ecarts.length) * 100).toFixed(0)} %)`);

rows.sort((a, b) => b.ecart_pct - a.ecart_pct);
console.log(`\n  les plus surestimes :`);
for (const r of rows.slice(0, 6)) {
  console.log(`    ${r.insee} ${r.type.padEnd(12)} prod ${String(r.prod_eur_m2).padStart(6)}  strict ${String(r.strict_eur_m2).padStart(6)}  ${r.ecart_pct > 0 ? "+" : ""}${r.ecart_pct} %`);
}
console.log(`\necrit : ${OUT}`);

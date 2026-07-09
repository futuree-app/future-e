#!/usr/bin/env node
/**
 * DVF (geo-dvf, ventes immobilieres reelles) : la source est-elle exploitable comme CRITERE ?
 *
 * Deux pieges decident de la reponse, et ce script les mesure au lieu de les supposer :
 *
 *  1. MULTI-LOTS. Une mutation peut porter plusieurs biens (un immeuble, un lot + un garage).
 *     `valeur_fonciere` est alors le prix du TOUT, et le diviser par la surface d'un seul local
 *     donne un prix/m2 faux, presque toujours surestime. On ne garde que les mutations a un seul
 *     local bati, sans dependance ni terrain.
 *
 *  2. PETITS EFFECTIFS. Une mediane sur trois ventes n'est pas un prix, c'est du bruit. On mesure
 *     combien de communes atteignent un seuil credible, et ce que ce seuil coute en couverture.
 *
 * Sortie : couverture par seuil, effet du nettoyage multi-lots, prix medians.
 *
 *   node scripts/research/dvf-couverture.mjs --annee 2024 --out tmp/fil/dvf-couverture.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const ANNEE = args.annee ?? "2024";
const OUT = args.out ?? "tmp/fil/dvf-couverture.json";
const BASE = "https://files.data.gouv.fr/geo-dvf/latest/csv";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

/** Parseur CSV tolerant : geo-dvf protege les virgules par des guillemets. */
function parseCsv(text) {
  const lines = text.split("\n");
  const head = lines[0].split(",");
  const out = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') q = !q;
      else if (c === "," && !q) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    out.push(Object.fromEntries(head.map((h, i) => [h, cells[i]])));
  }
  return out;
}

async function ventes(insee) {
  const dept = insee.startsWith("97") ? insee.slice(0, 3) : insee.slice(0, 2);
  const url = `${BASE}/${ANNEE}/communes/${dept}/${insee}.csv`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(40_000), redirect: "follow" });
    if (!res.ok) return null;
    return parseCsv(await res.text());
  } catch {
    return null;
  }
}

/**
 * Une mutation exploitable : une Vente, un seul local bati, ce local est un logement,
 * prix et surface plausibles. Tout le reste est ecarte, et compte comme perte.
 */
function prixParMutation(rows) {
  const parMutation = new Map();
  for (const r of rows) {
    if (!parMutation.has(r.id_mutation)) parMutation.set(r.id_mutation, []);
    parMutation.get(r.id_mutation).push(r);
  }
  const retenus = [];
  let rejetMultiLot = 0;
  let rejetAutre = 0;
  for (const [, lots] of parMutation) {
    const bati = lots.filter((l) => l.type_local === "Appartement" || l.type_local === "Maison");
    const dependances = lots.filter((l) => l.type_local === "Dépendance");
    if (!bati.length) { rejetAutre++; continue; }
    if (lots[0].nature_mutation !== "Vente") { rejetAutre++; continue; }
    // Plusieurs logements, ou un logement + des dependances : la valeur porte sur l'ensemble.
    if (bati.length > 1 || dependances.length) { rejetMultiLot++; continue; }
    const v = Number(lots[0].valeur_fonciere);
    const s = Number(bati[0].surface_reelle_bati);
    if (!(v > 10_000) || !(s >= 9) || v / s > 30_000 || v / s < 200) { rejetAutre++; continue; }
    retenus.push({ type: bati[0].type_local, prix_m2: v / s });
  }
  return { retenus, rejetMultiLot, rejetAutre, mutations: parMutation.size };
}

const sample = JSON.parse(readFileSync("tmp/fil/sup-sis-proximite.json", "utf8")).rows;
const rows = [];
for (const c of sample) {
  const brut = await ventes(c.insee);
  if (!brut) {
    rows.push({ insee: c.insee, nom: c.nom, population: c.population, fetch_status: "partial_or_failed" });
    process.stderr.write(`${c.nom}: ECHEC\n`);
    continue;
  }
  const { retenus, rejetMultiLot, rejetAutre, mutations } = prixParMutation(brut);
  const appt = retenus.filter((r) => r.type === "Appartement").map((r) => r.prix_m2);
  const maison = retenus.filter((r) => r.type === "Maison").map((r) => r.prix_m2);
  rows.push({ insee: c.insee, nom: c.nom, population: c.population, fetch_status: "ok",
    mutations, retenus: retenus.length, rejet_multi_lot: rejetMultiLot, rejet_autre: rejetAutre,
    n_appt: appt.length, n_maison: maison.length,
    prix_m2_appt: mediane(appt), prix_m2_maison: mediane(maison) });
  process.stderr.write(`${c.nom}: ${retenus.length}/${mutations} mutations retenues\n`);
  await sleep(150);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ annee: ANNEE, rows }, null, 1));

const popTot = ok.reduce((t, r) => t + r.population, 0);
const totMut = ok.reduce((t, r) => t + r.mutations, 0);
const totRet = ok.reduce((t, r) => t + r.retenus, 0);
const totML = ok.reduce((t, r) => t + r.rejet_multi_lot, 0);

console.log(`\nannee ${ANNEE} | communes : ${ok.length}/${rows.length}\n`);
console.log(`mutations totales   : ${totMut}`);
console.log(`  retenues          : ${totRet} (${((totRet / totMut) * 100).toFixed(0)} %)`);
console.log(`  rejet multi-lots  : ${totML} (${((totML / totMut) * 100).toFixed(0)} %)  <- le piege qui fausse tout prix/m2 naif`);
console.log(`\ncouverture par seuil d'effectif (logements retenus) :`);
for (const seuil of [1, 10, 30, 50, 100]) {
  const s = ok.filter((r) => r.retenus >= seuil);
  const pop = s.reduce((t, r) => t + r.population, 0);
  console.log(`  >= ${String(seuil).padStart(3)} ventes : ${String(s.length).padStart(3)}/${ok.length} communes  (${((pop / popTot) * 100).toFixed(0)} % des lecteurs)`);
}
const avecPrix = ok.filter((r) => r.prix_m2_appt).map((r) => r.prix_m2_appt);
console.log(`\nprix median au m2 (appartements), sur ${avecPrix.length} communes :`);
console.log(`  mediane des medianes : ${Math.round(mediane(avecPrix)).toLocaleString("fr-FR")} EUR/m2`);
const tri = [...ok].filter((r) => r.prix_m2_appt && r.retenus >= 30).sort((a, b) => b.prix_m2_appt - a.prix_m2_appt);
console.log(`\n  plus cheres :`);
for (const r of tri.slice(0, 4)) console.log(`    ${r.nom.slice(0, 22).padEnd(22)} ${Math.round(r.prix_m2_appt).toLocaleString("fr-FR").padStart(6)} EUR/m2  (n=${r.n_appt})`);
console.log(`  moins cheres :`);
for (const r of tri.slice(-4).reverse()) console.log(`    ${r.nom.slice(0, 22).padEnd(22)} ${Math.round(r.prix_m2_appt).toLocaleString("fr-FR").padStart(6)} EUR/m2  (n=${r.n_appt})`);
console.log(`\necrit : ${OUT}`);

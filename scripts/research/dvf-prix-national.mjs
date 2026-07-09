#!/usr/bin/env node
/**
 * Calcule, pour toutes les communes de France, un prix median au m2 credible, a partir des
 * fichiers DVF nationaux (geo-dvf). Prototype de ce que serait un `populate-prix.mjs`.
 *
 * Trois regles, chacune imposee par une mesure du spike (docs/audits/2026-07-09-inventaire) :
 *
 *  1. MULTI-LOTS ECARTES. ~40 % des mutations portent plusieurs biens : `valeur_fonciere` est le
 *     prix du tout. On ne garde que les mutations a un seul local bati, sans dependance.
 *  2. SEUIL D'EFFECTIF. Une mediane sur trois ventes n'est pas un prix. En dessous du seuil on
 *     n'ecrit PAS de prix : `null` est honnete, une valeur bruitee ne l'est pas.
 *  3. BORNES DE PLAUSIBILITE. Prix/m2 hors [200, 30 000] : erreur de saisie, ecarte.
 *
 * Le millesime le plus recent est prefere. S'il n'atteint pas le seuil, on cumule les annees
 * precedentes, et la commune est marquee `fenetre: "3 ans"` : le prix devient moins actuel, le
 * lecteur doit pouvoir le savoir. Un prix cumule n'est jamais presente comme un prix de l'annee.
 *
 * Les fichiers nationaux font ~88 Mo gzip chacun. Ils sont lus en flux, jamais charges en memoire.
 *
 *   node scripts/research/dvf-prix-national.mjs --annees 2024,2023,2022 --seuil 20
 */

import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
// Ordre significatif : la premiere annee est la plus recente, donc la preferee.
const ANNEES = (args.annees ?? "2024,2023,2022").split(",");
const SEUIL = Number(args.seuil ?? 20);
const OUT = args.out ?? "tmp/fil/prix-communes.json";

const mediane = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

function cells(line) {
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

/** insee -> annee -> { Appartement: number[], Maison: number[] } */
const data = new Map();
const stats = { lignes: 0, mutations: 0, multiLots: 0, retenues: 0 };

async function lireAnnee(annee) {
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${annee}/full.csv.gz`;
  console.error(`\n${annee} : ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  echec HTTP ${res.status}, annee ignoree`);
    return false;
  }
  const rl = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity });

  let col = null;
  let courante = null;
  let lots = [];

  const vider = () => {
    if (!lots.length) return;
    stats.mutations++;
    const bati = lots.filter((l) => l.type === "Appartement" || l.type === "Maison");
    const dep = lots.filter((l) => l.type === "Dépendance");
    if (!bati.length || lots[0].nature !== "Vente") { lots = []; return; }
    if (bati.length > 1 || dep.length) { stats.multiLots++; lots = []; return; }
    const v = Number(lots[0].valeur);
    const s = Number(bati[0].surface);
    if (!(v > 10_000) || !(s >= 9)) { lots = []; return; }
    const prix = v / s;
    if (prix < 200 || prix > 30_000) { lots = []; return; }
    const insee = bati[0].insee;
    if (!data.has(insee)) data.set(insee, new Map());
    const parAnnee = data.get(insee);
    if (!parAnnee.has(annee)) parAnnee.set(annee, { Appartement: [], Maison: [] });
    parAnnee.get(annee)[bati[0].type].push(prix);
    stats.retenues++;
    lots = [];
  };

  for await (const line of rl) {
    if (!col) {
      const head = cells(line);
      col = Object.fromEntries(head.map((h, i) => [h, i]));
      continue;
    }
    if (!line) continue;
    stats.lignes++;
    const c = cells(line);
    const id = c[col.id_mutation];
    if (id !== courante) { vider(); courante = id; }
    lots.push({ nature: c[col.nature_mutation], valeur: c[col.valeur_fonciere], type: c[col.type_local],
      surface: c[col.surface_reelle_bati], insee: c[col.code_commune] });
    if (stats.lignes % 1_000_000 === 0) console.error(`  ${stats.lignes.toLocaleString("fr-FR")} lignes...`);
  }
  vider();
  return true;
}

for (const a of ANNEES) await lireAnnee(a);

/**
 * Pour un type de bien : la fenetre la plus courte qui atteint le seuil.
 * Renvoie null si meme le cumul complet n'y parvient pas.
 */
function prixPourType(parAnnee, type) {
  let cumul = [];
  for (let i = 0; i < ANNEES.length; i++) {
    cumul = cumul.concat(parAnnee.get(ANNEES[i])?.[type] ?? []);
    if (cumul.length >= SEUIL) {
      return { eur_m2: Math.round(mediane(cumul)), n: cumul.length, fenetre: i === 0 ? ANNEES[0] : `${ANNEES[i]}-${ANNEES[0]}` };
    }
  }
  return null;
}

const sortie = {};
let nAnneeCourante = 0;
let nCumul = 0;
for (const [insee, parAnnee] of data) {
  const appt = prixPourType(parAnnee, "Appartement");
  const maison = prixPourType(parAnnee, "Maison");
  if (!appt && !maison) continue;
  sortie[insee] = { appt, maison };
  for (const p of [appt, maison]) {
    if (!p) continue;
    if (p.fenetre === ANNEES[0]) nAnneeCourante++;
    else nCumul++;
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ annees: ANNEES, seuil: SEUIL, communes: sortie }, null, 0));

console.error("");
console.log(`lignes lues       : ${stats.lignes.toLocaleString("fr-FR")}`);
console.log(`mutations         : ${stats.mutations.toLocaleString("fr-FR")}`);
console.log(`  multi-lots ecartes : ${stats.multiLots.toLocaleString("fr-FR")} (${((stats.multiLots / stats.mutations) * 100).toFixed(0)} %)`);
console.log(`  retenues           : ${stats.retenues.toLocaleString("fr-FR")} (${((stats.retenues / stats.mutations) * 100).toFixed(0)} %)`);
console.log(`\ncommunes avec au moins un prix (seuil ${SEUIL}) : ${Object.keys(sortie).length.toLocaleString("fr-FR")}`);
console.log(`  prix sur la seule annee ${ANNEES[0]} : ${nAnneeCourante.toLocaleString("fr-FR")}`);
console.log(`  prix cumule sur plusieurs annees  : ${nCumul.toLocaleString("fr-FR")}  <- moins actuel, a signaler au lecteur`);
console.log(`\necrit : ${OUT}`);

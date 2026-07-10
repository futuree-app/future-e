#!/usr/bin/env node
/**
 * Backtest de la « veille deleguee » (piste E3 du Researcher) sur le seul critere MOBILE de futur.e :
 * le prix.
 *
 * Le spike a montre que les evenements territoriaux sont trop rares pour porter une relation
 * (87 % des communes muettes sur douze mois). Mais le prix bouge chaque annee, partout, dans les
 * deux sens. Une requete permanente du lecteur (« previens-moi quand cette commune passe sous mon
 * budget ») se declenche-t-elle assez souvent pour justifier un contact ?
 *
 * Methode : prix median par commune ET PAR ANNEE (2022 a 2025), puis, pour un budget donne,
 * comptage des FRANCHISSEMENTS de seuil d'une annee a la suivante. Un franchissement est un
 * evenement honnete : la commune est devenue accessible, ou a cesse de l'etre.
 *
 * Meme regle d'agregation que la production corrigee : une vente d'un seul logement, dependances
 * autorisees. Seuil d'effectif pour ne pas prendre du bruit pour un mouvement de marche.
 *
 *   node scripts/research/veille-prix-backtest.mjs --annees 2022,2023,2024,2025 --seuil 20
 */

import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const ANNEES = (args.annees ?? "2022,2023,2024,2025").split(",");
const SEUIL_N = Number(args.seuil ?? 20);
const OUT = args.out ?? "tmp/fil/veille-prix.json";

const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
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

/** annee -> insee -> mediane maison (le type le mieux couvert hors des villes) */
const serie = new Map();

async function lire(annee) {
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${annee}/full.csv.gz`;
  console.error(`${annee}...`);
  const res = await fetch(url);
  if (!res.ok) { console.error(`  HTTP ${res.status}, annee ignoree`); return; }
  const rl = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity });

  let col = null;
  let courante = null;
  let lots = [];
  const acc = new Map();

  const vider = () => {
    if (!lots.length) return;
    const groupe = lots;
    lots = [];
    const logements = groupe.filter((c) => c[col.type_local] === "Maison");
    const autres = groupe.filter((c) => c[col.type_local] === "Appartement");
    if (logements.length !== 1 || autres.length) return; // un seul logement, dependances tolerees
    const v = Number(logements[0][col.valeur_fonciere]);
    const s = Number(logements[0][col.surface_reelle_bati]);
    if (!(v > 10_000) || !(s >= 9)) return;
    const pm = v / s;
    if (pm < 200 || pm > 30_000) return;
    const insee = logements[0][col.code_commune];
    if (!acc.has(insee)) acc.set(insee, []);
    acc.get(insee).push(pm);
  };

  for await (const line of rl) {
    if (!col) {
      const head = cells(line);
      col = Object.fromEntries(head.map((h, i) => [h, i]));
      continue;
    }
    if (!line) continue;
    const c = cells(line);
    if (c[col.nature_mutation] !== "Vente") continue;
    const id = c[col.id_mutation];
    if (id !== courante) { vider(); courante = id; }
    lots.push(c);
  }
  vider();

  const parCommune = new Map();
  for (const [insee, prix] of acc) {
    if (prix.length >= SEUIL_N) parCommune.set(insee, Math.round(mediane(prix)));
  }
  serie.set(annee, parCommune);
  console.error(`  ${parCommune.size} communes avec un prix credible`);
}

for (const a of ANNEES) await lire(a);

// --- volatilite : de combien bouge le prix d'une annee sur l'autre ?
const variations = [];
for (let i = 1; i < ANNEES.length; i++) {
  const avant = serie.get(ANNEES[i - 1]);
  const apres = serie.get(ANNEES[i]);
  if (!avant || !apres) continue;
  for (const [insee, p] of apres) {
    const q = avant.get(insee);
    if (q) variations.push(Math.abs(p - q) / q);
  }
}
variations.sort((a, b) => a - b);

// --- backtest : pour un budget, combien de communes franchissent le seuil chaque annee ?
const SURFACE = 80; // m2 vises
const BUDGETS = [150_000, 200_000, 250_000, 300_000, 400_000];

const resultats = [];
for (const budget of BUDGETS) {
  const seuilM2 = budget / SURFACE;
  let suivies = 0;
  let franchissements = 0;
  const parAnnee = [];
  for (let i = 1; i < ANNEES.length; i++) {
    const avant = serie.get(ANNEES[i - 1]);
    const apres = serie.get(ANNEES[i]);
    if (!avant || !apres) continue;
    let n = 0;
    let bascules = 0;
    for (const [insee, p] of apres) {
      const q = avant.get(insee);
      if (!q) continue;
      n++;
      const etaitAccessible = q <= seuilM2;
      const estAccessible = p <= seuilM2;
      if (etaitAccessible !== estAccessible) bascules++;
    }
    suivies += n;
    franchissements += bascules;
    parAnnee.push({ de: ANNEES[i - 1], a: ANNEES[i], communes: n, franchissements: bascules });
  }
  resultats.push({ budget, seuil_eur_m2: Math.round(seuilM2), suivies, franchissements,
    taux: suivies ? franchissements / suivies : null, parAnnee });
}

mkdirSync(dirname(OUT), { recursive: true });
const serieDump = Object.fromEntries([...serie].map(([a, m]) => [a, Object.fromEntries(m)]));
writeFileSync(OUT, JSON.stringify({ annees: ANNEES, surface_visee: SURFACE, resultats, serie_par_annee: serieDump }, null, 0));

console.log(`\nvolatilite annuelle du prix median (maison), n=${variations.length.toLocaleString("fr-FR")} couples`);
const q = (p) => variations[Math.floor(variations.length * p)];
console.log(`  variation absolue mediane : ${(q(0.5) * 100).toFixed(1)} %   p75 : ${(q(0.75) * 100).toFixed(1)} %   p90 : ${(q(0.9) * 100).toFixed(1)} %`);

console.log(`\nbacktest « previens-moi quand cette commune passe sous mon budget » (${SURFACE} m2 vises)\n`);
console.log(`  budget     seuil     couples    franchissements   taux par commune et par an`);
for (const r of resultats) {
  console.log(
    `  ${(r.budget / 1000).toFixed(0).padStart(5)} k€  ${String(r.seuil_eur_m2).padStart(6)} €/m²  ` +
      `${String(r.suivies).padStart(8)}  ${String(r.franchissements).padStart(10)}        ${((r.taux ?? 0) * 100).toFixed(1)} %`,
  );
}
console.log(`\n  Lecture : une veille sur une seule commune se declenche X fois par an, en moyenne.`);
console.log(`  Un lecteur qui surveille 10 communes multiplie ce taux par 10.`);
console.log(`\necrit : ${OUT}`);

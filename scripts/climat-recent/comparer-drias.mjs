#!/usr/bin/env node
// SAFRAN RETROUVE-T-IL LA RÉFÉRENCE DRIAS ? (FUT-170, contre-revue du 08/11/2026 : rendre la preuve reproductible.)
//
// Sur 1976-2005, la période de référence de DRIAS-TRACC, on compare point par point de la grille :
//   - la référence DRIAS de chaque indicateur, reconstruite par modèle (NOR - A, niveau GWL20 : la référence ne
//     dépend pas du niveau), puis résumée de deux façons : médiane des 17 références, et médiane(NOR) - médiane(A),
//     qui est ce que futur•e stocke dans data_climat.json ;
//   - la moyenne SAFRAN 1976-2005 au même point, avec les mêmes définitions (data/climat-recent/safran-1976-2005.json,
//     produit par scripts/climat-recent/agreger_safran.py 1976 2005).
// Tout vient du dépôt : data/source/ (les 51 fichiers DRIAS) et data/climat-recent/. Aucune dépendance locale.
//
// Usage : node scripts/climat-recent/comparer-drias.mjs            imprime le tableau
//         node scripts/climat-recent/comparer-drias.mjs --ecrire   l'écrit aussi dans data/climat-recent/comparabilite-1976-2005.json
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseDriasFile } from "../build-drias-median.js";

const SAFRAN = "data/climat-recent/safran-1976-2005.json";
const SORTIE = "data/climat-recent/comparabilite-1976-2005.json";
const PAIRES = [
  ["TX35D", "tx35", "Jours Tx >= 35 °C"],
  ["TX30D", "tx30", "Jours Tx >= 30 °C"],
  ["TR", "tr20", "Nuits tropicales (Tn > 20 °C)"],
];

const mediane = (v) => {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const moyenne = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const r = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
function correlation(x, y) {
  const mx = moyenne(x), my = moyenne(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
const quantile = (v, q) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(q * v.length))];

async function main() {
  const safran = JSON.parse(readFileSync(SAFRAN, "utf8"));
  if (safran.schema !== 2 || safran.periode.join() !== "1976,2005") throw new Error(`${SAFRAN} : schéma ou période inattendus`);
  const fichiers = readdirSync("data/source").filter((f) => f.endsWith(".txt")).sort();
  if (fichiers.length !== 51) throw new Error(`51 fichiers DRIAS attendus, ${fichiers.length} trouvés`);
  const gwl20 = [];
  for (const f of fichiers) {
    const p = await parseDriasFile(path.join("data", "source", f));
    if (p.scenario === "gwl20") gwl20.push(p);
  }
  if (gwl20.length !== 17) throw new Error(`17 modèles GWL20 attendus, ${gwl20.length}`);

  const points = Object.keys(safran.points);
  const resultats = [];
  for (const [ind, cle, libelle] of PAIRES) {
    for (const mode of ["mediane_des_references", "futuree_med_NOR_moins_med_A"]) {
      const d = [], s = [];
      for (const pid of points) {
        const lignes = gwl20.map((m) => m.records.get(pid)).filter(Boolean);
        if (lignes.length !== 17) throw new Error(`point ${pid} : ${lignes.length} modèles`);
        const nor = lignes.map((l) => l[`NOR${ind}_yr`]), a = lignes.map((l) => l[`A${ind}_yr`]);
        if (nor.some((v) => v == null) || a.some((v) => v == null)) throw new Error(`point ${pid} : ${ind} manquant`);
        d.push(mode === "mediane_des_references" ? mediane(nor.map((v, i) => v - a[i])) : mediane(nor) - mediane(a));
        s.push(moyenne(safran.points[pid][cle]));
      }
      const ecarts = d.map((v, i) => v - s[i]);
      const abs = ecarts.map(Math.abs);
      resultats.push({
        indicateur: libelle, drias: ind, safran: cle, reference: mode, points: points.length,
        moyenne_drias: r(moyenne(d)), moyenne_safran: r(moyenne(s)),
        biais_moyen_drias_moins_safran: r(moyenne(ecarts)), ecart_absolu_moyen: r(moyenne(abs)),
        ecart_absolu_p95: r(quantile(abs, 0.95)), ecart_absolu_max: r(Math.max(...abs)),
        correlation: r(correlation(d, s), 4),
      });
    }
  }
  console.table(resultats.map(({ indicateur, reference, biais_moyen_drias_moins_safran: b, ecart_absolu_p95: p95, correlation: c }) => ({ indicateur, reference, biais: b, p95, correlation: c })));
  if (process.argv.includes("--ecrire")) {
    writeFileSync(SORTIE, JSON.stringify({
      schema: 1, periode: [1976, 2005],
      entrees: { safran: SAFRAN, safran_sha256: safran.source.fichiers.map((f) => f.sha256), drias: "data/source/*.txt (GWL20, 17 modèles)" },
      resultats,
    }, null, 1) + "\n");
    console.log(`écrit : ${SORTIE}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

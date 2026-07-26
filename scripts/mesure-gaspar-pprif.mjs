// MESURE : de quoi le « risque feu de forêt recensé » est-il fait ?
//
// La question qu'elle a tranchée. `ORDRE_AMBIANT` plaçait le feu recensé devant la chaleur, au nom de la
// doctrine « à matérialité décisionnelle COMPARABLE, un constat établi et directement vérifiable prime une
// projection ». Rien ne vérifiait la condition : un recensement communal binaire ne dit ni l'intensité, ni
// l'étendue, ni la distance à l'habitat. Quarante nuits tropicales projetées pourraient peser davantage.
//
// RÉSULTAT (26/07/2026, 88 communes) : 97,7 % n'ont AUCUN PPRIF, 1,1 % un PPRIF opposable. La condition
// n'était pas remplie, l'ordre a été inversé. Rapport complet et méthode :
// `docs/mesures/2026-07-25-gaspar-risque-feu.md`.
//
// La qualification mesurable la plus proche de « suffisamment important pour la décision » est le PPR
// Incendie de Forêt (`modeleProcedure: "PPRN-IF"`), et surtout son caractère OPPOSABLE :
//
//   - aucun PPRIF                       : mention communale large
//   - PPRIF prescrit, sans SUP ni zonage : procédure en cours, rien d'opposable encore
//   - PPRIF avec SUP + zonage            : servitude d'utilité publique — ça change ce qu'on peut
//                                          construire, et ça se vérifie en mairie
//
// Entrée : le corpus des 500 communes de mesure-gaspar-feu.mjs (JSON écrit par son 3e argument).
import { readFileSync, writeFileSync } from "node:fs";
import { riskFlagsFromLabels } from "../src/lib/georisques-flags.ts";

const corpus = JSON.parse(readFileSync(process.argv[2], "utf8"))
  .filter((r) => r.labels != null && riskFlagsFromLabels(r.labels).wildfire);

async function pprn(insee) {
  const url = `https://georisques.gouv.fr/api/v1/gaspar/pprn?codeInsee=${insee}&page_size=50`;
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(25000) });
      if (r.status === 429) { await new Promise((res) => setTimeout(res, 2000 * (essai + 1))); continue; }
      if (!r.ok) return null;
      return (await r.json())?.content ?? [];
    } catch { await new Promise((res) => setTimeout(res, 1000 * (essai + 1))); }
  }
  return null;
}

const res = [];
const file = [...corpus];
let fait = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (file.length) {
    const c = file.pop();
    const plans = await pprn(c.insee);
    res.push({ ...c, plans });
    if (++fait % 20 === 0) process.stderr.write(`${fait} `);
  }
}));

const lus = res.filter((r) => r.plans != null);
// Un PPRIF est OPPOSABLE quand il porte une servitude d'utilité publique ET un zonage réglementaire :
// c'est à ce moment qu'il contraint réellement ce qu'on peut bâtir sur une parcelle.
const ifDe = (r) => (r.plans ?? []).filter((p) => p.modeleProcedure === "PPRN-IF");
const opposable = (p) => p.supExists === true && p.zonageReglementaire?.zoneRegExists === true;

const aucun = lus.filter((r) => ifDe(r).length === 0);
const prescrit = lus.filter((r) => ifDe(r).length > 0 && !ifDe(r).some(opposable));
const oppose = lus.filter((r) => ifDe(r).some(opposable));
const pc = (n) => `${(n / lus.length * 100).toFixed(1)} %`;

console.log(`\n\nDE QUOI EST FAIT LE « RISQUE FEU RECENSÉ » — ${lus.length} communes (sur ${corpus.length})\n`);
console.log(`  aucun PPRIF (mention communale)     ${String(aucun.length).padStart(3)}   ${pc(aucun.length)}`);
console.log(`  PPRIF prescrit, non opposable       ${String(prescrit.length).padStart(3)}   ${pc(prescrit.length)}`);
console.log(`  PPRIF OPPOSABLE (SUP + zonage)      ${String(oppose.length).padStart(3)}   ${pc(oppose.length)}`);
console.log(`\n  → qualifié (prescrit ou opposable) : ${pc(prescrit.length + oppose.length)}`);

console.log(`\nEXEMPLES DE COMMUNES SANS AUCUN PPRIF (le cas qui affaiblirait la préséance) :`);
for (const r of aucun.slice(0, 6)) console.log(`  ${r.insee}  ${(r.plans ?? []).map((p) => p.modeleProcedure).join(", ") || "aucun plan"}`);

if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(res, null, 1));

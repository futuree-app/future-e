// MESURE : quelle est la fréquence nationale du risque « Feu de forêt » recensé par GASPAR ?
//
// La question qu'elle tranche : ce risque, aujourd'hui lu par la seule règle DÉCLARÉE, peut-il devenir un
// constat non demandé sans reproduire le bavardage qu'on vient de fermer ? La minute n'a qu'UNE place
// ambiante. Si le risque est recensé dans un dossier sur deux, il la prendrait presque toujours.
//
// Échantillon aléatoire REPRODUCTIBLE (PRNG à graine fixe) sur les communes de France métropolitaine et
// d'outre-mer présentes dans data/communes-population.json.
import { readFileSync, writeFileSync } from "node:fs";
import { riskFlagsFromLabels } from "../src/lib/georisques-flags.ts";

const N = Number(process.argv[2] ?? 400);
const pop = JSON.parse(readFileSync("data/communes-population.json", "utf8"));
const codes = Object.keys(pop).sort(); // tri => ordre déterministe avant tirage

// PRNG mulberry32, graine fixe : le même échantillon à chaque exécution, donc une mesure rejouable.
let s = 20260725;
const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const tirage = [...codes];
for (let i = tirage.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [tirage[i], tirage[j]] = [tirage[j], tirage[i]]; }
const echantillon = tirage.slice(0, N);

// LA DÉTECTION EST CELLE DU PRODUIT, IMPORTÉE et non recopiée.
//
// Premier jet : la normalisation était recopiée ici, et le libellé brut passait à la regex. « Feu de
// forêt » ne correspond pas à /forets?/ — l'accent circonflexe — et la mesure annonçait 0 % là où la
// distribution brute affichait 6,7 %. La faute même que ce chantier documente, refaite dans l'outil
// chargé de la mesurer.
//
// Une normalisation recopiée dans un script d'audit permet la pire des combinaisons : un moteur correct,
// une mesure fausse, et une décision produit prise sur cette mesure. En important la dérivation du
// produit, le script ne peut plus diverger — il compte exactement ce que le produit lit.
// (D'où l'exécution avec `node --experimental-strip-types`.)
const estFeuLot = (labels) => riskFlagsFromLabels(labels).wildfire;

async function risques(insee) {
  const url = `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${insee}`;
  for (let essai = 0; essai < 3; essai++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { await new Promise((res) => setTimeout(res, 2000 * (essai + 1))); continue; }
      if (!r.ok) return null;
      const j = await r.json();
      return (j?.data ?? []).flatMap((d) => (d.risques_detail ?? []).map((x) => x.libelle_risque_long ?? x.libelle_risque ?? ""));
    } catch { await new Promise((res) => setTimeout(res, 1000 * (essai + 1))); }
  }
  return null;
}

const res = [];
const CONC = 6;
let fait = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (echantillon.length) {
    const insee = echantillon.pop();
    const labels = await risques(insee);
    res.push({ insee, labels, pop: pop[insee]?.population ?? 0 });
    if (++fait % 50 === 0) process.stderr.write(`${fait} `);
  }
}));

const lus = res.filter((r) => r.labels != null);
const feu = lus.filter((r) => estFeuLot(r.labels));
const popTot = lus.reduce((a, r) => a + r.pop, 0), popFeu = feu.reduce((a, r) => a + r.pop, 0);

// Toutes les familles observées, pour situer le feu par rapport aux autres risques.
const freq = new Map();
for (const r of lus) for (const l of new Set(r.labels)) freq.set(l, (freq.get(l) ?? 0) + 1);

console.log(`\n\nÉCHANTILLON : ${lus.length} communes lues sur ${N} tirées (${N - lus.length} échecs)`);
console.log(`\nRISQUE « feu de forêt » RECENSÉ :`);
console.log(`  ${feu.length} communes  = ${(feu.length / lus.length * 100).toFixed(1)} % des communes`);
console.log(`  pondéré par la population : ${(popFeu / popTot * 100).toFixed(1)} % des habitants`);
const p = feu.length / lus.length, ic = 1.96 * Math.sqrt(p * (1 - p) / lus.length);
console.log(`  intervalle de confiance 95 % : ${((p - ic) * 100).toFixed(1)} – ${((p + ic) * 100).toFixed(1)} %`);
console.log(`\nTOUS LES RISQUES, par fréquence :`);
for (const [l, n] of [...freq].sort((a, b) => b[1] - a[1]).slice(0, 18)) {
  console.log(`  ${(n / lus.length * 100).toFixed(1).padStart(5)} %  ${l}`);
}
writeFileSync(process.argv[3] ?? "/dev/null", JSON.stringify(res, null, 1));

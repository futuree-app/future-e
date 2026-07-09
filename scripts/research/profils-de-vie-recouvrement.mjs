#!/usr/bin/env node
/**
 * Un critere peut se deplacer parce que le LECTEUR a change, pas le territoire.
 *
 * Le spike « rapport vivant » a montre que le territoire bouge peu : 87 % des communes n'ont aucun
 * evenement decisionnel sur douze mois, et 26 criteres sur 28 ne bougent qu'au millesime. La question
 * posee ici est l'inverse : de combien la REPONSE change quand la vie du lecteur change, a donnees
 * constantes ?
 *
 * Methode : quatre moments de vie, quatre ponderations des criteres deja presents dans l'index.
 * On classe les memes 5 381 communes (>= 2 000 habitants) et on mesure le recouvrement des top-30.
 *
 * AVERTISSEMENT. Les ponderations ci-dessous sont une MAQUETTE, pas le moteur de production
 * (`src/lib/comparateur-vie.ts`). Elles ne servent qu'a etablir un ordre de grandeur. Le resultat
 * (recouvrement nul entre profils eloignes) est trop massif pour dependre du detail des poids, mais
 * aucun chiffre d'ici ne doit etre cite comme un resultat du moteur.
 *
 *   node scripts/research/profils-de-vie-recouvrement.mjs --top 30 --min-pop 2000
 */

import { readFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const TOP = Number(args.top ?? 30);
const MIN_POP = Number(args["min-pop"] ?? 2000);

const idx = JSON.parse(readFileSync("data/comparateur-index.json", "utf8"));
const communes = (Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray)).filter(
  (c) => (c.population ?? 0) >= MIN_POP,
);

/** Lit un chemin imbriqué, 0 si absent. Certains champs sont { score }, d'autres des scalaires. */
const at = (obj, ...path) => {
  let v = obj;
  for (const p of path) {
    if (v == null || typeof v !== "object") return 0;
    v = v[p];
  }
  return v ?? 0;
};
const score = (c, k) => {
  const v = c[k];
  return v && typeof v === "object" ? (v.score ?? 0) : (v ?? 0);
};

/** Douceur du climat : proximité d'une moyenne annuelle de 14 °C, bornée à [0, 100]. */
const douceur = (c) => {
  const t = at(c, "clim", "NORTMm_yr");
  return t ? Math.max(0, 100 - Math.abs(t - 14) * 12) : 0;
};

const PROFILS = {
  "étudiant": (c) =>
    0.3 * at(c, "etudes_acces") + 0.2 * at(c, "etudes_dyn") + 0.2 * score(c, "vieLocale") +
    0.2 * score(c, "culture") + 0.1 * at(c, "reseauLocal", "acces"),
  "jeune actif": (c) =>
    0.25 * at(c, "emploi", "taille") + 0.15 * at(c, "emploi", "diversite") +
    0.2 * at(c, "transport", "desserte") + 0.2 * score(c, "vieLocale") + 0.2 * score(c, "culture"),
  "famille": (c) =>
    0.3 * score(c, "ecoles") + 0.2 * score(c, "calmeSonore") + 0.2 * score(c, "nature") +
    0.15 * score(c, "expoIndustrielle") + 0.15 * (100 - at(c, "inondation", "risque")),
  "retraite": (c) =>
    0.3 * at(c, "vivpct", "apl") + 0.25 * score(c, "calmeSonore") + 0.2 * score(c, "nature") +
    0.25 * douceur(c),
};

const noms = Object.keys(PROFILS);
const tops = {};
for (const [nom, f] of Object.entries(PROFILS)) {
  tops[nom] = [...communes].sort((a, b) => f(b) - f(a)).slice(0, TOP).map((c) => c.insee);
}

console.log(`\n${communes.length.toLocaleString("fr-FR")} communes (>= ${MIN_POP.toLocaleString("fr-FR")} hab), top-${TOP} par profil\n`);
for (const nom of noms) {
  const cinq = tops[nom].slice(0, 4).map((i) => communes.find((c) => c.insee === i).nom);
  console.log(`  ${nom.padEnd(13)} ${cinq.join(", ")}`);
}

console.log(`\nrecouvrement des top-${TOP} (nombre de communes communes) :\n`);
console.log("               " + noms.map((n) => n.slice(0, 11).padStart(12)).join(""));
for (const a of noms) {
  const cells = noms.map((b) => String([...new Set(tops[a])].filter((x) => tops[b].includes(x)).length).padStart(12));
  console.log(`  ${a.padEnd(13)}` + cells.join(""));
}

const dansTous = tops[noms[0]].filter((i) => noms.every((n) => tops[n].includes(i)));
console.log(`\n  communes présentes dans les ${noms.length} top-${TOP} : ${dansTous.length}`);
console.log(`\n  Le territoire n'a pas bougé. La réponse, si.`);

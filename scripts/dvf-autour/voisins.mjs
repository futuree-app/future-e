#!/usr/bin/env node
/**
 * voisins.mjs (FUT-138) : RÉSISTANCE AUX INTERROGATIONS RÉPÉTÉES DE CARRÉS VOISINS, sur les tuiles réelles.
 *
 * Scénario d'attaque : interroger tous les carrés d'une zone (un dossier payé par adresse) et comparer les réponses
 * de deux carrés adjacents pour isoler les ventes qui entrent dans l'un et pas dans l'autre. On mesure, sur une grille
 * de 41 × 41 carrés (environ 4 km de côté) autour de chaque point :
 *   - les paires « isolantes » : l'ensemble lu par l'un des carrés contient EXACTEMENT celui de l'autre plus une seule
 *     vente (différence symétrique d'une vente). C'est la seule situation où une comparaison vise une vente précise.
 *     Des effectifs qui diffèrent d'une unité ne suffisent pas : en général des ventes entrent et d'autres sortent ;
 *   - parmi les paires isolantes, combien publient un chiffre de prix différent (médiane ou quartiles arrondis), et de
 *     combien. Ce que la différence révèle alors est la position de la vente isolée par rapport à la médiane (au-dessus
 *     ou en dessous), jamais son prix.
 * Sortie : docs/audits/2026-11-03-fut138-ventes-autour-voisins.json
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { CACHE } from "../lib/logement-index.mjs";
import { caseDe, casesDansRayon, centreDe, cleCase, cleTuileDe, lireAutour, tuilesPour } from "../../src/lib/prix-autour.ts";

const EDITION = path.join(CACHE, "dvf-autour", "2026-10-20");
const ZONES = [
  { cas: "La Rochelle, centre", lat: 46.158, lon: -1.153 },
  { cas: "Paris 11e", lat: 48.865, lon: 2.378 },
  { cas: "Royère-de-Vassivière (rural)", lat: 45.84, lon: 1.91 },
];
const tuiles = new Map();
const charger = (p) => {
  for (const k of tuilesPour(p)) {
    if (tuiles.has(k)) continue;
    const f = path.join(EDITION, "t", `${k}.json.gz`);
    if (fs.existsSync(f)) tuiles.set(k, JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString("utf8")));
  }
};
// `--pas N` : les centres de lecture sont espacés de N carrés (N = 1 : la règle actuelle, un centre par carré de 100 m ;
// N = 3 : un centre par bloc de 300 m, ce qu'on mesure comme parade possible).
const PAS = process.argv.includes("--pas") ? Number(process.argv[process.argv.indexOf("--pas") + 1]) : 1;
const sortie = [];
for (const z of ZONES) {
  const o = caseDe(z);
  const grille = new Map();
  for (let dy = -20; dy <= 20; dy += PAS) for (let dx = -20; dx <= 20; dx += PAS) {
    const c = centreDe({ ix: o.ix + dx, iy: o.iy + dy });
    charger(c);
    grille.set(`${dx}_${dy}`, { appart: lireAutour(tuiles, c, "appart"), maison: lireAutour(tuiles, c, "maison") });
  }
  const ventesCase = (c, t) => {
    const h = tuiles.get(cleTuileDe(c))?.cases[cleCase(c)]?.[t === "appart" ? "a" : "m"];
    let n = 0;
    if (h) for (let i = 1; i < h.length; i += 2) n += h[i];
    return n;
  };
  const bilan = { paires: 0, isolantes: 0, dont_prix_publie_different: 0, ecart_max_mediane_eur_m2: 0, ecart_max_quartiles_eur_m2: 0 };
  for (const [k, v] of grille) {
    const [dx, dy] = k.split("_").map(Number);
    for (const [vx, vy] of [[PAS, 0], [0, PAS]]) {
      const w = grille.get(`${dx + vx}_${dy + vy}`);
      if (!w) continue;
      for (const t of ["appart", "maison"]) {
        const a = v[t], b = w[t];
        if (a.statut !== "ventes" || b.statut !== "ventes" || a.rayonM !== b.rayonM) continue;
        bilan.paires++;
        const ca = new Set(casesDansRayon({ ix: o.ix + dx, iy: o.iy + dy }, a.rayonM).map(cleCase));
        const cb = new Set(casesDansRayon({ ix: o.ix + dx + vx, iy: o.iy + dy + vy }, b.rayonM).map(cleCase));
        const somme = (x, y) => [...x].filter((c) => !y.has(c)).reduce((n, c) => { const [ix, iy] = c.split("_").map(Number); return n + ventesCase({ ix, iy }, t); }, 0);
        const seulA = somme(ca, cb), seulB = somme(cb, ca);
        if (!((seulA === 1 && seulB === 0) || (seulA === 0 && seulB === 1))) continue;
        bilan.isolantes++;
        const dm = Math.abs(a.mediane - b.mediane);
        const dq = a.quartiles && b.quartiles ? Math.max(Math.abs(a.quartiles[0] - b.quartiles[0]), Math.abs(a.quartiles[1] - b.quartiles[1])) : 0;
        if (dm || dq || JSON.stringify(a.quartiles) !== JSON.stringify(b.quartiles)) bilan.dont_prix_publie_different++;
        bilan.ecart_max_mediane_eur_m2 = Math.max(bilan.ecart_max_mediane_eur_m2, dm);
        bilan.ecart_max_quartiles_eur_m2 = Math.max(bilan.ecart_max_quartiles_eur_m2, dq);
      }
    }
  }
  sortie.push({ cas: z.cas, carres: grille.size, ...bilan });
}
if (PAS === 1) fs.writeFileSync(path.join(process.cwd(), "docs", "audits", "2026-11-03-fut138-ventes-autour-voisins.json"), JSON.stringify(sortie, null, 1));
console.log(JSON.stringify(sortie, null, 1));

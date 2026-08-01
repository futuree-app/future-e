#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// COMBIEN D'ADRESSES VERRAIENT UN PERMIS À CÔTÉ ?
//
// La mesure qui conditionne le chantier « les permis autour de l'adresse »
// (`docs/superpowers/specs/2026-08-01-permis-autour-adresse-design.md`). 1 091 permis sur treize
// ans dans une commune de 75 000 habitants, c'est rare à l'échelle d'une parcelle : si la grande
// majorité des dossiers affiche un bloc vide, la fonctionnalité coûte un appel réseau pour rien.
//
// MÉTHODE. Sur les adresses déjà tirées uniformément dans la BAN le 31/07/2026 (donc sans nouveau
// biais d'échantillonnage) :
//   1. les parcelles cadastrales dans un carré autour du point, à plusieurs rayons à la fois ;
//   2. les autorisations d'urbanisme de la commune (jeu SDES, mises en cache par commune) ;
//   3. l'intersection sur (section, numéro), en distinguant l'état déduit des DATES et l'âge.
//
// On mesure PLUSIEURS RAYONS d'un coup : le rayon n'est pas encore choisi, et c'est cette mesure
// qui doit le choisir plutôt qu'une intuition.
//
// Usage : node scripts/mesure-permis-autour.mjs [--adresses 150]
// ════════════════════════════════════════════════════════════════════════════════════════════

import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";

const ARG = process.argv.slice(2);
const N = Number.parseInt(ARG[ARG.indexOf("--adresses") + 1] ?? "150", 10) || 150;
const SOURCE = "docs/audits/mesure-dpe-2026-07-31-adresses.json";
const CACHE = "/tmp/sitadel-communes";
const DATAFILE = "8b35affb-55fc-4c1f-915b-7750f974446a";
const RAYONS = [50, 100, 200];
const ANNEE_COURANTE = 2026;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function texte(url, essais = 3) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (r.ok) return await r.text();
    } catch { /* on retente */ }
    await sleep(500 * (i + 1));
  }
  return null;
}

/**
 * NORMALISATION DE LA CLÉ PARCELLE. Le cadastre rend `numero` COMPLÉTÉ À QUATRE CHIFFRES
 * (« 0300 »), Sitadel le rend brut (« 300 »). Sans cette normalisation, la jointure ne trouve
 * JAMAIS rien et la mesure conclurait que la fonctionnalité est inutile, ce qui serait faux.
 * La section, elle, est déjà alignée (« BP » des deux côtés).
 */
const cle = (section, numero) =>
  `${String(section ?? "").trim().toUpperCase()}|${String(numero ?? "").trim().replace(/^0+/, "")}`;

/** Les parcelles cadastrales dans un carré de `rayon` mètres autour du point. */
async function parcellesAutour(lon, lat, rayon) {
  const dLat = rayon / 111_320;
  const dLon = rayon / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  const geom = {
    type: "Polygon",
    coordinates: [[
      [lon - dLon, lat - dLat], [lon + dLon, lat - dLat],
      [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat],
    ]],
  };
  // LIMITE HAUTE ET TRONCATURE SIGNALÉE. À 200 m en ville, `_limit=200` était atteint PILE, donc
  // des parcelles disparaissaient sans que rien ne le dise, et la mesure aurait sous-compté les
  // secteurs denses, c'est-à-dire précisément ceux où il y a des permis.
  const LIMITE = 1000;
  const url = `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${encodeURIComponent(JSON.stringify(geom))}&_limit=${LIMITE}`;
  const t = await texte(url);
  if (t === null) return null;
  try {
    const d = JSON.parse(t);
    const f = d.features ?? [];
    if (f.length >= LIMITE) tronquees++;
    return f.map((x) => cle(x.properties?.section, x.properties?.numero));
  } catch { return null; }
}

/** Les autorisations d'une commune, mises en cache : plusieurs adresses partagent une commune. */
let tronquees = 0;
const memoire = new Map();
async function permisCommune(insee) {
  if (memoire.has(insee)) return memoire.get(insee);
  mkdirSync(CACHE, { recursive: true });
  const chemin = `${CACHE}/${insee}.csv`;
  let csv;
  if (existsSync(chemin)) {
    csv = readFileSync(chemin, "utf8");
  } else {
    csv = await texte(
      `https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/${DATAFILE}/csv?COMM=eq:${insee}`,
    );
    if (csv === null) { memoire.set(insee, null); return null; }
    writeFileSync(chemin, csv);
  }
  const lignes = csv.split("\n").filter(Boolean);
  if (lignes.length < 2) { memoire.set(insee, []); return []; }
  const entete = lignes[0].split(";").map((c) => c.replace(/"/g, ""));
  const idx = (n) => entete.indexOf(n);
  const iSec = [idx("SEC_CADASTRE1"), idx("SEC_CADASTRE2"), idx("SEC_CADASTRE3")];
  const iNum = [idx("NUM_CADASTRE1"), idx("NUM_CADASTRE2"), idx("NUM_CADASTRE3")];
  const out = lignes.slice(1).map((l) => {
    const c = l.split(";").map((x) => x.replace(/"/g, "").trim());
    const parcelles = [];
    for (let k = 0; k < 3; k++) {
      const s = c[iSec[k]], n = c[iNum[k]];
      if (s && n) parcelles.push(cle(s, n));
    }
    const daact = c[idx("DATE_REELLE_DAACT")];
    const doc = c[idx("DATE_REELLE_DOC")];
    const aut = c[idx("DATE_REELLE_AUTORISATION")];
    const etat = daact ? "acheve" : doc ? "chantier_ouvert" : aut ? "autorise_non_commence" : "sans_date";
    const an = Number.parseInt(c[idx("AN_DEPOT")] || "0", 10);
    return { parcelles, etat, an };
  });
  memoire.set(insee, out);
  return out;
}

const data = JSON.parse(readFileSync(SOURCE, "utf8"));
const adresses = data.adresses.filter((a) => a.statut === "lu").slice(0, N);
console.error(`${adresses.length} adresses, rayons ${RAYONS.join(" / ")} m.`);

const compteur = {};
for (const r of RAYONS) compteur[r] = { avecPermis: 0, avecEnCours: 0, avecRecent: 0 };
let lus = 0, echecs = 0;

for (const [i, a] of adresses.entries()) {
  const permis = await permisCommune(a.insee);
  if (permis === null) { echecs++; continue; }
  const grandRayon = Math.max(...RAYONS);
  const parcelles = await parcellesAutour(a.lon, a.lat, grandRayon);
  if (parcelles === null) { echecs++; await sleep(200); continue; }

  // Une seule requête cadastre : les rayons plus petits se déduisent en recalculant l'inclusion
  // par la distance du centroïde ? Non : apicarto ne rend pas de centroïde exploitable ici. On
  // interroge donc chaque rayon séparément, en commençant par le plus grand déjà obtenu.
  for (const rayon of RAYONS) {
    const p = rayon === grandRayon ? parcelles : await parcellesAutour(a.lon, a.lat, rayon);
    if (p === null) continue;
    const set = new Set(p);
    const touches = permis.filter((x) => x.parcelles.some((k) => set.has(k)));
    if (touches.length > 0) compteur[rayon].avecPermis++;
    if (touches.some((x) => x.etat === "autorise_non_commence" || x.etat === "chantier_ouvert")) {
      compteur[rayon].avecEnCours++;
    }
    if (touches.some((x) => x.an >= ANNEE_COURANTE - 3)) compteur[rayon].avecRecent++;
    if (rayon !== grandRayon) await sleep(150);
  }
  lus++;
  if ((i + 1) % 20 === 0) console.error(`  ${i + 1}/${adresses.length}`);
  await sleep(150);
}

console.error(`\nAdresses lues : ${lus}, échecs : ${echecs}, listes de parcelles tronquées : ${tronquees}\n`);
console.error("rayon   au moins 1 permis    dont non achevé    dont déposé depuis 3 ans");
for (const r of RAYONS) {
  const c = compteur[r];
  const p = (n) => `${lus ? Math.round((1000 * n) / lus) / 10 : 0} %`.padStart(7);
  console.error(`${String(r).padStart(4)} m ${p(c.avecPermis)} (${c.avecPermis})      ${p(c.avecEnCours)} (${c.avecEnCours})      ${p(c.avecRecent)} (${c.avecRecent})`);
}

process.stdout.write(JSON.stringify({ adresses: lus, echecs, rayons: compteur, source: SOURCE }, null, 2));

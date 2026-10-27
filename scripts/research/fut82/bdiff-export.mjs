#!/usr/bin/env node
/**
 * FUT-82 — BDIFF : exporte les feux de forêt recensés, année par année, depuis le portail public
 * (bdiff.agriculture.gouv.fr), puis agrège PAR COMMUNE. Lecture seule, une requête de recherche et
 * un téléchargement par année, pause de 3 s entre années.
 *
 * Ce que la source permet, et ce qu'elle ne permet pas (lu dans l'export, pas supposé) :
 *   - grain : la COMMUNE (code INSEE). Ni point, ni contour brûlé. Aucun incendie ne se rattache à
 *     une adresse.
 *   - surfaces « Estimées » ou « Mesurées », par type de végétation (définitions changées en 2023).
 *   - nature (cause) souvent vide ; bâtiments touchés et décès renseignés seulement parfois.
 *
 * LICENCE À ARBITRER AVANT TOUT USAGE PRODUIT : la fiche data.gouv.fr déclare la Licence Ouverte 2.0,
 * mais les mentions légales jointes à chaque export excluent toute utilisation commerciale. Ce script
 * sert l'audit ; il ne préjuge pas de la réutilisation.
 *
 *   node scripts/research/fut82/bdiff-export.mjs [--de 2006] [--a 2025] [--tmp <dossier>] [--out <json>]
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { parseArgs, sleep, UA } from "./lib.mjs";

const args = parseArgs(process.argv);
const DE = Number(args.de ?? 2006), A = Number(args.a ?? 2025);
const TMP = args.tmp ?? join(tmpdir(), "fut82-bdiff");
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/bdiff-communes.json";
// L'agrégat COMPLET par commune reste hors dépôt (licence de l'export à arbitrer, dépôt public) : seuls
// les totaux nationaux et les communes de l'échantillon sont publiés dans `OUT`.
const COMPLET = args.complet ?? join(TMP, "bdiff-communes-complet.json");
const BASE = "https://bdiff.agriculture.gouv.fr";
mkdirSync(TMP, { recursive: true });

async function exporterAnnee(annee) {
  const fichier = join(TMP, `bdiff-${annee}.csv`);
  if (existsSync(fichier)) return fichier;
  const q = new URLSearchParams({
    "if[dateAlerteDeb][date]": `01/01/${annee}`, "if[dateAlerteDeb][time][hour]": "0", "if[dateAlerteDeb][time][minute]": "0",
    "if[dateAlerteFin][date]": `31/12/${annee}`, "if[dateAlerteFin][time][hour]": "23", "if[dateAlerteFin][time][minute]": "59",
    "if[fr]": "1", "if[submit]": "",
  });
  // PAR CURL, ET C'EST UN CONSTAT : le serveur présente une chaîne de certificats incomplète
  // (« unable to verify the first certificate » sous Node 25, 27/10/2026). Un appel serveur en Node
  // échouerait tel quel ; une intégration devrait embarquer le certificat intermédiaire ou passer
  // par un import hors ligne.
  const jar = join(TMP, `cookies-${annee}.txt`), zip = join(TMP, `bdiff-${annee}.zip`), html = join(TMP, `page-${annee}.html`);
  execFileSync("curl", ["-s", "-m", "90", "-A", UA, "-c", jar, "-b", jar, "-o", html, `${BASE}/incendies?${q}`]);
  if (/n&#039;a pu être filtré/.test(readFileSync(html, "utf8"))) throw new Error(`${annee} : filtre refusé par le portail`);
  execFileSync("curl", ["-s", "-m", "180", "-A", UA, "-c", jar, "-b", jar, "-o", zip, `${BASE}/incendies/zip`]);
  const csv = execFileSync("unzip", ["-p", zip, "Incendies.csv"], { maxBuffer: 1 << 28 }).toString("utf8");
  writeFileSync(fichier, csv);
  return fichier;
}

function lire(fichier) {
  const lignes = readFileSync(fichier, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  // Avant 2023, une ligne d'avertissement précède (« ancienne version du formulaire incendie ») :
  // on cherche la ligne des critères au lieu de supposer sa position.
  const criteres = lignes.find((l) => l.includes("Critères de sélection")) ?? "";
  const i = lignes.findIndex((l) => l.startsWith("Année;"));
  const cols = lignes[i].split(";").map((c) => c.replace(/"/g, ""));
  const rows = lignes.slice(i + 1).filter(Boolean).map((l) => {
    const v = l.split(";").map((x) => x.replace(/^"|"$/g, ""));
    return Object.fromEntries(cols.map((c, k) => [c, v[k] ?? ""]));
  });
  return { criteres, rows };
}

const parCommune = new Map();
const parAnnee = {};
let precisionMesuree = 0, total = 0, partielles = 0, batiments = 0, natureConnue = 0;
for (let annee = DE; annee <= A; annee++) {
  const f = await exporterAnnee(annee);
  const { criteres, rows } = lire(f);
  if (!criteres.includes(String(annee))) throw new Error(`${annee} : l'export ne porte pas sur l'année demandée (${criteres})`);
  let ha = 0;
  for (const r of rows) {
    const insee = r["Code INSEE"], m2 = Number(r["Surface parcourue (m2)"]) || 0;
    total++; ha += m2 / 1e4;
    if (r["Précision des surfaces"] === "Mesurées") precisionMesuree++;
    if (r["Précision de la donnée"]) partielles++;
    if (r["Nature"]) natureConnue++;
    if (r["Décès ou bâtiments touchés"] === "Oui") batiments++;
    const c = parCommune.get(insee) ?? { n: 0, n1ha: 0, n10ha: 0, haTotal: 0, maxHa: 0, annees: new Set(), dernier: 0 };
    c.n++; c.haTotal += m2 / 1e4; c.maxHa = Math.max(c.maxHa, m2 / 1e4); c.annees.add(annee); c.dernier = Math.max(c.dernier, annee);
    if (m2 >= 1e4) c.n1ha++; if (m2 >= 1e5) c.n10ha++;
    parCommune.set(insee, c);
  }
  parAnnee[annee] = { feux: rows.length, hectares: Math.round(ha) };
  process.stderr.write(`${annee}: ${rows.length} feux, ${Math.round(ha)} ha\n`);
  await sleep(3000);
}

// Agrégats par commune (aucune ligne individuelle n'est publiée dans le dépôt).
const communes = Object.fromEntries([...parCommune.entries()].map(([k, c]) => [k, {
  n: c.n, n1ha: c.n1ha, n10ha: c.n10ha, haTotal: Math.round(c.haTotal * 10) / 10, maxHa: Math.round(c.maxHa * 10) / 10, anneesAvecFeu: c.annees.size, dernier: c.dernier,
}]));
const nbCommunes = Object.keys(communes).length;
const seuil = (f) => Object.values(communes).filter(f).length;
const res = {
  genere: new Date().toISOString(), source: BASE, periode: `${DE}-${A}`,
  licence: "À ARBITRER : data.gouv.fr déclare lov2 ; les mentions légales de l'export excluent l'usage commercial.",
  totaux: { feux: total, surfacesMesurees: precisionMesuree, lignesPartielles: partielles, natureConnue, avecDecesOuBatiments: batiments },
  parAnnee,
  couverture: {
    communesAvecAuMoinsUnFeu: nbCommunes,
    communesAvecUnFeuDePlusDe1ha: seuil((c) => c.n1ha > 0),
    communesAvecUnFeuDePlusDe10ha: seuil((c) => c.n10ha > 0),
    communesAvecFeuxSur5AnneesOuPlus: seuil((c) => c.anneesAvecFeu >= 5),
  },
  communes,
};
writeFileSync(COMPLET, JSON.stringify(res));
const ech = JSON.parse(readFileSync("docs/audits/2026-10-27-fut82/mesures/echantillon.json", "utf8")).points;
const garder = new Set([...ech.map((p) => p.citycode).filter(Boolean), "13055", "75056", "69123"]);
const publie = { ...res, communes: Object.fromEntries(Object.entries(communes).filter(([k]) => garder.has(k))), completHorsDepot: "hors dépôt : fichier bdiff-communes-complet.json du dossier --tmp de bdiff-export.mjs" };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(publie, null, 1));
console.log(JSON.stringify({ ...res, communes: undefined }, null, 1));

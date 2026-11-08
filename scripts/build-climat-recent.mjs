#!/usr/bin/env node
// LE CLIMAT RÉCENT PAR COMMUNE, POUR L'ACCUEIL (audit du 08/11/2026 : docs/audits/2026-11-08-reference-climatique-recente.md).
//
// ENTRÉE : `data/climat-recent/safran-<période>.json`, les comptes annuels SAFRAN par point de la grille DRIAS
// (`scripts/climat-recent/agreger_safran.py`).
// SORTIE : `src/data/climat-recent-communes.json`, la moyenne de la période pour chaque commune : jours à 35 °C et
// plus, jours à 30 °C et plus, nuits tropicales. Environ 0,7 Mo, empaqueté avec la fonction comme l'extrait DRIAS.
//
// LA JOINTURE N'EST PAS RÉÉCRITE : chaque commune reçoit la valeur du point que DRIAS lui attribue, par les
// fonctions mêmes de `build-drias-median.js` (`loadCommunes`, `parseDriasFile`, `buildNearestPointIndex`, donc
// `joindreAuPointLePlusProche` et ses deux refus). Un climat récent lu sur une autre maille que la projection
// comparerait deux lieux.
//
// Usage :
//   node scripts/build-climat-recent.mjs            VÉRIFIE sans rien écrire (le build l'appelle : prebuild)
//   node scripts/build-climat-recent.mjs --ecrire   RÉGÉNÈRE, après une nouvelle agrégation SAFRAN
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadCommunes, parseDriasFile, buildNearestPointIndex } from "./build-drias-median.js";

export const PERIODE = [2016, 2025];
export const SOURCE = `data/climat-recent/safran-${PERIODE[0]}-${PERIODE[1]}.json`;
export const SORTIE = "src/data/climat-recent-communes.json";
export const CLES = ["tx35", "tx30", "tr20"];

const sha = (b) => createHash("sha256").update(b).digest("hex");
const r2 = (x) => Math.round(x * 100) / 100;

/** Construit le contenu de la sortie, sans rien écrire. */
export async function construire() {
  const brut = readFileSync(SOURCE);
  const src = JSON.parse(brut.toString("utf8"));
  if (src.schema !== 1) throw new Error(`${SOURCE} : schéma ${src.schema}, attendu 1`);
  if (src.periode.join() !== PERIODE.join()) throw new Error(`${SOURCE} : période ${src.periode.join("-")}, attendu ${PERIODE.join("-")}`);
  const nAnnees = PERIODE[1] - PERIODE[0] + 1;
  if (src.source.fichiers.length !== nAnnees) throw new Error(`${SOURCE} : ${src.source.fichiers.length} années, attendu ${nAnnees}`);

  const meta = JSON.parse(readFileSync("data/drias_median_metadata.json", "utf8"));
  if (src.grille_drias.fichier !== meta.canonical_source_file) {
    throw new Error(`${SOURCE} apparié sur ${src.grille_drias.fichier}, DRIAS lit ${meta.canonical_source_file}`);
  }
  const canonique = await parseDriasFile(path.join("data", "source", meta.canonical_source_file));
  const communes = buildNearestPointIndex(await loadCommunes(), Array.from(canonique.records.values()));

  const parCommune = {};
  for (const c of [...communes].sort((a, b) => a.insee_code.localeCompare(b.insee_code))) {
    const p = src.points[c.nearestPointId];
    if (!p) throw new Error(`${c.insee_code} : point ${c.nearestPointId} absent de ${SOURCE}`);
    parCommune[c.insee_code] = CLES.map((k) => {
      const serie = p[k];
      if (!Array.isArray(serie) || serie.length !== nAnnees || !serie.every((v) => Number.isInteger(v) && v >= 0 && v <= 366)) {
        throw new Error(`${c.insee_code} : série ${k} invalide`);
      }
      return r2(serie.reduce((s, v) => s + v, 0) / nAnnees);
    });
  }
  return {
    schema: 1,
    periode: PERIODE,
    source: {
      fichier: SOURCE,
      sha256: sha(brut),
      producteur: src.source.producteur,
      jeu: src.source.jeu,
      licence: src.source.licence,
      page: src.source.page,
    },
    cles: CLES,
    communes: parCommune,
  };
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`${SOURCE} absent : lancer scripts/climat-recent/agreger_safran.py`);
  const contenu = JSON.stringify(await construire());
  if (process.argv.includes("--ecrire")) {
    writeFileSync(SORTIE, contenu);
    console.log(`${SORTIE} : ${Object.keys(JSON.parse(contenu).communes).length} communes`);
    return;
  }
  if (!existsSync(SORTIE) || readFileSync(SORTIE, "utf8") !== contenu) {
    console.error(`✖ climat récent : ${SORTIE} ne correspond pas à ${SOURCE} : lancer node scripts/build-climat-recent.mjs --ecrire`);
    process.exit(1);
  }
  console.log(`✓ climat récent : ${SORTIE} à jour`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

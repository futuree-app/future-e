#!/usr/bin/env node
// L'EXTRAIT DRIAS DE L'APERÇU TERRITOIRE (FUT-30).
//
// POURQUOI CE FICHIER EXISTE. L'aperçu du paywall Territoire (`/territoire/[insee]/debloquer`) doit
// s'afficher tout de suite et dire un fait propre à la commune. Sa vérité climatique est celle du
// dossier (`buildClimatFacts`, `src/lib/decision/climat-facts.ts`), qui lit DRIAS par
// `getClimatDataCommune`, donc `public/data_climat.json` : 63 Mo, 0,7 à 0,9 s de lecture à froid. Une
// page de vente ne peut pas payer ce prix à chaque fonction neuve, et c'est ce prix, sous un plafond
// global de 1,2 s, qui faisait disparaître l'aperçu.
//
// CE QU'IL PRODUIT : `src/data/apercu-climat-communes.json`, les SEULES colonnes que lisent les trois
// axes retenus par l'aperçu (valeur projetée et anomalie, aux trois horizons, pour reconstruire la
// référence 1976-2005 exactement comme le dossier). Aucune valeur n'est recalculée ici : chaque
// nombre est recopié tel que `rowToIndicators` le lirait.
//
// LE MAPPING N'EST PAS RECOPIÉ, IL EST LU dans `src/lib/drias-json.ts`. Une copie dériverait en
// silence le jour où une colonne glisse ; une lecture du fichier source échoue bruyamment si la clé
// disparaît. `src/lib/apercu-territoire.test.ts` vérifie ensuite, sur le vrai fichier, que l'extrait
// rend les mêmes nombres que DRIAS et que son empreinte correspond au fichier présent.
//
// À RELANCER chaque fois que `public/data_climat.json` change :
//   node scripts/build-apercu-climat.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "public/data_climat.json";
const SORTIE = "src/data/apercu-climat-communes.json";

// Les clés DRIAS des trois axes de l'aperçu, dans le vocabulaire de `CLIMAT_METRICS`.
export const CLES_APERCU = [
  "NORTX35D_yr", "ATX35D_yr", // jours au-dessus de 35 °C
  "NORTR_yr", "ATR_yr", // nuits tropicales
  "NORIFM40_yr", "AIFM40_yr", // jours d'indice forêt-météo supérieur à 40
];
export const HORIZONS_APERCU = ["gwl15", "gwl20", "gwl30"];

/** Lit `COLUMN_MAP` dans le source de `drias-json.ts` : `CLE: "columnNN"`. */
export function lireColumnMap(sourceDriasJson) {
  const bloc = sourceDriasJson.match(/const COLUMN_MAP[^{]*\{([\s\S]*?)\n\};/);
  if (!bloc) throw new Error("COLUMN_MAP introuvable dans src/lib/drias-json.ts");
  const map = {};
  for (const m of bloc[1].matchAll(/^\s*([A-Za-z0-9_]+):\s*"(column\d+)"/gm)) map[m[1]] = m[2];
  return map;
}

/** La conversion de `rowToIndicators`, à l'identique (y compris `Number("") === 0`). */
export function valeurDrias(raw) {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function main() {
  const columnMap = lireColumnMap(readFileSync(path.join(root, "src/lib/drias-json.ts"), "utf8"));
  for (const cle of CLES_APERCU) {
    if (!columnMap[cle]) throw new Error(`Clé ${cle} absente de COLUMN_MAP`);
  }

  const brut = readFileSync(path.join(root, SOURCE));
  const sha256 = createHash("sha256").update(brut).digest("hex");
  const lignes = JSON.parse(brut.toString("utf8"));

  // insee -> horizon -> valeurs dans l'ordre de CLES_APERCU
  const parCommune = new Map();
  for (const row of lignes) {
    const insee = String(row.insee_code).padStart(5, "0");
    const h = String(row.scenario);
    if (!HORIZONS_APERCU.includes(h)) continue;
    let parHorizon = parCommune.get(insee);
    if (!parHorizon) parCommune.set(insee, (parHorizon = {}));
    parHorizon[h] = CLES_APERCU.map((cle) => valeurDrias(row[columnMap[cle]]));
  }

  // Une ligne par commune : les trois horizons à la suite, `null` quand un horizon manque.
  const communes = {};
  for (const insee of [...parCommune.keys()].sort()) {
    const parHorizon = parCommune.get(insee);
    communes[insee] = HORIZONS_APERCU.flatMap((h) => parHorizon[h] ?? CLES_APERCU.map(() => null));
  }

  const sortie = {
    schema: 1,
    source: { fichier: SOURCE, sha256, lignes: lignes.length },
    horizons: HORIZONS_APERCU,
    cles: CLES_APERCU,
    communes,
  };
  writeFileSync(path.join(root, SORTIE), JSON.stringify(sortie));
  console.log(`${SORTIE} : ${Object.keys(communes).length} communes, source ${sha256.slice(0, 12)}…`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

#!/usr/bin/env node
// FUT-109 · Construit `data/population-referentiel-cog2025.json` : les communes de l'index dont la population
// ADEME 2021 n'est pas au grain du référentiel (COG 01/01/2025), et leur population de référence Insee 2023.
// La règle et ses raisons sont dans `scripts/lib/population-grain.mjs`.
//
// Sources officielles (à télécharger, non versionnées ; leur sha256 est inscrit dans la sortie) :
//   --mvt     v_mvt_commune_2025.csv   Insee, COG au 01/01/2025, mouvements des communes
//             https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv
//   --pl2023  donnees_communes.csv     Insee, populations de référence 2023 (limites au 01/01/2025), extrait de
//             https://www.insee.fr/fr/statistiques/fichier/8680726/ensemble.zip
//   --ademe   data/communes-vivabilite.json (ou communes-population.json) : le cache que lit
//             build-comparateur-index.mjs (scripts/fetch-communes-vivabilite.mjs)
//
// Usage :
//   node scripts/population/construire-referentiel.mjs --mvt <csv> --pl2023 <csv> [--ademe <json>]
// La liste des communes vient de l'index versionné (data/comparateur-index.json.gz) : seuls ses codes et noms
// sont lus, jamais sa population (elle peut déjà avoir été corrigée).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import zlib from "node:zlib";
import {
  SOURCE_PRINCIPALE, SOURCE_GRAIN, MOUVEMENTS_TERRITORIAUX, MOUVEMENTS_DE_CODE,
  communesHorsGrain, construireCorrections, effectifOfficiel, lireCsv,
} from "../lib/population-grain.mjs";

const SORTIE = path.join(process.cwd(), "data", "population-referentiel-cog2025.json");
const INDEX = path.join(process.cwd(), "data", "comparateur-index.json.gz");

const arg = (nom) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const echouer = (m) => { console.error(`REFUS: ${m}`); process.exit(1); };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const fichierMvt = arg("mvt");
const fichierPl = arg("pl2023");
const fichierAdeme = arg("ademe")
  ?? ["communes-vivabilite.json", "communes-population.json"].map((f) => path.join("data", f)).find(existsSync);
if (!fichierMvt || !fichierPl) echouer("préciser --mvt et --pl2023 (voir l'en-tête du script)");
if (!fichierAdeme || !existsSync(fichierAdeme)) echouer("cache ADEME absent : lancer scripts/fetch-communes-vivabilite.mjs, ou --ademe");

const brutMvt = readFileSync(fichierMvt);
const brutPl = readFileSync(fichierPl);
const brutAdeme = readFileSync(fichierAdeme);

const mouvements = lireCsv(brutMvt.toString("utf8"), ",");
if (!("MOD" in mouvements[0]) || !("COM_AP" in mouvements[0])) echouer(`${fichierMvt} n'est pas un fichier de mouvements du COG`);
const pl = lireCsv(brutPl.toString("utf8"), ";");
if (!("COM" in pl[0]) || !("PMUN" in pl[0])) echouer(`${fichierPl} n'est pas un fichier de populations de référence (colonnes COM, PMUN)`);

const populationsGrain = new Map(pl.map((r) => [r.COM, effectifOfficiel(r.PMUN)]));
const ademe = JSON.parse(brutAdeme.toString("utf8"));
const source2021 = new Map(Object.entries(ademe).map(([k, v]) => [k, v?.population ?? null]));
const { communes } = JSON.parse(zlib.gunzipSync(readFileSync(INDEX)).toString("utf8"));

const horsGrain = communesHorsGrain(mouvements, {
  apres: SOURCE_PRINCIPALE.geographie,
  jusqua: SOURCE_GRAIN.geographie,
});
const corrections = construireCorrections({
  communes: communes.map(({ insee, nom }) => ({ insee, nom })),
  source2021,
  horsGrain,
  populationsGrain,
});

const sortie = {
  schema: 1,
  regle:
    `population ADEME ${SOURCE_PRINCIPALE.millesime} (Insee PMUN, géographie ${SOURCE_PRINCIPALE.geographie}) gardée si le territoire ` +
    `et le code inchangés jusqu'au ${SOURCE_GRAIN.geographie} ; sinon population de référence Insee ${SOURCE_GRAIN.millesime} ` +
    `(PMUN, limites au ${SOURCE_GRAIN.geographie}). Mouvements du COG retenus : territoire ${[...MOUVEMENTS_TERRITORIAUX].join(", ")}, ` +
    `code ${[...MOUVEMENTS_DE_CODE].join(", ")}. Une commune absente de la source sans mouvement reste null.`,
  sources: {
    mouvements: { url: "https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv", sha256: sha(brutMvt) },
    populationsReference2023: { url: "https://www.insee.fr/fr/statistiques/fichier/8680726/ensemble.zip", fichier: "donnees_communes.csv", sha256: sha(brutPl) },
    ademe2021: { fichier: path.basename(fichierAdeme), champ: "population_totale_2021", sha256: sha(brutAdeme) },
  },
  communes: Object.fromEntries(Object.entries(corrections).sort(([a], [b]) => a.localeCompare(b))),
  // Absentes de la source sans mouvement du COG : laissées null dans l'index (aucune correction de grain).
  absentesSansMouvement: communes
    .filter((c) => !corrections[c.insee] && source2021.get(c.insee) == null)
    .map(({ insee, nom }) => ({ insee, nom, populationReference: populationsGrain.get(insee) ?? null })),
};
writeFileSync(SORTIE, JSON.stringify(sortie, null, 1) + "\n", "utf8");

const n = Object.values(corrections);
console.log(`✓ ${SORTIE}`);
console.log(`  ${n.length} communes hors grain : ${n.filter((c) => c.motif === "territoire_modifie").length} au territoire modifié, ` +
  `${n.filter((c) => c.motif === "code_modifie").length} au code modifié, ${n.filter((c) => c.population == null).length} sans valeur officielle (restent null) ; ` +
  `${sortie.absentesSansMouvement.length} absentes de la source sans mouvement, laissées null.`);

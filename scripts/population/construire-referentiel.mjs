#!/usr/bin/env node
// FUT-109 · Construit `data/population-referentiel-cog2025.json` : les communes de l'index dont la population
// ADEME 2021 n'est pas au grain du référentiel (COG 01/01/2025), et leur population de référence Insee 2023.
// La règle et ses raisons sont dans `scripts/lib/population-grain.mjs`. Le script REFUSE si une valeur gardée
// n'égale pas la population légale 2021 de son territoire (somme des communes fondatrices) : la règle est
// prouvée sur toute la France à chaque reconstruction, pas supposée.
//
// Sources officielles (à télécharger, non versionnées ; leur sha256 est inscrit dans la sortie) :
//   --mvt     v_mvt_commune_2025.csv   Insee, COG au 01/01/2025, mouvements des communes
//             https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv
//   --pl2023  donnees_communes.csv     Insee, populations de référence 2023 (limites au 01/01/2025), extrait de
//             https://www.insee.fr/fr/statistiques/fichier/8680726/ensemble.zip
//   --pl2021  donnees_communes.csv     Insee, populations légales 2021 (limites au 01/01/2023), extrait de
//             https://www.insee.fr/fr/statistiques/fichier/7739582/ensemble.zip
//   --ademe   data/communes-vivabilite.json (ou communes-population.json) : le cache que lit
//             build-comparateur-index.mjs (scripts/fetch-communes-vivabilite.mjs)
//
// Usage :
//   node scripts/population/construire-referentiel.mjs --mvt <csv> --pl2023 <csv> --pl2021 <csv> [--ademe <json>]
// La liste des communes vient de l'index versionné (data/comparateur-index.json.gz) : seuls ses codes, noms et
// unités urbaines sont lus, jamais sa population (elle peut déjà avoir été corrigée).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import zlib from "node:zlib";
import {
  SOURCE_PRINCIPALE, SOURCE_GRAIN, MOUVEMENTS_TERRITORIAUX, MOUVEMENTS_DE_CODE,
  communesHorsGrain, codesRepris, construireCorrections, ecartsAuGrain, effectifOfficiel, lireCsv,
} from "../lib/population-grain.mjs";

const SORTIE = path.join(process.cwd(), "data", "population-referentiel-cog2025.json");
// Extrait pour l'application (millésime affiché, population servie hors index) : un module TS importable par
// le serveur comme par les tests, sans lecture de fichier. Généré, jamais édité à la main.
const SORTIE_TS = path.join(process.cwd(), "src", "lib", "population-millesimes.generated.ts");
const INDEX = path.join(process.cwd(), "data", "comparateur-index.json.gz");

const arg = (nom) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const echouer = (m) => { console.error(`REFUS: ${m}`); process.exit(1); };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const fichierMvt = arg("mvt");
const fichierPl = arg("pl2023");
const fichierPl21 = arg("pl2021");
const fichierAdeme = arg("ademe")
  ?? ["communes-vivabilite.json", "communes-population.json"].map((f) => path.join("data", f)).find(existsSync);
if (!fichierMvt || !fichierPl || !fichierPl21) echouer("préciser --mvt, --pl2023 et --pl2021 (voir l'en-tête du script)");
if (!fichierAdeme || !existsSync(fichierAdeme)) echouer("cache ADEME absent : lancer scripts/fetch-communes-vivabilite.mjs, ou --ademe");

const brutMvt = readFileSync(fichierMvt);
const brutPl = readFileSync(fichierPl);
const brutPl21 = readFileSync(fichierPl21);
const brutAdeme = readFileSync(fichierAdeme);

const mouvements = lireCsv(brutMvt.toString("utf8"), ",");
if (!("MOD" in mouvements[0]) || !("COM_AP" in mouvements[0])) echouer(`${fichierMvt} n'est pas un fichier de mouvements du COG`);
const pl = lireCsv(brutPl.toString("utf8"), ";");
if (!("COM" in pl[0]) || !("PMUN" in pl[0])) echouer(`${fichierPl} n'est pas un fichier de populations de référence (colonnes COM, PMUN)`);
const pl21 = lireCsv(brutPl21.toString("utf8"), ";");
if (!("COM" in pl21[0]) || !("PMUN" in pl21[0])) echouer(`${fichierPl21} n'est pas un fichier de populations légales (colonnes COM, PMUN)`);
const pmun2021 = new Map(pl21.map((r) => [r.COM, effectifOfficiel(r.PMUN)]).filter(([, v]) => v != null));

const populationsGrain = new Map(pl.map((r) => [r.COM, effectifOfficiel(r.PMUN)]));
const ademe = JSON.parse(brutAdeme.toString("utf8"));
const source2021 = new Map(Object.entries(ademe).map(([k, v]) => [k, v?.population ?? null]));
const { communes } = JSON.parse(zlib.gunzipSync(readFileSync(INDEX)).toString("utf8"));

const intervalle = { apres: SOURCE_PRINCIPALE.geographie, jusqua: SOURCE_GRAIN.geographie };
const horsGrain = communesHorsGrain(mouvements, intervalle);
const corrections = construireCorrections({
  communes: communes.map(({ insee, nom }) => ({ insee, nom })),
  source2021,
  horsGrain,
  populationsGrain,
  repris: codesRepris(mouvements, intervalle, new Set(communes.map((c) => c.insee))),
});
// L'unité urbaine de chaque commune corrigée : une population d'agglomération qui la somme mêle deux millésimes.
const uuDe = new Map(communes.map((c) => [c.insee, c.uu ?? null]));
for (const [k, c] of Object.entries(corrections)) c.uu = uuDe.get(k);

const ecarts = ecartsAuGrain({ communes, source2021, corrections, pmun2021, mouvements });
if (ecarts.length) {
  for (const e of ecarts.slice(0, 20)) console.error(`  ${e.insee} ${e.nom} : source ${e.source}, PMUN 2021 du territoire ${e.attendue} (${e.fondatrices.join(" + ")})`);
  echouer(`${ecarts.length} valeurs gardées ne sont pas au grain de leur territoire : la règle ne tient plus`);
}

const sortie = {
  schema: 1,
  regle:
    `population ADEME ${SOURCE_PRINCIPALE.millesime} (Insee PMUN, géographie ${SOURCE_PRINCIPALE.geographie}) gardée si le territoire ` +
    `et le code inchangés depuis le ${SOURCE_PRINCIPALE.geographie} (rétablissements de cette date compris) jusqu'au ${SOURCE_GRAIN.geographie} ; ` +
    `sinon population de référence Insee ${SOURCE_GRAIN.millesime} (PMUN, limites au ${SOURCE_GRAIN.geographie}). Mouvements du COG retenus : ` +
    `territoire ${[...MOUVEMENTS_TERRITORIAUX].join(", ")}, code ${[...MOUVEMENTS_DE_CODE].join(", ")}. Chaque valeur gardée est vérifiée ` +
    `égale à la population légale 2021 de son territoire. Une commune absente de la source sans mouvement reste null.`,
  sources: {
    mouvements: { url: "https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv", sha256: sha(brutMvt) },
    populationsReference2023: { url: "https://www.insee.fr/fr/statistiques/fichier/8680726/ensemble.zip", fichier: "donnees_communes.csv", sha256: sha(brutPl) },
    populationsLegales2021: { url: "https://www.insee.fr/fr/statistiques/fichier/7739582/ensemble.zip", fichier: "donnees_communes.csv", sha256: sha(brutPl21) },
    ademe2021: { fichier: path.basename(fichierAdeme), champ: "population_totale_2021", sha256: sha(brutAdeme) },
  },
  communes: Object.fromEntries(Object.entries(corrections).sort(([a], [b]) => a.localeCompare(b))),
  // Absentes de la source sans mouvement du COG : laissées null dans l'index (aucune correction de grain).
  absentesSansMouvement: communes
    .filter((c) => !corrections[c.insee] && source2021.get(c.insee) == null)
    .map(({ insee, nom }) => ({ insee, nom, populationReference: populationsGrain.get(insee) ?? null })),
};
writeFileSync(SORTIE, JSON.stringify(sortie, null, 1) + "\n", "utf8");

// Les unités urbaines dont la population (somme des communes de l'index) mêle les millésimes : celles qui
// comptent au moins une commune corrigée. Une UU absente de la table est entièrement au millésime de la source.
const millesimesUu = new Map();
for (const c of communes) {
  if (!c.uu) continue;
  const m = corrections[c.insee] ? corrections[c.insee].millesime : source2021.get(c.insee) != null ? SOURCE_PRINCIPALE.millesime : null;
  if (m != null) millesimesUu.set(c.uu, new Set([...(millesimesUu.get(c.uu) ?? []), m]));
}
const uuMixtes = [...new Set(Object.values(corrections).map((c) => c.uu).filter(Boolean))].sort()
  .map((uu) => `  "${uu}": [${[...(millesimesUu.get(uu) ?? [])].sort().join(", ")}],`);

const extrait = Object.entries(sortie.communes).map(([k, c]) =>
  `  "${k}": { population: ${c.population ?? "null"}, millesime: ${c.millesime ?? "null"}, retablissement: ${c.retablissement}, ` +
  `mouvement: "${c.mouvements.map((m) => m.date).sort().at(-1)}", uu: ${c.uu ? `"${c.uu}"` : "null"} }, // ${c.nom}`);
writeFileSync(SORTIE_TS, [
  "// GÉNÉRÉ par scripts/population/construire-referentiel.mjs à partir de data/population-referentiel-cog2025.json.",
  "// Ne pas éditer : relancer le script. Règle et raisons : scripts/lib/population-grain.mjs (FUT-109).",
  "",
  "/** Millésime et géographie de la population de l'index pour toutes les communes absentes de la table. */",
  `export const SOURCE_POPULATION = { millesime: ${SOURCE_PRINCIPALE.millesime}, geographie: "${SOURCE_PRINCIPALE.geographie}" } as const;`,
  "",
  "/**",
  " * Les communes dont la population de la source n'est pas au grain du COG " + SOURCE_GRAIN.geographie + " : population de référence",
  " * Insee " + SOURCE_GRAIN.millesime + " au bon grain, date du dernier mouvement (fusion, rétablissement, changement de code) et unité",
  " * urbaine. `retablissement` : un territoire partagé, qu'aucune donnée rangée par code ne répartit d'elle-même.",
  " */",
  "export const POPULATIONS_HORS_GRAIN: Readonly<Record<string, {",
  "  population: number | null; millesime: number | null; retablissement: boolean; mouvement: string; uu: string | null;",
  "}>> = {",
  ...extrait,
  "};",
  "",
  "/** Millésimes réunis dans la population des unités urbaines qui comptent une commune de la table. */",
  "export const MILLESIMES_UNITES_URBAINES: Readonly<Record<string, readonly number[]>> = {",
  ...uuMixtes,
  "};",
  "",
].join("\n"), "utf8");

const n = Object.values(corrections);
console.log(`✓ ${SORTIE}`);
console.log(`✓ ${SORTIE_TS}`);
const gardees = communes.filter((c) => !corrections[c.insee] && source2021.get(c.insee) != null).length;
console.log(`  ${gardees} valeurs 2021 gardées, toutes égales à la population légale 2021 de leur territoire.`);
console.log(`  ${n.length} communes hors grain : ${n.filter((c) => c.motif === "territoire_modifie").length} au territoire modifié ` +
  `(dont ${n.filter((c) => c.retablissement).length} par rétablissement), ` +
  `${n.filter((c) => c.motif === "code_modifie").length} au code modifié, ${n.filter((c) => c.population == null).length} sans valeur officielle (restent null) ; ` +
  `${sortie.absentesSansMouvement.length} absentes de la source sans mouvement, laissées null.`);

#!/usr/bin/env node
/**
 * populate-population-grain.mjs — FUT-109 : la population au grain du référentiel (COG 01/01/2025).
 *
 * Applique `data/population-referentiel-cog2025.json` (scripts/population/construire-referentiel.mjs) à la
 * copie de travail de l'index : les communes dont la population ADEME 2021 n'est pas au bon grain (rétablissements
 * du 01/01/2024, fusions et codes créés depuis) reçoivent leur population de référence Insee 2023. Aucune autre
 * commune n'est touchée. Règle et raisons : scripts/lib/population-grain.mjs.
 *
 * Applique aussi `data/perimetre-ademe-cog2025.json` (scripts/population/construire-perimetre-ademe.mjs) : les
 * indicateurs ADEME publiés dans la géographie du 01/01/2024 (soins, air, pression agricole, taux de logements
 * sociaux) ne sont pas lus pour une commune au territoire modifié depuis, et sont rattachés depuis l'ancien code
 * pour un changement de code seul. Règle : scripts/lib/perimetre-ademe.mjs. À relancer après populate-hlm.mjs.
 *
 * À enchaîner, car ils dérivent de la population (l'ordre compte, chaque étape lit la précédente) :
 *   node scripts/populate-emploi-arrondissements.mjs    emploi des 45 arrondissements PLM (zone de leur ville)
 *   node scripts/populate-uu-pop.mjs                    uu_pop / uu_count / hors_uu
 *   .venv-bpe/bin/python scripts/populate-vie-locale.py --write-index     vieLocale (dénominateur, codes repris)
 *   .venv-bpe/bin/python scripts/populate-demographie.py --write-index    demographie (abstentions, codes rattachés)
 *   .venv-bpe/bin/python scripts/populate-mobilite.py --write-index       mobilite (fusions sommées, codes rattachés)
 *   npx tsx scripts/populate-mismatch-rank.mts --recalculer vie_locale,croissance_demographique,acces_soins,faible_dependance_auto,viabilite_emploi --retirer-orphelines acces_services
 *   npm run index:pack
 *   node scripts/accueil/donnees-accueil.mjs --ecrire   src/data/accueil-communes.json
 * etudes_dyn n'est PAS relancé : la source MESR a changé de rentrée depuis, et les communes corrigées y
 * resteraient non notées (cf. docs/audits/2026-10-23-fut109-populations-grain.md).
 *
 * Idempotent : relit l'index, applique, réécrit { meta, communes }.
 *   node scripts/populate-population-grain.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { appliquerCorrections, SOURCE_PRINCIPALE, SOURCE_GRAIN } from "./lib/population-grain.mjs";
import { appliquerPerimetre } from "./lib/perimetre-ademe.mjs";
import { pressionAgricole } from "./lib/pression-agricole.mjs";

assertIndexWorktree();

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const referentiel = JSON.parse(
    await fs.readFile(path.join(root, "data", "population-referentiel-cog2025.json"), "utf8"),
  );
  const perimetre = JSON.parse(await fs.readFile(path.join(root, "data", "perimetre-ademe-cog2025.json"), "utf8"));
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  const { corrigees, absentes } = appliquerCorrections(communes, referentiel.communes);
  const { abstentions, rattachements } = appliquerPerimetre(communes, perimetre, pressionAgricole);

  meta.countWithPopulation = communes.filter((c) => c.population != null).length;
  meta.population = {
    source: `ADEME data_communes, population_totale_${SOURCE_PRINCIPALE.millesime} (Insee, population municipale, géographie ${SOURCE_PRINCIPALE.geographie})`,
    grain: `référentiel COG ${SOURCE_GRAIN.geographie} ; ${Object.keys(referentiel.communes).length} communes hors grain reprises des populations de référence Insee ${SOURCE_GRAIN.millesime} (population municipale, limites au ${SOURCE_GRAIN.geographie}), liste et motifs dans data/population-referentiel-cog2025.json`,
    regle: referentiel.regle,
    // Les conventions de lecture : ce que vaut le millésime, et ce qui ne se calcule pas sur un autre territoire.
    conventions: {
      communes: `population ${SOURCE_PRINCIPALE.millesime} pour toutes les communes, sauf les communes du référentiel (${SOURCE_GRAIN.millesime}) ; le millésime affiché suit la commune (src/lib/population-millesime.ts), jamais « ${SOURCE_PRINCIPALE.millesime} » pour toute la France`,
      unitesUrbaines: `uu_pop somme les populations communales de l'index : une unité urbaine qui compte une commune du référentiel mêle ${SOURCE_PRINCIPALE.millesime} et ${SOURCE_GRAIN.millesime}`,
      scoresDependants: "vieLocale : associations des codes disparus comptées dans la commune qui les a repris ; non notée (null) pour un rétablissement, territoire partagé que le code RNA ne répartit pas. demographie : non notée (null) pour un territoire modifié depuis la géographie de la base RP 2021, rattachée depuis l'ancien code pour un changement de code seul. mobilite : RP 2022 (géographie au 01/01/2024), communes fusionnées depuis sommées, codes rattachés, rétablissements postérieurs non notés. Rangs (rankBands) recalculés pour vie_locale, croissance_demographique, acces_soins et faible_dependance_auto",
      indicateursAdeme: "ADEME data_communes mêle deux géographies (data/perimetre-ademe-cog2025.json) : densité, éloignement, centralité, nombre de logements sociaux au 01/01/2025, gardés ; APL, air, pression agricole, taux de logements sociaux au 01/01/2024, non lus (null) pour une commune au territoire modifié depuis, rattachés depuis l'ancien code pour un changement de code seul ; sans ligne ADEME, pas de niveau de centralité (clé absente, non noté)",
      absences: "six villages détruits de la Meuse absents de la source sans mouvement : population null (non lue), pas 0",
    },
  };

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");
  console.log(`✓ population au grain : ${corrigees} communes reprises, ${absentes} sans valeur officielle (null).`);
  console.log(`✓ indicateurs ADEME au périmètre : ${abstentions} abstentions, ${rattachements} rattachements.`);
  for (const code of ["85165", "85212", "60694", "85084", "60054"]) {
    const c = communes.find((x) => x.insee === code);
    if (c) console.log(`  ${code} ${c.nom.padEnd(22)} ${c.population}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

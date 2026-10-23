#!/usr/bin/env node
/**
 * populate-population-grain.mjs — FUT-109 : la population au grain du référentiel (COG 01/01/2025).
 *
 * Applique `data/population-referentiel-cog2025.json` (scripts/population/construire-referentiel.mjs) à la
 * copie de travail de l'index : les communes dont la population ADEME 2021 n'est pas au bon grain (défusions,
 * fusions, codes créés depuis 2023, absentes de la source) reçoivent leur population de référence Insee 2023.
 * Aucune autre commune n'est touchée. Règle et raisons : scripts/lib/population-grain.mjs.
 *
 * À enchaîner, car ils dérivent de la population :
 *   node scripts/populate-uu-pop.mjs                    uu_pop / uu_count / hors_uu
 *   npm run index:pack
 *   node scripts/accueil/donnees-accueil.mjs --ecrire   src/data/accueil-communes.json
 *
 * Idempotent : relit l'index, applique, réécrit { meta, communes }.
 *   node scripts/populate-population-grain.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { appliquerCorrections, SOURCE_PRINCIPALE, SOURCE_GRAIN } from "./lib/population-grain.mjs";

assertIndexWorktree();

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const referentiel = JSON.parse(
    await fs.readFile(path.join(root, "data", "population-referentiel-cog2025.json"), "utf8"),
  );
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  const { corrigees, absentes } = appliquerCorrections(communes, referentiel.communes);

  meta.countWithPopulation = communes.filter((c) => c.population != null).length;
  meta.population = {
    source: `ADEME data_communes, population_totale_${SOURCE_PRINCIPALE.millesime} (Insee, population municipale, géographie ${SOURCE_PRINCIPALE.geographie})`,
    grain: `référentiel COG ${SOURCE_GRAIN.geographie} ; ${Object.keys(referentiel.communes).length} communes hors grain reprises des populations de référence Insee ${SOURCE_GRAIN.millesime} (population municipale, limites au ${SOURCE_GRAIN.geographie}), liste et motifs dans data/population-referentiel-cog2025.json`,
    regle: referentiel.regle,
  };

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");
  console.log(`✓ population au grain : ${corrigees} communes reprises, ${absentes} sans valeur officielle (null).`);
  for (const code of ["85165", "85212", "60694", "85084", "60054"]) {
    const c = communes.find((x) => x.insee === code);
    if (c) console.log(`  ${code} ${c.nom.padEnd(22)} ${c.population}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

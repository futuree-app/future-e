#!/usr/bin/env node
/**
 * fetch-communes-population.mjs
 *
 * Récupère la population et la densité de TOUTES les communes depuis le dataset
 * ADEME data_communes (Data Fair, API publique sans clé) et écrit un cache local
 * `data/communes-population.json` consommé par build-comparateur-index.mjs.
 *
 * On précalcule ces champs une fois pour ne pas appeler l'API par commune au
 * moment du scoring du comparateur de vie (33 000+ communes = balayage gratuit).
 *
 * Usage :
 *   node scripts/fetch-communes-population.mjs
 *
 * Réutilise le pattern de pagination de scripts/populate-dependance-auto.js.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const COMMUNES_DS =
  'https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462';
const SELECT = [
  'code_commune_insee',
  'population_totale_2021',
  'densite_de_population_2022',
].join(',');
const PAGE_SIZE = 10000;

async function fetchAllLines(baseUrl, select) {
  const results = [];
  let after = 0;

  for (;;) {
    const url = new URL(`${baseUrl}/lines`);
    url.searchParams.set('size', String(PAGE_SIZE));
    url.searchParams.set('select', select);
    if (after > 0) url.searchParams.set('after', String(after));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`ADEME request failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const batch = json.results ?? [];
    results.push(...batch);
    process.stdout.write(`\r  ${results.length} communes récupérées…`);

    if (batch.length < PAGE_SIZE) break;
    after += batch.length;
  }
  process.stdout.write('\n');

  return results;
}

async function main() {
  console.log('Récupération population/densité ADEME (data_communes)…');
  const rows = await fetchAllLines(COMMUNES_DS, SELECT);

  /** @type {Record<string, { population: number|null, densite: number|null }>} */
  const out = {};
  for (const row of rows) {
    const insee = String(row.code_commune_insee ?? '').padStart(5, '0');
    if (insee.length !== 5) continue;
    const population =
      row.population_totale_2021 != null ? Number(row.population_totale_2021) : null;
    const densite =
      row.densite_de_population_2022 != null ? Number(row.densite_de_population_2022) : null;
    out[insee] = {
      population: Number.isNaN(population) ? null : population,
      densite: Number.isNaN(densite) ? null : densite,
    };
  }

  const outPath = path.join(process.cwd(), 'data', 'communes-population.json');
  await fs.writeFile(outPath, JSON.stringify(out), 'utf8');
  console.log(`✓ ${Object.keys(out).length} communes écrites dans ${outPath}`);
}

main().catch((err) => {
  console.error('Échec :', err.message);
  process.exit(1);
});

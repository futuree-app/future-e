#!/usr/bin/env node
/**
 * fetch-communes-vivabilite.mjs
 *
 * Surensemble de fetch-communes-population : récupère en bulk (ADEME data_communes,
 * API publique sans clé) population, densité, ET les champs santé/vivabilité
 * scorables nationalement :
 *   - air : PM2.5, NO2 (concentration de fond annuelle, µg/m³)
 *   - soins : APL médecins généralistes
 *   - services : % population éloignée de plus de 20 min d'un service
 *
 * Écrit data/communes-vivabilite.json, consommé par build-comparateur-index.mjs.
 *   node scripts/fetch-communes-vivabilite.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const DS = 'https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462';
const SELECT = [
  'code_commune_insee',
  'population_totale_2021',
  'densite_de_population_2022',
  'moyenne_annuelle_de_concentration_de_pm25_ugm3',
  'moyenne_annuelle_de_concentration_de_no2_ugm3',
  'apl_aux_medecins_generalistes',
  'part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services',
  // Pression agricole / phytosanitaire (V1.6)
  'ift_t',   // Indice de fréquence de traitement, total
  'ift_h',   // IFT hors herbicides
  'p_sau',   // part de surface agricole utile (%)
  'p_bio',   // part de SAU en agriculture biologique (%)
  'niveau_de_centres_dequipements_et_de_services_des_communes_2021',
].join(',');
const PAGE_SIZE = 10000;

const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

async function fetchAll() {
  const out = {};
  let after = 0, total = 0;
  for (;;) {
    const url = new URL(`${DS}/lines`);
    url.searchParams.set('size', String(PAGE_SIZE));
    url.searchParams.set('select', SELECT);
    if (after > 0) url.searchParams.set('after', String(after));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`ADEME ${res.status} ${res.statusText}`);
    const json = await res.json();
    const batch = json.results ?? [];
    for (const r of batch) {
      const insee = String(r.code_commune_insee ?? '').padStart(5, '0');
      if (insee.length !== 5) continue;
      // niveau d'équipements : "3 - Centre structurant…" → entier 1..4
      const equipRaw = r.niveau_de_centres_dequipements_et_de_services_des_communes_2021;
      const equip = equipRaw == null ? null : (parseInt(String(equipRaw), 10) || null);
      out[insee] = {
        population: num(r.population_totale_2021),
        densite: num(r.densite_de_population_2022),
        pm25: num(r.moyenne_annuelle_de_concentration_de_pm25_ugm3),
        no2: num(r.moyenne_annuelle_de_concentration_de_no2_ugm3),
        apl: num(r.apl_aux_medecins_generalistes),
        eloignement: num(r.part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services),
        ift_t: num(r.ift_t),
        ift_h: num(r.ift_h),
        p_sau: num(r.p_sau),
        p_bio: num(r.p_bio),
        equip,
      };
    }
    total += batch.length;
    process.stdout.write(`\r  ${total} communes…`);
    if (batch.length < PAGE_SIZE) break;
    after += batch.length;
  }
  process.stdout.write('\n');
  return out;
}

const out = await fetchAll();
const p = path.join(process.cwd(), 'data', 'communes-vivabilite.json');
await fs.writeFile(p, JSON.stringify(out), 'utf8');
const withAir = Object.values(out).filter((c) => c.pm25 != null).length;
const withApl = Object.values(out).filter((c) => c.apl != null).length;
console.log(`✓ ${Object.keys(out).length} communes → ${p}\n  air: ${withAir} · APL soins: ${withApl}`);

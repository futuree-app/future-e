#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const COMMUNES_DS = 'https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462';
const IRIS_DS = 'https://data.ademe.fr/data-fair/api/v1/datasets/jixoufr9qp0gko9xcqyzbr4a';
const PAGE_SIZE = 10000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SELECT_COMMUNES = [
  'code_commune_insee',
  'commune',
  'population_totale_2021',
  'densite_de_population_2022',
].join(',');

const SELECT_IRIS = [
  '_contours_iris.nom_com',
  'taux_motor_glob',
  'taux_transportscommuns_glob',
].join(',');

function mean(values) {
  const nums = values.filter((value) => value != null && !Number.isNaN(Number(value))).map(Number);
  return nums.length > 0 ? nums.reduce((sum, value) => sum + value, 0) / nums.length : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function fetchAllLines(baseUrl, select) {
  const results = [];
  let after = 0;

  while (true) {
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

    if (batch.length < PAGE_SIZE) break;
    after += batch.length;
  }

  return results;
}

function computeMobilityScore({ tauxMotorisation, tauxTransports, densite }) {
  const components = [];

  if (tauxMotorisation != null) {
    components.push(clamp(tauxMotorisation, 0, 100));
  }

  if (tauxTransports != null) {
    components.push(clamp(100 - Math.min(100, tauxTransports * 3.5), 0, 100));
  }

  if (densite != null) {
    components.push(clamp(100 - (densite / 3000) * 100, 0, 100));
  }

  if (components.length === 0) return null;
  return Math.round(components.reduce((sum, value) => sum + value, 0) / components.length);
}

async function main() {
  const top1000Path = path.join(process.cwd(), 'src', 'data', 'top1000-communes.json');
  const top1000Raw = await fs.readFile(top1000Path, 'utf8');
  const top200Set = new Set(JSON.parse(top1000Raw).slice(0, 200));

  console.log('Fetching ADEME communes dataset …');
  const communeRows = await fetchAllLines(COMMUNES_DS, SELECT_COMMUNES);
  console.log(`  ${communeRows.length} commune rows loaded`);

  console.log('Fetching ADEME IRIS dataset …');
  const irisRows = await fetchAllLines(IRIS_DS, SELECT_IRIS);
  console.log(`  ${irisRows.length} IRIS rows loaded`);

  const mobilityByCommuneName = new Map();

  for (const row of irisRows) {
    const key = row['_contours_iris.nom_com'];
    if (!key) continue;

    if (!mobilityByCommuneName.has(key)) {
      mobilityByCommuneName.set(key, {
        motorisation: [],
        transports: [],
      });
    }

    const entry = mobilityByCommuneName.get(key);
    entry.motorisation.push(row.taux_motor_glob);
    entry.transports.push(row.taux_transportscommuns_glob);
  }

  const upsertsByInsee = new Map();

  for (const row of communeRows) {
    const inseeCode = String(row.code_commune_insee ?? '').padStart(5, '0');
    if (!top200Set.has(inseeCode)) continue;

    const mobility = mobilityByCommuneName.get(row.commune);
    if (!mobility) continue;

    const tauxMotorisation = mean(mobility.motorisation);
    const tauxTransports = mean(mobility.transports);
    const densite = row.densite_de_population_2022 != null ? Number(row.densite_de_population_2022) : null;
    const score = computeMobilityScore({ tauxMotorisation, tauxTransports, densite });

    if (score == null) continue;

    const transportScore = tauxTransports != null
      ? Math.round(clamp(100 - Math.min(100, tauxTransports * 3.5), 0, 100))
      : null;
    const densityScore = densite != null
      ? Math.round(clamp(100 - (densite / 3000) * 100, 0, 100))
      : null;

    upsertsByInsee.set(inseeCode, {
      insee_code: inseeCode,
      nom_commune: String(row.commune),
      departement: inseeCode.slice(0, 2),
      slug: 'dependance-auto',
      score,
      ind_exposition: tauxMotorisation != null ? Math.round(clamp(tauxMotorisation, 0, 100)) : null,
      ind_vulnerabilite: transportScore,
      ind_adaptation: densityScore,
      ind_occurrence: score,
    });
  }

  const upserts = Array.from(upsertsByInsee.values());

  upserts.sort((a, b) => b.score - a.score || a.nom_commune.localeCompare(b.nom_commune, 'fr'));

  console.log(`Computed ${upserts.length} dependence-auto rows for top200 communes`);
  console.log('Top 10 preview:');
  upserts.slice(0, 10).forEach((row, index) => {
    console.log(`  ${index + 1}. ${row.nom_commune} (${row.insee_code}) — ${row.score}/100`);
  });

  if (upserts.length === 0) {
    throw new Error('No dependence-auto rows computed');
  }

  const { error } = await supabase
    .from('communes_tension')
    .upsert(upserts, { onConflict: 'slug,insee_code' });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Upserted ${upserts.length} rows into communes_tension (slug=dependance-auto)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

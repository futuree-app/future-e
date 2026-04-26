#!/usr/bin/env node
/**
 * populate-communes-tension.js
 *
 * Calcule les scores de tension pour chaque risque défini et insère
 * les 50 communes les plus exposées dans la table `communes_tension` de Supabase.
 *
 * Sources :
 *   - public/data_climat.json (DRIAS, 35 000+ communes, scénario gwl20)
 *   - communes_categorization Supabase (catégories territoriales)
 *
 * Usage :
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
 *   node scripts/populate-communes-tension.js
 *
 *   Ou avec le service role key pour contourner RLS en écriture :
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/populate-communes-tension.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Scénario DRIAS utilisé pour les scores (gwl20 = +2°C, horizon 2050)
const TARGET_SCENARIO = 'gwl20';

// Mapping colonne → indicateur DRIAS (identique à drias-json.ts)
const COLUMN_MAP = {
  NORTX30D_yr: 'column09', // jours Tmax ≥ 30°C / an
  NORTX35D_yr: 'column08', // jours Tmax ≥ 35°C / an
  NORTR_yr:    'column10', // nuits tropicales / an
  NORTMm_seas_JJA: 'column05', // T° moy. été (°C)
  NORIFM40_yr: 'column17', // indicateur feux météo > 40
  NORSWI04_yr: 'column18', // jours sécheresse sol (SWI < 0.4)
  NORRRq99_yr: 'column15', // précip. remarquables (p99)
  NORRx1d_yr:  'column16', // précip. extrêmes (max journalier)
};

/**
 * Définitions des risques : comment calculer les 4 indicateurs à partir des colonnes DRIAS.
 * score global = moyenne pondérée des 4 indicateurs (normalisée 0–100).
 */
const RISK_DEFINITIONS = {
  canicule: {
    thematique: 'Canicule',
    indicators: {
      // ind_exposition : jours avec Tmax ≥ 30°C (max ~120j/an en France)
      ind_exposition: { col: 'NORTX30D_yr', max: 120 },
      // ind_vulnerabilite : nuits tropicales (max ~60/an)
      ind_vulnerabilite: { col: 'NORTR_yr', max: 60 },
      // ind_adaptation : température max. été (Tmax moy. été entre 20 et 40°C)
      ind_adaptation: { col: 'NORTMm_seas_JJA', min: 20, max: 40, invert: true },
      // ind_occurrence : jours Tmax ≥ 35°C (max ~40/an)
      ind_occurrence: { col: 'NORTX35D_yr', max: 40 },
    },
  },
  submersion: {
    thematique: 'Submersion',
    indicators: {
      ind_exposition:    { col: 'NORRx1d_yr', max: 150 },
      ind_vulnerabilite: { col: 'NORRRq99_yr', max: 80 },
      ind_adaptation:    { col: 'NORRRq99_yr', max: 80 },
      ind_occurrence:    { col: 'NORRx1d_yr', max: 150 },
    },
  },
  feux: {
    thematique: 'Feux de forêt',
    indicators: {
      ind_exposition:    { col: 'NORIFM40_yr', max: 60 },
      ind_vulnerabilite: { col: 'NORSWI04_yr', max: 180 },
      ind_adaptation:    { col: 'NORSWI04_yr', max: 180, invert: true },
      ind_occurrence:    { col: 'NORIFM40_yr', max: 60 },
    },
  },
  secheresse: {
    thematique: 'Sécheresse',
    indicators: {
      ind_exposition:    { col: 'NORSWI04_yr', max: 200 },
      ind_vulnerabilite: { col: 'NORSWI04_yr', max: 200 },
      ind_adaptation:    { col: 'NORTMm_seas_JJA', min: 20, max: 40, invert: true },
      ind_occurrence:    { col: 'NORTX35D_yr', max: 40 },
    },
  },
};

/**
 * Normalise une valeur brute entre 0 et 100.
 * Si invert=true, les valeurs basses deviennent des scores élevés.
 */
function normalize(value, { min = 0, max, invert = false } = {}) {
  if (value == null || isNaN(value)) return null;
  const clamped = Math.max(min, Math.min(max, Number(value)));
  const normalized = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
}

/**
 * Calcule les 4 indicateurs et le score global pour une commune/risque.
 */
function computeScores(row, riskDef) {
  const { indicators } = riskDef;
  const scores = {};

  for (const [indKey, def] of Object.entries(indicators)) {
    const col = COLUMN_MAP[def.col];
    const raw = row[col];
    scores[indKey] = normalize(raw, def);
  }

  const validScores = Object.values(scores).filter((s) => s != null);
  const globalScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

  return { ...scores, score: globalScore };
}

/**
 * Dérive le code département depuis le code INSEE.
 * Ex: "13055" → "13", "2A004" → "2A"
 */
function deptFromInsee(insee) {
  const s = String(insee).padStart(5, '0');
  const prefix = s.slice(0, 2);
  if (prefix === '97') return s.slice(0, 3); // DOM
  if (prefix === '2A' || prefix === '2B') return prefix;
  return prefix;
}

async function main() {
  console.log('Loading data_climat.json …');
  const filePath = path.join(process.cwd(), 'public', 'data_climat.json');
  const raw = await fs.readFile(filePath, 'utf8');
  const allRows = JSON.parse(raw);

  // Index par insee_code × scenario
  const byInsee = new Map();
  for (const row of allRows) {
    const insee = String(row.insee_code).padStart(5, '0');
    const scenario = String(row.scenario).toLowerCase(); // gwl15, gwl20, gwl30
    if (!byInsee.has(insee)) byInsee.set(insee, {});
    byInsee.get(insee)[scenario] = row;
  }

  console.log(`Indexed ${byInsee.size} communes across ${allRows.length} rows.`);

  for (const [slug, riskDef] of Object.entries(RISK_DEFINITIONS)) {
    console.log(`\nComputing scores for slug="${slug}" …`);

    const results = [];

    for (const [insee, scenarios] of byInsee) {
      const row = scenarios[TARGET_SCENARIO] || scenarios['gwl15'] || Object.values(scenarios)[0];
      if (!row) continue;

      const { score, ...indicators } = computeScores(row, riskDef);
      if (score === 0) continue;

      results.push({
        insee_code: insee,
        nom_commune: String(row.commune_name),
        departement: deptFromInsee(insee),
        slug,
        score,
        ind_exposition:    indicators.ind_exposition    != null ? Math.round(indicators.ind_exposition)    : null,
        ind_vulnerabilite: indicators.ind_vulnerabilite != null ? Math.round(indicators.ind_vulnerabilite) : null,
        ind_adaptation:    indicators.ind_adaptation    != null ? Math.round(indicators.ind_adaptation)    : null,
        ind_occurrence:    indicators.ind_occurrence    != null ? Math.round(indicators.ind_occurrence)    : null,
      });
    }

    // Top 50
    results.sort((a, b) => b.score - a.score);
    const top50 = results.slice(0, 50);

    console.log(`  Top score: ${top50[0]?.score} (${top50[0]?.nom_commune})`);
    console.log(`  #50 score: ${top50[49]?.score} (${top50[49]?.nom_commune})`);

    // Upsert dans Supabase
    const { error } = await supabase
      .from('communes_tension')
      .upsert(top50, { onConflict: 'slug,insee_code' });

    if (error) {
      console.error(`  ERROR for slug="${slug}":`, error.message);
    } else {
      console.log(`  Upserted ${top50.length} rows for slug="${slug}".`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

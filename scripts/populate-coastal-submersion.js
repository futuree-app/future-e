#!/usr/bin/env node
/**
 * populate-coastal-submersion.js
 *
 * Calcule les scores de submersion côtière pour les communes littorales et
 * les insère dans communes_tension (slug='submersion').
 *
 * Méthodologie :
 *   1. Récupère les centroïdes des communes des 22 départements côtiers
 *      via l'API geo.api.gouv.fr (gratuit, open data)
 *   2. Interroge OpenTopoData (EU DEM 25m) pour 5 points par commune :
 *      le centroïde + 4 points dans la bbox du contour.
 *      EU DEM 25m > SRTM 30m : distingue mer (null) et terrain côtier (altitude réelle).
 *      On prend l'altitude minimale parmi les pixels terre — les pixels mer sont filtrés.
 *   3. Calcule un score côtier : score = max(0, 100 - altitude × 100/15)
 *      → 0m (polder) = 100 | 5m = 67 | 10m = 33 | 15m+ = 0
 *   4. Upsert dans Supabase avec GREATEST : ne diminue jamais un score existant plus élevé
 *
 * Limites connues :
 *   - L'échantillonnage en 5 points (centroïde + coins de la bbox à 35%) réduit l'erreur
 *     centroïde mais ne garantit pas de capturer la zone basse maximale. Pour une précision
 *     fine, il faudrait les tuiles MNT IGN RGE Alti 1m et calculer le percentile 5 par polygone.
 *   - Résolution SRTM 30m : suffisant pour distinguer polders/zones inondables (<5m) des zones
 *     hautes, insuffisant pour des analyses parcellaires.
 *   - Les scores manuels insérés en Supabase (Gravelines 92, Dunkerque 86, etc.) sont toujours
 *     préservés par le GREATEST — le script ne peut pas les écraser.
 *
 * Amélioration future :
 *   Remplacer open-elevation par l'API IGN Géoplateforme Altimétrie quand le endpoint REST
 *   sera stabilisé (actuellement 405 en GET sur data.geopf.fr/altimetrie/rest/elevationLine).
 *   Alternative : WCS IGN ELEVATION.SLOPES pour extraction par emprise.
 *
 * Usage :
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/populate-coastal-submersion.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Départements avec façade maritime (France métropolitaine)
const COASTAL_DEPTS = [
  '06', '11', '13', '14', '17', '22', '29', '30', '33',
  '34', '35', '40', '44', '50', '56', '59', '62', '64',
  '66', '76', '83', '85', '2A', '2B',
];

const BATCH_SIZE = 100; // open-elevation accepte ~100 points par requête
const DELAY_MS = 500;   // délai entre les batches pour ne pas surcharger l'API


/**
 * Score côtier à partir de l'altitude en mètres NGF.
 * Linéaire : 0m → 100, 15m → 0, >15m → 0.
 * Les polders (<0m) sont plafonnés à 100.
 */
function altitudeToCoastalScore(altitudeM) {
  if (altitudeM == null || isNaN(altitudeM)) return null;
  if (altitudeM >= 15) return 0;
  return Math.round(Math.max(0, 100 - Math.max(0, altitudeM) * (100 / 15)));
}

/**
 * Récupère les communes d'un département avec leur centroïde.
 * API gratuite, pas de clé requise.
 */
async function fetchCommunesForDept(dept) {
  const url = `https://geo.api.gouv.fr/communes?codeDepartement=${dept}&fields=centre,contour,code,nom&format=json&limit=2000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geo.api.gouv.fr erreur pour dept ${dept}: ${res.status}`);
  return res.json();
}

/**
 * Génère 5 points d'échantillonnage pour une commune :
 * le centroïde + 4 points aux coins de la bbox du contour (à 80% pour rester dans la commune).
 * On prend ensuite l'altitude minimale — plus représentatif du risque réel que le seul centroïde.
 */
function getSamplePoints(commune) {
  const centre = commune.centre?.coordinates; // [lon, lat]
  if (!centre) return [];

  const points = [{ latitude: centre[1], longitude: centre[0] }];

  // Extraire la bbox du contour si disponible
  const coords = commune.contour?.coordinates?.[0];
  if (coords && coords.length > 2) {
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const cx = (minLon + maxLon) / 2;
    const cy = (minLat + maxLat) / 2;
    const fx = 0.35; // facteur : 35% du demi-côté pour rester dans le polygone
    const fy = 0.35;
    const dx = (maxLon - minLon) * fx;
    const dy = (maxLat - minLat) * fy;
    points.push(
      { latitude: cy - dy, longitude: cx - dx }, // SO
      { latitude: cy - dy, longitude: cx + dx }, // SE
      { latitude: cy + dy, longitude: cx - dx }, // NO
      { latitude: cy + dy, longitude: cx + dx }, // NE
    );
  }

  return points;
}

/**
 * Interroge OpenTopoData (EU DEM 25m) pour une liste de coordonnées (batch).
 * Retourne un tableau d'altitudes dans le même ordre.
 * Les pixels mer/eau retournent null → filtrés en aval pour prendre le min des terres.
 *
 * EU DEM 25m est plus précis que SRTM 30m pour la France et distingue correctement
 * la mer (null) du terrain côtier (altitude réelle). Pas de clé requise, 100 pts/requête.
 */
async function fetchElevations(locations) {
  const query = locations.map((l) => `${l.latitude},${l.longitude}`).join('|');
  const url = `https://api.opentopodata.org/v1/eudem25m?locations=${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`opentopodata erreur: ${res.status}`);
  const json = await res.json();
  if (json.status !== 'OK') throw new Error(`opentopodata status: ${json.status}`);
  return json.results.map((r) => r.elevation); // null si pixel eau/mer
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deptFromInsee(insee) {
  const s = String(insee).padStart(5, '0');
  const p = s.slice(0, 2);
  if (p === '97') return s.slice(0, 3);
  if (p === '2A' || p === '2B') return p;
  return p;
}

async function main() {
  // Charger la liste des 1000 communes cibles
  const top1000Raw = await fs.readFile(
    path.join(process.cwd(), 'src/data/top1000-communes.json'),
    'utf8',
  );
  const top1000Set = new Set(JSON.parse(top1000Raw));

  console.log(`Top1000 communes chargées : ${top1000Set.size}`);

  // Récupérer toutes les communes côtières avec centroïde
  console.log('\nRécupération des centroïdes pour les départements côtiers…');
  const allCostalCommunes = [];

  for (const dept of COASTAL_DEPTS) {
    try {
      const communes = await fetchCommunesForDept(dept);
      // Filtre : seulement celles dans le top1000
      const filtered = communes.filter(
        (c) => top1000Set.has(String(c.code).padStart(5, '0')) && c.centre?.coordinates,
      );
      allCostalCommunes.push(...filtered);
      console.log(`  dept ${dept} : ${filtered.length} communes dans le top1000`);
    } catch (err) {
      console.warn(`  dept ${dept} : erreur — ${err.message}`);
    }
  }

  console.log(`\nTotal communes côtières dans le top1000 : ${allCostalCommunes.length}`);

  // Préparer les points d'échantillonnage (5 par commune : centroïde + 4 coins de la bbox)
  // On mémorise pour chaque commune : l'index de départ dans le tableau flat et le nombre de points.
  const communeMeta = []; // { startIdx, count }
  const allLocations = [];

  for (const commune of allCostalCommunes) {
    const pts = getSamplePoints(commune);
    communeMeta.push({ startIdx: allLocations.length, count: pts.length });
    allLocations.push(...pts);
  }

  // Récupérer les altitudes par batches
  console.log(`\nRécupération des altitudes (${allLocations.length} points, ${Math.ceil(allLocations.length / BATCH_SIZE)} batches)…`);
  const allElevations = [];

  for (let i = 0; i < allLocations.length; i += BATCH_SIZE) {
    const batch = allLocations.slice(i, i + BATCH_SIZE);
    try {
      const elevs = await fetchElevations(batch);
      allElevations.push(...elevs);
      process.stdout.write(`  batch ${Math.floor(i / BATCH_SIZE) + 1} OK (${elevs.length} points)\r`);
    } catch (err) {
      console.warn(`  batch ${Math.floor(i / BATCH_SIZE) + 1} erreur : ${err.message}`);
      allElevations.push(...new Array(batch.length).fill(null));
    }
    if (i + BATCH_SIZE < allLocations.length) await sleep(DELAY_MS);
  }

  console.log('\n');

  // Calculer les scores et préparer l'upsert
  const toUpsert = [];

  allCostalCommunes.forEach((commune, idx) => {
    const { startIdx, count } = communeMeta[idx];
    const rawSamples = allElevations.slice(startIdx, startIdx + count);
    const sampleElevs = rawSamples.filter((e) => e != null);

    // Filtre contact maritime : au moins 1 pixel nul = la commune touche l'eau
    // (mer, lagune, estuaire). Les communes basses mais purement terrestres sont exclues.
    // L'EUDEM retourne null pour tout pixel aquatique — rivières incluses, ce qui est
    // acceptable : un estuaire fluvial exposé à la marée est un risque côtier réel.
    const touchesWater = sampleElevs.length < count;
    if (!touchesWater) return;

    // Altitude minimale parmi les points terres (pixels mer exclus)
    const altitude = sampleElevs.length > 0 ? Math.min(...sampleElevs) : null;
    const score = altitudeToCoastalScore(altitude);

    if (score === null || score === 0) return;

    const insee = String(commune.code).padStart(5, '0');

    toUpsert.push({
      insee_code: insee,
      nom_commune: commune.nom,
      departement: deptFromInsee(insee),
      slug: 'submersion',
      score,
      // ind_exposition reste null pour les scores côtiers altimétriques :
      // la page utilise ind_exposition==null pour distinguer score côtier vs score DRIAS fluvial
      ind_exposition: null,
      ind_vulnerabilite: null,
      ind_adaptation: null,
      ind_occurrence: null,
      altitude_m: parseFloat(altitude?.toFixed(1) ?? null),
    });
  });

  console.log(`Communes avec score côtier > 0 : ${toUpsert.length}`);
  if (toUpsert.length === 0) {
    console.log('Rien à insérer.');
    return;
  }

  // Distribution des scores
  const byScore = {};
  toUpsert.forEach((r) => {
    const bucket = Math.floor(r.score / 10) * 10;
    byScore[bucket] = (byScore[bucket] || 0) + 1;
  });
  console.log('Distribution des scores :', byScore);

  // Top 10
  const top10 = [...toUpsert].sort((a, b) => b.score - a.score).slice(0, 10);
  console.log('\nTop 10 communes côtières :');
  top10.forEach((r, i) =>
    console.log(`  ${i + 1}. ${r.nom_commune} (${r.insee_code}) — altitude ${r.altitude_m}m → score ${r.score}`),
  );

  // Upsert en Supabase avec GREATEST côté JS :
  //   1. Lire les scores existants pour les communes du batch
  //   2. Filtrer : ne pousser que si new_score > existing_score (ou pas encore en DB)
  //   3. Upsert uniquement les lignes retenues
  console.log('\nUpsert en Supabase (GREATEST côté JS)…');

  const UPSERT_BATCH = 200;
  let inserted = 0;
  let skipped = 0;

  // Récupérer tous les scores existants en une requête
  const allInsees = toUpsert.map((r) => r.insee_code);
  const { data: existing, error: fetchErr } = await supabase
    .from('communes_tension')
    .select('insee_code, score')
    .eq('slug', 'submersion')
    .in('insee_code', allInsees);

  if (fetchErr) {
    console.warn('  Impossible de lire les scores existants :', fetchErr.message);
  }

  const existingMap = new Map((existing ?? []).map((r) => [r.insee_code, r.score]));

  // Filtrer : ne pas écraser un score existant plus élevé
  const toWrite = toUpsert.filter((r) => {
    const existing = existingMap.get(r.insee_code);
    if (existing != null && existing >= r.score) {
      skipped++;
      return false;
    }
    return true;
  });

  console.log(`  ${toWrite.length} à écrire, ${skipped} préservés (score existant ≥ score calculé)`);

  for (let i = 0; i < toWrite.length; i += UPSERT_BATCH) {
    const batch = toWrite.slice(i, i + UPSERT_BATCH);

    const { error: upsertErr } = await supabase
      .from('communes_tension')
      .upsert(
        batch.map(({ altitude_m: _, ...r }) => r),
        { onConflict: 'slug,insee_code', ignoreDuplicates: false },
      );

    if (upsertErr) {
      console.error(`  Erreur batch ${Math.floor(i / UPSERT_BATCH) + 1}:`, upsertErr.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\nUpsert terminé : ${inserted} communes traitées.`);
  console.log('\nDone. Pense à relancer populate-communes-tension.js pour les scores fluviaux.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * populate-communes-altitude.js
 *
 * Récupère l'altitude (centroïde, mètres NGF) de chaque commune via l'API IGN
 * Géoplateforme altimétrie (RGE ALTI), source officielle française, gratuite et
 * sans clé. Écrit un cache data/communes-altitude.json { insee: altitude_m }.
 *
 * Sert ensuite au build de l'index (build-comparateur-index.mjs) pour ajouter le
 * champ `altitude`, base de la détection « montagne » (ancres géographiques).
 *
 * Coordonnées : data/comparateur-index.json (insee, lat, lon = centroïdes DRIAS).
 * Endpoint : https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json
 *            ?resource=ign_rge_alti_wld&zonly=true&lon=..|..&lat=..|..  (GET batché)
 *   Le POST renvoie une erreur côté IGN ; on reste donc en GET (testé OK).
 *
 * Robustesse : résumable (relit le cache, ne refait que le manquant), rate-limité,
 * repli sur open-elevation si un batch IGN échoue.
 *
 * Usage : node scripts/populate-communes-altitude.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const INDEX = path.join(root, 'data', 'comparateur-index.json');
const OUT = path.join(root, 'data', 'communes-altitude.json');

const IGN = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
const BATCH = 120; // points par requête GET (testé < limite URL)
const DELAY_MS = 200; // politesse entre requêtes (~5/s)
const SAVE_EVERY = 20; // batches entre deux sauvegardes du cache

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// IGN renvoie un sentinel très négatif (-99999) hors couverture → null.
function cleanElev(z) {
  return typeof z === 'number' && z > -1000 && z < 9000 ? Math.round(z) : null;
}

async function fetchIGN(batch) {
  const lon = batch.map((c) => c.lon).join('|');
  const lat = batch.map((c) => c.lat).join('|');
  const url = `${IGN}?resource=ign_rge_alti_wld&zonly=true&lon=${lon}&lat=${lat}`;
  let res = await fetch(url);
  if (res.status === 429 || res.status >= 500) {
    await sleep(1500);
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`IGN ${res.status}`);
  const j = await res.json();
  const els = j.elevations;
  if (!Array.isArray(els) || els.length !== batch.length) {
    throw new Error(`IGN longueur ${els ? els.length : 'NaN'} != ${batch.length}`);
  }
  return els.map(cleanElev);
}

async function fetchOpenElevation(batch) {
  const locs = batch.map((c) => `${c.lat},${c.lon}`).join('|');
  const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${locs}`);
  if (!res.ok) throw new Error(`open-elevation ${res.status}`);
  const j = await res.json();
  return j.results.map((r) => cleanElev(r.elevation));
}

async function main() {
  const { communes } = JSON.parse(await fs.readFile(INDEX, 'utf8'));

  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(OUT, 'utf8'));
  } catch {
    /* premier run */
  }

  const todo = communes
    .filter((c) => cache[c.insee] === undefined && Number.isFinite(c.lat) && Number.isFinite(c.lon))
    .map((c) => ({ insee: c.insee, lat: c.lat, lon: c.lon }));

  console.log(
    `${communes.length} communes, ${Object.keys(cache).length} déjà en cache, ${todo.length} à récupérer.`,
  );

  let done = 0;
  let fails = 0;
  let usedFallback = 0;
  const nBatches = Math.ceil(todo.length / BATCH);

  for (let b = 0; b < nBatches; b++) {
    const batch = todo.slice(b * BATCH, b * BATCH + BATCH);
    let alts;
    try {
      alts = await fetchIGN(batch);
    } catch (e) {
      try {
        await sleep(500);
        alts = await fetchOpenElevation(batch);
        usedFallback += batch.length;
        console.warn(`  batch ${b}: IGN KO (${e.message}), repli open-elevation`);
      } catch (e2) {
        console.warn(`  batch ${b}: échec total (${e2.message})`);
        alts = batch.map(() => null);
        fails += batch.length;
      }
    }
    batch.forEach((c, k) => {
      cache[c.insee] = alts[k];
    });
    done += batch.length;

    if (b % SAVE_EVERY === 0) await fs.writeFile(OUT, JSON.stringify(cache));
    if (b % 10 === 0) console.log(`  ${done}/${todo.length}…`);
    await sleep(DELAY_MS);
  }

  await fs.writeFile(OUT, JSON.stringify(cache));
  const vals = Object.values(cache).filter((v) => v != null);
  console.log(
    `✓ ${Object.keys(cache).length} communes en cache, ${vals.length} altitudes non nulles, ` +
      `${usedFallback} via repli, ${fails} échecs.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

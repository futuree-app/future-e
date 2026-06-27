#!/usr/bin/env node
/**
 * build-comparateur-index.mjs
 *
 * Construit l'index national du Comparateur de vie futur•e (« Où vivre »).
 * Pièce maîtresse de la V1 : tout le matching déterministe lit cet index, donc
 * un balayage des 33 000+ communes est instantané et gratuit (zéro appel API,
 * zéro LLM au moment de la recherche).
 *
 * Entrées (toutes locales) :
 *   - public/data_climat.json        : DRIAS, 35 006 communes × 3 scénarios,
 *                                      lat/lon embarqués (col01/col02).
 *   - data/communes-population.json  : cache population/densité (optionnel ;
 *                                      voir scripts/fetch-communes-population.mjs).
 *
 * Sortie :
 *   - data/comparateur-index.json    : { meta, communes: [...] }
 *
 * Périmètre V1 : France métropolitaine (Corse incluse ; DROM exclus).
 * Scénario climatique retenu : gwl20 (+2°C, horizon 2050).
 *
 * Usage :
 *   node scripts/fetch-communes-population.mjs   # une fois, pour la population
 *   node scripts/build-comparateur-index.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const SCENARIO = 'gwl20';

// Mapping colonnes DRIAS → indicateurs. Source de vérité : src/lib/drias-json.ts
// (ne PAS utiliser le mapping de populate-communes-tension.js qui diffère sur
// les colonnes précipitations).
const COLUMN_MAP = {
  NORTMm_yr: 'column04', // T° moyenne annuelle (°C)
  NORTMm_seas_JJA: 'column05', // T° moyenne été (°C)
  NORTMm_seas_DJF: 'column06', // T° moyenne hiver (°C) — pour la douceur perçue
  NORTX35D_yr: 'column08', // jours Tmax > 35°C / an
  NORTX30D_yr: 'column09', // jours Tmax > 30°C / an
  NORTR_yr: 'column10', // nuits tropicales (Tmin > 20°C) / an
  NORRR_yr: 'column11', // précipitations annuelles (mm) — sécheresse perçue (l'ensoleillement vient désormais du rayonnement ERA5, cf. populate-rayonnement-*)
  NORRRq99_yr: 'column14', // précipitations remarquables p99 (mm)
  NORRx1d_yr: 'column15', // précip. max sur 1 jour (mm)
  NORIFM40_yr: 'column17', // jours d'indice météo feu > 40 / an
  NORSWI04_yr: 'column18', // jours de sécheresse des sols (SWI < 0,4) / an
};
const INDICATORS = Object.keys(COLUMN_MAP);

const DEPT_TO_REGION = {
  '01': 'Auvergne-Rhône-Alpes', '02': 'Hauts-de-France', '03': 'Auvergne-Rhône-Alpes',
  '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
  '06': "Provence-Alpes-Côte d'Azur", '07': 'Auvergne-Rhône-Alpes', '08': 'Grand Est',
  '09': 'Occitanie', '10': 'Grand Est', '11': 'Occitanie', '12': 'Occitanie',
  '13': "Provence-Alpes-Côte d'Azur", '14': 'Normandie', '15': 'Auvergne-Rhône-Alpes',
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '18': 'Centre-Val de Loire',
  '19': 'Nouvelle-Aquitaine', '2A': 'Corse', '2B': 'Corse', '21': 'Bourgogne-Franche-Comté',
  '22': 'Bretagne', '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine',
  '25': 'Bourgogne-Franche-Comté', '26': 'Auvergne-Rhône-Alpes', '27': 'Normandie',
  '28': 'Centre-Val de Loire', '29': 'Bretagne', '30': 'Occitanie', '31': 'Occitanie',
  '32': 'Occitanie', '33': 'Nouvelle-Aquitaine', '34': 'Occitanie', '35': 'Bretagne',
  '36': 'Centre-Val de Loire', '37': 'Centre-Val de Loire', '38': 'Auvergne-Rhône-Alpes',
  '39': 'Bourgogne-Franche-Comté', '40': 'Nouvelle-Aquitaine', '41': 'Centre-Val de Loire',
  '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '44': 'Pays de la Loire',
  '45': 'Centre-Val de Loire', '46': 'Occitanie', '47': 'Nouvelle-Aquitaine',
  '48': 'Occitanie', '49': 'Pays de la Loire', '50': 'Normandie', '51': 'Grand Est',
  '52': 'Grand Est', '53': 'Pays de la Loire', '54': 'Grand Est', '55': 'Grand Est',
  '56': 'Bretagne', '57': 'Grand Est', '58': 'Bourgogne-Franche-Comté', '59': 'Hauts-de-France',
  '60': 'Hauts-de-France', '61': 'Normandie', '62': 'Hauts-de-France', '63': 'Auvergne-Rhône-Alpes',
  '64': 'Nouvelle-Aquitaine', '65': 'Occitanie', '66': 'Occitanie', '67': 'Grand Est',
  '68': 'Grand Est', '69': 'Auvergne-Rhône-Alpes', '70': 'Bourgogne-Franche-Comté',
  '71': 'Bourgogne-Franche-Comté', '72': 'Pays de la Loire', '73': 'Auvergne-Rhône-Alpes',
  '74': 'Auvergne-Rhône-Alpes', '75': 'Île-de-France', '76': 'Normandie', '77': 'Île-de-France',
  '78': 'Île-de-France', '79': 'Nouvelle-Aquitaine', '80': 'Hauts-de-France', '81': 'Occitanie',
  '82': 'Occitanie', '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
  '85': 'Pays de la Loire', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  '88': 'Grand Est', '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France', '94': 'Île-de-France',
  '95': 'Île-de-France',
};

// ── Distance à la côte (APPROXIMATION V1) ───────────────────────────────────
// On calcule la distance haversine au point le plus proche parmi une liste de
// villes côtières de référence. C'est une APPROXIMATION assumée pour la V1 :
// entre deux ancres éloignées (longues plages des Landes, par ex.), la distance
// est surestimée. À remplacer par le trait de côte IGN avant de durcir la
// contrainte. Isolé ici pour un remplacement trivial. [lat, lon]
const COAST_ANCHORS = [
  // Mer du Nord / Manche
  [51.03, 2.38], [50.95, 1.86], [50.73, 1.61], [50.10, 1.84], [49.92, 1.08],
  [49.49, 0.11], [49.29, -0.25], [49.18, -0.37], [49.64, -1.62], [48.84, -1.60],
  [48.65, -2.01],
  // Bretagne
  [48.51, -2.77], [48.39, -4.49], [47.97, -4.10], [47.87, -3.92], [47.75, -3.37],
  [47.66, -2.76],
  // Atlantique
  [47.27, -2.21], [46.50, -1.78], [46.16, -1.15], [45.62, -1.03], [44.66, -1.17],
  [44.39, -1.25], [44.00, -1.31], [43.69, -1.44], [43.48, -1.56], [43.36, -1.78],
  // Méditerranée (golfe du Lion → Côte d'Azur)
  [42.45, 3.17], [42.70, 3.03], [43.02, 3.04], [43.18, 3.18], [43.29, 3.47],
  [43.40, 3.70], [43.56, 4.08], [43.40, 4.85], [43.30, 5.37], [43.12, 5.93],
  [43.12, 6.13], [43.27, 6.64], [43.42, 6.77], [43.55, 7.02], [43.70, 7.27], [43.78, 7.50],
  // Corse
  [42.70, 9.45], [42.57, 8.76], [41.93, 8.74], [41.59, 9.28], [41.39, 9.16],
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function distanceCoteKm(lat, lon) {
  let min = Infinity;
  for (const [aLat, aLon] of COAST_ANCHORS) {
    const d = haversineKm(lat, lon, aLat, aLon);
    if (d < min) min = d;
  }
  return Math.round(min);
}

// ── Pression agricole / phytosanitaire (V1.6) ───────────────────────────────
// pression = intensité de traitement (IFT) × prévalence agricole (part SAU).
// Une commune très traitée mais peu agricole (ville avec une vigne) a une
// pression modérée ; une commune très agricole et très traitée (Champagne) max.
// C'est une PRESSION territoriale, pas une exposition des habitants.
function lerpAnchors(anchors, x) {
  if (x == null) return null;
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1];
      const [x1, y1] = anchors[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}
const IFT_INTENSITY = [[0, 0], [1, 15], [2, 35], [3.5, 55], [6, 80], [10, 95], [16, 100]];
const SAU_PREVALENCE = [[0, 0.25], [5, 0.45], [15, 0.7], [30, 0.9], [50, 1]];
function pressionAgricole(ift_t, p_sau) {
  if (ift_t == null) return null;
  const intensity = lerpAnchors(IFT_INTENSITY, ift_t);
  const prev = lerpAnchors(SAU_PREVALENCE, p_sau ?? 0);
  return Math.round(intensity * prev);
}

function deptFromInsee(insee) {
  if (insee.startsWith('2A') || insee.startsWith('2B')) return insee.slice(0, 2);
  if (/^97/.test(insee) || /^98/.test(insee)) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

function isMetropole(insee) {
  return !/^(97|98)/.test(insee);
}

// Percentile ascendant (0–100) d'une valeur dans un tableau trié croissant.
// 0 = plus petite valeur de France, 100 = plus grande.
function makePercentile(sortedVals) {
  const n = sortedVals.length;
  return (v) => {
    if (n <= 1) return 50;
    // borne inférieure : nombre de valeurs strictement < v
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedVals[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return Math.round((lo / (n - 1)) * 100);
  };
}

async function main() {
  const root = process.cwd();

  console.log('Lecture public/data_climat.json…');
  const climRaw = await fs.readFile(path.join(root, 'public', 'data_climat.json'), 'utf8');
  const rows = JSON.parse(climRaw);

  // Vivabilité (population/densité + air/soins/services). Surensemble du cache
  // population : on tente d'abord communes-vivabilite.json, sinon population.json.
  let popMap = {};
  try {
    popMap = JSON.parse(await fs.readFile(path.join(root, 'data', 'communes-vivabilite.json'), 'utf8'));
    console.log(`Vivabilité : ${Object.keys(popMap).length} communes (air/soins/services inclus).`);
  } catch {
    try {
      popMap = JSON.parse(await fs.readFile(path.join(root, 'data', 'communes-population.json'), 'utf8'));
      console.warn('⚠ communes-vivabilite.json absent : air/soins/services = null. Lancez fetch-communes-vivabilite.mjs.');
    } catch {
      console.warn('⚠ Aucun cache population/vivabilité : population et indicateurs santé = null.');
    }
  }

  // Altitude (centroïde IGN RGE ALTI). Cache produit par populate-communes-altitude.js.
  let altMap = {};
  try {
    altMap = JSON.parse(await fs.readFile(path.join(root, 'data', 'communes-altitude.json'), 'utf8'));
    const n = Object.values(altMap).filter((v) => v != null).length;
    console.log(`Altitude : ${n} communes (centroïde IGN).`);
  } catch {
    console.warn('⚠ communes-altitude.json absent : altitude = null. Lancez populate-communes-altitude.js.');
  }

  // Viabilité du bassin d'emploi (taille + diversité, maille ZE2020 héritée par
  // commune). Cache produit par populate-communes-emploi.js (INSEE Flores A38).
  let emploiMap = {};
  try {
    const raw = JSON.parse(await fs.readFile(path.join(root, 'data', 'communes-emploi.json'), 'utf8'));
    emploiMap = raw.data ?? raw;
    const n = Object.keys(emploiMap).length;
    console.log(`Emploi (viabilité bassin) : ${n} communes (ZE2020, Flores A38).`);
  } catch {
    console.warn('⚠ communes-emploi.json absent : emploi = null. Lancez populate-communes-emploi.js --write.');
  }

  // Parts sectorielles A38 par ZE (pour la pression climatique sur l'économie, lot B).
  let zeNa38 = {};
  try {
    const raw = JSON.parse(await fs.readFile(path.join(root, 'data', 'ze-emploi-na38.json'), 'utf8'));
    zeNa38 = raw.data ?? raw;
    console.log(`Parts A38 par ZE : ${Object.keys(zeNa38).length} zones (pression climatique éco).`);
  } catch {
    console.warn('⚠ ze-emploi-na38.json absent : pression_eco = null. Lancez populate-communes-emploi.js --write.');
  }

  // 1) Garder une ligne gwl20 par commune métropolitaine
  const byInsee = new Map();
  for (const row of rows) {
    if (String(row.scenario) !== SCENARIO) continue;
    const insee = String(row.insee_code).padStart(5, '0');
    if (!isMetropole(insee)) continue;
    if (!byInsee.has(insee)) byInsee.set(insee, row);
  }
  console.log(`${byInsee.size} communes métropolitaines (scénario ${SCENARIO}).`);

  // 2) Extraire les indicateurs + géo
  const communes = [];
  for (const [insee, row] of byInsee) {
    const lat = Number(row.column01);
    const lon = Number(row.column02);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const clim = {};
    for (const [ind, col] of Object.entries(COLUMN_MAP)) {
      const v = row[col];
      clim[ind] = v == null || Number.isNaN(Number(v)) ? null : Number(v);
    }

    const dept = deptFromInsee(insee);
    const pop = popMap[insee] ?? {};

    communes.push({
      insee,
      nom: String(row.commune_name),
      dept,
      region: DEPT_TO_REGION[dept] ?? null,
      lat,
      lon,
      population: pop.population ?? null,
      densite: pop.densite ?? null,
      distance_cote_km: distanceCoteKm(lat, lon),
      altitude: altMap[insee] ?? null, // m NGF, centroïde IGN RGE ALTI (cf. populate-communes-altitude.js)
      // Viabilité du bassin d'emploi (ZE2020 héritée). taille/diversite = 0–100.
      emploi: emploiMap[insee]
        ? { ze: emploiMap[insee].ze, taille: emploiMap[insee].taille, diversite: emploiMap[insee].diversite }
        : null,
      clim,
      // Santé environnementale + vivabilité (scorables nationalement)
      viv: {
        pm25: pop.pm25 ?? null,
        no2: pop.no2 ?? null,
        apl: pop.apl ?? null,          // accès médecins généralistes (plus haut = mieux)
        eloignement: pop.eloignement ?? null, // % pop > 20 min d'un service (plus bas = mieux)
      },
      // Pression agricole / phytosanitaire (V1.6)
      agri: {
        ift_t: pop.ift_t ?? null,
        ift_h: pop.ift_h ?? null,
        p_sau: pop.p_sau ?? null,
        p_bio: pop.p_bio ?? null,
        equip: pop.equip ?? null,
      },
      pression_agricole: pressionAgricole(pop.ift_t ?? null, pop.p_sau ?? null), // 0–100, haut = plus de pression
    });
  }

  // 3) Percentiles nationaux par indicateur
  const percentileFns = {};
  for (const ind of INDICATORS) {
    const vals = communes
      .map((c) => c.clim[ind])
      .filter((v) => v != null)
      .sort((a, b) => a - b);
    percentileFns[ind] = makePercentile(vals);
  }
  for (const c of communes) {
    c.pct = {};
    for (const ind of INDICATORS) {
      c.pct[ind] = c.clim[ind] == null ? null : percentileFns[ind](c.clim[ind]);
    }
  }

  // Percentiles nationaux des indicateurs santé/vivabilité
  const VIV_FIELDS = ['pm25', 'no2', 'apl', 'eloignement'];
  const vivPctFns = {};
  for (const f of VIV_FIELDS) {
    const vals = communes.map((c) => c.viv[f]).filter((v) => v != null).sort((a, b) => a - b);
    vivPctFns[f] = makePercentile(vals);
  }
  for (const c of communes) {
    c.vivpct = {};
    for (const f of VIV_FIELDS) {
      c.vivpct[f] = c.viv[f] == null ? null : vivPctFns[f](c.viv[f]);
    }
  }

  // Pression climatique sur l'économie locale (lot B, NARRATIF NON SCORÉ, cf.
  // PRESSION_CLIMATIQUE_ECONOMIE.md). Σ part_secteur(ZE) × sensibilité × aléa(pct
  // commune). N'entre JAMAIS dans le score : signal de lecture prudente seulement.
  // A38 : AZ = agri + sylviculture + pêche (forêt non isolable) → exposée sécheresse
  // ET feu, on garde l'aléa dominant. IZ = hébergement-restauration = proxy tourisme
  // (estival en plaine/côte, montagne en altitude ; neige = proxy faible, assumé).
  const clampB = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // Seuil minimal de DÉPENDANCE : on ne flague un couple que si le secteur sensible
  // pèse réellement dans l'emploi local (sinon aléa fort × part faible flaguerait à
  // tort, c.-à-d. un signal climatique déguisé). Validé 2026-06-01.
  const MIN_PART = 0.08;
  // Type de tourisme classé au niveau ZE (l'altitude communale rate les villes-services
  // de vallée : Albertville 339 m est du ski). Médiane ZE ≥ 900 m = tourisme de montagne.
  const zeAlts = {};
  for (const c of communes) {
    const ze = emploiMap[c.insee]?.ze;
    if (ze && c.altitude != null) (zeAlts[ze] ||= []).push(c.altitude);
  }
  const zeMedAlt = {};
  for (const [ze, a] of Object.entries(zeAlts)) {
    a.sort((x, y) => x - y);
    zeMedAlt[ze] = a[Math.floor(a.length / 2)];
  }
  for (const c of communes) {
    c._pe = null;
    const ze = emploiMap[c.insee]?.ze;
    const sec = ze ? zeNa38[ze] : null;
    if (!sec || !sec.total) continue;
    const part = (code) => (sec.secteurs?.[code] ?? 0) / sec.total;
    const azPart = part('AZ');
    const izPart = part('IZ');
    const couples = [];
    // AZ (agri + forêt) : sécheresse (0,7) vs feu (0,8). « feu » RÉSERVÉ aux vraies
    // zones à risque incendie (percentile ≥ 80) : A38 mélange forêt et vignes/cultures,
    // et étiqueter « feu » un vignoble (Beaune) serait faux. Ailleurs → sécheresse.
    if (azPart >= MIN_PART) {
      const sech = 0.7 * ((c.pct.NORSWI04_yr ?? 0) / 100);
      const feu = 0.8 * ((c.pct.NORIFM40_yr ?? 0) / 100);
      const feuHigh = (c.pct.NORIFM40_yr ?? 0) >= 80;
      couples.push(feuHigh && feu >= sech
        ? { secteur: 'agri_foret', alea: 'feu', contrib: azPart * feu }
        : { secteur: 'agri_foret', alea: 'secheresse', contrib: azPart * sech });
    }
    // IZ (proxy tourisme) : estival (chaleur) en plaine, montagne (neige) en altitude.
    // Type classé par la médiane d'altitude de la ZE (pas la commune : cf. ci-dessus).
    if (izPart >= MIN_PART) {
      const montagne = (zeMedAlt[ze] ?? 0) >= 900;
      if (montagne) {
        // Tourisme de montagne = DÉPENDANCE structurelle à une activité climato-sensible.
        // Plancher 0,45 (l'exposition ne s'efface pas pour une station haute et froide),
        // + increment pour les stations basses / aux hivers doux (proxy faible, assumé).
        const altRisk = clampB((1800 - (c.altitude ?? 0)) / (1800 - 800), 0, 1);
        const winterRisk = (c.pct.NORTMm_seas_DJF ?? 50) / 100;
        const neige = clampB(0.45 + 0.4 * (0.5 * altRisk + 0.5 * winterRisk), 0, 1);
        couples.push({ secteur: 'tourisme_montagne', alea: 'neige', contrib: izPart * 0.8 * neige });
      } else {
        const chaleur = 0.7 * ((c.pct.NORTX30D_yr ?? 0) / 100);
        couples.push({ secteur: 'tourisme_estival', alea: 'chaleur', contrib: izPart * chaleur });
      }
    }
    if (!couples.length) continue;
    const brute = couples.reduce((s, x) => s + x.contrib, 0);
    const dom = couples.reduce((a, b) => (b.contrib > a.contrib ? b : a));
    c._pe = { brute, secteur: dom.secteur, alea: dom.alea };
  }
  // Paliers par percentiles nationaux de la pression brute (> 0).
  const peVals = communes.map((c) => c._pe?.brute).filter((v) => v != null && v > 0).sort((a, b) => a - b);
  const peP = (p) => peVals[Math.min(peVals.length - 1, Math.floor((p / 100) * peVals.length))] ?? Infinity;
  const PE_MODEREE = peP(70), PE_MARQUEE = peP(90);
  let peModeree = 0, peMarquee = 0;
  for (const c of communes) {
    const pe = c._pe;
    delete c._pe;
    if (!pe || pe.brute < PE_MODEREE) { c.pression_eco = null; continue; } // faible → aucune phrase
    const palier = pe.brute >= PE_MARQUEE ? 'marquee' : 'moderee';
    if (palier === 'marquee') peMarquee++; else peModeree++;
    c.pression_eco = { palier, secteur: pe.secteur, alea: pe.alea };
  }
  console.log(`Pression climatique éco : ${peMarquee} marquée, ${peModeree} modérée (seuils brut p70=${PE_MODEREE.toFixed(3)} p90=${PE_MARQUEE.toFixed(3)}).`);

  const withPop = communes.filter((c) => c.population != null).length;
  const meta = {
    generatedScenario: SCENARIO,
    horizon: '2050 (+2°C)',
    perimetre: 'France métropolitaine (Corse incluse, DROM exclus)',
    count: communes.length,
    countWithPopulation: withPop,
    indicators: INDICATORS,
    vivIndicators: ['pm25', 'no2', 'apl', 'eloignement'],
    vivSource: 'ADEME data_communes (air de fond, APL médecins, éloignement services)',
    percentile: 'ascendant 0–100 sur la France métropolitaine (0 = plus faible valeur)',
    approximations: [
      'distance_cote_km : min haversine à une liste de villes côtières (V1, à remplacer par le trait de côte IGN)',
      'population/densité : ADEME data_communes (population_totale_2021, densite_de_population_2022)',
      'altitude : centroïde de la commune via IGN RGE ALTI (Géoplateforme). Sous-estime une commune de vallée étendue (centroïde en fond de vallée).',
      'emploi : viabilité du bassin (taille + diversité A38) à la maille ZE2020 INSEE, héritée par commune. Flores fin 2024, salarié uniquement (sous-estime agriculture/indépendants).',
      'pression_eco : pression climatique sur l\'économie locale (NARRATIF, hors score). Σ part_secteur(ZE) × sensibilité × aléa(pct). AZ = agri+forêt (sécheresse/feu) ; IZ = proxy tourisme (estival=chaleur en plaine, montagne=neige en altitude, proxy faible). Ne mesure PAS la capacité d\'adaptation. Paliers par percentiles nationaux (modérée p70, marquée p90).',
    ],
    columnMapSource: 'src/lib/drias-json.ts',
  };

  const outPath = path.join(root, 'data', 'comparateur-index.json');
  await fs.writeFile(outPath, JSON.stringify({ meta, communes }), 'utf8');
  console.log(
    `✓ Index écrit : ${outPath}\n  ${communes.length} communes, ${withPop} avec population.`,
  );
}

main().catch((err) => {
  console.error('Échec :', err.message);
  process.exit(1);
});

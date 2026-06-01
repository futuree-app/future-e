#!/usr/bin/env node
/**
 * populate-communes-emploi.js
 *
 * Signal de VIABILITÉ du bassin d'emploi (lot A du chantier emploi). Maille
 * zone d'emploi INSEE (ZE2020, ~306 zones), héritée par commune. Deux entrées :
 *   - taille    : nombre d'emplois du bassin, via une courbe saturante (anti-biais
 *                 métropole : un bassin moyen diversifié est déjà ~80/100) ;
 *   - diversite : entropie de Shannon normalisée sur les parts sectorielles A38.
 * Le score final (0.6·taille + 0.4·diversite) vit dans le MOTEUR, pas ici : ce
 * cache ne porte que les deux ingrédients normalisés + l'emploi brut.
 *
 * Sources (téléchargées dans data/source/, non committées, cf. .gitignore) :
 *   - Flores A38 fin 2024 (effectifs salariés par ZE × secteur A38), INSEE :
 *     https://www.insee.fr/fr/statistiques/fichier/8266010/DS_FLORES_A38_2024_CSV_FR.zip
 *     On lit le niveau GEO_OBJECT=ZE2020 directement (complet, statut A), ce qui
 *     évite le secret statistique massif du niveau commune. Salarié uniquement
 *     (pas de non-salarié) : sous-estime agriculture et indépendants. Limite assumée.
 *   - Composition communale ZE2020 (commune → zone d'emploi), INSEE :
 *     https://www.insee.fr/fr/statistiques/fichier/4652957/ZE2020_au_01-01-2026.zip
 *     xlsx parsé sans dépendance (unzip -p + XML).
 *
 * Sort aussi data/ze-emploi-na38.json (parts A38 par ZE) pour le futur lot
 * « pression climatique sur l'économie locale ». Une seule acquisition.
 *
 * Usage :
 *   node scripts/populate-communes-emploi.js          # dry-run (diagnostics seuls)
 *   node scripts/populate-communes-emploi.js --write   # écrit les caches
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync, spawn } from 'node:child_process';

const root = process.cwd();
const SRC = path.join(root, 'data', 'source');
const INDEX = path.join(root, 'data', 'comparateur-index.json');
const ZE_ZIP = path.join(SRC, 'ZE2020_au_01-01-2026.zip');
const ZE_XLSX = path.join(SRC, 'ZE2020_au_01-01-2026.xlsx');
const FLORES_ZIP = path.join(SRC, 'DS_FLORES_A38_2024_CSV_FR.zip');
const FLORES_DATA = 'DS_FLORES_A38_2024_data.csv'; // entrée dans le zip
const OUT_COMMUNES = path.join(root, 'data', 'communes-emploi.json');
const OUT_ZE_NA38 = path.join(root, 'data', 'ze-emploi-na38.json');

const WRITE = process.argv.includes('--write');

// ----- xlsx (composition communale ZE2020) : parsing sans dépendance ----------

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function unzipEntry(zipOrXlsx, entry) {
  return execFileSync('unzip', ['-p', zipOrXlsx, entry], { maxBuffer: 1 << 30 }).toString('utf8');
}

function parseSharedStrings(xml) {
  const out = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    let text = '';
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t;
    while ((t = tRe.exec(m[1]))) text += t[1];
    out.push(decodeXml(text));
  }
  return out;
}

async function loadCommuneToZE() {
  // S'assure que le xlsx est extrait du zip.
  try {
    await fs.access(ZE_XLSX);
  } catch {
    execFileSync('unzip', ['-o', ZE_ZIP, '-d', SRC], { stdio: 'ignore' });
  }
  const shared = parseSharedStrings(unzipEntry(ZE_XLSX, 'xl/sharedStrings.xml'));
  const sheet = unzipEntry(ZE_XLSX, 'xl/worksheets/sheet3.xml'); // Composition_communale

  const rows = new Map();
  const cellRe = /<c\s+([^>]*?)>(?:<v>([^<]*)<\/v>)?/g;
  let c;
  while ((c = cellRe.exec(sheet))) {
    const attrs = c[1], raw = c[2];
    if (raw == null || raw === '') continue;
    const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
    if (!ref) continue;
    const type = (attrs.match(/t="([^"]*)"/) || [])[1];
    const col = ref.replace(/[0-9]+$/, '');
    const r = parseInt(ref.match(/[0-9]+$/)[0], 10);
    if (!rows.has(r)) rows.set(r, {});
    rows.get(r)[col] = type === 's' ? shared[parseInt(raw, 10)] : raw;
  }

  // Repère la ligne de codes (CODGEO + ZE2020)
  let headerRow = null, cCode, cZE, cZELib;
  for (const [r, cols] of [...rows].sort((a, b) => a[0] - b[0])) {
    const e = Object.entries(cols);
    const codgeo = e.find(([, v]) => v === 'CODGEO');
    const ze = e.find(([, v]) => v === 'ZE2020');
    if (codgeo && ze) {
      headerRow = r; cCode = codgeo[0]; cZE = ze[0];
      cZELib = (e.find(([, v]) => v === 'LIBZE2020') || [])[0];
      break;
    }
  }
  if (headerRow == null) throw new Error('Composition_communale : en-tête CODGEO/ZE2020 introuvable');

  const communeToZE = new Map();
  const zeNom = new Map();
  for (const [r, cols] of rows) {
    if (r <= headerRow) continue;
    const insee = cols[cCode], ze = cols[cZE];
    if (!insee || !ze) continue;
    communeToZE.set(insee, ze);
    if (cZELib && cols[cZELib]) zeNom.set(ze, cols[cZELib]);
  }
  return { communeToZE, zeNom };
}

// ----- Flores : effectifs salariés par ZE × A38 (streaming du gros CSV) --------

function loadFloresZE() {
  // Colonnes : GEO;GEO_OBJECT;ACTIVITY;NUMBER_EMPL;LEGAL_FORM_WITH_PUBLIC;FLORES_MEASURE;OBS_STATUS;TIME_PERIOD;OBS_VALUE
  return new Promise((resolve, reject) => {
    const child = spawn('unzip', ['-p', FLORES_ZIP, FLORES_DATA]);
    child.on('error', reject);
    const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });

    const zeSectors = new Map(); // ze -> { ACTIVITY -> effectifs }
    const zeTotal = new Map();   // ze -> effectifs total (_T)
    let first = true;

    rl.on('line', (line) => {
      if (first) { first = false; return; } // header
      if (!line) return;
      // split simple ; (les valeurs ne contiennent pas de ;), strip guillemets
      const f = line.split(';');
      if (f.length < 9) return;
      const unq = (s) => s.replace(/^"|"$/g, '');
      const geoObj = unq(f[1]);
      if (geoObj !== 'ZE2020') return;
      const measure = unq(f[5]);
      if (measure !== 'EMPL3112') return;            // effectifs (pas établissements)
      const size = unq(f[3]);
      if (size !== '_T') return;                     // toutes tranches confondues
      const legal = unq(f[4]);
      if (legal !== '1T9X7') return;                 // ensemble hors particuliers employeurs
      const val = f[8] === '' ? null : Number(f[8]);
      if (val == null || !Number.isFinite(val)) return; // statut K = masqué
      const ze = unq(f[0]);
      const activity = unq(f[2]);
      if (activity === '_T') {
        zeTotal.set(ze, val);
      } else {
        if (!zeSectors.has(ze)) zeSectors.set(ze, {});
        zeSectors.get(ze)[activity] = val;
      }
    });
    rl.on('close', () => resolve({ zeSectors, zeTotal }));
    rl.on('error', reject);
  });
}

// ----- calculs ----------------------------------------------------------------

// Entropie de Shannon brute des parts sectorielles A38 (nats).
function entropyH(sectors) {
  const vals = Object.values(sectors).filter((v) => v > 0);
  const total = vals.reduce((a, b) => a + b, 0);
  if (total <= 0 || vals.length <= 1) return 0;
  let h = 0;
  for (const v of vals) {
    const p = v / total;
    h -= p * Math.log(p);
  }
  return h;
}

// Diversité 0-100 : entropie étirée sur [p5, p95] de la distribution des ZE
// (calibrage B, validé). L'A38 produit une entropie très compressée ; l'étirement
// la rend discriminante sans laisser deux bassins atypiques fixer l'échelle.
function diversiteScore(h, p5, p95) {
  if (h <= 0 || p95 <= p5) return 0;
  return Math.round(Math.max(0, Math.min(1, (h - p5) / (p95 - p5))) * 100);
}

// Courbe de taille saturante (log) : calée pour qu'un bassin médian soit ~80/100
// et que les métropoles n'écrasent pas l'échelle. Bornes ajustées sur la
// distribution réelle (cf. diagnostics), assumées comme convention.
const TAILLE_FLOOR = 2000;   // ~bas de bassin : ~0
const TAILLE_SAT = 120000;   // saturation haute : ~100
function tailleScore(emplois) {
  if (!emplois || emplois <= TAILLE_FLOOR) return 0;
  const lo = Math.log(TAILLE_FLOOR), hi = Math.log(TAILLE_SAT);
  const x = (Math.log(emplois) - lo) / (hi - lo);
  return Math.round(Math.max(0, Math.min(1, x)) * 100);
}

const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

async function main() {
  console.log('Chargement de l\'index…');
  const { communes } = JSON.parse(await fs.readFile(INDEX, 'utf8'));
  console.log(`  ${communes.length} communes.`);

  console.log('Parsing composition communale ZE2020 (xlsx)…');
  const { communeToZE, zeNom } = await loadCommuneToZE();
  console.log(`  ${communeToZE.size} communes mappées, ${new Set(communeToZE.values()).size} ZE.`);

  console.log('Lecture Flores ZE2020 × A38 (streaming 228 Mo)…');
  const { zeSectors, zeTotal } = await loadFloresZE();
  console.log(`  ${zeTotal.size} ZE avec total, ${zeSectors.size} ZE avec détail sectoriel.`);

  // Calcul par ZE — passe 1 : entropie brute, puis bornes p5/p95 de calibrage
  const zeData = new Map(); // ze -> { nom, emplois, taille, h, diversite, secteurs }
  for (const [ze, total] of zeTotal) {
    const sectors = zeSectors.get(ze) || {};
    zeData.set(ze, {
      nom: zeNom.get(ze) || null,
      emplois: total,
      taille: tailleScore(total),
      h: entropyH(sectors),
      diversite: 0,
      secteurs: sectors,
    });
  }
  const hVals = [...zeData.values()].map((d) => d.h).filter((h) => h > 0);
  const hP5 = pct(hVals, 5), hP95 = pct(hVals, 95);
  // Passe 2 : diversité étirée sur [p5, p95]
  for (const d of zeData.values()) d.diversite = diversiteScore(d.h, hP5, hP95);
  console.log(`  calibrage diversité : entropie p5=${hP5.toFixed(3)} p95=${hP95.toFixed(3)} (nats).`);

  // Héritage commune → ZE
  const communesOut = {};
  let matched = 0, missingZE = 0, missingData = 0;
  for (const c of communes) {
    const ze = communeToZE.get(c.insee);
    if (!ze) { missingZE++; continue; }
    const d = zeData.get(ze);
    if (!d) { missingData++; continue; }
    communesOut[c.insee] = { ze, ze_nom: d.nom, emplois: d.emplois, taille: d.taille, diversite: d.diversite };
    matched++;
  }

  // ----- diagnostics -----
  console.log('\n=== COUVERTURE ===');
  console.log(`  communes appariées : ${matched}/${communes.length}`);
  console.log(`  sans ZE (mapping)  : ${missingZE}`);
  console.log(`  ZE sans données Flores : ${missingData}`);

  const emplois = [...zeData.values()].map((d) => d.emplois);
  const tailles = [...zeData.values()].map((d) => d.taille);
  const divs = [...zeData.values()].map((d) => d.diversite);
  console.log('\n=== DISTRIBUTION ZE (n=' + zeData.size + ') ===');
  console.log('  emplois   p10/p50/p90/max :', pct(emplois, 10), pct(emplois, 50), pct(emplois, 90), Math.max(...emplois));
  console.log('  taille    p10/p50/p90      :', pct(tailles, 10), pct(tailles, 50), pct(tailles, 90));
  console.log('  diversite p10/p50/p90      :', pct(divs, 10), pct(divs, 50), pct(divs, 90));

  console.log('\n=== CAS DE VALIDATION (ZE de la commune) ===');
  const cases = {
    'Bastia': '2B033', 'Annecy': '74010', 'Grenoble': '38185', 'Guéret': '23096',
    'Paris': '75056', 'La Rochelle': '17300', 'Clermont-Ferrand': '63113',
    'Chamonix': '74056', 'Pau': '64445', 'Arcachon': '33009',
  };
  for (const [label, insee] of Object.entries(cases)) {
    const ze = communeToZE.get(insee);
    const d = ze ? zeData.get(ze) : null;
    if (d) {
      const score = Math.round(0.6 * d.taille + 0.4 * d.diversite);
      console.log(`  ${label.padEnd(18)} ZE ${ze} ${String(d.nom).padEnd(22)} emplois=${String(d.emplois).padStart(7)} taille=${String(d.taille).padStart(3)} diversite=${String(d.diversite).padStart(3)} | viabilité(0.6/0.4)=${String(score).padStart(3)}`);
    } else {
      console.log(`  ${label.padEnd(18)} ZE ${ze || '?'} : pas de données`);
    }
  }

  if (!WRITE) {
    console.log('\n(dry-run : aucun fichier écrit. Relancer avec --write pour committer les caches.)');
    return;
  }

  // ----- écriture -----
  const meta = {
    source: 'INSEE Flores A38 fin 2024 (effectifs salariés, niveau ZE2020) + composition communale ZE2020 au 01/01/2026',
    note: 'taille = courbe saturante log [floor 2000, sat 120000] ; diversite = entropie Shannon A38 étirée sur [p5,p95] (calibrage B). Salarié uniquement (Flores). Maille ZE héritée par commune.',
    diversite_calibrage: { methode: 'entropie A38 étirée p5-p95', h_p5: Number(hP5.toFixed(4)), h_p95: Number(hP95.toFixed(4)) },
    generated_from: 'scripts/populate-communes-emploi.js',
    communes: matched,
    zones_emploi: zeData.size,
  };
  await fs.writeFile(OUT_COMMUNES, JSON.stringify({ meta, data: communesOut }), 'utf8');
  console.log(`\nÉcrit ${OUT_COMMUNES} (${matched} communes).`);

  const zeNa38 = {};
  for (const [ze, d] of zeData) zeNa38[ze] = { nom: d.nom, total: d.emplois, secteurs: d.secteurs };
  await fs.writeFile(OUT_ZE_NA38, JSON.stringify({ meta: { source: meta.source, note: 'Parts A38 par ZE pour le lot pression climatique.' }, data: zeNa38 }), 'utf8');
  console.log(`Écrit ${OUT_ZE_NA38} (${zeData.size} ZE × A38).`);
}

main().catch((err) => { console.error(err); process.exit(1); });

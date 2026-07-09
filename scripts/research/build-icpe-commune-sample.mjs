#!/usr/bin/env node
/**
 * build-icpe-commune-sample.mjs
 *
 * Genere des echantillons stratifies de communes pour le spike ICPE A1/2.
 *
 * Sources locales utilisees :
 * - scripts/research/communes-icpe-spike-100.csv : socle deja teste, toujours inclus.
 * - data/comparateur-index.json : base locale de 34k communes avec population,
 *   distance cote, exposition industrielle, region/departement.
 *
 * Si data/comparateur-index.json disparait, fournir un CSV source avec colonnes
 * insee, nom, segment ou restaurer l'index comparateur avant de lancer ce script.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, "data", "comparateur-index.json");
const SEED_PATH = path.join(ROOT, "scripts", "research", "communes-icpe-spike-100.csv");
const DEFAULT_OUT_1000 = path.join(ROOT, "scripts", "research", "communes-icpe-spike-1000.csv");
const DEFAULT_OUT_5000 = path.join(ROOT, "scripts", "research", "communes-icpe-spike-5000.csv");
const DEFAULT_OUT_10000 = path.join(ROOT, "scripts", "research", "communes-icpe-spike-10000.csv");

function usage() {
  return `Usage:
  node scripts/research/build-icpe-commune-sample.mjs --size 1000 --out scripts/research/communes-icpe-spike-1000.csv
  node scripts/research/build-icpe-commune-sample.mjs --size 5000 --out scripts/research/communes-icpe-spike-5000.csv
  node scripts/research/build-icpe-commune-sample.mjs --size 10000 --out scripts/research/communes-icpe-spike-10000.csv
  node scripts/research/build-icpe-commune-sample.mjs --all`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--all") {
      args.all = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Option inattendue: ${arg}`);
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Valeur manquante pour --${key}`);
    args[key] = value;
    i++;
  }
  return args;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      current += '"';
      i++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function readSeed() {
  const text = await fs.readFile(SEED_PATH, "utf8");
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const inseeIdx = header.indexOf("insee");
  const nomIdx = header.indexOf("nom");
  const segmentIdx = header.indexOf("segment");
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return {
      insee: cells[inseeIdx],
      nom: cells[nomIdx] ?? "",
      segment: cells[segmentIdx] ?? "deja_testee",
      source: "seed_100",
    };
  });
}

async function loadIndex() {
  try {
    const json = JSON.parse(await fs.readFile(INDEX_PATH, "utf8"));
    if (!Array.isArray(json.communes)) throw new Error("champ communes absent");
    return json.communes;
  } catch (error) {
    throw new Error(
      `Base locale absente ou illisible (${INDEX_PATH}). Alternative simple: fournir un CSV source insee,nom,segment ou restaurer data/comparateur-index.json. Detail: ${error.message}`,
    );
  }
}

function classify(commune) {
  if (commune.population >= 100000) return "grande_ville";
  if ((commune.distance_cote_km ?? Infinity) <= 8) return "littorale";
  if (
    commune.expoIndustrielle?.sourceDominante ||
    commune.heritageIndustriel ||
    (commune.population >= 30000 && (commune.expoIndustrielle?.score ?? 100) <= 55)
  ) {
    return "industrielle_portuaire";
  }
  if (!commune.hors_uu && commune.population >= 3000 && commune.population < 30000) return "periurbain";
  if (commune.population >= 15000) return "ville_moyenne";
  return "rurale_calme";
}

function addPicked(out, seen, row) {
  if (!row?.insee || seen.has(row.insee)) return false;
  seen.add(row.insee);
  out.push(row);
  return true;
}

function asRow(commune, segment, source) {
  return {
    insee: commune.insee,
    nom: commune.nom,
    segment,
    source,
    region: commune.region,
    dept: commune.dept,
  };
}

function roundRobinBuckets(out, seen, buckets, target, label, segment) {
  const keys = Object.keys(buckets).sort();
  let moved = true;
  while (out.length < target && moved) {
    moved = false;
    for (const key of keys) {
      while (buckets[key].length > 0) {
        const item = buckets[key].shift();
        if (addPicked(out, seen, asRow(item, segment ?? classify(item), `${label}_${key}`))) {
          moved = true;
          break;
        }
      }
      if (out.length >= target) break;
    }
  }
}

function byRegion(communes, sorter) {
  const buckets = {};
  for (const commune of [...communes].sort(sorter)) {
    const key = commune.region || commune.dept || "unknown";
    (buckets[key] ??= []).push(commune);
  }
  return buckets;
}

function buildSample(size, seed, index) {
  const out = [];
  const seen = new Set();
  const byInsee = new Map(index.map((commune) => [commune.insee, commune]));

  for (const row of seed) {
    const local = byInsee.get(row.insee);
    addPicked(out, seen, {
      insee: row.insee,
      nom: row.nom || local?.nom || "",
      segment: row.segment || classify(local ?? {}),
      source: row.source,
      region: local?.region ?? "",
      dept: local?.dept ?? row.insee.slice(0, 2),
    });
  }

  const sortedPop = [...index].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  const largeTarget = Math.min(size, Math.max(out.length, Math.floor(size * 0.1)));
  const industrialTarget = Math.min(size, largeTarget + Math.floor(size * 0.22));
  const coastalTarget = Math.min(size, industrialTarget + Math.floor(size * 0.12));
  const mediumTarget = Math.min(size, coastalTarget + Math.floor(size * 0.18));
  const periurbanTarget = Math.min(size, mediumTarget + Math.floor(size * 0.18));

  for (const commune of sortedPop) {
    if ((commune.population ?? 0) < 45000 && out.length >= largeTarget) break;
    addPicked(
      out,
      seen,
      asRow(commune, (commune.population ?? 0) >= 100000 ? "grande_ville" : "ville_moyenne", "population"),
    );
    if (out.length >= largeTarget) break;
  }

  const industrial = index.filter(
    (c) =>
      c.expoIndustrielle?.sourceDominante ||
      c.heritageIndustriel ||
      (c.expoIndustrielle?.score != null && c.expoIndustrielle.score <= 65),
  );
  roundRobinBuckets(
    out,
    seen,
    byRegion(industrial, (a, b) => (a.expoIndustrielle?.score ?? 101) - (b.expoIndustrielle?.score ?? 101)),
    industrialTarget,
    "industrie",
    "industrielle_portuaire",
  );

  const coastal = index.filter((c) => (c.distance_cote_km ?? Infinity) <= 12);
  roundRobinBuckets(
    out,
    seen,
    byRegion(coastal, (a, b) => (b.population ?? 0) - (a.population ?? 0)),
    coastalTarget,
    "littoral",
    "littorale",
  );

  const medium = index.filter((c) => (c.population ?? 0) >= 12000 && (c.population ?? 0) < 100000);
  roundRobinBuckets(
    out,
    seen,
    byRegion(medium, (a, b) => (b.population ?? 0) - (a.population ?? 0)),
    mediumTarget,
    "ville_moyenne",
    "ville_moyenne",
  );

  const periurban = index.filter(
    (c) => !c.hors_uu && (c.population ?? 0) >= 3000 && (c.population ?? 0) < 45000,
  );
  roundRobinBuckets(
    out,
    seen,
    byRegion(periurban, (a, b) => (b.uu_pop ?? 0) - (a.uu_pop ?? 0)),
    periurbanTarget,
    "periurbain",
    "periurbain",
  );

  const rural = index.filter((c) => (c.population ?? 0) < 12000);
  roundRobinBuckets(
    out,
    seen,
    byRegion(rural, (a, b) => (b.population ?? 0) - (a.population ?? 0)),
    size,
    "rural_geographique",
    "rurale_calme",
  );

  for (const commune of sortedPop) {
    if (out.length >= size) break;
    addPicked(out, seen, asRow(commune, classify(commune), "fallback_population"));
  }

  return out.slice(0, size);
}

async function writeSample(rows, outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const csv = [
    "insee,nom,segment,source,region,dept",
    ...rows.map((row) =>
      [row.insee, row.nom, row.segment, row.source, row.region, row.dept].map(csvEscape).join(","),
    ),
  ].join("\n");
  await fs.writeFile(outPath, `${csv}\n`, "utf8");
  console.error(`Sample: ${outPath} (${rows.length} communes)`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const seed = await readSeed();
  const index = await loadIndex();

  if (args.all || (!args.size && !args.out)) {
    await writeSample(buildSample(1000, seed, index), DEFAULT_OUT_1000);
    await writeSample(buildSample(5000, seed, index), DEFAULT_OUT_5000);
    await writeSample(buildSample(10000, seed, index), DEFAULT_OUT_10000);
    return;
  }

  const size = Number(args.size ?? 1000);
  if (!Number.isInteger(size) || size < 1) throw new Error("--size doit etre un entier positif");
  const outPath = path.resolve(
    args.out ?? (size <= 1000 ? DEFAULT_OUT_1000 : size <= 5000 ? DEFAULT_OUT_5000 : DEFAULT_OUT_10000),
  );
  await writeSample(buildSample(size, seed, index), outPath);
}

main().catch((error) => {
  console.error(`Echec: ${error.message}`);
  process.exit(1);
});

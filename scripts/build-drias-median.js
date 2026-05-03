#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_DIR = path.join(process.cwd(), "data", "source");
const COMMUNES_CSV = path.join(process.cwd(), "data", "communes-france-coords.csv");
const OUTPUT_JSON = path.join(process.cwd(), "public", "data_climat.json");
const OUTPUT_META = path.join(process.cwd(), "data", "drias_median_metadata.json");

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function squaredDistance(aLat, aLon, bLat, bLon) {
  const dLat = aLat - bLat;
  const dLon = aLon - bLon;
  return dLat * dLat + dLon * dLon;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function toFixedNumber(value, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}

async function loadCommunes() {
  const raw = await fs.readFile(COMMUNES_CSV, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1);

  const indices = {
    insee: header.indexOf("insee_code"),
    name: header.indexOf("commune_name"),
    latitude: header.indexOf("latitude"),
    longitude: header.indexOf("longitude"),
  };

  return rows.map((line) => {
    const cols = parseCsvLine(line);
    return {
      insee_code: String(cols[indices.insee]).padStart(5, "0"),
      commune_name: cols[indices.name],
      latitude: Number(cols[indices.latitude]),
      longitude: Number(cols[indices.longitude]),
    };
  });
}

async function parseDriasFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const model =
    lines.find((line) => line.startsWith("# Modele"))?.split(":").slice(1).join(":").trim() ??
    null;
  const scenarioMatch = raw.match(/#\s+GWL(\d+)/);
  const scenario = scenarioMatch ? `gwl${scenarioMatch[1]}` : null;

  const formatLine = lines.find((line) => line.startsWith("# Point;"));
  if (!model || !scenario || !formatLine) {
    throw new Error(`Unable to parse metadata for ${path.basename(filePath)}`);
  }

  const headers = formatLine.slice(2).split(";").filter(Boolean);
  const dataStartIndex = lines.findIndex((line) => !line.startsWith("#"));
  const records = new Map();

  for (let i = dataStartIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const cols = line.split(";").filter((value, index, array) => {
      return !(index === array.length - 1 && value === "");
    });

    const pointId = cols[0];
    const row = {};

    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c];
      const rawValue = cols[c];

      if (key === "Point") {
        row.Point = rawValue;
      } else if (key === "Niveau") {
        row.Niveau = rawValue;
      } else {
        row[key] = parseNumber(rawValue);
      }
    }

    records.set(pointId, row);
  }

  return {
    file: path.basename(filePath),
    model,
    scenario,
    records,
  };
}

function buildNearestPointIndex(communes, pointRows) {
  const points = pointRows.map((row) => ({
    pointId: row.Point,
    latitude: row.Latitude,
    longitude: row.Longitude,
  }));

  return communes.map((commune) => {
    let nearestPointId = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const point of points) {
      const distance = squaredDistance(
        commune.latitude,
        commune.longitude,
        point.latitude,
        point.longitude,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPointId = point.pointId;
      }
    }

    return {
      ...commune,
      nearestPointId,
    };
  });
}

async function main() {
  const [communes, sourceEntries] = await Promise.all([
    loadCommunes(),
    fs.readdir(SOURCE_DIR, { withFileTypes: true }),
  ]);

  const files = sourceEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
    .map((entry) => path.join(SOURCE_DIR, entry.name))
    .sort();

  if (files.length !== 51) {
    throw new Error(`Expected 51 source files, found ${files.length}.`);
  }

  console.log(`Parsing ${files.length} DRIAS files...`);
  const parsedFiles = [];
  for (const file of files) {
    parsedFiles.push(await parseDriasFile(file));
  }

  const scenarioBuckets = new Map();
  for (const parsed of parsedFiles) {
    const key = `${parsed.model}::${parsed.scenario}`;
    if (scenarioBuckets.has(key)) {
      throw new Error(`Duplicate model/scenario pair detected for ${key}`);
    }
    scenarioBuckets.set(key, parsed);
  }

  const models = Array.from(new Set(parsedFiles.map((item) => item.model))).sort();
  const scenarios = ["gwl15", "gwl20", "gwl30"];

  for (const model of models) {
    for (const scenario of scenarios) {
      const key = `${model}::${scenario}`;
      if (!scenarioBuckets.has(key)) {
        throw new Error(`Missing ${key} in source files.`);
      }
    }
  }

  const referenceRows = Array.from(parsedFiles[0].records.values());
  const enrichedCommunes = buildNearestPointIndex(communes, referenceRows);
  const indicatorKeys = Object.keys(referenceRows[0]).filter(
    (key) => !["Point", "Latitude", "Longitude", "Niveau"].includes(key),
  );

  console.log(
    `Loaded ${models.length} models, ${enrichedCommunes.length} communes, ${indicatorKeys.length} indicators.`,
  );

  const outputRows = [];

  for (const commune of enrichedCommunes) {
    for (const scenario of scenarios) {
      const modelRows = [];

      for (const model of models) {
        const dataset = scenarioBuckets.get(`${model}::${scenario}`);
        const row = dataset.records.get(commune.nearestPointId);
        if (!row) {
          throw new Error(
            `Missing point ${commune.nearestPointId} for ${model} / ${scenario}`,
          );
        }
        modelRows.push(row);
      }

      const outputRow = {
        insee_code: commune.insee_code,
        commune_name: commune.commune_name,
        scenario,
      };

      outputRow.column01 = toFixedNumber(commune.latitude, 4);
      outputRow.column02 = toFixedNumber(commune.longitude, 4);
      outputRow.column03 = scenario.toUpperCase();

      indicatorKeys.forEach((indicatorKey, index) => {
        const values = modelRows
          .map((row) => row[indicatorKey])
          .filter((value) => value !== null && value !== undefined);

        outputRow[`column${String(index + 4).padStart(2, "0")}`] = toFixedNumber(
          median(values),
          4,
        );
      });

      outputRows.push(outputRow);
    }
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(outputRows));

  const metadata = {
    generated_at: new Date().toISOString(),
    source_dir: path.relative(process.cwd(), SOURCE_DIR),
    commune_count: enrichedCommunes.length,
    scenario_count: scenarios.length,
    model_count: models.length,
    indicator_count: indicatorKeys.length,
    models,
    scenarios,
  };

  await fs.writeFile(OUTPUT_META, JSON.stringify(metadata, null, 2));

  console.log(`Wrote ${outputRows.length} rows to ${path.relative(process.cwd(), OUTPUT_JSON)}.`);
  console.log(`Wrote metadata to ${path.relative(process.cwd(), OUTPUT_META)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

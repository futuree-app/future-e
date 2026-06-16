import fs from "node:fs/promises";
import path from "node:path";
import { DRIAS_CITY_FALLBACK } from "@/lib/communes";

// Mapping des colonnes techniques vers nos indicateurs métier.
//
// L'ordre reflète celui du fichier de référence sélectionné par
// scripts/build-drias-median.js : le fichier source ayant le plus d'indicateurs
// (typiquement 30 sur le standard DRIAS-TRACC). Les indicateurs partiellement
// couverts (NORIFM40_yr et AIFM40_yr, fournis par 10 modèles sur 17) sont
// agrégés sur les modèles qui les fournissent — voir
// data/drias_median_metadata.json pour la couverture exacte.
//
// Les valeurs sont les médianes des modèles climatiques DRIAS-TRACC pour chaque
// commune × scénario (gwl15 = +1.5°C / 2030, gwl20 = +2°C / 2050,
// gwl30 = +3°C / 2100).
const COLUMN_MAP: Record<string, string> = {
  NORTMm_yr:        "column04", // Annual mean temperature (°C)
  NORTMm_seas_JJA:  "column05", // Summer mean temperature (°C)
  NORTMm_seas_DJF:  "column06", // Winter mean temperature (°C)
  NORTXm_seas_JJA:  "column07", // Summer mean max temperature (°C)
  NORTX35D_yr:      "column08", // Days with Tmax > 35°C per year
  NORTX30D_yr:      "column09", // Days with Tmax > 30°C per year
  NORTR_yr:         "column10", // Tropical nights (Tmin > 20°C) per year
  NORRR_yr:         "column11", // Annual precipitation (mm)
  NORRR_seas_JJA:   "column12", // Summer precipitation (mm)
  NORRR_seas_DJF:   "column13", // Winter precipitation (mm)
  NORRRq99_yr:      "column14", // Heavy precipitation percentile (p99) (mm)
  NORRx1d_yr:       "column15", // Maximum 1-day precipitation (mm)
  NORRRq99refD_yr:  "column16", // Heavy precip days frequency (days/yr)
  NORIFM40_yr:      "column17", // Fire weather index days > 40 (days/yr) — 10 models
  NORSWI04_yr:      "column18", // Soil dryness days (SWI < 0.4) (days/yr)
  // Anomalies (delta projeté vs période de référence DRIAS) — face avant
  // « mouvement » du module Territoire. indicator_order[i] -> column{i+4}.
  ATMm_seas_JJA:    "column20", // Summer mean temperature anomaly (°C)
  ATMm_seas_DJF:    "column21", // Winter mean temperature anomaly (°C)
  ATX35D_yr:        "column23", // Anomaly of days with Tmax > 35°C (days/yr)
  ATX30D_yr:        "column24", // Anomaly of days with Tmax > 30°C (days/yr)
  ATR_yr:           "column25", // Anomaly of tropical nights (days/yr)
  // column19/22/26+ = autres anomalies — non utilisées en UI à ce stade.
};

type RawRow = Record<string, string | number | null>;
type ScenarioId = "gwl15" | "gwl20" | "gwl30";

// Cache pour stocker les données en mémoire après le premier chargement
let indexCache: Map<string, Map<ScenarioId, RawRow>> | null = null;

/**
 * Charge et indexe le fichier JSON par insee_code et par scenario.
 * Utilise padStart(5, '0') pour garantir la cohérence des clés INSEE.
 */
async function getIndex(): Promise<Map<string, Map<ScenarioId, RawRow>>> {
  if (indexCache) return indexCache;

  const filePath = path.join(process.cwd(), "public", "data_climat.json");
  const raw = await fs.readFile(filePath, "utf8");
  const rows: RawRow[] = JSON.parse(raw);

  indexCache = new Map();
  for (const row of rows) {
    // Nettoyage et formatage uniforme sur 5 caractères (ex: 1355 -> 01355)
    const rawInsee = String(row.insee_code);
    const insee = rawInsee.padStart(5, '0');
    
    const scenario = String(row.scenario) as ScenarioId;
    
    if (!indexCache.has(insee)) {
      indexCache.set(insee, new Map());
    }
    indexCache.get(insee)!.set(scenario, row);
  }

  return indexCache;
}

function rowToIndicators(row: RawRow): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, col] of Object.entries(COLUMN_MAP)) {
    const raw = row[col];
    if (raw !== null && raw !== undefined) {
      const n = Number(raw);
      if (!Number.isNaN(n)) out[code] = n;
    }
  }
  return out;
}

/**
 * Récupère les données climatiques pour une commune donnée.
 * @param inseeCode Le code INSEE (ex: "13055")
 */
export async function getClimatDataCommune(inseeCode: string) {
  const index = await getIndex();
  
  // Formatage de la recherche pour correspondre à l'index
  const safeInsee = inseeCode.padStart(5, '0');

  // Pour Paris, Lyon, Marseille : DRIAS indexe par arrondissement, pas par ville entière
  const lookupInsee = DRIAS_CITY_FALLBACK[safeInsee] ?? safeInsee;
  const scenarioMap = index.get(lookupInsee);

  if (!scenarioMap || scenarioMap.size === 0) {
    console.warn(`[DRIAS API] Commune introuvable pour le code INSEE : ${inseeCode} (recherché comme ${lookupInsee})`);
    return null;
  }

  const firstRow = scenarioMap.values().next().value!;
  const scenarios: Record<string, { h: string; v: Record<string, number> }> = {};

  for (const [id, row] of scenarioMap) {
    scenarios[id] = { h: "2050", v: rowToIndicators(row) };
  }

  // Si on a utilisé un arrondissement comme proxy, on restitue le nom de la ville entière
  const CITY_NAMES: Record<string, string> = {
    '75056': 'Paris',
    '69123': 'Lyon',
    '13055': 'Marseille',
  };

  return {
    inseeCode: safeInsee,
    commune: {
      n: CITY_NAMES[safeInsee] ?? String(firstRow.commune_name),
      s: scenarios,
    },
  };
}

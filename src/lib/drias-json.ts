import fs from "node:fs/promises";
import path from "node:path";

// Mapping des colonnes techniques vers nos indicateurs métier
const COLUMN_MAP: Record<string, string> = {
  NORTMm_yr:       "column04", // Annual mean temperature (°C)
  NORTMm_seas_JJA: "column05", // Summer mean temperature (°C)
  NORTMm_seas_DJF: "column06", // Winter mean temperature (°C)
  NORTXm_seas_JJA: "column07", // Summer mean max temperature (°C)
  NORTX35D_yr:     "column08", // Days with Tmax > 35°C per year
  NORTX30D_yr:     "column09", // Days with Tmax > 30°C per year
  NORTR_yr:        "column10", // Tropical nights (Tmin > 20°C) per year
  NORRR_yr:        "column11", // Annual precipitation (mm)
  NORRR_seas_JJA:  "column12", // Summer precipitation (mm)
  NORRR_seas_DJF:  "column13", // Winter precipitation (mm)
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
  const scenarioMap = index.get(safeInsee);

  if (!scenarioMap || scenarioMap.size === 0) {
    console.warn(`[DRIAS API] Commune introuvable pour le code INSEE : ${inseeCode} (recherché comme ${safeInsee})`);
    return null;
  }

  const firstRow = scenarioMap.values().next().value!;
  const scenarios: Record<string, { h: string; v: Record<string, number> }> = {};

  for (const [id, row] of scenarioMap) {
    scenarios[id] = { h: "2050", v: rowToIndicators(row) };
  }

  return {
    inseeCode: safeInsee,
    commune: {
      n: String(firstRow.commune_name),
      s: scenarios,
    },
  };
}
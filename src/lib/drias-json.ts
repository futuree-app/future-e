import fs from "node:fs/promises";
import path from "node:path";
import { DRIAS_CITY_FALLBACK } from "@/lib/communes";

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
  NORRRq99_yr:     "column15", // Heavy precipitation percentile (p99)
  NORRx1d_yr:      "column16", // Maximum 1-day precipitation
  NORIFM40_yr:     "column17", // Fire weather index days > 40
  NORSWI04_yr:     "column18", // Soil dryness days (SWI < 0.4)
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

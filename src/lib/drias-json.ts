import fs from "node:fs/promises";
import path from "node:path";
import { DRIAS_CITY_FALLBACK } from "@/lib/communes";
import type { ClimatProjete } from "@/lib/logement-synthesis-cache";

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
  ATX30D_yr:        "column24", // Anomaly of days with Tmax > 30°C (days/yr)
  ATR_yr:           "column25", // Anomaly of tropical nights (days/yr)
  // column19/22/23/26+ = autres anomalies — non utilisées en UI à ce stade.
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

// ─── Signal climat curé pour la synthèse Logement (croisement × Territoire) ──
// Pré-digère la trajectoire climatique en une intensité qualitative par axe, PAS de chiffre : le
// prompt Logement ne doit jamais réciter une valeur DRIAS (cf. Editorial 2026-07-07). L'axe
// CHALEUR se dérive du SURCROÎT projeté vs période de référence (anomalies ATR_yr = nuits
// tropicales en plus, ATX30D_yr = jours >30 °C en plus), à l'horizon gwl20 (2050 / +2,7 °C France,
// TRACC). Le surcroît EST la sémantique « hausse » qu'on veut, sans besoin d'une base « présent »
// (que le JSON ne fournit pas). Seuils v1, heuristique documentée sur la distribution nationale
// (35 006 communes, gwl20) : médiane ≈ +9 nuits / +12 jours, p90 ≈ +21 / +21.
//   marquee = surcroît ≥ 20 (~10 % des communes les plus touchées) ; notable = 8 à 20 ; sous 8 = null.
// chaleur = la plus forte des deux sous-tendances. L'axe SÉCHERESSE DES SOLS reste null en v1
// (SWI absolu, distribution sans cassure de 67 à 160 j, aucune anomalie : pas de seuil défendable).
function classeChaleur(anomalie: number | undefined | null): 0 | 1 | 2 {
  if (anomalie == null || Number.isNaN(anomalie)) return 0;
  if (anomalie >= 20) return 2;
  if (anomalie >= 8) return 1;
  return 0;
}

export async function deriveClimatProjete(inseeCode: string): Promise<ClimatProjete | null> {
  if (!inseeCode) return null;
  const data = await getClimatDataCommune(inseeCode);
  const v = data?.commune.s?.gwl20?.v;
  if (!v) return null;
  const classe = Math.max(classeChaleur(v.ATR_yr), classeChaleur(v.ATX30D_yr)) as 0 | 1 | 2;
  // MARQUEE-ONLY en v1 : le niveau `notable` (classe 1) est volontairement rendu SILENCIEUX
  // (mappé à null), donc jamais émis vers le modèle. Décision porteur : à fréquence `notable`
  // (~la moitié des communes), le croisement climat produit une charnière répétée d'un rapport à
  // l'autre (« à mesure que les étés se réchauffent » observé 8/8 sur générations réelles) = une
  // formule. On garde le climat RARE et DISTINCTIF (marquee ≈ 10-12 % des communes, les plus
  // chaudes). Le type conserve "notable" (matière prête) ; on le rouvrira avec un vrai mécanisme
  // anti-formule (rotation, phrases par famille de fait, ou synthèse en 2 passes).
  const chaleur = classe === 2 ? "marquee" : null;
  if (chaleur === null) return null;
  return { horizon: "2050", chaleur, secheresse_sols: null };
}

import "server-only";

// ── Configuration ─────────────────────────────────────────────────────────────
// Dataset ADEME Data Fair : Réseau de Mesures de la Qualité des Sols (RMQS)
// Jeu de données GisSol / INRAE / ADEME — teneurs en éléments traces métalliques
// Note : remplacer l'identifiant si le dataset change sur data.ademe.fr
const ADEME_DATASET_ID = process.env.GISSOL_ADEME_DATASET_ID ?? "";
const ADEME_BASE = "https://data.ademe.fr/data-fair/api/v1/datasets";

// Valeur seuil qualité des sols en cadmium (mg/kg) — source ANSES / GisSol RMQS
const CADMIUM_THRESHOLD_HIGH = 0.5;  // > 0.5 mg/kg : zone de vigilance
const CADMIUM_THRESHOLD_VERY_HIGH = 1.2; // > 1.2 mg/kg : dépassement valeur guide

// ── Types ─────────────────────────────────────────────────────────────────────

export type GissolResult = {
  inseeCode: string;
  cadmium: {
    value: number | null;       // Teneur médiane en mg/kg
    score: number;              // Score 0-100 (risque croissant)
    label: string;
    source: "api" | "departement";
  };
};

// ── Fallback départemental ────────────────────────────────────────────────────
// Basé sur GisSol RMQS — Saby et al. 2011, Arrouays et al. 2011
// Médianes départementales des teneurs en Cd (mg/kg de sol)
// Source : https://www.gissol.fr / données RMQS publiées par INRAE

const DEPT_CADMIUM: Record<string, number> = {
  // Hauts-de-France — sols limoneux enrichis, agriculture intensive aux phosphates
  "59": 0.48, "62": 0.52, "02": 0.34, "60": 0.30, "80": 0.40,
  // Grand Est — Alsace et Lorraine industrielles, agriculture intensive
  "57": 0.38, "67": 0.36, "68": 0.32, "08": 0.30, "51": 0.28, "54": 0.30,
  "55": 0.25, "88": 0.22,
  // Normandie — agriculture intensive, bovins lait
  "76": 0.32, "27": 0.30, "14": 0.28, "50": 0.25, "61": 0.26,
  // Bretagne — agriculture intensive, épandages lisier phosphaté
  "22": 0.30, "29": 0.28, "35": 0.32, "56": 0.26,
  // Pays de la Loire
  "44": 0.28, "49": 0.24, "53": 0.22, "72": 0.22, "85": 0.24,
  // Centre-Val-de-Loire
  "18": 0.20, "28": 0.24, "36": 0.18, "37": 0.20, "41": 0.22, "45": 0.26,
  // Île-de-France — sols urbains, remblais, pollutions historiques
  "75": 0.40, "77": 0.26, "78": 0.24, "91": 0.24, "92": 0.40,
  "93": 0.44, "94": 0.38, "95": 0.26,
  // Bourgogne-Franche-Comté
  "21": 0.22, "25": 0.20, "39": 0.18, "58": 0.18, "70": 0.20, "71": 0.22, "89": 0.20, "90": 0.22,
  // Auvergne-Rhône-Alpes — Massif Central volcanique : Cd naturel variable
  "01": 0.20, "03": 0.22, "07": 0.20, "15": 0.24, "26": 0.20, "38": 0.18,
  "42": 0.22, "43": 0.28, "63": 0.30, "69": 0.26, "73": 0.14, "74": 0.14,
  // PACA
  "04": 0.14, "05": 0.12, "06": 0.18, "13": 0.20, "83": 0.16, "84": 0.18,
  // Languedoc-Roussillon — viticulture ancienne, pesticides arsenicaux et Cd élevé
  "11": 0.40, "30": 0.36, "34": 0.44, "48": 0.30, "66": 0.34,
  // Occitanie intérieure
  "09": 0.16, "12": 0.20, "31": 0.24, "32": 0.22, "46": 0.20, "47": 0.22,
  "65": 0.18, "81": 0.26, "82": 0.24,
  // Nouvelle-Aquitaine — Landes (sables pauvres = faible Cd), Poitou, Limousin
  "16": 0.22, "17": 0.22, "19": 0.20, "23": 0.18, "24": 0.20, "33": 0.20,
  "40": 0.12, "64": 0.18, "79": 0.22, "86": 0.22, "87": 0.20,
  // Corse
  "2A": 0.12, "2B": 0.12,
};

function deptFromInsee(inseeCode: string): string {
  const code = inseeCode.padStart(5, "0");
  // Paris, Métropole de Lyon, Marseille arrondissements : ramener au département
  if (code.startsWith("75")) return "75";
  if (code.startsWith("13") && code.length === 5 && parseInt(code) > 13100) return "13";
  if (code.startsWith("69") && code.length === 5 && parseInt(code) > 69100) return "69";
  if (code.startsWith("97")) return code.slice(0, 3); // DOM
  // Corse
  if (code.startsWith("2A") || code.startsWith("2B")) return code.slice(0, 2);
  return code.slice(0, 2);
}

function cadmiumToScore(value: number): number {
  // Score 0-100 croissant avec la teneur
  // Seuil : 0.2 mg/kg = 30/100, 0.5 mg/kg = 65/100, 1.0 mg/kg ≈ 90/100
  if (value <= 0.1) return 10;
  if (value <= 0.2) return Math.round(10 + ((value - 0.1) / 0.1) * 20);
  if (value <= CADMIUM_THRESHOLD_HIGH) return Math.round(30 + ((value - 0.2) / 0.3) * 35);
  if (value <= CADMIUM_THRESHOLD_VERY_HIGH) return Math.round(65 + ((value - CADMIUM_THRESHOLD_HIGH) / 0.7) * 25);
  return Math.min(100, Math.round(90 + ((value - CADMIUM_THRESHOLD_VERY_HIGH) / 0.5) * 10));
}

function cadmiumToLabel(value: number): string {
  if (value < 0.2) return "Teneur faible — dans la norme nationale";
  if (value < CADMIUM_THRESHOLD_HIGH) return "Teneur modérée — dans les valeurs usuelles";
  if (value < CADMIUM_THRESHOLD_VERY_HIGH) return "Teneur élevée — zone de vigilance";
  return "Teneur très élevée — dépassement valeur guide";
}

// ── ADEME Data Fair fetch ─────────────────────────────────────────────────────

async function fetchFromAdeme(
  lat: number,
  lon: number,
  radiusDeg: number,
): Promise<number | null> {
  if (!ADEME_DATASET_ID) return null;

  const bbox = `${lon - radiusDeg},${lat - radiusDeg},${lon + radiusDeg},${lat + radiusDeg}`;
  const url = new URL(`${ADEME_BASE}/${ADEME_DATASET_ID}/lines`);
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("size", "10");
  url.searchParams.set("select", "cd_med,cd_q50,cadmium,Cd");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      next: { revalidate: 86400 * 30 }, // données sols stables — cache 30 jours
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      results?: Array<Record<string, number | null>>;
    };

    const records = json.results ?? [];
    if (!records.length) return null;

    // Chercher la colonne cadmium — noms possibles selon le dataset
    const CADMIUM_COLS = ["cd_med", "cd_q50", "cadmium", "Cd", "CD"];
    for (const record of records) {
      for (const col of CADMIUM_COLS) {
        const val = record[col];
        if (typeof val === "number" && val > 0 && val < 20) return val;
      }
    }
    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const gissolCache = new Map<string, Promise<GissolResult>>();

async function load(
  inseeCode: string,
  lat?: number,
  lon?: number,
): Promise<GissolResult> {
  // 1. Essayer l'API ADEME Data Fair si des coordonnées sont disponibles
  let apiValue: number | null = null;
  if (lat != null && lon != null && ADEME_DATASET_ID) {
    apiValue = await fetchFromAdeme(lat, lon, 0.05).catch(() => null);
  }

  if (apiValue != null) {
    return {
      inseeCode,
      cadmium: {
        value: apiValue,
        score: cadmiumToScore(apiValue),
        label: cadmiumToLabel(apiValue),
        source: "api",
      },
    };
  }

  // 2. Fallback : table départementale RMQS
  const dept = deptFromInsee(inseeCode);
  const deptValue = DEPT_CADMIUM[dept] ?? 0.18; // médiane nationale RMQS si département inconnu

  return {
    inseeCode,
    cadmium: {
      value: deptValue,
      score: cadmiumToScore(deptValue),
      label: cadmiumToLabel(deptValue),
      source: "departement",
    },
  };
}

export async function getGissolForCommune(
  inseeCode: string,
  lat?: number,
  lon?: number,
): Promise<GissolResult> {
  const key = inseeCode.trim();

  if (!gissolCache.has(key)) {
    gissolCache.set(key, load(key, lat, lon).catch(() => ({
      inseeCode: key,
      cadmium: { value: null, score: 20, label: "Données non disponibles pour cette commune", source: "departement" as const },
    })));
  }

  return gissolCache.get(key)!;
}

import fs from "node:fs/promises";
import path from "node:path";
import { DRIAS_CITY_FALLBACK } from "@/lib/communes";
import type { ClimatProjete } from "@/lib/logement-synthesis-cache";
import { construireEchelle, rangDe, type Rang } from "@/lib/rang-national";

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
  //
  // ELLES SERVENT AUSSI À RECONSTRUIRE LA RÉFÉRENCE (projeté moins anomalie) : DRIAS n'expose aucune
  // colonne « fin du XXe siècle », et le dossier de décision en a besoin pour dire une TRAJECTOIRE plutôt
  // qu'une valeur nue. Toute anomalie manquante ici rend la référence de son axe non reconstructible, et
  // le constat perd sa comparaison, en silence : c'est pourquoi les trois anomalies du dossier (chaleur,
  // feu, pluie) sont désormais mappées.
  ATMm_seas_JJA:    "column20", // Summer mean temperature anomaly (°C)
  ATMm_seas_DJF:    "column21", // Winter mean temperature anomaly (°C)
  ATX35D_yr:        "column23", // Anomaly of days with Tmax > 35°C (days/yr)
  ATX30D_yr:        "column24", // Anomaly of days with Tmax > 30°C (days/yr)
  ATR_yr:           "column25", // Anomaly of tropical nights (days/yr)
  AIFM40_yr:        "column27", // Anomaly of fire weather index days > 40 (days/yr)
  ARRx1d_yr:        "column33", // Anomaly of maximum 1-day precipitation (mm)
  // column19/22/26/28+ = autres anomalies — non utilisées à ce stade.
};

type RawRow = Record<string, string | number | null>;
type ScenarioId = "gwl15" | "gwl20" | "gwl30";

// Cache pour stocker les données en mémoire après le premier chargement
let indexCache: Map<string, Map<ScenarioId, RawRow>> | null = null;

// ON MÉMOÏSE LA PROMESSE, PAS SEULEMENT SA VALEUR. Le cache de valeur ne se remplit qu'APRÈS la
// lecture et le parse des 60 Mo de `data_climat.json` : deux appels concurrents arrivés avant cet
// instant trouvaient tous deux `indexCache` à null et relisaient le fichier chacun de leur côté.
// La faute était latente tant qu'une page n'appelait qu'une fois `getIndex()` ; l'arrivée du rang
// national (quatre indicateurs demandés en parallèle) l'a rendue coûteuse, et le nombre de pages
// dépassant le timeout de 60 s au build est passé de 16 à 80. Mesuré, pas supposé.
let indexPromise: Promise<Map<string, Map<ScenarioId, RawRow>>> | null = null;

/**
 * Charge et indexe le fichier JSON par insee_code et par scenario.
 * Utilise padStart(5, '0') pour garantir la cohérence des clés INSEE.
 */
async function getIndex(): Promise<Map<string, Map<ScenarioId, RawRow>>> {
  if (indexCache) return indexCache;
  if (indexPromise) return indexPromise;

  indexPromise = chargerIndex();
  try {
    indexCache = await indexPromise;
    return indexCache;
  } finally {
    // Libère la promesse : en cas d'échec, le prochain appel doit pouvoir retenter.
    indexPromise = null;
  }
}

async function chargerIndex(): Promise<Map<string, Map<ScenarioId, RawRow>>> {
  const filePath = path.join(process.cwd(), "public", "data_climat.json");
  const raw = await fs.readFile(filePath, "utf8");
  const rows: RawRow[] = JSON.parse(raw);

  // La carte se construit EN LOCAL puis est retournée : `indexCache` n'est affecté qu'une fois
  // l'index complet. Écrire dans le cache au fil de la boucle exposerait un index à moitié rempli
  // à tout appelant concurrent, et une commune absente y serait indiscernable d'une commune pas
  // encore chargée.
  const index = new Map<string, Map<ScenarioId, RawRow>>();
  for (const row of rows) {
    // Nettoyage et formatage uniforme sur 5 caractères (ex: 1355 -> 01355)
    const insee = String(row.insee_code).padStart(5, '0');
    const scenario = String(row.scenario) as ScenarioId;

    let parScenario = index.get(insee);
    if (!parScenario) {
      parScenario = new Map();
      index.set(insee, parScenario);
    }
    parScenario.set(scenario, row);
  }

  return index;
}

// ─── Rang national d'une commune, par indicateur et par scénario ──────────────
//
// L'index DRIAS est déjà chargé en entier et gardé en mémoire (`indexCache`) : toute page de
// commune le paie déjà. Construire l'échelle nationale d'un indicateur ne coûte donc qu'un tri de
// ~35 000 nombres, mémoïsé lui aussi. Aucun fichier supplémentaire, aucune étape de build.
//
// L'ÉCHELLE EST INDEXÉE PAR (SCÉNARIO, INDICATEUR), et jamais par indicateur seul. Comparer une
// valeur de 2050 à l'échelle de 2100 produirait un rang vrai sous une convention fausse : la
// commune serait dite « peu exposée » simplement parce qu'on la mesure contre un futur plus
// lointain. C'est la même faute que celle qui a motivé `horizons.ts`, à un autre endroit.
//
// Même mémoïsation par PROMESSE que pour l'index, et pour la même raison : les quatre indicateurs
// d'une page sont demandés en parallèle, et un cache de valeur les laisserait tous construire leur
// échelle avant que le premier ait fini d'écrire la sienne.
const echelleCache = new Map<string, Promise<Float64Array>>();

function getEchelle(scenario: ScenarioId, indicateur: string): Promise<Float64Array> {
  const cle = `${scenario}|${indicateur}`;
  const dejaLa = echelleCache.get(cle);
  if (dejaLa) return dejaLa;

  const promesse = construireEchelleNationale(scenario, indicateur);
  echelleCache.set(cle, promesse);
  promesse.catch(() => echelleCache.delete(cle));
  return promesse;
}

async function construireEchelleNationale(
  scenario: ScenarioId,
  indicateur: string,
): Promise<Float64Array> {
  const col = COLUMN_MAP[indicateur];
  const index = await getIndex();
  const valeurs: number[] = [];

  if (col) {
    for (const scenarioMap of index.values()) {
      const row = scenarioMap.get(scenario);
      if (!row) continue;
      const brut = row[col];
      if (brut === null || brut === undefined) continue;
      const n = Number(brut);
      if (!Number.isNaN(n)) valeurs.push(n);
    }
  }

  return construireEchelle(valeurs);
}

/**
 * Où se situe une commune, pour un indicateur donné, parmi toutes les communes que DRIAS couvre.
 *
 * Retourne `null` quand la commune est absente de l'index, quand l'indicateur ne lui est pas
 * fourni, ou quand l'indicateur est inconnu. Une absence de rang se dit, elle ne se remplace pas
 * par une position moyenne : le périmètre DRIAS exclut les DROM, et une commune d'outre-mer doit
 * lire « non comparée » plutôt qu'un rang qui n'existe pas.
 */
export async function getRangNational(
  inseeCode: string,
  scenario: ScenarioId,
  indicateur: string,
): Promise<Rang | null> {
  const index = await getIndex();
  const safeInsee = String(inseeCode).padStart(5, "0");
  const lookupInsee = DRIAS_CITY_FALLBACK[safeInsee] ?? safeInsee;

  const row = index.get(lookupInsee)?.get(scenario);
  if (!row) return null;

  const col = COLUMN_MAP[indicateur];
  if (!col) return null;

  const brut = row[col];
  if (brut === null || brut === undefined) return null;
  const valeur = Number(brut);
  if (Number.isNaN(valeur)) return null;

  return rangDe(await getEchelle(scenario, indicateur), valeur);
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

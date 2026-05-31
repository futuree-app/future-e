import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie — moteur de compatibilité déterministe (V1).
//
// Principe : le scoring ne choisit JAMAIS via l'IA. Il filtre (contraintes
// dures), puis pondère (préférences), sur l'index national pré-calculé
// (data/comparateur-index.json). L'IA n'intervient qu'en amont (parse du projet)
// et en aval (synthèse d'interprétation), jamais ici.
//
// Objectif produit : des communes qu'un conseiller humain trouverait pertinentes,
// pas l'optimum d'indicateurs. D'où des courbes comportementales (isolement,
// calme, douceur) plutôt que des percentiles bruts, et une baseline de viabilité.
//
// NOTE DÉPLOIEMENT : l'index est lu via fs depuis data/. En prod (bundling
// serverless), ajouter data/comparateur-index.json à outputFileTracingIncludes
// dans next.config.ts pour qu'il soit embarqué.
// ════════════════════════════════════════════════════════════════════════════

export const PREFERENCE_KEYS = [
  "faible_chaleur",            // = rechercher la fraîcheur
  "douceur_climat",            // hivers tempérés + étés non extrêmes
  "ensoleillement_recherche",  // été chaud + peu de pluie (proxy soleil)
  "faible_secheresse",
  "faible_risque_feu",
  "faible_precip_extremes",
  "proximite_mer",
  "cadre_calme",
  "eviter_isolement",
  // Santé environnementale + vivabilité (V1.5/V1.6)
  "air_sain",                 // air de fond plus pur (PM2.5 ≫ NO2)
  "acces_soins",              // accès aux médecins généralistes (APL)
  "acces_services",           // services/commerces accessibles
  "faible_pression_agricole", // éloigné des cultures à traitements fréquents (pression, pas exposition)
] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

export type Preference = { key: PreferenceKey; weight: number };

export type HardConstraints = {
  region?: string | null;
  departements?: string[];
  nearSea?: { active: boolean; maxKm?: number | null };
  excludeSea?: boolean;
  nearPlace?: { label: string; maxKm?: number | null } | null;
  communeSize?: { min?: number | null; max?: number | null } | null;
};

export type ParsedProject = {
  reformulation: string;
  hardConstraints: HardConstraints;
  preferences: Preference[];
  ambiguities?: { topic: string; question: string }[];
};

export type MatchResult = {
  insee: string;
  nom: string;
  dept: string;
  region: string | null;
  compatibility: number; // 0–100
  reasons: string[];
  tradeoff: string | null; // le compromis principal, ou null
  metrics: {
    distance_cote_km: number;
    population: number | null;
    jours_chauds_30: number | null;
    temp_hiver: number | null;
    precip_annuelle: number | null;
    ifm: number | null;
  };
};

export type MatchOutcome = {
  perfectMatch: boolean;
  bestCompatibility: number;
  candidates: number;
  message: string | null;
  results: MatchResult[];
};

// Tailles de ville (V1) — utilisées par le parse pour traduire "petite / moyenne
// / grande ville" en contrainte communeSize.
export const VILLE_SIZE = {
  petite: { min: 5000, max: 25000 },
  moyenne: { min: 25000, max: 100000 },
  grande: { min: 100000, max: null as number | null },
};

const POP_FLOOR = 1500; // plancher de réalisme : on retire les hameaux
const PERFECT_THRESHOLD = 80;
const VIABILITY_BASELINE_W = 1; // eviter_isolement implicite si absent

// ── Courbes comportementales (interpolation linéaire entre ancres) ───────────
type Anchors = [number, number][];
function lerp(anchors: Anchors, x: number | null | undefined): number | null {
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
const ISOLEMENT: Anchors = [[0, 0], [1000, 5], [2000, 15], [5000, 45], [10000, 65], [20000, 80], [50000, 92], [100000, 97], [300000, 100]];
const CALME: Anchors = [[0, 55], [30, 65], [80, 85], [150, 95], [400, 100], [800, 95], [1500, 80], [3000, 55], [6000, 30], [12000, 12], [30000, 3]];
const WINTER_MILD: Anchors = [[-3, 5], [1, 30], [4, 60], [7, 88], [9, 100], [12, 95], [16, 80]];

// ── Index ────────────────────────────────────────────────────────────────────
type IndexCommune = {
  insee: string;
  nom: string;
  dept: string;
  region: string | null;
  lat: number;
  lon: number;
  population: number | null;
  densite: number | null;
  distance_cote_km: number;
  clim: Record<string, number | null>;
  pct: Record<string, number | null>;
  viv?: Record<string, number | null>;
  vivpct?: Record<string, number | null>;
  agri?: Record<string, number | null>;
  pression_agricole?: number | null;
};
type IndexFile = { meta: unknown; communes: IndexCommune[] };

let indexCache: IndexCommune[] | null = null;
let nameCache: Map<string, IndexCommune> | null = null;

async function loadIndex(): Promise<IndexCommune[]> {
  if (indexCache) return indexCache;
  const filePath = path.join(process.cwd(), "data", "comparateur-index.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as IndexFile;
  indexCache = parsed.communes;
  return indexCache;
}

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function nameIndex(): Promise<Map<string, IndexCommune>> {
  if (nameCache) return nameCache;
  const communes = await loadIndex();
  const m = new Map<string, IndexCommune>();
  for (const c of communes) {
    const key = normalizeName(c.nom);
    const prev = m.get(key);
    // en cas d'homonymes, garder la plus peuplée (la plus probable)
    if (!prev || (c.population ?? 0) > (prev.population ?? 0)) m.set(key, c);
  }
  nameCache = m;
  return nameCache;
}

// ── Géo ───────────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Rollup Paris / Lyon / Marseille : l'index contient les arrondissements (DRIAS
// indexe par arrondissement). On regroupe sous la ville mère pour ne montrer
// qu'une entrée par grande ville.
function cityKey(insee: string): string {
  if (/^751\d\d$/.test(insee)) return "PARIS";
  if (/^6938\d$/.test(insee)) return "LYON";
  if (/^132\d\d$/.test(insee)) return "MARSEILLE";
  return insee;
}
const CITY_LABEL: Record<string, string> = { PARIS: "Paris", LYON: "Lyon", MARSEILLE: "Marseille" };

// ── Scoring ────────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function avgPct(c: IndexCommune, fields: string[]): number | null {
  const vals = fields.map((f) => c.pct[f]).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function subScore(key: PreferenceKey, c: IndexCommune): number | null {
  switch (key) {
    case "faible_chaleur": {
      const p = avgPct(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr", "NORTMm_seas_JJA"]);
      return p == null ? null : 100 - p;
    }
    case "faible_secheresse": {
      const p = c.pct.NORSWI04_yr; return p == null ? null : 100 - p;
    }
    case "faible_risque_feu": {
      const p = c.pct.NORIFM40_yr; return p == null ? null : 100 - p;
    }
    case "faible_precip_extremes": {
      const p = avgPct(c, ["NORRRq99_yr", "NORRx1d_yr"]); return p == null ? null : 100 - p;
    }
    case "proximite_mer":
      return clamp(100 - c.distance_cote_km / 1.5, 0, 100);
    case "cadre_calme":
      return lerp(CALME, c.densite);
    case "eviter_isolement":
      return lerp(ISOLEMENT, c.population);
    case "douceur_climat": {
      const w = lerp(WINTER_MILD, c.clim.NORTMm_seas_DJF);
      if (w == null) return null;
      const s = c.pct.NORTX35D_yr == null ? 50 : 100 - c.pct.NORTX35D_yr;
      return Math.round(0.6 * w + 0.4 * s);
    }
    case "ensoleillement_recherche": {
      const summer = c.pct.NORTMm_seas_JJA;
      if (summer == null) return null;
      const dry = c.pct.NORRR_yr == null ? 50 : 100 - c.pct.NORRR_yr;
      return Math.round(0.45 * summer + 0.55 * dry);
    }
    case "air_sain": {
      const pm = c.vivpct?.pm25;
      if (pm == null) return null;
      const no2 = c.vivpct?.no2 == null ? pm : c.vivpct.no2; // PM2.5 ≫ NO2 (NO2 = trafic très local)
      return Math.round(0.7 * (100 - pm) + 0.3 * (100 - no2));
    }
    case "acces_soins":
      return c.vivpct?.apl == null ? null : c.vivpct.apl; // APL haut = bon accès
    case "acces_services":
      return c.vivpct?.eloignement == null ? null : 100 - c.vivpct.eloignement; // éloignement bas = mieux
    case "faible_pression_agricole":
      return c.pression_agricole == null ? null : 100 - c.pression_agricole;
    default:
      return null;
  }
}

const REASON_POS: Record<PreferenceKey, string | ((c: IndexCommune) => string)> = {
  faible_chaleur: "étés plus frais",
  douceur_climat: "climat doux, hivers tempérés",
  ensoleillement_recherche: "plus chaud et plus sec, ensoleillé",
  faible_secheresse: "sols peu exposés à la sécheresse",
  faible_risque_feu: "faible risque de feu",
  faible_precip_extremes: "pluies extrêmes rares",
  proximite_mer: (c) => `à ${c.distance_cote_km} km de la côte`,
  cadre_calme: "cadre calme et habitable",
  eviter_isolement: (c) => `vie locale réelle (${(c.population ?? 0).toLocaleString("fr-FR")} hab.)`,
  air_sain: "air de fond plus pur",
  acces_soins: "bon accès aux médecins",
  acces_services: "services et commerces à proximité",
  faible_pression_agricole: "loin des cultures à traitements fréquents",
};
const REASON_NEG: Record<PreferenceKey, string> = {
  faible_chaleur: "chaleur en hausse",
  douceur_climat: "hivers rudes ou étés marqués",
  ensoleillement_recherche: "climat plus frais et humide",
  faible_secheresse: "sols exposés à la sécheresse",
  faible_risque_feu: "risque de feu notable",
  faible_precip_extremes: "pluies intenses fréquentes",
  proximite_mer: "éloignée du littoral",
  cadre_calme: "plus dense que recherché",
  eviter_isolement: "commune de petite taille",
  air_sain: "air plus chargé en particules",
  acces_soins: "zone sous-dotée en médecins",
  acces_services: "services parfois éloignés",
  faible_pression_agricole: "environnement agricole à traitements fréquents à proximité",
};
function reasonText(key: PreferenceKey, c: IndexCommune): string {
  const r = REASON_POS[key];
  return typeof r === "function" ? r(c) : r;
}

function passesHard(c: IndexCommune, hc: HardConstraints, placePoint: { lat: number; lon: number; maxKm: number } | null): boolean {
  if (c.population != null && c.population < POP_FLOOR) return false;
  if (hc.region && c.region !== hc.region) return false;
  if (hc.departements?.length && !hc.departements.includes(c.dept)) return false;
  if (hc.nearSea?.active && c.distance_cote_km > (hc.nearSea.maxKm ?? 30)) return false;
  if (hc.excludeSea && c.distance_cote_km < 15) return false;
  if (hc.communeSize) {
    if (hc.communeSize.min != null && (c.population ?? 0) < hc.communeSize.min) return false;
    if (hc.communeSize.max != null && (c.population ?? Infinity) > hc.communeSize.max) return false;
  }
  if (placePoint) {
    if (haversineKm(c.lat, c.lon, placePoint.lat, placePoint.lon) > placePoint.maxKm) return false;
  }
  return true;
}

export async function matchProjects(parsed: ParsedProject): Promise<MatchOutcome> {
  const communes = await loadIndex();

  // Résolution nearPlace (label → coords d'une commune de l'index)
  let placePoint: { lat: number; lon: number; maxKm: number } | null = null;
  if (parsed.hardConstraints?.nearPlace?.label) {
    const names = await nameIndex();
    const hit = names.get(normalizeName(parsed.hardConstraints.nearPlace.label));
    if (hit) placePoint = { lat: hit.lat, lon: hit.lon, maxKm: parsed.hardConstraints.nearPlace.maxKm ?? 50 };
  }

  // Baseline de viabilité : eviter_isolement implicite si absent
  const prefs: (Preference & { baseline?: boolean })[] = parsed.preferences
    .filter((p) => PREFERENCE_KEYS.includes(p.key))
    .map((p) => ({ key: p.key, weight: clamp(Math.round(p.weight) || 1, 1, 3) }));
  if (!prefs.some((p) => p.key === "eviter_isolement")) {
    prefs.push({ key: "eviter_isolement", weight: VIABILITY_BASELINE_W, baseline: true });
  }
  const totalW = prefs.reduce((s, p) => s + p.weight, 0) || 1;

  const candidates = communes.filter((c) => passesHard(c, parsed.hardConstraints ?? {}, placePoint));

  type Sub = { key: PreferenceKey; weight: number; baseline?: boolean; s: number };
  const scored = candidates.map((c) => {
    const subs: Sub[] = [];
    for (const p of prefs) {
      const s = subScore(p.key, c);
      if (s != null) subs.push({ key: p.key, weight: p.weight, baseline: p.baseline, s });
    }
    const compatibility = Math.round(subs.reduce((s, x) => s + x.weight * x.s, 0) / totalW);
    const visible = subs.filter((x) => !x.baseline);
    const reasons = [...visible]
      .sort((a, b) => b.weight * b.s - a.weight * a.s)
      .slice(0, 3)
      .filter((x) => x.s >= 55)
      .map((x) => reasonText(x.key, c));
    const worst = [...visible].sort((a, b) => a.weight * a.s - b.weight * b.s)[0];
    const tradeoff = worst && worst.s < 50 ? REASON_NEG[worst.key] : null;
    return {
      cityKey: cityKey(c.insee),
      result: {
        insee: c.insee,
        nom: CITY_LABEL[cityKey(c.insee)] ?? c.nom,
        dept: c.dept,
        region: c.region,
        compatibility,
        reasons,
        tradeoff,
        metrics: {
          distance_cote_km: c.distance_cote_km,
          population: c.population,
          jours_chauds_30: c.clim.NORTX30D_yr ?? null,
          temp_hiver: c.clim.NORTMm_seas_DJF ?? null,
          precip_annuelle: c.clim.NORRR_yr ?? null,
          ifm: c.clim.NORIFM40_yr ?? null,
        },
      } as MatchResult,
    };
  });

  scored.sort((a, b) => b.result.compatibility - a.result.compatibility);

  // Rollup big-3 : une seule entrée par ville mère (la meilleure, déjà en tête)
  const seenCity = new Set<string>();
  const deduped: MatchResult[] = [];
  for (const s of scored) {
    if (seenCity.has(s.cityKey)) continue;
    seenCity.add(s.cityKey);
    deduped.push(s.result);
    if (deduped.length >= 5) break;
  }

  const best = deduped[0]?.compatibility ?? 0;
  const perfect = candidates.length > 0 && best >= PERFECT_THRESHOLD;
  const message =
    candidates.length === 0
      ? "Aucun territoire ne respecte l'ensemble de vos contraintes. Essayez d'élargir un critère."
      : perfect
        ? null
        : "Aucun territoire ne réunit l'ensemble de vos critères. Voici ceux qui impliquent le moins de compromis.";

  return { perfectMatch: perfect, bestCompatibility: best, candidates: candidates.length, message, results: deduped };
}

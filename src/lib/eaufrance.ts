import "server-only";

const HUBEAU_BASE = "https://hubeau.eaufrance.fr/api";
const REQUEST_TIMEOUT_MS = 8000;

// ── Types ────────────────────────────────────────────────────────────────────

type EauPotableRecord = {
  date_prelevement?: string | null;
  conformite_limites_bact_prelevement?: string | null;
  conformite_limites_pc_prelevement?: string | null;
  code_parametre?: string | null;
  libelle_parametre?: string | null;
  resultat_numerique?: number | null;
  libelle_unite?: string | null;
};

type EcoulementRecord = {
  date_observation?: string | null;
  libelle_observation?: string | null;
  libelle_cours_eau?: string | null;
};

type HubeauPage<T> = {
  count?: number | null;
  data?: T[] | null;
};

export type EaufranceSummary = {
  inseeCode: string;
  drinkingWater: {
    conformBacterio: boolean | null;
    conformPhysicoChem: boolean | null;
    lastSampleDate: string | null;
    nitrates: number | null;
    nitrites: number | null;
  } | null;
  drought: {
    lastObservationDate: string | null;
    riverName: string | null;
    status: string | null;
    isDry: boolean;
  } | null;
};

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchHubeau<T>(pathname: string, params: URLSearchParams): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${HUBEAU_BASE}${pathname}?${params}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Hub'Eau ${pathname} failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Loaders ──────────────────────────────────────────────────────────────────

async function loadDrinkingWater(inseeCode: string) {
  const sixMonthsAgo = new Date(Date.now() - 183 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    code_commune: inseeCode,
    date_min_prelevement: sixMonthsAgo,
    fields: [
      "date_prelevement",
      "conformite_limites_bact_prelevement",
      "conformite_limites_pc_prelevement",
      "code_parametre",
      "libelle_parametre",
      "resultat_numerique",
      "libelle_unite",
    ].join(","),
    sort: "desc",
    size: "20",
  });

  const json = await fetchHubeau<HubeauPage<EauPotableRecord>>(
    "/v1/qualite_eau_potable/resultats_dis",
    params,
  );

  const records = json.data ?? [];
  if (!records.length) return null;

  const latest = records[0];
  const nitrateRecord = records.find((r) => r.code_parametre === "1340");
  const nitriteRecord = records.find((r) => r.code_parametre === "1350");

  return {
    conformBacterio:
      latest.conformite_limites_bact_prelevement != null
        ? latest.conformite_limites_bact_prelevement === "Conforme"
        : null,
    conformPhysicoChem:
      latest.conformite_limites_pc_prelevement != null
        ? latest.conformite_limites_pc_prelevement === "Conforme"
        : null,
    lastSampleDate: latest.date_prelevement ?? null,
    nitrates: nitrateRecord?.resultat_numerique ?? null,
    nitrites: nitriteRecord?.resultat_numerique ?? null,
  };
}

async function loadDrought(inseeCode: string) {
  const oneYearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    code_commune: inseeCode,
    date_observation_min: oneYearAgo,
    fields: ["date_observation", "libelle_observation", "libelle_cours_eau"].join(","),
    sort: "desc",
    size: "5",
  });

  const json = await fetchHubeau<HubeauPage<EcoulementRecord>>(
    "/v1/ecoulement/observations",
    params,
  );

  const records = json.data ?? [];
  if (!records.length) return null;

  const latest = records[0];
  const obs = latest.libelle_observation?.toLowerCase() ?? "";
  const isDry = obs.includes("assec") || obs.includes("sec") || obs.includes("écoul");

  return {
    lastObservationDate: latest.date_observation ?? null,
    riverName: latest.libelle_cours_eau ?? null,
    status: latest.libelle_observation ?? null,
    isDry,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const eaufranceCache = new Map<string, Promise<EaufranceSummary>>();

async function load(inseeCode: string): Promise<EaufranceSummary> {
  const [drinkingWater, drought] = await Promise.all([
    loadDrinkingWater(inseeCode).catch(() => null),
    loadDrought(inseeCode).catch(() => null),
  ]);

  return { inseeCode, drinkingWater, drought };
}

export async function getEaufranceSummary(inseeCode: string): Promise<EaufranceSummary> {
  const key = inseeCode.trim();

  if (!eaufranceCache.has(key)) {
    eaufranceCache.set(key, load(key));
  }

  try {
    return await eaufranceCache.get(key)!;
  } catch (error) {
    eaufranceCache.delete(key);
    throw error;
  }
}

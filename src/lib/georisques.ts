import "server-only";

type GasparRiskDetail = {
  libelle_risque_long?: string | null;
};

type GasparRiskItem = {
  code_insee?: string | null;
  libelle_commune?: string | null;
  risques_detail?: GasparRiskDetail[] | null;
};

type GasparResponse = {
  data?: GasparRiskItem[] | null;
};

type SeismicItem = {
  code_insee?: string | null;
  libelle_commune?: string | null;
  code_zone?: string | null;
  zone_sismicite?: string | null;
};

type SeismicResponse = {
  data?: SeismicItem[] | null;
};

export type GeorisquesSummary = {
  inseeCode: string;
  communeName: string | null;
  riskLabels: string[];
  flags: {
    flood: boolean;
    marineSubmersion: boolean;
    landslide: boolean;
    clay: boolean;
    storm: boolean;
    seismic: boolean;
  };
  seismic: {
    code: string | null;
    label: string | null;
  } | null;
};

const GEORISQUES_BASE_URL = "https://georisques.gouv.fr/api/v1";
const REQUEST_TIMEOUT_MS = 8000;
const summaryCache = new Map<string, Promise<GeorisquesSummary>>();

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function fetchJson<T>(pathname: string, searchParams: URLSearchParams) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEORISQUES_BASE_URL}${pathname}?${searchParams.toString()}`,
      {
        headers: {
          accept: "application/json",
        },
        next: {
          revalidate: 86400,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Géorisques request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadGeorisquesSummary(inseeCode: string): Promise<GeorisquesSummary> {
  const [gasparJson, seismicJson] = await Promise.all([
    fetchJson<GasparResponse>(
      "/gaspar/risques",
      new URLSearchParams({ code_insee: inseeCode }),
    ),
    fetchJson<SeismicResponse>(
      "/zonage_sismique",
      new URLSearchParams({ code_insee: inseeCode }),
    ),
  ]);

  const gasparItem = gasparJson?.data?.[0] ?? null;
  const seismicItem = seismicJson?.data?.[0] ?? null;
  const riskLabels = Array.from(
    new Set(
      (gasparItem?.risques_detail ?? [])
        .map((risk) => risk?.libelle_risque_long?.trim())
        .filter((label): label is string => Boolean(label)),
    ),
  );

  const normalizedLabels = riskLabels.map(normalizeLabel);
  const flags = {
    flood: normalizedLabels.some((label) => label.includes("inondation")),
    marineSubmersion: normalizedLabels.some((label) =>
      label.includes("submersion marine"),
    ),
    landslide: normalizedLabels.some((label) =>
      label.includes("mouvement de terrain"),
    ),
    clay: normalizedLabels.some(
      (label) =>
        label.includes("tassements differentiels") ||
        label.includes("argile"),
    ),
    storm: normalizedLabels.some((label) => label.includes("tempete")),
    seismic:
      Boolean(seismicItem?.code_zone) ||
      normalizedLabels.some((label) => label.includes("seisme")),
  };

  return {
    inseeCode,
    communeName: gasparItem?.libelle_commune || seismicItem?.libelle_commune || null,
    riskLabels,
    flags,
    seismic: seismicItem
      ? {
          code: seismicItem.code_zone || null,
          label: seismicItem.zone_sismicite || null,
        }
      : null,
  };
}

export async function getGeorisquesSummary(inseeCode: string) {
  const cacheKey = inseeCode.trim();

  if (!summaryCache.has(cacheKey)) {
    summaryCache.set(cacheKey, loadGeorisquesSummary(cacheKey));
  }

  try {
    return await summaryCache.get(cacheKey)!;
  } catch (error) {
    summaryCache.delete(cacheKey);
    throw error;
  }
}

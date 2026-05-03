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

type GeorisquesV2Page<T> = {
  totalElements?: number | null;
  totalPages?: number | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  content?: T[] | null;
};

type GeorisquesV2RgaItem = {
  codeExposition?: string | null;
  exposition?: string | null;
};

type GeorisquesV2SeismicItem = {
  typeZone?: string | null;
  zoneSismicite?: string | null;
};

type GeorisquesV2RiskItem = {
  libelleRisque?: string | null;
  libelleRisqueLong?: string | null;
};

type GeorisquesV2PprnItem = {
  libelleProcedure?: string | null;
  libelleAlea?: string | null;
  libelleSousAlea?: string | null;
  zonageReglementaire?: {
    zoneRegExists?: boolean | null;
    listTypeReg?: Array<{
      code?: string | null;
      libelle?: string | null;
      nom?: string | null;
      codeZone?: string | null;
    }> | null;
  } | null;
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

export type GeorisquesAddressSummary = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  risks: {
    labels: string[];
    total: number;
  };
  pprn: {
    total: number;
    labels: string[];
  };
  rga: {
    code: string | null;
    label: string | null;
  } | null;
  seismic: {
    code: string | null;
    label: string | null;
  } | null;
  granularity: "point";
};

export type GeorisquesParcelSummary = {
  parcelCode: string;
  risks: {
    labels: string[];
    total: number;
  };
  pprn: {
    total: number;
    labels: string[];
    zones: string[];
  };
  rga: {
    code: string | null;
    label: string | null;
  } | null;
  seismic: {
    code: string | null;
    label: string | null;
  } | null;
  granularity: "parcel";
};

const GEORISQUES_BASE_URL = "https://georisques.gouv.fr/api/v1";
const GEORISQUES_V2_BASE_URL = "https://www.georisques.gouv.fr";
const REQUEST_TIMEOUT_MS = 8000;
const summaryCache = new Map<string, Promise<GeorisquesSummary>>();
const addressSummaryCache = new Map<string, Promise<GeorisquesAddressSummary>>();
const parcelSummaryCache = new Map<string, Promise<GeorisquesParcelSummary>>();

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

async function fetchJsonV2<T>(pathname: string, searchParams: URLSearchParams) {
  const token = process.env.GEORISQUES_API_TOKEN;

  if (!token) {
    throw new Error("GEORISQUES_API_TOKEN is missing on the server.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEORISQUES_V2_BASE_URL}${pathname}?${searchParams.toString()}`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Géorisques v2 request failed with status ${response.status}`);
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

async function loadGeorisquesAddressSummary(
  latitude: number,
  longitude: number,
): Promise<GeorisquesAddressSummary> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    pageSize: "10",
    pageNumber: "0",
  });

  const [risksJson, pprnJson, rgaJson, seismicJson] = await Promise.all([
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2RiskItem>>(
      "/api/v2/gaspar/risques",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2PprnItem>>(
      "/api/v2/gaspar/pprn",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2RgaItem>>(
      "/api/v2/rga",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2SeismicItem>>(
      "/api/v2/zonage_sismique",
      params,
    ),
  ]);

  const riskLabels = Array.from(
    new Set(
      (risksJson.content ?? [])
        .map((item) => item.libelleRisqueLong || item.libelleRisque || null)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const pprnLabels = Array.from(
    new Set(
      (pprnJson.content ?? [])
        .map((item) => {
          const parts = [
            item.libelleProcedure,
            item.libelleAlea,
            item.libelleSousAlea,
          ].filter(Boolean);

          return parts.length > 0 ? parts.join(" · ") : null;
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const rga = (rgaJson.content ?? [])[0] ?? null;
  const seismic = (seismicJson.content ?? [])[0] ?? null;

  return {
    coordinates: { latitude, longitude },
    risks: {
      labels: riskLabels,
      total: Number(risksJson.totalElements ?? riskLabels.length),
    },
    pprn: {
      labels: pprnLabels,
      total: Number(pprnJson.totalElements ?? pprnLabels.length),
    },
    rga: rga
      ? {
          code: rga.codeExposition || null,
          label: rga.exposition || null,
        }
      : null,
    seismic: seismic
      ? {
          code: seismic.typeZone || null,
          label: seismic.zoneSismicite || null,
        }
      : null,
    granularity: "point",
  };
}

async function loadGeorisquesParcelSummary(
  parcelCode: string,
): Promise<GeorisquesParcelSummary> {
  const params = new URLSearchParams({
    codesParcelle: parcelCode,
    pageSize: "10",
    pageNumber: "0",
  });

  const [risksJson, pprnJson, rgaJson, seismicJson] = await Promise.all([
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2RiskItem>>(
      "/api/v2/gaspar/risques",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2PprnItem>>(
      "/api/v2/gaspar/pprn",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2RgaItem>>(
      "/api/v2/rga",
      params,
    ),
    fetchJsonV2<GeorisquesV2Page<GeorisquesV2SeismicItem>>(
      "/api/v2/zonage_sismique",
      params,
    ),
  ]);

  const riskLabels = Array.from(
    new Set(
      (risksJson.content ?? [])
        .flatMap((item) =>
          item.libelleRisqueLong || item.libelleRisque
            ? [item.libelleRisqueLong || item.libelleRisque]
            : [],
        )
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const pprnLabels = Array.from(
    new Set(
      (pprnJson.content ?? [])
        .map((item) => {
          const parts = [item.libelleProcedure, item.libelleAlea, item.libelleSousAlea]
            .filter(Boolean);
          return parts.length > 0 ? parts.join(" · ") : null;
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const pprnZones = Array.from(
    new Set(
      (pprnJson.content ?? [])
        .flatMap((item) => item.zonageReglementaire?.listTypeReg ?? [])
        .map((zone) => zone.nom || zone.libelle || zone.codeZone || null)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const rga = (rgaJson.content ?? [])[0] ?? null;
  const seismic = (seismicJson.content ?? [])[0] ?? null;

  return {
    parcelCode,
    risks: {
      labels: riskLabels,
      total: Number(risksJson.totalElements ?? riskLabels.length),
    },
    pprn: {
      labels: pprnLabels,
      total: Number(pprnJson.totalElements ?? pprnLabels.length),
      zones: pprnZones,
    },
    rga: rga
      ? {
          code: rga.codeExposition || null,
          label: rga.exposition || null,
        }
      : null,
    seismic: seismic
      ? {
          code: seismic.typeZone || null,
          label: seismic.zoneSismicite || null,
        }
      : null,
    granularity: "parcel",
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

export async function getGeorisquesAddressSummary(
  latitude: number,
  longitude: number,
) {
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

  if (!addressSummaryCache.has(cacheKey)) {
    addressSummaryCache.set(
      cacheKey,
      loadGeorisquesAddressSummary(latitude, longitude),
    );
  }

  try {
    return await addressSummaryCache.get(cacheKey)!;
  } catch (error) {
    addressSummaryCache.delete(cacheKey);
    throw error;
  }
}

export async function getGeorisquesParcelSummary(parcelCode: string) {
  const cacheKey = parcelCode.trim();

  if (!parcelSummaryCache.has(cacheKey)) {
    parcelSummaryCache.set(cacheKey, loadGeorisquesParcelSummary(cacheKey));
  }

  try {
    return await parcelSummaryCache.get(cacheKey)!;
  } catch (error) {
    parcelSummaryCache.delete(cacheKey);
    throw error;
  }
}

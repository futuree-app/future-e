import "server-only";
import { agregerLignesCatnat, riskFlagsFromLabels, type GasparCatnatSummary } from "./georisques-flags.ts";
import { buildRegulatoryPlans, type RegulatoryPlan } from "./pprn-zonage.ts";
import { communeParent } from "./plm.ts";

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
  idGaspar?: string | null;
  libPpr?: string | null;
  modeleProcedure?: string | null;
  dateModification?: string | null;
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
    wildfire: boolean;
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
  regulatoryPlans: RegulatoryPlan[];
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
  regulatoryPlans: RegulatoryPlan[];
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
    // Même grain que les arrêtés (FUT-60) : GASPAR ne connaît que la commune (75056 recense
    // l'inondation, 75111 ne répond rien). Le zonage sismique, lui, est À L'ARRONDISSEMENT (75056
    // ne répond rien) : il garde son code, et ce sens inverse reste hors de ce lot.
    fetchJson<GasparResponse>(
      "/gaspar/risques",
      new URLSearchParams({ code_insee: communeParent(inseeCode) }),
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

  const flags = riskFlagsFromLabels(riskLabels, Boolean(seismicItem?.code_zone));

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

  const [risksV1, pprnJson, rgaJson, seismicJson] = await Promise.all([
    // Risques recensés au POINT via l'API v1 : la v2 /gaspar/risques renvoie des PROCÉDURES
    // (champ `libelle`, risques imbriqués dans communes[].aleas[]), pas les libellés de risque,
    // d'où un risks.labels vide. La v1 donne data[0].risques_detail[].libelle_risque_long, propre.
    fetchJson<GasparResponse>("/gaspar/risques", new URLSearchParams({ latlon: `${longitude},${latitude}` })),
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
      (risksV1?.data?.[0]?.risques_detail ?? [])
        .map((risk) => risk?.libelle_risque_long?.trim())
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
      total: riskLabels.length,
    },
    pprn: {
      labels: pprnLabels,
      total: Number(pprnJson.totalElements ?? pprnLabels.length),
    },
    regulatoryPlans: buildRegulatoryPlans(pprnJson.content),
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
    regulatoryPlans: buildRegulatoryPlans(pprnJson.content),
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

// ─── GASPAR — historique des arrêtés CatNat (P1) ───────────────────────────
// Angle Quartier : "histoire vécue du territoire" — combien de fois la commune
// a été reconnue en état de catastrophe naturelle, depuis quand, et pour quels
// aléas. Source GASPAR v1 (/gaspar/catnat, sans token), distincte de la
// typologie de risques (/gaspar/risques) déjà utilisée pour les flags.

type GasparCatnatItem = {
  date_debut_evt?: string | null;
  libelle_risque_jo?: string | null;
};

type GasparCatnatResponse = {
  data?: GasparCatnatItem[] | null;
  results?: number | null;
};

// FUT-60 : les types et l'agrégation des lignes GASPAR vivent dans georisques-flags (pur, testable).
export type { CatnatBandFamily, GasparCatnatSummary } from "./georisques-flags.ts";

async function loadGasparCatnatSummary(inseeCode: string): Promise<GasparCatnatSummary> {
  const json = await fetchJson<GasparCatnatResponse>(
    "/gaspar/catnat",
    // GASPAR EST AU GRAIN COMMUNE (FUT-60) : interrogé avec un arrondissement de Paris, Lyon ou
    // Marseille, il répond zéro ligne, et une page d'arrondissement affirmait « aucun arrêté » d'une
    // commune qui en compte des dizaines. Les arrêtés de l'arrondissement SONT ceux de sa commune.
    new URLSearchParams({ code_insee: communeParent(inseeCode), page: "1", page_size: "500" }),
  );

  return agregerLignesCatnat(json?.data ?? [], json?.results);
}

const catnatSummaryCache = new Map<string, Promise<GasparCatnatSummary>>();

export async function getGasparCatnatSummary(inseeCode: string) {
  const cacheKey = inseeCode.trim();

  if (!catnatSummaryCache.has(cacheKey)) {
    catnatSummaryCache.set(cacheKey, loadGasparCatnatSummary(cacheKey));
  }

  try {
    return await catnatSummaryCache.get(cacheKey)!;
  } catch (error) {
    catnatSummaryCache.delete(cacheKey);
    throw error;
  }
}

// --- Inventaires géolocalisés au point (Face 2 : risques du bâti au grain point) ---------------
// v1 /cavites et /mvt renvoient { data: [...] } avec longitude/latitude par item. On les remonte
// bruts ; la structuration (rayon, distance, types) vit dans la lib pure `point-hazards.ts`.
// Erreur réseau -> `null` (source indisponible), JAMAIS `[]` (qui signifierait « rien dans le rayon »).
type GeorisquesV1List<T> = { data?: T[] | null };

async function fetchV1List<T>(pathname: string, latitude: number, longitude: number): Promise<T[] | null> {
  try {
    const json = await fetchJson<GeorisquesV1List<T>>(
      pathname,
      new URLSearchParams({ latlon: `${longitude},${latitude}`, rayon: "500", page_size: "100" }),
    );
    return json.data ?? [];
  } catch {
    return null;
  }
}

export async function fetchCavitesNearPoint(latitude: number, longitude: number): Promise<import("./point-hazards.ts").CaviteRaw[] | null> {
  return fetchV1List<import("./point-hazards.ts").CaviteRaw>("/cavites", latitude, longitude);
}

export async function fetchMvtNearPoint(latitude: number, longitude: number): Promise<import("./point-hazards.ts").MvtRaw[] | null> {
  return fetchV1List<import("./point-hazards.ts").MvtRaw>("/mvt", latitude, longitude);
}

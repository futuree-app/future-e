import "server-only";

export type CadastreParcel = {
  idu: string;
  parcelCode: string;
  codeInsee: string;
  section: string;
  numero: string;
  prefixe: string;
  contenance: number | null;
  nomCommune: string | null;
};

type CadastreFeature = {
  properties?: {
    idu?: string;
    code_insee?: string;
    section?: string;
    numero?: string;
    com_abs?: string;
    contenance?: number;
    nom_com?: string;
  };
};

type CadastreResponse = {
  features?: CadastreFeature[];
};

const API_CARTO_CADASTRE_URL = "https://apicarto.ign.fr/api/cadastre/parcelle";
const REQUEST_TIMEOUT_MS = 8000;

function toCadastreParcel(feature: CadastreFeature | undefined): CadastreParcel | null {
  const props = feature?.properties;

  if (!props?.code_insee || !props.section || !props.numero) {
    return null;
  }

  const prefixe = props.com_abs || "000";

  return {
    idu: props.idu || `${props.code_insee}${prefixe}${props.section}${props.numero}`,
    parcelCode: `${props.code_insee}-${prefixe}-${props.section}-${props.numero}`,
    codeInsee: props.code_insee,
    section: props.section,
    numero: props.numero,
    prefixe,
    contenance:
      typeof props.contenance === "number" ? props.contenance : null,
    nomCommune: props.nom_com || null,
  };
}

async function fetchCadastreFeatures(
  geom: Record<string, unknown>,
  limit: number,
): Promise<CadastreFeature[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(API_CARTO_CADASTRE_URL);
    url.searchParams.set("geom", JSON.stringify(geom));
    url.searchParams.set("_limit", String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Cadastre request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as CadastreResponse;
    return payload.features ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

function buildSquareAroundPoint(
  longitude: number,
  latitude: number,
  radiusMeters: number,
) {
  const latDelta = radiusMeters / 111_320;
  const lonDelta =
    radiusMeters / (111_320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.2));

  return {
    type: "Polygon",
    coordinates: [[
      [longitude - lonDelta, latitude - latDelta],
      [longitude + lonDelta, latitude - latDelta],
      [longitude + lonDelta, latitude + latDelta],
      [longitude - lonDelta, latitude + latDelta],
      [longitude - lonDelta, latitude - latDelta],
    ]],
  };
}

function chooseBestParcel(features: CadastreFeature[]): CadastreParcel | null {
  const parcels = features
    .map((feature) => toCadastreParcel(feature))
    .filter((parcel): parcel is CadastreParcel => Boolean(parcel));

  if (parcels.length === 0) {
    return null;
  }

  parcels.sort((a, b) => {
    const areaA = a.contenance ?? Number.POSITIVE_INFINITY;
    const areaB = b.contenance ?? Number.POSITIVE_INFINITY;
    return areaA - areaB;
  });

  return parcels[0];
}

export async function findCadastreParcelByPoint(
  longitude: number,
  latitude: number,
): Promise<CadastreParcel | null> {
  const pointFeatures = await fetchCadastreFeatures(
    {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    1,
  );

  const directParcel = toCadastreParcel(pointFeatures[0]);
  if (directParcel) {
    return directParcel;
  }

  for (const radiusMeters of [3, 8, 15]) {
    const polygonFeatures = await fetchCadastreFeatures(
      buildSquareAroundPoint(longitude, latitude, radiusMeters),
      8,
    );
    const fallbackParcel = chooseBestParcel(polygonFeatures);

    if (fallbackParcel) {
      return fallbackParcel;
    }
  }

  return null;
}

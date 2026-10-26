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
  /**
   * FUT-127 : COMMENT CETTE PARCELLE A ÉTÉ RATTACHÉE AU POINT. `point` : le point géocodé tombe
   * dedans. `repli` : il ne tombait dans aucune (voirie, cour), et c'est la plus petite parcelle d'un
   * carré de quelques mètres autour, qui peut être celle d'un voisin. Absent sur un rapport antérieur.
   */
  rattachement?: "point" | "repli";
};

type CadastreFeature = {
  geometry?: { type: string; coordinates: unknown } | null;
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

function chooseBestParcel(features: CadastreFeature[]): CadastreFeature | null {
  const parcels = features
    .map((feature) => ({ feature, parcel: toCadastreParcel(feature) }))
    .filter((x): x is { feature: CadastreFeature; parcel: CadastreParcel } => Boolean(x.parcel));

  if (parcels.length === 0) {
    return null;
  }

  parcels.sort((a, b) => {
    const areaA = a.parcel.contenance ?? Number.POSITIVE_INFINITY;
    const areaB = b.parcel.contenance ?? Number.POSITIVE_INFINITY;
    return areaA - areaB;
  });

  return parcels[0].feature;
}

/**
 * FUT-81 : la parcelle ET SA GÉOMÉTRIE. La géométrie sert à lire le plan d'urbanisme à la parcelle ;
 * elle ne voyage pas dans le rapport (seul `parcel` y entre), elle s'y relirait sans rien apporter.
 */
export type CadastreParcelLue = {
  parcel: CadastreParcel;
  geometry: { type: string; coordinates: unknown } | null;
};

export async function findCadastreParcelWithGeometry(
  longitude: number,
  latitude: number,
): Promise<CadastreParcelLue | null> {
  const pointFeatures = await fetchCadastreFeatures(
    {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    1,
  );

  const directParcel = toCadastreParcel(pointFeatures[0]);
  if (directParcel) {
    return { parcel: { ...directParcel, rattachement: "point" }, geometry: pointFeatures[0]?.geometry ?? null };
  }

  for (const radiusMeters of [3, 8, 15]) {
    const polygonFeatures = await fetchCadastreFeatures(
      buildSquareAroundPoint(longitude, latitude, radiusMeters),
      8,
    );
    const fallback = chooseBestParcel(polygonFeatures);
    const fallbackParcel = toCadastreParcel(fallback ?? undefined);

    if (fallback && fallbackParcel) {
      return { parcel: { ...fallbackParcel, rattachement: "repli" }, geometry: fallback.geometry ?? null };
    }
  }

  return null;
}

export async function findCadastreParcelByPoint(
  longitude: number,
  latitude: number,
): Promise<CadastreParcel | null> {
  return (await findCadastreParcelWithGeometry(longitude, latitude))?.parcel ?? null;
}

// Sonde de QUALIFICATION : la lecture parcellaire sera-t-elle disponible pour ce point ? L'absence
// de parcelle ne refuse RIEN (le rapport garde Géorisques au point, les cavités, le GPU,
// Cartofriches, l'IRIS) : elle est seulement annoncée avant le paiement.
//
// UN SEUL APPEL, AU POINT. `findCadastreParcelByPoint` retombe sur des carrés de 3, 8 puis 15 m
// quand le point ne tombe dans aucune parcelle : quatre requêtes, acceptables pour un dossier
// payé, trop pour une route publique à haut volume.
//
// Divergence assumée, et elle va dans le bon sens : la qualification peut annoncer « lecture
// parcellaire indisponible » là où le dossier la trouvera par repli. On promet moins que ce qu'on
// livre, jamais l'inverse.
export async function probeCadastreAtPoint(
  longitude: number,
  latitude: number,
): Promise<{ status: "found" | "none" | "unavailable" }> {
  try {
    const features = await fetchCadastreFeatures(
      { type: "Point", coordinates: [longitude, latitude] },
      1,
    );
    return { status: toCadastreParcel(features[0]) ? "found" : "none" };
  } catch {
    // Une panne réseau ne se traduit JAMAIS en « aucune parcelle ».
    return { status: "unavailable" };
  }
}

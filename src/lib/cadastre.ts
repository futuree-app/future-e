import "server-only";
import { distanceRegion, projectionAutour, regionDe } from "./geometrie-parcelle.ts";

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
   * dedans. `repli` : il ne tombait dans aucune (voirie, cour), et c'est la parcelle la plus proche d'un
   * carré de quelques mètres autour, qui peut être celle d'un voisin. Absent sur un rapport antérieur.
   */
  rattachement?: "point" | "repli";
  /**
   * FUT-81 (revue du 27/10/2026). `candidatsAuPoint` : posé seulement quand le point tombe sur la LIMITE
   * de plusieurs parcelles ; celle-ci n'est que la première rendue. `distanceRepliM` : la distance
   * mesurée du point à la parcelle retenue par repli (absente si la géométrie ne se lit pas).
   */
  candidatsAuPoint?: number;
  distanceRepliM?: number;
};

export type CadastreFeature = {
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

/**
 * LA PARCELLE LA PLUS PROCHE DU POINT, MESURÉE. Jusqu'au 27/10/2026, le repli retenait la plus petite
 * contenance du carré, sans mesurer la distance, et le rapport disait « la plus proche ». Une petite
 * parcelle voisine l'emportait sur la grande parcelle collée au point (revue indépendante). À distance
 * égale, ou faute de géométrie lisible, la plus petite contenance départage, comme avant.
 */
export function choisirParcelleProche(
  features: CadastreFeature[],
  longitude: number,
  latitude: number,
): { feature: CadastreFeature; parcel: CadastreParcel; distanceM: number | null } | null {
  const proj = projectionAutour(longitude, latitude);
  const parcels = features
    .map((feature) => {
      const parcel = toCadastreParcel(feature);
      const region = regionDe(feature.geometry, proj);
      return parcel ? { feature, parcel, distanceM: region ? distanceRegion([0, 0], region) : null } : null;
    })
    .filter((x): x is { feature: CadastreFeature; parcel: CadastreParcel; distanceM: number | null } => Boolean(x));

  if (parcels.length === 0) {
    return null;
  }

  parcels.sort((a, b) => {
    const da = a.distanceM ?? Number.POSITIVE_INFINITY;
    const db = b.distanceM ?? Number.POSITIVE_INFINITY;
    if (Math.abs(da - db) > 0.01) return da - db;
    return (a.parcel.contenance ?? Number.POSITIVE_INFINITY) - (b.parcel.contenance ?? Number.POSITIVE_INFINITY);
  });

  return parcels[0];
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
  // DEUX résultats au point : un point posé sur la limite de deux parcelles les touche toutes les deux.
  // La première reste retenue, comme avant, mais la limite est dite (FUT-81, revue du 27/10/2026).
  const pointFeatures = await fetchCadastreFeatures(
    {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    2,
  );

  const directParcel = toCadastreParcel(pointFeatures[0]);
  if (directParcel) {
    const autres = new Set(pointFeatures.map((f) => toCadastreParcel(f)?.idu).filter(Boolean));
    return {
      parcel: { ...directParcel, rattachement: "point", ...(autres.size > 1 ? { candidatsAuPoint: autres.size } : {}) },
      geometry: pointFeatures[0]?.geometry ?? null,
    };
  }

  for (const radiusMeters of [3, 8, 15]) {
    const polygonFeatures = await fetchCadastreFeatures(
      buildSquareAroundPoint(longitude, latitude, radiusMeters),
      8,
    );
    const proche = choisirParcelleProche(polygonFeatures, longitude, latitude);

    if (proche) {
      return {
        parcel: {
          ...proche.parcel, rattachement: "repli",
          ...(proche.distanceM != null ? { distanceRepliM: Math.round(proche.distanceM * 10) / 10 } : {}),
        },
        geometry: proche.feature.geometry ?? null,
      };
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

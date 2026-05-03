import "server-only";

export type BanAddressResult = {
  id: string | null;
  label: string;
  city: string | null;
  citycode: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
};

type BanFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    id?: string;
    label?: string;
    city?: string;
    citycode?: string;
    postcode?: string;
  };
};

type BanResponse = {
  features?: BanFeature[];
};

const BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/";
const REQUEST_TIMEOUT_MS = 8000;

export async function geocodeBanAddress(query: string): Promise<BanAddressResult | null> {
  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(BAN_SEARCH_URL);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: 86400,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`BAN request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as BanResponse;
    const feature = payload.features?.[0];
    const coordinates = feature?.geometry?.coordinates;

    if (!feature || !coordinates || coordinates.length < 2) {
      return null;
    }

    return {
      id: feature.properties?.id?.trim() || null,
      label: feature.properties?.label?.trim() || trimmed,
      city: feature.properties?.city?.trim() || null,
      citycode: feature.properties?.citycode?.trim() || null,
      postcode: feature.properties?.postcode?.trim() || null,
      longitude: coordinates[0],
      latitude: coordinates[1],
    };
  } finally {
    clearTimeout(timeout);
  }
}

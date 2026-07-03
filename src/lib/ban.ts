// Pas de `server-only` : autocompleteBanAddress est appelée côté client (l'API BAN est
// publique, CORS ouvert). geocodeBanAddress reste utilisable côté serveur.

export type BanAddressResult = {
  id: string | null;
  label: string;
  city: string | null;
  citycode: string | null;
  postcode: string | null;
  type: string | null;
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
    type?: string;
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
      type: feature.properties?.type?.trim() || null,
      longitude: coordinates[0],
      latitude: coordinates[1],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function parseBanAutocomplete(features: unknown[]): BanAddressResult[] {
  const out: BanAddressResult[] = [];
  for (const f of features as BanFeature[]) {
    const c = f?.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    out.push({
      id: f.properties?.id?.trim() || null,
      label: f.properties?.label?.trim() || "",
      city: f.properties?.city?.trim() || null,
      citycode: f.properties?.citycode?.trim() || null,
      postcode: f.properties?.postcode?.trim() || null,
      type: f.properties?.type?.trim() || null,
      longitude: c[0],
      latitude: c[1],
    });
  }
  return out;
}

// Autocomplétion (plusieurs suggestions). Appelée côté client ; supporte l'annulation via
// AbortSignal (le composant annule la requête précédente à chaque frappe).
export async function autocompleteBanAddress(
  query: string,
  signal?: AbortSignal,
): Promise<BanAddressResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const url = new URL(BAN_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("autocomplete", "1");
  url.searchParams.set("limit", "6");
  const res = await fetch(url.toString(), { headers: { accept: "application/json" }, signal });
  if (!res.ok) throw new Error(`BAN autocomplete ${res.status}`);
  const payload = (await res.json()) as BanResponse;
  return parseBanAutocomplete(payload.features ?? []);
}

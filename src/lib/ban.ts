// Pas de `server-only` : autocompleteBanAddress est appelée côté client (l'API BAN est
// publique, CORS ouvert). geocodeBanAddress reste utilisable côté serveur.

import type { ReverseHit } from "./dossier-qualification.ts";

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

const BAN_REVERSE_URL = "https://api-adresse.data.gouv.fr/reverse/";

// Les numéros d'adresse autour d'un point.
//
// SEUL MOYEN de savoir si une voie ou un lieu-dit porte des numéros : `GET /search/?q=…&type=
// housenumber` rend ZÉRO résultat sur une rue pleine de numéros, parce que le score plein texte
// ne fait pas remonter les numéros quand la requête n'en porte pas. Vérifié sur « rue Crébillon »
// à Nantes le 30/07/2026, qui rend 0 alors que le 2 existe.
//
// `null` = PANNE. Une liste vide affirme l'absence de numéro, donc refuse une vente : elle ne doit
// jamais venir d'un appel qui a échoué.
export async function reverseHouseNumbers(
  longitude: number,
  latitude: number,
): Promise<ReverseHit[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(BAN_REVERSE_URL);
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("type", "housenumber");
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      features?: { properties?: Record<string, unknown>; geometry?: unknown }[];
    };
    return (json.features ?? []).flatMap((f) => {
      const p = f.properties ?? {};
      const banId = typeof p.id === "string" ? p.id : null;
      const label = typeof p.label === "string" ? p.label : null;
      const distance = typeof p.distance === "number" ? p.distance : null;
      if (!banId || !label || distance === null) return [];
      // LA GÉOMÉTRIE, pas seulement les propriétés : c'est le point du numéro, et c'est lui qui
      // doit servir à qualifier si le lecteur choisit ce candidat.
      const coords = (f.geometry as { coordinates?: [number, number] } | undefined)?.coordinates;
      if (!coords || coords.length !== 2) return [];
      return [{
        banId,
        label,
        citycode: typeof p.citycode === "string" ? p.citycode : null,
        city: typeof p.city === "string" ? p.city : null,
        postcode: typeof p.postcode === "string" ? p.postcode : null,
        longitude: coords[0],
        latitude: coords[1],
        distanceM: distance,
      }];
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Retrouve les features BAN d'un libellé dans une commune, pour REVALIDER une adresse au moment du
// paiement : l'API BAN n'expose aucune lecture par identifiant, on recherche puis on choisit par
// identifiant exact (`pickFeatureById`). Vérifié le 30/07/2026 :
// `?q=2 rue Crebillon&citycode=44109` rend bien `44109_2300_00002`, de type `housenumber`.
export async function fetchBanFeaturesByLabel(
  label: string,
  citycode: string,
): Promise<BanAddressResult[] | null> {
  try {
    const url = new URL(BAN_SEARCH_URL);
    url.searchParams.set("q", label);
    url.searchParams.set("citycode", citycode);
    url.searchParams.set("limit", "10");
    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as BanResponse;
    return parseBanAutocomplete(json.features ?? []);
  } catch {
    return null;
  }
}

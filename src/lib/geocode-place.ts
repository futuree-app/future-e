// LE GÉOCODAGE D'UN LIEU NOMMÉ. Le réseau vit ici, et NULLE PART ailleurs dans la chaîne : le parsing
// (pur, ci-dessous) et les contrôles (place-screening.ts, pur) sont testables sans lui.
//
// DEUX SOURCES, ET IL EN FAUT DEUX. La BAN (api-adresse) ne connaît que des adresses : interrogée sur
// « gare Matabiau », elle rend « Rue Matabiau ». La Géoplateforme (index=poi, BDTOPO) connaît les
// équipements : gares, hôpitaux, universités. On interroge les deux et on FUSIONNE leurs candidats : ce
// sont les contrôles qui trient, pas l'ordre des appels. Un lecteur qui donne une vraie adresse doit
// obtenir son adresse ; un lecteur qui donne une gare ne doit pas obtenir une rue.
//
// ET ON DIT QUAND ON N'A PAS PU DEMANDER. `degraded` distingue « les services ont répondu, ce lieu n'existe
// pas » de « les services n'ont pas répondu ». Sans ce drapeau, une panne réseau deviendrait un lieu
// introuvable, et le lot 2b la persisterait comme une impossibilité stable.
//
// Pas de `server-only` : ce module ne lit aucun secret, et un test node --test doit pouvoir l'importer.
import { departementFromInsee } from "./insee-departement.ts";
import type { GeocodeCandidate } from "./place-screening.ts";

const POI_URL = "https://data.geopf.fr/geocodage/search";
const BAN_URL = "https://api-adresse.data.gouv.fr/search/";
const TIMEOUT_MS = 6000;

export type GeocodeOutcome = { candidates: GeocodeCandidate[]; degraded: boolean };

type Feature = { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };

function coords(f: Feature): [number, number] | null {
  const c = f.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const [lon, lat] = c as [unknown, unknown];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  return [lat, lon]; // GeoJSON écrit [lon, lat] ; notre code parle (lat, lon)
}

// La Géoplateforme rend des TABLEAUX là où la BAN rend des scalaires (city: ["Toulouse"]).
function first(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return (v[0] as string).trim() || null;
  return null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// JAMAIS citycode.slice(0, 2) : « 97411 » rendrait « 97 », qui n'est pas un département, et « 2A004 »
// rendrait « 20 », un département qui n'existe plus depuis 1976. Le helper canonique le sait.
function dept(p: Record<string, unknown>): string | null {
  const code = first(p.citycode);
  return (code ? departementFromInsee(code) : null) ?? first(p.depcode);
}

export function parsePoiFeatures(payload: unknown): GeocodeCandidate[] {
  const features = (payload as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const out: GeocodeCandidate[] = [];
  for (const f of features as Feature[]) {
    const p = f?.properties ?? {};
    const xy = coords(f);
    const label = first(p.toponym) ?? first(p.name);
    const score = num(p.score);
    if (!xy || !label || score == null) continue;
    const cats = Array.isArray(p.category)
      ? (p.category as unknown[]).filter((c): c is string => typeof c === "string")
      : [];
    out.push({
      label,
      // Une gare est un lieu qu'on rejoint, et sa catégorie la nomme. Le reste des équipements reste un
      // « poi » : le contrat n'a pas besoin d'en savoir plus.
      kind: cats.some((c) => c.toLowerCase().includes("gare")) ? "station" : "poi",
      lat: xy[0],
      lon: xy[1],
      citycode: first(p.citycode),
      dept: dept(p),
      score,
      sourceId: first((p.extrafields as Record<string, unknown> | undefined)?.cleabs),
      source: "geoplateforme_poi",
      categories: cats,
    });
  }
  return out;
}

const BAN_KIND: Record<string, GeocodeCandidate["kind"]> = {
  housenumber: "address",
  street: "street",
  municipality: "commune",
  locality: "poi",
};

export function parseBanFeatures(payload: unknown): GeocodeCandidate[] {
  const features = (payload as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const out: GeocodeCandidate[] = [];
  for (const f of features as Feature[]) {
    const p = f?.properties ?? {};
    const xy = coords(f);
    const label = first(p.label);
    const score = num(p.score);
    const type = first(p.type);
    const kind = type ? BAN_KIND[type] : undefined;
    if (!xy || !label || score == null || !kind) continue;
    out.push({
      label,
      kind,
      lat: xy[0],
      lon: xy[1],
      citycode: first(p.citycode),
      dept: dept(p),
      score,
      sourceId: first(p.id),
      source: "ban",
      categories: [],
    });
  }
  return out;
}

// `null` = LE SERVICE N'A PAS RÉPONDU (réseau, timeout, 5xx, 429). Ce n'est pas « zéro résultat », et la
// différence est tout l'objet de ce fichier. On ne jette pas non plus : une recherche entière ne tombe pas
// parce qu'un géocodeur a hoqueté.
async function get(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodePlace(label: string): Promise<GeocodeOutcome> {
  const q = label.trim();
  if (q.length < 3) return { candidates: [], degraded: false };
  const [poi, ban] = await Promise.all([
    get(`${POI_URL}?${new URLSearchParams({ q, index: "poi", limit: "5" })}`),
    get(`${BAN_URL}?${new URLSearchParams({ q, limit: "5" })}`),
  ]);
  return {
    candidates: [...parsePoiFeatures(poi), ...parseBanFeatures(ban)],
    // Un service debout qui trouve la gare pendant que l'autre tombe reste une résolution VALIDE : les
    // contrôles ne lèveront geocoding_unavailable que s'il ne reste aucun candidat recevable.
    degraded: poi === null || ban === null,
  };
}

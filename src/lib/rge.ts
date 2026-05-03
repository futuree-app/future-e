import "server-only";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2";

// ── Types ────────────────────────────────────────────────────────────────────

export type RgeContractor = {
  siret: string;
  nom: string;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  telephone: string | null;
  email: string | null;
  site_internet: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceM: number;
  domaine: string | null;
  meta_domaine: string | null;
  qualification: string | null;
  date_fin: string | null;
  particulier: boolean;
};

export type RgeResult = {
  count: number;
  contractors: RgeContractor[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const SELECT = [
  "siret",
  "nom_entreprise",
  "adresse",
  "code_postal",
  "commune",
  "telephone",
  "email",
  "site_internet",
  "latitude",
  "longitude",
  "domaine",
  "meta_domaine",
  "nom_qualification",
  "lien_date_fin",
  "particulier",
].join(",");

type ApiRecord = {
  siret: string;
  nom_entreprise?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  commune?: string | null;
  telephone?: string | null;
  email?: string | null;
  site_internet?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  domaine?: string | null;
  meta_domaine?: string | null;
  nom_qualification?: string | null;
  lien_date_fin?: string | null;
  particulier?: boolean | null;
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R  = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getRgeNearPoint(
  latitude: number,
  longitude: number,
  radiusM = 20_000,
): Promise<RgeResult> {
  const deg  = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;

  const url = new URL(`${BASE}/lines`);
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("size", "50");
  url.searchParams.set("select", SELECT);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return { count: 0, contractors: [] };

  const json = (await res.json()) as { results?: ApiRecord[] };

  const contractors = (json.results ?? [])
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r): RgeContractor => ({
      siret:         r.siret,
      nom:           r.nom_entreprise ?? r.siret,
      adresse:       r.adresse ?? null,
      code_postal:   r.code_postal ?? null,
      commune:       r.commune ?? null,
      telephone:     r.telephone ?? null,
      email:         r.email ?? null,
      site_internet: r.site_internet ?? null,
      latitude:      r.latitude ?? null,
      longitude:     r.longitude ?? null,
      distanceM:     Math.round(haversineM(latitude, longitude, r.latitude!, r.longitude!)),
      domaine:       r.domaine ?? null,
      meta_domaine:  r.meta_domaine ?? null,
      qualification: r.nom_qualification ?? null,
      date_fin:      r.lien_date_fin ?? null,
      particulier:   r.particulier ?? false,
    }))
    .filter((r) => r.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);

  return { count: contractors.length, contractors };
}

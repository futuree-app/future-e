import "server-only";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/59gkmzgmbjypm6yjqzunjmto";

// ── Types ────────────────────────────────────────────────────────────────────

export type Friche = {
  id: string;
  nom: string;
  type: string | null;
  statut: string | null;
  commune: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceM: number | null;
  sol_pollue: boolean;
  sol_pollution_origine: string | null;
  bati_pollution: string | null;
  activite: string | null;
  activite_fin_annee: number | null;
  urba_zone: string | null;
  zonage_enviro: string | null;
};

export type CartofrichesResult = {
  count: number;
  friches: Friche[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const SELECT = [
  "site_id",
  "site_nom",
  "site_type",
  "site_statut",
  "comm_nom",
  "comm_insee",
  "site_adresse",
  "_geopoint",
  "sol_pollution_existe",
  "sol_pollution_origine",
  "bati_pollution",
  "activite_libelle",
  "activite_fin_annee",
  "urba_zone_lib",
  "zonage_enviro",
].join(",");

type ApiRecord = {
  site_id: string;
  site_nom?: string | null;
  site_type?: string | null;
  site_statut?: string | null;
  comm_nom?: string | null;
  comm_insee?: string | null;
  site_adresse?: string | null;
  _geopoint?: string | null;
  sol_pollution_existe?: boolean | string | null;
  sol_pollution_origine?: string | null;
  bati_pollution?: string | null;
  activite_libelle?: string | null;
  activite_fin_annee?: number | null;
  urba_zone_lib?: string | null;
  zonage_enviro?: string | null;
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

function toFriche(r: ApiRecord, refLat?: number, refLon?: number): Friche {
  let lat: number | null = null;
  let lon: number | null = null;
  if (r._geopoint) {
    const parts = r._geopoint.split(",");
    lat = parseFloat(parts[0]);
    lon = parseFloat(parts[1]);
  }
  return {
    id:                    r.site_id,
    nom:                   r.site_nom ?? r.site_id,
    type:                  r.site_type ?? null,
    statut:                r.site_statut ?? null,
    commune:               r.comm_nom ?? null,
    adresse:               r.site_adresse ?? null,
    latitude:              lat,
    longitude:             lon,
    distanceM:             lat != null && lon != null && refLat != null && refLon != null
                             ? Math.round(haversineM(refLat, refLon, lat, lon))
                             : null,
    sol_pollue:            r.sol_pollution_existe === true || r.sol_pollution_existe === "true" || r.sol_pollution_existe === "1",
    sol_pollution_origine: r.sol_pollution_origine ?? null,
    bati_pollution:        r.bati_pollution ?? null,
    activite:              r.activite_libelle ?? null,
    activite_fin_annee:    r.activite_fin_annee ?? null,
    urba_zone:             r.urba_zone_lib ?? null,
    zonage_enviro:         r.zonage_enviro ?? null,
  };
}

async function fetchLines(params: Record<string, string>): Promise<ApiRecord[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", SELECT);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: ApiRecord[] };
  return json.results ?? [];
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getCartofrichesForCommune(inseeCode: string): Promise<CartofrichesResult> {
  const rows = await fetchLines({ qs: `comm_insee:"${inseeCode}"`, size: "50" });
  return {
    count:   rows.length,
    friches: rows.map((r) => toFriche(r)),
  };
}

export async function getCartofrichesNearPoint(
  latitude: number,
  longitude: number,
  radiusM = 3000,
): Promise<CartofrichesResult> {
  const deg  = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;
  const rows = await fetchLines({ bbox, size: "20" });
  const friches = rows
    .map((r) => toFriche(r, latitude, longitude))
    .filter((f) => f.distanceM == null || f.distanceM <= radiusM)
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
  return { count: friches.length, friches };
}

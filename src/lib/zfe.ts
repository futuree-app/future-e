import "server-only";

const DATASET_URL =
  "https://data.ademe.fr/data-fair/api/v1/datasets/qljefeuzxpqx-98b60-a6n6d";

// ── Types ────────────────────────────────────────────────────────────────────

type GeoPolygon = { type: "Polygon"; coordinates: number[][][] };
type GeoMultiPolygon = { type: "MultiPolygon"; coordinates: number[][][][] };

type ZfeApiRecord = {
  id: string;
  nom?: string | null;
  name?: string | null;
  vp_critair?: string | null;
  deux_rm_critair?: string | null;
  vul_critair?: string | null;
  vp_horaires?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  url_site_information?: string | null;
  _geoshape?: GeoPolygon | GeoMultiPolygon | null;
};

export type ZfeZone = {
  id: string;
  nom: string;
  vp_critair: string | null;
  deux_rm_critair: string | null;
  vul_critair: string | null;
  vp_horaires: string | null;
  date_debut: string | null;
  date_fin: string | null;
  url: string | null;
};

export type ZfeResult = {
  inZfe: boolean;
  zones: ZfeZone[];
};

// ── Geometry ─────────────────────────────────────────────────────────────────

// Ray-casting — GeoJSON ring is [[lon, lat], ...]
function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInShape(lon: number, lat: number, shape: GeoPolygon | GeoMultiPolygon): boolean {
  if (shape.type === "Polygon") return pointInRing(lon, lat, shape.coordinates[0]);
  return shape.coordinates.some((poly) => pointInRing(lon, lat, poly[0]));
}

// ── Cache ────────────────────────────────────────────────────────────────────

let cachedZones: ZfeApiRecord[] | null = null;

async function getAllZones(): Promise<ZfeApiRecord[]> {
  if (cachedZones) return cachedZones;

  const url = new URL(`${DATASET_URL}/lines`);
  url.searchParams.set("size", "50");
  url.searchParams.set(
    "select",
    "id,nom,name,vp_critair,deux_rm_critair,vul_critair,vp_horaires,date_debut,date_fin,url_site_information,_geoshape",
  );

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];

  const json = (await res.json()) as { results?: ZfeApiRecord[] };
  cachedZones = json.results ?? [];
  return cachedZones;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getZfeForPoint(latitude: number, longitude: number): Promise<ZfeResult> {
  const zones = await getAllZones();

  const matching = zones
    .filter((z) => z._geoshape && pointInShape(longitude, latitude, z._geoshape))
    .map(
      (z): ZfeZone => ({
        id:             z.id,
        nom:            z.nom || z.name || z.id,
        vp_critair:     z.vp_critair ?? null,
        deux_rm_critair: z.deux_rm_critair ?? null,
        vul_critair:    z.vul_critair ?? null,
        vp_horaires:    z.vp_horaires ?? null,
        date_debut:     z.date_debut ?? null,
        date_fin:       z.date_fin ?? null,
        url:            z.url_site_information ?? null,
      }),
    );

  return { inZfe: matching.length > 0, zones: matching };
}

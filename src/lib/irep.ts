import "server-only";

const DATASET_URL =
  "https://data.ademe.fr/data-fair/api/v1/datasets/085ipnlpj9awm78hikh1nakj";

// ── Types ────────────────────────────────────────────────────────────────────

export type IrepInstallation = {
  id: number;
  nom: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  nombre_polluants: number;
  milieu_emission: string | null;
};

export type IrepResult = {
  count: number;
  installations: IrepInstallation[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getIrepNearPoint(
  latitude: number,
  longitude: number,
  radiusM = 5000,
): Promise<IrepResult> {
  const deg = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;

  const url = new URL(`${DATASET_URL}/lines`);
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("size", "20");
  url.searchParams.set(
    "select",
    "identifiant,nom_etablissement,latitude,longitude,nombre_polluants,milieu_emission",
  );

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return { count: 0, installations: [] };

  const json = (await res.json()) as {
    results?: Array<{
      identifiant: number;
      nom_etablissement: string;
      latitude: number;
      longitude: number;
      nombre_polluants?: number | null;
      milieu_emission?: string | null;
    }>;
  };

  const installations = (json.results ?? [])
    .map((r) => ({
      id:               r.identifiant,
      nom:              r.nom_etablissement,
      latitude:         r.latitude,
      longitude:        r.longitude,
      distanceM:        Math.round(haversineM(latitude, longitude, r.latitude, r.longitude)),
      nombre_polluants: r.nombre_polluants ?? 0,
      milieu_emission:  r.milieu_emission ?? null,
    }))
    .filter((r) => r.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);

  return { count: installations.length, installations };
}

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export type DpeLabel = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type DpeRecord = {
  id_dpe: string;
  date_dpe: string | null;
  id_ban: string | null;
  adresse: string | null;
  etiquette_dpe: DpeLabel | null;
  etiquette_ges: DpeLabel | null;
  conso_ep: number | null;
  emission_ges: number | null;
  surface_m2: number | null;
  annee_construction: number | null;
  type_batiment: string | null;
};

export type DpeCommuneSummary = {
  inseeCode: string;
  total: number;
  distribution: Record<DpeLabel, number>;
  passoiresPct: number;         // % logements E+F+G
  medianLabel: DpeLabel | null; // étiquette médiane
  mostRecent: DpeRecord | null;
};

// DPE label ordering (A = best = 1, G = worst = 7)
const LABEL_ORDER: DpeLabel[] = ["A", "B", "C", "D", "E", "F", "G"];

function medianLabel(distribution: Record<DpeLabel, number>, total: number): DpeLabel | null {
  if (total === 0) return null;
  const mid = Math.floor(total / 2);
  let cumul = 0;
  for (const label of LABEL_ORDER) {
    cumul += distribution[label];
    if (cumul > mid) return label;
  }
  return null;
}

// ── Query: by BAN ID (module logement — adresse précise) ─────────────────────

export async function getDpeByBanId(banId: string): Promise<DpeRecord | null> {
  const { data, error } = await getClient()
    .from("dpe_logements")
    .select(
      "id_dpe,date_dpe,id_ban,adresse,etiquette_dpe,etiquette_ges,conso_ep,emission_ges,surface_m2,annee_construction,type_batiment",
    )
    .eq("id_ban", banId)
    .order("date_dpe", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[DPE] getDpeByBanId error:", error.message);
    return null;
  }

  return data as DpeRecord | null;
}

// ── Query: by coordinates (bounding box ±radius, sorted by distance approx) ──

export async function getDpeByCoordinates(
  latitude: number,
  longitude: number,
  radiusM = 50,
): Promise<DpeRecord | null> {
  const deg = radiusM / 111_000;

  const { data, error } = await getClient()
    .from("dpe_logements")
    .select(
      "id_dpe,date_dpe,id_ban,adresse,etiquette_dpe,etiquette_ges,conso_ep,emission_ges,surface_m2,annee_construction,type_batiment,latitude,longitude",
    )
    .gte("latitude", latitude - deg)
    .lte("latitude", latitude + deg)
    .gte("longitude", longitude - deg)
    .lte("longitude", longitude + deg)
    .order("date_dpe", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[DPE] getDpeByCoordinates error:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  // Closest by Euclidean distance on lat/lon
  let best = data[0];
  let bestDist = Infinity;
  for (const row of data) {
    const dlat = (row.latitude ?? 0) - latitude;
    const dlon = (row.longitude ?? 0) - longitude;
    const dist = dlat * dlat + dlon * dlon;
    if (dist < bestDist) { bestDist = dist; best = row; }
  }

  const { latitude: _lat, longitude: _lon, ...record } = best as DpeRecord & { latitude: number; longitude: number };
  return record;
}

// ── Query: commune summary (pages savoir/territoires) ────────────────────────

export async function getDpeCommuneSummary(inseeCode: string): Promise<DpeCommuneSummary | null> {
  const { data, error } = await getClient()
    .from("dpe_logements")
    .select("etiquette_dpe,date_dpe,id_dpe,id_ban,adresse,etiquette_ges,conso_ep,emission_ges,surface_m2,annee_construction,type_batiment")
    .eq("code_insee", inseeCode)
    .order("date_dpe", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[DPE] getDpeCommuneSummary error:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  const distribution: Record<DpeLabel, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
  for (const row of data) {
    const label = row.etiquette_dpe as DpeLabel | null;
    if (label && label in distribution) distribution[label]++;
  }

  const total = data.length;
  const passoires = (distribution.E + distribution.F + distribution.G);
  const passoiresPct = total > 0 ? Math.round((passoires / total) * 100) : 0;

  const mostRecent = data[0]
    ? {
        id_dpe: data[0].id_dpe,
        date_dpe: data[0].date_dpe,
        id_ban: data[0].id_ban,
        adresse: data[0].adresse,
        etiquette_dpe: data[0].etiquette_dpe as DpeLabel | null,
        etiquette_ges: data[0].etiquette_ges as DpeLabel | null,
        conso_ep: data[0].conso_ep,
        emission_ges: data[0].emission_ges,
        surface_m2: data[0].surface_m2,
        annee_construction: data[0].annee_construction,
        type_batiment: data[0].type_batiment,
      }
    : null;

  return {
    inseeCode,
    total,
    distribution,
    passoiresPct,
    medianLabel: medianLabel(distribution, total),
    mostRecent,
  };
}

// ── In-memory cache ───────────────────────────────────────────────────────────

const communeCache = new Map<string, Promise<DpeCommuneSummary | null>>();

export async function getDpeSummaryForCommune(inseeCode: string): Promise<DpeCommuneSummary | null> {
  const key = inseeCode.trim();

  if (!communeCache.has(key)) {
    communeCache.set(key, getDpeCommuneSummary(key).catch(() => null));
  }

  return communeCache.get(key)!;
}

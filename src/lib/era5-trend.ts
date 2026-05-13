import { createClient } from "@supabase/supabase-js";

export type Era5Trend = {
  delta_c: number;            // recent_mean - baseline_mean (°C)
  baseline_mean_c: number;    // moyenne annuelle 1961-1990
  recent_mean_c: number;      // moyenne annuelle des 10 dernières années
  data_through_year: number;  // dernière année incluse
};

/**
 * Récupère la tendance ERA5-Land pour une commune (par code INSEE).
 * Source : table `commune_era5_trend` peuplée par scripts/populate-era5-trend.py
 * Renvoie null si pas de données pour cette commune.
 */
export async function getEra5Trend(insee: string): Promise<Era5Trend | null> {
  if (!insee) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data, error } = await supabase
    .from("commune_era5_trend")
    .select("delta_c, baseline_mean_c, recent_mean_c, data_through_year")
    .eq("insee_code", insee)
    .maybeSingle();

  if (error) {
    console.error("[era5-trend] Supabase error:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    delta_c:           Number(data.delta_c),
    baseline_mean_c:   Number(data.baseline_mean_c),
    recent_mean_c:     Number(data.recent_mean_c),
    data_through_year: Number(data.data_through_year),
  };
}

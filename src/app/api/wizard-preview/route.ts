import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClimatDataCommune } from "@/lib/drias-json";
import { getAtmoForCommune, type AtmoAirQuality } from "@/lib/atmo";

export type WizardPreviewData = {
  commune_name: string | null;
  drias: {
    canicule_gwl20: number | null;
    canicule_gwl30: number | null;
    delta_canicule: number | null;
    nuits_tropicales_gwl20: number | null;
    delta_precip_pct: number | null;
  } | null;
  tensions: Array<{
    slug: string;
    score: number;
    ind_exposition: number | null;
    ind_vulnerabilite: number | null;
  }>;
  atmo: AtmoAirQuality | null;
  fallback: boolean;
};

async function fetchTensions(inseeCode: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data, error } = await supabase
    .from("communes_tension")
    .select("slug, score, ind_exposition, ind_vulnerabilite")
    .eq("insee_code", inseeCode)
    .order("score", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[wizard-preview] Supabase error:", error.message);
    return [];
  }

  return (data ?? []) as Array<{
    slug: string;
    score: number;
    ind_exposition: number | null;
    ind_vulnerabilite: number | null;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee");

  if (!insee) {
    return NextResponse.json({ error: "Missing insee" }, { status: 400 });
  }

  const safeInsee = String(insee).padStart(5, "0");

  const [driasResult, tensionsResult, atmoResult] = await Promise.allSettled([
    getClimatDataCommune(safeInsee),
    fetchTensions(safeInsee),
    process.env.ATMO_USERNAME ? getAtmoForCommune(safeInsee) : Promise.resolve(null),
  ]);

  const drias = driasResult.status === "fulfilled" ? driasResult.value : null;
  const tensions = tensionsResult.status === "fulfilled" ? tensionsResult.value : [];
  const atmo = atmoResult.status === "fulfilled" ? atmoResult.value : null;

  let driasOut: WizardPreviewData["drias"] = null;
  let communeName: string | null = null;

  if (drias) {
    communeName = drias.commune.n ?? null;
    const s = drias.commune.s;
    const gwl15 = s.gwl15?.v ?? {};
    const gwl20 = s.gwl20?.v ?? {};
    const gwl30 = s.gwl30?.v ?? {};

    const c15 = gwl15["NORTX30D_yr"] ?? null;
    const c20 = gwl20["NORTX30D_yr"] ?? null;
    const c30 = gwl30["NORTX30D_yr"] ?? null;
    const n20 = gwl20["NORTR_yr"] ?? null;
    const p15 = gwl15["NORRR_seas_JJA"] ?? null;
    const p20 = gwl20["NORRR_seas_JJA"] ?? null;

    driasOut = {
      canicule_gwl20: c20 !== null ? Math.round(c20) : null,
      canicule_gwl30: c30 !== null ? Math.round(c30) : null,
      delta_canicule: c20 !== null && c15 !== null ? Math.round(c20 - c15) : null,
      nuits_tropicales_gwl20: n20 !== null ? Math.round(n20) : null,
      delta_precip_pct:
        p20 !== null && p15 !== null && p15 > 0
          ? Math.round(((p20 - p15) / p15) * 100)
          : null,
    };
  }

  const response: WizardPreviewData = {
    commune_name: communeName,
    drias: driasOut,
    tensions,
    atmo: atmo ?? null,
    fallback: !drias && tensions.length === 0,
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

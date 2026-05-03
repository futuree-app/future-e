import { NextResponse } from "next/server";
import { getRenovationCosts } from "@/lib/renovation";

// GET /api/renovation/75  (département code)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ departement: string }> },
) {
  const { departement } = await params;

  try {
    const data = await getRenovationCosts(departement);
    return NextResponse.json(
      { ...data, note: "Données enquête ADEME 2017-2018 — indicatif uniquement." },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Renovation costs fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

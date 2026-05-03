import { NextResponse } from "next/server";
import { getDpeSummaryForCommune } from "@/lib/dpe";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ insee: string }> },
) {
  const { insee } = await params;

  try {
    const data = await getDpeSummaryForCommune(insee);

    if (!data) {
      return NextResponse.json({ error: "No DPE data for this commune." }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DPE fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

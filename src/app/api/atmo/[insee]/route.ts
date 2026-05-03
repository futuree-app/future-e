import { NextResponse } from "next/server";
import { getAtmoForCommune } from "@/lib/atmo";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ insee: string }> },
) {
  const { insee } = await params;

  try {
    const data = await getAtmoForCommune(insee);

    if (!data) {
      return NextResponse.json({ error: "No data available." }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ATMO fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

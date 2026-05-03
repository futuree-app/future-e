import { NextResponse } from "next/server";
import { getZfeForPoint } from "@/lib/zfe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Missing lat/lon parameters." }, { status: 400 });
  }

  try {
    const data = await getZfeForPoint(lat, lon);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ZFE fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

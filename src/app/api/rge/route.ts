import { NextResponse } from "next/server";
import { getRgeNearPoint } from "@/lib/rge";

// GET /api/rge?lat=45.7&lon=4.8&radius=20000
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat    = parseFloat(searchParams.get("lat") ?? "");
  const lon    = parseFloat(searchParams.get("lon") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "20000", 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Missing lat/lon parameters." }, { status: 400 });
  }

  try {
    const data = await getRgeNearPoint(lat, lon, radius);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RGE fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

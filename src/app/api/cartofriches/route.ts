import { NextResponse } from "next/server";
import { getCartofrichesForCommune, getCartofrichesNearPoint } from "@/lib/cartofriches";

// GET /api/cartofriches?insee=69123
// GET /api/cartofriches?lat=45.7&lon=4.8&radius=3000
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee  = searchParams.get("insee");
  const lat    = parseFloat(searchParams.get("lat") ?? "");
  const lon    = parseFloat(searchParams.get("lon") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "3000", 10);

  try {
    let data;
    if (insee) {
      data = await getCartofrichesForCommune(insee);
    } else if (!isNaN(lat) && !isNaN(lon)) {
      data = await getCartofrichesNearPoint(lat, lon, radius);
    } else {
      return NextResponse.json(
        { error: "Provide insee or lat+lon parameters." },
        { status: 400 },
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cartofriches fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

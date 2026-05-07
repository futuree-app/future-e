import { NextResponse } from "next/server";
import { getGissolForCommune } from "@/lib/gissol";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee");

  if (!insee) {
    return NextResponse.json({ error: "Missing insee" }, { status: 400 });
  }

  try {
    const result = await getGissolForCommune(insee.trim());
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ error: "GisSol unavailable" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getCommuneFullData } from "@/lib/commune-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee")?.trim();

  if (!insee) {
    return NextResponse.json(
      { error: "Missing insee parameter." },
      { status: 400 },
    );
  }

  try {
    const data = await getCommuneFullData(insee);

    if (!data) {
      return NextResponse.json(
        { error: `No ADEME commune data found for ${insee}.` },
        { status: 404 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to resolve ADEME commune data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getGeorisquesSummary } from "@/lib/georisques";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inseeCode = searchParams.get("insee");

  if (!inseeCode) {
    return NextResponse.json(
      { error: "Missing insee parameter." },
      { status: 400 },
    );
  }

  try {
    const payload = await getGeorisquesSummary(inseeCode);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read Géorisques data.";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

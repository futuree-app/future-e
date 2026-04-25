import { NextResponse } from "next/server";
import { getClimatDataCommune } from "@/lib/drias-json";

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
    const record = await getClimatDataCommune(inseeCode);

    if (!record) {
      return NextResponse.json(
        { error: "Commune not found in DRIAS dataset." },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read DRIAS dataset.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

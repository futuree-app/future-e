import { NextResponse } from "next/server";
import { getCompactDriasCommune } from "@/lib/drias-compact";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset");
  const inseeCode = searchParams.get("insee");

  if (
    !inseeCode ||
    !dataset ||
    (dataset !== "landing" && dataset !== "dashboard")
  ) {
    return NextResponse.json(
      { error: "Missing or invalid dataset/insee parameters." },
      { status: 400 },
    );
  }

  try {
    const record = await getCompactDriasCommune(dataset, inseeCode);

    if (!record) {
      return NextResponse.json(
        { error: "Commune not found in compact DRIAS dataset." },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read compact DRIAS dataset.";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

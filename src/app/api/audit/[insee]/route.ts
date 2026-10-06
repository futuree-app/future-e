import { NextResponse } from "next/server";
import { getAuditByBanId } from "@/lib/audit";

// Called via georisques-logement with a BAN id.
// This standalone route allows fetching an audit directly by BAN id.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ insee: string }> },
) {
  const { insee } = await params;
  const { searchParams } = new URL(request.url);
  const banId = searchParams.get("ban_id");

  if (!banId) {
    return NextResponse.json({ error: "Missing ban_id query parameter." }, { status: 400 });
  }

  void insee; // insee kept in path for potential future commune-level aggregation

  try {
    const lookup = await getAuditByBanId(banId);
    // Une panne de la source n'est pas « aucun audit » (FUT-65) : 503, jamais 404.
    if (lookup.status === "unavailable") {
      return NextResponse.json({ error: "Audit source unavailable." }, { status: 503 });
    }
    if (lookup.status === "absent") {
      return NextResponse.json({ error: "No audit found for this address." }, { status: 404 });
    }
    return NextResponse.json(lookup.audit, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

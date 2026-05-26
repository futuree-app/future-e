// GET /api/ask/context?insee=XXXXX
// Pré-warm fire-and-forget : déclenche les fetches ADEME + DRIAS + Hub'Eau
// pour que la première vraie question de la session bénéficie déjà du cache
// framework. Renvoie seulement une indication d'availability, pas les données.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee")?.trim();
  if (!insee) {
    return NextResponse.json({ error: "insee requis." }, { status: 400 });
  }

  // Auth check (on ne veut pas qu'un anonyme déclenche des fetches ADEME en boucle)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const enrichment = await gatherCommuneEnrichment(insee);

  return NextResponse.json({
    ok: true,
    has: {
      ademe: enrichment.ademe !== null,
      drias: enrichment.drias !== null,
      eau: enrichment.eau !== null,
    },
  });
}

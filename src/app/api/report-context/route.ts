// ════════════════════════════════════════════════════════════════════════════
// /api/report-context · contexte de lecture d'un rapport (user × commune)
// — PATCH { insee, relation } : l'utilisateur CORRIGE la relation à la commune
//   (relation_source devient confirmed_by_user, et prime alors sur l'inférence).
//
// La table report_context est protégée par RLS (own-rows) : l'upsert s'exécute
// avec la session utilisateur, qui ne peut écrire que ses propres lignes.
// L'écriture du workbook découverte (discovery_workbook) viendra avec l'étape 3.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRelation } from "@/lib/report-context";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { insee?: string; relation?: string };
    const insee = typeof body.insee === "string" ? body.insee.trim() : "";
    const { relation } = body;

    if (!insee) {
      return NextResponse.json({ error: "insee requis." }, { status: 400 });
    }
    if (!isRelation(relation)) {
      return NextResponse.json({ error: "relation invalide." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { error } = await supabase.from("report_context").upsert(
      {
        user_id: user.id,
        insee,
        relation,
        relation_source: "confirmed_by_user",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,insee" },
    );

    if (error) {
      console.error("[report-context] PATCH upsert error:", error.message);
      return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[report-context] PATCH error:", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }
}

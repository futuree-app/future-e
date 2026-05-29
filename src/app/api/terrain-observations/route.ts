// ════════════════════════════════════════════════════════════════════════════
// /api/terrain-observations · POST
//
// Sauvegarde des "Repères de terrain" avec DOUBLE ÉCRITURE :
//   1. user_profiles.workbook_quartier  (compatibilité, objet complet)
//   2. terrain_observations             (base propre, préparation collective)
//
// La table terrain_observations est upsertée sur la clé logique temporaire
// (user_id, insee_code, module). report_id est conservé s'il est fourni mais
// n'existe pas encore dans le produit : la clé d'upsert reste la commune.
//
// IMPORTANT : ces observations ne sont PAS encore injectées dans les prompts
// IA. Cette route ne fait que persister et préparer l'agrégation future.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Answers = {
  heat?: string;
  water?: string;
  shelter?: string;
  change?: string;
  note?: string;
};

type Body = {
  answers?: Answers;
  inseeCode?: string;
  commune?: string;
  reportId?: string | null;
  module?: string;
};

const ALLOWED_MODULES = new Set(["quartier"]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const answers = body.answers;

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "answers requis." }, { status: 400 });
    }

    const moduleName = typeof body.module === "string" && ALLOWED_MODULES.has(body.module) ? body.module : "quartier";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const now = new Date().toISOString();

    // ── 1. Écriture compat : objet complet dans user_profiles.workbook_quartier
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ workbook_quartier: answers, updated_at: now })
      .eq("user_id", user.id);
    if (profileError) {
      console.error("[terrain-observations] profile update error:", profileError);
      return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
    }

    // ── 2. Écriture propre : terrain_observations (upsert sur la clé logique)
    // On sépare les choix (answers) du texte libre (free_text), et on ne crée
    // pas de ligne vide si rien n'est renseigné ni si la commune est inconnue.
    const inseeCode = typeof body.inseeCode === "string" ? body.inseeCode.trim() : "";
    const commune = typeof body.commune === "string" ? body.commune.trim() : "";

    const choiceAnswers = {
      heat: typeof answers.heat === "string" ? answers.heat : "",
      water: typeof answers.water === "string" ? answers.water : "",
      shelter: typeof answers.shelter === "string" ? answers.shelter : "",
      change: typeof answers.change === "string" ? answers.change : "",
    };
    const freeText = typeof answers.note === "string" ? answers.note.trim() : "";
    const hasContent =
      Object.values(choiceAnswers).some(Boolean) || freeText.length > 0;

    let observationSaved = false;
    if (inseeCode && commune && hasContent) {
      const { error: obsError } = await supabase
        .from("terrain_observations")
        .upsert(
          {
            user_id: user.id,
            report_id: typeof body.reportId === "string" && body.reportId ? body.reportId : null,
            insee_code: inseeCode,
            commune,
            module: moduleName,
            answers: choiceAnswers,
            free_text: freeText || null,
            source: "quartier_workbook",
            version: "v1",
            updated_at: now,
          },
          { onConflict: "user_id,insee_code,module" },
        );
      if (obsError) {
        // Non bloquant : la compat user_profiles a déjà réussi. On log et on
        // continue pour ne pas casser l'expérience de sauvegarde.
        console.error("[terrain-observations] upsert error:", obsError);
      } else {
        observationSaved = true;
      }
    }

    return NextResponse.json({ success: true, observationSaved });
  } catch (error) {
    console.error("[terrain-observations] POST error:", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }
}

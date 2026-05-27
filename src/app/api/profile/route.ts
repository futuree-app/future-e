// ════════════════════════════════════════════════════════════════════════════
// /api/profile · gestion fine des informations de personnalisation
// — PATCH { field, value } : met à jour ou efface (value=null) un champ.
// — DELETE { scope: "ask_collected" } : vide les champs collectés via AskFuture
//   sans toucher aux champs structurants du compte (home_insee_code,
//   home_commune, household_mode_enabled).
//
// Distinct de /api/ask PATCH : ici on REMPLACE les valeurs (arrays inclus)
// alors qu'AskFuture ajoute progressivement.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FieldType = "text" | "boolean" | "array";
type FieldConfig = { type: FieldType; allowed?: readonly string[] };

const FIELDS: Record<string, FieldConfig> = {
  age_band:           { type: "text" },
  housing_status:     { type: "text" },
  housing_type:       { type: "text" },
  job_category:       { type: "text" },
  mobility_profile:   { type: "text" },
  logement_chauffage: {
    type: "text",
    allowed: ["gaz", "electrique", "pompe_chaleur", "fioul", "bois", "autre"],
  },
  logement_isolation: {
    type: "text",
    allowed: ["bonne", "moyenne", "mauvaise", "inconnue"],
  },
  presence_enfants:   { type: "boolean" },
  age_enfants:        { type: "text" },
  travail_exterieur:  { type: "boolean" },
  vehicule_type: {
    type: "text",
    allowed: ["thermique", "hybride", "electrique", "aucun"],
  },
  health_flags:  { type: "array" },
  life_projects: { type: "array" },
};

// Tous les champs gérables par la page Mémoire — utilisés aussi par le clear-all.
const ASK_COLLECTED_FIELDS = Object.keys(FIELDS);

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { field?: string; value?: unknown; insee_code?: string; nom?: string };
    const { field } = body;

    if (typeof field !== "string") {
      return NextResponse.json({ error: "Champ requis." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Cas spécial : carnet de bord Quartier (objet JSONB libre).
    if (field === "workbook_quartier") {
      const wbValue = body.value;
      if (wbValue !== null && wbValue !== undefined && (typeof wbValue !== "object" || Array.isArray(wbValue))) {
        return NextResponse.json({ error: "Objet attendu pour workbook_quartier." }, { status: 400 });
      }
      const { error } = await supabase
        .from("user_profiles")
        .update({ workbook_quartier: wbValue ?? null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] PATCH workbook_quartier error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Cas spécial : mise à jour de la commune (deux champs atomiques).
    if (field === "commune") {
      const inseeCode = typeof body.insee_code === "string" ? body.insee_code.trim() : null;
      const nom = typeof body.nom === "string" ? body.nom.trim() : null;
      if (!inseeCode || !nom) {
        return NextResponse.json({ error: "insee_code et nom requis." }, { status: 400 });
      }
      const { error } = await supabase
        .from("user_profiles")
        .update({ home_insee_code: inseeCode, home_commune: nom, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] PATCH commune error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (!(field in FIELDS)) {
      return NextResponse.json({ error: "Champ non autorisé." }, { status: 400 });
    }
    const { value } = body;
    const config = FIELDS[field];

    let normalized: unknown;

    if (value === null || value === undefined) {
      normalized = null;
    } else if (config.type === "boolean") {
      if (typeof value === "boolean") normalized = value;
      else if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        if (["oui", "true", "yes", "1"].includes(v)) normalized = true;
        else if (["non", "false", "no", "0"].includes(v)) normalized = false;
        else return NextResponse.json({ error: "Valeur booléenne invalide." }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Type attendu : booléen." }, { status: 400 });
      }
    } else if (config.type === "array") {
      if (!Array.isArray(value)) {
        return NextResponse.json({ error: "Tableau attendu." }, { status: 400 });
      }
      const cleaned = value
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter((v) => v.length > 0);
      normalized = Array.from(new Set(cleaned));
    } else {
      if (typeof value !== "string") {
        return NextResponse.json({ error: "Chaîne attendue." }, { status: 400 });
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        normalized = null;
      } else if (config.allowed && !config.allowed.includes(trimmed)) {
        return NextResponse.json(
          { error: `Valeur non autorisée pour ${field}.` },
          { status: 400 },
        );
      } else {
        normalized = trimmed;
      }
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ [field]: normalized, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      console.error("[profile] PATCH update error:", error);
      return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[profile] PATCH error:", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }
}

// DELETE { scope: "ask_collected" } : remet à null tous les champs gérés par
// la page Mémoire. Ne touche pas à home_insee_code, home_commune,
// household_mode_enabled (champs structurants du compte) ni au reste.
export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { scope?: string };
    if (body.scope !== "ask_collected") {
      return NextResponse.json({ error: "Scope non supporté." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const f of ASK_COLLECTED_FIELDS) {
      const cfg = FIELDS[f];
      payload[f] = cfg.type === "array" ? [] : null;
    }

    const { error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("user_id", user.id);

    if (error) {
      console.error("[profile] DELETE update error:", error);
      return NextResponse.json({ error: "Erreur de suppression." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[profile] DELETE error:", error);
    return NextResponse.json({ error: "Erreur de suppression." }, { status: 500 });
  }
}

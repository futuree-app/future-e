// Bascule le territoire actif de lecture vers un INSEE, après un paiement
// confirmé côté client. La source de vérité (grant + entitlements) reste le
// webhook Stripe ; cet endpoint évite seulement la latence du webhook pour que
// l'utilisateur arrive immédiatement sur le rapport du territoire acheté.
//
// Ne touche JAMAIS la résidence (home_insee_code / home_commune).

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { insee?: string; commune?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const insee = typeof body.insee === "string" ? body.insee.trim().toUpperCase() : "";
  if (!/^[0-9AB][0-9]{4}$/.test(insee)) {
    return NextResponse.json({ error: "Code INSEE invalide." }, { status: 400 });
  }
  const commune = typeof body.commune === "string" ? body.commune.trim().slice(0, 120) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ active_insee_code: insee, active_commune: commune || null })
    .eq("user_id", user.id);

  if (error) {
    console.error("[territoire/activer]", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

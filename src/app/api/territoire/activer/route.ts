// Bascule le territoire actif de lecture vers un INSEE, après un paiement
// confirmé côté client. La source de vérité (grant + entitlements) reste le
// webhook Stripe ; cet endpoint évite seulement la latence du webhook pour que
// l'utilisateur arrive immédiatement sur le rapport du territoire acheté.
//
// Ne touche JAMAIS la résidence (home_insee_code / home_commune).
//
// FUT-119 : le nom du territoire actif est celui du référentiel. `body.commune` n'est plus lu : il laissait
// écrire `active_commune = "La Rochelle"` à côté de `active_insee_code = 30189` (Nîmes). Un code que le
// référentiel ne sait pas nommer n'est pas activé. L'ancienne garde de forme refusait aussi tout code corse.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { communeIdentifiee } from "@/lib/commerce/eligibilite-territoriale";
import { communeDuReferentiel, nomDuReferentiel } from "@/lib/commerce/referentiel-communes";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { insee?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const territoire = communeIdentifiee(body?.insee, communeDuReferentiel, nomDuReferentiel);
  if (!territoire.ok) {
    return NextResponse.json({ error: "Code INSEE invalide.", code: territoire.code }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ active_insee_code: territoire.insee, active_commune: territoire.nom })
    .eq("user_id", user.id);

  if (error) {
    console.error("[territoire/activer]", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

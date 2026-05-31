// Réinitialise le territoire actif de lecture vers la résidence.
// Ne touche JAMAIS home_insee_code / home_commune : efface seulement l'overlay
// active_insee_code / active_commune, puis renvoie vers le rapport.

import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { supabase, user } = await requireCurrentUser();
  await supabase
    .from("user_profiles")
    .update({ active_insee_code: null, active_commune: null })
    .eq("user_id", user.id);

  return NextResponse.redirect(new URL("/rapport", request.url));
}

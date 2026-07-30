import "server-only";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";

export const dynamic = "force-dynamic";

// Le dossier d'un paiement, POUR SON PROPRIÉTAIRE SEULEMENT.
//
// La recherche porte sur `stripe_payment_intent_id` ET `user_id`. Sans le second, quiconque
// détient un identifiant de PaymentIntent pourrait sonder l'existence d'un dossier et récupérer
// son uuid, qui est la clé d'ouverture de toutes les pages du bien. L'exigence est gratuite ici :
// aucun paiement ne peut avoir lieu sans authentification.
//
// Elle existe parce que la page de succès NE PEUT PAS supposer le dossier créé : Stripe confirme
// côté client avant que le webhook n'arrive.
export async function GET(request: Request) {
  const { supabase, user } = await requireCurrentUser();
  const pi = new URL(request.url).searchParams.get("pi");
  if (!pi) return NextResponse.json({ error: "pi requis" }, { status: 400 });

  const { data } = await supabase
    .from("address_dossiers")
    .select("id")
    .eq("stripe_payment_intent_id", pi)
    .eq("user_id", user.id)
    .is("access_revoked_at", null)
    .maybeSingle();

  return NextResponse.json(
    data?.id ? { status: "ready", dossierId: data.id } : { status: "pending" },
  );
}

import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeBuyerName } from "@/lib/invoice";

export const runtime = "nodejs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE NOM DE FACTURATION, POSÉ PAR SON PROPRIÉTAIRE.
//
// Existe pour un seul cas : un compte qui n'a pas de nom arrive au paiement.
// `create-payment-intent` refuse alors avec `BILLING_NAME_REQUIRED`, l'écran de paiement demande
// le nom, cette route l'enregistre, et le paiement repart. Concerne les comptes créés avant que
// l'inscription ne demande le nom, et les comptes Google dont le profil n'en porte pas.
//
// ÉCRIT DANS LES MÉTADONNÉES DU COMPTE, pas dans une table à part : `full_name` est déjà la clé
// que renseignent l'inscription par e-mail et la connexion Google. Une seconde source de vérité
// pour la même information créerait exactement la divergence que `legal-entity.ts` évite côté
// vendeur.
//
// AUCUNE VÉRIFICATION D'IDENTITÉ, et c'est volontaire : sur une facture, le nom du client est
// DÉCLARÉ par lui. Le vendeur ne certifie pas qui il est.
// ════════════════════════════════════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { fullName?: unknown } | null;
  const fullName = normalizeBuyerName(body?.fullName);
  if (!fullName) {
    return NextResponse.json(
      { error: "Indiquez votre nom et votre prénom." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (error) {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }

  return NextResponse.json({ fullName });
}

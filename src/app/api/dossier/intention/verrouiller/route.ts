import "server-only";
import { getCurrentSessionUser } from "@/lib/user-account";
import { estIdentifiantPaymentIntent, verrouillerIntention } from "@/lib/verrou-intention-dossier";
import { storeIntentionsSupabase } from "@/lib/server/intention-dossier-store";

export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════════════════════
// POST { paymentIntentId } : VERROUILLE le contexte d'une intention de dossier (FUT-10, revue).
//
// Appelée par le formulaire de paiement JUSTE AVANT `stripe.confirmPayment` : si elle échoue, la
// confirmation n'est pas envoyée. À partir d'ici, les réponses et le projet figés pour ce paiement ne
// changent plus (cf. `verrou-intention-dossier.ts`, qui porte l'invariant).
//
// Le compte est vérifié dans la condition SQL elle-même (`user_id`) : verrouiller l'intention d'un autre
// compte répond `introuvable`, sans rien écrire. Idempotente : un double clic répond deux fois `ok`.
// ════════════════════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { paymentIntentId?: unknown } | null;
  if (!estIdentifiantPaymentIntent(body?.paymentIntentId)) {
    return Response.json({ error: "paymentIntentId invalide" }, { status: 400 });
  }
  // Un 401 explicite, pas une redirection : le formulaire doit savoir qu'il ne peut PAS confirmer.
  const { user } = await getCurrentSessionUser();
  if (!user) return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const r = await verrouillerIntention(storeIntentionsSupabase(), body.paymentIntentId, user.id, new Date());
    if (r === "introuvable") return Response.json({ error: "INTENT_NOT_FOUND" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[intention/verrouiller]", error instanceof Error ? error.message : "échec");
    return Response.json({ error: "LOCK_FAILED" }, { status: 500 });
  }
}

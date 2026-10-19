// FUT-115 · LE RETOUR DE STRIPE VERS LE COMPARATIF : demander à Stripe, jamais croire l'URL.
//
// Stripe renvoie le navigateur sur `/comparateur/pack-decision?…&payment_intent=pi_…&redirect_status=…`. Ces
// paramètres se recopient à la main : `payment_intent` n'est ici qu'une CLÉ DE RECHERCHE, et
// `redirect_status` n'est jamais lu. La preuve est le PaymentIntent que le serveur relit chez Stripe avec sa clé
// secrète. Pourquoi ne pas attendre le seul webhook : il arrive souvent APRÈS le retour du navigateur, et un
// acheteur verrait un comparatif fermé qu'il vient de payer. La lecture synchrone, aussi fiable que le webhook
// (même source, serveur à serveur), lui ouvre son comparatif tout de suite ; le webhook reste le filet quand la
// page n'est jamais rechargée. Les deux passent par la même preuve et le même octroi idempotent.
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
import type { PaiementStripe } from "@/lib/commerce/preuve-paiement-pack";

/**
 * - `aucun` : pas de retour de paiement à traiter (pas d'identifiant, ou identifiant mal formé) ;
 * - `octroye` : Stripe confirme, le comparatif est ouvert (ou l'était déjà) ;
 * - `en_attente` : paiement en cours chez Stripe, ou confirmé mais l'écriture des droits a échoué (le webhook
 *   les écrira) : la page attend et se recharge ;
 * - `non_confirme` : Stripe ne confirme pas ce paiement pour ce compte et ce comparatif. Rien n'est écrit.
 */
export type EtatRetourPack = "aucun" | "octroye" | "en_attente" | "non_confirme";

// Les statuts où le paiement peut encore aboutir sans nouvelle action du lecteur sur notre page.
const EN_COURS = new Set(["processing", "requires_action", "requires_confirmation", "requires_capture"]);

export async function traiterRetourPaiementPack(
  deps: {
    lirePaiement: (id: string) => Promise<PaiementStripe>;
    admin: SupabaseClient;
  },
  paymentIntentId: string | undefined,
  compte: { id: string; email?: string | null },
): Promise<EtatRetourPack> {
  if (typeof paymentIntentId !== "string" || !/^pi_[A-Za-z0-9]{8,64}$/.test(paymentIntentId)) return "aucun";

  let paiement: PaiementStripe;
  try {
    paiement = await deps.lirePaiement(paymentIntentId);
  } catch {
    // Identifiant inconnu de Stripe, falsifié, ou Stripe injoignable : aucune preuve, aucune écriture.
    return "non_confirme";
  }
  if (paiement.id !== paymentIntentId) return "non_confirme";
  if (EN_COURS.has(paiement.status)) return "en_attente";
  if (paiement.status !== "succeeded") return "non_confirme";

  try {
    const octroi = await grantDecisionPackFromSnapshot(deps.admin, paiement, {
      attendu: compte.id,
      email: compte.email ?? undefined,
    });
    if (octroi.ok) return "octroye";
    console.error("[pack-decision] retour refusé", { pi: paymentIntentId, motif: octroi.motif });
    return "non_confirme";
  } catch (error) {
    // Paiement confirmé mais base indisponible : on n'affiche pas un échec à quelqu'un qui a payé. Le webhook
    // rejoue l'octroi jusqu'à réussite ; la page attend.
    console.error("[pack-decision] octroi momentanément impossible", { pi: paymentIntentId, error });
    return "en_attente";
  }
}

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA TRACE DES MESSAGES TRANSACTIONNELS.
//
// Le défaut qu'elle ferme : à la première vente réelle, le message de confirmation n'est jamais
// arrivé et le produit ne pouvait pas dire pourquoi. Le SDK Resend ne lève jamais, le webhook
// ignorait son retour, et un refus disparaissait pendant que Stripe recevait un 200. Journaliser
// l'échec (correctif du 13/08) rend le défaut visible ; ça ne le rend ni requêtable, ni rattrapable.
//
// RÈGLE ABSOLUE DE CE MODULE : il ne fait jamais échouer ce qu'il observe. Une panne de la table de
// trace ne doit pas empêcher un e-mail de partir, ni faire répondre 500 à Stripe, ce qui
// déclencherait des rejeux pour une raison qui n'a rien à voir avec l'achat. Toutes les erreurs
// sont avalées ici, après avoir été journalisées.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type EmailKind = "dossier" | "pack" | "territoire" | "facture_renvoi";

/** Ouvre la ligne AVANT l'appel au fournisseur : une ligne restée `pending` dit qu'une fonction a
 *  été interrompue en plein vol, ce qu'aucun journal ne montrait. Rend l'id, ou `null` si la trace
 *  n'a pas pu être ouverte (l'envoi, lui, continue). */
export async function ouvrirEnvoi(
  supabase: SupabaseClient,
  entree: { paymentIntentId: string | null; kind: EmailKind; toEmail: string },
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("email_deliveries")
      .insert({
        stripe_payment_intent_id: entree.paymentIntentId,
        kind: entree.kind,
        to_email: entree.toEmail,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      console.error("[email-log] ouverture impossible", { ...entree, error });
      return null;
    }
    return (data as { id: string }).id;
  } catch (error) {
    console.error("[email-log] ouverture impossible", { ...entree, error });
    return null;
  }
}

/** Ferme la ligne avec ce que le fournisseur a répondu. `sent` veut dire « Resend a accepté »,
 *  jamais « le destinataire l'a reçu » : la livraison réelle viendra des webhooks Resend. */
export async function fermerEnvoi(
  supabase: SupabaseClient,
  id: string | null,
  resultat: { providerId?: string | null; erreur?: string | null },
): Promise<void> {
  if (!id) return;
  try {
    const { error } = await supabase
      .from("email_deliveries")
      .update({
        status: resultat.erreur ? "failed" : "sent",
        provider_id: resultat.providerId ?? null,
        error: resultat.erreur ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) console.error("[email-log] fermeture impossible", { id, error });
  } catch (error) {
    console.error("[email-log] fermeture impossible", { id, error });
  }
}

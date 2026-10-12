import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { contexteDAchat, type ContexteDAchat } from "@/lib/contexte-livraison";

// ════════════════════════════════════════════════════════════════════════════════════════════
// RETROUVER CE QUE L'ACHAT D'UN DOSSIER A FIXÉ (FUT-10, dernière revue).
//
// Le chemin : `address_dossiers.stripe_payment_intent_id` → `dossier_intents` (même PaymentIntent, même
// compte). Les colonnes ACHETÉES vivent dans l'intention, verrouillée à la confirmation ; celles du
// dossier (`place_relation`, `place_objective`) restent MODIFIABLES par le lecteur. On ne les confond pas.
//
// `dossier_intents` n'a aucune policy : la lecture se fait en service role, ici seulement, filtrée par
// le compte qui lit. Un dossier sans PaymentIntent (ouvert par l'administration) ou une intention
// antérieure à FUT-10 donnent `historique`.
//
// Une panne rend `null` : l'appelant ne génère alors RIEN (il ne doit pas deviner le contexte de la
// vente), et sert une lecture provisoire.
// ════════════════════════════════════════════════════════════════════════════════════════════

let admin: SupabaseClient | null = null;
function client(): SupabaseClient {
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return admin;
}

export type AchatDuDossier = { contexte: ContexteDAchat; acheteLe: string | null };

/**
 * Jamais `null`, jamais une exception : une panne de lecture rend `indisponible / lecture_impossible`,
 * que les appelants traitent comme une intention introuvable (aucune version figée, lecture dite
 * provisoire et incertaine). Les anomalies sont journalisées SANS donnée personnelle.
 */
export async function lireContexteDAchat(
  userId: string, dossierId: string, sb: SupabaseClient = client(),
): Promise<AchatDuDossier> {
  const indisponible = (raison: "lecture_impossible" | "intention_introuvable", acheteLe: string | null = null): AchatDuDossier =>
    ({ contexte: { etat: "indisponible", raison }, acheteLe });
  const { data: dossier, error: e1 } = await sb
    .from("address_dossiers")
    .select("stripe_payment_intent_id, purchased_at")
    .eq("id", dossierId).eq("user_id", userId)
    .maybeSingle();
  if (e1) {
    console.error("[contexte-achat] lecture du dossier impossible", { dossierId, erreur: e1.message });
    return indisponible("lecture_impossible");
  }
  const d = dossier as { stripe_payment_intent_id?: string | null; purchased_at?: string | null } | null;
  const acheteLe = d?.purchased_at ?? null;
  // Sans PaymentIntent : un dossier ouvert par l'administration, la seule compatibilité sans intention.
  if (!d?.stripe_payment_intent_id) return { contexte: contexteDAchat(null, { aUnPaiement: false }), acheteLe };

  // `*` : une base sans la migration 37 ne doit pas faire échouer la lecture (intention historique).
  const { data: intent, error: e2 } = await sb
    .from("dossier_intents")
    .select("*")
    .eq("stripe_payment_intent_id", d.stripe_payment_intent_id).eq("user_id", userId)
    .maybeSingle();
  if (e2) {
    console.error("[contexte-achat] lecture de l'intention impossible", { dossierId, erreur: e2.message });
    return indisponible("lecture_impossible", acheteLe);
  }
  const contexte = contexteDAchat(intent as Record<string, unknown> | null, { aUnPaiement: true });
  if (contexte.etat === "indisponible") {
    // UNE ANOMALIE À RÉCONCILIER : un dossier payé dont l'intention manque (ou dont le projet confirmé
    // ne se relit plus). Cf. `dossiers_sans_intention()` (migration 38).
    console.error("[contexte-achat] contexte d'achat indisponible", { dossierId, raison: contexte.raison });
  }
  return { contexte, acheteLe };
}

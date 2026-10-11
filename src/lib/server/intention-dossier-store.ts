import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoreIntentions } from "@/lib/verrou-intention-dossier";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE STOCKAGE RÉEL DES INTENTIONS DE DOSSIER (FUT-10), en service role : `dossier_intents` n'a aucune
// policy, seul le serveur y lit et écrit. Chaque méthode est UNE instruction SQL, dont la condition
// porte le verrou (cf. `verrou-intention-dossier.ts`). Une panne LÈVE : elle ne doit jamais passer pour
// un verrou ou pour une intention introuvable.
// ════════════════════════════════════════════════════════════════════════════════════════════

let admin: SupabaseClient | null = null;
function client(): SupabaseClient {
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return admin;
}

function echec(quoi: string, error: { message: string } | null): never {
  // Le message de Postgres, jamais la ligne : elle porterait l'adresse et le projet.
  throw new Error(`[dossier_intents] ${quoi} : ${error?.message ?? "échec"}`);
}

export function storeIntentionsSupabase(sb: SupabaseClient = client()): StoreIntentions {
  return {
    async insererSiAbsente(ligne) {
      const { data, error } = await sb.from("dossier_intents")
        .upsert(ligne, { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true })
        .select("stripe_payment_intent_id");
      if (error) echec("insertion", error);
      return (data?.length ?? 0) > 0;
    },
    async mettreAJourSiOuverte(pi, userId, champs) {
      const { data, error } = await sb.from("dossier_intents")
        .update(champs)
        .eq("stripe_payment_intent_id", pi)
        .eq("user_id", userId)
        .is("context_locked_at", null)
        .select("stripe_payment_intent_id");
      if (error) echec("mise à jour", error);
      return (data?.length ?? 0) > 0;
    },
    async verrouillerSiOuverte(pi, userId, maintenant) {
      let q = sb.from("dossier_intents")
        .update({ context_locked_at: maintenant })
        .eq("stripe_payment_intent_id", pi)
        .is("context_locked_at", null);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.select("stripe_payment_intent_id");
      if (error) echec("verrouillage", error);
      return (data?.length ?? 0) > 0;
    },
    async lire(pi, userId) {
      let q = sb.from("dossier_intents").select("context_locked_at").eq("stripe_payment_intent_id", pi);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.maybeSingle();
      if (error) echec("lecture", error);
      return (data as { context_locked_at: string | null } | null) ?? null;
    },
  };
}

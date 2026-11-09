import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { communeParent } from "@/lib/plm";
import { lireLigneRetour, type LigneRetourUtilite, type RetourEnregistre } from "@/lib/retour-utilite";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE STOCKAGE DU RETOUR D'UTILITÉ (FUT-94, migration 39).
//
// LECTURE sous l'identité du lecteur (RLS : ses seules lignes). ÉCRITURE avec le service role, et
// SEULEMENT ici : `authenticated` n'a aucun privilège d'écriture sur la table. La route vérifie le
// droit sur le dossier avant d'appeler `ecrireRetourUtilite` (`lib/retour-utilite.ts`), et ce module
// ne rend jamais le client service role à l'appelant (patron de `address-dossier-write.ts`).
// ════════════════════════════════════════════════════════════════════════════════════════════

const TABLE = "dossier_utility_feedback";

/**
 * Le retour en vigueur du lecteur sur ce dossier, ou `null` s'il n'a pas répondu.
 * LÈVE en cas d'erreur (table absente tant que la migration n'est pas appliquée, panne) : la page
 * cache alors la question, plutôt que de la reposer à quelqu'un qui a peut-être déjà répondu.
 */
export async function lireRetourUtilite(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string,
): Promise<RetourEnregistre | null> {
  const res = await sb
    .from(TABLE)
    .select("answer, comment")
    .eq("user_id", userId)
    .eq("insee_code", communeParent(insee))
    .eq("scope_key", scopeKey)
    .maybeSingle();
  if (res.error) throw res.error;
  return res.data ? lireLigneRetour(res.data) : null;
}

let admin: SupabaseClient | null = null;
function client(): SupabaseClient {
  admin ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return admin;
}

/**
 * Upsert sur la contrainte d'unicité (user_id, insee_code, scope_key). PostgREST ne met à jour que
 * les colonnes ENVOYÉES : `created_at` (première réponse) n'est jamais réécrit, et le commentaire
 * n'est touché que si la ligne le porte. Rend la ligne en vigueur, ou `null` en cas d'échec.
 */
export async function ecrireRetourUtilite(ligne: LigneRetourUtilite): Promise<RetourEnregistre | null> {
  const res = await client()
    .from(TABLE)
    .upsert(ligne, { onConflict: "user_id,insee_code,scope_key" })
    .select("answer, comment")
    .single();
  if (res.error) {
    console.error("[retour-utilite] écriture échouée", { code: res.error.code, scope: ligne.scope_key });
    return null;
  }
  return lireLigneRetour(res.data);
}

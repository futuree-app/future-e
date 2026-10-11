import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoreIntentions } from "@/lib/verrou-intention-dossier";
import { storeIntentionsSur } from "@/lib/intention-dossier-store-supabase";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE STOCKAGE RÉEL DES INTENTIONS DE DOSSIER (FUT-10), en service role : `dossier_intents` n'a aucune
// policy, seul le serveur y lit et écrit. Les instructions vivent dans `intention-dossier-store-supabase.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════

let admin: SupabaseClient | null = null;
function client(): SupabaseClient {
  admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return admin;
}

export function storeIntentionsSupabase(sb: SupabaseClient = client()): StoreIntentions {
  return storeIntentionsSur(sb);
}

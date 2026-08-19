import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { AddressDossierRow } from "@/lib/address-dossier-store";

// ════════════════════════════════════════════════════════════════════════════
// LE SEUL chemin d'écriture d'un dossier. `authenticated` n'a plus aucun privilège
// d'écriture sur la table (migration 25) : sans ce module, rien ne s'écrit.
//
// Il ne REND JAMAIS le client service role à l'appelant. Une fonction qui vérifie la
// propriété du dossier A puis remet un client tout-puissant laisse une route future
// écrire le dossier B par erreur. La clause de propriété vit ici ; elle n'est pas une
// convention à répéter dans chaque route.
// ════════════════════════════════════════════════════════════════════════════

// Type FERMÉ sur les seules colonnes d'artefact. Ni id, ni user_id, ni ban_id, ni insee, ni
// aucune colonne de provenance ou de révocation : ce sont elles qui portent le droit.
export type AddressDossierPatch = Partial<
  Pick<
    AddressDossierRow,
    | "posture"
    | "snapshot"
    | "dpe_selection_status"
    | "selected_dpe_id"
    | "selected_dpe_snapshot"
    | "selected_dpe_at"
    | "dpe_selection_at"
    | "synthesis_text"
    | "synthesis_fact_hash"
    | "synthesis_generated_at"
  >
>;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// Retourne la ligne mise à jour, ou null si le dossier n'existe pas, ne lui appartient pas, ou a
// été révoqué. Un null est un REFUS, jamais un succès silencieux : l'ancienne `saveSynthesis`
// faisait un UPDATE ciblé qui devenait un no-op quand la ligne manquait, donc perdait le texte
// sans lever la moindre erreur.
//
// Une panne, elle, lève : elle ne doit pas se présenter comme un refus de droit.
export async function updateOwnedAddressDossier(
  userId: string,
  dossierId: string,
  patch: AddressDossierPatch,
): Promise<AddressDossierRow | null> {
  const { data, error } = await admin
    .from("address_dossiers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", dossierId)
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`address_dossiers update a échoué : ${error.message}`);
  }

  return (data as AddressDossierRow) ?? null;
}

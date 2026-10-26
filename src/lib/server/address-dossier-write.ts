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
    | "place_relation"
    | "place_relation_set_at"
    | "place_objective"
    | "place_objective_set_at"
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

/**
 * UNE ÉCRITURE QUI N'A LIEU QUE SI LA LIGNE EST ENCORE DANS L'ÉTAT ATTENDU (revue indépendante du
 * 26/10/2026).
 *
 * Une attribution automatique se décide en relisant l'ADEME et le référentiel, plusieurs centaines de
 * millisecondes pendant lesquelles le lecteur peut refuser, retirer ou choisir. L'écriture inconditionnelle
 * qui suivait réécrivait `auto_confirmed` PAR-DESSUS ce geste plus récent (reproduit : `not_in_list` puis
 * `auto_confirmed` en base). Lire l'état avant d'écrire ne suffit pas : le geste peut arriver entre la
 * lecture et l'écriture.
 *
 * La précondition est donc portée par L'UPDATE LUI-MÊME (`… WHERE id = … AND user_id = … AND
 * access_revoked_at IS NULL AND <condition>`). Postgres verrouille la ligne et réévalue le WHERE sur sa
 * version la plus récente (READ COMMITTED) : de deux écritures concurrentes, celle dont la condition ne tient
 * plus ne touche à rien. Aucune migration : seule la requête change.
 *
 * Rend la ligne écrite, `"etat_change"` si le dossier est accessible mais ne remplit plus la condition, ou
 * `null` s'il n'existe pas, n'appartient pas à l'utilisateur ou a été révoqué.
 */
export async function updateOwnedAddressDossierSi(
  userId: string,
  dossierId: string,
  patch: AddressDossierPatch,
  condition: { egal?: Readonly<Record<string, string>>; nul?: readonly string[] },
): Promise<AddressDossierRow | "etat_change" | null> {
  let requete = admin
    .from("address_dossiers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", dossierId)
    .eq("user_id", userId)
    .is("access_revoked_at", null);
  for (const [colonne, valeur] of Object.entries(condition.egal ?? {})) requete = requete.eq(colonne, valeur);
  for (const colonne of condition.nul ?? []) requete = requete.is(colonne, null);
  const { data, error } = await requete.select("*").maybeSingle();
  if (error) {
    throw new Error(`address_dossiers update conditionnel a échoué : ${error.message}`);
  }
  if (data) return data as AddressDossierRow;

  // Rien n'a été écrit. Le dire juste : un droit absent n'est pas un geste plus récent.
  const { data: existe, error: errLecture } = await admin
    .from("address_dossiers")
    .select("id")
    .eq("id", dossierId)
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .maybeSingle();
  if (errLecture) {
    throw new Error(`address_dossiers relecture a échoué : ${errLecture.message}`);
  }
  return existe ? "etat_change" : null;
}

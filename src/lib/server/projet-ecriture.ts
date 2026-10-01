import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProject } from "@/lib/user-project";

// ÉCRIRE LE PROJET SEULEMENT S'IL N'A PAS CHANGÉ DEPUIS SA LECTURE (FUT-8).
//
// Le Projet a désormais plusieurs écrivains : l'édition du texte, les gestes du lecteur (préciser,
// confirmer, adopter), la reprise d'une recherche. Chacun relit le Projet, calcule, puis écrit. Sans
// garde, deux écritures rapprochées s'écrasent (un geste perdu derrière un enregistrement du texte). La
// garde est SQL : l'écriture ne passe que si `updatedAt` est encore celui qu'on a lu (ou si le Projet
// est toujours absent). Sinon : `conflit`, et l'appelant répond 409 pour que le client recharge.
export type ResultatEcriture = "ecrit" | "conflit" | "erreur";

export async function ecrireProjetSiInchange(
  supabase: SupabaseClient, userId: string, project: UserProject,
  lu: { existe: boolean; updatedAt: string | null },
): Promise<ResultatEcriture> {
  let q = supabase
    .from("user_profiles")
    .update({ user_project: project, updated_at: project.updatedAt ?? new Date().toISOString() })
    .eq("user_id", userId);
  if (!lu.existe) q = q.is("user_project", null);
  else if (lu.updatedAt == null) q = q.is("user_project->>updatedAt", null);
  else q = q.filter("user_project->>updatedAt", "eq", lu.updatedAt);
  const { data, error } = await q.select("user_id").maybeSingle();
  if (error) {
    console.error("[projet] écriture conditionnelle :", error);
    return "erreur";
  }
  return data ? "ecrit" : "conflit";
}

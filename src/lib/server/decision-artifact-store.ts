import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseDecisionArtifact, type DecisionArtifactV1,
} from "@/lib/decision/decision-artifact";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ACCÈS À L'ARTEFACT DE DÉCISION. Aucune règle métier ici : la génération vit chez l'appelant,
// ce module ne fait qu'écrire, relire et refuser.
//
// Le patron est celui de `decision-narrative-store` : le JSON de la base est VALIDÉ, jamais casté,
// et un artefact écrit sous un contrat antérieur est IGNORÉ plutôt que de faire tomber le rendu.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type ArtifactStatus = "generating" | "ready" | "failed";

export type StoredArtifact = {
  version: number;
  status: ArtifactStatus;
  generatedAt: string | null;
  /** Nul quand le statut n'est pas `ready`, ou quand le contenu ne se relit pas. */
  artifact: DecisionArtifactV1 | null;
};

/**
 * LA DERNIÈRE VERSION D'UN SCOPE, quel que soit son statut.
 *
 * On rend aussi les `generating` et les `failed`, et c'est délibéré : l'appelant doit pouvoir
 * distinguer « ce dossier n'a jamais eu d'artefact » de « sa génération a échoué », qui n'appellent
 * pas la même suite. Le second est retentable, le premier concerne un dossier antérieur au lot.
 */
export async function readLatestArtifact(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string,
): Promise<StoredArtifact | null> {
  const { data, error } = await sb
    .from("decision_artifact")
    .select("version, status, generated_at, payload")
    .eq("user_id", userId).eq("insee_code", insee).eq("scope_key", scopeKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    version: data.version as number,
    status: data.status as ArtifactStatus,
    generatedAt: (data.generated_at as string | null) ?? null,
    // UN PAYLOAD ILLISIBLE N'EST PAS UNE ERREUR, c'est un artefact d'un autre contrat. Il rend
    // `null`, l'appelant retombe sur l'assemblage vivant, et le lecteur voit un dossier plutôt
    // qu'une page en échec.
    artifact: data.status === "ready" ? parseDecisionArtifact(data.payload) : null,
  };
}

/**
 * RÉSERVE la place d'un artefact, sans son contenu.
 *
 * L'IDEMPOTENCE VIENT DE LA CONTRAINTE UNIQUE, pas d'un test applicatif : un webhook Stripe rejoué
 * ou deux appels concurrents ne peuvent pas créer deux lignes pour la même version. Rend `false`
 * quand la place est déjà prise, ce qui dit à l'appelant de ne PAS générer.
 */
export async function claimArtifactSlot(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, version = 1,
): Promise<boolean> {
  const { error } = await sb
    .from("decision_artifact")
    .insert({
      user_id: userId, insee_code: insee, scope_key: scopeKey, version, status: "generating",
    });
  if (!error) return true;
  // 23505 : violation de contrainte unique. C'est le cas NORMAL d'un rejeu, pas une panne.
  if ((error as { code?: string }).code === "23505") return false;
  throw error;
}

/** Le contenu arrive. Une version PRÊTE ne se réécrit jamais ensuite : la suivante sera une v2. */
export async function completeArtifact(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string,
  artifact: DecisionArtifactV1, version = 1,
): Promise<void> {
  const { error } = await sb
    .from("decision_artifact")
    .update({
      status: "ready",
      payload: artifact,
      schema_version: artifact.schemaVersion,
      engine_version: artifact.engineVersion,
      generated_at: artifact.generatedAt,
    })
    .eq("user_id", userId).eq("insee_code", insee)
    .eq("scope_key", scopeKey).eq("version", version);
  if (error) throw error;
}

/**
 * LA GÉNÉRATION A ÉCHOUÉ, ET LE DROIT RESTE OUVERT.
 *
 * On marque plutôt que de supprimer : une ligne effacée serait indistinguable d'un dossier
 * antérieur au lot, et personne ne saurait qu'il y a eu une tentative. Surtout, on n'écrit JAMAIS
 * un dossier de repli comme artefact : si l'augmentation Adresse a échoué, le dossier communal qui
 * s'affiche à l'écran est un repli acceptable, il ne doit pas devenir la version définitive d'un
 * dossier d'adresse payé.
 */
export async function failArtifact(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, version = 1,
): Promise<void> {
  const { error } = await sb
    .from("decision_artifact")
    .update({ status: "failed" })
    .eq("user_id", userId).eq("insee_code", insee)
    .eq("scope_key", scopeKey).eq("version", version);
  if (error) throw error;
}

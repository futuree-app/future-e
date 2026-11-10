import type { SupabaseClient } from "@supabase/supabase-js";
import type { DecisionArtifactV1 } from "./decision-artifact";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES TROIS ÉCRITURES DE L'ARTEFACT DE DÉCISION (FUT-173), sur le client qu'on leur donne.
//
// Elles vivent hors de `server/` pour être testables (`node --test`, et contre un vrai Postgres dans
// scripts/integration/fut173-decision-artifact-postgres.mjs). En production, le SEUL appelant est
// `server/decision-artifact-store.ts`, qui leur passe le client service role : depuis la migration
// 40, `authenticated` n'a plus aucun droit d'écriture sur la table.
//
// LA BASE EST LA GARDE, CE CODE EST LE BON CITOYEN. Le trigger de la migration 40 refuse toute
// transition autre que `generating → ready | failed`. Le filtre `status = generating` ci-dessous ne
// le remplace pas : il fait qu'une écriture serveur légitime ne tente même pas de toucher une version
// terminale. Et une écriture qui ne trouve AUCUNE ligne LÈVE : un UPDATE à zéro ligne n'est pas un
// succès, c'est une place qu'on n'a pas, ou qu'un autre a déjà terminée.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Une écriture qui n'a trouvé aucune place `generating` à terminer. */
export class AucunePlaceEnCours extends Error {
  constructor(quoi: "ready" | "failed", version: number) {
    super(`decision_artifact : aucune version ${version} « generating » à passer en « ${quoi} »`);
    this.name = "AucunePlaceEnCours";
  }
}

/** Réserve la place (`generating`, vide). `false` = déjà prise (23505), le cas normal d'un rejeu. */
export async function reserverPlace(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, version: number,
): Promise<boolean> {
  const { error } = await sb
    .from("decision_artifact")
    .insert({ user_id: userId, insee_code: insee, scope_key: scopeKey, version, status: "generating" });
  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false;
  throw error;
}

async function terminer(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, version: number,
  quoi: "ready" | "failed", champs: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await sb
    .from("decision_artifact")
    .update(champs)
    .eq("user_id", userId).eq("insee_code", insee)
    .eq("scope_key", scopeKey).eq("version", version)
    .eq("status", "generating")
    .select("version");
  if (error) throw error;
  if (!data || data.length !== 1) throw new AucunePlaceEnCours(quoi, version);
}

/** `generating → ready`. Lève si la place n'est pas (ou plus) en cours. */
export function figerVersion(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string,
  artifact: DecisionArtifactV1, version: number,
): Promise<void> {
  return terminer(sb, userId, insee, scopeKey, version, "ready", {
    status: "ready",
    payload: artifact,
    schema_version: artifact.schemaVersion,
    engine_version: artifact.engineVersion,
    generated_at: artifact.generatedAt,
  });
}

/** `generating → failed`. Lève si la place n'est pas (ou plus) en cours : une version prête reste prête. */
export function marquerEchec(
  sb: SupabaseClient, userId: string, insee: string, scopeKey: string, version: number,
): Promise<void> {
  return terminer(sb, userId, insee, scopeKey, version, "failed", { status: "failed" });
}

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════
// Contexte de lecture d'un rapport : la RELATION du lecteur à une commune.
//
// Inférée par défaut depuis le territoire (résidence vs commune explorée), et
// éventuellement CORRIGÉE par l'utilisateur (relation_source = confirmed_by_user).
// La correction prime toujours sur l'inférence. Persistée dans report_context,
// keyée (user_id, insee) — voir supabase/16_report_context.sql.
//
// La relation détermine la POSTURE de la synthèse, jamais les faits, et le
// garde-fou anti-contamination (les observations vécues ne servent que pour la
// résidence).
// ════════════════════════════════════════════════════════════════════════════

export type Relation =
  | "current_residence"
  | "considering_living"
  | "information_only"
  | "unknown";

export type RelationSource = "inferred" | "confirmed_by_user";

export type ReportContextRow = {
  insee: string;
  relation: Relation;
  relation_source: RelationSource;
  journey: string | null;
  discovery_workbook: unknown | null;
};

const RELATIONS: readonly Relation[] = [
  "current_residence",
  "considering_living",
  "information_only",
  "unknown",
];

export function isRelation(v: unknown): v is Relation {
  return typeof v === "string" && (RELATIONS as readonly string[]).includes(v);
}

// Lit le contexte stocké pour (user, insee). null si aucune ligne.
export async function getReportContext(
  supabase: SupabaseClient,
  userId: string,
  insee: string,
): Promise<ReportContextRow | null> {
  const { data, error } = await supabase
    .from("report_context")
    .select("insee, relation, relation_source, journey, discovery_workbook")
    .eq("user_id", userId)
    .eq("insee", insee)
    .maybeSingle();
  if (error) {
    console.error("[report-context] read error:", error.message);
    return null;
  }
  return (data as ReportContextRow | null) ?? null;
}

// Relation EFFECTIVE : la correction utilisateur prime ; sinon on infère depuis
// le territoire (résidence → current_residence, commune explorée → découverte).
export function resolveRelation(
  isResidence: boolean,
  stored: ReportContextRow | null,
): { relation: Relation; source: RelationSource } {
  if (stored && stored.relation_source === "confirmed_by_user" && isRelation(stored.relation)) {
    return { relation: stored.relation, source: "confirmed_by_user" };
  }
  return {
    relation: isResidence ? "current_residence" : "considering_living",
    source: "inferred",
  };
}

// Parse le workbook découverte stocké (jsonb libre) vers la forme typée attendue
// par l'UI. null si vide ou absent.
export function parseDiscoveryWorkbook(
  raw: unknown,
): { priority: string; concern: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const priority = typeof r.priority === "string" ? r.priority : "";
  const concern = typeof r.concern === "string" ? r.concern : "";
  if (!priority && !concern) return null;
  return { priority, concern };
}

// Posture transmise à la synthèse. Aujourd'hui binaire : seule la résidence
// mobilise le vécu ; tout le reste (découverte / information / inconnu) adopte la
// posture « quelqu'un qui pèse une arrivée ».
export function synthesisRelation(
  relation: Relation,
): "current_residence" | "considering_living" {
  return relation === "current_residence" ? "current_residence" : "considering_living";
}

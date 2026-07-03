import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, type LngLat } from "./geo-distance.ts";
import type { Posture, Face3Snapshot } from "./logement-autour-types.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SOURCES_VERSION = "face3-2026-07-03c"; // bump = invalidation de tous les snapshots (c : nature de l'espace vert / greenKind dans le snapshot)

// Projection persistée de l'état runtime du choix DPE (cf. spec §6). `pending` tant que rien
// de définitif ; les deux statuts « confirmés » figent un DPE daté.
export type DpeSelectionStatus =
  | "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";

export type LogementRow = {
  user_id: string;
  insee: string;
  address_label: string;
  latitude: number;
  longitude: number;
  parcel_code: string | null;
  posture: Posture;
  snapshot: Face3Snapshot | null;
  dpe_selection_status: DpeSelectionStatus;
  selected_dpe_id: string | null;
  selected_dpe_snapshot: DpeRecord | null;
  selected_dpe_at: string | null;
  updated_at: string;
};

// Projette l'état runtime du choix DPE vers les colonnes persistées. Ne fige un DPE (id +
// snapshot daté) que pour un choix effectif (auto_confirmed / user_confirmed).
export function buildDpeSelectionFields(
  status: DpeSelectionStatus,
  dpe: DpeRecord | null,
  nowIso: string,
): Pick<LogementRow, "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at"> {
  const keep = status === "auto_confirmed" || status === "user_confirmed";
  return {
    dpe_selection_status: status,
    selected_dpe_id: keep ? (dpe?.id_dpe ?? null) : null,
    selected_dpe_snapshot: keep ? dpe : null,
    selected_dpe_at: keep ? nowIso : null,
  };
}

export function needsRecompute(
  row: { snapshot: Face3Snapshot | null } | null,
  center: LngLat,
  sourcesVersion: string,
): boolean {
  const s = row?.snapshot;
  if (!s) return true;
  if (s.sourcesVersion !== sourcesVersion) return true;
  // même position à ~10 m près (le géocodage a pu bouger)
  return haversineM(center, s.center) > 10;
}

export async function getLogement(
  sb: SupabaseClient,
  userId: string,
  insee: string,
): Promise<LogementRow | null> {
  const { data } = await sb
    .from("logement")
    .select("*")
    .eq("user_id", userId)
    .eq("insee", insee)
    .maybeSingle();
  return (data as LogementRow) ?? null;
}

// Les champs de sélection DPE sont OPTIONNELS : la BD porte des défauts et l'upsert ne met à
// jour que les colonnes fournies (sur conflit, il ne clobbe pas un choix DPE déjà persisté).
// La route « autour » upserte le snapshot sans toucher au DPE ; l'endpoint DPE ne touche qu'à lui.
type DpeSelectionFields =
  "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at";

export async function upsertLogement(
  sb: SupabaseClient,
  row: Omit<LogementRow, "updated_at" | DpeSelectionFields>
    & Partial<Pick<LogementRow, DpeSelectionFields>>,
): Promise<void> {
  await sb
    .from("logement")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id,insee" });
}

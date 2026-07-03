import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, type LngLat } from "./geo-distance.ts";
import type { Posture, Face3Snapshot } from "./logement-autour-types.ts";

export const SOURCES_VERSION = "face3-2026-07-03"; // bump = invalidation de tous les snapshots

export type LogementRow = {
  user_id: string;
  insee: string;
  address_label: string;
  latitude: number;
  longitude: number;
  parcel_code: string | null;
  posture: Posture;
  snapshot: Face3Snapshot | null;
  updated_at: string;
};

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

export async function upsertLogement(
  sb: SupabaseClient,
  row: Omit<LogementRow, "updated_at">,
): Promise<void> {
  await sb
    .from("logement")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id,insee" });
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, type LngLat } from "./geo-distance.ts";
import type { Posture, Face3Snapshot } from "./logement-autour-types.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SOURCES_VERSION = "face3-2026-07-08d"; // bump = invalidation de tous les snapshots (d : ajout du signal îlot de chaleur urbain / icu au snapshot)

// Projection persistée de l'état runtime du choix DPE (cf. spec §6). `pending` tant que rien
// de définitif ; les deux statuts « confirmés » figent un DPE daté.
export type DpeSelectionStatus =
  | "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";

export type LogementRow = {
  user_id: string;
  // Clé de l'artefact = l'ADRESSE (identifiant BAN), pas la commune (re-key migration 21).
  // insee reste une colonne (lecture par commune : analytics, futur comparateur de biens).
  logement_id: string;
  insee: string;
  address_label: string;
  // city + postcode : nécessaires à la REHYDRATATION (re-fetch Géorisques via une adresse
  // validée par `validateSelectedBanAddress`, qui les exige). Nullables (lignes de test
  // antérieures ; une rehydratation sans eux retombe sur la saisie). Migration 22.
  city: string | null;
  postcode: string | null;
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
  synthesis_text: string | null;
  synthesis_fact_hash: string | null;
  synthesis_generated_at: string | null;
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
  logementId: string,
): Promise<LogementRow | null> {
  const { data } = await sb
    .from("logement")
    .select("*")
    .eq("user_id", userId)
    .eq("logement_id", logementId)
    .maybeSingle();
  return (data as LogementRow) ?? null;
}

// Dernier logement analysé par l'utilisateur, pour la REHYDRATATION par défaut (retour sur la
// page sans `?logementId=`). Tri par `updated_at` : n'importe quelle écriture (autour, DPE,
// synthèse) rafraîchit la ligne, donc le « dernier touché » = le bien qu'on regardait.
export async function getLatestLogement(
  sb: SupabaseClient,
  userId: string,
): Promise<LogementRow | null> {
  const { data } = await sb
    .from("logement")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LogementRow) ?? null;
}

// Les champs de sélection DPE sont OPTIONNELS : la BD porte des défauts et l'upsert ne met à
// jour que les colonnes fournies (sur conflit, il ne clobbe pas un choix DPE déjà persisté).
// La route « autour » upserte le snapshot sans toucher au DPE ; l'endpoint DPE ne touche qu'à lui.
type DpeSelectionFields =
  "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at";

// Champs écrits par d'autres chemins (endpoint DPE, synthèse), optionnels à l'upsert « autour ».
type OptionalUpsertFields = DpeSelectionFields | "synthesis_text" | "synthesis_fact_hash" | "synthesis_generated_at";

export async function upsertLogement(
  sb: SupabaseClient,
  row: Omit<LogementRow, "updated_at" | OptionalUpsertFields>
    & Partial<Pick<LogementRow, OptionalUpsertFields>>,
): Promise<void> {
  await sb
    .from("logement")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id,logement_id" });
}

// Écrit uniquement les colonnes de synthèse sur la ligne (user, logement_id) existante. UPDATE
// ciblé (pas upsert) : si la ligne n'existe pas encore (course avec la création par « autour »),
// c'est un no-op silencieux, toléré (le client affiche quand même la synthèse ce tour-là).
// Limitation V1 assumée, alignée sur la course DPE déjà documentée.
export async function saveSynthesis(
  sb: SupabaseClient,
  userId: string,
  logementId: string,
  fields: { synthesis_text: string; synthesis_fact_hash: string; synthesis_generated_at: string },
): Promise<void> {
  await sb
    .from("logement")
    .update(fields)
    .eq("user_id", userId)
    .eq("logement_id", logementId);
}

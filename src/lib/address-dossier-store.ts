import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, type LngLat } from "./geo-distance.ts";
import type { Posture, Face3Snapshot } from "./logement-autour-types.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SOURCES_VERSION = "face3-2026-07-08d"; // bump = invalidation de tous les snapshots (d : ajout du signal îlot de chaleur urbain / icu au snapshot)

// Projection persistée de l'état runtime du choix DPE (cf. spec §6). `pending` tant que rien
// de définitif ; les deux statuts « confirmés » figent un DPE daté.
export type DpeSelectionStatus =
  | "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";

export type AddressDossierRow = {
  // L'IDENTITÉ (migration 25). Stable avant le choix du DPE, quand aucun DPE n'existe, si le choix
  // est corrigé, et surtout si DEUX BIENS PARTAGENT UN BAN_ID : l'ancienne clé (user_id, ban_id)
  // écrasait l'appartement du 2e étage par celui du 4e, alors que PreciseLogementStep existe
  // précisément parce qu'une adresse BAN contient plusieurs logements.
  id: string;
  user_id: string;
  // Le point postal. Indexé, JAMAIS unique : il ne désigne pas un logement.
  ban_id: string;
  // Le code INSEE LOCAL de l'adresse (arrondissement compris pour PLM), dont dépendent les données
  // fines. Les comparaisons de droit et de prix passent par communeParent(), jamais par une
  // normalisation de cette colonne.
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
  // Date de NAISSANCE du dossier, ce que le sélecteur affiche pour distinguer deux biens d'un même
  // immeuble. updated_at bouge à chaque écriture technique (synthèse, posture, rehydratation) et
  // purchased_at est nul pour un dossier administratif : ni l'un ni l'autre ne répond à « lequel
  // ai-je ouvert en premier ? ».
  created_at: string;
  updated_at: string;
  synthesis_text: string | null;
  synthesis_fact_hash: string | null;
  synthesis_generated_at: string | null;
  // PROVENANCE, écrite par le seul service role. Documente d'où vient le droit, ne le définit
  // JAMAIS : un dossier administratif (stripe_payment_intent_id null) ouvre tout autant.
  stripe_payment_intent_id: string | null;
  amount_paid_cents: number | null;
  purchased_at: string | null;
  // Retire l'accès SANS détruire l'artefact ni la trace de la transaction. La policy SELECT porte
  // la même condition : sans elle, ce ne serait qu'une révocation d'interface.
  access_revoked_at: string | null;
};

// Projette l'état runtime du choix DPE vers les colonnes persistées. Ne fige un DPE (id +
// snapshot daté) que pour un choix effectif (auto_confirmed / user_confirmed).
export function buildDpeSelectionFields(
  status: DpeSelectionStatus,
  dpe: DpeRecord | null,
  nowIso: string,
): Pick<AddressDossierRow, "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at"> {
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

  // UN SNAPSHOT INCOMPLET N'EST PAS UN SNAPSHOT VALIDE. Overpass est interrogé sous un timeout de
  // 3,5 s ; au-delà, le snapshot est écrit avec OSM en `pending` et le remplissage du cache de
  // tuile se poursuit en tâche de fond. Sans cette ligne, l'état d'attente devenait définitif : la
  // route renvoyait le snapshot figé à chaque appel, y compris quand la tuile était devenue chaude
  // une seconde plus tard, et l'écran répétait « environnement en cours de récupération » alors que
  // la donnée attendue était disponible juste à côté. Constaté en production le 29/07/2026.
  //
  // `failed` ne relance PAS, et la distinction est volontaire : `pending` dit « pas encore », donc
  // on redemande ; `failed` dit « Overpass a répondu une erreur », et le relancer à chaque ouverture
  // martèlerait une source en panne alors que l'écran sait déjà dire que la donnée est indisponible.
  if (s.sourceStatus.osmInfrastructure === "pending" || s.sourceStatus.osmGreenSpaces === "pending") {
    return true;
  }

  // même position à ~10 m près (le géocodage a pu bouger)
  return haversineM(center, s.center) > 10;
}

// ════════════════════════════════════════════════════════════════════════════
// LECTURES. Aucune écriture ne vit ici : `authenticated` n'a plus ni insert, ni update, ni delete
// sur la table (migration 25). Le seul chemin d'écriture est
// `src/lib/server/address-dossier-write.ts`.
//
// UNE PANNE N'EST PAS UN REFUS DE DROIT. Le code antérieur écrivait partout
// `const { data } = await …` puis `data ?? null` : une erreur réseau, une colonne renommée ou une
// requête invalide y devenaient silencieusement « ce dossier ne vous appartient pas ». Sur un
// produit payant, ça sert un 403 à un acheteur légitime pendant un incident. Ces fonctions lèvent.
// ════════════════════════════════════════════════════════════════════════════

function unwrap<T>(
  res: { data: T | null; error: { message: string } | null },
  what: string,
): T | null {
  if (res.error) throw new Error(`address_dossiers ${what} a échoué : ${res.error.message}`);
  return res.data;
}

// Repli par défaut quand aucun dossier n'est visé explicitement. Il ne s'applique QU'À un dossier
// unique : au-delà, le cas ambigu doit produire une question, jamais une supposition. `updated_at`
// bouge à chaque écriture technique, donc « le dernier touché » ne désigne pas « celui que je
// regardais » dès qu'il y en a deux.
export function pickSoleDossier(rows: AddressDossierRow[]): AddressDossierRow | null {
  return rows.length === 1 ? rows[0] : null;
}

export async function getDossier(
  sb: SupabaseClient,
  userId: string,
  dossierId: string,
): Promise<AddressDossierRow | null> {
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .eq("id", dossierId)
    .is("access_revoked_at", null)
    .maybeSingle();
  return unwrap(res, "getDossier") as AddressDossierRow | null;
}

// Les dossiers actifs du compte, les plus récemment créés d'abord. Alimente /rapport/dossiers.
export async function listDossiers(
  sb: SupabaseClient,
  userId: string,
): Promise<AddressDossierRow[]> {
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .order("created_at", { ascending: false });
  return (unwrap(res, "listDossiers") as AddressDossierRow[] | null) ?? [];
}

export async function getSoleDossier(
  sb: SupabaseClient,
  userId: string,
): Promise<AddressDossierRow | null> {
  // limit(2) suffit à répondre « y en a-t-il plus d'un ? » sans tout charger.
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(2);
  return pickSoleDossier((unwrap(res, "getSoleDossier") as AddressDossierRow[] | null) ?? []);
}

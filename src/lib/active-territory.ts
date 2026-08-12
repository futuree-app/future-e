import "server-only";
import { communeParent } from "./plm";
import {
  decideTerritoryAccess,
  decidePaidTerritory,
  type TerritoryClaim,
} from "./territory-claims";

import type { SupabaseClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════════════
// Territoire actif de lecture (≠ résidence).
//
// La résidence de l'utilisateur (home_insee_code / home_commune) ne change
// JAMAIS. Acheter le rapport d'un territoire exploré depuis le comparateur ne
// déplace pas son domicile. Le « territoire actif » est un overlay de lecture :
//   - active_insee_code null  → on consulte la résidence ;
//   - active_insee_code défini → on consulte ce territoire (bandeau « revenir »).
//
// Ce resolver centralise la règle pour les quelques sites de lecture (page
// rapport, modules, AskFuture). Le gating « rapport complet » ne vit PLUS au
// niveau compte : depuis l'alignement du 30/07, tout écran qui ouvre un
// territoire le demande à `canAccessTerritory`, qui répond commune par commune.
// `canAccessCompleteReport` ne subsiste que là où la question porte sur le PLAN
// sans ouvrir d'accès (l'inventaire du dashboard).
// ════════════════════════════════════════════════════════════════════════════

export type ProfileTerritoryFields = {
  home_insee_code?: string | null;
  home_commune?: string | null;
  active_insee_code?: string | null;
  active_commune?: string | null;
};

export type ActiveTerritory = {
  inseeCode: string | null;
  communeName: string | null;
  // true si on lit la résidence (pas de territoire actif distinct).
  isResidence: boolean;
  // Résidence, toujours disponible pour le bandeau « revenir à … ».
  residenceInsee: string | null;
  residenceCommune: string | null;
};

// Colonnes à sélectionner partout où l'on résout le territoire de lecture.
export const TERRITORY_SELECT =
  "home_insee_code, home_commune, active_insee_code, active_commune";

export function resolveActiveTerritory(
  profile: ProfileTerritoryFields | null | undefined,
): ActiveTerritory {
  const residenceInsee = profile?.home_insee_code ?? null;
  const residenceCommune = profile?.home_commune ?? null;
  const activeInsee = profile?.active_insee_code ?? null;
  const activeCommune = profile?.active_commune ?? null;

  // Territoire actif distinct uniquement s'il existe et diffère de la résidence.
  if (activeInsee && activeInsee !== residenceInsee) {
    return {
      inseeCode: activeInsee,
      communeName: activeCommune ?? null,
      isResidence: false,
      residenceInsee,
      residenceCommune,
    };
  }

  return {
    inseeCode: residenceInsee,
    communeName: residenceCommune,
    isResidence: true,
    residenceInsee,
    residenceCommune,
  };
}

// Territoire de lecture autorisé : QUELLE commune l'écran va lire.
//
//   - pas de territoire actif → la résidence, SANS contrôle ici ;
//   - territoire actif ≠ résidence → seulement s'il existe une revendication sur
//     cette commune (grant ou dossier). Sinon repli propre sur la résidence, avec
//     signalement du territoire refusé (deniedInsee / deniedCommune) pour l'UI.
//
// LA RÉSIDENCE N'EST PAS CONTRÔLÉE ICI, ET C'EST DÉLIBÉRÉ : cette fonction répond
// « quelle commune », pas « en a-t-il le droit ». Le droit est une seconde
// question, posée par l'écran à `canAccessTerritory`, qui vaut aussi pour la
// résidence. Les confondre a coûté cher : quand les pages demandaient encore
// l'accès au plan, un compte ayant payé Nantes lisait le Territoire COMPLET de sa
// résidence, jamais payée.
export type ReadableTerritory = ActiveTerritory & {
  // Territoire actif demandé puis refusé faute de grant. null si aucun refus.
  deniedInsee: string | null;
  deniedCommune: string | null;
};

export async function resolveReadableTerritory(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileTerritoryFields | null | undefined,
): Promise<ReadableTerritory> {
  const territory = resolveActiveTerritory(profile);

  // Résidence (ou pas de territoire actif distinct) : pas de contrôle territoire.
  if (territory.isResidence || !territory.inseeCode) {
    return { ...territory, deniedInsee: null, deniedCommune: null };
  }

  // Territoire actif distinct : exige une revendication sur cette commune. Depuis la migration 25,
  // un DOSSIER dans la commune vaut aussi droit de lecture, pas seulement un grant : quelqu'un qui
  // a payé le dossier d'une adresse marseillaise doit pouvoir lire Marseille.
  const claims = await loadTerritoryClaims(supabase, userId);

  if (decideTerritoryAccess(claims, territory.inseeCode)) {
    return { ...territory, deniedInsee: null, deniedCommune: null };
  }

  // Pas de grant : repli sur la résidence, on signale le territoire refusé.
  return {
    inseeCode: territory.residenceInsee,
    communeName: territory.residenceCommune,
    isResidence: true,
    residenceInsee: territory.residenceInsee,
    residenceCommune: territory.residenceCommune,
    deniedInsee: territory.inseeCode,
    deniedCommune: territory.communeName,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Le droit territorial, depuis la migration 25.
//
// `canAnalyzeCommune` vivait ici. Elle accordait la commune de RÉSIDENCE sans paiement, ce qui
// n'était pas un accès gratuit : elle n'était atteinte qu'après le verrou de plan global des pages
// Logement et Autour, donc elle dispensait un compte DÉJÀ payant d'un second achat. Le droit
// descendant à l'échelle du bien, elle disparaît avec le droit communal qu'elle relayait.
// ════════════════════════════════════════════════════════════════════════════

// Charge en DEUX requêtes ce qui fonde un droit territorial. Les dossiers révoqués sont exclus
// ici : ils n'atteignent jamais la décision.
export async function loadTerritoryClaims(
  supabase: SupabaseClient,
  userId: string,
): Promise<TerritoryClaim[]> {
  const [grantsRes, dossiersRes] = await Promise.all([
    supabase.from("report_grants").select("insee").eq("user_id", userId),
    supabase
      .from("address_dossiers")
      .select("insee, stripe_payment_intent_id")
      .eq("user_id", userId)
      .is("access_revoked_at", null),
  ]);

  // Les DEUX erreurs sont inspectées. Une liste vide obtenue par panne se lirait « aucun droit »,
  // donc fermerait le Territoire d'un acheteur légitime pendant l'incident.
  if (grantsRes.error) throw new Error(`report_grants a échoué : ${grantsRes.error.message}`);
  if (dossiersRes.error) {
    throw new Error(`address_dossiers a échoué : ${dossiersRes.error.message}`);
  }

  const grants = (grantsRes.data ?? []) as { insee: string }[];
  const dossiers = (dossiersRes.data ?? []) as {
    insee: string;
    stripe_payment_intent_id: string | null;
  }[];

  return [
    ...grants.map((g): TerritoryClaim => ({ kind: "grant", insee: g.insee })),
    ...dossiers.map(
      (d): TerritoryClaim => ({
        kind: "dossier",
        insee: d.insee,
        paid: d.stripe_payment_intent_id !== null,
      }),
    ),
  ];
}

// Territoire COMPLET sur cette commune : un grant, ou un dossier accessible dans cette commune.
//
// La RÉSIDENCE n'ouvre plus rien par elle-même, et ce n'est pas une régression : un compte gratuit
// voyait déjà le rapport PARTIEL de sa commune, qui reste rendu quand cette fonction dit faux.
// Le défaut réparé est l'inverse : `resolveReadableTerritory` ne contrôlait aucun grant sur la
// résidence, donc un achat quelconque ouvrait le Territoire complet d'une commune jamais achetée.
export async function canAccessTerritory(
  supabase: SupabaseClient,
  userId: string,
  insee: string | null | undefined,
): Promise<boolean> {
  if (!insee) return false;
  return decideTerritoryAccess(await loadTerritoryClaims(supabase, userId), insee);
}

// Gouverne le TARIF d'approfondissement (spec de tarification). Un dossier administratif
// (stripe_payment_intent_id nul) ouvre le territoire sans jamais valoir acquisition.
export async function hasPaidTerritory(
  supabase: SupabaseClient,
  userId: string,
  insee: string | null | undefined,
): Promise<boolean> {
  if (!insee) return false;
  return decidePaidTerritory(await loadTerritoryClaims(supabase, userId), insee);
}

/**
 * LES TERRITOIRES ACHETÉS SEULS, ceux qu'aucun bien ne porte (13/08/2026).
 *
 * Un achat de territoire (14 €) crée un `report_grant` et rien d'autre. « Mes biens » liste des
 * BIENS, le compte des communes ouvertes du hub comptait des DOSSIERS : une commune payée sans
 * adresse n'apparaissait donc nulle part, passé le jour de l'achat où le webhook pose le territoire
 * actif une fois. Le lecteur ne pouvait plus revenir sur ce qu'il avait payé.
 *
 * Les grants dont la commune porte DÉJÀ un dossier sont écartés : ils s'y liraient deux fois, et
 * c'est le bien qui est la porte la plus riche (il ouvre les trois échelles).
 *
 * Le nom vient de la colonne `commune` du grant, écrite au webhook : jamais résolu depuis l'index,
 * qui n'a pas de ligne pour les codes agrégés de Paris, Lyon et Marseille.
 */
export async function listTerritoiresSansBien(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ insee: string; commune: string | null; createdAt: string }[]> {
  const [grantsRes, dossiersRes] = await Promise.all([
    supabase
      .from("report_grants")
      .select("insee, commune, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("address_dossiers")
      .select("insee")
      .eq("user_id", userId)
      .is("access_revoked_at", null),
  ]);
  // Une panne ne doit pas se lire « vous ne possédez rien » : on remonte l'erreur, comme
  // `loadTerritoryClaims`, plutôt que de servir une liste vide qui ferait disparaître un achat.
  if (grantsRes.error) throw new Error(`report_grants a échoué : ${grantsRes.error.message}`);
  if (dossiersRes.error) throw new Error(`address_dossiers a échoué : ${dossiersRes.error.message}`);

  const avecBien = new Set(
    ((dossiersRes.data ?? []) as { insee: string }[]).map((d) => communeParent(d.insee)),
  );
  return ((grantsRes.data ?? []) as { insee: string; commune: string | null; created_at: string }[])
    .filter((g) => !avecBien.has(communeParent(g.insee)))
    .map((g) => ({ insee: g.insee, commune: g.commune, createdAt: g.created_at }));
}

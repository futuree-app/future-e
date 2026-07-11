import "server-only";
import { communeParent } from "./plm";

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
// rapport, modules, AskFuture). Le gating « rapport complet » reste au niveau
// compte (canAccessCompleteReport) en V1 ; report_grants trace les territoires
// achetés pour le futur modèle multi-territoires.
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

// Territoire de lecture autorisé : applique le contrôle d'accès territoire-aware.
//
// Gating V1 :
//   - résidence            → accès historique au niveau compte (report_access) ;
//   - territoire actif ≠ résidence → accès UNIQUEMENT s'il existe un report_grant
//     pour (user_id, insee). Sinon on n'affiche jamais ce territoire : repli
//     propre sur la résidence et signalement du territoire refusé (deniedInsee /
//     deniedCommune) pour l'UI.
//
// La résidence reste juge par report_access ; report_grants devient juge du
// rapport par territoire. report_access seul ne suffit plus à lire un territoire
// acheté par un autre compte / jamais acheté.
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

  // Territoire actif distinct : exige un grant pour ce couple (user, insee).
  // La policy RLS report_grants_select_own garantit qu'on ne lit que ses grants.
  const { data: grant } = await supabase
    .from("report_grants")
    .select("insee")
    .eq("user_id", userId)
    .eq("insee", territory.inseeCode)
    .maybeSingle();

  if (grant) {
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

// Frontière de MONÉTISATION du module Logement (board étape 4.5). Analyser une adresse suppose
// que l'utilisateur a le droit de LIRE la commune de cette adresse : sinon un seul achat
// déverrouillerait l'analyse Logement de la France entière. Commune lisible = même règle que
// resolveReadableTerritory, mais pour un INSEE arbitraire (celui de l'adresse tapée) :
//   - résidence déclarée (home_insee_code), OU
//   - commune achetée (rapport ou Pack) : un report_grant sur (user, insee).
// Aucun élargissement implicite (voisines, département, Le Fil, foyer, B2B) : ce seront des
// droits EXPLICITES plus tard. La sécurité réelle est ici, côté serveur (le client peut doubler
// pour l'UX, jamais pour la garantie).
export async function canAnalyzeCommune(
  supabase: SupabaseClient,
  userId: string,
  insee: string | null | undefined,
): Promise<boolean> {
  if (!insee) return false;
  // PLM : l'adresse est géocodée sur l'arrondissement (751xx), la commune stockée sur son code
  // commune (75056). On compare au grain COMMUNE des deux côtés (cf. src/lib/plm.ts).
  const target = communeParent(insee);
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_insee_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile?.home_insee_code && communeParent(profile.home_insee_code) === target) return true;
  const { data: grants } = await supabase
    .from("report_grants")
    .select("insee")
    .eq("user_id", userId);
  return (grants ?? []).some((g) => communeParent(g.insee as string) === target);
}

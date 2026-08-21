// LA DOCTRINE DE L'ABSENCE ATTESTÉE. Lib PURE : aucune I/O, aucun LLM.
//
// Une absence n'est un fait opposable que si la recherche a été PROUVÉE. On ne rend « mismatch » que sur une
// mesure RÉUSSIE (measured: true) dont le résultat atteint le plancher d'absence ; measured: false ou une
// valeur corrompue restent « uncertain » (jamais un ?? 0 déguisé en verdict).

export const NETWORK_CONVENTION_ID = "daily-transit-access-v1";
export const HIGHER_ED_CONVENTION_ID = "higher-education-radius-adaptive-v1";
// Remesurée le 19/08/2026 avec la BPE 2025 (l'index entier est passé à ce millésime). La version
// change AVEC le chiffre : un artefact figé doit pouvoir dire sur quelle distribution il a été
// écrit, et deux prévalences différentes ne peuvent pas porter la même étiquette.
export const ABSENCE_DISTRIBUTION_VERSION = "absence-dist-2026-08-19";

// Union DISCRIMINÉE sur `measured` : la branche `measured: false` n'a AUCUN champ de mesure -> impossible de
// lire un weightedAccess sur une donnée non mesurée (garantie de type ; interdit aussi { measured: false,
// access: 72 }).
export type LocalNetworkAttestation =
  | { measured: true; access: number | null }
  | { measured: false; access: null };
export type HigherEdAttestation =
  | { measured: true; weightedAccess: number; radiusKm: number; establishmentCount: number | null }
  | { measured: false };

export type AbsenceVerdict = "mismatch" | "neutral" | "uncertain";

export type NamedAbsenceBasis = {
  kind: "named_absence";
  observedStateId: "network_below_daily_credibility_floor" | "no_higher_education_establishment_in_radius";
  conventionId: string;
  nationalContext:
    | { prevalence: number; validCount: number; totalCount: number; universe: "communes_france"; distributionVersion: string }
    | null;
};

export function classifyNetworkAbsence(a: LocalNetworkAttestation): AbsenceVerdict {
  if (!a?.measured) return "uncertain";                  // non mesuré / absent : jamais une absence inventée
  if (a.access == null) return "mismatch";               // sous plancher = absence attestée
  if (!Number.isFinite(a.access) || a.access < 0 || a.access > 100) return "uncertain"; // corrompu
  return "neutral";                                      // présent
}

export function classifyHigherEdAbsence(a: HigherEdAttestation): AbsenceVerdict {
  if (!a?.measured) return "uncertain";
  if (!Number.isFinite(a.radiusKm) || a.radiusKm <= 0) return "uncertain";
  // On PRÉFÈRE le vrai compte d'établissements (airtight) quand il est là ; sinon weightedAccess == 0
  // (équivalent hors le cas-frontière rural d == DMAX, de mesure nulle).
  if (a.establishmentCount != null) {
    if (!Number.isFinite(a.establishmentCount) || a.establishmentCount < 0) return "uncertain";
    return a.establishmentCount === 0 ? "mismatch" : "neutral";
  }
  if (!Number.isFinite(a.weightedAccess) || a.weightedAccess < 0) return "uncertain";
  return a.weightedAccess === 0 ? "mismatch" : "neutral";
}

// Prévalences nationales MESURÉES sur 34 788 communes (cf. spec §3). Datées, pas doctrinales, et GARDÉES
// par le patch (refus si l'index calcule autre chose). Source unique de la prévalence affichée.
//
// Réseau : mesuré le 2026-07-15, inchangé (la source OSM n'a pas bougé).
// Études : remesuré le 2026-08-19 sur la BPE 2025, 14 123 communes sans établissement du supérieur
// dans leur rayon, contre 14 069 sur la BPE 2024. L'écart est de 0,16 point ; il est repris ici
// plutôt que toléré, parce que le chiffre affiché doit être celui de l'index qui sert les dossiers.
export const ABSENCE_NATIONAL_CONTEXT: Record<"network" | "higherEd", NamedAbsenceBasis["nationalContext"]> = {
  network: { prevalence: 0.828, validCount: 34788, totalCount: 34788, universe: "communes_france", distributionVersion: ABSENCE_DISTRIBUTION_VERSION },
  higherEd: { prevalence: 0.406, validCount: 34788, totalCount: 34788, universe: "communes_france", distributionVersion: ABSENCE_DISTRIBUTION_VERSION },
};

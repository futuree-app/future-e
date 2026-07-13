// Lecteurs PURS au-dessus de UserProject. Ce que le projet DÉCLARE, jamais ce que les règles savent
// en faire : la couverture est calculée par criteria-registry.ts, à partir des évaluations observées.
//
// COVERED_PREFERENCE_KEYS vivait ici : une liste, tenue à la main, des préférences qu'une règle savait
// examiner. Ajouter une règle sans y penser faisait annoncer au lecteur que sa priorité n'était pas
// couverte alors qu'elle venait d'être examinée. Le registre l'a rendue inutile.
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { HardConstraintKey } from "./decision-fact.ts";

export function isStructured(project: UserProject): boolean {
  return project.parsed != null;
}
export function isBuyer(project: UserProject): boolean {
  return project.intent === "achat"; // analyser une adresse n'est PAS acheter
}
export function preferenceWeight(project: UserProject, key: PreferenceKey): number {
  const p = project.parsed?.preferences?.find((x) => x.key === key);
  return p ? p.weight : 0;
}
export function declaredPreferenceKeys(project: UserProject): PreferenceKey[] {
  return project.parsed?.preferences?.map((p) => p.key) ?? [];
}
export function nearSeaLimitKm(project: UserProject): number | null {
  const ns = project.parsed?.hardConstraints?.nearSea;
  if (ns?.active && typeof ns.maxKm === "number") return ns.maxKm;
  return null;
}
export function communeSizeBounds(project: UserProject): { min: number | null; max: number | null } | null {
  const cs = project.parsed?.hardConstraints?.communeSize;
  if (!cs) return null;
  return { min: cs.min ?? null, max: cs.max ?? null };
}

export const HARD_CONSTRAINT_LABELS: Record<HardConstraintKey, string> = {
  departements: "les départements visés",
  zones: "les zones géographiques visées",
  excludeZones: "les zones à éviter",
  montagne: "l'exigence de montagne",
  reliefProche: "la proximité du relief",
  nearSea: "la proximité de la mer",
  excludeSea: "l'éloignement de la mer",
  nearPlace: "la proximité d'un lieu",
  communeSize: "la taille de la commune",
  excludePlace: "les villes à quitter",
  sizeRelativeTo: "la taille relative à une ville",
};

export function declaredHardConstraintKeys(project: UserProject): HardConstraintKey[] {
  const hc = project.parsed?.hardConstraints;
  if (!hc) return [];
  const out: HardConstraintKey[] = [];
  if (hc.departements?.length) out.push("departements");
  if (hc.zones?.some((z) => z.strength === "hard")) out.push("zones");
  if (hc.excludeZones?.length) out.push("excludeZones");
  if (hc.montagne?.strength === "hard") out.push("montagne");
  if (hc.reliefProche?.strength === "hard") out.push("reliefProche");
  if (hc.nearSea?.active) out.push("nearSea");
  if (hc.excludeSea) out.push("excludeSea");
  if (hc.nearPlace) out.push("nearPlace");
  if (hc.communeSize) out.push("communeSize");
  if (hc.excludePlace?.length) out.push("excludePlace");
  if (hc.sizeRelativeTo) out.push("sizeRelativeTo");
  return out;
}
export function hasAnyHardConstraint(project: UserProject): boolean {
  return declaredHardConstraintKeys(project).length > 0;
}
// `uncoveredConstraints` et `uncoveredPreferences` vivent désormais dans criteria-registry.ts : elles
// se DÉRIVENT du registre (couverture observée), au lieu de se déduire d'une liste parallèle.

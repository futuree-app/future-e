// Lecteurs PURS au-dessus de UserProject. Ce que le projet DÉCLARE, jamais ce que les règles savent
// en faire : la couverture est calculée par criteria-registry.ts, à partir des évaluations observées.
//
// COVERED_PREFERENCE_KEYS vivait ici : une liste, tenue à la main, des préférences qu'une règle savait
// examiner. Ajouter une règle sans y penser faisait annoncer au lecteur que sa priorité n'était pas
// couverte alors qu'elle venait d'être examinée. Le registre l'a rendue inutile.
import type { UserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { HardConstraintKey } from "./decision-fact.ts";
import { lieuEnPhrase } from "../hard-constraints.ts";
import { ZONE_TABLE } from "../geo-zones.ts";

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

// Le libellé GÉNÉRIQUE d'une contrainte : le repli, quand le projet ne dit rien de plus précis.
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

function fmtHab(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// `lieuEnPhrase` vit désormais dans le NOYAU (src/lib/hard-constraints.ts) : le dossier ET le
// comparateur nomment ce lieu (l'un dans sa conclusion, l'autre quand il annonce la condition qu'il n'a
// pas pu appliquer), et ils ne peuvent pas le nommer différemment.
//
// « a, b et c » : une énumération française, pas une liste de virgules jusqu'au bout.
function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// LE LIBELLÉ INSTANCIÉ : la contrainte telle que LE LECTEUR l'a posée, pas sa catégorie.
//
// « La proximité d'un lieu » ne veut rien dire pour quelqu'un qui a écrit « à moins de 30 minutes de
// la gare Matabiau ». Nommer la catégorie quand on connaît l'instance, c'est le même défaut que citer
// « des risques naturels » au lieu de l'inondation : le lecteur ne se reconnaît pas dans sa propre
// contrainte. On retombe sur le générique seulement quand le projet ne porte pas le détail.
export function hardConstraintLabel(project: UserProject, key: HardConstraintKey): string {
  const hc = project.parsed?.hardConstraints;
  const generic = HARD_CONSTRAINT_LABELS[key];
  if (!hc) return generic;

  switch (key) {
    case "nearPlace": {
      const label = hc.nearPlace?.label;
      return label ? `la proximité de ${lieuEnPhrase(label)}` : generic;
    }
    // « Les zones géographiques visées » ne veut rien dire pour quelqu'un qui a écrit « en Bretagne ».
    // Le moteur détient la table des jetons : il connaît le mot du lecteur, il n'a aucune raison de lui
    // rendre une catégorie.
    case "zones": {
      const labels = (hc.zones ?? [])
        .filter((z) => z?.strength === "hard")
        .map((z) => ZONE_TABLE[z.zone]?.label)
        .filter((l): l is string => Boolean(l));
      return labels.length > 0 ? joinFr(labels) : generic;
    }
    case "excludeZones": {
      const labels = (hc.excludeZones ?? [])
        .map((t) => ZONE_TABLE[t]?.label)
        .filter((l): l is string => Boolean(l));
      return labels.length > 0 ? `le fait d'éviter ${joinFr(labels)}` : generic;
    }
    case "departements": {
      const d = hc.departements ?? [];
      if (d.length === 0) return generic;
      return d.length === 1 ? `le département ${d[0]}` : `les départements ${d.join(", ")}`;
    }
    case "excludePlace": {
      const villes = (hc.excludePlace ?? []).map((v) => lieuEnPhrase(v.label));
      return villes.length > 0 ? `le fait de quitter ${villes.join(", ")}` : generic;
    }
    case "sizeRelativeTo": {
      const s = hc.sizeRelativeTo;
      if (!s) return generic;
      return `une commune ${s.direction === "smaller" ? "plus petite" : "plus grande"} que ${s.label}`;
    }
    case "communeSize": {
      const cs = hc.communeSize;
      if (!cs) return generic;
      if (cs.max != null && cs.min != null) return `une commune entre ${fmtHab(cs.min)} et ${fmtHab(cs.max)} habitants`;
      if (cs.max != null) return `une commune de moins de ${fmtHab(cs.max)} habitants`;
      if (cs.min != null) return `une commune de plus de ${fmtHab(cs.min)} habitants`;
      return generic;
    }
    case "nearSea": {
      const km = hc.nearSea?.maxKm;
      return km != null ? `la proximité de la mer (moins de ${km} km)` : generic;
    }
    default:
      return generic;
  }
}

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

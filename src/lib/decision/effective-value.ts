// LA VALEUR EFFECTIVE D'UN CRITÈRE (FUT-8). Lib PURE.
//
//   valeur effective = parsed ⊕ définition valide        (sinon : parsed)
//
// `parsed` dit ce que futur•e a compris du texte ; une définition dit ce que le lecteur a précisé ou
// accepté. La valeur effective est ce que lisent l'évaluation du dossier, la capacité, l'empreinte des
// conditions et les libellés. La Recherche, elle, continue de lire `parsed`.
//
// Une définition ne vaut que pour la valeur `parsed` que le lecteur avait sous les yeux (son
// `parsedFingerprint`). Si le reparse la change (« Nantes » devient « Rennes »), elle est PÉRIMÉE : elle
// reste en base, elle ne s'applique plus. Aucune précision n'est transférée d'un élément à un autre.
import type { UserProject, CriterionRef, Definition } from "../user-project.ts";
import { normalizeDefinitions, normalizeAdoptions } from "../user-project.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";
import type { Preference, PreferenceKey } from "../comparateur-vie.ts";
import { normalizeName } from "../hard-constraints-resolve.ts";
import { canonique, valeurDecisionnelle } from "./criterion-value.ts";

// Les familles à plusieurs éléments, et l'identité canonique de chaque élément.
export const FAMILLES_MULTIPLES = new Set(["excludePlace", "excludeZones"]);

export function instanceDeVille(label: string): string {
  return normalizeName(label);
}

/** La valeur `parsed` d'UN élément : ce que le lecteur avait sous les yeux, avant toute précision. */
export function valeurParsed(project: UserProject, ref: CriterionRef): unknown {
  if (ref.kind === "preference") {
    return project.parsed?.preferences?.find((p) => p.key === ref.key) ? { key: ref.key } : undefined;
  }
  const hc = project.parsed?.hardConstraints ?? {};
  const instance = ref.instance ?? null;
  if (ref.key === "excludePlace" && instance != null) {
    const e = (hc.excludePlace ?? []).find((x) => x?.label && instanceDeVille(x.label) === instance);
    return e ? { label: instanceDeVille(e.label), scope: e.scope ?? null } : undefined;
  }
  if (ref.key === "excludeZones" && instance != null) {
    if (!(hc.excludeZones ?? []).includes(instance)) return undefined;
    const dit = (hc.excludeZonesDits ?? []).find((d) => d.token === instance)?.said ?? null;
    return { token: instance, said: dit };
  }
  return valeurDecisionnelle(ref.key, hc);
}

export function parsedFingerprint(project: UserProject, ref: CriterionRef): string | null {
  const v = valeurParsed(project, ref);
  return v === undefined ? null : `${ref.kind}:${ref.key}:${ref.instance ?? ""}:${canonique(v)}`;
}

// La variante d'une définition est-elle compatible avec la famille (et l'élément) qu'elle précise ?
function compatible(d: Definition): boolean {
  const k = d.criterion.key;
  const inst = d.criterion.instance ?? null;
  switch (d.kind) {
    case "distance_lieu":
    case "temps_lieu":
      return k === "nearPlace" && inst == null;
    case "taille":
      return k === "communeSize" && inst == null;
    case "taille_relative":
      return k === "sizeRelativeTo" && inst == null;
    case "quitter_ville":
      return k === "excludePlace" && inst != null;
    case "perimetre_parisien":
      return k === "excludeZones" && (inst === "paris" || inst === "idf");
    case "perimetre_zones":
      return k === "zones" && inst == null;
    case "convention":
      return false; // aucune convention non géographique n'est encore utilisable (FUT-8, §11)
  }
}

/** La définition VALIDE d'un élément : compatible, et épinglée à la valeur `parsed` actuelle. */
export function definitionValide(project: UserProject, ref: CriterionRef): Definition | null {
  const fp = parsedFingerprint(project, ref);
  if (fp == null) return null;
  const same = (a: CriterionRef) => a.kind === ref.kind && a.key === ref.key && (a.instance ?? null) === (ref.instance ?? null);
  return normalizeDefinitions(project.definitions).find((d) => same(d.criterion) && d.parsedFingerprint === fp && compatible(d)) ?? null;
}

/** Une définition existe pour cet élément, mais elle ne vaut plus (reparse, ou variante incompatible). */
export function definitionPerimee(project: UserProject, ref: CriterionRef): boolean {
  const same = (a: CriterionRef) => a.kind === ref.kind && a.key === ref.key && (a.instance ?? null) === (ref.instance ?? null);
  return definitionValide(project, ref) == null && normalizeDefinitions(project.definitions).some((d) => same(d.criterion));
}

/** Les critères géographiques effectifs : `parsed` complété des définitions valides. */
export function effectiveHardConstraints(project: UserProject): HardConstraints {
  const hc: HardConstraints = { ...(project.parsed?.hardConstraints ?? {}) };
  const np = hc.nearPlace;
  if (np?.label) {
    const d = definitionValide(project, { kind: "hard", key: "nearPlace", instance: null });
    if (d?.kind === "distance_lieu") hc.nearPlace = { ...np, metric: d.metric, maxKm: d.maxKm, maxMinutes: null, mode: null };
    if (d?.kind === "temps_lieu") hc.nearPlace = { ...np, mode: d.mode, maxMinutes: d.maxMinutes, maxKm: null, metric: null };
  }
  if (hc.communeSize) {
    const d = definitionValide(project, { kind: "hard", key: "communeSize", instance: null });
    if (d?.kind === "taille") hc.communeSize = { unit: d.unit, min: d.min, max: d.max };
  }
  if (hc.sizeRelativeTo) {
    const d = definitionValide(project, { kind: "hard", key: "sizeRelativeTo", instance: null });
    if (d?.kind === "taille_relative") hc.sizeRelativeTo = { ...hc.sizeRelativeTo, unit: d.unit };
  }
  if (hc.excludePlace?.length) {
    hc.excludePlace = hc.excludePlace.map((e) => {
      if (!e?.label) return e;
      const d = definitionValide(project, { kind: "hard", key: "excludePlace", instance: instanceDeVille(e.label) });
      return d?.kind === "quitter_ville" ? { ...e, scope: d.scope } : e;
    });
  }
  for (const token of ["paris", "idf"]) {
    if (!(hc.excludeZones ?? []).includes(token)) continue;
    const d = definitionValide(project, { kind: "hard", key: "excludeZones", instance: token });
    if (d?.kind === "perimetre_parisien") hc.excludeZonesPerimetres = { ...(hc.excludeZonesPerimetres ?? {}), [token]: d.perimetre };
  }
  if (hc.zones?.length) {
    const d = definitionValide(project, { kind: "hard", key: "zones", instance: null });
    if (d?.kind === "perimetre_zones") hc.zonesConventions = d.conventions;
  }
  return hc;
}

/**
 * Les préférences effectives : celles de `parsed`, plus celles que le lecteur a ADOPTÉES. Une clé
 * présente des deux côtés n'en fait qu'une : le texte du lecteur prime s'il la porte (`source: "parse"`),
 * sinon le poids de l'adoption. Une adoption survit au retrait de l'ancre qui l'a inspirée.
 */
export function effectivePreferences(project: UserProject): Preference[] {
  const parsed = project.parsed?.preferences ?? [];
  const adoptions = normalizeAdoptions(project.adoptions);
  const out: Preference[] = parsed.map((p) => {
    if ((p.source ?? "parse") === "parse") return p;
    const a = adoptions.find((x) => x.criterion.key === p.key);
    return a ? { ...p, weight: a.weight } : p;
  });
  for (const a of adoptions) {
    if (!out.some((p) => p.key === a.criterion.key)) out.push({ key: a.criterion.key as PreferenceKey, weight: a.weight, source: "ancre" });
  }
  return out;
}

/** Le projet tel que le moteur le lit : `parsed` remplacé par sa valeur effective. */
export function effectiveProject(project: UserProject): UserProject {
  if (!project.parsed) return project;
  return {
    ...project,
    parsed: { ...project.parsed, hardConstraints: effectiveHardConstraints(project), preferences: effectivePreferences(project) },
  };
}

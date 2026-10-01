// LES GESTES DU LECTEUR SUR UN CRITÈRE DE SON PROJET (FUT-8, §7). Lib PURE.
//
// Préciser, retirer une précision, confirmer une condition sans compromis, la retirer, garder un
// critère inspiré d'une ancre, ne plus le garder. Chaque geste part du Projet RELU en base, jamais
// d'un état envoyé par le navigateur, et il est refusé si le lecteur n'avait pas sous les yeux la
// valeur actuelle (`seen` ≠ empreinte serveur → 409 : le client recharge).
//
// Aucun geste ne touche `parsed` (écrit par le parseur seul). Retirer une précision ne supprime pas la
// condition qui en dépendait : elle devient « à revoir » (périmée), et le lecteur décide.
import type { UserProject, CriterionRef, DefinitionBody, Definition, Adoption, ConditionConfirmation, Rejet } from "../user-project.ts";
import { normalizeDefinitions, normalizeUserProject } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { declaredHardConstraintKeys } from "./project-view.ts";
import { criterionFingerprint, sameCriterion } from "./conditions.ts";
import { definitionValide, effectivePreferences, FAMILLES_MULTIPLES, instancesDe, parsedFingerprint } from "./effective-value.ts";
import { conventionPar } from "./conventions.ts";

type PreferenceRef = { kind: "preference"; key: PreferenceKey; instance?: null };

export type CriterionAction =
  | { action: "definir"; criterion: CriterionRef; seen: string; definition: DefinitionBody }
  | { action: "retirer_definition"; criterion: CriterionRef }
  | { action: "confirmer"; criterion: CriterionRef; seen: string; definition?: DefinitionBody; interpretation?: string }
  | { action: "retirer_condition"; criterion: CriterionRef }
  | { action: "adopter"; criterion: PreferenceRef; seen: string }
  | { action: "retirer_adoption"; criterion: PreferenceRef }
  // « Ça ne compte pas pour moi » : seulement sur une suggestion d'ancre (jamais sur un critère écrit).
  | { action: "rejeter"; criterion: PreferenceRef; seen: string };

export type ResultatGeste =
  | { ok: true; project: UserProject }
  | { ok: false; status: 400 | 404 | 409; error: string };

const refus = (status: 400 | 404 | 409, error: string): ResultatGeste => ({ ok: false, status, error });
const CHANGE = "Votre projet a changé entre-temps. Rechargez la page.";

/** L'élément existe-t-il dans le Projet ? Une famille multiple se désigne toujours par son élément. */
export function elementDeclare(project: UserProject, ref: CriterionRef): boolean {
  if (ref.kind === "preference") return effectivePreferences(project).some((p) => p.key === ref.key && p.weight > 0);
  if (!declaredHardConstraintKeys(project).includes(ref.key)) return false;
  const instance = ref.instance ?? null;
  if (FAMILLES_MULTIPLES.has(ref.key)) return instance != null && instancesDe(project.parsed?.hardConstraints ?? {}, ref.key).includes(instance);
  return instance == null;
}

// La préférence vient d'une ancre, et le lecteur ne l'a pas (encore) reprise à son compte.
function ancreNonAdoptee(project: UserProject, key: PreferenceKey): { weight: number; ancres: string[] } | null {
  const p = project.parsed?.preferences?.find((x) => x.key === key);
  if (!p || p.source !== "ancre") return null;
  if ((project.adoptions ?? []).some((a) => a.criterion.key === key)) return null;
  // Toutes les communes-ancres : un trait commun à Brest et Lorient vient des deux.
  const ancres = (project.parsed?.communeAncre ?? []).map((a) => a?.label).filter((l): l is string => Boolean(l));
  return { weight: p.weight, ancres: ancres.length > 0 ? ancres : ["votre commune de référence"] };
}

function avec(project: UserProject, change: Partial<Pick<UserProject, "definitions" | "adoptions" | "conditions" | "rejets">>): UserProject {
  const brut = { ...project, ...change };
  for (const k of ["definitions", "adoptions", "conditions", "rejets"] as const) {
    if (Array.isArray(brut[k]) && brut[k]!.length === 0) delete brut[k];
  }
  return normalizeUserProject(brut)!;
}

// Une précision posée sur l'élément, à la place de la précédente. Refusée si elle ne s'applique pas
// (variante d'une autre famille, convention inconnue ou non tranchable comme périmètre).
function poserDefinition(project: UserProject, ref: CriterionRef, body: DefinitionBody, now: string): UserProject | string {
  const fp = parsedFingerprint(project, ref);
  if (fp == null) return "Ce critère n'est plus dans votre projet.";
  if (body.kind === "perimetre_zones") {
    const zones = (project.parsed?.hardConstraints?.zones ?? []).filter((z) => z.strength === "hard").map((z) => z.zone);
    for (const c of body.conventions ?? []) {
      const conv = conventionPar(c.conventionId, c.conventionVersion);
      if (!conv || conv.status !== "perimetre" || conv.definition.kind !== "departements" || conv.definition.token !== c.token || !zones.includes(c.token)) {
        return "Ce périmètre ne correspond pas à votre projet.";
      }
    }
  }
  const def = { ...body, criterion: ref, parsedFingerprint: fp, definedAt: now, source: "user" } as Definition;
  if (normalizeDefinitions([def]).length !== 1) return "Cette précision est incomplète.";
  const autres = (project.definitions ?? []).filter((d) => !sameCriterion(d.criterion, ref));
  const suivant = avec(project, { definitions: [...autres, def] });
  return definitionValide(suivant, ref) ? suivant : "Cette précision ne s'applique pas à ce critère.";
}

export function appliquerGeste(project: UserProject, geste: CriterionAction, now: string): ResultatGeste {
  const ref: CriterionRef = geste.criterion.kind === "hard"
    ? { kind: "hard", key: geste.criterion.key, instance: geste.criterion.instance ?? null }
    : { kind: "preference", key: geste.criterion.key, instance: null };

  switch (geste.action) {
    case "definir": {
      if (!elementDeclare(project, ref) || ref.kind !== "hard") return refus(404, "Ce critère n'est plus dans votre projet.");
      if (geste.seen !== parsedFingerprint(project, ref)) return refus(409, CHANGE);
      const r = poserDefinition(project, ref, geste.definition, now);
      return typeof r === "string" ? refus(400, r) : { ok: true, project: r };
    }
    case "retirer_definition":
      return { ok: true, project: avec(project, { definitions: (project.definitions ?? []).filter((d) => !sameCriterion(d.criterion, ref)) }) };

    case "confirmer": {
      if (!elementDeclare(project, ref)) return refus(404, "Ce critère n'est plus dans votre projet.");
      if (geste.seen !== criterionFingerprint(project, ref)) return refus(409, CHANGE);
      let suivant = project;
      if (geste.definition) {
        if (ref.kind !== "hard") return refus(400, "Ce critère ne se précise pas.");
        const r = poserDefinition(project, ref, geste.definition, now);
        if (typeof r === "string") return refus(400, r);
        suivant = r;
      }
      // « En faire une condition » sur un critère inspiré d'une ancre : le lecteur le reprend d'abord à son
      // compte (adoption), dans la même écriture. Jamais une condition sur un critère qu'il n'a pas repris.
      if (ref.kind === "preference") {
        const ancre = ancreNonAdoptee(suivant, ref.key);
        if (ancre) {
          const adoption: Adoption = {
            criterion: { kind: "preference", key: ref.key, instance: null },
            weight: Math.min(3, Math.max(1, Math.round(ancre.weight))) as 1 | 2 | 3,
            origin: { kind: "ancre", labels: ancre.ancres }, adoptedAt: now, source: "user",
          };
          suivant = avec(suivant, { adoptions: [...(suivant.adoptions ?? []), adoption] });
        }
      }
      const fingerprint = criterionFingerprint(suivant, ref);
      if (fingerprint == null) return refus(404, "Ce critère n'est plus dans votre projet.");
      const confirmation: ConditionConfirmation = {
        criterion: ref, fingerprint, confirmedAt: now, source: "user",
        ...(geste.interpretation ? { interpretation: geste.interpretation } : {}),
      };
      const autres = (suivant.conditions ?? []).filter((c) => !sameCriterion(c.criterion, ref));
      return { ok: true, project: avec(suivant, { conditions: [...autres, confirmation] }) };
    }
    case "retirer_condition":
      return { ok: true, project: avec(project, { conditions: (project.conditions ?? []).filter((c) => !sameCriterion(c.criterion, ref)) }) };

    case "adopter": {
      if (ref.kind !== "preference") return refus(400, "Seul un critère inspiré d'une commune se garde.");
      const ancre = ancreNonAdoptee(project, ref.key);
      if (!ancre) return refus(404, "Ce critère n'est pas une suggestion inspirée d'une commune.");
      // L'empreinte d'une préférence est sa clé (le poids n'y entre pas). Elle se compare ici à la
      // SUGGESTION, présente ou rejetée : reprendre un critère écarté doit rester possible.
      if (geste.seen !== `pref:${ref.key}`) return refus(409, CHANGE);
      const adoption: Adoption = {
        criterion: { kind: "preference", key: ref.key, instance: null },
        weight: Math.min(3, Math.max(1, Math.round(ancre.weight))) as 1 | 2 | 3,
        origin: { kind: "ancre", labels: ancre.ancres }, adoptedAt: now, source: "user",
      };
      // Adopter après un refus : le lecteur a changé d'avis, le rejet tombe.
      return {
        ok: true,
        project: avec(project, {
          adoptions: [...(project.adoptions ?? []), adoption],
          rejets: (project.rejets ?? []).filter((r) => r.criterion.key !== ref.key),
        }),
      };
    }
    case "rejeter": {
      if (ref.kind !== "preference") return refus(400, "Seul un critère inspiré d'une commune s'écarte.");
      const pref = project.parsed?.preferences?.find((p) => p.key === ref.key);
      const adoptee = (project.adoptions ?? []).find((a) => a.criterion.key === ref.key);
      // Un critère écrit par le lecteur ne se rejette pas : il modifie son texte.
      if (pref && (pref.source ?? "parse") === "parse") return refus(400, "Ce critère vient de votre texte : modifiez votre texte pour le retirer.");
      if (!pref && !adoptee) return refus(404, "Ce critère n'est pas une suggestion de votre projet.");
      if (geste.seen !== criterionFingerprint(project, ref)) return refus(409, CHANGE);
      const labels = adoptee ? adoptee.origin.labels : (project.parsed?.communeAncre ?? []).map((a) => a.label).filter(Boolean);
      const rejet: Rejet = { criterion: { kind: "preference", key: ref.key, instance: null }, origin: { kind: "ancre", labels }, rejectedAt: now, source: "user" };
      // Rejeter retire l'adoption éventuelle ET toute condition sur ce critère : une condition « à revoir »
      // sur un critère que le lecteur vient de dire ne pas vouloir n'aurait aucun sens.
      return {
        ok: true,
        project: avec(project, {
          rejets: [...(project.rejets ?? []).filter((r) => r.criterion.key !== ref.key), rejet],
          adoptions: (project.adoptions ?? []).filter((a) => a.criterion.key !== ref.key),
          conditions: (project.conditions ?? []).filter((c) => !sameCriterion(c.criterion, ref)),
        }),
      };
    }
    case "retirer_adoption":
      return { ok: true, project: avec(project, { adoptions: (project.adoptions ?? []).filter((a) => a.criterion.key !== ref.key) }) };
  }
}

/** Lecture tolérante du corps de la requête : tout ce qui ne colle pas à un geste connu est refusé. */
export function lireGeste(raw: unknown): CriterionAction | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const c = o.criterion as Record<string, unknown> | undefined;
  if (!c || (c.kind !== "hard" && c.kind !== "preference") || typeof c.key !== "string" || !c.key) return null;
  if (c.instance != null && typeof c.instance !== "string") return null;
  const criterion = (c.kind === "hard"
    ? { kind: "hard", key: c.key, instance: (c.instance as string | null) ?? null }
    : { kind: "preference", key: c.key, instance: null }) as CriterionRef;
  const seen = typeof o.seen === "string" ? o.seen : null;
  const definition = o.definition && typeof o.definition === "object" ? (o.definition as DefinitionBody) : undefined;
  const interpretation = typeof o.interpretation === "string" ? o.interpretation.slice(0, 200) : undefined;
  switch (o.action) {
    case "definir":
      return seen && definition ? { action: "definir", criterion, seen, definition } : null;
    case "retirer_definition":
      return { action: "retirer_definition", criterion };
    case "confirmer":
      return seen ? { action: "confirmer", criterion, seen, ...(definition ? { definition } : {}), ...(interpretation ? { interpretation } : {}) } : null;
    case "retirer_condition":
      return { action: "retirer_condition", criterion };
    case "adopter":
      return seen && criterion.kind === "preference" ? { action: "adopter", criterion: criterion as PreferenceRef, seen } : null;
    case "retirer_adoption":
      return criterion.kind === "preference" ? { action: "retirer_adoption", criterion: criterion as PreferenceRef } : null;
    case "rejeter":
      return seen && criterion.kind === "preference" ? { action: "rejeter", criterion: criterion as PreferenceRef, seen } : null;
    default:
      return null;
  }
}

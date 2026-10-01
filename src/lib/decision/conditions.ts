// LES CONDITIONS SANS COMPROMIS DU LECTEUR (FUT-7, 01/10/2026). Lib PURE.
//
// Une condition est confirmée si, et seulement si, le projet porte une confirmation :
//   - venue du lecteur (`source: "user"`) ;
//   - sur ce critère, déclaré dans le projet actuel ;
//   - dont l'EMPREINTE est celle de la valeur actuelle du critère.
//
// Tout le reste vaut NON CONFIRMÉ : champ absent, entrée illisible, autre provenance, empreinte
// périmée, projet legacy. Aucun repli ne reconstruit une confirmation depuis `strength`, le texte, un
// mot fort ou une ancienne contrainte dure. Le silence ne vaut jamais oui.
import type { UserProject, CriterionRef, ConditionConfirmation } from "../user-project.ts";
import { normalizeConditions } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { declaredHardConstraintKeys, declaredPreferenceKeys, preferenceWeight } from "./project-view.ts";
import { canonique, valeurDecisionnelle } from "./criterion-value.ts";
import { effectiveProject, valeurParsed, FAMILLES_MULTIPLES } from "./effective-value.ts";

export type { CriterionRef, ConditionConfirmation } from "../user-project.ts";

// FUT-8 : le même ÉLÉMENT, pas seulement la même famille. `instance` absente et `null` se valent.
export function sameCriterion(a: CriterionRef, b: CriterionRef): boolean {
  return a.kind === b.kind && a.key === b.key && (a.instance ?? null) === (b.instance ?? null);
}

/**
 * L'EMPREINTE DE CE QUE LE LECTEUR CONFIRME. `null` quand le critère n'est pas déclaré : on ne
 * confirme pas ce qui n'existe pas.
 *
 * Pour un critère géographique, c'est la valeur décisionnelle, celle-là même qui périme un dossier
 * vendu (`criterion-value.ts`) : ancres dures seules, seuil réellement appliqué, libellé du lieu. Un
 * paramètre qui change le sens de la condition (périmètre, distance, durée, mode, seuil) change donc
 * l'empreinte.
 *
 * Pour une préférence, c'est la clé seule. LE POIDS N'Y ENTRE PAS : passer l'accès aux soins de
 * « essentiel » à « important » change son importance, pas le fait que le lecteur n'envisage pas un
 * lieu sans médecin.
 */
//
// FUT-8 : l'empreinte porte la VALEUR EFFECTIVE (parsed ⊕ définition valide). Préciser une métrique, une
// unité, un périmètre change donc l'empreinte, et une confirmation donnée avant la précision ne vaut plus
// pour le sens précisé. Pour un ÉLÉMENT d'une famille multiple (« quitter Lyon »), la valeur est celle de
// cet élément seul. Sans instance, le format est celui de FUT-7 : aucune empreinte existante ne bouge.
export function criterionFingerprint(project: UserProject, ref: CriterionRef): string | null {
  const eff = effectiveProject(project);
  if (ref.kind === "hard") {
    const hc = eff.parsed?.hardConstraints;
    if (!hc || !declaredHardConstraintKeys(eff).includes(ref.key)) return null;
    const instance = ref.instance ?? null;
    if (instance != null) {
      if (!FAMILLES_MULTIPLES.has(ref.key)) return null;
      const v = valeurParsed(eff, ref);
      return v === undefined ? null : `hard:${ref.key}:${instance}:${canonique(v)}`;
    }
    return `hard:${ref.key}:${canonique(valeurDecisionnelle(ref.key, hc))}`;
  }
  return preferenceWeight(eff, ref.key) > 0 ? `pref:${ref.key}` : null;
}

/** Les confirmations lisibles du projet, valides ou périmées. */
export function readConditions(project: UserProject): ConditionConfirmation[] {
  return normalizeConditions(project.conditions);
}

export function isConfirmed(project: UserProject, ref: CriterionRef): boolean {
  const fingerprint = criterionFingerprint(project, ref);
  if (fingerprint == null) return false;
  return readConditions(project).some((c) => sameCriterion(c.criterion, ref) && c.fingerprint === fingerprint);
}

/** Une confirmation existe, mais la valeur du critère a changé depuis : elle ne vaut plus. */
export function isStale(project: UserProject, ref: CriterionRef): boolean {
  return !isConfirmed(project, ref) && readConditions(project).some((c) => sameCriterion(c.criterion, ref));
}

/** Les critères déclarés ET confirmés, dans l'ordre du projet (géographie, puis préférences). */
export function confirmedCriteria(project: UserProject): CriterionRef[] {
  const refs: CriterionRef[] = [
    ...declaredHardConstraintKeys(project).map((key): CriterionRef => ({ kind: "hard", key })),
    ...declaredPreferenceKeys(project).map((key): CriterionRef => ({ kind: "preference", key })),
  ];
  return refs.filter((r) => isConfirmed(project, r));
}

export function hasAnyConfirmedCondition(project: UserProject): boolean {
  return confirmedCriteria(project).length > 0;
}

/**
 * UNE PRÉFÉRENCE DOIT-ELLE PRODUIRE SA CARTE ?
 *
 * Le POIDS gouverne la matérialité : à poids 1, un écart est examiné mais tu (le lecteur l'a dit
 * secondaire). Une CONFIRMATION gouverne la visibilité d'une autre façon : une condition sans compromis
 * se montre quel que soit son poids. Les deux axes restent distincts : le poids décide toujours du tier
 * du fait (`tierFor`), la confirmation décide seulement qu'il existe une carte à montrer.
 *
 * Poids 0 = non déclarée : jamais.
 */
export function preferenceSurfaced(project: UserProject, key: PreferenceKey): boolean {
  // Le poids EFFECTIF (adoptions comprises) : une préférence adoptée se montre comme une préférence dite.
  const w = preferenceWeight(effectiveProject(project), key);
  if (w <= 0) return false;
  return w >= 2 || isConfirmed(project, { kind: "preference", key });
}

/**
 * LA CONFIRMATION, CONSTRUITE AU MOMENT DU GESTE. C'est la seule façon d'en fabriquer une qui vaille :
 * l'empreinte est celle de la valeur que le lecteur a sous les yeux. FUT-8 (le geste de confirmation)
 * s'en servira ; les tests de FUT-7 aussi. `null` sur un critère non déclaré.
 */
export function buildConfirmation(project: UserProject, ref: CriterionRef, confirmedAt: string): ConditionConfirmation | null {
  const fingerprint = criterionFingerprint(project, ref);
  return fingerprint == null ? null : { criterion: ref, fingerprint, confirmedAt, source: "user" };
}

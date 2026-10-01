// Projet de l'utilisateur, persisté au compte (colonne jsonb user_project). Lib PURE.
// On sépare l'ENTRÉE client (UserProjectInput) du PERSISTÉ (UserProject, estampillé serveur avec
// schemaVersion + updatedAt). Doctrine : on ne devine jamais (posture requise, intent invalide rejeté,
// date absente -> null jamais inventée) ; rawText survit à un parse en échec.
import type { ParsedProject, PreferenceKey } from "./comparateur-vie.ts";
import type { HardConstraintKey } from "./hard-constraints.ts";

export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location";

export type UserProjectInput = {
  posture: ProjectPosture;
  intent: ProjectIntent | null;
  rawText: string | null;
  parsed: ParsedProject | null;
};

// ── LES CONDITIONS SANS COMPROMIS (FUT-7, 01/10/2026) ──────────────────────────────────────
//
// Une condition est un ACTE du lecteur : « si ce critère n'est pas rempli, je n'envisage pas ce
// lieu ». Elle ne se déduit de rien d'autre. Ni `strength: "hard"`, ni un mot fort dans le texte, ni
// une ancienne contrainte dure : ce sont des lectures du parseur, et le silence ne vaut jamais oui.
//
// ELLE VIT À CÔTÉ DE `parsed`, JAMAIS DEDANS. `parsed` est la sortie du parseur, remplacée en entier
// à chaque reparse : une confirmation logée dedans disparaîtrait à la première virgule corrigée, ou
// survivrait à un changement de sens si le parseur la recopiait. Ici, elle a un seul écrivain.
//
// ELLE EST ÉPINGLÉE À UNE EMPREINTE : la valeur décisionnelle du critère au moment du geste
// (`criterionFingerprint`, conditions.ts). « La Bretagne » confirmée ne vaut pas pour « la
// Normandie » : la confirmation reste stockée (on pourra la proposer à nouveau), elle ne vaut plus.
export type CriterionRef =
  | { kind: "hard"; key: HardConstraintKey }
  | { kind: "preference"; key: PreferenceKey };

export type ConditionConfirmation = {
  criterion: CriterionRef;
  fingerprint: string;
  confirmedAt: string;
  // La seule valeur admise. Toute autre provenance (un parseur, une migration, une convention) se lit
  // comme « non confirmé ».
  source: "user";
};

export type UserProject = UserProjectInput & {
  // `schemaVersion` DÉCRIT LA FORME DU CONTRAT, rien d'autre. La v2 dit qu'un projet PEUT porter des
  // `conditions`. Elle n'est ni une trace de migration, ni la preuve que le lecteur a vu le nouveau
  // modèle, ni celle que d'anciennes contraintes ont été confirmées : un projet legacy lu aujourd'hui
  // est exposé en v2, sans aucune confirmation.
  schemaVersion?: 2; // optionnel pour l'ergonomie de construction ; le serveur l'écrit toujours
  updatedAt: string | null; // estampille serveur ; null = inconnue (jamais une date inventée)
  // Absent = aucune condition confirmée. Jamais vide en base : on n'écrit pas un tableau vide.
  conditions?: ConditionConfirmation[];
};

const POSTURES: ProjectPosture[] = ["recherche", "adresse", "habitant", "recherche_quartier"];
const INTENTS: ProjectIntent[] = ["achat", "location"];

/**
 * UNE PRÉFÉRENCE DÉCLARÉE DEUX FOIS N'EN EST QU'UNE, ET C'EST LA PREMIÈRE (revue du 12/08/2026).
 *
 * Le moteur lit les poids par `find` (`preferenceWeight`, project-view.ts) : sur
 * `[{faible_chaleur, 1}, {faible_chaleur, 3}]`, il applique 1 et ignore 3. Rien n'imposait pourtant
 * l'unicité des clés, ni au parse ni à la persistance. Deux conséquences, et la seconde est la pire :
 * le projet enregistré portait un poids que le moteur n'appliquerait jamais, et la signature
 * décisionnelle, qui trie les couples clé:poids, rendait la MÊME valeur pour les deux ordres alors
 * que le moteur, lui, passait de 1 à 3. Un vrai changement de décision devenait invisible.
 *
 * La canonisation se fait ici, sur le seul chemin d'écriture (PATCH `user_project` et son amorçage)
 * ET sur le chemin de lecture (`normalizeUserProject` passe par la même fonction), si bien qu'un
 * projet déjà en base portant des doublons est ramené à ce que le moteur en fait.
 */
function dedupePreferences(prefs: unknown): unknown {
  if (!Array.isArray(prefs)) return prefs;
  const vues = new Set<string>();
  return prefs.filter((p) => {
    const key = (p as { key?: unknown })?.key;
    if (typeof key !== "string") return true; // pas notre affaire : le producteur de ParsedProject valide la forme
    if (vues.has(key)) return false;
    vues.add(key);
    return true;
  });
}

// `parsed` valide = objet portant au moins une `reformulation` string. On ne re-valide pas tout le
// ParsedProject ici (il a son propre producteur, /parse) : on garde ou on jette.
function coerceParsed(v: unknown): ParsedProject | null {
  if (v && typeof v === "object" && typeof (v as { reformulation?: unknown }).reformulation === "string") {
    const o = v as Record<string, unknown>;
    if (!Array.isArray(o.preferences)) return v as ParsedProject;
    return { ...o, preferences: dedupePreferences(o.preferences) } as unknown as ParsedProject;
  }
  return null;
}

// LES CONFIRMATIONS LUES EN BASE, tolérantes : une entrée illisible TOMBE, elle ne fait pas tomber le
// projet. Ce qui n'a pas exactement la forme attendue n'est pas une confirmation.
function isCriterionRef(v: unknown): v is CriterionRef {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (o.kind === "hard" || o.kind === "preference") && typeof o.key === "string" && o.key.length > 0;
}

export function normalizeConditions(raw: unknown): ConditionConfirmation[] {
  if (!Array.isArray(raw)) return [];
  const out: ConditionConfirmation[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const o = c as Record<string, unknown>;
    if (o.source !== "user") continue;
    if (!isCriterionRef(o.criterion)) continue;
    if (typeof o.fingerprint !== "string" || o.fingerprint.length === 0) continue;
    if (typeof o.confirmedAt !== "string" || Number.isNaN(Date.parse(o.confirmedAt))) continue;
    out.push({
      criterion: { kind: o.criterion.kind, key: o.criterion.key } as CriterionRef,
      fingerprint: o.fingerprint, confirmedAt: o.confirmedAt, source: "user",
    });
  }
  return out;
}

// Un tableau vide ne s'écrit pas : `conditions` absent et `conditions: []` disent la même chose, et un
// `undefined` explicite casserait la sérialisation stable des artefacts.
function withConditions<T extends object>(base: T, conditions: ConditionConfirmation[]): T & { conditions?: ConditionConfirmation[] } {
  return conditions.length > 0 ? { ...base, conditions } : base;
}

// Validation de l'ENTRÉE client. Elle IGNORE `conditions` : une écriture générique du projet (le texte,
// la posture, l'intention) ne peut jamais fabriquer une confirmation. Le geste dédié viendra avec FUT-8.
// posture requise (rejet), intent absent/null OK / présent-invalide
// rejet, rawText absent/null OK / présent non-string rejet, parsed malformé -> null (rawText gardé).
export function normalizeUserProjectInput(raw: unknown): UserProjectInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.posture !== "string" || !POSTURES.includes(r.posture as ProjectPosture)) return null;
  let intent: ProjectIntent | null = null;
  if (r.intent != null) {
    if (typeof r.intent !== "string" || !INTENTS.includes(r.intent as ProjectIntent)) return null;
    intent = r.intent as ProjectIntent;
  }
  let rawText: string | null = null;
  if (r.rawText != null) {
    if (typeof r.rawText !== "string") return null;
    rawText = r.rawText;
  }
  return { posture: r.posture as ProjectPosture, intent, rawText, parsed: coerceParsed(r.parsed) };
}

// Estampille SERVEUR. Le temps vient de l'appelant (lib pure, testable).
//
// `preserved` : les confirmations DÉJÀ EN BASE, que le serveur relit et reporte. Sans ce report, le
// premier enregistrement de l'éditeur (qui écrit le projet en entier) effacerait en silence toutes les
// conditions du lecteur. Elles sont reportées telles quelles, y compris celles que le nouveau texte
// rend périmées : une confirmation périmée ne vaut plus, mais elle reste l'historique du geste.
export function stampUserProject(
  input: UserProjectInput, now: string, preserved: unknown = undefined,
): UserProject {
  return withConditions({ ...input, schemaVersion: 2 as const, updatedAt: now }, normalizeConditions(preserved));
}

// Lecture DB, tolérante au legacy. schemaVersion -> 2 (la forme, pas un historique). updatedAt absent
// -> null (jamais 1970). Les confirmations illisibles tombent une à une.
export function normalizeUserProject(raw: unknown): UserProject | null {
  const input = normalizeUserProjectInput(raw);
  if (!input) return null;
  const r = raw as Record<string, unknown>;
  return withConditions(
    { ...input, schemaVersion: 2 as const, updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null },
    normalizeConditions(r.conditions),
  );
}

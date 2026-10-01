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
// FUT-8 : L'IDENTITÉ D'UN ÉLÉMENT, pas d'une position dans un tableau. `instance` désigne l'élément d'une
// famille multiple : le nom normalisé de la ville pour `excludePlace` (« lyon »), le jeton pour
// `excludeZones` (« idf »). `null` (ou absent, en lecture legacy) = la famille entière, ou une famille à
// un seul élément ; `zones` et `departements` sont un seul périmètre, instance `null`.
export type CriterionRef =
  | { kind: "hard"; key: HardConstraintKey; instance?: string | null }
  | { kind: "preference"; key: PreferenceKey; instance?: null };
export type CriterionInstanceRef = CriterionRef;

export type ConditionConfirmation = {
  criterion: CriterionRef;
  fingerprint: string;
  confirmedAt: string;
  // La seule valeur admise. Toute autre provenance (un parseur, une migration, une convention) se lit
  // comme « non confirmé ».
  source: "user";
  // FUT-8 : l'identifiant versionné de la phrase d'interprétation montrée au lecteur au moment de
  // confirmer (« Ici, Bretagne désigne la région dans ses limites actuelles. »). Pour l'audit seulement :
  // il n'entre pas dans l'empreinte, et son absence ne rend pas la confirmation invalide.
  interpretation?: string;
};

// ── LES DÉFINITIONS (FUT-8) : ce que le lecteur a PRÉCISÉ ou ACCEPTÉ comme sens d'un critère ──────────
// Indépendantes des conditions : « à moins de 20 km de Nantes, à vol d'oiseau » est une précision, pas une
// condition sans compromis. Une variante par famille de précision ; la lecture refuse les combinaisons
// impossibles (une métrique « route » sur un temps, une unité sur une région).
export type DistanceMetricDef = "vol_oiseau" | "route";
export type SizeUnitDef = "commune" | "unite_urbaine";
export type PerimetreParisien = "paris" | "petite_couronne" | "agglomeration" | "ile_de_france";

export type DefinitionBody =
  | { kind: "distance_lieu"; metric: DistanceMetricDef; maxKm: number }
  | { kind: "temps_lieu"; mode: "car" | "walk"; maxMinutes: number }
  | { kind: "taille"; unit: SizeUnitDef; min: number | null; max: number | null }
  | { kind: "taille_relative"; unit: SizeUnitDef }
  | { kind: "quitter_ville"; scope: SizeUnitDef }
  | { kind: "perimetre_parisien"; perimetre: PerimetreParisien }
  // Le périmètre géographique ENTIER : une convention acceptée par ancre conventionnelle (macro-zone).
  | { kind: "perimetre_zones"; conventions: { token: string; conventionId: string; conventionVersion: number }[] }
  // Une convention acceptée pour un critère non géographique (plus tard : tailles qualitatives, climat).
  | { kind: "convention"; conventionId: string; conventionVersion: number };

export type Definition = DefinitionBody & {
  criterion: CriterionRef;
  // L'empreinte de la valeur `parsed` de CET élément, telle que le lecteur l'avait sous les yeux. Si le
  // reparse la change, la définition ne vaut plus (elle reste stockée).
  parsedFingerprint: string;
  definedAt: string;
  source: "user";
};

// ── LES ADOPTIONS (FUT-8) : « futur•e m'a proposé ce critère, je le reprends à mon compte » ──────────
// Un choix DURABLE : il survit au changement ou au retrait de l'ancre qui l'a inspiré. `origin` raconte
// d'où vient l'idée ; il ne décide de rien.
export type Adoption = {
  criterion: { kind: "preference"; key: PreferenceKey; instance?: null };
  weight: 1 | 2 | 3;
  origin: { kind: "ancre"; label: string };
  adoptedAt: string;
  source: "user";
};

// ── LES REJETS (FUT-8) : « ce critère proposé automatiquement ne fait pas partie de mon projet » ─────
// Le rejet porte sur le CRITÈRE, quelle que soit la ville qui le suggère : remplacer Brest par Lorient ne
// le fait pas revenir. `origin` raconte d'où venait la suggestion au moment du geste ; il ne décide de
// rien. Ordre de priorité de la valeur effective : texte du lecteur > adoption > rejet > suggestion.
export type Rejet = {
  criterion: { kind: "preference"; key: PreferenceKey; instance?: null };
  origin: { kind: "ancre"; labels: string[] };
  rejectedAt: string;
  source: "user";
};

export type UserProject = UserProjectInput & {
  // `schemaVersion` DÉCRIT LA FORME DU CONTRAT, rien d'autre. La v2 dit qu'un projet PEUT porter des
  // `conditions`. Elle n'est ni une trace de migration, ni la preuve que le lecteur a vu le nouveau
  // modèle, ni celle que d'anciennes contraintes ont été confirmées : un projet legacy lu aujourd'hui
  // est exposé en v2, sans aucune confirmation.
  // v3 (FUT-8) : la forme peut porter `definitions` et `adoptions`. Toujours une forme, jamais un historique.
  schemaVersion?: 3; // optionnel pour l'ergonomie de construction ; le serveur l'écrit toujours
  updatedAt: string | null; // estampille serveur ; null = inconnue (jamais une date inventée)
  // Absent = aucune condition confirmée. Jamais vide en base : on n'écrit pas un tableau vide.
  conditions?: ConditionConfirmation[];
  // FUT-8. Absents = aucune précision, aucune adoption. Jamais vides en base.
  definitions?: Definition[];
  adoptions?: Adoption[];
  rejets?: Rejet[];
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
  if (!((o.kind === "hard" || o.kind === "preference") && typeof o.key === "string" && o.key.length > 0)) return false;
  // Une instance est une chaîne non vide, ou rien. Une préférence n'a pas d'instance.
  if (o.instance != null && (o.kind === "preference" || typeof o.instance !== "string" || o.instance.length === 0)) return false;
  return true;
}

function refDe(o: CriterionRef): CriterionRef {
  return o.kind === "hard"
    ? { kind: "hard", key: o.key, instance: o.instance ?? null }
    : { kind: "preference", key: o.key, instance: null };
}

const finitePos = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const borne = (n: unknown): n is number | null => n === null || finitePos(n);
const UNITES = new Set(["commune", "unite_urbaine"]);

// Le CORPS d'une définition, validé variante par variante. Ce qui ne colle pas à sa variante tombe.
function definitionBody(o: Record<string, unknown>): DefinitionBody | null {
  switch (o.kind) {
    case "distance_lieu":
      return (o.metric === "vol_oiseau" || o.metric === "route") && finitePos(o.maxKm)
        ? { kind: "distance_lieu", metric: o.metric, maxKm: o.maxKm } : null;
    case "temps_lieu":
      return (o.mode === "car" || o.mode === "walk") && finitePos(o.maxMinutes)
        ? { kind: "temps_lieu", mode: o.mode, maxMinutes: o.maxMinutes } : null;
    case "taille":
      return UNITES.has(o.unit as string) && borne(o.min) && borne(o.max) && (o.min != null || o.max != null)
        ? { kind: "taille", unit: o.unit as SizeUnitDef, min: o.min, max: o.max } : null;
    case "taille_relative":
      return UNITES.has(o.unit as string) ? { kind: "taille_relative", unit: o.unit as SizeUnitDef } : null;
    case "quitter_ville":
      return UNITES.has(o.scope as string) ? { kind: "quitter_ville", scope: o.scope as SizeUnitDef } : null;
    case "perimetre_parisien":
      return ["paris", "petite_couronne", "agglomeration", "ile_de_france"].includes(o.perimetre as string)
        ? { kind: "perimetre_parisien", perimetre: o.perimetre as PerimetreParisien } : null;
    case "perimetre_zones": {
      if (!Array.isArray(o.conventions) || o.conventions.length === 0) return null;
      const conventions = o.conventions.flatMap((c) => {
        const x = (c ?? {}) as Record<string, unknown>;
        return typeof x.token === "string" && x.token && typeof x.conventionId === "string" && x.conventionId
          && Number.isInteger(x.conventionVersion) && (x.conventionVersion as number) > 0
          ? [{ token: x.token, conventionId: x.conventionId, conventionVersion: x.conventionVersion as number }]
          : [];
      });
      return conventions.length === o.conventions.length ? { kind: "perimetre_zones", conventions } : null;
    }
    case "convention":
      return typeof o.conventionId === "string" && o.conventionId && Number.isInteger(o.conventionVersion)
        && (o.conventionVersion as number) > 0
        ? { kind: "convention", conventionId: o.conventionId, conventionVersion: o.conventionVersion as number } : null;
    default:
      return null;
  }
}

// LES DÉFINITIONS LUES EN BASE, tolérantes : une entrée illisible tombe, jamais le projet. La compatibilité
// entre la variante et la famille du critère (une unité sur une région, par exemple) se vérifie à
// l'usage, là où la famille est connue (cf. decision/effective-value.ts).
export function normalizeDefinitions(raw: unknown): Definition[] {
  if (!Array.isArray(raw)) return [];
  const out: Definition[] = [];
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    if (o.source !== "user" || !isCriterionRef(o.criterion)) continue;
    if (typeof o.parsedFingerprint !== "string" || !o.parsedFingerprint) continue;
    if (typeof o.definedAt !== "string" || Number.isNaN(Date.parse(o.definedAt))) continue;
    const body = definitionBody(o);
    if (!body) continue;
    out.push({ ...body, criterion: refDe(o.criterion), parsedFingerprint: o.parsedFingerprint, definedAt: o.definedAt, source: "user" });
  }
  return out;
}

export function normalizeRejets(raw: unknown): Rejet[] {
  if (!Array.isArray(raw)) return [];
  const out: Rejet[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const c = o.criterion as Record<string, unknown> | undefined;
    const origin = o.origin as Record<string, unknown> | undefined;
    if (o.source !== "user" || !c || c.kind !== "preference" || typeof c.key !== "string" || !c.key || c.instance != null) continue;
    if (!origin || origin.kind !== "ancre" || !Array.isArray(origin.labels)) continue;
    if (typeof o.rejectedAt !== "string" || Number.isNaN(Date.parse(o.rejectedAt))) continue;
    const labels = origin.labels.filter((l): l is string => typeof l === "string" && l.length > 0);
    out.push({ criterion: { kind: "preference", key: c.key as PreferenceKey, instance: null }, origin: { kind: "ancre", labels }, rejectedAt: o.rejectedAt, source: "user" });
  }
  return out;
}

export function normalizeAdoptions(raw: unknown): Adoption[] {
  if (!Array.isArray(raw)) return [];
  const out: Adoption[] = [];
  for (const a of raw) {
    if (!a || typeof a !== "object") continue;
    const o = a as Record<string, unknown>;
    const c = o.criterion as Record<string, unknown> | undefined;
    const origin = o.origin as Record<string, unknown> | undefined;
    if (o.source !== "user" || !c || c.kind !== "preference" || typeof c.key !== "string" || !c.key) continue;
    if (c.instance != null) continue;
    if (o.weight !== 1 && o.weight !== 2 && o.weight !== 3) continue;
    if (!origin || origin.kind !== "ancre" || typeof origin.label !== "string" || !origin.label) continue;
    if (typeof o.adoptedAt !== "string" || Number.isNaN(Date.parse(o.adoptedAt))) continue;
    out.push({
      criterion: { kind: "preference", key: c.key as PreferenceKey, instance: null },
      weight: o.weight, origin: { kind: "ancre", label: origin.label }, adoptedAt: o.adoptedAt, source: "user",
    });
  }
  return out;
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
      criterion: refDe(o.criterion),
      fingerprint: o.fingerprint, confirmedAt: o.confirmedAt, source: "user",
      ...(typeof o.interpretation === "string" && o.interpretation ? { interpretation: o.interpretation.slice(0, 200) } : {}),
    });
  }
  return out;
}

// Un tableau vide ne s'écrit pas : `conditions` absent et `conditions: []` disent la même chose, et un
// `undefined` explicite casserait la sérialisation stable des artefacts.
function withConditions<T extends object>(base: T, conditions: ConditionConfirmation[]): T & { conditions?: ConditionConfirmation[] } {
  return conditions.length > 0 ? { ...base, conditions } : base;
}

// Les trois structures écrites par les GESTES du lecteur, lues ensemble. Une structure vide ne s'écrit pas.
function withGestes<T extends object>(base: T, raw: { conditions?: unknown; definitions?: unknown; adoptions?: unknown; rejets?: unknown }): T & {
  conditions?: ConditionConfirmation[]; definitions?: Definition[]; adoptions?: Adoption[]; rejets?: Rejet[];
} {
  const definitions = normalizeDefinitions(raw.definitions);
  const adoptions = normalizeAdoptions(raw.adoptions);
  const rejets = normalizeRejets(raw.rejets);
  return {
    ...withConditions(base, normalizeConditions(raw.conditions)),
    ...(definitions.length > 0 ? { definitions } : {}),
    ...(adoptions.length > 0 ? { adoptions } : {}),
    ...(rejets.length > 0 ? { rejets } : {}),
  };
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
// `existant` (FUT-8) : le projet DÉJÀ EN BASE. Ses conditions, définitions et adoptions sont reportées,
// telles quelles : un enregistrement du texte ne les efface jamais, et une écriture générique ne peut pas
// en fabriquer (le navigateur ne les envoie pas, `normalizeUserProjectInput` les ignore).
export function stampUserProject(
  input: UserProjectInput, now: string, existant: unknown = undefined,
): UserProject {
  const e = (existant && typeof existant === "object" ? existant : {}) as Record<string, unknown>;
  return withGestes({ ...input, schemaVersion: 3 as const, updatedAt: now }, e);
}

// Lecture DB, tolérante au legacy. schemaVersion -> 2 (la forme, pas un historique). updatedAt absent
// -> null (jamais 1970). Les confirmations illisibles tombent une à une.
export function normalizeUserProject(raw: unknown): UserProject | null {
  const input = normalizeUserProjectInput(raw);
  if (!input) return null;
  const r = raw as Record<string, unknown>;
  return withGestes(
    { ...input, schemaVersion: 3 as const, updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null },
    r,
  );
}

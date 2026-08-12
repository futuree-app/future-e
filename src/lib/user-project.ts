// Projet de l'utilisateur, persisté au compte (colonne jsonb user_project). Lib PURE.
// On sépare l'ENTRÉE client (UserProjectInput) du PERSISTÉ (UserProject, estampillé serveur avec
// schemaVersion + updatedAt). Doctrine : on ne devine jamais (posture requise, intent invalide rejeté,
// date absente -> null jamais inventée) ; rawText survit à un parse en échec.
import type { ParsedProject } from "./comparateur-vie.ts";

export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location";

export type UserProjectInput = {
  posture: ProjectPosture;
  intent: ProjectIntent | null;
  rawText: string | null;
  parsed: ParsedProject | null;
};

export type UserProject = UserProjectInput & {
  schemaVersion?: 1; // optionnel pour l'ergonomie de construction ; le serveur l'écrit toujours
  updatedAt: string | null; // estampille serveur ; null = inconnue (jamais une date inventée)
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

// Validation de l'ENTRÉE client. posture requise (rejet), intent absent/null OK / présent-invalide
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
export function stampUserProject(input: UserProjectInput, now: string): UserProject {
  return { ...input, schemaVersion: 1, updatedAt: now };
}

// Lecture DB, tolérante au legacy. schemaVersion -> 1. updatedAt absent -> null (jamais 1970).
export function normalizeUserProject(raw: unknown): UserProject | null {
  const input = normalizeUserProjectInput(raw);
  if (!input) return null;
  const r = raw as Record<string, unknown>;
  return { ...input, schemaVersion: 1, updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null };
}

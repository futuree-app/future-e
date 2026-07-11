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

// `parsed` valide = objet portant au moins une `reformulation` string. On ne re-valide pas tout le
// ParsedProject ici (il a son propre producteur, /parse) : on garde ou on jette.
function coerceParsed(v: unknown): ParsedProject | null {
  if (v && typeof v === "object" && typeof (v as { reformulation?: unknown }).reformulation === "string") {
    return v as ParsedProject;
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

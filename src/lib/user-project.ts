// Projet de l'utilisateur, persisté au compte (colonne jsonb user_project sur user_profiles).
// Lib PURE (pas server-only) : normalise ce qui vient du client ou de la base, son TYPE est lu
// côté client par le hub. Ne devine jamais : un objet non conforme est rejeté (null), un `parsed`
// malformé retombe sur null en conservant le `rawText` (le texte libre survit au parse, comme la
// source DVF survit à sa version).

import type { ParsedProject } from "./comparateur-vie.ts";

export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location";

export type UserProject = {
  posture: ProjectPosture;
  intent?: ProjectIntent | null;
  rawText: string | null;
  parsed: ParsedProject | null;
  updatedAt: string;
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

export function normalizeUserProject(raw: unknown): UserProject | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.posture !== "string" || !POSTURES.includes(r.posture as ProjectPosture)) return null;
  const intent = typeof r.intent === "string" && INTENTS.includes(r.intent as ProjectIntent) ? (r.intent as ProjectIntent) : null;
  return {
    posture: r.posture as ProjectPosture,
    intent,
    rawText: typeof r.rawText === "string" ? r.rawText : null,
    parsed: coerceParsed(r.parsed),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date(0).toISOString(),
  };
}

export function mergeProjectEdit(
  prev: UserProject | null,
  next: { rawText: string; parsed: ParsedProject | null; posture?: ProjectPosture; intent?: ProjectIntent | null },
): UserProject {
  return {
    posture: next.posture ?? prev?.posture ?? "recherche",
    intent: next.intent ?? prev?.intent ?? null,
    rawText: next.rawText,
    parsed: coerceParsed(next.parsed),
    updatedAt: new Date().toISOString(),
  };
}

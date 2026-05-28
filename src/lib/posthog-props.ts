/**
 * Centralise les propriétés communes pour les événements PostHog.
 * Jamais d'adresse complète ni de donnée personnelle sensible.
 *
 * Distinction sémantique :
 * - report_geo  : territoire analysé par l'utilisateur dans futur•e (prioritaire)
 * - user_geo    : localisation de navigation — non utilisée ici (pas d'IP côté client)
 */

import { regionFromDepartment } from "./regions-fr";

export { regionFromDepartment };

// ─── Géographie ──────────────────────────────────────────────────────────────

export function departmentFromInsee(insee: string | null | undefined): string | null {
  if (!insee || insee.length < 2) return null;
  // Corse : 2A / 2B
  if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
  // DOM-TOM : 971–976
  if (insee.startsWith("97")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

export type GeoContext = {
  commune?: string | null;
  inseeCode?: string | null;
  reportId?: string | null;
};

export function buildGeoProps(ctx: GeoContext) {
  const dept = departmentFromInsee(ctx.inseeCode);
  return {
    commune: ctx.commune ?? null,
    insee_code: ctx.inseeCode ?? null,
    department: dept,
    region: regionFromDepartment(dept),
    report_id: ctx.reportId ?? ctx.inseeCode ?? null,
  };
}

// ─── Modules ─────────────────────────────────────────────────────────────────

/** Catégorie de risque stable associée à chaque module du rapport. */
export const MODULE_RISK_CATEGORY: Record<string, string> = {
  quartier:   "quartier",
  logement:   "logement",
  metier:     "autre",
  sante:      "sante",
  mobilite:   "autre",
  projets:    "autre",
};

/** Ordre d'apparition des modules dans le rapport (base 1). */
export const MODULE_ORDER: Record<string, number> = {
  quartier: 1,
  logement: 2,
  metier:   3,
  sante:    4,
  mobilite: 5,
  projets:  6,
};

export function buildModuleProps(moduleId: string) {
  return {
    risk_category: MODULE_RISK_CATEGORY[moduleId] ?? "autre",
    module_index:  MODULE_ORDER[moduleId] ?? null,
  };
}

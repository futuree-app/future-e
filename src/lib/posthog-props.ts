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

/**
 * Catégorie de risque stable associée à chaque module du rapport.
 *
 * LES ANCIENNES CLÉS RESTENT (metier, sante, mobilite, projets). Ce ne sont pas des reliquats :
 * l'historique PostHog contient des événements portant ces module_id, et les retirer ferait
 * basculer leur `risk_category` sur "autre" au moindre retraitement, réécrivant le passé. Aucun
 * écran ne les émet plus depuis la bascule à trois modules du 29/07/2026.
 */
export const MODULE_RISK_CATEGORY: Record<string, string> = {
  quartier:   "quartier",
  autour:     "quartier",
  logement:   "logement",
  metier:     "autre",
  sante:      "sante",
  mobilite:   "autre",
  projets:    "autre",
};

/**
 * Ordre d'apparition des modules dans le rapport (base 1).
 *
 * `logement` est passé de 2 à 3 le 29/07/2026, quand « Autour de l'adresse » s'est intercalé entre
 * la commune et le bâti. Cet index dit une POSITION D'ÉCRAN, pas une identité : toute comparaison
 * de module_index à cheval sur cette date compare deux mises en page différentes. Pour segmenter
 * un module dans la durée, utiliser module_id.
 */
export const MODULE_ORDER: Record<string, number> = {
  quartier: 1,
  autour:   2,
  logement: 3,
  metier:   4,
  sante:    5,
  mobilite: 6,
  projets:  7,
};

/**
 * Clé SÉMANTIQUE du module, à côté de l'id historique.
 *
 * `module_id` continue de valoir "quartier" pour le module Territoire : c'est ce que dix mois
 * d'événements portent déjà, et le réécrire mentirait sur le passé. Mais ce nom signifie
 * aujourd'hui l'inverse de ce qu'il suggère — le « quartier », au sens courant, c'est le module
 * `autour`. Toute requête écrite de mémoire sur "quartier" se trompe donc de module.
 *
 * On émet les deux à partir d'ici : l'id legacy pour la continuité, la clé sémantique pour que
 * les analyses futures n'aient pas à connaître cette histoire.
 */
const MODULE_SEMANTIC_KEY: Record<string, string> = {
  quartier: "territory",
  autour:   "surroundings",
  logement: "housing",
};

export function buildModuleProps(moduleId: string) {
  return {
    risk_category:      MODULE_RISK_CATEGORY[moduleId] ?? "autre",
    module_index:       MODULE_ORDER[moduleId] ?? null,
    module_semantic_key: MODULE_SEMANTIC_KEY[moduleId] ?? null,
  };
}

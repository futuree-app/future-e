// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DIAGNOSTICS TROUVÉS À UNE ADRESSE, SANS EN ATTRIBUER AUCUN AU LOGEMENT.
//
// POURQUOI CE MODULE EXISTE. Au 31/07/2026, le module Logement se BLOQUAIT tant que le lecteur
// n'avait pas désigné son diagnostic parmi les candidats de l'adresse. À 1 Place du Capitole à
// Toulouse, la base en contient vingt-quatre, présentés comme « appartement · 10,2 m² · Etage 4 ;
// Porte 37 · 2026 ». Quelqu'un qui ENVISAGE d'acheter ne connaît ni l'étage ni le numéro de porte :
// il ne pouvait pas répondre, donc il ne voyait pas le dossier qu'il venait de payer. Et s'il
// répondait « mon logement n'est pas dans cette liste », la section Énergie se réduisait à une
// phrase.
//
// Le blocage était une décision produit assumée (« on choisit avant le rapport pour que le
// Passeport s'affiche rempli »). Elle est RENVERSÉE : la confirmation enrichit le dossier, son
// absence ne le bloque plus.
//
// LA RÈGLE QUI GOUVERNE TOUT LE FICHIER : ce qui est décrit ici est un CONTEXTE D'ADRESSE, jamais
// une caractéristique du logement examiné. Un diagnostic voisin ne dit rien de ce logement-ci, et
// le présenter comme s'il en disait quelque chose serait le défaut le plus grave que ce produit
// puisse commettre.
//
// AUCUNE MOYENNE, JAMAIS. Une moyenne entre un studio, un T4 et un local fabrique une valeur
// unique qui se lit comme LA réponse, alors qu'elle ne décrit aucun logement réel. Une répartition
// et des bornes se lisent pour ce qu'elles sont : de la dispersion.
//
// Pur, sans `server-only` : appelé côté client par le module Logement, et testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { LABEL_ORDER, type DpeLabel, type DpeRecord } from "./dpe-attribution.ts";

/** Un logement d'habitation. Écarte les diagnostics tertiaires, qui ne comparent rien d'utile. */
function isResidential(t: string | null): boolean {
  const s = (t ?? "").toLowerCase();
  return s.includes("maison") || s.includes("appartement") || s.includes("appart");
}

/** Un diagnostic à l'échelle de l'IMMEUBLE, qui concerne le bâtiment et non un logement. */
function isCollective(m: string | null): boolean {
  return (m ?? "").toLowerCase().includes("immeuble");
}

export type LabelCount = { label: DpeLabel; count: number };

export type AddressDpeContext = {
  /** Tous les diagnostics rattachés à l'adresse, tertiaire compris. */
  total: number;
  /** Ceux qui portent une classe ET concernent un logement : la matière comparable. */
  labelled: number;
  /** Répartition des classes, ordonnée de A à G. Vide si moins de deux classes connues. */
  distribution: LabelCount[];
  /** Les deux bornes observées. `null` sous trois diagnostics classés : trop peu pour un repère. */
  spread: { min: DpeLabel; max: DpeLabel } | null;
  /** Années des diagnostics. `null` si aucune date exploitable. */
  years: { min: number; max: number } | null;
  /** Surfaces observées, en m². `null` si aucune. Bornes, jamais une moyenne. */
  surfaces: { min: number; max: number } | null;
  /** Types de bâtiment distincts, tels que l'ADEME les nomme. */
  buildingTypes: string[];
  /** Au moins un diagnostic porte sur l'immeuble entier. */
  hasCollective: boolean;
};

function bounds(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Assemble le contexte d'une adresse. Rend `null` quand il n'y a rien à décrire : sans diagnostic,
 * il n'y a pas de contexte, et afficher un bloc vide vaudrait moins que ne rien afficher.
 */
export function buildAddressDpeContext(candidates: DpeRecord[]): AddressDpeContext | null {
  if (candidates.length === 0) return null;

  const residential = candidates.filter((c) => isResidential(c.type_batiment));
  const labels = residential
    .map((c) => c.etiquette_dpe)
    .filter((l): l is DpeLabel => l != null);

  const counts = new Map<DpeLabel, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const distribution: LabelCount[] =
    counts.size >= 2
      ? LABEL_ORDER.filter((l) => counts.has(l)).map((l) => ({ label: l, count: counts.get(l)! }))
      : [];

  // Le seuil de trois est celui qui gouvernait déjà l'ancien contexte : sous trois diagnostics
  // classés, deux bornes ne décrivent pas une dispersion, elles décrivent deux cas.
  const idx = labels.map((l) => LABEL_ORDER.indexOf(l)).filter((i) => i >= 0);
  const spread =
    idx.length >= 3
      ? { min: LABEL_ORDER[Math.min(...idx)], max: LABEL_ORDER[Math.max(...idx)] }
      : null;

  const years = bounds(
    candidates
      .map((c) => (c.date_dpe ? Number.parseInt(c.date_dpe.slice(0, 4), 10) : Number.NaN))
      .filter((y) => Number.isFinite(y)),
  );

  const surfaces = bounds(
    residential.map((c) => c.surface_m2).filter((s): s is number => s != null && s > 0),
  );

  const buildingTypes = [
    ...new Set(candidates.map((c) => c.type_batiment).filter((t): t is string => Boolean(t))),
  ];

  return {
    total: candidates.length,
    labelled: labels.length,
    distribution,
    spread,
    years,
    surfaces,
    buildingTypes,
    hasCollective: candidates.some((c) => isCollective(c.methode_dpe)),
  };
}

/**
 * La phrase d'ouverture du bloc, écrite pour un lecteur.
 *
 * Elle dit d'abord COMBIEN, puis qu'aucun n'est attribuable. L'ordre compte : commencer par
 * l'absence d'attribution ferait lire « on n'a rien », alors que la matière existe et qu'elle a
 * une valeur, celle de savoir quoi demander au vendeur.
 */
export function addressContextLead(ctx: AddressDpeContext): string {
  if (ctx.total === 1) {
    return "Un diagnostic est rattaché à cette adresse, sans qu'on puisse établir qu'il porte sur ce logement.";
  }
  return `${ctx.total} diagnostics sont rattachés à cette adresse. Aucun ne peut être attribué avec certitude au logement examiné.`;
}

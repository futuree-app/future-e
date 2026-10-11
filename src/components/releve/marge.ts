// FUT-91 · LA MARGE DE PREUVE ET LA TEINTE DES SECTIONS, en logique pure (testée sans rendu).
//
// LES LIENS DE PREUVE PORTENT LA PROVENANCE (parité FUT-91) : `evidenceHref(cible, href, provenance)`.
// Quand le dossier servi vient d'un artefact daté, le lien rouvre la donnée de CETTE version, pas celle
// d'aujourd'hui. Le prototype FUT-87 l'omettait.
import { evidenceHref } from "../../lib/decision/evidence-targets.ts";
import { dateFr } from "../../lib/decision/autour-permis.ts";
import type { EntreeLue, PreuveLue, GrainLu, SectionLue } from "./lecture-dossier.ts";
import type { ElementDeMarge, GrainCle } from "./primitives.tsx";

/** La teinte d'un registre : celle de la charte, en jeton. Une teinte inconnue tombe sur le non su. */
export const TEINTE_REGISTRE: Record<string, string> = {
  incompatibilities: "var(--reg-incompatibilite)",
  alignments: "var(--reg-alignement)",
  mismatches: "var(--reg-ecart)",
  compromises: "var(--reg-compromis)",
  unknowns: "var(--reg-non-su)",
  verifications: "var(--reg-controle)",
  condition_check: "var(--reg-controle)",
  condition_met: "var(--reg-alignement)",
};

const GRAIN_EN_MARGE: Record<GrainLu, string> = {
  commune: "à l'échelle de la commune",
  unite_urbaine: "à l'échelle de l'agglomération",
  secteur: "dans le secteur",
  adresse: "à cette adresse",
};

const observee = (p: PreuveLue) => (p.date && dateFr(p.date) ? `observée le ${dateFr(p.date)}` : undefined);

/**
 * LA MARGE D'UNE CARTE : tous ses grains, puis ses preuves chiffrées, puis ses sources nommées. Une
 * source sans valeur reste un lien quand elle en a un ; une carte à grains mêlés donne à chaque preuve
 * son propre glyphe. Rien n'est fabriqué : une marge sans preuve reste vide.
 */
export function margeDe(
  e: { grains: GrainLu[]; preuves: PreuveLue[]; sources: PreuveLue[] }, provenance?: string,
): ElementDeMarge[] {
  const lien = (p: PreuveLue) => (p.href ? evidenceHref(p.cible, p.href, provenance) : undefined);
  const grainParPreuve = e.grains.length !== 1;
  const propre = (p: PreuveLue) => (grainParPreuve ? { grain: p.grain as GrainCle } : {});
  return [
    ...e.grains.map((g) => ({ type: "grain" as const, grain: g as GrainCle, libelle: GRAIN_EN_MARGE[g] })),
    ...e.preuves.map((p) => ({
      type: "valeur" as const, libelle: p.href ? "Preuve" : p.libelle, valeur: p.valeur ?? p.libelle,
      href: lien(p), date: observee(p), ...propre(p),
    })),
    ...e.sources.map((p) => ({
      type: "source" as const, texte: `Source : ${p.libelle}`, href: lien(p), date: observee(p), ...propre(p),
    })),
  ];
}

/**
 * LA TEINTE D'UNE SECTION, une seule règle pour le sommaire, l'en-tête et les cartes. Celle de la
 * production : la section des conditions ne prend le rouge de l'incompatibilité que si elle en porte
 * une ; des conditions ouvertes ou remplies ne sont pas un blocage (FUT-7).
 */
export function teinteSection(section: Pick<SectionLue, "cle" | "entrees">): string {
  if (section.cle === "incompatibilities" && !section.entrees.some((x) => x.nature === "incompatibility")) return "var(--reg-controle)";
  return TEINTE_REGISTRE[section.cle] ?? "var(--reg-non-su)";
}

export function teinteEntree(teinteDeSection: string, e: EntreeLue): string {
  if (e.nature === "condition_check") return TEINTE_REGISTRE.condition_check!;
  if (e.nature === "condition_met") return TEINTE_REGISTRE.condition_met!;
  return teinteDeSection;
}


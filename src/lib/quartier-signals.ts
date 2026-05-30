// Dérive les sources mobilisées pour la synthèse Quartier (chips footer)
// et fournit un fallback statique quand l'IA échoue.
//
// La voix éditoriale et les chiffres incarnés vivent dans le prompt système
// + les cartes QuartierAside affichées plus bas dans la page. On ne duplique
// pas les signaux ici.

import type { EnrichmentResult } from "@/lib/commune-enrichment";
import type { GeorisquesSummary, GasparCatnatSummary } from "@/lib/georisques";
import type { HorizonKey } from "@/hooks/useHorizon";

export type QuartierSourceKey =
  | "DRIAS"
  | "Géorisques"
  | "GASPAR"
  | "VigiEau"
  | "Hub'Eau"
  | "ADEME";

export function deriveQuartierSources(
  enrichment: EnrichmentResult | null,
  georisques: GeorisquesSummary | null,
  catnat: GasparCatnatSummary | null,
  horizon: HorizonKey,
): QuartierSourceKey[] {
  const sources = new Set<QuartierSourceKey>();

  if (enrichment?.drias?.commune.s?.[horizon]?.v) sources.add("DRIAS");
  if (enrichment?.vigieau?.maxLevel) sources.add("VigiEau");
  if (georisques?.flags.flood || georisques?.flags.marineSubmersion) {
    sources.add("Géorisques");
  }
  if (catnat && catnat.total > 0) sources.add("GASPAR");
  if (enrichment?.eau?.drought) sources.add("Hub'Eau");
  if (enrichment?.ademe?.commune.territoire) sources.add("ADEME");

  return Array.from(sources);
}

/**
 * Résumé statique court utilisé quand la synthèse IA échoue.
 * Générique à dessein : pas d'ambition éditoriale, juste éviter le curseur
 * figé sur "Lecture en cours…".
 */
export function buildFallbackSummary(communeName: string | null, horizonYear: string): string {
  const name = communeName ?? "Votre commune";
  return `${name} évolue avec le climat. Les indicateurs sourcés ci-dessous montrent les transformations attendues à l'horizon ${horizonYear} : chaleur, sécheresse des sols, exposition aux risques et tensions sur l'eau. La lecture éditoriale détaillée n'a pas pu être générée, mais les chiffres restent valables.`;
}

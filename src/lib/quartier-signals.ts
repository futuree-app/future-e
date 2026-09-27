// Dérive les sources mobilisées (chips footer) pour l'aperçu avant paiement (quartier-preview).
// La page Territoire lit les siennes dans son FactsSnapshot (src/lib/territoire/screen.ts), et son
// texte de secours est désormais une vraie synthèse déterministe (FUT-6).
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
  | "ADEME"
  | "INSEE";

export function deriveQuartierSources(
  enrichment: EnrichmentResult | null,
  georisques: GeorisquesSummary | null,
  catnat: GasparCatnatSummary | null,
  horizon: HorizonKey,
  /** Contexte territoire (rôle/agglomération, démographie, saisonnalité) mobilisé
   *  par le prompt de synthèse : vient de l'index comparateur + la base logement
   *  INSEE, pas des sources ci-dessus. Absent par défaut (ex. quartier-preview.ts
   *  ne les charge pas), à passer explicitement quand le contexte est chargé. */
  hasTerritoryContext = false,
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
  if (hasTerritoryContext) sources.add("INSEE");

  return Array.from(sources);
}

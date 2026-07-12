// Mapping PUR commune -> ModuleFacts. Imports type-only (aucun chargement de comparateur-vie, qui
// est server-only) : c'est ici que vit la doctrine « absence de donnée jamais un résultat » (catnat
// et risque absents -> null, jamais 0), donc c'est ce qui doit être testable en isolation.
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { ModuleFacts } from "./decision-fact.ts";

export function mapCommuneToModuleFacts(
  entry: IndexCommune,
  scores: Partial<Record<PreferenceKey, number | null>>,
  opts: { hasAddress: boolean },
): ModuleFacts {
  return {
    insee: entry.insee,
    nom: entry.nom,
    distanceCoteKm: entry.distance_cote_km,
    population: entry.population ?? null,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation ? entry.inondation.catnat : null,
    inondationRisque: entry.inondation ? entry.inondation.risque : null,
    scores,
    hasAddress: opts.hasAddress,
  };
}

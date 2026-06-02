// ─── Socle de contexte territorial commun (commune) ───────────────────────
// Agrégateur unique des sources à l'échelle COMMUNE. Une source branchée ici
// est disponible partout où le contexte territorial est utile, sans dupliquer
// fetchs et logique :
//   - /api/synthesize-quartier (synthèse IA Quartier)
//   - /api/ask + /api/ask/context (AskFuture)
//   - page /rapport/quartier (cartes, chips sources)
//   - futurs modules IA / Suivi
//
// Les sources sont fetchées en parallèle et peuvent échouer indépendamment :
// on garde ce qu'on a, on déclare honnêtement ce qu'on n'a pas. Chaque lib a
// son propre cache (next: { revalidate } ou cache mémoire), donc une 2e
// lecture de la même commune ne re-fetch pas.
//
// Vit dans un module lib (et non un route.ts) pour être importable par
// plusieurs routes sans qu'un handler importe l'autre.

import { getCommuneFullData, type CommuneFullData } from "@/lib/commune-data";
import { getClimatDataCommune } from "@/lib/drias-json";
import { getEaufranceSummary, type EaufranceSummary } from "@/lib/eaufrance";
import { getVigieauSummary, type VigieauSummary } from "@/lib/vigieau";
import {
  getGeorisquesSummary,
  getGasparCatnatSummary,
  type GeorisquesSummary,
  type GasparCatnatSummary,
} from "@/lib/georisques";
import { getLittoralSummary, type LittoralSummary } from "@/lib/littoral";

export type ClimatData = Awaited<ReturnType<typeof getClimatDataCommune>>;

export type EnrichmentResult = {
  ademe: CommuneFullData | null;
  drias: ClimatData;
  eau: EaufranceSummary | null;
  vigieau: VigieauSummary | null;
  georisques: GeorisquesSummary | null;
  catnat: GasparCatnatSummary | null;
  littoral: LittoralSummary | null;
};

export async function gatherCommuneEnrichment(
  insee: string,
): Promise<EnrichmentResult> {
  const [ademeRes, driasRes, eauRes, vigieauRes, georisquesRes, catnatRes, littoralRes] =
    await Promise.allSettled([
      getCommuneFullData(insee),
      getClimatDataCommune(insee),
      getEaufranceSummary(insee),
      getVigieauSummary(insee),
      getGeorisquesSummary(insee),
      getGasparCatnatSummary(insee),
      getLittoralSummary(insee),
    ]);

  return {
    ademe: ademeRes.status === "fulfilled" ? ademeRes.value : null,
    drias: driasRes.status === "fulfilled" ? driasRes.value : null,
    eau: eauRes.status === "fulfilled" ? eauRes.value : null,
    vigieau: vigieauRes.status === "fulfilled" ? vigieauRes.value : null,
    georisques: georisquesRes.status === "fulfilled" ? georisquesRes.value : null,
    catnat: catnatRes.status === "fulfilled" ? catnatRes.value : null,
    littoral: littoralRes.status === "fulfilled" ? littoralRes.value : null,
  };
}

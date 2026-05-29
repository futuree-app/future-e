// ─── Enrichissement multi-sources (ADEME, DRIAS, Hub'Eau, VigiEau) ────────
// Les sources sont fetchées en parallèle. Chaque source peut échouer
// indépendamment ; on garde ce qu'on a et on déclare honnêtement ce qu'on
// n'a pas. Caches framework déjà en place (next: { revalidate }) dans les
// libs respectives, donc la deuxième question d'une même session pour la
// même commune ne re-fetch pas.
//
// Vit dans un module lib (et non dans un route.ts) pour être importable à la
// fois par POST /api/ask et par le pré-warm GET /api/ask/context, sans qu'un
// route handler importe l'autre.

import { getCommuneFullData, type CommuneFullData } from "@/lib/commune-data";
import { getClimatDataCommune } from "@/lib/drias-json";
import { getEaufranceSummary, type EaufranceSummary } from "@/lib/eaufrance";
import { getVigieauSummary, type VigieauSummary } from "@/lib/vigieau";

export type ClimatData = Awaited<ReturnType<typeof getClimatDataCommune>>;

export type EnrichmentResult = {
  ademe: CommuneFullData | null;
  drias: ClimatData;
  eau: EaufranceSummary | null;
  vigieau: VigieauSummary | null;
};

export async function gatherCommuneEnrichment(
  insee: string,
): Promise<EnrichmentResult> {
  const [ademeRes, driasRes, eauRes, vigieauRes] = await Promise.allSettled([
    getCommuneFullData(insee),
    getClimatDataCommune(insee),
    getEaufranceSummary(insee),
    getVigieauSummary(insee),
  ]);

  return {
    ademe: ademeRes.status === "fulfilled" ? ademeRes.value : null,
    drias: driasRes.status === "fulfilled" ? driasRes.value : null,
    eau: eauRes.status === "fulfilled" ? eauRes.value : null,
    vigieau: vigieauRes.status === "fulfilled" ? vigieauRes.value : null,
  };
}

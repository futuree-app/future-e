// ─── Socle de contexte territorial commun (commune) ───────────────────────
// Agrégateur unique des sources à l'échelle COMMUNE. Une source branchée ici
// est disponible partout où le contexte territorial est utile, sans dupliquer
// fetchs et logique :
//   - /api/synthesize-quartier (synthèse IA Quartier)
//   - /api/ask + /api/ask/context (AskFuture, seuls à demander l'eau potable)
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
import { getEauPotableCommune } from "@/lib/server/eau-potable";
import type { EauPotableCommune } from "@/lib/eau-potable";
import { getVigieauSummary, type VigieauSummary } from "@/lib/vigieau";
import {
  getGeorisquesSummary,
  getGasparCatnatSummary,
  type GeorisquesSummary,
  type GasparCatnatSummary,
} from "@/lib/georisques";
import { getLittoralSummary, type LittoralSummary } from "@/lib/littoral";
import { getBaignadeSummary, type BaignadeSummary } from "@/lib/baignade";

export type ClimatData = Awaited<ReturnType<typeof getClimatDataCommune>>;

export type EnrichmentResult = {
  ademe: CommuneFullData | null;
  drias: ClimatData;
  /** L'écoulement des cours d'eau (ONDE). L'eau potable n'y est plus : elle vit dans `eauPotable`. */
  eau: EaufranceSummary | null;
  /**
   * FUT-164 · L'EAU POTABLE, RÉSEAU PAR RÉSEAU (lecture FUT-152). Lue seulement pour l'assistant
   * (`avecEauPotable`) : aucun écran ne l'affiche, et la synthèse Territoire n'en a pas l'usage. Absente =
   * non demandée ; `{ etat: "indisponible" }` = demandée, source en panne.
   */
  eauPotable?: EauPotableCommune;
  vigieau: VigieauSummary | null;
  georisques: GeorisquesSummary | null;
  catnat: GasparCatnatSummary | null;
  littoral: LittoralSummary | null;
  baignade: BaignadeSummary;
  /**
   * FUT-160 · LES LECTURES GÉORISQUES QUI ONT ÉCHOUÉ. Leur `null` ci-dessus est celui d'une panne, et le
   * dire ici évite qu'un lecteur en aval le confonde avec une donnée non collectée.
   */
  indisponibles: { georisques: boolean; catnat: boolean };
};

export async function gatherCommuneEnrichment(
  insee: string,
  options: { avecEauPotable?: boolean } = {},
): Promise<EnrichmentResult> {
  const [ademeRes, driasRes, eauRes, vigieauRes, georisquesRes, catnatRes, littoralRes, baignadeRes, eauPotableRes] =
    await Promise.allSettled([
      getCommuneFullData(insee),
      getClimatDataCommune(insee),
      getEaufranceSummary(insee),
      getVigieauSummary(insee),
      getGeorisquesSummary(insee),
      getGasparCatnatSummary(insee),
      getLittoralSummary(insee),
      getBaignadeSummary(insee),
      // Ne lève jamais : une panne rend `{ etat: "indisponible" }`.
      options.avecEauPotable ? getEauPotableCommune(insee) : Promise.resolve(undefined),
    ]);

  return {
    ademe: ademeRes.status === "fulfilled" ? ademeRes.value : null,
    drias: driasRes.status === "fulfilled" ? driasRes.value : null,
    eau: eauRes.status === "fulfilled" ? eauRes.value : null,
    vigieau: vigieauRes.status === "fulfilled" ? vigieauRes.value : null,
    georisques: georisquesRes.status === "fulfilled" ? georisquesRes.value : null,
    catnat: catnatRes.status === "fulfilled" ? catnatRes.value : null,
    littoral: littoralRes.status === "fulfilled" ? littoralRes.value : null,
    baignade: baignadeRes.status === "fulfilled" ? baignadeRes.value : null,
    indisponibles: { georisques: georisquesRes.status === "rejected", catnat: catnatRes.status === "rejected" },
    ...(options.avecEauPotable
      ? { eauPotable: eauPotableRes.status === "fulfilled" && eauPotableRes.value ? eauPotableRes.value : { etat: "indisponible" as const } }
      : {}),
  };
}

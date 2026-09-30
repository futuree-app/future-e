// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ÉCRAN TERRITOIRE, LU DANS LE SNAPSHOT (FUT-6, D10).
//
// Les cartes ne lisent plus aucune source : elles reçoivent ce que ce module extrait du
// `FactsSnapshot`, le même dont la synthèse reçoit la projection. Pur.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { factOf, valueOf, type FactsSnapshot } from "../facts/contract.ts";
import type { GwlScenarios } from "./facts.ts";
import type { GeorisquesSummary, GasparCatnatSummary } from "../georisques.ts";
import type { VigieauSummary } from "../vigieau.ts";
import type { EaufranceSummary } from "../eaufrance.ts";
import type { LittoralSummary } from "../littoral.ts";
import type { Era5Trend } from "../era5-trend.ts";
import type { CatnatInondation } from "../decision/catnat-evidence.ts";
import type { HorizonKey } from "./synthesis-contract.ts";

export type TerritoireScreenData = {
  scenarios: GwlScenarios | null;
  /** Seuls les drapeaux lus par les cartes (inondation, submersion) : le reste n'est pas dans le snapshot. */
  georisques: GeorisquesSummary | null;
  territoire: { densite: number | null; incendies: number | null; taux_boisement: number | null } | null;
  vigieau: VigieauSummary | null;
  drought: NonNullable<EaufranceSummary["drought"]> | null;
  catnat: GasparCatnatSummary | null;
  catnatInondationIndex: CatnatInondation | null;
  littoral: LittoralSummary | null;
  saisonnalitePct: number | null;
  logementVacancePct: number | null;
  era5: Era5Trend | null;
};

/**
 * Les cartes attendent encore la FORME des résumés de source (GeorisquesSummary, VigieauSummary) :
 * on la recompose depuis le snapshot, sans jamais relire la source. Les champs que le snapshot ne
 * porte pas (et qu'aucune carte ne lit) restent neutres.
 */
export function screenFromSnapshot(s: FactsSnapshot): TerritoireScreenData {
  const flags = valueOf<{ flood: boolean; marineSubmersion: boolean }>(s, "risk.georisques");
  const vigieauFact = factOf<Omit<VigieauSummary, "consultedAt">>(s, "water.restrictions");
  const forest = valueOf<number>(s, "land.forest_ademe");
  const density = valueOf<number>(s, "place.density");
  return {
    scenarios: valueOf<GwlScenarios>(s, "climate.scenarios"),
    georisques: flags
      ? {
          inseeCode: s.scope.id, communeName: null, riskLabels: [], seismic: null,
          flags: {
            flood: flags.flood, marineSubmersion: flags.marineSubmersion,
            landslide: false, clay: false, storm: false, seismic: false, wildfire: false,
          },
        }
      : null,
    territoire: forest != null || density != null ? { densite: density, incendies: null, taux_boisement: forest } : null,
    // La date de consultation revient ici : la carte la VERBALISE (« État consulté le … »). Un
    // snapshot en panne VigiEau reste une panne (status unavailable), jamais « aucune restriction ».
    vigieau: vigieauFact && vigieauFact.value
      ? ({ ...vigieauFact.value, consultedAt: vigieauFact.observedAt ?? "" } as VigieauSummary)
      : null,
    drought: valueOf<NonNullable<EaufranceSummary["drought"]>>(s, "water.river_drought"),
    catnat: valueOf<GasparCatnatSummary>(s, "risk.catnat"),
    catnatInondationIndex: valueOf<CatnatInondation>(s, "risk.catnat_flood_index"),
    littoral: valueOf<LittoralSummary>(s, "coast.littoral"),
    saisonnalitePct: valueOf<number>(s, "housing.secondary_share"),
    logementVacancePct: valueOf<number>(s, "housing.vacancy_share"),
    era5: valueOf<Era5Trend>(s, "climate.era5_trend"),
  };
}

export type QuartierSourceKey = "DRIAS" | "Géorisques" | "GASPAR" | "VigiEau" | "Hub'Eau" | "ADEME" | "INSEE" | "OSO";

/** La ligne « Sources » sous la synthèse, lue dans le même snapshot que le texte. */
export function sourcesFromSnapshot(s: FactsSnapshot, horizon: HorizonKey): QuartierSourceKey[] {
  const out = new Set<QuartierSourceKey>();
  const scen = valueOf<GwlScenarios>(s, "climate.scenarios");
  if (scen?.[horizon]?.v) out.add("DRIAS");
  const vig = valueOf<{ maxLevel: string | null }>(s, "water.restrictions");
  if (vig?.maxLevel) out.add("VigiEau");
  const flags = valueOf<{ flood: boolean; marineSubmersion: boolean }>(s, "risk.georisques");
  if (flags?.flood || flags?.marineSubmersion) out.add("Géorisques");
  const cn = valueOf<{ total: number }>(s, "risk.catnat");
  if (cn && cn.total > 0) out.add("GASPAR");
  if (valueOf(s, "water.river_drought")) out.add("Hub'Eau");
  if (valueOf(s, "housing.vacancy_share") != null) out.add("ADEME");
  if (valueOf(s, "land.composition")) out.add("OSO");
  if (valueOf(s, "demography.trend") || valueOf(s, "housing.secondary_share") != null) out.add("INSEE");
  return Array.from(out);
}

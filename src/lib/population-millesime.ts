// FUT-109 · LE MILLÉSIME DE LA POPULATION, COMMUNE PAR COMMUNE. La population de l'index est la population
// municipale Insee 2021 (via ADEME), SAUF pour les communes dont le territoire ou le code a changé depuis la
// géographie de cette source : elles portent leur population de référence Insee 2023, au grain du COG 2025.
// Un libellé « 2021 » posé sur toute la France serait donc faux pour elles, et pour les agglomérations qui les
// comptent. Ce module dit, sans rien charger, quel millésime vaut pour une commune ou une unité urbaine.
//
// Table générée par scripts/population/construire-referentiel.mjs (règle : scripts/lib/population-grain.mjs).
import { MILLESIMES_UNITES_URBAINES, POPULATIONS_HORS_GRAIN, SOURCE_POPULATION } from "./population-millesimes.generated.ts";

export { SOURCE_POPULATION };

export type PopulationHorsGrain = (typeof POPULATIONS_HORS_GRAIN)[string];

/** La population au grain du référentiel quand la source ne l'est pas ; `null` quand la source est au grain. */
export function populationHorsGrain(insee: string | null | undefined): PopulationHorsGrain | null {
  return (insee && POPULATIONS_HORS_GRAIN[insee]) || null;
}

/** Le millésime de la population communale que sert l'index pour cette commune. */
export function millesimePopulation(insee: string | null | undefined): number {
  return populationHorsGrain(insee)?.millesime ?? SOURCE_POPULATION.millesime;
}

/**
 * Les millésimes réunis dans la population d'une unité urbaine (somme des populations communales de l'index),
 * du plus ancien au plus récent. Hors unité urbaine, la commune est son propre bassin : son millésime.
 */
export function millesimesAgglomeration(uu: string | null | undefined, insee?: string | null): number[] {
  if (!uu) return [millesimePopulation(insee)];
  return [...(MILLESIMES_UNITES_URBAINES[uu] ?? [SOURCE_POPULATION.millesime])];
}

/**
 * La date du mouvement (fusion, rétablissement, changement de code) qui rend ANCIEN le périmètre des
 * indicateurs communaux publiés dans la géographie de la source (ADEME data_communes, au 01/01/2024) : densité,
 * logements, revenus, accès aux soins y décrivent la commune d'avant. `null` : périmètre à jour.
 * Un rétablissement du jour même de cette géographie n'en fait pas partie : ces indicateurs-là ont été
 * calculés pour la commune rétablie, seule la population 2021 ne l'a pas été.
 */
export function perimetreAnterieur(insee: string | null | undefined): string | null {
  const h = populationHorsGrain(insee);
  return h && h.mouvement > SOURCE_POPULATION.geographie ? h.mouvement : null;
}

/** « en 2021 », ou « selon les chiffres Insee 2021 et 2023 » quand une agglomération mêle deux millésimes. */
export function enMillesimes(annees: readonly number[]): string {
  const u = [...new Set(annees)].sort();
  if (u.length <= 1) return `en ${u[0] ?? SOURCE_POPULATION.millesime}`;
  return `selon les chiffres Insee ${u.slice(0, -1).join(", ")} et ${u.at(-1)}`;
}

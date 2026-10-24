// FUT-109 · Le millésime affiché suit la commune : 2021 pour la source au grain, 2023 pour les communes
// reprises des populations de référence, deux millésimes pour une agglomération qui les mêle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  enMillesimes, millesimePopulation, millesimesAgglomeration, perimetreAnterieur, populationHorsGrain,
} from "./population-millesime.ts";
import { MILLESIMES_UNITES_URBAINES, POPULATIONS_HORS_GRAIN } from "./population-millesimes.generated.ts";

const referentiel = JSON.parse(readFileSync(new URL("../../data/population-referentiel-cog2025.json", import.meta.url), "utf8")) as {
  communes: Record<string, { population: number | null; millesime: number | null; retablissement: boolean; uu: string | null; mouvements: { date: string }[] }>;
};

test("l'extrait généré recopie exactement le référentiel", () => {
  assert.deepEqual(Object.keys(POPULATIONS_HORS_GRAIN).sort(), Object.keys(referentiel.communes).sort());
  for (const [k, r] of Object.entries(referentiel.communes)) {
    const g = POPULATIONS_HORS_GRAIN[k]!;
    assert.deepEqual([g.population, g.millesime, g.retablissement, g.uu], [r.population, r.millesime, r.retablissement, r.uu], k);
    assert.equal(g.mouvement, r.mouvements.map((m) => m.date).sort().at(-1), k);
  }
  for (const uu of new Set(Object.values(referentiel.communes).map((r) => r.uu).filter(Boolean))) {
    assert.ok(MILLESIMES_UNITES_URBAINES[uu!], uu!);
  }
});

test("population communale : 2021 par défaut, 2023 pour une commune reprise", () => {
  assert.equal(millesimePopulation("17300"), 2021); // La Rochelle : source au grain
  assert.equal(millesimePopulation("08053"), 2021); // Bazeilles, fusion du 01/01/2024 déjà regroupée par la source
  assert.equal(millesimePopulation("85165"), 2023); // L'Oie, rétablie le 01/01/2024
  assert.equal(millesimePopulation("93066"), 2023); // Saint-Denis, fusion du 01/01/2025
  assert.equal(millesimePopulation(null), 2021);
  assert.equal(populationHorsGrain("85165")?.population, 1250);
  assert.equal(populationHorsGrain("17300"), null);
});

test("agglomération : les millésimes réunis, jamais un seul millésime présumé", () => {
  assert.deepEqual(millesimesAgglomeration("00851"), [2021, 2023]); // Paris, qui compte Saint-Denis
  assert.deepEqual(millesimesAgglomeration("85213", "85084"), [2023]); // Essarts-en-Bocage, seule dans son UU
  assert.deepEqual(millesimesAgglomeration("00760"), [2021]); // Lyon : aucune commune reprise
  assert.deepEqual(millesimesAgglomeration(null, "85165"), [2023]); // hors UU : le millésime de la commune
});

test("le périmètre ADEME n'est ancien qu'après la géographie de la source", () => {
  assert.equal(perimetreAnterieur("93066"), "2025-01-01");
  assert.equal(perimetreAnterieur("49126"), "2025-01-01");
  assert.equal(perimetreAnterieur("12218"), "2024-03-04");
  // Rétablie le 01/01/2024 : densité et logements 2022 sont calculés pour elle ; seule la population 2021 manquait.
  assert.equal(perimetreAnterieur("85165"), null);
  assert.equal(perimetreAnterieur("17300"), null);
});

test("libellé de millésime", () => {
  assert.equal(enMillesimes([2021]), "en 2021");
  assert.equal(enMillesimes([2023]), "en 2023");
  assert.equal(enMillesimes([2023, 2021, 2021]), "selon les chiffres Insee 2021 et 2023");
});

// FUT-163 (31/10/2026) · L'ÉCOULEMENT DES COURS D'EAU DANS L'ASSISTANT : cinq états, jamais confondus.
//
// Contre-revue indépendante : `formatEcoulementBlock` (FUT-164) lisait `drought: null` comme « pas
// d'observation », alors que FUT-165 distingue une panne (`droughtIndisponible`). Une panne ONDE devenait une
// absence d'observation affirmée ; « Ecoulement non visible » pouvait porter « (assec) » ; un relevé ancien sans
// état sortait « n/a ». Le test porte sur le TEXTE FINAL du `system` transmis au modèle (`construireSystemPrompt`,
// la fonction dont la route passe le résultat à Anthropic), sur une commune réelle des fixtures (Chamonix).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { construireReferentiel, construireSystemPrompt } from "./ask/system-prompt.ts";
import type { EaufranceSummary } from "./eaufrance.ts";

type Enrichment = Parameters<typeof construireSystemPrompt>[0]["enrichment"];
const F = JSON.parse(readFileSync(new URL("./ask/__fixtures__/communes.json", import.meta.url), "utf8")).communes as Record<string, { nom: string; enrichment: Enrichment }>;
const INSEE = "74056";

/** Le `system` exact, pour l'enrichissement réel de Chamonix dont seul `eau` change. */
function system(eau: EaufranceSummary | null): string {
  // FUT-185 : le référentiel ne porte plus de catégories.
  const referentiel = construireReferentiel({ insee: INSEE, nomCommune: "Chamonix-Mont-Blanc" });
  return construireSystemPrompt({ communeName: F[INSEE]!.nom, communeInsee: INSEE, referentiel, enrichment: { ...F[INSEE]!.enrichment, eau }, profile: null });
}
/** Le bloc ONDE seul, tel qu'il apparaît dans le `system`. */
function bloc(eau: EaufranceSummary | null): string {
  const s = system(eau);
  const debut = s.indexOf("[Hub'Eau — écoulement des cours d'eau");
  assert.ok(debut >= 0, "le bloc ONDE figure dans le system");
  const fin = s.indexOf("\n\n", debut);
  return s.slice(debut, fin < 0 ? undefined : fin);
}
const releve = (status: string | null, o: Partial<NonNullable<EaufranceSummary["drought"]>> = {}): EaufranceSummary => ({
  inseeCode: INSEE,
  drought: { lastObservationDate: "2026-10-28", riverName: "le Mas", stationName: "Le Mas à Ansac-sur-Vienne", status, isDry: status === "Assec", ...o },
});
const LIMITE_STATION = "Ce relevé vaut pour ce point d'observation, à cette date. Il ne décrit ni les autres cours d'eau de la commune, ni leur état aujourd'hui.";

test("panne ONDE : « source indisponible lors de la consultation », jamais une absence d'observation", () => {
  for (const eau of [{ inseeCode: INSEE, drought: null, droughtIndisponible: true }, null] as const) {
    const b = bloc(eau);
    assert.match(b, /Source indisponible lors de la consultation/);
    assert.doesNotMatch(b, /aucune observation|Pas d'observation|assec|à sec/i);
  }
});

test("source consultée sans observation : « aucune observation disponible dans la couverture interrogée »", () => {
  const b = bloc({ inseeCode: INSEE, drought: null });
  assert.match(b, /Aucune observation disponible dans la couverture interrogée/);
  assert.doesNotMatch(b, /indisponible|assec|à sec/i);
});

test("assec : dit « assec », avec sa date et sa station, et borné à cette station", () => {
  const b = bloc(releve("Assec"));
  assert.match(b, /Relevé du 28\/10\/2026 à la station « Le Mas à Ansac-sur-Vienne » \(cours d'eau : le Mas\) : assec, le cours d'eau était à sec au point observé\./);
  assert.ok(b.includes(LIMITE_STATION));
});

test("écoulement non visible : l'état exact, jamais un assec", () => {
  // Même avec un booléen ancien resté vrai : l'état brut décide.
  for (const isDry of [false, true]) {
    const b = bloc(releve("Ecoulement non visible", { isDry }));
    assert.match(b, /: « Ecoulement non visible » : l'eau est encore présente au point observé, mais ne s'écoule plus visiblement\. Ce n'est pas un assec\./);
    assert.doesNotMatch(b, /\(assec\)|: assec|à sec au point/);
    assert.ok(b.includes(LIMITE_STATION));
  }
});

test("écoulement visible et observation impossible : l'état publié, sans conclusion ajoutée", () => {
  assert.match(bloc(releve("Ecoulement visible acceptable")), /: « Ecoulement visible acceptable »\./);
  const imp = bloc(releve("Observation impossible"));
  assert.match(imp, /: « Observation impossible » : aucun état n'a été relevé ce jour-là\. Ne concluez rien sur l'écoulement\./);
  assert.doesNotMatch(imp, /assec|à sec/i);
});

test("ancienne observation datée sans état (fixture réelle Chamonix, 26/09/2026) : non vérifiable", () => {
  const b = bloc(F[INSEE]!.enrichment.eau);
  assert.match(b, /Relevé du 26\/09\/2026 sur le cours d'eau « L'Arve » : état non vérifiable \(relevé daté, sans état transmis\)\. Ne concluez ni à un assec, ni à un écoulement\./);
  assert.doesNotMatch(b, /n\/a/);
});

test("aucune généralisation d'une station à la commune, dans aucun état lu", () => {
  for (const s of ["Assec", "Ecoulement non visible", "Ecoulement visible", "Observation impossible", null]) {
    const b = bloc(releve(s));
    assert.ok(b.includes(LIMITE_STATION), String(s));
    assert.doesNotMatch(b, /(les|tous les) cours d'eau de la commune (sont|étaient)|la commune est à sec/i, String(s));
  }
});

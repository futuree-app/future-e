// FUT-45 : la lecture finale d'un dossier ne laisse jamais croire que toute la demande a reçu une réponse.
//   complétude de la lecture (complete / partial / none) ≠ capacité (trancher / apprécier) ≠ orientation.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildConclusionPlan, type ConclusionPlanInput } from "./decision/conclusion-plan.ts";
import { mapCommuneToModuleFacts } from "./decision/module-facts-map.ts";
import { runRules } from "./decision/materiality-rules.ts";
import { assembleDossier } from "./decision/decision-assembler.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "./hard-constraints.ts";
import { budgetRattrape } from "./parse-assainir.ts";
import type { IndexCommune } from "./comparateur-vie.ts";
import type { UserProject } from "./user-project.ts";

const DIR = { byName: () => null, plmByName: () => null };
const village = (): IndexCommune => ({
  insee: "31999", nom: "Saint-Exemple", dept: "31", region: "OCC", lat: 43.5, lon: 1.4, population: 1200, densite: 40,
  mer_centre_km: 150, altitude: 200, clim: {}, pct: {},
} as unknown as IndexCommune);
function projet(prefs: { key: string; weight: number }[], horsMesure: string[] = []): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "x", updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs, horsMesure: horsMesure.map((term) => ({ term, kind: "autre" })) } as unknown as UserProject["parsed"],
  };
}
function dossier(p: UserProject) {
  const e = village();
  const f = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: 1200, tailleVilleSource: "commune" });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, DIR), conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
    point: { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
  };
  return assembleDossier(runRules(f, p, ctx), p, "commune", e.nom);
}
const texte = (d: ReturnType<typeof dossier>) =>
  [d.narrativePlan.verdict.headline.text ?? "", d.narrativePlan.verdict.detail, d.conclusion, ...d.narrativePlan.blocks.map((b) => b.fallbackText)].join(" ");

test("NON-RÉGRESSION : « budget 250 000 € et … » ne peut jamais produire une impression de couverture complète", () => {
  const temoin = dossier(projet([{ key: "eviter_grandes_villes", weight: 3 }]));
  assert.equal(temoin.criteria.coverage, "complete");
  assert.match(temoin.narrativePlan.verdict.label, /^(Bonne correspondance|Correspondance favorable)$/, "témoin : sans budget, la lecture complète peut le dire");
  assert.doesNotMatch(texte(temoin), /incomplète|ne mesure pas/);

  const d = dossier(projet([{ key: "eviter_grandes_villes", weight: 3 }], ["budget 250 000 €"]));
  assert.equal(d.criteria.coverage, "partial");
  assert.notEqual(d.narrativePlan.verdict.label, "Bonne correspondance");
  assert.match(d.narrativePlan.verdict.detail, /La lecture reste incomplète/);
  assert.doesNotMatch(texte(d), /semble bien correspondre à votre projet/);
  assert.match(d.narrativePlan.verdict.detail, /futur•e ne mesure pas encore « budget 250 000 € »/);
  const bloc = d.narrativePlan.blocks.find((b) => b.key === "uncovered_priorities");
  assert.ok(bloc, "le budget a son bloc dans la conclusion");
  assert.match(bloc!.fallbackText, /« budget 250 000 € » : cette demande reste sans réponse dans ce dossier\./);
  assert.ok(bloc!.requiredPhrases?.includes("budget 250 000 €"), "le modèle ne peut pas taire le budget");
  assert.ok(bloc!.allowedNumbers?.includes("250 000"), "le nombre dit par le lecteur est admis");
});

test("F. une demande faite seulement de choses non mesurées : la vraie cause, jamais « la donnée manque ici »", () => {
  const d = dossier(projet([], ["authentique", "chaleureuse"]));
  assert.equal(d.criteria.coverage, "none");
  assert.equal(d.narrativePlan.verdict.headline.text, "futur•e ne mesure pas encore ce que vous avez demandé.");
  assert.match(d.narrativePlan.verdict.detail, /« authentique » et « chaleureuse »/);
  assert.doesNotMatch(texte(d), /données qui permettraient de répondre manquent/);
});

const plan = (over: Partial<ConclusionPlanInput>) => buildConclusionPlan({
  scope: "commune", communeNom: "Brest", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [], shownCompositions: [], uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null,
  coverage: "complete", orientation: "favorable", hasFavorable: true, favorableCount: 1,
  majorReserveCount: 0, reservesShown: 0, mismatchTotal: 0, mismatchShown: 0, ...over,
});

test("un neutre est lu, jamais favorable : « vos critères vont dans ce sens » exige que TOUS le soient", () => {
  const tous = plan({ examinedCount: 2, favorableCount: 2 });
  assert.match(tous.verdict.detail, /vont dans ce sens/);
  const partie = plan({ examinedCount: 3, favorableCount: 2 });
  assert.equal(partie.verdict.detail, "Une partie de vos priorités va dans ce sens.");
});

test("D. donnée absente ici : la phrase de la limite du lieu reste", () => {
  const p = plan({ coverage: "none", orientation: "indeterminate", lectureImpossible: "donnee_absente", hasFavorable: false, favorableCount: 0 });
  assert.match(p.verdict.detail, /données qui permettraient de répondre manquent encore pour cette commune/);
});

test("G. le trou principal est nommé, quel que soit le nombre de critères lus", () => {
  const p = plan({ coverage: "partial", examinedCount: 6, favorableCount: 6, unexaminedCount: 0, nonMesurees: [{ terme: "budget de 200 000 € maximum" }] });
  assert.equal(p.verdict.label, "Signaux favorables");
  assert.match(p.verdict.detail, /futur•e ne mesure pas encore « budget de 200 000 € maximum »/);
  assert.doesNotMatch(p.verdict.detail, /d'autres critères/);
});

test("parseur : un budget dit n'est jamais perdu, même si le modèle l'a jeté", () => {
  assert.deepEqual(budgetRattrape([{ term: "eau du robinet potable", kind: "autre" }], "Un budget de 300 000 €, une eau du robinet potable."),
    [{ term: "eau du robinet potable", kind: "autre" }, { term: "budget de 300 000 €", kind: "autre" }]);
  assert.deepEqual(budgetRattrape([], "Jusqu'à 250 000 euros, au calme."), [{ term: "250 000 euros", kind: "autre" }]);
  const deja = [{ term: "budget 250 000 €", kind: "autre" as const }];
  assert.equal(budgetRattrape(deja, "budget 250 000 € et air sain"), deja, "déjà porté : rien n'est doublé");
  assert.equal(budgetRattrape(undefined, "de l'air sain"), undefined, "rien d'argent : rien n'est inventé");
});

test("aucun score composite de complétude : trois états, aucun seuil, aucun ratio", () => {
  const src = readFileSync(new URL("./decision/criteria-registry.ts", import.meta.url), "utf8");
  assert.match(src, /export type CoverageLevel = "none" \| "partial" \| "complete";/);
  assert.doesNotMatch(src, /COVERAGE_HIGH_THRESHOLD|ratio >=|\/ registry\.length/);
});

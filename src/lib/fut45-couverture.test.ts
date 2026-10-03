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
import { budgetRattrape, raisonsValidees } from "./parse-assainir.ts";
import { classerNonMesuree, type DemandeNonMesuree } from "./decision/criteria-registry.ts";
import { phrasesNonMesurees } from "./decision/conclusion-plan.ts";
import type { IndexCommune } from "./comparateur-vie.ts";
import type { UserProject } from "./user-project.ts";

const DIR = { byName: () => null, plmByName: () => null };
const village = (): IndexCommune => ({
  insee: "31999", nom: "Saint-Exemple", dept: "31", region: "OCC", lat: 43.5, lon: 1.4, population: 1200, densite: 40,
  mer_centre_km: 150, altitude: 200, clim: {}, pct: {},
} as unknown as IndexCommune);
function projet(prefs: { key: string; weight: number }[], horsMesure: string[] = [], kind = "autre", raison?: string): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "x", updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs, horsMesure: horsMesure.map((term) => ({ term, kind, ...(raison ? { raison } : {}) })) } as unknown as UserProject["parsed"],
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
  assert.equal(d.narrativePlan.verdict.detail, "La lecture reste incomplète : « budget 250 000 € » reste sans réponse dans ce dossier.");
  const bloc = d.narrativePlan.blocks.find((b) => b.key === "uncovered_priorities");
  assert.ok(bloc, "le budget a son bloc dans la conclusion");
  assert.match(bloc!.fallbackText, /futur•e ne sait pas encore confronter un lieu à un budget : « budget 250 000 € » reste sans réponse dans ce dossier\./);
  assert.ok(bloc!.requiredPhrases?.includes("budget 250 000 €"), "le modèle ne peut pas taire le budget");
  assert.ok(bloc!.allowedNumbers?.includes("250 000"), "le nombre dit par le lecteur est admis");
});

test("F. une demande faite seulement de choses non mesurées : la vraie cause, jamais « la donnée manque ici »", () => {
  const d = dossier(projet([], ["authentique", "chaleureuse"], "affectif", "ressenti"));
  assert.equal(d.criteria.coverage, "none");
  assert.equal(d.narrativePlan.verdict.headline.text, "Ce que vous avez demandé reste hors de ce que futur•e évalue.");
  assert.equal(d.narrativePlan.blocks.find((b) => b.key === "uncovered_priorities"), undefined, "le verdict dit déjà la raison : pas de redite");
  assert.equal(d.narrativePlan.verdict.detail, "« authentique » et « chaleureuse » relèvent de votre appréciation : futur•e ne les transforme pas en critères mesurés.");
  assert.doesNotMatch(texte(d), /encore/, "un ressenti n'est pas un retard du produit");
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
  const p = plan({ coverage: "partial", examinedCount: 6, favorableCount: 6, unexaminedCount: 0, nonMesurees: [{ terme: "budget de 200 000 € maximum", raison: "manque_produit", theme: "budget" }] });
  assert.equal(p.verdict.label, "Signaux favorables");
  assert.match(p.verdict.detail, /« budget de 200 000 € maximum » reste sans réponse dans ce dossier/);
  assert.doesNotMatch(p.verdict.detail, /d'autres critères/);
});

test("parseur : un budget dit n'est jamais perdu, même si le modèle l'a jeté", () => {
  assert.deepEqual(budgetRattrape([{ term: "eau du robinet potable", kind: "autre" }], "Un budget de 300 000 €, une eau du robinet potable."),
    [{ term: "eau du robinet potable", kind: "autre" }, { term: "budget de 300 000 €", kind: "autre", raison: "manque_produit" }]);
  assert.deepEqual(budgetRattrape([], "Jusqu'à 250 000 euros, au calme."), [{ term: "250 000 euros", kind: "autre", raison: "manque_produit" }]);
  const deja = [{ term: "budget 250 000 €", kind: "autre" as const }];
  assert.equal(budgetRattrape(deja, "budget 250 000 € et air sain"), deja, "déjà porté : rien n'est doublé");
  assert.equal(budgetRattrape(undefined, "de l'air sain"), undefined, "rien d'argent : rien n'est inventé");
});

test("aucun score composite de complétude : trois états, aucun seuil, aucun ratio", () => {
  const src = readFileSync(new URL("./decision/criteria-registry.ts", import.meta.url), "utf8");
  assert.match(src, /export type CoverageLevel = "none" \| "partial" \| "complete";/);
  assert.doesNotMatch(src, /COVERAGE_HIGH_THRESHOLD|ratio >=|\/ registry\.length/);
});

// ── Les raisons d'une demande non mesurée ──────────────────────────────────────────────────────────

const dnm = (terme: string, kind: string, raison?: string): DemandeNonMesuree => ({ terme, ...classerNonMesuree(kind, terme, raison) });

test("classement : la raison du MODÈLE, validée ; trois règles fixes l'emportent toujours", () => {
  // Règles fixes : un montant, la sécurité d'un lieu, la réputation des écoles. Le modèle ne peut pas les déplacer.
  assert.deepEqual(classerNonMesuree("autre", "budget 250 000 €", "ressenti"), { raison: "manque_produit", theme: "budget" });
  assert.deepEqual(classerNonMesuree("affectif", "loyer pas trop cher", "choix_editorial"), { raison: "manque_produit", theme: "budget" });
  assert.deepEqual(classerNonMesuree("autre", "quartier sûr", "manque_produit"), { raison: "choix_editorial", theme: "securite" });
  assert.deepEqual(classerNonMesuree("ecoles", "bonnes écoles réputées", "manque_produit"), { raison: "choix_editorial", theme: "ecoles" });
  // La raison du modèle, quand aucune règle fixe ne s'applique.
  assert.deepEqual(classerNonMesuree("autre", "eau du robinet potable", "manque_produit"), { raison: "manque_produit", theme: null });
  assert.deepEqual(classerNonMesuree("culture", "vie culturelle animée", "manque_produit"), { raison: "manque_produit", theme: null });
  assert.deepEqual(classerNonMesuree("affectif", "pas trop de touristes l'été", "manque_produit"), { raison: "manque_produit", theme: null }, "le kind ne décide pas");
  assert.deepEqual(classerNonMesuree("affectif", "bonne mentalité", "choix_editorial"), { raison: "choix_editorial", theme: null });
  assert.deepEqual(classerNonMesuree("affectif", "authentique", "ressenti"), { raison: "ressenti", theme: null });
  // Pièges vus en vrai : un aménagement « sécurisé » n'est pas un verdict de sécurité ; « écoles » mal rangé.
  assert.deepEqual(classerNonMesuree("autre", "pistes cyclables sécurisées", "manque_produit"), { raison: "manque_produit", theme: null });
  assert.deepEqual(classerNonMesuree("ecoles", "pas de cas sociaux dans le quartier", "choix_editorial"), { raison: "choix_editorial", theme: null });
  assert.deepEqual(classerNonMesuree("autre", "vie sur place", "manque_produit"), { raison: "manque_produit", theme: null }, "« sur » n'est pas « sûr »");
  // Filet technique : sans raison valide, aucune raison inventée.
  assert.deepEqual(classerNonMesuree("autre", "quelque chose", undefined), { raison: "non_classee", theme: null });
  assert.deepEqual(classerNonMesuree("autre", "quelque chose", "n_importe_quoi"), { raison: "non_classee", theme: null });
});

test("parseur : la raison du modèle est validée contre l'enum, la famille invalide redevient « autre »", () => {
  const v = raisonsValidees([
    { term: "eau du robinet", kind: "autre", raison: "manque_produit" },
    { term: "x", kind: "autre", raison: "inventee" as never },
    { term: "mairie dynamique", kind: "choix_editorial" as never, raison: "choix_editorial" },
  ]);
  assert.deepEqual(v, [
    { term: "eau du robinet", kind: "autre", raison: "manque_produit" },
    { term: "x", kind: "autre" },
    { term: "mairie dynamique", kind: "autre", raison: "choix_editorial" },
  ]);
  assert.deepEqual(budgetRattrape([], "budget 250 000 € et air sain"), [{ term: "budget 250 000 €", kind: "autre", raison: "manque_produit" }]);
});

test("« encore » n'est dit QUE d'un manque du produit, jamais d'un ressenti ni d'un choix éditorial", () => {
  const phrases = phrasesNonMesurees([
    dnm("budget 250 000 €", "autre"), dnm("authentique", "affectif", "ressenti"), dnm("bonnes écoles réputées", "ecoles"),
    dnm("quartier sûr", "autre"), dnm("eau du robinet potable", "autre", "manque_produit"),
    dnm("mairie dynamique", "autre", "choix_editorial"), dnm("quelque chose", "autre"),
  ]);
  assert.deepEqual(phrases, [
    "futur•e ne sait pas encore confronter un lieu à un budget : « budget 250 000 € » reste sans réponse dans ce dossier.",
    "futur•e ne sait pas encore éclairer « eau du robinet potable » avec des faits assez solides : cette question reste sans réponse dans ce dossier.",
    "« authentique » relève de votre appréciation : futur•e ne le transforme pas en critère mesuré.",
    "futur•e ne classe pas les écoles selon leur réputation (« bonnes écoles réputées ») : il n'en fait pas un jugement de qualité.",
    "futur•e ne résume pas la sécurité d'un lieu par un score (« quartier sûr »).",
    "futur•e ne porte pas de jugement global sur « mairie dynamique » : il n'en fait ni un classement ni un score.",
    "futur•e ne répond pas à « quelque chose » dans ce dossier.",
  ]);
  // « Encore » : seulement pour les manques du produit (budget, eau du robinet).
  for (const p of phrases) assert.equal(/encore/.test(p), /budget|robinet/.test(p), p);
});

test("la donnée absente ici reste une autre cause, jamais une demande non mesurée", () => {
  const p = plan({ coverage: "none", orientation: "indeterminate", lectureImpossible: "donnee_absente", hasFavorable: false, favorableCount: 0 });
  assert.match(p.verdict.detail, /données qui permettraient de répondre manquent/);
  assert.doesNotMatch(p.verdict.detail, /appréciation|réputation|budget|ne répond pas/);
});

test("parseur : le budget rattrapé s'arrête à la somme, la suite reste un critère", () => {
  const cas: [string, string][] = [
    ["budget 250 000 € et air sain", "budget 250 000 €"],
    ["un budget de 200 000 € au maximum et du calme", "budget de 200 000 € au maximum"],
    ["250k€ max, près de la mer", "250k€ max"],
    ["je ne veux pas dépasser 300 000 euros", "300 000 euros"],
  ];
  for (const [texteLecteur, attendu] of cas) {
    assert.deepEqual(budgetRattrape([], texteLecteur), [{ term: attendu, kind: "autre", raison: "manque_produit" }], texteLecteur);
  }
});

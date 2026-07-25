// Tests du registre de patrons de composition (tables de comportement de la spec §4-5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeFacts, buildWinterMildnessEvidence, assertCompositionsValid } from "./fact-compositions.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { summerComfortAction } from "./climat-facts.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import type { RunResult, RuleEvaluation, ModuleFacts, VerificationFact, MismatchFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

function project(prefs: Record<string, number>): UserProject {
  return {
    posture: "recherche",
    parsed: {
      preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })),
      hardConstraints: {},
    },
  } as unknown as UserProject;
}

function chaleurFact(tier: "secondary" | "structuring" = "structuring"): MismatchFact {
  return {
    id: "06004:climat-chaleur", ruleId: RULE_CHALEUR,
    sourceFactIds: ["climat.joursTresChauds", "climat.nuitsTropicales"], module: "territoire",
    role: "mismatch", materialityTier: tier,
    projectKey: "faible_chaleur",
    topic: "les fortes chaleurs à Antibes",
    headlineSubject: "des étés supportables",
    statement: "Les jours au-dessus de 35 °C augmentent nettement.",
    // Un mismatch ne porte NI action NI signalConvention : le renvoi logement est restauré ici, par la
    // composition, via summerComfortAction (invariant 8 revisité, lot D).
    basis: { kind: "climate_threshold", horizon: 2050, referencePeriod: "1976-2005", conventionId: "clim-conv-1", trigger: "any", measures: [{ key: "days_over_35", projectedValue: 14, threshold: 8, unit: "days", isUnfavorable: true }] },
    limitation: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    evidence: [{ factId: "climat.joursTresChauds", module: "territoire", label: "Territoire · Antibes", grain: "commune" }],
  };
}

function run(evals: RuleEvaluation[]): RunResult {
  return { facts: evals.flatMap((e) => e.facts), evaluations: evals };
}

const douceurSatisfied: RuleEvaluation = {
  ruleId: RULE_DOUCEUR, projectKeys: ["douceur_climat"], outcome: "satisfied", facts: [], reason: "position satisfied",
};
const chaleurEval = (f: MismatchFact): RuleEvaluation => ({
  ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "mismatch", facts: [f], reason: "exposition défavorable",
});

const moduleFacts = {
  insee: "06004", nom: "Antibes",
  rankBands: { douceur_climat: { low: 0.9, high: 1 } },
} as unknown as ModuleFacts;

test("tradeoff saisonnier : poids >= 2 des deux côtés, satisfied + fait chaleur émis -> composé", () => {
  const f = chaleurFact();
  const out = composeFacts(run([douceurSatisfied, chaleurEval(f)]), moduleFacts, project({ douceur_climat: 2, faible_chaleur: 3 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "tradeoff");
  if (c.kind !== "tradeoff") return;
  assert.equal(c.materialityTier, "structuring"); // hérité du côté défavorable
  assert.deepEqual(c.absorbedFactIds, [f.id]);
  // L'action ne vient PLUS du fait (un mismatch n'en a pas) : la composition la restaure via
  // summerComfortAction, au grain adresse (ici sans adresse -> « Renseignez votre adresse… »).
  assert.equal(c.unfavorableSide.action?.label, summerComfortAction(false).label);
  assert.equal(c.unfavorableSide.limitation, f.limitation); // la limitation reste sur SON côté
  assert.equal(c.unfavorableSide.signalConvention, undefined); // un mismatch n'a pas de convention de signalement
  assert.equal(c.favorableSide.factIds.length, 0); // aucun fait fabriqué côté satisfait
  assert.ok(c.favorableSide.evidence.length > 0);
  assert.equal(c.displaySection, "compromises");
});

test("tradeoff : douceur poids 1 ne se compose pas en tradeoff (silencieux non repêché) ; le fallback climate_comfort prend le relais", () => {
  const out = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 1, faible_chaleur: 3 }));
  // Pas de côté favorable opposable (douceur poids 1) -> pas de tradeoff, mais le mismatch chaleur reste
  // porté par le fallback (Task 2), qui restaure l'action logement.
  assert.equal(out.some((c) => c.kind === "tradeoff"), false);
  assert.equal(out.some((c) => c.kind === "mismatch_with_action"), true);
});

test("tradeoff : douceur neutral ne compose pas de tradeoff ; fallback climate_comfort", () => {
  const neutral: RuleEvaluation = { ...douceurSatisfied, outcome: "neutral" };
  const out = composeFacts(run([neutral, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(out.some((c) => c.kind === "tradeoff"), false);
  assert.equal(out.some((c) => c.kind === "mismatch_with_action"), true);
});

test("aucun fait chaleur émis -> aucune composition climatique (on ne compose que l'affichable seul)", () => {
  const naChaleur: RuleEvaluation = { ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "not_applicable", facts: [], reason: "priorité non déclarée" };
  const out = composeFacts(run([douceurSatisfied, naChaleur]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 1 }));
  assert.equal(out.length, 0);
});

test("tradeoff : bande douceur absente ou corrompue -> pas de tradeoff (invariant 9) ; fallback climate_comfort", () => {
  const sansBande = { ...moduleFacts, rankBands: null } as unknown as ModuleFacts;
  const a = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), sansBande, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(a.some((c) => c.kind === "tradeoff"), false); // preuve favorable non fabricable
  assert.equal(a.some((c) => c.kind === "mismatch_with_action"), true); // le fallback n'a pas besoin du côté favorable
  const corrompue = { ...moduleFacts, rankBands: { douceur_climat: { low: 1.4, high: 0.2 } } } as unknown as ModuleFacts;
  const b = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), corrompue, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(b.some((c) => c.kind === "tradeoff"), false);
  assert.equal(b.some((c) => c.kind === "mismatch_with_action"), true);
});

test("buildWinterMildnessEvidence : bande -> preuve avec part supérieure et période de référence", () => {
  const e = buildWinterMildnessEvidence(moduleFacts);
  assert.ok(e);
  assert.match(e!.observedValue!, /les 10 % de communes/); // 1 - 0.9 = 0.10
  assert.match(e!.observedValue!, /1976-2005/);
  assert.equal(buildWinterMildnessEvidence({ ...moduleFacts, rankBands: {} } as unknown as ModuleFacts), null);
});

test("assertCompositionsValid : id dupliqué, absorbé inexistant, mauvaise section -> jette", () => {
  const f = chaleurFact();
  const r = run([douceurSatisfied, chaleurEval(f)]);
  const [c] = composeFacts(r, moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.ok(c);
  assert.doesNotThrow(() => assertCompositionsValid(r, [c!]));
  assert.throws(() => assertCompositionsValid(r, [c!, c!])); // id dupliqué + double absorption
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, absorbedFactIds: ["inexistant"] } as never]));
  assert.throws(() => assertCompositionsValid(r, [{ ...c!, displaySection: "mismatches" } as never]));
});

// ── climate_comfort : le fallback SANS douceur favorable (Task 2) ────────────────────────────────

test("confort d'été : chaleur mismatch SANS douceur favorable -> une composition qui restaure l'action logement", () => {
  const f = chaleurFact();
  // faible_chaleur seule déclarée (pas de douceur_climat) : le tradeoff saisonnier ne se déclenche pas.
  const out = composeFacts(run([chaleurEval(f)]), moduleFacts, project({ faible_chaleur: 3 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "mismatch_with_action");
  if (c.kind !== "mismatch_with_action") return;
  assert.equal(c.patternId, "climate_comfort"); // le KIND est générique, le PATRON reste identifié
  assert.equal(c.displaySection, "mismatches");
  assert.deepEqual(c.absorbedFactIds, [f.id]);
  // Le héros pourra NOMMER le mismatch absorbé (Task 3) : le sujet vient du fait, pas du titre.
  assert.equal(c.headlineSubject, "des étés supportables");
  // L'action logement, qu'un mismatch ne porte pas, est restaurée ici (sans adresse -> renseigner).
  assert.equal(c.action.label, summerComfortAction(false).label);
  assert.equal(c.limitation, f.limitation);
  assert.equal(c.materialityTier, f.materialityTier);
});

test("confort d'été : l'action suit le grain (adresse -> confort du logement)", () => {
  const withAddress = { ...moduleFacts, hasAddress: true } as unknown as ModuleFacts;
  const out = composeFacts(run([chaleurEval(chaleurFact())]), withAddress, project({ faible_chaleur: 3 }));
  const c = out[0]!;
  assert.equal(c.kind, "mismatch_with_action");
  if (c.kind !== "mismatch_with_action") return;
  assert.equal(c.action.type, "verifier_sur_place");
  assert.equal(c.action.label, summerComfortAction(true).label);
});

test("climate_comfort : poids 1 (mismatch silencieux, aucun fait) -> aucune composition", () => {
  // Le mismatch de poids 1 n'émet aucun fait : rien à absorber, on ne fabrique pas de carte.
  const silencieux: RuleEvaluation = { ruleId: RULE_CHALEUR, projectKeys: ["faible_chaleur"], outcome: "mismatch", facts: [], reason: "silencieux (poids 1)" };
  const out = composeFacts(run([silencieux]), moduleFacts, project({ faible_chaleur: 1 }));
  assert.equal(out.length, 0);
});

test("une seule composition climatique par dossier : douceur favorable + chaleur mismatch -> tradeoff SEUL", () => {
  const out = composeFacts(run([douceurSatisfied, chaleurEval(chaleurFact())]), moduleFacts, project({ douceur_climat: 3, faible_chaleur: 3 }));
  assert.equal(out.length, 1);
  assert.equal(out[0]!.kind, "tradeoff"); // le tradeoff gagne, jamais AUSSI climate_comfort
  assert.equal(out.filter((c) => c.kind === "mismatch_with_action").length, 0);
});

// ── Patron 2 : territory-size-multiple-consequences ──────────────────────────────────────────────

import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";
import { AGGLOMERATION_SIZE_CONVENTION } from "./agglomeration-facts.ts";

function tailleMismatch(key: string, tier: "secondary" | "structuring", over: Partial<MismatchFact> = {}): MismatchFact {
  return {
    id: `01001:mismatch-${key}`, ruleId: `territoire.taille-${key}`,
    sourceFactIds: [TERRITORY_SIZE_FACT_ID], module: "territoire",
    role: "mismatch", materialityTier: tier,
    topic: key === "eviter_isolement" ? "l'isolement du territoire" : "la taille du territoire",
    statement: `Constat taille pour ${key}.`, projectKey: key as never,
    basis: { kind: "categorical_state", observedCategory: "village", conventionId: AGGLOMERATION_SIZE_CONVENTION.id },
    evidence: [{ factId: TERRITORY_SIZE_FACT_ID, module: "territoire", label: "Territoire · Ceyzériat", grain: "unite_urbaine" }],
    ...over,
  } as MismatchFact;
}
const tailleEval = (f: MismatchFact): RuleEvaluation =>
  ({ ruleId: f.ruleId, projectKeys: [f.projectKey], outcome: "mismatch", facts: [f], reason: "catégorie en écart" });

test("shared_evidence : 2 mismatchs taille matériels village -> composition, tier max, tiers propres conservés", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = tailleMismatch("eviter_isolement", "secondary", { limitation: "La catégorie de taille utilisée ne décrit pas à elle seule l'accès aux services." });
  const out = composeFacts(run([tailleEval(a), tailleEval(b)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "shared_evidence");
  if (c.kind !== "shared_evidence") return;
  assert.equal(c.materialityTier, "structuring");
  assert.equal(c.consequences.length, 2);
  assert.equal(c.consequences[0]!.materialityTier, "structuring"); // hiérarchie interne : structurant d'abord
  assert.equal(c.consequences[1]!.limitation, b.limitation); // la limitation reste sur SA conséquence
  assert.deepEqual(new Set(c.absorbedFactIds), new Set([a.id, b.id]));
  assert.equal(c.displaySection, "mismatches");
});

test("shared_evidence : ordre d'entrée inversé -> composition strictement identique (déterminisme total)", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const b = tailleMismatch("eviter_isolement", "structuring"); // même tier : le tie-break doit trancher
  const p = project({ prefere_grande_ville: 3, eviter_isolement: 3 });
  const out1 = composeFacts(run([tailleEval(a), tailleEval(b)]), moduleFacts, p);
  const out2 = composeFacts(run([tailleEval(b), tailleEval(a)]), moduleFacts, p);
  assert.deepEqual(out1, out2);
  assert.equal(out1.length, 1);
});

test("shared_evidence : 1 seul fait matériel -> pas de composition (rien à dédupliquer)", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const out = composeFacts(run([tailleEval(a)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 1 }));
  assert.equal(out.length, 0);
});

test("shared_evidence : sources différentes, basis non catégoriel, ou catégories divergentes -> pas de composition", () => {
  const a = tailleMismatch("prefere_grande_ville", "structuring");
  const autreSource = tailleMismatch("eviter_isolement", "secondary", { sourceFactIds: ["autre.source"] });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(autreSource)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
  const mauvaisBasis = tailleMismatch("eviter_isolement", "secondary", { basis: { kind: "relative_position", rankLow: 0.1, rankHigh: 0.2, universe: "communes_france", distributionVersion: "x" } as never });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(mauvaisBasis)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
  const autreCategorie = tailleMismatch("eviter_isolement", "secondary", { basis: { kind: "categorical_state", observedCategory: "petite", conventionId: AGGLOMERATION_SIZE_CONVENTION.id } as never });
  assert.equal(composeFacts(run([tailleEval(a), tailleEval(autreCategorie)]), moduleFacts, project({ prefere_grande_ville: 3, eviter_isolement: 2 })).length, 0);
});

// ── Patron 3 : grouped_verification argiles + PPR sécheresse (grain adresse) ────────────────────

function logementVerif(id: "exposition-bati" | "zone-reglementee", statement: string, over: Partial<VerificationFact> = {}): VerificationFact {
  return {
    id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement",
    role: "verification", materialityTier: "structuring",
    topic: id === "exposition-bati" ? "le retrait-gonflement des argiles" : "un plan de prévention des risques",
    statement,
    evidence: [{ factId: `logement.${id}`, module: "logement", label: "12 rue des Argiles", grain: "adresse", href: "/rapport/logement" }],
    action: { type: id === "exposition-bati" ? "verifier_sur_place" : "obtenir_document", label: id === "exposition-bati" ? "Regardez les signes visibles sur le bâti." : "Lisez le règlement de la zone en mairie." },
    ...over,
  };
}
const logementEval = (f: VerificationFact): RuleEvaluation =>
  ({ ruleId: f.ruleId, projectKeys: [], outcome: "verification", facts: [f], reason: "verification" });

function moduleFactsAvecPpr(pprnLabel: string | null): ModuleFacts {
  return { ...moduleFacts, logement: { pprnLabel } } as unknown as ModuleFacts;
}

test("grouped argiles+PPR : les deux faits émis + PPR sécheresse -> une carte, deux items complets", () => {
  const argiles = logementVerif("exposition-bati", "À cette adresse, le sol est exposé au retrait-gonflement des argiles.", { limitation: "L'exposition de la zone ne prouve pas un dommage sur ce bien.", signalConvention: "futur•e signale cette exposition à partir d'un aléa moyen." });
  const ppr = logementVerif("zone-reglementee", "À cette adresse, un plan de prévention des risques s'applique : PPR Sécheresse - Territoire 1 - Toulouse.");
  const out = composeFacts(run([logementEval(argiles), logementEval(ppr)]), moduleFactsAvecPpr("PPR Sécheresse - Territoire 1 - Toulouse"), project({}));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "grouped_verification");
  if (c.kind !== "grouped_verification") return;
  assert.equal(c.displaySection, "verifications");
  assert.equal(c.materialityTier, "structuring");
  assert.deepEqual(c.absorbedFactIds, [argiles.id, ppr.id]);
  assert.equal(c.items.length, 2);
  assert.equal(c.items[0]!.statement, argiles.statement);
  assert.equal(c.items[0]!.limitation, argiles.limitation);       // invariant 8 : la limitation reste sur SON item
  assert.equal(c.items[0]!.signalConvention, argiles.signalConvention); // invariant 8 : la convention survit
  assert.equal(c.items[0]!.action?.label, argiles.action.label);  // invariant 8 : l'action survit
  assert.equal(c.items[1]!.action?.label, ppr.action.label);
});

test("grouped argiles+PPR : un PPR d'une AUTRE nature ne compose jamais (sujet décisionnel différent)", () => {
  const argiles = logementVerif("exposition-bati", "s1");
  const ppr = logementVerif("zone-reglementee", "À cette adresse, un plan de prévention des risques s'applique : PPRI Garonne.");
  assert.equal(composeFacts(run([logementEval(argiles), logementEval(ppr)]), moduleFactsAvecPpr("PPRI Garonne"), project({})).length, 0);
  // Libellé absent : la nature du PPR est invérifiable, on ne compose pas.
  assert.equal(composeFacts(run([logementEval(argiles), logementEval(ppr)]), moduleFactsAvecPpr(null), project({})).length, 0);
});

test("grouped argiles+PPR : un seul des deux faits -> pas de composition", () => {
  const argiles = logementVerif("exposition-bati", "s1");
  assert.equal(composeFacts(run([logementEval(argiles)]), moduleFactsAvecPpr("PPR Sécheresse"), project({})).length, 0);
  const ppr = logementVerif("zone-reglementee", "s2");
  assert.equal(composeFacts(run([logementEval(ppr)]), moduleFactsAvecPpr("PPR Sécheresse"), project({})).length, 0);
});

// ── wildfire_exposure : le danger d'incendie déclaré (lot feu) ───────────────────

import { RULE_FEU } from "./materiality-rules.ts";
import { wildfireExposureAction } from "./climat-facts.ts";

function feuFact(tier: "secondary" | "structuring" = "structuring"): MismatchFact {
  return {
    id: "06004:climat-feu", ruleId: RULE_FEU, sourceFactIds: ["climat.joursFeu"], module: "territoire",
    role: "mismatch", materialityTier: tier, projectKey: "faible_risque_feu",
    topic: "le danger d'incendie",
    headlineSubject: "un environnement peu exposé aux incendies",
    statement: "Les jours où l'indice forêt-météo dépasse 40 passeraient de 12 à 50 à l'horizon 2050.",
    basis: { kind: "climate_threshold", horizon: 2050, referencePeriod: "1976-2005", conventionId: "clim-conv-1", trigger: "any", measures: [{ key: "fire_weather_days", projectedValue: 50, threshold: 9, unit: "days", isUnfavorable: true }] },
    limitation: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    evidence: [{ factId: "climat.joursFeu", module: "territoire", label: "Climat · Antibes", observedValue: "50 jours à l'horizon 2050", grain: "commune" }],
  } as unknown as MismatchFact;
}
const feuEval = (f: MismatchFact): RuleEvaluation => ({
  ruleId: RULE_FEU, projectKeys: ["faible_risque_feu"], outcome: "mismatch", facts: [f], reason: "danger défavorable",
});

test("feu : le mismatch RETROUVE son geste — sans la composition, la bascule aurait fait perdre l'action", () => {
  const f = feuFact();
  const out = composeFacts(run([feuEval(f)]), moduleFacts, project({ faible_risque_feu: 3 }));
  assert.equal(out.length, 1);
  const c = out[0]!;
  assert.equal(c.kind, "mismatch_with_action");
  if (c.kind !== "mismatch_with_action") return;
  assert.equal(c.patternId, "wildfire_exposure");
  // LE TITRE SUIT LE FONDEMENT et reste factuel : une trajectoire chiffrée n'est pas un recensement,
  // et il ne s'annonce pas plus fort que ce que le dossier en conclut (le poids peut être secondaire).
  assert.equal(c.title, "Une trajectoire de danger d'incendie qui s'aggrave");
  assert.equal(c.displaySection, "mismatches");
  assert.deepEqual(c.absorbedFactIds, [f.id]);
  assert.equal(c.headlineSubject, "un environnement peu exposé aux incendies");
  assert.equal(c.action.label, wildfireExposureAction(false).label); // sans adresse -> renseigner
  assert.equal(c.limitation, f.limitation);
});

test("feu : l'action suit le grain (adresse -> la végétation autour du terrain)", () => {
  const withAddress = { ...moduleFacts, hasAddress: true } as unknown as ModuleFacts;
  const out = composeFacts(run([feuEval(feuFact())]), withAddress, project({ faible_risque_feu: 3 }));
  const c = out[0]!;
  assert.equal(c.kind === "mismatch_with_action" && c.action.type, "verifier_sur_place");
  assert.equal(c.kind === "mismatch_with_action" && c.action.label, "Regardez la végétation autour du terrain");
});

test("feu : poids 1 (mismatch silencieux, aucun fait) -> AUCUNE composition", () => {
  const vide: RuleEvaluation = { ruleId: RULE_FEU, projectKeys: ["faible_risque_feu"], outcome: "mismatch", facts: [], reason: "silencieux" };
  assert.deepEqual(composeFacts(run([vide]), moduleFacts, project({ faible_risque_feu: 1 })), []);
});

test("feu et chaleur COEXISTENT : deux phénomènes, deux priorités, deux compositions", () => {
  // L'invariant « une seule composition climatique par dossier » vise les patrons qui absorbent le MÊME
  // mismatch chaleur. Le feu absorbe le sien : rien à arbitrer entre les deux.
  const out = composeFacts(
    run([chaleurEval(chaleurFact()), feuEval(feuFact())]),
    moduleFacts,
    project({ faible_chaleur: 3, faible_risque_feu: 3 }),
  );
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((c) => c.kind === "mismatch_with_action" && c.patternId).sort(), ["climate_comfort", "wildfire_exposure"]);
});

test("feu : un risque RECENSÉ porte un titre de recensement, pas de trajectoire", () => {
  const recense = {
    ...feuFact(),
    basis: { kind: "declared_hazard", hazard: "wildfire", source: "gaspar", observedLabel: "Feu de forêt" },
    statement: "À Antibes, le risque de feu de forêt est officiellement recensé par l'État (Géorisques).",
  } as unknown as MismatchFact;
  const out = composeFacts(run([feuEval(recense)]), moduleFacts, project({ faible_risque_feu: 3 }));
  const c = out[0]!;
  assert.equal(c.kind === "mismatch_with_action" && c.title, "Un risque de feu de forêt recensé pour la commune");
  // Aucune interprétation dans le titre : la section porte déjà le jugement relatif au projet.
  assert.equal(c.title.includes("difficile à concilier"), false);
});

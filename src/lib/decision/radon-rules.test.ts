import test from "node:test";
import assert from "node:assert/strict";
import { RADON_RULES } from "./radon-rules.ts";
import { radonSignale, radonStatement, radonLimitation, type RadonFacts } from "./radon-facts.ts";
import { GESTES } from "./logement-gestes.ts";
import type { ModuleFacts, DecisionFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

const rule = RADON_RULES[0]!;
const CTX = {} as EvaluationContext;

function facts(radon: RadonFacts | null, nom = "Clermont-Ferrand"): ModuleFacts {
  return {
    insee: "63113", nom, dept: "63", lat: 45.78, lon: 3.08, uu: null,
    tailleVille: 140000, tailleVilleSource: "commune", reliefProximite: 1, distanceCoteKm: null,
    population: 140000, altitude: 400, catnatInondation: 0, inondationRisque: 10,
    climat: null, sante: null, scores: {}, hasAddress: true, radon,
  };
}
function project(over: Partial<UserProject> = {}): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { preferences: [] } as UserProject["parsed"], updatedAt: null, ...over,
  };
}
const cl = (classe: "1" | "2" | "3", parArrondissement = false, codeInterroge = "63113"): RadonFacts =>
  ({ classe, codeInterroge, parArrondissement });

test("CLASSE 3 : une carte de vérification, au grain commune", () => {
  const r = rule.evaluate(facts(cl("3")), project(), CTX as never);
  assert.equal(r.outcome, "verification");
  const f = r.facts[0] as DecisionFact;
  const ev = f.evidence![0]!;
  assert.equal(ev.grain, "commune");
  // Une classification de sous-sol, pas une distance : `attribut`, donc échelle territoire.
  assert.equal(ev.relation, "attribut");
});

test("CLASSES 1 ET 2 : AUCUN fait, et surtout AUCUN `satisfied`", () => {
  // Le cœur de la table de vérité. Un `satisfied` sans fait ne porterait aucune carte donc aucune
  // limitation, et le registre en tirerait « favorable » — le mensonge silencieux fermé sur le bruit.
  for (const c of ["1", "2"] as const) {
    const r = rule.evaluate(facts(cl(c)), project(), CTX as never);
    assert.equal(r.outcome, "not_applicable", `classe ${c}`);
    assert.notEqual(r.outcome, "satisfied");
    assert.equal(r.facts.length, 0);
  }
});

test("SOURCE MUETTE : rien non plus — jamais « pas de radon »", () => {
  const r = rule.evaluate(facts(null), project(), CTX as never);
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
  assert.match(r.reason, /indisponible/);
});

test("LE CONSTAT DIT CE QU'EST LE RADON avant de dire ce qu'on a trouvé", () => {
  // « Catégorie 3 » ne veut rien dire pour quelqu'un qui découvre le sujet : la carte doit être
  // intelligible sans ouvrir le dépliable.
  const f = rule.evaluate(facts(cl("3")), project(), CTX as never).facts[0] as DecisionFact;
  assert.match(f.statement, /gaz radioactif naturel/);
  assert.match(f.statement, /provient du sol/);
  assert.ok(f.statement.indexOf("gaz radioactif") < f.statement.indexOf("catégorie 3"));
});

test("LA LIMITATION EST TOUJOURS LÀ : le classement ne mesure pas ce logement", () => {
  const f = rule.evaluate(facts(cl("3")), project(), CTX as never).facts[0] as DecisionFact;
  assert.match(f.limitation!, /pas ce logement/);
  assert.match(f.limitation!, /ventilation/);
  assert.match(f.limitation!, /mesure à l'intérieur/);
});

test("LE VOCABULAIRE INTERDIT n'apparaît nulle part", () => {
  const f = rule.evaluate(facts(cl("3")), project(), CTX as never).facts[0] as DecisionFact;
  const txt = `${f.statement} ${f.topic} ${f.status ?? ""} ${f.limitation ?? ""} ${f.action?.label ?? ""} ${f.action?.detail ?? ""}`;
  // « risque » : l'autre endpoint Géorisques l'emploie, la source radon non. On ne le reprend pas.
  assert.doesNotMatch(txt, /risque/i);
  assert.doesNotMatch(txt, /exposition élevée|logement exposé|air intérieur dangereux/i);
  assert.doesNotMatch(txt, /becquerel|Bq/);
  assert.doesNotMatch(txt, /aucun (problème|danger)/i);
});

test("JAMAIS `structuring` : un constat qui appelle une mesure ne conclut pas", () => {
  const f = rule.evaluate(facts(cl("3")), project(), CTX as never).facts[0] as DecisionFact;
  assert.equal(f.materialityTier, "secondary");
});

test("AUCUNE PRIORITÉ RATTACHÉE : c'est un constat établi NON DEMANDÉ", () => {
  // L'accrocher à `air_sain` (l'air extérieur) serait une fausse correspondance sémantique.
  const r = rule.evaluate(facts(cl("3")), project(), CTX as never);
  assert.deepEqual(r.projectKeys, []);
});

test("LE GESTE SE FAIT DANS LE LOGEMENT, et suit la posture", () => {
  // Constat au grain commune, action dans le logement : les deux échelles ne coïncident pas.
  for (const [intent, bucket] of [["achat", "achat"], ["location", "location"]] as const) {
    const f = rule.evaluate(facts(cl("3")), project({ intent }), CTX as never).facts[0] as DecisionFact;
    assert.equal(f.action!.label, GESTES.radon[bucket].label);
    assert.match(f.action!.label, /logement|radon/i);
  }
});

test("PARIS, LYON, MARSEILLE : la preuve nomme l'ARRONDISSEMENT, pas la ville", () => {
  // Le radon vaut 1 dans huit arrondissements de Lyon et 3 dans le neuvième : dire « Lyon » serait
  // faux pour l'un ou pour les autres.
  const f = rule.evaluate(facts(cl("3", true, "69389"), "Lyon"), project(), CTX as never).facts[0] as DecisionFact;
  assert.match(f.evidence![0]!.label, /69389/);
  assert.doesNotMatch(f.evidence![0]!.label, /Lyon/);
  assert.match(f.statement, /cet arrondissement/);
});

test("Une commune ordinaire nomme bien la commune", () => {
  const f = rule.evaluate(facts(cl("3")), project(), CTX as never).facts[0] as DecisionFact;
  assert.match(f.evidence![0]!.label, /Clermont-Ferrand/);
  assert.match(f.statement, /Clermont-Ferrand/);
});

test("radonSignale ne retient que la classe 3", () => {
  assert.ok(radonSignale(cl("3")));
  assert.ok(!radonSignale(cl("2")));
  assert.ok(!radonSignale(cl("1")));
  assert.ok(!radonSignale(null));
  assert.ok(!radonSignale(undefined));
});

test("Les textes purs restent lisibles hors du moteur", () => {
  assert.ok(radonStatement(cl("3"), "Guéret").includes("Guéret"));
  assert.ok(radonLimitation().length > 80);
});

import test from "node:test";
import assert from "node:assert/strict";
import { SECTEUR_RULES } from "./secteur-rules.ts";
import {
  buildSecteurFacts, ecartNotable, equipementAutoStatement, ECART_SECTEUR_NOTABLE,
} from "./secteur-facts.ts";
import type { ModuleFacts, DecisionFact } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

const rule = SECTEUR_RULES[0]!;

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "17300", nom: "La Rochelle", dept: "17", lat: 46.16, lon: -1.15, uu: null,
    tailleVille: 75000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 1,
    population: 75000, altitude: 10, catnatInondation: 0, inondationRisque: 10,
    climat: null, sante: null, scores: {}, hasAddress: true, ...over,
  };
}
function project(poids: number): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { preferences: poids > 0 ? [{ key: "faible_dependance_auto", weight: poids }] : [] } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
const CTX = {} as EvaluationContext;
const secteur = (share: number, communeShare: number) =>
  buildSecteurFacts({ kind: "secteur" as const, share, communeShare, irisCode: "173000101" });

function evalWith(share: number, communeShare: number, poids = 3) {
  return rule.evaluate(facts({ secteur: secteur(share, communeShare) }), project(poids), CTX as never);
}

test("PREMIER FAIT DU GRAIN SECTEUR : la preuve porte bien `secteur`, pas `adresse`", () => {
  const r = evalWith(50.4, 68.9); // profil médian des secteurs sous leur commune (écart -18,5)
  assert.equal(r.outcome, "verification");
  const ev = (r.facts[0] as DecisionFact).evidence![0]!;
  assert.equal(ev.grain, "secteur");
  // Une SURFACE : ancre et support coïncident, donc `attribut` — pas une distance depuis l'adresse.
  assert.equal(ev.relation, "attribut");
});

test("LES DEUX NOMBRES SONT DITS : jamais l'écart seul", () => {
  const r = evalWith(50.4, 68.9);
  const s = (r.facts[0] as DecisionFact).statement;
  assert.match(s, /50,4\u00a0%/);  // le niveau du secteur
  assert.match(s, /68,9\u00a0%/);  // celui de la commune
  assert.match(s, /18,5 points/); // et l'écart
  assert.match(s, /à partir de 15 points/); // la convention est DITE, comme le seuil de bruit
});

test("CONTRADICTION 1 : sous sa commune mais fortement équipé — le texte ne dit pas « peu de voitures »", () => {
  // 16 % des secteurs à écart négatif restent au-dessus de 60 % : « moins équipé que la commune »
  // ne veut PAS dire « quartier peu motorisé ». Le niveau absolu doit rester lisible.
  const r = evalWith(68, 85);
  const f = r.facts[0] as DecisionFact;
  assert.match(f.statement, /68\u00a0% des ménages disposent d'au moins une voiture/);
  assert.doesNotMatch(f.statement, /peu|faible|sans voiture/i);
});

test("CONTRADICTION 2 : au-dessus de sa commune mais minoritairement équipé", () => {
  const r = evalWith(45, 28);
  const f = r.facts[0] as DecisionFact;
  assert.match(f.statement, /45\u00a0%/);
  assert.match(f.statement, /28\u00a0%/);
  assert.match(f.statement, /plus répandue/);
});

test("LE VOCABULAIRE INTERDIT n'apparaît nulle part", () => {
  for (const [s, c] of [[50.4, 68.9], [88, 70], [30, 50]] as const) {
    const f = evalWith(s, c).facts[0] as DecisionFact;
    const texte = `${f.statement} ${f.topic} ${f.limitation ?? ""} ${f.action?.label ?? ""} ${f.action?.detail ?? ""}`;
    assert.doesNotMatch(texte, /dépendance/i, "« dépendance » est banni de ce fait");
    assert.doesNotMatch(texte, /vivre sans voiture|se passer de la voiture/i);
  }
});

test("JAMAIS `structuring`, même à poids 3 : ce signal ne conclut pas seul", () => {
  for (const poids of [2, 3]) {
    const f = evalWith(50.4, 68.9, poids).facts[0] as DecisionFact;
    assert.equal(f.materialityTier, "secondary");
  }
});

test("C'EST UN CONSTAT, PAS UN VERDICT : `verification`, jamais mismatch ni satisfied", () => {
  // La position relative de la commune reste portée par `mismatch-rules` ; ce fait la nuance.
  for (const [s, c] of [[50.4, 68.9], [88, 70]] as const) {
    assert.equal(evalWith(s, c).outcome, "verification");
  }
});

test("CAS RÉEL sous le seuil : 1 rue Saint-Dominique (60,2 % vs 73,5 %) ne déclenche RIEN", () => {
  // 13,3 points : la carte du module affiche bien la valeur, mais le DOSSIER ne la commente pas.
  // Afficher n'est pas conclure — c'est toute la différence entre la brique et la règle.
  assert.equal(evalWith(60.2, 73.5).outcome, "not_applicable");
});

test("SOUS LE SEUIL : la règle se tait — sinon la nuance serait partout (52,8 % des IRIS à ±5 pts)", () => {
  assert.equal(evalWith(60, 68).outcome, "not_applicable"); // 8 points
  assert.equal(evalWith(60, 74.9).outcome, "not_applicable"); // 14,9 points
  assert.equal(evalWith(60, 75).outcome, "verification"); // 15 points pile
  assert.ok(!ecartNotable(14.9) && ecartNotable(ECART_SECTEUR_NOTABLE));
});

test("PRIORITÉ NON DÉCLARÉE ou poids 1 : rien, quel que soit l'écart", () => {
  assert.equal(evalWith(40, 90, 0).outcome, "not_applicable");
  assert.equal(evalWith(40, 90, 1).outcome, "not_applicable");
});

test("AUCUN SECTEUR EXPLOITABLE : la règle se tait, elle ne signale pas une inconnue", () => {
  // La lecture communale, elle, a bien eu lieu : il n'y a pas de trou à signaler au lecteur.
  for (const car of [
    null,
    { kind: "commune_entiere" as const },
    { kind: "secteur_non_residentiel" as const },
    { kind: "unknown" as const },
    { kind: "secteur" as const, share: 60, communeShare: null, irisCode: "173000101" },
  ]) {
    const r = rule.evaluate(facts({ secteur: buildSecteurFacts(car) }), project(3), CTX as never);
    assert.equal(r.outcome, "not_applicable");
    assert.equal(r.facts.length, 0);
  }
});

test("Le statut résume le sens de l'écart, sans le juger", () => {
  assert.equal((evalWith(50.4, 68.9).facts[0] as DecisionFact).status, "Moins équipé que la commune");
  assert.equal((evalWith(88, 70).facts[0] as DecisionFact).status, "Plus équipé que la commune");
});

test("La limitation nomme les autres causes possibles de la possession", () => {
  const f = evalWith(50.4, 68.9).facts[0] as DecisionFact;
  assert.match(f.limitation!, /composition des ménages|revenus|stationnement/);
});

test("buildSecteurFacts calcule l'écart signé, arrondi au dixième", () => {
  assert.equal(secteur(60.2, 73.5).equipementAuto!.ecart, -13.3);
  assert.equal(secteur(88, 70).equipementAuto!.ecart, 18);
  assert.deepEqual(buildSecteurFacts({ kind: "unknown" }), {});
});

test("equipementAutoStatement reste lisible aux bornes", () => {
  for (const [s, c] of [[0, 40], [100, 60], [1.5, 30.7]] as const) {
    const txt = equipementAutoStatement({ share: s, communeShare: c, ecart: s - c, irisCode: "x" });
    assert.ok(txt.includes("%") && txt.length > 60);
  }
});

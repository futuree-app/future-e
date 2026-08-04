import test from "node:test";
import assert from "node:assert/strict";
import { PERMIS_RULES } from "./permis-rules.ts";
import type { ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

const rule = PERMIS_RULES[0]!;

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "17300", nom: "La Rochelle", dept: "17", lat: 46.16, lon: -1.15, uu: null,
    tailleVille: 75000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 1,
    population: 75000, altitude: 10, catnatInondation: 0, inondationRisque: 10,
    climat: null, sante: null, scores: {}, hasAddress: true, ...over,
  };
}

const PROJECT: UserProject = {
  posture: "recherche", intent: null, rawText: null,
  parsed: { preferences: [] } as UserProject["parsed"],
  updatedAt: "1970-01-01T00:00:00.000Z",
};
const CTX = {} as EvaluationContext;

/** Un snapshot de permis GELÉ. Rayon et fenêtre sont des paramètres, jamais les constantes. */
function permis(
  liste: { annee: number; etat: "acheve" | "chantier_ouvert" | "autorise_non_commence" }[],
  rayonMeters = 50,
  ancienneteMaxAns = 3,
): PermisSnapshot {
  return {
    permis: liste, rayonMeters, ancienneteMaxAns, anneeReference: 2026,
    consulteLe: "2026-08-01T00:00:00.000Z",
  };
}

const evalWith = (p?: PermisSnapshot) => rule.evaluate(facts({ permis: p }), PROJECT, CTX);

// ── Les trois silences ──────────────────────────────────────────────────────────────────────

test("REGISTRE NON CONSULTÉ : uncertain, jamais not_applicable", () => {
  // `not_applicable` dirait HORS SUJET, c'est-à-dire que la question ne se pose pas pour cette
  // adresse. `uncertain` dit que la règle s'applique et que la donnée manque. Confondre les deux
  // réintroduirait au niveau du moteur la confusion entre « rien trouvé » et « pas lu ».
  const r = evalWith(undefined);
  assert.equal(r.outcome, "uncertain");
  assert.equal(r.facts.length, 0);
  assert.match(r.reason, /non consult/i);
});

test("CONSULTÉ, AUCUN DOSSIER : not_applicable, et la RAISON le dit", () => {
  const r = evalWith(permis([]));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
  assert.equal(r.reason, "registre consulté, aucune autorisation recensée");
});

test("QUE DES ACHEVÉS : not_applicable, et la RAISON N'EST PAS LA MÊME", () => {
  // Un achevé ne signale plus une transformation à venir au moment de l'analyse. Il reste dans le
  // bloc du module, il n'entre pas au moteur.
  //
  // MÊME OUTCOME, RAISON DIFFÉRENTE, et c'est tout l'enjeu de ce test : « rien autour » et
  // « uniquement des opérations achevées » sont deux situations distinctes, et un audit qui ne peut
  // pas les distinguer ne sert à rien. Le contrat n'offre qu'un `outcome` pour les deux, donc c'est
  // la `reason` qui porte la différence.
  const r = evalWith(permis([{ annee: 2024, etat: "acheve" }, { annee: 2023, etat: "acheve" }]));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
  assert.equal(r.reason, "autorisations recensées, toutes achevées");
});

test("AUCUNE PRÉFÉRENCE N'ACTIVE CETTE RÈGLE", () => {
  // `projectKeys: []` sur tous les chemins : un critère listé ici serait compté EXAMINÉ dans la
  // couverture alors que la règle ne le regarde pas.
  for (const p of [undefined, permis([]), permis([{ annee: 2025, etat: "chantier_ouvert" }])]) {
    assert.deepEqual(evalWith(p).projectKeys, []);
  }
});

// ── Les cinq compositions ───────────────────────────────────────────────────────────────────

const factOf = (p: PermisSnapshot) => {
  const r = evalWith(p);
  assert.equal(r.outcome, "verification");
  return r.facts[0] as VerificationFact;
};

test("UN SEUL FAIT, quel que soit le nombre de dossiers", () => {
  // Un fait par permis produirait plusieurs cartes portant le même geste.
  const r = evalWith(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2024, etat: "chantier_ouvert" },
  ]));
  assert.equal(r.facts.length, 1);
});

test("un seul, chantier ouvert", () => {
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  assert.equal(fact.status, "Chantier déclaré ouvert");
  assert.equal(
    fact.statement,
    "Une autorisation créant des logements est recensée à moins de 50 m, et son chantier est " +
      "déclaré ouvert.",
  );
  assert.equal(fact.action.label, "Demandez en mairie à consulter le dossier de l'autorisation");
});

test("un seul, non commencé", () => {
  const fact = factOf(permis([{ annee: 2024, etat: "autorise_non_commence" }]));
  assert.equal(fact.status, "Sans ouverture déclarée");
  assert.equal(
    fact.statement,
    "Une autorisation créant des logements est recensée à moins de 50 m, sans ouverture de " +
      "chantier déclarée.",
  );
});

test("plusieurs, tous ouverts : le pluriel gagne le libellé d'action", () => {
  const fact = factOf(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "chantier_ouvert" },
  ]));
  assert.equal(fact.status, "Chantiers déclarés ouverts");
  assert.equal(
    fact.statement,
    "Deux autorisations créant des logements sont recensées à moins de 50 m, et leurs chantiers " +
      "sont déclarés ouverts.",
  );
  assert.equal(fact.action.label, "Demandez en mairie à consulter les dossiers des autorisations");
});

test("plusieurs, aucun ouvert", () => {
  const fact = factOf(permis([
    { annee: 2025, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
  ]));
  assert.equal(fact.status, "Sans ouverture déclarée");
  assert.equal(
    fact.statement,
    "Trois autorisations créant des logements sont recensées à moins de 50 m, sans ouverture de " +
      "chantier déclarée.",
  );
});

test("AUCUN STATUS N'AFFIRME PLUS QUE LA SOURCE", () => {
  // La source établit une absence de DÉCLARATION, jamais une absence de travaux.
  for (const c of [
    [{ annee: 2025, etat: "autorise_non_commence" as const }],
    [{ annee: 2025, etat: "autorise_non_commence" as const }, { annee: 2024, etat: "autorise_non_commence" as const }],
  ]) {
    const st = factOf(permis(c)).status ?? "";
    assert.equal(/non commencée?s?/i.test(st), false, st);
    assert.match(st, /déclarée?/i);
  }
});

test("ÉTATS MIXTES : le status ne peut pas dire « Chantier déclaré ouvert »", () => {
  // Un fait agrégeant trois dossiers mixtes qui afficherait « Chantier ouvert » serait vrai d'une
  // partie des données et faux comme résumé de la carte.
  const fact = factOf(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2023, etat: "acheve" },
  ]));
  assert.equal(fact.status, "Autorisations non achevées");
  assert.equal(
    fact.statement,
    "Trois autorisations créant des logements sont recensées à moins de 50 m, dont deux chantiers " +
      "déclarés ouverts.",
  );
});

test("mixte avec UN SEUL chantier ouvert : l'accord suit", () => {
  const fact = factOf(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ]));
  assert.equal(
    fact.statement,
    "Deux autorisations créant des logements sont recensées à moins de 50 m, dont un chantier " +
      "déclaré ouvert.",
  );
});

test("au-delà de neuf, le nombre passe en chiffres", () => {
  const dix = Array.from({ length: 10 }, () => ({ annee: 2025, etat: "chantier_ouvert" as const }));
  const fact = factOf(permis(dix));
  assert.ok(fact.statement.startsWith("10 autorisations"), fact.statement);
});

test("LE GESTE COMBLE LE MANQUE DE LA DONNÉE, et ne promet aucun droit", () => {
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  assert.equal(fact.action.type, "obtenir_document");
  // Le dossier déposé porte les trois informations que le registre ne publie pas.
  assert.match(fact.action.detail ?? "", /nature de l'opération/);
  assert.match(fact.action.detail ?? "", /hauteur/);
  assert.match(fact.action.detail ?? "", /surface de plancher/);
  // `detail` décrit une pratique, jamais un droit ni un délai (invariants 3 et 5).
  assert.equal(/droit|accès garanti|sous \d+ jours/i.test(fact.action.detail ?? ""), false);
  // Aucun « Vérifiez » générique : le verbe nomme le geste réel.
  assert.equal(/^Vérifiez/.test(fact.action.label), false);
});

test("la LIMITATION dit D'ABORD le manque qui explique le rang du fait", () => {
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  const lim = fact.limitation ?? "";
  assert.match(lim, /ni l'ampleur ni les effets/);
  assert.match(lim, /que les autorisations créant des logements/);
  // L'ordre porte le sens : le manque décisif avant la couverture du jeu.
  assert.ok(lim.indexOf("ampleur") < lim.indexOf("créant des logements"), lim);
});

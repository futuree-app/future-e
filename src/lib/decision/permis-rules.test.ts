import test from "node:test";
import assert from "node:assert/strict";
import { PERMIS_RULES } from "./permis-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
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

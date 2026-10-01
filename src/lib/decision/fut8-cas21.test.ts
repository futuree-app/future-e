// FUT-8, cas de référence n°21 : « Je dois absolument quitter Lyon, et j'aimerais éviter Bordeaux ».
// La condition et sa péremption se lisent VILLE PAR VILLE, sur la chaîne réelle du dossier.
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject, type CriterionRef } from "../user-project.ts";
import { buildConfirmation, isStale } from "./conditions.ts";
import { effectiveProject, parsedFingerprint } from "./effective-value.ts";
import { signatureDecisionnelle } from "./projet-materiel.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const LE_1ER = "2026-10-01T00:00:00.000Z";
const DIR: PlaceDirectory = {
  byName: (k) => (k === "lyon" ? { insee: "69123", nom: "Lyon", lat: 45.76, lon: 4.83, uu: "00760", tailleVille: 1_700_000 }
    : k === "bordeaux" ? { insee: "33063", nom: "Bordeaux", lat: 44.84, lon: -0.58, uu: "00752", tailleVille: 1_000_000 } : null),
  plmByName: () => null,
};
function commune(over: Partial<IndexCommune>): IndexCommune {
  return { insee: "00000", nom: "X", dept: "69", region: "ARA", lat: 45.77, lon: 4.88, population: 150_000, densite: 5000, distance_cote_km: 250, altitude: 170, clim: {}, pct: {}, ...(over as IndexCommune) };
}
const VILLEURBANNE = commune({ insee: "69266", nom: "Villeurbanne", uu: "00760" } as Partial<IndexCommune>);
const MERIGNAC = commune({ insee: "33281", nom: "Mérignac", dept: "33", lat: 44.84, lon: -0.65, uu: "00752" } as Partial<IndexCommune>);

const LYON: CriterionRef = { kind: "hard", key: "excludePlace", instance: "lyon" };
function projet(hc: HardConstraints, extra: Record<string, unknown> = {}): UserProject {
  return normalizeUserProject({ posture: "recherche", rawText: "…", updatedAt: LE_1ER, parsed: { reformulation: "x", hardConstraints: hc, preferences: [] }, ...extra })!;
}
// Le lecteur précise le périmètre de Lyon, puis confirme : les deux gestes, dans l'ordre de la spec.
function quitterLyon(scope: "commune" | "unite_urbaine"): UserProject {
  const p = projet({ excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] });
  const def = { kind: "quitter_ville", scope, criterion: LYON, parsedFingerprint: parsedFingerprint(p, LYON), definedAt: LE_1ER, source: "user" };
  const defini = normalizeUserProject({ ...p, definitions: [def] })!;
  return normalizeUserProject({ ...defini, conditions: [buildConfirmation(defini, LYON, LE_1ER)] })!;
}
function dossier(e: IndexCommune, brut: UserProject) {
  const p = effectiveProject(brut); // ce que lit projetDeLecture
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: e.population ?? null, tailleVilleSource: "commune" });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints(p.parsed!.hardConstraints, DIR),
    point: { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  return { run, d: assembleDossier(run, p, "commune", e.nom) };
}

test("cas 21, agglomération : à Villeurbanne, « quitter Lyon » est une condition non respectée, portée par Lyon seul", () => {
  const { run, d } = dossier(VILLEURBANNE, quitterLyon("unite_urbaine"));
  const incompat = run.facts.filter((f) => f.role === "incompatibility");
  assert.equal(incompat.length, 1);
  assert.equal(incompat[0]!.role === "incompatibility" && incompat[0]!.criterionInstance, "lyon");
  assert.equal(d.narrativePlan.verdictLabel, "Condition non respectée");
});

test("cas 21, commune : à Villeurbanne, la condition « quitter Lyon » est respectée", () => {
  const { run, d } = dossier(VILLEURBANNE, quitterLyon("commune"));
  assert.equal(run.facts.some((f) => f.role === "incompatibility"), false);
  const met = run.facts.find((f) => f.role === "condition_met");
  assert.ok(met && met.role === "condition_met" && met.criterion.instance === "lyon");
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
});

test("cas 21 : à Mérignac, Bordeaux reste un écart (jamais une condition), Lyon est respectée", () => {
  const { run } = dossier(MERIGNAC, quitterLyon("unite_urbaine"));
  assert.equal(run.facts.some((f) => f.role === "incompatibility"), false);
  const ecart = run.facts.find((f) => f.role === "mismatch" && f.projectKey === "excludePlace");
  assert.ok(ecart && ecart.role === "mismatch" && ecart.criterionInstance === undefined);
  assert.ok(run.facts.some((f) => f.role === "condition_met"));
});

test("cas 21 : « Lyon » devient « Nantes » au reparse, la condition sur Lyon est périmée, Bordeaux inchangé", () => {
  const avant = quitterLyon("unite_urbaine");
  const apres = normalizeUserProject({ ...avant, parsed: { ...avant.parsed!, hardConstraints: { excludePlace: [{ label: "Nantes" }, { label: "Bordeaux" }] } } })!;
  assert.equal(isStale(apres, LYON), true);
  const { run } = dossier(VILLEURBANNE, apres);
  assert.equal(run.facts.some((f) => f.role === "incompatibility" || f.role === "condition_met" || f.role === "condition_check"), false);
  assert.notEqual(signatureDecisionnelle(avant), signatureDecisionnelle(apres));
});

test("sans confirmation par ville, la famille s'évalue d'un bloc, comme avant", () => {
  const { run } = dossier(VILLEURBANNE, projet({ excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] }));
  const ecarts = run.facts.filter((f) => f.role === "mismatch" && f.projectKey === "excludePlace");
  assert.equal(ecarts.length, 1);
  assert.equal(ecarts[0]!.id.endsWith(":lyon"), false);
});

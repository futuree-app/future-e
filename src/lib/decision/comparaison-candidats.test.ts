import test from "node:test";
import assert from "node:assert/strict";
import { comparerDeuxCandidats, type CandidatCompare } from "./comparaison-candidats.ts";
import type { DecisionArtifactV1 } from "./decision-artifact.ts";
import type { UserProject } from "../user-project.ts";
import type { ProjectCriterionAssessment } from "./criteria-registry.ts";
import { readFile } from "node:fs/promises";

// Deux artefacts figés, construits à la main : ce moteur lit ce qui a été VENDU, il ne le recalcule
// pas. Les fixtures sont donc des artefacts, jamais un run du moteur de règles.

const PROJET = {
  posture: "recherche", intent: "achat", rawText: null, updatedAt: null,
  parsed: { preferences: [{ key: "cadre_calme", weight: 2 }], hardConstraints: {} },
} as unknown as UserProject;

const critere = (
  criterionKey: string, outcome: ProjectCriterionAssessment["outcome"], over: Partial<ProjectCriterionAssessment> = {},
): ProjectCriterionAssessment => ({
  criterionKey, kind: "preference", label: `le critère ${criterionKey}`,
  coverage: outcome === "indeterminate" ? "unexamined" : "examined",
  unexaminedReason: outcome === "indeterminate" ? "inconclusive" : null,
  outcome, maxReserveTier: outcome === "reserve" ? "structuring" : null, ruleIds: [`r.${criterionKey}`],
  ...over,
});

const artefact = (
  registry: ProjectCriterionAssessment[],
  over: Partial<DecisionArtifactV1> = {},
  planOver: Record<string, unknown> = {},
): DecisionArtifactV1 => ({
  schemaVersion: 1,
  generatedAt: "2026-08-10T09:00:00.000Z",
  engineVersion: "engine-1",
  conventionsVersion: "hc-conv-2",
  projectSnapshot: PROJET,
  dossier: {
    scope: "commune+adresse",
    conclusion: "Une conclusion.",
    conclusionState: "arbitration",
    criteria: { registry, coverage: "partial", orientation: "minor_reserves", hasFavorable: true, mismatchStructuring: 0, mismatchSecondary: 0, favorableCount: 1 },
    narrativePlan: {
      verdictLabel: "À arbitrer",
      verdict: { headline: { text: "Deux choses s'opposent ici." } },
      priorityControl: { sourceIds: ["f1"], actions: [{ label: "Demandez au bailleur l'état des risques", anchorId: "f1" }] },
      ...planOver,
    },
    sections: [], controlesTitle: "Les contrôles", compositions: [], absorbedFacts: [],
  },
  ...over,
} as unknown as DecisionArtifactV1);

const candidat = (id: string, label: string, a: DecisionArtifactV1): CandidatCompare => ({ id, label, artifact: a });

const REGISTRE_A = [critere("cadre_calme", "favorable"), critere("faible_chaleur", "reserve"), critere("acces_transports", "mismatch")];
const REGISTRE_B = [critere("cadre_calme", "reserve"), critere("faible_chaleur", "reserve"), critere("acces_transports", "favorable")];

test("aucune note, aucun gagnant : la sortie ne contient rien qui se trie", () => {
  // ADR-0001. Le test porte sur la SURFACE du module : s'il exposait un jour un total, un score ou
  // un « meilleur », il faudrait le voir ici avant qu'un écran ne l'affiche.
  const r = comparerDeuxCandidats(candidat("a", "2 chemin des Pierrières", artefact(REGISTRE_A)), candidat("b", "8 rue du Port", artefact(REGISTRE_B)));
  const serialise = JSON.stringify(r);
  assert.doesNotMatch(serialise, /"score"|"note"|"total"|"rang"|"gagnant"|"meilleur"|"classement"|"moyenne"/i);
  assert.equal(Object.keys(r).sort().join(","), "a,b,comparabilite,criteresNonPartages,lignes");
});

test("chaque candidat porte ce qui correspond, ce qui contredit, les compromis et les inconnues", () => {
  const r = comparerDeuxCandidats(candidat("a", "A", artefact(REGISTRE_A)), candidat("b", "B", artefact(REGISTRE_B)));
  assert.deepEqual(r.a.correspond.map((c) => c.criterionKey), ["cadre_calme"]);
  assert.deepEqual(r.a.compromis.map((c) => c.criterionKey), ["faible_chaleur"]);
  assert.deepEqual(r.a.contredit.map((c) => `${c.criterionKey}:${c.outcome}`), ["acces_transports:mismatch"]);
  assert.deepEqual(r.a.inconnues, []);
  assert.deepEqual(r.b.correspond.map((c) => c.criterionKey), ["acces_transports"]);
});

test("les inconnues restent nommées, avec la raison quand elle est connue", () => {
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact([critere("vie_locale", "indeterminate", { unexaminedReason: "no_rule" })])),
    candidat("b", "B", artefact([critere("vie_locale", "favorable")])),
  );
  assert.deepEqual(r.a.inconnues, [{ criterionKey: "vie_locale", label: "le critère vie_locale", raison: "no_rule" }]);
  // Et un critère qu'un seul des deux a su lire ne se compare PAS : il se signale.
  assert.equal(r.lignes[0]!.relation, "indetermine_ici");
});

test("le contrôle prioritaire est repris MOT POUR MOT, jamais reformulé", () => {
  const r = comparerDeuxCandidats(candidat("a", "A", artefact(REGISTRE_A)), candidat("b", "B", artefact(REGISTRE_B)));
  assert.deepEqual(r.a.controlesPrioritaires, [{ label: "Demandez au bailleur l'état des risques", anchorId: "f1" }]);
});

test("un dossier sans contrôle prioritaire ne s'en invente pas un", () => {
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A, {}, { priorityControl: null })),
    candidat("b", "B", artefact(REGISTRE_B)),
  );
  assert.deepEqual(r.a.controlesPrioritaires, []);
});

test("la version et la date de chaque analyse voyagent avec elle", () => {
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A, { generatedAt: "2026-06-01T08:00:00.000Z" })),
    candidat("b", "B", artefact(REGISTRE_B)),
  );
  assert.equal(r.a.version.generatedAt, "2026-06-01T08:00:00.000Z");
  assert.equal(r.b.version.generatedAt, "2026-08-10T09:00:00.000Z");
  assert.equal(r.a.version.engineVersion, "engine-1");
});

test("MÊME CADRE : la différence est une différence de lecture, pas encore une différence de lieu", () => {
  const r = comparerDeuxCandidats(candidat("a", "A", artefact(REGISTRE_A)), candidat("b", "B", artefact(REGISTRE_B)));
  assert.equal(r.comparabilite.memeCadreDAnalyse, true);
  assert.deepEqual(r.comparabilite.reserves, []);
  const parCle = new Map(r.lignes.map((l) => [l.criterionKey, l]));
  assert.equal(parCle.get("cadre_calme")!.relation, "difference_dans_le_meme_cadre");
  assert.equal(parCle.get("faible_chaleur")!.relation, "meme_lecture");
});

test("MOTEUR DIFFÉRENT : l'écart existe toujours, mais le cadre lui-même diffère", () => {
  // Le piège que ce module existe pour éviter : deux dossiers produits à six mois d'écart, dont la
  // différence vient d'une règle qui a changé. On ne masque pas l'écart, on refuse de l'imputer.
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A, { engineVersion: "engine-1" })),
    candidat("b", "B", artefact(REGISTRE_B, { engineVersion: "engine-2" })),
  );
  assert.equal(r.comparabilite.memeCadreDAnalyse, false);
  assert.match(r.comparabilite.reserves[0]!, /pas été produites par le même moteur/);
  assert.equal(r.lignes.find((l) => l.criterionKey === "cadre_calme")!.relation, "difference_hors_cadre_commun");
  // Ce qui est IDENTIQUE des deux côtés reste identique : la réserve ne fabrique pas de doute.
  assert.equal(r.lignes.find((l) => l.criterionKey === "faible_chaleur")!.relation, "meme_lecture");
});

test("PROJETS DIFFÉRENTS : la réserve le dit, avec la même signature que la péremption d'un dossier", () => {
  const autreProjet = { ...PROJET, intent: "location" } as unknown as UserProject;
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A)),
    candidat("b", "B", artefact(REGISTRE_B, { projectSnapshot: autreProjet })),
  );
  assert.equal(r.comparabilite.memeCadreDAnalyse, false);
  assert.ok(r.comparabilite.reserves.some((x) => /pas au même projet/.test(x)));
});

test("ÉCHELLES DIFFÉRENTES : comparer une commune et une adresse est signalé", () => {
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A)),
    candidat("b", "B", artefact(REGISTRE_B, {}, {})),
  );
  assert.equal(r.comparabilite.memeCadreDAnalyse, true);
  const r2 = comparerDeuxCandidats(
    candidat("a", "A", artefact(REGISTRE_A)),
    candidat("b", "B", { ...artefact(REGISTRE_B), dossier: { ...artefact(REGISTRE_B).dossier, scope: "commune" } } as DecisionArtifactV1),
  );
  assert.equal(r2.comparabilite.memeCadreDAnalyse, false);
  assert.ok(r2.comparabilite.reserves.some((x) => /pas sur la même échelle/.test(x)));
});

test("un critère connu d'un seul dossier est NOMMÉ, jamais écarté en silence", () => {
  const r = comparerDeuxCandidats(
    candidat("a", "A", artefact([critere("cadre_calme", "favorable"), critere("faible_chaleur", "reserve")])),
    candidat("b", "B", artefact([critere("cadre_calme", "reserve"), critere("acces_transports", "favorable")])),
  );
  assert.deepEqual(r.criteresNonPartages, [
    { criterionKey: "faible_chaleur", label: "le critère faible_chaleur", presentChez: "a" },
    { criterionKey: "acces_transports", label: "le critère acces_transports", presentChez: "b" },
  ]);
  assert.deepEqual(r.lignes.map((l) => l.criterionKey), ["cadre_calme", "faible_chaleur", "acces_transports"]);
  assert.equal(r.lignes[1]!.b, null);
  assert.equal(r.lignes[2]!.a, null);
});

test("DÉTERMINISME : même entrée, même sortie ; et l'ordre des lignes suit le projet, pas la colonne", () => {
  const a = candidat("a", "A", artefact(REGISTRE_A));
  const b = candidat("b", "B", artefact(REGISTRE_B));
  assert.deepEqual(comparerDeuxCandidats(a, b), comparerDeuxCandidats(a, b));
  // Les deux dossiers partageant le même projet, ils portent le même registre dans le même ordre :
  // inverser les colonnes ne réordonne donc pas les critères.
  assert.deepEqual(
    comparerDeuxCandidats(a, b).lignes.map((l) => l.criterionKey),
    comparerDeuxCandidats(b, a).lignes.map((l) => l.criterionKey),
  );
});

test("INVERSER LES COLONNES INVERSE LA LECTURE, sans rien changer d'autre", () => {
  // La symétrie est la garantie qu'aucun côté n'est privilégié : `a` et `b` sont l'ordre de
  // sélection du lecteur, jamais une hiérarchie.
  const a = candidat("a", "A", artefact(REGISTRE_A));
  const b = candidat("b", "B", artefact(REGISTRE_B));
  const droit = comparerDeuxCandidats(a, b);
  const inverse = comparerDeuxCandidats(b, a);
  assert.deepEqual(inverse.a, droit.b);
  assert.deepEqual(inverse.b, droit.a);
  assert.deepEqual(
    inverse.lignes.map((l) => l.relation),
    droit.lignes.map((l) => l.relation),
  );
});

test("CE QUE LE MODULE NE VÉRIFIE PAS EST ÉCRIT DANS LE MODULE", async () => {
  // Un même moteur peut avoir lu deux états différents d'une même source (BPE 2024 contre BPE 2025,
  // index régénéré entre-temps) : l'écart viendrait alors d'une mise à jour de donnée, pas du lieu.
  // Ce test ne prétend pas couvrir le défaut — il empêche qu'on l'oublie en croyant `memeCadreDAnalyse`
  // plus fort qu'il n'est, et il tombera le jour où quelqu'un retirera l'avertissement sans traiter
  // la question.
  const source = await readFile(new URL("./comparaison-candidats.ts", import.meta.url), "utf8");
  assert.match(source, /ne compare PAS les MILLÉSIMES DES DONNÉES SOURCES/);
  assert.match(source, /AUCUNE SURFACE NE DOIT RENDRE CE MODULE/);
  // Et le nom du champ ne doit pas redevenir une promesse d'attribution.
  const r = comparerDeuxCandidats(candidat("a", "A", artefact(REGISTRE_A)), candidat("b", "B", artefact(REGISTRE_B)));
  assert.equal("comparable" in r.comparabilite, false);
  assert.equal(typeof r.comparabilite.memeCadreDAnalyse, "boolean");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDecisionArtifact, buildDecisionArtifact, artifactScopeKey, ENGINE_VERSION,
} from "./decision-artifact.ts";
import type { Dossier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

const PROJECT = {
  posture: "recherche", intent: null, rawText: null,
  parsed: { preferences: [] }, updatedAt: "1970-01-01T00:00:00.000Z",
} as unknown as UserProject;

/** Le minimum structurel dont le rendu dépend. Volontairement pauvre : le parseur ne doit pas
 *  exiger davantage, sinon il refuserait des artefacts que l'écran sait pourtant afficher. */
const dossier = (over: Record<string, unknown> = {}): Dossier => ({
  scope: "commune",
  conclusion: "Une conclusion.",
  conclusionState: "arbitration",
  sections: [{ key: "verifications", title: "À contrôler", cards: [] }],
  controlesTitle: "Les contrôles",
  compositions: [],
  absorbedFacts: [],
  ...over,
} as unknown as Dossier);

const artefact = () =>
  buildDecisionArtifact(dossier(), PROJECT, "2026-08-05T09:30:00.000Z", "hc-conv-2");

test("un artefact fraîchement construit se relit", () => {
  // Le cas qui compte le plus : ce que le code écrit aujourd'hui, il doit savoir le relire.
  const relu = parseDecisionArtifact(JSON.parse(JSON.stringify(artefact())));
  assert.ok(relu, "l'artefact que le code vient de produire est refusé par son propre parseur");
  assert.equal(relu!.schemaVersion, 1);
  assert.equal(relu!.engineVersion, ENGINE_VERSION);
  assert.equal(relu!.conventionsVersion, "hc-conv-2");
  assert.equal(relu!.dossier.conclusion, "Une conclusion.");
});

test("IL REFUSE, IL NE RÉPARE PAS", () => {
  // Compléter un artefact incomplet produirait un dossier moitié figé moitié recalculé, c'est-à-dire
  // exactement l'hybride que ce lot supprime.
  const incomplets: [string, unknown][] = [
    ["enveloppe absente", null],
    ["schemaVersion d'une autre version", { ...artefact(), schemaVersion: 2 }],
    ["dossier absent", { ...artefact(), dossier: undefined }],
    ["sections absentes", { ...artefact(), dossier: { ...dossier(), sections: undefined } }],
    ["conclusion absente", { ...artefact(), dossier: { ...dossier(), conclusion: undefined } }],
    ["compositions absentes", { ...artefact(), dossier: { ...dossier(), compositions: undefined } }],
    ["version de moteur vide", { ...artefact(), engineVersion: "" }],
  ];
  for (const [quoi, valeur] of incomplets) {
    assert.equal(parseDecisionArtifact(valeur), null, `accepté à tort : ${quoi}`);
  }
});

test("UNE DATE DE GÉNÉRATION ILLISIBLE EST REFUSÉE", () => {
  // Une date absente se voit ; une date illisible s'affiche « Invalid Date » au milieu du dossier,
  // ce qui est pire : le lecteur croit à un bug de sa décision, pas d'un champ.
  assert.equal(parseDecisionArtifact({ ...artefact(), generatedAt: "hier" }), null);
  assert.equal(parseDecisionArtifact({ ...artefact(), generatedAt: "" }), null);
  assert.ok(parseDecisionArtifact({ ...artefact(), generatedAt: "2026-08-05T09:30:00.000Z" }));
});

test("un champ INCONNU ne fait pas tomber la relecture", () => {
  // Le pendant du test précédent, et il est aussi important : un artefact écrit par une version
  // PLUS RÉCENTE, portant un champ que ce code ignore, doit rester lisible. Un parseur strict
  // rendrait chaque déploiement destructeur pour les dossiers déjà vendus.
  const avecInconnu = {
    ...artefact(),
    champQuiNexistePasEncore: 42,
    dossier: { ...dossier(), autreChampFutur: "x" },
  };
  const relu = parseDecisionArtifact(avecInconnu);
  assert.ok(relu, "un champ supplémentaire fait tomber la relecture");
  assert.equal(relu!.dossier.conclusion, "Une conclusion.");
});

test("la clé sépare la commune de chaque logement", () => {
  // Deux adresses d'une même commune ne doivent jamais se marcher dessus, et le dossier communal
  // ne doit pas écraser celui d'une adresse.
  assert.equal(artifactScopeKey(null), "commune");
  assert.equal(artifactScopeKey("abc-123"), "logement:abc-123");
  assert.notEqual(artifactScopeKey("a"), artifactScopeKey("b"));
});

test("LA FIXTURE V1, telle qu'un artefact réel se présente en base", () => {
  // LA QUESTION QUE CETTE FIXTURE PROTÈGE : le code de février 2027 sait-il encore ouvrir un
  // artefact réellement produit en août 2026 ? Elle est écrite en dur, jamais régénérée depuis le
  // code courant : régénérée, elle prouverait seulement que le code sait se relire lui-même, ce qui
  // est justement la chose qu'on ne cherche pas à vérifier.
  const fixtureAout2026 = {
    schemaVersion: 1,
    generatedAt: "2026-08-05T09:30:00.000Z",
    engineVersion: "engine-1",
    conventionsVersion: "hc-conv-2",
    projectSnapshot: {
      posture: "recherche", intent: null, rawText: null,
      parsed: { preferences: [{ key: "cadre_calme", weight: 2 }] },
      updatedAt: "2026-08-05T09:00:00.000Z",
    },
    dossier: {
      scope: "commune",
      conclusionState: "arbitration",
      conclusion: "La Rochelle tient vos priorités, sous réserve de deux contrôles.",
      controlesTitle: "Les contrôles à mener",
      sections: [
        { key: "alignments", title: "Ce qui correspond à votre projet", cards: [] },
        { key: "verifications", title: "Les contrôles à mener", cards: [] },
      ],
      compositions: [],
      absorbedFacts: [],
      presentation: { elementaryFactShown: 2, compositionShown: 0, absorbedFactTotal: 0 },
      uncovered: [],
    },
  };
  const relu = parseDecisionArtifact(fixtureAout2026);
  assert.ok(relu, "un artefact d'août 2026 n'est plus relisible par le code courant");
  assert.equal(relu!.dossier.sections.length, 2);
  assert.match(relu!.dossier.conclusion, /La Rochelle/);
});

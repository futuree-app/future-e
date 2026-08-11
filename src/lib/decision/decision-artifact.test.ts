import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDecisionArtifact, buildDecisionArtifact, artifactScopeKey, ENGINE_VERSION,
  dossierAServir, artefactPerimeParLeDpe,
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

// ── LE TEST D'ACCEPTATION DU LOT ────────────────────────────────────────────────────────────
//
// « Générer un dossier, modifier un seuil du moteur, rouvrir : la décision reste identique. »
// Le changement de seuil se simule par ce qu'il PRODUIT, un assemblage différent, ce qui est
// exactement ce que la fonction reçoit.

test("L'ARTEFACT GAGNE SUR L'ASSEMBLAGE DU JOUR", () => {
  const vendu = buildDecisionArtifact(
    dossier({ conclusion: "Ce que futur•e disait le 5 août." }),
    PROJECT, "2026-08-05T09:30:00.000Z", "hc-conv-2",
  );
  const stocke = { version: 1, status: "ready" as const, generatedAt: vendu.generatedAt, artifact: vendu };
  // Ce que le moteur de février 2027 conclurait, seuils révisés.
  const aujourdhui = dossier({ conclusion: "Ce que le moteur dirait aujourd'hui." });

  const servi = dossierAServir(stocke, aujourdhui);
  assert.equal(servi.source, "artefact");
  assert.equal((servi.dossier as typeof aujourdhui).conclusion, "Ce que futur•e disait le 5 août.");
  assert.equal(servi.generatedAt, "2026-08-05T09:30:00.000Z");
});

test("SANS ARTEFACT, on sert l'assemblage ET AUCUNE DATE", () => {
  // La date est ce qui rend le figement visible. L'afficher sur un dossier recalculé à l'instant
  // annoncerait un figement qui n'a pas eu lieu, ce qui est le mensonge exactement inverse de
  // celui que ce lot corrige.
  const vivant = dossier({ conclusion: "Assemblé à l'instant." });
  for (const stocke of [
    null,
    { version: 1, status: "generating" as const, generatedAt: null, artifact: null },
    { version: 1, status: "failed" as const, generatedAt: null, artifact: null },
    // `ready` mais payload illisible : le parseur a refusé, l'appelant ne doit pas s'en apercevoir.
    { version: 1, status: "ready" as const, generatedAt: "2026-08-05T09:30:00.000Z", artifact: null },
  ]) {
    const servi = dossierAServir(stocke, vivant);
    assert.equal(servi.source, "assemblage", JSON.stringify(stocke));
    assert.equal(servi.generatedAt, null, "une date est apparue sur un dossier non figé");
    assert.equal((servi.dossier as typeof vivant).conclusion, "Assemblé à l'instant.");
  }
});

// ── La péremption par le diagnostic ────────────────────────────────────────────

test("le DPE choisi APRÈS le figement périme l'artefact", () => {
  // Le cas réel, et il est structurel : l'artefact est figé au webhook, où le client n'a par
  // construction pas encore choisi son diagnostic (`savedDpe: null`). S'il le choisit ensuite, le
  // dossier le porte, l'écran Logement l'affiche, et la conclusion figée continue de l'ignorer.
  const fige = {
    version: 1, status: "ready" as const,
    generatedAt: "2026-08-05T09:30:00.000Z",
    artifact: { generatedAt: "2026-08-05T09:30:00.000Z" },
  };
  assert.equal(artefactPerimeParLeDpe(fige, "2026-08-06T11:00:00.000Z"), true);
});

test("le DPE choisi AVANT le figement n'y change rien", () => {
  const fige = {
    version: 1, status: "ready" as const,
    generatedAt: "2026-08-05T09:30:00.000Z",
    artifact: { generatedAt: "2026-08-05T09:30:00.000Z" },
  };
  // L'artefact l'a vu : le périmer relancerait une génération à chaque ouverture.
  assert.equal(artefactPerimeParLeDpe(fige, "2026-08-05T09:00:00.000Z"), false);
  assert.equal(artefactPerimeParLeDpe(fige, null), false);
});

test("rien à périmer quand il n'y a rien de figé, ni sur une date illisible", () => {
  const apres = "2026-08-06T11:00:00.000Z";
  // Aucun artefact, ou un artefact que le parseur a refusé : le chemin normal génère déjà.
  assert.equal(artefactPerimeParLeDpe(null, apres), false);
  assert.equal(
    artefactPerimeParLeDpe({ version: 1, status: "generating", generatedAt: null, artifact: null }, apres),
    false,
  );
  // UNE DATE ILLISIBLE NE PÉRIME JAMAIS. L'inverse ferait régénérer sans fin un dossier dont une
  // date est corrompue, à chaque ouverture, sans que rien ne le dise.
  assert.equal(
    artefactPerimeParLeDpe(
      { version: 1, status: "ready", generatedAt: "pas une date", artifact: { generatedAt: "pas une date" } },
      apres,
    ),
    false,
  );
  assert.equal(
    artefactPerimeParLeDpe(
      { version: 1, status: "ready", generatedAt: "2026-08-05T09:30:00.000Z", artifact: { generatedAt: "2026-08-05T09:30:00.000Z" } },
      "hier matin",
    ),
    false,
  );
});

// ── Le snapshot de données : ce que d'autres surfaces doivent réafficher à l'identique ─────────

test("le snapshot de données survit à l'aller-retour JSON", () => {
  const artefact = buildDecisionArtifact(
    { scope: "commune", conclusion: "x", conclusionState: "y", sections: [], controlesTitle: "t", compositions: [], absorbedFacts: [] } as never,
    {} as never, "2026-08-11T10:00:00.000Z", "hc-conv-1",
    { catnatInondation: { count: 6, depuis: 1982, origine: "index_local", insee: "17300", version: "catnat-1" } },
  );
  const relu = parseDecisionArtifact(JSON.parse(JSON.stringify(artefact)));
  assert.equal(relu?.dataSnapshot?.catnatInondation?.count, 6);
  assert.equal(relu?.dataSnapshot?.catnatInondation?.insee, "17300");
});

test("un artefact SANS snapshot reste parfaitement valide", () => {
  // Tous ceux vendus avant le 11/08/2026. Leur lecteur doit continuer de voir son dossier ; la
  // carte du module retombe alors sur l'index courant, ce qui est dégradé, jamais cassé.
  const artefact = buildDecisionArtifact(
    { scope: "commune", conclusion: "x", conclusionState: "y", sections: [], controlesTitle: "t", compositions: [], absorbedFacts: [] } as never,
    {} as never, "2026-08-05T10:00:00.000Z", "hc-conv-1",
  );
  assert.equal("dataSnapshot" in artefact, false, "aucun objet vide : il ferait croire qu'on a figé quelque chose");
  assert.ok(parseDecisionArtifact(JSON.parse(JSON.stringify(artefact))));
});

test("un snapshot au compte aberrant fait REFUSER l'artefact entier", () => {
  // Le parseur refuse, il ne répare pas : un artefact à demi lisible produirait un dossier moitié
  // figé moitié recalculé, l'hybride que tout ce lot supprime. L'appelant retombe sur l'assemblage
  // vivant, comme pour n'importe quel payload illisible.
  const base = buildDecisionArtifact(
    { scope: "commune", conclusion: "x", conclusionState: "y", sections: [], controlesTitle: "t", compositions: [], absorbedFacts: [] } as never,
    {} as never, "2026-08-11T10:00:00.000Z", "hc-conv-1",
    { catnatInondation: { count: 6, depuis: 1982, origine: "index_local", insee: "17300", version: "catnat-1" } },
  );
  const corrompu = JSON.parse(JSON.stringify(base));
  corrompu.dataSnapshot.catnatInondation.count = -2;
  assert.equal(parseDecisionArtifact(corrompu), null);
  corrompu.dataSnapshot.catnatInondation.count = 1.5;
  assert.equal(parseDecisionArtifact(corrompu), null);
});

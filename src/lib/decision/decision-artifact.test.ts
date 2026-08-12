import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDecisionArtifact, buildDecisionArtifact, artifactScopeKey, ENGINE_VERSION,
  dossierAServir, artefactPerimeParLeDpe,
  etatArtefact, prochaineVersionAReserver, prochaineVersionAutomatique,
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
  const stocke = {
    servedVersion: 1, artifact: vendu, generatedAt: vendu.generatedAt,
    headVersion: 1, headStatus: "ready" as const, headCreatedAt: null,
  };
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
    { servedVersion: null, artifact: null, generatedAt: null, headVersion: 1, headStatus: "generating" as const, headCreatedAt: null },
    { servedVersion: null, artifact: null, generatedAt: null, headVersion: 1, headStatus: "failed" as const, headCreatedAt: null },
    // `ready` mais payload illisible : le parseur a refusé, l'appelant ne doit pas s'en apercevoir.
    { servedVersion: null, artifact: null, generatedAt: null, headVersion: 1, headStatus: "ready" as const, headCreatedAt: null },
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
    servedVersion: 1, headVersion: 1, headStatus: "ready" as const, headCreatedAt: null,
    generatedAt: "2026-08-05T09:30:00.000Z",
    artifact: { generatedAt: "2026-08-05T09:30:00.000Z" },
  };
  assert.equal(artefactPerimeParLeDpe(fige, "2026-08-06T11:00:00.000Z"), true);
});

test("le DPE choisi AVANT le figement n'y change rien", () => {
  const fige = {
    servedVersion: 1, headVersion: 1, headStatus: "ready" as const, headCreatedAt: null,
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
    artefactPerimeParLeDpe(
      { servedVersion: null, artifact: null, generatedAt: null, headVersion: 1, headStatus: "generating", headCreatedAt: null },
      apres,
    ),
    false,
  );
  // UNE DATE ILLISIBLE NE PÉRIME JAMAIS. L'inverse ferait régénérer sans fin un dossier dont une
  // date est corrompue, à chaque ouverture, sans que rien ne le dise.
  assert.equal(
    artefactPerimeParLeDpe(
      {
        servedVersion: 1, headVersion: 1, headStatus: "ready", headCreatedAt: null,
        generatedAt: "pas une date", artifact: { generatedAt: "pas une date" },
      },
      apres,
    ),
    false,
  );
  assert.equal(
    artefactPerimeParLeDpe(
      {
        servedVersion: 1, headVersion: 1, headStatus: "ready", headCreatedAt: null,
        generatedAt: "2026-08-05T09:30:00.000Z", artifact: { generatedAt: "2026-08-05T09:30:00.000Z" },
      },
      "hier matin",
    ),
    false,
  );
});

// ── L'ÉTAT D'UN SCOPE : ce qu'on sert, et où en est la dernière tentative ─────────────────────
//
// CES TRANSITIONS N'ÉTAIENT COUVERTES PAR AUCUN TEST (revue du 12/08/2026), alors que la lecture
// vivait dans un module `server-only` qu'aucun test ne peut charger. Vingt tests passaient à côté
// d'un blocage complet : après une v2 en échec, plus aucune version ne naissait.

const MAINTENANT = new Date("2026-08-12T12:00:00.000Z");
const ligne = (
  version: number, status: "ready" | "generating" | "failed",
  payload: unknown = null, createdAt: string | null = "2026-08-12T11:59:00.000Z",
) => ({ version, status, generatedAt: null, createdAt, payload });

const payloadValide = (quand: string) =>
  JSON.parse(JSON.stringify(buildDecisionArtifact(dossier(), PROJECT, quand, "hc-conv-2")));

const v1Prete = () => ligne(1, "ready", payloadValide("2026-08-05T09:30:00.000Z"));

test("une v2 EN COURS ne masque pas la v1 vendue, et n'autorise pas de v3", () => {
  const etat = etatArtefact([ligne(2, "generating"), v1Prete()]);
  assert.equal(etat?.servedVersion, 1, "la version vendue doit rester servie pendant la génération");
  assert.equal(etat?.artifact?.generatedAt, "2026-08-05T09:30:00.000Z");
  assert.equal(etat?.headVersion, 2);
  assert.equal(etat?.headStatus, "generating");
  // Attendre, sans annoncer un succès : doubler la génération ne produirait rien, la contrainte
  // unique refusant la place.
  assert.equal(prochaineVersionAReserver(etat, MAINTENANT), null);
});

test("une GÉNÉRATION ABANDONNÉE ne verrouille pas le dossier pour toujours", () => {
  // `generating` est écrit AVANT le travail. Une fonction tuée entre les deux laisse une ligne qui
  // ne changera plus jamais de statut : sans échéance, chaque clic répondait « déjà en cours » et le
  // dossier ne produisait plus aucune version.
  const abandonnee = etatArtefact([ligne(2, "generating", null, "2026-08-12T11:00:00.000Z"), v1Prete()]);
  assert.equal(prochaineVersionAReserver(abandonnee, MAINTENANT), 3, "une heure d'attente doit libérer le numéro suivant");
  // Une génération qui vient de partir, elle, doit être attendue : le bail est très au-dessus des
  // 60 s de `maxDuration`.
  const recente = etatArtefact([ligne(2, "generating", null, "2026-08-12T11:58:00.000Z"), v1Prete()]);
  assert.equal(prochaineVersionAReserver(recente, MAINTENANT), null);
  // SANS DATE LISIBLE, ON N'AFFIRME PAS L'ABANDON : le doute laisse la génération vivre.
  for (const date of [null, "hier"]) {
    const sansDate = etatArtefact([ligne(2, "generating", null, date), v1Prete()]);
    assert.equal(prochaineVersionAReserver(sansDate, MAINTENANT), null, `abandon affirmé sur ${date}`);
  }
  // La v1 vendue reste servie dans tous les cas.
  assert.equal(abandonnee?.servedVersion, 1);
});

test("une v2 EN ÉCHEC laisse naître une v3 : c'est tout l'objet de la correction", () => {
  const etat = etatArtefact([ligne(2, "failed"), v1Prete()]);
  assert.equal(etat?.servedVersion, 1, "l'échec ne doit pas coûter au lecteur la version qu'il a payée");
  assert.equal(etat?.headStatus, "failed");
  assert.equal(prochaineVersionAReserver(etat, MAINTENANT), 3, "après un échec, chaque clic répondait ok sans rien créer");
});

test("PLUSIEURS ÉCHECS D'AFFILÉE : la v1 reste servie, et le rattrapage automatique s'arrête", () => {
  // La garantie s'arrêtait à cinq lignes : au sixième échec, la v1 PRÊTE sortait de la fenêtre de
  // lecture et disparaissait de l'écran d'un client qui l'avait payée.
  const etat = etatArtefact([ligne(9, "failed"), v1Prete()]);
  assert.equal(etat?.servedVersion, 1);
  assert.equal(etat?.headVersion, 9);
  // La demande EXPLICITE reste possible : elle est bornée par les clics du lecteur.
  assert.equal(prochaineVersionAReserver(etat, MAINTENANT), 10);
  // Le rattrapage lancé au RENDU, lui, s'arrête : sinon une panne durable créerait une version
  // morte par rechargement de page.
  assert.equal(prochaineVersionAutomatique(etat, MAINTENANT), null);
  assert.equal(
    prochaineVersionAutomatique(etatArtefact([ligne(2, "failed"), v1Prete()]), MAINTENANT),
    3,
    "un premier échec doit encore se rattraper tout seul",
  );
});

test("LE PREMIER ÉCHEC D'UN DOSSIER SANS AUCUNE VERSION SERVIE se retente", () => {
  // Le cas du dossier d'ADRESSE dont la toute première génération rate : la ligne existe, donc
  // « aucune ligne » est faux, et il n'y a rien à périmer. Sans reprise, ce dossier vendu se
  // réassemblerait à chaque ouverture, sans jamais être figé ni daté.
  const etat = etatArtefact([ligne(1, "failed")]);
  assert.equal(etat?.servedVersion, null);
  assert.equal(etat?.artifact, null, "c'est cette absence, et non celle de la ligne, qui déclenche la reprise");
  assert.equal(prochaineVersionAutomatique(etat, MAINTENANT), 2);
});

test("un PAYLOAD INVALIDE n'est pas une version servie", () => {
  // Un artefact écrit sous un contrat antérieur : `ready` en base, illisible ici. On passe à la
  // version prête suivante, et à défaut on ne sert rien : l'appelant retombe sur l'assemblage.
  const etat = etatArtefact([ligne(2, "ready", { schemaVersion: 7 }), v1Prete()]);
  assert.equal(etat?.servedVersion, 1, "la version lisible d'en dessous doit prendre le relais");
  assert.equal(etat?.headVersion, 2);
  assert.equal(etat?.headStatus, "ready");

  // Plusieurs versions prêtes ILLISIBLES d'affilée ne masquent pas la version valide du dessous :
  // l'invariant est absolu, la lecture pagine jusqu'à elle.
  const empilees = etatArtefact([
    ligne(5, "ready", { schemaVersion: 7 }), ligne(4, "ready", { schemaVersion: 7 }),
    ligne(3, "ready", { schemaVersion: 7 }), ligne(2, "ready", { schemaVersion: 7 }),
    v1Prete(),
  ]);
  assert.equal(empilees?.servedVersion, 1);
  assert.equal(empilees?.headVersion, 5);

  const aucune = etatArtefact([ligne(1, "ready", { schemaVersion: 7 })]);
  assert.equal(aucune?.servedVersion, null);
  assert.equal(aucune?.artifact, null);
  assert.equal(prochaineVersionAReserver(aucune, MAINTENANT), 2);
});

test("LA TÊTE ET SON STATUT VIENNENT DE LA MÊME LIGNE", () => {
  // Les deux lectures du store partent l'une après l'autre : une version qui se termine entre les
  // deux apparaît dans l'une sans l'autre. Composer `headVersion` d'une ligne et `headStatus` d'une
  // autre annoncerait un état qui n'a jamais existé, et ferait réserver une v3 inutile.
  const etat = etatArtefact([
    ligne(2, "generating"),                                     // la tête, lue avant la fin
    ligne(2, "ready", payloadValide("2026-08-12T10:00:00.000Z")), // la même, lue après
    v1Prete(),
  ]);
  assert.equal(etat?.headVersion, 2);
  assert.equal(etat?.headStatus, "ready", "un statut ne recule jamais : la forme la plus avancée gagne");
  assert.equal(etat?.servedVersion, 2, "la v2 terminée doit être servie, pas la v1");
  assert.equal(prochaineVersionAReserver(etat, MAINTENANT), 3);
});

test("aucune ligne : ce scope n'a JAMAIS eu d'artefact, ce qui n'est pas un échec", () => {
  assert.equal(etatArtefact([]), null);
  assert.equal(prochaineVersionAReserver(null, MAINTENANT), 1, "le premier figement réserve la v1");
  assert.equal(prochaineVersionAutomatique(null, MAINTENANT), 1);
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

test("un snapshot aberrant TOMBE SEUL : la décision vendue survit", () => {
  // CE TEST FIGEAIT LE COMPORTEMENT DANGEREUX (revue du 11/08/2026). Le snapshot vivait dans le
  // schéma principal : un bloc corrompu faisait refuser l'artefact ENTIER, `dossierAServir`
  // retombait en silence sur l'assemblage vivant, et la corruption d'un enrichissement annexe
  // réécrivait toute la décision vendue.
  //
  // Le dossier figé est la vente ; le snapshot n'est qu'un confort de réaffichage pour une autre
  // surface. Leurs échecs ne peuvent pas coûter la même chose.
  const base = buildDecisionArtifact(
    { scope: "commune", conclusion: "x", conclusionState: "y", sections: [], controlesTitle: "t", compositions: [], absorbedFacts: [] } as never,
    {} as never, "2026-08-11T10:00:00.000Z", "hc-conv-1",
    { catnatInondation: { count: 6, depuis: 1982, origine: "index_local", insee: "17300", version: "catnat-1" } },
  );
  for (const aberrant of [-2, 1.5, "sept", null]) {
    const corrompu = JSON.parse(JSON.stringify(base));
    corrompu.dataSnapshot.catnatInondation.count = aberrant;
    const relu = parseDecisionArtifact(corrompu);
    assert.ok(relu, `l'artefact entier a été refusé pour un snapshot à ${aberrant}`);
    assert.equal(relu!.dataSnapshot, undefined, "le snapshot illisible doit disparaître");
    assert.equal(relu!.dossier.conclusion, "x", "la décision vendue doit survivre intacte");
  }

  // Un `dataSnapshot` qui n'est même pas un objet tombe pareil.
  const pasUnObjet = JSON.parse(JSON.stringify(base));
  pasUnObjet.dataSnapshot = "n'importe quoi";
  assert.ok(parseDecisionArtifact(pasUnObjet));
  assert.equal(parseDecisionArtifact(pasUnObjet)!.dataSnapshot, undefined);
});

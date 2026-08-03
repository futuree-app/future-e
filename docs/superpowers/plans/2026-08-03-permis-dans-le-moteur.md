# Les permis d'urbanisme dans le moteur de décision

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une règle `autour.permis` fait entrer le registre des autorisations d'urbanisme dans le `REGISTRY`, pour que le fait cesse d'être affiché sans être examinable.

**Architecture:** Un fichier de règles neuf, `permis-rules.ts`, sur le patron exact de `secteur-rules.ts`. Il lit un champ optionnel ajouté à `ModuleFacts`, alimenté depuis le snapshot déjà gelé du dossier d'adresse. Aucune I/O nouvelle, aucune source nouvelle, aucun appel réseau : la donnée est déjà payée et figée.

**Tech Stack:** TypeScript, `node --test` sur les `.ts` directement, React 19 / Next App Router pour les deux fichiers d'écran.

**Spec :** `docs/superpowers/specs/2026-08-03-permis-dans-le-moteur-design.md`

## Global Constraints

- **`materialityTier: "secondary"`, toujours.** L'ouverture du chantier augmente la certitude temporelle du constat, jamais sa matérialité décisionnelle.
- **`projectKeys: []`.** Aucune préférence n'active cette règle, et elle n'entre donc jamais dans le verdict de correspondance.
- **Rayon et fenêtre viennent du snapshot** (`p.rayonMeters`, `p.ancienneteMaxAns`), jamais des constantes `RAYON_PERMIS_M` / `ANCIENNETE_MAX_ANS`.
- **`uncertain` quand le registre n'a pas été consulté**, jamais `not_applicable`, qui dit « hors sujet ».
- **`topic` et `action.label` : 70 caractères maximum, aucun point final** (`assertFactValid`, `materiality-rules.ts:835` et `:864`).
- **Aucun libellé d'action ne commence par « Vérifiez »** : le verbe nomme le geste réel.
- **`detail` décrit une pratique, jamais un droit ni un délai** (invariants 3 et 5).
- **Aucune antithèse** de la forme « c'est X, pas Y » dans la prose rendue, et **aucun tiret cadratin** nulle part.
- Commentaires en français, gravant le POURQUOI, comme le reste de `src/lib/decision/`.

---

### Task 1 : le contrat et les trois silences

Ce que la règle refuse de dire vient avant ce qu'elle dit. Les trois cas muets se distinguent par leur `outcome`, et c'est la seule chose qui les rend observables.

**Files:**
- Create: `src/lib/decision/permis-rules.ts`
- Create: `src/lib/decision/permis-rules.test.ts`
- Modify: `src/lib/decision/decision-fact.ts` (champ `permis` sur `ModuleFacts`, commentaire de `observedAt`)

**Interfaces:**
- Consumes: `PermisSnapshot` (`src/lib/logement-autour-types.ts:90`), `PermisRetenu = { annee: number; etat: "acheve" | "chantier_ouvert" | "autorise_non_commence" }` (`src/lib/sitadel-selection.ts:65`), `DecisionRule` et `RuleEvaluation` (`decision-fact.ts:376` et `:395`).
- Produces: `PERMIS_RULES: DecisionRule[]`, consommé par la Task 4.

- [ ] **Step 1 : ajouter le champ au contrat**

Dans `src/lib/decision/decision-fact.ts`, à la suite de `secteur?: SecteurFacts;` (ligne 335) :

```ts
  /**
   * LE REGISTRE DES AUTORISATIONS D'URBANISME, tel qu'il a été gelé à l'analyse.
   *
   * OPTIONNEL POUR LA MÊME RAISON QUE `secteur` : absent veut dire que le registre n'a pas été
   * consulté (dossier antérieur au 01/08/2026, ou API muette au moment de l'analyse), jamais qu'il
   * n'y a rien autour. La règle rend alors `uncertain`, et surtout pas `not_applicable`, qui
   * dirait que la question ne se pose pas pour cette adresse.
   */
  permis?: PermisSnapshot;
```

Ajouter l'import du type en tête de fichier, à côté des autres imports de types partagés :

```ts
import type { PermisSnapshot } from "../logement-autour-types.ts";
```

- [ ] **Step 2 : élargir le contrat de `observedAt`**

Toujours dans `decision-fact.ts`, remplacer la ligne :

```ts
  observedAt?: string; // pour live_fetch
```

par :

```ts
  /**
   * LA DATE À LAQUELLE LA SOURCE A ÉTÉ OBSERVÉE, qu'elle ait été lue en direct ou conservée dans un
   * snapshot persistant.
   *
   * Le commentaire disait « pour live_fetch » : c'était vrai tant que seul le Logement s'en
   * servait. Les permis sont gelés avec leur date de consultation, et c'est précisément ce qui
   * permet à leur fait de porter sa borne temporelle PARTOUT où il est projeté, au lieu de
   * dépendre d'un bloc voisin resté à l'écran.
   */
  observedAt?: string;
```

- [ ] **Step 3 : écrire les trois tests de silence**

Créer `src/lib/decision/permis-rules.test.ts` :

```ts
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
  } as ModuleFacts;
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

const evalWith = (p?: PermisSnapshot) => rule.evaluate(facts({ permis: p }), PROJECT, CTX as never);

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

test("CONSULTÉ, AUCUN DOSSIER : not_applicable, aucun fait", () => {
  const r = evalWith(permis([]));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
});

test("QUE DES ACHEVÉS : not_applicable, aucun fait", () => {
  // Un achevé ne signale plus une transformation à venir au moment de l'analyse. Il reste dans le
  // bloc du module, il n'entre pas au moteur.
  const r = evalWith(permis([{ annee: 2024, etat: "acheve" }, { annee: 2023, etat: "acheve" }]));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
});

test("AUCUNE PRÉFÉRENCE N'ACTIVE CETTE RÈGLE", () => {
  // `projectKeys: []` sur tous les chemins : un critère listé ici serait compté EXAMINÉ dans la
  // couverture alors que la règle ne le regarde pas.
  for (const p of [undefined, permis([]), permis([{ annee: 2025, etat: "chantier_ouvert" }])]) {
    assert.deepEqual(evalWith(p).projectKeys, []);
  }
});
```

- [ ] **Step 4 : lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: FAIL, le module `./permis-rules.ts` n'existe pas.

- [ ] **Step 5 : écrire la règle, silences seulement**

Créer `src/lib/decision/permis-rules.ts` :

```ts
// LES RÈGLES DES AUTORISATIONS D'URBANISME. PURES.
//
// POURQUOI ELLES EXISTENT. Le registre SDES est appelé, gelé dans le snapshot, rendu à l'écran et
// doté d'une doctrine complète depuis le 01/08/2026 — et il n'existait pas pour le moteur. Ni
// `DecisionFact`, ni règle, ni grain déclaré, donc absent du verdict, de la minute et de la liste
// des contrôles, dont le groupe « Autour de l'adresse » ne portait qu'un seul item.
//
// ── CE QUE CETTE RÈGLE NE FAIT PAS, ET POURQUOI ───────────────────────────────────────────────
//
//  1. ELLE NE DÉPEND D'AUCUNE PRÉFÉRENCE (`projectKeys: []`). Personne ne déclare « je veux savoir
//     ce qui va se construire à côté » : c'est l'inconnu décisif type, celui que le lecteur ne sait
//     pas demander. L'accrocher à `cadre_calme` a été écarté, cette préférence étant définie comme
//     « environnement peu dense » au grain COMMUNE, quand un permis ne mesure ni le bruit ni la
//     densité.
//
//  2. ELLE NE MONTE JAMAIS AU-DESSUS DE `secondary`. Le registre ne dit ni le volume, ni l'emprise,
//     ni la nature, ni les effets : un chantier peut être une maison individuelle comme un immeuble
//     de trente logements, et rien dans le snapshot ne les distingue. L'ouverture du chantier
//     augmente la CERTITUDE TEMPORELLE du constat, jamais sa MATÉRIALITÉ DÉCISIONNELLE.
//
//  3. ELLE N'ÉMET QU'UN SEUL FAIT, quel que soit le nombre de dossiers. Un fait par permis
//     produirait plusieurs cartes portant le même geste.
//
// Pure, testée sous `node --test`.

import type {
  DecisionRule, RuleEvaluation, VerificationFact, EvidenceRef,
} from "./decision-fact.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";

const RULE_PERMIS = "autour.permis";

const permisRule: DecisionRule = {
  id: RULE_PERMIS,
  // Le module dit d'où VIENT la donnée ; l'échelle se dérive de la preuve (cf. `echelles.ts`).
  module: "logement",
  evaluate: (f): RuleEvaluation => {
    const ret = (
      outcome: RuleEvaluation["outcome"], facts: VerificationFact[], reason: string,
    ): RuleEvaluation => ({ ruleId: RULE_PERMIS, projectKeys: [], outcome, facts, reason });

    const p: PermisSnapshot | undefined = f.permis;

    // LE REGISTRE N'A PAS ÉTÉ CONSULTÉ, ce qui n'est pas la même chose que « il n'y a rien ».
    // `not_applicable` dirait que la question ne se pose pas pour cette adresse ; `uncertain` dit
    // que la règle s'applique et que la donnée manque, sans même un fait à montrer.
    if (!p) return ret("uncertain", [], "registre des autorisations non consulté");

    const retenus = p.permis.filter((x) => x.etat !== "acheve");
    if (retenus.length === 0) return ret("not_applicable", [], "aucune autorisation non achevée");

    return ret("verification", [], "au moins une autorisation non achevée");
  },
};

export const PERMIS_RULES: DecisionRule[] = [permisRule];
```

Le chemin `verification` rend une liste de faits VIDE : la Task 2 le remplit. Il existe déjà pour que les silences soient prouvés avant qu'une phrase soit écrite.

- [ ] **Step 6 : lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: PASS sur les 4 tests.

- [ ] **Step 7 : vérifier les types**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: aucune sortie.

- [ ] **Step 8 : commit**

```bash
git add src/lib/decision/permis-rules.ts src/lib/decision/permis-rules.test.ts src/lib/decision/decision-fact.ts
git commit -m "Un registre non consulté n'est pas une question sans objet"
```

---

### Task 2 : le fait, ses cinq états et son geste

**Files:**
- Modify: `src/lib/decision/permis-rules.ts`
- Test: `src/lib/decision/permis-rules.test.ts`

**Interfaces:**
- Consumes: `PERMIS_RULES` de la Task 1, `VerificationFact` et `EvidenceRef` (`decision-fact.ts:113` et `:32`).
- Produces: un `VerificationFact` d'`id` `${f.insee}:autour-permis`, consommé par l'assembleur via le `REGISTRY` (Task 4).

- [ ] **Step 1 : écrire les tests des cinq compositions**

À ajouter à la fin de `permis-rules.test.ts` :

```ts
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
  assert.equal(fact.status, "Chantier ouvert");
  assert.equal(
    fact.statement,
    "Une autorisation créant des logements est recensée à moins de 50 m, et son chantier est " +
      "déclaré ouvert.",
  );
  assert.equal(fact.action.label, "Demandez en mairie à consulter le dossier de l'autorisation");
});

test("un seul, non commencé", () => {
  const fact = factOf(permis([{ annee: 2024, etat: "autorise_non_commence" }]));
  assert.equal(fact.status, "Autorisation non commencée");
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
  assert.equal(fact.status, "Chantiers ouverts");
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
  assert.equal(fact.status, "Autorisations non commencées");
  assert.equal(
    fact.statement,
    "Trois autorisations créant des logements sont recensées à moins de 50 m, sans ouverture de " +
      "chantier déclarée.",
  );
});

test("ÉTATS MIXTES : le status ne peut pas dire « Chantier ouvert »", () => {
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

test("la LIMITATION dit ce que le registre ne recense pas", () => {
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  assert.match(fact.limitation ?? "", /que les autorisations créant des logements/);
});
```

- [ ] **Step 2 : lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: FAIL sur les dix nouveaux, `r.facts[0]` valant `undefined`.

- [ ] **Step 3 : écrire le fait**

Dans `permis-rules.ts`, ajouter au-dessus de `permisRule` :

```ts
/**
 * Les nombres du constat, EN TOUTES LETTRES, avec une majuscule initiale.
 *
 * Table locale plutôt que partagée avec `autour-permis.ts` : là-bas la table sert un lead au
 * FÉMININ (« Une autorisation… »), ici le même nombre ouvre aussi des groupes au masculin
 * (« deux chantiers »). Deux besoins d'accord et de casse différents, deux tables, et aucune ne
 * dépend de l'autre.
 *
 * Au-delà de neuf, le chiffre : « quatorze autorisations » se lit moins bien que « 14 ».
 */
const NOMBRE = ["", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf"];
const NOMBRE_MIN = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

const enTete = (n: number): string => (n < NOMBRE.length ? NOMBRE[n] : String(n));
const dedans = (n: number): string => (n < NOMBRE_MIN.length ? NOMBRE_MIN[n] : String(n));

/**
 * L'ÉTAT ÉTABLI, EN DEUX À QUATRE MOTS, et il doit résumer TOUT ce que le fait agrège.
 *
 * Cinq formes, pas deux : un fait portant trois dossiers mixtes qui afficherait « Chantier ouvert »
 * serait vrai d'une partie des données et faux comme résumé de la carte.
 */
function statusPermis(total: number, ouverts: number): string {
  if (total === 1) return ouverts === 1 ? "Chantier ouvert" : "Autorisation non commencée";
  if (ouverts === total) return "Chantiers ouverts";
  if (ouverts === 0) return "Autorisations non commencées";
  return "Autorisations non achevées";
}

/**
 * LE CONSTAT. Contrairement à la charnière de la conclusion Autour, il PORTE les chiffres : c'est
 * une carte autonome, lue dans une liste, pas une phrase posée sous une autre qui les dit déjà.
 *
 * Le rayon vient du SNAPSHOT : un dossier créé sous un ancien périmètre doit continuer de décrire
 * celui qui l'a réellement sélectionné.
 */
function statementPermis(total: number, ouverts: number, rayonMeters: number): string {
  const perimetre = `à moins de ${rayonMeters} m`;
  if (total === 1) {
    return ouverts === 1
      ? `Une autorisation créant des logements est recensée ${perimetre}, et son chantier est déclaré ouvert.`
      : `Une autorisation créant des logements est recensée ${perimetre}, sans ouverture de chantier déclarée.`;
  }
  const tete = `${enTete(total)} autorisations créant des logements sont recensées ${perimetre}`;
  if (ouverts === total) return `${tete}, et leurs chantiers sont déclarés ouverts.`;
  if (ouverts === 0) return `${tete}, sans ouverture de chantier déclarée.`;
  return `${tete}, dont ${dedans(ouverts)} chantier${ouverts > 1 ? "s" : ""} ` +
    `déclaré${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}.`;
}
```

Puis remplacer la ligne `return ret("verification", [], "au moins une autorisation non achevée");` par :

```ts
    const total = retenus.length;
    const ouverts = retenus.filter((x) => x.etat === "chantier_ouvert").length;

    const fact: VerificationFact = {
      id: `${f.insee}:autour-permis`,
      ruleId: RULE_PERMIS,
      sourceFactIds: ["autour.permis"],
      module: "logement",
      role: "verification",
      // JAMAIS `structuring`, même sur un chantier ouvert : cf. en-tête, point 2.
      materialityTier: "secondary",
      topic: "les autorisations d'urbanisme récentes",
      statement: statementPermis(total, ouverts, p.rayonMeters),
      status: statusPermis(total, ouverts),
      limitation:
        "Le registre ne recense que les autorisations créant des logements : un commerce, un " +
        "entrepôt ou une extension sans logement nouveau n'y figurent pas.",
      evidence: [],
      action: {
        type: "obtenir_document",
        // LE GESTE COMBLE LE MANQUE DE LA DONNÉE. Le dossier déposé porte la nature de l'opération,
        // la hauteur et la surface de plancher, c'est-à-dire exactement les trois informations que
        // le registre ne publie pas et qui décideraient de la matérialité.
        //
        // « Demandez à consulter » décrit une PRATIQUE ; « demandez l'accès » énoncerait un DROIT,
        // ce que `detail` s'interdit. « Repérez notamment » plutôt que « pour connaître » : rien ne
        // garantit que chaque pièce soit complète ni immédiatement lisible.
        label: total === 1
          ? "Demandez en mairie à consulter le dossier de l'autorisation"
          : "Demandez en mairie à consulter les dossiers des autorisations",
        detail:
          "Repérez notamment la nature de l'opération, la hauteur et la surface de plancher " +
          "indiquées dans le dossier.",
      },
    };
    return ret("verification", [fact], "au moins une autorisation non achevée");
```

Le champ `evidence` reste vide : la Task 3 le remplit, avec le grain et la date qui décident du classement.

- [ ] **Step 4 : lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: PASS sur les 14 tests.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/permis-rules.ts src/lib/decision/permis-rules.test.ts
git commit -m "Cinq états courts, parce que le fait agrège ce que la carte résume"
```

---

### Task 3 : la preuve, et les trois verrous de doctrine

C'est la preuve qui décide de l'échelle et qui porte la date. Sans elle, le fait serait rangé dans « Logement » au lieu de « Autour de l'adresse », et il flotterait dans le temps.

**Files:**
- Modify: `src/lib/decision/permis-rules.ts`
- Test: `src/lib/decision/permis-rules.test.ts`

**Interfaces:**
- Consumes: le `VerificationFact` de la Task 2.
- Produces: un `EvidenceRef` de `grain: "adresse"` et `relation: "proximite"`, lu par `echelleDeLaPreuve` (`echelles.ts:63`).

- [ ] **Step 1 : écrire les tests de la preuve et les verrous**

À ajouter à la fin de `permis-rules.test.ts` :

```ts
// ── La preuve, et les verrous de doctrine ───────────────────────────────────────────────────

test("LA PREUVE PORTE SA DATE, et c'est ce qui répare l'invariant de mise en page", () => {
  // La charnière de la conclusion Autour ne porte aucune date : elle dépend du « consulté le … »
  // rendu dans le bloc au-dessus. Ici la date est une propriété de la preuve, donc elle suit le
  // fait partout où il est projeté.
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  const ev = fact.evidence[0]!;
  assert.equal(ev.sourceMode, "persisted_snapshot");
  assert.equal(ev.observedAt, "2026-08-01T00:00:00.000Z");
});

test("GRAIN ADRESSE + RELATION PROXIMITÉ : l'échelle est le QUARTIER", () => {
  // Le test doctrinal d'`echelles.ts` : le constat parle de ce que le lecteur VIVRA AUTOUR, pas de
  // ce qui ATTEINT SON BIEN. Une cavité à 300 m resterait un attribut du logement ; un chantier
  // voisin, non.
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }]));
  const ev = fact.evidence[0]!;
  assert.equal(ev.grain, "adresse");
  assert.equal(ev.relation, "proximite");
  assert.equal(echelleDeLaPreuve(ev), "quartier");
});

test("JAMAIS structuring, sur aucune composition", () => {
  const compositions: { annee: number; etat: "chantier_ouvert" | "autorise_non_commence" }[][] = [
    [{ annee: 2025, etat: "chantier_ouvert" }],
    [{ annee: 2024, etat: "autorise_non_commence" }],
    [{ annee: 2025, etat: "chantier_ouvert" }, { annee: 2024, etat: "chantier_ouvert" }],
    [{ annee: 2025, etat: "autorise_non_commence" }, { annee: 2024, etat: "autorise_non_commence" }],
    [{ annee: 2025, etat: "chantier_ouvert" }, { annee: 2024, etat: "autorise_non_commence" }],
  ];
  for (const c of compositions) {
    assert.equal(factOf(permis(c)).materialityTier, "secondary");
  }
});

test("LE PÉRIMÈTRE ET LA FENÊTRE VIENNENT DU SNAPSHOT, jamais des constantes du jour", () => {
  const fact = factOf(permis([{ annee: 2025, etat: "chantier_ouvert" }], 80, 5));
  assert.match(fact.statement, /à moins de 80 m/);
  assert.equal(/50 m/.test(fact.statement), false);
  assert.match(fact.signalConvention ?? "", /cinq années/);
  assert.equal(fact.evidence[0]!.label.includes("80 m"), true);
});

test("les bornes d'assertFactValid sont respectées", () => {
  // 70 caractères et aucun point final, sur le topic comme sur le libellé d'action.
  for (const c of [
    [{ annee: 2025, etat: "chantier_ouvert" as const }],
    [{ annee: 2025, etat: "chantier_ouvert" as const }, { annee: 2024, etat: "chantier_ouvert" as const }],
  ]) {
    const fact = factOf(permis(c));
    assert.ok(fact.topic.length <= 70, fact.topic);
    assert.ok(fact.action.label.length <= 70, fact.action.label);
    assert.equal(/[.!?]$/.test(fact.action.label), false, fact.action.label);
    assert.equal(/[.!?]/.test(fact.topic), false, fact.topic);
  }
});
```

Ajouter l'import en tête du fichier de test :

```ts
import { echelleDeLaPreuve } from "./echelles.ts";
```

- [ ] **Step 2 : lancer les tests, vérifier qu'ils échouent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: FAIL sur les cinq nouveaux, `fact.evidence[0]` valant `undefined` et `signalConvention` absent.

- [ ] **Step 3 : écrire la preuve et la convention**

Dans `permis-rules.ts`, ajouter la fonction sous `statementPermis` :

```ts
/**
 * POURQUOI futur•e SIGNALE ce fait. Distincte du constat, et la séparation est stricte.
 *
 * Le `statement` porte ce qui a été TROUVÉ (nombre, états, rayon) ; la convention porte ce qui a
 * été CHOISI (la fenêtre, et le fait de ne retenir que les non achevées). Mettre le rayon et la
 * fenêtre dans les deux recréerait, à l'intérieur d'une seule carte, la redondance que la
 * vérification à l'écran du 01/08/2026 a révélée entre le bloc des permis et la conclusion.
 *
 * La fenêtre vient du SNAPSHOT, comme le rayon.
 */
const ANS = ["", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

function conventionPermis(ancienneteMaxAns: number): string {
  const n = ancienneteMaxAns < ANS.length ? ANS[ancienneteMaxAns] : String(ancienneteMaxAns);
  return `futur•e signale les autorisations non achevées déposées dans les ${n} années précédant ` +
    `l'analyse.`;
}
```

Puis, dans le fait, remplacer `evidence: []` par la preuve et ajouter la convention juste après `limitation` :

```ts
      signalConvention: conventionPermis(p.ancienneteMaxAns),
      evidence: [{
        factId: "autour.permis",
        module: "logement",
        label: `Autorisations d'urbanisme · parcelles à moins de ${p.rayonMeters} m`,
        observedValue: `${total} dossier${total > 1 ? "s" : ""} non achevé${total > 1 ? "s" : ""}` +
          (ouverts > 0 ? `, dont ${ouverts} chantier${ouverts > 1 ? "s" : ""} déclaré${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}` : ""),
        // ANCRE `adresse`, RELATION `proximite` : la mesure part de l'adresse et décrit son
        // ENVIRONNEMENT, donc l'échelle dérivée est le QUARTIER (cf. `echelles.ts`). Le test du
        // fichier tranche dans ce sens : ce que le lecteur vivra autour, pas ce qui atteint son bien.
        grain: "adresse",
        relation: "proximite",
        href: "/rapport/autour#permis",
        // LA DATE DE CONSULTATION EST UNE PROPRIÉTÉ DE LA PREUVE, pas un invariant de mise en page.
        // Le fait la porte partout où il est projeté : carte, liste, conclusion, export futur.
        sourceMode: "persisted_snapshot",
        observedAt: p.consulteLe,
      } satisfies EvidenceRef],
```

- [ ] **Step 4 : lancer les tests, vérifier qu'ils passent**

Run: `node --test src/lib/decision/permis-rules.test.ts`
Expected: PASS sur les 19 tests.

- [ ] **Step 5 : commit**

```bash
git add src/lib/decision/permis-rules.ts src/lib/decision/permis-rules.test.ts
git commit -m "La preuve porte le grain qui la classe et la date qui la borne"
```

---

### Task 4 : le branchement, et l'ancre qui rend le lien utile

Tant que cette tâche n'est pas faite, la règle existe et personne ne l'appelle.

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts:20-21` (import) et `:803-804` (`REGISTRY`)
- Modify: `src/components/report/DossierAvecLogement.tsx:45`
- Modify: `src/app/(account)/rapport/page.tsx:369`
- Modify: `src/components/report/kit.tsx:28`
- Modify: `src/components/report/AutourModule.tsx` (le bloc « Ce qui est autorisé autour »)

**Interfaces:**
- Consumes: `PERMIS_RULES` (Task 1), `ModuleFacts.permis` (Task 1).
- Produces: rien.

- [ ] **Step 1 : brancher la règle au REGISTRY**

Dans `src/lib/decision/materiality-rules.ts`, à côté de `import { SECTEUR_RULES } ...` (ligne 21) :

```ts
import { PERMIS_RULES } from "./permis-rules.ts";
```

Et dans le tableau `REGISTRY`, juste après `...SECTEUR_RULES,` (ligne 804) :

```ts
  ...PERMIS_RULES,
```

- [ ] **Step 2 : passer le snapshot depuis la page**

Dans `src/app/(account)/rapport/page.tsx`, au rendu de `DossierAvecLogement` (ligne 369), ajouter la prop à la suite de `savedDpe` :

```tsx
                permis={logementForCommune.snapshot?.permis ?? null}
```

- [ ] **Step 3 : faire entrer le snapshot dans les faits**

Dans `src/components/report/DossierAvecLogement.tsx`, ajouter la prop à la signature du composant, à côté de `savedDpe` :

```ts
  permis,
```

et dans le type des props :

```ts
  /**
   * LE REGISTRE DES AUTORISATIONS, gelé à l'analyse. `null` veut dire NON CONSULTÉ (dossier
   * antérieur au 01/08/2026, ou API muette), et la règle rend alors `uncertain` : jamais une
   * absence d'autorisation qui n'a pas été établie.
   */
  permis: PermisSnapshot | null;
```

avec l'import :

```ts
import type { PermisSnapshot } from "@/lib/logement-autour-types";
```

Puis, à l'assemblage des `ModuleFacts` (ligne 45), ajouter le champ à la suite de `secteur` :

```ts
    const facts: ModuleFacts = {
      ...communeFacts, hasAddress: true, logement, secteur: buildSecteurFacts(car),
      // LE REGISTRE ENTRE DANS LE MOTEUR. Aucune I/O : la donnée est déjà gelée dans le snapshot du
      // dossier. `undefined` quand elle est absente, pour que la règle distingue « non consulté »
      // de « rien trouvé ».
      ...(permis ? { permis } : {}),
    };
```

- [ ] **Step 4 : ouvrir une ancre sur le bloc des permis**

Dans `src/components/report/kit.tsx`, la signature de `ReportSection` (ligne 28) devient :

```tsx
export function ReportSection(
  { eyebrow, tone = "neutral", id, children }:
  { eyebrow: string; tone?: ReportTone; id?: string; children: ReactNode },
) {
  return (
    <section id={id}>
```

Dans `src/components/report/AutourModule.tsx`, sur le bloc des permis :

```tsx
                <ReportSection eyebrow="Ce qui est autorisé autour" tone="neutral" id="permis">
```

Sans cette ancre, le `href` de la preuve ne mènerait qu'en haut du module, ce qui est exactement le défaut que les cibles de preuve existent pour corriger.

- [ ] **Step 5 : vérifier les types et le lint**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: aucune sortie.

Run: `npx eslint src/lib/decision/permis-rules.ts src/components/report/DossierAvecLogement.tsx src/components/report/kit.tsx src/components/report/AutourModule.tsx "src/app/(account)/rapport/page.tsx"`
Expected: aucune erreur.

- [ ] **Step 6 : lancer la suite complète**

Run: `node --test src/lib/**/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: `fail 0`, et **dix-neuf tests de plus** que le commit de base du lot. Mesurer plutôt que supposer, deux sessions travaillant sur le dépôt :

```bash
git stash && node --test src/lib/**/*.test.ts 2>&1 | grep "^ℹ pass" && git stash pop
```

- [ ] **Step 7 : build**

Run: `npm run build`
Expected: code de sortie 0. Des avertissements « took more than 60 seconds » sur les pages `/inondation/[insee_code]` sont **préexistants** et sans rapport avec ce lot.

- [ ] **Step 8 : commit**

```bash
git add src/lib/decision/materiality-rules.ts src/components/report/DossierAvecLogement.tsx src/components/report/kit.tsx src/components/report/AutourModule.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "Le groupe « Autour de l'adresse » ne portait qu'un seul item"
```

---

## Vérification finale, avant de déclarer le lot fini

- [ ] `node --test src/lib/**/*.test.ts` : `fail 0`, dix-neuf tests de plus que le commit de base (mesuré).
- [ ] `npx tsc -p tsconfig.json --noEmit` : muet.
- [ ] `npx eslint` sur les cinq fichiers touchés : propre.
- [ ] `npm run build` : code 0.
- [ ] `grep -n "—" src/lib/decision/permis-rules.ts` : aucune occurrence.
- [ ] Marquer le point 1 comme CORRIGÉ dans `docs/superpowers/specs/2026-08-01-permis-autour-adresse-design.md` et dans le fil ouvert n° 6 de `docs/handoff/CURRENT.md`, en nommant les commits.

### La vérification à l'écran, qu'aucun test pur ne remplace

Le serveur du worktree tourne sur un autre port que celui du répertoire principal :

```bash
PORT=3001 npm run dev
```

Sur `/rapport`, avec un dossier d'adresse ouvert, **trois adresses** :

- [ ] **Une adresse avec un permis non achevé** (Paris 7e et les deux La Rochelle en portaient un au 03/08/2026). Attendu : une carte dans la liste des contrôles, **sous le groupe « Autour de l'adresse »**, à côté de l'équipement automobile, avec son état en tête, son geste, et la date de consultation dans la preuve dépliée. Le lien de la preuve doit descendre au bloc des permis du module Autour, pas en haut de la page.
- [ ] **Une adresse sans permis non achevé.** Attendu : aucune carte, et le groupe « Autour de l'adresse » inchangé.
- [ ] **Le compte du verdict.** Attendu : le nombre annoncé par la conclusion inclut la nouvelle carte. C'est l'invariant du lot précédent (« le lecteur compte les cartes et retombe sur le chiffre »), et ce lot ajoute un contrôle : s'il ne comptait pas, la promesse casserait.

## Ce que ce plan ne fait pas

L'ÎCU et l'espace vert restent hors moteur. Le patron établi ici les attend, et l'espace vert attend en plus l'audit de la sémantique de distance et d'accessibilité, déjà décidé par le porteur.

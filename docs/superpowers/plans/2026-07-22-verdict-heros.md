# Verdict promu en héros (« En une minute ») — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au bloc « En une minute » un point focal unique : un headline déterministe qui NOMME ce qui définit la décision, un détail qui l'articule, et une strate de poids qui ne répète jamais ce que le headline a déjà nommé.

**Architecture:** Tout se joue dans `conclusion-plan.ts` (fonctions pures, aucun LLM). Un constructeur unique produit le couple `{ headline, detail }` par branche de cascade ; les sujets nommés sont marqués consommés par identifiant canonique ; `selectResidualLead` reconstruit la strate de poids sur le résidu, avec une prose qui dépend du pool consommé. Le rendu (`ConclusionBlock.tsx`) affiche le headline en `<h2>` Serif au-dessus du détail. Le registre `mismatches_found`, construit mais jamais rendu, est retiré.

**Tech Stack:** TypeScript, Next.js App Router (React Server Components), Tailwind v4, `node --test` (type stripping natif Node 24), aucune dépendance nouvelle.

**Spec de référence:** `docs/superpowers/specs/2026-07-22-verdict-heros-design.md`. Largeurs : `docs/superpowers/specs/2026-07-22-lot-a-arbitrages.md`.

## Global Constraints

- **Le verdict n'est JAMAIS généré par un LLM.** Headline et détail sont déterministes, mot pour mot. `generable: false` sur le bloc `verdict` reste vrai.
- **Le détail n'est pas une troncature du headline.** Chaque branche de la cascade produit explicitement son couple `{ headline, detail }`.
- **Deux gates cumulatives sur le headline** : au plus **2 enjeux nommés**, et au plus **95 caractères** (nom de commune compris). Au-delà de l'une ou l'autre, `kind: "posture"`.
- **Tout mismatch porte son `headlineSubject`**, la PRIORITÉ du lecteur, jamais l'indicateur défavorable. « la proximité de la mer », jamais « la distance à la mer ». Garde runtime dans `assertFactValid`.
- **La sélection se fait sur les cartes AFFICHÉES** (`input.shownFacts` / `input.shownCompositions`, post-compositions et post-caps). Une composition `shared_evidence` est une carte de mismatch (`displaySection: "mismatches"`) : elle est candidate au headline d'arbitrage.
- **Consommation NARRATIVE seulement.** Un sujet consommé disparaît d'une strate résumé, jamais d'un compteur ni d'un état métier : `reservesShown`, `reservesCount`, `mismatchTotal`, `coverage`, `orientation`, `conclusionBasis` et les cartes restent intacts.
- **Les identifiants consommés vont dans le bon champ** : `consumedFactIds` porte des identifiants de faits (y compris les `absorbedFactIds` d'une composition), `consumedCompositionIds` porte des identifiants de compositions.
- **Vocabulaire** : une contrainte non examinée est **à vérifier** ; un constat établi dont les conséquences restent à instruire est **à contrôler**. Jamais « à examiner » pour les réserves.
- **Aucun fait favorable déterministe n'existe** dans l'architecture : les cas favorables tombent en posture.
- **Largeurs** : bloc « En une minute » à `max-w-[860px]`, **aligné à gauche**, posé par un **wrapper unique** ; headline à `max-w-[540px]`.
- **Voix** : aucun tiret cadratin (`—`). Aucune figure « c'est X, pas Y ». Le sujet de la phrase est le lieu ou le lecteur.
- **`node --test`** : ne jamais importer `comparateur-vie.ts` en valeur depuis un fichier testé (server-only). Les imports de type sont sans risque.
- Après chaque tâche : `npx tsc --noEmit` (0 erreur) et `node --test src/lib/decision/*.test.ts` (baseline **294 pass, 0 fail**).

---

### Task 1: `aCommune` dans la typographie française

Le headline tisse le nom de la commune dans une phrase. « à » ne s'élide jamais devant une voyelle (« à Antibes »), mais il se contracte avec l'article défini d'un nom composé (« Le Havre » donne « au Havre »). Miroir exact de `deCommune`, déjà présent.

**Files:**
- Modify: `src/lib/typography.ts` (après `deCommune`, ligne 24)
- Test: `src/lib/typography.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `export function aCommune(nom: string): string`. Consommé par `conclusion-plan.ts` en Task 5.

- [ ] **Step 1: Écrire le test qui échoue**

Compléter l'import de tête en `import { deCommune, aCommune } from "./typography.ts";`, puis ajouter :

```ts
test("aCommune : contraction avec l'article défini masculin", () => {
  assert.equal(aCommune("Le Havre"), "au Havre");
  assert.equal(aCommune("Le Mans"), "au Mans");
  assert.equal(aCommune("Le Touquet-Paris-Plage"), "au Touquet-Paris-Plage");
});

test("aCommune : contraction avec l'article défini pluriel", () => {
  assert.equal(aCommune("Les Sables-d'Olonne"), "aux Sables-d'Olonne");
  assert.equal(aCommune("Les Herbiers"), "aux Herbiers");
});

test("aCommune : l'article féminin et l'article élidé ne se contractent pas", () => {
  assert.equal(aCommune("La Rochelle"), "à La Rochelle");
  assert.equal(aCommune("La Baule-Escoublac"), "à La Baule-Escoublac");
  assert.equal(aCommune("L'Haÿ-les-Roses"), "à L'Haÿ-les-Roses");
  assert.equal(aCommune("L'Île-Rousse"), "à L'Île-Rousse");
});

test("aCommune : « à » ne s'élide pas devant une voyelle", () => {
  assert.equal(aCommune("Antibes"), "à Antibes");
  assert.equal(aCommune("Orléans"), "à Orléans");
  assert.equal(aCommune("Toulouse"), "à Toulouse");
});

test("aCommune : un nom qui commence par les mêmes lettres reste intact", () => {
  assert.equal(aCommune("Lespinasse"), "à Lespinasse");
  assert.equal(aCommune("Lehaucourt"), "à Lehaucourt");
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `node --test src/lib/typography.test.ts`
Expected: FAIL, « aCommune is not a function ».

- [ ] **Step 3: Écrire l'implémentation**

```ts
// « à » ne s'élide JAMAIS devant une voyelle (« à Antibes », « à Orléans ») : à la différence de
// `deCommune`, le seul cas à traiter est la CONTRACTION avec l'article défini d'un nom composé.
// « Le Havre » -> « au Havre », « Les Sables-d'Olonne » -> « aux Sables-d'Olonne ». Le féminin et
// l'élidé se laissent tels quels. La frontière de mot est obligatoire : « Lespinasse » n'est pas
// « Les » suivi de « pinasse ».
export function aCommune(nom: string): string {
  if (/^Les\s/.test(nom)) return `aux ${nom.slice(4)}`;
  if (/^Le\s/.test(nom)) return `au ${nom.slice(3)}`;
  return `à ${nom}`;
}
```

- [ ] **Step 4: Lancer le test et vérifier qu'il passe**

Run: `node --test src/lib/typography.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/typography.ts src/lib/typography.test.ts
git commit -m "feat(typo): aCommune, miroir de deCommune pour le headline du verdict"
```

---

### Task 2: Le `subject` des critères à position relative

Le gabarit à deux-points met les sujets après le deux-points, ce qui supprime tout accord. Il lui faut un groupe nominal qui nomme **la priorité du lecteur**. Le `topic` d'un mismatch nomme parfois l'indicateur défavorable (« la dépendance à la voiture »), ce qui inverse le sens dans « une priorité correspond moins bien : … ».

Cette tâche traite les 13 critères du registre `relative_position`. Les trois autres familles de mismatch suivent en Task 3.

**Files:**
- Modify: `src/lib/decision/mismatch-facts.ts:56` et `:60-84`
- Test: `src/lib/decision/mismatch-facts.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `MismatchLabel` gagne un champ **obligatoire** `subject: string`. Lu en Task 3 par la fabrique de `mismatch-rules.ts`.

Note : la table reste `Record<string, MismatchLabel>`. La typer par l'union des clés créerait le cycle `mismatch-facts` ↔ `mismatch-rules` (`MISMATCH_KEYS` vit dans les règles, qui importent les faits, `mismatch-rules.ts:13`). L'exhaustivité est déjà garantie par un test de garde (`mismatch-rules.test.ts:56`).

- [ ] **Step 1: Écrire le test qui échoue**

```ts
test("chaque libellé de mismatch porte un subject qui se lit APRÈS un deux-points", () => {
  for (const [key, lab] of Object.entries(MISMATCH_LABELS)) {
    assert.ok(lab.subject && lab.subject.trim().length > 0, `subject manquant pour ${key}`);
    assert.ok(lab.subject.length <= 45, `subject trop long pour ${key} : « ${lab.subject} »`);
    assert.equal(/[.!?]/.test(lab.subject), false, `subject phrasé pour ${key}`);
    assert.equal(lab.subject[0], lab.subject[0]!.toLowerCase(), `subject capitalisé pour ${key}`);
  }
});

test("le subject nomme la PRIORITÉ du lecteur, jamais l'indicateur défavorable", () => {
  // Le lecteur a déclaré vouloir moins dépendre de la voiture. Nommer « la dépendance à la voiture »
  // comme sa priorité inverserait ce qu'il a demandé.
  assert.equal(MISMATCH_LABELS.faible_dependance_auto!.subject, "la faible dépendance à la voiture");
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `node --test src/lib/decision/mismatch-facts.test.ts`
Expected: FAIL, « subject manquant pour nature ».

- [ ] **Step 3: Écrire l'implémentation**

Remplacer le type ligne 56 :

```ts
export type MismatchLabel = { topic: string; projectPhrase: string; indicator: string; subject: string; limitation?: string };
```

Compléter le commentaire de la table :

```ts
// subject = le groupe nominal qui se lit APRÈS un deux-points dans le headline du verdict
// (« … correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels. »). Il nomme
// LA PRIORITÉ DU LECTEUR, jamais l'indicateur défavorable : « la faible dépendance à la voiture »,
// pas « la dépendance à la voiture », que le lecteur n'a jamais demandée. Borné à 45 car.
```

Puis les 13 entrées :

```ts
export const MISMATCH_LABELS: Record<string, MismatchLabel> = {
  nature: { topic: "les espaces naturels", projectPhrase: "la proximité des espaces naturels", indicator: "l'accès aux espaces naturels", subject: "l'accès aux espaces naturels" },
  acces_ecoles: { topic: "l'accès aux collèges et lycées", projectPhrase: "l'accès aux collèges et lycées", indicator: "l'accès aux collèges et lycées", subject: "l'accès aux collèges et lycées" },
  acces_soins: { topic: "l'accès aux soins", projectPhrase: "un bon accès aux soins", indicator: "l'accès aux soins", subject: "l'accès aux soins" },
  acces_culture: { topic: "l'accès à la culture", projectPhrase: "l'accès à une offre culturelle", indicator: "l'accès à l'offre culturelle", subject: "l'accès à la culture" },
  acces_transports: { topic: "l'accès au train", projectPhrase: "l'accès au train et aux gares", indicator: "la desserte ferroviaire", subject: "l'accès au train" },
  faible_dependance_auto: { topic: "la dépendance à la voiture", projectPhrase: "une faible dépendance à la voiture", indicator: "la possibilité de se déplacer sans voiture", subject: "la faible dépendance à la voiture" },
  croissance_demographique: { topic: "la trajectoire démographique", projectPhrase: "un territoire qui gagne des habitants", indicator: "la trajectoire démographique", subject: "la trajectoire démographique" },
  vie_locale: { topic: "la vie locale", projectPhrase: "une vie locale animée", indicator: "l'intensité de la vie locale", subject: "la vie locale" },
  cadre_calme: { topic: "le cadre calme", projectPhrase: "un cadre calme", indicator: "le calme du cadre de vie", subject: "le calme" },
  viabilite_emploi: { topic: "le bassin d'emploi", projectPhrase: "un bassin d'emploi dynamique", indicator: "le dynamisme du bassin d'emploi", subject: "le bassin d'emploi" },
  acces_services: { topic: "l'accès aux services du quotidien", projectPhrase: "un bon accès aux services du quotidien", indicator: "l'accès aux services et commerces du quotidien", subject: "les services du quotidien" },
  ensoleillement_recherche: {
    topic: "l'ensoleillement",
    projectPhrase: "un territoire ensoleillé",
    indicator: "l'ensoleillement du territoire",
    subject: "l'ensoleillement",
    limitation: "Cette position décrit la climatologie solaire de référence issue de la réanalyse ERA5-Land, normale 1991-2020. Elle ne constitue pas une projection de l'ensoleillement futur.",
  },
  douceur_climat: {
    topic: "la douceur des hivers",
    projectPhrase: "des hivers doux",
    indicator: "la douceur des hivers",
    subject: "la douceur des hivers",
    limitation: "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.",
  },
};
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/mismatch-facts.test.ts src/lib/decision/mismatch-rules.test.ts` puis `npx tsc --noEmit`
Expected: PASS, 0 erreur.

- [ ] **Step 5: Commit**

```bash
git add src/lib/decision/mismatch-facts.ts src/lib/decision/mismatch-facts.test.ts
git commit -m "feat(dossier): subject de headline pour les criteres a position relative"
```

---

### Task 3: `headlineSubject` porté par tout mismatch, gardé à l'assemblage

Quatre familles produisent des `MismatchFact` : `mismatch-rules.ts:82` (position relative), `absence-rules.ts:90` (absence attestée), `agglomeration-rules.ts:94` (catégorie de taille), `coast-rules.ts:55` (distance à la mer). Une table centrale ne détecterait jamais l'oubli d'une clé au moment où une règle est ajoutée : elle retomberait silencieusement sur `topic`, c'est-à-dire sur l'inversion qu'on corrige. Le champ vit donc sur le FAIT, obligatoire, avec la même garde que `topic`.

La composition `shared_evidence` porte le sien : elle est une carte de mismatch, et son `title` (66 caractères) ne tient pas dans la gate du headline.

**Files:**
- Modify: `src/lib/decision/decision-fact.ts:119-125` (`MismatchFact`)
- Modify: `src/lib/decision/fact-composition.ts:38-50` (`SharedEvidenceComposition`)
- Modify: `src/lib/decision/materiality-rules.ts:438-452` (`assertFactValid`)
- Modify: `src/lib/decision/mismatch-rules.ts:80-90`, `absence-rules.ts:17-95`, `agglomeration-rules.ts:20-96`, `coast-rules.ts:52-60`
- Modify: `src/lib/decision/fact-compositions.ts:123-140`
- Test: `src/lib/decision/mismatch-rules.test.ts`, `src/lib/decision/materiality-rules.test.ts`

**Interfaces:**
- Consumes: `MISMATCH_LABELS[].subject` (Task 2).
- Produces:
  - `MismatchFact` gagne `headlineSubject: string` (obligatoire).
  - `SharedEvidenceComposition` gagne `headlineSubject: string` (obligatoire).
  - `assertFactValid` rejette un mismatch sans `headlineSubject`, au-delà de 45 caractères, ou contenant une ponctuation de phrase.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `src/lib/decision/mismatch-rules.test.ts` :

```ts
test("tout mismatch porte un headlineSubject qui nomme la priorité du lecteur", () => {
  // Les quatre familles : position relative, absence attestée, taille, distance à la mer.
  const attendus: Record<string, string> = {
    "faible_dependance_auto": "la faible dépendance à la voiture",
    "proximite_mer": "la proximité de la mer",
    "eviter_isolement": "la taille du bassin de vie",
    "mobilite_quotidienne": "les transports du quotidien",
  };
  for (const [key, subject] of Object.entries(attendus)) {
    assert.ok(subject.length <= 45, `subject trop long pour ${key}`);
  }
});
```

Dans `src/lib/decision/materiality-rules.test.ts`, la garde :

```ts
test("assertFactValid refuse un mismatch sans headlineSubject", () => {
  const fact = {
    id: "x", ruleId: "territoire.mismatch-test", sourceFactIds: [], module: "territoire",
    role: "mismatch", projectKey: "cadre_calme", materialityTier: "structuring",
    topic: "le cadre calme", statement: "constat", headlineSubject: "",
    basis: { kind: "relative_position", rankLow: 0, rankHigh: 0.1, universe: "communes_france", distributionVersion: "v" },
    evidence: [{ factId: "x", module: "territoire", label: "T", grain: "commune" }],
  } as unknown as DecisionFact;
  assert.throws(() => assertFactValid(fact, PROJECT_FIXTURE), /headlineSubject/);
});
```

(`PROJECT_FIXTURE` : réutiliser le projet de test déjà présent dans ce fichier ; s'il porte un autre nom, garder celui du fichier.)

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `node --test src/lib/decision/materiality-rules.test.ts`
Expected: FAIL, aucune exception levée (la garde n'existe pas).

- [ ] **Step 3: Étendre les deux types**

`decision-fact.ts`, dans `MismatchFact` :

```ts
export type MismatchFact = BaseFact & {
  role: "mismatch";
  projectKey: PreferenceKey;
  basis: MismatchBasis;
  evidence: EvidenceRef[];
  limitation?: string;
  // LE SUJET DU HEADLINE : la PRIORITÉ du lecteur, telle qu'elle se lit après un deux-points
  // (« Une priorité correspond moins bien à Toulouse : la proximité de la mer. »). Distinct de
  // `topic`, qui nomme parfois l'indicateur défavorable (« la distance à la mer ») et inverserait
  // le sens à cette place. Obligatoire : une règle de mismatch qui l'oublierait ferait retomber le
  // héros sur une formulation inversée, sans qu'aucune validation ne s'en aperçoive.
  headlineSubject: string;
};
```

`fact-composition.ts`, dans `SharedEvidenceComposition`, après `summary` :

```ts
  // Le sujet à nommer dans le headline du verdict. Le `title` raconte le patron (« Une même petite
  // taille touche plusieurs dimensions de votre projet »), trop long pour une phrase de héros : la
  // composition nomme ici la CAUSE COMMUNE, courte.
  headlineSubject: string;
```

- [ ] **Step 4: Poser la garde dans `assertFactValid`**

Dans `materiality-rules.ts`, à l'intérieur du `switch (fact.role)`, ajouter un `case "mismatch"` (ou compléter celui qui existe) :

```ts
    case "mismatch":
      if (!fact.headlineSubject || fact.headlineSubject.trim().length === 0) {
        throw new Error(`[decision] ${fact.ruleId}: mismatch sans headlineSubject (la PRIORITÉ du lecteur, à lire après un deux-points)`);
      }
      if (fact.headlineSubject.length > 45 || /[.!?]/.test(fact.headlineSubject)) {
        throw new Error(`[decision] ${fact.ruleId}: headlineSubject trop long ou phrasé (« ${fact.headlineSubject} »)`);
      }
      break;
```

Si un `case "mismatch"` existe déjà, insérer les deux gardes en tête, avant son `break`.

- [ ] **Step 5: Remplir les quatre familles**

`mismatch-rules.ts`, dans la construction du fait (ligne 80) :

```ts
        topic: lab.topic,
        headlineSubject: lab.subject,
```

`absence-rules.ts` : ajouter `subject` au type `AbsenceSpec` (ligne 18, à côté de `topic`), le renseigner dans les deux specs, et le recopier dans le fait (ligne 91) :

```ts
  // SPECS
  { key: "mobilite_quotidienne", topic: "les transports en commun du quotidien", subject: "les transports du quotidien", ... }
  { key: "vie_etudiante", topic: "les établissements du supérieur", subject: "l'environnement étudiant", ... }
  // fait
        topic: spec.topic,
        headlineSubject: spec.subject,
```

`agglomeration-rules.ts` : ajouter `subject` à `SizeSpec` (ligne 23), renseigner les trois specs, recopier dans le fait (ligne 95) :

```ts
  { key: "eviter_grandes_villes", topic: "la taille du territoire", subject: "la taille de la ville", ... }
  { key: "prefere_grande_ville",  topic: "la taille du territoire", subject: "la taille de la ville", ... }
  // « l'isolement du territoire » nommerait l'indicateur défavorable, jamais la priorité déclarée.
  { key: "eviter_isolement",      topic: "l'isolement du territoire", subject: "la taille du bassin de vie", ... }
```

`coast-rules.ts`, dans le fait (ligne 56) :

```ts
        topic: "la distance à la mer",
        // Le lecteur a déclaré vouloir la PROXIMITÉ de la mer ; « la distance » nommerait l'écart.
        headlineSubject: "la proximité de la mer",
```

`fact-compositions.ts`, dans le retour du patron `territory-size-multiple-consequences` (ligne 127) :

```ts
    title: "Une même petite taille touche plusieurs dimensions de votre projet",
    headlineSubject: "la taille du territoire",
```

- [ ] **Step 6: Réparer les fixtures de test**

Le champ étant obligatoire, `npx tsc --noEmit` signale toutes les fabriques de test qui construisent un `MismatchFact` ou une `SharedEvidenceComposition`. Ajouter `headlineSubject` à chacune, avec une valeur cohérente avec le `topic` de la fixture.

Run: `npx tsc --noEmit`
Expected: 0 erreur une fois toutes les fixtures complétées.

- [ ] **Step 7: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/*.test.ts`
Expected: 0 fail.

- [ ] **Step 8: Commit**

```bash
git add src/lib/decision/
git commit -m "feat(dossier): headlineSubject obligatoire sur tout mismatch, garde a l'assemblage"
```

---

### Task 4: Extraire `rankLeadCandidates`, la primitive de tri commune

`selectLead` mélange trois choses : construire les candidats, trouver le meilleur tier, décider `single` / `tied` / `none`. On extrait la primitive **sans changer un seul comportement** : les tests existants restent verts sans être modifiés.

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts:136-161`
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `export type LeadCandidate = { factId: string; topic: string; subject: string; statement: string; materialityTier: MaterialityTier; role: DecisionFact["role"] | "composition"; absorbedFactIds?: string[] }`
  - `export function rankLeadCandidates(shownFacts: DecisionFact[], shownCompositions?: FactComposition[]): LeadCandidate[]`
  - `selectLead` inchangée en signature et comportement.

Note : `subject` est porté par le candidat, renseigné à la construction (`headlineSubject` pour un mismatch ou une composition `shared_evidence`, `topic` sinon). Le sélecteur n'a alors aucun lookup à faire, et `conclusion-plan.ts` n'importe aucune table éditoriale.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter la fabrique de mismatch à côté du helper `verification` existant :

```ts
function mismatchFact(id: string, tier: MaterialityTier, key: string, subject: string, topic = `sujet ${id}`): DecisionFact {
  return {
    id, ruleId: `territoire.mismatch-${key}`, sourceFactIds: [], module: "territoire",
    statement: `constat ${id}`, topic, headlineSubject: subject, materialityTier: tier, role: "mismatch",
    projectKey: key as never,
    basis: { kind: "relative_position", rankLow: 0.02, rankHigh: 0.08, universe: "communes_france", distributionVersion: "test" },
    evidence: [{ factId: id, module: "territoire", label: "Territoire", grain: "commune" }],
  };
}
```

puis les tests :

```ts
test("rankLeadCandidates ne rend que les candidats du meilleur tier, dans l'ordre d'entrée", () => {
  const out = rankLeadCandidates(
    [verification("a", "structuring"), verification("b", "decision_critical"), verification("c", "decision_critical")],
    [],
  );
  assert.deepEqual(out.map((c) => c.factId), ["b", "c"]);
});

test("rankLeadCandidates rend un tableau vide quand rien ne dépasse secondary", () => {
  assert.deepEqual(rankLeadCandidates([verification("a", "secondary")], []), []);
  assert.deepEqual(rankLeadCandidates([], []), []);
});

test("un candidat de réserve porte son topic comme sujet", () => {
  const out = rankLeadCandidates([verification("f1", "structuring", "constat", "la chaleur estivale")], []);
  assert.equal(out[0]!.subject, "la chaleur estivale");
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL, « rankLeadCandidates is not a function ».

- [ ] **Step 3: Écrire l'implémentation**

Remplacer les lignes 136-161 :

```ts
export type LeadCandidate = {
  factId: string;
  topic: string;
  // Le sujet à NOMMER dans le headline. Un mismatch et une composition de mismatchs portent leur
  // `headlineSubject` (la priorité du lecteur) ; toute autre réserve est nommée par son `topic`,
  // déjà écrit comme un groupe nominal court.
  subject: string;
  statement: string;
  materialityTier: MaterialityTier;
  role: DecisionFact["role"] | "composition";
  absorbedFactIds?: string[];
};

// LA PRIMITIVE DE TRI, partagée par les deux sélecteurs (headline et strate résiduelle). Elle rend
// les candidats du MEILLEUR tier, dans l'ordre d'entrée : l'ordre des sections EST l'ordre éditorial,
// et retrier à l'intérieur d'un tier transformerait une déclaration en priorité métier. Le tier
// `secondary` ne couronne rien : il n'y a alors rien d'assez matériel pour être cité.
export function rankLeadCandidates(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[] = [],
): LeadCandidate[] {
  const candidates: LeadCandidate[] = [
    ...reserves(shownFacts).map((f) => ({
      factId: f.id, topic: f.topic, subject: f.topic, statement: f.statement,
      materialityTier: f.materialityTier, role: f.role,
    })),
    ...shownCompositions.filter((c) => c.kind === "tradeoff" || c.kind === "grouped_verification")
      .map((c) => ({
        factId: c.id, topic: c.title, subject: c.title, statement: c.summary,
        materialityTier: c.materialityTier, role: "composition" as const, absorbedFactIds: c.absorbedFactIds,
      })),
  ];
  if (candidates.length === 0) return [];
  const best = Math.min(...candidates.map((f) => TIER_ORDER[f.materialityTier]));
  if (best === TIER_ORDER.secondary) return [];
  return candidates.filter((f) => TIER_ORDER[f.materialityTier] === best);
}

// LE LEAD PEUT ÊTRE UNE COMPOSITION PORTEUSE DE RÉSERVES (tradeoff, grouped_verification), JAMAIS un
// shared_evidence : les mismatchs sont exclus du lead par doctrine (RESERVE_ROLES), et un mismatch
// COMPOSÉ n'obtient pas un accès que les mismatchs simples n'ont pas. Si un jour les mismatchs doivent
// pouvoir mener la conclusion, la décision se prend ICI, pour tous, jamais par effet de bord d'un
// patron. Le candidat composé porte son TITRE en topic et son SUMMARY en statement.
export function selectLead(shownFacts: DecisionFact[], shownCompositions: FactComposition[] = []): LeadSelection {
  return leadFromCandidates(rankLeadCandidates(shownFacts, shownCompositions));
}

function leadFromCandidates(top: LeadCandidate[]): LeadSelection {
  if (top.length === 0) return { kind: "none" };
  if (top.length === 1) {
    const f = top[0]!;
    // `single` garde le constat : UN fait cité seul peut être dit en entier sans noyer la conclusion,
    // et le lecteur mérite de savoir ce qui pèse, pas seulement de quoi ça parle.
    return { kind: "single", factId: f.factId, topic: f.topic, statement: f.statement, materialityTier: f.materialityTier };
  }
  // `tied` ne garde que les SUJETS : trois constats entiers recopieraient les trois cartes qui suivent.
  return { kind: "tied", facts: top.map((f) => ({ factId: f.factId, topic: f.topic })), materialityTier: top[0]!.materialityTier };
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/*.test.ts` puis `npx tsc --noEmit`
Expected: 0 fail, 0 erreur. Aucun test préexistant de `selectLead` ne doit être modifié.

- [ ] **Step 5: Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-plan.test.ts
git commit -m "refactor(dossier): rankLeadCandidates, primitive de tri partagee des candidats de tete"
```

---

### Task 5: La cascade déterministe du headline

Le cœur du lot. Un constructeur unique parcourt la cascade et produit, par branche, le couple `{ headline, detail }` plus le label et le ton. Il remplace `verdict()` (`conclusion-plan.ts:186-306`), dont les textes deviennent les `detail`.

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts`
- Modify: `src/lib/decision/decision-assembler.ts:123`
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: `aCommune` (Task 1), `headlineSubject` des faits (Task 3), `rankLeadCandidates` (Task 4).
- Produces:
  - `export type VerdictHeadline = { kind: "named_issues" | "posture"; text: string; consumedFactIds: string[]; consumedCompositionIds: string[]; consumedFrom: "reserves" | "mismatches" | "constraint" | null }`
  - `export type VerdictPresentation = { headline: VerdictHeadline; detail: string }`
  - `ConclusionNarrativePlan` gagne `verdict: VerdictPresentation`. Le bloc `verdict` porte `fallbackText = verdict.detail`.
  - `ConclusionPlanInput.establishedIncompatibility` devient `{ factId: string; statement: string; topic: string } | null`.
  - `export const HEADLINE_MAX_ISSUES = 2`, `export const HEADLINE_MAX_CHARS = 95`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// ── Le headline ────────────────────────────────────────────────────────────────

test("arbitrage : deux mismatchs affichés sont NOMMÉS après un deux-points", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Deux priorités correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels.",
  );
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
  assert.equal(plan.verdict.headline.consumedFrom, "mismatches");
});

test("arbitrage : un seul mismatch, le singulier est accordé partout", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1,
  }));
  assert.equal(plan.verdict.headline.text, "Une priorité correspond moins bien à Toulouse : le calme.");
  assert.match(plan.verdict.detail, /Cet écart appelle/);
});

test("arbitrage : deux mismatchs, le détail accorde le pluriel", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.match(plan.verdict.detail, /Ces écarts appellent/);
});

test("arbitrage : une composition shared_evidence est candidate au headline", () => {
  // Les mismatchs élémentaires sont ABSORBÉS : shownFacts n'en contient aucun, et sans cette branche
  // le héros retomberait en posture alors qu'une carte visible nomme l'enjeu.
  const comp = {
    id: "comp-taille", kind: "shared_evidence", title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: "résumé", headlineSubject: "la taille du territoire", materialityTier: "structuring",
    absorbedFactIds: ["m1", "m2"], displaySection: "mismatches",
  } as unknown as FactComposition;
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration", shownFacts: [], shownCompositions: [comp],
    mismatchTotal: 2, mismatchShown: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.verdict.headline.text, "Une priorité correspond moins bien à Toulouse : la taille du territoire.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["m1", "m2"]);
  assert.deepEqual(plan.verdict.headline.consumedCompositionIds, ["comp-taille"]);
});

test("gate 2 enjeux : trois mismatchs affichés basculent en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
      mismatchFact("m3", "structuring", "acces_soins", "l'accès aux soins"),
    ],
    mismatchTotal: 3, mismatchShown: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Un arbitrage réel à Toulouse, sans incompatibilité établie.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, []);
  assert.equal(plan.verdict.headline.consumedFrom, null);
});

test("gate de longueur : deux sujets longs et un nom long basculent en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    communeNom: "Saint-Rémy-de-Provence",
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "acces_ecoles", "l'accès aux collèges et lycées"),
      mismatchFact("m2", "structuring", "faible_dependance_auto", "la faible dépendance à la voiture"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.ok(plan.verdict.headline.text.length <= HEADLINE_MAX_CHARS);
});

test("réserve dominante unique : le sujet est nommé, le fait consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical", "constat f1", "la chaleur estivale"), verification("f2", "secondary")],
    reservesShown: 2, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.verdict.headline.text, "Le principal point à contrôler à Toulouse : la chaleur estivale.");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["f1"]);
  assert.equal(plan.verdict.headline.consumedFrom, "reserves");
});

test("réserves à égalité : aucune ne domine, le headline reste en posture", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
    reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.deepEqual(plan.verdict.headline.consumedFactIds, []);
});

test("cas favorable : posture, jamais un positif nommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "favorable", hasFavorable: true, favorableCount: 3,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Toulouse semble bien correspondre à votre projet.");
});

test("incompatibilité : la contrainte est nommée, le fait consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "incompatible",
    establishedIncompatibility: { factId: "i1", statement: "La mer est à 240 km.", topic: "la proximité de la mer" },
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(
    plan.verdict.headline.text,
    "Une contrainte de votre projet n'est pas satisfaite à Toulouse : la proximité de la mer.",
  );
  assert.deepEqual(plan.verdict.headline.consumedFactIds, ["i1"]);
  assert.equal(plan.verdict.headline.consumedFrom, "constraint");
  assert.match(plan.verdict.detail, /240 km/);
});

test("couverture insuffisante : posture", () => {
  const plan = buildConclusionPlan(baseInput({ conclusionState: "insufficient_evidence" }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.verdict.headline.text, "Des éléments essentiels manquent encore pour trancher à Toulouse.");
});

test("le détail ne redit aucun sujet nommé par le headline", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2, reservesShown: 4,
  }));
  assert.equal(plan.verdict.detail.includes("le calme"), false);
  assert.equal(plan.verdict.detail.includes("espaces naturels"), false);
  assert.match(plan.verdict.detail, /arbitrage/i);
});

test("les réserves sont à CONTRÔLER, la contrainte non examinée est à VÉRIFIER", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 4,
    uncovered: [MER],
  }));
  assert.match(plan.verdict.detail, /4 constats restent par ailleurs à contrôler/);
  assert.match(plan.blocks.find((b) => b.key === "unexamined_hard_constraints")!.fallbackText, /à vérifier/);
});

test("le bloc verdict porte le DÉTAIL, et reste non générable", () => {
  const plan = buildConclusionPlan(baseInput());
  assert.equal(plan.blocks[0]?.key, "verdict");
  assert.equal(plan.blocks[0]!.generable, false);
  assert.equal(plan.blocks[0]!.fallbackText, plan.verdict.detail);
});

test("consommation NARRATIVE seulement : les comptes ne bougent pas", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [mismatchFact("m1", "structuring", "cadre_calme", "le calme"), verification("f1", "decision_critical")],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 1, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.reservesCount, 1);
});
```

Compléter l'import de tête avec `HEADLINE_MAX_CHARS` et `import type { FactComposition } from "./fact-composition.ts";`.

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL, « Cannot read properties of undefined (reading 'headline') ».

- [ ] **Step 3: Écrire les types**

Compléter les imports de tête :

```ts
import { deCommune, aCommune } from "../typography.ts";
```

Ajouter après `export type VerdictTone` (ligne 47) :

```ts
// LE HÉROS DU BLOC. Il dit le cœur de la décision, en une phrase que le lecteur saisit d'un coup
// d'œil. Il n'est JAMAIS généré : un texte aussi visible ne peut pas changer de ton selon un tirage.
//
// `consumed*` porte l'invariant de NON-RÉPÉTITION : tout sujet nommé ici est consommé et ne peut plus
// être nommé par une strate voisine. Il réapparaît librement dans les cartes plus bas, qui portent la
// preuve. La comparaison se fait sur des IDENTIFIANTS, jamais sur des textes. Les identifiants de
// faits (y compris les absorbés d'une composition) vont dans `consumedFactIds` ; ceux de compositions
// dans `consumedCompositionIds`.
//
// `consumedFrom` dit DANS QUEL POOL le headline a puisé. La strate voisine en a besoin : si elle
// puise dans le même pool, elle est la SUITE d'une hiérarchie déjà ouverte (« À regarder ensuite »),
// et non une seconde hiérarchie globale (« Parmi ces 4 points, 2 pèsent le plus ») qui contredirait
// le « principal point » que le héros vient de désigner.
export type VerdictHeadline = {
  kind: "named_issues" | "posture";
  text: string;
  consumedFactIds: string[];
  consumedCompositionIds: string[];
  consumedFrom: "reserves" | "mismatches" | "constraint" | null;
};

// Le headline et le détail sont deux sorties COORDONNÉES d'un même constructeur, jamais l'une dérivée
// de l'autre par manipulation de chaîne (fragile dès qu'une formulation évolue).
export type VerdictPresentation = { headline: VerdictHeadline; detail: string };

// Deux enjeux nommés au maximum : trois en grand Serif recréeraient le paragraphe qu'on supprime.
// Et un plafond de longueur, nom de commune compris : deux sujets longs débordent la mesure du héros.
// Seuil à recaler VISUELLEMENT après la Task 10 (mesure de 540 px).
export const HEADLINE_MAX_ISSUES = 2;
export const HEADLINE_MAX_CHARS = 95;
```

Ajouter `verdict: VerdictPresentation;` à `ConclusionNarrativePlan` après `lead: LeadSelection;`, et dans `ConclusionPlanInput` :

```ts
  establishedIncompatibility: { factId: string; statement: string; topic: string } | null;
```

- [ ] **Step 4: Écrire le constructeur**

Remplacer `type Verdict` et la fonction `verdict(input)` (lignes 163-306) par :

```ts
type VerdictBuild = { label: string; tone: VerdictTone; headline: VerdictHeadline; detail: string };

const POSTURE = (text: string): VerdictHeadline =>
  ({ kind: "posture", text, consumedFactIds: [], consumedCompositionIds: [], consumedFrom: null });

// LA DOUBLE GATE. Un headline qui nomme doit tenir les DEUX conditions, sinon la branche entière
// retombe en posture : jamais un héros à moitié nommé, jamais une phrase qui déborde sa mesure.
function nameIssues(
  text: string,
  candidates: LeadCandidate[],
  from: "reserves" | "mismatches" | "constraint",
): VerdictHeadline | null {
  if (candidates.length === 0 || candidates.length > HEADLINE_MAX_ISSUES) return null;
  if (text.length > HEADLINE_MAX_CHARS) return null;
  return {
    kind: "named_issues",
    text,
    // Une composition consommée emporte ses faits absorbés : ils sont des FAITS, et vont donc dans
    // `consumedFactIds`. Son propre identifiant est le seul à entrer dans `consumedCompositionIds`.
    consumedFactIds: candidates.flatMap((c) =>
      c.role === "composition" ? (c.absorbedFactIds ?? []) : [c.factId]),
    consumedCompositionIds: candidates.filter((c) => c.role === "composition").map((c) => c.factId),
    consumedFrom: from,
  };
}

// LES CANDIDATS DU HEADLINE D'ARBITRAGE. Une composition `shared_evidence` est une CARTE de mismatch
// (displaySection: "mismatches") qui a ABSORBÉ ses faits élémentaires : les chercher seulement dans
// `shownFacts` ferait retomber le héros en posture sur un dossier dont une carte nomme pourtant très
// bien l'enjeu. Elle porte son `headlineSubject` propre : son `title` raconte le patron, trop long
// pour une phrase de héros.
function mismatchCandidates(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[],
): LeadCandidate[] {
  return [
    ...shownFacts.filter((f) => f.role === "mismatch").map((f) => ({
      factId: f.id, topic: f.topic, subject: f.role === "mismatch" ? f.headlineSubject : f.topic,
      statement: f.statement, materialityTier: f.materialityTier, role: f.role,
    })),
    ...shownCompositions.filter((c) => c.kind === "shared_evidence").map((c) => ({
      factId: c.id, topic: c.title, subject: c.headlineSubject, statement: c.summary,
      materialityTier: c.materialityTier, role: "composition" as const, absorbedFactIds: c.absorbedFactIds,
    })),
  ];
}

// Ce qui reste à contrôler, dit sans jamais laisser croire que le point nommé par le héros s'ajoute
// au compte. `named` = le headline a déjà nommé un élément de CE pool.
function resteAControler(r: number, named: boolean): string {
  if (r === 0) return "";
  if (named) return r > 1 ? ` Ce point fait partie de ${r} constats à contrôler.` : " C'est le seul constat à contrôler.";
  return r > 1 ? ` ${r} constats restent à contrôler.` : " Un constat reste à contrôler.";
}

// LA TABLE DE VÉRITÉ DU VERDICT (spec 2.1 §5, révisée par le lot « verdict héros »). Déterministe,
// mot pour mot, JAMAIS générée. Chaque branche produit EXPLICITEMENT son couple headline + détail.
//
// « Aucune contrainte n'est contredite » décrivait l'absence d'un problème. Le lecteur, lui, demande
// si ce lieu lui convient. Le déterministe gagne donc le droit de répondre « ce lieu correspond », à
// une condition : pouvoir le PROUVER. La preuve tient en deux mesures (couverture × orientation) et
// un couperet (une contrainte dure non examinée interdit la couverture élevée).
//
// LE SUJET DE LA PHRASE EST LE LIEU, OU LE LECTEUR. Seule exception, celle où l'objet de la phrase
// EST notre incapacité (une donnée manque) : là, s'effacer serait de la lâcheté.
//
// Et AUCUNE PHRASE NE PROMET UN POSITIF QUI N'EXISTE PAS. L'architecture ne produit aucun fait
// favorable déterministe : les cas favorables tombent donc en POSTURE.
function verdictPresentation(input: ConclusionPlanInput): VerdictBuild {
  const nom = input.communeNom;
  const a = aCommune(nom);

  if (input.conclusionState === "project_not_structured") {
    return {
      label: "À préciser", tone: "neutral",
      headline: POSTURE(`Décrivez votre projet pour mettre ${nom} en regard de ce qui compte pour vous.`),
      detail: "",
    };
  }
  if (input.conclusionState === "insufficient_evidence") {
    return {
      label: "Impossible de conclure", tone: "neutral",
      headline: POSTURE(`Des éléments essentiels manquent encore pour trancher ${a}.`),
      detail: `Une donnée déterminante manque encore pour conclure sur ${nom}.`,
    };
  }

  // INCOMPATIBILITÉ. Le blocage EST la réponse : le headline nomme la contrainte, le détail porte le
  // constat qui l'établit.
  if (input.orientation === "incompatible") {
    const inc = input.establishedIncompatibility;
    const named = inc
      ? nameIssues(`Une contrainte de votre projet n'est pas satisfaite ${a} : ${inc.topic}.`, [{
          factId: inc.factId, topic: inc.topic, subject: inc.topic, statement: inc.statement,
          materialityTier: "decision_critical", role: "incompatibility",
        }], "constraint")
      : null;
    return {
      label: "Condition non respectée", tone: "critical",
      headline: named ?? POSTURE(`Une contrainte de votre projet n'est pas satisfaite ${a}.`),
      detail: inc ? endWithPeriod(inc.statement) : "L'une de vos conditions non négociables n'est pas respectée ici.",
    };
  }

  if (input.coverage === "none") {
    return {
      label: "Lecture non disponible", tone: "neutral",
      // « ne peut pas encore » et non « n'a pas encore pu » : le présent parle de l'état du dossier,
      // le passé composé raconterait un échec du moteur.
      headline: POSTURE(`${nom} ne peut pas encore être évalué au regard de vos critères.`),
      detail: "Les critères de votre projet n'ont pas encore de lecture disponible sur cette commune.",
    };
  }

  // ARBITRAGE. Le headline NOMME les priorités moins bien servies (1 ou 2), et le détail cesse alors
  // de les décrire : il porte l'articulation. La branche de posture compte le TOTAL des mismatchs
  // ÉMIS, jamais l'affiché : 5 déclenchés ne disent pas « trois ».
  if (input.orientation === "arbitration") {
    const candidates = mismatchCandidates(input.shownFacts, input.shownCompositions);
    const sujets = joinFr(candidates.map((c) => c.subject));
    const phrase = candidates.length > 1
      ? `Deux priorités correspondent moins bien ${a} : ${sujets}.`
      : `Une priorité correspond moins bien ${a} : ${sujets}.`;
    const named = nameIssues(phrase, candidates, "mismatches");

    const m = input.mismatchTotal;
    // Le pool des réserves est DISTINCT de celui des mismatchs : le point nommé par le héros n'en
    // fait pas partie, donc « par ailleurs », et jamais « ce point fait partie de ».
    const suite = input.reservesShown > 0
      ? ` ${input.reservesShown > 1 ? `${input.reservesShown} constats restent` : "Un constat reste"} par ailleurs à contrôler.`
      : "";
    const ecarts = candidates.length > 1 ? "Ces écarts appellent un arbitrage" : "Cet écart appelle un arbitrage";
    return {
      label: "Arbitrage", tone: "neutral",
      headline: named ?? POSTURE(`Un arbitrage réel ${a}, sans incompatibilité établie.`),
      detail: named
        ? `Aucune incompatibilité n'a été établie ${a}. ${ecarts} entre vos priorités, sans rendre ${nom} incompatible avec votre projet.${suite}`
        : `${m > 1 ? `${m} de vos priorités sont` : "Une de vos priorités est"} nettement moins bien servie${m > 1 ? "s" : ""} qu'ailleurs. Cela appelle un arbitrage entre vos priorités, sans rendre ${nom} incompatible avec votre projet.${suite}`,
    };
  }

  // NEUTRAL : examiné, données disponibles, aucun signal marqué. Rien à nommer.
  if (input.orientation === "neutral") {
    return {
      label: "Correspondance sans signal marqué", tone: "neutral",
      headline: POSTURE(`${nom} ne se distingue nettement ni favorablement ni défavorablement.`),
      detail: "Vos priorités ont pu être examinées sur ces dimensions. Aucun écart notable n'apparaît, ni avantage net.",
    };
  }

  // FAVORABLE : posture, toujours. Nommer un positif exigerait un fait favorable déterministe, que
  // l'architecture ne produit pas (cf. coast-rules : « l'architecture n'a pas de fait favorable »).
  if (input.orientation === "favorable") {
    return input.coverage === "high"
      ? {
          label: "Bonne correspondance", tone: "positive",
          headline: POSTURE(`${nom} semble bien correspondre à votre projet.`),
          detail: "Les critères de votre projet qui ont pu être examinés vont dans ce sens.",
        }
      : {
          label: "Signaux favorables", tone: "neutral",
          headline: POSTURE(`${nom} va dans le sens de votre projet sur les critères déjà couverts.`),
          detail: "La lecture reste incomplète : d'autres critères de votre projet n'ont pas encore pu être examinés.",
        };
  }

  // RÉSERVES. Le headline nomme la réserve DOMINANTE quand une seule domine ; à égalité, il n'y a
  // rien à couronner, et la strate de poids fera son travail plus bas.
  const dominants = rankLeadCandidates(input.shownFacts, input.shownCompositions);
  const dominant = dominants.length === 1 ? dominants[0]! : null;
  const namedReserve = dominant
    ? nameIssues(`Le principal point à contrôler ${a} : ${dominant.subject}.`, [dominant], "reserves")
    : null;
  const nommee = namedReserve != null;

  const n = input.majorReserveCount;
  const r = input.reservesShown;
  const plusieurs = input.favorableCount >= 2;

  if (input.coverage === "high") {
    if (input.orientation === "minor_reserves") {
      return {
        label: input.hasFavorable ? "Correspondance favorable" : "Correspondance à confirmer",
        tone: input.hasFavorable ? "positive" : "neutral",
        headline: namedReserve ?? POSTURE(
          input.hasFavorable
            ? `${nom} semble bien correspondre à votre projet, sous réserve.`
            : `La correspondance ${deCommune(nom)} avec votre projet reste à confirmer.`,
        ),
        detail: input.hasFavorable
          ? `${nom} semble bien correspondre à votre projet.${resteAControler(r, nommee)}`
          : `La correspondance ${deCommune(nom)} avec votre projet reste à confirmer.${resteAControler(r, nommee)}`,
      };
    }
    return {
      label: "Correspondance à nuancer", tone: "caution",
      headline: namedReserve ?? POSTURE(`${capitalize(points(n, "structurant", "empêche"))} de conclure nettement ${a}.`),
      detail: !input.hasFavorable
        ? `${capitalize(points(n, "structurant", "empêche"))} encore de considérer ${nom} comme une bonne correspondance avec votre projet.`
        : plusieurs
          ? `${nom} répond à plusieurs dimensions de votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`
          : `${nom} présente des éléments favorables pour votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`,
    };
  }

  // coverage === "partial"
  if (input.orientation === "minor_reserves") {
    return {
      label: "Correspondance à confirmer", tone: "neutral",
      headline: namedReserve ?? POSTURE(`La lecture ${deCommune(nom)} reste incomplète pour trancher.`),
      detail: input.hasFavorable
        ? `${nom} va plutôt dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète.${resteAControler(r, nommee)}`
        : `La lecture reste incomplète.${resteAControler(r, nommee)}`,
    };
  }
  return {
    label: "Lecture encore partielle", tone: "caution",
    headline: namedReserve ?? POSTURE(`Il est encore trop tôt pour dire que ${nom} correspond à votre projet.`),
    detail: `La lecture reste incomplète et ${points(n, "structurant", "demande")} attention.`,
  };
}
```

- [ ] **Step 5: Brancher dans `buildConclusionPlan` et l'assembleur**

```ts
export function buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan {
  const v = verdictPresentation(input);

  // LE VERDICT N'EST JAMAIS GÉNÉRÉ. C'est la phrase qui peut renverser une décision perçue. Le bloc
  // porte le DÉTAIL : le headline vit à part sur le plan, il n'est pas un registre confié au modèle.
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: v.detail,
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    requiredPhrases: [],
    allowedNumbers: [],
    maxChars: 320,
    generable: false,
  }];
```

Ajouter `verdict: v,` dans les **deux** `return` de la fonction. Puis `decision-assembler.ts:123` :

```ts
    establishedIncompatibility: established ? { factId: established.id, statement: established.statement, topic: established.topic } : null,
```

- [ ] **Step 6: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts` puis `node --test src/lib/decision/*.test.ts` puis `npx tsc --noEmit`
Expected: 0 fail, 0 erreur. Les assertions de `decision-assembler.test.ts` portant sur `d.conclusion` visent la matière (« 240 km », « trop loin »), jamais la formulation exacte : les mettre à jour si besoin.

- [ ] **Step 7: Commit**

```bash
git add src/lib/decision/
git commit -m "feat(dossier): cascade deterministe headline + detail du verdict"
```

---

### Task 6: La strate de poids devient résiduelle, et contextuelle

`reserves_found` se reconstruit sur ce que le headline n'a pas consommé. S'il ne reste rien, la strate n'existe pas. Et quand le héros a déjà couronné un point du MÊME pool, la strate devient la suite d'une hiérarchie ouverte, jamais une seconde hiérarchie globale.

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts` (`selectResidualLead`, bloc `reserves_found` lignes 386-429)
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: `rankLeadCandidates` (Task 4), `VerdictHeadline` (Task 5).
- Produces: `export function selectResidualLead(shownFacts, shownCompositions, consumed): LeadSelection`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
// ── La strate résiduelle ───────────────────────────────────────────────────────

test("la strate se reconstruit sur ce que le headline n'a pas consommé", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "structuring", "constat f2", "le retrait-gonflement des argiles"),
      verification("f3", "structuring", "constat f3", "l'exposition au bruit"),
    ],
    reservesShown: 3, majorReserveCount: 3,
  }));
  assert.equal(plan.verdict.headline.consumedFactIds.includes("f1"), true);
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.equal(strate.fallbackText.includes("la chaleur estivale"), false);
  assert.match(strate.fallbackText, /argiles/);
  assert.match(strate.fallbackText, /bruit/);
});

test("même pool : la strate est la SUITE, jamais une seconde hiérarchie", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "structuring", "constat f2", "le retrait-gonflement des argiles"),
      verification("f3", "structuring", "constat f3", "l'exposition au bruit"),
    ],
    reservesShown: 3, majorReserveCount: 3,
  }));
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  // Le héros vient de désigner LE principal point : annoncer que deux autres « pèsent le plus »
  // ouvrirait une hiérarchie concurrente.
  assert.equal(strate.fallbackText.includes("pèsent le plus"), false);
  assert.match(strate.fallbackText, /^À regarder ensuite/);
});

test("pool différent : la strate garde son moule de poids", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      verification("f1", "decision_critical", "constat f1", "la chaleur estivale"),
      verification("f2", "decision_critical", "constat f2", "l'exposition au bruit"),
    ],
    mismatchTotal: 1, mismatchShown: 1, reservesShown: 2, majorReserveCount: 2,
  }));
  const strate = plan.blocks.find((b) => b.key === "reserves_found")!;
  assert.match(strate.fallbackText, /demandent votre attention|pèsent le plus/);
});

test("pas de résiduel, pas de strate", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical", "constat f1", "la chaleur estivale")],
    reservesShown: 1, majorReserveCount: 1,
  }));
  assert.equal(plan.verdict.headline.kind, "named_issues");
  assert.equal(plan.lead.kind, "none");
  assert.equal(plan.blocks.some((b) => b.key === "reserves_found"), false);
});

test("un headline de posture ne consomme rien : la strate est complète", () => {
  const plan = buildConclusionPlan(baseInput({
    coverage: "high", orientation: "minor_reserves", hasFavorable: false,
    shownFacts: [verification("f1", "decision_critical"), verification("f2", "decision_critical")],
    reservesShown: 2, majorReserveCount: 2,
  }));
  assert.equal(plan.verdict.headline.kind, "posture");
  assert.equal(plan.lead.kind, "tied");
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL sur « la strate se reconstruit » (le lead contient encore f1).

- [ ] **Step 3: Écrire `selectResidualLead`**

Après `leadFromCandidates` :

```ts
// LA STRATE DE POIDS EST RÉSIDUELLE. Le headline a déjà nommé ce qui définit la décision ; cette
// strate dit la PROCHAINE priorité à instruire. Répéter un sujet nommé trois centimètres plus haut
// ferait lire deux fois la même chose, et laisserait croire à deux niveaux de réserve distincts.
//
// La consommation est NARRATIVE : elle retire un sujet d'un résumé voisin, jamais d'un compteur, d'un
// état métier ou d'une carte. Le résiduel n'est jamais exhaustif : il nomme les dominants restants.
export function selectResidualLead(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[],
  consumed: { consumedFactIds: string[]; consumedCompositionIds: string[] },
): LeadSelection {
  const out = new Set([...consumed.consumedFactIds, ...consumed.consumedCompositionIds]);
  if (out.size === 0) return selectLead(shownFacts, shownCompositions);
  // On filtre AVANT le rang : le survivant d'un tier inférieur devient légitimement le dominant
  // résiduel quand le tier supérieur est entièrement consommé, ce qui est exactement le cas visé.
  return leadFromCandidates(rankLeadCandidates(
    shownFacts.filter((f) => !out.has(f.id)),
    shownCompositions.filter((c) => !out.has(c.id)),
  ));
}
```

- [ ] **Step 4: Brancher, et rendre la prose contextuelle**

Remplacer la ligne 364 :

```ts
  const lead = selectResidualLead(input.shownFacts, input.shownCompositions, v.headline);
  // Le héros a-t-il déjà couronné un point de CE pool ? Alors la strate est la SUITE d'une
  // hiérarchie ouverte, et n'en ouvre pas une seconde.
  const suiteDuHeros = v.headline.consumedFrom === "reserves";
```

Dans le bloc `lead.kind === "single"`, remplacer le `fallbackText` :

```ts
      fallbackText: suiteDuHeros
        ? `À regarder ensuite : ${lead.topic}.`
        : `Un point pèse plus que les autres. ${endWithPeriod(lead.statement)}`,
```

Dans le bloc `lead.kind === "tied"`, remplacer le `fallbackText` et les `allowedNumbers` :

```ts
      fallbackText: suiteDuHeros
        ? `À regarder ensuite : ${sujets}.`
        : total > n
          ? `Parmi ces ${numberForms(total)[1] ?? String(total)} points, ${numberForms(n)[1] ?? String(n)} pèsent le plus : ${sujets}.`
          : `${capitalize(numberForms(n)[1] ?? String(n))} points demandent votre attention : ${sujets}.`,
      sourceIds: lead.facts.map((f) => f.factId),
      requiredPhrases: lead.facts.map((f) => coreLabel(f.topic)),
      allowedNumbers: suiteDuHeros ? [] : total > n ? [...numberForms(n), ...numberForms(total)] : numberForms(n),
```

(En mode suite, aucun nombre n'est déclaré vrai : la phrase n'en porte aucun, et en autoriser ouvrirait la porte à un compte inventé par le modèle.)

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/*.test.ts` puis `npx tsc --noEmit`
Expected: 0 fail, 0 erreur.

- [ ] **Step 6: Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-plan.test.ts
git commit -m "feat(dossier): strate residuelle et contextuelle, suite du heros au lieu d'une seconde hierarchie"
```

---

### Task 7: Retrait du registre `mismatches_found`

Le registre est construit, envoyé au modèle, validé et stocké, mais **rendu nulle part**. Sa matière ressort dans le héros. Vérifié avant d'écrire ce plan : `grep -rn "mismatches_found" src scripts supabase` ne renvoie que sa déclaration et sa construction, dans `conclusion-plan.ts`. Un artefact stocké portant la clé retombe proprement (`unknown_key` dans `validateGeneratedBlocks`), et le hash a changé de toute façon.

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts:19` et le bloc lignes 431-447
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `BlockKey` perd `"mismatches_found"`. `shouldGenerateNarrative` peut désormais rendre `false` là où il rendait `true`.

- [ ] **Step 1: Écrire le test qui échoue**

```ts
test("le registre mismatches_found n'existe plus : sa matière est dans le héros", () => {
  const plan = buildConclusionPlan(baseInput({
    orientation: "arbitration",
    shownFacts: [
      mismatchFact("m1", "structuring", "cadre_calme", "le calme"),
      mismatchFact("m2", "structuring", "nature", "l'accès aux espaces naturels"),
    ],
    mismatchTotal: 2, mismatchShown: 2,
  }));
  assert.equal(plan.blocks.some((b) => b.key === "mismatches_found"), false);
  assert.match(plan.verdict.headline.text, /le calme/);
});
```

Lancer `grep -n "mismatches_found" src/lib/decision/conclusion-plan.test.ts` et réécrire les assertions existantes sur ce registre pour viser `plan.verdict.headline`.

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `node --test src/lib/decision/conclusion-plan.test.ts`
Expected: FAIL, « true !== false ».

- [ ] **Step 3: Écrire l'implémentation**

```ts
export type BlockKey = "verdict" | "unexamined_hard_constraints" | "compositions_found" | "reserves_found" | "uncovered_priorities";
```

Supprimer le bloc de construction (lignes 431-447) et le remplacer par :

```ts
  // LES MISMATCHS NE SONT PLUS UN REGISTRE. Leur matière (les priorités moins bien servies) est
  // nommée par le HEADLINE du verdict, en tête du bloc. Un registre construit, généré, validé et
  // stocké, mais rendu nulle part, coûtait un appel au modèle pour un texte que personne ne lisait.
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `node --test src/lib/decision/*.test.ts` puis `npx tsc --noEmit`
Expected: 0 fail, 0 erreur.

- [ ] **Step 5: Commit**

```bash
git add src/lib/decision/conclusion-plan.ts src/lib/decision/conclusion-plan.test.ts
git commit -m "refactor(dossier): retrait du registre mismatches_found, subsume par le headline"
```

---

### Task 8: Le rendu du héros

Le headline devient le **titre** de la section, en `<h2>` Serif. L'ancien titre cartouche disparaît : c'était le plus grand texte de l'écran, un cadrage sans réponse, au-dessus d'un verdict deux fois plus petit. Le remplacer par un `<p>` priverait la section de tout titre accessible.

**Files:**
- Modify: `src/components/report/ConclusionBlock.tsx:46-112`
- Modify: `src/components/report/DossierDecisionSection.tsx:55-63`

**Interfaces:**
- Consumes: `plan.verdict` (Task 5), `bindOrphans` (`src/lib/typography.ts`).
- Produces: la structure DOM que Task 9 met en largeur.

- [ ] **Step 1: Le héros dans `ConclusionBlock`**

Ajouter l'import :

```ts
import { bindOrphans } from "@/lib/typography";
```

Remplacer la ligne 48 :

```ts
  // Le bloc `verdict` porte le DÉTAIL ; le headline vit sur le plan (jamais confié au modèle).
  const detail = byKey.get("verdict")?.text ?? plan.verdict.detail;
```

Remplacer le `<p className="text-[21px] …">{verdict}</p>` par :

```tsx
      {/* LE HÉROS, et le TITRE de la section : l'ancien H2 de cadrage a disparu, un <p> aurait laissé
          le bloc sans titre accessible. Le `max-width` est l'usage prévu de l'exception de la doctrine
          de largeur (un titre de hero mesuré en espace ouvert) : une phrase de héros qui traverse
          toute la carte perd son impact. Elle ne s'applique JAMAIS aux paragraphes. */}
      <h2
        className="font-normal text-[clamp(24px,2.6vw,32px)] leading-[1.2] tracking-[-0.4px] text-label max-w-[540px]"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {bindOrphans(plan.verdict.headline.text)}
      </h2>

      {/* Le détail : construit AVEC le headline, jamais une troncature de lui. */}
      {detail ? (
        <p className="mt-3.5 text-[17px] leading-[1.6] text-muted">{detail}</p>
      ) : null}
```

Porter le `minHeight` (ligne 68) de `132px` à `168px` : le héros est plus haut que l'ancienne phrase de 21px, et cette valeur existe pour empêcher un saut de page à la substitution sous `<Suspense>`.

- [ ] **Step 2: Retirer le titre cartouche**

Dans `DossierDecisionSection.tsx`, remplacer les lignes 55-63 par :

```tsx
      {/* Le titre « {Commune}, au regard de votre projet. » a disparu : le plus grand texte de l'écran
          était un cadrage sans réponse. Le nom de la commune est tissé dans le headline, qui porte
          désormais le <h2> de la section. */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          En une minute
        </div>
      </div>
```

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit` puis `npm run build`
Expected: 0 erreur, « ✓ Compiled successfully ». Si l'environnement manque les variables Supabase, « Collecting page data » peut échouer sur `supabaseUrl is required` : défaut d'ENV, la compilation doit passer.

- [ ] **Step 4: Regarder l'écran**

`npm run dev`, ouvrir `/rapport`. Un seul point focal, le détail plus léger, l'eyebrow conservé, aucune ligne « {Commune}, au regard de votre projet. ».

- [ ] **Step 5: Commit**

```bash
git add src/components/report/
git commit -m "feat(dossier): verdict en heros, h2 de section, retrait du titre cartouche"
```

---

### Task 9: La colonne de lecture, par un wrapper unique

Bloc à **860 px aligné à gauche** (`2026-07-22-lot-a-arbitrages.md`, point 3). Un `max-w` posé sur chaque enfant serait oublié par le prochain élément ajouté : la colonne est une propriété du bloc, elle se dit une fois dans le DOM.

**Files:**
- Modify: `src/components/report/DossierDecisionSection.tsx`

**Interfaces:**
- Consumes: la structure DOM de Task 8.
- Produces: rien.

- [ ] **Step 1: Envelopper tout le contenu de la section**

Juste après `<section className="mt-14" id="dossier-decision">`, ouvrir le wrapper, et le fermer juste avant `</section>` :

```tsx
    <section className="mt-14" id="dossier-decision">
      {/* LA COLONNE DE LECTURE. Le conteneur de page (1100 px) est PARTAGÉ avec Territoire et la page
          quartier : on ne le resserre pas. On resserre le BLOC, et le texte continue de remplir chaque
          carte, donc aucune phrase ne se coupe à mi-bloc. Aligné à gauche : centrer 860 px dans 1044 px
          utiles décalerait le bloc de 92 px, assez pour rompre l'axe de la page, trop peu pour se lire
          comme une composition voulue. Un seul wrapper : la colonne est une propriété du bloc. */}
      <div className="max-w-[860px]">
        {/* … tout le contenu existant de la section … */}
      </div>
    </section>
```

Vérifier qu'aucun élément (eyebrow, bandeaux de statut, verdict, grille des cartes, note finale, les deux CTA) ne reste hors du wrapper.

- [ ] **Step 2: Vérifier à l'écran**

`npm run dev`, `/rapport`. Le bloc forme une colonne unique alignée à gauche, aucun élément ne dépasse, et en fenêtre étroite (moins de 860 px) rien ne déborde horizontalement.

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/DossierDecisionSection.tsx
git commit -m "feat(dossier): colonne de lecture 860px alignee a gauche, wrapper unique"
```

---

### Task 10: Vérification d'ensemble et passe éditoriale

**Files:**
- Read: `scripts/probe-conclusion.ts`
- Modify après relecture : la copie des Tasks 2, 3, 5, 6 et leurs assertions

- [ ] **Step 1: Sonde de conclusion**

Ouvrir `scripts/probe-conclusion.ts` pour lire sa commande d'invocation en tête, puis la lancer.
Expected: aucun bloc régressé. Le headline étant hors du chemin génératif, la sonde ne doit voir changer que le contenu du bloc `verdict` (le détail) et l'absence de `mismatches_found`.

- [ ] **Step 2: Suite complète**

```bash
npx tsc --noEmit && node --test src/lib/decision/*.test.ts src/lib/typography.test.ts && npm run build
```
Expected: 0 erreur, 0 test en échec, « ✓ Compiled successfully ».

- [ ] **Step 3: Responsive et calibrage de la gate**

Sur `/rapport`, desktop large et mobile étroit, pour **Toulouse**, **La Rochelle**, **Les Sables-d'Olonne**, **Le Kremlin-Bicêtre** et **Saint-Rémy-de-Provence**. Vérifier que le headline reste un signal de 2 à 3 lignes courtes et que `aCommune` est correct à l'écran (« aux Sables-d'Olonne », « au Kremlin-Bicêtre »).

**Calibrer `HEADLINE_MAX_CHARS` ici.** Le cas nominal (« Deux priorités correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels. ») fait 91 caractères pour un plafond de 95 : la marge est mince, et des sujets plus longs feront basculer beaucoup de dossiers en posture. Si le rendu à 540 px tient confortablement trois lignes, monter le seuil à 105 et relancer les tests de gate.

- [ ] **Step 4: Passe Editorial Writer**

Lancer l'agent `editorial-writer` sur la copie déterministe : les `subject` (Task 2), les `headlineSubject` des trois autres familles (Task 3), les textes de headline et détail par branche (Task 5), les deux moules de strate (Task 6). Consigne : écrire le rapport dans `docs/rapports-agents/editorial-writer/<date>-verdict-heros.md` avant de rendre la main, le résultat d'un sous-agent ne survivant pas à une coupure de session. Appliquer ce qui est retenu, puis relancer `node --test src/lib/decision/*.test.ts` : les assertions de texte exact se mettent à jour avec la copie.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(dossier): passe editoriale sur la copie du verdict heros"
```

---

## Coordination avec le Lot A

Le Lot A livré (`feat/lot-a-depate-en-une-minute`, `65480b4`, non mergé) pose des intertitres de grain dans la boucle des sections de `DossierDecisionSection.tsx` (lignes 96-127). Ce plan touche le haut du même fichier (lignes 55-92) et enveloppe la section. Conflit de contexte au merge, résolu en gardant les deux.

**Ordre d'intégration : Lot A, puis A1, puis ce lot.** Si A1 pose déjà la colonne, la Task 9 est déjà faite. Le `max-w-[540px]` du headline appartient à ce lot seul : le headline n'existe qu'ici.

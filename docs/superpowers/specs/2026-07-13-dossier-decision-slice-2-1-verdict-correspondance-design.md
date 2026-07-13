# Dossier de décision — slice 2.1 : le verdict de correspondance, et le rendu qui le hiérarchise

**Date** : 2026-07-13 · **Statut** : spec validée (porteur) · **Prérequis** : slice 2 livré (branche
`feat/dossier-slice-2-conclusion-redigee`, 10 commits, non poussée).

## 1. Le problème, tel que l'écran l'a montré

La slice 2 a été vérifiée à l'écran avec un projet riche (Toulouse, 7 rue du Taur, deux contraintes
dures et six préférences). Le bloc « En une minute » a rendu ceci :

> **Aucun blocage établi**
> À l'échelle de la commune et de l'adresse, sur les contraintes que nous savons examiner, aucune
> n'est contredite.
> Deux conditions n'ont pas encore pu être examinées à ce niveau de détail : les départements visés et
> la proximité d'un lieu, qui pourraient limiter ce constat si elles venaient à être vérifiées.
> 4 points structurants méritent d'être regardés de près, et plusieurs d'entre eux partagent le même
> poids dans cette conclusion.
> Ce que vous recherchez en matière de cadre calme, d'accès aux collèges et lycées et de vie locale
> animée n'a pas encore pu être lu.

Le texte est juste. Il est aussi **illisible en tant que décision**. Trois défauts distincts, de nature
différente :

**(a) La hiérarchie est calculée puis jetée.** Le moteur grave un ordre de gravité décroissante
(verdict → contraintes non examinées → réserves → priorités non couvertes) et désigne même la réserve
dominante (`selectLead`). `ConclusionBlock.tsx` rend les quatre registres en quatre `<p>` strictement
identiques (`text-[18px] leading-[1.6] text-label`). Quatre phrases de même poids : donc aucune. Le
lead, lui, n'est **jamais affiché** : il n'est envoyé qu'au prompt.

**(b) Le verdict répond à côté de la question.** « Aucune contrainte n'est contredite » décrit
l'absence d'un problème. Le lecteur, lui, demande si ce lieu lui convient. La phrase est
juridiquement prudente et humainement froide : elle gouverne toute la tonalité de la carte alors
qu'elle devrait être une réponse, bornée à ce qui a été examiné.

**(c) Le dossier se contredit lui-même.** Le projet déclare « impérativement en Haute-Garonne », le
rapport porte sur **Toulouse**, et la conclusion annonce que « les départements visés » n'ont pas pu
être examinés. Le moteur ne possède que deux règles portant une contrainte dure (`nearSea`,
`communeSize`) : tout le reste tombe mécaniquement en « non examiné », y compris ce qu'un enfant
tranche d'un coup d'œil. Cette contradiction abîme la confiance plus que l'aplatissement visuel.

Deux redondances aggravent l'ensemble : « Non encore examiné » est affiché **deux fois** (paragraphe
18 px dans la conclusion, note mono en bas de `DossierDecisionSection.tsx:163`), et « 4 points
méritent d'être regardés » est un **sommaire des cartes situées trois centimètres plus bas**.

## 2. La règle qui gouverne cette slice

> **Le déterministe gagne le droit de dire qu'un lieu correspond, à condition de pouvoir le prouver.**

Ce que le modèle n'a pas le droit d'inventer (le slice 2 le lui interdit explicitement, et c'est
pourquoi le verdict n'est jamais généré), le déterministe peut le **déclarer**, mais seulement adossé à
une mesure. Une phrase positive non mesurée serait exactement le mensonge que le slice 2 empêche le
LLM de commettre ; l'écrire nous-mêmes serait pire.

Corollaire assumé, en toutes lettres : avec la couverture actuelle (2 contraintes dures sur 11,
3 préférences sur 28), la case « couverture élevée » est **inatteignable**. La phrase « ce lieu
correspond bien à votre projet » sera du code **jamais affiché** pendant des mois, couvert par des
tests de table de vérité, jamais par une vérification à l'écran. **Le levier suivant est la couverture,
et il devient l'urgence dès cette slice livrée.**

## 3. Le registre des critères déclarés (la couche qui manquait)

Couverture et orientation ne se calculent **ni** sur le nombre de règles, **ni** sur le nombre de faits
émis, **ni** sur le nombre de cartes affichées. Elles se calculent sur les **critères que le lecteur a
déclarés**. Une préférence peut être examinée par trois règles, produire deux faits et une évaluation
silencieuse : elle reste **une** priorité.

```ts
// src/lib/decision/criteria-registry.ts
export type CriterionCoverage = "examined" | "unexamined";
export type CriterionOutcome =
  | "favorable"      // au moins une règle satisfaite, aucune réserve
  | "mixed"          // favorable ET réserve sur le même critère
  | "reserve"        // une réserve, aucune satisfaction
  | "incompatible"   // une incompatibilité établie
  | "indeterminate"; // règle applicable mais donnée manquante

export type ProjectCriterionAssessment = {
  criterionKey: string;                 // HardConstraintKey | PreferenceKey
  kind: "hard_constraint" | "preference";
  coverage: CriterionCoverage;
  outcome: CriterionOutcome;
  maxTier: MaterialityTier | null;      // matérialité maximale des faits de ce critère
  ruleIds: string[];
};

export function buildCriteriaRegistry(project: UserProject, run: RunResult): ProjectCriterionAssessment[];
```

Il se construit **sans toucher aux règles** : chaque `RuleEvaluation` porte déjà `projectKeys`
(`materiality-rules.ts` : `["nearSea"]`, `["acces_transports", "faible_chaleur"]`…). On agrège les
évaluations par critère déclaré.

**Deux états de couverture, pas trois.** Un critère est `examined` dès qu'une règle a produit une
évaluation exploitable (`satisfied` / `incompatible` / `compromise` / `verification`). Il est
`unexamined` si aucune règle ne le touche, ou si les seules règles qui le touchent ont rendu
`unknown` / `uncertain` / `not_applicable` : une donnée manquante n'est pas un examen partiel, c'est
une absence d'examen. Le cas grave (donnée bloquante) est déjà traité ailleurs, par l'état
`insufficient_evidence`. Un troisième état que nulle phrase ne consomme serait de la complexité pure.

**Gain collatéral, et il est réel :** `COVERED_PREFERENCE_KEYS`, la liste écrite à la main dans
`project-view.ts`, **disparaît**. Aujourd'hui, ajouter une règle sans penser à cette liste fait
annoncer au lecteur que sa priorité n'est pas couverte alors qu'elle vient d'être examinée. Avec le
registre, la couverture devient une **conséquence observée** des règles, plus une déclaration
parallèle qui dérive en silence.

## 4. Les deux axes

```
coverage:    none | partial | high
orientation: favorable | mixed | reserved | incompatible | indeterminate
```

**Couverture** (sur les critères déclarés, contraintes dures et préférences confondues) :

| Niveau | Condition |
|---|---|
| `none` | aucun critère déclaré n'est `examined` |
| `partial` | au moins un critère examiné, mais une contrainte dure reste non examinée **ou** moins de 70 % des critères déclarés sont examinés |
| `high` | **toutes** les contraintes dures sont examinées **et** ≥ 70 % des critères déclarés le sont |

Le **couperet des contraintes dures** est la clause centrale : tant qu'une condition absolue n'a jamais
été testée, la couverture ne peut pas être dite élevée, quel que soit le ratio. C'est ce qui empêche un
ratio flatteur (« 8 préférences sur 10 examinées ») de se transformer en fausse assurance alors que la
seule condition non négociable du lecteur n'a pas été regardée.

Le seuil de 70 % est **une décision, pas une intuition** : il vit dans une constante nommée
(`COVERAGE_HIGH_THRESHOLD`) et il est couvert par une table de vérité. Sans cela, « élevée » redevient
une décision éditoriale dispersée dans le code.

**Orientation** (sur les seuls critères examinés) : ce n'est **pas un solde**. Aucune addition, aucune
compensation : un critère satisfait ne rachète jamais une réserve critique. Elle regarde la
**matérialité maximale** des réserves, jamais leur simple existence, sinon on reproduit dans la prose
l'aplatissement qu'on corrige à l'écran.

| Orientation | Condition |
|---|---|
| `incompatible` | au moins un critère `incompatible` |
| `indeterminate` | aucun critère examiné avec un résultat exploitable |
| `favorable` | au moins un critère `favorable`, **aucune** réserve |
| `mixed` | des critères favorables **et** des réserves, toutes `secondary` |
| `reserved` | au moins une réserve `structuring` ou `decision_critical` |

## 5. La table de vérité du verdict

Le verdict reste **déterministe, mot pour mot, jamais généré**. Sujet de la phrase : le lieu ou le
lecteur, **jamais le moteur** (« les éléments examinés indiquent que… » est proscrit par la doctrine
éditoriale : on ne met pas l'outil en sujet). Une ligne, deux au pire : c'est un sommet de carte, pas
un paragraphe.

| État / couverture / orientation | Phrase |
|---|---|
| `project_not_structured` | *(inchangé)* Décrivez votre projet pour une lecture qui met en regard ce lieu et ce qui compte pour vous. |
| `insufficient_evidence` | *(inchangé)* Une donnée déterminante pour votre projet manque : nous ne pouvons pas conclure honnêtement. |
| orientation `incompatible` | Un élément de ce lieu ne correspond pas à une condition de votre projet : {statement}. |
| couverture `none` | Nous n'avons pas encore pu examiner ce qui compte dans votre projet. |
| `high` + `favorable` | Ce lieu semble bien correspondre à votre projet. |
| `high` + `mixed` | Ce lieu semble correspondre à votre projet, avec quelques points à examiner. |
| `high` + `reserved` | Ce lieu répond à plusieurs dimensions de votre projet, mais des points structurants empêchent de conclure nettement. |
| `partial` + `favorable` | Ce que nous avons pu examiner va dans le sens de votre projet, mais la lecture reste incomplète. |
| `partial` + `mixed` | Ce que nous avons pu examiner va plutôt dans le sens de votre projet, avec des points à examiner et une lecture encore incomplète. |
| `partial` + `reserved` | *(l'écran actuel)* La lecture reste incomplète, et ce que nous avons pu examiner appelle plusieurs réserves. |

Le cas `none` est le **garde-fou** que la graduation par couverture seule n'avait pas : sans lui, un
dossier où rien n'a été examiné afficherait « plusieurs éléments vont dans le sens de votre projet ».

**Invariant à tester, pas une coïncidence heureuse** : couverture `none` et orientation
`indeterminate` désignent la même situation (aucun critère examiné avec un résultat exploitable) et
sont donc toujours simultanées. Les couples `partial + indeterminate` et `high + indeterminate` sont
**impossibles par construction**. Le code doit le garantir, pas l'espérer : un test l'assert, et la
table de vérité n'a pas de ligne pour eux.

`no_hard_constraint_declared` disparaît comme phrase de verdict : la correspondance graduée fonctionne
sans contrainte dure (la couverture se calcule alors sur les seules préférences). L'information
« vous n'avez déclaré aucune condition absolue » migre dans la strate « limite de ce constat ».

## 6. La règle `departements`

Quinze lignes, une contrainte dure de plus couverte, et la contradiction de la §1(c) s'éteint.

- `not_applicable` si aucun département n'est déclaré ;
- `satisfied` si le département de la commune est dans la liste déclarée ;
- `incompatible` (`established`, `decision_critical`) sinon, avec le fait qui le dit.

Elle produit une **évaluation de critère**, pas seulement une absence d'incompatibilité : c'est ce qui
la rend visible dans le registre et donc dans la couverture (25 % → 37 % sur le projet de test).

Le helper INSEE → département **existe déjà, en double** : `commune-categories.ts:48` (qui gère la
Corse, `2A`/`2B`) et `gissol.ts:79`. On en extrait **une** version partagée, on n'en écrit pas une
troisième. Les DOM (codes à trois chiffres commençant par `97`) sont traités explicitement.

## 7. Le rendu : cinq strates étiquetées

Les quatre registres du plan (`verdict`, `unexamined_hard_constraints`, `reserves_found`,
`uncovered_priorities`) **ne changent ni de clé ni de contrat**. Ce qui change, c'est que leur rendu
cesse d'être uniforme. L'IA continue de ne rédiger que ce qu'elle a le droit de rédiger.

Chaque strate **porte une étiquette qui dit sa nature**. Un fait saillant qui surgit sans être nommé
« arrive de nulle part » ; nommé, il devient une information.

```
┌──────────────────────────────────────────────────────────┐
│ ● AUCUN BLOCAGE ÉTABLI                 commune + adresse │  mono 10px, coloré par l'état
│                                                          │
│   La lecture reste incomplète, et ce que nous            │  LA RÉPONSE — 21px, text-label
│   avons pu examiner appelle plusieurs réserves.          │  déterministe, mot pour mot
│                                                          │
│   CE QUI PÈSE LE PLUS                                    │  étiquette mono 10px, accent
│   Quatre points structurants pèsent d'un poids           │  17px — rédigeable
│   comparable : aucun ne domine la décision.              │
│                                                          │
│ ┌──────────────────────────────────────────────────┐     │
│ │ ⚠ LIMITE DE CE CONSTAT                           │     │  encart teinté, 15px muted
│ │   La proximité de la gare Matabiau n'a pas       │     │  rédigeable
│ │   encore pu être vérifiée.                       │     │
│ └──────────────────────────────────────────────────┘     │
│                                                          │
│   Pas encore couvert · cadre calme, collèges et lycées,  │  12px ghost, en retrait
│   vie locale                                             │  rédigeable
└──────────────────────────────────────────────────────────┘
```

La strate « ce qui pèse le plus » est **conditionnelle**, pilotée par `plan.lead` :

| Cas | Étiquette | Contenu |
|---|---|---|
| incompatibilité établie | *(absente)* | le blocage **est** la réponse, en haut, en rouge |
| `lead.single` | CE QUI PÈSE LE PLUS | le fait saillant, reformulé |
| `lead.tied` | DES POIDS COMPARABLES | l'égalité, dite comme telle, sans élire personne |
| `lead.none` | *(absente)* | aucun « wow » inventé |

**Invariant de substitution** : le fallback déterministe et la version rédigée partagent **exactement**
la même structure DOM, strate par strate. C'est déjà la garantie de `ConclusionBlock` ; elle doit
survivre à la hiérarchisation, sinon le remplacement sous Suspense fera sauter la page.

## 8. Les deux redondances

**La note « Non encore examiné » du bas de section disparaît** (`DossierDecisionSection.tsx:163-168`).
L'information ne s'affaiblit pas, elle **remonte** : une contrainte dure non testée réduit la portée du
verdict, donc elle se lit dans l'encart « limite de ce constat », juste sous le verdict, pas trente
centimètres plus bas. Deux emplacements laisseraient croire à deux niveaux de réserve distincts.

**Le comptage des réserves change de fonction.** Il devient l'intertitre des cartes qui suivent
(« Les quatre points qui départagent ce lieu »). Le bloc de conclusion ne garde que ce que le comptage
ne dit pas : le **poids relatif**. Le `fallbackText` de `reserves_found` porte donc désormais
l'information de poids (`single` : le fait qui domine ; `tied` : l'égalité), plus le simple décompte.

## 9. Ce que ça impose

- **`DECISION_NARRATIVE_PROMPT_VERSION` doit être bumpé** (`conclusion-hash.ts`) : le prompt change
  (nouvelle matière de `reserves_found`). Sans ce bump, les artefacts déjà écrits continueraient d'être
  servis comme s'ils étaient courants.
- **La sonde doit être relancée** (`node --env-file=.env.local scripts/probe-conclusion.ts`) avant tout
  commit : elle est l'outil de non-régression du prompt, et elle a déjà rattrapé trois contraintes qui
  ne tenaient pas alors que 100 tests étaient verts.
- Le `verdictText` change, donc le plan change, donc l'`input_hash` change : les artefacts existants
  seront naturellement recalculés (le hash porte le plan). Aucune migration.

## 10. Tests

- **Table de vérité du verdict** : les 11 lignes de la §5, en tests unitaires. C'est la seule
  couverture possible pour les cases `high`, inatteignables à l'écran aujourd'hui.
- **Registre des critères** : une préférence examinée par plusieurs règles compte pour **une** ;
  une règle `satisfied` silencieuse (aucun fait émis) rend bien le critère `examined` ; une règle qui
  ne rend que `unknown` laisse le critère `unexamined`.
- **Couperet** : une contrainte dure non examinée interdit `high`, même à 100 % de préférences
  examinées.
- **Règle `departements`** : Toulouse (31555) contre `["31"]` → `satisfied` ; contre `["33"]` →
  `incompatible` ; Corse (`2A004`) → département `2A` ; DOM (`97411`) → `974`.
- **Rendu** : structure DOM identique entre fallback et version rédigée, strate par strate.

## 11. Hors périmètre (mais c'est la suite immédiate)

**La couverture.** 2 contraintes dures sur 11, 3 préférences sur 28, module Santé absent. C'est ce qui
rend le verdict tiède, et aucune prose ne le corrigera. Cette slice construit la mécanique qui saura
dire « ce lieu correspond » ; **la slice suivante lui donne le droit de le dire**.

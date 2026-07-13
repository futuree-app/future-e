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
  | "favorable"      // examiné, rien à redire
  | "reserve"        // examiné, une réserve (son tier est porté par maxReserveTier)
  | "incompatible"   // examiné, une contrainte est contredite
  | "indeterminate"; // aucune règle exploitable sur ce critère

export type ProjectCriterionAssessment = {
  criterionKey: string;                        // HardConstraintKey | PreferenceKey
  kind: "hard_constraint" | "preference";
  coverage: CriterionCoverage;
  outcome: CriterionOutcome;
  maxReserveTier: MaterialityTier | null;      // matérialité maximale des RÉSERVES de ce critère
  ruleIds: string[];
};

export function buildCriteriaRegistry(project: UserProject, run: RunResult): ProjectCriterionAssessment[];
```

Il se construit **sans toucher aux règles** : chaque `RuleEvaluation` porte déjà `projectKeys`
(`materiality-rules.ts` : `["nearSea"]`, `["acces_transports", "faible_chaleur"]`…). On agrège les
évaluations par critère déclaré.

### 3.1 Le contrat de `projectKeys`, et le bug qu'il faut corriger d'abord

Tout le registre repose sur une hypothèse : `projectKeys` liste les critères que la règle **évalue**,
pas ceux auxquels elle est vaguement *reliée*. L'audit des cinq règles Territoire confirme que c'est le
cas aujourd'hui, mais **rien ne le garantit** : le contrat n'est écrit nulle part. Il est donc posé
explicitement sur le type `RuleEvaluation` (`decision-fact.ts`), et il devient opposable aux règles
futures. Avec cinq règles et un développeur solo, un contrat documenté et audité vaut mieux qu'une
refonte du type en `criterionEffects` : on rouvrira le sujet quand une règle le violera.

**Le vrai piège est ailleurs, et il casse le registre à la racine.** `materiality-rules.ts:140` :

```ts
if (f.inondationRisque < 66) return { ...projectKeys: ["faible_risque_inondation"],
                                      outcome: "not_applicable", reason: "exposition non notable" };
```

La priorité **est** déclarée, la donnée **est** là, le résultat **est bon** pour le lecteur, et le
moteur rend `not_applicable`. `not_applicable` porte donc aujourd'hui **deux sens incompatibles** :

- « hors sujet » : le critère n'est pas déclaré, la règle ne s'applique pas ;
- « examiné, rien à signaler » : une bonne nouvelle, silencieuse.

En l'état, une commune sans risque d'inondation ferait **baisser** la couverture et ne compterait
**jamais** comme un point favorable. Le contrat est donc tranché, et le site corrigé :

> **`not_applicable` = hors sujet. `satisfied` = déclaré, examiné, rien à redire.**

C'est la bonne nouvelle du chantier : les points favorables existaient déjà dans le moteur, ils étaient
jetés. Toute règle future qui constate silencieusement que tout va bien rend `satisfied`.

**Deux états de couverture, pas trois.** Un critère est `examined` dès qu'une règle a produit une
évaluation exploitable (`satisfied` / `incompatible` / `compromise` / `verification`). Il est
`unexamined` si aucune règle ne le touche, ou si les seules règles qui le touchent ont rendu
`unknown` / `uncertain` / `not_applicable` : une donnée manquante n'est pas un examen partiel, c'est
une absence d'examen. Le cas grave (donnée bloquante) est déjà traité ailleurs, par l'état
`insufficient_evidence`. Un troisième état que nulle phrase ne consomme serait de la complexité pure.

**Agrégation d'un critère touché par plusieurs règles** (une préférence peut l'être) : `examined` dès
qu'**une seule** évaluation exploitable existe, même si d'autres règles rendent `unknown`. Une inconnue
scopée ne peut pas annuler un examen réel ; elle vit sa vie de fait `unknown` dans les cartes.
L'`outcome` du critère prend le pire : `incompatible` > `reserve` > `favorable`.

**Gain collatéral, et il est réel :** `COVERED_PREFERENCE_KEYS`, la liste écrite à la main dans
`project-view.ts`, **disparaît**. Aujourd'hui, ajouter une règle sans penser à cette liste fait
annoncer au lecteur que sa priorité n'est pas couverte alors qu'elle vient d'être examinée. Avec le
registre, la couverture devient une **conséquence observée** des règles, plus une déclaration
parallèle qui dérive en silence.

## 4. Les deux axes

```
coverage:     none | partial | high
orientation:  favorable | minor_reserves | major_reserves | incompatible | indeterminate
hasFavorable: boolean   // au moins un critère examiné rend `favorable`
```

Les noms disent ce qu'ils décrivent. `mixed` et `reserved`, testés puis écartés, **mentaient** :
`mixed` prétend mélanger du positif et du négatif alors qu'un dossier peut n'avoir que des réserves
secondaires et rien de positif ; `reserved` ne dit pas si les réserves sont secondaires ou
structurantes, ce qui laisse écrire « des points structurants empêchent de conclure » sur un dossier
qui n'en contient aucun. `hasFavorable` est porté **à part**, parce qu'il départage des variantes de
phrase sans se confondre avec la gravité des réserves.

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

L'ordre d'évaluation est **normatif** (le premier qui matche gagne) :

| # | Orientation | Condition |
|---|---|---|
| 1 | `incompatible` | au moins un critère `incompatible` |
| 2 | `indeterminate` | aucun critère examiné |
| 3 | `major_reserves` | au moins une réserve `structuring` ou `decision_critical` |
| 4 | `minor_reserves` | des réserves, toutes `secondary` |
| 5 | `favorable` | aucune réserve |

`hasFavorable` se lit indépendamment : il est vrai dès qu'un critère examiné rend `favorable`. Un
dossier peut donc être `major_reserves` **avec** des points favorables (le lieu répond à plusieurs
dimensions, mais un point structurant coince) ou **sans** (rien de positif n'a été établi) : ce sont
deux phrases différentes, et les confondre ferait promettre au lecteur un positif qui n'existe pas.

## 5. La table de vérité du verdict, et le label qui le coiffe

Le verdict reste **déterministe, mot pour mot, jamais généré**.

**Le sujet de la phrase est le lieu, ou le lecteur. Jamais le moteur.** « Les éléments examinés
indiquent que… », « ce que nous avons pu examiner va dans le sens de… » sont proscrits : le lecteur
entend futur•e commenter son propre travail au lieu d'obtenir une réponse sur le lieu. Une seule
exception, celle où l'objet de la phrase **est** notre incapacité (« une donnée déterminante manque ») :
là, s'effacer serait de la lâcheté, pas de l'élégance. Une ligne, deux au pire : c'est un sommet de
carte, pas un paragraphe.

| État / couverture / orientation | Label | Phrase |
|---|---|---|
| `project_not_structured` | À PRÉCISER | Décrivez votre projet pour mettre ce lieu en regard de ce qui compte pour vous. |
| `insufficient_evidence` | IMPOSSIBLE DE CONCLURE | Une donnée déterminante manque encore pour conclure sur ce lieu. |
| `incompatible` | CONDITION NON RESPECTÉE | Une de vos conditions non négociables n'est pas respectée ici : {statement}. |
| couverture `none` | RIEN ENCORE EXAMINÉ | Ce lieu n'a pas encore pu être évalué au regard de vos critères. |
| `high` + `favorable` | BONNE CORRESPONDANCE | Ce lieu semble bien correspondre à votre projet. |
| `high` + `minor_reserves` | CORRESPONDANCE FAVORABLE | Ce lieu semble bien correspondre à votre projet. {N} point{s} rest{ent} à examiner. |
| `high` + `major_reserves` + favorable | CORRESPONDANCE À NUANCER | Ce lieu répond à plusieurs dimensions de votre projet, mais {N} point{s} structurant{s} empêche{nt} encore de conclure nettement. |
| `high` + `major_reserves` sans favorable | CORRESPONDANCE À NUANCER | {N} point{s} structurant{s} empêche{nt} encore de considérer ce lieu comme une bonne correspondance avec votre projet. |
| `partial` + `favorable` | SIGNAUX FAVORABLES | Ce lieu va dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète. |
| `partial` + `minor_reserves` | CORRESPONDANCE À CONFIRMER | Ce lieu va plutôt dans le sens de votre projet sur les critères déjà couverts, mais la lecture reste incomplète. |
| `partial` + `major_reserves` | LECTURE ENCORE PARTIELLE | *(l'écran actuel)* Il est encore trop tôt pour dire que ce lieu correspond à votre projet : la lecture reste incomplète et {N} point{s} structurant{s} demande{nt} attention. |

**Le label dérive de la même matrice que la phrase.** « Aucun blocage établi », qui coiffait la carte,
est lu **avant** le verdict et continue de répondre à la mauvaise question (« peut-on écarter ce
lieu ? » au lieu de « me correspond-il ? »). Il disparaît comme label. Un label ne promet jamais plus
que la phrase qu'il coiffe.

Les accords en nombre (`{N} point{s} structurant{s} demande{nt}`) sont calculés par le déterministe,
jamais laissés à une formule générique : « 1 points structurants » est le genre de détail qui détruit
la confiance qu'on essaie de construire.

**Invariant à tester, pas une coïncidence heureuse** : couverture `none` et orientation
`indeterminate` désignent la même situation (aucun critère examiné) et sont donc toujours simultanées.
Les couples `partial + indeterminate` et `high + indeterminate` sont **impossibles par construction**.
Le code doit le garantir, pas l'espérer : un test l'assert, et la table n'a pas de ligne pour eux.

`no_hard_constraint_declared` disparaît, **sans rien laisser derrière**. La correspondance graduée
fonctionne sans contrainte dure (la couverture se calcule alors sur les seules préférences). Et
l'information « vous n'avez déclaré aucune condition absolue » **ne migre nulle part** : ce n'est ni un
trou de donnée, ni une absence de couverture, ni un défaut du rapport. C'est un fait sur le projet, pas
sur le lieu, et il vit déjà dans la carte « Votre projet ». La ranger sous « limite de ce constat »,
à côté de « la distance à Matabiau n'a pas pu être vérifiée », en ferait une faiblesse alors qu'elle
n'en est pas une.

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
│ ● LECTURE ENCORE PARTIELLE             commune + adresse │  mono 10px, dérivé de la matrice §5
│                                                          │
│   Il est encore trop tôt pour dire que ce lieu           │  LA RÉPONSE — 21px, text-label
│   correspond à votre projet : la lecture reste           │  déterministe, mot pour mot
│   incomplète et deux points structurants demandent       │
│   attention.                                             │
│                                                          │
│   DES POIDS COMPARABLES                                  │  étiquette mono 10px, accent
│   Deux points de même importance arrivent en tête :      │  17px — rédigeable
│   aucun ne domine à lui seul.                            │
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
| `lead.tied` | DES POIDS COMPARABLES | l'égalité **des faits de tête**, dite comme telle, sans élire personne |
| `lead.none` | *(absente)* | aucun « wow » inventé |

**`tied` ne veut pas dire « toutes les réserves pèsent pareil ».** Il dit que **plusieurs faits
partagent le rang maximal** ; le dossier peut parfaitement contenir, en plus, des réserves de rang
inférieur. Écrire « quatre points pèsent d'un poids comparable » quand deux faits sont à égalité en
tête et deux autres sont secondaires serait **faux**. La phrase compte donc `lead.factIds.length`,
jamais `reservesCount`.

**Invariant de substitution** : le fallback déterministe et la version rédigée partagent **exactement**
la même structure DOM, strate par strate. C'est déjà la garantie de `ConclusionBlock` ; elle doit
survivre à la hiérarchisation, sinon le remplacement sous Suspense fera sauter la page.

## 8. Les deux redondances

**La note « Non encore examiné » du bas de section disparaît** (`DossierDecisionSection.tsx:163-168`).
L'information ne s'affaiblit pas, elle **remonte** : une contrainte dure non testée réduit la portée du
verdict, donc elle se lit dans l'encart « limite de ce constat », juste sous le verdict, pas trente
centimètres plus bas. Deux emplacements laisseraient croire à deux niveaux de réserve distincts.

**Le comptage des réserves change de fonction.** Il devient l'intertitre des cartes qui suivent. Le
bloc de conclusion ne garde que ce que le comptage ne dit pas : le **poids relatif**. Le `fallbackText`
de `reserves_found` porte donc désormais l'information de poids (`single` : le fait qui domine ;
`tied` : l'égalité de tête), plus le simple décompte.

L'intertitre est **« Les {N} points à examiner avant de décider »**, pas « qui départagent ce lieu » :
les cartes contiennent aussi des inconnues et des vérifications, qui ne départagent rien. Et il suit la
posture, comme le fait déjà l'assembleur (`labels()`) : en posture `habitant`, « à examiner avant de
décider » n'a aucun sens, ce sera « Les {N} points à comprendre ou surveiller ».

## 9. Ce que ça impose

- **`DECISION_NARRATIVE_PROMPT_VERSION` doit être bumpé** (`conclusion-hash.ts`) : le prompt change
  (nouvelle matière de `reserves_found`). Sans ce bump, les artefacts déjà écrits continueraient d'être
  servis comme s'ils étaient courants.
- **La sonde doit être relancée** (`node --env-file=.env.local scripts/probe-conclusion.ts`) avant tout
  commit : elle est l'outil de non-régression du prompt, et elle a déjà rattrapé trois contraintes qui
  ne tenaient pas alors que 100 tests étaient verts.
- Le `verdictText` change, donc le plan change, donc l'`input_hash` change : les artefacts existants
  seront naturellement recalculés (le hash porte le plan). Aucune migration.
- **`materiality-rules.ts:140` change de verdict** (`not_applicable` → `satisfied` quand l'exposition
  inondation est faible). Ce n'est pas un détail d'implémentation : c'est le contrat de la §3.1, et il
  fait apparaître dans le registre des points favorables que le moteur produisait déjà et jetait.

## 10. Tests

- **Table de vérité du verdict** : les 11 lignes de la §5 (label **et** phrase), en tests unitaires.
  C'est la seule couverture possible pour les cases `high`, inatteignables à l'écran aujourd'hui.
- **`hasFavorable` change la phrase** : à `high + major_reserves` constant, un dossier avec un critère
  favorable et un dossier sans ne rendent **pas** la même phrase. Le second ne promet aucun positif.
- **Accords en nombre** : une réserve structurante rend « 1 point structurant demande », pas
  « 1 points structurants demandent ».
- **Registre des critères** : une préférence examinée par plusieurs règles compte pour **une** ;
  une règle `satisfied` silencieuse (aucun fait émis) rend bien le critère `examined` **et**
  `favorable` ; une règle qui ne rend que `unknown` laisse le critère `unexamined` ; un critère
  `satisfied` par une règle et `unknown` par une autre est `examined`.
- **Non-régression du contrat `not_applicable`** : une commune à faible exposition inondation, avec la
  priorité déclarée, rend `satisfied` (plus `not_applicable`), donc **monte** la couverture et compte
  comme point favorable. C'est le bug de la §3.1 : sans ce test, il revient.
- **Couperet** : une contrainte dure non examinée interdit `high`, même à 100 % de préférences
  examinées.
- **Invariant** : `partial + indeterminate` et `high + indeterminate` sont inatteignables.
- **`lead.tied`** : deux faits critiques en tête et deux faits secondaires → la phrase dit **deux**,
  jamais quatre.
- **Règle `departements`** : Toulouse (31555) contre `["31"]` → `satisfied` ; contre `["33"]` →
  `incompatible` ; Corse (`2A004`) → département `2A` ; DOM (`97411`) → `974`.
- **Rendu** : structure DOM identique entre fallback et version rédigée, strate par strate.

## 11. Hors périmètre (mais c'est la suite immédiate)

**La couverture.** 2 contraintes dures sur 11, 3 préférences sur 28, module Santé absent. C'est ce qui
rend le verdict tiède, et aucune prose ne le corrigera. Cette slice construit la mécanique qui saura
dire « ce lieu correspond » ; **la slice suivante lui donne le droit de le dire**.

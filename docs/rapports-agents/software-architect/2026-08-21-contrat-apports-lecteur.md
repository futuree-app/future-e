# Rapport d'architecture · Contrat des apports du lecteur

**Agent** : Software Architect · **Date** : 2026-08-21 · **Statut** : évaluation datée, read-only.
**Objet** : le contrat « Doctrine des apports du lecteur : autorité, portée et usages », en conception,
rien n'est codé. La doctrine (trois natures : ReaderContext / ReaderStatement / ReaderSourceSelection)
est validée par le porteur et n'est pas rediscutée ici. Ce rapport juge sa **forme de code** et son
**coût de reprise à six mois**.

---

## 0. Périmètre effectivement lu

Doctrine : `docs/vault/briefs/logement-caracteristiques-declarees.md`, `AGENTS.md`,
`docs/vault/principes/invariants.md`, `docs/vault/doctrine/data.md`,
`docs/vault/adr/ADR-0004-stack-technique.md`, `docs/rapports-agents/_README.md`.

Code (lu, pas supposé) :

| Fichier | Ce qu'il fait, vérifié |
|---|---|
| `src/app/api/ask/route.ts:448-520` | `buildUserProfileText` traduit les codes de `workbook_quartier` en constats (`shelter: "fragilise"` → « le territoire montre déjà ses limites ») |
| `src/app/api/ask/route.ts:593-661` | le profil entier (workbook inclus) est injecté dans le prompt **sans condition de commune** |
| `src/app/api/synthesize-quartier/route.ts:172-215, 353` | `WORKBOOK_LABELS` + `shapeWorkbook`, **deuxième** table de traduction des **mêmes** quatre questions, avec des libellés différents ; l'objet `workbook` arrive **du corps de la requête client** |
| `src/app/(account)/compte/QuartierWorkbook.tsx:44-84` | les libellés réellement lus par le lecteur, **troisième** vocabulaire |
| `src/app/api/profile/route.ts:103-134` | `workbook_quartier` accepté comme JSONB libre (seul contrôle : « c'est un objet ») ; `wizard_answers` normalisé |
| `src/components/wizard/types.ts:17,29-34` | `unknownAnswers` (client) et `WIZARD_SKIP_DEFAULTS` : passer une étape écrit une réponse inventée |
| `src/components/wizard/WizardAnswersSync.tsx` | pousse `answers` depuis le `sessionStorage`, **sans** `unknownAnswers` |
| `supabase/11_terrain_observations.sql` | table propre, RLS par utilisateur, ancrée `(user_id, insee_code, module)` |
| `supabase/16_report_context.sql` | `relation`, `relation_source` (`inferred`/`confirmed_by_user`), `discovery_workbook`, ancré `(user_id, insee)` |
| `src/lib/address-dossier-store.ts:10-90` | `DpeSelectionStatus` + `buildDpeSelectionFields` : le patron ReaderSourceSelection **existe déjà** |
| `src/lib/user-project.ts` | `UserProjectInput` vs `UserProject` : le patron « entrée client / persisté estampillé serveur » **existe déjà** |
| `src/lib/decision/decision-fact.ts` | union discriminée par `role`, importe `UserProject` |
| `src/lib/decision/code-mort.test.ts`, `src/lib/decision/evidence-targets.test.ts:33-34` | **précédent** de tests qui lisent le source du produit (y compris des `.tsx` de `src/components`) |
| `src/lib/synthesis-guardrails.ts` | familles déterministes sur le texte **produit** ; sa doctrine : « un prompt n'est pas une frontière de sûreté » |
| `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md:146-154` | doc **installée** : « Design your data access functions as secure primitives… these guarantees live in one place » |

Vérification de stack : je n'ai formulé aucun jugement sur une API Next.js depuis ma mémoire. La seule
citation Next vient de la doc installée ci-dessus, et elle **conforte** le principe de constructeur
canonique unique.

---

## 1. Ce qui est sain, et qu'il ne faut pas refaire

**Deux des trois natures existent déjà en code, correctement.**

- `ReaderSourceSelection` **est** `DpeSelectionStatus` + `buildDpeSelectionFields`
  (`src/lib/address-dossier-store.ts:72-88`). L'histoire du rattachement est conservée
  (`auto_confirmed` / `user_confirmed` / `not_in_list` / `not_found` / `pending`), la valeur retenue
  est un snapshot sourcé, la date de sélection est distincte de la date de changement. C'est
  exactement le contrat décrit, déjà écrit, déjà testé (`address-dossier-store.test.ts`).
- `ReaderContext` **est** pour l'essentiel `UserProject` (`src/lib/user-project.ts`) plus
  `report_context.relation` / `relation_source`. La séparation `UserProjectInput` (entrée client
  validée) / `UserProject` (persisté, estampillé serveur) est le patron exact que le contrat réclame,
  et il est déjà appliqué sur le seul chemin d'écriture.

**Conséquence directe, et c'est ma première recommandation** : ce chantier ne crée **qu'un seul type
nouveau**, `ReaderStatement`. Créer trois familles neuves parce que la doctrine en nomme trois
dupliquerait deux contrats déjà écrits, et laisserait un futur-moi devant deux définitions du projet
et deux définitions de la sélection DPE. La doctrine a trois natures, le code en gagne une.

Autres choix sains à préserver : `report_context` ancré `(user_id, insee)` avec sa raison écrite dans
la migration ; l'anti-contamination de `synthesize-quartier` (`relation === "current_residence" ?
shapeWorkbook(...) : null`) ; `synthesis-guardrails.ts` comme filet de sortie assumé.

---

## 2. Dette en temps de reprise, hiérarchisée, avec le tri volontaire / subie

### D1. Trois vocabulaires pour les mêmes quatre réponses (SUBIE, gravité maximale)

Le lecteur clique « Non, cela se ressent déjà fortement » (`QuartierWorkbook.tsx:73`). Le code
enregistre `shelter: "fragilise"`. Puis :

- `ask/route.ts:495` en fait « **le territoire** montre déjà ses limites » ;
- `synthesize-quartier/route.ts:190` en fait « **Le quartier** souffre nettement pendant les fortes
  chaleurs ».

Trois formulations, deux échelles géographiques différentes (territoire contre quartier, ce qui
contredit frontalement `doctrine/data.md`), et **aucune** ne reproduit ce que le lecteur a réellement
lu. La faute d'Ask citée dans la commande n'est donc pas un incident isolé : elle est **déjà
dupliquée**, avec dérive de sens entre les deux copies.

Coût à la reprise : pour répondre à « que dit-on au modèle quand quelqu'un répond X ? », un futur-moi
doit ouvrir trois fichiers dans trois dossiers, et il n'obtient pas une réponse mais trois. Toute
correction faite dans l'un ne se propage pas à l'autre. C'est le mode de panne exact décrit dans
`AGENTS.md` (« un seuil qui devient conditionnel rend conditionnel tout ce qui le cite »).

### D2. Le marqueur « je ne sais pas » est perdu, la réponse inventée est conservée (SUBIE)

`WIZARD_SKIP_DEFAULTS` (`types.ts:29-34`) écrit `logement: {type:"appartement", age:"middle"}`,
`metier: "Services / Numérique"`, `mobilite: "mixte"` quand le lecteur **passe** l'étape. Le fait
qu'il l'ait passée vit dans `unknownAnswers`, qui reste côté client :
`WizardAnswersSync.tsx:25` ne persiste que `answers`.

Le produit stocke donc, sous le nom du lecteur, une réponse **qu'il n'a pas donnée**, et perd la seule
information honnête (« il ne sait pas »). C'est l'exact inverse de la règle du brief : « cette réponse
se stocke, elle vaut réponse donnée ». La dette n'est pas théorique : elle est déjà en base.

### D3. `workbook_quartier` est un blob client non validé qui atteint un prompt (SUBIE, sécurité)

`profile/route.ts:104-107` n'exige qu'« un objet ». `ask/route.ts:507-512` fait
`HEAT_LABELS[workbook.heat] ?? workbook.heat` : une valeur inconnue **passe telle quelle**, et
`workbook.note` est injectée brute. Un client peut donc PATCHer une chaîne arbitraire qui atterrit
dans le message envoyé à Claude, sans locuteur, sans borne de longueur, mélangée aux faits sourcés.
Ce n'est pas seulement un problème de doctrine d'attribution, c'est une surface d'injection.

### D4. `workbook_quartier` n'a pas d'ancre, et Ask l'injecte partout (SUBIE)

La colonne vit sur `user_profiles`, donc sur le compte, sans code INSEE. `ask/route.ts:631,661` pose
`profileText` dans le prompt **après** le contrôle de droit sur `askInsee`, mais sans jamais comparer
le workbook à la commune interrogée. Quelqu'un qui habite Lille et pose une question sur Bordeaux
reçoit une réponse construite sur « Cadre de vie estival : le territoire montre déjà ses limites ».
La garde d'anti-contamination que `synthesize-quartier` applique explicitement est **absente** d'Ask.
`report_context` a été créé pour fermer exactement cette faille (« c'est ce qui empêche une
observation/saisie de contaminer une autre commune », `16_report_context.sql`), et la variante
résidence n'a jamais été migrée : la migration le dit elle-même.

### D5. Quatre magasins pour la même nature de donnée (MI-VOLONTAIRE)

`user_profiles.workbook_quartier`, `terrain_observations`, `user_profiles.wizard_answers`,
`report_context.discovery_workbook`. La double écriture workbook/terrain_observations est
**assumée et documentée** dans `11_terrain_observations.sql` (compatibilité + préparation d'une
agrégation future) : je ne la traite pas comme une faute. Ce qui l'est, c'est qu'aucun de ces quatre
magasins ne porte le texte de la question ni le libellé de la réponse, donc qu'aucun ne peut être lu
honnêtement six mois plus tard sans retrouver la version du composant qui l'a produit.

### D6. Ce qui est VOLONTAIRE, et qu'il ne faut pas toucher

- La double écriture ci-dessus, tant que l'agrégation n'existe pas.
- `wizard_answers` en `sessionStorage` puis poussé à la première page authentifiée : le wizard tourne
  en anonyme sur la home, il n'y a pas d'alternative serveur, et le commentaire l'explique.
- L'absence de `server-only` dans `src/lib/decision/` : contrainte assumée pour rester testable sous
  `node --test`, écrite dans `decision-artifact.ts:15`.
- `src/lib/decision/` à cent fichiers : c'est de la densité, pas du désordre ; chaque fichier a son
  test à côté.

---

## 3. Question 1 · Où vivent ces types

**Réponse : `src/lib/reader/`, séparé, et pour une raison mécanique, pas esthétique.**

L'interdit central du contrat (« un ReaderStatement ne devient jamais un DecisionFact ») doit être
**vérifiable par une machine**. Dans deux dossiers distincts, il s'écrit en une ligne :

> aucun fichier de `src/lib/decision/` n'importe `src/lib/reader/statement.ts`.

C'est un test de dix lignes, du même genre que `code-mort.test.ts`. Dans le même dossier, le même
interdit ne peut être qu'un commentaire, et un commentaire ne tient pas six mois.

Le second argument est le nom du voisinage. `src/lib/decision/` porte une convention explicite :
`*-facts.ts` produit des faits, `*-rules.ts` produit des règles, `decision-assembler.ts` les
rassemble. Poser `reader-statement.ts` au milieu de ce dossier, c'est garantir que le geste naturel
d'un futur-moi sera d'écrire `reader-rules.ts`, puis de brancher la sortie sur l'assembleur. La
structure suggérerait la conversion que la doctrine interdit.

**Sens de dépendance à figer, et il n'est pas symétrique :**

```
src/lib/reader/statement.ts        (nouveau, PUR)
  ↑ importé par : src/lib/server/reader-apports.ts, les routes IA
  ↓ n'importe : rien du produit

src/lib/decision/                  → NE DOIT JAMAIS importer src/lib/reader/statement.ts
src/lib/decision/decision-fact.ts  → importe UserProject (src/lib/user-project.ts). C'EST LÉGITIME.
```

Ce dernier point est important et empêche une erreur de symétrie : `ReaderContext` gouverne la
hiérarchie et la posture, donc le moteur **doit** le lire, et il le lit déjà
(`decision-fact.ts:5`). Si on déplaçait `UserProject` dans `src/lib/reader/`, l'interdit d'import
deviendrait infalsifiable (le moteur importerait le dossier interdit pour une bonne raison), et on
paierait un renommage transverse pour zéro gain de comportement.

**Donc : ne pas déplacer `user-project.ts`. Ne pas déplacer les champs DPE.** `src/lib/reader/`
n'accueille que ce qui est interdit au moteur. Un `README` de trois lignes dans le dossier dit où
vivent les deux autres natures, et pourquoi elles n'ont pas déménagé. La doctrine à trois natures est
donc documentée en un endroit, incarnée en trois, et c'est le bon compromis solo.

---

## 4. Question 2 · La forme exacte des types

```ts
// src/lib/reader/statement.ts
// CE QUE LE LECTEUR DIT DU MONDE. Lib PURE : aucun `server-only`, aucune I/O, aucun import de
// `src/lib/decision/`. Cette dernière interdiction est vérifiée par `frontiere.test.ts` : un
// ReaderStatement ne doit jamais pouvoir devenir un DecisionFact.

/**
 * DE QUOI LA DÉCLARATION PARLE, et c'est le champ qui gouverne tout le reste.
 *
 *   place_attribute  — décrit le LIEU ou le bien : « mon logement est traversant ».
 *                      Peut servir de facteur de lecture (thermal-evidence), toujours attribué.
 *   self_experience  — décrit ce que le LECTEUR a vécu : « j'ai mal dormi pendant la canicule ».
 *                      Ne peut JAMAIS servir de facteur de lecture du lieu. Ancre une posture.
 */
export type ReaderStatementObject = "place_attribute" | "self_experience";

/**
 * À QUOI LA DÉCLARATION SE RATTACHE. Union, jamais deux champs optionnels côte à côte :
 * « INSEE ou dossier, jamais les deux indistinctement ». Un `insee?: string` plus un
 * `dossierId?: string` autoriserait les deux à la fois, et zéro des deux.
 */
export type ReaderAnchor =
  | { kind: "commune"; insee: string }
  | { kind: "dossier"; dossierId: string };

/**
 * LA RÉPONSE DONNÉE. « Je ne sais pas » est une VARIANTE de réponse, jamais un champ vide :
 * sans cette variante, l'écran redemande indéfiniment ce que le lecteur a déjà dit ignorer,
 * et rien ne distingue « il ignore » de « on ne lui a pas demandé ».
 *
 * `label` porte TOUJOURS le libellé EXACT que le lecteur a lu au moment du clic, y compris pour
 * `unknown` (« Je ne sais pas », « Je préfère ne pas répondre » : ce ne sont pas la même phrase).
 */
export type ReaderAnswer =
  | { kind: "choice"; code: string; label: string }
  | { kind: "free_text"; text: string }
  | { kind: "unknown"; label: string };

export type ReaderStatement = {
  /** Discriminant de nature. Rend le type reconnaissable à l'exécution et dans un dump JSON. */
  readonly kind: "reader_statement";

  /** IDENTITÉ DE LA QUESTION, stable : ne se réutilise jamais pour une autre question. */
  questionId: string;
  questionVersion: number;

  /**
   * LE TEXTE EXACT DE LA QUESTION AU MOMENT DE LA SAISIE, figé dans la ligne.
   * C'est ce champ qui rend la déclaration lisible six mois après une refonte du composant :
   * sans lui, `shelter: "fragilise"` n'a plus de sens dès que la question a bougé.
   */
  questionText: string;

  answer: ReaderAnswer;
  object: ReaderStatementObject;
  anchor: ReaderAnchor;

  /** Horloge SERVEUR, ISO. Jamais l'horloge du navigateur (patron `UserProject.updatedAt`). */
  statedAt: string;

  /** LOCUTEUR FERMÉ. Un seul membre : le jour où il en aurait deux, ce n'est plus ce contrat. */
  speaker: "reader";
};
```

**Ce que je retire volontairement du type, et c'est un désaccord argumenté avec la commande** (voir
aussi la section 8) : les champs `usage autorisé` et `obligation d'attribution` ne sont **pas**
stockés. Ils se **dérivent** de `object`, par une fonction pure :

```ts
export type ReaderUsage =
  | "posture"          // gouverne le ton, la hiérarchie, la sélection
  | "lecture_facteur"  // peut entrer comme facteur dans une lecture (thermal-evidence)
  | "citation";        // peut être cité à l'écran ou dans un texte, TOUJOURS attribué

/**
 * LES USAGES AUTORISÉS SE DÉDUISENT DE L'OBJET, ils ne se stockent pas.
 * Raison, et c'est la leçon d'`AGENTS.md` : un champ pré-calculé est une décision figée qui se
 * déguise en donnée. Le jour où la doctrine d'usage évolue, un champ stocké continuerait de
 * répondre à l'ancienne question sur toutes les lignes déjà écrites, en silence.
 */
export function usagesAutorises(s: ReaderStatement): readonly ReaderUsage[] {
  return s.object === "place_attribute"
    ? ["posture", "lecture_facteur", "citation"]
    : ["posture", "citation"]; // une self_experience ne lit jamais le lieu
}

/** L'attribution est obligatoire pour TOUT ReaderStatement. Une constante n'est pas un champ. */
export const ATTRIBUTION_OBLIGATOIRE = true as const;
```

**L'invariant de non-réponse, à écrire une fois et à ne jamais contourner** : un `ReaderStatement`
**existe si et seulement si** le lecteur a répondu. Il n'y a pas de `answer: null`, pas de
`ReaderStatement` partiel. Une question non posée ou non répondue est **l'absence de ligne**. C'est
ce qui rend `WIZARD_SKIP_DEFAULTS` structurellement impossible à reproduire : il n'existe pas de
forme valide pour « réponse par défaut fabriquée par le produit ».

**Le constructeur canonique** (seul chemin de création) :

```ts
export type ReaderAnswerInput = { questionId: string; code: string } | { questionId: string; text: string };

/**
 * SEUL CHEMIN DE CRÉATION D'UN ReaderStatement. Il ne reçoit JAMAIS un statement déjà construit :
 * il reçoit une réponse BRUTE (un identifiant de question + un code, ou un texte), et il va
 * chercher lui-même la version, le texte de la question, le libellé du choix et l'objet dans le
 * REGISTRE (`questions.ts`). Un client ne peut donc ni inventer un libellé, ni mentir sur l'objet,
 * ni antidater.
 *
 * Rend `null` (jamais une exception, jamais un statement dégradé) si la question est inconnue ou
 * si le code n'appartient pas à ses options : le patron de `normalizeUserProjectInput`.
 */
export function construireStatement(
  brut: ReaderAnswerInput, anchor: ReaderAnchor, nowIso: string,
): ReaderStatement | null;
```

**Le registre des questions** :

```ts
// src/lib/reader/questions.ts — LA SEULE DÉFINITION DES QUESTIONS DU PRODUIT.
// Les composants d'écran LISENT ce registre pour s'afficher. C'est ce qui garantit que le libellé
// stocké est celui que le lecteur a vu : ils ne peuvent pas diverger, ils n'ont qu'une source.
export type QuestionOption = { code: string; label: string };

export type ReaderQuestion = {
  id: string;
  version: number;
  /** La plus ancienne version dont les réponses COMPTENT ENCORE. Voir la section « versionnement ». */
  minUsableVersion: number;
  text: string;
  object: ReaderStatementObject;
  options: QuestionOption[];
  /** Le libellé EXACT du refus proposé, ou `null` si la question n'en propose pas. */
  unknownLabel: string | null;
  /** Ancrage attendu : une question sur le quartier vécu n'a pas de sens sans commune. */
  anchorKind: ReaderAnchor["kind"];
};

export const QUESTIONS: Record<string, ReaderQuestion>;
```

**Persistance.** Une table unique `reader_statements`, colonnes miroir des champs ci-dessus, RLS par
`user_id` sur le modèle de `terrain_observations`, plus une contrainte d'unicité
`(user_id, question_id, anchor_kind, anchor_key)` pour la réponse **courante**. Ne pas historiser
tout de suite : `terrain_observations` a déjà pris cette décision (index unique, historisation
« prévue, non activée ») et six mois plus tard personne n'en a eu besoin.

---

## 5. Question 3 · Rendre la faute d'Ask structurellement inécrivable

**Réponse courte : le sérialiseur unique ne suffit pas, et ce n'est même pas le levier principal.
Le levier principal est de supprimer la matière première de la faute.**

La faute d'Ask a une condition d'existence précise : un **code opaque** (`"fragilise"`) arrive dans
une route, et la route doit bien le rendre lisible au modèle. La table de traduction n'est pas une
négligence, c'est la **réponse rationnelle** à un code nu. Tant que le code nu voyage, quelqu'un
réécrira une table, et il la réécrira différemment (c'est déjà arrivé deux fois).

Si la route reçoit un `ReaderStatement` qui porte déjà `questionText` et `answer.label`, il ne reste
**rien à traduire**. La faute devient non pas interdite, mais sans objet. C'est le seul mécanisme de
cette liste qui agit sur la cause.

### Les cinq options, leur portée réelle, leur coût

| # | Option | Ce qu'elle bloque vraiment | Ce qu'elle ne bloque pas | Coût |
|---|---|---|---|---|
| A | Convention + commentaire de prompt | rien | tout | 0 ; **déjà démenti** deux fois (audit du 11/08, et les deux tables workbook divergentes) |
| B | Constructeur canonique + registre (supprime le code nu) | la traduction, faute d'objet à traduire | l'accès direct à `profile.workbook_quartier` en contournant le constructeur | 3 à 4 h (types + registre + réécriture des 4 libellés) |
| C | Type opaque de sortie du sérialiseur | écrire un objet fabriqué à la main dans l'emplacement réservé du payload | ajouter un AUTRE champ à côté | 1 h |
| D | Test qui lit le source des routes | la mention d'un champ brut connu hors du module autorisé | l'aliasing, une colonne créée demain et non enregistrée | 1 à 2 h |
| E | Règle ESLint dédiée | idem D, à l'édition | idem D | **déconseillé** : nouvelle dépendance, fichier de règle à maintenir, et la config lint n'est pas un endroit que le porteur relit |

**Combinaison recommandée : B + C + D.** B est le fond, C ferme la porte d'entrée du payload, D
attrape le contournement. Une demi-journée pour les trois, avec un ordre : B d'abord (sans lui, C et
D protègent un contrat qui n'existe pas).

### Le type opaque, concrètement

```ts
// src/lib/reader/serialize.ts — LE SEUL MODULE AUTORISÉ À METTRE UN APPORT DANS UN PAYLOAD IA.
declare const APPORT: unique symbol; // NON EXPORTÉ : rien hors de ce fichier ne peut fabriquer la marque.

export type BlocApportsLecteur = {
  readonly [APPORT]: true;
  readonly locuteur: "lecteur";
  readonly attribution_obligatoire: true;
  readonly declarations: readonly {
    question: string;   // questionText, tel quel
    reponse: string;    // label / text / unknownLabel, tel quel
    porte_sur: ReaderStatementObject;
  }[];
};

export function serialiserApports(statements: readonly ReaderStatement[]): BlocApportsLecteur | null;
```

Chaque payload de route déclare alors un emplacement typé et unique :

```ts
const payload = {
  /* ...faits sourcés... */
  apports_du_lecteur: blocOuNull,   // type : BlocApportsLecteur | null
};
```

TypeScript refuse à la compilation tout objet écrit à la main dans cet emplacement, puisque la marque
`unique symbol` n'est pas constructible hors du module. Coût d'exécution : nul.
`JSON.stringify` ignore la clé symbole, donc le payload envoyé au modèle reste propre.

**Limite honnête, à écrire dans le commentaire du module** : la marque protège **l'emplacement**, pas
le payload. Rien n'empêche techniquement d'ajouter `note_libre: workbook.note` trois lignes plus bas.
C'est exactement le trou que D ferme, et c'est pourquoi B + C sans D reste une convention avec un
type dessus.

---

## 6. Question 4 · Quelle forme de test attrape vraiment une régression

### Pourquoi un test qui lit le source n'est pas un pis-aller ici

Deux contraintes du dépôt, vérifiées :

1. `src/lib/**` est pur pour rester chargeable sous `node --test` ; un module `server-only` casse le
   chargement (`decision-artifact.ts:15,356`, et la leçon du 12/08 dans `decision-artifact.test.ts:245`
   où **vingt tests passaient à côté** d'un blocage complet parce que la logique vivait dans un module
   `server-only`).
2. Les routes utilisent l'alias `@/lib/...` (`tsconfig.json` `paths`), que `node --test` ne résout
   pas : tous les tests existants importent en relatif avec l'extension `.ts`.

Une route n'est donc **pas importable** dans un test. Le test qui lit le source n'est pas un choix de
confort, c'est le seul instrument qui atteint la zone où la régression se produit. Et le dépôt a déjà
posé ce précédent deux fois : `code-mort.test.ts` parcourt tout `src/`, `evidence-targets.test.ts:33-34`
lit des `.tsx` de `src/components`.

### La forme qui tient, en trois tests

**Test 1 (pur, le plus fort) : le sérialiseur n'invente aucun mot.**

```
Pour tout ReaderStatement construit depuis le registre, chaque chaîne du bloc sérialisé appartient à
l'ensemble { questionText, answer.label, answer.text, unknownLabel, les clés structurelles fixes }.
```

C'est l'assertion qui décrit la faute d'Ask en une ligne. Elle est **purement unitaire**, tourne sans
I/O, ne casse pas au renommage d'un fichier, et échoue au premier `LABELS[code]` réintroduit dans le
chemin canonique. C'est le test à écrire en premier, avant même la table.

**Test 2 (source, l'anti-contournement) : les champs bruts ne sont nommés qu'à un endroit.**

```
Corpus : src/app/api/**/route.ts + src/lib/server/**.ts
Interdits : la liste des colonnes/champs d'apport, DÉRIVÉE DU REGISTRE (jamais écrite à la main).
Autorisé : src/lib/server/reader-apports.ts (le seul lecteur des colonnes), sur le modèle EXEMPTIONS
de code-mort.test.ts, chaque entrée portant sa raison écrite.
```

Point de conception load-bearing : **ce test n'est bon marché que si un seul fichier a le droit de
nommer les colonnes.** Si les routes continuent de lire `profile.workbook_quartier` pour de bonnes
raisons, la liste d'exemptions grossit, et un test dont on étend l'exemption à chaque incident est un
test mort. Le test **impose** donc la bonne structure : lecture des colonnes dans
`src/lib/server/reader-apports.ts`, routes qui n'en connaissent aucune.

**Test 3 (source, complémentaire, cinq lignes) : la frontière avec le moteur.**

```
Aucun fichier de src/lib/decision/ ne contient d'import vers "reader/statement".
```

### Ce qu'aucun de ces tests ne peut faire, à écrire dans leur en-tête

- Le test 2 est aveugle à l'aliasing (`const k = "workbook" + "_quartier"`). Acceptable : cette forme
  ne s'écrit pas par distraction, elle s'écrit pour contourner, et le contournement délibéré n'est pas
  la panne qu'on adresse en solo.
- Le test 2 est aveugle à une **colonne créée demain**. La parade est de **dériver la liste d'interdits
  du registre** : enregistrer une question inscrit automatiquement son champ dans le corpus interdit.
  C'est le seul point où un peu d'indirection est gagnée, et elle l'est parce que la panne (« on a
  ajouté une question, on a oublié le test ») est prévisible.
- Aucun de ces tests ne dit qu'un texte **produit** attribue correctement. C'est le terrain de
  `synthesis-guardrails.ts`, et le brief a raison : ses motifs ne s'écrivent pas de mémoire, ils
  s'écrivent sur des textes réellement générés. Rappel de la leçon d'`AGENTS.md` : « la carte
  apparaît » et « la carte dit vrai » sont deux assertions distinctes.

---

## 7. Question 5 · Le versionnement des questions, son coût réel

### L'ordre de grandeur, mesuré

Questions existantes : 4 (workbook quartier) + 6 (wizard) + 2 champs libres (discovery) + 4 à 6
(logement V1 du brief). Environ **quinze à vingt questions**, sur un produit dont l'auteur est seul.
Une reformulation par question tous les six à douze mois est une estimation généreuse.

À cette échelle, le coût du versionnement n'est **pas** le stockage, il est la **décision** :
« est-ce que ce changement de libellé mérite une nouvelle version, ou un nouvel identifiant ? »

### Le mécanisme le plus simple qui reste honnête

**L'archive vit dans les lignes, pas dans le registre.** Puisque chaque `ReaderStatement` fige
`questionText`, `answer.label` et `questionVersion`, on peut toujours afficher exactement ce qui a été
demandé et répondu, sans jamais consulter l'historique du registre. Le registre ne porte donc que la
question **courante**. Le contre-exemple à éviter absolument est un registre qui accumule les versions
passées : il deviendrait un musée qu'un futur-moi devrait lire en entier pour comprendre l'état
présent, et personne ne relit un musée.

**Trois règles, et c'est tout :**

1. Le **sens** change (on demande autre chose) : **nouvel `id`**. Un code ne se recycle jamais sous un
   autre sens. Les anciennes réponses restent lisibles, rattachées à une question qui n'est plus posée.
2. La **formulation** change à sens constant (typographie, clarté, une option renommée) :
   `version + 1`. Les réponses existantes restent valides et continuent de compter.
3. Une reformulation qui rend les anciennes réponses **non comparables** (le cas rare) : `version + 1`
   **et** `minUsableVersion = version`. Un seul nombre.

**Ce que fait le code face à un statement plus ancien :**

```
statement.questionVersion >= QUESTIONS[id].minUsableVersion
   → il compte, il se cite, il se lit tel quel (avec SON texte figé, jamais le texte courant).
sinon
   → archive : lisible dans « ce que vous avez indiqué », jamais un facteur de lecture,
     et la question est reposée comme si elle n'avait jamais été répondue.
```

**Coût de maintenance réel** : un champ `version` et un champ `minUsableVersion` à tenir dans un objet
littéral, plus une décision par reformulation. En pratique : deux minutes par changement de libellé,
et une vraie réflexion (dix minutes) le jour rare où le sens bouge. C'est en dessous du coût actuel,
où changer un libellé dans `QuartierWorkbook.tsx` laisse silencieusement `ask/route.ts` et
`synthesize-quartier/route.ts` raconter l'ancienne version.

**Le piège à nommer explicitement** : ne jamais réafficher une réponse ancienne avec le texte
**courant** de la question. C'est la forme la plus insidieuse du mensonge de provenance, et elle est
facile à commettre en jointant sur `questionId`. Le champ `questionText` figé n'existe que pour
interdire cette jointure ; s'il ne se lit pas à l'affichage, il ne sert à rien.

---

## 8. Question 6 · Ce que je déconseille dans ce qui précède

**8.1. Ne stockez pas `usage autorisé` ni `obligation d'attribution` sur la ligne.** Détaillé en
section 4. Un booléen à valeur unique est une constante déguisée en donnée ; un usage stocké est un
seuil figé qui survivra à sa doctrine. Dérivez de `object`.

**8.2. Le point (1) de la frontière serveur, tel qu'il est écrit, casse un parcours existant.**
« Aucune route n'accepte du navigateur un ReaderStatement déjà construit » est juste. Mais
`comparateur-vie/synthesize` et `comparateur-vie/parse` reçoivent le texte du projet **depuis le
client**, dans un parcours **anonyme** où il n'existe aucune copie serveur à relire
(`synthesize/route.ts:305-306`). Appliquée à la lettre, la règle imposerait soit de persister l'entrée
d'un visiteur non authentifié (régression de confidentialité, table nouvelle), soit de casser
`/ou-vivre`.

Reformulation qui préserve l'intention et reste implémentable :

> Une route accepte une **réponse brute** (identifiant de question + code, ou texte). Elle n'accepte
> jamais un **statement construit** (libellé, texte de question, objet, date, locuteur). Le serveur
> reconstruit toujours le statement depuis son propre registre.

La frontière tient alors sur ce qui compte : le client ne peut pas décider ce que sa réponse
**signifie**, ni de quel objet elle parle, ni quand elle a été donnée. C'est cette autorité-là qu'on
protège, et elle se protège aussi bien sur un parcours anonyme.

**8.3. Ne construisez pas un « sérialiseur unique » pour tous les payloads IA.** Il y a sept routes
qui appellent le modèle (`ask`, `synthesize-logement`, `synthesize-quartier`, quatre
`comparateur-vie/*`), avec des payloads légitimement différents. Le sérialiseur unique porte **les
apports du lecteur**, un bloc, et rien d'autre. Si ce chantier se met à normaliser les payloads
entiers, il devient un framework de prompt, et un framework de prompt maintenu par une personne est
la définition de la complexité non gagnée.

**8.4. Ne créez pas la table avant d'avoir migré le cas qui brûle.** Le risque le plus concret de ce
chantier est d'ajouter un **cinquième** magasin d'apports à côté de `workbook_quartier`,
`terrain_observations`, `wizard_answers` et `discovery_workbook`. Le contrat doit être une **cible de
migration**, pas un ajout. Ordre recommandé : le workbook quartier d'abord (quatre questions, deux
tables de traduction divergentes, une injection non ancrée, un blob non validé : tous les symptômes
sont là), le logement déclaré ensuite, une fois le patron éprouvé sur un cas réel.

**8.5. Pas de règle ESLint dédiée.** Détaillé en section 5, option E.

**8.6. Ne mettez pas les trois natures dans un même dossier par souci de symétrie.** Détaillé en
section 3. La doctrine a trois natures ; le code en a une nouvelle, deux existantes qu'il documente.

**8.7. Une chose où je recommande PLUS de complexité que le brief.** `ReaderAnchor` doit être une
**union**, pas deux champs optionnels, et le registre doit déclarer `anchorKind` par question. Sans
cela, on reproduit exactement `workbook_quartier` : un apport rattaché au compte, sans commune,
réinjecté dans une conversation sur n'importe quel territoire (D4). Le coût est de cinq lignes de
type ; la panne évitée est en production aujourd'hui.

---

## 9. Ce qui peut disparaître

- `HEAT_LABELS`, `WATER_LABELS`, `SHELTER_LABELS`, `CHANGE_LABELS` dans `ask/route.ts:485-505` :
  supprimables intégralement une fois le registre en place.
- `WORKBOOK_LABELS` et `shapeWorkbook` dans `synthesize-quartier/route.ts:175-215` : idem.
- `WIZARD_SKIP_DEFAULTS` (`wizard/types.ts:29-34`) : à supprimer, remplacé par l'absence de statement
  ou par une réponse `unknown` explicite. C'est le code qui fabrique une parole que personne n'a dite.
- `unknownAnswers` comme état client séparé : absorbé par `ReaderAnswer.kind === "unknown"`, une
  seule structure au lieu de deux qu'il faut penser à synchroniser.
- À terme et seulement à terme, la double écriture `workbook_quartier` / `terrain_observations` :
  volontaire aujourd'hui, elle n'a plus de justification une fois `reader_statements` en place. Ne
  pas la traiter dans ce chantier.

---

## 10. Performance

Rien de mesurable ici, et rien à optimiser.

Un point **structurel**, sans rapport avec la vitesse : `ask/route.ts:593` fait
`.select("*")` sur `user_profiles` et injecte l'intégralité du profil dans le prompt. Le payload IA
grandit à chaque colonne ajoutée à la table, sans qu'aucune décision ne le veuille. La doc Next
installée dit la même chose pour les Server Functions (`use-server.md:190` : « Only return data the UI
needs, not raw database records »). Une sélection nommée coûte une ligne et rend le contenu du prompt
lisible dans le code. Sans urgence, mais c'est le genre de `select("*")` qui transforme une colonne
neuve en fuite silencieuse vers un modèle.

---

## 11. Conformité à la stack

Aucun écart à ADR-0004. Pas de dépendance nouvelle, pas de service nouveau, pas de coût récurrent :
un dossier de bibliothèque pure, une table Supabase avec RLS sur le modèle de `terrain_observations`,
des tests `node --test`.

Vérification Next.js faite dans la doc **installée** (`node_modules/next/dist/docs/`, Next 16.2.4) :
`01-app/03-api-reference/01-directives/use-server.md:146-154` recommande explicitement de concentrer
validation et autorisation dans une couche d'accès unique. Le constructeur canonique et le lecteur
unique de colonnes sont l'application de ce conseil, pas une invention maison.

---

## 12. Ce que cette architecture rend FACILE / DIFFICILE à changer

**Facile :**

- Ajouter une question. Une entrée dans le registre, et elle est automatiquement stockable,
  sérialisable, attribuée, et protégée par le test 2 (qui dérive sa liste du registre).
- Reformuler une question sans perdre l'ancien sens : `version + 1`, les lignes existantes restent
  lisibles avec leur texte d'origine.
- Ajouter une échelle. `ReaderAnchor` est une union ouverte : un troisième ancrage (IRIS, quartier)
  s'ajoute sans toucher aux statements existants.
- Répondre à un lecteur qui demande ce qu'il a déclaré, ou à une obligation RGPD d'export : une table,
  une clause `where`, des lignes auto-descriptives.
- Supprimer un usage de l'IA. Le bloc est un emplacement unique et typé ; le retirer est une ligne.

**Difficile, et il faut le savoir avant de commencer :**

- Passer de la réponse **courante** à un **historique** de réponses. La contrainte d'unicité
  `(user_id, question_id, anchor)` la bloque, et tout ce qui lit supposera « une réponse par
  question ». C'est le même choix que `terrain_observations` a déjà fait, en connaissance de cause.
- **Agréger** les déclarations entre lecteurs (l'« intelligence territoriale collective » évoquée dans
  `11_terrain_observations.sql`). La doctrine l'interdit explicitement (« jamais agrégé, jamais montré
  à un autre lecteur »), et le contrat la rend techniquement pénible. C'est cohérent, et c'est un
  **verrou volontaire** : si cette piste produit revient, ce n'est pas une évolution du contrat, c'est
  un autre contrat, avec son propre consentement et sa propre doctrine.
- Faire d'une déclaration une **preuve**. C'est l'objectif, et le test 3 le cimente.
- Poser une question dont la réponse **n'est pas** rattachable à une commune ou à un dossier (une
  préférence générale sur soi). L'union `ReaderAnchor` l'exclut. Si ce cas apparaît, il faudra
  trancher : ou bien c'est un `ReaderContext` (donc `UserProject`), ou bien l'ancre gagne une variante
  `{ kind: "account" }`. Ma lecture est que le premier cas est le bon, et c'est ce qui justifie que
  l'union reste étroite aujourd'hui.

---

## 13. Les paris de cette architecture, et leurs seuils de bascule

| Pari (hypothèse implicite) | Seuil où il casse | Ce qu'il faudrait alors |
|---|---|---|
| **Le nombre de questions reste petit** (~15 à 30) | au-delà d'une **cinquantaine** de questions, le registre en objet littéral devient illisible et le choix des questions à poser devient un problème en soi | un registre par domaine (`questions/logement.ts`, `questions/territoire.ts`), et une logique de sélection des questions à poser, qui n'existe pas aujourd'hui |
| **Une seule réponse courante par (question, ancre)** | le jour où « ce que je disais en 2026 » a une valeur produit, ou où une question devient saisonnière | lever l'unicité, historiser par `statedAt`, et arbitrer partout « la dernière » contre « toutes » |
| **La déclaration ne se partage jamais** | partage d'un dossier d'adresse entre deux personnes (`address_dossier_members`, déjà envisagé en mémoire) | le locuteur `"reader"` cesse de suffire : il faut identifier **quel** lecteur, et l'attribution devient nominative |
| **Un statement se lit toujours seul** | une lecture qui croise deux déclarations (« traversant » ET « volets ») pour produire un facteur composé | c'est déjà le patron `fact-composition.ts` du moteur ; il faudrait son équivalent côté lecture, hors `decision/` |
| **Les libellés du registre sont ceux affichés** | le jour où un écran a besoin d'un libellé plus court que celui du registre (contrainte de place, mobile) | la divergence recommence. Parade préventive : `label` (canonique, stocké) et `labelCourt` (affichage seul, jamais stocké), avec un test que le second n'atteint jamais un statement |
| **`object` à deux valeurs suffit** | une déclaration qui décrit ni le lieu ni le vécu, par exemple une intention (« je compte isoler l'an prochain ») | troisième membre de l'union, et surtout une troisième colonne d'usages ; le signal d'alerte est une **quatrième** valeur, qui indiquerait qu'`object` mélange deux axes |
| **Le contrôle du texte produit reste faisable par motifs** | si les familles d'attribution dépassent une **quinzaine de motifs** ou produisent des faux positifs répétés | il faut refuser de générer plutôt que de filtrer, comme `generable: false` le fait déjà ailleurs |

---

## 14. Verdict

**À AJUSTER**, avec une nuance qui compte : le contrat proposé est **plus sain que ce qu'il remplace**,
et sa complexité est **gagnée**, prouvée par quatre pannes présentes dans le code aujourd'hui (D1 à
D4). Ce n'est pas une abstraction anticipée.

Ce qui compte, par ordre :

1. **Supprimer les tables de traduction** en faisant voyager le libellé, plutôt que de les interdire.
   C'est le fond ; tout le reste est un filet.
2. **Ancrer** chaque apport (union, pas deux champs optionnels). Panne active aujourd'hui.
3. **Stocker « je ne sais pas »** et supprimer `WIZARD_SKIP_DEFAULTS`. Panne active aujourd'hui.
4. **Un seul lecteur des colonnes** (`src/lib/server/reader-apports.ts`), sans quoi le test de
   frontière meurt d'exemptions.
5. Le type opaque et le test source : peu coûteux, à faire, mais après les quatre points ci-dessus.

Le détail (nom exact des fichiers, forme de la table) est secondaire et se tranche en écrivant.

---

## 15. Cohérence : les tensions que je ne tranche pas

- **`workbook_quartier` non ancré est une panne en production** (D4). Ce chantier la corrige par
  ricochet, mais elle vaut peut-être un correctif immédiat, indépendant, avant la conception. Ce
  n'est pas à moi d'arbitrer la priorité de livraison.
- **La double écriture workbook/terrain_observations** a été posée pour préparer une agrégation, que
  la doctrine des apports interdit désormais (« jamais agrégé »). Deux intentions coexistent dans le
  dépôt. Le porteur doit dire laquelle survit ; le code ne peut pas le deviner.
- **`report_context.discovery_workbook`** est déjà un apport ancré à la commune, correctement. Il
  devrait sans doute être le **premier** migré vers le contrat, ou déclaré exemplaire et laissé tel
  quel. Je ne tranche pas.
- **Le brief dit « la déclaration périme l'artefact »** (question ouverte 3, leçon du 19/08). Le
  contrat des statements ne dit rien de `dpe_selection_at` ni de `needsRecompute`. C'est une frontière
  à instruire dans le chantier logement, pas ici, mais elle ne doit pas se perdre.

---

## 16. Décision à graver (prête pour un ADR)

> **La parole du lecteur voyage avec sa question.**
> Toute information entrée par un lecteur et destinée à traverser une lecture, un texte affiché ou un
> payload IA est stockée avec le texte exact de la question posée, le libellé exact de la réponse
> choisie, son objet (décrit le lieu / décrit le vécu) et son ancrage (commune ou dossier, jamais les
> deux). Aucun code de réponse ne circule seul : un code nu oblige son lecteur à le traduire, et une
> traduction est une reformulation que le produit s'interdit. Les usages autorisés se dérivent de
> l'objet, ils ne se stockent pas. « Je ne sais pas » est une réponse donnée, jamais un champ vide.
> Le contrat vit dans `src/lib/reader/`, hors de `src/lib/decision/`, et l'absence d'import du second
> vers le premier est vérifiée par un test.

---

## 17. La version minimale (~90 % de la valeur)

**Un fichier de registre et une fonction de sérialisation, appliqués aux quatre questions du
workbook, sans table nouvelle.**

1. `src/lib/reader/questions.ts` : les 4 questions du workbook quartier, texte exact recopié depuis
   `QuartierWorkbook.tsx:44-84`, options avec leurs libellés exacts, `object`, `anchorKind: "commune"`.
2. `src/lib/reader/statement.ts` : les types + `construireStatement`, pur.
3. `src/lib/reader/serialize.ts` : `serialiserApports`, type opaque.
4. `src/lib/reader/serialize.test.ts` : le **test 1** (le sérialiseur n'invente aucun mot).
5. Branchement : `ask/route.ts` et `synthesize-quartier/route.ts` construisent leurs statements depuis
   la colonne existante et le registre, puis appellent le sérialiseur. Les huit tables de libellés
   sont supprimées.

Ce qui est **hors** de cette version minimale, volontairement : la table `reader_statements`, la
migration des quatre magasins, le wizard, les caractéristiques logement, la famille de garde-fou sur
le texte produit, le test source. La valeur du contrat se démontre sur quatre questions et deux
routes. Si le patron ne convainc pas là, il ne convaincra pas plus grand.

Le périmètre de cette recommandation s'arrête ici : la décision de la lancer, son ordre et son
intégration reviennent au porteur et à l'orchestrateur.

---

## 18. Quand rouvrir ce sujet

Signaux qui doivent me faire changer d'avis, dans un sens ou dans l'autre :

- **Le registre dépasse ~50 questions** ou un fichier de plus de 500 lignes : le pari « un seul
  registre » tombe, il faut le découper par domaine.
- **La liste d'exemptions du test source dépasse trois entrées** : le test est devenu décoratif, la
  structure « un seul lecteur de colonnes » n'a pas tenu. Supprimer le test plutôt que l'étendre.
- **Un partage de dossier entre deux personnes est décidé** : `speaker: "reader"` cesse de suffire, le
  contrat doit être rouvert avant l'implémentation du partage, pas après.
- **Une déclaration doit devenir une preuve** dans un cas réel que je n'ai pas anticipé : ce serait un
  arbitrage de fond (invariant n°3), qui remonte au porteur et pas au code.
- **Un texte généré attribue mal malgré le bloc séparé**, observé sur des sorties réelles : la famille
  de garde-fou devient prioritaire sur tout le reste de ce chantier, et ses motifs s'écrivent sur ces
  textes-là.
- **Un troisième `object` apparaît** (une intention, un engagement) : vérifier avant de l'ajouter que
  `object` ne mélange pas deux axes distincts (de quoi ça parle / quelle force ça a).
- **Six mois passent sans qu'aucune question ne soit reformulée** : alors `version` et
  `minUsableVersion` sont de la cérémonie, et il faut se demander honnêtement s'ils gagnent leur place
  (mon pari est qu'ils la gagnent par le seul fait de figer le texte dans la ligne, même sans bump).

---

## 19. Limites de mon regard sur CE run

- **Je n'ai rien exécuté.** Pas de `node --test`, pas de build, pas de requête Supabase. Tous les
  comportements décrits sont lus dans le source, aux lignes citées, jamais observés à l'exécution.
- **Je n'ai pas vu la base.** Je ne sais pas combien de lignes existent réellement dans
  `terrain_observations`, `report_context`, ni combien de profils portent un `workbook_quartier`. Le
  coût de migration que j'estime « faible » suppose un volume faible, ce qui est vraisemblable sur un
  produit sans vente B2C réelle, et que je n'ai pas vérifié.
- **Je n'ai pas lu les sept routes IA en entier.** J'ai lu `ask` et `synthesize-quartier` en détail,
  `synthesize-logement` et les quatre `comparateur-vie/*` seulement par grep ciblé. Il peut exister un
  cinquième chemin d'apport que je n'ai pas vu, en particulier dans `synthesize-logement`, qui est le
  plus gros fichier de la famille.
- **Je n'ai pas mesuré la performance**, j'ai raisonné : le point sur `select("*")` est un jugement
  structurel, pas une mesure de payload.
- **Je n'ai pas éprouvé le type opaque** dans ce dépôt : `unique symbol` non exporté fonctionne en
  TypeScript 5 et le dépôt est en `strict`, mais je n'ai pas compilé un exemple. Si la marque gêne un
  `JSON.stringify` typé ou une sérialisation vers un composant client, il faudra la déplacer d'un cran.
- **Je n'ai pas jugé la valeur produit** de ce que les questions demandent. Faut-il poser la question
  du logement traversant ? Faut-il en poser quatre ou dix ? C'est le terrain du Product Strategist ;
  je n'ai jugé que la forme du contrat qui les porte.

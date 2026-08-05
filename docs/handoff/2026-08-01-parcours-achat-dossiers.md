# Passation — 2026-08-01, branche `main`

**Horodatage** : 2026-08-01, 10 h 55 · **Branche** : `main` = `efedfd4`, plus le lot D1/D2 non
commité. Le handoff précédent est archivé sous
`docs/handoff/2026-07-30-parcours-achat-production.md`.

> ⚠ **Ce fichier a été réécrit deux fois ce matin, par deux sessions.** La version de 10 h 51 était
> exacte au moment de son écriture ; celle-ci la met à jour après la vérification et quatre
> modifications supplémentaires. Si une troisième session écrit sur le même arbre de travail, relire
> `git status` avant tout `git add` : deux terminaux travaillent sur `main`.

## Objectif en cours

Réparer une promesse cassée du dossier de décision : le verdict annonçait « N autres constats
figurent dans le dossier complet » alors que `dossier.sections` n'était rendu par **aucun**
composant. Le lot livre la surface manquante (`ControlesDuDossier`), lève le plafond de la section
`verifications` pour que les nombres du verdict deviennent exacts, et fusionne les deux moteurs qui
décidaient séparément quels gestes proposer.

**Le travail est fait et VÉRIFIÉ** : `1 201` tests passent, `tsc --noEmit` est muet, `eslint` est
propre sur les fichiers touchés, `npm run build` sort en code 0 sur le lot non commité. Il reste à
**committer**.

---

## Fait dans cette session

### Audits et spec écrits (non suivis par git)

- `docs/audits/2026-07-30-tableau-des-capacites.md` — la chaîne
  fetchée → affichée → règle → oriente → geste, famille par famille, sur les trois grains. Met à
  jour le §4.4 et le §6 de `docs/cadrage-sources-par-echelle.md`, périmés sur trois points (confort
  d'été et radon branchés depuis, IREP débranché). Y figure aussi le constat que `zfe` et
  `cartofriches` sont fetchés, transportés dans `LogementReport` et lus par **rien**.
- `docs/superpowers/specs/2026-08-01-controles-du-dossier-design.md` — la spec du lot.
  ⚠ **Son §6 est faux**, voir « Décisions » ci-dessous.

### Code non commité : 9 fichiers modifiés, 1 nouveau

| Fichier | Changement |
|---|---|
| `decision-assembler.ts` | Plafond de la section `verifications` passé à `Number.POSITIVE_INFINITY` ; `labels()` gagne `controlesTitle` |
| `decision-fact.ts` | `Dossier.controlesTitle` et `Dossier.absorbedFacts` |
| `dossier-view.ts` | `controlesParEchelle(dossier)`, le groupement des contrôles par échelle |
| `echelles.ts` | `NOM_ECHELLE`, `ORDRE_ECHELLES`, et le piège de vocabulaire gravé en commentaire |
| `conclusion-plan.ts` | « figurent dans le dossier complet » devient « figurent plus bas » |
| `ControlesDuDossier.tsx` | **nouveau fichier**, la surface, `id="controles"` |
| `rapport/page.tsx`, `DossierAvecLogement.tsx` | Rendu de la liste, y compris dans le repli Suspense et dans la branche commune seule |
| `decision-assembler.test.ts`, `conclusion-plan.test.ts` | Tests du groupement, du titre par posture, du cas vide, du fait sans échelle |

### Ajouté après la version de 10 h 51 de ce fichier

| Fichier | Changement |
|---|---|
| `conclusion-plan.ts` | `ConclusionNarrativePlan.controles` **exposé** : l'invariant « le lecteur compte les cartes et retombe sur le chiffre » se teste sur `visibles + enPlus`, pas sur une phrase. Les deux commentaires périmés (fil ouvert n° 4) sont corrigés. |
| `decision-assembler.test.ts` | 11 contrôles rendent 11 cartes ; `visibles + enPlus === reservesCount` sur 0/1/4/11 ; la minute reste ≤ 4 ; les cinq autres sections gardent leur plafond ; groupement par échelle ; fait sans échelle ; titre par posture |
| `echelles.test.ts` | Le piège de vocabulaire épinglé : `NOM_ECHELLE.quartier === "Autour de l'adresse"`, et toute échelle nommée a une place dans `ORDRE_ECHELLES` |
| `DossierAvecLogement.tsx` | Le JSX **sort du `try/catch`** : React ne rend pas au moment où le JSX est construit, donc le `catch` ne pouvait pas attraper ce qu'il promettait. Erreur `react-hooks/error-boundaries` **préexistante**, corrigée au passage. |
| `DossierDecisionSection.tsx` | Le commentaire « le dossier complet reste dans `dossier.sections` » dit maintenant où ses contrôles se lisent. |

### Commits faits, non poussés

- `efedfd4` — **D3 résolu**. `logement-coverage.ts` (pur, 10 tests) et `logement-verifications.ts`
  (pur, 16 tests) remplacent trois dérivations parallèles. `logement-checklist.ts` perd ses 86 lignes
  de table d'activation. 1 192 tests, build vert au moment du commit.
- `d9ebaff` — **le chantier SITADEL n'est PAS clos.** ⚠ Une version antérieure de ce fichier
  l'annonçait clos, sur la foi du statut COMPLET de la spec ; **le porteur a démenti le 01/08, et la
  vérification lui a donné raison**. Ce qui est livré l'est réellement : l'appel (cadastre +
  registre), le gel dans le snapshot, le bloc d'écran, les 13 fichiers, le branchement à la création
  et au rattrapage. Trois points vérifiés en réel (La Rochelle centre : 1 permis ; Paris 12e : 0 ;
  village de la Creuse : 0). **La spec s'était déclarée complète sur sa propre liste de tâches, pas
  sur l'intégration du module** : quatre points restent ouverts, listés en tête de
  `docs/superpowers/specs/2026-08-01-permis-autour-adresse-design.md`. Les deux qui comptent :
  (a) les permis ne produisent **aucun `DecisionFact`** (`decision-assembler.ts:32` le dit
  lui-même), donc ils sont absents du verdict, de la minute et de `ControlesDuDossier` — un chantier
  ouvert à 40 m est la chose la plus décisive du dossier et la seule que le moteur ignore ;
  (b) `autour-conclusion.ts` ne contient **aucune occurrence de « permis »** : la conclusion du
  module a été écrite avant ce chantier et conclut sans le bloc qui le précède à l'écran.
  Deux paramètres DiDo trouvés ce jour-là font tomber le coût : `columns=` et `AN_DEPOT=gte:`
  ramènent La Rochelle de 538 Ko à 9 Ko, Paris entier à 20 Ko, donc aucun cache n'est nécessaire.
  Deux pièges gravés : Sitadel ne connaît que les communes-mères (`75101` répond 400, il faut
  `75056`), et un `400 « Le fichier est vide »` est zéro ligne, pas une panne.

---

## Décisions prises

### Par le porteur, dans cette session

1. **Le verdict compte le total réel** des contrôles, plus les quatre rescapés du plafond. Livré
   avec la surface, jamais sans : les nombres prononcés changent sur tous les dossiers existants, et
   ce n'est honnête qu'une fois la liste lisible.
2. **La liste vit sur `/rapport`**, sous la minute. Motif : `/rapport/logement` redirige vers
   `/rapport/dossiers` sans dossier d'adresse, or les contrôles de territoire (chaleur future, feu
   futur, radon) existent sans adresse. La placer là aurait laissé la promesse sans référent pour
   les dossiers les plus pauvres.
3. **Périmètre limité au registre `verification`.** Les cinq autres registres gardent leur
   écrêtage ; `mismatchTotal` contre `mismatchShown` porte un écart de même famille, non traité.
4. **`MINUTE_MAX_CARTES = 4` ne bouge pas.** C'est le seul chiffre du projet mesuré sur l'écran
   (87 à 95 s à quatre cartes, 101 à 123 à cinq).

### Correction du design établie à l'implémentation (`efedfd4`)

> Le §6 de la spec renvoyait D3 à un chantier distinct, au motif que `LogementModule` est un
> composant client sans `Dossier`. **C'est vrai de l'ASSEMBLEUR, faux des RÈGLES** : elles sont
> pures, et il ne leur manquait que des faits. La route `/api/georisques-logement` tenait déjà, dans
> son `Promise.all`, exactement les sources que l'adaptateur du moteur re-fetchait.

Conséquence : le « verrou d'équivalence » que réclamait la spec n'a plus d'objet, il n'y a plus deux
tables à comparer. `gesteEnPhrase` prend désormais l'action d'un fait plutôt qu'une clé de geste,
sans quoi une règle portant une action inconnue de la table (le radon) n'aurait pas pu être rendue.

### Mesure qui corrige une affirmation antérieure de la session

Le confort d'été avait été annoncé comme se déclenchant sur ~26 % des dossiers. **Mauvais
dénominateur.** `docs/audits/2026-07-31-couverture-dpe-stratifiee.md` (800 adresses) établit que
**75 à 86 % des adresses n'ont aucun DPE** sur le chemin de recherche que le produit emprunte. Les
deux gestes issus du DPE se déclenchent donc sur **3,6 à 6,7 %** des dossiers.

La mesure ADEME reste juste, elle porte sur le jeu de données et non sur les adresses : sur
15 292 277 diagnostics de `dpe03existant`, 25,7 % portent une étiquette E, F ou G, et 26,6 % un
confort d'été insuffisant.

---

## État git

- Branche **`main`**, aucune PR ouverte.
- **Deux commits non poussés** : `efedfd4`, `d9ebaff`.
- **Modifié non commité** : les 9 fichiers du tableau ci-dessus.
- **Non suivi** : `src/components/report/ControlesDuDossier.tsx` (le composant central du lot, à ne
  pas oublier au `git add`), `docs/audits/2026-07-30-tableau-des-capacites.md`,
  `docs/superpowers/specs/2026-08-01-controles-du-dossier-design.md`,
  `docs/handoff/2026-07-30-parcours-achat-production.md`, `.impeccable/`,
  `Futur.e Design System.zip`.

⚠ **Deux sessions travaillent sur le même arbre `main`.** Le chantier SITADEL (`autour-*`,
`Face3Snapshot`) est désormais commité (`d9ebaff`), donc le recouvrement de fichiers est nul, mais
ce fichier de passation lui-même a été écrit par les deux ce matin. Vérifier `git status` avant tout
`git add`, et ne jamais `git add -A` à l'aveugle.

---

## Prochaine étape immédiate

**Committer le lot D1/D2.** La vérification est faite et complète : `node --test src/lib/**/*.test.ts`
rend 1 201 passés, `npx tsc -p tsconfig.json --noEmit` est muet, `eslint` est propre sur les fichiers
touchés, `npm run build` sort en code 0.

Ne pas oublier le fichier non suivi, qui est le composant central du lot :

```bash
git add src/components/report/ControlesDuDossier.tsx \
        src/lib/decision src/app "src/components/report/DossierAvecLogement.tsx" \
        docs/audits docs/superpowers/specs docs/handoff
```

Puis traiter le fil ouvert n°1, qui est le seul défaut de correction connu du lot.

---

## À lire d'abord à la reprise

1. `MEMORY.md` (chargé au démarrage), en particulier `project_dossier_decision.md` (registre de
   matérialité, régime `/rapport`) et `project_module_logement.md`.
2. `docs/superpowers/specs/2026-08-01-controles-du-dossier-design.md`, **avec la correction de son
   §6** rappelée plus haut.
3. `docs/vault/adr/ADR-0001-pas-de-score-synthetique.md` — contraint la forme de la liste : aucun
   compteur, aucune coche.
4. `docs/audits/2026-07-30-ce-que-recoit-un-acheteur.md` — ce que le dossier livre réellement, et le
   défaut plus large qui attend derrière ce lot.
5. `docs/cadrage-sources-par-echelle.md`, corrigé par
   `docs/audits/2026-07-30-tableau-des-capacites.md`.
6. `docs/handoff/AUTO-SNAPSHOT.md` — vérifier la fraîcheur mécanique.

---

## Pièges et fils ouverts

### 1. `echelleDeLaComposition` fait une hypothèse non gardée — seul vrai défaut restant

Elle élit l'échelle du **premier** fait absorbé non nul :

```ts
const parAbsorbe = absorbes.map(echelleDuFait).find((x): x is Echelle => x != null);
```

Le commentaire justifie par « ils partagent le même grain par construction du patron ». Vrai
aujourd'hui : le seul patron `grouped_verification` est `clay_regulation_grouped` (argiles + PPR,
tous deux au grain adresse). Rien ne le garantit pour un patron futur croisant les échelles, et le
classement serait alors silencieusement faux.

**Correction attendue** : rendre `null` quand les échelles des faits absorbés divergent, plutôt que
d'en élire une. Le groupe sans titre existe déjà et absorbera le cas. Deux tests : composition dont
tous les faits sont `logement` → groupe Logement ; composition territoire + logement → groupe sans
échelle.

### 2. La liste répète les cartes de la minute, dans le même rendu

`ControlesDuDossier` réutilise `FactBody`, `EvidenceRow`, `MethodDetails` et `FactCompositionCard`,
c'est-à-dire le rendu exact de la minute. Un contrôle retenu par la minute s'affiche donc **deux
fois à l'identique sur la même page**. Le code en a conscience (commentaire « un même fait peut
s'afficher aux deux endroits », d'où l'absence d'ancre dupliquée), mais la redondance visuelle n'est
pas traitée. La répétition est un choix assumé (feuille de contrôle autonome) ; sa FORME ne l'est
pas.

Piste : minute en cartes de décision, liste en lignes de contrôle plus denses, mêmes objets de
domaine, deux hiérarchies visuelles.

**Deux formes interdites, à ne pas réintroduire par inadvertance** :
- **aucune case à cocher** : ADR-0001 et le commentaire de `DecisionChecklist` (« aucun compteur,
  aucune coche verte / croix rouge, pas de score de complétude ») ;
- **aucun libellé commençant par « Vérifiez »** : rejeté le 29/07 dans `logement-gestes.ts`, où cinq
  libellés sur sept commençaient ainsi et se lisaient comme un formulaire. Le verbe nomme le geste
  réel : Regardez, Demandez, Consultez, Signalez, Suivez, Faites chiffrer.

### 3. `reservesShown` porte encore le nom de l'ancienne architecture

Le champ désignait un nombre **après** écrêtage ; il désigne maintenant le total. Le nom reste
littéralement vrai, puisque tout est désormais montré, mais il peut se relire dans six mois comme
« ce qui est visible dans la minute » et faire réintroduire le défaut. Renommage suggéré :
`verificationTotal`. Non bloquant.

### 4. Dérive documentaire — CORRIGÉ

Les deux commentaires de `conclusion-plan.ts` qui parlaient encore du « dossier complet » disent
désormais « plus bas » et nomment `ControlesDuDossier`. Vérifié : plus aucune occurrence de la
formule dans ce fichier.

### 5. Ce que ce lot ne répare pas

L'audit du 30/07 nomme un défaut plus large : **le dossier vaut cher là où il y a un problème et ne
vaut rien là où il n'y en a pas**, et l'acheteur ne peut pas le savoir avant de payer. Ce lot rend
visible une valeur déjà calculée ; il ne crée pas de matière sur un dossier rural. Une sollicitation
directe est prévue **avant le 20/08**.

### 6. Dette nommée : le module Autour n'entre pas dans le moteur

`autour-conclusion.ts`, `autour-permis.ts` et `autour-infrastructures.ts` produisent de la prose
depuis `Face3Snapshot`, **hors du `REGISTRY`** : aucun `DecisionFact`, aucune règle, aucun grain
déclaré. Conséquence directe et visible : le groupe « Autour de l'adresse » de la nouvelle liste ne
porte qu'un seul item, l'équipement automobile du secteur, alors que le module dit désormais
beaucoup plus.

Leur entrée devra passer par une règle, une preuve avec son grain et une activation. **Jamais** par
réutilisation opportuniste de leur prose.

Deuxième conséquence, trouvée le 01/08 en vérifiant le statut de SITADEL, et **CORRIGÉE le même
jour** : `autour-conclusion.ts` ne contenait aucune occurrence de « permis ». La conclusion porte
maintenant une charnière temporelle, `AutourConclusion.mouvement`, sur les seuls permis non achevés.
Spec et plan dédiés (`2026-08-01-permis-dans-la-conclusion-autour-*`), quatre commits, 15 tests.

La dette de fond reste entière : la charnière est de la **prose**, assemblée hors du `REGISTRY`.
Elle ne rend pas les permis examinables par le moteur, elle rend seulement la conclusion du module
cohérente avec le bloc qui la précède à l'écran.

### 7. Deux familles fetchées et lues par personne

`zfe` et `cartofriches` sont appelés par `/api/georisques-logement`, transportés dans
`LogementReport`, et consommés par aucun composant ni aucune règle. C'est le défaut exact pour lequel
l'IREP a été débranché le 29/07, et le commentaire qui l'explique est écrit dix lignes au-dessus de
`cartofriches` dans le même fichier. Deux issues symétriques : les débrancher comme l'IREP, ou leur
donner une règle. Le statu quo est le seul mauvais choix.

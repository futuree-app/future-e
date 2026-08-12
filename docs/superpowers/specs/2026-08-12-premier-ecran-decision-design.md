# Le premier écran, recomposé autour de la décision (chantier 6)

**Date** : 2026-08-12 · **Statut** : validé par le porteur, à implémenter · **Portée** : `/rapport`,
et le retrait des contrôles d'onboarding des pages de résultat.

Cinquième et dernier point de « L'ordre du prochain chantier »
(`docs/vault/vision/objet-central-dossier-de-decision.md`). Les quatre premiers sont livrés.

---

## 1. Le défaut

Le lecteur qui vient de payer ouvre `/rapport` et voit, dans cet ordre : une promesse commerciale en
très grand (« {Commune} en 2030, 2050, 2100. Ce que ça change pour vous. »), un panneau de
navigation, un sélecteur d'horizon, une carte projet, puis, seulement là, la conclusion qu'il a
achetée. Le plus grand texte de l'écran est un cadrage sans réponse.

Trois défauts distincts, tous vérifiés dans le code :

1. **La réponse arrive en quatrième position**, sous sa propre annonce.
2. **Le sélecteur d'horizon ne change rien de visible sur cette page.** `useHorizon` n'est consommé
   que par `QuartierSynthesis` et `QuartierClimatData`, donc par le module Territoire. Le clic n'est
   pas sans effet (il persiste la préférence, que Territoire relira), mais sur le hub le lecteur
   clique 2030 et rien ne bouge sous ses yeux. La page promet une interactivité qu'elle ne tient pas,
   et occupe de la place au-dessus de ce qui a été acheté.
3. **Le projet se redemande sur les pages de résultat.** Trois surfaces posent la même question dans
   trois vocabulaires, et un rapport payé recommence son onboarding en bas de page.

Et un quatrième, découvert en préparant celui-ci : **l'intention d'achat ou de location est
inatteignable depuis `/rapport`**. `ProjectSummaryCard` envoie `intent: project?.intent ?? null`
(ligne 61) et n'offre nulle part le choix. L'intention vient du wizard ou de `/ou-vivre`, puis se
recopie indéfiniment. Or le moteur la lit, et `signatureDecisionnelle` la compte comme matérielle :
quelqu'un qui passe d'un projet d'achat à un projet de location ne peut pas le dire à l'endroit même
où le dossier prétend lire son projet.

---

## 2. Les décisions prises

Tranchées par le porteur le 12/08/2026, après lecture du code.

| Question | Décision |
|---|---|
| Le hero du haut de page | Le H1 devient **la conclusion**. Le bloc verdict existant est promu, il n'y a pas de second titre. |
| Le cadrage climat | Descend au niveau des modules, dont il est le sujet. |
| Le sélecteur d'horizon | **Retiré du hub**, conservé sur Territoire (qui porte déjà son propre sélecteur inline dans `QuartierSynthesis`). |
| Les cas sans verdict | Un seul gabarit, quatre contenus : le grand texte nomme le manque et le geste. |
| La carte projet | Résumé en une ligne dans le hero, éditeur complet plus bas. |
| L'ordre interne de la minute | Inchangé. Il a été calibré à l'écran, le chantier reste une recomposition de page. |
| Les trois questions redondantes | **Une seule surface d'édition, sans fusionner les stockages.** |

La dernière ligne est la décision structurante : ce qui se centralise est **l'expérience d'édition**,
pas les données. `user_project` reste global au compte, `report_context.relation` reste attaché au
lieu. Quelqu'un peut habiter Lorient et envisager La Rochelle : une posture, deux relations.

---

## 3. Moitié A : l'écran cible

```
Navbar · bandeaux d'état                              inchangés
────────────────────────────────────────────────────────────────
HERO DÉCISION                                         nouveau
  ┄ hors streaming, rendu par la page ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  DOSSIER
  12 rue des Lilas, La Rochelle        [changer de bien]
  Votre projet aujourd'hui : achat · « le calme, proche
  de la mer »                                 [modifier]
  ┄ dans le composant streamé ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  Analyse générée le 11 août · commune + adresse
  ▸ bandeau « cette analyse répond au projet que vous
    aviez », s'il y a lieu
  ▸ bandeau « analyse du logement en cours », s'il y a lieu
  ┏━ bloc verdict promu ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ ARBITRAGE                                              ┃
  ┃ La Rochelle tient vos priorités, sous réserve de deux  ┃  H1
  ┃ contrôles.                                             ┃
  ┃ détail · condition à vérifier · à contrôler en priorité┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
────────────────────────────────────────────────────────────────
Les cartes de la minute                     ordre interne inchangé
Les contrôles complets                                 inchangé
CTA « voir l'analyse du logement »                     inchangé
VOTRE PROJET (éditeur complet)                         descend ici
Les trois échelles + le cadrage climat                 descendent ici
Première lecture / modules                             inchangés
Barre d'horizon                                        SUPPRIMÉE du hub
```

Le titre de section « En une minute » disparaît : il nommait une section au milieu d'une page, or
cette section devient la page. L'eyebrow du hero dit « Dossier », l'étiquette du verdict dit son
registre (`plan.verdictLabel`).

### 3.1 Le streaming, et la frontière exacte

Le verdict est aujourd'hui rendu **dans** `DossierDecisionSection`, elle-même sous `Suspense` pour
l'augmentation Adresse. Promu en tête, il ferait du haut de page un trou de streaming si on s'y
prenait mal. Mais la tentation inverse est un piège, et c'est le point le plus délicat du chantier.

**Ce qui NE peut PAS remonter au-dessus du `Suspense`.** La page ne connaît que les métadonnées de
l'artefact COMMUNAL (`artefactCommune`, `dossierGenereLe`, `projetCommuneAChange`). Pour un dossier
d'adresse, la version servie, sa date et son obsolescence ne sont déterminées qu'après la lecture de
l'artefact du scope `logement:<id>`, dans le composant streamé (`DossierAvecLogement`, lecture ligne
65, transmission lignes 131 à 138). Remonter ces trois valeurs dans la page daterait le verdict
d'adresse avec la date de l'artefact communal, et qualifierait son obsolescence avec le projet figé
d'un AUTRE artefact. Ce serait exactement le défaut que le chantier 5 vient de fermer, réintroduit
par une décision de mise en page.

Restent donc dans la partie streamée, avec le verdict qu'elles qualifient :

- la date de l'analyse SERVIE ;
- le bandeau d'obsolescence (`AnalyseAncienProjet`) ;
- les états `pending` et `unavailable` ;
- le grain annoncé (commune, ou commune plus adresse).

**Ce qui remonte, et qui est réellement stable** : le lieu lu, le bien lu, et le projet ACTUEL du
compte. Ces trois valeurs ne dépendent d'aucun artefact.

- **Le verdict et les cartes** gardent le patron déjà en place : le `fallback` est le dossier
  COMMUNAL, l'enfant est le dossier augmenté de l'adresse. Le lecteur voit une conclusion communale
  honnêtement étiquetée, remplacée par la conclusion d'adresse.
- Aucune seconde assemblée : le bloc hero + cartes + contrôles est **contigu** dans le nouvel ordre,
  il se déplace d'un seul tenant.

### 3.2 Le projet affiché n'est pas une métadonnée de l'analyse

La ligne « Votre projet aujourd'hui » décrit le projet **du compte, à l'instant**. Le verdict, lui,
répond au projet figé dans l'artefact acheté. Les deux coïncident la plupart du temps, et quand ils
divergent, c'est précisément ce que le bandeau d'obsolescence existe pour dire.

Poser la ligne de projet sans qualification juste au-dessus du verdict recréerait la confusion que
`AnalyseAncienProjet` supprime : le lecteur lirait le projet d'aujourd'hui comme le cadrage de la
réponse d'hier. Deux règles, donc :

1. La ligne du hero est **explicitement datée du présent** (« Votre projet aujourd'hui ») et porte le
   geste d'édition. Elle ne prétend jamais décrire ce sur quoi l'analyse a été construite.
2. Ce sur quoi l'analyse a été construite se lit **avec l'analyse** : sa date, et le bandeau
   d'obsolescence quand le projet a matériellement changé.

Corollaire de rendu : la ligne de projet et le bandeau d'obsolescence ne doivent jamais être fondus
dans un même bloc visuel. Le premier appartient au lecteur, le second à l'analyse.

Le « hero » n'est donc pas un composant unique : c'est l'identité rendue par la page, immédiatement
suivie du bloc verdict rendu par le composant streamé. Le lecteur voit un seul bloc de tête ; le
code garde la frontière qui permet à l'un d'arriver sans l'autre.

**Le titre de la page.** Le headline du verdict est aujourd'hui un `<h2>`, sous un `<h1>` de cadrage
climat. Il devient le `<h1>` unique de `/rapport`, et le cadrage climat descend en `<h2>` avec les
modules. Quand il n'y a pas de verdict (projet non structuré, non payant), c'est le grand texte du
gabarit qui porte le `<h1>` : la page n'en a jamais deux, et n'en a jamais zéro.

### 3.3 Les QUATRE contenus du hero

Un seul gabarit. Ce qui change est le grand texte et le geste.

| État | Grand texte | Geste |
|---|---|---|
| Payant, projet structuré | `plan.verdict.headline.text`, déterministe, jamais généré | les actions du verdict, déjà en place |
| Payant, projet présent mais `parsed` nul | Déjà écrit : `conclusion-plan.ts` produit le label « À préciser » et le headline « Décrivez votre projet pour mettre {commune} en regard de ce qui compte pour vous. » | **à ajouter** : un bouton vers l'éditeur de projet |
| **Payant, AUCUN projet** | **À écrire.** Aucun plan n'existe : sans `userProject`, la page n'appelle même pas `buildCommuneDossier` (`rapport/page.tsx:150`) et le dossier vaut `null`. | un bouton vers l'éditeur de projet |
| Non payant (dossier partiel) | La promesse commerciale actuelle, inchangée | « Ouvrir le dossier » vers `/#pricing`, inchangé |

Les deux cas du milieu se ressemblent à l'écran et ne se ressemblent pas dans le code :
`project_not_structured` est un état du PLAN, donc un texte que le moteur produit ; « aucun projet »
est l'absence de tout plan, donc un texte que la page doit porter elle-même. Les confondre ferait
chercher un headline dans un objet nul.

Le texte du quatrième cas ne s'invente pas non plus : il dit ce qui manque et ce qu'il ouvre, sans
promettre de conclusion. Proposition à valider en implémentation, dans la voix des autres headlines :
« Dites ce que vous cherchez, et {commune} se lira à cette aune. »

---

## 4. Moitié B : une seule surface d'édition

`/rapport` devient le seul endroit où l'on modifie le cadrage de l'analyse. Quatre choses, dans cet
ordre, dans l'éditeur de projet :

1. **L'objectif** : chercher un territoire · examiner ce lieu · y habiter déjà
   → `user_project.posture` (existant)
2. **L'intention** : acheter · louer
   → `user_project.intent` (**nouveau à l'écran**, aujourd'hui inatteignable)
3. **Les priorités et contraintes** : le texte libre, reparsé
   → `user_project.parsed` (existant)
4. **Le candidat lu** : « Pour La Rochelle : j'y vis · j'envisage d'y vivre »
   → `report_context.relation` de la commune LUE, via `PATCH /api/report-context` (existant)

### 4.1 Les stockages ne bougent pas

C'est la contrainte qui rend ce chantier tenable. L'éditeur central écrit `user_project` pour le
projet et `report_context.relation` pour la relation communale, exactement comme aujourd'hui. La
synthèse Territoire reçoit donc la même valeur, par le même chemin (`resolveRelation` puis
`synthesisRelation`), et **aucun prompt n'est modifié**. La migration vers un vrai modèle
projet → candidats viendra ensuite, elle n'est pas ici.

**Conséquence à assumer : il n'y a pas de transaction.** Deux tables, deux routes
(`PATCH /api/profile` et `PATCH /api/report-context`). Un bouton « Enregistrer » unique pourrait donc
réussir à moitié, et laisser le projet modifié avec l'ancienne relation, ou l'inverse, sans que
l'écran sache lequel des deux il montre.

L'éditeur porte donc **deux sous-contrôles séparés**, chacun avec son propre état de sauvegarde et
son propre message d'échec :

- « Votre projet » : objectif, intention, priorités. Une sauvegarde, une confirmation.
- « Pour {commune} » : la relation au lieu lu. Une sauvegarde, une confirmation.

Ce n'est pas un renoncement à la surface unique : le lecteur modifie tout au même endroit. C'est le
refus de prétendre à une atomicité que le stockage ne donne pas. Le patron de sauvegarde honnête est
déjà celui de `ProjectSummaryCard` : rien n'est annoncé comme enregistré sans confirmation serveur.

**Coût technique à prévoir** : le hub ne lit pas `report_context` aujourd'hui. Il faudra l'y charger,
donc une requête Supabase de plus sur `/rapport`, et appliquer `resolveRelation` pour afficher la
valeur EFFECTIVE (celle que la synthèse utilisera) plutôt qu'une valeur déclarée qui n'existe peut
être pas.

### 4.2 Ce que les pages de résultat perdent

| Composant | Aujourd'hui | Devient |
|---|---|---|
| `ProjectProbe` (Logement) | Demande « Que comptez-vous faire de ce logement ? » à **chaque visite** : `useState<string \| null>(null)`, jamais persistée. N'oriente que `DecisionChecklist`. | **Supprimée.** La posture se dérive du projet du compte. |
| `ReportRelationBanner` (Territoire) | Une phrase plus un sélecteur qui écrit `report_context.relation`. | **Une ligne non interactive** qui dit le cadrage, suivie d'un lien « Modifier le projet » vers `/rapport`. |

### 4.3 Le Logement lit le projet, il ne le re-dérive pas

La règle de dérivation existe déjà et elle est canonique : `bucketDuProjet`
(`lib/decision/logement-gestes.ts:37`), qui teste **l'intention avant la posture** et rend `neutre`
quand rien n'est déclaré. Écrire une seconde table de correspondance dans ce chantier créerait
exactement ce que le durcissement du chantier 5 vient de démonter : deux définitions de la même
règle, qui divergent au premier changement. Une version antérieure de cette spec en proposait une,
avec une priorité inverse. Elle est retirée.

Le branchement, donc :

1. `rapport/logement/page.tsx` charge et normalise `user_project` (elle ne le lit pas aujourd'hui) et
   le passe à `LogementModule`.
2. `LogementModule` le transmet à `DecisionChecklist` sans le convertir.
3. `pointsAVerifier` accepte `UserProject | null` au lieu d'une chaîne de sonde.
4. `projetDepuisLaSonde` (`lib/decision/logement-verifications.ts:61`) est **supprimé** : c'est
   l'adaptateur qui reconstruisait un `UserProject` depuis la réponse de la sonde. Sans sonde, il n'a
   plus d'objet.
5. `ProjectProbe` est supprimée.

Sans projet, `bucketDuProjet` rend `neutre`, et `DecisionChecklist` sert déjà sa version neutre
(« Toujours visible ; la version neutre s'affiche avant tout choix de projet »). On ne demande donc
rien et on n'invente aucune posture par défaut : une posture devinée orienterait une checklist
d'achat vers un résident, ou l'inverse.

### 4.4 Le cas « j'y habite déjà » et « j'achète »

`bucketDuProjet` teste l'intention d'abord : la combinaison `posture: habitant` avec `intent: achat`
rend donc `achat`. Ce n'est pas un bug (un locataire qui achète le logement où il vit est un cas
réel), mais l'écran ne doit pas pouvoir la produire par inadvertance, ni la laisser traîner après un
changement d'objectif.

**Décision** : la question de l'intention est TOUJOURS posée, et son libellé suit l'objectif choisi.
Pour « j'y habite déjà », elle devient « Envisagez-vous d'acheter ou de louer ce logement ? » avec un
choix explicite « ni l'un ni l'autre », qui écrit `intent: null`.

Ce qui est refusé, et pourquoi : effacer silencieusement l'intention au moment où l'on coche « j'y
habite déjà » serait une mutation d'une valeur DÉCLARÉE, décidée par le code au nom du lecteur, et
elle perdrait le cas du locataire qui achète. Le lecteur voit les deux réponses en même temps et
tranche lui-même ; la combinaison incohérente devient impossible à produire sans l'avoir vue.

---

## 5. Les composants touchés

| Fichier | Changement |
|---|---|
| `src/app/(account)/rapport/page.tsx` | Nouvel ordre. Hero d'identité rendu au-dessus du `Suspense`. Retrait de `HorizonBar` et de `id="horizon"`. Descente de `ProjectSummaryCard`, du panneau des échelles et du cadrage climat. |
| `src/components/report/DossierDecisionSection.tsx` | Ne rend plus son en-tête (eyebrow « En une minute », date, bandeau projet changé) : la page les porte. Le verdict reste chez elle, en tête de ce qu'elle rend, et son headline passe de `<h2>` à `<h1>`. |
| `src/components/report/ConclusionBlock.tsx` | Le headline passe de `<h2>` (ligne 103) à `<h1>`, la page n'en portant plus d'autre. |
| `src/components/report/ProjectSummaryCard.tsx` | Ajout du choix d'intention. Ajout du sous-contrôle « Pour {commune} », avec sa propre sauvegarde. Le résumé d'une ligne du hero se lit depuis le même projet. |
| `src/components/report/ReportRelationBanner.tsx` | Perd son sélecteur, garde sa phrase, gagne un lien. |
| `src/components/report/LogementModule.tsx` | Retire `ProjectProbe`, reçoit le projet et le transmet sans le convertir. |
| `src/app/(account)/rapport/logement/page.tsx` | Charge et normalise `user_project` (elle ne le lit pas aujourd'hui). |
| `src/lib/decision/logement-verifications.ts` | `pointsAVerifier` accepte `UserProject \| null` ; `projetDepuisLaSonde` supprimé. |
| `src/components/report/logement/ProjectProbe.tsx` | Supprimé. |

Aucune donnée nouvelle, aucun appel externe supplémentaire, aucune migration SQL. Une requête
Supabase de plus sur `/rapport` : la lecture de `report_context` pour la commune lue.

---

## 6. Cas limites

| Cas | Comportement attendu |
|---|---|
| Domicile Lorient, candidat La Rochelle | Une posture, deux relations. L'éditeur écrit la relation de la commune LUE. Ouvrir un autre territoire change la question posée, sans toucher au projet. |
| Aucun bien d'adresse sur la commune | Le hero nomme la commune seule. Le CTA « affiner avec une adresse » reste où il est. |
| Plusieurs biens dans la commune | Le bien lu est TOUJOURS nommé dans le hero. Le lien « changer de bien » n'apparaît que s'il existe une alternative, comme aujourd'hui. |
| Augmentation Adresse en cours (`pending`) | Bandeau existant, au-dessus du verdict communal. L'identité, elle, ne clignote pas. |
| Augmentation Adresse indisponible | Bandeau existant. La conclusion reste communale, et le dit. |
| Projet présent, `parsed` nul | Hero « À préciser » plus bouton vers l'éditeur. Aucune carte, aucun contrôle : c'est déjà le comportement du plan. |
| Aucun projet du tout | Hero écrit par la page, sans plan à lire. Ne jamais chercher un headline dans un dossier nul. |
| Artefact d'adresse périmé | La ligne « Votre projet aujourd'hui » et le bandeau d'obsolescence disent deux choses différentes, et restent visuellement séparés. La date affichée est celle de la version SERVIE, jamais celle de l'artefact communal. |
| Bien lu sans artefact d'adresse encore prêt | Le hero nomme le bien immédiatement ; la date et le grain n'apparaissent qu'avec l'analyse servie. |
| Non payant | Hero commercial inchangé. Ni verdict, ni identité de bien. |
| Projet modifié depuis l'achat | Le bandeau `AnalyseAncienProjet` se lit sous l'identité et AVANT le verdict : la suite de l'écran s'interprète autrement selon qu'on lit une réponse actuelle ou une réponse d'alors. |
| Relation jamais confirmée | `resolveRelation` infère depuis la résidence, comme aujourd'hui. L'éditeur montre la valeur effective, sans prétendre qu'elle a été déclarée. |
| Mobile | Le hero ne doit produire aucun débordement horizontal, et le verdict doit rester lisible sans zoom. Validation par captures desktop ET mobile. |

---

## 7. Invariants vérifiables

Ce que l'implémentation doit rendre testable, dans l'esprit des huit invariants du vault.

1. **Le plus grand texte de l'écran est une réponse ou un geste.** Jamais un cadrage.
2. **Une même question n'est posée qu'à un seul endroit.** Aucune page de résultat ne demande la
   posture, l'intention ou la relation.
3. **Le bien lu est nommé avant toute conclusion qui le concerne.**
4. **Aucune posture n'est devinée.** Ce qui ne se dérive pas du projet reste `neutre`, et la surface
   concernée sert sa version neutre. Une seule fonction dérive : `bucketDuProjet`.
5. **La relation écrite est celle de la commune lue.** Jamais celle du domicile, jamais celle d'une
   commune lue précédemment.
6. **La valeur transmise à la synthèse Territoire est inchangée.** Même chemin, même prompt.
7. **Une métadonnée d'analyse n'est jamais rendue hors de l'analyse qu'elle qualifie.** La date, le
   grain et l'obsolescence appartiennent à la version servie, donc au composant qui la lit.
8. **Aucune sauvegarde n'est annoncée sans confirmation serveur**, et deux écritures dans deux tables
   ont deux confirmations.

---

## 8. Hors périmètre

- La fusion des stockages (`user_project` et `report_context`) et le modèle projet → candidats.
- L'ordre interne de la minute, le contenu des cartes, les registres et leurs teintes.
- La chaîne de preuve et `ControlesDuDossier`.
- Le sélecteur d'horizon sur Territoire, qui reste tel quel.
- Le déplacement de l'édition du projet hors de `/rapport` (vers `/compte` ou une page dédiée).

---

## 9. Validation

- Test unitaire sur le sélecteur de contenu de hero, sur les QUATRE états, dont « aucun projet », qui
  doit rendre son texte sans jamais lire un plan.
- Aucun test à écrire sur la dérivation de posture : elle n'est pas réécrite, `bucketDuProjet` a déjà
  les siens. Vérifier plutôt, par un test de branchement, que `DecisionChecklist` reçoit le projet du
  compte et non une chaîne de sonde.
- Test du cas `posture: habitant` avec `intent: achat` : la combinaison reste possible, elle rend le
  bucket `achat`, et l'éditeur permet de poser « ni l'un ni l'autre ».
- Recette navigateur, compte payé, sur les deux cas qui portent le chantier : commune seule, et
  commune plus adresse.
- Le cas multi-communes du tableau 6, joué en entier : lire Lorient, lire La Rochelle, vérifier que
  la relation de l'une n'a pas écrasé l'autre et que le projet n'a pas bougé.
- Captures desktop et mobile du premier écran dans ses trois contenus.

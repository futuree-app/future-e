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
2. **Le sélecteur d'horizon ne pilote rien sur cette page.** `useHorizon` n'est consommé que par
   `QuartierSynthesis` et `QuartierClimatData`, donc par le module Territoire. Sur le hub, le lecteur
   clique 2030 et rien ne bouge. La page promet une interactivité qu'elle ne tient pas.
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
| Les cas sans verdict | Un seul gabarit, trois contenus : le grand texte nomme le manque et le geste. |
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
  DOSSIER · analyse générée le 11 août
  12 rue des Lilas, La Rochelle        [changer de bien]
  Achat · « le calme, proche de la mer »      [modifier]
  ▸ bandeau « votre projet a changé », s'il y a lieu
  ▸ bandeau « analyse du logement en cours », s'il y a lieu
  ┏━ bloc verdict promu ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ ARBITRAGE                          commune + adresse   ┃
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

### 3.1 Le streaming, et pourquoi il ne casse pas

Le verdict est aujourd'hui rendu **dans** `DossierDecisionSection`, elle-même sous `Suspense` pour
l'augmentation Adresse. Promu en tête, il ferait du haut de page un trou de streaming si on s'y
prenait mal. Le découpage évite le problème sans rien inventer :

- **L'identité** (bien lu, projet, date de l'analyse) est connue sans attendre aucune lecture
  externe. Elle est rendue par la page, **au-dessus** du `Suspense`, donc immédiatement et sans
  clignotement.
- **Le verdict et les cartes** restent dans le composant streamé, et gardent le patron déjà en
  place : le `fallback` est le dossier COMMUNAL, l'enfant est le dossier augmenté de l'adresse. Le
  lecteur voit donc une conclusion communale honnêtement étiquetée (« Première lecture à l'échelle
  de la commune, l'analyse du logement est en cours »), remplacée par la conclusion d'adresse.
- Aucune seconde assemblée : le bloc hero + cartes + contrôles est **contigu** dans le nouvel ordre,
  il se déplace d'un seul tenant.

Le « hero » n'est donc pas un composant unique : c'est l'identité rendue par la page, immédiatement
suivie du bloc verdict rendu par le composant streamé. Le lecteur voit un seul bloc de tête ; le
code garde la frontière qui permet à l'un d'arriver sans l'autre.

**Le titre de la page.** Le headline du verdict est aujourd'hui un `<h2>`, sous un `<h1>` de cadrage
climat. Il devient le `<h1>` unique de `/rapport`, et le cadrage climat descend en `<h2>` avec les
modules. Quand il n'y a pas de verdict (projet non structuré, non payant), c'est le grand texte du
gabarit qui porte le `<h1>` : la page n'en a jamais deux, et n'en a jamais zéro.

### 3.2 Les trois contenus du hero

Un seul gabarit. Ce qui change est le grand texte et le geste.

| État | Grand texte | Geste |
|---|---|---|
| Payant, projet structuré | `plan.verdict.headline.text`, déterministe, jamais généré | les actions du verdict, déjà en place |
| Payant, projet non structuré | Déjà écrit : `conclusion-plan.ts` produit le label « À préciser » et le headline « Décrivez votre projet pour mettre {commune} en regard de ce qui compte pour vous. » | **à ajouter** : un bouton vers l'éditeur de projet |
| Non payant (dossier partiel) | La promesse commerciale actuelle, inchangée | « Ouvrir le dossier » vers `/#pricing`, inchangé |

Le cas non structuré est donc presque acquis : il manque le geste, pas le texte.

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

### 4.2 Ce que les pages de résultat perdent

| Composant | Aujourd'hui | Devient |
|---|---|---|
| `ProjectProbe` (Logement) | Demande « Que comptez-vous faire de ce logement ? » à **chaque visite** : `useState<string \| null>(null)`, jamais persistée. N'oriente que `DecisionChecklist`. | **Supprimée.** La posture se dérive du projet du compte. |
| `ReportRelationBanner` (Territoire) | Une phrase plus un sélecteur qui écrit `report_context.relation`. | **Une ligne non interactive** qui dit le cadrage, suivie d'un lien « Modifier le projet » vers `/rapport`. |

Dérivation de la posture Logement depuis le projet, sans rien inventer :

| Projet | `projet` passé à `DecisionChecklist` |
|---|---|
| `posture === "habitant"` | `reside` |
| `intent === "achat"` | `achat` |
| `intent === "location"` | `location` |
| aucun des trois | `null` |

Le dernier cas compte : `DecisionChecklist` affiche déjà une version neutre avant tout choix
(« Toujours visible ; la version neutre s'affiche avant tout choix de projet »). On ne demande donc
rien, et on n'invente pas une posture par défaut. Une posture devinée orienterait une checklist
d'achat vers un résident, ou l'inverse.

---

## 5. Les composants touchés

| Fichier | Changement |
|---|---|
| `src/app/(account)/rapport/page.tsx` | Nouvel ordre. Hero d'identité rendu au-dessus du `Suspense`. Retrait de `HorizonBar` et de `id="horizon"`. Descente de `ProjectSummaryCard`, du panneau des échelles et du cadrage climat. |
| `src/components/report/DossierDecisionSection.tsx` | Ne rend plus son en-tête (eyebrow « En une minute », date, bandeau projet changé) : la page les porte. Le verdict reste chez elle, en tête de ce qu'elle rend, et son headline passe de `<h2>` à `<h1>`. |
| `src/components/report/ProjectSummaryCard.tsx` | Ajout du choix d'intention. Ajout du bloc « le candidat lu ». Le résumé d'une ligne du hero se lit depuis le même projet. |
| `src/components/report/ReportRelationBanner.tsx` | Perd son sélecteur, garde sa phrase, gagne un lien. |
| `src/components/report/LogementModule.tsx` | Retire `ProjectProbe`, dérive la posture du projet reçu du serveur. |
| `src/components/report/logement/ProjectProbe.tsx` | Supprimé. |

Aucune donnée nouvelle, aucun appel externe supplémentaire, aucune migration SQL.

---

## 6. Cas limites

| Cas | Comportement attendu |
|---|---|
| Domicile Lorient, candidat La Rochelle | Une posture, deux relations. L'éditeur écrit la relation de la commune LUE. Ouvrir un autre territoire change la question posée, sans toucher au projet. |
| Aucun bien d'adresse sur la commune | Le hero nomme la commune seule. Le CTA « affiner avec une adresse » reste où il est. |
| Plusieurs biens dans la commune | Le bien lu est TOUJOURS nommé dans le hero. Le lien « changer de bien » n'apparaît que s'il existe une alternative, comme aujourd'hui. |
| Augmentation Adresse en cours (`pending`) | Bandeau existant, au-dessus du verdict communal. L'identité, elle, ne clignote pas. |
| Augmentation Adresse indisponible | Bandeau existant. La conclusion reste communale, et le dit. |
| Projet non structuré | Hero « À préciser » plus bouton vers l'éditeur. Aucune carte, aucun contrôle : c'est déjà le comportement du plan. |
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
4. **Aucune posture n'est devinée.** Ce qui ne se dérive pas du projet reste nul, et la surface
   concernée sert sa version neutre.
5. **La relation écrite est celle de la commune lue.** Jamais celle du domicile, jamais celle d'une
   commune lue précédemment.
6. **La valeur transmise à la synthèse Territoire est inchangée.** Même chemin, même prompt.

---

## 8. Hors périmètre

- La fusion des stockages (`user_project` et `report_context`) et le modèle projet → candidats.
- L'ordre interne de la minute, le contenu des cartes, les registres et leurs teintes.
- La chaîne de preuve et `ControlesDuDossier`.
- Le sélecteur d'horizon sur Territoire, qui reste tel quel.
- Le déplacement de l'édition du projet hors de `/rapport` (vers `/compte` ou une page dédiée).

---

## 9. Validation

- Tests unitaires sur la dérivation de posture (les quatre lignes du tableau 4.2) et sur le choix du
  contenu de hero selon l'état.
- Recette navigateur, compte payé, sur les deux cas qui portent le chantier : commune seule, et
  commune plus adresse.
- Le cas multi-communes du tableau 6, joué en entier : lire Lorient, lire La Rochelle, vérifier que
  la relation de l'une n'a pas écrasé l'autre et que le projet n'a pas bougé.
- Captures desktop et mobile du premier écran dans ses trois contenus.

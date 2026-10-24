# FUT-109 · Le classement sur les seuls critères mesurés, et la couverture des priorités

Décision du porteur du 24/10/2026, mise en œuvre sur la branche `bonjourfuturee/fut-109-populations-communes-deleguees`. Ce document traite **uniquement la modification du classement**. Les corrections de données (populations, démographie, indicateurs ADEME, mobilité) et leurs effets sont dans `2026-10-23-fut109-populations-grain.md`.

## 1. Le défaut

`scorePreferences` (`src/lib/comparateur-vie.ts`) divisait la somme pondérée des critères mesurés par le poids de **tous** les critères déclarés. Un critère sans donnée (`null`) sortait des raisons et du compromis, mais pesait **0** dans le score de compatibilité. Une commune qu'on avait renoncé à noter (FUT-109 : soins non lus après une fusion) reculait comme si elle était la pire : Haut Valromey, 25 908ᵉ sur 34 788 pour les soins.

## 2. La doctrine retenue

- **Un vrai 0 reste un 0.** Un critère non mesuré (`null`) ne contribue ni au numérateur ni au dénominateur.
- **La couverture des priorités déclarées se dit à part** (`CouverturePriorites`) : `complete`, `partielle`, `aucune`, ou `sans_priorite` quand aucune priorité classable n'est déclarée. Les critères implicites (isolement, emploi) et l'inondation, qui agit par son seul recul, n'y entrent pas.
- **Pas de promotion, sans seuil numérique** : une priorité déclarée est mesurée ou ne l'est pas.
  - Le tri, puis l'étalement (une région, puis un département de plus), s'appliquent d'abord aux communes dont toutes les priorités sont mesurées. Les autres ne complètent la liste que s'il en manque. Elles restent consultables.
  - Un palier de correspondance (« Forte », « Bonne ») et le drapeau de correspondance parfaite ne se disent que d'une couverture complète.
  - La carte d'une couverture partielle porte « Priorités en partie mesurées », celle d'une couverture nulle ou sans priorité « À explorer » ; toutes deux ajoutent « Non mesuré ici : … » avec les mots du projet.
  - Une priorité non mesurée ne produit ni raison, ni compromis, ni conclusion. La synthèse reçoit `priorites_non_mesurees` avec la consigne de les dire « non mesurées ici », jamais satisfaites ni manquantes, jamais une correspondance.
- **Inondation** : doctrine inchangée. Le recul dépend des poids déclarés ; il ne peut que faire reculer ; l'inondation seule reste une exploration.

**Ordre du classement** (révision du 24/10 après revue de #87, `ordreClassement` et `etalerParGroupes`), le même à chaque étape de `matchProjects` :
1. une commune dont les conditions non négociables sont confirmées passe avant une commune dont une condition reste à la limite ;
2. à statut égal, toutes les priorités mesurées avant une couverture partielle, puis aucune ;
3. ensuite le score, puis la diversité géographique, qui n'agit qu'à l'intérieur d'un même groupe ;
4. une couverture partielle retenue ne reçoit toujours aucun palier.

Étapes vérifiées : tri initial ; affinage des trajets (statut encore inconnu : couverture puis score, pour que le plafond d'affinage n'aille pas d'abord aux couvertures incomplètes) ; tri après affinage ; dédoublonnage des villes PLM (la première rencontrée dans cet ordre est gardée) ; étalement, groupe par groupe. Les règles de filtrage des conditions ne changent pas.

## 3. Un critère implicite absent : l'emploi des arrondissements

Avec la renormalisation, une commune sans critère implicite aurait été classée sur sa seule priorité. Les 45 arrondissements de Paris, Lyon et Marseille n'avaient pas d'emploi : Marseille passait 1ʳᵉ pour la douceur de l'hiver. Ce n'était pas une absence de mesure mais un rattachement manquant. L'indicateur est défini à la maille zone d'emploi, et l'Insee rattache Paris, Lyon et Marseille (pas leurs arrondissements) aux zones 1109, 8421 et 9312. Les arrondissements en reçoivent les valeurs, exactes par construction (`scripts/lib/emploi-arrondissements.mjs`). Après correction, aucun critère implicite n'est absent dans le vivier du comparateur (communes d'au moins 1 500 habitants).

## 4. Mesures, sur l'index entier

**Ordre seul** (`scorePreferences` et tri, sans contrainte), 94 profils : chaque critère seul (poids 3), et 66 paires de critères sujets aux absences (poids 3 et 2), avec les critères implicites.

| | Vivier (≥ 1 500 hab.) | Toutes les communes |
|---|---|---|
| Profils où une commune a une couverture incomplète | 68 | 77 |
| Top 5 modifié (ancienne formule → doctrine) | **0** | 0 |
| Top 20 modifié | 0 | 1 |
| Communes incomplètes dans le top 100, **renormalisation pure** | 1 594 | 1 557 |
| Communes incomplètes dans le top 100, **doctrine** | **0** | **0** |

La garde est donc indispensable. Sans elle, Lyon 1ᵉʳ, aucune priorité mesurée, serait 1ʳᵉ pour le calme, l'air ou la nature, et Échirolles 2ᵉ pour la faible pression agricole.

**Ce que voit le lecteur** (`matchProjects`, vrai moteur, même index, ancienne formule → doctrine) : 984 recherches, 12 territoires (France entière, 17, 93, 75, 13, 69, 85, 15, 49, 62, 33, 2A) × 28 critères × 3 variantes (seul, avec les soins, avec la voiture).

| Effet | Nombre |
|---|---|
| Composition des trois cartes modifiée | **0** |
| Ordre des trois cartes modifié | **0** |
| Correspondance parfaite modifiée | 0 |
| Raisons ou compromis modifiés | 0 |
| Libellés de palier modifiés | 12 (8 « Priorités en partie mesurées », 4 « À explorer ») |

Les 12 cartes sont des recherches à Paris sur le calme, que la densité des arrondissements ne mesure pas. Elles affichaient « Correspondance partielle » ; elles disent désormais ce qui n'est pas mesuré.

## 5. Scénarios testés (`src/lib/fut109-couverture-classement.test.ts`)

| Scénario | Résultat |
|---|---|
| Toutes les priorités mesurées (17 : soins, nature) | couverture complète partout, palier possible |
| Priorité forte non mesurée (93 : soins × 3) | Saint-Denis passe après toutes les communes mesurées, n'apparaît pas |
| Une seule priorité mesurée sur deux (75 : calme, culture) | « Priorités en partie mesurées », rien sur le calme, pas de correspondance parfaite |
| Aucune priorité mesurée (75 : calme) | consultable, « À explorer », ni raison ni compromis |
| Vrai 0 contre `null` (La Rochelle, croissance) | le 0 pèse de tout son poids ; le `null` ne pèse rien et passe après |
| Critères implicites seuls (17) | « sans priorité », aucune correspondance parfaite |
| Inondation seule (17) | exploration inchangée |
| Inondation + soins + vie locale (index entier) | jamais au-dessus du score sans inondation ; la couverture ignore l'inondation |
| Classement national, 8 critères sujets aux absences | aucune commune incomplète proposée |

## 6. FUT-129

L'invariant « une recherche sans priorité inondation garde exactement son score d'avant » imposait l'ancienne formule. Il est remplacé, avec l'accord du porteur, par la méthode vérifiée sur l'index entier : moyenne pondérée des seuls critères mesurés, **identique à l'ancienne formule pour toute commune entièrement mesurée**. Les 19 autres tests de FUT-129 sont inchangés et passent, sessions figées comprises.

## 7. Révision du 24/10 après revue de #87

**Deux correctifs.**
- **Ordre** : la première version regroupait l'étalement par couverture seule ; une commune complète mais à la limite pouvait passer devant une commune confirmée à couverture partielle. Elle passe désormais après (§2). Effet de bord voulu : à couverture égale, l'étalement régional ne peut plus faire remonter une commune à la limite devant une commune confirmée d'une région déjà vue.
- **Phrases générales** : « Les trois pourraient convenir », « Un seul territoire répond à ce que vous avez demandé » et « Voici ceux qui impliquent le moins de compromis » ne sont plus atteintes que si toutes les communes affichées ont une couverture complète. Sinon, le moteur rend `couverture` (`partielle`, `aucune`, `sans_priorite`) et une phrase d'exploration (`MESSAGE_COUVERTURE`), que la page affiche et que le repli de synthèse reprend ; la synthèse reçoit `couverture_des_priorites` avec la consigne de ne dire ni « correspondent », ni « répondent », ni « conviennent », ni « moins de compromis ».

**Écarts avec la première version de #87** (mêmes 984 recherches, même index) : aucune composition, aucun ordre, aucun palier, aucune raison ne change ; seules les 12 phrases générales des recherches à couverture incomplète changent (8 « partielle », 4 « aucune »). Aucune phrase générale ne promet plus une correspondance sur une couverture incomplète (0 sur 984). Contrôle de promotion sur l'index entier inchangé : 0 commune incomplète dans le top 100 (1 594 sans la garde).

**Navigateur** (`scripts/fut109/capturer-couverture.mjs`, captures et relevés dans `docs/audits/2026-10-24-fut109-captures/`) : vraie page « Où vivre », serveur local sans clé Anthropic, résultats de la route `/match` (déterministe) restaurés comme session, synthèse remplacée par un texte explicite. 1 440 et 390 px, aucun débordement.

| Situation | Phrase générale | Palier des cartes |
|---|---|---|
| Complète (17 : soins, nature) | « Les trois pourraient convenir. » | Bonne correspondance |
| Partielle (75 : calme, culture) | « Certaines de vos priorités ne sont pas mesurées… » | Priorités en partie mesurées + « Non mesuré ici : un cadre calme. » |
| Aucune (75 : calme) | « Aucune de vos priorités n'est mesurée… » | À explorer + « Non mesuré ici : un cadre calme. » |
| Sans priorité (17) | « Votre recherche ne porte sur aucune priorité que le comparateur mesure… » | À explorer |

## 8. Limites

- Le score affiché n'est jamais chiffré à l'écran : seul le palier l'est, et il est réservé aux couvertures complètes.
- **Communes à la limite, de bout en bout** : elles naissent de l'isochrone IGN, que le moteur ne laisse pas injecter et que le serveur local n'a pas jointe (la contrainte de trajet reste « non appliquée » hors ligne). L'ordre est prouvé par des tests sur `ordreClassement` et `etalerParGroupes`, que `matchProjects` utilise à chaque étape, dont le cas demandé : commune confirmée à couverture partielle contre commune à la limite à couverture complète.
- Observé, préexistant sur `main`, non corrigé : le bloc de questions propose « Pourquoi Paris ressort en premier ? » même en exploration, et Paris (1ᵉʳ arrondissement, moins de 25 000 habitants dans une très grande agglomération) reçoit l'identité « aux portes d'une grande ville ».
- `vie_locale` garde son `?? 0` hors rétablissement : `null` y code des communes sans aucun lieu ni association recensés, un zéro mesuré. Hœnheim (11 469 habitants) en fait partie, ce qui ressemble à un trou de source (Alsace-Moselle) : à vérifier hors FUT-109.

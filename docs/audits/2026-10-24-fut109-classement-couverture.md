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

**Choix assumé.** Une commune entièrement mesurée mais « à la limite » d'une condition non négociable passe devant une commune confirmée dont une priorité n'est pas mesurée : la couverture organise les groupes, et à l'intérieur de chacun l'ordre historique (confirmées d'abord) est conservé. Le badge « à la limite » reste affiché.

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

## 7. Limites

- Le score affiché n'est jamais chiffré à l'écran : seul le palier l'est, et il est réservé aux couvertures complètes.
- La carte n'a pas été vérifiée dans un navigateur : le parcours « Où vivre » appelle le modèle pour analyser le projet, et aucun appel Anthropic n'était autorisé. Le texte de la carte est couvert par un test de source.
- `vie_locale` garde son `?? 0` hors rétablissement : `null` y code des communes sans aucun lieu ni association recensés, un zéro mesuré. Hœnheim (11 469 habitants) en fait partie, ce qui ressemble à un trou de source (Alsace-Moselle) : à vérifier hors FUT-109.

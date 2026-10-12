# FUT-75 · Le geste du relevé : le langage motion de futur•e

Date : 12 octobre 2026 · Branche : `feat/fut-75-motion-releve`, depuis `origin/main` (`9cd6a34c`, FUT-92 #49).
Statut : **prototypes pour revue.** Tout vit dans `/dev/fut75` (404 en production) et
`src/components/prototypes/fut75/`. Aucun fichier de production n'est modifié, `DECISION_RELEVE`
n'est pas activé, aucune dépendance n'est ajoutée.

La planche (vidéos, images de chaque variante, URL pour les retrouver) : `docs/audits/fut75-motion/README.md`.

## 1. Audit de l'existant

**Ce qui bouge déjà.**
- Le repère « Explorer le dossier » (`EchelleNavigator`) : au pointage, la trame de l'échelle visée monte,
  les autres tombent presque à zéro, en 180 ms d'opacité. Le seul mouvement du hub relevé, et il est bon.
- La bande « mémoire du lieu » (`TerritoryYearsBand`) : un passage chronologique à l'entrée dans l'écran,
  45 années à 145 ms d'écart, soit **environ 6,7 s** avant que la bande soit complète. Trop long au regard
  de la règle « rien n'attend le mouvement » ; à revoir quand Territoire passera au relevé.
- `PriorityControlActions` fait défiler jusqu'à la carte visée (doux, ou immédiat en mouvement réduit),
  `EvidenceArrival` désigne brièvement la carte d'arrivée d'une preuve.
- Les pages publiques et l'accueil portent 30 `@keyframes` (bandeaux, survols, entrées) hors du relevé.
- Aucune bibliothèque d'animation dans le dépôt. 17 fichiers gèrent déjà `prefers-reduced-motion`.

**La règle qui encadre tout.** `DESIGN.md` § 6.4 : « Aucune donnée ne s'anime. Un chiffre qui défile
avant de se poser suggère que le résultat est un tirage. » § 9.3 l'inscrit parmi les interdits. Ce lot
en fait le premier principe du système plutôt qu'une contrainte à contourner.

**Ce qui doit rester immobile.** Toute valeur (chiffre, barre, position d'un jalon), le verdict, les
preuves et leurs liens, les textes de limite, la mise en page (aucun élément ne doit sauter).

**Où un mouvement aide à comprendre.** L'emboîtement des échelles et ce que la lecture a réellement
examiné ; la distance dans le temps entre deux horizons ; la raison pour laquelle des informations
sont rapprochées (le chemin d'un constat).

**Où il risque de tromper ou d'agacer.** Un compteur entre deux horizons (fausse continuité) ; un
« zoom de carte » sur un schéma (fausse géographie) ; une conclusion qui « se calcule » sous les yeux
(fausse intelligence) ; une ouverture rejouée à chaque visite (bruit) ; tout ce qui retarde la lecture.

## 2. Le mini-système retenu : le geste du relevé

Source unique : `src/components/prototypes/fut75/motion.ts` (logique pure, testée) et
`motion.module.css` (jetons `--m-*`), alignés par le test M1.

**Quatre principes.**
1. **Le repère bouge, la donnée reste.** Un curseur, un cadre, une emphase, un trait de relation se
   déplacent. Une valeur ne défile jamais, une barre ne s'étire jamais, rien n'est tracé entre deux
   jalons. Une valeur change d'un bloc, par un fondu de 120 ms au plus.
2. **Tracer, c'est avoir parcouru.** Un trait ne se dessine que pour ce que le moteur a réellement
   examiné ou enchaîné. Ce qui n'a pas été examiné se **pose** en pointillé, sans être tracé.
3. **Rien n'attend le mouvement.** Textes et liens existent et sont lisibles au premier rendu ; le
   mouvement ne porte que des couches de repère (`aria-hidden`). Le premier geste du lecteur
   (pointage, focus, pression, touche) termine une séquence en cours.
4. **Une seule courbe, pas de rebond.** Un instrument de mesure se pose ; le rebond dit l'imprécision.

**Durées.**

| Jeton | Durée | Usage |
| --- | --- | --- |
| `--m-micro` | 120 ms | réponse au pointage, au focus, à la pression : teinte, épaisseur, fondu d'une valeur |
| `--m-etat` | 240 ms | un repère qui change de place : curseur d'horizon, cadre d'échelle, onglet |
| `--m-trace` | 520 ms | un trait qui se dessine : forme parcourue, relation entre deux étapes |
| `--m-plafond` | 900 ms | durée maximale d'une séquence entière, ouverture comprise |

**Courbes.** `--m-releve` `cubic-bezier(0.2, 0.7, 0.2, 1)` : départ franc, arrivée posée (tout ce qui
arrive). `--m-sortie` `cubic-bezier(0.4, 0, 1, 1)` : ce qui libère la place. Aucun ressort.

**Formes.** Pas de morphing d'une forme en une autre : cercle, carré et losange gardent leur identité
d'échelle (DESIGN.md § 7). Ce qui change de forme, c'est le **cadre** qui les désigne (réticule), ou le
**trait** qui les parcourt (tracé `stroke-dashoffset`, `pathLength="1"`).

**Textes.** Un texte ne se déplace pas et ne s'écrit pas lettre à lettre. Il change de teinte (encre ou
discret) en 120 ms, ou se remplace d'un bloc par un fondu de 120 ms.

**Données.** Seules les propriétés de repère s'animent (`transform`, `opacity`, `stroke-dashoffset`,
teintes). Test M10 : la feuille et les appels `animate()` sont inventoriés.

**Clic, focus, toucher.** Pointage et focus clavier déclenchent le même geste. Sur écran tactile, il n'y
a pas de survol : le geste suit la pression ou le focus, et la navigation reste immédiate.

**Mobile.** Mêmes durées ; aucun élément collant ni flottant ; les dessins se recalculent à la largeur
réelle (`ResizeObserver`), les libellés se raccourcissent sous 480 px.

**Mouvement réduit.** Trois modes, portés par `data-mouvement` :
- `anime` : le langage complet ;
- `reduit` (préférence système, ou simulée sur le banc) : aucun déplacement ni tracé, état final
  immédiat, seuls des fondus de 120 ms au plus ;
- `aucun` : la version sans animation, aucune transition.

**Performance.** Rien que des propriétés composées ; aucune boucle `requestAnimationFrame`, aucun
écouteur de défilement ; les séquences en Web Animations (annulables, `finish()` au premier geste) ;
les transitions d'état en CSS (elles se reprennent d'elles-mêmes quand on change d'avis en route).
Budget : 60 i/s sur un poste ordinaire, une tâche de déclenchement sous 50 ms en production.

**Outils comparés.** CSS natif (transitions d'état, interruptibles par nature, zéro octet) ; Web
Animations API (séquences de tracé, contrôlables, zéro octet) ; Motion (ex-Framer Motion, ~30 à 50 Ko,
ressorts et mise en page partagée) et GSAP (~70 Ko, chronologies). Aucun besoin ici que les deux
premiers ne couvrent : **aucune dépendance ajoutée** (test M11). Une bibliothèque ne se justifierait que
pour des transitions de mise en page entre routes, que ce lot n'aborde pas.

## 3. Les trois prototypes

### A · Le lieu qui se révèle (`RepereAnime`)

Le repère de production (mêmes formes, trames, masques, destinations et textes), copié pour étude.
- **Ouverture** : du logement au territoire, seules les échelles examinées se tracent (décalées de
  190 ms, 900 ms en tout) ; dossier communal : Autour et Logement se posent en pointillé.
- **A1 · réticule** : quatre coins viennent cadrer exactement le périmètre pointé (calcul `cadreDe`
  depuis la géométrie de production), avec son grain détouré.
- **A2 · recul** : le schéma s'agrandit pour que la forme choisie remplisse le cadre, avec la mention
  « Schéma sans échelle : l'agrandissement ne représente aucune distance ».
- A0 : le comportement de production, pour comparer.

### B · Explorer le temps (`RegleDesHorizons`)

Les médianes DRIAS-TRACC (17 modèles) de Nîmes, Rennes et Strasbourg : jours au-dessus de 35 °C et
nuits tropicales, aux trois horizons, avec la référence 1976-2005 en bande et le seuil de signalement.
- **B1 · curseur** : le curseur glisse sur la règle du temps jusqu'au jalon choisi ; le jalon passe à
  l'encre ; la lecture (valeur, palier France, position face au seuil) change d'un bloc.
- **B2 · curseur et trace** : l'horizon quitté laisse un repère pâle, et la lecture cite sa valeur en
  toutes lettres (« 2050 : 14 ») : on compare sans tracer de pente.
- L'horizon du dossier (2050) est marqué d'un anneau ; la mention dit que le dossier se prononce là.
- Groupe d'horizons au motif radio (flèches qui bouclent, Début, Fin, un seul arrêt de tabulation).

### C · Du fait à la décision (`CheminDeLaDecision`)

Le chemin réel de la composition « confort d'été » d'un dossier d'adresse public (hôtel de ville de
Nîmes) : priorité déclarée (« des étés plus frais », 3 sur 3), projection DRIAS à 2050 et ses deux
preuves, convention (seuils 8 et 25, franchis), conclusion, limite, geste au bâtiment.
- La conclusion est **en tête**, lisible avant tout geste.
- Un rail fait **converger** les trois fondements vers la conclusion, puis s'en **sépare** vers la
  limite (pointillé) et le geste (trait plein).
- **C1 · pas à pas** : boutons et flèches ; chaque étape retrace sa voie à l'encre, le focus suit
  l'étape, les étapes à venir restent lisibles (contraste réduit, jamais masquées).
- **C2 · d'un trait** : le chemin entier en 900 ms. **C3 · statique** : la version numérotée sans
  mouvement.
- **Ce que C s'interdit** : le moteur ne relie aucune donnée du bâtiment (DPE, année de construction) à
  la chaleur. Le bâtiment n'apparaît donc qu'à l'étape 6, comme le lieu de la vérification. Montrer un
  lien que le moteur n'a pas fait aurait été fabriquer une causalité.

## 4. Évaluation critique

Notes de 1 (faible) à 5 (fort) ; pour « risque éditorial », 5 = risque le plus bas.

| | A1 réticule + ouverture | A2 recul | B2 horizons | C1/C2 chemin |
| --- | --- | --- | --- | --- |
| Compréhension | 3 : l'emboîtement, et surtout ce qui n'a pas été examiné (pointillé) | 2 : spectaculaire, mais cache le contexte | 5 : ce qui est connu, où, et à quelle distance dans le temps | 5 : pourquoi ces informations sont rapprochées |
| Singularité | 4 : les coins de coupe de la plaque, la trame de production | 3 | 5 : la règle du temps en jalons, propre au relevé | 5 : aucun équivalent dans les produits comparables |
| Effet wow | 3 : l'ouverture, la première fois | 4 | 4 : on a envie de basculer d'un horizon à l'autre | 4 en C2, 3 en C1 |
| Sobriété à l'usage | 3 : l'ouverture lasse si elle se rejoue à chaque visite | 2 | 5 : 240 ms, déclenché par le lecteur seulement | 4 : déclenché à la demande |
| Performance | 5 | 5 | 4 : deux graphiques redessinés (aucune tâche longue en prod. ; 93 à 147 ms processeur ralenti 6 fois) | 5 |
| Sans animation | 5 : identique, l'information est dans la liste | 5 | 5 : tout reste lu par la lecture et les jalons | 5 : C3 dit tout |
| Risque éditorial | 4 | 2 : lu comme un zoom de carte malgré la mention | 4 : sûr, tant que l'écart entre modèles manque, il faut le dire | 4 : la convergence peut suggérer un calcul en direct ; la conclusion en tête l'empêche |

**Classement.**
1. **C · Du fait à la décision** (C1 pour lire, C2 pour le geste « Voir le chemin »). C'est la promesse
   de futur•e rendue visible : une interprétation reliée à ses fondements, ses limites et ce qu'il reste
   à faire. Elle s'intègre directement dans une carte du relevé, sur la surface déjà livrée.
2. **B · Explorer le temps** (B2). Le meilleur moment de curiosité, scientifiquement propre. Sa place
   est le module Territoire, qui n'est pas encore passé au relevé : à intégrer avec cette migration.
3. **A · Le lieu qui se révèle**, en version réduite : **A1 réticule** au pointage (peu coûteux, à
   fondre dans `EchelleNavigator`) et l'**ouverture une fois par session**. **A2 recul est écarté** :
   trop proche d'un zoom de carte, et il fait disparaître les autres échelles.

**Recommandation.** Une seule animation d'abord : **C**, en option « Voir le chemin de ce constat »
sur les cartes du relevé qui portent une composition, avec C3 comme rendu par défaut en mouvement
réduit. Ensuite B avec la migration de Territoire. A1 en retouche du repère, sans urgence.

## 5. Tests réellement exécutés

- **Unitaires** : 11 tests (`motion.test.ts`, M1 à M11) ; trois mutations volontaires détectées (une
  valeur qui grandit, un horizon interpolé, une échelle non examinée tracée).
- **Inventaire de ce qui s'anime**, pendant chaque geste : seuls `transform`, `opacity`,
  `stroke-dashoffset` et des teintes ; aucune position ni taille de jalon, aucune valeur.
- **Mouvement réduit** (préférence système émulée) : les trois prototypes passent en `reduit`, curseur
  à 0 s, aucun tracé ; **sans animation** : aucune animation dans le document.
- **Clavier** : liens du repère atteignables pendant l'ouverture (aucune animation en cours au focus) ;
  groupe d'horizons (flèches, bouclage, Début, Fin, sortie par Tab) ; chemin (flèches, focus sur l'étape,
  jamais sous la navigation).
- **Interactions rapides et interruption** : pointages à 110 ms d'intervalle, choix d'horizons à 120 ms,
  ouverture interrompue par un pointage (vidéos A et B).
- **Largeurs** : 360, 390, 1024, 1280 × 600, 1440 : aucun débordement propre aux prototypes.
- **Performance** (build de production local, mesures `requestAnimationFrame` et tâches longues) :
  59 à 60 i/s et aucune tâche longue sur un poste ordinaire ; processeur ralenti 6 fois : une tâche de
  50 à 150 ms au déclenchement, puis 42 à 57 i/s. B est le plus coûteux.
- **Vidéos** : six MP4 en temps réel (ordinateur 1280 × 800 et mobile 390 × 844), interactions réelles.
- Suite complète, TypeScript, lint et build Webpack : voir le compte rendu de livraison.

## 6. Difficultés rencontrées

- **Enregistrement vidéo** : Chrome headless ajoutait une bande grise sous la page ; corrigé par
  `--window-size`, et contrôlé image par image (0 image défectueuse).
- **Un faux défaut de défilement** sur mobile venait de l'automate (cible sous la navigation collante),
  pas du composant : vérifié par un clic programmatique, sans défilement.
- **La donnée manquante du prototype B** : DRIAS ne fournit ici que la médiane des modèles. L'écart
  entre modèles n'est pas représentable sans enrichir les données ; le prototype le dit en toutes lettres.

## 7. Décisions ouvertes

1. **Amender `DESIGN.md` § 6.4** avec les quatre principes et les jetons (l'interdit reste, il gagne un
   « ce qui est permis »).
2. **Ouverture du repère** : une fois par session, ou jamais en production ?
3. **Point d'entrée de C** : sur chaque carte à composition, ou seulement sur la carte qui fonde le verdict ?
4. **Incertitude des horizons** : ajouter l'écart entre modèles (P10 à P90) aux données DRIAS avant
   d'intégrer B, ou intégrer B avec la mention actuelle.
5. **Bande « mémoire du lieu »** : raccourcir son passage de 6,7 s à moins d'une seconde lors de la
   migration de Territoire.

## 8. Trouvé en route, hors de ce lot

- **La `Navbar` déborde de 36 px à 1024 px de large** (bloc d'actions), sur toutes les pages, accueil
  compris. Sans lien avec FUT-75 ; signalé, non corrigé.
- **Vérification de FUT-92 tel que fusionné** (`9cd6a34c`, modifié après ma livraison) : voir le compte
  rendu ; le code est sain, deux points de documentation et une règle CSS morte restent à nettoyer.

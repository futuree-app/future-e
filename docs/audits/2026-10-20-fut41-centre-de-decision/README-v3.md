# FUT-41 / FUT-22 · V3 du centre de décision : un sens de lecture, et « Faire le point »

20 octobre 2026 · branche `explore/fut-41-centre-decision` · prototype de revue, données fictives.

- Prototype : [`prototype-v3.html`](prototype-v3.html) (lien partageable : https://raw.githack.com/futuree-app/future-e/explore/fut-41-centre-decision/docs/audits/2026-10-20-fut41-centre-de-decision/prototype-v3.html)
- Captures : [`captures-v3/`](captures-v3/)
- Inchangés : `README.md` (cadrage A à F), `prototype.html` (V1), `README-v2.md` et `prototype-v2.html` (V2).
- Référence visuelle : la grammaire du Relevé proposée par FUT-118 (PR #71, `DESIGN.md` v3.0, `grammaire-du-releve.md`), lue sur sa branche sans la récupérer ni la fusionner. Ses principes stables sont tenus ; ses hypothèses (§ 8.2) sont traitées comme des hypothèses.

Rien n'a été migré, écrit en base, payé, généré ni déployé. Aucun appel Anthropic : les « versions rédigées » sont des textes écrits à la main, affichés tels quels et marqués « simulation ».

---

## A. Diagnostic de hiérarchie de la V2

Fondé sur `captures-v2/01-vue-initiale-sombre.png` et `03-deux-possibilites-rapprochees.png`.

**Ce qui attire le regard en premier.** Le titre du Projet en taille d'affichage, puis les trois grands cercles gradués de la planche. Les deux disent « regardez-moi » ; aucun ne dit où en est la recherche.

**Les éléments concurrents.** Sur le premier écran à 1440 px, sept blocs se disputent le même niveau : titre du Projet, six lentilles en deux groupes, ligne du budget, frise « Depuis votre visite », planche, colonne « Maintenant » (six points, chacun avec un titre, une raison et un ou deux boutons), indice de geste. La colonne « Maintenant » a la même hauteur que la planche et une typographie plus forte : c'est une deuxième interface.

**Les zones trop denses.**
- La colonne « Maintenant » : six raisons, huit boutons.
- Le rapprochement : neuf pistes de même poids, rangées par échelle. Pour deux biens, il faut traverser six lignes de Territoire avant d'atteindre le seul compromis d'Autour.
- Les grandes formes : 230 px par commune, avec un texte placé sous elles qu'il faut lire pour savoir de quel lieu il s'agit.

**Le chemin de lecture réel.** Titre, cercles, colonne de droite, retour aux cercles pour comprendre ce qu'ils sont, lecture des noms sous les cercles. Le lecteur fait deux allers-retours avant de savoir ce qu'il regarde.

**Un défaut de fond (E).** Dans `03`, les pistes hors cadre portent des marques teintées (vert « correspond » contre violet « moins bien que demandé »). La phrase dit « ne s'interprète pas encore », mais le dessin montre une opposition.

**Ce qui devait devenir secondaire.**
- La frise des événements, tant qu'elle ne contient rien d'important.
- Les poids des priorités : ils restent dans les lentilles, mais ne forment plus un bloc à part.
- Les cinq derniers points de « Maintenant ».
- Les bandes Territoire, Autour et Logement du rapprochement, qui deviennent un dépliant.
- Les grandes compositions, qui ne restent que dans la fiche d'un lieu.

---

## B. Proposition UX V3

### La question du premier écran

« Je reviens dans futur•e. Où en est ma recherche, et que puis-je faire maintenant ? » La V3 y répond dans cet ordre, de haut en bas et de gauche à droite.

| Question | Où l'écran y répond |
| --- | --- |
| **Où suis-je ?** | Une bande « Votre Projet » : la phrase (taille de titre, plus d'affichage), la révision et son historique sur une ligne, le budget « non mesuré » à droite, et les six conditions en lentilles sur une seule ligne. |
| **Qu'est-ce que je regarde ?** | À gauche, la planche resserrée : une ligne par lieu, un petit emblème, un nom, un état, et **une seule** ligne de statut. À droite, « Où en est votre recherche » : deux phrases. |
| **Que puis-je faire ?** | Trois gestes visibles : **Faire le point** (seul bouton plein de l'écran), **ouvrir un lieu**, et **Prochain pas** (deux au plus, « 4 autres » à la demande). |

### Le geste central

Ouvrir un lieu, puis le rapprocher d'un autre. Quand un lieu est ouvert, chaque autre ligne de la planche affiche un bouton « ⟷ Rapprocher » ; la fiche porte aussi « Rapprocher avec » en tête (c'est le chemin sur mobile, où la fiche couvre la liste). Le second choix devient explicite, alors qu'en V2 il fallait deviner qu'un second toucher rapprochait.

### La navigation : une seule zone de lecture, un fil de retour

La planche reste visible à gauche (colonne collante) ; à droite, une seule zone de lecture montre **l'accueil**, **Faire le point**, **une fiche** ou **un rapprochement**. Un fil en tête (« ← Ma recherche », « ← Faire le point ») remonte d'un niveau à la fois ; Échap fait de même. Sous 1024 px, la lecture passe dans une feuille plein écran, la liste reste dessous, et l'accueil se place au-dessus de la liste.

### Le rôle de chaque pièce

| Pièce | V2 | V3 |
| --- | --- | --- |
| **Planche** | Grandes formes, 230 px par commune ; texte sous la forme | Liste groupée par commune ; emblème de 34 px, toujours le même (cercle, carré, losange ; plein si lu, pointillé sinon) ; légende d'une ligne en tête ; lentilles qui recolorent les emblèmes en place. Deux biens d'une même commune sont rangés sous un en-tête de commune, avec un filet commun |
| **Grande composition** | Partout | Seulement dans la fiche d'un lieu, où ses formes filtrent les conditions par échelle : c'est là qu'elle sert |
| **Rapprochement** | Neuf pistes de même poids, par échelle | Cinq sections dans l'ordre des questions : ce qui les départage ; ce qui ne peut pas encore être conclu ; vos conditions sans compromis ; ce qu'ils ont en commun (replié) ; toutes les conditions échelle par échelle (replié). Conditions rangées comme le Projet, toutes échelles confondues |
| **Maintenant** | Colonne de six points | « Prochain pas » : deux au plus, une phrase et un lien, sous l'accueil. Les vérifications vivent aussi dans « Faire le point » et dans les fiches |
| **Faire le point** | Absent | Lecture d'ensemble à la demande, à la place de l'accueil (voir plus bas) |
| **Preuves** | Ouvertes sous une piste | Inchangées, et accessibles depuis chaque phrase du point |
| **Historique** | Frise permanente | Une ligne repliée « Depuis votre visite du… », et une section « Ce qui a changé » dans le point quand la dernière visite date de plus de deux semaines |

### Hors cadre : visuellement non comparable

Deux analyses produites sous deux versions du Projet **ne se comparent plus du tout**, même quand leurs issues coïncident (V2 les déclarait « en commun »). Dans le rapprochement, leur piste n'a ni ligne, ni teinte, ni mot d'issue : deux formes en pointillé gris, « Révision 2 · 9 oct. », un « ≠ », « Révision 1 · 19 sept. ». Ouvrir la piste montre les **états historiques** (valeur, source, analyse et date de chaque côté), précédés d'une phrase qui dit que leur écart ne dit pas lequel convient mieux aujourd'hui. Sur la planche, une lentille laisse sans teinte un lieu lu sous une autre version. Le test du parcours vérifie qu'aucune marque hors cadre ne porte de teinte.

### « Faire le point » : sa place

Les trois hypothèses du brief sont combinées sans produire trois synthèses :

1. **La lecture d'accueil** (hypothèse 1) est faite des deux premiers énoncés du point : combien de possibilités sont en jeu, et la limite la plus importante (condition sans compromis non tenue, sinon analyses hors cadre, sinon aperçu partiel, sinon ce qui sépare). Ce n'est pas un autre texte : c'est le début du même.
2. **« Faire le point »** (hypothèse 2) se demande. Il remplace l'accueil dans la zone de lecture et laisse la planche visible. Il a deux formes : la **lecture établie** (énoncés numérotés, preuves en marge) et la **version rédigée** (simulation, voir C et D).
3. **Le rapprochement** (hypothèse 3) ouvre sur la phrase « Ce qui les sépare », qui est **le même énoncé** que celui du point pour cette paire. Une seule source de texte.

Chaque phrase du point est une porte : « le calme » ouvre le rapprochement des deux lieux, la condition sous lentille, et la piste avec ses preuves ; « révision 1 » ouvre l'historique du Projet ; « Ce qui permettrait de les comparer » lance la mise au même cadre (simulation) ; « un médecin disponible » ouvre la fiche, la condition dépliée et sa vérification. Le fil ramène au point.

### Pourquoi la V3 est plus simple que la V2

- **Un seul bouton plein** et une seule phrase à lire en arrivant, au lieu de sept blocs au même niveau.
- **Les lieux se lisent par leur nom** : la forme les accompagne, elle ne les remplace plus.
- **Une seule zone de lecture** : la V2 avait un panneau, une zone de rapprochement sous la planche et un tableau en bas de page.
- **Le rapprochement répond d'abord à la question posée** (« qu'est-ce qui les départage ? ») et range le reste derrière deux dépliants.
- **Le guidage n'est plus une colonne** : deux prochains pas, et les vérifications là où elles servent.

---

## C. Le prototype

`prototype-v3.html`, un seul fichier, aucune dépendance hors Google Fonts. Menu « Données fictives » ou paramètre `?situation=` : `recherche`, `une`, `deux`, `horscadre`, `meme`, `libre`, `bloquant`, `dix`, `mois`.

| Ce que le brief demande | Dans le prototype |
| --- | --- |
| Manipuler les possibilités | Ouvrir, écarter (avec la raison et la version du Projet), reprendre, ajouter (deux ajouts préparés), filtrer quand il y en a plus de quatre |
| Sélectionner deux lieux | « ⟷ Rapprocher » sur une ligne, ou « Rapprocher avec » dans la fiche |
| Changer de condition | Les six lentilles de la bande du Projet ; « Et si je la mettais de côté ? » pour une priorité |
| Ouvrir et refermer les preuves | Chaque piste, chaque condition d'une fiche |
| Le parcours simplifié | Accueil, fiche, rapprochement en cinq sections, fil de retour |
| Déclencher « Faire le point » | Bouton de l'accueil, ou lien du fil depuis une fiche ou un rapprochement |
| Naviguer depuis la synthèse | Chaque lien d'énoncé et chaque lien de la version rédigée ; les numéros d'appel de la version rédigée renvoient à l'énoncé et à ses fondements |

**Le code sépare les deux étapes du point** (`prototype-v3.html`, section « FAIRE LE POINT ») :
- `contrat()` calcule l'état structuré : candidats, profondeur de lecture, versions de chaque analyse, hors cadre, conditions sans compromis non tenues, inconnues, observations, écartées, priorités mises de côté.
- `lecture(contrat)` produit des énoncés déterministes rangés en cinq sections (ce qui a changé ; ce qui reste en jeu ; ce qui se compare ou ce qui est établi ; ce qui ne peut pas encore être conclu ; ce qui ferait avancer), chacun avec ses fondements.
- `cleLecture(contrat)` est la clé de cache : révision du Projet, candidats, versions de leurs analyses (simulées ou non), nombre d'observations, priorités mises de côté, écartées, et date de la dernière visite quand « Ce qui a changé » s'affiche. Une lentille, une sélection ou un clic ne la changent pas.
- `REDIGE` contient une version rédigée par situation, avec la clé pour laquelle elle a été préparée. Si la clé ne correspond plus (par exemple après « Relire sous la révision 2 »), elle n'est pas affichée : la page dit qu'elle est périmée et renvoie à la lecture établie (capture 18).

**Tests du parcours** (Playwright, Chrome, hors dépôt) : neuf situations, cinq largeurs (1440, 1024, 820, 390, 360) ; chaque lien de chaque lecture établie et rédigée cliqué ; rapprochement déplié et quatre preuves ouvertes ; aucune erreur JavaScript, aucun défilement horizontal de la page ni de la feuille. Le parcours vérifie aussi :
- que la phrase de séparation reprend l'issue exacte de chaque lieu (principe 7 de FUT-118) ;
- qu'aucune marque hors cadre n'est teintée ;
- que tout renvoi de la version rédigée existe dans la lecture établie ;
- que la version rédigée devient périmée après la mise au même cadre, et qu'une lentille ne la périme pas ;
- que la tabulation atteint « Faire le point », les lieux et les lentilles avec un focus visible ;
- qu'avec le mouvement réduit, toutes les durées valent zéro.

---

## D. Scénarios de synthèse

Pour chaque situation : les faits autorisés (le contrat), les énoncés qui en découlent, la version rédigée simulée, ses limites et les phrases interdites. Les énoncés complets, avec leurs fondements, sont dans le prototype (« Faire le point », lecture établie).

### Règles communes au contrat

Une synthèse, déterministe ou rédigée, **peut** :
- citer une issue établie avec son échelle et la version de son analyse ;
- citer une valeur présente dans une preuve du contrat, par exemple « une ligne de bus devant la façade » ;
- rappeler un poids déclaré ;
- relier un écart à une vérification proposée ;
- dire qu'une chose n'est pas sue, avec sa raison.

Elle **ne peut pas** :
- comparer deux analyses de révisions différentes ;
- faire d'une issue « à vérifier » un avantage ou un défaut ;
- additionner, classer ou désigner un gagnant ;
- atténuer une condition sans compromis non tenue ;
- faire d'une observation personnelle une donnée ;
- dire qu'une donnée a changé parce que le temps a passé ;
- présenter un examen payant comme la réponse à une inconnue ;
- inventer une valeur, une source ou une date.

Chaque phrase rédigée porte la liste des énoncés qui la fondent ; un renvoi absent est une erreur visible, et testée.

### 1. Une seule possibilité (`une`)

- **Faits autorisés.** 12 rue des Sternes, lu aux trois échelles sous la révision 2. Correspond : la mer, la gare (abords), la vie de quartier. Compromis : le calme (abords). À vérifier : un médecin disponible (commune), les nuits fraîches (logement). Deux observations, et un budget non mesuré.
- **Version rédigée.** « Le 12 rue des Sternes est pour l'instant votre seule possibilité : il n'y a rien à départager. Il répond à votre souhait de vivre près de la mer, la gare reste à portée depuis ses abords et la commune offre une vie de quartier. Le calme y demande un compromis : une ligne de bus passe devant la façade. »
- **Limite.** Aucune comparaison ; la synthèse propose d'ajouter une possibilité pour situer celle-ci.
- **Interdit.** « Un bon choix », « mieux que la moyenne », toute comparaison à des lieux absents.

### 2. Deux possibilités comparables (`deux`)

- **Faits autorisés.** Ploubrec et Locmaner, communes, révision 2 toutes deux. Séparent :
  - la gare : Ploubrec correspond, Locmaner compromis ;
  - les nuits fraîches : Ploubrec correspond, Locmaner moins bien que demandé ;
  - la vie de quartier : Ploubrec compromis, Locmaner correspond.

  En commun : la mer, le calme. Établi d'un seul côté : un médecin (Locmaner correspond, Ploubrec à vérifier). Poids déclarés : gare 3, nuits 2, vie 1.
- **Version rédigée (extrait).** « Ce qui les sépare dessine un compromis. […] Vous avez déclaré la gare et les nuits fraîches plus importantes que la vie de quartier ; futur•e ne fait pas ce calcul à votre place. »
- **Liens.** Chaque condition ouvre sa piste avec ses preuves (capture 07).
- **Interdit.** « Ploubrec l'emporte deux à un », « Ploubrec est préférable », toute addition des écarts pondérés par les poids.

### 3. Deux possibilités hors cadre (`horscadre`)

- **Faits autorisés.** 31 route de Kervily (commune 17 sept., adresse 19 sept., révision 1) et 12 rue des Sternes (révision 2). Huit lectures croisées sous deux versions. Seul changement entre les versions : la gare, de 20 à 30 min. À vérifier : un médecin, dans les deux communes ; les nuits fraîches au 12 rue des Sternes. Visite prévue le 24 oct.
- **Version rédigée (extrait).** « Sur les huit lectures où ils se croisent, un écart comme un accord peut tenir à ce changement plutôt qu'aux lieux. Les relire sous la même version rendrait la comparaison possible ; d'ici là, leurs issues restent consultables, chacune à sa date. »
- **Liens.** « Les relire » lance la simulation ; « révision 1 » ouvre l'historique du Projet.
- **Interdit.**
  - « Kervily est plus calme. »
  - « Sternes est mieux desservie. »
  - « Les deux sont proches de la mer », un accord est aussi une comparaison.
  - Toute phrase qui oppose leurs issues.

### 4. Deux biens dans une même commune (`meme`)

- **Faits autorisés.** Port-Anvel, une seule analyse pour les deux biens. Aux abords : le calme est un compromis rue des Sternes (ligne de bus) et correspond allée des Goélands (en retrait de la départementale). La gare est commune aux deux. Dans le logement : les nuits fraîches sont à vérifier rue des Sternes et un compromis aux Goélands (appartement sous toiture).
- **Version rédigée (extrait).** « Le 12 rue des Sternes et le 5 allée des Goélands sont tous deux à Port-Anvel : ce qui se lit à la commune leur est commun et ne peut pas les départager. Leur différence se joue à l'adresse. »
- **Interdit.** Répéter les six faits communaux pour chacun ; dire « les deux ont un médecin à vérifier » comme deux constats distincts.

### 5. Une commune non débloquée (`libre`)

- **Faits autorisés.** Kermoal n'est lue que par l'aperçu gratuit, trois conditions sur six, sans départage. Le 12 rue des Sternes est examiné.
- **Version rédigée (extrait).** « Aucune comparaison n'est donc possible. Ce que l'aperçu ne lit pas reste inconnu, et n'est ni un avantage ni un défaut de Kermoal. »
- **Limite.** La synthèse ne propose pas d'achat. Le geste « Examiner » reste dans la fiche, en simulation, avec la mention que le prix et le périmètre seraient expliqués.
- **Interdit.**
  - « Débloquez Kermoal pour savoir. »
  - « Kermoal semble moins adaptée. »
  - Une conclusion tirée des trois constats de l'aperçu.

### 6. Dix possibilités (`dix`)

- **Faits autorisés.**
  - Ne tient pas : Bréhan-Coët, condition sans compromis.
  - Hors cadre : Saint-Aurec, avec le 31 route de Kervily et le 8 quai des Thoniers.
  - Aperçu seul : Kermoal ; sans adresse : l'impasse du Lavoir.
  - Comparables à la commune : Port-Anvel, Ploubrec et Locmaner, qui diffèrent sur la gare, les nuits fraîches, le calme et la vie de quartier.
  - À l'adresse : deux biens comparables, dans la même commune.
  - Écartée : Landéven, sous l'ancienne limite.
- **La forme.** Pas de mini-synthèse par lieu. La lecture trie les lieux par ce qui empêche ou permet une comparaison, puis propose deux rapprochements dans le même cadre (« 12 rue des Sternes et 5 allée des Goélands, ou Ploubrec et Locmaner »), choisis par type et par ordre d'ajout, jamais par mérite.
- **Interdit.** « Les trois meilleures possibilités », un ordre de préférence, un compte de points favorables par lieu.

### 7. Retour après un mois (`mois`)

- **Faits autorisés.** Ceux du journal depuis le 19 sept. :
  - la révision du Projet du 8 oct. ;
  - trois ajouts ;
  - l'examen et la visite du 12 rue des Sternes ;
  - Landéven écartée ;
  - le passage à engine-6 le 19 oct., sans relecture des analyses.
- **Version rédigée (extrait).** « Le moteur de futur•e a évolué le 19 octobre, mais vos analyses n'ont pas été relues : le temps écoulé n'en change aucune. Votre révision a une conséquence directe : le 31 route de Kervily et Saint-Aurec, lus avant elle, ne se comparent plus au 12 rue des Sternes tant qu'ils ne sont pas relus. »
- **Interdit.**
  - « Les données ont été mises à jour. »
  - « Le climat de Saint-Aurec a changé. »
  - Toute nouveauté qui n'est pas dans le journal.

### 8. Condition sans compromis non tenue (`bloquant`)

- **Faits autorisés.** Bréhan-Coët : littoral à 31 km, pour une condition « la mer à moins de 15 km ». Ses autres conditions correspondent, mais n'entrent pas en compte.
- **Version rédigée.** « Bréhan-Coët ne tient pas votre condition de vivre à moins de 15 kilomètres de la mer : le littoral y est à 31 kilomètres, et rien d'autre ne compense ce constat. »
- **Où cela se voit.**
  - Dans l'accueil, en tête, avec le trait « incompatibilité ».
  - Sur la planche, par la barre de l'emblème et la ligne « Ne tient pas ».
  - Dans le rapprochement, dans la première section.
- **Interdit.**
  - « Malgré la distance à la mer, Bréhan-Coët coche toutes les autres cases. »
  - « Un bon compromis. »
  - Toute formulation qui met la condition en balance.

### Ce que ces scénarios montrent de l'enrichissement IA

Sur ces neuf cas, la valeur d'une rédaction tient à trois gestes que le gabarit déterministe fait mal :
- **lier un écart à un poids déclaré**, sans additionner (cas 2) ;
- **regrouper** au lieu d'énumérer (cas 6 et 7) ;
- **dire une seule fois** ce que la lecture établie répète d'un énoncé à l'autre (budget, observations).

Les phrases qui informent le plus sont déjà dans la lecture établie.

---

## E. Captures

Toutes sont de vraies captures du prototype (Chrome, résolution double), en thème sombre sauf mention.

| # | Fichier | Ce qu'elle montre |
| --- | --- | --- |
| 01 | `01-premier-ecran.png` | Premier écran, bureau |
| 02 | `02-premiere-interaction-un-lieu-ouvert.png` | Un lieu ouvert : fiche à droite, « Rapprocher » sur les autres lignes |
| 03 | `03-deux-lieux-selectionnes.png` | Deux lieux sélectionnés |
| 04 | `04-rapprochement-simplifie.png` | Rapprochement en sections (page entière) |
| 05 | `05-faire-le-point-lecture-etablie.png` | Faire le point, lecture établie, preuves en marge |
| 06 | `06-faire-le-point-version-redigee.png` | Version rédigée (simulation), numéros d'appel |
| 07 | `07-de-la-phrase-a-la-preuve.png` | Depuis « nuits fraîches » : lentille, piste et preuves ouvertes |
| 08 | `08-analyses-hors-cadre.png` | Rapprochement hors cadre : sans teinte ni issue |
| 09 | `09-hors-cadre-etats-historiques.png` | États historiques d'une piste hors cadre, avec l'observation |
| 10 | `10-hors-cadre-faire-le-point.png` | La synthèse qui refuse de comparer |
| 11 | `11-meme-commune-rapprochement.png` | Deux biens de Port-Anvel : socle commun replié une fois |
| 12 | `12-commune-non-debloquee-faire-le-point.png` | Aperçu gratuit, sans incitation |
| 13 | `13-condition-sans-compromis-non-tenue.png` | Bréhan-Coët en tête de l'accueil |
| 14 | `14-dix-possibilites-faire-le-point.png` | Dix possibilités : une lecture d'ensemble |
| 15 | `15-dix-possibilites-lentille-calme.png` | Dix possibilités sous la lentille « le calme » |
| 16 | `16-retour-apres-un-mois.png` | « Ce qui a changé », version rédigée |
| 17 | `17-une-seule-possibilite-faire-le-point.png` | Une seule possibilité |
| 18 | `18-version-redigee-perimee.png` | Version rédigée périmée après la mise au même cadre |
| 19 | `19-tablette-820.png` | Tablette |
| 20 | `20-mobile-390-premier-ecran.png`, `20-mobile-360-…` | Premier écran mobile : l'état, le geste, puis les lieux |
| 21 | `21-mobile-390-faire-le-point.png`, `21-mobile-360-…` | Faire le point sur mobile, fondements repliés |
| 22 | `22-mobile-390-rapprochement.png`, `22-mobile-360-…` | Rapprochement sur mobile |
| 23 | `23-mobile-390-fiche.png` | Fiche sur mobile, « Rapprocher avec » en tête |
| 24 à 26 | `24-theme-clair-…`, `25-…`, `26-…` | Thème clair : premier écran, rapprochement, point |

---

## F. Autocritique et arbitrages

### Ce que la V3 simplifie réellement

- Le premier écran passe de sept blocs concurrents à trois zones (Projet, lieux, état) et un seul bouton plein.
- Le rapprochement montre d'abord ce qui départage : 3 pistes pour Ploubrec et Locmaner au lieu de 9.
- Le hors cadre ne se dessine plus comme une opposition.
- Une seule zone de lecture et un fil de retour remplacent un panneau, une zone basse et un tableau en bas de page.

### Ce qu'elle ne résout pas encore

1. **La planche perd une partie de sa singularité.** La liste se scanne mieux, mais ressemble davantage à une liste. L'identité tient aux emblèmes, à la légende et au regroupement par commune ; elle est plus faible qu'en V2.
2. **Le premier écran porte encore beaucoup de texte dans la situation par défaut.** La phrase sur le hors cadre fait trois lignes. Une forme plus courte demanderait un énoncé d'accroche distinct, donc un second texte à tenir juste.
3. **Les lentilles restent six boutons.** Sur mobile, elles défilent en ligne, et la cinquième n'est pas visible sans glisser.
4. **La lecture établie est longue** (13 énoncés pour dix possibilités). Elle est juste et fondée, mais se lit comme un relevé, pas comme un point.
5. **« Prochain pas » et « Ce qui ferait avancer » se recouvrent en partie.** Les deux viennent de règles différentes (guides V2 et énoncés V3) ; dans le produit, il en faudrait une seule source.
6. **Pas de vue géographique.** Une carte dirait les distances et les trajets que la planche ne dit pas. Elle n'aide pas à comprendre les arbitrages, et elle demanderait une donnée de tiers posée dans un emplacement (grammaire FUT-118, § 6). Elle est à étudier à part, comme complément de la fiche, pas comme vue principale.
7. **Non vérifiés** : Safari et WebKit, un écran non Retina réel, un lecteur d'écran réel.

### À distinguer pour décider

1. **L'UX de « Faire le point ».** C'est ce que le prototype permet de juger : une lecture demandée, qui remplace l'accueil, avec des phrases qui ouvrent les données. Elle fonctionne aussi **sans aucune IA**, avec la lecture établie.
2. **Le contrat déterministe.** C'est la pièce indispensable, et elle ne dépend pas de l'IA. Elle suppose dans le produit :
   - la persistance des candidats et de la version de chaque analyse (le cadrage A à F) ;
   - un énoncé par règle, testé sur le texte rendu (leçon du 25/07, `AGENTS.md`).
3. **L'enrichissement IA.** Le prototype ne prouve pas qu'une IA tiendrait le contrat : les versions rédigées ont été écrites à la main. Une vraie évaluation demanderait :
   - de générer sur ces neuf contrats ;
   - de vérifier automatiquement chaque phrase contre ses renvois et contre les interdits de D ;
   - de mesurer le taux de rejet.

   La mémoire du projet rappelle que des synthèses en production ont déjà enfreint leur prompt (audit compte réel, P0). Le gain de rédaction doit donc être mesuré, pas supposé.
4. **Coûts, déclencheurs, cache, droits commerciaux.** À étudier plus tard :
   - **Déclencheur.** Une génération seulement sur « Faire le point », et seulement si `cleLecture` a changé ; jamais sur une lentille ni sur une sélection.
   - **Cache.** Par compte et par clé.
   - **Repli.** La lecture établie s'affiche toujours, et tout de suite.
   - **Droits commerciaux.** Ouverts : la version rédigée est-elle gratuite, liée au Pass de recherche ou à un dossier ? Et que dit-elle d'une commune qu'on ne possède pas ? Le prototype ne tranche rien.

### Arbitrages demandés (V1 à V7)

| # | Question | Recommandation |
| --- | --- | --- |
| V1 | Retenir l'organisation V3 (Projet en bande, planche resserrée, une zone de lecture, fil de retour) comme base, à la place de la V2 ? | Oui. La V2 reste la référence pour la fiche et ses grandes formes |
| V2 | La planche resserrée suffit-elle, ou faut-il une bascule « liste / planche » qui garde la grande composition pour qui la veut ? | Liste seule d'abord ; mesurer avant d'ajouter une bascule |
| V3 | La règle « deux versions du Projet ne se comparent pas, même quand leurs issues coïncident » devient-elle une règle du moteur et de l'interface ? | Oui ; c'est la correction de fond de cette passe |
| V4 | « Faire le point » à la demande, l'accueil en reprenant les deux premiers énoncés : valider cette place ? | Oui |
| V5 | Ouvrir le cadrage d'un pipeline de rédaction (évaluation sur contrats fictifs, sans production) ? | Oui, en ticket séparé, après V3 et V4 ; pas avant que le contrat existe dans le produit |
| V6 | Fusionner « Prochain pas » et « Ce qui ferait avancer » en une seule source de règles ? | Oui |
| V7 | La vue géographique : écartée, ou étudiée comme complément de la fiche ? | Complément de la fiche, plus tard |

Les arbitrages U1 à U6 de la V2 et les 9 arbitrages du cadrage restent ouverts ; V1 répond à U1, et V2 à U2.

### Propositions à soumettre à FUT-118

Elles ne sont adoptées nulle part hors de ce prototype.

1. **Une analyse d'une autre version du Projet ne prend aucune teinte de registre dans une surface comparative** : pointillé gris, version et date, aucun mot d'issue au premier niveau.
2. **L'emblème de possibilité** : trois formes emboîtées de 34 px (cercle, carré, losange), pleines si l'échelle est lue, pointillées sinon, barrées en « incompatibilité » quand une condition sans compromis n'est pas tenue. Cela étend le § 4.1 (les formes restent réservées aux échelles).
3. **Le fil de retour** d'une zone de lecture : « ← parent », titre courant en mono, un niveau à la fois, Échap équivalent.
4. **L'énoncé à fondements** : énoncé numéroté à gauche, fondements en marge à 700 px de conteneur, repliés en dessous dans « Sur quoi cela repose ».
5. **La version rédigée** : toujours précédée de la mention de simulation ou de génération, avec des numéros d'appel vers les énoncés, et jamais affichée quand sa clé est périmée.
6. **Le rapprochement en sections** : ce qui départage ; ce qui ne peut pas être conclu ; les conditions sans compromis ; le commun replié ; toutes les échelles repliées. Les nombres sont des longueurs de liste.

---

*Prototype de revue. Lieux, adresses, dates, analyses, preuves et versions rédigées sont inventés.*

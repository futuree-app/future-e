# Logo futur•e v1.4 — qualité du dessin des courbes

**Agent** : design-critic (skill `impeccable`, playbook `critique`)
**Date** : 2026-08-04
**Objet** : trancher l'impression du porteur — « en zoomant sur les logos, j'ai l'impression que le détail des courbes est approximatif »
**Méthode** : ⚠️ **exécution en contexte unique** (mesure + contrôle visuel menés inline, pas en double sous-agent A/B). Le playbook `critique` prescrit deux sous-agents isolés ; la tâche reçue était une mesure géométrique unique et déterministe, non une revue d'écran. Aucun fichier du projet n'a été modifié hors ce rapport.
**Corpus** : pack v1.4 (`01-logo/svg`, `png`, `favicon`), pack v1.2 pour comparaison de silhouette.

---

## Verdict en une phrase

**L'impression du porteur est fondée, et elle est même en dessous de la réalité : le master v1.4 n'est pas un redessin, c'est l'autotrace v1.3 décimé de 520 à 166 sommets puis ré-émis en commandes `C` dont AUCUNE ne porte de courbure réelle — la flèche maximale des 166 « courbes » est de 0,684 px sur un logo large de 968 px, autrement dit le contour reste géométriquement un polygone.**

---

## A. Mesures

### A.1 La preuve décisive : la flèche

Pour chaque cubique, j'ai mesuré la distance perpendiculaire maximale entre le tracé rendu et sa propre corde (la droite ancre→ancre). C'est la mesure du « bombé » réel d'une courbe.

| | valeur |
|---|---|
| segments totaux (`futur-e-logo-principal.svg`) | 166 cubiques, 7 contours |
| flèche **médiane** | **0,27 px** |
| flèche **maximale, tous segments confondus** | **0,684 px** |
| segments dont la flèche est < 0,3 px | **96 / 166 (58 %)** |
| segments dont la flèche est < 1,0 px | **166 / 166 (100 %)** |

**0,684 px = 0,0706 % de la largeur du logo.** Il n'existe pas une seule courbe dans ce fichier dont l'écart au segment droit dépasse sept centièmes de pour cent de la largeur. Le rendu est, à moins d'un pixel près à l'échelle du master, **identique au polygone de ses 166 ancres**.

Écart max au polygone des ancres, par contour :

| contour | lettre | écart max au polygone |
|---|---|---|
| 0 | `f` | 0,684 px |
| 1 | `t` | 0,668 px |
| 2 | `e` (extérieur) | 0,475 px |
| 3 | `r` | 0,588 px |
| 4 | `u` (1er) | 0,621 px |
| 5 | `u` (2e) | 0,574 px |
| 6 | `e` (contre-forme) | 0,645 px |

**La rondeur des lettres n'est pas produite par des courbes. Elle est produite par des virages de polygone.** Sur la panse extérieure du `e`, 34 sommets enchaînent des virages de 12,9° médian sur des cordes de 16 px. Sur les `u`, 18 sommets à 17-18° de virage. C'est la définition d'un décalquage.

### A.2 État des poignées de contrôle

| | valeur |
|---|---|
| poignée de départ dégénérée (`c1 == p0`) | 52 / 166 (**31 %**) |
| poignée d'arrivée dégénérée (`c2 == p3`) | 52 / 166 (**31 %**) |
| **les deux dégénérées → droite pure déguisée en `C`** | **30 / 166 (18 %)** |
| cubiques droites à 0,05 px près | **39 / 166 (23,5 %)** |
| ratio médian \|poignée\|/corde | **0,208** |

Un `C` dont les deux points de contrôle coïncident avec les extrémités est un `L` écrit en six nombres. Il y en a 30. Le passage de « 520 `L`, zéro `C` » à « 166 `C`, zéro `L` » est donc en partie une **réécriture de notation, pas de géométrie** : 18 % des « courbes » du fichier sont littéralement des droites.

Le ratio poignée/corde médian de 0,208 est l'autre signature. Pour tracer un arc lisse sur un virage de 13°, il faut un ratio d'environ 0,33 ; pour un quart de cercle, 0,39. 0,208 signifie des poignées trop courtes pour porter la rondeur.

### A.3 Déficit de courbure : où part la rondeur

Sur les 86 segments situés en partie ronde (virages entrant et sortant tous deux < 30°), j'ai comparé la flèche réelle à celle qu'aurait un arc de cercle lisse passant par les mêmes ancres avec le même virage.

| lettre | segments ronds | flèche réelle | flèche d'un arc lisse | courbure portée |
|---|---|---|---|---|
| `f` | 5 | 0,316 px | 0,459 px | **69 %** |
| `t` | 5 | 0,512 px | 0,673 px | **76 %** |
| `e` extérieur | 32 | 0,332 px | 0,507 px | **65 %** |
| `r` | 6 | 0,380 px | 0,579 px | **66 %** |
| `u` 1 | 16 | 0,403 px | 0,564 px | **71 %** |
| `u` 2 | 16 | 0,407 px | 0,559 px | **73 %** |
| `e` contre-forme | 6 | 0,535 px | 0,767 px | **70 %** |
| **global** | **86** | | | **69 %** |

**31 % de la courbure locale n'est pas dans le segment : elle est encaissée par un angle vif au sommet.** C'est exactement ce que l'œil lit comme « approximatif » au zoom — la panse n'est pas ronde, elle est cassée tous les 16 px. Le `e` est le pire (65 %), et c'est la lettre la plus visible du nom.

### A.4 Nombre de nœuds par lettre

| lettre | nœuds v1.4 | nœuds d'une fonte de qualité | facteur |
|---|---|---|---|
| `f` | 24 | ~12-14 | ×1,8 |
| `t` | 25 | ~12-14 | ×1,9 |
| `e` (ext. 39 + contre-forme 9) | **48** | ~10-12 | **×4,4** |
| `r` | 16 | ~10-12 | ×1,4 |
| `u` ×2 | 26 et 27 | ~10-12 chacun | ×2,3 |
| **total** | **166** | **~65-70** | **×2,4** |

Le repère : un `o` bien dessiné = **4** courbes. Ici la panse extérieure du `e` en utilise **39**. Un `e` propre tourne autour de 10-12 nœuds au total, contre-forme comprise ; celui-ci en a 48. Ce n'est pas « un peu trop » : c'est le nombre de sommets qu'on obtient quand on décime un contour tracé, jamais celui qu'on obtient quand on dessine.

**166 courbes pour 7 contours n'est donc ni trop peu ni juste : c'est 2,4× trop, et surtout ce sont 166 nœuds qui ne portent aucune information de courbe.** Le vrai problème n'est pas le compte, c'est que ces 166 nœuds ne valent pas mieux que 166 points d'un polygone.

### A.5 Continuité tangentielle aux jonctions

166 ancres analysées (angle entre tangente sortante de la courbe N et tangente entrante de N+1) :

| bande | nombre | lecture |
|---|---|---|
| 0-1° (G1, lisse) | 112 | correct — mais lisse *entre deux facettes quasi droites*, donc peu significatif |
| 1-5° | 2 | négligeable |
| 5-15° | 0 | — |
| **15-45°** | **10** | **cassures visibles, non intentionnelles pour la plupart** |
| **45-80°** | **5** | **cassures franches en pleine partie ronde** |
| 80-100° | 30 | angles droits légitimes (pieds de fûts, empattements) |
| > 100° | 7 | coins légitimes (terminaisons, coupe du `r`) |

Les 15 jonctions fautives, par ordre de gravité :

| angle | lettre | position (unités SVG) | nature |
|---|---|---|---|
| **67,57°** | `r` | (1132,9 · 382,0) | terminal droit de l'arche — cassure franche là où la courbe devrait s'éteindre |
| **55,09°** | `r` | (1075,7 · 517,0) | jonction bas d'arche / fût — casse la continuité du fût |
| **52,77°** | `e` | (1330,0 · 493,6) | attaque du terminal bas-droit de la panse |
| **48,63°** | `f` | (438,0 · 539,3) | pied du fût |
| **46,13° / 44,99°** | `t` | (716,7 · 410,0) / (719,0 · 412,4) | **deux cassures consécutives à 2,4 px l'une de l'autre** sur l'attaque de la barre gauche du `t` — signature typique d'un décimateur |
| **41,94°** | `e` | (1365,0 · 471,3) | **panse droite du `e`, en plein arrondi — la cassure la plus visible du logo** |
| 41,93° / 41,91° | `u2` / `u1` | (893,9 · 385,0) / (658,2 · 385,0) | haut de fût, position symétrique — angle acceptable si intentionnel |
| 41,52° | `u2` | (968,2 · 385,0) | idem |
| 41,52° / 41,23° / 40,47° | `t` | (829,7 · 385,0) / (782,0 · 414,0) / (828,0 · 539,3) | jonctions barre/fût |
| 40,95° / 39,39° | `f` | (523,7 · 411,0) / (523,7 · 343,0) | terminaisons de la barre du `f` |

Les trois à corriger en priorité : **`e` (1365,0 · 471,3) à 41,94°**, **`r` (1132,9 · 382,0) à 67,57°**, **`r` (1075,7 · 517,0) à 55,09°**. Elles tombent au milieu d'une partie ronde, pas sur un coin voulu.

### A.6 Extrema

Sur une lettre dessinée, chaque tangente horizontale et verticale d'une panse porte une ancre. Ici, en écartant les arêtes verticales droites (où le test n'a pas de sens), les extrema réels tombent **à côté** des ancres :

| lettre | extremum | écart à l'ancre la plus proche |
|---|---|---|
| `e` extérieur | **droite** (1366,97 · 463,09) | **5,09 px** |
| `e` contre-forme | **haut** (1287,95 · 406,76) | **4,95 px** |
| `e` extérieur | haut (1280,63 · 379,94) | 3,44 px |
| `e` extérieur | bas (1292,55 · 542,41) | 1,45 px |
| `e` extérieur | gauche (1209,52 · 462,09) | 0,91 px |
| `u1` | bas (612,50 · 542,29) | 3,50 px |
| `u2` | bas (923,78 · 542,40) | 3,23 px |
| `t` | bas (799,95 · 539,42) | 9,95 px |
| `f` | haut (490,43 · 312,98) | 2,54 px |
| `r` | haut (1125,55 · 380,34) | 2,45 px |

**Pas un seul extremum de panse n'est sur une ancre.** Le point le plus à droite du `e` — la borne de chasse de la dernière lettre du nom de marque — flotte à 5,09 px de tout nœud. C'est le marqueur canonique d'un tracé automatique : un dessinateur pose une ancre à cet endroit précisément parce que c'est là que se règle la largeur de la lettre.

### A.7 Régularité

**Fûts** (balayage horizontal à y = 460, hors zones de jonction) :

| fût | largeur |
|---|---|
| `f` | 35,44 |
| `u1` gauche | 35,32 |
| `u1` droit | **33,90** |
| `t` | 35,67 |
| `u2` gauche | 35,35 |
| `u2` droit | **33,90** |
| `r` | 35,06 |

Amplitude **33,90 → 35,67 = 1,77 px, soit 5,2 % d'écart**. Dans une fonte, ces sept fûts seraient à la valeur identique. Le motif est instructif : dans chaque `u`, le fût **droit** est systématiquement 1,4 px plus fin que le gauche (33,90 vs 35,32/35,35). Ce n'est pas une compensation optique (elle irait dans l'autre sens ou serait bien plus faible), c'est du bruit de décalquage reproduit à l'identique dans les deux `u`.

**Lignes de référence** — le seul point vraiment propre du fichier :

| ligne | valeur | cohérence |
|---|---|---|
| ligne de base (`f`, `t`, `r`) | 539,27 / 539,42 / 539,06 | écart 0,36 px — **bon** |
| débord bas (`u1`, `u2`, `e`) | 542,29 / 542,40 / 542,41 | écart 0,12 px, débord 3,2 px — **cohérent** |
| hauteur d'x (sommet des fûts `u`) | 383,60 / 383,58 | écart 0,02 px — **excellent** |
| débord haut (`e`, `r`) | 379,94 / 380,34 | débord 3,6 px — **cohérent** |

Les débords (3,2 px bas, 3,6 px haut, sur une hauteur d'x de 155,6 px, soit ~2,2 %) sont typographiquement justes. Ils viennent du candidat original, pas du redessin, mais ils tiennent.

**Symétrie des deux `u`** — la preuve secondaire la plus parlante :

- `u1` : **26** ancres. `u2` : **27** ancres. **Nombre différent pour la même lettre.**
- Après translation de 309,76 px : écart ancre-à-ancre médian 0,25 px, **maximum 3,11 px**.

Un typographe dessine un `u` et le duplique : les deux contours sont alors **bit-identiques** à la translation près. Ici les silhouettes coïncident presque (0,25 px médian) mais la **structure de nœuds diffère** — 26 contre 27. Cela ne peut arriver que si chaque `u` a été tracé indépendamment à partir de la même image bitmap. **Aucun redessin manuel ne produit ça.**

### A.8 Le cercle du point

`<circle cx="1162.54" cy="461.05" r="25.17" fill="#E8823A"/>`

- Diamètre 50,34 px, contre une graisse de fût de ~35,3 px → **ratio 1,43**.
- Centre vertical : 461,05 contre le milieu de hauteur d'x à 461,4 → **écart 0,35 px, très bon**.
- `r = 25,17` : valeur non ronde. Un point choisi vaudrait 25, ou 24,75 (0,7 × graisse), ou une fraction de la hauteur d'x. 25,17 est une valeur **mesurée sur le bitmap, pas décidée**.

**Le problème n'est pas le cercle, il est excellent — le problème est qu'il est le seul.** C'est la seule primitive parfaitement lisse du fichier. Au zoom fort, le point est un cercle mathématique impeccable posé à côté de six lettres à facettes. L'incohérence de finition est visible et elle joue contre le logo : le point donne l'échelle de propreté que les lettres n'atteignent pas.

### A.9 Micro-segments et dégénérescences

- Segments de longueur nulle : **0**.
- Micro-segments < 1 px : **0**.
- Segments < 3 px : **9** (min 2,21 px). Dont **deux jonctions consécutives sur le `t`** à (716,68 · 410,00) et (719,00 · 412,42), séparées de 2,4 px, portant chacune une cassure de ~45°. C'est un artefact de décimation, pas un dessin.
- Discontinuités de position entre segments : **0** (les contours ferment proprement).

Sur ce point précis, le fichier est **propre** : pas de poubelle de nœuds, pas de trous. C'est un décalquage bien nettoyé — ce qui explique qu'il passe l'inspection à taille normale.

---

## B. Contrôle visuel

Rasterisation faite maison (échantillonnage des cubiques à 200 points/segment, supersampling ×3), ancres marquées en rouge, zooms de ×9 à ×29.

**Ce que j'ai vu, zone par zone :**

- **Fond de contre-forme du `u1`** (zoom ×20, x 600-680 / y 492-522) : entre deux ancres, le fond de la panse est une **droite parfaitement rectiligne sur ~25 px**, puis un angle net à l'ancre, puis une autre droite qui remonte. **Le point le plus bas de la contre-forme est une facette plate, pas un extremum de courbe.** C'est visuellement indéfendable au zoom.
- **Sommet de l'arche du `r`** (zoom ×29, x 1085-1140 / y 377-399) : **l'apex de l'arche est un segment droit**, terminé par un coin franc côté droit. Une arche de `r` doit culminer sur un point de tangence horizontale ; ici elle culmine sur une facette et casse.
- **Panse droite du `e`** (zoom ×33, x 1330-1375) : la cassure mesurée à 41,94° en (1365,0 · 471,3) est **visible à l'œil** — le bord change de direction de façon nette au niveau de l'ancre. C'est le défaut le plus exposé du logo, sur la lettre la plus chargée de sens dans « futur•e ».
- **Le `e` entier** (zoom ×9) : la panse extérieure gauche et le bas de la contre-forme se lisent comme une suite de cordes. Le terminal bas-droit (la coupe diagonale) est un bloc rectiligne.
- **Terminal du `f`** (zoom ×19) : l'arche haute est faceté sur sa montée ; l'arête droite du terminal **n'est pas verticale**, elle penche d'environ 0,8° (0,43 unité de dérive sur 30 unités de hauteur). À taille normale c'est invisible ; en gravure, en broderie ou en très grand format, ça se voit.
- **Le point à côté du `e`** (zoom ×14) : contraste net entre le cercle, parfaitement lisse, et les facettes du `e`.

**Réponse directe à la question du porteur : oui, votre impression est fondée. La lettre en cause est le `e`** — le plus grand nombre de facettes (39 sur la seule panse extérieure), la plus forte perte de courbure (65 %), la cassure la plus franche en pleine partie ronde (41,94°), et l'extremum le plus mal placé (5,09 px). Vient ensuite le `r` (deux cassures à 67,57° et 55,09°, apex plat), puis le fond de contre-forme des deux `u`.

Le favicon 48 px et les rendus PNG à taille d'usage sont, eux, **irréprochables** : à 0,68 px de flèche max sur 968 px de large, aucun de ces défauts n'atteint la rétine en dessous de ~400 px de large. Le problème est un problème de **master**, pas d'usage courant.

---

## C. Comparaison v1.2 → v1.4

Diff pixel à pixel des rendus 2048 px, masques d'encre seuillés à 50 % d'alpha.

| mesure | valeur |
|---|---|
| encre v1.2 | 316 621 px |
| encre v1.4 | 313 665 px |
| **variation de surface d'encre** | **−0,93 %** |
| **pixels divergents (XOR)** | **6 186 px = 1,95 % de la surface d'encre** |
| **IoU (recouvrement)** | **98,06 %** |

Localisation des divergences (colonnes les plus touchées, converties en coordonnées SVG) :

| colonne PNG | x SVG | correspond à |
|---|---|---|
| 609-610 | 691,8 | arête droite du fût du `u1` (x = 692,00) |
| 1265 | 1001,9 | arête droite du fût du `u2` (x = 1002,00) |
| 1346 | 1040,2 | arête gauche du fût du `r` (x = 1040,52) |
| 963 | 859,2 | arête gauche du `u2` (x = 859,60) |
| 308 | 549,6 | arête gauche du `u1` (x = 549,84) |

**Verdict sur l'affirmation « géométrie strictement inchangée » : quasi vraie, mais pas exacte.** La silhouette est conservée à 98,06 % et l'écart restant est concentré sur les **arêtes verticales des fûts**, déplacées de quelques dixièmes d'unité — assez pour faire basculer une colonne entière de 508 pixels. Le logo v1.4 a perdu **0,93 % de son encre** : il est très légèrement plus maigre.

Formulation juste : *la silhouette est préservée ; les fûts ont été redressés d'une fraction de pixel, ce qui amincit l'ensemble de moins d'un pour cent.* Rien de perceptible, mais l'affirmation « strictement inchangée » ne passe pas la mesure.

---

## D. Verdict : vrai redessin ou conversion automatique ?

**Conversion automatique.** Ce n'est pas un doute, c'est une conclusion appuyée sur quatre preuves indépendantes qui ne peuvent pas coexister avec un dessin de typographe :

1. **Aucune courbe ne dépasse 0,684 px de flèche.** Un dessinateur qui pose une courbe sur une panse de `e` produit des flèches de l'ordre de 5 à 20 px sur des cordes de 40-70 px. Ici la plus bombée de 166 courbes est plate à sept dixièmes de pixel près. Un tracé qui, à un demi-pixel près, *est* son propre polygone d'ancres n'a pas été dessiné.

2. **Les deux `u` n'ont pas le même nombre de nœuds (26 et 27) alors que leurs silhouettes coïncident à 0,25 px.** Un typographe duplique un glyphe ; il n'en re-trace jamais un second à 0,25 px près avec une topologie différente. Seule une passe automatique sur deux régions d'une même image produit ce résultat.

3. **Aucun extremum de panse ne porte d'ancre** (le plus à droite du `e` est à 5,09 px du nœud le plus proche, le haut de la contre-forme à 4,95 px, le bas du `t` à 9,95 px). Poser les ancres aux extrema est le premier geste du dessin de courbe. Son absence totale est une signature.

4. **31 % des segments ont une poignée dégénérée, 18 % sont des droites pures écrites en `C`, et le ratio poignée/corde médian est 0,208** — trop court pour porter la rondeur. C'est exactement la sortie d'un « fit » de Bézier contraint sur une polyligne existante, pas d'un tracé à la plume.

Le passage v1.3 → v1.4 est donc une **décimation 520 → 166 sommets + réécriture de notation `L` → `C`**. Il rend le fichier plus léger (28,7 Ko contre 38,0 Ko en PNG 2048, `d=` nettement plus court) et supprime les micro-segments — ce sont de vrais gains d'hygiène. Mais il n'ajoute **aucune information de courbe** : sur les 86 segments ronds, seuls 69 % de la courbure requise sont portés par le tracé, le reste étant renvoyé dans des angles vifs. Le fichier reproduit les défauts du décalquage sous une autre forme, exactement comme le soupçonnait la question posée.

Corollaire pratique : **ce master n'est pas éditable.** On ne peut pas y « corriger une courbe » — il n'y a pas de courbe à corriger, il y a 166 sommets dont chacun encaisse un morceau d'angle. Toute retouche à la plume sur ce fichier consisterait à repartir de zéro sur la lettre concernée.

---

## Défauts priorisés

| # | Lettre | Nature | Mesure | Ce qu'il faut corriger |
|---|---|---|---|---|
| **P0** | **toutes** | Le master n'est pas un dessin vectoriel mais un polygone de 166 sommets ré-étiqueté en cubiques | flèche max 0,684 px ; 69 % de la courbure requise | Redessiner le mot-symbole à la plume sur le tracé actuel utilisé comme calque de fond, ~65-70 nœuds au total, ancres aux extrema, poignées horizontales/verticales aux tangences. Ce n'est pas une retouche, c'est une reprise. |
| **P0** | `e` | Panse extérieure faceté (39 nœuds), cassure franche en pleine courbe, extremum droit orphelin | 41,94° en (1365,0 · 471,3) ; extremum à 5,09 px de l'ancre ; 65 % de courbure | Repartir de 8 nœuds sur l'extérieur (4 extrema + 2 attaques de terminal + 2 pour la coupe), 4 sur la contre-forme. |
| **P1** | `r` | Deux cassures franches ; sommet d'arche plat | 67,57° en (1132,9 · 382,0), 55,09° en (1075,7 · 517,0) ; apex rectiligne | Poser une ancre à la tangente horizontale de l'apex, poignées horizontales. Redessiner la jonction arche/fût en G2. Le `r` porte à lui seul tout le signe compact — c'est le fichier le plus exposé. |
| **P1** | `u` ×2 | Fond de contre-forme droit ; fût droit 1,4 px plus fin que le gauche dans les deux `u` ; topologies différentes (26 vs 27 nœuds) | 33,90 vs 35,32 px ; 3,50 px entre l'extremum bas et l'ancre | Dessiner **un** `u`, poser son extremum bas sur une ancre, égaliser les deux fûts à 35,3 px, puis **dupliquer**. |
| **P2** | `t` | Deux cassures consécutives à 2,4 px d'écart (46,13° et 44,99°) sur l'attaque de la barre gauche | segment de 2,21 px | Fusionner les deux nœuds en un seul coin franc. |
| **P2** | `f` | Arête droite du terminal non verticale | dérive de 0,43 unité sur 30 (~0,8°) | Verticaliser. Invisible en écran, visible en gravure et grand format. |
| **P2** | Fûts | Graisse irrégulière sur les 7 fûts | 33,90 → 35,67 px, amplitude 5,2 % | Normaliser à une valeur unique. |
| **P3** | Point | `r = 25,17`, valeur mesurée et non choisie | ratio 1,43 × graisse de fût | Arrêter une valeur décidée (par ex. 0,71 × graisse, ou 1/6 de la hauteur d'x) et l'inscrire dans la charte. Le cercle lui-même est parfait ; c'est sa justification qui manque. |
| **P3** | v1.2 → v1.4 | L'affirmation « géométrie strictement inchangée » n'est pas exacte | IoU 98,06 %, −0,93 % d'encre | Corriger la formulation dans la charte : « silhouette préservée à 98 %, arêtes de fûts redressées d'une fraction de pixel ». |

---

## Ce qui est bon

Ces points-là sont réels et il faut les préserver dans toute reprise.

1. **Les lignes de référence sont justes.** Ligne de base à 0,36 px de dispersion sur trois lettres, hauteur d'x à 0,02 px sur les deux `u`, débords haut et bas cohérents (3,6 et 3,2 px, soit ~2,2 % de la hauteur d'x — valeur typographiquement correcte). Rien à toucher.

2. **Le fichier est propre au sens de l'hygiène.** Zéro segment de longueur nulle, zéro micro-segment sous 1 px, zéro discontinuité de position, contours qui ferment. Les 520 segments de v1.3 laissaient forcément de la poussière ; elle a été enlevée. Le gain de poids est réel (28,7 Ko contre 38,0 Ko en PNG 2048).

3. **Les 8 SVG sont rigoureusement cohérents entre eux.** Mêmes 166 segments, même flèche max de 0,684 px, même `viewBox`, même `r = 25,17` sur les 4 déclinaisons du mot-symbole ; le signe compact est exactement le contour `r` (16 segments) + le point, sans dérive. Aucune déclinaison n'a divergé du master. C'est le genre de discipline qui manque souvent aux packs de charte.

4. **Le cercle du point est excellent** : centré à 0,35 px du milieu de hauteur d'x, géométriquement parfait. Il faut lui donner un rayon décidé, pas le redessiner.

5. **La silhouette du candidat approuvé est conservée** (IoU 98,06 %). La reprise à faire est une reprise de *tracé*, pas de *forme* : le dessin à obtenir est déjà là, sous la forme d'un calque exploitable. C'est le travail le mieux cadré qui soit — le résultat cible est connu au pixel près.

6. **À l'usage courant, rien de tout ceci ne se voit.** Le favicon 48 px est net, les PNG 512/1024/2048 sont irréprochables. Le défaut est un défaut de master : il coûte au moment où on agrandit (enseigne, gravure, sérigraphie, animation avec zoom, presse en grand format), pas au quotidien.

---

## Ce que je ne peux pas conclure

- **La charte PDF v1.4 n'a pas été auditée.** Le mandat portait sur la qualité du tracé ; les pages du PDF (règles d'usage, zone de protection, tailles minimales) restent à revoir séparément.
- **Je n'ai pas pu comparer les nœuds de v1.2/v1.3 à ceux de v1.4** : le pack v1.2 fourni ne contient aucun SVG (dossier `01-logo/svg/` vide). La comparaison de silhouette a donc été faite sur les PNG 2048 px, ce qui est suffisant pour la géométrie mais ne permet pas de vérifier directement l'hypothèse « décimation des mêmes 520 sommets ». Cette hypothèse repose sur les quatre preuves internes au fichier v1.4 (section D), pas sur un appariement de sommets.
- **Le seuil à partir duquel les facettes deviennent perceptibles à l'œil nu** n'a pas été mesuré en conditions réelles. Ma lecture est qu'en dessous de ~400 px de large elles sont hors de portée de la rétine, mais c'est une estimation, pas un test.

---

# Addendum — audit du candidat v1.6 (redessin ChatGPT)

**Date** : 2026-08-04, même session.
**Fichier audité** : `/Users/quentinbrache/Downloads/futur-e-logo-principal.svg` (un seul SVG, mot-symbole principal).
**Réserve de méthode** : le porteur annonce 97,9 % de recouvrement **avec la v1.5**. Je n'ai pas la v1.5. Toutes mes comparaisons de silhouette sont donc faites **contre la v1.4**, seule version antérieure en ma possession.

## Verdict

**C'est un vrai redessin, et il corrige l'intégralité de ce que j'avais classé P0 et P1 sur la qualité de courbe. Les cinq preuves qui condamnaient la v1.4 sont toutes inversées. Il reste un défaut de fond, unique mais réel : les 53 segments droits sont les sommets du vieux polygone recopiés tels quels, avec leur bruit — 39 d'entre eux, censés être horizontaux ou verticaux, penchent de 0,14° à 3,73°, et les fûts restent irréguliers à 5,4 %.**

## Les annonces, vérifiées

Toutes exactes.

| annonce | mesure |
|---|---|
| 26 vraies courbes, 53 droites explicites | **26 `C` + 53 `L` = 79 segments** ✓ |
| flèche médiane 10,4 px (contre 0,27) | **10,39 px** (min 0,21 · max 25,04) ✓ |
| aucune poignée dégénérée | **0 / 26** ✓ |
| deux `u` strictement identiques | **écart max 0,000000 px** après translation de 309,76 ✓ |
| coupe du `r`, centre et taille du point conservés | `r = 25,17`, `cx/cy` inchangés ; coupe basse du `r` conservée à 55,04° ✓ |
| ~97,9 % de recouvrement | **IoU 97,83 % contre la v1.4** ✓ |
| 95 % des bords à moins de 1,42 px | **94,1 % à moins de 1,42 px** ✓ (p95 = 1,89 px) |

## Les cinq preuves de la v1.4, inversées

| critère | v1.4 | v1.6 |
|---|---|---|
| flèche des courbes | max 0,684 px — un polygone | **médiane 10,39 px, max 25,04 px** |
| ratio poignée/corde | 0,208 (trop court) | **0,397 médian** — la valeur canonique d'un arc de cercle (0,39) |
| extrema sur ancres | **0 / 10** | **27 / 28** (le seul écart, `r` bas à 0,83 px, est la coupe diagonale, pas un extremum) |
| jonctions courbe→courbe | 15 cassures de 15° à 68° | **12 jonctions, toutes G1 : 11 à 0,00°, une à 0,01°** |
| symétrie des `u` | 26 vs 27 nœuds, 3,11 px d'écart | **12 vs 12, 0,000000 px** — duplication réelle |

Contrôle visuel (mêmes cadrages, mêmes zooms qu'en section B) :

- **Fond de contre-forme du `u`** (×20) : la facette droite de 25 px a disparu. Une seule courbe continue, une seule ancre posée exactement au point bas. Correct.
- **Sommet de l'arche du `r`** (×29) : l'apex plat a disparu. Ancre à la tangente horizontale, courbe continue de part et d'autre. Correct.
- **Le `e`** (×9) : 12 nœuds au total contre 48, panse parfaitement continue, plus aucune cassure visible. C'est bien, comme l'annonce le porteur, le changement le plus sensible.

Le nombre de nœuds passe de **166 à 79**, soit très près de la cible typographique que j'avais donnée (~65-70).

## Ce qui reste à corriger

### P1 — Les 53 droites sont le vieux polygone recopié

**48 % des ancres v1.6 sont reprises au centième près de la v1.4** (38 sur 79), 17 de plus sont à moins de 0,6 px, et **24 seulement sont réellement nouvelles** — celles-là posées aux extrema et aux points de tangence, exactement là où il fallait. Le travail de courbe est donc authentique. Mais les parties droites n'ont pas été redressées : elles héritent du bruit de décalquage.

**39 segments censés être strictement horizontaux ou verticaux penchent.** Les pires :

| lettre | segment | pente |
|---|---|---|
| `f` | (410,40 · 385) → (436,00 · 383,33) | **3,73°** — 1,67 px de dérive sur 25,6 |
| `r` | (1074,84 · 384) → (1076,00 · 404,28) | **3,27°** |
| `f` | (523,66 · 343) → (490,00 · 344,50) | **2,55°** |
| `f` | (436,22 · 413) → (411,00 · 411,99) | 2,29° |
| `t` | (781,18 · 337) → (783,00 · 383,53) | **2,24°** — le montant gauche de la hampe du `t` dérive de 1,82 px |
| `f` | (523,69 · 411) → (471,88 · 413) | 2,21° — l'arête basse de la barre du `f` |
| `t` | (716,68 · 412,42) → (717,74 · 384) | 2,14° |
| `u` ×2 | (550,20 · 384) → (584,30 · 385) | 1,68° — le sommet du fût gauche du `u` n'est pas de niveau |

**Correctif** : passer les 53 `L` à des valeurs entières ou alignées sur une grille, et verticaliser/horizontaliser ce qui doit l'être. C'est mécanique, sans risque pour la silhouette (dérives inférieures à 2 px), et ça supprime le dernier reste du décalquage.

### P1 — Les fûts restent irréguliers

Balayage à y = 460 : **34,87 · 34,93 · 33,80 · 35,64 · 34,93 · 33,80 · 35,11**. Amplitude **33,80 → 35,64 = 1,84 px, soit 5,4 %** — c'est-à-dire **inchangé par rapport à la v1.4** (5,2 %).

Pire : l'asymétrie interne du `u` (fût droit 1,13 px plus fin que le gauche) a été **reproduite à l'identique dans les deux `u`** par la duplication. La symétrie parfaite entre les deux `u` a fidèlement dupliqué un défaut au lieu de le corriger.

**Correctif** : normaliser les sept fûts à une valeur unique (35,0 px, ou 35,3 si on veut rester au plus près). C'est le geste qui manque pour que le mot tienne comme un mot et non comme six dessins voisins.

### P2 — Le `e` s'est géométrisé, décision à valider

Le `e` est la lettre qui a le plus bougé : **3,70 % de divergence d'encre** (la plus forte, contre 0,85 % pour le `t`), et 73 des 166 bords déplacés de plus de 3 px. Le déplacement culmine à **~12 px sur l'épaule haut-droite** (x 1304-1314, y 380-382).

La cause est identifiable : la v1.6 construit la panse du `e` en quatre quarts d'arc quasi circulaires, là où le candidat approuvé avait une panse légèrement plus ovale et moins régulière. Le résultat est plus propre — et un peu plus neutre. **Ce n'est pas un défaut, c'est un arbitrage** : le porteur doit regarder le `e` v1.6 à côté du candidat original et dire si la régularisation lui va, ou s'il veut retrouver l'ovalisation. Je ne peux pas trancher ça à sa place, c'est une question d'identité, pas de qualité de tracé.

Même remarque, plus légère, sur le `r` (2,23 % de divergence, 50 bords > 3 px).

### P3 — Reste à faire avant de propager

- Le candidat ne contient **qu'un SVG**. Les 7 autres déclinaisons, les PNG, les favicons et le signe compact (qui est le contour `r` + le point) sont à régénérer depuis ce master.
- Ligne de base : `f` 539,27 · `t` 539,36 · `r` 539,10 → dispersion 0,26 px (mieux que les 0,36 de la v1.4). Débord bas : `u` 542,20 · `e` 542,40 → 0,20 px (légèrement moins bon que les 0,12 de la v1.4). Négligeable, mais à caler en même temps que les droites.
- Le rayon du point reste `25,17`, valeur mesurée et non décidée. Ma remarque de la section A.8 tient.

## Recommandation

**Accepter le candidat comme base et demander une v1.7 de finition**, portant uniquement sur trois gestes mécaniques et sans risque :

1. redresser les 39 droites qui penchent (grille entière) ;
2. normaliser les 7 fûts à une valeur unique ;
3. arrêter une valeur décidée pour le rayon du point.

Puis faire trancher au porteur la seule vraie question de design ouverte : **le `e` régularisé de la v1.6 est-il le `e` de futur•e ?**

Ce qui était impossible sur la v1.4 — « on ne peut pas corriger une courbe, il n'y en a pas » — est maintenant possible : le fichier est éditable, une lettre par path, nommée, avec des ancres aux bons endroits. C'est le vrai gain de cette version.

---

# Addendum 2 — audit du candidat v1.7

**Date** : 2026-08-04, même session.
**Audité** : `futur-e-logo-principal (1).svg` + `futur-e-logo-v1-7-candidate.zip` (pack complet, 59 fichiers).
Le master livré dans `~/Downloads` est **identique octet pour octet** à celui du ZIP.

## Verdict

**Le candidat v1.7 est bon à propager. Les dix annonces se vérifient, deux résultats sont meilleurs qu'annoncés, et le fichier est désormais un logotype correctement dessiné : chaque ancre est justifiée, chaque droite est axée, chaque courbe meurt tangentiellement dans son fût. Il reste trois broutilles, dont une seule mérite un correctif avant propagation : le centre du point est la dernière valeur non alignée du fichier.**

## Les dix annonces, vérifiées

| annonce | mesure | |
|---|---|---|
| 50 droites axées à 0° | **50 / 53** strictement horizontales ou verticales | ✓ |
| sept fûts exactement à 35 unités | **35,000 · 35,000 · 35,000 · 35,000 · 35,000 · 35,000 · 35,000** (y = 455 et y = 470) | ✓ |
| deux `u` identiques par translation de 310 | translation **310,0000**, écart max **0,000000 px** | ✓ |
| point fixé à 25 de rayon | `r = 25.0` dans les 8 SVG | ✓ |
| 12/12 jonctions courbes en G1 | **12/12 à exactement 0,000°** | ✓ |
| aucune poignée dégénérée | **0 / 26** ; ratio poignée/corde médian **0,399** | ✓ |
| recouvrement 97,988 % avec la v1.6 | **97,850 %** à mon banc | ≈ (0,14 pt d'écart, méthode de rastérisation différente) |
| 95 % des bords à ≤ 1 px | **97,0 %** | ✓ mieux qu'annoncé |
| 8 déclinaisons + PNG + favicons régénérés | 4 mots-symboles à géométrie **strictement identique** (même empreinte), 4 signes compacts idem, `r = 25.0` partout, couleurs cohérentes ; PNG 2048 conforme au SVG à 98,69 % (le reste = antialiasing) | ✓ |
| ZIP intègre, sans fichier caché | aucun `._*`, `.DS_Store` ni `__MACOSX` | ✓ |

Les 3 droites non axées sont toutes légitimes ou assumées : la **coupe basse du `r`** (34,11° — la signature de la marque) et les **deux parois internes des terminaisons de `u`** (6,71°, rigoureusement symétriques).

## Deux résultats meilleurs qu'annoncés

**1. 28/28 extrema exactement sur une ancre** (la v1.6 en avait 27/28, la v1.4 zéro sur dix). Le dessin est complet : plus une seule tangente horizontale ou verticale ne flotte entre deux nœuds.

**2. Quatorze jonctions courbe↔droite sont elles aussi tangentes à 0,00°** — et ça, le porteur ne l'annonce pas. L'arche du `f` (aux deux bouts), les épaules des deux `u`, la queue du `t`, l'épaule du `r` : la courbe **meurt tangentiellement dans le fût** au lieu d'y buter. C'est précisément le geste qui était structurellement impossible en v1.4, et c'est ce qui fait qu'une lettre se lit comme dessinée plutôt que comme assemblée.

S'y ajoute la régularisation complète des lignes de référence, désormais exactes : ligne de base **539,00** (`f`, `t`, `r`), débord bas **542,00** (`u`, `u`, `e`), hauteur d'x **384,00**, débord haut **380,00**. En v1.6 ces valeurs s'étalaient de 539,10 à 539,36 et de 542,20 à 542,40.

## Sur les 79 segments : le porteur a raison, je retire ma cible

J'avais fixé un repère de 65-70 nœuds. **Vérification faite, il n'existe aucun nœud droit colinéaire redondant dans le fichier : 0 sur 53.** Chaque ancre porte soit un changement de direction, soit un extremum, soit un raccord tangent. Mon repère venait des normes de dessin de fonte pour des glyphes isolés ; il ne s'applique pas à un logotype dont les lettres portent des empattements coupés et une coupe de `r` spécifique. **79 est le bon compte, et supprimer des nœuds pour atteindre 70 aurait dégradé le dessin.** Le porteur a eu raison de ne pas le faire.

## Ce qui reste

### P2 — Le centre du point est la dernière valeur non alignée

`r = 25.0` ✓ mais `cx = 1162.54`, `cy = 461.05` — **inchangés depuis la v1.4, donc mesurés et non décidés**. Le milieu de hauteur d'x vaut exactement **(384 + 539) / 2 = 461,5**. Dans un fichier où les 79 ancres et les 7 fûts sont désormais sur la grille, le point est le seul élément qui n'y est pas.

**Correctif, une ligne** : `cy="461.5"`, et arrêter un `cx` décidé (l'entier 1162 ou 1163). Aucun impact visible, mais c'est la cohérence du fichier.

### P3 — La dérive cumulée depuis le candidat approuvé n'est pas celle qu'on croit

Chaque étape a été comparée à la précédente, et chaque comparaison rassure : 97,9 % puis 97,85 %. **Mais la dérive cumulée v1.4 → v1.7 est de : IoU 96,759 %, encre −0,62 %, p95 à 2,36 px, et seulement 89,8 % des bords à moins de 1 px.** Soit **~3,2 % d'écart** avec le candidat originellement approuvé, contre ~2 % annoncés à chaque pas.

Ce n'est pas un défaut — la régularisation *devait* déplacer des bords, c'était l'objectif. Mais **c'est le chiffre à inscrire dans la charte**, pas le pas-à-pas : quiconque comparera un jour la v1.7 au candidat validé trouvera 3,2 %, et il faut que ce soit documenté plutôt que découvert.

### P3 — Deux asymétries héritées, à confirmer comme intentionnelles

- **L'apex du `e` est 6,5 px à gauche du centre de sa panse** (apex à x = 1282, centre à x = 1288,5), soit 4,1 % de la largeur — et **dans les deux variantes**. C'est un héritage du décalquage. Ça peut se lire comme un axe incliné, ce qui est un parti pris typographique valable ; mais dans un fichier par ailleurs entièrement régularisé, c'est désormais la seule asymétrie non déclarée.
- **Les fûts droits des `u` mesurent 33 unités à la ligne de base contre 35 au-dessus** (parois internes à 6,71°). Léger évasement de la terminaison, symétrique sur les deux `u`. Plausiblement voulu — à confirmer d'un mot.

## Variante A contre variante B

Les deux sont **également bien construites** : 9 courbes + 3 droites chacune, G1 à 0,000°, ratio poignée/corde 0,399 et 0,410, largeur 157 et hauteur 162 identiques, même décalage d'apex. **Le choix est purement esthétique, aucun argument de qualité de tracé ne départage.**

Un seul écart fonctionnel : la **contre-forme haute de B est 8 % plus grande** (16,3 % de l'aire extérieure contre 15,5 %). Un avantage de lisibilité en très petit — mais qui ne joue pas sur le favicon, lequel utilise le signe compact (`r` + point) et non le `e`. Et j'ai vérifié le mot-symbole rendu à 240 px de large : **la variante A y est parfaitement lisible**, le `e` ne se bouche pas.

**Je suis le choix du porteur : variante A.** Le `e` circulaire est le plus neutre et le plus intemporel des deux ; c'est cohérent avec un produit dont la promesse est de lire un territoire sobrement, sans dramatiser. B est plus contemporaine, donc plus datable. L'argument de contre-forme ne suffit pas à renverser ça.

## Recommandation

**Propager la v1.7, variante A, après le correctif du centre du point.**

Puis, dans la charte : documenter la dérive cumulée de 3,2 % contre le candidat approuvé, et inscrire les invariants du master (fût = 35, ligne de base = 539, hauteur d'x = 384, débords = 380/542, point = 25 de rayon centré à 461,5) pour que toute reprise future ait une référence chiffrée au lieu d'un fichier à décalquer.

Le problème ouvert par le porteur le 3 août — « le détail des courbes est approximatif » — est **clos**.

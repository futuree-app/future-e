# Fréquence nationale du risque « Feu de forêt » recensé par GASPAR

**Mesuré le 25/07/2026.** Script rejouable : `scripts/mesure-gaspar-feu.mjs` (échantillon tiré par un
PRNG à graine fixe — la même exécution donne le même échantillon).

## La question

Le risque de feu recensé par l'État est aujourd'hui lu par la seule règle **déclarée** (`ruleFeu`). Peut-il
devenir un **constat non demandé** ? La minute n'a qu'une place ambiante : si le risque était recensé
partout, il la prendrait presque toujours et on reproduirait le bavardage fermé le matin même.

## Le résultat

500 communes tirées au sort, 500 lues, **0 échec**.

| | |
|---|---|
| communes où « Feu de forêt » est recensé | **17,6 %** |
| intervalle de confiance 95 % | 14,3 – 20,9 % |
| pondéré par la population | 15,8 % |

**L'estimation antérieure était fausse.** L'échantillon de 14 communes du 24/07 donnait 6/14 ≈ 43 % : il
était biaisé vers le sud et le littoral (Lège-Cap-Ferret, Aix, Antibes, Montpellier…). La vraie fréquence
est deux fois et demie plus basse.

## Où 17,6 % se situe

| constat non demandé | part des communes |
|---|---|
| chaleur ambiante (≥ 10 j > 35 °C ou ≥ 39 nuits tropicales) | 7,7 % |
| feu ambiant (indice forêt-météo ≥ 15 j) | 5,1 % |
| *candidat* : boisement ≥ 79 % (p95) | 5,1 % |
| *candidat* : **risque feu recensé (GASPAR)** | **17,6 %** |

Pour comparaison, les risques qui seraient du pur bruit : mouvement de terrain 58,6 %, séisme 57,2 %,
inondation 51,4 %, transport de marchandises dangereuses 46,2 %.

## Ce que la mesure ne dit pas

Le percentile ne s'applique pas ici. Un risque recensé n'est pas une projection franchissant un seuil :
c'est un **fait établi et binaire** — l'État l'a inscrit, ou non. 17,6 % n'est donc pas « au-dessus du
calibrage à 5 % », c'est une grandeur d'une autre nature. La question posée à ce chiffre est seulement :
*à quelle fréquence ce constat prendrait-il l'unique place ambiante ?* Réponse : environ un dossier sur six.

## Note de méthode

Le premier jet du script a mesuré **0 %** : il passait le libellé brut à la regex, et « Feu de forêt »
ne correspond pas à `/forets?/` à cause de l'accent circonflexe. C'est la faute même que ce chantier
documente depuis le matin, refaite dans l'outil chargé de la mesurer. Le script normalise désormais
comme le produit (`normalizeLabel`, NFD + suppression des diacritiques). Le code produit, lui, était
correct — vérifié.

---

# Recouvrements et cartes réellement affichées

Ajouté le 25/07/2026. La prévalence isolée ne dit pas ce que verra le lecteur : la minute n'a qu'une
place ambiante, donc ce qui compte est la carte qui **gagne l'arbitrage**, pas celle qui serait éligible.
Croisement des 500 communes GASPAR avec leurs valeurs DRIAS.

## Recouvrements

| | part des communes |
|---|---|
| risque recensé (G) | 17,6 % |
| chaleur ambiante (CH) | 7,8 % |
| indice forêt-météo ≥ 15 (IFM) | 5,2 % |
| G ∩ CH | 4,6 % |
| G ∩ IFM | 4,6 % |
| CH ∩ IFM | 4,4 % |
| les trois | 3,8 % |

## La carte ambiante finalement affichée

Ordre simulé : `risque recensé > chaleur > indice forêt-météo`.

| carte affichée | avant | après |
|---|---:|---:|
| risque feu recensé | — | 17,6 % |
| chaleur | 7,8 % | 3,2 % |
| indice forêt-météo | 0,8 % | **0,0 %** |
| aucune | 91,4 % | 79,2 % |

**Effet réel** : 12,2 % des dossiers gagnent une carte là où ils n'en avaient aucune ; 5,4 % voient leur
carte remplacée. Pas +17,6 %, comme la prévalence isolée le laissait croire.

## Le résultat qui change la décision

**L'indice forêt-météo disparaît entièrement de la minute** — 0,8 % → 0,0 %. Et le chiffre qui l'explique :

> Sur 500 communes, **aucune** commune à indice ≥ 15 n'est dépourvue à la fois du risque recensé et de la
> chaleur ambiante. La règle feu ambiante n'a **aucun cas propre** dans l'échantillon.

Autrement dit, ouvrir le risque recensé ne fait pas que réordonner : il rend `ruleFeuAmbiant` muette dans
la minute. Elle continue d'exister dans le dossier complet, mais elle ne gagnerait plus jamais l'unique
place. Le seuil de 15 j/an calibré ce matin gouvernerait alors une carte que la minute n'affiche jamais.

Ce n'est pas un argument contre l'ouverture — le risque recensé est plus intelligible et plus directement
vérifiable que l'indice. C'est un argument pour décider explicitement du sort de la règle ambiante feu au
lieu de la laisser devenir un seuil mort d'un genre nouveau : vivant, testé, et sans effet à l'écran.

---

# Après implémentation : la fusion sauve l'indice au lieu de le tuer

Mesuré le 26/07/2026 sur les mêmes 500 communes, avec le code livré.

La simulation précédente supposait **deux règles ambiantes séparées** — le risque recensé devant, l'indice
forêt-météo derrière la chaleur. Dans ce montage, l'indice tombait à 0,0 % : il ne gagnait plus jamais
l'unique place.

Le code livré ne fait pas cela. Il fusionne les deux sources dans **une seule règle feu**, comme la règle
déclarée le fait déjà. L'indice n'a donc plus à disputer la place à la chaleur : quand il parle, il parle
avec le rang du feu.

| carte affichée | avant | après |
|---|---:|---:|
| feu · risque recensé | — | 17,6 % |
| feu · indice forêt-météo | 0,8 % | **0,6 %** |
| chaleur | 7,8 % | 2,6 % |
| aucune | 91,4 % | 79,2 % |

**Dossiers portant une carte ambiante : 8,6 % → 20,8 %.**

L'indice conserve son cas propre. Ce que coûte le changement, c'est la chaleur : de 7,8 % à 2,6 % des
dossiers. Elle n'est pas perdue — elle reste dans le dossier complet — mais elle cède la place unique au
constat établi dans 5,2 % des dossiers. C'est le prix assumé du plafond à une carte.

---

# Dette ouverte : la préséance feu / chaleur n'est pas vérifiée

L'ordre `feu recensé > chaleur` applique la doctrine « à matérialité décisionnelle **comparable**, un
constat établi et directement vérifiable prime une projection ». Rien n'établit que la condition est
remplie : le recensement est communal et binaire, il ne dit ni l'intensité, ni l'étendue, ni la distance à
l'habitat. Quarante nuits tropicales projetées pourraient peser davantage sur une décision résidentielle.

**Mesure qui trancherait** : sur les communes où le feu recensé évince la chaleur, quelle part des
recensements correspond à un **PPRIF approuvé** plutôt qu'à une mention communale large ? GASPAR expose
les deux (`/gaspar/ppr`). C'est la qualification mesurable la plus proche de « suffisamment important pour
la décision ».

- Beaucoup de mentions simples → le feu reste devant l'indice, pas nécessairement devant une chaleur au p95.
- Exposition réglementaire nette → l'ordre actuel est confirmé.

**Non faite** : à moins de quatre semaines du 20/08/2026, la priorité est le parcours de bout en bout, pas
une règle de plus. Coût estimé : ~90 appels API sur les communes déjà échantillonnées.

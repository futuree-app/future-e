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

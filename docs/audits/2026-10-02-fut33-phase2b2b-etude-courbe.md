# FUT-33, phase 2B.2 B : étude de la courbe « près de la mer » (aucun code produit modifié)

Date : 02/10/2026. Base : `fb01c408` (étape A). Données brutes : `scripts/mer/fixtures/etude-courbe-2b2b.json`.
Reproduire : `node scripts/mer/etude-courbe/etude.mjs <.env>` (le vrai moteur chargé hors du site, la courbe
remplacée le temps de la mesure ; les requêtes passent dans le vrai parseur).

## Courbes comparées (d = distance du centre de la commune au rivage marin, en km)

| | Forme | 0 km | 5 km | 10 km | 20 km | 40 km | 75 km | 150 km |
|---|---|---|---|---|---|---|---|---|
| A (en production) | linéaire, 100 − d/1,5 | 100 | 97 | 93 | 87 | 73 | 50 | 0 |
| B | exponentielle, 100·e^(−d/25) | 100 | 82 | 67 | 45 | 20 | 5 | 0 |
| C | rationnelle, 100 / (1 + (d/20)²) | 100 | 94 | 80 | 50 | 20 | 7 | 2 |

Aucune n'a de seuil de rejet : les trois sont continues et ne retirent aucune commune.

## Ce que la courbe décide sans le dire

La courbe ne sert pas qu'au classement. Trois textes vus par le lecteur se déclenchent sur son score, donc sur une
distance implicite :

| Texte déclenché par le score | A (en production) | B | C |
|---|---|---|---|
| Palier « En bord de mer » du Dossier comparatif (score ≥ 66) | jusqu'à **51 km** | 10,4 km | 14,4 km |
| Palier « Loin de la mer » du Dossier comparatif (score < 34) | au-delà de **99 km** | 27 km | 27,9 km |
| Raison de carte (« à proximité du littoral ») possible (score ≥ 55) | jusqu'à 67,5 km | 14,9 km | 18,1 km |
| Compromis « éloignée du littoral » (score < 50) | au-delà de 75 km | 17,3 km | 20 km |

Avec A, le Dossier comparatif (payant) range aujourd'hui Bordeaux (39 km), Nantes (39 km) et Rennes (48 km) en « En
bord de mer ». Ce n'est pas nouveau (avant la 2B.1, l'ancienne distance donnait le même palier à Bordeaux), mais
c'est le défaut le plus visible de la courbe A, et il est payant.

## Panel (scores ; rang dans la requête « ville moyenne près de la mer, avec un train pour Paris », A → B → C)

| Commune | Centre → rivage (km) | A | B | C | Rang A → B → C |
|---|---|---|---|---|---|
| Perros-Guirec | 0 | 100 | 100 | 100 | 2159 → 739 → 951 |
| Lannion | 0.66 | 100 | 97 | 100 | 1881 → 702 → 831 |
| Brest | 1.36 | 99 | 95 | 100 | 474 → 189 → 225 |
| La Rochelle | 0.95 | 99 | 96 | 100 | 203 → 85 → 106 |
| Châtelaillon-Plage | 1.04 | 99 | 96 | 100 | 272 → 115 → 147 |
| Vannes | 0.82 | 99 | 97 | 100 | 135 → 63 → 77 |
| Narbonne | 1.62 | 99 | 94 | 99 | 63 → 42 → 43 |
| Morlaix | 3.18 | 98 | 88 | 98 | 797 → 402 → 372 |
| Montpellier | 6.85 | 95 | 76 | 90 | 782 → 564 → 485 |
| Rochefort | 7.97 | 95 | 73 | 86 | 564 → 496 → 403 |
| Lacanau | 8.46 | 94 | 71 | 85 | 290 → 361 → 278 |
| Caen | 9.23 | 94 | 69 | 82 | 376 → 452 → 351 |
| Carcans | 11.94 | 92 | 62 | 74 | 1318 → 1440 → 1055 |
| Arles | 13.36 | 91 | 59 | 69 | 333 → 567 → 537 |
| Béziers | 12.2 | 92 | 61 | 73 | 683 → 746 → 689 |
| Nîmes | 20.99 | 86 | 43 | 48 | 526 → 1045 → 1069 |
| Saintes | 23.79 | 84 | 39 | 41 | 1503 → 2698 → 2803 |
| Pessac | 28.57 | 81 | 32 | 33 | 1613 → 3116 → 3401 |
| Bordeaux | 39.35 | 74 | 21 | 21 | 2010 → 4202 → 4634 |
| Nantes | 38.93 | 74 | 21 | 21 | 1720 → 3625 → 4052 |
| Rennes | 47.55 | 68 | 15 | 15 | 1428 → 3164 → 3538 |
| Niort | 49.55 | 67 | 14 | 14 | 1767 → 3743 → 4135 |
| Angers | 118.09 | 21 | 1 | 3 | 5640 → 4064 → 4254 |
| Poitiers | 117.25 | 22 | 1 | 3 | 4782 → 3585 → 3826 |
| Toulouse | 135.77 | 9 | 0 | 2 | 11737 → 8597 → 8693 |
| Lyon 1er Arrondissement | 239.47 | 0 | 0 | 1 | 13085 → 7784 → 8155 |
| Annecy | 259.71 | 0 | 0 | 1 | 10567 → 5071 → 5415 |
| Clermont-Ferrand | 252.8 | 0 | 0 | 1 | 11112 → 5537 → 5881 |
## Effet réel sur le classement (34 788 communes, score du moteur recalculé sur toutes)

Requêtes passées dans le vrai parseur ; aucune ne pose de contrainte dure.

| Requête (préférences lues) | | A | B | C |
|---|---|---|---|---|
| « Une petite ville près de la mer » (mer 2, éviter grandes villes 2) | 1 000 premières à ≤ 10 km | 76 % | 100 % | 100 % |
| | rang de Lannion | 22 273 | 452 | 782 |
| « Une ville moyenne près de la mer, avec un train pour Paris » (mer 2, train 2, grandes villes 2, isolement 2) | 100 premières : distance médiane | 4,7 km | 1,4 km | 1,9 km |
| | 1 000 premières à plus de 30 km | 29 % | 10 % | 2 % |
| | rang de Bordeaux / Nantes | 2 010 / 1 720 | 4 202 / 3 625 | 4 634 / 4 052 |
| « Proche de la mer, mais pas trop chaud l'été » (mer 3, fraîcheur 3) | rang de Lannion | 14 | 7 | 10 |
| | rang de Bordeaux | 8 665 | 18 713 | 19 139 |
| « Une petite ville vivante près du littoral » (mer 2, grandes villes 2, vie locale 2) | 1 000 premières à ≤ 10 km | 66 % | 87 % | 89 % |

Les 5 communes montrées par le moteur changent peu (au plus une sur cinq) : la France compte assez de communes au
bord de l'eau pour remplir le haut du classement quelle que soit la courbe. L'écart se joue plus bas, et dans les
textes ci-dessus. Le cas le plus parlant est la première requête : avec A, un village à 30 km du rivage (mer 80,
« petite » 100) passe devant Lannion (mer 100, mais 20 000 habitants) ; 22 000 communes la devancent. Avec A,
« près de la mer » ne départage presque plus rien en dessous de 50 km.

## Avantages et défauts

- **A, linéaire sur 150 km.** Simple, déjà en place. Mais une pente de 0,67 point par km : 40 km ne coûtent que 27
  points. Une autre préférence l'emporte vite, et les paliers dérivés disent « En bord de mer » jusqu'à 51 km.
- **B, exponentielle.** Sensible dès le premier kilomètre : Brest (1,4 km) 95, Morlaix (3,2 km) 88. Au grain du
  centre de commune, cette précision est fausse : un centre à 3 km de l'eau n'est pas « moins près de la mer » pour
  qui y vit, à l'échelle d'un choix de commune.
- **C, rationnelle.** Un plateau près de l'eau (≥ 94 jusqu'à 5 km : toutes les communes riveraines se valent), une
  chute entre 10 et 30 km (le point milieu, score 50, est à 20 km), puis une longue traîne sans couperet. Elle
  rend « près de la mer » décisif dans les requêtes mixtes (2 % des 1 000 premières au-delà de 30 km, contre 29 %
  avec A), sans écraser l'ordre des communes du bord de l'eau.

## Recommandation

**C, avec un point milieu à 20 km** : score = 100 / (1 + (d/20)²). Le paramètre est une convention produit ; il se
discute avant d'être codé. Repères pour en juger : 15 km donnerait Caen 73 et Arles 56 ; 25 km donnerait Caen 88
et Bordeaux 29.

Deux choses à NE PAS faire en codant C :
1. Laisser les paliers du Dossier comparatif et les textes de carte dériver de la courbe. Avec C, Arles (13 km)
   resterait « En bord de mer ». Les libellés doivent reposer sur des définitions explicites (étape D), pas sur
   les tranches 34 / 66 d'un score.
2. Réutiliser C comme définition de « loin de la mer » sans nombre. Une préférence inverse est possible ensuite,
   mais c'est une décision distincte.

## Risques et points ouverts

- Le score affiché d'une commune (compatibilité) baisse pour les communes à 10-40 km du rivage dans toute
  recherche « près de la mer » ; aucune n'est retirée.
- Le rayon d'exploration de `nearSea` sans nombre (30 km, bonus linéaire) reste une autre courbe : à aligner sur
  C ou à retirer, dans le même lot.
- Les paliers du Dossier comparatif sont en production avec A. Ils relèvent de l'étape D, mais leur défaut est
  actuel.

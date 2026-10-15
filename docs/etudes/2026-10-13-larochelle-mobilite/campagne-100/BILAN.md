# Campagne 20 → 100 communes : bilan cumulatif

Mis à jour le 2026-10-15T17:28:33Z par `outil/campagne.py bilan`. Mesures détaillées : `campagne-100/mesures.csv` (une ligne par étape et par appel). Sélection : `campagne-100/candidats.csv`. Aucune publication ; les vérifications avant publication restent à faire.

**Communes distinctes préparées : 34** (20 avant la campagne, 14 pendant).

## Lots

| Lot | Communes retenues | Inexploitables remplacées | Prêtes à relire | Suspendu |
|---|---|---|---|---|
| 2026-10-lot-04-campagne | 20 | Lille (59350) | 14 | oui |
| 2026-10-lot-05-campagne | 20 | aucune | 0 | oui |
| 2026-10-lot-06-campagne | 20 | aucune | 0 | non |
| 2026-10-lot-07-campagne | 20 | aucune | 0 | non |

## Exceptions carburant

Aucune : toutes les communes rédigées ont des faits carburant utilisables.

## Erreurs de niveau 1 (correction)

- Toulouse (31555), reste à voir : raisonnement : Le titre fait de la part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max, tableau de la section 3) un critère de choix de quartie ; raisonnement : Les pratiques des actifs de chaque secteur (section 3) deviennent une liste de secteurs à cibler. La phrase suivante (« gardez donc votre lieu de travail à côté ; contrôle valeur : « 6 L/100 km » ne correspond à aucune valeur du dossier pour scenario.carburant.gazole.5km, scenario.carburant.e10.5km (80, 5, 0.7, 60, 5, 0.5) ; contrôle valeur : « 200 allers-retours » ne correspond à aucune valeur du dossier pour scenario.carburant.gazole.5km, scenario.carburant.e10.5km (80, 5, 0.7, 60, 5, 0.5)
- Nice (06088), reste à voir : raisonnement : Le titre présente les pratiques des actifs d'un secteur (iris.voiture.min, iris.voiture.max) comme un levier : choisir un secteur ferait moins prendre la voitur ; raisonnement : La faible part de la voiture chez les actifs d'un secteur (section 3) devient une recommandation de quartier pour le lecteur, juste après des chiffres par commu ; contrôle valeur : « 6 L/100 km » ne correspond à aucune valeur du dossier pour scenario.carburant.gazole.5km (70, 5, 0.6) ; contrôle valeur : « 200 allers-retours par an » ne correspond à aucune valeur du dossier pour scenario.carburant.gazole.5km (70, 5, 0.6)
- Nantes (44109), corrigé : raisonnement : « Pourtant » présente la proximité des commerces, de la pharmacie et de l'école (iris.441090802.panier_500m) comme si elle devait réduire l'usage de la voiture  ; raisonnement : Les observations sur la Chauvinière (iris.441090802.panier_500m, iris.441090802.voiture) deviennent une recommandation de ce secteur pour le lecteur, alors qu'e
- Montpellier (34172), reste à voir : contrôle valeur : « SP95-E10 » ne correspond à aucune valeur du dossier pour carburant.e10.ecart (0.51)
- Strasbourg (67482), corrigé : raisonnement : Après les deux secteurs extrêmes pour la voiture (iris.674820202 : 9 % de voiture et 100 % de panier ; iris.674823002 : 67 % et 15 %), cette phrase présente un 
- Bordeaux (33063), corrigé : population : Sans son numéro, « Lestonnat-Monséjour » se lit comme un quartier. Or le chiffre de 97 % ne vaut que pour Lestonnat-Monséjour 2 (`iris.330630802.panier_500m`). 
- Rennes (35238), corrigé : raisonnement : La phrase présente les pratiques des actifs d'un secteur (iris.352380102.voiture, iris.352380506.voiture) comme un repère pour choisir où chercher. Elle en fait
- Reims (51454), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent ce secteur (`iris.514544502.voiture`, 81 %, tous lieux de travail confondus) devient un conseil propre à ce q
- Saint-Étienne (42218), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min, 26 %) devient une recommandation de quartier pour le lecteur. Or cette part déc
- Le Havre (76351), corrigé : raisonnement : Cette transition annonce que la suite dira quels secteurs choisir pour moins conduire. Juste après viennent les parts de voiture des habitants par secteur (iris
- Dijon (21231), corrigé : raisonnement : Cette phrase déduit du seul chiffre `mobpro.voiture_selon_destination.communes_voisines` (72 %, tous secteurs confondus) que le secteur de résidence pèse peu po

Niveau 2 (noté, sans nouvelle génération) : 30 remarque(s), détail dans `relecture.anomalies.json` de chaque commune.

## Jetons par outil et par étape

Compteurs tels que chaque outil les rapporte, sans double compte : chez Codex, l'entrée inclut le cache et la sortie inclut le raisonnement ; chez Claude Code, l'entrée totale est la somme des entrées non mises en cache, écrites en cache et lues en cache, et la sortie inclut la réflexion. **Ces jetons ne mesurent pas la consommation du quota des abonnements**, que ni Codex ni Claude Code n'exposent.

| Outil | Étape | Appels | Échecs ou refus | Entrée totale | dont cache lu | dont cache écrit | Sortie totale | dont raisonnement | Durée cumulée | Non mesurés |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | collecte (par réseau) | 14 | 1 | 657 893 | 133 697 | 42 088 | 86 039 | 1 500 | 7 min 22 s |  |
| claude-code | relecture | 15 | 1 | 645 643 | 44 590 | 601 025 | 52 798 | 42 171 | 8 min 22 s |  |
| codex | correction | 11 | 0 | 416 961 | 23 040 | sans objet | 38 409 | 5 895 | 11 min 07 s |  |
| codex | redaction | 15 | 0 | 551 191 | 38 400 | sans objet | 78 324 | 37 454 | 32 min 16 s |  |

Codex, par commune (entrée + sortie, hors collecte) : total 1 084 885, médiane 81 161, maximum 89 992 (Nice).

Claude, par commune (entrée + sortie, hors collecte) : total 698 441, médiane 49 238, maximum 54 223 (Strasbourg).

## Durées

- Temps cumulé des traitements (préparation, collecte, rédaction, relecture, correction, visuels) : 2 h 02 min.
- Par commune (hors collecte) : médiane 5 min 09 s, les trois plus longues : Nice 9 min 20 s, Montpellier 6 min 35 s, Nantes 6 min 12 s.
- Durée réelle de la campagne : 54 min 49 s (du premier lancement à la dernière fin enregistrée) ; aucune pause de quota.
- Interventions du terminal pilote : 42 min (0 mesurées, 42 estimées).
  - 2026-10-15 15:56 UTC, 22 min (estimée) : Mise en place : phrase remplacée dans les huit articles, instrumentation de la chaîne pour la mesure, sélection, compteur /dev/lot, essais à blanc
  - 2026-10-15 16:39 UTC, 12 min (estimée) : Lot 1 : Lille (défaut NaN du dossier corrigé, reprise au lot 2) ; faux positif du contrôle sur les hypothèses du scénario carburant corrigé ; arrêt du lot pendant un rendu de visuels (aucun appel en cours) et relance
  - 2026-10-15 16:50 UTC, 8 min (estimée) : Lot 1 : deux autres faux positifs du contrôle (SP95-E10, base 100 km) corrigés, essais de non-régression, second arrêt-relance pendant des visuels

## Suspensions

- 2026-10-15T17:28:09Z (lot 1, rediger) : suspendu par quota · « relecture » : You've hit your session limit · resets 7:30pm (Europe/Paris)
- 2026-10-15T17:28:20Z (lot 2, collecter) : suspendu par quota · « collecte » : You've hit your session limit · resets 7:30pm (Europe/Paris)

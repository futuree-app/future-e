# Campagne 20 → 100 communes : bilan cumulatif

Mis à jour le 2026-10-15T18:19:39Z par `outil/campagne.py bilan`. Mesures détaillées : `campagne-100/mesures.csv` (une ligne par étape et par appel). Sélection : `campagne-100/candidats.csv`. Aucune publication ; les vérifications avant publication restent à faire.

**Communes distinctes préparées : 40** (20 avant la campagne, 20 pendant).

## Lots

| Lot | Communes retenues | Inexploitables remplacées | Prêtes à relire | Suspendu |
|---|---|---|---|---|
| 2026-10-lot-04-campagne | 20 | Lille (59350) | 20 | non |
| 2026-10-lot-05-campagne | 20 | aucune | 0 | oui |
| 2026-10-lot-06-campagne | 20 | aucune | 0 | non |
| 2026-10-lot-07-campagne | 20 | aucune | 0 | non |

## Exceptions carburant

Aucune : toutes les communes rédigées ont des faits carburant utilisables.

## Erreurs de niveau 1 (correction)

- Toulouse (31555), corrigé : raisonnement : Le titre fait de la part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max, tableau de la section 3) un critère de choix de quartie ; raisonnement : Les pratiques des actifs de chaque secteur (section 3) deviennent une liste de secteurs à cibler. La phrase suivante (« gardez donc votre lieu de travail à côté
- Nice (06088), corrigé : raisonnement : Le titre présente les pratiques des actifs d'un secteur (iris.voiture.min, iris.voiture.max) comme un levier : choisir un secteur ferait moins prendre la voitur ; raisonnement : La faible part de la voiture chez les actifs d'un secteur (section 3) devient une recommandation de quartier pour le lecteur, juste après des chiffres par commu
- Nantes (44109), corrigé : raisonnement : « Pourtant » présente la proximité des commerces, de la pharmacie et de l'école (iris.441090802.panier_500m) comme si elle devait réduire l'usage de la voiture  ; raisonnement : Les observations sur la Chauvinière (iris.441090802.panier_500m, iris.441090802.voiture) deviennent une recommandation de ce secteur pour le lecteur, alors qu'e
- Strasbourg (67482), corrigé : raisonnement : Après les deux secteurs extrêmes pour la voiture (iris.674820202 : 9 % de voiture et 100 % de panier ; iris.674823002 : 67 % et 15 %), cette phrase présente un 
- Bordeaux (33063), corrigé : population : Sans son numéro, « Lestonnat-Monséjour » se lit comme un quartier. Or le chiffre de 97 % ne vaut que pour Lestonnat-Monséjour 2 (`iris.330630802.panier_500m`). 
- Rennes (35238), corrigé : raisonnement : La phrase présente les pratiques des actifs d'un secteur (iris.352380102.voiture, iris.352380506.voiture) comme un repère pour choisir où chercher. Elle en fait
- Reims (51454), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent ce secteur (`iris.514544502.voiture`, 81 %, tous lieux de travail confondus) devient un conseil propre à ce q
- Saint-Étienne (42218), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min, 26 %) devient une recommandation de quartier pour le lecteur. Or cette part déc
- Le Havre (76351), corrigé : raisonnement : Cette transition annonce que la suite dira quels secteurs choisir pour moins conduire. Juste après viennent les parts de voiture des habitants par secteur (iris
- Dijon (21231), corrigé : raisonnement : Cette phrase déduit du seul chiffre `mobpro.voiture_selon_destination.communes_voisines` (72 %, tous secteurs confondus) que le secteur de résidence pèse peu po
- Aix-en-Provence (13001), corrigé : raisonnement : Le titre et la question du chapeau (« quels secteurs regarder si l'on souhaite réduire la place de la voiture ? Les pratiques de travail […] apportent des repèr
- Annecy (74010), corrigé : raisonnement : La phrase fait des pratiques des actifs qui habitent Courier et Vieugy-Balmont (iris.740100101.voiture, iris.740101503.voiture) un critère de choix d'annonce. E
- Limoges (87085), corrigé : croisement : Cet intertitre, avec le titre « Vivre et travailler à Limoges », présente l'écart entre 48 % et 94 % (iris.870850204.voiture, iris.870851601.voiture) comme un c
- Boulogne-Billancourt (92012), après correction, 4 anomalie(s) du contrôle : contrôle valeur : « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.voiture.min (17.0) ; contrôle valeur : « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.voiture.max (46.0) ; contrôle valeur : « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.920120506.panier_500m (100.0) ; contrôle valeur : « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.920120703.panier_500m (77.7)

Corrections déclenchées seulement par un faux positif du contrôle (corrigé depuis ; l'appel a bien eu lieu et est compté) :
- Montpellier (34172) : « SP95-E10 » ne correspond à aucune valeur du dossier pour carburant.e10.ecart (0.51)

Niveau 2 (noté, sans nouvelle génération) : 37 remarque(s), détail dans `relecture.anomalies.json` de chaque commune.

## Jetons par outil et par étape

Compteurs tels que chaque outil les rapporte, sans double compte : chez Codex, l'entrée inclut le cache et la sortie inclut le raisonnement ; chez Claude Code, l'entrée totale est la somme des entrées non mises en cache, écrites en cache et lues en cache, et la sortie inclut la réflexion. **Ces jetons ne mesurent pas la consommation du quota des abonnements**, que ni Codex ni Claude Code n'exposent.

| Outil | Étape | Appels | Échecs ou refus | Entrée totale | dont cache lu | dont cache écrit | Sortie totale | dont raisonnement | Durée cumulée | Non mesurés |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | collecte (par réseau) | 14 | 1 | 657 893 | 133 697 | 42 088 | 86 039 | 1 500 | 7 min 22 s |  |
| claude-code | relecture | 21 | 1 | 906 552 | 65 170 | 841 342 | 71 653 | 58 591 | 11 min 30 s |  |
| codex | correction | 15 | 0 | 559 185 | 30 720 | sans objet | 51 212 | 6 496 | 14 min 25 s |  |
| codex | redaction | 20 | 0 | 723 414 | 61 440 | sans objet | 103 130 | 48 315 | 41 min 19 s |  |

Codex, par commune (entrée + sortie, hors collecte) : total 1 436 941, médiane 81 018, maximum 89 992 (Nice).

Claude, par commune (entrée + sortie, hors collecte) : total 978 205, médiane 48 689, maximum 54 223 (Strasbourg).

## Durées

- Temps cumulé des traitements (préparation, collecte, rédaction, relecture, correction, visuels) : 2 h 21 min.
- Par commune (hors collecte) : médiane 4 min 56 s, les trois plus longues : Nice 9 min 20 s, Montpellier 6 min 35 s, Nantes 6 min 12 s.
- Durée réelle de la campagne : 2 h 25 min (du premier lancement à la dernière étape enregistrée), dont pauses de quota : 32 min 33 s (de la suspension à la reprise ; la limite se levait à l'heure annoncée par le message, la reprise dépend du pilote).
- Interventions du terminal pilote : 47 min (0 mesurées, 47 estimées).
  - 2026-10-15 15:56 UTC, 22 min (estimée) : Mise en place : phrase remplacée dans les huit articles, instrumentation de la chaîne pour la mesure, sélection, compteur /dev/lot, essais à blanc
  - 2026-10-15 16:39 UTC, 12 min (estimée) : Lot 1 : Lille (défaut NaN du dossier corrigé, reprise au lot 2) ; faux positif du contrôle sur les hypothèses du scénario carburant corrigé ; arrêt du lot pendant un rendu de visuels (aucun appel en cours) et relance
  - 2026-10-15 16:50 UTC, 8 min (estimée) : Lot 1 : deux autres faux positifs du contrôle (SP95-E10, base 100 km) corrigés, essais de non-régression, second arrêt-relance pendant des visuels
  - 2026-10-15 18:00 UTC, 5 min (estimée) : Erreur du pilote : lot 2 lancé à 17:28 UTC alors que le lot 1 venait d'être suspendu par la limite de session Claude (fin prise pour une réussite) ; un appel de collecte refusé en 3 s, sans jeton consommé. Constat, commit et poussée de l'état suspendu

## Suspensions

- 2026-10-15T17:28:09Z (lot 1, rediger) : suspendu par quota · « relecture » : You've hit your session limit · resets 7:30pm (Europe/Paris)
- 2026-10-15T17:28:20Z (lot 2, collecter) : suspendu par quota · « collecte » : You've hit your session limit · resets 7:30pm (Europe/Paris)

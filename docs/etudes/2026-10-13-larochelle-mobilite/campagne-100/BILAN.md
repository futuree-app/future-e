# Campagne 20 → 100 communes : bilan cumulatif

Mis à jour le 2026-10-15T20:43:54Z par `outil/campagne.py bilan`. Mesures détaillées : `campagne-100/mesures.csv` (une ligne par étape et par appel). Sélection : `campagne-100/candidats.csv`. Aucune publication ; les vérifications avant publication restent à faire.

**Communes distinctes préparées : 80** (20 avant la campagne, 60 pendant).

## Lots

| Lot | Communes retenues | Inexploitables remplacées | Prêtes à relire | Suspendu |
|---|---|---|---|---|
| 2026-10-lot-04-campagne | 20 | Lille (59350) | 20 | non |
| 2026-10-lot-05-campagne | 20 | aucune | 20 | non |
| 2026-10-lot-06-campagne | 20 | aucune | 20 | non |
| 2026-10-lot-07-campagne | 20 | aucune | 0 | non |

## Exceptions carburant

- Ajaccio (2A004) : faits carburant absents ou inutilisables dans le dossier

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
- Perpignan (66136), corrigé : raisonnement : Le passage transforme les pratiques domicile-travail des actifs qui habitent un secteur (iris.voiture.min, iris.voiture.max) en recommandation de quartier pour  ; raisonnement : Le titre présente les parts de la voiture par secteur (iris.voiture.min, iris.voiture.max) comme une liste de quartiers à cibler pour moins conduire. C'est la m
- Orléans (45234), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min) devient une recommandation de quartier pour le lecteur. La phrase suivante (« À
- Argenteuil (95018), corrigé : raisonnement : La part de voiture des actifs qui habitent déjà Carême Prenant (iris.voiture.min, 24 %) devient un conseil de quartier pour le lecteur, comme si s'y installer d
- Nancy (54395), corrigé : raisonnement : La phrase présente le secteur d'habitation comme un levier pour moins conduire. Or `iris.voiture.min` et `iris.voiture.max` décrivent seulement les pratiques de
- Tourcoing (59599), corrigé : raisonnement : Dans un article qui veut aider à « choisir son adresse pour moins prendre la voiture », cette phrase fait des parts de voiture des habitants de chaque secteur (
- Créteil (94028), corrigé : raisonnement : Cette phrase vient juste après « 24 % à Lévrière-Haye aux Moines, contre 41 % à L'Ormetteau » : elle fait des pratiques des actifs de ces deux secteurs (iris.94
- Avignon (84007), corrigé : raisonnement : La phrase demande de trier les annonces d'après la part de la voiture chez les actifs qui habitent chaque secteur (iris.840070110.voiture, iris.840070130.voitur
- Versailles (78646), corrigé : raisonnement : Avec le titre et la question de transition, cette phrase transforme les pratiques des actifs qui habitent un secteur (iris.voiture.min, iris.voiture.max, quel q
- Béziers (34032), corrigé : raisonnement : Cette phrase fait de la part de la voiture des actifs d'un secteur (iris.voiture.min, iris.voiture.max) un repère pour le futur trajet du lecteur et pour sa pro
- Cherbourg-en-Cotentin (50129), corrigé : raisonnement : Le « donc » déduit des 65 % de `mobpro.voiture_selon_destination.meme_commune` que le secteur choisi pèse sur l'usage de la voiture : il change les pratiques de ; raisonnement : La carte des parts de la voiture par secteur (`iris.*.voiture`) devient un guide pour choisir où chercher afin de moins conduire : la pratique des habitants act
- Champigny-sur-Marne (94017), corrigé : raisonnement : Le titre fait des pratiques domicile-travail des actifs résidents (iris.940171101.voiture, iris.940171304.voiture) une recommandation de secteur pour le lecteur
- Mérignac (33281), corrigé : raisonnement : Le titre fait des pratiques domicile-travail des actifs d'un secteur (iris.voiture.min, iris.voiture.max) une recommandation de quartier pour le lecteur, alors 
- Saint-Maur-des-Fossés (94068), après correction, 1 anomalie(s) du contrôle : contrôle valeur : « Paris 8e Arrondissement » ne correspond à aucune valeur du dossier pour destination.75108.voiture (13.3)
- Ajaccio (2A004), corrigé : raisonnement : Avec le titre « quels secteurs regarder pour utiliser moins la voiture ? », cette phrase fait des pratiques des actifs qui habitent Centre Ville et La Confina (
- Cannes (06029), corrigé : raisonnement : Juste après les parts de 29 % et 75 % (iris.voiture.min, iris.voiture.max), la phrase fait des pratiques des actifs qui habitent un secteur un guide pour choisi
- Drancy (93029), corrigé : raisonnement : La part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max) sert ici de repère pour choisir un quartier : elle devient une recommand
- Noisy-le-Grand (93051), corrigé : raisonnement : Le titre pose la question « où chercher », et le seul contraste de secteurs du texte y répond (20 % contre 47 % de voiture, puis 98 % contre 34 % pour le panier
- Vénissieux (69259), corrigé : raisonnement : La part de la voiture par secteur décrit les pratiques de 2022 des actifs qui y résident, quelle que soit leur commune de travail (iris.voiture.min, iris.voitur

Corrections déclenchées seulement par un faux positif du contrôle (corrigé depuis ; l'appel a bien eu lieu et est compté) :
- Montpellier (34172) : « SP95-E10 » ne correspond à aucune valeur du dossier pour carburant.e10.ecart (0.51)
- Boulogne-Billancourt (92012) : « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.voiture.min (17.0) ; « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.voiture.ma ; « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.920120506.panier_500m (1 ; « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.920120703.
- Lille (59350) : « « 400 Maisons-Cimetière du Sud » » ne correspond à aucune valeur du dossier pour iris.593500707.vo ; « « 400 Maisons-Cimetière du Sud » » ne correspond à aucune valeur du dossier pour iris.593500707.pa
- Saint-Denis (93066) : « 06 » ne correspond à aucune valeur du dossier pour iris.voiture.min (11.0) ; « 05 » ne correspond à aucune valeur du dossier pour iris.voiture.max (35.0)
- Montreuil (93048) : « 2 dans « Bas Montreuil Ouest 2 » » ne correspond à aucune valeur du dossier pour iris.voiture.min  ; « 5 dans « Montreau Ruffins Clos Arachis 5 » » ne correspond à aucune valeur du dossier pour iris.vo
- Aulnay-sous-Bois (93005) : « Paris 8e Arrondissement » ne correspond à aucune valeur du dossier pour destination.75108.voiture 

Niveau 2 (noté, sans nouvelle génération) : 82 remarque(s), détail dans `relecture.anomalies.json` de chaque commune.

## Jetons par outil et par étape

Compteurs tels que chaque outil les rapporte, sans double compte : chez Codex, l'entrée inclut le cache et la sortie inclut le raisonnement ; chez Claude Code, l'entrée totale est la somme des entrées non mises en cache, écrites en cache et lues en cache, et la sortie inclut la réflexion. **Ces jetons ne mesurent pas la consommation du quota des abonnements**, que ni Codex ni Claude Code n'exposent.

| Outil | Étape | Appels | Échecs ou refus | Entrée totale | dont cache lu | dont cache écrit | Sortie totale | dont raisonnement | Durée cumulée | Non mesurés |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | collecte (par réseau) | 19 | 1 | 881 974 | 182 819 | 65 334 | 127 360 | 2 208 | 10 min 24 s |  |
| claude-code | relecture | 61 | 1 | 2 558 751 | 202 370 | 2 356 261 | 191 748 | 161 154 | 31 min 25 s |  |
| codex | correction | 37 | 0 | 1 307 823 | 76 800 | sans objet | 116 529 | 11 949 | 31 min 59 s |  |
| codex | redaction | 60 | 0 | 2 061 982 | 263 296 | sans objet | 312 789 | 153 559 | 2 h 06 min |  |

Codex, par commune (entrée + sortie, hors collecte) : total 3 799 123, médiane 74 836, maximum 89 992 (Nice).

Claude, par commune (entrée + sortie, hors collecte) : total 2 750 499, médiane 44 895, maximum 54 223 (Strasbourg).

## Durées

- Temps cumulé des traitements (préparation, collecte, rédaction, relecture, correction, visuels) : 4 h 43 min.
- Par commune (hors collecte) : médiane 4 min 10 s, les trois plus longues : Nice 9 min 20 s, Avignon 8 min 55 s, Montpellier 6 min 35 s.
- Durée réelle de la campagne : 4 h 49 min (du premier lancement à la dernière étape enregistrée), dont pauses de quota : 32 min 33 s (de la suspension à la reprise ; la limite se levait à l'heure annoncée par le message, la reprise dépend du pilote).
- Interventions du terminal pilote : 64 min (0 mesurées, 64 estimées).
  - 2026-10-15 15:56 UTC, 22 min (estimée) : Mise en place : phrase remplacée dans les huit articles, instrumentation de la chaîne pour la mesure, sélection, compteur /dev/lot, essais à blanc
  - 2026-10-15 16:39 UTC, 12 min (estimée) : Lot 1 : Lille (défaut NaN du dossier corrigé, reprise au lot 2) ; faux positif du contrôle sur les hypothèses du scénario carburant corrigé ; arrêt du lot pendant un rendu de visuels (aucun appel en cours) et relance
  - 2026-10-15 16:50 UTC, 8 min (estimée) : Lot 1 : deux autres faux positifs du contrôle (SP95-E10, base 100 km) corrigés, essais de non-régression, second arrêt-relance pendant des visuels
  - 2026-10-15 18:00 UTC, 5 min (estimée) : Erreur du pilote : lot 2 lancé à 17:28 UTC alors que le lot 1 venait d'être suspendu par la limite de session Claude (fin prise pour une réussite) ; un appel de collecte refusé en 3 s, sans jeton consommé. Constat, commit et poussée de l'état suspendu
  - 2026-10-15 18:24 UTC, 7 min (estimée) : Fin du lot 1 : motifs recalculés, faux positif « « 1 » dans Trapèze 1 » corrigé, arrêt-relance du lot 2 pendant des visuels
  - 2026-10-15 19:38 UTC, 10 min (estimée) : Fin du lot 2 : six faux positifs de libellés remplacés par une règle générale du contrôle (ligne qui justifie un libellé), vérification sur 58 articles et par falsification, motifs des lots 1 et 2 recalculés, arrêt-relance du lot 3 pendant des visuels

## Suspensions

- 2026-10-15T17:28:09Z (lot 1, rediger) : suspendu par quota · « relecture » : You've hit your session limit · resets 7:30pm (Europe/Paris)
- 2026-10-15T17:28:20Z (lot 2, collecter) : suspendu par quota · « collecte » : You've hit your session limit · resets 7:30pm (Europe/Paris)

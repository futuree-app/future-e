# Campagne 20 → 100 communes : bilan cumulatif

Mis à jour le 2026-10-16T00:09:07Z par `outil/campagne.py bilan`. Mesures détaillées : `campagne-100/mesures.csv` (une ligne par étape et par appel). Sélection : `campagne-100/candidats.csv`. Aucune publication ; les vérifications avant publication restent à faire.

**Communes distinctes préparées : 100** (20 avant la campagne, 80 pendant).

## Lots

| Lot | Communes retenues | Inexploitables remplacées | Prêtes à relire | Suspendu |
|---|---|---|---|---|
| 2026-10-lot-04-campagne | 20 | Lille (59350) | 20 | non |
| 2026-10-lot-05-campagne | 20 | aucune | 20 | non |
| 2026-10-lot-06-campagne | 20 | aucune | 20 | non |
| 2026-10-lot-07-campagne | 20 | aucune | 20 | non |

## Exceptions carburant

Aucune : toutes les communes rédigées ont des faits carburant utilisables.

Données carburant plus fragiles, écrites comme telles :
- Ajaccio (2A004) : hausse du gazole en ordre de grandeur, sans SP95-E10 ; entrée carburant présente

## Articles corrigés pour une anomalie de niveau 1 : 41

Un article peut avoir reçu plusieurs anomalies ; leur gravité varie (une recommandation explicite de quartier n'a pas le poids d'une invitation générale à examiner son trajet).

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
- Ajaccio (2A004), corrigé : raisonnement : Avec le titre « quels secteurs regarder pour utiliser moins la voiture ? », cette phrase fait des pratiques des actifs qui habitent Centre Ville et La Confina (
- Cannes (06029), corrigé : raisonnement : Juste après les parts de 29 % et 75 % (iris.voiture.min, iris.voiture.max), la phrase fait des pratiques des actifs qui habitent un secteur un guide pour choisi
- Drancy (93029), corrigé : raisonnement : La part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max) sert ici de repère pour choisir un quartier : elle devient une recommand
- Noisy-le-Grand (93051), corrigé : raisonnement : Le titre pose la question « où chercher », et le seul contraste de secteurs du texte y répond (20 % contre 47 % de voiture, puis 98 % contre 34 % pour le panier
- Vénissieux (69259), corrigé : raisonnement : La part de la voiture par secteur décrit les pratiques de 2022 des actifs qui y résident, quelle que soit leur commune de travail (iris.voiture.min, iris.voitur
- Évry-Courcouronnes (91228), corrigé : raisonnement : Les parts de la voiture des actifs qui habitent Centre Urbain Nord et Courcouronnes Centre Nord (iris.voiture.min, iris.voiture.max) deviennent un critère pour 
- Bourges (18033), corrigé : raisonnement : Sous le titre « où chercher un logement pour moins prendre la voiture ? », la part de la voiture chez les actifs qui habitent un secteur (iris.voiture.min, iris
- Antony (92002), corrigé : raisonnement : Le titre pose une question qui appelle un secteur à recommander. Le récit y répond implicitement par le contraste entre Fontaine Mouton et Bas Graviers (iris.92
- La Seyne-sur-Mer (83126), corrigé : raisonnement : La part de la voiture parmi les actifs qui habitent ce secteur (iris.voiture.min, 57 %) devient une recommandation de quartier pour le lecteur. Le dossier décri
- Villeneuve-d'Ascq (59009), corrigé : raisonnement : Juste après « les pratiques varient fortement selon le secteur », la question fait de la part de la voiture chez les actifs d'un secteur (section 3, iris.590090 ; raisonnement : La carte des parts de la voiture par secteur (iris.*.voiture, actifs qui habitent le secteur, recensement 2022) devient un outil pour trier les logements. Or ce
- Montauban (82121), corrigé : raisonnement : La phrase transforme une pratique observée chez les actifs du secteur (iris.821210101.voiture, 55 %) en recommandation de quartier pour le lecteur. C'est un lie
- Chambéry (73065), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent chaque secteur (iris.voiture.min, iris.voiture.max, section 3) devient ici un critère de choix de quartier po
- Sarcelles (95585), corrigé : raisonnement : La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min, 20 %) devient une recommandation de quartier pour le lecteur. Le texte suggère 
- Fréjus (83061), corrigé : raisonnement : La carte montre les pratiques domicile-travail de 2022 des actifs qui habitent chaque secteur (iris.830610108.voiture, iris.830610106.voiture), quelle que soit 
- Beauvais (60057), corrigé : raisonnement : Les parts de la voiture par secteur (iris.voiture.min, iris.voiture.max, carte par IRIS) décrivent les pratiques des actifs qui y habitent, quelle que soit leur
- Narbonne (11262), corrigé : raisonnement : L'article a pour titre « moins prendre la voiture ». Dans ce cadre, cette phrase fait des pratiques des actifs qui habitent chaque secteur (section 3, iris.voit

Corrections déclenchées seulement par un faux positif du contrôle (corrigé depuis ; l'appel a bien eu lieu et est compté) :
- Montpellier (34172) : « SP95-E10 » ne correspond à aucune valeur du dossier pour carburant.e10.ecart (0.51)
- Boulogne-Billancourt (92012) : « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.voiture.min (17.0) ; « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.voiture.ma ; « « 1 » dans Trapèze 1 » ne correspond à aucune valeur du dossier pour iris.920120506.panier_500m (1 ; « « 2 » dans Les Princes Marmottan 2 » ne correspond à aucune valeur du dossier pour iris.920120703.
- Lille (59350) : « « 400 Maisons-Cimetière du Sud » » ne correspond à aucune valeur du dossier pour iris.593500707.vo ; « « 400 Maisons-Cimetière du Sud » » ne correspond à aucune valeur du dossier pour iris.593500707.pa
- Saint-Denis (93066) : « 06 » ne correspond à aucune valeur du dossier pour iris.voiture.min (11.0) ; « 05 » ne correspond à aucune valeur du dossier pour iris.voiture.max (35.0)
- Montreuil (93048) : « 2 dans « Bas Montreuil Ouest 2 » » ne correspond à aucune valeur du dossier pour iris.voiture.min  ; « 5 dans « Montreau Ruffins Clos Arachis 5 » » ne correspond à aucune valeur du dossier pour iris.vo
- Aulnay-sous-Bois (93005) : « Paris 8e Arrondissement » ne correspond à aucune valeur du dossier pour destination.75108.voiture 
- Saint-Maur-des-Fossés (94068) : « Paris 8e Arrondissement » ne correspond à aucune valeur du dossier pour destination.75108.voiture 

Niveau 2 (noté, sans nouvelle génération) : 101 remarque(s), détail dans `relecture.anomalies.json` de chaque commune.

## Jetons par outil et par étape

Compteurs tels que chaque outil les rapporte, sans double compte : chez Codex, l'entrée inclut le cache et la sortie inclut le raisonnement ; chez Claude Code, l'entrée totale est la somme des entrées non mises en cache, écrites en cache et lues en cache, et la sortie inclut la réflexion. **Ces jetons ne mesurent pas la consommation du quota des abonnements**, que ni Codex ni Claude Code n'exposent.

| Outil | Étape | Appels | Échecs ou refus | Entrée totale | dont cache lu | dont cache écrit | Sortie totale | dont raisonnement | Durée cumulée | Non mesurés |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-code | collecte (par réseau) | 24 | 1 | 1 134 914 | 239 849 | 83 551 | 166 758 | 2 811 | 13 min 41 s |  |
| claude-code | relecture | 82 | 2 | 3 372 888 | 267 540 | 3 105 188 | 249 458 | 210 262 | 41 min 15 s |  |
| codex | correction | 48 | 0 | 1 675 056 | 92 160 | sans objet | 148 617 | 13 833 | 39 min 38 s |  |
| codex | redaction | 80 | 0 | 2 718 864 | 332 416 | sans objet | 418 715 | 205 800 | 2 h 44 min |  |

Collecte : entrée et sortie comprennent les lectures de pages que Claude Code confie à Haiku (modèle confirmé dans le CSV) ; le raisonnement compté est celui de Sonnet seul, **celui de Haiku n'est pas rapporté : non mesuré**.

Codex, par commune (entrée + sortie, hors collecte) : total 4 961 252, médiane 73 853, maximum 89 992 (Nice).

Claude, par commune (entrée + sortie, hors collecte) : total 3 622 346, médiane 44 602, maximum 54 223 (Strasbourg).

## Durées

- Temps cumulé des traitements (préparation, collecte, rédaction, relecture, correction, visuels) : 5 h 48 min.
- Par commune (hors collecte) : médiane 4 min 04 s, les trois plus longues : Nice 9 min 20 s, Avignon 8 min 55 s, Montpellier 6 min 35 s.
- Durée réelle de la campagne : 8 h 03 min (du premier lancement à la dernière étape enregistrée), dont pauses de quota : 2 h 40 min (de la suspension à la reprise ; la limite se levait à l'heure annoncée par le message, la reprise dépend du pilote).
- Interventions du terminal pilote : 85 min (0 mesurées, 85 estimées).
  - 2026-10-15 15:56 UTC, 22 min (estimée) : Mise en place : phrase remplacée dans les huit articles, instrumentation de la chaîne pour la mesure, sélection, compteur /dev/lot, essais à blanc
  - 2026-10-15 16:39 UTC, 12 min (estimée) : Lot 1 : Lille (défaut NaN du dossier corrigé, reprise au lot 2) ; faux positif du contrôle sur les hypothèses du scénario carburant corrigé ; arrêt du lot pendant un rendu de visuels (aucun appel en cours) et relance
  - 2026-10-15 16:50 UTC, 8 min (estimée) : Lot 1 : deux autres faux positifs du contrôle (SP95-E10, base 100 km) corrigés, essais de non-régression, second arrêt-relance pendant des visuels
  - 2026-10-15 18:00 UTC, 5 min (estimée) : Erreur du pilote : lot 2 lancé à 17:28 UTC alors que le lot 1 venait d'être suspendu par la limite de session Claude (fin prise pour une réussite) ; un appel de collecte refusé en 3 s, sans jeton consommé. Constat, commit et poussée de l'état suspendu
  - 2026-10-15 18:24 UTC, 7 min (estimée) : Fin du lot 1 : motifs recalculés, faux positif « « 1 » dans Trapèze 1 » corrigé, arrêt-relance du lot 2 pendant des visuels
  - 2026-10-15 19:38 UTC, 10 min (estimée) : Fin du lot 2 : six faux positifs de libellés remplacés par une règle générale du contrôle (ligne qui justifie un libellé), vérification sur 58 articles et par falsification, motifs des lots 1 et 2 recalculés, arrêt-relance du lot 3 pendant des visuels
  - 2026-10-15 20:44 UTC, 6 min (estimée) : Fin du lot 3 : faux positif « Paris 8e Arrondissement » (Saint-Maur-des-Fossés) ; noms des communes de travail traités comme les noms de secteurs ; vérification sur 78 articles et par falsification ; lot 4 non redémarré (cas rare)
  - 2026-10-15 23:58 UTC, 15 min (estimée) : Fin de campagne : reprise du lot 4 après la limite (23:01 UTC), motifs recalculés, classement carburant d'Ajaccio corrigé dans le bilan (ordre de grandeur, pas exception), vérification des compteurs de collecte, bilan final, FUT-100

## Suspensions

- 2026-10-15T17:28:09Z (lot 1, rediger) : suspendu par quota · « relecture » : You've hit your session limit · resets 7:30pm (Europe/Paris)
- 2026-10-15T17:28:20Z (lot 2, collecter) : suspendu par quota · « collecte » : You've hit your session limit · resets 7:30pm (Europe/Paris)
- 2026-10-15T20:53:51Z (lot 4, rediger) : suspendu par quota · « relecture » : You've hit your session limit · resets 1am (Europe/Paris)

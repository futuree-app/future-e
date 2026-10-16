# Fiche mobilité · Nîmes (30189)

Générée le 2026-10-14T23:56:04Z · jour de référence 2026-10-13 · voisines : Marguerittes, Milhaud, Uchaud, Caveirac, Caissargues, Bernis

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.049, "bas": 0.045, "haut": 0.054, "lignes": 15761, "n_eff": 8900}, "marche": {"p": 0.113, "bas": 0.107, "haut": 0.12, "lignes": 15761, "n_eff": 8900}, "velo": {"p": 0.062, "bas": 0.057, "haut": 0.067, "lignes": 15761, "n_eff": 8900}, "deux_roues_mot": {"p": 0.022, "bas": 0.019, "haut": 0.025, "lignes": 15761, "n_eff": 8900}, "voiture": {"p": 0.659, "bas": 0.649, "haut": 0.668, "lignes": 15761, "n_eff": 8900}, "tc": {"p": 0.096, "bas": 0.09, "haut": 0.102, "lignes": 15761, "n_eff": 8900}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.6586) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.77, "bas": 0.761, "haut": 0.779, "lignes": 15761, "n_eff": 8900}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.604, "bas": 0.592, "haut": 0.615, "lignes": 12108, "n_eff": 6839}, "communes_voisines": {"p": 0.894, "bas": 0.847, "haut": 0.928, "lignes": 413, "n_eff": 228}, "ailleurs": {"p": 0.842, "bas": 0.826, "haut": 0.857, "lignes": 3653, "n_eff": 2061}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Marguerittes, Milhaud, Uchaud, Caveirac, Caissargues, Bernis

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.096, "bas": 0.09, "haut": 0.102, "lignes": 15761, "n_eff": 8900}, "actifs_menage_2_voitures_plus": {"p": 0.405, "bas": 0.395, "haut": 0.415, "lignes": 15761, "n_eff": 8900}, "menage_motorise_mais_pas_en_voiture": {"p": 0.276, "bas": 0.266, "haut": 0.286, "lignes": 13626, "n_eff": 7685}}`

Définition : VOIT = voitures du ménage de l'actif. Parts d'ACTIFS, pas de ménages

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Ne pas lire « ménages sans voiture » : voir la base IRIS Logement pour les ménages.

## Selon le statut d'occupation du logement
`mobpro.statut_occupation` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.727, "bas": 0.713, "haut": 0.741, "lignes": 6739, "n_eff": 3903}, "velo": {"p": 0.069, "bas": 0.062, "haut": 0.078, "lignes": 6739, "n_eff": 3903}, "menage_sans_voiture": {"p": 0.029, "bas": 0.024, "haut": 0.034, "lignes": 6739, "n_eff": 3903}, "menage_2_voitures_plus": {"p": 0.578, "bas": 0.562, "haut": 0.593, "lignes": 6739, "n_eff": 3903}}, "locataires_prive": {"voiture": {"p": 0.617, "bas": 0.6, "haut": 0.634, "lignes": 6007, "n_eff": 3239}, "velo": {"p": 0.07, "bas": 0.062, "haut": 0.08, "lignes": 6007, "n_eff": 3239}, "menage_sans_voiture": {"p": 0.177, "bas": 0.164, "haut": 0.19, "lignes": 6007, "n_eff": 3239}, "menage_2_voitures_plus": {"p": 0.265, "bas": 0.25, "haut": 0.281, "lignes": 6007, "n_eff": 3239}}, "locataires_hlm": {"voiture": {"p": 0.685, "bas": 0.658, "haut": 0.711, "lignes": 2060, "n_eff": 1200}, "velo": {"p": 0.029, "bas": 0.021, "haut": 0.04, "lignes": 2060, "n_eff": 1200}, "menage_sans_voiture": {"p": 0.139, "bas": 0.12, "haut": 0.159, "lignes": 2060, "n_eff": 1200}, "menage_2_voitures_plus": {"p": 0.339, "bas": 0.313, "haut": 0.366, "lignes": 2060, "n_eff": 1200}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 82803, "habitent_la_commune": {"part_des_emplois": 0.49, "voiture": {"p": 0.604, "bas": 0.592, "haut": 0.615, "lignes": 12108, "n_eff": 6839}, "tc": {"p": 0.091, "bas": 0.084, "haut": 0.098, "lignes": 12108, "n_eff": 6839}}, "reste_unite_urbaine": {"part_des_emplois": 0.078, "voiture": {"p": 0.901, "bas": 0.879, "haut": 0.919, "lignes": 1313, "n_eff": 874}, "tc": {"p": 0.049, "bas": 0.037, "haut": 0.066, "lignes": 1313, "n_eff": 874}}, "hors_unite_urbaine": {"part_des_emplois": 0.431, "voiture": {"p": 0.917, "bas": 0.909, "haut": 0.924, "lignes": 7943, "n_eff": 4985}, "tc": {"p": 0.059, "bas": 0.053, "haut": 0.066, "lignes": 7943, "n_eff": 4985}}}`

Définition : Actifs occupés dont la commune de travail est la commune étudiée

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- « Unité urbaine » = INSEE 2020, via l'index.

## Part de la voiture pour aller travailler, du quartier le moins au plus motorisé
`iris.ecart_voiture` · statut : calculé · maille : IRIS · millésime : 2022

**Valeur** : `{"min": 0.316, "iris_min": "Arènes", "max": 0.951, "iris_max": "Super Nîmes", "iris_habitat": 56}`

Définition : C22_ACTOCC15P_VOIT / C22_ACTOCC15P, IRIS d'habitat (TYP_IRIS = H)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- IRIS de moins de 300 actifs : 3

Limites :
- Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.
- Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.

**À vérifier par un humain** : Relire les libellés d'IRIS avant de les citer comme noms de quartiers.

## Contrôle : IRIS agrégés = fichier détail
`iris.coherence_mobpro` · statut : contrôle · maille : commune · millésime : 2022

**Valeur** : `{"iris": 0.659, "mobpro": 0.659}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.254, "menages_2_voitures_plus": 0.225, "menages_stationnement_reserve": 0.577}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.855, "grande_surface_500m": 0.57, "pharmacie_500m": 0.78, "medecin_generaliste_500m": 0.797, "ecole_elementaire_500m": 0.801, "college_1km": 0.858, "gare_2km": 0.713, "panier_quotidien_500m": 0.709, "bus_8h_7_9h": 0.849, "aucun_bus_7_9h": 0.026, "bus_4h_20_22h": 0.636}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260901', '20261231']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.329, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.569, "ecart": 0.76, "stations": 29}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.169, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.629, "ecart": 0.54, "stations": 26}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 34 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Nîmes | 77 % | 60 % | 8 % | 9 % | 14 % | 12108 (ok) |
| Montpellier | 2 % | 68 % | 1 % | 29 % | 0 % | 357 (ok) |
| Garons | 1 % | 92 % | 1 % | 3 % | 0 % | 152 (ok) |
| Alès | 1 % | 91 % | 0 % | 6 % | 1 % | 139 (fragile) |
| Arles | 1 % | 96 % | 0 % | 2 % | 0 % | 131 (fragile) |
| Caissargues | 1 % | 94 % | 2 % | 4 % | 0 % | 123 (fragile) |
| Marguerittes | 1 % | 88 % | 1 % | 5 % | 0 % | 136 (fragile) |
| Saint-Gilles | 1 % | 91 % | 1 % | 4 % | 0 % | 132 (fragile) |
| Bouillargues | 1 % | 85 % | 6 % | 4 % | 3 % | 90 (fragile) |
| Uzès | 1 % | 93 % | 0 % | 5 % | 0 % | 103 (fragile) |
| Beaucaire | 0 % | 83 % | 4 % | 10 % | 1 % | 77 (fragile) |
| Vauvert | 0 % | 96 % | 0 % | 4 % | 0 % | 80 (fragile) |
| Avignon | 0 % | 80 % | 0 % | 19 % | 1 % | 87 (fragile) |
| Vergèze | 0 % | 99 % | 0 % | 1 % | 0 % | 62 (fragile) |
| Lunel | 0 % | 89 % | 0 % | 11 % | 0 % | 68 (fragile) |
| Caveirac | 0 % | 92 % | 3 % | 2 % | 0 % | 59 (fragile) |
| Milhaud | 0 % | 77 % | 0 % | 17 % | 4 % | 56 (fragile) |
| Mauguio | 0 % | 86 % | 0 % | 7 % | 0 % | 40 (fragile) |
| Gallargues-le-Montueux | 0 % | 100 % | 0 % | 0 % | 0 % | 40 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Maréchal Juin | A | 26 | 24 % | 13 % | 51 % | 68 % | 28 % |
| Arènes | H | 859 | 32 % | 8 % | 18 % | 58 % | 10 % |
| Gambetta | H | 1010 | 32 % | 21 % | 16 % | 58 % | 21 % |
| Casernes | H | 1486 | 33 % | 5 % | 6 % | 38 % | 57 % |
| Général Perrier | H | 1048 | 33 % | 10 % | 15 % | 57 % | 9 % |
| Placette | H | 855 | 44 % | 10 % | 11 % | 49 % | 29 % |
| Esplanade | H | 539 | 47 % | 8 % | 13 % | 31 % | 38 % |
| Jean Jaurès Nord | H | 1099 | 47 % | 9 % | 12 % | 34 % | 43 % |
| Gamel | H | 779 | 48 % | 2 % | 14 % | 32 % | 56 % |
| Séguier | H | 1352 | 49 % | 9 % | 9 % | 35 % | 47 % |
| Gare | A | 217 | 49 % | 7 % | 12 % | 37 % | 36 % |
| Montcalm-République | H | 1328 | 50 % | 8 % | 13 % | 29 % | 50 % |
| Carré d'Art | H | 622 | 50 % | 10 % | 11 % | 37 % | 43 % |
| Jean Jaurès Sud | H | 1214 | 50 % | 12 % | 14 % | 26 % | 68 % |
| Richelieu | H | 1360 | 52 % | 14 % | 12 % | 52 % | 22 % |
| Tour Magne | H | 744 | 55 % | 13 % | 6 % | 22 % | 62 % |
| Jean Perrin | H | 124 | 59 % | 0 % | 30 % | 37 % | 21 % |
| Beausoleil | H | 1300 | 59 % | 10 % | 8 % | 27 % | 62 % |
| Aérodrome | H | 2113 | 61 % | 3 % | 10 % | 7 % | 89 % |
| Galilée | H | 177 | 62 % | 5 % | 21 % | 37 % | 27 % |
| Croix de Fer | H | 983 | 62 % | 10 % | 6 % | 23 % | 52 % |
| Saint-Baudile | H | 849 | 62 % | 12 % | 12 % | 22 % | 46 % |
| Zone Industrielle | A | 49 | 63 % | 0 % | 0 % | 30 % | 90 % |
| Creux des Canards | H | 833 | 63 % | 12 % | 7 % | 17 % | 84 % |
| André Malraux | H | 326 | 64 % | 0 % | 19 % | 38 % | 6 % |
| La Gazelle | H | 1396 | 64 % | 3 % | 19 % | 14 % | 79 % |
| Puech du Teil | H | 834 | 65 % | 7 % | 9 % | 16 % | 82 % |
| Beaucaire | H | 689 | 66 % | 8 % | 9 % | 33 % | 51 % |
| Les Amoureux | H | 923 | 67 % | 8 % | 10 % | 21 % | 58 % |
| Montaury | H | 899 | 67 % | 6 % | 8 % | 22 % | 72 % |
| Jardins de la Fontaine | H | 370 | 68 % | 6 % | 5 % | 19 % | 72 % |
| Romain Rolland | H | 357 | 68 % | 0 % | 16 % | 36 % | 20 % |
| Corot | H | 284 | 68 % | 0 % | 21 % | 33 % | 49 % |
| Pasteur | H | 1193 | 68 % | 6 % | 11 % | 23 % | 60 % |
| Marronniers | H | 1188 | 69 % | 6 % | 10 % | 22 % | 65 % |
| Marcel Rouvière | H | 780 | 70 % | 7 % | 12 % | 12 % | 83 % |
| André Marquès | H | 490 | 70 % | 4 % | 20 % | 27 % | 47 % |
| Km Delta | A | 15 | 72 % | 0 % | 28 % | 0 % | 86 % |
| Ville Active | A | 872 | 72 % | 5 % | 10 % | 25 % | 62 % |
| Soleil Levant | H | 589 | 73 % | 1 % | 19 % | 25 % | 44 % |
| Hôpital | A | 285 | 73 % | 4 % | 11 % | 40 % | 54 % |
| La Plaine | H | 678 | 73 % | 2 % | 14 % | 9 % | 86 % |
| La Cigale | H | 768 | 73 % | 8 % | 5 % | 4 % | 82 % |
| Galerie Wagner | H | 445 | 75 % | 1 % | 14 % | 32 % | 45 % |
| Capouchiné | H | 843 | 75 % | 5 % | 4 % | 14 % | 73 % |
| Alouette | H | 851 | 76 % | 5 % | 9 % | 11 % | 86 % |
| Diderot | H | 371 | 77 % | 5 % | 7 % | 11 % | 54 % |
| Saint-Césaire | H | 1165 | 77 % | 3 % | 9 % | 17 % | 74 % |
| Plan de Perbos | A | 40 | 77 % | 0 % | 13 % | 12 % | 67 % |
| Camplanier | H | 1389 | 77 % | 7 % | 4 % | 2 % | 85 % |
| Mas de Mingue | H | 658 | 78 % | 4 % | 10 % | 26 % | 53 % |
| L'Eau Boullie | H | 1283 | 78 % | 7 % | 5 % | 5 % | 86 % |
| Haute Magaille | H | 1247 | 80 % | 4 % | 8 % | 13 % | 64 % |
| Mas de Possac | H | 576 | 80 % | 6 % | 5 % | 12 % | 80 % |
| SNCF | H | 647 | 83 % | 1 % | 11 % | 23 % | 53 % |
| Serre-Paradis | H | 959 | 83 % | 5 % | 4 % | 18 % | 78 % |
| Castanet | H | 628 | 83 % | 2 % | 9 % | 8 % | 82 % |
| Ventabren | H | 1244 | 85 % | 4 % | 6 % | 5 % | 88 % |
| Vacquerolles | H | 1173 | 87 % | 1 % | 4 % | 3 % | 90 % |
| Garrigues | H | 1287 | 87 % | 3 % | 4 % | 3 % | 88 % |
| Courbessac | H | 804 | 87 % | 2 % | 4 % | 12 % | 75 % |
| Mas de Lauze | H | 2553 | 88 % | 2 % | 3 % | 3 % | 91 % |
| Super Nîmes | H | 667 | 95 % | 1 % | 4 % | 20 % | 40 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Nîmes | 86 % | 57 % | 78 % | 80 % | 80 % | 86 % | 71 % | 71 % | 85 % | 3 % | 64 % |
| Marguerittes | 60 % | 19 % | 44 % | 59 % | 34 % | 63 % | 0 % | 25 % | 9 % | 6 % | 0 % |
| Milhaud | 93 % | 6 % | 59 % | 61 % | 56 % | 0 % | 98 % | 52 % | 0 % | 14 % | 0 % |
| Uchaud | 82 % | 0 % | 69 % | 67 % | 39 % | 0 % | 100 % | 38 % | 0 % | 100 % | 0 % |
| Caveirac | 58 % | 35 % | 33 % | 26 % | 39 % | 0 % | 0 % | 27 % | 33 % | 27 % | 0 % |
| Caissargues | 94 % | 33 % | 68 % | 94 % | 76 % | 0 % | 0 % | 57 % | 32 % | 24 % | 0 % |
| Bernis | 75 % | 33 % | 48 % | 45 % | 55 % | 0 % | 68 % | 22 % | 0 % | 22 % | 0 % |

## Sources récupérées

- `iris_activite_2022.zip` : https://www.insee.fr/fr/statistiques/fichier/8647006/base-ic-activite-residents-2022_csv.zip · 2026-10-13T10:37:55Z · sha256 f4aefb7fab425b9f
- `iris_logement_2022.zip` : https://www.insee.fr/fr/statistiques/fichier/8647012/base-ic-logement-2022_csv.zip · 2026-10-13T10:37:55Z · sha256 d8cf20698fed027e
- `ban_17.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-17.csv.gz · 2026-10-13T10:37:55Z · sha256 f711a08c34a0a617
- `iris_ign_17300.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17300' · 2026-10-13T10:37:55Z · sha256 f96aac26a9f2c2cd
- `iris_ign_17200.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17200' · 2026-10-13T10:37:55Z · sha256 a20c17b9e5012385
- `iris_ign_17291.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17291' · 2026-10-13T10:37:55Z · sha256 225e12323304e73e
- `iris_ign_17028.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17028' · 2026-10-13T10:37:55Z · sha256 857fd53111036338
- `iris_ign_17274.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17274' · 2026-10-13T10:37:55Z · sha256 85b838f5acf42508
- `iris_ign_17094.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='17094' · 2026-10-13T10:37:55Z · sha256 e445b030bb385c06
- `tdg_gtfs.json` : https://transport.data.gouv.fr/api/datasets?format=GTFS · 2026-10-14T14:12:25Z · sha256 01d8125f7cb6254c
- `gtfs_241700434.zip` : https://www.data.gouv.fr/api/1/datasets/r/030b9c31-4237-4355-a4d5-842861d225be · 2026-10-13T10:37:55Z · sha256 c41f147daf055a7c
- `carbu_2025.zip` : https://donnees.roulez-eco.fr/opendata/annee/2025 · 2026-10-13T10:37:55Z · sha256 383379223bd43f9d
- `carbu_2026.zip` : https://donnees.roulez-eco.fr/opendata/annee/2026 · 2026-10-13T10:37:55Z · sha256 cd999b23896161f8
- `ban_79.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-79.csv.gz · 2026-10-13T10:41:34Z · sha256 ff6ecc121929977a
- `iris_ign_79191.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79191' · 2026-10-13T10:41:34Z · sha256 55b859fc4e546a85
- `iris_ign_79081.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79081' · 2026-10-13T10:41:34Z · sha256 a52920954275acd4
- `iris_ign_79003.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79003' · 2026-10-13T10:41:34Z · sha256 bb700dceb0a69ec9
- `iris_ign_79034.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79034' · 2026-10-13T10:41:34Z · sha256 f184de5fef490730
- `gtfs_200041317.zip` : https://www.data.gouv.fr/api/1/datasets/r/d724a6df-7dc4-4b2d-be15-fc8b1d52c8ea · 2026-10-13T10:41:34Z · sha256 013b37f32e814db0
- `geo_17300.json` : https://geo.api.gouv.fr/communes/17300?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-13T11:10:06Z · sha256 68bcaec69ed13c6e
- `geo_79191.json` : https://geo.api.gouv.fr/communes/79191?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-13T11:10:06Z · sha256 3f744aebc09475c5
- `geo_86194.json` : https://geo.api.gouv.fr/communes/86194?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:12:04Z · sha256 a4654599e95f6c41
- `ban_86.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-86.csv.gz · 2026-10-14T14:12:16Z · sha256 c98d04ed260c6ded
- `iris_ign_86194.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86194' · 2026-10-14T14:12:19Z · sha256 0679fabb2240c911
- `iris_ign_86041.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86041' · 2026-10-14T14:12:20Z · sha256 8ac8b01e4166b2d6
- `iris_ign_86115.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86115' · 2026-10-14T14:12:20Z · sha256 95f39436347ca390
- `iris_ign_86214.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86214' · 2026-10-14T14:12:21Z · sha256 4af7d3bf042f1d06
- `iris_ign_86297.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86297' · 2026-10-14T14:12:21Z · sha256 cb8287f7a78f950d
- `iris_ign_86158.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86158' · 2026-10-14T14:12:22Z · sha256 ff60c889b232e1cd
- `iris_ign_86062.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='86062' · 2026-10-14T14:12:22Z · sha256 06258e69022c443c
- `gtfs_200069854.zip` : https://www.data.gouv.fr/api/1/datasets/r/82146378-f019-4048-aa16-7328081b0369 · 2026-10-14T14:12:26Z · sha256 58c85e2fe68a2df6
- `geo_49007.json` : https://geo.api.gouv.fr/communes/49007?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:24:23Z · sha256 b8fce8cb6770df3a
- `ban_49.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-49.csv.gz · 2026-10-14T14:24:36Z · sha256 0c23bb3d9d7632ea
- `iris_ign_49007.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49007' · 2026-10-14T14:24:39Z · sha256 16baa5122154bcc4
- `iris_ign_49353.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49353' · 2026-10-14T14:24:40Z · sha256 aa01737b1412aedb
- `iris_ign_49015.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49015' · 2026-10-14T14:24:43Z · sha256 df53a513dbe8ef1e
- `iris_ign_49246.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49246' · 2026-10-14T14:24:43Z · sha256 a1c5018031976749
- `iris_ign_49267.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49267' · 2026-10-14T14:24:43Z · sha256 b98bdf085bcaec30
- `iris_ign_49323.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49323' · 2026-10-14T14:24:43Z · sha256 41734697a310514f
- `iris_ign_49035.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49035' · 2026-10-14T14:24:44Z · sha256 64b1ced94ccfa437
- `gtfs_244900015.zip` : https://www.data.gouv.fr/api/1/datasets/r/32f30b64-33f7-43bb-9b6f-34c21c2f83a3 · 2026-10-14T14:24:49Z · sha256 d3a71bd0e0f08845
- `geo_56121.json` : https://geo.api.gouv.fr/communes/56121?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:25:07Z · sha256 19285ab548684e0a
- `ban_56.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-56.csv.gz · 2026-10-14T14:25:19Z · sha256 e6c2f94265b357dd
- `iris_ign_56121.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56121' · 2026-10-14T14:25:24Z · sha256 315aa561df8c40de
- `iris_ign_56098.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56098' · 2026-10-14T14:25:25Z · sha256 91ee729655c042b1
- `iris_ign_56162.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56162' · 2026-10-14T14:25:25Z · sha256 f331b46697a4d584
- `iris_ign_56185.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56185' · 2026-10-14T14:25:26Z · sha256 7fbd9cbae20a9f94
- `iris_ign_56107.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56107' · 2026-10-14T14:25:26Z · sha256 fa1ebd01ed196f4e
- `iris_ign_56036.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56036' · 2026-10-14T14:25:26Z · sha256 ea6e59f3d39b31d7
- `gtfs_200042174.zip` : https://www.data.gouv.fr/api/1/datasets/r/c32dc40b-3538-4796-a6c6-fd239d6c1364 · 2026-10-14T14:25:30Z · sha256 a9bfdbea2698cee2
- `geo_56260.json` : https://geo.api.gouv.fr/communes/56260?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:25:43Z · sha256 c7f8fb0c353e30c0
- `iris_ign_56260.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56260' · 2026-10-14T14:25:56Z · sha256 8aa13dd615666dbd
- `iris_ign_56206.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56206' · 2026-10-14T14:25:56Z · sha256 106d5e944489b47c
- `iris_ign_56243.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56243' · 2026-10-14T14:25:56Z · sha256 1fdc19c19af14774
- `iris_ign_56158.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='56158' · 2026-10-14T14:25:57Z · sha256 8d2f71d0a08509f9
- `gtfs_200067932.zip` : https://www.data.gouv.fr/api/1/datasets/r/565533c0-64ae-44d6-9dfa-169be5b805c6 · 2026-10-14T14:26:00Z · sha256 e14be94c33642949
- `geo_44184.json` : https://geo.api.gouv.fr/communes/44184?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:26:12Z · sha256 ebb0536ca3e77ce8
- `ban_44.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-44.csv.gz · 2026-10-14T14:26:25Z · sha256 4b303a8eb4532a8c
- `iris_ign_44184.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44184' · 2026-10-14T14:26:28Z · sha256 6e43bf8d7067b33f
- `iris_ign_44055.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44055' · 2026-10-14T14:26:29Z · sha256 cf4453d95699868b
- `iris_ign_44069.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44069' · 2026-10-14T14:26:29Z · sha256 1d39285a012c6cfc
- `iris_ign_44154.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44154' · 2026-10-14T14:26:30Z · sha256 5bfd9ed511d93563
- `iris_ign_44132.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44132' · 2026-10-14T14:26:30Z · sha256 6daa97f6b058d9fd
- `iris_ign_44052.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44052' · 2026-10-14T14:26:31Z · sha256 cb24690935de17e2
- `iris_ign_44210.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44210' · 2026-10-14T14:26:32Z · sha256 75bfad25e6baef80
- `gtfs_244400644.zip` : https://www.data.gouv.fr/api/1/datasets/r/a1867718-7921-42a6-b672-c53b8c583aa3 · 2026-10-14T14:26:38Z · sha256 93ee9ac1e19149b0
- `geo_49099.json` : https://geo.api.gouv.fr/communes/49099?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:26:55Z · sha256 ea6be6e9d2509614
- `iris_ign_49099.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='49099' · 2026-10-14T14:27:09Z · sha256 ab6e019f31ae98f7
- `gtfs_200071678.zip` : https://www.data.gouv.fr/api/1/datasets/r/71e8ee8e-0b55-40a1-a297-21ef89aba4dc · 2026-10-14T14:27:12Z · sha256 afce37d1b316ed6e
- `geo_85191.json` : https://geo.api.gouv.fr/communes/85191?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:27:26Z · sha256 d3b9130212b28673
- `ban_85.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-85.csv.gz · 2026-10-14T14:27:38Z · sha256 6591ef3ca7ade1e3
- `iris_ign_85191.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='85191' · 2026-10-14T14:27:41Z · sha256 0a524b2b952f616d
- `gtfs_248500589.zip` : https://www.data.gouv.fr/api/1/datasets/r/735f1b54-94ee-4a21-b378-05c2b44ad70f · 2026-10-14T14:27:42Z · sha256 27899fb350be7637
- `geo_22278.json` : https://geo.api.gouv.fr/communes/22278?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:27:56Z · sha256 20f53d62db3536e5
- `ban_22.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-22.csv.gz · 2026-10-14T14:28:09Z · sha256 61e530699e7000cb
- `iris_ign_22278.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22278' · 2026-10-14T14:28:11Z · sha256 a7516dff97225c7d
- `iris_ign_22187.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22187' · 2026-10-14T14:28:12Z · sha256 12f92ebe4a434e9a
- `iris_ign_22215.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22215' · 2026-10-14T14:28:13Z · sha256 789db25595f3960e
- `iris_ign_22360.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22360' · 2026-10-14T14:28:13Z · sha256 94b7c6783200f180
- `iris_ign_22106.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22106' · 2026-10-14T14:28:13Z · sha256 59f1fc35fc7156c4
- `iris_ign_22389.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22389' · 2026-10-14T14:28:13Z · sha256 02a3e0a7acc5687e
- `iris_ign_22372.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='22372' · 2026-10-14T14:28:14Z · sha256 0f556437b64f6e63
- `gtfs_200069409.zip` : https://www.data.gouv.fr/api/1/datasets/r/9bccfc79-5d35-4fc3-8296-526b791fc950 · 2026-10-14T14:28:16Z · sha256 56c18bb7bec3e715
- `geo_37261.json` : https://geo.api.gouv.fr/communes/37261?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:28:29Z · sha256 fd1c1dec74be8e94
- `ban_37.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-37.csv.gz · 2026-10-14T14:28:41Z · sha256 a8b9396b16e4ad38
- `iris_ign_37261.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37261' · 2026-10-14T14:28:43Z · sha256 c22d7a9828828c2d
- `iris_ign_37122.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37122' · 2026-10-14T14:28:43Z · sha256 8ce66af3fbd4ac13
- `iris_ign_37214.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37214' · 2026-10-14T14:28:43Z · sha256 fbb82762e3c55225
- `iris_ign_37233.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37233' · 2026-10-14T14:28:44Z · sha256 dc5476348b5bd822
- `iris_ign_37208.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37208' · 2026-10-14T14:28:44Z · sha256 f84a11b0d4ee06f6
- `iris_ign_37003.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37003' · 2026-10-14T14:28:44Z · sha256 5b5f41cc0edef6c2
- `iris_ign_37050.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='37050' · 2026-10-14T14:28:44Z · sha256 a557161039d055d2
- `gtfs_243700754.zip` : https://www.data.gouv.fr/api/1/datasets/r/198b7602-5e74-4d88-b6bc-483af85a2430 · 2026-10-14T14:28:50Z · sha256 12327dd86372f2c8
- `geo_72181.json` : https://geo.api.gouv.fr/communes/72181?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T14:29:16Z · sha256 85c1a7d5b6b31535
- `ban_72.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-72.csv.gz · 2026-10-14T14:29:27Z · sha256 9ed8b92da3ebeb3a
- `iris_ign_72181.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72181' · 2026-10-14T14:29:29Z · sha256 7c381bb81ff61a9f
- `iris_ign_72003.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72003' · 2026-10-14T14:29:29Z · sha256 721f742c1c889b2c
- `iris_ign_72095.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72095' · 2026-10-14T14:29:29Z · sha256 c3b15916e4232e04
- `iris_ign_72058.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72058' · 2026-10-14T14:29:30Z · sha256 b779230717097c16
- `iris_ign_72008.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72008' · 2026-10-14T14:29:31Z · sha256 e3433f7481fbba3b
- `iris_ign_72386.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72386' · 2026-10-14T14:29:31Z · sha256 e5e0294f0c2a2d06
- `iris_ign_72329.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='72329' · 2026-10-14T14:29:32Z · sha256 e1e0cd219162697d
- `gtfs_247200132.zip` : https://www.data.gouv.fr/api/1/datasets/r/5339d96c-6d20-4a01-939a-40f7b56d6cc1 · 2026-10-14T14:29:36Z · sha256 0cb5b12d2975b9bd
- `geo_14118.json` : https://geo.api.gouv.fr/communes/14118?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T23:54:49Z · sha256 0bd2153096cfe274
- `ban_14.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-14.csv.gz · 2026-10-14T23:55:02Z · sha256 286ceffd81fc7363
- `iris_ign_14118.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14118' · 2026-10-14T23:55:05Z · sha256 55793cc9092283da
- `iris_ign_14327.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14327' · 2026-10-14T23:55:05Z · sha256 ac259fe7e2ee90f8
- `iris_ign_14341.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14341' · 2026-10-14T23:55:05Z · sha256 0e44b6c69a4d9d59
- `iris_ign_14437.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14437' · 2026-10-14T23:55:06Z · sha256 58429a83ee3e2515
- `iris_ign_14167.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14167' · 2026-10-14T23:55:06Z · sha256 2dd002d70be65415
- `iris_ign_14271.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14271' · 2026-10-14T23:55:06Z · sha256 e58cf4e9701af6c6
- `iris_ign_14181.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='14181' · 2026-10-14T23:55:07Z · sha256 4c3e13296cd2bcc3
- `geo_29019.json` : https://geo.api.gouv.fr/communes/29019?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T23:55:20Z · sha256 36486fa5041d505f
- `ban_29.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-29.csv.gz · 2026-10-14T23:55:34Z · sha256 d08c6fa569c313e0
- `iris_ign_29019.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29019' · 2026-10-14T23:55:37Z · sha256 11be2b278d2f91f4
- `iris_ign_29075.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29075' · 2026-10-14T23:55:37Z · sha256 9ccde5342da40ec7
- `iris_ign_29212.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29212' · 2026-10-14T23:55:38Z · sha256 1b4861fa674a3a6d
- `iris_ign_29189.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29189' · 2026-10-14T23:55:38Z · sha256 46860f7b90126ba6
- `iris_ign_29235.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29235' · 2026-10-14T23:55:38Z · sha256 8e0c1f84b2acd458
- `iris_ign_29061.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29061' · 2026-10-14T23:55:39Z · sha256 c66d503cae9d7b62
- `iris_ign_29011.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29011' · 2026-10-14T23:55:39Z · sha256 e6efa036253a5fa1
- `gtfs_242900314.zip` : https://www.data.gouv.fr/api/1/datasets/r/583d1419-058b-481b-b378-449cab744c82 · 2026-10-14T23:55:45Z · sha256 a4cfbbb6a5bd8969
- `geo_30189.json` : https://geo.api.gouv.fr/communes/30189?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-14T23:56:04Z · sha256 cd23f297818ce87e
- `ban_30.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-30.csv.gz · 2026-10-14T23:56:18Z · sha256 0474acfed8e33ae8
- `iris_ign_30189.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30189' · 2026-10-14T23:56:21Z · sha256 1d523f3bd19b2f65
- `iris_ign_30156.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30156' · 2026-10-14T23:56:22Z · sha256 422118b12a00ab59
- `iris_ign_30169.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30169' · 2026-10-14T23:56:22Z · sha256 f68421f508e537b8
- `iris_ign_30333.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30333' · 2026-10-14T23:56:22Z · sha256 3b213323c9bd32be
- `iris_ign_30075.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30075' · 2026-10-14T23:56:22Z · sha256 af766154e90e2147
- `iris_ign_30060.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30060' · 2026-10-14T23:56:23Z · sha256 9a080ccdbaa90c3e
- `iris_ign_30036.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='30036' · 2026-10-14T23:56:23Z · sha256 d3eec71e058d58b4
- `gtfs_243000643.zip` : https://www.data.gouv.fr/api/1/datasets/r/15aeb8a5-1cca-4bb9-ae5f-b6e67e4ff2ab · 2026-10-14T23:56:28Z · sha256 e1609e8935f83030

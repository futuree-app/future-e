# Fiche mobilité · Tours (37261)

Générée le 2026-10-14T14:28:29Z · jour de référence 2026-10-13 · voisines : Joué-lès-Tours, Saint-Cyr-sur-Loire, Saint-Pierre-des-Corps, Saint-Avertin, Amboise, Chambray-lès-Tours

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.035, "bas": 0.031, "haut": 0.039, "lignes": 17761, "n_eff": 9538}, "marche": {"p": 0.122, "bas": 0.116, "haut": 0.129, "lignes": 17761, "n_eff": 9538}, "velo": {"p": 0.097, "bas": 0.091, "haut": 0.103, "lignes": 17761, "n_eff": 9538}, "deux_roues_mot": {"p": 0.012, "bas": 0.01, "haut": 0.014, "lignes": 17761, "n_eff": 9538}, "voiture": {"p": 0.5, "bas": 0.49, "haut": 0.51, "lignes": 17761, "n_eff": 9538}, "tc": {"p": 0.235, "bas": 0.226, "haut": 0.243, "lignes": 17761, "n_eff": 9538}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.643, "bas": 0.633, "haut": 0.652, "lignes": 17761, "n_eff": 9538}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.401, "bas": 0.389, "haut": 0.413, "lignes": 11423, "n_eff": 6133}, "communes_voisines": {"p": 0.695, "bas": 0.67, "haut": 0.718, "lignes": 2607, "n_eff": 1386}, "ailleurs": {"p": 0.678, "bas": 0.663, "haut": 0.694, "lignes": 6338, "n_eff": 3405}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Joué-lès-Tours, Saint-Cyr-sur-Loire, Saint-Pierre-des-Corps, Saint-Avertin, Amboise, Chambray-lès-Tours

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.183, "bas": 0.175, "haut": 0.191, "lignes": 17761, "n_eff": 9538}, "actifs_menage_2_voitures_plus": {"p": 0.273, "bas": 0.264, "haut": 0.282, "lignes": 17761, "n_eff": 9538}, "menage_motorise_mais_pas_en_voiture": {"p": 0.417, "bas": 0.406, "haut": 0.428, "lignes": 14212, "n_eff": 7677}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.529, "bas": 0.511, "haut": 0.546, "lignes": 5210, "n_eff": 3050}, "velo": {"p": 0.132, "bas": 0.12, "haut": 0.144, "lignes": 5210, "n_eff": 3050}, "menage_sans_voiture": {"p": 0.06, "bas": 0.052, "haut": 0.069, "lignes": 5210, "n_eff": 3050}, "menage_2_voitures_plus": {"p": 0.415, "bas": 0.398, "haut": 0.433, "lignes": 5210, "n_eff": 3050}}, "locataires_prive": {"voiture": {"p": 0.479, "bas": 0.464, "haut": 0.495, "lignes": 7912, "n_eff": 4081}, "velo": {"p": 0.094, "bas": 0.085, "haut": 0.103, "lignes": 7912, "n_eff": 4081}, "menage_sans_voiture": {"p": 0.238, "bas": 0.225, "haut": 0.251, "lignes": 7912, "n_eff": 4081}, "menage_2_voitures_plus": {"p": 0.206, "bas": 0.194, "haut": 0.219, "lignes": 7912, "n_eff": 4081}}, "locataires_hlm": {"voiture": {"p": 0.509, "bas": 0.488, "haut": 0.53, "lignes": 4196, "n_eff": 2195}, "velo": {"p": 0.052, "bas": 0.043, "haut": 0.062, "lignes": 4196, "n_eff": 2195}, "menage_sans_voiture": {"p": 0.275, "bas": 0.257, "haut": 0.294, "lignes": 4196, "n_eff": 2195}, "menage_2_voitures_plus": {"p": 0.184, "bas": 0.169, "haut": 0.201, "lignes": 4196, "n_eff": 2195}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 88180, "habitent_la_commune": {"part_des_emplois": 0.421, "voiture": {"p": 0.401, "bas": 0.389, "haut": 0.413, "lignes": 11423, "n_eff": 6133}, "tc": {"p": 0.231, "bas": 0.221, "haut": 0.242, "lignes": 11423, "n_eff": 6133}}, "reste_unite_urbaine": {"part_des_emplois": 0.318, "voiture": {"p": 0.763, "bas": 0.751, "haut": 0.775, "lignes": 7742, "n_eff": 4518}, "tc": {"p": 0.137, "bas": 0.127, "haut": 0.147, "lignes": 7742, "n_eff": 4518}}, "hors_unite_urbaine": {"part_des_emplois": 0.261, "voiture": {"p": 0.856, "bas": 0.843, "haut": 0.868, "lignes": 4835, "n_eff": 3129}, "tc": {"p": 0.116, "bas": 0.105, "haut": 0.128, "lignes": 4835, "n_eff": 3129}}}`

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

**Valeur** : `{"min": 0.262, "iris_min": "Centre 1", "max": 0.786, "iris_max": "Douets Milletière 1", "iris_habitat": 56}`

Définition : C22_ACTOCC15P_VOIT / C22_ACTOCC15P, IRIS d'habitat (TYP_IRIS = H)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- IRIS de moins de 300 actifs : 2

Limites :
- Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.
- Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.

**À vérifier par un humain** : Relire les libellés d'IRIS avant de les citer comme noms de quartiers.

## Contrôle : IRIS agrégés = fichier détail
`iris.coherence_mobpro` · statut : contrôle · maille : commune · millésime : 2022

**Valeur** : `{"iris": 0.5, "mobpro": 0.5}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.319, "menages_2_voitures_plus": 0.148, "menages_stationnement_reserve": 0.462}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.931, "grande_surface_500m": 0.675, "pharmacie_500m": 0.845, "medecin_generaliste_500m": 0.809, "ecole_elementaire_500m": 0.894, "college_1km": 0.922, "gare_2km": 0.622, "panier_quotidien_500m": 0.786, "bus_8h_7_9h": 0.938, "aucun_bus_7_9h": 0.019, "bus_4h_20_22h": 0.875}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain et périurbain Fil Bleu » (https://transport.data.gouv.fr/datasets/fil-bleu-syndicat-des-mobilites-gtfs-gtfs-rt), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20261012', '20270101']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.309, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.579, "ecart": 0.73, "stations": 40}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.109, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.669, "ecart": 0.44, "stations": 33}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 48 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Tours | 64 % | 40 % | 12 % | 23 % | 18 % | 11423 (ok) |
| Chambray-lès-Tours | 4 % | 76 % | 4 % | 19 % | 0 % | 625 (ok) |
| Joué-lès-Tours | 3 % | 64 % | 6 % | 28 % | 1 % | 560 (ok) |
| Saint-Pierre-des-Corps | 3 % | 60 % | 16 % | 20 % | 3 % | 540 (ok) |
| Saint-Cyr-sur-Loire | 2 % | 74 % | 8 % | 14 % | 2 % | 440 (ok) |
| Saint-Avertin | 2 % | 70 % | 8 % | 17 % | 3 % | 321 (ok) |
| Parçay-Meslay | 1 % | 88 % | 1 % | 8 % | 0 % | 208 (ok) |
| Fondettes | 1 % | 80 % | 2 % | 17 % | 0 % | 173 (ok) |
| La Riche | 1 % | 56 % | 13 % | 19 % | 10 % | 165 (ok) |
| Blois | 1 % | 48 % | 2 % | 49 % | 0 % | 156 (ok) |
| Amboise | 1 % | 84 % | 2 % | 12 % | 1 % | 121 (fragile) |
| Ballan-Miré | 0 % | 82 % | 4 % | 8 % | 2 % | 90 (fragile) |
| Notre-Dame-d'Oé | 0 % | 66 % | 5 % | 26 % | 1 % | 82 (fragile) |
| La Ville-aux-Dames | 0 % | 70 % | 11 % | 19 % | 0 % | 83 (fragile) |
| Vouvray | 0 % | 81 % | 0 % | 15 % | 1 % | 84 (fragile) |
| Orléans | 0 % | 46 % | 1 % | 52 % | 0 % | 85 (fragile) |
| Mettray | 0 % | 40 % | 5 % | 52 % | 0 % | 70 (fragile) |
| Montlouis-sur-Loire | 0 % | 79 % | 2 % | 14 % | 0 % | 80 (fragile) |
| Château-Renault | 0 % | 93 % | 0 % | 7 % | 0 % | 46 (fragile) |
| Chinon | 0 % | 82 % | 0 % | 15 % | 2 % | 57 (fragile) |
| La Membrolle-sur-Choisille | 0 % | 88 % | 2 % | 5 % | 0 % | 54 (fragile) |
| Monts | 0 % | 87 % | 0 % | 4 % | 2 % | 55 (fragile) |
| Nouzilly | 0 % | 80 % | 0 % | 20 % | 0 % | 57 (fragile) |
| Rochecorbon | 0 % | 82 % | 6 % | 10 % | 1 % | 55 (fragile) |
| Sorigny | 0 % | 95 % | 0 % | 4 % | 0 % | 48 (fragile) |
| Tauxigny-Saint-Bauld | 0 % | 91 % | 0 % | 9 % | 0 % | 47 (fragile) |
| Paris 15e Arrondissement | 0 % | 14 % | 3 % | 78 % | 5 % | 42 (fragile) |
| Chanceaux-sur-Choisille | 0 % | 80 % | 6 % | 12 % | 0 % | 43 (fragile) |
| Esvres | 0 % | 80 % | 6 % | 14 % | 0 % | 44 (fragile) |
| Langeais | 0 % | 88 % | 0 % | 12 % | 0 % | 40 (fragile) |
| Luynes | 0 % | 71 % | 3 % | 26 % | 0 % | 43 (fragile) |
| Montbazon | 0 % | 83 % | 0 % | 10 % | 4 % | 41 (fragile) |
| Veigné | 0 % | 83 % | 3 % | 10 % | 4 % | 41 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Centre 1 | H | 1540 | 26 % | 10 % | 24 % | 51 % | 22 % |
| Centre 3 | H | 828 | 27 % | 12 % | 30 % | 64 % | 13 % |
| Grammont 2 | H | 1366 | 27 % | 13 % | 29 % | 45 % | 40 % |
| Grammont 3 | H | 854 | 32 % | 15 % | 29 % | 36 % | 33 % |
| Centre 2 | H | 791 | 33 % | 10 % | 25 % | 45 % | 34 % |
| Centre 5 | H | 1096 | 33 % | 10 % | 23 % | 44 % | 32 % |
| Cathédrale | H | 1690 | 36 % | 18 % | 26 % | 34 % | 38 % |
| Sanitas-Rotonde 5 | H | 434 | 36 % | 12 % | 42 % | 50 % | 29 % |
| Sanitas-Rotonde 1 | H | 730 | 36 % | 7 % | 36 % | 56 % | 32 % |
| Sanitas-Rotonde 3 | H | 620 | 38 % | 9 % | 44 % | 50 % | 30 % |
| Lakanal-Strasbourg 1 | H | 1238 | 40 % | 18 % | 18 % | 27 % | 44 % |
| Febvotte-Marat 2 | H | 1363 | 40 % | 14 % | 24 % | 21 % | 44 % |
| Sanitas-Rotonde 4 | H | 326 | 41 % | 10 % | 38 % | 54 % | 5 % |
| Centre 4 | H | 758 | 41 % | 14 % | 16 % | 34 % | 54 % |
| La Fuye Velpeau 1 | H | 1202 | 41 % | 8 % | 30 % | 42 % | 51 % |
| Grammont 1 | H | 1430 | 41 % | 14 % | 18 % | 22 % | 50 % |
| Sanitas-Rotonde 2 | H | 292 | 42 % | 3 % | 47 % | 69 % | 4 % |
| La Fuye Velpeau 4 | H | 888 | 43 % | 17 % | 22 % | 30 % | 39 % |
| Rabelais-Tonnellé 1 | H | 1392 | 43 % | 13 % | 15 % | 29 % | 59 % |
| Rives du Cher 1 | H | 543 | 44 % | 13 % | 35 % | 28 % | 16 % |
| Rabelais-Tonnellé 2 | H | 1106 | 44 % | 19 % | 15 % | 35 % | 48 % |
| Grammont 4 | H | 1116 | 44 % | 14 % | 21 % | 34 % | 35 % |
| Febvotte-Marat 1 | H | 859 | 45 % | 18 % | 18 % | 26 % | 47 % |
| Saint-Symphorien 5 | H | 1075 | 45 % | 8 % | 36 % | 36 % | 57 % |
| Lamartine 2 | H | 1113 | 46 % | 15 % | 18 % | 40 % | 42 % |
| Lamartine 1 | H | 977 | 46 % | 11 % | 19 % | 42 % | 37 % |
| La Fuye Velpeau 3 | H | 795 | 47 % | 11 % | 24 % | 22 % | 51 % |
| La Fuye Velpeau 2 | H | 942 | 48 % | 15 % | 22 % | 19 % | 48 % |
| Paul Bert | H | 1593 | 48 % | 16 % | 22 % | 23 % | 55 % |
| Les Fontaines 3 | H | 901 | 49 % | 4 % | 37 % | 48 % | 8 % |
| Europe 4 | H | 466 | 50 % | 4 % | 41 % | 37 % | 4 % |
| Rochepinard | H | 538 | 50 % | 15 % | 26 % | 35 % | 32 % |
| Lakanal-Strasbourg 2 | H | 1475 | 51 % | 15 % | 18 % | 24 % | 64 % |
| Giraudeau 2 | H | 1240 | 51 % | 10 % | 21 % | 29 % | 47 % |
| Europe 3 | H | 652 | 53 % | 3 % | 32 % | 36 % | 22 % |
| Giraudeau 1 | H | 563 | 55 % | 6 % | 19 % | 41 % | 20 % |
| Beaujardin 2 | H | 1002 | 56 % | 6 % | 26 % | 28 % | 47 % |
| Saint-Symphorien 1 | H | 1890 | 56 % | 4 % | 32 % | 20 % | 74 % |
| Deux Lions Gloriette | H | 1398 | 56 % | 7 % | 20 % | 28 % | 75 % |
| Les Fontaines 2 | H | 840 | 58 % | 8 % | 26 % | 31 % | 18 % |
| Europe 2 | H | 504 | 58 % | 1 % | 25 % | 19 % | 34 % |
| Beaujardin 1 | H | 666 | 59 % | 8 % | 19 % | 32 % | 34 % |
| Europe 6 | H | 607 | 60 % | 6 % | 26 % | 33 % | 35 % |
| Rives du Cher 2 | H | 976 | 60 % | 2 % | 31 % | 27 % | 10 % |
| Montjoyeux | H | 1157 | 62 % | 6 % | 18 % | 30 % | 40 % |
| Europe 1 | H | 640 | 63 % | 5 % | 18 % | 17 % | 40 % |
| Les Fontaines 1 | H | 654 | 63 % | 6 % | 20 % | 16 % | 81 % |
| Saint-Symphorien 3 | H | 677 | 63 % | 4 % | 24 % | 27 % | 50 % |
| La Bergeonnerie | H | 703 | 63 % | 3 % | 26 % | 34 % | 14 % |
| Douets Milletière 2 | H | 918 | 64 % | 4 % | 16 % | 16 % | 73 % |
| Saint-Symphorien 2 | H | 3462 | 64 % | 5 % | 22 % | 20 % | 77 % |
| Saint-Symphorien 4 | H | 1342 | 66 % | 12 % | 14 % | 23 % | 82 % |
| Sainte-Radegonde 2 | H | 1320 | 66 % | 6 % | 17 % | 20 % | 68 % |
| Europe 5 | H | 1621 | 68 % | 4 % | 22 % | 15 % | 81 % |
| Sainte-Radegonde 1 | H | 2303 | 69 % | 4 % | 16 % | 15 % | 89 % |
| Douets Milletière 1 | H | 280 | 79 % | 5 % | 11 % | 8 % | 91 % |
| Douets Milletière 3 | A | 0 | nan % | nan % | nan % | 33 % | 67 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tours | 93 % | 68 % | 84 % | 81 % | 89 % | 92 % | 62 % | 79 % | 94 % | 2 % | 88 % |
| Joué-lès-Tours | 75 % | 29 % | 59 % | 63 % | 62 % | 85 % | 95 % | 49 % | 81 % | 8 % | 48 % |
| Saint-Cyr-sur-Loire | 76 % | 31 % | 58 % | 66 % | 48 % | 78 % | 11 % | 35 % | 81 % | 3 % | 62 % |
| Saint-Pierre-des-Corps | 86 % | 42 % | 72 % | 60 % | 82 % | 96 % | 94 % | 65 % | 83 % | 4 % | 68 % |
| Saint-Avertin | 44 % | 12 % | 38 % | 59 % | 41 % | 38 % | 4 % | 17 % | 5 % | 27 % | 5 % |
| Amboise | 65 % | 48 % | 23 % | 23 % | 43 % | 51 % | 45 % | 21 % | 0 % | 100 % | 0 % |
| Chambray-lès-Tours | 62 % | 51 % | 46 % | 45 % | 43 % | 49 % | 8 % | 21 % | 55 % | 23 % | 42 % |

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

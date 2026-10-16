# Fiche mobilité · Le Mans (72181)

Générée le 2026-10-14T14:29:07Z · jour de référence 2026-10-13 · voisines : Allonnes, Coulaines, Changé, Arnage, Yvré-l'Évêque, Savigné-l'Évêque

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.03, "bas": 0.027, "haut": 0.034, "lignes": 17138, "n_eff": 10115}, "marche": {"p": 0.094, "bas": 0.089, "haut": 0.1, "lignes": 17138, "n_eff": 10115}, "velo": {"p": 0.077, "bas": 0.072, "haut": 0.083, "lignes": 17138, "n_eff": 10115}, "deux_roues_mot": {"p": 0.016, "bas": 0.013, "haut": 0.018, "lignes": 17138, "n_eff": 10115}, "voiture": {"p": 0.581, "bas": 0.572, "haut": 0.591, "lignes": 17138, "n_eff": 10115}, "tc": {"p": 0.202, "bas": 0.194, "haut": 0.21, "lignes": 17138, "n_eff": 10115}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5813) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.712, "bas": 0.703, "haut": 0.72, "lignes": 17138, "n_eff": 10115}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.517, "bas": 0.506, "haut": 0.529, "lignes": 12183, "n_eff": 7200}, "communes_voisines": {"p": 0.794, "bas": 0.763, "haut": 0.822, "lignes": 1223, "n_eff": 722}, "ailleurs": {"p": 0.739, "bas": 0.723, "haut": 0.755, "lignes": 4955, "n_eff": 2916}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Allonnes, Coulaines, Changé, Arnage, Yvré-l'Évêque, Savigné-l'Évêque

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.133, "bas": 0.127, "haut": 0.14, "lignes": 17138, "n_eff": 10115}, "actifs_menage_2_voitures_plus": {"p": 0.366, "bas": 0.357, "haut": 0.376, "lignes": 17138, "n_eff": 10115}, "menage_motorise_mais_pas_en_voiture": {"p": 0.354, "bas": 0.344, "haut": 0.364, "lignes": 14605, "n_eff": 8669}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.611, "bas": 0.597, "haut": 0.625, "lignes": 7640, "n_eff": 4670}, "velo": {"p": 0.108, "bas": 0.1, "haut": 0.118, "lignes": 7640, "n_eff": 4670}, "menage_sans_voiture": {"p": 0.04, "bas": 0.035, "haut": 0.046, "lignes": 7640, "n_eff": 4670}, "menage_2_voitures_plus": {"p": 0.508, "bas": 0.494, "haut": 0.523, "lignes": 7640, "n_eff": 4670}}, "locataires_prive": {"voiture": {"p": 0.567, "bas": 0.549, "haut": 0.584, "lignes": 5424, "n_eff": 3111}, "velo": {"p": 0.053, "bas": 0.046, "haut": 0.061, "lignes": 5424, "n_eff": 3111}, "menage_sans_voiture": {"p": 0.195, "bas": 0.181, "haut": 0.209, "lignes": 5424, "n_eff": 3111}, "menage_2_voitures_plus": {"p": 0.261, "bas": 0.246, "haut": 0.277, "lignes": 5424, "n_eff": 3111}}, "locataires_hlm": {"voiture": {"p": 0.546, "bas": 0.524, "haut": 0.566, "lignes": 3745, "n_eff": 2167}, "velo": {"p": 0.041, "bas": 0.033, "haut": 0.05, "lignes": 3745, "n_eff": 2167}, "menage_sans_voiture": {"p": 0.263, "bas": 0.244, "haut": 0.281, "lignes": 3745, "n_eff": 2167}, "menage_2_voitures_plus": {"p": 0.209, "bas": 0.193, "haut": 0.227, "lignes": 3745, "n_eff": 2167}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 85710, "habitent_la_commune": {"part_des_emplois": 0.457, "voiture": {"p": 0.517, "bas": 0.506, "haut": 0.529, "lignes": 12183, "n_eff": 7200}, "tc": {"p": 0.199, "bas": 0.19, "haut": 0.209, "lignes": 12183, "n_eff": 7200}}, "reste_unite_urbaine": {"part_des_emplois": 0.156, "voiture": {"p": 0.876, "bas": 0.861, "haut": 0.891, "lignes": 2836, "n_eff": 1834}, "tc": {"p": 0.076, "bas": 0.065, "haut": 0.09, "lignes": 2836, "n_eff": 1834}}, "hors_unite_urbaine": {"part_des_emplois": 0.387, "voiture": {"p": 0.903, "bas": 0.894, "haut": 0.911, "lignes": 6951, "n_eff": 4507}, "tc": {"p": 0.076, "bas": 0.069, "haut": 0.084, "lignes": 6951, "n_eff": 4507}}}`

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

**Valeur** : `{"min": 0.365, "iris_min": "Jacobins-République", "max": 0.798, "iris_max": "Oasis", "iris_habitat": 63}`

Définition : C22_ACTOCC15P_VOIT / C22_ACTOCC15P, IRIS d'habitat (TYP_IRIS = H)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- IRIS de moins de 300 actifs : 0

Limites :
- Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.
- Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.

**À vérifier par un humain** : Relire les libellés d'IRIS avant de les citer comme noms de quartiers.

## Contrôle : IRIS agrégés = fichier détail
`iris.coherence_mobpro` · statut : contrôle · maille : commune · millésime : 2022

**Valeur** : `{"iris": 0.581, "mobpro": 0.581}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.265, "menages_2_voitures_plus": 0.205, "menages_stationnement_reserve": 0.559}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.912, "grande_surface_500m": 0.606, "pharmacie_500m": 0.773, "medecin_generaliste_500m": 0.588, "ecole_elementaire_500m": 0.858, "college_1km": 0.951, "gare_2km": 0.6, "panier_quotidien_500m": 0.679, "bus_8h_7_9h": 0.859, "aucun_bus_7_9h": 0.014, "bus_4h_20_22h": 0.749}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain SETRAM » (https://transport.data.gouv.fr/datasets/gtfs-du-reseau-des-transports-bus-et-tramway-setram-circulant-sur-le-territoire-le-mans-metropole), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260831', '20261128']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.31, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.59, "ecart": 0.72, "stations": 29}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.149, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.675, "ecart": 0.474, "stations": 26}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 33 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Le Mans | 71 % | 52 % | 10 % | 20 % | 13 % | 12183 (ok) |
| Allonnes | 3 % | 78 % | 5 % | 14 % | 1 % | 555 (ok) |
| Arnage | 1 % | 84 % | 5 % | 7 % | 2 % | 232 (ok) |
| Champagné | 1 % | 95 % | 0 % | 4 % | 1 % | 223 (ok) |
| La Chapelle-Saint-Aubin | 1 % | 76 % | 4 % | 16 % | 2 % | 216 (ok) |
| Coulaines | 1 % | 73 % | 9 % | 14 % | 4 % | 216 (ok) |
| Saint-Saturnin | 1 % | 87 % | 2 % | 10 % | 0 % | 162 (ok) |
| Changé | 1 % | 86 % | 3 % | 5 % | 0 % | 110 (fragile) |
| Ruaudin | 1 % | 78 % | 2 % | 18 % | 0 % | 134 (fragile) |
| Mulsanne | 1 % | 92 % | 0 % | 7 % | 0 % | 101 (fragile) |
| Sablé-sur-Sarthe | 1 % | 62 % | 0 % | 38 % | 0 % | 107 (fragile) |
| Spay | 0 % | 83 % | 5 % | 10 % | 0 % | 77 (fragile) |
| La Ferté-Bernard | 0 % | 66 % | 0 % | 34 % | 0 % | 76 (fragile) |
| Parigné-l'Évêque | 0 % | 93 % | 2 % | 0 % | 0 % | 64 (fragile) |
| Rouillon | 0 % | 85 % | 7 % | 8 % | 0 % | 68 (fragile) |
| Sargé-lès-le-Mans | 0 % | 68 % | 5 % | 15 % | 5 % | 73 (fragile) |
| La Suze-sur-Sarthe | 0 % | 89 % | 0 % | 9 % | 0 % | 74 (fragile) |
| Yvré-l'Évêque | 0 % | 75 % | 5 % | 17 % | 2 % | 76 (fragile) |
| Angers | 0 % | 30 % | 5 % | 63 % | 2 % | 47 (fragile) |
| Laval | 0 % | 66 % | 0 % | 34 % | 1 % | 42 (fragile) |
| Loué | 0 % | 83 % | 0 % | 17 % | 0 % | 55 (fragile) |
| Voivres-lès-le-Mans | 0 % | 86 % | 0 % | 9 % | 0 % | 50 (fragile) |
| Paris 15e Arrondissement | 0 % | 18 % | 2 % | 80 % | 0 % | 49 (fragile) |
| Nantes | 0 % | 49 % | 3 % | 48 % | 0 % | 44 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Étangs Chauds | D | 3 | 0 % | 0 % | 0 % | 0 % | 100 % |
| Z.A. Novaxis | A | 4 | 0 % | 70 % | 30 % | 25 % | 75 % |
| Jacobins-République | H | 1105 | 36 % | 5 % | 31 % | 48 % | 42 % |
| Leclerc | H | 868 | 38 % | 5 % | 33 % | 36 % | 48 % |
| Gare | H | 994 | 38 % | 10 % | 26 % | 37 % | 45 % |
| Courboulay | H | 1184 | 40 % | 4 % | 31 % | 45 % | 39 % |
| Vieux Mans | H | 760 | 41 % | 8 % | 24 % | 39 % | 23 % |
| Nationale | H | 1325 | 42 % | 7 % | 25 % | 38 % | 49 % |
| Tessé | H | 715 | 46 % | 8 % | 22 % | 22 % | 60 % |
| Sables d'Or | H | 1049 | 46 % | 6 % | 30 % | 26 % | 62 % |
| Jaurès Bertinière | H | 786 | 46 % | 11 % | 29 % | 38 % | 40 % |
| Sablonnière | H | 410 | 47 % | 4 % | 38 % | 40 % | 30 % |
| Mission | H | 909 | 49 % | 13 % | 17 % | 22 % | 53 % |
| Petit Louvre | H | 454 | 49 % | 2 % | 38 % | 55 % | 24 % |
| Bellevue | H | 460 | 49 % | 7 % | 34 % | 40 % | 44 % |
| Pré | H | 1000 | 50 % | 9 % | 24 % | 30 % | 48 % |
| Gué Bernisson | H | 551 | 50 % | 4 % | 36 % | 42 % | 17 % |
| Newton | H | 706 | 50 % | 1 % | 40 % | 42 % | 20 % |
| Glonnières | H | 464 | 51 % | 7 % | 30 % | 58 % | 15 % |
| Miroir | H | 1275 | 51 % | 11 % | 21 % | 28 % | 48 % |
| Mutuelles | H | 1133 | 52 % | 10 % | 15 % | 29 % | 52 % |
| Maillets-Isaac | H | 596 | 52 % | 10 % | 26 % | 32 % | 57 % |
| Ronceray | H | 526 | 52 % | 7 % | 25 % | 47 % | 28 % |
| Hôpital-Chanzy | H | 1238 | 53 % | 10 % | 20 % | 18 % | 59 % |
| Saint-Pavin | H | 1011 | 53 % | 9 % | 22 % | 29 % | 49 % |
| Chasse Royale | H | 1324 | 53 % | 9 % | 19 % | 30 % | 52 % |
| Jaurès Crétois | H | 1090 | 53 % | 11 % | 25 % | 22 % | 53 % |
| Olivier Heuzé | H | 744 | 54 % | 15 % | 16 % | 21 % | 51 % |
| Pâtis Saint-Lazare | H | 969 | 54 % | 11 % | 19 % | 25 % | 33 % |
| Épau | H | 411 | 55 % | 5 % | 29 % | 47 % | 32 % |
| Michel-Ange | H | 515 | 55 % | 2 % | 26 % | 34 % | 31 % |
| Sablons centre | H | 431 | 56 % | 1 % | 26 % | 42 % | 36 % |
| Jardin des Plantes | H | 938 | 56 % | 16 % | 14 % | 14 % | 59 % |
| Sainte-Croix | H | 1210 | 56 % | 9 % | 17 % | 24 % | 66 % |
| Carnot | H | 1076 | 57 % | 12 % | 17 % | 17 % | 53 % |
| Épine | H | 493 | 58 % | 6 % | 19 % | 37 % | 42 % |
| Z.A. Zone industrielle sud 1 | A | 51 | 58 % | 14 % | 23 % | 12 % | 74 % |
| Boussinière | H | 1233 | 58 % | 13 % | 12 % | 18 % | 57 % |
| Pontlieue | H | 1376 | 59 % | 7 % | 28 % | 27 % | 46 % |
| Fontenelles | H | 914 | 60 % | 3 % | 27 % | 22 % | 75 % |
| Banjan-Croix de Pierre | H | 1149 | 61 % | 10 % | 18 % | 29 % | 65 % |
| Cadran | H | 465 | 62 % | 12 % | 12 % | 7 % | 88 % |
| Maroc | H | 551 | 62 % | 5 % | 20 % | 27 % | 52 % |
| Monthéard | H | 714 | 62 % | 6 % | 17 % | 30 % | 58 % |
| Batignolles | H | 1448 | 64 % | 9 % | 15 % | 17 % | 68 % |
| La Butte | H | 957 | 65 % | 6 % | 11 % | 18 % | 75 % |
| Vert Galant | H | 883 | 65 % | 4 % | 22 % | 26 % | 61 % |
| Circuit | D | 58 | 66 % | 17 % | 17 % | 1 % | 82 % |
| Université | H | 2616 | 66 % | 5 % | 18 % | 26 % | 72 % |
| Villaret | H | 624 | 66 % | 8 % | 15 % | 9 % | 88 % |
| Sources | H | 856 | 66 % | 5 % | 22 % | 21 % | 66 % |
| Ardriers | H | 984 | 69 % | 9 % | 13 % | 13 % | 79 % |
| Yzeuville | H | 1048 | 69 % | 9 % | 13 % | 10 % | 87 % |
| Clairfontaine | H | 855 | 69 % | 10 % | 9 % | 8 % | 90 % |
| Bas de Gazonfier | H | 613 | 69 % | 9 % | 14 % | 14 % | 68 % |
| Cité des Pins | H | 948 | 70 % | 6 % | 19 % | 27 % | 42 % |
| Bruyères | H | 839 | 70 % | 6 % | 16 % | 21 % | 57 % |
| Christ Sauveur | H | 500 | 71 % | 2 % | 21 % | 38 % | 33 % |
| Riffaudières | H | 712 | 72 % | 14 % | 9 % | 13 % | 79 % |
| Pavoine | H | 807 | 73 % | 5 % | 16 % | 20 % | 68 % |
| Marcel Paul | H | 691 | 76 % | 6 % | 11 % | 15 % | 75 % |
| Saint-Georges | H | 710 | 76 % | 5 % | 13 % | 9 % | 79 % |
| Funay | H | 834 | 77 % | 3 % | 12 % | 14 % | 75 % |
| Gallière | H | 758 | 77 % | 6 % | 9 % | 15 % | 79 % |
| Meslier | H | 507 | 78 % | 5 % | 11 % | 5 % | 90 % |
| Haut de Gazonfier | H | 489 | 79 % | 7 % | 8 % | 8 % | 78 % |
| Oasis | H | 658 | 80 % | 5 % | 9 % | 9 % | 81 % |
| Vallée Saint-Blaise | D | 411 | 86 % | 2 % | 9 % | 4 % | 98 % |
| Z.A. Zone commerciale sud | A | 3 | 100 % | 0 % | 0 % | 33 % | 100 % |
| Z.A. Nord | A | 14 | 100 % | 0 % | 0 % | 0 % | 100 % |
| Z.A. Zone industrielle sud 2 | A | 3 | 100 % | 0 % | 0 % | 51 % | 0 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Le Mans | 91 % | 61 % | 77 % | 59 % | 86 % | 95 % | 60 % | 68 % | 86 % | 1 % | 75 % |
| Allonnes | 66 % | 18 % | 68 % | 49 % | 70 % | 73 % | 0 % | 57 % | 70 % | 7 % | 70 % |
| Coulaines | 65 % | 43 % | 49 % | 54 % | 49 % | 91 % | 10 % | 37 % | 70 % | 20 % | 51 % |
| Changé | 40 % | 15 % | 36 % | 18 % | 19 % | 54 % | 0 % | 18 % | 0 % | 100 % | 0 % |
| Arnage | 60 % | 51 % | 35 % | 50 % | 48 % | 28 % | 76 % | 32 % | 53 % | 22 % | 0 % |
| Yvré-l'Évêque | 47 % | 4 % | 29 % | 26 % | 43 % | 57 % | 0 % | 28 % | 2 % | 35 % | 2 % |
| Savigné-l'Évêque | 46 % | 35 % | 16 % | 43 % | 23 % | 0 % | 0 % | 16 % | 0 % | 100 % | 0 % |

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

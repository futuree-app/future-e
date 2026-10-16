# Fiche mobilité · Poitiers (86194)

Générée le 2026-10-14T14:23:50Z · jour de référence 2026-10-13 · voisines : Buxerolles, Jaunay-Marigny, Saint-Benoît, Vouneuil-sous-Biard, Migné-Auxances, Chasseneuil-du-Poitou

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.043, "bas": 0.038, "haut": 0.048, "lignes": 10271, "n_eff": 5787}, "marche": {"p": 0.122, "bas": 0.114, "haut": 0.131, "lignes": 10271, "n_eff": 5787}, "velo": {"p": 0.059, "bas": 0.053, "haut": 0.066, "lignes": 10271, "n_eff": 5787}, "deux_roues_mot": {"p": 0.015, "bas": 0.012, "haut": 0.019, "lignes": 10271, "n_eff": 5787}, "voiture": {"p": 0.593, "bas": 0.58, "haut": 0.605, "lignes": 10271, "n_eff": 5787}, "tc": {"p": 0.168, "bas": 0.159, "haut": 0.178, "lignes": 10271, "n_eff": 5787}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5927) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.728, "bas": 0.716, "haut": 0.739, "lignes": 10271, "n_eff": 5787}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.538, "bas": 0.522, "haut": 0.553, "lignes": 7423, "n_eff": 4198}, "communes_voisines": {"p": 0.759, "bas": 0.726, "haut": 0.79, "lignes": 1222, "n_eff": 681}, "ailleurs": {"p": 0.74, "bas": 0.718, "haut": 0.761, "lignes": 2848, "n_eff": 1589}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Buxerolles, Jaunay-Marigny, Saint-Benoît, Vouneuil-sous-Biard, Migné-Auxances, Chasseneuil-du-Poitou

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.156, "bas": 0.147, "haut": 0.166, "lignes": 10271, "n_eff": 5787}, "actifs_menage_2_voitures_plus": {"p": 0.306, "bas": 0.294, "haut": 0.318, "lignes": 10271, "n_eff": 5787}, "menage_motorise_mais_pas_en_voiture": {"p": 0.302, "bas": 0.289, "haut": 0.316, "lignes": 8334, "n_eff": 4708}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.669, "bas": 0.648, "haut": 0.689, "lignes": 3378, "n_eff": 2026}, "velo": {"p": 0.092, "bas": 0.08, "haut": 0.105, "lignes": 3378, "n_eff": 2026}, "menage_sans_voiture": {"p": 0.033, "bas": 0.026, "haut": 0.042, "lignes": 3378, "n_eff": 2026}, "menage_2_voitures_plus": {"p": 0.508, "bas": 0.487, "haut": 0.53, "lignes": 3378, "n_eff": 2026}}, "locataires_prive": {"voiture": {"p": 0.572, "bas": 0.552, "haut": 0.591, "lignes": 4483, "n_eff": 2409}, "velo": {"p": 0.05, "bas": 0.042, "haut": 0.059, "lignes": 4483, "n_eff": 2409}, "menage_sans_voiture": {"p": 0.228, "bas": 0.211, "haut": 0.245, "lignes": 4483, "n_eff": 2409}, "menage_2_voitures_plus": {"p": 0.214, "bas": 0.198, "haut": 0.231, "lignes": 4483, "n_eff": 2409}}, "locataires_hlm": {"voiture": {"p": 0.567, "bas": 0.538, "haut": 0.596, "lignes": 1942, "n_eff": 1102}, "velo": {"p": 0.027, "bas": 0.019, "haut": 0.038, "lignes": 1942, "n_eff": 1102}, "menage_sans_voiture": {"p": 0.282, "bas": 0.257, "haut": 0.31, "lignes": 1942, "n_eff": 1102}, "menage_2_voitures_plus": {"p": 0.165, "bas": 0.144, "haut": 0.188, "lignes": 1942, "n_eff": 1102}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 61712, "habitent_la_commune": {"part_des_emplois": 0.4, "voiture": {"p": 0.538, "bas": 0.522, "haut": 0.553, "lignes": 7423, "n_eff": 4198}, "tc": {"p": 0.157, "bas": 0.146, "haut": 0.168, "lignes": 7423, "n_eff": 4198}}, "reste_unite_urbaine": {"part_des_emplois": 0.129, "voiture": {"p": 0.852, "bas": 0.83, "haut": 0.871, "lignes": 1838, "n_eff": 1136}, "tc": {"p": 0.077, "bas": 0.063, "haut": 0.094, "lignes": 1838, "n_eff": 1136}}, "hors_unite_urbaine": {"part_des_emplois": 0.47, "voiture": {"p": 0.928, "bas": 0.919, "haut": 0.935, "lignes": 5965, "n_eff": 3899}, "tc": {"p": 0.05, "bas": 0.044, "haut": 0.058, "lignes": 5965, "n_eff": 3899}}}`

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

**Valeur** : `{"min": 0.326, "iris_min": "Hôtel de Ville", "max": 0.767, "iris_max": "Saint-Éloi-Fraternité", "iris_habitat": 35}`

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

**Valeur** : `{"iris": 0.593, "mobpro": 0.593}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.298, "menages_2_voitures_plus": 0.167, "menages_stationnement_reserve": 0.572}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.88, "grande_surface_500m": 0.491, "pharmacie_500m": 0.778, "medecin_generaliste_500m": 0.73, "ecole_elementaire_500m": 0.699, "college_1km": 0.83, "gare_2km": 0.508, "panier_quotidien_500m": 0.578, "bus_8h_7_9h": 0.934, "aucun_bus_7_9h": 0.013, "bus_4h_20_22h": 0.829}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Vitalis » (https://transport.data.gouv.fr/datasets/mobilite-offre-de-transport-du-reseau-bus-gtfs-gtfs-rt), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20261012', '20261220']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.339, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.559, "ecart": 0.78, "stations": 17}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.154, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.629, "ecart": 0.525, "stations": 16}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 23 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Poitiers | 73 % | 54 % | 7 % | 16 % | 16 % | 7423 (ok) |
| Chasseneuil-du-Poitou | 6 % | 72 % | 1 % | 24 % | 1 % | 626 (ok) |
| Saint-Benoît | 2 % | 78 % | 6 % | 11 % | 2 % | 240 (ok) |
| Châtellerault | 2 % | 80 % | 0 % | 16 % | 2 % | 153 (ok) |
| Migné-Auxances | 1 % | 87 % | 1 % | 7 % | 0 % | 113 (fragile) |
| Jaunay-Marigny | 1 % | 85 % | 1 % | 11 % | 0 % | 97 (fragile) |
| Buxerolles | 1 % | 64 % | 8 % | 17 % | 8 % | 96 (fragile) |
| Biard | 1 % | 75 % | 11 % | 10 % | 1 % | 79 (fragile) |
| Mignaloux-Beauvoir | 1 % | 83 % | 2 % | 13 % | 0 % | 73 (fragile) |
| Niort | 1 % | 65 % | 2 % | 26 % | 6 % | 69 (fragile) |
| Neuville-de-Poitou | 0 % | 91 % | 1 % | 6 % | 0 % | 53 (fragile) |
| Vouneuil-sous-Biard | 0 % | 93 % | 1 % | 1 % | 6 % | 50 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Milétrie | A | 26 | 0 % | 0 % | 0 % | nan % | nan % |
| Gare | A | 98 | 27 % | 8 % | 17 % | 70 % | 10 % |
| Hôtel de Ville | H | 835 | 33 % | 5 % | 19 % | 52 % | 30 % |
| Cathédrale | H | 1029 | 41 % | 6 % | 20 % | 42 % | 34 % |
| Sainte-Croix | H | 992 | 45 % | 6 % | 24 % | 40 % | 48 % |
| Trois Quartiers | H | 1460 | 45 % | 5 % | 24 % | 49 % | 24 % |
| Carnot | H | 783 | 46 % | 4 % | 20 % | 49 % | 30 % |
| Blossac-Saint-Hilaire | H | 1269 | 46 % | 5 % | 20 % | 35 % | 52 % |
| Saint-Cyprien | H | 554 | 48 % | 5 % | 32 % | 46 % | 27 % |
| Couronneries-Nimègue | H | 690 | 48 % | 2 % | 39 % | 46 % | 17 % |
| Les Feuillants | H | 890 | 51 % | 4 % | 18 % | 33 % | 52 % |
| Aliénor d'Aquitaine | H | 505 | 52 % | 1 % | 38 % | 42 % | 42 % |
| Montmidi | H | 1914 | 54 % | 7 % | 9 % | 11 % | 72 % |
| Grand Maison | H | 949 | 56 % | 3 % | 23 % | 23 % | 72 % |
| Provence | H | 328 | 57 % | 3 % | 20 % | 28 % | 68 % |
| Clos Gauthier-Les Sables | H | 609 | 58 % | 3 % | 32 % | 50 % | 32 % |
| Les Templiers | H | 504 | 58 % | 4 % | 22 % | 36 % | 43 % |
| Couronneries-Europe | H | 883 | 60 % | 3 % | 25 % | 32 % | 32 % |
| Les Rocs | H | 1090 | 60 % | 10 % | 12 % | 18 % | 65 % |
| Beaulieu | H | 742 | 60 % | 3 % | 24 % | 36 % | 49 % |
| Gibauderie | H | 1133 | 61 % | 11 % | 8 % | 23 % | 76 % |
| Les Facultés | H | 1090 | 61 % | 4 % | 18 % | 19 % | 77 % |
| Quatre Roues-Les Dunes | H | 1944 | 61 % | 13 % | 9 % | 18 % | 66 % |
| La Plaine | H | 942 | 63 % | 11 % | 13 % | 31 % | 60 % |
| Bel-Air | H | 594 | 63 % | 1 % | 22 % | 37 % | 49 % |
| Ganterie | H | 773 | 64 % | 9 % | 11 % | 27 % | 80 % |
| Chilvert | H | 1192 | 65 % | 9 % | 13 % | 22 % | 64 % |
| Pointe à Miteau | A | 123 | 65 % | 0 % | 12 % | 12 % | 83 % |
| Le Porteau | H | 878 | 66 % | 8 % | 12 % | 21 % | 59 % |
| Saint-Éloi-Mandela | H | 1136 | 67 % | 2 % | 20 % | 32 % | 72 % |
| Montbernage | H | 802 | 68 % | 8 % | 12 % | 22 % | 65 % |
| La Demi-Lune | H | 1566 | 68 % | 4 % | 14 % | 14 % | 74 % |
| Les Cours | H | 1209 | 69 % | 10 % | 7 % | 13 % | 84 % |
| Iassi | H | 411 | 70 % | 3 % | 15 % | 19 % | 72 % |
| Grand Large | A | 201 | 71 % | 6 % | 8 % | 19 % | 88 % |
| Bellejouanne | H | 526 | 72 % | 3 % | 14 % | 34 % | 59 % |
| Touffenet | H | 324 | 75 % | 2 % | 17 % | 17 % | 90 % |
| Prés Mignons | H | 949 | 75 % | 6 % | 9 % | 11 % | 80 % |
| Saint-Éloi-Fraternité | H | 1562 | 77 % | 3 % | 13 % | 16 % | 84 % |
| La République | A | 69 | 81 % | 0 % | 7 % | 2 % | 87 % |
| Le Breuil-Mingot | A | 378 | 93 % | 2 % | 3 % | 4 % | 89 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Poitiers | 88 % | 49 % | 78 % | 73 % | 70 % | 83 % | 51 % | 58 % | 93 % | 1 % | 83 % |
| Buxerolles | 64 % | 45 % | 55 % | 55 % | 46 % | 66 % | 12 % | 37 % | 55 % | 8 % | 53 % |
| Jaunay-Marigny | 30 % | 4 % | 28 % | 36 % | 37 % | 55 % | 60 % | 17 % | 4 % | 60 % | 4 % |
| Saint-Benoît | 54 % | 14 % | 42 % | 52 % | 29 % | 41 % | 0 % | 18 % | 29 % | 18 % | 15 % |
| Vouneuil-sous-Biard | 31 % | 0 % | 30 % | 46 % | 14 % | 19 % | 0 % | 11 % | 7 % | 28 % | 0 % |
| Migné-Auxances | 10 % | 8 % | 32 % | 21 % | 36 % | 0 % | 0 % | 0 % | 0 % | 38 % | 0 % |
| Chasseneuil-du-Poitou | 55 % | 1 % | 16 % | 23 % | 18 % | 0 % | 86 % | 14 % | 53 % | 17 % | 53 % |

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

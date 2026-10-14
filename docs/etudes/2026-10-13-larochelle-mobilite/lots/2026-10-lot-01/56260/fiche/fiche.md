# Fiche mobilité · Vannes (56260)

Générée le 2026-10-14T14:25:43Z · jour de référence 2026-10-13 · voisines : Saint-Avé, Séné, Plescop

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.061, "bas": 0.054, "haut": 0.069, "lignes": 6857, "n_eff": 3833}, "marche": {"p": 0.081, "bas": 0.073, "haut": 0.09, "lignes": 6857, "n_eff": 3833}, "velo": {"p": 0.072, "bas": 0.064, "haut": 0.08, "lignes": 6857, "n_eff": 3833}, "deux_roues_mot": {"p": 0.016, "bas": 0.013, "haut": 0.021, "lignes": 6857, "n_eff": 3833}, "voiture": {"p": 0.675, "bas": 0.66, "haut": 0.69, "lignes": 6857, "n_eff": 3833}, "tc": {"p": 0.095, "bas": 0.086, "haut": 0.105, "lignes": 6857, "n_eff": 3833}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.6754) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.642, "bas": 0.627, "haut": 0.657, "lignes": 6857, "n_eff": 3833}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.586, "bas": 0.566, "haut": 0.605, "lignes": 4342, "n_eff": 2443}, "communes_voisines": {"p": 0.851, "bas": 0.803, "haut": 0.889, "lignes": 472, "n_eff": 263}, "ailleurs": {"p": 0.836, "bas": 0.816, "haut": 0.855, "lignes": 2515, "n_eff": 1390}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Saint-Avé, Séné, Plescop

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.075, "bas": 0.067, "haut": 0.084, "lignes": 6857, "n_eff": 3833}, "actifs_menage_2_voitures_plus": {"p": 0.398, "bas": 0.382, "haut": 0.413, "lignes": 6857, "n_eff": 3833}, "menage_motorise_mais_pas_en_voiture": {"p": 0.269, "bas": 0.255, "haut": 0.284, "lignes": 6156, "n_eff": 3443}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.698, "bas": 0.674, "haut": 0.72, "lignes": 2716, "n_eff": 1559}, "velo": {"p": 0.097, "bas": 0.083, "haut": 0.112, "lignes": 2716, "n_eff": 1559}, "menage_sans_voiture": {"p": 0.021, "bas": 0.015, "haut": 0.03, "lignes": 2716, "n_eff": 1559}, "menage_2_voitures_plus": {"p": 0.59, "bas": 0.566, "haut": 0.615, "lignes": 2716, "n_eff": 1559}}, "locataires_prive": {"voiture": {"p": 0.68, "bas": 0.656, "haut": 0.703, "lignes": 2826, "n_eff": 1523}, "velo": {"p": 0.067, "bas": 0.055, "haut": 0.08, "lignes": 2826, "n_eff": 1523}, "menage_sans_voiture": {"p": 0.117, "bas": 0.102, "haut": 0.134, "lignes": 2826, "n_eff": 1523}, "menage_2_voitures_plus": {"p": 0.302, "bas": 0.279, "haut": 0.325, "lignes": 2826, "n_eff": 1523}}, "locataires_hlm": {"voiture": {"p": 0.727, "bas": 0.69, "haut": 0.762, "lignes": 1009, "n_eff": 584}, "velo": {"p": 0.03, "bas": 0.019, "haut": 0.047, "lignes": 1009, "n_eff": 584}, "menage_sans_voiture": {"p": 0.14, "bas": 0.114, "haut": 0.17, "lignes": 1009, "n_eff": 584}, "menage_2_voitures_plus": {"p": 0.221, "bas": 0.189, "haut": 0.256, "lignes": 1009, "n_eff": 584}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 44483, "habitent_la_commune": {"part_des_emplois": 0.307, "voiture": {"p": 0.586, "bas": 0.566, "haut": 0.605, "lignes": 4342, "n_eff": 2443}, "tc": {"p": 0.084, "bas": 0.073, "haut": 0.095, "lignes": 4342, "n_eff": 2443}}, "reste_unite_urbaine": {"part_des_emplois": 0.108, "voiture": {"p": 0.883, "bas": 0.858, "haut": 0.904, "lignes": 1245, "n_eff": 743}, "tc": {"p": 0.049, "bas": 0.035, "haut": 0.067, "lignes": 1245, "n_eff": 743}}, "hors_unite_urbaine": {"part_des_emplois": 0.585, "voiture": {"p": 0.942, "bas": 0.934, "haut": 0.949, "lignes": 5492, "n_eff": 3548}, "tc": {"p": 0.037, "bas": 0.031, "haut": 0.044, "lignes": 5492, "n_eff": 3548}}}`

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

**Valeur** : `{"min": 0.375, "iris_min": "Intra-Muros", "max": 0.808, "iris_max": "Ménimur 1", "iris_habitat": 20}`

Définition : C22_ACTOCC15P_VOIT / C22_ACTOCC15P, IRIS d'habitat (TYP_IRIS = H)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- IRIS de moins de 300 actifs : 1

Limites :
- Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points.
- Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.

**À vérifier par un humain** : Relire les libellés d'IRIS avant de les citer comme noms de quartiers.

## Contrôle : IRIS agrégés = fichier détail
`iris.coherence_mobpro` · statut : contrôle · maille : commune · millésime : 2022

**Valeur** : `{"iris": 0.675, "mobpro": 0.675}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.186, "menages_2_voitures_plus": 0.225, "menages_stationnement_reserve": 0.719}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.858, "grande_surface_500m": 0.487, "pharmacie_500m": 0.558, "medecin_generaliste_500m": 0.8, "ecole_elementaire_500m": 0.76, "college_1km": 0.746, "gare_2km": 0.617, "panier_quotidien_500m": 0.48, "bus_8h_7_9h": 0.876, "aucun_bus_7_9h": 0.034, "bus_4h_20_22h": 0.083}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Kicéo » (https://transport.data.gouv.fr/datasets/reseau-urbain-kiceo), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260831', '20270702']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.339, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.569, "ecart": 0.77, "stations": 19}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.159, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.639, "ecart": 0.52, "stations": 17}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 20 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Vannes | 64 % | 59 % | 10 % | 8 % | 12 % | 4342 (ok) |
| Saint-Avé | 3 % | 85 % | 3 % | 9 % | 2 % | 224 (ok) |
| Theix-Noyalo | 3 % | 91 % | 1 % | 5 % | 1 % | 174 (ok) |
| Séné | 2 % | 87 % | 4 % | 5 % | 3 % | 142 (fragile) |
| Auray | 2 % | 88 % | 2 % | 10 % | 0 % | 135 (fragile) |
| Plescop | 2 % | 83 % | 7 % | 6 % | 1 % | 106 (fragile) |
| Arradon | 1 % | 86 % | 8 % | 5 % | 0 % | 93 (fragile) |
| Lorient | 1 % | 63 % | 2 % | 34 % | 0 % | 78 (fragile) |
| Ploeren | 1 % | 81 % | 3 % | 7 % | 2 % | 75 (fragile) |
| Rennes | 1 % | 48 % | 0 % | 51 % | 2 % | 57 (fragile) |
| Elven | 1 % | 96 % | 1 % | 3 % | 0 % | 59 (fragile) |
| Nantes | 1 % | 52 % | 3 % | 44 % | 1 % | 51 (fragile) |
| Ploërmel | 1 % | 99 % | 0 % | 1 % | 0 % | 48 (fragile) |
| Sarzeau | 1 % | 91 % | 0 % | 7 % | 2 % | 54 (fragile) |
| Saint-Nolff | 1 % | 92 % | 0 % | 4 % | 0 % | 45 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Caserne-Centre Hospitalier | A | 654 | 23 % | 2 % | 5 % | 13 % | 42 % |
| Intra-Muros | H | 441 | 38 % | 5 % | 14 % | 37 % | 23 % |
| Estuaire du Vincin | D | 15 | 48 % | 0 % | 44 % | 0 % | 76 % |
| Rive Gauche du Port | H | 317 | 50 % | 6 % | 18 % | 19 % | 77 % |
| Zone d'Activités de Kerlann | A | 179 | 50 % | 12 % | 7 % | 11 % | 88 % |
| Ouest Péri Centre Ville | H | 1131 | 54 % | 6 % | 16 % | 33 % | 46 % |
| Est Péri Centre Ville | H | 915 | 59 % | 5 % | 10 % | 29 % | 67 % |
| Kerouer-Nord Gare | H | 1087 | 63 % | 14 % | 11 % | 13 % | 84 % |
| Trussac | H | 1284 | 64 % | 15 % | 11 % | 12 % | 77 % |
| Z.I. du Prat | A | 54 | 64 % | 9 % | 11 % | 11 % | 91 % |
| Rohan | H | 773 | 64 % | 6 % | 12 % | 25 % | 60 % |
| Kercado 2 | H | 768 | 65 % | 7 % | 20 % | 29 % | 52 % |
| Parc des Expos-Aquarium-Arcal | A | 141 | 66 % | 11 % | 5 % | 1 % | 96 % |
| Grande Murailles-Boismoreau | H | 1382 | 67 % | 7 % | 10 % | 22 % | 69 % |
| Conleau | H | 808 | 68 % | 9 % | 14 % | 15 % | 77 % |
| Bernus-Kergypt-Keruzen-Campen | H | 1672 | 71 % | 7 % | 9 % | 16 % | 78 % |
| Le Pargo-La Mare-Bois de Vincin | H | 1429 | 71 % | 7 % | 7 % | 16 % | 78 % |
| Kercado 1 | H | 169 | 71 % | 4 % | 15 % | 38 % | 27 % |
| Pointe de Rosvellec | D | 24 | 72 % | 28 % | 0 % | 11 % | 100 % |
| Saint-Guen-Bilaire-Ménimur Pavillonnaire | H | 1421 | 75 % | 6 % | 7 % | 13 % | 80 % |
| Le Bondon | H | 961 | 76 % | 8 % | 6 % | 16 % | 86 % |
| Beaupré-La Lande Le Hesqueno-Grasdor | H | 2077 | 76 % | 6 % | 8 % | 8 % | 90 % |
| Tohannic | H | 1229 | 76 % | 9 % | 6 % | 9 % | 96 % |
| Cliscouët | H | 495 | 76 % | 4 % | 5 % | 22 % | 61 % |
| Ménimur 2 | H | 500 | 79 % | 4 % | 10 % | 27 % | 52 % |
| Ménimur 1 | H | 511 | 81 % | 2 % | 12 % | 34 % | 30 % |
| Zone Rurale Nord-Ouest | D | 663 | 83 % | 4 % | 4 % | 1 % | 96 % |
| Zone Rurale Nord-Est | D | 158 | 87 % | 3 % | 3 % | 6 % | 86 % |
| Zone d'Activités de Kerniol | A | 12 | 100 % | 0 % | 0 % | 0 % | 100 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Vannes | 86 % | 49 % | 56 % | 80 % | 76 % | 75 % | 62 % | 48 % | 88 % | 3 % | 8 % |
| Saint-Avé | 40 % | 14 % | 33 % | 40 % | 28 % | 33 % | 10 % | 17 % | 36 % | 25 % | 0 % |
| Séné | 54 % | 44 % | 29 % | 36 % | 32 % | 32 % | 4 % | 19 % | 30 % | 20 % | 0 % |
| Plescop | 46 % | 29 % | 27 % | 46 % | 34 % | 42 % | 0 % | 25 % | 0 % | 34 % | 0 % |

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

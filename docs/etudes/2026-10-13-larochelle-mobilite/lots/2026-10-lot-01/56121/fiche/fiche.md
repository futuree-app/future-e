# Fiche mobilité · Lorient (56121)

Générée le 2026-10-14T14:25:06Z · jour de référence 2026-10-13 · voisines : Lanester, Ploemeur, Quéven, Larmor-Plage, Caudan

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.026, "bas": 0.021, "haut": 0.031, "lignes": 7128, "n_eff": 4222}, "marche": {"p": 0.109, "bas": 0.1, "haut": 0.119, "lignes": 7128, "n_eff": 4222}, "velo": {"p": 0.084, "bas": 0.076, "haut": 0.093, "lignes": 7128, "n_eff": 4222}, "deux_roues_mot": {"p": 0.01, "bas": 0.007, "haut": 0.013, "lignes": 7128, "n_eff": 4222}, "voiture": {"p": 0.667, "bas": 0.652, "haut": 0.681, "lignes": 7128, "n_eff": 4222}, "tc": {"p": 0.105, "bas": 0.096, "haut": 0.114, "lignes": 7128, "n_eff": 4222}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.6667) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.586, "bas": 0.571, "haut": 0.601, "lignes": 7128, "n_eff": 4222}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.561, "bas": 0.542, "haut": 0.581, "lignes": 4162, "n_eff": 2473}, "communes_voisines": {"p": 0.796, "bas": 0.767, "haut": 0.822, "lignes": 1383, "n_eff": 825}, "ailleurs": {"p": 0.816, "bas": 0.797, "haut": 0.834, "lignes": 2966, "n_eff": 1749}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Lanester, Ploemeur, Quéven, Larmor-Plage, Caudan

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.116, "bas": 0.106, "haut": 0.126, "lignes": 7128, "n_eff": 4222}, "actifs_menage_2_voitures_plus": {"p": 0.37, "bas": 0.355, "haut": 0.384, "lignes": 7128, "n_eff": 4222}, "menage_motorise_mais_pas_en_voiture": {"p": 0.275, "bas": 0.261, "haut": 0.29, "lignes": 6105, "n_eff": 3673}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.696, "bas": 0.675, "haut": 0.717, "lignes": 2932, "n_eff": 1828}, "velo": {"p": 0.112, "bas": 0.099, "haut": 0.128, "lignes": 2932, "n_eff": 1828}, "menage_sans_voiture": {"p": 0.023, "bas": 0.017, "haut": 0.031, "lignes": 2932, "n_eff": 1828}, "menage_2_voitures_plus": {"p": 0.515, "bas": 0.492, "haut": 0.538, "lignes": 2932, "n_eff": 1828}}, "locataires_prive": {"voiture": {"p": 0.643, "bas": 0.619, "haut": 0.667, "lignes": 2629, "n_eff": 1549}, "velo": {"p": 0.075, "bas": 0.063, "haut": 0.089, "lignes": 2629, "n_eff": 1549}, "menage_sans_voiture": {"p": 0.171, "bas": 0.153, "haut": 0.19, "lignes": 2629, "n_eff": 1549}, "menage_2_voitures_plus": {"p": 0.284, "bas": 0.262, "haut": 0.307, "lignes": 2629, "n_eff": 1549}}, "locataires_hlm": {"voiture": {"p": 0.654, "bas": 0.62, "haut": 0.686, "lignes": 1419, "n_eff": 777}, "velo": {"p": 0.032, "bas": 0.022, "haut": 0.047, "lignes": 1419, "n_eff": 777}, "menage_sans_voiture": {"p": 0.241, "bas": 0.212, "haut": 0.272, "lignes": 1419, "n_eff": 777}, "menage_2_voitures_plus": {"p": 0.175, "bas": 0.15, "haut": 0.203, "lignes": 1419, "n_eff": 777}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 36420, "habitent_la_commune": {"part_des_emplois": 0.366, "voiture": {"p": 0.561, "bas": 0.542, "haut": 0.581, "lignes": 4162, "n_eff": 2473}, "tc": {"p": 0.097, "bas": 0.086, "haut": 0.109, "lignes": 4162, "n_eff": 2473}}, "reste_unite_urbaine": {"part_des_emplois": 0.216, "voiture": {"p": 0.817, "bas": 0.795, "haut": 0.837, "lignes": 2186, "n_eff": 1298}, "tc": {"p": 0.065, "bas": 0.053, "haut": 0.08, "lignes": 2186, "n_eff": 1298}}, "hors_unite_urbaine": {"part_des_emplois": 0.418, "voiture": {"p": 0.895, "bas": 0.881, "haut": 0.907, "lignes": 3635, "n_eff": 2214}, "tc": {"p": 0.073, "bas": 0.063, "haut": 0.085, "lignes": 3635, "n_eff": 2214}}}`

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

**Valeur** : `{"min": 0.538, "iris_min": "Arsenal Maritime", "max": 0.784, "iris_max": "Lanveur Kerfichant", "iris_habitat": 23}`

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

**Valeur** : `{"iris": 0.667, "mobpro": 0.667}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.26, "menages_2_voitures_plus": 0.185, "menages_stationnement_reserve": 0.479}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.973, "grande_surface_500m": 0.865, "pharmacie_500m": 0.858, "medecin_generaliste_500m": 0.881, "ecole_elementaire_500m": 0.862, "college_1km": 0.8, "gare_2km": 0.724, "panier_quotidien_500m": 0.759, "bus_8h_7_9h": 0.935, "aucun_bus_7_9h": 0.025, "bus_4h_20_22h": 0.759}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260918', '20261231']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.293, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.559, "ecart": 0.734, "stations": 25}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.124, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.635, "ecart": 0.489, "stations": 22}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 30 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Lorient | 59 % | 56 % | 12 % | 10 % | 18 % | 4162 (ok) |
| Lanester | 6 % | 74 % | 8 % | 14 % | 3 % | 445 (ok) |
| Ploemeur | 5 % | 82 % | 6 % | 8 % | 2 % | 362 (ok) |
| Caudan | 4 % | 87 % | 4 % | 8 % | 0 % | 254 (ok) |
| Quéven | 2 % | 82 % | 8 % | 8 % | 1 % | 171 (ok) |
| Quimperlé | 2 % | 91 % | 1 % | 8 % | 0 % | 173 (ok) |
| Larmor-Plage | 2 % | 75 % | 8 % | 15 % | 2 % | 151 (ok) |
| Hennebont | 2 % | 89 % | 1 % | 9 % | 0 % | 135 (fragile) |
| Kervignac | 2 % | 87 % | 2 % | 9 % | 1 % | 137 (fragile) |
| Guidel | 2 % | 89 % | 0 % | 11 % | 0 % | 111 (fragile) |
| Vannes | 2 % | 66 % | 1 % | 32 % | 0 % | 108 (fragile) |
| Quimper | 1 % | 84 % | 0 % | 14 % | 2 % | 55 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Zone Portuaire | A | 247 | 51 % | 9 % | 7 % | 35 % | 22 % |
| Arsenal Maritime | H | 1094 | 54 % | 5 % | 11 % | 30 % | 44 % |
| Aristide Briand | H | 1238 | 55 % | 8 % | 8 % | 23 % | 36 % |
| Quai de Rohan | H | 582 | 56 % | 7 % | 14 % | 45 % | 20 % |
| L'Orientis | H | 1469 | 56 % | 9 % | 14 % | 33 % | 42 % |
| Paul Guieysse | H | 1455 | 61 % | 10 % | 12 % | 29 % | 34 % |
| Nouvelle Ville | H | 1332 | 62 % | 11 % | 9 % | 27 % | 45 % |
| Polygone | H | 749 | 64 % | 10 % | 12 % | 49 % | 35 % |
| Parc du Scorff | H | 527 | 64 % | 2 % | 26 % | 45 % | 23 % |
| Merville | H | 1290 | 65 % | 13 % | 8 % | 18 % | 50 % |
| Chant des Oiseaux | H | 1048 | 67 % | 15 % | 8 % | 19 % | 52 % |
| Dupuy de Lome | H | 860 | 68 % | 10 % | 7 % | 22 % | 46 % |
| Kervenanec Nord | H | 543 | 68 % | 6 % | 17 % | 39 % | 25 % |
| Kreisker | H | 724 | 70 % | 16 % | 3 % | 16 % | 65 % |
| Bourgneuf | H | 850 | 70 % | 5 % | 12 % | 28 % | 41 % |
| Étienne Dolet | H | 1105 | 72 % | 10 % | 10 % | 20 % | 51 % |
| Manio | H | 934 | 72 % | 4 % | 12 % | 16 % | 60 % |
| Hôpital Kerforn | H | 1494 | 72 % | 10 % | 6 % | 17 % | 72 % |
| Keryado | H | 886 | 72 % | 9 % | 10 % | 18 % | 58 % |
| Saint-Armel | H | 589 | 74 % | 3 % | 18 % | 35 % | 21 % |
| Kervenanec Sud | H | 486 | 74 % | 4 % | 12 % | 31 % | 33 % |
| Le Ter | H | 645 | 76 % | 10 % | 10 % | 13 % | 78 % |
| Kerletu | H | 692 | 77 % | 4 % | 10 % | 15 % | 72 % |
| Z.A. Nord-Ouest | A | 58 | 78 % | 0 % | 20 % | 9 % | 90 % |
| Lanveur Kerfichant | H | 1819 | 78 % | 4 % | 9 % | 23 % | 67 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lorient | 97 % | 86 % | 86 % | 88 % | 86 % | 80 % | 72 % | 76 % | 94 % | 2 % | 76 % |
| Lanester | 78 % | 32 % | 67 % | 66 % | 68 % | 83 % | 44 % | 51 % | 88 % | 4 % | 55 % |
| Ploemeur | 41 % | 22 % | 30 % | 30 % | 43 % | 51 % | 0 % | 20 % | 46 % | 22 % | 10 % |
| Quéven | 39 % | 30 % | 34 % | 30 % | 34 % | 28 % | 10 % | 25 % | 49 % | 26 % | 0 % |
| Larmor-Plage | 64 % | 7 % | 25 % | 56 % | 24 % | 2 % | 0 % | 15 % | 0 % | 19 % | 0 % |
| Caudan | 49 % | 2 % | 40 % | 37 % | 33 % | 50 % | 1 % | 27 % | 3 % | 34 % | 0 % |

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

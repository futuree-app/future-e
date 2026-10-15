# Fiche mobilité · Niort (79191)

Générée le 2026-10-13T10:41:34Z · jour de référence 2026-10-13 · voisines : Chauray, Aiffres, Bessines

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.026, "bas": 0.022, "haut": 0.031, "lignes": 8216, "n_eff": 4892}, "marche": {"p": 0.097, "bas": 0.089, "haut": 0.106, "lignes": 8216, "n_eff": 4892}, "velo": {"p": 0.071, "bas": 0.065, "haut": 0.079, "lignes": 8216, "n_eff": 4892}, "deux_roues_mot": {"p": 0.018, "bas": 0.015, "haut": 0.022, "lignes": 8216, "n_eff": 4892}, "voiture": {"p": 0.701, "bas": 0.688, "haut": 0.714, "lignes": 8216, "n_eff": 4892}, "tc": {"p": 0.086, "bas": 0.079, "haut": 0.094, "lignes": 8216, "n_eff": 4892}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.7011) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.749, "bas": 0.737, "haut": 0.761, "lignes": 8216, "n_eff": 4892}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.645, "bas": 0.63, "haut": 0.661, "lignes": 6148, "n_eff": 3660}, "communes_voisines": {"p": 0.845, "bas": 0.806, "haut": 0.877, "lignes": 674, "n_eff": 399}, "ailleurs": {"p": 0.867, "bas": 0.847, "haut": 0.885, "lignes": 2068, "n_eff": 1232}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Chauray, Aiffres, Bessines

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.086, "bas": 0.078, "haut": 0.094, "lignes": 8216, "n_eff": 4892}, "actifs_menage_2_voitures_plus": {"p": 0.448, "bas": 0.435, "haut": 0.462, "lignes": 8216, "n_eff": 4892}, "menage_motorise_mais_pas_en_voiture": {"p": 0.249, "bas": 0.237, "haut": 0.262, "lignes": 7440, "n_eff": 4435}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.739, "bas": 0.721, "haut": 0.756, "lignes": 4099, "n_eff": 2492}, "velo": {"p": 0.094, "bas": 0.084, "haut": 0.106, "lignes": 4099, "n_eff": 2492}, "menage_sans_voiture": {"p": 0.018, "bas": 0.014, "haut": 0.024, "lignes": 4099, "n_eff": 2492}, "menage_2_voitures_plus": {"p": 0.611, "bas": 0.591, "haut": 0.63, "lignes": 4099, "n_eff": 2492}}, "locataires_prive": {"voiture": {"p": 0.677, "bas": 0.654, "haut": 0.698, "lignes": 2968, "n_eff": 1715}, "velo": {"p": 0.049, "bas": 0.039, "haut": 0.06, "lignes": 2968, "n_eff": 1715}, "menage_sans_voiture": {"p": 0.152, "bas": 0.135, "haut": 0.169, "lignes": 2968, "n_eff": 1715}, "menage_2_voitures_plus": {"p": 0.296, "bas": 0.275, "haut": 0.318, "lignes": 2968, "n_eff": 1715}}, "locataires_hlm": {"voiture": {"p": 0.635, "bas": 0.597, "haut": 0.673, "lignes": 1004, "n_eff": 612}, "velo": {"p": 0.045, "bas": 0.031, "haut": 0.065, "lignes": 1004, "n_eff": 612}, "menage_sans_voiture": {"p": 0.196, "bas": 0.166, "haut": 0.229, "lignes": 1004, "n_eff": 612}, "menage_2_voitures_plus": {"p": 0.227, "bas": 0.195, "haut": 0.262, "lignes": 1004, "n_eff": 612}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 48308, "habitent_la_commune": {"part_des_emplois": 0.401, "voiture": {"p": 0.645, "bas": 0.63, "haut": 0.661, "lignes": 6148, "n_eff": 3660}, "tc": {"p": 0.086, "bas": 0.077, "haut": 0.095, "lignes": 6148, "n_eff": 3660}}, "reste_unite_urbaine": {"part_des_emplois": 0.067, "voiture": {"p": 0.937, "bas": 0.91, "haut": 0.956, "lignes": 638, "n_eff": 425}, "tc": {"p": 0.028, "bas": 0.016, "haut": 0.049, "lignes": 638, "n_eff": 425}}, "hors_unite_urbaine": {"part_des_emplois": 0.532, "voiture": {"p": 0.944, "bas": 0.936, "haut": 0.951, "lignes": 5337, "n_eff": 3474}, "tc": {"p": 0.036, "bas": 0.03, "haut": 0.043, "lignes": 5337, "n_eff": 3474}}}`

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

**Valeur** : `{"min": 0.489, "iris_min": "Centre", "max": 0.865, "iris_max": "Surimeau-Antes Cholette", "iris_habitat": 22}`

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

**Valeur** : `{"iris": 0.701, "mobpro": 0.701}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.19, "menages_2_voitures_plus": 0.266, "menages_stationnement_reserve": 0.648}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.75, "grande_surface_500m": 0.381, "pharmacie_500m": 0.583, "medecin_generaliste_500m": 0.617, "ecole_elementaire_500m": 0.661, "college_1km": 0.834, "gare_2km": 0.631, "panier_quotidien_500m": 0.448, "bus_8h_7_9h": 0.746, "aucun_bus_7_9h": 0.03, "bus_4h_20_22h": 0.089}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20261003', '20270703']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.328, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.559, "ecart": 0.769, "stations": 19}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.144, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.628, "ecart": 0.516, "stations": 14}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 21 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Niort | 75 % | 64 % | 9 % | 9 % | 13 % | 6148 (ok) |
| Chauray | 6 % | 85 % | 2 % | 10 % | 0 % | 538 (ok) |
| La Crèche | 2 % | 94 % | 2 % | 4 % | 1 % | 151 (ok) |
| Bessines | 1 % | 89 % | 3 % | 7 % | 0 % | 85 (fragile) |
| Échiré | 1 % | 95 % | 0 % | 4 % | 1 % | 79 (fragile) |
| Prahecq | 1 % | 90 % | 4 % | 4 % | 0 % | 52 (fragile) |
| Saint-Maixent-l'École | 1 % | 95 % | 0 % | 5 % | 0 % | 66 (fragile) |
| La Rochelle | 1 % | 75 % | 0 % | 20 % | 2 % | 51 (fragile) |
| Aiffres | 1 % | 67 % | 6 % | 14 % | 4 % | 51 (fragile) |
| Melle | 1 % | 97 % | 0 % | 3 % | 0 % | 46 (fragile) |
| Poitiers | 1 % | 49 % | 3 % | 39 % | 1 % | 44 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Centre | H | 2303 | 49 % | 10 % | 15 % | 38 % | 30 % |
| Clou Bouchet Nord | H | 490 | 52 % | 10 % | 19 % | 37 % | 33 % |
| Hôpital | H | 802 | 54 % | 8 % | 10 % | 28 % | 51 % |
| Gare | H | 1193 | 54 % | 6 % | 14 % | 33 % | 43 % |
| Clou Bouchet Sud | H | 528 | 54 % | 6 % | 21 % | 43 % | 14 % |
| Sud Ribray | H | 1604 | 63 % | 8 % | 8 % | 14 % | 66 % |
| Nord Partie Inférieure | H | 1098 | 64 % | 9 % | 7 % | 25 % | 59 % |
| Boucle Sèvre | H | 1578 | 65 % | 10 % | 8 % | 22 % | 69 % |
| Zone d'Activités Technopole | A | 61 | 67 % | 14 % | 0 % | 0 % | 90 % |
| Nord Partie Supérieure | H | 1203 | 68 % | 8 % | 13 % | 26 % | 56 % |
| Four Chabot Gavacherie | H | 590 | 69 % | 5 % | 16 % | 38 % | 43 % |
| Venise Verte | H | 829 | 72 % | 7 % | 9 % | 13 % | 72 % |
| Champclairot | H | 1335 | 72 % | 9 % | 8 % | 12 % | 73 % |
| Saint-Florent | H | 1153 | 73 % | 9 % | 5 % | 10 % | 85 % |
| Champommier | H | 2191 | 77 % | 6 % | 6 % | 9 % | 78 % |
| Justices-Brizeaux | H | 985 | 78 % | 5 % | 7 % | 8 % | 76 % |
| Goise | H | 900 | 79 % | 7 % | 5 % | 17 % | 81 % |
| Moulin à Vent-Souche | H | 838 | 80 % | 5 % | 9 % | 6 % | 85 % |
| Baticoop | H | 1103 | 80 % | 6 % | 4 % | 16 % | 76 % |
| Sainte-Pezenne | H | 1142 | 81 % | 5 % | 6 % | 7 % | 76 % |
| Coteau Saint-Hubert | H | 1355 | 82 % | 5 % | 4 % | 7 % | 86 % |
| Zone d'Activités de Souche | A | 117 | 84 % | 0 % | 6 % | 3 % | 84 % |
| Zone d'Activités de Saint-Florent | A | 36 | 86 % | 14 % | 0 % | 9 % | 91 % |
| Saint-Liguaire-Nantes | H | 1136 | 86 % | 6 % | 5 % | 3 % | 86 % |
| Surimeau-Antes Cholette | H | 1215 | 86 % | 4 % | 5 % | 7 % | 86 % |
| Zone d'Activités de Saint-Liguaire | A | 79 | 89 % | 5 % | 0 % | 10 % | 91 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Niort | 75 % | 38 % | 58 % | 62 % | 66 % | 83 % | 63 % | 45 % | 75 % | 3 % | 9 % |
| Chauray | 48 % | 23 % | 20 % | 15 % | 38 % | 19 % | 0 % | 14 % | 33 % | 10 % | 0 % |
| Aiffres | 39 % | 12 % | 44 % | 28 % | 24 % | 0 % | 0 % | 3 % | 0 % | 26 % | 0 % |
| Bessines | 48 % | 8 % | 0 % | 30 % | 25 % | 0 % | 0 % | 0 % | 7 % | 18 % | 0 % |

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
- `tdg_gtfs.json` : https://transport.data.gouv.fr/api/datasets?format=GTFS · 2026-10-13T10:37:55Z · sha256 fc928177566b8b04
- `gtfs_241700434.zip` : https://www.data.gouv.fr/api/1/datasets/r/030b9c31-4237-4355-a4d5-842861d225be · 2026-10-13T10:37:55Z · sha256 c41f147daf055a7c
- `carbu_2025.zip` : https://donnees.roulez-eco.fr/opendata/annee/2025 · 2026-10-13T10:37:55Z · sha256 383379223bd43f9d
- `carbu_2026.zip` : https://donnees.roulez-eco.fr/opendata/annee/2026 · 2026-10-13T10:37:55Z · sha256 cd999b23896161f8
- `ban_79.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-79.csv.gz · 2026-10-13T10:41:34Z · sha256 ff6ecc121929977a
- `iris_ign_79191.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79191' · 2026-10-13T10:41:34Z · sha256 55b859fc4e546a85
- `iris_ign_79081.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79081' · 2026-10-13T10:41:34Z · sha256 a52920954275acd4
- `iris_ign_79003.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79003' · 2026-10-13T10:41:34Z · sha256 bb700dceb0a69ec9
- `iris_ign_79034.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='79034' · 2026-10-13T10:41:34Z · sha256 f184de5fef490730
- `gtfs_200041317.zip` : https://www.data.gouv.fr/api/1/datasets/r/d724a6df-7dc4-4b2d-be15-fc8b1d52c8ea · 2026-10-13T10:41:34Z · sha256 013b37f32e814db0

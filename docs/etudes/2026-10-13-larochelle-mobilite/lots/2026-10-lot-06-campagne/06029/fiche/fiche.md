# Fiche mobilité · Cannes (06029)

Générée le 2026-10-15T16:29:53Z · jour de référence 2026-10-13 · voisines : Nice, Antibes, Cagnes-sur-Mer, Grasse, Le Cannet, Saint-Laurent-du-Var

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.057, "bas": 0.051, "haut": 0.064, "lignes": 8704, "n_eff": 4902}, "marche": {"p": 0.137, "bas": 0.128, "haut": 0.147, "lignes": 8704, "n_eff": 4902}, "velo": {"p": 0.028, "bas": 0.023, "haut": 0.033, "lignes": 8704, "n_eff": 4902}, "deux_roues_mot": {"p": 0.069, "bas": 0.062, "haut": 0.076, "lignes": 8704, "n_eff": 4902}, "voiture": {"p": 0.558, "bas": 0.545, "haut": 0.572, "lignes": 8704, "n_eff": 4902}, "tc": {"p": 0.151, "bas": 0.141, "haut": 0.161, "lignes": 8704, "n_eff": 4902}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5584) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.642, "bas": 0.628, "haut": 0.655, "lignes": 8704, "n_eff": 4902}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.456, "bas": 0.439, "haut": 0.474, "lignes": 5589, "n_eff": 3137}, "communes_voisines": {"p": 0.733, "bas": 0.7, "haut": 0.763, "lignes": 1347, "n_eff": 761}, "ailleurs": {"p": 0.741, "bas": 0.72, "haut": 0.761, "lignes": 3115, "n_eff": 1765}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Nice, Antibes, Cagnes-sur-Mer, Grasse, Le Cannet, Saint-Laurent-du-Var

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.157, "bas": 0.147, "haut": 0.167, "lignes": 8704, "n_eff": 4902}, "actifs_menage_2_voitures_plus": {"p": 0.299, "bas": 0.287, "haut": 0.312, "lignes": 8704, "n_eff": 4902}, "menage_motorise_mais_pas_en_voiture": {"p": 0.359, "bas": 0.345, "haut": 0.374, "lignes": 7022, "n_eff": 4022}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.623, "bas": 0.601, "haut": 0.645, "lignes": 3142, "n_eff": 1859}, "velo": {"p": 0.025, "bas": 0.019, "haut": 0.033, "lignes": 3142, "n_eff": 1859}, "menage_sans_voiture": {"p": 0.071, "bas": 0.06, "haut": 0.084, "lignes": 3142, "n_eff": 1859}, "menage_2_voitures_plus": {"p": 0.432, "bas": 0.409, "haut": 0.454, "lignes": 3142, "n_eff": 1859}}, "locataires_prive": {"voiture": {"p": 0.51, "bas": 0.487, "haut": 0.533, "lignes": 3331, "n_eff": 1839}, "velo": {"p": 0.018, "bas": 0.013, "haut": 0.025, "lignes": 3331, "n_eff": 1839}, "menage_sans_voiture": {"p": 0.244, "bas": 0.225, "haut": 0.264, "lignes": 3331, "n_eff": 1839}, "menage_2_voitures_plus": {"p": 0.189, "bas": 0.172, "haut": 0.208, "lignes": 3331, "n_eff": 1839}}, "locataires_hlm": {"voiture": {"p": 0.596, "bas": 0.565, "haut": 0.627, "lignes": 1671, "n_eff": 946}, "velo": {"p": 0.018, "bas": 0.011, "haut": 0.028, "lignes": 1671, "n_eff": 946}, "menage_sans_voiture": {"p": 0.179, "bas": 0.156, "haut": 0.205, "lignes": 1671, "n_eff": 946}, "menage_2_voitures_plus": {"p": 0.283, "bas": 0.255, "haut": 0.312, "lignes": 1671, "n_eff": 946}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 38952, "habitent_la_commune": {"part_des_emplois": 0.445, "voiture": {"p": 0.456, "bas": 0.439, "haut": 0.474, "lignes": 5589, "n_eff": 3137}, "tc": {"p": 0.147, "bas": 0.135, "haut": 0.159, "lignes": 5589, "n_eff": 3137}}, "reste_unite_urbaine": {"part_des_emplois": 0.462, "voiture": {"p": 0.737, "bas": 0.721, "haut": 0.752, "lignes": 5249, "n_eff": 3032}, "tc": {"p": 0.131, "bas": 0.119, "haut": 0.143, "lignes": 5249, "n_eff": 3032}}, "hors_unite_urbaine": {"part_des_emplois": 0.094, "voiture": {"p": 0.855, "bas": 0.822, "haut": 0.882, "lignes": 885, "n_eff": 533}, "tc": {"p": 0.1, "bas": 0.078, "haut": 0.129, "lignes": 885, "n_eff": 533}}}`

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

**Valeur** : `{"min": 0.257, "iris_min": "Gare", "max": 0.748, "iris_max": "Pont d'Avril-L'Abadie", "iris_habitat": 30}`

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

**Valeur** : `{"iris": 0.558, "mobpro": 0.558}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.282, "menages_2_voitures_plus": 0.164, "menages_stationnement_reserve": 0.612}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.909, "grande_surface_500m": 0.629, "pharmacie_500m": 0.831, "medecin_generaliste_500m": 0.808, "ecole_elementaire_500m": 0.735, "college_1km": 0.872, "gare_2km": 0.942, "panier_quotidien_500m": 0.689, "bus_8h_7_9h": 0.803, "aucun_bus_7_9h": 0.017, "bus_4h_20_22h": 0.679}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.1%
- Jour de référence 2026-10-13 dans la validité GTFS None

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.334, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.602, "ecart": 0.732, "stations": 43}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.179, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.651, "ecart": 0.528, "stations": 38}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 51 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Cannes | 64 % | 46 % | 4 % | 15 % | 20 % | 5589 (ok) |
| Le Cannet | 5 % | 72 % | 1 % | 13 % | 6 % | 388 (ok) |
| Mougins | 4 % | 78 % | 1 % | 10 % | 1 % | 323 (ok) |
| Antibes | 4 % | 74 % | 1 % | 15 % | 2 % | 331 (ok) |
| Nice | 4 % | 69 % | 0 % | 25 % | 0 % | 307 (ok) |
| Mandelieu-la-Napoule | 3 % | 73 % | 3 % | 15 % | 3 % | 267 (ok) |
| Grasse | 3 % | 83 % | 0 % | 11 % | 0 % | 235 (ok) |
| Valbonne | 2 % | 83 % | 2 % | 10 % | 2 % | 170 (ok) |
| Biot | 1 % | 85 % | 1 % | 10 % | 0 % | 106 (fragile) |
| Mouans-Sartoux | 1 % | 85 % | 0 % | 10 % | 1 % | 112 (fragile) |
| Vallauris | 1 % | 88 % | 1 % | 7 % | 0 % | 107 (fragile) |
| 99999 | 1 % | 44 % | 2 % | 46 % | 0 % | 70 (fragile) |
| Cagnes-sur-Mer | 1 % | 67 % | 0 % | 24 % | 2 % | 47 (fragile) |
| Pégomas | 1 % | 82 % | 5 % | 5 % | 0 % | 67 (fragile) |
| Villeneuve-Loubet | 1 % | 69 % | 1 % | 16 % | 0 % | 53 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Gare | H | 294 | 26 % | 0 % | 14 % | 51 % | 34 % |
| Croisette-Palm-Beach | H | 218 | 27 % | 0 % | 6 % | 41 % | 48 % |
| Le Vieux Port-Les îles | H | 482 | 29 % | 2 % | 14 % | 52 % | 23 % |
| Saint-Nicolas | H | 1320 | 30 % | 1 % | 17 % | 48 % | 38 % |
| Tassigny | H | 777 | 37 % | 29 % | 4 % | 31 % | 47 % |
| Carnot | H | 1019 | 38 % | 2 % | 17 % | 38 % | 40 % |
| Stanislas | H | 406 | 43 % | 1 % | 20 % | 46 % | 31 % |
| La Peyrière | H | 702 | 44 % | 1 % | 15 % | 31 % | 55 % |
| Vallergues | H | 743 | 46 % | 1 % | 10 % | 26 % | 52 % |
| Petit Juas | H | 723 | 49 % | 0 % | 14 % | 36 % | 54 % |
| Le Riou | H | 568 | 51 % | 3 % | 10 % | 30 % | 50 % |
| Bocca Centre | H | 935 | 52 % | 1 % | 25 % | 39 % | 48 % |
| La Californie | H | 1029 | 52 % | 3 % | 8 % | 20 % | 76 % |
| Camp Long | H | 1012 | 53 % | 2 % | 13 % | 29 % | 67 % |
| Le Grand Jas | H | 874 | 54 % | 1 % | 20 % | 31 % | 62 % |
| Moure Rouge | H | 680 | 54 % | 4 % | 12 % | 26 % | 65 % |
| Terrefial | H | 578 | 54 % | 2 % | 7 % | 18 % | 83 % |
| Montfleury | H | 741 | 55 % | 3 % | 9 % | 30 % | 66 % |
| La Source | H | 865 | 55 % | 1 % | 8 % | 31 % | 63 % |
| Colline des Puits | H | 605 | 57 % | 1 % | 31 % | 35 % | 66 % |
| Saint-Joseph | H | 2078 | 62 % | 3 % | 20 % | 28 % | 60 % |
| Le Plan | H | 915 | 63 % | 3 % | 27 % | 31 % | 56 % |
| Saint-Cassien-Bastide Rouge | A | 250 | 63 % | 0 % | 16 % | 13 % | 73 % |
| Ranguin | H | 1680 | 64 % | 1 % | 24 % | 24 % | 59 % |
| Pierre Longue | H | 648 | 64 % | 3 % | 10 % | 12 % | 77 % |
| Les Mûriers | H | 1083 | 64 % | 2 % | 17 % | 29 % | 74 % |
| Broussailles | H | 928 | 66 % | 2 % | 10 % | 19 % | 70 % |
| Croix des Gardes | H | 1471 | 70 % | 2 % | 12 % | 11 % | 82 % |
| Le Grand Saule | H | 1002 | 70 % | 2 % | 17 % | 24 % | 62 % |
| Font de Veyre | H | 949 | 74 % | 2 % | 11 % | 13 % | 78 % |
| Pont d'Avril-L'Abadie | H | 1421 | 75 % | 3 % | 9 % | 10 % | 88 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cannes | 91 % | 63 % | 83 % | 81 % | 74 % | 87 % | 94 % | 69 % | 80 % | 2 % | 68 % |
| Nice | 95 % | 75 % | 89 % | 91 % | 91 % | 90 % | 94 % | 85 % | 0 % | 100 % | 0 % |
| Antibes | 88 % | 59 % | 80 % | 77 % | 64 % | 83 % | 82 % | 57 % | 0 % | 100 % | 0 % |
| Cagnes-sur-Mer | 88 % | 48 % | 77 % | 81 % | 69 % | 86 % | 91 % | 58 % | 0 % | 100 % | 0 % |
| Grasse | 73 % | 29 % | 58 % | 60 % | 58 % | 68 % | 70 % | 46 % | 0 % | 100 % | 0 % |
| Le Cannet | 94 % | 52 % | 89 % | 86 % | 71 % | 88 % | 44 % | 63 % | 88 % | 0 % | 66 % |
| Saint-Laurent-du-Var | 90 % | 45 % | 65 % | 86 % | 72 % | 88 % | 77 % | 51 % | 0 % | 100 % | 0 % |

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
- `tdg_gtfs.json` : https://transport.data.gouv.fr/api/datasets?format=GTFS · 2026-10-15T15:55:06Z · sha256 a6799f175d725bda
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
- `geo_29232.json` : https://geo.api.gouv.fr/communes/29232?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T11:37:13Z · sha256 9825acb507397d48
- `iris_ign_29232.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29232' · 2026-10-15T11:37:33Z · sha256 6cf7414884e4d044
- `iris_ign_29051.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29051' · 2026-10-15T11:37:33Z · sha256 db46c2bd2d9b3391
- `iris_ign_29216.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='29216' · 2026-10-15T11:37:33Z · sha256 b9b43c58e77a471f
- `gtfs_200068120.zip` : https://www.data.gouv.fr/api/1/datasets/r/95530333-7002-401d-9d64-2829496d1c36 · 2026-10-15T11:37:38Z · sha256 8382973a625a53be
- `geo_80021.json` : https://geo.api.gouv.fr/communes/80021?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T11:37:59Z · sha256 5e642d026ba325ca
- `ban_80.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-80.csv.gz · 2026-10-15T11:38:18Z · sha256 6c3cd634ffec3728
- `iris_ign_80021.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80021' · 2026-10-15T11:38:21Z · sha256 73f6afa97aa50da6
- `iris_ign_80489.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80489' · 2026-10-15T11:38:22Z · sha256 7cb0dc96ad1e32da
- `iris_ign_80164.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80164' · 2026-10-15T11:38:24Z · sha256 7571495909d53e68
- `iris_ign_80725.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80725' · 2026-10-15T11:38:24Z · sha256 814220ea354a5091
- `iris_ign_80674.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80674' · 2026-10-15T11:38:25Z · sha256 778b565bbaf0c9ed
- `iris_ign_80131.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80131' · 2026-10-15T11:38:25Z · sha256 984f007c7403db03
- `iris_ign_80724.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='80724' · 2026-10-15T11:38:25Z · sha256 d0021f2290008913
- `gtfs_248000531.zip` : https://www.data.gouv.fr/api/1/datasets/r/571e3014-066d-4bd6-9f73-fb8065c928c6 · 2026-10-15T11:38:29Z · sha256 b03244c717b740a2
- `geo_25056.json` : https://geo.api.gouv.fr/communes/25056?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T11:38:45Z · sha256 ff2a5841579e1d1d
- `ban_25.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-25.csv.gz · 2026-10-15T11:38:55Z · sha256 4dfc95070f9f691e
- `iris_ign_25056.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25056' · 2026-10-15T11:38:56Z · sha256 d105b946f411ac72
- `iris_ign_25560.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25560' · 2026-10-15T11:38:57Z · sha256 03ed13ce9e0f34ad
- `iris_ign_25212.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25212' · 2026-10-15T11:38:57Z · sha256 c0706ece4539db62
- `iris_ign_25381.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25381' · 2026-10-15T11:38:57Z · sha256 9028cc7c6eee77da
- `iris_ign_25036.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25036' · 2026-10-15T11:38:59Z · sha256 a9ac20d8064c3c21
- `iris_ign_25454.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25454' · 2026-10-15T11:39:01Z · sha256 3b58d491cc9b5384
- `iris_ign_25133.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='25133' · 2026-10-15T11:39:01Z · sha256 a76736c89845a784
- `gtfs_242500361.zip` : https://www.data.gouv.fr/api/1/datasets/r/e18e0aeb-8805-47fd-bcdb-c226d21c96fe · 2026-10-15T11:39:03Z · sha256 1735dbb10ab18d78
- `geo_26362.json` : https://geo.api.gouv.fr/communes/26362?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T11:39:16Z · sha256 37030ab833a5fa93
- `ban_26.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-26.csv.gz · 2026-10-15T11:39:27Z · sha256 b0d38b6284d4b8b5
- `iris_ign_26362.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='26362' · 2026-10-15T11:39:29Z · sha256 67fdbd6cf973f1a4
- `iris_ign_26058.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='26058' · 2026-10-15T11:39:29Z · sha256 51eaa1b908643457
- `iris_ign_07102.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='07102' · 2026-10-15T11:39:29Z · sha256 92b06c2db2a780be
- `iris_ign_26252.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='26252' · 2026-10-15T11:39:30Z · sha256 07d353e31bd96a64
- `iris_ign_07281.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='07281' · 2026-10-15T11:39:30Z · sha256 858dbe1c10fac8b3
- `iris_ign_26313.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='26313' · 2026-10-15T11:39:30Z · sha256 b8a5894560ad751e
- `iris_ign_26124.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='26124' · 2026-10-15T11:39:30Z · sha256 41094e1c373525fa
- `gtfs_200068781.zip` : https://www.data.gouv.fr/api/1/datasets/r/46bf6b5c-68c1-4198-a982-caeee88540a3 · 2026-10-15T11:39:33Z · sha256 5984a709d7cf6ad9
- `geo_64445.json` : https://geo.api.gouv.fr/communes/64445?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T11:39:43Z · sha256 17d65e3d3000787b
- `ban_64.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-64.csv.gz · 2026-10-15T11:39:54Z · sha256 97b6db4150702e8c
- `iris_ign_64445.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64445' · 2026-10-15T11:39:56Z · sha256 b8b5acc03bb8036f
- `iris_ign_64348.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64348' · 2026-10-15T11:39:56Z · sha256 c5a943d595f7d992
- `iris_ign_64129.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64129' · 2026-10-15T11:39:56Z · sha256 a894cc30770853c9
- `iris_ign_64335.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64335' · 2026-10-15T11:39:56Z · sha256 a6800a02d6b0f029
- `iris_ign_64284.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64284' · 2026-10-15T11:39:57Z · sha256 c13b73bd4107ef9d
- `iris_ign_64230.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64230' · 2026-10-15T11:39:57Z · sha256 cbb6fde92c37b33a
- `iris_ign_64269.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='64269' · 2026-10-15T11:39:57Z · sha256 e3fc3bba13653186
- `gtfs_200067254.zip` : https://www.data.gouv.fr/api/1/datasets/r/25c5caff-fb19-4358-bb83-7f18d320bea8 · 2026-10-15T11:40:12Z · sha256 2ccaaf8c75a3e434
- `geo_31555.json` : https://geo.api.gouv.fr/communes/31555?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T15:54:34Z · sha256 c9f27fbce47bae56
- `ban_31.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-31.csv.gz · 2026-10-15T15:54:47Z · sha256 ef7b9278a965a59b
- `iris_ign_31555.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31555' · 2026-10-15T15:54:51Z · sha256 712e3bd7ed53297e
- `iris_ign_31149.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31149' · 2026-10-15T15:54:52Z · sha256 36318c46c08b43fa
- `iris_ign_31557.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31557' · 2026-10-15T15:54:52Z · sha256 e93668de26e0d566
- `iris_ign_31069.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31069' · 2026-10-15T15:54:53Z · sha256 d392ff31584eb2ef
- `iris_ign_31395.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31395' · 2026-10-15T15:54:54Z · sha256 0b5c0df1fe7ba365
- `iris_ign_31157.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31157' · 2026-10-15T15:54:54Z · sha256 4f7350b9fe111182
- `iris_ign_31424.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='31424' · 2026-10-15T15:54:54Z · sha256 7920785de7755251
- `gtfs_243100518.zip` : https://www.data.gouv.fr/api/1/datasets/r/64318177-f5b5-4144-a6be-2d0f22d26c77 · 2026-10-15T15:55:09Z · sha256 e50e70ecc3653c1b
- `geo_06088.json` : https://geo.api.gouv.fr/communes/06088?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T15:55:29Z · sha256 549abbb00597da2c
- `ban_06.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-06.csv.gz · 2026-10-15T15:55:44Z · sha256 3f7933291a446d0b
- `iris_ign_06088.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06088' · 2026-10-15T15:55:45Z · sha256 061096e12ca52e45
- `iris_ign_06004.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06004' · 2026-10-15T15:55:46Z · sha256 28df8a1d0efbe215
- `iris_ign_06029.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06029' · 2026-10-15T15:55:47Z · sha256 02148d27603a004e
- `iris_ign_06027.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06027' · 2026-10-15T15:55:47Z · sha256 cee6eae6af15932e
- `iris_ign_06069.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06069' · 2026-10-15T15:55:48Z · sha256 29af657cb9ca1d56
- `iris_ign_06030.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06030' · 2026-10-15T15:55:48Z · sha256 fe38d069d1dd86fd
- `iris_ign_06123.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='06123' · 2026-10-15T15:55:48Z · sha256 69944ed3baf4f4ab
- `gtfs_200030195.zip` : https://www.data.gouv.fr/api/1/datasets/r/f5678ab2-c863-4b48-ba1f-9021c7d97634 · 2026-10-15T15:55:59Z · sha256 7f1dc2c6d387d6fc
- `geo_44109.json` : https://geo.api.gouv.fr/communes/44109?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T15:56:27Z · sha256 c6ce2f341b078857
- `iris_ign_44109.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44109' · 2026-10-15T15:56:46Z · sha256 607fa5d368b399f0
- `iris_ign_44162.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44162' · 2026-10-15T15:56:46Z · sha256 84ef44a76a2b97ea
- `iris_ign_44143.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44143' · 2026-10-15T15:56:46Z · sha256 bb38f0770be093c9
- `iris_ign_44190.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44190' · 2026-10-15T15:56:46Z · sha256 15a0f135cf4bf11a
- `iris_ign_44114.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44114' · 2026-10-15T15:56:47Z · sha256 d27f418702560bcb
- `iris_ign_44215.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44215' · 2026-10-15T15:56:47Z · sha256 e12684729dc39e22
- `iris_ign_44047.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='44047' · 2026-10-15T15:56:47Z · sha256 abb635d860d0b7d4
- `gtfs_244400404.zip` : https://www.data.gouv.fr/api/1/datasets/r/65bdd7e4-a8e7-4a54-893a-808e71c34d68 · 2026-10-15T15:57:02Z · sha256 8d3e62a96ccd3da1
- `geo_34172.json` : https://geo.api.gouv.fr/communes/34172?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T15:57:47Z · sha256 919ffaadf91d8685
- `ban_34.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-34.csv.gz · 2026-10-15T15:58:26Z · sha256 e857eaadba824be1
- `iris_ign_34172.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34172' · 2026-10-15T15:58:32Z · sha256 0feb473021a07928
- `iris_ign_34057.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34057' · 2026-10-15T15:58:32Z · sha256 0f3a32cc5b848762
- `iris_ign_34129.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34129' · 2026-10-15T15:58:33Z · sha256 c44d639ac2cccda0
- `iris_ign_34123.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34123' · 2026-10-15T15:58:34Z · sha256 77e800ffad6329bb
- `iris_ign_34270.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34270' · 2026-10-15T15:58:34Z · sha256 e63eaca76d2eff63
- `iris_ign_34255.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34255' · 2026-10-15T15:58:34Z · sha256 9823b950e8c04be2
- `iris_ign_34337.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34337' · 2026-10-15T15:58:35Z · sha256 8de1ef8349dc2776
- `gtfs_243400017.zip` : https://www.data.gouv.fr/api/1/datasets/r/93a29ce2-cfc8-44ff-b712-bcfd814b7f00 · 2026-10-15T15:58:49Z · sha256 1d0357c344e4b498
- `geo_67482.json` : https://geo.api.gouv.fr/communes/67482?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T15:59:27Z · sha256 30a8e15d46a5380c
- `ban_67.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-67.csv.gz · 2026-10-15T15:59:52Z · sha256 c8231dcfa2463c59
- `iris_ign_67482.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67482' · 2026-10-15T15:59:56Z · sha256 0686a971a9b55f8e
- `iris_ign_67447.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67447' · 2026-10-15T15:59:56Z · sha256 07fa563647b3cd09
- `iris_ign_67218.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67218' · 2026-10-15T15:59:57Z · sha256 ec529b4b5e888e47
- `iris_ign_67267.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67267' · 2026-10-15T15:59:57Z · sha256 2928dfaec3d50b12
- `iris_ign_67043.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67043' · 2026-10-15T15:59:57Z · sha256 889d02bfedd2ddb2
- `iris_ign_67365.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67365' · 2026-10-15T15:59:57Z · sha256 5f503818801e3c44
- `iris_ign_67204.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='67204' · 2026-10-15T15:59:58Z · sha256 4044557ae854c0a9
- `gtfs_246700488.zip` : https://www.data.gouv.fr/api/1/datasets/r/eeea9e52-4f8a-459e-aef5-a093a3b05356 · 2026-10-15T16:00:06Z · sha256 eb6b17685febafdd
- `geo_33063.json` : https://geo.api.gouv.fr/communes/33063?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:00:26Z · sha256 37e582183139768b
- `ban_33.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-33.csv.gz · 2026-10-15T16:00:44Z · sha256 545b0a7c2f102e5e
- `iris_ign_33063.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33063' · 2026-10-15T16:00:47Z · sha256 678ccab58d34790e
- `iris_ign_33281.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33281' · 2026-10-15T16:00:48Z · sha256 16fb9a96a0588df1
- `iris_ign_33318.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33318' · 2026-10-15T16:00:48Z · sha256 8d9b2c2d3214bf0b
- `iris_ign_33522.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33522' · 2026-10-15T16:00:55Z · sha256 6333760448dc15db
- `iris_ign_33550.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33550' · 2026-10-15T16:00:56Z · sha256 6ba465dc98f50997
- `iris_ign_33449.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33449' · 2026-10-15T16:00:56Z · sha256 717d4d8caf1e90da
- `iris_ign_33039.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='33039' · 2026-10-15T16:00:56Z · sha256 0873a9fb02751837
- `gtfs_243300316.zip` : https://www.data.gouv.fr/api/1/datasets/r/10b87ffe-e6bb-494d-93df-bb6019e223d9 · 2026-10-15T16:01:13Z · sha256 1bf4a1dc1ad2ef98
- `geo_59350.json` : https://geo.api.gouv.fr/communes/59350?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:01:38Z · sha256 cd66a5817431848e
- `ban_59.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-59.csv.gz · 2026-10-15T16:02:01Z · sha256 10fb8ef428bf8831
- `iris_ign_59350.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59350' · 2026-10-15T16:02:07Z · sha256 bc0d93994ca658d4
- `iris_ign_59599.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59599' · 2026-10-15T16:02:08Z · sha256 a50500f69d8c5fbd
- `iris_ign_59512.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59512' · 2026-10-15T16:02:08Z · sha256 adf3f556bcae2e47
- `iris_ign_59009.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59009' · 2026-10-15T16:02:09Z · sha256 13567eeeb3ec7d6b
- `iris_ign_59650.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59650' · 2026-10-15T16:02:09Z · sha256 3033178e5e853605
- `iris_ign_59378.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59378' · 2026-10-15T16:02:09Z · sha256 15f8673bb7d39ff3
- `iris_ign_59328.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59328' · 2026-10-15T16:02:09Z · sha256 51b5f6f2710dc603
- `gtfs_200093201.zip` : https://www.data.gouv.fr/api/1/datasets/r/f389ca22-d36e-46f3-9e00-5be700c7139b · 2026-10-15T16:02:31Z · sha256 05ac26bf374e1529
- `geo_35238.json` : https://geo.api.gouv.fr/communes/35238?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:02:56Z · sha256 53b12113ffa69f57
- `ban_35.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-35.csv.gz · 2026-10-15T16:03:09Z · sha256 1dedfe90d3d225dd
- `iris_ign_35238.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35238' · 2026-10-15T16:03:13Z · sha256 6d8ddef3fde6d25f
- `iris_ign_35047.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35047' · 2026-10-15T16:03:13Z · sha256 4fe9ea391ac1b907
- `iris_ign_35051.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35051' · 2026-10-15T16:03:14Z · sha256 c813e41f8f963ea6
- `iris_ign_35281.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35281' · 2026-10-15T16:03:14Z · sha256 280160d921a4450a
- `iris_ign_35024.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35024' · 2026-10-15T16:03:14Z · sha256 1d2208ce5e09d977
- `iris_ign_35210.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35210' · 2026-10-15T16:03:14Z · sha256 288cf3d27d4a87ed
- `iris_ign_35055.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='35055' · 2026-10-15T16:03:15Z · sha256 51e587d234dd62c8
- `gtfs_243500139.zip` : https://www.data.gouv.fr/api/1/datasets/r/ef4779c4-d066-40d8-b8d9-fb8c7eea8820 · 2026-10-15T16:03:21Z · sha256 2530eb9204f223a9
- `geo_83137.json` : https://geo.api.gouv.fr/communes/83137?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:03:39Z · sha256 fa0ec296abbb9f3c
- `ban_83.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-83.csv.gz · 2026-10-15T16:03:57Z · sha256 6f3d3d8efe40757a
- `iris_ign_83137.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83137' · 2026-10-15T16:04:02Z · sha256 c692c48a014f1391
- `iris_ign_83126.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83126' · 2026-10-15T16:04:03Z · sha256 6fc4321fc37c8be8
- `iris_ign_83069.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83069' · 2026-10-15T16:04:04Z · sha256 53ccaa193b74a709
- `iris_ign_13028.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13028' · 2026-10-15T16:04:04Z · sha256 cc8d4c96b3162d51
- `iris_ign_83129.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83129' · 2026-10-15T16:04:05Z · sha256 4ce5ed37765baabe
- `iris_ign_83062.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83062' · 2026-10-15T16:04:06Z · sha256 c592029a01b8e826
- `iris_ign_83144.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='83144' · 2026-10-15T16:04:06Z · sha256 51c6cd3dcea5acac
- `gtfs_248300543.zip` : https://www.data.gouv.fr/api/1/datasets/r/b0789d9e-5077-4124-b6b2-773353ada8cf · 2026-10-15T16:04:20Z · sha256 ef15e87a86004573
- `geo_51454.json` : https://geo.api.gouv.fr/communes/51454?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:04:49Z · sha256 79e5e17f38db806f
- `ban_51.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-51.csv.gz · 2026-10-15T16:05:07Z · sha256 7c18640f5bbbd571
- `iris_ign_51454.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51454' · 2026-10-15T16:05:09Z · sha256 d4f131dcd738e56a
- `iris_ign_51573.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51573' · 2026-10-15T16:05:09Z · sha256 01c5b789e0c99539
- `iris_ign_51055.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51055' · 2026-10-15T16:05:09Z · sha256 40b1d5b0c2dcc796
- `iris_ign_51172.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51172' · 2026-10-15T16:05:10Z · sha256 a402704ffdeb6e2f
- `iris_ign_51058.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51058' · 2026-10-15T16:05:10Z · sha256 f19c73afa762f7e8
- `iris_ign_51474.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51474' · 2026-10-15T16:05:12Z · sha256 3f7eea4ff64edb56
- `iris_ign_51562.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='51562' · 2026-10-15T16:05:12Z · sha256 1f15df8c84ebc8b0
- `gtfs_200067213.zip` : https://transport.data.gouv.fr/resources/80594/download · 2026-10-15T16:05:16Z · sha256 d1048f77799f950b
- `geo_42218.json` : https://geo.api.gouv.fr/communes/42218?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:05:32Z · sha256 64d762d717c95f8c
- `ban_42.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-42.csv.gz · 2026-10-15T16:05:44Z · sha256 649c4e27c6ecb525
- `iris_ign_42218.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42218' · 2026-10-15T16:05:45Z · sha256 f2440b10f78404fe
- `iris_ign_42207.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42207' · 2026-10-15T16:05:45Z · sha256 07e28b4a2f03c055
- `iris_ign_42095.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42095' · 2026-10-15T16:05:46Z · sha256 9decf14704690e5f
- `iris_ign_42186.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42186' · 2026-10-15T16:05:46Z · sha256 fee3ba97233e6eda
- `iris_ign_42044.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42044' · 2026-10-15T16:05:47Z · sha256 a624784f1c7c2b9b
- `iris_ign_42189.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42189' · 2026-10-15T16:05:47Z · sha256 7f03b7980264115d
- `iris_ign_42316.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='42316' · 2026-10-15T16:05:47Z · sha256 118ce6e8fd5eba5c
- `gtfs_244200770.zip` : https://www.data.gouv.fr/api/1/datasets/r/fc66b270-658c-4678-9794-229a1a8a4938 · 2026-10-15T16:06:02Z · sha256 d6170d6a5f9c9a9f
- `geo_76351.json` : https://geo.api.gouv.fr/communes/76351?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:06:15Z · sha256 7cb0c0f1c135508d
- `ban_76.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-76.csv.gz · 2026-10-15T16:06:28Z · sha256 da0b82c1fb63794a
- `iris_ign_76351.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76351' · 2026-10-15T16:06:31Z · sha256 c3cfc8fca3841112
- `iris_ign_76447.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76447' · 2026-10-15T16:06:31Z · sha256 2655b6899574b666
- `iris_ign_76305.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76305' · 2026-10-15T16:06:32Z · sha256 3df09e5d3c711485
- `iris_ign_76341.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76341' · 2026-10-15T16:06:32Z · sha256 803c7d4dadf24263
- `iris_ign_76552.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76552' · 2026-10-15T16:06:32Z · sha256 e42cde1a38ed6919
- `iris_ign_76481.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76481' · 2026-10-15T16:06:32Z · sha256 71db47c8fdb8fbe1
- `iris_ign_76238.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76238' · 2026-10-15T16:06:33Z · sha256 48a9e96ca776d57f
- `gtfs_200084952.zip` : https://www.data.gouv.fr/api/1/datasets/r/2178bfa8-9fe0-4633-8223-8c151728ef28 · 2026-10-15T16:06:37Z · sha256 bc4187a614616d8c
- `geo_21231.json` : https://geo.api.gouv.fr/communes/21231?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:06:50Z · sha256 5f587123642650fd
- `ban_21.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-21.csv.gz · 2026-10-15T16:07:01Z · sha256 6bba9ca24f152215
- `iris_ign_21231.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21231' · 2026-10-15T16:07:03Z · sha256 a374e6e271cc7765
- `iris_ign_21166.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21166' · 2026-10-15T16:07:03Z · sha256 95373c6b21521837
- `iris_ign_21617.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21617' · 2026-10-15T16:07:03Z · sha256 1379f042a5c45c63
- `iris_ign_21171.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21171' · 2026-10-15T16:07:04Z · sha256 6fa3164fe68e34eb
- `iris_ign_21515.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21515' · 2026-10-15T16:07:04Z · sha256 e46f4ae24b4dcab9
- `iris_ign_21278.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21278' · 2026-10-15T16:07:05Z · sha256 3d7606f8b4014176
- `iris_ign_21355.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='21355' · 2026-10-15T16:07:05Z · sha256 3e034b4463541e23
- `gtfs_242100410.zip` : https://www.data.gouv.fr/api/1/datasets/r/e0dbd217-15cd-4e28-9459-211a27511a34 · 2026-10-15T16:07:09Z · sha256 e5251f492992440f
- `geo_38185.json` : https://geo.api.gouv.fr/communes/38185?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:07:33Z · sha256 1408a8e754f71689
- `ban_38.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-38.csv.gz · 2026-10-15T16:08:05Z · sha256 47e87488dba672b3
- `iris_ign_38185.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38185' · 2026-10-15T16:08:10Z · sha256 464b631cbdfbca7e
- `iris_ign_38421.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38421' · 2026-10-15T16:08:10Z · sha256 4fee81f8d899b0c2
- `iris_ign_38151.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38151' · 2026-10-15T16:08:11Z · sha256 60a3ddd0b73c38f4
- `iris_ign_38169.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38169' · 2026-10-15T16:08:11Z · sha256 cd7992fc125f3f7b
- `iris_ign_38229.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38229' · 2026-10-15T16:08:11Z · sha256 1f2fb930dfe80c92
- `iris_ign_38382.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38382' · 2026-10-15T16:08:12Z · sha256 ce5856618690002b
- `iris_ign_38485.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='38485' · 2026-10-15T16:08:12Z · sha256 f3f882aa89534f8a
- `gtfs_200040715.zip` : https://www.data.gouv.fr/api/1/datasets/r/91dbf9cb-4ab2-42a3-9f40-0791a53d58d2 · 2026-10-15T16:08:18Z · sha256 e15eab68dc67a082
- `geo_69266.json` : https://geo.api.gouv.fr/communes/69266?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:08:35Z · sha256 28863547395b97bf
- `ban_69.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-69.csv.gz · 2026-10-15T16:08:50Z · sha256 c67259d2db111393
- `iris_ign_69266.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69266' · 2026-10-15T16:08:53Z · sha256 46fba391a53b6071
- `iris_ign_69383.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69383' · 2026-10-15T16:08:53Z · sha256 9d7b3ab467045585
- `iris_ign_69388.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69388' · 2026-10-15T16:08:53Z · sha256 b669fdba29daacb2
- `iris_ign_69387.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69387' · 2026-10-15T16:08:53Z · sha256 1a29240432517140
- `iris_ign_69259.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69259' · 2026-10-15T16:08:54Z · sha256 d142ac3ff2766315
- `iris_ign_69389.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69389' · 2026-10-15T16:08:55Z · sha256 c3b5a042d837bbb9
- `iris_ign_69256.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='69256' · 2026-10-15T16:08:55Z · sha256 68c9980a828a9090
- `gtfs_200046977.zip` : https://www.data.gouv.fr/api/1/datasets/r/abebedc6-28cf-4e2e-9c64-db57a40156f8 · 2026-10-15T16:09:06Z · sha256 0e5818aa4e5108a3
- `geo_13001.json` : https://geo.api.gouv.fr/communes/13001?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:09:24Z · sha256 8a28d687bcc54fe7
- `ban_13.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-13.csv.gz · 2026-10-15T16:09:41Z · sha256 2cd2ef0978149ebd
- `iris_ign_13001.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13001' · 2026-10-15T16:09:45Z · sha256 c3c16ed0917ef255
- `iris_ign_13213.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13213' · 2026-10-15T16:09:45Z · sha256 6b6e3d98d1723b6a
- `iris_ign_13208.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13208' · 2026-10-15T16:09:46Z · sha256 a30e93b97431dd93
- `iris_ign_13215.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13215' · 2026-10-15T16:09:47Z · sha256 7b10564dbd00f6a7
- `iris_ign_13209.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13209' · 2026-10-15T16:09:47Z · sha256 5ab42ef7850f14c2
- `iris_ign_13212.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13212' · 2026-10-15T16:09:47Z · sha256 828b771d0a18aa75
- `iris_ign_13214.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='13214' · 2026-10-15T16:09:48Z · sha256 6c779b4123a2e9c9
- `gtfs_200054807.zip` : https://www.data.gouv.fr/api/1/datasets/r/7eef6ec9-9ebb-44f2-becb-2efc522522d6 · 2026-10-15T16:09:58Z · sha256 0998909cf23feba8
- `geo_63113.json` : https://geo.api.gouv.fr/communes/63113?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:10:15Z · sha256 f09def35c19acc2e
- `ban_63.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-63.csv.gz · 2026-10-15T16:10:27Z · sha256 9830e5aeab7e7f0c
- `iris_ign_63113.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63113' · 2026-10-15T16:10:29Z · sha256 9b339a86ffe473db
- `iris_ign_63124.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63124' · 2026-10-15T16:10:30Z · sha256 45ff4721126bafea
- `iris_ign_63075.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63075' · 2026-10-15T16:10:30Z · sha256 7d4679f1938435ae
- `iris_ign_63032.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63032' · 2026-10-15T16:10:30Z · sha256 7df8e0f641817ea5
- `iris_ign_63164.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63164' · 2026-10-15T16:10:30Z · sha256 551103e3701a4490
- `iris_ign_63014.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63014' · 2026-10-15T16:10:31Z · sha256 53e3e60945597875
- `iris_ign_63063.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='63063' · 2026-10-15T16:10:31Z · sha256 acdc4cc3c40b4ed9
- `gtfs_246300701.zip` : https://www.data.gouv.fr/api/1/datasets/r/4e237a58-cd14-4746-b729-1337a40a8a7b · 2026-10-15T16:10:35Z · sha256 3d96c42425c5a0e0
- `geo_74010.json` : https://geo.api.gouv.fr/communes/74010?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:10:50Z · sha256 bf312baefa19e73a
- `ban_74.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-74.csv.gz · 2026-10-15T16:11:01Z · sha256 8e65496e338fd9c7
- `iris_ign_74010.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74010' · 2026-10-15T16:11:03Z · sha256 eb711d18f971dce9
- `iris_ign_74213.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74213' · 2026-10-15T16:11:03Z · sha256 4bbe2901de3b9064
- `iris_ign_74112.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74112' · 2026-10-15T16:11:03Z · sha256 0a75eda2476d4401
- `iris_ign_74242.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74242' · 2026-10-15T16:11:03Z · sha256 40ea167a7c00f539
- `iris_ign_74272.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74272' · 2026-10-15T16:11:04Z · sha256 1fac5b85c1d9699a
- `iris_ign_74026.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74026' · 2026-10-15T16:11:04Z · sha256 e21330834417557d
- `iris_ign_74267.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='74267' · 2026-10-15T16:11:04Z · sha256 06534b7c12259866
- `gtfs_200066793.zip` : https://www.data.gouv.fr/api/1/datasets/r/8b12f6db-9aa7-43dc-a179-013998a1c4c0 · 2026-10-15T16:11:07Z · sha256 ecb4c0627e47818c
- `geo_87085.json` : https://geo.api.gouv.fr/communes/87085?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:11:20Z · sha256 92538a9639668908
- `ban_87.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-87.csv.gz · 2026-10-15T16:11:31Z · sha256 4c1a04de60cd2d01
- `iris_ign_87085.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87085' · 2026-10-15T16:11:33Z · sha256 ebdb867be7920037
- `iris_ign_87114.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87114' · 2026-10-15T16:11:33Z · sha256 83d2918be82f660c
- `iris_ign_87050.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87050' · 2026-10-15T16:11:34Z · sha256 d0fb0405dd3013b7
- `iris_ign_87075.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87075' · 2026-10-15T16:11:34Z · sha256 f9cc2b6f69e01f29
- `iris_ign_87065.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87065' · 2026-10-15T16:11:34Z · sha256 4a11438aa09a0e9d
- `iris_ign_87113.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87113' · 2026-10-15T16:11:34Z · sha256 407cf1ddc1c26afe
- `iris_ign_87048.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='87048' · 2026-10-15T16:11:34Z · sha256 167e8ff4d0850ecc
- `gtfs_248719312.zip` : https://www.data.gouv.fr/api/1/datasets/r/99e0887d-4855-47f7-a03b-a8235dfc86b7 · 2026-10-15T16:11:38Z · sha256 c43ef32fcce0bf70
- `geo_57463.json` : https://geo.api.gouv.fr/communes/57463?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:11:51Z · sha256 f5977a26c7eb64eb
- `ban_57.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-57.csv.gz · 2026-10-15T16:12:02Z · sha256 4cfe07eed2ae6df8
- `iris_ign_57463.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57463' · 2026-10-15T16:12:04Z · sha256 f79ef9f2188825cd
- `iris_ign_57480.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57480' · 2026-10-15T16:12:04Z · sha256 07cc04d0af668b46
- `iris_ign_57751.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57751' · 2026-10-15T16:12:05Z · sha256 d199501e7e5fcf27
- `iris_ign_57433.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57433' · 2026-10-15T16:12:05Z · sha256 77eab16dcfd366f8
- `iris_ign_57019.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57019' · 2026-10-15T16:12:05Z · sha256 389194746f3bab13
- `iris_ign_57447.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57447' · 2026-10-15T16:12:05Z · sha256 6138a51871509995
- `iris_ign_57591.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='57591' · 2026-10-15T16:12:05Z · sha256 ef74fa4caab727fc
- `gtfs_200039865.zip` : https://www.data.gouv.fr/api/1/datasets/r/92af6161-1b1a-4e0b-8f60-d97f213d993a · 2026-10-15T16:12:11Z · sha256 500c6edb0bfdcfb4
- `geo_92012.json` : https://geo.api.gouv.fr/communes/92012?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:12:30Z · sha256 807f9fe478f219b8
- `ban_92.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-92.csv.gz · 2026-10-15T16:12:41Z · sha256 e9776ac40deb32eb
- `iris_ign_92012.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92012' · 2026-10-15T16:12:42Z · sha256 49a20d10fa4b702d
- `iris_ign_75115.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75115' · 2026-10-15T16:12:44Z · sha256 c5bd4eff833cb8bd
- `iris_ign_75120.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75120' · 2026-10-15T16:12:44Z · sha256 828affbf56f83a36
- `iris_ign_75118.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75118' · 2026-10-15T16:12:44Z · sha256 44868f29bf068c3e
- `iris_ign_75119.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75119' · 2026-10-15T16:12:45Z · sha256 a60cfd0dc49f64e3
- `iris_ign_75113.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75113' · 2026-10-15T16:12:45Z · sha256 6ca94c2113e7e282
- `iris_ign_75117.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='75117' · 2026-10-15T16:12:45Z · sha256 cd15376e2fab1a92
- `geo_66136.json` : https://geo.api.gouv.fr/communes/66136?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:14:58Z · sha256 daa5d62fc7ef4e0b
- `ban_66.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-66.csv.gz · 2026-10-15T16:15:08Z · sha256 f306cc9f8013bd3f
- `iris_ign_66136.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66136' · 2026-10-15T16:15:11Z · sha256 29407cb8039fe625
- `iris_ign_66172.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66172' · 2026-10-15T16:15:12Z · sha256 9613febe5629e506
- `iris_ign_66141.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66141' · 2026-10-15T16:15:12Z · sha256 fc168f5b67590664
- `iris_ign_66028.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66028' · 2026-10-15T16:15:12Z · sha256 a69fa8bc3b1f8fe7
- `iris_ign_66164.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66164' · 2026-10-15T16:15:12Z · sha256 5ec5dbd5272da6ab
- `iris_ign_66195.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66195' · 2026-10-15T16:15:13Z · sha256 46e2e2eeec97711d
- `iris_ign_66021.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='66021' · 2026-10-15T16:15:13Z · sha256 1af8cc6112c957b6
- `gtfs_200027183.zip` : https://www.data.gouv.fr/api/1/datasets/r/3047f942-98f0-4d4c-92cf-7c5de1fe233c · 2026-10-15T16:15:17Z · sha256 c8dd7f2ec9c8d453
- `geo_45234.json` : https://geo.api.gouv.fr/communes/45234?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:15:31Z · sha256 dcac667e62252807
- `ban_45.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-45.csv.gz · 2026-10-15T16:15:44Z · sha256 ad4d0ae7eb006460
- `iris_ign_45234.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45234' · 2026-10-15T16:15:46Z · sha256 45468e87aa07be21
- `iris_ign_45232.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45232' · 2026-10-15T16:15:46Z · sha256 198f3adf3a5abd50
- `iris_ign_45284.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45284' · 2026-10-15T16:15:47Z · sha256 65ddbee93ea12ce9
- `iris_ign_45147.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45147' · 2026-10-15T16:15:47Z · sha256 a9205c683de8b9e3
- `iris_ign_45302.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45302' · 2026-10-15T16:15:48Z · sha256 6ec1f3f2faefba6c
- `iris_ign_45285.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45285' · 2026-10-15T16:15:48Z · sha256 9932ef49d600abce
- `iris_ign_45075.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='45075' · 2026-10-15T16:15:48Z · sha256 f397ee2cddfe8d89
- `gtfs_244500468.zip` : https://www.data.gouv.fr/api/1/datasets/r/b2dfbaa3-47e9-4749-b6a4-750bebd760e7 · 2026-10-15T16:15:54Z · sha256 d807a25bd9ddfdea
- `geo_76540.json` : https://geo.api.gouv.fr/communes/76540?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:16:17Z · sha256 7c1c12a86647bd24
- `iris_ign_76540.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76540' · 2026-10-15T16:16:31Z · sha256 c6d4c16992760b73
- `iris_ign_76681.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76681' · 2026-10-15T16:16:32Z · sha256 3eceb8a46a7f2a96
- `iris_ign_76575.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76575' · 2026-10-15T16:16:32Z · sha256 912b0ecd74265e0b
- `iris_ign_76322.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76322' · 2026-10-15T16:16:32Z · sha256 49ec3e48cb8d8d22
- `iris_ign_76498.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76498' · 2026-10-15T16:16:33Z · sha256 07ea9a908427fa5e
- `iris_ign_76451.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76451' · 2026-10-15T16:16:33Z · sha256 0a351b59d40493a3
- `iris_ign_76231.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='76231' · 2026-10-15T16:16:33Z · sha256 f292aed116c75955
- `gtfs_200023414.zip` : https://www.data.gouv.fr/api/1/datasets/r/c0ebcf01-954a-4d24-b2d8-a00333ffe937 · 2026-10-15T16:16:39Z · sha256 769b5dedf37f32a1
- `geo_93066.json` : https://geo.api.gouv.fr/communes/93066?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:16:54Z · sha256 243a31f20ba6bb47
- `ban_93.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-93.csv.gz · 2026-10-15T16:17:05Z · sha256 13a27ee9846f352c
- `iris_ign_93066.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='93066' · 2026-10-15T16:17:07Z · sha256 5a148675323b1759
- `geo_93048.json` : https://geo.api.gouv.fr/communes/93048?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:17:18Z · sha256 0019ce47b7cceec4
- `iris_ign_93048.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='93048' · 2026-10-15T16:17:29Z · sha256 8b172745408ca8b5
- `geo_95018.json` : https://geo.api.gouv.fr/communes/95018?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:17:40Z · sha256 aab6cd6cc4c7bfee
- `ban_95.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-95.csv.gz · 2026-10-15T16:17:52Z · sha256 b70dc1579ef57401
- `iris_ign_95018.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='95018' · 2026-10-15T16:17:54Z · sha256 31f96cdc7e929d5c
- `geo_68224.json` : https://geo.api.gouv.fr/communes/68224?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:18:09Z · sha256 8110e46b12970b63
- `ban_68.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-68.csv.gz · 2026-10-15T16:18:20Z · sha256 aade5c812831f37e
- `iris_ign_68224.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68224' · 2026-10-15T16:18:21Z · sha256 741811fce67c9bdd
- `iris_ign_68376.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68376' · 2026-10-15T16:18:22Z · sha256 b4144cbc4e35e6c9
- `iris_ign_68154.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68154' · 2026-10-15T16:18:22Z · sha256 b0ce82124e00bd61
- `iris_ign_68278.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68278' · 2026-10-15T16:18:23Z · sha256 8022bb1588725d9c
- `iris_ign_68166.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68166' · 2026-10-15T16:18:23Z · sha256 188bff33ebd2d0a4
- `iris_ign_68271.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68271' · 2026-10-15T16:18:23Z · sha256 f623e8861494e891
- `iris_ign_68375.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='68375' · 2026-10-15T16:18:23Z · sha256 988163ff4b068bae
- `gtfs_200066009.zip` : https://transport.data.gouv.fr/resources/80787/download · 2026-10-15T16:18:27Z · sha256 72cefcd361042690
- `geo_54395.json` : https://geo.api.gouv.fr/communes/54395?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:18:42Z · sha256 afd717dc0680059c
- `ban_54.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-54.csv.gz · 2026-10-15T16:18:55Z · sha256 9975ada72c95cd65
- `iris_ign_54395.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54395' · 2026-10-15T16:18:57Z · sha256 ed7a6792ceb6aca0
- `iris_ign_54547.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54547' · 2026-10-15T16:18:57Z · sha256 2d61ea8cf9e25b2d
- `iris_ign_54578.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54578' · 2026-10-15T16:18:58Z · sha256 2bc5f27f3e14d909
- `iris_ign_54304.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54304' · 2026-10-15T16:18:58Z · sha256 da23616bb53a07e6
- `iris_ign_54482.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54482' · 2026-10-15T16:18:59Z · sha256 afeefb1548ffeacf
- `iris_ign_54357.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54357' · 2026-10-15T16:18:59Z · sha256 b25e6be19d8cbfaf
- `iris_ign_54274.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='54274' · 2026-10-15T16:18:59Z · sha256 1df55294bb7c457e
- `gtfs_245400676.zip` : https://transport.data.gouv.fr/resources/80431/download · 2026-10-15T16:19:02Z · sha256 793924525cc84e90
- `geo_59599.json` : https://geo.api.gouv.fr/communes/59599?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:19:14Z · sha256 fa22dc962fd6291a
- `geo_59512.json` : https://geo.api.gouv.fr/communes/59512?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:20:34Z · sha256 d1e9f594aeb07158
- `geo_92050.json` : https://geo.api.gouv.fr/communes/92050?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:21:39Z · sha256 f8c957783d95d8db
- `iris_ign_92050.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92050' · 2026-10-15T16:21:50Z · sha256 cbc0fd691ea14d96
- `geo_94081.json` : https://geo.api.gouv.fr/communes/94081?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:22:02Z · sha256 383c4ef779ac8c1d
- `ban_94.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-94.csv.gz · 2026-10-15T16:22:13Z · sha256 519342309003ffbc
- `iris_ign_94081.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='94081' · 2026-10-15T16:22:15Z · sha256 6159deb28568a3c0
- `geo_94028.json` : https://geo.api.gouv.fr/communes/94028?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:22:26Z · sha256 b5fd89af47357f28
- `iris_ign_94028.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='94028' · 2026-10-15T16:22:36Z · sha256 cbb2ad85bc1aa7c9
- `geo_84007.json` : https://geo.api.gouv.fr/communes/84007?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:22:46Z · sha256 4c937801f44e9962
- `ban_84.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-84.csv.gz · 2026-10-15T16:22:55Z · sha256 2ea7af5ea3372339
- `iris_ign_84007.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84007' · 2026-10-15T16:22:57Z · sha256 9d60f431f71469cd
- `iris_ign_84031.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84031' · 2026-10-15T16:22:58Z · sha256 031bd66ee592d713
- `iris_ign_84087.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84087' · 2026-10-15T16:22:58Z · sha256 9bfcf284cbca8952
- `iris_ign_84035.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84035' · 2026-10-15T16:22:58Z · sha256 00cefe7114811e0f
- `iris_ign_84054.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84054' · 2026-10-15T16:22:58Z · sha256 9a8171e8151024ff
- `iris_ign_84129.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84129' · 2026-10-15T16:22:59Z · sha256 2d91fb21b26193c0
- `iris_ign_84092.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='84092' · 2026-10-15T16:22:59Z · sha256 10ffcceb0115d82a
- `gtfs_248400251.zip` : https://www.data.gouv.fr/api/1/datasets/r/40b26c33-9be2-47ea-a46c-8bda9f63273e · 2026-10-15T16:23:03Z · sha256 c50b90db9011ae87
- `geo_93001.json` : https://geo.api.gouv.fr/communes/93001?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:23:16Z · sha256 5eb75ead3397604f
- `iris_ign_93001.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='93001' · 2026-10-15T16:23:26Z · sha256 7899635009a9f709
- `geo_92004.json` : https://geo.api.gouv.fr/communes/92004?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:23:36Z · sha256 8f8ff56d20246298
- `iris_ign_92004.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92004' · 2026-10-15T16:23:45Z · sha256 20534aee1f1c84c1
- `geo_92025.json` : https://geo.api.gouv.fr/communes/92025?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:23:54Z · sha256 0197497fe9182c14
- `iris_ign_92025.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92025' · 2026-10-15T16:24:04Z · sha256 56fc184cbb00438c
- `geo_59183.json` : https://geo.api.gouv.fr/communes/59183?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:24:14Z · sha256 0b410dfdac0b81f1
- `iris_ign_59183.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59183' · 2026-10-15T16:24:26Z · sha256 bc728909ade2c606
- `iris_ign_59155.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59155' · 2026-10-15T16:24:26Z · sha256 077261408e6cc112
- `iris_ign_59271.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59271' · 2026-10-15T16:24:26Z · sha256 fef442856d954c70
- `iris_ign_59273.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59273' · 2026-10-15T16:24:27Z · sha256 cf3b6552719a5182
- `iris_ign_59131.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59131' · 2026-10-15T16:24:27Z · sha256 a97da1c43d93e115
- `iris_ign_59359.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59359' · 2026-10-15T16:24:27Z · sha256 a1918a6849c434bc
- `iris_ign_59272.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='59272' · 2026-10-15T16:24:27Z · sha256 5787397f7c1bf4f3
- `gtfs_245900428.zip` : https://www.data.gouv.fr/api/1/datasets/r/f51fabfb-9d7a-44b7-bd03-d1032337fb80 · 2026-10-15T16:24:34Z · sha256 9f40e0d0b432633b
- `geo_93005.json` : https://geo.api.gouv.fr/communes/93005?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:24:46Z · sha256 d64a7c69d2ce5a86
- `iris_ign_93005.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='93005' · 2026-10-15T16:24:56Z · sha256 3e1b5a05c600858c
- `geo_78646.json` : https://geo.api.gouv.fr/communes/78646?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:25:21Z · sha256 ab822be493ac997c
- `ban_78.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-78.csv.gz · 2026-10-15T16:25:34Z · sha256 192173ac608f8f3b
- `iris_ign_78646.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='78646' · 2026-10-15T16:25:42Z · sha256 6a4bca0eac67a50e
- `geo_92026.json` : https://geo.api.gouv.fr/communes/92026?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:25:54Z · sha256 8afc8e05c29511cc
- `iris_ign_92026.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92026' · 2026-10-15T16:26:06Z · sha256 5d67810cd026f938
- `geo_34032.json` : https://geo.api.gouv.fr/communes/34032?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:26:17Z · sha256 84bc8605d38520cf
- `iris_ign_34032.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34032' · 2026-10-15T16:26:30Z · sha256 39c214782094217c
- `iris_ign_34148.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34148' · 2026-10-15T16:26:31Z · sha256 4d609d92bf8e305a
- `iris_ign_34336.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34336' · 2026-10-15T16:26:31Z · sha256 a3a9cf80aa4a3225
- `iris_ign_34037.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34037' · 2026-10-15T16:26:31Z · sha256 c6483c78850e1527
- `iris_ign_34140.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='34140' · 2026-10-15T16:26:31Z · sha256 f64874e8cf898ab2
- `gtfs_243400769.zip` : https://www.data.gouv.fr/api/1/datasets/r/c1581a3a-0b78-4944-905c-a8530206648a · 2026-10-15T16:26:35Z · sha256 9117560dd650063e
- `geo_92063.json` : https://geo.api.gouv.fr/communes/92063?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:26:52Z · sha256 d6e986e4ebb80710
- `iris_ign_92063.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='92063' · 2026-10-15T16:27:05Z · sha256 ad13d521c0f07ab6
- `geo_50129.json` : https://geo.api.gouv.fr/communes/50129?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:27:17Z · sha256 e2a9d6df50fc6e1f
- `ban_50.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-50.csv.gz · 2026-10-15T16:27:28Z · sha256 4d1208b2ef3ae0af
- `iris_ign_50129.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='50129' · 2026-10-15T16:27:30Z · sha256 bcf345a20ef1a34c
- `iris_ign_50599.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='50599' · 2026-10-15T16:27:30Z · sha256 5a61ee2be87976cd
- `iris_ign_50294.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='50294' · 2026-10-15T16:27:30Z · sha256 c20fccbe92e17b94
- `gtfs_200067205.zip` : https://www.data.gouv.fr/api/1/datasets/r/2e97c9b3-a59f-42dd-9b9e-a232fa771f21 · 2026-10-15T16:27:33Z · sha256 6b3b464576c59fcc
- `geo_94017.json` : https://geo.api.gouv.fr/communes/94017?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:27:44Z · sha256 7eae5bbc16821044
- `iris_ign_94017.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='94017' · 2026-10-15T16:27:53Z · sha256 d6771425e29b0b9f
- `geo_33281.json` : https://geo.api.gouv.fr/communes/33281?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:28:03Z · sha256 258e8576ad4483f1
- `geo_94068.json` : https://geo.api.gouv.fr/communes/94068?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:28:43Z · sha256 2e7e11eeaffaedf0
- `iris_ign_94068.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='94068' · 2026-10-15T16:28:52Z · sha256 5b74a13ef5b7fbe4
- `geo_06004.json` : https://geo.api.gouv.fr/communes/06004?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:29:03Z · sha256 267b4080c6cdd6d5
- `gtfs_240600585.zip` : https://www.data.gouv.fr/api/1/datasets/r/344e5a88-e993-4952-a8bf-503048020116 · 2026-10-15T16:29:19Z · sha256 c38bde1b64784696
- `geo_2A004.json` : https://geo.api.gouv.fr/communes/2A004?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:29:31Z · sha256 b4f53e4a90266ee6
- `ban_2A.csv.gz` : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-2A.csv.gz · 2026-10-15T16:29:40Z · sha256 1dc692b04fd60c8a
- `iris_ign_2A004.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='2A004' · 2026-10-15T16:29:41Z · sha256 bbc6fad12cbf7197
- `iris_ign_2A006.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='2A006' · 2026-10-15T16:29:41Z · sha256 e84334926a8ea615
- `iris_ign_2A001.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='2A001' · 2026-10-15T16:29:42Z · sha256 c2517d138a98d2b0
- `iris_ign_2A271.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='2A271' · 2026-10-15T16:29:42Z · sha256 d5e1140ce94c6908
- `iris_ign_2A017.json` : https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=code_insee='2A017' · 2026-10-15T16:29:42Z · sha256 58684145d7305354
- `gtfs_242010056.zip` : https://www.data.gouv.fr/api/1/datasets/r/5021a054-43c8-49b7-9166-832f2af6c8f0 · 2026-10-15T16:29:43Z · sha256 1ba11045898be9d4
- `geo_06029.json` : https://geo.api.gouv.fr/communes/06029?fields=nom,codeEpci,epci,codeDepartement,centre,population · 2026-10-15T16:29:53Z · sha256 ec5cf4e1ec9a2000
- `gtfs_200039915.zip` : https://www.data.gouv.fr/api/1/datasets/r/47bc8088-6c72-43ad-a959-a5bbdd1aa14f · 2026-10-15T16:30:10Z · sha256 929f509827775964

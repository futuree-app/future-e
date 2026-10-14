# Fiche mobilité · Saint-Nazaire (44184)

Générée le 2026-10-14T14:26:12Z · jour de référence 2026-10-13 · voisines : La Baule-Escoublac, Guérande, Saint-Brevin-les-Pins, Pornichet, Donges, Trignac

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.03, "bas": 0.026, "haut": 0.035, "lignes": 9198, "n_eff": 5125}, "marche": {"p": 0.061, "bas": 0.055, "haut": 0.068, "lignes": 9198, "n_eff": 5125}, "velo": {"p": 0.083, "bas": 0.076, "haut": 0.091, "lignes": 9198, "n_eff": 5125}, "deux_roues_mot": {"p": 0.012, "bas": 0.01, "haut": 0.016, "lignes": 9198, "n_eff": 5125}, "voiture": {"p": 0.711, "bas": 0.699, "haut": 0.723, "lignes": 9198, "n_eff": 5125}, "tc": {"p": 0.102, "bas": 0.094, "haut": 0.11, "lignes": 9198, "n_eff": 5125}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.7111) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.654, "bas": 0.641, "haut": 0.667, "lignes": 9198, "n_eff": 5125}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.64, "bas": 0.624, "haut": 0.656, "lignes": 5996, "n_eff": 3353}, "communes_voisines": {"p": 0.889, "bas": 0.863, "haut": 0.91, "lignes": 1266, "n_eff": 701}, "ailleurs": {"p": 0.845, "bas": 0.827, "haut": 0.861, "lignes": 3202, "n_eff": 1772}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : La Baule-Escoublac, Guérande, Saint-Brevin-les-Pins, Pornichet, Donges, Trignac

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.093, "bas": 0.085, "haut": 0.101, "lignes": 9198, "n_eff": 5125}, "actifs_menage_2_voitures_plus": {"p": 0.445, "bas": 0.431, "haut": 0.458, "lignes": 9198, "n_eff": 5125}, "menage_motorise_mais_pas_en_voiture": {"p": 0.24, "bas": 0.228, "haut": 0.253, "lignes": 8255, "n_eff": 4618}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.744, "bas": 0.726, "haut": 0.76, "lignes": 4236, "n_eff": 2508}, "velo": {"p": 0.104, "bas": 0.092, "haut": 0.116, "lignes": 4236, "n_eff": 2508}, "menage_sans_voiture": {"p": 0.019, "bas": 0.015, "haut": 0.026, "lignes": 4236, "n_eff": 2508}, "menage_2_voitures_plus": {"p": 0.608, "bas": 0.589, "haut": 0.627, "lignes": 4236, "n_eff": 2508}}, "locataires_prive": {"voiture": {"p": 0.697, "bas": 0.675, "haut": 0.719, "lignes": 3144, "n_eff": 1634}, "velo": {"p": 0.066, "bas": 0.055, "haut": 0.08, "lignes": 3144, "n_eff": 1634}, "menage_sans_voiture": {"p": 0.145, "bas": 0.129, "haut": 0.163, "lignes": 3144, "n_eff": 1634}, "menage_2_voitures_plus": {"p": 0.286, "bas": 0.265, "haut": 0.309, "lignes": 3144, "n_eff": 1634}}, "locataires_hlm": {"voiture": {"p": 0.648, "bas": 0.616, "haut": 0.679, "lignes": 1592, "n_eff": 883}, "velo": {"p": 0.053, "bas": 0.04, "haut": 0.07, "lignes": 1592, "n_eff": 883}, "menage_sans_voiture": {"p": 0.22, "bas": 0.194, "haut": 0.249, "lignes": 1592, "n_eff": 883}, "menage_2_voitures_plus": {"p": 0.242, "bas": 0.215, "haut": 0.272, "lignes": 1592, "n_eff": 883}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 42119, "habitent_la_commune": {"part_des_emplois": 0.437, "voiture": {"p": 0.64, "bas": 0.624, "haut": 0.656, "lignes": 5996, "n_eff": 3353}, "tc": {"p": 0.096, "bas": 0.086, "haut": 0.106, "lignes": 5996, "n_eff": 3353}}, "reste_unite_urbaine": {"part_des_emplois": 0.281, "voiture": {"p": 0.923, "bas": 0.91, "haut": 0.935, "lignes": 3150, "n_eff": 1802}, "tc": {"p": 0.036, "bas": 0.028, "haut": 0.045, "lignes": 3150, "n_eff": 1802}}, "hors_unite_urbaine": {"part_des_emplois": 0.282, "voiture": {"p": 0.925, "bas": 0.912, "haut": 0.937, "lignes": 2786, "n_eff": 1678}, "tc": {"p": 0.06, "bas": 0.05, "haut": 0.072, "lignes": 2786, "n_eff": 1678}}}`

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

**Valeur** : `{"min": 0.56, "iris_min": "Ville Port", "max": 0.86, "iris_max": "Immaculée Campagne", "iris_habitat": 28}`

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

**Valeur** : `{"iris": 0.711, "mobpro": 0.711}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.197, "menages_2_voitures_plus": 0.254, "menages_stationnement_reserve": 0.616}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.826, "grande_surface_500m": 0.378, "pharmacie_500m": 0.688, "medecin_generaliste_500m": 0.667, "ecole_elementaire_500m": 0.767, "college_1km": 0.729, "gare_2km": 0.429, "panier_quotidien_500m": 0.617, "bus_8h_7_9h": 0.825, "aucun_bus_7_9h": 0.05, "bus_4h_20_22h": 0.736}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain et scolaire Ycéo » (https://transport.data.gouv.fr/datasets/yceo-arrets-horaires-et-lignes-urbaines-et-scolaires-gtfs-1), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260714', '20270702']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.298, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.565, "ecart": 0.733, "stations": 13}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.144, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.637, "ecart": 0.507, "stations": 12}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 16 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Saint-Nazaire | 65 % | 64 % | 12 % | 10 % | 9 % | 5996 (ok) |
| Montoir-de-Bretagne | 7 % | 86 % | 5 % | 8 % | 0 % | 689 (ok) |
| Trignac | 3 % | 76 % | 5 % | 14 % | 3 % | 295 (ok) |
| Nantes | 3 % | 55 % | 0 % | 42 % | 2 % | 287 (ok) |
| Guérande | 3 % | 92 % | 0 % | 5 % | 0 % | 271 (ok) |
| La Baule-Escoublac | 2 % | 94 % | 0 % | 4 % | 0 % | 233 (ok) |
| Pornichet | 2 % | 93 % | 3 % | 2 % | 1 % | 203 (ok) |
| Donges | 2 % | 89 % | 1 % | 9 % | 0 % | 136 (fragile) |
| Saint-Brevin-les-Pins | 1 % | 96 % | 0 % | 1 % | 0 % | 128 (fragile) |
| Saint-Herblain | 1 % | 88 % | 0 % | 12 % | 0 % | 70 (fragile) |
| Pornic | 1 % | 100 % | 0 % | 0 % | 0 % | 59 (fragile) |
| Saint-André-des-Eaux | 1 % | 96 % | 0 % | 4 % | 0 % | 55 (fragile) |
| Savenay | 1 % | 82 % | 0 % | 18 % | 0 % | 54 (fragile) |
| Pontchâteau | 0 % | 97 % | 0 % | 3 % | 0 % | 49 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Le Port | A | 2 | 0 % | 0 % | 100 % | 100 % | 0 % |
| Ville Port | H | 1040 | 56 % | 11 % | 15 % | 26 % | 43 % |
| Centre Halles | H | 878 | 58 % | 12 % | 10 % | 27 % | 32 % |
| Hôtel de ville | H | 1121 | 58 % | 10 % | 17 % | 28 % | 47 % |
| Gambetta | H | 988 | 61 % | 13 % | 10 % | 30 % | 51 % |
| Jardin des Plantes | H | 906 | 61 % | 14 % | 7 % | 21 % | 59 % |
| Herbins Gare | H | 1010 | 62 % | 10 % | 17 % | 27 % | 48 % |
| Bouletterie | H | 853 | 62 % | 6 % | 24 % | 33 % | 34 % |
| Chesnaie | H | 450 | 63 % | 6 % | 18 % | 35 % | 40 % |
| Hyper Centre | H | 1190 | 64 % | 6 % | 12 % | 23 % | 48 % |
| Brais | A | 63 | 64 % | 5 % | 9 % | 4 % | 91 % |
| Petit Caporal | H | 1329 | 64 % | 13 % | 12 % | 19 % | 55 % |
| Landettes-Avalix | H | 879 | 69 % | 4 % | 14 % | 23 % | 55 % |
| Méan Penhoët | H | 1591 | 69 % | 7 % | 8 % | 19 % | 50 % |
| Gavy Océanis | A | 508 | 69 % | 4 % | 13 % | 24 % | 66 % |
| Parc Paysager | H | 1037 | 69 % | 13 % | 8 % | 13 % | 73 % |
| Québrais | H | 784 | 71 % | 8 % | 12 % | 27 % | 59 % |
| Porcé | H | 788 | 72 % | 10 % | 9 % | 22 % | 68 % |
| Prézégat-Berthauderie | H | 579 | 73 % | 4 % | 15 % | 28 % | 41 % |
| Pertuischaud | H | 782 | 74 % | 8 % | 12 % | 23 % | 58 % |
| Trébale | H | 820 | 74 % | 6 % | 14 % | 22 % | 60 % |
| Cité Scolaire | H | 1131 | 74 % | 8 % | 8 % | 25 % | 58 % |
| Ville ès Martin | H | 977 | 75 % | 11 % | 7 % | 15 % | 79 % |
| Kerlédé | H | 688 | 77 % | 11 % | 10 % | 15 % | 67 % |
| Reton-Plaisance | H | 454 | 78 % | 7 % | 9 % | 20 % | 56 % |
| Saint-Marc Ouest | H | 1246 | 80 % | 9 % | 7 % | 7 % | 92 % |
| Richarderie-Côte d'Amour | H | 496 | 82 % | 2 % | 9 % | 19 % | 66 % |
| Saint-Marc Est | H | 1755 | 82 % | 6 % | 4 % | 7 % | 88 % |
| Villeneuve | H | 1265 | 84 % | 8 % | 4 % | 8 % | 84 % |
| Immaculée Bourg | H | 1505 | 85 % | 4 % | 4 % | 7 % | 84 % |
| Immaculée Campagne | H | 1022 | 86 % | 3 % | 3 % | 4 % | 88 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Saint-Nazaire | 83 % | 38 % | 69 % | 67 % | 77 % | 73 % | 43 % | 62 % | 82 % | 5 % | 74 % |
| La Baule-Escoublac | 51 % | 14 % | 42 % | 48 % | 35 % | 38 % | 95 % | 26 % | 0 % | 63 % | 0 % |
| Guérande | 39 % | 20 % | 32 % | 38 % | 34 % | 45 % | 11 % | 22 % | 0 % | 81 % | 0 % |
| Saint-Brevin-les-Pins | 45 % | 24 % | 35 % | 21 % | 22 % | 33 % | 0 % | 6 % | 0 % | 82 % | 0 % |
| Pornichet | 59 % | 16 % | 37 % | 51 % | 52 % | 31 % | 42 % | 26 % | 0 % | 40 % | 0 % |
| Donges | 34 % | 27 % | 18 % | 26 % | 27 % | 53 % | 39 % | 18 % | 1 % | 36 % | 0 % |
| Trignac | 53 % | 44 % | 53 % | 26 % | 53 % | 41 % | 77 % | 30 % | 66 % | 26 % | 61 % |

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

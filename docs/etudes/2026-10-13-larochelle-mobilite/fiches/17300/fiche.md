# Fiche mobilité · La Rochelle (17300)

Générée le 2026-10-13T10:41:34Z · jour de référence 2026-10-13 · voisines : Lagord, Puilboreau, Aytré, Périgny, Châtelaillon-Plage

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.048, "bas": 0.043, "haut": 0.055, "lignes": 9427, "n_eff": 4957}, "marche": {"p": 0.105, "bas": 0.097, "haut": 0.114, "lignes": 9427, "n_eff": 4957}, "velo": {"p": 0.177, "bas": 0.166, "haut": 0.187, "lignes": 9427, "n_eff": 4957}, "deux_roues_mot": {"p": 0.02, "bas": 0.016, "haut": 0.024, "lignes": 9427, "n_eff": 4957}, "voiture": {"p": 0.533, "bas": 0.519, "haut": 0.547, "lignes": 9427, "n_eff": 4957}, "tc": {"p": 0.117, "bas": 0.108, "haut": 0.126, "lignes": 9427, "n_eff": 4957}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5328) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.699, "bas": 0.686, "haut": 0.712, "lignes": 9427, "n_eff": 4957}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.441, "bas": 0.424, "haut": 0.457, "lignes": 6500, "n_eff": 3442}, "communes_voisines": {"p": 0.732, "bas": 0.697, "haut": 0.764, "lignes": 1296, "n_eff": 657}, "ailleurs": {"p": 0.747, "bas": 0.725, "haut": 0.768, "lignes": 2927, "n_eff": 1515}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Lagord, Puilboreau, Aytré, Périgny, Châtelaillon-Plage

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.134, "bas": 0.125, "haut": 0.144, "lignes": 9427, "n_eff": 4957}, "actifs_menage_2_voitures_plus": {"p": 0.313, "bas": 0.3, "haut": 0.326, "lignes": 9427, "n_eff": 4957}, "menage_motorise_mais_pas_en_voiture": {"p": 0.402, "bas": 0.387, "haut": 0.417, "lignes": 7957, "n_eff": 4196}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.543, "bas": 0.52, "haut": 0.566, "lignes": 3061, "n_eff": 1769}, "velo": {"p": 0.223, "bas": 0.205, "haut": 0.243, "lignes": 3061, "n_eff": 1769}, "menage_sans_voiture": {"p": 0.042, "bas": 0.033, "haut": 0.052, "lignes": 3061, "n_eff": 1769}, "menage_2_voitures_plus": {"p": 0.472, "bas": 0.449, "haut": 0.495, "lignes": 3061, "n_eff": 1769}}, "locataires_prive": {"voiture": {"p": 0.493, "bas": 0.471, "haut": 0.515, "lignes": 4006, "n_eff": 1945}, "velo": {"p": 0.179, "bas": 0.162, "haut": 0.196, "lignes": 4006, "n_eff": 1945}, "menage_sans_voiture": {"p": 0.203, "bas": 0.185, "haut": 0.221, "lignes": 4006, "n_eff": 1945}, "menage_2_voitures_plus": {"p": 0.226, "bas": 0.208, "haut": 0.245, "lignes": 4006, "n_eff": 1945}}, "locataires_hlm": {"voiture": {"p": 0.608, "bas": 0.578, "haut": 0.636, "lignes": 2043, "n_eff": 1104}, "velo": {"p": 0.109, "bas": 0.092, "haut": 0.128, "lignes": 2043, "n_eff": 1104}, "menage_sans_voiture": {"p": 0.194, "bas": 0.172, "haut": 0.218, "lignes": 2043, "n_eff": 1104}, "menage_2_voitures_plus": {"p": 0.21, "bas": 0.187, "haut": 0.235, "lignes": 2043, "n_eff": 1104}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 50601, "habitent_la_commune": {"part_des_emplois": 0.422, "voiture": {"p": 0.441, "bas": 0.424, "haut": 0.457, "lignes": 6500, "n_eff": 3442}, "tc": {"p": 0.109, "bas": 0.099, "haut": 0.119, "lignes": 6500, "n_eff": 3442}}, "reste_unite_urbaine": {"part_des_emplois": 0.181, "voiture": {"p": 0.77, "bas": 0.745, "haut": 0.792, "lignes": 1823, "n_eff": 1213}, "tc": {"p": 0.076, "bas": 0.062, "haut": 0.092, "lignes": 1823, "n_eff": 1213}}, "hors_unite_urbaine": {"part_des_emplois": 0.397, "voiture": {"p": 0.905, "bas": 0.894, "haut": 0.916, "lignes": 4209, "n_eff": 2734}, "tc": {"p": 0.055, "bas": 0.047, "haut": 0.065, "lignes": 4209, "n_eff": 2734}}}`

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

**Valeur** : `{"min": 0.273, "iris_min": "Centre Préfecture", "max": 0.708, "iris_max": "Villeneuve des Salines Ouest", "iris_habitat": 30}`

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

**Valeur** : `{"iris": 0.533, "mobpro": 0.533}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.265, "menages_2_voitures_plus": 0.165, "menages_stationnement_reserve": 0.511}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.92, "grande_surface_500m": 0.499, "pharmacie_500m": 0.774, "medecin_generaliste_500m": 0.858, "ecole_elementaire_500m": 0.684, "college_1km": 0.735, "gare_2km": 0.722, "panier_quotidien_500m": 0.563, "bus_8h_7_9h": 0.861, "aucun_bus_7_9h": 0.021, "bus_4h_20_22h": 0.76}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Yélo » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lro-nva-m-1), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20261007', '20270430']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.288, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.554, "ecart": 0.734, "stations": 21}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.129, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.631, "ecart": 0.498, "stations": 18}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 22 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| La Rochelle | 70 % | 44 % | 22 % | 11 % | 14 % | 6500 (ok) |
| Périgny | 5 % | 74 % | 14 % | 7 % | 2 % | 466 (ok) |
| Aytré | 3 % | 72 % | 12 % | 10 % | 2 % | 344 (ok) |
| Lagord | 2 % | 69 % | 15 % | 12 % | 3 % | 210 (ok) |
| Puilboreau | 2 % | 72 % | 13 % | 12 % | 1 % | 212 (ok) |
| Niort | 2 % | 68 % | 1 % | 30 % | 1 % | 151 (ok) |
| Rochefort | 2 % | 82 % | 2 % | 15 % | 0 % | 142 (fragile) |
| Angoulins | 1 % | 87 % | 3 % | 10 % | 0 % | 77 (fragile) |
| Saint-Martin-de-Ré | 1 % | 96 % | 0 % | 2 % | 0 % | 75 (fragile) |
| Châtelaillon-Plage | 1 % | 90 % | 0 % | 9 % | 0 % | 64 (fragile) |
| Dompierre-sur-Mer | 1 % | 88 % | 5 % | 5 % | 0 % | 59 (fragile) |
| Marans | 0 % | 92 % | 2 % | 5 % | 0 % | 46 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Centre Préfecture | H | 1292 | 27 % | 18 % | 16 % | 46 % | 17 % |
| Centre Mairie | H | 853 | 29 % | 18 % | 18 % | 43 % | 14 % |
| Centre Marché | H | 987 | 29 % | 22 % | 11 % | 40 % | 16 % |
| Centre Hôpital | H | 1451 | 41 % | 22 % | 10 % | 28 % | 58 % |
| La Genette Parcs | H | 433 | 45 % | 25 % | 14 % | 28 % | 55 % |
| Les Minimes Université | H | 1576 | 46 % | 13 % | 16 % | 41 % | 64 % |
| Beauregard | H | 901 | 47 % | 14 % | 15 % | 12 % | 88 % |
| La Genette Le Mail | H | 1534 | 48 % | 26 % | 9 % | 17 % | 60 % |
| Fétilly-La Trompette | H | 1308 | 50 % | 32 % | 4 % | 11 % | 61 % |
| Lafond | H | 1393 | 52 % | 21 % | 9 % | 18 % | 72 % |
| Chef de Baie | A | 109 | 53 % | 24 % | 14 % | 20 % | 73 % |
| Villeneuve des Salines Lac | H | 573 | 53 % | 9 % | 27 % | 30 % | 28 % |
| Mireuil Europe | H | 712 | 54 % | 10 % | 17 % | 41 % | 29 % |
| Les Minimes Tasdon | H | 2127 | 54 % | 23 % | 11 % | 19 % | 59 % |
| Port Neuf Ouest | H | 1075 | 54 % | 19 % | 13 % | 32 % | 34 % |
| Mireuil le Parc | H | 344 | 55 % | 12 % | 20 % | 40 % | 15 % |
| Saint-Éloi Sud | H | 1170 | 56 % | 22 % | 8 % | 16 % | 78 % |
| Le Prieuré | H | 625 | 57 % | 19 % | 6 % | 23 % | 61 % |
| Petit Marseille-Foire Exposition | H | 560 | 57 % | 25 % | 7 % | 8 % | 79 % |
| Les Minimes Port de Plaisance | H | 1109 | 58 % | 15 % | 13 % | 29 % | 59 % |
| Villeneuve des Salines Est | H | 780 | 59 % | 14 % | 13 % | 29 % | 26 % |
| Bel-Air | H | 784 | 59 % | 19 % | 6 % | 23 % | 39 % |
| Rossignolette-Saint-Maurice | H | 1009 | 60 % | 19 % | 12 % | 18 % | 60 % |
| Mireuil Ouest | H | 647 | 61 % | 10 % | 20 % | 21 % | 45 % |
| Port Neuf Est | H | 664 | 62 % | 14 % | 13 % | 25 % | 51 % |
| Saint-Éloi Nord | H | 1807 | 62 % | 19 % | 6 % | 14 % | 75 % |
| Mireuil Château d'Eau | H | 292 | 64 % | 10 % | 14 % | 41 % | 26 % |
| Mireuil Est | H | 1082 | 68 % | 6 % | 14 % | 31 % | 40 % |
| La Pallice | H | 1135 | 68 % | 8 % | 11 % | 24 % | 42 % |
| Laleu | H | 1471 | 69 % | 10 % | 9 % | 21 % | 61 % |
| Villeneuve des Salines Ouest | H | 747 | 71 % | 9 % | 13 % | 28 % | 26 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| La Rochelle | 92 % | 50 % | 77 % | 86 % | 68 % | 74 % | 72 % | 56 % | 86 % | 2 % | 76 % |
| Lagord | 60 % | 43 % | 47 % | 50 % | 45 % | 16 % | 52 % | 31 % | 45 % | 4 % | 24 % |
| Puilboreau | 78 % | 21 % | 39 % | 50 % | 33 % | 11 % | 7 % | 23 % | 13 % | 12 % | 16 % |
| Aytré | 66 % | 29 % | 28 % | 39 % | 43 % | 65 % | 91 % | 26 % | 61 % | 11 % | 65 % |
| Périgny | 70 % | 2 % | 34 % | 43 % | 48 % | 8 % | 0 % | 22 % | 43 % | 2 % | 18 % |
| Châtelaillon-Plage | 65 % | 0 % | 44 % | 63 % | 52 % | 60 % | 91 % | 34 % | 17 % | 11 % | 0 % |

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

# Fiche mobilité · Toulouse (31555)

Générée le 2026-10-15T15:54:32Z · jour de référence 2026-10-13 · voisines : Colomiers, Tournefeuille, Blagnac, Muret, Cugnaux, Plaisance-du-Touch

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.035, "bas": 0.033, "haut": 0.037, "lignes": 69248, "n_eff": 35547}, "marche": {"p": 0.075, "bas": 0.072, "haut": 0.078, "lignes": 69248, "n_eff": 35547}, "velo": {"p": 0.121, "bas": 0.118, "haut": 0.124, "lignes": 69248, "n_eff": 35547}, "deux_roues_mot": {"p": 0.025, "bas": 0.023, "haut": 0.027, "lignes": 69248, "n_eff": 35547}, "voiture": {"p": 0.465, "bas": 0.46, "haut": 0.47, "lignes": 69248, "n_eff": 35547}, "tc": {"p": 0.28, "bas": 0.275, "haut": 0.284, "lignes": 69248, "n_eff": 35547}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.4649) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.765, "bas": 0.76, "haut": 0.769, "lignes": 69248, "n_eff": 35547}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.396, "bas": 0.39, "haut": 0.401, "lignes": 52995, "n_eff": 27231}, "communes_voisines": {"p": 0.657, "bas": 0.639, "haut": 0.675, "lignes": 5338, "n_eff": 2743}, "ailleurs": {"p": 0.69, "bas": 0.68, "haut": 0.7, "lignes": 16253, "n_eff": 8316}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Colomiers, Tournefeuille, Blagnac, Muret, Cugnaux, Plaisance-du-Touch

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.197, "bas": 0.193, "haut": 0.201, "lignes": 69248, "n_eff": 35547}, "actifs_menage_2_voitures_plus": {"p": 0.264, "bas": 0.26, "haut": 0.269, "lignes": 69248, "n_eff": 35547}, "menage_motorise_mais_pas_en_voiture": {"p": 0.447, "bas": 0.441, "haut": 0.453, "lignes": 54347, "n_eff": 28044}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.524, "bas": 0.515, "haut": 0.533, "lignes": 21633, "n_eff": 12301}, "velo": {"p": 0.166, "bas": 0.16, "haut": 0.173, "lignes": 21633, "n_eff": 12301}, "menage_sans_voiture": {"p": 0.062, "bas": 0.058, "haut": 0.067, "lignes": 21633, "n_eff": 12301}, "menage_2_voitures_plus": {"p": 0.402, "bas": 0.393, "haut": 0.41, "lignes": 21633, "n_eff": 12301}}, "locataires_prive": {"voiture": {"p": 0.419, "bas": 0.412, "haut": 0.426, "lignes": 36912, "n_eff": 18089}, "velo": {"p": 0.107, "bas": 0.103, "haut": 0.112, "lignes": 36912, "n_eff": 18089}, "menage_sans_voiture": {"p": 0.287, "bas": 0.28, "haut": 0.294, "lignes": 36912, "n_eff": 18089}, "menage_2_voitures_plus": {"p": 0.179, "bas": 0.174, "haut": 0.185, "lignes": 36912, "n_eff": 18089}}, "locataires_hlm": {"voiture": {"p": 0.487, "bas": 0.473, "haut": 0.502, "lignes": 9183, "n_eff": 4443}, "velo": {"p": 0.044, "bas": 0.038, "haut": 0.05, "lignes": 9183, "n_eff": 4443}, "menage_sans_voiture": {"p": 0.269, "bas": 0.256, "haut": 0.282, "lignes": 9183, "n_eff": 4443}, "menage_2_voitures_plus": {"p": 0.187, "bas": 0.175, "haut": 0.198, "lignes": 9183, "n_eff": 4443}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 352873, "habitent_la_commune": {"part_des_emplois": 0.51, "voiture": {"p": 0.396, "bas": 0.39, "haut": 0.401, "lignes": 52995, "n_eff": 27231}, "tc": {"p": 0.303, "bas": 0.298, "haut": 0.309, "lignes": 52995, "n_eff": 27231}}, "reste_unite_urbaine": {"part_des_emplois": 0.284, "voiture": {"p": 0.79, "bas": 0.784, "haut": 0.797, "lignes": 25871, "n_eff": 14671}, "tc": {"p": 0.127, "bas": 0.122, "haut": 0.133, "lignes": 25871, "n_eff": 14671}}, "hors_unite_urbaine": {"part_des_emplois": 0.206, "voiture": {"p": 0.841, "bas": 0.834, "haut": 0.848, "lignes": 15501, "n_eff": 9900}, "tc": {"p": 0.129, "bas": 0.122, "haut": 0.136, "lignes": 15501, "n_eff": 9900}}}`

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

**Valeur** : `{"min": 0.135, "iris_min": "Saint-Rome", "max": 0.742, "iris_max": "Saint-Simon Ouest", "iris_habitat": 146}`

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

**Valeur** : `{"iris": 0.465, "mobpro": 0.465}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.328, "menages_2_voitures_plus": 0.158, "menages_stationnement_reserve": 0.602}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.947, "grande_surface_500m": 0.669, "pharmacie_500m": 0.846, "medecin_generaliste_500m": 0.854, "ecole_elementaire_500m": 0.828, "college_1km": 0.804, "gare_2km": 0.747, "panier_quotidien_500m": 0.749, "bus_8h_7_9h": 0.0, "aucun_bus_7_9h": 1.0, "bus_4h_20_22h": 0.0}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS [nan, nan]

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.309, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.599, "ecart": 0.71, "stations": 71}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.179, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.667, "ecart": 0.511, "stations": 66}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 83 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Toulouse | 76 % | 40 % | 14 % | 30 % | 9 % | 52995 (ok) |
| Blagnac | 4 % | 58 % | 14 % | 24 % | 0 % | 2782 (ok) |
| Colomiers | 2 % | 70 % | 7 % | 19 % | 1 % | 1559 (ok) |
| Labège | 2 % | 67 % | 10 % | 19 % | 0 % | 1335 (ok) |
| Balma | 2 % | 60 % | 8 % | 29 % | 1 % | 1079 (ok) |
| Ramonville-Saint-Agne | 1 % | 57 % | 13 % | 28 % | 0 % | 505 (ok) |
| Portet-sur-Garonne | 0 % | 82 % | 2 % | 15 % | 0 % | 408 (ok) |
| L'Union | 0 % | 78 % | 4 % | 16 % | 1 % | 361 (ok) |
| Cugnaux | 0 % | 76 % | 6 % | 14 % | 1 % | 246 (ok) |
| Muret | 0 % | 88 % | 0 % | 11 % | 0 % | 305 (ok) |
| Quint-Fonsegrives | 0 % | 71 % | 7 % | 19 % | 1 % | 260 (ok) |
| Tournefeuille | 0 % | 75 % | 6 % | 15 % | 0 % | 273 (ok) |
| Montauban | 0 % | 74 % | 1 % | 24 % | 0 % | 266 (ok) |
| Castanet-Tolosan | 0 % | 62 % | 11 % | 23 % | 1 % | 195 (ok) |
| Cornebarrieu | 0 % | 80 % | 2 % | 14 % | 0 % | 205 (ok) |
| Saint-Jean | 0 % | 82 % | 5 % | 10 % | 0 % | 224 (ok) |
| Saint-Orens-de-Gameville | 0 % | 69 % | 4 % | 23 % | 1 % | 251 (ok) |
| Aucamville | 0 % | 67 % | 6 % | 23 % | 2 % | 139 (fragile) |
| Auzeville-Tolosane | 0 % | 53 % | 16 % | 27 % | 1 % | 130 (fragile) |
| Bruguières | 0 % | 92 % | 0 % | 5 % | 0 % | 105 (fragile) |
| Castelnau-d'Estrétefonds | 0 % | 95 % | 0 % | 4 % | 0 % | 106 (fragile) |
| Fenouillet | 0 % | 75 % | 2 % | 19 % | 1 % | 154 (ok) |
| Flourens | 0 % | 76 % | 2 % | 16 % | 0 % | 121 (fragile) |
| Plaisance-du-Touch | 0 % | 80 % | 1 % | 14 % | 0 % | 173 (ok) |
| Saint-Alban | 0 % | 88 % | 2 % | 7 % | 0 % | 119 (fragile) |
| Albi | 0 % | 67 % | 1 % | 29 % | 2 % | 95 (fragile) |
| Lavaur | 0 % | 91 % | 0 % | 9 % | 0 % | 118 (fragile) |
| Pamiers | 0 % | 73 % | 0 % | 24 % | 3 % | 62 (fragile) |
| Carcassonne | 0 % | 66 % | 1 % | 28 % | 3 % | 52 (fragile) |
| Auterive | 0 % | 87 % | 0 % | 12 % | 1 % | 56 (fragile) |
| Beauzelle | 0 % | 70 % | 3 % | 23 % | 0 % | 74 (fragile) |
| Escalquens | 0 % | 81 % | 6 % | 13 % | 0 % | 90 (fragile) |
| Grenade | 0 % | 94 % | 0 % | 4 % | 2 % | 56 (fragile) |
| Launaguet | 0 % | 83 % | 2 % | 12 % | 3 % | 97 (fragile) |
| Lespinasse | 0 % | 90 % | 0 % | 7 % | 0 % | 65 (fragile) |
| Montrabé | 0 % | 76 % | 6 % | 16 % | 1 % | 96 (fragile) |
| Roques | 0 % | 79 % | 2 % | 15 % | 0 % | 90 (fragile) |
| Rouffiac-Tolosan | 0 % | 73 % | 9 % | 8 % | 5 % | 51 (fragile) |
| Sainte-Foy-d'Aigrefeuille | 0 % | 87 % | 1 % | 3 % | 2 % | 42 (fragile) |
| Saint-Jory | 0 % | 82 % | 1 % | 13 % | 0 % | 86 (fragile) |
| Seysses | 0 % | 86 % | 4 % | 10 % | 0 % | 40 (fragile) |
| Villefranche-de-Lauragais | 0 % | 79 % | 0 % | 21 % | 0 % | 58 (fragile) |
| Villeneuve-lès-Bouloc | 0 % | 91 % | 0 % | 7 % | 0 % | 49 (fragile) |
| Villeneuve-Tolosane | 0 % | 72 % | 0 % | 26 % | 2 % | 78 (fragile) |
| Auch | 0 % | 84 % | 0 % | 10 % | 3 % | 45 (fragile) |
| L'Isle-Jourdain | 0 % | 82 % | 0 % | 18 % | 0 % | 57 (fragile) |
| Bordeaux | 0 % | 56 % | 3 % | 41 % | 0 % | 43 (fragile) |
| Castres | 0 % | 77 % | 0 % | 22 % | 0 % | 72 (fragile) |
| 99999 | 0 % | 44 % | 5 % | 27 % | 4 % | 73 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Saint-Rome | H | 1642 | 14 % | 15 % | 34 % | 60 % | 23 % |
| La Grave | H | 837 | 16 % | 23 % | 40 % | 60 % | 20 % |
| Filatiers | H | 1349 | 17 % | 14 % | 34 % | 55 % | 26 % |
| Croix Baragnon | H | 915 | 17 % | 16 % | 32 % | 55 % | 16 % |
| Jacobins | H | 1169 | 19 % | 14 % | 29 % | 67 % | 18 % |
| Saint-Sernin | H | 1815 | 19 % | 20 % | 33 % | 59 % | 28 % |
| Valade | H | 757 | 20 % | 15 % | 29 % | 66 % | 19 % |
| Colombette | H | 1223 | 21 % | 14 % | 37 % | 56 % | 22 % |
| Raymond IV | H | 1588 | 22 % | 15 % | 39 % | 46 % | 32 % |
| Gabriel Péri | H | 1819 | 23 % | 12 % | 39 % | 54 % | 34 % |
| Wilson | H | 990 | 23 % | 12 % | 33 % | 59 % | 17 % |
| Occitane | H | 1070 | 23 % | 14 % | 39 % | 51 % | 38 % |
| Belfort | H | 1931 | 23 % | 12 % | 41 % | 61 % | 22 % |
| Teinturiers | H | 1271 | 24 % | 21 % | 36 % | 43 % | 39 % |
| La Gloire | H | 1257 | 24 % | 18 % | 35 % | 46 % | 24 % |
| Taur | H | 986 | 25 % | 14 % | 34 % | 60 % | 17 % |
| Dalbade | H | 1586 | 26 % | 13 % | 37 % | 54 % | 24 % |
| Honoré Serres | H | 1588 | 26 % | 23 % | 28 % | 49 % | 30 % |
| 10 Avril | H | 1365 | 27 % | 15 % | 43 % | 38 % | 50 % |
| Dupuy | H | 1936 | 28 % | 18 % | 33 % | 46 % | 32 % |
| Observatoire | H | 758 | 28 % | 2 % | 61 % | 44 % | 21 % |
| Ozenne | H | 1029 | 28 % | 15 % | 26 % | 39 % | 31 % |
| Concorde | H | 2348 | 28 % | 21 % | 25 % | 44 % | 25 % |
| Saint-Léon | H | 1560 | 29 % | 14 % | 46 % | 52 % | 47 % |
| Sébastopol | H | 1216 | 30 % | 8 % | 38 % | 53 % | 43 % |
| Camille Pujol | H | 2497 | 30 % | 18 % | 27 % | 44 % | 45 % |
| Sainte-Lucie | H | 1533 | 31 % | 23 % | 34 % | 36 % | 52 % |
| Notre-Dame | H | 1876 | 31 % | 13 % | 44 % | 46 % | 51 % |
| Hôtel de Région | H | 2114 | 32 % | 17 % | 36 % | 34 % | 72 % |
| Déodat de Séverac | H | 2015 | 32 % | 18 % | 39 % | 36 % | 61 % |
| Paul Sabatier | H | 1160 | 32 % | 6 % | 48 % | 65 % | 28 % |
| École Normale | H | 1094 | 33 % | 24 % | 28 % | 37 % | 65 % |
| Roguet | H | 1323 | 33 % | 19 % | 37 % | 27 % | 56 % |
| Antonio Machado | H | 449 | 34 % | 2 % | 51 % | 62 % | 31 % |
| Jardin des Plantes | H | 1149 | 34 % | 24 % | 22 % | 37 % | 46 % |
| Ravelin | H | 2147 | 34 % | 18 % | 35 % | 38 % | 57 % |
| Arènes | H | 2588 | 34 % | 9 % | 49 % | 43 % | 60 % |
| Caravelle | H | 1925 | 34 % | 6 % | 50 % | 32 % | 80 % |
| Arago | H | 1071 | 35 % | 13 % | 37 % | 42 % | 47 % |
| Barrière de Bayonne | H | 1630 | 35 % | 17 % | 37 % | 29 % | 75 % |
| Ramier | H | 227 | 35 % | 5 % | 50 % | 66 % | 35 % |
| Héraclès | H | 2804 | 35 % | 21 % | 25 % | 36 % | 58 % |
| Poudrerie | H | 1252 | 35 % | 4 % | 56 % | 48 % | 28 % |
| Avions | H | 821 | 36 % | 15 % | 36 % | 27 % | 56 % |
| Daste | H | 943 | 37 % | 13 % | 42 % | 54 % | 32 % |
| Chapou | H | 1437 | 37 % | 20 % | 24 % | 57 % | 45 % |
| Marvig | H | 1140 | 37 % | 13 % | 40 % | 39 % | 34 % |
| Bourbaki | H | 1004 | 38 % | 15 % | 40 % | 37 % | 38 % |
| Montplaisir | H | 1687 | 38 % | 25 % | 17 % | 32 % | 49 % |
| Mazades | H | 1261 | 38 % | 22 % | 27 % | 39 % | 47 % |
| Serres Municipales | H | 603 | 38 % | 18 % | 26 % | 36 % | 49 % |
| Louis Vitet | H | 2015 | 39 % | 23 % | 20 % | 33 % | 62 % |
| Providence | H | 1522 | 39 % | 23 % | 18 % | 23 % | 47 % |
| Frédéric Estèbe | H | 1224 | 39 % | 14 % | 31 % | 33 % | 58 % |
| Caserne Niel | H | 2744 | 40 % | 16 % | 32 % | 34 % | 62 % |
| Bonnat | H | 874 | 40 % | 14 % | 39 % | 34 % | 42 % |
| Périole | H | 1962 | 40 % | 12 % | 32 % | 31 % | 49 % |
| Fontaine Lestang | H | 1371 | 41 % | 21 % | 31 % | 26 % | 67 % |
| Branly | H | 1591 | 41 % | 23 % | 20 % | 26 % | 70 % |
| Raynal | H | 2376 | 41 % | 18 % | 24 % | 32 % | 59 % |
| Marché aux Cochons | H | 1868 | 41 % | 15 % | 30 % | 28 % | 64 % |
| Cartoucherie | H | 4695 | 42 % | 10 % | 39 % | 36 % | 60 % |
| Chaussas | H | 1896 | 42 % | 11 % | 31 % | 22 % | 85 % |
| Poulenc | H | 358 | 42 % | 2 % | 41 % | 49 % | 22 % |
| Nègreneys | H | 2460 | 43 % | 19 % | 21 % | 35 % | 71 % |
| Bourrassol | H | 1692 | 43 % | 22 % | 26 % | 28 % | 75 % |
| Vestrepain | H | 510 | 43 % | 11 % | 40 % | 32 % | 57 % |
| Italie | H | 1140 | 43 % | 18 % | 32 % | 26 % | 62 % |
| Bécanne | H | 1143 | 43 % | 23 % | 24 % | 24 % | 67 % |
| Les Maraîchers | H | 1095 | 43 % | 15 % | 27 % | 30 % | 72 % |
| Les Fontaines | H | 1091 | 43 % | 20 % | 25 % | 24 % | 81 % |
| Louis Plana | H | 984 | 44 % | 7 % | 39 % | 30 % | 67 % |
| Heredia | H | 1097 | 44 % | 14 % | 29 % | 26 % | 70 % |
| Bigorre | H | 716 | 44 % | 1 % | 49 % | 35 % | 38 % |
| Mendès France | H | 1074 | 44 % | 16 % | 22 % | 27 % | 73 % |
| Bazacle | H | 1733 | 44 % | 14 % | 25 % | 33 % | 72 % |
| Bonhoure | H | 1667 | 45 % | 19 % | 22 % | 20 % | 64 % |
| Édouard Bouillères | H | 1071 | 45 % | 1 % | 39 % | 42 % | 32 % |
| Latécoère | A | 3345 | 45 % | 9 % | 29 % | 43 % | 53 % |
| Biarritz | H | 1581 | 46 % | 19 % | 25 % | 19 % | 74 % |
| La Digue | H | 1060 | 46 % | 15 % | 30 % | 26 % | 67 % |
| Jules Julien | H | 2025 | 46 % | 14 % | 33 % | 39 % | 70 % |
| Lespinet | H | 1160 | 46 % | 28 % | 17 % | 31 % | 74 % |
| Ancely | H | 1545 | 47 % | 13 % | 28 % | 27 % | 48 % |
| La Salade | H | 3526 | 47 % | 10 % | 34 % | 34 % | 74 % |
| Morvan | H | 321 | 47 % | 1 % | 42 % | 42 % | 16 % |
| Réservoir | H | 960 | 48 % | 14 % | 29 % | 18 % | 63 % |
| Michoum | H | 2046 | 49 % | 5 % | 36 % | 19 % | 84 % |
| Cité Amouroux | H | 1503 | 49 % | 8 % | 32 % | 25 % | 78 % |
| Coin de la Moure | H | 1492 | 49 % | 16 % | 19 % | 23 % | 53 % |
| Van Gogh | H | 370 | 49 % | 12 % | 25 % | 36 % | 26 % |
| Flambère | H | 2314 | 49 % | 8 % | 33 % | 30 % | 85 % |
| Saint-Exupéry | H | 1307 | 49 % | 20 % | 16 % | 19 % | 79 % |
| Fenouillet | H | 1860 | 50 % | 12 % | 31 % | 24 % | 75 % |
| Tellier | H | 637 | 51 % | 12 % | 29 % | 32 % | 58 % |
| Patinoire de la Fraternité | H | 1339 | 51 % | 4 % | 33 % | 30 % | 71 % |
| Lapujade | H | 2104 | 52 % | 15 % | 26 % | 26 % | 71 % |
| Les Izards | H | 2768 | 52 % | 2 % | 40 % | 34 % | 75 % |
| Lestang | H | 366 | 52 % | 4 % | 29 % | 37 % | 13 % |
| Milan | H | 857 | 53 % | 4 % | 23 % | 34 % | 46 % |
| Courrège | H | 1223 | 53 % | 14 % | 15 % | 16 % | 65 % |
| Lambert | H | 462 | 53 % | 5 % | 35 % | 38 % | 26 % |
| Jean Chaubet | H | 1096 | 54 % | 12 % | 23 % | 17 % | 70 % |
| Tel Aviv | H | 504 | 54 % | 0 % | 28 % | 35 % | 27 % |
| Borderouge Nord | H | 4460 | 54 % | 5 % | 32 % | 30 % | 79 % |
| Deltour | H | 1257 | 54 % | 18 % | 16 % | 10 % | 85 % |
| Surcouf | H | 755 | 54 % | 5 % | 30 % | 26 % | 56 % |
| Borderouge Sud-Ouest | H | 2580 | 54 % | 9 % | 28 % | 20 % | 94 % |
| Coquille | H | 917 | 55 % | 10 % | 29 % | 25 % | 74 % |
| Loire | H | 392 | 55 % | 5 % | 29 % | 34 % | 19 % |
| Ponts Jumeaux | H | 3350 | 55 % | 9 % | 22 % | 24 % | 77 % |
| Touraine | H | 745 | 55 % | 7 % | 27 % | 24 % | 66 % |
| Bitet | H | 833 | 56 % | 8 % | 24 % | 17 % | 68 % |
| Salade Ponsan | H | 924 | 56 % | 18 % | 18 % | 29 % | 87 % |
| Borderouge Sud-Est | H | 1103 | 56 % | 13 % | 22 % | 9 % | 95 % |
| La Pointe | H | 1179 | 56 % | 17 % | 20 % | 20 % | 70 % |
| Hippodrome | H | 1445 | 56 % | 10 % | 26 % | 26 % | 78 % |
| Goya | H | 704 | 56 % | 3 % | 27 % | 42 % | 22 % |
| Auriacombe | H | 449 | 56 % | 1 % | 38 % | 52 % | 26 % |
| Fondeyre | A | 904 | 57 % | 12 % | 20 % | 21 % | 84 % |
| Gramont | A | 639 | 57 % | 3 % | 21 % | 13 % | 85 % |
| Embouchure | H | 1797 | 57 % | 17 % | 16 % | 17 % | 74 % |
| Coteaux de Pech David | H | 2220 | 57 % | 14 % | 20 % | 37 % | 56 % |
| Nicol | H | 3602 | 57 % | 7 % | 26 % | 19 % | 88 % |
| Cité de l'Hers | H | 944 | 58 % | 4 % | 28 % | 28 % | 40 % |
| Mal Clabel | H | 1266 | 58 % | 9 % | 22 % | 21 % | 83 % |
| Les Vergers | H | 548 | 59 % | 3 % | 32 % | 40 % | 15 % |
| Les Capelles | H | 1628 | 59 % | 12 % | 17 % | 20 % | 73 % |
| Troènes | H | 1732 | 60 % | 14 % | 14 % | 14 % | 81 % |
| Leygue | H | 745 | 60 % | 13 % | 12 % | 18 % | 62 % |
| Louis Breguet | H | 2021 | 60 % | 8 % | 22 % | 22 % | 72 % |
| Bordelongue | H | 497 | 62 % | 0 % | 33 % | 28 % | 24 % |
| Charbonnière | H | 1081 | 62 % | 13 % | 16 % | 18 % | 80 % |
| Roucoule | H | 2422 | 63 % | 5 % | 23 % | 13 % | 89 % |
| Grand Selve | H | 2692 | 63 % | 4 % | 25 % | 22 % | 82 % |
| Sainte-Claire | H | 2032 | 64 % | 9 % | 16 % | 12 % | 90 % |
| Basso Cambo | H | 2160 | 64 % | 5 % | 21 % | 12 % | 90 % |
| Ramelet Moundi | H | 1859 | 64 % | 10 % | 14 % | 16 % | 80 % |
| Marcaissonne | A | 2211 | 66 % | 5 % | 21 % | 21 % | 78 % |
| Bois de Limayrac | H | 1286 | 66 % | 7 % | 15 % | 13 % | 86 % |
| Mermoz | H | 540 | 67 % | 1 % | 26 % | 45 % | 50 % |
| Pouvourville | H | 1995 | 67 % | 7 % | 13 % | 17 % | 87 % |
| Lalande Sud | H | 2477 | 67 % | 7 % | 21 % | 14 % | 90 % |
| Aérospatiale | A | 1422 | 67 % | 4 % | 15 % | 12 % | 88 % |
| Gironis | H | 2144 | 68 % | 3 % | 21 % | 19 % | 76 % |
| Sauvegrain | H | 2128 | 69 % | 9 % | 14 % | 12 % | 84 % |
| Ferdinand de Lesseps | H | 1123 | 70 % | 2 % | 17 % | 28 % | 64 % |
| Fleurance | H | 3117 | 70 % | 8 % | 11 % | 12 % | 89 % |
| Saint-Simon Est | H | 3024 | 72 % | 8 % | 11 % | 10 % | 88 % |
| Lalande Nord | H | 6598 | 72 % | 3 % | 18 % | 13 % | 91 % |
| Saint-Simon Ouest | H | 2972 | 74 % | 6 % | 12 % | 10 % | 92 % |
| Ginestous | A | 542 | 75 % | 2 % | 11 % | 9 % | 94 % |
| Zones d'Activités Sud | A | 452 | 77 % | 2 % | 12 % | 9 % | 88 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Toulouse | 95 % | 67 % | 85 % | 85 % | 83 % | 80 % | 75 % | 75 % | 0 % | 100 % | 0 % |
| Colomiers | 64 % | 43 % | 44 % | 50 % | 56 % | 83 % | 98 % | 33 % | 0 % | 100 % | 0 % |
| Tournefeuille | 62 % | 26 % | 45 % | 50 % | 39 % | 61 % | 36 % | 24 % | 0 % | 100 % | 0 % |
| Blagnac | 85 % | 61 % | 68 % | 68 % | 55 % | 77 % | 0 % | 38 % | 0 % | 100 % | 0 % |
| Muret | 61 % | 37 % | 58 % | 53 % | 48 % | 67 % | 73 % | 36 % | 0 % | 100 % | 0 % |
| Cugnaux | 74 % | 24 % | 48 % | 48 % | 47 % | 44 % | 0 % | 30 % | 0 % | 100 % | 0 % |
| Plaisance-du-Touch | 44 % | 24 % | 30 % | 24 % | 34 % | 46 % | 0 % | 23 % | 0 % | 100 % | 0 % |

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

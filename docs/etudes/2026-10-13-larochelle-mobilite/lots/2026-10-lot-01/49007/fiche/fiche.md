# Fiche mobilité · Angers (49007)

Générée le 2026-10-14T14:24:22Z · jour de référence 2026-10-13 · voisines : Trélazé, Avrillé, Les Ponts-de-Cé, Saint-Barthélemy-d'Anjou, Verrières-en-Anjou, Bouchemaine

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.038, "bas": 0.034, "haut": 0.042, "lignes": 19548, "n_eff": 10795}, "marche": {"p": 0.126, "bas": 0.12, "haut": 0.132, "lignes": 19548, "n_eff": 10795}, "velo": {"p": 0.114, "bas": 0.109, "haut": 0.121, "lignes": 19548, "n_eff": 10795}, "deux_roues_mot": {"p": 0.014, "bas": 0.012, "haut": 0.016, "lignes": 19548, "n_eff": 10795}, "voiture": {"p": 0.538, "bas": 0.528, "haut": 0.547, "lignes": 19548, "n_eff": 10795}, "tc": {"p": 0.17, "bas": 0.163, "haut": 0.177, "lignes": 19548, "n_eff": 10795}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.5376) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.669, "bas": 0.66, "haut": 0.678, "lignes": 19548, "n_eff": 10795}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.441, "bas": 0.429, "haut": 0.452, "lignes": 12990, "n_eff": 7208}, "communes_voisines": {"p": 0.759, "bas": 0.732, "haut": 0.783, "lignes": 1955, "n_eff": 1053}, "ailleurs": {"p": 0.734, "bas": 0.719, "haut": 0.748, "lignes": 6558, "n_eff": 3588}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Trélazé, Avrillé, Les Ponts-de-Cé, Saint-Barthélemy-d'Anjou, Verrières-en-Anjou, Bouchemaine

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.144, "bas": 0.138, "haut": 0.151, "lignes": 19548, "n_eff": 10795}, "actifs_menage_2_voitures_plus": {"p": 0.317, "bas": 0.309, "haut": 0.326, "lignes": 19548, "n_eff": 10795}, "menage_motorise_mais_pas_en_voiture": {"p": 0.388, "bas": 0.378, "haut": 0.398, "lignes": 16314, "n_eff": 9022}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.566, "bas": 0.551, "haut": 0.582, "lignes": 6725, "n_eff": 3853}, "velo": {"p": 0.159, "bas": 0.148, "haut": 0.171, "lignes": 6725, "n_eff": 3853}, "menage_sans_voiture": {"p": 0.039, "bas": 0.033, "haut": 0.045, "lignes": 6725, "n_eff": 3853}, "menage_2_voitures_plus": {"p": 0.456, "bas": 0.44, "haut": 0.472, "lignes": 6725, "n_eff": 3853}}, "locataires_prive": {"voiture": {"p": 0.504, "bas": 0.488, "haut": 0.519, "lignes": 7464, "n_eff": 4033}, "velo": {"p": 0.111, "bas": 0.102, "haut": 0.121, "lignes": 7464, "n_eff": 4033}, "menage_sans_voiture": {"p": 0.212, "bas": 0.2, "haut": 0.225, "lignes": 7464, "n_eff": 4033}, "menage_2_voitures_plus": {"p": 0.247, "bas": 0.234, "haut": 0.261, "lignes": 7464, "n_eff": 4033}}, "locataires_hlm": {"voiture": {"p": 0.573, "bas": 0.554, "haut": 0.592, "lignes": 4789, "n_eff": 2596}, "velo": {"p": 0.056, "bas": 0.048, "haut": 0.066, "lignes": 4789, "n_eff": 2596}, "menage_sans_voiture": {"p": 0.219, "bas": 0.204, "haut": 0.235, "lignes": 4789, "n_eff": 2596}, "menage_2_voitures_plus": {"p": 0.233, "bas": 0.217, "haut": 0.249, "lignes": 4789, "n_eff": 2596}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 93506, "habitent_la_commune": {"part_des_emplois": 0.459, "voiture": {"p": 0.441, "bas": 0.429, "haut": 0.452, "lignes": 12990, "n_eff": 7208}, "tc": {"p": 0.163, "bas": 0.155, "haut": 0.172, "lignes": 12990, "n_eff": 7208}}, "reste_unite_urbaine": {"part_des_emplois": 0.169, "voiture": {"p": 0.796, "bas": 0.78, "haut": 0.812, "lignes": 4093, "n_eff": 2382}, "tc": {"p": 0.12, "bas": 0.107, "haut": 0.134, "lignes": 4093, "n_eff": 2382}}, "hors_unite_urbaine": {"part_des_emplois": 0.373, "voiture": {"p": 0.873, "bas": 0.864, "haut": 0.882, "lignes": 8435, "n_eff": 5125}, "tc": {"p": 0.1, "bas": 0.092, "haut": 0.108, "lignes": 8435, "n_eff": 5125}}}`

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

**Valeur** : `{"min": 0.272, "iris_min": "Voltaire", "max": 0.76, "iris_max": "Croix Blanche", "iris_habitat": 58}`

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

**Valeur** : `{"iris": 0.538, "mobpro": 0.538}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.28, "menages_2_voitures_plus": 0.176, "menages_stationnement_reserve": 0.544}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.942, "grande_surface_500m": 0.632, "pharmacie_500m": 0.799, "medecin_generaliste_500m": 0.885, "ecole_elementaire_500m": 0.896, "college_1km": 0.861, "gare_2km": 0.686, "panier_quotidien_500m": 0.75, "bus_8h_7_9h": 0.958, "aucun_bus_7_9h": 0.013, "bus_4h_20_22h": 0.908}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20260929', '20270702']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.325, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.57, "ecart": 0.754, "stations": 24}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.157, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.649, "ecart": 0.508, "stations": 24}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 28 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Angers | 67 % | 44 % | 15 % | 16 % | 18 % | 12990 (ok) |
| Beaucouzé | 3 % | 76 % | 7 % | 14 % | 1 % | 592 (ok) |
| Saint-Barthélemy-d'Anjou | 3 % | 75 % | 9 % | 10 % | 4 % | 538 (ok) |
| Trélazé | 2 % | 74 % | 10 % | 14 % | 0 % | 364 (ok) |
| Avrillé | 2 % | 71 % | 7 % | 17 % | 3 % | 347 (ok) |
| Verrières-en-Anjou | 2 % | 78 % | 4 % | 14 % | 0 % | 331 (ok) |
| Les Ponts-de-Cé | 2 % | 81 % | 9 % | 9 % | 0 % | 291 (ok) |
| Nantes | 1 % | 36 % | 1 % | 61 % | 1 % | 219 (ok) |
| Écouflant | 1 % | 79 % | 9 % | 5 % | 3 % | 200 (ok) |
| Sainte-Gemmes-sur-Loire | 1 % | 73 % | 15 % | 8 % | 2 % | 159 (ok) |
| Cholet | 1 % | 62 % | 0 % | 32 % | 2 % | 135 (fragile) |
| Loire-Authion | 1 % | 90 % | 0 % | 7 % | 1 % | 113 (fragile) |
| Brissac Loire Aubance | 0 % | 93 % | 2 % | 4 % | 2 % | 93 (fragile) |
| Montreuil-Juigné | 0 % | 80 % | 4 % | 13 % | 1 % | 94 (fragile) |
| Segré-en-Anjou Bleu | 0 % | 95 % | 2 % | 2 % | 0 % | 96 (fragile) |
| Le Mans | 0 % | 36 % | 3 % | 55 % | 5 % | 108 (fragile) |
| Bouchemaine | 0 % | 79 % | 4 % | 14 % | 2 % | 84 (fragile) |
| Chemillé-en-Anjou | 0 % | 81 % | 0 % | 19 % | 0 % | 75 (fragile) |
| Mûrs-Erigné | 0 % | 91 % | 0 % | 8 % | 0 % | 73 (fragile) |
| Saumur | 0 % | 54 % | 2 % | 43 % | 1 % | 87 (fragile) |
| Sablé-sur-Sarthe | 0 % | 37 % | 3 % | 60 % | 0 % | 78 (fragile) |
| Ancenis-Saint-Géréon | 0 % | 73 % | 2 % | 25 % | 0 % | 53 (fragile) |
| Le Lion-d'Angers | 0 % | 91 % | 2 % | 7 % | 0 % | 54 (fragile) |
| Longuenée-en-Anjou | 0 % | 98 % | 0 % | 2 % | 0 % | 63 (fragile) |
| Saint-Léger-de-Linières | 0 % | 88 % | 4 % | 5 % | 0 % | 67 (fragile) |
| Beaufort-en-Anjou | 0 % | 92 % | 2 % | 5 % | 0 % | 46 (fragile) |
| Mauges-sur-Loire | 0 % | 96 % | 0 % | 4 % | 0 % | 47 (fragile) |
| Saint-Georges-sur-Loire | 0 % | 81 % | 0 % | 19 % | 0 % | 47 (fragile) |
| Seiches-sur-le-Loir | 0 % | 99 % | 0 % | 1 % | 0 % | 51 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Voltaire | H | 1071 | 27 % | 11 % | 22 % | 49 % | 17 % |
| Ralliement | H | 1520 | 32 % | 11 % | 20 % | 50 % | 18 % |
| Mail | H | 1143 | 33 % | 11 % | 19 % | 48 % | 37 % |
| Boisnet | H | 1833 | 35 % | 9 % | 18 % | 44 % | 36 % |
| Gare | H | 941 | 36 % | 10 % | 24 % | 46 % | 31 % |
| Z.A. Larrey | A | 71 | 39 % | 5 % | 20 % | 29 % | 38 % |
| Z.A. Nid de Pie | A | 115 | 39 % | 0 % | 0 % | 2 % | 94 % |
| Joachim du Bellay | H | 1078 | 39 % | 18 % | 16 % | 34 % | 39 % |
| Bordillon | H | 885 | 40 % | 12 % | 18 % | 38 % | 38 % |
| Blancheraie | H | 1016 | 40 % | 10 % | 24 % | 40 % | 46 % |
| Brissac | H | 1014 | 41 % | 15 % | 20 % | 36 % | 42 % |
| Z.A. François Mitterrand | A | 315 | 42 % | 6 % | 19 % | 49 % | 47 % |
| Gâte-Argent | H | 1370 | 45 % | 14 % | 22 % | 32 % | 48 % |
| Fulton | H | 1862 | 45 % | 18 % | 23 % | 28 % | 58 % |
| Saint-Jean | H | 906 | 46 % | 13 % | 18 % | 30 % | 27 % |
| Saint-Michel | H | 1251 | 47 % | 11 % | 18 % | 33 % | 46 % |
| Beauséjour | H | 1780 | 48 % | 6 % | 21 % | 24 % | 70 % |
| Vauban | H | 1150 | 48 % | 12 % | 23 % | 20 % | 58 % |
| Louis Gain | H | 1157 | 49 % | 10 % | 17 % | 35 % | 48 % |
| Barra | H | 1261 | 49 % | 18 % | 8 % | 22 % | 51 % |
| Chevrollier | H | 996 | 50 % | 12 % | 18 % | 22 % | 77 % |
| Mirabeau | H | 1164 | 51 % | 14 % | 15 % | 16 % | 76 % |
| Besnardières | H | 1840 | 52 % | 12 % | 13 % | 26 % | 61 % |
| Z.A. Bouché Thomas | A | 78 | 52 % | 0 % | 16 % | 41 % | 68 % |
| Henri Dunant | H | 652 | 53 % | 5 % | 33 % | 39 % | 46 % |
| Doyenné | H | 713 | 54 % | 10 % | 24 % | 32 % | 49 % |
| Beaussier | H | 987 | 54 % | 7 % | 24 % | 41 % | 50 % |
| Volney | H | 1352 | 55 % | 8 % | 12 % | 19 % | 70 % |
| Melgrani | H | 869 | 56 % | 11 % | 21 % | 28 % | 54 % |
| Brisepotière | H | 2002 | 56 % | 23 % | 9 % | 17 % | 61 % |
| Château d'Orgemont | H | 654 | 56 % | 11 % | 19 % | 14 % | 68 % |
| Noyers | H | 1227 | 56 % | 16 % | 11 % | 17 % | 65 % |
| La Bruyère | H | 844 | 56 % | 13 % | 15 % | 28 % | 47 % |
| Petites Pannes | H | 1091 | 57 % | 18 % | 11 % | 11 % | 75 % |
| Yolande d'Aragon | H | 840 | 57 % | 13 % | 13 % | 18 % | 84 % |
| Luther King | H | 1100 | 57 % | 4 % | 31 % | 38 % | 23 % |
| Lorette | H | 1011 | 57 % | 12 % | 21 % | 29 % | 48 % |
| Dauversière | H | 755 | 58 % | 8 % | 20 % | 34 % | 33 % |
| Dumont d'Urville | H | 636 | 58 % | 4 % | 30 % | 39 % | 31 % |
| Maurice Tardat | H | 809 | 58 % | 13 % | 18 % | 22 % | 72 % |
| Gouronnières | H | 1639 | 58 % | 15 % | 10 % | 18 % | 79 % |
| Jean Moulin | H | 2225 | 59 % | 10 % | 18 % | 23 % | 69 % |
| Jean Vilar | H | 873 | 59 % | 9 % | 24 % | 36 % | 30 % |
| Jan Pallach | H | 510 | 60 % | 3 % | 23 % | 24 % | 55 % |
| Daguenet | H | 1434 | 60 % | 12 % | 16 % | 27 % | 43 % |
| Liberté | H | 1156 | 61 % | 10 % | 18 % | 18 % | 66 % |
| Haarlem | H | 505 | 62 % | 12 % | 22 % | 25 % | 43 % |
| Balzac-Zone Naturelle | D | 131 | 62 % | 16 % | 0 % | 10 % | 85 % |
| Haut Pressoir | H | 1266 | 62 % | 11 % | 8 % | 17 % | 84 % |
| Bon Repos | H | 673 | 63 % | 10 % | 9 % | 20 % | 64 % |
| Villoutreys | H | 1399 | 64 % | 13 % | 12 % | 21 % | 72 % |
| Marianne | H | 840 | 64 % | 10 % | 16 % | 22 % | 63 % |
| Lareveillère | H | 711 | 64 % | 9 % | 18 % | 15 % | 60 % |
| Montesquieu | H | 1269 | 64 % | 8 % | 12 % | 26 % | 60 % |
| Chambre aux Deniers | H | 789 | 67 % | 7 % | 13 % | 23 % | 55 % |
| Alphonse Daudet | H | 769 | 68 % | 18 % | 6 % | 11 % | 75 % |
| Copernic | H | 974 | 68 % | 6 % | 17 % | 19 % | 81 % |
| Parmentier | H | 1386 | 68 % | 11 % | 15 % | 25 % | 54 % |
| Europe | H | 499 | 69 % | 2 % | 22 % | 54 % | 12 % |
| Jean Rostand | H | 883 | 69 % | 16 % | 9 % | 6 % | 84 % |
| Mollière | H | 1430 | 70 % | 9 % | 13 % | 6 % | 86 % |
| Z.A. Gaston Birgé | A | 31 | 72 % | 17 % | 4 % | 19 % | 51 % |
| Robert d'Arbrissel | H | 517 | 75 % | 7 % | 16 % | 6 % | 92 % |
| Croix Blanche | H | 789 | 76 % | 6 % | 11 % | 12 % | 76 % |
| Z.A. Tournerie | A | 16 | 78 % | 0 % | 0 % | 33 % | 100 % |
| Gillettes-Zone Naturelle | D | 26 | 87 % | 13 % | 0 % | 0 % | 76 % |
| Baumette-Zone Naturelle | D | 0 | nan % | nan % | nan % | 0 % | 100 % |
| Île Saint-Aubin (Zone Naturelle) | D | 0 | nan % | nan % | nan % | nan % | nan % |
| Le Lac-Zone Naturelle | D | 0 | nan % | nan % | nan % | 0 % | 100 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Angers | 94 % | 63 % | 80 % | 88 % | 90 % | 86 % | 69 % | 75 % | 96 % | 1 % | 91 % |
| Trélazé | 77 % | 38 % | 49 % | 53 % | 74 % | 50 % | 55 % | 43 % | 86 % | 8 % | 79 % |
| Avrillé | 67 % | 37 % | 53 % | 60 % | 67 % | 77 % | 0 % | 36 % | 76 % | 10 % | 65 % |
| Les Ponts-de-Cé | 73 % | 24 % | 58 % | 55 % | 56 % | 68 % | 2 % | 36 % | 70 % | 9 % | 42 % |
| Saint-Barthélemy-d'Anjou | 46 % | 36 % | 44 % | 50 % | 67 % | 35 % | 36 % | 35 % | 90 % | 6 % | 39 % |
| Verrières-en-Anjou | 50 % | 24 % | 38 % | 41 % | 43 % | 52 % | 0 % | 30 % | 3 % | 24 % | 2 % |
| Bouchemaine | 46 % | 0 % | 22 % | 29 % | 40 % | 0 % | 0 % | 16 % | 76 % | 14 % | 0 % |

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

# Fiche mobilité · Nice (06088)

Générée le 2026-10-15T15:55:28Z · jour de référence 2026-10-13 · voisines : Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet, Saint-Laurent-du-Var

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.041, "bas": 0.038, "haut": 0.043, "lignes": 45068, "n_eff": 25721}, "marche": {"p": 0.117, "bas": 0.113, "haut": 0.121, "lignes": 45068, "n_eff": 25721}, "velo": {"p": 0.033, "bas": 0.031, "haut": 0.035, "lignes": 45068, "n_eff": 25721}, "deux_roues_mot": {"p": 0.076, "bas": 0.072, "haut": 0.079, "lignes": 45068, "n_eff": 25721}, "voiture": {"p": 0.436, "bas": 0.43, "haut": 0.442, "lignes": 45068, "n_eff": 25721}, "tc": {"p": 0.298, "bas": 0.292, "haut": 0.304, "lignes": 45068, "n_eff": 25721}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.4362) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.754, "bas": 0.748, "haut": 0.759, "lignes": 45068, "n_eff": 25721}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.391, "bas": 0.384, "haut": 0.398, "lignes": 33951, "n_eff": 19372}, "communes_voisines": {"p": 0.649, "bas": 0.623, "haut": 0.673, "lignes": 2498, "n_eff": 1415}, "ailleurs": {"p": 0.575, "bas": 0.563, "haut": 0.588, "lignes": 11117, "n_eff": 6349}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet, Saint-Laurent-du-Var

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.23, "bas": 0.225, "haut": 0.235, "lignes": 45068, "n_eff": 25721}, "actifs_menage_2_voitures_plus": {"p": 0.243, "bas": 0.238, "haut": 0.248, "lignes": 45068, "n_eff": 25721}, "menage_motorise_mais_pas_en_voiture": {"p": 0.467, "bas": 0.46, "haut": 0.474, "lignes": 34134, "n_eff": 19550}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.511, "bas": 0.502, "haut": 0.52, "lignes": 19978, "n_eff": 11771}, "velo": {"p": 0.038, "bas": 0.035, "haut": 0.042, "lignes": 19978, "n_eff": 11771}, "menage_sans_voiture": {"p": 0.112, "bas": 0.107, "haut": 0.118, "lignes": 19978, "n_eff": 11771}, "menage_2_voitures_plus": {"p": 0.35, "bas": 0.342, "haut": 0.359, "lignes": 19978, "n_eff": 11771}}, "locataires_prive": {"voiture": {"p": 0.358, "bas": 0.349, "haut": 0.368, "lignes": 17772, "n_eff": 9986}, "velo": {"p": 0.032, "bas": 0.028, "haut": 0.035, "lignes": 17772, "n_eff": 9986}, "menage_sans_voiture": {"p": 0.361, "bas": 0.351, "haut": 0.37, "lignes": 17772, "n_eff": 9986}, "menage_2_voitures_plus": {"p": 0.139, "bas": 0.132, "haut": 0.146, "lignes": 17772, "n_eff": 9986}}, "locataires_hlm": {"voiture": {"p": 0.419, "bas": 0.402, "haut": 0.437, "lignes": 5821, "n_eff": 3120}, "velo": {"p": 0.015, "bas": 0.012, "haut": 0.02, "lignes": 5821, "n_eff": 3120}, "menage_sans_voiture": {"p": 0.296, "bas": 0.28, "haut": 0.312, "lignes": 5821, "n_eff": 3120}, "menage_2_voitures_plus": {"p": 0.161, "bas": 0.149, "haut": 0.174, "lignes": 5821, "n_eff": 3120}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 155505, "habitent_la_commune": {"part_des_emplois": 0.68, "voiture": {"p": 0.391, "bas": 0.384, "haut": 0.398, "lignes": 33951, "n_eff": 19372}, "tc": {"p": 0.293, "bas": 0.287, "haut": 0.3, "lignes": 33951, "n_eff": 19372}}, "reste_unite_urbaine": {"part_des_emplois": 0.239, "voiture": {"p": 0.795, "bas": 0.785, "haut": 0.805, "lignes": 10531, "n_eff": 6003}, "tc": {"p": 0.11, "bas": 0.102, "haut": 0.118, "lignes": 10531, "n_eff": 6003}}, "hors_unite_urbaine": {"part_des_emplois": 0.08, "voiture": {"p": 0.808, "bas": 0.789, "haut": 0.826, "lignes": 2947, "n_eff": 1768}, "tc": {"p": 0.125, "bas": 0.111, "haut": 0.141, "lignes": 2947, "n_eff": 1768}}}`

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

**Valeur** : `{"min": 0.158, "iris_min": "Vieux Nice-Visitation", "max": 0.827, "iris_max": "Crémat-Bellet", "iris_habitat": 144}`

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

**Valeur** : `{"iris": 0.436, "mobpro": 0.436}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.374, "menages_2_voitures_plus": 0.141, "menages_stationnement_reserve": 0.484}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.946, "grande_surface_500m": 0.751, "pharmacie_500m": 0.892, "medecin_generaliste_500m": 0.907, "ecole_elementaire_500m": 0.91, "college_1km": 0.902, "gare_2km": 0.94, "panier_quotidien_500m": 0.85, "bus_8h_7_9h": 0.97, "aucun_bus_7_9h": 0.006, "bus_4h_20_22h": 0.945}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.1%
- Jour de référence 2026-10-13 dans la validité GTFS ['20261008', '20261231']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.286, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.682, "ecart": 0.604, "stations": 48}, "E10": {"semaine_ref": "2026-10-05", "prix": 1.99, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.743, "ecart": 0.247, "stations": 39}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 56 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Nice | 75 % | 39 % | 4 % | 29 % | 15 % | 33951 (ok) |
| 99999 | 8 % | 39 % | 1 % | 46 % | 1 % | 3389 (ok) |
| Saint-Laurent-du-Var | 2 % | 62 % | 2 % | 26 % | 0 % | 920 (ok) |
| Carros | 2 % | 77 % | 0 % | 18 % | 0 % | 868 (ok) |
| Cagnes-sur-Mer | 1 % | 69 % | 2 % | 22 % | 1 % | 578 (ok) |
| Valbonne | 1 % | 64 % | 0 % | 32 % | 0 % | 514 (ok) |
| Antibes | 1 % | 69 % | 1 % | 26 % | 1 % | 482 (ok) |
| Cannes | 1 % | 54 % | 0 % | 41 % | 1 % | 371 (ok) |
| Biot | 1 % | 60 % | 3 % | 33 % | 0 % | 304 (ok) |
| Villeneuve-Loubet | 1 % | 64 % | 7 % | 23 % | 1 % | 288 (ok) |
| La Trinité | 0 % | 75 % | 0 % | 12 % | 5 % | 240 (ok) |
| Menton | 0 % | 51 % | 0 % | 43 % | 4 % | 164 (ok) |
| Villefranche-sur-Mer | 0 % | 57 % | 5 % | 23 % | 6 % | 176 (ok) |
| Beaulieu-sur-Mer | 0 % | 46 % | 4 % | 34 % | 2 % | 144 (fragile) |
| Mougins | 0 % | 81 % | 1 % | 11 % | 0 % | 128 (fragile) |
| Saint-André-de-la-Roche | 0 % | 76 % | 1 % | 13 % | 1 % | 119 (fragile) |
| Vallauris | 0 % | 67 % | 0 % | 30 % | 0 % | 113 (fragile) |
| Beausoleil | 0 % | 42 % | 0 % | 38 % | 1 % | 98 (fragile) |
| Contes | 0 % | 86 % | 0 % | 7 % | 2 % | 92 (fragile) |
| Drap | 0 % | 90 % | 0 % | 3 % | 1 % | 96 (fragile) |
| Grasse | 0 % | 84 % | 0 % | 11 % | 0 % | 107 (fragile) |
| Saint-Jean-Cap-Ferrat | 0 % | 66 % | 1 % | 12 % | 0 % | 116 (fragile) |
| Le Cannet | 0 % | 75 % | 3 % | 14 % | 4 % | 40 (fragile) |
| Cap-d'Ail | 0 % | 62 % | 0 % | 26 % | 0 % | 49 (fragile) |
| Colomars | 0 % | 98 % | 0 % | 2 % | 0 % | 44 (fragile) |
| Èze | 0 % | 58 % | 1 % | 22 % | 2 % | 59 (fragile) |
| La Gaude | 0 % | 84 % | 2 % | 12 % | 0 % | 59 (fragile) |
| Mandelieu-la-Napoule | 0 % | 85 % | 0 % | 9 % | 1 % | 42 (fragile) |
| Mouans-Sartoux | 0 % | 74 % | 0 % | 16 % | 3 % | 53 (fragile) |
| Roquebrune-Cap-Martin | 0 % | 62 % | 0 % | 25 % | 0 % | 57 (fragile) |
| Saint-Jeannet | 0 % | 72 % | 0 % | 19 % | 3 % | 44 (fragile) |
| Vence | 0 % | 70 % | 0 % | 19 % | 0 % | 70 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Gare Nice-Ville | A | 14 | 0 % | 0 % | 23 % | 90 % | 80 % |
| Vieux Nice-Visitation | H | 421 | 16 % | 1 % | 36 % | 66 % | 16 % |
| Sasserno | H | 599 | 16 % | 5 % | 36 % | 53 % | 22 % |
| Hôpital Saint-Roch | H | 934 | 18 % | 4 % | 40 % | 51 % | 19 % |
| Thiole | H | 895 | 18 % | 6 % | 42 % | 52 % | 32 % |
| Notre-Dame | H | 949 | 18 % | 5 % | 29 % | 60 % | 16 % |
| Liberti-Albert 1er | H | 469 | 18 % | 2 % | 30 % | 59 % | 27 % |
| Vieux Nice-Sainte-Réparate | H | 466 | 19 % | 0 % | 45 % | 71 % | 9 % |
| Michel-Ange | H | 835 | 19 % | 5 % | 46 % | 48 % | 28 % |
| Promenade du Paillon | H | 665 | 19 % | 6 % | 30 % | 50 % | 31 % |
| Jean Médecin | H | 873 | 19 % | 4 % | 29 % | 55 % | 25 % |
| Riquier-Fontaine de la Ville | H | 867 | 20 % | 4 % | 47 % | 52 % | 30 % |
| Jeanne d'Arc-Fuon-Cauda | H | 877 | 20 % | 4 % | 40 % | 49 % | 27 % |
| Cassini | H | 753 | 20 % | 4 % | 41 % | 59 % | 28 % |
| Bonaparte | H | 1212 | 21 % | 4 % | 34 % | 52 % | 28 % |
| Bellevue | H | 875 | 21 % | 6 % | 40 % | 53 % | 23 % |
| Clément Roassal | H | 1318 | 22 % | 4 % | 44 % | 57 % | 24 % |
| Port | H | 653 | 23 % | 14 % | 29 % | 41 % | 33 % |
| Barla | H | 807 | 23 % | 3 % | 41 % | 50 % | 34 % |
| Thiers-Durante | H | 1048 | 23 % | 3 % | 35 % | 59 % | 18 % |
| Trachel | H | 752 | 23 % | 2 % | 43 % | 60 % | 15 % |
| Saleya-Château | H | 544 | 24 % | 7 % | 30 % | 54 % | 26 % |
| Bottero | H | 645 | 24 % | 8 % | 41 % | 53 % | 33 % |
| Raimbaldi | H | 872 | 24 % | 3 % | 44 % | 64 % | 7 % |
| République | H | 876 | 24 % | 6 % | 38 % | 56 % | 22 % |
| Desambrois | H | 898 | 24 % | 3 % | 29 % | 50 % | 20 % |
| Garibaldi | H | 973 | 25 % | 6 % | 34 % | 49 % | 38 % |
| Châteauneuf | H | 1165 | 25 % | 3 % | 36 % | 52 % | 27 % |
| Pierre Semard | H | 873 | 26 % | 2 % | 53 % | 63 % | 33 % |
| Garnier-Gare de Provence | H | 953 | 26 % | 3 % | 43 % | 59 % | 15 % |
| Clemenceau | H | 833 | 26 % | 4 % | 34 % | 55 % | 19 % |
| Pasteur-Saint-Pons | H | 451 | 26 % | 4 % | 47 % | 61 % | 23 % |
| Diables Bleus | H | 1881 | 26 % | 3 % | 44 % | 51 % | 39 % |
| Acropolis-XVe Corps | H | 940 | 26 % | 7 % | 35 % | 46 % | 46 % |
| Rossini | H | 499 | 27 % | 8 % | 30 % | 50 % | 24 % |
| Mont Gros | H | 448 | 27 % | 2 % | 60 % | 57 % | 24 % |
| Marceau | H | 1008 | 28 % | 2 % | 39 % | 61 % | 18 % |
| Vernier | H | 603 | 28 % | 5 % | 44 % | 59 % | 20 % |
| Puget | H | 1301 | 28 % | 6 % | 38 % | 42 % | 46 % |
| Faculté de Lettres | H | 788 | 28 % | 3 % | 53 % | 27 % | 62 % |
| Dante | H | 678 | 29 % | 7 % | 39 % | 56 % | 32 % |
| TNL-Beaumont | H | 602 | 29 % | 4 % | 41 % | 52 % | 44 % |
| Victor Hugo-Buffa | H | 719 | 30 % | 3 % | 31 % | 50 % | 38 % |
| Riquier-Arson | H | 1386 | 30 % | 4 % | 32 % | 51 % | 25 % |
| Potiers | H | 734 | 30 % | 8 % | 35 % | 52 % | 33 % |
| Riquier | H | 1717 | 30 % | 5 % | 38 % | 46 % | 45 % |
| Michelet | H | 1065 | 31 % | 2 % | 40 % | 51 % | 37 % |
| Carnot | H | 546 | 31 % | 8 % | 35 % | 35 % | 46 % |
| Borriglione-Saint Lambert | H | 777 | 31 % | 5 % | 41 % | 47 % | 39 % |
| Saint-Jean d'Angély | H | 1760 | 31 % | 5 % | 41 % | 54 % | 32 % |
| Évêché | H | 858 | 32 % | 7 % | 34 % | 42 % | 36 % |
| Pierre Sola | H | 860 | 32 % | 3 % | 43 % | 48 % | 28 % |
| Cessole | H | 1009 | 32 % | 3 % | 42 % | 44 % | 34 % |
| Parc Impérial | H | 757 | 32 % | 6 % | 29 % | 48 % | 34 % |
| Lenval | H | 700 | 32 % | 12 % | 40 % | 58 % | 24 % |
| Saint-Roch-Jean XXIII | H | 967 | 33 % | 5 % | 41 % | 40 % | 46 % |
| Gorbella | H | 943 | 33 % | 5 % | 40 % | 42 % | 37 % |
| Église Russe | H | 885 | 33 % | 8 % | 30 % | 45 % | 42 % |
| Saint-Barthélemy | H | 1164 | 34 % | 1 % | 36 % | 40 % | 50 % |
| Baumettes | H | 785 | 34 % | 7 % | 35 % | 30 % | 42 % |
| Le Righi | H | 1065 | 34 % | 5 % | 32 % | 38 % | 49 % |
| Villa Arson | H | 997 | 35 % | 2 % | 35 % | 41 % | 39 % |
| Carabacel | H | 735 | 35 % | 9 % | 20 % | 31 % | 38 % |
| France-Negresco | H | 620 | 35 % | 4 % | 26 % | 56 % | 27 % |
| Musiciens | H | 457 | 35 % | 3 % | 23 % | 47 % | 30 % |
| Grosso | H | 1150 | 36 % | 4 % | 35 % | 48 % | 30 % |
| Caravadossi-George V | H | 607 | 36 % | 4 % | 27 % | 32 % | 47 % |
| Vauban | H | 1267 | 36 % | 3 % | 32 % | 29 % | 61 % |
| Route de Turin | H | 746 | 36 % | 2 % | 46 % | 47 % | 42 % |
| Saint-Sylvestre | H | 919 | 37 % | 4 % | 34 % | 34 % | 56 % |
| Pasteur-Voie Romaine | H | 1203 | 37 % | 2 % | 43 % | 56 % | 33 % |
| Bon Voyage | H | 1262 | 37 % | 1 % | 53 % | 43 % | 46 % |
| Canavese | H | 1094 | 37 % | 2 % | 38 % | 36 % | 43 % |
| Saint-Roch-Ricolfi | H | 815 | 38 % | 2 % | 36 % | 37 % | 57 % |
| Madeleine | H | 492 | 38 % | 4 % | 29 % | 44 % | 50 % |
| Arenas-Aéroport | A | 218 | 38 % | 2 % | 42 % | 69 % | 7 % |
| Arenas-Cassin | H | 1025 | 39 % | 2 % | 44 % | 32 % | 48 % |
| La Clua | H | 858 | 39 % | 3 % | 40 % | 37 % | 52 % |
| Les Moulins | H | 1387 | 40 % | 2 % | 50 % | 41 % | 42 % |
| La Californie | H | 849 | 40 % | 2 % | 42 % | 53 % | 37 % |
| Magnan | H | 735 | 40 % | 2 % | 27 % | 48 % | 38 % |
| Madeleine Robiony | H | 1113 | 40 % | 4 % | 35 % | 38 % | 55 % |
| Cyrnos | H | 807 | 40 % | 3 % | 26 % | 29 % | 58 % |
| Lyautey-Gendarmerie | H | 1043 | 41 % | 3 % | 34 % | 39 % | 56 % |
| Roquebillière | H | 1390 | 42 % | 2 % | 40 % | 38 % | 57 % |
| Ariane-Les Chênes | H | 802 | 42 % | 0 % | 37 % | 47 % | 36 % |
| Cimiez-Valrose | H | 923 | 43 % | 7 % | 18 % | 22 % | 61 % |
| Carlone | H | 987 | 43 % | 5 % | 32 % | 41 % | 38 % |
| Digue des Français | H | 1096 | 43 % | 2 % | 42 % | 43 % | 40 % |
| Carras | H | 1210 | 44 % | 2 % | 43 % | 42 % | 41 % |
| Pasteur | H | 1133 | 46 % | 4 % | 34 % | 46 % | 44 % |
| Sainte-Rosalie-Arbre Inférieur | H | 1516 | 46 % | 5 % | 18 % | 18 % | 64 % |
| Paschetta | H | 640 | 47 % | 3 % | 24 % | 30 % | 57 % |
| Nice Nord-Saqui | H | 1069 | 47 % | 0 % | 42 % | 34 % | 44 % |
| Cernuschi | H | 952 | 47 % | 3 % | 36 % | 21 % | 57 % |
| La Bornala | H | 910 | 47 % | 1 % | 37 % | 42 % | 45 % |
| Cimiez | H | 907 | 48 % | 8 % | 19 % | 20 % | 64 % |
| Saint-Augustin | H | 1043 | 48 % | 1 % | 38 % | 43 % | 37 % |
| Les Siagnes | H | 806 | 48 % | 3 % | 33 % | 26 % | 54 % |
| Parc Chambrun | H | 1173 | 49 % | 3 % | 28 % | 35 % | 42 % |
| Saint-Philippe | H | 947 | 49 % | 3 % | 19 % | 26 % | 58 % |
| Paul Montel | H | 814 | 50 % | 0 % | 29 % | 25 % | 59 % |
| Lanterne-Mandariniers | H | 1184 | 50 % | 5 % | 27 % | 21 % | 68 % |
| Henry Dunant | H | 856 | 50 % | 2 % | 25 % | 30 % | 62 % |
| Brancolar-Régina | H | 880 | 50 % | 3 % | 21 % | 33 % | 63 % |
| Pastorelle-Bosquets | H | 664 | 50 % | 6 % | 27 % | 27 % | 48 % |
| Gravier | H | 1029 | 51 % | 1 % | 24 % | 18 % | 76 % |
| Mont Alban | H | 1157 | 51 % | 8 % | 18 % | 15 % | 74 % |
| Mantega | H | 693 | 52 % | 1 % | 21 % | 28 % | 55 % |
| Le Ray-Gravier-Dunant | H | 1415 | 53 % | 1 % | 23 % | 21 % | 60 % |
| Saint-Charles | H | 902 | 53 % | 2 % | 28 % | 44 % | 40 % |
| Cap de Croix | H | 1249 | 54 % | 4 % | 19 % | 17 % | 74 % |
| Comte de Falicon | H | 593 | 54 % | 2 % | 29 % | 27 % | 9 % |
| Mont Boron | H | 664 | 54 % | 8 % | 14 % | 9 % | 71 % |
| Las Planas-La Vallière | H | 1380 | 55 % | 1 % | 27 % | 34 % | 62 % |
| Madeleine-Nicolaï | H | 645 | 55 % | 1 % | 31 % | 30 % | 63 % |
| Cyrille Besset-La Forêt | H | 1227 | 56 % | 1 % | 19 % | 21 % | 73 % |
| Brancolar-Scudéri | H | 650 | 56 % | 3 % | 19 % | 17 % | 73 % |
| La Lauvette | H | 391 | 56 % | 2 % | 25 % | 47 % | 37 % |
| La Victorine-Grinda | H | 962 | 57 % | 0 % | 22 % | 16 % | 74 % |
| Madeleine Supérieure | H | 544 | 58 % | 2 % | 24 % | 29 % | 67 % |
| Ariane-Ripert | H | 777 | 59 % | 0 % | 27 % | 51 % | 35 % |
| Vinaigrier | H | 550 | 59 % | 3 % | 17 % | 26 % | 70 % |
| Cimiez-Monastère | H | 712 | 60 % | 1 % | 18 % | 30 % | 66 % |
| Le Piol-Cyrnos | H | 1004 | 60 % | 4 % | 13 % | 19 % | 67 % |
| Rimiez | H | 1333 | 62 % | 2 % | 15 % | 14 % | 81 % |
| Ariane-Monzie | H | 913 | 62 % | 0 % | 27 % | 31 % | 64 % |
| Plateaux Fleuris | H | 1374 | 62 % | 2 % | 20 % | 16 % | 76 % |
| Bischoffsheim | H | 534 | 63 % | 6 % | 13 % | 15 % | 73 % |
| Parc des Sports | H | 2047 | 64 % | 2 % | 21 % | 17 % | 83 % |
| Caucade | H | 1802 | 65 % | 2 % | 14 % | 12 % | 86 % |
| Napoléon III | H | 1511 | 68 % | 2 % | 13 % | 12 % | 87 % |
| Bellet-Magnan | H | 1266 | 68 % | 2 % | 15 % | 19 % | 70 % |
| Abbaye de Roseland | H | 690 | 68 % | 4 % | 10 % | 11 % | 78 % |
| Costière | H | 1084 | 70 % | 2 % | 10 % | 8 % | 90 % |
| Gattamua | H | 1593 | 71 % | 1 % | 12 % | 12 % | 81 % |
| Ariane-Saramito | H | 968 | 71 % | 2 % | 15 % | 40 % | 49 % |
| Lanterne | H | 1502 | 72 % | 2 % | 14 % | 9 % | 85 % |
| Saint-Pancrace-Pessicart | H | 1316 | 73 % | 2 % | 9 % | 7 % | 86 % |
| Saint-Pierre de Féric | H | 1119 | 74 % | 1 % | 10 % | 9 % | 88 % |
| Fabron-Terron-Archet | H | 1597 | 74 % | 2 % | 11 % | 7 % | 88 % |
| Spagnol-Sainte-Marguerite | H | 2075 | 75 % | 2 % | 9 % | 8 % | 91 % |
| Gairaut | H | 1107 | 76 % | 0 % | 12 % | 5 % | 91 % |
| Lingostière-Saint-Isidore | H | 2078 | 77 % | 1 % | 10 % | 11 % | 88 % |
| Saint-Antoine Ginestière | H | 1630 | 78 % | 1 % | 7 % | 8 % | 91 % |
| Crémat-Bellet | H | 1199 | 83 % | 0 % | 4 % | 6 % | 91 % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Nice | 95 % | 75 % | 89 % | 91 % | 91 % | 90 % | 94 % | 85 % | 97 % | 1 % | 94 % |
| Antibes | 88 % | 59 % | 80 % | 77 % | 64 % | 83 % | 82 % | 57 % | 0 % | 100 % | 0 % |
| Cannes | 91 % | 63 % | 83 % | 81 % | 74 % | 87 % | 94 % | 69 % | 0 % | 100 % | 0 % |
| Cagnes-sur-Mer | 88 % | 48 % | 77 % | 81 % | 69 % | 86 % | 91 % | 58 % | 68 % | 6 % | 70 % |
| Grasse | 73 % | 29 % | 58 % | 60 % | 58 % | 68 % | 70 % | 46 % | 0 % | 100 % | 0 % |
| Le Cannet | 94 % | 52 % | 89 % | 86 % | 71 % | 88 % | 44 % | 63 % | 0 % | 100 % | 0 % |
| Saint-Laurent-du-Var | 90 % | 45 % | 65 % | 86 % | 72 % | 88 % | 77 % | 51 % | 82 % | 0 % | 84 % |

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

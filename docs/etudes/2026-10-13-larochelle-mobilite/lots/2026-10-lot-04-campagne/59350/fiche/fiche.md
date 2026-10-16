# Fiche mobilité · Lille (59350)

Générée le 2026-10-15T16:01:38Z · jour de référence 2026-10-13 · voisines : Tourcoing, Roubaix, Villeneuve-d'Ascq, Wattrelos, Marcq-en-Barœul, Lambersart

Fiche factuelle : aucune phrase ici n'est une conclusion éditoriale. Statut, source, limites et vérifications par fait.

## Mode principal pour aller travailler
`mobpro.modes` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"pas_de_transport": {"p": 0.035, "bas": 0.032, "haut": 0.038, "lignes": 31911, "n_eff": 16909}, "marche": {"p": 0.113, "bas": 0.108, "haut": 0.118, "lignes": 31911, "n_eff": 16909}, "velo": {"p": 0.087, "bas": 0.083, "haut": 0.092, "lignes": 31911, "n_eff": 16909}, "deux_roues_mot": {"p": 0.007, "bas": 0.005, "haut": 0.008, "lignes": 31911, "n_eff": 16909}, "voiture": {"p": 0.395, "bas": 0.388, "haut": 0.403, "lignes": 31911, "n_eff": 16909}, "tc": {"p": 0.363, "bas": 0.356, "haut": 0.371, "lignes": 31911, "n_eff": 16909}}`

Définition : Actifs occupés de 15 ans ou plus, mode principal pour aller travailler, pondéré IPONDI

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : part voiture seulement (index mobilite.part_voiture, affichée en rang)

Contrôles :
- Nombre de lignes du fichier = 7388023 : oui
- Égal à l'index (part voiture 0.3952) : oui

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- Le dénominateur inclut « pas de transport » (travail à domicile).

## Actifs travaillant dans leur commune de résidence
`mobpro.travaille_dans_commune` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"p": 0.549, "bas": 0.542, "haut": 0.557, "lignes": 31911, "n_eff": 16909}`

Définition : Part des actifs occupés dont la commune de travail est la commune de résidence

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).

## Part de la voiture selon le lieu de travail
`mobpro.voiture_selon_destination` · statut : calculé · maille : commune de résidence × commune de travail · millésime : 2022

**Valeur** : `{"meme_commune": {"p": 0.261, "bas": 0.252, "haut": 0.27, "lignes": 17549, "n_eff": 9294}, "communes_voisines": {"p": 0.472, "bas": 0.454, "haut": 0.491, "lignes": 5281, "n_eff": 2822}, "ailleurs": {"p": 0.559, "bas": 0.547, "haut": 0.57, "lignes": 14362, "n_eff": 7615}}`

Définition : Parmi les actifs résidents, part allant travailler en voiture, selon que la commune de travail est la commune de résidence, une voisine retenue, ou toute autre

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Contrôles :
- Voisines retenues : Tourcoing, Roubaix, Villeneuve-d'Ascq, Wattrelos, Marcq-en-Barœul, Lambersart

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

**À vérifier par un humain** : Le choix des voisines change le chiffre « communes voisines » : le relire.

## Possession au ménage et usage pour travailler
`mobpro.posseder_utiliser` · statut : calculé · maille : commune de résidence · millésime : 2022

**Valeur** : `{"actifs_menage_sans_voiture": {"p": 0.276, "bas": 0.269, "haut": 0.283, "lignes": 31911, "n_eff": 16909}, "actifs_menage_2_voitures_plus": {"p": 0.201, "bas": 0.195, "haut": 0.207, "lignes": 31911, "n_eff": 16909}, "menage_motorise_mais_pas_en_voiture": {"p": 0.485, "bas": 0.476, "haut": 0.494, "lignes": 22841, "n_eff": 12096}}`

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

**Valeur** : `{"proprietaires": {"voiture": {"p": 0.463, "bas": 0.45, "haut": 0.476, "lignes": 10310, "n_eff": 5799}, "velo": {"p": 0.116, "bas": 0.108, "haut": 0.124, "lignes": 10310, "n_eff": 5799}, "menage_sans_voiture": {"p": 0.111, "bas": 0.103, "haut": 0.119, "lignes": 10310, "n_eff": 5799}, "menage_2_voitures_plus": {"p": 0.317, "bas": 0.305, "haut": 0.329, "lignes": 10310, "n_eff": 5799}}, "locataires_prive": {"voiture": {"p": 0.336, "bas": 0.325, "haut": 0.347, "lignes": 14568, "n_eff": 7619}, "velo": {"p": 0.085, "bas": 0.079, "haut": 0.091, "lignes": 14568, "n_eff": 7619}, "menage_sans_voiture": {"p": 0.394, "bas": 0.383, "haut": 0.405, "lignes": 14568, "n_eff": 7619}, "menage_2_voitures_plus": {"p": 0.128, "bas": 0.121, "haut": 0.136, "lignes": 14568, "n_eff": 7619}}, "locataires_hlm": {"voiture": {"p": 0.415, "bas": 0.397, "haut": 0.432, "lignes": 6241, "n_eff": 3082}, "velo": {"p": 0.04, "bas": 0.034, "haut": 0.048, "lignes": 6241, "n_eff": 3082}, "menage_sans_voiture": {"p": 0.334, "bas": 0.318, "haut": 0.351, "lignes": 6241, "n_eff": 3082}, "menage_2_voitures_plus": {"p": 0.158, "bas": 0.146, "haut": 0.172, "lignes": 6241, "n_eff": 3082}}}`

Définition : STOCD : 10 propriétaire ; 21 et 23 locataire du privé (vide, meublé) ; 22 HLM

Source : INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)

Présent dans le moteur : non

Limites :
- Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs.
- Pratiques du recensement 2022 (collectes 2020 à 2024).
- Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.

## Actifs qui travaillent dans la commune, selon leur lieu de résidence
`mobpro.qui_vient_travailler` · statut : calculé · maille : commune de travail · millésime : 2022

**Valeur** : `{"actifs_travaillant_ici": 183571, "habitent_la_commune": {"part_des_emplois": 0.307, "voiture": {"p": 0.261, "bas": 0.252, "haut": 0.27, "lignes": 17549, "n_eff": 9294}, "tc": {"p": 0.361, "bas": 0.351, "haut": 0.371, "lignes": 17549, "n_eff": 9294}}, "reste_unite_urbaine": {"part_des_emplois": 0.363, "voiture": {"p": 0.596, "bas": 0.587, "haut": 0.606, "lignes": 19082, "n_eff": 10832}, "tc": {"p": 0.299, "bas": 0.291, "haut": 0.308, "lignes": 19082, "n_eff": 10832}}, "hors_unite_urbaine": {"part_des_emplois": 0.329, "voiture": {"p": 0.66, "bas": 0.65, "haut": 0.67, "lignes": 14241, "n_eff": 8790}, "tc": {"p": 0.32, "bas": 0.31, "haut": 0.33, "lignes": 14241, "n_eff": 8790}}}`

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

**Valeur** : `{"min": 0.209, "iris_min": "Lille Centre 5", "max": 0.649, "iris_max": "Bourg Délivrance 2", "iris_habitat": 93}`

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

**Valeur** : `{"iris": 0.395, "mobpro": 0.395}`

Définition : Part voiture recalculée depuis la somme des IRIS, comparée au fichier détail

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : non

Contrôles :
- Écart < 0,5 point : oui

## Ménages de la commune et voiture
`iris.menages_commune` · statut : calculé · maille : commune · millésime : 2022

**Valeur** : `{"menages_sans_voiture": 0.446, "menages_2_voitures_plus": 0.111, "menages_stationnement_reserve": 0.382}`

Définition : Résidences principales : P22_RP_VOIT1P, P22_RP_VOIT2P, P22_RP_GARL (emplacement réservé au stationnement)

Source : INSEE, RP 2022, bases infracommunales Activité des résidents et Logement

Présent dans le moteur : part ≥ 1 voiture à l'IRIS (data/iris-logement.json), affichée dans le dossier d'adresse

Limites :
- Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.

## Part des ménages (estimée) dont l'adresse a chaque service à proximité
`acces.adresses` · statut : calculé · maille : adresse, agrégée à la commune et à l'IRIS · millésime : BPE 2025, GTFS du jour 2026-10-13

**Valeur** : `{"commerce_alim_500m": 0.989, "grande_surface_500m": 0.841, "pharmacie_500m": 0.94, "medecin_generaliste_500m": 0.959, "ecole_elementaire_500m": 0.948, "college_1km": 0.961, "gare_2km": 0.863, "panier_quotidien_500m": 0.901, "bus_8h_7_9h": 0.0, "aucun_bus_7_9h": 0.978, "bus_4h_20_22h": 0.0}`

Définition : Distances À VOL D'OISEAU depuis chaque adresse BAN ; poids = ménages de l'IRIS / adresses de l'IRIS. Panier quotidien = commerce alimentaire, pharmacie et école élémentaire à 500 m. Bus = courses distinctes de lignes régulières à 400 m, deux sens confondus

Source : BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s))

Présent dans le moteur : proximité BPE à UNE adresse (dossier, module Autour, 5 catégories, hypermarchés exclus) ; pas de fréquence de bus

Contrôles :
- Adresses non rattachées à un IRIS : 0.0%
- Jour de référence 2026-10-13 dans la validité GTFS ['20250901', '20261231']

Limites :
- Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance.
- Point BPE = adresse de l'établissement, pas son entrée.
- Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.

**À vérifier par un humain** : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## Prix médian à la pompe, stations à moins de 12 km
`carburant.evolution` · statut : calculé · maille : stations à 12 km du centre · millésime : 2025 à 2026-10-13

**Valeur** : `{"Gazole": {"semaine_ref": "2026-10-05", "prix": 2.308, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.574, "ecart": 0.734, "stations": 62}, "E10": {"semaine_ref": "2026-10-05", "prix": 2.104, "semaine_un_an_avant": "2025-10-06", "prix_un_an_avant": 1.655, "ecart": 0.449, "stations": 58}}`

Définition : Dernier prix déclaré par station dans la semaine, médiane entre stations

Source : prix-carburants.gouv.fr, flux officiel (archives annuelles)

Présent dans le moteur : non

Contrôles :
- Stations dans le rayon : 66 (suffisant)

Limites :
- Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas.
- Une hausse passée ne dit rien de l'avenir.

## Tableau · mode selon la commune de travail

| Travail | Part des actifs | Voiture | Vélo | TC | Marche | Lignes |
|---|---|---|---|---|---|---|
| Lille | 55 % | 26 % | 12 % | 36 % | 19 % | 17549 (ok) |
| Villeneuve-d'Ascq | 8 % | 42 % | 6 % | 49 % | 1 % | 2461 (ok) |
| Roubaix | 3 % | 47 % | 3 % | 49 % | 0 % | 1070 (ok) |
| Marcq-en-Barœul | 2 % | 51 % | 7 % | 39 % | 2 % | 732 (ok) |
| Tourcoing | 2 % | 56 % | 1 % | 41 % | 1 % | 622 (ok) |
| Lesquin | 1 % | 74 % | 4 % | 22 % | 0 % | 410 (ok) |
| Loos | 1 % | 38 % | 10 % | 48 % | 4 % | 371 (ok) |
| La Madeleine | 1 % | 42 % | 14 % | 31 % | 13 % | 370 (ok) |
| Wasquehal | 1 % | 56 % | 5 % | 38 % | 0 % | 384 (ok) |
| Lambersart | 1 % | 46 % | 14 % | 28 % | 10 % | 305 (ok) |
| 99999 | 1 % | 69 % | 1 % | 25 % | 5 % | 317 (ok) |
| Croix | 1 % | 40 % | 6 % | 52 % | 0 % | 274 (ok) |
| Lezennes | 1 % | 54 % | 6 % | 36 % | 2 % | 239 (ok) |
| Ronchin | 1 % | 53 % | 12 % | 31 % | 3 % | 265 (ok) |
| Seclin | 1 % | 71 % | 4 % | 21 % | 0 % | 256 (ok) |
| Valenciennes | 1 % | 55 % | 1 % | 44 % | 0 % | 188 (ok) |
| Armentières | 0 % | 69 % | 3 % | 28 % | 0 % | 170 (ok) |
| Douai | 0 % | 52 % | 1 % | 46 % | 0 % | 141 (fragile) |
| Mons-en-Barœul | 0 % | 40 % | 11 % | 35 % | 11 % | 134 (fragile) |
| Saint-André-lez-Lille | 0 % | 62 % | 11 % | 25 % | 1 % | 174 (ok) |
| Dunkerque | 0 % | 53 % | 0 % | 47 % | 0 % | 113 (fragile) |
| Faches-Thumesnil | 0 % | 53 % | 7 % | 36 % | 3 % | 117 (fragile) |
| Haubourdin | 0 % | 67 % | 9 % | 19 % | 1 % | 119 (fragile) |
| Hem | 0 % | 81 % | 1 % | 18 % | 0 % | 110 (fragile) |
| Templemars | 0 % | 74 % | 2 % | 21 % | 1 % | 115 (fragile) |
| Wambrechies | 0 % | 64 % | 6 % | 24 % | 3 % | 129 (fragile) |
| Arras | 0 % | 45 % | 0 % | 55 % | 0 % | 121 (fragile) |
| Lens | 0 % | 65 % | 1 % | 33 % | 0 % | 115 (fragile) |
| Bondues | 0 % | 84 % | 5 % | 11 % | 0 % | 78 (fragile) |
| Fretin | 0 % | 80 % | 3 % | 15 % | 0 % | 100 (fragile) |
| Marquette-lez-Lille | 0 % | 58 % | 10 % | 32 % | 0 % | 116 (fragile) |
| Roncq | 0 % | 88 % | 3 % | 7 % | 2 % | 98 (fragile) |
| Wattrelos | 0 % | 82 % | 1 % | 17 % | 0 % | 91 (fragile) |
| Bailleul | 0 % | 89 % | 7 % | 5 % | 0 % | 52 (fragile) |
| Comines | 0 % | 66 % | 1 % | 33 % | 0 % | 51 (fragile) |
| Leers | 0 % | 79 % | 0 % | 21 % | 0 % | 48 (fragile) |
| Lys-lez-Lannoy | 0 % | 81 % | 0 % | 17 % | 0 % | 51 (fragile) |
| Neuville-en-Ferrain | 0 % | 67 % | 4 % | 29 % | 0 % | 58 (fragile) |
| Noyelles-lès-Seclin | 0 % | 52 % | 12 % | 31 % | 2 % | 71 (fragile) |
| Pérenchies | 0 % | 64 % | 2 % | 30 % | 0 % | 54 (fragile) |
| Sainghin-en-Mélantois | 0 % | 70 % | 3 % | 25 % | 0 % | 66 (fragile) |
| Sequedin | 0 % | 87 % | 8 % | 4 % | 0 % | 62 (fragile) |
| Wattignies | 0 % | 51 % | 6 % | 40 % | 3 % | 63 (fragile) |
| Béthune | 0 % | 69 % | 5 % | 26 % | 0 % | 68 (fragile) |
| Hénin-Beaumont | 0 % | 86 % | 0 % | 14 % | 0 % | 47 (fragile) |
| Paris 8e Arrondissement | 0 % | 12 % | 3 % | 82 % | 3 % | 52 (fragile) |
| Paris 9e Arrondissement | 0 % | 11 % | 0 % | 88 % | 1 % | 58 (fragile) |
| Avelin | 0 % | 81 % | 0 % | 15 % | 4 % | 46 (fragile) |
| Hallennes-lez-Haubourdin | 0 % | 70 % | 10 % | 20 % | 0 % | 41 (fragile) |
| Hazebrouck | 0 % | 70 % | 0 % | 29 % | 0 % | 46 (fragile) |
| Mouvaux | 0 % | 95 % | 0 % | 5 % | 0 % | 40 (fragile) |
| Paris 15e Arrondissement | 0 % | 28 % | 0 % | 64 % | 5 % | 42 (fragile) |

## Tableau · IRIS

| IRIS | Type | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Stationnement réservé |
|---|---|---|---|---|---|---|---|
| Lille Centre 6 | A | 609 | 9 % | 7 % | 54 % | 80 % | 17 % |
| Lille Centre 7 | A | 27 | 13 % | 4 % | 36 % | 52 % | 30 % |
| Lille Centre 9 | A | 139 | 17 % | 2 % | 47 % | 71 % | 10 % |
| Lille Centre 10 | A | 215 | 18 % | 7 % | 47 % | 62 % | 29 % |
| C.H.R. | A | 367 | 19 % | 1 % | 64 % | 86 % | 14 % |
| Lille Centre 5 | H | 853 | 21 % | 5 % | 48 % | 67 % | 16 % |
| Centre | H | 923 | 22 % | 8 % | 54 % | 55 % | 18 % |
| Lille Centre 11 | H | 1161 | 23 % | 3 % | 39 % | 64 % | 22 % |
| Magenta-Fombello | H | 759 | 24 % | 5 % | 57 % | 62 % | 24 % |
| Flandre | H | 1460 | 25 % | 7 % | 45 % | 66 % | 21 % |
| Mairie | H | 1215 | 26 % | 16 % | 41 % | 65 % | 15 % |
| Justice | H | 1340 | 26 % | 13 % | 46 % | 60 % | 26 % |
| Vieux Lille 3 | H | 1307 | 26 % | 6 % | 36 % | 56 % | 29 % |
| Montebello | H | 719 | 27 % | 10 % | 49 % | 66 % | 13 % |
| Saint-Maurice-Saint-Gabriel | H | 740 | 27 % | 8 % | 52 % | 51 % | 19 % |
| Lille Centre 15 | H | 1007 | 28 % | 9 % | 41 % | 52 % | 37 % |
| Barthélemy | H | 1142 | 28 % | 16 % | 39 % | 52 % | 30 % |
| Lille Centre 12 | H | 1304 | 29 % | 6 % | 39 % | 50 % | 38 % |
| Lille Centre 18 | H | 1953 | 29 % | 14 % | 39 % | 56 % | 23 % |
| Lille Centre 17 | H | 765 | 29 % | 5 % | 40 % | 50 % | 50 % |
| Lille Centre 19 | H | 2175 | 30 % | 9 % | 38 % | 57 % | 37 % |
| Faubourg des Postes A | H | 528 | 30 % | 12 % | 41 % | 45 % | 26 % |
| Lannoy | H | 1017 | 30 % | 10 % | 51 % | 47 % | 28 % |
| Arras | H | 2282 | 31 % | 12 % | 42 % | 48 % | 40 % |
| Franklin | H | 1705 | 32 % | 10 % | 38 % | 54 % | 43 % |
| Vieux Lille 2 | H | 864 | 32 % | 10 % | 24 % | 46 % | 44 % |
| Sarrazins | H | 839 | 32 % | 9 % | 46 % | 54 % | 36 % |
| Vieux Lille 4 | H | 1871 | 32 % | 9 % | 29 % | 51 % | 38 % |
| Entrée Lille Fives | H | 1075 | 32 % | 6 % | 49 % | 47 % | 22 % |
| Citadelle | D | 68 | 33 % | 15 % | 29 % | 36 % | 61 % |
| Trévise | H | 1218 | 33 % | 10 % | 42 % | 51 % | 35 % |
| Marbrerie | H | 1018 | 33 % | 9 % | 48 % | 41 % | 23 % |
| Fac de Droit | H | 1368 | 33 % | 7 % | 45 % | 54 % | 26 % |
| Colson | H | 916 | 33 % | 6 % | 35 % | 56 % | 46 % |
| Lille Centre 16 | H | 1666 | 33 % | 9 % | 33 % | 46 % | 47 % |
| Lestiboudois | H | 592 | 34 % | 11 % | 33 % | 54 % | 33 % |
| Stations | H | 1632 | 34 % | 14 % | 36 % | 53 % | 42 % |
| Belfort | H | 800 | 34 % | 3 % | 48 % | 55 % | 32 % |
| Caulier | H | 1365 | 35 % | 6 % | 43 % | 48 % | 33 % |
| Lille Centre 8 | A | 111 | 35 % | 0 % | 36 % | 61 % | 33 % |
| Arsenal | H | 910 | 35 % | 10 % | 45 % | 60 % | 14 % |
| Seclin | H | 959 | 35 % | 11 % | 43 % | 50 % | 21 % |
| Faubourg des Postes B | H | 838 | 36 % | 5 % | 41 % | 38 % | 33 % |
| Vieux Lille 6 | H | 1038 | 36 % | 10 % | 25 % | 49 % | 30 % |
| Saint-Maurice des Champs | H | 1416 | 36 % | 7 % | 37 % | 35 % | 56 % |
| Cordonnier | H | 562 | 36 % | 13 % | 28 % | 53 % | 43 % |
| Brigode | H | 1073 | 36 % | 15 % | 35 % | 44 % | 52 % |
| Concorde 2 | H | 325 | 37 % | 1 % | 55 % | 73 % | 2 % |
| Mont de Terre | H | 1593 | 38 % | 12 % | 39 % | 38 % | 31 % |
| Vieux Bois-Blancs | H | 1392 | 38 % | 12 % | 36 % | 38 % | 38 % |
| Convention | H | 1036 | 38 % | 10 % | 44 % | 40 % | 34 % |
| Verhaeren | H | 505 | 39 % | 2 % | 48 % | 56 % | 15 % |
| Lille Centre 13 | A | 558 | 40 % | 11 % | 31 % | 31 % | 76 % |
| Arbonnoise | H | 1160 | 40 % | 12 % | 40 % | 48 % | 36 % |
| Lille Centre 4 | H | 1390 | 40 % | 12 % | 24 % | 48 % | 40 % |
| Vieux Lille 5 | H | 1797 | 40 % | 14 % | 23 % | 39 % | 44 % |
| Vauban-Esquermes | A | 125 | 41 % | 9 % | 30 % | 25 % | 70 % |
| Centre 3 | H | 1072 | 41 % | 7 % | 44 % | 39 % | 49 % |
| Saint-Maurice-Cimetière de l'Est | H | 1314 | 41 % | 9 % | 35 % | 28 % | 73 % |
| Catinat | H | 1025 | 41 % | 8 % | 34 % | 54 % | 39 % |
| Notre-Dame de Pellevoisin | H | 1053 | 41 % | 14 % | 33 % | 23 % | 60 % |
| Saint-Maurice-Briqueterie | H | 1379 | 42 % | 6 % | 39 % | 37 % | 57 % |
| Concorde 1 | H | 322 | 42 % | 0 % | 43 % | 44 % | 5 % |
| Giraudoux | H | 552 | 42 % | 2 % | 42 % | 46 % | 29 % |
| Grande Brasserie | H | 1172 | 42 % | 8 % | 34 % | 46 % | 44 % |
| Croisette B | H | 603 | 43 % | 2 % | 49 % | 46 % | 35 % |
| Marx Dormoy | H | 799 | 43 % | 9 % | 38 % | 28 % | 58 % |
| Pellevoisin-Rouges Barres | H | 914 | 44 % | 13 % | 32 % | 24 % | 38 % |
| Canteleu | H | 2092 | 44 % | 8 % | 36 % | 28 % | 55 % |
| Lille-Acier | H | 1204 | 44 % | 12 % | 33 % | 31 % | 65 % |
| Épine Mont de Terre 4 | H | 934 | 44 % | 9 % | 40 % | 34 % | 37 % |
| Balzac-Lazarre Garreau | H | 1057 | 44 % | 6 % | 44 % | 44 % | 42 % |
| Petit Maroc | H | 1058 | 45 % | 10 % | 33 % | 30 % | 40 % |
| Mont à Camp-Marais 1 | H | 1001 | 45 % | 6 % | 39 % | 34 % | 38 % |
| Les Sarts 2 | H | 758 | 45 % | 11 % | 36 % | 24 % | 34 % |
| Buisson | H | 1339 | 46 % | 11 % | 33 % | 24 % | 67 % |
| Aviateurs | H | 553 | 46 % | 12 % | 34 % | 44 % | 15 % |
| Vieux Lille 7 | H | 1063 | 46 % | 11 % | 25 % | 40 % | 52 % |
| Mitterie 1 | H | 1460 | 46 % | 5 % | 41 % | 26 % | 49 % |
| Centre 2 | H | 729 | 47 % | 7 % | 39 % | 38 % | 24 % |
| Épine Mont de Terre 5 | A | 143 | 48 % | 0 % | 43 % | 52 % | 39 % |
| Faubourg de Douai | H | 2164 | 48 % | 16 % | 27 % | 40 % | 46 % |
| Mont à Camp-Marais 2 | H | 889 | 48 % | 3 % | 39 % | 27 % | 51 % |
| Épine Mont de Terre 3 | H | 1100 | 49 % | 11 % | 29 % | 28 % | 28 % |
| Baltique-Vieux Faubourg | H | 1205 | 49 % | 9 % | 29 % | 33 % | 42 % |
| Croisette A | H | 817 | 53 % | 2 % | 29 % | 36 % | 39 % |
| Mont à Camp-Marais 4 | H | 701 | 54 % | 8 % | 28 % | 24 % | 26 % |
| Zone d'Activités-Marché d'Intérêt National | A | 201 | 54 % | 4 % | 28 % | 20 % | 85 % |
| Bourg Délivrance 5 | H | 759 | 54 % | 5 % | 32 % | 23 % | 54 % |
| Les Sarts 3 | H | 771 | 54 % | 9 % | 26 % | 19 % | 55 % |
| Sud Marais 3 | H | 842 | 54 % | 4 % | 32 % | 26 % | 29 % |
| Les Sarts 1 | H | 605 | 56 % | 4 % | 26 % | 38 % | 22 % |
| Centre 1 | H | 634 | 56 % | 5 % | 31 % | 25 % | 40 % |
| Sud Marais 1 | H | 1792 | 57 % | 9 % | 24 % | 18 % | 53 % |
| Vieux Lille 1 | H | 2080 | 57 % | 9 % | 17 % | 24 % | 80 % |
| Mont à Camp-Marais 3 | H | 1035 | 58 % | 9 % | 26 % | 16 % | 32 % |
| Mitterie 2 | H | 800 | 58 % | 1 % | 34 % | 32 % | 50 % |
| Épine Mont de Terre 1 | A | 86 | 59 % | 3 % | 35 % | 48 % | 52 % |
| Sud Marais 2 | H | 767 | 62 % | 8 % | 20 % | 24 % | 29 % |
| Bourg Délivrance 4 | H | 951 | 62 % | 3 % | 31 % | 16 % | 72 % |
| Épine Mont de Terre 2 | H | 476 | 62 % | 1 % | 27 % | 29 % | 39 % |
| 400 Maisons-Cimetière du Sud | H | 501 | 64 % | 7 % | 24 % | 38 % | 26 % |
| Bourg Délivrance 3 | H | 953 | 64 % | 2 % | 26 % | 15 % | 68 % |
| Bourg Délivrance 2 | H | 692 | 65 % | 3 % | 22 % | 17 % | 71 % |
| Lopofa-Tudor | A | 538 | 71 % | 4 % | 20 % | 21 % | 80 % |
| Lille Centre 1 | A | 0 | nan % | nan % | nan % | nan % | nan % |
| Lille Centre 14 | A | 0 | nan % | nan % | nan % | nan % | nan % |
| Strasbourg | H | 0 | nan % | nan % | nan % | 100 % | 0 % |
| La MEL | A | 0 | nan % | nan % | nan % | nan % | nan % |
| Plate-Forme Multimodale | A | 0 | nan % | nan % | nan % | nan % | nan % |

## Tableau · accès depuis les adresses (part des ménages estimée)

| Commune | commerce_alim_500m | grande_surface_500m | pharmacie_500m | medecin_generaliste_500m | ecole_elementaire_500m | college_1km | gare_2km | panier_quotidien_500m | bus_8h_7_9h | aucun_bus_7_9h | bus_4h_20_22h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lille | 99 % | 84 % | 94 % | 96 % | 95 % | 96 % | 86 % | 90 % | 0 % | 98 % | 0 % |
| Tourcoing | 98 % | 75 % | 92 % | 94 % | 94 % | 87 % | 65 % | 86 % | 0 % | 100 % | 0 % |
| Roubaix | 99 % | 64 % | 96 % | 94 % | 97 % | 96 % | 63 % | 94 % | 0 % | 100 % | 0 % |
| Villeneuve-d'Ascq | 80 % | 53 % | 72 % | 82 % | 81 % | 90 % | 77 % | 58 % | 0 % | 100 % | 0 % |
| Wattrelos | 82 % | 29 % | 82 % | 74 % | 84 % | 74 % | 26 % | 68 % | 0 % | 100 % | 0 % |
| Marcq-en-Barœul | 80 % | 50 % | 77 % | 90 % | 83 % | 74 % | 61 % | 61 % | 0 % | 100 % | 0 % |
| Lambersart | 92 % | 71 % | 86 % | 92 % | 90 % | 92 % | 67 % | 76 % | 0 % | 100 % | 0 % |

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

# Dossier d'entrée de rédaction · Niort (79191)

Fiche source : `fiches/79191/fiche.json` (générée le 2026-10-13T10:41:34Z, jour de référence 2026-10-13, sha256 `45ab568a0609c943`). Dossier généré le 2026-10-13T12:36:29Z par `outil/dossier_redaction.py`.

Ce dossier est **la seule matière** de la rédaction. Chaque fait a un identifiant stable (colonne `id`) : c'est lui que cite la correspondance interne du brouillon. Un fait qui n'est pas ici n'existe pas pour l'article.

**Statuts.** `utilisable` : à écrire tel quel (valeur arrondie de la colonne « Valeur »). `fragile` : ordre de grandeur seulement, jamais en chiffre de titre ni comme seul appui d'un angle, et seulement avec la précision du motif. `absent` : ne pas écrire.

## 1. Périmètres exacts

- **Commune étudiée** : Niort (79191), département 79, intercommunalité CA du Niortais.
- **Groupe « voisines » de la fiche** : Chauray (79081), Aiffres (79003) et Bessines (79034). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Ne jamais écrire « les communes voisines » sans cette liste exacte ; ce groupe n'est pas « toutes les communes limitrophes ».
- **Unité urbaine INSEE** : code 79501 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)).

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut |
|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 10 % [IC 95 % : 9 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 7 % [IC 95 % : 7 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 70 % [IC 95 % : 69 % à 71 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 9 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Niort même | 75 % [IC 95 % : 74 % à 76 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence et de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Niort | 65 % [IC 95 % : 63 % à 66 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent à Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Chauray (79081), Aiffres (79003) et Bessines (79034) | 85 % [IC 95 % : 81 % à 88 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent dans l'une de ces communes : Chauray (79081), Aiffres (79003) et Bessines (79034) | commune de travail : Chauray (79081), Aiffres (79003) et Bessines (79034) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Niort et hors de Chauray (79081), Aiffres (79003) et Bessines (79034) | 87 % [IC 95 % : 85 % à 89 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent hors de Niort et hors de Chauray (79081), Aiffres (79003) et Bessines (79034) | commune de travail : toute commune autre que Niort, Chauray (79081), Aiffres (79003) et Bessines (79034) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Chauray (79081), Aiffres (79003) et Bessines (79034) moins travail à Niort | +20 points | deux groupes distincts (voir les deux faits) | commune de travail : Chauray (79081), Aiffres (79003) et Bessines (79034) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 9 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 45 % [IC 95 % : 44 % à 46 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 25 % [IC 95 % : 24 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Niort dont le ménage a au moins une voiture | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 74 % [IC 95 % : 72 % à 76 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 9 % [IC 95 % : 8 % à 11 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 2 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 61 % [IC 95 % : 59 % à 63 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 68 % [IC 95 % : 65 % à 70 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 15 % [IC 95 % : 14 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 30 % [IC 95 % : 28 % à 32 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 64 % [IC 95 % : 60 % à 67 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 5 % [IC 95 % : 3 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 20 % [IC 95 % : 17 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 23 % [IC 95 % : 20 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Niort | environ 48 300 | — | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent Niort | 40 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent Niort | 65 % [IC 95 % : 63 % à 66 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent Niort | 9 % [IC 95 % : 8 % à 10 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 7 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 94 % [IC 95 % : 91 % à 96 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 3 % [IC 95 % : 2 % à 5 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent hors de l'unité urbaine INSEE 79501 | 53 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent hors de l'unité urbaine INSEE 79501 | 94 % [IC 95 % : 94 % à 95 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 79501 | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent hors de l'unité urbaine INSEE 79501 | 4 % [IC 95 % : 3 % à 4 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 79501 | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Centre (IRIS 791910101) | 49 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Surimeau-Antes Cholette (IRIS 791910601) | 87 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +38 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 19 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 27 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 65 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable |
| `acces.79191.commerce_alim_500m` | Part des ménages (estimée) dont l'adresse a un commerce alimentaire à moins de 500 m | 75 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.grande_surface_500m` | Part des ménages (estimée) dont l'adresse a une grande surface à moins de 500 m | 38 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.pharmacie_500m` | Part des ménages (estimée) dont l'adresse a une pharmacie à moins de 500 m | 58 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.medecin_generaliste_500m` | Part des ménages (estimée) dont l'adresse a un médecin généraliste à moins de 500 m | 62 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.ecole_elementaire_500m` | Part des ménages (estimée) dont l'adresse a une école élémentaire à moins de 500 m | 66 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.college_1km` | Part des ménages (estimée) dont l'adresse a un collège à moins de 1 km | 83 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.gare_2km` | Part des ménages (estimée) dont l'adresse a une gare à moins de 2 km | 63 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.panier_quotidien_500m` | Part des ménages (estimée) dont l'adresse a à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m | 45 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable |
| `acces.79191.bus_8h_7_9h` | Part des ménages (estimée) dont l'adresse a au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | 75 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | fragile (réseau de bus et jour de référence à vérifier par un humain) |
| `acces.79191.aucun_bus_7_9h` | Part des ménages (estimée) dont l'adresse n'a aucun passage de bus entre 7 h et 9 h à moins de 400 m | 3 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | fragile (réseau de bus et jour de référence à vérifier par un humain) |
| `acces.79191.bus_4h_20_22h` | Part des ménages (estimée) dont l'adresse a au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | 9 % | tous les ménages de Niort | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | fragile (réseau de bus et jour de référence à vérifier par un humain) |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,56 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,77 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,14 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,63 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,52 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations à 12 km du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) |

### Limites par famille de faits

- `mobpro.modes.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. Le dénominateur inclut « pas de transport » (travail à domicile).
- `mobpro.travaille_dans_commune.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024).
- `mobpro.voiture_selon_destination.*` : Groupes distincts de personnes : l'écart décrit des pratiques, pas l'effet d'un changement d'emploi. Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- `mobpro.posseder_utiliser.*` : Parts d'ACTIFS, pas de ménages. Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. Ne pas lire « ménages sans voiture » : voir la base IRIS Logement pour les ménages.
- `mobpro.statut_occupation.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- `mobpro.qui_vient_travailler.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. « Unité urbaine » = INSEE 2020, via l'index.
- `iris.ecart_voiture.*` : Exploitation complémentaire : précision de quelques points par IRIS ; ne commenter que des écarts > 10 points. Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.
- `iris.menages_commune.*` : Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.
- `acces.adresses.*` : Proximité d'un équipement ≠ son usage. Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance. Point BPE = adresse de l'établissement, pas son entrée. Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.
- `carburant.evolution.*` : Le contrôle sur les mêmes stations (scripts/13) n'est pas fait par l'outil. Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas. Une hausse passée ne dit rien de l'avenir.

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : actifs occupés du secteur. Ménages : résidences principales. Panier quotidien : part des ménages (estimée) dont l'adresse a un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (vol d'oiseau). Bus : au moins 8 passages/h entre 7 h et 9 h à moins de 400 m (statut fragile tant que le réseau n'est pas vérifié). Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`, `bus_7_9h`. Ne commenter que des écarts de plus de 10 points.

| Code | Secteur | Statut | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m | Bus 7-9 h |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 791910101 | Centre | utilisable | 2303 | 49 % | 10 % | 15 % | 20 % | 38 % | 30 % | 100 % | 100 % |
| 791910401 | Clou Bouchet Nord | utilisable | 490 | 52 % | 11 % | 19 % | 16 % | 37 % | 33 % | 80 % | 100 % |
| 791910103 | Hôpital | utilisable | 802 | 54 % | 9 % | 10 % | 26 % | 28 % | 51 % | 96 % | 79 % |
| 791910102 | Gare | utilisable | 1193 | 54 % | 6 % | 14 % | 23 % | 33 % | 43 % | 77 % | 100 % |
| 791910404 | Clou Bouchet Sud | utilisable | 528 | 54 % | 6 % | 21 % | 12 % | 43 % | 14 % | 87 % | 92 % |
| 791910301 | Sud Ribray | utilisable | 1604 | 63 % | 8 % | 8 % | 17 % | 14 % | 67 % | 67 % | 98 % |
| 791910201 | Nord Partie Inférieure | utilisable | 1098 | 64 % | 9 % | 7 % | 18 % | 25 % | 59 % | 46 % | 100 % |
| 791910303 | Boucle Sèvre | utilisable | 1578 | 65 % | 10 % | 8 % | 12 % | 22 % | 69 % | 75 % | 87 % |
| 791910202 | Nord Partie Supérieure | utilisable | 1203 | 68 % | 8 % | 13 % | 8 % | 26 % | 56 % | 50 % | 77 % |
| 791910403 | Four Chabot Gavacherie | utilisable | 590 | 69 % | 5 % | 17 % | 8 % | 38 % | 43 % | 37 % | 89 % |
| 791910402 | Venise Verte | utilisable | 829 | 72 % | 7 % | 9 % | 6 % | 13 % | 72 % | 41 % | 73 % |
| 791910604 | Champclairot | utilisable | 1335 | 73 % | 9 % | 8 % | 6 % | 12 % | 73 % | 47 % | 70 % |
| 791910302 | Saint-Florent | utilisable | 1153 | 73 % | 9 % | 5 % | 8 % | 10 % | 85 % | 30 % | 48 % |
| 791910701 | Champommier | utilisable | 2191 | 77 % | 6 % | 6 % | 6 % | 9 % | 78 % | 33 % | 77 % |
| 791910602 | Justices-Brizeaux | utilisable | 985 | 78 % | 5 % | 7 % | 6 % | 8 % | 76 % | 5 % | 61 % |
| 791910702 | Goise | utilisable | 900 | 79 % | 7 % | 5 % | 5 % | 17 % | 81 % | 4 % | 60 % |
| 791910603 | Moulin à Vent-Souche | utilisable | 838 | 80 % | 5 % | 9 % | 1 % | 6 % | 85 % | 0 % | 57 % |
| 791910203 | Baticoop | utilisable | 1103 | 80 % | 7 % | 4 % | 6 % | 16 % | 76 % | 31 % | 47 % |
| 791910503 | Sainte-Pezenne | utilisable | 1142 | 81 % | 5 % | 6 % | 3 % | 7 % | 76 % | 9 % | 73 % |
| 791910502 | Coteau Saint-Hubert | utilisable | 1355 | 82 % | 5 % | 4 % | 5 % | 7 % | 86 % | 10 % | 92 % |
| 791910501 | Saint-Liguaire-Nantes | utilisable | 1136 | 86 % | 6 % | 5 % | 0 % | 3 % | 86 % | 0 % | 8 % |
| 791910601 | Surimeau-Antes Cholette | utilisable | 1215 | 87 % | 4 % | 5 % | 1 % | 7 % | 86 % | 0 % | 2 % |
| 791910505 | Zone d'Activités Technopole | absent (secteur d'activité, exclu) | | | | | | | | | |
| 791910605 | Zone d'Activités de Souche | absent (secteur d'activité, exclu) | | | | | | | | | |
| 791910703 | Zone d'Activités de Saint-Florent | absent (secteur d'activité, exclu) | | | | | | | | | |
| 791910504 | Zone d'Activités de Saint-Liguaire | absent (secteur d'activité, exclu) | | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Niort)

Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut |
|---|---:|---:|---:|---:|---:|---:|---|
| Niort (79191) | 75 % | 65 % | 9 % | 9 % | 13 % | 6148 | utilisable |
| Chauray (79081) | 7 % | 85 % | 2 % | 10 % | 0 % | 538 | utilisable |
| La Crèche (79048) | 2 % | 94 % | 2 % | 4 % | 1 % | 151 | utilisable |
| Bessines (79034) | 1 % | 89 % | 3 % | 7 % | 0 % | 85 | fragile |
| Échiré (79109) | 1 % | 95 % | 0 % | 4 % | 1 % | 79 | fragile |
| Prahecq (79216) | 1 % | 90 % | 4 % | 4 % | 0 % | 52 | fragile |
| Saint-Maixent-l'École (79270) | 1 % | 95 % | 0 % | 5 % | 0 % | 66 | fragile |
| La Rochelle (17300) | 1 % | 75 % | 0 % | 21 % | 2 % | 51 | fragile |
| Aiffres (79003) | 1 % | 67 % | 6 % | 14 % | 4 % | 51 | fragile |
| Melle (79174) | 1 % | 97 % | 0 % | 3 % | 0 % | 46 | fragile |
| Poitiers (86194) | 1 % | 49 % | 3 % | 39 % | 1 % | 44 | fragile |

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Niort. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Niort | Lignes (vers Niort) | Statut (vers Niort) |
|---|---:|---:|---:|---:|---:|---|
| Chauray (79081) | 92 % | 3 % | 2 % | 95 % | 329 | utilisable |
| Aiffres (79003) | 91 % | 1 % | 4 % | 93 % | 221 | utilisable |
| Bessines (79034) | 90 % | 3 % | 2 % | 92 % | 88 | fragile |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des ménages (estimée). Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Colonnes bus : fragiles (réseau à vérifier).

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km | bus_8h_7_9h |
|---|---|---|---|---|---|---|
| Niort (79191) | 75 % | 58 % | 66 % | 45 % | 63 % | 75 % |
| Chauray (79081) | 48 % | 20 % | 38 % | 14 % | 0 % | 33 % |
| Aiffres (79003) | 39 % | 44 % | 24 % | 3 % | 0 % | 0 % |
| Bessines (79034) | 49 % | 0 % | 25 % | 0 % | 0 % | 7 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km ; `bus_8h_7_9h` = au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,75 €/L | environ 90 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,75 €/L | environ 270 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,75 €/L | environ 630 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,50 €/L | environ 60 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,50 €/L | environ 180 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,50 €/L | environ 420 € |

## 8. Faits absents : ne pas les écrire, ne pas les reconstituer

- Rang ou comparaison avec d'autres communes françaises (vélo, voiture, « taille comparable ») : agrégat national calculé une fois pour La Rochelle (scripts/01), hors de la fiche.
- Population totale de la commune, nombre de ménages de la commune : non exposés par la fiche.
- Composition de l'unité urbaine (liste et nombre de communes) : la fiche ne donne que son code.
- Part de la voiture pour un groupe de communes de travail autre que ceux listés : recalcul MOBPRO nécessaire (cf. scripts/10_incertitude.py).
- Temps de trajet, kilomètres routiers, itinéraires à vélo : exploration seulement, résultats divergents selon le calcul.
- Autopartage, vélos en libre-service : flux GBFS propres à chaque réseau, non collectés.
- Usage réel des équipements (où l'on fait ses courses, où vont les enfants) : aucune source.
- Réaction des habitants à la hausse du carburant : les pratiques datent de 2022, les prix de 2025-2026.
- Contrôle de la hausse sur les mêmes stations : non fait par l'outil (scripts/13 pour La Rochelle).

## 9. Visuels disponibles ou réalisables

| Visuel | État | Faits | Étape manuelle |
|---|---|---|---|
| Carte de la part de la voiture par secteur (IRIS) | réalisable | secteurs (tableau), iris.voiture.min/max | poser les libellés des secteurs cités (--libelles CODE,… place au centre ; positions fines à la main) ; légende HTML et texte alternatif à relire |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable, non automatisé | mobpro.voiture_selon_destination.* ou tableau des destinations (lignes utilisables seulement) | paramétrer groupes, intitulés et valeurs ; la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Niort et Chauray (79081), Aiffres (79003) et Bessines (79034) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
| Tableau du scénario de surcoût de carburant | disponible (données ci-dessus) | scenario.carburant.* | aucun |

## 10. Vérifications humaines en attente (avant publication)

- `mobpro.voiture_selon_destination` : Le choix des voisines change le chiffre « communes voisines » : le relire.
- `iris.ecart_voiture` : Relire les libellés d'IRIS avant de les citer comme noms de quartiers.
- `acces.adresses` : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire.

## 11. Paramètres éditoriaux

### Lecteur et question

**Lecteur visé.** Une personne ou un ménage qui cherche un logement (achat ou location) dans la commune ou autour, et qui se demande quelle place la voiture prendra dans sa vie quotidienne. Elle ne connaît pas les sources statistiques. Elle veut savoir quoi regarder pendant ses recherches et ses visites.

**Question à éclairer.** Depuis quel quartier, et pour quels trajets, peut-on vivre dans cette commune en utilisant moins la voiture ? Ce que les pratiques observées, les équipements proches et le coût du carburant disent de cette question, et ce qu'il reste à vérifier soi-même.

### Longueur et formats

| Format | Quand | Longueur indicative |
|---|---|---|
| Article complet | Au moins deux angles utilisables et distinctifs (voir ci-dessous) | 700 à 1 000 mots hors méthode |
| Article court | Un seul angle distinctif, ou une matière surtout communale | 300 à 500 mots hors méthode |
| Ne pas publier | Aucun angle distinctif : les faits sont exacts mais n'apprennent rien au lecteur qui ne soit vrai presque partout | Une note de quelques lignes qui explique pourquoi |

La méthode, en fin d'article, n'est pas comptée. Elle reste brève : sources, millésimes, populations, définitions techniques.

### Choisir un angle

L'angle se choisit d'après les faits du dossier, jamais d'après un autre article. Un angle est **distinctif** quand il apprend au lecteur quelque chose de propre à cette commune, et **utilisable** quand ses faits ont le statut « utilisable ».

Angles possibles, à retenir seulement si la condition est remplie. *Les seuils chiffrés ci-dessous sont des propositions du 13/10/2026, à valider par le porteur avant un usage régulier ; tirés de l'article pilote, ils n'ont pas été éprouvés sur d'autres communes.*

1. **Écart entre quartiers.** Condition : au moins 15 points entre la part de la voiture du secteur le plus bas et celle du plus haut, parmi les secteurs d'habitat utilisables. Les écarts de moins de 10 points entre deux secteurs ne se commentent pas.
2. **Le lieu de travail.** Condition : un écart d'au moins 10 points entre deux groupes de destination, chacun « utilisable ». Toujours nommer la liste exacte des communes du groupe.
3. **Posséder sans utiliser.** Condition : fait `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` utilisable et d'au moins 20 %. Sans comparaison avec d'autres communes dans le dossier, ne pas dire si c'est beaucoup ou peu.
4. **Un quartier équipé où la voiture domine.** Condition : un secteur utilisable dont au moins 90 % des ménages ont le panier quotidien à 500 m, et dont la part de la voiture est dans le tiers le plus élevé des secteurs de la commune. Les bus fréquents ne s'ajoutent qu'après la vérification humaine du réseau. Décrire la proximité, jamais l'usage des équipements.
5. **Le stationnement au centre.** Condition : des secteurs utilisables où moins de la moitié des ménages a une place réservée, à au moins 20 points sous la part communale.
6. **Ceux qui viennent travailler dans la commune.** Condition : fait `qui_vient_travailler` utilisable. Décrire, sans déduire de kilomètres ni de coût.
7. **Le coût du carburant selon la distance.** Condition : faits carburant utilisables et extraction de moins de deux semaines à la date de publication. Le scénario pré-calculé suffit ; il ne s'attribue à aucun quartier ni à aucune commune.

**Entrée de l'article.** Deux possibilités, aucune obligatoire : un fait d'actualité (la hausse du carburant, si elle amène la question) ou une question durable de recherche résidentielle. Choisir celle qui sert le mieux les angles retenus.

**Ce qu'on n'écrit pas faute de donnée.** Toute comparaison avec d'autres communes françaises (rang, « ville de vélo », « plus que la moyenne ») sauf si un fait du dossier la donne ; tout temps de trajet ou kilométrage ; tout lien de cause entre un quartier et une pratique.

### Visuels

Proposer au plus trois visuels, choisis dans la section « Visuels disponibles ou réalisables » du dossier, chacun posé à côté du passage qu'il éclaire. Une carte de situation n'accompagne que la comparaison de communes qu'elle situe, avec la même liste exacte.

### Capacités produit et invitations admissibles

Vérifiées dans le code le **12/10/2026** (révision `a25fa9fd`), aucun parcours joué dans le navigateur. À revérifier avant publication si la date de publication est postérieure de plus d'un mois.

| Capacité | Formulation admissible |
|---|---|
| Équipements autour d'une adresse (BPE, à vol d'oiseau) | « Les équipements les plus proches de votre adresse, et combien à moins de 500 m » |
| Équipement automobile du secteur | « La part des ménages équipés d'une voiture dans le secteur de votre adresse, comparée à la commune » |
| Temps de trajet estimé vers un lieu déclaré, voiture ou marche | « Une estimation du temps en voiture ou à pied vers un lieu que vous indiquez (votre travail, par exemple) » |
| Position de la commune pour la part de la voiture domicile-travail | « La position de votre commune pour la part des actifs qui vont travailler en voiture » |
| Comparateur de communes | « Comparer des communes selon la place de la voiture dans les trajets domicile-travail et le temps estimé vers votre lieu de travail » |

Interdits : promettre un budget ou un coût de déplacement calculé, des horaires ou fréquences de bus à l'adresse, des temps à vélo ou en transports en commun, ou les parts de la voiture par secteur de l'article (analyse de la rédaction, absente du dossier d'adresse).

La conclusion vers futur•e est courte (deux ou trois phrases) et n'emploie que ces formulations. L'offre n'est jamais le sujet de la phrase d'entrée : partir de ce que le lecteur veut vérifier.

## 12. Voix futur•e

*(Recopié de `NOTE_EDITORIALE.md`, section 2, à la génération du dossier.)*

- La voix est sérieuse, concrète et vivante. Une phrase marquante est permise quand elle dit quelque chose de juste (« la place pour la voiture se regarde comme la cave ou le balcon ») ; ce qui est proscrit, c'est le slogan automatique de fin de paragraphe.
- Partir d'une situation reconnaissable du lecteur (annonce, visite, trajet du matin, plein, horaires), puis faire avancer le récit par les données.
- Deux entrées possibles, aucune obligatoire : un fait d'actualité, s'il amène la question que les données éclairent (sinon il reste un décor) ; ou une question durable de recherche résidentielle (« depuis ce quartier, pourra-t-on se passer de la voiture ? »).
- Le millésime se dit clairement une fois dans le récit et figure sur chaque visuel ; ensuite, présent simple, sans « aujourd'hui » ni « habitants actuels ».
- Décrire ce qui est mesuré : la proximité d'un équipement n'est pas son usage (« une école à moins de 500 mètres », pas « l'école se fait près de chez soi »).

#### Contre la surjustification

Le lecteur n'a pas besoin qu'on lui répète ce que le texte ne mesure pas. Un article qui s'excuse à chaque paragraphe prend une voix scolaire.

- Garder une précision seulement si elle **change le sens** : « deux groupes distincts » sous une comparaison qui inviterait à une lecture causale, les hypothèses d'un scénario (consommation, nombre d'allers-retours, variation du prix).
- Définir une notion **une fois, au bon endroit**, sans la redéfinir ensuite.
- Le détail technique (vol d'oiseau, sondage, seuils, millésimes des contours) va dans la méthode ou la légende, pas dans le récit.
- Supprimer les évidences : un tableau intitulé « surcoût de carburant » n'a pas à énumérer ensuite l'assurance, l'entretien et le stationnement ; « sept fois plus de kilomètres coûtent sept fois plus » n'apprend rien.
- Ne pas remplacer une justification supprimée par une autre formule de prudence.
- Pas de déduction en chaîne que les données ne portent pas (« ils habitent plus loin, donc roulent plus, donc paient plus ») : quand un scénario chiffré montre déjà l'effet, il suffit.
- Décrire des pratiques, jamais des contraintes : aucun quartier n'« impose » un mode de vie ; ne jamais attribuer une pratique au seul quartier ; ne culpabiliser personne.
- Pas de hiérarchie causale que les données ne mesurent pas (« compte plus que », « dépend d'abord de »).
- Pas de transitions annoncées (« voici le résultat le plus utile »), de maximes de fin de section, d'antithèses d'emphase, ni de témoignages ou scènes inventés. Le texte doit rester concret après suppression de ses phrases d'accroche.
- Chiffres arrondis et lisibles ; populations explicites (actifs, ménages, adresses) ; aucune précision qui laisserait croire à une mesure exacte.
- La conclusion vers futur•e est courte et ne promet que ce que la matrice article / produit dit visible et admissible.
- Chaque chiffre doit apporter quelque chose au lecteur : on n'ajoute pas un fait parce qu'il est disponible.


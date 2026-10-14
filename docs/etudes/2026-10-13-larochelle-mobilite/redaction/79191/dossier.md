# Dossier d'entrée de rédaction · Niort (79191)

Fiche source : `fiches/79191/fiche.json` (générée le 2026-10-13T10:41:34Z, jour de référence 2026-10-13, sha256 `45ab568a0609c943`). Dossier généré le 2026-10-14T12:43:03Z par `outil/dossier_redaction.py`.

Ce dossier est **la seule matière** de la rédaction. Chaque fait a un identifiant stable (colonne `id`) : c'est lui que cite la correspondance interne du brouillon. Un fait qui n'est pas ici n'existe pas pour l'article.

**Statut et usage.** La colonne « Usage » dit ce que l'on peut écrire :

| Statut | Ce que cela veut dire | Usage |
|---|---|---|
| `utilisable` | donnée exploitable, population, source et périmètre identifiés | `oui` : à écrire tel quel (valeur arrondie de la colonne « Valeur ») |
| `fragile` | faible précision statistique (petit échantillon) | `ordre de grandeur` : jamais en chiffre de titre ni comme seul appui de la réponse, avec la précision du motif |
| `en attente de validation` | dépend d'une vérification humaine non faite (réseau de bus, jour de référence) | `non` : ne pas écrire, même arrondi ou en termes vagues ; la valeur n'est pas donnée |
| `absent` | pas de donnée, ou secteur exclu | `non` |

Les **informations documentaires** (section 2 bis, identifiants `doc.*`) ne sont pas des résultats calculés : elles ont leur propre colonne Usage (`oui`, `avec ses conditions`, `non`).

**Populations.** Trois populations distinctes, à ne pas mélanger : les **actifs** occupés (pratiques domicile-travail, fichier MOBPRO et base IRIS Activité), les **ménages** (voiture, stationnement, base IRIS Logement), les **adresses** (proximité des équipements, Base adresse nationale). Une part d'adresses n'est pas une part de ménages ni d'habitants.

## 1. Périmètres exacts

- **Commune étudiée** : Niort (79191), département 79, intercommunalité CA du Niortais.
- **Groupe de communes nommé** : Chauray (79081), Aiffres (79003) et Bessines (79034). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces trois communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 79501 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 10 % [IC 95 % : 9 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 7 % [IC 95 % : 7 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 70 % [IC 95 % : 69 % à 71 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 9 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort, y compris ceux qui ne se déplacent pas | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Niort même | 75 % [IC 95 % : 74 % à 76 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence et de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Niort | 65 % [IC 95 % : 63 % à 66 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent à Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Chauray (79081), Aiffres (79003) et Bessines (79034) | 85 % [IC 95 % : 81 % à 88 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent dans l'une de ces communes : Chauray (79081), Aiffres (79003) et Bessines (79034) | commune de travail : Chauray (79081), Aiffres (79003) et Bessines (79034) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Niort et hors de Chauray (79081), Aiffres (79003) et Bessines (79034) | 87 % [IC 95 % : 85 % à 89 %] | actifs occupés de 15 ans ou plus résidant à Niort qui travaillent hors de Niort et hors de Chauray (79081), Aiffres (79003) et Bessines (79034) | commune de travail : toute commune autre que Niort, Chauray (79081), Aiffres (79003) et Bessines (79034) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Chauray (79081), Aiffres (79003) et Bessines (79034) moins travail à Niort | +20 points | deux groupes distincts (voir les deux faits) | commune de travail : Chauray (79081), Aiffres (79003) et Bessines (79034) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 9 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 45 % [IC 95 % : 44 % à 46 %] | tous les actifs occupés de 15 ans ou plus résidant à Niort | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 25 % [IC 95 % : 24 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Niort dont le ménage a au moins une voiture | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 74 % [IC 95 % : 72 % à 76 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 9 % [IC 95 % : 8 % à 11 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 2 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 61 % [IC 95 % : 59 % à 63 %] | actifs occupés de 15 ans ou plus résidant à Niort, propriétaires de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 68 % [IC 95 % : 65 % à 70 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 15 % [IC 95 % : 14 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 30 % [IC 95 % : 28 % à 32 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires du privé de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 64 % [IC 95 % : 60 % à 67 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 5 % [IC 95 % : 3 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 20 % [IC 95 % : 17 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 23 % [IC 95 % : 20 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Niort, locataires HLM de leur logement | commune de résidence : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Niort | environ 48 300 | — | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent Niort | 40 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent Niort | 65 % [IC 95 % : 63 % à 66 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent Niort | 9 % [IC 95 % : 8 % à 10 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent Niort | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 7 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 94 % [IC 95 % : 91 % à 96 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | 3 % [IC 95 % : 2 % à 5 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 79501 (liste des communes non exposée par la fiche) | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Niort, de ceux qui habitent hors de l'unité urbaine INSEE 79501 | 53 % | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Niort et habitent hors de l'unité urbaine INSEE 79501 | 94 % [IC 95 % : 94 % à 95 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 79501 | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Niort et habitent hors de l'unité urbaine INSEE 79501 | 4 % [IC 95 % : 3 % à 4 %] | actifs occupés qui travaillent à Niort, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 79501 | commune de travail : Niort (79191) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Centre (IRIS 791910101) | 49 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Surimeau-Antes Cholette (IRIS 791910601) | 87 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +38 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Niort (79191), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 19 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 27 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 65 % | toutes les résidences principales de Niort | commune : Niort (79191) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.79191.commerce_alim_500m` | Part des adresses de Niort qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.grande_surface_500m` | Part des adresses de Niort qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 38 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.pharmacie_500m` | Part des adresses de Niort qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 58 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.medecin_generaliste_500m` | Part des adresses de Niort qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 62 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.ecole_elementaire_500m` | Part des adresses de Niort qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 66 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.college_1km` | Part des adresses de Niort qui ont un collège à moins de 1 km (à vol d'oiseau) | 83 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.gare_2km` | Part des adresses de Niort qui ont une gare à moins de 2 km (à vol d'oiseau) | 63 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.panier_quotidien_500m` | Part des adresses de Niort qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 45 % | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.79191.bus_8h_7_9h` | Part des adresses de Niort qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.79191.aucun_bus_7_9h` | Part des adresses de Niort sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.79191.bus_4h_20_22h` | Part des adresses de Niort qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Niort, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Niort (79191) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tanlib » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-nio-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,56 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,77 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,14 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,63 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,52 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Niort (centre communal de geo.api.gouv.fr : [-0.4613, 46.3274]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |

### Limites par famille de faits

- `mobpro.modes.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. Le dénominateur inclut « pas de transport » (travail à domicile).
- `mobpro.travaille_dans_commune.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024).
- `mobpro.voiture_selon_destination.*` : Groupes distincts de personnes : l'écart décrit des pratiques, pas l'effet d'un changement d'emploi. Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- `mobpro.posseder_utiliser.*` : Parts d'ACTIFS, pas de ménages. Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. Ne pas lire « ménages sans voiture » : voir la base IRIS Logement pour les ménages.
- `mobpro.statut_occupation.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs.
- `mobpro.qui_vient_travailler.*` : Trajets domicile-travail des actifs seulement : ni achats, ni école, ni loisirs. Pratiques du recensement 2022 (collectes 2020 à 2024). Mode et lieu de travail issus d'un échantillon : intervalles indicatifs. « Unité urbaine » = INSEE 2020, via l'index.
- `iris.ecart_voiture.*` : Exploitation complémentaire, estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés (aucune marge d'erreur par secteur n'est fournie : ne pas en écrire). Libellés d'IRIS INSEE, pas toujours les noms d'usage des quartiers.
- `iris.menages_commune.*` : Tous ménages (retraités, étudiants compris) : à ne pas comparer aux parts d'actifs de MOBPRO.
- `acces.adresses.*` : Part d'adresses, pas de ménages ni d'habitants. Proximité d'un équipement ≠ son usage. Vol d'oiseau : la marche réelle peut être 1,3 à 6 fois plus longue à courte distance. Point BPE = adresse de l'établissement, pas son entrée. Offre de bus théorique d'un jour donné : ni ponctualité, ni temps de trajet.
- `carburant.evolution.*` : Le contrôle sur les mêmes stations (scripts/13) n'est pas fait par l'outil. Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas. Une hausse passée ne dit rien de l'avenir.

## 2 bis. Informations documentaires (non calculées)

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-14 ; fichier `redaction/79191/complement.json`). Ce ne sont **pas** des résultats calculés : aucune fréquence, aucun temps de trajet, aucune desserte d'adresse n'en est tirée, et tu n'en tires aucun. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.tanlib.gratuite` | Le réseau de bus Tanlib est gratuit pour tout le monde depuis le 1er septembre 2017. La page liste comme gratuits : lignes urbaines 1 à 10, Navette Centre-Ville, Navette Colline Saint-André, Tanlib Express 1, 2 et 3, lignes périurbaines 20, 21, 22, 24, 25 et 26, lignes scolaires, services Flex (sur réservation), lignes régionales 144 à 149 « à l'intérieur des communes de la Communauté d'Agglomération du Niortais ». | tanlib.com, « Réseau de bus 100 % gratuit » : https://www.tanlib.com/a-reseau-de-bus-100-gratuit-7/ | 2026-10-14 | en vigueur à la consultation (depuis le 01/09/2017) | réseau Tanlib, communes de Niort Agglo | `oui` | La gratuité porte sur le prix, pas sur la desserte : elle ne dit ni qu'une ligne passe près d'une adresse, ni qu'un trajet est faisable ou pratique. |
| `doc.tanlib.gratuite.regionales` | Sur les lignes régionales 144 à 149, la gratuité ne vaut qu'à l'intérieur de l'agglomération. La ligne 140E (La Rochelle – Niort) n'est pas dans la liste de la page. | même page que doc.tanlib.gratuite | 2026-10-14 | en vigueur à la consultation | lignes régionales | `avec ses conditions` |  |
| `doc.tanlib.urbaines.jours` | Les fiches horaires des lignes urbaines 1 à 9 portent « Ne circule pas les dimanches et jours fériés » ; celle de la ligne 10, « Ne circule pas les week-end et jours fériés ». | fiches horaires PDF https://www.tanlib.com/dl/ligne-1.pdf à https://www.tanlib.com/dl/ligne-10.pdf (fichiers du 02/10/2026) | 2026-10-14 | « Horaires valables à partir du 1er septembre 2026 » (fiches 1 à 10) | lignes urbaines 1 à 10 ; navettes, Tanlib Express et lignes périurbaines non vérifiées | `oui` | Ne pas étendre aux navettes ni aux lignes périurbaines. |
| `doc.tanlib.fiches.periodes` | La fiche de la ligne 1 donne des grilles distinctes du lundi au vendredi et du samedi ; certaines courses ne circulent qu'en période scolaire, d'autres qu'en vacances scolaires. Elle précise : « Horaires indicatifs. La circulation et ses aléas peuvent modifier les horaires. » | https://www.tanlib.com/dl/ligne-1.pdf | 2026-10-14 | à partir du 01/09/2026 | ligne 1 seulement : exemple de présentation, pas une règle vérifiée sur tout le réseau | `oui` | Pour le réseau, écrire au plus que les horaires du samedi ou des vacances « peuvent différer » ; aucun chiffre de fréquence. |
| `doc.tanlib.verifier` | Pour vérifier un trajet : calcul d'itinéraire en bus sur tanlib.com, fiches horaires par ligne, horaires en temps réel par QR code aux arrêts et dans l'appli Tanlib. | https://www.tanlib.com/itineraire-bus/ ; https://www.tanlib.com/horaires-par-ligne/ ; fiche ligne 1 (encadré « Horaires temps réel ») | 2026-10-14 | non précisée | réseau Tanlib | `oui` |  |
| `doc.tanlib.navette_gare_dimanche` | Navette du dimanche soir : départs de la gare de Niort le dimanche de 18 h à 21 h, vers les arrêts de la ville de Niort uniquement, horaires calés sur l'arrivée des trains ; gratuite et sans réservation. | « Flex Gares et Navette Gare Niort du dimanche soir » : https://www.tanlib.com/a-services-gares-1012/ | 2026-10-14 | en vigueur à la consultation | gare de Niort vers les arrêts de Niort | `avec ses conditions` |  |
| `doc.tanlib.flex_actifs` | Service Flex Actifs : sur réservation, après une convention entre la personne, son employeur et Tanlib ; du lundi au vendredi de 4 h 45 à 23 h 30 (sauf jours fériés), vers les zones d'activités aux abords des arrêts Brèche et Hôpital ; l'arrêt Hôpital est aussi desservi le samedi et le dimanche pour le personnel hospitalier. | https://www.tanlib.com/a-service-flex-actifs-1014/ | 2026-10-14 | en vigueur à la consultation | personnes dont l'employeur a signé la convention | `avec ses conditions` | Ne rien dire des employeurs qui l'ont signée : la page ne le dit pas. |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés du secteur. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 791910101 | Centre | utilisable | `oui` | 2303 | 49 % | 10 % | 15 % | 20 % | 38 % | 30 % | 100 % |
| 791910401 | Clou Bouchet Nord | utilisable | `oui` | 490 | 52 % | 11 % | 19 % | 16 % | 37 % | 33 % | 80 % |
| 791910103 | Hôpital | utilisable | `oui` | 802 | 54 % | 9 % | 10 % | 26 % | 28 % | 51 % | 96 % |
| 791910102 | Gare | utilisable | `oui` | 1193 | 54 % | 6 % | 14 % | 23 % | 33 % | 43 % | 77 % |
| 791910404 | Clou Bouchet Sud | utilisable | `oui` | 528 | 54 % | 6 % | 21 % | 12 % | 43 % | 14 % | 87 % |
| 791910301 | Sud Ribray | utilisable | `oui` | 1604 | 63 % | 8 % | 8 % | 17 % | 14 % | 67 % | 67 % |
| 791910201 | Nord Partie Inférieure | utilisable | `oui` | 1098 | 64 % | 9 % | 7 % | 18 % | 25 % | 59 % | 46 % |
| 791910303 | Boucle Sèvre | utilisable | `oui` | 1578 | 65 % | 10 % | 8 % | 12 % | 22 % | 69 % | 75 % |
| 791910202 | Nord Partie Supérieure | utilisable | `oui` | 1203 | 68 % | 8 % | 13 % | 8 % | 26 % | 56 % | 50 % |
| 791910403 | Four Chabot Gavacherie | utilisable | `oui` | 590 | 69 % | 5 % | 17 % | 8 % | 38 % | 43 % | 37 % |
| 791910402 | Venise Verte | utilisable | `oui` | 829 | 72 % | 7 % | 9 % | 6 % | 13 % | 72 % | 41 % |
| 791910604 | Champclairot | utilisable | `oui` | 1335 | 73 % | 9 % | 8 % | 6 % | 12 % | 73 % | 47 % |
| 791910302 | Saint-Florent | utilisable | `oui` | 1153 | 73 % | 9 % | 5 % | 8 % | 10 % | 85 % | 30 % |
| 791910701 | Champommier | utilisable | `oui` | 2191 | 77 % | 6 % | 6 % | 6 % | 9 % | 78 % | 33 % |
| 791910602 | Justices-Brizeaux | utilisable | `oui` | 985 | 78 % | 5 % | 7 % | 6 % | 8 % | 76 % | 5 % |
| 791910702 | Goise | utilisable | `oui` | 900 | 79 % | 7 % | 5 % | 5 % | 17 % | 81 % | 4 % |
| 791910603 | Moulin à Vent-Souche | utilisable | `oui` | 838 | 80 % | 5 % | 9 % | 1 % | 6 % | 85 % | 0 % |
| 791910203 | Baticoop | utilisable | `oui` | 1103 | 80 % | 7 % | 4 % | 6 % | 16 % | 76 % | 31 % |
| 791910503 | Sainte-Pezenne | utilisable | `oui` | 1142 | 81 % | 5 % | 6 % | 3 % | 7 % | 76 % | 9 % |
| 791910502 | Coteau Saint-Hubert | utilisable | `oui` | 1355 | 82 % | 5 % | 4 % | 5 % | 7 % | 86 % | 10 % |
| 791910501 | Saint-Liguaire-Nantes | utilisable | `oui` | 1136 | 86 % | 6 % | 5 % | 0 % | 3 % | 86 % | 0 % |
| 791910601 | Surimeau-Antes Cholette | utilisable | `oui` | 1215 | 87 % | 4 % | 5 % | 1 % | 7 % | 86 % | 0 % |
| 791910505 | Zone d'Activités Technopole | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 791910605 | Zone d'Activités de Souche | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 791910703 | Zone d'Activités de Saint-Florent | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 791910504 | Zone d'Activités de Saint-Liguaire | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Niort)

Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Niort (79191) | 75 % | 65 % | 9 % | 9 % | 13 % | 6148 | utilisable | `oui` |
| Chauray (79081) | 7 % | 85 % | 2 % | 10 % | 0 % | 538 | utilisable | `oui` |
| La Crèche (79048) | 2 % | 94 % | 2 % | 4 % | 1 % | 151 | utilisable | `oui` |
| Bessines (79034) | 1 % | 89 % | 3 % | 7 % | 0 % | 85 | fragile | `ordre de grandeur` |
| Échiré (79109) | 1 % | 95 % | 0 % | 4 % | 1 % | 79 | fragile | `ordre de grandeur` |
| Prahecq (79216) | 1 % | 90 % | 4 % | 4 % | 0 % | 52 | fragile | `ordre de grandeur` |
| Saint-Maixent-l'École (79270) | 1 % | 95 % | 0 % | 5 % | 0 % | 66 | fragile | `ordre de grandeur` |
| La Rochelle (17300) | 1 % | 75 % | 0 % | 21 % | 2 % | 51 | fragile | `ordre de grandeur` |
| Aiffres (79003) | 1 % | 67 % | 6 % | 14 % | 4 % | 51 | fragile | `ordre de grandeur` |
| Melle (79174) | 1 % | 97 % | 0 % | 3 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Poitiers (86194) | 1 % | 49 % | 3 % | 39 % | 1 % | 44 | fragile | `ordre de grandeur` |

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Niort. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Niort | Lignes (vers Niort) | Statut (vers Niort) | Usage (vers Niort) |
|---|---:|---:|---:|---:|---:|---|---|
| Chauray (79081) | 92 % | 3 % | 2 % | 95 % | 329 | utilisable | `oui` |
| Aiffres (79003) | 91 % | 1 % | 4 % | 93 % | 221 | utilisable | `oui` |
| Bessines (79034) | 90 % | 3 % | 2 % | 92 % | 88 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Niort (79191) | 75 % | 58 % | 66 % | 45 % | 63 % |
| Chauray (79081) | 48 % | 20 % | 38 % | 14 % | 0 % |
| Aiffres (79003) | 39 % | 44 % | 24 % | 3 % | 0 % |
| Bessines (79034) | 49 % | 0 % | 25 % | 0 % | 0 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

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
- Information documentaire non retenue : fréquences, amplitudes, premiers et derniers départs : lisibles dans les fiches, mais en tirer une fréquence serait un calcul non contrôlé ; relève des faits bus calculés, en attente de validation.
- Information documentaire non retenue : jours de circulation des navettes Centre-Ville et Colline Saint-André, des Tanlib Express et des lignes périurbaines : non vérifiés (fiches non consultées).
- Information documentaire non retenue : gratuité de la ligne 140E vers La Rochelle : évoquée dans une délibération de Niort Agglo d'avril 2025 ; arrêts concernés et état actuel non confirmés sur le site du réseau ; recherche disproportionnée.
- Information documentaire non retenue : vélo (libre-service, location de vélos à assistance électrique, itinéraire vélo) : existence seule, sans information qui réponde à la question du logement.
- Information documentaire non retenue : gare : rien d'utile au-delà de la navette du dimanche soir.

## 9. Visuels disponibles ou réalisables

| Visuel | État | Faits | Étape manuelle |
|---|---|---|---|
| Carte de la part de la voiture par secteur (IRIS) | réalisable | secteurs (tableau), iris.voiture.min/max | poser les libellés des secteurs cités (--libelles CODE,… place au centre ; positions fines à la main) ; légende HTML et texte alternatif à relire |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable, non automatisé | mobpro.voiture_selon_destination.* ou tableau des destinations (lignes utilisables seulement) | paramétrer groupes, intitulés et valeurs ; la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Niort et Chauray (79081), Aiffres (79003) et Bessines (79034) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
| Tableau du scénario de surcoût de carburant | disponible (données ci-dessus) | scenario.carburant.* | aucun |

## 10. Vérifications humaines en attente (avant publication)

Ne reprendre dans le rendu que celles qui concernent un fait utilisé.

- `mobpro.voiture_selon_destination` : Le choix des voisines change le chiffre « communes voisines » : le relire. Concerne : mobpro.voiture_selon_destination.*, ecart.voiture_destination.*. Non bloquante : la liste est nommée et exacte ; relire l'intérêt du choix.
- `iris.ecart_voiture` : Relire les libellés d'IRIS avant de les citer comme noms de quartiers. Concerne : noms de secteurs (section 3), iris.voiture.min/max. Non bloquante : relire avant d'écrire un libellé comme nom de quartier.
- `acces.adresses` : Vérifier que le jour de référence est un jour ordinaire hors vacances scolaires, relire les lignes retenues (seuil de 10 courses/jour) et celles signalées à relire. Concerne : colonnes et faits bus (acces.*.bus_*, acces.*.aucun_bus_*). Bloquante : ces faits sont en attente de validation et ne s'écrivent pas ; les équipements ne sont pas concernés.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Concerne : carburant.*, scenario.carburant.*. Non bloquante pour la rédaction, obligatoire avant publication.

## 11. Paramètres éditoriaux

### Lecteur et question

**Lecteur visé.** Une personne ou un ménage qui cherche un logement (achat ou location) dans la commune ou autour, et qui se demande quelle place la voiture prendra dans sa vie quotidienne. Elle ne connaît pas les sources statistiques. Elle veut savoir quoi regarder pendant ses recherches et ses visites.

**Question à éclairer.** Depuis quel quartier, et pour quels trajets, peut-on vivre dans cette commune en utilisant moins la voiture ? C'est le cadre commun. Chaque article en tire **une question principale**, celle que les données de la commune éclairent le mieux, et ne retient que les faits qui y répondent.

### Conditions obligatoires

Un fait ne peut entrer dans l'article que si les quatre conditions sont réunies. Elles ne se négocient pas.

1. **Donnée exploitable** : le fait figure dans le dossier, avec une valeur.
2. **Population, source et périmètre identifiés** : on sait de qui l'on parle (actifs, ménages, adresses), d'où vient le chiffre et sur quel territoire exact.
3. **Statut et usage qui l'autorisent** : la colonne « Usage » du dossier dit `oui`, ou `ordre de grandeur` (alors seulement comme ordre de grandeur, avec sa précision). Un fait `en attente de validation` ou `absent` ne s'écrit pas, ni arrondi, ni sous une formule vague qui en tiendrait lieu.
4. **Aucune promesse produit non validée** : la conclusion ne s'appuie que sur les capacités autorisées (dernière section).

### Choisir la question et le format

| Format | Quand | Longueur indicative |
|---|---|---|
| Article complet | Une découverte forte, ou plusieurs, qui apprennent au lecteur quelque chose de propre à la commune | De l'ordre de 700 à 1 000 mots hors méthode |
| Article court | Une piste utile mais limitée, ou une matière surtout communale | De l'ordre de 300 à 500 mots hors méthode |
| Ne pas publier | Les faits sont exacts mais n'apprennent rien au lecteur qui ne soit vrai presque partout, ou les faits utiles sont bloqués | Une note de quelques lignes qui explique pourquoi |

Les longueurs sont des indications, pas des objectifs : on ne remplit pas pour les atteindre. Une seule découverte forte peut suffire à un article complet. La méthode, en fin d'article, n'est pas comptée ; elle reste brève.

La question se choisit d'après les faits du dossier, jamais d'après un autre article. Une question proche de celle d'une autre commune est acceptable si les résultats le justifient ; recopier mécaniquement un récit ou un plan ne l'est pas.

Pour la question retenue, expliquer brièvement (section A du rendu) :

- ce que le résultat apprend au lecteur ;
- son lien avec une recherche de logement ;
- les faits (identifiants) qui soutiennent cet intérêt.

### Indices éditoriaux

Les pistes ci-dessous ont été repérées sur un seul cas, l'article pilote de La Rochelle. Les chiffres qui les accompagnent sont des **indices** : ils signalent qu'une piste mérite d'être regardée. Ils ne décident **ni** de la question **ni** de la publication, et la liste n'est pas un plan : les pistes ne deviennent pas chacune une section. On peut retenir une autre piste étayée par le dossier ; on peut écarter une piste qui franchit l'indice mais n'apporte rien d'utile au lecteur.

1. **Écart entre quartiers.** Indice : une quinzaine de points ou plus entre la part de la voiture du secteur le plus bas et celle du plus haut, parmi les secteurs d'habitat utilisables. Les petits écarts entre deux secteurs ne doivent pas être surinterprétés.
2. **Le lieu de travail.** Indice : une dizaine de points ou plus entre deux groupes de destination utilisables.
3. **Posséder sans utiliser.** Indice : une part notable (de l'ordre d'un actif motorisé sur cinq ou plus) d'actifs dont le ménage a une voiture et qui ne la prennent pas pour aller travailler. Sans comparaison avec d'autres communes dans le dossier, ne pas dire si c'est beaucoup ou peu.
4. **Un quartier équipé où la voiture domine.** Indice : un secteur utilisable où presque toutes les adresses (de l'ordre de 90 % ou plus) ont le panier quotidien à moins de 500 m à vol d'oiseau, et dont la part de la voiture est parmi les plus élevées de la commune. Décrire la proximité, jamais l'usage des équipements.
5. **Le stationnement au centre.** Indice : des secteurs utilisables où moins de la moitié des ménages a une place réservée, nettement sous la part communale (une vingtaine de points ou plus).
6. **Ceux qui viennent travailler dans la commune.** Indice : faits `qui_vient_travailler` utilisables. Décrire, sans déduire de kilomètres ni de coût.
7. **Le coût du carburant selon la distance.** Indice : faits carburant utilisables. Le scénario pré-calculé suffit ; il ne s'attribue à aucun quartier ni à aucune commune. Les prix sont réextraits avant publication.

**Entrée de l'article.** Deux possibilités, aucune obligatoire : un fait d'actualité (la hausse du carburant, si elle amène la question) ou une question durable de recherche résidentielle. Choisir celle qui sert le mieux la question retenue.

**Ce qu'on n'écrit pas faute de donnée.** Toute comparaison avec d'autres communes françaises (rang, « ville de vélo », « plus que la moyenne ») sauf si un fait du dossier la donne (piste pour plus tard : une comparaison nationale ou avec des communes comparables viendra du moteur déterministe, avec population, millésime et règle de comparaison explicites ; elle n'existe pas encore) ; tout temps de trajet ou kilométrage ; tout lien de cause entre un quartier et une pratique.

### Groupes de communes

Un groupe de communes se présente **avec sa liste exacte** la première fois qu'il apparaît (titre, chapeau ou corps, selon où il apparaît en premier). Ensuite, « ces trois communes » (ou l'équivalent) suffit, sans répéter la liste à chaque phrase, tant que le lecteur ne peut pas confondre avec un autre groupe. Jamais « les communes voisines », « la périphérie » ou « l'agglomération » pour un groupe dont la composition n'a pas été donnée. Si le dossier dit qu'une composition n'est pas connue (unité urbaine), ne pas en donner le nombre de communes.

### Visuels

Proposer au plus trois visuels, choisis dans la section « Visuels disponibles ou réalisables » du dossier, chacun posé à côté du passage qu'il éclaire. Le visuel porte le détail que le texte n'énumère pas. Le texte n'annonce que les visuels retenus. Un visuel qui repose sur un fait non utilisable ne se propose pas. Une carte de situation n'accompagne que la comparaison de communes qu'elle situe, avec la même liste exacte.

### Capacités produit

Deux niveaux distincts : **repérée dans le code** (la fonction existe, lue le 12/10/2026, révision `a25fa9fd`, aucun parcours joué dans le navigateur) et **autorisée pour une promesse publiée** (le porteur l'a retenue pour un article). Seule la seconde peut figurer dans la conclusion. Une date de vérification récente ne remplace pas cette validation.

| Capacité | Repérée dans le code | Autorisée dans la conclusion | Ce que l'on peut en dire |
|---|---|---|---|
| Équipements autour d'une adresse | oui | **oui** | Les équipements les plus proches de l'adresse (distances à vol d'oiseau) et leur nombre à moins de 500 m |
| Équipement automobile du secteur | oui | **oui** | La part des ménages équipés d'une voiture dans le secteur de l'adresse, comparée à la commune |
| Examen d'une adresse à partir du projet de la personne | oui | **oui** (porteur, 14/10/2026) | Inviter à explorer l'adresse envisagée à partir de son projet (se rapprocher du travail, préparer une retraite, s'installer en famille…) ; nommer au besoin ce qui peut peser dans le choix (mobilité, chaleur de l'été, risques à l'adresse, services), sans détailler de fonctionnalité ni promettre un résultat |
| Temps de trajet estimé vers un lieu déclaré (voiture ou marche) | oui | **non** : validation en attente | Rien : ne pas l'évoquer, même au conditionnel |
| Position de la commune pour la part de la voiture domicile-travail | oui | **non** : pas validée pour une promesse | Rien |
| Comparateur de communes | oui | **non** : pas validé pour une promesse | Rien |

Interdits en toute circonstance : promettre un budget ou un coût de déplacement calculé, des horaires ou fréquences de bus à l'adresse, des temps de trajet (quel que soit le mode), ou les parts de la voiture par secteur de l'article (analyse de la rédaction, absente du dossier d'adresse).

La conclusion vers futur•e est courte (deux ou trois phrases). Elle part du projet du lecteur, pas des données déjà présentées ni de l'offre, et donne envie d'examiner l'adresse envisagée ; elle reste dans les seules capacités autorisées, avec ses propres mots, sans catalogue ni phrase commerciale recopiée. Ni le plan ni les formulations d'un article précédent ne sont un modèle.

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
- La conclusion vers futur•e est courte et ne promet que les capacités produit autorisées pour une promesse publiée (une capacité repérée dans le code ne suffit pas).
- Chaque chiffre doit apporter quelque chose au lecteur : on n'ajoute pas un fait parce qu'il est disponible.


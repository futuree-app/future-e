# Dossier d'entrée de rédaction · Lille (59350)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-05-campagne/59350/fiche/fiche.json` (générée le 2026-10-15T16:14:08Z, jour de référence 2026-10-13, sha256 `432b5a5ad122880f`). Dossier généré le 2026-10-15T16:14:57Z par `outil/dossier_redaction.py`.

Ce dossier est **la seule matière** de la rédaction. Chaque fait a un identifiant stable (colonne `id`) : c'est lui que cite la correspondance interne du brouillon. Un fait qui n'est pas ici n'existe pas pour l'article.

**Statut et usage.** La colonne « Usage » dit ce que l'on peut écrire :

| Statut | Ce que cela veut dire | Usage |
|---|---|---|
| `utilisable` | donnée exploitable, population, source et périmètre identifiés | `oui` : à écrire tel quel (valeur arrondie de la colonne « Valeur ») |
| `fragile` | faible précision statistique (petit échantillon) | `ordre de grandeur` : jamais en chiffre de titre ni comme seul appui de la réponse, avec la précision du motif |
| `en attente de validation` | dépend d'une vérification humaine non faite (réseau de bus, jour de référence) | `non` : ne pas écrire, même arrondi ou en termes vagues ; la valeur n'est pas donnée |
| `absent` | pas de donnée, ou secteur exclu | `non` |

**Valeurs aux bornes.** « 0 % » et « 100 % » sont des valeurs exactes : elles s'écrivent « aucun » ou « tous ». Une valeur proche d'une borne est donnée au dixième (« 99,8 % », « 0,4 % ») : elle s'écrit « la quasi-totalité » ou « presque aucun », jamais « tous » ou « aucun », ni « 100 % » ou « 0 % ».

Les **informations documentaires** (section 2 bis, identifiants `doc.*`) ne sont pas des résultats calculés : elles ont leur propre colonne Usage (`oui`, `avec ses conditions`, `non`).

**Populations.** Trois populations distinctes, à ne pas mélanger : les **actifs** occupés (pratiques domicile-travail, fichier MOBPRO et base IRIS Activité), les **ménages** (voiture, stationnement, base IRIS Logement), les **adresses** (proximité des équipements, Base adresse nationale). Une part d'adresses n'est pas une part de ménages ni d'habitants.

## 1. Périmètres exacts

- **Commune étudiée** : Lille (59350), département 59, intercommunalité Métropole Européenne de Lille.
- **Groupe de communes nommé** : Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 59702 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 9 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 40 % [IC 95 % : 39 % à 40 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 36 % [IC 95 % : 36 % à 37 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille, y compris ceux qui ne se déplacent pas | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Lille même | 55 % [IC 95 % : 54 % à 56 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille | commune de résidence et de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Lille | 26 % [IC 95 % : 25 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Lille qui travaillent à Lille | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | 47 % [IC 95 % : 45 % à 49 %] | actifs occupés de 15 ans ou plus résidant à Lille qui travaillent dans l'une de ces communes : Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | commune de travail : Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Lille et hors de Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés de 15 ans ou plus résidant à Lille qui travaillent hors de Lille et hors de Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | commune de travail : toute commune autre que Lille, Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) moins travail à Lille | +21 points | deux groupes distincts (voir les deux faits) | commune de travail : Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 28 % [IC 95 % : 27 % à 28 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 20 % [IC 95 % : 20 % à 21 %] | tous les actifs occupés de 15 ans ou plus résidant à Lille | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 49 % [IC 95 % : 48 % à 49 %] | actifs occupés de 15 ans ou plus résidant à Lille dont le ménage a au moins une voiture | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 46 % [IC 95 % : 45 % à 48 %] | actifs occupés de 15 ans ou plus résidant à Lille, propriétaires de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 12 % [IC 95 % : 11 % à 12 %] | actifs occupés de 15 ans ou plus résidant à Lille, propriétaires de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 11 % [IC 95 % : 10 % à 12 %] | actifs occupés de 15 ans ou plus résidant à Lille, propriétaires de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 32 % [IC 95 % : 31 % à 33 %] | actifs occupés de 15 ans ou plus résidant à Lille, propriétaires de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 34 % [IC 95 % : 33 % à 35 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires du privé de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 9 % [IC 95 % : 8 % à 9 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires du privé de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 39 % [IC 95 % : 38 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires du privé de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 13 % [IC 95 % : 12 % à 14 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires du privé de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 42 % [IC 95 % : 40 % à 43 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires HLM de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 4 % [IC 95 % : 3 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires HLM de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 33 % [IC 95 % : 32 % à 35 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires HLM de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 16 % [IC 95 % : 15 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Lille, locataires HLM de leur logement | commune de résidence : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Lille | environ 183 600 | — | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Lille, de ceux qui habitent Lille | 31 % | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lille et habitent Lille | 26 % [IC 95 % : 25 % à 27 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent Lille | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lille et habitent Lille | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent Lille | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Lille, de ceux qui habitent une autre commune de l'unité urbaine INSEE 59702 (liste des communes non exposée par la fiche) | 36 % | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lille et habitent une autre commune de l'unité urbaine INSEE 59702 (liste des communes non exposée par la fiche) | 60 % [IC 95 % : 59 % à 61 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 59702 (liste des communes non exposée par la fiche) | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lille et habitent une autre commune de l'unité urbaine INSEE 59702 (liste des communes non exposée par la fiche) | 30 % [IC 95 % : 29 % à 31 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 59702 (liste des communes non exposée par la fiche) | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Lille, de ceux qui habitent hors de l'unité urbaine INSEE 59702 | 33 % | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lille et habitent hors de l'unité urbaine INSEE 59702 | 66 % [IC 95 % : 65 % à 67 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 59702 | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lille et habitent hors de l'unité urbaine INSEE 59702 | 32 % [IC 95 % : 31 % à 33 %] | actifs occupés qui travaillent à Lille, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 59702 | commune de travail : Lille (59350) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Lille Centre 5 (IRIS 593500105) | 21 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Lille (59350), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Bourg Délivrance 2 (IRIS 593502702) | 65 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Lille (59350), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +44 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Lille (59350), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 45 % | toutes les résidences principales de Lille | commune : Lille (59350) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 11 % | toutes les résidences principales de Lille | commune : Lille (59350) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 38 % | toutes les résidences principales de Lille | commune : Lille (59350) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.59350.commerce_alim_500m` | Part des adresses de Lille qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 99 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.grande_surface_500m` | Part des adresses de Lille qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 84 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.pharmacie_500m` | Part des adresses de Lille qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 94 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.medecin_generaliste_500m` | Part des adresses de Lille qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 96 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.ecole_elementaire_500m` | Part des adresses de Lille qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 95 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.college_1km` | Part des adresses de Lille qui ont un collège à moins de 1 km (à vol d'oiseau) | 96 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.gare_2km` | Part des adresses de Lille qui ont une gare à moins de 2 km (à vol d'oiseau) | 86 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.panier_quotidien_500m` | Part des adresses de Lille qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 90 % | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.59350.bus_8h_7_9h` | Part des adresses de Lille qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.59350.aucun_bus_7_9h` | Part des adresses de Lille sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.59350.bus_4h_20_22h` | Part des adresses de Lille qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lille, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lille (59350) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Navettes Aéroport de Lille » (https://transport.data.gouv.fr/datasets/flibco-lille-airport-gtfs), 2 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,31 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,57 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,73 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,10 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,66 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,45 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lille (centre communal de geo.api.gouv.fr : [3.0468, 50.6311]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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
- `carburant.evolution.*` : Le contrôle sur les mêmes stations (scripts/13) n'est pas fait par l'outil. La hausse est calculée sur les prix non arrondis : elle peut différer d'un centime de la différence des deux prix arrondis. Ne pas écrire la hausse et les deux prix comme une soustraction que le lecteur refera ; choisir l'un ou l'autre. Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas. Une hausse passée ne dit rien de l'avenir.

## 2 bis. Informations documentaires (non calculées)

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-05-campagne/59350/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| réseau de transport urbain | `non vérifié` | transport.data.gouv.fr 2026-10-15 | 2 jeu(x) urbain(s) couvrant l'intercommunalité 200093201 : identification à faire à la main |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 593500105 | Lille Centre 5 | utilisable | `oui` | 853 | 21 % | 5 % | 48 % | 24 % | 67 % | 16 % | 100 % |
| 593501001 | Centre | utilisable | `oui` | 923 | 22 % | 8 % | 54 % | 10 % | 55 % | 18 % | 100 % |
| 593500111 | Lille Centre 11 | utilisable | `oui` | 1161 | 23 % | 3 % | 39 % | 29 % | 64 % | 22 % | 79 % |
| 593500403 | Magenta-Fombello | utilisable | `oui` | 759 | 24 % | 5 % | 57 % | 10 % | 62 % | 24 % | 100 % |
| 593500404 | Flandre | utilisable | `oui` | 1460 | 25 % | 7 % | 45 % | 17 % | 66 % | 21 % | 100 % |
| 593500409 | Mairie | utilisable | `oui` | 1215 | 26 % | 16 % | 41 % | 14 % | 65 % | 15 % | 100 % |
| 593500408 | Justice | utilisable | `oui` | 1340 | 26 % | 13 % | 46 % | 12 % | 60 % | 26 % | 100 % |
| 593500203 | Vieux Lille 3 | utilisable | `oui` | 1307 | 26 % | 6 % | 36 % | 26 % | 56 % | 29 % | 100 % |
| 593500401 | Montebello | utilisable | `oui` | 719 | 27 % | 10 % | 49 % | 10 % | 66 % | 13 % | 100 % |
| 593500908 | Saint-Maurice-Saint-Gabriel | utilisable | `oui` | 740 | 27 % | 8 % | 52 % | 7 % | 51 % | 19 % | 100 % |
| 593500115 | Lille Centre 15 | utilisable | `oui` | 1007 | 28 % | 9 % | 41 % | 14 % | 52 % | 37 % | 100 % |
| 593500410 | Barthélemy | utilisable | `oui` | 1142 | 28 % | 16 % | 39 % | 12 % | 52 % | 30 % | 100 % |
| 593500112 | Lille Centre 12 | utilisable | `oui` | 1304 | 29 % | 6 % | 39 % | 20 % | 50 % | 38 % | 100 % |
| 593500118 | Lille Centre 18 | utilisable | `oui` | 1953 | 29 % | 14 % | 39 % | 16 % | 56 % | 23 % | 100 % |
| 593500117 | Lille Centre 17 | utilisable | `oui` | 765 | 29 % | 5 % | 41 % | 21 % | 50 % | 50 % | 100 % |
| 593500119 | Lille Centre 19 | utilisable | `oui` | 2175 | 30 % | 9 % | 38 % | 18 % | 57 % | 37 % | 100 % |
| 593500702 | Faubourg des Postes A | utilisable | `oui` | 528 | 30 % | 12 % | 41 % | 12 % | 45 % | 26 % | 100 % |
| 593501005 | Lannoy | utilisable | `oui` | 1017 | 31 % | 10 % | 51 % | 6 % | 47 % | 28 % | 100 % |
| 593500506 | Arras | utilisable | `oui` | 2282 | 31 % | 12 % | 42 % | 11 % | 48 % | 40 % | 100 % |
| 593500406 | Franklin | utilisable | `oui` | 1705 | 32 % | 10 % | 38 % | 19 % | 54 % | 43 % | 100 % |
| 593500202 | Vieux Lille 2 | utilisable | `oui` | 864 | 32 % | 10 % | 24 % | 27 % | 46 % | 44 % | 99 % |
| 593500402 | Sarrazins | utilisable | `oui` | 839 | 32 % | 9 % | 46 % | 10 % | 54 % | 36 % | 100 % |
| 593500204 | Vieux Lille 4 | utilisable | `oui` | 1871 | 32 % | 9 % | 29 % | 24 % | 51 % | 38 % | 96 % |
| 593501002 | Entrée Lille Fives | utilisable | `oui` | 1075 | 32 % | 6 % | 49 % | 7 % | 47 % | 22 % | 100 % |
| 593500508 | Trévise | utilisable | `oui` | 1218 | 33 % | 10 % | 42 % | 10 % | 51 % | 35 % | 100 % |
| 593501004 | Marbrerie | utilisable | `oui` | 1018 | 33 % | 9 % | 48 % | 4 % | 41 % | 23 % | 100 % |
| 593500504 | Fac de Droit | utilisable | `oui` | 1368 | 33 % | 7 % | 45 % | 8 % | 54 % | 27 % | 98 % |
| 593500305 | Colson | utilisable | `oui` | 916 | 33 % | 6 % | 35 % | 23 % | 56 % | 46 % | 100 % |
| 593500116 | Lille Centre 16 | utilisable | `oui` | 1666 | 33 % | 9 % | 33 % | 20 % | 46 % | 47 % | 100 % |
| 593500309 | Lestiboudois | utilisable | `oui` | 592 | 34 % | 11 % | 33 % | 17 % | 54 % | 33 % | 93 % |
| 593500407 | Stations | utilisable | `oui` | 1632 | 34 % | 14 % | 36 % | 12 % | 53 % | 42 % | 100 % |
| 593500507 | Belfort | utilisable | `oui` | 800 | 34 % | 3 % | 48 % | 10 % | 55 % | 32 % | 93 % |
| 593501003 | Caulier | utilisable | `oui` | 1365 | 35 % | 6 % | 43 % | 10 % | 48 % | 33 % | 100 % |
| 593500503 | Arsenal | utilisable | `oui` | 910 | 35 % | 10 % | 45 % | 8 % | 60 % | 14 % | 95 % |
| 593500502 | Seclin | utilisable | `oui` | 959 | 35 % | 11 % | 43 % | 10 % | 50 % | 21 % | 100 % |
| 593500703 | Faubourg des Postes B | utilisable | `oui` | 838 | 36 % | 5 % | 41 % | 15 % | 38 % | 33 % | 98 % |
| 593500206 | Vieux Lille 6 | utilisable | `oui` | 1038 | 36 % | 10 % | 25 % | 24 % | 49 % | 30 % | 100 % |
| 593500906 | Saint-Maurice des Champs | utilisable | `oui` | 1416 | 36 % | 7 % | 37 % | 16 % | 35 % | 56 % | 96 % |
| 593500304 | Cordonnier | utilisable | `oui` | 562 | 37 % | 13 % | 28 % | 18 % | 53 % | 43 % | 100 % |
| 593500405 | Brigode | utilisable | `oui` | 1073 | 37 % | 15 % | 35 % | 11 % | 44 % | 52 % | 100 % |
| 593500604 | Concorde 2 | utilisable | `oui` | 325 | 37 % | 1 % | 55 % | 6 % | 73 % | 2 % | 100 % |
| 593501007 | Mont de Terre | utilisable | `oui` | 1593 | 38 % | 12 % | 39 % | 4 % | 38 % | 31 % | 67 % |
| 593500803 | Vieux Bois-Blancs | utilisable | `oui` | 1392 | 38 % | 12 % | 36 % | 9 % | 38 % | 38 % | 99,6 % |
| 593501006 | Convention | utilisable | `oui` | 1036 | 38 % | 10 % | 45 % | 6 % | 40 % | 34 % | 100 % |
| 593500603 | Verhaeren | utilisable | `oui` | 505 | 39 % | 2 % | 48 % | 8 % | 56 % | 15 % | 100 % |
| 593500306 | Arbonnoise | utilisable | `oui` | 1160 | 40 % | 12 % | 40 % | 7 % | 48 % | 36 % | 100 % |
| 593500104 | Lille Centre 4 | utilisable | `oui` | 1390 | 41 % | 12 % | 24 % | 20 % | 48 % | 40 % | 92 % |
| 593500205 | Vieux Lille 5 | utilisable | `oui` | 1797 | 41 % | 14 % | 23 % | 18 % | 39 % | 45 % | 99 % |
| 593502503 | Centre 3 | utilisable | `oui` | 1072 | 41 % | 7 % | 44 % | 5 % | 39 % | 49 % | 100 % |
| 593500905 | Saint-Maurice-Cimetière de l'Est | utilisable | `oui` | 1314 | 41 % | 9 % | 35 % | 11 % | 28 % | 73 % | 98 % |
| 593500303 | Catinat | utilisable | `oui` | 1025 | 41 % | 9 % | 34 % | 13 % | 54 % | 39 % | 100 % |
| 593500902 | Notre-Dame de Pellevoisin | utilisable | `oui` | 1053 | 41 % | 14 % | 33 % | 7 % | 23 % | 60 % | 100 % |
| 593500907 | Saint-Maurice-Briqueterie | utilisable | `oui` | 1379 | 42 % | 6 % | 39 % | 8 % | 37 % | 57 % | 85 % |
| 593500602 | Concorde 1 | utilisable | `oui` | 322 | 42 % | 0 % | 43 % | 12 % | 44 % | 5 % | 100 % |
| 593500706 | Giraudoux | utilisable | `oui` | 552 | 42 % | 2 % | 42 % | 11 % | 46 % | 29 % | 81 % |
| 593500308 | Grande Brasserie | utilisable | `oui` | 1172 | 42 % | 8 % | 34 % | 10 % | 46 % | 44 % | 81 % |
| 593500705 | Croisette B | utilisable | `oui` | 603 | 43 % | 2 % | 49 % | 6 % | 46 % | 35 % | 45 % |
| 593500801 | Marx Dormoy | utilisable | `oui` | 799 | 43 % | 9 % | 39 % | 8 % | 28 % | 58 % | 58 % |
| 593500903 | Pellevoisin-Rouges Barres | utilisable | `oui` | 914 | 44 % | 13 % | 33 % | 8 % | 24 % | 38 % | 55 % |
| 593500802 | Canteleu | utilisable | `oui` | 2092 | 44 % | 8 % | 36 % | 8 % | 28 % | 55 % | 96 % |
| 593500307 | Lille-Acier | utilisable | `oui` | 1204 | 44 % | 12 % | 33 % | 7 % | 31 % | 65 % | 78 % |
| 593502404 | Épine Mont de Terre 4 | utilisable | `oui` | 934 | 44 % | 9 % | 40 % | 4 % | 34 % | 37 % | 100 % |
| 593500711 | Balzac-Lazarre Garreau | utilisable | `oui` | 1057 | 44 % | 6 % | 44 % | 3 % | 44 % | 42 % | 92 % |
| 593501008 | Petit Maroc | utilisable | `oui` | 1058 | 45 % | 10 % | 33 % | 7 % | 30 % | 41 % | 43 % |
| 593502901 | Mont à Camp-Marais 1 | utilisable | `oui` | 1001 | 45 % | 6 % | 39 % | 7 % | 34 % | 38 % | 92 % |
| 593502602 | Les Sarts 2 | utilisable | `oui` | 758 | 45 % | 11 % | 36 % | 6 % | 24 % | 34 % | 100 % |
| 593500901 | Buisson | utilisable | `oui` | 1339 | 46 % | 11 % | 33 % | 6 % | 24 % | 67 % | 80 % |
| 593500804 | Aviateurs | utilisable | `oui` | 553 | 46 % | 12 % | 34 % | 3 % | 44 % | 15 % | 75 % |
| 593500207 | Vieux Lille 7 | utilisable | `oui` | 1063 | 46 % | 11 % | 25 % | 16 % | 40 % | 52 % | 99 % |
| 593502801 | Mitterie 1 | utilisable | `oui` | 1460 | 46 % | 5 % | 41 % | 6 % | 26 % | 49 % | 84 % |
| 593502502 | Centre 2 | utilisable | `oui` | 729 | 47 % | 7 % | 39 % | 4 % | 38 % | 24 % | 71 % |
| 593500710 | Faubourg de Douai | utilisable | `oui` | 2164 | 48 % | 16 % | 27 % | 5 % | 41 % | 46 % | 91 % |
| 593502902 | Mont à Camp-Marais 2 | utilisable | `oui` | 889 | 48 % | 3 % | 39 % | 6 % | 27 % | 51 % | 99,7 % |
| 593502403 | Épine Mont de Terre 3 | utilisable | `oui` | 1100 | 49 % | 11 % | 29 % | 7 % | 28 % | 28 % | 100 % |
| 593500601 | Baltique-Vieux Faubourg | utilisable | `oui` | 1205 | 49 % | 9 % | 29 % | 9 % | 33 % | 42 % | 33 % |
| 593500704 | Croisette A | utilisable | `oui` | 817 | 53 % | 2 % | 29 % | 12 % | 36 % | 39 % | 75 % |
| 593502904 | Mont à Camp-Marais 4 | utilisable | `oui` | 701 | 54 % | 8 % | 28 % | 10 % | 24 % | 26 % | 88 % |
| 593502705 | Bourg Délivrance 5 | utilisable | `oui` | 759 | 54 % | 5 % | 32 % | 6 % | 23 % | 54 % | 90 % |
| 593502603 | Les Sarts 3 | utilisable | `oui` | 771 | 54 % | 9 % | 26 % | 5 % | 19 % | 55 % | 98 % |
| 593503003 | Sud Marais 3 | utilisable | `oui` | 842 | 54 % | 4 % | 32 % | 6 % | 26 % | 29 % | 80 % |
| 593502601 | Les Sarts 1 | utilisable | `oui` | 605 | 56 % | 4 % | 26 % | 10 % | 38 % | 22 % | 99 % |
| 593502501 | Centre 1 | utilisable | `oui` | 634 | 56 % | 5 % | 31 % | 6 % | 25 % | 40 % | 50 % |
| 593503001 | Sud Marais 1 | utilisable | `oui` | 1792 | 57 % | 9 % | 24 % | 6 % | 18 % | 53 % | 55 % |
| 593500201 | Vieux Lille 1 | utilisable | `oui` | 2080 | 57 % | 9 % | 17 % | 12 % | 24 % | 81 % | 99 % |
| 593502903 | Mont à Camp-Marais 3 | utilisable | `oui` | 1035 | 58 % | 9 % | 26 % | 4 % | 16 % | 32 % | 96 % |
| 593502802 | Mitterie 2 | utilisable | `oui` | 800 | 59 % | 1 % | 34 % | 4 % | 32 % | 50 % | 47 % |
| 593503002 | Sud Marais 2 | utilisable | `oui` | 767 | 62 % | 8 % | 20 % | 3 % | 24 % | 29 % | 82 % |
| 593502704 | Bourg Délivrance 4 | utilisable | `oui` | 951 | 62 % | 3 % | 31 % | 2 % | 16 % | 72 % | 11 % |
| 593502402 | Épine Mont de Terre 2 | utilisable | `oui` | 476 | 63 % | 1 % | 27 % | 1 % | 29 % | 39 % | 1 % |
| 593500707 | 400 Maisons-Cimetière du Sud | utilisable | `oui` | 501 | 64 % | 7 % | 24 % | 3 % | 38 % | 26 % | 100 % |
| 593502703 | Bourg Délivrance 3 | utilisable | `oui` | 953 | 64 % | 3 % | 26 % | 5 % | 15 % | 68 % | 61 % |
| 593502702 | Bourg Délivrance 2 | utilisable | `oui` | 692 | 65 % | 3 % | 22 % | 5 % | 17 % | 71 % | 19 % |
| 593500501 | Strasbourg | fragile (0 actifs (< 300)) | `ordre de grandeur` | 0 | n.d. | n.d. | n.d. | n.d. | 100 % | 0 % | 64 % |
| 593500106 | Lille Centre 6 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500107 | Lille Centre 7 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500109 | Lille Centre 9 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500110 | Lille Centre 10 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500701 | C.H.R. | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500310 | Citadelle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500108 | Lille Centre 8 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500113 | Lille Centre 13 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500302 | Vauban-Esquermes | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593502405 | Épine Mont de Terre 5 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593502701 | Zone d'Activités-Marché d'Intérêt National | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593502401 | Épine Mont de Terre 1 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500709 | Lopofa-Tudor | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500101 | Lille Centre 1 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500114 | Lille Centre 14 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593500904 | La MEL | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 593502706 | Plate-Forme Multimodale | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Lille)

Actifs qui habitent l'ensemble de Lille, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Lille (59350) | 55 % | 26 % | 12 % | 36 % | 19 % | 17549 | utilisable | `oui` |
| Villeneuve-d'Ascq (59009) | 8 % | 43 % | 6 % | 49 % | 1 % | 2461 | utilisable | `oui` |
| Roubaix (59512) | 3 % | 47 % | 3 % | 49 % | 0,3 % | 1070 | utilisable | `oui` |
| Marcq-en-Barœul (59378) | 2 % | 51 % | 7 % | 39 % | 2 % | 732 | utilisable | `oui` |
| Tourcoing (59599) | 2 % | 56 % | 1 % | 41 % | 1 % | 622 | utilisable | `oui` |
| Lesquin (59343) | 1 % | 74 % | 4 % | 22 % | 0,1 % | 410 | utilisable | `oui` |
| Loos (59360) | 1 % | 38 % | 10 % | 48 % | 4 % | 371 | utilisable | `oui` |
| La Madeleine (59368) | 1 % | 42 % | 14 % | 31 % | 13 % | 370 | utilisable | `oui` |
| Wasquehal (59646) | 1 % | 56 % | 5 % | 38 % | 0,3 % | 384 | utilisable | `oui` |
| Lambersart (59328) | 1 % | 46 % | 14 % | 28 % | 10 % | 305 | utilisable | `oui` |
| 99999 (99999) | 1 % | 69 % | 1 % | 25 % | 5 % | 317 | utilisable | `oui` |
| Croix (59163) | 1 % | 40 % | 6 % | 52 % | 1 % | 274 | utilisable | `oui` |
| Lezennes (59346) | 1 % | 54 % | 6 % | 37 % | 2 % | 239 | utilisable | `oui` |
| Ronchin (59507) | 1 % | 53 % | 12 % | 31 % | 3 % | 265 | utilisable | `oui` |
| Seclin (59560) | 1 % | 71 % | 4 % | 21 % | 0,3 % | 256 | utilisable | `oui` |
| Valenciennes (59606) | 1 % | 55 % | 1 % | 44 % | 0 % | 188 | utilisable | `oui` |
| Armentières (59017) | 1 % | 69 % | 3 % | 28 % | 0 % | 170 | utilisable | `oui` |
| Douai (59178) | 1 % | 52 % | 1 % | 46 % | 0,3 % | 141 | fragile | `ordre de grandeur` |
| Mons-en-Barœul (59410) | 1 % | 40 % | 11 % | 35 % | 11 % | 134 | fragile | `ordre de grandeur` |
| Saint-André-lez-Lille (59527) | 1 % | 62 % | 11 % | 25 % | 1 % | 174 | utilisable | `oui` |
| Dunkerque (59183) | 0,4 % | 53 % | 0 % | 47 % | 0 % | 113 | fragile | `ordre de grandeur` |
| Faches-Thumesnil (59220) | 0,4 % | 53 % | 7 % | 36 % | 3 % | 117 | fragile | `ordre de grandeur` |
| Haubourdin (59286) | 0,4 % | 67 % | 9 % | 19 % | 1 % | 119 | fragile | `ordre de grandeur` |
| Hem (59299) | 0,4 % | 81 % | 1 % | 18 % | 0 % | 110 | fragile | `ordre de grandeur` |
| Templemars (59585) | 0,4 % | 74 % | 2 % | 21 % | 1 % | 115 | fragile | `ordre de grandeur` |
| Wambrechies (59636) | 0,4 % | 64 % | 6 % | 25 % | 3 % | 129 | fragile | `ordre de grandeur` |
| Arras (62041) | 0,4 % | 45 % | 0 % | 55 % | 0 % | 121 | fragile | `ordre de grandeur` |
| Lens (62498) | 0,4 % | 65 % | 1 % | 33 % | 0 % | 115 | fragile | `ordre de grandeur` |
| Bondues (59090) | 0,3 % | 84 % | 5 % | 11 % | 0 % | 78 | fragile | `ordre de grandeur` |
| Fretin (59256) | 0,3 % | 80 % | 3 % | 15 % | 0 % | 100 | fragile | `ordre de grandeur` |
| Marquette-lez-Lille (59386) | 0,3 % | 58 % | 10 % | 32 % | 0 % | 116 | fragile | `ordre de grandeur` |
| Roncq (59508) | 0,3 % | 88 % | 3 % | 7 % | 2 % | 98 | fragile | `ordre de grandeur` |
| Wattrelos (59650) | 0,3 % | 82 % | 1 % | 17 % | 0 % | 91 | fragile | `ordre de grandeur` |
| Bailleul (59043) | 0,2 % | 89 % | 7 % | 5 % | 0 % | 52 | fragile | `ordre de grandeur` |
| Comines (59152) | 0,2 % | 66 % | 1 % | 33 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Leers (59339) | 0,2 % | 79 % | 0 % | 21 % | 0 % | 48 | fragile | `ordre de grandeur` |
| Lys-lez-Lannoy (59367) | 0,2 % | 81 % | 0 % | 17 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Neuville-en-Ferrain (59426) | 0,2 % | 67 % | 4 % | 29 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Noyelles-lès-Seclin (59437) | 0,2 % | 52 % | 13 % | 31 % | 2 % | 71 | fragile | `ordre de grandeur` |
| Pérenchies (59457) | 0,2 % | 64 % | 2 % | 31 % | 0 % | 54 | fragile | `ordre de grandeur` |
| Sainghin-en-Mélantois (59523) | 0,2 % | 71 % | 3 % | 25 % | 0 % | 66 | fragile | `ordre de grandeur` |
| Sequedin (59566) | 0,2 % | 87 % | 8 % | 4 % | 0 % | 62 | fragile | `ordre de grandeur` |
| Wattignies (59648) | 0,2 % | 51 % | 6 % | 40 % | 3 % | 63 | fragile | `ordre de grandeur` |
| Béthune (62119) | 0,2 % | 69 % | 5 % | 26 % | 0 % | 68 | fragile | `ordre de grandeur` |
| Hénin-Beaumont (62427) | 0,2 % | 86 % | 0 % | 14 % | 0 % | 47 | fragile | `ordre de grandeur` |
| Paris 8e Arrondissement (75108) | 0,2 % | 12 % | 3 % | 82 % | 3 % | 52 | fragile | `ordre de grandeur` |
| Paris 9e Arrondissement (75109) | 0,2 % | 11 % | 0 % | 88 % | 1 % | 58 | fragile | `ordre de grandeur` |
| Avelin (59034) | 0,1 % | 81 % | 0 % | 15 % | 4 % | 46 | fragile | `ordre de grandeur` |
| Hallennes-lez-Haubourdin (59278) | 0,1 % | 70 % | 10 % | 21 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Hazebrouck (59295) | 0,1 % | 70 % | 0 % | 29 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Mouvaux (59421) | 0,1 % | 95 % | 0 % | 5 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Paris 15e Arrondissement (75115) | 0,1 % | 28 % | 0 % | 64 % | 5 % | 42 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Lille (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 51 373 à 205 494), avec au moins 150 lignes d'échantillon ; Lille exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Lille qui vont travailler principalement en voiture (valeur comparée) | 40 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 22 communes du groupe (chaque commune compte une fois) | 53 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Lille moins la médiane du groupe (valeurs arrondies) | -13 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 22 | `oui` |

Communes du groupe (22, pour la vérification ; ne pas les citer) : Aix-en-Provence, Angers, Annecy, Bordeaux, Boulogne-Billancourt, Brest, Clermont-Ferrand, Dijon, Grenoble, Le Havre, Le Mans, Montpellier, Nantes, Nice, Nîmes, Reims, Rennes, Saint-Étienne, Strasbourg, Toulon, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Lille. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Lille | Lignes (vers Lille) | Statut (vers Lille) | Usage (vers Lille) |
|---|---:|---:|---:|---:|---:|---|---|
| Tourcoing (59599) | 70 % | 2 % | 18 % | 60 % | 1400 | utilisable | `oui` |
| Roubaix (59512) | 62 % | 2 % | 24 % | 53 % | 1199 | utilisable | `oui` |
| Villeneuve-d'Ascq (59009) | 61 % | 5 % | 25 % | 48 % | 1293 | utilisable | `oui` |
| Wattrelos (59650) | 82 % | 2 % | 9 % | 74 % | 404 | utilisable | `oui` |
| Marcq-en-Barœul (59378) | 65 % | 7 % | 18 % | 57 % | 1369 | utilisable | `oui` |
| Lambersart (59328) | 59 % | 12 % | 19 % | 44 % | 1288 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Lille (59350) | 99 % | 94 % | 95 % | 90 % | 86 % |
| Tourcoing (59599) | 98 % | 92 % | 94 % | 86 % | 65 % |
| Roubaix (59512) | 99 % | 96 % | 97 % | 94 % | 63 % |
| Villeneuve-d'Ascq (59009) | 80 % | 72 % | 81 % | 58 % | 77 % |
| Wattrelos (59650) | 82 % | 82 % | 85 % | 68 % | 26 % |
| Marcq-en-Barœul (59378) | 80 % | 77 % | 83 % | 61 % | 61 % |
| Lambersart (59328) | 92 % | 86 % | 90 % | 76 % | 67 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,75 €/L | environ 90 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,75 €/L | environ 270 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,75 €/L | environ 630 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,45 €/L | environ 50 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,45 €/L | environ 160 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,45 €/L | environ 380 € |

## 8. Faits absents : ne pas les écrire, ne pas les reconstituer

- Rang, palmarès ou toute comparaison avec d'autres communes que ni la section 4 bis ni un autre fait du dossier ne fournit : seules les comparaisons calculées et documentées dans le dossier s'écrivent.
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
| Carte de la part de la voiture par secteur (IRIS) | réalisable | secteurs (tableau), iris.voiture.min/max | aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable automatiquement | mobpro.voiture_selon_destination.* (groupes utilisables seulement) | aucun : la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Lille et Tourcoing (59599), Roubaix (59512), Villeneuve-d'Ascq (59009), Wattrelos (59650), Marcq-en-Barœul (59378) et Lambersart (59328) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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
2. **Population, source et périmètre identifiés** : on sait de qui l'on parle (actifs, ménages, adresses), d'où vient le chiffre et sur quel territoire exact. La phrase désigne exactement cette population : les parts par secteur portent sur tous les actifs qui habitent le secteur, quelle que soit leur commune de travail ; aucun sous-groupe absent du dossier (secteur × commune de travail) ne s'écrit.
3. **Statut et usage qui l'autorisent** : la colonne « Usage » du dossier dit `oui`, ou `ordre de grandeur` (alors seulement comme ordre de grandeur, avec sa précision). Un fait `en attente de validation` ou `absent` ne s'écrit pas, ni arrondi, ni sous une formule vague qui en tiendrait lieu.
4. **Aucune promesse produit non validée** : la conclusion ne s'appuie que sur les capacités autorisées (dernière section).

### Choisir la question et le format

| Format | Quand | Longueur indicative |
|---|---|---|
| Article complet | Une découverte forte, ou plusieurs, qui apprennent au lecteur quelque chose de propre à la commune | De l'ordre de 700 à 1 000 mots hors méthode |
| Article court | Une piste utile mais limitée, ou une matière surtout communale | De l'ordre de 300 à 500 mots hors méthode |
| Ne pas publier | Les faits sont exacts mais n'apprennent rien au lecteur qui ne soit vrai presque partout, ou les faits utiles sont bloqués | Une note de quelques lignes qui explique pourquoi |

Les longueurs sont des indications, pas des objectifs : on ne remplit pas pour les atteindre. Une seule découverte forte peut suffire à un article complet. La méthode, en fin d'article, n'est pas comptée ; elle reste brève.

La question se choisit d'après les faits du dossier, jamais d'après un autre article. Une question proche de celle d'une autre commune est acceptable si les résultats le justifient ; recopier mécaniquement un récit ou des faits ne l'est pas.

**Format de référence de la série mobilité.** Les articles de la série suivent une même progression, avec des titres propres au texte (pilotes : La Rochelle et Niort, 14/10/2026) :

1. **L'ouverture : la hausse datée du carburant.** C'est le fil d'entrée de la série mobilité (décision du porteur, 15/10/2026) : elle relie le coût des déplacements au choix d'un logement. Le chapeau ou le premier passage donne la hausse datée, à partir des faits `carburant.*` utilisables ; le tableau du surcoût selon la distance (`scenario.carburant.*`) vient au début de l'article, avec ses hypothèses dites une seule fois, sans redire ses cellules dans la prose. Une transition amène ensuite la question locale : quelle place la voiture prend-elle dans les déplacements, selon le secteur et le lieu de travail ? Les distances et surcoûts du scénario ne s'attribuent à aucun quartier ni à aucune commune de travail, et les pratiques de 2022 ne s'expliquent pas par la hausse récente. Seule exception : des faits carburant absents ou inutilisables dans le dossier ; la section A le dit alors, avec l'identifiant en cause. Une préférence de rédaction ne justifie jamais de l'écarter.
2. **Les pratiques locales** : ce que montrent les trajets des habitants, par quartier et selon le lieu de travail, dans l'ordre que leur intérêt impose.
3. **« Et pour les courses, l'école ou la pharmacie ? »** : la transition dit pourquoi on passe du travail aux autres déplacements ; la proximité est décrite, jamais présentée comme la cause des pratiques domicile-travail.
4. **Les options et vérifications concrètes** propres à la commune, tirées des observations locales et des informations documentaires disponibles.
5. **« Votre projet, votre adresse »** : la conclusion (voir les capacités produit).

C'est une progression, pas une grille à remplir : l'ouverture carburant est fixe ; la liberté éditoriale porte sur les faits locaux retenus et leur progression. Une étape suivante sans matière utile se réduit ou disparaît, aucune rubrique (bus, vélo, stationnement) ne s'ajoute pour ressembler à un autre article, et chaque ville garde ses résultats, ses exemples et ses conseils. Les parts par quartier et par commune de travail se lisent l'une après l'autre, jamais comme un croisement.

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
**Entrée de l'article.** Le carburant n'est pas une piste parmi d'autres : c'est l'entrée de la série (format de référence, étape 1). Le scénario pré-calculé suffit ; il ne s'attribue à aucun quartier ni à aucune commune. Les prix sont réextraits avant publication.

**Ce qu'on n'écrit pas faute de donnée.** Toute comparaison avec d'autres communes françaises (rang, « ville de vélo », « plus que la moyenne ») non fournie par le dossier. Le repère de comparaison (section 4 bis : médiane d'un groupe défini par une règle fixe, `outil/comparaison_voiture.py`) est la référence commune pour comparer l'usage de la voiture : valeur locale et médiane dans le récit, règle complète en méthode, sans rang ni palmarès. Il n'exclut pas une autre comparaison explicitement calculée et documentée dans le dossier (exemple : un rang vélo avec son groupe nommé) ; tout temps de trajet ou kilométrage ; tout lien de cause entre un quartier et une pratique.

### Groupes de communes

Un groupe de communes se présente **avec sa liste exacte** la première fois qu'il apparaît (titre, chapeau ou corps, selon où il apparaît en premier). Ensuite, « ces trois communes » (ou l'équivalent) suffit, sans répéter la liste à chaque phrase, tant que le lecteur ne peut pas confondre avec un autre groupe. Jamais « les communes voisines », « la périphérie » ou « l'agglomération » pour un groupe dont la composition n'a pas été donnée. Si le dossier dit qu'une composition n'est pas connue (unité urbaine), ne pas en donner le nombre de communes.

### Visuels

Proposer au plus trois visuels, choisis dans la section « Visuels disponibles ou réalisables » du dossier, chacun posé à côté du passage qu'il éclaire. Le visuel porte le détail que le texte n'énumère pas. Le texte n'annonce que les visuels retenus. Un visuel qui repose sur un fait non utilisable ne se propose pas. Une carte de situation n'accompagne que la comparaison de communes qu'elle situe, avec la même liste exacte.

### Capacités produit

Deux niveaux distincts : **repérée dans le code** (la fonction existe, lue le 12/10/2026, révision `a25fa9fd`, aucun parcours joué dans le navigateur) et **autorisée pour une promesse publiée** (le porteur l'a retenue pour un article). Seule la seconde peut figurer dans la conclusion. Une date de vérification récente ne remplace pas cette validation.

| Capacité | Repérée dans le code | Autorisée dans la conclusion | Ce que l'on peut en dire |
|---|---|---|---|
| Équipements autour d'une adresse | oui | **oui** | Compris dans l'examen de l'adresse à partir du projet ; pas de mention propre dans la conclusion (ni détail, ni liste) |
| Équipement automobile du secteur | oui | **oui** | Compris dans l'examen de l'adresse à partir du projet ; pas de mention propre dans la conclusion : dans un article qui parle de la part de la voiture par secteur, la nommer laisserait croire que futur•e donne ces parts |
| Examen d'une adresse à partir du projet de la personne | oui | **oui** (porteur, 14/10/2026) | Inviter à explorer l'adresse envisagée à partir de son projet (se rapprocher du travail, préparer une retraite, s'installer en famille…) ; nommer au besoin ce qui peut peser dans le choix (mobilité, chaleur de l'été, risques à l'adresse, services), sans détailler de fonctionnalité ni promettre un résultat |
| Temps de trajet estimé vers un lieu déclaré (voiture ou marche) | oui | **non** : validation en attente | Rien : ne pas l'évoquer, même au conditionnel |
| Position de la commune pour la part de la voiture domicile-travail | oui | **non** : pas validée pour une promesse | Rien |
| Comparateur de communes | oui | **non** : pas validé pour une promesse | Rien |

Interdits en toute circonstance : promettre un budget ou un coût de déplacement calculé, des horaires ou fréquences de bus à l'adresse, des temps de trajet (quel que soit le mode), ou les parts de la voiture par secteur de l'article (analyse de la rédaction, absente du dossier d'adresse).

La conclusion vers futur•e est courte (deux ou trois phrases). Elle part du projet du lecteur, pas des données déjà présentées ni de l'offre, et donne envie d'examiner l'adresse envisagée dans son ensemble (capacité « Examen d'une adresse à partir du projet ») ; elle n'est jamais un inventaire des équipements ou de la motorisation ; elle reste dans les seules capacités autorisées, avec ses propres mots, sans catalogue ni phrase commerciale recopiée. Ni le plan ni les formulations d'un article précédent ne sont un modèle.

## 12. Voix futur•e

*(Recopié de `NOTE_EDITORIALE.md`, section 2, à la génération du dossier.)*

- La voix est sérieuse, concrète et vivante. Une phrase marquante est permise quand elle dit quelque chose de juste ; ce qui est proscrit, c'est le slogan automatique de fin de paragraphe. Un conseil pratique dit l'action à faire (« vérifiez dès l'annonce si une place est comprise »), sans comparaison qui la décore.
- Partir d'une situation reconnaissable du lecteur (annonce, visite, trajet du matin, plein, horaires), puis faire avancer le récit par les données.
- Deux entrées possibles : un fait d'actualité daté, s'il amène la question que les données éclairent (sinon il reste un décor) ; ou une question durable de recherche résidentielle (« depuis ce quartier, pourra-t-on moins prendre la voiture ? »). La série mobilité suit une progression de référence (ouverture, pratiques locales, courses et école, vérifications, projet du lecteur) décrite dans `redaction/parametres_editoriaux.md` ; elle règle l'ordre du raisonnement, pas le contenu de chaque ville.
- Le millésime se dit clairement une fois dans le récit et figure sur chaque visuel ; ensuite, présent simple, sans « aujourd'hui » ni « habitants actuels ».
- Décrire ce qui est mesuré : la proximité d'un équipement n'est pas son usage (« une école à moins de 500 mètres », pas « l'école se fait près de chez soi »).

#### Contre la surjustification

Le lecteur n'a pas besoin qu'on lui répète ce que le texte ne mesure pas. Un article qui s'excuse à chaque paragraphe prend une voix scolaire.

- Garder une précision seulement si elle **change le sens**, et la porter d'abord par une formulation exacte plutôt que par une phrase de prudence : nommer chaque groupe par ce qu'il est (« les actifs qui habitent et travaillent à Niort », « ceux qui travaillent à Chauray ») évite d'ajouter qu'il s'agit de groupes distincts ; cette limite va dans la méthode. Restent dans le récit les hypothèses d'un scénario (consommation, nombre d'allers-retours, variation du prix).
- Définir une notion **une fois, au bon endroit**, sans la redéfinir ensuite.
- Le détail technique (vol d'oiseau, sondage, seuils, millésimes des contours) va dans la méthode ou la légende, pas dans le récit.
- Supprimer les évidences : un tableau intitulé « surcoût de carburant » n'a pas à énumérer ensuite l'assurance, l'entretien et le stationnement ; « sept fois plus de kilomètres coûtent sept fois plus » n'apprend rien.
- Ne pas remplacer une justification supprimée par une autre formule de prudence.
- Pas de déduction en chaîne que les données ne portent pas (« ils habitent plus loin, donc roulent plus, donc paient plus ») : quand un scénario chiffré montre déjà l'effet, il suffit.
- Décrire des pratiques, jamais des contraintes : aucun quartier n'« impose » un mode de vie ; ne jamais attribuer une pratique au seul quartier ; ne culpabiliser personne.
- Pas de hiérarchie causale que les données ne mesurent pas (« compte plus que », « dépend d'abord de »).
- Pas de transitions annoncées (« voici le résultat le plus utile »), de maximes de fin de section, d'antithèses d'emphase, ni de témoignages ou scènes inventés. Le texte doit rester concret après suppression de ses phrases d'accroche.
- Chiffres arrondis et lisibles ; populations explicites (actifs, ménages, adresses) ; aucune précision qui laisserait croire à une mesure exacte. Un arrondi ne change pas le sens : une valeur proche de 100 % ou de 0 % s'écrit « la quasi-totalité » ou « presque aucun », jamais « tous » ou « aucun ».
- La conclusion vers futur•e est courte : elle part du projet du lecteur et de l'intérêt d'examiner l'adresse dans son ensemble, sans inventaire de fonctionnalités, et ne promet que les capacités produit autorisées pour une promesse publiée (une capacité repérée dans le code ne suffit pas).
- Chaque chiffre doit apporter quelque chose au lecteur : on n'ajoute pas un fait parce qu'il est disponible.


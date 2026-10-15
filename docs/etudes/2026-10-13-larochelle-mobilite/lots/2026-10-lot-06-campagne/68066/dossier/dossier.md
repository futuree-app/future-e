# Dossier d'entrée de rédaction · Colmar (68066)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/68066/fiche/fiche.json` (générée le 2026-10-15T16:32:04Z, jour de référence 2026-10-13, sha256 `bc8b08cee442ba85`). Dossier généré le 2026-10-15T19:34:55Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Colmar (68066), département 68, intercommunalité CA Colmar Agglomération.
- **Groupe de communes nommé** : Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 68501 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 4 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 10 % [IC 95 % : 9 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 62 % [IC 95 % : 61 % à 63 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar, y compris ceux qui ne se déplacent pas | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Colmar même | 63 % [IC 95 % : 62 % à 65 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar | commune de résidence et de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Colmar | 53 % [IC 95 % : 51 % à 55 %] | actifs occupés de 15 ans ou plus résidant à Colmar qui travaillent à Colmar | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | 83 % [IC 95 % : 78 % à 87 %] | actifs occupés de 15 ans ou plus résidant à Colmar qui travaillent dans l'une de ces communes : Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | commune de travail : Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Colmar et hors de Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | 78 % [IC 95 % : 76 % à 80 %] | actifs occupés de 15 ans ou plus résidant à Colmar qui travaillent hors de Colmar et hors de Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | commune de travail : toute commune autre que Colmar, Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) moins travail à Colmar | +30 points | deux groupes distincts (voir les deux faits) | commune de travail : Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 10 % [IC 95 % : 9 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 39 % [IC 95 % : 38 % à 41 %] | tous les actifs occupés de 15 ans ou plus résidant à Colmar | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 32 % [IC 95 % : 30 % à 33 %] | actifs occupés de 15 ans ou plus résidant à Colmar dont le ménage a au moins une voiture | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 67 % [IC 95 % : 65 % à 69 %] | actifs occupés de 15 ans ou plus résidant à Colmar, propriétaires de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 12 % [IC 95 % : 10 % à 13 %] | actifs occupés de 15 ans ou plus résidant à Colmar, propriétaires de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Colmar, propriétaires de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 54 % [IC 95 % : 51 % à 56 %] | actifs occupés de 15 ans ou plus résidant à Colmar, propriétaires de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 59 % [IC 95 % : 57 % à 62 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires du privé de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 11 % [IC 95 % : 10 % à 13 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires du privé de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 14 % [IC 95 % : 12 % à 16 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires du privé de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 32 % [IC 95 % : 30 % à 34 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires du privé de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 66 % [IC 95 % : 63 % à 69 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires HLM de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 8 % [IC 95 % : 6 % à 10 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires HLM de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 15 % [IC 95 % : 13 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires HLM de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 32 % [IC 95 % : 29 % à 35 %] | actifs occupés de 15 ans ou plus résidant à Colmar, locataires HLM de leur logement | commune de résidence : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Colmar | environ 46 300 | — | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Colmar, de ceux qui habitent Colmar | 38 % | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Colmar et habitent Colmar | 53 % [IC 95 % : 51 % à 55 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent Colmar | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Colmar et habitent Colmar | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent Colmar | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Colmar, de ceux qui habitent une autre commune de l'unité urbaine INSEE 68501 (liste des communes non exposée par la fiche) | 11 % | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Colmar et habitent une autre commune de l'unité urbaine INSEE 68501 (liste des communes non exposée par la fiche) | 85 % [IC 95 % : 82 % à 88 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 68501 (liste des communes non exposée par la fiche) | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Colmar et habitent une autre commune de l'unité urbaine INSEE 68501 (liste des communes non exposée par la fiche) | 4 % [IC 95 % : 3 % à 6 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 68501 (liste des communes non exposée par la fiche) | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Colmar, de ceux qui habitent hors de l'unité urbaine INSEE 68501 | 51 % | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Colmar et habitent hors de l'unité urbaine INSEE 68501 | 89 % [IC 95 % : 88 % à 90 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 68501 | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Colmar et habitent hors de l'unité urbaine INSEE 68501 | 9 % [IC 95 % : 8 % à 10 %] | actifs occupés qui travaillent à Colmar, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 68501 | commune de travail : Colmar (68066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Centre Centre (IRIS 680660104) | 45 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Colmar (68066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Europe Centre (IRIS 680660804) | 81 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Colmar (68066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +36 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Colmar (68066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 21 % | toutes les résidences principales de Colmar | commune : Colmar (68066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 24 % | toutes les résidences principales de Colmar | commune : Colmar (68066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 58 % | toutes les résidences principales de Colmar | commune : Colmar (68066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.68066.commerce_alim_500m` | Part des adresses de Colmar qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 90 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.grande_surface_500m` | Part des adresses de Colmar qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 52 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.pharmacie_500m` | Part des adresses de Colmar qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 73 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.medecin_generaliste_500m` | Part des adresses de Colmar qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.ecole_elementaire_500m` | Part des adresses de Colmar qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 70 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.college_1km` | Part des adresses de Colmar qui ont un collège à moins de 1 km (à vol d'oiseau) | 89 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.gare_2km` | Part des adresses de Colmar qui ont une gare à moins de 2 km (à vol d'oiseau) | 89 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.panier_quotidien_500m` | Part des adresses de Colmar qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 57 % | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.68066.bus_8h_7_9h` | Part des adresses de Colmar qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.68066.aucun_bus_7_9h` | Part des adresses de Colmar sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.68066.bus_4h_20_22h` | Part des adresses de Colmar qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Colmar, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Colmar (68066) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TRACE » (https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,38 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,58 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,80 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,20 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,65 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,55 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Colmar (centre communal de geo.api.gouv.fr : [7.3924, 48.1115]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/68066/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CA Colmar Agglomération s'appelle « TRACE » ; son autorité organisatrice est CA Colmar Agglomération. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain TRACE » : https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1 ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-09-10 | intercommunalité CA Colmar Agglomération ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau TRACE est https://www.trace-colmar.fr. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/fr-200052264-t0004-0000-1 ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau TRACE | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_accompagnants_cmi` | Les accompagnants de personnes titulaires d'une carte CMI Invalidité voyagent gratuitement sur le réseau Trace, à condition que la personne accompagnée ait un titre valide. Le réseau n'est pas présenté comme gratuit pour les autres publics : les titres listés ont un tarif (billet à l'unité à 1,50 €). | https://www.trace-colmar.fr/acheter/titres-de-transport/billets-et-abonnements/ (extrait vérifié le 2026-10-15 : « Les accompagnants des personnes titulaires d’une carte CMI Invalidité peuvent voyager gratuitement sur le réseau Trace ») | 2026-10-15 | non précisée | réseau TRACE ; Accompagnants de titulaires de la carte CMI Invalidité, tout le réseau Trace ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.horaires.validite_lignes_B_C_D` | Les horaires d'hiver des lignes B, C et D sont valables du 31 août 2026 à juin 2027. La page annonce une circulation les dimanches et jours fériés pour ces lignes, en plus du lundi au vendredi et du samedi. | https://www.trace-colmar.fr/se-deplacer/horaires/fiches-horaires-pdf-telechargeables/ (extrait vérifié le 2026-10-15 : « Horaires hiver valables du 31 août 2026 à juin 2027 ») | 2026-10-15 | du 31 août 2026 à juin 2027 | réseau TRACE ; Lignes B, C, D ; application à chaque commune non établie | `oui` |  |
| `doc.horaires.validite_ligne_A` | Les horaires d'hiver de la ligne A sont valables du 31 août à mi-novembre 2026. La page annonce une circulation les dimanches et jours fériés. La ligne est modifiée à cause de travaux route de Neuf-Brisach. | https://www.trace-colmar.fr/se-deplacer/horaires/fiches-horaires-pdf-telechargeables/ (extrait vérifié le 2026-10-15 : « Horaires hiver valables du 31 août à mi-novembre 2026 ») | 2026-10-15 | du 31 août à mi-novembre 2026 | réseau TRACE ; Ligne A (Ingersheim/Turckheim – Colmar Théâtre) ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.horaires.jours_lignes_E_N` | Les lignes E et N circulent du lundi au samedi. La page ne mentionne ni dimanche ni jours fériés pour ces lignes, ce qui ne prouve pas qu'elles ne circulent pas ces jours-là. | https://www.trace-colmar.fr/se-deplacer/horaires/fiches-horaires-pdf-telechargeables/ (extrait vérifié le 2026-10-15 : « Période de fonctionnement : du lundi au samedi ») | 2026-10-15 | horaires d'hiver du 31 août à mi-novembre 2026 | réseau TRACE ; Lignes E et N ; application à chaque commune non établie | `avec ses conditions` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité générale du réseau | `introuvable` | https://www.trace-colmar.fr/acheter/titres-de-transport/billets-et-abonnements/ 2026-10-15 | La page ne mentionne aucune gratuité générale. Une navette gratuite Cœur de Ville (ligne CV) apparaît dans les fiches horaires, mais je n'ai pas d'extrait exact et ses horaires hiver sont indiqués jusqu'au 5 juillet 2026, donc périmés. Les pages « Voyager en toute sérénité » et « Prime Transport » n'ont pas été lues. |
| Calcul d'itinéraire et temps réel | `non vérifié` | https://www.trace-colmar.fr/se-deplacer/mon-itineraire/ 2026-10-15 | Page « Mon itinéraire » existante. Le formulaire n'apparaît pas dans le texte lu et je n'ai pas d'extrait fiable. Une appli « Trace Colmar » donnant le temps réel est annoncée sur https://www.trace-colmar.fr/votre-bus-en-temps-reel-avec-la-nouvelle-appli-trace-colmar/ (page non lue). Les horaires à l'arrêt sont sur https://www.trace-colmar.fr/se-deplacer/horaires/horaires-a-larret/ (non lue). |
| Jours de circulation des lignes F, G, H, J, CV | `non vérifié` | https://www.trace-colmar.fr/se-deplacer/horaires/fiches-horaires-pdf-telechargeables/ 2026-10-15 | F, G, H : lundi au samedi d'après la page, sans extrait exact. J : lundi au vendredi et samedi. Les fiches PDF n'ont pas été ouvertes. |
| Fréquences | `introuvable` | https://www.trace-colmar.fr/se-deplacer/horaires/fiches-horaires-pdf-telechargeables/ 2026-10-15 | Aucune fréquence explicite lue sur les pages consultées. |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 680660104 | Centre Centre | utilisable | `oui` | 792 | 45 % | 7 % | 17 % | 24 % | 33 % | 28 % | 99,8 % |
| 680660602 | Saint-Joseph Mittelharth Sud Est | utilisable | `oui` | 1121 | 47 % | 16 % | 16 % | 17 % | 21 % | 47 % | 94 % |
| 680660102 | Centre Nord-Est | utilisable | `oui` | 1153 | 48 % | 9 % | 13 % | 21 % | 40 % | 32 % | 100 % |
| 680660503 | Saint-Léon Nord | utilisable | `oui` | 1440 | 49 % | 7 % | 15 % | 10 % | 17 % | 56 % | 33 % |
| 680660105 | Centre Sud-Ouest | utilisable | `oui` | 1111 | 50 % | 10 % | 13 % | 23 % | 34 % | 48 % | 88 % |
| 680660101 | Centre Nord-Ouest | utilisable | `oui` | 1027 | 51 % | 7 % | 13 % | 22 % | 34 % | 52 % | 99,7 % |
| 680660103 | Centre Sud-Est | utilisable | `oui` | 938 | 57 % | 10 % | 10 % | 20 % | 22 % | 63 % | 97 % |
| 680660502 | Saint-Léon Ouest | utilisable | `oui` | 1077 | 58 % | 9 % | 7 % | 19 % | 21 % | 57 % | 21 % |
| 680660901 | Sainte-Marie Est | utilisable | `oui` | 936 | 59 % | 12 % | 18 % | 7 % | 19 % | 45 % | 39 % |
| 680660805 | Europe Nord-Est | utilisable | `oui` | 755 | 59 % | 11 % | 12 % | 14 % | 29 % | 46 % | 100 % |
| 680660603 | Saint-Joseph Mittelharth Centre | utilisable | `oui` | 1053 | 60 % | 13 % | 7 % | 14 % | 25 % | 47 % | 47 % |
| 680660902 | Sainte-Marie Ouest | utilisable | `oui` | 1029 | 60 % | 13 % | 11 % | 11 % | 19 % | 57 % | 57 % |
| 680660202 | Sud-Est | utilisable | `oui` | 824 | 60 % | 12 % | 15 % | 8 % | 10 % | 80 % | 34 % |
| 680660604 | Saint-Joseph Mittelharth Nord | utilisable | `oui` | 834 | 62 % | 14 % | 14 % | 8 % | 13 % | 73 % | 3 % |
| 680660201 | Sud-Ouest | utilisable | `oui` | 861 | 62 % | 8 % | 18 % | 9 % | 9 % | 78 % | 11 % |
| 680660401 | Saint-Antoine Ladhof Sud | utilisable | `oui` | 1151 | 63 % | 17 % | 12 % | 6 % | 21 % | 59 % | 49 % |
| 680660701 | Saint-Vincent de Paul Est | utilisable | `oui` | 373 | 65 % | 11 % | 13 % | 10 % | 34 % | 53 % | 72 % |
| 680660402 | Saint-Antoine Ladhof Nord | utilisable | `oui` | 1470 | 65 % | 10 % | 7 % | 12 % | 19 % | 64 % | 15 % |
| 680660801 | Europe Sud-Est | utilisable | `oui` | 554 | 66 % | 5 % | 22 % | 6 % | 33 % | 21 % | 100 % |
| 680660501 | Saint-Léon Est | utilisable | `oui` | 1443 | 68 % | 9 % | 8 % | 12 % | 16 % | 65 % | 87 % |
| 680660601 | Saint-Joseph Mittelharth Sud Ouest | utilisable | `oui` | 896 | 68 % | 11 % | 7 % | 8 % | 20 % | 52 % | 83 % |
| 680660301 | Maraîchers | utilisable | `oui` | 3558 | 71 % | 12 % | 8 % | 5 % | 8 % | 88 % | 16 % |
| 680660803 | Europe Nord-Ouest | utilisable | `oui` | 627 | 74 % | 7 % | 11 % | 5 % | 10 % | 80 % | 65 % |
| 680660802 | Europe Sud-Ouest | utilisable | `oui` | 1177 | 76 % | 7 % | 11 % | 4 % | 18 % | 60 % | 21 % |
| 680660702 | Saint-Vincent de Paul Ouest | utilisable | `oui` | 1065 | 79 % | 8 % | 7 % | 4 % | 15 % | 63 % | 61 % |
| 680660804 | Europe Centre | utilisable | `oui` | 589 | 81 % | 1 % | 11 % | 6 % | 31 % | 25 % | 98 % |

## 4. Mode selon la commune de travail (actifs résidant à Colmar)

Actifs qui habitent l'ensemble de Colmar, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Colmar (68066) | 63 % | 53 % | 15 % | 7 % | 18 % | 5296 | utilisable | `oui` |
| Mulhouse (68224) | 3 % | 56 % | 1 % | 41 % | 1 % | 265 | utilisable | `oui` |
| Strasbourg (67482) | 3 % | 26 % | 0 % | 73 % | 0,3 % | 228 | utilisable | `oui` |
| 99999 (99999) | 2 % | 77 % | 1 % | 22 % | 1 % | 189 | utilisable | `oui` |
| Wintzenheim (68374) | 2 % | 79 % | 9 % | 6 % | 5 % | 150 | utilisable | `oui` |
| Sainte-Croix-en-Plaine (68295) | 1 % | 94 % | 1 % | 1 % | 1 % | 110 | fragile | `ordre de grandeur` |
| Biesheim (68036) | 1 % | 91 % | 2 % | 8 % | 0 % | 99 | fragile | `ordre de grandeur` |
| Horbourg-Wihr (68145) | 1 % | 82 % | 3 % | 8 % | 1 % | 107 | fragile | `ordre de grandeur` |
| Wettolsheim (68365) | 1 % | 88 % | 5 % | 6 % | 0 % | 88 | fragile | `ordre de grandeur` |
| Sélestat (67462) | 1 % | 82 % | 0 % | 18 % | 0 % | 84 | fragile | `ordre de grandeur` |
| Houssen (68146) | 1 % | 88 % | 2 % | 10 % | 1 % | 78 | fragile | `ordre de grandeur` |
| Rouffach (68287) | 1 % | 85 % | 0 % | 16 % | 0 % | 79 | fragile | `ordre de grandeur` |
| Eguisheim (68078) | 1 % | 61 % | 5 % | 28 % | 1 % | 55 | fragile | `ordre de grandeur` |
| Kaysersberg Vignoble (68162) | 1 % | 97 % | 1 % | 0 % | 1 % | 68 | fragile | `ordre de grandeur` |
| Ribeauvillé (68269) | 1 % | 95 % | 1 % | 2 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Kunheim (68172) | 1 % | 98 % | 0 % | 2 % | 0 % | 48 | fragile | `ordre de grandeur` |
| Sausheim (68300) | 1 % | 73 % | 0 % | 27 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Turckheim (68338) | 1 % | 80 % | 10 % | 8 % | 1 % | 57 | fragile | `ordre de grandeur` |
| Munster (68226) | 1 % | 89 % | 0 % | 7 % | 4 % | 48 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Colmar (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 13 927 à 55 707), avec au moins 150 lignes d'échantillon ; Colmar exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Colmar qui vont travailler principalement en voiture (valeur comparée) | 62 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 72 communes du groupe (chaque commune compte une fois) | 68 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Colmar moins la médiane du groupe (valeurs arrondies) | -6 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 72 | `oui` |

Communes du groupe (72, pour la vérification ; ne pas les citer) : Ajaccio, Albi, Amiens, Angoulême, Annemasse, Arles, Arras, Avignon, Bastia, Bayonne, Beauvais, Belfort, Besançon, Blois, Boulogne-sur-Mer, Bourg-en-Bresse, Bourges, Brive-la-Gaillarde, Béziers, Caen, Calais, Carcassonne, Castres, Chalon-sur-Saône, Chambéry, Charleville-Mézières, Chartres, Cherbourg-en-Cotentin, Cholet, Châlons-en-Champagne, Châteauroux, Compiègne, Draguignan, Dunkerque, Fréjus, Gap, Haguenau, La Roche-sur-Yon, La Rochelle, Laval, Le Mans, Les Sables-d'Olonne, Limoges, Lorient, Meaux, Metz, Montauban, Montélimar, Mulhouse, Nancy, Narbonne, Niort, Nîmes, Orléans, Pau, Perpignan, Poitiers, Quimper, Rouen, Saint-Brieuc, Saint-Malo, Saint-Nazaire, Saint-Quentin, Salon-de-Provence, Tarbes, Thionville, Thonon-les-Bains, Troyes, Valence, Valenciennes, Vannes, Évreux.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Colmar. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Colmar | Lignes (vers Colmar) | Statut (vers Colmar) | Usage (vers Colmar) |
|---|---:|---:|---:|---:|---:|---|---|
| Wintzenheim (68374) | 80 % | 7 % | 5 % | 83 % | 286 | utilisable | `oui` |
| Horbourg-Wihr (68145) | 77 % | 8 % | 9 % | 80 % | 232 | utilisable | `oui` |
| Ingersheim (68155) | 81 % | 5 % | 6 % | 86 % | 160 | utilisable | `oui` |
| Turckheim (68338) | 82 % | 6 % | 5 % | 89 % | 160 | utilisable | `oui` |
| Houssen (68146) | 82 % | 5 % | 5 % | 88 % | 99 | fragile | `ordre de grandeur` |
| Wettolsheim (68365) | 80 % | 3 % | 5 % | 94 % | 50 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Colmar (68066) | 90 % | 73 % | 70 % | 57 % | 89 % |
| Wintzenheim (68374) | 86 % | 52 % | 52 % | 43 % | 74 % |
| Horbourg-Wihr (68145) | 61 % | 37 % | 61 % | 26 % | 0 % |
| Ingersheim (68155) | 85 % | 54 % | 80 % | 42 % | 99,9 % |
| Turckheim (68338) | 79 % | 45 % | 40 % | 27 % | 99 % |
| Houssen (68146) | 28 % | 0 % | 57 % | 0 % | 0 % |
| Wettolsheim (68365) | 60 % | 0 % | 74 % | 0 % | 0 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,80 €/L | environ 100 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,80 €/L | environ 290 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,80 €/L | environ 670 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,55 €/L | environ 70 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,55 €/L | environ 200 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,55 €/L | environ 460 € |

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
| Carte de situation : Colmar et Wintzenheim (68374), Horbourg-Wihr (68145), Ingersheim (68155), Turckheim (68338), Houssen (68146) et Wettolsheim (68365) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Saint-Denis (93066)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-05-campagne/93066/fiche/fiche.json` (générée le 2026-10-15T16:16:53Z, jour de référence 2026-10-13, sha256 `cb66972a99367025`). Dossier généré le 2026-10-15T16:17:17Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Saint-Denis (93066), département 93, intercommunalité Métropole du Grand Paris.
- **Groupe de communes nommé** : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00851 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 3 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 7 % [IC 95 % : 6 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 4 % [IC 95 % : 4 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 22 % [IC 95 % : 21 % à 23 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 62 % [IC 95 % : 61 % à 63 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Saint-Denis même | 29 % [IC 95 % : 28 % à 30 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis | commune de résidence et de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Saint-Denis | 20 % [IC 95 % : 19 % à 22 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis qui travaillent à Saint-Denis | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | 13 % [IC 95 % : 11 % à 16 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis qui travaillent dans l'une de ces communes : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | commune de travail : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Saint-Denis et hors de Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | 23 % [IC 95 % : 21 % à 24 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis qui travaillent hors de Saint-Denis et hors de Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | commune de travail : toute commune autre que Saint-Denis, Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) moins travail à Saint-Denis | -7 points | deux groupes distincts (voir les deux faits) | commune de travail : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 44 % [IC 95 % : 43 % à 45 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 11 % [IC 95 % : 10 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Denis | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 67 % [IC 95 % : 65 % à 68 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis dont le ménage a au moins une voiture | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 23 % [IC 95 % : 21 % à 25 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, propriétaires de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 8 % [IC 95 % : 7 % à 9 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, propriétaires de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 30 % [IC 95 % : 28 % à 32 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, propriétaires de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 15 % [IC 95 % : 13 % à 16 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, propriétaires de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 17 % [IC 95 % : 15 % à 18 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires du privé de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires du privé de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 59 % [IC 95 % : 57 % à 61 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires du privé de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 6 % [IC 95 % : 6 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires du privé de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 27 % [IC 95 % : 25 % à 28 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires HLM de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 2 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires HLM de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 39 % [IC 95 % : 37 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires HLM de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 13 % [IC 95 % : 12 % à 14 %] | actifs occupés de 15 ans ou plus résidant à Saint-Denis, locataires HLM de leur logement | commune de résidence : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Saint-Denis | environ 91 000 | — | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Denis, de ceux qui habitent Saint-Denis | 15 % | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Denis et habitent Saint-Denis | 20 % [IC 95 % : 19 % à 22 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent Saint-Denis | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Denis et habitent Saint-Denis | 42 % [IC 95 % : 40 % à 44 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent Saint-Denis | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Denis, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 54 % | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Denis et habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 37 % [IC 95 % : 36 % à 38 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Denis et habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Denis, de ceux qui habitent hors de l'unité urbaine INSEE 00851 | 31 % | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Denis et habitent hors de l'unité urbaine INSEE 00851 | 29 % [IC 95 % : 27 % à 30 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00851 | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Denis et habitent hors de l'unité urbaine INSEE 00851 | 62 % [IC 95 % : 61 % à 64 %] | actifs occupés qui travaillent à Saint-Denis, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00851 | commune de travail : Saint-Denis (93066) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : République Gare Porte de Paris 06 (IRIS 930660906) | 11 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Saint-Denis (93066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Franc-Moisin Bel-Air 05 (IRIS 930660705) | 35 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Saint-Denis (93066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +24 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Saint-Denis (93066), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 55 % | toutes les résidences principales de Saint-Denis | commune : Saint-Denis (93066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 7 % | toutes les résidences principales de Saint-Denis | commune : Saint-Denis (93066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 36 % | toutes les résidences principales de Saint-Denis | commune : Saint-Denis (93066) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.93066.commerce_alim_500m` | Part des adresses de Saint-Denis qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 100 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.grande_surface_500m` | Part des adresses de Saint-Denis qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 64 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.pharmacie_500m` | Part des adresses de Saint-Denis qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 93 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.medecin_generaliste_500m` | Part des adresses de Saint-Denis qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.ecole_elementaire_500m` | Part des adresses de Saint-Denis qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 96 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.college_1km` | Part des adresses de Saint-Denis qui ont un collège à moins de 1 km (à vol d'oiseau) | 99 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.gare_2km` | Part des adresses de Saint-Denis qui ont une gare à moins de 2 km (à vol d'oiseau) | 92 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.93066.panier_quotidien_500m` | Part des adresses de Saint-Denis qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Saint-Denis, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Denis (93066) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 200054781 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,35 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,71 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,64 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,06 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,79 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,27 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Denis (centre communal de geo.api.gouv.fr : [2.3657, 48.9378]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-05-campagne/93066/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| réseau de transport urbain | `introuvable` | transport.data.gouv.fr 2026-10-15 | 0 jeu(x) urbain(s) couvrant l'intercommunalité 200054781 : identification à faire à la main |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 930660906 | République Gare Porte de Paris 06 | utilisable | `oui` | 1047 | 11 % | 7 % | 66 % | 14 % | 66 % | 21 % | 100 % |
| 930660907 | République Gare Porte de Paris 07 | utilisable | `oui` | 1377 | 12 % | 6 % | 72 % | 5 % | 63 % | 33 % | 100 % |
| 930660903 | République Gare Porte de Paris 03 | utilisable | `oui` | 912 | 13 % | 6 % | 71 % | 7 % | 76 % | 20 % | 100 % |
| 930660802 | Centre Ville Basilique 02 | utilisable | `oui` | 1106 | 14 % | 5 % | 68 % | 9 % | 59 % | 37 % | 100 % |
| 930660908 | République Gare Porte de Paris 08 | utilisable | `oui` | 1333 | 14 % | 5 % | 65 % | 13 % | 71 % | 24 % | 100 % |
| 930660902 | République Gare Porte de Paris 02 | utilisable | `oui` | 1772 | 15 % | 6 % | 70 % | 5 % | 58 % | 32 % | 93 % |
| 930660904 | République Gare Porte de Paris 04 | utilisable | `oui` | 1614 | 15 % | 3 % | 74 % | 5 % | 64 % | 29 % | 100 % |
| 930660905 | République Gare Porte de Paris 05 | utilisable | `oui` | 1048 | 16 % | 9 % | 63 % | 11 % | 66 % | 28 % | 100 % |
| 930660901 | République Gare Porte de Paris 01 | utilisable | `oui` | 1546 | 16 % | 5 % | 67 % | 5 % | 57 % | 32 % | 100 % |
| 930660502 | Mutuelle Champ de Courses 02 | utilisable | `oui` | 683 | 18 % | 3 % | 65 % | 9 % | 47 % | 50 % | 100 % |
| 930660201 | Peri Langevin Stalingrad Politzer 01 | utilisable | `oui` | 1413 | 18 % | 5 % | 66 % | 7 % | 51 % | 50 % | 84 % |
| 930661004 | Delaunay Belleville 04 | utilisable | `oui` | 615 | 19 % | 2 % | 57 % | 11 % | 51 % | 48 % | 59 % |
| 930661101 | Plaine 01 | utilisable | `oui` | 2010 | 20 % | 2 % | 63 % | 8 % | 48 % | 54 % | 79 % |
| 930661103 | Plaine 03 | utilisable | `oui` | 2761 | 20 % | 5 % | 62 % | 7 % | 55 % | 43 % | 83 % |
| 930661501 | Pleyel 01 | utilisable | `oui` | 2711 | 21 % | 5 % | 56 % | 6 % | 59 % | 36 % | 55 % |
| 930661003 | Delaunay Belleville 03 | utilisable | `oui` | 753 | 21 % | 7 % | 64 % | 6 % | 52 % | 66 % | 100 % |
| 930660801 | Centre Ville Basilique 01 | utilisable | `oui` | 1556 | 21 % | 1 % | 66 % | 10 % | 62 % | 25 % | 100 % |
| 930660202 | Peri Langevin Stalingrad Politzer 02 | utilisable | `oui` | 874 | 23 % | 2 % | 61 % | 11 % | 58 % | 33 % | 100 % |
| 930660703 | Franc-Moisin Bel-Air 03 | utilisable | `oui` | 633 | 23 % | 5 % | 60 % | 6 % | 52 % | 56 % | 100 % |
| 930660302 | Allende 02 | utilisable | `oui` | 1225 | 23 % | 6 % | 62 % | 5 % | 60 % | 27 % | 99 % |
| 930660601 | Joliot-Curie-Cosmonautes 01 | utilisable | `oui` | 624 | 24 % | 1 % | 70 % | 5 % | 49 % | 16 % | 96 % |
| 930660504 | Mutuelle Champ de Courses 04 | utilisable | `oui` | 939 | 24 % | 3 % | 61 % | 4 % | 40 % | 41 % | 97 % |
| 930660702 | Franc-Moisin Bel-Air 02 | utilisable | `oui` | 446 | 25 % | 0 % | 64 % | 7 % | 54 % | 7 % | 100 % |
| 930660602 | Joliot-Curie-Cosmonautes 02 | utilisable | `oui` | 1534 | 25 % | 2 % | 65 % | 5 % | 60 % | 37 % | 79 % |
| 930660102 | Semard Delaune Guynemer 02 | utilisable | `oui` | 1036 | 26 % | 5 % | 58 % | 8 % | 48 % | 35 % | 97 % |
| 930660704 | Franc-Moisin Bel-Air 04 | utilisable | `oui` | 1172 | 26 % | 4 % | 61 % | 5 % | 61 % | 23 % | 96 % |
| 930660701 | Franc-Moisin Bel-Air 01 | utilisable | `oui` | 462 | 27 % | 1 % | 65 % | 4 % | 59 % | 10 % | 100 % |
| 930660301 | Allende 01 | utilisable | `oui` | 618 | 27 % | 2 % | 65 % | 4 % | 43 % | 19 % | 100 % |
| 930661102 | Plaine 02 | utilisable | `oui` | 4586 | 28 % | 8 % | 53 % | 6 % | 41 % | 67 % | 99,8 % |
| 930661002 | Delaunay Belleville 02 | utilisable | `oui` | 1137 | 28 % | 1 % | 62 % | 6 % | 48 % | 37 % | 100 % |
| 930660403 | Courtille Saussaie Floréal 03 | utilisable | `oui` | 1120 | 28 % | 1 % | 66 % | 2 % | 51 % | 7 % | 67 % |
| 930660401 | Courtille Saussaie Floréal 01 | utilisable | `oui` | 672 | 28 % | 2 % | 63 % | 5 % | 53 % | 14 % | 76 % |
| 930660501 | Mutuelle Champ de Courses 01 | utilisable | `oui` | 831 | 28 % | 6 % | 43 % | 14 % | 43 % | 43 % | 83 % |
| 930660503 | Mutuelle Champ de Courses 03 | utilisable | `oui` | 840 | 31 % | 2 % | 59 % | 6 % | 52 % | 26 % | 100 % |
| 930660402 | Courtille Saussaie Floréal 02 | utilisable | `oui` | 543 | 31 % | 2 % | 59 % | 5 % | 39 % | 33 % | 93 % |
| 930661001 | Delaunay Belleville 01 | utilisable | `oui` | 789 | 32 % | 2 % | 53 % | 10 % | 42 % | 13 % | 100 % |
| 930660101 | Semard Delaune Guynemer 01 | utilisable | `oui` | 1030 | 33 % | 3 % | 51 % | 9 % | 47 % | 27 % | 100 % |
| 930660705 | Franc-Moisin Bel-Air 05 | utilisable | `oui` | 572 | 35 % | 4 % | 55 % | 4 % | 52 % | 20 % | 100 % |
| 930661104 | Plaine 04 | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Saint-Denis)

Actifs qui habitent l'ensemble de Saint-Denis, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Saint-Denis (93066) | 29 % | 20 % | 7 % | 42 % | 20 % | 4069 | utilisable | `oui` |
| Paris 8e Arrondissement (75108) | 3 % | 8 % | 4 % | 83 % | 0,4 % | 436 | utilisable | `oui` |
| Paris 15e Arrondissement (75115) | 3 % | 12 % | 2 % | 82 % | 1 % | 392 | utilisable | `oui` |
| Paris 18e Arrondissement (75118) | 3 % | 14 % | 7 % | 76 % | 1 % | 370 | utilisable | `oui` |
| Paris 17e Arrondissement (75117) | 2 % | 14 % | 5 % | 76 % | 1 % | 347 | utilisable | `oui` |
| Paris 19e Arrondissement (75119) | 2 % | 13 % | 9 % | 76 % | 1 % | 319 | utilisable | `oui` |
| Aubervilliers (93001) | 2 % | 33 % | 9 % | 48 % | 8 % | 285 | utilisable | `oui` |
| Paris 9e Arrondissement (75109) | 2 % | 9 % | 7 % | 79 % | 1 % | 300 | utilisable | `oui` |
| Paris 13e Arrondissement (75113) | 2 % | 11 % | 3 % | 83 % | 1 % | 288 | utilisable | `oui` |
| Saint-Ouen-sur-Seine (93070) | 2 % | 21 % | 7 % | 63 % | 7 % | 285 | utilisable | `oui` |
| Paris 10e Arrondissement (75110) | 2 % | 7 % | 4 % | 86 % | 1 % | 286 | utilisable | `oui` |
| Paris 12e Arrondissement (75112) | 2 % | 11 % | 3 % | 82 % | 3 % | 269 | utilisable | `oui` |
| Paris 16e Arrondissement (75116) | 2 % | 16 % | 1 % | 78 % | 0 % | 244 | utilisable | `oui` |
| Gennevilliers (92036) | 2 % | 35 % | 5 % | 58 % | 1 % | 226 | utilisable | `oui` |
| Paris 2e Arrondissement (75102) | 1 % | 9 % | 3 % | 86 % | 0,4 % | 193 | utilisable | `oui` |
| Bobigny (93008) | 1 % | 33 % | 2 % | 64 % | 0 % | 178 | utilisable | `oui` |
| Paris 11e Arrondissement (75111) | 1 % | 12 % | 5 % | 80 % | 0 % | 191 | utilisable | `oui` |
| Paris 7e Arrondissement (75107) | 1 % | 5 % | 3 % | 86 % | 1 % | 174 | utilisable | `oui` |
| Roissy-en-France (95527) | 1 % | 68 % | 1 % | 29 % | 1 % | 165 | utilisable | `oui` |
| Paris 14e Arrondissement (75114) | 1 % | 7 % | 0,3 % | 89 % | 1 % | 184 | utilisable | `oui` |
| Paris 1er Arrondissement (75101) | 1 % | 14 % | 3 % | 80 % | 1 % | 162 | utilisable | `oui` |
| Paris 20e Arrondissement (75120) | 1 % | 17 % | 2 % | 80 % | 0 % | 139 | fragile | `ordre de grandeur` |
| Courbevoie (92026) | 1 % | 12 % | 1 % | 82 % | 0,2 % | 152 | utilisable | `oui` |
| Levallois-Perret (92044) | 1 % | 21 % | 2 % | 72 % | 1 % | 153 | utilisable | `oui` |
| Montreuil (93048) | 1 % | 23 % | 1 % | 70 % | 3 % | 143 | fragile | `ordre de grandeur` |
| Stains (93072) | 1 % | 22 % | 6 % | 68 % | 3 % | 137 | fragile | `ordre de grandeur` |
| Boulogne-Billancourt (92012) | 1 % | 23 % | 0,3 % | 73 % | 0,3 % | 140 | fragile | `ordre de grandeur` |
| Clichy (92024) | 1 % | 29 % | 8 % | 59 % | 1 % | 135 | fragile | `ordre de grandeur` |
| Nanterre (92050) | 1 % | 27 % | 2 % | 69 % | 0 % | 143 | fragile | `ordre de grandeur` |
| Puteaux (92062) | 1 % | 16 % | 1 % | 82 % | 0 % | 133 | fragile | `ordre de grandeur` |
| Pantin (93055) | 1 % | 33 % | 7 % | 56 % | 1 % | 130 | fragile | `ordre de grandeur` |
| Paris 5e Arrondissement (75105) | 1 % | 9 % | 1 % | 89 % | 0,2 % | 131 | fragile | `ordre de grandeur` |
| La Courneuve (93027) | 1 % | 46 % | 6 % | 40 % | 5 % | 111 | fragile | `ordre de grandeur` |
| Épinay-sur-Seine (93031) | 1 % | 37 % | 2 % | 59 % | 1 % | 96 | fragile | `ordre de grandeur` |
| Paris 4e Arrondissement (75104) | 1 % | 13 % | 4 % | 83 % | 0 % | 104 | fragile | `ordre de grandeur` |
| Paris 6e Arrondissement (75106) | 1 % | 8 % | 1 % | 86 % | 2 % | 92 | fragile | `ordre de grandeur` |
| Neuilly-sur-Seine (92051) | 1 % | 18 % | 4 % | 76 % | 0,4 % | 111 | fragile | `ordre de grandeur` |
| Paris 3e Arrondissement (75103) | 1 % | 14 % | 9 % | 65 % | 0 % | 90 | fragile | `ordre de grandeur` |
| Villeneuve-la-Garenne (92078) | 1 % | 29 % | 7 % | 56 % | 2 % | 84 | fragile | `ordre de grandeur` |
| Aulnay-sous-Bois (93005) | 1 % | 41 % | 0 % | 56 % | 3 % | 90 | fragile | `ordre de grandeur` |
| Issy-les-Moulineaux (92040) | 1 % | 12 % | 0 % | 78 % | 1 % | 91 | fragile | `ordre de grandeur` |
| 93059 (93059) | 1 % | 20 % | 2 % | 61 % | 14 % | 63 | fragile | `ordre de grandeur` |
| Sarcelles (95585) | 1 % | 33 % | 1 % | 66 % | 0 % | 66 | fragile | `ordre de grandeur` |
| Tremblay-en-France (93073) | 0,4 % | 48 % | 0 % | 52 % | 0 % | 68 | fragile | `ordre de grandeur` |
| Argenteuil (95018) | 0,4 % | 35 % | 2 % | 60 % | 0 % | 53 | fragile | `ordre de grandeur` |
| Garges-lès-Gonesse (95268) | 0,4 % | 42 % | 0 % | 57 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Asnières-sur-Seine (92004) | 0,3 % | 19 % | 0 % | 69 % | 5 % | 49 | fragile | `ordre de grandeur` |
| Colombes (92025) | 0,3 % | 38 % | 5 % | 54 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Drancy (93029) | 0,3 % | 39 % | 1 % | 59 % | 0 % | 44 | fragile | `ordre de grandeur` |
| Villepinte (93078) | 0,3 % | 36 % | 0 % | 64 % | 0 % | 42 | fragile | `ordre de grandeur` |
| Villetaneuse (93079) | 0,3 % | 18 % | 11 % | 68 % | 4 % | 49 | fragile | `ordre de grandeur` |
| Créteil (94028) | 0,3 % | 23 % | 0 % | 73 % | 1 % | 42 | fragile | `ordre de grandeur` |
| Fontenay-sous-Bois (94033) | 0,3 % | 32 % | 0 % | 68 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Cergy (95127) | 0,3 % | 66 % | 0 % | 33 % | 1 % | 44 | fragile | `ordre de grandeur` |
| Gonesse (95277) | 0,3 % | 35 % | 4 % | 60 % | 0 % | 48 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Saint-Denis (autre commune d'une unité urbaine), comptant de la moitié au double de ses actifs occupés résidents (de 23 161 à 92 643), avec au moins 150 lignes d'échantillon ; Saint-Denis exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Saint-Denis qui vont travailler principalement en voiture (valeur comparée) | 22 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 45 communes du groupe (chaque commune compte une fois) | 34 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Saint-Denis moins la médiane du groupe (valeurs arrondies) | -12 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 45 | `oui` |

Communes du groupe (45, pour la vérification ; ne pas les citer) : Antibes, Antony, Argenteuil, Asnières-sur-Seine, Aubervilliers, Aulnay-sous-Bois, Cannes, Cergy, Champigny-sur-Marne, Chelles, Clamart, Clichy, Colombes, Courbevoie, Créteil, Drancy, Fontenay-sous-Bois, Issy-les-Moulineaux, Ivry-sur-Seine, La Seyne-sur-Mer, Levallois-Perret, Maisons-Alfort, Massy, Montreuil, Montrouge, Mérignac, Nanterre, Neuilly-sur-Seine, Noisy-le-Grand, Pantin, Pessac, Puteaux, Roubaix, Rueil-Malmaison, Saint-Maur-des-Fossés, Saint-Ouen-sur-Seine, Sartrouville, Suresnes, Tourcoing, Versailles, Villejuif, Villeneuve-d'Ascq, Vincennes, Vitry-sur-Seine, Évry-Courcouronnes.

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Saint-Denis (93066) | 100 % | 93 % | 96 % | 91 % | 92 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,65 €/L | environ 80 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,65 €/L | environ 230 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,65 €/L | environ 550 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,25 €/L | environ 30 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,25 €/L | environ 90 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,25 €/L | environ 210 € |

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
| Carte de situation : Saint-Denis et Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


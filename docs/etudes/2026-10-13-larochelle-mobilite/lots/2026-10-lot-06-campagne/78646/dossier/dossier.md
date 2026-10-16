# Dossier d'entrée de rédaction · Versailles (78646)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/78646/fiche/fiche.json` (générée le 2026-10-15T16:25:20Z, jour de référence 2026-10-13, sha256 `eba3fae065de8c2f`). Dossier généré le 2026-10-15T16:25:53Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Versailles (78646), département 78, intercommunalité CA Versailles Grand Parc (CAVGP).
- **Groupe de communes nommé** : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00851 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 5 % [IC 95 % : 4 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 6 % [IC 95 % : 5 % à 7 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 3 % [IC 95 % : 3 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 34 % [IC 95 % : 32 % à 35 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 43 % [IC 95 % : 41 % à 44 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles, y compris ceux qui ne se déplacent pas | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Versailles même | 33 % [IC 95 % : 32 % à 34 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles | commune de résidence et de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Versailles | 22 % [IC 95 % : 21 % à 24 %] | actifs occupés de 15 ans ou plus résidant à Versailles qui travaillent à Versailles | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | 15 % [IC 95 % : 12 % à 18 %] | actifs occupés de 15 ans ou plus résidant à Versailles qui travaillent dans l'une de ces communes : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | commune de travail : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Versailles et hors de Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | 39 % [IC 95 % : 38 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Versailles qui travaillent hors de Versailles et hors de Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | commune de travail : toute commune autre que Versailles, Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) moins travail à Versailles | -7 points | deux groupes distincts (voir les deux faits) | commune de travail : Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 18 % [IC 95 % : 17 % à 19 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 28 % [IC 95 % : 27 % à 29 %] | tous les actifs occupés de 15 ans ou plus résidant à Versailles | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 60 % [IC 95 % : 59 % à 61 %] | actifs occupés de 15 ans ou plus résidant à Versailles dont le ménage a au moins une voiture | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 39 % [IC 95 % : 37 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Versailles, propriétaires de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 6 % [IC 95 % : 5 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Versailles, propriétaires de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés de 15 ans ou plus résidant à Versailles, propriétaires de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 40 % [IC 95 % : 38 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Versailles, propriétaires de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 30 % [IC 95 % : 28 % à 32 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires du privé de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 4 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires du privé de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 31 % [IC 95 % : 29 % à 33 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires du privé de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 18 % [IC 95 % : 16 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires du privé de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 33 % [IC 95 % : 31 % à 36 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires HLM de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires HLM de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 24 % [IC 95 % : 22 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires HLM de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 20 % [IC 95 % : 17 % à 22 %] | actifs occupés de 15 ans ou plus résidant à Versailles, locataires HLM de leur logement | commune de résidence : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Versailles | environ 48 400 | — | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Versailles, de ceux qui habitent Versailles | 27 % | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Versailles et habitent Versailles | 22 % [IC 95 % : 21 % à 24 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent Versailles | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Versailles et habitent Versailles | 20 % [IC 95 % : 18 % à 21 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent Versailles | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Versailles, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 53 % | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Versailles et habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 57 % [IC 95 % : 55 % à 58 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Versailles et habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | 36 % [IC 95 % : 34 % à 37 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00851 (liste des communes non exposée par la fiche) | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Versailles, de ceux qui habitent hors de l'unité urbaine INSEE 00851 | 21 % | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Versailles et habitent hors de l'unité urbaine INSEE 00851 | 49 % [IC 95 % : 46 % à 51 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00851 | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Versailles et habitent hors de l'unité urbaine INSEE 00851 | 46 % [IC 95 % : 44 % à 49 %] | actifs occupés qui travaillent à Versailles, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00851 | commune de travail : Versailles (78646) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Chantiers 2 (IRIS 786460302) | 22 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Versailles (78646), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Clagny 5 (IRIS 786460505) | 51 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Versailles (78646), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +29 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Versailles (78646), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 28 % | toutes les résidences principales de Versailles | commune : Versailles (78646) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 20 % | toutes les résidences principales de Versailles | commune : Versailles (78646) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 51 % | toutes les résidences principales de Versailles | commune : Versailles (78646) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.78646.commerce_alim_500m` | Part des adresses de Versailles qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 96 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.grande_surface_500m` | Part des adresses de Versailles qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.pharmacie_500m` | Part des adresses de Versailles qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.medecin_generaliste_500m` | Part des adresses de Versailles qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.ecole_elementaire_500m` | Part des adresses de Versailles qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 89 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.college_1km` | Part des adresses de Versailles qui ont un collège à moins de 1 km (à vol d'oiseau) | 87 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.gare_2km` | Part des adresses de Versailles qui ont une gare à moins de 2 km (à vol d'oiseau) | 98 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.78646.panier_quotidien_500m` | Part des adresses de Versailles qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 79 % | toutes les adresses BAN de Versailles, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Versailles (78646) | BAN ; INSEE BPE 2025 ; GTFS (aucun jeu GTFS urbain dont la couverture est l'EPCI 247800584 : vérification humaine), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,35 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,67 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,68 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 1,99 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,74 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,25 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Versailles (centre communal de geo.api.gouv.fr : [2.1191, 48.8039]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/78646/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| réseau de transport urbain | `introuvable` | transport.data.gouv.fr 2026-10-15 | 0 jeu(x) urbain(s) couvrant l'intercommunalité 247800584 : identification à faire à la main |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 786460302 | Chantiers 2 | utilisable | `oui` | 1471 | 22 % | 3 % | 58 % | 10 % | 39 % | 44 % | 94 % |
| 786460604 | Saint-Louis 2 | utilisable | `oui` | 1368 | 23 % | 7 % | 44 % | 15 % | 37 % | 35 % | 100 % |
| 786460102 | Jussieu 2 | utilisable | `oui` | 777 | 24 % | 3 % | 59 % | 8 % | 49 % | 21 % | 100 % |
| 786460605 | Saint-Louis 3 | utilisable | `oui` | 986 | 24 % | 8 % | 51 % | 10 % | 47 % | 28 % | 27 % |
| 786460301 | Chantiers 1 | utilisable | `oui` | 1432 | 24 % | 7 % | 50 % | 15 % | 28 % | 50 % | 85 % |
| 786460406 | Notre-Dame 6 | utilisable | `oui` | 961 | 26 % | 4 % | 43 % | 16 % | 22 % | 41 % | 100 % |
| 786460305 | Chantiers 5 | utilisable | `oui` | 816 | 26 % | 6 % | 53 % | 9 % | 21 % | 83 % | 87 % |
| 786460403 | Notre-Dame 3 | utilisable | `oui` | 1154 | 27 % | 3 % | 49 % | 13 % | 42 % | 19 % | 100 % |
| 786460401 | Notre-Dame 1 | utilisable | `oui` | 1348 | 28 % | 6 % | 49 % | 10 % | 44 % | 14 % | 100 % |
| 786460303 | Chantiers 3 | utilisable | `oui` | 1158 | 28 % | 4 % | 52 % | 11 % | 35 % | 45 % | 91 % |
| 786460402 | Notre-Dame 2 | utilisable | `oui` | 1228 | 29 % | 5 % | 45 % | 12 % | 35 % | 35 % | 100 % |
| 786460602 | Satory 1 | utilisable | `oui` | 1030 | 29 % | 4 % | 50 % | 10 % | 29 % | 35 % | 23 % |
| 786460601 | Château | utilisable | `oui` | 980 | 30 % | 6 % | 45 % | 12 % | 41 % | 17 % | 23 % |
| 786460407 | Notre-Dame 7 | utilisable | `oui` | 757 | 30 % | 7 % | 45 % | 5 % | 19 % | 62 % | 100 % |
| 786460501 | Clagny 1 | utilisable | `oui` | 1079 | 30 % | 3 % | 50 % | 10 % | 30 % | 47 % | 100 % |
| 786460201 | Montreuil 1 | utilisable | `oui` | 1076 | 30 % | 5 % | 45 % | 11 % | 26 % | 55 % | 100 % |
| 786460603 | Saint-Louis 1 | utilisable | `oui` | 1141 | 34 % | 3 % | 46 % | 11 % | 30 % | 21 % | 96 % |
| 786460606 | Satory 2 | utilisable | `oui` | 2212 | 35 % | 21 % | 12 % | 28 % | 5 % | 78 % | 0 % |
| 786460304 | Chantiers 4 | utilisable | `oui` | 1306 | 35 % | 9 % | 44 % | 9 % | 19 % | 60 % | 100 % |
| 786460202 | Montreuil 2 | utilisable | `oui` | 1189 | 35 % | 6 % | 40 % | 12 % | 31 % | 61 % | 80 % |
| 786460404 | Notre-Dame 4 | utilisable | `oui` | 1247 | 36 % | 4 % | 37 % | 16 % | 23 % | 45 % | 91 % |
| 786460205 | Montreuil 5 | utilisable | `oui` | 600 | 36 % | 3 % | 52 % | 3 % | 19 % | 93 % | 100 % |
| 786460101 | Jussieu 1 | utilisable | `oui` | 1094 | 37 % | 3 % | 49 % | 5 % | 26 % | 55 % | 100 % |
| 786460502 | Clagny 2 | utilisable | `oui` | 951 | 37 % | 4 % | 41 % | 9 % | 23 % | 70 % | 100 % |
| 786460206 | Montreuil 6 | utilisable | `oui` | 875 | 38 % | 6 % | 43 % | 8 % | 42 % | 29 % | 70 % |
| 786460204 | Montreuil 4 | utilisable | `oui` | 857 | 39 % | 4 % | 43 % | 7 % | 22 % | 51 % | 100 % |
| 786460207 | Montreuil 7 | utilisable | `oui` | 1009 | 39 % | 6 % | 35 % | 11 % | 19 % | 66 % | 63 % |
| 786460203 | Montreuil 3 | utilisable | `oui` | 1250 | 40 % | 5 % | 42 % | 5 % | 23 % | 71 % | 100 % |
| 786460503 | Clagny 3 | utilisable | `oui` | 690 | 41 % | 5 % | 41 % | 6 % | 17 % | 78 % | 95 % |
| 786460103 | Jussieu 3 | utilisable | `oui` | 892 | 41 % | 3 % | 41 % | 8 % | 34 % | 39 % | 100 % |
| 786460506 | Clagny 6 | utilisable | `oui` | 868 | 42 % | 9 % | 34 % | 4 % | 15 % | 71 % | 54 % |
| 786460405 | Notre-Dame 5 | utilisable | `oui` | 1097 | 44 % | 5 % | 36 % | 6 % | 22 % | 72 % | 28 % |
| 786460306 | Chantiers 6 | utilisable | `oui` | 1233 | 44 % | 5 % | 32 % | 8 % | 23 % | 71 % | 71 % |
| 786460308 | Chantiers 7 | utilisable | `oui` | 1016 | 45 % | 6 % | 39 % | 3 % | 16 % | 57 % | 41 % |
| 786460504 | Clagny 4 | utilisable | `oui` | 908 | 45 % | 3 % | 38 % | 8 % | 30 % | 60 % | 92 % |
| 786460505 | Clagny 5 | utilisable | `oui` | 808 | 51 % | 6 % | 28 % | 2 % | 11 % | 76 % | 48 % |

## 4. Mode selon la commune de travail (actifs résidant à Versailles)

Actifs qui habitent l'ensemble de Versailles, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Versailles (78646) | 33 % | 22 % | 13 % | 20 % | 30 % | 3892 | utilisable | `oui` |
| Paris 15e Arrondissement (75115) | 4 % | 14 % | 2 % | 81 % | 0,2 % | 475 | utilisable | `oui` |
| Vélizy-Villacoublay (78640) | 3 % | 59 % | 5 % | 32 % | 0,4 % | 385 | utilisable | `oui` |
| Guyancourt (78297) | 3 % | 61 % | 4 % | 34 % | 0 % | 348 | utilisable | `oui` |
| Paris 8e Arrondissement (75108) | 3 % | 14 % | 0,4 % | 80 % | 1 % | 310 | utilisable | `oui` |
| Courbevoie (92026) | 2 % | 17 % | 0,1 % | 80 % | 1 % | 263 | utilisable | `oui` |
| Le Chesnay-Rocquencourt (78158) | 2 % | 47 % | 12 % | 31 % | 6 % | 240 | utilisable | `oui` |
| Boulogne-Billancourt (92012) | 2 % | 41 % | 3 % | 51 % | 0,2 % | 243 | utilisable | `oui` |
| Puteaux (92062) | 2 % | 19 % | 2 % | 77 % | 0 % | 227 | utilisable | `oui` |
| Montigny-le-Bretonneux (78423) | 2 % | 55 % | 4 % | 38 % | 1 % | 199 | utilisable | `oui` |
| Paris 9e Arrondissement (75109) | 2 % | 9 % | 2 % | 86 % | 0 % | 174 | utilisable | `oui` |
| Paris 16e Arrondissement (75116) | 2 % | 22 % | 1 % | 67 % | 2 % | 172 | utilisable | `oui` |
| Paris 7e Arrondissement (75107) | 1 % | 10 % | 3 % | 83 % | 3 % | 164 | utilisable | `oui` |
| Issy-les-Moulineaux (92040) | 1 % | 31 % | 3 % | 62 % | 1 % | 164 | utilisable | `oui` |
| Nanterre (92050) | 1 % | 39 % | 1 % | 58 % | 0 % | 167 | utilisable | `oui` |
| Paris 17e Arrondissement (75117) | 1 % | 14 % | 1 % | 75 % | 2 % | 138 | fragile | `ordre de grandeur` |
| Paris 1er Arrondissement (75101) | 1 % | 13 % | 1 % | 79 % | 0 % | 113 | fragile | `ordre de grandeur` |
| Paris 13e Arrondissement (75113) | 1 % | 10 % | 0 % | 82 % | 0 % | 122 | fragile | `ordre de grandeur` |
| Paris 2e Arrondissement (75102) | 1 % | 12 % | 3 % | 83 % | 0 % | 106 | fragile | `ordre de grandeur` |
| Paris 12e Arrondissement (75112) | 1 % | 9 % | 4 % | 86 % | 1 % | 99 | fragile | `ordre de grandeur` |
| Paris 14e Arrondissement (75114) | 1 % | 17 % | 0 % | 82 % | 0 % | 106 | fragile | `ordre de grandeur` |
| Buc (78117) | 1 % | 54 % | 0 % | 44 % | 0 % | 94 | fragile | `ordre de grandeur` |
| Meudon (92048) | 1 % | 54 % | 5 % | 37 % | 0 % | 101 | fragile | `ordre de grandeur` |
| Élancourt (78208) | 1 % | 75 % | 1 % | 22 % | 0 % | 84 | fragile | `ordre de grandeur` |
| Trappes (78621) | 1 % | 55 % | 3 % | 40 % | 1 % | 92 | fragile | `ordre de grandeur` |
| Levallois-Perret (92044) | 1 % | 33 % | 0 % | 64 % | 0 % | 92 | fragile | `ordre de grandeur` |
| Rueil-Malmaison (92063) | 1 % | 68 % | 1 % | 29 % | 0 % | 82 | fragile | `ordre de grandeur` |
| Paris 10e Arrondissement (75110) | 1 % | 13 % | 2 % | 81 % | 3 % | 69 | fragile | `ordre de grandeur` |
| Viroflay (78686) | 1 % | 33 % | 16 % | 35 % | 14 % | 70 | fragile | `ordre de grandeur` |
| Massy (91377) | 1 % | 49 % | 4 % | 42 % | 0 % | 72 | fragile | `ordre de grandeur` |
| Neuilly-sur-Seine (92051) | 1 % | 22 % | 2 % | 71 % | 0 % | 86 | fragile | `ordre de grandeur` |
| Le Plessis-Robinson (92060) | 1 % | 60 % | 4 % | 27 % | 0 % | 68 | fragile | `ordre de grandeur` |
| Saint-Cloud (92064) | 1 % | 41 % | 2 % | 52 % | 0 % | 81 | fragile | `ordre de grandeur` |
| Suresnes (92073) | 1 % | 40 % | 0 % | 54 % | 0 % | 67 | fragile | `ordre de grandeur` |
| Paris 6e Arrondissement (75106) | 1 % | 9 % | 2 % | 83 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Paris 11e Arrondissement (75111) | 1 % | 6 % | 7 % | 85 % | 0 % | 57 | fragile | `ordre de grandeur` |
| Clamart (92023) | 1 % | 62 % | 3 % | 35 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Montrouge (92049) | 1 % | 24 % | 5 % | 64 % | 0 % | 65 | fragile | `ordre de grandeur` |
| Paris 18e Arrondissement (75118) | 0,4 % | 26 % | 1 % | 66 % | 0 % | 42 | fragile | `ordre de grandeur` |
| Paris 19e Arrondissement (75119) | 0,4 % | 18 % | 0 % | 73 % | 0 % | 53 | fragile | `ordre de grandeur` |
| Jouy-en-Josas (78322) | 0,4 % | 53 % | 3 % | 43 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Plaisir (78490) | 0,4 % | 69 % | 0 % | 31 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Poissy (78498) | 0,4 % | 66 % | 0 % | 35 % | 0 % | 52 | fragile | `ordre de grandeur` |
| Saint-Cyr-l'École (78545) | 0,4 % | 60 % | 11 % | 28 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Saint-Germain-en-Laye (78551) | 0,4 % | 89 % | 2 % | 8 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Gennevilliers (92036) | 0,4 % | 71 % | 0 % | 23 % | 0 % | 47 | fragile | `ordre de grandeur` |
| Sèvres (92072) | 0,4 % | 40 % | 7 % | 47 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Saint-Denis (93066) | 0,4 % | 32 % | 0 % | 68 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Paris 4e Arrondissement (75104) | 0,3 % | 7 % | 1 % | 92 % | 0 % | 44 | fragile | `ordre de grandeur` |
| Paris 5e Arrondissement (75105) | 0,3 % | 4 % | 0 % | 96 % | 0 % | 40 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Versailles (autre commune d'une unité urbaine), comptant de la moitié au double de ses actifs occupés résidents (de 19 432 à 77 729), avec au moins 150 lignes d'échantillon ; Versailles exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Versailles qui vont travailler principalement en voiture (valeur comparée) | 34 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 66 communes du groupe (chaque commune compte une fois) | 36 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Versailles moins la médiane du groupe (valeurs arrondies) | -2 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 66 | `oui` |

Communes du groupe (66, pour la vérification ; ne pas les citer) : Alfortville, Antibes, Antony, Argenteuil, Asnières-sur-Seine, Aubervilliers, Aulnay-sous-Bois, Cagnes-sur-Mer, Caluire-et-Cuire, Cannes, Cergy, Champigny-sur-Marne, Chelles, Choisy-le-Roi, Clamart, Clichy, Colombes, Corbeil-Essonnes, Courbevoie, Créteil, Drancy, Fontenay-sous-Bois, Gennevilliers, Grasse, Hyères, Issy-les-Moulineaux, Ivry-sur-Seine, La Seyne-sur-Mer, Le Blanc-Mesnil, Levallois-Perret, Livry-Gargan, Maisons-Alfort, Massy, Meudon, Montreuil, Montrouge, Mérignac, Nanterre, Neuilly-sur-Seine, Noisy-le-Grand, Pantin, Pessac, Puteaux, Rezé, Rosny-sous-Bois, Roubaix, Rueil-Malmaison, Saint-Denis, Saint-Germain-en-Laye, Saint-Herblain, Saint-Maur-des-Fossés, Saint-Ouen-sur-Seine, Saint-Priest, Sarcelles, Sartrouville, Suresnes, Talence, Tourcoing, Villejuif, Villenave-d'Ornon, Villeneuve-d'Ascq, Vincennes, Vitry-sur-Seine, Vénissieux, Épinay-sur-Seine, Évry-Courcouronnes.

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Versailles (78646) | 96 % | 86 % | 89 % | 79 % | 98 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,70 €/L | environ 80 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,70 €/L | environ 250 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,70 €/L | environ 590 € |
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
| Carte de situation : Versailles et Paris 15e Arrondissement (75115), Paris 20e Arrondissement (75120), Paris 18e Arrondissement (75118), Paris 19e Arrondissement (75119), Paris 13e Arrondissement (75113) et Paris 17e Arrondissement (75117) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


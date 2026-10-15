# Dossier d'entrée de rédaction · Limoges (87085)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/87085/fiche/fiche.json` (générée le 2026-10-15T16:11:20Z, jour de référence 2026-10-13, sha256 `92060656edd19706`). Dossier généré le 2026-10-15T16:11:50Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Limoges (87085), département 87, intercommunalité CU Limoges Métropole.
- **Groupe de communes nommé** : Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 87601 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 12 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 70 % [IC 95 % : 69 % à 71 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 12 % [IC 95 % : 11 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges, y compris ceux qui ne se déplacent pas | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Limoges même | 82 % [IC 95 % : 81 % à 82 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges | commune de résidence et de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Limoges | 66 % [IC 95 % : 65 % à 67 %] | actifs occupés de 15 ans ou plus résidant à Limoges qui travaillent à Limoges | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | 86 % [IC 95 % : 83 % à 89 %] | actifs occupés de 15 ans ou plus résidant à Limoges qui travaillent dans l'une de ces communes : Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | commune de travail : Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Limoges et hors de Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | 86 % [IC 95 % : 85 % à 88 %] | actifs occupés de 15 ans ou plus résidant à Limoges qui travaillent hors de Limoges et hors de Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | commune de travail : toute commune autre que Limoges, Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) moins travail à Limoges | +20 points | deux groupes distincts (voir les deux faits) | commune de travail : Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 12 % [IC 95 % : 11 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 38 % [IC 95 % : 37 % à 39 %] | tous les actifs occupés de 15 ans ou plus résidant à Limoges | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 22 % [IC 95 % : 21 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Limoges dont le ménage a au moins une voiture | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 78 % [IC 95 % : 77 % à 80 %] | actifs occupés de 15 ans ou plus résidant à Limoges, propriétaires de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Limoges, propriétaires de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Limoges, propriétaires de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 56 % [IC 95 % : 55 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Limoges, propriétaires de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 64 % [IC 95 % : 63 % à 66 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires du privé de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 2 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires du privé de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 19 % [IC 95 % : 18 % à 21 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires du privé de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 23 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires du privé de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 66 % [IC 95 % : 63 % à 68 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires HLM de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 1 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires HLM de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 21 % [IC 95 % : 19 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires HLM de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 24 % [IC 95 % : 22 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Limoges, locataires HLM de leur logement | commune de résidence : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Limoges | environ 83 000 | — | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Limoges, de ceux qui habitent Limoges | 48 % | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Limoges et habitent Limoges | 66 % [IC 95 % : 65 % à 67 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent Limoges | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Limoges et habitent Limoges | 13 % [IC 95 % : 12 % à 13 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent Limoges | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Limoges, de ceux qui habitent une autre commune de l'unité urbaine INSEE 87601 (liste des communes non exposée par la fiche) | 18 % | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Limoges et habitent une autre commune de l'unité urbaine INSEE 87601 (liste des communes non exposée par la fiche) | 94 % [IC 95 % : 93 % à 95 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 87601 (liste des communes non exposée par la fiche) | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Limoges et habitent une autre commune de l'unité urbaine INSEE 87601 (liste des communes non exposée par la fiche) | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 87601 (liste des communes non exposée par la fiche) | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Limoges, de ceux qui habitent hors de l'unité urbaine INSEE 87601 | 35 % | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Limoges et habitent hors de l'unité urbaine INSEE 87601 | 95 % [IC 95 % : 94 % à 96 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 87601 | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Limoges et habitent hors de l'unité urbaine INSEE 87601 | 4 % [IC 95 % : 3 % à 4 %] | actifs occupés qui travaillent à Limoges, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 87601 | commune de travail : Limoges (87085) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Les Halles (IRIS 870850204) | 48 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Limoges (87085), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Beaune les Mines (IRIS 870851601) | 94 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Limoges (87085), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +46 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Limoges (87085), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 26 % | toutes les résidences principales de Limoges | commune : Limoges (87085) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 21 % | toutes les résidences principales de Limoges | commune : Limoges (87085) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 55 % | toutes les résidences principales de Limoges | commune : Limoges (87085) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.87085.commerce_alim_500m` | Part des adresses de Limoges qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 83 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.grande_surface_500m` | Part des adresses de Limoges qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 57 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.pharmacie_500m` | Part des adresses de Limoges qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 79 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.medecin_generaliste_500m` | Part des adresses de Limoges qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 74 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.ecole_elementaire_500m` | Part des adresses de Limoges qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.college_1km` | Part des adresses de Limoges qui ont un collège à moins de 1 km (à vol d'oiseau) | 75 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.gare_2km` | Part des adresses de Limoges qui ont une gare à moins de 2 km (à vol d'oiseau) | 67 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.panier_quotidien_500m` | Part des adresses de Limoges qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 61 % | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.87085.bus_8h_7_9h` | Part des adresses de Limoges qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.87085.aucun_bus_7_9h` | Part des adresses de Limoges sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.87085.bus_4h_20_22h` | Part des adresses de Limoges qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Limoges, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Limoges (87085) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,59 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,74 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,17 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,65 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,52 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Limoges (centre communal de geo.api.gouv.fr : [1.226, 45.8567]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/87085/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CU Limoges Métropole s'appelle « TCL » ; son autorité organisatrice est CU Limoges Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain TCL » : https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1 ; nom confirmé par : offre de transport.data.gouv.fr confirmée par l'intitulé ou l'agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-14 | intercommunalité CU Limoges Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| site officiel du réseau | `non vérifié` | https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-reseaux-naq-lim-nva-m-1 2026-10-15 | aucune agence du GTFS ne correspond de façon univoque au nom du réseau : STCLM (Limoges Métropole) (https://www.stcl.fr) |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 870850204 | Les Halles | utilisable | `oui` | 907 | 48 % | 2 % | 12 % | 34 % | 49 % | 14 % | 100 % |
| 870850803 | Les Coutures | utilisable | `oui` | 476 | 49 % | 3 % | 27 % | 20 % | 52 % | 37 % | 95 % |
| 870850201 | Les Galeries | utilisable | `oui` | 1319 | 51 % | 2 % | 17 % | 27 % | 43 % | 26 % | 100 % |
| 870851503 | Centre Commercial Corgnac | fragile (205 actifs (< 300)) | `ordre de grandeur` | 205 | 52 % | 3 % | 41 % | 5 % | 48 % | 7 % | 59 % |
| 870850103 | La Visitation | utilisable | `oui` | 1034 | 53 % | 2 % | 14 % | 26 % | 33 % | 59 % | 89 % |
| 870851403 | Mas Jambost | fragile (218 actifs (< 300)) | `ordre de grandeur` | 218 | 54 % | 0 % | 38 % | 8 % | 53 % | 3 % | 18 % |
| 870850203 | Hôtel de Ville | utilisable | `oui` | 1263 | 55 % | 3 % | 14 % | 26 % | 32 % | 56 % | 100 % |
| 870851502 | Olivier de Serres | fragile (249 actifs (< 300)) | `ordre de grandeur` | 249 | 55 % | 3 % | 33 % | 6 % | 40 % | 15 % | 98 % |
| 870850101 | Les Charentes | utilisable | `oui` | 1323 | 55 % | 2 % | 17 % | 20 % | 36 % | 46 % | 85 % |
| 870850202 | La Cathédrale | utilisable | `oui` | 1016 | 55 % | 3 % | 11 % | 25 % | 39 % | 33 % | 100 % |
| 870850102 | Carnot | utilisable | `oui` | 1580 | 56 % | 3 % | 16 % | 22 % | 33 % | 45 % | 84 % |
| 870850302 | Les Émailleurs | utilisable | `oui` | 1158 | 58 % | 3 % | 14 % | 19 % | 29 % | 58 % | 92 % |
| 870850602 | Le Mas Loubier | utilisable | `oui` | 934 | 59 % | 6 % | 14 % | 12 % | 29 % | 45 % | 91 % |
| 870850402 | Le Champ de Foire | utilisable | `oui` | 1441 | 60 % | 4 % | 11 % | 23 % | 26 % | 64 % | 92 % |
| 870850804 | La Gare | utilisable | `oui` | 876 | 60 % | 2 % | 24 % | 10 % | 39 % | 41 % | 77 % |
| 870851202 | C.H.U. | utilisable | `oui` | 659 | 62 % | 1 % | 9 % | 21 % | 25 % | 73 % | 1 % |
| 870851802 | Cité de la Bastide | utilisable | `oui` | 353 | 63 % | 0 % | 30 % | 3 % | 50 % | 21 % | 78 % |
| 870850403 | La Borie | utilisable | `oui` | 989 | 66 % | 4 % | 18 % | 9 % | 24 % | 63 % | 18 % |
| 870851402 | Vincent Auriol | utilisable | `oui` | 492 | 66 % | 0,2 % | 25 % | 5 % | 36 % | 22 % | 13 % |
| 870850401 | Le Colombier | utilisable | `oui` | 1245 | 67 % | 5 % | 9 % | 17 % | 21 % | 60 % | 44 % |
| 870850603 | Le Vigenal | utilisable | `oui` | 409 | 67 % | 1 % | 16 % | 9 % | 33 % | 33 % | 99,5 % |
| 870850703 | La Brégère | utilisable | `oui` | 647 | 68 % | 1 % | 21 % | 6 % | 22 % | 40 % | 62 % |
| 870850503 | Montjovis | utilisable | `oui` | 981 | 69 % | 4 % | 12 % | 11 % | 21 % | 38 % | 98 % |
| 870851102 | Révolution | utilisable | `oui` | 835 | 70 % | 1 % | 16 % | 11 % | 31 % | 51 % | 59 % |
| 870850801 | Le Puy Imbert | utilisable | `oui` | 778 | 70 % | 2 % | 22 % | 4 % | 19 % | 54 % | 33 % |
| 870851801 | Ester | fragile (259 actifs (< 300)) | `ordre de grandeur` | 259 | 70 % | 0 % | 18 % | 7 % | 34 % | 41 % | 58 % |
| 870850502 | Thuillat | utilisable | `oui` | 1067 | 70 % | 5 % | 9 % | 12 % | 16 % | 57 % | 68 % |
| 870850301 | Valadon | utilisable | `oui` | 922 | 70 % | 8 % | 6 % | 13 % | 27 % | 50 % | 66 % |
| 870851103 | Ruchaud-Curie | utilisable | `oui` | 521 | 70 % | 6 % | 7 % | 13 % | 19 % | 55 % | 32 % |
| 870850303 | Renoir | utilisable | `oui` | 877 | 72 % | 3 % | 16 % | 9 % | 29 % | 54 % | 42 % |
| 870851901 | Le Mas Bouyol | utilisable | `oui` | 893 | 72 % | 5 % | 11 % | 5 % | 23 % | 62 % | 9 % |
| 870850802 | Montplaisir | utilisable | `oui` | 643 | 73 % | 1 % | 9 % | 16 % | 18 % | 69 % | 43 % |
| 870851401 | Durkheim | utilisable | `oui` | 533 | 73 % | 4 % | 14 % | 5 % | 35 % | 27 % | 14 % |
| 870850701 | Le Grand Treuil | utilisable | `oui` | 887 | 74 % | 3 % | 15 % | 7 % | 20 % | 52 % | 62 % |
| 870851701 | Beaubreuil | utilisable | `oui` | 574 | 74 % | 0 % | 19 % | 5 % | 43 % | 8 % | 80 % |
| 870851101 | Sainte-Claire | utilisable | `oui` | 1154 | 74 % | 2 % | 9 % | 14 % | 19 % | 74 % | 43 % |
| 870850903 | Le Sablard | utilisable | `oui` | 1438 | 74 % | 3 % | 10 % | 7 % | 25 % | 58 % | 63 % |
| 870850702 | Étoile de Fontaury | utilisable | `oui` | 944 | 74 % | 5 % | 9 % | 8 % | 15 % | 56 % | 91 % |
| 870851302 | Le Puy-Las Rodas | utilisable | `oui` | 708 | 74 % | 3 % | 11 % | 8 % | 32 % | 44 % | 67 % |
| 870851902 | Le Roussillon | utilisable | `oui` | 1671 | 74 % | 4 % | 10 % | 9 % | 19 % | 79 % | 36 % |
| 870850901 | Les Ponts | utilisable | `oui` | 985 | 75 % | 4 % | 8 % | 10 % | 23 % | 51 % | 81 % |
| 870851001 | Les Portes Ferrées | utilisable | `oui` | 981 | 76 % | 2 % | 10 % | 9 % | 15 % | 80 % | 64 % |
| 870851303 | Jules Ferry | utilisable | `oui` | 484 | 77 % | 4 % | 14 % | 3 % | 21 % | 49 % | 67 % |
| 870850501 | Beaublanc | utilisable | `oui` | 722 | 77 % | 4 % | 9 % | 7 % | 20 % | 61 % | 70 % |
| 870851501 | ZUP de Corgnac | utilisable | `oui` | 463 | 78 % | 1 % | 12 % | 8 % | 29 % | 54 % | 64 % |
| 870851201 | Le Gros Tilleul | utilisable | `oui` | 840 | 78 % | 3 % | 8 % | 7 % | 19 % | 75 % | 64 % |
| 870850601 | Louyat | utilisable | `oui` | 830 | 79 % | 2 % | 12 % | 6 % | 16 % | 66 % | 72 % |
| 870851602 | Le Château d'Eau | utilisable | `oui` | 539 | 84 % | 1 % | 9 % | 3 % | 7 % | 86 % | 31 % |
| 870851603 | Gérard Philipe | utilisable | `oui` | 485 | 85 % | 0 % | 12 % | 2 % | 35 % | 31 % | 46 % |
| 870851301 | Fustel de Coulanges | utilisable | `oui` | 894 | 85 % | 3 % | 4 % | 5 % | 21 % | 72 % | 59 % |
| 870852001 | Landouge | utilisable | `oui` | 1681 | 85 % | 2 % | 6 % | 2 % | 6 % | 77 % | 11 % |
| 870851005 | Magre Étendu | utilisable | `oui` | 970 | 85 % | 2 % | 4 % | 5 % | 16 % | 84 % | 7 % |
| 870851702 | Les Homerides | utilisable | `oui` | 555 | 87 % | 0 % | 7 % | 2 % | 15 % | 82 % | 3 % |
| 870852002 | Bellegarde | utilisable | `oui` | 1475 | 92 % | 1 % | 2 % | 1 % | 6 % | 86 % | 10 % |
| 870851601 | Beaune les Mines | utilisable | `oui` | 1317 | 94 % | 0 % | 1 % | 2 % | 5 % | 85 % | 22 % |
| 870851604 | Zone Industrielle Nord | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Limoges)

Actifs qui habitent l'ensemble de Limoges, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Limoges (87085) | 82 % | 66 % | 3 % | 13 % | 14 % | 12249 | utilisable | `oui` |
| Feytiat (87065) | 2 % | 87 % | 0,1 % | 6 % | 3 % | 250 | utilisable | `oui` |
| Couzeix (87050) | 1 % | 88 % | 0,2 % | 6 % | 1 % | 188 | utilisable | `oui` |
| Isle (87075) | 1 % | 82 % | 3 % | 10 % | 4 % | 180 | utilisable | `oui` |
| Panazol (87114) | 1 % | 84 % | 1 % | 12 % | 0,2 % | 164 | utilisable | `oui` |
| Saint-Junien (87154) | 1 % | 92 % | 1 % | 7 % | 0 % | 161 | utilisable | `oui` |
| Aixe-sur-Vienne (87001) | 1 % | 91 % | 0 % | 6 % | 2 % | 99 | fragile | `ordre de grandeur` |
| Boisseuil (87019) | 1 % | 92 % | 0,4 % | 4 % | 3 % | 86 | fragile | `ordre de grandeur` |
| Verneuil-sur-Vienne (87201) | 1 % | 95 % | 0 % | 5 % | 0 % | 78 | fragile | `ordre de grandeur` |
| Guéret (23096) | 0,4 % | 74 % | 0 % | 26 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Ambazac (87002) | 0,4 % | 100 % | 0 % | 0 % | 0 % | 52 | fragile | `ordre de grandeur` |
| Le Palais-sur-Vienne (87113) | 0,4 % | 85 % | 2 % | 12 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Brive-la-Gaillarde (19031) | 0,3 % | 80 % | 3 % | 12 % | 5 % | 53 | fragile | `ordre de grandeur` |
| Bellac (87011) | 0,3 % | 88 % | 0 % | 10 % | 2 % | 41 | fragile | `ordre de grandeur` |
| Saint-Léonard-de-Noblat (87161) | 0,3 % | 100 % | 0 % | 0 % | 0 % | 43 | fragile | `ordre de grandeur` |
| Saint-Yrieix-la-Perche (87187) | 0,3 % | 89 % | 0 % | 8 % | 0 % | 41 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Limoges (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 24 257 à 97 029), avec au moins 150 lignes d'échantillon ; Limoges exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Limoges qui vont travailler principalement en voiture (valeur comparée) | 70 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 41 communes du groupe (chaque commune compte une fois) | 62 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Limoges moins la médiane du groupe (valeurs arrondies) | +8 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 41 | `oui` |

Communes du groupe (41, pour la vérification ; ne pas les citer) : Aix-en-Provence, Ajaccio, Amiens, Angers, Annecy, Avignon, Bayonne, Besançon, Boulogne-Billancourt, Bourges, Brest, Caen, Chambéry, Cherbourg-en-Cotentin, Clermont-Ferrand, Colmar, Dijon, Dunkerque, Grenoble, La Rochelle, Le Havre, Le Mans, Metz, Montauban, Mulhouse, Nancy, Niort, Nîmes, Orléans, Pau, Perpignan, Poitiers, Quimper, Reims, Rouen, Saint-Nazaire, Saint-Étienne, Toulon, Tours, Valence, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Limoges. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Limoges | Lignes (vers Limoges) | Statut (vers Limoges) | Usage (vers Limoges) |
|---|---:|---:|---:|---:|---:|---|---|
| Panazol (87114) | 90 % | 1 % | 4 % | 92 % | 839 | utilisable | `oui` |
| Couzeix (87050) | 94 % | 0,2 % | 2 % | 96 % | 527 | utilisable | `oui` |
| Isle (87075) | 82 % | 3 % | 3 % | 83 % | 369 | utilisable | `oui` |
| Feytiat (87065) | 92 % | 0,4 % | 3 % | 96 % | 316 | utilisable | `oui` |
| Le Palais-sur-Vienne (87113) | 91 % | 1 % | 4 % | 94 % | 293 | utilisable | `oui` |
| Condat-sur-Vienne (87048) | 93 % | 1 % | 2 % | 95 % | 301 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Limoges (87085) | 83 % | 79 % | 75 % | 61 % | 67 % |
| Panazol (87114) | 56 % | 38 % | 14 % | 10 % | 15 % |
| Couzeix (87050) | 15 % | 31 % | 9 % | 7 % | 0 % |
| Isle (87075) | 53 % | 47 % | 43 % | 37 % | 8 % |
| Feytiat (87065) | 44 % | 32 % | 14 % | 7 % | 0 % |
| Le Palais-sur-Vienne (87113) | 47 % | 30 % | 46 % | 28 % | 0 % |
| Condat-sur-Vienne (87048) | 49 % | 33 % | 18 % | 11 % | 1 % |

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
| Carte de situation : Limoges et Panazol (87114), Couzeix (87050), Isle (87075), Feytiat (87065), Le Palais-sur-Vienne (87113) et Condat-sur-Vienne (87048) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


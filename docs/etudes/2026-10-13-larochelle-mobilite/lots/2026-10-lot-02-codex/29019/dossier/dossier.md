# Dossier d'entrée de rédaction · Brest (29019)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-02-codex/29019/fiche/fiche.json` (générée le 2026-10-14T23:55:20Z, jour de référence 2026-10-13, sha256 `bff0d9f34a29a8e1`). Dossier généré le 2026-10-14T23:58:49Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Brest (29019), département 29, intercommunalité Brest Métropole.
- **Groupe de communes nommé** : Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 29701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 3 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 10 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 6 % [IC 95 % : 6 % à 6 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 63 % [IC 95 % : 62 % à 64 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 17 % [IC 95 % : 16 % à 18 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest, y compris ceux qui ne se déplacent pas | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Brest même | 71 % [IC 95 % : 70 % à 72 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest | commune de résidence et de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Brest | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés de 15 ans ou plus résidant à Brest qui travaillent à Brest | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | 80 % [IC 95 % : 78 % à 82 %] | actifs occupés de 15 ans ou plus résidant à Brest qui travaillent dans l'une de ces communes : Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | commune de travail : Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Brest et hors de Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | 80 % [IC 95 % : 78 % à 81 %] | actifs occupés de 15 ans ou plus résidant à Brest qui travaillent hors de Brest et hors de Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | commune de travail : toute commune autre que Brest, Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) moins travail à Brest | +24 points | deux groupes distincts (voir les deux faits) | commune de travail : Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 14 % [IC 95 % : 13 % à 14 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 37 % [IC 95 % : 37 % à 38 %] | tous les actifs occupés de 15 ans ou plus résidant à Brest | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 30 % [IC 95 % : 29 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Brest dont le ménage a au moins une voiture | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 70 % [IC 95 % : 69 % à 71 %] | actifs occupés de 15 ans ou plus résidant à Brest, propriétaires de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 8 % [IC 95 % : 7 % à 9 %] | actifs occupés de 15 ans ou plus résidant à Brest, propriétaires de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 4 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Brest, propriétaires de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 53 % [IC 95 % : 52 % à 54 %] | actifs occupés de 15 ans ou plus résidant à Brest, propriétaires de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 56 % [IC 95 % : 55 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires du privé de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 5 % [IC 95 % : 5 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires du privé de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 22 % [IC 95 % : 20 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires du privé de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 24 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires du privé de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 60 % [IC 95 % : 57 % à 62 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires HLM de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 2 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires HLM de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 27 % [IC 95 % : 25 % à 30 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires HLM de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 20 % [IC 95 % : 18 % à 22 %] | actifs occupés de 15 ans ou plus résidant à Brest, locataires HLM de leur logement | commune de résidence : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Brest | environ 83 500 | — | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Brest, de ceux qui habitent Brest | 50 % | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Brest et habitent Brest | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent Brest | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Brest et habitent Brest | 18 % [IC 95 % : 17 % à 19 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent Brest | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Brest, de ceux qui habitent une autre commune de l'unité urbaine INSEE 29701 (liste des communes non exposée par la fiche) | 14 % | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Brest et habitent une autre commune de l'unité urbaine INSEE 29701 (liste des communes non exposée par la fiche) | 87 % [IC 95 % : 85 % à 88 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 29701 (liste des communes non exposée par la fiche) | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Brest et habitent une autre commune de l'unité urbaine INSEE 29701 (liste des communes non exposée par la fiche) | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 29701 (liste des communes non exposée par la fiche) | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Brest, de ceux qui habitent hors de l'unité urbaine INSEE 29701 | 36 % | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Brest et habitent hors de l'unité urbaine INSEE 29701 | 92 % [IC 95 % : 91 % à 92 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 29701 | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Brest et habitent hors de l'unité urbaine INSEE 29701 | 6 % [IC 95 % : 5 % à 7 %] | actifs occupés qui travaillent à Brest, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 29701 | commune de travail : Brest (29019) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Saint-Martin (IRIS 290190140) | 42 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Brest (29019), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Kervao-Rural Nord (IRIS 290190166) | 87 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Brest (29019), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +45 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Brest (29019), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 27 % | toutes les résidences principales de Brest | commune : Brest (29019) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 21 % | toutes les résidences principales de Brest | commune : Brest (29019) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 44 % | toutes les résidences principales de Brest | commune : Brest (29019) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.29019.commerce_alim_500m` | Part des adresses de Brest qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 92 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.grande_surface_500m` | Part des adresses de Brest qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 66 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.pharmacie_500m` | Part des adresses de Brest qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 78 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.medecin_generaliste_500m` | Part des adresses de Brest qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.ecole_elementaire_500m` | Part des adresses de Brest qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.college_1km` | Part des adresses de Brest qui ont un collège à moins de 1 km (à vol d'oiseau) | 89 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.gare_2km` | Part des adresses de Brest qui ont une gare à moins de 2 km (à vol d'oiseau) | 42 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.panier_quotidien_500m` | Part des adresses de Brest qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 73 % | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.29019.bus_8h_7_9h` | Part des adresses de Brest qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.29019.aucun_bus_7_9h` | Part des adresses de Brest sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.29019.bus_4h_20_22h` | Part des adresses de Brest qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Brest, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Brest (29019) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Bibus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,30 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,57 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,73 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,13 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,65 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,47 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Brest (centre communal de geo.api.gouv.fr : [-4.4996, 48.4085]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-02-codex/29019/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Brest Métropole s'appelle « Bibus » ; son autorité organisatrice est Brest Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Bibus » : https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-13 | intercommunalité Brest Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Bibus est https://www.bibus.fr:443/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-des-bus-et-tramways-circulant-sur-le-territoire-de-brest-metropole ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Bibus | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.itineraire.calculateur` | Le site Bibus propose un calculateur d'itinéraire multimodal (réseau Bibus, vélo, marche, voiture, covoiturage). | https://www.bibus.fr/se-deplacer/calcul-ditineraire (extrait vérifié le 2026-10-14 : « Le calculateur d'itinéraire propose des trajets avec différents modes de transports ») | 2026-10-15 | non précisée | réseau Bibus ; Réseau Bibus, Brest Métropole ; application à chaque commune non établie | `oui` |  |
| `doc.temps_reel.prochains_passages` | La page Prochains passages permet de générer les prochains passages en temps réel en choisissant un arrêt et une ligne. | https://www.bibus.fr/se-deplacer/prochains-passages (extrait vérifié le 2026-10-14 : « Sélectionnez l'arrêt et la ligne que vous souhaitez emprunter, afin de générer les prochains passages en temps réel ! ») | 2026-10-15 | non précisée | réseau Bibus ; Arrêts et lignes du réseau Bibus ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Tarification / gratuité | `inaccessible` | https://www.bibus.fr/tarifs/tickets-et-abonnements 2026-10-15 | La page renvoie une erreur HTTP 500. La page d'accueil évoque des titres et abonnements payants avec des tarifs selon l'âge et le statut, mais je n'ai pas pu confirmer ces extraits sur la page elle-même. Aucune mention de gratuité n'a été trouvée. Cela ne prouve pas que le réseau soit payant ou gratuit, ni qu'il n'existe pas de gratuité partielle. |
| Jours de circulation des lignes urbaines (dimanche, fériés, samedi) et période de validité des horaires | `introuvable` | https://www.bibus.fr/se-deplacer/guides-horaires-et-plans-des-lignes 2026-10-15 | La page des guides horaires ne donne ni les jours de circulation ni la période de validité. Les pages https://www.bibus.fr/se-deplacer/horaires-aux-arrets et les fiches horaires par ligne, éventuellement en PDF, n'ont pas été lues. |
| Fiches horaires | `non vérifié` | https://www.bibus.fr/se-deplacer/guides-horaires-et-plans-des-lignes 2026-10-15 | Cette page est l'emplacement probable des guides horaires et plans de lignes. Son contenu n'a pas fourni d'extrait utilisable sur les horaires de circulation. |
| Temps réel dans l'application Bibus | `non vérifié` | https://www.bibus.fr/bibus-et-vous/application-bibus/comment-consulter-les-horaires-en-temps-reel-sur-lapplication-bibus 2026-10-15 | Cette page a été signalée par la page d'accueil, mais je ne l'ai pas ouverte. |
| tarification (gratuité, abonnements, exceptions) | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 290190140 | Saint-Martin | utilisable | `oui` | 1253 | 42 % | 7 % | 19 % | 27 % | 40 % | 26 % | 100 % |
| 290190138 | Bas Jaurès-Saint Michel | utilisable | `oui` | 1438 | 43 % | 7 % | 22 % | 22 % | 31 % | 30 % | 96 % |
| 290190124 | Siam-Saint-Louis | utilisable | `oui` | 1414 | 43 % | 5 % | 22 % | 25 % | 34 % | 19 % | 71 % |
| 290190139 | Sanquer | utilisable | `oui` | 1604 | 43 % | 6 % | 24 % | 24 % | 42 % | 19 % | 88 % |
| 290190116 | Recouvrance-Pontaniou | utilisable | `oui` | 1051 | 44 % | 11 % | 27 % | 15 % | 43 % | 22 % | 99 % |
| 290190141 | Pilier Rouge | utilisable | `oui` | 1421 | 46 % | 5 % | 26 % | 19 % | 41 % | 29 % | 100 % |
| 290190119 | Recouvrance-Caffarelli | utilisable | `oui` | 1359 | 46 % | 7 % | 26 % | 18 % | 38 % | 19 % | 99 % |
| 290190122 | Bas de Siam | utilisable | `oui` | 1228 | 47 % | 7 % | 17 % | 22 % | 29 % | 22 % | 100 % |
| 290190117 | Prat Ledan | utilisable | `oui` | 809 | 48 % | 8 % | 26 % | 12 % | 39 % | 40 % | 91 % |
| 290190118 | Kerangoff | utilisable | `oui` | 583 | 48 % | 3 % | 32 % | 6 % | 57 % | 17 % | 100 % |
| 290190123 | Siam-Tour d'Auvergne | utilisable | `oui` | 902 | 49 % | 7 % | 14 % | 25 % | 26 % | 28 % | 100 % |
| 290190142 | Sébastopol | utilisable | `oui` | 887 | 50 % | 4 % | 31 % | 11 % | 39 % | 34 % | 100 % |
| 290190134 | Lanredec-Facultés | utilisable | `oui` | 622 | 51 % | 9 % | 17 % | 20 % | 33 % | 42 % | 84 % |
| 290190115 | Queliverzan | utilisable | `oui` | 1011 | 54 % | 6 % | 28 % | 9 % | 29 % | 30 % | 100 % |
| 290190151 | Kerbernard-Pen Ar Creach | utilisable | `oui` | 786 | 55 % | 3 % | 26 % | 10 % | 42 % | 27 % | 76 % |
| 290190127 | Kergoat Est | utilisable | `oui` | 619 | 59 % | 4 % | 24 % | 9 % | 36 % | 19 % | 99 % |
| 290190136 | Kerigonan | utilisable | `oui` | 927 | 59 % | 7 % | 16 % | 14 % | 26 % | 34 % | 92 % |
| 290190143 | Keruscun | utilisable | `oui` | 998 | 59 % | 12 % | 16 % | 12 % | 26 % | 30 % | 70 % |
| 290190159 | Keredern | utilisable | `oui` | 537 | 59 % | 1 % | 30 % | 5 % | 48 % | 7 % | 86 % |
| 290190110 | Kerourien-Valy-Hir | utilisable | `oui` | 602 | 61 % | 3 % | 27 % | 8 % | 48 % | 31 % | 44 % |
| 290190155 | Pontanezen | utilisable | `oui` | 636 | 61 % | 1 % | 26 % | 8 % | 50 % | 11 % | 93 % |
| 290190126 | Kergoat Ouest | utilisable | `oui` | 606 | 61 % | 3 % | 19 % | 13 % | 35 % | 23 % | 32 % |
| 290190144 | Poul Ar Bachet | utilisable | `oui` | 1059 | 61 % | 7 % | 18 % | 10 % | 32 % | 30 % | 79 % |
| 290190114 | Landais | utilisable | `oui` | 697 | 62 % | 10 % | 19 % | 5 % | 19 % | 60 % | 60 % |
| 290190132 | Kerbernier | utilisable | `oui` | 771 | 62 % | 3 % | 22 % | 10 % | 35 % | 20 % | 98 % |
| 290190131 | Bellevue Centre | utilisable | `oui` | 608 | 64 % | 3 % | 25 % | 6 % | 24 % | 42 % | 92 % |
| 290190105 | Saint-Pierre | utilisable | `oui` | 643 | 64 % | 2 % | 25 % | 6 % | 35 % | 35 % | 68 % |
| 290190106 | Mesdoun | utilisable | `oui` | 936 | 65 % | 13 % | 11 % | 6 % | 7 % | 85 % | 30 % |
| 290190152 | Menez Paul | utilisable | `oui` | 1282 | 65 % | 5 % | 20 % | 7 % | 24 % | 54 % | 95 % |
| 290190164 | Kerinou | utilisable | `oui` | 1002 | 66 % | 7 % | 14 % | 8 % | 32 % | 41 % | 61 % |
| 290190108 | Les Quatre Moulins | utilisable | `oui` | 1065 | 66 % | 6 % | 19 % | 5 % | 22 % | 38 % | 87 % |
| 290190150 | Petit Paris | utilisable | `oui` | 894 | 67 % | 4 % | 21 % | 5 % | 23 % | 23 % | 100 % |
| 290190113 | La Cavale Blanche Est-Kervallon | utilisable | `oui` | 771 | 67 % | 6 % | 14 % | 9 % | 17 % | 64 % | 92 % |
| 290190153 | Dourjacq | utilisable | `oui` | 827 | 67 % | 3 % | 18 % | 10 % | 19 % | 46 % | 77 % |
| 290190109 | Kerourien Sud | utilisable | `oui` | 686 | 68 % | 7 % | 15 % | 8 % | 19 % | 52 % | 94 % |
| 290190104 | Poulleder-Kernabat | utilisable | `oui` | 870 | 68 % | 9 % | 12 % | 4 % | 11 % | 83 % | 36 % |
| 290190148 | Saint-Marc | utilisable | `oui` | 1218 | 68 % | 8 % | 15 % | 5 % | 20 % | 63 % | 84 % |
| 290190128 | Kerhallet | utilisable | `oui` | 622 | 68 % | 1 % | 23 % | 5 % | 29 % | 18 % | 69 % |
| 290190107 | Kerbonne | utilisable | `oui` | 1056 | 68 % | 8 % | 15 % | 7 % | 23 % | 41 % | 88 % |
| 290190137 | Kerichen-Montaigne | utilisable | `oui` | 959 | 69 % | 8 % | 11 % | 9 % | 21 % | 40 % | 98 % |
| 290190168 | Keranroux | utilisable | `oui` | 796 | 69 % | 5 % | 19 % | 4 % | 10 % | 85 % | 2 % |
| 290190103 | Kerargaouyat-Le Cruguel | utilisable | `oui` | 818 | 71 % | 9 % | 12 % | 4 % | 8 % | 67 % | 3 % |
| 290190133 | Kerelle-Keredern Sud | utilisable | `oui` | 843 | 71 % | 5 % | 13 % | 7 % | 24 % | 64 % | 91 % |
| 290190149 | Le Bot-Pont Neuf | utilisable | `oui` | 889 | 71 % | 10 % | 11 % | 4 % | 9 % | 80 % | 24 % |
| 290190147 | Le Guelmeur | utilisable | `oui` | 1287 | 71 % | 6 % | 14 % | 5 % | 22 % | 52 % | 85 % |
| 290190129 | Quizac | utilisable | `oui` | 662 | 72 % | 2 % | 18 % | 7 % | 27 % | 35 % | 46 % |
| 290190135 | Bonne Nouvelle | utilisable | `oui` | 1209 | 72 % | 3 % | 10 % | 11 % | 23 % | 53 % | 95 % |
| 290190145 | Forestou | utilisable | `oui` | 1272 | 72 % | 13 % | 6 % | 7 % | 19 % | 58 % | 44 % |
| 290190154 | Dourjacq-Quartier Buquet | utilisable | `oui` | 1244 | 73 % | 5 % | 9 % | 8 % | 10 % | 76 % | 23 % |
| 290190112 | La Cavale Blanche Ouest-Mesnos | utilisable | `oui` | 1342 | 73 % | 7 % | 12 % | 3 % | 8 % | 87 % | 26 % |
| 290190158 | Treornou-Croix Rouge | utilisable | `oui` | 1355 | 75 % | 7 % | 8 % | 5 % | 18 % | 63 % | 67 % |
| 290190157 | Kerallan-Pen ar C'hleuz | utilisable | `oui` | 889 | 76 % | 6 % | 9 % | 5 % | 9 % | 79 % | 48 % |
| 290190165 | Le Bergot | utilisable | `oui` | 853 | 76 % | 2 % | 16 % | 4 % | 22 % | 43 % | 47 % |
| 290190160 | Lambezellec | utilisable | `oui` | 1059 | 79 % | 1 % | 13 % | 5 % | 25 % | 51 % | 98 % |
| 290190146 | Kerangall-Kerampere | utilisable | `oui` | 876 | 81 % | 6 % | 8 % | 1 % | 8 % | 77 % | 7 % |
| 290190161 | Loscoat | utilisable | `oui` | 940 | 82 % | 6 % | 4 % | 5 % | 9 % | 83 % | 20 % |
| 290190166 | Kervao-Rural Nord | utilisable | `oui` | 2196 | 87 % | 3 % | 5 % | 2 % | 5 % | 90 % | 1 % |
| 290190121 | Ports | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190125 | Port-Gare-Liberté-Foch | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190120 | Arsenal | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190156 | Kergaradec-L'Hermitage | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190163 | Le Restic | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190102 | Maison Blanche-Le Portzic | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 290190167 | Rural Ouest | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Brest)

Actifs qui habitent l'ensemble de Brest, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Brest (29019) | 71 % | 56 % | 7 % | 18 % | 13 % | 13267 | utilisable | `oui` |
| Guipavas (29075) | 5 % | 81 % | 4 % | 13 % | 1 % | 951 | utilisable | `oui` |
| Plouzané (29212) | 3 % | 70 % | 9 % | 20 % | 1 % | 473 | utilisable | `oui` |
| Le Relecq-Kerhuon (29235) | 2 % | 86 % | 3 % | 10 % | 1 % | 392 | utilisable | `oui` |
| Gouesnou (29061) | 2 % | 78 % | 3 % | 17 % | 2 % | 298 | utilisable | `oui` |
| Landerneau (29103) | 1 % | 82 % | 0,4 % | 17 % | 0,4 % | 257 | utilisable | `oui` |
| Plougastel-Daoulas (29189) | 1 % | 84 % | 1 % | 14 % | 0 % | 206 | utilisable | `oui` |
| Saint-Renan (29260) | 1 % | 95 % | 2 % | 4 % | 0 % | 182 | utilisable | `oui` |
| Guilers (29069) | 1 % | 80 % | 1 % | 18 % | 0 % | 141 | fragile | `ordre de grandeur` |
| Landivisiau (29105) | 1 % | 87 % | 0 % | 12 % | 1 % | 134 | fragile | `ordre de grandeur` |
| Plabennec (29160) | 1 % | 89 % | 1 % | 10 % | 0 % | 120 | fragile | `ordre de grandeur` |
| Bohars (29011) | 1 % | 89 % | 3 % | 7 % | 0,4 % | 107 | fragile | `ordre de grandeur` |
| Quimper (29232) | 1 % | 87 % | 0 % | 12 % | 1 % | 115 | fragile | `ordre de grandeur` |
| Lanvéoc (29120) | 1 % | 45 % | 5 % | 47 % | 4 % | 90 | fragile | `ordre de grandeur` |
| Ploudaniel (29179) | 1 % | 91 % | 0,3 % | 9 % | 0 % | 102 | fragile | `ordre de grandeur` |
| Plouédern (29181) | 1 % | 90 % | 1 % | 7 % | 0 % | 97 | fragile | `ordre de grandeur` |
| Crozon (29042) | 0,4 % | 44 % | 4 % | 44 % | 8 % | 74 | fragile | `ordre de grandeur` |
| Loperhet (29140) | 0,4 % | 95 % | 4 % | 1 % | 0 % | 72 | fragile | `ordre de grandeur` |
| Morlaix (29151) | 0,4 % | 81 % | 1 % | 17 % | 1 % | 81 | fragile | `ordre de grandeur` |
| Milizac-Guipronvel (29076) | 0,3 % | 97 % | 0 % | 2 % | 0 % | 53 | fragile | `ordre de grandeur` |
| Lannilis (29117) | 0,3 % | 93 % | 0 % | 7 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Rennes (35238) | 0,3 % | 34 % | 6 % | 47 % | 11 % | 47 | fragile | `ordre de grandeur` |
| Châteaulin (29026) | 0,2 % | 88 % | 0 % | 10 % | 2 % | 48 | fragile | `ordre de grandeur` |
| Lesneven (29124) | 0,2 % | 97 % | 1 % | 3 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Ploudalmézeau (29178) | 0,2 % | 94 % | 0 % | 0 % | 3 % | 45 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Brest (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 29 182 à 116 727), avec au moins 150 lignes d'échantillon ; Brest exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Brest qui vont travailler principalement en voiture (valeur comparée) | 63 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 34 communes du groupe (chaque commune compte une fois) | 58 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Brest moins la médiane du groupe (valeurs arrondies) | +5 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 34 | `oui` |

Communes du groupe (34, pour la vérification ; ne pas les citer) : Aix-en-Provence, Ajaccio, Amiens, Angers, Annecy, Avignon, Besançon, Boulogne-Billancourt, Caen, Cherbourg-en-Cotentin, Clermont-Ferrand, Dijon, Dunkerque, Grenoble, La Rochelle, Le Havre, Le Mans, Lille, Limoges, Metz, Mulhouse, Nancy, Nîmes, Orléans, Pau, Perpignan, Poitiers, Reims, Rennes, Rouen, Saint-Étienne, Toulon, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Brest. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Brest | Lignes (vers Brest) | Statut (vers Brest) | Usage (vers Brest) |
|---|---:|---:|---:|---:|---:|---|---|
| Guipavas (29075) | 87 % | 2 % | 5 % | 88 % | 966 | utilisable | `oui` |
| Plouzané (29212) | 80 % | 6 % | 7 % | 83 % | 917 | utilisable | `oui` |
| Plougastel-Daoulas (29189) | 86 % | 3 % | 3 % | 91 % | 674 | utilisable | `oui` |
| Le Relecq-Kerhuon (29235) | 83 % | 4 % | 5 % | 87 % | 676 | utilisable | `oui` |
| Gouesnou (29061) | 85 % | 3 % | 6 % | 86 % | 245 | utilisable | `oui` |
| Bohars (29011) | 85 % | 5 % | 5 % | 89 % | 169 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Brest (29019) | 92 % | 78 % | 88 % | 73 % | 42 % |
| Guipavas (29075) | 49 % | 27 % | 48 % | 23 % | 1 % |
| Plouzané (29212) | 54 % | 45 % | 60 % | 37 % | 0 % |
| Plougastel-Daoulas (29189) | 39 % | 31 % | 33 % | 22 % | 0 % |
| Le Relecq-Kerhuon (29235) | 60 % | 50 % | 44 % | 31 % | 76 % |
| Gouesnou (29061) | 41 % | 36 % | 44 % | 31 % | 0 % |
| Bohars (29011) | 39 % | 36 % | 38 % | 35 % | 0 % |

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
| Carte de situation : Brest et Guipavas (29075), Plouzané (29212), Plougastel-Daoulas (29189), Le Relecq-Kerhuon (29235), Gouesnou (29061) et Bohars (29011) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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

1. **L'ouverture** : un fait daté qui pose la question du lecteur, puis ce qu'elle change pour une recherche de logement. Pour les pilotes, c'est la hausse du carburant, avec le tableau du surcoût selon la distance placé tôt ; ses hypothèses se disent une fois, sans redire les cellules du tableau. Pour une autre commune, cette ouverture n'est retenue que si les faits carburant sont utilisables et qu'elle sert l'angle ; sinon, une autre entrée (question durable de recherche résidentielle).
2. **Les pratiques locales** : ce que montrent les trajets des habitants, par quartier et selon le lieu de travail, dans l'ordre que leur intérêt impose.
3. **« Et pour les courses, l'école ou la pharmacie ? »** : la transition dit pourquoi on passe du travail aux autres déplacements ; la proximité est décrite, jamais présentée comme la cause des pratiques domicile-travail.
4. **Les options et vérifications concrètes** propres à la commune, tirées des observations locales et des informations documentaires disponibles.
5. **« Votre projet, votre adresse »** : la conclusion (voir les capacités produit).

C'est une progression, pas une grille à remplir : une étape sans matière utile se réduit ou disparaît, aucune rubrique (bus, vélo, stationnement) ne s'ajoute pour ressembler à un autre article, et chaque ville garde ses résultats, ses exemples et ses conseils. Les parts par quartier et par commune de travail se lisent l'une après l'autre, jamais comme un croisement.

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

**Entrée de l'article.** Voir le format de référence (étape 1) : la hausse du carburant si ses faits sont utilisables et qu'elle amène la question retenue, sinon une question durable de recherche résidentielle.

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


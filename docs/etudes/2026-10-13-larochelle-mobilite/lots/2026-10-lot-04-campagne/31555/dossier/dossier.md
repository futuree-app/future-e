# Dossier d'entrée de rédaction · Toulouse (31555)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/31555/fiche/fiche.json` (générée le 2026-10-15T15:54:32Z, jour de référence 2026-10-13, sha256 `d0d42f080db43b77`). Dossier généré le 2026-10-15T16:14:40Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Toulouse (31555), département 31, intercommunalité Toulouse Métropole.
- **Groupe de communes nommé** : Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00758 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 8 % [IC 95 % : 7 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 12 % [IC 95 % : 12 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 47 % [IC 95 % : 46 % à 47 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 28 % [IC 95 % : 28 % à 28 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse, y compris ceux qui ne se déplacent pas | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Toulouse même | 77 % [IC 95 % : 76 % à 77 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse | commune de résidence et de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Toulouse | 40 % [IC 95 % : 39 % à 40 %] | actifs occupés de 15 ans ou plus résidant à Toulouse qui travaillent à Toulouse | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | 66 % [IC 95 % : 64 % à 68 %] | actifs occupés de 15 ans ou plus résidant à Toulouse qui travaillent dans l'une de ces communes : Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | commune de travail : Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Toulouse et hors de Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | 69 % [IC 95 % : 68 % à 70 %] | actifs occupés de 15 ans ou plus résidant à Toulouse qui travaillent hors de Toulouse et hors de Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | commune de travail : toute commune autre que Toulouse, Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) moins travail à Toulouse | +26 points | deux groupes distincts (voir les deux faits) | commune de travail : Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 20 % [IC 95 % : 19 % à 20 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 26 % [IC 95 % : 26 % à 27 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulouse | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 45 % [IC 95 % : 44 % à 45 %] | actifs occupés de 15 ans ou plus résidant à Toulouse dont le ménage a au moins une voiture | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 52 % [IC 95 % : 52 % à 53 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, propriétaires de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 17 % [IC 95 % : 16 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, propriétaires de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 6 % [IC 95 % : 6 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, propriétaires de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 40 % [IC 95 % : 39 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, propriétaires de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 42 % [IC 95 % : 41 % à 43 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires du privé de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 11 % [IC 95 % : 10 % à 11 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires du privé de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 29 % [IC 95 % : 28 % à 29 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires du privé de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 18 % [IC 95 % : 17 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires du privé de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 49 % [IC 95 % : 47 % à 50 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires HLM de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 4 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires HLM de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 27 % [IC 95 % : 26 % à 28 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires HLM de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 19 % [IC 95 % : 18 % à 20 %] | actifs occupés de 15 ans ou plus résidant à Toulouse, locataires HLM de leur logement | commune de résidence : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Toulouse | environ 352 900 | — | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulouse, de ceux qui habitent Toulouse | 51 % | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulouse et habitent Toulouse | 40 % [IC 95 % : 39 % à 40 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent Toulouse | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulouse et habitent Toulouse | 30 % [IC 95 % : 30 % à 31 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent Toulouse | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulouse, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00758 (liste des communes non exposée par la fiche) | 28 % | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulouse et habitent une autre commune de l'unité urbaine INSEE 00758 (liste des communes non exposée par la fiche) | 79 % [IC 95 % : 78 % à 80 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00758 (liste des communes non exposée par la fiche) | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulouse et habitent une autre commune de l'unité urbaine INSEE 00758 (liste des communes non exposée par la fiche) | 13 % [IC 95 % : 12 % à 13 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00758 (liste des communes non exposée par la fiche) | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulouse, de ceux qui habitent hors de l'unité urbaine INSEE 00758 | 21 % | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulouse et habitent hors de l'unité urbaine INSEE 00758 | 84 % [IC 95 % : 83 % à 85 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00758 | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulouse et habitent hors de l'unité urbaine INSEE 00758 | 13 % [IC 95 % : 12 % à 14 %] | actifs occupés qui travaillent à Toulouse, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00758 | commune de travail : Toulouse (31555) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Saint-Rome (IRIS 315550102) | 14 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Toulouse (31555), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Saint-Simon Ouest (IRIS 315555503) | 74 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Toulouse (31555), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +60 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Toulouse (31555), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 33 % | toutes les résidences principales de Toulouse | commune : Toulouse (31555) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 16 % | toutes les résidences principales de Toulouse | commune : Toulouse (31555) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 60 % | toutes les résidences principales de Toulouse | commune : Toulouse (31555) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.31555.commerce_alim_500m` | Part des adresses de Toulouse qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 95 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.grande_surface_500m` | Part des adresses de Toulouse qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 67 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.pharmacie_500m` | Part des adresses de Toulouse qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.medecin_generaliste_500m` | Part des adresses de Toulouse qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.ecole_elementaire_500m` | Part des adresses de Toulouse qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 83 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.college_1km` | Part des adresses de Toulouse qui ont un collège à moins de 1 km (à vol d'oiseau) | 80 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.gare_2km` | Part des adresses de Toulouse qui ont une gare à moins de 2 km (à vol d'oiseau) | 75 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.panier_quotidien_500m` | Part des adresses de Toulouse qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.31555.bus_8h_7_9h` | Part des adresses de Toulouse qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.31555.aucun_bus_7_9h` | Part des adresses de Toulouse sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.31555.bus_4h_20_22h` | Part des adresses de Toulouse qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulouse, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulouse (31555) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tisséo » (https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,31 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,71 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,18 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,67 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,51 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulouse (centre communal de geo.api.gouv.fr : [1.4328, 43.6007]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/31555/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Toulouse Métropole s'appelle « Tisséo » ; son autorité organisatrice est SM des transports en commun de l'agglomération toulousaine. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Tisséo » : https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-14 | intercommunalité Toulouse Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Tisséo est https://www.tisseo.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Tisséo | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.reseau_payant` | La page des tarifs présente une offre payante avec des tarifs réduits pour certains publics. Elle n'indique pas de gratuité générale. | https://www.tisseo.fr/acheter/tarifs (extrait vérifié le 2026-10-15 : « Des transports pour tous, un tarif pour chacun ! ») | 2026-10-15 | non précisée | réseau Tisséo ; Réseau Tisséo, tarification générale. La page ne parle d'aucune gratuité. ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.itineraire` | La page Itinéraires renvoie vers l'appli Tisséo pour le calcul d'itinéraire, avec le temps réel. L'accueil du site propose aussi un formulaire De / À / Quand. | https://www.tisseo.fr/se-deplacer/itineraires (extrait vérifié le 2026-10-15 : « Itinéraires et achat de titres : avec vous, partout, tout le temps ! ») | 2026-10-15 | non précisée | réseau Tisséo ; Réseau Tisséo ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité du réseau (pour qui, sur quelles lignes, exceptions) | `introuvable` | https://www.tisseo.fr/acheter/tarifs 2026-10-15 | La page des tarifs ne mentionne ni gratuité ni lignes gratuites. Je ne conclus pas à leur absence. Les pages « Tarifs réduits et droits à réduction » et « Assistant tarifaire » n'ont pas été consultées. |
| Jours de circulation des lignes urbaines (dimanche, jours fériés, samedi) et validité générale des horaires | `introuvable` | https://www.tisseo.fr/se-deplacer/horaires 2026-10-15 | La page Horaires charge son contenu dans un cadre intégré (iframe) qui n'a pas été lu. Seule la période de vacances scolaires 2026 est établie. |
| Fiches horaires et temps réel | `non vérifié` | https://www.tisseo.fr/se-deplacer/horaires 2026-10-15 | Le contenu intégré n'était pas lisible. Pour l'état du réseau et le trafic, la page /se-deplacer/info-trafic existe, mais je ne l'ai pas consultée. |
| Du 19 au 30 octobre 2026, le tram T1, la navette aéroport et les lignes de bus p | `non vérifié` | https://www.tisseo.fr/actualites/horaires-vacances-scolaires-0 2026-10-15 | extrait introuvable sur la page |
| La navette Cimetières circule aussi le samedi 31 octobre et le dimanche 1er nove | `non vérifié` | https://www.tisseo.fr/actualites/horaires-vacances-scolaires-0 2026-10-15 | extrait introuvable sur la page |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 315550102 | Saint-Rome | utilisable | `oui` | 1642 | 14 % | 15 % | 34 % | 29 % | 60 % | 23 % | 100 % |
| 315550602 | La Grave | utilisable | `oui` | 837 | 16 % | 23 % | 40 % | 17 % | 60 % | 20 % | 100 % |
| 315550501 | Filatiers | utilisable | `oui` | 1349 | 17 % | 14 % | 34 % | 27 % | 55 % | 26 % | 100 % |
| 315550401 | Croix Baragnon | utilisable | `oui` | 915 | 17 % | 16 % | 32 % | 26 % | 55 % | 16 % | 100 % |
| 315550101 | Jacobins | utilisable | `oui` | 1169 | 19 % | 14 % | 29 % | 32 % | 67 % | 18 % | 100 % |
| 315550202 | Saint-Sernin | utilisable | `oui` | 1815 | 19 % | 21 % | 33 % | 20 % | 59 % | 28 % | 100 % |
| 315550203 | Valade | utilisable | `oui` | 757 | 20 % | 15 % | 29 % | 29 % | 66 % | 19 % | 90 % |
| 315551102 | Colombette | utilisable | `oui` | 1223 | 21 % | 14 % | 37 % | 21 % | 56 % | 22 % | 100 % |
| 315551002 | Raymond IV | utilisable | `oui` | 1588 | 23 % | 15 % | 39 % | 18 % | 46 % | 32 % | 100 % |
| 315551103 | Gabriel Péri | utilisable | `oui` | 1819 | 23 % | 12 % | 39 % | 19 % | 54 % | 34 % | 100 % |
| 315550302 | Wilson | utilisable | `oui` | 990 | 23 % | 12 % | 33 % | 28 % | 59 % | 17 % | 100 % |
| 315550301 | Occitane | utilisable | `oui` | 1070 | 23 % | 14 % | 39 % | 17 % | 51 % | 38 % | 100 % |
| 315551001 | Belfort | utilisable | `oui` | 1931 | 23 % | 12 % | 41 % | 18 % | 61 % | 22 % | 97 % |
| 315550601 | Teinturiers | utilisable | `oui` | 1271 | 24 % | 21 % | 36 % | 14 % | 43 % | 39 % | 100 % |
| 315552003 | La Gloire | utilisable | `oui` | 1257 | 24 % | 18 % | 35 % | 14 % | 46 % | 24 % | 94 % |
| 315550201 | Taur | utilisable | `oui` | 986 | 25 % | 14 % | 34 % | 18 % | 60 % | 17 % | 100 % |
| 315550502 | Dalbade | utilisable | `oui` | 1586 | 26 % | 13 % | 37 % | 17 % | 54 % | 24 % | 100 % |
| 315550902 | Honoré Serres | utilisable | `oui` | 1588 | 26 % | 23 % | 28 % | 15 % | 49 % | 30 % | 99,5 % |
| 315552004 | 10 Avril | utilisable | `oui` | 1365 | 27 % | 15 % | 43 % | 8 % | 38 % | 50 % | 100 % |
| 315551101 | Dupuy | utilisable | `oui` | 1936 | 28 % | 18 % | 33 % | 16 % | 46 % | 32 % | 100 % |
| 315552005 | Observatoire | utilisable | `oui` | 758 | 28 % | 3 % | 61 % | 4 % | 44 % | 21 % | 99 % |
| 315550402 | Ozenne | utilisable | `oui` | 1029 | 28 % | 15 % | 26 % | 23 % | 39 % | 31 % | 100 % |
| 315550901 | Concorde | utilisable | `oui` | 2348 | 28 % | 21 % | 25 % | 20 % | 44 % | 25 % | 100 % |
| 315551302 | Saint-Léon | utilisable | `oui` | 1560 | 29 % | 14 % | 46 % | 7 % | 52 % | 47 % | 100 % |
| 315550801 | Sébastopol | utilisable | `oui` | 1216 | 30 % | 8 % | 39 % | 14 % | 53 % | 43 % | 81 % |
| 315552101 | Camille Pujol | utilisable | `oui` | 2497 | 30 % | 18 % | 27 % | 16 % | 44 % | 45 % | 100 % |
| 315551501 | Sainte-Lucie | utilisable | `oui` | 1533 | 31 % | 23 % | 34 % | 4 % | 36 % | 52 % | 97 % |
| 315551301 | Notre-Dame | utilisable | `oui` | 1876 | 31 % | 13 % | 44 % | 7 % | 46 % | 51 % | 100 % |
| 315551303 | Hôtel de Région | utilisable | `oui` | 2114 | 32 % | 17 % | 36 % | 10 % | 34 % | 72 % | 74 % |
| 315551502 | Déodat de Séverac | utilisable | `oui` | 2015 | 32 % | 18 % | 39 % | 5 % | 36 % | 61 % | 91 % |
| 315554801 | Paul Sabatier | utilisable | `oui` | 1160 | 32 % | 6 % | 48 % | 11 % | 65 % | 28 % | 64 % |
| 315552502 | École Normale | utilisable | `oui` | 1094 | 33 % | 24 % | 28 % | 9 % | 37 % | 65 % | 93 % |
| 315551601 | Roguet | utilisable | `oui` | 1323 | 33 % | 19 % | 37 % | 6 % | 27 % | 56 % | 100 % |
| 315555402 | Antonio Machado | utilisable | `oui` | 449 | 34 % | 2 % | 51 % | 8 % | 63 % | 31 % | 71 % |
| 315551202 | Jardin des Plantes | utilisable | `oui` | 1149 | 34 % | 24 % | 23 % | 15 % | 37 % | 46 % | 100 % |
| 315551602 | Ravelin | utilisable | `oui` | 2147 | 34 % | 18 % | 35 % | 8 % | 38 % | 57 % | 95 % |
| 315553301 | Arènes | utilisable | `oui` | 2588 | 34 % | 9 % | 49 % | 4 % | 43 % | 60 % | 91 % |
| 315552002 | Caravelle | utilisable | `oui` | 1925 | 35 % | 6 % | 50 % | 6 % | 32 % | 80 % | 100 % |
| 315552001 | Arago | utilisable | `oui` | 1071 | 35 % | 13 % | 37 % | 8 % | 42 % | 47 % | 100 % |
| 315553503 | Barrière de Bayonne | utilisable | `oui` | 1630 | 35 % | 17 % | 37 % | 5 % | 29 % | 75 % | 100 % |
| 315551401 | Ramier | fragile (227 actifs (< 300)) | `ordre de grandeur` | 227 | 35 % | 5 % | 50 % | 7 % | 66 % | 35 % | 20 % |
| 315550802 | Héraclès | utilisable | `oui` | 2804 | 35 % | 21 % | 25 % | 14 % | 36 % | 58 % | 100 % |
| 315552701 | Poudrerie | utilisable | `oui` | 1252 | 35 % | 4 % | 56 % | 4 % | 48 % | 28 % | 99 % |
| 315552402 | Avions | utilisable | `oui` | 821 | 36 % | 15 % | 36 % | 6 % | 27 % | 56 % | 99,7 % |
| 315552702 | Daste | utilisable | `oui` | 943 | 37 % | 13 % | 42 % | 4 % | 54 % | 32 % | 95 % |
| 315550701 | Chapou | utilisable | `oui` | 1437 | 37 % | 20 % | 24 % | 13 % | 57 % | 45 % | 79 % |
| 315552401 | Marvig | utilisable | `oui` | 1140 | 37 % | 13 % | 40 % | 6 % | 39 % | 34 % | 100 % |
| 315551803 | Bourbaki | utilisable | `oui` | 1004 | 38 % | 15 % | 40 % | 4 % | 37 % | 38 % | 100 % |
| 315551201 | Montplaisir | utilisable | `oui` | 1687 | 38 % | 25 % | 17 % | 13 % | 32 % | 49 % | 63 % |
| 315551806 | Mazades | utilisable | `oui` | 1261 | 38 % | 22 % | 27 % | 5 % | 39 % | 47 % | 90 % |
| 315552405 | Serres Municipales | utilisable | `oui` | 603 | 39 % | 18 % | 26 % | 9 % | 36 % | 49 % | 95 % |
| 315552204 | Louis Vitet | utilisable | `oui` | 2015 | 39 % | 23 % | 20 % | 10 % | 33 % | 62 % | 76 % |
| 315552102 | Providence | utilisable | `oui` | 1522 | 39 % | 23 % | 18 % | 13 % | 23 % | 47 % | 99 % |
| 315551805 | Frédéric Estèbe | utilisable | `oui` | 1224 | 39 % | 14 % | 31 % | 8 % | 33 % | 58 % | 84 % |
| 315552501 | Caserne Niel | utilisable | `oui` | 2744 | 40 % | 17 % | 32 % | 7 % | 34 % | 62 % | 96 % |
| 315552404 | Bonnat | utilisable | `oui` | 874 | 40 % | 14 % | 39 % | 4 % | 34 % | 42 % | 100 % |
| 315551902 | Périole | utilisable | `oui` | 1962 | 40 % | 12 % | 32 % | 9 % | 31 % | 49 % | 82 % |
| 315553101 | Fontaine Lestang | utilisable | `oui` | 1371 | 41 % | 21 % | 31 % | 4 % | 26 % | 67 % | 82 % |
| 315551203 | Branly | utilisable | `oui` | 1591 | 41 % | 23 % | 20 % | 8 % | 26 % | 70 % | 99,7 % |
| 315551901 | Raynal | utilisable | `oui` | 2376 | 41 % | 18 % | 24 % | 10 % | 32 % | 59 % | 79 % |
| 315551804 | Marché aux Cochons | utilisable | `oui` | 1868 | 41 % | 15 % | 30 % | 7 % | 28 % | 64 % | 100 % |
| 315553504 | Cartoucherie | utilisable | `oui` | 4695 | 42 % | 10 % | 39 % | 6 % | 37 % | 60 % | 97 % |
| 315551802 | Chaussas | utilisable | `oui` | 1896 | 42 % | 11 % | 31 % | 10 % | 22 % | 85 % | 78 % |
| 315555302 | Poulenc | utilisable | `oui` | 358 | 42 % | 2 % | 41 % | 12 % | 49 % | 23 % | 100 % |
| 315551807 | Nègreneys | utilisable | `oui` | 2460 | 43 % | 19 % | 21 % | 11 % | 35 % | 71 % | 100 % |
| 315551603 | Bourrassol | utilisable | `oui` | 1692 | 43 % | 22 % | 26 % | 5 % | 28 % | 75 % | 37 % |
| 315553203 | Vestrepain | utilisable | `oui` | 510 | 43 % | 11 % | 40 % | 2 % | 32 % | 57 % | 78 % |
| 315552403 | Italie | utilisable | `oui` | 1140 | 43 % | 18 % | 32 % | 3 % | 26 % | 62 % | 91 % |
| 315552801 | Bécanne | utilisable | `oui` | 1143 | 43 % | 23 % | 24 % | 3 % | 25 % | 67 % | 99 % |
| 315554802 | Les Maraîchers | utilisable | `oui` | 1095 | 43 % | 15 % | 27 % | 8 % | 30 % | 72 % | 70 % |
| 315553502 | Les Fontaines | utilisable | `oui` | 1091 | 43 % | 20 % | 25 % | 7 % | 24 % | 81 % | 98 % |
| 315554301 | Louis Plana | utilisable | `oui` | 984 | 44 % | 7 % | 39 % | 1 % | 30 % | 67 % | 82 % |
| 315554302 | Heredia | utilisable | `oui` | 1097 | 44 % | 14 % | 29 % | 6 % | 26 % | 70 % | 68 % |
| 315552902 | Bigorre | utilisable | `oui` | 716 | 44 % | 1 % | 49 % | 4 % | 35 % | 38 % | 100 % |
| 315552304 | Mendès France | utilisable | `oui` | 1074 | 44 % | 16 % | 22 % | 5 % | 27 % | 73 % | 74 % |
| 315550702 | Bazacle | utilisable | `oui` | 1733 | 45 % | 14 % | 25 % | 10 % | 33 % | 72 % | 78 % |
| 315552103 | Bonhoure | utilisable | `oui` | 1667 | 45 % | 19 % | 22 % | 8 % | 20 % | 64 % | 50 % |
| 315555301 | Édouard Bouillères | utilisable | `oui` | 1071 | 45 % | 1 % | 39 % | 7 % | 42 % | 32 % | 96 % |
| 315553501 | Biarritz | utilisable | `oui` | 1581 | 46 % | 19 % | 25 % | 5 % | 19 % | 74 % | 76 % |
| 315552803 | La Digue | utilisable | `oui` | 1060 | 46 % | 15 % | 30 % | 2 % | 27 % | 67 % | 95 % |
| 315552601 | Jules Julien | utilisable | `oui` | 2025 | 46 % | 14 % | 33 % | 4 % | 39 % | 70 % | 96 % |
| 315552301 | Lespinet | utilisable | `oui` | 1160 | 46 % | 28 % | 17 % | 3 % | 31 % | 74 % | 91 % |
| 315556002 | Ancely | utilisable | `oui` | 1545 | 47 % | 13 % | 28 % | 7 % | 27 % | 49 % | 53 % |
| 315553703 | La Salade | utilisable | `oui` | 3526 | 47 % | 10 % | 34 % | 4 % | 34 % | 74 % | 81 % |
| 315553201 | Morvan | utilisable | `oui` | 321 | 47 % | 1 % | 42 % | 8 % | 42 % | 16 % | 100 % |
| 315554201 | Réservoir | utilisable | `oui` | 960 | 48 % | 14 % | 29 % | 4 % | 18 % | 63 % | 61 % |
| 315554203 | Michoum | utilisable | `oui` | 2046 | 49 % | 5 % | 36 % | 2 % | 19 % | 84 % | 55 % |
| 315554202 | Cité Amouroux | utilisable | `oui` | 1503 | 49 % | 8 % | 32 % | 6 % | 25 % | 78 % | 84 % |
| 315552202 | Coin de la Moure | utilisable | `oui` | 1492 | 49 % | 16 % | 19 % | 8 % | 23 % | 53 % | 91 % |
| 315555203 | Van Gogh | utilisable | `oui` | 370 | 49 % | 12 % | 25 % | 1 % | 36 % | 26 % | 100 % |
| 315556001 | Flambère | utilisable | `oui` | 2314 | 49 % | 8 % | 33 % | 7 % | 30 % | 85 % | 14 % |
| 315552302 | Saint-Exupéry | utilisable | `oui` | 1307 | 49 % | 20 % | 16 % | 5 % | 19 % | 79 % | 76 % |
| 315553702 | Fenouillet | utilisable | `oui` | 1860 | 50 % | 12 % | 31 % | 3 % | 24 % | 75 % | 76 % |
| 315553401 | Tellier | utilisable | `oui` | 637 | 51 % | 12 % | 29 % | 2 % | 32 % | 58 % | 69 % |
| 315554303 | Patinoire de la Fraternité | utilisable | `oui` | 1339 | 51 % | 4 % | 33 % | 5 % | 30 % | 71 % | 38 % |
| 315554001 | Lapujade | utilisable | `oui` | 2104 | 52 % | 15 % | 26 % | 3 % | 26 % | 71 % | 73 % |
| 315553901 | Les Izards | utilisable | `oui` | 2768 | 52 % | 2 % | 40 % | 2 % | 34 % | 75 % | 65 % |
| 315555201 | Lestang | utilisable | `oui` | 366 | 52 % | 4 % | 29 % | 3 % | 37 % | 13 % | 6 % |
| 315555102 | Milan | utilisable | `oui` | 857 | 53 % | 4 % | 23 % | 8 % | 34 % | 46 % | 83 % |
| 315552303 | Courrège | utilisable | `oui` | 1223 | 53 % | 14 % | 15 % | 8 % | 16 % | 65 % | 93 % |
| 315553001 | Lambert | utilisable | `oui` | 462 | 53 % | 5 % | 35 % | 2 % | 38 % | 26 % | 100 % |
| 315552104 | Jean Chaubet | utilisable | `oui` | 1096 | 54 % | 12 % | 23 % | 7 % | 17 % | 70 % | 81 % |
| 315555202 | Tel Aviv | utilisable | `oui` | 504 | 54 % | 0 % | 28 % | 11 % | 35 % | 27 % | 85 % |
| 315554007 | Borderouge Nord | utilisable | `oui` | 4460 | 54 % | 5 % | 32 % | 4 % | 30 % | 79 % | 90 % |
| 315552201 | Deltour | utilisable | `oui` | 1257 | 54 % | 18 % | 16 % | 3 % | 10 % | 85 % | 88 % |
| 315554401 | Surcouf | utilisable | `oui` | 755 | 54 % | 5 % | 30 % | 2 % | 26 % | 56 % | 85 % |
| 315554005 | Borderouge Sud-Ouest | utilisable | `oui` | 2580 | 54 % | 9 % | 28 % | 4 % | 20 % | 94 % | 75 % |
| 315554402 | Coquille | utilisable | `oui` | 917 | 55 % | 10 % | 29 % | 4 % | 25 % | 75 % | 92 % |
| 315553202 | Loire | utilisable | `oui` | 392 | 55 % | 5 % | 29 % | 8 % | 34 % | 19 % | 100 % |
| 315551801 | Ponts Jumeaux | utilisable | `oui` | 3350 | 55 % | 9 % | 22 % | 6 % | 25 % | 77 % | 94 % |
| 315552901 | Touraine | utilisable | `oui` | 745 | 55 % | 7 % | 27 % | 2 % | 24 % | 66 % | 97 % |
| 315554603 | Bitet | utilisable | `oui` | 833 | 56 % | 8 % | 24 % | 8 % | 17 % | 68 % | 90 % |
| 315554803 | Salade Ponsan | utilisable | `oui` | 924 | 56 % | 18 % | 18 % | 5 % | 29 % | 87 % | 37 % |
| 315554006 | Borderouge Sud-Est | utilisable | `oui` | 1103 | 56 % | 13 % | 22 % | 4 % | 9 % | 95 % | 80 % |
| 315552802 | La Pointe | utilisable | `oui` | 1179 | 56 % | 17 % | 20 % | 3 % | 20 % | 70 % | 85 % |
| 315553402 | Hippodrome | utilisable | `oui` | 1445 | 56 % | 10 % | 26 % | 6 % | 26 % | 78 % | 33 % |
| 315555204 | Goya | utilisable | `oui` | 704 | 56 % | 3 % | 27 % | 11 % | 42 % | 22 % | 90 % |
| 315555303 | Auriacombe | utilisable | `oui` | 449 | 56 % | 1 % | 38 % | 2 % | 52 % | 26 % | 100 % |
| 315551701 | Embouchure | utilisable | `oui` | 1797 | 57 % | 17 % | 16 % | 2 % | 17 % | 74 % | 80 % |
| 315554805 | Coteaux de Pech David | utilisable | `oui` | 2220 | 57 % | 14 % | 20 % | 4 % | 37 % | 56 % | 5 % |
| 315554004 | Nicol | utilisable | `oui` | 3602 | 57 % | 7 % | 26 % | 2 % | 19 % | 88 % | 61 % |
| 315554501 | Cité de l'Hers | utilisable | `oui` | 944 | 58 % | 4 % | 28 % | 5 % | 28 % | 40 % | 84 % |
| 315554601 | Mal Clabel | utilisable | `oui` | 1266 | 58 % | 9 % | 22 % | 3 % | 21 % | 83 % | 77 % |
| 315555401 | Les Vergers | utilisable | `oui` | 548 | 59 % | 3 % | 32 % | 5 % | 40 % | 15 % | 19 % |
| 315555802 | Les Capelles | utilisable | `oui` | 1628 | 59 % | 12 % | 17 % | 5 % | 20 % | 73 % | 17 % |
| 315551702 | Troènes | utilisable | `oui` | 1732 | 60 % | 14 % | 14 % | 5 % | 14 % | 81 % | 64 % |
| 315552203 | Leygue | utilisable | `oui` | 745 | 60 % | 13 % | 12 % | 3 % | 18 % | 62 % | 75 % |
| 315554703 | Louis Breguet | utilisable | `oui` | 2021 | 60 % | 8 % | 22 % | 5 % | 23 % | 72 % | 75 % |
| 315552903 | Bordelongue | utilisable | `oui` | 497 | 62 % | 0 % | 33 % | 3 % | 28 % | 24 % | 63 % |
| 315554804 | Charbonnière | utilisable | `oui` | 1081 | 62 % | 13 % | 17 % | 3 % | 19 % | 80 % | 21 % |
| 315554502 | Roucoule | utilisable | `oui` | 2422 | 63 % | 5 % | 23 % | 3 % | 13 % | 89 % | 54 % |
| 315554003 | Grand Selve | utilisable | `oui` | 2692 | 63 % | 5 % | 25 % | 3 % | 22 % | 82 % | 6 % |
| 315554503 | Sainte-Claire | utilisable | `oui` | 2032 | 64 % | 9 % | 16 % | 3 % | 12 % | 90 % | 74 % |
| 315555601 | Basso Cambo | utilisable | `oui` | 2160 | 64 % | 5 % | 21 % | 5 % | 12 % | 90 % | 9 % |
| 315555702 | Ramelet Moundi | utilisable | `oui` | 1859 | 64 % | 10 % | 14 % | 5 % | 16 % | 80 % | 50 % |
| 315554602 | Bois de Limayrac | utilisable | `oui` | 1286 | 67 % | 7 % | 15 % | 4 % | 13 % | 86 % | 51 % |
| 315553002 | Mermoz | utilisable | `oui` | 540 | 67 % | 1 % | 26 % | 3 % | 45 % | 50 % | 65 % |
| 315554901 | Pouvourville | utilisable | `oui` | 1995 | 67 % | 7 % | 13 % | 6 % | 17 % | 87 % | 50 % |
| 315553803 | Lalande Sud | utilisable | `oui` | 2477 | 67 % | 7 % | 21 % | 2 % | 14 % | 90 % | 54 % |
| 315555101 | Gironis | utilisable | `oui` | 2144 | 68 % | 3 % | 21 % | 2 % | 19 % | 76 % | 70 % |
| 315555801 | Sauvegrain | utilisable | `oui` | 2128 | 69 % | 9 % | 14 % | 3 % | 12 % | 84 % | 36 % |
| 315555701 | Ferdinand de Lesseps | utilisable | `oui` | 1123 | 70 % | 2 % | 17 % | 3 % | 28 % | 64 % | 42 % |
| 315555901 | Fleurance | utilisable | `oui` | 3117 | 71 % | 8 % | 11 % | 5 % | 12 % | 89 % | 45 % |
| 315555502 | Saint-Simon Est | utilisable | `oui` | 3024 | 72 % | 9 % | 11 % | 3 % | 10 % | 88 % | 49 % |
| 315553802 | Lalande Nord | utilisable | `oui` | 6598 | 72 % | 3 % | 19 % | 2 % | 13 % | 91 % | 52 % |
| 315555503 | Saint-Simon Ouest | utilisable | `oui` | 2972 | 74 % | 6 % | 12 % | 3 % | 10 % | 92 % | 24 % |
| 315554702 | Latécoère | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315553701 | Fondeyre | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315554101 | Gramont | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315554701 | Marcaissonne | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315555902 | Aérospatiale | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315553601 | Ginestous | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 315555001 | Zones d'Activités Sud | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Toulouse)

Actifs qui habitent l'ensemble de Toulouse, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Toulouse (31555) | 77 % | 40 % | 14 % | 30 % | 9 % | 52995 | utilisable | `oui` |
| Blagnac (31069) | 4 % | 59 % | 14 % | 24 % | 1 % | 2782 | utilisable | `oui` |
| Colomiers (31149) | 2 % | 70 % | 7 % | 19 % | 1 % | 1559 | utilisable | `oui` |
| Labège (31254) | 2 % | 67 % | 10 % | 19 % | 0,2 % | 1335 | utilisable | `oui` |
| Balma (31044) | 2 % | 60 % | 8 % | 29 % | 1 % | 1079 | utilisable | `oui` |
| Ramonville-Saint-Agne (31446) | 1 % | 57 % | 13 % | 28 % | 0,4 % | 505 | utilisable | `oui` |
| Portet-sur-Garonne (31433) | 1 % | 82 % | 2 % | 15 % | 0,4 % | 408 | utilisable | `oui` |
| L'Union (31561) | 1 % | 78 % | 4 % | 16 % | 1 % | 361 | utilisable | `oui` |
| Cugnaux (31157) | 0,4 % | 76 % | 6 % | 14 % | 1 % | 246 | utilisable | `oui` |
| Muret (31395) | 0,4 % | 88 % | 1 % | 11 % | 0,4 % | 305 | utilisable | `oui` |
| Quint-Fonsegrives (31445) | 0,4 % | 71 % | 7 % | 19 % | 1 % | 260 | utilisable | `oui` |
| Tournefeuille (31557) | 0,4 % | 75 % | 6 % | 15 % | 0,4 % | 273 | utilisable | `oui` |
| Montauban (82121) | 0,4 % | 74 % | 1 % | 24 % | 0 % | 266 | utilisable | `oui` |
| Castanet-Tolosan (31113) | 0,3 % | 62 % | 11 % | 23 % | 1 % | 195 | utilisable | `oui` |
| Cornebarrieu (31150) | 0,3 % | 80 % | 2 % | 14 % | 0,2 % | 205 | utilisable | `oui` |
| Saint-Jean (31488) | 0,3 % | 82 % | 5 % | 10 % | 0 % | 224 | utilisable | `oui` |
| Saint-Orens-de-Gameville (31506) | 0,3 % | 69 % | 4 % | 23 % | 1 % | 251 | utilisable | `oui` |
| Aucamville (31022) | 0,2 % | 67 % | 6 % | 23 % | 2 % | 139 | fragile | `ordre de grandeur` |
| Auzeville-Tolosane (31035) | 0,2 % | 53 % | 16 % | 27 % | 1 % | 130 | fragile | `ordre de grandeur` |
| Bruguières (31091) | 0,2 % | 92 % | 1 % | 5 % | 0 % | 105 | fragile | `ordre de grandeur` |
| Castelnau-d'Estrétefonds (31118) | 0,2 % | 95 % | 0 % | 4 % | 0 % | 106 | fragile | `ordre de grandeur` |
| Fenouillet (31182) | 0,2 % | 75 % | 3 % | 19 % | 1 % | 154 | utilisable | `oui` |
| Flourens (31184) | 0,2 % | 76 % | 2 % | 16 % | 0 % | 121 | fragile | `ordre de grandeur` |
| Plaisance-du-Touch (31424) | 0,2 % | 81 % | 1 % | 14 % | 0,4 % | 173 | utilisable | `oui` |
| Saint-Alban (31467) | 0,2 % | 88 % | 2 % | 7 % | 0 % | 119 | fragile | `ordre de grandeur` |
| Albi (81004) | 0,2 % | 67 % | 1 % | 29 % | 2 % | 95 | fragile | `ordre de grandeur` |
| Lavaur (81140) | 0,2 % | 91 % | 0,3 % | 9 % | 0 % | 118 | fragile | `ordre de grandeur` |
| Pamiers (09225) | 0,1 % | 73 % | 0 % | 24 % | 3 % | 62 | fragile | `ordre de grandeur` |
| Carcassonne (11069) | 0,1 % | 66 % | 1 % | 28 % | 3 % | 52 | fragile | `ordre de grandeur` |
| Auterive (31033) | 0,1 % | 87 % | 0 % | 12 % | 1 % | 56 | fragile | `ordre de grandeur` |
| Beauzelle (31056) | 0,1 % | 70 % | 3 % | 23 % | 0 % | 74 | fragile | `ordre de grandeur` |
| Escalquens (31169) | 0,1 % | 81 % | 6 % | 13 % | 0 % | 90 | fragile | `ordre de grandeur` |
| Grenade (31232) | 0,1 % | 94 % | 0 % | 4 % | 2 % | 56 | fragile | `ordre de grandeur` |
| Launaguet (31282) | 0,1 % | 83 % | 2 % | 12 % | 3 % | 97 | fragile | `ordre de grandeur` |
| Lespinasse (31293) | 0,1 % | 91 % | 0 % | 7 % | 0 % | 65 | fragile | `ordre de grandeur` |
| Montrabé (31389) | 0,1 % | 76 % | 6 % | 16 % | 1 % | 96 | fragile | `ordre de grandeur` |
| Roques (31458) | 0,1 % | 79 % | 2 % | 15 % | 0 % | 90 | fragile | `ordre de grandeur` |
| Rouffiac-Tolosan (31462) | 0,1 % | 73 % | 9 % | 8 % | 5 % | 51 | fragile | `ordre de grandeur` |
| Sainte-Foy-d'Aigrefeuille (31480) | 0,1 % | 87 % | 1 % | 3 % | 2 % | 42 | fragile | `ordre de grandeur` |
| Saint-Jory (31490) | 0,1 % | 82 % | 1 % | 13 % | 0 % | 86 | fragile | `ordre de grandeur` |
| Seysses (31547) | 0,1 % | 86 % | 4 % | 10 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Villefranche-de-Lauragais (31582) | 0,1 % | 79 % | 0 % | 21 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Villeneuve-lès-Bouloc (31587) | 0,1 % | 91 % | 0 % | 7 % | 0 % | 49 | fragile | `ordre de grandeur` |
| Villeneuve-Tolosane (31588) | 0,1 % | 72 % | 0 % | 26 % | 2 % | 78 | fragile | `ordre de grandeur` |
| Auch (32013) | 0,1 % | 84 % | 0 % | 10 % | 3 % | 45 | fragile | `ordre de grandeur` |
| L'Isle-Jourdain (32160) | 0,1 % | 82 % | 0 % | 18 % | 0 % | 57 | fragile | `ordre de grandeur` |
| Bordeaux (33063) | 0,1 % | 56 % | 3 % | 41 % | 0 % | 43 | fragile | `ordre de grandeur` |
| Castres (81065) | 0,1 % | 77 % | 0 % | 22 % | 0 % | 72 | fragile | `ordre de grandeur` |
| 99999 (99999) | 0,1 % | 44 % | 5 % | 27 % | 4 % | 73 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes

Indisponible : groupe de 5 communes, sous le minimum de 10 : repère indisponible, critères non élargis. Ne pas écrire de comparaison.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Toulouse. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Toulouse | Lignes (vers Toulouse) | Statut (vers Toulouse) | Usage (vers Toulouse) |
|---|---:|---:|---:|---:|---:|---|---|
| Colomiers (31149) | 76 % | 5 % | 9 % | 77 % | 2047 | utilisable | `oui` |
| Tournefeuille (31557) | 75 % | 9 % | 8 % | 75 % | 2074 | utilisable | `oui` |
| Blagnac (31069) | 65 % | 9 % | 14 % | 66 % | 1485 | utilisable | `oui` |
| Muret (31395) | 78 % | 3 % | 9 % | 79 % | 949 | utilisable | `oui` |
| Cugnaux (31157) | 78 % | 5 % | 9 % | 79 % | 1377 | utilisable | `oui` |
| Plaisance-du-Touch (31424) | 84 % | 4 % | 5 % | 85 % | 1220 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Toulouse (31555) | 95 % | 85 % | 83 % | 75 % | 75 % |
| Colomiers (31149) | 64 % | 44 % | 56 % | 33 % | 98 % |
| Tournefeuille (31557) | 62 % | 45 % | 39 % | 24 % | 36 % |
| Blagnac (31069) | 85 % | 68 % | 55 % | 38 % | 1 % |
| Muret (31395) | 61 % | 59 % | 48 % | 36 % | 73 % |
| Cugnaux (31157) | 74 % | 48 % | 47 % | 30 % | 0,1 % |
| Plaisance-du-Touch (31424) | 44 % | 31 % | 34 % | 23 % | 0 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,70 €/L | environ 80 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,70 €/L | environ 250 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,70 €/L | environ 590 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,50 €/L | environ 60 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,50 €/L | environ 180 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,50 €/L | environ 420 € |

## 8. Faits absents : ne pas les écrire, ne pas les reconstituer

- Rang ou comparaison avec d'autres communes françaises (vélo, voiture, « taille comparable ») : groupe de 5 communes, sous le minimum de 10 : repère indisponible, critères non élargis.
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
| Carte de la part de la voiture par secteur (IRIS) | réalisable avec classes à revoir | secteurs (tableau), iris.voiture.min/max | aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable automatiquement | mobpro.voiture_selon_destination.* (groupes utilisables seulement) | aucun : la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Toulouse et Colomiers (31149), Tournefeuille (31557), Blagnac (31069), Muret (31395), Cugnaux (31157) et Plaisance-du-Touch (31424) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Toulon (83137)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/83137/fiche/fiche.json` (générée le 2026-10-15T16:03:38Z, jour de référence 2026-10-13, sha256 `ccdaf6d27511f995`). Dossier généré le 2026-10-15T16:18:26Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Toulon (83137), département 83, intercommunalité Métropole Toulon-Provence-Méditerranée.
- **Groupe de communes nommé** : La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00757 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 5 % [IC 95 % : 5 % à 6 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 5 % [IC 95 % : 4 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 62 % [IC 95 % : 61 % à 62 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 16 % [IC 95 % : 15 % à 16 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon, y compris ceux qui ne se déplacent pas | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Toulon même | 67 % [IC 95 % : 66 % à 68 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon | commune de résidence et de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Toulon | 54 % [IC 95 % : 53 % à 55 %] | actifs occupés de 15 ans ou plus résidant à Toulon qui travaillent à Toulon | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | 80 % [IC 95 % : 79 % à 82 %] | actifs occupés de 15 ans ou plus résidant à Toulon qui travaillent dans l'une de ces communes : La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | commune de travail : La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Toulon et hors de La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | 77 % [IC 95 % : 76 % à 79 %] | actifs occupés de 15 ans ou plus résidant à Toulon qui travaillent hors de Toulon et hors de La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | commune de travail : toute commune autre que Toulon, La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) moins travail à Toulon | +26 points | deux groupes distincts (voir les deux faits) | commune de travail : La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 12 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 35 % [IC 95 % : 34 % à 35 %] | tous les actifs occupés de 15 ans ou plus résidant à Toulon | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 32 % [IC 95 % : 31 % à 33 %] | actifs occupés de 15 ans ou plus résidant à Toulon dont le ménage a au moins une voiture | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 67 % [IC 95 % : 66 % à 68 %] | actifs occupés de 15 ans ou plus résidant à Toulon, propriétaires de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 6 % [IC 95 % : 6 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Toulon, propriétaires de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 4 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Toulon, propriétaires de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 48 % [IC 95 % : 46 % à 49 %] | actifs occupés de 15 ans ou plus résidant à Toulon, propriétaires de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 58 % [IC 95 % : 57 % à 60 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires du privé de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 4 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires du privé de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 19 % [IC 95 % : 18 % à 20 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires du privé de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 23 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires du privé de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 58 % [IC 95 % : 55 % à 60 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires HLM de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires HLM de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 15 % [IC 95 % : 13 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires HLM de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 24 % [IC 95 % : 22 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Toulon, locataires HLM de leur logement | commune de résidence : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Toulon | environ 83 000 | — | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulon, de ceux qui habitent Toulon | 56 % | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulon et habitent Toulon | 54 % [IC 95 % : 53 % à 55 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent Toulon | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulon et habitent Toulon | 16 % [IC 95 % : 15 % à 16 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent Toulon | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulon, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00757 (liste des communes non exposée par la fiche) | 34 % | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulon et habitent une autre commune de l'unité urbaine INSEE 00757 (liste des communes non exposée par la fiche) | 79 % [IC 95 % : 78 % à 80 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00757 (liste des communes non exposée par la fiche) | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulon et habitent une autre commune de l'unité urbaine INSEE 00757 (liste des communes non exposée par la fiche) | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00757 (liste des communes non exposée par la fiche) | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Toulon, de ceux qui habitent hors de l'unité urbaine INSEE 00757 | 10 % | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Toulon et habitent hors de l'unité urbaine INSEE 00757 | 79 % [IC 95 % : 76 % à 81 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00757 | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Toulon et habitent hors de l'unité urbaine INSEE 00757 | 15 % [IC 95 % : 13 % à 17 %] | actifs occupés qui travaillent à Toulon, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00757 | commune de travail : Toulon (83137) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Saint-Louis (IRIS 831370502) | 25 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Toulon (83137), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Valbertrand (IRIS 831370207) | 88 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Toulon (83137), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +63 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Toulon (83137), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 26 % | toutes les résidences principales de Toulon | commune : Toulon (83137) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 19 % | toutes les résidences principales de Toulon | commune : Toulon (83137) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 44 % | toutes les résidences principales de Toulon | commune : Toulon (83137) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.83137.commerce_alim_500m` | Part des adresses de Toulon qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 95 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.grande_surface_500m` | Part des adresses de Toulon qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 66 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.pharmacie_500m` | Part des adresses de Toulon qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 89 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.medecin_generaliste_500m` | Part des adresses de Toulon qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.ecole_elementaire_500m` | Part des adresses de Toulon qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 89 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.college_1km` | Part des adresses de Toulon qui ont un collège à moins de 1 km (à vol d'oiseau) | 86 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.gare_2km` | Part des adresses de Toulon qui ont une gare à moins de 2 km (à vol d'oiseau) | 75 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.panier_quotidien_500m` | Part des adresses de Toulon qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 82 % | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.83137.bus_8h_7_9h` | Part des adresses de Toulon qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.83137.aucun_bus_7_9h` | Part des adresses de Toulon sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.83137.bus_4h_20_22h` | Part des adresses de Toulon qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Toulon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Toulon (83137) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Mistral » (https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,31 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,71 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,15 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,66 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,50 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Toulon (centre communal de geo.api.gouv.fr : [5.9334, 43.1364]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/83137/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Métropole Toulon-Provence-Méditerranée s'appelle « RESEAU MISTRAL » ; son autorité organisatrice est Métropole Toulon-Provence-Méditerranée. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Mistral » : https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee ; nom confirmé par : offre de transport.data.gouv.fr confirmée par l'intitulé ou l'agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-14 | intercommunalité Métropole Toulon-Provence-Méditerranée ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau RESEAU MISTRAL est https://www.reseaumistral.com/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/reseau-de-transport-urbain-de-la-metropole-toulon-provence-mediterranee ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau RESEAU MISTRAL | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_moins_3_ans` | Les enfants de moins de 3 ans circulent gratuitement sur les lignes du réseau. La page présente par ailleurs des titres payants, par exemple le ticket « 1 voyage terrestre » à 1,40 €. Le réseau n'est donc pas gratuit dans son ensemble. | https://www.reseaumistral.com/titres-tarifs/titres-et-tarifs (extrait vérifié le 2026-10-15 : « Les enfants - 3 ans circulent gratuitement sur les lignes du réseau. ») | 2026-10-15 | non précisée | réseau RESEAU MISTRAL ; Enfants de moins de 3 ans, lignes du réseau ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarification.gratuite_handicap` | L'abonnement « 1 an H » est indiqué gratuit pour les personnes handicapées résidant sur la Métropole. | https://www.reseaumistral.com/titres-tarifs/titres-et-tarifs (extrait vérifié le 2026-10-15 : « Personne handicapée (résidant sur la Métropole) ») | 2026-10-15 | non précisée | réseau RESEAU MISTRAL ; Personnes handicapées résidant sur la Métropole TPM, abonnement « 1 an H » ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.horaires.validite_ligne1` | La page de la ligne de bus 1 donne deux périodes de validité des horaires : hiver du 01 septembre 2025 au 05 juillet 2026, et été du 06 juillet au 30 août 2026. À la date du jour (2026-10-15), ces deux périodes sont terminées. Les horaires en vigueur sont à vérifier. | https://www.reseaumistral.com/se-deplacer/lignes/ligne-bus-1 (extrait vérifié le 2026-10-15 : « Du 01 septembre 2025 au 05 juillet 2026 ») | 2026-10-15 | Hiver : du 01 septembre 2025 au 05 juillet 2026. Été : du 06 juillet au 30 août 2026 | réseau RESEAU MISTRAL ; Ligne de bus 1 uniquement ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.lignes_horaires` | La page « Lignes et horaires » permet de rechercher les horaires de l'ensemble des lignes du réseau. Les détails de chaque ligne figurent sur sa page dédiée. | https://www.reseaumistral.com/se-deplacer/lignes (extrait vérifié le 2026-10-15 : « Rechercher l'ensemble des horaires des lignes traversant le réseau ») | 2026-10-15 | non précisée | réseau RESEAU MISTRAL ; Ensemble des lignes du réseau ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Tarification : gratuité totale ou par lignes | `introuvable` | https://www.reseaumistral.com/titres-tarifs/titres-et-tarifs 2026-10-15 | Aucune gratuité générale ni par ligne n'apparaît sur la page tarifs. La page signale seulement des catégories gratuites et un astérisque non expliqué pour les anciens combattants. La conclusion « non gratuit » vaut pour la page consultée et doit être confirmée. |
| Jours de circulation (samedi, dimanche, jours fériés) | `introuvable` | https://www.reseaumistral.com/se-deplacer/lignes/ligne-bus-1 2026-10-15 | Ni la page « Lignes et horaires » ni la page de la ligne 1 ne donnent ces jours. Les fiches horaires PDF sont liées mais n'ont pas été lues : non vérifié. |
| Calcul d'itinéraire | `non vérifié` | https://www.reseaumistral.com/se-deplacer/calcul-ditineraire 2026-10-15 | La page existe, avec le titre « Calcul d'itinéraire ». Le contenu lu ne montre aucun formulaire, donc son fonctionnement n'est pas confirmé. |
| Temps réel et prochains passages | `non vérifié` | https://www.reseaumistral.com/se-deplacer/prochains-passages 2026-10-15 | L'accueil renvoie vers cette page et mentionne des « Horaires en temps réel » dans l'application. Je n'ai pas ouvert la page, et je n'ai pas d'extrait vérifié. |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 831370502 | Saint-Louis | utilisable | `oui` | 526 | 25 % | 3 % | 26 % | 37 % | 64 % | 12 % | 100 % |
| 831370506 | Cathédrale | utilisable | `oui` | 1001 | 26 % | 7 % | 31 % | 31 % | 63 % | 2 % | 100 % |
| 831370504 | Haute Ville-La Gare | utilisable | `oui` | 920 | 28 % | 7 % | 17 % | 44 % | 51 % | 13 % | 99 % |
| 831370505 | Haute Ville-Place Liberté | utilisable | `oui` | 986 | 28 % | 3 % | 41 % | 23 % | 55 % | 10 % | 100 % |
| 831370607 | Besagne | utilisable | `oui` | 819 | 29 % | 5 % | 21 % | 36 % | 67 % | 3 % | 100 % |
| 831370501 | Le Port | utilisable | `oui` | 774 | 29 % | 6 % | 19 % | 43 % | 59 % | 11 % | 100 % |
| 831370609 | Champ de Mars I | utilisable | `oui` | 1014 | 41 % | 5 % | 24 % | 20 % | 47 % | 24 % | 100 % |
| 831370604 | Le Mourillon II | utilisable | `oui` | 996 | 41 % | 16 % | 16 % | 19 % | 25 % | 40 % | 100 % |
| 831370613 | Port Marchand | utilisable | `oui` | 564 | 44 % | 9 % | 25 % | 16 % | 35 % | 16 % | 100 % |
| 831370503 | Place d'Armes-Arsenal | utilisable | `oui` | 1062 | 44 % | 11 % | 22 % | 18 % | 42 % | 35 % | 83 % |
| 831370310 | Saint-Roch II | utilisable | `oui` | 884 | 45 % | 6 % | 22 % | 20 % | 32 % | 39 % | 100 % |
| 831370101 | Bon Rencontre-Arsenal | utilisable | `oui` | 1478 | 46 % | 3 % | 14 % | 12 % | 36 % | 25 % | 99,6 % |
| 831370608 | Dutasta-Mayol | utilisable | `oui` | 674 | 48 % | 4 % | 20 % | 23 % | 43 % | 30 % | 100 % |
| 831370602 | Le Mourillon IV | utilisable | `oui` | 1099 | 48 % | 6 % | 23 % | 17 % | 37 % | 14 % | 100 % |
| 831370611 | Champ de Mars II | utilisable | `oui` | 955 | 48 % | 6 % | 27 % | 15 % | 42 % | 27 % | 100 % |
| 831370606 | Port Marchand-Port de Commerce | utilisable | `oui` | 610 | 49 % | 6 % | 15 % | 24 % | 32 % | 24 % | 85 % |
| 831370104 | Pont du Las I | utilisable | `oui` | 1881 | 51 % | 3 % | 24 % | 15 % | 42 % | 28 % | 100 % |
| 831370603 | Le Mourillon III | utilisable | `oui` | 1054 | 52 % | 7 % | 10 % | 21 % | 35 % | 21 % | 100 % |
| 831370311 | Saint-Roch I | utilisable | `oui` | 610 | 52 % | 5 % | 23 % | 11 % | 45 % | 25 % | 100 % |
| 831370612 | La Rode | utilisable | `oui` | 767 | 53 % | 4 % | 16 % | 22 % | 32 % | 52 % | 100 % |
| 831370402 | Sainte-Anne | utilisable | `oui` | 1118 | 53 % | 8 % | 14 % | 16 % | 25 % | 43 % | 86 % |
| 831370610 | Sainte-Catherine | utilisable | `oui` | 1139 | 54 % | 7 % | 20 % | 13 % | 28 % | 36 % | 100 % |
| 831370802 | Aguillon | utilisable | `oui` | 1766 | 55 % | 8 % | 14 % | 16 % | 23 % | 44 % | 100 % |
| 831370201 | Pont Neuf | utilisable | `oui` | 785 | 57 % | 9 % | 19 % | 10 % | 28 % | 57 % | 99 % |
| 831370803 | Saint-Jean du Var II | utilisable | `oui` | 1422 | 57 % | 5 % | 18 % | 13 % | 30 % | 62 % | 100 % |
| 831370601 | Lamalgue | utilisable | `oui` | 1105 | 57 % | 9 % | 16 % | 11 % | 16 % | 47 % | 64 % |
| 831370804 | Saint-Jean du Var I | utilisable | `oui` | 902 | 58 % | 6 % | 22 % | 10 % | 32 % | 28 % | 100 % |
| 831370404 | Valbourdin | utilisable | `oui` | 656 | 59 % | 7 % | 16 % | 12 % | 25 % | 46 % | 100 % |
| 831370204 | La Beaucaire | utilisable | `oui` | 637 | 60 % | 1 % | 29 % | 2 % | 39 % | 1 % | 88 % |
| 831370103 | Le Temple | utilisable | `oui` | 1064 | 60 % | 6 % | 17 % | 8 % | 40 % | 25 % | 100 % |
| 831370605 | Le Mourillon I | utilisable | `oui` | 750 | 60 % | 13 % | 12 % | 7 % | 24 % | 38 % | 99,5 % |
| 831370702 | Siblas-La Loubière | utilisable | `oui` | 1120 | 60 % | 3 % | 9 % | 19 % | 20 % | 48 % | 100 % |
| 831370102 | Pont de Bois | utilisable | `oui` | 890 | 62 % | 5 % | 19 % | 7 % | 30 % | 42 % | 100 % |
| 831370805 | Saint-Jean du Var III | utilisable | `oui` | 1252 | 62 % | 3 % | 21 % | 8 % | 28 % | 41 % | 99,7 % |
| 831370312 | Pont du Las II | utilisable | `oui` | 767 | 62 % | 3 % | 13 % | 16 % | 27 % | 46 % | 100 % |
| 831370904 | Brunet | utilisable | `oui` | 1169 | 63 % | 4 % | 20 % | 5 % | 27 % | 54 % | 98 % |
| 831370403 | Claret | utilisable | `oui` | 871 | 64 % | 5 % | 14 % | 13 % | 22 % | 43 % | 89 % |
| 831370301 | Rodeillac | utilisable | `oui` | 457 | 67 % | 10 % | 14 % | 4 % | 23 % | 36 % | 100 % |
| 831370208 | Les Routes I | utilisable | `oui` | 950 | 67 % | 8 % | 11 % | 7 % | 19 % | 53 % | 100 % |
| 831370405 | Faron-Fort Blanc | utilisable | `oui` | 878 | 67 % | 6 % | 12 % | 9 % | 9 % | 63 % | 19 % |
| 831370202 | Lagoubran | utilisable | `oui` | 951 | 68 % | 2 % | 24 % | 2 % | 20 % | 37 % | 48 % |
| 831370703 | Siblas | utilisable | `oui` | 778 | 69 % | 6 % | 8 % | 10 % | 11 % | 69 % | 82 % |
| 831370401 | Les Lices | utilisable | `oui` | 795 | 69 % | 3 % | 9 % | 13 % | 17 % | 31 % | 84 % |
| 831370701 | Vert Coteau | utilisable | `oui` | 1002 | 70 % | 4 % | 14 % | 4 % | 10 % | 59 % | 99 % |
| 831370302 | Barbes | utilisable | `oui` | 961 | 70 % | 3 % | 17 % | 2 % | 22 % | 34 % | 100 % |
| 831370902 | Sainte-Musse I | utilisable | `oui` | 827 | 71 % | 2 % | 19 % | 6 % | 10 % | 52 % | 17 % |
| 831370801 | Aguillon-Petit Bois | utilisable | `oui` | 1329 | 71 % | 10 % | 5 % | 5 % | 8 % | 77 % | 44 % |
| 831370809 | La Barre | utilisable | `oui` | 1066 | 71 % | 9 % | 9 % | 4 % | 13 % | 48 % | 100 % |
| 831370810 | La Barre-Les Ameniers | utilisable | `oui` | 1131 | 72 % | 8 % | 8 % | 2 % | 9 % | 71 % | 36 % |
| 831370209 | Les Arènes | utilisable | `oui` | 1532 | 72 % | 3 % | 9 % | 4 % | 16 % | 57 % | 71 % |
| 831370303 | Le Jonquet | utilisable | `oui` | 822 | 72 % | 3 % | 16 % | 3 % | 24 % | 42 % | 71 % |
| 831370907 | Sainte-Musse III | utilisable | `oui` | 348 | 72 % | 3 % | 18 % | 3 % | 23 % | 52 % | 89 % |
| 831370903 | Brunet-Font Pré | utilisable | `oui` | 1650 | 72 % | 3 % | 14 % | 6 % | 22 % | 62 % | 80 % |
| 831370806 | La Palasse-Collet de Gipon | utilisable | `oui` | 1098 | 73 % | 5 % | 14 % | 6 % | 20 % | 47 % | 40 % |
| 831370206 | Monserrat-Bonnes Herbes | utilisable | `oui` | 1234 | 73 % | 3 % | 16 % | 1 % | 13 % | 63 % | 54 % |
| 831370205 | La Floranne | utilisable | `oui` | 1382 | 73 % | 4 % | 14 % | 2 % | 14 % | 57 % | 84 % |
| 831370808 | La Serinette-Le Cap Brun | utilisable | `oui` | 1069 | 74 % | 7 % | 9 % | 4 % | 8 % | 79 % | 75 % |
| 831370305 | L'Oratoire | utilisable | `oui` | 1159 | 75 % | 5 % | 9 % | 2 % | 5 % | 87 % | 28 % |
| 831370807 | Pont de Suve | utilisable | `oui` | 1009 | 75 % | 2 % | 14 % | 2 % | 12 % | 72 % | 68 % |
| 831370905 | Élisa-La Pivotte | utilisable | `oui` | 1330 | 76 % | 2 % | 10 % | 6 % | 12 % | 63 % | 77 % |
| 831370308 | Dardennes-Ubac | utilisable | `oui` | 898 | 78 % | 2 % | 8 % | 0,3 % | 6 % | 81 % | 1 % |
| 831370901 | Sainte-Musse II | utilisable | `oui` | 955 | 78 % | 3 % | 9 % | 3 % | 10 % | 82 % | 77 % |
| 831370307 | Les Fours à Chaux | utilisable | `oui` | 958 | 78 % | 2 % | 10 % | 1 % | 11 % | 58 % | 60 % |
| 831370306 | Les Pomets-Saint Pierre-Les Moulins | utilisable | `oui` | 1347 | 79 % | 2 % | 9 % | 1 % | 9 % | 75 % | 10 % |
| 831370704 | Darboussède-La Bosquette | utilisable | `oui` | 1180 | 79 % | 4 % | 6 % | 2 % | 4 % | 76 % | 10 % |
| 831370309 | Faron-Fort Rouge-Favières | utilisable | `oui` | 1221 | 79 % | 3 % | 9 % | 2 % | 12 % | 60 % | 65 % |
| 831370203 | L'Escaillon | utilisable | `oui` | 669 | 80 % | 3 % | 11 % | 3 % | 21 % | 45 % | 62 % |
| 831370304 | Les Routes II | utilisable | `oui` | 826 | 80 % | 4 % | 8 % | 1 % | 16 % | 50 % | 86 % |
| 831370906 | Beaulieu | utilisable | `oui` | 735 | 81 % | 3 % | 9 % | 3 % | 15 % | 36 % | 78 % |
| 831370207 | Valbertrand | utilisable | `oui` | 918 | 88 % | 1 % | 4 % | 1 % | 9 % | 68 % | 80 % |

## 4. Mode selon la commune de travail (actifs résidant à Toulon)

Actifs qui habitent l'ensemble de Toulon, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Toulon (83137) | 67 % | 54 % | 7 % | 16 % | 15 % | 15072 | utilisable | `oui` |
| La Seyne-sur-Mer (83126) | 5 % | 82 % | 2 % | 12 % | 1 % | 973 | utilisable | `oui` |
| La Garde (83062) | 4 % | 78 % | 1 % | 16 % | 1 % | 865 | utilisable | `oui` |
| La Valette-du-Var (83144) | 4 % | 78 % | 1 % | 16 % | 1 % | 876 | utilisable | `oui` |
| Ollioules (83090) | 3 % | 77 % | 3 % | 12 % | 2 % | 730 | utilisable | `oui` |
| Hyères (83069) | 3 % | 82 % | 0,4 % | 12 % | 1 % | 616 | utilisable | `oui` |
| La Farlède (83054) | 2 % | 79 % | 1 % | 10 % | 1 % | 375 | utilisable | `oui` |
| Six-Fours-les-Plages (83129) | 2 % | 83 % | 2 % | 8 % | 0,3 % | 388 | utilisable | `oui` |
| Le Pradet (83098) | 1 % | 73 % | 2 % | 19 % | 3 % | 127 | fragile | `ordre de grandeur` |
| Sanary-sur-Mer (83123) | 1 % | 87 % | 1 % | 8 % | 0 % | 136 | fragile | `ordre de grandeur` |
| Saint-Mandrier-sur-Mer (83153) | 1 % | 68 % | 5 % | 24 % | 2 % | 127 | fragile | `ordre de grandeur` |
| La Crau (83047) | 1 % | 94 % | 0 % | 2 % | 1 % | 116 | fragile | `ordre de grandeur` |
| Cuers (83049) | 1 % | 91 % | 0 % | 7 % | 0 % | 114 | fragile | `ordre de grandeur` |
| La Ciotat (13028) | 0,4 % | 86 % | 0 % | 14 % | 0 % | 82 | fragile | `ordre de grandeur` |
| Bandol (83009) | 0,4 % | 77 % | 0 % | 17 % | 0 % | 79 | fragile | `ordre de grandeur` |
| Solliès-Pont (83130) | 0,4 % | 90 % | 0,4 % | 3 % | 1 % | 84 | fragile | `ordre de grandeur` |
| Aubagne (13005) | 0,3 % | 80 % | 0 % | 19 % | 2 % | 67 | fragile | `ordre de grandeur` |
| Nice (06088) | 0,2 % | 66 % | 0 % | 26 % | 8 % | 43 | fragile | `ordre de grandeur` |
| Aix-en-Provence (13001) | 0,2 % | 75 % | 0 % | 19 % | 3 % | 54 | fragile | `ordre de grandeur` |
| Marseille 1er Arrondissement (13201) | 0,2 % | 25 % | 0 % | 73 % | 2 % | 46 | fragile | `ordre de grandeur` |
| Marseille 9e Arrondissement (13209) | 0,2 % | 74 % | 0 % | 22 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Le Beausset (83016) | 0,2 % | 86 % | 0 % | 11 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Brignoles (83023) | 0,2 % | 86 % | 0 % | 9 % | 0 % | 49 | fragile | `ordre de grandeur` |
| Carqueiranne (83034) | 0,2 % | 85 % | 4 % | 9 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Fréjus (83061) | 0,2 % | 56 % | 0 % | 37 % | 7 % | 40 | fragile | `ordre de grandeur` |
| Signes (83127) | 0,2 % | 90 % | 0 % | 4 % | 5 % | 51 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Toulon (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 34 777 à 139 107), avec au moins 150 lignes d'échantillon ; Toulon exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Toulon qui vont travailler principalement en voiture (valeur comparée) | 62 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 30 communes du groupe (chaque commune compte une fois) | 56 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Toulon moins la médiane du groupe (valeurs arrondies) | +6 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 30 | `oui` |

Communes du groupe (30, pour la vérification ; ne pas les citer) : Aix-en-Provence, Amiens, Angers, Annecy, Besançon, Bordeaux, Boulogne-Billancourt, Brest, Caen, Clermont-Ferrand, Dijon, Grenoble, Le Havre, Le Mans, Lille, Limoges, Metz, Montpellier, Mulhouse, Nancy, Nîmes, Orléans, Perpignan, Reims, Rennes, Rouen, Saint-Étienne, Strasbourg, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Toulon. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Toulon | Lignes (vers Toulon) | Statut (vers Toulon) | Usage (vers Toulon) |
|---|---:|---:|---:|---:|---:|---|---|
| La Seyne-sur-Mer (83126) | 74 % | 4 % | 9 % | 70 % | 1707 | utilisable | `oui` |
| Hyères (83069) | 72 % | 4 % | 5 % | 80 % | 707 | utilisable | `oui` |
| La Ciotat (13028) | 76 % | 3 % | 7 % | 73 % | 110 | fragile | `ordre de grandeur` |
| Six-Fours-les-Plages (83129) | 80 % | 3 % | 5 % | 83 % | 793 | utilisable | `oui` |
| La Garde (83062) | 78 % | 4 % | 7 % | 78 % | 876 | utilisable | `oui` |
| La Valette-du-Var (83144) | 78 % | 2 % | 8 % | 78 % | 965 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Toulon (83137) | 95 % | 89 % | 89 % | 82 % | 75 % |
| La Seyne-sur-Mer (83126) | 87 % | 72 % | 60 % | 54 % | 40 % |
| Hyères (83069) | 77 % | 58 % | 60 % | 52 % | 58 % |
| Six-Fours-les-Plages (83129) | 81 % | 60 % | 38 % | 32 % | 21 % |
| La Garde (83062) | 76 % | 68 % | 56 % | 45 % | 98 % |
| La Valette-du-Var (83144) | 78 % | 60 % | 60 % | 48 % | 58 % |

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
| Carte de la part de la voiture par secteur (IRIS) | réalisable avec classes à revoir | secteurs (tableau), iris.voiture.min/max | aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable automatiquement | mobpro.voiture_selon_destination.* (groupes utilisables seulement) | aucun : la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Toulon et La Seyne-sur-Mer (83126), Hyères (83069), La Ciotat (13028), Six-Fours-les-Plages (83129), La Garde (83062) et La Valette-du-Var (83144) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Montpellier (34172)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/34172/fiche/fiche.json` (générée le 2026-10-15T15:57:43Z, jour de référence 2026-10-13, sha256 `9e2f1d1a7c9aaa51`). Dossier généré le 2026-10-15T16:16:12Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Montpellier (34172), département 34, intercommunalité Montpellier Méditerranée Métropole.
- **Groupe de communes nommé** : Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 34701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 4 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 13 % [IC 95 % : 12 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 3 % [IC 95 % : 3 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 48 % [IC 95 % : 47 % à 49 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 22 % [IC 95 % : 22 % à 23 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier, y compris ceux qui ne se déplacent pas | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Montpellier même | 75 % [IC 95 % : 75 % à 76 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier | commune de résidence et de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Montpellier | 40 % [IC 95 % : 39 % à 41 %] | actifs occupés de 15 ans ou plus résidant à Montpellier qui travaillent à Montpellier | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | 70 % [IC 95 % : 67 % à 72 %] | actifs occupés de 15 ans ou plus résidant à Montpellier qui travaillent dans l'une de ces communes : Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | commune de travail : Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Montpellier et hors de Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | 71 % [IC 95 % : 70 % à 73 %] | actifs occupés de 15 ans ou plus résidant à Montpellier qui travaillent hors de Montpellier et hors de Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | commune de travail : toute commune autre que Montpellier, Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) moins travail à Montpellier | +30 points | deux groupes distincts (voir les deux faits) | commune de travail : Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 18 % [IC 95 % : 17 % à 18 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 26 % [IC 95 % : 25 % à 27 %] | tous les actifs occupés de 15 ans ou plus résidant à Montpellier | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 44 % [IC 95 % : 43 % à 44 %] | actifs occupés de 15 ans ou plus résidant à Montpellier dont le ménage a au moins une voiture | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 51 % [IC 95 % : 50 % à 52 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, propriétaires de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 18 % [IC 95 % : 17 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, propriétaires de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 6 % [IC 95 % : 6 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, propriétaires de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 37 % [IC 95 % : 36 % à 39 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, propriétaires de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 44 % [IC 95 % : 43 % à 45 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires du privé de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 11 % [IC 95 % : 11 % à 12 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires du privé de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 27 % [IC 95 % : 26 % à 28 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires du privé de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 19 % [IC 95 % : 18 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires du privé de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 58 % [IC 95 % : 56 % à 60 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires HLM de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 5 % [IC 95 % : 4 % à 6 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires HLM de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 17 % [IC 95 % : 16 % à 18 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires HLM de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 24 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Montpellier, locataires HLM de leur logement | commune de résidence : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Montpellier | environ 177 000 | — | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Montpellier, de ceux qui habitent Montpellier | 52 % | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Montpellier et habitent Montpellier | 40 % [IC 95 % : 39 % à 41 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent Montpellier | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Montpellier et habitent Montpellier | 24 % [IC 95 % : 23 % à 24 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent Montpellier | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Montpellier, de ceux qui habitent une autre commune de l'unité urbaine INSEE 34701 (liste des communes non exposée par la fiche) | 18 % | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Montpellier et habitent une autre commune de l'unité urbaine INSEE 34701 (liste des communes non exposée par la fiche) | 77 % [IC 95 % : 76 % à 79 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 34701 (liste des communes non exposée par la fiche) | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Montpellier et habitent une autre commune de l'unité urbaine INSEE 34701 (liste des communes non exposée par la fiche) | 11 % [IC 95 % : 10 % à 12 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 34701 (liste des communes non exposée par la fiche) | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Montpellier, de ceux qui habitent hors de l'unité urbaine INSEE 34701 | 30 % | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Montpellier et habitent hors de l'unité urbaine INSEE 34701 | 86 % [IC 95 % : 86 % à 87 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 34701 | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Montpellier et habitent hors de l'unité urbaine INSEE 34701 | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés qui travaillent à Montpellier, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 34701 | commune de travail : Montpellier (34172) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Saint-Roch (IRIS 341722504) | 15 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Montpellier (34172), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Salaison (IRIS 341722101) | 72 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Montpellier (34172), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +57 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Montpellier (34172), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 32 % | toutes les résidences principales de Montpellier | commune : Montpellier (34172) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 15 % | toutes les résidences principales de Montpellier | commune : Montpellier (34172) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 58 % | toutes les résidences principales de Montpellier | commune : Montpellier (34172) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.34172.commerce_alim_500m` | Part des adresses de Montpellier qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 97 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.grande_surface_500m` | Part des adresses de Montpellier qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 51 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.pharmacie_500m` | Part des adresses de Montpellier qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.medecin_generaliste_500m` | Part des adresses de Montpellier qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 90 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.ecole_elementaire_500m` | Part des adresses de Montpellier qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.college_1km` | Part des adresses de Montpellier qui ont un collège à moins de 1 km (à vol d'oiseau) | 88 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.gare_2km` | Part des adresses de Montpellier qui ont une gare à moins de 2 km (à vol d'oiseau) | 44 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.panier_quotidien_500m` | Part des adresses de Montpellier qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 77 % | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.34172.bus_8h_7_9h` | Part des adresses de Montpellier qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.34172.aucun_bus_7_9h` | Part des adresses de Montpellier sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.34172.bus_4h_20_22h` | Part des adresses de Montpellier qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Montpellier, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Montpellier (34172) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TaM » (https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,36 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,59 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,77 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,17 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,66 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,51 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Montpellier (centre communal de geo.api.gouv.fr : [3.8742, 43.61]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/34172/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Montpellier Méditerranée Métropole s'appelle « TaM » ; son autorité organisatrice est Montpellier Méditerranée Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain TaM » : https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-15 | intercommunalité Montpellier Méditerranée Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau TaM est https://www.tam-voyages.com. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau TaM | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Tarification / gratuité | `introuvable` | https://www.tam-voyages.com/tarifs/ 2026-10-15 | Les pages essayées (accueil, /gratuite/, /tarifs/) ne renvoient que le titre « TaM Voyages ». Le contenu est probablement chargé en JavaScript. Aucun extrait n'a pu être copié, donc rien n'est enregistré. L'absence de gratuité n'est pas établie. |
| Jours de circulation et validité des horaires | `introuvable` | https://www.tam-voyages.com/horaires/ 2026-10-15 | Le résultat de lecture ne faisait que reprendre les termes de ma requête. Aucun contenu réel de la page n'a été vu, donc rien n'est enregistré. |
| Où vérifier un trajet (itinéraire, fiches horaires, temps réel) | `introuvable` | https://www.tam-voyages.com 2026-10-15 | Aucune page lue ne donnait de contenu vérifiable. Le site officiel est tam-voyages.com, mais je n'ai pas pu confirmer les pages précises de calcul d'itinéraire, de fiches horaires ou de temps réel. |
| tarification (gratuité, abonnements, exceptions) | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| calcul d'itinéraire ou fiches horaires officielles | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 341722504 | Saint-Roch | utilisable | `oui` | 1079 | 15 % | 15 % | 30 % | 31 % | 69 % | 10 % | 100 % |
| 341722502 | Ursulines | utilisable | `oui` | 1076 | 17 % | 15 % | 39 % | 24 % | 75 % | 6 % | 100 % |
| 341722503 | Préfecture | utilisable | `oui` | 1143 | 19 % | 14 % | 29 % | 27 % | 57 % | 14 % | 100 % |
| 341722001 | Pont de Sète | utilisable | `oui` | 1254 | 19 % | 11 % | 39 % | 19 % | 59 % | 23 % | 100 % |
| 341723001 | Comédie | utilisable | `oui` | 1975 | 21 % | 10 % | 33 % | 27 % | 57 % | 17 % | 99 % |
| 341722602 | Saint-Denis | utilisable | `oui` | 2508 | 23 % | 16 % | 30 % | 24 % | 49 % | 42 % | 99,8 % |
| 341722403 | Verdanson | utilisable | `oui` | 1599 | 24 % | 18 % | 26 % | 21 % | 52 % | 25 % | 99 % |
| 341722501 | Peyrou | utilisable | `oui` | 998 | 24 % | 22 % | 25 % | 20 % | 49 % | 22 % | 100 % |
| 341722003 | Saint-François | utilisable | `oui` | 1476 | 25 % | 16 % | 29 % | 20 % | 49 % | 30 % | 100 % |
| 341722601 | Gambetta | utilisable | `oui` | 1955 | 27 % | 16 % | 24 % | 27 % | 49 % | 34 % | 100 % |
| 341722902 | Avenue de Lodève | utilisable | `oui` | 1132 | 27 % | 19 % | 27 % | 18 % | 47 % | 33 % | 98 % |
| 341722002 | Méditerrannée | utilisable | `oui` | 1449 | 28 % | 20 % | 20 % | 22 % | 41 % | 40 % | 100 % |
| 341722302 | École Normale | utilisable | `oui` | 1673 | 29 % | 20 % | 24 % | 20 % | 31 % | 55 % | 88 % |
| 341720101 | École d'Architecture-Triolet | utilisable | `oui` | 1607 | 33 % | 16 % | 29 % | 16 % | 40 % | 34 % | 13 % |
| 341722802 | Chaptal | utilisable | `oui` | 1580 | 34 % | 22 % | 21 % | 17 % | 41 % | 34 % | 100 % |
| 341722901 | Assas | utilisable | `oui` | 881 | 34 % | 23 % | 16 % | 17 % | 23 % | 51 % | 100 % |
| 341720105 | Lapeyronie | utilisable | `oui` | 1252 | 35 % | 16 % | 23 % | 21 % | 26 % | 75 % | 1 % |
| 341720103 | Saint-Éloi | utilisable | `oui` | 996 | 36 % | 16 % | 30 % | 15 % | 36 % | 53 % | 83 % |
| 341722303 | Boutonnet | utilisable | `oui` | 700 | 37 % | 16 % | 26 % | 13 % | 30 % | 71 % | 100 % |
| 341722305 | Archives Départementales | utilisable | `oui` | 1123 | 38 % | 19 % | 23 % | 13 % | 42 % | 46 % | 100 % |
| 341722402 | Beaux-Arts | utilisable | `oui` | 1302 | 38 % | 26 % | 21 % | 10 % | 30 % | 60 % | 100 % |
| 341722701 | Nombre d'Or | utilisable | `oui` | 1013 | 39 % | 10 % | 27 % | 15 % | 46 % | 51 % | 98 % |
| 341722703 | Moulin de l'Évêque | utilisable | `oui` | 1078 | 41 % | 13 % | 24 % | 15 % | 28 % | 69 % | 98 % |
| 341721802 | Rives du Lez | utilisable | `oui` | 2511 | 41 % | 9 % | 31 % | 12 % | 38 % | 66 % | 98 % |
| 341722202 | Rimbaud | utilisable | `oui` | 753 | 41 % | 24 % | 16 % | 14 % | 28 % | 48 % | 100 % |
| 341722801 | La Guirlande | utilisable | `oui` | 1329 | 42 % | 17 % | 23 % | 11 % | 38 % | 48 % | 100 % |
| 341721601 | Pont Trinquat | utilisable | `oui` | 1238 | 42 % | 18 % | 20 % | 13 % | 27 % | 62 % | 100 % |
| 341721201 | Sabathé | utilisable | `oui` | 1480 | 42 % | 16 % | 23 % | 10 % | 33 % | 56 % | 90 % |
| 341720102 | Vert Bois | utilisable | `oui` | 1857 | 43 % | 10 % | 30 % | 14 % | 57 % | 47 % | 48 % |
| 341720803 | Astruc | utilisable | `oui` | 1257 | 43 % | 20 % | 16 % | 10 % | 31 % | 56 % | 97 % |
| 341722304 | Sainte-Odile | utilisable | `oui` | 998 | 43 % | 23 % | 13 % | 15 % | 33 % | 64 % | 100 % |
| 341722301 | Fac de Pharmacie | utilisable | `oui` | 1015 | 44 % | 18 % | 17 % | 12 % | 29 % | 51 % | 87 % |
| 341722401 | Nazareth | utilisable | `oui` | 1861 | 44 % | 18 % | 22 % | 9 % | 27 % | 84 % | 82 % |
| 341720204 | Justice | utilisable | `oui` | 1994 | 45 % | 18 % | 18 % | 10 % | 37 % | 56 % | 69 % |
| 341720801 | La Piscine | utilisable | `oui` | 1166 | 47 % | 17 % | 21 % | 5 % | 22 % | 68 % | 85 % |
| 341721202 | Tastavin | utilisable | `oui` | 746 | 48 % | 12 % | 26 % | 7 % | 29 % | 60 % | 100 % |
| 341721501 | Mion | utilisable | `oui` | 1481 | 49 % | 20 % | 16 % | 7 % | 21 % | 76 % | 89 % |
| 341721603 | La Rauze | utilisable | `oui` | 1198 | 50 % | 9 % | 26 % | 7 % | 27 % | 69 % | 27 % |
| 341721803 | La Lironde | utilisable | `oui` | 2218 | 50 % | 10 % | 24 % | 11 % | 35 % | 68 % | 94 % |
| 341721502 | Saint-Martin | utilisable | `oui` | 1783 | 50 % | 10 % | 29 % | 5 % | 30 % | 47 % | 81 % |
| 341721804 | Port Marianne | utilisable | `oui` | 5205 | 50 % | 11 % | 22 % | 9 % | 20 % | 85 % | n.d. |
| 341722704 | Place de l'Europe | utilisable | `oui` | 990 | 50 % | 8 % | 26 % | 12 % | 34 % | 72 % | 100 % |
| 341721602 | Aiguerelles | utilisable | `oui` | 1966 | 51 % | 15 % | 18 % | 7 % | 24 % | 80 % | 95 % |
| 341720106 | Occitanie | utilisable | `oui` | 1369 | 51 % | 8 % | 30 % | 8 % | 42 % | 42 % | 8 % |
| 341720602 | Celleneuve | utilisable | `oui` | 1343 | 51 % | 8 % | 34 % | 2 % | 33 % | 65 % | 96 % |
| 341720705 | Casseyrols | utilisable | `oui` | 1544 | 51 % | 15 % | 20 % | 6 % | 36 % | 61 % | 16 % |
| 341720603 | La Fontaine | utilisable | `oui` | 1103 | 52 % | 12 % | 20 % | 10 % | 27 % | 68 % | 99,6 % |
| 341721001 | La Colline | utilisable | `oui` | 1946 | 52 % | 13 % | 23 % | 4 % | 20 % | 66 % | 90 % |
| 341722201 | Les Aubes | utilisable | `oui` | 901 | 52 % | 22 % | 9 % | 9 % | 19 % | 67 % | 89 % |
| 341721002 | Notre-Dame de la Paix | utilisable | `oui` | 934 | 52 % | 24 % | 10 % | 8 % | 14 % | 63 % | 78 % |
| 341720704 | Soulas | utilisable | `oui` | 1176 | 53 % | 11 % | 21 % | 7 % | 22 % | 79 % | 44 % |
| 341720701 | Les Tonnelles | utilisable | `oui` | 881 | 53 % | 9 % | 29 % | 6 % | 39 % | 39 % | 100 % |
| 341720402 | Bologne | utilisable | `oui` | 461 | 53 % | 3 % | 36 % | 5 % | 33 % | 31 % | 100 % |
| 341721301 | Croix d'Argent | utilisable | `oui` | 2272 | 53 % | 9 % | 24 % | 5 % | 23 % | 69 % | 91 % |
| 341721102 | Lepic | utilisable | `oui` | 1218 | 54 % | 20 % | 11 % | 8 % | 23 % | 74 % | 100 % |
| 341720203 | Méric | utilisable | `oui` | 1547 | 55 % | 16 % | 14 % | 6 % | 16 % | 83 % | 38 % |
| 341720703 | Alco | utilisable | `oui` | 1437 | 56 % | 9 % | 25 % | 6 % | 26 % | 60 % | 86 % |
| 341720702 | Pilory | utilisable | `oui` | 1359 | 56 % | 5 % | 32 % | 4 % | 31 % | 48 % | 97 % |
| 341720109 | Euromédecine | utilisable | `oui` | 2301 | 56 % | 7 % | 20 % | 11 % | 29 % | 74 % | 21 % |
| 341720108 | Malbosc | utilisable | `oui` | 1863 | 57 % | 9 % | 23 % | 8 % | 21 % | 79 % | 75 % |
| 341721203 | Mas Drevon-Maurin | utilisable | `oui` | 1947 | 57 % | 8 % | 22 % | 4 % | 23 % | 63 % | 94 % |
| 341720404 | Le Mail Sud | utilisable | `oui` | 580 | 57 % | 1 % | 38 % | 2 % | 34 % | 34 % | 100 % |
| 341720502 | Les Gémeaux | utilisable | `oui` | 883 | 57 % | 5 % | 28 % | 2 % | 30 % | 44 % | 55 % |
| 341720802 | Agriculture | utilisable | `oui` | 1185 | 58 % | 19 % | 13 % | 8 % | 33 % | 63 % | 73 % |
| 341720301 | Agropolis | utilisable | `oui` | 1087 | 59 % | 11 % | 13 % | 10 % | 25 % | 79 % | 28 % |
| 341721103 | Parc Montcalm | utilisable | `oui` | 1109 | 60 % | 14 % | 14 % | 8 % | 14 % | 79 % | 63 % |
| 341720403 | Oxford | utilisable | `oui` | 720 | 61 % | 1 % | 28 % | 8 % | 27 % | 29 % | 100 % |
| 341721101 | Estanove | utilisable | `oui` | 827 | 61 % | 20 % | 9 % | 1 % | 12 % | 76 % | 85 % |
| 341721402 | Pas du Loup | utilisable | `oui` | 394 | 61 % | 6 % | 24 % | 5 % | 34 % | 9 % | 59 % |
| 341721903 | Millénaire | utilisable | `oui` | 775 | 61 % | 11 % | 7 % | 12 % | 13 % | 74 % | 56 % |
| 341720401 | Blayac | utilisable | `oui` | 1374 | 62 % | 3 % | 24 % | 6 % | 32 % | 44 % | 86 % |
| 341720202 | Aiguelongue | utilisable | `oui` | 784 | 62 % | 9 % | 8 % | 12 % | 21 % | 76 % | 9 % |
| 341722102 | Pompignane | utilisable | `oui` | 1029 | 62 % | 15 % | 9 % | 6 % | 12 % | 88 % | 70 % |
| 341720405 | Le Mail Nord | utilisable | `oui` | 591 | 64 % | 0 % | 31 % | 2 % | 37 % | 38 % | 100 % |
| 341721302 | Marquerose | utilisable | `oui` | 4202 | 64 % | 6 % | 20 % | 4 % | 18 % | 84 % | 60 % |
| 341721904 | Grammont | utilisable | `oui` | 1178 | 66 % | 7 % | 11 % | 8 % | 15 % | 74 % | 16 % |
| 341721401 | Bagatelle | utilisable | `oui` | 4662 | 67 % | 7 % | 12 % | 5 % | 13 % | 85 % | n.d. |
| 341720501 | Les Garrigues | utilisable | `oui` | 1214 | 67 % | 2 % | 26 % | 2 % | 21 % | 39 % | 97 % |
| 341720503 | Les Tours | utilisable | `oui` | 657 | 68 % | 7 % | 19 % | 5 % | 21 % | 60 % | 53 % |
| 341720707 | Le Petit Bard | utilisable | `oui` | 896 | 68 % | 2 % | 24 % | 3 % | 34 % | 54 % | 100 % |
| 341720902 | Bouisses | utilisable | `oui` | 2224 | 69 % | 8 % | 14 % | 2 % | 11 % | 79 % | 79 % |
| 341720901 | Les Grèzes | utilisable | `oui` | 1339 | 71 % | 8 % | 10 % | 2 % | 12 % | 88 % | 15 % |
| 341722101 | Salaison | utilisable | `oui` | 783 | 72 % | 6 % | 14 % | 4 % | 25 % | 35 % | 90 % |
| 341721901 | Eureka | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 341720201 | Lunaret | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 341720706 | Bel-Air | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 341721701 | Tournezy | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 341721303 | Garosud | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Montpellier)

Actifs qui habitent l'ensemble de Montpellier, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Montpellier (34172) | 75 % | 40 % | 15 % | 24 % | 13 % | 28023 | utilisable | `oui` |
| Castelnau-le-Lez (34057) | 2 % | 60 % | 13 % | 20 % | 3 % | 767 | utilisable | `oui` |
| Lattes (34129) | 2 % | 72 % | 7 % | 18 % | 1 % | 788 | utilisable | `oui` |
| Saint-Jean-de-Védas (34270) | 2 % | 72 % | 5 % | 18 % | 1 % | 701 | utilisable | `oui` |
| Mauguio (34154) | 1 % | 75 % | 5 % | 11 % | 1 % | 559 | utilisable | `oui` |
| Pérols (34198) | 1 % | 60 % | 8 % | 28 % | 0,4 % | 507 | utilisable | `oui` |
| Nîmes (30189) | 1 % | 60 % | 1 % | 38 % | 0,4 % | 380 | utilisable | `oui` |
| Vendargues (34327) | 1 % | 84 % | 5 % | 7 % | 1 % | 340 | utilisable | `oui` |
| Grabels (34116) | 1 % | 66 % | 9 % | 17 % | 6 % | 194 | utilisable | `oui` |
| Baillargues (34022) | 1 % | 80 % | 2 % | 14 % | 1 % | 201 | utilisable | `oui` |
| Béziers (34032) | 1 % | 54 % | 1 % | 42 % | 1 % | 157 | utilisable | `oui` |
| Lunel (34145) | 1 % | 84 % | 2 % | 13 % | 0 % | 187 | utilisable | `oui` |
| Sète (34301) | 1 % | 72 % | 0,1 % | 25 % | 1 % | 205 | utilisable | `oui` |
| Le Crès (34090) | 0,4 % | 77 % | 4 % | 13 % | 2 % | 148 | fragile | `ordre de grandeur` |
| Juvignac (34123) | 0,4 % | 82 % | 3 % | 10 % | 3 % | 143 | fragile | `ordre de grandeur` |
| Saint-Aunès (34240) | 0,4 % | 93 % | 0,4 % | 6 % | 0 % | 164 | utilisable | `oui` |
| Saint-Clément-de-Rivière (34247) | 0,4 % | 80 % | 5 % | 11 % | 4 % | 155 | utilisable | `oui` |
| Saint-Gély-du-Fesc (34255) | 0,4 % | 82 % | 2 % | 11 % | 0 % | 121 | fragile | `ordre de grandeur` |
| Castries (34058) | 0,3 % | 91 % | 1 % | 5 % | 0 % | 93 | fragile | `ordre de grandeur` |
| Clapiers (34077) | 0,3 % | 70 % | 14 % | 13 % | 0,3 % | 99 | fragile | `ordre de grandeur` |
| Frontignan (34108) | 0,3 % | 77 % | 2 % | 20 % | 0 % | 103 | fragile | `ordre de grandeur` |
| Jacou (34120) | 0,3 % | 67 % | 5 % | 23 % | 1 % | 128 | fragile | `ordre de grandeur` |
| Montferrier-sur-Lez (34169) | 0,3 % | 55 % | 23 % | 17 % | 0,4 % | 110 | fragile | `ordre de grandeur` |
| Palavas-les-Flots (34192) | 0,3 % | 83 % | 2 % | 8 % | 0 % | 105 | fragile | `ordre de grandeur` |
| La Grande-Motte (34344) | 0,3 % | 84 % | 2 % | 9 % | 2 % | 110 | fragile | `ordre de grandeur` |
| Aimargues (30006) | 0,2 % | 95 % | 1 % | 3 % | 2 % | 89 | fragile | `ordre de grandeur` |
| Gallargues-le-Montueux (30123) | 0,2 % | 75 % | 0 % | 3 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Toulouse (31555) | 0,2 % | 47 % | 1 % | 42 % | 3 % | 63 | fragile | `ordre de grandeur` |
| Fabrègues (34095) | 0,2 % | 88 % | 3 % | 4 % | 0 % | 72 | fragile | `ordre de grandeur` |
| Lavérune (34134) | 0,2 % | 83 % | 8 % | 3 % | 2 % | 96 | fragile | `ordre de grandeur` |
| Saint-Georges-d'Orques (34259) | 0,2 % | 94 % | 2 % | 1 % | 3 % | 67 | fragile | `ordre de grandeur` |
| Saint-Mathieu-de-Tréviers (34276) | 0,2 % | 87 % | 1 % | 6 % | 0 % | 73 | fragile | `ordre de grandeur` |
| Villeneuve-lès-Maguelone (34337) | 0,2 % | 73 % | 3 % | 20 % | 0 % | 92 | fragile | `ordre de grandeur` |
| Le Grau-du-Roi (30133) | 0,1 % | 97 % | 0 % | 2 % | 0 % | 47 | fragile | `ordre de grandeur` |
| Agde (34003) | 0,1 % | 64 % | 6 % | 30 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Gigean (34113) | 0,1 % | 90 % | 1 % | 4 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Gignac (34114) | 0,1 % | 94 % | 0 % | 6 % | 0 % | 42 | fragile | `ordre de grandeur` |
| Mudaison (34176) | 0,1 % | 89 % | 3 % | 8 % | 0 % | 55 | fragile | `ordre de grandeur` |
| Pignan (34202) | 0,1 % | 92 % | 3 % | 2 % | 1 % | 48 | fragile | `ordre de grandeur` |
| Prades-le-Lez (34217) | 0,1 % | 70 % | 8 % | 9 % | 0 % | 48 | fragile | `ordre de grandeur` |
| 99999 (99999) | 0,1 % | 43 % | 7 % | 31 % | 8 % | 41 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Montpellier (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 60 443 à 241 771), avec au moins 150 lignes d'échantillon ; Montpellier exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Montpellier qui vont travailler principalement en voiture (valeur comparée) | 48 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 17 communes du groupe (chaque commune compte une fois) | 44 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Montpellier moins la médiane du groupe (valeurs arrondies) | +4 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 17 | `oui` |

Communes du groupe (17, pour la vérification ; ne pas les citer) : Aix-en-Provence, Angers, Annecy, Bordeaux, Boulogne-Billancourt, Dijon, Grenoble, Lille, Nantes, Nice, Reims, Rennes, Saint-Étienne, Strasbourg, Toulon, Toulouse, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Montpellier. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Montpellier | Lignes (vers Montpellier) | Statut (vers Montpellier) | Usage (vers Montpellier) |
|---|---:|---:|---:|---:|---:|---|---|
| Castelnau-le-Lez (34057) | 63 % | 10 % | 14 % | 57 % | 1635 | utilisable | `oui` |
| Lattes (34129) | 74 % | 6 % | 9 % | 72 % | 1045 | utilisable | `oui` |
| Juvignac (34123) | 76 % | 5 % | 9 % | 74 % | 1020 | utilisable | `oui` |
| Saint-Jean-de-Védas (34270) | 75 % | 5 % | 7 % | 78 % | 496 | utilisable | `oui` |
| Saint-Gély-du-Fesc (34255) | 83 % | 2 % | 3 % | 92 % | 526 | utilisable | `oui` |
| Villeneuve-lès-Maguelone (34337) | 81 % | 3 % | 5 % | 85 % | 520 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Montpellier (34172) | 97 % | 88 % | 85 % | 77 % | 44 % |
| Castelnau-le-Lez (34057) | 77 % | 56 % | 62 % | 44 % | 0 % |
| Lattes (34129) | 71 % | 42 % | 52 % | 24 % | 22 % |
| Juvignac (34123) | 82 % | 43 % | 53 % | 23 % | 0 % |
| Saint-Jean-de-Védas (34270) | 65 % | 47 % | 62 % | 35 % | 1 % |
| Saint-Gély-du-Fesc (34255) | 72 % | 29 % | 42 % | 24 % | 0 % |
| Villeneuve-lès-Maguelone (34337) | 58 % | 54 % | 50 % | 47 % | 82 % |

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
| Carte de la part de la voiture par secteur (IRIS) | réalisable avec classes à revoir | secteurs (tableau), iris.voiture.min/max | aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable automatiquement | mobpro.voiture_selon_destination.* (groupes utilisables seulement) | aucun : la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Montpellier et Castelnau-le-Lez (34057), Lattes (34129), Juvignac (34123), Saint-Jean-de-Védas (34270), Saint-Gély-du-Fesc (34255) et Villeneuve-lès-Maguelone (34337) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Villeurbanne (69266)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/69266/fiche/fiche.json` (générée le 2026-10-15T16:08:35Z, jour de référence 2026-10-13, sha256 `0a71f0f2f760b8aa`). Dossier généré le 2026-10-15T16:19:52Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Villeurbanne (69266), département 69, intercommunalité Métropole de Lyon.
- **Groupe de communes nommé** : Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00760 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 11 % [IC 95 % : 10 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 33 % [IC 95 % : 32 % à 34 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 41 % [IC 95 % : 40 % à 42 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne, y compris ceux qui ne se déplacent pas | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Villeurbanne même | 32 % [IC 95 % : 31 % à 33 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne | commune de résidence et de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Villeurbanne | 22 % [IC 95 % : 21 % à 24 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne qui travaillent à Villeurbanne | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | 25 % [IC 95 % : 24 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne qui travaillent dans l'une de ces communes : Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | commune de travail : Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Villeurbanne et hors de Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | 38 % [IC 95 % : 37 % à 39 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne qui travaillent hors de Villeurbanne et hors de Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | commune de travail : toute commune autre que Villeurbanne, Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) moins travail à Villeurbanne | +3 points | deux groupes distincts (voir les deux faits) | commune de travail : Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 25 % [IC 95 % : 24 % à 25 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 19 % [IC 95 % : 18 % à 19 %] | tous les actifs occupés de 15 ans ou plus résidant à Villeurbanne | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 58 % [IC 95 % : 57 % à 59 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne dont le ménage a au moins une voiture | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 36 % [IC 95 % : 35 % à 38 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, propriétaires de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 16 % [IC 95 % : 14 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, propriétaires de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 12 % [IC 95 % : 11 % à 13 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, propriétaires de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 24 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, propriétaires de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 30 % [IC 95 % : 28 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires du privé de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires du privé de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 35 % [IC 95 % : 34 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires du privé de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 13 % [IC 95 % : 13 % à 14 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires du privé de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 35 % [IC 95 % : 33 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires HLM de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires HLM de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 29 % [IC 95 % : 27 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires HLM de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 19 % [IC 95 % : 17 % à 21 %] | actifs occupés de 15 ans ou plus résidant à Villeurbanne, locataires HLM de leur logement | commune de résidence : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Villeurbanne | environ 67 400 | — | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Villeurbanne, de ceux qui habitent Villeurbanne | 35 % | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Villeurbanne et habitent Villeurbanne | 22 % [IC 95 % : 21 % à 24 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent Villeurbanne | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Villeurbanne et habitent Villeurbanne | 32 % [IC 95 % : 31 % à 34 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent Villeurbanne | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Villeurbanne, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00760 (liste des communes non exposée par la fiche) | 28 % | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Villeurbanne et habitent une autre commune de l'unité urbaine INSEE 00760 (liste des communes non exposée par la fiche) | 62 % [IC 95 % : 60 % à 64 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00760 (liste des communes non exposée par la fiche) | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Villeurbanne et habitent une autre commune de l'unité urbaine INSEE 00760 (liste des communes non exposée par la fiche) | 29 % [IC 95 % : 28 % à 31 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00760 (liste des communes non exposée par la fiche) | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Villeurbanne, de ceux qui habitent hors de l'unité urbaine INSEE 00760 | 37 % | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Villeurbanne et habitent hors de l'unité urbaine INSEE 00760 | 41 % [IC 95 % : 39 % à 43 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00760 | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Villeurbanne et habitent hors de l'unité urbaine INSEE 00760 | 40 % [IC 95 % : 38 % à 41 %] | actifs occupés qui travaillent à Villeurbanne, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00760 | commune de travail : Villeurbanne (69266) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Charles Hernu (IRIS 692660102) | 20 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Villeurbanne (69266), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Saint-Jean (IRIS 692660801) | 57 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Villeurbanne (69266), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +37 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Villeurbanne (69266), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 39 % | toutes les résidences principales de Villeurbanne | commune : Villeurbanne (69266) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 12 % | toutes les résidences principales de Villeurbanne | commune : Villeurbanne (69266) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 54 % | toutes les résidences principales de Villeurbanne | commune : Villeurbanne (69266) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.69266.commerce_alim_500m` | Part des adresses de Villeurbanne qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 99 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.grande_surface_500m` | Part des adresses de Villeurbanne qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 77 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.pharmacie_500m` | Part des adresses de Villeurbanne qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 95 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.medecin_generaliste_500m` | Part des adresses de Villeurbanne qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 93 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.ecole_elementaire_500m` | Part des adresses de Villeurbanne qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 94 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.college_1km` | Part des adresses de Villeurbanne qui ont un collège à moins de 1 km (à vol d'oiseau) | 98 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.gare_2km` | Part des adresses de Villeurbanne qui ont une gare à moins de 2 km (à vol d'oiseau) | 47 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.panier_quotidien_500m` | Part des adresses de Villeurbanne qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.69266.bus_8h_7_9h` | Part des adresses de Villeurbanne qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.69266.aucun_bus_7_9h` | Part des adresses de Villeurbanne sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.69266.bus_4h_20_22h` | Part des adresses de Villeurbanne qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Villeurbanne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Villeurbanne (69266) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain TCL » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,34 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,74 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,16 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,66 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,50 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Villeurbanne (centre communal de geo.api.gouv.fr : [4.8898, 45.7719]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/69266/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Métropole de Lyon s'appelle « TCL » ; son autorité organisatrice est SYTRAL Mobilités. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain TCL » : https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-05-12 | intercommunalité Métropole de Lyon ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau TCL est https://www.tcl.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau TCL | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.zones` | La tarification du réseau TCL dépend des zones traversées. La page ne mentionne aucune gratuité générale. | https://www.tcl.fr/titres-et-tarifs/tarification-tcl (extrait vérifié le 2026-10-15 : « Les tarifs varient selon les zones traversées pendant votre trajet. ») | 2026-10-15 | non précisée | réseau TCL ; Réseau TCL, tarification par zones ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.horaires.metro_a_validite` | La page de la ligne Métro A indique des horaires à partir du 31 août 2026. Aucune date de fin n'est donnée. Une fiche horaire PDF est téléchargeable. | https://www.tcl.fr/lignes/metro-a (extrait vérifié le 2026-10-15 : « Ligne Métro A - Horaires à partir du 31 août 2026 ») | 2026-10-15 | à partir du 31 août 2026, fin non précisée | réseau TCL ; Ligne de métro A uniquement ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.itineraire` | Le site propose une page de calcul d'itinéraire. | https://www.tcl.fr/se-deplacer/calcul-ditineraire (extrait vérifié le 2026-10-15 : « Calcul d’itinéraire TCL : trouvez votre trajet dans la région lyonnaise ») | 2026-10-15 | non précisée | réseau TCL ; Réseau TCL ; application à chaque commune non établie | `oui` |  |
| `doc.verification.info_trafic` | Le site propose une page d'info trafic en temps réel. | https://www.tcl.fr/se-deplacer/info-trafic (extrait vérifié le 2026-10-15 : « Restez informé en temps réel des conditions de circulation et voyagez sans imprévu. ») | 2026-10-15 | non précisée | réseau TCL ; Réseau TCL ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité (publics, lignes, exceptions) | `introuvable` | https://www.tcl.fr/titres-et-tarifs/tarification-tcl 2026-10-15 | La page ne parle pas de gratuité. Les pages « Les abonnements TCL » et le guide tarifaire 2026 en PDF n'ont pas été consultés. |
| Jours de circulation (samedi, dimanche, jours fériés) | `introuvable` | https://www.tcl.fr/lignes/metro-a 2026-10-15 | Les pages /se-deplacer/horaires, /lignes, la page d'aide sur les horaires et la page de la ligne Métro A ne donnent pas ces jours. Seule la fiche horaire PDF de la ligne A pourrait les contenir. |
| Fiche horaire PDF de la ligne A (timetable-A-fiche_horaire_rentree) | `non vérifié` | https://www.tcl.fr/lignes/metro-a 2026-10-15 | Le PDF n'a pas été ouvert. Son contenu, y compris les jours de circulation et d'éventuelles fréquences, n'est pas vérifié. |
| Fiches horaires des autres lignes | `introuvable` | https://www.tcl.fr/lignes 2026-10-15 | La page /lignes est longue et seuls les 100 000 premiers caractères sur 187 198 ont été lus. Chaque ligne a sa page, de la forme /lignes/<ligne>. |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 692660102 | Charles Hernu | utilisable | `oui` | 2265 | 20 % | 10 % | 47 % | 16 % | 56 % | 29 % | 100 % |
| 692660101 | Charmettes | utilisable | `oui` | 2262 | 23 % | 10 % | 45 % | 18 % | 48 % | 39 % | 100 % |
| 692661201 | République | utilisable | `oui` | 2301 | 24 % | 17 % | 40 % | 15 % | 37 % | 63 % | 100 % |
| 692660501 | Croix Luizet Ouest | utilisable | `oui` | 1304 | 24 % | 7 % | 49 % | 18 % | 57 % | 39 % | 37 % |
| 692660301 | Tonkin Sud | utilisable | `oui` | 1694 | 24 % | 11 % | 49 % | 13 % | 38 % | 67 % | 100 % |
| 692660302 | Espace-Central | utilisable | `oui` | 2099 | 25 % | 9 % | 48 % | 13 % | 41 % | 57 % | 100 % |
| 692661404 | Pierre Cacard | utilisable | `oui` | 978 | 25 % | 9 % | 54 % | 8 % | 42 % | 42 % | 100 % |
| 692660103 | Charpenne-Wilson | utilisable | `oui` | 3356 | 25 % | 13 % | 46 % | 13 % | 43 % | 61 % | 100 % |
| 692661002 | Zola-Pressensé Est | utilisable | `oui` | 1414 | 25 % | 13 % | 51 % | 10 % | 37 % | 49 % | 100 % |
| 692661204 | Gratte-Ciel Est | utilisable | `oui` | 1509 | 26 % | 9 % | 49 % | 13 % | 52 % | 34 % | 100 % |
| 692661001 | Zola-Pressensé Ouest | utilisable | `oui` | 1066 | 26 % | 11 % | 47 % | 11 % | 44 % | 39 % | 100 % |
| 692661701 | Jacques Monod | utilisable | `oui` | 640 | 27 % | 9 % | 55 % | 6 % | 46 % | 23 % | 100 % |
| 692661402 | Damidot | utilisable | `oui` | 1621 | 27 % | 9 % | 52 % | 7 % | 39 % | 45 % | 100 % |
| 692660202 | 11 Novembre | utilisable | `oui` | 1557 | 28 % | 11 % | 39 % | 16 % | 42 % | 57 % | 100 % |
| 692661205 | Tolstoï Nord | utilisable | `oui` | 2029 | 29 % | 15 % | 36 % | 14 % | 34 % | 64 % | 100 % |
| 692661202 | Albert Thomas | utilisable | `oui` | 1258 | 30 % | 16 % | 29 % | 19 % | 42 % | 41 % | 100 % |
| 692661101 | Gratte-Ciel | utilisable | `oui` | 2152 | 30 % | 11 % | 47 % | 9 % | 37 % | 62 % | 100 % |
| 692660403 | Tonkin Nord | utilisable | `oui` | 1019 | 31 % | 12 % | 38 % | 17 % | 39 % | 58 % | 100 % |
| 692660902 | Les Poulettes | utilisable | `oui` | 2212 | 31 % | 14 % | 38 % | 13 % | 27 % | 63 % | 100 % |
| 692661301 | Tolstoï Sud | utilisable | `oui` | 2762 | 32 % | 13 % | 35 % | 14 % | 38 % | 61 % | 100 % |
| 692661302 | Ferrandière | utilisable | `oui` | 2259 | 32 % | 17 % | 33 % | 14 % | 33 % | 60 % | 100 % |
| 692661702 | Réguillon | utilisable | `oui` | 1482 | 33 % | 11 % | 47 % | 7 % | 29 % | 62 % | 100 % |
| 692661203 | Gratte-Ciel Ouest | utilisable | `oui` | 1192 | 33 % | 18 % | 27 % | 18 % | 26 % | 76 % | 100 % |
| 692661403 | Perralière | utilisable | `oui` | 1193 | 34 % | 10 % | 42 % | 10 % | 32 % | 61 % | 100 % |
| 692661601 | Cusset-Ouest | utilisable | `oui` | 1664 | 34 % | 8 % | 49 % | 7 % | 34 % | 55 % | 100 % |
| 692661303 | Maisons Neuves | utilisable | `oui` | 3483 | 34 % | 15 % | 35 % | 12 % | 35 % | 65 % | 96 % |
| 692661704 | Fays-Est | utilisable | `oui` | 611 | 35 % | 8 % | 43 % | 10 % | 36 % | 47 % | 90 % |
| 692661401 | Droits de l'Homme | utilisable | `oui` | 1115 | 35 % | 10 % | 46 % | 5 % | 34 % | 65 % | 100 % |
| 692660703 | Buers Sud | utilisable | `oui` | 849 | 35 % | 10 % | 41 % | 8 % | 32 % | 35 % | 100 % |
| 692660903 | Château Gaillard | utilisable | `oui` | 1496 | 36 % | 13 % | 40 % | 8 % | 41 % | 38 % | 100 % |
| 692661503 | Grandclément | utilisable | `oui` | 1628 | 36 % | 13 % | 40 % | 8 % | 33 % | 60 % | 100 % |
| 692661502 | Genas | utilisable | `oui` | 1995 | 37 % | 7 % | 45 % | 8 % | 41 % | 53 % | 78 % |
| 692661501 | Grandclément-Blum | utilisable | `oui` | 2538 | 38 % | 11 % | 38 % | 7 % | 34 % | 59 % | 100 % |
| 692660402 | Tonkin Ouest | utilisable | `oui` | 1021 | 39 % | 8 % | 38 % | 10 % | 31 % | 57 % | 100 % |
| 692660901 | Poulettes Nord | utilisable | `oui` | 845 | 39 % | 11 % | 37 % | 9 % | 37 % | 68 % | 100 % |
| 692661703 | Fays-Bon Coin | utilisable | `oui` | 2179 | 40 % | 11 % | 40 % | 7 % | 27 % | 64 % | 94 % |
| 692661602 | Bonnevay | utilisable | `oui` | 1351 | 40 % | 5 % | 45 % | 7 % | 32 % | 57 % | 90 % |
| 692660502 | Croix Luizet Est | utilisable | `oui` | 1527 | 41 % | 9 % | 38 % | 9 % | 40 % | 47 % | 77 % |
| 692660601 | Einstein-Salengro | utilisable | `oui` | 1077 | 43 % | 9 % | 34 % | 8 % | 30 % | 73 % | 61 % |
| 692661802 | Bel-Air | utilisable | `oui` | 892 | 44 % | 4 % | 49 % | 1 % | 41 % | 33 % | 31 % |
| 692660701 | Buers Est | utilisable | `oui` | 945 | 46 % | 9 % | 35 % | 5 % | 29 % | 40 % | 98 % |
| 692661804 | Poudrette | utilisable | `oui` | 544 | 48 % | 2 % | 41 % | 6 % | 30 % | 60 % | 20 % |
| 692660702 | Buers Nord | utilisable | `oui` | 1768 | 49 % | 12 % | 28 % | 6 % | 36 % | 52 % | 94 % |
| 692661803 | Les Brosses | utilisable | `oui` | 1301 | 50 % | 5 % | 37 % | 4 % | 27 % | 59 % | 88 % |
| 692660801 | Saint-Jean | utilisable | `oui` | 1441 | 57 % | 5 % | 31 % | 3 % | 24 % | 64 % | 38 % |
| 692660401 | Stalingrad | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 692660201 | Doua | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 692661801 | La Soie | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Villeurbanne)

Actifs qui habitent l'ensemble de Villeurbanne, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Villeurbanne (69266) | 32 % | 22 % | 12 % | 32 % | 23 % | 6985 | utilisable | `oui` |
| Lyon 3e Arrondissement (69383) | 11 % | 15 % | 18 % | 52 % | 13 % | 2400 | utilisable | `oui` |
| Lyon 7e Arrondissement (69387) | 6 % | 19 % | 14 % | 64 % | 2 % | 1320 | utilisable | `oui` |
| Lyon 6e Arrondissement (69386) | 5 % | 17 % | 17 % | 51 % | 14 % | 1070 | utilisable | `oui` |
| Lyon 2e Arrondissement (69382) | 4 % | 10 % | 13 % | 73 % | 2 % | 919 | utilisable | `oui` |
| Vaulx-en-Velin (69256) | 3 % | 48 % | 9 % | 40 % | 3 % | 736 | utilisable | `oui` |
| Saint-Priest (69290) | 3 % | 67 % | 4 % | 27 % | 0,2 % | 632 | utilisable | `oui` |
| Lyon 8e Arrondissement (69388) | 3 % | 33 % | 18 % | 43 % | 6 % | 555 | utilisable | `oui` |
| Bron (69029) | 3 % | 48 % | 13 % | 32 % | 5 % | 551 | utilisable | `oui` |
| Lyon 9e Arrondissement (69389) | 2 % | 27 % | 10 % | 58 % | 2 % | 563 | utilisable | `oui` |
| Vénissieux (69259) | 2 % | 53 % | 6 % | 36 % | 3 % | 425 | utilisable | `oui` |
| Lyon 1er Arrondissement (69381) | 2 % | 13 % | 16 % | 65 % | 3 % | 367 | utilisable | `oui` |
| Décines-Charpieu (69275) | 1 % | 61 % | 5 % | 33 % | 1 % | 262 | utilisable | `oui` |
| Lyon 4e Arrondissement (69384) | 1 % | 23 % | 10 % | 64 % | 1 % | 254 | utilisable | `oui` |
| Meyzieu (69282) | 1 % | 54 % | 2 % | 42 % | 1 % | 267 | utilisable | `oui` |
| Lyon 5e Arrondissement (69385) | 1 % | 19 % | 11 % | 67 % | 2 % | 242 | utilisable | `oui` |
| Caluire-et-Cuire (69034) | 1 % | 58 % | 8 % | 34 % | 1 % | 228 | utilisable | `oui` |
| Rillieux-la-Pape (69286) | 1 % | 60 % | 2 % | 37 % | 0 % | 204 | utilisable | `oui` |
| Chassieu (69271) | 1 % | 62 % | 6 % | 28 % | 1 % | 169 | utilisable | `oui` |
| Oullins-Pierre-Bénite (69149) | 1 % | 41 % | 2 % | 56 % | 1 % | 129 | fragile | `ordre de grandeur` |
| Écully (69081) | 1 % | 55 % | 6 % | 38 % | 0 % | 142 | fragile | `ordre de grandeur` |
| Limonest (69116) | 1 % | 64 % | 4 % | 31 % | 0 % | 126 | fragile | `ordre de grandeur` |
| Corbas (69273) | 1 % | 77 % | 1 % | 21 % | 0 % | 118 | fragile | `ordre de grandeur` |
| Genas (69277) | 1 % | 75 % | 2 % | 19 % | 3 % | 131 | fragile | `ordre de grandeur` |
| Saint-Fons (69199) | 0,4 % | 74 % | 5 % | 21 % | 0 % | 84 | fragile | `ordre de grandeur` |
| Colombier-Saugnieu (69299) | 0,4 % | 74 % | 1 % | 25 % | 0 % | 96 | fragile | `ordre de grandeur` |
| Beynost (01043) | 0,3 % | 87 % | 0 % | 13 % | 0 % | 57 | fragile | `ordre de grandeur` |
| Saint-Quentin-Fallavier (38449) | 0,3 % | 80 % | 0 % | 19 % | 1 % | 76 | fragile | `ordre de grandeur` |
| Brignais (69027) | 0,3 % | 80 % | 3 % | 15 % | 0 % | 58 | fragile | `ordre de grandeur` |
| Champagne-au-Mont-d'Or (69040) | 0,3 % | 75 % | 5 % | 20 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Dardilly (69072) | 0,3 % | 48 % | 3 % | 43 % | 2 % | 75 | fragile | `ordre de grandeur` |
| Saint-Genis-Laval (69204) | 0,3 % | 60 % | 6 % | 33 % | 0 % | 65 | fragile | `ordre de grandeur` |
| Jonage (69279) | 0,3 % | 43 % | 5 % | 52 % | 0 % | 80 | fragile | `ordre de grandeur` |
| 99999 (99999) | 0,3 % | 56 % | 9 % | 31 % | 3 % | 54 | fragile | `ordre de grandeur` |
| Miribel (01249) | 0,2 % | 84 % | 0 % | 16 % | 0 % | 43 | fragile | `ordre de grandeur` |
| Marcy-l'Étoile (69127) | 0,2 % | 62 % | 2 % | 33 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Tassin-la-Demi-Lune (69244) | 0,2 % | 38 % | 10 % | 45 % | 3 % | 45 | fragile | `ordre de grandeur` |
| Pusignan (69285) | 0,2 % | 83 % | 2 % | 9 % | 3 % | 46 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Villeurbanne (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 36 599 à 146 395), avec au moins 150 lignes d'échantillon ; Villeurbanne exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Villeurbanne qui vont travailler principalement en voiture (valeur comparée) | 33 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 30 communes du groupe (chaque commune compte une fois) | 56 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Villeurbanne moins la médiane du groupe (valeurs arrondies) | -23 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 30 | `oui` |

Communes du groupe (30, pour la vérification ; ne pas les citer) : Aix-en-Provence, Amiens, Angers, Annecy, Besançon, Bordeaux, Boulogne-Billancourt, Brest, Caen, Clermont-Ferrand, Dijon, Grenoble, Le Havre, Le Mans, Lille, Limoges, Metz, Montpellier, Nancy, Nice, Nîmes, Orléans, Perpignan, Reims, Rennes, Rouen, Saint-Étienne, Strasbourg, Toulon, Tours.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Villeurbanne. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Villeurbanne | Lignes (vers Villeurbanne) | Statut (vers Villeurbanne) | Usage (vers Villeurbanne) |
|---|---:|---:|---:|---:|---:|---|---|
| Vénissieux (69259) | 56 % | 3 % | 33 % | 53 % | 331 | utilisable | `oui` |
| Vaulx-en-Velin (69256) | 58 % | 3 % | 31 % | 46 % | 627 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Villeurbanne (69266) | 99 % | 95 % | 94 % | 91 % | 47 % |
| Lyon 3e Arrondissement (69383) | 100 % | 98 % | 97 % | 95 % | 84 % |
| Lyon 8e Arrondissement (69388) | 99,8 % | 98 % | 98 % | 97 % | 39 % |
| Lyon 7e Arrondissement (69387) | 99,5 % | 98 % | 99 % | 97 % | 99,7 % |
| Vénissieux (69259) | 96 % | 82 % | 94 % | 77 % | 79 % |
| Lyon 9e Arrondissement (69389) | 96 % | 84 % | 88 % | 76 % | 86 % |
| Vaulx-en-Velin (69256) | 97 % | 83 % | 87 % | 76 % | 1 % |

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
| Carte de situation : Villeurbanne et Lyon 3e Arrondissement (69383), Lyon 8e Arrondissement (69388), Lyon 7e Arrondissement (69387), Vénissieux (69259), Lyon 9e Arrondissement (69389) et Vaulx-en-Velin (69256) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Angers (49007)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-01/49007/fiche/fiche.json` (générée le 2026-10-14T14:24:22Z, jour de référence 2026-10-13, sha256 `6fc753c8ea39bcd3`). Dossier généré le 2026-10-14T14:53:34Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Angers (49007), département 49, intercommunalité CU Angers Loire Métropole.
- **Groupe de communes nommé** : Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 49701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 13 % [IC 95 % : 12 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 54 % [IC 95 % : 53 % à 55 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 17 % [IC 95 % : 16 % à 18 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers, y compris ceux qui ne se déplacent pas | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Angers même | 67 % [IC 95 % : 66 % à 68 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers | commune de résidence et de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Angers | 44 % [IC 95 % : 43 % à 45 %] | actifs occupés de 15 ans ou plus résidant à Angers qui travaillent à Angers | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | 76 % [IC 95 % : 73 % à 78 %] | actifs occupés de 15 ans ou plus résidant à Angers qui travaillent dans l'une de ces communes : Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | commune de travail : Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Angers et hors de Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | 73 % [IC 95 % : 72 % à 75 %] | actifs occupés de 15 ans ou plus résidant à Angers qui travaillent hors de Angers et hors de Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | commune de travail : toute commune autre que Angers, Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) moins travail à Angers | +32 points | deux groupes distincts (voir les deux faits) | commune de travail : Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 14 % [IC 95 % : 14 % à 15 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 32 % [IC 95 % : 31 % à 33 %] | tous les actifs occupés de 15 ans ou plus résidant à Angers | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 39 % [IC 95 % : 38 % à 40 %] | actifs occupés de 15 ans ou plus résidant à Angers dont le ménage a au moins une voiture | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 57 % [IC 95 % : 55 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Angers, propriétaires de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 16 % [IC 95 % : 15 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Angers, propriétaires de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 4 % [IC 95 % : 3 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Angers, propriétaires de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 46 % [IC 95 % : 44 % à 47 %] | actifs occupés de 15 ans ou plus résidant à Angers, propriétaires de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 50 % [IC 95 % : 49 % à 52 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires du privé de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 11 % [IC 95 % : 10 % à 12 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires du privé de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 21 % [IC 95 % : 20 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires du privé de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 25 % [IC 95 % : 23 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires du privé de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 57 % [IC 95 % : 55 % à 59 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires HLM de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 6 % [IC 95 % : 5 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires HLM de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 22 % [IC 95 % : 20 % à 24 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires HLM de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 23 % [IC 95 % : 22 % à 25 %] | actifs occupés de 15 ans ou plus résidant à Angers, locataires HLM de leur logement | commune de résidence : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Angers | environ 93 500 | — | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Angers, de ceux qui habitent Angers | 46 % | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Angers et habitent Angers | 44 % [IC 95 % : 43 % à 45 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent Angers | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Angers et habitent Angers | 16 % [IC 95 % : 16 % à 17 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent Angers | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Angers, de ceux qui habitent une autre commune de l'unité urbaine INSEE 49701 (liste des communes non exposée par la fiche) | 17 % | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Angers et habitent une autre commune de l'unité urbaine INSEE 49701 (liste des communes non exposée par la fiche) | 80 % [IC 95 % : 78 % à 81 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 49701 (liste des communes non exposée par la fiche) | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Angers et habitent une autre commune de l'unité urbaine INSEE 49701 (liste des communes non exposée par la fiche) | 12 % [IC 95 % : 11 % à 13 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 49701 (liste des communes non exposée par la fiche) | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Angers, de ceux qui habitent hors de l'unité urbaine INSEE 49701 | 37 % | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Angers et habitent hors de l'unité urbaine INSEE 49701 | 87 % [IC 95 % : 86 % à 88 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 49701 | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Angers et habitent hors de l'unité urbaine INSEE 49701 | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés qui travaillent à Angers, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 49701 | commune de travail : Angers (49007) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Voltaire (IRIS 490070105) | 27 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Angers (49007), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Croix Blanche (IRIS 490070901) | 76 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Angers (49007), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +49 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Angers (49007), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 28 % | toutes les résidences principales de Angers | commune : Angers (49007) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 18 % | toutes les résidences principales de Angers | commune : Angers (49007) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 54 % | toutes les résidences principales de Angers | commune : Angers (49007) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.49007.commerce_alim_500m` | Part des adresses de Angers qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 94 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.grande_surface_500m` | Part des adresses de Angers qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 63 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.pharmacie_500m` | Part des adresses de Angers qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.medecin_generaliste_500m` | Part des adresses de Angers qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 89 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.ecole_elementaire_500m` | Part des adresses de Angers qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 90 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.college_1km` | Part des adresses de Angers qui ont un collège à moins de 1 km (à vol d'oiseau) | 86 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.gare_2km` | Part des adresses de Angers qui ont une gare à moins de 2 km (à vol d'oiseau) | 69 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.panier_quotidien_500m` | Part des adresses de Angers qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.49007.bus_8h_7_9h` | Part des adresses de Angers qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.49007.aucun_bus_7_9h` | Part des adresses de Angers sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.49007.bus_4h_20_22h` | Part des adresses de Angers qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Angers, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Angers (49007) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Irigo » (https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,57 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,75 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,16 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,65 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,51 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Angers (centre communal de geo.api.gouv.fr : [-0.5629, 47.4819]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable (réextraire la veille de la publication) | `oui` |

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
- `carburant.evolution.*` : Le contrôle sur les mêmes stations (scripts/13) n'est pas fait par l'outil. Pas un prix « du quartier » ; une station qui ne déclare rien une semaine n'y compte pas. Une hausse passée ne dit rien de l'avenir.

## 2 bis. Informations documentaires (non calculées)

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-14 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-01/49007/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain publié pour l'intercommunalité CU Angers Loire Métropole est « Irigo » (autorité organisatrice : CU Angers Loire Métropole). | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Irigo » : https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri | 2026-10-14 | jeu de données mis à jour le 2026-10-14 | intercommunalité CU Angers Loire Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site indiqué par le réseau dans ses horaires publiés est https://www.irigo.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/angers-loire-metropole-reseau-irigo-gtfs-gtfs-rt-siri ; site joint le 2026-10-14 | 2026-10-14 | non précisée | réseau Irigo | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.jours.tram` | Les trams A, B et C circulent toute la semaine de 5h00 à 01h00. | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus (extrait vérifié le 2026-10-14 : « Elles fonctionnent de 5h00 à 01h00 toute la semaine ») | 2026-10-14 | non précisée | réseau Irigo ; Tram A, B, C ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.jours.bus_1_4` | Les lignes de bus 1 à 4 circulent du lundi au dimanche de 5h30 à 01h00. La page indique que ce sont les seules lignes de bus à circuler le dimanche. | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus (extrait vérifié le 2026-10-14 : « Les lignes 1 – 2 – 3 – 4 circulent du lundi au dimanche de 5h30 à 01h00 ») | 2026-10-14 | non précisée | réseau Irigo ; Bus lignes 1, 2, 3, 4 uniquement ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.jours.express` | Les lignes E20 à E25 circulent du lundi au samedi de 7h à 21h30. | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus (extrait vérifié le 2026-10-14 : « Les lignes E20 à E25 circulent du lundi au samedi de 7h à 21h30 ») | 2026-10-14 | non précisée | réseau Irigo ; Lignes express E20 à E25 ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.jours.suburbaines` | Les lignes 30 à 42 circulent du lundi au samedi de 7h à 19h30. | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus (extrait vérifié le 2026-10-14 : « de 7h à 19h30 du lundi au samedi ») | 2026-10-14 | non précisée | réseau Irigo ; Lignes 30 à 42 ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.gratuite.navette_marche` | La Navette Marché (dimanche, 9h-14h) est gratuite ; la page la présente comme la seule ligne gratuite de la page. Pas de gratuité générale du réseau constatée. | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus (extrait vérifié le 2026-10-14 : « gratuitement faire vos courses au marché de Monplaisir ») | 2026-10-14 | non précisée | réseau Irigo ; Navette Marché, dimanche, Monplaisir uniquement ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarif.titre_obligatoire` | Un titre de transport est obligatoire pour les voyageurs de plus de 6 ans. | https://www.irigo.fr/ (extrait vérifié le 2026-10-14 : « L'achat d'un titre de transport est obligatoire pour les voyageurs de plus de 6 ans. ») | 2026-10-14 | non précisée | réseau Irigo ; Réseau irigo, voyageurs de plus de 6 ans ; application à chaque commune non établie | `oui` |  |
| `doc.horaires.toussaint_2026` | Les lignes s'adaptent pendant les vacances de la Toussaint 2026, du 19 au 30 octobre (tram A/B/C, bus 1-12, E20-E25, 30-42). | https://www.irigo.fr/services/actualites/le-reseau/horaires-vacances-scolaires-toussaint-2026 (extrait vérifié le 2026-10-14 : « Du lundi 19 au vendredi 30 octobre 2026 ») | 2026-10-14 | du 19 au 30 octobre 2026 | réseau Irigo ; Tramway A, B, C ; bus 1 à 12 ; E20 à E25 ; 30 à 42 ; application à chaque commune non établie | `avec ses conditions` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Jours de circulation des jours fériés | `introuvable` | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus 2026-10-14 | La page ne précise pas le service les jours fériés. |
| Période de validité des horaires hors vacances | `introuvable` | https://www.irigo.fr/ 2026-10-14 | Aucune période de validité trouvée hors la période de la Toussaint 2026. |
| Gratuité générale du réseau | `introuvable` | https://www.irigo.fr/ 2026-10-14 | Aucune gratuité générale constatée. Les pages tarifs détaillées (https://www.irigo.fr/titres-tarifs/comment-acheter-un-titre-de-transport-irigo) n'ont pas été consultées. |
| Où vérifier un trajet (itinéraire, fiches horaires, temps réel) | `non vérifié` | https://www.irigo.fr/cartagene-itinerary 2026-10-14 | Pages indiquées par la page d'accueil : https://www.irigo.fr/cartagene-itinerary (itinéraire), https://www.irigo.fr/cartagene/lines (horaires par ligne), https://www.irigo.fr/se-deplacer/infos-trafic (infos trafic). Je n'ai pas ouvert ces pages et je n'ai pas d'extrait exact à fournir. Le fait doc.verifier.itineraire a donc un extrait vide, à rejeter ou à valider. |
| Fréquences | `introuvable` | https://www.irigo.fr/services-accessibilite/le-reseau-irigo/les-lignes-du-reseau-toutes-nos-lignes-de-trams-et-de-bus 2026-10-14 | Aucune fréquence explicite relevée. |
| Un outil de calcul d'itinéraire est disponible sur le site, ainsi que les horair | `non vérifié` | https://www.irigo.fr/cartagene-itinerary 2026-10-14 | extrait introuvable sur la page |
| calcul d'itinéraire ou fiches horaires officielles | `introuvable` |  2026-10-14 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-14 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 490070105 | Voltaire | utilisable | `oui` | 1071 | 27 % | 11 % | 22 % | 28 % | 49 % | 17 % | 98 % |
| 490070107 | Ralliement | utilisable | `oui` | 1520 | 32 % | 11 % | 20 % | 28 % | 50 % | 19 % | 100 % |
| 490070109 | Mail | utilisable | `oui` | 1143 | 33 % | 11 % | 19 % | 31 % | 48 % | 37 % | 100 % |
| 490070106 | Boisnet | utilisable | `oui` | 1833 | 35 % | 9 % | 18 % | 33 % | 44 % | 36 % | 95 % |
| 490070104 | Gare | utilisable | `oui` | 941 | 36 % | 10 % | 24 % | 25 % | 46 % | 31 % | 99,5 % |
| 490070110 | Joachim du Bellay | utilisable | `oui` | 1078 | 39 % | 18 % | 16 % | 20 % | 34 % | 39 % | 87 % |
| 490070102 | Bordillon | utilisable | `oui` | 885 | 40 % | 12 % | 18 % | 25 % | 39 % | 38 % | 100 % |
| 490070103 | Blancheraie | utilisable | `oui` | 1016 | 41 % | 10 % | 24 % | 20 % | 40 % | 46 % | 80 % |
| 490070401 | Brissac | utilisable | `oui` | 1014 | 41 % | 15 % | 20 % | 19 % | 36 % | 42 % | 89 % |
| 490070904 | Gâte-Argent | utilisable | `oui` | 1370 | 45 % | 14 % | 23 % | 16 % | 32 % | 48 % | 67 % |
| 490070405 | Fulton | utilisable | `oui` | 1862 | 45 % | 18 % | 23 % | 12 % | 28 % | 59 % | 68 % |
| 490070101 | Saint-Jean | utilisable | `oui` | 906 | 46 % | 13 % | 18 % | 21 % | 30 % | 27 % | 99 % |
| 490070203 | Saint-Michel | utilisable | `oui` | 1251 | 47 % | 11 % | 18 % | 20 % | 33 % | 46 % | 91 % |
| 490070707 | Beauséjour | utilisable | `oui` | 1780 | 48 % | 6 % | 21 % | 5 % | 24 % | 70 % | 57 % |
| 490070407 | Vauban | utilisable | `oui` | 1150 | 48 % | 12 % | 23 % | 10 % | 20 % | 58 % | 6 % |
| 490070108 | Louis Gain | utilisable | `oui` | 1157 | 49 % | 10 % | 17 % | 17 % | 35 % | 48 % | 48 % |
| 490070704 | Barra | utilisable | `oui` | 1261 | 49 % | 18 % | 8 % | 21 % | 22 % | 51 % | 77 % |
| 490070406 | Chevrollier | utilisable | `oui` | 996 | 50 % | 13 % | 19 % | 10 % | 22 % | 77 % | 78 % |
| 490070402 | Mirabeau | utilisable | `oui` | 1164 | 51 % | 14 % | 15 % | 13 % | 16 % | 76 % | 69 % |
| 490070202 | Besnardières | utilisable | `oui` | 1840 | 52 % | 12 % | 13 % | 20 % | 26 % | 61 % | 95 % |
| 490070803 | Henri Dunant | utilisable | `oui` | 652 | 53 % | 5 % | 33 % | 4 % | 39 % | 46 % | 90 % |
| 490070806 | Doyenné | utilisable | `oui` | 713 | 54 % | 10 % | 24 % | 8 % | 32 % | 49 % | 51 % |
| 490070503 | Beaussier | utilisable | `oui` | 987 | 54 % | 7 % | 24 % | 13 % | 41 % | 50 % | 66 % |
| 490070301 | Volney | utilisable | `oui` | 1352 | 55 % | 8 % | 12 % | 16 % | 19 % | 70 % | 58 % |
| 490070502 | Melgrani | utilisable | `oui` | 869 | 56 % | 11 % | 21 % | 6 % | 28 % | 54 % | 99 % |
| 490070204 | Brisepotière | utilisable | `oui` | 2002 | 56 % | 23 % | 9 % | 10 % | 17 % | 61 % | 51 % |
| 490071103 | Château d'Orgemont | utilisable | `oui` | 654 | 56 % | 11 % | 19 % | 11 % | 14 % | 69 % | 60 % |
| 490070302 | Noyers | utilisable | `oui` | 1227 | 56 % | 16 % | 11 % | 11 % | 17 % | 65 % | 71 % |
| 490070602 | La Bruyère | utilisable | `oui` | 844 | 56 % | 13 % | 15 % | 10 % | 28 % | 47 % | 65 % |
| 490070703 | Petites Pannes | utilisable | `oui` | 1091 | 57 % | 18 % | 11 % | 8 % | 11 % | 75 % | 73 % |
| 490070601 | Yolande d'Aragon | utilisable | `oui` | 840 | 57 % | 13 % | 13 % | 13 % | 18 % | 84 % | 99,5 % |
| 490071106 | Luther King | utilisable | `oui` | 1100 | 57 % | 4 % | 31 % | 5 % | 38 % | 23 % | 86 % |
| 490070403 | Lorette | utilisable | `oui` | 1011 | 57 % | 12 % | 21 % | 6 % | 29 % | 48 % | 100 % |
| 490070504 | Dauversière | utilisable | `oui` | 755 | 58 % | 8 % | 20 % | 8 % | 34 % | 33 % | 77 % |
| 490071113 | Dumont d'Urville | utilisable | `oui` | 636 | 58 % | 4 % | 31 % | 4 % | 39 % | 31 % | 100 % |
| 490071104 | Maurice Tardat | utilisable | `oui` | 809 | 59 % | 13 % | 18 % | 6 % | 22 % | 72 % | 62 % |
| 490070603 | Gouronnières | utilisable | `oui` | 1639 | 59 % | 15 % | 10 % | 13 % | 18 % | 79 % | 100 % |
| 490070701 | Jean Moulin | utilisable | `oui` | 2225 | 59 % | 10 % | 18 % | 9 % | 23 % | 69 % | 44 % |
| 490071107 | Jean Vilar | utilisable | `oui` | 873 | 59 % | 9 % | 24 % | 4 % | 36 % | 30 % | 100 % |
| 490071105 | Jan Pallach | utilisable | `oui` | 510 | 60 % | 3 % | 23 % | 9 % | 24 % | 55 % | 100 % |
| 490070903 | Daguenet | utilisable | `oui` | 1434 | 61 % | 12 % | 16 % | 8 % | 27 % | 43 % | 97 % |
| 490071002 | Liberté | utilisable | `oui` | 1156 | 61 % | 10 % | 18 % | 7 % | 18 % | 66 % | 46 % |
| 490070804 | Haarlem | utilisable | `oui` | 505 | 62 % | 12 % | 22 % | 3 % | 25 % | 43 % | 100 % |
| 490070303 | Haut Pressoir | utilisable | `oui` | 1266 | 62 % | 11 % | 8 % | 10 % | 17 % | 84 % | 79 % |
| 490070404 | Bon Repos | utilisable | `oui` | 673 | 63 % | 10 % | 9 % | 13 % | 20 % | 64 % | 51 % |
| 490070304 | Villoutreys | utilisable | `oui` | 1399 | 64 % | 13 % | 12 % | 8 % | 21 % | 72 % | 27 % |
| 490071003 | Marianne | utilisable | `oui` | 840 | 64 % | 10 % | 16 % | 3 % | 22 % | 63 % | 99 % |
| 490070902 | Lareveillère | utilisable | `oui` | 711 | 64 % | 9 % | 18 % | 8 % | 15 % | 60 % | 33 % |
| 490070501 | Montesquieu | utilisable | `oui` | 1269 | 65 % | 8 % | 12 % | 11 % | 26 % | 60 % | 100 % |
| 490071201 | Chambre aux Deniers | utilisable | `oui` | 789 | 67 % | 7 % | 13 % | 8 % | 23 % | 55 % | 93 % |
| 490070605 | Alphonse Daudet | utilisable | `oui` | 769 | 68 % | 18 % | 6 % | 4 % | 11 % | 75 % | 83 % |
| 490070802 | Copernic | utilisable | `oui` | 974 | 68 % | 6 % | 17 % | 5 % | 19 % | 81 % | 69 % |
| 490071001 | Parmentier | utilisable | `oui` | 1386 | 69 % | 11 % | 15 % | 3 % | 25 % | 54 % | 59 % |
| 490070805 | Europe | utilisable | `oui` | 499 | 69 % | 2 % | 22 % | 6 % | 54 % | 12 % | 100 % |
| 490071202 | Jean Rostand | utilisable | `oui` | 883 | 69 % | 16 % | 9 % | 5 % | 7 % | 84 % | 20 % |
| 490071203 | Mollière | utilisable | `oui` | 1430 | 70 % | 9 % | 13 % | 4 % | 6 % | 86 % | 62 % |
| 490071111 | Robert d'Arbrissel | utilisable | `oui` | 517 | 75 % | 7 % | 16 % | 1 % | 6 % | 92 % | 44 % |
| 490070901 | Croix Blanche | utilisable | `oui` | 789 | 76 % | 6 % | 11 % | 3 % | 12 % | 77 % | 27 % |
| 490070706 | Z.A. Larrey | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070505 | Z.A. Nid de Pie | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070201 | Z.A. François Mitterrand | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490071109 | Z.A. Bouché Thomas | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070506 | Balzac-Zone Naturelle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070905 | Z.A. Gaston Birgé | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070801 | Z.A. Tournerie | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490071101 | Gillettes-Zone Naturelle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070408 | Baumette-Zone Naturelle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490070705 | Île Saint-Aubin (Zone Naturelle) | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 490071204 | Le Lac-Zone Naturelle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Angers)

Actifs qui habitent l'ensemble de Angers, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Angers (49007) | 67 % | 44 % | 15 % | 16 % | 18 % | 12990 | utilisable | `oui` |
| Beaucouzé (49020) | 3 % | 76 % | 7 % | 14 % | 1 % | 592 | utilisable | `oui` |
| Saint-Barthélemy-d'Anjou (49267) | 3 % | 75 % | 9 % | 10 % | 4 % | 538 | utilisable | `oui` |
| Trélazé (49353) | 2 % | 74 % | 10 % | 14 % | 0,1 % | 364 | utilisable | `oui` |
| Avrillé (49015) | 2 % | 71 % | 7 % | 17 % | 3 % | 347 | utilisable | `oui` |
| Verrières-en-Anjou (49323) | 2 % | 78 % | 4 % | 14 % | 0 % | 331 | utilisable | `oui` |
| Les Ponts-de-Cé (49246) | 2 % | 81 % | 9 % | 9 % | 0,2 % | 291 | utilisable | `oui` |
| Nantes (44109) | 1 % | 36 % | 1 % | 61 % | 1 % | 219 | utilisable | `oui` |
| Écouflant (49129) | 1 % | 79 % | 9 % | 5 % | 3 % | 200 | utilisable | `oui` |
| Sainte-Gemmes-sur-Loire (49278) | 1 % | 73 % | 15 % | 8 % | 2 % | 159 | utilisable | `oui` |
| Cholet (49099) | 1 % | 62 % | 0 % | 32 % | 2 % | 135 | fragile | `ordre de grandeur` |
| Loire-Authion (49307) | 1 % | 90 % | 0 % | 7 % | 1 % | 113 | fragile | `ordre de grandeur` |
| Brissac Loire Aubance (49050) | 1 % | 93 % | 2 % | 4 % | 2 % | 93 | fragile | `ordre de grandeur` |
| Montreuil-Juigné (49214) | 1 % | 80 % | 4 % | 13 % | 1 % | 94 | fragile | `ordre de grandeur` |
| Segré-en-Anjou Bleu (49331) | 1 % | 95 % | 2 % | 2 % | 0 % | 96 | fragile | `ordre de grandeur` |
| Le Mans (72181) | 1 % | 37 % | 3 % | 55 % | 5 % | 108 | fragile | `ordre de grandeur` |
| Bouchemaine (49035) | 0,4 % | 79 % | 4 % | 14 % | 2 % | 84 | fragile | `ordre de grandeur` |
| Chemillé-en-Anjou (49092) | 0,4 % | 81 % | 0 % | 19 % | 0 % | 75 | fragile | `ordre de grandeur` |
| Mûrs-Erigné (49223) | 0,4 % | 91 % | 0 % | 9 % | 1 % | 73 | fragile | `ordre de grandeur` |
| Saumur (49328) | 0,4 % | 54 % | 2 % | 43 % | 1 % | 87 | fragile | `ordre de grandeur` |
| Sablé-sur-Sarthe (72264) | 0,4 % | 37 % | 3 % | 60 % | 0 % | 78 | fragile | `ordre de grandeur` |
| Ancenis-Saint-Géréon (44003) | 0,3 % | 73 % | 3 % | 25 % | 0 % | 53 | fragile | `ordre de grandeur` |
| Le Lion-d'Angers (49176) | 0,3 % | 91 % | 2 % | 7 % | 0 % | 54 | fragile | `ordre de grandeur` |
| Longuenée-en-Anjou (49200) | 0,3 % | 98 % | 0 % | 2 % | 0 % | 63 | fragile | `ordre de grandeur` |
| Saint-Léger-de-Linières (49298) | 0,3 % | 88 % | 5 % | 5 % | 0 % | 67 | fragile | `ordre de grandeur` |
| Beaufort-en-Anjou (49021) | 0,2 % | 93 % | 2 % | 5 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Mauges-sur-Loire (49244) | 0,2 % | 97 % | 0 % | 4 % | 0 % | 47 | fragile | `ordre de grandeur` |
| Saint-Georges-sur-Loire (49283) | 0,2 % | 81 % | 0 % | 19 % | 0 % | 47 | fragile | `ordre de grandeur` |
| Seiches-sur-le-Loir (49333) | 0,2 % | 99 % | 0 % | 1 % | 0 % | 51 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Angers (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 32 050 à 128 200), avec au moins 150 lignes d'échantillon ; Angers exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Angers qui vont travailler principalement en voiture (valeur comparée) | 54 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 32 communes du groupe (chaque commune compte une fois) | 57 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Angers moins la médiane du groupe (valeurs arrondies) | -3 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 32 | `oui` |

Communes du groupe (32, pour la vérification ; ne pas les citer) : Aix-en-Provence, Amiens, Annecy, Besançon, Bordeaux, Boulogne-Billancourt, Brest, Caen, Cherbourg-en-Cotentin, Clermont-Ferrand, Dijon, Grenoble, Le Havre, Le Mans, Lille, Limoges, Metz, Montpellier, Mulhouse, Nancy, Nîmes, Orléans, Perpignan, Poitiers, Reims, Rennes, Rouen, Saint-Étienne, Strasbourg, Toulon, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Angers. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Angers | Lignes (vers Angers) | Statut (vers Angers) | Usage (vers Angers) |
|---|---:|---:|---:|---:|---:|---|---|
| Trélazé (49353) | 78 % | 5 % | 9 % | 80 % | 904 | utilisable | `oui` |
| Avrillé (49015) | 72 % | 6 % | 15 % | 66 % | 876 | utilisable | `oui` |
| Les Ponts-de-Cé (49246) | 78 % | 7 % | 8 % | 78 % | 680 | utilisable | `oui` |
| Saint-Barthélemy-d'Anjou (49267) | 78 % | 3 % | 11 % | 77 % | 278 | utilisable | `oui` |
| Verrières-en-Anjou (49323) | 85 % | 3 % | 5 % | 90 % | 277 | utilisable | `oui` |
| Bouchemaine (49035) | 80 % | 5 % | 8 % | 81 % | 236 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Angers (49007) | 94 % | 80 % | 90 % | 75 % | 69 % |
| Trélazé (49353) | 77 % | 49 % | 74 % | 43 % | 55 % |
| Avrillé (49015) | 67 % | 53 % | 67 % | 36 % | 0 % |
| Les Ponts-de-Cé (49246) | 73 % | 58 % | 56 % | 37 % | 3 % |
| Saint-Barthélemy-d'Anjou (49267) | 46 % | 44 % | 67 % | 35 % | 36 % |
| Verrières-en-Anjou (49323) | 50 % | 38 % | 43 % | 30 % | 0 % |
| Bouchemaine (49035) | 46 % | 22 % | 40 % | 16 % | 0 % |

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
| Carte de situation : Angers et Trélazé (49353), Avrillé (49015), Les Ponts-de-Cé (49246), Saint-Barthélemy-d'Anjou (49267), Verrières-en-Anjou (49323) et Bouchemaine (49035) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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
| Équipements autour d'une adresse | oui | **oui** | Au plus une mention générale, dans l'examen de l'adresse (« ce qui se trouve à proximité ») ; pas de détail (distances, nombre à moins de 500 m) ni de liste |
| Équipement automobile du secteur | oui | **oui** | Au plus une mention générale, dans l'examen de l'adresse (la place de la voiture dans le secteur) ; pas de détail ni de liste |
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


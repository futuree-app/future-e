# Dossier d'entrée de rédaction · Besançon (25056)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-03-codex/25056/fiche/fiche.json` (générée le 2026-10-15T11:38:45Z, jour de référence 2026-10-13, sha256 `bfbedde39f14ac64`). Dossier généré le 2026-10-15T11:42:17Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Besançon (25056), département 25, intercommunalité CU Grand Besançon Métropole.
- **Groupe de communes nommé** : Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 25601 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 13 % [IC 95 % : 13 % à 14 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 7 % [IC 95 % : 6 % à 7 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 56 % [IC 95 % : 55 % à 57 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 20 % [IC 95 % : 19 % à 21 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon, y compris ceux qui ne se déplacent pas | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Besançon même | 77 % [IC 95 % : 76 % à 78 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon | commune de résidence et de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Besançon | 49 % [IC 95 % : 48 % à 50 %] | actifs occupés de 15 ans ou plus résidant à Besançon qui travaillent à Besançon | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | 83 % [IC 95 % : 79 % à 87 %] | actifs occupés de 15 ans ou plus résidant à Besançon qui travaillent dans l'une de ces communes : Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | commune de travail : Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Besançon et hors de Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | 79 % [IC 95 % : 78 % à 81 %] | actifs occupés de 15 ans ou plus résidant à Besançon qui travaillent hors de Besançon et hors de Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | commune de travail : toute commune autre que Besançon, Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) moins travail à Besançon | +34 points | deux groupes distincts (voir les deux faits) | commune de travail : Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 14 % [IC 95 % : 14 % à 15 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 31 % [IC 95 % : 30 % à 32 %] | tous les actifs occupés de 15 ans ou plus résidant à Besançon | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Besançon dont le ménage a au moins une voiture | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 61 % [IC 95 % : 59 % à 62 %] | actifs occupés de 15 ans ou plus résidant à Besançon, propriétaires de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés de 15 ans ou plus résidant à Besançon, propriétaires de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 5 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Besançon, propriétaires de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 45 % [IC 95 % : 43 % à 47 %] | actifs occupés de 15 ans ou plus résidant à Besançon, propriétaires de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 55 % [IC 95 % : 53 % à 57 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires du privé de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 6 % [IC 95 % : 5 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires du privé de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 21 % [IC 95 % : 20 % à 23 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires du privé de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 24 % [IC 95 % : 23 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires du privé de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 56 % [IC 95 % : 53 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires HLM de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires HLM de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 24 % [IC 95 % : 22 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires HLM de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 23 % [IC 95 % : 21 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Besançon, locataires HLM de leur logement | commune de résidence : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Besançon | environ 73 200 | — | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Besançon, de ceux qui habitent Besançon | 50 % | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Besançon et habitent Besançon | 49 % [IC 95 % : 48 % à 50 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent Besançon | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Besançon et habitent Besançon | 22 % [IC 95 % : 21 % à 23 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent Besançon | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Besançon, de ceux qui habitent une autre commune de l'unité urbaine INSEE 25601 (liste des communes non exposée par la fiche) | 7 % | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Besançon et habitent une autre commune de l'unité urbaine INSEE 25601 (liste des communes non exposée par la fiche) | 87 % [IC 95 % : 84 % à 89 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 25601 (liste des communes non exposée par la fiche) | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Besançon et habitent une autre commune de l'unité urbaine INSEE 25601 (liste des communes non exposée par la fiche) | 6 % [IC 95 % : 4 % à 8 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 25601 (liste des communes non exposée par la fiche) | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Besançon, de ceux qui habitent hors de l'unité urbaine INSEE 25601 | 43 % | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Besançon et habitent hors de l'unité urbaine INSEE 25601 | 90 % [IC 95 % : 89 % à 91 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 25601 | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Besançon et habitent hors de l'unité urbaine INSEE 25601 | 8 % [IC 95 % : 7 % à 9 %] | actifs occupés qui travaillent à Besançon, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 25601 | commune de travail : Besançon (25056) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Chamars (IRIS 250560101) | 30 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Besançon (25056), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Torcols (IRIS 250560905) | 77 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Besançon (25056), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +47 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Besançon (25056), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 28 % | toutes les résidences principales de Besançon | commune : Besançon (25056) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 18 % | toutes les résidences principales de Besançon | commune : Besançon (25056) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 52 % | toutes les résidences principales de Besançon | commune : Besançon (25056) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.25056.commerce_alim_500m` | Part des adresses de Besançon qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.grande_surface_500m` | Part des adresses de Besançon qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 54 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.pharmacie_500m` | Part des adresses de Besançon qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 76 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.medecin_generaliste_500m` | Part des adresses de Besançon qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 84 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.ecole_elementaire_500m` | Part des adresses de Besançon qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 78 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.college_1km` | Part des adresses de Besançon qui ont un collège à moins de 1 km (à vol d'oiseau) | 83 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.gare_2km` | Part des adresses de Besançon qui ont une gare à moins de 2 km (à vol d'oiseau) | 69 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.panier_quotidien_500m` | Part des adresses de Besançon qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 68 % | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.25056.bus_8h_7_9h` | Part des adresses de Besançon qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.25056.aucun_bus_7_9h` | Part des adresses de Besançon sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.25056.bus_4h_20_22h` | Part des adresses de Besançon qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Besançon, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Besançon (25056) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Ginko » (https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,36 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,61 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,75 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,19 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,67 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,52 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Besançon (centre communal de geo.api.gouv.fr : [6.0123, 47.2602]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-03-codex/25056/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CU Grand Besançon Métropole s'appelle « Ginko » ; son autorité organisatrice est CU Grand Besançon Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Ginko » : https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-09-25 | intercommunalité CU Grand Besançon Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Ginko est https://www.ginko.voyage. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/gtfs-et-siri-du-reseau-ginko-besancon-lignes-urbaines-et-periurbaines ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Ginko | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.samedi` | Le réseau Ginko est gratuit le samedi (tram, bus, car, parkings relais), sans titre de transport, de 04h30 le samedi à 02h30 le dimanche. | https://www.ginko.voyage/tarifs (extrait vérifié le 2026-10-15 : « Le samedi, le réseau Ginko est gratuit (tram, bus, car, parkings relais) : pas de titre de transport nécessaire ») | 2026-10-15 | non précisée (la page renvoie à un astérisque de conditions que je n'ai pas lu) | réseau Ginko ; Tout public, tout le réseau (tram, bus, car, parkings relais) ; les autres jours restent payants ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarification.moins4ans` | Les enfants de moins de 4 ans voyagent gratuitement sans titre de transport. | https://www.ginko.voyage/tarifs (extrait vérifié le 2026-10-15 : « Les enfants de moins de 4 ans peuvent voyager gratuitement sur le réseau Ginko (pas de titre de transport nécessaire). ») | 2026-10-15 | non précisée | réseau Ginko ; Enfants de moins de 4 ans, réseau Ginko ; application à chaque commune non établie | `oui` |  |
| `doc.tarification.pass4-14` | Le PASS 4/14 ans annuel est affiché à 0,00 €. Il exige une carte Ginko Mobilités à 4 €, donc le réseau n'est pas gratuit en général pour les 4-14 ans sans démarche. | https://www.ginko.voyage/tarifs (extrait vérifié le 2026-10-15 : « PASS 4/14 ans (annuel) ») | 2026-10-15 | Annuel, à renouveler chaque année (selon la page) | réseau Ginko ; Enfants de 4 à 14 ans et collégiens plus âgés, avec justificatifs ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.itineraire.calcul` | Une page de calcul d'itinéraire existe. Ses résultats ne tiennent compte ni des horaires en temps réel ni des perturbations. | https://www.ginko.voyage/se-deplacer/calcul-ditineraires (extrait vérifié le 2026-10-15 : « ne prennent pas en compte les horaires en temps réel ni les perturbations et déviations en cours ») | 2026-10-15 | non précisée | réseau Ginko ; Réseau Ginko ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.temps-reel.arret` | La page Horaires & affluences propose les horaires et l'affluence en temps réel à l'arrêt. Elle renvoie aussi à des rubriques « Horaires à l'arrêt » et « Calendrier voyageurs ». | https://www.ginko.voyage/se-deplacer/horaires-affluences (extrait vérifié le 2026-10-15 : « Consultez les horaires et l'affluence en temps réel à votre arrêt ») | 2026-10-15 | non précisée | réseau Ginko ; Réseau Ginko ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Jours de circulation des lignes urbaines (dimanche, jours fériés, samedi) | `introuvable` | https://www.ginko.voyage/se-deplacer/horaires-affluences 2026-10-15 | Aucune page lue ne décrit le service général du dimanche ni des jours fériés. Un résumé de la page d'accueil mentionne la ligne Citadelle 7j/7 et des services Ginko Hôpital et Cliniques les dimanches et jours fériés. Je n'ai pas ouvert ces pages, je ne les enregistre donc pas. Ça ne dit rien de l'absence de service sur les autres lignes. |
| Période de validité des horaires | `introuvable` | https://www.ginko.voyage/se-deplacer/horaires-affluences/calendrier-voyageurs 2026-10-15 | Le résumé de la page d'accueil évoque un calendrier « jour bleu » et des horaires de rentrée au 1er septembre. Je n'ai pas vérifié ces pages et je ne peux pas enregistrer de période de validité. |
| Gratuité des 0-14 ans / page nouveaux tarifs | `inaccessible` | https://www.ginko.voyage/tarifs/nouveaux-tarifs-au-1er-juillet 2026-10-15 | Erreur 404. La page /tarifs ne montre pas de gratuité générale pour les 0-14 ans, seulement moins de 4 ans gratuits et PASS 4/14 ans à 0 € avec carte à 4 €. L'astérisque sur les conditions de la gratuité du samedi n'a pas été lu. |
| Fiches horaires par ligne | `introuvable` | https://www.ginko.voyage/se-deplacer/horaires-affluences 2026-10-15 | Aucune fiche horaire téléchargeable repérée sur la page lue. |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 250560101 | Chamars | utilisable | `oui` | 1454 | 30 % | 8 % | 29 % | 28 % | 44 % | 28 % | 98 % |
| 250560401 | Marulaz | utilisable | `oui` | 722 | 30 % | 13 % | 32 % | 22 % | 49 % | 15 % | 100 % |
| 250560102 | République | utilisable | `oui` | 1408 | 31 % | 7 % | 31 % | 27 % | 44 % | 29 % | 100 % |
| 250560103 | Sarrail | utilisable | `oui` | 1028 | 33 % | 9 % | 23 % | 30 % | 45 % | 24 % | 100 % |
| 250560703 | Risler | utilisable | `oui` | 1327 | 34 % | 6 % | 22 % | 22 % | 23 % | 60 % | 94 % |
| 250560104 | Citadelle | utilisable | `oui` | 1037 | 34 % | 11 % | 22 % | 28 % | 46 % | 26 % | 62 % |
| 250560402 | Rue Battant | utilisable | `oui` | 895 | 35 % | 12 % | 33 % | 19 % | 52 % | 18 % | 91 % |
| 250560502 | Fontaine Argent | utilisable | `oui` | 1953 | 37 % | 10 % | 28 % | 23 % | 31 % | 62 % | 94 % |
| 250560501 | Mouillère | utilisable | `oui` | 1302 | 42 % | 6 % | 21 % | 26 % | 26 % | 65 % | 91 % |
| 250561207 | Cassin | utilisable | `oui` | 482 | 43 % | 5 % | 37 % | 14 % | 44 % | 40 % | 100 % |
| 250561204 | Piémont | utilisable | `oui` | 597 | 43 % | 4 % | 30 % | 19 % | 54 % | 7 % | 100 % |
| 250560804 | Bouloie | utilisable | `oui` | 981 | 49 % | 4 % | 35 % | 9 % | 41 % | 33 % | 3 % |
| 250561205 | Diderot | utilisable | `oui` | 642 | 51 % | 1 % | 35 % | 12 % | 51 % | 13 % | 100 % |
| 250561203 | Île-de-France | utilisable | `oui` | 625 | 51 % | 2 % | 30 % | 16 % | 39 % | 10 % | 100 % |
| 250560302 | Vieilles Perrières | utilisable | `oui` | 996 | 52 % | 10 % | 21 % | 14 % | 20 % | 67 % | 100 % |
| 250561004 | Palente | utilisable | `oui` | 963 | 53 % | 5 % | 31 % | 7 % | 30 % | 43 % | 58 % |
| 250560701 | Rosemont | utilisable | `oui` | 705 | 53 % | 7 % | 28 % | 9 % | 29 % | 55 % | 53 % |
| 250560503 | Rotonde | utilisable | `oui` | 1190 | 53 % | 9 % | 19 % | 15 % | 31 % | 53 % | 74 % |
| 250560902 | Viotte | utilisable | `oui` | 1054 | 54 % | 7 % | 23 % | 14 % | 23 % | 60 % | 100 % |
| 250560504 | Chaprais | utilisable | `oui` | 934 | 55 % | 6 % | 21 % | 14 % | 22 % | 61 % | 84 % |
| 250561201 | Époisses-Champagne | utilisable | `oui` | 446 | 56 % | 1 % | 22 % | 16 % | 40 % | 18 % | 100 % |
| 250560803 | Fontaine Écu | utilisable | `oui` | 661 | 57 % | 13 % | 15 % | 11 % | 25 % | 55 % | 92 % |
| 250560505 | Chasnot | utilisable | `oui` | 1280 | 58 % | 8 % | 22 % | 10 % | 21 % | 70 % | 89 % |
| 250560901 | Montjoux | utilisable | `oui` | 967 | 58 % | 8 % | 19 % | 14 % | 19 % | 70 % | 98 % |
| 250560506 | Parc des Chaprais | utilisable | `oui` | 980 | 59 % | 11 % | 15 % | 13 % | 28 % | 48 % | 79 % |
| 250560301 | Grette | fragile (226 actifs (< 300)) | `ordre de grandeur` | 226 | 59 % | 11 % | 17 % | 6 % | 24 % | 63 % | 41 % |
| 250561202 | Époisses-Bourgogne | utilisable | `oui` | 429 | 60 % | 2 % | 27 % | 8 % | 53 % | 11 % | 100 % |
| 250561101 | Chaffanjon | utilisable | `oui` | 911 | 61 % | 13 % | 15 % | 8 % | 13 % | 79 % | 88 % |
| 250560303 | Villarceau | utilisable | `oui` | 906 | 61 % | 6 % | 17 % | 11 % | 16 % | 63 % | 99 % |
| 250561003 | Chopin | utilisable | `oui` | 593 | 61 % | 1 % | 29 % | 6 % | 36 % | 30 % | 80 % |
| 250561002 | Cras | utilisable | `oui` | 691 | 61 % | 4 % | 21 % | 11 % | 23 % | 57 % | 72 % |
| 250560201 | Velotte | utilisable | `oui` | 1134 | 62 % | 15 % | 13 % | 2 % | 9 % | 79 % | 4 % |
| 250561206 | Victor Hugo | utilisable | `oui` | 626 | 63 % | 3 % | 22 % | 9 % | 28 % | 55 % | 83 % |
| 250560805 | Montboucons | utilisable | `oui` | 1105 | 65 % | 5 % | 19 % | 8 % | 30 % | 57 % | 18 % |
| 250560304 | Xavier Marmier | utilisable | `oui` | 1462 | 66 % | 8 % | 13 % | 12 % | 19 % | 63 % | 60 % |
| 250561209 | Saint-Laurent | utilisable | `oui` | 612 | 67 % | 5 % | 13 % | 12 % | 13 % | 60 % | 28 % |
| 250560601 | Brégille | utilisable | `oui` | 1430 | 67 % | 8 % | 13 % | 7 % | 19 % | 66 % | 24 % |
| 250561001 | Rue de Belfort | utilisable | `oui` | 632 | 68 % | 2 % | 19 % | 5 % | 18 % | 53 % | 75 % |
| 250560904 | Rue de Vesoul | utilisable | `oui` | 1865 | 69 % | 6 % | 9 % | 9 % | 16 % | 64 % | 43 % |
| 250561104 | Clairs Soleils | utilisable | `oui` | 530 | 70 % | 6 % | 15 % | 8 % | 26 % | 52 % | 71 % |
| 250560702 | Saint-Ferjeux | utilisable | `oui` | 869 | 70 % | 4 % | 19 % | 6 % | 34 % | 53 % | 44 % |
| 250560801 | Observatoire | utilisable | `oui` | 1134 | 70 % | 5 % | 12 % | 11 % | 20 % | 73 % | 5 % |
| 250560802 | Montrapon | utilisable | `oui` | 1442 | 70 % | 5 % | 14 % | 8 % | 24 % | 44 % | 99 % |
| 250561005 | Saragosse | utilisable | `oui` | 870 | 70 % | 9 % | 12 % | 4 % | 14 % | 69 % | 28 % |
| 250560903 | Trey | utilisable | `oui` | 777 | 71 % | 5 % | 15 % | 6 % | 20 % | 63 % | 98 % |
| 250561105 | Vaite | utilisable | `oui` | 552 | 72 % | 4 % | 18 % | 2 % | 21 % | 72 % | 36 % |
| 250560905 | Torcols | utilisable | `oui` | 2045 | 77 % | 3 % | 13 % | 3 % | 13 % | 71 % | 12 % |
| 250561210 | Châteaufarine | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 250561301 | Tilleroyes | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 250560105 | Chapelle des Buis | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 250561208 | Lafayette | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 250561401 | Chailluz | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Besançon)

Actifs qui habitent l'ensemble de Besançon, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Besançon (25056) | 77 % | 49 % | 8 % | 22 % | 17 % | 11247 | utilisable | `oui` |
| École-Valentin (25212) | 2 % | 85 % | 2 % | 10 % | 1 % | 227 | utilisable | `oui` |
| Saint-Vit (25527) | 1 % | 85 % | 0 % | 15 % | 0 % | 119 | fragile | `ordre de grandeur` |
| 99999 (99999) | 1 % | 81 % | 2 % | 10 % | 3 % | 120 | fragile | `ordre de grandeur` |
| Chalezeule (25112) | 1 % | 66 % | 4 % | 24 % | 2 % | 95 | fragile | `ordre de grandeur` |
| Châtillon-le-Duc (25133) | 1 % | 83 % | 4 % | 11 % | 1 % | 107 | fragile | `ordre de grandeur` |
| Chemaudin et Vaux (25147) | 1 % | 94 % | 2 % | 1 % | 2 % | 86 | fragile | `ordre de grandeur` |
| Novillars (25429) | 1 % | 96 % | 0 % | 0 % | 3 % | 75 | fragile | `ordre de grandeur` |
| Pirey (25454) | 1 % | 88 % | 6 % | 3 % | 3 % | 80 | fragile | `ordre de grandeur` |
| Thise (25560) | 1 % | 85 % | 4 % | 9 % | 2 % | 88 | fragile | `ordre de grandeur` |
| Dole (39198) | 1 % | 59 % | 0 % | 39 % | 1 % | 75 | fragile | `ordre de grandeur` |
| Vesoul (70550) | 1 % | 81 % | 0 % | 19 % | 0 % | 101 | fragile | `ordre de grandeur` |
| Dijon (21231) | 1 % | 49 % | 2 % | 49 % | 0 % | 62 | fragile | `ordre de grandeur` |
| Miserey-Salines (25381) | 1 % | 79 % | 0 % | 21 % | 0 % | 71 | fragile | `ordre de grandeur` |
| Pontarlier (25462) | 1 % | 81 % | 0 % | 19 % | 0 % | 77 | fragile | `ordre de grandeur` |
| Valdahon (25578) | 1 % | 89 % | 2 % | 8 % | 0 % | 75 | fragile | `ordre de grandeur` |
| Avanne-Aveney (25036) | 0,4 % | 73 % | 3 % | 14 % | 11 % | 54 | fragile | `ordre de grandeur` |
| Franois (25258) | 0,4 % | 70 % | 4 % | 22 % | 4 % | 63 | fragile | `ordre de grandeur` |
| Montbéliard (25388) | 0,4 % | 54 % | 2 % | 39 % | 3 % | 65 | fragile | `ordre de grandeur` |
| Ornans (25434) | 0,4 % | 86 % | 2 % | 12 % | 0 % | 69 | fragile | `ordre de grandeur` |
| Roche-lez-Beaupré (25495) | 0,4 % | 76 % | 0 % | 21 % | 3 % | 61 | fragile | `ordre de grandeur` |
| Serre-les-Sapins (25542) | 0,4 % | 100 % | 0 % | 0 % | 0 % | 49 | fragile | `ordre de grandeur` |
| Baume-les-Dames (25047) | 0,3 % | 79 % | 0 % | 21 % | 0 % | 43 | fragile | `ordre de grandeur` |
| Devecey (25200) | 0,3 % | 92 % | 0 % | 8 % | 0 % | 44 | fragile | `ordre de grandeur` |
| Pelousey (25448) | 0,3 % | 81 % | 0 % | 18 % | 1 % | 44 | fragile | `ordre de grandeur` |
| Pouilley-les-Vignes (25467) | 0,3 % | 97 % | 0 % | 3 % | 0 % | 42 | fragile | `ordre de grandeur` |
| Quingey (25475) | 0,3 % | 86 % | 0 % | 11 % | 3 % | 43 | fragile | `ordre de grandeur` |
| Saône (25532) | 0,3 % | 90 % | 0 % | 10 % | 0 % | 52 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Besançon (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 23 843 à 95 372), avec au moins 150 lignes d'échantillon ; Besançon exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Besançon qui vont travailler principalement en voiture (valeur comparée) | 56 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 42 communes du groupe (chaque commune compte une fois) | 62 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Besançon moins la médiane du groupe (valeurs arrondies) | -6 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 42 | `oui` |

Communes du groupe (42, pour la vérification ; ne pas les citer) : Aix-en-Provence, Ajaccio, Amiens, Angers, Annecy, Avignon, Bayonne, Boulogne-Billancourt, Bourges, Brest, Béziers, Caen, Chambéry, Cherbourg-en-Cotentin, Clermont-Ferrand, Colmar, Dijon, Dunkerque, Grenoble, La Rochelle, Le Havre, Le Mans, Limoges, Metz, Montauban, Mulhouse, Nancy, Niort, Nîmes, Orléans, Pau, Perpignan, Poitiers, Quimper, Reims, Rouen, Saint-Nazaire, Saint-Étienne, Toulon, Tours, Valence, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Besançon. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Besançon | Lignes (vers Besançon) | Statut (vers Besançon) | Usage (vers Besançon) |
|---|---:|---:|---:|---:|---:|---|---|
| Thise (25560) | 85 % | 4 % | 4 % | 87 % | 135 | fragile | `ordre de grandeur` |
| École-Valentin (25212) | 82 % | 6 % | 4 % | 89 % | 132 | fragile | `ordre de grandeur` |
| Miserey-Salines (25381) | 83 % | 5 % | 6 % | 89 % | 113 | fragile | `ordre de grandeur` |
| Avanne-Aveney (25036) | 80 % | 8 % | 3 % | 79 % | 107 | fragile | `ordre de grandeur` |
| Pirey (25454) | 87 % | 1 % | 4 % | 93 % | 115 | fragile | `ordre de grandeur` |
| Châtillon-le-Duc (25133) | 91 % | 1 % | 5 % | 95 % | 79 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Besançon (25056) | 86 % | 76 % | 78 % | 68 % | 69 % |
| Thise (25560) | 70 % | 44 % | 42 % | 38 % | 0,3 % |
| École-Valentin (25212) | 38 % | 6 % | 33 % | 0 % | 100 % |
| Miserey-Salines (25381) | 51 % | 35 % | 28 % | 13 % | 66 % |
| Avanne-Aveney (25036) | 70 % | 34 % | 31 % | 26 % | 2 % |
| Pirey (25454) | 57 % | 39 % | 48 % | 10 % | 1 % |
| Châtillon-le-Duc (25133) | 20 % | 22 % | 9 % | 0 % | 20 % |

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
| Carte de situation : Besançon et Thise (25560), École-Valentin (25212), Miserey-Salines (25381), Avanne-Aveney (25036), Pirey (25454) et Châtillon-le-Duc (25133) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


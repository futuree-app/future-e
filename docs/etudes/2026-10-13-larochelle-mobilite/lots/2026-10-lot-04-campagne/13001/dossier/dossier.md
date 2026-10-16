# Dossier d'entrée de rédaction · Aix-en-Provence (13001)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/13001/fiche/fiche.json` (générée le 2026-10-15T16:09:24Z, jour de référence 2026-10-13, sha256 `b12fdfea79acbc5e`). Dossier généré le 2026-10-15T16:20:23Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Aix-en-Provence (13001), département 13, intercommunalité Métropole d'Aix-Marseille-Provence.
- **Groupe de communes nommé** : Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00759 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 4 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 3 % [IC 95 % : 3 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 63 % [IC 95 % : 62 % à 64 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 16 % [IC 95 % : 16 % à 17 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, y compris ceux qui ne se déplacent pas | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Aix-en-Provence même | 66 % [IC 95 % : 65 % à 67 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence | commune de résidence et de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Aix-en-Provence | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence qui travaillent à Aix-en-Provence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | 76 % [IC 95 % : 72 % à 80 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence qui travaillent dans l'une de ces communes : Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | commune de travail : Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Aix-en-Provence et hors de Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | 78 % [IC 95 % : 76 % à 79 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence qui travaillent hors de Aix-en-Provence et hors de Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | commune de travail : toute commune autre que Aix-en-Provence, Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) moins travail à Aix-en-Provence | +20 points | deux groupes distincts (voir les deux faits) | commune de travail : Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 42 % [IC 95 % : 41 % à 43 %] | tous les actifs occupés de 15 ans ou plus résidant à Aix-en-Provence | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 30 % [IC 95 % : 29 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence dont le ménage a au moins une voiture | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 71 % [IC 95 % : 70 % à 73 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, propriétaires de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, propriétaires de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 3 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, propriétaires de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 59 % [IC 95 % : 58 % à 61 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, propriétaires de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 58 % [IC 95 % : 56 % à 59 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires du privé de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires du privé de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 18 % [IC 95 % : 17 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires du privé de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 30 % [IC 95 % : 29 % à 32 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires du privé de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 62 % [IC 95 % : 59 % à 64 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires HLM de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 1 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires HLM de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 14 % [IC 95 % : 12 % à 16 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires HLM de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 33 % [IC 95 % : 30 % à 35 %] | actifs occupés de 15 ans ou plus résidant à Aix-en-Provence, locataires HLM de leur logement | commune de résidence : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Aix-en-Provence | environ 102 700 | — | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Aix-en-Provence, de ceux qui habitent Aix-en-Provence | 41 % | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Aix-en-Provence et habitent Aix-en-Provence | 56 % [IC 95 % : 55 % à 57 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent Aix-en-Provence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Aix-en-Provence et habitent Aix-en-Provence | 15 % [IC 95 % : 14 % à 16 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent Aix-en-Provence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Aix-en-Provence, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00759 (liste des communes non exposée par la fiche) | 25 % | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Aix-en-Provence et habitent une autre commune de l'unité urbaine INSEE 00759 (liste des communes non exposée par la fiche) | 92 % [IC 95 % : 91 % à 93 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00759 (liste des communes non exposée par la fiche) | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Aix-en-Provence et habitent une autre commune de l'unité urbaine INSEE 00759 (liste des communes non exposée par la fiche) | 5 % [IC 95 % : 4 % à 5 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00759 (liste des communes non exposée par la fiche) | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Aix-en-Provence, de ceux qui habitent hors de l'unité urbaine INSEE 00759 | 34 % | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Aix-en-Provence et habitent hors de l'unité urbaine INSEE 00759 | 85 % [IC 95 % : 84 % à 86 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00759 | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Aix-en-Provence et habitent hors de l'unité urbaine INSEE 00759 | 12 % [IC 95 % : 11 % à 13 %] | actifs occupés qui travaillent à Aix-en-Provence, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00759 | commune de travail : Aix-en-Provence (13001) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Cardeurs (IRIS 130010102) | 19 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Aix-en-Provence (13001), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Sud-Est Plateau Puyricard (IRIS 130010801) | 84 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Aix-en-Provence (13001), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +65 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Aix-en-Provence (13001), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 24 % | toutes les résidences principales de Aix-en-Provence | commune : Aix-en-Provence (13001) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 25 % | toutes les résidences principales de Aix-en-Provence | commune : Aix-en-Provence (13001) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 57 % | toutes les résidences principales de Aix-en-Provence | commune : Aix-en-Provence (13001) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.13001.commerce_alim_500m` | Part des adresses de Aix-en-Provence qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 84 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.grande_surface_500m` | Part des adresses de Aix-en-Provence qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 46 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.pharmacie_500m` | Part des adresses de Aix-en-Provence qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 74 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.medecin_generaliste_500m` | Part des adresses de Aix-en-Provence qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.ecole_elementaire_500m` | Part des adresses de Aix-en-Provence qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 73 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.college_1km` | Part des adresses de Aix-en-Provence qui ont un collège à moins de 1 km (à vol d'oiseau) | 77 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.gare_2km` | Part des adresses de Aix-en-Provence qui ont une gare à moins de 2 km (à vol d'oiseau) | 57 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.panier_quotidien_500m` | Part des adresses de Aix-en-Provence qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 65 % | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.13001.bus_8h_7_9h` | Part des adresses de Aix-en-Provence qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.13001.aucun_bus_7_9h` | Part des adresses de Aix-en-Provence sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.13001.bus_4h_20_22h` | Part des adresses de Aix-en-Provence qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Aix-en-Provence, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Aix-en-Provence (13001) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseaux urbains de la Métropole Aix-Marseille-Provence » (https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,30 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,58 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,72 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,14 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,64 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,50 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Aix-en-Provence (centre communal de geo.api.gouv.fr : [5.3879, 43.536]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/13001/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Métropole d'Aix-Marseille-Provence s'appelle « Marseille » ; son autorité organisatrice est Métropole d'Aix-Marseille-Provence. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseaux urbains de la Métropole Aix-Marseille-Provence » : https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-14 | intercommunalité Métropole d'Aix-Marseille-Provence ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Marseille est https://www.rtm.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Marseille | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_enfants_seniors` | Le voyage est gratuit pour les enfants de moins de 11 ans et les seniors de 65 ans et plus. Il s'agit d'un pass gratuit sur demande, pas d'une gratuité générale du réseau. La page précise le périmètre : « zone jaune », 92 communes. | https://www.rtm.fr/droits-reduction (extrait vérifié le 2026-10-15 : « les enfants de moins de 11 ans et les seniors de 65 ans et plus ») | 2026-10-15 | non précisée | réseau Marseille ; Enfants de moins de 11 ans et seniors de 65 ans et plus. Réseaux métropolitains de la zone jaune (92 communes) : bus, cars, tram, métro, bus à la demande, navettes maritimes, lignes aéroport A1 et A2. Les parkings-relais ne sont couverts que pour le pass senior. Hors TER, levélo et bateau du Frioul. ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarification.demande_gratuite` | La page d'accueil propose une demande de gratuité pour les enfants et les seniors, ce qui montre que la gratuité n'est pas automatique. | https://www.rtm.fr/ (extrait vérifié le 2026-10-15 : « Demande de gratuité pour les enfants de moins de 11 ans et les séniors de plus de 65 ans. ») | 2026-10-15 | non précisée | réseau Marseille ; Enfants de moins de 11 ans et seniors de plus de 65 ans ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.horaires_temps_reel` | La page des horaires par ligne s'intitule « Horaires des lignes en temps réel ». C'est l'endroit pour vérifier les horaires et le temps réel. | https://www.rtm.fr/horaires (extrait vérifié le 2026-10-15 : « Horaires des lignes en temps réel | RTM ») | 2026-10-15 | non précisée | réseau Marseille ; Réseau RTM ; application à chaque commune non établie | `oui` |  |
| `doc.verification.itineraire` | RTM propose une page de recherche d'itinéraire pour les secteurs Marseille, Allauch / Plan-de-Cuques, La Ciotat / Ceyreste, Aubagne, Gémenos et Martigues / Port-de-Bouc. | https://www.rtm.fr/itineraires (extrait vérifié le 2026-10-15 : « Recherche d'itinéraire - Se déplacer à Marseille en transport en commun ») | 2026-10-15 | non précisée | réseau Marseille ; Secteurs Marseille, Allauch / Plan-de-Cuques, La Ciotat / Ceyreste, Aubagne, Gémenos, Martigues / Port-de-Bouc ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité générale du réseau | `introuvable` | https://www.rtm.fr/ 2026-10-15 | Seule la gratuité pour les enfants de moins de 11 ans et les seniors de 65 ans et plus est trouvée. La page des tarifs (https://www.rtm.fr/tarifs) n'a pas été consultée. Je ne conclus pas à l'absence d'autres gratuités. |
| Jours de circulation des lignes urbaines (dimanche, fériés, samedi) et période de validité des horaires | `introuvable` | https://www.rtm.fr/horaires 2026-10-15 | La page /horaires, telle qu'elle m'a été restituée, ne contient que la navigation. Les fiches de chaque ligne n'ont pas été consultées. Aucun PDF n'a été ouvert. |
| Fréquences | `introuvable` | https://www.rtm.fr/horaires 2026-10-15 | Aucune fréquence donnée explicitement par une page consultée. |
| La gratuité enfants et seniors exclut le TER, levélo et le bateau du Frioul. | `non vérifié` | https://www.rtm.fr/droits-reduction 2026-10-15 | extrait introuvable sur la page |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 130010102 | Cardeurs | utilisable | `oui` | 1049 | 19 % | 4 % | 35 % | 33 % | 67 % | 11 % | 100 % |
| 130010105 | Tanneurs | utilisable | `oui` | 939 | 24 % | 2 % | 24 % | 43 % | 65 % | 14 % | 100 % |
| 130010104 | Hypercentre | utilisable | `oui` | 1074 | 25 % | 6 % | 25 % | 40 % | 61 % | 16 % | 100 % |
| 130010103 | Villeneuve | utilisable | `oui` | 905 | 29 % | 4 % | 23 % | 34 % | 52 % | 20 % | 100 % |
| 130010101 | Mazarin | utilisable | `oui` | 839 | 32 % | 3 % | 18 % | 33 % | 50 % | 29 % | 100 % |
| 130010202 | Couronne Nord | utilisable | `oui` | 907 | 34 % | 3 % | 28 % | 26 % | 46 % | 30 % | 97 % |
| 130010501 | Beisson | utilisable | `oui` | 494 | 41 % | 1 % | 39 % | 13 % | 39 % | 24 % | 89 % |
| 130010205 | Couronne Ouest partie nord | utilisable | `oui` | 933 | 43 % | 4 % | 30 % | 18 % | 43 % | 61 % | 100 % |
| 130010303 | Saint-Jérôme | utilisable | `oui` | 927 | 44 % | 5 % | 30 % | 15 % | 13 % | 80 % | 77 % |
| 130010302 | Facultés | utilisable | `oui` | 700 | 44 % | 4 % | 21 % | 21 % | 33 % | 50 % | 19 % |
| 130010204 | Couronne Sud | utilisable | `oui` | 910 | 47 % | 4 % | 18 % | 22 % | 29 % | 52 % | 98 % |
| 130010203 | Couronne Est | utilisable | `oui` | 1218 | 48 % | 3 % | 15 % | 25 % | 30 % | 56 % | 93 % |
| 130010206 | Couronne Ouest partie sud | utilisable | `oui` | 1705 | 48 % | 2 % | 22 % | 24 % | 39 % | 55 % | 100 % |
| 130010402 | Pont de Béraud | utilisable | `oui` | 1088 | 50 % | 7 % | 20 % | 19 % | 20 % | 65 % | 87 % |
| 130010305 | Pigonnet | utilisable | `oui` | 1006 | 51 % | 6 % | 24 % | 12 % | 17 % | 69 % | 86 % |
| 130010306 | Beauvalle | utilisable | `oui` | 1080 | 54 % | 3 % | 21 % | 18 % | 21 % | 64 % | 97 % |
| 130010301 | Fenouillères | utilisable | `oui` | 1546 | 55 % | 4 % | 21 % | 15 % | 24 % | 62 % | 78 % |
| 130010503 | Rocher du Dragon-Verte Colline | utilisable | `oui` | 947 | 57 % | 7 % | 15 % | 12 % | 16 % | 52 % | 16 % |
| 130010701 | Jas 6 | utilisable | `oui` | 1035 | 57 % | 1 % | 30 % | 6 % | 23 % | 33 % | 85 % |
| 130010602 | Encagnane 2 | utilisable | `oui` | 610 | 57 % | 1 % | 23 % | 17 % | 33 % | 4 % | 100 % |
| 130010505 | Les Lauves | utilisable | `oui` | 897 | 58 % | 3 % | 20 % | 10 % | 11 % | 75 % | 56 % |
| 130010606 | Corsy | utilisable | `oui` | 906 | 58 % | 4 % | 24 % | 8 % | 32 % | 43 % | 100 % |
| 130010603 | Encagnane 3 | utilisable | `oui` | 1000 | 58 % | 1 % | 29 % | 10 % | 31 % | 27 % | 100 % |
| 130010702 | Jas 1 | utilisable | `oui` | 1262 | 58 % | 7 % | 23 % | 5 % | 23 % | 52 % | 43 % |
| 130010604 | Encagnane 1 | utilisable | `oui` | 1134 | 60 % | 2 % | 21 % | 11 % | 24 % | 45 % | 100 % |
| 130010601 | Encagnane 4 | utilisable | `oui` | 593 | 61 % | 7 % | 22 % | 7 % | 26 % | 18 % | 100 % |
| 130010403 | Pinette | utilisable | `oui` | 681 | 62 % | 3 % | 20 % | 8 % | 14 % | 59 % | 71 % |
| 130010504 | Loubassanne | utilisable | `oui` | 1365 | 62 % | 5 % | 17 % | 8 % | 23 % | 61 % | 27 % |
| 130010401 | La Torse | utilisable | `oui` | 1279 | 64 % | 7 % | 12 % | 10 % | 18 % | 76 % | 54 % |
| 130010304 | Val Saint-André | utilisable | `oui` | 1406 | 64 % | 3 % | 19 % | 8 % | 20 % | 55 % | 92 % |
| 130010404 | Campagne Repentance | utilisable | `oui` | 771 | 64 % | 5 % | 10 % | 6 % | 8 % | 86 % | 4 % |
| 130010605 | Minimes | utilisable | `oui` | 939 | 64 % | 3 % | 16 % | 13 % | 16 % | 55 % | 78 % |
| 130010307 | Saint-Jérôme Est | utilisable | `oui` | 1074 | 66 % | 3 % | 14 % | 12 % | 18 % | 46 % | 91 % |
| 130010502 | Saint-Eutrope | utilisable | `oui` | 877 | 67 % | 1 % | 18 % | 10 % | 17 % | 22 % | 69 % |
| 130010705 | Jas 4 | utilisable | `oui` | 803 | 67 % | 0 % | 20 % | 6 % | 32 % | 33 % | 100 % |
| 130010901 | Pont de l'Arc-La Parade | utilisable | `oui` | 3426 | 69 % | 4 % | 18 % | 7 % | 25 % | 56 % | 63 % |
| 130010704 | Jas 3 | utilisable | `oui` | 416 | 70 % | 0 % | 20 % | 5 % | 34 % | 19 % | 100 % |
| 130010506 | Brunet | utilisable | `oui` | 894 | 71 % | 4 % | 10 % | 9 % | 8 % | 78 % | 15 % |
| 130010703 | Jas 2 | utilisable | `oui` | 944 | 71 % | 2 % | 17 % | 4 % | 24 % | 35 % | 100 % |
| 130010706 | Jas 5 | utilisable | `oui` | 412 | 71 % | 3 % | 19 % | 5 % | 27 % | 24 % | 100 % |
| 130010710 | Extension Ouest Partie Nord | utilisable | `oui` | 937 | 73 % | 2 % | 12 % | 3 % | 6 % | 88 % | 19 % |
| 130010709 | Extension Ouest Partie Est | utilisable | `oui` | 1590 | 74 % | 4 % | 11 % | 4 % | 6 % | 95 % | 42 % |
| 130010711 | Extension Ouest Partie Ouest | utilisable | `oui` | 1280 | 75 % | 1 % | 12 % | 4 % | 12 % | 84 % | 25 % |
| 130010902 | Montaiguet | utilisable | `oui` | 1490 | 79 % | 3 % | 10 % | 1 % | 9 % | 84 % | 2 % |
| 130010903 | Luynes Village | utilisable | `oui` | 2271 | 79 % | 2 % | 10 % | 2 % | 6 % | 84 % | 51 % |
| 130010803 | Puyricard Village | utilisable | `oui` | 1558 | 79 % | 2 % | 8 % | 3 % | 7 % | 89 % | 57 % |
| 130010707 | Campagne Ouest | utilisable | `oui` | 1662 | 80 % | 2 % | 6 % | 2 % | 6 % | 93 % | 5 % |
| 130010804 | Sud-Ouest Plateau Puyricard | utilisable | `oui` | 1916 | 81 % | 1 % | 9 % | 1 % | 5 % | 93 % | 12 % |
| 130010908 | Arbois Partie Est | utilisable | `oui` | 1071 | 81 % | 1 % | 12 % | 2 % | 6 % | 82 % | 18 % |
| 130010905 | Les Milles Village | utilisable | `oui` | 1236 | 82 % | 3 % | 9 % | 4 % | 12 % | 61 % | 77 % |
| 130010907 | Arbois Partie Ouest | utilisable | `oui` | 4504 | 83 % | 1 % | 6 % | 4 % | 5 % | 84 % | 37 % |
| 130010802 | Plateau Nord-Puyricard | utilisable | `oui` | 1129 | 84 % | 0 % | 5 % | 1 % | 4 % | 90 % | 0 % |
| 130010801 | Sud-Est Plateau Puyricard | utilisable | `oui` | 1422 | 84 % | 1 % | 7 % | 1 % | 4 % | 88 % | 0 % |
| 130010906 | Z.I. Les Milles | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Aix-en-Provence)

Actifs qui habitent l'ensemble de Aix-en-Provence, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Aix-en-Provence (13001) | 66 % | 56 % | 4 % | 15 % | 16 % | 13379 | utilisable | `oui` |
| Marignane (13054) | 2 % | 77 % | 0,2 % | 21 % | 0,2 % | 506 | utilisable | `oui` |
| Saint-Paul-lès-Durance (13099) | 2 % | 61 % | 1 % | 39 % | 0 % | 459 | utilisable | `oui` |
| Vitrolles (13117) | 2 % | 89 % | 0,3 % | 10 % | 0 % | 475 | utilisable | `oui` |
| Marseille 2e Arrondissement (13202) | 1 % | 62 % | 0 % | 35 % | 0,4 % | 262 | utilisable | `oui` |
| Rousset (13087) | 1 % | 85 % | 0,4 % | 14 % | 1 % | 251 | utilisable | `oui` |
| Gardanne (13041) | 1 % | 87 % | 0,2 % | 10 % | 0 % | 206 | utilisable | `oui` |
| Venelles (13113) | 1 % | 86 % | 2 % | 10 % | 0 % | 200 | utilisable | `oui` |
| Marseille 15e Arrondissement (13215) | 1 % | 88 % | 0 % | 10 % | 0 % | 193 | utilisable | `oui` |
| Éguilles (13032) | 1 % | 92 % | 0,3 % | 5 % | 0 % | 173 | utilisable | `oui` |
| Bouc-Bel-Air (13015) | 1 % | 84 % | 2 % | 13 % | 0 % | 185 | utilisable | `oui` |
| Marseille 8e Arrondissement (13208) | 1 % | 55 % | 2 % | 34 % | 3 % | 147 | fragile | `ordre de grandeur` |
| Marseille 13e Arrondissement (13213) | 1 % | 78 % | 0,3 % | 21 % | 0 % | 158 | utilisable | `oui` |
| Marseille 1er Arrondissement (13201) | 1 % | 52 % | 1 % | 43 % | 1 % | 136 | fragile | `ordre de grandeur` |
| Pertuis (84089) | 1 % | 90 % | 0 % | 9 % | 0 % | 133 | fragile | `ordre de grandeur` |
| Meyreuil (13060) | 1 % | 87 % | 0,3 % | 11 % | 0 % | 142 | fragile | `ordre de grandeur` |
| Marseille 14e Arrondissement (13214) | 1 % | 80 % | 0 % | 15 % | 0 % | 108 | fragile | `ordre de grandeur` |
| Aubagne (13005) | 1 % | 85 % | 0 % | 14 % | 0 % | 104 | fragile | `ordre de grandeur` |
| Cabriès (13019) | 1 % | 89 % | 0 % | 10 % | 1 % | 115 | fragile | `ordre de grandeur` |
| Les Pennes-Mirabeau (13071) | 1 % | 91 % | 0,4 % | 8 % | 0 % | 105 | fragile | `ordre de grandeur` |
| Salon-de-Provence (13103) | 1 % | 87 % | 0 % | 8 % | 4 % | 95 | fragile | `ordre de grandeur` |
| Marseille 3e Arrondissement (13203) | 1 % | 52 % | 1 % | 42 % | 0 % | 92 | fragile | `ordre de grandeur` |
| Marseille 6e Arrondissement (13206) | 1 % | 56 % | 0 % | 44 % | 0,3 % | 115 | fragile | `ordre de grandeur` |
| Marseille 9e Arrondissement (13209) | 1 % | 80 % | 0 % | 16 % | 0,3 % | 101 | fragile | `ordre de grandeur` |
| Marseille 16e Arrondissement (13216) | 1 % | 92 % | 0 % | 7 % | 0 % | 106 | fragile | `ordre de grandeur` |
| Martigues (13056) | 0,4 % | 95 % | 0 % | 4 % | 0 % | 71 | fragile | `ordre de grandeur` |
| Le Tholonet (13109) | 0,4 % | 70 % | 6 % | 18 % | 1 % | 78 | fragile | `ordre de grandeur` |
| Manosque (04112) | 0,3 % | 90 % | 0 % | 7 % | 0 % | 54 | fragile | `ordre de grandeur` |
| La Ciotat (13028) | 0,3 % | 97 % | 0 % | 0 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Fuveau (13040) | 0,3 % | 77 % | 0 % | 21 % | 0 % | 69 | fragile | `ordre de grandeur` |
| Le Puy-Sainte-Réparade (13080) | 0,3 % | 89 % | 0 % | 4 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Marseille 4e Arrondissement (13204) | 0,3 % | 63 % | 0 % | 29 % | 3 % | 48 | fragile | `ordre de grandeur` |
| Marseille 5e Arrondissement (13205) | 0,3 % | 69 % | 0 % | 31 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Marseille 7e Arrondissement (13207) | 0,3 % | 60 % | 2 % | 36 % | 0 % | 54 | fragile | `ordre de grandeur` |
| Marseille 11e Arrondissement (13211) | 0,3 % | 94 % | 0 % | 4 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Berre-l'Étang (13014) | 0,2 % | 98 % | 0 % | 2 % | 0 % | 45 | fragile | `ordre de grandeur` |
| Saint-Victoret (13102) | 0,2 % | 86 % | 7 % | 7 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Velaux (13112) | 0,2 % | 94 % | 0 % | 6 % | 0 % | 43 | fragile | `ordre de grandeur` |
| Marseille 10e Arrondissement (13210) | 0,2 % | 76 % | 0 % | 20 % | 4 % | 46 | fragile | `ordre de grandeur` |
| Marseille 12e Arrondissement (13212) | 0,2 % | 72 % | 0 % | 22 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Toulon (83137) | 0,2 % | 68 % | 0 % | 33 % | 0 % | 40 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Aix-en-Provence (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 31 904 à 127 618), avec au moins 150 lignes d'échantillon ; Aix-en-Provence exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Aix-en-Provence qui vont travailler principalement en voiture (valeur comparée) | 63 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 32 communes du groupe (chaque commune compte une fois) | 56 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Aix-en-Provence moins la médiane du groupe (valeurs arrondies) | +7 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 32 | `oui` |

Communes du groupe (32, pour la vérification ; ne pas les citer) : Amiens, Angers, Annecy, Besançon, Bordeaux, Boulogne-Billancourt, Brest, Caen, Cherbourg-en-Cotentin, Clermont-Ferrand, Dijon, Grenoble, Le Havre, Le Mans, Lille, Limoges, Metz, Montpellier, Mulhouse, Nancy, Nîmes, Orléans, Perpignan, Poitiers, Reims, Rennes, Rouen, Saint-Étienne, Strasbourg, Toulon, Tours, Villeurbanne.

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Aix-en-Provence (13001) | 84 % | 74 % | 73 % | 65 % | 57 % |
| Marseille 13e Arrondissement (13213) | 93 % | 87 % | 82 % | 78 % | 28 % |
| Marseille 8e Arrondissement (13208) | 97 % | 93 % | 89 % | 85 % | 0 % |
| Marseille 15e Arrondissement (13215) | 91 % | 83 % | 89 % | 75 % | 82 % |
| Marseille 9e Arrondissement (13209) | 89 % | 88 % | 91 % | 81 % | 0 % |
| Marseille 12e Arrondissement (13212) | 97 % | 91 % | 82 % | 75 % | 56 % |
| Marseille 14e Arrondissement (13214) | 94 % | 91 % | 91 % | 88 % | 96 % |

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
| Carte de situation : Aix-en-Provence et Marseille 13e Arrondissement (13213), Marseille 8e Arrondissement (13208), Marseille 15e Arrondissement (13215), Marseille 9e Arrondissement (13209), Marseille 12e Arrondissement (13212) et Marseille 14e Arrondissement (13214) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


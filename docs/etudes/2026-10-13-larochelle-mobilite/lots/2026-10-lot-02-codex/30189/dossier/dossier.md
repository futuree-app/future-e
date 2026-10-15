# Dossier d'entrée de rédaction · Nîmes (30189)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-02-codex/30189/fiche/fiche.json` (générée le 2026-10-14T23:56:04Z, jour de référence 2026-10-13, sha256 `7910def57f2198da`). Dossier généré le 2026-10-14T23:59:40Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Nîmes (30189), département 30, intercommunalité CA de Nîmes Métropole.
- **Groupe de communes nommé** : Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 30601 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 5 % [IC 95 % : 5 % à 5 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 6 % [IC 95 % : 6 % à 7 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 66 % [IC 95 % : 65 % à 67 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 10 % [IC 95 % : 9 % à 10 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes, y compris ceux qui ne se déplacent pas | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Nîmes même | 77 % [IC 95 % : 76 % à 78 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes | commune de résidence et de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Nîmes | 60 % [IC 95 % : 59 % à 62 %] | actifs occupés de 15 ans ou plus résidant à Nîmes qui travaillent à Nîmes | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | 89 % [IC 95 % : 85 % à 93 %] | actifs occupés de 15 ans ou plus résidant à Nîmes qui travaillent dans l'une de ces communes : Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | commune de travail : Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Nîmes et hors de Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | 84 % [IC 95 % : 83 % à 86 %] | actifs occupés de 15 ans ou plus résidant à Nîmes qui travaillent hors de Nîmes et hors de Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | commune de travail : toute commune autre que Nîmes, Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) moins travail à Nîmes | +29 points | deux groupes distincts (voir les deux faits) | commune de travail : Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 10 % [IC 95 % : 9 % à 10 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 41 % [IC 95 % : 40 % à 42 %] | tous les actifs occupés de 15 ans ou plus résidant à Nîmes | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 28 % [IC 95 % : 27 % à 29 %] | actifs occupés de 15 ans ou plus résidant à Nîmes dont le ménage a au moins une voiture | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 73 % [IC 95 % : 71 % à 74 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, propriétaires de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, propriétaires de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 3 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, propriétaires de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 58 % [IC 95 % : 56 % à 59 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, propriétaires de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 62 % [IC 95 % : 60 % à 63 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires du privé de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires du privé de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 18 % [IC 95 % : 16 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires du privé de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 27 % [IC 95 % : 25 % à 28 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires du privé de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 69 % [IC 95 % : 66 % à 71 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires HLM de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires HLM de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 14 % [IC 95 % : 12 % à 16 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires HLM de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 34 % [IC 95 % : 31 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Nîmes, locataires HLM de leur logement | commune de résidence : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Nîmes | environ 82 800 | — | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Nîmes, de ceux qui habitent Nîmes | 49 % | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nîmes et habitent Nîmes | 60 % [IC 95 % : 59 % à 62 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent Nîmes | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nîmes et habitent Nîmes | 9 % [IC 95 % : 8 % à 10 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent Nîmes | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nîmes, de ceux qui habitent une autre commune de l'unité urbaine INSEE 30601 (liste des communes non exposée par la fiche) | 8 % | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nîmes et habitent une autre commune de l'unité urbaine INSEE 30601 (liste des communes non exposée par la fiche) | 90 % [IC 95 % : 88 % à 92 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 30601 (liste des communes non exposée par la fiche) | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nîmes et habitent une autre commune de l'unité urbaine INSEE 30601 (liste des communes non exposée par la fiche) | 5 % [IC 95 % : 4 % à 7 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 30601 (liste des communes non exposée par la fiche) | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nîmes, de ceux qui habitent hors de l'unité urbaine INSEE 30601 | 43 % | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nîmes et habitent hors de l'unité urbaine INSEE 30601 | 92 % [IC 95 % : 91 % à 92 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 30601 | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nîmes et habitent hors de l'unité urbaine INSEE 30601 | 6 % [IC 95 % : 5 % à 7 %] | actifs occupés qui travaillent à Nîmes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 30601 | commune de travail : Nîmes (30189) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Arènes (IRIS 301890101) | 32 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nîmes (30189), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Super Nîmes (IRIS 301890901) | 95 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nîmes (30189), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +63 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Nîmes (30189), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 25 % | toutes les résidences principales de Nîmes | commune : Nîmes (30189) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 23 % | toutes les résidences principales de Nîmes | commune : Nîmes (30189) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 58 % | toutes les résidences principales de Nîmes | commune : Nîmes (30189) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.30189.commerce_alim_500m` | Part des adresses de Nîmes qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.grande_surface_500m` | Part des adresses de Nîmes qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 57 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.pharmacie_500m` | Part des adresses de Nîmes qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 78 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.medecin_generaliste_500m` | Part des adresses de Nîmes qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.ecole_elementaire_500m` | Part des adresses de Nîmes qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.college_1km` | Part des adresses de Nîmes qui ont un collège à moins de 1 km (à vol d'oiseau) | 86 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.gare_2km` | Part des adresses de Nîmes qui ont une gare à moins de 2 km (à vol d'oiseau) | 71 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.panier_quotidien_500m` | Part des adresses de Nîmes qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 71 % | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.30189.bus_8h_7_9h` | Part des adresses de Nîmes qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.30189.aucun_bus_7_9h` | Part des adresses de Nîmes sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.30189.bus_4h_20_22h` | Part des adresses de Nîmes qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nîmes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nîmes (30189) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Tango » (https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,57 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,76 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,17 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,63 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,54 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nîmes (centre communal de geo.api.gouv.fr : [4.3429, 43.8322]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-02-codex/30189/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CA de Nîmes Métropole s'appelle « Tango » ; son autorité organisatrice est CA de Nîmes Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Tango » : https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-13 | intercommunalité CA de Nîmes Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Tango est https://www.tangobus.fr. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-tango-de-nimes-metropole-gtfs-gtfs-rt ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Tango | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarif.pass_70_ans` | Le Pass 70 ans et + est indiqué « Gratuit », valable de manière illimitée pendant 12 mois consécutifs. C'est le seul titre gratuit de la page tarifs. La page ne dit pas que le réseau est gratuit. | https://www.tangobus.fr/fr/titre-et-tarifs (extrait vérifié le 2026-10-14 : « Valable de manière illimitée pendant 12 mois consécutifs ») | 2026-10-15 | non précisée | réseau Tango ; Pass 70 ans et + uniquement ; ce n'est pas une gratuité de tout le réseau ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.horaires.validite_guides` | Les guides horaires 2026-2027 sont valables à partir du 30 août 2026. Des dates particulières sont indiquées pour la ligne 31 (du 5 au 16 octobre), pour L42, Tempo 203A et Tempo 203B (à partir du 12 octobre). | https://www.tangobus.fr/fr/guides-horaires-2026-2027 (extrait vérifié le 2026-10-14 : « Retrouvez l'intégralité de vos guides horaires valables à partir du 30 août 2026 ») | 2026-10-15 | à partir du 30 août 2026 | réseau Tango ; Guides horaires du réseau Tango : Tram'bus T1 à T5, lignes L6 à L62, navettes, lignes de proximité, Tempo ; application à chaque commune non établie | `oui` |  |
| `doc.verification.guides_horaires` | La page « Guides horaires » renvoie vers le lien « Guides horaires 2026 - 2027 », qui donne un guide PDF par ligne. | https://www.tangobus.fr/fr/page-4 (extrait vérifié le 2026-10-14 : « Guides horaires 2026 - 2027 ») | 2026-10-15 | 2026-2027 | réseau Tango ; Ensemble du réseau ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité du réseau (public, lignes, exceptions) | `introuvable` | https://www.tangobus.fr/fr/titre-et-tarifs 2026-10-15 | La page tarifs ne mentionne pas de gratuité générale. Seul le Pass 70 ans et + est gratuit. Ce n'est pas la preuve que le réseau est payant. Les autres titres sont listés avec un prix ou « soumis à conditions ». |
| Jours de circulation (samedi, dimanche, jours fériés) | `introuvable` | https://www.tangobus.fr/fr/guides-horaires-2026-2027 2026-10-15 | Aucune page HTML consultée ne donne ces jours. Ils sont probablement dans les guides PDF par ligne, que je n'ai pas ouverts : non vérifié. |
| Calcul d'itinéraire | `non vérifié` | https://www.tangobus.fr/fr/itineraires 2026-10-15 | La page existe (menu « Se déplacer »), mais son contenu n'a pas été lu : seul le menu est ressorti. Aucun extrait n'est enregistré. |
| Temps réel et perturbations | `non vérifié` | https://www.tangobus.fr/fr/infos-trafic 2026-10-15 | Page « Infos trafic » listée dans le menu, non ouverte. La page d'accueil mentionne aussi un « Service 'vacances scolaires' » du 19 au 30 octobre 2026, mais je n'ai pas pu le vérifier ni en tirer d'extrait. |
| Guides PDF par ligne | `non vérifié` | https://www.tangobus.fr/fr/guides-horaires-2026-2027 2026-10-15 | Les PDF n'ont pas été ouverts. |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 301890101 | Arènes | utilisable | `oui` | 859 | 32 % | 8 % | 18 % | 36 % | 59 % | 11 % | 100 % |
| 301890401 | Gambetta | utilisable | `oui` | 1010 | 33 % | 21 % | 16 % | 24 % | 58 % | 21 % | 100 % |
| 301891403 | Casernes | utilisable | `oui` | 1486 | 33 % | 5 % | 6 % | 24 % | 38 % | 57 % | 71 % |
| 301890102 | Général Perrier | utilisable | `oui` | 1048 | 33 % | 10 % | 15 % | 38 % | 57 % | 9 % | 100 % |
| 301890202 | Placette | utilisable | `oui` | 855 | 44 % | 10 % | 11 % | 27 % | 49 % | 29 % | 100 % |
| 301890201 | Esplanade | utilisable | `oui` | 539 | 47 % | 8 % | 13 % | 28 % | 31 % | 39 % | 100 % |
| 301890302 | Jean Jaurès Nord | utilisable | `oui` | 1099 | 47 % | 9 % | 12 % | 28 % | 34 % | 43 % | 100 % |
| 301890701 | Gamel | utilisable | `oui` | 779 | 48 % | 2 % | 14 % | 24 % | 32 % | 56 % | 100 % |
| 301890403 | Séguier | utilisable | `oui` | 1352 | 49 % | 9 % | 9 % | 29 % | 35 % | 47 % | 100 % |
| 301890204 | Montcalm-République | utilisable | `oui` | 1328 | 50 % | 8 % | 13 % | 26 % | 29 % | 50 % | 100 % |
| 301890103 | Carré d'Art | utilisable | `oui` | 622 | 50 % | 10 % | 11 % | 22 % | 37 % | 43 % | 100 % |
| 301890301 | Jean Jaurès Sud | utilisable | `oui` | 1214 | 51 % | 12 % | 14 % | 14 % | 27 % | 68 % | 85 % |
| 301890402 | Richelieu | utilisable | `oui` | 1360 | 52 % | 14 % | 12 % | 15 % | 52 % | 22 % | 100 % |
| 301891401 | Tour Magne | utilisable | `oui` | 744 | 55 % | 13 % | 6 % | 15 % | 22 % | 62 % | 57 % |
| 301891004 | Jean Perrin | fragile (124 actifs (< 300)) | `ordre de grandeur` | 124 | 59 % | 0 % | 30 % | 0 % | 37 % | 21 % | 100 % |
| 301890601 | Beausoleil | utilisable | `oui` | 1300 | 59 % | 10 % | 8 % | 13 % | 27 % | 63 % | 92 % |
| 301891804 | Aérodrome | utilisable | `oui` | 2113 | 61 % | 3 % | 10 % | 8 % | 7 % | 89 % | 30 % |
| 301891003 | Galilée | fragile (177 actifs (< 300)) | `ordre de grandeur` | 177 | 62 % | 5 % | 21 % | 9 % | 37 % | 27 % | 100 % |
| 301891402 | Croix de Fer | utilisable | `oui` | 983 | 62 % | 10 % | 6 % | 15 % | 23 % | 53 % | 98 % |
| 301890501 | Saint-Baudile | utilisable | `oui` | 849 | 62 % | 12 % | 12 % | 8 % | 22 % | 46 % | 100 % |
| 301890602 | Creux des Canards | utilisable | `oui` | 833 | 63 % | 12 % | 7 % | 15 % | 17 % | 84 % | 91 % |
| 301891603 | André Malraux | utilisable | `oui` | 326 | 64 % | 0 % | 19 % | 6 % | 38 % | 7 % | 100 % |
| 301891502 | La Gazelle | utilisable | `oui` | 1396 | 65 % | 3 % | 19 % | 7 % | 14 % | 79 % | 69 % |
| 301890801 | Puech du Teil | utilisable | `oui` | 834 | 65 % | 7 % | 9 % | 15 % | 16 % | 82 % | 57 % |
| 301890502 | Beaucaire | utilisable | `oui` | 689 | 66 % | 8 % | 9 % | 14 % | 33 % | 51 % | 97 % |
| 301891801 | Les Amoureux | utilisable | `oui` | 923 | 67 % | 8 % | 10 % | 8 % | 21 % | 58 % | 100 % |
| 301890304 | Montaury | utilisable | `oui` | 899 | 67 % | 6 % | 8 % | 14 % | 22 % | 72 % | 74 % |
| 301890303 | Jardins de la Fontaine | utilisable | `oui` | 370 | 68 % | 6 % | 5 % | 17 % | 19 % | 72 % | 55 % |
| 301891602 | Romain Rolland | utilisable | `oui` | 357 | 68 % | 0,3 % | 16 % | 4 % | 36 % | 20 % | 79 % |
| 301890903 | Corot | fragile (284 actifs (< 300)) | `ordre de grandeur` | 284 | 68 % | 0,4 % | 21 % | 10 % | 33 % | 49 % | 100 % |
| 301890503 | Pasteur | utilisable | `oui` | 1193 | 69 % | 6 % | 11 % | 7 % | 23 % | 60 % | 100 % |
| 301890702 | Marronniers | utilisable | `oui` | 1188 | 69 % | 6 % | 10 % | 10 % | 22 % | 65 % | 66 % |
| 301890803 | Marcel Rouvière | utilisable | `oui` | 780 | 70 % | 7 % | 12 % | 6 % | 12 % | 83 % | 53 % |
| 301891601 | André Marquès | utilisable | `oui` | 490 | 70 % | 4 % | 20 % | 3 % | 27 % | 47 % | 92 % |
| 301890904 | Soleil Levant | utilisable | `oui` | 589 | 73 % | 1 % | 19 % | 6 % | 25 % | 44 % | 100 % |
| 301890708 | La Plaine | utilisable | `oui` | 678 | 73 % | 2 % | 14 % | 2 % | 9 % | 86 % | 0 % |
| 301891203 | La Cigale | utilisable | `oui` | 768 | 73 % | 9 % | 5 % | 3 % | 4 % | 82 % | 7 % |
| 301890902 | Galerie Wagner | utilisable | `oui` | 445 | 75 % | 1 % | 14 % | 2 % | 32 % | 45 % | 100 % |
| 301890703 | Capouchiné | utilisable | `oui` | 843 | 75 % | 5 % | 5 % | 14 % | 14 % | 73 % | 78 % |
| 301890804 | Alouette | utilisable | `oui` | 851 | 76 % | 5 % | 9 % | 5 % | 11 % | 86 % | 33 % |
| 301891001 | Diderot | utilisable | `oui` | 371 | 77 % | 5 % | 7 % | 4 % | 11 % | 54 % | 100 % |
| 301891101 | Saint-Césaire | utilisable | `oui` | 1165 | 77 % | 3 % | 9 % | 6 % | 17 % | 74 % | 92 % |
| 301891202 | Camplanier | utilisable | `oui` | 1389 | 77 % | 7 % | 4 % | 2 % | 3 % | 85 % | 8 % |
| 301891702 | Mas de Mingue | utilisable | `oui` | 658 | 78 % | 4 % | 10 % | 7 % | 26 % | 53 % | 67 % |
| 301891204 | L'Eau Boullie | utilisable | `oui` | 1283 | 78 % | 7 % | 5 % | 2 % | 5 % | 87 % | 4 % |
| 301890604 | Haute Magaille | utilisable | `oui` | 1247 | 80 % | 4 % | 8 % | 4 % | 13 % | 64 % | 23 % |
| 301891803 | Mas de Possac | utilisable | `oui` | 576 | 80 % | 6 % | 5 % | 2 % | 12 % | 80 % | 35 % |
| 301891703 | SNCF | utilisable | `oui` | 647 | 83 % | 1 % | 11 % | 2 % | 23 % | 53 % | 54 % |
| 301891503 | Serre-Paradis | utilisable | `oui` | 959 | 83 % | 5 % | 4 % | 2 % | 18 % | 78 % | 17 % |
| 301891201 | Castanet | utilisable | `oui` | 628 | 83 % | 2 % | 9 % | 1 % | 8 % | 82 % | 44 % |
| 301891501 | Ventabren | utilisable | `oui` | 1244 | 85 % | 4 % | 6 % | 1 % | 5 % | 88 % | 4 % |
| 301891303 | Vacquerolles | utilisable | `oui` | 1173 | 87 % | 1 % | 5 % | 2 % | 3 % | 90 % | 22 % |
| 301891302 | Garrigues | utilisable | `oui` | 1287 | 87 % | 3 % | 5 % | 1 % | 3 % | 88 % | 3 % |
| 301891701 | Courbessac | utilisable | `oui` | 804 | 87 % | 2 % | 4 % | 2 % | 12 % | 75 % | 55 % |
| 301891104 | Mas de Lauze | utilisable | `oui` | 2553 | 88 % | 2 % | 3 % | 2 % | 3 % | 91 % | 2 % |
| 301890901 | Super Nîmes | utilisable | `oui` | 667 | 95 % | 1 % | 4 % | 0 % | 21 % | 40 % | 100 % |
| 301890705 | Maréchal Juin | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301890203 | Gare | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301891102 | Zone Industrielle | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301890706 | Km Delta | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301890704 | Ville Active | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301891103 | Hôpital | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 301890707 | Plan de Perbos | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Nîmes)

Actifs qui habitent l'ensemble de Nîmes, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Nîmes (30189) | 77 % | 60 % | 8 % | 9 % | 14 % | 12108 | utilisable | `oui` |
| Montpellier (34172) | 2 % | 69 % | 1 % | 29 % | 1 % | 357 | utilisable | `oui` |
| Garons (30125) | 1 % | 92 % | 1 % | 3 % | 0 % | 152 | utilisable | `oui` |
| Alès (30007) | 1 % | 91 % | 0 % | 6 % | 1 % | 139 | fragile | `ordre de grandeur` |
| Arles (13004) | 1 % | 96 % | 0 % | 2 % | 0 % | 131 | fragile | `ordre de grandeur` |
| Caissargues (30060) | 1 % | 94 % | 2 % | 4 % | 0 % | 123 | fragile | `ordre de grandeur` |
| Marguerittes (30156) | 1 % | 88 % | 1 % | 5 % | 0,3 % | 136 | fragile | `ordre de grandeur` |
| Saint-Gilles (30258) | 1 % | 91 % | 1 % | 4 % | 0 % | 132 | fragile | `ordre de grandeur` |
| Bouillargues (30047) | 1 % | 85 % | 6 % | 4 % | 3 % | 90 | fragile | `ordre de grandeur` |
| Uzès (30334) | 1 % | 93 % | 0 % | 5 % | 0 % | 103 | fragile | `ordre de grandeur` |
| Beaucaire (30032) | 1 % | 83 % | 4 % | 11 % | 1 % | 77 | fragile | `ordre de grandeur` |
| Vauvert (30341) | 1 % | 96 % | 0 % | 4 % | 0 % | 80 | fragile | `ordre de grandeur` |
| Avignon (84007) | 1 % | 80 % | 0 % | 19 % | 1 % | 87 | fragile | `ordre de grandeur` |
| Vergèze (30344) | 0,4 % | 99 % | 0 % | 1 % | 0 % | 62 | fragile | `ordre de grandeur` |
| Lunel (34145) | 0,4 % | 89 % | 0 % | 11 % | 0 % | 68 | fragile | `ordre de grandeur` |
| Caveirac (30075) | 0,3 % | 93 % | 3 % | 2 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Milhaud (30169) | 0,3 % | 77 % | 0 % | 17 % | 4 % | 56 | fragile | `ordre de grandeur` |
| Mauguio (34154) | 0,3 % | 86 % | 0 % | 7 % | 0 % | 40 | fragile | `ordre de grandeur` |
| Gallargues-le-Montueux (30123) | 0,2 % | 100 % | 0 % | 0 % | 0 % | 40 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Nîmes (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 26 365 à 105 460), avec au moins 150 lignes d'échantillon ; Nîmes exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Nîmes qui vont travailler principalement en voiture (valeur comparée) | 66 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 37 communes du groupe (chaque commune compte une fois) | 59 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Nîmes moins la médiane du groupe (valeurs arrondies) | +7 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 37 | `oui` |

Communes du groupe (37, pour la vérification ; ne pas les citer) : Aix-en-Provence, Ajaccio, Amiens, Angers, Annecy, Avignon, Besançon, Boulogne-Billancourt, Brest, Caen, Cherbourg-en-Cotentin, Clermont-Ferrand, Colmar, Dijon, Dunkerque, Grenoble, La Rochelle, Le Havre, Le Mans, Lille, Limoges, Metz, Mulhouse, Nancy, Orléans, Pau, Perpignan, Poitiers, Quimper, Reims, Rennes, Rouen, Saint-Nazaire, Saint-Étienne, Toulon, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Nîmes. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Nîmes | Lignes (vers Nîmes) | Statut (vers Nîmes) | Usage (vers Nîmes) |
|---|---:|---:|---:|---:|---:|---|---|
| Marguerittes (30156) | 84 % | 2 % | 3 % | 92 % | 306 | utilisable | `oui` |
| Milhaud (30169) | 86 % | 3 % | 4 % | 89 % | 256 | utilisable | `oui` |
| Uchaud (30333) | 89 % | 1 % | 3 % | 92 % | 140 | fragile | `ordre de grandeur` |
| Caveirac (30075) | 85 % | 2 % | 4 % | 90 % | 167 | utilisable | `oui` |
| Caissargues (30060) | 85 % | 1 % | 6 % | 83 % | 174 | utilisable | `oui` |
| Bernis (30036) | 88 % | 1 % | 1 % | 95 % | 126 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Nîmes (30189) | 86 % | 78 % | 80 % | 71 % | 71 % |
| Marguerittes (30156) | 60 % | 44 % | 35 % | 25 % | 0 % |
| Milhaud (30169) | 93 % | 59 % | 56 % | 52 % | 98 % |
| Uchaud (30333) | 82 % | 69 % | 39 % | 38 % | 99,8 % |
| Caveirac (30075) | 58 % | 33 % | 39 % | 27 % | 0 % |
| Caissargues (30060) | 94 % | 68 % | 76 % | 57 % | 0 % |
| Bernis (30036) | 75 % | 48 % | 55 % | 22 % | 68 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,75 €/L | environ 90 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,75 €/L | environ 270 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,75 €/L | environ 630 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,55 €/L | environ 70 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,55 €/L | environ 200 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,55 €/L | environ 460 € |

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
| Carte de situation : Nîmes et Marguerittes (30156), Milhaud (30169), Uchaud (30333), Caveirac (30075), Caissargues (30060) et Bernis (30036) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


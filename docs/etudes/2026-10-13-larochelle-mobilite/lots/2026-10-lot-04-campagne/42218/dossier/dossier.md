# Dossier d'entrée de rédaction · Saint-Étienne (42218)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/42218/fiche/fiche.json` (générée le 2026-10-15T16:05:32Z, jour de référence 2026-10-13, sha256 `417af0495c95ae2e`). Dossier généré le 2026-10-15T16:06:13Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Saint-Étienne (42218), département 42, intercommunalité Saint-Étienne Métropole.
- **Groupe de communes nommé** : Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 00753 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 12 % [IC 95 % : 12 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 0,4 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 59 % [IC 95 % : 58 % à 60 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 23 % [IC 95 % : 22 % à 23 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne, y compris ceux qui ne se déplacent pas | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Saint-Étienne même | 64 % [IC 95 % : 64 % à 65 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne | commune de résidence et de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Saint-Étienne | 50 % [IC 95 % : 49 % à 52 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne qui travaillent à Saint-Étienne | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | 84 % [IC 95 % : 81 % à 87 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne qui travaillent dans l'une de ces communes : Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | commune de travail : Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Saint-Étienne et hors de Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | 75 % [IC 95 % : 74 % à 76 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne qui travaillent hors de Saint-Étienne et hors de Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | commune de travail : toute commune autre que Saint-Étienne, Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) moins travail à Saint-Étienne | +34 points | deux groupes distincts (voir les deux faits) | commune de travail : Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 16 % [IC 95 % : 16 % à 17 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 35 % [IC 95 % : 34 % à 36 %] | tous les actifs occupés de 15 ans ou plus résidant à Saint-Étienne | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 32 % [IC 95 % : 31 % à 33 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne dont le ménage a au moins une voiture | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 67 % [IC 95 % : 66 % à 68 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, propriétaires de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 4 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, propriétaires de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 5 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, propriétaires de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 50 % [IC 95 % : 48 % à 51 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, propriétaires de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 52 % [IC 95 % : 50 % à 53 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires du privé de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 2 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires du privé de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 28 % [IC 95 % : 26 % à 29 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires du privé de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 21 % [IC 95 % : 20 % à 22 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires du privé de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 56 % [IC 95 % : 54 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires HLM de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 1 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires HLM de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 26 % [IC 95 % : 24 % à 28 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires HLM de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 24 % [IC 95 % : 22 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Saint-Étienne, locataires HLM de leur logement | commune de résidence : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Saint-Étienne | environ 83 600 | — | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Étienne, de ceux qui habitent Saint-Étienne | 47 % | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Étienne et habitent Saint-Étienne | 50 % [IC 95 % : 49 % à 52 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent Saint-Étienne | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Étienne et habitent Saint-Étienne | 23 % [IC 95 % : 22 % à 24 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent Saint-Étienne | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Étienne, de ceux qui habitent une autre commune de l'unité urbaine INSEE 00753 (liste des communes non exposée par la fiche) | 23 % | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Étienne et habitent une autre commune de l'unité urbaine INSEE 00753 (liste des communes non exposée par la fiche) | 88 % [IC 95 % : 86 % à 89 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00753 (liste des communes non exposée par la fiche) | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Étienne et habitent une autre commune de l'unité urbaine INSEE 00753 (liste des communes non exposée par la fiche) | 11 % [IC 95 % : 10 % à 12 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 00753 (liste des communes non exposée par la fiche) | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Saint-Étienne, de ceux qui habitent hors de l'unité urbaine INSEE 00753 | 30 % | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Saint-Étienne et habitent hors de l'unité urbaine INSEE 00753 | 88 % [IC 95 % : 87 % à 89 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00753 | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Saint-Étienne et habitent hors de l'unité urbaine INSEE 00753 | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés qui travaillent à Saint-Étienne, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 00753 | commune de travail : Saint-Étienne (42218) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Peuple-Boivin-Saint-Jacques (IRIS 422180102) | 26 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Saint-Étienne (42218), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Saint-Victor (IRIS 422182301) | 92 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Saint-Étienne (42218), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +66 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Saint-Étienne (42218), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 33 % | toutes les résidences principales de Saint-Étienne | commune : Saint-Étienne (42218) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 18 % | toutes les résidences principales de Saint-Étienne | commune : Saint-Étienne (42218) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 46 % | toutes les résidences principales de Saint-Étienne | commune : Saint-Étienne (42218) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.42218.commerce_alim_500m` | Part des adresses de Saint-Étienne qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 93 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.grande_surface_500m` | Part des adresses de Saint-Étienne qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 67 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.pharmacie_500m` | Part des adresses de Saint-Étienne qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.medecin_generaliste_500m` | Part des adresses de Saint-Étienne qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.ecole_elementaire_500m` | Part des adresses de Saint-Étienne qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 90 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.college_1km` | Part des adresses de Saint-Étienne qui ont un collège à moins de 1 km (à vol d'oiseau) | 90 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.gare_2km` | Part des adresses de Saint-Étienne qui ont une gare à moins de 2 km (à vol d'oiseau) | 89 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.panier_quotidien_500m` | Part des adresses de Saint-Étienne qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.42218.bus_8h_7_9h` | Part des adresses de Saint-Étienne qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.42218.aucun_bus_7_9h` | Part des adresses de Saint-Étienne sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.42218.bus_4h_20_22h` | Part des adresses de Saint-Étienne qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Saint-Étienne, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Saint-Étienne (42218) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain STAS » (https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,30 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,70 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,15 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,68 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,47 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Saint-Étienne (centre communal de geo.api.gouv.fr : [4.3665, 45.4241]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/42218/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Saint-Étienne Métropole s'appelle « STAS » ; son autorité organisatrice est Saint-Etienne Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain STAS » : https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas ; nom confirmé par : offre de transport.data.gouv.fr confirmée par l'intitulé ou l'agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-15 | intercommunalité Saint-Étienne Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| site officiel du réseau | `non vérifié` | https://transport.data.gouv.fr/datasets/horaires-du-reseau-stas 2026-10-15 | aucune agence du GTFS ne correspond de façon univoque au nom du réseau : SAINT-ETIENNE – STAS (http://STAS3.cityway.fr) |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 422180102 | Peuple-Boivin-Saint-Jacques | utilisable | `oui` | 1187 | 26 % | 3 % | 34 % | 32 % | 53 % | 14 % | 100 % |
| 422180104 | Marengo | utilisable | `oui` | 1310 | 36 % | 4 % | 27 % | 29 % | 44 % | 27 % | 100 % |
| 422180101 | République | utilisable | `oui` | 990 | 37 % | 3 % | 29 % | 25 % | 44 % | 35 % | 100 % |
| 422180203 | Camelinat | utilisable | `oui` | 866 | 40 % | 6 % | 33 % | 19 % | 48 % | 34 % | 100 % |
| 422180103 | Hôtel de Ville | utilisable | `oui` | 1107 | 40 % | 3 % | 32 % | 24 % | 39 % | 34 % | 100 % |
| 422181101 | Châteaucreux | utilisable | `oui` | 906 | 41 % | 3 % | 36 % | 16 % | 37 % | 39 % | 86 % |
| 422180202 | Jacquard | utilisable | `oui` | 790 | 43 % | 5 % | 28 % | 19 % | 49 % | 35 % | 98 % |
| 422180402 | Badouillère Est-Charité | utilisable | `oui` | 927 | 43 % | 4 % | 28 % | 20 % | 40 % | 40 % | 100 % |
| 422180601 | Beaubrun | utilisable | `oui` | 482 | 43 % | 2 % | 36 % | 12 % | 52 % | 26 % | 100 % |
| 422180301 | Crêt de Roc Ouest | utilisable | `oui` | 914 | 45 % | 3 % | 30 % | 20 % | 47 % | 28 % | 94 % |
| 422180401 | Chavanelle | utilisable | `oui` | 1248 | 46 % | 4 % | 24 % | 23 % | 41 % | 34 % | 100 % |
| 422181102 | Saint-François-Giron | utilisable | `oui` | 673 | 46 % | 4 % | 24 % | 22 % | 36 % | 43 % | 100 % |
| 422181503 | Centre Deux-Preher | utilisable | `oui` | 604 | 46 % | 1 % | 38 % | 13 % | 43 % | 43 % | 100 % |
| 422181501 | Bizillon-Charcot Ouest | utilisable | `oui` | 1119 | 46 % | 2 % | 33 % | 14 % | 48 % | 36 % | 100 % |
| 422180403 | Badouillère Ouest | utilisable | `oui` | 843 | 47 % | 4 % | 31 % | 14 % | 40 % | 35 % | 100 % |
| 422180302 | Crêt de Roc Est | utilisable | `oui` | 977 | 47 % | 4 % | 32 % | 14 % | 42 % | 40 % | 78 % |
| 422180204 | Préfecture | utilisable | `oui` | 896 | 47 % | 2 % | 29 % | 20 % | 42 % | 36 % | 100 % |
| 422180404 | Saint-Roch | utilisable | `oui` | 1406 | 47 % | 3 % | 29 % | 15 % | 47 % | 22 % | 100 % |
| 422180803 | Bergson | utilisable | `oui` | 990 | 49 % | 1 % | 33 % | 12 % | 30 % | 66 % | 99 % |
| 422180801 | Carnot | utilisable | `oui` | 1251 | 49 % | 2 % | 27 % | 19 % | 40 % | 44 % | 98 % |
| 422181304 | La Marandinière | utilisable | `oui` | 362 | 50 % | 0 % | 39 % | 10 % | 42 % | 28 % | 65 % |
| 422180501 | Collines des Pères | utilisable | `oui` | 805 | 51 % | 4 % | 18 % | 25 % | 28 % | 52 % | 100 % |
| 422180201 | Élisée Reclus | utilisable | `oui` | 550 | 52 % | 3 % | 27 % | 13 % | 40 % | 39 % | 96 % |
| 422181001 | Le Treyve-Puits Thibaud | utilisable | `oui` | 580 | 53 % | 2 % | 29 % | 14 % | 40 % | 26 % | 58 % |
| 422180802 | Foch | utilisable | `oui` | 741 | 53 % | 3 % | 26 % | 13 % | 30 % | 64 % | 98 % |
| 422181502 | Centre Deux-Tréfilerie | utilisable | `oui` | 905 | 54 % | 2 % | 28 % | 10 % | 43 % | 63 % | 100 % |
| 422182205 | Solaure Nord | utilisable | `oui` | 521 | 54 % | 1 % | 33 % | 8 % | 37 % | 47 % | 90 % |
| 422180502 | Tardy | utilisable | `oui` | 996 | 54 % | 4 % | 21 % | 17 % | 44 % | 31 % | 71 % |
| 422182201 | Bellevue | utilisable | `oui` | 1004 | 55 % | 2 % | 29 % | 12 % | 37 % | 53 % | 95 % |
| 422180603 | Couriot-Tarentaise | utilisable | `oui` | 597 | 55 % | 2 % | 28 % | 11 % | 43 % | 49 % | 72 % |
| 422181601 | Montferré | utilisable | `oui` | 693 | 57 % | 4 % | 24 % | 10 % | 29 % | 42 % | 100 % |
| 422182101 | Valbenoîte | utilisable | `oui` | 1140 | 57 % | 2 % | 28 % | 9 % | 39 % | 33 % | 81 % |
| 422182204 | Le Mont-La Jomayère | utilisable | `oui` | 1018 | 57 % | 1 % | 21 % | 15 % | 27 % | 53 % | 29 % |
| 422180602 | Séverine | utilisable | `oui` | 469 | 59 % | 2 % | 19 % | 13 % | 34 % | 33 % | 38 % |
| 422182202 | Bellevue-Hôpital | utilisable | `oui` | 850 | 59 % | 4 % | 24 % | 12 % | 30 % | 49 % | 75 % |
| 422181405 | La Vivaraise | utilisable | `oui` | 980 | 59 % | 6 % | 16 % | 14 % | 24 % | 44 % | 100 % |
| 422180702 | Montaud | utilisable | `oui` | 840 | 60 % | 3 % | 25 % | 11 % | 23 % | 61 % | 66 % |
| 422182102 | La Rivière | utilisable | `oui` | 689 | 60 % | 3 % | 24 % | 8 % | 32 % | 43 % | 86 % |
| 422180804 | Barra Revollier | utilisable | `oui` | 736 | 61 % | 2 % | 27 % | 9 % | 31 % | 48 % | 94 % |
| 422182203 | Solaure Sud | fragile (158 actifs (< 300)) | `ordre de grandeur` | 158 | 61 % | 0 % | 29 % | 10 % | 40 % | 27 % | 89 % |
| 422181602 | La Cotonne | utilisable | `oui` | 749 | 62 % | 3 % | 27 % | 6 % | 27 % | 50 % | 18 % |
| 422180805 | La Terrasse-Étivallière-Grouchy | utilisable | `oui` | 821 | 62 % | 0,4 % | 27 % | 9 % | 27 % | 64 % | 95 % |
| 422180701 | Grand Clos | utilisable | `oui` | 1053 | 63 % | 1 % | 24 % | 12 % | 22 % | 53 % | 37 % |
| 422181103 | Montat-La Verrerie | utilisable | `oui` | 773 | 64 % | 1 % | 23 % | 11 % | 28 % | 48 % | 94 % |
| 422181403 | Fauriel-Le Platon | utilisable | `oui` | 1001 | 64 % | 3 % | 14 % | 16 % | 20 % | 53 % | 100 % |
| 422182206 | Jomayère-Béraudière | utilisable | `oui` | 818 | 64 % | 3 % | 21 % | 8 % | 32 % | 56 % | 74 % |
| 422181002 | Le Soleil | utilisable | `oui` | 756 | 65 % | 1 % | 23 % | 9 % | 34 % | 43 % | 74 % |
| 422181406 | Sainte-Chapelle | utilisable | `oui` | 837 | 66 % | 2 % | 13 % | 14 % | 26 % | 53 % | 86 % |
| 422181303 | Montchovet | utilisable | `oui` | 448 | 66 % | 1 % | 12 % | 20 % | 38 % | 41 % | 88 % |
| 422181104 | Monthieu | utilisable | `oui` | 875 | 66 % | 1 % | 22 % | 6 % | 34 % | 49 % | 99 % |
| 422182002 | La Palle | utilisable | `oui` | 382 | 67 % | 0 % | 24 % | 5 % | 40 % | 16 % | 81 % |
| 422181402 | Villebœuf | utilisable | `oui` | 941 | 68 % | 6 % | 12 % | 12 % | 15 % | 66 % | 90 % |
| 422181301 | Beaulieu | utilisable | `oui` | 509 | 68 % | 6 % | 20 % | 4 % | 35 % | 33 % | 97 % |
| 422181201 | La Richelandière | utilisable | `oui` | 1250 | 69 % | 3 % | 16 % | 9 % | 22 % | 61 % | 59 % |
| 422181803 | Chabrier-Forum | utilisable | `oui` | 355 | 70 % | 2 % | 23 % | 4 % | 35 % | 33 % | 100 % |
| 422181404 | Fauriel-Rond-Point | utilisable | `oui` | 837 | 71 % | 4 % | 11 % | 10 % | 22 % | 69 % | 98 % |
| 422181302 | Lassaigne | utilisable | `oui` | 841 | 72 % | 3 % | 13 % | 10 % | 23 % | 46 % | 92 % |
| 422182005 | La Métare | utilisable | `oui` | 1017 | 72 % | 4 % | 15 % | 7 % | 25 % | 47 % | 85 % |
| 422181701 | Bel-Air-Momey-Le Golf | utilisable | `oui` | 700 | 72 % | 4 % | 18 % | 3 % | 9 % | 76 % | 29 % |
| 422181804 | Gounod | utilisable | `oui` | 592 | 73 % | 1 % | 22 % | 4 % | 27 % | 29 % | 100 % |
| 422181203 | Montplaisir | utilisable | `oui` | 563 | 73 % | 3 % | 18 % | 7 % | 20 % | 58 % | 73 % |
| 422182001 | Parc de l'Europe Est | utilisable | `oui` | 622 | 73 % | 2 % | 20 % | 4 % | 22 % | 49 % | 39 % |
| 422181202 | Les Ovides | utilisable | `oui` | 694 | 73 % | 3 % | 18 % | 4 % | 28 % | 31 % | 94 % |
| 422182003 | Parc de l'Europe | utilisable | `oui` | 543 | 73 % | 1 % | 18 % | 6 % | 29 % | 38 % | 88 % |
| 422182004 | Le Portail Rouge | utilisable | `oui` | 687 | 73 % | 4 % | 14 % | 6 % | 26 % | 46 % | 97 % |
| 422181901 | Haut de Terrenoire-Bois d'Avaize | utilisable | `oui` | 683 | 75 % | 1 % | 15 % | 7 % | 12 % | 56 % | 33 % |
| 422181902 | Terrenoire Centre | utilisable | `oui` | 811 | 76 % | 0,4 % | 17 % | 5 % | 30 % | 45 % | 64 % |
| 422181802 | Les Castors | utilisable | `oui` | 420 | 76 % | 3 % | 19 % | 2 % | 34 % | 36 % | 97 % |
| 422181801 | Saint-Saëns-La Petite Bérarde | fragile (285 actifs (< 300)) | `ordre de grandeur` | 285 | 76 % | 0 % | 18 % | 3 % | 24 % | 58 % | 88 % |
| 422180901 | Le Marais Méons Grange-Neuve | utilisable | `oui` | 527 | 77 % | 0,4 % | 11 % | 9 % | 27 % | 51 % | 4 % |
| 422181702 | Côte Chaude-Michon | utilisable | `oui` | 885 | 78 % | 4 % | 12 % | 3 % | 22 % | 48 % | 30 % |
| 422181903 | Terrenoire Sud | utilisable | `oui` | 1056 | 83 % | 0,3 % | 9 % | 4 % | 17 % | 73 % | 9 % |
| 422181401 | La Dame Blanche | fragile (299 actifs (< 300)) | `ordre de grandeur` | 299 | 84 % | 4 % | 5 % | 5 % | 8 % | 91 % | 44 % |
| 422181805 | La Chèvre-La Bâtie-La Girardière | utilisable | `oui` | 573 | 85 % | 1 % | 9 % | 1 % | 16 % | 71 % | 18 % |
| 422182401 | Rochetaillée | utilisable | `oui` | 318 | 88 % | 2 % | 2 % | 2 % | 6 % | 69 % | 0 % |
| 422182103 | Valfuret-Crêt du Loup-Le Bernay | utilisable | `oui` | 720 | 89 % | 0,4 % | 6 % | 4 % | 12 % | 71 % | 10 % |
| 422182301 | Saint-Victor | utilisable | `oui` | 1553 | 92 % | 0 % | 3 % | 1 % | 2 % | 91 % | 0 % |
| 422181603 | Montmartre-Le Devey-Malacussy | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Saint-Étienne)

Actifs qui habitent l'ensemble de Saint-Étienne, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Saint-Étienne (42218) | 64 % | 50 % | 4 % | 23 % | 19 % | 12057 | utilisable | `oui` |
| Saint-Priest-en-Jarez (42275) | 4 % | 61 % | 2 % | 35 % | 1 % | 720 | utilisable | `oui` |
| Andrézieux-Bouthéon (42005) | 3 % | 89 % | 1 % | 9 % | 0,2 % | 523 | utilisable | `oui` |
| Saint-Chamond (42207) | 2 % | 84 % | 1 % | 14 % | 0,2 % | 438 | utilisable | `oui` |
| La Talaudière (42305) | 2 % | 79 % | 1 % | 18 % | 1 % | 368 | utilisable | `oui` |
| Firminy (42095) | 2 % | 85 % | 1 % | 13 % | 0,4 % | 339 | utilisable | `oui` |
| Lyon 3e Arrondissement (69383) | 1 % | 36 % | 1 % | 61 % | 2 % | 210 | utilisable | `oui` |
| Le Chambon-Feugerolles (42044) | 1 % | 83 % | 1 % | 15 % | 0 % | 199 | utilisable | `oui` |
| Roche-la-Molière (42189) | 1 % | 81 % | 1 % | 18 % | 0 % | 214 | utilisable | `oui` |
| La Ricamarie (42183) | 1 % | 80 % | 2 % | 18 % | 1 % | 161 | utilisable | `oui` |
| Villars (42330) | 1 % | 74 % | 1 % | 21 % | 1 % | 155 | utilisable | `oui` |
| Saint-Jean-Bonnefonds (42237) | 1 % | 72 % | 2 % | 26 % | 0 % | 133 | fragile | `ordre de grandeur` |
| Rive-de-Gier (42186) | 1 % | 86 % | 1 % | 14 % | 0 % | 112 | fragile | `ordre de grandeur` |
| Sorbiers (42302) | 1 % | 82 % | 1 % | 16 % | 0,3 % | 112 | fragile | `ordre de grandeur` |
| Lyon 7e Arrondissement (69387) | 1 % | 54 % | 0,3 % | 46 % | 0 % | 109 | fragile | `ordre de grandeur` |
| Saint-Just-Saint-Rambert (42279) | 1 % | 91 % | 0 % | 9 % | 0,4 % | 104 | fragile | `ordre de grandeur` |
| Veauche (42323) | 1 % | 93 % | 0 % | 3 % | 3 % | 89 | fragile | `ordre de grandeur` |
| L'Étrat (42092) | 0,4 % | 69 % | 5 % | 23 % | 1 % | 63 | fragile | `ordre de grandeur` |
| La Fouillouse (42097) | 0,4 % | 92 % | 0 % | 6 % | 0 % | 70 | fragile | `ordre de grandeur` |
| Saint-Genest-Lerpt (42223) | 0,4 % | 76 % | 0,4 % | 22 % | 0 % | 66 | fragile | `ordre de grandeur` |
| Villeurbanne (69266) | 0,4 % | 33 % | 0 % | 66 % | 1 % | 82 | fragile | `ordre de grandeur` |
| Lyon 2e Arrondissement (69382) | 0,4 % | 32 % | 0 % | 68 % | 0 % | 83 | fragile | `ordre de grandeur` |
| Montbrison (42147) | 0,3 % | 87 % | 0 % | 9 % | 2 % | 52 | fragile | `ordre de grandeur` |
| Saint-Héand (42234) | 0,3 % | 96 % | 0 % | 0 % | 4 % | 55 | fragile | `ordre de grandeur` |
| Givors (69091) | 0,3 % | 78 % | 0 % | 22 % | 1 % | 51 | fragile | `ordre de grandeur` |
| Lyon 6e Arrondissement (69386) | 0,3 % | 43 % | 2 % | 54 % | 2 % | 55 | fragile | `ordre de grandeur` |
| Lyon 8e Arrondissement (69388) | 0,3 % | 41 % | 5 % | 52 % | 0 % | 52 | fragile | `ordre de grandeur` |
| Feurs (42094) | 0,2 % | 82 % | 0 % | 16 % | 3 % | 44 | fragile | `ordre de grandeur` |
| L'Horme (42110) | 0,2 % | 96 % | 0 % | 4 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Lorette (42123) | 0,2 % | 77 % | 0 % | 23 % | 0 % | 42 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Saint-Étienne (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 30 525 à 122 099), avec au moins 150 lignes d'échantillon ; Saint-Étienne exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Saint-Étienne qui vont travailler principalement en voiture (valeur comparée) | 59 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 35 communes du groupe (chaque commune compte une fois) | 57 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Saint-Étienne moins la médiane du groupe (valeurs arrondies) | +2 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 35 | `oui` |

Communes du groupe (35, pour la vérification ; ne pas les citer) : Aix-en-Provence, Ajaccio, Amiens, Angers, Annecy, Avignon, Besançon, Boulogne-Billancourt, Brest, Caen, Cherbourg-en-Cotentin, Clermont-Ferrand, Dijon, Dunkerque, Grenoble, La Rochelle, Le Havre, Le Mans, Lille, Limoges, Metz, Montpellier, Mulhouse, Nancy, Nîmes, Orléans, Perpignan, Poitiers, Reims, Rennes, Rouen, Strasbourg, Toulon, Tours, Villeurbanne.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Saint-Étienne. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Saint-Étienne | Lignes (vers Saint-Étienne) | Statut (vers Saint-Étienne) | Usage (vers Saint-Étienne) |
|---|---:|---:|---:|---:|---:|---|---|
| Saint-Chamond (42207) | 77 % | 1 % | 11 % | 84 % | 833 | utilisable | `oui` |
| Firminy (42095) | 77 % | 1 % | 10 % | 80 % | 387 | utilisable | `oui` |
| Rive-de-Gier (42186) | 80 % | 0,4 % | 12 % | 83 % | 129 | fragile | `ordre de grandeur` |
| Le Chambon-Feugerolles (42044) | 80 % | 1 % | 9 % | 85 % | 399 | utilisable | `oui` |
| Roche-la-Molière (42189) | 83 % | 1 % | 9 % | 89 % | 293 | utilisable | `oui` |
| Unieux (42316) | 89 % | 1 % | 4 % | 93 % | 198 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Saint-Étienne (42218) | 93 % | 85 % | 90 % | 80 % | 89 % |
| Saint-Chamond (42207) | 83 % | 65 % | 79 % | 64 % | 86 % |
| Firminy (42095) | 73 % | 56 % | 81 % | 55 % | 91 % |
| Rive-de-Gier (42186) | 77 % | 63 % | 71 % | 57 % | 95 % |
| Le Chambon-Feugerolles (42044) | 59 % | 50 % | 70 % | 38 % | 99 % |
| Roche-la-Molière (42189) | 66 % | 66 % | 65 % | 48 % | 1 % |
| Unieux (42316) | 60 % | 47 % | 76 % | 38 % | 96 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,70 €/L | environ 80 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,70 €/L | environ 250 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,70 €/L | environ 590 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,45 €/L | environ 50 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,45 €/L | environ 160 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,45 €/L | environ 380 € |

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
| Carte de situation : Saint-Étienne et Saint-Chamond (42207), Firminy (42095), Rive-de-Gier (42186), Le Chambon-Feugerolles (42044), Roche-la-Molière (42189) et Unieux (42316) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


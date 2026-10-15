# Dossier d'entrée de rédaction · Nantes (44109)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/44109/fiche/fiche.json` (générée le 2026-10-15T15:56:24Z, jour de référence 2026-10-13, sha256 `0cd609186852d73d`). Dossier généré le 2026-10-15T16:15:48Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Nantes (44109), département 44, intercommunalité Nantes Métropole.
- **Groupe de communes nommé** : Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 44701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 4 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 10 % [IC 95 % : 10 % à 10 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 14 % [IC 95 % : 14 % à 15 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 2 % [IC 95 % : 2 % à 2 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 42 % [IC 95 % : 41 % à 43 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 28 % [IC 95 % : 28 % à 29 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes, y compris ceux qui ne se déplacent pas | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Nantes même | 70 % [IC 95 % : 69 % à 70 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes | commune de résidence et de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Nantes | 31 % [IC 95 % : 30 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Nantes qui travaillent à Nantes | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | 62 % [IC 95 % : 61 % à 64 %] | actifs occupés de 15 ans ou plus résidant à Nantes qui travaillent dans l'une de ces communes : Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | commune de travail : Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Nantes et hors de Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | 68 % [IC 95 % : 67 % à 69 %] | actifs occupés de 15 ans ou plus résidant à Nantes qui travaillent hors de Nantes et hors de Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | commune de travail : toute commune autre que Nantes, Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) moins travail à Nantes | +31 points | deux groupes distincts (voir les deux faits) | commune de travail : Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 19 % [IC 95 % : 19 % à 20 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 25 % [IC 95 % : 25 % à 26 %] | tous les actifs occupés de 15 ans ou plus résidant à Nantes | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 50 % [IC 95 % : 49 % à 51 %] | actifs occupés de 15 ans ou plus résidant à Nantes dont le ménage a au moins une voiture | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 47 % [IC 95 % : 46 % à 48 %] | actifs occupés de 15 ans ou plus résidant à Nantes, propriétaires de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 20 % [IC 95 % : 19 % à 21 %] | actifs occupés de 15 ans ou plus résidant à Nantes, propriétaires de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 7 % [IC 95 % : 6 % à 7 %] | actifs occupés de 15 ans ou plus résidant à Nantes, propriétaires de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 37 % [IC 95 % : 36 % à 38 %] | actifs occupés de 15 ans ou plus résidant à Nantes, propriétaires de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires du privé de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 13 % [IC 95 % : 12 % à 14 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires du privé de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 29 % [IC 95 % : 28 % à 30 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires du privé de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 16 % [IC 95 % : 15 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires du privé de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 46 % [IC 95 % : 45 % à 48 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires HLM de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 4 % [IC 95 % : 4 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires HLM de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 28 % [IC 95 % : 26 % à 29 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires HLM de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 19 % [IC 95 % : 18 % à 20 %] | actifs occupés de 15 ans ou plus résidant à Nantes, locataires HLM de leur logement | commune de résidence : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Nantes | environ 214 200 | — | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Nantes, de ceux qui habitent Nantes | 49 % | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nantes et habitent Nantes | 31 % [IC 95 % : 30 % à 31 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent Nantes | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nantes et habitent Nantes | 31 % [IC 95 % : 30 % à 31 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent Nantes | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nantes, de ceux qui habitent une autre commune de l'unité urbaine INSEE 44701 (liste des communes non exposée par la fiche) | 25 % | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nantes et habitent une autre commune de l'unité urbaine INSEE 44701 (liste des communes non exposée par la fiche) | 59 % [IC 95 % : 58 % à 60 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 44701 (liste des communes non exposée par la fiche) | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nantes et habitent une autre commune de l'unité urbaine INSEE 44701 (liste des communes non exposée par la fiche) | 26 % [IC 95 % : 25 % à 27 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 44701 (liste des communes non exposée par la fiche) | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nantes, de ceux qui habitent hors de l'unité urbaine INSEE 44701 | 26 % | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nantes et habitent hors de l'unité urbaine INSEE 44701 | 77 % [IC 95 % : 76 % à 78 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 44701 | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nantes et habitent hors de l'unité urbaine INSEE 44701 | 20 % [IC 95 % : 19 % à 21 %] | actifs occupés qui travaillent à Nantes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 44701 | commune de travail : Nantes (44109) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Decré-Cathédrale (IRIS 441090106) | 18 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nantes (44109), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Bout des Landes (IRIS 441090804) | 67 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nantes (44109), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +49 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Nantes (44109), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 31 % | toutes les résidences principales de Nantes | commune : Nantes (44109) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 16 % | toutes les résidences principales de Nantes | commune : Nantes (44109) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 57 % | toutes les résidences principales de Nantes | commune : Nantes (44109) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.44109.commerce_alim_500m` | Part des adresses de Nantes qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 93 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.grande_surface_500m` | Part des adresses de Nantes qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 62 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.pharmacie_500m` | Part des adresses de Nantes qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.medecin_generaliste_500m` | Part des adresses de Nantes qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.ecole_elementaire_500m` | Part des adresses de Nantes qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.college_1km` | Part des adresses de Nantes qui ont un collège à moins de 1 km (à vol d'oiseau) | 88 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.gare_2km` | Part des adresses de Nantes qui ont une gare à moins de 2 km (à vol d'oiseau) | 68 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.panier_quotidien_500m` | Part des adresses de Nantes qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 78 % | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.44109.bus_8h_7_9h` | Part des adresses de Nantes qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.44109.aucun_bus_7_9h` | Part des adresses de Nantes sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.44109.bus_4h_20_22h` | Part des adresses de Nantes qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nantes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nantes (44109) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Naolib » (https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,29 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,56 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,72 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,12 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,64 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,48 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nantes (centre communal de geo.api.gouv.fr : [-1.5603, 47.2382]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/44109/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Nantes Métropole s'appelle « Naolib » ; son autorité organisatrice est Nantes Métropole. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Naolib » : https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-11 | intercommunalité Nantes Métropole ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Naolib est https://naolib.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Naolib | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_weekend` | Les transports en commun et les parkings-relais sont annoncés gratuits le samedi et le dimanche. | https://naolib.fr/ (extrait vérifié le 2026-10-15 : « Transports en commun et parkings-relais sont gratuits le samedi et le dimanche ! ») | 2026-10-15 | non précisée (bandeau de la page d'accueil, consulté le 2026-10-15) | réseau Naolib ; Réseau Naolib, samedi et dimanche. Le détail est sur la page « En savoir plus ». Les jours fériés ne sont pas mentionnés. ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarification.gratuite_weekend.detail` | Du samedi 00h00 au dimanche 23h59, la gratuité couvre les tramways, bus et navibus, pour tous les voyageurs. La navette aéroport est exclue et exige toujours un titre. Les enfants de moins de 6 ans accompagnés voyagent gratuitement toute la semaine. Les mTickets ne peuvent pas être validés le week-end, sauf ceux de la navette aéroport et d'Aléop. | https://naolib.fr/gratuite-des-transports-en-commun (extrait vérifié le 2026-10-15 : « voyagez sans titre de transport ») | 2026-10-15 | Chaque week-end, du samedi 00h00 au dimanche 23h59. Aucune autre période n'est mentionnée, jours fériés compris. | réseau Naolib ; Tramways, bus et navibus de Naolib, tous publics le week-end. Exceptions : navette aéroport, cars scolaires et groupes scolaires. Aléop : TER dans l'agglomération nantaise, et cars 320 et 322 (arrêts Le Gray et Gergaudière), 350 et 360 dans le périmètre métropolitain. ; application à chaque commune non établie | `avec ses conditions` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité en semaine (hors moins de 6 ans accompagnés) | `introuvable` | https://naolib.fr/gratuite-des-transports-en-commun 2026-10-15 | Aucune gratuité générale en semaine n'apparaît. Seuls les enfants de moins de 6 ans accompagnés sont mentionnés. Ce n'est pas une preuve d'absence d'autres dispositifs. |
| Jours de circulation des lignes urbaines (dimanche, jours fériés) et période de validité des horaires | `introuvable` | https://naolib.fr/ 2026-10-15 | Je n'ai pas ouvert les fiches horaires par ligne. Aucune page consultée ne donne les jours fériés ni la période de validité des horaires. |
| Temps réel | `introuvable` | https://naolib.fr/fr/info-trafic-1 2026-10-15 | La page d'accueil ne décrit pas de service de temps réel. Elle renvoie vers la page « Info trafic » pour les perturbations, que je n'ai pas ouverte. Le contenu de plan.naolib.fr n'a pas été vérifié. |
| Extrait de la page de gratuité | `non vérifié` | https://naolib.fr/gratuite-des-transports-en-commun 2026-10-15 | Le fait détaillé repose sur le résumé de la page, pas sur un texte brut. Seul l'extrait « voyagez sans titre de transport » est une citation. Il est court et à confirmer. Les autres éléments (exclusions, Aléop, enfants de moins de 6 ans) sont reformulés. |
| Extrait « Horaires, itinéraires, plan » | `non vérifié` | https://plan.naolib.fr/ 2026-10-15 | Cet intitulé vient de la page d'accueil, naolib.fr, et non de plan.naolib.fr. L'extrait est à rattacher à https://naolib.fr/. Je n'ai pas ouvert plan.naolib.fr. |
| La rubrique « Horaires, itinéraires, plan » du site renvoie vers plan.naolib.fr, | `non vérifié` | https://plan.naolib.fr/ 2026-10-15 | URL hors du domaine officiel |
| calcul d'itinéraire ou fiches horaires officielles | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 441090106 | Decré-Cathédrale | utilisable | `oui` | 3121 | 18 % | 11 % | 35 % | 31 % | 61 % | 11 % | 99 % |
| 441090108 | Madeleine | utilisable | `oui` | 1929 | 20 % | 13 % | 35 % | 27 % | 55 % | 35 % | 100 % |
| 441090103 | Graslin-Commerce | utilisable | `oui` | 2427 | 21 % | 13 % | 29 % | 31 % | 51 % | 17 % | 100 % |
| 441090105 | Bretagne | utilisable | `oui` | 923 | 21 % | 12 % | 26 % | 27 % | 46 % | 23 % | 100 % |
| 441090508 | Richebourg-Saint-Clément | utilisable | `oui` | 1530 | 24 % | 18 % | 31 % | 19 % | 49 % | 30 % | 97 % |
| 441090102 | Gloriette-Feydeau | utilisable | `oui` | 756 | 26 % | 13 % | 33 % | 25 % | 48 % | 35 % | 100 % |
| 441090104 | Guist'hau | utilisable | `oui` | 1189 | 27 % | 11 % | 25 % | 28 % | 33 % | 46 % | 100 % |
| 441090404 | Talensac-Pont Morand | utilisable | `oui` | 1923 | 27 % | 20 % | 26 % | 22 % | 42 % | 39 % | 91 % |
| 441090509 | Waldeck-Sully | utilisable | `oui` | 1962 | 27 % | 20 % | 28 % | 18 % | 43 % | 59 % | 98 % |
| 441090109 | Champ de Mars | utilisable | `oui` | 1250 | 30 % | 17 % | 24 % | 25 % | 36 % | 67 % | 89 % |
| 441090403 | Viarme | utilisable | `oui` | 1514 | 31 % | 11 % | 32 % | 22 % | 42 % | 49 % | 100 % |
| 441090405 | Hauts Pavés | utilisable | `oui` | 1294 | 31 % | 16 % | 29 % | 16 % | 28 % | 37 % | 100 % |
| 441090505 | Coulmiers-Jardin des Plantes | utilisable | `oui` | 2029 | 31 % | 21 % | 28 % | 14 % | 36 % | 53 % | 79 % |
| 441090101 | Dobrée-Bon Port | utilisable | `oui` | 2601 | 32 % | 13 % | 24 % | 24 % | 40 % | 44 % | 100 % |
| 441090602 | République-Les Ponts | utilisable | `oui` | 3259 | 33 % | 15 % | 30 % | 17 % | 45 % | 36 % | 96 % |
| 441090408 | Bellamy-Barbin | utilisable | `oui` | 1776 | 33 % | 22 % | 25 % | 13 % | 34 % | 55 % | 93 % |
| 441090603 | Beaulieu-Mangin | utilisable | `oui` | 3617 | 33 % | 13 % | 35 % | 12 % | 35 % | 67 % | 89 % |
| 441090204 | Croix Bonneau-Bourderies | utilisable | `oui` | 957 | 33 % | 7 % | 49 % | 4 % | 40 % | 28 % | 99,8 % |
| 441090504 | Dalby | utilisable | `oui` | 2257 | 35 % | 17 % | 35 % | 8 % | 38 % | 44 % | 99,8 % |
| 441090312 | Bouhier | utilisable | `oui` | 1117 | 35 % | 14 % | 32 % | 16 % | 44 % | 52 % | 100 % |
| 441090510 | Saint-Donatien | utilisable | `oui` | 1550 | 35 % | 22 % | 24 % | 10 % | 32 % | 65 % | 97 % |
| 441090503 | Toutes Aides | utilisable | `oui` | 790 | 35 % | 27 % | 28 % | 5 % | 23 % | 52 % | 99,8 % |
| 441090604 | Île Beaulieu | utilisable | `oui` | 3653 | 36 % | 15 % | 33 % | 11 % | 31 % | 71 % | 62 % |
| 441090406 | Vannes-Saint-Pasquier | utilisable | `oui` | 1668 | 36 % | 19 % | 29 % | 10 % | 27 % | 59 % | 100 % |
| 441090501 | Caserne Mellinet | utilisable | `oui` | 1492 | 36 % | 18 % | 23 % | 14 % | 28 % | 72 % | 99,6 % |
| 441090311 | Gare Maritime | utilisable | `oui` | 1537 | 37 % | 14 % | 31 % | 13 % | 33 % | 68 % | 81 % |
| 441090409 | Saint-Félix | utilisable | `oui` | 1725 | 38 % | 19 % | 26 % | 11 % | 28 % | 73 % | 99 % |
| 441091102 | Saint-Jacques-Pirmil | utilisable | `oui` | 877 | 39 % | 14 % | 35 % | 8 % | 43 % | 40 % | 99 % |
| 441090402 | Monselet | utilisable | `oui` | 2390 | 39 % | 18 % | 18 % | 16 % | 23 % | 64 % | 95 % |
| 441090808 | Bourgeonnière-Petit Port | utilisable | `oui` | 1200 | 39 % | 11 % | 39 % | 6 % | 37 % | 61 % | 88 % |
| 441090407 | Rennes-Bellamy | utilisable | `oui` | 1485 | 40 % | 18 % | 29 % | 7 % | 25 % | 73 % | 97 % |
| 441090511 | Coudray | utilisable | `oui` | 1276 | 40 % | 25 % | 21 % | 8 % | 26 % | 70 % | 100 % |
| 441090309 | Mellinet | utilisable | `oui` | 1098 | 40 % | 17 % | 26 % | 10 % | 30 % | 68 % | 99 % |
| 441091008 | Pin Sec | utilisable | `oui` | 588 | 40 % | 6 % | 43 % | 7 % | 59 % | 6 % | 100 % |
| 441090401 | Procé | utilisable | `oui` | 1980 | 40 % | 19 % | 25 % | 10 % | 18 % | 71 % | 100 % |
| 441091101 | Grêneraie-Clos Torreau | utilisable | `oui` | 1612 | 42 % | 12 % | 38 % | 3 % | 37 % | 52 % | 70 % |
| 441090502 | Agenêts | utilisable | `oui` | 1715 | 42 % | 18 % | 25 % | 8 % | 26 % | 71 % | 100 % |
| 441090702 | Breil-Malville | utilisable | `oui` | 1289 | 42 % | 5 % | 44 % | 4 % | 39 % | 26 % | 99 % |
| 441090902 | Tortière | utilisable | `oui` | 1640 | 42 % | 17 % | 30 % | 7 % | 29 % | 79 % | 91 % |
| 441090205 | Mairie de Chantenay | utilisable | `oui` | 1401 | 42 % | 25 % | 24 % | 4 % | 22 % | 55 % | 99,6 % |
| 441090306 | Zola | utilisable | `oui` | 2878 | 43 % | 16 % | 27 % | 7 % | 31 % | 40 % | 97 % |
| 441090506 | Malakoff | utilisable | `oui` | 1376 | 43 % | 6 % | 40 % | 6 % | 41 % | 34 % | 75 % |
| 441090307 | Petit Bois | utilisable | `oui` | 1226 | 43 % | 21 % | 19 % | 12 % | 23 % | 61 % | 68 % |
| 441090705 | Beauséjour | utilisable | `oui` | 1809 | 43 % | 8 % | 40 % | 6 % | 22 % | 84 % | 48 % |
| 441090305 | Grillaud-Procé | utilisable | `oui` | 2154 | 44 % | 22 % | 24 % | 6 % | 19 % | 78 % | 62 % |
| 441090410 | Université-Michelet | utilisable | `oui` | 1714 | 44 % | 12 % | 32 % | 4 % | 32 % | 56 % | 49 % |
| 441090206 | Salorges-Sainte-Anne | utilisable | `oui` | 2128 | 45 % | 16 % | 24 % | 10 % | 23 % | 46 % | 98 % |
| 441090701 | Carcouet | utilisable | `oui` | 1093 | 45 % | 19 % | 22 % | 7 % | 16 % | 78 % | 93 % |
| 441090207 | Jean Macé | utilisable | `oui` | 1354 | 45 % | 24 % | 20 % | 5 % | 21 % | 56 % | 30 % |
| 441091005 | Jules Verne | utilisable | `oui` | 1172 | 45 % | 12 % | 30 % | 7 % | 26 % | 77 % | 96 % |
| 441090703 | Route de Vannes | utilisable | `oui` | 2017 | 45 % | 16 % | 28 % | 7 % | 22 % | 76 % | 99 % |
| 441090708 | Schuman | utilisable | `oui` | 1760 | 46 % | 19 % | 23 % | 6 % | 25 % | 71 % | 99,6 % |
| 441090203 | Lauriers | utilisable | `oui` | 1588 | 47 % | 8 % | 38 % | 4 % | 36 % | 38 % | 96 % |
| 441090303 | Dervallières-Chézine | utilisable | `oui` | 1731 | 47 % | 3 % | 42 % | 4 % | 39 % | 26 % | 78 % |
| 441091007 | Pilotière | utilisable | `oui` | 1266 | 47 % | 19 % | 21 % | 7 % | 21 % | 74 % | 94 % |
| 441090308 | Canclaux | utilisable | `oui` | 1390 | 47 % | 15 % | 21 % | 14 % | 19 % | 77 % | 66 % |
| 441090208 | Boucardière-Mallève | utilisable | `oui` | 1225 | 47 % | 18 % | 26 % | 6 % | 17 % | 64 % | 39 % |
| 441090905 | Ranzay-Grand Clos | utilisable | `oui` | 1633 | 47 % | 8 % | 34 % | 6 % | 32 % | 53 % | 70 % |
| 441090709 | Rond-Point de Rennes | utilisable | `oui` | 875 | 47 % | 20 % | 21 % | 6 % | 21 % | 58 % | 63 % |
| 441090901 | Plessis Tison | utilisable | `oui` | 1322 | 47 % | 17 % | 25 % | 5 % | 25 % | 70 % | 90 % |
| 441091103 | Saint-Jacques-Ripossière | utilisable | `oui` | 1461 | 47 % | 20 % | 24 % | 4 % | 20 % | 74 % | 60 % |
| 441091002 | Le Landreau | utilisable | `oui` | 2305 | 47 % | 14 % | 30 % | 4 % | 15 % | 87 % | 33 % |
| 441090707 | Barberie | utilisable | `oui` | 956 | 48 % | 10 % | 32 % | 6 % | 22 % | 91 % | 91 % |
| 441091001 | Mairie de Doulon | utilisable | `oui` | 1704 | 48 % | 19 % | 22 % | 3 % | 23 % | 71 % | 55 % |
| 441091105 | Lion d'Or-Gilarderie | utilisable | `oui` | 1110 | 49 % | 11 % | 27 % | 5 % | 18 % | 84 % | 76 % |
| 441090710 | Perverie | utilisable | `oui` | 688 | 49 % | 17 % | 27 % | 3 % | 22 % | 62 % | 18 % |
| 441091003 | Boulevard des Poilus | utilisable | `oui` | 1386 | 49 % | 18 % | 21 % | 4 % | 27 % | 71 % | 69 % |
| 441091009 | Haluchère-Perray | utilisable | `oui` | 1974 | 49 % | 8 % | 32 % | 6 % | 24 % | 65 % | 45 % |
| 441090706 | Gaudinière | utilisable | `oui` | 1317 | 49 % | 13 % | 26 % | 6 % | 20 % | 79 % | 60 % |
| 441090903 | Port Boyer | utilisable | `oui` | 691 | 49 % | 5 % | 39 % | 4 % | 41 % | 12 % | 77 % |
| 441090801 | Pont du Cens-Côte d'Or | utilisable | `oui` | 2004 | 49 % | 13 % | 30 % | 3 % | 22 % | 80 % | 67 % |
| 441090304 | Joncours-Procé | utilisable | `oui` | 892 | 50 % | 11 % | 26 % | 8 % | 24 % | 63 % | 24 % |
| 441091104 | Sèvre | utilisable | `oui` | 1110 | 50 % | 17 % | 22 % | 3 % | 13 % | 77 % | 2 % |
| 441090301 | Durantière | utilisable | `oui` | 2309 | 50 % | 16 % | 24 % | 3 % | 18 % | 76 % | 82 % |
| 441090904 | Éraudière-Renaudière | utilisable | `oui` | 1743 | 52 % | 17 % | 21 % | 4 % | 12 % | 89 % | 13 % |
| 441091006 | La Bottière | utilisable | `oui` | 1267 | 52 % | 7 % | 32 % | 6 % | 37 % | 26 % | 100 % |
| 441090202 | Mendès France | utilisable | `oui` | 1100 | 53 % | 5 % | 36 % | 2 % | 36 % | 54 % | 99 % |
| 441090906 | Beaujoire-Halvêque | utilisable | `oui` | 2952 | 54 % | 5 % | 30 % | 7 % | 30 % | 57 % | 65 % |
| 441090809 | Jonelière-Université | utilisable | `oui` | 1623 | 54 % | 10 % | 25 % | 7 % | 35 % | 66 % | 0,1 % |
| 441090806 | Santos-Dumont | utilisable | `oui` | 908 | 54 % | 8 % | 26 % | 8 % | 31 % | 42 % | 80 % |
| 441090302 | Contrie | utilisable | `oui` | 1096 | 54 % | 13 % | 21 % | 4 % | 22 % | 50 % | 78 % |
| 441090807 | Boissière | utilisable | `oui` | 1139 | 55 % | 3 % | 36 % | 3 % | 43 % | 32 % | 97 % |
| 441091011 | Le Vieux Doulon | utilisable | `oui` | 1497 | 55 % | 13 % | 23 % | 3 % | 17 % | 81 % | 73 % |
| 441090803 | Bout des Pavés-Chêne des Anglais | utilisable | `oui` | 1518 | 57 % | 3 % | 31 % | 3 % | 36 % | 30 % | 84 % |
| 441090201 | Plessis Cellier-Roche Maurice | utilisable | `oui` | 796 | 57 % | 7 % | 29 % | 3 % | 26 % | 59 % | 40 % |
| 441091010 | Route de Sainte-Luce | utilisable | `oui` | 1988 | 58 % | 10 % | 19 % | 5 % | 9 % | 91 % | 30 % |
| 441090910 | Saint-Joseph-Bourg | utilisable | `oui` | 2596 | 61 % | 10 % | 21 % | 3 % | 14 % | 83 % | 66 % |
| 441090802 | Chauvinière | utilisable | `oui` | 609 | 61 % | 7 % | 26 % | 2 % | 22 % | 66 % | 100 % |
| 441090909 | Saint-Joseph-Erdre | utilisable | `oui` | 2146 | 64 % | 11 % | 16 % | 3 % | 9 % | 90 % | 40 % |
| 441090804 | Bout des Landes | utilisable | `oui` | 886 | 67 % | 2 % | 25 % | 3 % | 30 % | 33 % | 9 % |
| 441090601 | Z.A. Sainte-Anne-Zone Portuaire | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441090507 | Vieux Malakoff | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441090209 | Z.A. Cheviré-Zone Portuaire | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441090805 | Z.A. Hauts de Gesvre | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441091013 | Z.A. Les Mauves | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441090908 | Z.A. Chantrerie-Gachet | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 441091012 | Z.A. Le Bois Briand | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Nantes)

Actifs qui habitent l'ensemble de Nantes, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Nantes (44109) | 70 % | 31 % | 18 % | 31 % | 14 % | 32324 | utilisable | `oui` |
| Saint-Herblain (44162) | 7 % | 61 % | 10 % | 26 % | 1 % | 3116 | utilisable | `oui` |
| Carquefou (44026) | 3 % | 75 % | 6 % | 15 % | 1 % | 1207 | utilisable | `oui` |
| Orvault (44114) | 2 % | 68 % | 6 % | 23 % | 2 % | 733 | utilisable | `oui` |
| Rezé (44143) | 2 % | 55 % | 14 % | 28 % | 1 % | 760 | utilisable | `oui` |
| La Chapelle-sur-Erdre (44035) | 1 % | 66 % | 10 % | 21 % | 0,4 % | 612 | utilisable | `oui` |
| Bouguenais (44020) | 1 % | 77 % | 6 % | 15 % | 0,3 % | 532 | utilisable | `oui` |
| Sainte-Luce-sur-Loire (44172) | 1 % | 73 % | 7 % | 18 % | 0,3 % | 360 | utilisable | `oui` |
| Vertou (44215) | 1 % | 68 % | 7 % | 21 % | 0 % | 413 | utilisable | `oui` |
| Saint-Sébastien-sur-Loire (44190) | 1 % | 60 % | 12 % | 25 % | 1 % | 339 | utilisable | `oui` |
| Couëron (44047) | 1 % | 82 % | 2 % | 14 % | 0 % | 270 | utilisable | `oui` |
| Saint-Nazaire (44184) | 1 % | 63 % | 1 % | 36 % | 1 % | 255 | utilisable | `oui` |
| Ancenis-Saint-Géréon (44003) | 0,4 % | 64 % | 2 % | 34 % | 0 % | 197 | utilisable | `oui` |
| Angers (49007) | 0,4 % | 39 % | 3 % | 57 % | 1 % | 160 | utilisable | `oui` |
| Basse-Goulaine (44009) | 0,3 % | 73 % | 6 % | 17 % | 0 % | 126 | fragile | `ordre de grandeur` |
| Saint-Aignan-Grandlieu (44150) | 0,3 % | 82 % | 2 % | 12 % | 1 % | 156 | utilisable | `oui` |
| Thouaré-sur-Loire (44204) | 0,3 % | 83 % | 2 % | 14 % | 0 % | 154 | utilisable | `oui` |
| Cholet (49099) | 0,3 % | 81 % | 1 % | 17 % | 1 % | 126 | fragile | `ordre de grandeur` |
| Montaigu-Vendée (85146) | 0,3 % | 85 % | 0,3 % | 12 % | 0,3 % | 135 | fragile | `ordre de grandeur` |
| La Roche-sur-Yon (85191) | 0,3 % | 67 % | 2 % | 28 % | 3 % | 119 | fragile | `ordre de grandeur` |
| Rennes (35238) | 0,2 % | 61 % | 4 % | 28 % | 7 % | 87 | fragile | `ordre de grandeur` |
| La Chevrolière (44041) | 0,2 % | 88 % | 1 % | 7 % | 0 % | 96 | fragile | `ordre de grandeur` |
| Haute-Goulaine (44071) | 0,2 % | 94 % | 3 % | 3 % | 0 % | 80 | fragile | `ordre de grandeur` |
| La Montagne (44101) | 0,2 % | 76 % | 11 % | 7 % | 2 % | 115 | fragile | `ordre de grandeur` |
| Montoir-de-Bretagne (44103) | 0,2 % | 81 % | 0 % | 20 % | 0 % | 65 | fragile | `ordre de grandeur` |
| Sautron (44194) | 0,2 % | 87 % | 0,4 % | 11 % | 0 % | 80 | fragile | `ordre de grandeur` |
| Les Sorinières (44198) | 0,2 % | 82 % | 3 % | 12 % | 0 % | 121 | fragile | `ordre de grandeur` |
| Treillières (44209) | 0,2 % | 88 % | 5 % | 7 % | 1 % | 128 | fragile | `ordre de grandeur` |
| Le Bignon (44014) | 0,1 % | 89 % | 0 % | 6 % | 1 % | 71 | fragile | `ordre de grandeur` |
| Bouaye (44018) | 0,1 % | 70 % | 0 % | 26 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Châteaubriant (44036) | 0,1 % | 66 % | 1 % | 29 % | 5 % | 61 | fragile | `ordre de grandeur` |
| Clisson (44043) | 0,1 % | 61 % | 0 % | 39 % | 0 % | 46 | fragile | `ordre de grandeur` |
| Grandchamp-des-Fontaines (44066) | 0,1 % | 93 % | 2 % | 4 % | 0 % | 60 | fragile | `ordre de grandeur` |
| Héric (44073) | 0,1 % | 100 % | 0 % | 0 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Le Loroux-Bottereau (44084) | 0,1 % | 91 % | 0 % | 5 % | 3 % | 60 | fragile | `ordre de grandeur` |
| Pont-Saint-Martin (44130) | 0,1 % | 99 % | 1 % | 0 % | 0 % | 50 | fragile | `ordre de grandeur` |
| Saint-Étienne-de-Montluc (44158) | 0,1 % | 98 % | 0 % | 2 % | 0 % | 53 | fragile | `ordre de grandeur` |
| Saint-Julien-de-Concelles (44169) | 0,1 % | 85 % | 0 % | 12 % | 0 % | 54 | fragile | `ordre de grandeur` |
| Sucé-sur-Erdre (44201) | 0,1 % | 78 % | 0 % | 14 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Vallet (44212) | 0,1 % | 93 % | 0 % | 8 % | 0 % | 49 | fragile | `ordre de grandeur` |
| Vigneux-de-Bretagne (44217) | 0,1 % | 100 % | 0 % | 0 % | 0 % | 51 | fragile | `ordre de grandeur` |
| Sèvremoine (49301) | 0,1 % | 94 % | 3 % | 3 % | 0 % | 41 | fragile | `ordre de grandeur` |
| Paris 8e Arrondissement (75108) | 0,1 % | 23 % | 3 % | 70 % | 0 % | 44 | fragile | `ordre de grandeur` |
| Paris 15e Arrondissement (75115) | 0,1 % | 18 % | 10 % | 64 % | 5 % | 46 | fragile | `ordre de grandeur` |
| Roissy-en-France (95527) | 0,1 % | 22 % | 0 % | 74 % | 0 % | 41 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes

Indisponible : groupe de 7 communes, sous le minimum de 10 : repère indisponible, critères non élargis. Ne pas écrire de comparaison.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Nantes. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Nantes | Lignes (vers Nantes) | Statut (vers Nantes) | Usage (vers Nantes) |
|---|---:|---:|---:|---:|---:|---|---|
| Saint-Herblain (44162) | 65 % | 7 % | 19 % | 51 % | 2237 | utilisable | `oui` |
| Rezé (44143) | 56 % | 14 % | 21 % | 38 % | 2322 | utilisable | `oui` |
| Saint-Sébastien-sur-Loire (44190) | 63 % | 12 % | 17 % | 46 % | 1609 | utilisable | `oui` |
| Orvault (44114) | 67 % | 7 % | 19 % | 53 % | 1299 | utilisable | `oui` |
| Vertou (44215) | 72 % | 6 % | 13 % | 57 % | 1271 | utilisable | `oui` |
| Couëron (44047) | 81 % | 2 % | 10 % | 72 % | 978 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Nantes (44109) | 93 % | 85 % | 88 % | 78 % | 68 % |
| Saint-Herblain (44162) | 81 % | 60 % | 77 % | 53 % | 30 % |
| Rezé (44143) | 85 % | 63 % | 73 % | 55 % | 66 % |
| Saint-Sébastien-sur-Loire (44190) | 78 % | 62 % | 52 % | 36 % | 99,8 % |
| Orvault (44114) | 83 % | 62 % | 64 % | 49 % | 0 % |
| Vertou (44215) | 50 % | 36 % | 34 % | 20 % | 52 % |
| Couëron (44047) | 51 % | 32 % | 57 % | 29 % | 67 % |

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

- Rang ou comparaison avec d'autres communes françaises (vélo, voiture, « taille comparable ») : groupe de 7 communes, sous le minimum de 10 : repère indisponible, critères non élargis.
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
| Carte de situation : Nantes et Saint-Herblain (44162), Rezé (44143), Saint-Sébastien-sur-Loire (44190), Orvault (44114), Vertou (44215) et Couëron (44047) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


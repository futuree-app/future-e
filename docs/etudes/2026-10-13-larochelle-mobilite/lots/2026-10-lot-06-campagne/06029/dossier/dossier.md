# Dossier d'entrée de rédaction · Cannes (06029)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/06029/fiche/fiche.json` (générée le 2026-10-15T16:29:53Z, jour de référence 2026-10-13, sha256 `e91bed77d2423280`). Dossier généré le 2026-10-15T16:30:23Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Cannes (06029), département 06, intercommunalité CA Cannes Pays de Lérins.
- **Groupe de communes nommé** : Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 06701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 6 % [IC 95 % : 5 % à 6 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 14 % [IC 95 % : 13 % à 15 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 7 % [IC 95 % : 6 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 56 % [IC 95 % : 55 % à 57 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 15 % [IC 95 % : 14 % à 16 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes, y compris ceux qui ne se déplacent pas | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Cannes même | 64 % [IC 95 % : 63 % à 66 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes | commune de résidence et de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Cannes | 46 % [IC 95 % : 44 % à 47 %] | actifs occupés de 15 ans ou plus résidant à Cannes qui travaillent à Cannes | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 73 % [IC 95 % : 70 % à 76 %] | actifs occupés de 15 ans ou plus résidant à Cannes qui travaillent dans l'une de ces communes : Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Cannes et hors de Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 74 % [IC 95 % : 72 % à 76 %] | actifs occupés de 15 ans ou plus résidant à Cannes qui travaillent hors de Cannes et hors de Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : toute commune autre que Cannes, Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) moins travail à Cannes | +27 points | deux groupes distincts (voir les deux faits) | commune de travail : Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 16 % [IC 95 % : 15 % à 17 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 30 % [IC 95 % : 29 % à 31 %] | tous les actifs occupés de 15 ans ou plus résidant à Cannes | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Cannes dont le ménage a au moins une voiture | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 62 % [IC 95 % : 60 % à 65 %] | actifs occupés de 15 ans ou plus résidant à Cannes, propriétaires de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 3 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Cannes, propriétaires de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 7 % [IC 95 % : 6 % à 8 %] | actifs occupés de 15 ans ou plus résidant à Cannes, propriétaires de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 43 % [IC 95 % : 41 % à 45 %] | actifs occupés de 15 ans ou plus résidant à Cannes, propriétaires de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 51 % [IC 95 % : 49 % à 53 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires du privé de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 2 % [IC 95 % : 1 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires du privé de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 24 % [IC 95 % : 23 % à 26 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires du privé de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 19 % [IC 95 % : 17 % à 21 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires du privé de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 60 % [IC 95 % : 56 % à 63 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires HLM de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 2 % [IC 95 % : 1 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires HLM de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 18 % [IC 95 % : 16 % à 21 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires HLM de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 28 % [IC 95 % : 26 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Cannes, locataires HLM de leur logement | commune de résidence : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Cannes | environ 39 000 | — | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Cannes, de ceux qui habitent Cannes | 45 % | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Cannes et habitent Cannes | 46 % [IC 95 % : 44 % à 47 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent Cannes | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Cannes et habitent Cannes | 15 % [IC 95 % : 14 % à 16 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent Cannes | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Cannes, de ceux qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 46 % | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Cannes et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 74 % [IC 95 % : 72 % à 75 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Cannes et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 13 % [IC 95 % : 12 % à 14 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Cannes, de ceux qui habitent hors de l'unité urbaine INSEE 06701 | 9 % | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Cannes et habitent hors de l'unité urbaine INSEE 06701 | 86 % [IC 95 % : 82 % à 88 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Cannes et habitent hors de l'unité urbaine INSEE 06701 | 10 % [IC 95 % : 8 % à 13 %] | actifs occupés qui travaillent à Cannes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Cannes (06029) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Le Vieux Port-Les îles (IRIS 060290117) | 29 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Cannes (06029), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Pont d'Avril-L'Abadie (IRIS 060290132) | 75 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Cannes (06029), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +46 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Cannes (06029), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 28 % | toutes les résidences principales de Cannes | commune : Cannes (06029) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 16 % | toutes les résidences principales de Cannes | commune : Cannes (06029) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 61 % | toutes les résidences principales de Cannes | commune : Cannes (06029) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.06029.commerce_alim_500m` | Part des adresses de Cannes qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.grande_surface_500m` | Part des adresses de Cannes qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 63 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.pharmacie_500m` | Part des adresses de Cannes qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 83 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.medecin_generaliste_500m` | Part des adresses de Cannes qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 81 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.ecole_elementaire_500m` | Part des adresses de Cannes qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 74 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.college_1km` | Part des adresses de Cannes qui ont un collège à moins de 1 km (à vol d'oiseau) | 87 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.gare_2km` | Part des adresses de Cannes qui ont une gare à moins de 2 km (à vol d'oiseau) | 94 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.panier_quotidien_500m` | Part des adresses de Cannes qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 69 % | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06029.bus_8h_7_9h` | Part des adresses de Cannes qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06029.aucun_bus_7_9h` | Part des adresses de Cannes sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06029.bus_4h_20_22h` | Part des adresses de Cannes qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Cannes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Cannes (06029) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Palmbus » (https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,73 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,18 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,65 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,53 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Cannes (centre communal de geo.api.gouv.fr : [7.0152, 43.5454]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/06029/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CA Cannes Pays de Lérins s'appelle « Palmbus » ; son autorité organisatrice est CA Cannes Pays de Lérins. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Palmbus » : https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-14 | intercommunalité CA Cannes Pays de Lérins ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Palmbus est https://palmdeplacements.fr/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/horaires-theoriques-et-temps-reel-gtfs-gtfs-rt-du-reseau-palmbus-cannes-pays-de-lerins ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Palmbus | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 060290110 | Gare | fragile (294 actifs (< 300)) | `ordre de grandeur` | 294 | 26 % | 0 % | 14 % | 51 % | 51 % | 34 % | 100 % |
| 060290111 | Croisette-Palm-Beach | fragile (218 actifs (< 300)) | `ordre de grandeur` | 218 | 27 % | 0 % | 6 % | 41 % | 41 % | 48 % | 98 % |
| 060290117 | Le Vieux Port-Les îles | utilisable | `oui` | 482 | 29 % | 2 % | 14 % | 31 % | 52 % | 23 % | 100 % |
| 060290109 | Saint-Nicolas | utilisable | `oui` | 1320 | 30 % | 1 % | 17 % | 34 % | 48 % | 38 % | 100 % |
| 060290115 | Tassigny | utilisable | `oui` | 777 | 37 % | 29 % | 4 % | 17 % | 31 % | 47 % | 100 % |
| 060290108 | Carnot | utilisable | `oui` | 1019 | 39 % | 2 % | 17 % | 24 % | 38 % | 40 % | 100 % |
| 060290116 | Stanislas | utilisable | `oui` | 406 | 43 % | 1 % | 20 % | 19 % | 46 % | 31 % | 100 % |
| 060290105 | La Peyrière | utilisable | `oui` | 702 | 44 % | 1 % | 15 % | 25 % | 31 % | 55 % | 75 % |
| 060290113 | Vallergues | utilisable | `oui` | 743 | 46 % | 1 % | 10 % | 28 % | 26 % | 52 % | 83 % |
| 060290112 | Petit Juas | utilisable | `oui` | 723 | 49 % | 1 % | 14 % | 24 % | 36 % | 54 % | 69 % |
| 060290119 | Le Riou | utilisable | `oui` | 568 | 51 % | 3 % | 10 % | 21 % | 30 % | 50 % | 100 % |
| 060290125 | Bocca Centre | utilisable | `oui` | 935 | 52 % | 1 % | 25 % | 10 % | 39 % | 48 % | 100 % |
| 060290103 | La Californie | utilisable | `oui` | 1029 | 52 % | 3 % | 8 % | 14 % | 21 % | 76 % | 42 % |
| 060290107 | Camp Long | utilisable | `oui` | 1012 | 53 % | 2 % | 13 % | 18 % | 29 % | 67 % | 98 % |
| 060290118 | Le Grand Jas | utilisable | `oui` | 874 | 54 % | 1 % | 20 % | 16 % | 31 % | 62 % | 59 % |
| 060290101 | Moure Rouge | utilisable | `oui` | 680 | 54 % | 4 % | 13 % | 12 % | 26 % | 65 % | 86 % |
| 060290106 | Terrefial | utilisable | `oui` | 578 | 54 % | 2 % | 7 % | 15 % | 18 % | 83 % | 26 % |
| 060290104 | Montfleury | utilisable | `oui` | 741 | 55 % | 3 % | 9 % | 19 % | 30 % | 66 % | 42 % |
| 060290102 | La Source | utilisable | `oui` | 865 | 55 % | 1 % | 8 % | 18 % | 31 % | 63 % | 32 % |
| 060290128 | Colline des Puits | utilisable | `oui` | 605 | 57 % | 1 % | 31 % | 6 % | 35 % | 66 % | 100 % |
| 060290123 | Saint-Joseph | utilisable | `oui` | 2078 | 62 % | 3 % | 21 % | 7 % | 28 % | 60 % | 98 % |
| 060290127 | Le Plan | utilisable | `oui` | 915 | 63 % | 3 % | 27 % | 3 % | 31 % | 56 % | 98 % |
| 060290130 | Ranguin | utilisable | `oui` | 1680 | 64 % | 1 % | 24 % | 5 % | 24 % | 59 % | 46 % |
| 060290121 | Pierre Longue | utilisable | `oui` | 648 | 64 % | 3 % | 10 % | 5 % | 12 % | 77 % | 7 % |
| 060290126 | Les Mûriers | utilisable | `oui` | 1083 | 64 % | 2 % | 17 % | 8 % | 29 % | 74 % | 95 % |
| 060290114 | Broussailles | utilisable | `oui` | 928 | 66 % | 2 % | 10 % | 8 % | 19 % | 70 % | 48 % |
| 060290120 | Croix des Gardes | utilisable | `oui` | 1471 | 70 % | 2 % | 12 % | 5 % | 11 % | 82 % | 19 % |
| 060290131 | Le Grand Saule | utilisable | `oui` | 1002 | 70 % | 2 % | 17 % | 4 % | 24 % | 62 % | 84 % |
| 060290122 | Font de Veyre | utilisable | `oui` | 949 | 74 % | 3 % | 11 % | 6 % | 13 % | 78 % | 27 % |
| 060290132 | Pont d'Avril-L'Abadie | utilisable | `oui` | 1421 | 75 % | 3 % | 9 % | 5 % | 10 % | 88 % | 33 % |
| 060290124 | Saint-Cassien-Bastide Rouge | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Cannes)

Actifs qui habitent l'ensemble de Cannes, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Cannes (06029) | 64 % | 46 % | 4 % | 15 % | 20 % | 5589 | utilisable | `oui` |
| Le Cannet (06030) | 5 % | 72 % | 1 % | 13 % | 6 % | 388 | utilisable | `oui` |
| Mougins (06085) | 4 % | 78 % | 1 % | 10 % | 1 % | 323 | utilisable | `oui` |
| Antibes (06004) | 4 % | 75 % | 1 % | 15 % | 2 % | 331 | utilisable | `oui` |
| Nice (06088) | 4 % | 69 % | 0,4 % | 25 % | 1 % | 307 | utilisable | `oui` |
| Mandelieu-la-Napoule (06079) | 3 % | 73 % | 3 % | 15 % | 3 % | 267 | utilisable | `oui` |
| Grasse (06069) | 3 % | 83 % | 0 % | 11 % | 1 % | 235 | utilisable | `oui` |
| Valbonne (06152) | 2 % | 83 % | 2 % | 10 % | 2 % | 170 | utilisable | `oui` |
| Biot (06018) | 1 % | 85 % | 1 % | 10 % | 0 % | 106 | fragile | `ordre de grandeur` |
| Mouans-Sartoux (06084) | 1 % | 85 % | 0 % | 10 % | 1 % | 112 | fragile | `ordre de grandeur` |
| Vallauris (06155) | 1 % | 88 % | 1 % | 7 % | 0 % | 107 | fragile | `ordre de grandeur` |
| 99999 (99999) | 1 % | 44 % | 2 % | 46 % | 0 % | 70 | fragile | `ordre de grandeur` |
| Cagnes-sur-Mer (06027) | 1 % | 67 % | 0 % | 24 % | 2 % | 47 | fragile | `ordre de grandeur` |
| Pégomas (06090) | 1 % | 82 % | 5 % | 5 % | 0 % | 67 | fragile | `ordre de grandeur` |
| Villeneuve-Loubet (06161) | 1 % | 69 % | 1 % | 16 % | 0 % | 53 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Cannes (autre commune d'une unité urbaine), comptant de la moitié au double de ses actifs occupés résidents (de 13 497 à 53 990), avec au moins 150 lignes d'échantillon ; Cannes exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Cannes qui vont travailler principalement en voiture (valeur comparée) | 56 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 140 communes du groupe (chaque commune compte une fois) | 42 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Cannes moins la médiane du groupe (valeurs arrondies) | +14 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 140 | `oui` |

Communes du groupe (140, pour la vérification ; ne pas les citer) : Aix-les-Bains, Alfortville, Anglet, Antibes, Antony, Argenteuil, Asnières-sur-Seine, Athis-Mons, Aubagne, Aubervilliers, Aulnay-sous-Bois, Bagneux, Bagnolet, Bezons, Bobigny, Bois-Colombes, Bondy, Bron, Bussy-Saint-Georges, Bègles, Cagnes-sur-Mer, Caluire-et-Cuire, Cergy, Champigny-sur-Marne, Charenton-le-Pont, Chatou, Chelles, Choisy-le-Roi, Châtenay-Malabry, Châtillon, Clamart, Clichy, Colombes, Colomiers, Conflans-Sainte-Honorine, Corbeil-Essonnes, Courbevoie, Créteil, Drancy, Fontenay-sous-Bois, Franconville, Gagny, Garges-lès-Gonesse, Gennevilliers, Grasse, Guyancourt, Herblay-sur-Seine, Houilles, Hyères, Issy-les-Moulineaux, Istres, Ivry-sur-Seine, Joué-lès-Tours, La Ciotat, La Courneuve, La Garenne-Colombes, La Seyne-sur-Mer, Le Blanc-Mesnil, Le Cannet, Le Perreux-sur-Marne, Le Plessis-Robinson, Levallois-Perret, Livry-Gargan, Maisons-Alfort, Malakoff, Mantes-la-Jolie, Marcq-en-Barœul, Marignane, Martigues, Massy, Melun, Meudon, Meyzieu, Montigny-le-Bretonneux, Montreuil, Montrouge, Mérignac, Nanterre, Neuilly-sur-Marne, Neuilly-sur-Seine, Nogent-sur-Marne, Noisy-le-Grand, Noisy-le-Sec, Oullins-Pierre-Bénite, Palaiseau, Pantin, Pessac, Plaisir, Poissy, Pontault-Combault, Pontoise, Puteaux, Rezé, Romainville, Rosny-sous-Bois, Roubaix, Rueil-Malmaison, Saint-Cloud, Saint-Denis, Saint-Germain-en-Laye, Saint-Herblain, Saint-Laurent-du-Var, Saint-Martin-d'Hères, Saint-Maur-des-Fossés, Saint-Médard-en-Jalles, Saint-Ouen-sur-Seine, Saint-Priest, Sainte-Geneviève-des-Bois, Sarcelles, Sartrouville, Savigny-sur-Orge, Schiltigheim, Sevran, Stains, Suresnes, Talence, Thiais, Tourcoing, Tournefeuille, Trappes, Tremblay-en-France, Vanves, Vaulx-en-Velin, Versailles, Villefranche-sur-Saône, Villejuif, Villemomble, Villenave-d'Ornon, Villeneuve-Saint-Georges, Villeneuve-d'Ascq, Villepinte, Villiers-sur-Marne, Vincennes, Vitrolles, Vitry-sur-Seine, Vénissieux, Wattrelos, Échirolles, Épinay-sur-Seine, Évry-Courcouronnes.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Cannes. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Cannes | Lignes (vers Cannes) | Statut (vers Cannes) | Usage (vers Cannes) |
|---|---:|---:|---:|---:|---:|---|---|
| Nice (06088) | 44 % | 3 % | 30 % | 54 % | 371 | utilisable | `oui` |
| Antibes (06004) | 66 % | 2 % | 11 % | 76 % | 470 | utilisable | `oui` |
| Cagnes-sur-Mer (06027) | 68 % | 3 % | 11 % | 65 % | 136 | fragile | `ordre de grandeur` |
| Grasse (06069) | 82 % | 1 % | 5 % | 83 % | 471 | utilisable | `oui` |
| Le Cannet (06030) | 67 % | 1 % | 11 % | 60 % | 1571 | utilisable | `oui` |
| Saint-Laurent-du-Var (06123) | 72 % | 3 % | 10 % | 76 % | 53 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Cannes (06029) | 91 % | 83 % | 74 % | 69 % | 94 % |
| Nice (06088) | 95 % | 89 % | 91 % | 85 % | 94 % |
| Antibes (06004) | 88 % | 80 % | 64 % | 57 % | 82 % |
| Cagnes-sur-Mer (06027) | 88 % | 77 % | 69 % | 58 % | 91 % |
| Grasse (06069) | 73 % | 58 % | 58 % | 46 % | 70 % |
| Le Cannet (06030) | 94 % | 89 % | 71 % | 63 % | 44 % |
| Saint-Laurent-du-Var (06123) | 90 % | 65 % | 72 % | 51 % | 77 % |

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
| Carte de la part de la voiture par secteur (IRIS) | réalisable | secteurs (tableau), iris.voiture.min/max | aucun pour la production : classes automatiques (--classes auto) et secteurs cités repérés par des numéros avec leur liste (--reperes) ; libellés posés à la main seulement pour une version soignée |
| Tableau accessible des secteurs (HTML et Markdown) | produit avec la carte | secteurs | aucun |
| Barres : part de la voiture selon la commune de travail | réalisable automatiquement | mobpro.voiture_selon_destination.* (groupes utilisables seulement) | aucun : la liste exacte des communes figure dans l'intitulé de la barre |
| Carte de situation : Cannes et Nice (06088), Antibes (06004), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


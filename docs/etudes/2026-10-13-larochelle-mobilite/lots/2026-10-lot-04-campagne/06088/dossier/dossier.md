# Dossier d'entrée de rédaction · Nice (06088)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/06088/fiche/fiche.json` (générée le 2026-10-15T15:55:28Z, jour de référence 2026-10-13, sha256 `138014e031a4c2fc`). Dossier généré le 2026-10-15T16:15:15Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Nice (06088), département 06, intercommunalité Métropole Nice Côte d'Azur.
- **Groupe de communes nommé** : Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 06701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 4 % [IC 95 % : 4 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 12 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 3 % [IC 95 % : 3 % à 4 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 8 % [IC 95 % : 7 % à 8 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 44 % [IC 95 % : 43 % à 44 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 30 % [IC 95 % : 29 % à 30 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice, y compris ceux qui ne se déplacent pas | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Nice même | 75 % [IC 95 % : 75 % à 76 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice | commune de résidence et de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Nice | 39 % [IC 95 % : 38 % à 40 %] | actifs occupés de 15 ans ou plus résidant à Nice qui travaillent à Nice | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 65 % [IC 95 % : 62 % à 67 %] | actifs occupés de 15 ans ou plus résidant à Nice qui travaillent dans l'une de ces communes : Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Nice et hors de Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 57 % [IC 95 % : 56 % à 59 %] | actifs occupés de 15 ans ou plus résidant à Nice qui travaillent hors de Nice et hors de Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : toute commune autre que Nice, Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) moins travail à Nice | +26 points | deux groupes distincts (voir les deux faits) | commune de travail : Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 23 % [IC 95 % : 23 % à 24 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 24 % [IC 95 % : 24 % à 25 %] | tous les actifs occupés de 15 ans ou plus résidant à Nice | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 47 % [IC 95 % : 46 % à 47 %] | actifs occupés de 15 ans ou plus résidant à Nice dont le ménage a au moins une voiture | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 51 % [IC 95 % : 50 % à 52 %] | actifs occupés de 15 ans ou plus résidant à Nice, propriétaires de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 4 % [IC 95 % : 4 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Nice, propriétaires de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 11 % [IC 95 % : 11 % à 12 %] | actifs occupés de 15 ans ou plus résidant à Nice, propriétaires de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 35 % [IC 95 % : 34 % à 36 %] | actifs occupés de 15 ans ou plus résidant à Nice, propriétaires de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires du privé de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires du privé de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 36 % [IC 95 % : 35 % à 37 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires du privé de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 14 % [IC 95 % : 13 % à 15 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires du privé de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 42 % [IC 95 % : 40 % à 44 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires HLM de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 2 % [IC 95 % : 1 % à 2 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires HLM de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 30 % [IC 95 % : 28 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires HLM de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 16 % [IC 95 % : 15 % à 17 %] | actifs occupés de 15 ans ou plus résidant à Nice, locataires HLM de leur logement | commune de résidence : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Nice | environ 155 500 | — | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Nice, de ceux qui habitent Nice | 68 % | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nice et habitent Nice | 39 % [IC 95 % : 38 % à 40 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent Nice | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nice et habitent Nice | 29 % [IC 95 % : 29 % à 30 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent Nice | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nice, de ceux qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 24 % | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nice et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 80 % [IC 95 % : 79 % à 81 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nice et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 11 % [IC 95 % : 10 % à 12 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Nice, de ceux qui habitent hors de l'unité urbaine INSEE 06701 | 8 % | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Nice et habitent hors de l'unité urbaine INSEE 06701 | 81 % [IC 95 % : 79 % à 83 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Nice et habitent hors de l'unité urbaine INSEE 06701 | 13 % [IC 95 % : 11 % à 14 %] | actifs occupés qui travaillent à Nice, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Nice (06088) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Vieux Nice-Visitation (IRIS 060880103) | 16 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nice (06088), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Crémat-Bellet (IRIS 060883501) | 83 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Nice (06088), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +67 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Nice (06088), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 37 % | toutes les résidences principales de Nice | commune : Nice (06088) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 14 % | toutes les résidences principales de Nice | commune : Nice (06088) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 48 % | toutes les résidences principales de Nice | commune : Nice (06088) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.06088.commerce_alim_500m` | Part des adresses de Nice qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 95 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.grande_surface_500m` | Part des adresses de Nice qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 75 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.pharmacie_500m` | Part des adresses de Nice qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 89 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.medecin_generaliste_500m` | Part des adresses de Nice qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.ecole_elementaire_500m` | Part des adresses de Nice qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 91 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.college_1km` | Part des adresses de Nice qui ont un collège à moins de 1 km (à vol d'oiseau) | 90 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.gare_2km` | Part des adresses de Nice qui ont une gare à moins de 2 km (à vol d'oiseau) | 94 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.panier_quotidien_500m` | Part des adresses de Nice qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 85 % | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06088.bus_8h_7_9h` | Part des adresses de Nice qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06088.aucun_bus_7_9h` | Part des adresses de Nice sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06088.bus_4h_20_22h` | Part des adresses de Nice qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Nice, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Nice (06088) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Lignes d'Azur » (https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,29 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,68 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,60 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 1,99 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,74 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,25 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Nice (centre communal de geo.api.gouv.fr : [7.2528, 43.7032]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-04-campagne/06088/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité Métropole Nice Côte d'Azur s'appelle « Lignes d'Azur » ; son autorité organisatrice est Métropole Nice Côte d'Azur. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Lignes d'Azur » : https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-15 | intercommunalité Métropole Nice Côte d'Azur ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Lignes d'Azur est https://www.lignesdazur.com/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Lignes d'Azur | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_65_ans` | La page d'accueil annonce des transports gratuits pour les métropolitains de plus de 65 ans. Les conditions, les lignes concernées et les exceptions ne figurent pas sur cette page. | https://www.lignesdazur.com/ (extrait vérifié le 2026-10-15 : « Transports gratuits pour les métropolitains de + de 65 ans ! ») | 2026-10-15 | non précisée | réseau Lignes d'Azur ; Métropolitains de plus de 65 ans. Lignes et exceptions non précisées. ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.tarification.gratuite_enfants` | La page des titres et tarifs mentionne un abonnement gratuit pour les enfants de moins de 11 ans. | https://www.lignesdazur.com/titres-et-tarifs/ (extrait vérifié le 2026-10-15 : « abonnement gratuit pour les enfants de moins de 11 ans ») | 2026-10-15 | non précisée | réseau Lignes d'Azur ; Enfants de moins de 11 ans. Lignes et conditions non précisées. ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.fiches_horaires` | Les fiches horaires sont publiées en PDF, une par ligne, sur la page des fiches horaires. | https://www.lignesdazur.com/fiches-horaires/ (extrait vérifié le 2026-10-15 : « Consultez les fiches horaires PDF ») | 2026-10-15 | non précisée | réseau Lignes d'Azur ; Lignes listées sur la page. Contenu des PDF non lu. ; application à chaque commune non établie | `avec ses conditions` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité générale du réseau (lignes concernées, exceptions) | `introuvable` | https://www.lignesdazur.com/titres-et-tarifs/ 2026-10-15 | La page des tarifs ne parle pas de gratuité du réseau. L'article sur la gratuité pour les plus de 65 ans n'a pas été ouvert, son URL n'étant pas connue. |
| Jours de circulation (dimanche, jours fériés, samedi) et période de validité des horaires | `introuvable` | https://www.lignesdazur.com/fiches-horaires/ 2026-10-15 | La page n'indique ni jours de circulation ni validité. Ces informations sont probablement dans les fiches PDF par ligne, qui n'ont pas été ouvertes (non vérifié). L'accueil signale une maintenance de la ligne 1 du 27 septembre au 22 octobre 2026, ce qui n'est pas un horaire. |
| Temps réel / infos trafic | `non vérifié` | https://www.lignesdazur.com/infos-trafic/ 2026-10-15 | Page repérée sur l'accueil mais non ouverte. |
| La rubrique « Préparer mon voyage » est présentée comme regroupant calcul d'itin | `non vérifié` | https://www.lignesdazur.com/preparer-mon-voyage/ 2026-10-15 | extrait introuvable sur la page |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-15 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-15 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 060880103 | Vieux Nice-Visitation | utilisable | `oui` | 421 | 16 % | 1 % | 36 % | 38 % | 66 % | 16 % | 100 % |
| 060881705 | Sasserno | utilisable | `oui` | 599 | 16 % | 5 % | 36 % | 30 % | 53 % | 22 % | 100 % |
| 060881702 | Hôpital Saint-Roch | utilisable | `oui` | 934 | 18 % | 4 % | 40 % | 28 % | 51 % | 19 % | 100 % |
| 060881502 | Thiole | utilisable | `oui` | 895 | 18 % | 7 % | 43 % | 21 % | 52 % | 32 % | 100 % |
| 060882202 | Notre-Dame | utilisable | `oui` | 949 | 18 % | 5 % | 29 % | 35 % | 61 % | 16 % | 100 % |
| 060882201 | Liberti-Albert 1er | utilisable | `oui` | 469 | 19 % | 2 % | 30 % | 34 % | 59 % | 27 % | 95 % |
| 060880102 | Vieux Nice-Sainte-Réparate | utilisable | `oui` | 466 | 19 % | 0 % | 45 % | 27 % | 71 % | 9 % | 100 % |
| 060881504 | Michel-Ange | utilisable | `oui` | 835 | 19 % | 5 % | 46 % | 20 % | 48 % | 28 % | 100 % |
| 060881701 | Promenade du Paillon | utilisable | `oui` | 665 | 19 % | 6 % | 30 % | 33 % | 50 % | 31 % | 100 % |
| 060882203 | Jean Médecin | utilisable | `oui` | 873 | 19 % | 4 % | 29 % | 39 % | 55 % | 25 % | 100 % |
| 060880205 | Riquier-Fontaine de la Ville | utilisable | `oui` | 867 | 20 % | 4 % | 47 % | 16 % | 52 % | 30 % | 100 % |
| 060881503 | Jeanne d'Arc-Fuon-Cauda | utilisable | `oui` | 877 | 20 % | 4 % | 40 % | 25 % | 49 % | 27 % | 100 % |
| 060880203 | Cassini | utilisable | `oui` | 753 | 20 % | 4 % | 41 % | 23 % | 59 % | 28 % | 100 % |
| 060880206 | Bonaparte | utilisable | `oui` | 1212 | 21 % | 4 % | 34 % | 16 % | 52 % | 28 % | 100 % |
| 060881402 | Bellevue | utilisable | `oui` | 875 | 21 % | 6 % | 40 % | 19 % | 53 % | 23 % | 100 % |
| 060881804 | Clément Roassal | utilisable | `oui` | 1318 | 22 % | 4 % | 44 % | 22 % | 57 % | 24 % | 100 % |
| 060880202 | Port | utilisable | `oui` | 653 | 23 % | 14 % | 29 % | 16 % | 41 % | 33 % | 100 % |
| 060880204 | Barla | utilisable | `oui` | 807 | 23 % | 3 % | 41 % | 24 % | 50 % | 34 % | 100 % |
| 060882304 | Thiers-Durante | utilisable | `oui` | 1048 | 23 % | 3 % | 35 % | 26 % | 59 % | 19 % | 100 % |
| 060881803 | Trachel | utilisable | `oui` | 752 | 23 % | 2 % | 43 % | 21 % | 60 % | 15 % | 100 % |
| 060880101 | Saleya-Château | utilisable | `oui` | 544 | 24 % | 7 % | 30 % | 23 % | 54 % | 26 % | 99 % |
| 060882502 | Bottero | utilisable | `oui` | 645 | 24 % | 8 % | 41 % | 16 % | 53 % | 33 % | 100 % |
| 060881703 | Raimbaldi | utilisable | `oui` | 872 | 24 % | 3 % | 44 % | 18 % | 64 % | 7 % | 100 % |
| 060880301 | République | utilisable | `oui` | 876 | 24 % | 6 % | 38 % | 22 % | 56 % | 22 % | 100 % |
| 060881704 | Desambrois | utilisable | `oui` | 898 | 24 % | 3 % | 29 % | 30 % | 50 % | 21 % | 100 % |
| 060880201 | Garibaldi | utilisable | `oui` | 973 | 25 % | 7 % | 34 % | 21 % | 49 % | 38 % | 100 % |
| 060882504 | Châteauneuf | utilisable | `oui` | 1165 | 25 % | 3 % | 36 % | 19 % | 52 % | 27 % | 86 % |
| 060880508 | Pierre Semard | utilisable | `oui` | 873 | 26 % | 2 % | 53 % | 8 % | 63 % | 33 % | 99 % |
| 060881805 | Garnier-Gare de Provence | utilisable | `oui` | 953 | 26 % | 3 % | 43 % | 17 % | 59 % | 15 % | 100 % |
| 060882303 | Clemenceau | utilisable | `oui` | 833 | 26 % | 4 % | 35 % | 28 % | 55 % | 19 % | 100 % |
| 060880605 | Pasteur-Saint-Pons | utilisable | `oui` | 451 | 26 % | 4 % | 47 % | 15 % | 61 % | 23 % | 80 % |
| 060880501 | Diables Bleus | utilisable | `oui` | 1881 | 26 % | 3 % | 45 % | 18 % | 51 % | 39 % | 100 % |
| 060881602 | Acropolis-XVe Corps | utilisable | `oui` | 940 | 26 % | 7 % | 35 % | 19 % | 46 % | 47 % | 100 % |
| 060882302 | Rossini | utilisable | `oui` | 499 | 27 % | 8 % | 30 % | 25 % | 50 % | 25 % | 100 % |
| 060880509 | Mont Gros | utilisable | `oui` | 448 | 27 % | 2 % | 60 % | 6 % | 57 % | 25 % | 94 % |
| 060881501 | Marceau | utilisable | `oui` | 1008 | 28 % | 2 % | 39 % | 25 % | 61 % | 18 % | 100 % |
| 060881802 | Vernier | utilisable | `oui` | 603 | 28 % | 5 % | 44 % | 18 % | 59 % | 20 % | 100 % |
| 060881101 | Puget | utilisable | `oui` | 1301 | 28 % | 6 % | 38 % | 14 % | 43 % | 46 % | 100 % |
| 060882703 | Faculté de Lettres | utilisable | `oui` | 788 | 28 % | 3 % | 53 % | 4 % | 27 % | 62 % | 69 % |
| 060882501 | Dante | utilisable | `oui` | 678 | 29 % | 7 % | 39 % | 17 % | 56 % | 32 % | 100 % |
| 060880303 | TNL-Beaumont | utilisable | `oui` | 602 | 29 % | 4 % | 41 % | 21 % | 52 % | 44 % | 100 % |
| 060882402 | Victor Hugo-Buffa | utilisable | `oui` | 719 | 30 % | 3 % | 31 % | 18 % | 50 % | 38 % | 100 % |
| 060880304 | Riquier-Arson | utilisable | `oui` | 1386 | 30 % | 4 % | 32 % | 25 % | 51 % | 25 % | 100 % |
| 060882503 | Potiers | utilisable | `oui` | 734 | 30 % | 8 % | 35 % | 16 % | 52 % | 33 % | 100 % |
| 060880305 | Riquier | utilisable | `oui` | 1717 | 31 % | 5 % | 38 % | 15 % | 46 % | 45 % | 100 % |
| 060881505 | Michelet | utilisable | `oui` | 1065 | 31 % | 2 % | 41 % | 18 % | 51 % | 37 % | 100 % |
| 060880402 | Carnot | utilisable | `oui` | 546 | 31 % | 8 % | 35 % | 13 % | 35 % | 46 % | 98 % |
| 060881506 | Borriglione-Saint Lambert | utilisable | `oui` | 777 | 31 % | 5 % | 41 % | 12 % | 47 % | 39 % | 100 % |
| 060880502 | Saint-Jean d'Angély | utilisable | `oui` | 1760 | 31 % | 5 % | 41 % | 17 % | 54 % | 32 % | 100 % |
| 060881401 | Évêché | utilisable | `oui` | 858 | 32 % | 7 % | 34 % | 15 % | 42 % | 36 % | 100 % |
| 060880302 | Pierre Sola | utilisable | `oui` | 860 | 32 % | 3 % | 43 % | 14 % | 48 % | 28 % | 100 % |
| 060881301 | Cessole | utilisable | `oui` | 1009 | 32 % | 3 % | 43 % | 12 % | 44 % | 34 % | 100 % |
| 060881903 | Parc Impérial | utilisable | `oui` | 757 | 32 % | 6 % | 29 % | 19 % | 48 % | 34 % | 100 % |
| 060882601 | Lenval | utilisable | `oui` | 700 | 33 % | 12 % | 40 % | 9 % | 58 % | 24 % | 97 % |
| 060880503 | Saint-Roch-Jean XXIII | utilisable | `oui` | 967 | 33 % | 5 % | 41 % | 8 % | 40 % | 46 % | 100 % |
| 060881303 | Gorbella | utilisable | `oui` | 943 | 33 % | 5 % | 40 % | 10 % | 42 % | 37 % | 100 % |
| 060881902 | Église Russe | utilisable | `oui` | 885 | 33 % | 8 % | 30 % | 17 % | 45 % | 42 % | 78 % |
| 060881302 | Saint-Barthélemy | utilisable | `oui` | 1164 | 34 % | 1 % | 36 % | 17 % | 40 % | 50 % | 100 % |
| 060882603 | Baumettes | utilisable | `oui` | 785 | 34 % | 7 % | 35 % | 13 % | 31 % | 42 % | 100 % |
| 060881403 | Le Righi | utilisable | `oui` | 1065 | 34 % | 5 % | 32 % | 13 % | 38 % | 49 % | 100 % |
| 060881305 | Villa Arson | utilisable | `oui` | 997 | 35 % | 2 % | 35 % | 13 % | 41 % | 39 % | 99 % |
| 060881601 | Carabacel | utilisable | `oui` | 735 | 35 % | 9 % | 20 % | 18 % | 31 % | 38 % | 97 % |
| 060882401 | France-Negresco | utilisable | `oui` | 620 | 35 % | 5 % | 26 % | 26 % | 56 % | 27 % | 83 % |
| 060882301 | Musiciens | utilisable | `oui` | 457 | 35 % | 3 % | 23 % | 21 % | 47 % | 30 % | 100 % |
| 060881901 | Grosso | utilisable | `oui` | 1150 | 36 % | 4 % | 35 % | 18 % | 49 % | 30 % | 82 % |
| 060881605 | Caravadossi-George V | utilisable | `oui` | 607 | 36 % | 5 % | 27 % | 21 % | 32 % | 47 % | 100 % |
| 060880504 | Vauban | utilisable | `oui` | 1267 | 36 % | 3 % | 32 % | 11 % | 29 % | 61 % | 100 % |
| 060880701 | Route de Turin | utilisable | `oui` | 746 | 36 % | 2 % | 46 % | 10 % | 47 % | 43 % | 100 % |
| 060881304 | Saint-Sylvestre | utilisable | `oui` | 919 | 37 % | 4 % | 34 % | 7 % | 34 % | 56 % | 100 % |
| 060880604 | Pasteur-Voie Romaine | utilisable | `oui` | 1203 | 37 % | 2 % | 43 % | 11 % | 56 % | 33 % | 100 % |
| 060880702 | Bon Voyage | utilisable | `oui` | 1262 | 37 % | 1 % | 53 % | 5 % | 43 % | 46 % | 26 % |
| 060881309 | Canavese | utilisable | `oui` | 1094 | 37 % | 2 % | 38 % | 8 % | 36 % | 43 % | 91 % |
| 060880505 | Saint-Roch-Ricolfi | utilisable | `oui` | 815 | 38 % | 3 % | 36 % | 14 % | 37 % | 57 % | 100 % |
| 060882104 | Madeleine | utilisable | `oui` | 492 | 38 % | 5 % | 29 % | 12 % | 45 % | 50 % | 85 % |
| 060883002 | Arenas-Cassin | utilisable | `oui` | 1025 | 39 % | 2 % | 44 % | 7 % | 32 % | 48 % | 92 % |
| 060881308 | La Clua | utilisable | `oui` | 858 | 39 % | 3 % | 40 % | 3 % | 37 % | 52 % | 88 % |
| 060882902 | Les Moulins | utilisable | `oui` | 1387 | 40 % | 2 % | 50 % | 5 % | 41 % | 42 % | 100 % |
| 060882701 | La Californie | utilisable | `oui` | 849 | 40 % | 2 % | 42 % | 4 % | 53 % | 37 % | 100 % |
| 060882602 | Magnan | utilisable | `oui` | 735 | 40 % | 2 % | 27 % | 12 % | 48 % | 38 % | 100 % |
| 060882102 | Madeleine Robiony | utilisable | `oui` | 1113 | 40 % | 4 % | 35 % | 8 % | 38 % | 55 % | 98 % |
| 060881306 | Cyrnos | utilisable | `oui` | 807 | 40 % | 3 % | 26 % | 9 % | 29 % | 58 % | 100 % |
| 060880601 | Lyautey-Gendarmerie | utilisable | `oui` | 1043 | 41 % | 3 % | 34 % | 11 % | 39 % | 56 % | 100 % |
| 060880507 | Roquebillière | utilisable | `oui` | 1390 | 42 % | 2 % | 40 % | 7 % | 38 % | 57 % | 100 % |
| 060880901 | Ariane-Les Chênes | utilisable | `oui` | 802 | 42 % | 0 % | 37 % | 14 % | 47 % | 36 % | 77 % |
| 060881606 | Cimiez-Valrose | utilisable | `oui` | 923 | 43 % | 7 % | 18 % | 16 % | 22 % | 61 % | 99 % |
| 060882101 | Carlone | utilisable | `oui` | 987 | 43 % | 5 % | 32 % | 8 % | 41 % | 39 % | 100 % |
| 060882903 | Digue des Français | utilisable | `oui` | 1096 | 43 % | 2 % | 42 % | 9 % | 43 % | 40 % | 100 % |
| 060882801 | Carras | utilisable | `oui` | 1210 | 44 % | 2 % | 43 % | 3 % | 42 % | 41 % | 69 % |
| 060880603 | Pasteur | utilisable | `oui` | 1133 | 46 % | 4 % | 34 % | 10 % | 46 % | 44 % | 100 % |
| 060881603 | Sainte-Rosalie-Arbre Inférieur | utilisable | `oui` | 1516 | 46 % | 5 % | 18 % | 13 % | 19 % | 65 % | 76 % |
| 060880602 | Paschetta | utilisable | `oui` | 640 | 47 % | 3 % | 24 % | 13 % | 31 % | 57 % | 100 % |
| 060881201 | Nice Nord-Saqui | utilisable | `oui` | 1069 | 47 % | 1 % | 42 % | 4 % | 34 % | 44 % | 72 % |
| 060881203 | Cernuschi | utilisable | `oui` | 952 | 47 % | 3 % | 36 % | 2 % | 21 % | 57 % | 100 % |
| 060882103 | La Bornala | utilisable | `oui` | 910 | 47 % | 1 % | 37 % | 6 % | 42 % | 45 % | 67 % |
| 060881604 | Cimiez | utilisable | `oui` | 907 | 48 % | 9 % | 19 % | 11 % | 20 % | 64 % | 94 % |
| 060883003 | Saint-Augustin | utilisable | `oui` | 1043 | 48 % | 1 % | 38 % | 5 % | 43 % | 37 % | 21 % |
| 060882901 | Les Siagnes | utilisable | `oui` | 806 | 48 % | 3 % | 33 % | 13 % | 26 % | 54 % | 82 % |
| 060881102 | Parc Chambrun | utilisable | `oui` | 1173 | 49 % | 3 % | 28 % | 9 % | 35 % | 42 % | 99 % |
| 060882002 | Saint-Philippe | utilisable | `oui` | 947 | 49 % | 3 % | 19 % | 13 % | 26 % | 58 % | 100 % |
| 060882904 | Paul Montel | utilisable | `oui` | 814 | 50 % | 0 % | 29 % | 8 % | 25 % | 59 % | 97 % |
| 060882803 | Lanterne-Mandariniers | utilisable | `oui` | 1184 | 50 % | 5 % | 27 % | 5 % | 21 % | 68 % | 95 % |
| 060881105 | Henry Dunant | utilisable | `oui` | 856 | 50 % | 2 % | 25 % | 7 % | 30 % | 62 % | 100 % |
| 060881002 | Brancolar-Régina | utilisable | `oui` | 880 | 50 % | 3 % | 21 % | 14 % | 33 % | 63 % | 74 % |
| 060882702 | Pastorelle-Bosquets | utilisable | `oui` | 664 | 50 % | 7 % | 27 % | 4 % | 27 % | 48 % | 99 % |
| 060881104 | Gravier | utilisable | `oui` | 1029 | 51 % | 1 % | 24 % | 5 % | 18 % | 76 % | 100 % |
| 060880403 | Mont Alban | utilisable | `oui` | 1157 | 51 % | 8 % | 18 % | 9 % | 15 % | 74 % | 40 % |
| 060881404 | Mantega | utilisable | `oui` | 693 | 52 % | 1 % | 21 % | 15 % | 28 % | 55 % | 100 % |
| 060881103 | Le Ray-Gravier-Dunant | utilisable | `oui` | 1415 | 53 % | 1 % | 23 % | 5 % | 21 % | 60 % | 100 % |
| 060880506 | Saint-Charles | utilisable | `oui` | 902 | 53 % | 2 % | 28 % | 7 % | 45 % | 40 % | 100 % |
| 060881004 | Cap de Croix | utilisable | `oui` | 1249 | 54 % | 4 % | 19 % | 9 % | 17 % | 75 % | 91 % |
| 060881202 | Comte de Falicon | utilisable | `oui` | 593 | 54 % | 2 % | 29 % | 5 % | 27 % | 9 % | 100 % |
| 060880401 | Mont Boron | utilisable | `oui` | 664 | 54 % | 8 % | 14 % | 7 % | 9 % | 71 % | 50 % |
| 060881204 | Las Planas-La Vallière | utilisable | `oui` | 1380 | 55 % | 1 % | 27 % | 3 % | 34 % | 62 % | 71 % |
| 060883402 | Madeleine-Nicolaï | utilisable | `oui` | 645 | 55 % | 1 % | 31 % | 2 % | 30 % | 63 % | 38 % |
| 060881307 | Cyrille Besset-La Forêt | utilisable | `oui` | 1227 | 56 % | 1 % | 19 % | 5 % | 21 % | 73 % | 96 % |
| 060881003 | Brancolar-Scudéri | utilisable | `oui` | 650 | 56 % | 3 % | 19 % | 11 % | 17 % | 73 % | 74 % |
| 060880903 | La Lauvette | utilisable | `oui` | 391 | 56 % | 2 % | 25 % | 7 % | 47 % | 37 % | 30 % |
| 060882905 | La Victorine-Grinda | utilisable | `oui` | 962 | 57 % | 1 % | 22 % | 10 % | 16 % | 74 % | 100 % |
| 060883403 | Madeleine Supérieure | utilisable | `oui` | 544 | 58 % | 2 % | 24 % | 4 % | 29 % | 67 % | 24 % |
| 060880904 | Ariane-Ripert | utilisable | `oui` | 777 | 59 % | 0,1 % | 27 % | 8 % | 51 % | 35 % | 100 % |
| 060880801 | Vinaigrier | utilisable | `oui` | 550 | 59 % | 3 % | 17 % | 6 % | 26 % | 70 % | 7 % |
| 060881001 | Cimiez-Monastère | utilisable | `oui` | 712 | 60 % | 1 % | 19 % | 9 % | 30 % | 67 % | 78 % |
| 060882001 | Le Piol-Cyrnos | utilisable | `oui` | 1004 | 60 % | 4 % | 13 % | 9 % | 19 % | 67 % | 75 % |
| 060881005 | Rimiez | utilisable | `oui` | 1333 | 62 % | 2 % | 15 % | 6 % | 14 % | 81 % | 52 % |
| 060880902 | Ariane-Monzie | utilisable | `oui` | 913 | 62 % | 0 % | 27 % | 6 % | 31 % | 64 % | 100 % |
| 060882906 | Plateaux Fleuris | utilisable | `oui` | 1374 | 62 % | 2 % | 20 % | 6 % | 16 % | 76 % | 98 % |
| 060880404 | Bischoffsheim | utilisable | `oui` | 534 | 63 % | 6 % | 13 % | 6 % | 15 % | 73 % | 94 % |
| 060883102 | Parc des Sports | utilisable | `oui` | 2047 | 64 % | 2 % | 21 % | 5 % | 17 % | 83 % | 84 % |
| 060882802 | Caucade | utilisable | `oui` | 1802 | 65 % | 3 % | 14 % | 4 % | 12 % | 86 % | 99 % |
| 060882805 | Napoléon III | utilisable | `oui` | 1511 | 68 % | 3 % | 13 % | 3 % | 12 % | 87 % | 73 % |
| 060883401 | Bellet-Magnan | utilisable | `oui` | 1266 | 68 % | 2 % | 15 % | 3 % | 19 % | 70 % | 18 % |
| 060882705 | Abbaye de Roseland | utilisable | `oui` | 690 | 68 % | 4 % | 10 % | 4 % | 11 % | 78 % | 66 % |
| 060883602 | Costière | utilisable | `oui` | 1084 | 70 % | 2 % | 11 % | 1 % | 8 % | 90 % | 37 % |
| 060882704 | Gattamua | utilisable | `oui` | 1593 | 71 % | 1 % | 12 % | 2 % | 12 % | 81 % | 68 % |
| 060880905 | Ariane-Saramito | utilisable | `oui` | 968 | 71 % | 2 % | 15 % | 8 % | 40 % | 49 % | 100 % |
| 060882804 | Lanterne | utilisable | `oui` | 1502 | 72 % | 2 % | 14 % | 3 % | 9 % | 85 % | 64 % |
| 060883701 | Saint-Pancrace-Pessicart | utilisable | `oui` | 1316 | 73 % | 2 % | 9 % | 1 % | 7 % | 86 % | 8 % |
| 060883601 | Saint-Pierre de Féric | utilisable | `oui` | 1119 | 74 % | 1 % | 10 % | 4 % | 9 % | 88 % | 9 % |
| 060883201 | Fabron-Terron-Archet | utilisable | `oui` | 1597 | 75 % | 2 % | 11 % | 3 % | 7 % | 88 % | 8 % |
| 060883101 | Spagnol-Sainte-Marguerite | utilisable | `oui` | 2075 | 75 % | 2 % | 9 % | 3 % | 8 % | 91 % | 20 % |
| 060883801 | Gairaut | utilisable | `oui` | 1107 | 76 % | 0,1 % | 12 % | 2 % | 5 % | 91 % | 8 % |
| 060883301 | Lingostière-Saint-Isidore | utilisable | `oui` | 2078 | 77 % | 1 % | 10 % | 4 % | 11 % | 88 % | 12 % |
| 060883202 | Saint-Antoine Ginestière | utilisable | `oui` | 1630 | 78 % | 1 % | 7 % | 1 % | 8 % | 91 % | 38 % |
| 060883501 | Crémat-Bellet | utilisable | `oui` | 1199 | 83 % | 0,4 % | 4 % | 1 % | 6 % | 91 % | 0 % |
| 060881801 | Gare Nice-Ville | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 060883001 | Arenas-Aéroport | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Nice)

Actifs qui habitent l'ensemble de Nice, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Nice (06088) | 75 % | 39 % | 4 % | 29 % | 15 % | 33951 | utilisable | `oui` |
| 99999 (99999) | 8 % | 39 % | 1 % | 46 % | 1 % | 3389 | utilisable | `oui` |
| Saint-Laurent-du-Var (06123) | 2 % | 62 % | 2 % | 26 % | 0,4 % | 920 | utilisable | `oui` |
| Carros (06033) | 2 % | 77 % | 0,3 % | 18 % | 1 % | 868 | utilisable | `oui` |
| Cagnes-sur-Mer (06027) | 1 % | 69 % | 2 % | 22 % | 1 % | 578 | utilisable | `oui` |
| Valbonne (06152) | 1 % | 64 % | 0,3 % | 32 % | 1 % | 514 | utilisable | `oui` |
| Antibes (06004) | 1 % | 69 % | 1 % | 27 % | 1 % | 482 | utilisable | `oui` |
| Cannes (06029) | 1 % | 54 % | 0,4 % | 41 % | 1 % | 371 | utilisable | `oui` |
| Biot (06018) | 1 % | 60 % | 3 % | 33 % | 1 % | 304 | utilisable | `oui` |
| Villeneuve-Loubet (06161) | 1 % | 64 % | 7 % | 23 % | 1 % | 288 | utilisable | `oui` |
| La Trinité (06149) | 1 % | 75 % | 0,1 % | 12 % | 5 % | 240 | utilisable | `oui` |
| Menton (06083) | 0,4 % | 51 % | 0 % | 43 % | 4 % | 164 | utilisable | `oui` |
| Villefranche-sur-Mer (06159) | 0,4 % | 57 % | 5 % | 23 % | 6 % | 176 | utilisable | `oui` |
| Beaulieu-sur-Mer (06011) | 0,3 % | 46 % | 4 % | 34 % | 2 % | 144 | fragile | `ordre de grandeur` |
| Mougins (06085) | 0,3 % | 81 % | 1 % | 11 % | 0 % | 128 | fragile | `ordre de grandeur` |
| Saint-André-de-la-Roche (06114) | 0,3 % | 76 % | 1 % | 13 % | 1 % | 119 | fragile | `ordre de grandeur` |
| Vallauris (06155) | 0,3 % | 67 % | 0 % | 30 % | 0 % | 113 | fragile | `ordre de grandeur` |
| Beausoleil (06012) | 0,2 % | 42 % | 0 % | 38 % | 1 % | 98 | fragile | `ordre de grandeur` |
| Contes (06048) | 0,2 % | 86 % | 0,3 % | 7 % | 2 % | 92 | fragile | `ordre de grandeur` |
| Drap (06054) | 0,2 % | 90 % | 0 % | 3 % | 1 % | 96 | fragile | `ordre de grandeur` |
| Grasse (06069) | 0,2 % | 84 % | 0 % | 11 % | 0,3 % | 107 | fragile | `ordre de grandeur` |
| Saint-Jean-Cap-Ferrat (06121) | 0,2 % | 66 % | 1 % | 13 % | 0,4 % | 116 | fragile | `ordre de grandeur` |
| Le Cannet (06030) | 0,1 % | 75 % | 3 % | 14 % | 4 % | 40 | fragile | `ordre de grandeur` |
| Cap-d'Ail (06032) | 0,1 % | 62 % | 0 % | 26 % | 0 % | 49 | fragile | `ordre de grandeur` |
| Colomars (06046) | 0,1 % | 98 % | 0 % | 2 % | 0 % | 44 | fragile | `ordre de grandeur` |
| Èze (06059) | 0,1 % | 58 % | 1 % | 22 % | 2 % | 59 | fragile | `ordre de grandeur` |
| La Gaude (06065) | 0,1 % | 84 % | 2 % | 12 % | 0 % | 59 | fragile | `ordre de grandeur` |
| Mandelieu-la-Napoule (06079) | 0,1 % | 85 % | 0 % | 9 % | 1 % | 42 | fragile | `ordre de grandeur` |
| Mouans-Sartoux (06084) | 0,1 % | 74 % | 0 % | 16 % | 3 % | 53 | fragile | `ordre de grandeur` |
| Roquebrune-Cap-Martin (06104) | 0,1 % | 62 % | 0 % | 25 % | 0 % | 57 | fragile | `ordre de grandeur` |
| Saint-Jeannet (06122) | 0,1 % | 72 % | 0 % | 19 % | 3 % | 44 | fragile | `ordre de grandeur` |
| Vence (06157) | 0,1 % | 70 % | 0 % | 19 % | 0 % | 70 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes

Indisponible : groupe de 9 communes, sous le minimum de 10 : repère indisponible, critères non élargis. Ne pas écrire de comparaison.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Nice. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Nice | Lignes (vers Nice) | Statut (vers Nice) | Usage (vers Nice) |
|---|---:|---:|---:|---:|---:|---|---|
| Antibes (06004) | 66 % | 2 % | 11 % | 71 % | 831 | utilisable | `oui` |
| Cannes (06029) | 56 % | 3 % | 15 % | 69 % | 307 | utilisable | `oui` |
| Cagnes-sur-Mer (06027) | 68 % | 3 % | 11 % | 72 % | 1813 | utilisable | `oui` |
| Grasse (06069) | 82 % | 1 % | 5 % | 89 % | 217 | utilisable | `oui` |
| Le Cannet (06030) | 67 % | 1 % | 11 % | 79 % | 234 | utilisable | `oui` |
| Saint-Laurent-du-Var (06123) | 72 % | 3 % | 10 % | 74 % | 1628 | utilisable | `oui` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Nice (06088) | 95 % | 89 % | 91 % | 85 % | 94 % |
| Antibes (06004) | 88 % | 80 % | 64 % | 57 % | 82 % |
| Cannes (06029) | 91 % | 83 % | 74 % | 69 % | 94 % |
| Cagnes-sur-Mer (06027) | 88 % | 77 % | 69 % | 58 % | 91 % |
| Grasse (06069) | 73 % | 58 % | 58 % | 46 % | 70 % |
| Le Cannet (06030) | 94 % | 89 % | 71 % | 63 % | 44 % |
| Saint-Laurent-du-Var (06123) | 90 % | 65 % | 72 % | 51 % | 77 % |

Libellés : `commerce_alim_500m` = un commerce alimentaire à moins de 500 m ; `pharmacie_500m` = une pharmacie à moins de 500 m ; `ecole_elementaire_500m` = une école élémentaire à moins de 500 m ; `panier_quotidien_500m` = à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m ; `gare_2km` = une gare à moins de 2 km.

## 7. Scénario pré-calculé : surcoût de carburant par an

Hypothèses (à écrire dans l'article) : 6 L/100 km, 200 allers-retours domicile-travail par an, hausse médiane de la fiche arrondie à 5 centimes. Carburant seul. Le scénario ne s'attribue à aucun quartier ni à aucune commune.

| id | Carburant | Trajet aller | Hausse retenue | Surcoût par an |
|---|---|---:|---:|---:|
| `scenario.carburant.gazole.5km` | gazole | 5 km | +0,60 €/L | environ 70 € |
| `scenario.carburant.gazole.15km` | gazole | 15 km | +0,60 €/L | environ 220 € |
| `scenario.carburant.gazole.35km` | gazole | 35 km | +0,60 €/L | environ 500 € |
| `scenario.carburant.e10.5km` | SP95-E10 | 5 km | +0,25 €/L | environ 30 € |
| `scenario.carburant.e10.15km` | SP95-E10 | 15 km | +0,25 €/L | environ 90 € |
| `scenario.carburant.e10.35km` | SP95-E10 | 35 km | +0,25 €/L | environ 210 € |

## 8. Faits absents : ne pas les écrire, ne pas les reconstituer

- Rang ou comparaison avec d'autres communes françaises (vélo, voiture, « taille comparable ») : groupe de 9 communes, sous le minimum de 10 : repère indisponible, critères non élargis.
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
| Carte de situation : Nice et Antibes (06004), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


# Dossier d'entrée de rédaction · Antibes (06004)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/06004/fiche/fiche.json` (générée le 2026-10-15T16:29:03Z, jour de référence 2026-10-13, sha256 `213e9b6552b942c8`). Dossier généré le 2026-10-15T16:29:30Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Antibes (06004), département 06, intercommunalité CA de Sophia Antipolis.
- **Groupe de communes nommé** : Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces six communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 06701 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 6 % [IC 95 % : 5 % à 6 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 8 % [IC 95 % : 7 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 2 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 7 % [IC 95 % : 6 % à 7 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 66 % [IC 95 % : 65 % à 67 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 11 % [IC 95 % : 11 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes, y compris ceux qui ne se déplacent pas | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Antibes même | 52 % [IC 95 % : 51 % à 54 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes | commune de résidence et de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Antibes | 58 % [IC 95 % : 56 % à 60 %] | actifs occupés de 15 ans ou plus résidant à Antibes qui travaillent à Antibes | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 76 % [IC 95 % : 73 % à 79 %] | actifs occupés de 15 ans ou plus résidant à Antibes qui travaillent dans l'une de ces communes : Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Antibes et hors de Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | 75 % [IC 95 % : 74 % à 77 %] | actifs occupés de 15 ans ou plus résidant à Antibes qui travaillent hors de Antibes et hors de Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | commune de travail : toute commune autre que Antibes, Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) moins travail à Antibes | +18 points | deux groupes distincts (voir les deux faits) | commune de travail : Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 9 % [IC 95 % : 8 % à 10 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 41 % [IC 95 % : 40 % à 42 %] | tous les actifs occupés de 15 ans ou plus résidant à Antibes | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 29 % [IC 95 % : 28 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Antibes dont le ménage a au moins une voiture | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 70 % [IC 95 % : 69 % à 72 %] | actifs occupés de 15 ans ou plus résidant à Antibes, propriétaires de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 3 % [IC 95 % : 2 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Antibes, propriétaires de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 3 % [IC 95 % : 3 % à 4 %] | actifs occupés de 15 ans ou plus résidant à Antibes, propriétaires de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 52 % [IC 95 % : 50 % à 54 %] | actifs occupés de 15 ans ou plus résidant à Antibes, propriétaires de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 61 % [IC 95 % : 59 % à 63 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires du privé de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 2 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires du privé de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 17 % [IC 95 % : 16 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires du privé de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 28 % [IC 95 % : 27 % à 30 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires du privé de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 66 % [IC 95 % : 63 % à 70 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires HLM de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 1 % [IC 95 % : 1 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires HLM de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 11 % [IC 95 % : 9 % à 14 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires HLM de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 35 % [IC 95 % : 31 % à 39 %] | actifs occupés de 15 ans ou plus résidant à Antibes, locataires HLM de leur logement | commune de résidence : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Antibes | environ 31 000 | — | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Antibes, de ceux qui habitent Antibes | 55 % | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Antibes et habitent Antibes | 58 % [IC 95 % : 56 % à 60 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent Antibes | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Antibes et habitent Antibes | 8 % [IC 95 % : 7 % à 9 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent Antibes | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Antibes, de ceux qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 41 % | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Antibes et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 82 % [IC 95 % : 80 % à 83 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Antibes et habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | 10 % [IC 95 % : 8 % à 11 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 06701 (liste des communes non exposée par la fiche) | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Antibes, de ceux qui habitent hors de l'unité urbaine INSEE 06701 | 5 % | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Antibes et habitent hors de l'unité urbaine INSEE 06701 | 85 % [IC 95 % : 79 % à 89 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Antibes et habitent hors de l'unité urbaine INSEE 06701 | 11 % [IC 95 % : 7 % à 15 %] | actifs occupés qui travaillent à Antibes, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 06701 | commune de travail : Antibes (06004) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Vieille Ville (IRIS 060040115) | 29 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Antibes (06004), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Les Semboules (IRIS 060040102) | 82 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Antibes (06004), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +53 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Antibes (06004), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 20 % | toutes les résidences principales de Antibes | commune : Antibes (06004) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 24 % | toutes les résidences principales de Antibes | commune : Antibes (06004) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 75 % | toutes les résidences principales de Antibes | commune : Antibes (06004) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.06004.commerce_alim_500m` | Part des adresses de Antibes qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.grande_surface_500m` | Part des adresses de Antibes qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 59 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.pharmacie_500m` | Part des adresses de Antibes qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 80 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.medecin_generaliste_500m` | Part des adresses de Antibes qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 77 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.ecole_elementaire_500m` | Part des adresses de Antibes qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 64 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.college_1km` | Part des adresses de Antibes qui ont un collège à moins de 1 km (à vol d'oiseau) | 83 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.gare_2km` | Part des adresses de Antibes qui ont une gare à moins de 2 km (à vol d'oiseau) | 82 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.panier_quotidien_500m` | Part des adresses de Antibes qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 57 % | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.06004.bus_8h_7_9h` | Part des adresses de Antibes qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06004.aucun_bus_7_9h` | Part des adresses de Antibes sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.06004.bus_4h_20_22h` | Part des adresses de Antibes qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Antibes, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Antibes (06004) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain ENVIBUS » (https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,33 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,64 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,70 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,18 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,68 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,50 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Antibes (centre communal de geo.api.gouv.fr : [7.1048, 43.5823]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-06-campagne/06004/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CA de Sophia Antipolis s'appelle « ENVIBUS » ; son autorité organisatrice est CA de Sophia Antipolis. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain ENVIBUS » : https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-10-13 | intercommunalité CA de Sophia Antipolis ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| site officiel du réseau | `inaccessible` | https://transport.data.gouv.fr/datasets/arrets-horaires-et-parcours-theoriques-des-bus-du-reseau-des-transports-publics-envibus 2026-10-15 | http://localhost : inaccessible (URLError) |
| tarification (gratuité, abonnements, exceptions) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| jours et périodes de circulation des lignes urbaines | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| calcul d'itinéraire ou fiches horaires officielles | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |   | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 060040115 | Vieille Ville | utilisable | `oui` | 814 | 29 % | 2 % | 26 % | 29 % | 50 % | 21 % | 99,9 % |
| 060040114 | Lagare | utilisable | `oui` | 948 | 40 % | 2 % | 21 % | 22 % | 36 % | 54 % | 98 % |
| 060040123 | Place de Gaulle | utilisable | `oui` | 1711 | 42 % | 3 % | 17 % | 22 % | 35 % | 54 % | 99,8 % |
| 060040125 | Juan Les Pins-Gallice | utilisable | `oui` | 1421 | 44 % | 3 % | 23 % | 14 % | 36 % | 59 % | 78 % |
| 060040124 | Ponteil | utilisable | `oui` | 1161 | 52 % | 3 % | 14 % | 17 % | 29 % | 64 % | 72 % |
| 060040103 | Le Cap | utilisable | `oui` | 321 | 56 % | 2 % | 3 % | 6 % | 12 % | 82 % | 8 % |
| 060040111 | La Colle | utilisable | `oui` | 1246 | 59 % | 3 % | 14 % | 11 % | 27 % | 71 % | 89 % |
| 060040126 | Pont du Lys-Antibes-Les Pins | utilisable | `oui` | 1711 | 62 % | 2 % | 16 % | 7 % | 24 % | 71 % | 97 % |
| 060040118 | Laval | utilisable | `oui` | 1003 | 63 % | 3 % | 14 % | 11 % | 25 % | 69 % | 98 % |
| 060040110 | Rabiac-La Paganne | utilisable | `oui` | 748 | 64 % | 3 % | 13 % | 7 % | 16 % | 70 % | 69 % |
| 060040121 | La Badine | utilisable | `oui` | 530 | 67 % | 1 % | 5 % | 7 % | 18 % | 91 % | 74 % |
| 060040105 | La Constance-Le Puy | utilisable | `oui` | 1471 | 68 % | 1 % | 12 % | 5 % | 11 % | 90 % | 2 % |
| 060040108 | La Fontonne | utilisable | `oui` | 1184 | 68 % | 4 % | 12 % | 6 % | 14 % | 88 % | 51 % |
| 060040120 | Saint-Jean | utilisable | `oui` | 928 | 70 % | 4 % | 7 % | 7 % | 17 % | 86 % | 37 % |
| 060040107 | Azurville-Val Claret | utilisable | `oui` | 1601 | 72 % | 2 % | 9 % | 6 % | 19 % | 71 % | 70 % |
| 060040106 | Les Groules-Les Bréguières | utilisable | `oui` | 1075 | 72 % | 3 % | 9 % | 5 % | 11 % | 91 % | 11 % |
| 060040122 | Saint-Maymes-Lauvert | utilisable | `oui` | 1265 | 73 % | 2 % | 8 % | 2 % | 9 % | 87 % | 39 % |
| 060040116 | Les Bastides | utilisable | `oui` | 1927 | 73 % | 3 % | 8 % | 3 % | 12 % | 85 % | 41 % |
| 060040109 | Les Combes | utilisable | `oui` | 3343 | 74 % | 2 % | 11 % | 4 % | 13 % | 79 % | 41 % |
| 060040112 | Les Prugnons | utilisable | `oui` | 1084 | 76 % | 1 % | 8 % | 6 % | 12 % | 91 % | 5 % |
| 060040119 | L'Estagnol | utilisable | `oui` | 2027 | 77 % | 2 % | 8 % | 2 % | 11 % | 88 % | 46 % |
| 060040104 | Les Cougoulins-Rastines | utilisable | `oui` | 999 | 78 % | 3 % | 5 % | 3 % | 8 % | 88 % | 0,2 % |
| 060040117 | Fontmerle | utilisable | `oui` | 1775 | 79 % | 2 % | 6 % | 2 % | 8 % | 90 % | 9 % |
| 060040102 | Les Semboules | utilisable | `oui` | 1277 | 82 % | 2 % | 5 % | 4 % | 5 % | 72 % | 75 % |
| 060040101 | Les Trois Moulins | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 060040113 | Port Vauban | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Antibes)

Actifs qui habitent l'ensemble de Antibes, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Antibes (06004) | 52 % | 58 % | 2 % | 8 % | 14 % | 5601 | utilisable | `oui` |
| Nice (06088) | 8 % | 71 % | 1 % | 19 % | 2 % | 831 | utilisable | `oui` |
| Valbonne (06152) | 8 % | 70 % | 4 % | 18 % | 1 % | 836 | utilisable | `oui` |
| Biot (06018) | 6 % | 77 % | 3 % | 12 % | 1 % | 695 | utilisable | `oui` |
| Cannes (06029) | 4 % | 76 % | 1 % | 14 % | 0 % | 470 | utilisable | `oui` |
| Vallauris (06155) | 4 % | 79 % | 3 % | 7 % | 2 % | 375 | utilisable | `oui` |
| Villeneuve-Loubet (06161) | 3 % | 75 % | 5 % | 12 % | 2 % | 377 | utilisable | `oui` |
| Cagnes-sur-Mer (06027) | 2 % | 84 % | 3 % | 10 % | 1 % | 223 | utilisable | `oui` |
| Mougins (06085) | 2 % | 84 % | 2 % | 6 % | 0 % | 201 | utilisable | `oui` |
| 99999 (99999) | 2 % | 47 % | 2 % | 46 % | 0 % | 168 | utilisable | `oui` |
| Saint-Laurent-du-Var (06123) | 1 % | 81 % | 0 % | 10 % | 1 % | 149 | fragile | `ordre de grandeur` |
| Grasse (06069) | 1 % | 89 % | 0 % | 9 % | 0 % | 126 | fragile | `ordre de grandeur` |
| Carros (06033) | 1 % | 86 % | 0 % | 13 % | 0 % | 88 | fragile | `ordre de grandeur` |
| Mouans-Sartoux (06084) | 1 % | 89 % | 0 % | 2 % | 0 % | 71 | fragile | `ordre de grandeur` |
| Mandelieu-la-Napoule (06079) | 1 % | 92 % | 0 % | 7 % | 0 % | 73 | fragile | `ordre de grandeur` |
| Le Cannet (06030) | 1 % | 83 % | 0 % | 10 % | 0 % | 70 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Antibes (autre commune d'une unité urbaine), comptant de la moitié au double de ses actifs occupés résidents (de 16 136 à 64 546), avec au moins 150 lignes d'échantillon ; Antibes exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Antibes qui vont travailler principalement en voiture (valeur comparée) | 66 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 98 communes du groupe (chaque commune compte une fois) | 41 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Antibes moins la médiane du groupe (valeurs arrondies) | +25 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 98 | `oui` |

Communes du groupe (98, pour la vérification ; ne pas les citer) : Alfortville, Anglet, Antony, Argenteuil, Asnières-sur-Seine, Athis-Mons, Aubagne, Aubervilliers, Aulnay-sous-Bois, Bagneux, Bagnolet, Bobigny, Bondy, Bron, Cagnes-sur-Mer, Caluire-et-Cuire, Cannes, Cergy, Champigny-sur-Marne, Chelles, Choisy-le-Roi, Châtenay-Malabry, Châtillon, Clamart, Clichy, Colombes, Colomiers, Conflans-Sainte-Honorine, Corbeil-Essonnes, Courbevoie, Créteil, Drancy, Fontenay-sous-Bois, Franconville, Gagny, Gennevilliers, Grasse, Houilles, Hyères, Issy-les-Moulineaux, Istres, Ivry-sur-Seine, La Courneuve, La Seyne-sur-Mer, Le Blanc-Mesnil, Le Cannet, Le Perreux-sur-Marne, Levallois-Perret, Livry-Gargan, Maisons-Alfort, Marcq-en-Barœul, Martigues, Massy, Melun, Meudon, Montreuil, Montrouge, Mérignac, Nanterre, Neuilly-sur-Marne, Neuilly-sur-Seine, Noisy-le-Grand, Noisy-le-Sec, Oullins-Pierre-Bénite, Palaiseau, Pantin, Pessac, Poissy, Pontault-Combault, Puteaux, Rezé, Rosny-sous-Bois, Roubaix, Rueil-Malmaison, Saint-Denis, Saint-Germain-en-Laye, Saint-Herblain, Saint-Maur-des-Fossés, Saint-Ouen-sur-Seine, Saint-Priest, Sarcelles, Sartrouville, Savigny-sur-Orge, Sevran, Suresnes, Talence, Tourcoing, Tremblay-en-France, Vaulx-en-Velin, Versailles, Villejuif, Villenave-d'Ornon, Villeneuve-d'Ascq, Vincennes, Vitry-sur-Seine, Vénissieux, Épinay-sur-Seine, Évry-Courcouronnes.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Antibes. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Antibes | Lignes (vers Antibes) | Statut (vers Antibes) | Usage (vers Antibes) |
|---|---:|---:|---:|---:|---:|---|---|
| Nice (06088) | 44 % | 3 % | 30 % | 69 % | 482 | utilisable | `oui` |
| Cannes (06029) | 56 % | 3 % | 15 % | 75 % | 331 | utilisable | `oui` |
| Cagnes-sur-Mer (06027) | 68 % | 3 % | 11 % | 79 % | 325 | utilisable | `oui` |
| Grasse (06069) | 82 % | 1 % | 5 % | 92 % | 244 | utilisable | `oui` |
| Le Cannet (06030) | 67 % | 1 % | 11 % | 77 % | 189 | utilisable | `oui` |
| Saint-Laurent-du-Var (06123) | 72 % | 3 % | 10 % | 77 % | 128 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Antibes (06004) | 88 % | 80 % | 64 % | 57 % | 82 % |
| Nice (06088) | 95 % | 89 % | 91 % | 85 % | 94 % |
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
| Carte de situation : Antibes et Nice (06088), Cannes (06029), Cagnes-sur-Mer (06027), Grasse (06069), Le Cannet (06030) et Saint-Laurent-du-Var (06123) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


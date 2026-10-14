# Dossier d'entrée de rédaction · Lorient (56121)

Fiche source : `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-01/56121/fiche/fiche.json` (générée le 2026-10-14T14:25:06Z, jour de référence 2026-10-13, sha256 `7cb5428183bd5f67`). Dossier généré le 2026-10-14T23:20:42Z par `outil/dossier_redaction.py`.

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

- **Commune étudiée** : Lorient (56121), département 56, intercommunalité CA Lorient Agglomération.
- **Groupe de communes nommé** : Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036). Origine de cette liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3). Présenter ce groupe avec cette liste exacte la première fois qu'il apparaît ; ensuite « ces cinq communes » suffit. Ce groupe n'est pas « toutes les communes limitrophes » ni « les communes voisines » en général.
- **Unité urbaine INSEE** : code 56601 ; sa composition n'est pas dans la fiche.
- **Secteurs** : IRIS de l'INSEE ; leurs noms ne sont pas toujours ceux des quartiers d'usage.
- **Bus** : GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)). Réseau et jour de référence non validés : tous les faits bus sont en attente de validation et ne s'écrivent pas. Les informations publiées par le réseau (section 2 bis) ne les valident pas et n'en tiennent pas lieu.

## 2. Faits

| id | Fait | Valeur | Population / dénominateur | Périmètre | Source, millésime | Statut | Usage |
|---|---|---|---|---|---|---|---|
| `mobpro.modes.pas_de_transport` | Part des actifs qui ne se déplacent pas pour travailler (travail à domicile) | 3 % [IC 95 % : 2 % à 3 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.marche` | Part des actifs qui vont travailler principalement à pied | 11 % [IC 95 % : 10 % à 12 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.velo` | Part des actifs qui vont travailler principalement à vélo | 8 % [IC 95 % : 8 % à 9 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.deux_roues_mot` | Part des actifs qui vont travailler principalement en deux-roues motorisé | 1 % [IC 95 % : 1 % à 1 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.voiture` | Part des actifs qui vont travailler principalement en voiture | 67 % [IC 95 % : 65 % à 68 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.modes.tc` | Part des actifs qui vont travailler principalement en transports en commun | 11 % [IC 95 % : 10 % à 11 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient, y compris ceux qui ne se déplacent pas | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.travaille_dans_commune` | Part des actifs résidents qui travaillent à Lorient même | 59 % [IC 95 % : 57 % à 60 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient | commune de résidence et de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.meme_commune` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent à Lorient | 56 % [IC 95 % : 54 % à 58 %] | actifs occupés de 15 ans ou plus résidant à Lorient qui travaillent à Lorient | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.communes_voisines` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent dans l'une de ces communes : Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | 80 % [IC 95 % : 77 % à 82 %] | actifs occupés de 15 ans ou plus résidant à Lorient qui travaillent dans l'une de ces communes : Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | commune de travail : Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.voiture_selon_destination.ailleurs` | Part allant travailler en voiture, parmi les actifs résidents qui travaillent hors de Lorient et hors de Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | 82 % [IC 95 % : 80 % à 83 %] | actifs occupés de 15 ans ou plus résidant à Lorient qui travaillent hors de Lorient et hors de Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | commune de travail : toute commune autre que Lorient, Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `ecart.voiture_destination.voisines_moins_meme_commune` | Écart de part de la voiture : travail dans Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) moins travail à Lorient | +24 points | deux groupes distincts (voir les deux faits) | commune de travail : Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) (exactement ; origine de la liste : automatique : communes de la même unité urbaine, au plus les 6 plus peuplées (REPRODUCTIBILITE.md §3)) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_sans_voiture` | Part des actifs dont le ménage n'a pas de voiture | 12 % [IC 95 % : 11 % à 13 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.actifs_menage_2_voitures_plus` | Part des actifs dont le ménage a deux voitures ou plus | 37 % [IC 95 % : 36 % à 38 %] | tous les actifs occupés de 15 ans ou plus résidant à Lorient | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | Part des actifs dont le ménage a au moins une voiture et qui ne la déclarent pas comme mode principal pour aller travailler (y compris sans déplacement) | 28 % [IC 95 % : 26 % à 29 %] | actifs occupés de 15 ans ou plus résidant à Lorient dont le ménage a au moins une voiture | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.voiture` | Part des actifs propriétaires qui vont travailler en voiture | 70 % [IC 95 % : 68 % à 72 %] | actifs occupés de 15 ans ou plus résidant à Lorient, propriétaires de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.velo` | Part des actifs propriétaires qui vont travailler à vélo | 11 % [IC 95 % : 10 % à 13 %] | actifs occupés de 15 ans ou plus résidant à Lorient, propriétaires de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_sans_voiture` | Part des actifs propriétaires qui ont un ménage sans voiture | 2 % [IC 95 % : 2 % à 3 %] | actifs occupés de 15 ans ou plus résidant à Lorient, propriétaires de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.proprietaires.menage_2_voitures_plus` | Part des actifs propriétaires qui ont un ménage à deux voitures ou plus | 52 % [IC 95 % : 49 % à 54 %] | actifs occupés de 15 ans ou plus résidant à Lorient, propriétaires de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.voiture` | Part des actifs locataires du privé qui vont travailler en voiture | 64 % [IC 95 % : 62 % à 67 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires du privé de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.velo` | Part des actifs locataires du privé qui vont travailler à vélo | 8 % [IC 95 % : 6 % à 9 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires du privé de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_sans_voiture` | Part des actifs locataires du privé qui ont un ménage sans voiture | 17 % [IC 95 % : 15 % à 19 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires du privé de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_prive.menage_2_voitures_plus` | Part des actifs locataires du privé qui ont un ménage à deux voitures ou plus | 28 % [IC 95 % : 26 % à 31 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires du privé de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.voiture` | Part des actifs locataires HLM qui vont travailler en voiture | 65 % [IC 95 % : 62 % à 69 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires HLM de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.velo` | Part des actifs locataires HLM qui vont travailler à vélo | 3 % [IC 95 % : 2 % à 5 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires HLM de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_sans_voiture` | Part des actifs locataires HLM qui ont un ménage sans voiture | 24 % [IC 95 % : 21 % à 27 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires HLM de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.statut_occupation.locataires_hlm.menage_2_voitures_plus` | Part des actifs locataires HLM qui ont un ménage à deux voitures ou plus | 18 % [IC 95 % : 15 % à 20 %] | actifs occupés de 15 ans ou plus résidant à Lorient, locataires HLM de leur logement | commune de résidence : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.total` | Nombre d'actifs qui travaillent à Lorient | environ 36 400 | — | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.part_des_emplois` | Part, parmi les actifs qui travaillent à Lorient, de ceux qui habitent Lorient | 37 % | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lorient et habitent Lorient | 56 % [IC 95 % : 54 % à 58 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent Lorient | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.habitent_la_commune.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lorient et habitent Lorient | 10 % [IC 95 % : 9 % à 11 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent Lorient | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Lorient, de ceux qui habitent une autre commune de l'unité urbaine INSEE 56601 (liste des communes non exposée par la fiche) | 22 % | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lorient et habitent une autre commune de l'unité urbaine INSEE 56601 (liste des communes non exposée par la fiche) | 82 % [IC 95 % : 80 % à 84 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 56601 (liste des communes non exposée par la fiche) | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.reste_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lorient et habitent une autre commune de l'unité urbaine INSEE 56601 (liste des communes non exposée par la fiche) | 7 % [IC 95 % : 5 % à 8 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent une autre commune de l'unité urbaine INSEE 56601 (liste des communes non exposée par la fiche) | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | Part, parmi les actifs qui travaillent à Lorient, de ceux qui habitent hors de l'unité urbaine INSEE 56601 | 42 % | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | Part allant travailler en voiture, parmi les actifs qui travaillent à Lorient et habitent hors de l'unité urbaine INSEE 56601 | 90 % [IC 95 % : 88 % à 91 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 56601 | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `mobpro.qui_vient_travailler.hors_unite_urbaine.tc` | Part allant travailler en transports en commun, parmi les actifs qui travaillent à Lorient et habitent hors de l'unité urbaine INSEE 56601 | 7 % [IC 95 % : 6 % à 9 %] | actifs occupés qui travaillent à Lorient, quel que soit leur lieu de résidence et qui habitent hors de l'unité urbaine INSEE 56601 | commune de travail : Lorient (56121) | INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 | utilisable | `oui` |
| `iris.voiture.min` | Part de la voiture la plus basse parmi les secteurs : Arsenal Maritime (IRIS 561210101) | 54 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Lorient (56121), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.voiture.max` | Part de la voiture la plus élevée parmi les secteurs : Lanveur Kerfichant (IRIS 561210303) | 78 % | actifs occupés de 15 ans ou plus du secteur | secteurs statistiques (IRIS) d'habitat de Lorient (56121), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `ecart.iris.voiture.max_moins_min` | Écart entre le secteur le plus haut et le plus bas (part de la voiture) | +24 points | deux secteurs distincts | secteurs statistiques (IRIS) d'habitat de Lorient (56121), au moins 300 actifs | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable (écart des valeurs arrondies) | `oui` |
| `iris.menages_commune.menages_sans_voiture` | Part des ménages sans voiture | 26 % | toutes les résidences principales de Lorient | commune : Lorient (56121) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_2_voitures_plus` | Part des ménages à deux voitures ou plus | 19 % | toutes les résidences principales de Lorient | commune : Lorient (56121) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `iris.menages_commune.menages_stationnement_reserve` | Part des ménages disposant d'un emplacement réservé au stationnement | 48 % | toutes les résidences principales de Lorient | commune : Lorient (56121) | INSEE, RP 2022, bases infracommunales Activité des résidents et Logement, 2022 | utilisable | `oui` |
| `acces.56121.commerce_alim_500m` | Part des adresses de Lorient qui ont un commerce alimentaire à moins de 500 m (à vol d'oiseau) | 97 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.grande_surface_500m` | Part des adresses de Lorient qui ont une grande surface à moins de 500 m (à vol d'oiseau) | 87 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.pharmacie_500m` | Part des adresses de Lorient qui ont une pharmacie à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.medecin_generaliste_500m` | Part des adresses de Lorient qui ont un médecin généraliste à moins de 500 m (à vol d'oiseau) | 88 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.ecole_elementaire_500m` | Part des adresses de Lorient qui ont une école élémentaire à moins de 500 m (à vol d'oiseau) | 86 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.college_1km` | Part des adresses de Lorient qui ont un collège à moins de 1 km (à vol d'oiseau) | 80 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.gare_2km` | Part des adresses de Lorient qui ont une gare à moins de 2 km (à vol d'oiseau) | 72 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.panier_quotidien_500m` | Part des adresses de Lorient qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m (à vol d'oiseau) | 76 % | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | utilisable | `oui` |
| `acces.56121.bus_8h_7_9h` | Part des adresses de Lorient qui ont au moins 8 passages de bus par heure entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.56121.aucun_bus_7_9h` | Part des adresses de Lorient sans aucun passage de bus entre 7 h et 9 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `acces.56121.bus_4h_20_22h` | Part des adresses de Lorient qui ont au moins 4 passages de bus par heure entre 20 h et 22 h à moins de 400 m | — (non donnée : en attente de validation) | toutes les adresses BAN de Lorient, chaque secteur (IRIS) pesant selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS) | adresses de Lorient (56121) | BAN ; INSEE BPE 2025 ; GTFS (auto : « Réseau urbain Izilo » (https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration), 1 candidat(s)), BPE 2025, GTFS du jour 2026-10-13 | en attente de validation (réseau de bus et jour de référence non validés : ne pas écrire, même arrondi) | `non` |
| `carburant.gazole.prix` | Prix médian du gazole, semaine du 2026-10-05 | 2,29 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.prix_un_an_avant` | Prix médian du gazole, semaine du 2025-10-06 | 1,56 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.gazole.ecart` | Hausse du prix médian du gazole en un an | 0,73 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix` | Prix médian du SP95-E10, semaine du 2026-10-05 | 2,12 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.prix_un_an_avant` | Prix médian du SP95-E10, semaine du 2025-10-06 | 1,64 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |
| `carburant.e10.ecart` | Hausse du prix médian du SP95-E10 en un an | 0,49 €/L | médiane entre stations du dernier prix déclaré dans la semaine | stations situées dans un rayon de 12 km (à vol d'oiseau) autour du centre de Lorient (centre communal de geo.api.gouv.fr : [-3.3799, 47.7494]) | prix-carburants.gouv.fr, flux officiel (archives annuelles), 2025 à 2026-10-13 | utilisable | `oui` |

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

Informations publiées par des sources officielles, recopiées à la main et datées (consultation : 2026-10-15 ; fichier `/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/etude-larochelle/docs/etudes/2026-10-13-larochelle-mobilite/lots/2026-10-lot-01/56121/dossier/complement.json`). Ce ne sont **pas** des résultats calculés. Une fréquence ou une desserte n'y figure que si la source la donne explicitement, avec son périmètre (ligne ou service, sens, jours, période) : tu l'écris dans ce périmètre, sans la généraliser à d'autres lignes ni au réseau, et tu n'en tires ni temps de trajet, ni desserte d'une adresse. Elles servent la question « utiliser moins sa voiture » ; elles ne permettent de conclure ni sur la faisabilité d'un trajet, ni sur la possibilité de se passer d'une deuxième voiture ou de vivre sans voiture.

Usage : `oui` = à écrire tel quel, avec sa date ou sa période de validité si elle est utile ; `avec ses conditions` = à n'écrire qu'avec toutes ses conditions (public, horaires, réservation), sinon à laisser ; `non` = ne pas écrire. La colonne « À ne pas en déduire » s'applique toujours.

| id | Information | Source | Consulté le | Validité | Périmètre | Usage | À ne pas en déduire |
|---|---|---|---|---|---|---|---|
| `doc.reseau.identite` | Le réseau de transport urbain de l'intercommunalité CA Lorient Agglomération s'appelle « Izilo » ; son autorité organisatrice est CA Lorient Agglomération. | transport.data.gouv.fr (Point d'accès national aux données de transport), jeu « Réseau urbain Izilo » : https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration ; nom confirmé par : intitulé du jeu de données et agence du GTFS | 2026-10-15 | jeu de données mis à jour le 2026-09-18 | intercommunalité CA Lorient Agglomération ; la desserte de chaque commune et de chaque adresse n'est pas établie par cette source | `oui` | Nom commercial du réseau, autorité organisatrice et exploitant sont trois choses distinctes ; l'exploitant n'est pas donné par cette source (le nommer seulement si une autre information du dossier le donne, comme exploitant). Ne dit ni quelles lignes passent dans la commune, ni à quelle fréquence, ni à quel tarif. |
| `doc.reseau.site` | Le site du réseau Izilo est https://www.izilo.bzh/. | horaires théoriques du réseau (GTFS, fichier agency.txt), publiés sur https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-izilo-format-gtfs-de-lorient-agglomeration ; site joint le 2026-10-15 | 2026-10-15 | non précisée | réseau Izilo | `oui` | Pour renvoyer le lecteur vérifier son trajet et ses horaires ; ne dit rien de la desserte. |
| `doc.tarification.gratuite_moins_4_ans` | Les enfants de moins de 4 ans accompagnés voyagent gratuitement. Le réseau n'est pas gratuit pour les autres publics : les titres sont payants (par exemple 1 Voyage à 1€50). | https://www.izilo.bzh/titres-et-tarifs/titres-abonnements (extrait vérifié le 2026-10-14 : « Les enfants de moins de 4 ans accompagnés voyagent gratuitement. ») | 2026-10-14 | non précisée | réseau Izilo ; Enfants de moins de 4 ans accompagnés, réseau IZILO (bus et bateaux) ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.reservation.ligne35` | Certains horaires de la ligne 35 (Groix) sont soumis à réservation. | https://www.izilo.bzh/se-deplacer/lignes-et-horaires (extrait vérifié le 2026-10-14 : « Certains horaires sont soumis à la réservation. ») | 2026-10-14 | non précisée | réseau Izilo ; Ligne 35 ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.reservation.lignes102_103` | Les lignes 102 et 103 fonctionnent uniquement sur réservation du 29.06 au 30.08. L'année n'est pas précisée dans l'extrait. | https://www.izilo.bzh/se-deplacer/lignes-et-horaires (extrait vérifié le 2026-10-14 : « Du 29.06 au 30.08 : fonctionnement uniquement sur réservation ») | 2026-10-14 | du 29.06 au 30.08, année non précisée | réseau Izilo ; Lignes 102 et 103 ; application à chaque commune non établie | `avec ses conditions` |  |
| `doc.verification.fiche_horaires` | La page Lignes et horaires propose une fiche horaires personnalisée. Elle renvoie aussi vers les infos trafic (/se-deplacer/infos-trafic) et vers le plan du réseau (/se-deplacer/plan-interactif). Les horaires détaillés sont sur les pages de chaque ligne. | https://www.izilo.bzh/se-deplacer/lignes-et-horaires (extrait vérifié le 2026-10-14 : « Editez ici votre trajet adapté ») | 2026-10-14 | non précisée | réseau Izilo ; Réseau IZILO ; application à chaque commune non établie | `oui` |  |

**État des recherches documentaires.** `vérifié` : information trouvée et contrôlée (ci-dessus) ; `non vérifié` : trouvée mais non contrôlée, ne s'écrit pas ; `introuvable` : cherchée sans résultat ; `inaccessible` : source hors d'atteinte ; `non recherché` : pas cherchée. Seul `vérifié` s'écrit. **Une information absente, introuvable ou non recherchée ne veut pas dire que le service n'existe pas** : n'écris ni « pas de bus le dimanche », ni « pas de réseau gratuit », ni rien d'équivalent.

| Sujet | Statut | Source, date | Note |
|---|---|---|---|
| Gratuité générale du réseau | `introuvable` | https://www.izilo.bzh/titres-et-tarifs/titres-abonnements 2026-10-14 | La page tarifs présente des titres payants. Aucune gratuité de ligne ou de public (hors moins de 4 ans) n'a été trouvée sur les pages consultées. Cela ne prouve pas qu'il n'y en a pas. |
| Jours de circulation des lignes urbaines (dimanche, jours fériés, samedi) | `introuvable` | https://www.izilo.bzh/se-deplacer/lignes-et-horaires 2026-10-14 | Les pages consultées ne le disent pas. Il faut consulter les pages individuelles de chaque ligne, que je n'ai pas ouvertes. |
| Période de validité des horaires | `introuvable` | https://www.izilo.bzh/se-deplacer/lignes-et-horaires 2026-10-14 | Non précisée sur les pages consultées. |
| Calcul d'itinéraire et temps réel | `introuvable` | https://www.izilo.bzh/ 2026-10-14 | Aucune page web de calcul d'itinéraire n'a été trouvée. L'accueil mentionne l'application IziLo pour l'itinéraire et les horaires de passage, mais je n'ai pas d'extrait exact. La page infos trafic (https://www.izilo.bzh/se-deplacer/infos-trafic) n'a pas été ouverte. |
| Le bandeau d'actualité de l'accueil annonce un titre spécial travaux à 10 € avec | `non vérifié` | https://www.izilo.bzh/ 2026-10-14 | extrait introuvable sur la page |
| jours et périodes de circulation des lignes urbaines | `introuvable` |  2026-10-14 | rien de vérifiable trouvé lors de la collecte ; l'absence d'information ne veut pas dire absence de service |
| vélo ou gare (seulement si directement utile au logement) | `non recherché` |  2026-10-14 | collecte automatique non lancée ; à rechercher sur les sources officielles (COMPLEMENT_DOCUMENTAIRE.md) |

## 3. Secteurs (IRIS)

Part de la voiture, du vélo, des transports en commun et de la marche : **actifs** occupés de 15 ans ou plus **qui habitent le secteur, quelle que soit leur commune de travail** (la commune étudiée ou une autre). Ce tableau et celui de la section 4 (actifs de toute la commune, selon leur commune de travail) ne se croisent pas : le dossier ne donne aucune part par secteur **et** commune de travail. On peut rapprocher les deux observations, pas attribuer la part d'un secteur aux seuls actifs qui travaillent dans la commune, ni l'inverse. Ménages sans voiture, stationnement réservé : **ménages** (résidences principales) du secteur. Panier 500 m : part des **adresses** du secteur (chaque adresse compte pareil) qui ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Les fréquences de bus par secteur sont en attente de validation : elles ne sont pas données. Identifiant d'une cellule : `iris.<code>.<colonne>`, colonne parmi `actifs`, `voiture`, `velo`, `tc`, `marche`, `menages_sans_voiture`, `stationnement_reserve`, `panier_500m`. Estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

| Code | Secteur | Statut | Usage | Actifs | Voiture | Vélo | TC | Marche | Ménages sans voiture | Stationnement réservé | Panier 500 m (adresses) |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 561210101 | Arsenal Maritime | utilisable | `oui` | 1094 | 54 % | 5 % | 11 % | 25 % | 30 % | 44 % | 68 % |
| 561210102 | Aristide Briand | utilisable | `oui` | 1238 | 55 % | 8 % | 8 % | 24 % | 23 % | 36 % | 96 % |
| 561210906 | Quai de Rohan | utilisable | `oui` | 582 | 56 % | 7 % | 14 % | 21 % | 45 % | 21 % | 100 % |
| 561210103 | L'Orientis | utilisable | `oui` | 1469 | 56 % | 9 % | 14 % | 18 % | 33 % | 42 % | 94 % |
| 561210401 | Paul Guieysse | utilisable | `oui` | 1455 | 61 % | 10 % | 12 % | 13 % | 29 % | 34 % | 76 % |
| 561210905 | Nouvelle Ville | utilisable | `oui` | 1332 | 62 % | 11 % | 9 % | 16 % | 27 % | 45 % | 100 % |
| 561210903 | Polygone | utilisable | `oui` | 749 | 64 % | 10 % | 12 % | 9 % | 49 % | 35 % | 60 % |
| 561210502 | Parc du Scorff | utilisable | `oui` | 527 | 64 % | 2 % | 26 % | 3 % | 45 % | 23 % | 87 % |
| 561210902 | Merville | utilisable | `oui` | 1290 | 65 % | 13 % | 8 % | 11 % | 18 % | 50 % | 94 % |
| 561210904 | Chant des Oiseaux | utilisable | `oui` | 1048 | 67 % | 15 % | 9 % | 5 % | 19 % | 52 % | 84 % |
| 561210301 | Dupuy de Lome | utilisable | `oui` | 860 | 68 % | 10 % | 7 % | 11 % | 22 % | 46 % | 86 % |
| 561210701 | Kervenanec Nord | utilisable | `oui` | 543 | 68 % | 6 % | 17 % | 6 % | 39 % | 25 % | 100 % |
| 561210703 | Kreisker | utilisable | `oui` | 724 | 70 % | 16 % | 3 % | 9 % | 16 % | 65 % | 82 % |
| 561210602 | Bourgneuf | utilisable | `oui` | 850 | 71 % | 5 % | 12 % | 10 % | 28 % | 41 % | 25 % |
| 561210403 | Étienne Dolet | utilisable | `oui` | 1105 | 72 % | 10 % | 10 % | 4 % | 20 % | 51 % | 94 % |
| 561210402 | Manio | utilisable | `oui` | 934 | 72 % | 4 % | 12 % | 9 % | 16 % | 60 % | 72 % |
| 561210302 | Hôpital Kerforn | utilisable | `oui` | 1494 | 72 % | 10 % | 6 % | 7 % | 17 % | 72 % | 34 % |
| 561210404 | Keryado | utilisable | `oui` | 886 | 73 % | 9 % | 10 % | 6 % | 18 % | 59 % | 77 % |
| 561210501 | Saint-Armel | utilisable | `oui` | 589 | 74 % | 3 % | 18 % | 2 % | 35 % | 21 % | 100 % |
| 561210702 | Kervenanec Sud | utilisable | `oui` | 486 | 74 % | 4 % | 12 % | 7 % | 31 % | 33 % | 97 % |
| 561210704 | Le Ter | utilisable | `oui` | 645 | 76 % | 10 % | 10 % | 2 % | 13 % | 78 % | 75 % |
| 561210601 | Kerletu | utilisable | `oui` | 692 | 77 % | 4 % | 10 % | 4 % | 15 % | 72 % | 66 % |
| 561210303 | Lanveur Kerfichant | utilisable | `oui` | 1819 | 78 % | 4 % | 9 % | 7 % | 23 % | 67 % | 54 % |
| 561210901 | Zone Portuaire | absent (secteur d'activité, exclu) | `non` | | | | | | | | |
| 561210603 | Z.A. Nord-Ouest | absent (secteur d'activité, exclu) | `non` | | | | | | | | |

## 4. Mode selon la commune de travail (actifs résidant à Lorient)

Actifs qui habitent l'ensemble de Lorient, tous secteurs confondus, selon leur commune de travail ; aucune répartition par secteur de résidence (voir section 3). Chaque ligne est un groupe distinct de personnes. Identifiant : `destination.<insee>.<colonne>`, colonne parmi `part_des_actifs`, `voiture`, `velo`, `tc`, `marche`. Statut d'après le nombre de lignes d'échantillon.

| Commune de travail (code) | Part des actifs résidents | Voiture | Vélo | TC | Marche | Lignes | Statut | Usage |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Lorient (56121) | 59 % | 56 % | 12 % | 10 % | 18 % | 4162 | utilisable | `oui` |
| Lanester (56098) | 6 % | 74 % | 8 % | 14 % | 3 % | 445 | utilisable | `oui` |
| Ploemeur (56162) | 5 % | 82 % | 6 % | 8 % | 2 % | 362 | utilisable | `oui` |
| Caudan (56036) | 4 % | 87 % | 4 % | 8 % | 0,1 % | 254 | utilisable | `oui` |
| Quéven (56185) | 2 % | 82 % | 8 % | 8 % | 1 % | 171 | utilisable | `oui` |
| Quimperlé (29233) | 2 % | 91 % | 1 % | 8 % | 1 % | 173 | utilisable | `oui` |
| Larmor-Plage (56107) | 2 % | 75 % | 8 % | 15 % | 2 % | 151 | utilisable | `oui` |
| Hennebont (56083) | 2 % | 89 % | 1 % | 9 % | 0 % | 135 | fragile | `ordre de grandeur` |
| Kervignac (56094) | 2 % | 87 % | 2 % | 9 % | 1 % | 137 | fragile | `ordre de grandeur` |
| Guidel (56078) | 2 % | 89 % | 0 % | 11 % | 0 % | 111 | fragile | `ordre de grandeur` |
| Vannes (56260) | 2 % | 66 % | 1 % | 33 % | 0 % | 108 | fragile | `ordre de grandeur` |
| Quimper (29232) | 1 % | 84 % | 0 % | 14 % | 2 % | 55 | fragile | `ordre de grandeur` |

## 4 bis. Repère de comparaison avec d'autres communes (calculé)

Règle de sélection, fixée avant de regarder les résultats et identique pour toutes les communes : communes de même rôle que Lorient (commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)), comptant de la moitié au double de ses actifs occupés résidents (de 11 359 à 45 435), avec au moins 150 lignes d'échantillon ; Lorient exclue ; France métropolitaine. Indicateur : part des actifs allant travailler principalement en voiture (TRANS = 5) ; population : actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI) ; INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO), 2022 (collectes 2020 à 2024). Le rôle est une approximation (commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre).

C'est la référence commune de la série pour comparer l'usage de la voiture. Comment l'écrire : dans le récit, la valeur locale et la médiane, avec un nom court (« les villes de taille proche ») et un renvoi à la méthode, où la règle est donnée en entier ; jamais « comparables sur tous les plans ». Le seuil de 150 lignes est un critère d'inclusion, pas une garantie de précision. La médiane est celle des parts communales, chaque commune comptant une fois : ce n'est pas la part de voiture de l'ensemble de leurs habitants. Pas de rang, pas de palmarès, pas de liste de villes dans l'article. Un écart de quelques points dit seulement que la commune est proche de la médiane ; s'il n'apporte rien à la question, le repère reste dehors.

| id | Fait | Valeur | Usage |
|---|---|---|---|
| `comparaison.voiture.commune` | Part des actifs résidant à Lorient qui vont travailler principalement en voiture (valeur comparée) | 67 % | `oui` |
| `comparaison.voiture.mediane_groupe` | Médiane des parts de la voiture des 82 communes du groupe (chaque commune compte une fois) | 69 % | `oui` |
| `comparaison.voiture.ecart` | Écart : Lorient moins la médiane du groupe (valeurs arrondies) | -2 points | `oui` |
| `comparaison.voiture.groupe_n` | Nombre de communes du groupe | 82 | `oui` |

Communes du groupe (82, pour la vérification ; ne pas les citer) : Agen, Ajaccio, Albi, Alès, Angoulême, Annemasse, Arles, Arras, Auxerre, Avignon, Bastia, Bayonne, Beauvais, Belfort, Blois, Boulogne-sur-Mer, Bourg-en-Bresse, Bourges, Bourgoin-Jallieu, Brive-la-Gaillarde, Béziers, Caen, Calais, Carcassonne, Castres, Chalon-sur-Saône, Chambéry, Charleville-Mézières, Chartres, Cherbourg-en-Cotentin, Cholet, Châlons-en-Champagne, Châteauroux, Colmar, Compiègne, Douai, Draguignan, Dunkerque, Fréjus, Gap, Haguenau, La Roche-sur-Yon, La Rochelle, Laval, Les Sables-d'Olonne, Meaux, Menton, Mont-de-Marsan, Montauban, Montluçon, Montélimar, Mulhouse, Mâcon, Nancy, Narbonne, Nevers, Niort, Pau, Perpignan, Poitiers, Périgueux, Quimper, Rambouillet, Roanne, Romans-sur-Isère, Saint-Brieuc, Saint-Malo, Saint-Nazaire, Saint-Quentin, Salon-de-Provence, Sète, Sèvremoine, Tarbes, Thionville, Thonon-les-Bains, Troyes, Valence, Valenciennes, Vannes, Vienne, Épinal, Évreux.

## 5. Les communes du groupe « voisines »

Résidents de chaque commune (tous lieux de travail) et, parmi eux, ceux qui viennent travailler à Lorient. Identifiant : `voisine.<insee>.<colonne>`, colonne parmi `voiture`, `velo`, `tc` (tous résidents) et `voiture_vers_commune` (venant travailler).

| Commune (code) | Voiture, tous résidents | Vélo | TC | Voiture, venant travailler à Lorient | Lignes (vers Lorient) | Statut (vers Lorient) | Usage (vers Lorient) |
|---|---:|---:|---:|---:|---:|---|---|
| Lanester (56098) | 74 % | 7 % | 9 % | 74 % | 932 | utilisable | `oui` |
| Ploemeur (56162) | 82 % | 6 % | 3 % | 85 % | 646 | utilisable | `oui` |
| Quéven (56185) | 83 % | 2 % | 6 % | 87 % | 244 | utilisable | `oui` |
| Larmor-Plage (56107) | 76 % | 8 % | 6 % | 84 % | 224 | utilisable | `oui` |
| Caudan (56036) | 86 % | 2 % | 4 % | 91 % | 140 | fragile | `ordre de grandeur` |

*Les parts « tous résidents » viennent de la base IRIS agrégée à la commune ; celles « venant travailler » du fichier détail.*

## 6. Accès depuis les adresses, par commune

Part des **adresses** BAN de chaque commune, distances à vol d'oiseau ; chaque secteur (IRIS) pèse selon son nombre de ménages (poids d'une adresse = ménages de son IRIS / adresses de son IRIS). Ce n'est ni une part de ménages mesurée, ni une simple part des adresses : l'écrire avec cette qualification (par exemple « des adresses, chaque secteur pesant selon son nombre de ménages »), ne pas la comparer telle quelle aux parts par secteur (section 3, non pondérées), ou l'écarter si elle alourdit l'article. Identifiant : `acces.<insee>.<colonne>` (nom de colonne du tableau). Usage : `oui`. Les colonnes bus sont en attente de validation et ne sont pas données.

| Commune (code) | commerce_alim_500m | pharmacie_500m | ecole_elementaire_500m | panier_quotidien_500m | gare_2km |
|---|---|---|---|---|---|
| Lorient (56121) | 97 % | 86 % | 86 % | 76 % | 72 % |
| Lanester (56098) | 78 % | 67 % | 68 % | 51 % | 44 % |
| Ploemeur (56162) | 41 % | 30 % | 43 % | 20 % | 0 % |
| Quéven (56185) | 39 % | 34 % | 34 % | 25 % | 10 % |
| Larmor-Plage (56107) | 64 % | 25 % | 24 % | 15 % | 0 % |
| Caudan (56036) | 49 % | 40 % | 33 % | 27 % | 1 % |

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
| Carte de situation : Lorient et Lanester (56098), Ploemeur (56162), Quéven (56185), Larmor-Plage (56107) et Caudan (56036) | réalisable, seulement à côté du graphique précédent | aucun (contours IGN) | le sous-titre parle de « la seconde barre » : à n'utiliser qu'avec ce graphique, même liste exacte |
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


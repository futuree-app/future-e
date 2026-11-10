# FUT-185 · Rejouer l'effet national avant/après

Rapport : [`../2026-11-10-fut185-libelles-densite.md`](../2026-11-10-fut185-libelles-densite.md).

| Fichier | Rôle |
|---|---|
| `01_rejouer.mts` | exécute le vrai code d'une révision (`deriveCategoriesFromEntry`, `getHeroCopy`, `getQuestionIntro`, `getEmptyStateCopy`, `getPreviewCards`, `deriveTerritoryType`, et depuis la reprise `categoriesAccueil`, `ligneManuelleConcorde`, `buildTensions`) sur chaque commune de l'index ; pour une révision antérieure, une copie signalée de l'ancien `buildTensions` |
| `02_comparer.py` | tableaux nationaux (France, urbaines Insee 1-4 sous 1 500 hab/km², rurales 5-7), flux de questions, montagne, panel |
| `lancer.sh` | extrait index ET code de deux révisions (`git archive`), rejoue, compare |
| `mobpro-villes.py` | part voiture des quatre villes de la machine à sous, depuis la base MOBPRO 2022 (non versionnée) |
| `catalogue-questions-2026-11-10.json`, `table-manuelle-2026-11-10.json` | relevés en lecture seule (clé publique) des tables Supabase lues par l'accueil |
| `sortie-attendue.txt` | sortie de référence, `1ab56bfb` contre `84fcac7c` |
| `sortie-delta-reprise.txt` | effet de la reprise de contre-revue seule, `00fe22ec` contre `84fcac7c` |

Rien n'est écrit dans le dépôt, l'index ou une base. La grille Insee (`both.parquet` de FUT-180) ne sert qu'au découpage des résultats.

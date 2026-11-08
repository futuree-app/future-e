# Comparer le climat 2050 au climat récent — audit et prototype (FUT-170)

*08/11/2026 · branche `bonjourfuturee/fut-170-accueil-comparer-le-climat-2050-a-un` · aucune fusion, aucun déploiement, aucune écriture Supabase.*

## Verdict : **GO avec réserves**

Une comparaison « 2050 contre climat récent » est **scientifiquement défendable** dans futur•e, à quatre conditions :

1. **Bons indicateurs.** Le climat récent vient de la réanalyse **SAFRAN** de Météo-France, sur **la grille même** des projections DRIAS-TRACC. Il couvre trois indicateurs : jours ≥ 35 °C, jours ≥ 30 °C et nuits tropicales.
2. **Deux repères juxtaposés, jamais un écart calculé.** On affiche les deux valeurs côte à côte, sans soustraction. Le résidu entre les deux systèmes est faible, mais pas nul : en dessous de 2 à 3 jours ou nuits, un écart n'est pas interprétable.
3. **Une période nommée** (2016–2025), jamais « aujourd'hui ».
4. **Deux limites écrites et consultables.**
   - Une valeur de maille de 8 km n'est pas un thermomètre : en Provence, la station compte deux à trois fois plus de jours ≥ 35 °C que sa maille.
   - En vallée de montagne, la maille décrit les hauteurs, pas la ville.

Le prototype est implémenté dans la PR (bloc « Éviter les fortes chaleurs » de l'accueil seulement). Il ne touche ni au moteur, ni aux seuils, ni au classement, ni aux dossiers.

**Deux arbitrages restent à faire** (§ E.4) :
- le changement de base des qualificatifs de la phrase ;
- la politique de mise à jour annuelle.

---

## A. Disponibilité des données

### Ce que futur•e avait déjà (et pourquoi cela ne suffit pas)

| Donnée | Où | Ce qu'elle donne | Utilisable ici ? |
|---|---|---|---|
| **DRIAS-TRACC** (17 couples de modèles EURO-CORDEX, médiane) | `data/data_climat.json`, extrait `src/data/apercu-climat-communes.json` | Projections à +2 / +2,7 / +4 °C France. La référence 1976–2005 est **reconstruite** (projeté − écart). | C'est la projection. |
| **ERA5-Land** (Copernicus) | `scripts/populate-era5-trend.py` → table Supabase `commune_era5_trend` ; page `/chaleur/[insee]`, dossier Territoire, `wizard-preview` | **Température moyenne annuelle** des 10 dernières années, contre 1961–1990 (moyennes mensuelles, maille ~9 km) | **Non.** Sans données quotidiennes, aucun compte de jours ou de nuits. Sa référence (1961–1990) et sa grille ne sont pas celles de DRIAS. |
| ERA5 rayonnement, SocleOM (outre-mer) | comparateur, accueil outre-mer | Hors sujet | — |

Au passage, deux défauts sur l'existant ERA5, **hors périmètre, non corrigés** :
- la page `/chaleur/[insee]` écrit « +X °C depuis la fin du XXᵉ siècle » pour une base **1961–1990** ;
- la fiche chaleur du dossier Territoire juxtapose une base 1961–1990 (ERA5) et une base 1976–2005 (DRIAS) sans le dire au premier niveau.

### Sources examinées

| Source | Accès, licence | Maille, pas de temps | Jours ≥ 35 / ≥ 30 °C, nuits ≥ 20 °C ? | Retenue ? |
|---|---|---|---|---|
| **SAFRAN (SIM2 quotidienne)**, Météo-France | [data.gouv.fr](https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne), **Licence Ouverte 2.0**, un CSV par année depuis 1958, ~140 Mo compressé | 8 km (9 892 mailles, dont 8 981 terrestres), quotidien. `TSUP_H` = maximum des 24 températures horaires (06–06 UTC) ; `TINF_H` = minimum (18–18 UTC) | **Oui**, exactement | **Oui** |
| Normales 1991–2020 (stations) | Fiches climatologiques Météo-France | Stations | Oui, mais par station seulement, sans couverture communale | Contrôle seulement |
| Données quotidiennes de stations, Météo-France | [data.gouv.fr](https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes), Licence Ouverte 2.0, par département | Ponctuel | Oui | **Contrôle** (maille contre thermomètre) |
| ERA5-Land quotidien (Copernicus) | Compte CDS | ~9 km | Possible | Non : ce n'est pas la grille de correction de DRIAS, et il est déjà écarté pour les extrêmes |

**SAFRAN est une réanalyse, pas une mesure.** Les observations des stations y sont interpolées par massif et par tranche d'altitude de 300 m, puis sur une grille de 8 km ([présentation Météo-France](https://static.data.gouv.fr/resources/donnees-changement-climatique-sim-quotidienne/20260602-150234/climatologie-presentation-modele-sim-20260602.pdf)). Chaque valeur est celle d'un carré de 8 km, pas d'une adresse.

### Pourquoi SAFRAN, et pas une autre source

DRIAS-2020, dont DRIAS-TRACC est tiré, est **corrigé de ses biais par la méthode ADAMONT à partir de l'analyse SAFRAN**, et livré **sur la grille SAFRAN** de 8 km (134 × 143 points), selon la [fiche technique DRIAS-2020](https://drias-prod.meteo.fr/serveur/simulations_climatiques/Documentations_Donnees/Fiches_techniques_Atmospherique/5-DRIAS-2020/Doc_database_DRIAS-2020_CNRM-CM5_RACMO22E.pdf). Vérifié ici : les 8 981 points DRIAS de `data/source` retrouvent chacun leur maille SAFRAN à moins de 0,001° (aucun doublon). **C'est la seule source récente qui partage la maille et le référentiel des projections.**

### Quelle période ? Recommandation : **2016–2025**

Écart de température moyenne annuelle à 1976–2005, en moyenne sur les 8 981 points :

| Période | Écart | Ce que c'est |
|---|---|---|
| 1991–2020 | +0,47 °C | Normale officielle (30 ans), centrée sur 2005 |
| 2006–2025 | +0,87 °C | 20 ans, la même longueur que les fenêtres DRIAS |
| 2015–2024 | +1,22 °C | 10 ans |
| **2016–2025** | **+1,27 °C** | **Les 10 dernières années complètes** |
| *DRIAS « 2030 » (+2 °C France)* | *+1,35 °C* | *projection* |
| *DRIAS « 2050 » (+2,7 °C France)* | *+2,08 °C* | *projection* |

| Critère | 1991–2020 | 2006–2025 | **2016–2025** |
|---|---|---|---|
| Pertinence pour le lecteur | Faible : les étés 2018, 2019, 2022 et 2025 y pèsent peu | Moyenne : inclut 2006–2010 | **Forte : les étés qu'il a vécus** |
| Robustesse (erreur type d'une moyenne, médiane nationale) | — | Nuits tropicales ±0,8 ; jours ≥ 35 °C ±0,65 | Nuits tropicales ±1,1 ; jours ≥ 35 °C ±0,9 |
| Retard dû à la tendance | Très fort | Fort : 6,8 nuits tropicales en moyenne nationale, contre 8,7 sur 2016–2025 | **Minimal** |
| Normale climatologique | Oui | Non | Non (à dire) |
| Homogénéité SAFRAN | Réseau densifié dans les années 1990 | Bonne | Bonne. Les 4 dernières années sont révisables (mise à jour bimensuelle) |
| Licence, reproduction, coût | identiques | identiques | identiques (~1,4 Go lus en flux, ~7 min) |

**Raisonnement.**
- **La tendance pèse plus que le bruit.** Sur les nuits tropicales, l'écart entre la fenêtre de 20 ans et celle de 10 ans (≈ 1,9 nuit en moyenne nationale) dépasse l'erreur type d'une moyenne sur 10 ans (≈ 1,1). Une fenêtre de 20 ans décrit donc le climat d'il y a dix ans plus fidèlement que celui d'aujourd'hui.
- **1991–2020 est une normale, mais elle répond à une autre question** : elle situe le climat de la fin du XXᵉ siècle, et non le climat que le lecteur connaît.
- **Le prix de 2016–2025 : sa sensibilité à une décennie.** Elle contient 2022, année exceptionnelle (Bordeaux : 17 jours ≥ 35 °C cette année-là, 4,8 en moyenne). C'est pour cela que la période est **nommée**, et que la méthode rappelle qu'une année isolée peut s'éloigner nettement de la moyenne.
- **2017–2026 n'est pas encore disponible** : 2026 est incomplète. Aucune période plus récente et complète n'existe.

---

## B. Comparabilité avec DRIAS-TRACC

### Même grandeur, mêmes seuils, même maille

| | DRIAS-TRACC | SAFRAN (ce calcul) |
|---|---|---|
| Jours ≥ 35 °C | `NORTX35D_yr` « Nombre de jours avec Tx ≥ 35 °C » | `TSUP_H ≥ 35` |
| Jours ≥ 30 °C | `NORTX30D_yr` | `TSUP_H ≥ 30` |
| Nuits tropicales | `NORTR_yr` | `TINF_H ≥ 20` (la forme stricte `> 20` s'écarte davantage de DRIAS, voir ci-dessous) |
| Maille | grille SAFRAN 8 km | grille SAFRAN 8 km, **appariée point par point** |
| Jointure commune → point | `joindreAuPointLePlusProche` | **la même fonction** (`build-drias-median.js`) |
| Période | 20 ans autour de l'année où le niveau de réchauffement est atteint | 10 années civiles nommées |

### Le test décisif : SAFRAN 1976–2005 retrouve-t-il la référence DRIAS ?

Si DRIAS et SAFRAN parlent du même monde, la référence 1976–2005 des projections, corrigée vers SAFRAN, doit coïncider avec SAFRAN observé sur 1976–2005, point par point. Mesuré sur les 8 981 points, contre la médiane des 17 références (identique à ±0,1 près à la reconstruction de futur•e, médiane(NOR) − médiane(A)) :

| Indicateur | Moyenne DRIAS | Moyenne SAFRAN | Biais moyen | Écart absolu moyen | p95 | Corrélation |
|---|---|---|---|---|---|---|
| Jours ≥ 35 °C | 0,67 | 0,56 | **+0,11** | 0,14 | 0,43 | 0,980 |
| Jours ≥ 30 °C | 8,37 | 7,66 | **+0,71** | 0,72 | 2,30 | 0,996 |
| Nuits ≥ 20 °C | 4,07 | 3,59 | **+0,47** | 0,58 | 2,17 | 0,995 |
| Nuits > 20 °C (stricte) | 4,07 | 3,36 | +0,71 | 0,76 | 2,97 | 0,994 |
| Température moyenne annuelle | 10,80 | 10,61 | +0,18 °C | 0,18 | 0,31 | 0,999 |
| Température moyenne d'hiver | 3,73 | 3,91 | −0,17 °C | 0,18 | 0,35 | 0,999 |
| Maximale moyenne d'été | 22,65 | 22,35 | +0,29 °C | 0,30 | 0,52 | 0,999 |
| Jours de sol sec (SWI < 0,4) | 91,3 | 76,5 | **+14,8** | 14,9 | 28,8 | 0,981 |

**Lecture.**
- **Températures et comptes de chaleur : comparables.** DRIAS reproduit la géographie de SAFRAN presque parfaitement. Il est très légèrement plus chaud, sans doute parce que la version de SAFRAN de calibration (« SAFRAN 2016 ») et la période de calibration d'ADAMONT diffèrent de la version diffusée aujourd'hui ; nous n'avons pas trouvé la documentation qui le confirmerait.
- **Le résidu fixe un plancher d'interprétation.** En dessous d'environ 2 jours ou nuits (p95 de l'écart à la référence), une différence entre « récent » et « 2050 » n'a pas de sens.
- **Jours de sol sec : non comparables.** Le biais est de 15 jours ; les versions d'ISBA diffèrent probablement. À exclure.
- **Indice forêt-météo : non calculable** à partir de SIM2 seul. Non évalué.

### Où se situe le climat récent sur la trajectoire DRIAS ?

Moyennes nationales sur les 8 981 points :

| | 1976–2005 (DRIAS) | **SAFRAN 2016–2025** | DRIAS « 2030 » | DRIAS « 2050 » | Points où récent > 2050 |
|---|---|---|---|---|---|
| Jours ≥ 35 °C | 0,68 | **1,52** | 2,34 | 4,03 | 0,3 % |
| Jours ≥ 30 °C | 8,34 | **14,18** | 15,74 | 21,34 | 1,0 % |
| Nuits tropicales | 4,09 | **8,69** | 10,43 | 15,69 | 0,7 % |

Le climat récent se place **entre la référence et 2050 presque partout**. Il a parcouru environ 20 % (jours ≥ 35 °C), 41 % (≥ 30 °C) et 33 % (nuits) du chemin, en médiane. La juxtaposition « 2050 contre climat récent » ne raconte donc pas de baisse trompeuse. Un test (`climat-recent.test.ts`) bloque la lecture si ce constat change à une mise à jour.

**Une question reste ouverte, sans changer la conclusion.** En température moyenne, 2016–2025 a déjà atteint le niveau DRIAS « 2030 » (+1,27 contre +1,35 °C). Les comptes d'extrêmes restent pourtant en deçà : 8,7 nuits contre 10,4. Or la littérature montre au contraire que les extrêmes de chaleur d'Europe de l'Ouest progressent plus vite que dans les modèles ([Vautard et al., 2023](https://www.nature.com/articles/s41467-023-42143-3)). Deux explications possibles :
- l'interpolation SAFRAN lisse les pointes (voir C) ;
- la relation entre un compte au-dessus d'un seuil et la moyenne n'est pas linéaire.

Sur les communes pilotes, les **évolutions relatives** observées par les stations et par SAFRAN concordent. Exemple à Nîmes, jours ≥ 35 °C de 1976–2005 à 2016–2025 : ×3,8 pour la station, ×3,8 pour la maille. Nous n'avons donc pas d'indice d'une tendance amortie. Le point mérite une revue par un climatologue avant toute communication chiffrée sur le « chemin parcouru ».

### Les précautions retenues

1. **Pas de soustraction affichée.** Deux repères juxtaposés, chacun avec sa période et sa source. La phrase sous la pastille ne qualifie une hausse qu'à partir d'une nuit de plus par an. Comme avant, elle ne cite aucun chiffre.
2. **Jamais « aujourd'hui », jamais « actuel »** : « climat récent (2016–2025) ». Un test le vérifie.
3. **Deux natures, deux sources nommées** : « DRIAS · Météo-France, horizon 2050 » et « réanalyse SAFRAN · Météo-France ».
4. **La limite de maille** est écrite dans « Comment lire ce résultat ? ».
5. **La référence 1976–2005 reste consultable**, au même endroit.

---

## C. Résultats du prototype

Valeurs au **point DRIAS de la commune** (même jointure que futur•e ; Paris par son 1er arrondissement, comme DRIAS). Les colonnes DRIAS sont celles que futur•e affiche déjà, relues dans `src/data/apercu-climat-communes.json`.

**Contrôle de cohérence.** Rochefort à 2,8 jours (affiché « 3 ») et 23,6 nuits (« 24 ») en 2050, contre 0,3 (« moins d'une journée ») et 5,3 (« 5 ») sur 1976–2005 : ce sont exactement les chiffres cités dans la mission.

| Commune | Indicateur | DRIAS 1976–2005 (reconstruite) | SAFRAN 1976–2005 | SAFRAN 1991–2020 | SAFRAN 2006–2025 | **SAFRAN 2016–2025** | DRIAS « 2030 » | **DRIAS « 2050 »** | σ annuel |
|---|---|---|---|---|---|---|---|---|---|
| Rochefort (17299) | Jours ≥ 35 °C | 0,3 | 0,2 | 0,3 | 0,9 | **1,5** | 1,5 | **2,8** | 0,7 |
| | Jours ≥ 30 °C | 7,1 | 6,4 | 6,5 | 7,3 | **10,8** | 13,9 | **18,5** | 3,7 |
| | Nuits tropicales | 5,3 | 4,9 | 7,2 | 9,9 | **13,1** | 13,8 | **23,6** | 6,1 |
| La Rochelle (17300) | Jours ≥ 35 °C | 0,3 | 0,2 | 0,3 | 0,9 | **1,5** | 1,2 | **2,8** | 0,7 |
| | Jours ≥ 30 °C | 6,7 | 6,3 | 6,5 | 7,0 | **10,2** | 13,6 | **18,0** | 3,7 |
| | Nuits tropicales | 5,3 | 4,7 | 6,7 | 9,0 | **12,1** | 13,6 | **23,4** | 5,9 |
| Nantes (44109) | Jours ≥ 35 °C | 0,5 | 0,7 | 0,6 | 0,8 | **1,2** | 2,0 | **4,1** | 1,1 |
| | Jours ≥ 30 °C | 8,1 | 7,7 | 7,6 | 8,2 | **11,2** | 15,6 | **21,8** | 5,1 |
| | Nuits tropicales | 2,0 | 1,8 | 1,8 | 2,2 | **3,4** | 6,2 | **11,1** | 2,1 |
| Bordeaux (33063) | Jours ≥ 35 °C | 1,5 | 1,2 | 1,6 | 3,2 | **4,8** | 4,6 | **6,3** | 2,4 |
| | Jours ≥ 30 °C | 16,5 | 15,1 | 18,1 | 20,2 | **25,3** | 27,6 | **35,1** | 7,2 |
| | Nuits tropicales | 7,3 | 5,5 | 11,7 | 17,2 | **23,0** | 18,5 | **28,1** | 7,9 |
| Nîmes (30189) | Jours ≥ 35 °C | 2,7 | 2,1 | 3,4 | 5,5 | **8,0** | 8,7 | **14,4** | 4,7 |
| | Jours ≥ 30 °C | 36,2 | 33,5 | 41,0 | 45,4 | **53,9** | 56,3 | **67,9** | 13,1 |
| | Nuits tropicales | 33,0 | 28,4 | 38,6 | 45,0 | **54,2** | 56,5 | **69,1** | 11,9 |
| Marciac (32233, rurale, Gers) | Jours ≥ 35 °C | 1,5 | 1,5 | 1,5 | 2,0 | **3,1** | 5,2 | **8,2** | 2,5 |
| | Jours ≥ 30 °C | 14,5 | 14,8 | 15,5 | 18,0 | **23,1** | 26,9 | **34,2** | 8,6 |
| | Nuits tropicales | 5,0 | 2,9 | 4,7 | 7,9 | **11,8** | 12,6 | **21,0** | 4,8 |
| Briançon (05023, montagne) | les trois | 0,0 | 0,0 | 0,0 | 0,0 | **0,0** | ≤ 0,1 | **≤ 0,6** | 0 |
| Chamonix (74056, montagne) | les trois | 0,0 | 0,0 | 0,0 | 0,0 | **0,0** | 0,0 | **0,0** | 0 |
| Paris (75101, contrôle) | Jours ≥ 35 °C | 0,9 | 0,8 | 1,2 | 1,4 | **2,2** | 2,4 | **4,4** | 2,0 |
| | Jours ≥ 30 °C | 10,1 | 9,1 | 10,7 | 10,4 | **12,6** | 15,9 | **22,8** | 6,1 |
| | Nuits tropicales | 8,7 | 8,3 | 10,8 | 11,0 | **14,2** | 17,6 | **26,3** | 7,2 |

*Sources : DRIAS-TRACC (Météo-France, 17 modèles, médiane) ; SAFRAN SIM2 quotidienne (Météo-France), maille DRIAS de la commune. La colonne σ donne l'écart-type interannuel 1991–2020 au point. La dispersion des 17 modèles sur la référence reste faible : q10–q90 de 5,0–5,8 nuits à Rochefort, 31,1–33,1 à Nîmes.*

**Séries annuelles 2016–2025 au point** (nuits tropicales) :
- Bordeaux : 13, 20, 30, 21, 19, 12, **37**, 32, 16, 30.
- Nîmes : 45, 53, 52, 57, 51, 47, **79**, 54, 52, 52.
- Rochefort : 7, 13, 15, 12, 9, 10, **24**, 16, 8, 17.

Une seule année peut doubler la moyenne : la période doit rester nommée.

### Écarts et incohérences relevés

**1. Bordeaux : le climat récent dépasse déjà la projection « 2030 ».** C'est le cas pour les nuits (23,0 contre 18,5) et les jours ≥ 35 °C (4,8 contre 4,6). Ce n'est pas une incohérence : 2016–2025 se situe au niveau de réchauffement « 2030 », et Bordeaux est au-dessus de la médiane des modèles. C'est un résultat, pas un bug, mais il interdit de présenter « 2030 » comme « dans quelques années ».

**2. Maille contre thermomètre : l'écart est grand, et dans les deux sens.** Moyennes 2016–2025 sur les étés complets, stations Météo-France à moins de 20 km :

| Commune | Station (altitude, distance) | Jours ≥ 35 °C station / maille | Jours ≥ 30 °C station / maille | Nuits ≥ 20 °C station / maille |
|---|---|---|---|---|
| Rochefort | Saint-Agnant (18 m, 6 km) | 4,2 / 1,5 | 22,8 / 10,8 | 4,5 / 13,1 |
| La Rochelle | La Rochelle–Île de Ré (20 m, 2 km) | 2,6 / 1,5 | 16,6 / 10,2 | 6,8 / 12,1 |
| Nantes | Nantes-Bouguenais (26 m, 10 km) | 3,2 / 1,2 | 18,8 / 11,2 | 2,9 / 3,4 |
| Bordeaux | Bordeaux-Paulin, en ville (10 m, 1 km) | 11,4 / 4,8 | 44,1 / 25,3 | 17,3 / 23,0 |
| Bordeaux | Mérignac (47 m, 9 km) | 8,1 / 4,8 | 35,1 / 25,3 | 10,0 / 23,0 |
| Nîmes | Courbessac (59 m, 6 km) | **22,2 / 8,0** | 77,7 / 53,9 | 38,0 / 54,2 |
| Marciac | Mirande (184 m, 20 km) | 11,4 / 3,1 | 45,8 / 23,1 | 5,2 / 11,8 |
| Briançon | Villar-Saint-Pancrace (1 310 m, 2 km) | 0,5 / 0,0 | **22,8 / 0,0** | 0,0 / 0,0 |
| Chamonix | Chamonix (1 042 m, 4 km) | 0,7 / 0,0 | **16,3 / 0,0** | 0,0 / 0,0 |
| Paris | Montsouris (75 m, 4 km) | 3,5 / 2,2 | 19,8 / 12,6 | 9,7 / 14,2 |

- **Journées chaudes : la maille en compte deux à trois fois moins que la station.** SAFRAN lisse les pointes de l'après-midi : maximum horaire contre maximum instantané, et moyenne sur 8 km.
- **Nuits tropicales : le littoral et le Midi en comptent plus sur la maille.** Exception : le centre de Bordeaux, où l'îlot de chaleur urbain inverse l'écart.
- **Évolutions relatives concordantes.** Exemple sur Nîmes, de 1976–2005 à 2016–2025 : ×3,8 pour la station comme pour la maille en jours ≥ 35 °C ; ×2,1 pour la station et ×1,9 pour la maille en nuits.
- **Ce constat vaut déjà pour les chiffres DRIAS affichés aujourd'hui.** Les projections sont calibrées sur la même maille. Il justifie la limite écrite (« moyennes de secteur, pas les relevés d'un thermomètre »).

**3. Les vallées de montagne : la maille ne décrit pas la ville.** Briançon et Chamonix lisent 0 partout. Pourtant, les stations de vallée comptent 16 à 23 jours ≥ 30 °C par an sur 2016–2025. La bascule « Et au-dessus de 30 °C ? » affiche donc « 0 jour par an » à Briançon pour 2050 (0,6), alors que la vallée en vit déjà plus de vingt. Ce défaut est **préexistant**, côté DRIAS. Le prototype ne l'aggrave pas, mais ne le corrige pas non plus. **Suite proposée :** un ticket « altitude de maille contre altitude habitée » pour les communes de relief, avec la piste d'un repli ou d'une mention lorsque l'altitude de la mairie s'écarte de celle de la maille. Les fichiers ouverts ne donnent pas l'altitude des mailles : il faudrait la croiser avec un modèle numérique de terrain.

**4. Comparaison aux publications officielles.** Les stations de contrôle ci-dessus sont celles des fiches climatologiques Météo-France. Sur 1991–2020, Nîmes-Courbessac compte 10,4 jours ≥ 35 °C et 23,7 nuits ≥ 20 °C par an (nos agrégats des données quotidiennes publiques). Ces valeurs sont à comparer aux normales publiées : nous ne les avons pas relues dans le PDF officiel. Les comptes sont faits sur les seuls étés complets (mai à septembre, ≥ 150 jours valides), en ajoutant les rares occurrences hors de cette saison.

---

## D. Proposition produit (implémentée dans la PR)

Le grand chiffre reste **2050**. La comparaison du premier niveau devient le **climat récent**, avec ses années. La référence 1976–2005 passe dans « Comment lire ce résultat ? ».

**Rochefort, avant :**

> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre moins d'une journée sur 1976-2005
> **24** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 5 nuits sur 1976-2005

**Rochefort, après :**

> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)
> **24** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 13 nuits dans le climat récent (2016–2025)
>
> *à l'échelle de la commune · DRIAS · Météo-France, horizon 2050 (+2,7 °C en France) · climat récent 2016–2025 : réanalyse SAFRAN · Météo-France*

**Dans « Comment lire ce résultat ? » :**

> Deux mesures du climat de la commune : les journées où il fait plus de 35 °C, et les nuits tropicales, où la température ne descend pas sous 20 °C. Le grand chiffre est une projection pour 2050, quand la France se serait réchauffée d'environ 2,7 °C. Il est comparé au climat récent : la moyenne des années 2016 à 2025.
>
> Les deux viennent de Météo-France et sont calculés sur la même grille de 8 km : le climat récent est reconstitué à partir des observations (réanalyse SAFRAN), et les projections sont ajustées sur ces mêmes données. Ce sont des moyennes de secteur, pas les relevés d'un thermomètre : selon la ville ou le relief, les valeurs locales peuvent s'en écarter. Une année isolée peut aussi s'éloigner nettement de la moyenne.
>
> Référence historique des projections (DRIAS) : sur 1976-2005, moins d'une journée au-dessus de 35 °C et 5 nuits tropicales par an.

La bascule « Et au-dessus de 30 °C ? » suit la même règle : « 18 jours, dont 3 au-dessus de 35 °C ; contre 11 jours dans le climat récent (2016–2025) ».

Les autres communes pilotes (sorties réelles du code) sont en annexe.

---

## E. Implémentation

### E.1 Fichiers

| Fichier | Rôle |
|---|---|
| `scripts/climat-recent/agreger_safran.py` *(nouveau)* | Lit en flux les fichiers SIM2 de la période. Apparie chaque point DRIAS à sa maille SAFRAN et **échoue** au-delà de 0,002°. Vérifie années complètes et absence de valeurs manquantes. Écrit les comptes **annuels** par point, avec l'URL, la date `Last-Modified` et le SHA-256 de chaque fichier source. |
| `data/climat-recent/safran-2016-2025.json` *(nouveau, 0,95 Mo, versionné)* | Sortie du script ; non empaquetée. |
| `scripts/build-climat-recent.mjs` *(nouveau)* | Moyenne de la période par commune. Jointure par **les fonctions mêmes de DRIAS** (`loadCommunes`, `parseDriasFile`, `buildNearestPointIndex`). Mode `--ecrire`, sinon **vérification** octet pour octet. |
| `src/data/climat-recent-communes.json` *(nouveau, 0,77 Mo, empaqueté)* | 34 788 communes × [jours ≥ 35, ≥ 30, nuits ≥ 20], empreinte de la source. |
| `src/lib/accueil/climat-recent.ts` *(nouveau, pur)* | Lecture et contrôle du fichier ; outre-mer et absence → `null`, jamais 0. |
| `src/lib/accueil/donnees-legeres.ts` | `climatRecentLeger(insee)`, même repli Paris, Lyon, Marseille que DRIAS. |
| `src/lib/accueil/lecture-accueil.ts` | `SourcesLecture.climatRecent` ; `entreesChaleur` le transmet **après** le calcul du verdict, qui ne le lit pas. |
| `src/lib/accueil/pastilles.ts` | `EntreesChaleur.recent`, comparaison affichée, sources, méthode, base des qualificatifs (`baseComparaison`). |
| `package.json` | `prebuild` vérifie que le fichier dérivé correspond à sa source. |
| `src/lib/accueil/climat-recent.test.ts` *(nouveau, 13 tests)* | Voir E.2. |

**Non modifiés** : `climat-facts.ts` (seuils, `buildClimatFacts`, `classifyClimateComfort`), le moteur, le comparateur, les dossiers Territoire et Logement, `recits.ts` (cartes de l'aperçu Territoire), `faits.ts` (contexte /qna), l'outre-mer, les projections DRIAS et leur extrait.

### E.2 Tests

- **Le fichier** : produit depuis la source versionnée (empreinte) ; mêmes 34 788 communes que l'extrait DRIAS ; valeurs finies et positives, avec ≥ 35 °C ⊂ ≥ 30 °C ; valeurs des pilotes.
- **Point d'arrêt scientifique** : le climat récent ne dépasse 2050 que sur moins de 2 % des communes. Si une mise à jour inverse ce constat, la juxtaposition est réexaminée avant d'être servie.
- **Non-régression** : sur les **34 788 communes**, le verdict du moteur et le signal de la pastille sont identiques avec et sans climat récent.
- **Ce que le texte raconte** : comparaison, période et sources exactes (Rochefort) ; 1976–2005 absente du premier niveau mais présente dans la méthode ; jamais « aujourd'hui » ni « actuel » ; les qualificatifs mesurés contre la période affichée ; repli à l'identique sans climat récent ; accord « moins d'une nuit tropicale ».
- **Contrôle croisé hors dépôt** : le script du dépôt et la chaîne exploratoire indépendante (1976–2025) produisent des séries identiques sur les 8 981 points × 3 indicateurs × 10 ans.

### E.3 Coûts

| | |
|---|---|
| Traitement | ~7 min par mise à jour (10 fichiers de ~140 Mo lus en flux, rien stocké), puis 2 s de jointure |
| Stockage dépôt | +0,95 Mo (`data/`) et +0,77 Mo (`src/data/`) |
| Accueil | +0,77 Mo dans le paquet de la fonction (à côté des 4,6 et 2,7 Mo existants) ; **aucune requête externe**, aucune lecture Supabase |
| Actualisation | Une fois par an, quand l'année N est complète et stabilisée : script Python, `--ecrire`, revue du diff, PR |

### E.4 Arbitrages demandés

1. **La phrase sous la pastille change pour 10 962 communes sur 34 788, le signal pour aucune.** Ses qualificatifs (« augmenteraient », « plus fréquentes », « beaucoup plus fréquentes », c'est-à-dire au moins doublées) se mesuraient contre 1976–2005. Ils se mesurent désormais contre la période **affichée**. Afficher « contre 13 nuits (2016–2025) » à côté de « deviendraient beaucoup plus fréquentes », calculé contre 5 nuits, serait le piège décrit dans AGENTS.md : un texte qui raconte une comparaison qu'il n'affiche pas. Effet mesuré :

   | Avant → après | Communes |
   |---|---|
   | « … mais les nuits tropicales deviendraient beaucoup plus fréquentes » → « … seraient plus fréquentes » | 9 858 |
   | « … beaucoup plus fréquentes » → « Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses » | 1 103 |
   | « Les fortes chaleurs augmenteraient de jour comme de nuit » → « … seraient fréquentes de jour comme de nuit » | 1 |

   C'est plus juste, mais moins alarmant. Si tu préfères garder l'ampleur depuis 1976–2005, il faut alors **dire** cette base dans la phrase (« … beaucoup plus fréquentes qu'en 1976-2005 »), ce qui ramène la période ancienne au premier niveau. La convention « au moins doublé » restait d'ailleurs marquée « à valider » depuis le 15/10.

2. **Mise à jour annuelle glissante ou période figée.** En glissant d'un an (2015–2024 → 2016–2025), 90 % des points de grille bougent d'une nuit tropicale au plus, le maximum de 5 nuits. Je recommande un glissement annuel, période toujours affichée, après stabilisation des fichiers (les quatre dernières années sont révisables).

### E.5 Conséquences pour les autres modules (non traitées)

- **Aperçu Territoire et cartes de l'accueil** (`recits.ts`, onglet « 1976–2005 » de `HorizonSwitch`) : la même donnée pourrait remplacer l'onglet « 1976–2005 » par « Climat récent (2016–2025) ». C'est un chantier distinct (FUT-103).
- **/qna** (`faits.ts`) : le contexte envoyé au modèle ne contient pas le climat récent. La note « aucune n'est une valeur actuelle » reste vraie.
- **Dossier Territoire** : il pourrait remplacer ERA5 (température annuelle seule, base 1961–1990) par SAFRAN, sur la même base et la même maille que les projections. Ce serait aussi l'occasion de corriger la juxtaposition 1961–1990 / 1976–2005.
- **Autres indicateurs** : température moyenne annuelle, d'hiver et d'été extensibles (biais ≤ 0,4 °C). Jours de sol sec exclus (biais de 15 jours). Indice forêt-météo et pluies non évalués.

---

## F. Piste éditoriale : un article « ce que les relevés disent déjà des projections », ville par ville

Le matériau est là, et le sujet est fort. Garde-fous à poser **avant** d'écrire :

- **Comparer en jours ou en nuits, pas en pourcentage, sur les petits comptes.** Passer de 0,3 à 1,5 jour à 35 °C fait « +400 % » et ne veut rien dire. Le pourcentage n'est lisible qu'au-delà de ~10 occurrences par an. Alternative lisible : « le chemin déjà parcouru entre 1976–2005 et 2050 ». Rochefort a par exemple parcouru 43 % du chemin en nuits tropicales.
- **Toujours sur la même maille.** Pour « relevé contre projection », la seule comparaison honnête est SAFRAN contre DRIAS. Une station contre DRIAS mêle deux écarts (maille et changement). Elle donnerait par exemple « Nîmes vit déjà plus de jours à 35 °C que DRIAS n'en projette pour 2050 », ce qui est faux sur la même maille.
- **L'écart station / maille est lui-même un sujet** (C.2). Les chiffres d'une projection décrivent un secteur de 8 km. Sous abri en ville, on en mesure souvent deux à trois fois plus pour les journées chaudes.
- **Un encadré « une année n'est pas un climat »**, avec 2022.
- **La question ouverte de B** (les extrêmes progressent-ils plus vite que les modèles ?) relève d'une relecture par un climatologue avant publication.

---

## Annexe — les lectures réelles des communes pilotes (sorties du code de la PR)

**La Rochelle** — À surveiller
> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)
> **23** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 12 nuits dans le climat récent (2016–2025)
> *Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales seraient plus fréquentes.* (avant : « … deviendraient beaucoup plus fréquentes », voir E.4)

**Nantes** — À surveiller
> **4** jours par an, contre 1 jour dans le climat récent (2016–2025) · **11** nuits tropicales, contre 3 nuits
> *Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales deviendraient beaucoup plus fréquentes.* (inchangée)

**Bordeaux** — Plutôt défavorable
> **6** jours par an, contre 5 jours dans le climat récent (2016–2025) · **28** nuits tropicales, contre 23 nuits
> *Les nuits tropicales deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*
>
> 6 contre 5 jours : un écart sous le plancher d'interprétation (B). C'est pourquoi la phrase ne qualifie aucune hausse des jours à 35 °C et que l'interface ne soustrait rien.

**Nîmes** — Plutôt défavorable
> **14** jours par an, contre 8 jours dans le climat récent (2016–2025) · **69** nuits tropicales, contre 54 nuits
> *Les fortes chaleurs augmenteraient de jour comme de nuit. Sur ces deux aspects, Nîmes correspond mal à votre priorité.*

**Marciac** (rurale) — Plutôt défavorable
> **8** jours par an, contre 3 jours dans le climat récent (2016–2025) · **21** nuits tropicales, contre 12 nuits
> *Les journées au-dessus de 35 °C deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*

**Briançon** (montagne) — Plutôt favorable
> **moins de 1** jour par an, contre aucune journée dans le climat récent (2016–2025) · **moins de 1** nuit tropicale, contre aucune nuit
> *Les fortes chaleurs resteraient exceptionnelles ici, même en 2050.* La limite de C.3 s'applique : c'est la maille, pas la vallée.

**Paris** — Plutôt défavorable
> **4** jours par an, contre 2 jours dans le climat récent (2016–2025) · **26** nuits tropicales, contre 14 nuits
> *Les nuits tropicales deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*

Les signaux sont identiques à ceux d'avant FUT-170 pour les 34 788 communes (test de non-régression).

## Annexe — reproduire

```sh
# Climat récent du produit (dépôt)
python3 scripts/climat-recent/agreger_safran.py 2016 2025      # ~7 min, flux
node scripts/build-climat-recent.mjs --ecrire                  # jointure DRIAS
node scripts/build-climat-recent.mjs                           # vérification (prebuild)
node --test src/lib/accueil/climat-recent.test.ts
```

L'analyse exploratoire (1976–2025, comparabilité nationale, stations) vit hors du dépôt, sous `~/Documents/futuree-climat-recent/` :
- `scripts/agreger_sim2.py` : comptes mensuels, 50 années ;
- `scripts/drias_par_point.py` : références modèle par modèle ;
- `scripts/analyse.py` et `scripts/analyse_suite.py` ;
- `scripts/stations.py` et `scripts/stations_moyennes.py` ;
- les résultats dans `sorties/analyse/`.

Sources :
- [SIM quotidienne, Météo-France](https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne) ;
- [données quotidiennes des stations](https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes) ;
- [fiche DRIAS-2020 (ADAMONT, grille SAFRAN)](https://drias-prod.meteo.fr/serveur/simulations_climatiques/Documentations_Donnees/Fiches_techniques_Atmospherique/5-DRIAS-2020/Doc_database_DRIAS-2020_CNRM-CM5_RACMO22E.pdf) ;
- [Vidal et al. 2010, réanalyse SAFRAN](https://www.drias-climat.fr/document/vidal2010.pdf) ;
- [Vautard et al. 2023](https://www.nature.com/articles/s41467-023-42143-3) ;
- [DREAL Centre-Val de Loire, correspondance des niveaux de réchauffement](https://www.centre-val-de-loire.developpement-durable.gouv.fr/IMG/pdf/une_trajectoire_d_adaptation_pour_faire_face_au_changement_climatique.pdf).

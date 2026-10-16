# FUT-104 · Une couverture climatique ultramarine réelle

> **Mis à jour par `2026-10-16-fut104-consolidation.md`** : 187 entités intégrées (Arutua, Pirae et Tumaraa retirées par les règles de distance et de représentativité), lignes DRIAS ultramarines purgées, lacunes de publication de la Guyane étendues à quatre indicateurs.

15 octobre 2026 · branche `feat/fut-104-climat-outremer`, depuis `main` (6c496676). Aucune PR, fusion ni déploiement. FUT-50 non modifié.

## 0. À retenir

- **Les 218 lignes ultramarines de `public/data_climat.json` sont toutes fausses.** Ce ne sont pas des données d'outre-mer : ce sont des points de grille métropolitains, attribués par une jointure sans distance maximale. Fort-de-France y a 13,6 °C de moyenne annuelle, les valeurs du Conquet (Finistère).
- **La production les publie aujourd'hui.** `futur-e.fr/chaleur/97209` annonce « 3 jours de forte chaleur en 2050 » à Fort-de-France, « parmi les 3 % des communes françaises les moins exposées ». Ces pages sont dans le sitemap.
- **Météo-France publie des projections ultramarines exploitables :** SocleOM-Climat-2025, sous Licence Ouverte 2.0, sur un stockage public de data.gouv.fr. Elles sont intégrées pour **190 des 223 entités du COG**, soit 2 729 700 habitants.
- **Les communes métropolitaines sont strictement inchangées.** La comparaison exhaustive avant/après porte sur 34 791 codes et 278 328 rangs nationaux : 0 écart.
- Les données ultramarines sont **des faits, sans verdict** (`capaciteDecision: "faits_seulement"`). Aucune règle de décision n'est activée outre-mer.

## 1. Les 133 entrées signalées par FUT-50 : diagnostic

Le chiffre 133 correspond aux codes 971 à 978 : 129 communes de DROM, plus Saint-Pierre-et-Miquelon (2), Saint-Barthélemy et Saint-Martin. Le fichier contient en réalité **218** entités ultramarines (654 lignes), car il inclut aussi Wallis-et-Futuna (3), la Polynésie (48), la Nouvelle-Calédonie (33) et Clipperton (1). Les 5 districts des TAAF sont les seules entités du COG absentes du fichier.

**Ce qui est correct :** les codes, les noms et les coordonnées (colonnes 01 et 02). Ils viennent de `data/communes-france-coords.csv`, conforme au COG.

**Ce qui est faux : toutes les valeurs climatiques.**

- **Cause :** `scripts/build-drias-median.js` rattache chaque commune au point de grille DRIAS le plus proche, en degrés bruts et sans distance maximale. Or la grille DRIAS-TRACC (17 couples de modèles EURO-CORDEX, cf. `data/drias_median_metadata.json`) ne couvre que l'Hexagone et la Corse.
- **Conséquence :** toutes les communes d'un territoire reçoivent la même ligne, celle d'un point métropolitain.

| Territoires | Ligne reçue | Preuve |
|---|---|---|
| Guadeloupe, Martinique, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon, Wallis-et-Futuna, Polynésie, Clipperton | Le Conquet / Île-Molène / Ouessant (29) | Identité exacte des 30 indicateurs sur les 3 scénarios |
| Guyane | Point de la côte basque (près de Biriatou, 64) | Point métropolitain le plus proche en degrés bruts |
| La Réunion, Mayotte | Point du sud de la Corse (près de Bonifacio, 2A) | Idem |
| Nouvelle-Calédonie | Point de l'est de la Corse (près d'Aléria, 2B) | Idem |

D'où les « 80,9 nuits tropicales » de Saint-Denis (des nuits corses) et les « 33 nuits » relevées par FUT-50 à Bora-Bora (98714).

**Où ces valeurs étaient servies :**

- par `getClimatDataCommune` : pages publiques `/chaleur/[insee]` et `/inondation/[insee]`, Q&A, synthèse Logement, et toute route qui l'appelle ;
- par `getRangNational` ;
- par l'extrait de l'aperçu (`src/data/apercu-climat-communes.json`, via `quartier-preview.ts`) ;
- par la route `/api/climat/[insee]`.

Le comparateur les excluait déjà (`isMetropole`).

## 2. Matrice de couverture

Elle est calculée par `couvertureOutremer()` sur les données livrées. Les niveaux de réchauffement sont régionaux, en °C par rapport à 1850-1900.

| Territoire | Entités attendues (COG) | Intégrées | Source climat | 2030 / 2050 / 2100 | Indicateurs | Statut et limites |
|---|---|---|---|---|---|---|
| Guadeloupe | 32 communes | 32 | SocleOM Guadeloupe | +1,4 / +1,9 / +2,7 | 24 | **Complète** |
| Martinique | 34 communes | 34 | SocleOM Martinique | +1,4 / +1,9 / +2,7 | 24 | **Complète** |
| Guyane | 22 communes | 22 | SocleOM Guyane | +1,7 / +2,3 / +3,5 | 24 | **Complète**. Cumul annuel de pluie non publié pour les horizons futurs |
| La Réunion | 24 communes | 24 | SocleOM Réunion (version de fichier « 2024 ») | +1,5 / +2,0 / +2,9 | 24 | **Complète**. Fort relief : forts écarts à l'intérieur des communes |
| Mayotte | 17 communes | 17 | SocleOM Mayotte | +1,5 / +2,0 / +3,0 | 24 | **Complète**. Noms d'archives trompeurs (voir § 4) |
| Saint-Martin | 1 collectivité | 1 | SocleOM Saint-Martin–Saint-Barthélemy | +1,4 / +1,9 / +2,7 | 24 | **Complète**, à la granularité de la collectivité unique |
| Saint-Barthélemy | 1 collectivité | 1 | idem | idem | 24 | **Complète**, idem |
| Nouvelle-Calédonie | 33 communes | 33 | SocleOM Nouvelle-Calédonie | +1,5 / +2,0 / +3,0 | 25 | **Complète**. Mairies localisées par l'Annuaire de l'administration (31 sur 33) |
| Polynésie française | 48 communes | 26 | SocleOM Société, Tuamotu (ouest et centre), Australes | +1,2 / +1,6 / +2,3 | 24 | **Partielle**. 20 communes hors grille (Marquises, Gambier, est des Tuamotu, Rapa). 2 sans point de référence fiable (Taiarapu-Est et -Ouest) |
| Wallis-et-Futuna | 3 circonscriptions (royaumes) | 0 | SocleOM : données de base quotidiennes seulement | — | — | **Source officielle disponible, non intégrée**. Aucun indicateur publié ; il faudrait les calculer |
| Saint-Pierre-et-Miquelon | 2 communes | 0 | Aucune | — | — | **Source indisponible**. Absent de SocleOM |
| TAAF | 5 districts, sans population | 0 | Aucune | — | — | **Source indisponible** |
| Clipperton | 1 île, sans population | 0 | Aucune | — | — | **Source indisponible** |

**Total : 223 entités, dont 190 intégrées.** La population couverte est de 2 729 700 habitants, sur 2 787 126 pour l'ensemble des entités ultramarines.

Les lignes ultramarines de DRIAS, **présentes mais fausses**, ne sont plus servies nulle part (voir § 5).

## 3. Sources retenues

| Source | Usage | Licence | Référence |
|---|---|---|---|
| SocleOM-Climat-2025, indicateurs annuels, centiles d'ensemble, moyennes par niveau TRACC | Valeurs, écarts | Licence Ouverte 2.0 (Météo-France) | Fiche data.gouv « Projections climatiques pour le Hackathon 2025 - Socle Outre-Mer » ; bucket `object.files.data.gouv.fr/meteofrance-drias/SocleOM-Climat-2025/` |
| Définition des indicateurs outre-mer, niveaux TRACC par territoire | Doctrine, niveaux | — | drias-climat.fr/accompagnement/section/431 ; pages 472 (Mayotte), 474 (Guyane), 485 (Nouvelle-Calédonie), 490 (Antilles), 491 (Polynésie) |
| `SocleOM-DRIAS_Liste-indicateurs-Saisons_2026-06-10_publi.xlsx` | Sélection des indicateurs « Découverte » par territoire (24 chacun) | — | drias-climat.fr/document/… |
| « Quel climat futur pour les outre-mer » | Chiffres de contrôle, niveaux 2030/2050/2100 | — | meteofrance.com |
| COG via geo.api.gouv.fr | Identité, population, mairie (DROM et COM), contours | Licence Ouverte | relevé du 15/10/2026 |
| Annuaire de l'administration (DILA) | Mairies de Polynésie et de Nouvelle-Calédonie, que le COG ne localise pas | Licence Ouverte | api-lannuaire.service-public.fr |

**Volume :** le jeu complet pèse 272 Go (séries quotidiennes, mensuel, saisonnier, chaque modèle). On en télécharge **71 archives, soit 1,74 Go** (annuel, centiles, valeurs et écarts), chacune consignée avec sa clé, sa taille, son ETag et son sha256. Le résultat versionné pèse 1,3 Mo.

**Écartés :**

- le portail DRIAS « Données et Produits » : commande interactive, non reproductible ;
- Climadiag Commune : interface web, pas d'export reproductible ;
- les séries quotidiennes (DBA) : ce sont les données d'origine des indicateurs, inutiles tant qu'aucun indicateur sur mesure n'est décidé.

## 4. Incohérences découvertes

**Dans nos données :**

1. Les 218 lignes ultramarines de DRIAS (voir § 1).
2. **L'échelle du « rang national » contient ces 218 valeurs fausses.** « 35 006 communes comparées » inclut 218 doublons de points métropolitains. Les retirer est correct, mais changerait le rang affiché de **toutes** les communes métropolitaines : le total passerait à 34 788 et les percentiles bougeraient de 0,34 point au plus, de 0,08 à 0,14 point en moyenne selon l'indicateur. **Ce n'est pas fait dans cette branche** (voir la décision à prendre).

**Dans les sources officielles, relevées et contournées sans les corriger :**

3. **Mayotte : le nom des archives ne correspond pas à leur contenu.** L'archive `…RWL20…` contient les fichiers `RWL-15`, l'archive `…RWL27…` les fichiers `RWL-20`. Les niveaux internes (1,5 / 2,0 / 3,0) concordent avec la documentation. L'extraction lit le niveau dans les fichiers et échoue s'il ne correspond pas à la table TRACC.
4. **Guyane :** le cumul annuel de pluie (PRCPTOT) n'est publié que pour la référence, et 8 indicateurs manquent aux horizons futurs. On les garde en `null`, jamais à zéro.
5. **Nouvelle-Calédonie :** la sélection « Découverte » retient TN25D (nuits ≥ 25 °C), alors que la communication de Météo-France parle des nuits ≥ 24 °C. TN24D est ajouté pour ce territoire. Le « × 4 ou 5 » publié est vérifié : Nouméa passe de 37,7 à 130,9 nuits à +3 °C.
6. **Unités :** les degrés-jours sont notés « C » dans les fichiers ; ce sont des °C·jours. Un écart relatif (RRq99refTOT, Guyane) est publié sans unité ; il n'est pas utilisé.
7. **COG (geo.api) :** en Polynésie, en Nouvelle-Calédonie et à Wallis, le champ `mairie` recopie le centroïde. Or le centroïde peut tomber dans l'intérieur montagneux : Papara est à 19,3 °C au centroïde, contre 25,6 °C à la mairie. On prend la mairie de l'Annuaire de l'administration (49 communes).

## 5. Ce qui est intégré

| Élément | Fichier |
|---|---|
| Téléchargement ciblé, avec manifeste sha256 | `scripts/outremer/telecharger_socleom.py` |
| Extraction communale | `scripts/outremer/extraire_climat_outremer.py` |
| Référentiel des 223 entités (COG, point de référence) | `src/data/outremer/communes-outremer.json` (29 Ko) |
| Valeurs, écarts, provenance par zone | `src/data/outremer/climat-outremer.json` (1,3 Mo) |
| Contrat de consommation, pur et testé | `src/lib/outremer/climat-outremer.ts` |
| Liaison des données embarquées | `src/lib/outremer/index.ts` |
| Test « code ultramarin », sans dépendance | `src/lib/outremer/code-outremer.ts` |
| 18 tests | `src/lib/outremer/climat-outremer.test.ts` |

**Reproduire** (Python 3 avec `netCDF4` et `numpy`). Les deux scripts échouent bruyamment si un niveau, une unité, une période de référence ou une grille ne correspond pas à l'attendu.

```
python3 -P scripts/outremer/telecharger_socleom.py --cache ~/.cache/futuree/socleom   # 1,74 Go, une fois
python3 -P scripts/outremer/extraire_climat_outremer.py --cache ~/.cache/futuree/socleom
```

**Garde-fous ajoutés (aucune valeur métropolitaine modifiée) :**

- `getClimatDataCommune` et `getRangNational` renvoient `null` pour un code ultramarin, avant toute lecture de l'index. Les pages `/chaleur` et `/inondation` affichent alors leur état existant, « Données DRIAS indisponibles pour cette commune » ;
- `scenariosDepuisExtrait` (aperçu) renvoie `null` pour un code ultramarin ;
- `/api/climat/[insee]` renvoie 404 pour un code ultramarin ;
- `build-drias-median.js` exclut l'outre-mer avant la jointure et échoue si un point est à plus de 0,5°. Une régénération ne peut plus reproduire le défaut. Le fichier n'est pas régénéré dans cette branche.

**Règles de l'extraction :**

1. **Un pixel, jamais une moyenne.** Météo-France déconseille d'agréger des pixels corrigés (« à éviter, surtout pour les précipitations »). La valeur est celle du pixel de la mairie. L'étendue minimale et maximale des pixels de la commune est donnée à côté.
2. **Point de référence :** la mairie du COG ; à défaut, celle de l'Annuaire de l'administration ; à défaut, le centroïde, mais seulement si la température moyenne varie de moins de 1 °C dans la commune (atolls). Sinon : `point_de_reference_manquant`. Tous les pixels retenus sont à moins de 2 km de leur point, sauf Arutua (12,8 km, pixel terrestre de la commune la plus proche de la mairie).
3. **Niveaux lus dans les fichiers,** comparés à la table TRACC du territoire.
4. **Écarts tels que publiés.** La médiane des écarts n'est pas l'écart des médianes : à Saint-Denis, 47,0 − 5,4 = 41,6, alors que l'écart publié est 41,1.
5. **`null` = non publié, `0` = mesure nulle.**
6. **Fourchette [q17, médiane, q83] de l'ensemble.**

**Indicateurs par territoire** (sélection « Découverte » de Météo-France) :

| Famille | La Réunion | Mayotte | Guyane | Nouvelle-Calédonie | Antilles, Saint-Martin, Saint-Barthélemy | Polynésie |
|---|---|---|---|---|---|---|
| Jours chauds | SU (> 25 °C), **TX31D**, TX35D | SU, **TX32D**, TX35D | **TX33D**, TX35D, TX40D | **TX32D**, TX35D, TX40D | **TX33D**, TX35D, TX40D | **TX32D**, TX35D, TX40D |
| Nuits chaudes | TR (> 20 °C), **TN25D**, TR25D | TR, **TN25D**, TR25D | **TN24D**, TR25D | **TN24D**, TN25D, TR25D | **TN25D**, TR25D | **TN26D**, TR25D |
| Refroidissement | CDDcold25 | CDDcold25 | CDDcold26 | CDDcold26 | CDDcold26 | CDDcold26 |

Indicateurs communs à tous : TMm, TNn, TNx, TXn, TXx, ETR et DTRm pour la température ; PRCPTOT, RR10D, RR20D, RR100D, RRq99refTOT, Rx1D, Rx5D, SDII et PXCWD pour la pluie ; PXCDD pour la sécheresse. RR50D s'y ajoute partout sauf à La Réunion et à Mayotte.

**Restent à intégrer :**

- les indicateurs saisonniers (saisons propres à chaque territoire : la « saison sèche » de Météo-France est celle de ses communiqués), par le même script ;
- Wallis-et-Futuna et les communes polynésiennes hors grille, à partir des séries quotidiennes : c'est un calcul d'indicateurs, à décider ;
- Saint-Pierre-et-Miquelon : aucune source.

## 6. Exemples vérifiés, horizon 2050

Médiane, avec la fourchette q17–q83 entre crochets.

| Commune | Niveau 2050 | Indicateur | 1991-2020 | 2050 | Écart publié |
|---|---|---|---|---|---|
| Saint-Denis (La Réunion) | +2,0 °C | Jours ≥ 31 °C | 5,4 [4,2–7,1] | 47 [43,3–51,9] | +41,1 |
| Mamoudzou (Mayotte) | +2,0 °C | Jours ≥ 32 °C | 24,2 [21,6–25,2] | 115,7 [109,9–127,5] | +92,6 |
| Cayenne (Guyane) | +2,3 °C | Nuits ≥ 24 °C | 150 [144,6–153,9] | 293 [267,7–300,8] | +141,8 |
| Pointe-à-Pitre (Guadeloupe) | +1,9 °C | Jours ≥ 33 °C | 63,4 [60,2–65,9] | 140,4 [134,2–149,8] | +79,4 |
| Fort-de-France (Martinique) | +1,9 °C | Température moyenne | 27,58 °C | 28,62 °C | +1,07 °C |
| Fort-de-France (Martinique) | +1,9 °C | Nuits ≥ 25 °C | 85,4 | 210,4 | +123,1 |
| Nouméa (Nouvelle-Calédonie) | +2,0 °C | Nuits ≥ 24 °C | 37,7 [35,6–39,1] | 87,3 [82–93,4] | +50,4 |
| Papeete (Polynésie) | +1,6 °C | Jours ≥ 32 °C | 8,3 [7–11] | 28,8 [24,5–43,7] | +22,2 |
| Saint-Martin | +1,9 °C | Jours ≥ 33 °C | 35,2 | 118,2 | +83 |
| Saint-Barthélemy | +1,9 °C | Jours ≥ 33 °C | 0,1 | 6,1 | +5,9 |

**Concordance avec les chiffres de Météo-France (fin de siècle) :**

| Territoire | Publié | Données livrées |
|---|---|---|
| La Réunion, +2,9 °C | « 90 jours ≥ 31 °C sur le littoral, contre une dizaine » | Saint-Denis : 5,4 → 92,8 |
| Mayotte, +3 °C | « environ 205 jours ≥ 32 °C, contre une trentaine » | Mamoudzou : 24,2 → 199,8 |
| Guyane, +3,5 °C | « environ 170 jours ≥ 35 °C », surtout dans l'intérieur | Maripasoula 154, Saül 210, Grand-Santi 218, contre Cayenne 24 |
| Guyane | « environ 230 nuits ≥ 24 °C sur la quasi-totalité du territoire, contre moins d'une dizaine hors littoral » | Maripasoula : 6,4 → 275,6 |
| Nouvelle-Calédonie, +3 °C | Nuits ≥ 24 °C « multipliées par 4 ou 5 » | Nouméa × 3,5 |

## 7. Doctrine d'interprétation, à valider

**Ce qui peut être dit comme un fait :**

- la valeur d'un indicateur au pixel de la mairie, sur 1991-2020 et à chaque horizon, avec sa fourchette ;
- l'écart publié ;
- l'étendue à l'intérieur de la commune.

**Comparaisons valides :**

- même commune entre 1991-2020 et un horizon ;
- deux communes d'une même zone au même horizon (même ensemble, même niveau).

**Comparaisons non valides :**

- deux territoires au même « 2050 » : ce ne sont ni les mêmes niveaux, ni les mêmes ensembles, ni les mêmes indicateurs ;
- toute comparaison avec la métropole ;
- tout mélange d'un écart DRIAS (référence 1976-2005) et d'un écart SocleOM (référence 1991-2020).

**Règles métropolitaines inapplicables outre-mer :**

- les seuils de signalement de `climat-facts.ts` (8 jours ≥ 35 °C, 25 nuits > 20 °C, etc.) : une nuit > 20 °C est la norme à Saint-Denis (241 par an) ;
- `classifyClimateComfort` et `classifyWildfireDanger` (aucun indice feu dans SocleOM) ;
- le rang parmi les communes françaises ;
- la mention « +2,7 °C en France » ;
- la référence 1976-2005 ;
- le croisement Logement (`deriveClimatProjete`).

**Limites propres aux modèles :**

- scénarios à fortes émissions seulement (RCP8.5/SSP5-8.5 ; SSP3-7.0 pour les modèles régionaux de Nouvelle-Calédonie et de Polynésie) ;
- la plupart des modèles globaux ne représentent pas les petites îles (Antilles, Polynésie) ;
- pixel de 2,5 à 3 km sur relief abrupt : Pirae (Tahiti) a 20,8 °C au pixel de sa mairie, dans les pentes, contre 25,1 °C sur la côte ;
- moyennes sur 20 ans ;
- La Réunion corrigée sur 1981-2014 (version « 2024 » des fichiers).

**Disponibilité des faits n'est pas capacité à trancher.** Aucune règle ultramarine n'est activée. Deux pistes à faire valider :

- **A. Repère territorial relatif.** On signale l'indicateur de chaleur que Météo-France met en avant pour le territoire (TX31D à La Réunion, TX32D à Mayotte, TN24D en Guyane…) quand il **double au moins** entre 1991-2020 et 2050 dans la fourchette basse (q17).
  - *Fondement :* le seuil de chaque territoire est celui de Météo-France ; le doublement est une règle de lecture, pas une norme sanitaire.
  - *Implication :* presque toutes les communes du littoral seraient signalées. C'est une information, pas une discrimination entre communes.
- **B. Position dans le territoire.** On situe la commune parmi celles de **son** territoire, au même niveau.
  - *Fondement :* même ensemble, même niveau.
  - *Implication :* l'échelle est petite (de 17 à 34 communes) et n'a pas de sens pour Saint-Martin ou Saint-Barthélemy.
- **Aucune des deux ne permet un « plutôt favorable » :** on ne dispose d'aucun repère sanitaire ou de confort validé pour ces climats.

## 8. Raccordement à FUT-50 (contrat)

Import : `import { … } from "@/lib/outremer"`, côté serveur uniquement. Le fichier est chargé une fois par processus (1,3 Mo), sans réseau.

| Fonction | Rend |
|---|---|
| `estCodeOutremer(code)` | `true` pour un code `97xxx` / `98xxx`. Sans dépendance (`@/lib/outremer/code-outremer`) |
| `getEntiteOutremer(code)` | `{ code, nom, nomComplet, territoire, population, point }`, ou `null` si le code est absent du COG. Le nom vient du COG, jamais du navigateur |
| `lireClimatOutremer(code)` | Une `LectureClimatOutremer` (voir ci-dessous), ou `null` |
| `indicateurOutremer(lecture, "TX31D")` | Un indicateur, ou `null` s'il n'est pas retenu pour ce territoire |
| `couvertureOutremer()` | La matrice du § 2 |
| `TERRITOIRES_OUTREMER[id].reperes` | `{ chaleurJour, chaleurNuit, source }` : les indicateurs mis en avant par Météo-France. Un repère d'affichage, pas un seuil |

**Statuts :**

| Statut | Contenu | Capacité de décision |
|---|---|---|
| `integree` | `niveaux`, `indicateurs[]` (`reference`, `horizons["2050"].valeur` / `.ecart`, en fourchettes `{ q17, mediane, q83 }`), `provenance` (archives et sha256), `pixel`, `limites[]` | `faits_seulement` |
| `hors_grille`, `point_de_reference_manquant`, `source_non_integree`, `source_indisponible` | `raison`, rédigée | `aucune` |

**Étapes, dans FUT-50 :**

1. **`communeCanonique(insee)`** (route `dev/fut50/api/lecture`) : avant `getCommuneEntry`, si `estCodeOutremer(insee)`, rendre `getEntiteOutremer(insee)`. Les 223 codes que propose geo.api y sont tous, avec le même code. Un code inconnu reste refusé.
2. **Pastille « chaleur » :** pour un code ultramarin, ne jamais appeler `buildClimatFacts` ni `classifyClimateComfort`. Afficher les repères du territoire (référence 1991-2020, valeur 2050, niveau régional), avec un état « faits sans verdict » à créer dans `lireChaleur`. Hors statut `integree`, afficher `raison`.
3. **Pastilles « hivers » et « taille » :** elles passent par `buildCommuneDossier`, qui n'a pas de données ultramarines. Elles sont à masquer ou à déclarer « non couvert ».
4. **Exemple (97411)** : `lireClimatOutremer("97411")` → `statut "integree"`, `entite.nomComplet "Saint-Denis (La Réunion)"`, `niveaux { "2030": 1.5, "2050": 2, "2100": 2.9 }`, `indicateurOutremer(l, "TX31D").horizons["2050"].valeur` → `{ q17: 43.3, mediane: 47, q83: 51.9 }`.

## 9. Tests et vérifications

- **`climat-outremer.test.ts`, 18 tests**, sur les fichiers réels :
  - identité et comptes du COG ;
  - zone, référence et niveaux par cas, dont le piège de Mayotte ;
  - unités contre les fichiers NetCDF ;
  - sélection d'indicateurs par territoire, et un indicateur présent ici mais absent là ;
  - ordres de grandeur ;
  - concordance avec Météo-France ;
  - écarts publiés ;
  - 30 000 fourchettes ordonnées ;
  - `null` ou `0` ;
  - statuts partiels ou absents ;
  - règle du centroïde ;
  - aucune contamination métropolitaine (valeur exacte, uniformité d'un territoire) ;
  - garde-fous ;
  - matrice.
- **Aperçu :** le témoin 97411 est retiré, et un test « une ligne ultramarine n'est jamais servie » est ajouté. L'échantillon métropolitain est inchangé.
- **Métropole strictement inchangée,** par comparaison exhaustive de `origin/main` et de la branche :
  - `getClimatDataCommune` et `deriveClimatProjete` : 34 791 codes ;
  - `getRangNational` : 278 328 rangs (2 horizons × 4 indicateurs) ;
  - aperçu : 34 788 communes ;
  - **0 écart.** Côté outre-mer, les données servies passent de 218/218 à 0/218.
- **Suite complète, lancée seule :** 2 594 tests, 0 échec. Sur `origin/main` : 2 575. L'écart de 19 correspond aux 18 tests ajoutés et au test de l'aperçu.
- **TypeScript (`tsc --noEmit`) et ESLint** sur les fichiers modifiés : propres.

## 10. Décisions à prendre

1. **Purger l'échelle nationale** des 218 lignes : 34 788 communes comparées au lieu de 35 006, percentiles à 0,34 point au plus. Il faut aussi régénérer `data_climat.json` et l'extrait de l'aperçu, qui restent servis publiquement.
2. **Pages publiques `/chaleur/97xxx` en production :** elles publient aujourd'hui des valeurs fausses. Les garde-fous de cette branche les corrigent (état « indisponible »), mais rien n'est déployé. Il faudra aussi y présenter SocleOM ou les retirer du sitemap.
3. **Doctrine du § 7 :** pistes A et B.
4. **Calcul d'indicateurs** depuis les séries quotidiennes (Wallis, Marquises, Gambier) : coût et doctrine.

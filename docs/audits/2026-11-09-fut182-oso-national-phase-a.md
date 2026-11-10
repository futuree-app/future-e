# FUT-182 · Phase A — OSO national : audit avant recalcul

09-10/11/2026. Branche `bonjourfuturee/fut-182-oso-national-audit`, worktree dédié, base `origin/main` `e9158447`
(FUT-175, FUT-177, FUT-178 et FUT-179 fusionnés). **Audit seul** : aucune donnée de l'application, aucun contrat
métier, aucune base ni stockage distant modifiés ; aucun téléchargement massif. Scripts et résultats bruts :
`docs/audits/2026-11-09-fut182-oso-phase-a/`.

> **État au 10/11/2026.** Ce rapport a deux parties. La **partie I** (§ 0-15) est l'audit livré le 09/11, annoté là
> où le raster l'a corrigé (mentions « Corrigé le 10/11 »). La **partie II** (§ 16-30) applique les arbitrages du
> porteur et intègre ce que le raster officiel, téléchargé et vérifié, a établi : classe 24 = serres, précision 2023,
> preuve d'identité avec le cache, origine du point de référence, forêt exacte au seuil de 70 %, licence, lot L0,
> séquençage et conditions de B1. **Lire d'abord les § 16, 28, 29 et 30.**
>
> **Mise à jour du 10/11/2026, après la contre-revue de la partie II.** Les cinq arbitrages sont **définitifs**
> (§ 31). La licence **ne bloque plus la publication** : décision produit de publier sous la Licence Ouverte 2.0
> affichée par le producteur et le distributeur, divergences documentées, demande au CNES poursuivie sans suspendre
> le calendrier (§ 31, E). **B1 est fait** : comptes exacts des 34 746 contours communaux et des 45 arrondissements,
> identité exhaustive avec le cache, PLM, seuils, serres et retrait de l'eau (partie III, § 32-38). **L0** est la PR
> #148. La **préparation de B2** est au § 39 ; le calcul national de B2 attend le bilan du § 40.

---

## 0. Résumé pour décider (09/11, voir la partie II pour l'état à jour)

1. **L'eau pèse cent fois plus que la grille.** Sur le score « Espaces naturels » d'Où vivre, retirer l'eau change
   le score de ~10 100 communes (dont 79 de 10 points ou plus) et le verdict de rang Projet de 248. Corriger la seule
   sélection géographique (méthode B) en change 826 scores (aucun de 10 points) et 13 verdicts.
2. **La méthode B ne règle pas les cas qui posent problème.** Arles, Saintes-Maries-de-la-Mer et L'Île-d'Yeu restent
   seules avec B : aucun centre voisin n'est à 15 km. Seul un vrai tampon (méthode C) leur donne un entourage.
3. **Le raster n'est pas indispensable pour tout.** Le cache local (pixels par commune) suffit pour B, eau comprise,
   à l'identique. Pour le hors-eau, l'estimation tirée du cache est fiable à ± 1 point de score. Il faut en revanche le
   raster pour C exact, pour le dénominateur non classé et pour couvrir les 48 périmètres PLM.
4. **Le raster ne tient pas sur ce poste aujourd'hui** : archive 2023 de 5,62 Go, il reste 4,3 Gio libres sur le disque.
5. **Paris, Lyon et Marseille sont un trou dans le calcul de leurs voisines, pas seulement chez elles.** Les 48
   périmètres n'ont aucune donnée OSO. Ils manquent aussi, sans que rien ne le signale, dans le calcul de leurs
   voisines : 328 communes ont au moins un centre d'arrondissement à 15 km. Avec un vrai disque de 15 km, 387
   communes y perdent en médiane 6 % de la surface, et jusqu'à 30 % (Boulogne-Billancourt : 101 km² non mesurés sur
   707).
6. **Coût de régénération faible aujourd'hui.** Aucun des 34 snapshots persistés (16 communes) ne porte le trait
   « entourées d'espaces naturels » : les « 1 880 communes » sont un potentiel, pas un coût. Un seul dossier figé
   (engine-1) contient un fait nature, et il reste inchangé.
7. **Un arbitrage de doctrine passe avant le recalcul : les prairies.** OSO range les prairies (classe 13) en *terre
   agricole* ; futur•e les compte comme *naturelles*. Les reclasser changerait la catégorie de 13 472 communes. Le
   contrat doit l'écrire, et la décision revient à la personne qui porte le produit, hors du recalcul.

**Recommandation : GO conditionnel pour la phase B** (§ 14), en deux temps : (B1) eau retirée et sélection rendue
exhaustive, depuis les comptes de pixels, avec un raster obtenu proprement ; (B2) vrai tampon C et PLM, sur raster,
avec une pré-agrégation à 100 ou 200 m.

---

## 1. Méthode et sources de cet audit

| Élément | Valeur |
|---|---|
| Index | `data/comparateur-index.json.gz` de `e9158447`, sha256 `008c4c70…68ef`, 34 788 entrées |
| Cache OSO (gitignoré, dépôt principal) | `data/cache-nature/communes-nature.json`, sha256 `2a988102…aebfd`, 34 743 communes, 02/06/2026 |
| Contours | `data/cache-nature/contours/<dep>.json` (geo.api.gouv.fr, 02/06/2026), 34 746 communes, 96 départements |
| Arrondissements PLM | geo.api.gouv.fr `type=arrondissement-municipal`, 45 contours, ~0,3 Mo (lu le 10/11/2026) |
| Raster OSO 2023 | **absent du poste** le 09/11 (`data/cache-nature/oso2023.tif` supprimé, déjà noté par FUT-175) ; *téléchargé et vérifié le 10/11, hors dépôt (§ 18)* |
| Base de production | **lecture seule**, requêtes d'agrégats (comptes par version), aucune donnée personnelle lue |

Scripts (portables, chemins passés en argument) :
- `selection_eau.py` (numpy) : reproduction de l'index, méthodes A et B, effet de l'eau, seuils, rangs, trait
  distinctif, forêt, catégories, fixture FUT-178, cas témoins → `resultats-selection-eau.json`.
- `tampon_contours.py` (numpy, shapely, pyproj) : couverture des pixels classés, validité des contours, 48 périmètres
  PLM, point de référence, méthode C approchée → `resultats-tampon-contours.json`.
- Ajoutés le 10/11 (partie II) : `point_reference.py` (origine du point, sensibilité nationale de C1 au point),
  `inspecter_raster.py` (en-tête, histogramme national, preuve d'identité sur échantillon, forêt près de 70 %),
  `point_echantillon_raster.py` (quatre points et secteur habité, sur le raster, 24 cas) ; dépendance en plus :
  `rasterio`. Le raster se lit depuis `~/Documents/futuree-oso/extrait/OSO_20230101_RASTER/DATA/OCS_2023.tif`.

Reproduction (depuis la racine du dépôt) :
```
python3 docs/audits/2026-11-09-fut182-oso-phase-a/selection_eau.py <dépôt>/data/cache-nature/communes-nature.json \
  --out docs/audits/2026-11-09-fut182-oso-phase-a/resultats-selection-eau.json
python3 -m venv /tmp/v && /tmp/v/bin/pip install numpy shapely pyproj
curl -o arr.json 'https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields=code,nom,surface,codeParent,centre,contour&format=json'
/tmp/v/bin/python docs/audits/2026-11-09-fut182-oso-phase-a/tampon_contours.py <dépôt>/data/cache-nature arr.json \
  --out docs/audits/2026-11-09-fut182-oso-phase-a/resultats-tampon-contours.json
```

Convention de ce rapport : **reproduit** = recalculé ici, à l'identique ; **estimé** = calculé ici avec une
approximation nommée ; **non vérifié** = repris d'ailleurs, sans recalcul possible sans le raster.

---

## 2. Inventaire des usages OSO

### 2.1 Les champs de l'index (`scripts/populate-nature.py`)

| Champ | Calcul réel | Dénominateur | Grain réel |
|---|---|---|---|
| `nature.composition.{7 postes}` | pixels du poste / pixels 1-23 dont le centre tombe dans le contour (`rasterio.mask`, `all_touched=False`), arrondi 0,1 | pixels classés du contour, **eau comprise** | commune (contour geo.api.gouv.fr, juin 2026) |
| `nature.brut_pct` | forêts + prairies + landes-pelouses + minéral-dunes-glaciers + **eau** | idem | commune |
| `nature.radius_pct` | Σ pixels « naturels » / Σ pixels classés des communes **entières** dont le point de référence est à ≤ 15 km, présélectionnées par une grille de 0,18° ± 1 cellule | pixels classés des communes retenues, eau comprise | **secteur** (ni cercle, ni commune) |
| `nature.score` | percentile national (`bisect_right`) de `radius_pct` | 34 743 communes | rang national du secteur |
| `rankBands.nature` | bande `[bas, haut]` du rang de `score` (`populate-mismatch-rank.mts`), points de base | 34 743 | rang national du secteur |

Points de vérité sur la construction :
- Le « centre » n'est **pas un centroïde** : c'est le point lat/lon de `data_climat.json`. *Corrigé le 10/11 : il
  est identique, pour les 34 743 communes, au `centre` de geo.api.gouv.fr, situé à 19 m en médiane du centre du
  rectangle englobant (§ 17.1).* Il s'écarte du centroïde géométrique de 241 m en médiane (p99 1,15 km, max 13,9 km), et 483 points
  tombent juste hors de leur contour (de 1 à quelques mètres). « Centroïde » dans FUT-178 est donc un abus de langage :
  le contrat parlera de **point de référence**.
- Les 45 arrondissements PLM sont dans l'index sans `nature`. Paris, Lyon et Marseille (75056, 69123, 13055) ne sont
  pas dans l'index : leurs contours existent dans le cache, mais `populate-nature.py` ne les a jamais lus.

### 2.2 Les surfaces qui lisent ces champs

| # | Surface | Fichier | Champ lu | Transformation | Grain dit | Grain réel | Défaut constaté |
|---|---|---|---|---|---|---|---|
| 1 | Territoire, carte « Espaces naturels » (face, volet) | `territoire/facts.ts` `readLandShares`, `QuartierClimatData.tsx` | `brut_pct`, `composition` | eau retirée du dénominateur (FUT-175), % des terres | commune | commune | Source de face « OSO · ADEME », pied « · ADEME (taux de boisement) » alors que la carte OSO n'affiche aucune donnée ADEME |
| 2 | Territoire, catégorie `land.category` (`land-category@2`) | `facts.ts` `landCategory` | parts des terres | grille 50/45/50/20 | commune | commune | Arrondi entier affiché vs seuil au dixième : FUT-183 |
| 3 | Territoire, fait `land.natural_share_15km` | `facts.ts:437` | `radius_pct` | aucune | `scale: "radius_15km"`, limite « rayon de 15 km » | secteur, eau comprise | Limite et `scale` faux, non rendus, mais **dans l'empreinte** |
| 4 | Territoire, `place.distinctive_trait` | `trait-distinctif.ts:42` | `score` ≥ 88 | trait le plus extrême | « les plus entourées » | secteur, eau comprise | Libellé inexact (3 communes seules, eau). Non affiché, **dans l'empreinte** |
| 5 | Territoire, carte d'identité (`solDominant`) | `territory-identity.ts:203` | `land.composition`, `natural_share`, `natural_share_15km`, `water_share` | lecture du snapshot | commune et secteur | idem | À réaligner sur le nouveau contrat |
| 6 | Territoire, synthèse (modèle et texte déterministe) | `synthesis-contract.ts`, `synthesis-deterministe.ts` | `composition_des_terres_pct`, `part_eau…`, catégorie | projection | commune | commune | Conforme (FUT-175/177). Le 15 km est exclu |
| 7 | Territoire, repli ADEME (`land.forest_ademe`) | `facts.ts:444` | `ademe.taux_boisement` | carte « Taux de boisement » si **pas d'OSO** | commune | commune ADEME (définition non documentée) | Pour les 48 PLM, la carte montre l'ADEME. Elle disparaîtra si OSO couvre les PLM |
| 8 | Où vivre, sous-score `nature` (tri et score) | `comparateur-vie.ts:1426`, `comparateur-scores.ts:54` | `score` | percentile | « Espaces naturels » | secteur, eau comprise | Effets en § 6 |
| 9 | Où vivre, paliers de la ligne | `comparateur-vie.ts:1569`, `bandIndex` 66/34 | `score` | 3 paliers | « …ou d'eau dans le secteur » (FUT-178) | idem | Texte transitoire FUT-178 |
| 10 | Où vivre, raisons et compromis | `REASON_POS/NEG`, `SEUIL_RAISON` 55, `SEUIL_FAIBLESSE` 50 | `score` | seuils | « dans le secteur » | idem | idem |
| 11 | Où vivre, promesse de signature | `comparateur-vie.ts:1149` `natureForte` ≥ 60, « au plus près de la nature » | `score` | seuil 60 | « au plus près » (proximité) | secteur | Libellé de proximité non mesuré, non traité par FUT-178 |
| 12 | Où vivre, point fort relatif | `comparateur-vie.ts:3018` (≥ 70, `SIGNATURE_MIN`) | `score` | max des trois | « …ou en eau dans son secteur » | idem | Texte transitoire |
| 13 | Où vivre, catégories rurales | `comparateur-vie.ts:832` | `composition.agricole` ≥ 30, `foret` ≥ 35 | densité < 1 500 | commune | **% du contour, eau comprise** | Choisit les cartes de l'accueil (§ 14) |
| 14 | Accueil, cartes et accroche | `accueil/recits.ts:376-416, 542` | catégories rurales | feux si `rural_forestier`, sols secs si `rural_agricole`, « dépend de la voiture », carte « Nature à… » | — | idem | La carte « Nature à… » cite « OSM / IGN » alors que le déclencheur vient d'OSO |
| 15 | /qna (comparateur), signal au modèle | `comparateur-vie.ts:937` (70/40) | `score` | 3 niveaux, périmètre, ne-dit-pas | « secteur » | idem | Texte transitoire FUT-178 |
| 16 | AskFuture (commune) | `ask/system-prompt.ts:169` | **ADEME** `taux_boisement` | « Taux boisement (%) » dans le bloc « [ADEME — données socio-environnementales] » | commune | ADEME | *Corrigé le 10/11 : la source est nommée par l'en-tête du bloc.* Le défaut est ailleurs : ni définition ni millésime, et rien ne dit que la carte Territoire montre une autre forêt, celle d'OSO, tenue pour canonique (D1). Châtelaillon : 1,5 % ADEME, 10,3 % OSO |
| 17 | Projet, règles de rang (mismatch / alignment) | `mismatch-rules.ts`, `alignment-rules.ts` | `rankBands.nature` | ≤ 20 % / ≥ 80 % | preuve `grain: "commune"` | **secteur** | Le grain de la preuve est faux |
| 18 | Projet, boisement 70 % | `module-facts-map.ts:44`, `materiality-rules.ts:730` | `composition.foret` | ≥ 70 → vérification « fortement boisée » | « du territoire communal », « parmi les 10 % les plus boisées » | % du contour, eau comprise | Affirmation dérivée du seuil (« 10 % ») : § 6.4 |
| 19 | Projet, distributions publiées | `distributions-rang.ts` | empreinte des bandes `nature` | registre en ajout seul | — | — | Toute nouvelle bande exige une identité `mismatch-dist-…-nature` |
| 20 | Dossiers figés | `decision_artifact.payload` | faits ci-dessus, figés | — | — | — | 1 artefact engine-1 porte un fait nature (§ 9) |
| 21 | Ambiance (`territory-mood.ts`) | ADEME `taux_boisement` ≥ 35 → « boisé » | ADEME | — | — | — | Hors OSO, reste ADEME (à ne pas confondre) |

Champs ADEME de boisement, **jamais interchangeables avec OSO** : `land.forest_ademe` (repli Territoire), AskFuture,
`territory-mood`. Le contrat (§ 8) les tient à part, sous une autre clé.

Tests qui figent ces valeurs ou textes (à revoir en phase B) : `fut175-oso-eau`, `fut177-conclusions-sols`,
`fut178-portee-nature` (+ fixture), `fut34-trait-distinctif`, `fut147-non-regression` (empreintes), `distributions-rang`,
`rangs-parite`, `mismatch-rules`, `alignment-rules`, `materiality-rules`, `module-facts-map`, `territoire/facts`,
`plm-communal`, `fut179-plm-densite`, et les gels ligne à ligne `__fixtures__/fut17{5,7,9}-lignes-admises.json`.

---

## 3. La source OSO 2023

### 3.1 Ce qui est établi

| Point | Constat | Source |
|---|---|---|
| Producteur | THEIA, CES Occupation des sols (CESBIO, coord. J. Inglada), chaîne iota2, Sentinel-2 | Theia, Cerema |
| Résolution | 10 m (le produit existe aussi à 20 m, et en vecteur dérivé du 20 m) | Theia, Cerema |
| Pixel à 10 m **vérifié** | pixels classés × 100 m² / surface des contours : **médiane 1,0000** (p5 0,999 ; p95 1,0002) | ce rapport |
| Nomenclature | 1-4 urbanisé, 5-12 cultures annuelles, **13 prairies, 14 vergers, 15 vignes (rangés par OSO en « terre agricole, culture pérenne »)**, 16-17 forêts, 18 pelouses, 19 landes, 20 minéral, 21 plages et dunes, 22 glaciers, 23 eau | schéma officiel Theia (`nomenclature_oso.png`) |
| « 24 classes » | Theia : « depuis 2018, nomenclature en 24 classes ». Le Cerema liste « Autres » en dernier poste, sans code. Le schéma n'en montre que 23. *Corrigé le 10/11 : les métadonnées du produit 2023 nomment la classe 24 « serres » ; elle couvre 226 km² (§ 18.2).* | Theia, Cerema, métadonnées |
| Précision publiée | Évaluation SIRS **de 2016** : précision globale 81-92 % selon la nomenclature. Le Cerema signale une « distinction peu fiable » entre les quatre classes urbaines. *Corrigé le 10/11 : les métadonnées 2023 publient une précision globale de 0,874, un kappa de 0,847 et un F-score par classe (§ 18.3).* | Cerema, métadonnées |
| Licence | Theia : « Etalab 2.0 ». Cerema : « Open Database, compatible avec la licence Etalab ». Le dépôt Recherche Data Gouv redistribue en Etalab 2.0 en citant l'ODbL d'origine | §3.3 |
| Édition 2024 | Non annoncée (Theia : « À venir », sans date) | Theia |

### 3.2 Couverture : la part non classée est mesurable sans le raster

Les comptes de pixels du cache, rapportés à la surface des contours, donnent la **couverture classée** de chaque commune.
Elle mêle trois choses : pixels non classés (0, 255, le code « Autres »), hors emprise du raster, et effet de bord.

| | Valeur |
|---|---|
| Surface des 34 743 contours | 548 466,5 km² |
| Pixels classés 1-23 | 548 260,0 km², soit **99,96 %** |
| Communes sous 99 % / 95 % / 90 % | 327 / 35 / 2 |
| Minimum | Héberville (76) 84,8 %, Saint-Michel-en-l'Herm (85) 88,2 %, Rognonas (13) 90,1 % |

Les déficits forment des **grappes** (Pays de Caux, nord des Bouches-du-Rhône, marais poitevin), et non l'effet de
bord. Le calcul actuel les retire du dénominateur sans le dire. *Corrigé le 10/11 : l'hypothèse de « trous
d'acquisition » était fausse. Le raster montre que ces déficits sont des **serres** (classe 24, exclue par
`populate-nature.py`) ; les pixels de valeur 0 sous un contour sont quasi absents, et la valeur 255 n'existe pas
(§ 18.2).*

### 3.3 Obtenir le raster : intégrité, volume, licence

| Point | Constat |
|---|---|
| Copie Recherche Data Gouv | DOI 10.57745/UZ2NJ7, version 1.4 (18/02/2026), dépôt 12/09/2025, INRAE RiverLy, « redistribution **non officielle** » |
| Fichier 2023 | `OSO_20230101_RASTER.tar.gz`, **5 624 505 462 octets** (5,24 Gio), **MD5 `bc6deea29081876a9be88c76b92d59ec`** (somme calculée par l'entrepôt sur la copie, pas une somme publiée par le producteur) |
| Source officielle | GEODES (CNES), depuis janvier 2025. DOI 10.24400/329360/OSO_20230101_RASTER, dont la page d'atterrissage est **en 404** |
| Contenu de l'archive | *Corrigé le 10/11 : téléchargée, MD5 conforme ; trois GeoTIFF nationaux (classification 773 Mo, confiance 4,5 Go, validité 662 Mo) et un XML de métadonnées (§ 18.1)* |
| Espace local | 4,3 Gio libres le 09/11 ; *36 Gio le 10/11, après le nettoyage du porteur* |
| Volume à prévoir | archive 5,6 Go + extraction (raster national 10 m ≈ 5,5 milliards de pixels en uint8, soit ~5,5 Go non compressé par couche, moins en GeoTIFF compressé) : **prévoir 20 Go** de marge |
| Licence, dérivés | Données d'origine en **ODbL 1.0** selon le Cerema, Etalab 2.0 selon Theia. L'ODbL distingue l'« œuvre produite » (attribution) de la « base dérivée » (partage à l'identique si elle est rendue publique). L'index de futur•e est une base dérivée par commune. **À trancher** : publier sous Etalab avec attribution « OSO – THEIA / CES OSO, CNES/GEODES », ou faire valider la lecture ODbL |
| Intégrité | Vérifier le MD5 de l'entrepôt, puis le contrôle croisé : les comptes de pixels recalculés doivent redonner **à l'identique** les 34 743 `tot_px` / `nat_px` du cache (empreinte `2a988102…`). C'est la preuve que c'est le même raster |

### 3.4 Reproductibilité du traitement actuel

- `populate-nature.py` est déterministe, mais il dépend de trois entrées hors dépôt : raster, contours de juin 2026
  (millésime COG non noté), point de référence DRIAS. Aucune somme de contrôle n'est enregistrée pour ces entrées.
- `radius_pct` et `score` se **reproduisent à l'identique** depuis le cache seul (§ 4). Le cache est donc la vraie
  pièce de référence : il faut le versionner (8 Mo, ou sa forme compacte) ou en publier l'empreinte.
- La classe « Autres » et le no-data ne sont pas lus : `a[(a > 0) & (a <= 23)]` les écarte tous, sans compte.

---

## 4. Reproduction des constats antérieurs

| Constat | Annoncé | Ce rapport | Statut |
|---|---|---|---|
| Index = cache (score, brut, radius, composition) | — | 0 écart sur 34 743 | **reproduit** |
| `radius_pct` recalculé | 0 écart / 34 743 (FUT-178) | 0 écart ; `score` 0 écart ; `rankBands.nature` 0 écart | **reproduit** |
| Sélections incomplètes (grille 0,18°) | 2 465 (~7 %) | 2 465 (7,1 %) ; 3 794 couples omis ; 1 commune omise en médiane, 6 au plus ; 90 % au nord de 47° N (62, 80, 02, 59, 76 en tête) | **reproduit** |
| Écart `radius_pct` A → B | médiane 0,2, max 4,8 (en valeur absolue) | signé : **de −4,1 à +4,8** ; 2 040 communes changent d'au moins 0,1 | **reproduit**, précisé |
| Communes seules | Arles, Saintes-Maries-de-la-Mer, L'Île-d'Yeu | idem, **et toujours seules avec B** | **reproduit** |
| Taille des sélections | médiane 53, p5 21, p95 101 | idem | **reproduit** |
| Fixture FUT-178 (24 cas) | `src/lib/__fixtures__/fut178-selection-nature.json` | 24/24 identiques (retenues, à 15 km, deux rayons) | **reproduit**. La fixture est un échantillon, pas une preuve exhaustive |
| Trait « entourées » : 1 880 communes | FUT-178 | 1 880 | **reproduit** (potentiel, voir § 9) |
| Catégories Territoire FUT-175 | 332 (parts affichées) / 342 (brutes) | 332, mêmes transitions | **reproduit** |
| Forêt ≥ 70 % hors eau : 77 communes de plus | FUT-175 | **77** sur la part non arrondie, **84** sur la part arrondie au dixième (ce qu'afficherait Territoire) | **requalifié** : 77 à 84 selon l'arrondi ; le compte exact exige le raster |
| Arrondi : 238 / 252 communes | FUT-183 | non recalculé ici | **non vérifié** (hors périmètre, FUT-183) |
| Densité PLM | FUT-179 | non touchée | invariant préservé |

---

## 5. Les trois méthodes géographiques

### 5.1 Définitions

- **A (en vigueur)** : communes entières dont le point de référence est à ≤ 15 km, présélectionnées par la grille de
  0,18° ± 1 cellule. À 51° N, une cellule fait 12,6 km de large : la fenêtre ne couvre pas tout le disque.
- **B (sélection exhaustive)** : mêmes communes entières, grille de 0,5° (≥ 35 km de large partout en métropole).
  B contient A pour toutes les communes (vérifié).
- **C (vrai tampon)**, en deux variantes :
  - **C1** : disque de 15 km autour du point de référence de la commune ;
  - **C2** : la commune entière plus une bande de 15 km au-delà de ses limites.

C est ici **approché sur les contours** : une commune coupée par le disque compte pour la part de sa surface comprise
dans le disque, avec sa composition moyenne. Le calcul exact sur pixels (phase B) en différera là où l'intérieur des
communes est hétérogène. Les chiffres ci-dessous donnent donc l'**ordre de grandeur** de l'écart B → C, pas C lui-même.

### 5.2 Résultats (eau comprise, pour isoler la géographie)

| Passage | \|Δ radius\| médian | \|Δ radius\| ≥ 5 / ≥ 10 | Δ min / max | Score modifié | \|Δ score\| ≥ 10 | Palier 34/66 | Verdict de rang |
|---|---|---|---|---|---|---|---|
| A → B (exact) | 0 | 0 / 0 | −4,1 / +4,8 | 826 | 0 | 20 | 13 |
| B → C1 (approché) | 0,4 | 65 / 4 | −11,2 / +11,4 | 17 263 | 20 | 561 | 442 |
| B → C2 (approché) | 0,8 | 628 / 26 | −22,5 / +25,1 | 25 308 | 137 | 1 297 | 1 008 |
| C1 → C2 (approché) | 0,7 | 248 / 15 | −13,4 / +15,2 | 23 490 | 57 | 1 064 | 836 |

Pour comparaison, **eau seule** (A, estimé) : |Δ score| ≥ 10 pour 79 communes, verdict de rang pour 248. Le choix
C1 contre B pèse moins que l'eau sur les écarts forts, mais il touche presque toutes les communes d'un ou deux points
de score (C1 compte des fractions de communes, B des communes entières).

Avec C1, la médiane monte à 70 communes au moins partiellement comptées par secteur (89 avec C2, 53 avec A et B).

### 5.3 Les cas qui départagent

| Commune | A = B | C1 | C2 | Lecture |
|---|---|---|---|---|
| Arles (eau comprise) | 66,1 (seule) | 72,8 (Camargue, Crau, Alpilles) | 61,8 | C1 lui rend un entourage ; C2 y ajoute 15 km au-delà d'une commune de 759 km² |
| Saintes-Maries-de-la-Mer | 91,3 (seule) | 80,1 | 68,8 | idem |
| L'Île-d'Yeu | 71,2 (seule) | 71,2 (seule) | 71,2 (seule) | **aucune méthode ne crée de voisin en mer** : le secteur est l'île, et le texte doit le dire |
| Fontainebleau | 63,8 | 64,0 | 50,6 | C2 dilue la forêt dans un anneau périurbain de 15 km autour d'une commune de 172 km² |
| Granville | 36,3 | 47,7 | 61,4 | écart le plus fort ; explication probable (non vérifiée) : un contour qui inclut l'archipel de Chausey, compté en entier par A et B, coupé par C |
| Bordeaux | 54,0 | 57,5 | 62,7 | — |
| Châtelaillon-Plage | 27,9 | 28,6 | 28,6 | stable |
| Bony, Janville, Corte, Lille | ≈ | ≈ | ≈ | stables (±1,5 point au plus) |

### 5.4 Comparatif argumenté

| Critère | A | B | C1 (disque autour du point de référence) | C2 (commune + 15 km) |
|---|---|---|---|---|
| Ce que la mesure dit | « des communes voisines retenues », liste incomplète pour 7 % | « la commune et toutes les communes dont le centre est à moins de 15 km » | « dans un rayon de 15 km autour du centre de la commune » | « la commune et 15 km autour de ses limites » |
| Libellé honnête possible | non sans réserve | oui, mais long et abstrait | **oui, court, et c'est la promesse d'origine** | oui |
| Omissions silencieuses | 2 465 communes | aucune | aucune | aucune |
| Communes seules | 3 | 3 | 1 (île) | 1 (île) |
| Débordement | communes entières, jusqu'à ~30 km du centre | idem | aucun | aucun, mais anneau large pour les grandes communes |
| Biais | grandes communes voisines surpondérées, centres juste au-delà de 15 km exclus | idem, sans le défaut de grille | dépend du point de référence (origine DRIAS non documentée, à 241 m en médiane du centroïde) | dilue les grandes communes (Fontainebleau, Arles) ; mesure peu lisible |
| Données | comptes communaux (cache) | comptes communaux (cache) | **raster** (pixels dans le disque) | **raster** |
| Coût de calcul | secondes | secondes | une passe raster, puis convolution sur une grille agrégée : < 1 h sur un poste | idem, plus la rasterisation de 34 743 tampons : < 1 h |
| Intégration | aucune | changer une constante (0,18 → 0,5) dans `populate-nature.py` | nouveau script de pré-agrégation, versionné | idem |
| Maintenance | — | nulle | une grille intermédiaire à archiver (~1 Go à 200 m) | idem |
| Valeur décisionnelle | faible : erreur muette | correction d'un bogue, sans changer le sens | **la seule qui tienne la promesse « 15 km » et qui donne un entourage à Arles et aux Saintes-Maries** | sens moins intuitif, plus de bouleversements de rang |

**B corrige un bogue du précalcul ; C1 change la définition.** Il ne faut pas les livrer sous le même nom : B garde
« secteur » ; seul C1 permet « rayon de 15 km » (FUT-178, critère « jamais rayon exact si ce n'en est pas un »).

---

## 6. Conséquences nationales : eau, géographie, combinaison

Référence : l'index publié (A, eau comprise). « Hors eau » est **estimé** depuis la part d'eau arrondie au dixième ;
les deux bornes de l'arrondi encadrent `radius_pct` à **0,1 point près** et le score à **1 point près** (pour ~1 600
communes). La non-additivité des deux effets ne dépasse pas 0,5 point de `radius_pct`.

### 6.1 Score `nature` (Où vivre, Projet)

| Effet | `radius_pct` modifié | Δ `radius_pct` signé (min / p1 / méd. / p99 / max) | Score modifié | \|Δ score\| ≥ 5 / ≥ 10 | Δ score min / max |
|---|---|---|---|---|---|
| Géographie seule (B, eau comprise) — exact | 2 040 | −4,1 / −0,3 / 0 / +0,4 / +4,8 | 826 | 3 / 0 | −4 / +7 |
| Eau seule (A hors eau) — estimé | 26 422 | −19,5 / −3,0 / −0,2 / 0 / 0 | 10 141 | 239 / 79 | −25 / +1 |
| Combinaison (B hors eau) — estimé | 26 610 | −19,5 / −3,0 / −0,2 / +0,1 / +4,7 | 10 398 | 241 / 79 | −25 / +8 |

Le retrait de l'eau ne fait que baisser `radius_pct` (l'eau était comptée naturelle). Il ne retire que l'eau **des
contours communaux** (étangs, lagunes, estuaires, lacs) : la mer au-delà du trait de côte n'a jamais été comptée.
Plus forts écarts : Saintes-Maries-de-la-Mer (91,3 → 71,8 ; score 87 → 66), estuaire de la Gironde (Barzan,
Talmont, Mortagne : −16 à −17 points ; scores 57 → 32), Le Grau-du-Roi (67,4 → 50,7 ; 61 → 38).

### 6.2 Seuils, paliers, verdicts

| Seuil franchi (score) | Lecture | Géographie | Eau | Combinaison |
|---|---|---|---|---|
| 34 / 66 | palier de la ligne du comparateur | 20 | 335 | 339 |
| 40 / 70 | niveau du signal /qna | 17 | 311 | 317 |
| 50 | `SEUIL_FAIBLESSE` (compromis) | 9 | 233 | 234 |
| 55 | `SEUIL_RAISON` (raison favorable) | 10 | 202 | 212 |
| 60 | `natureForte` (promesse « au plus près de la nature ») | 6 | 110 | 112 |
| 70 | `SIGNATURE_MIN` (point fort relatif) | 6 | 61 | 65 |
| 88 | trait distinctif | 1 | 20 | 21 |
| rang ≤ 20 % / ≥ 80 % | verdict Projet (mismatch / satisfied) | **13** | **248** | **254** |

Transitions du verdict Projet (combinaison) : neutre → défavorable 96, défavorable → neutre 123, favorable → neutre
19, neutre → favorable 16. Le trait distinctif change pour 11 communes (1 880 → 1 875 portent le trait nature).

### 6.3 Classements

Corrélation de rang (score) avant/après : 1,0000 (géographie), 0,9993 (eau, combinaison). Top 100 national : 99
communes communes dans les trois cas. Top 20 par région : 20/20 en médiane, 17/20 au pire (eau, combinaison). Le tri
global d'Où vivre dépend des autres critères : ces chiffres bornent l'effet du seul critère « Espaces naturels ».

### 6.4 Forêt (Projet) et catégories rurales (Où vivre, accueil)

| Mesure | Contour, eau comprise (aujourd'hui) | Terres (hors eau) | Écart |
|---|---|---|---|
| Forêt ≥ 70 % (`BOISEMENT_NOTABLE`) | 3 258 (9,38 %) | 3 342 (9,62 %) | +84 (77 sans arrondi), aucune sortie — *corrigé le 10/11, compte exact : 3 338 (9,61 %), +82 / −2 (§ 22)* |
| Seuil du décile supérieur de forêt | 68,6 % | 69,2 % | — |
| `rural_agricole` (agricole ≥ 30 %, densité < 1 500) | 16 970 | 17 110 | 140 |
| `rural_forestier` (forêt ≥ 35 %, densité < 1 500) | 13 380 | 13 515 | 135 |

L'affirmation figée « parmi les 10 % de communes les plus boisées » **reste vraie** sous les deux dénominateurs (9,4 %
puis 9,6 % des communes passent le seuil). Elle n'en reste pas moins une conséquence du seuil (règle d'AGENTS.md) : le
test doit la recalculer, pas la recopier. Les 84 nouvelles communes sont lacustres ou riveraines : Conjux (25,5 % de
forêt sur le contour, 70,4 % des terres, 63,8 % d'eau), Les Salles-sur-Verdon, Veyrier-du-Lac, Sevrier,
Aiguebelette-le-Lac. Pour elles, « la forêt couvre X % du territoire communal » devient « X % de ses terres ».

### 6.5 Catégorie Territoire

Déjà livrée par FUT-175 (332 changements, reproduits). FUT-182 ne la touche que si la doctrine des prairies change :
13 472 communes changeraient de catégorie (§ 8.2).

### 6.6 Cas témoins (A eau comprise → B hors eau, estimé)

| Commune | Sélection A/B | Eau commune | `radius_pct` | Score | Verdict de rang | Trait |
|---|---|---|---|---|---|---|
| Arles | 1/1 | 29,8 % | 66,1 → 51,7 | 59 → 40 | neutre | sécheresse |
| Saintes-Maries-de-la-Mer | 1/1 | 69,0 % | 91,3 → 71,8 | 87 → 66 | **favorable → neutre** | sécheresse |
| L'Île-d'Yeu | 1/1 | 0,9 % | 71,2 → 70,9 | 65 → 65 | neutre | — |
| Sète | 15/15 | 50,6 % | 55,6 → 44,1 | 45 → 28 | neutre | sécheresse |
| Palavas-les-Flots | 21/21 | 67,7 % | 58,0 → 48,2 | 48 → 34 | neutre | feu |
| Pérols | 29/29 | 32,6 % | 57,7 → 49,5 | 48 → 36 | neutre | feu |
| Paimbœuf | 21/21 | 71,4 % | 74,2 → 71,6 | 68 → 66 | neutre | déclin |
| Châtelaillon-Plage | 32/33 | 0,2 % | 27,9 → 27,0 | 8 → 7 | défavorable | croissance |
| Rochefort | 33/33 | 7,7 % | 47,5 → 45,3 | 32 → 29 | neutre | déclin |
| Annecy | 51/51 | 4,2 % | 84,4 → 83,9 | 79 → 79 | neutre | croissance |
| Bony | 83/83 | 0 | 11,2 → 11,0 | 0 → 0 | défavorable | — |
| Janville-en-Beauce | 37/37 | 0 | 5,6 → 5,5 | 0 → 0 | défavorable | déclin |
| Corte | 20/20 | 0,2 % | 99,6 → 99,6 | 100 → 100 | favorable | nature |
| Bordeaux | 42/42 | 10,6 % | 54,0 → 51,8 | 43 → 40 | neutre | croissance |
| Lille | 97/97 | 1,0 % | 27,0 → 26,5 | 7 → 7 | défavorable | croissance |

Détail complet, y compris les 15 communes à snapshot persisté : `resultats-selection-eau.json`, clé `cas`.

---

## 7. Les 48 périmètres PLM

### 7.1 État

| Périmètre | Dans l'index | OSO | Contour |
|---|---|---|---|
| Paris 75056, Lyon 69123, Marseille 13055 | **non** (seuls leurs arrondissements y sont) | aucune (`nature: null` au snapshot, FUT-43/FUT-60) | présent dans le cache de juin 2026, valide |
| 45 arrondissements | oui, `nature: null` | aucune | geo.api.gouv.fr, 45 valides |

Contrôle géométrique (Lambert-93) :

| Commune | Arrondissements | Surface commune | Somme des arrondissements | Recouvrements | Trous |
|---|---|---|---|---|---|
| Paris | 20 | 105,43 km² | 105,43 | 0 | 0 |
| Lyon | 9 | 47,90 km² | 47,90 | 0 | 0 |
| Marseille | 16 | 238,12 km² | 238,12 | 0 | 0 |

Les arrondissements forment une **partition exacte** de leur commune (somme = union = commune, au 0,001 km² près).
Marseille 9e (63,3 km², Calanques) et 11e (33,5 km²) représentent 40 % de la commune.

### 7.2 Ce que l'absence produit aujourd'hui

- Pour les 48 périmètres : aucune part, aucune catégorie (absence explicite, conforme). Faute d'OSO, la carte
  Territoire montre le **taux de boisement ADEME** (repli `land.forest_ademe`).
- **Pour leurs voisines, une absence silencieuse** : 328 communes ont au moins un centre d'arrondissement à 15 km, donc
  un secteur A/B amputé de communes très urbaines. Avec C1, 387 disques touchent un périmètre PLM : 6,1 % de la
  surface du disque y est non mesurée en médiane, 29,5 % au plus. Départements : Rhône 107, Bouches-du-Rhône 39,
  petite couronne 121, grande couronne 105, Ain 12, Isère 3. Le biais va dans les deux sens : Paris compte Bois de
  Boulogne et de Vincennes, Marseille les Calanques. Il n'est donc pas chiffrable sans le raster.

### 7.3 Règles proposées pour la phase B

1. Calculer les comptes OSO des **48 contours** dans la même passe raster que les communes, sous la même méthode.
2. Pas de double compte : la commune entière est calculée sur son contour, et le contrôle `Σ arrondissements = commune`
   (au pixel près) devient un test. Pour un secteur, on agrège des **pixels**, jamais une commune et ses
   arrondissements à la fois.
3. Grain : `scale: "arrondissement"` pour les 45, `commune` pour les 3. Aucune part de Paris recopiée vers le 11e.
4. Classements (`score`, `rankBands`) : **univers inchangé**, celui des communes. Les arrondissements ne doivent pas
   entrer dans la distribution, sinon 45 entités très urbaines déplaceraient les percentiles. Leur position se lirait
   « par rapport aux communes », ou pas du tout. **Décision à prendre** ; défaut proposé : pas de score « Espaces
   naturels » pour les arrondissements dans Où vivre, mais des parts communales dans Territoire.
5. Marseille 9e et 16e : la part naturelle des terres sera forte (Calanques, massifs). Le texte doit l'attribuer à
   l'**arrondissement** (« sur les terres du 9e arrondissement »), sans qualifier le cadre de vie ni l'accès, et sans
   toucher « cadre calme » ni la dépendance automobile, qui ont leurs propres mesures.
6. Densité FUT-179 : invariante (`place.density`, mention `arrondissement`, sources). Le lot ne touche pas
   `plm-densite.generated.ts`.
7. Le repli ADEME disparaît pour les 48 périmètres dès qu'OSO existe (`hasOso`). C'est un changement de carte visible,
   à recetter.

---

## 8. Contrat canonique proposé

### 8.1 Postes et dénominateurs (tous grains)

Un seul calcul raster produit, pour chaque **périmètre** (commune, arrondissement, secteur), des **comptes de pixels
entiers** :

| Compte | Classes OSO 2023 | Rôle |
|---|---|---|
| `urbanise` | 1-4 | terre |
| `cultures_annuelles` | 5-12 | terre |
| `prairies` | 13 | terre, poste **toujours distinct** (§ 8.2) |
| `vergers_vignes` | 14-15 | terre |
| `forets` | 16-17 | terre |
| `landes_pelouses` | 18-19 | terre |
| `mineral_dunes_glaciers` | 20-22 | terre |
| `eau` | 23 | **ni terre, ni nature** |
| `autres` | code « Autres », s'il existe dans le raster | non classé, compté — *remplacé le 10/11 par `serres` (classe 24, terre), § 27* |
| `non_classe` | 0, 255, hors emprise | non classé, compté — *remplacé le 10/11 par `non_mesure` (valeur 0 ; 255 absent), § 27* |
| `surface_contour` | m² du contour (Lambert-93) | référence de couverture |

Dénominateurs, toujours nommés : `terres` = somme des sept postes terrestres ; `cartographiee` = terres + eau ;
`couverture` = cartographiée / surface du contour.

Mesures publiées (arrondies au dixième **une seule fois**, depuis les comptes, jamais d'un pourcentage arrondi) :

| Mesure | Définition | Unité |
|---|---|---|
| `naturel_terrestre` | (forêts + landes-pelouses + minéral-dunes-glaciers [+ prairies selon § 8.2]) / terres | % des terres |
| `eau` | eau / cartographiée | % de la surface cartographiée |
| `agricole` | (cultures + vergers-vignes [+ prairies selon § 8.2]) / terres | % des terres |
| `urbanise` | urbanisé / terres | % des terres |
| `foret` | forêts / terres | % des terres (Projet : changement de dénominateur, § 9) |
| `couverture` | cartographiée / contour | % du contour, exposée quand < 99 % |

Chaque fait porte : `source` (producteur THEIA / CES OSO, CESBIO ; jeu « OSO 2023 raster 10 m » ; DOI ; somme de
contrôle de l'archive), `edition: "2023"`, `scale` (`commune` | `arrondissement` | `secteur`), `denominateur`,
`couverture`, `methode` (version, p. ex. `oso-comptes@1`, `oso-secteur@1`), `limites` (précision de classification non
publiée pour 2023, confusion entre classes urbaines, couvert observé ≠ OCS GE réglementaire), et `statut` (`ok` |
`absent` | `couverture_insuffisante`). **Absent ≠ zéro** : un périmètre sans pixel ou sous un seuil de couverture
(proposé : 90 %) n'a ni part ni catégorie.

### 8.2 Arbitrage de doctrine préalable : les prairies

OSO range la classe 13 (prairies) dans la **terre agricole** (culture pérenne). La doctrine V1 de futur•e (« perçu
comme naturel ») la compte dans les espaces naturels. Médiane : 19,6 % des terres d'une commune (p90 49 %). Les
reclasser changerait la catégorie Territoire de **13 472 communes** (dont 10 928 de « Forte présence naturelle » à
« À dominante agricole »), et déplacerait fortement le score « Espaces naturels ».

Proposition : **ne pas changer la doctrine dans FUT-182** (un changement à la fois, mesurable). En revanche, le
contrat expose `prairies` comme poste distinct, et chaque définition le dit (« forêts, prairies, landes… ») : c'est
déjà le cas sur Territoire. La décision reste au porteur, en ticket séparé.

### 8.3 Grains et clés de faits

| Grain | Clé proposée | Ce qu'elle dit | Ce qu'elle ne dit jamais |
|---|---|---|---|
| Commune | `land.*` (existant) | les terres de la commune | l'entourage, une adresse |
| Arrondissement PLM | `land.*`, `scale: "arrondissement"` | les terres de l'arrondissement | la commune entière |
| Secteur | `land.natural_share_sector` (remplace `natural_share_15km`, `scale: "sector"`) | méthode nommée (§ 5), communes ou surface retenues, `n_communes`, `isolee: true` si seule | « rayon exact » sauf si C1 |
| Adresse | — | non mesuré | — |
| ADEME | `land.forest_ademe` (inchangé) | boisement ADEME, définition non documentée | une valeur OSO |

---

## 9. Caches, empreintes, dossiers figés

Lecture seule de la base de production, le 10/11/2026 (agrégats) :

| Objet | Volume | Versions |
|---|---|---|
| `territory_facts_snapshot` | 34 snapshots, 16 communes (30/09 → 04/11) | **tous `territoire-facts@1`** : aucune visite depuis FUT-175 (`@2`) |
| Snapshots portant le trait « entourées d'espaces naturels » | **0** | — |
| `territory_synthesis` | 45 (33 au contrat `@4`) | aucune `@5` à `@7` |
| `decision_artifact` prêts | 80 (engine-1 : 47 ; engine-2 : 1 ; engine-4 : 8 ; engine-5 : 1 ; engine-6 : 2 ; engine-7 : 21) + 16 en échec | — |
| Artefacts portant un fait nature (mismatch, alignment) | **1** (engine-1, 1 commune) | figé, à conserver |
| Artefacts portant la vérification boisement 70 % | **0** | — |

Mécanique (vérifiée dans le code) :
- **Empreinte Territoire** (`facts/contract.ts` `hashableContent`) : elle couvre tous les faits, même exclus de la
  synthèse. Changer `radius_pct`, la limite du fait 15 km ou le trait renouvelle l'empreinte de toutes les communes
  OSO, puis la synthèse à la visite suivante (clé = empreinte + horizon + contrat).
- **Coût réel** : au plus 16 communes × 3 horizons × ≤ 2 appels, comme pour FUT-175, et **une seule fois si FUT-182
  passe avant leur prochaine visite** (elles changent déjà d'empreinte avec `@2`). Les 1 880 communes du trait ne
  coûtent rien tant qu'elles n'ont pas de snapshot.
- **Rangs Projet** : nouvelles bandes = nouvelle identité `mismatch-dist-AAAA-MM-JJ-nature` et une ligne ajoutée à
  `DISTRIBUTIONS_PUBLIEES` (registre en ajout seul) ; l'artefact engine-1 garde la sienne.
- **Moteur** : passer le boisement 70 % au dénominateur des terres change ce que le moteur CONCLUT pour 84 communes
  (77 sans arrondi), donc `engine-9`, et contextualisation des dossiers antérieurs (doctrine `decision-artifact.ts`).
  Sans adresse vendue sur ces communes aujourd'hui (0 artefact), le risque porte sur les dossiers futurs.
- **Où vivre, /qna, accueil** : pas de cache persistant (flux, `no-store`). Effet immédiat au déploiement.
- **Gels** : `fut175/177/179-lignes-admises.json` et les empreintes de `fut147-non-regression` doivent être mis à jour
  sciemment, dans le même lot.

---

## 10. Matrice des impacts

Colonnes : **Eau** = retrait de l'eau ; **Géo** = passage à C1 (B si C1 n'est pas retenu) ; **PLM** = 48 périmètres
calculés ; **Texte** = libellé, limite ou unité à réécrire ; **Version** = ce qui doit changer d'identité ;
**Figé** = ce qui ne doit jamais être réécrit.

| Surface | Eau | Géo | PLM | Texte | Version | Figé |
|---|---|---|---|---|---|---|
| Territoire `land.composition`, `water_share`, `natural_share`, `category` | déjà fait (FUT-175) | — | **oui** (48 nouvelles valeurs) | source « OSO · ADEME » → « OSO » | `territoire-facts@3` | snapshots `@1` conservés (orphelins) |
| Territoire `land.natural_share_15km` | **oui** | **oui** | voisines PLM | clé, `scale`, unité, limite (« rayon » seulement si C1) | `@3`, empreinte de toutes les communes OSO | idem |
| Territoire `place.distinctive_trait` | 10 communes | 1 (B) ; 113 franchissements du seuil 88 (C1, approché) | — | libellé « entourées » → libellé de la mesure retenue | `@3` | idem |
| Territoire, carte d'identité | lecture du snapshot | idem | **oui** | phrase du secteur | — | — |
| Territoire, synthèse | inchangée (15 km exclu) | — | **oui** (composition PLM) | — | `territoire-synthese@8` si la projection change (PLM) | synthèses `@1`-`@7` conservées |
| Territoire, repli ADEME | — | — | **disparaît pour 48 périmètres** | — | — | — |
| Où vivre, score « Espaces naturels » (tri) | ~10 100 scores | 17 263 (C1) / 826 (B) | arrondissements hors univers (§ 7.3) | — | — | — |
| Où vivre, paliers, raisons, compromis, signature, point fort | 335 / 202 / 233 / 110 / 61 | 561 paliers (C1) | — | textes FUT-178 transitoires (« ou d'eau », « secteur ») à réécrire ; « au plus près de la nature » à revoir | — | — |
| Où vivre, catégories rurales et cartes d'accueil | 140 agricoles, 135 forestières | — | — | carte « Nature à… » : source « OSM / IGN » fausse | — | — |
| /qna | 311 niveaux | 1 sur 3 du palier (C1) | — | `espaces_naturels_secteur` : retirer « et aussi l'eau » | — | — |
| AskFuture | — | — | — | nommer l'ADEME ou passer à OSO (D1) | — | — |
| Projet, rangs (mismatch / alignment) | 248 verdicts | 442 (C1) / 13 (B) | — | preuve `grain: "commune"` → `secteur` ; libellés « (eau comprise) » à retirer | nouvelle identité `mismatch-dist-…-nature`, `engine-9` | artefacts engine-1 à 8 |
| Projet, boisement 70 % | +84 (77) | — | 48 périmètres (avec adresse) | « du territoire communal » → « de ses terres » ; « 10 % » recalculé | `engine-9` | idem |
| Dossiers vendus | — | — | — | contextualisation (comme FUT-127) | — | **1 artefact à fait nature, 0 à boisement : inchangés** |
| Index (`comparateur-index.json.gz`) | `nature.*` régénéré | idem | +45 entrées `nature` | `meta` : source, édition, méthode | sommes de contrôle | index antérieur dans l'historique git |

---

## 11. Recommandation technique et coûts

### 11.1 Recommandation

1. **Retirer l'eau partout** (secteur, score, forêt, catégories rurales), depuis des **comptes de pixels**, jamais
   depuis un pourcentage arrondi. C'est l'effet dominant, et c'est la seule incohérence de définition qui subsiste
   entre Territoire et le reste.
2. **Méthode C1** (disque de 15 km autour du point de référence) pour le secteur. Elle supprime les omissions, donne
   un entourage à Arles et aux Saintes-Maries, et rend vraie la promesse « 15 km ». Le libellé dit « autour du centre
   de la commune » ; le point de référence est documenté. L'Île-d'Yeu garde un drapeau `isolee`.
   *Repli* si le raster ne peut pas être obtenu rapidement : **B** (une constante), avec le mot « secteur », jamais
   « rayon ».
3. **Écarter C2** : trop de bouleversements (1 008 verdicts, 137 scores à ± 10), une mesure difficile à dire, et la
   dilution des grandes communes.
4. **PLM dans la même passe**, univers des rangs inchangé (§ 7.3).
5. **Ne pas changer la doctrine des prairies** dans ce lot, mais l'exposer (§ 8.2).
6. **Un seul changement d'empreinte et de version** pour tout le lot (`territoire-facts@3`, identité de rang
   `nature`, `engine-9`), coordonné avec FUT-183 s'il touche le même registre.

### 11.2 Coûts estimés

| Poste | Estimation | Fondement |
|---|---|---|
| Espace disque | 20 Go libres pendant le calcul, ~1-2 Go conservés (grille agrégée, comptes) | archive 5,6 Go + extraction |
| Téléchargement | 5,6 Go, une fois ; vérification MD5 | Recherche Data Gouv |
| Comptes communaux + 48 PLM (toutes valeurs 0-255) | ~10 min | `populate-nature.py` : ~6 min pour le zonal actuel |
| Pré-agrégation 200 m (9 postes) | 27,5 M cellules, ~1 Go en float32, une passe sur 5,5 milliards de pixels : ~15-30 min | calcul |
| C1 (convolution du disque, 17 671 cellules à 200 m) | quelques minutes (FFT) | calcul |
| Développement, tests, alignement des surfaces | 6 à 9 jours-personne (B1 : 3-4 ; B2 : 3-5) | inventaire § 2 |
| Appels modèle | ≤ 96 (16 communes × 3 horizons × 2), 0 si FUT-182 passe avant leur prochaine visite | § 9 |
| Stockage distant, base | aucun (index versionné dans le dépôt, comme aujourd'hui) | — |

---

## 12. Plan de phase B

**B0 — Préalables (sans code)**
1. Décisions du porteur : méthode (C1 recommandée, B en repli) ; prairies (statu quo recommandé) ; arrondissements
   dans l'univers des rangs (non recommandé) ; dénominateur du boisement 70 % (terres recommandé) ; licence (Etalab
   avec attribution, ou validation ODbL).
2. Libérer 20 Go, ou utiliser un disque externe ou une machine jetable (aucun raster dans le dépôt ni au runtime).

**B1 — Source et comptes (offline)**
3. Télécharger `OSO_20230101_RASTER.tar.gz`, vérifier le MD5, lister le contenu, lire les métadonnées (CRS, taille de
   pixel, table de couleurs, valeurs présentes). Établir le code « Autres » et les no-data **sur le raster**.
4. Preuve d'identité : recalculer `tot_px` / `nat_px` des 34 743 communes avec les contours du cache. Le résultat doit
   être **identique au cache** (empreinte `2a988102…`). Sinon, arrêt et explication.
5. Nouveau script versionné (`scripts/oso/`) : comptes de pixels par valeur (0-255) pour 34 743 communes + 48 PLM,
   couverture, sommes de contrôle des entrées (archive, contours, millésime COG), sortie compacte versionnée.

**B2 — Secteur**
6. Grille agrégée à 200 m (ou 100 m), C1 par convolution, avec la part du disque non mesurée (mer, étranger, trous).
   Contrôle croisé sur 50 communes par un masque raster exact au disque.
7. Score, `rankBands` (nouvelle identité), distributions publiées (ligne ajoutée).

**B3 — Alignement des surfaces** (une seule PR après la contre-revue des chiffres)
8. Index : `nature` v2 (comptes ou parts des terres, `eau`, `couverture`, `secteur`, `methode`), en gardant les clés
   lues par le code, ou en migrant chaque lecteur dans le même lot.
9. Territoire (`@3`), Où vivre (textes, catégories rurales sur les terres), /qna, Projet (`engine-9`, grain des
   preuves, boisement), AskFuture (source nommée), accueil (source de la carte « Nature à… »).
10. Réécrire les textes transitoires de FUT-178 à partir du nouveau contrat, sans en réutiliser un qui décrit l'ancien.

**B4 — Tests et recette**
11. Tests déterministes nationaux : distribution des parts, somme des postes = 100 % des pixels, couverture, aucune
    valeur pour un périmètre absent, univers des rangs = 34 743.
12. Cas : Sète, Palavas, Pérols, Marignane, Batz-sur-Mer, Rochefort, Châtelaillon, Annecy, Paimbœuf, Saintes-Maries,
    Arles, L'Île-d'Yeu, Bony, Janville, Corte, Bordeaux, Lille, Fontainebleau, Granville, Conjux, les 24 cas de la
    fixture, les 48 PLM (Paris = Σ 20 arrondissements au pixel près), Boulogne et Montreuil (part non mesurée), et
    les communes forêt entre 69,5 et 70,5 %.
13. Assertions de **texte** (règle AGENTS.md) : aucune surface ne dit « rayon » si la méthode n'est pas C1 ; aucune
    ne dit « ou d'eau » après le retrait de l'eau ; « 10 % les plus boisées » recalculé ; aucun libellé « entourées »
    pour une commune `isolee`.
14. Dossiers figés : relire un artefact engine-1 à 8 à l'identique (snapshot de test), contextualisation engine-9.

---

## 13. Risques

| Risque | Effet | Parade |
|---|---|---|
| Le raster obtenu n'est pas celui du cache (autre version, retraitement) | tous les chiffres bougent sans cause visible | preuve d'identité (B1.4), arrêt sinon |
| Code « Autres » ou no-data mal identifié | dénominateur faux, absent lu comme zéro | lecture du raster, comptes 0-255 conservés |
| C approché ≠ C exact | les chiffres de ce rapport (§ 5) bougent | ce sont des ordres de grandeur ; recalcul exact en B2 |
| Point de référence d'origine inconnue | C1 dépend d'un point non documenté | documenter la source ; contrôle : point dans le contour (483 cas à 1-5 m près) |
| Bordures (étranger, mer) | disque en partie non mesuré | exposer la part non mesurée, ne pas la compter |
| Arrondissements dans l'univers des rangs | percentiles déplacés pour toutes les communes | univers figé à 34 743, testé |
| Double version des textes (FUT-178 transitoire + nouveau) | contradiction carte / dossier | réécriture dans le même lot, test de texte |
| Gels ligne à ligne (FUT-175/177/179) et empreintes FUT-147 | échecs de tests ou gel contourné | mise à jour explicite et motivée des fixtures |
| Conflit avec FUT-183 (arrondis) sur `facts.ts` | double bump de registre | ordre de fusion décidé en B0 |
| Licence ODbL | obligation de partage de la base dérivée | décision B0 |
| Disque plein en cours de calcul | arrêt, fichiers partiels | 20 Go libres vérifiés avant de lancer ; sorties durables hors `/private/tmp` |

---

## 14. Conditions de GO

GO pour la phase B si et seulement si :
1. la contre-revue indépendante confirme les chiffres reproduits (§ 4) et les ordres de grandeur (§ 5-6) ;
2. le porteur tranche les cinq décisions B0 ;
3. 20 Go sont disponibles hors du dépôt, et le raster est vérifié (MD5, puis **identité avec le cache**, B1.4) ;
4. le lot reste offline jusqu'à la PR : aucune écriture en base ni en stockage distant, aucun appel modèle proactif ;
5. la PR B3 passe sa propre contre-revue avant fusion, avec les tests de texte du § 12.13.

**Verdict de cette phase A : GO conditionnel.** Les écarts mesurés justifient le recalcul : l'eau surtout,
la promesse « 15 km » ensuite, et les 48 périmètres PLM et leurs 387 voisines. Le coût est modeste et les dossiers
historiques ne sont pas exposés. Les conditions 2 et 3 ne sont pas remplies à ce jour : tant qu'elles ne le sont pas,
la phase B ne démarre pas.

---

## 15. Ce qui reste incertain (09/11 ; état à jour au § 28)

*Levés le 10/11 par le raster : code de la classe 24 (serres) ; répartition du déficit de couverture (serres, pas de
no-data) ; contenu de l'archive ; précision 2023 ; origine du point de référence. Restent ouverts : les comptes exacts
hors eau (B1), l'écart exact B → C (B2), les 48 PLM (B1), la part hors France des disques (B2) et la licence.*

| Point | Pourquoi | Comment le lever |
|---|---|---|
| Code et contenu de la classe « Autres » (24 classes annoncées, 23 sur le schéma) | sources contradictoires, page produit 2023 en 404 | métadonnées et valeurs du raster |
| Répartition du déficit de couverture (0,04 % national, jusqu'à 15 % localement) entre no-data et « Autres » | raster absent | comptes 0-255 |
| Comptes exacts hors eau (score à ± 1, forêt 77 ou 84) | part d'eau arrondie au dixième dans le cache | comptes de pixels |
| Écart exact B → C1 | approximation par surfaces homogènes | calcul raster |
| Composition OSO des 48 périmètres PLM, et effet sur les 387 voisines | jamais calculée | calcul raster |
| Part des disques hors contours français (mer, étranger) | non calculée ici | B2.6 |
| Précision de classification de l'édition 2023 | seule l'évaluation de 2016 est publiée | demander au CES OSO, ou citer la limite |
| Contenu exact de l'archive (couches de confiance, de validité) | liste disponible seulement après téléchargement | B1.3 |
| Origine du point de référence DRIAS | non documentée dans le dépôt | documentation DRIAS ou remplacement par un point officiel (chef-lieu) en ticket séparé |
| Lecture juridique ODbL / Etalab | deux sources officielles divergent | décision B0 |
| Arrondis de FUT-183 (238 / 252) | hors périmètre | FUT-183 |


---

# Partie II — Reprise après les arbitrages du porteur (10/11/2026)

Les arbitrages B0 du porteur, la libération d'espace disque (36 Gio) et l'autorisation de télécharger ont permis
d'obtenir le raster officiel. Il a servi uniquement à **inspecter la source** et à **vérifier des échantillons** :
aucun recalcul national des données de l'application, aucun changement de score, de seuil ni de catégorie, aucune
écriture distante. Scripts ajoutés : `point_reference.py`, `inspecter_raster.py`, `point_echantillon_raster.py`.

Stockage : `~/Documents/futuree-oso/` (hors dépôt, hors dossiers temporaires) ; archive conservée (5,6 Go), seuls la
classification (`OCS_2023.tif`, 773 Mo) et les métadonnées ont été extraits.

## 16. Les cinq arbitrages, tels qu'appliqués dans ce rapport

| | Décision du porteur | Conséquence dans ce rapport | Reste ouvert |
|---|---|---|---|
| A | C1 privilégiée, sous condition d'un point pertinent ; B en repli nommé « secteur », jamais « rayon » | § 17 : le point actuel est écarté ; recommandation **secteur habité** | validation du libellé |
| B | Prairies maintenues dans l'indicateur pour FUT-182 ; doctrine et pédagogie dans FUT-190 | § 20 : poste distinct, définition écrite, libellés exagérés recensés ; 13 472 catégories inchangées | FUT-190 |
| C | 48 périmètres PLM calculés ; arrondissements hors de l'univers des rangs ; pas de transfert de grain | § 21 : règles de calcul et contrôles | — |
| D | Forêt rapportée aux terres ; seuils sur valeurs non arrondies ; dénominateur toujours dit | § 22 : compte **exact** 3 338 communes (9,61 %) | — |
| E | Licence à sécuriser avant publication | § 19 : Etalab 2.0 chez le producteur et le distributeur ; trois ambiguïtés, une confirmation écrite à obtenir | confirmation CNES / Theia |

## 17. Le point de référence de C1

### 17.1 Ce qu'est le point actuel (exact)

| Constat | Valeur |
|---|---|
| Point de l'index = `centre` de geo.api.gouv.fr (4 décimales) | **34 743 / 34 743** |
| Distance au centre du rectangle englobant du contour | médiane **19 m**, p90 69 m, p99 237 m |
| Distance au centroïde du contour | médiane 241 m, p99 1,15 km, max 13,9 km |
| Distance à la mairie (`mairie` geo.api.gouv.fr) | médiane 821 m, p90 1,9 km, p99 3,9 km, max 14,9 km (Arles) ; > 2 km pour 2 982 communes, > 5 km pour 136 |
| Points hors du contour | 483, tous à moins de 50 m |

Le point est donc, à quelques mètres près, **le centre du rectangle qui englobe la commune**. Il n'a pas de
signification résidentielle : à Granville, il tombe à 13 km de la ville, vers l'archipel de Chausey (45 % du disque en
mer non cartographiée) ; à Hyères, entre la ville et les îles ; à Arles, en Camargue.

### 17.2 Les options

| Option | Disponibilité nationale | Ce qu'elle représente | Défaut |
|---|---|---|---|
| Point actuel (`centre` geo.api) | 34 743 | centre du rectangle englobant | géométrique, sans lien avec l'habitat ; aberrant pour les communes à îles ou en croissant |
| Centroïde du contour | calculable partout | centre de gravité de la surface | idem ; 140 centroïdes à plus de 50 m hors du contour |
| Mairie (`mairie` geo.api) | 34 743 (8 à plus de 50 m hors contour) | chef-lieu administratif | un seul bourg ; les communes nouvelles et multipolaires sont mal représentées (Arles, Sèvremoine, Chemillé-en-Anjou) ; source à documenter |
| Centre bâti (barycentre des pixels OSO bâtis 1-2) | calculable partout, **même raster** | centre de gravité de l'habitat | un seul point ; pour une commune à plusieurs bourgs, il peut tomber entre eux |
| **Secteur habité** (moyenne, sur les cellules bâties de la commune, de la composition dans 15 km autour de chacune) | calculable partout, **même raster** | **l'environnement moyen autour des lieux où l'on habite** dans la commune | un peu plus long à dire ; poids = surface bâtie, pas population (Filosofi 200 m serait plus juste mais ajoute une source, un millésime et des carreaux confidentiels) |

### 17.3 Mesure sur le raster réel (24 cas extrêmes, part naturelle des terres dans 15 km)

| Commune | Point actuel | Mairie | Centroïde | Centre bâti | **Secteur habité** (p10-p90 des lieux bâtis) |
|---|---|---|---|---|---|
| Arles | 54,4 | 44,2 | 55,3 | 49,6 | **49,6** (39,4-62,8) |
| Saintes-Maries-de-la-Mer | 55,4 | 68,1 | 54,5 | 56,2 | **57,7** (48,6-65,4) |
| Granville | 43,2 (45 % du disque non mesuré) | 59,3 | 59,6 | 59,5 | **59,6** |
| Hyères | 72,9 | 60,9 | 66,1 | 61,6 | **61,2** (55,4-68,6) |
| Sète | 43,7 | 52,0 | 45,5 | 50,3 | **50,4** (37,1-55,5) |
| Lège-Cap-Ferret | 84,7 | 91,2 | 87,3 | 84,0 | **86,0** (79,0-91,3) |
| La Teste-de-Buch | 85,8 | 82,8 | 87,0 | 85,2 | **84,8** |
| Paris | 17,6 | 17,5 | 18,0 | 18,0 | **19,2** (16,1-24,1) |
| Marseille | 62,6 | 64,0 | 64,0 | 64,6 | **62,4** (57,1-65,4) |
| Lyon | 38,1 | 37,9 | 38,0 | 37,5 | **37,6** |
| Fontainebleau, Lille, Bordeaux, Annecy, Chamonix, Corte, Bony, Châtelaillon, Briançon, Biscarrosse, Gardanne, Cherbourg-en-Cotentin, Chemillé-en-Anjou | écarts ≤ 1,5 point entre toutes les options | | | | |
| L'Île-d'Yeu | 71,0 (68 % du disque en mer non cartographiée) | 71,0 | 71,0 | 71,0 | **71,0** : l'île seule |

Au niveau national (C1 approché sur contours, `point_reference.py`), remplacer le point actuel par la mairie change
15 537 scores, dont **27 de 10 points ou plus**, et **425 verdicts de rang** : le choix du point pèse autant que le
passage de B à C1 (442). Ce n'est donc pas un détail technique.

### 17.4 Recommandation

**Secteur habité**, calculé sur le même raster : pour chaque cellule de 100 m de la commune qui contient du bâti
(classes 1-2), la composition des sols dans un disque de 15 km ; puis la moyenne, pondérée par la surface bâtie de la
cellule. On publie aussi la dispersion (p10-p90), qui dit au lecteur quand la commune contient des situations très
différentes (Arles : de 39 à 63 %).

Pourquoi elle, du point de vue du lecteur : la question posée est « quels sols entourent l'endroit où l'on vit dans
cette commune ? ». Le secteur habité y répond sans choisir arbitrairement un bourg, il ne tombe jamais en mer ni en
Camargue vide, et il se confond avec le centre bâti dans les communes à un seul bourg (l'immense majorité). Il
n'ajoute aucune source.

Repli, dans cet ordre : **centre bâti** (un point, même raster, plus simple à dire) ; **B** (communes entières, mot
« secteur ») si le calcul raster devait être différé. Le point actuel et la mairie sont déconseillés.

Libellé proposé, sans promesse d'accès : « Dans un rayon de 15 km autour des zones bâties de la commune, X % des terres
sont couvertes de forêts, prairies, landes et autres milieux naturels (eau à part). Cette part décrit les sols ; elle
ne dit ni la distance à un espace naturel, ni son accessibilité, ni la qualité des milieux. »

## 18. Ce que le raster a établi (téléchargé et vérifié le 10/11/2026)

### 18.1 Fichier et en-tête

| Point | Constat |
|---|---|
| Archive | `OSO_20230101_RASTER.tar.gz`, 5 624 505 462 octets, **MD5 `bc6deea29081876a9be88c76b92d59ec` conforme** à celui de l'entrepôt ; téléchargée en 136 s |
| Contenu | `DATA/OCS_2023.tif` (classification, 773 Mo), `DATA/Confidence_OCS_2023.tif` (4,5 Go), `DATA/Validity_OCS_2023.tif` (662 Mo), `PUBLIC_METADATA/OSO_20230101_RASTER_V1-0_MTD_ALL.xml` |
| `OCS_2023.tif` | sha256 `331adf56…f8f90c` ; GeoTIFF uint8, LZW, en bandes d'une ligne ; **EPSG:2154 (Lambert-93), pas de 10 m**, 126 813 × 119 159 pixels ; **aucune valeur no-data déclarée** ; palette 0-30 et 255 |
| Métadonnées | produit `OSO_20230101_RASTER_V1-0`, niveau L3B-OSO, produit le 20/09/2024 par MUSCATE/THEIA. **Elles annoncent à tort « WGS 84 / UTM zone 15N »** : le fichier est bien en Lambert-93 (à signaler au producteur, sans effet pour nous) |
| Licence dans le fichier ou les métadonnées | **aucune** |

### 18.2 Nomenclature et valeurs réellement présentes

Histogramme national : classes 1-23 sur 581 681 km² ; **classe 24 sur 226,4 km²** ; valeur 0 sur 929 184 km²
(hors emprise) ; **aucune valeur 255, aucune autre valeur**.

**La 24e classe existe : ce sont les serres** (métadonnées officielles, `classe="24"`, « serres »). Ce n'est pas
« Autres ». `populate-nature.py` ne lit que 1-23 : il a retiré les serres du numérateur et du dénominateur, sans
trace. C'est ce qui explique les grappes du § 3.2 (Châteaurenard, Rognonas, Eyragues, Saint-Michel-en-l'Herm, Pays de
Caux) : il ne s'agit **pas** de pixels non classés. Dans l'échantillon de 1 357 communes, les contours ne contiennent
quasiment aucun pixel 0 (11 communes, au plus 122 pixels, soit 1,2 ha) : sous un contour communal, la couverture est
complète, serres comprises.

Réserve sur les serres : leur F-score officiel est de 0,27 (rappel 0,17). Héberville (76), 15 % de « serres » dans le
Pays de Caux, est peu plausible ; Rognonas ou Châteaurenard le sont. Le poste doit exister, mais il est fragile.

### 18.3 Précision publiée pour 2023 (métadonnées officielles)

Précision globale **0,874**, kappa **0,847**. F-scores utiles à futur•e :

| Classe | F-score | Lecture |
|---|---|---|
| Forêts de feuillus / de conifères | 0,94 / 0,91 | fiables |
| Eau | 0,86 (rappel 0,78) | l'eau est plutôt sous-détectée |
| Bâti diffus | 0,81 | correct |
| **Bâti dense** | **0,22** | confondu avec le diffus : jamais distinguer les deux |
| **Zones industrielles et commerciales** | **0,12** | quasi inutilisable seul |
| Routes | 0,65 | — |
| **Prairies** | **0,73** | confondues avec céréales et maïs |
| Pelouses / landes / surfaces minérales | 0,62 / 0,60 / 0,59 | moyennes |
| Plages et dunes | 0,34 | fragiles |
| Serres | 0,27 | fragiles |

Conséquences : regrouper l'urbanisé (1-4), comme le recommande déjà le Cerema ; ne pas afficher de chiffre au dixième
comme s'il était précis à ce niveau, et écrire la précision dans les limites ; l'indicateur naturel s'appuie en
grande partie sur la forêt (fiable) et les prairies (moyenne). Cette précision est une évaluation **nationale** ; la
précision par commune n'est pas publiée. La couche `Confidence_OCS_2023.tif` (non extraite) donne, par pixel, la part
des votes de la classe retenue : elle permettrait un indicateur de confiance local en phase B, si on le juge utile.

### 18.4 Preuve d'identité avec le cache

Sur **1 357 communes** (24 cas témoins, les communes à couverture faible, 200 tirées au hasard à graine fixe, et les
1 140 communes dont la forêt des terres est estimée entre 67 et 73 %), les comptes recalculés avec la méthode de
`populate-nature.py` sont **identiques au pixel près** au cache (`tot_px` et `nat_px`) : **1 357 / 1 357**. Le raster
téléchargé est donc celui qui a produit l'index. La preuve exhaustive (34 743 communes) reste une étape de B1.

### 18.5 Ce que le raster ne change pas

Toutes les mesures « eau comprise » de la partie I sont exactes. Les estimations « hors eau » restent des estimations à
± 1 point de score (§ 6), jusqu'au recalcul B1. Les chiffres de C restent des ordres de grandeur.

## 19. Licence

### 19.1 Ce que disent les sources, du producteur au réutilisateur

| Source | Statut | Ce qu'elle dit |
|---|---|---|
| Fiche produit GEODES « OSO raster L3B » (CNES, distributeur officiel) | officielle | « Licence : **Etalab 2.0** » |
| Page projet Theia (pôle producteur) | officielle | « Licence **Etalab 2.0** » |
| Mentions légales du site GEODES | officielle, **site entier** | reproduction, extraction et œuvres dérivées « formellement et strictement interdits » hors copie privée ou éducative ; mention « © CNES – Tous droits réservés » |
| Catalogue STAC GEODES (`THEIA_OSO_RASTER_L3B`) | officiel, machine | **aucun champ de licence** |
| Fichier et métadonnées XML du produit | officiels | **aucune licence** |
| Portail de l'artificialisation (Cerema, État) | officiel, non producteur | « Licence Open Database, **compatible** avec la licence Etalab » |
| Recherche Data Gouv (INRAE, copie utilisée) | **non officiel** | redistribue en Etalab 2.0, en citant l'ODbL d'origine |
| Pages OSO du CESBIO | — | gabarits vides, aucune licence |
| Texte de la Licence Ouverte 2.0 | officiel | compatible avec l'OGL, CC-BY et ODC-BY ; **l'ODbL n'est pas citée** |

Lecture : **le producteur et le distributeur officiels indiquent Etalab 2.0** pour ce produit. La mention ODbL vient
du Cerema, qui n'est pas producteur, et l'affirmation de compatibilité n'est pas étayée par le texte de la Licence
Ouverte. Le fichier que nous utilisons est une copie de l'entrepôt de recherche ; il ne peut pas changer de licence :
c'est la licence du producteur qui s'applique au contenu.

### 19.2 Raster et données agrégées

- **Sous Etalab 2.0** (lecture la mieux fondée) : réutilisation libre, y compris commerciale, des « informations
  dérivées » (nos parts par commune et par secteur, l'index). Obligation : mentionner la source (au minimum le nom du
  concédant) et la date de dernière mise à jour, sans suggérer d'aval officiel. Proposition :
  « Occupation des sols : OSO 2023, THEIA / CES OSO (CESBIO), CNES-GEODES, mise à jour du 20/09/2024, Licence Ouverte 2.0 ;
  traitements futur•e ». Aucune obligation de partage à l'identique.
- **Sous ODbL** (si elle s'appliquait) : afficher des parts sur le site est une « œuvre produite » (mention de la
  base et de la licence obligatoire, pas de partage). Mais l'index par commune est une **base dérivée**, et
  **le dépôt `futuree-app/future-e` est public** : l'index `data/comparateur-index.json.gz` est donc déjà diffusé
  publiquement. Sous ODbL, il devrait l'être sous ODbL (ou une licence compatible), avec une offre de la base dérivée
  (art. 4.4 et 4.6).
- **Le raster brut** : nous ne le redistribuons pas (hors dépôt, hors runtime). Rien à faire.

### 19.3 Ambiguïtés et confirmation à obtenir avant publication

1. Divergence Etalab 2.0 (producteur, distributeur) / ODbL (Cerema).
2. Mentions légales du site GEODES, plus restrictives que la licence de la fiche produit. Lecture habituelle : la
   licence propre d'un produit prime sur les conditions générales du site, mais ce n'est écrit nulle part.
3. Aucune licence dans le fichier ni dans le catalogue machine.

Confirmation à obtenir : **un courriel du CNES / Theia** (adresse donnée par Theia pour l'accès aux données :
`expgdh@cnes.fr`) confirmant que les cartes OSO 2023 sont sous Licence Ouverte 2.0, que les mentions générales du
site GEODES ne s'appliquent pas aux produits sous licence ouverte, et la formule d'attribution attendue. Tant qu'elle
manque : n'ajouter aucune nouvelle valeur OSO publiée (la phase B peut calculer, pas publier), et préparer la mention
d'attribution. Je ne suis pas juriste ; ce qui précède est une lecture des textes, à faire valider si le doute
persiste.

> **Décision du 10/11/2026 (§ 31, E) : ce paragraphe ne bloque plus.** Le porteur publie sous la Licence Ouverte 2.0
> affichée par Theia et GEODES. La confirmation écrite n'est un prérequis ni pour B1, B2 ou B3, ni pour la mise en
> production. La demande au CNES peut être poursuivie ; elle ne suspend rien. Ce rapport ne dit nulle part qu'une
> confirmation juridique a été obtenue : elle ne l'a pas été.

## 20. Prairies et libellés (arbitrage B)

Le contrat garde `prairies` comme poste distinct (§ 27) et chaque définition le nomme. L'indicateur « espaces
naturels » de futur•e est une **convention** : il compte les prairies, que le producteur range dans l'agricole
(culture pérenne), et que sa propre évaluation confond avec les céréales et le maïs (F-score 0,73). Aucune des 13 472
catégories concernées ne change dans FUT-182.

Libellés qui affirment plus que la donnée (recensement du code au 10/11/2026) :

| Lieu | Libellé | Ce qui est excessif | Gravité | Traitement proposé |
|---|---|---|---|---|
| `comparateur-vie.ts:1190`, promesse de signature | « Pour vivre **au plus près de la nature**. » | proximité et accès, non mesurés ; peut viser une commune dont le secteur est surtout de l'eau | haute | lot L0 (§ 24) : « Pour un secteur où les espaces naturels occupent une large part des terres. » ou retrait |
| `comparateur-vie.ts:1188` | « Pour un cadre rural **préservé**, loin de l'agitation. » | « préservé » suggère une protection ou une qualité écologique ; déclenché par nature **ou** calme | haute | lot L0 : retirer « préservé » |
| `accueil/recits.ts:413-417`, carte « Nature à… » | « espaces agricoles et nature **rythment le quotidien** » ; « façonnent le cadre de vie » ; source « OSM / IGN » | effet sur la vie quotidienne non mesuré ; source fausse | haute (source) | lot L0 (§ 24) |
| `comparateur-labels.ts:64`, aide de la priorité | « Forêts, prairies et milieux naturels **autour**. » | tait l'eau, encore comptée ; « autour » flou | moyenne | B3 (dépend de la méthode) |
| `comparateur-labels.ts:31` | « des espaces naturels **à proximité** » | formule de la priorité du lecteur : acceptable si la mesure n'est pas présentée comme une distance | faible | FUT-190 |
| `parse/route.ts:335`, interprétation de la demande | « la campagne », « du vert » → critère `nature` | un lecteur qui cherche « la campagne » est classé sur un indicateur qui **exclut les cultures** : la Beauce y est au plus bas | haute (produit) | FUT-190 : la campagne n'est pas la nature |
| `trait-distinctif.ts:42` | « les plus **entourées** d'espaces naturels » | communes seules, eau comprise | moyenne (non affiché) | B3 |
| `territoire/facts.ts:109` | « **Forte présence naturelle** » | correct si la définition (prairies comprises) est dite ; elle l'est sur la carte et dans le contrat de synthèse | faible | FUT-190 (pédagogie) |
| `mismatch-facts.ts:105` | « la proximité des espaces naturels » (priorité du lecteur) | reprend la demande, pas la mesure ; la limitation suit | faible | B3 |
| Libellés transitoires FUT-178 (« ou d'eau », « secteur », « eau comprise ») | — | justes aujourd'hui, faux après retrait de l'eau | — | B3, réécriture obligatoire |

Hors les cas du tableau, aucune surface ne tire de la mesure OSO une affirmation de biodiversité ou d'accès ; la synthèse Territoire est gardée par les contrôles de FUT-177 (`synthesis-checks.ts`).

## 21. Paris, Lyon, Marseille (arbitrage C)

Les règles du § 7.3 sont confirmées, avec trois précisions :
1. **Comptes au pixel** : la commune entière et ses arrondissements sont mesurés sur leurs contours ; le test
   `Σ arrondissements = commune` se fait au pixel près (la partition géométrique est exacte, § 7.1).
2. **Secteurs** : le secteur habité se calcule sur la grille de pixels, jamais en additionnant des valeurs communales ;
   une commune voisine de Paris compte donc les pixels de Paris une seule fois, quel que soit le découpage.
3. **Grain affiché** : `scale: "arrondissement"` pour les 45, `commune` pour les 3. Aucune part de Paris attribuée au
   11e, aucune part du 11e présentée comme celle de Paris. Univers des rangs inchangé (34 743 communes) : les 48
   périmètres n'ont ni `score` ni bande `nature`, et un test l'impose.

Valeurs de contrôle (raster, part naturelle des terres dans 15 km autour des zones bâties) : Paris 19,2 %, Lyon
37,6 %, Marseille 62,4 % (de 57 à 65 % selon les lieux bâtis). Les compositions communales des 48 périmètres ne sont pas
calculées dans cette phase.

## 22. Forêt et seuil de 70 % (arbitrage D)

Compte **exact** (raster pour les 1 140 communes entre 67 et 73 %, estimation pour les autres, dont l'erreur mesurée
dans la fenêtre ne dépasse pas 0,09 point) :

| | Règle actuelle (forêt arrondie au dixième, % du contour, eau comprise) | Règle validée (forêt / terres, avant arrondi) |
|---|---|---|
| Communes ≥ 70 % | 3 258 (9,38 %) | **3 338 (9,61 %)** |
| Entrées / sorties | — | **+82 / −2** |

Les deux sorties (Trèves, 69,957 % ; Les Planches-près-Arbois, 69,992 %) passaient le seuil **à cause de l'arrondi**
de la règle actuelle (70,0 affiché). Huit communes changeraient de côté selon que le seuil s'applique à la valeur
arrondie ou exacte (de 69,923 à 70,027) : c'est exactement le cas que l'arbitrage D règle.

« Parmi les 10 % de communes les plus boisées » reste **vraie** : 9,61 % des communes passent le seuil. La phrase
doit être produite par le calcul (part effective ≤ 10 %), pas recopiée. Texte de la preuve : « la forêt couvre X % de
ses terres (eau exclue) ». Note de méthode : ce compte rapporte la forêt aux classes 1-23 hors eau ; avec les serres
dans les terres (contrat § 27), l'écart est négligeable pour des communes forestières, et sera rejoué en B1.

> **Corrigé le 10/11 par B1 (§ 36), compte exhaustif sur les 34 743 communes :** 3 336 communes (9,60 %), **+80 / −2**,
> serres comprises dans les terres (3 337 sans elles). Le 3 338 / +82 ci-dessus mêlait un compte exact dans la fenêtre
> 67-73 % et une estimation hors fenêtre. Les deux sorties sont les mêmes ; neuf communes (et non huit) changent de côté
> selon l'arrondi.

## 23. Couverture et données manquantes

| Situation | Constat | Traitement |
|---|---|---|
| Pixels de valeur 0 sous un contour communal | quasi nuls (11 communes de l'échantillon, ≤ 1,2 ha) | compter ; si > 1 % du contour : statut `couverture_partielle` et chiffre de couverture affiché |
| Serres (24) | 226 km² ; jusqu'à 15 % d'une commune | **compter dans les terres**, poste `serres` (rattaché aux cultures), jamais exclu |
| Disque en mer au-delà de l'emprise du raster | Île-d'Yeu 68 %, Granville au point actuel 45 %, Sète 23 % | non mesuré : ni nature ni terre ; la part est rapportée (`part_non_mesuree`) |
| Disque hors de France | le raster couvre ~33 000 km² au-delà des contours français, sans garantie de qualité hors de France | décision B0 : limiter aux pixels sous un contour communal français (recommandé, même univers que les communes) ; la part hors France devient non mesurée |
| Eau dans le disque | mesurée | toujours à part, jamais naturelle |
| Seuil d'affichage | — | une mesure dont plus de **25 %** du disque est non mesuré reste affichée avec sa part non mesurée ; au-delà de **50 %**, mention explicite « mesure partielle » (Île-d'Yeu : « l'île seule ») |
| Lecture | — | **une absence de mesure n'est jamais une absence de nature** : pas de 0, pas de classement en bas de distribution |

## 24. Corrections indépendantes du raster : lot L0

Livrable avant B1, sur `main`, avec sa propre contre-revue. Il ne touche ni l'index, ni les scores, ni les seuils.

| # | Correction | Fichiers | Version / empreinte | Tests |
|---|---|---|---|---|
| L0-1 | AskFuture : la ligne « Taux boisement (%) » dit sa source et sa limite (« ADEME, définition et millésime non documentés ; la forêt de la carte Territoire est celle d'OSO, elle ne se compare pas »), ou disparaît quand OSO existe (même doctrine que D1 sur Territoire) | `ask/system-prompt.ts` | prompt seulement ; pas de cache persistant | test de la ligne ; gel FUT-147 à vérifier |
| L0-2 | Projet : la preuve du rang « Espaces naturels » porte `grain: "secteur"` au lieu de `"commune"` (le type l'admet déjà) | `mismatch-rules.ts`, `alignment-rules.ts` | **pas de `engine-9`** : même règle, même issue, même rang (doctrine FUT-96) ; les dossiers figés gardent leur preuve | tests mismatch/alignment, relecture d'un artefact figé à l'identique |
| L0-3 | Accueil, carte « Nature à… » : source exacte par variante (commune classée « Mer » au titre de la loi Littoral ; altitude et proximité du relief de l'index ; OSO 2023 pour la variante rurale) et phrases sans effet non mesuré (« rythment le quotidien », « façonnent le cadre de vie ») | `accueil/recits.ts` | aucune ; à recetter avec FUT-50 | test de source par variante |
| L0-4 | Promesses d'Où vivre : retirer « au plus près de la nature » et « préservé » (§ 20) | `comparateur-vie.ts:1188-1190` | aucune (pas de cache) | test de texte |
| L0-5 | Carte Territoire : source de face « OSO · ADEME » → « OSO » quand la carte n'affiche que l'OSO | `QuartierClimatData.tsx` | aucune (rendu) | test de rendu |

Estimation : 1 à 1,5 jour, plus la contre-revue. Le reste (libellés « secteur », trait distinctif, limite du fait
15 km) attend B3, sinon on écrirait deux fois les mêmes textes.

## 25. FUT-183 et la prochaine montée du contrat de synthèse

FUT-183 (PR #145, fusionnée) affiche les parts au dixième ; la consigne du modèle autorise encore l'arrondi
(« 38 % pour 37,9 », `synthesis-contract.ts:353`), d'où « 45 % » possible à Rochefort sous « Occupation mixte ».

Plan : **une seule montée, `territoire-synthese@8`, dans le lot B3**, qui porte à la fois :
1. la consigne ciblée : « les parts d'occupation des sols se citent au dixième, telles qu'écrites dans le payload ;
   jamais arrondies vers un seuil de catégorie » ;
2. un contrôle déterministe dans `synthesis-checks.ts` : tout pourcentage cité à côté d'un poste OSO doit égaler une
   valeur du payload au dixième, ou être refusé ; refus spécifique d'un entier qui franchit 20, 45 ou 50 quand la
   catégorie dit l'inverse ;
3. les tests de frontière : 44,9 / 45,0 ; 49,9 / 50,0 ; 19,9 / 20,0 (Rochefort réel), y compris sur le repli ;
4. les nouveaux faits de FUT-182 (secteur habité, eau, couverture, PLM) dans la projection.

Anciennes synthèses : `@1` à `@7` restent en base (orphelines, jamais servies, clé = empreinte + contrat). Aucune
suppression. Coût : une génération par commune et horizon **à la consultation**, sous le garde de budget existant ; en
base aujourd'hui, 16 communes, au plus ~96 appels. Avec `territoire-facts@3` dans le même déploiement, il n'y a qu'une
invalidation.

## 26. Préservation des dossiers et traçabilité

| Élément | Règle |
|---|---|
| Artefacts `decision_artifact` (engine-1 à 8) | jamais réécrits ; relus à l'identique ; un test relit un artefact engine-1 contenant un fait nature |
| Moteur | `engine-9` pour le boisement aux terres (change ce que le moteur conclut pour 84 communes) et les nouvelles bandes |
| Rangs | nouvelle identité `mismatch-dist-AAAA-MM-JJ-nature`, une ligne ajoutée à `DISTRIBUTIONS_PUBLIEES` (registre en ajout seul) ; l'ancienne identité reste résoluble |
| Registre Territoire | `territoire-facts@3` ; anciens snapshots conservés |
| Index | `meta.oso` : source, sha256 de l'archive et du TIF, contours (sha256, date), méthode (`oso-comptes@1`, `oso-secteur-habite@1`), univers des rangs |
| Présentation des anciens dossiers | une note contextualise la convention de création (comme `lectureInondationAnterieure`, FUT-127) : « Ce dossier a été établi le JJ/MM/AAAA, quand la part d'espaces naturels du secteur comptait l'eau et la forêt se rapportait au contour communal. » Rien n'est recalculé. |

## 27. Contrat canonique révisé

Changements par rapport au § 8 :

1. **`serres` (classe 24)** remplace `autres` : poste terrestre, rattaché aux cultures, compté dans les terres.
2. **`non_mesure`** (valeur 0, hors emprise, hors France si B0 le décide) remplace `non_classe` : jamais dans un
   dénominateur, toujours rapporté.
3. **Secteur** : `land.natural_share_sector` devient la mesure du **secteur habité** :
   `{ valeur, p10, p90, part_non_mesuree, methode: "oso-secteur-habite@1", rayon_m: 15000, poids: "surface bâtie OSO (classes 1-2)" }` ;
   drapeau `isolee` quand le disque ne contient aucune autre commune (Île-d'Yeu).
4. **Précision** : chaque fait OSO porte la limite « classification satellitaire, précision globale 87 % (OSO 2023) ;
   bâti dense, zones d'activité, plages, serres peu fiables isolément ».
5. **Prairies** : poste distinct, inclus dans `naturel_terrestre` par convention, écrit dans la définition (« forêts,
   prairies, landes et pelouses, roche, dunes et glaciers »).
6. **Seuils** : toute comparaison à un seuil (forêt 70 %, catégories 20 / 45 / 50, rural 30 / 35) se fait sur la valeur
   calculée depuis les comptes, avant arrondi ; l'affichage arrondit au dixième (FUT-183).
7. **Licence et attribution** : champ `source.licence` et mention d'attribution, renseignés après la confirmation du
   § 19.3. *10/11 : renseignés dès B3, sans attendre (§ 31, E).*

Tout le reste du § 8 est maintenu (dénominateurs nommés, absent ≠ zéro, ADEME à part, grains).

## 28. Exact, estimé, ou raster requis

| Résultat | Statut au 10/11/2026 |
|---|---|
| Reproduction de l'index, 2 465 omissions, communes seules, fixture, 1 880 traits, 332 catégories | **exact** |
| Effets « eau comprise » (A → B) | **exact** |
| Identité point de l'index = `centre` geo.api (34 743) ; distances aux autres points | **exact** |
| Nomenclature 24 classes, serres, absence de 255, précision 2023 | **exact** (raster et métadonnées) |
| Identité raster / cache | **exact sur 1 357 communes** → *B1 : exhaustif, 34 743 / 34 743, aucun écart (§ 33)* |
| Forêt ≥ 70 % sur les terres : 3 338 (9,61 %), +82 / −2 | **exact** dans la fenêtre 67-73 %, borne d'erreur 0,09 point hors fenêtre → *B1 : 3 336 (9,60 %), +80 / −2, exhaustif (§ 36)* |
| Effets hors eau sur `radius_pct`, score, verdicts | **estimé** (± 1 point de score) → *B1 : exact, 10 405 scores et 252 verdicts (§ 38)* |
| B → C1, C1 → C2, sensibilité au point (national) | **estimé** (surfaces homogènes) → exact en B2 |
| Secteur habité, 24 cas | **exact** (raster, grille de 100 m) |
| Secteur habité national, effets sur scores et verdicts | **raster requis** (B2) |
| Compositions des 48 périmètres PLM | **raster requis** (B1) → *B1 : exact, Σ arrondissements = commune au pixel (§ 35)* |
| Part hors France et en mer des disques, national | **raster requis** (B2) |
| Licence | ~~confirmation externe requise~~ → *décision produit du 10/11 : publication sous Licence Ouverte 2.0, divergences documentées, aucune confirmation revendiquée (§ 31, E)* |

## 29. Séquençage final

| Étape | Contenu | Sortie | Contrôle avant l'étape suivante |
|---|---|---|---|
| **L0** (indépendant) | § 24 | PR applicative courte | contre-revue ; aucun score ni index modifié |
| **B1 — comptes** (offline) | script versionné `scripts/oso/comptes.py` : comptes de pixels 0-255 pour 34 743 communes + 48 PLM ; preuve d'identité exhaustive avec le cache ; sha256 des entrées | `data/oso/comptes-2023.json(.gz)` + rapport | identité 34 743/34 743 ; Σ arrondissements = commune au pixel ; aucune écriture dans l'index |
| **B2 — secteur** (offline) | grille de 100 m (comptes par famille) ; disque de 15 km par FFT ; secteur habité (valeur, p10-p90, part non mesurée) ; contrôle par masque exact sur 50 communes | `data/oso/secteur-2023.json(.gz)` + tableau avant/après national (scores, rangs, verdicts, catégories, forêt) | **contre-revue des chiffres nationaux** ; libellés validés par le porteur |
| **B3 — alignement** (une PR) | index `nature` v2 ; `territoire-facts@3` ; `territoire-synthese@8` (+ FUT-183) ; `engine-9` ; identité de rang ; Où vivre, /qna, Projet, accueil, AskFuture ; réécriture des textes FUT-178 | PR applicative | tests du § 12 et § 25 ; recette sur l'environnement de test ; contre-revue ; pas de régénération proactive |
| **Publication** | déploiement | — | ~~licence confirmée (§ 19.3)~~ *GO du porteur sur la PR B3 (décision du 10/11 : la licence ne bloque plus)* |

Recette (en plus du § 12.12-14) : Granville, Hyères, Lège-Cap-Ferret, Sète et Arles sous les quatre points (le
secteur habité doit rester dans la dispersion p10-p90) ; Héberville et Rognonas (serres comptées) ; Trèves et Les
Planches-près-Arbois (sorties du seuil de 70 %) ; Boulogne-Billancourt et Montreuil (Paris compté une fois) ; Paris =
Σ 20 arrondissements ; aucun arrondissement dans l'univers des rangs ; aucun libellé « au plus près », « préservé »,
« ou d'eau » après B3.

## 30. Conditions exactes pour autoriser B1

B1 ne produit que des fichiers de comptes hors application. Il peut être autorisé quand :
1. **Stockage** : ✅ archive vérifiée (MD5) et TIF extrait dans `~/Documents/futuree-oso/` ; 36 Gio libres.
2. **Source** : ✅ nomenclature, CRS, valeurs présentes et précision établies ; identité vérifiée sur 1 357 communes.
3. **Contrat** : le porteur valide le § 27 (serres comptées dans les cultures ; non mesuré hors dénominateur ;
   univers des rangs ; pixels sous contour français seulement ou non).
4. **Contre-revue** de la partie II (chiffres du § 17, § 18, § 22).
5. **Licence** : la confirmation n'est pas nécessaire pour **calculer** (B1, B2), elle l'est pour **publier** (B3).

**Questions encore ouvertes** pour le porteur :
- Secteur habité (recommandé), centre bâti ou B en repli ?
- Pondération par la surface bâtie OSO (recommandé, aucune source de plus) ou par la population carroyée Filosofi ?
- Disques limités aux pixels sous contour français (recommandé) ou pixels étrangers comptés ?
- Serres rattachées aux cultures (recommandé) ou à l'urbanisé ?
- Lot L0 autorisé avant B1 ?

**Verdict : GO pour B1 dès que les points 3 et 4 sont acquis ; GO pour B3 subordonné à la licence.**

> **10/11/2026 : conditions remplies, B1 fait (partie III).** Les questions ci-dessus sont tranchées (§ 31) ; la
> contre-revue de la partie II a rendu GO pour B1 et L0 ; la licence ne conditionne plus B3.

---

# Partie III — Décisions définitives et B1 : comptes nationaux exacts (10/11/2026)

## 31. Décisions validées par la contre-revue

Le porteur a contre-revu la partie II au commit `93062179`. Ces décisions ne se redemandent pas.

| | Décision | Ce qu'elle implique ici |
|---|---|---|
| **A** | **Secteur habité** retenu. Le centre bâti est le repli, seulement si l'implémentation révèle un problème majeur | B2 corrige la dispersion (quantiles **pondérés**, même poids que la moyenne) et le sort des cellules sans mesure (sorties du numérateur **et** du dénominateur, part rapportée) : § 39. Libellé : « Autour des zones bâties de la commune, les milieux naturels représentent en moyenne X % des terres situées dans un rayon de 15 km. » Il décrit l'occupation des sols ; il ne prouve ni l'accès, ni la distance réelle à un espace naturel, ni sa qualité écologique |
| **B** | Poids = **surface bâtie OSO**, présentée comme un **proxy de la répartition des lieux bâtis**, jamais comme un nombre d'habitants | comparaison à une répartition de population sur un échantillon ciblé avant la généralisation de B2 (§ 40) |
| **C** | Pixels limités aux **contours des communes françaises** | mer au-delà des contours, étranger et valeur 0 : **non mesurés**, jamais « pas de nature » ; part non mesurée disponible et visible ; pas de comparaison trompeuse pour les communes frontalières et insulaires |
| **D** | **Serres (24) rattachées aux cultures**, poste distinct | F-score 0,27 documenté ; sensibilité nationale en B1 (§ 37) ; aucune phrase sur l'activité agricole réelle tirée de ces pixels |
| **E** | **Publication autorisée** sous la Licence Ouverte 2.0 affichée par le producteur (Theia) et le distributeur (GEODES) | attribution « OSO 2023, THEIA / CES OSO (CESBIO), CNES-GEODES, mise à jour du 20/09/2024, Licence Ouverte 2.0 ; traitements futur•e » ; divergences (ODbL du Cerema, mentions générales du site GEODES) **documentées, non résolues** (§ 19) ; demande au CNES poursuivie **sans suspendre le calendrier** ; aucune confirmation juridique revendiquée ; raster brut hors dépôt et hors runtime |

Chantiers autorisés :
- **L0** : PR applicative séparée, **#148**, non fusionnée. Le point L0-2 (grain de la preuve Projet) est **reporté à
  B3**. « Secteur » désigne, dans le produit, les abords d'une adresse : l'employer pour le rang nature, calculé au point
  de la commune, ferait passer une mesure communale pour une mesure à l'adresse. Le grain se corrige avec la nouvelle
  mesure, sous `engine-9`.
- **B1** : fait (§ 32-38).
- **B2** : préparation faite (§ 39). Le **calcul national attend le bilan** (§ 40).
- **B3** : une seule PR (§ 29) ; publication après GO du porteur sur cette PR.

## 32. B1 : fichiers, empreintes, reproduction

| | Fichier | Empreinte (sha256) |
|---|---|---|
| Raster | `OCS_2023.tif` (773 034 463 octets ; 126 813 × 119 159 px ; EPSG:2154 ; 10 m ; aucun no-data déclaré) | `331adf56ea2301c5a6460084f797352190caaacabc7e4d1e3ebaffca9af8f90c` |
| Contours communaux | `data/cache-nature/contours/*.json` (96 fichiers, geo.api.gouv.fr du 02/06/2026, ceux qui ont produit l'index) | `58b8effbcaf1a7792d669b652754df2cc712d766bd996bdf3ea080025f827cfd` (nom et contenu concaténés) |
| Arrondissements | `arrondissements.json` (geo.api.gouv.fr, 45 arrondissements, téléchargé le 09/11) | `9178b6eb1edb5a6fbdf381e9c1fdf273082125ee365bb0a8c6360ee672c97284` |
| Script de comptes | `b1_comptes.py` | `1101b40f139f1b4e80cae3279beface11b8b4b95d52d44adbfe316078c7895b7` |
| Script d'analyse | `b1_analyse.py` | `1e62a1e0e823590c9b385498322f7c71631bc50a638151258396ff471eeff579` |
| **Comptes** | `comptes-pixels.csv.gz` : 34 791 lignes (34 746 communes, dont Paris, Lyon et Marseille, et 45 arrondissements) ; pour chaque contour, l'aire, le nombre de pixels et le compte de **chaque valeur** 0-24 et 255 | `1b0c484957d3f29cb73eba8411d72a8b2d76e174091a1b7e2a203b4df034da81` |
| Parts | `parts-terrestres.csv.gz` : parts exactes non arrondies, par commune (variantes S1 et S0) | `074ea8d4a40aaec65200a4543239e62dab775cf96849d68d981be9f2db786804` |
| Résumé | `resultats-b1.json` (dans ce dossier) | — |

Les comptes et les parts sont dans `~/Documents/futuree-oso/b1/`, hors dépôt et hors application, avec
`comptes-pixels.meta.json` : versions de Python, numpy, rasterio, GDAL et shapely, durée, date. Aucune écriture dans
l'index, aucun déploiement, aucune écriture distante. Les commandes :

```
python -I b1_comptes.py OCS_2023.tif data/cache-nature arrondissements.json ~/Documents/futuree-oso/b1 --processus 10   # 502 s
python -I b1_analyse.py ~/Documents/futuree-oso/b1/comptes-pixels.csv.gz data/cache-nature/communes-nature.json \
    --out resultats-b1.json --parts ~/Documents/futuree-oso/b1/parts-terrestres.csv.gz
```

La règle d'appartenance est celle de `populate-nature.py` : centre du pixel dans le contour, contour reprojeté par
GDAL, chaque contour masqué seul.

## 33. Identité exhaustive avec le cache

| Champ comparé | Communes | Écarts |
|---|---|---|
| `tot_px` (pixels 1-23) | 34 743 | **0** |
| `nat_px` (naturel élargi, eau comprise) | 34 743 | **0** |
| `brut_pct` | 34 743 | **0** |
| `composition` (sept postes, au dixième) | 34 743 | **0** |
| `radius_pct` et `score` recalculés depuis les comptes par la méthode A | 34 743 | **0** |

Les trois contours comptés hors du cache sont Paris, Lyon et Marseille : l'index ne les connaît que par arrondissement.
Conclusion : **le fichier téléchargé est celui qui a produit l'index**, au pixel près, partout. Les comptes de B1 peuvent
remplacer le cache sans rien perdre.

## 34. Couverture dans les contours

| National (34 746 contours) | km² |
|---|---|
| Aire des contours | 548 857,9 |
| Pixels classés 1-24 | 548 856,1 |
| Valeur 0 sous un contour | 1,86 |
| Valeur 255, autres valeurs | 0 |
| Part des contours sans pixel (bord du raster, effet de bord) | 16,65 |

Médiane de la part mesurée : 100 %. Premier centile : 99,956 %. Une seule commune sous 99,5 % : Piriac-sur-Mer, à
99,29 % (8,6 ha de valeur 0 sur la côte). **Dans les contours, la couverture ne pose aucun problème.** Le non-mesuré
se trouve tout entier dans les **disques** : mer au-delà des contours et étranger.

Le raster classe en effet **33 051 km² hors des contours français** : 21 544 km² d'eau (mer, lacs frontaliers) et
environ 11 500 km² de terres étrangères, dont 20,8 km² de serres. Sans la décision C, un disque frontalier compterait
ces pixels, produits hors du périmètre de validation de la carte.

## 35. Paris, Lyon, Marseille

| Commune | Arrondissements | Pixels (commune) | Σ arrondissements − commune | Naturel / terres | Forêt / terres | Urbanisé / terres | Eau / mesuré |
|---|---|---|---|---|---|---|---|
| Paris | 20 | 1 054 295 | **0 pixel**, sur chaque valeur | 17,25 % | 14,83 % | 81,89 % | 2,68 % |
| Lyon | 9 | 479 003 | **0 pixel** | 15,57 % | 13,94 % | 81,91 % | 6,51 % |
| Marseille | 16 | 2 381 230 | **0 pixel** | 52,94 % | 13,18 % | 43,85 % | 0,45 % |

La partition est exacte au pixel. L'aire des arrondissements et celle de la commune diffèrent de 0,2 m² au plus. Les
parts des 45 arrondissements sont dans `resultats-b1.json`. Les deux grains existent désormais, mesurés chacun sur
ses propres pixels : rien ne passe d'un grain à l'autre, et rien n'est compté deux fois. Les arrondissements restent
hors de l'univers des rangs (arbitrage C).

## 36. Seuils : qui franchit, exactement

Règle « après » : parts calculées sur les comptes, **avant arrondi**, serres dans les terres et les cultures (S1).

| Seuil | Règle actuelle | Avant | Après | Entrent | Sortent |
|---|---|---|---|---|---|
| Boisement Projet ≥ 70 % | forêt du contour, eau comprise, arrondie | 3 258 | **3 336 (9,60 %)** | 80 | 2 |
| Où vivre `rural_agricole` (cultures ≥ 30 %, densité < 1 500) | agricole du contour, eau comprise, sans serres | 16 970 | 17 109 | 143 | 4 |
| Où vivre `rural_forestier` (forêt ≥ 35 %, densité < 1 500) | forêt du contour, eau comprise | 13 380 | 13 494 | 122 | 8 |
| Territoire `land.category` (20 / 45 / 50) | parts de l'application, arrondies | — | — | **49 changements** | — |

- **Boisement 70 %.** Les deux sorties sont Trèves (69,957 %) et Les Planches-près-Arbois (69,992 %). Neuf communes
  changent de côté selon qu'on arrondit ou non (de 69,954 à 69,992 % : Sers, Pandrignes, Saint-Barthélemy-de-Bussière,
  Saint-André-de-Roquepertuis, Trèves, Canéjan, Les Planches-près-Arbois, Laval-du-Tarn, Mortcerf). 191 communes sont à
  moins d'un demi-point du seuil. Le 90ᵉ centile de la forêt des terres est à 69,17 % : **« parmi les 10 % de communes les plus
  boisées » reste vraie** (9,60 %), et doit rester produite par le calcul.
- **Catégories Territoire.** Sur les 49 changements, 31 viennent de la seule exactitude (comptes non arrondis, serres
  ignorées), les autres des serres (§ 37). Transitions : forte présence naturelle → mixte (15), mixte → agricole (11),
  agricole → mixte (9), forte présence naturelle → agricole (8), mixte → faible présence naturelle (3), surtout
  urbanisé → forte présence naturelle (2), surtout urbanisé → mixte (1).
- **Catégories Où vivre.** Les deux catégories rurales bougent de 0,9 % à 1 % ; elles relèvent aussi de FUT-185 et de
  FUT-190 (« la campagne n'est pas la nature »). B3 les recalcule sur les terres ; aucune n'est touchée avant.

## 37. Serres : sensibilité nationale (S0 serres exclues, S1 serres dans les cultures)

| | |
|---|---|
| Serres sous les contours communaux | 204,7 km², 11 990 communes en ont au moins un pixel |
| Communes où elles font ≥ 1 / 2 / 5 / 10 % des terres | 330 / 169 / 35 / 3 |
| Effet sur la part des cultures | + 5,82 points au plus ; ≥ 1 point pour 144 communes, ≥ 5 points pour 4 |
| Effet sur la part naturelle | − 4,74 points au plus ; ≤ − 1 point pour 80 communes |
| Catégorie Territoire changée | **20** (mixte → agricole 11, forte présence naturelle → mixte 5, forte présence naturelle → agricole 2, surtout urbanisé → mixte 1, mixte → faible présence naturelle 1) |
| Seuils franchis | boisement 70 % : 1 ; `rural_agricole` : 13 ; `rural_forestier` : 2 |
| À méthode A constante | 1 377 scores bougent, de 2 points au plus ; 17 verdicts de rang (15 neutres → défavorables, 2 favorables → neutres) |

| Cas nommé | Serres / terres | Cultures S0 → S1 | Naturel S0 → S1 | Catégorie |
|---|---|---|---|---|
| Héberville (76) | **15,24 %** (le maximum national) | 78,72 → 81,97 % | 14,82 → 12,56 % | agricole, inchangée |
| Rognonas (13) | 10,12 % | 43,38 → 49,11 % | 19,88 → 17,87 % | faible présence naturelle, inchangée |
| Châteaurenard (13) | 7,64 % | 39,89 → 44,48 % | 31,15 → 28,77 % | mixte, inchangée |

Les fortes parts se concentrent dans le pays de Caux (Seine-Maritime), en Provence (Châteaurenard, Rognonas,
Eyragues) et dans le marais vendéen (Saint-Michel-en-l'Herm, Grues). **Grues** passe de « forte présence naturelle » à
« agricole » par ses seules serres (7,27 % de ses terres). C'est exactement le cas que la faible précision de la classe
rend douteux : dans un marais, des « serres » peuvent être des confusions. La décision D reste juste, puisque les
pixels existent et que les exclure fausse le dénominateur. Mais **aucune phrase ne dira « serres » ou « maraîchage »
d'une commune à partir de ces pixels**, et B3 doit tester Grues et Héberville en recette.

## 38. Retrait de l'eau, à méthode A constante : effets exacts

Référence : l'index publié (A, eau comprise). « Eau retirée » : naturel terrestre / terres (S1), même sélection de
communes. Ce n'est pas la méthode retenue : cela isole l'effet de l'eau.

| Effet | Scores changés | dont ≥ 10 points | Verdicts de rang changés | Estimation de la phase A |
|---|---|---|---|---|
| Eau seule (A) | **10 405** | 81 | **252** (neutre → défavorable 103, défavorable → neutre 115, favorable → neutre 19, neutre → favorable 15) | 10 141 et 248 |
| Géographie seule (B, eau comprise) | 826 | 0 | 13 | identique (déjà exact) |
| Combinaison (B, eau retirée) | 10 638 | 81 | 257 | — |
| Serres seules (A, eau retirée) | 1 377 | 0 | 17 | — |

Les plus fortes baisses sont sur l'estuaire de la Gironde : Floirac (Charente-Maritime) passe de 52 à 27, Barzan de
57 à 32, Talmont-sur-Gironde de 57 à 33. Le Grau-du-Roi passe de 61 à 38. L'estimation de la phase A
était juste à 3 % près ; ses ordres de grandeur sont confirmés.

## 39. Préparation de B2 : le secteur habité contrôlé sur 87 communes

Script : `b2_preparation.py`. Résultats : `resultats-b2-preparation.json`. Lecture seule, sans aucun calcul national.
Échantillon à graine fixe : 8 communes tirées par strate (urbaines denses, de densité intermédiaire, rurales, littorales,
de montagne, de plus de 150 km², frontalières), 10 îles et les 24 cas extrêmes de la phase A, soit 87 communes.

Corrections apportées au script de la partie II, à la demande de la contre-revue :
- **dispersion pondérée** : p10, p50 et p90 sont pondérés par la surface bâtie, comme la moyenne (convention :
  plus petite valeur dont le poids cumulé atteint q). Les percentiles non pondérés restent rapportés pour comparaison ;
- **cellules sans mesure** : une cellule bâtie dont le disque ne contient aucune terre mesurée sort du numérateur
  **et** du dénominateur ; son poids est rapporté (`poids_sans_mesure_pct`) ;
- **contours français** : seuls comptent les pixels dont le centre tombe dans un contour communal français. Le reste
  est non mesuré ;
- **couverture** : chaque résultat porte la part mesurée du disque, en moyenne pondérée.

| Contrôle | Résultat sur 87 communes | Lecture |
|---|---|---|
| 1. Moyenne et dispersion pondérées | moyenne comprise entre p10 et p90 pondérés : **87 / 87**. Écart entre percentiles pondérés et non pondérés : jusqu'à **7,8 points** (Sète : p10 de 44,9 pondéré contre 37,1 non pondéré) | la correction était nécessaire : sans pondération, la dispersion décrivait d'autres lieux que la moyenne |
| 2. Cellules sans mesure | **0 %** du poids bâti, partout, îles comprises | il reste toujours un peu de terre dans 15 km d'un bâtiment français ; la règle reste écrite pour le calcul national |
| 3. Couverture des disques | 29 communes ont moins de 80 % du disque mesuré, 19 moins de 60 % (échantillon riche en côtes et en îles). Minimum : Ouessant (2,5 %), Île-de-Sein (2,7 %), L'Île-d'Yeu (3,4 %). Évian-les-Bains : 49,5 % (Léman et Suisse) | la valeur reste juste (elle porte sur les terres mesurées), mais **pour Ouessant elle décrit l'île seule**. Il faut une règle d'affichage et de comparaison (§ 40) |
| 3 bis. Effet de la limitation aux contours français | médiane 0 ; 90ᵉ centile 0,28 point ; maximum **4,8 points** (Marpent, frontière belge : 53,3 limité contre 48,5 non limité) | faible en général, fort à quelques frontières : la décision C protège bien les cas où elle compte |
| 4. Classes bâties | classes 1-4 (avec zones d'activité et routes) contre 1-2 : **0,17 point au plus**. Classe 1 seule : jusqu'à 5,5 points, et **non calculable pour 29 communes** (pas de bâti dense) | 1-2 est robuste ; la classe 1 seule est à écarter |
| 5. Strates | aucune strate n'échoue. Communes multipolaires ou hétérogènes : dispersion large (Arles : p10-p90 pondérés de 40,8 à 61,8 ; Noyant-Villages de 60,2 à 69,1 ; Saintes-Maries-de-la-Mer de 49,5 à 66,2) | la dispersion est l'information à garder visible pour ces communes |
| 6. Grille de 100 m contre référence à 10 m | 1 500 pixels bâtis tirés par commune, disque exact au pas de 10 m. Écart : médiane − 0,01 point ; 90ᵉ centile 0,09 ; maximum **0,28 point** (Hyères). Erreur-type du tirage : 0,22 point au plus ; 6 écarts dépassent deux erreurs-types, tous sous 0,3 point | la grille de 100 m suffit, à 0,3 point près, pour une valeur affichée au dixième. Les comparaisons à un seuil la prennent comme incertitude connue |

**Le point unique reste à écarter.** Le secteur habité s'en écarte nettement là où le point tombe mal :

| Commune | Secteur habité (p10-p90 pondérés) | Point de l'index | Centre bâti |
|---|---|---|---|
| Granville | 59,8 (59,2-60,8) | 41,5 | 59,4 |
| Hyères | 61,2 (54,8-65,5) | 72,9 | 61,6 |
| Sète | 50,4 (44,9-55,3) | 43,7 | 50,3 |
| Arles | 49,6 (40,8-61,8) | 54,4 | 49,6 |
| Barr (Bas-Rhin) | 59,0 (56,6-62,8) | 67,2 | 58,8 |
| Marseille | 62,5 (58,1-65,4) | 62,7 | 64,6 |
| Paris | 19,2 (16,0-23,2) | 17,6 | 18,0 |

Le centre bâti suit le secteur habité dans la plupart des cas (Marseille : 2 points d'écart). Il reste un repli crédible.

**Architecture du calcul national (préparée, non lancée).** Elle sépare ce qui se calcule une fois de ce qui se calcule
par commune :
1. **Passe raster par blocs**, comme B1, en 10 à 20 min estimées. On rasterise les contours au pas de 10 m dans chaque
   bloc (étiquette de commune, donc la limitation aux contours français), puis on agrège sur la grille nationale de 100 m
   (12 681 × 11 916 cellules) les comptes naturel, terres, eau et mesurés. Pour chaque commune, on garde ses cellules
   bâties et le nombre de pixels bâtis qu'elle y possède. Une cellule à cheval sur deux communes donne à chacune ses
   propres pixels : pas de double compte.
2. **Deux convolutions nationales** par FFT, avec le disque de 15 km (naturel, terres, puis mesurés).
3. **Agrégation par commune** : moyenne et quantiles pondérés, part sans mesure, couverture. Même code que
   `b2_preparation.py`, ce que l'échantillon permettra de vérifier à l'identique.
4. **Contrôles** : identité sur les 87 communes de l'échantillon ; référence à 10 m sur 50 communes tirées hors
   échantillon ; tableau avant/après national (scores, rangs, verdicts, catégories, forêt).

## 40. Bilan avant le calcul national de B2, et ce qui reste à décider

**Ce qui est acquis.** La méthode tient sur 87 communes de toutes les strates : dispersion cohérente, aucune cellule sans
mesure, sensibilité négligeable au choix 1-2 ou 1-4, grille de 100 m fidèle à 0,3 point de la référence à 10 m. La
limitation aux contours français est en place.

**Ce qui reste avant de lancer le calcul national :**

1. **Règle de couverture des disques (à valider par le porteur).** Proposition, pour « éviter toute comparaison
   trompeuse » (décision C) :
   - au moins 75 % du disque mesuré : valeur et rang normaux ;
   - de 50 à 75 % : valeur et rang, avec la part non mesurée affichée (Granville, Hyères, Sète) ;
   - moins de 50 % : valeur affichée comme « mesure partielle » (« sur les terres de l'île », Ouessant), **sans verdict
     de rang** (le Projet rend « incertain ») et sans trait distinctif. Ces communes restent hors du calcul des
     percentiles, pour ne pas déplacer les autres.

   Le compte national de chaque palier sortira de la passe 1. Dans l'échantillon, 19 communes sur 87 sont sous 60 %,
   mais l'échantillon surreprésente les côtes.
2. **Comparaison à une répartition de population (décision B).** Elle n'est pas faite. La source pertinente est la
   base carroyée Filosofi 2019 de l'Insee (carreaux de 200 m, population par carreau). Elle demande un téléchargement
   (quelques centaines de Mo) stocké dans `~/Documents/futuree-oso/`, puis un calcul sur une vingtaine de communes
   ciblées : multipolaires (Arles, Chemillé-en-Anjou, Noyant-Villages, Le Mené), centres denses (Paris, Lyon,
   Marseille, Lille), touristiques (Hyères, Lège-Cap-Ferret, Chamonix, Les Belleville). C'est une demi-journée, sans
   nouvelle dépendance applicative. **À faire avant la généralisation**, sauf contre-ordre.
3. **Rang et univers.** Le score reste un percentile national calculé sur les communes, arrondissements exclus ; les
   communes en « mesure partielle » en sont retirées (point 1).

**Recommandation : GO pour le calcul national de B2 dès que la règle du point 1 est validée et la comparaison du
point 2 faite.** Il ne produit que des fichiers hors application, comme B1. Le tableau avant/après national viendra
ensuite en contre-revue, avant toute PR B3.

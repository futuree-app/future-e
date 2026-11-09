# FUT-182 · Phase A — OSO national : audit avant recalcul

09-10/11/2026. Branche `bonjourfuturee/fut-182-oso-national-audit`, worktree dédié, base `origin/main` `e9158447`
(FUT-175, FUT-177, FUT-178 et FUT-179 fusionnés). **Audit seul** : aucune donnée de l'application, aucun contrat
métier, aucune base ni stockage distant modifiés ; aucun téléchargement massif. Scripts et résultats bruts :
`docs/audits/2026-11-09-fut182-oso-phase-a/`.

---

## 0. Résumé pour décider

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
| Raster OSO 2023 | **absent du poste** (`data/cache-nature/oso2023.tif` supprimé, déjà noté par FUT-175) |
| Base de production | **lecture seule**, requêtes d'agrégats (comptes par version), aucune donnée personnelle lue |

Scripts (portables, chemins passés en argument) :
- `selection_eau.py` (numpy) : reproduction de l'index, méthodes A et B, effet de l'eau, seuils, rangs, trait
  distinctif, forêt, catégories, fixture FUT-178, cas témoins → `resultats-selection-eau.json`.
- `tampon_contours.py` (numpy, shapely, pyproj) : couverture des pixels classés, validité des contours, 48 périmètres
  PLM, point de référence, méthode C approchée → `resultats-tampon-contours.json`.

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
- Le « centre » n'est **pas un centroïde** : c'est le point lat/lon de `data_climat.json` (DRIAS), d'origine non
  documentée. Il s'écarte du centroïde géométrique de 241 m en médiane (p99 1,15 km, max 13,9 km), et 483 points
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
| 16 | AskFuture (commune) | `ask/system-prompt.ts:169` | **ADEME** `taux_boisement` | « Taux boisement (%) », sans source | commune | ADEME | Envoie l'ADEME sans la nommer, alors que Territoire tient OSO pour canonique (D1). Châtelaillon : 1,5 % ADEME, 10,3 % OSO |
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
| « 24 classes » | Theia : « depuis 2018, nomenclature en 24 classes ». Le Cerema liste « Autres » en dernier poste, sans code. Le schéma n'en montre que 23. **Le code et le contenu de « Autres » ne sont pas établis.** | Theia, Cerema |
| Précision publiée | Évaluation SIRS **de 2016** : précision globale 81-92 % selon la nomenclature. Le Cerema signale une « distinction peu fiable » entre les quatre classes urbaines. **Aucune précision 2023 trouvée** (page produit 2023 en 404) | Cerema |
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

Les déficits forment des **grappes** (Pays de Caux, nord des Bouches-du-Rhône, marais poitevin) : c'est la signature
de trous d'acquisition ou de tuiles, pas de l'effet de bord. Pour ces communes, la part manquante est **inconnue,
pas nulle**. Le calcul actuel la retire du dénominateur sans le dire. **Non vérifié** : la répartition de ce déficit
entre 0, 255 et « Autres » (il faut le raster).

### 3.3 Obtenir le raster : intégrité, volume, licence

| Point | Constat |
|---|---|
| Copie Recherche Data Gouv | DOI 10.57745/UZ2NJ7, version 1.4 (18/02/2026), dépôt 12/09/2025, INRAE RiverLy, « redistribution **non officielle** » |
| Fichier 2023 | `OSO_20230101_RASTER.tar.gz`, **5 624 505 462 octets** (5,24 Gio), **MD5 `bc6deea29081876a9be88c76b92d59ec`** (somme calculée par l'entrepôt sur la copie, pas une somme publiée par le producteur) |
| Source officielle | GEODES (CNES), depuis janvier 2025. DOI 10.24400/329360/OSO_20230101_RASTER, dont la page d'atterrissage est **en 404** |
| Contenu de l'archive | **Non vérifié** : la liste des fichiers (classification, confiance, validité, tuiles ?) exige l'archive entière |
| Espace local | **4,3 Gio libres** sur 466 Gio : l'archive ne tient pas, ni décompressée ni compressée |
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
| Forêt ≥ 70 % (`BOISEMENT_NOTABLE`) | 3 258 (9,38 %) | 3 342 (9,62 %) | +84 (77 sans arrondi), aucune sortie |
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
| `autres` | code « Autres », s'il existe dans le raster | non classé, compté |
| `non_classe` | 0, 255, hors emprise | non classé, compté |
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

## 15. Ce qui reste incertain

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

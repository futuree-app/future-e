# FUT-178 — Portée du signal de nature environnante (inventaire, session interrompue)

Branche : `bonjourfuturee/fut-178-portee-nature-environnante` (worktree `.claude/worktrees/fut178`, depuis origin/main 51a493d0). **Aucun code modifié à ce stade.**

## Ce que mesure chaque champ (scripts/populate-nature.py, vérifié)
- `brut_pct` / `composition` : pixels OSO 2023 dont le centre tombe dans le contour de la commune. Mesure communale. « Naturel élargi » = forêts, prairies, landes-pelouses, roche-dunes, eau ; cultures, vignes, vergers exclus.
- `radius_pct` : Σ pixels naturels / Σ pixels des **communes entières dont le centroïde (lat/lon de l'index) est à ≤ 15 km** de celui de la commune, elle comprise. Ce n'est pas un tampon : des communes débordent au-delà de 15 km, celles dont le centre est à 15,1 km sont exclues.
- `score` : percentile national de `radius_pct`.
- Rien ne décrit une adresse.

Recalcul (`docs/audits/2026-11-09-fut178-verif-nature.py`, cache data/cache-nature) : **0 écart** sur 34 743 communes. 3 communes ont un « rayon » réduit à elles-mêmes (Saintes-Maries-de-la-Mer : brut = rayon = 91,3). Médiane : 53 communes par rayon (p5 21, p95 101). La grille 0,18° ±1 cellule **omet des centroïdes à ≤ 15 km pour 2 465 communes** (≈ 7 %, nord surtout) : écart médian 0,2 pt, max 4,8 pts → « jusqu'à 15 km », jamais « tout le cercle ».

Cas : Châtelaillon 17094 — commune 36,5 % naturel (49,2 % urbanisé), alentour 27,9 %, score 8. Bony 02100 — 6,8 / 11,2, score 0, 89 % cultures, 17 hab/km². Janville-en-Beauce 28199 — 2,8 / 5,6, score 0, 90 % cultures. Contrastes : Bordeaux 36,4 / 54 (score 43) ; Lille 16,3 / 27 (7) ; Corte 99,1 / 99,6 (100) ; Chamonix 98,8 / 97,3 (96) ; Strasbourg 43,3 / 31,6 (11).

## Surfaces et correction prévue
1. `comparateur-vie.ts:931` buildTerritorySignals → /qna (modèle) : `nature.niveau` = « territoire peu naturel » / « fort caractère naturel », sans périmètre. **À reformuler** : niveau « … alentour » + périmètre (communes dont le centre est à moins de 15 km, la commune comprise) + ne-dit-pas (ni la commune seule, ni une adresse ; peu de nature alentour = souvent des cultures, pas une ville). Vérifier tests fut96 / gares-commune / qna.
2. `QuartierClimatData.tsx:727` : « Dans un rayon de 15 km autour de la commune : Y % » → présente l'approximation comme un cercle. **Préciser** : « En comptant les communes voisines dont le centre est à moins de 15 km du sien : Y % ». `breakdownLabel` « Ce qui couvre le territoire » → « … la commune ».
3. `territoire/facts.ts:286` limits « Mesuré dans un rayon de 15 km, pas sur la commune » : faux deux fois (inclut la commune, pas un cercle). **Réécrire.** Clés `natural_share_15km` / `radius_15km` internes : laissées.
4. `comparateur-vie.ts:2982` buildDistinctive « la plus proche de grands espaces naturels » : « proche » (distance) et « grands » non mesurés. → « la plus entourée d'espaces naturels » (cohérent trait-distinctif). Mettre à jour `fut151-points-forts.test.ts:86`.
5. `comparateur-vie.ts:2480` raison favorable « forêts et espaces naturels à proximité » : « forêts » non garanti (Saintes-Maries = eau, Corte = landes) → « beaucoup d'espaces naturels alentour ». 2564 « nature présente, sans abonder » → ajouter « alentour ».
6. `comparateur-vie.ts:1544` aide « autour du lieu de vie » (lisible comme adresse) → commune + communes voisines, pas les abords d'une adresse. `forte: "ses espaces naturels"` (possessif = la commune) → « les espaces naturels qui l'entourent ».
7. `mismatch-facts.ts:96,160` « l'accès aux espaces naturels » : la mesure est un couvert, pas un accès (cf. FUT-73). À trancher : « les espaces naturels alentour ». Impact tests conclusion-plan (labels propres aux tests) et `distributions-rang` à vérifier.
8. Sans changement : `trait-distinctif.ts:37` « les plus entourées d'espaces naturels » (FUT-34, bas retiré), paliers « … autour », `comparateur-labels.ts`, prompt parse.

## Reste à faire
Appliquer 1-7, tests de non-régression (Châtelaillon carte vs alentour ; Bony/Janville jamais « urbanis » ni « peu naturel » sur la commune ; aucune phrase « rayon de 15 km » rendue ; FUT-34 vert), suite seule (`--test-concurrency=1`), PR (compte futuree-app), SHA, verdict.

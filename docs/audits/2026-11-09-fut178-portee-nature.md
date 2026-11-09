# FUT-178 — Portée du signal de nature environnante

Branche : `bonjourfuturee/fut-178-portee-nature-environnante` (worktree `.claude/worktrees/fut178`, depuis origin/main 51a493d0). Inventaire du 09/11/2026, corrections appliquées dans la même branche (section « Appliqué »).

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

## Appliqué (avant → après)
| Surface | Avant | Après |
|---|---|---|
| /qna, signal au modèle (`buildTerritorySignals`) | `nature: { niveau: "territoire peu naturel" }` | `espaces_naturels_alentour: { niveau: "peu d'espaces naturels alentour", perimetre: "la commune et les communes voisines dont le centre est à moins d'une quinzaine de kilomètres du sien", ne_dit_pas: "…ni la commune seule, ni les abords d'une adresse ; … le plus souvent des cultures, jamais à lui seul une ville…" }` + une règle de lecture dans le prompt système |
| Carte « Espaces naturels » (rapport) | « Dans un rayon de 15 km autour de la commune : 28 %. » ; « Ce qui couvre le territoire » | « En comptant aussi les communes voisines dont le centre est à moins de 15 km du sien : 28 %. » ; « Ce qui couvre la commune » |
| Dossier, écart (mismatch) | « Sur l'accès aux espaces naturels, Bony se situe parmi… » ; sujet « l'accès aux espaces naturels » | « Sur la part d'espaces naturels alentour, … » ; sujet « les espaces naturels alentour » ; + limitation de méthode (périmètre réel, ni commune seule ni adresse, une part faible tient le plus souvent aux cultures) |
| Dossier, point fort (alignment) | « Pour l'accès aux espaces naturels, Corte se situe parmi les … de communes où il est le plus favorable » | « Pour les espaces naturels alentour, Corte se situe parmi les … de communes les plus entourées d'espaces naturels en France » + même limitation |
| Comparateur, point fort relatif | « la plus proche de grands espaces naturels des trois » | « la plus entourée d'espaces naturels des trois » |
| Comparateur, raisons | « forêts et espaces naturels à proximité » / « peu d'espaces naturels à proximité » / « nature présente, sans abonder » | « beaucoup d'espaces naturels alentour » / « peu d'espaces naturels alentour » / « nature présente alentour, sans abonder » (FUT-154 : reprend le palier « Nature présente ») |
| Comparateur, ligne | aide « …autour du lieu de vie. » ; synthèse « se distingue par ses espaces naturels » | « La part d'espaces naturels dans la commune et ses voisines (centres à moins de 15 km), pas aux abords d'une adresse. » ; « …par les espaces naturels qui l'entourent » |

**Laissé volontairement :** `territoire/facts.ts` limite `land.natural_share_15km` (« Mesuré dans un rayon de 15 km, pas sur la commune ») : jamais rendue au lecteur, fait exclu de la synthèse, et le fichier est gelé par `fut147-non-regression` car le modifier change l'empreinte des snapshots → toutes les synthèses Territoire en cache seraient régénérées (appels modèle en production). À corriger dans un ticket qui assume cette régénération. Clés internes `natural_share_15km` / `radius_15km` : inchangées. Grille 0,18° qui omet des voisines : défaut du précalcul, hors périmètre (pas de nouveau calcul géospatial) ; la formulation « à moins de 15 km » reste vraie pour les communes retenues.

**Effet de bord à connaître :** les conclusions de dossier dont le plan contient un fait nature (écart ou point fort) changent de texte, donc d'empreinte : elles seront rédigées à nouveau à leur prochaine ouverture (comportement habituel de toute modification de libellé du dossier).

## Tests
`src/lib/fut178-portee-nature.test.ts` (9 tests, index réel) : Châtelaillon (36,5 / 27,9 / rang 8, le signal ne prend que l'alentour, aucun chiffre) ; Bony et Janville (≈ 90 % cultures, < 100 hab./km², jamais « urbanis » ni « peu naturel ») ; Corte, Bordeaux, Lille, Saintes-Maries (niveaux contrastés, jamais « forêt » ni « dans un rayon ») ; prompt /qna ; carte ; dossier écart (Bony) et point fort (Corte) avec leur limitation ; libellés ; comparateur. Mis à jour : `fut151-points-forts`, `fut147-non-regression` (remplacements de libellés dans la référence, comme FUT-138). FUT-34 (`fut34-trait-distinctif`) inchangé et vert.

## Reprise après contre-revue (09/11/2026, rebase sur main 6fc48f7b, FUT-175)

La contre-revue a relevé trois excès : « alentour » / « entourées » est faux quand la sélection ne retient aucune voisine, la sélection peut être incomplète, et le score compte l'eau. Elle a aussi relevé que « une part faible tient le plus souvent aux cultures » affirme une cause qu'on ne connaît pas pour tout le périmètre.

**Recalcul reproductible.** Le script prend maintenant ses chemins depuis son propre emplacement : `python3 docs/audits/2026-11-09-fut178-verif-nature.py <cache communes-nature.json> --fixture`. Il réécrit `src/lib/__fixtures__/fut178-selection-nature.json`, que les tests lisent sans le cache. Résultat inchangé : 0 écart, médiane de 53 communes par sélection.
- **3 communes sans voisine retenue :** Arles, Saintes-Maries-de-la-Mer et L'Île-d'Yeu (secteur = commune).
- **2 465 sélections incomplètes :** écart médian 0,2 point, maximum 4,8. Un échantillon de 24 communes est figé dans la référence (les 12 plus gros écarts, puis 12 réparties sur le reste).

**Terme retenu : « le secteur »**, défini partout où il est expliqué comme « la commune et, quand elles sont retenues, des communes voisines entières dont le centre est à moins de 15 km ; sélection parfois incomplète ». Le terme reste vrai pour une commune sans voisine retenue. Les éléments principaux restent courts, et la méthode va dans l'aide, la limitation ou le pied du volet.

| Surface | Première version (d3c512e0) | Après reprise |
|---|---|---|
| /qna, signal | `espaces_naturels_alentour` : « peu d'espaces naturels alentour », « …le plus souvent des cultures… » | `espaces_naturels_secteur` : niveau « peu d'espaces naturels ou d'eau dans le secteur » ; `perimetre` (sélection incomplète, parfois vide) ; `composition` (l'eau comptée) ; `ne_dit_pas` (« …ni des espaces uniquement terrestres ou végétalisés ; une faible part d'espaces naturels ne prouve pas une forte urbanisation : elle peut notamment s'expliquer par les terres agricoles ») |
| /qna, prompt | commune + voisines, pas de cercle, pas de ville | + sélection incomplète ou vide, jamais « entourée », eau comptée, la règle sur les terres agricoles |
| Carte « Espaces naturels » | « En comptant aussi les communes voisines dont le centre est à moins de 15 km du sien : 28 %. » | FUT-175 conservé intégralement (terres, eau à part, « Ce qui couvre ses terres », réserve de couverture). Nouvelle phrase : « Sur son secteur (la commune et, s'il y en a, des communes voisines retenues), espaces naturels et eau confondus : 28 %. » Pied du volet : « Le secteur réunit des communes entières dont le centre est à moins de 15 km de celui de la commune ; la sélection peut en oublier. » |
| Dossier, écart | « Sur la part d'espaces naturels alentour… » ; limitation « …tient le plus souvent aux cultures, pas à la ville » | « Sur la part d'espaces naturels et d'eau dans le secteur… » ; sujet « les espaces naturels du secteur » ; limitation : eau comprise, sélection parfois incomplète, règle sur les terres agricoles |
| Dossier, point fort | « …les plus entourées d'espaces naturels en France » | « …de communes dont le secteur compte le plus d'espaces naturels ou d'eau en France » |
| Comparateur, raisons | « beaucoup / peu d'espaces naturels alentour », « nature présente alentour, sans abonder » | « beaucoup / peu d'espaces naturels ou d'eau dans le secteur », « nature présente dans le secteur, sans abonder » (FUT-154 : reprend « Nature présente ») |
| Comparateur, point fort relatif | « la plus entourée d'espaces naturels des trois » | « la plus riche des trois en espaces naturels ou en eau dans son secteur » (gabarit `{n}` pour placer « des trois ») |
| Comparateur, ligne | paliers « Beaucoup / Peu de nature autour » ; aide « …dans la commune et ses voisines (centres à moins de 15 km)… » ; « …par les espaces naturels qui l'entourent » | paliers « Beaucoup / Peu de nature dans le secteur » ; aide « Espaces naturels et eau, dans la commune et les communes voisines retenues (centres à moins de 15 km, liste parfois incomplète). Pas les abords d'une adresse. » ; « …par les espaces naturels et l'eau de son secteur » |
| AskFuture, signaux ambiants (oubliés au premier passage) | « davantage / moins de nature autour », « présence de nature intermédiaire » | « davantage / moins d'espaces naturels ou d'eau dans le secteur », « présence intermédiaire d'espaces naturels ou d'eau dans le secteur » |

**Laissé volontairement, avec la raison :**
- **`trait-distinctif.ts`, « compte parmi les communes les plus entourées d'espaces naturels » :** le libellé est inexact pour les 3 communes seules et ne dit pas l'eau. Mais il n'est ni affiché ni transmis au modèle (`place.distinctive_trait` : noCard, exclu de la synthèse), donc il ne vit que dans l'empreinte du snapshot Territoire. Le reformuler régénérerait les synthèses Territoire de 1 880 communes sans rien changer pour le lecteur. FUT-182 le reprendra, puisque son recalcul changera ces empreintes de toute façon. Un test vérifie qu'aucune surface ne le lit.
- **`territoire/facts.ts`, limite de `land.natural_share_15km` :** FUT-175 l'a réécrite (eau confondue), mais elle dit encore « rayon de 15 km ». Elle n'est jamais rendue au lecteur, et le fait est exclu de la synthèse. Le fichier est gelé ligne à ligne par `__fixtures__/fut175-lignes-admises.json`, et le modifier changerait l'empreinte de tous les snapshots. Elle est aussi laissée à FUT-182.
- **Prompt AskFuture du comparateur :** il impose « n'utilisez QUE le contenu exact des signaux », et il est gelé par `fut147-non-regression`. Le texte du signal porte donc seul la correction.
- **Défaut de la grille du précalcul et présence de l'eau dans `radius_pct` et `score` :** les deux restent dans FUT-182. Aucun score, seuil, classement ni traitement national n'a changé.

**Empreintes et coût :**
- **Territoire :** aucune empreinte supplémentaire. Le registre, le contrat et le trait sont inchangés, et le test d'empreinte de `fut147` reste vert.
- **Conclusions de dossier :** celles dont le plan contient un fait nature (écart ou point fort) changent de texte. Elles seront rédigées à nouveau une fois, à leur prochaine ouverture. La PR n'a jamais été livrée, donc cette régénération est la même qu'avec la première version.
- **Comparateur et /qna :** pas de cache persistant indexé sur le texte (synthèses en flux, `no-store`).

## Dernier correctif avant fusion (09/11/2026)

Réserve de la contre-revue : des étiquettes visibles disaient encore « nature » seule alors que la mesure compte l'eau. La préférence garde son nom (ligne « Espaces naturels », « la proximité des espaces naturels »). Seules les étiquettes de la **mesure** changent :

| Étiquette | Avant | Après |
|---|---|---|
| Paliers du comparateur | « Beaucoup de nature dans le secteur » / « Nature présente » / « Peu de nature dans le secteur » | « Beaucoup d'espaces naturels ou d'eau dans le secteur » / « Espaces naturels ou eau présents » / « Peu d'espaces naturels ou d'eau dans le secteur » |
| Raison intermédiaire | « nature présente dans le secteur, sans abonder » | « espaces naturels ou eau présents dans le secteur, sans abonder » (FUT-154 : reprend le palier) |
| Dossier, `subject` (titre de l'écart) | « les espaces naturels du secteur » | « les espaces naturels (eau comprise) ». La forme est sans « et », sinon elle se coordonnerait avec l'énumération du titre (garde de `mismatch-facts.test.ts`), et elle tient en 45 caractères. |
| Dossier, `topic` et `headlineSubject` (point fort) | « les espaces naturels du secteur » | « les espaces naturels du secteur (eau comprise) » |

Rendu vérifié sur les cellules réelles du comparateur : Saintes-Maries-de-la-Mer « Beaucoup d'espaces naturels ou d'eau dans le secteur », Sète « Espaces naturels ou eau présents », Lille « Peu d'espaces naturels ou d'eau dans le secteur ». Aucun score, seuil, rang ni index ne change. Le registre Territoire et son empreinte sont inchangés.

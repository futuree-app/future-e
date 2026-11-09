# FUT-175 · OSO : eau comptée comme nature — diagnostic (phase 1, partiel)

Session du 09/11/2026, interrompue (limite d'usage). Worktree `.claude/worktrees/fut175`,
branche `bonjourfuturee/fut-175-oso-eau-nature`, base `origin/main` 51a493d0. Aucun code modifié.

## 1. Nomenclature OSO 2023 — établi
- Image officielle Theia (https://www.theia-land.fr/wp-content/uploads/2021/12/nomenclature_oso.png) :
  1-4 artificialisé (urbain dense, diffus, zones indus/comm, routes), 5-12 cultures, 13 prairies,
  14 vergers, 15 vignes, 16-17 forêts, 18 pelouses, 19 landes, 20 surfaces minérales,
  21 plages et dunes, 22 glaciers, **23 eau**. Pas de classe 24 dans l'image.
- Theia annonce pourtant « 24 classes » pour 2023 (blog du 03/10/2024 ;
  https://www.theia-land.fr/blog/projects/occupation-des-sols-hr-france-metropolitaine/).
  Le portail Cerema (artificialisation.developpement-durable.gouv.fr/bases-donnees/oso-theia)
  liste les 23 mêmes classes + « Autres ». Hypothèse NON vérifiée : 24 = « Autres ».
- No-data : aucune valeur documentée (Sentinel Hub rend 0 et 255 transparents).
- DOI 2023 : 10.24400/329360/OSO_20230101_RASTER (page d'atterrissage en 404).
- Le raster `data/cache-nature/oso2023.tif` n'est PLUS sur le disque : impossible de compter
  les pixels de valeur 24 ou > 23 sans retélécharger (GEODES). Seul le cache
  `data/cache-nature/communes-nature.json` (34 743 communes, checkout principal) subsiste.

## 2. Calcul actuel (`scripts/populate-nature.py`) — établi par lecture
- Dénominateur `tot_px` = pixels de valeur 1..23 dans le contour geo.api.gouv.fr
  (valeurs 0, 24, 255 exclues du numérateur ET du dénominateur, sans trace).
- `brut_pct` = (forêt + pelouses + landes + minéral + dunes + glaciers + **eau** + prairies) / tot.
- `composition` : 7 postes en % de tot, **eau incluse** ; le docstring dit « % de la surface
  terrestre » → faux.
- `radius_pct` (15 km) : même définition, eau incluse, centroïdes (pas de contour).
- `score` = percentile national de `radius_pct`.

## 3. Sète (34301) reproduit depuis le cache
tot_px 405 163 (≈ 40,5 km² : le contour inclut une part de l'étang de Thau ; superficie INSEE 24,2 km²) ;
brut_pct 67,3 ; eau 50,6 ; artificialisé 24,9 ; agricole 7,8 ; landes/pelouses 11,6 ; minéral/dunes 2,9 ; forêt 2,0.
Hors eau : artificialisé = 24,9 / 49,4 ≈ **50,4 % des terres** (chiffre FUT-53 confirmé) ;
naturel terrestre = (67,3 − 50,6) / 49,4 ≈ 33,8 %.

## 4. Consommateurs à traiter (grep, non exhaustif sur « composition »)
- `src/lib/territoire/facts.ts` l.43-44, 107 (`land.category` via `composition.artificialise`),
  217 (`brut_pct`), 279-285 (provenance « OSO 2023 »).
- `src/lib/territory-identity.ts` l.148-153 (libellés de composition).
- `src/lib/territoire/synthesis-contract.ts` l.44-49.
- `src/lib/server/territoire-snapshot.ts` l.75 (snapshot figé : brut_pct, radius_pct, composition).
- `src/lib/comparateur-vie.ts` l.520-524 (moteur Où vivre : `nature.score`).
- Tests : `src/lib/territoire/facts.test.ts` l.82-92.

## Reste à faire
1. Mesure nationale avant/après (catégories `land.category`, seuils) en recalculant hors eau
   depuis `composition` (suffisant : eau et autres postes sont dans le même dénominateur) ;
   reproduire ou réfuter « 342 communes, dont 17 Forte présence naturelle → Majoritairement urbanisé ».
2. Échantillon : Palavas, Marignane, Pérols, Batz-sur-Mer, Châtelaillon, Bony, Chartres, Corte.
3. Correction minimale côté lecture (dérivée de `composition`, sans nouveau raster), libellés,
   provenance ; décider du sort de `radius_pct`/`score` (eau incluse dans le rayon).
4. Chiffrer les snapshots `territoire-facts@1` figés avant tout bump (aucune opération distante).
5. Tests, tsc, lint, build, PR.

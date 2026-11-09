# FUT-175 · OSO : eau comptée comme nature — diagnostic et correction

09/11/2026. Branche `bonjourfuturee/fut-175-oso-eau-nature`, base `origin/main` 51a493d0.
Mesures sur l'index réel `data/comparateur-index.json.gz` (34 788 entrées, 34 743 avec OSO, 45 sans).

## 1. Nomenclature OSO 2023

- Nomenclature officielle Theia (https://www.theia-land.fr/wp-content/uploads/2021/12/nomenclature_oso.png) :
  1-4 artificialisé (urbain dense, urbain diffus, zones industrielles et commerciales, routes), 5-12 cultures,
  13 prairies, 14 vergers, 15 vignes, 16-17 forêts, 18 pelouses, 19 landes, 20 surfaces minérales,
  21 plages et dunes, 22 glaciers, **23 eau**. Aucune classe 24 sur ce schéma.
- Theia annonce pourtant « 24 classes » pour 2023 (blog du 03/10/2024 ; page projet
  https://www.theia-land.fr/blog/projects/occupation-des-sols-hr-france-metropolitaine/). Le portail Cerema
  (https://artificialisation.developpement-durable.gouv.fr/bases-donnees/oso-theia) liste les 23 mêmes classes
  plus « Autres ». **Hypothèse non vérifiée** : 24 = « Autres ». Planet et Sentinel Hub publient la table 1-23.
- No-data : aucune valeur documentée (Sentinel Hub rend 0 et 255 transparents, choix d'affichage).
- DOI 2023 : 10.24400/329360/OSO_20230101_RASTER (page d'atterrissage en 404 le 09/11/2026).
- **Limite** : le raster `data/cache-nature/oso2023.tif` n'est plus sur le disque. Il est impossible de compter
  les pixels de valeur 24, 0 ou 255 sans le retélécharger (GEODES). Le code les exclut du numérateur et du
  dénominateur ; leur part reste **inconnue, pas nulle**.

## 2. Calcul de l'index (`scripts/populate-nature.py`, inchangé)

| Champ | Numérateur | Dénominateur |
|---|---|---|
| `composition.<poste>` | pixels du poste | pixels 1-23 dans le contour geo.api.gouv.fr (mer, lagunes, étangs compris si le contour les couvre) |
| `brut_pct` | forêts + prairies + pelouses + landes + minéral + dunes + glaciers + **eau** | idem |
| `radius_pct` | même définition, eau comprise | pixels 1-23 des communes dont le centroïde est à ≤ 15 km |
| `score` | percentile national de `radius_pct` | — |

Le docstring parlait de « % de la surface terrestre » : faux, corrigé (documentation seulement).
Contrôle : les 34 743 compositions portent les 7 postes et somment entre 99,8 et 100,2.

## 3. Reproduction de l'audit FUT-53

Recalcul hors eau (parts / (100 − eau), naturel = (brut − eau) / (100 − eau)), parts non arrondies :
**342 changements de catégorie, dont 17 de « Forte présence naturelle » à « Majoritairement urbanisé »** —
chiffres de l'audit reproduits à l'identique.

La règle livrée classe sur les parts **affichées** (arrondies au dixième, comme avant) pour qu'un chiffre et
sa catégorie ne se contredisent jamais : **332 changements**, les 10 écarts étant des communes à 44,95-44,99 %
ou 19,96 % de naturel, affichées 45,0 % ou 20,0 %. Les mêmes 17 passent à l'urbanisé.

| Transition | Nombre |
|---|---|
| Forte présence naturelle → Occupation mixte | 154 |
| Occupation mixte → À dominante agricole | 75 |
| Forte présence naturelle → À dominante agricole | 62 |
| Forte présence naturelle → Majoritairement urbanisé | 17 |
| Occupation mixte → Majoritairement urbanisé | 12 |
| Occupation mixte → Faible présence d'espaces naturels | 10 |
| Faible présence → Majoritairement urbanisé | 1 |
| Faible présence → À dominante agricole | 1 |

| Catégorie | Avant | Après |
|---|---|---|
| Forte présence naturelle | 23 088 | 22 855 |
| À dominante agricole | 9 295 | 9 433 |
| Occupation mixte | 1 662 | 1 719 |
| Majoritairement urbanisé | 631 | 661 |
| Faible présence d'espaces naturels | 67 | 75 |

Eau ≥ 1 % : 6 087 communes ; ≥ 10 % : 476 ; ≥ 50 % : 21 ; maximum 71,4 % (Paimbœuf). Sans eau (28 656
communes), parts et catégorie sont strictement identiques.

Les 17 : Marignane, Pérols, Sète, Châteauneuf-d'Ille-et-Vilaine, Saint-Égrève, Batz-sur-Mer, Paimbœuf,
Combleux, Gâvres, Larmor-Plage, Bergues, Albigny-sur-Saône, Vaulx-en-Velin, Gonfreville-l'Orcher, Thomery,
Vaires-sur-Marne, L'Île-Saint-Denis.

## 4. Échantillon (avant → après, parts des terres)

| Commune | Eau | Naturel avant | Naturel terres | Urbanisé terres | Catégorie avant → après |
|---|---|---|---|---|---|
| Sète | 50,6 | 67,3 | 33,8 | 50,4 | Forte présence naturelle → Majoritairement urbanisé |
| Palavas-les-Flots | 67,7 | 83,5 | 48,9 | 49,2 | Forte présence naturelle (inchangée, à la limite) |
| Pérols | 32,6 | 53,3 | 30,7 | 61,9 | Forte présence naturelle → Majoritairement urbanisé |
| Marignane | 13,7 | 50,3 | 42,4 | 51,3 | Forte présence naturelle → Majoritairement urbanisé |
| Batz-sur-Mer | 44,4 | 64,5 | 36,2 | 60,1 | Forte présence naturelle → Majoritairement urbanisé |
| Saintes-Maries-de-la-Mer | 69,0 | 91,3 | 71,9 | 4,2 | Forte présence naturelle (inchangée) |
| Annecy (lac) | 4,2 | 59,6 | 57,8 | 40,8 | Forte présence naturelle (inchangée) |
| Châtelaillon-Plage | 0,2 | 36,5 | 36,4 | 49,3 | Occupation mixte (inchangée) |
| Bony | 0,0 | 6,8 | 6,8 | 4,1 | À dominante agricole (inchangée) |
| Janville-en-Beauce | 0,0 | 2,8 | 2,8 | 7,2 | À dominante agricole (inchangée) |
| Chartres | 0,0 | 24,3 | 24,3 | 67,8 | Majoritairement urbanisé (inchangée) |
| Levallois-Perret | 4,9 | 8,9 | 4,2 | 95,5 | Majoritairement urbanisé (inchangée) |
| Corte | 0,2 | 99,1 | 99,1 | 0,8 | Forte présence naturelle (inchangée) |

## 5. Correction (lecture Territoire, sans recalcul raster)

`src/lib/territoire/facts.ts` · `landShares(brut_pct, composition)` :
- `land.composition` : six postes terrestres, **en % des terres** (`100 − eau`) ; l'eau n'y figure plus.
- `land.water_share` (nouveau) : part du contour communal couverte d'eau, comptée à part.
- `land.natural_share` : milieux naturels terrestres en % des terres = (brut − eau) / (100 − eau).
- `land.category` : même grille (50 / 45 / 50 / 20), sur les parts des terres ; règle `land-category@2`.
- Données absentes : composition incomplète (un poste, eau comprise) ou `brut_pct` absent → aucune part,
  aucune catégorie ; terres < 10 % → aucune catégorie (aucune commune concernée aujourd'hui).
- Limites affichées : « couvert observé par satellite ; urbanisé = bâti, routes, parkings, surfaces
  imperméabilisées, pas seulement l'emprise des bâtiments ; pas l'artificialisation réglementaire OCS GE ».
- Registre `territoire-facts@2`, contrat de synthèse `territoire-synthese@5`.

Surfaces alignées : carte « Espaces naturels » (titre, définition, eau dite à part, rayon 15 km
« espaces naturels et eau confondus »), carte d'identité (`solDominant`), projection de synthèse
(`composition_des_terres_pct`, `part_eau_de_la_commune_pct`, définition), consigne du modèle, texte
déterministe (« … sur ses terres » + phrase sur l'eau dès 10 %).

## 6. Hors périmètre (eau toujours comprise), à suivre

- **Rayon 15 km** (`radius_pct`) et **score Où vivre** (`nature.score`, critère « Espaces naturels », trait
  distinctif « entourées d'espaces naturels ») : l'eau y reste comptée. La retirer exige le raster (absent) ;
  la carte le dit désormais. Lien naturel avec FUT-178.
- **Projet / dossier de décision** : `boisementPct` (`module-facts-map.ts`) lit `composition.foret` en % du
  contour ; le seuil de 70 % (`materiality-rules.ts`) serait franchi par 77 communes de plus hors eau. Non
  modifié ici : cela changerait des conclusions de dossiers Projet.
- **Où vivre, catégories rurales** (`comparateur-vie.ts`, agricole ≥ 30 %, forêt ≥ 35 %) : parts du contour.
  Non modifié (même raison : moteur du comparateur).

## 7. Données figées en production (lecture seule, 09/11/2026)

Projet Supabase `future·e` : `territory_facts_snapshot` = 34 snapshots, 16 communes (30/09 → 04/11) ;
`territory_synthesis` prêtes au contrat courant (@4) = 33, pour 16 communes, 48 appels modèle cumulés.
Une seule de ces communes change de catégorie : **Rochefort (17299)**, « Forte présence naturelle » →
« Occupation mixte » (7,7 % d'eau).

Le registre et le contrat changent : à la première visite après déploiement, chaque commune reçoit un nouveau
snapshot (nouvelle empreinte) et une nouvelle synthèse est générée **à la demande**, sous le garde de budget.
Coût maximal estimé : 16 communes × 3 horizons × ≤ 2 appels Sonnet ≈ 96 appels, en pratique ~1,5 appel par
synthèse comme aujourd'hui. Aucune migration, aucune suppression : les anciennes lignes restent en base,
orphelines (leur clé n'est plus demandée). Aucune régénération proactive n'est nécessaire.

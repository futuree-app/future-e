# FUT-182 · B3 — la nature autour des zones bâties, intégrée (10/11/2026)

PR applicative indépendante de #146 (rapport, scripts B1/B2) et de #148 (lot L0). Base : `main` 6972d5a4. **Rien n'est
publié : pas de fusion, pas de déploiement, pas de migration ; l'index de production n'est pas remplacé tant que la PR
n'est pas fusionnée.** Méthode, chiffres et décisions : rapport `docs/audits/2026-11-09-fut182-oso-national-phase-a.md`
(PR #146), parties III à V.

## 1. Ce qui change de méthode

| | Avant (index de `main`) | Après (cette PR) |
|---|---|---|
| Mesure du rang « Espaces naturels » | pixels naturels **eau comprise**, sur des **communes entières** retenues par la distance de leur centre (grille de 0,18°, sélections incomplètes) | **secteur habité** : autour de chaque zone bâtie OSO (classes 1-2, cellules de 100 m), part des milieux naturels dans les **terres** à 15 km au plus ; moyenne pondérée par le bâti, p10-p90 pondérés |
| Ce qui compte comme terre | classes 1-23 du contour (serres 24 ignorées) | classes 1-22 et **24 (serres, poste distinct, rattaché aux cultures)** ; eau (23) à part |
| Ce qui n'est pas mesuré | ignoré, sans trace | pixels sous contour communal français seulement ; mer, étranger (masque GISCO) et non-classé **nommés**, jamais « pas de nature » |
| Parts de la commune (Territoire) | composition du contour arrondie au dixième, eau retirée à la lecture | parts **exactes des terres** (comptes de pixels, trois décimales), seuils comparés **avant arrondi**, affichage **tronqué** au dixième |
| Paris, Lyon, Marseille | aucune OSO (repli ADEME) | la ville et ses 45 arrondissements, **chacun sur ses propres pixels** (partition exacte), **hors de l'univers des rangs** |
| Seuil de boisement (Projet) | forêt du contour, eau comprise, arrondie | forêt **des terres**, avant arrondi |

Le calcul hors ligne vit dans l'audit (`b1_comptes.py`, `b2_national.py --gisco`) ; `scripts/oso/integrer-oso-2023.py`
l'écrit dans l'index en vérifiant les empreintes des sorties (comptes `1b0c4849…`, secteur `2c2c2ff3…`), puis
`populate-mismatch-rank.mts --recalculer nature` refait les bandes. `scripts/populate-nature.py` (méthode A) n'est
plus la source du champ `nature`.

## 2. Conventions de classement (validées le 10/11/2026)

| Part du disque couverte par des terres et eaux françaises | Communes | Valeur | Score, rang, verdict | Ce que lit le lecteur |
|---|---:|---|---|---|
| ≥ 75 % | 33 173 | oui | oui | la mesure |
| 50 à 75 % | 1 233 | oui | oui | la mesure **et** sa limite géographique (« la mer occupe environ 31,8 % du rayon de 15 km ») |
| < 50 % | 329 | oui (terres françaises du rayon) | **non** : `score: null`, aucune bande, règle Projet « incertain », pas de trait | « Classement national non établi : la mer occupe environ 97,5 % du rayon… » |
| aucun bâti OSO | 8 | **non** | non | « Non calculable avec cette méthode » |
| arrondissements PLM | 45 | oui | non (hors univers) | la mesure, à leur grain |

La cause (mer, étranger, les deux) n'est dite que si le masque GISCO l'établit (≥ 80 % de ce qui manque) ; sinon la
phrase reste neutre (« hors du territoire français étudié »). Jamais « données manquantes », jamais « mesure incertaine ».
**Une commune sans classement ne récupère jamais un ancien score** : l'index n'en porte plus (`score: null`), les bandes
sont retirées par le recalcul, et le test `fut182-b3-oso.test.ts` vérifie les 382 entrées concernées (329 + 8 + 45).

## 3. Versions

| | Avant | Après | Pourquoi |
|---|---|---|---|
| Registre Territoire | `territoire-facts@2` | `territoire-facts@3` | parts exactes, serres, `land.natural_share_sector` remplace `land.natural_share_15km` |
| Contrat de synthèse | `territoire-synthese@7` | `territoire-synthese@8` | secteur habité transmis ; dette FUT-183 réglée (consigne et contrôle `nombre:arrondi-oso`) |
| Moteur | `engine-8` | `engine-9` | le rang nature et le boisement changent ce que le moteur conclut |
| Distribution « nature » | `mismatch-dist-2026-07-15` | `mismatch-dist-2026-11-10-nature` (34 406 communes, empreinte `9bac1dc1…`) | registre en ajout seul : l'ancienne identité reste pour les dossiers vendus |
| Échelle de fait | `radius_15km` | `built_areas_15km` | `radius_15km` reste lisible dans les snapshots figés |

**Une seule invalidation** : registre et contrat montent ensemble. Les synthèses `@1` à `@7` restent en base, jamais
servies (clé = empreinte + contrat) ; la régénération se fait à la consultation, sous le garde de budget existant.
**Aucun dossier vendu, snapshot figé ou artefact n'est réécrit** : un artefact `engine-8` garde son rang, sa
distribution et ses cartes ; le comparatif ne rapproche pas deux moteurs.

**Coordination FUT-184 (DENS7).** FUT-184 est « In Progress » sans branche publiée au 10/11. Il prévoit lui aussi une
montée du registre et du contrat. Ordre proposé : B3 d'abord (`@3`, `@8`), FUT-184 ensuite en `territoire-facts@4` et
`territoire-synthese@9`, rebasé sur B3, dans le même déploiement si possible pour garder une seule invalidation.

## 4. Tableau national avant / après (`avant-apres.json`, `scripts/oso/comparer-avant-apres.py`)

| | Avant | Après |
|---|---:|---:|
| Entrées avec `nature` | 34 743 | 34 788 (+ 45 arrondissements) |
| Communes avec un score nature | 34 743 | 34 406 |
| Scores changés (communes classées des deux côtés) | — | 21 486 ; ≥ 5 pts : 903 ; ≥ 10 : 122 ; ≥ 20 : 17 ; de − 39 à + 14 |
| Verdicts de rang changés (bandes publiées) | — | **1 037** : neutre → défavorable 212, défavorable → neutre 238, neutre → favorable 127, favorable → neutre 123, **→ sans classement 337** (favorable 82, neutre 221, défavorable 34) |
| Seuils de score franchis | — | 34 : 602 ; 40 : 625 ; 50 : 578 ; 55 : 544 ; 60 : 453 ; 66 : 329 ; 70 : 344 ; 88 : 182 |
| Trait distinctif nature (score ≥ 88) | 4 368 | 4 306 |
| Boisement ≥ 70 % (Projet) | 3 258 | 3 336 (+ 80 / − 2) ; 9,60 % des communes, « 10 % les plus boisées » vrai |
| `rural_agricole` (Où vivre, accueil) | 16 970 | 17 109 (+ 143 / − 4) |
| `rural_forestier` | 13 380 | 13 494 (+ 122 / − 8) |
| `land.category` (Territoire) | — | 50 communes changent, + 45 arrondissements désormais catégorisés |

**Correction d'un chiffre transmis.** La contre-revue a retenu « 74 communes favorables perdent leur verdict ». Ce
chiffre venait de la simulation de B2, qui recalculait les bandes depuis le score sur 34 735 communes. Sur les bandes
**réellement publiées** (ce que lit le Projet), elles sont **82**.

**Cas atypiques à connaître.**
- **La Rochelle** (47,2 % du disque sous contour français) et **Saint-Malo** (49,0 %) passent en « classement national non établi ». Granville aussi (44,4 %).
- Saintes-Maries-de-la-Mer : de 87 à 48, toujours classée (68,2 %, avec sa limite).
- Barzan (estuaire de la Gironde) : de 57 à 21.
- Grues : catégorie Territoire « agricole » par ses seules serres (7,3 % des terres), classe peu fiable.
- Rochefort : 44,7 % de terres naturelles (44,9 dans l'ancien index), toujours « Occupation mixte ».
- Bustanico, Grailhen, Bourg-d'Oueil : scores 100, 100 et 99, désormais « non calculable » (aucun bâti OSO détecté).

**Où vivre (référence FUT-147).** Sur les cinq projets et les quatre trios de la garde, seul « nature 2 + calme 2 » change
deux communes sur cinq (Isola et Corte remplacées par Saint-Martin-Vésubie et Lacaune) ; partout ailleurs, communes et
compatibilités sont identiques, seuls les libellés nature changent. La garde compare désormais à
`fut182-reference-comparateur.json` (capturée sur cette branche, sans la ligne « Incendies observés ») ; la référence
FUT-147 d'origine reste au dépôt, inchangée.

## 5. Parcours gratuits et payants

| Surface | Gratuit / payant | Conséquence |
|---|---|---|
| Territoire, carte « Espaces naturels » | gratuit (aperçu) et rapport | parts exactes (tronquées au dixième), serres comptées dans les terres agricoles et dites à part, phrase du secteur habité avec p10-p90 et limite ; PLM désormais en OSO |
| Territoire, synthèse rédigée | payant | régénérée à la consultation (`@8`) ; parts citées au dixième, contrôle `nombre:arrondi-oso` |
| Où vivre (tri, paliers, raisons, point fort, /qna) | gratuit | nouveaux scores ; communes sans classement : critère nature non mesuré (couverture partielle), aucun signal /qna |
| Projet (dossier) | payant | `engine-9`, nouvelle distribution ; « incertain » pour les communes sans classement ; limite géographique ajoutée aux cartes 50-75 % ; boisement sur les terres |
| Accueil | gratuit | catégories rurales recalculées sur les terres (`accueil-communes.json` : seul l'en-tête change, empreinte de l'index) ; les cartes Nature sont l'objet de #148 |
| AskFuture | payant | inchangé ici (lit l'ADEME ; sa ligne est corrigée par #148) |
| Dossiers déjà vendus | payant | **inchangés**, relus tels quels |

## 6. Tests

- Nouveau : `src/lib/fut182-b3-oso.test.ts` (20 tests). Il couvre :
  - l'index et ses conventions ;
  - « aucun ancien score ne revient » ;
  - Paris, Lyon, Marseille ;
  - le seuil de 10 % ;
  - Ouessant, Charnois, les 8 sans bâti, Grues et Héberville ;
  - les **phrases rendues** (fait, carte, projection, Où vivre, /qna, Projet) ;
  - les frontières FUT-183 au dixième.
- Réécrits sur le nouveau format, avec les mêmes intentions : `fut175-oso-eau`, `fut177-conclusions-sols`, `fut183-arrondis-oso`, `territoire/facts`, `fut179-plm-densite` (D7 : la ville et les arrondissements ont désormais leur OSO).
- Recalés sur les nouvelles valeurs, sans changement d'intention : `synthesis-checks` et `synthesis-deterministe` (Châtelaillon).
- Ajustés avec un commentaire FUT-182 : `fut147-non-regression` (référence recapturée ; lignes admises du contrat et du registre figées dans `fut182-lignes-admises.json`), `distributions-rang`, `fut185-libelles-densite`, `fut109`, `fut135`, `materiality-rules`, et les trois tests de version du moteur.
- Retiré : `fut178-portee-nature.test.ts`. Il ne gardait que la méthode transitoire (secteur de communes entières, eau comprise) que B3 supprime ; ses intentions encore valides sont reprises dans `fut182-b3-oso.test.ts`. Sa fixture reste, utilisée par l'audit historique FUT-178.

## 7. Points bloquants et réserves

1. **Conflits attendus avec #148 (L0)** dans `QuartierClimatData.tsx` (ligne des sources de la carte), et peut-être dans `comparateur-vie.ts` (promesses Où vivre). La résolution consiste à garder les deux côtés ; aucun texte de L0 n'est repris ici.
2. **`rural_agricole` / `rural_forestier`** gardent leur nom et leur condition de densité < 1 500 (hérités) : seuls les dénominateurs changent. Leur révision relève de FUT-184 et FUT-190 ; aucune phrase de cette PR ne les présente comme une ruralité.
3. **Fichiers hors dépôt** : la reproduction de l'index exige les comptes B1 et le secteur B2 (empreintes vérifiées par le script d'intégration) ; une contre-revue ne peut pas les régénérer sans le raster, les contours et le fichier GISCO (rapport § 48.6).
4. **Recette navigateur** sur l'environnement de test, avant tout GO, sur les cas de la contre-revue : Ouessant, Hœdic, Yeu, Ré, Charnois, une commune frontalière, une des 8, Arles, Saintes-Maries, Granville, Barzan, Grues, Héberville, Paris et un arrondissement, La Rochelle, Saint-Malo.

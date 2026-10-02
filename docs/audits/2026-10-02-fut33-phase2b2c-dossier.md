# FUT-33, phase 2B.2 C : le dossier lit la vérité littorale

Date : 02/10/2026. Base : `f34c1c0a`. Code : `096cf166`. Aucune capacité FUT-7 ne change. Aucune donnée Supabase
n'a été lue ni écrite (la lecture a été refusée par la protection de l'outil ; voir §8).

## 1. Consommateurs du dossier avant migration

| Usage | Fichier | Ce qu'il lisait |
|---|---|---|
| `nearSea` (avec N) | `hard-constraints.ts` (évaluateur partagé) | `distanceCoteKm` (distance du centre à une liste de villes côtières) |
| `excludeSea` | `hard-constraints.ts` | `distanceCoteKm >= excludeSeaMinKm` (15 km) |
| `farFromSea` | `hard-constraints.ts` | `distanceCoteKm` (repli provisoire de l'étape A) |
| `nearSea` sans N, mesure montrée | `hard-constraint-rules.ts` `mesureSansSeuil` | `distanceCoteKm` + `coast-proximity-v1` |
| textes et preuves | `hard-constraint-rules.ts` | « du littoral », preuve `commune.distanceCoteKm`, « au moins 15 km de la côte » |
| préférence `proximite_mer` (alignement / écart) | `coast-rules.ts` + `coast-facts.ts` | `distanceCoteKm`, convention `coast-proximity-v1` |
| préférence `proximite_mer` confirmée | `condition-rules.ts` `mesureMer` | `distanceCoteKm` |
| faits de la commune | `module-facts-map.ts` | `distance_cote_km` → `distanceCoteKm` |
| registre FUT-8 | `conventions.ts` | `littoral:15km` (historique) |
| libellés | `criterion-labels.ts`, `project-view.ts` | « depuis le centre de la commune », « l'éloignement de la mer » |
| version | `PRODUCT_CONVENTIONS_VERSION`, `ENGINE_VERSION` | `hc-conv-2`, `engine-2` |

## 2. Question → grain → vérité

| Question | Grain | Ancienne vérité | Nouvelle vérité |
|---|---|---|---|
| « à moins de N km de la mer » | adresse | centre → villes côtières | adresse → rivage marin 5 m (`merAuPoint`) |
| « à moins de N km de la mer » | commune | centre → villes côtières | point de référence → rivage marin (`mer_centre_km`) |
| « à au moins N km de la mer » | adresse / commune | centre → villes côtières | idem `nearSea` |
| « pas une commune littorale » | commune (même dans un dossier d'adresse) | au moins 15 km | `loi_effective` contient « Mer » |
| préférence `proximite_mer` | commune | `coast-proximity-v1` sur le proxy | `coast-proximity-v2` : mêmes seuils (15 / 100 km), mesure `mer_centre_km` |
| préférence `eloignement_mer` | – | – | non mesurée au dossier (aucune règle, aucun verdict) |

## 3. `excludeSea`

`evaluateExcludeSea` lit `communeLittoraleMer` (de `loi_effective`, héritage PLM compris). Inconnu → non examiné,
jamais « non classée ». Phrases : « Arles est classée « Mer » au titre de la loi Littoral. » / « … n'est pas
classée … ». « Données et limites » : « futur•e lit « ne pas habiter le littoral » comme : hors des communes
classées « Mer » au titre de la loi Littoral. Ce classement est celui de la commune ; il ne dit rien de la distance
de votre logement au rivage. » `excludeSeaMinKm` est supprimé ; `littoral:15km` remplacée par
`littoral:loi-littoral-mer` (toujours « historique » : rien ne devient tranchable). La preuve reste au grain
commune, même dans un dossier d'adresse.

## 4. `nearSea`

Une seule fonction, `mesureMerEvaluee(ctx, c)` : au point d'adresse, `ctx.merAuPoint` et rien d'autre ; au point
de référence, `mer_centre_km`. Le N est celui du lecteur. Phrases : « Cette adresse se situe à environ 5,7 km du
rivage marin. » / « Le point de référence de Bordeaux se situe à environ 39,4 km du rivage marin. » Sans N, la
mesure se montre (mêmes seuils `coast-proximity-v2` pour le signal), au point évalué, ou pas du tout. Le geste
« Mesurez la distance depuis l'adresse visée » ne s'affiche que si la mesure vient du point de référence.

## 5. `farFromSea`

Même mesure, même grain, même invariant. N'existe qu'avec un nombre (étape A). « Cette adresse se situe à environ
24,3 km du rivage marin, en deçà des 30 km au moins qu'indique votre projet. »

## 6. Calcul à l'adresse

`src/lib/mer-rivage.ts` (pur) : projection WGS84 → Lambert 93 (formule IGN), index en grille de 5 km, distance
point → segment, anneaux croissants jusqu'à certitude ; `null` hors de portée. `src/lib/server/rivage-mer.ts` :
lecture de `data/mer/rivage-5m.f32.gz` une fois par instance, sans réseau ; un échec rend `unavailable` (jamais une
distance) et n'est pas mémorisé. `territory-facts.ts` ne calcule `merAuPoint` que si le point est une adresse ET
qu'une contrainte de distance à la mer est déclarée. Fichier tracé pour `/rapport`, `/api/dossier/actualiser`,
`/api/stripe/webhook` (vérifié dans les `.nft.json` du build).

Écart à la géométrie de référence (rivage complet, `scripts/mer/reference_adresses.py`) : moins de 6 m sur 14
points (front de mer, intérieur de commune côtière, estuaire, lagune, golfe, intérieur).

## 7. Provenance

`MER_PROVENANCE` (hard-constraints.ts) : « Limite terre-mer © Shom-IGN, 2021, coupée aux limites transversales de
la mer », version `mer-v2`, tolérance 5 m. La mesure d'adresse porte `version: "mer-v2"` et `grain: "address"`.

## 8. Anciens projets

Décision : aucun `excludeSea: true` ancien n'est réinterprété en silence.

Je n'ai pas pu compter les projets : la lecture de la base de production a été refusée par la protection de
l'outil. Script en LECTURE SEULE, à lancer par le porteur :

    node scripts/mer/audit-anciens-projets.mts .env.local            # comptes, aucun identifiant imprimé
    node scripts/mer/audit-anciens-projets.mts .env.local --reparser # + ce que le parseur actuel en ferait

Ce qu'il faut savoir pour décider :
- Le texte d'origine (`rawText`) est conservé dans `user_profiles.user_project` (il survit même à un parse raté).
  Un reparse est donc possible dès qu'il est présent.
- Rien ne presse : un projet ancien n'est relu qu'au prochain dossier (génération ou actualisation). Les dossiers
  déjà figés gardent leur texte.
- Proposition : (1) lancer l'audit ; (2) pour chaque projet `excludeSea` avec texte, montrer le reparse ; (3) si
  l'intention change (« loin de la mer » → préférence), demander au lecteur au prochain passage plutôt que de
  réécrire ; sans texte, demander. Aucune écriture avant validation.

## 9. Snapshots et péremption

- Un dossier figé n'est jamais réécrit : son texte, ses preuves et sa version (`engine-2`, `hc-conv-2`) restent.
- `projetAChangeMateriellement` ne bouge pas : la signature lit le projet, pas les données. Aucun dossier vendu
  n'est déclaré périmé par cette migration (un projet inchangé reste « à jour » au sens du projet).
- `ENGINE_VERSION` → `engine-3`, `PRODUCT_CONVENTIONS_VERSION` → `hc-conv-3` : une nouvelle génération ou une
  actualisation lit la nouvelle vérité et le dit ; la comparaison de deux dossiers de versions différentes affiche
  sa réserve existante (« pas le même moteur »). Aucun changement de politique globale.
- Limite assumée : un dossier `engine-2` qui porte une condition mer repose sur l'ancien proxy et ne se déclare pas
  dépassé. Seule sa version le dit. Le signaler au lecteur (« une analyse plus précise est disponible ») serait une
  décision produit séparée.

## 10. Performance (`scripts/mer/fixtures/rivage-prod-2b2c.json`)

Fichier 2,29 Mo (6,56 Mo décompressé), 410 002 segments. À froid : lecture et décompression 38 ms, index 36 ms
(74 ms en tout, une fois par instance, et seulement si une contrainte mer est déclarée). Mémoire ≈ 15 Mo.
Latence sur 5 000 points tirés en France : p50 0,35 ms, p95 2,1 ms, p99 3,0 ms, max 8,3 ms.

## 11. Tests

`src/lib/fut33-dossier-2b2c.test.ts` (12) : distance de production contre la référence ; deux adresses d'une même
commune ; décision sur la distance d'adresse ; invariant « jamais le centre à l'adresse » (comportement ET code) ;
cas communes (Lannion, Châtelaillon, Bordeaux, Caen, Arles, Narbonne, Vannes) ; loi Littoral (Annecy, Rochefort,
Bordeaux, Arles, Marseille 7e) ; grain des preuves ; invariants (plus de 15 km ni de proxy au dossier, table des
capacités inchangée, libellés de l'étape D intacts, aucune écriture ni réseau dans le calcul d'adresse,
performance de l'index). Tests existants migrés (fixtures `merCentreKm` / `mer_centre_km`, textes « rivage
marin », conventions v2). Suite complète : 1 961 / 1 961.

## 12. Legacy du dossier restant

Aucun : `excludeSeaMinKm`, `distanceCoteKm`, `distance_cote_km`, « au moins 15 km », `coast-proximity-v1` et
`littoral:15km` ne figurent plus dans `src/lib/decision/` ni dans `hard-constraints.ts` (test). Les seuils
15 / 100 km de `coast-proximity-v2` sont conservés tels quels ; les resserrer (ils étaient calibrés sur
l'imprécision du proxy) est une convention à discuter, hors FUT-33.

## 13. Laissé à l'étape D

- `comparateur-vie.ts` : catégories `littoral` / `littoral_mediterranee` / `littoral_atlantique` (≤ 5 km + tables
  départementales), `buildSignature` et bloc ligne 1028 (≤ 15 km), raison de carte `proximite_mer` (paliers 2 / 8 km),
  `metrics.distance_cote_km` des résultats, paliers du Dossier comparatif dérivés du score.
- `commune-categories.ts` (`DEPT_MEDITERRANEE`, `DEPT_LITTORAL_ATLANTIQUE`), `littoral.ts` (`FACADE_BY_DEPT`).
- `territory-identity.ts`, `territoire/facts.ts`, `server/territoire-snapshot.ts` (identité et passeport Territoire).
- Puis retrait de `distance_cote_km` de l'index et de `IndexCommune`.

Promotions de capacité possibles plus tard, par décision séparée (FUT-7 / FUT-8) : `nearSea` et `farFromSea` avec
un N dit, à l'adresse, ont désormais la donnée pour trancher ; `excludeSea` a un critère exact (le classement).

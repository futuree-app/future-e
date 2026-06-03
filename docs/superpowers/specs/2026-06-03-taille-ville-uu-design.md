# Chantier C — taille de ville / isolement sur l'unité urbaine — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Principe directeur (porteur)

> Tout ce qui relève de la **taille de ville**, de l'**isolement** ou du **bassin de vie** doit
> basculer de la commune vers l'**unité urbaine** (UU).

Le `cadre_calme` fait exception : il reste **local**, fondé sur la densité communale (le calme
est une réalité du lieu, pas de l'agglomération).

## Problème

Aujourd'hui, `eviter_isolement`, `sizeRelativeTo` et `communeSize` se mesurent sur la commune
seule. Conséquences fausses : une commune de 2 000 hab dans l'agglomération lyonnaise est jugée
« isolée » alors qu'elle est au cœur d'une métropole ; « plus petit que Lyon » compare des
populations communales (Lyon = 522 k) au lieu d'agglomérations (~1,6 M) — la « limite B » assumée
du chantier exclusion ville. Et aucune intention qualitative de taille (« une petite ville »,
« pas une métropole ») n'existe.

## Donnée : taille d'agglomération

`c.uu` (code unité urbaine, UU2020) est déjà dans l'index. La **population d'UU** est calculée
**au chargement de l'index** (somme de `c.population` par `c.uu`, mémoïsée à côté de
`indexCache`) : pas de regénération de l'index (57 Mo), pas de source externe.

```
tailleVille(c) = popUU(c.uu)   si c.uu existe
               = c.population   sinon (commune hors UU = son propre bassin)
```
Arrondissements PLM : `c.uu` pointe l'UU parente → ils héritent de la population de
l'agglomération (Paris/Lyon/Marseille) → jamais isolés, toujours « grande ville / métropole ».

## Bornes d'UU (produit / éditoriales, pas vérité sociologique)

| Catégorie       | Population d'UU |
|-----------------|-----------------|
| village / bourg | < 2 000         |
| petite ville    | 2 000 – 25 000  |
| ville moyenne   | 25 000 – 100 000|
| grande ville    | 100 000 – 500 000|
| métropole       | > 500 000       |

## #1 — Isolement sur l'UU

`eviter_isolement` : `subScore` passe de `lerp(ISOLEMENT, c.population)` à
`lerp(ISOLEMENT, tailleVille(c))`. La courbe `ISOLEMENT` est conservée (saturée à 100 pour les
grandes agglos). `REASON_POS`/`REASON_NEG` reformulées pour parler du bassin de vie / de
l'agglomération plutôt que de la seule population communale.

## #2 — Taille relative sur l'UU (limite B)

`sizeRelativeTo` (« plus petit/grand que {ville} ») et `communeSize` (min/max) évaluent
`tailleVille` :
- la **référence** utilise la population d'UU (Lyon → pop d'UU, pas 522 k communaux) ;
  `PLM_VILLES` expose la pop d'UU des trois villes à arrondissements ;
- le filtre `passesHard` compare `tailleVille(c)` aux bornes min/max.
Le champ `hardConstraints.communeSize` est renommé `villeSize` (sémantique d'agglo) ; le parse
et le moteur sont mis à jour de façon cohérente.

## #3 — Sémantique taille de ville (préférences graduées, cloche par composition)

Deux nouvelles clés **monotones** opt-in (cohérentes avec le moteur, dont tous les subScore sont
monotones) :

- **`eviter_grandes_villes`** : `subScore` **décroît** avec `tailleVille` (petit = haut).
  Courbe `lerp` décroissante calée sur les bornes (plein jusqu'à ~petite ville, chute vers
  grande ville / métropole).
- **`prefere_grande_ville`** : `subScore` **croît** avec `tailleVille` (grand = haut). Courbe
  croissante (faible pour village/petite ville, haut pour grande ville / métropole).

**Cloche par composition** (pas de sous-score « ville moyenne » dédié) :
- `eviter_isolement` (recadré UU) = **plancher** (pénalise trop petit) ;
- `eviter_grandes_villes` = **plafond** (pénalise trop grand) ;
- leur combinaison fait émerger les petites villes solides et les villes moyennes.

## Parse (`parse/route.ts`)

- « petite ville », « ville à taille humaine », « pas une métropole », « éviter les grandes
  villes » → `eviter_grandes_villes`.
- « ville moyenne » → `eviter_grandes_villes` **+** `eviter_isolement` (plafond + plancher).
- « une grande ville », « une métropole », « du dynamisme urbain » → `prefere_grande_ville`.
- « plus petit / plus grand que {ville} », « moins de N habitants » → **contraintes dures**
  (`sizeRelativeTo` / `villeSize`), désormais évaluées en **population d'UU**.

## Moteur (`comparateur-vie.ts`) — récapitulatif des changements

- Helper `popUUTable()` (mémoïsé) + `tailleVille(c)`.
- `eviter_isolement` : subScore sur `tailleVille`.
- `subScore` : 2 cas ajoutés (`eviter_grandes_villes`, `prefere_grande_ville`).
- `PREFERENCE_KEYS` (+2) → donc `REASON_POS`, `REASON_NEG`, `PREFERENCE_LABELS`,
  `PREFERENCE_INTERPRETATIONS` (+2 chacun, filet typé).
- `passesHard` + résolution `sizeRelativeTo` : `tailleVille` au lieu de `c.population` ;
  `communeSize` → `villeSize` ; `PLM_VILLES` pop d'UU.
- Courbes `lerp` : `GRANDE_VILLE_MIN` (décroissante) et `GRANDE_VILLE_MAX` (croissante) calées
  sur les bornes.
- Signaux ambiants : `eviter_grandes_villes`/`prefere_grande_ville` ne sont **pas** ajoutés
  (la taille est un axe de choix explicite, pas une question « et côté X ? » ; YAGNI).

## Libellés / gloses

- `PREFERENCE_LABELS` : `eviter_grandes_villes` → « une ville à taille humaine » ;
  `prefere_grande_ville` → « une grande ville ».
- `REASON_POS`/`NEG` : exprimées en taille d'agglomération (ex. « ville à taille humaine » /
  « grande agglomération » ; « petit bassin » / « métropole »).
- `PREFERENCE_INTERPRETATIONS` : honnêtes, « taille de l'agglomération (unité urbaine), pas la
  seule commune ».

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. `curl /match` :
   - `eviter_isolement` : une commune de banlieue d'une grande agglo (ex. petite commune de
     l'UU de Lyon) n'est plus pénalisée comme isolée ; une commune rurale hors UU l'est.
   - `eviter_grandes_villes` : petites villes autonomes en tête, pas des villages ni des
     métropoles (cloche émergente avec le plancher de viabilité).
   - `prefere_grande_ville` : métropoles en tête.
   - « plus petit que Lyon » (sizeRelativeTo) : compare des agglos (une ville moyenne passe, une
     autre grande agglo est exclue).
3. `curl /parse` : « une petite ville » → `eviter_grandes_villes` ; « une ville moyenne » →
   `eviter_grandes_villes` + `eviter_isolement` ; « une grande ville dynamique » →
   `prefere_grande_ville` ; « plus petit que Bordeaux » → contrainte de taille (UU).
4. Rural non pénalisé quand aucune intention de taille n'est exprimée.

## Hors périmètre

- `cadre_calme` (densité communale) : inchangé.
- Statut INSEE ville-centre / banlieue / isolée : non utilisé (la population d'UU suffit en V1).
- Sous-score « ville moyenne » dédié : non (cloche par composition).
- Aire d'attraction des villes (AAV, bassin de vie plus large que l'UU) : V2 éventuelle.

## Notes doctrine

- Cf. [[project_exclusion_ville_uu]] (c.uu dans l'index, PLM_VILLES, limite B que ce chantier
  tranche), [[parcours_doctrine]] (opt-in, ne pas pénaliser le rural),
  [[feedback_no_em_dash]] (pas de tiret cadratin).
- Bornes d'UU = repères produit, pas vérité sociologique stricte (à assumer dans les gloses).

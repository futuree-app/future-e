# Vrai sujet inondation (GASPAR CatNat + TRI)

Date : 2026-06-03
Statut : design validé, prêt pour plan d'implémentation
Roadmap : item #5

## Contexte

Constat QA : aujourd'hui « sans inondation » est traduit par le parse en
`faible_precip_extremes` (percentile de pluies intenses, proxy). C'est TROMPEUR : le risque
d'inondation réel dépend de la topographie, des rivières, du ruissellement, pas seulement de
l'intensité des pluies (cas Lens, qui inonde sans être un point chaud de pluies extrêmes).

Le projet a déjà `georisques.flags.flood` au niveau RAPPORT (booléen GASPAR « risque inondation
déclaré », appel live par commune). Le #5 fait passer le CRITÈRE comparateur du proxy pluie à un
vrai signal GASPAR, précalculé dans l'index (national, zéro appel runtime).

Distinction importante : il y a deux « inondation » dans le projet, qui restent SÉPARÉS :
- le module `/inondation` (score DRIAS précipitations, `populate-communes-tension.js`) : INCHANGÉ ;
- le critère comparateur : c'est lui qui change de source ici.

## Décisions validées (porteur)

- **Nouvelle clé** `faible_risque_inondation`, opt-in, **préférence graduée** (ranking).
  Aucune exclusion dure, aucun effet par défaut, ne pénalise jamais le rural.
- `faible_precip_extremes` **CONSERVÉE** dans son sens LITTÉRAL (moins de pluies intenses /
  orages). N'est PLUS un proxy inondation.
- Le parse **dissocie** explicitement les deux notions (voir routing).
- Module `/inondation` (DRIAS) inchangé.

### Signal (V1 = fréquence CatNat ; TRI différé)

`c.inondation = { catnat: number; tri: boolean; risque: number }` :
- **catnat** : nombre d'arrêtés de catastrophe naturelle de type INONDATION FLUVIALE/PLUVIALE
  par commune (débordement, ruissellement, coulées de boue, crues). **La submersion marine
  est EXCLUE** (« chocs mécaniques liés à l'action des vagues ») : elle relève du chantier
  littoral, on ne mélange pas deux familles de risque.
- **tri** : réservé pour le bonus de gravité (Territoire à Risque important d'Inondation).
  **V1 : toujours false** (pas de source nationale TRI propre trouvée ; à brancher plus tard
  sans rupture). Champ conservé dans le schéma dès maintenant.
- **risque** : 0-100, plus haut = plus exposé. V1 = percentile national de `catnat`. Quand le
  TRI sera disponible, on relèvera `risque` pour les communes en TRI (formule tunable).

### Acquisition des données (décision porteur)

- **CatNat** : pas de bulk national à jour (le seul dataset national data.gouv date de 2016).
  Acquisition par **loop API GASPAR `/gaspar/catnat` par commune** (~35k communes), one-shot,
  avec **cache/reprise** (relançable). Données à jour, endpoint déjà éprouvé dans `georisques.ts`.
- **TRI** : aucune liste nationale propre trouvée (seulement des fichiers régionaux). **Différé** :
  V1 livre la fréquence CatNat seule (déjà un vrai discriminant, capture Nîmes/Lens).

### Moteur

- `subScore(faible_risque_inondation) = 100 - c.inondation.risque` (risque faible → score haut ;
  risque élevé → score bas). `null` si pas de donnée.
- `REASON_POS` : « peu d'arrêtés CatNat inondation ».
- `REASON_NEG` : « historique CatNat inondation plus marqué ».
  (Libellés volontairement prudents : on ne prétend pas mesurer toutes les inondations réelles,
  seulement l'historique CatNat + TRI.)

### Gloses (verbatim, obligatoires)

`PREFERENCE_INTERPRETATIONS` (+ `PREF_LABELS` synthèse pour la nouvelle clé) :
- `faible_precip_extremes` : « pluies intenses projetées, pas le risque d'inondation réel »
  (passe de `null` à cette glose explicite : c'est là que le moteur était ambigu).
- `faible_risque_inondation` : « historique d'arrêtés CatNat inondation et territoires à
  risque important, pas une garantie d'absence de crue ».

### Parse (routing)

- « inondation », « inondable », « zone inondable », « crue », « débordement », « ruissellement »,
  « sans risque d'inondation » → préférence `faible_risque_inondation` (poids 2, ou 3 si essentiel).
- « pluies intenses », « orages violents », « épisodes de précipitations extrêmes », « grosses
  averses » → `faible_precip_extremes`.
- Retirer la mention « (proxy inondation) » de `faible_precip_extremes` dans le prompt.

## Architecture

```
GASPAR CatNat (arrêtés inondation, hors submersion marine) + liste TRI
   bulk data.gouv/Géorisques (URL/format confirmés au plan)
        │  scripts/populate-inondation.py (ou .mjs)
        │  par commune : compte arrêtés flood, flag TRI, percentile → risque 0-100
        ▼
data/comparateur-index.json : c.inondation = { catnat, tri, risque }
        │  loadIndex() (inchangé)
        ▼
comparateur-vie.ts
   PREFERENCE_KEYS += faible_risque_inondation
   subScore : 100 - c.inondation.risque
   REASON_POS/NEG, gloses
        ▲
parse/route.ts : « inondation/crue/inondable » → faible_risque_inondation ;
   « pluies intenses/orages » → faible_precip_extremes (proxy retiré)
comparateur-labels.ts + synthesize : libellés + gloses des deux clés
```

## 1. Données — `scripts/populate-inondation.py`

- Source : GASPAR « catastrophes naturelles » (arrêtés CatNat, par commune, avec type de
  risque) + liste des communes en TRI. Acquisition BULK (téléchargement), pas d'appel runtime.
  URL/format exacts confirmés au plan.
- Filtrage CatNat : ne garder que les types FLUVIAL/PLUVIAL (débordement, ruissellement,
  coulées de boue, crues). EXCLURE submersion marine et tout risque non-inondation
  (sécheresse, mouvement de terrain, séisme…).
- Par commune : `catnat` = nb d'arrêtés flood ; `tri` = booléen. `risque` = percentile national
  de `catnat`, relevé d'un cran si `tri` (formule calée au plan). Patch index `c.inondation`.

### Points à vérifier au plan
- libellés/codes exacts des risques CatNat inondation vs submersion marine (filtrage) ;
- couverture (communes sans aucun arrêté = risque bas, pas null) ;
- source TRI (fichier communes TRI) et jointure sur code INSEE ;
- échelle de `catnat` (capping vs percentile) pour que le gradient soit lisible.

## 2. Moteur — `comparateur-vie.ts`

- `PREFERENCE_KEYS` += `"faible_risque_inondation"`.
- `IndexCommune` : `inondation?: { catnat: number; tri: boolean; risque: number } | null`.
- subScore : `case "faible_risque_inondation": return c.inondation == null ? null : 100 - c.inondation.risque;`
- `REASON_POS.faible_risque_inondation = "peu d'arrêtés CatNat inondation"`.
- `REASON_NEG.faible_risque_inondation = "historique CatNat inondation plus marqué"`.

## 3. Parse — `parse/route.ts`

- Schéma : `faible_risque_inondation` fait partie de `PREFERENCE_KEYS` (enum auto via spread),
  rien à ajouter au schéma.
- Prompt : ajouter la ligne `faible_risque_inondation` à la LISTE, retirer « (proxy inondation) »
  de `faible_precip_extremes`, et ajouter le routing dissocié (TRADUCTION/LISTE).

## 4. Libellés & gloses

- `comparateur-labels.ts` : `PREFERENCE_LABELS.faible_risque_inondation = "un faible risque
  d'inondation"` ; `PREFERENCE_INTERPRETATIONS` : la glose `faible_risque_inondation` (verbatim)
  ET passer `faible_precip_extremes` de `null` à sa glose explicite (verbatim).
- `synthesize/route.ts` : `PREF_LABELS.faible_risque_inondation = "un faible risque d'inondation"`.

## 5. Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. Exécuter `populate-inondation.py` + témoins :
   - une ville à inondations chroniques (Nîmes, Lens, Arles) → `catnat` élevé, `risque` haut,
     subScore bas ;
   - une commune sèche d'altitude → `catnat` ~0, `risque` bas, subScore haut ;
   - une commune en TRI → `tri:true`, risque relevé.
3. `curl /parse` :
   - « je veux éviter les zones inondables » → `faible_risque_inondation`, PAS
     `faible_precip_extremes` ;
   - « moins de gros orages et de pluies violentes » → `faible_precip_extremes`, PAS inondation.
4. `curl /match` (`faible_risque_inondation`) : communes peu exposées en tête, reason « peu
   d'arrêtés CatNat inondation » ; rural sec non pénalisé quand le critère n'est pas demandé.

## Hors périmètre

- Submersion marine (chantier littoral, déjà séparé).
- Module `/inondation` DRIAS (inchangé).
- Risque parcellaire / adresse (reste au rapport).
- Exclusion dure des TRI (écartée : préférence graduée seulement).

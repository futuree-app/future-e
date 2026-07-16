# Passation — mismatch lot 4a (ensoleillement) LIVRÉ sur branche ; reste = lot 4b (douceur) + fusion + dettes

**Horodatage** : 2026-07-16 · **Branche** : `feat/mismatch-lot4a-ensoleillement` (au-dessus de `main` `7309071`,
**non poussée, non mergée**). **Aucune PR ouverte.** Lots 3a/3b déjà mergés sur `main`.

## Objectif en cours

Le **lot 4a de `mismatch`** est **livré sur la branche** (tests + build + sonde verts). Il étend
`relative_position` au critère `ensoleillement_recherche`, ajoute un **hook `limitation`** par critère, et
**corrige un bug de carte** qui masquait les limitations de tous les mismatchs. Reste : merge, puis **lot 4b**
(refonte canonique de `douceur_climat`, migration mesurée), la fusion de deux mismatchs, les dettes.

## Ce que fait le lot 4a

`ensoleillement_recherche` (rayonnement solaire ERA5-Land, percentile national uniforme) rejoint la forme
`relative_position` (symétrique : très ensoleillé → satisfied, peu → mismatch). La direction vient de la
préférence déclarée (« recherché »), même si le comparateur l'affiche « sans gagnant ». Couverture **+1**.

**Hook `limitation` par critère** : `MISMATCH_LABELS` gagne un champ `limitation?` optionnel, threadé sur le
`MismatchFact`. Ensoleillement porte : « Cette position décrit la climatologie solaire de référence issue de la
**réanalyse ERA5-Land, normale 1991-2020**. Elle ne constitue pas une projection de l'ensoleillement futur. »

## Bug pré-existant CORRIGÉ (révélé par la revue porteur)

`DossierDecisionSection.tsx` ne rendait `limitation` que pour `incompatibility`/`verification` : les limitations
des **mismatchs 2a (`named_absence`) et 3a (`absolute_measure`) étaient silencieusement jetées depuis leur
livraison**. Le lot ajoute `|| fact.role === "mismatch"` → 2a/3a/4a réparés. `buildConclusionPlan` ne lit
jamais `limitation` (0 occurrence) : les limitations sont **card-only par conception**, la conclusion ne les a
jamais vues. D'où **pas de bump de prompt** (grammaire inchangée).

## Fichiers (branche `feat/mismatch-lot4a-ensoleillement`, 6 commits)

- **Spec/plan** : `docs/superpowers/specs/2026-07-16-mismatch-lot4a-ensoleillement-design.md`,
  `docs/superpowers/plans/2026-07-16-mismatch-lot4a-ensoleillement.md` (révisés après revue).
- **Score** : `comparateur-scores.ts` — `ensoleillement_recherche` dans `MISMATCH_RANK_KEYS` + cas
  `mismatchRawScore` (`c.rayonnement_pct ?? null`, parité `subScore` prouvée par le test).
- **Labels/règle** : `mismatch-facts.ts` (type `MismatchLabel` + `limitation?`, entrée ensoleillement),
  `mismatch-rules.ts` (`MISMATCH_KEYS` + threading `...(lab.limitation ? { limitation } : {})`). Gardes :
  `MISMATCH_KEYS === MISMATCH_RANK_KEYS` + chaque clé a un label.
- **Carte** : `DossierDecisionSection.tsx` — rend `limitation` pour `mismatch`.
- **Index** : `populate-mismatch-rank.mts` — **diff sémantique** (0 bande existante modifiée sur 11 clés) +
  **preuve percentile↔rang** (`|rankMid - pct/100| max 0.25 pt`). `.gz` re-packé. `MISMATCH_DISTRIBUTION_VERSION`
  inchangée (= millésime). ensoleillement ex æquo max 1,0 % (distribution saine).
- **Sonde** : `probe-conclusion.ts` gagne le cas ensoleillement.

## Vérification (toute verte)

`node --test src/lib/*.test.ts src/lib/decision/*.test.ts` = **582/582** ; `node --test scripts/lib/*.test.mjs
scripts/*.test.mjs` = **22/22** ; `npx tsc --noEmit` = 0 ; `npm run build` exit 0 (2255/2255 pages).
**Sonde LANCÉE** : cas « ensoleillement » **5/5** au présent comparatif, aucune promesse future. Total 41/45
(rejets stochastiques hors ensoleillement).

## Déploiement Vercel (2 blocages, dont 1 réparé)

- **`engines` (RÉPARÉ, `d6a7a66` sur main)** : `package.json` déclarait `node: ">=25"` (calé sur la machine
  locale) ; Vercel ne propose que la LTS 24 et rejetait `>=25` AVANT le build (« Found invalid or discontinued
  Node.js Version »). C'était le vrai blocage répété. Corrigé en `"24.x"`. Le build passe maintenant (2255 pages).
- **Taille de fonction (À FAIRE côté Vercel)** : la fonction `rapport` fait **250,67 Mo** (limite 250). ≈ 239 Mo
  node_modules+code + 11 Mo index `.gz` embarqué (via `outputFileTracingIncludes` dans `next.config.ts`, lecture
  runtime légitime). Le ré-enrichissement d'index du lot 4a (+1 Mo pour la bande ensoleillement sur 34 788
  communes) a fait basculer une fonction déjà à ~249,7 Mo. **Décision porteur : activer
  `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`** (Production + Preview) dans les env vars Vercel puis redeploy (prérequis :
  Fluid Compute + Active CPU). Large Functions montent à 5 Go ; ne s'applique qu'aux fonctions >250 Mo. **Ne PAS**
  sortir l'index vers Blob (le gzip local garde code + données déployés ensemble, pas de désync de version, pour
  0,67 Mo le risque/bénéfice est mauvais).
- **Chantier d'amaigrissement séparé (à prévoir, cible 200-220 Mo)** : relancer avec
  `VERCEL_ANALYZE_BUILD_OUTPUT=1` (et/ou `VERCEL_BUILDER_DEBUG=1`) pour voir les plus gros contributeurs des
  ~239 Mo hors index ; auditer les imports serveur de `/rapport` (un barrel peut embarquer une pile IA/PDF
  entière) ; chercher les deps dupliquées / imports dynamiques larges. **Piste préférée** : un `decision-index`
  compact (seuls les champs que le dossier consomme) plutôt qu'un Blob — l'index complet reste pour le
  classement/exploration.

## Prochaine étape immédiate

1. **[Vercel] Activer `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`** + redeploy (débloque le déploiement).
2. **Merge** de `feat/mismatch-lot4a-ensoleillement` vers `main` + push (l'index `.gz` est committé). **FAIT**
   (`f0ec794`), + hotfix engines `d6a7a66`.
2. **Lot 4b — refonte canonique de `douceur_climat`** (décision porteur : UNE seule définition, refondue
   PARTOUT ; migration mesurée). L'audit a confirmé le problème : `douceur_climat = 0.6·douceur_hivernale +
   0.4·(été non extrême)`, et sa composante estivale (`NORTX35D_yr`) **double compte** avec `faible_chaleur`.
   Question ouverte à brainstormer : douceur **monotone** (plus chaud = plus doux) vs **confort autour d'un
   optimum** (→ renommer `confort_hivernal`/`hiver_tempere` ; la cloche `WINTER_MILD` actuelle à 9 °C relève du
   confort, pas de la douceur). Migration : recalcul du score partagé (comparateur + rankBand + deriveCategories
   + labels `Hivers doux`), mesure d'impact (corrélation avant/après, communes emblématiques), invalidation des
   artefacts. Puis la règle mismatch (`relative_position`).
3. Fusion de deux mismatchs en compromis narratif ; séparation `ProjectFit × DecisionConfidence`.

## Dettes / exclusions

- **`faible_secheresse`** reste **exclu par décision documentée** (`climat-facts.ts` : distribution continue
  67-160 j, aucun seuil défendable ; RGA chez Logement). La couverture ne vise pas 28/28 artificiellement.
- **`satisfied` de poids 1 compté comme favorable** (toutes règles) + **plancher implicite `eviter_isolement`**
  (`system_default`) : dettes transversales de provenance/orientation, non corrigées.
- **Mémoire `/memory`** : aucune fiche ne couvre encore les lots 2a/2b/3a/3b/4a ni les 4 formes de fondement
  (`relative_position` / `named_absence` / `absolute_measure` / `categorical_state`). Une fiche « formes de
  fondement mismatch » serait très utile.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, `project_dossier_decision.md`.
2. Spec + plan 4a ; specs 3a/3b/2a pour les autres fondements.
3. Code : `comparateur-scores.ts` (mismatchRawScore) → `mismatch-facts.ts` (MISMATCH_LABELS + limitation) →
   `mismatch-rules.ts` → correctif `DossierDecisionSection.tsx`.

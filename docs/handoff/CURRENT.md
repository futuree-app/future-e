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

## Prochaine étape immédiate

1. **Merge** de `feat/mismatch-lot4a-ensoleillement` vers `main` + push (l'index `.gz` est committé).
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

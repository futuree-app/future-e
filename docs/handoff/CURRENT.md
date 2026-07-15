# Passation — mismatch v1 livré (couverture 19/28) ; reste le lot 2 des états absolus

**Horodatage** : 2026-07-15 · **Branche** : `main` (nombreux commits d'avance, **non poussés**)
**Aucune PR ouverte.**

## ⚠ Rien de bloquant, mais à savoir

`data/comparateur-index.json` a été **enrichi** (rang mismatch) et fait maintenant **77,5 Mo** (avant :
67,7). L'enrichissement se rejoue avec `npx tsx scripts/populate-mismatch-rank.mts` (atomique, refuse sur
anomalie). Si une source de critère (nature, écoles…) est ré-enrichie, **relancer ce script** pour que les
bandes ne deviennent pas obsolètes.

**GitHub avertit** (non bloquant) que l'index dépasse 50 Mo. Il grossira encore au lot 2. Piste à instruire
avant que ça ne coince : Git LFS pour l'index, ou sortir `rankBands` dans un fichier annexe chargé à part.

## Ce qui a été livré : le chantier B, `mismatch`

Le dossier sait enfin dire qu'un lieu répond **mal** à une priorité déclarée, sans que ce soit
éliminatoire. **Couverture 9 → 19 critères sur 28.** Spec et plan :
`docs/superpowers/specs/2026-07-15-mismatch-design.md`, `docs/superpowers/plans/2026-07-15-mismatch.md`.

Vérifié à l'écran (dossiers réels) :
- **Roubaix**, projet nature+calme+vie locale+soins → orientation **`arbitration`** : nature « parmi les
  10 % les moins favorables de France », calme « les 5 % », mais vie locale et soins **favorables**. Le lieu
  est possible, il demande un arbitrage. Phrases **comparatives**, jamais absolues.
- **Digne-les-Bains** (bien dotée) → `favorable`, deux `satisfied` silencieux (la symétrie tient, pas de
  dégradation mécanique).
- **Arbigny** (nature et écoles médianes) → **`neutral`** : examiné, la couverture monte, aucune carte.

**Sonde : 20/20** (2 plans × 5 tirages). Sur le cas mismatch, le modèle nomme « les espaces naturels et le
cadre calme », en comparatif, parle d'**arbitrage** (jamais « à vérifier »).

## Les décisions structurantes (prises avec le porteur pendant le brainstorm)

1. **Un mismatch a le droit au percentile**, là où l'incompatibilité ne l'a pas : il dit une POSITION
   RELATIVE et l'assume, l'incompatibilité oppose un FAIT DU MONDE.
2. **Deux fondements de preuve** (spec) : `relative_position` (livré) et `absolute_state` (lot 2). Le rang à
   deux bornes gère les ex æquo : à cheval sur un seuil → `neutral`.
3. **`neutral` est une 7e orientation**, pas un `favorable` déguisé : absence de signal défavorable ≠
   correspondance favorable. `favorable` exige un signal favorable MATÉRIEL.
4. **Le poids gouverne la matérialité, jamais l'examinabilité** : poids 0 → not_applicable ; **poids 1 →
   examiné mais SILENCIEUX** (couverture +1, aucune carte, pas d'arbitrage) ; 2 → secondary ; 3 → structuring.
5. **`arbitration` dérive d'un ENSEMBLE MATÉRIEL** (`run.facts`, pas les évaluations) : 1 structurant ou 2
   secondaires. Jamais `decision_critical`.

## Invariants à ne PAS casser

- **Le dossier ne re-dérive AUCUNE formule de critère.** Le rang se bâtit sur `mismatchRawScore`
  (`comparateur-scores.ts`, lib pure), auquel `signatureScore` DÉLÈGUE pour les 10 clés : une seule
  implémentation, divergence structurellement impossible. Ne jamais recopier une formule ailleurs.
- **Aucune valeur brute inventée**, aucun `?? 0`/`?? 100` dans le dossier : `band == null` → `uncertain`.
- **Provenance `relativePosition.${key}`**, jamais `scores.*` (le dossier ne lit pas `scores`, qui replie).
- **Le rang est NATIONAL** (34 788 communes), jamais sur la shortlist.
- **`classifyPosition` a des gardes runtime** : NaN, hors `[0,1]`, `low > high` → `uncertain` (une bande
  d'index corrompue ne devient jamais un verdict).
- **Un mismatch se dit en COMPARATIF** (« moins bien qu'ailleurs »), jamais en absolu (« insuffisant »).
- **Le verdict compte le TOTAL** des mismatchs (pas l'affiché, cap 3).
- **`DECISION_NARRATIVE_PROMPT_VERSION = "v7"`** : les artefacts persistés d'avant sont invalidés (vérifié).

**Après toute modification** :
```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts   # 505 verts
npx tsc --noEmit                                            # 0
node --env-file=.env.local scripts/probe-conclusion.ts      # 20/20
```

## PROCHAINE ÉTAPE : le lot 2 de mismatch (les états absolus)

La forme `absolute_state` (spec §5.1) : mobilité quotidienne, mer, services, isolement, vie étudiante… Ce
sont les critères à **distribution dégénérée** (mobilité : 83 % des communes à 0) où le rang de position
n'apprend rien, mais où un FAIT ABSOLU parle (« aucun réseau de transports en commun à portée »). Chaque
critère demande sa doctrine (« que signifie une valeur de 0 ? »). Couverture 19 → 24+.

## Puis, en réserve

- **L'harmonisation du poids 1** sur les règles climat/santé (elles gardent `< 2` = `not_applicable` ; le
  mismatch, lui, examine au poids 1). Petit chantier transversal.
- **La fusion de deux mismatchs en tension en un compromis narratif** (spec §7).
- **La séparation `ProjectFit` × `DecisionConfidence`** (l'orientation reste un enum à 7 valeurs) : la
  refonte que le porteur a délibérément reportée. Elle touche le verdict, la sonde, l'UI, les analytics.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis `project_dossier_decision`.
2. La spec (§2 le percentile assumé, §3 le piège de `scores`, §4 les deux bornes, §8 l'orientation).
3. Code : `mismatch-facts.ts` (classification + gardes) → `mismatch-rules.ts` (la fabrique, la doctrine du
   poids) → `comparateur-scores.ts` (l'anti-divergence) → `criteria-registry.ts` (`arbitration`/`neutral`) →
   `conclusion-plan.ts` (le bloc `mismatches_found` + les verdicts).

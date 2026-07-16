# Passation — mismatch lot 3b (taille, categorical_state) LIVRÉ sur branche ; reste = 2 critères + fusion + dettes

**Horodatage** : 2026-07-16 · **Branche** : `feat/mismatch-lot3b-taille` (au-dessus de `main` `faa5e62`,
**non poussée, non mergée**). **Aucune PR ouverte.** Lot 3a (mer) déjà mergé sur `main`.

## Objectif en cours

Le **lot 3b de `mismatch`** est **livré sur la branche** (tests + build + sonde verts). Il ajoute la
**quatrième forme de fondement** : `categorical_state`, sur trois critères de taille. Reste : décider du
**merge**, puis les 2 derniers critères pour atteindre 28, la fusion de deux mismatchs, et les dettes.

## Ce que fait le lot 3b

La taille d'agglomération est une **identité** (« c'est un village »), pas un percentile : fondement
`categorical_state`. **Trois contrats DISTINCTS** :

| Catégorie (sur `tailleVille`) | `eviter_grandes_villes` | `prefere_grande_ville` | `eviter_isolement` |
|---|---|---|---|
| village (<2k)    | satisfied | mismatch  | **mismatch** |
| petite (2-25k)   | satisfied | mismatch  | neutral |
| moyenne (25-100k)| neutral   | neutral   | neutral |
| grande (100-500k)| mismatch  | satisfied | neutral |
| métropole (≥500k)| mismatch  | satisfied | neutral |

Les deux premières **symétriques** (la catégorie mesure directement la préférence) ; `eviter_isolement`
**asymétrique** (proxy faible : la taille établit un risque à l'extrémité basse, jamais l'absence d'isolement ;
jamais `satisfied`). Convention `agglomeration-size-v1`. Couverture **23 → 26 sur 28**.

## Décisions de correctness (revue porteur, 2 tours)

- **Provenance EXIGÉE** : `tailleVilleSource: "urban_unit" | "commune" | null` transporté. Le mot
  « agglomération » et « appartient à » ne sont employés qu'en source `urban_unit` ; source `commune` → « est
  classée comme … selon sa population communale », métropole → « une très grande ville ». Une catégorie **sans
  source prouvée → `uncertain`**, jamais un repli commune.
- **Invariant `value != null ⟺ source != null`** (`resolveTailleVille`) : une UU déclarée mais absente/invalide
  du cache → `{ null, null }`, jamais un repli communal silencieux (un test existant figeant l'ancien
  comportement a été mis à jour). Résolution UNIQUE (`tailleVilleResolvedOf`).
- **Fait source canonique unique** : les 3 règles émettent `sourceFactIds: ["territorySize.classification"]`
  (même état territorial) — prépare la fusion narrative (la cloche « petit mais pas isolé »).
- **Grain source-dépendant** : `EvidenceRef.grain` gagne `"unite_urbaine"` (source UU) vs `"commune"`.
- La convention **pilote** le classifieur (seuils lus, pas répétés) ; `AGGLOMERATION_CATEGORIES` = constante
  unique (type dérivé + validateur).

## Fichiers (branche `feat/mismatch-lot3b-taille`, 6 commits)

- **Spec/plan** : `docs/superpowers/specs/2026-07-16-mismatch-lot3b-taille-agglomeration-design.md`,
  `docs/superpowers/plans/2026-07-16-mismatch-lot3b-taille-agglomeration.md` (révisés après revue).
- **Lib pure** : `src/lib/decision/agglomeration-facts.ts` (`AGGLOMERATION_SIZE_CONVENTION`,
  `classifyAgglomerationSize`, `labelForCategory`, `categoryStatementFragment`).
- **Règles** : `src/lib/decision/agglomeration-rules.ts` (`AGGLOMERATION_RULES`, 3 règles
  `territoire.taille-*`, `TERRITORY_SIZE_FACT_ID`).
- **Provenance** : `resolveTailleVille` (`commune-attributes.ts`), `tailleVilleResolvedOf` + `tailleVilleSourceOf`
  (`comparateur-vie.ts`), `ModuleFacts.tailleVilleSource` + mapping obligatoire (`module-facts-map.ts`),
  résolution unique (`territory-facts.ts`).
- **Type** : `CategoricalStateBasis` + grain `unite_urbaine` (`decision-fact.ts`), validation (`materiality-rules.ts`).
- **E2E** : `agglomeration-e2e.test.ts` (arbitrage, satisfied/favorable, village sans « agglomération »,
  anomalie source null → uncertain).
- **Prompt** : `conclusion-prompt.ts` consigne taille (jamais « trop grand », jamais « la commune est isolée »),
  bump `v9 → v10` ; sonde `probe-conclusion.ts` gagne 2 cas (catégorie + isolement risqué).

## Vérification (toute verte)

`node --test src/lib/*.test.ts src/lib/decision/*.test.ts` = **578/578** ; `node --test scripts/lib/*.test.mjs
scripts/*.test.mjs` = **22/22** ; `npx tsc --noEmit` = 0 ; `npm run build` exit 0 (2255/2255 pages).
**Sonde LANCÉE** : cas « taille / catégorie » **5/5**, cas « taille / isolement (risqué) » **5/5** — aucun
tirage n'écrit « la commune est isolée » (le contrôle critique du lot). Total sonde 35/40 (rejets stochastiques
hors taille).

## Prochaine étape immédiate

1. **Merge** de `feat/mismatch-lot3b-taille` vers `main` + push (aucun index touché, `npm run build` vert).
2. **2 critères restants** pour atteindre 28 sur 28 (identifier lesquels dans le registre).
3. **Fusion de deux mismatchs en compromis narratif** : la cloche « petit mais pas isolé » (`eviter_grandes_villes`
   + `eviter_isolement` sur un village) est le cas d'école. Le fait source canonique
   `territorySize.classification` est prêt pour ça.
4. **Séparation `ProjectFit × DecisionConfidence`** (reportée porteur).

## Dettes ouvertes (transversales, NON corrigées ici)

- **`satisfied` de poids 1 compté comme favorable** dans `criteria-registry` (toutes règles, dont mer et taille) :
  le poids 1 ne devrait pas influencer matériellement l'orientation. Jumelle de la dette du 3a. Piste :
  `materialSatisfied = outcome==="satisfied" && weight>=2`, à auditer sur toutes les règles avant tout changement.
- **`eviter_isolement` en plancher implicite (baseline poids 1)** : une garde `system_default` ne devrait pas
  créer de favorable ; l'asymétrie (jamais `satisfied`) neutralise déjà le faux positif pour ce critère, mais la
  distinction explicite/implicite reste à traiter au niveau provenance/orientation.
- **Mémoire `/memory`** : aucune fiche ne couvre encore les lots 2a/2b/3a/3b. Envisager une fiche « formes de
  fondement mismatch » ou une ligne dans `project_dossier_decision`.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, `project_dossier_decision.md`.
2. Spec + plan 3b (ci-dessus) ; specs 3a/2a pour les autres fondements.
3. Code : `agglomeration-facts.ts` → `agglomeration-rules.ts` → `materiality-rules.ts` (REGISTRY + validation) ;
   provenance : `commune-attributes.ts` (`resolveTailleVille`) → `comparateur-vie.ts` (`tailleVilleResolvedOf`)
   → `territory-facts.ts`.

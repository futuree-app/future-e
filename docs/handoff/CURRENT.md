# Passation — chantier « prose de la conclusion du dossier », Tasks 1-6 TERMINÉES

**Horodatage** : 2026-07-21 · **Branche** : `feat/prose-conclusion-dossier`
(9 commits au-dessus de `main`=`514acea`, qui est poussé ; la branche N'EST PAS poussée, aucune PR).

## Objectif (atteint)

Corriger les défauts de prose du dossier « En une minute » validés sur le cas Toulouse (relecture
ChatGPT du porteur, rapports editorial-writer + design-critic, contre-relecture ChatGPT des rapports).
Plan exécuté en TDD : `docs/superpowers/plans/2026-07-17-prose-conclusion-arbitrage.md` (6/6 tâches cochées).

## Fait dans cette session (Task 6, commit `3f9d514`)

Passe éditoriale mismatch + chaleur, en TDD, un seul commit feature avec les 2 rapports d'agents :

- **Chaleur** : le SUJET porte l'unité, la trajectoire n'écrit que le nombre (fini « jours jours jours ») ;
  la 2e trajectoire hérite du cadre (`heriteCadre` dans `trajectoirePhrase`, « de 33 à 69 par an », sans
  redire période ni horizon) ; la traduction charnelle perd son absolu (« le corps peine à récupérer »,
  option validée par le porteur, plus « ne récupère plus »).
- **Chips d'unité** : bug corrigé. `countNoun` (jour/nuit) par métrique dans `CLIMAT_METRICS`, porté dans
  `ClimatAxe` ; `fmtClimatCount` remplace `fmtClimat` ; les chips disent « 69 nuits », plus « 69 jours ».
- **`signalConvention`** : champ dédié sur `VerificationFact` + `CompositionSide`. Les seuils quittent le
  constat de chaleur/feu/pluies pour ce champ ; rendu en ligne ghost discrète, distincte de la limitation
  (`FactBody`, `SideBlock`) ; recopié par le tradeoff saisonnier (côté défavorable) et le
  grouped_verification (`item()`). Card-only : la conclusion rédigée ne le reçoit pas. Commentaire
  doctrinal `materiality-rules.ts` mis à jour (« dite SUR LA CARTE, dans son champ »).
- **Clôture mismatch** : « Cet écart appelle un arbitrage. Il ne rend pas {nom} incompatible avec votre
  projet. » (2 phrases, arbitrée par la contre-relecture ; « s'arbitre » écarté). Même remplacement dans
  `mismatch-rules.ts`, `absence-rules.ts` (mobilité), `coast-rules.ts`, `agglomeration-rules.ts`
  (grandes villes + grande ville). Les 2 clôtures PRUDENTES intactes (`absence-rules.ts:55` vie étudiante,
  `agglomeration-rules.ts:49` isolement).
- **G3** : quand `projectPhrase === indicator` (acces_ecoles), « Sur ce point, » remplace « Sur {indicator}, »
  (évitait la duplication « l'accès aux collèges et lycées » deux fois).

## Décisions prises pendant la session

- Formulation nuits tropicales : « et où le corps peine à récupérer » (le porteur a tranché en direct, via
  AskUserQuestion ; garde le registre charnel « le corps », « peine » atténue l'absolu). Les 2 variantes
  ChatGPT plus prudentes (« ce qui peut rendre la récupération… », « limitant les possibilités de
  rafraîchissement… ») écartées.
- **Pas de bump `DECISION_NARRATIVE_PROMPT_VERSION`** (reste `v11`) : le texte du prompt système n'a pas
  changé, il est déjà aligné (« arbitrer » pour un mismatch, l.33). Les fallbacks generables ont changé
  (statements mismatch, tradeoff chaleur), mais le hash de conclusion (`buildConclusionHash`, qui inclut
  tout le `plan`) les invalide SEUL : le compteur manuel ne sert qu'aux changements de texte du prompt.
- `signalConvention` rendu comme 2e ligne ghost parallèle à la limitation (distinctes par leur contenu),
  PAS de dépliable « Pourquoi ce signal » labellisé (le design-critic n'a pas sanctionné d'élément visuel
  nouveau ; à rouvrir si un test navigateur le demande).

## DIFFÉRÉ (à spécifier avant dev, cohérent handoff + contre-relecture ChatGPT)

- **Variantes de série mismatch** (« aussi » sur les cartes k≥2, « l'écart est ici plus net », portée
  d'incompatibilité dite UNE fois sur la dernière carte visible) : sélection de PRÉSENTATION dans
  l'assembleur (`decision-assembler.ts`, `sectionCards`), JAMAIS dans `fact.statement`. Appliquée aux
  seules cartes `kind:"fact"` de la section mismatches, APRÈS compositions/absorption/tri/caps. Bloquant :
  borner « plus net » (rang ≠ poids ≠ tier ; gate = bandes non chevauchantes ET matérialité égale ; ne
  jamais modifier l'ordre ni le tier depuis cette relation).
- **`compositions_found` / `mismatches_found` construits, générés, stockés, JAMAIS rendus** (découverte
  design-critic). Trancher : réutiliser leur MATIÈRE (nommer les priorités dans le verdict d'arbitrage)
  plutôt qu'afficher 2 paragraphes, ou cesser de les générer/stocker. Choix porteur.
- **Bruit** : la phrase de seuils (`materiality-rules.ts` règle bruit) est en MILIEU de statement ; même
  déménagement vers `signalConvention` possible, DIFFÉRÉ (non fait ce commit).

## État git

- Branche `feat/prose-conclusion-dossier`, 9 commits locaux NON poussés, aucune PR.
- `main` = `514acea`, poussé, prod déployée. Ne pas pousser `main` sans demande explicite (prod = push main).
- Non suivi : `Futur.e Design System.zip` (fichier du porteur, NE PAS committer).
- Le handoff (ce fichier) et le plan mis à jour : à committer en docs.

## Reste (hors chantier prose)

- Sonde `node --env-file=.env.local scripts/probe-conclusion.ts` non lancée (coût API) : les fallbacks
  generables ont changé, elle confirmerait que les blocs survivent toujours à la validation.
- Contraste du violet à 6 % sur verre sombre (réserve design-critic) : à valider à l'œil par le porteur.
- Vérification au navigateur des variables `--accent/--info/--amethyst` (fix alias posé commit `665368a`,
  à confirmer visuellement).

## À lire d'abord à la reprise

- `MEMORY.md` ; fiches `project_dossier_decision.md`, `mismatch_formes_fondement.md`,
  `project_composition_faits_lies.md`.
- Le plan : `docs/superpowers/plans/2026-07-17-prose-conclusion-arbitrage.md` (6/6 cochées).
- Les 2 rapports : `docs/rapports-agents/editorial-writer/2026-07-17-mismatch-chaleur.md`,
  `docs/rapports-agents/design-critic/2026-07-17-conclusion-block.md`.

## Pièges / fils ouverts

- `node --test` : jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- `plan.reservesCount` (conclusion-plan.ts) compte les seuls FAITS, pas les compositions-réserves : écart
  connu avec `reservesShown`, hérité du tradeoff, non traité.
- Le pluriel de « Condition(s) à vérifier » repose sur le contrat « 1 sourceId = 1 contrainte » : contrat à
  documenter dans ConclusionBlock.tsx (demande contre-relecture, pas encore fait ; ChatGPT suggérait un
  champ `unexaminedConstraintCount` explicite plutôt que déduire de `sourceIds.length`).
- Le build local time-out sur le pré-rendu SSG `/inondation/[insee]` (>60 s/page, données externes) :
  environnemental, pré-existant, sans rapport avec le dossier.

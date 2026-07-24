# Passation — Lot C EN PROD ; Lot D en cours (Tasks 0 + 1 livrées, Task 2 à reprendre)

**Horodatage** : 2026-07-24 · **Branche** : `main` = `5ac5492` (feat Task 1). **Tree propre** (seul non suivi :
`Futur.e Design System.zip`, NE JAMAIS COMMITTER). **737 tests, tsc/eslint 0.**

## État par lot

### Lot C — « Ce qui correspond à votre projet » : COMPLET, EN PROD
Rôle `AlignmentFact` (liste blanche au type), carte « Ce qui correspond », absorption d'affichage, verdict
positif (héros cas 4 + réserves mineures), fondements taille + mer, `faceStatement`. + tradeoff **calmé**
(fin des « mini-héros » : teinte plate, libellés sans-serif). Détails : commits `c6c7e97` → `ed5e20f`.

### Lot D — trajectoires chaleur : PLAN v2 + Tasks 0 et 1 livrées, Task 2 à reprendre
**Le bug qui a déclenché le lot D** : projet « éviter les fortes chaleurs » sur Toulouse → la chaleur tombait
en « À contrôler avant de vous engager » (`verification`), et le verdict lisait « Correspondance favorable ».
Doit être un **mismatch** (« Ce qui correspond moins bien », orientation `arbitration`). **Corrigé (Task 1).**

**Plan v2** : `docs/superpowers/plans/2026-07-24-lot-d-trajectoires-chaleur.md`. À LIRE en premier à la reprise.

**Task 0 — LIVRÉE** (`43ae027`) : `ClimateThresholdBasis` (multivarié jours/nuits) dans `MismatchBasis` ;
`classifyClimateComfort(climat)` PUR (`climat-facts.ts`) → `{ verdict, basis }` ; garde `climate_threshold`
dans `assertFactValid`.

**Task 1 — LIVRÉE** (`5ac5492`, à pousser) :
- `ruleChaleur` (`materiality-rules.ts` ~L165) produit un **MISMATCH** : poids 0 → `not_applicable` ;
  `uncertain`/`under_threshold` inchangés ; `unfavorable` + poids 1 → outcome `mismatch`, **aucun fait**
  (silencieux) ; `unfavorable` + poids ≥ 2 → un `MismatchFact` (`basis` climate_threshold,
  `projectKey: "faible_chaleur"`, `headlineSubject: "des étés supportables"`, `topic: "les fortes chaleurs"`,
  `limitation` = LIMITATION_CLIMAT, evidence = les axes notables). **Pas d'action, pas de signalConvention.**
- **Couplage déjà traité** : `composeSeasonalClimateTradeoff` (`fact-compositions.ts`) cherche maintenant le
  fait chaleur par `role === "mismatch"`. L'action logement (qu'un mismatch ne porte pas) est extraite dans
  **`summerComfortAction(hasAddress)`** (`climat-facts.ts`, source de vérité unique) et restaurée par la
  composition via `facts.hasAddress`. Fixtures `fact-compositions.test.ts` mises à jour (mismatch + outcome).
- Orientation vérifiée : `buildCriteriaRegistry` compte `faible_chaleur` en mismatch, orientation `arbitration`.
- **⚠ Sonde `probe-conclusion.ts` NON lancée** : 45 appels LLM facturés, et elle teste la conclusion rédigée
  — chemin qui ne lira le mismatch qu'après **Task 3**. À passer à la fin de Task 3, pas avant.

## Reprise immédiate : Lot D Task 2 (compositions climatiques — « une seule par dossier »)

**Invariant** : une seule composition climatique visible par dossier pour la dimension chaleur/confort.
Priorité des patrons : douceur favorable → `seasonal_climate_tradeoff` ; sinon → nouveau `climate_comfort`.

1. **Step 1 déjà fait en Task 1** : `seasonal_climate_tradeoff` absorbe désormais le **MismatchFact** chaleur
   (plus le VerificationFact), action logement portée par `summerComfortAction`. Rien à refaire — juste
   VÉRIFIER que le test « tradeoff saisonnier » couvre bien l'absorption du mismatch (c'est le cas).
2. **Step 2 — nouveau `climate_comfort`** (fallback SANS douceur favorable) : `kind: "climate_comfort"`,
   `displaySection: "mismatches"`, absorbe le mismatch chaleur, porte `summerComfortAction(hasAddress)` + la
   limitation. Structure de rendu dans le plan (§Task 2 Step 2). RED/GREEN : chaleur mismatch seule (Toulouse,
   pas de `douceur_climat`) → `climate_comfort` ; `absorbedFactIds` inclut le mismatch ; action selon adresse.
3. **Step 3 — priorité des patrons** : un dossier avec douceur favorable + chaleur mismatch produit
   **exactement une** composition (`seasonal_climate_tradeoff`), JAMAIS aussi `climate_comfort`. Le builder
   `climate_comfort` ne se déclenche que si le tradeoff n'est pas produit.
4. Il faudra un nouveau type `ClimateComfortComposition` dans `fact-composition.ts` (voir les 3 patrons
   existants), et l'ajouter à l'union `FactComposition` + à `assertCompositionsValid` + à `composeFacts`.

Puis **Task 3** (le héros nomme le mismatch absorbé — `mismatchCandidates` lit les compositions climatiques),
**Task 4** (verification ambiante chaleur non déclarée, règle séparée), **Task 5** (vérifier l'intro de
section, probablement no-op), **Increment 2 différé** (rangs jours/nuits + alignment favorable). Les 9 tests à
graver sont dans le plan.

## À lire d'abord
- `docs/superpowers/plans/2026-07-24-lot-d-trajectoires-chaleur.md` (v2, le plan actif).
- `MEMORY.md` + `project_dossier_decision.md`, `mismatch_formes_fondement.md`, `project_composition_faits_lies.md`.

## Pièges / doctrine
- **`tsconfig.json` exclut `**/*.test.ts` du typecheck** : un champ obligatoire ajouté à un fait n'échoue pas
  sur les fixtures. Gardes nommées dans `assertFactValid` / `assertCompositionsValid`.
- **Le terminal ne montre pas les défauts de composition** : regarder l'écran (le porteur n'a pas encore vu le
  lot C ni le lot D en prod).
- **Une dimension, un signal** : jamais mismatch chaleur + verification chaleur visibles ensemble.
- **Absorption = affichage** : le fait reste dans `shown`/`conclusionBasis`/verdict (le héros doit pouvoir le nommer).
- Suite : `node --test --experimental-strip-types "src/**/*.test.ts"`. Push direct sur `main`.

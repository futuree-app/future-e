# Passation — Lot C EN PROD ; Lot D en cours (Task 0 livrée, Task 1 à reprendre)

**Horodatage** : 2026-07-24 · **Branche** : `main` = `43ae027`, **poussée**. **Tree propre** (seul non suivi :
`Futur.e Design System.zip`, NE JAMAIS COMMITTER). **735 tests, tsc/eslint 0.**

## État par lot

### Lot C — « Ce qui correspond à votre projet » : COMPLET, EN PROD
Rôle `AlignmentFact` (liste blanche au type), carte « Ce qui correspond », absorption d'affichage, verdict
positif (héros cas 4 + réserves mineures), fondements taille + mer, `faceStatement`. + tradeoff **calmé**
(fin des « mini-héros » : teinte plate, libellés sans-serif). Détails : commits `c6c7e97` → `ed5e20f`.

### Lot D — trajectoires chaleur : PLAN v2 + Task 0 livrées, Task 1 à reprendre
**Le bug qui a déclenché le lot D** : projet « éviter les fortes chaleurs » sur Toulouse → la chaleur tombait
en « À contrôler avant de vous engager » (`verification`, intro « au-delà de vos priorités » FAUSSE) et le
verdict lisait « Correspondance favorable ». Doit être un **mismatch** (« Ce qui correspond moins bien »,
orientation `arbitration`).

**Plan v2** (revue ChatGPT + Claude intégrée) : `docs/superpowers/plans/2026-07-24-lot-d-trajectoires-chaleur.md`.
À LIRE en premier à la reprise. Décisions tranchées : base dédiée `climate_threshold` (pas `unit: "jours"`) ;
conflit avec `seasonal_climate_tradeoff` résolu (UNE seule composition climatique/dossier) ; poids 1 explicite ;
verification ambiante en règle séparée ; l'intro de section devient **caduque** après reclassement (pas à
réécrire) ; alignment favorable différé (increment 2, attend un rang chaleur).

**Task 0 — LIVRÉE** (commit `43ae027`, poussée) :
- `ClimateThresholdBasis` (multivarié jours/nuits) ajouté à `MismatchBasis` (`decision-fact.ts`).
- `classifyClimateComfort(climat)` PUR dans `climat-facts.ts` → `{ verdict: "unfavorable" | "under_threshold" |
  "uncertain", basis }`. Un axe défavorable suffit (trigger any) ; sous seuil si les 2 axes lus ; sinon uncertain.
- `assertFactValid` : garde `climate_threshold` (≥1 mesure, ≥1 axe défavorable pour un mismatch).

## Reprise immédiate : Lot D Task 1 (elle avait été commencée puis ANNULÉE — tree remis propre)

**But** : `ruleChaleur` (`materiality-rules.ts` ~L165) produit un **MISMATCH** au lieu d'un `VerificationFact`.
Suivre le plan Task 1, avec ces points APPRIS pendant la tentative :

1. **Nouveau gating** : `weight === 0` → `not_applicable` (la règle AMBIANTE, Task 4, gère le non-déclaré).
   `weight >= 1` → examiné : appeler `classifyClimateComfort(c)` → `uncertain`/`under_threshold`(satisfied) ;
   `unfavorable` + `weight < 2` → `outcome "mismatch"`, **aucun fait** (poids 1 silencieux) ; `unfavorable` +
   `weight >= 2` → un `MismatchFact` (`basis` = le climate_threshold du classifieur, `projectKey:
   "faible_chaleur"`, `headlineSubject: "des étés supportables"`, `topic: "les fortes chaleurs"`, `limitation`
   = `LIMITATION_CLIMAT`, evidence = les `climatEvidence` des axes notables). Réutiliser le bloc `phrases`
   existant pour le `statement`. **Pas d'`action`** (un mismatch n'en a pas). Pas de `signalConvention`
   (absent de MismatchFact) ni de `seuils` (devient inutilisé — le retirer sinon eslint casse).

2. **COUPLAGE À TRAITER DANS LA MÊME TÂCHE (sinon rouge)** : `composeSeasonalClimateTradeoff`
   (`fact-compositions.ts` ~L60) cherche le fait chaleur par **`role === "verification"`**. En passant la
   chaleur en mismatch, le tradeoff casse (retourne null, ses tests échouent). Il faut :
   - changer le lookup en `role === "mismatch"` ;
   - l'`action` du côté défavorable ne vient plus du fait (mismatch sans action) → **extraire un helper partagé
     `summerComfortAction(hasAddress): DecisionAction`** (« Regardez comment le logement tient l'été » /
     « Renseignez votre adresse… », le détail actuellement inline dans ruleChaleur) et l'utiliser dans le
     tradeoff (via `facts.hasAddress`). J'avais commencé cette extraction (annulée).
   - MAJ des fixtures `fact-compositions.test.ts` : `chaleurFact()` (→ role mismatch, basis climate_threshold)
     et `chaleurEval` (→ `outcome: "mismatch"`).

3. **Vérifier l'orientation** : avec le mismatch, `criteria-registry` compte `faible_chaleur` en mismatch (pas
   reserve), orientation `arbitration`, le verdict n'est plus « Correspondance favorable ». (Toulouse n'a pas
   `douceur_climat` → PAS de tradeoff → le mismatch chaleur est SEUL, sans action, jusqu'à la Task 2
   `climate_comfort` qui restaure l'action. C'est l'état intermédiaire assumé par le plan.)

Puis **Task 2** (climate_comfort + priorité des patrons : une seule composition/dossier), **Task 3** (le héros
voit le mismatch absorbé — `mismatchCandidates` lit les compositions climatiques, comme il lit shared_evidence),
**Task 4** (verification ambiante, règle séparée), **Task 5** (vérifier que l'intro est redevenue correcte),
**Increment 2 différé** (rangs jours/nuits + alignment favorable). Les 9 tests à graver sont dans le plan.

## À lire d'abord
- `docs/superpowers/plans/2026-07-24-lot-d-trajectoires-chaleur.md` (v2, le plan actif).
- `MEMORY.md` + `project_dossier_decision.md`, `mismatch_formes_fondement.md`, `project_composition_faits_lies.md`.

## Pièges / doctrine
- **`tsconfig.json` exclut `**/*.test.ts` du typecheck** : un champ obligatoire ajouté à un fait n'échoue pas
  sur les fixtures. Garde nommée dans `assertFactValid`.
- **Le terminal ne montre pas les défauts de composition** : regarder l'écran (le porteur n'a pas encore vu le
  lot C ni le lot D en prod).
- **Une dimension, un signal** : jamais mismatch chaleur + verification chaleur visibles ensemble.
- **Absorption = affichage** : le fait reste dans `shown`/`conclusionBasis`/verdict (le héros doit pouvoir le nommer).
- Suite : `node --test --experimental-strip-types "src/**/*.test.ts"`. Push direct sur `main`.

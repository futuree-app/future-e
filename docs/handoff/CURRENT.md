# Passation — Lot C « Ce qui correspond à votre projet » LIVRÉ + tradeoff calmé : EN PROD

**Horodatage** : 2026-07-24 · **Branche** : `main` = `ed5e20f`, **poussée**, prod déployée. **0 commit en attente.**

## Ce qui a été fait cette session

### Lot C — le côté FAVORABLE, prouvé et nommé (6 commits, `c6c7e97` → `5d14929`)

Le dossier ne produisait que des griefs (les 5 rôles de `DecisionFact` sont des formes de problème). Le
moteur calculait déjà les `satisfied` (top 20 %) puis les jetait. Le lot C les **matérialise** en un
nouveau rôle `AlignmentFact`, miroir exact du mismatch.

- **Tâche 1** — `AlignmentFact` (role `"alignment"`, `basis: AlignmentBasis` = liste blanche AU TYPE,
  `named_absence` interdit) ; famille `alignment-rules.ts` (13 critères relative_position) ; copie du porteur
  en deux champs `{ headlineSubject, favorableStatusTemplate }` dans `ALIGNMENT_LABELS` (mismatch-facts.ts).
- **Tâche 3** — section « Ce qui correspond à votre projet » dans l'assembleur : **placement porté par
  l'ordre** (ouvre les cartes, sauf derrière une incompatibilité), cap 3, `conclusionBasis`. Rendu SOBRE
  (pastille verte, deux lignes titre + phrase de rang) dans `DossierDecisionSection.tsx`.
- **Tâche 4** — **absorption d'AFFICHAGE** (dossier-view.ts, jumeau du masquage taille) : un alignment sur
  la clé favorable d'un tradeoff AFFICHÉ (`favorableProjectKey`) est masqué. Le fait RESTE dans `shown`
  (le verdict ne le perd jamais). `dossier.compositions` = post-caps → une composition plafonnée n'absorbe rien.
- **Tâche 5** — **le verdict nomme le positif** (conclusion-plan.ts, `herosPositif()`) : branche favorable
  + cas 4 en **réserves mineures** (le positif prime quand seules des réserves secondaires subsistent).
  « {commune} répond à deux de vos priorités : … » / « … à l'une de vos priorités : … ». Détail d'arbitrage :
  « … répondent en revanche à votre projet. La décision se joue entre ces correspondances et les écarts
  relevés. » Sujets depuis les faits AFFICHÉS, jamais `favorableCount`. Verdict `generable: false` (aucun LLM).
- **Tâche 2** — fondements **taille** (categorical_state : prefere_grande_ville, eviter_grandes_villes) et
  **mer** (absolute_measure). Refactor : `AlignmentFact.faceStatement` (2e ligne de carte, produite par la
  règle) distinct de `statement` (phrase autonome).

**Revue archi du porteur intégrée** : D1 (face par critère / fait autonome), D2 (« l'une de vos priorités »),
Issue 4 (AlignmentBasis au type), Issue 8 (limitation bornée à ensoleillement/douceur/mer), Issue 1 (non
bloquant — criteria-registry agrège par clé — verrouillé par un test d'invariance). Plan + revue :
`docs/superpowers/plans/2026-07-23-lot-c-alignment.md`.

### Design — le tradeoff calmé (`ed5e20f`)

Les deux côtés du tradeoff rejouaient le halo/filet/lavis du VERDICT (« deux mini-héros »). Doctrine gravée :
**un traitement de signal complet par niveau de lecture** (héros = effet complet ; composition = teinte plate
discrète). `.tradeoff-side` : plus de filet ni de lavis, teinte plate 4 %, libellés sans-serif casse normale.

### Plus tôt dans la session (déjà en prod avant le lot C)

Tradeoff à lavis (Direction A, depuis calmée) · masquage du doublon de taille (mismatch symétrique) ·
unification « agglomération » · verdict « Ces points » (fin du « Ils » orphelin) · fix argiles (la sévérité
ne se recopie plus en parenthèse).

**Vérifs** : `tsc` 0, `eslint` 0, **729 tests**.

## À regarder à la reprise (prod)

Recharger `/rapport` sur un projet où la commune est top 20 % (soins, vie locale…) : la carte « Ce qui
correspond », le héros positif, et le tradeoff calmé. Les défauts de COMPOSITION sont invisibles aux tests —
regarder l'écran.

## Ce qui reste (extensions du lot C, spec §Extensions)

- **Lot C+ — air / bruit / industrie** : 3 critères à valeur continue sans rang national. Étendre le `switch`
  de `mismatchRawScore` (comparateur-scores.ts) + relancer `populate-mismatch-rank.mts`. Le `relative_position`
  s'applique ensuite. **VETO ABSOLU** obligatoire : un bon rang ne blanchit jamais un niveau absolu préoccupant.
  Formulations gravées dans la spec (ne jamais écrire « l'air est sain »).
- **Lot D — trajectoires climatiques** (chaleur, nuits tropicales) : **double gate niveau futur × trajectoire**.
  Piège : un bon rang de trajectoire sur une grandeur en aggravation se lit « il ne fera pas chaud ici ». Un
  bon rang ne neutralise jamais un niveau futur défavorable.
- **Lot E — rassurances au grain adresse (Logement)** : « aucune cavité recensée… ». Ce n'est PAS un alignment
  (role `reassurance` distinct) ; garde-fou du sujet soulevé ; jamais dans « En une minute ».
- **A1** (mécanique du lot A) : débloqué, jamais commencé.

## Design — points de la critique ChatGPT NON retenus (à rouvrir si voulu)

- **Recomposition verticale du tradeoff** (bandeau positif compact + compromis dessous) : réglerait
  l'asymétrie de volume. Le porteur a choisi « calmer les 2 colonnes », pas la recompo.
- **Redesign des chips « PREUVE »** du côté favorable du tradeoff (répètent le constat) : hors périmètre choisi.

## Pièges / doctrine tenue

- **`tsconfig.json` exclut `**/*.test.ts` du typecheck.** Les fixtures n'ont aucun filet de type : un champ
  obligatoire ajouté à un fait (ex. `faceStatement`) ne fait pas échouer `tsc` sur les tests. Ajouter une garde
  nommée dans `assertFactValid`.
- **Le terminal ne montre pas les défauts de COMPOSITION.** Regarder l'écran.
- **Liste blanche des fondements d'alignment** : jamais `named_absence` (une absence de signal ne prouve pas un
  positif). Toute famille ajoutée entre explicitement dans la table.
- **Invariant transversal** (pour C+/D) : une dimension ne porte jamais à la fois un alignment et un signal
  défavorable ; le VETO ABSOLU prime (un rang ne blanchit pas un niveau absolu).
- **Absorption = affichage**, jamais un retrait : le fait reste dans `shown` / `conclusionBasis` / verdict.
- Suite : `node --test --experimental-strip-types "src/**/*.test.ts"`. Push direct sur `main` (prod sur push).
- Non suivi : `Futur.e Design System.zip` (**NE JAMAIS COMMITTER**).

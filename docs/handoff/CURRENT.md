# Passation — « En une minute » : lots A+B EN PROD, corrections éditoriales à appliquer

**Horodatage** : 2026-07-22 · **Branche courante** : `main` (à jour avec `origin/main`, prod déployée)

## Objectif en cours

Refonte de la tête de `/rapport` (le dossier de décision « En une minute »), jugée « AI slop / pâté »
par le porteur. Les lots A (désengorger les cartes) et B (verdict promu en héros) sont **livrés et
déployés**. Une passe Editorial Writer vient de rendre son rapport : elle trouve **trois défauts
visibles en production** et une inversion logique sur la branche la plus fréquente du héros. Ces
corrections sont **identifiées, vérifiées, et NON appliquées**.

## Fait dans cette session

- **Lot A mergé et poussé** (`65480b4`) : `signalConvention` sortie de la face vers un dépliable
  « Méthode et détails », pastille « PREUVE » vide corrigée, action dé-emphasée (`ActionCue`), grain
  remonté en intertitre de groupe.
- **Lot B implémenté, mergé et poussé** (10 commits) : cascade déterministe `{ headline, detail }`
  (`verdictPresentation` dans `conclusion-plan.ts`), `headlineSubject` obligatoire sur les 4 familles
  de mismatch avec garde dans `assertFactValid`, `rankLeadCandidates` extraite, `selectResidualLead`
  (strate résiduelle et contextuelle), retrait du registre `mismatches_found`, rendu `<h2>` Serif,
  prompt **v12** (trois natures, trois verbes).
- **Vérifications** : `npx tsc --noEmit` 0, **336 tests** (baseline 294), `npm run build` complet
  (2255 pages), sonde `probe-conclusion.ts` **35/35 blocs retenus** sur le vrai modèle, 3 passages.
- **Sonde améliorée** : elle imprime désormais le HÉROS (qui vit hors des blocs) et ses fixtures
  portent les vrais sujets de production.
- **Specs écrits et commités** : `docs/superpowers/specs/2026-07-22-lot-a-arbitrages.md` (les 3 points
  du Lot A tranchés + découpage A1/A2), `docs/superpowers/plans/2026-07-22-verdict-heros.md`,
  `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md` (le côté favorable + les
  extensions contractuelles C+/D/E).
- **Rapport Editorial Writer** : `docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md`
  (859 lignes, 14 branches régénérées depuis le code). **NON COMMITÉ** (fichier non suivi).

## Décisions prises (non encore dans le vault)

**Tranchées par le porteur :**
- Lot A point 1 : la pastille porte une **observation lisible + sa valeur** ; sans valeur mesurable,
  **aucune pastille** sur la face, la source va au dépliable. Le mot « Preuve », le score interne et le
  nom de commune disparaissent des libellés d'evidence.
- Lot A point 2 : `action` devient `{ type, label, detail? }`, label sans point final, checklist dans le
  dépliable à **deux zones nommées** (« À vérifier » / « Méthode du signal »), garde de longueur sur
  `action.label` dans `assertFactValid`.
- Lot A point 3 : largeur **abandonnée**. Une colonne de 860 px a été posée puis retirée (rien d'autre
  sur la page ne partage cette largeur, le bloc se lisait comme un élément mal aligné). La mesure de
  ligne se réglera à l'échelle de la PAGE.
- Découpage **A1** (mécanique, mergeable seul) / **A2** (éditorial, les 23 variantes posture-aware).
- Lot C : un **fait avec sa carte** (rôle `alignment`), **carte groupée** de 3 lignes, placée en
  première carte **sauf derrière une incompatibilité**, héros positif seulement si aucun négatif ne prime.
- Calibrage du héros **validé à l'écran** : gate à 110 caractères, `max-w-[540px]`, `minHeight` 168 px.
- Push direct sur `main` assumé (le site n'est pas encore publié).

**Proposées et appliquées pendant l'implémentation (à valider a posteriori) :**
- Le héros ne nomme une réserve que si le dossier **ne penche pas favorablement** (sinon il reléguait
  au détail le cœur de la décision). 8 tests préexistants ont repassé sans modification après cette
  correction, ce qui l'a confirmée.
- Gate portée de 95 à **110** caractères : à 95, l'incompatibilité nommée sur commune à article (98)
  basculait en posture, et l'arbitrage nominal passait à 94/95.
- Le compte des priorités vient de `mismatchTotal` (mismatchs ÉMIS), jamais du nombre de cartes : une
  composition `shared_evidence` en absorbe plusieurs et faisait écrire « Deux » là où il y en a trois.
- Au-delà de 2 candidats, sélection par **tier** ; gabarit « dont » quand le héros ne nomme qu'une partie.

## État git

- `main` = `c79dc33`, **poussée**, prod déployée. 0 commit en attente.
- Non suivi : `docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md` (**à committer**)
  et `Futur.e Design System.zip` (fichier porteur, **NE JAMAIS COMMITTER**).
- Branches mergées dans `main`, supprimables : `feat/lot-a-depate-en-une-minute`, `feat/verdict-heros`.
- Branches résiduelles à nettoyer : `worktree-agent-a34fa3e0af58bf46f`, `feat/composition-faits-lies`.
- **Aucune PR ouverte.**

## Prochaine étape immédiate

Appliquer les **4 corrections** du rapport éditorial (les 3 premières sont des défauts visibles en
prod). Toutes vérifiées dans le code, toutes courtes.

1. **`inc.topic` → `hardConstraintLabel(project, key)`** dans la branche incompatibilité de
   `verdictPresentation` (`conclusion-plan.ts`). Les topics de contraintes dures portent le nom de la
   commune (`hard-constraints.ts:338-526`, tous en `deCommune(c.nom)`), d'où le rendu actuel : « Une
   contrainte de votre projet n'est pas satisfaite **à Toulouse** : la distance **de Toulouse** au
   littoral. » `hardConstraintLabel` (`project-view.ts:73`) rend la condition telle que le lecteur l'a
   posée ; le bloc `unexamined_hard_constraints` l'utilise déjà. **Le fait porte `hardConstraintKey`,
   mais `ConclusionPlanInput.establishedIncompatibility` ne le transporte pas encore** : l'étendre, et
   passer le `UserProject` ou le libellé déjà résolu depuis `decision-assembler.ts:123`.
   Texte cible : `Une condition de votre projet n'est pas remplie ${a} : ${label}.`
2. **La faute de français** : `points(n, "structurant", "demande")` produit « 2 points structurants
   demandent attention », sans déterminant. Cible : « La lecture reste incomplète, et deux points
   demandent votre attention. »
3. **Les compositions en héros** : `rankLeadCandidates` prend le `title` comme `subject`, d'où « Le
   principal point à contrôler à Toulouse : **D**es hivers doux, avec une exposition estivale à
   arbitrer. » (majuscule au milieu de phrase, et un tradeoff présenté comme un problème). Donner un
   `headlineSubject` court aux patrons `tradeoff` et `grouped_verification` dans `fact-compositions.ts`,
   comme `shared_evidence` en a déjà un. Valeurs proposées par l'agent : « l'exposition aux fortes
   chaleurs » et « le sol argileux et ce qu'il impose ».
4. **L'inversion du héros d'arbitrage** : `Deux priorités correspondent moins bien à Toulouse : …` →
   `Toulouse répond moins bien à deux de vos priorités : …`. **94 = 94 caractères**, gate inchangée,
   aucune régression de bascule. Adapter les assertions de `conclusion-plan.test.ts`.

Committer d'abord le rapport de l'agent (il n'est pas suivi).

## À lire d'abord à la reprise

- `MEMORY.md` (index), puis `project_dossier_decision.md`, `mismatch_formes_fondement.md`,
  `project_composition_faits_lies.md`, `feedback_text_maxwidth.md`.
- **Le rapport éditorial** : `docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md`.
  Sa §8 donne la version minimale, sa §5 les 23 libellés d'action prêts à coller.
- Les specs du jour : `docs/superpowers/specs/2026-07-22-lot-a-arbitrages.md` (A1/A2),
  `2026-07-22-lot-c-ce-qui-correspond-design.md` (lot C + extensions C+/D/E).
- Doctrine : `docs/vault/doctrine/editoriale.md`, `docs/vault/principes/invariants.md`.
- `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts

- **`tsconfig.json` exclut `**/*.test.ts` du typecheck.** Les fixtures de test n'ont aucun filet de
  type : un champ obligatoire ajouté à un fait ne fait PAS échouer `tsc` sur les tests. C'est ce qui a
  masqué le défaut n°1 (ma fixture passait un topic fabriqué au lieu d'un topic réel). **Tester avec
  des fixtures maison masque les défauts de la vraie donnée.**
- **Erreur dans le spec A2, à corriger avant d'implémenter** : `materiality-rules.ts:342` est la règle
  **qualité de l'air** (topic « la qualité de l'air à {nom} », preuve PM2,5), pas le bruit routier. Le
  spec `2026-07-22-lot-a-arbitrages.md` lui attribue une action « bruit routier » : y coller ce libellé
  décrocherait l'étiquette de la mesure. Et le module Logement compte **23** variantes posture-aware,
  pas 24 (`patrimoine/location` est exclue par la règle elle-même).
- **`la taille de la ville`** est aujourd'hui le `subject` de DEUX priorités opposées
  (`eviter_grandes_villes` et `prefere_grande_ville`) : le héros peut donc dire le même mot pour deux
  demandes contraires. À corriger avec les autres sujets (rapport §3).
- **Le détail de `major_reserves`/`high` recopie le héros au mot près** (« 2 points structurants
  empêchent de conclure nettement »), et « structurants » est le nom d'un `materialityTier` affiché en
  32 px, soit la tuyauterie que le Lot A retire par ailleurs des pastilles.
- **Effet de bord assumé du lot B** : `shouldGenerateNarrative` bascule à `false` bien plus souvent
  (deux registres générables de moins). La sonde le montre : **4 plans sur 8 sont désormais à 0 bloc
  générable**, donc toute l'orientation « arbitrage » est 100 % déterministe. Économie réelle et
  permanente d'appels Sonnet, cohérente avec la doctrine du gate.
- **7 erreurs eslint préexistantes** (`JSX within try/catch` dans `ConclusionRedigee.tsx` et
  `DossierAvecLogement.tsx`) : présentes avant ces lots, non introduites par eux. React ne capture pas
  les erreurs de rendu dans un `try/catch` : ces replis ne protègent pas ce qu'ils croient protéger.
- **A1 est débloqué** (le socle Lot A est sur `main`) mais **non commencé**.
- **La largeur de lecture** reste un chantier de page ouvert, documenté en commentaire en tête de
  `DossierDecisionSection.tsx`.
- `node --test` : ne jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- La sonde coûte des appels API réels : `node --env-file=.env.local scripts/probe-conclusion.ts`.

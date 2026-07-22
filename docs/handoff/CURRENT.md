# Passation — refonte mise en forme « En une minute » (Lot A livré non mergé, Lot B en design)

**Horodatage** : 2026-07-22 · **Branche courante** : `feat/verdict-heros`

## Objectif en cours

Refondre la mise en forme du dossier « En une minute » (tête de /rapport), jugé « AI slop / pâté »
par le porteur : pas de hiérarchie, pas d'exergue, trop de secondaire. Deux lots : **Lot A** =
désengorger les cartes (livré, non mergé) ; **Lot B** = promouvoir le verdict en héros (en design).
On est à la fin du brainstorm du Lot B : le spec est écrit et révisé, **en attente de relecture du
porteur** avant de passer au plan d'implémentation.

## Fait dans cette session

- **Task 6 (chantier prose) MERGÉE sur `main` et déployée en prod** : passe éditoriale mismatch +
  chaleur (commits `3f9d514` feat + `c844b49` docs), sonde `probe-conclusion.ts` = **65/65 blocs**
  (aucune régression). Branche `feat/prose-conclusion-dossier` supprimée après merge.
- **Rapport Design Critic 2026-07-21** sur « En une minute » (problème d'ÉCHELLE, pas de contenu) :
  `docs/rapports-agents/design-critic/2026-07-21-en-une-minute-hierarchie.md`.
- **Lot A implémenté par un sous-agent, NON mergé** : branche `feat/lot-a-depate-en-une-minute`
  (commit `65480b4`, depuis `main`). Contenu : `signalConvention` sortie de la face vers un dépliable
  « Méthode et détails » (`MethodDetails`) ; bug de la puce « PREUVE » vide corrigé (une preuve
  sans valeur porte le libellé de sa source) ; action dé-emphasée (`ActionCue`, `→ label` casse
  basse) ; grain en intertitre de groupe au lieu d'une étiquette par carte. `tsc` 0, tests décision
  294/294, build compilé. Note d'impl : `docs/rapports-agents/implementation/2026-07-21-lot-a-depate-en-une-minute.md`.
- **Lot B : spec de design écrit et révisé** (branche `feat/verdict-heros`, commit `03de6f0`) :
  `docs/superpowers/specs/2026-07-22-verdict-heros-design.md`. Révisé après contre-relecture ChatGPT.

## Décisions prises (non encore dans le vault)

Design du Lot B, co-construit avec le porteur (tranché par lui via AskUserQuestion) :
- **Headline hybride** : nomme 1-2 enjeux quand une matière déterministe suffit, sinon posture. Jamais
  généré par le LLM. Cascade : incompatibilité nommable → 1-2 mismatches → réserve dominante → posture.
- **Strate de poids résiduelle** (option 2) : tout sujet nommé par le headline est CONSOMMÉ et ne se
  répète pas dans la strate ; celle-ci se reconstruit sur le résidu, disparaît s'il ne reste rien.
- **Titre cartouche « {Commune}, au regard de votre projet. » supprimé** ; le nom de la commune est
  tissé dans le headline ; le scope (commune/adresse) reste en haut à droite (il y était déjà).
- Ajustements de contrat adoptés (proposés par contre-relecture, validés dans la révision du spec) :
  constructeur déterministe commun `{ headline, detail }` (pas de verdict « trimmé »), sélection
  depuis les cartes AFFICHÉES (post-compositions/caps), consommation NARRATIVE seulement (comptes/
  couverture/orientation intacts), le headline arbitrage SUBSUME et retire `mismatches_found`, gabarit
  à deux-points (« … à Toulouse : le calme, l'accès aux espaces naturels ») qui résout l'accord,
  double gate (2 enjeux ET ~95 car.), helper `aCommune`, `max-width` du héros posé comme l'exception
  légitime de la doctrine de largeur.
- **Consigne porteur : « on ne touche pas au Lot A pour l'instant »** — le Lot A reste sur sa branche,
  non mergé.
- **3 points du Lot A NON tranchés** (laissés au porteur) : (1) puce preuve sans valeur renommée par
  sa source (vs style distinct) ; (2) actions longues non réécrites, signalées pour l'Editorial Writer
  (`materiality-rules.ts:342`, `logement-rules.ts:59`) ; (3) largeur de lecture NON appliquée, reco =
  `max-w` ~860px sur la grille des cartes (pas sur les paragraphes), **à décider avec le Lot B**.

## État git

- Branche courante `feat/verdict-heros` : 1 commit non poussé (`03de6f0`, le spec Lot B).
- `main` = `c844b49`, poussé, prod déployée (Task 6). Ne pas pousser `main` sans demande (prod = push main).
- Branche `feat/lot-a-depate-en-une-minute` (`65480b4`) : Lot A livré, **NON mergé** (consigne porteur).
- Branche `worktree-agent-a34fa3e0af58bf46f` : résidu du worktree du sous-agent Lot A, à nettoyer.
- Branche `feat/composition-faits-lies` : ancienne, sans rapport, non nettoyée.
- Non suivis : `Futur.e Design System.zip` (fichier porteur, NE JAMAIS committer) ; le rapport
  Design Critic 2026-07-21 (committé avec ce handoff).
- **Aucune PR ouverte.**

## Prochaine étape immédiate

Attendre la relecture du spec Lot B par le porteur (`docs/superpowers/specs/2026-07-22-verdict-heros-design.md`).
- S'il valide : lancer la skill **superpowers:writing-plans** pour en faire un plan d'implémentation,
  en intégrant une passe **Editorial Writer** sur les `subject` par critère et les textes headline/détail
  (copie déterministe sensible), et en tranchant la largeur (verdict + cartes ensemble) avec le Lot A.
- S'il demande des changements : les appliquer, re-committer le spec (amend), re-présenter.
- **Ne pas merger le Lot A** tant que le porteur ne le redemande pas.

## À lire d'abord à la reprise

- `MEMORY.md` (index) puis les fiches : `project_dossier_decision.md`, `project_frontiere_savoir_agir.md`,
  `project_territoire_redesign.md` (doctrine « grands signaux lisibles »), `project_composition_faits_lies.md`.
- Doctrine design : `docs/vault/recherches/inventaire-design.md` ; doctrine éditoriale :
  `docs/vault/doctrine/editoriale.md`.
- Le spec du Lot B : `docs/superpowers/specs/2026-07-22-verdict-heros-design.md` (la matière de reprise).
- Les rapports agents : `docs/rapports-agents/design-critic/2026-07-21-en-une-minute-hierarchie.md`
  (le diagnostic d'échelle), `docs/rapports-agents/design-critic/2026-07-17-conclusion-block.md`,
  `docs/rapports-agents/editorial-writer/2026-07-17-mismatch-chaleur.md`, et la note d'impl Lot A
  `docs/rapports-agents/implementation/2026-07-21-lot-a-depate-en-une-minute.md`.
- `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts

- **Lot A et Lot B touchent tous deux `DossierDecisionSection.tsx`** (Lot A : regroupement par grain ;
  Lot B : retrait du titre cartouche). Réconcilier à l'intégration, **Lot A d'abord**.
- **La largeur de lecture se décide en une fois** (verdict héros + grille des cartes), pas séparément :
  c'est le point 3 non tranché du Lot A, renvoyé au Lot B.
- **Retrait de `mismatches_found`** (le registre construit/généré/stocké/jamais rendu) : tâche finale du
  Lot B, à ne faire qu'après avoir vérifié qu'aucun autre consommateur ne le lit (validation, stockage,
  sonde).
- `max-width` du héros : c'est l'exception de doctrine (`feedback_text_maxwidth`, « sous-titre de hero en
  espace ouvert »), pas une violation — ne pas l'appliquer aux paragraphes des cartes.
- `node --test` : jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- Le sous-agent Lot A a buildé via `npx next build --webpack` (Turbopack refuse un symlink hors racine FS
  dans le worktree) ; l'échec `supabaseUrl is required` était un défaut d'ENV du worktree, pas un bug.
- Nettoyer la branche `worktree-agent-a34fa3e0af58bf46f`.

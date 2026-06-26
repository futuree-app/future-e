# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `feat/researcher-carte-ouverte` (PR #14 ouverte). `main` propre.

## Objectif en cours
Construction de l'équipe d'agents IA de futur•e et de sa mémoire stratégique (vault + /memory).
Cette session a posé presque toute l'équipe et son **architecture d'orchestration**. Il reste à
merger la PR #14, puis à lancer la **mission d'audit** de l'Archiviste (le vrai aboutissement :
transformer les débats des agents en mémoire qui évite de payer deux fois).

## Fait dans cette session
- **Business Strategist** mené jusqu'en **v3** (allocateur de ressources rares : goulot, coût
  d'opportunité, table d'allocation, « si j'étais CEO »). Mergé (PR #10).
- **Constitution v2** : invariants 10 → 8 (mergé PR #8). **Manifeste** recentré climat → décision
  + totem (PR #8). **Marque** harmonisée vers la puce `futur•e` (PR #8).
- **Positionnement** recentré sur l'identité de marque (l'ennemi, la décision, le totem) ; posture
  éditoriale renvoyée à `doctrine/editoriale.md` (PR #11, mergé).
- **Archétype-lecteur** recentré (moment déclencheur > démographie, transformation, totem) (PR #12).
- **Product Strategist** livré en **v2** (différenciation/moat, 4 questions de clôture, signature
  « le besoin est réel, la surface autonome ne l'est pas ») (PR #12, mergé). Testé sur le module
  Métier → verdict REFORMULER (rapport archivé).
- **ADR-0009 — hiérarchie d'orchestration** (mergé PR #13) : 4 niveaux (spécialiste / mini-board /
  board stratégique / capture), orchestrateur = fonction de routage (pas un agent), boards
  asymétriques sauf passe 1 du L3, PASS, Archiviste = mémoire des boards.
- **Premier board joué** (carte de France, quorum Product/Business/Design/Data, 2 passes). Synthèse
  dans `docs/board/traitees/`. Challengé par ChatGPT (outsider) → a révélé que le board, fait de
  critiques, sait éliminer mais pas inventer.
- **Researcher livré** (agent d'ouverture/divergence, PR #14 EN ATTENTE) : la lentille générative
  manquante. 1er test sur la carte = 19 pistes (cartogramme, constellation, France qui se vide…).
- **Carte gravée en problème OUVERT** (`arbitrages/carte-exploration-probleme-ouvert.md`) : la
  carte-dashboard est fermée, l'interaction spatiale propre à futur•e reste ouverte.

## Décisions prises (porteur, déjà gravées dans le vault sauf mention)
- Invariants à 8 ; « la forme sert le fond » en tête de `doctrine/design.md` ; « renforce le B2C »
  redescendu en principe stratégique (ADR-0008).
- Marque canonique = la **puce** `futur•e` (U+2022). Le dossier `Futur·e` (point médian) n'est PAS
  renommé.
- Orchestration ADR-0009 (les deux nuances tranchées : orchestrateur = fonction ; passe 1 du L3
  aveugle).
- Carte = problème ouvert, pas rejet. Researcher construit en avance (le trou génératif).
- Frontière Product ↔ Design gravée (le quoi vs le comment).

## État git
- Branche `feat/researcher-carte-ouverte`, **PR #14 ouverte** (Researcher + arbitrage carte ouvert
  + rapport Researcher). Working tree propre.
- `main` à jour : PR #8, #10, #11, #12, #13 mergées. Aucune autre PR ouverte.
- Mémoire `/memory` à jour (fiches business/product/orchestration/researcher + index), hors-repo.

## Prochaine étape immédiate
1. **Merger la PR #14** (`gh pr merge 14 --merge --delete-branch`).
2. **Lancer la mission d'audit de l'Archiviste** : c'était la finalité de la séquence. Cadrage déjà
   tranché (fiche `project_archiviste_vault`) : détection de dette documentaire, read-only, rapport
   d'incohérence ; séparer (a) vocabulaire/staleness grep-able de (b) sémantique (« cette ADR viole
   l'invariant X »), + pages orphelines. Matière déjà accumulée cette session (ex. cohérences
   d'invariants reciblées, redondances potentielles). ADR-0009 a fait de l'Archiviste la mémoire
   des décisions : l'audit est où il l'incarne.

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiches `project_archiviste_vault`, `project_agent_orchestration`,
   `project_researcher`.
2. `docs/vault/adr/ADR-0006` + `ADR-0009` (architecture et orchestration des agents),
   `docs/vault/principes/invariants.md` (Constitution v2 à 8), `.claude/agents/` (les 6 mandats).
3. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts
- **PR #14 non mergée** : le Researcher et l'arbitrage carte ouvert n'arrivent sur `main` qu'au merge.
- **Researcher pas encore challengé** par ChatGPT (le porteur a challengé tous les autres agents) :
  option avant de l'utiliser plus largement.
- **Roster incomplet** : restent Software Architect et Editorial Writer (« émergent du besoin »,
  pas un prérequis).
- **Carte de France** : problème OUVERT, pas clos. Avant toute construction, tester (PostHog/sonde)
  le segment « direction sans commune » et la flânerie. Pistes Researcher = NON VÉRIFIÉES, à passer
  en convergence (Data Curator puis board).
- **Décisions produit en attente d'action** (rapports d'agents, pas encore appliqués au code) :
  module **Métier** (verdict REFORMULER, arbitrage `metier-pas-de-module-autonome` rédigé non
  gravé) ; correctifs **Le Fil** (rapport Business, en attente du challenge ChatGPT du porteur).
- **Trouvailles /ou-vivre** (test Design Critic) non appliquées : reflet premium, double typewriter.
- Réserve ancienne : Run 3 (conv PostHog), pages `modules/` ×6, correctifs SITE (`/le-fil` prix,
  taxonomie `/professionnels`).

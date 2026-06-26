# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `chore/audit-dette-doc` (6 fichiers modifiés, **NON commités, NON poussés**).
  `main` est propre et à jour. Aucune PR ouverte.

## Objectif en cours
Première **mission d'audit de dette documentaire** du vault (la finalité en attente depuis deux
handoffs). L'agent Archiviste a tourné en read-only et rendu son rapport ; les corrections sûres
ont été appliquées sur la branche `chore/audit-dette-doc`. **Il reste à relire le diff, committer
et ouvrir/merger la PR** — c'est exactement là que la session s'est arrêtée (l'utilisateur a
interrompu le `git diff` de revue pour lancer ce handoff).

## Fait dans cette session
- **Audit Archiviste lancé** (sous-agent `archiviste`, read-only). Verdict d'ensemble : vault en
  bon état, **0 violation d'invariant**, la vraie dette est dans les INDEX (ce qui relie les
  pages), pas dans le contenu. Rapport structuré en 3 dettes : (A) vocabulaire/staleness,
  (B) sémantique vs invariants, (C) orphelins/redondance.
- **A4 tranché factuellement** (vérif code) : la matrice du Pack a bien **27 dimensions**
  (`DIMENSIONS` dans `src/lib/comparateur-vie.ts` : climat 3 · risques 4 · santé-env 4 · cadre 3 ·
  mobilité 3 · services 5 · vitalité 5), distinctes des **28** `PREFERENCE_KEYS` du scoring
  `/ou-vivre`. Deux taxonomies → `ADR-0007` (« 27 dims ») est JUSTE. Aucune correction.
- **Corrections appliquées (non commitées)** sur `chore/audit-dette-doc` :
  - **A1** `docs/vault/adr/_README.md` : ajout ADR-0008 + ADR-0009 à l'index ; ligne ADR-0006
    passée de « 7 personas + 2 capacités » à « 8 personas + Researcher, contre-pouvoirs, poste de travail ».
  - **C1** `docs/vault/arbitrages/_README.md` : indexation de l'orphelin
    `carte-exploration-probleme-ouvert` + lien entrant ajouté depuis
    `docs/vault/adr/ADR-0009-...md` (mention de la synthèse du board carte).
  - **A2** `docs/vault/doctrine/data.md` : « `recherches/inventaire-sources` (à venir) » →
    « `recherches/inventaire-sources.md` (terrain de l'agent Data Curator) ».
    `docs/vault/doctrine/positionnement.md` : « Vision fondatrice à écrire dans `vision/` » →
    « Vision fondatrice : `vision/positionnement.md` ».
  - **B1** `docs/vault/vision/manifeste.md` : « le climat est la **lentille principale** » →
    « le climat est une **composante centrale, plus le seul sujet** » (alignement sur
    `doctrine/positionnement.md`, suite au pivot ADR-0002).

## Décisions prises (porteur, cette session)
- **B1 (poids du climat)** : porteur a choisi « **assouplir le manifeste** » — le climat devient
  une composante centrale parmi d'autres, pas la lentille principale. Appliqué (voir ci-dessus).
- **A4** : confirmé que 27 (matrice Pack) et 28 (scoring) sont deux taxonomies distinctes → pas de dette.
- **C2 (10 liens pendants vers `modules/comparateur.md`, `modules/sante.md`,
  `architecture/parcours-et-acces.md`)** : décision de **NE PAS combler maintenant** (ce serait du
  remplissage). À tenir en liste de dette : écrire ces 3 pages purgera 10 liens morts d'un coup.

## État git
- Branche `chore/audit-dette-doc`. **6 fichiers modifiés, working tree sale, RIEN commité, RIEN poussé.**
  Fichiers : `adr/_README.md`, `arbitrages/_README.md`, `adr/ADR-0009-...md`, `doctrine/data.md`,
  `doctrine/positionnement.md`, `vision/manifeste.md`.
- `main` propre, dernier commit `a9e284f`. Aucune PR ouverte.

## Prochaine étape immédiate
1. `git diff` pour relire les 6 modifications (revue interrompue, à reprendre).
2. Committer sur `chore/audit-dette-doc` (message type `docs(vault): audit dette doc — index ADR/arbitrages, orphelin carte, TODO résolus, poids climat`).
3. Ouvrir la PR (ou merger en fast-forward selon préférence porteur). Branche dédiée déjà créée.

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiche `project_archiviste_vault` (cadrage de cette mission d'audit :
   les deux dettes (a) vocabulaire grep-able / (b) sémantique vs invariants, + pages orphelines).
2. `docs/vault/principes/invariants.md` (la règle de mesure de l'audit), `docs/vault/adr/_README.md`
   et `docs/vault/arbitrages/_README.md` (les index corrigés).
3. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts
- **PR de l'audit non finalisée** : tout est sur une branche sale non commitée. Ne pas repartir de
  `main` sans récupérer `chore/audit-dette-doc`, sinon les corrections sont perdues.
- **Dettes connues laissées volontairement** : C2 (10 liens pendants vers 3 pages non écrites de
  `modules/` et `architecture/`) ; pages vides `modules/` ×6, `recherches/` complet pour l'usage,
  `architecture/` ossature seule. Connu et assumé (principe « consolider-puis-élaguer, pas additionner »).
- **Staleness des pages PROD (hors vault, non corrigé)** : `/le-fil` affiche 9€/mois alors que la
  direction est annuelle ~49,99€ ; `/professionnels` parle de « 10 dimensions » (≠ 7 thèmes / 27 dims /
  28 critères). Le vault les documente correctement ; c'est le SITE qui est en retard. Chantier séparé.
- **Limites de l'audit (déclarées par l'agent)** : il n'a PAS relu mot à mot `ADR-0001/0002/0003/0004/0005`,
  `recherches/inventaire-design.md`, ni les 10 arbitrages individuels → confiance « moyenne-haute »
  sur « 0 violation d'invariant », pas certaine. Une 2e passe ciblée sur ces pages reste possible.
- **Fils anciens toujours ouverts** (rappel) : décisions produit non appliquées (module Métier
  « REFORMULER », Le Fil, /ou-vivre Design Critic) ; backlog SEO de lancement (verrou robots,
  sitemap `/inondation`, JSON-LD) ; carte de France = problème OUVERT côté Researcher.

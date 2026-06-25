# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `main` (propre, tout est mergé)

## Objectif en cours
Construction de la « mémoire stratégique » de futur·e (vault à deux niveaux) et de l'équipe
d'agents IA. On vient de finir le **modèle économique** + les **invariants**, le **Data Curator**,
et l'outillage de **passation** (cette commande). Prochain chantier : l'agent **Design Critic**.

## Fait dans cette session
- Repris le travail archiviste : Run 2 (modèle éco) + passe éditoriale, écrits et corrigés
  contre la prod (confrontation vault ↔ site : landing/ou-vivre fidèles, écarts B2B et Le Fil
  corrigés).
- Modèle éco passé de business plan à **philosophie économique** (moteur, boucle d'apprentissage
  = capital de compréhension, moat=accumulation, actifs connaissance/distribution, refus de
  monétisation, hiérarchie de preuve). **Invariants n°8 (indépendance non monétisée) et n°9
  (B2B ne détourne pas le B2C)** gravés.
- **Data Curator** livré : `docs/vault/recherches/inventaire-sources.md` (terrain + doctrine) +
  `.claude/agents/data-curator.md` (agent read-only).
- **PR #6 et #7 mergées** sur `main`.
- Outillage de passation créé (commande `/handoff`, hook PreCompact, statusline, `totalTokensReminder`).

## État git
- Branche `main`, à jour, propre côté vault.
- Non commité (outillage de passation) : `.claude/commands/handoff.md`, `.claude/hooks/*.sh`,
  `.gitignore` (exceptions), `docs/handoff/*`. `.claude/settings.json` reste hors-git (local).
- Aucune PR ouverte.

## Prochaine étape immédiate
Construire le **terrain doctrinal du Design Critic** (confronté au code, comme pour le Data
Curator) : lire `doctrine/design.md`, `doctrine/interface.md`, et les écrans réels (Territoire,
comparateur, paywalls), puis écrire le mandat + slice, puis `.claude/agents/design-critic.md`.
Règle posée par le porteur : **pas de mandat d'agent tant que son terrain n'existe pas.**

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiche `project_archiviste_vault.md` (état + séquence agents-avant-audit).
2. `docs/vault/README.md`, puis selon le sujet : `vision/modele-economique.md`,
   `principes/invariants.md`, `recherches/inventaire-sources.md`.
3. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur (généré auto avant compaction).

## Pièges / fils ouverts
- Séquence tranchée : **agents AVANT la mission d'audit** (les agents produisent les besoins de
  l'audit). Ordre : Data Curator (fait) → Design Critic → Business Strategist → puis audit.
- Réserve : Run 3 (conv PostHog), pages `modules/` ×7, et 2 correctifs SITE (prix `/le-fil`
  9€/mois → annuel ; taxonomie « 10 dimensions » de `/professionnels`).
- L'outillage de passation n'est pas encore commité (à décider avec le porteur).

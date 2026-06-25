# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `main` ; le Design Critic est sur la branche `feat/design-critic`.

## Objectif en cours
Construction de la « mémoire stratégique » de futur•e (vault à deux niveaux) et de l'équipe
d'agents IA. Modèle économique, invariants, Data Curator, outillage de passation : faits. On
vient de livrer le **Design Critic** (3e agent). Prochain chantier : l'agent **Business Strategist**.

## Fait dans cette session
- **Design Critic livré** (même méthode que le Data Curator : terrain confronté au code AVANT
  le mandat). Confrontation exhaustive du système de design réel (tokens, `@theme`, `.glass`,
  4 régimes de style, primitive `MetricDrawer` en `<style>` colocalisé sombre figé).
- Terrain `docs/vault/recherches/inventaire-design.md` : signatures durables, le pourquoi de la
  colocation, patterns d'écran tranchés, tensions ouvertes, grille, chiffres datés isolés.
  Refondu après retours ChatGPT (signatures + « pourquoi » + chiffres marqués périssables +
  cadrage « éditeur de l'écran »).
- Agent `.claude/agents/design-critic.md` : read-only, rédacteur en chef de l'écran (pas DA),
  verbes protéger/simplifier/révéler. Deux tranchés gravés : **option A** (ne juge pas la
  plomberie token, seulement l'incohérence visible) et **frontière** (ne réécrit pas le texte,
  le signale). **Invariant n°10** gravé (la forme sert le fond).
- **Testé sur `/ou-vivre`** : concluant. Zéro bruit token, retraits d'ornement bien ciblés
  (reflet premium + double typewriter), a révélé une divergence de marque (point médian vs
  puce) depuis tranchée.
- **Marque harmonisée** : le porteur a tranché la **puce** (`futur•e`, U+2022) comme glyphe
  canonique. Sweep byte-safe `futur·e`/`Futur·e` → puce sur 50 fichiers trackés (code + vault +
  docs + agents + statusline), séparateurs ` · ` préservés, export `Documentation Notion/` laissé
  intact (pas la source de vérité), caches aider non touchés. Le **dossier** `Futur·e` (point
  médian) n'est PAS renommé (chemins/git).

## État git
- Branche `feat/design-critic` (à commiter) : `docs/vault/recherches/inventaire-design.md`,
  `docs/vault/principes/invariants.md` (n°10), `.claude/agents/design-critic.md`,
  `docs/handoff/CURRENT.md`. Mémoire `/memory` MAJ (hors-repo).
- `main` propre par ailleurs. PR à ouvrir pour le Design Critic.

## Prochaine étape immédiate
Construire le **terrain du Business Strategist** (confronté au code/vault, comme les deux
précédents), puis son mandat. Règle : **pas de mandat d'agent tant que son terrain n'existe pas.**

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiche `project_archiviste_vault.md` (état + séquence agents-avant-audit).
2. `docs/vault/README.md`, puis selon le sujet : `vision/modele-economique.md`,
   `principes/invariants.md`, `recherches/inventaire-sources.md`.
3. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur (généré auto avant compaction).

## Pièges / fils ouverts
- Séquence tranchée : **agents AVANT la mission d'audit** (les agents produisent les besoins de
  l'audit). Ordre : Data Curator (fait) → Design Critic (fait) → Business Strategist → puis audit.
- **Marque** : tranchée (puce `futur•e`), harmonisée sur le repo (voir « Fait dans cette session »).
- **Trouvailles /ou-vivre non appliquées** (volontaire, on testait l'agent) : reflet premium
  animé du bouton Pack, double typewriter AskFuture redondant avec ses chips, ligne d'aperçu
  redondante dans la matrice, glyphes ⚠/✓ à vérifier au rendu. Rapport gardé en référence.
- Réserve : Run 3 (conv PostHog), pages `modules/` ×7, et 2 correctifs SITE (prix `/le-fil`
  9€/mois → annuel ; taxonomie « 10 dimensions » de `/professionnels`).

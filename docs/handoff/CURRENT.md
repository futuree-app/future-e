# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `main` ; le Business Strategist est sur `feat/business-strategist`.

## Objectif en cours
Construction de la « mémoire stratégique » de futur•e (vault à deux niveaux) et de l'équipe
d'agents IA. **La séquence des 4 agents est terminée** (Archiviste, Data Curator, Design Critic,
Business Strategist). Prochain grand chantier : spécifier la **mission d'audit** de l'archiviste,
nourrie par les besoins réels que les agents font émerger.

## Fait dans cette session
- **PR #8 mergée sur `main`** (`a07dd9c`) : gouvernance vault en 4 temps.
  1. **Design Critic** : terrain `recherches/inventaire-design.md` (signatures durables, 4
     régimes de style, pourquoi la colocation est assumée, patterns, tensions, grille) + agent
     read-only « rédacteur en chef de l'écran » (protéger/simplifier/révéler). Option A (ne juge
     pas la plomberie token) + frontière texte. Testé `/ou-vivre` : concluant.
  2. **Marque** : puce `futur•e` (U+2022) tranchée canonique, sweep byte-safe sur 50 fichiers,
     séparateurs et export Notion préservés, dossier non renommé.
  3. **Constitution v2** : invariants 10 → 8, plus durs (test « survit à une reconstruction dans
     10 ans »). n°4 = servir la décision, n°5 = ne pas affirmer au-delà de la preuve, n°6 absorbe
     l'ancien « mouvement », n°8 = évolue avec les preuves jamais les intérêts. « Forme sert le
     fond » → tête de `doctrine/design.md` ; « renforce le B2C » → principe stratégique (ADR-0008).
  4. **Manifeste** : recentrage climat → décision, « Contre l'amnésie » reformulé, totem de clôture.
- **Business Strategist livré** (`feat/business-strategist`, à commiter) : 4e agent. Terrain déjà
  existant (`modele-economique.md`), donc **mandat fin sans nouvelle page** (choix porteur).
  Question = renforce-t-il le moteur et le moat ? Dit non au revenu vanité. Discipline propre :
  lit tout contre la hiérarchie de preuve (signale les paris déguisés en acquis). PAS encore testé.
- Corrigé un résidu v2 : Liens de `modele-economique.md` citaient encore invariants n°8/9.

## État git
- Branche `feat/business-strategist` (à commiter/PR) : `.claude/agents/business-strategist.md`,
  `docs/vault/vision/modele-economique.md` (fix liens), `docs/handoff/CURRENT.md`. Mémoire MAJ.
- `main` à jour (PR #8 mergée, branche `feat/design-critic` supprimée).

## Prochaine étape immédiate
1. Tester le Business Strategist à chaud sur une décision réelle (ex. pricing Le Fil, un segment
   B2B, le Mode Foyer), puis commiter/PR.
2. Spécifier la **mission d'audit** de l'archiviste : la séquence d'agents est finie, ils ont
   produit les vrais besoins (dette doc, dédup ~20 %, contradiction-vs-code). Voir
   `project_archiviste_vault` pour le cadrage déjà tranché.

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

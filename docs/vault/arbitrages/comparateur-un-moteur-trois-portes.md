# Arbitrage : un seul moteur de comparaison, trois portes, une sortie

- **Date** : mini-board 2026-06-26 (Product, Business, Software Architect, Editorial + critique
  externe ChatGPT), tranché par le porteur.
- **Source** : audit des surfaces de comparaison, vérifié dans `src/lib/comparateur-vie.ts`,
  `src/app/(public)/comparateur/page.tsx`, `src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx`.
  Recoupe `adr/ADR-0007-pack-decision-bundle.md` (son addendum), `arbitrages/comparateur-communes-retrograde.md`.

## Contexte

futur•e portait **deux moteurs de comparaison** qui ne se parlaient pas :
- le **moteur moderne** (`comparateur-vie.ts`, `buildComparaisonComplete`, index national),
  conforme : il classe par préférences, palier absolu + avantage relatif, « hors score/tri ».
  Il alimente `/ou-vivre`, la comparaison complète et le Pack Décision ;
- un **moteur legacy** (`/comparateur`, table Supabase `communes_tension`), vestige d'avant le
  pivot : il affichait des **scores synthétiques** (« scores synthétiques à l'échelle communale »
  en toutes lettres, `Score X/100` par dimension) et un cadre **risque** (« Risque Élevé »,
  « moins exposée »). Double passif : il contredit l'**invariant n°2** (pas de score synthétique)
  et le **pivot de positionnement** (`adr/ADR-0002`, futur•e n'est pas un site de risques).

## Décision

**Un seul moteur (le conforme), trois portes d'entrée, une sortie.**

- **Porte 1, `/ou-vivre`** : le lecteur exprime des préférences, le moteur **propose** un trio
  qu'il ne choisit pas. C'est la **découverte**.
- **Porte 2, le mode choix** (URL `/comparateur` réutilisée, reconstruite sur le moteur conforme,
  legacy `communes_tension` jeté) : le lecteur **nomme** lui-même 2-3 communes. C'est le
  **départage** de lieux déjà en tête. C'est la seule porte où le lecteur choisit ce qu'il compare.
- **Porte 3, le Pack Décision** : la sortie payante (matrice complète), upsell des deux autres.

Modèle gratuit/payant **hérité tel quel** : gratuit = comparaison légère (identité / forces /
compromis, zéro score) ; payant = matrice complète. La comparaison complète gratuite est interdite
(elle cannibaliserait le Pack).

## Pourquoi

- **Le besoin « comparer des communes que JE choisis » est réel et n'était servi nulle part** :
  même le Pack compare un trio *sélectionné par le moteur* (`slice(0, 3)`). C'est un modèle de
  contrôle distinct (choix utilisateur vs proposition moteur), un trou dans l'offre, pas un doublon.
- **Le legacy était un passif doctrinal**, pas un actif : retiré, jamais maintenu.
- **Le « 3 » n'était qu'une architecture** : la paire suffit à révéler un compromis ; le palier
  absolu est indépendant du nombre. D'où la redéfinition du Pack (cf. addendum `ADR-0007`).
- **Préserver l'URL, changer le moteur** : `/comparateur` est la cible des landings SEO
  programmatiques. « Kill » ne veut pas dire « 404 » : l'URL et le funnel survivent, le moteur
  derrière change. Frontière à border avec le Discoverability Strategist au lancement.

## Liens

`adr/ADR-0007-pack-decision-bundle.md` (addendum : Pack redéfini, modes replay/choix),
`adr/ADR-0002-pivot-compatibilite-territoriale.md`, `adr/ADR-0001-pas-de-score-synthetique.md`,
`principes/invariants.md` (n°2), `modules/comparateur.md`, `doctrine/editoriale.md` (la promesse),
`vision/modele-economique.md`, `arbitrages/comparateur-communes-retrograde.md`, `paris.md`
(paris #3, #4, #5), `/memory/project_comparateur_complet.md`.

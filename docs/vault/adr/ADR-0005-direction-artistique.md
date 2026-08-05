# ADR-0005 : Direction artistique

- **Statut** : accepté
- **Date** : 2026-04-17
- **Source** : `Documentation Notion/.../02 1 — Vision produit` (principe 2) et journal des
  décisions produit.

## Contexte

Le produit doit tenir une promesse esthétique cohérente avec son positionnement (« magazine
exigeant », « plus habitable qu'une app green »), et figer une base pour ne pas la
rediscuter à chaque sprint.

## Décision

Direction artistique **glassmorphism sombre** : fond profond (`#060812`), accent orange
(`#fb923c`), typographies Inter Tight / Instrument Serif / JetBrains Mono. Deux principes de
design non négociables qui en découlent : **la narration prime sur les graphiques**, et
**les sources sont visibles à chaque affirmation significative**.

## Ce qui a bougé depuis

Cette décision est datée et ne se réécrit pas ; elle a été amendée deux fois, et **aucun des trois
éléments cités ci-dessus n'est encore exact**. La règle vivante est dans `doctrine/design.md`.

| Cité ici | Aujourd'hui | Quand |
| --- | --- | --- |
| Inter Tight | **Archivo**, famille unique pour toute l'interface | 01/08/2026 |
| Instrument Serif (le logo) | **aucune police** : le logo est un dessin vectoriel, `components/Logo.tsx` | 04/08/2026 |
| `#fb923c` | **`#E8823A`** | 04/08/2026 |

Ce qui n'a pas bougé, et qui était le vrai contenu de la décision : le glassmorphism sombre, le fond
`#060812`, la narration qui prime sur les graphiques, et les sources visibles à chaque affirmation
significative.

## Pourquoi ADR ET doctrine

C'est à la fois une décision figée et datée (cette page) et une **règle vivante appliquée à
chaque écran**. Suivant la frontière ADR/doctrine du vault : la décision se grave ici, les
règles d'application vivent dans `doctrine/design.md` (qui les détaille et évolue).

## Liens

`doctrine/design.md`, `doctrine/interface.md`, `vision/positionnement.md`.

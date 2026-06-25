# Arbitrage : comptage binaire d'accès aux équipements (BPE) rejeté

- **Date** : printemps 2026
- **Source** : `/memory/bpe_rayon_pondere.md`, `/memory/project_roadmap.md`.

## Option étudiée

Mesurer l'accès aux équipements (BPE, base permanente des équipements) par un **comptage
binaire** : l'équipement est présent dans un rayon, ou non.

## Décision

**Rejeté** au profit d'un **accès pondéré par proximité** (somme pondérée `1 - d/25` coupée
au rayon par classe de bassin, 5/10/15/25 km).

## Pourquoi

Le comptage binaire produisait une **inversion centre/périphérie** absurde : une commune
périphérique pouvait « cocher » autant d'équipements qu'un centre dense en élargissant le
rayon, écrasant la réalité de la proximité vécue. La pondération par distance rétablit la
hiérarchie réelle d'accès.

## Liens

`/memory/bpe_rayon_pondere.md`, `modules/territoire.md`.

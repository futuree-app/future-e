# Arbitrage : amplificateur de score inondation rejeté

- **Date** : printemps 2026
- **Source** : `/memory/inondation_scoring.md`.

## Option étudiée

Faire de l'inondation un **amplificateur du score** de tri du comparateur (un lieu très
exposé serait pénalisé dans le classement).

## Décision

**Rejeté.** L'inondation reste un **signal narratif** (`climatInondation`), hors du tri.

## Pourquoi

Cohérent avec l'ADR-0001 (pas de score synthétique) : amplifier un score par un risque
mélange une donnée de danger avec un classement de préférences, et invente un palier de
pénalité non justifié. Le risque se raconte, il ne pondère pas en silence.

## Note

La méthodologie complète du score submersion (fluvial DRIAS, côtier) et son histoire vivent
dans `/memory/inondation_scoring.md` et `/memory/risque_enrichment_eaip.md`. Cette page ne
porte que la décision de design.

## Liens

`adr/ADR-0001-pas-de-score-synthetique.md`, `/memory/inondation_scoring.md`.

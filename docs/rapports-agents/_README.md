# Rapports des agents

Archive des **rapports produits par les sous-agents read-only** de futur•e (Archiviste, Data
Curator, Design Critic, Business Strategist). Un sous-dossier par agent.

## Pourquoi ce dossier existe

Les agents sont read-only : ils **proposent**, l'humain tranche, Claude principal applique. Leur
rapport n'est pas affiché automatiquement au porteur (il revient à Claude comme résultat
d'outil). On le dépose ici quand il mérite d'être relu, challengé ou archivé.

## Statut des rapports

Un rapport est une **évaluation datée**, pas de la doctrine. La doctrine vit dans `docs/vault/`.
Si un rapport débouche sur une décision, c'est le **vault** (ADR, arbitrage, doctrine) qui la
grave, pas ce dossier. Un rapport peut donc devenir obsolète : il garde la trace d'un jugement à
un instant T, utile pour comprendre *pourquoi* une décision a été prise.

## Convention de nommage

`docs/rapports-agents/<agent>/AAAA-MM-JJ-<sujet>.md`

Exemple : `business-strategist/2026-06-26-pricing-le-fil.md`.

## Les agents

- `archiviste/` — rapports d'impact mémoire (vault + /memory) et, à venir, audits de dette doc.
- `data-curator/` — rapports d'évaluation de sources (intégrer / refuser / différer).
- `design-critic/` — rapports de critique d'écran (conforme / à ajuster / à revoir).
- `business-strategist/` — rapports stratégiques (poursuivre / ajuster / refuser / différer).

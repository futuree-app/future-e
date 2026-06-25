# ADR-0003 : Territoire actif de lecture, distinct de la résidence

- **Statut** : accepté
- **Date** : 2026-05-31
- **Source** : `/memory/parcours_doctrine.md`.

## Contexte

Le modèle naïf « 1 utilisateur = 1 commune (sa résidence) » casse dès qu'une personne veut
analyser un territoire où elle n'habite pas encore (achat, déménagement, projet de retraite).
Or c'est précisément le moment de vie déclencheur du lecteur cible.

## Décision

L'accès est modélisé par **`report_grants` indexés par code INSEE** : un grant débloque un
territoire. Le **territoire actif de lecture** est une notion distincte de la résidence.
On n'écrase jamais `home_insee_code` quand l'utilisateur explore un autre lieu.

## Pourquoi

Le produit sert des décisions de projection (« est-ce que vivre ici resterait un bon
pari ? »), pas un suivi de résidence. Lier l'analyse à la seule résidence amputerait le cas
d'usage le plus payant.

## Conséquences

- Metadata Stripe et schéma Supabase portent le grant par INSEE.
- Helper applicatif `getActiveTerritory` pour résoudre le territoire en cours de lecture.
- Piège connu : `home_insee_code` doit rester un code INSEE, jamais un code postal (voir
  `/memory/home_insee_code_pitfall.md`).

## Liens

`architecture/parcours-et-acces.md`, `/memory/parcours_doctrine.md`,
`adr/ADR-0002-pivot-compatibilite-territoriale.md`.

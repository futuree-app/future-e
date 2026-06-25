# Arbitrage : l'héritage industriel pollué n'est pas scoré

- **Date** : printemps 2026
- **Source** : `/memory/exposition_industrielle.md`, `/memory/project_roadmap.md`.

## Option étudiée

Intégrer l'héritage industriel pollué (anciens sites BASOL, sols et sites pollués) au score
d'exposition industrielle.

## Décision

L'héritage pollué reste **volontairement non scoré** (traitement narratif éventuel en V2
distincte). Seuls les sites **ICPE / Seveso actifs** sont scorés (critère
`faible_exposition_industrielle`).

## Pourquoi

Scorer l'héritage industriel revient à pénaliser des territoires souvent populaires et
ouvriers : c'est un **biais social** déguisé en mesure de risque. Le risque actif (sites en
fonctionnement) est un signal légitime ; le passé industriel d'un quartier en est un autre,
qui demande un traitement séparé et prudent.

## Statut produit tranché (2026-06)

L'héritage est traité en **signal narratif gaté** (jamais dans le tri ni le score), avec
porte ouverte à un futur **filtre opt-in binaire non scoré** (« éviter les territoires
comportant plusieurs sites historiquement pollués »). Jamais une pondération.

## Cartographie des sources (à revalider en live avant tout chantier)

- **SSP / ex-BASOL = socle** : CSV national + API Géorisques, ~11 200 sites (2025), capte les
  anciennes usines à gaz (témoin canonique Marcel-Paul à La Rochelle).
- **SIS = complément** réglementaire (constructibilité).
- **CASIAS / ex-BASIAS = banni du score** : 300 000+ sites, présence ≠ pollution, toute ville
  en a, biais massif. Au mieux un signal de fiche.
- **Cartofriches = fiche seulement** : non exhaustif (trous → faux « rien ici »).

> Réserve : l'accessibilité de SSP/ex-BASOL affirmée ici vient d'une conversation et
> **contredit** `/memory/idee_sante_environnementale.md` (qui note BASOL/BASIAS instables,
> refonte InfoSols 2024-25). À confirmer par un appel réel avant d'en dépendre, conformément
> à la doctrine data (le factuel se recoupe contre la donnée, pas contre une conversation).

## Liens

`/memory/exposition_industrielle.md`, `/memory/idee_sante_environnementale.md`,
`doctrine/data.md`, `modules/sante.md`.

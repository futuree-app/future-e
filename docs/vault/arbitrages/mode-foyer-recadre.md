# Arbitrage : le mode Foyer recadré, découplé du comparateur de villes

- **Date** : confirmé porteur 2026-06-25 (recadrage depuis l'intention Notion d'avril 2026)
- **Source** : `Documentation Notion/.../02 4 — Features transversales` (intention
  d'origine), arbitrage porteur 2026-06-25.

## Contexte

Dans l'intention d'origine, le « mode Foyer » était l'abonnement payant majeur, et le
**comparateur de villes** en était l'exclusivité (réservé au Foyer). Le produit a pivoté.

## Décision

- **Le comparateur de villes n'est plus une exclusivité Foyer.** Le comparateur de projet
  de vie est devenu le **produit public central** (voir
  `adr/ADR-0002-pivot-compatibilite-territoriale.md`). Le découplage est acté.
- **Le mode Foyer reste intéressant en soi, mais redéfini** autour de ce qui lui est propre :
  des **comptes multi-personnes** et des **comparatifs nourris par les données du foyer**
  (croiser une décision de territoire avec la situation réelle des membres du foyer). C'est
  une feature future, pas l'enveloppe payante du comparateur.

## Pourquoi

Gâter le comparateur derrière le Foyer contredirait le pivot : le comparateur est ce qui
attire le public. La valeur propre du Foyer n'est pas l'accès au comparateur, c'est la
**dimension multi-personnes** que rien d'autre ne porte.

## Liens

`adr/ADR-0002-pivot-compatibilite-territoriale.md`, `arbitrages/pricing-abonnements-reportes.md`,
`vision/archetype-lecteur.md`.

# Arbitrage : pricing, abonnements mensuels reportés

- **Date** : décision d'origine avril 2026, état confirmé porteur 2026-06-25
- **Source** : journal des décisions produit (Notion), commits `f8717c5`, `c84bf95`,
  `/memory/project_paywall_territoire.md`, `/memory/project_comparateur_complet.md`.

## Contexte

Le pricing d'origine prévoyait : gratuit, rapport 14 € one-shot, abonnement Suivi 9 €/mois,
abonnement Foyer 15 €/mois. Le produit réel a évolué.

## État actuel (statut mixte)

- **Livré** : rapport **14 €** (one-shot), **Pack Décision 39 €**.
- **ABANDONNÉ (2026-07-09)** : l'abonnement récurrent « Le Fil » était inscrit au prévisionnel
  T4 2026, à un tarif annuel de l'ordre de 49,99 €. **Ce prévisionnel tombe.** Une session de
  mesures a établi que la veille événementielle territoriale n'a pas de matière : 87 % des communes
  sans aucun événement décisionnel sur douze mois, un p90 de publication des arrêtés CatNat à
  640 jours, et un prix communal dont la variation annuelle est du bruit d'échantillonnage.
  Voir `arbitrages/le-fil-veille-evenementielle-ecartee.md`.
  Le récurrent, s'il existe, viendra du **cycle de vie** (le lecteur change, pas le territoire), du
  **débit d'inconnus**, ou du **produit qui grandit**, jamais d'une veille.
- **Écart prod à recaler (urgent)** : la page de pré-lancement `/le-fil` (liste d'attente,
  `noindex`) est en production et **affiche encore « 9 €/mois · 30 jours offerts »**, plus une
  promesse de newsletter mensuelle et de tableau de bord. Elle vend désormais un produit que
  futur•e ne construira pas. À recadrer ou retirer : action sans regret.

## « Le Fil » (abonnement) ≠ « Mode Foyer » (upsell) : deux axes distincts

Les projections de mai 2026 listaient « Suivi Solo 9 €/Foyer 15 €/mois » comme deux paliers
d'un même abonnement. Recadrage porteur : ce sont **deux choses sans rapport**.

- **Le Fil** = l'abonnement de veille, le récurrent qui « continue à comprendre son
  territoire » (promesse large, pas anxiogène). C'est un **autre moment d'achat** que le
  one-shot : dans la grille gratuit / 14 € / 39 €, le visiteur arbitre « 14 € ou 39 € ? »,
  pas « est-ce que je m'abonne ? ». Il se présente donc en bloc séparé, après le texte
  éditorial qui répond à « pourquoi continuer après l'achat ? ».
- **Mode Foyer** = un **upsell sur le rapport one-shot** (dimension multi-personnes), vendu
  après le rapport, **pas un palier d'abonnement**. Son prix reste à fixer. Voir
  `arbitrages/mode-foyer-recadre.md` pour sa redéfinition (multi-personnes, découplé du
  comparateur public).

## Pourquoi cette page

Le journal des décisions Notion est **périmé** sur le pricing. On trace ici l'écart pour ne
pas relire l'ancien tarif comme la vérité, tout en gardant que le récurrent n'est pas mort,
seulement différé, et que Foyer n'est pas un abonnement.

## Liens

`/memory/project_paywall_territoire.md`, `/memory/project_comparateur_complet.md`,
`/memory/feedback_tva_franchise.md` (franchise en base, jamais « TVA incluse »),
`arbitrages/mode-foyer-recadre.md`, `vision/manifeste.md`.

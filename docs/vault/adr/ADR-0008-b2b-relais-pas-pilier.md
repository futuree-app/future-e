# ADR-0008 : Le B2C est le socle, le B2B un relais en avant-première dès automne 2026

- **Statut** : accepté (décision stratégique ; pas de produit B2B payant livré, mais une page
  de pré-lancement publique active)
- **Date** : position consolidée au 25 juin 2026 (calendrier confirmé porteur contre l'étude)
- **Source** : page de production `/professionnels` (« futur•e Pro », avant-première,
  lancement automne 2026), « Étude de marché v2 » (10 juin 2026), retour business plan
  (conv. ChatGPT, juin 2026), « Projections consolidées » (mai 2026), business models par
  segment (CGP, assurance, notaires, diagnostiqueurs). Recoupe `vision/modele-economique.md`,
  `vision/archetype-lecteur.md`.

## Contexte

Trois sources donnaient trois calendriers B2B. Les projections de mai 2026 activaient le B2B
tôt et agressivement (CGP M+6, assurance M+9, notaires M+12, diagnostiqueurs M+15 ; B2B = 46 %
du MRR à M+36). L'étude de marché du 10 juin 2026 repoussait par prudence (« B2B exploré à
partir de 2027 »). Mais le produit réel a déjà tranché : la page `/professionnels` est en
production (avant-première, formulaire de capture, `robots: noindex`) et annonce un
**lancement à l'automne 2026, segment par segment**. Le porteur confirme (2026-06-25) que
c'est ce calendrier qui fait foi : la prod prime sur le prévisionnel de l'étude.

## Décision

Le B2B est un **relais de croissance dimensionné, pas un pilier ni une béquille du B2C**.
Le B2C reste le socle : la priorité absolue demeure de prouver la conversion B2C
(instrumenter le tunnel : taux de clic CTA payants, taux paywall vers paiement). Mais
l'**avant-première B2B démarre dès l'automne 2026** (capture de leads, entretiens découverte,
essais gratuits prioritaires, construction des features par métier), en parallèle de la
preuve B2C, pas après elle. La montée en revenus B2B s'étale ensuite sur 2027.

Formule de référence : « le B2B n'est pas la béquille du B2C, c'est la valorisation
secondaire d'une preuve d'usage B2C ». Il devient simple à vendre une fois qu'on peut dire
« on a X recherches de lieux de vie, Y achats, Z territoires comparés ».

## Pourquoi

- L'hypothèse critique du modèle (le consentement à payer B2C, jamais démontré, précédent
  CityScan) reste à lever : le B2C garde la priorité d'effort (cf. `vision/modele-economique.md`).
- Charge soutenable pour un fondateur solo : l'avant-première s'ouvre **segment par segment**
  (CGP d'abord, friction la plus basse : le produit actuel suffit, seul l'export PDF manque),
  pas les quatre d'un coup.
- Le B2B reste un levier puissant (étude : SAM B2B 5-15 M€/an ; projections : ~46 % du MRR à
  M+36) : « relais » ne veut pas dire marginal, veut dire séquencé et secondaire au socle B2C.
- La référence de marché B2B existe (CityScan, 6-8,50 € HT/adresse aux mêmes professions) :
  le pari B2B est crédible.

## Conséquences

- Roadmap B2B conditionnée par segment : export PDF (CGP/notaires), données CatNat
  (assurance), recherche par adresse (notaires/diagnostiqueurs), version mobile
  (diagnostiqueurs), API.
- `/professionnels` (avant-première, automne 2026) est la surface live du B2B aujourd'hui :
  capture de leads, pas de produit payant. Aucun chiffre de revenu B2B n'est gravé comme
  acquis ; les ARPU par segment (cf. `vision/modele-economique.md`) sont du prévisionnel.
- Vigilance cohérence : la page `/professionnels` parle de « dix dimensions » et de « ~35 000
  communes (métropole et ultra-marin) » là où le B2C dit « 7 thèmes / près de 30 critères » et
  « 34 000 communes (métropole) ». À harmoniser (cf. note de dette dans `doctrine/data.md` et
  la règle de non-confusion des taxonomies).
- À rouvrir si la preuve B2C échoue (le B2B pourrait devenir prioritaire) ou si un accord
  cadre B2B (réseau de diagnostiqueurs, éditeur logiciel, chambre professionnelle) se présente.

## Liens

`vision/modele-economique.md`, `vision/archetype-lecteur.md`,
`adr/ADR-0002-pivot-compatibilite-territoriale.md`,
`arbitrages/pricing-abonnements-reportes.md`.

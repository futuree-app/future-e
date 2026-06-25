# ADR-0008 : Le B2B est un relais de la preuve B2C, jamais le point de départ

- **Statut** : accepté (décision stratégique ; pas de produit B2B payant livré, page de
  pré-lancement publique active)
- **Date** : position consolidée au 25 juin 2026
- **Source** : page de production `/professionnels`, « Étude de marché v2 » (10 juin 2026),
  retour business plan (juin 2026), « Projections consolidées » (mai 2026), business models par
  segment. Recoupe `vision/modele-economique.md`, `vision/archetype-lecteur.md`.

## Décision (le principe durable)

**On construit toujours une preuve d'usage B2C avant de vendre aux professionnels. Le B2B
valorise cette preuve, il ne la précède jamais et ne dicte jamais la roadmap cœur.**

Trois raisons qui ne dépendent d'aucun calendrier :
- le produit s'améliore grâce aux usages B2C (la boucle de la donnée d'usage) ;
- le B2B se vend facilement une fois qu'on peut dire « on a X recherches de lieux de vie, Y
  achats, Z territoires comparés » : il valorise une preuve, il ne la fabrique pas ;
- chaque produit (B2B compris) doit **renforcer le moteur B2C, jamais le détourner**. futur•e
  ne devient pas un SaaS de diagnostics (cette ADR dérive de l'**invariant n°9**).

Formule de référence : « le B2B n'est pas la béquille du B2C, c'est la valorisation secondaire
d'une preuve d'usage B2C ».

## Pourquoi (et non l'inverse)

- L'hypothèse critique du modèle (le consentement à payer B2C, jamais démontré, précédent
  CityScan parti en B2B) doit être levée par le B2C lui-même (cf. `vision/modele-economique.md`).
- Charge soutenable pour un fondateur solo : on ouvre **segment par segment**, par friction
  croissante (CGP d'abord, le produit actuel suffit), pas les quatre d'un coup.
- Le B2B reste un levier puissant (SAM B2B 5-15 M€/an ; ~46 % du MRR à M+36 dans les
  projections) : « relais » ne veut pas dire marginal, veut dire séquencé et secondaire.

## Annexe : état actuel et calendrier (daté, vieillira)

Le calendrier découle du principe, il n'est pas la décision. Au 2026-06-25 : la page
`/professionnels` est en production (avant-première, capture de leads, `noindex`) et annonce un
lancement **automne 2026, segment par segment**. C'est ce calendrier qui fait foi (la prod prime
sur le « 2027 » prudent de l'étude), mais il est susceptible de bouger : seul le principe
ci-dessus est gravé. Aucun revenu B2B n'est acquis ; les ARPU par segment
(cf. `vision/modele-economique.md`) sont du prévisionnel.

## Conséquences

- Roadmap B2B conditionnée par segment : export PDF (CGP/notaires), CatNat (assurance),
  recherche par adresse (notaires/diagnostiqueurs), mobile (diagnostiqueurs), API.
- Vigilance cohérence : la page `/professionnels` parle de « dix dimensions » et « ~35 000
  communes » là où le B2C dit « 7 thèmes / près de 30 critères » et « 34 000 communes ». À
  harmoniser.
- À rouvrir si la preuve B2C échoue (le B2B pourrait devenir prioritaire) ou si un accord cadre
  B2B (réseau, éditeur logiciel, chambre) se présente avant l'échéance.

## Liens

`vision/modele-economique.md`, `vision/archetype-lecteur.md`,
`adr/ADR-0002-pivot-compatibilite-territoriale.md`, `principes/invariants.md`,
`arbitrages/pricing-abonnements-reportes.md`.

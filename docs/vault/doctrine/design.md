# Design : direction artistique et principes non négociables

> Règle durable. Source : `Documentation Notion/.../02 1 — Vision produit` (§2, principes de
> design non négociables). Décision datée associée : `adr/ADR-0005-direction-artistique.md`
> (l'ADR grave la décision, cette page porte les règles vivantes). Découle des invariants
> n°2, 3 et 4 (`principes/invariants.md`), et **porte le principe « la forme sert le fond »**
> (autrefois invariant, redescendu ici : trop spécifique au design pour la Constitution).

Ces décisions sont verrouillées. Elles ne se rediscutent pas à chaque sprint. Toute
proposition qui les contredit doit être explicitement justifiée avant d'être examinée.

## La forme sert le fond, jamais l'inverse

Le principe de tête de cette page, dont tout le reste découle. Une interface n'embellit jamais
au prix de la lisibilité ou de l'honnêteté du signal. **Une belle interface qui fait douter
d'un chiffre, ou qui en suggère une fausse certitude, est un échec de design, pas une
réussite.** La forme sert la doctrine éditoriale et la preuve, jamais l'inverse. C'est la
traduction design des invariants n°4 (servir la décision) et n°5 (ne pas affirmer au-delà de la
preuve).

## Direction artistique

**Glassmorphism sombre.** Palette : noir `#060812`, orange `#fb923c`, rouge `#f87171`,
violet `#a78bfa`, vert `#4ade80`, bleu `#60a5fa`. Typographies : **Instrument Sans** (sans),
Instrument Serif italic, JetBrains Mono (mono), définies en `--font-sans/serif/mono` dans
`src/app/design-tokens.css`. Mesh gradients animés, noise overlay. La DA est validée, elle ne
se remet pas en question à chaque itération.

> Note : l'ADR-0005 (intention d'origine, avril 2026) cite « Inter Tight » comme sans. La
> sans implémentée est **Instrument Sans** (vérifié dans le code 2026-06-25). Cette page porte
> la réalité actuelle ; l'ADR garde la trace de l'intention datée.

Règle de largeur de lecture et doctrine des gloses : voir `doctrine/interface.md`.

## La narration prime sur les graphiques

Chaque visualisation doit raconter quelque chose qu'un paragraphe ne pourrait pas dire aussi
bien. **Les graphiques illustrent, ils ne remplacent jamais la voix éditoriale.** C'est la
traduction visuelle de l'invariant n°4 (une donnée n'a de valeur que si elle aide une décision)
et de la doctrine éditoriale (la donnée raconte avant de convaincre).

## Sources visibles à chaque affirmation significative

Jamais d'affirmation chiffrée sans citation de source. Le format court (Santé publique
France, DRIAS, ANSES) suffit inline. Le bloc Sources complet apparaît en bas de chaque
module. C'est la traduction visuelle de l'invariant n°3.

## Rythme et notifications

Pas de notification entre 22h et 7h, ni push ni email. Les newsletters partent le lundi
matin entre 7h et 9h, heure locale. On ne notifie pas sur des pics ponctuels (ozone du jour,
alerte météo du week-end) : c'est le rôle de Météo-France et RecoSanté, pas de futur•e.

## Ce que le produit ne fait pas (contraintes de design)

Aussi importantes que les fonctionnalités :

- pas de prédiction à certitude fictive ;
- pas de score de « résilience » ou de « risque global » (voir
  `adr/ADR-0001-pas-de-score-synthetique.md`) ;
- pas de comparaison des foyers entre eux ;
- pas de pronostic individuel sur les enfants.

Les contraintes éditoriales jumelles (vouvoiement, zéro tiret cadratin, zéro point
d'exclamation, zéro emoji, pas de prescription politique ou de geste individuel) vivent dans
`doctrine/editoriale.md`. La confidentialité (jamais l'adresse exacte, seulement INSEE +
IRIS) vit dans `doctrine/data.md`.

## Liens

`adr/ADR-0005-direction-artistique.md`, `doctrine/interface.md`, `doctrine/editoriale.md`,
`doctrine/data.md`, `principes/invariants.md`.

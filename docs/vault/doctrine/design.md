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

**Glassmorphism sombre.** Palette : noir `#060812`, orange `#E8823A`, rouge `#f87171`,
violet `#a78bfa`, vert `#4ade80`, bleu `#60a5fa`, jaune `#fbbf24`. Typographies : **Archivo**
(interface entière, variable 100-900) et JetBrains Mono (valeurs et métadonnées), définies en
`--font-sans/serif/mono` dans `src/app/design-tokens.css`. **Aucune police ne porte la marque** :
le logo est un dessin vectoriel (voir l'amendement du 2026-08-04). Fond profond, verre translucide,
noise overlay. La DA est validée, elle ne se remet pas en question à chaque itération.

> **Amendement du 2026-08-01 (arbitrage du porteur).** L'interface passe d'un **titrage serif
> littéraire à une grotesque unique**, Archivo. Justification, comme cette doctrine l'exige :
> Instrument Serif et Instrument Sans étaient toutes deux signalées comme surexposées, et
> l'italique serif surdimensionnée du hero est l'un des marqueurs les plus reconnaissables d'une
> page d'accueil générée. Au-delà de la mode, le registre était faux : futur•e est un instrument de
> mesure doublé d'un dossier d'expertise, et un rapport d'ingénierie n'emploie pas de serif élégante.
>
> Quatre serifs avaient été comparées sans emporter la décision, ce qui était le résultat utile :
> elles partageaient toutes le même parti pris.
>
> **La marque garde son dessin.** Le logo « futur•e » reste en Instrument Serif italique, isolé sur
> `--font-brand`. Changer la police de l'interface ne change pas la marque.
>
> *(Cette phrase a été dépassée trois jours plus tard : voir l'amendement du 2026-08-04. Elle reste
> ici parce qu'elle dit ce qui était décidé le 01/08, et que le raisonnement qui l'a remplacée ne se
> comprend qu'en la lisant.)*
>
> **Ce qui rend Archivo distinctive est le réglage, pas le dessin.** Elle descend des grotesques
> américaines : posée en 400 avec un tracking normal, elle redevient invisible. La hiérarchie repose
> désormais entièrement sur une **échelle de graisses**, gravée dans les tokens, qui sépare toujours
> un titre de son texte par deux crans (600 contre 400). Un seul cran ne se voit pas sur une
> grotesque, il se lit comme une erreur de rendu.
>
> Règles d'application dans `DESIGN.md` (racine), § 9.1.

> **Amendement du 2026-08-04 (charte de marque v1.7, arbitrage du porteur).**
>
> **Le logo n'est plus une police, c'est un dessin.** Instrument Serif et le token `--font-brand`
> quittent le dépôt. La charte livre un mot-symbole vectoriel dont la coupe du `r`, les sept fûts à
> 35 unités et la position du point sont des valeurs décidées : aucune police ne les produit, et
> vectoriser une police revenait à graver le dessin qu'on venait d'écarter. Il vit dans
> `src/components/Logo.tsx`, un composant unique plutôt que les huit SVG du pack, qui ne diffèrent
> que par leurs deux `fill` : les importer tels quels figerait la couleur hors du thème. Le
> mot-symbole ne descend pas sous 22 px de haut. Le nom **dans une phrase** reste du texte.
>
> **L'orange de marque devient `#E8823A`**, hors du preset Tailwind `orange-400`, vers une teinte
> plus terreuse.
>
> **Les six registres de décision ont leurs propres tokens** (`--reg-*`), aux valeurs de la charte.
> Deux changent de teinte : l'écart passe du jaune au violet, et le non su quitte l'améthyste pour
> un gris neutre, parce qu'**un statut inconnu ne reçoit aucune valence**. C'est le seul des deux
> qui soit un vrai renversement : peindre « nous n'avons pas pu lire cette donnée » d'une couleur
> qui a du sens, c'était affirmer quelque chose au-delà de la preuve, l'invariant n°5.
>
> Règles d'application dans `DESIGN.md` (racine), § 5.2, § 5.4 et § 9.1.

> **Amendement du 2026-07-30 (arbitrage du porteur).** Cette page mentionnait « mesh gradients
> animés » ; les **orbes flous en `position: fixed` sont retirés de la direction artistique**.
> Justification explicite, comme cette doctrine l'exige de toute proposition contraire : ce qui pose
> problème n'est pas le glassmorphism, c'est son **automatisme**. Trois orbes dupliqués à l'identique
> sur vingt-cinq pages, y compris dans le rapport payant, cessent d'être une signature et deviennent
> un fond d'usine, aujourd'hui reconnaissable comme marqueur d'interface générée. Le fond profond, le
> verre et le grain tiennent la promesse esthétique sans ce motif. Le reste de la DA est inchangé.
>
> **La palette devient close** au même moment : les sept teintes ci-dessus, et aucune autre. Trois
> orphelines sont supprimées (`#38bdf8` rejoint le bleu ; `#c8b89a` et `#d4a574`, deux sables
> voisins jamais distingués, rejoignent l'orange). Toute couleur s'écrit `var(--token)`.
>
> Règles d'application dans `DESIGN.md` (racine), § 5.

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

`DESIGN.md` (racine, l'application écran par écran), `adr/ADR-0005-direction-artistique.md`,
`doctrine/interface.md`, `doctrine/editoriale.md`, `doctrine/data.md`, `principes/invariants.md`.

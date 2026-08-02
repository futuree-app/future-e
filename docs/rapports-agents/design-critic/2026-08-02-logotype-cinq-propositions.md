# Le logotype, cinq propositions

**Design Critic · 2 août 2026 · read-only.**
Écran jugé : `src/app/dev/logo/page.tsx` (banc de comparaison, dev uniquement).
Corpus lu : `PRODUCT.md`, `DESIGN.md` (§ 5, § 6, § 9.1), `docs/vault/doctrine/design.md`
(amendement du 01/08), `docs/vault/doctrine/editoriale.md`, `src/app/design-tokens.css`,
`public/logo/*.svg`, `src/components/Navbar.tsx`, `src/components/FutureELanding.tsx`.

**Limite de mandat, dite d'emblée.** Je n'ai pas de navigateur. Je juge le code qui produit le
signe et la géométrie qu'il décrit, pas les pixels. Trois verdicts ci-dessous dépendent d'un
rendu réel et sont marqués comme tels : la tenue à 14 px de la proposition 4, le comportement de
`var()` en attribut de présentation SVG sous WebKit, et le contraste du point médian sur le fond
crème.

---

## 0. Ce que le banc lui-même fausse, avant de juger quoi que ce soit

Trois défauts du banc rendent la comparaison biaisée. Ils ne concernent pas les propositions, ils
concernent la décision qu'on s'apprête à prendre à partir d'eux. À corriger avant de trancher.

**a. Les cinq ne sont pas à la même taille optique.** Quatre propositions sont dimensionnées en
`fontSize: size`, la cinquième (`LogoSvg`) en `height: size`. Le SVG a un `viewBox` de
`0 0 2542 837` avec la ligne de base à `y=788` : c'est une boîte d'encre serrée, pas une boîte
d'em. Fixer `height: 22px` fait donc tenir **toute la hauteur d'encre** dans 22 px, là où
`fontSize: 22px` ne donne qu'environ 17 à 18 px d'encre. La proposition 2 apparaît environ 20 à
25 % plus grosse que les quatre autres, dans chacun des cinq blocs et dans la barre de navigation
simulée. Sur un banc de logo, cet écart décide seul : le signe le plus présent gagne.

**b. Les lignes de base ne sont pas alignées.** La grille est en `items-end` et chaque cellule en
`alignItems: flex-end`. Le SVG est un `display: block` dont le bas inclut la descendante ; les
quatre autres sont des `span` en ligne dont le bas est le bas de la line-box. Les cinq marques
flottent donc à cinq hauteurs différentes. Un banc de logotype se lit sur une ligne de base et une
hauteur de x communes, jamais sur une taille nominale commune.

**c. Le mode clair du banc n'est pas le thème clair du produit.** Le bouton pose `fond` et `encre`
en dur (`#faf8f3`, `#1a1d28`) sans jamais poser `data-theme="light"`. Or c'est `[data-theme="light"]`
qui bascule les tokens (`design-tokens.css` l. 151), et le thème clair s'active aussi tout seul en
`prefers-color-scheme` (l. 200). Conséquence : dans la vue « claire » du banc, `var(--orange)` reste
`#fb923c`, soit environ **2,1:1 sur le crème**, alors que le produit impose `--orange-ink` (`#b04f00`)
pour toute encre sur ce fond (`DESIGN.md § 5.6). Le porteur juge donc la tenue du point médian sur
un rendu qui n'existera jamais, et il ne voit pas la vraie question : **sur le thème clair, la
couleur de marque du point médian devient un brun brique.** Personne n'a tranché ce point, et c'est
la seule décision chromatique réelle du dossier.

*(À vérifier en rendu : le contraste effectif du point médian, `--orange` puis `--orange-ink`, sur
`#faf8f3`. Je donne un ordre de grandeur, pas une mesure.)*

---

## 1. Verdict de spécificité : chacune est-elle authored POUR futur•e ?

Le test : si je retire le mot et que je laisse le signe, ou si je remplace « futur•e » par un autre
nom, la marque tient-elle encore debout comme étant celle de ce produit ? Et : ce signe pourrait-il
servir une fintech, un SaaS climat, un observatoire ?

| # | Proposition | Authored pour futur•e ? |
| --- | --- | --- |
| 1 | Instrument Serif italique | **Non.** Une police Google composée telle quelle. |
| 2 | Le SVG | **Non.** La même police, vectorisée. Le tracé n'a pas été redessiné. |
| 3 | Archivo 600, -0.03em | **Non, et c'est la pire des cinq sur ce critère.** |
| 4 | Le repère | **Tentative réelle, sur le bon élément, avec la mauvaise sémantique.** |
| 5 | L'horizon | **Tentative réelle, mais le concept n'est pas dans le code.** |

Aucune des cinq n'est un logotype au sens strict. Un logotype est un **dessin** : des glyphes
corrigés, une chasse réglée à la main, un signe qui n'existe que là. Cinq propositions sur cinq sont
des **réglages CSS appliqués à une police du commerce**, plus deux SVG de dix lignes. Ce n'est pas
un reproche moral, c'est le périmètre réel du dossier : la question posée n'est pas « quel
logotype », c'est « quelle police pour écrire le nom, et faut-il un signe autour ». Il faut le
dire, parce que la réponse « on garde l'existant » n'est pas un renoncement : c'est le maintien
d'un état qui n'est pas plus faible que les alternatives proposées.

**Le cas 3 mérite d'être brutal.** Archivo en 600 avec `-0.03em` sur un mot en bas-de-casse, plus
une puce orange, c'est très exactement le mot-marque le plus reproduit du web depuis 2021 : une
grotesque néo-américaine, graisse semi-bold, tracking serré, un accent coloré sur un caractère. Ce
n'est pas seulement interchangeable avec une fintech, c'est **le** réglage par défaut de la
catégorie. Et `DESIGN.md § 9.1` le dit lui-même sans le voir : « Ce qui rend Archivo distinctive est
le réglage, pas le dessin. Posée en 400 avec un tracking normal, elle redevient invisible. » Un
logo dont la seule spécificité est un réglage de graisse n'est pas une signature, c'est un titre.

Et il y a pire, mesurable dans le code : `--weight-title` vaut `600`, `--weight-section` vaut `600`.
La proposition 3 compose donc la marque **dans exactement la même graisse et la même famille que
tous les titres de section du produit**. Dans la barre de navigation simulée, seuls la taille et le
poids séparent « futur•e » de « Où vivre » et « Explorer ». Le logo cesse d'être d'une autre nature
que l'interface : il devient un item de menu un peu plus gras.

**Le cas 2 est disqualifié pour une raison de fond**, que le porteur a déjà vue et qu'il faut
inscrire : vectoriser Instrument Serif, c'est graver le dessin qu'on vient d'écarter. Mais le motif
d'écart de l'amendement du 01/08 n'était pas « cette police est laide », c'était « ce registre est
faux pour un instrument de mesure ». Si le registre est faux, il l'est autant en `.svg` qu'en
`.ttf`. Le SVG ne résout donc pas le problème, il le rend **irrévocable**.

---

## 2. Classement, du meilleur au pire

### 1er · Proposition 1, l'existant, à condition de le sous-ensembler

Elle gagne pour quatre raisons, dont aucune n'est esthétique.

**a. La doctrine l'a déjà tranchée, il y a moins de 48 heures.** L'amendement du 01/08 dans
`doctrine/design.md` écrit noir sur blanc : « **La marque garde son dessin.** Le logo « futur•e »
reste en Instrument Serif italique, isolé sur `--font-brand`. Changer la police de l'interface ne
change pas la marque. » `DESIGN.md § 9.1` le répète : « `--font-brand` désigne Instrument Serif
italique, **pour le logo et rien d'autre** ». Le banc rejuge donc une décision datée, écrite, et
motivée. C'est légitime si un fait nouveau est apparu ; le seul fait nouveau est un signalement de
linter, et un linter n'est pas un fait nouveau sur la marque.

**b. Son seul coût réel est un défaut d'implémentation, pas un défaut de dessin.** Le banc écrit en
réserve : « 70 Ko de TTF pour ce seul usage ». C'est exact et c'est réparable en une heure.
`design-tokens.css` l. 52 charge `/fonts/InstrumentSerif-Italic.ttf` : un **TTF brut, non
sous-ensemblé, non converti en WOFF2, non préchargé**, pendant que les trois autres familles sont
en WOFF2 variable (34 à 40 Ko pour des familles entières). Le logo emploie sept glyphes :
`f`, `u`, `t`, `r`, `e`, et le point. Un sous-ensemble WOFF2 de ces glyphes pèse **2 à 4 Ko**, soit
moins que n'importe laquelle des trois autres polices, et un `<link rel="preload">` supprime le
FOUT. Le raisonnement « la police coûte 70 Ko donc il faut changer de logo » repose donc sur un
chiffre qui n'a pas à exister.

**c. C'est la seule des cinq où le point médian fait quelque chose de typographique.** Le mot penche,
le point reste droit (`fontStyle: 'normal'` sur le span, dans `Navbar.tsx` comme dans le banc). Un
point fixe dans un mot qui s'incline, c'est un repère qui ne bouge pas dans un monde qui bouge. Ce
n'est probablement pas intentionnel, et c'est plus près de la promesse du produit que les deux
signes dessinés exprès. Passer à Archivo supprime cet effet sans que personne l'ait décidé, parce
que sans italique il n'y a plus de contraste droit/penché à exploiter.

**d. Elle tient partout** : texte, monochrome, toutes tailles, tous thèmes, sans plomberie.

**Ce qui ne va pas et doit être corrigé si on la garde** : le TTF non sous-ensemblé et le FOUT
Georgia → Instrument Serif, visible en tête de page à chaque chargement à froid, avec un changement
de chasse. Et une incohérence de réglage à fermer : `Navbar.tsx` compose le logo en
`letterSpacing: -0.3` (px), le banc en `-0.01em`, la nav des pages Agir en `-0.01em`. Le banc ne
teste donc pas exactement le logo de production.

### 2e · Proposition 3, Archivo

Elle est muette, générique et sans mémoire. Mais elle est **honnête** : elle ne promet rien, elle
ne ment sur rien, elle tient à toutes les tailles, en monochrome, en thème clair, sans un octet de
plus. Un mot-marque muet est une faute plus légère qu'un mot-marque qui décrit faussement le
produit, et c'est précisément ce que font les propositions 4 et 5 (§ 3). Elle a en outre une
propriété que les deux dessins n'ont pas : elle **laisse la porte ouverte**. On peut authorer un
signe par-dessus plus tard sans rien jeter.

Je la classe deuxième, et je la nomme pour ce qu'elle est : **un état d'attente, pas une réponse.**

Un effet de bord non décidé, à connaître : le caractère employé partout dans le produit est
U+2022 BULLET (`•`, 80 fichiers), et non U+00B7 MIDDLE DOT (`·`, qui est le vrai point médian et
qui nomme d'ailleurs le dossier du dépôt, `Futur·e`). Le dessin de ce bullet (diamètre, hauteur
d'assise) **appartient à la police**. Passer à Archivo redessine donc, en silence, le seul élément
distinctif du nom. Ce n'est pas grave, mais ça ne doit pas se produire par défaut : si le point
change, il se dessine.

### 3e · Proposition 4, le repère

Meilleure intuition du lot, sur le bon élément, avec la sémantique interdite. Détail au § 3.

### 4e · Proposition 5, l'horizon

Le concept est dans le commentaire, pas dans le code. Détail au § 3.

### 5e · Proposition 2, le SVG

Dernière, et de loin. C'est la seule proposition **strictement pire que celle qu'elle remplace sur
tous les axes sauf un** (faire taire le linter).

- Elle grave le dessin écarté, définitivement (§ 1).
- Elle ne peut pas suivre `prefers-color-scheme`. Le thème clair s'active tout seul chez le lecteur
  (`design-tokens.css` l. 200) ; un `<img src="...on-dark.svg">` ne le sait pas. Mode d'échec
  concret : **encre crème `#f6f4ef` sur fond crème `#faf8f3`, logo invisible.** Le rendre correct
  demande soit deux `<source>` en `<picture>` avec media query, soit du JS, à chacun des points
  d'appel. C'est une incohérence qu'on voit à l'œil, pas une question de pureté de token.
- Quatre fichiers à tenir synchronisés, avec les valeurs d'encre figées en dur (`#f6f4ef`,
  `#1a1d28`, `#fb923c`). L'argument du banc « les fichiers portent déjà les tokens du produit » est
  faux au sens strict : ils portent les **valeurs** de mai, gelées. Elles coïncident aujourd'hui
  avec `--fg-hi`. Rien ne le garantira demain, et personne ne le verra.
- Aucune variante de taille optique. Un tracé unique servant de 14 à 72 px, avec les empattements
  fins d'une serif de titrage, s'empâte en bas et s'amaigrit en haut. Un logotype en image sans au
  moins deux dessins (petit / grand) fait moins bien que du texte hinté.

---

## 3. Critique de designer des deux propositions dessinées

### 3.1 Le constat qui les condamne toutes les deux, et il est doctrinal

Les deux dessins cherchent à dire « ce que le produit fait ». Le vocabulaire qu'ils trouvent est
celui du **positionnement sur une échelle** : un curseur entre deux bornes (4), un segment coloré
sur une barre qui se remplit (5). C'est très exactement le vocabulaire du **score**.

`PRODUCT.md`, engagements de marque : « **Jamais de verdict ni de score synthétique**, ni sur un
lieu ni sur une personne. » Principe produit n°2 : « Une décision vaut mieux qu'une note. Aucun
score synthétique. » `ADR-0001` interdit non seulement le score mais « un graphique qui le
suggérerait ». Le commentaire de la proposition 4 le formule sans détour : « situer un lieu sur une
**échelle** ». Un point entre un minimum et un maximum est une note.

**Le logo annoncerait donc, à chaque page, le produit que futur•e refuse d'être.** C'est le
signalement le plus important de ce rapport, et il ne dépend d'aucun pixel.

Corollaire utile pour la suite : un signe qui veut parler de futur•e ne doit pas emprunter la
grammaire de la **position sur un axe**. Il doit emprunter celle de la **bifurcation** : plusieurs
futurs possibles, le lecteur qui choisit. Voir § 4.

### 3.2 Proposition 4, le repère · informe-t-elle ou décore-t-elle ?

**Elle décore, par construction, et le code le prouve.** Les deux crans sont dessinés à
`opacity="0.35"`. Pincement : ou bien les crans sont **essentiels** (sans eux, le point n'est plus
un curseur, c'est un point), et alors les effacer à 35 % détruit l'information tout en contredisant
`DESIGN.md § 3.1` (« l'effacement passe par une couleur testée, jamais par une opacité globale ») ;
ou bien ils ne sont pas essentiels, et alors ce sont deux traits qui ne portent rien, c'est-à-dire
un ornement, interdit par `doctrine/design.md`. Il n'y a pas de troisième branche.

**Tient-elle à 14 px ? Non, et le banc sous-estime la sévérité.** Géométrie réelle :
`viewBox="0 0 42 100"`, `width: 0.42em`, `height: 1em`.

| Élément | En em | À 14 px |
| --- | --- | --- |
| Épaisseur d'un cran (`strokeWidth=5`) | 0,05 em | **0,7 px**, à 35 % d'opacité |
| Longueur d'un cran (y 48→68) | 0,20 em | 2,8 px |
| Rayon du point (`r=9`) | 0,09 em | 1,26 px |
| Vide entre un cran et le point | 0,06 em | **0,84 px** |

La réserve du banc dit « les deux crans peuvent se fermer sous 14 px ». Ils ne se ferment pas : à
0,7 px d'épaisseur et 35 % d'opacité, ils représentent environ un quart de pixel d'encre effective.
Ils **disparaissent**, et les 0,84 px de vide les font fusionner avec le point avant de disparaître.
À 14 px il ne reste qu'un petit rond orange, c'est-à-dire la proposition 3.
*(À confirmer en rendu réel : l'antialiasing peut laisser un voile gris. Ma géométrie est sûre, sa
perception ne l'est pas.)*

**Le rapport signe/mot est faux en hauteur.** Le SVG est en `alignItems: baseline`, `display:
inline-block`, donc sa ligne de base est son bord inférieur : `y=100` tombe sur la ligne de base du
mot. Le centre du point est à `cy=58`, soit **0,42 em au-dessus de la ligne de base**. Or la hauteur
de x d'Archivo est d'environ 0,52 em, et un point médian optiquement juste se centre vers
0,26–0,30 em. Le point est donc posé **près de la ligne de hauteur de x**, presque au sommet des
`u` et du `r` qui l'entourent. Il ne lira pas comme un point médian, il lira comme un point en
exposant, ou comme un accent égaré. C'est calculable sans navigateur, et c'est le défaut de dessin
le plus visible des cinq propositions.

**Elle ne tient pas en monochrome.** Le signe repose entièrement sur un **contraste de valeur** :
crans à 35 %, point à 100 % en orange. L'actif `futuree-mono-orange.svg` existe déjà dans
`public/logo/` : en aplat d'une seule couleur, le curseur et ses crans se confondent, la figure
disparaît. Un logo qui a besoin de deux valeurs pour se lire n'a pas de version tampon, pas de
version gravée, pas de version fax.

**Lecture parasite, et elle est sévère : la proposition 4 supprime le point médian du nom.** Le
mot rendu est `futur` + `<svg aria-hidden>` + `e`. Le nom accessible, le texte copié, la recherche
Ctrl-F et l'indexation donnent **« future »**. `PRODUCT.md`, engagements de marque : « **Nom** :
futur•e, en minuscules, **avec le point médian**. » La proposition qui se réclame le plus fort de
« le mot reste du texte » est la seule qui **casse le nom dans le texte**. C'est un renversement
qu'il faut poser clairement au porteur : garder le mot en texte ne suffit pas, encore faut-il que
le texte soit le nom.

**Risque technique à lever par un test humain.** `stroke={encre}` vaut `"var(--fg-hi)"` et
`fill="var(--orange)"` sont des **attributs de présentation SVG** portant une `var()`. Le support
est bon sur les moteurs récents mais historiquement défaillant sur WebKit. En cas d'échec, la valeur
est invalide : `stroke` retombe sur `none` (crans absents) et `fill` sur `black` (point noir,
invisible sur `--bg`). À vérifier dans Safari avant toute décision : c'est un mode de défaillance
total, pas une dégradation.

### 3.3 Proposition 5, l'horizon · le concept n'est pas dans le code

**Ce que le commentaire annonce** : « Le point médian est le seul endroit où elle **s'épaissit** ».
**Ce que le code fait** : `height` est constante ; c'est la **couleur** qui change, par un
`linear-gradient` à paliers (`encre` 0→62 %, `--orange` 62→74 %, `transparent` 74→100 %). La ligne
ne s'épaissit nulle part. Le concept qui justifie la proposition n'a pas été implémenté.

**Ce que le code produit à la place** : une ligne sombre, un segment orange, puis un fondu. C'est le
dessin d'une **jauge de progression**. Une barre remplie jusqu'à 74 % sous le nom du produit se lit
comme un taux, un avancement, ou une note. Même verdict que 3.1 : `ADR-0001`, un graphique qui
suggère un score est interdit.

**La lecture parasite du soulignement est plus grave que le banc ne l'admet.** `bottom: -0.12em`,
`height: 0.045em` : ce sont, au chiffre près, l'offset et l'épaisseur d'un `text-decoration:
underline`. Et le logo est un `<Link>` dans une barre de navigation, où le soulignement est la
convention universelle du survol ou de l'item actif. Au repos, le logo aura l'air d'être survolé.
Le débordement de 0,5 em censé sauver le signe est constitué du **fondu vers transparent** : un trait
qui s'efface ne dit pas « ça continue », il dit « ça s'arrête doucement ». Le seul geste qui aurait
dit la continuation, c'est le trait qui sort **net** du cadre, et c'est l'inverse qui est codé.

**Le palier de couleur ne pointe rien.** Les 62 % sont un pourcentage de la largeur **totale** du
conteneur, mot **plus** `paddingRight: 0.5em`. Le point médian, lui, est à une position déterminée
par la chasse d'Archivo, le `letter-spacing` de -0,03 em, et la police effectivement chargée. Si
Archivo n'est pas encore arrivée et qu'Helvetica se substitue, le segment orange glisse sous une
autre lettre. Une coïncidence réglée à l'œil à une taille, présentée comme une intention.

**À 14 px** : `height = max(1, 0,63) = 1 px`. Le segment orange fait 12 % de la largeur, soit
environ 4 px de long sur 1 px de haut, et le fondu occupe le quart restant. Il reste un filet gris
sous un mot : un soulignement, rien d'autre. **En monochrome** : le signe *est* le changement de
couleur. En une seule teinte, il n'existe plus.

**Effet de bord de mise en page** : le `paddingRight: size * 0.5` fait déborder la boîte du logo
d'une demi-cadratine invisible à droite. Dans un `flex` de barre de navigation, l'espace optique
jusqu'à l'élément suivant paraîtra trop grand.

---

## 4. Ce qui manque : la sixième piste

### 4.1 D'abord, le raisonnement, parce que c'est lui qui se réutilise

Les deux dessins ont cherché le sens dans « situer sur une échelle », et ont buté sur l'interdit du
score. Or le nom **contient déjà** son propre signe, et personne ne l'a exploité : le point médian
de « futur•e » est un point d'**écriture inclusive**, c'est-à-dire un caractère dont la fonction
grammaticale est de **faire tenir deux lectures dans un seul mot**. Le nom du produit dit donc, dans
sa typographie même : *le futur n'a pas une seule forme*. C'est exactement la thèse de
`PRODUCT.md` (« habiter dans un monde qui change », scénarios optimiste / médian / pessimiste,
+2 / +2,7 / +4 °C) et c'est exactement ce que le produit refuse de réduire à une note.

### 4.2 Le dessin : la bifurcation

**Le mot reste du texte** (Archivo 600 ou Instrument Serif, ce choix devient secondaire). **Seul le
point médian est dessiné**, et il est dessiné comme un **nœud d'où partent trois trajectoires**.

Concrètement, dans la chasse du point médian, environ 0,32 em de large, sur une hauteur de 0,52 em :

- un **point plein**, au centre optique du point médian (≈ 0,27 em au-dessus de la ligne de base),
  de diamètre équivalent au bullet actuel : c'est le présent, le lieu où le lecteur se tient ;
- **trois filets** courts partant du bord droit du point, sur environ 0,14 em : un montant à
  environ +20°, un horizontal, un descendant à environ -20°. Trois scénarios. Le filet horizontal
  est le médian, et le calembour est juste : **le point médian devient le scénario médian** ;
- les trois filets s'arrêtent **avant** le `e`, à l'intérieur de la chasse. Le mot ne s'écarte pas,
  la marque garde sa silhouette actuelle.

**Pourquoi ce signe passe les tests que les cinq autres échouent :**

- **Il informe.** Il dit « plusieurs futurs partent d'ici », ce qui est la promesse. Il ne dit ni
  une note, ni une position sur un axe, ni un verdict. Il tient l'invariant n°1 (on éclaire, on ne
  décide pas) : trois branches ouvertes, aucune désignée.
- **Il est authored.** Aucune fintech, aucun SaaS climat ne met un embranchement de scénarios dans
  sa contre-forme d'interpunct. Il n'existe que parce que ce nom-là s'écrit avec un point médian.
- **Il porte une règle de dégradation, et c'est ce qui manque à toutes les autres propositions.**
  Sous 18 px, les trois filets sont retirés et il ne reste que le point plein, c'est-à-dire le logo
  actuel. La dégradation n'est pas un appauvrissement, c'est **la marque d'aujourd'hui**. Aucune des
  cinq propositions n'a de seuil de simplification déclaré ; les deux dessinées se dégradent en
  bouillie au lieu de se dégrader en quelque chose.
- **Il tient en monochrome.** Point plein + trois filets, une seule teinte. Le tampon, la gravure,
  le fax fonctionnent. On peut garder l'orange sur le point et l'encre sur les filets en couleur,
  sans que le monochrome perde la figure.
- **Il ne casse pas le nom en texte** si on l'implémente correctement : le caractère `•` reste dans
  le flux, et le signe est peint en `::after`/`background` **par-dessus**, ou le point est masqué
  visuellement mais conservé dans le texte accessible. La règle à graver : *le nom accessible reste
  `futur•e`, quoi qu'on dessine.*
- **Il vieillit bien** : c'est de la géométrie élémentaire, pas un effet.

**Ses risques, dits honnêtement.** Trois traits divergents peuvent lire « wifi », « étincelle » ou
« signal » : à conjurer par des filets courts, d'égale épaisseur, non arrondis, et par un angle
faible (±20°, jamais ±45°). Et à 0,14 em, l'épaisseur des filets tombera sous le pixel autour de
18 px : d'où le seuil de dégradation, qui n'est pas un pis-aller mais une pièce du dessin.

### 4.3 La septième piste, que je nomme sans la développer

Si le budget existe : faire **redessiner** le mot par un dessinateur de caractères, à partir
d'Instrument Serif italique ou d'Archivo comme base, avec deux ou trois corrections de glyphes (le
terminal du `f`, l'épaule du `r`, la chasse manuelle). C'est la seule voie qui produit un vrai
logotype. Les six autres pistes, la mienne comprise, produisent un **mot composé avec un signe**.
Il faut que le porteur sache que c'est le plafond de cet exercice.

---

## 5. Les critères qui comptent pour une marque (les heuristiques de Nielsen ne s'appliquent pas)

Les dix heuristiques de Nielsen évaluent un **système interactif** : visibilité de l'état, contrôle
utilisateur, prévention de l'erreur, reconnaissance plutôt que rappel. Un logotype n'a pas d'état,
n'accepte pas d'entrée, ne peut pas provoquer d'erreur et ne rend pas compte d'un système. Les leur
appliquer produirait des notes qui ont l'air rigoureuses et ne mesurent rien : c'est très exactement
la **fausse certitude** que ce rôle refuse. Je les remplace par six critères de marque, notés de 1
à 5.

| Critère | 1 · Serif | 2 · SVG | 3 · Archivo | 4 · Repère | 5 · Horizon |
| --- | --- | --- | --- | --- | --- |
| **Reconnaissabilité** (distinguable dans sa catégorie) | 3 | 3 | **1** | 3 | 2 |
| **Mémorisation** (redessinable de mémoire) | 3 | 3 | **1** | 3 | 2 |
| **Tenue à 14 px** | 3 | 2 | **5** | **1** | **1** |
| **Tenue en monochrome** | **5** | **5** | **5** | 2 | **1** |
| **Cohérence produit** (dit vrai sur ce que futur•e est) | 3 | 3 | 3 | **1** | **1** |
| **Longévité** (dans 5 ans) | 3 | 2 | 2 | 2 | 2 |
| **Total /30** | **20** | 18 | 17 | 12 | 9 |

Lectures qui comptent plus que le total :

- **« Cohérence produit » à 1 pour les deux dessins** est le résultat décisif. Ce n'est pas une
  question de goût : les deux signes énoncent une position sur une échelle, donc une note, que
  l'ADR-0001 et les engagements de marque interdisent.
- **« Reconnaissabilité » à 1 pour Archivo** est l'autre résultat décisif. Une marque qui ne se
  distingue pas ne se rappelle pas, et sur ~35 000 pages territoriales indexées, la mémorisation du
  nom est un actif de découvrabilité, pas une coquetterie.
- Le 3 de la proposition 1 sur la reconnaissabilité est un 3 **honnête, pas généreux** : elle est
  reconnaissable parce que l'italique serif est rare dans la catégorie, et faible parce que c'est
  une police du commerce que d'autres emploient.
- Un septième critère mérite d'exister et aucune proposition ne le remplit : **le seuil de
  simplification déclaré** (§ 4.2). Un logo sans version petite spécifiée n'est pas terminé.

---

## 6. Accessibilité : l'argument est réel, il est surévalué, et il se retourne

Il faut le décomposer, parce qu'il est présenté comme un bloc dans le banc alors qu'il vaut trois
choses très différentes.

**« Sélectionnable » : poids quasi nul.** Personne ne copie un mot-marque. Ce n'est pas un argument
de décision.

**« Lu par un lecteur d'écran » : poids nul, l'argument est faux.** Un `<img alt="futur•e">` est
annoncé exactement comme du texte. Il n'y a aucun écart. Et « une alternative à écrire dix-neuf
fois » est inexact : on écrit **un** composant `<Logo />` une seule fois, comme le produit le fait
déjà pour `Navbar`. Sur ce point le banc surévalue franchement.

**« Suit la taille de texte du navigateur » : réel mais partiel, et la norme visée dit l'inverse
de ce qu'on croit.** `PRODUCT.md` engage **WCAG 2.2 AA** comme plancher. Le critère concerné est le
**1.4.5 Images of Text (AA)**, et il porte une exception explicite : *« Logotypes : le texte qui
fait partie d'un logo ou d'un nom de marque est considéré comme essentiel »*, donc exempté. Le
critère **1.4.4 Resize Text** vise le texte du contenu, pas une marque. **Un logo en image est
conforme AA.** L'argument d'accessibilité, tel qu'il est formulé, ne tient donc pas au niveau où le
banc le place.

**Ce qui est vraiment en jeu, et que le banc ne dit pas** : deux points, tous deux du côté du
rendu, pas du côté du lecteur d'écran.

1. **Le thème.** Une image ne suit pas `prefers-color-scheme`, qui est actif dans ce produit
   (`design-tokens.css` l. 200). Mode d'échec : logo crème sur fond crème, invisible. C'est le vrai
   argument contre la proposition 2, et il est plus fort que celui qui est écrit.
2. **Les modes de contraste forcé** (Windows High Contrast, `forced-colors`). Le texte prend la
   couleur système ; une image SVG en `<img>` ne l'adapte pas. C'est un vrai gain, minoritaire.

**Et il se retourne, ce qui est le point le plus utile.** La proposition 4 garde « le mot en texte »
et **détruit le nom accessible** : le mot annoncé, copié et indexé devient « future », sans le point
médian, en contradiction avec l'engagement de marque de `PRODUCT.md`. La proposition 5 garde le nom
intact mais ajoute une barre `aria-hidden` posée à l'endroit exact d'un soulignement, ce qui produit
une ambiguïté d'état pour tout le monde, pas seulement pour l'utilisateur de lecteur d'écran.

**Verdict** : oui, le porteur surévalue cet argument, et il faut le remplacer par sa version exacte.
La formulation juste tient en une phrase : *un logo en image est conforme WCAG, mais il cesse de
suivre le thème du lecteur ; un logo en texte suit le thème, à condition que le texte reste le nom.*
Cette version-là reste un argument fort contre la proposition 2, et elle devient un argument fort
contre la proposition 4.

---

## 7. Verdict

**À REVOIR** pour les propositions 2, 4 et 5. **CONFORME** pour la proposition 1, sous réserve du
sous-ensemblage. **CONFORME mais insuffisante** pour la proposition 3.

Hiérarchisé, du plus lourd au détail :

1. **Ce qui compte le plus** : les deux signes dessinés énoncent un score. C'est le refus fondateur
   du produit. Aucun réglage ne les sauve ; c'est le concept qu'il faut changer, pas la géométrie.
2. **Ensuite** : la décision est déjà prise, elle date du 01/08 et elle est écrite dans
   `doctrine/design.md`. La rouvrir demande un fait nouveau. Le signalement d'un linter n'en est pas
   un, et les 70 Ko qui le motivent sont un TTF non sous-ensemblé, réparable en une heure.
3. **Ensuite** : le banc, tel qu'il est codé, ne permet pas de décider (§ 0). Tailles optiques
   inégales, lignes de base non alignées, mode clair simulé qui n'est pas le thème clair.
4. **Détail, mais à corriger si on garde 1** : `Navbar.tsx` compose le logo en `-0.3px` là où les
   autres surfaces emploient `-0.01em`. Le logo de production n'a pas un réglage unique.

**Ce qui fonctionne et qu'il faut préserver dans cet exercice**, parce qu'il ne faut pas casser le
bon en réparant le reste : le parti pris des trois dernières propositions de **garder le mot en
texte et de ne dessiner que le signe** est juste, et c'est la bonne façon de poser le problème. Le
choix de travailler sur le **point médian**, seul élément déjà distinctif du nom, est également
juste. Le dimensionnement en `em` de la proposition 4 est la bonne technique. Et le banc lui-même,
avec ses quatre tailles, sa mise en situation et sa colonne « réserve » honnête pour chaque option,
est un bon écran de décision : il montre les compromis au lieu de vendre une option. La critique
ci-dessus porte sur des concepts et des géométries, pas sur la démarche.

---

## 8. La version minimale : le plus petit geste qui capture 90 % de la valeur

**Ne rien changer au logo. Sous-ensembler la police, et fermer le signalement du linter par une
exception documentée.**

Trois gestes, environ une heure :

1. Sous-ensembler `InstrumentSerif-Italic.ttf` aux glyphes `f u t r e •` (plus l'espace), le
   convertir en WOFF2 : de 70 Ko à environ 2 à 4 Ko, soit **dix fois moins que n'importe quelle
   autre police du produit**.
2. Ajouter un `<link rel="preload">` sur ce fichier et passer `font-display` de `swap` à `block`
   avec un délai court : le FOUT Georgia → Instrument Serif en tête de page disparaît, et c'est le
   seul défaut réellement visible de la situation actuelle.
3. Inscrire dans la configuration du linter que `--font-brand` est un usage de **marque**, exempté
   du critère de surexposition d'une police d'interface. Le signalement est vrai pour une interface
   et faux pour un logotype : une signature n'a pas à être rare pour être bonne, elle a à être
   **constante**.

Cela ferme le dossier tel qu'il est posé, sans graver un dessin écarté, sans généraliser un
mot-marque anonyme, et sans mettre une jauge dans le logo. La question du signe authored (§ 4)
reste ouverte, à instruire quand il y aura un dessinateur et pas un `<style>`.

Si le porteur veut malgré tout bouger maintenant : **proposition 3**, en la nommant explicitement
comme un état d'attente, et en tranchant au même moment les deux points que le banc masque, la
couleur du point médian sur le thème clair (`--orange` ou `--orange-ink`) et le dessin du bullet.

---

## 9. Cohérence : les tensions que je ne tranche pas

- **La marque doit-elle se distinguer de l'interface, ou lui ressembler ?** L'amendement du 01/08
  dit « changer la police de l'interface ne change pas la marque », ce qui est un parti pris de
  distinction. La proposition 3 est un parti pris de fusion. Les deux se défendent ; je ne tranche
  pas, mais j'observe que la fusion, ici, revient à composer le logo dans la graisse exacte des
  titres de section, ce qui est un coût précis et pas une nuance.
- **La couleur du point médian sur le thème clair.** `DESIGN.md § 5.6` impose l'encre assombrie sur
  le crème, ce qui fait passer la couleur de marque de `#fb923c` à `#b04f00`. Une marque qui change
  de couleur selon le thème est une décision, pas un effet de bord. Elle n'a jamais été posée.
- **`•` (U+2022) contre `·` (U+00B7).** Le produit écrit un bullet partout et l'appelle « point
  médian » ; le dépôt lui-même est nommé avec le vrai point médian. Sans conséquence aujourd'hui,
  à connaître le jour où le point se dessine.

---

## 10. Mise à jour de l'inventaire, prêt à écrire par Claude principal

Deux entrées pour `docs/vault/recherches/inventaire-design.md`.

**Pattern stabilisé, section « patterns tranchés » :**

> **Le signe de marque n'emprunte jamais la grammaire du score.** Un curseur entre deux bornes, une
> barre qui se remplit, un segment coloré sur un axe : ce sont les formes du score synthétique, que
> l'ADR-0001 et les engagements de marque interdisent. Un signe qui veut dire ce que futur•e fait
> emploie la grammaire de la **bifurcation** (plusieurs trajectoires possibles), jamais celle de la
> **position sur une échelle**. Constaté le 02/08/2026 sur deux propositions de logotype
> indépendantes, qui ont toutes deux réinventé une jauge en cherchant à « dire ce que le produit
> fait ».

**Tension nouvelle, section « tensions ouvertes » :**

> **Un logotype sans seuil de simplification déclaré n'est pas terminé.** Aucune des cinq
> propositions du banc `dev/logo` ne dit ce qu'elle devient sous 18 px. Les deux propositions
> dessinées s'y dégradent en bouillie. Exigence à poser sur tout futur signe : une version petite
> explicite, et la dégradation doit produire une forme **légitime**, idéalement la marque
> antérieure.

---

## 11. Quand rouvrir ce sujet

Cet avis est daté du 02/08/2026 et cesse de valoir si l'un de ces signaux apparaît.

**Rouvrir le choix de la police de marque si :**
- après sous-ensemblage et préchargement, le poids du fichier dépasse 8 Ko, ou le FOUT reste visible
  en tête de page sur une connexion lente réelle ;
- le linter de design produit un signalement qui ne porte plus sur la **surexposition** de la police
  mais sur un défaut de la marque elle-même (lisibilité, contraste, collision) ;
- un test de rappel de marque auprès de lecteurs réels montre que le nom ne se retient pas. C'est la
  seule preuve qui vaudrait contre la proposition 1, et elle n'existe pas aujourd'hui.

**Rouvrir la piste d'un signe dessiné (§ 4) si :**
- un dessinateur de caractères entre au projet, ou un budget de logotype existe. La sixième piste
  n'est pas implémentable au `<style>` : elle demande un tracé, ses variantes de taille, et son
  seuil de dégradation ;
- l'entrée B2B de 2027 (`ADR-0008`) se concrétise. Un relais professionnel demande un signe qui
  fonctionne en tampon, en monochrome et hors écran, ce que la situation actuelle ne prépare pas.

**Rouvrir la piste du SVG si, et seulement si :**
- le tracé n'est plus celui d'Instrument Serif vectorisée mais un dessin propre, **et** qu'il porte
  au moins deux variantes de taille optique, **et** qu'un composant unique gère le thème
  (`<picture>` + media query ou masque CSS). Sans ces trois conditions ensemble, la piste reste
  strictement inférieure au texte.

**Rouvrir la couleur du point médian dès maintenant**, indépendamment du reste : la question du
thème clair (`--orange` contre `--orange-ink`) est ouverte et elle n'attend aucun de ces signaux.

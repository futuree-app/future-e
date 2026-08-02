# Logotype : assessment B (mécanique et mesurable)

Date : 2026-08-02
Cible : `src/app/dev/logo/page.tsx` (banc d'essai, 5 propositions) + les fichiers de production qui portent le logo.
Périmètre : uniquement ce qui se mesure. Aucun jugement esthétique. Une évaluation de design tourne en parallèle et reste indépendante.

Outils : `detect.mjs` (impeccable), calcul WCAG 2.x en Python, mesure réelle en navigateur (playwright-core + Chrome, viewport 1280×900, `networkidle`) sur `http://localhost:3000/dev/logo`.

---

## 1. Détecteur

### 1.1 Sortie brute

```
$ node .claude/skills/impeccable/scripts/detect.mjs --json src/app/dev/logo/page.tsx
[]

$ node .claude/skills/impeccable/scripts/detect.mjs --json src/components/Navbar.tsx "src/app/(account)/rapport/page.tsx"
[]
```

Mode texte : sortie vide, `EXIT=0` dans les deux cas.
Avec `--no-config` : `[]` également. Le résultat n'est donc pas produit par une configuration d'ignore.

**0 finding sur les trois fichiers.** Aucun faux positif à signaler, puisqu'il n'y a aucun positif.

### 1.2 Contrôle de vivacité du détecteur

Le zéro n'est pas une panne. Sur le répertoire parent :

```
$ node .claude/skills/impeccable/scripts/detect.mjs --quiet src/components/
6 anti-patterns found.
```

Détail (schéma JSON réel : `antipattern`, `name`, `severity`, `category`, `file`, `line`, `snippet`) :

| antipattern | severity | fichier:ligne | snippet |
|---|---|---|---|
| `border-accent-on-rounded` | warning | `src/components/report/QuartierSynthesis.tsx:256` | `border-t-2` |
| `border-accent-on-rounded` | warning | `src/components/report/QuartierSynthesis.tsx:272` | `border-t-2` |
| (non relevé en détail) | — | `src/components/MetricDrawer.tsx:241` | — |
| (non relevé en détail) | — | `src/components/MetricDrawer.tsx:262` | — |
| (non relevé en détail) | — | `src/components/ask-future.css:212` | — |
| (non relevé en détail) | — | `src/components/report/LogementModule.tsx:303` | — |

Le détecteur fonctionne et ne trouve rien sur la cible.

### 1.3 Portée réelle du détecteur sur cette cible

Point factuel important pour interpréter le zéro : `detect.mjs` analyse les fichiers non-HTML par **appariement de motifs regex** (cf. `--help`, section « Detection modes »). Le banc du logo est presque entièrement composé de styles inline calculés (`style={{ fontSize: size, ... }}`, gradients construits en template string, `var(--token)`) : ces valeurs n'existent pas sous forme littérale dans le source. Aucun des défauts mesurés en §2 et §3 ci-dessous n'est du ressort d'un scan regex. Le zéro du détecteur ne vaut donc pas quitus.

L'affirmation du commentaire d'en-tête (lignes 4-5) selon laquelle le logo est « le dernier signalement du linter de design » n'est pas vérifiable depuis ce fichier : `detect.mjs` ne signale rien ici, ni aujourd'hui ni sur les deux fichiers de production.

---

## 2. Mesures

### 2.1 Contraste (WCAG 2.x, formule de luminance relative)

Fonds du produit : `--bg` sombre `#060812`, `--bg` clair `#faf8f3`, `--bg-deep` clair `#f2ede4`.

| couleur | sur `#060812` | sur `#faf8f3` | sur `#f2ede4` |
|---|---|---|---|
| `--orange` `#fb923c` | **8,83** | **2,13** | **1,94** |
| `--orange-ink` sombre `#fb923c` | 8,83 | 2,13 | 1,94 |
| `--orange-ink` clair `#b04f00` | 3,77 | **4,99** | **4,54** |
| `--fg-hi` sombre `#f6f4ef` (encre du SVG on-dark) | 18,17 | 1,04 | 1,06 |
| `--fg-hi` clair `#1a1d28` (encre du SVG on-light) | 1,19 | 15,82 | 14,40 |
| `#ffffff` (SVG mono-white) | 19,98 | 1,06 | 1,17 |
| `--ghost` sombre `#788095` | 5,06 | 3,72 | 3,39 |
| `--ghost` clair `#646c7f` | 3,80 | 4,95 | 4,51 |
| `--yellow-ink` sombre `#fbbf24` | 11,97 | 1,57 | 1,43 |
| `--yellow-ink` clair `#8c6500` | 3,78 | 4,98 | 4,53 |
| `#c8b89a` (constante `ACCENT`, page /professionnels) | 10,25 | 1,84 | — |

**Réponse à la question posée sur le point médian.** `--orange` `#fb923c` :

- sur le fond sombre `#060812` : **8,83:1** — tient largement les 3:1 d'un élément graphique porteur d'information, et tient même les 4,5:1 du texte ;
- sur le fond clair `#faf8f3` : **2,13:1** — **échoue** le seuil de 3:1 ;
- sur `--bg-deep` clair `#f2ede4` (cartes, encarts) : **1,94:1** — échoue également.

Le seuil applicable est en réalité plus exigeant que 3:1 : dans les cinq propositions du banc et dans les 19 occurrences de production, le point médian est le **caractère U+2022 rendu en texte**, pas une forme graphique. Le seuil du texte, 4,5:1, s'applique. `#fb923c` échoue les deux.

`--orange-ink` clair `#b04f00` donne **4,99:1** sur `#faf8f3` et **4,54:1** sur `#f2ede4` : il tient le seuil texte sur les deux fonds. C'est exactement l'emploi que le commentaire de `src/app/design-tokens.css:70-77` prescrit :

> « Règle d'emploi : `--x-ink` sur du TEXTE et des icônes, `--x` sur des fonds, filets et pastilles […] Ne jamais poser `--x` sur du texte sans vérifier le thème clair. »

Aucune des cinq propositions du banc, ni aucune des occurrences de production, n'utilise `--orange-ink` / `--accent-ink` pour le point médian. Elles utilisent toutes `--orange` ou `--accent` (`#fb923c` dans les deux thèmes ; `--orange` n'est déclaré qu'une fois, `design-tokens.css:58`, hors des blocs de thème).

Autres contrastes mesurés dans le banc :

| élément | code | sombre | clair |
|---|---|---|---|
| crans du « Repère », `encre` à `opacity 0.35` | lignes 70-71 | `#5a5b5f` → **2,95:1** | `#acabac` → **2,16:1** |

Les deux crans échouent 3:1 dans les deux thèmes. Ils portent la métaphore de graduation revendiquée ligne 134 (« situer un lieu sur une échelle ») : ce n'est donc pas de la décoration pure au sens WCAG.

### 2.2 Dimensions rendues

**Le SVG.** `public/logo/futuree-primary-on-dark.svg` : `viewBox="0 0 2542 837"`, plus `width="2542" height="837"` en attributs. Rapport 3,0370.

- à `height: 22px` : largeur = 22 × 2542 / 837 = **66,81 px**.
- Mesuré dans le navigateur sur la page : **66,81 px**. Concordance exacte.

**Le mot composé en texte à 22 px.**

*Méthode d'estimation demandée.* 7 caractères (`f u t u r • e`). Pour une grotesque, l'avance moyenne d'un bas-de-casse est communément prise à ~0,50 em, soit 11 px à 22 px de corps → 77 px. Le `letter-spacing: -0.03em` retire 0,66 px sur 6 intervalles (le crénage négatif ne s'applique pas après le dernier glyphe si l'on compte 6 gaps) → −3,96 px. Estimation ≈ **73 px**.

*Mesure réelle* (span hors flux, mêmes déclarations que le composant, police Archivo confirmée chargée : `Archivo/normal/100 900:loaded`) :

| composition | largeur à 22 px | avance moyenne effective |
|---|---|---|
| Archivo 600, `letter-spacing: -0.03em` (prop. 3, 4, 5) | **64,36 px** | 0,418 em |
| Archivo 600, sans letter-spacing | 68,98 px | 0,448 em |
| Archivo 400 | 65,39 px | 0,424 em |
| Instrument Serif italique, `-0.01em` (prop. 1, l'existant) | **54,89 px** | 0,356 em |

L'estimation à 0,50 em surestime de ~13 %. Raison mesurable : `futur•e` est composé de glyphes étroits (`f`, `t`, `r`, et le `•` autour de 0,33 em) ; il ne contient aucun glyphe large (`m`, `w`). Pour ce mot précis, l'avance moyenne utile est **0,42 em**, pas 0,50 em.

**Comparaison SVG / texte, et le piège qu'elle révèle.**

| proposition | largeur à 22 px (mesurée) | écart au SVG |
|---|---|---|
| 1 · Texte, Instrument Serif italique | 54,91 px | −17,8 % |
| 2 · SVG existant | 66,81 px | référence |
| 3 · Archivo | 64,38 px | −3,6 % |
| 4 · Le repère | 64,91 px | −2,8 % |
| 5 · L'horizon | 75,38 px (dont 11,00 px de `paddingRight`) | +12,8 % |

Le SVG est censé être la vectorisation d'Instrument Serif. Or à hauteur déclarée identique (22 px), il occupe **66,81 px contre 54,91 px** pour la police vivante, soit **+21,7 %**. Cause mécanique : `height: 22px` sur le `<img>` mappe la **boîte complète du viewBox** (837 unités, ascendantes + descendantes comprises) sur 22 px, alors que `font-size: 22px` mappe l'**em** sur 22 px. `height: N` et `font-size: N` ne sont pas interchangeables. Conséquence directe : le SVG ne peut pas être substitué au texte à valeur numérique égale dans la Navbar sans changer la taille apparente du logo ; il faut recalculer la hauteur.

Aux autres tailles du banc, largeurs mesurées :

| proposition | 14 px | 20 px | 22 px | 72 px |
|---|---|---|---|---|
| Texte (Instrument Serif) | 34,94 | 49,92 | 54,91 | 179,67 |
| SVG | 42,52 | 60,73 | 66,81 | 218,66 |
| Archivo | 40,97 | 58,52 | 64,38 | 210,63 |
| Repère | 41,31 | 59,00 | 64,91 | 212,41 |
| Horizon | 47,97 | 68,52 | 75,38 | 246,63 |

**Géométrie de la proposition 4 (Le repère).** Le `<svg>` fait `0.42em × 1em`, viewBox `42 × 100` : échelle uniforme de `size/100` par unité.

| corps | largeur svg | trait des crans (`strokeWidth=5`) | Ø du point (`r=9`) | jeu point ↔ cran |
|---|---|---|---|---|
| 14 px | 5,88 px | 0,70 px | 2,52 px | **0,84 px** |
| 20 px | 8,39 px | 1,00 px | 3,60 px | 1,20 px |
| 22 px | 9,23 px | 1,10 px | 3,96 px | 1,32 px |
| 72 px | 30,23 px | 3,60 px | 12,96 px | 4,32 px |

La réserve écrite ligne 135 (« les deux crans peuvent se fermer sous 14 px ») se chiffre : à 14 px, le trait fait 0,70 px (sous le pixel CSS) et le jeu entre le bord du point et le cran est de 0,84 px. À 1× de densité d'écran, le trait et le jeu tombent tous deux sous 1 px physique.

**Géométrie de la proposition 5 (L'horizon).** Deux écarts entre ce que le code annonce et ce qu'il fait.

- *La ligne ne s'épaissit pas au point médian.* Lignes 81 et 142 affirment « elle ne s'épaissit qu'au point médian ». Le code (ligne 96) pose `height: Math.max(1, size * 0.045)`, une **hauteur unique** pour toute la barre ; seule la **couleur** change (dégradé, ligne 97). Hauteurs mesurées : 1,00 px à 14, 20 et 22 px (le `Math.max(1, …)` écrase les valeurs calculées 0,63 / 0,90 / 0,99), 3,23 px à 72 px. La barre est parfaitement uniforme aux quatre tailles.
- *Le segment orange n'est pas centré sur le point médian.* Le dégradé est calculé en pourcentage de la boîte **paddingRight compris** : `linear-gradient(90deg, encre 0%, encre 62%, orange 62%, orange 74%, transparent 100%)`. Mesuré à 22 px : boîte 75,38 px, mot 64,38 px, centre réel du point médian à **64,1 %**. Le segment orange court de 62 % à 74 %, centre à **68 %**. Décalage de 3,9 points, soit **2,9 px vers la droite** du point à 22 px. Le rapport étant scale-invariant, le décalage reste 3,9 % à toutes les tailles.

### 2.3 Poids réseau

Fichiers sur disque, et transfert réel mesuré sur le serveur de dev (`Accept-Encoding: gzip, br`) :

| fichier | disque | gzip -9 | transféré par le serveur |
|---|---|---|---|
| `public/fonts/InstrumentSerif-Italic.ttf` | 70 868 B | 35 496 B | **36 367 B** |
| `public/fonts/Archivo-Variable.woff2` | 34 940 B | 34 996 B | 34 940 B |
| `public/fonts/Archivo-Variable-Italic.woff2` | 39 132 B | — | — |
| `public/fonts/JetBrainsMono-Variable.woff2` | 40 480 B | — | — |
| `public/logo/futuree-primary-on-dark.svg` | 4 713 B | 2 054 B | **1 966 B** |
| `public/logo/futuree-primary-on-light.svg` | 4 713 B | — | 1 966 B |
| `public/logo/futuree-mono-orange.svg` | 4 713 B | — | 1 966 B |
| `public/logo/futuree-mono-white.svg` | 4 713 B | — | 1 966 B |

Les quatre SVG font 4 713 B chacun et diffèrent seulement par les valeurs de `fill` (md5 tous distincts) :

| fichier | fills |
|---|---|
| `futuree-mono-orange.svg` | 7 × `#fb923c` |
| `futuree-mono-white.svg` | 7 × `#ffffff` |
| `futuree-primary-on-dark.svg` | 6 × `#f6f4ef` + 1 × `#fb923c` |
| `futuree-primary-on-light.svg` | 6 × `#1a1d28` + 1 × `#fb923c` |

Les couleurs sont **codées en dur**, pas en `var(--token)` : un `<img src>` ne peut pas hériter des tokens, d'où un fichier par thème. L'argument de la ligne 118 (« Les fichiers portent déjà les tokens du produit ») est exact sur les valeurs, inexact sur le mécanisme — ce sont des littéraux figés, qui ne suivront pas une évolution de `--fg-hi` ou de `--orange`.

**Ce que chaque proposition charge, en octets additionnels :**

| proposition | charge | transféré en plus |
|---|---|---|
| 1 · Texte (Instrument Serif) | `InstrumentSerif-Italic.ttf` | 36 367 B |
| 2 · SVG existant | 1 SVG par thème, 2 si le produit sert les deux | 1 966 B (ou 3 932 B) |
| 3 · Archivo | rien | **0** |
| 4 · Le repère | rien (SVG inline, dans le HTML) | **0** |
| 5 · L'horizon | rien (dégradé CSS) | **0** |

`Archivo-Variable.woff2` est chargé de toute façon pour toute l'interface (confirmé au runtime : `Archivo/normal/100 900:loaded`). Les propositions 3, 4 et 5 sont réellement gratuites en réseau.

Deux précisions factuelles sur la ligne 111 (« 70 Ko de TTF pour ce seul usage ») :

1. **Le chiffre.** 70 868 B sur disque, mais **36 367 B transférés** (gzip). C'est un TTF non compressé au format ; converti en woff2 comme les trois autres polices du projet, il descendrait nettement sous ce chiffre.
2. **« pour ce seul usage » est faux.** `--font-brand` est référencé **24 fois dans 23 fichiers** hors `design-tokens.css` et hors `dev/logo`. Écarter le logo d'Instrument Serif ne retire pas la police du produit : 23 autres fichiers continueraient de la charger. Le gain réseau des propositions 3/4/5 sur ce poste est **nul tant que ces 23 fichiers ne sont pas traités**.

---

## 3. Accessibilité, par le code

### 3.1 Texte alternatif

| proposition | mécanisme | ligne | constat |
|---|---|---|---|
| 1 · Texte | vrai texte, `futur` + `<span>•</span>` + `e` | 41 | nom accessible = `futur•e`, pas d'alt nécessaire |
| 2 · SVG | `<img alt="futur•e">` | 49 | alt **présent** ; vérifié au DOM sur les 5 instances |
| 3 · Archivo | vrai texte | 56 | nom accessible = `futur•e` |
| 4 · Le repère | texte `futur` + `<svg aria-hidden>` + texte `e` | 68-74 | **le nom accessible devient `future`** (voir 3.2) |
| 5 · L'horizon | vrai texte + barre `aria-hidden` | 87, 90 | nom accessible = `futur•e` |

L'alt du SVG (`futur•e`, ligne 49) contient U+2022 BULLET. Un lecteur d'écran vocalise ce caractère ou le saute selon la verbosité ; le comportement est identique pour les propositions en texte, qui contiennent le même caractère. Pas de différentiel entre propositions sur ce point.

**Écart propre à la proposition 4.** Le point médian n'est plus un caractère : c'est un `<circle>` dans un `<svg aria-hidden>` (lignes 69-73). L'`aria-hidden` retire le SVG entier de l'arbre d'accessibilité. Le nom accessible du logo devient donc **`future`** (concaténation de « futur » ligne 68 et de « e » ligne 74), et le texte reste sélectionnable, mais un copier-coller rend `future`. C'est la seule proposition qui change le texte que l'utilisateur emporte. Rien dans la fiche de la proposition (lignes 130-137) ne le mentionne.

### 3.2 `aria-hidden` sur les éléments décoratifs

Vérifié au DOM : **5 `<svg>` sur la page, 5 portent `aria-hidden`** ; 10 éléments `[aria-hidden]` au total (5 svg du Repère + 5 barres de l'Horizon).

- ligne 69 : `<svg … aria-hidden>` — attribut JSX nu, React sérialise `aria-hidden="true"`. Correct.
- ligne 90 : `<span aria-hidden …>` sur la barre de l'Horizon. Correct.

Aucun élément décoratif n'est laissé exposé.

### 3.3 Sélectionnabilité

| proposition | sélectionnable | ce que le copier-coller rend |
|---|---|---|
| 1 · Texte | oui | `futur•e` |
| 2 · SVG | **non** — c'est une image | rien |
| 3 · Archivo | oui | `futur•e` |
| 4 · Le repère | oui, partiellement | `future` (le point est un `<circle>`) |
| 5 · L'horizon | oui | `futur•e` |

Aucun `user-select: none` nulle part sur la page.

### 3.4 Comportement à l'agrandissement de la taille de texte

Distinction mesurable : le **zoom** du navigateur agrandit tout (px compris) ; le réglage de **taille de police par défaut** n'agrandit que ce qui est exprimé en `rem` / `em` / unités relatives. Le tableau porte sur ce second cas.

| proposition | unités | suit le réglage de taille de texte |
|---|---|---|
| 1 · Texte | `fontSize: size` — px (ligne 40) | **non** |
| 2 · SVG | `height: size` — px (ligne 49) | **non** |
| 3 · Archivo | `fontSize: size` — px (ligne 55) | **non** |
| 4 · Le repère | `fontSize: size` px (ligne 67) ; le SVG en `0.42em × 1em` (ligne 69) | **non** — le signe suit le corps, mais le corps est en px |
| 5 · L'horizon | `fontSize: size` px (ligne 86) ; barre en `size * 0.045` px (ligne 96) | **non** |

**Aucune des cinq propositions ne suit le réglage de taille de texte**, telles qu'écrites dans le banc. Le corps est un nombre en pixels dans les cinq cas, passé par le paramètre `size` (valeurs 14 / 20 / 22 / 72, lignes 188-191).

Cela contredit trois affirmations de la page :

- ligne 15 : « un logo en image […] ne suit plus la taille de texte choisie par la personne » ;
- ligne 110 : « il grandit avec la taille de texte choisie par la personne » (proposition 1) ;
- lignes 134 et 173-175 : « Dessiné en `em`, il suit la taille choisie par le lecteur » / « le logo […] grandit avec la taille de texte que la personne a choisie dans son navigateur ».

Ce qui est exact dans la ligne 134 : le SVG du Repère est bien en `em`, donc **relatif à son corps**, et il reste net à toute échelle. Ce qui ne l'est pas : ce corps est en px, donc la chaîne s'arrête là.

**Et en production, c'est déjà le cas.** `src/components/Navbar.tsx:110` : `fontSize: 22` (nombre nu → React sérialise `22px`). `src/app/(account)/rapport/page.tsx:508` : classe `text-[20px]`. Le logo actuel du produit ne suit donc **déjà pas** la taille de texte du navigateur. L'avantage revendiqué pour les propositions en texte n'est pas un avantage acquis : il ne se réalise que si le corps est réécrit en `rem`, ce qu'aucune des cinq propositions ne fait.

### 3.5 Le sélecteur de thème du banc

`aria-*` absent du bouton de bascule (lignes 178-185) : pas d'`aria-pressed`. Le libellé change (« Passer au fond clair » / « Passer au fond sombre »), donc l'état reste annonçable. Constat mineur.

---

## 4. Ce que la page rend

```
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dev/logo
200

/logo/futuree-primary-on-dark.svg   -> 200  (4713 B, image/svg+xml)
/logo/futuree-primary-on-light.svg  -> 200  (4713 B, image/svg+xml)
/logo/futuree-mono-orange.svg       -> 200  (4713 B, image/svg+xml)
/logo/futuree-mono-white.svg        -> 200  (4713 B, image/svg+xml)
```

Page et quatre SVG servis. Rendu vérifié au navigateur : cinq cellules par bloc, quatre blocs de taille, un bloc « en situation », les cinq `<img>` pointent bien vers `futuree-primary-on-dark.svg` en sombre et basculent vers `futuree-primary-on-light.svg` au clic. Aucune erreur de rendu.

---

## 5. Ce qui a échoué, et pourquoi

### 5.1 Le banc ne teste pas le thème clair du produit

Mesuré : après clic sur le bouton (ligne 180), `document.documentElement[data-theme]` **reste `"dark"`**. Le composant `Banc` ne fait que remplacer trois valeurs en dur (`fond`, `encre`, `filet`, lignes 155-157) ; il ne pose pas `data-theme="light"`. Tous les `var(--token)` de la page continuent donc de résoudre leurs valeurs **sombres** sur le fond crème.

Valeurs relevées après bascule, avec `pageBg = rgb(250, 248, 243)` :

| token | valeur servie en « fond clair » | valeur attendue en thème clair | contraste réel sur `#faf8f3` |
|---|---|---|---|
| `--ghost` | `#788095` (sombre) | `#646c7f` | 3,72 (kickers, labels : sous 4,5) |
| `--yellow-ink` | `#fbbf24` (sombre) | `#8c6500` | **1,57** — les lignes « Réserve : » (ligne 239) sont illisibles |
| `--orange-ink` | `#fb923c` (sombre) | `#b04f00` | 2,13 |
| `--bg-deep` | `#0d1322` (sombre) | `#f2ede4` | le bouton de bascule reste sombre sur fond crème (ligne 182) |
| `--bg-card` | `#0a0f1cb8` (sombre) | `rgba(255,255,255,.72)` | les navbars simulées restent sombres (ligne 217) |

Conséquence sur la mission du banc : ce que le porteur voit en « fond clair » n'est **pas** le rendu produit. Pour le point médian précisément, `--orange` vaut `#fb923c` dans les deux thèmes (déclaration unique, `design-tokens.css:58`), donc l'aperçu du **point** est fortuitement correct ; tout le reste du banc en clair ne l'est pas.

### 5.2 `--border-1` / `--border-2` / `--border-hi` sont vides en thème sombre

`src/app/design-tokens.css:131-133` :

```css
--border-1:       var(--border-1);
--border-2:       var(--border-2);
--border-hi:      var(--border-hi);
```

Auto-référence. Un `var()` circulaire est invalide au moment du calcul : la propriété personnalisée devient **la chaîne vide**. Vérifié au runtime, `getComputedStyle(:root)` en thème sombre :

```
--border-1: (EMPTY)
--border-2: (EMPTY)
--border-hi: (EMPTY)
```

Effet mesuré sur le banc : `filet` vaut `var(--border-1)` en sombre (ligne 157). `borderColor` reçoit une valeur invalide, retombe sur `currentColor`, et les cadres des cartes se peignent à `rgb(246, 244, 239)` — l'encre pleine `--fg-hi`, à **18,17:1** au lieu d'un filet discret. En clair (valeur en dur `rgba(26,29,40,0.10)`), la bordure est correcte : `rgba(26, 29, 40, 0.1)`.

Ce défaut n'est pas propre au banc : il touche tout le thème sombre du produit, partout où `--border-1/-2/-hi` est consommé. Le pied de page de `rapport/page.tsx:506` (`border-t border-[var(--border-1)]`) est dans ce cas.

### 5.3 Le point médian de production échoue le contraste en thème clair

| emplacement | déclaration | couleur du point | sur `#060812` | sur `#faf8f3` |
|---|---|---|---|---|
| `src/components/Navbar.tsx:119` | `color: C.orange` → `var(--orange)` (l. 16) | `#fb923c` | 8,83 | **2,13** |
| `src/app/(account)/rapport/page.tsx:509` | `className="text-accent"` → `--accent` (`design-tokens.css:93`) | `#fb923c` | 8,83 | **2,13** |

Les deux fichiers de production audités posent `--orange` / `--accent` sur du texte, ce que le commentaire de `design-tokens.css:70-77` interdit explicitement sans vérification en thème clair. `--orange-ink` / `--accent-ink` (`#b04f00`, 4,99:1) existent pour ce cas et ne sont utilisés nulle part sur le logo : `grep` sur `orange-ink|accent-ink` hors `design-tokens.css` retourne **3 occurrences**, aucune sur le mot-logo.

### 5.4 Les « dix-neuf endroits » ne sont pas une seule implémentation

Le commentaire d'en-tête (ligne 4) annonce 19 emplacements. Décompte vérifié : `grep -rn "futur<span" src/` retourne **22** occurrences, dont 3 dans `dev/logo` — soit **19 en production**. Le chiffre est exact.

Ce que le chiffre masque : le point médian y est déclaré d'au moins **six manières différentes**, dont une qui n'est pas orange du tout.

| déclaration | fichiers | couleur résolue |
|---|---|---|
| `className="text-accent not-italic"` | `compte/memoire`, `compte`, `rapport`, `AccountNav` | `#fb923c` |
| `style={{ color: C.orange }}` | `Navbar`, `FutureELanding` | `#fb923c` |
| `style={{ color: "var(--orange)" }}` | `mentions-legales`, `politique-confidentialite` | `#fb923c` |
| `style={{ color: 'var(--accent)' }}` | `savoir/pollutions-invisibles`, `agir/pollutions-invisibles` | `#fb923c` |
| `className="brand-dot"` (règle CSS redéfinie localement dans **6 fichiers**) | `savoir/*`, `agir/canicule` | `var(--accent)` = `#fb923c` |
| `style={{ color: ACCENT }}` avec `const ACCENT = '#c8b89a'` (`professionnels/page.tsx:11`) | `professionnels` ×2 | **`#c8b89a`**, un beige — 10,25 sur sombre, **1,84** sur clair |
| `<span>•</span>` sans couleur | `(auth)/layout.tsx:13`, `AuthForms.tsx:229` | héritée ; `.auth-brandmark span` (`globals.css:95-98`) repose `var(--orange)` |

`.auth-brandmark` (`globals.css:86-98`) n'utilise pas non plus `--font-brand` : la pile y est `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif` à 30 px. Le logo des écrans d'authentification est donc composé dans une **autre police** que les 19 autres.

Conséquence mécanique pour la décision du banc : quelle que soit la proposition retenue, la migration ne consiste pas à changer une valeur en 19 endroits identiques. Elle touche 6 conventions de déclaration, 6 redéfinitions locales de `.brand-dot`, une constante beige divergente et une pile de police parallèle.

### 5.5 Écarts entre le banc et la production

| point | banc | production |
|---|---|---|
| `letter-spacing` de la proposition 1 | `-0.01em` = −0,22 px à 22 px (ligne 40) | `-0.3px` (Navbar:112) et `tracking-[-0.3px]` (rapport:508) |
| encre du mot | `var(--fg-hi)` en sombre (ligne 156) | `var(--fg-1)` `#e9ecf2` (Navbar `C.text`, l. 13) ; `.text-label` (rapport:508) |

La proposition 1 n'est donc pas une reproduction au pixel de l'existant. L'écart de crénage est faible (0,08 px par intervalle) ; l'écart d'encre change la valeur de contraste comparée.

### 5.6 Mesures impossibles

`fontTools` n'est pas installable dans cet environnement (PEP 668, `pip` refuse l'installation système et `--user`). Les avances de glyphes n'ont donc pas pu être lues dans les tables `hmtx`/`HVAR` des fichiers de police. Contournement employé : mesure directe en navigateur (Chrome via `playwright-core`), qui donne l'avance rendue réelle plutôt que nominale — un résultat plus fidèle que la lecture de table, puisqu'il intègre le crénage et l'instanciation de la variable. Aucune mesure demandée n'est restée non couverte.

---

## 6. Récapitulatif des constats mesurables

| # | constat | localisation | mesure |
|---|---|---|---|
| 1 | Détecteur : 0 finding sur les 3 fichiers ; le détecteur est vivant (6 findings sur `src/components/`) | — | `[]`, EXIT=0 |
| 2 | `--orange` `#fb923c` échoue 3:1 **et** 4,5:1 sur les deux fonds clairs | `design-tokens.css:58` | 2,13 / 1,94 |
| 3 | `--orange-ink` `#b04f00` tient 4,5:1 sur les deux fonds clairs et n'est utilisé nulle part sur le logo | `design-tokens.css:172` | 4,99 / 4,54 |
| 4 | Le point médian de production utilise `--orange` / `--accent` sur du texte, contre la règle écrite dans le fichier de tokens | `Navbar.tsx:119`, `rapport/page.tsx:509` | 2,13 en clair |
| 5 | `height:22px` sur le SVG ≠ `font-size:22px` : +21,7 % de largeur | `page.tsx:49` | 66,81 vs 54,91 px |
| 6 | Crans du Repère à 14 px : trait 0,70 px, jeu 0,84 px | `page.tsx:70-71` | sous 1 px physique en 1× |
| 7 | Crans du Repère : 2,95:1 en sombre, 2,16:1 en clair | `page.tsx:70-71` | échouent 3:1 |
| 8 | L'Horizon ne s'épaissit pas au point médian, contrairement à ce que le texte affirme | `page.tsx:96` vs `81`, `142` | hauteur uniforme 1,00 px à 14/20/22 px |
| 9 | Le segment orange de l'Horizon est décalé de 3,9 % (2,9 px à 22 px) du point médian | `page.tsx:97` | dot 64,1 %, bande 62–74 % |
| 10 | La bascule « fond clair » ne pose pas `data-theme` : tous les tokens restent sombres | `page.tsx:154-158` | `data-theme` reste `"dark"` |
| 11 | `--yellow-ink` sombre sur fond crème dans l'aperçu clair | `page.tsx:239` | 1,57:1 |
| 12 | `--border-1/-2/-hi` auto-référencés donc vides en thème sombre ; les cadres se peignent à l'encre pleine | `design-tokens.css:131-133` | `(EMPTY)`, bordure 18,17:1 |
| 13 | Le Repère change le nom accessible et le copier-coller en `future` | `page.tsx:69-74` | `aria-hidden` sur le `<svg>` |
| 14 | Aucune des 5 propositions ne suit le réglage de taille de texte ; la production non plus | `page.tsx:40,49,55,67,86` ; `Navbar.tsx:111` | corps en px partout |
| 15 | « 70 Ko pour ce seul usage » : 36 367 B transférés, et 23 autres fichiers consomment `--font-brand` | `page.tsx:111` | 24 occurrences hors dev |
| 16 | Propositions 3, 4, 5 : 0 octet additionnel (Archivo déjà chargé) | — | `Archivo:loaded` |
| 17 | Les 19 occurrences du mot-logo emploient 6 conventions distinctes, dont un beige `#c8b89a` | `professionnels/page.tsx:11` | 1,84:1 en clair |
| 18 | Le logo des écrans d'authentification est dans une autre police | `globals.css:86-98` | Iowan/Palatino, pas `--font-brand` |
| 19 | Page et 4 SVG servis en 200 | — | `curl` |

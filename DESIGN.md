# DESIGN.md · Le langage visuel de futur•e

**Version 1 · 30 juillet 2026 · prescriptif.**

Ce document dit ce qu'il faut faire. Il ne décrit pas l'interface existante : une partie de
l'existant est précisément ce qu'il vient corriger.

---

## 0. Ce que ce document est, et où il s'arrête

Trois couches de documents gouvernent le design de futur•e, et elles ne se remplacent pas :

| Couche | Fichier | Rôle |
| --- | --- | --- |
| Décision datée | `docs/vault/adr/ADR-0005-direction-artistique.md` | la DA est arrêtée, et quand |
| Doctrine vivante | `docs/vault/doctrine/design.md`, `interface.md`, `editoriale.md` | le **pourquoi**, verrouillé |
| Application | **ce document** | le **comment**, écran par écran |

En cas de contradiction, la doctrine du vault gagne. Une seule exception est prise ici, et elle est
justifiée au § 5.1, comme `doctrine/design.md` l'exige de toute proposition contraire.

Ce document ne redit pas la doctrine éditoriale. Le vouvoiement, l'interdiction du tiret cadratin,
du point d'exclamation et de l'emoji, la règle « on ne raconte que ce qu'on mesure exactement », la
signature distinctive ET identitaire vivent dans `doctrine/editoriale.md` et s'appliquent
intégralement à tout texte affiché.

---

## 1. Les trois registres

futur•e assemble trois manières de parler. Chacune a son domaine, et un écran les combine sans les
mélanger.

**A · La charpente : le dossier d'instruction.**
Le rapport d'expertise remis avant une signature. Filet et marge comme unités de séparation, une
seule surface élevée par écran, colonne de lecture fixée à l'échelle de la page, métadonnées en
marge, numérotation citable. A gouverne la **structure de tout écran**, sans exception.

**B · La donnée : l'instrument de mesure.**
Grille visible, valeurs alignées au chiffre, signal porté par la position et la longueur avant le
fond de carte, échelle qui montre le normal, l'extrême **et l'inconnu**. B gouverne **toute donnée
affichée**, dans le rapport comme dans les pages publiques.

**C · La voix : la lettre du territoire.**
La prose mène, les faits arrivent dans le fil, les visualisations deviennent des planches rares et
larges. C gouverne les **verdicts, gloses, pages Savoir et guides Agir**.

**Pourquoi cette combinaison.** A tranche la structure et la largeur de lecture, le problème le plus
urgent. B fournit la manière de dessiner la trajectoire et l'incertitude, la seule chose que futur•e
vend réellement. C existe déjà dans la voix et demande d'être protégée. **C seule serait le piège** :
une marque tenue, un dossier illisible.

---

## 2. A · La charpente

### 2.1 La largeur de lecture, par nature de contenu

La largeur se règle à l'échelle de la **page**, jamais du paragraphe. Trois mesures, et aucune
autre :

| Nature | Largeur | Où |
| --- | --- | --- |
| **Prose longue** | `720px` | pages Savoir, guides Agir, texte suivi |
| **Dossier** | `920px` | comparateur, pages de décision, formulaires |
| **Grille de données** | `1100px` | rapport, hubs thématiques, tableaux |

Quand prose et données cohabitent sur une page, **la page prend la largeur la plus grande des deux**
et la prose s'aligne à gauche sur la même gouttière. Elle ne se recentre pas, elle ne se
recompose pas en colonne étroite au milieu d'un bloc large.

Interdit, et c'est la faute la plus fréquente : un `max-w-[NNNpx]` sur un paragraphe **plus étroit
que le bloc bordé qui l'entoure**. La phrase wrappe à mi-bloc et laisse un vide à droite. Un
`max-w` sur du texte n'est légitime que pour le conteneur de page, un sous-titre de hero mesuré en
espace ouvert sous un grand H1, ou un texte en `flex-row` qui partage sa ligne. Règle complète et
historique du diagnostic dans `doctrine/interface.md § 1`.

Le padding horizontal du conteneur est `px-5` sous 640 px et `px-7` au-delà.

### 2.2 Une seule surface élevée par écran

Une surface élevée est un bloc qui sort du plan : verre, ombre portée, fond distinct. **Un écran
n'en porte qu'une**, et elle désigne ce qui compte le plus : le verdict dans le rapport, le
formulaire dans un parcours, la carte d'identité dans un module.

Tout le reste se sépare par un **filet** (1 px, `--border-1`) et par de la **marge**. Une page où
chaque bloc est une carte de verre n'a plus de hiérarchie : elle a une texture.

### 2.3 Ce qui sépare

Par ordre de préférence : la marge, puis le filet, puis le fond, puis le verre. On descend d'un
cran seulement quand le cran précédent ne suffit pas.

### 2.4 La numérotation citable

Une section que le lecteur peut vouloir mentionner porte une ancre stable (`id`) et un numéro
visible. Une preuve qui renvoie vers une carte vise cette carte, jamais le haut du module.

---

## 3. B · Le vocabulaire de la donnée

### 3.1 Les quatre états d'une valeur

Toute valeur affichée est dans l'un de ces quatre états, et son traitement visuel est fixé :

| État | Traitement |
| --- | --- |
| **Mesurée** | valeur pleine, mono tabulaire, source sous la valeur |
| **Projetée** | valeur pleine + horizon nommé (« en 2050 ») + scénario France (« +2,7 °C ») |
| **Absente** | tiret `—`, `opacity: 0.45`, filet gris, mention explicite de l'absence |
| **Non applicable** | la carte n'est pas rendue du tout |

**L'absence est une information, elle s'affiche.** Une donnée manquante ne se remplace jamais par
un zéro, une moyenne nationale ou un silence. Le lecteur doit voir qu'on n'a pas su, et pourquoi.

### 3.2 L'alignement au chiffre

Toute valeur numérique est en `--font-mono` avec `font-variant-numeric: tabular-nums`. Deux valeurs
comparables s'alignent verticalement sur leur unité. Un libellé peut wrapper ; une valeur ne wrappe
jamais (`white-space: nowrap`).

### 3.3 La trajectoire

Une trajectoire montre **au moins deux points et l'écart entre eux**, avec l'horizon nommé sur
chacun. Un chiffre futur seul est interdit : sans référence, le lecteur ne peut pas savoir si 32
jours de chaleur est beaucoup.

Le référentiel de réchauffement s'affiche toujours à l'échelle France : +2 / +2,7 / +4 °C, jamais le
global. Voir `doctrine/data.md`.

### 3.4 L'incertitude

Quand l'incertitude est forte, elle se montre. Une fourchette s'affiche comme fourchette. Un
modèle se nomme comme modèle (« les projections indiquent », jamais « il fera »). Une échelle qui
comporte une zone d'inconnu **dessine cette zone**.

### 3.5 La comparaison

Une position relative ne se déguise jamais en caractéristique absolue. « Parmi les 10 % de communes
les plus exposées » se dit ainsi, sans devenir « très exposée ». Quand un rang est affiché, sa
population de référence est nommée.

### 3.6 La règle qui gouverne toutes les autres

**Le signal passe par la position et la longueur avant de passer par la couleur.** Une barre, une
place sur une échelle, un écart mesuré valent mieux qu'un fond rouge. La couleur confirme, elle ne
porte pas seule.

---

## 4. C · La voix

Le registre éditorial gouverne les verdicts, les gloses, les pages Savoir et les guides Agir.

**La prose mène.** Un verdict est une phrase, pas une note. Un guide est une suite de gestes
nommés, pas un tableau.

**Les faits arrivent dans le fil.** Une affirmation porte sa source à l'endroit où elle est faite,
et la bibliographie complète vit en fin de page. Modèle de référence à généraliser :
`/savoir/pollutions-invisibles`, qui porte le meilleur traitement des sources du produit, rapport
compris.

**Un chiffre affiché porte le document qui le fonde et sa date**, pas seulement le nom de
l'organisme. « Source : ANSES » ne suffit pas ; « ANSES, avis 2024 sur les vagues de chaleur »
suffit.

**Les gloses** : deux phrases, trente-cinq mots, jamais de méthodologie ni de source, jamais de
seuil chiffré. Elles répondent à « pourquoi ce chiffre aide à comprendre le territoire ». Détail
dans `doctrine/interface.md § 2`.

**Le verbe qui décide reste au lecteur.** futur•e retire le hasard et l'angle mort ; elle ne tranche
pas. Liste des verbes bannis dans `doctrine/editoriale.md`.

---

## 5. La couleur

### 5.1 Le fond

Fond profond `#060812`, verre translucide, grain de bruit léger. Cette part de la direction
artistique est conservée.

**Les orbes flous en `position: fixed` sont supprimés.** Amendement explicite à
`doctrine/design.md`, qui inscrivait « mesh gradients animés » dans la DA verrouillée. Justification,
comme cette doctrine l'exige : ce qui pose problème n'est pas le glassmorphism, c'est son
**automatisme**. Trois orbes dupliqués à l'identique sur vingt-cinq pages, y compris dans le rapport
payant, cessent d'être une signature et deviennent un fond d'usine. Le fond profond, le verre et le
grain suffisent à tenir la promesse esthétique. *(Arbitrage du porteur, 30/07/2026.)*

### 5.2 La palette est close

Six teintes, et aucune autre :

| Token | Valeur | Rôle |
| --- | --- | --- |
| `--orange` | `#fb923c` | accent de marque **et** registre « compromis » (voir 5.4) |
| `--red` | `#f87171` | incompatibilité, chaleur |
| `--blue` / `--info` | `#60a5fa` | contrôle à mener, eau, inondation |
| `--green` | `#4ade80` | alignement |
| `--amethyst` / `--violet` | `#a78bfa` | ce qui n'est pas su, pollutions |
| `--yellow` | `#fbbf24` | vigilance |

**Toute couleur s'écrit `var(--token)`.** Une valeur hexadécimale en dur dans un composant est un
défaut, même quand elle est exacte : elle échappe au thème clair et au changement futur.

**Trois teintes orphelines sont supprimées** : `#38bdf8` (submersion) rejoint `--blue`, dont il
était un voisin indécidable ; `#c8b89a` et `#d4a574`, deux sables voisins jamais distingués,
disparaissent au profit de `--orange`. AskFuture et les pages professionnelles prennent l'accent de
marque. *(Arbitrage du porteur, 30/07/2026.)*

### 5.3 Le statut de la couleur

**Une teinte est une affirmation vérifiable.** Elle dit quelque chose de la donnée ou de la
décision, et le lecteur peut vérifier ce qu'elle dit. Une teinte qui distingue une colonne
tarifaire, une carte parmi d'autres ou une section sans que la couleur porte de sens est un
ornement, et l'ornement coloré est interdit.

Test à appliquer avant de poser une couleur : **si toutes les occurrences visibles portent la même
teinte, aucune ne doit la porter.** Une couleur qui ne distingue rien ne signifie rien.

### 5.4 Les cinq registres du dossier

Le dossier de décision porte cinq registres, chacun avec sa teinte, et cette correspondance est
gravée :

| Registre | Teinte | Ce qu'il dit |
| --- | --- | --- |
| Incompatibilité | `--red` | une condition non négociable n'est pas tenue |
| Alignement | `--green` | ce que le lieu tient bien |
| Compromis | `--orange` | ce qui départage |
| Non su | `--amethyst` | ce qu'on n'a pas pu lire |
| Contrôle à mener | `--info` | ce qui reste à vérifier sur place |

**Collision connue, à instruire** : `--orange` sert à la fois d'accent de marque et de registre
« compromis ». Sur un écran qui porte les deux, la marque et le sens se confondent. Deux issues
possibles, non tranchées : déplacer le compromis vers `--yellow`, ou réserver l'orange au seul
registre sémantique dans le rapport. À décider avant la prochaine passe sur le dossier.

### 5.5 Le verdict ne porte jamais l'accent de marque

`.card-verdict` prend le ton de ce qu'elle annonce (`--tone`). Un dossier bloqué ne s'auréole pas de
vert, et il ne s'auréole pas d'orange parce que l'orange est la couleur du produit.

---

## 6. Conditions d'usage

### 6.1 La carte

Une carte existe quand son contenu est **une unité que le lecteur peut isoler** : un phénomène, un
fait, un module. Un paragraphe dans une carte est un paragraphe avec une bordure inutile.

### 6.2 Le filet coloré en haut de carte

**Le filet n'apparaît que lorsque sa couleur informe** : le thème d'un groupe de cartes, le registre
d'un verdict. Il est interdit en décor. *(Arbitrage du porteur, 30/07/2026.)*

Règle testable : dans une grille où toutes les cartes visibles porteraient le même filet, **aucune
ne le porte**. La couleur du groupe est déjà dite par le surtitre et sa puce.

Motif : le filet automatique sur chaque carte est l'un des signes les plus reconnaissables d'une
interface générée. Ce qui le rend tel est sa répétition, non sa forme.

### 6.3 Le badge et la pastille

Un badge dit un **état qui varie** (disponible, verrouillé, à venir). Un badge dont la valeur est
constante sur tous les éléments d'une liste est supprimé : il n'informe personne.

Une pastille colorée accompagne un surtitre pour porter la couleur d'un groupe. Une page ne porte
pas plus de **trois** surtitres à pastille. Au-delà, le motif devient un tic.

### 6.4 Le graphique

Un graphique existe quand il raconte ce qu'un paragraphe ne dirait pas aussi bien. Il illustre, il
ne remplace jamais la voix éditoriale. Une donnée unique se dit en toutes lettres.

**Aucune donnée ne s'anime.** Un chiffre qui défile avant de se poser suggère que le résultat est un
tirage. C'est l'inverse exact de ce que futur•e promet.

### 6.5 Les tableaux et grilles denses

Toute grille descend à une ou deux colonnes sous 768 px. Une grille figée à trois ou quatre colonnes
est un défaut de livraison. Une table large scrolle dans son propre conteneur ; la page ne scrolle
jamais horizontalement.

---

## 7. La relation entre les trois échelles

Territoire, Autour, Logement se lisent dans cet ordre, **du large au précis**, et chacune peut
contredire la précédente.

| Échelle | Teinte | Grain |
| --- | --- | --- |
| Territoire | `--info` | la commune |
| Autour | `--green` | le secteur autour du point |
| Logement | `--orange` | le bâtiment |

Ces teintes ne bougent pas d'un écran à l'autre. Une échelle se reconnaît à sa couleur avant son
titre.

**Ce que l'interface doit dire, et qu'elle ne dit pas encore** : posséder le Territoire d'une commune
n'ouvre ni Autour ni Logement, qui demandent un dossier d'adresse. Un écran qui annonce « trois
échelles » avec trois cartes marquées accessibles alors que deux exigent une adresse ment par
composition. Le décompte affiché doit suivre ce que le compte possède réellement.

---

## 8. Le gabarit éditorial

Trois variantes d'un même gabarit, mêmes primitives, mêmes tokens.

**Hub d'enjeu** (`/chaleur`, `/inondation`) : quatre mouvements dans cet ordre. Vérifier un lieu,
comprendre, agir, ce que le rapport ajoute. Largeur grille.

**Contenu long** (Savoir) : prose, sources inline, bibliographie descriptive en fin. Largeur prose.

**Guide d'action** (Agir) : ce qui fonctionne, ce qu'il faut préparer, selon votre situation, **ce
que vous n'avez pas à faire**, sources. Cette dernière section est une signature de futur•e et se
généralise. Largeur prose.

### 8.1 La navigation

**La `Navbar` du site est la navigation de toute page publique, sans exception.** Un fil d'Ariane
thématique s'ajoute, il ne remplace jamais. Une nav locale réécrite dans une page est interdite.

### 8.2 La fraîcheur

Toute page qui affiche de la donnée vivante affiche sa date de lecture, **calculée**, jamais écrite
à la main. Corollaire : un bloc dont le contenu est figé dans le code ne s'intitule pas « en cours ».

### 8.3 La canonicité

**Un enjeu = un hub = une famille d'URL communale = un guide.** Une page commune n'existe que si la
donnée est réellement communale. Cette règle doit être tenue avant toute ouverture à l'indexation.

---

## 9. Composants

### 9.1 Validés, à réutiliser

`ConclusionBlock` et `.card-verdict` · le vocabulaire chromatique des cinq registres · les règles
d'anti-redondance de `DossierDecisionSection` (un grain affiché une seule fois, une section effacée
quand le verdict la porte déjà) · `FactBody`, `EvidenceRow`, `MethodDetails`, `Chip` ·
`[data-visee]` comme repère d'arrivée qui s'efface · le rendu de la donnée absente · `HorizonBar` et
`HorizonSwitch` · `MetricDrawer` (référence de composant responsive) · le tiret `—` comme marqueur
d'absence · le trio typographique et ses trois rôles.

**Le trio typographique** : `--font-serif` (Instrument Serif) pour les titres et la voix éditoriale ;
`--font-sans` (Instrument Sans) pour le texte courant ; `--font-mono` (JetBrains Mono) pour les
valeurs, surtitres, sources et métadonnées. Toujours par le token, jamais par un `fontFamily` en
dur, qui perd les piles de repli.

### 9.2 Dépréciés, à ne plus produire

Le fil d'Ariane maison en tête de page (remplacé par la `Navbar`) · la feuille de style injectée par
page · l'objet `styles` en JavaScript.

### 9.3 Interdits

Les orbes flous en `position: fixed` · les emoji comme icônes (déjà interdits par
`doctrine/editoriale.md`, et présents en production dans le rapport) · la barre de sources défilante
· le pricing coché à couleur par plan · toute animation sur une donnée · la pastille à valeur
constante répétée · le `fontFamily` en dur · la couleur hexadécimale en dur · un `max-w` de
paragraphe plus étroit que son bloc.

---

## 10. Conventions d'implémentation

Cette section porte des règles de code. Elle est séparée à dessein : les règles visuelles ci-dessus
survivent à un changement de technologie, celles-ci non.

- **Tokens.** Toute couleur, police, ombre et rayon vient de `src/app/design-tokens.css`. Les
  composants consomment `var(--token)`.
- **Tailwind v4**, breakpoints par défaut (`sm` 640, `md` 768, `lg` 1024). Le responsive s'écrit en
  variantes, jamais en media query manuelle dans une page.
- **Une seule feuille de style.** Le CSS d'une page ne s'injecte pas par
  `dangerouslySetInnerHTML`. Les 2 118 lignes de CSS dupliquées dans les pages publiques sont une
  dette identifiée, à résorber par des composants partagés.
- **Next.js.** Cette version comporte des ruptures d'API : lire `node_modules/next/dist/docs/` avant
  d'écrire du code, comme l'impose `AGENTS.md`.
- **Accessibilité.** WCAG 2.2 AA est le plancher de conception. Aucune déclaration publique de
  conformité n'est affichée, faute d'audit.

---

## 11. Ce qui reste ouvert

Trois points sont volontairement non tranchés dans cette version :

1. **La collision de l'orange** (accent de marque et registre « compromis »), § 5.4.
2. **La navigation de niveau 1** : proposition en annexe de
   `docs/audits/2026-07-30-famille-editoriale.md`, non tranchée par le porteur.
3. **Le système de composants éditoriaux partagés** qui remplacera les feuilles de style par page,
   reporté après le lancement.

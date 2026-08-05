# DESIGN.md · Le langage visuel de futur•e

**Version 2.1 · 4 août 2026 · prescriptif.**

> **v2.1** : la charte de marque v1.7 entre dans le produit. **Le logo n'est plus une police** :
> c'est un dessin vectoriel, dans `components/Logo.tsx`, et Instrument Serif comme `--font-brand`
> ont quitté le dépôt (§ 9.1). L'orange de marque devient `#E8823A` (§ 5). Les **six registres de
> décision** prennent les valeurs de la charte, dont deux changent de teinte (§ 5.4).
> Les trois plafonds de l'échelle de rôles baissent (§ 9.1).
>
> **v2.0** : l'interface passe à **Archivo**, une grotesque unique, et la hiérarchie repose sur une
> **échelle de graisses** (§ 9.1). Les fontes sont auto-hébergées en WOFF2 variable.
>
> **v1.5** : une **échelle de rôles** typographiques remplace 53 valeurs arbitraires (§ 9.1), et la
> piste de prose descend de 720 à 640 px, la mesure de la v1.1 donnant environ 90 caractères par
> ligne (§ 2.1).
>
> **v1.4** : le filet de carte dit désormais la **relation de la donnée au projet du lecteur**, avec
> ses quatre règles de sélection (§ 6.2), et le registre « écart » reçoit le jaune (§ 5.4).
>
> **v1.3** : correction factuelle. Le dossier porte **six** registres, pas cinq : `mismatches`
> existe et n'a aucune teinte, il tombe silencieusement sur celle de « non su » (§ 5.4).
>
> **v1.2** : l'orange est réservé au registre « compromis » **dans le rapport** (§ 5.4), et une
> section sur l'image répond au reproche « il manque des visuels » (§ 6.5).
>
> **v1.1** : quatre amendements après relecture critique. La couleur cesse d'identifier les trois
> échelles (§ 7, la seule contradiction structurelle de la v1) ; la largeur devient une grille à deux
> pistes (§ 2.1) ; la surface dominante se compte par viewport (§ 2.2) ; l'état absent passe par un
> token de contraste testé au lieu d'une opacité globale (§ 3.1).

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

### 2.1 Une grille de page, deux pistes

Une page a **un seul conteneur et une seule gouttière**. À l'intérieur, deux pistes possibles.

| Piste | Largeur maximale | Contenu |
| --- | --- | --- |
| **Prose** | `640px` | texte suivi, aligné sur la gouttière gauche |
| **Donnée** | toute la largeur du conteneur | grilles, tableaux, cartes |

**Pourquoi 640 et non 720** (corrigé le 01/08/2026). La mesure de confort d'une ligne est de 45 à
75 caractères. À `--text-body` (16 px), une piste de 720 px en donne environ **90**, et l'œil perd
le début de la ligne suivante. 640 px en donne environ 80, ce qui reste haut mais tenable ; à
`--text-lede` (17 px), la même piste tombe à 75. La v1.1 avait posé 720 px en corrigeant le piège du
`max-w` de paragraphe, sans vérifier la mesure elle-même.

Trois largeurs maximales de conteneur, et aucune autre. Ce sont des maxima : sous ces seuils, le
conteneur fait `width: 100%` avec les paddings prescrits.

| Nature de page | Conteneur | Où |
| --- | --- | --- |
| **Éditoriale** | `680px` | pages Savoir, guides Agir |
| **Dossier** | `920px` | comparateur, pages de décision, formulaires |
| **Mixte** | `1100px` | rapport, hubs thématiques |

Sur une page mixte de 1100 px, la prose occupe sa piste de 720 px **alignée à gauche**, et les
données peuvent prendre toute la largeur. La prose ne se recentre pas au milieu du bloc, ce qui
créerait deux axes de lecture concurrents.

**La nuance qui décide, et c'est là que se joue la faute la plus fréquente** : la piste de prose
vaut en **espace ouvert**. Dans un **bloc bordé** (carte, section à fond, `.glass`), le texte
remplit son bloc et ne porte aucun `max-w` propre. Un paragraphe plafonné plus étroit que la carte
qui l'entoure wrappe à mi-bloc et laisse un vide à droite, très visible.

Un `max-w` sur du texte n'est donc légitime que pour le conteneur de page, la piste de prose en
espace ouvert, un sous-titre de hero sous un grand H1, ou un texte en `flex-row` qui partage sa
ligne. Règle complète et historique du diagnostic dans `doctrine/interface.md § 1`.

Le padding horizontal du conteneur est `px-5` sous 640 px et `px-7` au-delà.

### 2.2 Une seule surface dominante à la fois

Une surface élevée est un bloc qui sort du plan : verre, ombre portée, fond distinct.

**Une seule surface dominante par viewport, ou par mouvement majeur de la page.** Deux surfaces
élevées de même poids ne se font jamais concurrence dans le même champ visuel. Une page longue,
un guide Agir, un rapport de plusieurs milliers de pixels ont le droit d'en porter plusieurs, à
condition qu'elles ne coexistent pas à l'écran.

La surface dominante désigne ce qui compte le plus dans son mouvement : le verdict dans le rapport,
le formulaire dans un parcours, la carte d'identité en tête de module.

Tout le reste se sépare par un **filet** (1 px, `--border-1`) et par de la **marge**. Une page où
chaque bloc est une carte de verre n'a plus de hiérarchie, elle a une texture.

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
| **Absente** | tiret `—`, couleur `--fg-absent`, mention explicite de l'absence |
| **Non applicable** | la carte n'est pas rendue du tout |

**L'absence est une information, elle s'affiche.** Une donnée manquante ne se remplace jamais par
un zéro, une moyenne nationale ou un silence. Le lecteur doit voir qu'on n'a pas su, et pourquoi.

**L'effacement passe par une couleur testée, jamais par une opacité globale.** L'implémentation
actuelle applique `opacity: 0.45` au conteneur, donc au texte. Mesuré sur le fond `--bg` :

| Élément | Contraste plein | À `opacity: 0.45` |
| --- | --- | --- |
| Libellé (`--fg-1`) | 16,9:1 | **3,96:1** |
| Texte secondaire (`--fg-3`) | 7,9:1 | **2,39:1** |
| Source (`--ghost`) | **4,22:1** | **1,72:1** |

AA exige 4,5:1 pour du texte courant. Les trois échouent une fois estompés, ce qui contredit
frontalement le plancher WCAG 2.2 AA que ce document se donne au § 10.

Règle : un token `--fg-absent` porte la couleur de l'état absent, avec un contraste vérifié sur
tous les fonds autorisés, y compris le thème clair. L'effacement **visuel** se produit par la teinte
et le tiret, jamais par l'opacité du bloc.

L'absence **n'a pas de filet propre**. Le filet de carte ne dit qu'une chose, la relation au projet
(§ 6.2) : lui faire dire aussi « donnée manquante » rouvrirait la confusion que le § 7 vient de
fermer sur les échelles.

**Défaut connexe à corriger** : `--ghost` (`#6b7388`) est déjà à 4,22:1 en pleine opacité, donc sous
AA avant tout estompage. Il porte aujourd'hui les sources et les surtitres. À reprendre avec
`--fg-absent`.

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
| `--orange` | `#E8823A` | accent de marque **et** registre « compromis » (voir 5.4) |
| `--red` | `#f87171` | incompatibilité, chaleur |
| `--blue` / `--info` | `#60a5fa` | contrôle à mener, eau, inondation |
| `--green` | `#4ade80` | alignement |
| `--amethyst` / `--violet` | `#a78bfa` | ce qui n'est pas su, pollutions |
| `--yellow` | `#fbbf24` | écart à la demande |

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

### 5.4 Les six registres du dossier

Le dossier de décision porte six registres, et cette correspondance est gravée. **Depuis le
04/08/2026, ils ont leurs propres tokens**, aux valeurs de la charte v1.7 : les couleurs génériques
de la palette ne les portent plus.

| Registre | Token | Clair | Sombre | Ce qu'il dit |
| --- | --- | --- | --- | --- |
| Incompatibilité | `--reg-incompatibilite` | `#8F2E3A` | `#FF9AA4` | une condition non négociable n'est pas tenue |
| Alignement | `--reg-alignement` | `#236844` | `#7BD3A5` | ce que le lieu tient bien |
| Compromis | `--reg-compromis` | `#994000` | `#E8823A` | ce qui départage |
| Écart (`mismatches`) | `--reg-ecart` | `#64428E` | `#C2A5EB` | ce qui correspond moins bien que demandé |
| Non su | `--reg-non-su` | `#505662` | `#B8BFCC` | ce qu'on n'a pas pu lire |
| Contrôle à mener | `--reg-controle` | `#285B91` | `#82B4E8` | ce qui reste à vérifier sur place |

**Une seule teinte par registre et par thème**, contrairement au couple encre/surface du § 5.6. Les
valeurs de la charte tiennent de 5,5:1 à 11,1:1 sur les deux fonds de chaque thème et sur leur
propre surface sémantique : la même valeur porte donc le texte, le filet et la pastille. Le couple
existait parce que les couleurs génériques échouaient sur le fond crème, et ce n'est plus le cas ici.
Chaque registre a en plus une `--reg-*-surface`, pour un fond sémantique. **Un fond sémantique ne
porte jamais le sens seul** : garder le libellé et un filet de la teinte.

**Deux registres ont changé de teinte le 04/08/2026, et le changement porte du sens.**

**L'écart passe du jaune au violet.** Le raisonnement du 30/07 tient toujours : un mismatch n'est
pas une incompatibilité moins grave, c'est une nature différente. L'assembleur le décrit comme
« établi, non éliminatoire, à arbitrer », et précise qu'« un mismatch n'est pas un compromis, pas de
contrepartie ». Il dit la distance entre ce que le lecteur a demandé et ce que le lieu est, sans que
ce soit un défaut du lieu. Une gradation rouge vers orange aurait suggéré une échelle de gravité,
donc un score, que l'ADR-0001 interdit. Le violet n'est pas davantage un rouge atténué : il satisfait
la même exigence, et c'est la teinte que la charte donne à ce registre.

**Le non su quitte l'améthyste pour un gris neutre.** C'est l'arbitrage explicite de la charte :
**un statut inconnu ne reçoit aucune valence.** L'améthyste en portait une, et peignait « nous
n'avons pas pu lire cette donnée ici » dans la même famille qu'un constat établi sur le lieu. Le
repli d'une section dont la clé est inconnue est ce même gris, et pour la même raison.

### 5.6 Deux familles de teintes : l'encre et la surface

Une couleur sémantique existe en deux versions, et le choix entre elles est une règle, pas un goût :

| Famille | Token | Usage | Exigence WCAG |
| --- | --- | --- | --- |
| **Encre** | `--x-ink` | texte, icône | 4,5:1 |
| **Surface** | `--x` | fond, filet, pastille, bordure | 3:1 |

Sur le fond sombre les deux coïncident : les teintes vives y tiennent 7 à 12 contre 1. Sur le fond
crème du thème clair, **elles échouaient toutes**, de 1,43 (jaune) à 2,61 (rouge), alors qu'elles
peignent les surtitres de registre du dossier. Les versions claires sont calculées pour tenir 4,5:1
sur `--bg` et sur `--bg-deep`, teinte conservée.

**Ne jamais poser `--x` sur du texte sans vérifier le thème clair.**

**Tranché le 30/07/2026** : dans le rapport, **l'orange signifie « compromis »**. L'accent de marque
ne colore plus les éléments de navigation ordinaires du rapport : les CTA y sont neutres, en texte
clair sur fond sourd ou en bordure claire. L'orange reste libre comme couleur de marque partout
ailleurs, sur l'accueil, les tunnels et les pages d'achat.

Le compromis n'a pas été déplacé vers `--yellow`, et pas pour la raison qu'on croit : le jaune est
presque libre dans le code (deux occurrences, sur des codes réglementaires du module Logement). La
vraie raison est sémantique. **Un compromis n'est pas une alerte.** Le jaune dirait « danger léger »
là où le sens est « ceci s'arbitre ». L'orange, entre le rouge et le vert, dit exactement cet
entre-deux.

Règle générale qui en découle : **là où le sens et la marque se disputent une teinte, le sens
gagne.**

### 5.5 Le verdict ne porte jamais l'accent de marque

`.card-verdict` prend le ton de ce qu'elle annonce (`--tone`). Un dossier bloqué ne s'auréole pas de
vert, et il ne s'auréole pas d'orange parce que l'orange est la couleur du produit.

---

## 6. Conditions d'usage

### 6.1 La carte

Une carte existe quand son contenu est **une unité que le lecteur peut isoler** : un phénomène, un
fait, un module. Un paragraphe dans une carte est un paragraphe avec une bordure inutile.

### 6.2 Le filet coloré en haut de carte

**Le filet dit la relation de cette donnée au projet du lecteur, et rien d'autre.** Il porte la
teinte du registre du dossier auquel cette donnée participe (§ 5.4). Il est interdit en décor, et
interdit pour dire un thème, une échelle ou un état technique. *(Arbitrages du porteur, 30/07/2026.)*

Règle testable : dans une grille où toutes les cartes visibles porteraient le même filet, **aucune
ne le porte**. Une couleur qui ne distingue rien ne signifie rien.

Motif : le filet automatique sur chaque carte est l'un des signes les plus reconnaissables d'une
interface générée. Ce qui le rend tel est sa répétition, non sa forme. En le liant au dossier, il
devient rare par construction : une carte doit réellement participer à la décision pour en porter un.

**Les quatre règles de sélection** (implémentées et testées dans
`src/lib/decision/evidence-registers.ts`) :

1. Sans projet, donc sans dossier, aucune carte n'a de filet.
2. Une carte dont aucun phénomène n'est cité par le dossier n'en a pas.
3. Une carte dont les phénomènes cités convergent vers un seul registre porte sa teinte.
4. Une carte citée par plusieurs registres différents n'en a pas, **sauf** si l'un d'eux est
   l'incompatibilité, qui l'emporte toujours parce qu'elle bloque le dossier.

La règle 4 n'invente pas de priorité : le code donne déjà à l'incompatibilité un statut à part
(`dossier-view.ts` lui fait absorber les autres sections). Effacer un blocage parce qu'un alignement
coexiste sur la même carte perdrait l'information la plus grave de l'écran.

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

### 6.5 L'image

Le reproche le plus fréquent fait à futur•e de l'extérieur est qu'elle manque de visuels. Le
diagnostic est mal posé, et la réponse « c'est volontaire, on est factuel » l'est aussi. Les deux
ratent le vrai manque.

**Le produit a déjà dix-sept photographies**, toutes sur les surfaces éditoriales et de marque
(hubs, articles, accueil). Ce n'est pas là que ça manque.

**Le rapport, lui, ne dessine presque rien.** Un seul composant y transforme une donnée en forme :
`TerritoryYearsBand`, la bande des années d'arrêtés CatNat. Tout le reste est du texte dans des
cartes. L'œil n'a rien à saisir, et c'est ce que le lecteur ressent comme de la froideur.

Trois règles :

1. **La photographie d'illustration générique est interdite.** Un sol craquelé, une ville dans la
   brume de chaleur, une inondation de banque d'images : elle dramatise sans rien prouver, et elle
   ment quand la commune lue n'est pas concernée. C'est l'inverse exact de « on ne raconte que ce
   qu'on mesure exactement ».
2. **Une image est légitime quand elle est elle-même une donnée** : une bande d'années, une
   silhouette de trajectoire, une échelle qui situe la commune, une distribution où le lecteur se
   place. Elle obéit alors au § 3 en entier, absence comprise.
3. **Une photographie de lieu réel est légitime** si le lieu est nommé, la prise de vue datée et
   créditée. Elle identifie un territoire ; elle n'illustre pas une menace.

**Le levier n'est donc pas d'ajouter des images, c'est de dessiner la donnée.** Une trajectoire de
jours de chaleur, un écart entre deux horizons, la place d'une commune dans une distribution
remplissent l'œil autant qu'une photographie, et eux disent vrai. `TerritoryYearsBand` est le
modèle : une forme, une donnée réelle, et un vide qui signifie « commune épargnée » plutôt que
« panne ».

### 6.6 Les tableaux et grilles denses

Toute grille descend à une ou deux colonnes sous 768 px. Une grille figée à trois ou quatre colonnes
est un défaut de livraison. Une table large scrolle dans son propre conteneur ; la page ne scrolle
jamais horizontalement.

---

## 7. La relation entre les trois échelles

Territoire, Autour, Logement se lisent dans cet ordre, **du large au précis**, et chacune peut
contredire la précédente.

| Échelle | Grain |
| --- | --- |
| Territoire | la commune |
| Autour | le secteur autour du point |
| Logement | le bâtiment |

**Une échelle se reconnaît d'abord à son nom, sa position dans l'ordre et son grain. Une teinte
éventuelle ne fait que confirmer cette identité, et elle ne touche jamais une donnée ni un verdict.**

### 7.1 Pourquoi la couleur ne peut pas identifier une échelle

Le produit portait deux systèmes chromatiques incompatibles, et ils se croisaient sur le même
écran :

| Teinte | Sens décisionnel (§ 5.4) | Sens structurel (ancien) |
| --- | --- | --- |
| Bleu | contrôle à mener | Territoire |
| Vert | alignement | Autour |
| Orange | compromis | Logement |

Ce n'est pas une hypothèse. `src/app/(account)/rapport/page.tsx` rend `DossierDecisionSection`
(les cinq registres) **et** la grille des modules colorée par `MODULE_COLORS` (les trois échelles),
sur la même page, à quelques centaines de pixels d'écart. Le vert y dit « ce lieu tient bien ce
point » en haut et « ceci appartient à Autour » plus bas.

Le § 5.3 pose qu'une teinte est une affirmation vérifiable. Une couleur ne peut pas affirmer en
même temps **où se trouve la donnée** et **ce qu'elle signifie pour la décision**. Les cinq
registres gardent la couleur ; les échelles la perdent.

Le § 3.6 le disait déjà autrement : le signal passe par la position et la longueur avant la
couleur.

### 7.2 Ce que cela change concrètement

- `MODULE_COLORS` disparaît comme identité d'échelle. Les cartes de modules se distinguent par leur
  nom, leur rang et leur bénéfice écrit.
- Le filet vert des cartes du module Autour (`AutourModule`, `borderTop: 2px solid var(--green)`)
  tombe **déjà** sous l'interdit du § 6.2 : toutes les cartes du module portent la même teinte,
  donc elle ne distingue rien.
- Une teinte d'échelle reste tolérée dans la **chrome de navigation** d'un module (surtitre,
  bandeau de tête), jamais sur une carte de donnée, jamais dans un écran qui affiche des registres
  de décision.

**Dépendance à régler d'abord** : faire porter l'identité par le rang suppose que le décompte soit
juste. Aujourd'hui le rapport annonce « six angles » dans son hero, « trois échelles » dans la
section suivante, et numérote « Module 01 ». Ces trois décomptes doivent s'accorder avant que le
rang devienne un repère.

**Note de coût** : identifier une échelle par une icône demanderait un jeu d'icônes dessiné. Les
emoji sont interdits (`doctrine/editoriale.md`), et ceux qui servent aujourd'hui d'icônes de module
sont à retirer.

### 7.3 Ce que l'interface doit dire, et qu'elle ne dit pas encore

Posséder le Territoire d'une commune n'ouvre ni Autour ni Logement, qui demandent un dossier
d'adresse. Un écran qui annonce « trois échelles » avec trois cartes marquées accessibles alors que
deux exigent une adresse ment par composition. Le décompte affiché doit suivre ce que le compte
possède réellement.

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

**La `Navbar` du site est la navigation de toute page publique.** Un fil d'Ariane thématique
s'ajoute, il ne remplace jamais. Une nav locale réécrite dans une page est interdite.

**Y compris dans les tunnels transactionnels**, et c'est une décision, pas un oubli. Un en-tête
réduit sur une page de paiement est une pratique courante, censée réduire les fuites. futur•e
n'encaisse aucun abonnement et vend un achat unique réfléchi : cacher les issues à ce moment
précis reviendrait à retenir un lecteur qui doute, ce que la doctrine interdit
(`doctrine/editoriale.md`, « ne tranche jamais à la place du lecteur »). `/checkout/[product]` et
`/territoire/[insee]/debloquer` montent déjà la `Navbar` complète : cette règle décrit l'existant,
elle ne le change pas.

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

**Un tracking négatif ne s'hérite jamais.** Il est calibré pour la taille du titre qui le porte. Un
texte plus petit imbriqué dans ce titre (un grain, une précision, une unité) doit remettre
`letter-spacing: normal`, et `font-stretch: normal` si le titre est resserré. Sans cette remise, les
espaces entre les mots se referment, d'autant plus fort que le titrage est serré. Constaté sur le
banc typographique à -1,6 px : le grain de 15 px devenait un bloc de lettres collées.

**Deux familles pour l'interface, et AUCUNE pour la marque.** `--font-sans` et `--font-serif`
désignent tous deux **Archivo** (les deux noms survivent le temps que les appelants migrent) ;
`--font-mono` désigne JetBrains Mono, pour les valeurs, rangs, sources et métadonnées. Toujours par
le token, jamais par un `fontFamily` en dur.

**Le logo n'est plus composé, il est dessiné (04/08/2026).** Il n'existe plus de `--font-brand`, et
Instrument Serif a quitté le dépôt : `@font-face`, token, et le fichier de 70 Ko. Le mot-symbole est
un tracé vectoriel dont la coupe du `r`, les sept fûts à 35 unités et la position du point sont des
valeurs décidées ; aucune police ne les produit. Il vit dans **`src/components/Logo.tsx`**, qui
inline le mot-symbole et le signe compact : le lettrage prend `currentColor`, le point prend
`var(--accent)`. Ne jamais recomposer le nom en texte pour faire un logo, ne jamais importer les
huit SVG du pack tels quels (ils ne diffèrent que par leurs deux `fill`, et les importer figerait la
couleur hors du thème). Le nom **dans une phrase** reste du texte : seul le logo est un dessin.

**Le mot-symbole ne descend pas sous 22 px de haut** à l'écran (minimum de la charte, révisé le
04/08/2026 : voir `CHARTE/futur-e-charte-v1/07-validation/ARBITRAGES-V1-7.md`). Le signe compact
`r•` est réservé aux favicon, avatar et icône d'application ; il ne remplace pas le nom dans une
première prise de contact.

**L'échelle de graisses, et c'est elle qui porte la hiérarchie maintenant.** Une serif et une sans
se distinguaient par leur dessin. Archivo tenant les deux rôles, un titre et un paragraphe ne se
séparent plus que par la taille, la graisse et la couleur.

| Token | Valeur | Rôle |
| --- | --- | --- |
| `--weight-display` / `--weight-title` / `--weight-section` | `600` | les trois rôles de titre |
| `--weight-body` / `--weight-lede` | `400` | corps et chapô |
| `--weight-strong` | `500` | mise en avant **dans** un texte, jamais un titre |
| `--weight-meta` | `500` | petit texte : sous 13 px, 400 s'efface sur fond sombre |
| `--weight-kicker` | `600` | surtitre mono capitales |

**Deux crans séparent toujours un titre de son texte**, 600 contre 400. Un seul cran ne se voit pas
sur une grotesque, il se lit comme une erreur de rendu.

**Ce qui rend Archivo distinctive est le réglage, pas le dessin.** Elle descend des grotesques
américaines : posée en 400 avec un tracking normal, elle redevient invisible. La discipline des
graisses et des gris n'est donc pas un confort, c'est ce qui tient l'identité.

**La couleur reprend du service comme troisième axe.** Avec une famille unique, les cinq niveaux de
gris (`--fg-hi` à `--fg-4`) et les teintes de registre portent une part de la hiérarchie que le
dessin ne porte plus. Un titre en `--fg-hi`, un corps en `--fg-2`, une source en `--ghost` créent
trois plans lisibles avant même que la graisse intervienne.

**L'échelle de rôles.** Dix rôles, et aucune autre taille. Un nom dit un **usage**, jamais un niveau
de titre HTML ni une valeur. S'écrit `text-[length:var(--text-role)]`.

| Rôle | Valeur | Ce que le texte fait |
| --- | --- | --- |
| `--text-display` | `clamp(34px, 4vw, 54px)` | titre de page, **un seul par écran** |
| `--text-title` | `clamp(26px, 3vw, 38px)` | titre de section |
| `--text-section` | `clamp(20px, 2.4vw, 26px)` | titre de bloc, de carte, de groupe |
| `--text-lede` | `17px` | chapô sous un titre de page |
| `--text-body` | `16px` | corps de lecture, prose suivie |
| `--text-dense` | `14px` | corps d'une carte, d'une liste, d'un tableau |
| `--text-caption` | `13px` | précision, légende, phrase de rang |
| `--text-meta` | `12px` | source, mention, unité |
| `--text-kicker` | `11px` | surtitre mono capitales, désigne une section |
| `--text-micro` | `10px` | étiquette d'axe, note de bas de carte |

**Choisir un rôle, c'est se demander ce que le texte fait**, jamais la place qu'on veut lui donner.
`dense` et `meta` existent séparément parce qu'un corps de carte et une source ne font pas le même
travail, pas parce qu'un pixel les sépare.

Cette échelle en remplace une antérieure qui nommait neuf niveaux de titre (`--fs-h1` à `--fs-h6`,
trois `display`) et n'était appelée que **dix-neuf fois** dans tout le produit, pendant que
**53 valeurs arbitraires** faisaient le travail, dont 24 façons différentes d'écrire « un grand
titre » et 9 demi-pixels. Une échelle qu'on n'appelle pas n'est pas une échelle, c'est une
intention.

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

Quatre points sont volontairement non tranchés dans cette version :

1. **La collision de l'orange** (accent de marque et registre « compromis »), § 5.4. C'est le
   dernier reste du problème réglé au § 7 : la couleur ne dit plus le grain, elle dit encore deux
   choses à la fois sur cette seule teinte.
2. **Le décompte des échelles** : « six angles », « trois échelles » et « Module 01 » cohabitent
   dans le rapport. Le § 7.2 en dépend, puisqu'il fait porter l'identité par le rang.
3. **La navigation de niveau 1** : proposition en annexe de
   `docs/audits/2026-07-30-famille-editoriale.md`, non tranchée par le porteur.
4. **Le système de composants éditoriaux partagés** qui remplacera les feuilles de style par page,
   reporté après le lancement.

## 12. Journal des amendements

**v2.1, 04/08/2026** (intégration de la charte de marque v1.7) :

| Amendement | Motif |
| --- | --- |
| § 9.1 · le logo est un dessin, `--font-brand` supprimé | La v2.0 affirmait le contraire (« le logo est du texte »). La charte livre un mot-symbole vectoriel dont la coupe du `r`, les fûts et la position du point sont des valeurs décidées : aucune police ne les produit. Instrument Serif a quitté le dépôt |
| § 9.1 · minimum du mot-symbole à 22 px | Les 28 px de la charte avaient été relevés sur des épreuves imprimées, jamais mesurés dans une navbar : à 26 px le logo y faisait 105 px de large contre 75 px au logo texte qu'il remplace |
| § 9.1 · les trois plafonds de l'échelle baissent | 110 `clamp()` ad hoc ignoraient l'échelle, dont des `h1` à 72 px quand le rôle plafonnait à 54. Le titre de la landing débordait de 27 px de sa colonne |
| § 5.2 · l'orange devient `#E8823A` | Sortie du preset Tailwind `orange-400` vers une teinte plus terreuse, décidée par la charte |
| § 5.4 · les six registres ont leurs propres tokens | Ils empruntaient les couleurs génériques de la palette, aux valeurs de la charte près |
| § 5.4 · l'écart passe du jaune au violet | La teinte que la charte donne à ce registre. Le raisonnement du 30/07 est intact : ce qu'il écartait, c'était une gradation du rouge, donc une échelle de gravité |
| § 5.4 · le non su devient un gris neutre | Arbitrage explicite de la charte : un statut inconnu ne reçoit aucune valence. L'améthyste en portait une |

**v2.0, 02/08/2026** :

| Amendement | Motif |
| --- | --- |
| § 9.1 · Archivo, famille unique | Les deux Instrument étaient signalées comme surexposées, et le registre serif littéraire était faux pour un instrument de mesure. Amende `ADR-0005` et `doctrine/design.md` |
| § 9.1 · échelle de graisses | Avec une famille unique, la graisse et la couleur portent la hiérarchie que le dessin ne porte plus |
| § 9.1 · `--font-brand` | Le logo est du texte, pas une image. Changer l'interface ne change pas la marque |

**v1.5, 01/08/2026** :

| Amendement | Motif |
| --- | --- |
| § 9.1 · échelle de rôles | L'échelle antérieure nommait neuf niveaux de titre et n'était appelée que 19 fois, pendant que 53 valeurs arbitraires faisaient le travail, dont 24 clamps distincts pour trois rôles |
| § 2.1 · piste de prose à 640 px | 720 px donnait ~90 caractères par ligne quand la mesure de confort est 45 à 75. Erreur de la v1.1 |

**v1.4, 30/07/2026** :

| Amendement | Motif |
| --- | --- |
| § 6.2 · le filet dit la relation au projet | Il portait le thème du groupe, donc la même teinte sur toutes les cartes sous un surtitre qui la disait déjà. Lié au dossier, il devient rare par construction et redevient une affirmation vérifiable |
| § 5.4 · le jaune pour l'écart | Le sixième registre n'avait pas de teinte. Un écart n'est ni une incompatibilité atténuée ni un compromis : une gradation aurait suggéré un score |
| § 3.1 · l'absence perd son filet | Le filet ne dit qu'une chose. Lui faire dire aussi « donnée manquante » rouvrirait la confusion fermée au § 7 |

**v1.3, 30/07/2026** :

| Amendement | Motif |
| --- | --- |
| § 5.4 · six registres | `mismatches` avait été oublié. Il tombe sur le repli `--amethyst`, donc sur la teinte de « non su » : un écart à la demande et une donnée illisible sont peints à l'identique |

**v1.2, 30/07/2026** :

| Amendement | Motif |
| --- | --- |
| § 5.4 · l'orange est le compromis dans le rapport | Le sens gagne sur la marque là où les deux se disputent une teinte. Le jaune a été écarté parce qu'un compromis n'est pas une alerte |
| § 6.5 · l'image | Le reproche « il manque des visuels » vise mal. Le produit a dix-sept photographies ; c'est le rapport qui ne dessine presque rien |

**v1.1, 30/07/2026** (relecture critique, quatre amendements retenus) :

| Amendement | Motif |
| --- | --- |
| § 7 · la couleur n'identifie plus les échelles | Deux systèmes chromatiques se croisaient sur `/rapport`. Le § 5.3 exige qu'une teinte soit une affirmation vérifiable ; elle ne peut pas dire à la fois le grain et le sens |
| § 2.1 · grille à deux pistes | La v1 pouvait se lire comme « la prose s'étale à 1100 px ». La piste de prose à 720 px lève l'ambiguïté sans rouvrir le `max-w` de paragraphe |
| § 2.2 · surface dominante par viewport | « Un écran » était ambigu (route, section, viewport). Une page longue a le droit de porter plusieurs surfaces, jamais concurrentes |
| § 3.1 · token `--fg-absent` | `opacity: 0.45` faisait tomber les trois niveaux de texte sous AA (3,96 / 2,39 / 1,72:1), en contradiction avec le § 10 |

Deux précisions du même passage : les largeurs sont des **maxima**, et la `Navbar` vaut aussi dans
les tunnels transactionnels, par décision motivée.

# DESIGN.md · Le langage visuel de futur•e

**Version 3.0 · 20 octobre 2026 · prescriptif à la fusion de la PR FUT-118 R0**, après relecture du
porteur. Tant qu'elle n'est pas fusionnée, la v2.1 reste en vigueur sur `main`.

> **v3.0** : **le Relevé devient l'unique grammaire visuelle canonique de futur•e** (FUT-87, FUT-118).
> Une page se compose d'énoncés et de leur **marge de preuve**, se sépare par des **filets** plutôt que
> par des cartes, élève **une plaque par mouvement**, dit l'échelle par **la forme** (cercle, carré,
> losange) et le jugement par **le trait de registre**. Le verre, les surtitres en capitales mono, les
> pastilles et le filet coloré en haut de carte quittent le canon. Les primitives vivent dans
> `src/components/releve/`, les jetons dans `design-tokens.css`. **Le Relevé définit le langage visuel ;
> FUT-75 (`src/lib/motion.ts`, jetons `--m-*`) définit le comportement dans le temps** : les deux forment
> un seul système, et le mouvement n'a pas d'autre source (§ 15). Chaque règle porte un statut :
> **stable** (prescriptive) ou **hypothèse** (ouverte à l'exploration, notamment pour le centre de
> décision, § 13). Les surfaces historiques migrent par lots ; d'ici là, un test-cliquet interdit
> d'ajouter un marqueur de l'ancienne grammaire (§ 10). Rationale, audit et preuves :
> `docs/audits/2026-10-20-fut118-releve.md` et `docs/audits/2026-10-20-fut118-releve/grammaire-du-releve.md`.
>
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
| Implémentation canonique | `src/components/releve/` (primitives) et `src/app/design-tokens.css` (jetons `--r-*`) | le **comment**, en code ; tout nouvel écran part d'ici |
| Mouvement (FUT-75) | `src/lib/motion.ts` (+ `motion.test.ts`), jetons `--m-*` de `design-tokens.css`, `docs/audits/2026-10-12-fut75-integration-1.md` | le comportement **dans le temps** ; seule source des durées, courbes et règles du mouvement (§ 15) |
| Déprécié | `src/components/report/kit.tsx` (`GlassCard`, `ReportSection`) | ne s'emploie plus ; disparaît avec la migration des modules |

**Stable ou hypothèse.** Sauf mention contraire, une règle de ce document est **stable** : elle
s'applique, et ne change que par un amendement daté (§ 12). Une règle marquée **hypothèse** décrit une
forme proposée et éprouvée par un écran témoin, qui reste ouverte : on la suit par défaut, on s'en
écarte en le disant et en le justifiant.

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
seule surface élevée par mouvement (la plaque), colonne de lecture fixée à l'échelle de la page,
**preuve en marge** de ce qu'elle fonde, numérotation citable. A gouverne la **structure de tout écran**, sans exception.

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

**La grille à marge (v3.0).** Dans un dossier, une page de donnée ou toute page qui affirme un fait,
la piste de prose se double d'une **marge de preuve** : texte `minmax(0, 1fr)`, marge de 232 px
(`--r-marge`), gouttière de 48 px (`--r-gouttiere`), à partir de 900 px. La marge porte le grain, la
valeur observée, la source, la date et le lien de preuve de l'affirmation qui est à sa gauche, alignés
sur sa première ligne. Sous 900 px, la marge passe sous le texte, derrière un filet pointillé
(`Ligne` et `Marge`). Une **colonne d'appui** de 280 px peut accompagner la lecture (repère des
échelles, sommaire) : c'est une vraie colonne, collante sous la navigation, jamais un calque posé sur
le contenu.

**Les seuils de mise en page d'un composant suivent son conteneur, pas l'écran** (`@container`) : un
composant posé dans une colonne étroite ne doit pas prendre la mise en page prévue pour toute la
largeur. Écart connu : `CoupeEchelles` (à corriger au lot R1).

### 2.2 Une seule surface dominante à la fois

Une surface élevée est un bloc qui sort du plan. **Depuis la v3.0, elle a une seule forme : la
plaque** (`Plaque`) : fond `--r-plaque` (`--bg-deep`), filet `--r-plaque-bord`, rayon de 3 px, deux
repères de coupe en coin. Le verre translucide et l'ombre portée ne sont plus des surfaces du canon.

*Vocabulaire.* Dans ce document, un **mouvement de page** est une **section de lecture** (au sens
éditorial : un temps du document, séparé par un filet, `.mouvement`). Il n'a rien à voir avec le
**mouvement animé**, qui relève de FUT-75 (§ 15).

**Une seule surface dominante par mouvement de la page.** Deux plaques de même poids ne se font pas
concurrence dans le même champ visuel, sauf quand l'écran les met **explicitement en regard** pour les
comparer. Une page longue, un guide Agir, un rapport de plusieurs milliers de pixels ont le droit d'en
porter plusieurs.

La plaque porte ce que futur•e **conclut** (le verdict, une lecture immédiate) ou ce que la personne
**achète**. Ce qui vient d'un tiers (formulaire de paiement, carte) se pose dans un **emplacement** :
filet pointillé, sans coins de plaque.

Tout le reste se sépare par un **filet** (1 px, `--border-1`) et par de la **marge**. Une page où
chaque bloc est une carte n'a plus de hiérarchie, elle a une texture.

### 2.3 Ce qui sépare

Par ordre de préférence : la marge, puis le filet, puis le fond (une bande de mouvement, une plaque).
On descend d'un cran seulement quand le cran précédent ne suffit pas. Le verre ne fait plus partie de
la liste.

**Le rythme vertical** : un pas de 8 px ; un mouvement de page = 56 px au-dessus et au-dessous et un
filet (40 px en version resserrée) ; les éléments d'une liste, 22 px et un filet.

### 2.4 La numérotation citable

Une section que le lecteur peut vouloir mentionner porte une ancre stable (`id`) et un numéro
visible. Une preuve qui renvoie vers une carte vise cette carte, jamais le haut du module.

---

## 3. B · Le vocabulaire de la donnée

### 3.1 Les quatre états d'une valeur

Toute valeur affichée est dans l'un de ces quatre états, et son traitement visuel est fixé :

| État | Traitement |
| --- | --- |
| **Mesurée** | valeur pleine, tabulaire, source **dans la marge** à côté de l'affirmation (sous elle sur mobile) |
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

Toute valeur numérique est en chiffres tabulaires (`font-variant-numeric: tabular-nums`). Deux valeurs
comparables s'alignent verticalement sur leur unité. Un libellé peut wrapper ; une valeur ne wrappe
jamais (`white-space: nowrap`).

**Deux tailles, deux dessins (v3.0).** Une valeur **mise en avant** (`Chiffre`) est en Archivo 500,
chiffres tabulaires (`--r-t-chiffre`), à l'encre, suivie de son unité en mono discret ; elle est toujours
accompagnée de sa référence ou de son horizon dans la ligne suivante. Une valeur **dans la marge, un
tableau ou une unité** est en `--font-mono`.

### 3.3 La trajectoire

Une trajectoire montre **au moins deux points et l'écart entre eux**, avec l'horizon nommé sur
chacun. Un chiffre futur seul est interdit : sans référence, le lecteur ne peut pas savoir si 32
jours de chaleur est beaucoup.

Le référentiel de réchauffement s'affiche toujours à l'échelle France : +2 / +2,7 / +4 °C, jamais le
global. Voir `doctrine/data.md`.

**Le tracé suit la nature de la donnée (v3.0).** Des horizons (2030, 2050, 2100), des paliers de
réchauffement ou des moyennes trentenaires ne sont pas les points d'une série : ce sont des **jalons
isolés**, jamais reliés par une ligne qui laisserait croire que l'entre-deux est connu (`RegleDuTemps`,
FUT-87 V2). Une **série continue réellement mesurée ou modélisée à ce pas** (températures annuelles
observées, série annuelle d'un même modèle) peut, elle, être tracée en courbe, avec son enveloppe
d'incertitude et sa source. La question à se poser : la donnée existe-t-elle entre deux points ?

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

Fond profond `#060812`, grain de bruit léger. Cette part de la direction artistique est conservée.
**Le verre translucide n'est plus une signature (v3.0)** : le Relevé tient la promesse esthétique par
le fond profond, la plaque `--bg-deep`, les filets et la géométrie propre du produit. Il reste dans les
surfaces historiques jusqu'à leur migration, et n'entre dans aucun nouvel écran (test-cliquet, § 10).

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

**La donnée est à l'encre (v3.0).** Barres, rangs, jalons, valeurs : `--r-encre`, sans teinte. Seule
exception, la couleur réglementaire du DPE, dont la position sur l'échelle A à G porte le sens.

**Un incident technique ne prend jamais une teinte de registre (v3.0).** Un registre juge un lieu ; un
paiement refusé, une source sans réponse ou une génération indisponible sont des incidents. Ils se
disent à l'encre, par une phrase qui dit ce qui a eu lieu, et **seulement ce que le serveur a
confirmé** (§ 9.1, ligne d'état).

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

**Comment le registre se porte (v3.0) : un trait de 3 px devant le SUJET** d'un fait (`Registre`),
jamais un fond de carte, une bordure, un chiffre coloré ni une pastille. Le titre de section reprend
le même trait. Une issue **non établie** (« à vérifier », « non examiné ») n'a ni teinte ni trait
plein : un trait pointillé, sans valence. Ce trait remplace le filet coloré en haut de carte de la
v1.4 (§ 6.2).

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

**Réécrit en v3.0.** Le verdict vit dans la **plaque** (`Plaque` + `ConclusionBlock`, variante
`releve`). Son ton se porte comme tout registre, par un trait devant son libellé, jamais par un halo,
une auréole ni une forme d'échelle (le carré qui marque aujourd'hui le ton de la plaque est le glyphe
du secteur ; il est remplacé au lot R2). Un dossier bloqué ne s'auréole pas de vert, et il ne prend pas
l'orange parce que l'orange est la couleur du produit.

**L'orange de marque** (`#E8823A`) : le point du logo et **une action principale dans le champ
visuel** (porte de l'accueil, « Payer », « Commencer »). Jamais sur une donnée, un statut, un titre ni
une lueur. Le texte posé dessus prend `--r-sur-marque`, qui tient 4,5:1 dans les deux thèmes.
`.card-verdict` reste dans la présentation classique de Ma décision jusqu'à sa suppression.

---

## 6. Conditions d'usage

### 6.1 La ligne de relevé (remplace « la carte », v3.0)

L'unité d'un écran qui affirme est la **ligne de relevé** (`Ligne`) : un énoncé à gauche, sa preuve
dans la marge, un filet avant la ligne suivante. Elle remplace la carte. Une « carte » ne reste
légitime que pour un objet que le lecteur manipule comme tel (une possibilité qu'il déplace, une
offre qu'il choisit), et elle n'est alors ni en verre ni arrondie au-delà de 3 px.

Les dix rôles documentaires et leur forme :

| Rôle | Forme | Primitive |
| --- | --- | --- |
| **Fait** | un énoncé complet, au présent, à gauche de la marge | `Ligne` |
| **Valeur** | chiffre à l'encre + unité mono ; dans la marge, mono tabulaire | `Chiffre`, `Marge` |
| **Provenance** | glyphe de grain + mot | `Grain` |
| **Preuve** | la marge : grain, valeur, source, date, lien qui porte la provenance de l'artefact servi | `Marge` |
| **Limite** | une phrase `--r-t-nuance` en `--r-discret` sous le fait ; jamais en italique ni en couleur | `.nuance` |
| **Interprétation** | corps de texte sous le fait, jamais plus grand que lui | `.corps`, `.dense` |
| **Conclusion** | la plaque, verdict en `--r-t-verdict` ; le titre n'est jamais généré | `Plaque` + `ConclusionBlock` |
| **Vérification** | sujet au trait `contrôle`, geste à glyphe d'action, numéroté | `Registre` + `ActionCue` |
| **Projet** | phrase de lecteur, citée et jamais reformulée ; conditions sans compromis au trait `incompatibilité` | `Plaque`, `Registre` |
| **Arbitrage** | la balance : deux côtés en regard (deux colonnes dès 900 px), pour **deux côtés d'un même arbitrage** | `.deux`, `.bandeColonne` |

Deux motifs du produit sont canoniques : **« pourquoi elles ne disent pas la même chose »** (deux
lectures de grains différents en regard, Logement), forme de toute **contradiction** ; et **la ligne
d'état unique** (FUT-75 Q5), forme de tout contenu **en attente** qui ne remplace rien.

### 6.2 Le filet coloré en haut de carte (remplacé, v3.0)

Remplacé par le **trait de registre devant le sujet** (§ 5.4). Les quatre règles de sélection de la
v1.4 (`src/lib/decision/evidence-registers.ts` : pas de filet sans projet, sans citation, ni quand
plusieurs registres se disputent une carte sauf l'incompatibilité) restent **en vigueur pour les
surfaces historiques** qui portent encore ce filet ; leur transposition au trait, ou leur retrait avec
les cartes, est tranchée à la migration des modules (lots R3 à R5).

### 6.3 Le badge, la pastille et le surtitre (remplacé, v3.0)

**Le surtitre** nomme un mouvement de la page : Archivo 600, `--r-t-surtitre`, **casse
normale**, précédé d'un numéro citable en mono (`Surtitre`). **Le mono n'est jamais en capitales
espacées.** Les surtitres à pastille colorée sortent du canon.

Un **badge** reste permis pour un **état qui varie** (disponible, verrouillé, à venir), en `.etiquette`,
sans fond coloré. Un badge dont la valeur est constante sur toute une liste est supprimé : il
n'informe personne.

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
est un défaut de livraison. La page ne scrolle jamais horizontalement.

**Le tableau de relevé (v3.0)** : des filets, aucun fond par ligne ni couleur par colonne, les nombres
à droite en mono tabulaire, une `caption` qui dit ce que le tableau compare et sur quelle population.
**Sous 640 px, chaque ligne s'empile** (libellé et valeur sur une ligne, le reste dessous) plutôt que
de défiler dans son conteneur ; le défilement interne reste un dernier recours, signalé, pour une
table dont l'empilement détruirait la comparaison. *(Hypothèse jusqu'à la primitive `Tableau`, lot R1.)*

---

## 7. La relation entre les trois échelles

Territoire, Autour, Logement se lisent dans cet ordre, **du large au précis**, et chacune peut
contredire la précédente.

| Échelle | Grain |
| --- | --- |
| Territoire | la commune |
| Autour | le secteur autour du point |
| Logement | le bâtiment |

**Une échelle se reconnaît à son nom, sa position dans l'ordre, son grain et sa forme.** Depuis la
v3.0, la forme est l'identité visuelle d'une échelle, et elle seule : **cercle** pour la commune (cercle
à point pour l'agglomération), **carré** pour le secteur, **losange** pour le bâtiment (plein) ou
l'adresse (vide), les formes exactes de `echelle-geometry.ts`. Trois états de trait : plein (des
constats), fin (examinée, rien d'affiché), pointillé (non examinée dans cette lecture). **Ces trois
formes sont réservées aux échelles** : aucune autre fonction (statut, puce, ton) ne les emploie.
Aucune teinte n'identifie une échelle.

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
- ~~Une teinte d'échelle reste tolérée dans la chrome de navigation d'un module.~~ **Supprimé en
  v3.0** : la forme suffit, la tolérance entretenait le ton par module de `report/kit.tsx`.

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

**v3.0** : la navigation passe en **casse normale** (plus de capitales mono espacées) et gagne un
**lien d'évitement** vers le contenu ; sur `/rapport`, la navigation collante réserve sa hauteur
(`scroll-padding-top`) pour qu'aucun focus ni aucune ancre ne finisse dessous. Chantier coordonné avec
FUT-86.

### 8.2 La fraîcheur

Toute page qui affiche de la donnée vivante affiche sa date de lecture, **calculée**, jamais écrite
à la main. Corollaire : un bloc dont le contenu est figé dans le code ne s'intitule pas « en cours ».

### 8.3 La canonicité

**Un enjeu = un hub = une famille d'URL communale = un guide.** Une page commune n'existe que si la
donnée est réellement communale. Cette règle doit être tenue avant toute ouverture à l'indexation.

---

## 9. Composants

### 9.1 Validés, à réutiliser

**Réécrit en v3.0. Les primitives du Relevé** (`src/components/releve/primitives.tsx`, classes de
`releve.module.css`) :

| Primitive | Rôle |
| --- | --- |
| `releve` / `releveSection` | la racine d'une page ou d'une section du Relevé |
| `Surtitre` | nomme un mouvement : numéro mono + nom en casse normale |
| `Ligne` + `Marge` | un énoncé et sa preuve (grain, valeur, source, date, lien) |
| `Grain`, `GlypheGrain` | l'échelle d'un fait, dite par la forme |
| `Registre`, `TEINTE_REGISTRE` | le sujet d'un fait, précédé du trait de son registre |
| `Chiffre` | une valeur mise en avant, avec son unité |
| `Plaque` | la surface dominante d'un mouvement |
| `RegleDuTemps` | dates et horizons sur un axe linéaire, jalons isolés *(chevauchement à 360 px, § 14)* |
| `RegleDeRang`, `Seuils` | une position parmi les communes, un seuil de signalement, dessinés à l'encre |
| `EmblemeEchelles`, `CoupeEchelles` | les trois échelles et la navigation entre elles |
| classes `.bouton`, `.boutonMarque`, `.lien`, `.porte`, `.details`, `.detailsFluide` | actions, liens, dépliables (FUT-75 Q4) |

Restent validés : les règles d'anti-redondance de `DossierDecisionSection` (un grain affiché une seule
fois, une section effacée quand le verdict la porte déjà) · `lireDossier` comme seul adaptateur du
dossier vers le Relevé (rien perdu, rien inventé, testé) · `[data-visee]` comme repère d'arrivée qui
s'efface · le tiret `—` comme marqueur d'absence · `TerritoryYearsBand` · `BoutonAction` (FUT-75) ·
`PriorityControlActions` · `EchelleNavigator` (à passer en casse normale) · `MetricDrawer` (référence
de composant responsive).

**Manquants, à créer dans `src/components/releve/` (lot R1)** *(hypothèses jusque-là ; formes
éprouvées par les témoins de `/dev/fut118`)* : `Selecteur` (horizon, mode : remplace `HorizonSwitch`
et `HORIZON_PILLS`), `Tableau`, `Champ`, `Bouton`, `Parcours`, `LigneEtat`, `Emplacement`. Les formes
`Issue` et `NiveauExamen` du témoin de comparaison sont des **composants métier possibles du centre de
décision**, à sa discrétion (§ 13), pas des primitives à créer. **La ligne d'état n'affirme que ce que le serveur a
confirmé** *(stable)* : « aucun montant n'a été prélevé », « paiement reçu », « dossier prêt » ne
s'écrivent qu'à partir d'un état serveur établi ; une erreur générique, un délai ou une réponse perdue
ne prouvent rien, et l'écran dit alors que la confirmation n'est pas encore connue, sans offrir de
payer une seconde fois.

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
| `--weight-kicker` | `600` | ~~surtitre mono capitales~~ : surfaces historiques seulement, disparaît avec elles |

**Deux crans séparent toujours un titre de son texte**, 600 contre 400. Un seul cran ne se voit pas
sur une grotesque, il se lit comme une erreur de rendu.

**Ce qui rend Archivo distinctive est le réglage, pas le dessin.** Elle descend des grotesques
américaines : posée en 400 avec un tracking normal, elle redevient invisible. La discipline des
graisses et des gris n'est donc pas un confort, c'est ce qui tient l'identité.

**La couleur reprend du service comme troisième axe.** Avec une famille unique, les cinq niveaux de
gris (`--fg-hi` à `--fg-4`) et les teintes de registre portent une part de la hiérarchie que le
dessin ne porte plus. Un titre en `--fg-hi`, un corps en `--fg-2`, une source en `--ghost` créent
trois plans lisibles avant même que la graisse intervienne.

**Archivo en largeur normale (v3.0, correctif du 20/10).** La référence typographique est Archivo telle
que l'accueil l'affiche : **en largeur normale**. Le fichier servi (`/fonts/Archivo-Variable.woff2`) n'a
qu'un axe de graisse ; les réglages `wdth` qu'avait posés FUT-87 étaient ignorés par le navigateur et ont
été retirés. La hiérarchie tient à la taille, à la graisse, à l'encre et aux espacements. Aucun
`font-variation-settings` de largeur n'est écrit (test K6) : un élargissement demanderait de servir une
autre police **et** d'amender ce document.

**L'échelle de rôles du Relevé (v3.0).** Une taille par **usage**, jamais par niveau de titre HTML.
Les jetons `--r-t-*` vivent dans `design-tokens.css` ; les classes qui les composent (graisse, axe de
largeur, interligne, couleur) dans `releve.module.css`. **Tout nouvel écran les emploie.**

| Rôle | Jeton | Réglage | Ce que le texte fait |
| --- | --- | --- | --- |
| Display | `--r-t-display` | Archivo 500, `clamp(34px, 4.4vw, 58px)`, −0,02 em | titre d'écran ; un par écran |
| Verdict | `--r-t-verdict` | idem, `clamp(27px, 3.6vw, 46px)` | le verdict dans la plaque |
| Titre | `--r-t-titre` | 600, `clamp(23px, 2.5vw, 31px)` | titre de mouvement |
| Sous-titre | `--r-t-sous-titre` | 600, 17 px | sujet d'un fait, nom d'une possibilité |
| Chapô | `--r-t-chapo` | 400, 18 px / 1,55 | introduction d'un écran |
| Corps | `--r-t-corps` | 400, 16 px / 1,62 | prose suivie |
| Dense | `--r-t-dense` | 400, 14,5 px / 1,58 | corps d'un fait, d'une liste, d'un tableau |
| Nuance | `--r-t-nuance` | 400, 13,5 px, `--r-discret` | limite, portée, méthode |
| Surtitre | `--r-t-surtitre` + `--r-t-numero` | 600, 13,5 px, casse normale ; numéro mono 11,5 px | nomme un mouvement |
| Étiquette | `--r-t-etiquette` | 600, 12,5 px | libellé, statut, en-tête de tableau |
| Chiffre | `--r-t-chiffre` + `--r-t-unite` | 500, tabulaire ; unité mono 13 px | une valeur mise en avant |
| Marge | `--r-t-marge` / `--r-t-marge-etroite` | JetBrains Mono 12 px, 13 px sous 900 px | grain, preuve, source, date |

**Planchers de lisibilité** (mobile et écrans non-Retina, FUT-77) : rien sous 10,5 px, et 10,5 px
seulement pour une légende d'axe ; jamais de graisse 400 sous 13 px sur fond sombre ; `--ghost` (4,69:1 sur la plaque) jamais sous 12 px.

**L'échelle historique `--text-*`** ci-dessous reste en place pour les surfaces qui ne sont pas encore
migrées : la modifier changerait leur rendu. Elle ne s'emploie dans aucun nouvel écran, et disparaît
avec la dernière surface migrée (lot R12).

| Rôle (historique) | Valeur | Ce que le texte fait |
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

**v3.0** : `report/kit.tsx` (`GlassCard`, `ReportSection`, ton par module) · la classe `.glass` et
`.card-verdict` · `Chip` (« PREUVE · … » en capitales mono) et `EvidenceRow` sous sa forme de
pastilles · `FamilyHeading` coloré · `HorizonSwitch` · l'échelle `--text-*` et `--weight-kicker`. Ils
restent dans les surfaces historiques jusqu'à leur migration ; aucun nouvel écran ne les emploie
(test-cliquet, § 10).

### 9.3 Interdits

Les orbes flous en `position: fixed` · les emoji comme icônes (déjà interdits par
`doctrine/editoriale.md`, et présents en production dans le rapport) · la barre de sources défilante
· le pricing coché à couleur par plan · toute animation sur une donnée · la pastille à valeur
constante répétée · le `fontFamily` en dur · la couleur hexadécimale en dur · un `max-w` de
paragraphe plus étroit que son bloc.

**v3.0** : les capitales mono espacées · le titre à suite en italique orange (ou de toute couleur) ·
une lueur ou un halo autour d'un paiement ou d'une action · les formes d'échelle (cercle, carré,
losange) employées à autre chose qu'une échelle · une couleur propre à une échelle, un module, une
offre ou une possibilité · une ligne qui relie des horizons ou des paliers de réchauffement · un
message de paiement ou de livraison qui affirme ce que le serveur n'a pas confirmé.

---

## 10. Conventions d'implémentation

Cette section porte des règles de code. Elle est séparée à dessein : les règles visuelles ci-dessus
survivent à un changement de technologie, celles-ci non.

- **Tokens.** Toute couleur, police, ombre et rayon vient de `src/app/design-tokens.css`. Les
  composants consomment `var(--token)`. Les jetons du Relevé (`--r-*`, `--r-t-*`, `--r-sur-marque`) y
  sont déclarés **une seule fois** ; aucun module ne les redéclare (test K2), et tout jeton `--r-*`
  employé y est défini (K3).
- **Une grammaire, trois niveaux de composants.** Une seule grammaire ne veut pas dire un seul
  répertoire.
  - **Primitives visuelles partagées** : `src/components/releve/`. Une forme y entre quand elle exprime
    la grammaire sans rien savoir d'un domaine, et que deux domaines au moins en ont besoin (ligne et
    marge, plaque, registre, grain, sélecteur, tableau, champ…). Elles ont leurs tests.
  - **Composants métier** : dans leur domaine (Logement, Territoire, comparaison, paiement, centre de
    décision…). Ils composent les primitives et consomment les jetons et les rôles ; leurs styles
    propres ne créent ni couleur, ni taille de texte, ni rayon hors jetons.
  - **Compositions de parcours** : les pages et les routes, qui assemblent librement les deux.
- **Le cliquet, un garde-fou, pas un juge esthétique.** `src/components/releve/canon.test.ts` (K1)
  compte les marqueurs de l'identité historique (verre, kit déprécié, capitales mono, italique
  d'accent, emoji) fichier par fichier : un fichier ne peut qu'en perdre, un fichier nouveau n'en
  contient aucun. Ses expressions sont des **approximations**, dont les limites sont écrites dans
  `heritage.ts` (faux positifs : un mot « glass » dans un commentaire, un symbole dans un contenu, un
  code légitime en capitales ; oublis : capitales posées par `text-transform`, `backdrop-blur`, rayons,
  couleurs en dur, halos, animations). Un passage au vert ne vaut pas conformité.
  - **Exception légitime** : une entrée dans `heritage-exceptions.json` (fichier, marqueur, nombre,
    motif d'au moins une phrase), relue en revue. K1b vérifie le motif et **détecte** une exception
    devenue inutile : le test échoue tant qu'on ne l'a pas retirée à la main. Aucune exception dans le
    Relevé lui-même.
  - **La référence** (`heritage-reference.json`) ne se modifie jamais à la main. Elle se régénère après
    un lot qui retire des marqueurs (`node scripts/fut118/heritage-reference.ts`), et son total est
    plafonné dans le test (603 au lot R0).
  - **Ce qui est garanti automatiquement, et ce qui repose sur la revue.** Automatique : aucun fichier ne
    dépasse sa référence (plus ses exceptions) ; aucun fichier nouveau n'a de marqueur ; le total de la
    référence ne dépasse pas le plafond ; le script de régénération refuse toute hausse par fichier ; une
    exception sans motif ou inutile fait échouer le test. **Revue GitHub** : une modification manuelle
    de `heritage-reference.json` qui resterait sous le plafond (par exemple une référence descendue à 580
    puis remontée à 600) n'est pas détectée par les tests ; abaisser le plafond après un lot de
    migration est un geste manuel ; la légitimité d'une exception se juge en revue. Toute modification de
    ces deux fichiers JSON et du plafond se relit donc explicitement dans la PR.
- **Contrastes.** K4 vérifie que les jetons de texte et le texte sur la couleur de marque tiennent
  4,5:1 sur le fond et la plaque, dans les deux thèmes.
- **Preuve d'absence de changement visible.** Un lot qui ne doit rien changer à l'écran le prouve par
  `scripts/fut118/empreinte-visuelle.mjs` puis `comparer-empreintes.mjs` (captures et styles calculés,
  avant et après, sur l'accueil, Ma décision dans ses deux présentations, les modules et les tunnels).
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

Points non tranchés dans cette version :

1. ~~La collision de l'orange~~ **(v3.0, réglée)** : dans le dossier, l'orange n'est que la teinte du
   registre « compromis » ; la marque n'y apparaît que sur une action principale, et jamais sur une
   donnée ni un statut (§ 5.5).
2. **Le décompte des échelles** : « six angles », « trois échelles » et « Module 01 » cohabitent
   dans le rapport. Le § 7.2 en dépend, puisqu'il fait porter l'identité par le rang.
3. **La navigation de niveau 1** : proposition en annexe de
   `docs/audits/2026-07-30-famille-editoriale.md`, non tranchée par le porteur.
4. **Le système de composants éditoriaux partagés** : c'est désormais le Relevé ; les composants
   manquants sont créés au lot R1, les surfaces migrent par lots (plan dans
   `docs/audits/2026-10-20-fut118-releve.md`, § E).
5. **Le filet de carte de la v1.4** : transposé au trait de registre, ou retiré avec les cartes (§ 6.2).
6. **Le thème clair du Relevé** : jamais vérifié à l'écran ; les contrastes des jetons sont testés
   (K4), pas le rendu.

## 12. Journal des amendements

**v3.0, 20/10/2026** (FUT-118 : le Relevé devient la grammaire canonique ; adoption à la fusion de la
PR R0, après relecture du porteur) :

| Amendement | Motif |
| --- | --- |
| en-tête, § 0 · le Relevé canon, `kit.tsx` déprécié, statut stable / hypothèse | Trois sources se contredisaient (`DESIGN.md` v2.1, `kit.tsx` « source unique », primitives annoncées « prototype » mais employées en production) ; une interface nouvelle ne savait laquelle suivre |
| § 1, § 2.1 à 2.3 · grille à marge, plaque, séparation sans verre | La preuve à côté de ce qu'elle prouve ; une surface élevée par mouvement, une seule forme de surface |
| § 3.1, § 3.2 · source en marge, chiffre mis en avant en Archivo 500 tabulaire | Le Relevé appliqué dans Ma décision (FUT-91) et l'accueil (FUT-50) |
| § 3.3 · le tracé suit la nature de la donnée | Horizons et paliers jamais reliés (FUT-87 V2) ; une série continue réelle peut être une courbe, avec son incertitude (revue du 20/10 : ne pas interdire une représentation utile) |
| § 5.1, § 5.3, § 5.4, § 5.5 · verre retiré, donnée à l'encre, incident sans registre, trait de registre, verdict dans la plaque, texte sur la marque | `.boutonMarque` tombait à 2,57:1 en thème clair ; `--r-sur-marque` tient dans les deux thèmes |
| § 6.1 à 6.3 · la ligne de relevé, les dix rôles documentaires, le surtitre en casse normale | Remplacent la carte de verre, le filet de carte et la pastille |
| § 6.6 · le tableau s'empile sous 640 px | Le défilement interne cachait la comparaison sur mobile |
| § 7 · l'échelle dite par la forme, formes réservées | Le carré de ton de la plaque se lisait comme le glyphe du secteur |
| § 8.1 · casse normale, lien d'évitement | Avec FUT-86 |
| § 9 · primitives du Relevé, rôles `--r-t-*`, manquants nommés, ligne d'état fidèle au serveur | Revue du 20/10 : un message de paiement ne dit que ce que le serveur a confirmé |
| § 10 · une seule source de jetons, cliquet, contrastes, preuve d'absence de changement | Empêcher de recréer une seconde grammaire pendant la migration par lots |
| § 13, § 14 · centre de décision (principes et hypothèses), limites connues, validations obligatoires | Revue du 20/10 : ne pas figer la comparaison ; documenter les limites mobiles visibles ; R0 n'est pas une validation de l'interface |
| § 10 · trois niveaux de composants (primitives, métier, parcours) ; le cliquet comme garde-fou, ses limites, ses exceptions motivées, son plafond | Revue de R0 : une seule grammaire ne veut pas dire un seul répertoire ; un test approximatif ne doit ni juger l'esthétique ni se desserrer en silence |
| § 3.2, § 6.3, § 9.1 · **Archivo en largeur normale** ; les réglages `wdth` et les jetons de largeur retirés (erratum à FUT-87) | Le fichier servi n'a pas d'axe de largeur : un même texte mesure la même largeur à `wdth` 62, 100 et 125. Les réglages étaient ignorés, et le produit validé à l'écran a toujours été en largeur normale. Choix du porteur : garder ce rendu |
| § 0, § 15 · le mouvement : FUT-75 seule source, trois niveaux, écarts constatés | Revue de R0 : le Relevé définit le langage visuel, FUT-75 le comportement dans le temps ; la première version de la grammaire esquissait une seconde classification (« quatre sens »), retirée |

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

---

## 13. Les interfaces nouvelles, et le centre de décision (v3.0)

**Une identité commune, une vraie liberté d'invention dans les parcours.** Toute interface nouvelle
parle le Relevé (langage visuel) et FUT-75 (mouvement), mais n'a pas à reproduire la composition d'un
rapport documentaire. Le centre de décision (FUT-41, FUT-22) peut devenir une interface interactive,
visuelle et guidée. Ce document sépare ce qui ne se négocie pas de ce qui reste à inventer ; ses
composants propres sont des composants métier (§ 10), dans son domaine.

Ses libertés de composition respectent : la **traçabilité et les preuves** ; les **registres** et les
**échelles** ; l'**absence de score composite ou de classement implicite** ; la **fidélité des
formulations aux données** ; la **grammaire visuelle du Relevé** (jetons, rôles, formes, registre,
plaque) ; la **grammaire du mouvement de FUT-75** (§ 15).

**Principes non négociables** *(stable)* :

1. **La preuve.** Toute issue, tout énoncé comparatif renvoie à sa source, à la date de l'analyse et à
   la provenance de **cet** artefact.
2. **Le registre.** La seule couleur de jugement est celle des six registres, liée à une issue
   **établie**. Une issue non établie (« à vérifier », « non examiné ») n'a aucune valence : ni teinte,
   ni trait plein.
3. **Le grain.** Chaque issue dit à quelle échelle elle a été établie ; une différence de profondeur
   d'examen n'est jamais présentée comme un avantage du lieu.
4. **Aucun score.** Ni note, ni total, ni moyenne, ni « nombre de points favorables », ni tri par
   mérite. Les seuls nombres sont des longueurs de liste recomptables à l'écran.
5. **Une possibilité ne prend pas de couleur propre** : la couleur est réservée aux registres.
6. **L'absence se dit**, avec sa raison.
7. **La phrase dit ce que dit la marge.** Un énoncé reprend l'issue exacte de chaque possibilité qu'il
   nomme, et cela se teste sur le texte rendu, pas seulement sur la classe (leçon du 25/07,
   `AGENTS.md`).

**Hypothèses** *(ouvertes)* : les critères en lignes et les issues de chaque possibilité en marge
(écran témoin `/dev/fut118/comparaison`) ; l'absence de colonnes par candidat ; l'absence de
disposition spatiale ; la direction « dossier de décision vivant » du cadrage FUT-41. Ce sont des
exemples. Des colonnes, une table manipulable, une disposition spatiale ou un parcours guidé restent
possibles **s'ils tiennent les sept principes** : une position ou une colonne ne se lit pas comme un
rang, et un axe dit ce qu'il signifie. Un écart à une hypothèse se dit et se justifie ; il ne demande
pas d'amender ce document. Les règles **stables** des § 2 à 9 s'entendent pour ce qu'elles décrivent
(une forme de surface, un rôle typographique, une couleur) et ne prescrivent pas de mise en page à un
parcours : la balance, par exemple, signifie un arbitrage ; elle n'interdit pas de mettre deux lieux
en colonnes.

## 14. Limites connues (v3.0)

| Limite | Suite |
| --- | --- |
| `RegleDuTemps` superpose ses libellés à 360 px dès quatre dates rapprochées, et « aujourd'hui » touche une valeur voisine | lot R1, avant tout usage en production |
| La comparaison à plusieurs lieux est très dense à 360 px (témoin : 10 lieux, environ 4 400 px de haut) | question ouverte pour FUT-41 |
| Écrans non-Retina, Safari / WebKit et thème clair jamais vérifiés à l'écran pour le Relevé | contrôles requis avant toute activation (`DECISION_RELEVE`) |
| `CoupeEchelles` suit l'écran et non son conteneur | lot R1 |
| Le ton de la plaque du verdict est un carré, glyphe du secteur | lot R2 |
| **Animations qui ignorent le mouvement réduit** (constat du 20/10, détail au § 15.4) | lots R2, R6, R7, R8, R9, R11 |

**Les validations restent obligatoires.** Le lot R0 prouve qu'il ne change rien à l'écran (52
empreintes) ; il ne valide pas l'interface. Avant l'activation publique de toute surface migrée :
Safari / WebKit (iPhone réel et macOS), thème clair relu à l'œil, écrans connectés avec une vraie
session et de vrais dossiers (anciens compris), mobile 360 et 390 px, écran non-Retina, clavier,
**mouvement réduit**. Le plan de migration en fait une condition de sortie de chaque lot.

---

## 15. Le mouvement : FUT-75 (v3.0)

**Le Relevé définit le langage visuel ; FUT-75 définit le comportement dans le temps.** Il n'existe pas
de seconde grammaire d'animation. Sources, dans cet ordre : `src/lib/motion.ts` (durées, courbes,
ressort, délai de l'indicateur) et `motion.test.ts`, qui aligne ces valeurs sur les jetons `--m-*` de
`design-tokens.css` (G1) et vérifie leur mise à zéro en mouvement réduit (G2) ; puis la décision
d'intégration `docs/audits/2026-10-12-fut75-integration-1.md`. Les prototypes de la branche
`feat/fut-75-motion-releve` restent la référence artistique.

### 15.1 Les trois niveaux *(stable)*

| Niveau | Ce qu'il fait | Durées et jetons |
| --- | --- | --- |
| **Geste** | la réaction immédiate à la main : pression, survol, focus. Seul niveau qui admet le **micro-ressort** (≈ 2 % de dépassement), et seulement sur une **commande** (bouton, indicateur), jamais sur une donnée | 90 ms `--m-pression`, 120 ms `--m-geste`, ressort `--m-ressort` sur 200 ms `--m-ressort-duree` |
| **État** | la continuité entre deux présentations d'un même élément : une zone qui s'ouvre, un bouton qui devient attente, un contenu qui s'échange | 180 ms `--m-bascule` (fondu et flou de 2 px, sans déplacement), 240 ms `--m-etat` ; courbe `--m-releve` |
| **Structure** | la compréhension d'ensemble : navigation, dévoilement, **déclenchée par le lecteur** | 900 ms au plus (`DUREES.plafond`) |

### 15.2 Les principes *(stable)*

- **Le repère bouge, la donnée reste.** Aucune valeur ne défile, aucune barre ne s'étire, aucun résultat
  scientifique ne s'anime. Une valeur nouvelle arrive entière.
- **Mouvement réduit** (`prefers-reduced-motion: reduce`) : aucun déplacement, aucun ressort, l'état
  final est appliqué tout de suite ; seule une teinte peut encore changer. Les jetons `--m-*` tombent
  à 0 ms et le ressort perd son dépassement, pour tout le site.
- **Interruption** : une transition repart de l'état courant ; aucune séquence ne se joue contre le
  lecteur. Le focus clavier ne bouge jamais du fait d'une animation.
- **L'indicateur d'attente** n'apparaît qu'après 300 ms (`DELAI_INDICATEUR`) ; aucun pourcentage ni temps
  restant inventé.
- **Budget** : au moins 30 images par seconde avec le processeur ralenti six fois, sinon un repli plus
  simple. Aucune dépendance d'animation.

### 15.3 Ce que le Relevé y ajoute, et ce qu'il n'y ajoute pas

Rien de nouveau : aucune durée, aucune courbe, aucun niveau. Les exemples du Relevé se rangent dans les
trois niveaux : changer d'horizon (le repère du sélecteur glisse, état, 180 ms ; les valeurs changent
d'un coup) ; ouvrir « Données et limites » (état, `.detailsFluide`, Q4) ; une lecture enrichie qui se
prépare (ligne d'état, Q5) ; une analyse mise à jour (`BoutonAction`, Q1) ; passer d'une échelle à
l'autre (structure, déclenché par le lecteur). Un écran nouveau, centre de décision compris, emploie
ces niveaux ; un besoin qu'ils ne couvrent pas s'ajoute à `motion.ts`, avec son test, jamais en local.

### 15.4 Écarts constatés le 20/10 (antérieurs à la v3.0, non corrigés dans R0)

**Animations qui ignorent le mouvement réduit**, à corriger dans le lot qui migre chaque surface :

| Animation | Où | Lot |
| --- | --- | --- |
| orbes `breathe` (`.orb`, boucle infinie de 14 s, déplacement et agrandissement), style injecté sans garde | 22 pages : hubs et pages commune chaleur (3), inondation (4), voiture (2) ; Savoir (6) ; Agir (7) ; hors liste, Pourquoi et Professionnels sont gardés | R8 (pages commune et hubs), R9 (Savoir, Agir) |
| barre de chargement de route (`RouteLoadingBar`, balayage infini en style en ligne, hors de la garde qui couvre ses autres animations) | toutes les routes, pendant une navigation | R7 (navigation et chrome globale) |
| point pulsé `animate-pulse` | Ma décision classique (analyse d'adresse en cours) | R2 (le Relevé le remplace déjà par un repère fixe) |
| texte pulsé `animate-pulse` pendant le chargement du paiement | `PaymentWrapper` | R6 (tunnel) |
| points pulsés `animate-pulse` | Où vivre (4), comparateur (`ModeChoixAsk`) | R9, R11 |

Non concernés, vérifié : les orbes de la connexion et de `/rapport` sont **immobiles** (le bruit de
pixels relevé par les empreintes vient du rendu de leur flou, pas d'une animation) ; `BoutonAction`,
`QuartierSynthesis`, `EchelleNavigator`, `.detailsFluide`, le héros de l'accueil et `RouteLoadingBar`
pour ses autres états sont gardés.

**Durées écrites en dur**, conformes aux plages de FUT-75 mais hors jetons : transitions de 160 ms
(`releve.module.css`, liens, boutons, coupe, signe des groupes), 180 ms (`EchelleNavigator`), séquence de
l'accueil (420 ms pour la grille, 320 ms pour la planche, retards de 280 à 640 ms, niveau structure), coche
de confirmation de 260 ms (`BoutonAction`, décision FUT-75 sans jeton). Aucune ne contredit les principes ;
leur rattachement aux jetons (ou l'ajout d'un jeton de structure à `motion.ts`) relève du lot R1.

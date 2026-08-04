# futur·e — revue de l'identité visuelle v1.2

**Date :** 3 août 2026
**Objet :** logo, charte graphique et charte éditoriale futur·e, pack `futur-e-charte-v1-2-complete.zip` + PDF v1.2
**Contenu :** deux revues indépendantes — une revue générale (Claude) puis une critique Impeccable en deux passes (visuelle, puis vérification déterministe sur les fichiers).

---

# Partie 1 — Revue générale

## Verdict court

La charte **éditoriale** est excellente — c'est la meilleure pièce du lot, et elle est plus mûre que la charte visuelle. Le système **visuel** est propre et cohérent, mais encore un cran en dessous de ce que la doctrine promet. Il y a un problème technique sérieux sur le master du logo, et deux ou trois choix qui trahissent exactement ce qu'on voulait éviter (signatures de design généré).

## Ce qui tient vraiment

**La charte éditoriale — `05-edito/charte-editoriale.md`.** Niveau d'une vraie marque. Les huit règles, la structure Fait / Portée / Limite / Suite, et surtout le vocabulaire à éviter (« sans risque », « compense », « diagnostic ») : c'est le moat, écrit noir sur blanc. Aucun des six concurrents n'a ce document.

**Le carton social 02** — « Ce que l'image ne peut pas conclure » (`04-exemples/reseaux/exemple-serie-sociale.png`). La meilleure page produite : la seule où le visuel *fait* le discours au lieu de l'illustrer.

**La bande coupée** — `03-elements-graphiques/svg/futur-e-bande-coupe.svg`, et le drapeau noir en biseau utilisé pour « Ce que cette lecture ne dit pas » dans la page de rapport. C'est l'invention la plus forte de tout le système.

**La discipline des contrastes** — `02-couleurs-et-tokens/contrastes.md` documente que `#FB923C` tombe à 2,13:1 sur papier et invente `--fe-orange-ink` (`#B9500E`) pour le texte. Peu de chartes font ça.

## Ce qui ne tient pas

### 1. Le master du logo n'est pas un dessin vectoriel, c'est un décalquage
`01-logo/svg/futur-e-logo-principal.svg` — 580 segments droits, **zéro courbe de Bézier**. Chaque panse du `u`, du `e`, et le point rond lui-même, sont des polygones. Visuellement ça passe (aucune facette perceptible à 4× sur le rendu 2048px), mais :
- plus aucune retouche possible : pas de correction optique, pas d'ajustement de graisse, pas de condensé ;
- tout prestataire physique (gravure, broderie, découpe, sérigraphie) devra re-décalquer ;
- 10 Ko pour un mot de six lettres, contre ~1,5 Ko pour un dessin propre.

**Correction :** faire redessiner le mot en courbes propres, en prenant ce tracé comme référence de silhouette.

### 2. L'orange est le orange par défaut de Tailwind
`#FB923C` = `orange-400`, au caractère près. C'est la couleur d'accent la plus répandue dans les interfaces générées par IA — donc une signature exactement du type qu'on traquait dans le produit. Un décalage volontaire vers un orange plus terre / plus brûlé (ordre de `#E8823A`) supprime le tell pour un coût nul.

### 3. Le signe compact `r•` est la pièce faible
À 32 px c'est un pâté noir avec un point ; à 16 px c'est illisible. Un `r` isolé ne renvoie à rien — ni à « futur·e », ni à la coupe. Or le signe va vivre en favicon d'onglet, en avatar LinkedIn et en icône de PDF joint. Le point seul, ou une forme dérivée du **biseau**, tiendrait mieux à petite taille et porterait le sens.

### 4. Le geste est sur-narré par rapport à ce qu'on voit
`05-edito/justification-du-logo.md` charge la coupe du `r` de tout le sens de la marque (« interrompre le récit continu »). En pratique elle est invisible sous 200 px, et au-dessus elle se lit d'abord comme un défaut de tracé. Le sens repose donc sur le point orange, qui lui est immédiat. **Arbitrage à faire :** soit assumer la coupe et l'amplifier (plus franche, plus haute, reprise comme motif partout), soit cesser de lui faire porter la doctrine.

### 5. La cardification revient par la porte de la charte
`--fe-radius-card: 18px` / `--fe-radius-panel: 26px`, et la page de rapport est une pile de quatre rectangles arrondis. C'est le réflexe SaaS qu'on voulait purger. Un dossier de décision ressemble à un document — filets, colonnes, hiérarchie typographique — pas à un dashboard. Le bloc « Échelle et preuve » (Grain / Relation / Source / Limite) prouve d'ailleurs qu'on sait faire, et lui n'avait pas besoin d'une carte.

### 6. Le bloc orange plein « À vérifier sur place » casse la grammaire de l'orange
L'orange est défini comme « l'endroit où porter l'attention ». Si un bloc entier est orange, c'est lui le plus fort de la page : « ce qu'on ne sait pas » crie plus fort que le constat. En prime, noir sur `#FB923C` n'est documenté nulle part dans `contrastes.md`. À réserver au point, aux filets et aux petits signes — comme le dit déjà la note en bas de `futur-e-tokens.css`.

### 7. Bugs d'export dans les visuels de démonstration
Sur `04-exemples/site/exemple-site-hero-photographie.png`, la légende se rend « UNE PHOTO N'ES TPAS UNE PREUVE » (artefact `letter-spacing` sur l'apostrophe). Sur la page de rapport, des espaces manquent aussi par endroits. Ce sont les visuels de démonstration de la charte : ils doivent être irréprochables.

## La chose à changer en premier

La mission, c'est l'asymétrie d'information, et le vrai moat c'est de **pouvoir dire « non concluant »**. Or dans cette identité, l'orange (« regarde ici ») est partout, et le signe du non-concluant — le biseau, la coupe — n'apparaît qu'une fois, en petit, en noir, dans un coin de page de rapport.

C'est inversé. **La coupe devrait être l'élément de marque le plus visible du système**, pas le point. Le point orange, tout le monde peut l'avoir ; l'aveu de la limite, non.

Concrètement : faire du biseau un motif système (fin de bande, coin de bloc, marqueur de « limite connue », transition de section) et le décliner en signe compact.

---

# Partie 2 — Critique Impeccable

*Ci-dessous, le rapport Impeccable intégral : évaluation A (critique visuelle avec scoring heuristique), puis addendum B (vérification déterministe sur les fichiers).*

---

Le sous-agent de vérification tourne encore ; j'ai mené mes propres mesures en parallèle (contrastes recalculés, extraction des hex des exemples, rendu du logo aux tailles minimales annoncées, diff référence/master). Voici la critique.

---

**Méthode** : `critique` d'Impeccable adapté à une identité de marque. Évaluation A (revue de direction artistique) menée ici ; évaluation B (vérification déterministe : géométrie SVG, parité tokens, polices, métadonnées) déléguée à un sous-agent isolé, **encore en cours** — les mesures ci-dessous sont les miennes (ImageMagick, calcul WCAG, rendus aux tailles réelles). Aucun fichier modifié.

# Verdict

**L'identité est propre, honnête et bien documentée, mais elle n'est pas encore le système visuel de futur·e : elle dépense son seul signe distinctif (le point orange) comme puce décorative sur presque chaque bloc, elle ne dessine aucun des six registres de décision qui sont le produit, et elle contredit frontalement `DESIGN.md v2.0` sur le sens de l'orange dans le rapport.**

## Score adapté (identité de marque, 10 critères)

| # | Critère | Note | Constat décisif |
|---|---|---|---|
| 1 | Lisibilité du signe aux petites tailles | 2 | À 20 px (minimum annoncé), la coupe du `r` a disparu ; il ne reste qu'un mot géométrique ordinaire |
| 2 | Tenue du signe compact | 1 | À 16 px, `r•` = ink en haut à gauche, vide en bas à droite ; illisible comme marque |
| 3 | Distinctivité / non-interchangeabilité | 2 | Grotesque géométrique + point orange : transposable tel quel à une assurance, une fintech, une proptech |
| 4 | Système de couleur et contrastes réels | 2 | 3 tokens sémantiques orphelins, jamais testés, jamais utilisés ; 2e fond papier jamais testé |
| 5 | Typographie | 3 | Archivo, 4 graisses, échelle nette, OFL. Mais px seulement, pas de WOFF2, conflit mono non tranché |
| 6 | Cohérence doctrine ↔ applications | 1 | La charte enfreint ses propres règles p. 9 dès la page 15 |
| 7 | Couverture du système | 2 | Zéro spécimen de donnée, de trajectoire, d'incertitude, d'absence. Zéro icône livrée |
| 8 | Robustesse technique des fichiers | 3 | Vrais tracés, pas de dépendance police. Mais `.css` et `.json` ne sont pas le même système |
| 9 | Absence de signatures « design généré » | 1 | Orbe flou, cartes triplées identiques, barres de remplissage grises livrées telles quelles |
| 10 | Service de la mission produit | 2 | La charte **éditoriale** sert la mission remarquablement ; la charte **visuelle** ne la traduit pas |
| **Total** | | **19/40** | Bande **Poor** — refonte du système, pas du dessin |

Précision importante : le `05-edito/` seul vaudrait 8 ou 9 sur 10. C'est le langage visuel qui tire le total vers le bas.

# Ce qui tient

**Le master vectoriel est une trace fidèle, et c'est mesurable.** Diff pixel entre `07-validation/reference-candidat-original` et le master : RMSE 9,7 %, et la différence est confinée à un contour de 1 px. Aucun déplacement de lettre, aucune variation d'approche, hauteur d'encre 283 vs 282 px. Le README de `07-validation/` dit vrai. C'est rare et ça mérite d'être dit.

**La discipline de contraste sur papier est réelle et appliquée.** `#FB923C` sur papier = 2,13:1, la charte le sait, l'écrit (`02-couleurs-et-tokens/contrastes.md` l.12) et livre `#B9500E` à 4,69:1 — et les exemples l'utilisent effectivement : dans `04-exemples/rapport/exemple-couverture-rapport.svg` et `exemple-page-rapport.svg`, les surtitres sont bien en `#B9500E`, pas en orange vif. La règle n'est pas décorative, elle est tenue.

**La charte éditoriale est le meilleur document du lot.** Les huit règles, la structure canonique du constat (Fait / Portée / Limite / Suite), le vocabulaire à préférer et à éviter, et surtout la mention du statut des images générées : c'est exactement la doctrine d'asymétrie d'information, écrite sans jargon et opérationnalisable. Le bloc « Ce que cette lecture ne dit pas » de `exemple-page-rapport.png` est le seul endroit du pack où l'identité **est** la mission.

# Ce qui ne tient pas

### P0 — Le point orange est devenu une puce

C'est le problème central, et il annule le logo.

Le point est **la seule chose distinctive du signe** — c'est ce que dit `05-edito/justification-du-logo.md` (« il désigne l'endroit où porter l'attention ») et ce que répète la charte p. 9 (« repère de lecture, ancrage ou ponctuation »). Puis la charte le pose en puce identique :

- p. 15 : 3 cartes, 3 points orange identiques
- p. 17 : 3 cartes, 3 points identiques
- p. 21 : 4 cartes « Calme / Précis / Direct / Transparent », 4 points identiques
- p. 22 : 4 pastilles numérotées orange
- p. 25 : 7 cartes de sommaire, 7 points identiques
- `04-exemples/site/exemple-site-hero.svg` : trois `<circle r="7" fill="#FB923C">` sur trois `<rect width="405" height="154">` strictement identiques

`DESIGN.md § 5.3` énonce le test qui tranche : *« si toutes les occurrences visibles portent la même teinte, aucune ne doit la porter »*, et `§ 6.3` : *« un badge dont la valeur est constante sur tous les éléments d'une liste est supprimé »*. La charte échoue à son propre test sur au moins six pages, dont sa page de garde de sommaire.

Conséquence concrète : quand le lecteur voit un point orange dans le rapport, il ne sait pas si ça veut dire quelque chose. Le signe de marque et le signe de lecture sont le même objet, et l'un a mangé l'autre.

**Correction** : le point orange n'apparaît que dans le logo et à un seul endroit par écran, jamais en tête de liste. Les listes prennent un filet, un chiffre ou rien. Règle testable à écrire dans la charte : *deux points orange visibles simultanément hors logo = défaut*.

### P0 — L'orange du rapport contredit `DESIGN.md`, et c'est une contradiction doctrinale, pas un accident

Charte p. 18 : *« ORANGE UTILE — l'accent sert la prochaine action ; il n'est pas un code de gravité »*, et l'exemple applique : `04-exemples/rapport/exemple-page-rapport.svg` peint le bloc « À VÉRIFIER SUR PLACE » en `<rect width="362" height="360" fill="#FB923C">` — la plus grande surface colorée de tout le pack.

`DESIGN.md § 5.4` grave l'inverse : dans le rapport, **orange = compromis** (« ce qui départage »), et **« contrôle à mener » = `--info` (bleu)**. `§ 5.6` ajoute : *« l'accent de marque ne colore plus les éléments de navigation ordinaires du rapport »*. Les deux documents ont un jour d'écart et assignent la même couleur à deux registres différents, sur la même surface.

**Correction avant v1.3** : trancher explicitement, dans un seul document, et amender l'autre. Si la charte gagne, `DESIGN.md § 5.4` doit être réécrit et le registre « compromis » relogé. Si `DESIGN.md` gagne, le bloc « à vérifier sur place » passe en bleu et la p. 18 est refaite. Laisser les deux en l'état garantit que le code et le print divergeront.

### P0 — Les six registres de décision n'existent pas dans l'identité

La palette de la charte (p. 7) contient six pastilles : nuit, ivoire, papier, point, orange encre, texte secondaire. **Aucune couleur sémantique.** Le produit, lui, repose sur six registres gravés : incompatibilité, alignement, compromis, écart, non su, contrôle à mener.

Trois teintes sémantiques existent dans les tokens — `--fe-danger #D85B62`, `--fe-water #4B82C3`, `--fe-positive #3F8D63` — et j'ai vérifié : **elles n'apparaissent nulle part ailleurs dans le pack** (`grep` sur les 90 fichiers : uniquement dans `futur-e-tokens.css` et `.json`). Ni dans un exemple, ni dans `contrastes.md`, ni dans le PDF. Elles sont non testées :

| Token | sur papier `#FAF8F3` | sur papier alt `#F2EDE4` | sur nuit |
|---|---|---|---|
| `--fe-danger` | **3,54:1** | **3,22:1** | 5,32:1 |
| `--fe-water` | **3,75:1** | **3,41:1** | 5,02:1 |
| `--fe-positive` | **3,80:1** | **3,46:1** | 4,95:1 |

Les trois échouent AA en thème clair, exactement le défaut que `DESIGN.md § 5.6` décrit et corrige avec les familles `--x-ink` / `--x`.

Pire que le contraste : elles sont nommées sur le mauvais axe. « danger » et « positive » forment une paire bien/mal — c'est-à-dire un verdict, que `PRODUCT.md` interdit explicitement (« jamais de verdict ni de score synthétique »). « water » ré-identifie un **thème** par la couleur, ce que `DESIGN.md § 6.2` interdit tout aussi explicitement.

Et il manque les trois registres qui portent la mission : **écart**, **non su**, **contrôle à mener**. Le registre « non su » — le moat, le pouvoir de dire « non concluant » — n'a **aucune couleur dans la charte de marque**.

**Correction** : supprimer `danger` / `water` / `positive`. Livrer six registres nommés comme dans le dossier, chacun en deux familles (encre ≥ 4,5:1 pour le texte, surface ≥ 3:1 pour fond et filet), testés sur les quatre fonds livrés — pas deux.

### P1 — La charte ne dessine aucune donnée, exactement le défaut que `DESIGN.md § 6.5` diagnostique

`DESIGN.md § 6.5` est catégorique : *« Le rapport ne dessine presque rien. Un seul composant y transforme une donnée en forme. Tout le reste est du texte dans des cartes. L'œil n'a rien à saisir, et c'est ce que le lecteur ressent comme de la froideur. »*

`04-exemples/rapport/exemple-page-rapport.png` est **du texte dans quatre cartes empilées**. Le pack ne contient, dans les 25 pages du PDF et les 12 exemples :

- aucun spécimen de valeur mesurée / projetée / absente (`DESIGN.md § 3.1`) ;
- aucune trajectoire à deux points avec l'écart nommé (`§ 3.3`) ;
- aucune fourchette d'incertitude, aucune zone d'inconnu dessinée (`§ 3.4`) ;
- aucun exemple d'alignement au chiffre, aucun tableau de valeurs (`§ 3.2`) ;
- aucune échelle situant une commune dans une distribution (`§ 3.5`) ;
- **aucune icône** livrée, alors que la p. 11 énonce une règle d'iconographie (traits 1,5 à 2 px) et montre trois glyphes abstraits.

Une charte de marque pour un produit qui vend de la lecture de données et qui ne spécifie pas comment une donnée se dessine ne peut pas gouverner le produit. C'est le plus gros manque en volume.

### P1 — La ligne à point mobile simule ce que la charte lui interdit de simuler

Charte p. 9 : *« La ligne relie un titre à une zone ou marque une transition. **Elle ne simule pas une courbe de données.** »* Puis, dans les livrables, le point se déplace le long de la ligne sans règle :

| Fichier | Position du point sur la ligne |
|---|---|
| `exemple-couverture-document.svg` | 100 % (bout de ligne, `cx=1156` / `x2=1156`) |
| `exemple-couverture-rapport.svg` | 100 % (`cx=596` / `x2=596`) |
| `exemple-carte-sociale.svg` | **84 %** (`cx=930`, ligne 72→1090) |
| `exemple-serie-sociale`, carte 3 | ≈ 74 % |
| PDF p. 9, p. 13, p. 15 | ≈ 74 %, ≈ 82 %, ≈ 78 % |

Un point positionné librement sur un axe horizontal, c'est la grammaire universelle d'un curseur, d'une jauge ou d'une position sur une échelle. Dans un produit dont `DESIGN.md § 3.6` pose que *« le signal passe par la position et la longueur avant de passer par la couleur »*, c'est l'objet le plus confusant possible : la décoration parle exactement le langage de la mesure.

**Correction, et c'est une opportunité, pas seulement un défaut** : soit le point est fixé en bout de ligne partout (décor assumé, aucune ambiguïté), soit — bien meilleur — sa position **signifie l'échelle de lecture** : commune / autour / logement. La ligne devient alors l'élément d'identité qui porte la promesse « de la commune à l'adresse », et le seul motif abstrait du pack se met à travailler.

### P1 — Signatures de génération automatique dans le livrable

- **L'orbe flou.** `04-exemples/site/exemple-site-hero.svg` contient `<circle cx="1180" cy="170" r="170" fill="#FB923C" opacity=".08" filter="url(#soft)"/>`. `DESIGN.md § 5.1` a supprimé les orbes flous par arbitrage daté du 30/07/2026, avec cette justification : *« trois orbes dupliqués à l'identique sur vingt-cinq pages cessent d'être une signature et deviennent un fond d'usine »*. L'exemple vitrine de la charte le réintroduit trois jours plus tard.
- **Trois cartes de verre identiques.** Même fichier : trois `<rect fill="#FFFFFF" opacity=".04" stroke="#FFFFFF" stroke-opacity=".09">` de 405×154, alignées, à contenu de même poids. `DESIGN.md § 2.2` : *« une page où chaque bloc est une carte de verre n'a plus de hiérarchie, elle a une texture »*.
- **Des barres de remplissage livrées telles quelles.** `03-elements-graphiques/illustrations/*/futur-e-illustration-trois-echelles` contient des traits gris courts sous chaque bâtiment et trois trapèzes gris en bas : du faux texte et de la fausse ombre. C'est du placeholder expédié en v1.2.
- **Une illustration « trois échelles » qui ne montre pas d'échelle.** La maison fait la même taille que la ville. Le sujet du dessin est le rapport d'échelle, et c'est précisément ce qu'il ne représente pas.
- **Le PDF est produit par ReportLab** (métadonnée `Producer`), et ça se voit : p. 8, la légende « Archivo Regular - corps, descriptions, textes longs » est recouverte par le bord supérieur de la carte qui suit. `exemple-couverture-document.png` porte une baseline orpheline (« Une lecture sourcée, de la commune à l'adresse. ») posée sous le pied de page, hors de toute grille.

### P1 — La coupe du `r` disparaît à la taille minimale que la charte autorise

J'ai rendu `01-logo/svg/futur-e-logo-principal.svg` à la hauteur minimale annoncée p. 5 et dans `futur-e-tokens.json` (`minimumHeightDigital: 20`). À 20 px : le mot est lisible, mais **la coupe du `r` est totalement invisible** et le point tombe à ≈ 2,6 px. Or la coupe est présentée comme *le geste* de la marque. À la taille où le logo vivra le plus souvent (header, e-mail, pied de page), il ne reste qu'un « futur.e » en grotesque géométrique.

Le signe compact à 16 px (minimum annoncé) est pire : l'encre occupe le quadrant supérieur gauche, le point flotte à droite, le quadrant inférieur droit est vide. En onglet de navigateur, ça lit comme une icône mal centrée.

**Correction** : soit relever le minimum numérique à ~28 px et le documenter honnêtement, soit livrer une **version optique petite taille** (coupe accentuée, point rapproché et légèrement grossi, approche resserrée) — c'est le travail normal d'une identité, et il manque. Pour le signe compact : recentrer optiquement l'ensemble `r•` dans le carré et livrer un master 16/32 px calé sur la grille pixel, pas un downscale.

### P2 — Les deux fichiers de tokens ne sont pas le même système

`README.md` désigne `02-couleurs-et-tokens/futur-e-tokens.css` comme le fichier d'« intégration produit ». Or :

- le `.json` contient toute l'échelle typographique (display 64 / h1 48 / … / label 12) et les interlignes ; **le `.css` n'expose aucun token de typographie** ;
- le `.json` contient `radius.pill: 999` ; le `.css` ne l'a pas ;
- tout est en **px**, aucun rem : la préférence de taille de police du lecteur est ignorée, ce qui est un défaut d'accessibilité de fond pour un produit de lecture longue ;
- aucun token de filet (`--border-1` de `DESIGN.md`), aucun token d'anneau de focus, **aucun `--fg-absent`** — l'état qui porte la mission ;
- `--fe-ink #1A1D28` n'est utilisé nulle part et double `--fe-body #2B3040` ;
- `--fe-paper-2 #F2EDE4` et `--fe-navy-2 #0D1322` **ne figurent dans aucune ligne de `contrastes.md`**, alors que le second papier porte le bloc « Ce que cette lecture ne dit pas ». Sur ce fond, `--fe-orange-ink` tombe à **4,27:1** : le surtitre soigneusement choisi pour tenir 4,69 sur papier échoue sur l'autre papier.
- `--fe-muted #5B6373` sur nuit = **3,31:1** : rien dans le pack ne dit quel token de texte va avec quel fond.

### P2 — Le conflit mono / tabulaire n'est pas tranché, il est seulement contredit

`05-edito/charte-editoriale.md` l. 73 et PDF p. 8 : *« Les données alignées utilisent les chiffres tabulaires d'Archivo, pas une police monospace secondaire. »*
`DESIGN.md § 3.2` : *« Toute valeur numérique est en `--font-mono` avec `font-variant-numeric: tabular-nums`. »*

C'est un arbitrage défendable — Archivo a bien des chiffres tabulaires, et `craft-floor` proscrit justement le monospace « en costume de technique ». Mais il porte sur la règle la plus fréquemment appliquée du produit (toute valeur affichée), et personne ne l'a arbitré : un document dit l'un, l'autre dit l'autre, et `futur-e-tokens.css` ne livre ni famille mono, ni classe autre que `.fe-data`. Même remarque pour la police du logo : `DESIGN.md v2.0` annonce *« le logo garde Instrument Serif sur `--font-brand` »*, alors que le logo livré est un tracé vectoriel de grotesque géométrique. Instrument Serif n'est ni livrée, ni utilisée.

### P2 — Photographies générées livrées dans le pack de marque

`03-elements-graphiques/photographie/` contient trois images générées, et le README comme le PDF p. 12 le disent franchement, ce qui est à porter au crédit de la charte. Le problème est structurel, pas moral : elles sont rangées dans un dossier nommé « direction photographique », employées comme visuel principal de deux exemples vitrines (`exemple-site-hero-photographie`, `exemple-serie-sociale`), et `DESIGN.md § 6.5` règle 1 interdit la photographie d'illustration générique parce qu'elle *« ment quand la commune lue n'est pas concernée »*. Un fichier voyage sans son README.

Défaut lié : dans `exemple-site-hero-photographie.png`, la navigation blanche est posée **sur la photographie non protégée**, en partie sur une façade au soleil. Le pack ne donne aucune règle de texte sur image : pas de voile, pas de contraste plancher, pas de zone sûre.

**Correction** : remplacer par des photographies réelles, datées, localisées, ou supprimer le dossier et écrire la règle sans l'illustrer. Ajouter une règle explicite « texte sur image » avec un voile chiffré.

### P3 — Ce qui est promis mais absent

`README.md` et PDF p. 25 annoncent un pack « prêt à l'emploi ». Manquent : les WOFF2 (seuls des TTF sont livrés, inutilisables tels quels sur le web sans conversion), les icônes, tout spécimen de composant produit (bouton, champ, badge, filet de carte), les règles de grille chiffrées (le PDF p. 10 dit « 12 colonnes web, marges généreuses » là où `DESIGN.md § 2.1` donne 640 / 680 / 920 / 1100 px — la charte en dit **moins** que la doctrine existante), et les règles typographiques françaises (espaces insécables, `31 %`, `2,7 °C` mentionnés dans l'édito mais sans règle d'implémentation).

# Les corrections à faire avant de figer la v1.3

Par ordre, et seules les cinq premières sont bloquantes.

1. **Trancher l'orange du rapport** dans un seul document et amender l'autre (`DESIGN.md § 5.4` ou charte p. 18). Rien d'autre ne peut être figé avant.
2. **Écrire la règle de rareté du point** : le point orange n'existe que dans le logo et à un seul endroit par écran. Refaire les p. 15, 17, 20, 21, 22, 25 du PDF et les trois cartes de `exemple-site-hero.svg` en conséquence.
3. **Remplacer les trois tokens sémantiques par les six registres**, en deux familles (encre 4,5:1 / surface 3:1), testés sur les quatre fonds livrés, avec `--fg-absent` en plus. Étendre `contrastes.md` de 9 à ~48 paires, et ajouter une table « quel texte sur quel fond ».
4. **Livrer une page « états d'une valeur »** : mesurée, projetée, absente, non applicable, avec un vrai spécimen de chacune, plus une trajectoire à deux points et une fourchette d'incertitude. Sans ça, la charte ne gouverne pas le produit qu'elle habille.
5. **Supprimer l'orbe flou** de `exemple-site-hero.svg`, ramener le hero à une seule surface dominante, et sortir les barres de remplissage grises de `futur-e-illustration-trois-echelles`.
6. Décider ce que fait le point sur la ligne : bout de ligne partout, ou position = échelle de lecture. La seconde option est celle qui donne une identité à cette marque.
7. Livrer une version optique petite taille du mot-symbole et un master pixel du signe compact, ou relever les minimums annoncés.
8. Aligner `.css` et `.json`, passer en rem, ajouter filet et focus, livrer les WOFF2.
9. Trancher mono vs tabulaire, et corriger `DESIGN.md` sur Instrument Serif.
10. Remplacer ou retirer les photographies générées ; ajouter la règle « texte sur image ».

# Questions qui décideraient la suite

- Le point orange peut-il **porter l'échelle de lecture** (commune / autour / adresse) au lieu de ponctuer ? C'est la seule voie que je vois pour que ce système cesse d'être joli et devienne le vôtre.
- La marque a-t-elle le droit d'être **plus austère que ça** ? Aujourd'hui la charte cherche de la chaleur (rayons 18 et 26 px, cartes partout, aplats orange). Un dossier d'instruction ne rassure pas par des coins ronds ; il rassure parce que chaque chiffre porte sa source et sa limite.
- À quoi ressemble le **« non concluant »** en une forme ? Tant qu'il n'a ni couleur, ni marque, ni spécimen, le moat du produit est invisible dans son identité.

Je relaie les constats du sous-agent (géométrie SVG, embarquement des polices dans les PDF, métadonnées) dès qu'il rend la main.

result: Critique Impeccable de l'identité futur·e v1.2 rendue — verdict 19/40 : dessin propre et charte éditoriale excellente, mais le point orange est dépensé en puce sur 6+ pages, les six registres de décision n'ont aucune couleur (3 tokens orphelins non testés, jamais utilisés), l'orange du rapport contredit DESIGN.md §5.4, aucun spécimen de donnée n'est livré, et la coupe du `r` disparaît à la taille minimale annoncée ; 10 corrections listées, dont 5 bloquantes avant v1.3.

---

Le sous-agent de vérification déterministe a rendu. Ses mesures confirment l'essentiel de ma critique, en corrigent une nuance, et ajoutent six défauts durs que la revue visuelle ne pouvait pas voir.

# Addendum — évaluation B (preuve déterministe)

## Ce qui confirme

- **Les 9 ratios de `contrastes.md` sont exacts au centième.** Écart maximal 0,00. L'arithmétique WCAG du pack est irréprochable — c'est le seul volet qui passe sans réserve.
- **Les trois teintes sémantiques échouent sur les trois fonds clairs** : `danger` 3,54 / 3,22 / 3,42 · `water` 3,75 / 3,41 / 3,62 · `positive` 3,80 / 3,46 / 3,67. Et **0 occurrence** de chacune dans tous les SVG du livrable.
- **Le signe compact est byte-identique au sous-chemin n°3 du mot-symbole.** Même bbox, path orange strictement identique. Ce n'est pas une marque conçue, c'est un viewBox posé autour de la 5ᵉ lettre — aucun recentrage optique, ce qui explique le déséquilibre que j'ai constaté au rendu 16 px.
- **Les 23 règles du JSON absentes du CSS**, dont les trois tailles minimales du logo.
- **Le livrable entier est né en 14 secondes** : 94 fichiers sur 95 horodatés entre `2026-08-03 20:14:00` et `20:14:14`, par script ReportLab/Python. Le 95ᵉ est la licence OFL, datée **1985**.

## Ce qui corrige ma critique

J'ai porté au crédit du pack que le master est une trace fidèle de la référence approuvée. **C'est vrai, et c'est incomplet.** Le master n'est pas un dessin vectoriel : c'est un **autotrace de bitmap plafonné à 968 × 240 px**.

- **0 courbe de Bézier** sur 534 commandes : `{M: 7, L: 520, Z: 7}`. Un « e », un « u » et un point rond faits de 520 segments droits.
- **527 sommets sur 527 ont au moins une coordonnée entière exacte** — signature d'un contour marching-squares sur bitmap.
- `07-validation/reference-candidat-original.png` fait **exactement 968 × 240 px**, la taille du viewBox : 1 unité SVG = 1 pixel source.

Le tracé est de bonne qualité (bruit de contour ≤ 0,08 u, dispersion des fûts 5 %), donc rien ne cassera en production. Mais la géométrie n'est pas éditable, il n'y a aucune marge de retouche optique, et **ni le README ni le PDF ne disent que la définition du master est plafonnée**. `NOTES-ET-LICENCES.md` le laisse deviner (« reconstruit en tracés vectoriels depuis la silhouette ») sans l'assumer.

Corollaire immédiat : la « version optique petite taille » que je demandais en P1 n'est pas une amélioration facultative, **c'est la seule façon de retoucher ce logo**. On ne peut pas ajuster la coupe du `r` sur 520 segments droits ; il faut redessiner en courbes.

## Six défauts durs que je n'avais pas vus

### P0 — Les six PDF d'exemples sont composés en Helvetica, sans police embarquée

| | Producteur | Fontes | FontFile |
|---|---|---|---|
| 6 PDF de `04-exemples/` | ReportLab, `/Creator (anonymous)` | **Helvetica seule** | **0** |
| PDF maître 25 pages | ReportLab | Archivo ×4 + Helvetica | 4 |

Les documents censés démontrer la typographie de la marque se substitueront en Arial ou Nimbus Sans chez le destinataire. Le même exemple existe en trois formats avec **deux typographies différentes** : `exemple-couverture-document.svg` (Archivo embarquée) vs `.pdf` (Helvetica non embarquée) vs `.png`. Envoyé tel quel à un prestataire, le PDF ment sur l'identité.

### P0 — Le point « circulaire » n'est pas un cercle

`05-edito/justification-du-logo.md` exige « le point **circulaire**, sans halo ni dégradé ». Mesuré : **49,80 × 50,57 u**, soit **1,52 % d'ovalisation** et **3,22 % de non-circularité** (rayon 24,63 à 25,42). Le fichier livré ne remplit pas la première moitié de sa propre règle, alors que la correction tient en une ligne : `<circle cx="1162.54" cy="461.05" r="25.17"/>`.

### P1 — Le thème sombre n'a aucun token de texte primaire

Sur `--fe-navy`, **trois des quatre tokens « text » échouent** : `ink` 1,19 · `body` 1,52 · `muted` 3,31. Seul `mutedDark` passe (7,89), et c'est un token de texte *secondaire*. Pour écrire du corps de texte sur le fond principal du produit, il faut aller chercher `color.brand.ivory` (classé « brand ») ou **`#E9ECF2`, qui est documenté dans `contrastes.md` ligne 2 et n'existe dans aucun des deux fichiers de tokens**. Deux autres couleurs de texte non tokenisées circulent dans les exemples : `#C6CFDB` (9 occurrences) et `#FFFFFF` (8 occurrences).

Et **aucune paire de surfaces n'atteint 3:1** : `paper`/`paper-2` = 1,099 · `navy`/`navy-2` = 1,078 · `paper`/`ivory` = 1,036. Les bordures livrées à `stroke-opacity=".09"` donnent **1,20:1**, les filets à `.12` donnent **1,32:1**. Une carte élevée n'est pas perceptible de son fond, en aucune circonstance.

### P1 — Les polices s'installeront comme trois familles séparées

- Medium se déclare `family="Archivo Medium" / subfamily="Regular"`, Semibold `family="Archivo SemiBold" / subfamily="Regular"`, et **`typoFamily` (nameID 16) et `typoSubfamily` (17) sont absents des quatre fichiers**. Dans Figma, Word ou InDesign : « Archivo », « Archivo Medium », « Archivo SemiBold » comme familles distinctes. Le `weights: {400, 500, 600, 700}` promis par le JSON ne fonctionnera pas.
- **Sous-ensembles non déclarés** : 230 codepoints. Le français essentiel passe, `U+2022 •` compris. **Manquent `≤` et `≥`** dans les quatre graisses — pour un produit qui affiche des seuils climatiques, c'est nommable.
- **Aucun WOFF2, WOFF, OTF ni variable.** 4 TTF de 40 ko là où un WOFF2 en ferait 15.
- La licence OFL livrée cite en en-tête `Archivo-Italic[wdth,wght].ttf` — une variable italique qui n'est pas dans le pack.
- Bonne nouvelle vérifiée : **la feature `tnum` est bien présente dans les quatre fichiers**. La règle « chiffres tabulaires d'Archivo » est techniquement tenable. Mais elle n'est démontrée nulle part : les SVG déclarent `.tab{font-variant-numeric:tabular-nums}` et **les 65 attributs `class` du livrable valent tous `"archivo"`**. `.tab` et `.fe-data` sont déclarées et jamais appliquées.

### P1 — Instrument Serif : zéro occurrence dans toute la charte

`grep -ril 'instrument'` sur les 95 fichiers → **aucun résultat**. Le seul « serif » du pack est le fallback `sans-serif` de `futur-e-tokens.css:17`. `DESIGN.md v2.0` affirme que le logo utilise Instrument Serif ; le logo n'utilise aucune police, c'est un autotrace de bitmap. Ce n'est pas un fichier oublié, **les deux documents décrivent deux logos différents**, et il faut arbitrer.

### P2 — Les favicons ne tiennent pas comme série

- **`futur-e-icon-180.png` a un fond clair `#FAF8F3`** ; les cinq autres ont un fond sombre `#060812`. L'icône Apple touch est inversée, sans que ce soit documenté.
- **`futur-e-icon-16.png` est ~1,4× plus gros** que le reste de la série : le signe occupe 68,8 % de la largeur, contre 50 ± 1 % partout ailleurs. Le passage 16 → 32 px produira un saut d'échelle visible dans l'onglet.
- **Tous les favicons sont 100 % opaques** (alpha min = 255), alors que `README.md` annonce « PNG transparents » et recommande `futur-e-icon-512.png` comme « favicon **ou avatar** » : un avatar avec un fond nuit cuit dedans.
- `favicon.ico` ne contient que **2 images** (16 et 32) ; le 48 px livré à côté n'y est pas.
- À 16 px, le point orange ne fait plus que **9 pixels** (bbox 3 × 3) : il ne lit plus comme un point rond mais comme un carré. Le `r` reste identifiable.

### P3 — 108 ko de police morte dans des fichiers sans texte

Les 7 SVG de `03-elements-graphiques/` embarquent chacun **108 564 octets d'Archivo en base64 alors qu'ils ne contiennent aucune balise `<text>`**. `futur-e-ligne-decision-clair.svg` pèse 109 338 octets dont 99 % de police inutile. Et `exemple-site-hero.svg` encapsule le logo en `<image href="data:image/svg+xml;base64,…">` — un SVG dans un SVG, sans `currentColor`, en double base64.

Aussi : **aucun des 56 PNG ne porte de chunk `sRGB` ni `gAMA`.** La gestion colorimétrique est indéfinie sur toute la chaîne image, ce qui explique les écarts de rendu de l'orange entre le PNG et le SVG que j'avais notés à l'œil.

# Score révisé

| Critère | Avant | Après | Raison |
|---|---|---|---|
| Typographie | 3 | **2** | Tables `name` cassées, sous-ensemble non déclaré, pas de WOFF2, `tnum` jamais appliquée |
| Robustesse technique | 3 | **2** | PDF en Helvetica, master plafonné à 968 px, favicons incohérents, pas de gestion colorimétrique |

**Total : 17/40** — bande *Poor*. Les huit autres notes sont inchangées.

# Ce que ça change dans le plan de correction

Les cinq blocages restent. Trois s'y ajoutent, et un se reclasse :

1. **Regénérer les six PDF d'exemples avec Archivo embarquée.** Un livrable de marque qui se compose en Helvetica chez le destinataire est inutilisable en l'état — c'est le défaut le plus embarrassant du pack en situation réelle.
2. **Redessiner le mot-symbole en courbes** (Bézier, sur la silhouette actuelle comme référence), puisque le master actuel n'est pas retouchable. C'est le préalable à la version optique petite taille et à la correction de la coupe.
3. **Corriger le point en cercle exact** et refaire les tables `name` d'Archivo (`typoFamily` / `typoSubfamily`), deux corrections de quelques minutes chacune.
4. Reprendre la série de favicons sur une composition unique, avec variantes transparentes, et compléter l'ICO.
5. Tokeniser `#E9ECF2`, `#C6CFDB`, et donner au thème sombre un token de texte primaire nommé comme tel.

Le fil commun des deux évaluations : **les défauts ne sont pas des erreurs de goût ni de mesure — ce sont des défauts de vérification finale.** Le pack a été produit d'un bloc en quatorze secondes et n'a jamais été rouvert fichier par fichier. Les ratios de contraste, qui ont été vérifiés, sont exacts au centième. Tout ce qui ne l'a pas été a dérivé.

result: Critique Impeccable complète de l'identité futur·e v1.2 (double évaluation, visuelle + déterministe) — score révisé 17/40 : le point orange est dépensé en puce sur 6+ pages, les six registres de décision n'ont aucune couleur, l'orange du rapport contredit DESIGN.md §5.4, les 6 PDF d'exemples sont composés en Helvetica sans police embarquée, le master logo est un autotrace bitmap plafonné à 968×240 px donc non retouchable, le point « circulaire » est ovale à 3,22 %, et Instrument Serif n'existe nulle part dans la charte ; 15 corrections listées, dont 8 bloquantes avant v1.3.

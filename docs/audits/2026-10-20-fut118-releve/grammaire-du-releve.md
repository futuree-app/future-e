# La grammaire du Relevé · spécification canonique (proposition)

FUT-118 phase A · 20 octobre 2026 · **proposition, non appliquée.** Ce document est la base
de `DESIGN.md` v3.0 (direction validée le 20/10 ; adoption après relecture). La correspondance avec
chaque section de la v2.1 (conservée, amendée, remplacée) est au § 9. Il ne crée pas une troisième direction : il écrit en règles ce que FUT-87 a
validé, ce que FUT-91, FUT-92, FUT-75 et FUT-50 ont déjà mis dans le code, et ce que les écrans témoins
de `/dev/fut118` ont montré qu'il manquait.

Références de code : `src/components/releve/primitives.tsx`, `releve.module.css`, `marge.ts`,
`lecture-dossier.ts` ; mouvement : `src/app/design-tokens.css` (`--m-*`), `src/lib/motion.ts`.

**Révision du 20/10, après la revue détaillée.** Chaque règle porte désormais son statut :

- **Stable** : règle de la grammaire, prescriptive, qui ne change qu'avec un amendement daté.
- **Hypothèse** : choix d'interface proposé ou illustré par un témoin, qui reste ouvert à
  l'exploration (en particulier pour le centre de décision, § 8). Une hypothèse se suit par défaut,
  et s'écarte en le disant et en le justifiant.

Les règles absolues de la première version (trois signes sur chaque écran, une seule plaque par
écran, aucune courbe) sont assouplies : la grammaire reste forte, elle n'interdit plus des
représentations utiles.

Par défaut : les § 0, 2, 3, 4, 5, 7 et 10, le § 8.1 et les composants existants du § 6 sont
**stables** ; les composants marqués
« manquant » au § 6 sont des **hypothèses** jusqu'à leur promotion (lot R1), qui leur donnera un statut
stable avec leurs tests ; le § 8.2 est une **hypothèse**.

---

## 0. Ce qui définit visuellement futur•e

Sept signes, et chacun vient du produit lui-même (un lieu à trois échelles, un temps de 1976 à 2100,
une décision). Ils forment le vocabulaire commun : un écran en emploie **ceux qui servent son
contenu** (une page de connexion n'a pas de marge de preuve), et c'est leur répétition à travers le
parcours qui fait reconnaître futur•e, pas leur présence obligatoire partout. *(Stable.)*

| # | Signe | Ce qu'il dit | Où il vit |
| --- | --- | --- | --- |
| 1 | **La marge de preuve** | chaque affirmation porte sa provenance à côté d'elle, pas en dessous | `Ligne` + `Marge` |
| 2 | **Les trois glyphes** cercle, carré, losange | à quelle échelle un fait a été établi | `GlypheGrain`, `EmblemeEchelles`, `CoupeEchelles` |
| 3 | **La plaque** et ses deux coins de coupe | ce que futur•e conclut ou ce que la personne achète ; la surface dominante d'un mouvement | `Plaque` |
| 4 | **Le trait de registre** de 3 px | la relation d'un fait au Projet ; la seule couleur de jugement | `Registre`, `TEINTE_REGISTRE` |
| 5 | **La règle du temps** | des dates et des horizons posés sur un axe linéaire ; jamais une continuité inventée | `RegleDuTemps` |
| 6 | **Archivo et son axe de largeur**, le mono pour ce qui s'aligne | un instrument de mesure, pas un magazine | rôles typographiques (§ 2) |
| 7 | **Le fond sombre, les filets, l'absence de verre** | un document technique, pas un tableau de bord | jetons `--r-*` |

Et une règle de voix qui est aussi une règle visuelle : **l'absence se dit** (un tiret et une phrase,
jamais un zéro, une case vide ou un silence).

## 1. Statut des sources

| Source | Statut après R0 |
| --- | --- |
| `src/components/releve/` | **canon** des primitives ; l'en-tête « prototype, dev uniquement » est retiré (l'accueil de production l'importe déjà) |
| `design-tokens.css` | **canon** des jetons ; les jetons `--r-*` et les rôles typographiques y montent (aujourd'hui confinés au module CSS) |
| `DESIGN.md` | **canon** du texte, en v3.0 ; § 6.2 (filet de carte), § 6.3 (pastille), § 9.1 (`.card-verdict`, `Chip`, surtitre mono capitales, `HorizonSwitch`) sont réécrits ici |
| `src/components/report/kit.tsx` | **déprécié** (`GlassCard`, `ReportSection`, ton par module). Il se déclare « SOURCE UNIQUE du langage visuel des modules » : l'en-tête est corrigé |
| `accueil.module.css` | **module** : garde sa mise en page, mais ses tailles passent par les rôles (§ 2) |

## 2. Typographie

Une famille d'interface, **Archivo** variable (axe `wdth` 62 à 125, déjà servi, 0 octet ajouté), et
**JetBrains Mono** seulement là où l'alignement compte. Pas de serif. **Le mono n'est jamais en capitales
espacées.** Aucune italique de couleur.

### 2.1 Les rôles (table unique)

Trois échelles coexistent aujourd'hui : les dix rôles `--text-*` de `DESIGN.md` (que le Relevé n'appelle
pas), les tailles du Relevé écrites en px dans le module, et une troisième échelle propre à l'accueil
(titre `wdth` 116 de 34 à 50 px, corps de 13 à 21 px). La table ci-dessous les fond : mêmes noms d'usage
que `DESIGN.md`, valeurs du Relevé, et l'accueil s'y range.

| Rôle (jeton) | Réglage | Usage | Remplace |
| --- | --- | --- | --- |
| `--text-display` | Archivo `wdth` 118, 500, `clamp(34px, 4.4vw, 58px)`, interligne 1,04, −0,02 em | le titre d'écran ou le verdict, **un par écran** | `.display`, `.titre` accueil (116), `--text-display` |
| `--text-verdict` | idem, `clamp(27px, 3.6vw, 46px)` | le verdict dans la plaque | `.verdict` |
| `--text-title` | `wdth` 108, 600, `clamp(23px, 2.5vw, 31px)` | titre de mouvement | `.titre`, `--text-title` |
| `--text-section` | 600, 17 px, interligne 1,35 | sujet d'un fait, nom d'une possibilité | `.sousTitre`, `--text-section` |
| `--text-lede` | 400, 18 px / 1,55 | chapô | `.chapo` |
| `--text-body` | 400, 16 px / 1,62 | prose suivie | `.corps` |
| `--text-dense` | 400, 14,5 px / 1,58 | corps de fait, de liste, de tableau | `.dense`, `--text-dense` (14) |
| `--text-nuance` | 400, 13,5 px / 1,55, `--fg-3` | limite, portée, méthode | `.nuance`, `--text-caption` |
| `--text-surtitre` | `wdth` 88, 600, 13,5 px, casse normale, précédé d'un numéro mono 11,5 px | nomme un mouvement | `.surtitre` ; **supprime** `--text-kicker` (mono capitales 11 px) |
| `--text-etiquette` | `wdth` 88, 600, 12,5 px | libellé de champ, statut, en-tête de tableau | `.etiquette` |
| `--text-chiffre` | `wdth` 125, 500, tabulaire, `clamp(30px, 3.4vw, 44px)` + unité mono 13 px | une valeur mise en avant | `.chiffre` |
| `--text-marge` | JetBrains Mono 12 px (13 px sous 900 px), casse normale | grain, preuve, source, date | `.marge`, `--text-meta` |

### 2.2 Chiffres, titres, preuves et textes longs

- **Un chiffre mis en avant** est en Archivo élargie, à l'encre, suivi de son unité en mono discret ;
  il est toujours accompagné d'une comparaison ou d'une référence dans la ligne d'en dessous (« contre 14
  en 1976-2005 »). Un chiffre seul est interdit.
- **Un chiffre dans le texte** reste dans la police du texte. **Un chiffre dans la marge** est en mono,
  tabulaire, à l'encre (`.margeValeur`) : c'est la valeur que la source établit.
- **Le titre** dit ce que le lecteur doit retenir (une phrase), jamais le nom d'une rubrique.
- **La preuve** est toujours plus petite et plus discrète que l'affirmation, mais jamais sous 12 px.
- **Le texte long** (lecture enrichie, méthode) remplit sa colonne : pas de `max-w` plus étroit que le
  bloc (règle d'`AGENTS.md`) ; les petits mots sont liés au suivant (`bindOrphans`), `text-wrap: pretty`
  ne suffit pas sur Safari.

### 2.3 Mobile et écrans non-Retina (FUT-77)

Le ticket FUT-77 n'a pas pu être relu (Linear inaccessible depuis cette session) ; ces règles sont
déduites des mesures de FUT-87 et de la doctrine.

- Plancher : **12 px** pour le mono (13 px sous 900 px), **13,5 px** pour un texte courant en `--fg-3`.
  Rien sous 10,5 px, et 10,5 px seulement pour les légendes d'axe (`RegleDeRang`, `Seuils`).
- Sous 13 px, jamais de graisse 400 sur fond sombre (`--weight-meta` 500) et jamais de `wdth` < 88.
- Les filets restent à 1 px CSS : à une densité de 1, un demi-pixel disparaît.
- Les captures de contrôle se font **aussi à `deviceScaleFactor: 1`**, pas seulement en Retina.

### 2.4 Limites mobiles constatées (non résolues)

| Limite | Où | Preuve | Suite |
| --- | --- | --- | --- |
| **Libellés de la règle du temps qui se chevauchent à 360 px** : « sécheresse » et « inondation » se touchent dès quatre dates sur 33 ans ; « aujourd'hui » touche la valeur posée à 2030 | `RegleDuTemps` (témoin 03 ; prototype Logement) | `captures/limite-regle-du-temps-memoire-360.png`, `limite-regle-du-temps-plaque-360.png` | R1 : répartition des libellés sur plusieurs lignes ou regroupement par période sous une largeur donnée ; test de non-chevauchement |
| **Densité de la comparaison à plusieurs lieux** : à 10 possibilités, quatre critères donnent 40 lignes d'issue en marge, puis 10 lignes empilées ; environ 4 400 px de haut à 360 px | témoin 04 | `captures/temoin-comparaison-10-360-page.jpg` | question ouverte pour FUT-41 (§ 8.2) : regroupement, repli des accords, rapprochement de deux possibilités |
| **Écrans non-Retina** jamais contrôlés | tout le Relevé | captures faites à `deviceScaleFactor` 2 sur mobile, 1 sur ordinateur | captures à 1× sur mobile, et sur un écran externe réel (FUT-77) |
| **Safari / WebKit** jamais testé | tout le Relevé | aucun moteur WebKit disponible dans cette session | iPhone réel et Safari macOS avant toute activation |
| **Thème clair** jamais vu | tout le Relevé | le site impose `data-theme` : l'émulation du thème système ne suffit pas ; `.boutonMarque` échoue en clair (§ 3.2) | captures en forçant `data-theme="light"` |

## 3. Couleurs et surfaces

### 3.1 Fonds et surfaces

Deux niveaux, et pas de troisième : **le fond** `--bg` (`#060812`) et **la plaque** `--bg-deep`
(`#0d1322`). La bande (`.bandeColonne`) est un fond de mouvement entier, pas une carte. Interaction :
survol `--bg-elev`, état courant `--bg-elev-2`. **Interdits** dans tout nouvel écran : `.glass`,
`GlassCard`, rayons > 3 px (`--r-rayon`), ombres portées, halos et orbes flous, dégradés de fond.

### 3.2 Contrastes (calculés le 20/10 sur les jetons)

| Jeton | sur `--bg` (sombre) | sur la plaque | sur `--bg` (clair) | sur la plaque (clair) |
| --- | --- | --- | --- | --- |
| `--fg-hi` | 18,2 | 16,9 | 15,8 | 14,4 |
| `--fg-2` | 12,7 | 11,8 | 9,2 | 8,3 |
| `--fg-3` | 7,9 | 7,3 | 5,7 | 5,2 |
| `--ghost` | 5,1 | **4,69** | 4,95 | **4,51** |
| registres (6) | 9,2 à 11,1 | 8,5 à 10,3 | 6,3 à 7,6 | 5,7 à 6,9 |
| `--orange` en texte | 7,3 | 6,8 | **2,57 (échec)** | **2,34 (échec)** |

Deux conséquences. `--ghost` sur la plaque est au plancher : ne jamais l'utiliser sous 12 px ni en
graisse 400. Et **`.boutonMarque` (texte `--bg` sur fond orange) échoue en thème clair** (2,57:1) : il
n'est pas encore utilisé en production (seuls les prototypes l'emploient), il doit être corrigé au lot
R0 (texte `--fg-hi` du thème sombre, `#1a1d28` sur orange, ou `--orange-ink` en fond clair) avant tout
usage. Le thème clair des écrans du Relevé n'a jamais été vérifié à l'écran.

### 3.3 Couleurs fonctionnelles

- **Les six registres** (`--reg-*`) sont les seules couleurs de jugement. Ils se portent par **un trait
  de 3 px devant un sujet**, jamais par un fond, une bordure de carte, un chiffre coloré ou une pastille.
- **Favorable / défavorable / incertain** : alignement (vert), écart (violet) ou incompatibilité (rouge),
  non su (gris neutre, **sans valence**). Un état incertain n'a ni teinte ni trait plein : pointillé.
- **La donnée est à l'encre.** Barres, rangs, jalons et valeurs ne prennent aucune couleur. Seule
  exception : la couleur réglementaire du DPE, et la position sur l'échelle A à G porte le sens.
- **Un incident technique** (paiement refusé, source sans réponse, génération indisponible) ne prend
  **jamais** une teinte de registre : un registre juge un lieu, pas une panne. Encre et phrase.
- **La couleur n'est jamais seule** : registre = trait + titre ; grain = forme + mot ; issue = trait + mot.

### 3.4 L'accent

L'orange `#E8823A` est la couleur de **marque**, pas de jugement : le point du logo, **une** action
principale par écran (porte de l'accueil, « Payer », « Commencer »). Il est interdit sur une donnée, un
statut, un titre (fin du motif « titre blanc, *suite en italique orange* », encore présent sur Où
vivre, le déblocage de Territoire, Logement, les pages commune) et une lueur. Dans le dossier, l'orange
n'apparaît que comme teinte du registre « compromis ».

## 4. Géométrie

### 4.1 Les trois formes sont réservées aux échelles

Cercle = la commune (et l'agglomération, cercle à point), carré = le secteur, losange = le bâtiment
(plein) ou l'adresse (vide). Trois états de trait : **plein** (constats), **fin** (examiné, rien
d'affiché), **pointillé** (non examiné). **Aucune autre fonction ne peut utiliser ces formes.** Écart
constaté : la plaque du verdict marque son ton par un **carré** plein de 8 px (« ■ Arbitrage »,
`ConclusionBlock.tsx` l. 252), qui se lit comme le glyphe du secteur. À remplacer par le trait de
registre (R2).

### 4.2 Séparation, bordures, rayons, rythme

- **Filets plutôt que cartes** : `--border-1` entre éléments, `--border-2` pour une limite forte. Un
  filet pointillé sépare un texte de sa marge sous 900 px.
- **Rayon** : 3 px partout. Le cercle n'existe que comme glyphe.
- **Rythme vertical** : pas de 8 px ; un mouvement = 56 px de haut et de bas et un filet (40 px en
  version serrée) ; les éléments d'une liste, 22 px et un filet.
- **Plaque** *(stable)* : la surface dominante **d'un mouvement**, deux coins de coupe ; elle porte ce
  que futur•e conclut (verdict, lecture immédiate) ou ce que la personne achète. Une page longue peut en
  porter plusieurs ; deux plaques de même poids ne se font pas concurrence dans le même champ visuel
  (`DESIGN.md` § 2.2), sauf quand l'écran les met **explicitement** en regard pour les comparer. Ce qui
  vient d'un tiers (formulaire Stripe, carte) se pose dans un **emplacement** à filet pointillé, sans
  coins.

### 4.3 Grilles et espaces blancs

- **Conteneur** 1100 px, gouttières 20 / 28 px (inchangé, comme `/rapport`).
- **Grille à marge** : texte `1fr`, marge de preuve 232 px, gouttière 48 px, dès 900 px ; en dessous,
  la marge passe sous le texte.
- **Colonne d'appui** : 280 px, collante sous la navigation (FUT-92) ; jamais un calque.
- **Les seuils de mise en page suivent le conteneur, pas l'écran.** Écart constaté sur le témoin 03 :
  `CoupeEchelles` passe à trois colonnes dès 760 px d'écran, même posée dans une colonne de 320 px, et
  s'y écrase. À passer en `@container` (R1).
- L'espace blanc n'est pas un décor : un mouvement vide n'existe pas (l'écran de qualification d'adresse
  laisse aujourd'hui trois quarts de l'écran vides alors qu'il annonce trois échelles qu'il pourrait
  montrer).

## 5. Grammaire documentaire

Dix rôles, chacun avec une forme. **Aucune décoration ajoutée** : la différence se lit par la position
(texte / marge / plaque), la taille et l'encre.

| Rôle | Forme | Primitive | Règle |
| --- | --- | --- | --- |
| **Fait** | un énoncé à gauche de la marge | `Ligne` | une phrase complète, au présent, sans adjectif de jugement |
| **Valeur** | chiffre à l'encre + unité mono ; dans la marge, mono tabulaire | `Chiffre`, `Marge` (`valeur`) | toujours avec sa référence ou son horizon ; jamais animée |
| **Provenance** | glyphe de grain + mot | `Grain` | dit **où** le fait a été établi, pas d'où vient la donnée |
| **Preuve** | la marge : grain, valeur, source, date, lien | `Marge` | le lien porte la provenance de l'artefact servi (`evidenceHref`) |
| **Limite** | phrase en `--text-nuance` sous le fait | `.nuance` | dit ce que le fait ne dit pas ; jamais en italique, jamais en couleur |
| **Interprétation** | corps de texte sous le fait, en `--fg-2` | `.corps` / `.dense` | jamais plus grand que le fait ; signalée comme lecture (« ce qui compte ici ») |
| **Conclusion** | la plaque, le verdict en `--text-verdict` | `Plaque` + `ConclusionBlock` | une conclusion par dossier lu ; le titre n'est jamais généré |
| **Vérification** | sujet à trait `contrôle`, geste à glyphe d'action, numérotée | `Registre` + `ActionCue` | dit quoi demander, à qui, et pourquoi |
| **Projet** | phrase de lecteur dans une plaque ou en tête ; conditions sans compromis à trait `incompatibilité` | `Plaque`, `Registre` | le Projet est cité, jamais reformulé par l'écran |
| **Arbitrage** | la balance : deux côtés en regard (deux colonnes ≥ 900 px) | `.deux`, `.bandeColonne` | **seulement** pour les deux côtés d'un même arbitrage, jamais pour comparer des lieux |

Deux motifs canoniques déjà présents dans le produit, à réutiliser tels quels :
- **« Pourquoi elles ne disent pas la même chose »** (Logement, inondation à l'adresse contre à la
  commune) : la forme d'une **contradiction** entre deux lectures de grains différents ;
- **la ligne d'état unique** (FUT-75 Q5) : la forme d'un contenu **en attente** qui ne remplace rien.

## 6. Composants fonctionnels

| Composant | État du canon | Règle |
| --- | --- | --- |
| **Bouton** | classes `.bouton`, `.boutonMarque` sans composant ; `BoutonAction` (FUT-75) pour les actions à état | trois variantes : marque (une action principale dans le champ visuel), trait, lien. Rayon 3 px, cible ≥ 40 px, focus 2 px `--fg-hi`. Casse normale. `.boutonMarque` à corriger en thème clair |
| **Champ de recherche** | **manquant** (l'accueil, la qualification et la connexion ont chacun le leur) | grand (≥ 52 px), filet `--border-2`, fond plaque, libellé visible au-dessus, aide en nuance. Témoin 05 |
| **Sélecteur** (horizon, mode, nombre) | **manquant** ; `HorizonSwitch` (accueil ancien) et `HORIZON_PILLS` (Territoire) font le même travail | liens ou radios, repère de 2 px sous l'option courante, 180 ms (FUT-75 Q2), jamais une teinte. Témoins 03 et 04 |
| **Filtres** | **manquant** | un filtre est une lentille : il masque, il ne trie pas et ne compte pas |
| **Navigation** | `Navbar` hors Relevé (capitales mono) ; `CoupeEchelles`, `EchelleNavigator` dans le dossier | casse normale, lien d'évitement ; coordination FUT-86 |
| **Cartes** | pas de carte générique | une « carte » est une `Ligne` ; une surface élevée est une `Plaque` |
| **Tableaux** | **manquant** | filets, nombres à droite en mono tabulaire, aucune couleur par ligne ou colonne ; empilé sous 640 px. Témoins 03 et 04 |
| **Comparaison** | voir § 8 | principes stables (preuve, registre, grain, aucun score) ; la forme reste une **hypothèse** ouverte à FUT-41 |
| **Accordéons** | `details` natif, `.details` / `.detailsFluide` (FUT-75 Q4) | `+` / `−` en mono, contenu cherchable, ouverture 240 ms, instantanée sans `::details-content` |
| **Modales** | **aucune dans le Relevé**, et c'est voulu | préférer une page ou un dépliable ; si une modale devient nécessaire : plaque sans coins, focus piégé, fermeture Échap |
| **Erreur, chargement** | ligne d'état (FUT-75 Q5, FUT-93) ; **manquante** comme primitive | une ligne qui change de fonction ; aucune teinte de registre ; indicateur seulement après 300 ms. **Elle n'affirme que ce que le serveur a confirmé** *(stable)* : « aucun montant n'a été prélevé », « paiement reçu », « dossier prêt » ne s'écrivent qu'à partir d'un état serveur établi (par exemple le statut du paiement relu côté serveur auprès de Stripe, ou l'événement reçu par le webhook). Une erreur générique, un délai ou une réponse réseau perdue ne prouvent rien : l'écran dit alors que la confirmation n'est pas encore connue, et ce que la personne peut faire sans risquer de payer deux fois |
| **Parcours** (tunnel) | **manquant** | étapes numérotées en mono, nom en casse normale, étape courante à l'encre. Témoin 05 |
| **Cartographie** | aucune carte dans le Relevé | trait seul, fond neutre, aucune teinte de risque inventée ; une carte est un **emplacement** (donnée d'un tiers) |
| **Graphiques** | `RegleDuTemps`, `RegleDeRang`, `Seuils`, échelle DPE, barres d'audit, `TerritoryYearsBand` | une échelle par mesure, le seuil affiché, la source nommée. **Le tracé suit la nature de la donnée** *(stable)* : des horizons, des paliers de réchauffement ou des moyennes trentenaires sont des jalons isolés, **jamais reliés** (FUT-87 V2) ; une **série continue réellement mesurée ou modélisée à ce pas** (températures annuelles observées, série annuelle d'un même modèle) peut être une courbe, avec son enveloppe d'incertitude et sa source. `RegleDuTemps` superpose ses libellés à 360 px (§ 2.4) : à corriger avant tout usage |

## 7. Mouvement (FUT-75, sans ajout)

La grammaire est celle de `design-tokens.css` et `lib/motion.ts` : 90 ms (pression), 120 ms (survol,
focus), 240 ms (transition d'état), 180 ms (arrivée d'un contenu, fondu et flou de 2 px **sans
déplacement**), coche de confirmation en 260 ms après la réponse, micro-ressort réservé aux commandes.
**Le repère bouge, la donnée reste.**

Le mouvement n'est permis que pour quatre sens :

| Sens | Exemple | Forme |
| --- | --- | --- |
| **Changement d'échelle** | passer de Territoire à Logement | la coupe garde sa place, le repère courant glisse ; rien ne zoome |
| **Transition temporelle réelle** | changer d'horizon | le repère du sélecteur glisse (180 ms) ; les valeurs changent d'un coup, sans compteur |
| **Fait et preuve** | ouvrir « Données et limites » | la zone s'ouvre (240 ms), le titre et la commande ne bougent pas |
| **Évolution d'un arbitrage** | une analyse mise à jour | l'ancienne version reste lisible pendant l'attente ; la nouvelle arrive en bascule, annoncée |

Interdits : apparition au défilement, parallaxe, compteurs, entrées décalées de cartes, toute animation
d'une valeur. `prefers-reduced-motion` met **toutes** les durées à zéro (test G2). Budget : ≥ 30 i/s
processeur ralenti six fois. Clavier : aucun mouvement ne déplace le focus.

## 8. Les objets du centre de décision (cadre pour FUT-41 / FUT-22)

Ce cadre ne conçoit pas l'architecture du centre. FUT-41 travaille sur une V2 plus visuelle,
interactive et guidée ; ce qui suit sépare ce qu'elle doit tenir de ce qu'elle peut réinventer.

### 8.1 Principes non négociables *(stable)*

1. **La preuve** : toute issue, tout énoncé comparatif renvoie à sa source, à sa date d'analyse et à
   la provenance de **cet** artefact. Rien n'est affirmé sans pouvoir être vérifié.
2. **Le registre** : la seule couleur de jugement est celle des six registres, liée à une issue
   **établie**. Une issue non établie (« à vérifier », « non examiné ») n'a **aucune valence** : ni
   teinte, ni trait plein.
3. **Le grain** : chaque issue dit à quelle échelle elle a été établie (cercle, carré, losange) ; une
   différence de **profondeur d'examen** n'est jamais présentée comme un avantage du lieu.
4. **Aucun score** : ni note, ni total, ni moyenne, ni « nombre de points favorables », ni tri par
   mérite. Les seuls nombres sont des longueurs de liste recomptables à l'écran.
5. **Une possibilité ne prend pas de couleur propre** : la couleur est réservée aux registres.
6. **L'absence se dit** : une donnée manquante a une phrase et une raison.
7. **La phrase dit ce que dit la marge** : un énoncé reprend l'issue exacte de chaque possibilité qu'il
   nomme, et cela se teste sur le texte rendu (T4 et T5 des témoins).

### 8.2 Hypothèses illustrées par le témoin 04 *(hypothèse)*

Le témoin 04 en montre **une** écriture possible, compatible avec la direction A du cadrage FUT-41. Ce
sont des exemples, pas des règles :

| Objet | Écriture proposée par le témoin |
| --- | --- |
| **Projet** | phrase de lecteur en tête, dans une plaque ; date de révision en mono ; conditions sans compromis au trait `incompatibilité` |
| **Possibilité** | identifiée par son nom ; ordre d'ajout ou du Projet dit à l'écran |
| **Niveau d'examen** | les trois glyphes, pleins pour les échelles examinées |
| **Critère** | une ligne par critère, dans l'ordre du Projet |
| **Comparaison** | l'énoncé à gauche, l'issue de chaque possibilité en marge ; une forme qui ne change pas de 2 à 10 possibilités. D'autres formes restent ouvertes : colonnes par candidat, table manipulable, disposition spatiale, parcours guidé, **à condition de tenir les principes du § 8.1** (une position ou une colonne ne doit pas se lire comme un rang ; une disposition spatiale dit ce que ses axes signifient) |
| **Issue** | trait de registre + mot ; pointillé + mot pour une issue non établie |
| **Contradiction** | le motif « pourquoi elles ne disent pas la même chose » |
| **Arbitrage** | la balance pour deux côtés d'un même arbitrage |
| **Vérification** | registre `contrôle`, avec le nom de la possibilité |
| **Historique** | liste datée repliée, ou `RegleDuTemps` |

La densité de cette écriture à 360 px est une limite constatée (§ 2.4) : c'est l'une des questions que
la V2 de FUT-41 doit résoudre, pas une contrainte qu'elle hérite.

## 9. De `DESIGN.md` v2.1 à v3.0, section par section

Relu le 20/10 sur `main` (`3da725e3`). **Conservé** : inchangé. **Amendé** : le principe reste, une règle
change. **Remplacé** : la section est réécrite à partir de ce document. **Supprimé** : la règle disparaît.

| § v2.1 | Sujet | Sort en v3.0 | Ce qui change | Source ici |
| --- | --- | --- | --- | --- |
| en-tête et § 12 journal | historique des versions | **amendé** | entrée v3.0 : le Relevé devient la grammaire canonique | § 1 |
| 0 | les trois couches de documents | **amendé** | ajoute `src/components/releve/` comme canon des primitives et `kit.tsx` comme déprécié | § 1 |
| 1 | les trois registres A / B / C | conservé | | |
| 2.1 | grille de page, deux pistes, conteneurs 680 / 920 / 1100 | **amendé** | ajoute la **grille à marge** (texte `1fr`, marge de preuve 232 px, gouttière 48 px dès 900 px) et la colonne d'appui de 280 px ; la règle « pas de `max-w` plus étroit que son bloc » reste | § 4.3 |
| 2.2 | une seule surface dominante | **amendé** | la surface dominante devient **la plaque** (fond `--bg-deep`, coins de coupe) ; « verre, ombre portée » retirés de la définition | § 3.1, § 4.2 |
| 2.3 | ce qui sépare | **amendé** | marge, filet, fond ; **le verre sort de la liste** | § 4.2 |
| 2.4 | numérotation citable | conservé | précise le surtitre numéroté | § 2.1 |
| 3.1 | les quatre états d'une valeur | conservé | | |
| 3.2 | l'alignement au chiffre (« toute valeur en mono ») | **amendé** | le chiffre **mis en avant** est en Archivo `wdth` 125 tabulaire ; le mono reste pour la marge, les tableaux et les unités | § 2.1, § 2.2 |
| 3.3 à 3.6 | trajectoire, incertitude, comparaison, position avant couleur | conservé | 3.3 gagne « le tracé suit la nature de la donnée » : horizons et paliers jamais reliés, série continue permise avec son incertitude | § 6 |
| 4 | la voix | conservé | | |
| 5.1 | le fond (« fond profond, verre translucide, grain ») | **amendé** | fond profond conservé, orbes déjà supprimés ; **le verre translucide n'est plus une signature** | § 3.1 |
| 5.2 | la palette close | conservé | | |
| 5.3 | le statut de la couleur | conservé | ajoute : un incident technique ne prend jamais une teinte de registre | § 3.3 |
| 5.4 | les six registres | **amendé** | la teinte se porte par **un trait de 3 px devant le sujet**, plus par une pastille ni un filet de carte | § 3.3 |
| 5.5 | le verdict ne porte jamais l'accent (`.card-verdict`) | **remplacé** | le verdict vit dans la plaque ; son ton par le trait, plus par un halo ni un carré | § 4.1, § 5 |
| 5.6 | encre et surface | conservé | ajoute le contraste de `.boutonMarque` en thème clair | § 3.2 |
| 6.1 | la carte | **remplacé** | plus de carte générique : la `Ligne` à marge, et la plaque | § 5, § 6 |
| 6.2 | le filet coloré en haut de carte (et ses quatre règles) | **remplacé** (sous réserve de l'arbitrage sur le filet) | le trait de registre devant le sujet ; les quatre règles de `evidence-registers.ts` à transposer ou retirer | § 3.3 |
| 6.3 | le badge et la pastille (surtitres à pastille) | **remplacé** | surtitre en casse normale numéroté ; un badge reste permis pour un état qui varie | § 2.1, § 6 |
| 6.4 | le graphique, aucune donnée animée | conservé | | |
| 6.5 | l'image | conservé | | |
| 6.6 | tableaux et grilles denses (« une table large scrolle dans son conteneur ») | **amendé** | le tableau de relevé **s'empile** sous 640 px au lieu de défiler | § 6 |
| 7 à 7.3 | les trois échelles | **amendé** | l'échelle est dite par **la forme** (cercle, carré, losange), formes réservées à cet usage ; la tolérance d'une teinte d'échelle dans la chrome (7.2) est supprimée | § 4.1 |
| 8 | le gabarit éditorial | conservé | | |
| 8.1 | la navigation, `Navbar` partout y compris dans les tunnels | **amendé** | ajoute le lien d'évitement et la casse normale (avec FUT-86) ; la règle des tunnels reste | § 6 |
| 8.2, 8.3 | fraîcheur, canonicité | conservé | | |
| 9.1 | composants validés (`ConclusionBlock`, `.card-verdict`, `FactBody`, `EvidenceRow`, `MethodDetails`, `Chip`, `HorizonBar`, `HorizonSwitch`, échelle de rôles, `--weight-kicker`) | **remplacé** | la liste devient celle des primitives du Relevé ; **une seule table de rôles** (§ 2.1) ; `--text-kicker` et `--weight-kicker` supprimés | § 2, § 6 et rapport § C |
| 9.2 | dépréciés | **amendé** | ajoute `GlassCard`, `ReportSection`, `.glass` dans le rapport, `Chip`, `FamilyHeading` coloré, `HorizonSwitch` | rapport § C.4 |
| 9.3 | interdits | **amendé** | ajoute : capitales mono espacées, titre à suite en italique orange, lueur autour d'un paiement, formes d'échelle employées à autre chose | § 2, § 3.4, § 4.1 |
| 10 | conventions d'implémentation | **amendé** | les jetons `--r-*` et les rôles vivent dans `design-tokens.css` ; un nouveau fichier ne peut contenir aucun marqueur hérité (test-cliquet) | rapport § C.5 |
| 11 | ce qui reste ouvert | **amendé** | point 1 (collision de l'orange) tranché par § 3.4 ; point 4 (système de composants partagés) devient le lot R1 | § 3.4 |

## 10. Accessibilité

WCAG 2.2 AA comme plancher : contrastes du § 3.2 ; focus 2 px `--fg-hi` sur tout élément interactif ;
`scroll-padding-top` sous la navigation collante ; figures avec `aria-label` qui dit ce qu'elles montrent ;
glyphes `aria-hidden` doublés d'un mot ; tableaux avec `caption` et `scope` ; lignes d'état en
`aria-live="polite"` ; aucune information réservée au survol ; cibles ≥ 40 px sur mobile.

# FUT-87 · Directions artistiques, recommandation, design system et migration

> **Erratum du 20/10/2026 (FUT-118 R0).** Ce document dit qu'Archivo est employée « avec son axe de
> largeur (déjà dans le fichier servi, 0 octet ajouté) », et sa table typographique donne des réglages
> `wdth` (118, 108, 88, 125, 70 à 75 pour la direction A). Le fichier **servi par le site**
> (`public/fonts/Archivo-Variable.woff2`) n'a pas d'axe de largeur : mesuré dans Chrome, un même texte a la
> même largeur à `wdth` 62, 100 et 125 (l'Archivo de Google Fonts varie, elle, de 453 à 851 px). Ces
> réglages étaient ignorés ; les prototypes et les captures de cette revue montraient Archivo en largeur
> normale, et c'est ce rendu qui a été validé. Les réglages ont été retirés du code et la référence est
> Archivo en largeur normale (`DESIGN.md` v3.0, § 9.1). Le texte ci-dessous est conservé tel qu'il a été
> écrit.

Date : 11 octobre 2026 · Statut : **direction de travail validée par le porteur (revue du 11/10) ;
version achevée et migration non validées.** Rien de ce document n'est appliqué au site public. Les
prototypes vivent sous `/dev/fut87` (404 en production) ; l'audit qui les fonde est
`2026-10-11-fut87-audit-visuel.md`. La V2 (§ 0) répond à la revue du porteur.

## 0. V2 · Ce que la revue a changé

La revue a validé l'architecture éditoriale, la marge de preuve, les glyphes et les visualisations issues
des données, et demandé une passe de maturation avant toute migration. Ce qui a été fait :

| Point de la revue | Réponse V2 | Vérification |
| --- | --- | --- |
| **Trajectoire dessinée comme une série continue** (`RegleDuTemps` reliait les jalons par une ligne) | Chaque horizon est un jalon isolé : une tige depuis l'axe, un repère carré, sa valeur. La référence 1976-2005 reste une bande. Aucun trait entre deux jalons, et la marge le dit. | Test D1 : la fonction ne contient ni `polyline`, ni `path`, ni `points` ; une ligne réintroduite fait échouer le test. |
| **Provenance des preuves** (une preuve sans valeur perdait lien, cible, grain et date ; une carte prenait le grain de sa première preuve) | `lireDossier` garde chaque `EvidenceRef` entière, avec ou sans valeur ; une carte porte **tous** ses grains ; une composition reprend les grains de ses faits absorbés, et ce que sa face ne raconte pas reste lisible dans un dépliable, comme en production. En marge, une source sans valeur reste un lien, et chaque preuve d'une carte à grains mêlés porte son propre glyphe. | Tests L4 (toutes les preuves de la minute, champ par champ), L5 (carte mêlant commune, secteur et adresse, lien et date d'une source sans valeur), L6 (composition et fait absorbé d'un autre grain). Deux mutations (liens retirés, premier grain seulement) font échouer L4 à L6. |
| **Mobile trop dense, sommaire hors du premier écran** | Sommaire en jetons juste sous le verdict ; gestes prioritaires avant l'explication ; projet replié en une ligne ; titre du verdict de 27 px sur mobile. | Mesuré sur quatre dossiers (référence, condition, nombreuses réserves, titre long) : titre, sommaire et gestes finissent entre 466 et 620 px à 390 × 844, et à 647 px au plus à 360 × 740, barre de navigation comprise et bandeau du prototype exclu. |
| **Marge de preuve trop petite** | 12 px sur grand écran, 13 px sur mobile (11,5 px en V1) ; sources en `--fg-3` au lieu du gris de métadonnée. | Captures `*-390.jpg`. |
| **Dossier trop austère, monotonie de lignes** | Trois densités alternées : la plaque (éditoriale) ; deux moments visuels, l'emblème « D'où viennent ces constats » (état de chaque échelle, voir la correction ci-dessous) et la bande teintée de la balance (Ma décision) ou de l'audit (Logement) ; le registre des contrôles (sobre). | Captures `decision-apres-1440.jpg`, `logement-apres-1440.jpg`. |
| **Situations défavorables** | Cinq cas Logement (référence, sans diagnostic, immeuble, sources sans réponse, titre long) et cinq cas Ma décision (référence, condition sans compromis, nombreuses réserves, titre long, correspondance sans réserve), sélectionnables en tête de page. Les absences reprennent les phrases de production ; deux formulations nouvelles sont signalées dans le code (patrimoine non vérifié, mémoire des sinistres non lue). | Captures `cas-*.jpg`. Les cas ont révélé trois défauts, corrigés : libellés de la règle du temps superposés (diagnostic 2023 et audit 2024), « : » orphelin en début de ligne dans le verdict, rouge d'incompatibilité au sommaire d'une section de conditions sans blocage. |
| **Orange** | Absent des données et de la navigation du dossier ; présent dans l'identité (point du logo, porte principale et bouton d'action de l'accueil). Dans le dossier, il ne reste que là où la production le met : le ton « arbitrage » du verdict, qui est le registre compromis. | Revue visuelle des captures. |
| **Git** | Les commits FUT-87 ont été rebasés sur `main` (FUT-67 #44, FUT-26 #45, puis FUT-54 #46), sans rejouer FUT-67 ; #44 contient FUT-67 à l'identique. Les prototypes « Ma décision » lisent donc la sortie du moteur corrigé par FUT-54. | `git log origin/main..` ne contient que des commits FUT-87, qui ne touchent que `src/components/prototypes/fut87/`, `src/app/dev/fut87/` et `docs/audits/`. Tests FUT-54 et FUT-87 au vert sur la nouvelle base, mesures mobiles identiques. |

**Correction du 11/10/2026 · les échelles non examinées.** La V2 écrivait « 0 constat dans le secteur »
et « 0 constat à l'adresse » sur un dossier uniquement communal, où ces échelles n'ont pas été lues : un
lecteur pouvait y voir une absence de problème. Désormais :

- les échelles examinées se déduisent du **périmètre du dossier** (`Dossier.scope`), jamais du nombre de
  cartes : `commune` n'examine que le territoire ; `commune+adresse` (dossier relancé au point de
  l'adresse par `assembleAddressDossier`) examine les trois ;
- une échelle **non examinée** n'a aucun nombre : « Non examiné dans cette lecture », forme en pointillé ;
- une échelle **examinée sans constat affiché** dit « 0 » et « Examiné, aucun constat affiché… », trait fin ;
- les constats se comptent par **échelle de lecture du moteur** (`echelleDeLaPreuve`) : une distance
  mesurée depuis l'adresse compte au quartier, pas au logement ;
- le prototype assemble un vrai dossier d'adresse (`?lieu=`, bâtiment public géocodé par la BAN, fonction
  de production en lecture seule) pour vérifier ce périmètre ;
- tests P1 à P4 (dossier communal, dossier d'adresse avec zéro constat au logement, périmètre
  indépendant des cartes, proximité comptée au quartier) ; trois mutations (tout examiné, périmètre par
  les cartes, relation ignorée) les font échouer.

Limite assumée : le `Dossier` ne dit pas si l'instantané du voisinage existait à l'assemblage. Distinguer
un secteur partiellement examiné demanderait que le moteur l'expose ; ce lot ne touche pas au moteur.

**Défaut du moteur trouvé en testant les cas** (hors périmètre FUT-87, non corrigé ici) : à Nîmes, faire de
« des étés plus frais » une condition sans compromis (`confirmer=faible_chaleur`) fait échouer l'assemblage
du dossier : « fait absorbé inexistant : 30189:climat-chaleur (30189:composition-confort-ete) ». Le harnais
de production `/dev/dossier` reproduit l'erreur à l'identique, avant comme après la fusion de FUT-54. Un lecteur qui confirmerait cette condition
sur une commune chaude verrait vraisemblablement son dossier échouer. À traiter avec FUT-54 ou en ticket
propre. Le cas « condition sans compromis » du prototype utilise donc la proximité de la mer.

## Cadre

`DESIGN.md` et `docs/vault/doctrine/design.md` verrouillent une partie de la DA : fond sombre `#060812`,
palette close, six registres, Archivo et JetBrains Mono, logo dessiné, « la forme sert le fond », sources
visibles à chaque affirmation. FUT-87 demande de rouvrir la direction ; la doctrine exige alors une
justification explicite de toute proposition contraire. La direction recommandée **ne touche à aucun de
ces verrous** : elle change la composition, le rythme, la place de la preuve et le dessin de la donnée.
Les seuls points qui demanderaient un arbitrage sont signalés comme tels (B en papier clair, § 7).

## 1. Les trois directions

Une planche les rend sur le même contenu (verdict, constat, preuve du dossier réel de Nîmes) :
`/dev/fut87/directions`, capture `fut87-captures/directions-1440.jpg`.

### A · Atlas contemporain

1. **Concept.** Le dossier comme feuille d'atlas : chaque lieu a sa planche.
2. **Principes.** Trame de coordonnées en fond, barre d'échelle, isolignes en filigrane, repères de
   feuille (« 43°50′ N · feuille 30189 »).
3. **Typographie.** Archivo condensée (`wdth` 70 à 75) en capitales espacées pour les lieux et les
   titres, à la manière d'un toponyme ; mono pour les coordonnées.
4. **Palette.** Fond sombre, encre gris-bleu des cartes, les registres inchangés.
5. **Surfaces.** Aucune carte : la page entière est la feuille, la trame la structure.
6. **Mise en page.** Cartouche en tête, légende en pied, blocs posés sur la trame.
7. **Données.** Isolignes et aplats gradués ; la preuve s'adosse à un repère spatial.
8. **Sources.** En cartouche, comme une légende de carte.
9. **Mobile.** La trame tient ; les capitales condensées deviennent longues à lire sur 360 px.
10. **Identifiable par** la trame et le lettrage de toponyme.
11. **Risques.** Coordonnées, isolignes et échelle ressemblent à des données et n'en sont pas : un faux
    relevé à quelques centimètres d'un verdict sourcé, ce que la veille du 21/08 avait déjà écarté. Le
    verdict est une phrase longue, illisible en capitales. Tout finit en carte.

### B · Édition documentaire

1. **Concept.** Le dossier comme publication de référence : on le lit, on le cite, on le garde.
2. **Principes.** Grand titrage gras, paragraphes numérotés (1.1, 1.2) citables, alternance d'une
   phrase dense et d'un chiffre en très grand corps.
3. **Typographie.** Archivo 800 serrée pour les titres, Archivo 300 très grande pour les chiffres,
   corps à 15,5 px, mono pour les notes.
4. **Palette.** Papier clair (le thème clair existant, `#faf8f3`), encre `#1a1d28`, orange en appel de note.
5. **Surfaces.** Une seule : la page. Des filets épais (2 px) pour ouvrir un chapitre.
6. **Mise en page.** Colonne de lecture, numéros en marge gauche, notes en pied.
7. **Données.** Un chiffre, une phrase qui l'explique, sur la même ligne.
8. **Sources.** Appels de note et notes en pied de planche.
9. **Mobile.** Excellent pour la lecture, moins pour la navigation dans un dossier long.
10. **Identifiable par** la typographie et le papier.
11. **Risques.** Un dossier long devient un document à faire défiler. Le papier clair rompt avec la DA
    sombre (ADR-0005) : arbitrage nécessaire. Les notes en pied éloignent la preuve quand le texte
    s'allonge.

### C · Architecture du temps

1. **Concept.** Le lieu en coupe : trois strates (commune, secteur, bâtiment) sous un axe du temps.
2. **Principes.** Chaque fait se place à son échelle et à sa date ; le présent est un trait vertical.
3. **Typographie.** Archivo régulière, mono pour les années.
4. **Palette.** Fond sombre, strates alternées en très léger contraste.
5. **Surfaces.** Des bandes horizontales, pas de cartes.
6. **Mise en page.** Une grille de strates en tête, le détail des faits en dessous.
7. **Données.** Positionnées en temps et en grain ; les formes de l'emblème deviennent les marques.
8. **Sources.** Au survol ou en légende de strate.
9. **Mobile.** Faible : trois strates et un axe de 2100 ne tiennent pas en 360 px sans tout réduire.
10. **Identifiable par** la coupe et l'axe du temps.
11. **Risques.** Abstrait, demande un apprentissage ; une strate vide se lit comme un manque ; pousse
    vers un tableau de bord temporel.

## 2. Direction recommandée : « Le relevé » (B + C)

**Le concept.** Un relevé est ce qu'on rapporte d'un lieu après l'avoir mesuré : des valeurs, leur
position, leur date, et la marge où l'on note d'où elles viennent. futur•e fait exactement cela.

**Ce qu'elle prend.** De B : la charpente éditoriale (titrage fort, une surface par mouvement, sections
numérotées, preuve à côté de l'affirmation). De C : la règle du temps et la marque du grain par la forme.
De A : seulement la rigueur du trait et un repère de planche par écran (les coins de la plaque). Fond
sombre conservé.

**Pourquoi elle convient à futur•e.** Le produit relie trois choses : un lieu à trois échelles, un temps
qui va de 1982 à 2100, et une décision. Le relevé donne à chacune une forme stable et réutilisable : le
grain devient un glyphe (cercle, carré, losange, ceux de l'emblème), le temps devient une règle, la
décision devient la plaque du verdict. Ces trois formes viennent du produit lui-même.

**Ce qu'elle apporte à la compréhension.**
- La preuve est **à côté** de ce qu'elle prouve (la marge), au lieu d'une pastille en dessous.
- Le grain se reconnaît d'un coup d'œil à la forme, sans lire « à l'échelle de la commune ».
- Le rang et le seuil climatique se **voient** (règle de rang, barres à seuil), avec les nombres
  mêmes qui ont décidé du constat (`basis` du moteur).
- Le verdict, le sommaire et les gestes prioritaires tiennent dans le premier écran, mobile compris
  (mesure au § 0 ; la V1 l'affirmait à tort pour le mobile, où le sommaire arrivait sous l'explication).
- La balance « correspond / correspond moins bien » est face à face.

**Pourquoi elle restera crédible.** Elle n'emprunte rien aux effets de l'année (verre, halos, dégradés,
italiques colorées) ; elle repose sur des conventions de document technique et d'édition, qui vieillissent
lentement, et sur la géométrie propre du produit.

| Critère | A Atlas | B Édition | C Temps | **Relevé** |
| --- | --- | --- | --- | --- |
| Singularité | forte | moyenne | forte | **forte** (emblème, glyphes, marge, règle) |
| Crédibilité | faible (faux relevé) | forte | moyenne | **forte** |
| Lisibilité | faible | forte | moyenne | **forte** |
| Cohérence avec la doctrine | moyenne | arbitrage (papier) | moyenne | **aucun verrou touché** |
| Faisabilité | moyenne | forte | faible | **forte** (neuf primitives, aucun moteur touché) |
| Évolutivité | faible | moyenne | moyenne | **forte** (les primitives couvrent les trois échelles) |

## 3. Mini design system

Implémentation de référence : `src/components/prototypes/fut87/primitives.tsx` et `releve.module.css`.
Tous les jetons dérivent de `design-tokens.css` ; aucune couleur nouvelle.

### Typographie

Archivo pour tout le texte, avec son **axe de largeur** (déjà dans le fichier servi, 0 octet ajouté).
JetBrains Mono seulement là où l'alignement compte.

| Rôle | Réglage | Usage |
| --- | --- | --- |
| Display | Archivo `wdth` 118, 500, 34 à 58 px (84 en accueil), −0,02 em | le verdict, le titre de page, un par écran |
| Titre | Archivo `wdth` 108, 600, 23 à 31 px | titre de mouvement |
| Sous-titre | Archivo 600, 17 px | sujet d'un fait (la priorité du lecteur) |
| Chapô / corps / dense | Archivo 400, 18 / 16 / 14,5 px | texte |
| Nuance | Archivo 400, 13,5 px, `--fg-3` | limite, portée, méthode |
| Surtitre | Archivo `wdth` 88, 600, 13,5 px, **casse normale** + numéro mono | nomme un mouvement ; remplace les capitales mono |
| Étiquette | Archivo `wdth` 88, 600, 12,5 px | statut, libellé de champ |
| Chiffre | Archivo `wdth` 125, 500, tabulaire, 30 à 44 px + unité mono | valeur mise en avant |
| Marge | JetBrains Mono 12 px (13 px sur mobile), casse normale, sources en `--fg-3` | grain, preuve, source, date |

La serif n'est pas réintroduite (amendement du 01/08 : registre faux pour un instrument de mesure). La
mono n'est plus jamais en capitales espacées.

### Couleurs

- **Fond** `--bg`, **plaque** `--bg-deep` : deux niveaux, plus de verre translucide dans le dossier.
- **Texte** : `--fg-hi` (encre), `--fg-2` (texte), `--fg-3` (discret), `--ghost` (marge), tous au-dessus
  de 4,5:1 sur les deux fonds.
- **Marque** : l'orange sur l'accueil et les tunnels uniquement (porte principale, bouton d'action).
- **Registres** : `--reg-*` inchangés, portés par un **trait de 3 px** devant le sujet d'un fait, jamais
  par un fond ni une bordure de carte.
- **Données** : l'encre seule (barres, rangs, trajectoires). La couleur DPE réglementaire est la seule
  exception, et la position sur l'échelle A-G porte le sens.
- **Interaction** : survol par fond `--bg-elev`, focus par contour 2 px `--fg-hi`.
- La couleur n'est jamais seule : registre = trait + titre de section ; grain = forme + mot ; DPE =
  position + lettre.

### Géométrie

- **Grille à marge** : texte `1fr`, marge de preuve 232 px, gouttière 48 px (≥ 900 px). Sous 900 px, la
  marge passe sous le texte derrière un filet pointillé.
- **Conteneur** 1100 px, padding 20 / 28 px (inchangé).
- **Rayons** 3 px (documentaire). **Filets** 1 px `--border-1` entre éléments, `--border-2` pour les
  limites fortes. **Pas** de 8 px ; mouvements séparés par 56 px et un filet.
- **Une plaque par mouvement**, marquée de deux coins de coupe.

### Composants (neuf rôles)

| Rôle | Primitive | Remplace |
| --- | --- | --- |
| Information principale | `Plaque` + `Display` | `.card-verdict`, `GlassCard` du passeport |
| Fait documenté | `Ligne` (texte + `Marge`) + `Registre` | carte glass + `FactBody` |
| Donnée chiffrée | `Chiffre` | valeurs mono colorées |
| Interprétation prudente | `Nuance` | `text-muted/85` |
| Vérification | geste à glyphe d'action, registre numéroté | `ActionCue`, `DecisionChecklist` |
| Preuve | `Marge` (grain, valeur, source, date) | `Chip` « PREUVE · … » |
| Méthodologie | `details` « Données et limites » | `MethodDetails` |
| Visualisation | `RegleDuTemps` (jalons, jamais de courbe), `RegleDeRang`, `Seuils`, échelle DPE, barres d'audit, `EmblemeEchelles` compté | (absent) |
| Navigation entre échelles | `CoupeEchelles`, `GlypheGrain` | cartes de modules colorées |

## 4. Les prototypes

Lancer le serveur de dev (`npm run dev`), puis ouvrir `/dev/fut87`. Aucune connexion, aucun appel au modèle.

| Page | Contenu | Avant |
| --- | --- | --- |
| `/dev/fut87/directions` | planche A, B, C, Relevé | |
| `/dev/fut87/accueil` | textes de l'accueil actuel, emblème légendé, trajectoire DRIAS de Marseille (valeurs figées et testées) | `/` |
| `/dev/fut87/decision` | **dossier réel du moteur** (`buildCommuneDossier`), paramètres `insee`, `prefs`, `adresse` | `/dev/fut87/avant/decision` |
| `/dev/fut87/logement` | logement témoin anonymisé, lectures dérivées par les fonctions de production | `/dev/fut87/avant/logement` |

**Fidélité au moteur.** « Ma décision » passe par `lireDossier`, testé : chaque texte des cartes de la
minute se retrouve dans la lecture (rien n'est perdu), chaque texte affiché existe dans le dossier (rien
n'est inventé), le verdict est celui du plan mot pour mot, les sections suivent l'ordre de la minute. La
contradiction FUT-54 reste visible quand le moteur la produit. Seule la paire « correspond / correspond
moins bien » est mise en regard.

**Isolation.** Gabarit **et** pages renvoient `notFound()` en production côté serveur (testé dans le
code, et vérifié sur le build : les sept routes répondent 404 sous `next start`, l'accueil 200),
`noindex`, CSS en module, aucun fichier de production modifié.

## 5. Plan de migration (à n'exécuter qu'après validation)

1. **Primitives partagées.** Promouvoir `primitives.tsx` et `releve.module.css` en
   `src/components/releve/` ; ajouter les rôles typographiques `wdth` et les jetons de marge à
   `design-tokens.css` ; amender `DESIGN.md` (§ 2.1 grille à marge, § 3 données dessinées, § 6.3 surtitre,
   § 9.1 rôles). Fichiers : `design-tokens.css`, `globals.css` (`.glass`, `.card-verdict`), `DESIGN.md`.
2. **Écrans prioritaires.** Ma décision : `DossierDecisionSection.tsx`, `ConclusionBlock.tsx`,
   `DecisionFactRenderParts.tsx`, `FactCompositionCard.tsx`, `ControlesDuDossier.tsx`,
   `EnTeteDossier.tsx`, `rapport/page.tsx`. **Après** FUT-54 et FUT-26, qui touchent `conclusion-plan.ts`,
   `DecisionChecklist.tsx`, `LogementModule.tsx` et `rapport/page.tsx`. Puis Logement :
   `LogementModule.tsx`, `logement/*.tsx`, `PropertyPassport.tsx`, `PassportTiltScene.tsx`.
3. **Modules secondaires.** Territoire (`QuartierClimatData.tsx`, `TerritoryIdentityCard.tsx`,
   `TerritoryYearsBand.tsx` gardée telle quelle), Autour (`AutourModule.tsx`, `logement/AutourSection.tsx`),
   comparateur.
4. **Harmonisation.** Accueil (`FutureELanding.tsx`, en coordination avec FUT-50), Où vivre, pages Savoir,
   tunnel d'achat ; navigation laissée à FUT-86, mouvement à FUT-75.
5. **Nettoyage.** Retirer `GlassCard` et `ReportSection` du rapport, les surtitres mono capitales, la teinte
   `#c8b89a`, les emoji, les couleurs par plan tarifaire, le bandeau défilant ; supprimer `/dev/fut87`.

## 6. Accessibilité et responsive (vérifié sur les prototypes)

- 1440, 390 et 360 px : aucun défilement horizontal (mesuré). Sous 900 px la marge passe sous le texte ;
  sous 640 px les barres d'audit passent sous leur libellé. Deux jalons proches de la règle du temps
  passent sur deux lignes de libellés.
- Contrastes : uniquement des jetons déjà mesurés (≥ 4,5:1 pour le texte, `--ghost` à 4,69:1 sur la plaque).
- Clavier : liens, portes, coupe des échelles et « Données et limites » sont focusables, contour 2 px
  `--fg-hi`. Les ancres des gestes prioritaires visent les faits (`tabIndex=-1`, `scroll-margin`).
- Les figures ont un `aria-label` qui dit ce qu'elles montrent ; la couleur n'est jamais seule.
- Aucune animation (FUT-75 viendra après la validation).
- Non vérifié : lecteur d'écran réel, thème clair des prototypes, Safari.

## 7. Arbitrages du porteur (revue du 11/10/2026)

1. **« Le relevé »** : validé comme direction de travail, pas comme version achevée. Une passe de
   maturation (la V2) précède toute migration.
2. **Le papier clair** : retenu pour le dossier imprimable et l'export PDF, en chantier distinct, après la
   stabilisation de l'interface interactive.
3. **L'orange** : gardé, discret, dans l'identité (logo, actions de l'accueil) ; retiré de tout élément
   de donnée où il se confondrait avec un statut ou le registre compromis. Couleur de marque et couleur de
   jugement restent séparées.

**Ordre de migration demandé** : Ma décision, puis Logement, progressivement ; pas l'accueil en premier
(il dépend de FUT-50). Ma décision consomme la sortie du moteur : la migration attend la fusion de FUT-54.

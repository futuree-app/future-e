# FUT-87 · Directions artistiques, recommandation, design system et migration

Date : 11 octobre 2026 · Statut : **proposition, en attente de validation du porteur.**
Rien de ce document n'est appliqué au site public. Les prototypes vivent sous `/dev/fut87` (404 en
production) ; l'audit qui les fonde est `2026-10-11-fut87-audit-visuel.md`.

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
- Le verdict, les gestes prioritaires et le sommaire du dossier tiennent dans le premier écran.
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
| Marge | JetBrains Mono 11,5 px, casse normale | grain, preuve, source, date |

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
| Visualisation | `RegleDuTemps`, `RegleDeRang`, `Seuils`, échelle DPE, barres d'audit | (absent) |
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
  sous 640 px les barres d'audit passent sous leur libellé.
- Contrastes : uniquement des jetons déjà mesurés (≥ 4,5:1 pour le texte, `--ghost` à 4,69:1 sur la plaque).
- Clavier : liens, portes, coupe des échelles et « Données et limites » sont focusables, contour 2 px
  `--fg-hi`. Les ancres des gestes prioritaires visent les faits (`tabIndex=-1`, `scroll-margin`).
- Les figures ont un `aria-label` qui dit ce qu'elles montrent ; la couleur n'est jamais seule.
- Aucune animation (FUT-75 viendra après la validation).
- Non vérifié : lecteur d'écran réel, thème clair des prototypes, Safari.

## 7. Points à arbitrer par le porteur

1. **Valider « Le relevé »** comme direction, ou demander une autre combinaison.
2. **Le papier clair** : la planche B est la plus forte en lecture longue. Le système du relevé fonctionne
   aussi en thème clair (jetons existants) ; en faire le thème par défaut du **dossier imprimable** ou de
   l'export PDF est une piste qui ne touche pas la DA sombre de l'interface.
3. **L'accent orange** reste partagé avec le registre « compromis » (`DESIGN.md` § 11, point 1). Le
   prototype le retire du dossier, sauf pour ce registre.

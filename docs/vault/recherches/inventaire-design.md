# Le design de futur•e : signatures, système et patterns

> Terrain et doctrine du futur agent **Design Critic** (cf. `adr/ADR-0006`, architecture de
> l'équipe IA). Le Design Critic n'est pas le gardien de tous les pixels du projet. Il répond
> à UNE question : **« Cet écran sert-il la décision du lecteur, dans la voix et la direction
> artistique de futur•e, ou ajoute-t-il du bruit ? »**
>
> Cette page porte le **durable** : ce qui fait qu'un écran est de futur•e et le resterait même
> si React, Tailwind et les tokens disparaissaient. Le **code** porte le vivant
> (`design-tokens.css`, `globals.css`, les `<style>` colocalisés, les composants). Les **règles
> verrouillées** vivent dans `doctrine/design.md` et `doctrine/interface.md` : cette page ne les
> répète pas, elle les met en perspective. Elle découle du principe de tête de `doctrine/design.md`
> (la forme sert le fond) et des invariants n°4 (servir la décision) et n°5 (preuve).
> Construite en confrontant le code au 2026-06-26 ; l'état chiffré de ce jour est isolé,
> daté et périssable, en fin de page.

## La question-mère du Design Critic

> Un écran n'est pas réussi parce qu'il est beau. Il est réussi parce qu'il aide à décider
> sans mentir, dans la voix de futur•e.

C'est la traduction visuelle de l'invariant n°1 (on éclaire, on ne décide pas à la place) et
n°4 (une donnée n'a de valeur que si elle aide une décision), et du principe de tête de
`doctrine/design.md` (la forme sert le fond, jamais l'inverse).

### Le Critic est un éditeur, pas un directeur artistique

L'image juste n'est pas celle d'un designer qui crée. C'est celle d'un **rédacteur en chef** :
il ne dessine pas, il **coupe, hiérarchise, protège la ligne**. Précision qui le distingue d'un
futur agent éditorial : il est l'éditeur **de l'écran**, pas de la prose. Il enlève un élément
superflu, il remet un signal au premier plan, il refuse l'ornement ; il ne réécrit jamais une
phrase. Trois verbes le résument :

- **Protéger** : la lisibilité et l'honnêteté du signal. Dire non à l'ornement, au graphique qui
  fait joli sans rien raconter, à la fausse certitude.
- **Simplifier** : chercher en premier ce qui peut **disparaître sans perte**. Un écran de
  futur•e a peu d'éléments, chacun avec un rôle ; le bruit est l'ennemi par défaut.
- **Révéler** : faire apparaître le signal enfoui et **nommer ce qui manque** (une source
  inaccessible, un compromis tu, un mouvement qu'on ne voit pas). Pas une posture : un manque
  concret, désigné.

> Une belle interface qui fait douter d'un chiffre, ou qui en suggère une fausse certitude, est
> un échec de design, pas une réussite (la forme sert le fond, principe de tête de
> `doctrine/design.md`). La forme sert la doctrine éditoriale et la preuve, jamais l'inverse.

---

## Les signatures de futur•e (ce qui survit à un changement de techno)

Si demain toute l'UI était refaite en Swift, voici ce qui devrait survivre. Ce sont les
invariants visibles du produit, indépendants de React, de Tailwind et des tokens. Le Critic les
protège avant toute considération technique.

1. **Un écran raconte avant d'expliquer.** Le récit éditorial porte le sens ; le graphique
   illustre, il ne remplace jamais la voix. Une visualisation qui n'apprend rien qu'un paragraphe
   ne dirait mieux est de l'ornement.
2. **Peu d'éléments, chacun avec un rôle.** La densité n'est pas une qualité. Si un élément peut
   disparaître sans perte, il doit disparaître. La sobriété est la valeur par défaut, pas une
   contrainte subie.
3. **L'émotion vient du récit, jamais des couleurs.** La palette pose une atmosphère (verre
   sombre, chaleur orange) ; elle ne dramatise pas la donnée. Pas de rouge alarmiste pour faire
   peur, pas de vert rassurant pour flatter. L'invariant n°6 (parler à une intelligence, pas à
   une peur) vit aussi dans le pixel.
4. **Le chiffre est contextualisé avant d'être interprété.** On montre d'abord à quoi un nombre
   se compare (référence, répartition, mouvement), puis ce qu'il change. Jamais un chiffre nu
   présenté comme un verdict.
5. **Le drawer remplace le changement de page.** Le détail s'ouvre sur place (panneau qui glisse),
   il n'emmène pas ailleurs. La lecture reste continue ; on approfondit sans se perdre.
6. **Le texte porte le sens, le graphique l'appuie.** Conséquence directe de la signature n°1,
   posée à part parce qu'elle tranche une tentation récurrente : quand on hésite entre un beau
   graphe et une phrase juste, c'est la phrase qui gagne.
7. **L'élément distinctif raconte le lieu.** Ce qu'un écran met en avant doit dire quelque chose
   de ce territoire-là, jamais une donnée vraie mais inerte (« altitude modérée »). Une signature
   qui pourrait s'afficher à l'identique sur dix communes n'est pas une signature.

---

## Le système réel : quatre régimes de style, par choix

Le code n'a pas UN système de style, il en a **quatre**, et c'est délibéré. Le Critic doit savoir
lequel il regarde avant de juger.

1. **Tokens + Tailwind** (`design-tokens.css` + bloc `@theme` de `globals.css`) : la palette,
   l'échelle typo, l'espacement, les radii, le motion, un double jeu dark/light. La **couche
   nominale** du design-system, utilisée par les coquilles de page.
2. **Classes globales** (`globals.css`) : `.glass`, `.bg-glass-card`, `.auth-*`, `.account-*`,
   `.wizard-*`, `.horizon-*`. Réutilisables, tokenisées.
3. **`<style>` colocalisé** dans les composants complexes ou animés (le drawer de détail, les
   tooltips, le hero, la recherche de commune, la barre de chargement…) : le composant **possède
   son style de bout en bout**, valeurs en dur.
4. **`style={{}}` inline** sur de nombreuses pages, souvent avec une palette locale.

### Pourquoi cette architecture est assumée (et non une dette)

Un design-system pur (tout passe par les tokens) serait plus élégant sur le papier. Le projet a
choisi autre chose, pour des raisons qui survivent :

- **Un composant riche se possède.** Le drawer de détail est une primitive avec ses animations,
  ses états, sa frise, son accordéon. Le garder autonome (son `<style>` colocalisé) le rend
  **lisible d'un seul tenant** et **portable** : on le déplace sans démêler une cascade de
  tokens éparpillés.
- **Le découplage a un prix.** Tout faire transiter par la couche nominale couple chaque
  primitive au système global : un changement de token peut casser un composant à distance. La
  colocation **isole le risque** dans le fichier qu'on lit.
- **La dette est bornée et acceptée.** Recopier une couleur en dur dans une primitive est une
  dette réelle (si l'orange change, il faut repasser dessus), mais **circonscrite aux primitives**
  et jugée moins coûteuse que le couplage inverse. Les coquilles de page, elles, restent
  tokenisées.

> Conséquence pour le Critic : la **méthode** (couleur en dur vs token nommé) n'est pas son
> sujet. Tranché par le porteur (option A) : il ne signale couleur, radius ou thème que s'ils
> produisent une **incohérence qu'on voit à l'œil** (deux cartes voisines au orange différent,
> un coin arrondi qui jure, un panneau resté sombre sur une page claire). La pureté des tokens
> est un chantier technique séparé, pas le travail d'un critique de design.

### Le mode clair existe partout, sauf dans les primitives en dur

`design-tokens.css` porte un mode clair complet. Mais les primitives à `<style>` colocalisé
codent le sombre en dur et **ne suivent pas le thème**. C'est une vraie incohérence potentielle
(un drawer sombre ouvert depuis une page claire), pas un détail : à vérifier écran par écran.

---

## Les patterns d'écran déjà tranchés

Ces patterns sont la grammaire de futur•e. Le Critic juge la **conformité**, il ne les réinvente
pas. Le détail vivant est dans les fiches `/memory` citées.

### La carte-indicateur et son drawer (primitive centrale)

Une carte n'est pas un KPI mort, c'est **une porte d'entrée**. Au clic, le drawer glisse de la
droite (desktop) ou monte du bas (mobile) **sans quitter la page**. Contenu court et éditorial,
dans cet ordre : chiffre phare → répartition (barre visible) → faits → « ce que cela change »
(le récit) → encart « À savoir » optionnel → **sources repliées dans un accordéon discret** →
(option) question AskFuture. La narration **ne cite jamais les bases** ; l'accordéon sources, oui.
Gabarit climat tranché (`/memory: climat_card_gabarit`) : **face = mouvement, drawer = référence
→ trajectoire → récit ancré**. Honnêteté du signal > symétrie entre cartes.

### La hiérarchie des gloses (verrouillée, `doctrine/interface.md`)

Trois objets, trois rôles, à ne pas confondre :
- **`MetricTooltip`** (survol des cartes Quartier) : « pourquoi ce chiffre aide à comprendre »,
  ≤ 2 phrases / 35 mots, **jamais de source, jamais de méthode, jamais de seuil chiffré**.
- **`ChipTooltip`** (puces de critères /ou-vivre) : bulle **positive**, ce que le critère mesure,
  jamais de négation. Les critères évidents restent des puces nues (anti-bloat).
- **Accordéon sources / drawer** : c'est là, et seulement là, que vivent provenance, méthode et
  limites. Les limites méthodologiques vivent dans le **rapport**, jamais sur l'écran de
  validation des critères (le N3 a été rejeté).

### Le passeport Territoire et les grands signaux

Module Territoire refondu en **passeport + grands signaux par thème** (`/memory:
project_territoire_redesign`). Doctrine v2 tranchée mais pas encore codée : test d'inertie, trois
registres en face avant (mouvement / niveau / recensement), le futur DRIAS en face et la preuve
ERA5 au drawer, la signature portée par les badges du passeport. Un élément affiché doit
**raconter le lieu**, jamais être une donnée vraie mais inerte (`/memory:
feedback_signature_identitaire`).

### Le hero, le paywall, le comparateur

- **Hero** : kicker mono en capitales espacées, titre Serif italic grande échelle, sous-titre
  mesuré en espace ouvert. Le sous-titre dit la **décision / le compromis**, pas la donnée
  (`/memory: feedback_positionnement_compatibilite`).
- **Paywall** (`territoire/debloquer`, `pack-decision/conviction`) : page de **conviction**, pas
  de mur sec. Continuité du hero, aperçu réel gaté, « pourquoi c'est payant », honnêteté sur les
  modules non finis (`/memory: project_paywall_territoire`).
- **Comparateur / Pack Décision** : **révélateur d'arbitrages**, pas de score synthétique
  (invariant n°2, `ADR-0001`). Identité / forces / compromis ; matrice premium honnête,
  narratifs au rapport (`/memory: project_comparateur_complet`).

### Les contraintes éditoriales qui touchent le pixel

Portées par `doctrine/editoriale.md`, mais le Critic les voit à l'écran : vouvoiement, **zéro
tiret cadratin**, zéro point d'exclamation, zéro emoji, pas de score de risque global, pas de
comparaison des foyers. Un écran qui réintroduit l'un de ces interdits est un défaut de design
autant que d'écriture.

---

## Tensions ouvertes (à trancher par le porteur)

Le Critic ne juge pas ce qui n'est pas tranché : il **nomme** ces points comme tensions.

1. **Retokenisation des primitives.** L'option A est tranchée pour le *comportement du Critic*
   (il ne flague pas la méthode). Reste une question produit séparée : vise-t-on un jour à
   ramener les primitives vers les tokens, ou la colocation est-elle l'état cible définitif ?
   Chantier technique, pas mandat du Critic.
2. **Mode clair des primitives.** On rend les drawers/tooltips theme-aware, ou le produit est-il
   sombre par défaut et le clair secondaire ? Impact réel sur un drawer sombre en page claire.
3. **Échelle de radius vécue.** Des radii nommés mais beaucoup de px en dur : on aligne, ou on
   assume le pixel libre ? Le risque concret est la **discontinuité entre éléments voisins**.
4. **Largeur de lecture au-delà de la règle connue.** La règle « pas de `max-w` plus étroit que
   le bloc » est gravée, mais l'ensemble des largeurs n'a pas été audité écran par écran.
5. **Frontière Critic / Éditorial.** Tranchée : le Critic ne réécrit pas le texte, mais signale
   quand un défaut de forme révèle un défaut d'écriture. Le futur agent éditorial reprendra la
   prose. À garder nette quand cet agent existera.

---

## La grille du Design Critic (les questions à toujours se poser)

Le but n'est pas une checklist, c'est regarder juste. La première question d'abord, parce que
toute la philosophie va vers le retrait :

- **Qu'est-ce qui peut disparaître sans perte ?** Quel élément, quel graphique, quelle ligne ne
  gagne pas sa place ? Le bruit est l'ennemi par défaut.
- Cet écran aide-t-il à **décider**, ou se contente-t-il d'afficher ? (invariant n°1)
- Le graphique **raconte-t-il** quelque chose qu'un paragraphe ne dirait pas mieux ? (invariant n°4 + narration > graphiques)
- Y a-t-il une **affirmation chiffrée sans source** accessible (drawer / accordéon) ? (invariant n°3)
- La forme suggère-t-elle une **fausse certitude** (précision décorative, score global implicite) ?
  (la forme sert le fond + invariant n°5)
- Le chiffre est-il **contextualisé avant d'être interprété** ?
- L'élément distinctif **raconte-t-il le lieu**, ou est-ce une donnée inerte ?
- Le bon **pattern** est-il utilisé au bon endroit (carte/drawer, hiérarchie de gloses, hero,
  paywall de conviction) ?
- Une **incohérence visible** saute-t-elle aux yeux (radius qui jure, thème cassé, largeur qui
  coupe une phrase) ? Distinguer l'incohérence vue de la non-conformité théorique aux tokens.
- L'écran respecte-t-il les **interdits éditoriaux** visibles (tiret cadratin, exclamation,
  emoji, comparaison des foyers) ?

---

## Instantané au 2026-06-26 (périssable, ne pas considérer comme durable)

> Mesures de l'état du code au jour de la confrontation. Utiles pour situer l'ampleur des
> tensions ci-dessus, mais **datées** : elles vieilliront. La doctrine durable est au-dessus ;
> ceci est un audit ponctuel, à re-mesurer plutôt qu'à croire.

- **Couleurs** : ~466 valeurs hexadécimales en dur dans les `.tsx`, dont une masse recopie
  exactement les tokens. ~7 fichiers définissent une palette locale (`territoires/[slug]`,
  `professionnels`, `savoir`, `comparateur`, `LogementModule`, `MetricDrawer`,
  `LocalTensionContext`).
- **Radii** : ~149 `borderRadius` en px en dur, contre 10 radii nommés quasi inutilisés hors CSS.
- **Typo** : `var(--fs-*)` utilisé ~35 fois, `fontSize` px en dur ~35 fois (moitié-moitié).
- **Largeurs** : zoo de `max-w` (1100, 920, 860, 760, 680, 640, 560, 520, 500, 480, 440, 340,
  240) ; 1100 et 920 sont les conteneurs doctrine, le reste à trier.
- **Colocation** : ~15 composants portent un `<style>` scoping local en dur (dont `MetricDrawer`,
  primitive de référence, sombre figé sans variante claire).

## Liens

`doctrine/design.md`, `doctrine/interface.md`, `doctrine/editoriale.md`, `adr/ADR-0005-direction-artistique.md`,
`adr/ADR-0006-architecture-equipe-ia.md`, `adr/ADR-0001-pas-de-score-synthetique.md`,
`principes/invariants.md` (n°1, 3, 4, 5, 7, 10), `recherches/inventaire-sources.md` (terrain jumeau
du Data Curator). Fiches `/memory` : `climat_card_gabarit`, `project_territoire_redesign`,
`feedback_tooltip_no_sources`, `feedback_text_maxwidth`, `feedback_signature_identitaire`,
`feedback_positionnement_compatibilite`, `project_paywall_territoire`, `project_comparateur_complet`.

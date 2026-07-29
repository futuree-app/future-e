# Mini-audit de la famille éditoriale (Explorer · Savoir · Agir)

**Horodatage** : 2026-07-30 · **Étape 4** de `docs/handoff/2026-07-29-design-system-sequencage.md` ·
**Lecture seule** : aucun fichier de la famille éditoriale n'a été modifié.

**Question posée par le porteur** : ce que `DESIGN.md` doit prévoir pour Explorer, Savoir et Agir.
Trois surfaces instruites, comme demandé : `/chaleur` (hub thématique, plus sa déclinaison
`/chaleur/[insee_code]`), `/savoir/pollutions-invisibles` (contenu long), `/agir/canicule` (guide
pratique).

---

## Ce que la famille éditoriale est réellement, en chiffres

Elle est plus grosse que ce que le séquençage suppose. Ce n'est pas « le reste du produit » : c'est
la majorité de la surface publique.

| Mesure | Valeur |
| --- | --- |
| Pages portant leur propre feuille de style | **27** |
| Lignes de CSS injecté, cumulées | **2 266** |
| Pages déclarant un `const ACCENT` en dur | **10** (6 teintes distinctes) |
| Pages avec orbes flous | **25** |
| Pages avec le grain de bruit `feTurbulence` en `body::before` | **27** |
| Largeurs de lecture distinctes | **3** (960 px, 760 px, 680 px) |

Le CSS est injecté par `<style dangerouslySetInnerHTML>` dans chaque page, avec ses propres noms de
classes (`.page`, `.section`, `.article-card`, `.sources`, `.nav-inner`). Les blocs sont
majoritairement du copier-coller : `.page{position:relative;z-index:2;max-width:960px;margin:0
auto;padding:72px 28px 120px;}` est identique caractère pour caractère entre `/chaleur` et
`/inondation`.

**Conclusion de cadrage** : l'audit du 29/07 disait « deux langages, pas deux dialectes » (l'objet
`styles` JS de l'accueil contre les tokens du rapport). Il y en a **trois**, et le troisième est le
plus étendu.

---

## Ce que chaque surface fait déjà bien, et qu'il faut protéger

### `/chaleur` — le hub thématique

Structure claire en quatre blocs nommés dans le code : **Territoire** (chercher sa commune),
**Comprendre** (quatre lectures), **Agir** (le rapport, puis deux guides), **Signal** (bulletin de
veille). Cette séquence est bonne : elle va du lieu du lecteur vers la compréhension, puis vers
l'action. Elle est déjà responsive (media query 768 px, grilles qui retombent en une colonne).

### `/savoir/pollutions-invisibles` — le contenu long

**Le meilleur traitement des sources du produit**, rapport compris. Deux niveaux :

- **une source inline**, au fil du texte, sur l'affirmation elle-même
  (`<span class="src">Source : GisSol · ADEME</span>`) ;
- **une bibliographie finale**, en grille à deux colonnes, où chaque entrée décrit ce que la source
  contient avant de donner le lien.

C'est le patron à graver. Un lecteur peut remonter d'une phrase à son fondement sans quitter la
page.

### `/agir/canicule` — le guide pratique

Quatre mouvements, dont un que personne d'autre ne fait : « **Ce que vous n'avez pas à faire** ».
Une section de démystification à l'intérieur d'un guide d'action est un geste éditorial rare et juste
pour futur•e : elle vaut autant que la liste des gestes, et elle protège le lecteur du bruit
ambiant. Les autres mouvements sont « ce qui fonctionne au niveau du logement », « ce que vous pouvez
faire avant le prochain épisode », « selon votre situation ».

### `/chaleur/[insee_code]` — la meilleure articulation du produit

La page thème × commune est le seul écran public qui relie correctement les quatre destinations :
le paywall **argumenté** (`/territoire/[insee]/debloquer?source=chaleur`, jamais `/#pricing`), les
pages Savoir, le guide Agir, le comparateur. C'est le modèle d'articulation à généraliser.

À noter au passage : elle utilise le bon chemin de paywall là où `/rapport` utilise encore
`/#pricing` (point déjà relevé en étape 2).

---

## Les cinq fractures

### 1. La navigation se coupe en deux au milieu de la famille

| Famille | Navigation |
| --- | --- |
| Explorer, hubs et classements (7 pages) | `<Navbar />`, la vraie, avec ses menus |
| Savoir, Agir, et les pages `[insee_code]` (19 pages) | une **nav locale sticky**, réécrite dans chaque page |

Un lecteur qui passe du hub `/chaleur` à `/savoir/pollutions-invisibles` **perd les menus du site** :
plus d'accès à Où vivre, au comparateur, à son rapport. Il ne lui reste qu'un fil d'Ariane maison.
C'est la fracture la plus coûteuse, parce qu'elle frappe exactement le lecteur qui explore, donc
celui qu'on veut convertir.

### 2. La donnée vivante n'est jamais datée pour le lecteur

Les pages Explorer portent de la donnée et se revalident toutes les 24 h (`revalidate = 86400`).
**Aucune n'affiche sa fraîcheur.** Le rapport, lui, le fait.

Pire, la seule date affichée sur `/chaleur` est **écrite à la main et fausse** : « Bulletin de veille
· Mai 2026 » alors que nous sommes fin juillet. Un bloc nommé « Signal en cours » qui affiche une
date morte détruit exactement la crédibilité qu'il cherche à établir.

### 3. Le bloc « Signal » n'est pas sourçable

Les quatre cartes de veille de `/chaleur` portent des affirmations chiffrées fortes (« 57 communes
dépasseront 60 jours de canicule par an », « +18 % de surmortalité lors des canicules prolongées »)
avec un nom d'organisme en surtitre, **sans lien, sans date de publication, sans titre de document**.
Elles sont écrites en dur dans le JSX. Un lecteur ne peut pas les vérifier ; un moteur ou un LLM ne
peut pas les citer.

C'est l'écart le plus violent avec le régime du rapport, où une teinte est une affirmation
vérifiable. Et c'est un écart *avec la page Savoir voisine*, qui, elle, source correctement.

### 4. Trois largeurs de lecture, aucune raison écrite

960 px sur les hubs Explorer, 760 px sur Savoir et Agir, 680 px sur certains blocs internes. À quoi
s'ajoutent 1 100 px (rapport, et les navs locales de la famille) et 920 px (comparateur). Cinq
largeurs pour un même produit, sans règle qui dise laquelle sert à quoi.

### 5. Six accents thématiques en dur, hors tokens

`#f87171` (chaleur), `#60a5fa` (inondation), `#38bdf8` (submersion), `#fb923c` (voiture),
`#a78bfa` (pollutions), `#c8b89a` (professionnels). Déclarés en `const ACCENT` et interpolés dans la
string CSS. Aucun ne vient de `design-tokens.css`.

Ce n'est pas illégitime en soi : un thème a le droit d'avoir une couleur. Mais la question du statut
de la couleur, que l'audit du 29/07 pose comme la rupture centrale, se pose **ici aussi** et n'a pas
de réponse : ces teintes sont-elles sémantiques (le thème) ou décoratives (l'ambiance de page) ?
Aujourd'hui elles sont les deux : `#f87171` colore le surtitre, le titre en italique, le CTA, la
bordure des cartes de signal **et** l'orbe flou de fond.

---

## Ce que `DESIGN.md` doit prévoir, concrètement

1. **Un gabarit éditorial unique, en trois variantes.** Hub thématique (Explorer), contenu long
   (Savoir), guide d'action (Agir). Mêmes primitives, mêmes noms, mêmes tokens. Les 2 266 lignes de
   CSS dupliqué ne sont pas un problème de propreté : c'est ce qui garantit que la famille
   continuera de diverger tant qu'elle n'a pas de gabarit.
2. **Une règle de navigation, sans exception.** La `Navbar` du site est la navigation de toute page
   publique. Un fil d'Ariane thématique s'ajoute, il ne remplace pas.
3. **La largeur de lecture par nature de page**, pas par page. Proposition à trancher : la prose
   longue tient une mesure étroite, la donnée en grille tient la mesure large, et les deux
   s'alignent sur le même conteneur quand elles cohabitent.
4. **Un contrat de source pour l'éditorial**, calqué sur `/savoir/pollutions-invisibles` : source
   inline sur l'affirmation, bibliographie descriptive en fin de page. Et une règle nouvelle qu'aucune
   page n'applique aujourd'hui : **un chiffre affiché porte le document qui le fonde et sa date**,
   pas seulement le nom de l'organisme.
5. **Une règle de fraîcheur.** Toute page qui affiche de la donnée vivante affiche sa date de
   lecture, **calculée**, jamais écrite à la main. Corollaire : un bloc de veille dont le contenu est
   figé dans le JSX ne devrait pas s'appeler « Signal en cours ».
6. **Le statut des accents thématiques.** Six teintes à faire entrer dans les tokens avec un rôle
   écrit, ou à réduire. Cette décision est la même que celle du sable `#c8b89a`, parquée en étape 5 :
   elles se tranchent ensemble.
7. **Le patron d'articulation de `/chaleur/[insee_code]`**, à généraliser : depuis une page
   thématique, le lecteur doit toujours pouvoir aller vers sa commune, vers le fondement (Savoir),
   vers l'action (Agir), et vers le paywall **argumenté**.

---

## Ce qui appartient au porteur, pas à `DESIGN.md`

- **Le bulletin de veille de `/chaleur`** : quatre affirmations chiffrées non vérifiables, dont une
  datée de deux mois en retard. Trois issues, à trancher : les sourcer proprement, les rendre
  dynamiques, ou supprimer le bloc. Rien n'a été touché.
- **La frontière Savoir/Agir** reste dans l'état parqué décrit par la fiche mémoire
  `project_hubs_savoir_agir` (un thème = un slug jumeau). Cet audit n'y touche pas, mais il en
  confirme le besoin : `/agir/canicule` renvoie vers `/savoir/canicule` et `/territoires/canicule`,
  deux routes servies par des gabarits différents.
- **Le CTA de fin de `/agir/canicule`** pointe vers `/ou-vivre`, jamais vers la commune du lecteur ni
  vers son rapport. Un guide d'action lu par quelqu'un qui a déjà une commune en tête ne lui propose
  rien sur sa commune.

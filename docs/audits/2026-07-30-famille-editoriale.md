# Mini-audit de la famille éditoriale (Explorer · Savoir · Agir)

**Horodatage** : 2026-07-30 · **Étape 4** de `docs/handoff/2026-07-29-design-system-sequencage.md` ·
**Lecture seule** : aucun fichier de la famille éditoriale n'a été modifié.

**Question posée par le porteur** : ce que `DESIGN.md` doit prévoir pour Explorer, Savoir et Agir.
Trois surfaces instruites, comme demandé : `/chaleur` (hub thématique, plus sa déclinaison
`/chaleur/[insee_code]`), `/savoir/pollutions-invisibles` (contenu long), `/agir/canicule` (guide
pratique).

**Complété le 30/07** après un retour du porteur donnant l'histoire du chantier, et un retour externe
(ChatGPT) sur la navigation. Toutes les affirmations vérifiables de ce retour ont été confrontées au
code ; ce qui suit ne retient que ce qui a été constaté. Sections ajoutées : « Comment on en est
arrivé là », « Deux régimes économiques », « Le lot minimal avant lancement », et l'annexe menu.

---

## Comment on en est arrivé là

Le désordre est stratifié, et connaître l'ordre des couches change ce qu'il faut en faire. Dans les
mots du porteur (30/07) :

1. **Les pages Savoir d'abord**, écrites une par une, par envie éditoriale.
2. **Puis quelques pages Agir**, pensées comme contrepartie payante de **« Le Fil »**, l'abonnement
   depuis écarté (cf. `project_le_fil_ecarte`).
3. **Puis l'idée des hubs**, appliquée à deux enjeux seulement, chaleur et inondation.
4. **En parallèle, l'envie de pages par commune en masse**, pour le référencement.

Aucune de ces couches n'est fausse. Elles ont simplement été posées sans que la précédente soit
close, et le gabarit générique `savoir/[slug]` appartient à une génération du produit dont la
doctrine a changé depuis.

**Position du porteur** : Explorer n'est pas le chantier principal avant le lancement, mais doit être
**propre sans être parfait** au moment de lancer. La section « lot minimal » plus bas est écrite pour
cette contrainte : elle ne construit rien, elle retire.

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

## Les huit fractures

Les cinq premières viennent de la lecture des trois surfaces demandées ; les trois dernières du
recoupement fait le 30/07.

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

### 6. Une même intention est servie par six familles d'URL

Pour le seul enjeu **chaleur**, neuf surfaces coexistent : `/chaleur`, `/chaleur/[insee]`,
`/chaleur/villes-les-plus-exposees`, `/savoir/canicule`, `/savoir/canicule/[insee]`,
`/territoires/canicule`, `/territoires/canicule/[insee]`, `/savoir/chaleur-sante-mentale`,
`/agir/canicule`. Six d'entre elles répondent à la même intention (« la chaleur à telle commune »).
L'enjeu inondation reproduit la structure à l'identique.

**Un cas est cassé, pas seulement redondant.** `/savoir/cadmium/page.tsx` est un article rédigé à la
main, et la route statique masque la route dynamique : la clé `cadmium` de `SAVOIR_HUBS` est du
**code mort, inatteignable**. Mais `/savoir/cadmium/[insee_code]` reste servi par le gabarit
générique. Le parent est un article de la génération actuelle, l'enfant une page de la génération
legacy. Un lecteur qui descend de l'un à l'autre change de produit sans le savoir.

**Le sitemap aggrave la sélection.** Il soumet `/savoir/canicule` (générique, score sur 100) en
priorité 0.7 **et** `/chaleur` (sur mesure) en 0.9 : les deux concourent. Pire pour l'inondation,
où `/inondation` **n'est pas dans le sitemap du tout** alors que `/savoir/submersion` y est. Sur cet
enjeu, la seule page soumise à l'indexation est la plus faible des deux. Aucun `noindex` nulle part.

### 7. Deux régimes économiques pour la même intention

C'est le constat le plus coûteux de cet audit, et il répond à une question que le porteur se posait
encore (« faut-il rendre Savoir et Agir gratuites maintenant que Le Fil est mort ? »).

**La réponse est : c'est déjà fait, et bien fait.** Les cinq pages Agir qui montent `PaywallGate` le
font en `variant="open"`, un mode qui ne cache rien et pose seulement un CTA. Les deux autres
(`canicule`, `pollutions-invisibles`) n'ont pas de gate. Les articles Savoir écrits à la main non
plus. La mort du Fil n'a laissé aucune dette de gating.

**Un seul contenu est réellement gaté dans toute la famille** : `/savoir/[slug]/[insee_code]`, en
`variant="report"`. C'est le croisement thème × commune, donc exactement la diagonale de la doctrine
`project_frontiere_savoir_agir`, et exactement ce que promet `/pourquoi`.

Le problème est ailleurs :

| Page commune | Régime |
| --- | --- |
| `/chaleur/[insee]` | **entièrement ouverte**, CTA vers `debloquer` |
| `/inondation/[insee]` | **entièrement ouverte**, CTA vers `debloquer` |
| `/territoires/[slug]/[insee]` | **entièrement ouverte** |
| `/savoir/[slug]/[insee]` | **contenu gaté** derrière le 14 € |

Sur « la chaleur à Nîmes », une famille montre tout, l'autre en cache une partie. Même donnée, même
intention, deux réponses commerciales, et le lecteur venu d'un moteur est récompensé ou puni selon
l'URL que le moteur a retenue.

**Et le seul contenu payant de la famille vit sur le gabarit legacy**, celui au score composite sur
100 que la doctrine interdit. La seule page qui vend dans Explorer est la plus faible du lot.

### 8. Le CTA de fin des pages Agir est centralisé

`PaywallGate.tsx:123` porte « Agir sur un risque, c'est une chose. Choisir où vivre en les pesant
tous, c'en est une autre » et le bouton « Trouver où vivre ». C'est **un seul point de correction**
pour les sept guides, pas sept.

Le fond reste à revoir : un lecteur de « Se préparer à la canicule » habite peut-être déjà sur place,
aide un parent, est locataire, ou n'a aucune intention de partir. Le CTA ne lui propose que de
déménager.

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

8. **La canonicité, avant tout le reste.** La règle qui manque n'est pas une taxonomie :
   **un enjeu = un hub = une famille d'URL communale = un guide.** Appliquée à la chaleur, elle fait
   passer neuf surfaces à quatre. Tant qu'elle n'est pas posée, aucun menu ni aucun gabarit ne tient,
   parce qu'ils exposeront toujours des fragments de trois générations.

---

## Le lot minimal avant le lancement

Écrit pour la contrainte du porteur : propre sans être parfait, Explorer n'étant pas le chantier
principal. **Aucun de ces gestes ne construit un gabarit, une page ou un composant.** Ils retirent.
Classés par rendement.

1. **Faire mourir le gabarit générique.** Rediriger `/savoir/canicule/*` vers `/chaleur/*` et
   `/savoir/submersion/*` vers `/inondation/*`, où les hubs sur mesure existent déjà et sont
   meilleurs. Ce seul geste règle en une fois le score legacy, le gating incohérent et la moitié de
   la collision d'URL.
   **Cas non couverts, à trancher** : `feux`, `secheresse`, `pollens` et `cadmium` n'ont pas de hub
   sur mesure vers quoi rediriger. Pour `cadmium` et `pollens`, la doctrine Data Curator tranche
   déjà : la donnée est départementale ou zonale, donc une page par commune ment sur sa granularité,
   et la suppression est la bonne issue. Pour `feux` et `secheresse`, il reste à choisir entre
   supprimer et conserver en attendant un hub.
2. **Corriger le sitemap** dans le même geste : retirer `/savoir/canicule` et `/savoir/submersion`,
   ajouter `/inondation`, qui n'y figure pas.
3. **Sortir les quatre badges « Bientôt » du header** (`src/config/navigation.ts`). Une navigation
   qui annonce quatre choses inexistantes est le signal d'inachèvement le plus visible au lancement.
4. **Sortir la colonne « Par profil »** du dropdown Explorer. « Je cherche à déménager » est un
   doublon pur de `/ou-vivre` ; « J'utilise beaucoup ma voiture » est en réalité l'enjeu Mobilité et
   remonte dans la colonne des enjeux ; les deux autres sont des « Bientôt ». Sur le fond : la
   doctrine produit dit que **l'archétype se prend au moment, jamais à la démographie**, ce qui
   disqualifie « J'ai des enfants » comme entrée de menu.
5. **Monter la vraie `Navbar`** sur les 19 pages à nav locale. Mécanique, aucun arbitrage.
6. **Supprimer ou dater le bulletin « Signal en cours »** de `/chaleur`.

**Laissé au post-lancement** : le système de composants partagés (2 266 lignes), la page `/explorer`,
les hubs sur mesure pour les trois enjeux restants, la refonte du CTA de `PaywallGate`.

**Sur le référencement en masse : la bonne nouvelle d'abord.** Le site est **entièrement fermé au
crawl** aujourd'hui, vérifié en production : `public/robots.txt` porte `Disallow: /` et
`src/app/layout.tsx` pose `robots: { index: false, follow: false }` sur toute l'application. Rien
n'est indexé, donc **aucune des collisions décrites plus haut n'a encore coûté quoi que ce soit**.
Le porteur a une fenêtre entière pour les régler.

Le corollaire est le vrai avertissement, et il est net : **la canonicité doit être tranchée avant de
lever le `Disallow`**, pas avant d'écrire les pages. Ouvrir le crawl sur l'état actuel soumettrait
six familles concurrentes sur la même intention, dont la plus faible est celle que le sitemap
pousse. La règle existe déjà et suffit : **une page commune n'existe que si la donnée est réellement
communale.**

Ce point recoupe la pile d'action déjà arrêtée par les agents de convergence le 29/06 (fiche
`project_frontiere_savoir_agir`) : retirer le score et dégater, puis dédoublonner, puis corriger le
sitemap, et **lever le `noindex` en dernier**. Cette pile n'a pas bougé depuis un mois.

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

---

## Annexe · Proposition de navigation, NON TRANCHÉE

Le porteur n'a pas décidé la navigation et ne souhaite pas la décider maintenant. Ce qui suit est une
proposition, conservée pour l'instruction future. **Rien n'a été appliqué.**

### L'état actuel

Cinq entrées de niveau 1 : `Où vivre` · `Explorer ⌄` · `Mon rapport` · `Comparateur` ·
`Pourquoi futur•e`. Deux problèmes que le niveau 2 ne peut pas rattraper.

**`Où vivre` et `Comparateur` sont le même moteur.** La doctrine du dépôt le dit déjà (un moteur,
trois portes ; le comparateur est un arbitrage **downstream**). Deux entrées de niveau 1 obligent le
lecteur à deviner leur différence, et le comparateur suppose des candidats déjà en main : le poser
au niveau 1 le propose avant qu'il y ait quelque chose à arbitrer.

**`Mon rapport` est un possessif sans référent** pour un visiteur anonyme, et `requireCurrentUser`
le renvoie vers `/connexion`. Une entrée de menu public sur cinq mène à un formulaire de connexion.

### La proposition

Le menu s'adapte à l'état de connexion : un menu public vend, un menu connecté navigue.

```
Anonyme :    Où vivre        Explorer ⌄        Pourquoi futur•e
Connecté :   Mon rapport     Mes biens     Explorer ⌄     Où vivre
```

Le comparateur quitte le header et devient une porte à l'intérieur de « Où vivre », plus une action
dans chaque hub d'enjeu (« comparer deux communes sur la chaleur »). Il gagne d'arriver au moment
où le lecteur a des candidats.

Le dropdown Explorer, **une seule colonne, une ligne par enjeu** :

```
PAR ENJEU

Chaleur et canicule          Jours > 30 °C, nuits tropicales, santé
Inondation et littoral       Crues, submersion, assurabilité
Feux et sécheresse           Exposition, eau, prévention
Santé environnementale       Air, sols, industrie, maladies
Mobilité                     Voiture, transports, dépendance

                 Les cinq enjeux, leurs lectures et leurs guides →
```

Ni colonne profils, ni colonne guides, ni badge « Bientôt ». Cinq lignes, cinq destinations qui
existent.

**Pourquoi pas de colonne « Guides pratiques »**, que le retour externe proposait : il énonce par
ailleurs, à juste titre, que Savoir et Agir doivent devenir des **modes de lecture à l'intérieur d'un
enjeu** plutôt que deux bibliothèques séparées. Une colonne de guides dans le header est exactement
la bibliothèque séparée qu'il récuse. Les guides apparaissent dans le hub de leur enjeu.

### Le point le plus contestable

La disparition du comparateur du header. Argument contre : c'est une porte d'entrée directe et
nommée, que des visiteurs peuvent chercher par son nom. Argument pour : elle propose un arbitrage à
qui n'a encore rien à arbitrer, et elle dédouble « Où vivre » dans l'esprit du lecteur. À trancher
par le porteur.

### Une page `/explorer`, avec une réserve

Explorer n'a aujourd'hui aucune destination propre, seulement un dropdown. Le besoin est réel. La
réserve : si cette page devient un catalogue, elle crée une **sixième famille d'URL** au lieu d'en
supprimer quatre. Sa valeur est de rendre visible la règle de canonicité, un enjeu par bloc avec ses
quatre surfaces et rien d'autre.

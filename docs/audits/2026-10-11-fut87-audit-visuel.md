# FUT-87 · Audit visuel du produit réel

Date : 11 octobre 2026 · Branche : `feat/fut-87-direction-artistique` (issue de `feat/fut-67-dossier-premium`, non fusionnée)
Suite : `2026-10-11-fut87-direction-artistique.md` (directions, recommandation, design system, migration).
Captures : `docs/audits/fut87-captures/` (planches avant / après, desktop et mobile).

## Méthode et limites

- **Écrans publics** (accueil, Où vivre, qualification d'adresse, comparateur) : serveur de dev local,
  navigateur sans session, captures à 1440, 390 et 360 px après un défilement complet (plusieurs blocs de
  l'accueil ne s'affichent qu'au défilement et paraissaient vides sinon).
- **Écrans du dossier** (Ma décision, Territoire, Autour, Logement) : consultés en lecture seule sur la
  session du porteur, serveur de dev **sans clé du modèle** (aucune synthèse générée), sans changer le
  dossier actif. Ces captures n'ont pas été conservées : elles montrent une adresse réelle. Les
  comparaisons versionnées utilisent à la place `/dev/fut87/avant/decision` (vrai moteur, commune
  publique, projet de test) et `/dev/fut87/avant/logement` (blocs de production, logement fictif).
- **Linear** n'était pas accessible depuis cette session (connecteur non authentifié). Les tickets FUT-50,
  FUT-75, FUT-77, FUT-86 et FUT-87 n'ont donc pas été relus ; l'audit s'appuie sur le brief transmis,
  `DESIGN.md` v2.1, `docs/vault/doctrine/design.md`, l'ADR-0005, la veille du 21/08
  (`docs/recherche-visuelle/`) et l'audit FUT-67.
- **Non audités** : le résultat du comparateur (il faut saisir des communes), le tunnel d'achat, le
  thème clair des écrans de dossier.

## Mesures dans le code

| Motif | Occurrences | Lecture |
| --- | --- | --- |
| Capitales mono espacées (`font-mono … uppercase`) | 379 | surtitres, étiquettes, preuves, boutons de navigation : le même grain partout, donc plus aucun relief |
| `letter-spacing` de 0,1 em et plus | 245 | même constat |
| `rounded-xl` / `rounded-2xl` | 117, plus 122 `borderRadius` en ligne | rayons de 10 à 16 px sur presque toute surface |
| `.glass` | 57 classes, plus 14 `GlassCard` | chaque section du dossier est une carte de verre |
| Emoji d'icônes | 3 (accueil, cartes des trois échelles) | interdits par `doctrine/editoriale.md` et `DESIGN.md` § 9.3 |

## Écran par écran

Notation : **+** ce qui fonctionne, **−** ce qui gêne, avec le problème visible.

### 1. Accueil (`/`)

- **+** Les cartes de faits du héros (« Nuits tropicales · Marseille, 90 nuits/an, en 2050 · +39 vs
  1976–2005, DRIAS ») sont le meilleur objet du site : une valeur, une comparaison, une source, un grain.
- **+** La photographie « Votre futur lieu de vie ne tient pas dans une annonce » est la seule image du
  produit qui ait un ton.
- **−** Hiérarchie : environ 250 px vides au-dessus du titre sur 1440 × 900, et les deux cartes flottent à droite
  sans relation avec le titre. Sur mobile, le titre et les deux boutons occupent tout le premier écran.
- **−** Deux usages, inégaux : « Trouver où vivre » (orange) et « Analyser ma commune » (bouton neutre qui
  ouvre un champ commune). L'usage « j'ai déjà une adresse » n'a pas de porte au premier niveau.
- **−** Les trois échelles sont trois cartes à filet bleu, vert, orange avec un emoji : exactement ce que
  `DESIGN.md` § 7.1 a retiré du rapport (la couleur ne dit pas l'échelle).
- **−** Tarifs : bandeaux « Pour commencer » vert et « Territoire · Autour · Logement » bleu, boutons vert,
  bleu et violet. C'est le « pricing coché à couleur par plan » que § 9.3 interdit.
- **−** Rythme : sept sections de même largeur, chacune dans un grand bloc à bord arrondi. Rien ne
  distingue un argument central d'un rappel.
- **−** Le bandeau des sources défile (§ 9.3 l'interdit aussi).

### 2. Où vivre (`/ou-vivre`)

- **+** Le champ d'écriture libre est clair et bien placé ; les exemples sont utiles.
- **−** Le titre reprend le motif « blanc puis italique orange » (« Découvrez où vivre, *selon ce qui
  compte pour vous.* »), présent sur six écrans : il est devenu un tic.
- **−** Un exemple dit « Une ville qui attire de nouveaux habitants » : le langage causal que FUT-36 retire
  du comparateur (non fusionné sur cette base).

### 3. Qualification d'une adresse (`/dossier`)

- **+** Sobre, une question, un champ.
- **−** Trois quarts de l'écran sont vides : la page annonce « trois échelles » sans les montrer, alors que
  l'emblème du hub les dessine déjà.

### 4. Ma décision (`/rapport`)

- **+** Le verdict en phrase, la portée (« commune + adresse »), « À contrôler en priorité » numéroté sont
  justes. L'emblème des échelles en colonne d'appui est l'objet le plus singulier du dossier.
- **−** Contradiction visible : étiquette verte « Bonne correspondance » et titre favorable, juste au-dessus
  de « Ce qui correspond moins bien ». Elle relève de FUT-54 (moteur), le design ne doit pas la masquer.
- **−** Toutes les sections sont des cartes de verre de même poids : le verdict, un point fort de deux
  lignes et un contrôle à mener ont la même bordure, le même rayon, le même fond.
- **−** Les preuves sont des pastilles mono en capitales (« PREUVE · RISQUE DE FEU DE FORÊT RECENSÉ ») : la
  preuve a l'air d'une étiquette de statut, et elle est loin de l'affirmation qu'elle fonde.
- **−** Le grain (« À l'échelle de la commune ») est une ligne grise isolée sous le titre de section.
- **−** Dans la carte « Votre projet », chaque critère porte « GARDER CE CRITÈRE · ÇA NE COMPTE PAS POUR
  MOI » en orange : l'orange est réservé au compromis dans le rapport (§ 5.4).
- **−** Aucune donnée n'est dessinée. Les rangs (« parmi les 20 % … ») et les seuils climatiques existent
  dans le moteur (`basis`) mais ne s'affichent qu'en mots.

### 5. Territoire (`/rapport/quartier`)

- **+** `TerritoryYearsBand`, la « mémoire du lieu » : une forme, une donnée réelle, des années
  nommées. Le meilleur modèle de visualisation du produit.
- **+** Le sélecteur d'horizon 2030 / 2050 / 2100.
- **−** Les « grands signaux » sont une grille de seize petites cartes identiques, valeur en mono colorée
  par thème : on ne voit pas lequel compte.
- **−** Le héros (« Ce que {commune} devient. *Territoire, climat, risques.* ») répète le motif italique ; la
  lecture immédiate est un bloc de prose dans un verre, sans chiffre mis en avant.

### 6. Autour (`/rapport/autour`)

- **+** Les distances alignées à droite, les sources sous chaque bloc (FUT-67 a remis l'essentiel en tête).
- **−** Liste longue et uniforme : boulangerie, école, poste, bois, tous au même poids, sans repère
  spatial alors que c'est l'échelle la plus spatiale.

### 7. Logement (`/rapport/logement`)

- **+** Le passeport du logement (sceau DPE, parcelle, scène inclinée) est un objet identitaire réel.
- **+** La lecture inondation par grain (« À cette adresse » / « À l'échelle de la commune ») et
  « Pourquoi elles ne disent pas la même chose » : la meilleure écriture de preuve du dossier.
- **−** Le passeport porte une teinte sable `#c8b89a` codée en dur, supprimée de la palette le 30/07.
- **−** La lettre DPE est un sceau isolé : elle ne dit pas où elle se situe entre A et G.
- **−** L'audit (FUT-67) est une liste de valeurs ; le parcours de 503 à 53 kWh se lit, il ne se voit pas.
- **−** Une dizaine de surtitres à pastille dans le module (le plafond de § 6.3 est de trois).
- **−** À 390 px, les blocs de production débordent de 8 px avec le logement témoin (mesuré sur
  `/dev/fut87/avant/logement`, cause non isolée : tout le conteneur s'élargit). À confirmer sur un vrai dossier.
- **−** L'adresse est écrite deux fois de suite avant le contenu (titre « Le bien de ce dossier », puis passeport).

### 8. Comparaison (`/comparateur`)

- **+** Formulaire numéroté 01, 02, clair.
- **−** Un « ? » orphelin en début de ligne dans le titre (la liaison insécable manque).
- **−** Même motif titre blanc puis italique orange.

## Transversal

**Ce qui rend futur•e interchangeable avec n'importe quel SaaS** (chaque point est visible ci-dessus) :

1. La carte de verre arrondie comme unité universelle : verdict, détail et rappel ont le même poids.
2. Les capitales mono espacées pour tout ce qui est petit, si bien qu'une source, un statut et un
   bouton se ressemblent.
3. Le titre en deux temps « affirmation blanche, *suite en italique orange* » sur six écrans.
4. Les couleurs par échelle et par plan tarifaire, que la doctrine a déjà condamnées pour le rapport.
5. Peu de données dessinées hors de la bande des années.

**Ce qui est déjà singulier et doit être gardé** :

1. **L'emblème des trois échelles** (cercle, carré, losange emboîtés, trame de mesure) : géométrie
   décidée, sans équivalent chez les concurrents. Il est aujourd'hui confiné à 224 px.
2. **La voix** : verdicts en phrases, gloses courtes, absence dite comme une information.
3. **La bande des années** : une forme qui est une donnée.
4. **Les six registres** de la charte v1.7 et leur logique (le non su en gris sans valence).
5. **Le passeport du logement** comme objet, et la lecture par grain de l'inondation.
6. **Le logo dessiné** et l'orange terreux `#E8823A`.
7. **Archivo** : son fichier variable porte un axe de largeur (62 à 125 %) que le produit n'utilise pas.

**Ce qui doit être transformé** : la carte de verre (réservée à une surface par mouvement), les
surtitres mono capitales (casse normale, numéro mono), la preuve en pastille (marge de preuve), le
grain en ligne grise (glyphe de forme), le sceau DPE (échelle complète).

**Ce qui doit être abandonné** : emoji, couleurs d'échelle et de plan tarifaire, bandeau défilant,
titre à suite italique orange, teinte sable codée en dur.

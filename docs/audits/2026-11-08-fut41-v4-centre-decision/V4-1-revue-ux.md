# FUT-41 · FUT-22 · Revue UX/UI indépendante de la V4, et prototype V4.1

8 novembre 2026 · branche `explore/fut-41-v4-centre-decision` · la V4 reste intacte (`/dev/centre-decision`) ; la V4.1 est sur `/dev/centre-decision-v41`.

Aucune règle de décision de production, aucune conclusion figée, aucune migration, aucun paiement, aucune génération et aucun compte réel n'a été touché. Aucune requête n'est partie vers un service de mesure pendant la recette : tout appel hors de localhost était bloqué. Rien n'est fusionné, déployé ni poussé.

**Méthode et limites.** J'ai observé la V4 à l'écran, à 1440, 390 et 360 px, en thèmes sombre et clair, à partir de ses 91 captures et de nouvelles captures écran par écran. J'ai relu ses sources, l'audit V4 et les décisions Z1 à Z12. La V4.1 a été construite, puis vérifiée par une recette automatisée (§ 7). **Aucun test d'utilisabilité avec des personnes n'a été mené** : les tâches A à H ci-dessous sont des parcours rejoués par un script et jugés à l'œil.

---

## 0. En bref

La V4 a l'ambition qu'il faut. Mais elle est **écrite par le moteur, pour quelqu'un qui connaît le moteur**. Elle confond un lieu et un logement ; elle parle de « départager », « établi », « ne se compare pas encore » ; elle répète la même conclusion à trois endroits ; et elle déroule sur téléphone un écran entier de texte par logement.

La V4.1 garde le contrat de comparaison de la V4 **sans le modifier**, et change cinq choses :

1. **La commune devient une piste à part entière.** Les logements se rangent dessous. Ce qui est lu à la commune est dit une fois, en tête, et marqué « vaut pour vos 2 logements de Nantes ».
2. **Ma décision dit d'abord où vous en êtes et quoi faire.** Une synthèse en quatre genres (bloque, fait la différence, à vérifier, manque), puis trois actions au plus, dans un ordre de règles dit à l'écran.
3. **Comparer donne le sens avant le détail.** Viennent dans l'ordre : en bref, ce qui bloque (une seule fois, Z12), ce qui fait la différence par échelle, puis ce que chaque option demande d'accepter avec son prochain geste. Suivent ce qui n'est pas encore comparable, en clair, et enfin le détail, échelle par échelle, avec une colonne par commune.
4. **Chaque piste a un seul geste.** Il est choisi par ce que futur•e sait déjà. L'appel commercial dit ce qu'une analyse apprendrait **et ce qu'elle ne dira pas**.
5. **« Et si… ? » répond en seaux** : pourraient changer, écartés à revoir, demanderaient une nouvelle analyse, restent valables, pas encore lus. Le panneau dit aussi ce qui ne peut pas être déduit.

Recette V4.1 : 72 captures (12 vues × 3 largeurs × 2 thèmes) sans débordement ni erreur ; 28 vérifications de tâches sur 28 ; clavier et mouvement réduit conformes ; 12 tests du modèle. La version statique (`prototype-v41/`) passe la même recette.

**Ouvrir** : `http://localhost:3041/dev/centre-decision-v41` (situations `?s=ref`, `complet`, `vide`, `b` … `h`), et la V4 sur `/dev/centre-decision`. Un lien « Voir la V4 » est présent dans la bande de démonstration.

---

## A. Diagnostic indépendant de la V4

### A.1 Ce qui fonctionne et doit rester

- **Le contrat de comparaison**, critère par critère, avec ses motifs nommés et la lecture partagée. C'est la vraie différence de futur•e, et la V4.1 le réutilise tel quel.
- **La condition sans compromis jamais compensée**, dite en tête.
- **La conclusion du dossier citée mot pour mot et datée**, avec « répond à votre Projet du … ».
- **La séparation des provenances** : annonce déclarée, observation, déclaration, preuve publique.
- **La boucle vérifier, répondre, réévaluer**, avec « ce qui reste inconnu ».
- **Le Relevé comme langage visuel** : marge de preuve, trait de registre court, plaque unique, filets plutôt que cartes.
- **Le lieu porté par l'URL** et le retour qui fonctionne.

### A.2 Les problèmes, par importance

**Bloquants pour la compréhension**

| # | Problème | Où | Solution V4.1 |
|---|---|---|---|
| B1 | **Une conclusion communale est affichée comme celle d'un logement.** « 4 impasse du Lavoir » cite « Kermoal répond moins bien… » sur sa ligne ; il n'y a aucun objet « commune » | Liste et fiche | La commune devient une piste ; sa conclusion s'affiche sur elle, ses logements dessous ; un logement non analysé dit « La commune : lue par le rapport de Nantes » et « Les abords : pas encore lus » |
| B2 | **On ne sait pas où regarder.** Le titre (« Votre recherche ») ne dit rien ; le Projet est une bande de texte ; la synthèse est une liste de phrases du moteur | Ma décision | Un titre-question (« Nantes ou Rennes ? »), une synthèse en quatre genres nommés, trois actions numérotées, et le Projet en carte à part |
| B3 | **Le vocabulaire du moteur est en première lecture** : « départage », « pourrait départager », « établi », « ne se compare pas encore », « Répond moins bien », « millésime », « règles » | Partout | « Fait la différence », « À vérifier », « Pas encore comparable » avec sa raison en clair (« ces deux analyses ne reposent pas sur les mêmes années de données ») |
| B4 | **Comparer commence par une matrice de 6 × N** et quatre sections de phrases qui se répètent ; la sélection passe par des cases à cocher non expliquées | Comparer, Ma décision | En bref (2 à 4 phrases), puis le sens, puis les options, puis le détail ; la sélection est groupée par commune, avec des raccourcis « Les communes / Les logements / Tout » |
| B5 | **Le bon geste n'est pas visible.** « Analyser l'adresse » n'existe que dans la fiche, et pour un seul cas ; le « Prochain pas » mélange règles et gestes | Liste | Un seul geste par piste, à droite de la ligne, choisi par l'état ; la valeur de l'analyse est dite sous le bouton |

**Gênants**

| # | Problème | Solution |
|---|---|---|
| G1 | La même hésitation apparaît dans « Où en est votre recherche », Faire le point et Comparer (et une condition non tenue deux fois dans Comparer : Z12) | Une seule synthèse par écran ; Faire le point fusionne avec l'accueil ; Z12 appliqué |
| G2 | Sur téléphone, chaque logement occupe un écran ; le Projet, s'il était déplacé, passerait devant la lecture | Ligne compacte (vignette, prix, trois échelles en mots, un geste) ; Projet en une ligne sous le titre ; plan et accès après les pistes |
| G3 | « Et si » liste des phrases par certitude, sans dire ce qui reste valable ni qui n'est pas concerné | Cinq seaux qui couvrent toutes les pistes, et un bloc « ce qui ne peut pas être déduit » |
| G4 | La fiche est longue (sept sections au même rang) | « Ce que futur•e sait » d'abord, puis la conclusion et le Projet par échelle ; l'annonce et l'historique repliés |
| G5 | Les glyphes cercle, carré et losange sont seuls dans la légende de la matrice : un langage à apprendre | Chaque glyphe porte son mot (« La commune · lue », « à la commune », « aux abords ») |

**Améliorations secondaires**

- La bande de démonstration déborde à 360 px (corrigé dans la V4).
- Des titres de groupe en langage de règle (« Son analyse répond à une ancienne version… »).
- L'absence de toute image : il n'existe aucun moyen de reconnaître un logement d'un coup d'œil.

### A.3 Les huit tâches (parcours rejoués et jugés, sans utilisateur réel)

| Tâche | V4 | V4.1 |
|---|---|---|
| **A** Je découvre Ma décision | Titre muet, Projet en texte, liste longue : on y voit un inventaire | Le titre et le sous-titre disent à quoi sert l'espace ; l'ajout propose « une commune » ou « un logement » |
| **B** Nantes ou Rennes, sans logement | **Impossible** : la V4 ne garde pas de commune sans logement | Deux pistes communales ; la comparaison se lit sur la commune ; « pas encore comparable » est expliqué ; le geste « Mettre à jour (gratuit) » est proposé |
| **C** Trois annonces : laquelle visiter ? | La matrice répond, mais il faut tout lire ; ce qui manque pour aller plus loin n'est pas dit | « En bref » nomme ce qui fait la différence et ce que chaque annonce attend ; chaque option a son prochain geste |
| **D** Un logement pas encore analysé | « Aucun dossier ne conclut » ; le geste n'existe que pour un cas | « Ce que futur•e sait » sur trois échelles ; un geste avec sa valeur : « lirait…, ne dira pas… » ; la commune dite comme telle |
| **E** Deux analyses de dates différentes | Motifs exacts mais techniques (« moteur engine-5 », « millésime ») | « Les règles de lecture de futur•e ont changé », « pas les mêmes années de données », plus le geste qui rend comparable |
| **F** Mon Projet a changé | Visible dans la marge (« Projet du 12 sept. pour une gare… ») | Dit dans la plaque, avec les deux valeurs, ce que cela empêche (la comparaison) et le geste gratuit |
| **G** Après une visite | Bon : réponse, effet, reste ; la note est rangée sous la condition | Conservé et simplifié : « Ce que cela change / Ce qui reste inconnu » ; la note apparaît à côté de la condition, avec sa provenance |
| **H** Écarter, puis retrouver pourquoi | Bon : raison et condition d'alors | Conservé ; « Et si » range l'écarté dans « Écartés à revoir », avec la raison et la mesure |

---

## B. Parcours et architecture de l'information

```
Ma décision (#/)                      la recherche : où vous en êtes, à faire, vos pistes, votre Projet
 ├─ Une commune (#/commune/c:44109)   sa lecture pour votre Projet (une fois), ses logements, son geste
 │    └─ Un logement (#/logement/id)  ce que futur•e sait, son geste, sa conclusion, le Projet par échelle,
 │         │                          à vérifier, notes ; annonce et historique repliés
 │         └─ Relevé (#/releve/id)    la profondeur d'une analyse ; retour à la fiche
 ├─ Comparer (#/comparer/ids[/échelle])  en bref → bloque → différence → options → pas comparable → détail
 └─ Et si… ? (panneau du Projet)      une simulation, rangée en seaux ; adopter = second geste confirmé
```

**Ce qui change, et pourquoi.**

| Nom V4 | V4.1 | Raison |
|---|---|---|
| Ma décision | **gardé**, comme accueil de la recherche | C'est l'espace (Y2) ; il s'ouvre sur la décision |
| Vos lieux / Vos logements | **devient « Vos pistes »**, rangées par commune | Une piste peut être une commune ou un logement ; « lieu » recouvrait les deux sans les distinguer |
| Faire le point | **fusionné dans l'accueil** (« Où vous en êtes » et « À faire maintenant ») | Il répétait la synthèse de l'accueil et de Comparer ; une page de moins, un nom de moins |
| Comparer | **gardé**, réorganisé | C'est le cœur ; le face-à-face devient un cas de la même page (deux pistes choisies) |
| Le Projet | **une carte toujours visible** (colonne sur ordinateur, une ligne sous le titre sur téléphone), avec « Et si… ? » | Il gouverne tout ; il doit se voir sans être ouvert |
| Relevé | **gardé** comme profondeur | Continuité FUT-91 |
| Fiche de commune | **nouvelle** | Indispensable dès qu'une commune est une piste |

**Gestes principaux.** « Comparer mes pistes » est le seul bouton orange de l'accueil ; viennent ensuite « Ajouter une commune ou un logement », « Et si… ? », et un geste par piste.

**Navigation sur téléphone.**

- **Accueil** : titre, Projet en une ligne, synthèse, actions, pistes.
- **Comparer** : les options se font glisser une par une (« Faites glisser pour voir les 3 options ») ; le détail devient une liste par condition.
- **Partout** : le retour passe par le fil d'Ariane et par le bouton retour du navigateur.

---

## C. Communes et logements : réponses aux sept questions (scénario de référence)

**Scénario de référence.**

- Nantes et Rennes ont chacune un rapport de territoire. Celui de Rennes a été fait sous l'ancienne gare, à 30 min, avec des données BPE 2024.
- À Nantes : « T3 quai de la Fosse » a un dossier d'adresse, et « T4 rue de la Convention » est enregistré sans analyse.
- À Rennes : « T3 près du Thabor » n'a pas d'adresse exacte.

| Question | Réponse de la V4.1 |
|---|---|
| 1. Représenter communes et biens sans tout mélanger | Deux objets distincts. La **commune** a un cercle, un nom en grand, l'état de sa lecture et sa conclusion. Le **logement** a une vignette, un prix déclaré et ses trois échelles en mots |
| 2. Une hiérarchie commune → logements ? | **Oui.** Les logements sont reliés à leur commune par un filet vertical. Un logement ne peut exister sans commune : en ajouter un fait apparaître sa commune, en lecture gratuite |
| 3. Comparer Nantes et Rennes sur le Territoire | Voie « La commune » : une colonne par commune. Dans le scénario, les nuits et le calme font la différence ; la gare n'est pas encore comparable (deux valeurs de la condition) ; la vie de quartier non plus, même à conclusion égale (années de données différentes) |
| 4. Comparer deux adresses sur les trois échelles | Voies « Les abords » et « Le logement » : une colonne par logement. Un logement non analysé y figure « pas encore lu », jamais favorable |
| 5. Une donnée communale commune à plusieurs biens | Dite **une fois**, sur la commune. Dans le détail, la cellule porte « vaut pour T3 quai de la Fosse, T4 rue de la Convention ». Dans une fiche : « À la commune de Nantes · vaut pour vos 2 logements de Nantes, pas pour ce logement en particulier » |
| 6. Commune analysée, adresse inconnue | Triade : « La commune · lue (rapport de Rennes) · Les abords · adresse manquante · Le logement · adresse manquante ». Geste : « Renseigner l'adresse ». La carte d'option dit « Lu à la commune seulement : sans adresse, ni les abords ni le logement ne peuvent être lus » |
| 7. Passer des territoires aux adresses sans perdre le Projet | Une seule page, une sélection, des raccourcis « Les communes / Les logements / Tout ». Le Projet (révision et date) est rappelé en tête ; l'échelle choisie est dans l'URL |

**Une inconnue au logement rappelle la commune**, sans en faire un fait du logement : « Des nuits fraîches l'été dans le logement (la commune : moins bien) ».

---

## D. Les appels à l'analyse et au Pass

| État | Ce que futur•e sait | Geste (V4.1) | Ce que le geste dit |
|---|---|---|---|
| Lieu simplement enregistré, adresse connue | La commune, si elle est lue | **Analyser l'adresse · 39 €** (ou « (inclus) » avec le Pass) | « Lirait le trajet jusqu'à la gare depuis l'adresse, le bruit aux abords, les commerces à pied ; en partie, le confort d'été. Ne dira pas si un médecin accepte de nouveaux patients : à vérifier par vous. » |
| Logement sans adresse | La commune, si elle est lue | **Renseigner l'adresse** (champ dans la fiche) | « Sans adresse, futur•e ne peut lire ni les abords ni le logement. » |
| Commune en lecture gratuite | Des repères nationaux | **Examiner la commune · 14 €** | « Saurez-vous si Angers tient vos conditions ? Le rapport lit vos 5 conditions à l'échelle de la commune. » ; la fiche liste les repères et dit qu'ils ne concluent rien |
| Commune avec rapport | Ses conclusions | **Ouvrir le rapport** | Sans appel commercial |
| Dossier ancien (Projet changé, règles ou données anciennes) | Des conclusions datées | **Mettre à jour avec votre Projet** (gratuit) | « Gratuit : ce dossier répond à une ancienne version de votre Projet. » |
| Logement analysé (dont sur le Pass) | Trois échelles | **Ouvrir le dossier** ; mention « Pass » sur la ligne | Aucun appel |
| Pistes déjà comparables | — | **Comparer mes pistes** | Le seul bouton orange de l'accueil |

**Règles.**

- **Un seul geste par piste.**
- **L'appel commercial porte un prix ou « inclus »**, et dit ce que l'analyse **ne dira pas**.
- **L'accès est raconté depuis la personne** (« Vous pouvez encore analyser 7 adresses jusqu'au 18 janv. »), jamais avec l'offre en sujet de phrase.

La table de capacité (« lit / en partie / jamais ») est fictive : elle doit venir du moteur (`criterionCapability`).

---

## E. Le Projet et « Et si… ? »

- **Place.** Une carte toujours visible, qui distingue « Sans compromis » (carré plein) de « Ce qui compte » (cercle), avec le budget marqué « non mesuré ». Le geste « Et si… ? » est dans la carte.
- **Simulation ou modification.** Le panneau s'ouvre sur « Simulation · votre Projet n'est pas modifié ». La question est posée en langue courante (« Et si j'acceptais 30 min au lieu de 20 min pour une gare ? »). L'adoption est un second geste, avec confirmation : « Votre Projet passera à la révision 4… Rien n'est relancé automatiquement. »
- **Les seaux, pour 30 min au lieu de 20.**
  - Pourraient changer : aucun dans le scénario de référence.
  - **Écartés à revoir** : T2 place Viarme (« quand votre limite était 20 min ; mesuré à 24 min, il tiendrait »).
  - **Demanderaient une nouvelle analyse** : Nantes et Rennes, lues à la commune sans trajet mesuré.
  - **Restent valables** : T3 quai de la Fosse (9 min, tient à 20 comme à 30).
  - **Rien à recalculer** : T4 Convention et T3 Thabor (pas encore lus).
  - **Ce qui ne peut pas être déduit** : « Une analyse ne se recalcule pas toute seule… Vos autres conditions ne changent pas. »
- **Réexaminer un écarté.** Depuis le seau, ou depuis sa fiche, qui dit « Votre Projet a changé depuis » ; il se remet en course d'un geste.

---

## F. Design : images, icônes, carte, mobile

**Photos : oui, mais seulement celles de la personne.**

- Une photo aide à **retrouver** un logement : c'est le premier repère d'une recherche.
- Elle introduit un **biais esthétique** dans une comparaison de faits. Décision V4.1 :
  - dans la fiche, la personne ajoute la photo de son annonce (« Elle reste sur votre appareil ») ;
  - dans les listes et les cartes d'options, une vignette de 40 à 64 px ;
  - **jamais dans le détail condition par condition** ;
  - **jamais d'image d'illustration** présentée comme le logement.
- Sans photo, une **plaque neutre** (initiales et nombre de pièces).
- Les communes n'ont pas d'image : leur signe est le cercle de l'échelle.

**Icônes et signes.** Les glyphes de la V4 (cercle, carré, losange) restent, car ils font le lien avec l'emblème et le Relevé. Mais **chaque signe porte son mot** : « La commune · lue », « aux abords », « dans le logement ». Le trait de registre court reste devant le sujet ; la couleur double le mot et ne le remplace jamais.

**Carte.** Un **plan schématique** des communes envisagées : positions proportionnées, distances à vol d'oiseau arrondies, nombre de logements par commune, sans fond de carte. Il répond à « est-ce loin l'un de l'autre ? » et dit lui-même que le trajet réel se mesure depuis une adresse analysée. Une vraie carte, avec les logements et la gare, n'aurait de sens qu'adossée à des adresses analysées (P2).

**Rythme.**

- Titres de section en taille « titre », formulés comme des questions ou des constats.
- Moins de texte en première lecture : l'apport long du geste ne s'affiche que dans la fiche.
- Plus d'air entre les groupes.
- Une seule plaque par écran (« En bref », la conclusion) ; des colonnes séparées par des filets.

**Mobile.**

- Le Projet en une ligne, la synthèse au deuxième écran.
- Des lignes compactes ; des options qui se font glisser, avec l'indication du nombre ; un détail en liste par condition.
- Thèmes clair et sombre recettés.

---

## G. Lisibilité éditoriale : le vocabulaire qui change

| Moteur (V4) | Première lecture (V4.1) | Où reste le terme exact |
|---|---|---|
| Départage / Différence démontrée | **Fait la différence** | Note de comparabilité |
| Pourrait départager / Différence possible | **Pourrait faire la différence** / **À vérifier** | idem |
| Ne se compare pas / Hors cadre | **Pas encore comparable** + la raison | idem |
| Millésime différent | « Ces deux analyses **ne reposent pas sur les mêmes années de données** : BPE 2025 et BPE 2024 » | La source et l'année restent citées |
| Moteur engine-5 / engine-6 | « **Les règles de lecture de futur•e ont changé** entre ces deux analyses » | Relevé, provenance |
| Grain / Un seul est examiné | « **Lu à la commune** », « **Lu pour un seul des deux** », « **Pas lu au même endroit** » | Marge de preuve |
| Répond moins bien (`mismatch`) | **Moins bien** | Relevé |
| Lecture partagée | « **Même commune : Nantes est lue une seule fois, pour les deux** » ; « vaut pour … » | idem |
| Analyse figée / Signature décisionnelle | « **Fait sous votre Projet du 12 sept.** : une gare à moins de 30 min (aujourd'hui : …) » | Historique |
| Faire le point | **Où vous en êtes** / **À faire maintenant** | aucun |

**Garde-fou.** La simplification ne retire jamais la raison. Chaque « Pas encore comparable » garde sa cause, et chaque « vaut pour » nomme les logements concernés.

---

## H. Comparatif avant / après (`avant-apres/`)

| Planche | Problème initial | Choix retenu | Effet attendu | Risque ou compromis |
|---|---|---|---|---|
| `A-accueil.png` | Titre muet, liste longue, hésitations en langage moteur | Titre-question, synthèse en quatre genres, trois actions, pistes par commune, Projet en carte | Savoir où l'on en est en dix secondes | Moins de détail en première lecture : il faut ouvrir la fiche pour les preuves |
| `B-communes-et-logements.png` | Conclusion communale sur la ligne d'un logement | Commune distincte ; triade « ce que futur•e sait » | Ne plus prendre un fait communal pour un fait du logement | Un objet de plus à comprendre (la commune) |
| `C-comparer.png` | Matrice d'abord, phrases répétées | En bref, puis bloque, différence, options, pas comparable, détail | Comprendre l'arbitrage d'abord, la matrice ensuite | La matrice, repliée en bas, sera moins vue ; elle reste la preuve |
| `D-z12.png` | Condition non tenue dite deux fois | Une fois dans « Ce qui bloque » ; la différence se calcule entre les options qui tiennent | Moins de redondance, rien de masqué | Il faut lire « Ce qui bloque » pour voir ce qui sépare l'option bloquée des autres |
| `E-fiche.png` | Sept sections au même rang | « Ce que futur•e sait » d'abord, puis le Projet par échelle (logement → abords → commune) | Voir tout de suite ce qui manque, et d'où vient chaque fait | L'historique et l'annonce, repliés, sont moins visibles |
| `F-et-si.png` | Phrases par certitude | Seaux qui couvrent toutes les pistes, et ce qui ne peut pas être déduit | Comprendre l'effet d'un changement sans croire à un recalcul | Les seaux supposent des mesures figées (à produire par le moteur) |
| `G-mobile-accueil.png` | Un écran par logement ; lecture tardive | Projet en une ligne, lignes compactes, synthèse au deuxième écran | Utilisable sur téléphone | La carte du Projet complète passe en bas |
| `H-mobile-comparer.png` | Matrice empilée très longue | Options qui se font glisser, détail en liste | Comparer deux ou trois options au pouce | Le défilement horizontal doit être découvert (indication ajoutée) |

Captures sources : `captures/` (V4) et `captures-v41/` (V4.1), nom `{vue}-{largeur}-{thème}.png`.

---

## I. Les cinq évolutions au meilleur potentiel

| # | Évolution | Problème résolu | Ce qui la distingue d'un gestionnaire de favoris | Dépendance au moteur | Coût | Statut |
|---|---|---|---|---|---|---|
| 1 | **Pistes communes et logements, et comparaison par échelle** | « Nantes ou Rennes, et quel appartement ? » dans un même espace | Une commune n'est jamais comptée deux fois ; une conclusion communale n'est jamais un fait du logement | Contrat critère par critère (FUT-22), grain par critère | Moyen (modèle, interface) ; lourd côté moteur | Nouvelle (V4.1) |
| 2 | **« En bref » et « Ce que chaque option vous demande »** | Comprendre l'arbitrage sans lire une matrice | Il dit ce qu'on accepte et ce qui reste inconnu, option par option | Les issues et les grains existants | Faible | Nouvelle |
| 3 | **Un geste par piste, avec sa valeur et ses limites** | Savoir quoi faire ensuite, et ce qu'une analyse apporterait | Il vend une réponse à une question du Projet, sans promettre plus | Table de capacité produite par le moteur | Faible à moyen | Amélioration |
| 4 | **« Et si… ? » en seaux** | Tester un compromis (30 min au lieu de 20) sans réécrire le passé | Il distingue ce qui reste valable, ce qui pourrait changer et ce qu'il faut relancer | Mesures figées par critère | Moyen | Amélioration |
| 5 | **Visites et notes rangées par condition** (FUT-21) | Une visite qui change la lecture | La réponse garde sa provenance, et la donnée publique ne change pas | Liste des vérifications et effets produits par le moteur | Moyen | Présent (V4), simplifié |

Écartées pour l'instant :

- **Le partage d'un arbitrage** : utile, mais il suppose le cloisonnement des Projets et les droits de partage de FUT-49.
- **La comparaison entre deux états de la recherche** : intéressante, mais second rang.

---

## J. Feuille de route (sur les tickets existants)

| Priorité | Évolution | Ticket |
|---|---|---|
| **P0** | La commune comme piste ; logements rangés dessous ; ligne compacte avec trois échelles en mots et un geste | FUT-41 (lot A étendu aux communes) |
| **P0** | Vocabulaire de première lecture (§ G) dans toutes les surfaces du centre ; tests de phrases | FUT-41, FUT-22, FUT-118 |
| **P0** | Accueil : où vous en êtes, à faire maintenant, Projet en carte ; fusion de Faire le point | FUT-41 |
| **P0** | Emblème sûr à l'hydratation (déjà au lot A) | FUT-41 |
| **P1** | Comparer V4.1 : en bref, bloque (Z12), différence par échelle, options, pas comparable, détail par voie, une colonne par commune | FUT-22 (lots C et D) |
| **P1** | Appels à l'analyse avec valeur et limites ; table de capacité produite par le moteur | FUT-41, FUT-49 |
| **P1** | « Et si » en seaux ; mesures figées par critère dans l'artefact | FUT-41, FUT-22 (`CadreDuCritere`) |
| **P1** | Mobile : options à faire glisser, détail en liste | FUT-118 |
| **P2** | Photo de l'annonce ajoutée par la personne (stockage local, puis compte) | FUT-41 |
| **P2** | Plan schématique, puis carte des adresses analysées | FUT-41 |
| **P2** | Partage d'un arbitrage en lecture | FUT-49 (mode mission) |

---

## K. Questions à arbitrer (huit)

| # | Décision | Recommandation |
|---|---|---|
| **Q1** | La commune devient-elle une piste à part entière (avec ou sans logement), et chaque logement se range-t-il sous sa commune ? | **Oui** : c'est la condition pour comparer des territoires et des logements sans les mélanger |
| **Q2** | Fusionner « Faire le point » dans l'accueil (« Où vous en êtes », « À faire maintenant ») ? | **Oui** : une page et un nom de moins, aucune perte de contenu |
| **Q3** | **Z12** : une condition sans compromis non tenue est dite une seule fois (« Ce qui bloque »), et « Ce qui fait la différence » se calcule entre les options qui la tiennent | **Oui** : vérifié sur la situation H ; l'écart entre les autres options reste visible |
| **Q4** | Adopter le vocabulaire de première lecture (§ G) et garder les termes exacts dans les détails méthodologiques | **Oui**, à soumettre à FUT-118 pour l'ensemble du produit |
| **Q5** | Photo de l'annonce ajoutée par la personne, en vignette dans les listes et les options, absente du détail ; aucune image d'illustration | **Oui** |
| **Q6** | L'appel commercial dit ce que l'analyse **ne dira pas** | **Oui** : c'est ce qui le rend honnête et crédible |
| **Q7** | Le face-à-face devient un cas de Comparer (deux pistes choisies) | **Oui** ; le garder comme lecture alternative si le test utilisateur le réclame |
| **Q8** | Mener le protocole à trois personnes sur la V4.1, en confrontant la V4 et la V4.1 sur les tâches A à H | **Oui**, avant le lot D |

---

## 7. Recette et fichiers

**Recette** : `outils/recette41.cjs` → `recette-v41.json`.

- 12 vues × 1440, 390 et 360 px × sombre et clair : **72 captures**, aucun débordement, aucune erreur console.
- **28 vérifications sur 28** :
  - A : ajout d'une commune et d'un logement, extrait cité ;
  - B : comparaison de communes ;
  - C : synthèse, une colonne par commune, « vaut pour », analyse simulée ;
  - D : savoir, valeur et limites ;
  - E : refus expliqué ;
  - F : Projet d'alors, mise à jour ;
  - G : réponse, note rangée avec sa provenance ;
  - H : raison d'écart, seaux, Échap et focus, adoption ;
  - Z12 : dite une fois ;
  - retour : même conclusion, bouton retour.
- **Clavier** : 24 arrêts, tous avec un contour visible.
- **Mouvement réduit** : aucune animation.
- La version statique `prototype-v41/` passe la même recette.

**Tests** : `modele41.test.ts`, 12 sur 12 (dont phrases rendues). Les 23 tests de la V4 restent verts.

**Non vérifié** :

- Safari ;
- un lecteur d'écran réel ;
- un téléphone physique ;
- **des personnes réelles**.

**Fichiers.**

- `src/components/prototypes/fut41-v41/` :
  - `modele41.ts` et ses tests ;
  - `scenarios41.ts`, `etat41.ts`, `CentreDecision41.tsx` ;
  - `vues41/` : accueil, comparer, fiches logement et commune, Relevé ;
  - `EtSi41.tsx`, `Ajout41.tsx`, `Plan.tsx`, `communs41.tsx`, `v41.module.css`.
- `src/app/dev/centre-decision-v41/page.tsx` (404 en production).
- `docs/audits/2026-11-08-fut41-v4-centre-decision/` :
  - `captures-v41/` ;
  - `avant-apres/` (8 planches) ;
  - `outils/recette41.cjs`, `outils/planches.cjs`, `outils/statique/` (`entree41.tsx`, `construire.sh v41`) ;
  - `prototype-v41/` : version statique, **non publiée**.

**Constats techniques déjà connus** :

- l'emblème non sûr à l'hydratation, toujours contourné par un rendu après montage ;
- FUT-173, préalable au lot D ;
- la suite de tests de l'environnement.

Aucun n'a bloqué la revue.

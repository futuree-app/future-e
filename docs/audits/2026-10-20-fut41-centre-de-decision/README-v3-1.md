# FUT-41 / FUT-22 · V3.1 : soustraire, clarifier, guider

20 octobre 2026 · branche `explore/fut-41-centre-decision` · prototype de revue, données fictives.

- **Prototype** : [`prototype-v3-1.html`](prototype-v3-1.html). Lien partageable :
  https://raw.githack.com/futuree-app/future-e/explore/fut-41-centre-decision/docs/audits/2026-10-20-fut41-centre-de-decision/prototype-v3-1.html
- **Captures** : [`captures-v3-1/`](captures-v3-1/).
- **Inchangés** : les fichiers V1, V2 et V3 (`prototype.html`, `prototype-v2.html`, `prototype-v3.html` et leurs comptes rendus).
- **Référence** : FUT-118, lu sur sa branche au commit `17303dbd` (« Archivo en largeur normale »), sans le récupérer ni le modifier.

Aucun changement du moteur, du stockage, des droits ni des prix. Aucune analyse payante, aucune génération IA, aucune PR, aucun déploiement.

---

## 1. Les trois moments d'une même recherche

La bande « Démonstration » du prototype fait passer d'un moment à l'autre : `0` avant tout lieu, `1` un premier lieu, `2` un deuxième lieu, `3` une recherche enrichie. Les situations de robustesse de la V3 restent sous « Autres situations ».

C'est **la même page** à chaque moment. Elle a trois zones :
- le Projet ;
- une phrase et un geste principal ;
- les lieux, suivis de « À faire ».

Seuls le geste principal et la densité changent.

| Moment | Ce que la personne lit d'abord | Geste principal (bouton orange, le seul) | Ce qui apparaît |
| --- | --- | --- | --- |
| **0 · Avant tout lieu** | « Aucun lieu n'est encore analysé. Ajoutez une commune ou une adresse… » | Ajouter un premier lieu | Rien d'autre : ni liste vide, ni tableau sans données |
| **1 · Un premier lieu** | « Vous avez analysé un premier lieu, 12 rue des Sternes. Voici ce qu'il faut en retenir. » | Voir ce que dit ce lieu | Le lieu est mis en avant, avec ses conclusions rangées en *Correspond*, *Avec un compromis*, *À vérifier*. « À faire » donne les deux vérifications. L'ajout d'un lieu est une tuile discrète en pointillé, pas une injonction |
| **2 · Un deuxième lieu** | « Deux lieux sont dans votre recherche. Une condition les distingue. Comparez-les pour voir dans quel sens. » | Comparer ces deux lieux | Le nouveau lieu porte la marque « nouveau » et un filet d'encre. « Faire le point » apparaît en lien secondaire. « À faire » commence par « Comparer… » |
| **3 · Une recherche enrichie** | « Cinq lieux sont dans votre recherche, et un a été écarté. 31 route de Kervily ne peut pas encore être comparé de façon fiable aux autres : votre Projet a changé depuis son analyse. » | Faire le point | « Comparer deux lieux » (mode de choix), le sélecteur « Afficher… » pour lire les lieux selon une condition, les lieux écartés repliés, « Depuis votre dernière visite » |

**Le passage de 1 à 2 se joue dans l'interface.** Au moment 1, la tuile « + Ajouter un lieu » ouvre un champ (simulé). « Ajouter et analyser » fait entrer 5 allée des Goélands dans la recherche. Le geste principal devient alors « Comparer ces deux lieux » (captures 06 et 07).

**Mesures du premier écran** (nom du premier lieu, bas de la ligne, en pixels depuis le haut) :

| Écran | Moment 1 | Moment 2 | Moment 3 |
| --- | --- | --- | --- |
| Bureau 1440 × 900 | 730 | 756 | 782 |
| Mobile 390 × 844 | 625 | 686 | 711 |
| Mobile 360 × 780 | 625 | 686 | 711 |

Dans toutes les situations, le contexte, le geste principal et le premier lieu tiennent avant tout défilement, mobile compris. En V3, à 360 px, il fallait traverser le titre, six boutons de conditions et deux paragraphes avant le premier lieu.

**Gestes pour comparer deux lieux :**
- à deux lieux, 1 geste (« Comparer ces deux lieux ») ;
- à plus de deux lieux, 4 gestes (« Comparer deux lieux », deux choix, « Comparer ») ;
- depuis la fiche d'un lieu, 2 gestes (ouvrir le lieu, puis « Comparer avec… »).

---

## 2. De la V3 à la V3.1

### Retiré

- **Les six boutons de conditions en tête de page.** Le Projet tient désormais en une ligne (« 6 conditions, dont 2 sans compromis · budget non mesuré · Voir mon Projet »). Les conditions sont dans le Projet déplié et dans le sélecteur « Afficher… » des lieux.
- **La légende des formes et les emblèmes comme identifiants.** Les formes accompagnent désormais la phrase « Commune, abords et logement analysés ».
- **La phrase d'aide permanente** « Ouvrez un lieu pour le lire, puis rapprochez-le… ». Le geste principal et les tuiles cliquables la remplacent.
- **Les deux modes visibles** « Lecture établie » et « Version rédigée ». La version rédigée simulée ne s'affiche plus que par une case de revue, dans « Autres situations ».
- **La colonne de lecture à droite et le panneau « Prochain pas ».** Une seule colonne de lecture, des vues pleines, et « À faire » comme seule source d'actions.
- **La répétition dans la comparaison.** La phrase d'entrée nomme les conditions sans leurs issues ; les issues sont portées par les pistes.

### Simplifié

- **Le vocabulaire.** « Révision », « hors cadre », « moteur », « engine », « lu sous l'ancienne version » ont disparu du premier niveau. Le parcours de test le vérifie sur toutes les vues de toutes les situations. Les équivalents :

  | V3 | V3.1 |
  | --- | --- |
  | « Lu sous la révision 1 » | « Votre Projet a changé depuis cette analyse » |
  | « Ne se compare pas » | « Ces deux lieux ne peuvent pas encore être comparés de façon fiable » |
  | « Mettre au même cadre » | « Mettre les analyses à jour pour les comparer » |
  | « Rapprocher » | « Comparer deux lieux » ; « Comparer avec… » |
  | Les poids 3, 2, 1 | « compte beaucoup », « compte », « compte un peu » |

  Les versions exactes restent au troisième niveau.
- **La comparaison.**
  - Quand elle est fiable : une phrase d'entrée (« Trois conditions distinguent ces communes : … Les compromis ne vont pas dans le même sens. »), puis quatre mouvements titrés (Ce qui les distingue, Vos conditions sans compromis, Pas encore établi, En commun).
  - Quand elle n'est pas fiable : une phrase, un geste (« Mettre à jour », simulation), « Pourquoi ? » pour les raisons, et « Ce que disait chaque analyse, à sa date » replié. Aucune piste n'est dessinée.
- **« Faire le point ».** Quatre blocs (Où vous en êtes ; Ce qui peut vous faire hésiter ; Pour avancer ; Ce que futur•e ne mesure pas), puis « Sur quoi repose ce point » replié. Dans la recherche enrichie, le point fait 7 phrases au lieu de 10 énoncés.

### Déplacé

- **Les conditions du Projet** : du haut de page vers le Projet déplié, et vers le sélecteur « Afficher… ».
- **Les prochaines actions** : une seule fonction `actions()` alimente « À faire » sur l'accueil (trois au plus) et « Pour avancer » dans le point. V3 avait deux sources.
- **La profondeur d'analyse** : de l'icône vers une ligne secondaire de la tuile, et vers la section « Ce qui a été analysé » de la fiche.
- **Les sources, dates, versions et le moteur** : vers le troisième niveau, « Voir les détails de cette analyse ».

### Rendu plus accessible

- **La tuile de lieu** se lit de haut en bas :
  - la commune (ou « Commune »), puis l'état dans la recherche ;
  - le nom du lieu, en 22 px ;
  - le type et la visite ;
  - la profondeur d'analyse, en mots et en formes ;
  - au plus deux lignes d'attention : ne tient pas, Projet changé, points à vérifier, notes.
- **La sélection** : en mode choix, chaque tuile affiche « Choisir », puis « Choisi » à l'encre avec un filet d'encre. Une barre collante dit « 12 rue des Sternes et 5 allée des Goélands · 2 sur 2 · Comparer · Annuler ».
- **Les preuves** : trois niveaux, au toucher et au clavier, jamais au survol (voir 3).
- **Le retour** : un fil (« Ma recherche / Faire le point / Comparaison »). Échap remonte d'un niveau, et l'accueil retrouve sa position de défilement.

---

## 3. Les preuves en trois niveaux

| Niveau | Où | Ce qu'il dit |
| --- | --- | --- |
| **1. Ce que je dois comprendre** | La ligne d'un fait dans « Ce qu'il faut retenir » | La condition, la valeur observée en une phrase, l'échelle en mots (« aux abords »). Les faits sont rangés par issue : ne tient pas, moins bien, compromis, à vérifier, correspond |
| **2. Pourquoi futur•e dit cela** | La ligne dépliée | « Ce que futur•e en conclut » (la conclusion du moteur, distincte de la donnée), « Ce résultat concerne les abords de l'adresse », la vérification proposée, et « Vos notes, qui ne modifient pas ce résultat » |
| **3. Documentation complète** | « Voir les détails de cette analyse » | Source et millésime, date de l'analyse, « établie pour votre Projet du 8 oct. (révision 2) », moteur, grain |

Trois origines restent séparées par leur place et leur libellé :
- **les faits des sources** : la valeur, au niveau 1 ;
- **les conclusions de futur•e** : au niveau 2, sous « Ce que futur•e en conclut » ;
- **vos notes** : dans la section « Vos notes », avec la mention « observé par vous » ou « déclaré par l'agent » et la date. Elles ne modifient jamais un résultat.

---

## 4. Alignement avec FUT-118 et FUT-75

Lu sur `feat/fut-118-convergence-releve` (`17303dbd`) : `DESIGN.md` v3.0, `grammaire-du-releve.md`, `src/app/design-tokens.css`, `src/components/releve/releve.module.css`.

| Règle | V3.1 | État |
| --- | --- | --- |
| Archivo en **largeur normale**, aucun `font-variation-settings` | Police chargée sans axe de largeur, comme `/fonts/Archivo-Variable.woff2` ; le test compte 0 élément avec un réglage de variation | conforme |
| Rôles `--r-t-*` | display, titre, sous-titre, chapô, dense, nuance, surtitre, étiquette et marge, aux valeurs du jeton | conforme, avec 3 écarts ci-dessous |
| Mono jamais en capitales espacées ; 12 px, 13 px sous 900 px | Oui | conforme |
| Jetons de thème, registres, `--r-*` | Copiés à l'identique de `design-tokens.css`, sombre et clair | conforme |
| Registre = trait de 3 px devant le sujet | Lignes d'attention, groupes de faits, conditions sans compromis, phrases du point | conforme |
| Aucune teinte de registre pour un incident, une version ou un état non établi | « Projet changé » en pointillé neutre ; comparaison non fiable sans teinte | conforme |
| Orange : une action principale par champ visuel ; texte `--r-sur-marque` | Un seul `boutonMarque` par vue ; en mode choix, le geste du haut redevient un bouton à trait | conforme (corrigé pendant cette passe) |
| Formes réservées aux échelles | Cercle, carré et losange ne servent qu'à la profondeur d'analyse et à l'échelle d'un fait. La case à cocher carrée de la sélection a été remplacée par le mot « Choisir » / « Choisi » | conforme (corrigé pendant cette passe) |
| Filets plutôt que cartes, rayon 3 px, pas de verre ni d'ombre | Tuiles à filet supérieur, sans fond ; plaque seulement pour la barre de choix | conforme |
| Rythme : un mouvement = 56 px et un filet | 48 / 56 px sur bureau, 36 px sur mobile | écart mineur, voir ci-dessous |
| Mouvement FUT-75 | Jetons `--m-*` ; arrivée d'une vue en fondu et flou de 2 px sans déplacement (`--m-bascule`) ; survol 120 ms ; défilements sans animation ; toutes les durées à zéro en mouvement réduit (testé) | conforme |
| Accessibilité | Focus de 2 px ; cibles ≥ 40 px ; fil en `nav` ; sélection en `aria-pressed` ; compte du choix en `aria-live` ; aucune information réservée au survol | conforme ; non vérifié au lecteur d'écran |
| § 8.1, principes du centre | Preuve au niveau 3 de chaque fait. Aucun score : les seuls nombres sont des longueurs de liste. La phrase dit ce que dit la marge (testé sur la phrase d'entrée et sur les conditions sans compromis) | conforme |

### Écarts, justifiés ou à arbitrer

1. **Le nom d'un lieu dans une tuile est en 22 px, graisse 600**, entre `--r-t-sous-titre` (17) et `--r-t-titre` (23 à 31). C'est l'identifiant principal de la page ; à 17 px, il ne se distinguait pas de sa commune. *Proposition FUT-118 : un rôle « nom de possibilité », ou l'usage de `--r-t-titre`.*
2. **La phrase d'accueil va jusqu'à 21 px**, au-dessus du chapô de 18 px. C'est la seule phrase de lecture de l'écran.
3. **Les deux noms en tête de comparaison** sont en 22 à 36 px, graisse 500. Ils sont mis en regard explicitement, ce que le § 4.2 autorise pour deux éléments de même poids.
4. **Les marques des pistes** sont des formes d'échelle remplies de la teinte du registre. Le Relevé porte le registre par un trait, jamais par une pastille. Héritée de la V2, cette marque porte en même temps le grain et l'issue. **À arbitrer avec FUT-118** : la garder comme exception de la comparaison, ou passer à une forme au trait.
5. **L'encadré en pointillé d'une réserve** (« Votre Projet a changé depuis cette analyse ») reprend la forme d'emplacement que le Relevé réserve au contenu d'un tiers. *Proposition FUT-118 : un composant « réserve » pour les limites qui conditionnent la lecture.*
6. **Le rythme mobile** est de 36 px au lieu de 40 px (version serrée), pour faire tenir le premier lieu à 360 × 780.

### Composants partagés qui manquent (propositions à FUT-118, rien n'est créé ici)

- **Le sélecteur** (« Afficher… ») : FUT-118 le note « manquant ». J'ai pris un `select` natif stylé, à remplacer par la primitive le moment venu.
- **La ligne de fait dépliable à trois niveaux.** Elle prolonge la `Ligne` et la `Marge` ; au niveau 2 sur bureau, la documentation occupe la marge de 232 px.
- **La barre de choix** : une sélection multiple bornée, collante en bas, avec le compte en `aria-live`.
- **Le fil de navigation** en casse normale, à coordonner avec FUT-86.

---

## 5. Décisions UX, conventions, questions métier

### Décisions purement UX (prises dans cette passe, à valider)

- Une page à quatre vues : recherche, lieu, comparaison, point. Un fil de retour, et non plus des colonnes.
- Un seul geste principal, choisi selon le moment.
- « Comparer » remplace « Rapprocher » dans les boutons. « Rapprocher » peut rester un mot de marque ailleurs, jamais un intitulé d'action.
- « Faire le point » sans modes visibles ; le détail est derrière « Sur quoi repose ce point ».
- Les tuiles plutôt que la planche.

### Conventions à proposer à FUT-118

Les écarts 1, 4 et 5 ci-dessus, ainsi que les quatre composants manquants.

### Questions métier ouvertes pour FUT-41 / FUT-22

1. **Quand deux analyses sont-elles comparables ?** Le prototype reste prudent : deux numéros de révision différents suffisent à refuser la comparaison. Un numéro différent ne prouve pourtant pas l'incomparabilité. Le contrat de production devra distinguer :

   | Élément | Ce qu'il change | Effet attendu |
   | --- | --- | --- |
   | **Identité du Projet** | même Projet ou un autre | un autre Projet : jamais comparable |
   | **Signature décisionnelle** | l'empreinte des seules conditions et seuils qu'un critère consomme. Passer de 20 à 30 min pour la gare change la gare, pas la mer | comparable sur les critères dont la signature n'a pas changé |
   | **Moteur** | la version du calcul | comparable seulement si le moteur déclare la règle inchangée pour ce critère |
   | **Conventions** | seuils, paliers, référentiel TRACC | une convention changée rend le critère incomparable |
   | **Millésimes des données** | BPE 2024 contre 2025, DRIAS 2025… | comparable avec mention si le millésime diffère, selon la règle du critère |
   | **Grain du critère** | commune, abords, logement | jamais comparé d'un grain à l'autre (déjà tenu) |

   Avec ce contrat, Kervily et Sternes redeviendraient comparables sur « la mer » et « le calme ». Ils resteraient incomparables sur « la gare ». Le prototype ne l'implémente pas.
2. **Le cache de « Faire le point »** (si une rédaction enrichie existe un jour). La clé du prototype (`cleLecture()`) compte les observations et lit les numéros de révision : elle ne voit pas une analyse refaite sous le même numéro, ni une observation corrigée. En production, la clé devrait comprendre :
   - les identifiants et versions des artefacts d'analyse réellement consommés ;
   - une empreinte des faits retenus dans le contrat (issue, valeur, source, millésime) ;
   - une empreinte des observations consommées (identifiant, date de modification, texte) ;
   - la signature décisionnelle du Projet ;
   - la liste des candidats et de leurs états ;
   - la date de dernière visite, seulement si « Ce qui a changé » est rendu.

   Une lentille, une sélection ou un clic ne changent jamais la clé. La lecture établie, déterministe, est toujours recalculée et immédiatement disponible.
3. **La version rédigée** reste un chantier séparé, conditionné à une évaluation de fidélité. Rien n'est lancé.
4. **Deux lieux dans une même commune** : le prototype dit « une seule lecture de la commune, qui vaut pour les deux ». Le contrat doit le garantir, avec un artefact Territoire partagé, et non deux artefacts identiques par hasard.

---

## 6. Contrôles effectués, et ceux qui ne l'ont pas été

**Effectués** (Playwright, Chrome, scripts hors dépôt), sur 11 situations (0 à 3 plus 7 de test) et 5 largeurs (1440, 1024, 820, 390, 360) :

- **Sans erreur à chaque étape** (aucune erreur JavaScript, aucun défilement horizontal) :
  - chaque fiche (jusqu'à quatre lieux par situation), son premier fait et sa documentation, puis le retour ;
  - la comparaison (par le geste principal à deux lieux, par le mode de choix au-delà), trois preuves ouvertes, « Pourquoi ? » ;
  - « Faire le point », et chacun de ses liens et actions cliqué.
- **Vocabulaire technique absent du premier niveau** : aucune occurrence de « révision », « moteur », « engine », « hors cadre » sur toutes ces vues. Le test a trouvé deux reliquats, corrigés : des valeurs fictives « (révision 1) » et « engine-6 » dans le retour après un mois.
- **Textes justes** :
  - les conditions sans compromis disent l'issue réelle (le test a trouvé un défaut, corrigé : « Tenue pour les deux » pour un médecin à vérifier) ;
  - la phrase d'entrée nomme exactement les conditions qui séparent ;
  - aucune piste n'est dessinée pour une comparaison non fiable, et des pistes apparaissent après la mise à jour simulée.
- **Parcours** : de 1 à 2 par l'ajout, puis le geste « Comparer ces deux lieux » mène à la comparaison, et Échap ramène à la recherche.
- **Clavier** : la tabulation atteint le geste principal, le Projet, « Comparer deux lieux », une tuile et le sélecteur ; le focus est visible.
- **Mouvement réduit** : durées à zéro, aucune animation d'arrivée.
- **Police** : aucun `font-variation-settings`.
- **Premier écran** : mesures du § 1.
- **Thème clair** : captures 30 à 32.

**Non effectués** :
- Safari et WebKit, iPhone réel ;
- écran non Retina réel ;
- lecteur d'écran (VoiceOver, NVDA) ;
- un test avec une personne qui découvre le produit. C'est le critère de réussite du brief, et seul un test réel le prouvera.

---

## 7. Autocritique et arbitrages

### Ce qui reste difficile pour quelqu'un qui découvre futur•e

- **« Votre Projet » n'est pas expliqué.** Le mot est clair pour nous ; un nouveau venu ne sait pas que c'est ce qu'il a déclaré chercher. « Voir mon Projet » aide, mais rien ne dit d'où il vient.
- **La différence entre « à vérifier » et « pas encore lu »** reste subtile. Les deux sont des inconnues, de nature différente.
- **La profondeur d'analyse** (« Commune, abords et logement analysés ») est juste, mais elle ne dit pas pourquoi elle compte. L'explication arrive dans la fiche, pas dans la tuile.
- **Le sélecteur « Afficher… »** est un geste puissant, peu découvrable.
- **La recherche enrichie** reste longue à faire défiler sur mobile (cinq tuiles, puis « À faire »).

### Ce qui n'est pas prouvé

- Que la V3.1 se comprend sans explication : ce prototype n'a été vu par personne en dehors de nous.
- Que « Faire le point » en quatre blocs reste court sur un compte réel de vingt lieux.
- Que la règle de comparabilité prudente (§ 5) ne bloque pas trop de comparaisons utiles. Elle en bloque probablement : c'est l'argument pour le contrat par signature décisionnelle.

### Ce que j'ai sacrifié

- **La planche et ses grandes formes.** La V3.1 est plus lisible, mais moins singulière que la V2. La singularité tient maintenant à la typographie, au rythme, aux traits de registre, aux pistes de comparaison et aux trois niveaux de preuve. C'est un vrai arbitrage.
- **Les lentilles en accès direct.** Elles sont passées derrière un sélecteur.

### Arbitrages qui vous reviennent

| # | Question | Ma recommandation |
| --- | --- | --- |
| W1 | Retenir la V3.1 (quatre vues, tuiles, un geste principal) comme base de l'implémentation ? | Oui, après un test avec trois personnes qui découvrent le produit |
| W2 | « Comparer » dans les boutons, « Rapprocher » abandonné ? | Oui |
| W3 | Les marques de piste remplies de la teinte du registre (écart 4) : exception admise, ou passage au trait ? | Exception, à soumettre à FUT-118 |
| W4 | Ouvrir à FUT-22 le contrat de comparabilité par signature décisionnelle (§ 5, question 1) ? | Oui, c'est la question métier la plus structurante |
| W5 | Spécifier le contrat de cache de production (§ 5, question 2), même sans rédaction IA ? | Oui, car la lecture établie en a besoin pour « Depuis votre dernière visite » |
| W6 | Retirer définitivement la version rédigée de l'interface commerciale jusqu'à une évaluation de fidélité ? | Oui |
| W7 | Garder une trace de la planche de la V2 (fiche d'un lieu, en grand) ? | Non pour l'instant ; à revoir si la V3.1 paraît trop générique |

Les arbitrages antérieurs restent ouverts : les 9 du cadrage, U1 à U6 et V1 à V7. W1 remplace V1, et W2 tranche la question du vocabulaire.

---

## 8. Captures

Toutes sont de vraies captures du prototype (Chrome, résolution double), en thème sombre sauf les captures 30 à 32.

| # | Fichier | Ce qu'elle montre |
| --- | --- | --- |
| 01 | `01-parcours-0-avant-tout-lieu.png` | Moment 0 : le Projet et un geste |
| 02, 03 | `02-parcours-1-premier-lieu.png`, `03-…-page.png` | Moment 1 : premier écran et page entière |
| 04, 05 | `04-parcours-1-fiche-du-lieu.png`, `05-…-pourquoi-et-documentation.png` | La fiche ; un fait déplié (niveaux 2 et 3) |
| 06 | `06-parcours-1-ajouter-un-lieu.png` | L'ajout d'un lieu (simulation) |
| 07 à 09 | `07-parcours-2-deuxieme-lieu.png`, `08-…-comparer-deux-lieux.png`, `09-…-une-preuve-ouverte.png` | Moment 2 : le nouveau lieu, la comparaison, une preuve |
| 10, 11 | `10-parcours-3-recherche-enrichie.png`, `11-…-page.png` | Moment 3 : premier écran et page entière |
| 12 | `12-parcours-3-choisir-deux-lieux.png` | Le mode de choix et sa barre |
| 13 | `13-parcours-3-faire-le-point.png` | Faire le point |
| 14, 15 | `14-…-afficher-selon-le-calme.png`, `15-…-projet-deplie.png` | Lire les lieux selon une condition ; le Projet déplié |
| 16, 17 | `16-projet-change-fiche.png`, `17-comparaison-non-fiable.png` | Projet changé : la fiche, la comparaison et « Pourquoi ? » |
| 18 | `18-du-point-a-la-preuve.png` | Depuis une phrase du point : la piste et ses preuves ouvertes |
| 19 à 22 | `19-condition-sans-compromis-non-tenue.png`, `20-commune-connue-par-l-apercu.png`, `21-dix-lieux.png`, `22-retour-apres-un-mois-faire-le-point.png` | Situations de test |
| 23 | `23-tablette-820.png` | Tablette |
| 24 à 29 | `24-mobile-…`, `25-…`, `26-…`, `27-…`, `28-…`, `29-…` | Mobile 390 et 360 : premier écran aux moments 1 et 3, fiche, comparaison, choix, point |
| 30 à 32 | `30-theme-clair-…`, `31-…`, `32-…` | Thème clair |

*Prototype de revue. Lieux, adresses, dates, analyses et preuves sont inventés.*

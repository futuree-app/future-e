# FUT-50 · Version C : un lieu, puis ce qui compte

14 octobre 2026 · branche `feat/fut-50-accueil-decision`, mise à jour avec `origin/main` (FUT-93 compris) · **prototype seulement : aucun fichier de production modifié.**

Le prototype se visite en local (`npm run dev`, puis `/dev/fut50/c`). L'index `/dev/fut50` présente A, B et C côte à côte. En production, toutes ces adresses renvoient une page introuvable, y compris la route de lecture `/dev/fut50/api/lecture` (vérifié sur un build de production local).

Captures : `docs/audits/fut50-accueil/images/proto-c-*.jpg`. Vidéo : `docs/audits/fut50-accueil/videos/c-lieu-et-priorites.mp4`.

---

## 1. Ce que la page fait comprendre

| Ce que le visiteur doit comprendre | Où C le dit |
| --- | --- |
| Je peux examiner un lieu qui m'intéresse | Titre « Regardez un lieu avec ce qui compte pour vous. », puis un grand champ « Quel lieu vous intéresse ? », visible sans aucun geste |
| Je peux indiquer facilement ce qui compte | Après le choix du lieu : « Qu'est-ce qui compte pour vous ? » et quatre pastilles, aucune cochée d'avance, avec « Une ou plusieurs, facultatives. Rien n'est enregistré. » |
| futur•e montre ce que les données signifient pour mon choix | Chaque pastille ouvre une seule lecture en trois temps : « Ce que disent les données », « Pour cette priorité », « Ce qu'il reste à vérifier » |
| Je peux aller plus loin | Sous chaque lecture : « Examiner une adresse à … » (ou « Faire examiner cette adresse ») vers `/dossier`, et « Décrire tout mon projet » vers `/ou-vivre` |

Avant toute recherche, la colonne de droite montre un **exemple réel marqué « exemple réel »**. C'est la lecture de Sète que le moteur a produite et que le test de la fixture vérifie.

L'expérience est donc hybride et le dit : la recherche, la lecture et les données sont réelles ; l'exemple est identifié comme tel.

---

## 2. Tableau : existant → version C

| Élément de l'accueil actuel | Décision | Justification |
| --- | --- | --- |
| Titre « Où vivre demain ? » et cartes climat qui défilent (machine à sous Lyon, Marseille, Vannes, La Rochelle) | **Supprimé** | Image d'observatoire climatique ; données réelles mais sans rapport avec une personne. Remplacé par le lieu choisi et ses priorités. |
| Recherche de commune (géocodeur officiel, 250 ms, annulation, aide Paris / Lyon / Marseille) | **Conservé, déplacé, élargi** | Devient le premier geste du hero, visible sans clic. Accepte aussi une adresse, lue honnêtement à l'échelle de sa commune. |
| Données climat et risques chargées pour la commune (DRIAS, Géorisques) | **Conservé, recomposé** | Mêmes sources, servies une à la fois derrière une pastille, avec leur limite. |
| Bouton « Analyser ma commune » | **Supprimé** | Le champ est désormais visible d'emblée. |
| « Trouver où vivre » : 12 liens vers `/ou-vivre` | **Simplifié** | Un lien par lecture (« Décrire tout mon projet ») et un dans l'offre gratuite. |
| Bande défilante des quinze sources | **Supprimé** | Une ligne sobre au pied de page ; chaque constat porte déjà sa source. |
| Encart « Trouver où vivre » et animation `HeroProjetTerritoires` (cycle de 23 s, villes et coches écrites à la main) | **Supprimé** | Remplacé par l'interaction réelle : le Projet se construit pastille par pastille sur un lieu vrai. |
| « Vos questions sur votre commune » | **Supprimé de l'accueil, valeur reprise en partie** | Voir § 3. |
| « 3 modules » : trois cartes avec emojis et listes | **Simplifié** | Mêmes trois descriptions, sans listes ni emojis. Les glyphes cercle, carré, losange disent la descente. Le titre existant est gardé : « Trois échelles, de la commune à vos murs. » |
| Encart « Votre dossier en 2 minutes. Répondez à 6 questions » et son questionnaire | **Supprimé** | Promet une personnalisation que le moteur ne lit pas entièrement (FUT-28), et appelle « dossier » un aperçu gratuit. |
| Hub « Comprendre les risques de demain » (six cartes) | **Recomposé** | Trois contenus à la une (Chaleur, Inondation, Mobilité), images franches, titres des hubs, renvois vers les guides Agir, trois autres articles en liens. Ancre `#savoir` conservée. |
| Tarifs | **Structure conservée, textes audités** | Voir § 5. |
| « Pourquoi futur•e » (fin de page) | **Conservé, raccourci, remonté sous le hero** | Titre, deux des trois paragraphes mot pour mot, photographie, triptyque, lien vers `/pourquoi`. Le paragraphe sur l'asymétrie d'information reste dans `/pourquoi`. |
| Orbes flous, verre, parallaxe | **Supprimés** | Liste noire FUT-87 et FUT-75. |
| Pied de page, dont « Professionnels » discret et la gestion des cookies | **Conservé** | « Pages Savoir » devient « Articles et guides » (même ancre). |
| Mention de TVA | **Nouveau** | « TVA non applicable, art. 293 B du CGI. », absente de la grille actuelle. |
| Lecture d'un lieu par pastille | **Nouveau** | Cœur de la version C. |

**Hauteur de la page entière** (accueil actuel → C) :
- desktop : 6 653 px → 4 072 px ;
- mobile 390 px : 11 765 px → 7 649 px ;
- mobile 360 px : 7 869 px.

---

## 3. « Vos questions sur votre commune » : ce qui serait perdu

Cette section contient une vraie fonctionnalité, en trois parties :

1. **Des questions choisies selon le type de commune** (littoral, montagne…), tirées d'une table `tensions_catalog`.
2. **Une réponse du modèle**, une par session, via `/qna`, contrôlée par un test déterministe, avec un repli sans IA construit sur les seuls faits de la commune (`reponses.ts`).
3. **Une question libre.**

**Ce que C reprend.** Les données et le principe du repli sans IA, sous une forme plus directe :
- la chaleur ;
- les risques recensés ;
- la phrase « Cette question se lit à l'échelle de l'adresse, pas de la commune » (reprise mot pour mot de `reponses.ts`).

**Ce qui serait perdu si C partait tel quel :**
- la réponse rédigée par le modèle sur l'accueil ;
- la question libre ;
- les questions hiver, eau du robinet et immobilier (cette dernière dit « futur•e ne prédit pas les prix futurs », une réponse utile).

**Recommandation : ne pas la supprimer du produit, la déplacer.**
- **Où :** sur les pages de commune déjà indexées (`/chaleur/[insee]`, `/inondation/[insee]`), où l'on arrive avec une question.
- **Comment :** conserver le repli sans IA comme réponse par défaut et réserver la réponse du modèle à un geste explicite. Le brief interdit une génération payante à chaque clic.
- **Sur l'accueil :** retirer seulement après avoir branché ce déplacement, ou accepter la perte en connaissance de cause. C'est une décision à prendre avant l'intégration.

---

## 4. Les pastilles : correspondances vérifiées sur le moteur

Le moteur a été interrogé le 14/10/2026, une priorité à la fois, sur un panel de communes :
- **villes** : Sète, Nîmes, Vannes, Brest, Lille, Annecy, Rodez, Guéret ;
- **petites communes** : Ahun, Albaret-le-Comtal, Allanche, Ageville.

| Pastille | Ce qu'elle lit | Verdict |
| --- | --- | --- |
| **Éviter les fortes chaleurs** | Moteur `faible_chaleur` (poids 2) et DRIAS | Fiable. Défavorable : le constat du moteur, sa limite et son geste, mot pour mot. Favorable : le fait DRIAS de l'accueil et la phrase du moteur. Donnée absente : « jamais une bonne nouvelle ». |
| **Vivre dans une ville à taille humaine** | Moteur `eviter_grandes_villes` (poids 2) : population de l'agglomération et convention de taille | Fiable et déterministe. La phrase de taille est celle du moteur (`categoryStatementFragment`), avec la population et le bon grain (agglomération ou commune). |
| **Pouvoir vivre sans voiture** | Rien à la commune | **Aucune lecture communale fiable**, d'où « Se lit à l'adresse » (voir ci-dessous). |
| **Connaître les risques naturels** | Recensement Géorisques | Une information actuelle de la commune entière, jamais un jugement. Si Géorisques ne répond pas : « Une absence de réponse ne dit pas qu'il n'y a pas de risque. » |

**Pourquoi « sans voiture » ne se lit pas à la commune.** Les trois critères de mobilité divergent :
- la part de la voiture dans les trajets domicile-travail place Albaret-le-Comtal (Lozère, 151 habitants) « parmi les 5 % de communes les plus favorables », parce qu'on y travaille sur place ;
- la desserte quotidienne ne trouve aucun transport praticable à Sète, et reste muette à Lille ;
- l'accès au train reste muet pour Brest et Annecy.

**Écartée : « Avoir des services à proximité ».** Le niveau de services communal reste muet pour toutes les villes testées. Sa réponse honnête serait la même que pour la voiture.

**Critères du moteur qui pourraient devenir des pastilles** (une ligne de configuration chacun), d'après le même panel :

| Catégorie | Critères |
| --- | --- |
| Lisibles et crédibles à la commune | douceur des hivers, trajectoire démographique, danger de feu |
| Crédibles mais incomplets | accès aux soins (muet pour Guéret), vie locale, espaces naturels (muets pour Annecy et Brest), accès au train |
| Plutôt « à contrôler » | calme, air, sites industriels |

Trois signaux sont à remonter au moteur, hors FUT-50 :
- la mobilité, voir plus haut ;
- les espaces naturels ;
- l'accès au train.

**Aucune génération IA.** La route de lecture appelle le moteur déterministe et Géorisques ; un test vérifie que le hero n'appelle ni `/qna` ni un modèle. Temps mesurés sur le serveur de développement :
- environ 340 ms par lecture, une fois les données en mémoire ;
- 3,7 s pour la toute première lecture, quand l'index et DRIAS se chargent.

En production, il faudra une route publique légère, mise en cache par commune et par pastille.

---

## 5. Les offres : formulations auditées

| Texte actuel | Problème | Version C |
| --- | --- | --- |
| « Une lecture personnalisée à partir de vos réponses et des données publiques. » | Décrit l'ancien questionnaire | « Regarder et chercher est gratuit. Un dossier vient quand un lieu compte vraiment pour vous. » |
| Découverte : « Le questionnaire de profil personnalisé » / « Votre première lecture : vos premiers points d'attention » | Questionnaire non fidèle au moteur (FUT-28) | « Regarder un lieu avec vos priorités, ici même » / « Décrire votre projet et voir les territoires qui y répondent » |
| « Le climat déjà observé pour votre commune » | Faux : l'accueil affiche des projections | Retiré |
| « 3 pages Savoir thématiques » | Les articles et guides sont tous en accès libre | « Les articles et les guides pratiques, en accès libre » |
| « Commencer gratuitement » → `/inscription` | Mène à un compte, pas à l'expérience gratuite | « Chercher un lieu » → le champ de l'accueil |
| « Sa position parmi les 34 000 communes françaises » | Le total réel est de 35 006 | « parmi les communes françaises » |
| Dossier d'adresse : deux lignes reprenant les listes des trois échelles | Doublon avec la section des échelles | Une ligne : « Autour de l'adresse et le logement, avec ce qui reste à vérifier en visite » |
| Comparatif : « Trois territoires comparés… trois nouvelles pistes… AskFuture : 9 questions » | **Non revérifié** | Gardé mot pour mot. À confirmer avec FUT-32 (comparaison de 2 ou 3 communes) avant intégration. |

**Prix inchangés** : 0 €, 14 €, 39 € ou 25 € après territoire, comparatif à 39 €. **Liens** :
- Territoire → `/checkout/rapport-complet` ;
- Adresse → `/dossier` ;
- Comparatif → `/ou-vivre`.

Tous répondent 200 en production locale.

---

## 6. Mouvement : la grammaire FUT-75, appliquée

Aucune valeur propre : la version C emploie les jetons de `design-tokens.css`, ceux que `lib/motion.ts` aligne par test.

| Moment | Ce qui bouge | Jeton |
| --- | --- | --- |
| Pression sur une pastille ou un bouton | la commande s'enfonce, puis se pose sur le micro-ressort (environ 2 % de dépassement) | `--m-pression`, `--m-ressort` |
| Pastille activée | la teinte passe de vide à plein, la marque se remplit | `--m-etat`, `--m-releve` |
| Survol, focus, champ actif | contour et fond | `--m-geste` |
| Suggestions du géocodeur | la liste s'ouvre | `--m-etat` |
| Lieu choisi | une coche se trace (260 ms), la ligne du lieu et les pastilles arrivent l'une après l'autre (40 ms d'écart) | `--m-bascule` |
| Lecture qui change | le contenu arrive en fondu, avec un flou de 2 px, **sans déplacement** | `--m-bascule` |
| Chargement | une ligne d'état (« Lecture des données publiques de la commune. ») qui n'apparaît qu'après 200 ms, et des formes sans texte | sans balayage ni compteur |

**Respecté :**
- aucune valeur n'est animée ;
- aucun chargement factice ;
- le texte ne glisse jamais ;
- rien n'attend une animation pour être lu ;
- en mouvement réduit, aucune animation n'est active au chargement (mesuré : 0) et tous les jetons tombent à zéro.

**Retiré :** le zoom au survol des images d'articles (effet décoratif).

**Écartée :** une transition où la pastille cliquée « devient » le titre de la lecture. Sur desktop, elle traverserait toute la page : effet sans bénéfice de compréhension.

**Ce qui reste pour FUT-75** : l'ouverture d'un dossier et le passage 2030 → 2050 → 2100 ne concernent pas l'accueil. Un seul moment de l'accueil pourrait en profiter : faire passer la lecture d'une commune à une adresse, quand `/dossier` acceptera une adresse pré-remplie.

---

## 7. Revue : performance, clavier, focus, chargements, mouvement réduit

| Point | Constat |
| --- | --- |
| Débordement horizontal | 0 px à 1440, 390 et 360 px, dans tous les états (suggestions, lieu, lectures) |
| Clavier | Le champ s'atteint en 13 tabulations (menu traversé, pas de lien d'évitement : défaut de tout le site, FUT-86). Liste de suggestions au clavier (flèches, Entrée, Échap), puis première pastille 2 tabulations après le lieu, Espace pour l'activer. Contour de focus visible partout. |
| Accessibilité | Champ en combobox ARIA (`aria-expanded`, `aria-activedescendant`, liste en `listbox`). Pastilles en `button aria-pressed`. Lecture annoncée par une région `aria-live`. Chargement en `role="status"`. Cibles de 46 à 60 px de haut. |
| Chargements | Géocodeur : indicateur dans le champ, « Aucun lieu trouvé… » et un message si le service ne répond pas. Lecture : ligne d'état, puis contenu ; erreur : « La lecture n'a pas pu être chargée. Réessayez dans un instant. » |
| Mouvement réduit | 0 animation active, jetons à zéro, aucun défilement automatique |
| Performance | Aucune dépendance ajoutée. Images en `next/image` (chargement différé). Premier affichage 224 ms sur le serveur de développement, non représentatif de la production. Première lecture à froid : 3,7 s, d'où le besoin de cache noté au § 4. |
| Mobile | Sur un écran étroit, la lecture s'affiche sous les pastilles ; elle est amenée doucement dans le champ de vision si elle n'y est pas déjà (jamais en mouvement réduit). |

---

## 8. Publications SEO à venir : ce qui en dépend sur l'accueil

**Branches et contenus non touchés** :
- `etude/larochelle-mobilite` (PR #55) et `etude/mobilite-lots` (PR #57) ;
- leurs données, leurs scripts et leurs articles ;
- les hubs.

| Élément de l'accueil C | Dépendance | Action à la publication |
| --- | --- | --- |
| `ETUDES_LOCALES_PUBLIEES` (vide) dans `SectionsC.tsx` | `/savoir/dependance-auto/la-rochelle`, `/savoir/dependance-auto/niort` (FUT-100, en préparation) | Ajouter une entrée par étude publiée : une ligne « Études locales » apparaît sous les trois contenus. Un test garantit qu'aucune URL en préparation n'est affichée. |
| Carte « Vous utilisez beaucoup votre voiture » | Le hub Mobilité, que la branche SEO réécrit (« 84 % des actifs ruraux » devient « près de neuf actifs sur dix hors des pôles urbains, INSEE 2017 ») | Le texte de la carte C ne reprend **aucun chiffre** : rien à changer. En revanche, la carte de l'accueil **actuel** (`SAVOIR_HUB_ARTICLES`) cite encore « 84 % » ; elle disparaîtra avec la migration. |
| Lien « Comprendre la dépendance automobile » | `/savoir/dependance-auto`, que la branche SEO modifie | Lien stable, à garder. |
| Cartes Chaleur et Inondation | Hubs `/chaleur` et `/inondation` | Aucune dépendance aux études en cours. |

**Incohérences à signaler (non corrigées, hors FUT-50) :**

1. **Le hub Mobilité présente encore les guides Agir comme payants.**
   - Ce qu'il affiche : « Ces deux pages sont plus pratiques, plus personnelles, et donc réservées au niveau payant », avec des cartes « Agir · Payant » et « Débloquer ce guide ».
   - Ce qui est vrai : `/agir/dependance-auto` et `/agir/voiture-electrique` sont intégralement ouverts (`PaywallGate variant="open"`).
   - La branche SEO ne corrige pas cette ligne. L'accueil C renvoie vers `/agir/dependance-auto` en le présentant correctement comme gratuit.
2. **La description du hub Chaleur promet un « score de tension thermique »**, contraire à la doctrine (aucun score).
3. **Les descriptions de `SAVOIR_HUB_ARTICLES`** contiennent des affirmations à vérifier :
   - « Certaines communes ne seront plus assurables » ;
   - « 63 jours > 30 °C » pour Marseille, sans horizon ;
   - « Un Français sur deux est surexposé ».

   La version C ne les reprend pas.

---

## 9. Recommandation : au lancement, et plus tard

**À livrer absolument au lancement** (un lot d'intégration, branche séparée, après revue) :

1. **Le hero C** : titre, champ de lieu (communes et adresses), exemple réel marqué, quatre pastilles, lecture en trois temps.
2. **Une route publique de lecture**, mise en cache par commune et par pastille.
   - **Elle reprend** la logique de `/dev/fut50/api/lecture` : moteur déterministe et Géorisques, aucune IA.
   - **Prérequis** : rejouer le panel de communes avant la mise en ligne.
3. **Les tarifs C** : textes audités et mention de TVA. Revérifier le comparatif avec FUT-32.
4. **La suppression** de la machine à cartes, de la bande des sources, de l'encart « 6 questions », de `HeroProjetTerritoires` et des orbes.
5. **« Pourquoi futur•e »** raccourci sous le hero, et les trois échelles simplifiées.
6. **Savoir recomposé**, ancre `#savoir` conservée.

**Peut attendre :**

- **Le pré-remplissage de `/dossier`** par l'adresse choisie (`?adresse=` lu au montage, comme `?code=` aujourd'hui). C'est un petit changement de production, mais il évite de faire retaper l'adresse : à faire juste après le lancement.
- **Le déplacement de « Vos questions »** vers les pages de commune (§ 3). D'ici là, décider explicitement si l'accueil s'en passe.
- **D'autres pastilles** (douceur des hivers, trajectoire démographique), après revue éditoriale.
- **La navigation globale FUT-86** et un lien d'évitement.
- **La correction des incohérences des hubs** (§ 8), avec FUT-52 et FUT-100.

**Décisions qui te reviennent avant intégration :**

1. **Le sort de la réponse IA et de la question libre** sur l'accueil.
2. **La formulation du moteur « appartient à une ville moyenne »**, maladroite : la corriger dans le moteur ou l'adapter à l'accueil.
3. **La relecture éditoriale** du titre, du sous-titre et des quatre libellés de pastilles.

---

## Annexe technique

| Fichier | Rôle |
| --- | --- |
| `src/app/dev/fut50/c/page.tsx` | Page C, garde 404 en production |
| `src/app/dev/fut50/api/lecture/route.ts` | Lecture d'une pastille : moteur (chaleur, taille), Géorisques (risques), rien pour la voiture ; 404 en production |
| `src/components/prototypes/fut50/c/pastilles.ts` | Module pur : les quatre pastilles, ce que chacune peut dire, les textes par issue |
| `src/components/prototypes/fut50/c/HeroLieu.tsx` | Hero : recherche, lieu, pastilles, lecture, exemple réel |
| `src/components/prototypes/fut50/c/SectionsC.tsx` | Pourquoi, échelles, offres, Savoir, pied de page |
| `src/components/prototypes/fut50/c/c.module.css` | Composition dans les jetons « Le relevé » et la grammaire motion FUT-75 |
| `src/components/prototypes/fut50/c/c.test.ts` | Textes par issue, absences honnêtes, grain, existence de chaque lien, ancre, études non publiées, voix |
| `scripts/fut50/interactions-c.mjs` | Parcours réel, trois largeurs, adresse, clavier, mouvement réduit, mesures, vidéo |

**Vérifications du 14/10/2026 :**

- **Tests** :
  - suite complète : 2 572/2 572 ;
  - tests FUT-50 : 17/17, dont 11 propres à C.
- **Qualité du code** : `tsc` et `eslint` sans erreur ni avertissement.
- **Build de production** : `next build --webpack` réussi (289 pages).
- **Comportement en production** (`next start`) :
  - `/dev/fut50`, `/dev/fut50/a`, `/dev/fut50/b`, `/dev/fut50/c` et `/dev/fut50/api/lecture` renvoient 404 ;
  - `/`, `/ou-vivre`, `/dossier`, `/comparateur`, `/chaleur`, `/inondation`, `/j-utilise-beaucoup-ma-voiture`, `/agir/dependance-auto`, `/checkout/rapport-complet`, `/pourquoi` et `/professionnels` renvoient 200.

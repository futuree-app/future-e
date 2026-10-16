# FUT-50 · Le haut de l'accueil : diagnostic, deux directions, recommandation

12 octobre 2026 · branche `feat/fut-50-accueil-decision` · **prototypes seulement : rien n'est modifié sur le site public.**

Les deux propositions se visitent en local (`npm run dev`, puis `/dev/fut50`) :

- `/dev/fut50/a` : **A · Le Projet d'abord**
- `/dev/fut50/b` : **B · Une décision éclairée par les preuves**

En production, ces trois adresses renvoient une page introuvable (vérifié sur un build de production local).

Captures : `docs/audits/fut50-accueil/images/` · vidéos : `docs/audits/fut50-accueil/videos/`.

---

## 1. Diagnostic de l'accueil actuel

Captures de référence : `prod-accueil-1440.jpg` et `prod-accueil-390.jpg` (premier écran), `prod-accueil-1440-page.jpg` et `prod-accueil-390-page.jpg` (page entière).

### Ce qu'un nouveau visiteur comprend en 5 secondes

Il voit trois choses :

1. une question, « Où vivre demain ? » ;
2. un sous-titre, « Comparez les territoires français selon votre projet de vie, des services du quotidien jusqu'au climat de demain » ;
3. à droite, des cartes qui défilent de ville en ville : « Jours > 35 °C · Lyon, 8 j/an », « Nuits tropicales · Lyon, 43 nuits/an », puis Marseille, Vannes, La Rochelle.

**Ce qu'il retient** : un site qui compare des villes, surtout sur le climat. C'est l'image de l'ancien produit. Les données de la colonne de droite sont réelles et sourcées, mais elles ne répondent à personne : aucun projet ne leur donne de sens.

### Ce qui lui manque pour comprendre ce que futur•e vend

- **Le Projet n'est jamais montré comme ce qui donne leur sens aux données.**
  - Il est nommé dans le sous-titre (« selon votre projet de vie »), puis il disparaît du premier écran.
  - La phrase qui résume le mieux le produit, « Ce que nous savons. Ce que cela change pour vous. Ce qu'il reste à vérifier. », se trouve à la toute fin de la page, dans la section « Pourquoi futur•e ».
- **La porte « J'ai déjà une adresse » n'existe pas dans le premier écran.**
  - Le second bouton, « Analyser ma commune », ouvre un champ de recherche de commune qui mène à des questions génériques par catégorie de territoire.
  - La qualification d'adresse (`/dossier`) n'est atteignable que par la grille de tarifs (« Ouvrir un dossier d'adresse · 39 € »), aux trois quarts de la page.
- **Rien ne montre qu'une réponse peut être incertaine.** L'accueil ne montre jamais un « reste à vérifier » ni une condition ouverte, alors que le dossier le fait très bien.
- **Les trois échelles sont présentées comme trois modules** (« 3 modules », emojis, listes de contenus), puis répétées dans les tarifs. Elles ne sont pas présentées comme trois lectures d'une même décision.

### Ce qui ressemble à un observatoire climatique

- **La colonne droite du hero** : cartes climat et risques qui défilent sur 15 secondes, avec la chaleur en accroche (FUT-37 relevait que la carte Canicule est l'accroche de 100 % des communes).
- **La bande défilante de quinze noms de sources** sous le hero.
- **Le hub « Comprendre les risques de demain »** (cadmium, canicule 2050, submersion, maladies émergentes), placé avant les tarifs.
- **L'encart « Dossier personnalisé »** : « un aperçu personnalisé de ce que devient votre commune face au climat ».

### Doublons entre le hero et les sections suivantes

| Contenu | Apparitions |
| --- | --- |
| Lien vers `/ou-vivre` | **12** dans le composant : hero, encart, section Pourquoi, tarifs… |
| Les trois échelles | deux fois : section « 3 modules », puis grille de tarifs |
| L'histoire du Projet | trois fois : sous-titre du hero, encart « Décrivez votre projet de vie », section Pourquoi |

### Ce qui donne une fausse impression de personnalisation

- **Le surtitre « Projection personnalisée »**, au-dessus de données qui ne le sont pas.
- **L'encart « Votre dossier en 2 minutes. Répondez à 6 questions. Obtenez un aperçu personnalisé… »**
  - FUT-28 établit que ce formulaire collecte des réponses dont une partie ne nourrit pas le moteur.
  - Il annonce un « dossier » gratuit, alors que le dossier est l'objet payant.
- **« Vos questions sur votre commune »** : ces questions sont choisies par catégorie de territoire (littoral, montagne…), jamais par projet.

### L'animation `HeroProjetTerritoires` : ce qu'elle vaut

- **Valeur pédagogique : réelle.** C'est le seul endroit de la page qui montre le mécanisme. Une phrase devient des critères, puis des territoires avec leurs compromis. On ajoute « sans subir la canicule », et les résultats changent. C'est exactement l'idée à transmettre.
- **Durée** : un cycle complet dure **23 secondes** (dix phases). Le visiteur qui ne reste pas les 23 secondes ne voit pas la bascule, qui est le moment important.
- **Lisibilité** : elle tient dans un cadre 4/3 de petite taille, avec des libellés courts. Sans mouvement (préférence de mouvement réduit), elle affiche l'état final, que l'on comprend mal sans avoir vu le changement.
- **Fidélité au moteur : faible.**
  - Les villes (Vannes, Saint-Nazaire, La Rochelle, Saint-Brieuc) et leurs coches « critère rempli / non rempli » sont écrites à la main dans le composant. Le moteur ne les a jamais calculées.
  - La grille de coches ressemble à un score (« 2 sur 3 »).
  - Rien n'indique que l'exemple est démonstratif.

**Verdict.** On garde l'idée, on remplace le contenu. La direction A en est la version vraie : même bascule (on retire ou ajoute une priorité sur la chaleur), mais sur une vraie commune et avec les vraies phrases du dossier, sans attendre aucune animation.

### Ce qui est réellement utile et doit être conservé

- **Les deux destinations réelles**, publiques et sans compte : `/ou-vivre` (décrire un projet, voir des territoires) et `/dossier` (qualifier une adresse). La comparaison (`/comparateur`) existe et reste accessible.
- **La phrase « Votre futur lieu de vie ne tient pas dans une annonce. »** et le triptyque « Ce que nous savons. Ce que cela change pour vous. Ce qu'il reste à vérifier. »
- **Les cartes de données de l'accueil**, réelles, sourcées et testées (`lib/accueil/recits.ts`). Elles ont leur place plus bas, dans une lecture de commune, et non comme promesse.
- **La grille de tarifs**, à garder sous les deux premiers écrans (hors périmètre ici).
- **Les briques « Le relevé » (FUT-87)** : marge de preuve, glyphes de grain, règle du temps, plaque. Les deux prototypes s'appuient entièrement sur elles.

---

## 2. Le cas réel des démonstrations : Sète

La démonstration ne contient aucun chiffre ni aucune phrase écrits pour la maquette.

- **Ce qui a été lancé** : le moteur de production a tourné le 12 octobre 2026 sur Sète (34301), avec un même Projet :
  - « une ville à taille humaine, près de la mer, où l'on peut vivre sans voiture, avec des étés supportables » ;
  - en préférences : mer 3, voiture 3, chaleur 3, taille 2.
- **Quatre lectures réelles ont été relevées mot pour mot** : avec ou sans la priorité sur la chaleur, et avec ou sans la mer comme condition sans compromis.

Pourquoi Sète : le même Projet y produit, dans un seul dossier, tout ce que l'accueil doit montrer.

| Ce que l'accueil doit montrer | Ce que dit le dossier réel de Sète |
| --- | --- |
| Ce qui correspond | « Pour la possibilité de se déplacer sans voiture, Sète se situe parmi les 5 % de communes où elle est la plus favorable en France. » |
| Un vrai compromis | « Les nuits tropicales passeraient de 42 par an sur la période de référence 1976-2005 à 80 à l'horizon 2050… » : verdict « Arbitrage » |
| Une limite | « Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement. » |
| La vérification suivante | « Renseignez votre adresse pour descendre au niveau du logement » |
| Une condition ouverte | la mer en condition sans compromis : « Condition ouverte », avec la distance mesurée et « Elle ne correspond pas nécessairement à la mesure que vous visez pour cette condition. » |
| Un constat non demandé | le risque de feu de forêt recensé, en « À contrôler » |
| **Le Projet change la lecture** | **sans la priorité « étés supportables », le même fait sur les nuits tropicales quitte « Ce qui correspond moins bien » pour « À contrôler », et le verdict passe d'« Arbitrage » à « Correspondance favorable »** |

La dernière ligne est la démonstration centrale : **le fait ne change pas, sa place dans la décision change avec le Projet.**

Ce qui n'est pas du moteur est signalé comme tel à l'écran :

- **la phrase du Projet** (le moteur lit des préférences pondérées) ;
- **la description « examinée, rien ne penche nettement »** pour les priorités sans constat : le dossier n'affiche rien pour elles.

Vérifications (détail technique en annexe) :

- **valeurs DRIAS** : comparées au fichier servi, `public/data_climat.json` (79,8 nuits à l'horizon +2,7 °C en France, dont 37,1 d'écart, soit une référence d'environ 42,7) ;
- **phrases** : comparées au moteur rejoué en entier, aucun écart sur les quatre lectures.

---

## 3. Direction A · Le Projet d'abord

Vidéo : `videos/a-bascule-priorite.mp4`.

Captures :
- **premier écran** : `proto-a-1440.jpg`, `proto-a-1024.jpg`, `proto-a-390.jpg` ;
- **démonstration** : `proto-a-demo-*.jpg`, quatre états, desktop et mobile ;
- **page entière** : `proto-a-1440-page.jpg`.

**Promesse.** « Choisissez où vivre à partir de ce qui compte pour vous. »

**Sous-texte.** « Décrivez votre projet. futur•e le confronte aux données publiques de chaque lieu, de la commune jusqu'au logement, et vous montre ce qui correspond, ce qui correspond moins bien et ce qui reste à vérifier. »

**Premier écran.**

- **À gauche** : la promesse, le sous-texte, puis deux portes de même forme.
  - « Je cherche où vivre », porte principale en orange, « Décrire mon projet et voir les territoires qui y répondent » → `/ou-vivre`.
  - « J'ai déjà une adresse en tête », « Faire examiner ce lieu, de la commune jusqu'au logement » → `/dossier`.
  - Dessous, en voie secondaire : « Vous hésitez déjà entre plusieurs communes ? Les comparer » → `/comparateur`.
- **À droite** : la fiche du Projet, marquée « exemple ».
  - Une phrase écrite comme on l'écrit, dont quatre fragments sont soulignés.
  - Ces fragments deviennent **quatre questions posées à chaque lieu** (« La mer est-elle proche ? », « Peut-on y vivre sans voiture ? », « Les étés y resteront-ils supportables ? », « La ville est-elle à taille humaine ? »), avec leur importance.
  - Puis les **quatre réponses possibles** : correspond, correspond moins bien, reste à vérifier, ne se tranche pas ici.
  - Survoler ou parcourir au clavier une question souligne son fragment dans la phrase.

**Démonstration du raisonnement.** « Changez une priorité : les faits restent les mêmes, leur poids dans votre décision change. »

- **Deux interrupteurs** : « Des étés supportables font partie de mes priorités » ; « La proximité de la mer est une condition sans compromis ».
- **Chaque réglage affiche la vraie lecture de Sète** : verdict, puis faits rangés dans les sections du dossier.
- **Chaque fait suit la même chaîne** : « Fait établi », « Pour ce projet », « Limite », « À vérifier ensuite », avec sa preuve (grain, valeur, source) dessous.
- **Le fait des nuits tropicales glisse** d'une section à l'autre quand on bascule la chaleur. La transition est désactivée en mouvement réduit.

**Première transition vers les échelles.** « Puis la lecture descend jusqu'au logement. »

- L'introduction repart de la limite du constat de Sète : lu à la commune, il ne dit rien d'un logement.
- Ensuite viennent trois questions d'une même décision, et la décision elle-même :
  - **Territoire** : « Dans quel environnement allez-vous vivre, sur le long terme ? »
  - **Autour** : « Qu'est-ce que cette adresse change à votre quotidien ? »
  - **Logement** : « Ce bâtiment atténue-t-il ou aggrave-t-il ce contexte ? »
  - **Ma décision** : « Qu'est-ce qui tient, qu'est-ce qui coince, et qu'est-ce qu'il faut encore apprendre ? »

**Compris sans animation.** Tout :

- la fiche du Projet est statique ;
- la démonstration s'affiche dans son état le plus parlant (« Arbitrage ») avant tout clic ;
- en mouvement réduit, le titre et les portes sont visibles immédiatement (mesuré à 150 ms).

**Risques de confusion.**

- **La mer en simple priorité.** Pour la mer en simple priorité, Sète ne reçoit aucun constat, alors qu'elle est au bord de l'eau. C'est le comportement voulu du moteur (FUT-33 : pas de seuil de distance inventé), mais un visiteur peut s'en étonner. Le prototype le dit et invite à faire de la mer une condition. À trancher avant intégration : garder la mer dans l'exemple, ou la retirer du Projet d'exemple.
- **Des interrupteurs pris pour un outil.** Un visiteur pressé peut croire que les interrupteurs sont un outil qui calcule pour sa propre commune. Le titre et la provenance le disent clairement : exemple réel, lecture relevée.
- **La longueur sur mobile.** La démonstration y fait environ 3 écrans. La page entière fait 6 190 px de haut contre 11 765 px pour l'accueil actuel.

**Raisons objectives de la préférer.**

1. Elle montre **ce que les concurrents ne font pas** : la même donnée lue différemment selon le Projet. Les fiches d'adresse gratuites (Domky, Score Adresse, GoodPlaceTo.Live) montrent des faits ; aucune ne montre leur poids pour une personne.
2. Elle répond aux deux premiers critères du ticket (une décision résidentielle, et un Projet indispensable) dès le premier écran.
3. Elle hérite d'une idée que le porteur avait déjà retenue (`HeroProjetTerritoires`), cette fois rendue vraie.

---

## 4. Direction B · Une décision éclairée par les preuves

Vidéo : `videos/b-revelation-projet.mp4`.

Captures :
- **premier écran** : `proto-b-1440.jpg`, `proto-b-1024.jpg`, `proto-b-390.jpg` ;
- **relevé** : `proto-b-releve-avant-*.jpg` et `proto-b-releve-apres-*.jpg` ;
- **page entière** : `proto-b-1440-page.jpg`.

**Promesse.** « Votre futur lieu de vie ne tient pas dans une annonce. »

**Surtitre.** « Avant de vous engager pour un lieu ».

**Sous-texte.** « Une adresse se lit à trois échelles : la commune, ce qui l'entoure, le logement. futur•e en rassemble les faits publics, datés et sourcés, puis les lit avec votre projet. »

**Premier écran.**

- **À gauche** : les mêmes deux portes, dans l'ordre inverse. « J'ai déjà une adresse en tête » est la porte principale ; « Je cherche encore où vivre » vient en second.
- **À droite** : « Sète · Hérault · ce que l'on sait avant votre projet ».
  - Trois faits réels, chacun avec son grain et sa source (nuits tropicales, feu de forêt recensé, déplacements sans voiture).
  - Une phrase : « Trois faits vrais, et aucun ne dit encore si Sète vous convient. C'est votre projet qui leur donne un poids. »

**Démonstration du raisonnement.** Un relevé paragraphé, citable (1.1 à 1.4).

- **1.1 · Le fait** : les nuits tropicales, avec la règle du temps (42, 67, 80, 102 nuits, et le réchauffement France sous chaque horizon), sa source et son grain en marge.
- **1.2 · Ce que futur•e en dit sans connaître votre projet** : « À contrôler », « futur•e signale cette exposition à partir de 39 nuits tropicales par an, hors priorité déclarée. »
- **1.3 · Ce que votre projet en fait** : replié derrière un bouton, « Lire ces faits avec ce projet ». Une fois ouvert, il montre :
  - le Projet d'exemple ;
  - le verdict réel (« Condition ouverte ») ;
  - le même fait devenu « Des étés plus difficiles à concilier avec votre projet » ;
  - ce qui correspond, la condition ouverte sur la mer, et ce qui ne se tranche pas.
- **1.4 · Ce que la commune ne peut pas dire** : la limite, puis le geste « Renseignez votre adresse pour descendre au niveau du logement », qui est un vrai lien vers `/dossier`.

**Première transition vers les échelles.** « Le sommaire d'un dossier d'adresse » : les trois échelles et « Ma décision », numérotées, comme la table des matières du document acheté.

**Compris sans animation.** Tout, sauf la bascule 1.3, qui demande un clic. C'est voulu : la révélation est le moment fort de la direction. Sans clic, le visiteur voit déjà le fait et sa lecture neutre.

**Risques de confusion.**

- **Le premier écran ressemble à ce que font déjà les fiches d'adresse gratuites** : des faits sourcés sur un lieu. La différence (le Projet) arrive au deuxième écran, après un clic. Un visiteur qui part après 5 secondes repart avec l'image d'un service de plus sur les données publiques. C'est la commoditisation déjà identifiée en septembre.
- **Mettre l'adresse en porte principale** sert l'acheteur ou le locataire qui a un bien en tête. Le lecteur qui cherche encore son territoire, cœur du comparateur, passe au second plan.
- **Le verdict révélé, « Condition ouverte »,** est juste mais moins frappant qu'un « Arbitrage ».

**Raisons objectives de la préférer.**

1. C'est la direction la plus proche du « Relevé » validé dans FUT-87 : documentaire, citable, preuve en marge. Elle prépare le visiteur à la forme exacte du dossier acheté.
2. Elle sert mieux un visiteur qui arrive avec une adresse (porte de vente du Dossier Adresse à 39 €), et rend visible le chemin commune → adresse par un vrai lien.
3. Elle fait de « on ne sait pas encore » une information à part entière (1.2, 1.4).

---

## 5. Comparaison critique

Les cases ci-dessous sont **mon jugement d'expert**, sans testeurs réels. Elles indiquent ce qu'il faut vérifier, pas un résultat (protocole au § 8).

| Question observable | A · Le Projet d'abord | B · Les preuves d'abord |
| --- | --- | --- |
| En 5 s, comprend-on que futur•e aide une décision résidentielle ? | oui : « Choisissez où vivre » | oui, par la situation : « Avant de vous engager pour un lieu » |
| Comprend-on pourquoi le Projet est indispensable ? | **oui, dès le premier écran** (phrase → questions) | au deuxième écran, après un clic |
| Sait-on choisir entre « chercher où vivre » et « une adresse » ? | oui, deux portes de même forme | oui, mais l'ordre favorise l'adresse |
| Voit-on la différence entre donnée brute et interprétation ? | oui : les interrupteurs déplacent le même fait | **oui, très nettement** : 1.2 puis 1.3 |
| Comprend-on qu'une réponse incertaine est utile ? | oui : condition ouverte, « ne se tranche pas ici » | **oui** : 1.2, 1.4, condition ouverte |
| Trois échelles perçues comme un approfondissement ? | oui : la limite du constat amène la descente | oui : sommaire numéroté d'un même dossier |
| Raison crédible de continuer vers le payant ? | « Renseignez votre adresse… », puis Ma décision | **plus directe** : lien vers `/dossier` au paragraphe 1.4 |
| Le mobile raconte-t-il la même histoire ? | oui ; démonstration plus longue (environ 3 écrans) | oui ; plus court (page de 5 196 px) |
| Différence visible face aux fiches gratuites concurrentes | **forte et immédiate** | tardive : premier écran proche des concurrents |

---

## 6. Recommandation

**Je recommande la direction A comme haut de l'accueil, avec deux emprunts précis à B.** Ce n'est pas une fusion des deux pages.

**Pourquoi A.**

- **Le visiteur qui ne lira que le premier écran doit repartir avec la seule chose que futur•e fait et que les autres ne font pas** : lire les faits avec son projet. A le montre en 5 secondes, sans clic ni animation. B le montre au deuxième écran, derrière un bouton.
- **Avec la pression concurrentielle sur les fiches d'adresse**, commencer par « des faits sourcés sur un lieu » revient à se présenter comme un concurrent de plus.

**Les deux emprunts à B.**

1. **La règle du temps sur le fait des nuits tropicales** (paragraphe 1.1 de B), insérée dans la démonstration de A. Elle montre la trajectoire au lieu de la raconter.
2. **Le paragraphe « Ce que la commune ne peut pas dire »** et son vrai lien vers `/dossier`, comme pont entre la démonstration et les échelles. A dit déjà cette limite dans l'introduction des échelles ; B la rend actionnable.

**Ce que je ne reprends pas de B** : l'adresse en porte principale. Les deux portes doivent rester de même forme, et c'est la situation du visiteur qui choisit. L'orange reste sur « Je cherche où vivre », qui est l'entrée la plus large et celle qui fait comprendre le Projet. À revoir si les mesures montrent que les visiteurs arrivent surtout avec une adresse.

**La phrase de B**, « Votre futur lieu de vie ne tient pas dans une annonce. », reste la bonne ouverture de la section « Pourquoi futur•e ». Elle y est déjà.

---

## 7. Périmètre minimal pour le lancement, et ce qui peut attendre

**Pour le lancement (un lot d'intégration, sur une branche séparée) :**

1. **Remplacer le premier écran.**
   - Mettre la promesse et le sous-texte de A, les deux portes (`/ou-vivre`, `/dossier`) et la voie « Les comparer ».
   - Mettre la fiche du Projet à la place des cartes climat qui défilent.
   - Retirer le surtitre « Projection personnalisée ».
2. **Insérer la démonstration Sète** juste sous le premier écran : interrupteurs, quatre lectures réelles, chaîne fait → pour ce projet → limite → à vérifier, provenance datée.
   - Brancher `scripts/fut50/verifier-cas-sete.mjs` dans la vérification avant chaque mise en production qui touche le moteur. Si le moteur change une phrase, l'accueil ne doit pas continuer à la citer.
3. **Remplacer la section « 3 modules »** par la descente d'échelles (trois questions et Ma décision).
4. **Retirer de l'accueil l'encart « Dossier personnalisé / 6 questions »** tant que FUT-28 n'a pas rendu ce formulaire fidèle au Projet. Il promet une personnalisation que le moteur ne lit pas entièrement.
5. **Retirer l'animation `HeroProjetTerritoires`** (remplacée par la démonstration vraie).
   - **Garder** : la grille de tarifs et la section « Pourquoi futur•e ».
   - **Descendre sous les tarifs, ou retirer** : la recherche « Analyser ma commune / Vos questions sur votre commune » et la bande des sources.

**Peut attendre :**

- la navigation globale de FUT-86 (« Mes biens » et « Comparateur » retirés du menu, « Ma décision ») : chantier distinct, et l'accueil fonctionne avec le menu actuel ;
- le hub « Comprendre les risques de demain » : à requalifier avec FUT-52 (articles SEO) ;
- une démonstration personnalisée sur la commune du visiteur (FUT-57) ;
- un deuxième cas réel (une commune « Correspondance favorable », une commune sans donnée climatique) pour faire tourner la démonstration ;
- le pré-remplissage de `/ou-vivre` avec le Projet d'exemple : aujourd'hui, ni `/ou-vivre` ni `/dossier` n'acceptent de paramètre de pré-remplissage.

**Décisions à prendre avant l'intégration :**

1. **Garder la mer dans le Projet d'exemple**, au risque de « aucun constat » pour Sète en simple priorité, ou la retirer.
2. **Valider les formulations des quatre questions** et de la promesse avec l'Editorial Writer.

---

## 8. Grille d'évaluation et protocole court

**Aucun test utilisateur n'a été mené.** Voici de quoi en mener un, en une demi-journée.

**Participants.**

- Cinq à huit personnes qui ne connaissent pas futur•e, ayant un projet résidentiel dans les 18 mois (achat, location, mutation, retraite).
- Mélanger desktop et téléphone.
- Moitié A, moitié B, puis montrer l'autre direction en fin d'entretien.

**Protocole (20 minutes par personne).**

1. **Test des 5 secondes.** Afficher le premier écran 5 secondes, le masquer, puis demander : « À quoi sert ce site ? Que feriez-vous en premier ? »
2. **Choix de porte.** « Vous cherchez encore une ville » puis « Vous avez visité un appartement » : où cliquez-vous ? Noter la porte et l'hésitation.
3. **Démonstration.**
   - A : « Changez un réglage. Qu'est-ce qui a changé, et pourquoi ? »
   - B : « Ouvrez la lecture avec un projet. Qu'est-ce qui a changé ? »
4. **Incertitude.** « Que veut dire "Condition ouverte" ici ? Est-ce une mauvaise nouvelle ? »
5. **Échelles.** « Que vous apprendrait de plus l'examen d'une adresse précise ? »
6. **Intention.** « Qu'est-ce qui vous ferait payer pour un dossier ? Qu'est-ce qui vous en empêcherait ? »

**Grille de notation (0 = non, 1 = partiellement, 2 = oui), par participant.**

| Critère | Observable qui vaut 2 |
| --- | --- |
| Décision résidentielle comprise | la reformulation parle de choisir où vivre ou un logement, pas de risques ni de climat |
| Rôle du Projet compris | la personne dit, avec ses mots, que la lecture dépend de ce qu'elle cherche |
| Bonne porte choisie | les deux mises en situation mènent à la bonne porte sans hésitation de plus de 5 s |
| Donnée et interprétation distinguées | elle explique que le fait est le même et que sa place change |
| Incertitude jugée utile | « condition ouverte » est compris comme « à vérifier », pas comme un échec du site |
| Trois échelles comprises comme un approfondissement | elle décrit une descente commune → adresse → logement |
| Raison de payer crédible | elle cite une vérification ou une échelle, pas « plus de données » |
| Mobile | mêmes réponses sur téléphone, sans abandon dans la démonstration |

**Seuil.** Une direction ne passe à l'intégration que si quatre participants sur cinq obtiennent 2 aux trois premiers critères. Si les deux échouent sur le rôle du Projet, c'est la démonstration qu'il faut revoir, pas la mise en page.

---

## Annexe technique

**Fichiers ajoutés** (aucun fichier du site public n'est modifié) :

| Fichier | Rôle |
| --- | --- |
| `src/app/dev/fut50/layout.tsx`, `page.tsx`, `a/page.tsx`, `b/page.tsx` | routes de prototype, double garde 404 en production, non indexées |
| `src/components/prototypes/fut50/cas-sete.ts` | le cas réel : quatre lectures du moteur, mot pour mot, valeurs DRIAS |
| `src/components/prototypes/fut50/AccueilProjet.tsx` | direction A |
| `src/components/prototypes/fut50/AccueilPreuves.tsx` | direction B |
| `src/components/prototypes/fut50/commun.tsx` | portes, chaîne d'un fait, descente d'échelles, typographie française (`fr`) |
| `src/components/prototypes/fut50/fut50.module.css` | composition, posée dans les jetons « Le relevé » ; aucune couleur ajoutée |
| `src/components/prototypes/fut50/cas-sete.test.ts` | valeurs DRIAS contre `public/data_climat.json`, chiffres des phrases, voix |
| `src/components/prototypes/fut50/prototypes.test.ts` | garde 404, non-indexation, destinations réelles, ni donnée personnelle ni score |
| `scripts/fut50/verifier-cas-sete.mjs` | rejoue le moteur complet (réseau, IP française pour Géorisques) et compare chaque phrase |
| `scripts/fut50/capturer.mjs`, `scripts/fut50/interactions.mjs` | captures, états, clavier, mouvement réduit, vidéos |

**Vérifications faites le 12/10/2026 :**

- **Rejeu du moteur** : `node scripts/fut50/verifier-cas-sete.mjs` donne « Aucun écart » sur les quatre lectures.
- **Suite de tests complète** : 2 551/2 551, dont 6 tests FUT-50.
- **Qualité du code** : `tsc --noEmit` et `eslint` sans erreur ni avertissement sur les fichiers FUT-50.
- **Build de production** : `next build --webpack` réussi (288 pages).
- **Comportement en production** (`next start`) :
  - `/dev/fut50`, `/dev/fut50/a`, `/dev/fut50/b` renvoient 404 ;
  - `/`, `/ou-vivre`, `/dossier`, `/comparateur` renvoient 200.
- **Interactions** (`interactions.mjs`) :
  - les quatre états réels s'affichent ;
  - aucun débordement horizontal à 1440 et 390 px ;
  - focus visible sur les portes au clavier ;
  - en mouvement réduit, titre et portes sont présents immédiatement.
- **Accessibilité** : les interrupteurs sont de vrais `button role="switch"` avec état écrit en toutes lettres, et le verdict est annoncé par une région `aria-live`.

**Limites connues :**

- **Pas de lien d'évitement.** Au clavier, 12 à 15 tabulations traversent le menu avant d'atteindre les portes. Le défaut concerne tout le site, à traiter avec FUT-86.
- **Couverture des captures.** Le thème clair n'est pas capturé (les jetons s'y adaptent, non vérifié visuellement). Les captures de production datent du 12/10/2026 et suivent le consentement par défaut.

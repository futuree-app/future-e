# FUT-41 / FUT-22 · V5 : convergence des revues Claude et Work

9 novembre 2026 · exploration sur données fictives · branche `explore/fut-41-v4-centre-decision`, commits locaux, rien de poussé, fusionné ni déployé. Les moteurs, les paiements, les droits et Supabase ne sont pas touchés.

## En bref

La V5 garde **Ma décision comme espace unique**, avec trois entrées : **Vue d'ensemble**, **Comparer** (vos communes ou vos logements) et **Mon Projet**. Les fiches et le Relevé sont des profondeurs, avec leur fil d'Ariane.

Une seule forme de lecture sert partout, la **confrontation**. Pour chaque condition du Projet, ce qui est lu **à la commune**, puis ce qui se lit **depuis l'adresse** (aux abords ou dans le logement). Quand deux logements partagent la lecture de leur commune, **une seule case** les couvre tous les deux : on voit qu'elle ne les distingue pas, sans avoir à le lire. La fiche d'un logement montre cette même confrontation sur une colonne.

Le premier écran répond à trois questions : **où en suis-je** (trois phrases au plus), **que faire maintenant** (trois gestes au plus, chacun avec son bouton), **quelles sont mes possibilités** (communes et logements, rangés par commune).

**Ce qui est vérifié** : 78 captures (13 vues, 3 largeurs, 2 thèmes) sans débordement ni erreur ; 42 vérifications de parcours sur 42 ; tabulation avec contour visible sur 28 arrêts ; mouvement réduit respecté ; 42 tests du modèle (7 V5, 12 V4.1, 23 V4).

**Ce qui ne l'est pas** : aucune personne réelle n'a utilisé la V5 ; Safari, lecteur d'écran et téléphone physique n'ont pas été testés.

**Pour le voir** (serveur local) : `http://localhost:3041/dev/centre-decision-v5`, avec les situations du menu « Situation ». La V4 (`/dev/centre-decision`) et la V4.1 Claude (`/dev/centre-decision-v41`) restent intactes ; la V4.1 Work est archivée dans `prototype-v41-work/index.html`.

## 1. Le prototype V5

### Fichiers

- `src/components/prototypes/fut41-v5/` :
  - `modele5.ts` (confrontation, bilans, alertes, synthèses, gestes, portée d'une analyse) ;
  - `modele5.test.ts` ;
  - `scenarios5.ts`, `etat5.ts` ;
  - `CentreDecision5.tsx`, `Confrontation.tsx`, `PanneauAnalyse.tsx`, `Ajout5.tsx`, `Plan5.tsx`, `communs5.tsx` ;
  - `vues5/` (Ensemble, Comparer5, FicheLogement5, FicheCommune5, Projet5, Releve5) ;
  - `v5.module.css`.
- Route : `src/app/dev/centre-decision-v5/page.tsx` (404 en production).
- Recette : `outils/recette5.cjs`, résultat dans `recette-v5.json`, captures dans `captures-v5/`.

Le modèle V5 **réexporte sans les modifier** le contrat de comparaison V4 (`comparerCritere`, lecture partagée, conditions sans compromis, `trier`, `simuler`) et les gestes V4.1 (`gestePrincipal`, `etSi`, `valeurAnalyseAdresse`).

### Les sept situations demandées

| Situation (menu) | Ce qu'elle montre |
|---|---|
| Deux appartements à Nantes, un à Rennes (référence) | Deux rapports de commune ; un logement analysé, un logement à l'adresse connue mais non analysé, une annonce sans adresse |
| Nantes contre Rennes, sans adresse | Deux communes, aucun logement ; Comparer en mode « Vos communes », avec la carte |
| Plusieurs logements dans une même commune | Trois logements à Nantes : la lecture de Nantes occupe une seule case ; Saint-Félix a été analysé sous l'ancien Projet |
| Un logement pas encore analysé | Fiche du T4 rue de la Convention : ce que la commune dit, ce que l'analyse apprendrait et ne dira pas |
| Un dossier fait sous votre ancien Projet | Saint-Félix, mesuré à 23 min quand la limite était de 30 min : « pourrait ne plus tenir » la limite actuelle de 20 min |
| Après une visite | Le quai de la Fosse visité : questions, réponses datées, notes avec leur origine |
| Dix logements, dont trois écartés | Trois communes, dix logements, trois écartés avec leur raison ; rangement sur une dimension nommée ; quatre au plus côte à côte |

S'y ajoute « Je découvre Ma décision » (recherche vide), qui propose **deux entrées de même poids** : une commune, ou une adresse ou une annonce.

### Parcours vérifiés (`recette-v5.json`)

| Parcours | Ce que la recette vérifie |
|---|---|
| Premier écran | Trois phrases au plus ; ce qui distingue et ce qui manque ; trois gestes au plus ; lieux nommés ; section des lieux à moins de 1 100 px ; aucun mot du moteur |
| A · Recherche vide | Deux entrées ; la commune est reconnue dans l'adresse ; le logement et sa commune sont gardés ; l'analyse est proposée sans être lancée |
| B · Nantes contre Rennes | Ce qui les distingue, lu de la même façon ; la gare « pas encore comparable » avec son remède ; carte ; la commune ne promet rien pour un logement |
| C · Logements de deux communes | Une seule case communale pour les deux logements de Nantes ; rien aux abords sans analyse d'adresse (S7) ; le verdict communal nomme les communes ; aucun classement |
| D · Logement non analysé | Le panneau dit ce que l'analyse apprendra et ce qu'elle ne dira pas, et son prix ; Échap rend le focus ; le dossier daté apparaît après simulation |
| E · Ancien Projet | Conclusion conservée sans être reconduite ; « pourrait ne plus tenir » ; limite d'alors sur la règle ; une mise à jour ne lit pas plus loin que l'analyse d'origine |
| G · Après une visite | S8 corrigé ; réponse datée, sans effet sur la donnée publique ; note rangée avec son origine |
| H · Dix logements | Écartés consultables ; rangement par prix déclaré avec sa note ; choix avant de comparer ; quatre au plus |
| Et si… ? | Les cinq groupes ; ce qui ne peut pas être déduit ; adoption inscrite dans « Ce qui a changé » |
| Z12 | La condition non tenue est dite une fois ; la mesure de 24 min reste dans le détail |
| Retour | Même conclusion fiche et Relevé ; le bouton retour du navigateur rouvre la fiche |
| Mobile | Deux colonnes à la fois ; changer celle de droite change la confrontation |

## 2. Comparatif V4, V4.1 Claude, V4.1 Work, V5

Planches dans `comparatif-v5/`, une colonne par version, recadrées au même haut de page :

1. Le premier écran ;
2. La recherche vide ;
3. Nantes contre Rennes ;
4. Comparer des logements de deux communes ;
5. Un logement dont seule la commune est lue ;
6. Comparer sur téléphone.

| Question | V4 | V4.1 Claude | V4.1 Work | V5 |
|---|---|---|---|---|
| Une commune sans logement existe-t-elle ? | Non : la recherche commence par un logement | Oui, la commune est une « piste » | Oui, la commune porte ses logements | Oui. Elle se compare seule, et une adresse emmène sa commune |
| Premier écran | Projet détaillé et phrases techniques ; logements loin | Synthèse en points, Projet en colonne, plan | Projet court, puis communes et logements ; synthèse brève | Projet en une ligne, trois phrases, trois gestes, puis les lieux |
| Comparer | Matrice N logements, puis face-à-face | Sens d'abord, cartes qui défilent, tableau par échelle | Deux onglets, deux possibilités, valeurs sur une règle | Deux modes ; deux à quatre colonnes ; rangs « apporte, demande, pourrait changer, geste » ; détail par couches |
| Lecture communale partagée | Dite par une phrase | Une colonne par commune, à part | Repliée : « une seule lecture » | Une seule case qui couvre les logements concernés |
| Mobile | Matrice qui défile | Cartes qui se font glisser | Deux colonnes, sélecteurs | Face-à-face de deux parmi la sélection, sélecteurs collants |
| Geste payant | Surtout dans la fiche | Bouton avec ce qu'il apprend et ne dira pas | Bouton par état, puis modale | Bouton par état, puis panneau : ce que vous saurez, ce qu'elle ne dira pas, prix |
| Projet | Modale « Et si » | Colonne et panneau « Et si » | Page Mon Projet | Page Mon Projet : essayer, adopter, ce qui a changé |
| Fonctions avancées | Toutes (ajout assisté, vérifications, tri, Faire le point) | Presque toutes | Notes ; pas d'ajout assisté ni de tri | Toutes, sauf Faire le point devenu synthèse contextuelle |
| Recette navigateur | 84 captures | 72 captures, 28 tâches | Non faite (navigateur indisponible) | 78 captures, 42 vérifications |

## 3. Décisions : conservées, modifiées, rejetées

### Conservées

| Décision | Origine | Pourquoi |
|---|---|---|
| Ma décision, espace unique | V4, confirmée par les deux revues | La fiche et le Relevé en sont des profondeurs ; aucune destination concurrente |
| La commune est une possibilité à part entière | Les deux revues | « Nantes ou Rennes ? » se pose avant toute annonce |
| Le sens avant le détail | Claude | Une personne doit savoir ce qui compte avant de lire une matrice |
| « Apporte, demande d'accepter, pourrait changer, prochain geste » | Claude | La décision est un arbitrage ; ces quatre rangs le rendent lisible sans score |
| Un geste principal par possibilité, selon son état | Les deux revues | Le bon geste est visible là où on en a besoin |
| L'appel payant dit ce qu'il ne dira pas | Claude | Montrer la valeur sans promettre de tout résoudre |
| Comparaison critère par critère, contrat V4 | V4, note FUT-22 | Le prototype réutilise le contrat sans le modifier |
| Z12 : une seule alerte ; la mesure reste dans le détail | Brief, précisée par Work | Le verdict est dit une fois ; la mesure, le seuil et la source restent dans la condition concernée |
| « Et si » en groupes, adoption distincte | Claude et Work | Essayer ne modifie rien ; adopter est un geste explicite |
| Écart avec raison et condition d'alors, remise en course | V4 | La mémoire des arbitrages est une valeur propre au centre |
| Photo personnelle facultative, jamais d'illustration | Les deux revues | Repère de reconnaissance, absent des cellules de comparaison |

### Modifiées

| Décision | Avant | V5 | Pourquoi |
|---|---|---|---|
| Comparer | Choix libre mélangeant communes et logements (V4.1 Claude) ; deux possibilités seulement (Work) | Deux modes explicites ; de deux à quatre colonnes | Une commune et un logement ne se comparent pas sur les mêmes échelles. Au-delà de quatre colonnes, la lecture se dégrade |
| Mobile | Cartes qui défilent (Claude) | Face-à-face de deux, sélecteurs collants (idée Work) | Les valeurs doivent être visibles en même temps ; une succession de cartes oblige à mémoriser |
| Lecture communale | Colonne par commune séparée des logements (Claude) | Case unique qui couvre les logements qui la partagent | Le partage se voit sans phrase |
| Fiche et Comparer | Deux présentations différentes | Une seule confrontation, une ou plusieurs colonnes | Moins de formes à apprendre, aucune répétition de texte |
| Mesures | Texte (Claude) | Valeur sur une règle, limite actuelle en tirets, limite d'alors en pointillé (idée Work) | Le seuil se voit ; la donnée ne s'anime pas |
| Geste payant | Clic direct depuis une liste (Claude) | Toujours un panneau avant de lancer | Rien de payant en un clic ; l'apport et les limites sont lus d'abord |
| Pass Recherche | Bloc « Votre accès » permanent (Claude) ; pied de page (V4) | Une ligne dans le panneau, quand au moins deux possibilités attendent une analyse | Le Pass arrive au moment utile, sans occuper l'espace de décision |
| Vocabulaire | « Piste », « départage », « fait la différence » | « Vos communes et vos logements », « les distingue », « possibilité » en dernier recours | Langage courant ; le vocabulaire du moteur reste absent de la première lecture |
| Carte | Plan en colonne sur l'accueil (Claude) | Carte dans Comparer, quand les communes diffèrent ; échelle 50 km, nord | Elle situe des communes au moment où on les compare ; l'accueil s'allège |
| Positions des villes | Angers placée à l'ouest de Nantes (erreur V4.1 Claude) | Positions approchées des vraies villes | Corrigé |
| Faire le point | Destination (V4) | Synthèse contextuelle : « Où vous en êtes » et « En bref » | Il répétait l'accueil |
| Tri | « À examiner maintenant » parmi les dimensions (V4) | « À faire maintenant » séparé ; rangement par commune, prix, surface, trajet mesuré, ordre d'ajout | Un ordre « maintenant » peut se lire comme une recommandation (critique Work) |

### Rejetées

| Proposition | Origine | Pourquoi |
|---|---|---|
| Choisir librement communes et logements dans une même comparaison | V4.1 Claude | Deux modes sont plus clairs ; on passe de l'un à l'autre en un geste (« Comparer leurs communes ») |
| Porter le HTML de Work dans React | Brief | Les intentions sont reprises (règle de mesure, origine des notes, deux modes, face-à-face mobile) avec les composants canoniques du Relevé |
| « Le compromis de calme ne touche plus la chambre » après « sur cour » | V4, V4.1 Claude | S8 : une cour peut être bruyante, une visite ne dit rien des nuits d'été |
| « Mettre à jour ramènerait dans le même cadre » quelle que soit la cause | V4 | Une mise à jour ne lit pas plus loin que l'analyse d'origine ; seule une analyse d'adresse lit les abords |
| Rappeler une lecture communale favorable dans le bilan d'un logement non analysé | Tentation de la V4.1 | Une gare dans la commune ne prouve pas un trajet depuis l'adresse (S7). Seule une réserve communale est rappelée, comme point à vérifier |
| Plus de quatre colonnes côte à côte | V4 (N colonnes) | Illisible à 1 440 px ; le choix se fait avant |

## 4. Passe éditoriale avant / après

La première lecture répond à trois questions : où en suis-je, qu'est-ce qui distingue mes possibilités, que faire maintenant. Le vocabulaire du moteur (départage, établi, millésime, grain, cadre) est absent de la première lecture, et la recette le vérifie sur l'accueil. Les réserves restent à côté de la conclusion qu'elles concernent.

| Avant | Version | Après (V5) |
|---|---|---|
| Votre recherche commence par un logement | V4 | Par où commencer ? Une commune qui vous tente, ou une annonce déjà repérée : les deux se valent. |
| Votre prochain lieu de vie. | Work | Nantes ou Rennes ? (le titre nomme la recherche) |
| Vos pistes | V4.1 Claude | Vos communes et vos logements |
| Se compare : la commune, le logement | V4 (S7) | Supprimé : chaque condition dit, couche par couche, ce qui est lu ou « à lire depuis l'adresse » |
| Départage / Fait la différence | V4, V4.1 | Les distingue |
| Ne se compare pas / Pas encore comparable | V4, V4.1 | Pas encore comparable, suivi de la raison en clair et du remède |
| Les données lues ne sont pas du même millésime | V4 | Ces deux analyses ne reposent pas sur les mêmes années de données : BPE 2025 pour…, BPE 2024 pour… |
| Établi d'un seul côté | V4 | Connu d'un côté seulement : à vérifier pour… |
| Mettre à jour ramènerait… dans le même cadre | V4 | Mettre à jour l'analyse la plus ancienne (gratuit pour un dossier acquis) lèverait cet écart. Ou, si l'échelle manque : Une mise à jour ne suffirait pas : seule l'analyse de l'adresse le lirait au même endroit. |
| Correspond ancien | V4 | Lu quand votre limite était de 30 min (sur la règle : « mesuré quand elle était de 30 min ») |
| Fait sous votre Projet du 12 sept. | V4.1 Claude | Conclusion conservée telle qu'elle a été écrite, sous votre Projet du 12 sept. Elle n'est pas reconduite pour votre Projet actuel. |
| La ventilation nocturne devient possible ; le bruit du quai ne touche pas la chambre | V4.1 Claude (S8) | La chambre donne sur cour : aérer la nuit devient envisageable. Le bruit de la cour la nuit et la chaleur de la chambre en été restent à vérifier. |
| Elle vaut pour les logements de Nantes proches de ce cabinet | V4.1 Claude | Il vaut pour ce cabinet, à cette date. |
| Reste inconnu | V4.1 Claude | Pourrait changer l'arbitrage |
| Faites glisser pour voir les 3 options | V4.1 Claude | Supprimé : sur téléphone, deux colonnes côte à côte |
| 01 À regarder avant de choisir | Work | En bref (sans numérotation) |
| Votre accès | V4.1 Claude | Supprimé de l'accueil : prix et Pass dans le panneau, au moment de lancer |
| Être davantage analysé ne rend pas un lieu meilleur | Work | Supprimé : aucun écran ne range par niveau d'analyse, la règle n'a plus besoin d'être dite |

Trois choix éditoriaux restent à trancher :
- « Projet » garde sa majuscule, comme dans le brief, en attendant l'harmonisation de FUT-118 ;
- « possibilité » n'apparaît que là où « commune ou logement » serait trop lourd ;
- les dates restent visibles partout où elles changent la lecture.

## 5. Fonctionnalités : complètes, simulées, absentes

**Complètes dans le prototype** (elles fonctionnent avec des données fictives, en mémoire) :

- garder une commune, ou un logement par son adresse ou son annonce ; la commune est reconnue dans l'adresse ;
- ajout assisté par texte collé : valeurs proposées avec l'extrait qui les fonde, confirmées une par une ;
- statut d'un logement ; écart avec raison et condition invoquée ; remise en course ; historique ;
- vérifications par moment (avant la visite, sur place, avant de s'engager), réponses datées avec leur origine ;
- notes avec leur origine (vu par moi, dit par le vendeur ou l'agence, lu dans un document) ;
- comparaison en deux modes, de deux à quatre colonnes, face-à-face mobile ;
- confrontation par couches, lecture communale partagée, verdict et remède par condition ;
- rangement sur une dimension nommée : prix ou loyer déclaré, surface déclarée, trajet mesuré depuis l'adresse, ordre d'ajout ;
- « Et si… ? » sur une limite, une exigence ou le budget ; adoption explicite ; « Ce qui a changé » ;
- Relevé simplifié avec ses versions ; routage par l'adresse de la page, bouton retour ; thèmes clair et sombre ; photo locale.

**Simulées** (résultats écrits d'avance, aucun moteur appelé) :

- l'analyse de deux adresses (T4 rue de la Convention, T4 place Sainte-Anne) et la lecture d'Angers ;
- la mise à jour d'un dossier ou d'un rapport (nouvelle version, l'ancienne reste lisible) ;
- le Pass Recherche : bascule de démonstration, solde fictif, ni prix ni quota décidés ;
- la carte : positions approchées, distances à vol d'oiseau.

**Absentes** :

- persistance : tout disparaît au rechargement ; comptes, droits réels, paiement ;
- le vrai Relevé et la navigation entre modules ; l'emblème complet en rendu serveur (il n'est pas hydratable, voir la V4) ;
- l'effet d'une réponse de visite sur la lecture : la réponse est gardée et expliquée, sans réévaluation moteur (FUT-21) ;
- le partage d'un arbitrage, l'export, la comparaison entre deux états de la recherche ;
- les rappels de visite, la carte intercommunale avec adresses exactes.

## 6. À vérifier avec de vraies personnes

À mener avec trois à cinq personnes en recherche réelle, sans guidage, en comparant la V4.1 Work et la V5 sur les mêmes tâches. On note ce qu'elles comprennent et ce que cela change à leur choix, en plus du temps passé.

1. **La case partagée.** Comprend-on, sans lire la mention, qu'une lecture communale ne distingue pas deux logements de la même commune ?
2. **« À la commune » et « aux abords ».** La différence se comprend-elle ? Une personne croit-elle qu'un logement non analysé « tient » la gare parce que sa commune la tient ?
3. **Trois phrases suffisent-elles ?** Une personne peut-elle redire où elle en est, ce qui distingue ses possibilités et ce qu'il lui reste à faire ?
4. **Le panneau d'analyse.** « Ce qu'elle ne dira pas » rassure-t-il ou décourage-t-il ? Le prix est-il compris au bon moment ?
5. **Le Pass Recherche.** La ligne du panneau suffit-elle à le faire connaître sans gêner ?
6. **Deux modes de comparaison.** Passe-t-on naturellement des communes aux logements, et inversement ?
7. **Le face-à-face mobile.** Change-t-on facilement l'un des deux ? Perd-on de vue les autres ?
8. **« À revoir ».** « Pourrait ne plus tenir » est-il compris comme une incertitude, ni rassurante ni alarmante ?
9. **La règle de mesure.** Les tirets de la limite et le pointillé de la limite d'alors se lisent-ils sans légende ?
10. **Les photos.** Une photo personnelle influence-t-elle le jugement ?

## 7. Plan de développement de production

Le premier lot doit déjà respecter les trois objets **commune, logement, dossier**. Un modèle « logements seulement », complété plus tard par les communes, coûterait une reprise. Chaque lot sort par une PR relue ; aucune règle du moteur n'est déplacée vers l'interface.

| Lot | Contenu | Tickets | Critère de sortie |
|---|---|---|---|
| A · Socle | Persistance des communes et logements (la table proposée dans l'audit « mémoire multi-biens » de la V4) ; journal des écarts avec condition d'alors ; aucune perte des dossiers acquis. Hydratation de l'emblème corrigée | FUT-41, FUT-27 (fusionnée) | Garder et retrouver une commune sans logement, un logement sans adresse, après reconnexion |
| B · Contrat de comparabilité dans le moteur | Cadre par critère (échelle, sources, années, version du Projet, règles touchées) servi par le moteur ; table des capacités d'une analyse d'adresse (`criterionCapability`) | FUT-22, FUT-12, FUT-173 (préalable) | Le moteur sert les données d'une case de confrontation ; aucune comparabilité décidée dans l'interface |
| C · Vue d'ensemble et Mon Projet | Trois phrases, trois gestes, lieux rangés par commune ; Projet compact ; Mon Projet : essayer, adopter, ce qui a changé | FUT-41, FUT-86, FUT-118 | Tâches A, E et Et si exécutables sans explication orale |
| D · Comparer | Deux modes, deux à quatre colonnes, rangs du bilan, confrontation par couches, face-à-face mobile, carte | FUT-22, FUT-41 | Tâches B, C et Z12 ; recette 360, 390 et 1 440 px, clair et sombre, clavier, Safari |
| E · Panneau d'analyse et Pass | Portée avant tout geste payant ; prix réel ; Pass présenté quand deux analyses ou plus sont utiles ; mise à jour distincte de l'analyse d'adresse | FUT-49, FUT-122 | Compréhension de l'offre observée en test ; aucune promesse d'illimité ; échec non décompté |
| F · Vérifications et réévaluation prudente | Réponses avec origine et date ; effet prudent sur la lecture (S8) ; inconnue restante toujours dite | FUT-21 | Un cas complet où une réponse change honnêtement la lecture, sans devenir une preuve générale |
| G · Enrichissements | Photo stockée, export et partage d'un arbitrage choisi, comparaison entre deux états | FUT-41, FUT-49, FUT-86 | Chacun justifié par un besoin observé |

Le prompt du lot A reste celui de l'audit V4, complété par une règle : **la commune est un objet de premier rang**, et un logement ajouté par son adresse crée ou rattache sa commune.

## 8. Questions qui vous reviennent

1. **Valider la structure** : Ma décision unique, avec Vue d'ensemble, Comparer en deux modes et Mon Projet.
2. **Valider la case partagée** comme représentation de la lecture communale (à confirmer par le test, point 6.1).
3. **Quatre colonnes au plus** côte à côte : acceptez-vous cette limite ?
4. **Le geste payant passe toujours par un panneau**, jamais par un clic direct depuis une liste.
5. **Lancer le test à trois ou cinq personnes** (section 6) avant le lot D.
6. **Donner l'accès à ChatGPT** : la V5 n'est pas poussée. Si vous le souhaitez, je construis la version statique et je pousse la branche pour un lien raw.githack.

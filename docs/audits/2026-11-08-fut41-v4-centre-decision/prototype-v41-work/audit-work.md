# FUT-41 / FUT-22 — Revue indépendante et proposition V4.1 Work

8 novembre 2026 · exploration sur données fictives · aucune publication, fusion, migration ou modification de production.

## Décision proposée

**Conserver le socle de V4, mais ne pas en faire encore la référence d’implémentation complète.** Son principal défaut est structurel : elle fait commencer la recherche par un logement, alors que futur•e doit accompagner le choix d’une commune avant toute adresse. Son deuxième défaut est la charge de lecture : les justifications du moteur prennent la place des actions et des possibilités à comparer.

La V4.1 propose une recherche organisée par communes, des logements rattachés à chacune, deux niveaux explicites de comparaison et un Projet accessible en permanence. Elle conserve l’absence de score, la provenance, les conclusions datées et la distinction entre simulation et adoption d’un changement.

**Livraison : proposition interactive, non validée visuellement.** Le prototype autonome est écrit, sa syntaxe JavaScript et 22 contrôles de logique/rendu textuel passent. Le navigateur de cette session ne peut pas atteindre son serveur local ; le chargement d’un document par URL `data:` a également été refusé par la politique du navigateur. Aucun contournement n’a été tenté après ce refus. Les captures V4.1, la recette mobile, les interactions réelles V4.1 et le test du mouvement réduit restent à effectuer. Ce livrable n’est donc pas un GO de production ni une validation d’utilisabilité.

## 1. Périmètre et preuves

### Sources directement consultées

- Prototype public V4 sur la branche `explore/fut-41-v4-centre-decision` : accueil complet, comparaison d’ensemble, fiche Sternes, Faire le point, simulation gare 20 → 30 minutes, état vide, S7 et S8. Inspection du DOM et captures desktop et mobile S7 à 390 px.
- README V4 : architecture, état des capacités, règles proposées et décisions Z1 à Z11.
- `DESIGN.md`, `design-tokens.css`, primitives et CSS du Relevé.
- `CentreDecision.tsx`, `etat.ts`, `modele.ts` V4 ; examen ciblé du module de comparaison de production et de `vos-lieux.ts`.
- Historique V3.2 : note FUT-22, comparaison au Relevé et audit FUT-41/FUT-86 du 21 octobre, sur la branche historique. Ces documents ne sont pas une recette visuelle indépendante de V3.3.
- Tickets FUT-22, FUT-21, FUT-49, FUT-86, FUT-118 et commentaires FUT-41. Aucune écriture dans Linear.

Le commit `1f6e5e87` est celui annoncé par le porteur. Les lectures ont ciblé la branche et l’URL données ; je n’ai pas établi une identité cryptographique entre le contenu servi en cache et ce commit. Les 84 captures et 24 gestes annoncés par l’auteur ne constituent pas ma propre recette.

### Gestes réellement observés sur V4

| Geste | Observation |
|---|---|
| Accueil → comparaison | Matrice de six logements, synthèse puis détail par critère |
| Comparaison → fiche Sternes | Dossier, preuves, vérifications, annonce, notes et historique présents |
| Accueil → Et si → 30 min | Simulation clairement annoncée ; mesure 26 min citée, incertitude restante explicitée |
| Menu → scénario vide | Titre « Votre recherche commence par un logement » ; formulaire logement ouvert |
| Menu → S7 | Face-à-face d’un dossier adresse et d’un rapport communal, motifs de non-comparabilité détaillés |
| Accueil → Faire le point | Reprise de nombreuses phrases déjà lues sur l’accueil |
| S8 → chambre sur cour | Affichage avant / effet / inconnue restante ; historique complété |
| S8 → écarter avec raison | Raison et date visibles ; bouton « Remettre en course » présent |

Les retours depuis toutes les profondeurs, la restauration après écart et les huit tâches intégrales n’ont pas tous été rejoués de bout en bout. Aucun test avec des personnes réelles, Safari, VoiceOver ou lecteur d’écran n’a été mené.

## 2. Ce qui fonctionne dans V4

1. **Un espace unique, Ma décision.** La fiche et le dossier en sont des profondeurs, pas des produits concurrents.
2. **La matière de décision est présente.** Projet, limites, annonces, observations, dossiers et historique sont distingués.
3. **La comparaison commence par le sens.** Contradictions, différences et vérifications précèdent la matrice : conserver cette intention.
4. **Et si est une bonne interaction.** Le cas 20 → 30 min rend un compromis tangible sans modifier silencieusement le Projet.
5. **Le Relevé est reconnaissable.** Archivo, filets, formes et marges produisent une continuité documentaire utile.
6. **La mémoire de l’écart fonctionne.** La raison est explicite et le logement reste consultable.

Il serait contre-productif de remplacer cela par une galerie immobilière, un tableau de bord à compteurs ou un classement opaque.

## 3. Les cinq obstacles prioritaires

| Importance | Constat observé | Conséquence | Solution V4.1 |
|---|---|---|---|
| Bloquant pour la compréhension | L’état vide impose un logement ; les actions disent « Vos logements » / « Comparer mes logements » | Une personne hésitant entre Nantes et Rennes ne trouve pas sa recherche | Commune enregistrable seule, bloc communal autonome, logements rattachés, comparaisons Communes / Logements |
| Bloquant pour la vérité perçue | S7 affiche « Se compare : la commune, le logement » alors que Lavoir est annoncé « Commune analysée · adresse pas encore analysée » | Un résumé global donne une assurance que le détail ne permet pas | Comparabilité au niveau du critère et de l’échelle réellement observée ; supprimer cette promesse globale |
| Gênant majeur | Premier écran dominé par Projet détaillé et trois phrases techniques ; les logements commencent très bas | On lit le système avant de retrouver sa recherche | Projet condensé, lieux immédiatement après, synthèse courte contextualisée à la comparaison |
| Gênant majeur | Faire le point répète l’accueil, puis la comparaison répète encore des différences | Trois passages pour une même compréhension | Faire le point devient une fonction de synthèse, incarnée dans l’accueil et la comparaison ; Prochaines étapes rassemble les gestes |
| Gênant majeur | « Prochain pas » souvent décrit en prose dans les listes ; appel à l’analyse surtout dans la fiche | La personne comprend ce qui manque mais doit chercher comment agir | Bouton par état : préciser, analyser, ouvrir, réexaminer ; valeur supplémentaire expliquée à l’ouverture |

### Autres points à corriger

- **S8 va parfois trop loin.** Après « chambre sur cour », la phrase « Le compromis de calme ne touche plus la chambre » est trop catégorique. Une cour peut être bruyante ; une visite n’établit pas le calme nocturne. Préférer : « La chambre donne sur cour d’après votre visite ; le bruit la nuit reste à vérifier. » La structure avant / après / inconnue est bonne, la règle d’inférence doit être plus prudente.
- **« Mettre à jour … ramènerait … dans le même cadre » dans S7** promet trop si l’écart vient de commune vs adresse. Une actualisation du seul rapport communal ne mesure pas les abords. Distinguer mise à jour et approfondissement à l’adresse.
- **Le tri “À examiner maintenant”** mélange temporalité, manque de données et contraintes. Ce n’est pas un score, mais sa position peut être lue comme une recommandation. Afficher une liste de tâches motivées, séparée de l’ordre des lieux.
- **Les emblèmes ne suffisent pas à enseigner les états.** Garder les libellés écrits ; ne pas convertir la profondeur d’analyse en qualité du lieu.
- **Grands paragraphes sur toute la largeur** : réserver la grande largeur aux comparaisons, et garder une piste de prose courte.
- **Les informations sur l’offre en pied de page** sont éloignées de l’action concernée. Les rendre contextuelles sans faire du Pass le sujet principal de l’écran.

## 4. Architecture cible

| Élément | Rôle | Geste principal | Retour |
|---|---|---|---|
| Ma décision | Retrouver communes et logements de la recherche | Ajouter un lieu, choisir une comparaison | Destination racine |
| Mes lieux | Vue principale de Ma décision, pas nouvelle destination globale | Ouvrir commune ou logement | Sans changement de contexte |
| Prochaines étapes | Visites et inconnues actionnables | Préparer, demander, renseigner | Mes lieux |
| Mon Projet | Critères, conditions sans compromis, évolution | Modifier explicitement ou simuler | Ma décision |
| Comparer | Arbitrer à une échelle choisie | Choisir deux possibilités, ouvrir preuve ou fiche | Conserver sélection et échelle |
| Fiche logement | Situation de ce candidat, observations, historique | Préparer visite / ouvrir dossier | Comparaison d’origine ou Ma décision |
| Dossier / Relevé | Preuve approfondie, conclusion à sa date | Lire les trois échelles | Fiche ou comparaison d’origine |
| Faire le point | Fonction de synthèse, pas quatrième destination permanente | Lire les compromis et prochaines actions | Intégré aux vues ci-dessus |

Ne pas renommer « Ma décision » en « Ma recherche » : le choix historique de l’espace est conservé. « Recherche » décrit son contenu. L’en-tête du prototype autonome est volontairement limité à l’espace étudié ; les vraies entrées Où vivre / Explorer restent à intégrer dans FUT-86.

**Routes de production recommandées :** identité du lieu portée par l’URL et sélection de comparaison restaurable. La V4.1 autonome garde son état en mémoire ; elle ne démontre pas encore les retours natifs du navigateur ni la persistance des sélections après rechargement. À reprendre du routage V4, pas à supprimer dans le produit.

## 5. Communes et logements : réponses aux sept questions

1. **Représentation.** Une commune est une piste territoriale ; un logement est un candidat rattaché. Un dossier est une analyse accessible, pas le candidat lui-même. Un ajout ne crée aucun droit payant.
2. **Hiérarchie.** Oui à commune → logements dans la liste, sans enfermer la comparaison dans un seul groupe. Une commune reste visible même sans logement ; écarter le dernier logement ne l’efface pas.
3. **Nantes / Rennes.** Comparaison Territoire autonome, avec critères communaux uniquement. Un aperçu gratuit reste distinct d’une conclusion personnalisée.
4. **Deux adresses.** Sélection de logements indépendamment de leur commune. Chaque section indique Territoire, Autour ou Logement ; la comparabilité se décide par critère, pas par le type commercial du dossier.
5. **Donnée commune.** Montrer une seule lecture partagée si l’identité de commune, les données, le Projet applicable et les règles concordent. Le seul nom de commune ne suffit pas en production. Pas de répétition présentée comme deux preuves indépendantes.
6. **Adresse inconnue.** Le candidat reste sous sa commune, avec un nom reconnaissable et « Renseigner l’adresse ». Le rapport communal reste accessible. Aucun signal de qualité négatif.
7. **Continuité.** Même Projet et même liste. Les onglets Communes / Logements changent la question, pas la recherche. Depuis deux logements de communes différentes, on peut ouvrir leurs deux territoires ; depuis deux voisins, leur rapport communal commun.

### Scénario de référence implémenté

- Nantes : Rapport Territoire ; appartement sur cour analysé ; T3 avec balcon à adresse connue non analysée.
- Rennes : Rapport Territoire ; duplex enregistré, adresse exacte inconnue.
- Projet : location, gare à moins de 20 min à pied, calme et confort d’été, budget déclaré.

Les villes sont réelles **comme repères de scénario seulement**. Les adresses, loyers, surfaces, mesures, constats et projections sont inventés et signalés comme tels. Il n’y a aucune analyse réelle de Nantes ou Rennes dans ce livrable.

## 6. Appels à l’analyse et Pass Recherche

| État | Action visible | Valeur à annoncer | Limite à préserver |
|---|---|---|---|
| Lieu enregistré | Examiner la commune / compléter le lieu | Commencer par le contexte disponible | Aucun dossier acquis par le simple ajout |
| Aperçu gratuit | Examiner la commune | Lecture personnalisée du territoire | Aperçu ≠ verdict au Projet |
| Rapport Territoire | Ouvrir le rapport / comparer les communes | Arbitrage entre contextes communaux | Aucun jugement sur un logement |
| Adresse connue, non analysée | Analyser cette adresse | Trajet, abords, risques et données bâtiment disponibles | Ne résout pas toutes les inconnues |
| Adresse inconnue | Renseigner l’adresse | Permettre un examen à l’adresse | Aucun paiement avant identification |
| Dossier ancien | Ouvrir le dossier ; réexaminer si pertinent | Nouvelle lecture sous le Projet et les données courantes | Ancien dossier conservé ; pas de promesse de comparabilité automatique |
| Dossier acquis avec Pass | Ouvrir le dossier | Accès à l’existant sans nouvel achat | Nouvelle adresse et actualisation ont des droits distincts |

Le Pass est présenté au moment d’envisager plusieurs analyses, avec droit, durée et solde réels quand ils seront décidés. Aucun tarif nouveau n’est fixé ici. La simulation du Pass ne décompte rien. Les hypothèses de FUT-49 ne doivent pas devenir des promesses d’illimité.

**Valeur payante plausible :** comprendre les compromis pendant toute la recherche, puis réduire une inconnue au moment utile. Une liste de favoris plus agréable ne suffit pas. La disposition à payer reste à tester ; la qualité du prototype ne la prouve pas.

## 7. Projet et « Et si… ? »

Conserver une seule condition manipulée à la fois. Montrer avant / seuil essayé / candidats susceptibles d’être concernés / ce qui reste indéterminé. Le bouton « Adopter 30 min dans mon Projet » est distinct de la simulation.

Le cas de référence contient une mesure de 26 min dans le scénario Deux adresses analysées : passer de 20 à 30 peut changer le côté du seuil. Cela n’est pas une nouvelle conclusion moteur. Les dossiers gardent leur seuil d’origine ; les candidats sans mesure restent inconnus.

Trois niveaux doivent rester distincts :

- **Donnée déjà connue :** « 26 min mesurées dans le dossier du… ».
- **Interprétation conditionnelle :** « Ce trajet pourrait entrer dans votre nouvelle limite ».
- **Nouvelle lecture :** obtenue seulement par une analyse explicite, avec version conservée.

Ne pas affirmer que les autres critères sont recalculés ou inchangés dans le moteur tant que leurs dépendances ne sont pas connues. Les anciennes conclusions restent **consultables à leur date** ; elles ne sont pas automatiquement déclarées valables pour le nouveau Projet.

Réexaminer un écarté : afficher la raison et le critère invoqué à l’époque, puis proposer de le remettre en course. Un changement de Projet ne le réactive jamais automatiquement.

## 8. Comparaison : ordre et Z12

Ordre recommandé : condition sans compromis non tenue ; différence établie utile au Projet ; compromis ; inconnues ; geste utile. Les mesures détaillées et preuves suivent, sans recopier toutes les phrases de synthèse.

**Z12 : une seule alerte de synthèse.** Un trajet incompatible apparaît dans l’alerte principale. Dans la ligne trajet, conserver la mesure, le seuil et la provenance : cela permet de comprendre la différence sans répéter l’alerte textuelle. Un renvoi vers cette ligne sera utile dans l’intégration React. Ne pas retirer la donnée de la comparaison sous prétexte de dédoublonnage.

La V4.1 privilégie le face-à-face, avec choix de deux candidats dans une liste de N. Elle ne remplace pas encore la vue d’ensemble multi-colonnes V4. Pour trois finalistes, proposer ensuite une vue par critère à trois colonnes sur grand écran ; sur mobile, deux candidats persistants avec changement du second. Aucun “meilleur logement”.

## 9. Design, photos, cartes et mobile

**Le Relevé est conservé comme langage :** tokens canoniques incorporés, Archivo auto-hébergée intégrée au fichier, filets, plaque unique par mouvement, marge de preuve, cercle / carré / losange et texte explicite. La version autonome transpose ces formes en HTML ; elle n’importe pas les composants React canoniques. L’intégration devra revenir à ces composants, notamment au vrai Logo et à l’emblème complet. Ce sont des écarts techniques du prototype, pas une nouvelle charte.

La simplification repose sur la composition et la rédaction, pas sur une disparition des limites. Valeurs et seuils sont dessinés sur une règle de 0 à 40 minutes ; les données ne s’animent pas. Les preuves détaillées restent à un geste.

**Photographies : oui comme repères, pas comme arguments.** Photo fournie par la personne, facultative, petite dans la liste et plus grande dans la fiche. Pas d’image de bien inventée, pas de paysage générique supposé représenter le quartier. L’ajout local est codé, non testé au navigateur. Aucun téléchargement automatique d’annonce. Les photos n’occupent pas la synthèse comparative ; tester une miniature optionnelle si les noms ne suffisent pas à reconnaître les candidats.

**Communes sans photo :** nom + emblème, sans emplacement vide ni image de remplissage.

**Carte :** utile pour situer les logements, une gare et les distances ; moins utile pour trancher un compromis climatique ou une incertitude de dossier. La carte doit indiquer adresses approximatives, commune seule et adresse exacte différemment. Pas de point précis pour une adresse inconnue. P2, non implémenté.

**Mobile :** deux colonnes de valeurs courtes pour un seul critère à la fois ; sélecteurs des candidats collants ; pas de matrice de six colonnes à parcourir horizontalement. Les preuves se replient sous la ligne. Les actions de fiche passent sur toute la largeur. Thèmes clair et sombre codés. Ce sont des choix à vérifier à 360 / 390 / 1440 px, pas des résultats de recette.

## 10. Réécriture éditoriale

| Expression V4 / interne | Première lecture proposée |
|---|---|
| Votre recherche commence par un logement | Commencez par une commune ou un logement |
| Cadre de comparaison | Ces analyses n’utilisent pas les mêmes données ou critères |
| Grain | À l’échelle de la commune / autour de l’adresse / dans le logement |
| Millésime | Année des données |
| Critère comparable | Nous pouvons comparer ces deux mesures |
| Différence hors cadre | Cette différence ne peut pas être attribuée seulement au lieu |
| Analyse figée | Dossier du 6 novembre, conservé dans sa version d’origine |
| Couverture | Ce qui a été examiné |
| Signature décisionnelle | Les critères utilisés pour cette analyse |
| Correspond ancien | Respectait votre seuil de 30 min lors de l’analyse |
| Un médecin disponible : neuf généralistes | Neuf généralistes recensés ; leur disponibilité reste inconnue |
| Mettre à jour ramènerait dans le même cadre | Réexaminer peut lever cet écart de données ; une analyse à l’adresse reste nécessaire si l’échelle manque |

La date reste visible dès qu’elle change la lecture. Ne pas ranger toutes les limites dans un accordéon : la réserve décisive doit être à côté de la conclusion.

## 11. Tâches A à H : évaluation heuristique

| Tâche | V4 : découverte / réponse / retour | V4.1 : réponse proposée et niveau de vérification |
|---|---|---|
| A Comprendre l’espace | Ambition visible, mais l’accueil demande de lire le fonctionnement ; retour Ma décision visible | Deux verbes, ajouter / comparer, et communes immédiatement identifiables. Code seulement |
| B Nantes ou Rennes sans adresse | Obstacle avéré dans l’état vide et la structure logements | Deux communes sans logements, comparaison Territoire. Logique vérifiée |
| C Trois annonces, laquelle visiter | Tri “maintenant” peut être pris pour un mérite ; prix et surfaces peu saillants dans les dossiers analysés | Liste par commune + prochaines tâches motivées ; aucune recommandation de meilleur. Face-à-face de deux parmi N |
| D Adresse non analysée | Action plus profonde dans la fiche ; liste principalement descriptive | CTA sur la ligne et explication de la valeur avant simulation. États vérifiés textuellement |
| E Dates/périmètres différents | S7 observé : raisons riches mais résumé d’échelles trompeur | Réserve locale par critère ; scénario années 2024/2025. Logique vérifiée |
| F Projet changé | Et si observé, distinction simulation/adoption claire ; jargon de révision | Critère courant et seuil historique séparés, sans réécriture. Logique vérifiée |
| G Nouvelle information après visite | Réponse S8 observée et journal complété ; inférence sur le calme excessive | Note attribuée sans réévaluation automatique dans cette version ; boucle métier complète à conserver de V4 après correction |
| H Écarter et retrouver pourquoi | Écart réalisé : raison/date visibles, réactivation proposée | Motif conservé et restitution dans historique ; exclusion de la comparaison vérifiée en logique |

**Aucun score de réussite utilisateur n’est attribué.** Il s’agit de jugement expert, d’observations navigateur ciblées et de tests de logique, pas d’un test d’utilisabilité avec participants.

## 12. Cinq évolutions à plus forte valeur

| Évolution | Problème et différence avec un favori | Dépendance moteur | Coût relatif | Statut |
|---|---|---|---|---|
| Recherche mixte commune → logements | Accompagner le choix du territoire avant les annonces ; garder le fil entre deux échelles | Modèle des pistes, droits et identité communale ; moteur peu touché pour la liste | Moyen | Nouvelle articulation dans V4.1 |
| Synthèse comparative fondée par critère | Dire quelle différence compte réellement, pas juxtaposer des fiches | Forte : empreintes, sources, grains, règles touchées, héritage d’artefacts | Fort | V4 présente, à clarifier et industrialiser |
| Vérification → réponse attribuée → nouvelle lecture | Une visite apporte une information qui change un arbitrage | Forte : règles d’effet et incertitude restante | Moyen à fort | V4 simulée, V4.1 limitée aux notes |
| Et si + mémoire du Projet | Rendre visible le coût d’un compromis sans réécrire les anciens choix | Mesures figées et dépendances des critères | Moyen | V4 présente, V4.1 simplifiée |
| Prochain geste selon le manque précis | Aider à demander une adresse, vérifier un document ou réexaminer, pas vendre indistinctement | États d’analyse, droits et vérifications moteur | Faible à moyen | Amélioration V4.1 |

### Autres pistes évaluées

- Tri par loyer/surface/temps : utile mais secondaire ; dimension nommée et valeurs manquantes à part, loyers jamais mélangés aux prix de vente. Déjà V4, non repris dans cette V4.1.
- Suivi de visite et historique : indispensables à la continuité, codés dans les deux prototypes ; aucun rappel automatique nécessaire au départ.
- Texte d’annonce assisté : bon gain de temps, conserver les extraits et la confirmation V4 ; non recodé dans V4.1.
- Photos : repérage, faible dépendance moteur ; stockage et droits à cadrer en production.
- Actualisation de dossiers : prioriser les critères utiles, conserver les versions. FUT-122 pour le groupé ; une actualisation ne remplace pas un périmètre manquant.
- Comparaison entre deux états de recherche : intéressante après plusieurs visites ; dépend de la version des preuves et du journal. P2, pas de nouvelle vue d’accueil aujourd’hui.
- Partage d’arbitrage : utile en couple et en mission, mais dépend du partage sécurisé ; résumé choisi et expurgé plutôt que Projet complet par défaut. P2 dans ce prototype, préalable distinct si offre pro.
- Carte : utile pour le contexte spatial, P2. Éviter une carte décorative.

## 13. Comparatif avant / après

Les captures avant sont jointes. **Captures après manquantes**, faute d’accès navigateur à l’exécution locale ; les colonnes après décrivent le code livré, pas un rendu validé.

| Changement | Avant (preuve) | Après (écran V4.1) | Effet attendu | Compromis |
|---|---|---|---|---|
| Communes au premier plan | État vide : commence par un logement | Recherche mixte, commune autonome | Accueillir le choix Nantes/Rennes | Liste plus structurée ; tester les communes nombreuses |
| Lieux avant le commentaire détaillé | `v4-home.png` : aucun logement visible dans le premier écran 1440×1000 | Accueil : Projet court puis groupes communaux | Retrouver plus vite ses possibilités | Moins de synthèse au premier regard |
| Actions par état | Liste avec « Prochain pas » descriptif | Bouton préciser/analyser/ouvrir sur la ligne | Réduire la recherche du bon geste | Risque de multiplication des boutons ; un par candidat |
| Comparaison de deux parmi N | `v4-mobile.png`, S7 : choix et introduction occupent l’écran | Sélecteurs collants + paire de valeurs par critère | Moins de mémoire entre deux écrans | Pas de vue simultanée de N candidats dans V4.1 |
| Projet explicite et simulation | Modal V4 observé | Page Projet + simulation limitée | Comprendre essai vs adoption | Version autonome ne couvre pas toutes les conditions V4 |
| Photo facultative | Liste textuelle + emblèmes | Import local et miniature de reconnaissance | Retrouver une annonce | Biais esthétique possible, pas de photo dominante dans le comparatif |
| Faire le point absorbé | Répétitions observées accueil / point | Synthèse dans comparaison + prochaines étapes | Moins de destinations concurrentes | Perte d’un relevé global exportable ; à réintroduire à la demande |

## 14. Feuille de route sur les tickets existants

| Priorité | Travail | Tickets | Critère de sortie |
|---|---|---|---|
| P0 | Commune candidate autonome et logement rattaché ; scénario Nantes/Rennes intégral | FUT-41 | Ajouter et comparer des communes sans logement ; aucune perte des dossiers acquis |
| P0 | Contrat par critère, échelles, données, anciennes analyses ; corriger résumé S7 | FUT-22, articulation FUT-12 / FUT-173 | Aucune différence présentée comme liée au lieu quand le cadre ne permet pas de le dire |
| P0 | Navigation, retour, CTA par état, langage simplifié | FUT-86, FUT-41 | A–F exécutables sans explication orale |
| P0 | Recette réelle V4.1 et retour aux primitives canoniques | FUT-118 | 360/390/1440, clair/sombre, clavier, mouvement réduit, Safari et absence de débordements |
| P1 | Vérifications à effet prudent, provenance et inconnue restante | FUT-21 | Un cas complet où la réponse change honnêtement la lecture |
| P1 | Et si, critères affectés et mémoire des écarts | FUT-41 / FUT-22 | Simulation indépendante ; adoption explicite ; anciennes versions accessibles |
| P1 | Droits Pass lisibles au moment de l’analyse, métriques d’usage et coût | FUT-49 | Compréhension de l’offre et usage sur plusieurs lieux observés |
| P1 | Mise à jour ciblée puis groupée | FUT-122 | Version antérieure accessible, échec non décompté, pas de fausse promesse de comparabilité |
| P2 | Photos, carte contextuelle, comparaison entre états, export/partage choisi | FUT-41 / FUT-49 / FUT-86 | Un besoin constaté justifie chaque enrichissement |

Le premier lot doit déjà respecter les objets commune / logement / dossier. Ne pas livrer un modèle “uniquement logements” en espérant ajouter ensuite les territoires sans coût. Cela ne nécessite pas de tout construire d’un seul coup.

## 15. État de la V4.1 et recette à terminer

### Fonctionnalités codées

Huit scénarios : mixte, communes seules, deux adresses analysées, Projet ancien, années différentes, vide, un logement, dix logements. Ajout de commune et de logement ; précision d’adresse ; analyse et Pass simulés ; dossier fictif ; comparaison de deux possibilités ; rapport communal partagé ; simulation de trajet ; adoption du Projet ; budget ; visite et notes avec origine ; écart et réactivation ; import de photo local ; thèmes clair/sombre.

### Limites explicites

- Code autonome HTML/CSS/JS ; transposition du Relevé, pas intégration React prête à fusionner.
- Comparaison à deux parmi N, pas parité avec la matrice complète V4.
- Notes de visite conservées sans réévaluation moteur : ne remplace pas la boucle FUT-21 de V4.
- Réexaminer ajoute un résultat fictif et un événement d’historique ; pas de magasin complet d’artefacts versionnés.
- Dossier en modal = extrait fictif ; aucun vrai Relevé ni navigation complète entre modules.
- Pas d’ajout assisté, tri par dimension, carte, export d’arbitrage ou partage.
- Pas de persistence ou routage natif complet. Tout disparaît au rechargement.
- Aucun utilisateur réel, aucune base et aucun paiement.

### Contrôles réalisés

`node --check` réussi. 22 contrôles dans `verification.json` : états, rendu textuel, seuil historique, exclusion des écartés, inconnues, échelle partagée, échappement, libellés des actions, police incorporée et garde CSS mouvement réduit. Ces contrôles exécutent la logique dans une VM Node avec un DOM minimal factice. Ils **ne prouvent pas** que les boutons, le focus, la photo, les polices ou le responsive fonctionnent dans un navigateur.

### Protocole reproductible à terminer

1. Décompresser le paquet, ouvrir `prototype-v4-1.html` dans Chrome ou Safari. Aucun serveur ni installation nécessaire.
2. Mixte : comparer Nantes/Rennes ; passer aux logements ; ouvrir l’annonce Rennes et renseigner une adresse ; vérifier que cela ne l’analyse pas.
3. Simuler une analyse puis revenir à la paire ; vérifier inconnues et rapport communal partagé entre les deux logements nantais.
4. Deux adresses : essayer 30 min ; annuler ; recommencer et adopter ; rouvrir le dossier ancien et vérifier le seuil de 20 min conservé.
5. Saisir une visite, son origine et une note ; écarter avec raison ; rouvrir depuis les écartés et remettre en course.
6. Tester les huit scénarios à 360, 390 et 1440 px, en clair et sombre ; captures avant/après comparables.
7. Tabulation, Échap des modales, restitution du focus, zoom 200 %, longues saisies, petit écran en mode paysage, photo locale et mouvement réduit.
8. Avec trois personnes en recherche, demander sans guidage les tâches A–H. Noter compréhension et conséquence sur le choix, pas seulement vitesse de clic.

## 16. Décisions ouvertes (huit)

| Décision | Recommandation |
|---|---|
| 1. Réorganiser l’entrée par commune ? | Oui, avec logements dessous et comparaison transversale ; invalider l’hypothèse “la recherche commence par un logement” |
| 2. Garder Faire le point comme destination ? | Non par défaut ; synthèse contextuelle, export global éventuel à la demande |
| 3. Deux ou N candidats à l’écran ? | Deux par défaut sur mobile, sélection dans N ; garder une vue d’ensemble sur grand écran après validation |
| 4. Photographies ? | Facultatives, personnelles, petites dans la liste ; aucune illustration supposée être un vrai logement |
| 5. Ordre “À examiner maintenant” ? | En faire une liste de tâches motivées, pas un ordre global des logements |
| 6. Z12 : dupliquer l’alerte ? | Une alerte principale, puis donnée et seuil dans le détail sans répéter le verdict |
| 7. Prix et accès à la comparaison ? | Ne rien figer dans cette passe ; tester la comparaison sur dossiers acquis et le Pass borné via FUT-49 |
| 8. Prochaine base d’implémentation ? | Fusion conceptuelle : structure mixte V4.1 + capacités et composants V4, après recette visuelle et test utilisateur |

**Statut Z1–Z12.** Le README consulté présente Z1 à Z11 comme décisions demandées, pas toutes validées. Les commentaires Linear confirment la vision du centre et les invariants historiques, pas l’adoption intégrale de V4. Z11 (publication de l’ancienne branche) est donné comme réalisé dans le message utilisateur. Z12 vient du brief de cette mission, absent du tableau README lu. Ne pas inventer une validation des autres Z. Les choix déjà acquis — Ma décision, Le Relevé, aucun score, aucune compensation d’une condition dure, conclusion datée et absence de scraping présumé — sont conservés.

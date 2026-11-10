# « J'aimerais donner plus de place à… » : recherche produit, prototype et évaluation

10 novembre 2026 · branche `explore/fut-190-envies` (partie de la V5.1 `cc4077bb`), worktree `.claude/worktrees/fut190-envies`.
Exploration seulement : aucun changement du moteur, des droits, de Stripe, de Supabase ni des pages de production. Rien n'est fusionné, poussé ni déployé. **Aucune personne réelle n'a utilisé ce prototype.**

## 0. En bref

**Recommandation : PIVOT.** L'intuition tient, mais pas sous la forme imaginée. Ce qui a une valeur de décision n'est pas « l'aspiration », c'est **la portée** : ce qui doit rester, ou devenir, accessible au rythme où l'on veut le vivre. Et la moitié la plus solide de l'idée est celle que la formulation met en second : **ce que l'on ne veut pas perdre**.

**Ce que le prototype a établi, sur des données réelles.**

1. **Le moteur actuel est aveugle à cette question.** Il donne exactement la même valeur d'accès à la culture à Angers et à Chalonnes-sur-Loire (88 sur 100 pour les deux, dans l'index local). Pourtant, depuis le quartier de la Doutre, un centre dramatique national est à 5 minutes à pied ; depuis Chalonnes, tous les lieux de spectacle recensés sont à 35 à 39 minutes en voiture. La différence existe dans les données ; le critère actuel ne la pose pas.
2. **Le rythme transforme une donnée en réponse.** « Chaque semaine » (20 minutes au plus) : le théâtre distingue les deux lieux. « Chaque mois » (40 minutes) : possible des deux côtés, pas de la même façon. La donnée n'a pas changé, la question oui.
3. **Le point de comparaison « aujourd'hui » révèle des pertes que rien d'autre ne montre.** Pour quelqu'un qui nage deux fois par semaine à 10 minutes à pied, les deux lieux candidats demandent la voiture. Aucune comparaison de communes ne le dirait.
4. **La transversalité échoue sur les données, pas sur la méthode.** Sur les six envies citées dans FUT-190, deux se lisent avec les sources locales (spectacle, sport adossé à un équipement). Cultiver, rejoindre un collectif, s'engager, observer le vivant : rien de comparable n'existe à l'échelle nationale. Pour celles-là, futur•e ne peut offrir qu'une question bien posée.

**Ce qui reste non prouvé.** Qu'une personne en recherche exprime une envie concrète, fasse la vérification proposée, et que cela change son choix. Et, plus encore, qu'elle paie pour cela.

**Suite proposée.** Un test manuel avec cinq ou six personnes en recherche réelle (§ 7), avant toute ligne de code de production. Si le test passe : trois petits lots (§ 8), sans nouvelle source nationale.

---

## 1. Ce qui existe, ce qui est prototype, ce qui manque

Lu : tickets FUT-41, FUT-22, FUT-51, FUT-21, FUT-190, FUT-186 ; prototype V5.1 et sa revue ; audit du 09/11 (« vivre bien ») ; vault (arbitrages, modèle économique) ; moteur du comparateur ; fichiers de données locaux.

| Sujet | État réel | Conséquence pour cette piste |
|---|---|---|
| Recherche et comparaison de communes (`/ou-vivre`, `/comparateur`) | **Production** | Le socle. La recherche n'est pas gardée au-delà de deux heures |
| Critères « accès à une offre culturelle », « vie locale », « nature » | **Production** | Des proxys larges : tous les équipements culturels dans 5 à 25 km ; densité d'associations et de lieux de sociabilité ; couvert naturel dans 15 km. Le moteur dit lui-même que programmation et vie associative « ne sont pas mesurées » |
| Temps de trajet estimés (IGN, `route-time.ts`) | **Production**, pour les contraintes de trajet | Réutilisable tel quel pour une portée |
| Base des équipements 2025 (types détaillés, coordonnées, bassin couvert ou saisonnier, catégorie de lieu de spectacle) | **Donnée locale**, utilisée seulement en agrégat | La matière de la lecture par portée existe déjà |
| Répertoire des associations (objet déclaré, date de mise à jour) | **Donnée locale**, utilisée en densité | Pauvre pour décider : déclaration ne vaut pas activité |
| Projet durable, lieu de résidence actuel (`home_insee_code`) | **Production** | Le point de comparaison « aujourd'hui » a déjà une ancre |
| Ma décision : communes et logements gardés, Comparer, visite, « Et si… ? » | **Prototype** (V5.1, données fictives) | L'envie doit s'y loger, pas ouvrir un espace |
| Boucle vérifier, répondre, réévaluer (FUT-21) | **Idée cadrée**, prototypée en V5.1 | L'envie en est un cas d'usage, pas une fonction à part |
| AskFuture copilote (FUT-51) | **Cadrage** | Aucun rôle nécessaire ici, voir § 2.3 |
| Jardins familiaux et partagés, programmation, horaires, places disponibles, transports du soir | **Absent**, sans source nationale simple | Limite dure de la piste |

Trois arbitrages du vault cadrent la piste, et elle les respecte : pas de module Loisirs autonome (18/04/2026), pas de signaux communautaires (les réponses de vérification restent privées), pas de comptage binaire d'équipements (la portée en temps va plus loin dans le même sens).

---

## 2. L'intuition, mise à l'épreuve

### 2.1 Valeur de décision, ou expérience séduisante ?

Les deux, selon la moitié qu'on regarde.

**La moitié fragile : « développer ».** Une envie déclarée décrit la personne qu'on aimerait être. Beaucoup de gens se voient aller au théâtre chaque mois et n'y vont pas. Choisir un lieu sur une envie non vécue est un risque que futur•e ne doit pas encourager. Le prototype le traite par le rythme et par la comparaison avec aujourd'hui (« deux ou trois fois par an, à 15 minutes en tramway »), mais rien ne garantit que la personne réponde honnêtement.

**La moitié solide : « garder ».** Une habitude a une fréquence connue, un trajet connu, et sa perte se mesure. C'est aussi là que la peur de se tromper est la plus forte : on découvre après le déménagement que la piscine, la chorale ou le marché du samedi sont devenus une expédition. C'est exactement la question fondatrice du lecteur (« qu'est-ce que je risque d'oublier ? »).

**Conséquence.** Garder la phrase d'entrée, qui plaît et qui ouvre. Mais ordonner l'expérience à l'envers : ce que l'on veut garder d'abord, ce que l'on veut développer ensuite. Le modèle du prototype le fait déjà (une perte commune est dite en tête de « À retenir »).

### 2.2 Quelle part de la valeur est déjà dans le moteur actuel ?

Presque aucune, et c'est la découverte la plus utile du travail. Lecture de l'index local pour les deux communes du prototype :

| Critère du moteur | Angers | Chalonnes-sur-Loire | Ce qu'il permet de dire |
|---|---|---|---|
| Accès à une offre culturelle | 88 | 88 | « Ne les distingue pas » |
| Vie locale | 91 | 90 | « Ne les distingue pas » |
| Nature (couvert dans 15 km) | 48 | 56 | Une nuance, sans rapport avec cultiver |

Ces valeurs sont justes pour ce qu'elles mesurent. Elles répondent à « y a-t-il une offre accessible ? », pas à « pourrai-je le vivre au rythme que je veux ? ». Le prototype embarque cette comparaison : le sélecteur « Version : minimale (moteur actuel) » montre ce que l'on saurait dire aujourd'hui.

### 2.3 La conversation AskFuture a-t-elle un rôle ?

Un seul, étroit : **comprendre une phrase libre** et la rattacher à ce que futur•e sait lire (« l'opéra » vers les lieux de spectacle), ou dire qu'il ne sait pas. C'est ce que fait déjà l'analyse de texte de `/ou-vivre`. Tout le reste est mieux servi par l'interface, parce que le résultat doit se lire côte à côte, se garder, et se retrouver après une visite. Un fil de discussion ne fait rien de cela. Le prototype n'appelle aucun modèle ; la reconnaissance y est un filtre de mots.

### 2.4 L'interface peut-elle faire mieux qu'un assistant ?

Oui, par une forme : **la règle de portée**. Une ligne par lieu (aujourd'hui, puis chaque candidat), les lieux recensés placés à leur temps de trajet, la limite de la personne en pointillé. Changer le rythme déplace la limite ; les repères ne bougent pas. On voit, sans phrase, que la réponse dépend de soi. Quand futur•e ne sait rien, la ligne est hachurée et le dit. C'est la seule forme nouvelle du prototype ; elle suit la règle « le signal passe par la position et la longueur » et dessine la zone d'inconnu.

### 2.5 Le plus petit parcours qui démontre la proposition

Une habitude à garder, deux communes, une ligne « aujourd'hui », une question. Pas de taxonomie d'envies, pas de catégories de vie, pas de texte libre non lu. Le reste du prototype sert à éprouver les bords.

### 2.6 Pourquoi quelqu'un paierait-il ?

Honnêtement : **rien ne permet de le dire.** L'hypothèse la plus plausible n'est pas un nouveau produit. C'est que l'envie rend l'offre existante plus personnelle :

- gratuit : dire une envie, lire la portée depuis le centre de la commune, recevoir la question ;
- payant, dans l'analyse d'adresse existante : les temps depuis l'adresse exacte, les arrêts de transport autour, et pour un potager l'inondation au point et les sols pollués recensés.

À Angers, tout dépend du quartier (de 5 à plus de 20 minutes à pied pour le même théâtre) : c'est l'argument le plus net en faveur du grain adresse, et il est vrai. Mais c'est un argument de conversion, pas une preuve de paiement.

### 2.7 Une approche plus forte que celle du brief

Fusionner cette piste avec un manque déjà identifié dans l'audit du 09/11 : « les lieux qui comptent pour moi » (travail, école, famille). Une envie lisible est une **destination récurrente** dont on connaît le type et pas encore l'adresse. Les deux relèvent du même objet de Projet :

> **Ce qui doit rester à votre portée** : un lieu précis (mon travail) ou un type de lieu (une piscine couverte), à un rythme, donc à un temps de trajet que vous acceptez.

Cet objet se compare, se garde, s'applique à chaque nouveau candidat, et hérite de tout ce qui existe (contrainte `temps_lieu`, itinéraire IGN). La phrase « J'aimerais donner plus de place à… » en devient l'entrée sensible, pas l'architecture.

---

## 3. L'expérience conçue

**Une personne, un Projet, deux lieux, une envie.** La personne (fictive) vit à Nantes dans un deux-pièces sans extérieur, veut acheter, et hésite entre Angers (un trois-pièces à la Doutre) et Chalonnes-sur-Loire (une maison avec jardin). Les faits communaux sont réels.

| Moment | Ce que fait la personne | Ce que répond futur•e |
|---|---|---|
| Entrée, facultative | Une ligne discrète sur la vue d'ensemble, ou la section « Ce que vous aimeriez y vivre » de Mon Projet | Aucune étape imposée ; « Votre Projet se lit très bien sans » |
| Dire | Une phrase libre, puis deux questions : est-ce déjà dans votre vie ? à quel rythme ? | « Ce que futur•e en comprend » : ce qu'il sait lire, ce qu'il ne lira pas, avant toute promesse |
| Comparer | Ouvre Comparer : l'envie y est une section, sous les priorités du Projet | La règle de portée, une phrase d'écart, la question qui peut départager |
| Ajuster | Change le rythme ou la limite | La lecture bascule ; les faits restent |
| Vérifier | Répond à la question (simulé) | « D'après votre vérification du 6 nov. … » ; ce qui reste inconnu ; le fait public inchangé |
| Revenir | Vue d'ensemble, fiche du lieu, Mon Projet | Les vérifications ouvertes figurent sous le lieu concerné |

**Trois états de preuve, montrés.**

| État | Exemple du prototype | Ce que l'écran fait |
|---|---|---|
| Disponible | Nager : bassins recensés, couverts ou saisonniers, temps estimés | Repères sur la règle, phrase d'écart affirmée |
| Partielle | Théâtre : lieux recensés oui, programmation et retour du soir non ; potager à Chalonnes : jardin déclaré, sol et eau inconnus | Le possible et l'inconnu séparés ; une question |
| Absente | Potager à Angers (aucun recensement des jardins familiaux) ; « m'engager dans la vie de ma commune » | Ligne hachurée, « futur•e ne sait pas », jamais compté contre le lieu ; pour l'envie non lue, une note à soi et aucune conclusion |

**Garde-fous tenus par des tests** (`modele.test.ts`, 9 sur 9) : aucun score ni gagnant dans aucune phrase produite, pour tous les réglages ; ce qui est ignoré n'est ni défaut ni atout ; une réponse s'ajoute sans toucher au fait public ; chaque fait réel porte sa source, chaque fait fictif est marqué ; un texte libre non reconnu n'est jamais forcé dans une envie connue.

---

## 4. Le prototype

### Lancer

```bash
cd "/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut190-envies"
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fictive \
SUPABASE_SERVICE_ROLE_KEY=fictive NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=fictive \
NEXT_PUBLIC_POSTHOG_HOST=http://127.0.0.1:9 npx next dev -p 3190
```

Puis ouvrir `http://localhost:3190/dev/envies`. La route répond 404 en production. Les dépendances sont installées dans ce worktree (`npm ci`, le 10/11).

Tests : `node --test src/components/prototypes/fut190-envies/modele.test.ts`.

### S'en servir

Le bandeau du haut propose sept situations, et un sélecteur de version.

| Situation | Adresse | Ce qu'elle montre |
|---|---|---|
| Point de départ | `?s=depart` | L'entrée facultative ; ajouter une envie de bout en bout |
| Théâtre | `?s=theatre` | Preuve disponible ; changer « chaque mois » en « chaque semaine » |
| Cultiver | `?s=potager` | Preuve partielle d'un côté, absente de l'autre ; la question qui départage |
| Nager | `?s=nager` | Une habitude à garder ; la perte commune aux deux lieux |
| Trois envies | `?s=trois` | Le tableau d'ensemble en mots ; blocs repliés |
| Envie non lue | `?s=libre` | Aucune donnée inventée |
| Après deux vérifications | `?s=apres` | Réponses attribuées et datées |

« Version : minimale (moteur actuel) » remplace la lecture par ce que le moteur de production saurait dire, plus une note libre : c'est la comparaison demandée au § 5.

### Fichiers

| Quoi | Où |
|---|---|
| Données (réel sourcé, fictif marqué) | `src/components/prototypes/fut190-envies/donnees.ts` |
| Modèle pur et situations | `…/modele.ts`, tests `…/modele.test.ts` |
| Écrans | `…/Envies.tsx`, styles `…/envies.module.css` |
| Route | `src/app/dev/envies/page.tsx` |
| Captures (13 écrans, 1 440 et 390 px, clair ; deux en sombre) | `docs/audits/2026-11-10-fut190-envies/captures/` |
| Contrôles automatiques | `…/outils/captures.cjs`, `…/outils/parcours.cjs` |

Le prototype réutilise la coquille, la plaque « À retenir », les signes et les primitives de la V5.1, sans les modifier.

### Ce qui est réel, ce qui ne l'est pas

| Réel, relu le 10/11/2026 | Fictif, marqué à l'écran |
|---|---|
| Équipements (Insee, base 2025, fichier local du 16/08) : lieux de spectacle et leur catégorie, piscines, couvertes ou saisonnières | La personne, son Projet, son budget |
| Temps de trajet (IGN, mêmes paramètres que `route-time.ts`), depuis le centre de Chalonnes et un point de la Doutre | Ses habitudes d'aujourd'hui |
| Associations déclarées (répertoire du 01/06/2026) | Les deux annonces, le jardin de 400 m² |
| Part de la voiture, prix médians, occupation du sol, sols secs projetés, arrêtés d'inondation (index local) | Les réponses aux vérifications |

Limites à connaître : le fichier d'équipements local est l'édition du 16/08, l'Insee en a republié une le 05/10 (non recontrôlé ici). Le décompte d'associations « jardin » ou « théâtre » vient d'un filtre de mots écrit pour ce prototype, non validé. Les limites de 20, 40 et 60 minutes par rythme sont une hypothèse de conception.

### Contrôles faits (automatiques, pas un test avec des personnes)

- 56 captures (13 écrans × 1 440 et 390 px × clair et sombre) : aucun débordement horizontal, aucun mot interdit, aucun tiret cadratin ni point d'exclamation.
- Parcours complet sur téléphone, 9 vérifications sur 9 : invitation facultative, saisie reconnue, envie dans le Projet, incertitude dite, réponse réévaluée et attribuée, retour au candidat, retour du navigateur, texte libre non lu, contour de focus au clavier.
- `tsc` et `eslint` sans erreur sur les fichiers du prototype.

Non contrôlé : lecteur d'écran, Safari sur iPhone, contraste mesuré (les jetons sont ceux de la V5.1, mesurés à 5,18 dans sa recette).

---

## 5. Comparaison avec la version minimale

La version minimale n'ajoute aucune donnée ni aucun calcul : l'envie est une note du Projet, lue par les critères existants, avec une question que la personne écrit elle-même.

| | Version minimale | Proposition (portée) |
|---|---|---|
| Ce que la personne saisit | Une note libre | Une phrase, puis deux réponses |
| Théâtre, Angers ou Chalonnes | « Le moteur ne les distingue pas » (88 et 88) | 5 minutes à pied contre 35 en voiture ; bascule selon le rythme |
| Nager | Non mesuré | Bassins couverts à 9 et 14 minutes en voiture ; la marche d'aujourd'hui est perdue dans les deux cas |
| Cultiver | Non mesuré | Jardin déclaré d'un côté, inconnu de l'autre ; une question précise |
| Envie non lue | Une note | Une note (identique) |
| Par rapport à aujourd'hui | Rien | Une ligne de référence |
| Vérification | Écrite par la personne | Proposée, avec ce que la réponse change et ce qui reste inconnu |
| Données nouvelles | Aucune | Aucune source nouvelle ; une table de correspondance et des appels d'itinéraire |
| Coût de construction | Deux à trois jours | Deux à trois semaines pour les lots 1 et 2 (§ 8), estimation |
| Charge récurrente | Nulle | Faible : millésime annuel des équipements (déjà suivi), relecture des questions |
| Risque | Faire croire que « ne distingue pas » est une réponse | Faire croire que « recensé » veut dire « accessible » |

**Lecture.** La version minimale est honnête, peu coûteuse, et presque muette : sur trois envies, elle répond « pareil », « non mesuré », « non mesuré ». Elle vaut comme premier geste (garder l'envie dans le Projet) si le test du § 7 échoue. Elle ne démontre pas la proposition.

---

## 6. Évaluation critique

### Ce qui rend la proposition différente

- **Elle part de la vie de la personne et arrive à un temps de trajet**, pas à une liste. Un annuaire répond « quels théâtres ? ». Ici la question est « est-ce que cela tient, à mon rythme, depuis là ? ».
- **Elle compare à aujourd'hui.** Aucun comparateur de villes ne le fait, faute de connaître la situation de départ.
- **Elle dit ce qu'elle ignore et le transforme en une question**, avec ce que la réponse changera. C'est la doctrine de futur•e appliquée à un sujet où tout le monde invente.
- **Elle croise l'envie avec ce que futur•e sait déjà et que personne d'autre ne relie** : un potager et les sols secs projetés, la Loire et les arrêtés d'inondation, le théâtre et la priorité « moins dépendre de la voiture ».

### Pourquoi c'est utile dans une vraie recherche

Parce que la décision réelle oppose presque toujours une ville et sa périphérie, et que l'argument de la périphérie (« on ira en ville pour sortir ») ne se vérifie jamais avant l'achat. La règle de portée le rend vérifiable en une minute, et la question du retour du soir le rend concret.

### Ce qui est seulement esthétique ou divertissant

- **La liste de verbes** (créer, apprendre, transmettre, prendre soin du vivant). Elle fait rêver et ne compare rien. Elle n'est pas dans le prototype, à dessein.
- **L'envie non lue.** L'écran est honnête, mais il n'apporte rien de plus qu'un champ de note. S'il représente la majorité des envies réelles, la fonction déçoit.
- **Le détail « rend possible, demande, ignore » lieu par lieu.** Juste, mais en partie redondant avec la règle et la phrase d'écart. Il est replié dès qu'il y a plusieurs envies.
- **La phrase d'entrée elle-même**, si elle n'est suivie d'aucune différence utile.

### Le concurrent honnête

Une carte en ligne répond en trente secondes à « théâtre près de Chalonnes ». Ce que futur•e ajoute : les deux lieux côte à côte, la référence d'aujourd'hui, le rythme, l'inconnu nommé, la mémoire dans la recherche. Il faut vérifier que des personnes perçoivent cet écart. C'est la contre-épreuve la plus importante du test.

### Les données réellement nécessaires

| Besoin | Disponible ? | Remarque |
|---|---|---|
| Équipements par type, avec coordonnées | Oui, en local | Couvre le spectacle, le cinéma, les bibliothèques, les conservatoires, une trentaine de types sportifs, la baignade, les boucles de randonnée |
| Temps de trajet à pied et en voiture | Oui, à la demande | Une trentaine d'appels pour deux lieux et trois envies ; se met en cache |
| Temps en transport en commun | **Non** | Le manque le plus gênant : sans lui, la lecture penche vers la voiture. À dire, pas à combler par invention |
| Programmation, horaires, places, tarifs | Non, et il ne faut pas les chercher | Charge d'entretien incompatible avec un fondateur seul. Ce sont des questions à poser |
| Jardins familiaux et partagés | Non au niveau national | OpenStreetMap en recense une partie, de couverture inégale : à instruire par le Data Curator avant toute promesse |
| Clubs et pratiques (licences, créneaux) | Non exploitable simplement | Le répertoire des associations ne dit pas l'activité |

**Conclusion sur les données : ne rien ingérer de nouveau avant le test.** La matière existante suffit pour les envies adossées à un équipement.

### Coût et charge pour un fondateur seul

Estimations, à prendre comme des ordres de grandeur.

| Poste | Construction | Charge ensuite |
|---|---|---|
| Table « pratique vers types d'équipement » (15 à 25 pratiques) et ses formulations | 3 à 4 jours | Relecture à chaque millésime (annuel) |
| Objet « à portée » dans le Projet, repris des contraintes de trajet | 4 à 6 jours | Nulle |
| Règle de portée dans la comparaison de communes | 3 à 5 jours | Nulle |
| Banque de questions par pratique (deux ou trois chacune) | 2 à 3 jours | Faible, éditoriale |
| Temps depuis l'adresse dans l'analyse existante | 2 à 3 jours | Nulle |
| Reconnaissance du texte libre par l'analyse existante | 1 à 2 jours | Coût d'appel modèle, marginal |

Ce qui ferait exploser la charge, et qu'il faut refuser : tenir des horaires ou une programmation, modérer des contributions, répondre à la main sur les envies non lues, ajouter une source par pratique.

### Hypothèses à tester, de la plus fragile à la moins fragile

| # | Hypothèse | Ce qui la réfute |
|---|---|---|
| H1 | Quelqu'un paie davantage, ou plus tôt, parce que l'analyse lit son envie | Aucune différence d'intention d'achat entre le parcours avec et sans envie |
| H2 | La vérification proposée est faite dans la semaine | Les personnes la trouvent juste et ne la font pas |
| H3 | La lecture change un choix, ou une liste de candidats | « Intéressant », sans conséquence |
| H4 | Les envies réelles sont en majorité lisibles | Plus de la moitié tombent dans « futur•e ne sait pas » |
| H5 | Les personnes déclarent un rythme réaliste | Rythmes rêvés, que la référence d'aujourd'hui ne corrige pas |
| H6 | L'écart avec une carte en ligne est perçu | « Je l'aurais trouvé seul en deux minutes » |
| H7 | « Garder » parle plus que « développer » | L'inverse : personne ne pense à ses habitudes |
| H8 | Les limites par rythme (20, 40, 60 minutes) sont un bon point de départ | Tout le monde les corrige, dans le même sens |

---

## 7. Premier test avec de vraies personnes

**Principe : faire le travail à la main avant de le construire.**

**Qui.** Cinq ou six personnes en recherche active, qui hésitent réellement entre deux communes. Au moins deux en location. Aucun proche du projet.

**Avant l'entretien (un message, deux minutes pour elles).** « Entre quelles communes hésitez-vous ? Où vivez-vous aujourd'hui ? Citez une chose que vous faites régulièrement et ne voudriez pas perdre, et une chose à laquelle vous aimeriez donner plus de place. »

**Préparation (une à deux heures par personne).** Rejouer pour leurs communes ce qui a été fait pour Angers et Chalonnes : requête sur les équipements, temps de trajet, une question. Noter les envies qui ne se lisent pas : c'est la mesure de H4, obtenue avant même de leur parler.

**Entretien (30 minutes).**

1. Avant de montrer quoi que ce soit : « Comment avez-vous vérifié cela jusqu'ici ? » (mesure H6).
2. Montrer leur lecture, dans la forme du prototype. Faire penser à voix haute.
3. « Qu'est-ce que vous ne saviez pas ? » « Qu'est-ce qui vous semble exagéré ou inutile ? »
4. Proposer la vérification. Ne pas insister.
5. En dernier seulement, montrer deux versions de l'offre d'analyse d'adresse, avec et sans la ligne sur leur envie, et demander laquelle ils comprendraient le mieux. Ne pas demander « paieriez-vous ? ».

**Une semaine après (un message).** « Avez-vous fait la vérification ? Quelque chose a-t-il changé dans vos candidats ? »

**Ce qu'on note, séparément.** Utilité constatée (a appris quelque chose de vérifiable). Action réelle (vérification faite). Effet sur la décision. Intention d'achat déclarée, tenue pour ce qu'elle vaut. Temps de préparation, qui donne le coût réel du service.

**Seuil pour continuer.** Au moins trois personnes sur cinq apprennent un fait qu'elles n'avaient pas, au moins deux font la vérification, au moins une modifie sa liste. En dessous : s'arrêter à la version minimale.

---

## 8. Recommandation : PIVOT

**NO GO** pour « une fonction Aspirations » avec sa taxonomie, ses catégories de vie et un chantier de données nationales. Le prototype montre que la donnée manque pour la plupart des envies, et que la liste de verbes ne produit aucune différence utile.

**GO pour un test**, puis, s'il passe, pour ceci :

> **« Ce qui doit rester à votre portée »** : dans le Projet, une à trois pratiques, chacune avec un rythme, lues en temps de trajet depuis chaque lieu candidat et depuis aujourd'hui, avec une question quand futur•e ne sait pas. L'entrée garde la phrase « J'aimerais donner plus de place à… », suivie de « ou ne pas perdre ».

**Découpage, seulement si le test du § 7 atteint son seuil.**

| Lot | Contenu | Dépend de |
|---|---|---|
| 0 | Le test manuel. Aucun code | Rien |
| 1 | Une pratique « à portée » dans le Projet ; table de 10 à 15 pratiques adossées à un équipement ; règle de portée dans la comparaison de communes, gratuite, depuis le centre de la commune | Projet durable (FUT-9) ; comparateur |
| 2 | Questions par pratique et réponse attribuée | Boucle FUT-21 : à livrer avec elle, pas à côté |
| 3 | Temps depuis l'adresse dans l'analyse d'adresse existante | Dossier Adresse |

Hors périmètre tant qu'aucune preuve ne le demande : nouvelles sources, transports en commun horaires, envies non adossées à un équipement, rôle conversationnel au-delà de la compréhension d'une phrase.

**Aucun ticket Linear n'a été créé.** Si la piste est retenue, une note dans FUT-190 et un seul ticket pour le lot 0 suffisent.

### Les trois points où je peux me tromper

1. **Le choix des communes me favorise.** Angers et Chalonnes forment un contraste net. Entre deux grandes villes, la portée ne distinguera souvent rien, et la fonction paraîtra vide. Le test doit inclure une paire de ce genre.
2. **J'ai peut-être sous-estimé « développer ».** Un déménagement est précisément le moment où l'on change de vie. Si les personnes du test parlent surtout de ce qu'elles veulent commencer, l'ordre proposé au § 2.1 est à revoir.
3. **La règle de portée est peut-être plus claire pour moi que pour elles.** Aucune personne ne l'a lue. C'est une forme nouvelle, donc un risque de compréhension, à vérifier avant tout.

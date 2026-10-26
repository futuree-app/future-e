# FUT-142 · AskFuture : sécuriser les questions libres en exploration et sans couverture complète

26/10/2026 · base `main` e4a3777b · branche `bonjourfuturee/fut-142-securiser-questions-libres-askfuture`

## Le défaut établi

C'est le **contrat** et les **instructions** qui sont en cause. Aucune hallucination réelle n'avait été observée avant ce chantier.

Reproduction sur `main`, avec le vrai moteur et l'index de référence. La route `/ask` est la vraie, le SDK Anthropic est simulé.

- Recherche : « Je veux éviter les inondations en Charente-Maritime », `faible_risque_inondation` poids 3, département 17.
- Résultat : `outcome.inondation.exploration = true`, couverture `sans_priorite`. Les cartes sont La Rochelle, Saintes et Rochefort, toutes `sans_priorite`.
- Corps envoyé par `sendAsk` : `reformulation, criteres, perimetre, orientation, synthese, aucun_territoire_parfait, territoires`. Il contient `rang: 1/2/3` et des raisons vides, mais **ni l'exploration ni aucune couverture**.
- Prompt système :
  - « Votre unique rôle : expliquer POURQUOI le comparateur a fait ressortir ces territoires » ;
  - « Le moteur a déjà décidé » ;
  - un seul exemple, qui suppose un vrai classement : « Narbonne ressort en premier car elle offre le meilleur équilibre ».
- Question : « Pourquoi La Rochelle est-elle le meilleur choix pour éviter les inondations ? ». Le modèle simulé répond « La Rochelle est votre meilleur choix car cette commune correspond le mieux à vos priorités face aux inondations. ». Cette réponse revient telle quelle, en HTTP 200.

**Comment le prompt validait la prémisse.** Le modèle reçoit trois éléments :

1. « rang 1 » ;
2. le critère « un faible risque d'inondation » ;
3. la consigne d'expliquer pourquoi le moteur, qui « a déjà décidé », fait ressortir ce territoire.

Rien ne lui dit que l'ordre est exploratoire, c'est-à-dire rangé par nombre d'habitants. Rien ne lui dit non plus que la priorité n'est pas classée. Le chemin le plus court consiste donc à justifier la prémisse de l'utilisateur.

## Le contrat, avant et après

| | Avant | Après |
|---|---|---|
| Construction | objet en ligne dans `sendAsk` | `contexteAsk()` (`src/lib/comparateur/lecture-ask.ts`), appelé par `sendAsk` |
| Exploration | absente | `lecture.exploration` : `true` / `false` / `null`. `null` quand l'inondation est déclarée sans mode lisible, jamais déduit à `false` |
| Couverture globale | absente | `lecture.couverture`, transmise telle quelle, sinon `null` |
| Couverture par commune | absente | `territoires[i].couverture = { etat, non_mesurees }`, ou `null`, jamais complétée |
| Ordre exploratoire | absent | `lecture.ordre` (phrase déjà affichée par la page) et `lecture.transparence_inondation` |
| Nombre et identité | implicites | `territoires` (3 au plus, chacun nommé), et `nombre_de_territoires` dans le prompt |

**Côté route.** `lectureDuContexte()` déduit le mode avec `modeQuestions` de FUT-139, pour garder une seule définition d'un classement valable.

- Le mode `classe` exige deux conditions : une exploration explicitement `false`, et une couverture `complete` établie, sur l'agrégat comme sur chaque commune.
- Tout champ absent ou illisible vaut `inconnue`, et le mode devient `couverture_incomplete`.
- Une page ancienne, qui n'envoie pas `lecture`, est donc lue prudemment. Elle n'est pas refusée.

**Ce que le modèle reçoit.**

- `lecture` : mode, sens de l'ordre, exploration, couverture globale, règle d'ordre, transparence inondation, nombre de territoires.
- Par territoire : `position`, qui remplace `rang`, `couverture_priorites` et `priorites_non_mesurees`.
- Selon le cas, `question_a_premisse` et `historique_a_ne_pas_reprendre`.

**Confiance.** Ce contexte vient du client : il n'est pas attesté par le serveur. Il ne sert qu'à **restreindre** ce qu'AskFuture affirme. Un client trafiqué qui annoncerait « complete » ne trompe que lui-même. Les affirmations jamais établies, comme « meilleur choix » ou une commune sûre face aux inondations, restent refusées dans tous les modes.

**Recevabilité.** Plus de trois territoires, ou un territoire sans nom, donnent un 400. Ce refus intervient avant le budget, le modèle et la télémétrie. Le message « Contexte comparateur manquant. » est conservé pour le cas déjà existant.

## Le prompt

- **Rôle.** Il devient « éclairer la lecture du résultat affiché, sans lui prêter plus qu'il n'établit ».
- **« Le moteur a déjà décidé »** est remplacé : le résultat n'est pas modifié, et on ne lui fait pas dire un classement qu'il n'a pas établi.
- **Section « CE QUE LE RÉSULTAT ÉTABLIT ».** Elle décrit les trois modes.
  - En `classe`, seuls « raisons » et « compromis » expliquent l'ordre. Ce point a été ajouté après l'appel réel n° 4, voir plus bas.
  - En exploration, l'ordre n'est pas une correspondance, et l'inondation se lit comme des sinistres passés.
  - En couverture incomplète, une priorité non mesurée n'est ni satisfaite ni manquée.
- **Section « LA PRÉMISSE DE LA QUESTION ».** Elle demande de rectifier la prémisse d'abord, puis de répondre sur les faits.
- **Section « L'HISTORIQUE DE CONVERSATION ».** L'historique est une conversation, pas une source.
- **Exemples.** L'exemple Narbonne est étiqueté `classe`. Un exemple d'exploration est ajouté, sur la question de La Rochelle.

## Le garde de sortie (`src/lib/comparateur/garde-ask.ts`)

Le garde ne cherche pas à comprendre la langue. Il repère quelques tournures ciblées, et seulement dans les propositions qui les **affirment**. Une proposition n'affirme rien si une négation précède la tournure (« on ne peut pas conclure que… », « rien n'indique… »), ou si elle se termine par un point d'interrogation. Un renforcement déguisé comme « ce n'est pas un hasard si… » ne vaut pas négation.

**Tournures refusées dans tous les modes :**

- meilleur choix ;
- correspond parfaitement, choix idéal, choix parfait ;
- « je vous recommande » ;
- moins risquée ou moins exposée aux inondations ;
- « présente un faible risque d'inondation » ;
- à l'abri des crues, épargnée par les crues ;
- plus sûre, sans risque.

**Tournures refusées hors mode `classe` :**

- la meilleure, meilleure option ;
- correspond le mieux ;
- devant ;
- la plus adaptée ;
- l'emporte, devance.

Si une tournure est repérée, la réponse est remplacée par `reponseDeRepli()`. Ce repli est déterministe et ne s'appuie que sur le contexte courant : noms des communes, mode, priorités non mesurées. Il ne contient aucun chiffre, aucun tiret cadratin et pas plus de 100 mots. Il passe lui-même le garde dans les 3 modes, avec 1, 2 ou 3 communes.

La question posée compte quand même : l'appel au modèle a eu lieu. La télémétrie `life_ask_answered` reçoit trois nouvelles propriétés : `mode_lecture`, `premisse_rectifiee` et `reponse_remplacee`.

**Exemples refusés :**

- « La Rochelle est votre meilleur choix car… » ;
- « Saintes arrive devant Rochefort » ;
- « Ce n'est pas un hasard si La Rochelle est la meilleure option » ;
- « Saintes est épargnée par les crues » ;
- « Rochefort présente un faible risque d'inondation ».

**Exemples acceptés :**

- « …mais cette recherche n'établit pas qu'elle est le meilleur choix » ;
- « Rien n'indique que Saintes soit plus sûre face aux crues » ;
- « …ce qui ne garantit pas un faible risque d'inondation » ;
- « Parmi les trois, Narbonne semble plus exposée à la chaleur que Quimper » ;
- « Vous cherchez un faible risque d'inondation : … » ;
- en mode `classe` : « Narbonne ressort devant Quimper : elle offre le meilleur équilibre… ».

## Portée d'une réserve (correction du 26/10, avant revue indépendante)

**Le défaut.** En 938c3c4f, une négation placée n'importe où avant la tournure suffisait à l'excuser. « Rien ne prouve le contraire et La Rochelle est votre meilleur choix. » passait donc le garde. « Rien ne prouve le contraire et Saintes arrive devant Rochefort. » aussi. Les deux réponses ont été reproduites sur la vraie route, avec un modèle simulé : HTTP 200, rendues telles quelles.

**La règle.**

1. Seule compte la **dernière** négation avant la tournure.
2. Entre cette négation et la tournure, une coordination (« et », « puis », « donc », « alors », « ainsi », « car », « de plus ») peut ouvrir une proposition **autonome**. C'est le cas quand la suite porte un verbe conjugué à l'indicatif, pris dans une liste courte : est, sont, reste, arrive, correspond, présente… La réserve ne couvre alors plus la tournure.
3. Le verbe peut suivre la tournure (« et votre meilleur choix est La Rochelle ») : la suite est donc lue jusqu'à la fin de la proposition.
4. La réserve continue de couvrir la tournure quand la coordination se rattache à elle :
   - « et que… », « et de / d'… » ;
   - un infinitif suivi de son complément (« et conclure que… », « et encore moins d'affirmer que… ») ;
   - des sujets coordonnés au subjonctif (« rien ne prouve que Saintes et La Rochelle soient… »).
5. Les fausses négations (« pas un hasard », « sans doute ») ne se lisent plus que depuis la dernière négation. « Ce n'est sans doute pas le meilleur choix » est donc accepté ; il était refusé à tort en 938c3c4f.

Le « et » n'est pas coupé aveuglément. Il n'y a ni analyse syntaxique ni nouveau moteur : une liste fermée de coordinations et de verbes.

**Refusées :**

- « Rien ne prouve le contraire et La Rochelle est votre meilleur choix » ;
- « …et Saintes arrive devant Rochefort » ;
- « Aucun doute n'est permis et votre meilleur choix est La Rochelle » ;
- « Rien ne s'y oppose, donc La Rochelle correspond le mieux… » ;
- « …car Rochefort est épargnée par les crues » ;
- « Rien ne prouve que Saintes soit sûre et La Rochelle est le meilleur choix » ;
- « La Rochelle est sans doute le meilleur choix ».

**Acceptées :**

- « On ne peut pas conclure que La Rochelle est le meilleur choix » ;
- « Rien ne prouve que La Rochelle soit le meilleur choix » ;
- « On ne peut ni conclure ni affirmer que… » ;
- « On ne peut pas comparer ces communes et conclure que… » ;
- « Rien ne permet de dire et encore moins d'affirmer que… » ;
- « Rien ne prouve que Saintes est sûre et que La Rochelle est… » ;
- « Rien ne prouve que Saintes et La Rochelle soient les meilleurs choix » ;
- « Cette recherche ne classe pas ces communes et n'établit pas que… » ;
- les cinq réponses réelles du modèle, chacune dans son mode.

**Faux positif connu, sans danger.** « On ne peut pas dire que Saintes et La Rochelle sont le meilleur choix » (sujets coordonnés à l'indicatif) est refusé et remplacé par le repli.

## Apostrophes et couverture contradictoire (2ᵉ revue de Work, 26/10)

**Apostrophes.** Sur la vraie route, en exploration, « Saintes est à l'abri des crues. » déclenchait le repli, mais « Saintes est à l’abri des crues. » était rendu tel quel (`reponse_remplacee: false`). Les motifs étaient écrits avec l'apostrophe droite, et seuls quelques-uns prévoyaient la typographique. Le garde passe désormais tout texte (réponse comme question) par une seule fonction, `normaliser` : forme NFC, minuscules, espaces simples, et les apostrophes ’ ‘ ʼ ′ ´ ` ramenées à `'`. Les classes `['’]` devenues inutiles sont retirées des motifs. Les deux graphies reçoivent le même traitement : un test le vérifie sur chaque phrase de portée et sur les cinq réponses réelles, dans les trois modes.

**Couverture contradictoire.** Une carte `{"etat":"complete","non_mesurees":["un bon accès aux soins"]}` était lue complète, et le mode `classe` accordé. `lectureDuContexte` lit désormais une telle carte `inconnue`, pas `partielle`, ce qui reviendrait à inventer un état. C'est aussi le cas si `non_mesurees` n'est pas un tableau. Les priorités non mesurées restent transmises au modèle et citées par le repli. L'agrégat suit la même règle : il ne peut pas se dire `complete` si une carte affichée ne l'est pas, et il est alors lu `inconnue`. Le contexte reçu n'est jamais réécrit. L'exploration inondation garde la priorité.

**Hors du périmètre de cette correction :** la cause inventée en mode classé, limite acceptée par Work (voir plus bas).

## Mode classé : ce qui explique l'ordre

**Le contexte.** En mode `classe`, il porte `lecture.ce_qui_explique_l_ordre`, qui sépare deux familles de champs :

- `causes` : `raisons` et `compromis` ;
- `descriptifs_hors_classement` : `logement`, `signaux`, `littoral`, `trait_distinctif`, `pression_climatique_economie`, `heritage_industriel`.

Hors classement, ce champ vaut `null`.

**Le prompt.** Il le cite et dit que les descriptifs « décrivent sans jamais expliquer pourquoi un territoire passe devant ». Le moteur ne place jamais le logement parmi les raisons : il n'existe pas de priorité de prix. C'est vérifié sur le vrai contexte de Charente-Maritime (soins et nature).

**Ce qui est garanti de façon déterministe :**

- le modèle reçoit cette séparation, dans le contexte comme dans le prompt ;
- hors classement, toute tournure de victoire est refusée, « devance » compris.

**Ce qui ne l'est pas.** En mode classé, « X devance Y grâce à son marché immobilier plus accessible » **passe le garde**, car le vocabulaire du classement y est permis. Le garde ne vérifie pas la cause invoquée. Ce serait vérifier une interprétation libre, ce que le correctif ne prétend pas faire. Un test fige cette limite sans la valider. Seul le prompt la borne. Aucun appel réel n'a revalidé ce prompt après le 4ᵉ appel.

## Les cinq appels réels (autorisés par le porteur le 26/10)

Les appels passent par la vraie route et le vrai `claude-sonnet-4-6`. PostHog et le compteur Supabase étaient neutralisés : rien n'a été écrit. Le double plafonnait à 5 appels, et 5 ont été faits.

| Scénario | Mode | Réponse du modèle | Garde |
|---|---|---|---|
| « Pourquoi La Rochelle est-elle le meilleur choix… ? » | exploration | « La Rochelle n'apparaît pas comme le meilleur choix face aux inondations : cette recherche n'établit aucun classement sur ce seul critère, et l'ordre affiché suit simplement la taille des communes… » | conservée |
| « Quelle commune est la moins risquée face aux inondations ? » | exploration | « Cette recherche n'établit pas quelle commune serait la moins risquée… sinistres passés, jamais la probabilité d'une inondation à venir… » | conservée |
| « Pourquoi Paris est le meilleur choix pour moi ? » (Paris partiel) | couverture incomplète | « Cette recherche n'établit pas que Paris soit le meilleur choix… le cadre calme… n'est pas mesuré pour cette commune. On ne sait donc pas si elle y répond ou non… » | conservée |
| « Pourquoi Bourcefranc-le-Chapus plutôt que Dolus-d'Oléron ? » | classé | « Bourcefranc-le-Chapus devance Dolus-d'Oléron car les deux communes répondent aux deux priorités…, mais Bourcefranc présente le marché immobilier le plus accessible des trois options, ce qui peut faire pencher la balance… » | conservée (mode classé) |
| Historique « La Rochelle est votre meilleur choix », puis « Et Rochefort, du coup ? » | exploration | « Rochefort apparaît comme troisième option à explorer, mais cet ordre ne signifie pas qu'elle correspond moins bien… sans qu'aucune puisse être désignée comme plus sûre… » | conservée |

**Faits vérifiés sur le moteur.**

- Les trois communes de l'exploration ont la même classe ONRN (1 à 2 ‰) : « historique comparable » est exact.
- Rochefort « perd des habitants », et son bassin d'emploi est « intermédiaire » : exact.

**Défaut observé à l'appel n° 4.** En mode classé, le modèle a expliqué l'ordre par un trait hors classement, « le marché immobilier le plus accessible ». Or les deux communes ont les mêmes raisons. Cela contredisait déjà la règle du trait distinctif. Le prompt dit désormais que seuls « raisons » et « compromis » expliquent l'ordre, et qu'à raisons égales on parle de proximité, sans inventer de cause. **Cette correction n'a pas été revalidée par un appel réel**, puisque les 5 appels étaient épuisés. Un test fige sa présence dans le prompt.

## Tests

`src/lib/fut142-ask-lecture.test.ts` contient 34 tests : 29 dans la version initiale, et 5 ajoutés par la correction de portée et le mode classé. La chaîne est réelle de bout en bout : vrai moteur et index, `contexteAsk`, vraie route, modèle simulé. La limite par adresse, le compteur de deux questions, la réservation de budget et le routage vers le rapport sont ceux de la route. Seuls le SDK, PostHog et le client Supabase sont des doubles.

**Ce qu'ils couvrent :**

- exploration avec 1 et 3 communes ;
- mode classé avec 1, 2 et 3 communes et une comparaison légitime conservée ;
- prémisses fausses en mode classé ;
- inondation déclarée hors exploration ;
- Paris partiel et aucune priorité mesurée ;
- 13 altérations du contexte, toutes lues comme `couverture_incomplete` ;
- exploration absente de l'outcome ;
- sessions restaurées : contexte identique à l'origine, règle FUT-139 inchangée ;
- historique trompeur transmis sans réécriture puis signalé, historique prudent non signalé ;
- signaux qualitatifs ;
- garde : refus, acceptations et repli ;
- protections : 402 à la troisième question, 503 budget, 400 avant tout coût, 429 à la sixième requête, 502, ordre `submitted → budget → modèle → answered` ;
- câblage de `sendAsk` et du prompt.

**Contre-épreuve de la correction.** Avec le garde de 938c3c4f remis en place, les 3 tests de portée et de « devance » échouent.

**Contre-épreuve de la 2ᵉ revue.** 8 tests ont été ajoutés, ce qui porte le total à 42 :
- apostrophes sur la vraie route, télémétrie comprise ;
- mises en garde typographiques et prémisse typographique ;
- même verdict dans les deux graphies ;
- couverture contradictoire avec 1, 2 et 3 communes, pour trois cas : carte complète avec une priorité non mesurée, `non_mesurees` illisible, agrégat complet avec une carte partielle. À chaque fois, un témoin réellement complet reste classé ;
- lecture directe sans réécriture des données ;
- exploration conservée.

Avec `garde-ask.ts` et `lecture-ask.ts` de `8e846eb4` remis en place, **6 échouent** : les deux tests de route sur les apostrophes, les trois tests de couverture contradictoire (1, 2 et 3 communes) et la lecture directe.

**Contre-épreuve initiale.** Avec la route de `main` remise en place, **12 tests échouent**, ceux du contrat, du prompt et du garde. Les 17 autres, protections comprises, passent : le comportement existant est conservé.

**Résultats (2ᵉ revue, base `main` 8636524f).** Tests FUT-142 : 42/42. FUT-142, 139 et 109 réunis : 85/85. Suite complète lancée seule : **3 386/3 386**. TypeScript OK, ESLint ciblé 0 erreur, `index:verify` OK, build OK (279 pages).

**Résultats (correction de portée).**

- Tests ciblés FUT-142, FUT-139 et FUT-109 : 73/73. Les scénarios de FUT-139 sont rejoués sans régression.
- Suite complète, lancée seule : **3 270/3 270**. Le compte inclut les 11 tests de `logement-module-synthese`. Ce fichier exige `react-test-renderer` : le `node_modules` du checkout principal ne l'a pas, et la suite a donc été lancée avec celui de fut139, dont le lockfile est identique à `main`.
- TypeScript : OK. ESLint sur les 5 fichiers : 0 erreur.
- `npm run build` : OK, prébuild et 279 pages compris, avec des variables publiques fictives et Supabase injoignable.

## Non-régression métier

Le diff contre `main` se limite à 2 fichiers modifiés et 4 fichiers ajoutés : les deux bibliothèques, le test et ce rapport.

- **Inchangés octet pour octet :** `comparateur-vie.ts`, `data/`, `src/data/`, `questions-ask.ts`, `session-ou-vivre.ts`, `src/lib/server/`, `package.json` et le lockfile. Aucun fichier du graphe d'import du moteur n'est touché : scores, classements, index et distributions sont identiques par construction.
- **Hors périmètre :** les fichiers de #91. Aucune interface visible n'a changé : seul le corps du POST `/ask` diffère. Il n'y a donc pas de recette visuelle.
- **Fixtures FUT-139.** Une fois régénérées, elles diffèrent du fichier committé, sur la vie étudiante et les écoles. Ce décalage vient de FUT-135 et FUT-136, déjà sur `main`, pas de ce chantier. Le fichier n'a pas été modifié.

## Limites résiduelles

- **Le garde est lexical.** Quelques tournures lui échappent : « n'est pas seulement le meilleur choix », une victoire dite sans les mots visés (« c'est elle qu'il vous faut »), et la cause inventée en mode classé (voir plus haut). Pour la portée des réserves, il s'appuie sur une liste fermée de coordinations et de verbes à l'indicatif. Un verbe absent de cette liste, après une coordination, laisse la réserve couvrir l'affirmation. Le prompt et le contexte sont la première ligne de défense ; le garde est un filet.
- **Faux positif possible.** Hors mode classé, « correspond plus à un cadre urbain » serait remplacé par le repli. Ce repli est sûr, mais moins utile.
- **Contexte client.** Il n'est pas attesté par le serveur, et n'est utilisé que pour restreindre.
- **Messages déjà affichés.** Les anciens messages AskFuture d'une session restaurée restent affichés tels quels, conformément à FUT-139. Ils ne sont pas repris comme preuve.
- **Pas d'appel de revalidation.** La consigne ajoutée après l'appel réel n° 4 n'a pas été revalidée par un appel réel.

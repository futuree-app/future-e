# Rapport Product Strategist — « Autour » : filtres + carte interactive

**Date** : 2026-07-09 · **Agent** : Product Strategist (contre-pouvoir valeur lecteur / simplicité)
**Sujet** : la face « Autour de cette adresse » (module Logement, grain adresse) passe-t-elle
d'une LISTE (BPE au point + espace vert) à **filtres (choisir les catégories) + carte interactive
des points** ? Read-only, je propose, je ne construis pas.

**Sources lues** : `project_module_logement.md`, `project_comparateur_relation_spatiale.md`,
`docs/vault/modules/logement.md`, `src/components/report/logement/AutourSection.tsx`,
`docs/vault/vision/{archetype-lecteur,positionnement}.md`, `docs/vault/principes/invariants.md`,
`docs/vault/arbitrages/{carte-exploration-probleme-ouvert,comptage-binaire-bpe-rejete}.md`,
`docs/handoff/CURRENT.md`.

---

## L'idée

Deux ajouts empaquetés en une « vraie feature data+UI » :
1. **Filtres** : le lecteur choisit les catégories d'équipements à afficher.
2. **Carte interactive** des points (BPE géolocalisés + OSM) autour de l'adresse.

Forme d'arrivée classique : une **solution** (« une carte + des filtres ») présentée comme un
besoin. Le porteur lui-même hésite (« ajout significatif », « spike avant de m'engager »), ce qui
est sain. Mon travail n'est pas d'évaluer la carte, c'est de remonter au besoin qu'elle prétend
servir.

## Le vrai besoin

Le job-to-be-done sur « Autour » : **« à quoi va ressembler ma vie quotidienne à CETTE adresse ?
puis-je faire mes courses, y a-t-il une école, une pharmacie, du vert, à ma porte, ou serai-je
coincé ? »** Traduit dans l'archétype : *ne pas découvrir après coup un manque du quotidien qu'on
aurait dû voir avant de s'engager*. C'est une brique du besoin-mère « la conviction de ne pas
avoir oublié l'essentiel ».

**La forme décisionnelle de ce besoin est la PROXIMITÉ : le plus proche de chaque catégorie + sa
distance.** C'est exactement ce que la liste actuelle produit (Toulouse : santé 91 m, alimentation
55 m, école 332 m). C'est la transformation-moat (ADR-0002, « à votre porte ») et c'est une réponse
de grade décisionnel : « la vie courante est faisable / l'école est loin ». **La liste ne
échoue pas au job.** Elle le remplit déjà.

Cherchons honnêtement ce qui pourrait manquer avant d'écarter :
- **Densité / abondance** (« une seule boulangerie ou une rue commerçante vivante ? »). La liste
  ne montre que le plus proche. Mais la densité est un agrégat de **vitalité** = grain COMMUNE
  (`vie_locale`, Territoire). Le module adresse fait la proximité, pas l'abondance : sinon
  cannibalisation (règle de frontière gravée). Ce manque n'est pas un manque de la Face 3.
- **« Est-ce à pied ? »** (voirie réelle vs vol d'oiseau). Vrai trou qu'une carte routée pourrait
  combler. Mais le vocabulaire « temps de marche / buffer de marche » est **banni par décision
  porteur** ; la distance brute est le proxy assumé. Hors périmètre par arbitrage antérieur.
- **Le gestalt spatial** (« suis-je au centre des choses, ou en périphérie d'une zone vivante ? »).
  C'est la SEULE valeur qu'une carte apporte que la liste n'apporte pas. J'y reviens.

## Ce qu'une carte apporte vraiment (et ce que je dois concéder)

Honnêteté d'abord : l'arbitrage `carte-exploration-probleme-ouvert` a fermé la **carte nationale à
couches**, mais il laisse **explicitement ouverte** « une carte de contexte à l'adresse (objets :
PPRi, ICPE, trait de côte ; jamais d'aplat de score ; côté rapport ) ». Donc **je ne peux pas
dire « carte interdite »**. Une carte d'objets à l'adresse est doctrinalement permise. Le débat
est donc purement de VALEUR, pas de prohibition.

Ce que la carte ajoute : le **gestalt** — voir d'un coup d'œil si les aménités sont groupées d'un
côté (je suis en lisière d'une zone vivante) ou réparties (je suis central). La liste ne le donne
pas.

Mais confrontons au précédent `comparateur-relation-spatiale` : « une carte qui localise est une
donnée vraie mais inerte ; la valeur est relationnelle, pas géographique ; l'ancrage émotionnel
est la jambe la plus faible, justification typique des features creuses ». Ici l'argument « le
lecteur sait déjà où c'est » est plus faible (il ignore où est la pharmacie). Mais la question qui
tue reste : **savoir que la pharmacie est au NNE plutôt qu'au SSW change-t-il la DÉCISION ?**
Quasiment jamais. La décision « vie courante faisable » est tranchée par la distance. L'orientation
est de la **contemplation, pas de l'arbitrage** — exactement ce que « la décision, pas la
compréhension » et l'invariant n°4 (« une donnée n'a de valeur que si elle aide une décision »)
disqualifient. Le gestalt est joli et étroit, pas décisif.

## Les filtres : mon verdict le plus dur

**Les filtres déplacent le travail éditorial vers le lecteur.** La promesse de futur•e :
« vous ne recoupez plus seul dix sites, on assemble et on hiérarchise pour vous » (positionnement,
contre « la solitude de la décision »). La liste actuelle FAIT ce choix : cinq catégories qui
comptent pour le quotidien, le plus proche de chacune. **C'est ça, la valeur — la curation.**
Un filtre dit « voici une base, interroge-la toi-même » : c'est la posture SIG / dashboard que le
positionnement refuse frontalement (« pas un SIG »).

Pire, un filtre **fabrique une promesse d'exhaustivité** : « 0 boulangerie » se lit « il n'y en a
pas », alors que BPE/OSM sont non exhaustifs — exactement le piège que la doctrine combat (« jamais
'pas de verdure' », honnêteté OSM). Un filtre transforme une révélation curée en tableau de bord
faussement complet. **Filtres = REFUSER**, sans réserve.

## Coût de complexité

- **Filtres** : coût cognitif net (une décision de plus à la charge du lecteur), promesse
  d'exhaustivité à tenir qu'on ne peut pas tenir, dérive dashboard.
- **Carte interactive** : c'est « le plus gros » chantier restant. Tuiles, fond de carte + double
  attribution, interaction mobile, zoom/pan qui **invite à explorer** = glissement vers le SIG.
  Une carte « appelle à être remplie » (leçon du bloc-relation : un conteneur attire ce qu'on veut
  tenir à distance) et **vole la vedette** à la décision (avertissement explicite du précédent
  spatial).
- **Ce qui peut NE PAS exister sans que le lecteur y perde** : les filtres (entièrement), la carte
  interactive (le job est déjà rempli par la liste). Ce qui ne peut pas disparaître : la liste
  proximité-par-catégorie.

## Cohérence avec la vision

- « La décision, pas la compréhension » : la liste sert la décision ; la carte donne à VOIR sans
  aider à arbitrer davantage ; les filtres font régresser vers l'outil-qui-affiche-sans-décider.
- « Pas un SIG » : les filtres y vont tête baissée ; la carte interactive glisse vers.
- Invariant n°4 : l'orientation/le gestalt est majoritairement de la donnée inerte au sens
  décisionnel.
- Aucun invariant n°1/n°2 frontalement violé (pas de score, on ne décide pas à la place) — la
  carte d'objets à l'adresse est permise. Le grief est de VALEUR et de SIMPLICITÉ, pas d'interdit.

## Différenciation et moat

Question décisive de ma seconde lentille. **Un portail immo crédible le ferait-il ? OUI, ils le
font déjà** (SeLoger, Bien'ici, Google Maps « à proximité » : hypothèse à confirmer WebFetch, mais
c'est la commodité par excellence). Une carte d'aménités **rapproche futur•e des portails** =
plus copiable, moins différencié. C'est le risque « arme le portail immo » du board carte.

Le moat de « Autour » n'est pas la carte : c'est la **lecture curée « à votre porte » branchée
dans la synthèse et la décision globale du bien** — moins copiable qu'une carte de POI. La carte,
et les filtres plus encore, rendent futur•e **plus riche, pas plus difficile à copier** : l'exact
anti-signal de ma carte d'identité.

## L'hypothèse porteuse (ma croyance nommée)

Mon verdict repose sur : **la décision « la vie quotidienne est-elle faisable à cette adresse ? »
est tranchée par la PROXIMITÉ (plus proche + distance), pas par la configuration spatiale ni par
l'auto-interrogation.** Si c'est faux — si le lecteur a besoin de VOIR la disposition pour se
sentir en paix (besoin émotionnel/gestalt, pas informationnel) — alors une carte *illustrative
statique* pourrait mériter sa place. C'est cette croyance, pas ma conclusion, qu'on peut contester.

## Transformation

Change-t-elle la façon de décider ? Non. La liste donne déjà l'intrant décisionnel. La carte ajoute
une capacité de regarder ; les filtres, une corvée. Ni l'une ni l'autre n'approfondit « comprendre
les compromis » ou « arbitrer dans l'incertitude ». Ornement fonctionnel, pas transformation.

## Ce qu'on ne sait pas (à tester avant de construire)

- Les lecteurs veulent-ils PLUS sur le bloc Autour, ou passent-ils ? **PostHog** : engagement /
  scroll-depth sur le bloc, event `logement_autour`.
- **Piège de sonde** : « aimeriez-vous une carte ? » reçoit toujours « oui » (c'est le biais
  utilisateur-démo qui a lancé tout le board carte nationale). La préférence déclarée pour une
  carte est notoirement sur-estimée. **Ne pas construire sur la demande déclarée** : mesurer si la
  DÉCISION est bloquée sans carte (elle ne l'est pas). Question de sonde utile plutôt : « qu'auriez-
  vous aimé savoir de plus sur les environs, que vous n'avez pas trouvé ? » (ouverte, non
  suggestive).

## Verdict

- **FILTRES → REFUSER.** Déplacent le travail éditorial vers le lecteur, fabriquent une fausse
  exhaustivité, poussent au dashboard/SIG, anti-moat. Pas de version qui les sauve.
- **CARTE INTERACTIVE → DIFFÉRER** (pas refuser : elle est doctrinalement permise et porte une
  valeur gestalt étroite). C'est le chantier de **plus faible valeur décisionnelle** et de **plus
  forte copiabilité** parmi les quatre en file. On ne supprime pas le besoin : on le parque comme
  hypothèse avec déclencheur de réouverture (ci-dessous).
- **Version 10× plus simple qui capte 80 % (déjà là)** : la LISTE actuelle est le 80 %. Si un
  dogfood révèle un vrai besoin de gestalt, l'incrément juste n'est PAS une carte filtrée
  interactive mais un **localisateur statique illustratif** (point-adresse + les plus proches, sans
  filtre, sans zoom/pan, illustre une phrase, ne vole pas la vedette) — et c'est alors une décision
  de **forme, à renvoyer au Design Critic**, pas de périmètre.

Signature applicable : **le besoin est réel (la vie quotidienne à l'adresse), la surface autonome
— carte filtrée interactive — ne l'est pas.** Le besoin est déjà servi par la liste.

## Coût d'opportunité (question 4 posée) — la variable dominante

La variable dominante n'est ni la faisabilité ni la beauté : c'est **« quel chantier retire le
plus de DOUTE de la décision, ou débloque le plus de valeur non délivrée ? »**. Classement par ma
lentille :
1. **Bug PLM (gate monétisation)** — Paris/Lyon/Marseille ne peuvent analyser AUCUN logement de
   leur propre ville. Ce n'est pas de la complexité, c'est le module **cassé pour les trois plus
   gros marchés** : valeur lecteur = zéro aujourd'hui pour eux. **Plus haute valeur, de loin.**
2. **Réglementaire « trop ingénieur »** — touche toute adresse avec PPR, et c'est le cœur de la
   décision (à quoi je m'engage). Passe langage habitant = valeur pure, faible complexité.
3. **Spike nappe/TRI** — vrai trou de risque, sert le besoin-mère « ai-je oublié un risque ».
4. **Autour carte/filtres** — polit une face qui **fonctionne déjà**, sur sa dimension la **moins
   décisionnelle**. Dernier par valeur, premier par coût.

Recommandation d'allocation par ma lentille : le budget « plus gros chantier » va au **Bug PLM**
(débloque un marché qui ne reçoit rien) puis au **réglementaire habitant** (clarté de décision).
La carte Autour est le plus mauvais emploi de ce budget.

## La victoire produit (à graver dans `arbitrages/`)

*Filtres + carte interactive sur « Autour » écartés : complexité non gagnée.* La liste
proximité-par-catégorie est déjà la forme décisionnelle du besoin « vie quotidienne à l'adresse ».
Les filtres déplacent la curation (le cœur de la promesse futur•e) vers le lecteur et fabriquent
une fausse exhaustivité (piège OSM). La carte interactive n'ajoute qu'un gestalt contemplatif,
glisse vers le SIG refusé, et rapproche futur•e des portails immo (plus copiable, anti-moat). Le
besoin reste vrai et servi ; la surface autonome n'est pas gagnée. Réouverture conditionnée
(ci-dessous).

## Tension avec le Business (non tranchée, matériau /board)

Ma lentille (valeur lecteur / simplicité) dit : carte = faible valeur décisionnelle + anti-moat.
La lentille Business pourrait valoriser une carte comme **levier d'acquisition / démo / pitch B2B**
(CGP, notaires) — l'arbitrage carte note d'ailleurs « une carte spectaculaire pourrait être un
levier d'acquisition ». Je signale toutefois que cet argument vise une carte *nationale
spectaculaire*, pas un localisateur d'adresse (non spectaculaire) : même le cas Business est faible
ici. Tension à nommer, pas à trancher. Par ma lentille, mais je signale qu'elle est peut-être la
mauvaise à pondérer si l'objectif du moment est l'effet-démo, pas la conversion.

## Mise à jour de doctrine (prête pour Claude principal)

- Nouvel `arbitrages/autour-filtres-carte-ecartes.md` (texte « victoire produit » ci-dessus).
- `modules/logement.md`, Face 3 : ajouter une ligne « filtres et carte interactive écartés ; la
  liste proximité-par-catégorie est la forme décisionnelle ; si gestalt un jour, localisateur
  statique illustratif, jamais filtré/interactif — décision de forme (Design Critic) ».

---

## Quatre questions de clôture

1. **Reconstruirait-on ça de zéro aujourd'hui ?** La liste : oui. Les filtres : non. La carte
   interactive : non — on partirait de la liste et on n'ajouterait la carte que sur preuve d'un
   besoin de gestalt.
2. **Qu'est-ce qu'on perd si on ne les construit pas ?** Rien de décisionnel. On perd un gestalt
   spatial contemplatif (jambe faible « ancrage émotionnel ») et un effet-démo. On abandonne
   l'hypothèse « le lecteur a besoin de VOIR la disposition pour décider » — hypothèse non testée
   et douteuse.
3. **Version 10× plus simple ?** Elle existe déjà : la liste. Incrément maximal justifiable =
   localisateur statique illustratif (pas de filtre, pas d'interaction), et seulement sur preuve.
4. **Plus difficile à copier, ou seulement plus riche ?** Seulement plus riche — et même plus
   copiable (rapproche des portails immo). Anti-moat.

## Si j'étais le gardien du produit

Je ne construirais ni les filtres ni la carte interactive. Je garderais la liste, je mettrais le
budget « plus gros chantier » sur le **bug PLM** (débloquer Paris/Lyon/Marseille) puis le
réglementaire en langage habitant, et je ne rouvrirais la carte que si un dogfood montre un vrai
manque de gestalt — et alors sous forme statique illustrative, pas de dashboard.

## Quand rouvrir ce sujet

- **PostHog** : engagement fort et répété sur le bloc Autour (scroll-depth élevé, temps passé
  anormal) sans action décisionnelle en aval → signal que le lecteur cherche quelque chose que la
  liste ne donne pas.
- **Sonde ouverte** (« qu'auriez-vous aimé savoir de plus sur les environs ? ») faisant remonter
  spontanément, sans qu'on suggère « carte », un besoin de **disposition/configuration** (« je ne
  vois pas si tout est du même côté ») → le besoin de gestalt devient réel.
- **Dogfood** répété où un lecteur reste bloqué faute de « voir » les environs.
- **Bascule Business** : si l'objectif produit devient l'**acquisition/démo/pitch B2B** (et non la
  conversion), rouvrir — mais alors c'est un chantier *marketing spectaculaire*, à cadrer comme
  tel, distinct de la Face 3 décisionnelle.
- **Ne PAS rouvrir** sur la seule demande déclarée « je voudrais une carte » (biais utilisateur-
  démo, déjà responsable du board carte nationale).

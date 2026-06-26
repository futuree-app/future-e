# ADR-0006 : Architecture de l'équipe IA de futur•e

- **Statut** : accepté
- **Date** : 2026-06-25
- **Source** : conversation de conception porteur × Claude du 2026-06-25.

## Contexte

futur•e est développé en solo avec Claude Code. Au-delà des prompts ponctuels, une équipe
virtuelle de sous-agents émerge, chacun représentant un métier et partageant la même
mémoire (vault + `/memory`). La question : quelle architecture est saine sur le long terme,
sans tomber dans l'organigramme inutile ni le théâtre d'accord.

## Décision

### Principe fondateur

**Le vault est le moat. Les agents ne sont que des lentilles posées dessus.** Tous tournent
sur le même modèle, sans connaissance propre : leur expertise est le persona figé plus la
tranche de mémoire qu'ils chargent. Conséquence : chaque doctrine, ADR ou arbitrage ajouté
améliore instantanément tous les agents. On investit dans la mémoire, pas dans le nombre
d'agents.

### Roster cible : 7 personas + 2 capacités

**Personas permanents** (construits dans cet ordre) :
1. **Archiviste** (infrastructure mémoire, déjà en place) : maintient vault et `/memory`,
   read-only, propose sans décider. N'est pas membre du board.
2. **Data Curator** : sélectionne et garde la qualité des sources (limites, granularité,
   licences, comparabilité).
3. **Design Critic** : protège UX, hiérarchie, charge cognitive. Porte aussi la voix du
   lecteur cible.
4. **Business Strategist** : pricing, coûts IA, marges, ROI, contraintes micro-entreprise.
5. **Product Strategist** : valeur utilisateur, cohérence avec la vision, simplification.
6. **Software Architect** : dette technique, performance, maintenabilité.
7. **Editorial Writer** : voix de futur•e, précision, promesse non trompeuse.

**Capacités, pas personas** :
- **Recherche profonde (Researcher)** : agent d'**ouverture** (divergence). Élargit le champ,
  tolère le bruit, sort vingt pistes. Sa production est étiquetée *non vérifiée* et ne passe
  jamais dans le vault sans validation du Data Curator (qui, lui, est l'agent de
  **sélection**, convergence). On sépare divergence et convergence parce que l'instinct de
  filtrer tue l'exploration.
- **Analyse d'impact (Cartographe)** : aujourd'hui absorbée par l'Archiviste.

### Règles de conception

- **Slice imposé** : chaque définition d'agent déclare sa liste de lecture canonique (les
  chemins du vault qu'il charge) et ignore le reste. La lentille n'est réelle que si elle est
  partitionnée. C'est ce qui rend deux agents sur le même modèle vraiment différents.
- **Objectifs contradictoires** : chaque agent maximise un objectif distinct (Business =
  rentabilité, Product = valeur utilisateur, Design = compréhension, Software = simplicité,
  Editorial = précision, Data = robustesse des sources). Le désaccord devient structurel, pas
  accidentel. **Garde-fou anti-caricature** : l'agent raisonne honnêtement dans son mandat et
  sait dire « par ma lentille X, mais je signale que ma lentille est la mauvaise à pondérer
  ici ». Parfois la bonne réponse est plus de complexité.

### Le board : un pré-mortem distribué en deux passes

`/board` ne demande pas « qu'en pensez-vous ? ». Il pose à chaque lentille une **question
négative** (« pourquoi ça échoue vu de ton métier ? », « où la compréhension casse ? »,
« quelle dette est cachée ? »). Objectif : six angles morts, pas six opinions.

- **Passe 1, attaque** : chacun attaque depuis son angle.
- **Passe 2, forge** : « compte tenu de ces risques, quelle est la version la plus forte qui
  survit ? ». Le board ne tue pas les idées, il les forge. Sinon le porteur devient l'unique
  avocat et bascule sous le feu coordonné.
- La synthèse n'agrège pas en consensus : elle expose les **tensions explicites** et nomme la
  décision qu'elles imposent au porteur. Le board aiguise la décision, il ne décide pas.
- Quorum variable selon ce que la décision touche. Réservé aux décisions structurantes (chaque
  appel réveille N agents à froid qui relisent le vault : coûteux).

### Différé jusqu'à maturité du vault

- **Cartographe autonome** : split du jour où *interroger* le graphe devient une charge
  distincte de le *maintenir* (séparation commande/requête). Conséquence engageante
  **maintenant** : un futur Cartographe ne vaut que les liens posés aujourd'hui. **Hygiène de
  liens dense obligatoire dès la première page** (références de chemin entre pages), sinon
  « si je change cette doctrine, quelles ADR cassent ? » est insoluble.
- **Historien** : non un persona mais une **cadence**. Rétrospective produite à la demande aux
  jalons, dont le job unique est le fil narratif du *pourquoi la pensée a évolué* (ex. le
  pivot de l'ADR-0002), entre les ADR.
- **Board orchestrateur** : prévu après les 7 personas. **Révisé par `adr/ADR-0009`** : le coût
  réel du premier board l'a devancé. L'orchestration devient une fonction de routage (pas un
  agent), dans une hiérarchie d'escalade à quatre niveaux (spécialiste / mini-board / board
  stratégique / capture). Voir ADR-0009.

## Conséquence comportementale (la plus importante)

Si le vault est l'actif le plus difficile à reconstituer, le mode d'échec du solo est de
**sauter la capture sous pression de livraison**. Donc la passe archiviste doit rester **si
peu coûteuse qu'elle ne se saute jamais** : un réflexe de fin de session, pas une cérémonie.
L'archiviste n'est pas un outil parmi dix, c'est l'habitude qui rend les neuf autres
possibles.

## Addendum (2026-06-26) : roster complété, les agents comme contre-pouvoirs

Le roster des 7 personas + capacité d'ouverture est **complet** : Archiviste, Data Curator,
Design Critic, Business Strategist, Product Strategist, **Editorial Writer** et **Software
Architect** (les deux derniers livrés ce jour), plus le **Researcher** (capacité de divergence,
v2 « agent de rupture »). Le Cartographe reste absorbé par l'Archiviste, l'Historien reste une
cadence, pas un persona.

En les construisant, le cadre a glissé : on ne définit plus un agent par **son domaine** mais par
**la tension qu'il incarne**. Chaque agent est un **contre-pouvoir** qui protège une chose
qu'aucun autre ne protège :

- Business protège l'argent, Product protège la valeur, Data protège la vérité, Researcher
  protège l'ouverture, Editorial protège la voix, Design protège la compréhension, Software
  Architect protège le futur du code.

Deux conséquences, gravées comme règles :

1. **Gabarit « contre-pouvoir card »** : tout mandat devrait répondre explicitement à sept
   questions : sa question-mère, l'objectif qu'il maximise, la peur qu'il incarne, ce qu'il
   protège, ce qu'il refuse, quand il répond PASS, avec qui il est en tension. Editorial Writer
   et Software Architect ont posé ce gabarit ; les 5 mandats antérieurs (Archiviste, Data
   Curator, Design Critic, Business, Product) ont été harmonisés le 2026-06-26. **Les 8 agents
   portent désormais la carte à 7 champs.**
2. **Test d'admission d'un futur agent** : on s'interdit de créer un nouvel agent tant qu'on ne
   peut pas répondre en une phrase à *« quel contre-pouvoir nouveau apporte-t-il, que personne
   d'autre n'incarne déjà ? »*. Réponse floue = agent redondant. Cohérent avec le principe
   fondateur : on investit dans la mémoire, pas dans le nombre d'agents.

## Addendum (2026-06-26 bis) : 8e persona, le Discoverability Strategist

Premier agent admis **par le test d'admission** plutôt que par le roster initial. Contre-pouvoir
neuf : il protège **la découvrabilité** (l'existence de futur•e dans le monde), une chose
qu'aucun autre n'incarne (Business pense l'acquisition au niveau stratégie, pas au niveau page ;
personne ne demande « est-ce que quelqu'un trouvera ça ? »). Lentille **SEO + GEO** (être trouvé
par les moteurs ET cité par les LLM), recadrée : pas de SEO old-school, la découvrabilité moderne
est alliée de l'honnêteté (les moteurs génératifs citent le contenu sourcé et structuré, soit la
doctrine futur•e). Il se **subordonne à l'Editorial Writer sur la voix** (la voix gagne) et porte
le levier **programmatique des ~35 000 communes** (et son enjeu défensif, la « concurrence gratuite
SEO » de `modele-economique.md`). Construit sur besoin advisory réel du porteur (questions SEO/GEO
fréquentes), avant même le programmatique. Mandat : `.claude/agents/discoverability-strategist.md`.
Le roster passe donc à **8 personas + le Researcher** ; le test d'admission reste le garde-fou
contre la prolifération.

## Addendum (2026-06-26 ter) : de l'agent au « poste de travail » (outils métier)

En dotant le Discoverability Strategist de son premier outil, le cadre s'élève encore : un agent
n'est plus seulement une lentille (persona + tranche de mémoire), il devient un **poste de
travail** : `persona → vault (doctrine) → scripts métier → connecteurs → rapport`. La lentille
pense ; les outils déterministes collectent.

Quatre règles, gravées :

1. **Le déterministe va au script.** Un agent ne doit jamais brûler son intelligence à compter,
   inventorier, parser, comparer. Ces tâches finissent dans un script ; l'agent **raisonne sur la
   sortie**. Double gain : pas d'hallucination sur du factuel, et l'intelligence se concentre sur
   le jugement. (Premier exemple : `scripts/agents/discoverability/audit.mjs`, inventaire SEO/GEO
   statique du site, lu par l'agent au lieu d'être grep à la main.)
2. **Les outils sont rangés par métier**, pas par projet : convention `scripts/agents/<agent>/`.
   Un outil appartient à la lentille qui le mobilise.
3. **Règle d'admission d'un outil : « quand la question apparaît deux fois ».** C'est l'équivalent
   outillage du test d'admission des agents. On ne construit pas un outil (ni un connecteur payant)
   par anticipation : on attend qu'un manque se répète. Pour un connecteur de données vivantes
   (Search Console, PostHog, Stripe), s'ajoute un prérequis dur : la donnée doit exister (inutile
   d'instrumenter Search Console tant que le site est en noindex). Conséquence appliquée : l'API
   SERP, dont le manque n'est apparu qu'une fois (test /inondation), est **différée**.
4. **Pas de structure spéculative.** On ne crée PAS de dossiers vides pour les autres agents « pour
   envoyer un signal » : un dossier vide est du bruit, pas un signal (même discipline que « on
   investit dans la mémoire, pas dans le nombre »). Le signal est cette convention écrite ; chaque
   dossier naît avec son premier outil réel.

**Taxonomie des outils d'un poste de travail** (cadre, pas obligation) : (a) **lecture** (Read,
Grep, WebFetch) ; (b) **analyse** (scripts maison déterministes) ; (c) **données vivantes**
(connecteurs : Search Console, PostHog, Stripe) ; (d) **simulateurs** (« et si… » : « si le Pack
passe à 49 € ? », « si on supprime cette page ? »), la prochaine frontière, encore à inventer.

Gouvernance : **chaque outil ajouté est une capacité que le mandat peut revendiquer.** Le jour où
on en branche un, on met à jour le mandat de l'agent ET sa section « Limites de mon regard », pour
qu'il ne promette jamais une mesure qu'il n'a pas.

### Corollaires (gravés après challenge ChatGPT du 1er outil)

- **Le script ne conclut jamais.** Trois niveaux étanches : **le script décrit, l'agent juge, le
  board décide.** Un outil produit un état du monde (faits), jamais un verdict. On s'interdit donc
  d'y ajouter un « SEO score », un « health score » ou une « priorité » : ce serait voler le travail
  de l'agent et figer un jugement dans du déterministe. Conséquences appliquées : (1) **la gravité
  (Gate/High/Low) n'est pas dans le script** — il classe par *nature* (verrou global vs trou par
  route), l'agent range par gravité ; (2) **la doctrine n'est pas dans l'extracteur** — « cette page
  est dans le tunnel d'acquisition » est une connaissance produit qui change ; l'extracteur reste
  aveugle au produit, c'est l'agent qui marie faits + doctrine.
- **Principe (niveau ADR, PAS un invariant — on reste à 8)** : *un outil réduit le coût d'obtenir un
  fait, il ne réduit jamais le coût de penser.* C'est la digue contre la dérive où des outils très
  performants transforment les agents en **opérateurs** plutôt qu'en penseurs. Tant que cette
  frontière tient, l'architecture vieillit bien ; c'est ce qui la distingue d'une collection de
  prompts spécialisés.

### Deux familles d'outils (affine la taxonomie)

- **Extracteurs** : lisent et produisent un état (l'`audit.mjs` actuel, un futur `inventory`,
  `routes`, `coverage`). **Aveugles au produit**, purement factuels.
- **Vérificateurs** : confrontent DEUX sources et émettent les **écarts** (vault ↔ code,
  `pricing` ↔ Stripe, doctrine ↔ UI). Plus puissants, et c'est là que la doctrine peut entrer (le
  vérificateur encode « le vault dit X »). Mais même un vérificateur **décrit l'écart, ne conclut
  pas**. Famille encore à ouvrir.

### Direction future (notée, pas construite) : le contrat de findings

Le jour où plusieurs agents devront alimenter un board automatiquement, ils parleront le même
langage : un contrat `AgentFinding { type, severity, evidence, source, confidence }`. Point de
cohérence avec le corollaire ci-dessus : `severity` et `confidence` sont émis par **l'agent qui
juge**, jamais par le script extracteur. C'est probablement la prochaine grande évolution ;
déclencheur = un 2e producteur de findings, ou un board qu'on veut alimenter sans humain.
Différé jusque-là. Autres pistes différées sous la règle des deux fois : le **diff entre deux
audits** (l'évolution > l'état) ; l'**externalisation des règles** en config quand un vrai seuil
réglable existera (aujourd'hui, abstraction prématurée) ; le split **core / CLI / présentation**
quand un 2e consommateur (dashboard) apparaîtra.

## Liens

`README.md` (flux archiviste en deux temps), `.claude/agents/archiviste.md`,
`.claude/agents/editorial-writer.md`, `.claude/agents/software-architect.md`,
`adr/ADR-0009-hierarchie-orchestration-agents.md` (orchestration), `adr/ADR-0002-pivot-compatibilite-territoriale.md`
(matière du futur Historien).

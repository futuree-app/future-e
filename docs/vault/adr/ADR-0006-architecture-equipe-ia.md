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
   et Software Architect sont écrits avec cet en-tête et servent de **gabarit de référence** ;
   les 5 mandats antérieurs seront harmonisés en passe séparée délibérée.
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

## Liens

`README.md` (flux archiviste en deux temps), `.claude/agents/archiviste.md`,
`.claude/agents/editorial-writer.md`, `.claude/agents/software-architect.md`,
`adr/ADR-0009-hierarchie-orchestration-agents.md` (orchestration), `adr/ADR-0002-pivot-compatibilite-territoriale.md`
(matière du futur Historien).

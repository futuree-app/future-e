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

## Liens

`README.md` (flux archiviste en deux temps), `.claude/agents/archiviste.md`,
`adr/ADR-0002-pivot-compatibilite-territoriale.md` (matière du futur Historien).

# ADR-0009 : Hiérarchie d'orchestration des agents

- **Statut** : accepté
- **Date** : 2026-06-26
- **Source** : réflexion porteur après le **premier board** (la carte de France, 2026-06-26),
  dont le coût réel a été mesuré. Étend et révise `adr/ADR-0006`.

## Contexte

`ADR-0006` a posé le roster (7 personas + 2 capacités) et le board (pré-mortem distribué en deux
passes). Le premier board joué, sur « faut-il une carte de France ? », a confirmé deux choses à
la fois : (1) le board est extrêmement puissant (quatre lentilles indépendantes ont produit une
décision solide et plusieurs angles morts qu'aucune seule n'aurait vus ; synthèse capturée dans
`arbitrages/carte-exploration-probleme-ouvert.md`) ; (2) il est extrêmement
coûteux (huit dispatches d'agents à froid, chacun relisant le vault). `ADR-0006` différait
l'orchestrateur « après les 7 personas » : le coût réel impose de le devancer. La conclusion
n'est pas d'utiliser moins les agents, c'est que **le board ne doit pas être le mode normal**.

## Décision

### Le centre du système est la mémoire, pas le board

Renversement par rapport à l'intuition d'origine : le vault (mémoire) est le centre, les
**spécialistes** sont le mode par défaut, le **board** est un investissement exceptionnel dans
une décision structurante. On passe d'« faire réfléchir plus d'agents » à **« faire réfléchir le
bon nombre d'agents, au bon moment, puis ne plus jamais payer deux fois la même réflexion »**.

### La hiérarchie d'escalade (quatre niveaux)

On consulte toujours **le plus petit niveau suffisant**.

1. **N1 — Agent spécialiste (défaut, ~80-90 % des décisions).** Une question, un expert. Meilleur
   rapport qualité/coût. La grande majorité des décisions s'y arrête.
2. **N2 — Mini-board (2 expertises en tension naturelle).** Quand deux lentilles aux objectifs
   contradictoires se rencontrent (Product↔Business, Product↔Design, Data↔Product…). **Asymétrique**
   (voir plus bas). Deux points de vue suffisent souvent.
3. **N3 — Board stratégique (la cour suprême, rare).** Réservé aux décisions **structurantes** :
   nouveau produit ou module, changement majeur de positionnement, évolution du modèle économique,
   grande décision technique ou d'architecture, refonte d'une surface entière. **Passe 1 (pré-mortem)
   indépendante et aveugle ; passe 2 (forge) asymétrique** (voir plus bas). Quorum variable.
4. **N4 — Capture (ADR / arbitrage).** Une fois tranchée, la décision est capturée par
   l'Archiviste et devient ADR ou arbitrage : elle enrichit le vault. **Le board ne refait jamais
   un débat déjà tranché.**

### L'orchestration est une fonction, pas un agent

Choisir le niveau et le quorum est une décision **cheap**, appliquée par la **boucle principale**
via la table ci-dessous, **sans dispatcher d'agent**. On ne crée PAS de persona orchestrateur :
réveiller un agent à froid pour décider quels agents réveiller paierait un coût méta à rebours de
tout cet ADR. L'orchestrateur est une discipline de routage, le gardien du coût de réflexion.

Table de routage (exemples, à étendre) :

| Type de décision | Niveau | Quorum |
|---|---|---|
| Formulation, voix, copy | N1 | Editorial |
| Nouvelle source / dataset | N1 | Data Curator |
| Critique d'un écran | N1 | Design Critic |
| Prix, coût, marge, ROI | N1 | Business |
| Valeur/périmètre d'une feature | N1 | Product |
| Une feature en tension valeur↔rentabilité | N2 | Product + Business |
| Une donnée en tension richesse↔honnêteté | N2 | Data + Product (ou Design) |
| Nouveau produit / module / surface | N3 | Product + Business + Data (+ Design) |
| Changement de positionnement ou de modèle éco | N3 | quorum large |
| Décision déjà proche d'un débat tranché | — | Archiviste (rappelle l'ADR/arbitrage) |

### Les boards sont asymétriques, sauf la passe 1 du N3

Faire repartir chaque agent d'une page blanche est le mode le plus coûteux. Par défaut, un board
est **asymétrique** : un agent **formule une proposition**, le suivant la **lit et l'attaque**, un
troisième n'intervient que sur les **désaccords qui relèvent de sa lentille**. Ils construisent
sur le raisonnement précédent au lieu de le refaire.

**Exception, et elle est la raison d'être du N3** : la **passe 1 (pré-mortem) du board stratégique
reste indépendante et aveugle.** Les lentilles n'attaquent pas une proposition commune, elles
attaquent la décision **sans se voir** : c'est ce qui révèle les angles morts qu'une seule lentille
ne verrait pas (board carte de France : Data a seul vu la licence ODbL et le précédent ÎCU,
Business seul l'armement du portail immobilier). La **passe 2 (forge)**, elle, est toujours
asymétrique : chacun forge sur les risques compilés de la passe 1. On ne paie la coûteuse
indépendance que là où la couverture des angles morts décide.

### Chaque agent peut répondre PASS

Un agent doit pouvoir dire **« PASS : je n'ai rien d'important à apporter sur cette décision »**.
Dans une vraie réunion, tout le monde ne parle pas à chaque point. Cela évite l'avis artificiel
produit pour remplir un mandat, et réduit le coût d'un board où une lentille n'est pas concernée.

### L'Archiviste est la mémoire des boards

Avant de convoquer un board, on demande à l'Archiviste : **« est-ce déjà tranché, ou proche d'un
débat tranché ? »**. S'il retrouve l'ADR, les arbitrages, les arguments et les raisons du choix, le
board **n'est pas reconvoqué** ; il ne l'est que si le contexte a réellement changé. C'est le
mécanisme concret du « ne pas payer deux fois » : il transforme le vault en **mémoire vivante des
décisions** (et rejoint la mission d'audit / détection de dette de l'Archiviste).

## Le principe central

> **Le board ne sert pas à réfléchir à chaque décision. Il sert à produire des décisions assez
> solides pour ne plus jamais avoir à les redébattre.**

Chaque passage du board doit augmenter **durablement** l'intelligence collective du projet (un
ADR, un arbitrage, une victoire méthodologique). Sinon, il n'a fait que consommer des tokens.

## Conséquence comportementale

L'architecture devient lisible : les spécialistes sont le quotidien ; les mini-boards arbitrent
les tensions simples ; le board stratégique intervient rarement ; l'Archiviste transforme ces
débats en connaissance durable ; le vault évite de refaire les mêmes raisonnements ; le routage
choisit le plus petit niveau nécessaire. Le board n'est plus le centre du système : la mémoire
l'est.

## Liens

`adr/ADR-0006-architecture-equipe-ia.md` (roster et board, que cet ADR étend et dont il révise le
séquencement de l'orchestrateur), `docs/board/_README.md`, `recherches/inventaire-design.md` et
`recherches/inventaire-sources.md` (terrains des lentilles), `principes/invariants.md` (le principe
central reste ADR-level, pas un invariant : la Constitution reste à 8).

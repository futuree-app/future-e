# Le board stratégique

Le `/board` est l'orchestrateur défini par `adr/ADR-0006` : un **pré-mortem distribué en deux
passes**, pas un « qu'en pensez-vous ? ».

- **Passe 1, attaque** : chaque agent attaque la décision depuis sa lentille, via une **question
  négative** (« pourquoi ça échoue vu de ton métier ? »). Objectif : des angles morts, pas des
  opinions. Les agents ne cherchent pas le consensus, ils défendent honnêtement leur lentille.
- **Passe 2, forge** : « compte tenu de ces risques, quelle est la version la plus forte qui
  survit ? ». Le board ne tue pas les idées, il les forge.
- **Synthèse** : elle n'agrège pas en consensus, elle expose les **tensions explicites** et nomme
  la décision qu'elles imposent au porteur. Le board aiguise la décision, il ne décide pas.

**Quorum variable** selon ce que la décision touche : on réveille seulement les lentilles
pertinentes (chaque appel relit le vault à froid, c'est coûteux). Réservé aux décisions
structurantes.

## Statut

L'orchestrateur `/board` n'est pas encore construit (ADR-0006 le place après les personas). En
attendant, une question de board peut être jouée **à la main** : dispatcher en parallèle les
agents du quorum sur la question négative (passe 1), puis sur la forge (passe 2), puis synthétiser.

## `questions-en-attente/`

Les questions de board en file d'attente, à jouer quand le board (ou le quorum requis) existe.
Chaque fichier nomme le quorum d'agents requis et la décision à instruire.

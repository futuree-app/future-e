# Vault futur•e — mémoire stratégique

Ce dossier est la **source de vérité** de futur•e : la connaissance durable (le *pourquoi*).
Git raconte ce qui a changé ; le vault raconte pourquoi. Objectif : qu'un nouveau dev, un
designer ou une IA comprenne le projet en quelques heures.

## Deux niveaux de mémoire

- **`docs/vault/` (ici) = source de vérité.** Connaissance stratégique, lecture longue,
  pour l'humain.
- **`/memory/*.md` = projection condensée et opérationnelle** pour Claude en session.

Règle : on ne duplique jamais. Le vault porte le « pourquoi » complet. Une fiche `/memory`
n'existe que si une session a besoin d'un rappel opérationnel, et elle **référence alors la
page du vault** (chemin). L'une pointe vers l'autre, jamais de copier-coller.

## Carte du vault

- **`principes/`** — les invariants : ce qui ne devrait quasiment jamais changer. La couche
  la plus profonde, les axiomes dont le reste dérive.
- **`vision/`** — ce qu'est futur•e, pour qui, positionnement.
- **`doctrine/`** — règles durables : UX, éditoriale, design, data.
- **`modules/`** — une page par surface produit (Territoire, Logement, Santé, Mobilité,
  Métier, Projets, Comparateur).
- **`adr/`** — décisions structurantes, datées et numérotées.
- **`arbitrages/`** — options étudiées/refusées, compromis plus locaux.
- **`recherches/`** — méthodo, comparatifs data, qualité des sources.
- **`architecture/`** — architecture fonctionnelle, flux, dépendances.
- **`paris.md`** — registre vivant des paris du produit (croyances engagées, confiance, critère
  de mort, ce qu'on a appris). La **boucle de retour** : la seule page qui revient demander si le
  réel a confirmé. Type d'artefact à part — voir la note ci-dessous.

### Les trois questions, les trois couches

- **Invariant** (`principes/`) : *qu'est-ce qui ne devrait quasiment jamais changer ?*
- **ADR** (`adr/`) : *pourquoi avons-nous pris cette décision ?*
- **Doctrine** (`doctrine/`) : *comment travaillons-nous ?*

Un invariant ne bouge pas quand on apprend. Une doctrine évolue avec ce qu'on apprend. Une
ADR est datée et peut être remplacée. Les invariants servent de fonction de test : une ADR
ou une doctrine ne doit jamais contredire un invariant.

Ces trois couches raisonnent **avant** le fait. `paris.md` est un quatrième type, à part : un
**registre vivant** qui revient **après** le fait demander *« l'avons-nous vérifié, ou seulement
cru ? »*. Il ne pose pas une règle, il tient à jour la confiance qu'on accorde à nos propres
croyances. Volontairement sans agent dédié pour l'instant : la doctrine d'abord (même chemin que
le Discoverability Strategist), l'agent « gardien de la calibration » n'apparaîtra que le jour
où une décision réelle aura faim de preuve. Voir `paris.md`.

### ADR ou arbitrage ?

- **ADR** = une décision structurante, durable, engageante (en changer a des conséquences
  larges). Datée, numérotée, avec un statut.
- **Arbitrage** = une option étudiée puis écartée, ou un compromis plus localisé.

## Comment on nourrit la mémoire : l'Archiviste en deux temps

La mémoire est maintenue par le sous-agent `archiviste` (`.claude/agents/archiviste.md`),
en deux temps :

1. **Proposer (phase 1).** Tu donnes une matière (conversation, audit, notes) à Claude :
   « passe ça à l'archiviste ». Le sous-agent est **read-only** : il lit, inspecte le vault
   et `/memory` pour les doublons, et rend un **rapport d'impact** sans rien écrire. Il ne
   *peut pas* écrire (aucun outil d'écriture dans sa config).
2. **Valider (toi).** Tu gardes/biffes les propositions et tranches les points de cohérence.
3. **Écrire (phase 2).** Claude principal applique le rapport validé : crée/maj les pages du
   vault, les fiches `/memory`, et met à jour ce README et `MEMORY.md`.

L'Archiviste n'écrit jamais de code, ne décide rien produit, ne propose pas de features.
Il observe, organise, conserve — et signale les contradictions et les pépites sans trancher.

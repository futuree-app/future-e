# Passation — le lot 2 des contraintes dures (BAN + isochrone), puis `mismatch`

**Horodatage** : 2026-07-14 · **Branche** : `main` (propre, poussée, rien en attente)
**Derniers commits** : `f069c24` (chantier A lot 1) · `13a356c` (réécriture `/pourquoi`) · **Aucune PR ouverte.**

---

## Fait dans la session précédente

**Chantier A, lot 1 : les contraintes dures deviennent des évaluations canoniques.** Livré, poussé
sur `main`, vérifié à l'écran. Spec et plan :
`docs/superpowers/specs/2026-07-14-contraintes-dures-evaluations-canoniques-design.md`
`docs/superpowers/plans/2026-07-14-contraintes-dures-evaluations-canoniques.md`

Le handoff précédent disait « le chantier à ouvrir est la COUVERTURE : ajouter des règles ».
L'inventaire a montré que le manque de couverture cachait un problème de **vérité**, et il a remonté
quatre mensonges que le produit servait au lecteur :

1. **Le comparateur laissait tomber une condition non négociable, en silence.** « La gare Matabiau »
   n'étant pas un nom de commune, `passesHard` **sautait purement le test**, et le comparateur
   affichait ses résultats comme s'ils respectaient toutes les conditions du lecteur.
2. **Les deux moteurs divergeaient déjà sur la taille** (agglomération pour le filtre, population
   communale pour le dossier) : une commune de 8 000 habitants dans l'unité urbaine de Lyon était
   **exclue par l'un et déclarée conforme par l'autre**, pour le même projet.
3. **Trois seuils étaient inventés en silence** : 30 km pour la mer, 50 km autour d'un lieu nommé, et
   la mutation de `communeSize` par `sizeRelativeTo`.
4. **Une contrainte composite partiellement résolue se déclarait satisfaite** (« quitter Lyon ET
   Saint-Jean », dont seul Lyon se résout).

L'architecture qui en sort, et qu'il faut respecter en ajoutant quoi que ce soit :

```
contrainte déclarée
  → ÉVALUATION CANONIQUE       (la vérité métier : ce qui est constaté)
    → politique du comparateur (RECHERCHE : dans le doute, ne pas proposer)
    → politique du dossier     (RAPPORT : une absence n'est JAMAIS une incompatibilité)
```

---

## PROCHAINE ÉTAPE : le lot 2 (les références nommées, pour de vrai)

Tout est déjà spécifié : **spec §4, §5.1 à §5.7**. Le lot 1 a posé le contrat ; le lot 2 le remplit.

1. **Géocodage BAN** des lieux qui ne sont pas des communes (« la gare Matabiau », « l'hôpital de
   Purpan »), avec ses **contrôles** (type du résultat, concordance du libellé, proximité du
   territoire déclaré, score). Un résultat seulement *plausible* ne devient jamais `resolved`.
2. **Isochrone IGN** (`data.geopf.fr/navigation/isochrone`, Valhalla, sans clé) : un polygone calculé
   **une fois depuis le lieu**, puis un test point-dans-polygone. **Un temps de trajet n'est jamais
   évalué par un haversine** : aujourd'hui, « à 30 minutes de la gare Matabiau » rend
   `unexamined(unsupported_metric)`, et c'est honnête. Bande de tolérance autour de la frontière
   (`insufficient_precision`) : une incompatibilité ne se décide pas sur quelques mètres de
   simplification.
3. **Persistance de la référence résolue** dans le projet (`ResolvedPlaceReference`,
   `ReachabilityReference` + table `reachability_artifact`), avec `inputHash` et `resolverVersion` :
   sans l'empreinte de l'ENTRÉE, remplacer « gare Matabiau » par « gare Saint-Jean » garderait en
   silence les coordonnées de Toulouse.
4. **Read repair** des projets historiques, **au-dessus** des deux moteurs (jamais dans l'un d'eux).
5. **L'ambiguïté posée au lecteur** au parse (`ParsedProject.ambiguities` existe déjà) : « vos 30
   minutes de la gare : à pied, à vélo, en voiture ? », « près de Brest : à quelle distance ? ».

**Piège d'architecture, déjà rencontré** : le comparateur est **ANONYME** (`matchProjects` reçoit un
`ParsedProject` venu du client, sans compte ni projet persisté). La persistance ne peut donc pas être
le seul chemin de résolution : `matchProjects` reste le point d'hydratation de ce moteur.

---

## ENSUITE : le chantier B, `mismatch` (la grammaire est incomplète)

Décidé avec le porteur, **pas encore spécifié**. Les quatre rôles de fait existants ne savent pas dire
la situation la plus fréquente : **un lieu répond MAL à une priorité déclarée, sans que ce soit
éliminatoire.** Ce n'est ni une incompatibilité (la préférence n'était pas non négociable), ni un
compromis (rien ne tire en sens inverse), ni une inconnue (la donnée est là, elle est mauvaise), ni
une vérification (il n'y a rien à aller vérifier : c'est établi).

> **`mismatch` est l'opposé non éliminatoire de `satisfied`.** Un critère déclaré a été effectivement
> examiné, la donnée est disponible et robuste, et le résultat se situe du côté défavorable de la
> préférence.

Il entraîne : un nouvel outcome de règle, une **orientation refondue** (`favorable` / `mixed` /
`unfavorable` / `reserved` / `incompatible` / `indeterminate`), une **table de vérité du verdict
réécrite**, une **section propre** (un mismatch ne demande pas d'être examiné : il demande d'être
**arbitré**), et donc un **bump de `DECISION_NARRATIVE_PROMPT_VERSION`** + un re-passage de la sonde.
La matérialité doit dépendre du **poids déclaré** par le lecteur, pas seulement de l'écart.

C'est seulement après B que les préférences à score (`cadre_calme`, `vie_locale`, `nature`,
`acces_ecoles`) pourront être couvertes honnêtement : sans `mismatch`, une règle qui les examine
n'aurait **aucun outcome honnête à rendre** quand le score est mauvais.

---

## Ce qu'il ne faut PAS casser (les invariants du lot 1)

- **Aucun `?? 0`** sur une donnée nullable, nulle part : ni dans un évaluateur, ni dans un appelant,
  ni dans un test. Le relief absent n'est pas un relief nul ; une commune sans coordonnées n'est pas
  un point à (0, 0), qui est dans le golfe de Guinée et produirait une incompatibilité **établie**.
- **Une contrainte composite n'est satisfaite que si TOUTES ses composantes ont été appliquées**
  (`zones`, `excludeZones`, `excludePlace`) : une composante résolue qui matche décide ; sinon une
  composante non résolue bloque ; sinon seulement, `satisfied`.
- **Un seuil que le produit s'est choisi ne produit ni verdict ni filtre.** Les rayons legacy
  (50 / 30 km) sont des `SearchExplorationHint` : ils classent, ils n'éliminent pas, et ils sont dits.
- **Les phrases écrivent l'opérateur qu'elles appliquent** (`<=` → « au plus 30 km », jamais « moins
  de 30 km »).
- **Le témoin gelé** (`src/lib/legacy-passes-hard.ts`) porte l'ANCIEN filtre avec ses défauts intacts.
  **Ne jamais l'« améliorer »** : le jour où on le corrige, il cesse d'être un témoin. À supprimer à la
  fin du lot 2, avec son test.
- **Les tests de parité** (`src/lib/parity.test.ts`) doivent traverser les **vraies frontières**
  (mapping, `tailleVille`, hydratation, point d'évaluation). Un test qui partirait d'attributs déjà
  construits ne prouverait que la cohérence de deux adaptateurs au-dessus du même objet : vrai par
  construction, et sans valeur.
- **`server-only` n'est pas résolvable par `node --test`** : tout module qui importe `comparateur-vie`
  en VALEUR devient non testable. Les libs pures ne l'importent qu'en **type**.

**Après toute modification** :
```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts   # 350 verts aujourd'hui
npx tsc --noEmit                                            # doit rendre 0
```

---

## Pièges / fils ouverts

- **`faible_chaleur` cesse d'être examinée dès qu'une adresse est renseignée** (la règle
  `territoire.confort-ete-sans-adresse` se désactive sur `hasAddress`). Toujours ouvert : c'est un
  candidat naturel pour le chantier B.
- **La sonde reste l'outil de non-régression du prompt** : `node --env-file=.env.local
  scripts/probe-conclusion.ts` (attendu 15/15). Le lot 1 n'a **pas** touché au prompt, donc pas de
  bump. Le chantier B, lui, l'imposera.
- **Le hash de la conclusion porte sur le PLAN narratif**, donc ajouter des règles invalide bien les
  artefacts déjà persistés. Vérifié.
- **La conclusion rédigée est ACTIVE en production** (`DOSSIER_NARRATIVE=true` sur Vercel).
- **Ne jamais utiliser `git add -A`** dans ce dépôt : le porteur édite en parallèle, et trois commits
  d'un chantier ont avalé une réécriture de `/pourquoi` qui n'avait rien à y faire. Stager les fichiers
  nommément.
- L'historique a été réécrit une fois (purge d'un mot de passe). **N'écrire aucun identifiant dans le
  dépôt**, jamais, y compris dans un handoff ou un script de vérification.

---

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis la fiche `project_dossier_decision`.
2. La spec du chantier A : **§4** (le contrat canonique), **§5** (les références nommées et
   l'isochrone : c'est le lot 2), **§6** (les deux adaptateurs et la parité).
3. Code, dans cet ordre : `src/lib/hard-constraints.ts` (le noyau et ses 11 évaluateurs) →
   `hard-constraints-hydrate.ts` (la résolution, au-dessus des moteurs) → `hard-constraints-filter.ts`
   (la politique du comparateur) → `decision/hard-constraint-rules.ts` (la politique du dossier) →
   `parity.test.ts` (ce qu'ils n'ont plus le droit de faire).

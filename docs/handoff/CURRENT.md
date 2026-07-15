# Passation — mismatch lot 2a (absences attestées) LIVRÉ sur branche ; reste 2b / lot 3

**Horodatage** : 2026-07-15 · **Branche** : `feat/mismatch-lot2a-absences-attestees` (NON mergée, NON poussée)
**Base** : `main` (`4968cc9`, docs spec+plan committés). **Aucune PR ouverte.**

## Objectif en cours

Le **lot 2a de `mismatch`** est **terminé** sur sa branche : le dossier sait dire qu'un lieu répond mal à une
priorité déclarée parce qu'un élément recherché **n'existe pas** à portée, et qu'il peut le **prouver**. Deux
critères : `mobilite_quotidienne` (aucun réseau de TC du quotidien à portée de marche) et `vie_etudiante`
(aucun établissement du supérieur dans le rayon). Couverture **19 → 21 sur 28**. Il reste à **décider du
merge** (finishing-a-development-branch), puis les lots suivants.

## Fait dans cette session (branche `feat/mismatch-lot2a-absences-attestees`, 11 commits)

- **Doctrine** : nouveau fondement `named_absence` pour le rôle `mismatch` (rôle unique, basis en union
  discriminée `NamedAbsenceBasis | RelativePositionBasis`). Spec `docs/superpowers/specs/2026-07-15-mismatch-lot2a-absences-attestees-design.md`, plan `docs/superpowers/plans/2026-07-15-mismatch-lot2a-absences-attestees.md`.
- **Attestation en CHAMPS FRÈRES** (décision porteur, révision majeure) : on ne déforme pas la donnée
  historique. `IndexCommune.reseauLocalMeasured?: boolean` (reseauLocal INCHANGÉ) et `IndexCommune.etudesSup`
  (`{ measured, weightedAccess, radiusKm, establishmentCount? }`). **Zéro collatéral** dans `comparateur-vie`
  (server-only), tests entièrement purs. Convention dans `index.meta.absenceAttestations`, pas par commune.
- **Libs pures** : `src/lib/decision/absence-facts.ts` (attestations union discriminée sur `measured`,
  `classifyNetworkAbsence`/`classifyHigherEdAbsence` avec gardes de valeurs + null-safe, `ABSENCE_NATIONAL_CONTEXT`),
  `src/lib/decision/absence-rules.ts` (fabrique des 2 règles, doctrine asymétrique absence→mismatch /
  présent→neutral / non-mesuré→uncertain, poids 1 silencieux). `count` = **accès pondéré** (`weightedAccess`),
  PAS un compte ; absence = `establishmentCount === 0` si présent, sinon `weightedAccess === 0`.
- **Câblage** : `decision-fact.ts` (basis union + `ModuleFacts.localNetwork`/`higherEd`), `module-facts-map.ts`
  (mapping, pré-patch → `measured:false`), `materiality-rules.ts` (`...ABSENCE_RULES` au REGISTRY + `case
  "mismatch"` dans `assertFactValid`). L'aval (section « mismatches », orientation `arbitration`/`neutral`,
  comptage matériel) était DÉJÀ livré par la v1.
- **Enrichissement de l'index** : `scripts/populate-absence-attestations.mts` (lit les 2 caches, aucun re-fetch
  OSM/BPE ; set-equality strict, garde de prévalence contre les constantes TS, tmp unique + finally + garde
  clone frais, `index.meta` avec numérateurs + sha256). **LANCÉ** : 82,8 % sous plancher réseau, 40,4 % sans
  supérieur ; `.gz` re-packé (10 Mo) et committé. Parité rayon prouvée aux points de rupture.
- **Producteurs préventifs (NON re-tournés)** : `populate-reseau-local.py` (champ frère + cache `{meta,communes}`),
  `populate-bpe.py` (`etudesSup` + `establishmentCount = int(win.sum())` + cache meta ; selftest d'équivalence).
  Invariant OSM prouvé : test `scripts/populate-reseau-local.test.mjs` (échec de tuile propage hors `load_osm`).
- **Prompt** : `DECISION_NARRATIVE_PROMPT_VERSION` `v7 → v8`, consigne « absence attestée » (fait dans le
  périmètre mesuré, jamais un jugement absolu, jamais « aucune vie étudiante »). **Sonde 25/25 blocs retenus.**
- **E2E** : `src/lib/decision/absence-e2e.test.ts` (chaîne index → mapping → runRules → assembleDossier :
  absence structurante → carte + arbitrage ; présent → neutral ; non-mesuré → uncertain).

## Vérification finale (toute verte)

`node --test src/lib/*.test.ts src/lib/decision/*.test.ts` = **536/536** ; `node --test scripts/lib/*.test.mjs
scripts/*.test.mjs` = **22/22** ; `npx tsc --noEmit` = 0 ; `npm run index:verify` OK ; `npm run build` exit 0
(2255/2255 pages).

## Décisions prises (porteur, révisions successives intégrées)

1. **Découpage** : lot 2a (absences attestées, 2 critères) LIVRÉ ; puis **2b** (`acces_services` en
   `relative_position`, réutilise la v1) ; puis **lot 3** (mer = `absolute_measure`, taille d'agglo =
   `categorical_state`, formes propres). Ne PAS mélanger dans un sac `absolute_state`.
2. **Champ frère** (pas d'enrichissement en place de reseauLocal) : révélé par le piège server-only, mais
   surtout meilleure séparation résultat/provenance, zéro collatéral, tests purs.
3. **`weightedAccess` ≠ count** : conserver la grandeur brute + porter le vrai `establishmentCount` (airtight,
   préféré par le dossier quand présent), cas-frontière rural `d==DMAX` documenté (mesure nulle).
4. **Prévalence** : source unique = constantes TS, GARDÉES par le patch (refus si divergence > 0,5 pt) ;
   `index.meta` porte les numérateurs, pas une prévalence arrondie.
5. **Doctrine asymétrique** : jamais `satisfied` (pas de seuil de « présence forte » inventé).

## Prochaine étape immédiate

**Décider du sort de la branche** (finishing-a-development-branch) : merge fast-forward sur `main` + push, ou
PR. La branche est propre, tout est vert. Après merge, attaquer le **lot 2b** (`acces_services`).

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, `project_dossier_decision.md`, `project_module_logement.md`.
2. `docs/superpowers/specs/2026-07-15-mismatch-lot2a-absences-attestees-design.md` (doctrine à jour) et son plan.
3. Spec v1 `docs/superpowers/specs/2026-07-15-mismatch-design.md` (§11 périmètre : lots 2b/3 figés).
4. Code : `src/lib/decision/absence-facts.ts` → `absence-rules.ts` → `materiality-rules.ts` (REGISTRY) ;
   enrichissement `scripts/lib/absence-attestations.mjs` + `scripts/populate-absence-attestations.mts`.

## Pièges / fils ouverts

- **Piège server-only/node --test** : ne PAS value-importer `comparateur-vie.ts` dans un test (il fait
  `import "server-only"`, absent de node_modules). Les tests du lot restent purs (libs décision + mapping).
- **Après tout ré-enrichissement des attestations** : `node scripts/populate-absence-attestations.mts` PUIS
  `npm run index:pack` PUIS committer le `.gz` (le hook pre-commit refuse sinon). Sur clone frais :
  `npm run index:unpack` d'abord.
- **Si la prévalence réelle bouge** (MAJ caches BPE/OSM) : le patch REFUSE tant que `ABSENCE_NATIONAL_CONTEXT`
  (dans `absence-facts.ts`) + `ABSENCE_DISTRIBUTION_VERSION` ne sont pas mis à jour aux vraies valeurs.
- **Producteurs pas re-tournés** : `establishmentCount` et les caches `{meta,communes}` n'existent QUE pour un
  futur rebuild ; l'index actuel a `etudesSup` SANS `establishmentCount` (le dossier retombe sur
  `weightedAccess === 0`, équivalent hors cas-frontière rural).
- **Reste mismatch** : lot 2b (`acces_services`), lot 3 (mer/taille), fusion de deux mismatchs en compromis
  narratif, séparation `ProjectFit × DecisionConfidence` (reportée par le porteur).
- **Mémoire à MAJ** (pas encore fait) : aucune fiche `/memory` ne couvre le lot 2a `named_absence` ni les
  champs frères d'attestation. Envisager une fiche ou une ligne dans `project_dossier_decision`.

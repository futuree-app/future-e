# Passation — mismatch lot 3a (mer, absolute_measure) LIVRÉ sur branche ; reste lot 3b (taille) + sonde à lancer

**Horodatage** : 2026-07-16 · **Branche** : `feat/mismatch-lot3a-mer` (6 commits au-dessus de `main` `d2ff6d6`,
**non poussée, non mergée**). **Aucune PR ouverte.**

## Objectif en cours

Le **lot 3a de `mismatch`** est **livré sur la branche** (tests + build verts). Il ajoute la **troisième forme
de fondement** du rôle `mismatch` : `absolute_measure`, sur le seul critère `proximite_mer`. Reste : lancer la
**sonde manuelle** (contrôle éditorial API), décider du **merge**, puis le **lot 3b** (taille d'agglo,
`categorical_state`, brainstorm séparé).

## Ce que fait le lot 3a

Le dossier sait dire qu'un lieu répond mal à `proximite_mer` par une **mesure physique nommée** (la distance à
la côte), et constate aussi honnêtement la correspondance que l'écart. Règle **SYMÉTRIQUE** (la mesure EST la
qualité recherchée, contrairement à la ligne de bus du 2a) :

```
distance <= 15 km            -> satisfied  (couverture examinée, outcome critère "favorable", orientation "favorable", aucune carte)
15 < distance < 100 km       -> neutral    (couverture examinée, orientation "neutral", aucune carte)
distance >= 100 km, poids 1  -> mismatch silencieux (couverture acquise, pas d'arbitrage)
distance >= 100 km, poids 2  -> mismatch + carte secondary
distance >= 100 km, poids 3  -> mismatch + carte structuring
null / corrompu              -> uncertain  (jamais un verdict)
```

Convention versionnée `coast-proximity-v1` (seuils calibrés sur l'imprécision de la mesure V1 = distance à une
LISTE DE VILLES CÔTIÈRES, pas au trait de côte ; porte de sortie `v2` au trait de côte IGN pour rapprocher le
mismatch de 80 km). Couverture **22 → 23 sur 28**.

## Fait dans cette session (branche `feat/mismatch-lot3a-mer`, 6 commits)

- **Brainstorm + spec + plan** (validés porteur, avec une revue détaillée intégrée) :
  `docs/superpowers/specs/2026-07-16-mismatch-lot3a-mer-mesure-physique-design.md`,
  `docs/superpowers/plans/2026-07-16-mismatch-lot3a-mer-mesure-physique.md`.
- **Lib pure** : `src/lib/decision/coast-facts.ts` (`COAST_PROXIMITY_CONVENTION` = { satisfiedMaxKm:15,
  mismatchMinKm:100 }, `classifyCoastDistance` à 4 sorties, bornes fermées, gardes de corruption). 6 tests.
- **Règle** : `src/lib/decision/coast-rules.ts` (`COAST_RULES`, une règle `territoire.mer-proximite_mer`,
  patron d'`absence-rules.ts`). Garde d'invariant qui NARROW `distanceCoteKm` sans cast. 8 tests.
- **Type** : `AbsoluteMeasureBasis = { kind:"absolute_measure"; value:number; unit:"km"; conventionId:string }`
  ajouté à `MismatchBasis` (`decision-fact.ts`). `unit:"km"` SEUL (doctrine « seulement le productible » à
  l'intérieur du fondement) ; PAS de `nationalContext` (la mesure se suffit). `value` = distance BRUTE (non
  arrondie), le texte seul arrondit.
- **Câblage + validation RÉELLE** : `...COAST_RULES` au REGISTRY ; `assertFactValid` case `"mismatch"` valide
  désormais `value` fini ≥ 0, `unit === "km"`, `conventionId` non vide (protège tous les futurs producteurs de
  `MismatchFact`, pas une whitelist de noms).
- **E2E** : `src/lib/decision/coast-e2e.test.ts` (chaîne index → mapping → runRules → dossier : loin poids 3 →
  carte + arbitrage ; proche → satisfied/favorable ; intermédiaire → neutral ; poids 1 → couverture sans
  arbitrage). 4 tests.
- **Prompt** : `conclusion-prompt.ts` gagne une consigne mer dédiée (nommer la grandeur, garder « estimée à
  environ », jamais de temps de trajet, jamais « la mer est à X km », ça s'ARBITRE), PUIS bump
  `DECISION_NARRATIVE_PROMPT_VERSION` `v8 → v9` (`conclusion-hash.ts`). Artefacts persistés invalidés.
- **Sonde** : `scripts/probe-conclusion.ts` gagne le cas `planCoast` (« mer / éloignement »).
- **AUCUN enrichissement d'index** : `distanceCoteKm` est déjà dans l'index (`entry.distance_cote_km`) et déjà
  mappé (`module-facts-map.ts`). Pas de patch, cache, ou repack.

## Vérification (toute verte)

`node --test src/lib/*.test.ts src/lib/decision/*.test.ts` = **555/555** ; `node --test scripts/lib/*.test.mjs
scripts/*.test.mjs` = **22/22** ; `npx tsc --noEmit` = 0 ; `npm run build` exit 0 (2255/2255 pages).

## Formulation gravée (mémoire de voix)

- **statement** : « Vous avez placé la proximité de la mer parmi vos priorités. La distance au littoral est
  estimée à environ {km} km depuis le point de référence retenu pour {commune}. … »
- **limitation** : « … calculée à vol d'oiseau depuis un ensemble de localités côtières de référence. Elle ne
  correspond ni à la distance minimale au trait de côte, ni à la distance routière, ni au temps de trajet. Une
  version ultérieure pourra utiliser directement le trait de côte IGN. »
- Distance **arrondie** au texte (`Math.round`), valeur **brute** dans le basis. C'est la **distance** qui est
  estimée, pas « la côte ».

## Sonde LANCÉE (contrôle éditorial passé)

`node --env-file=.env.local scripts/probe-conclusion.ts` : cas « mer / éloignement » **5/5** (« La distance à
la mer ressort moins favorable qu'ailleurs : c'est un point à arbitrer… », comparatif, aucun chiffre, jamais
« la mer est à X km »). Total 28/30 (2 ratés stochastiques dans les plans pré-existants, hors mer). **La sonde
a trouvé un défaut** (1er run) : la 1re consigne mer disait « gardez "estimée à environ" », ce qui poussait la
CONCLUSION (qui n'a pas le chiffre) à écrire « estimée à environ une valeur moins favorable ». Consigne
recentrée (commit `fix`) : la conclusion nomme le sujet en comparatif, le chiffre reste dans la carte. `v9`
inchangé (déjà le bon label du prompt final).

## Prochaine étape immédiate

1. **Merge** de `feat/mismatch-lot3a-mer` vers `main` + push.
2. **Lot 3b** — catégorie d'agglomération (`eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`,
   lues depuis `ModuleFacts.tailleVille`). Fondement `CategoricalStateBasis = { kind:"categorical_state";
   observedCategory:string; conventionId:string }`. **Trois contrats éditoriaux DISTINCTS** (une agglo moyenne
   peut satisfaire `eviter_grandes_villes` sans être favorable à `prefere_grande_ville`) : pas une seule règle
   inversée. Taxonomie éditoriale déjà en place dans `comparateur-vie.ts` (village <2k, petite 2-25k, moyenne
   25-100k, grande 100-500k, métropole >500k). Brainstorm séparé.

## Fils ouverts

- **Dette doctrinale pré-existante (NON créée par 3a, NON corrigée ici)** : un `satisfied` de poids 1 compte
  comme favorable dans `criteria-registry`, alors que le poids 1 ne devrait pas influencer matériellement
  l'orientation. Concerne TOUTES les règles. Piste : `materialSatisfied = outcome==="satisfied" && weight>=2`,
  à auditer sur toutes les règles avant tout changement global.
- **Reste mismatch** : lot 3b (taille), 2 critères pour atteindre 28, fusion de deux mismatchs en compromis
  narratif, séparation `ProjectFit × DecisionConfidence` (reportée porteur).
- **Mémoire /memory à MAJ** : aucune fiche ne couvre encore les lots 2a `named_absence`, 2b, ni 3a
  `absolute_measure`. Envisager une fiche ou une ligne dans `project_dossier_decision`.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, `project_dossier_decision.md`.
2. Spec + plan 3a (ci-dessus). Spec 2a `docs/superpowers/specs/2026-07-15-mismatch-lot2a-absences-attestees-design.md`
   (doctrine `named_absence`) et spec v1 `docs/superpowers/specs/2026-07-15-mismatch-design.md` (§11 périmètre).
3. Code : `src/lib/decision/coast-facts.ts` → `coast-rules.ts` → `materiality-rules.ts` (REGISTRY +
   `assertFactValid`) ; type dans `decision-fact.ts`.

# `mismatch` lot 3a : la mer, une mesure physique (chantier B, suite)

**Date** : 2026-07-16 · **Statut** : spec validée (porteur, brainstorm) · **Prérequis** : mismatch v1
(`relative_position`, 10 critères) et lot 2a/2b (`named_absence` + extension `relative_position`) livrés et
poussés sur `main`. Couverture actuelle **22 → 23 sur 28**.

**Ce lot livre une TROISIÈME forme de fondement pour le rôle `mismatch` : `absolute_measure`.** Un lieu peut
répondre à une priorité déclarée par une **grandeur physique nommée** (ici une distance), et futur•e peut
constater aussi honnêtement la correspondance que l'écart. Un seul critère : `proximite_mer`.

La catégorie d'agglomération (préférences de taille) est le lot 3b, hors de ce lot (§9).

---

## 1. Le problème, et pourquoi ni `relative_position` ni `named_absence` ne conviennent

`proximite_mer` est déclarée par un lecteur qui veut vivre près de la mer. Une commune éloignée y répond mal,
sans que ce soit éliminatoire (l'exigence non négociable, elle, est portée par les contraintes dures `nearSea`
/ `excludeSea`). Il faut donc un `mismatch`. Mais les deux fondements existants échouent :

- **`relative_position` (v1) est trompeur ici.** La distribution de la distance à la côte est massivement
  décalée vers l'intérieur : sur les 34 788 communes, la **médiane est à 153 km** (p25 = 72 km, p75 = 268 km,
  max = 475 km). « Parmi les 20 % de communes les moins favorables » n'a aucun sens quand la moitié de la
  France est à plus de 150 km de la mer. Le percentile mentirait sur la nature du constat.
- **`named_absence` (2a) ne s'applique pas.** Il n'y a pas d'absence binaire à attester : toute commune a une
  distance à la côte, ce n'est pas « présent / absent ».

La forme juste est la **mesure physique absolue** : « la côte est estimée à environ 146 km du point de
référence retenu ». C'est un fait du monde, auto-suffisant, exactement comme l'incompatibilité `nearSea` dit
« 240 km de la mer que vous exigez ». Le `mismatch` en est la version non éliminatoire.

## 2. Le principe fondateur : la mesure EST la qualité recherchée

> **Quand la grandeur mesurée est directement la qualité recherchée, futur•e peut constater aussi honnêtement
> la correspondance que l'écart.**

C'est ce qui distingue la mer d'une ligne de bus (lot 2a). `reseauLocal` présent prouve seulement qu'une
desserte existe, pas qu'elle répond bien au quotidien : d'où la doctrine **asymétrique** de `named_absence`
(présence → `neutral`, jamais `satisfied`). `distanceCoteKm = 3 km` mesure **directement** la proximité du
littoral, la qualité même que la préférence recherche. La règle est donc **symétrique** : proche → `satisfied`,
loin → `mismatch`, entre-deux → `neutral`, donnée absente → `uncertain`.

**Un seul propriétaire décisionnel.** La proximité de la mer peut déjà apparaître dans la ligne distinctive,
les faits identitaires, la présentation du module Territoire : ce sont des **restitutions narratives**. La
règle `proximite_mer` est l'**unique propriétaire** de l'effet de la mer sur l'orientation. Les cartes
identitaires n'ajoutent aucun second signal favorable (elles ne sont pas dans `run.facts`, c'est déjà le cas).

## 3. La convention de distance, versionnée : `coast-proximity-v1`

Deux seuils délimitent les trois zones. Ils NE réutilisent PAS la formule de tri du comparateur
(`clamp(100 - distance / 1.5)`) : celle-ci sert au classement, pas au dossier.

```ts
export const COAST_PROXIMITY_CONVENTION = {
  id: "coast-proximity-v1",
  satisfiedMaxKm: 15,   // <= 15 km : on vit sur la frange littorale
  mismatchMinKm: 100,   // >= 100 km : nettement loin, robuste malgré l'imprécision de la mesure V1
  measure: "distance_haversine_to_reference_coastal_places",
} as const;
```

| Seuil | Part des communes |
|---|---|
| ≤ 15 km | ~3 % |
| ≤ 100 km | ~34 % |

**Pourquoi 15 km pour `satisfied`.** À 15 km, la mer structure vraisemblablement le territoire et peut faire
partie du quotidien ; le signal reste exigeant (~3 % des communes). 15 km plutôt que 10 km parce que la mesure
V1 (distance à une **liste de villes côtières**, pas au trait de côte) tend à **surestimer** la distance d'une
commune littorale éloignée d'une ville côtière listée : exiger 10 km perdrait des communes réellement
littorales.

**Pourquoi 100 km pour `mismatch`.** 80 km serait défendable avec une mesure précise au trait de côte ; avec le
proxy actuel c'est trop affirmatif (une commune mesurée à 85 km d'une ville côtière peut être sensiblement plus
proche du littoral réel). À partir de 100 km, le constat « ce lieu n'est pas raisonnablement proche de la mer »
devient robuste malgré l'imprécision, et le `mismatch` cesse d'être une simple conséquence du fait que la
France est majoritairement intérieure.

**Pourquoi une grande zone neutre est saine.** Entre 15 et 100 km, la distance brute ne permet pas de conclure
proprement : le temps d'accès réel dépend du réseau routier et du relief, que futur•e ne connaît pas encore.
`neutral` dit exactement « examiné, mais pas assez pour qualifier franchement la correspondance ou l'écart ».

**Porte de sortie `coast-proximity-v2`.** Quand le trait de côte IGN remplacera la liste de villes, on
recalibrera une v2 et on pourra rapprocher le seuil de `mismatch` de 80 km. La convention est versionnée
précisément pour ça.

## 4. La classification, pure

```ts
export function classifyCoastDistance(
  distanceKm: number | null,
): "satisfied" | "neutral" | "mismatch" | "uncertain" {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return "uncertain";
  if (distanceKm <= COAST_PROXIMITY_CONVENTION.satisfiedMaxKm) return "satisfied";
  if (distanceKm >= COAST_PROXIMITY_CONVENTION.mismatchMinKm) return "mismatch";
  return "neutral";
}
```

Bornes fermées assumées : exactement 15 km → `satisfied`, exactement 100 km → `mismatch`. **Une donnée corrompue
(NaN / non finie / négative) rend `uncertain`, jamais un verdict** — c'est le `?? 0` que le chantier A a tué.

## 5. Le fondement en union discriminée : `absolute_measure`

Le `basis` de `MismatchFact` (aujourd'hui `NamedAbsenceBasis | RelativePositionBasis`) gagne une troisième
variante. Le rôle reste `mismatch` unique.

```ts
export type AbsoluteMeasureBasis = {
  kind: "absolute_measure";
  value: number;              // la grandeur BRUTE (la distance mesurée)
  unit: "km";                 // "km" SEUL : on applique la doctrine « seulement le productible » (lot 2a)
                              //   À L'INTÉRIEUR du fondement. Autoriser "min" créerait un état que le moteur
                              //   ne sait ni produire ni expliquer, et qu'assertFactValid rejetterait (§10).
                              //   Le jour où une durée réelle entre, on élargit en connaissance de cause.
  conventionId: string;       // "coast-proximity-v1" : LA DOCTRINE des seuils, versionnée
};

export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis;
```

**Pas de `nationalContext`.** Contrairement à `named_absence` (qui porte une prévalence datée, « ~83 % des
communes »), la mesure absolue **se suffit** : le fait EST la distance nommée. On ne cite pas de part nationale
dans la carte mer.

**`value` est la distance brute**, pas le score de tri : le basis reste auditable indépendamment de la
convention (on peut recalibrer les seuils sans réécrire la valeur mesurée).

## 6. La doctrine de résultat, et le poids

La règle est **symétrique** côté examen, **asymétrique** côté matérialité (seul le `mismatch` produit un fait —
l'architecture n'a pas de fait favorable matériel, cf. §7).

```
préférence absente                         -> not_applicable
distance invalide / absente                -> uncertain
distance <= 15 km                          -> satisfied, facts: []   (couverture acquise, favorable, silencieux)
15 km < distance < 100 km                  -> neutral,   facts: []   (couverture acquise, silencieux)
distance >= 100 km, poids 1                -> mismatch,  facts: []   (examiné, silencieux, aucun effet orientation)
distance >= 100 km, poids 2                -> mismatch + MismatchFact secondary   (carte visible)
distance >= 100 km, poids 3                -> mismatch + MismatchFact structuring  (carte visible)
```

Le poids gouverne **la seule face `mismatch`** : le comptage matériel (structurant, ou ≥ 2 secondaires →
`arbitration`) se fait sur `run.facts`, exactement comme en v1/2a. Jamais `decision_critical` : une préférence
n'est pas une condition non négociable. Aucun changement du registre `criteria-registry`.

## 7. La face `satisfied` : silencieuse, sans nouvelle machinerie

**Décision gravée** : le lot 3a suit la convention existante. `satisfied` et `neutral` sont des **outcomes**
silencieux, sans `DecisionFact` ni niveau de matérialité (tableau de faits vide), exactement comme tous les
autres `satisfied` du code (inondation, chaleur, air, industrie). Un `satisfied` monte la couverture et compte
comme « favorable » via `criteria-registry`, mais ne produit **aucune carte**, quel que soit le poids. Même à
3 km de la mer, aucune carte positive spécifique : la proximité est déjà visible ailleurs (faits identitaires,
ligne distinctive, module Territoire), le moteur de décision n'a pas à la redire.

**Le lot n'introduit AUCUN système de faits favorables.** Créer un rôle de fait positif (avec matérialité
positive, section « forces », arbitrage forces identitaires vs forces projet, déduplication, plafonnement,
refonte de l'orientation et du prompt) est un chantier transverse bien plus large, qui doit répondre à une
question globale (« futur•e doit-il expliciter les principales raisons positives de retenir un lieu ? ») et ne
doit pas s'introduire incidemment pour la seule mer. Hors de ce lot.

**Dette doctrinale pré-existante, NOTÉE, non corrigée ici.** Un `satisfied` de poids 1 compte aujourd'hui comme
favorable dans `criteria-registry`, alors que le poids 1 devrait être examiné sans influencer matériellement
l'orientation. Ce comportement **préexiste** (toutes les règles, pas la mer) et n'est **pas** touché par 3a.
Piste future (à auditer sur toutes les règles avant tout changement global) : distinguer la couverture (tous
les critères déclarés examinables, poids 1 inclus) de l'orientation favorable (satisfied de poids ≥ 2). Elle ne
demanderait pas nécessairement des faits positifs, plutôt un `materialSatisfied = outcome === "satisfied" &&
weight >= 2` dans le registre.

## 8. La formulation, et le grain

Le `statement` porte la distance estimée et le lien au projet ; la `limitation` (champ optionnel déjà présent
sur `MismatchFact`) porte la nuance méthodologique. Le grain est **le point de référence retenu** (le centroïde
communal), jamais « la commune est à X km ». Contraintes de voix (mémoire) : pas de tiret cadratin ; pas
d'antithèse « c'est X, pas Y ».

La distance est **arrondie au km** (`Math.round`, comme les contraintes dures) et **toujours préfixée
« estimée à environ »** : la mesure V1 ne mesure pas la distance minimale au trait de côte, on ne dit donc
jamais « la mer est à 146 km » (fausse précision).

### Mer (mismatch, distance ≥ 100 km)

C'est la **distance** qui est estimée, pas « la côte » : la formulation le dit exactement.

- **statement** : « Vous avez placé la proximité de la mer parmi vos priorités. La distance au littoral est
  estimée à environ {km} km depuis le point de référence retenu pour {commune}. Cette distance répond moins
  bien à cette dimension de votre projet, sans rendre {commune} incompatible avec lui. »
- **limitation** : « Cette estimation est calculée à vol d'oiseau depuis un ensemble de localités côtières de
  référence. Elle ne correspond ni à la distance minimale au trait de côte, ni à la distance routière, ni au
  temps de trajet. Une version ultérieure pourra utiliser directement le trait de côte IGN. »
- **topic** : « la distance à la mer ».
- **observedValue** (sur l'`EvidenceRef`) : « distance au littoral estimée à environ {km} km ». La prudence
  « estimée à environ » est portée par le statement, la preuve ET la consigne de prompt (§10), sans exception.
- **grain** : `"commune"` (l'enum `EvidenceRef.grain` est `"commune" | "adresse" | "secteur"` : on ne l'élargit
  pas ici). La précision « point de référence retenu » est portée par le statement et la limitation, pas par
  le grain : le contrat de preuve n'affirme jamais une mesure surfacique sur toute la commune.

## 9. Périmètre exact

**DANS ce lot** — la forme `absolute_measure` sur un critère : `proximite_mer`. Couverture **22 → 23 sur 28**.
Aucun script de patch, cache, ou repack d'index : `distanceCoteKm` est déjà dans l'index (`entry.distance_cote_km`)
et déjà chargé dans `ModuleFacts` (`module-facts-map.ts`, nullable → `uncertain`).

**HORS de ce lot (figé pour mémoire, lot 3b)** :

- **Catégorie d'agglomération** : `eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`, lues
  depuis `ModuleFacts.tailleVille`. Fondement `CategoricalStateBasis = { kind: "categorical_state";
  observedCategory: string; conventionId: string }`. Trois contrats éditoriaux DISTINCTS. Brainstorm séparé.
- Restent 2 critères non couverts après le lot 3b (pour atteindre 28).
- La fusion de deux mismatchs en compromis narratif, et la séparation `ProjectFit` × `DecisionConfidence`.

**On ne déclare PAS `CategoricalStateBasis` dans l'union de production tant que le moteur ne le produit pas** :
une variante inerte forcerait tous les consommateurs exhaustifs (dont `assertFactValid`) à traiter un état
impossible. L'union grandit quand la forme devient réelle (même doctrine qu'au lot 2a).

## 10. Câblage, prompt, sonde

- **Types** : `AbsoluteMeasureBasis` ajouté à `MismatchBasis` (`decision-fact.ts`).
- **Lib pure** : `src/lib/decision/coast-facts.ts` (`COAST_PROXIMITY_CONVENTION`, `classifyCoastDistance`).
- **Règle** : `src/lib/decision/coast-rules.ts` (fabrique sur le patron d'`absence-rules.ts`), exportant
  `COAST_RULES` (une règle `territoire.mer-proximite_mer`) et `COAST_KEYS`.
- **REGISTRY + validation réelle** : `...COAST_RULES` ajouté dans `materiality-rules.ts`. `case "mismatch"`
  d'`assertFactValid` ne se contente PAS d'ajouter `absolute_measure` à une whitelist de noms : il **valide la
  mesure** (`value` fini et ≥ 0, `unit === "km"`, `conventionId` non vide). Le classifieur protège la règle ;
  le validateur protège tous les futurs producteurs de `MismatchFact`.
- **Prompt (vraiment modifié)** : `conclusion-prompt.ts` gagne une consigne mer dédiée (nommer la grandeur et
  son estimation, garder « estimée à environ », jamais transformer une distance en temps de trajet, jamais
  « la mer est à X km », ça s'ARBITRE jamais « à vérifier »), PUIS bump `DECISION_NARRATIVE_PROMPT_VERSION`
  `v8 → v9` (`conclusion-hash.ts`). Bumper sans modifier le prompt invaliderait tout sans rien apprendre au
  modèle : les deux vont ensemble. Artefacts persistés invalidés.
- **Sonde** : `scripts/probe-conclusion.ts` gagne le cas mer (mismatch de distance) ; contrôle éditorial manuel
  (appels API) avant de livrer.

## 11. Critères d'acceptation

1. Le `basis` de `MismatchFact` est une union `NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis` ;
   v1 et 2a passent sans régression.
2. `proximite_mer` déclarée (poids 2/3), `distanceCoteKm >= 100` → `mismatch` matériel : carte nommant la
   distance estimée au **point de référence**, `basis.kind === "absolute_measure"`, `basis.value` = distance
   brute, `basis.conventionId === "coast-proximity-v1"`, `unit === "km"` ; jamais « la mer est à X km » (toujours
   « estimée à environ ») ; la `limitation` porte la nuance vol-d'oiseau / trait de côte IGN. **La valeur brute
   du basis n'est pas arrondie** : `distanceCoteKm = 146.4` → `basis.value === 146.4` ET statement « environ
   146 km » (fait auditable = valeur brute, restitution humaine = valeur arrondie).
3. `distanceCoteKm <= 15` → `satisfied` silencieux : aucune carte, mais **couverture `examined`, outcome de
   critère `favorable`, orientation `favorable`** (le débat doctrinal se grave dans le test E2E). `15 < d < 100`
   → `neutral` silencieux : aucune carte, **couverture `examined`, orientation `neutral`** (valeur de l'enum
   `Orientation` qui existe bien). Aucun `DecisionFact` produit dans les deux cas, quel que soit le poids.
4. `distanceCoteKm` null / NaN / négatif → `uncertain` : couverture NON acquise, aucune valeur inventée, aucun
   repli `?? 0`.
5. `proximite_mer` non déclarée → `not_applicable`.
6. Poids 1 avec `d >= 100` → `mismatch` examiné mais silencieux (couverture +1, aucune carte, ne compte pas
   comme matériel, ne déclenche pas `arbitration`). Poids 2 → secondary, poids 3 → structuring. Jamais
   `decision_critical`. Un ensemble matériel → `arbitration` (comptage sur `run.facts`). **Un test d'orientation**
   le prouve.
7. `DECISION_NARRATIVE_PROMPT_VERSION` bumpée `v8 → v9`, sonde repassée (cas mer), artefacts invalidés.
8. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit` rend 0, `npm run build`
   exit 0. (Aucun `index:verify` requis : l'index n'est pas modifié.)

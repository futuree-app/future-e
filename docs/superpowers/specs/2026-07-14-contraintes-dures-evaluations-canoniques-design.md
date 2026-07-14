# Contraintes dures : des évaluations canoniques, partagées et opposables (chantier A)

**Date** : 2026-07-14 · **Statut** : spec validée (porteur, 2e passe) · **Prérequis** : slices 1 → 2.1 du
dossier de décision livrées et mergées (`1d986f4`).

**Chantier suivant, hors de ce spec** : `mismatch`, le cinquième rôle de fait (le lieu répond mal à une
priorité déclarée, sans que ce soit éliminatoire) et la refonte de l'orientation du verdict. Ce spec
n'en emploie ni le vocabulaire ni les types.

---

## 1. Le problème

Le dossier de décision n'examine que 3 contraintes dures sur 11. Le handoff appelait cela un manque de
couverture. L'inventaire montre trois défauts plus graves, qui portent tous sur la **vérité** de ce que
futur•e affirme.

### 1.1 Le comparateur laisse tomber une condition non négociable, en silence

`matchProjects` résout `nearPlace.label` contre l'**index des noms de communes**
(`nameIndex`, `comparateur-vie.ts:1058`). Le projet de test déclare « à moins de 30 minutes de la gare
Matabiau ». « Gare Matabiau » n'est pas une commune : `placePoint` reste `null`, et `passesHard`
**saute purement et simplement le test** (`comparateur-vie.ts:2176`). La contrainte n'est appliquée
nulle part, et rien ne le dit au lecteur.

Le comparateur affiche donc des communes en laissant croire qu'elles respectent toutes ses conditions
absolues, alors que l'une d'elles n'a jamais été appliquée. Ce n'est plus un trou de couverture : c'est
un filtre qui ment.

### 1.2 Les deux moteurs sont déjà en désaccord sur la taille

`passesHard` évalue `communeSize` sur la **taille d'agglomération** (`tailleVille`, la population de
l'unité urbaine, doctrine du chantier C). La règle du dossier (`ruleTaille`, `materiality-rules.ts:46`)
l'évalue sur la **population communale**. Pour le même projet et la même commune, une commune de 8 000
habitants dans l'unité urbaine de Lyon est **exclue par le comparateur** et déclarée **`satisfied` par
le dossier**. Deux moteurs, deux vérités, un seul lecteur.

### 1.3 Le même défaut sur la mer, resté invisible

`nearSea` déclarée **sans distance** (« il nous faut la mer ») : le comparateur filtre à **30 km, en
silence** (`passesHard:2168`, `?? 30`), pendant que `nearSeaLimitKm` (`project-view.ts:26`) exige un
`maxKm` numérique, rend `null`, et fait rendre `not_applicable` à `ruleMer` (« nearSea non déclaré »)
sur une contrainte que le lecteur a bel et bien posée. Le critère reste non examiné dans le dossier, et
il filtre à un rayon choisi par le produit dans le comparateur.

Trois seuils inventés en silence, donc : 30 km pour la mer, 50 km pour un lieu nommé
(`matchProjects:2593`), et la mutation de `communeSize` par `sizeRelativeTo`. Aucun n'est opposable au
lecteur, et aucun n'apparaît nulle part à l'écran.

**Fait vérifié, et il commande la doctrine du §4.5** : ces défauts sont appliqués **au runtime**
(`?? 50`, `?? 30`) et **ne sont jamais écrits dans `hardConstraints`**. Un `maxKm` présent dans un projet
enregistré vient donc **toujours du parse**, donc du texte du lecteur. Il n'y a aucun « faux user » à
démêler dans les projets historiques.

### 1.4 Le filtre exclut sur donnée manquante, et le dossier ne peut pas s'en contenter

`passesHard` écrit `(c.relief_proximite ?? 0) < RELIEF_PROCHE_HARD`, exclut les communes sans altitude
(`montagnosite` rend `null`) et celles sans population (`POP_FLOOR`). Pour un filtre, c'est une doctrine
prudente légitime : dans le doute, ne pas proposer. Pour un dossier, écrire « votre exigence de relief
n'est pas respectée » quand la donnée est absente serait un mensonge d'un autre ordre.

Même observation, deux conduites à tenir. C'est exactement ce qu'un booléen ne sait pas porter.

---

## 2. Ce que ce chantier établit

```
contrainte déclarée
  → évaluation canonique          (la VÉRITÉ MÉTIER : ce qui est constaté)
    → politique du comparateur    (la politique de RECHERCHE : dans le doute, ne pas proposer)
    → politique du dossier        (la politique de RAPPORT : une absence n'est jamais une incompatibilité)
```

Une **évaluation canonique** par contrainte dure, calculée une seule fois, consommée par les deux
moteurs. Le comparateur en dérive son filtre, le dossier en dérive ses faits, le registre des critères
en dérive sa couverture. Les trois lisent le même constat sur le même territoire, et en tirent des
conduites différentes, assumées.

Une **référence résolue et persistée** : « la gare Matabiau » devient un point, avec sa source, sa
confiance, l'empreinte de son entrée et la version du résolveur qui l'a produit. Les moteurs ne
résolvent plus jamais une chaîne libre chacun de leur côté.

Une **distinction opposable entre « satisfaite » et « non appliquée »**. Le comparateur peut afficher
des résultats en disant qu'une condition n'a pas pu être appliquée. Il n'a plus le droit de faire passer
l'une pour l'autre.

**Ce que ce chantier ne fait pas** : aucun changement du prompt de conclusion, aucun bump de
`DECISION_NARRATIVE_PROMPT_VERSION`, aucun nouveau rôle de fait, aucun nouvel outcome de règle. La
grammaire narrative reste celle de la slice 2.1.

---

## 3. A0 — La normalisation du schéma

A1 ne peut pas écrire l'évaluateur `nearSea` sans connaître la doctrine de son seuil, et cette doctrine
appartient au même type que celle de `nearPlace`. Les types de seuil, la provenance, le contexte
d'évaluation et les conventions du produit sont donc posés **d'abord**, avant tout évaluateur.

### 3.1 Le seuil, et sa provenance

```ts
export type ThresholdSource = "user";   // un seuil OPPOSABLE vient du lecteur, et de lui seul

export type PlaceThreshold =
  | { metric: "distance";    maxKm: number;      source: ThresholdSource }
  | { metric: "travel_time"; maxMinutes: number; mode: "car" | "walk" | "bike" | null;
      direction: "to_reference"; source: ThresholdSource };
```

**Il n'existe pas de seuil `legacy_default` dans le contrat dur.** Un rayon que le produit a choisi
lui-même n'est pas une condition non négociable du lecteur, et ne peut donc produire **ni `satisfied`,
ni `incompatible`, ni un filtre**. Voir §4.5.

### 3.2 Les conventions du produit, centralisées et nommées

Ce spec reproche au moteur trois seuils inventés en silence. Il en conserve d'autres, qui sont
légitimes : ils ne mesurent pas une exigence du lecteur, ils **définissent le sens d'un mot**
(« montagne », « pas au bord de la mer »). Ils cessent d'être dispersés dans le code :

```ts
// src/lib/hard-constraints.ts
export const PRODUCT_CONVENTIONS_VERSION = "hc-conv-1";
export const PRODUCT_CONVENTIONS = {
  excludeSeaMinKm: 15,       // « pas le littoral » = au moins 15 km de la côte
  montagneMinScore: 50,      // « à la montagne » = montagnosité >= 50, soit environ 600 m
  reliefProcheMinScore: 50,  // « proche d'une montagne » = un massif à portée
} as const;
```

Chaque convention est **nommée dans le texte** qui l'applique, jamais appliquée en silence :

> Votre souhait de ne pas habiter près du littoral est ici entendu comme une distance d'au moins 15 km
> de la côte.

`PRODUCT_CONVENTIONS_VERSION` change quand une convention change : ce qui a été affirmé au lecteur reste
traçable.

### 3.3 Le contexte d'évaluation, et le point réellement testé

Un point-dans-polygone n'est honnête que si le point qui représente la commune est lui-même explicite.
Il ne peut pas être un détail que l'évaluateur va chercher tout seul dans `commune.lat/lon` : il entre
dans le **contexte**, où on ne peut pas l'oublier.

```ts
export type EvaluationPoint = {
  lat: number; lon: number;
  grain: "commune_reference" | "address";
  source: "commune_centroid" | "address_geocoder";
  label: string;   // « le point de référence de Toulouse » / « 7 rue du Taur, Toulouse »
};

export type EvaluationContext = {
  constraints: NormalizedHardConstraints;   // seuils + références résolues, déjà hydratés
  point: EvaluationPoint;
  conventionsVersion: string;
};
```

Les phrases restent **bornées au grain** :

> Le point de référence de Toulouse se situe dans l'isochrone de 30 minutes en voiture depuis la gare
> Matabiau.

Ce qui ne dit pas, et ne doit pas laisser entendre, que *toute* la commune y est. Évaluer la géométrie
communale entière (entièrement dedans → `satisfied` ; entièrement dehors → `incompatible` ; intersection
partielle → à qualifier) est la bonne cible ; elle est **hors de ce spec**.

Quand une adresse est renseignée, le point évalué est **l'adresse**, et le `grain` le dit.

---

## 4. A1 — Le contrat canonique

Une lib **pure** : `src/lib/hard-constraints.ts`. Ni `server-only`, ni réseau, ni chargement d'index,
donc testable sous `node --test` (cf. le piège `server-only` du handoff).

### 4.1 Les attributs de la commune

```ts
export type CommuneAttributes = {
  insee: string;
  nom: string;
  dept: string | null;
  lat: number | null;
  lon: number | null;
  population: number | null;      // population COMMUNALE
  tailleVille: number | null;     // taille d'AGGLOMÉRATION, déjà résolue par l'appelant
  uu: string | null;
  altitude: number | null;
  reliefProximite: number | null;
  distanceCoteKm: number | null;
};
```

**Tout est nullable, et aucun évaluateur n'emploie de test de vérité implicite.** Une altitude de 0, une
distance à la côte de 0, un relief de 0 sont des observations valides. Le `?? 0` que `passesHard` applique
aujourd'hui à `relief_proximite` est précisément la faute que ce type rend impossible.

**Doctrine de `tailleVille`**, gravée dans le type :

```
commune appartenant à une unité urbaine  → population de l'unité urbaine
commune hors unité urbaine               → population communale (elle est son propre bassin)
```

Une commune isolée a donc une `tailleVille`, et elle ne devient jamais `unexamined` pour cette raison.

### 4.2 Les valeurs, structurées

Le noyau ne porte pas seulement des phrases prérédigées : il porte la **donnée** qui permet de vérifier,
de tester, de comparer et, plus tard, d'exporter le constat.

```ts
export type ConstraintValue =
  | { kind: "distance_km";     value: number }
  | { kind: "travel_time_min"; value: number; mode: "car" | "walk" | "bike" }
  | { kind: "population";      value: number; unit: "urban_unit" | "commune" }
  | { kind: "department";      value: string }
  | { kind: "departments";     value: string[] }
  | { kind: "altitude_m";      value: number }
  | { kind: "score";           value: number }
  | { kind: "boolean";         value: boolean };
```

### 4.3 L'évaluation

```ts
export type UnexaminedReason =
  | "missing_data"            // la donnée de CETTE commune manque (relief, altitude, population)
  | "unresolved_reference"    // le lieu nommé n'a pas pu être identifié
  | "ambiguous_reference"     // plusieurs lieux correspondent au nom
  | "missing_parameter"       // le lieu est identifié, un PARAMÈTRE d'évaluation manque (mode, distance)
  | "unsupported_metric"      // la métrique demandée n'est pas calculable honnêtement aujourd'hui
  | "insufficient_precision"  // le point tombe dans la bande de tolérance d'une géométrie simplifiée
  | "routing_unavailable";    // échec TECHNIQUE, temporaire, à retenter. Jamais persisté comme un refus.

export type HardConstraintAssessment<K extends HardConstraintKey = HardConstraintKey> =
  | { key: K; status: "not_declared" }
  | { key: K; status: "satisfied";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[] }
  | { key: K; status: "incompatible";
      observedValue: ConstraintValue; expectedValue: ConstraintValue;
      observedLabel: string; expectedLabel: string; evidenceKeys: string[];
      statement: string; topic: string }
  | { key: K; status: "unexamined"; reason: UnexaminedReason; detail?: string };
```

**`not_declared` existe** parce que l'évaluateur est appelé sur les 11 clés : « le lecteur ne l'a pas
posée » et « nous n'avons pas su l'examiner » sont deux choses, et les confondre gonflerait ou creuserait
la couverture d'un mensonge.

**`routing_unavailable` est un état technique.** Un incident réseau ne se persiste jamais comme une
impossibilité sémantique stable. Il se retente.

**`statement` et `topic` vivent dans le noyau.** Ils incarnent la doctrine de la contrainte, et c'est
précisément ce qui doit être identique dans les deux moteurs.

**`evidenceKeys` (jamais `sourceFactIds`).** Le mot `factId` appartient au vocabulaire des cartes du
dossier ; le laisser entrer dans le noyau partagé y ferait entrer la présentation, morceau par morceau.
Le noyau expose des clés de provenance :

```ts
evidenceKeys: ["commune.tailleVille", "project.hardConstraints.communeSize"]
```

Le dossier les transforme en `EvidenceRef` (avec son `href`, son `grain`, son `module`) ; le comparateur
peut les utiliser pour ses explications de périmètre. **`EvidenceRef`, `materialityTier` et `factId`
restent hors du noyau.**

### 4.4 Le registre exhaustif, et typé par la clé

```ts
const HARD_CONSTRAINT_EVALUATORS: {
  [K in HardConstraintKey]:
    (ctx: EvaluationContext, commune: CommuneAttributes) => HardConstraintAssessment<K>;
} = { departements, zones, excludeZones, montagne, reliefProche, nearSea, excludeSea,
      nearPlace, communeSize, excludePlace, sizeRelativeTo };
```

Deux garanties du typage, plutôt que deux tests qu'on oublierait d'écrire : ajouter une
`HardConstraintKey` sans évaluateur **casse le typecheck**, et un évaluateur enregistré sous `nearSea` ne
peut pas rendre `key: "excludeSea"`.

### 4.5 Les seuils que le produit s'est inventés

`nearPlace` sans distance déclenche aujourd'hui **50 km en silence** ; `nearSea` sans distance, **30 km
en silence**. Ces rayons **sortent du contrat dur** :

```ts
// Ce que le comparateur a le droit d'utiliser pour EXPLORER, jamais pour ÉLIMINER.
export type SearchExplorationHint = {
  kind: "near_place_radius" | "near_sea_radius";
  valueKm: number;              // 50 | 30
  source: "legacy_default";
  confirmedByUser: false;
};
```

La doctrine, sans exception :

```
seuil absent
  → contrat dur    : unexamined(missing_parameter)   → jamais satisfied, jamais incompatible
  → comparateur    : indice d'exploration (cadrer, classer), JAMAIS un filtre dur, complete: false
  → dossier        : critère non examiné, le couperet mord
  → lecteur        : une ambiguïté lui est posée (« quelle distance maximale retenez-vous ? »)
```

Une fois répondue : `source: "user"`, et la contrainte devient **opposable**.

**Migration** : aucune conversion aveugle. Le fait vérifié du §1.3 rend la règle triviale et sûre.

```
maxKm présent dans le projet persisté  → il vient du parse, donc du lecteur → source: "user"
maxKm absent / null                    → aucun seuil n'a JAMAIS été déclaré → missing_parameter
```

Le 50 et le 30 n'ont jamais été écrits dans un projet : ils n'ont existé que dans la mémoire d'un appel.
Il n'y a donc aucun ancien `maxKm` à suspecter.

### 4.6 Inventaire des 11 contraintes

| Clé | Donnée | Logique (`passesHard` aujourd'hui) | Résolution nécessaire | `unexamined` si |
|---|---|---|---|---|
| `departements` | `dept` | `includes(dept)` | aucune | `dept` absent |
| `zones` (hard) | `dept` + `ZONE_TABLE` | `zoneDepts.has(dept)` | `resolveZoneAnchors` (pur, `geo-zones.ts`) | `dept` absent |
| `excludeZones` | `dept` | `excludeDepts.has(dept)` | `resolveExclusions` (pur) | `dept` absent |
| `montagne` (hard) | `altitude` | `montagnosite ≥ 50` (≈ 600 m) | aucune | altitude absente |
| `reliefProche` (hard) | `reliefProximite` | `≥ 50` | aucune | **relief absent** (aujourd'hui `?? 0`, donc exclusion) |
| `nearSea` | `distanceCoteKm` | `≤ maxKm` (**défaut 30, silencieux**) | aucune | distance absente **ou seuil non déclaré** |
| `excludeSea` | `distanceCoteKm` | `≥ 15 km` (convention produit) | aucune | distance absente |
| `communeSize` | **`tailleVille`** | bornes min/max | aucune | `tailleVille` absente |
| `nearPlace` | `EvaluationPoint` | haversine `> maxKm` (**défaut 50, silencieux**) | lieu → point (+ isochrone si temps) | référence ou paramètre manquant |
| `excludePlace` | `uu` / `insee` | `excludeUU.has(uu)` | ville → unité urbaine (+ table PLM) | référence non résolue |
| `sizeRelativeTo` | `tailleVille` | **replié dans `communeSize`** (mutation de `hc`) | ville → population d'UU de référence | référence non résolue |

---

## 5. A2 — Les références résolues, et l'atteignabilité

### 5.1 Trois références, pas une

Un point suffit à `nearPlace`. Il ne suffit ni à `excludePlace` (qui a besoin d'une unité urbaine) ni à
`sizeRelativeTo` (qui a besoin d'une population de référence). Leur donner à tous `ResolvedPlaceReference`
obligerait leur évaluateur à **rouvrir un index au runtime**, et la promesse (« les deux moteurs
consomment exactement la même référence persistée ») tomberait.

```ts
type ResolutionMetadata = {
  // L'empreinte de l'ENTRÉE de la résolution : label brut + contexte territorial utilisé + type
  // attendu + version du normaliseur. Sans elle, remplacer « gare Matabiau » par « gare Saint-Jean »
  // conserverait en silence les coordonnées de Toulouse.
  inputHash: string;
  resolverVersion: string;
  resolvedAt: string;
};

export type ResolvedPlaceReference =        // nearPlace
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      kind: "commune" | "station" | "address" | "poi";
      lat: number; lon: number;
      source: "commune_index" | "ban"; sourceId: string | null;
      confidence: "exact" | "high"; meta: ResolutionMetadata }
  | { status: "ambiguous"; originalLabel: string;
      candidates: { canonicalLabel: string; lat: number; lon: number; kind: string }[];
      meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string;
      reason: "no_result" | "low_confidence" | "unsupported_type"; meta: ResolutionMetadata };

export type ResolvedUrbanAreaReference =    // excludePlace
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      referenceCommuneInsee: string;
      urbanUnitCode: string | null;         // null = ville hors UU : elle est son propre périmètre
      normalizedTerritoryCode: string;      // porte le cas PLM (Paris / Lyon / Marseille)
      source: "commune_index" | "plm_table"; meta: ResolutionMetadata }
  | { status: "ambiguous"; originalLabel: string; candidates: { canonicalLabel: string; insee: string }[];
      meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string; reason: "no_result" | "low_confidence";
      meta: ResolutionMetadata };

export type ResolvedSizeReference =         // sizeRelativeTo
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      urbanUnitCode: string | null;
      comparisonPopulation: number;
      populationYear: number;
      populationKind: "urban_unit" | "isolated_commune";
      source: "commune_index" | "plm_table"; meta: ResolutionMetadata }
  | { status: "ambiguous"; originalLabel: string; candidates: { canonicalLabel: string; insee: string }[];
      meta: ResolutionMetadata }
  | { status: "unresolved"; originalLabel: string; reason: "no_result" | "low_confidence";
      meta: ResolutionMetadata };
```

`populationYear` et `populationKind` sont dans le contrat parce que « plus petit que Bordeaux » compare
**deux agglomérations**, et que la phrase le dira.

### 5.2 L'isochrone est un artefact, pas un champ du projet

La gare Matabiau et le polygone « 30 minutes en voiture » ne sont pas le même objet. La référence dépend
du libellé, du contexte territorial et du résolveur. L'atteignabilité dépend de la référence, du seuil,
du mode, du sens du trajet, du moteur de routage et de la simplification. Passer de 30 à 20 minutes ne
déplace pas la gare : seul l'artefact de mobilité se recalcule. Ils portent donc **deux versions
séparées**.

Une géométrie, même simplifiée, ne va pas dans `UserProject` : elle serait chargée à chaque lecture du
projet, retransmise à des appels qui n'en ont pas besoin, réécrite à chaque modification, embarquée dans
des sérialisations et des empreintes, et jamais partagée entre deux lecteurs qui visent la même gare.

**Dans le projet, une référence immuable :**

```ts
export type ReachabilityReference = {
  requestHash: string;      // l'identité de la DEMANDE (voir ci-dessous)
  geometryHash: string;     // l'identité de la GÉOMÉTRIE servie
  artifactId: string;
  maxMinutes: number;
  mode: "car" | "walk" | "bike";
  direction: "to_reference";
  engine: "ign-valhalla";
  generatedAt: string;
};
```

**Dans une table dédiée, la géométrie** (`supabase/…_reachability_artifact.sql`) :

```
reachability_artifact
  id · request_hash (unique) · geometry (jsonb) · geometry_hash
  engine · engine_version · resource · simplification_version · created_at
```

Le `requestHash` porte **les coordonnées exactes de la référence** (jamais un simple `referenceId` : un
même identifiant peut recevoir des coordonnées corrigées), la métrique, la durée, le mode, le sens, la
ressource IGN, la version de l'intégration et la version de simplification.

La parité tient : les deux moteurs lisent **le même artefact, sous le même hash**. Et l'isochrone est
déduplicable entre deux projets qui visent la même gare au même seuil.

### 5.3 La chaîne de résolution

```
nom exact de commune (index interne)
  → géocodage BAN
    → CONTRÔLES : type du résultat, concordance du libellé, proximité du territoire déclaré, score
      → resolved | ambiguous | unresolved
```

Un résultat seulement **plausible** ne devient jamais `resolved`. Un géocodeur d'adresses peut renvoyer
quelque chose pour « Gare Matabiau » sans avoir identifié la gare : c'est ce cas que les contrôles
doivent attraper.

Le **contexte territorial** (départements déclarés, commune du rapport, ancres déjà résolues) sert à
**désambiguïser**. Il ne force jamais un résultat : si deux candidats restent plausibles, la référence
reste `ambiguous`. Ce contexte entre dans `inputHash` : il fait partie de l'entrée de la résolution.

### 5.4 Le seuil, et le refus de le deviner

**« 30 minutes de la gare Matabiau » évalué par un haversine est interdit.** Une distance à vol d'oiseau
n'établit pas un temps de trajet.

| Seuil déclaré | Évaluation |
|---|---|
| `distance` + référence résolue | haversine, déterministe, aucune géométrie nécessaire |
| `travel_time` + mode + isochrone disponible | point dans le polygone (§5.6) |
| `travel_time` sans mode | `unexamined(missing_parameter)` |
| `travel_time` en transports collectifs | `unexamined(unsupported_metric)` |
| échec du routage | `unexamined(routing_unavailable)`, à retenter, **jamais persisté comme un refus** |

**Le mode absent est un `missing_parameter`, jamais un `ambiguous_reference`** : la gare peut être
parfaitement identifiée ; c'est un paramètre d'évaluation qui manque. Le parse émet alors une
**ambiguïté** (`ParsedProject.ambiguities` existe déjà, c'est exactement sa fonction) :

> Vos 30 minutes de la gare Matabiau : à pied, à vélo, en voiture ?

### 5.5 L'isochrone

`https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point={lon},{lat}&costValue={s}&costType=time&profile={car|pedestrian|bike}&direction=arrival`

Sans clé, un appel **par référence et par seuil**, jamais par commune : le polygone est calculé une fois
depuis le lieu, puis les 35 000 communes sont testées localement.

**Le sens du trajet est fixé et il entre dans le `requestHash`.** « Habiter à moins de 30 minutes de la
gare » veut dire *domicile → gare* : `direction: "to_reference"` (soit `direction=arrival` côté IGN). Si
ce sens ne peut pas être calculé honnêtement, l'évaluation reste `unsupported_metric`. Le sens inverse ne
le remplace jamais en silence.

**A se limite aux profils réellement maîtrisés** (voiture, marche, vélo). Les transports collectifs, sans
jour, heure et politique d'attente, produiraient un polygone d'une précision trompeuse :
`unexamined(unsupported_metric)` tant que leur doctrine n'est pas écrite.

### 5.6 Le point dans le polygone, et la bande de tolérance

La géométrie est simplifiée et arrondie. Un point posé sur la frontière peut changer de côté à cause de
quelques mètres de simplification. **Pour une condition non négociable, une zone grise assumée vaut mieux
qu'une incompatibilité décidée par une erreur d'arrondi.**

```
point clairement à l'intérieur                        → satisfied
point clairement à l'extérieur                        → incompatible
point dans la bande de tolérance autour de la frontière → unexamined(insufficient_precision)
```

La bande est dérivée de `simplificationToleranceMeters` de l'artefact, jamais d'une constante posée à la
main ailleurs.

Les tests du prédicat géométrique couvrent : `Polygon`, `MultiPolygon`, polygone à trous, point
intérieur, point extérieur, point exactement sur la frontière, point dans la bande de tolérance,
géométrie vide, géométrie invalide.

### 5.7 Read repair, et l'invalidation des références périmées

`resolved` présent **ne suffit pas** à décider de ne rien refaire : une résolution se périme quand le
label change, quand le contexte territorial change, quand le résolveur change de version, ou quand la
normalisation change. D'où `inputHash`.

```
projet chargé
  → référence présente ET inputHash inchangé ET resolverVersion compatible : aucune résolution
  → sinon : une tentative avec le résolveur courant
      → résultat fiable      : persistance immédiate
      → ambigu / non résolu  : cet état est persisté tel quel (c'est une information, pas un échec)
      → routing_unavailable  : rien n'est persisté, on retentera
```

**Ni le comparateur ni le dossier ne déclenchent ce rattrapage.** L'hydratation se fait **au-dessus**
d'eux, une fois, et leur passe un projet déjà résolu.

---

## 6. A3 / A4 — Les deux adaptateurs

### 6.1 Le comparateur cesse de rendre un booléen

`passesHard` disparaît au profit d'un résultat qui sait dire ce qu'il n'a pas su faire :

```ts
export type HardFilterResult = {
  eligible: boolean;    // aucune incompatibilité, aucune donnée communale manquante
  complete: boolean;    // toutes les contraintes déclarées ont pu être APPLIQUÉES
  satisfied: HardConstraintAssessment[];
  incompatible: HardConstraintAssessment[];
  unapplied: HardConstraintAssessment[];
};
```

| Canonique | Comparateur |
|---|---|
| `satisfied` | laisse passer |
| `incompatible` | **exclut** la commune |
| `unexamined(missing_data)` | **exclut** la commune (doctrine prudente actuelle, préservée : relief, altitude, population absents) |
| `unexamined(unresolved \| ambiguous \| missing_parameter \| unsupported_metric \| insufficient_precision \| routing_unavailable)` | **ne filtre pas**, et marque `complete: false` |
| `not_declared` | ignorée |

**Pourquoi une référence non résolue ne filtre pas** : elle est **globale**, pas communale. Exclure sur
cette base exclurait *toutes* les communes, et le lecteur recevrait zéro résultat sans comprendre
pourquoi. `POP_FLOOR` (le plancher anti-hameaux) reste dans le comparateur : c'est sa doctrine de
recherche, pas une contrainte du lecteur. Les `SearchExplorationHint` (§4.5) peuvent cadrer ou classer
les candidats, **jamais les éliminer**.

**`complete: false` interdit une phrase.** Le comparateur n'a plus le droit d'écrire « ces communes
respectent toutes vos conditions non négociables ». Il écrit :

> Une condition non négociable n'a pas pu être appliquée à ces résultats : la proximité de la gare
> Matabiau.

La surface d'affichage existe déjà (`MatchOutcome.appliedPlaces` / `appliedZones` / `message`).

### 6.2 Le dossier

| Canonique | Dossier |
|---|---|
| `not_declared` | `not_applicable` |
| `satisfied` | `satisfied` (favorable, silencieux, **la couverture monte**) |
| `incompatible` | `incompatible` + `IncompatibilityFact` (topic, tier `decision_critical`, evidence) |
| `unexamined(*)` | `uncertain` (le critère reste **non examiné**, **le couperet mord**) |

Une règle par clé, produite par une fabrique au-dessus du même évaluateur. **Les trois règles existantes
qui portent une contrainte dure** (`ruleMer`, `ruleTaille`, `ruleDepartement`) sont **remplacées** par
les règles issues de la fabrique. Les trois règles de préférence de `materiality-rules.ts`
(`ruleCompromis`, `ruleConfort`, `ruleInondation`) et les règles Logement sont **inchangées**.

### 6.3 `ModuleFacts` porte les attributs

`ModuleFacts` gagne `dept`, `lat`, `lon`, `uu`, `tailleVille`, `reliefProximite` : il devient un
sur-ensemble de `CommuneAttributes` (les noms existants coïncident déjà). Les règles existantes compilent
sans être touchées. `mapCommuneToModuleFacts` mappe les nouveaux champs ; `tailleVille` est résolue côté
`territory-facts.ts` (l'index des unités urbaines vit dans `comparateur-vie`).

### 6.4 L'invariant de parité, testé dans les deux sens

> **À projet, attributs, références et POINT D'ÉVALUATION identiques, le comparateur et le dossier
> produisent le même statut canonique.**

Le point d'évaluation est dans l'énoncé, et il n'est pas un détail : une commune peut légitimement passer
au comparateur avec son centroïde et échouer ensuite pour une adresse située à son extrémité. Ce n'est
pas une divergence de moteur, c'est un **changement de grain**.

| Canonique | Comparateur | Dossier |
|---|---|---|
| `satisfied` | la contrainte laisse passer | `satisfied` |
| `incompatible` | la commune est exclue | `incompatible` |
| `unexamined` | politique propre à l'adaptateur (divergence **assumée et documentée**) | `uncertain` |
| `not_declared` | ignorée | `not_applicable` |

Les tests vérifient les **deux premières lignes dans les deux directions** :

- une commune exclue par le filtre ne peut jamais être `satisfied` dans le dossier sur cette contrainte ;
- une commune retenue par le filtre ne peut jamais être `incompatible` dans le dossier sur cette
  contrainte.

Sur un corpus figé de communes (une par cas : littorale, montagnarde, dans une unité urbaine, isolée,
sans relief, sans population) croisé avec un jeu de projets couvrant les 11 clés.

**Non-régression du filtre** : l'ancien `passesHard` et le nouvel adaptateur rendent le même verdict
d'éligibilité sur ce corpus, **sauf** sur les cas où l'ancien comportement était le défaut corrigé
(référence non résolue silencieusement ignorée, seuil inventé appliqué comme un filtre). Ces écarts sont
**énumérés** dans le test.

---

## 7. Ce que ça change à l'écran, et qu'il faut aller voir

1. **Des contraintes disparaissent du bloc « non examiné ».** Un lecteur qui déclarait « en Bretagne, à
   la montagne, pas au bord de la mer » voyait trois conditions annoncées comme non examinées.
2. **Des incompatibilités deviennent visibles.** Des communes qui passaient pour compatibles vont
   afficher une carte « Vos contraintes non négociables ».
3. **`communeSize` change de doctrine dans le dossier.** Des dossiers qui disaient « taille respectée »
   diront que **l'agglomération** dépasse la taille posée. Le texte parle alors d'agglomération, jamais
   de population communale : la promesse faite au lecteur doit correspondre à la donnée réellement
   évaluée. La clé technique reste `communeSize` par compatibilité.
4. **Le comparateur annonce ce qu'il n'a pas pu appliquer**, au lieu de le taire.
5. **La couverture `high` devient atteignable** pour la première fois sur des projets réels, donc les
   branches positives du verdict (« Bonne correspondance », « Correspondance favorable ») vont
   s'afficher. **Elles n'ont jamais été vues ailleurs que dans une table de vérité.** Les vérifier à
   l'écran fait partie de ce chantier.

**Les artefacts de conclusion déjà persistés changent** (le plan narratif change, donc son hash). Le
prompt ne change pas : **pas de bump de `DECISION_NARRATIVE_PROMPT_VERSION`**. Vérifier que
`conclusion-hash.ts` invalide bien les artefacts quand les faits changent, sinon d'anciennes conclusions
seraient resservies sur un dossier qui ne dit plus la même chose.

---

## 8. Découpage d'implémentation

- **A0** : le schéma. `PlaceThreshold` + provenance, `PRODUCT_CONVENTIONS` (+ version), `ConstraintValue`,
  `EvaluationPoint`, `EvaluationContext`, `NormalizedHardConstraints`. Aucun évaluateur.
- **A1** : `src/lib/hard-constraints.ts`. Types d'évaluation, registre exhaustif typé par la clé, et les
  8 évaluateurs **sans référence nommée** (`departements`, `zones`, `excludeZones`, `montagne`,
  `reliefProche`, `nearSea`, `excludeSea`, `communeSize`) + tests unitaires purs.
- **A2** : les 3 références résolues, le résolveur et ses contrôles, `inputHash` / `resolverVersion`,
  l'isochrone IGN, la table `reachability_artifact`, le prédicat point-dans-polygone et sa bande de
  tolérance, l'hydratation / read repair, l'ambiguïté au parse. Les 3 évaluateurs à référence nommée
  (`nearPlace`, `excludePlace`, `sizeRelativeTo`).
- **A3** : l'adaptateur comparateur (`HardFilterResult`), les `SearchExplorationHint`, l'annonce
  « condition non appliquée ».
- **A4** : l'adaptateur dossier (fabrique de règles), `ModuleFacts` enrichi, les tests de parité, la
  vérification à l'écran des branches nouvellement atteignables.

## 9. Critères d'acceptation

1. Les 11 clés ont un évaluateur ; en ajouter une sans évaluateur **casse le typecheck**, et un
   évaluateur ne peut pas rendre la clé d'un autre.
2. Aucun évaluateur n'emploie `?? 0` ni de test de vérité implicite sur une donnée nullable.
3. Une référence non résolue **ne filtre pas** dans le comparateur, **est annoncée** au lecteur, et laisse
   `complete: false`.
4. Une référence non résolue rend `uncertain` dans le dossier : le critère reste non examiné et la
   couverture ne peut pas être `high`.
5. Un seuil `travel_time` n'est **jamais** évalué par un haversine.
6. Un rayon `legacy_default` (50 / 30 km) ne produit **jamais** `satisfied` ni `incompatible`, et ne
   filtre **jamais** : il ne peut qu'explorer.
7. Une résolution dont l'`inputHash` a changé est **refaite**, jamais resservie.
8. Un point dans la bande de tolérance d'une isochrone rend `insufficient_precision`, jamais
   `incompatible`.
9. Les tests de parité passent dans les deux directions sur le corpus, à point d'évaluation identique.
10. `node --test src/lib/decision/*.test.ts src/lib/*.test.ts` vert, `npx tsc --noEmit` rend 0.
11. Les branches positives du verdict ont été vues **à l'écran**, sur un projet réel.

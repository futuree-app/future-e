# Contraintes dures : des évaluations canoniques, partagées et opposables (chantier A)

**Date** : 2026-07-14 · **Statut** : spec validée (porteur) · **Prérequis** : slices 1 → 2.1 du dossier
de décision livrées et mergées (`1d986f4`).

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
`maxKm` numérique et rend `null`, donc `ruleMer` rend `not_applicable` (« nearSea non déclaré ») alors
que le lecteur l'a bel et bien déclarée. Le critère reste non examiné dans le dossier, et il filtre à un
rayon choisi par le produit dans le comparateur.

Trois seuils inventés en silence, donc : 30 km pour la mer, 50 km pour un lieu nommé
(`matchProjects:2593`), et la mutation de `communeSize` par `sizeRelativeTo`. Aucun n'est opposable au
lecteur, et aucun n'apparaît nulle part à l'écran.

### 1.4 Le filtre exclut sur donnée manquante, et le dossier ne peut pas s'en contenter

`passesHard` écrit `(c.relief_proximite ?? 0) < RELIEF_PROCHE_HARD`, exclut les communes sans altitude
(`montagnosite` rend `null`) et celles sans population (`POP_FLOOR`). Pour un filtre, c'est une doctrine
prudente légitime : dans le doute, ne pas proposer. Pour un dossier, écrire « votre exigence de relief
n'est pas respectée » quand la donnée est absente serait un mensonge d'un autre ordre.

Même observation, deux conduites à tenir. C'est exactement ce qu'un booléen ne sait pas porter.

---

## 2. Ce que ce chantier établit

Une **évaluation canonique** par contrainte dure, calculée une seule fois, consommée par les deux
moteurs. Le comparateur en dérive son filtre, le dossier en dérive ses faits, le registre des critères
en dérive sa couverture. Les trois lisent le même verdict sur le même territoire.

Une **référence résolue et persistée** : « la gare Matabiau » devient un point, avec sa source, sa
confiance et la version du résolveur qui l'a produite, écrit dans le projet. Les moteurs ne résolvent
plus jamais une chaîne libre chacun de leur côté.

Une **distinction opposable entre « satisfaite » et « non appliquée »**. Le comparateur peut afficher
des résultats en disant qu'une condition n'a pas pu être appliquée. Il n'a plus le droit de faire passer
l'une pour l'autre.

**Ce que ce chantier ne fait pas** : aucun changement du prompt de conclusion, aucun bump de
`DECISION_NARRATIVE_PROMPT_VERSION`, aucun nouveau rôle de fait, aucun nouvel outcome de règle. La
grammaire narrative reste celle de la slice 2.1.

---

## 3. A1 — Le contrat canonique

Nouvelle lib **pure** : `src/lib/hard-constraints.ts`. Ni `server-only`, ni réseau, ni chargement
d'index, donc testable sous `node --test` (cf. le piège `server-only` du handoff).

### 3.1 Les attributs de la commune

Un sac étroit, mappé une fois depuis `IndexCommune` (comparateur) ou depuis `ModuleFacts` (dossier).

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
distance à la côte de 0, un relief de 0 sont des observations valides. `?? 0` sur une donnée absente est
la faute que `passesHard` commet aujourd'hui sur `relief_proximite`, et elle est interdite ici.

**Doctrine de `tailleVille`**, gravée dans le type :

```
commune appartenant à une unité urbaine  → population de l'unité urbaine
commune hors unité urbaine               → population communale (elle est son propre bassin)
```

Une commune isolée a donc une `tailleVille`, et elle ne devient jamais `unexamined` pour cette raison.

### 3.2 L'évaluation

```ts
export type UnexaminedReason =
  | "missing_data"           // la donnée de CETTE commune manque (relief, altitude, population)
  | "unresolved_reference"   // le lieu nommé n'a pas pu être identifié
  | "ambiguous_reference"    // plusieurs lieux correspondent au nom
  | "missing_parameter"      // le lieu est identifié, un paramètre d'évaluation manque (le mode)
  | "unsupported_metric"     // la métrique demandée n'est pas calculable honnêtement aujourd'hui
  | "routing_unavailable";   // échec TECHNIQUE, temporaire, à retenter. Jamais persisté comme un refus.

export type HardConstraintAssessment =
  | { key: HardConstraintKey; status: "not_declared" }
  | { key; status: "satisfied";    observed: string; expected: string; evidenceKeys: string[] }
  | { key; status: "incompatible"; observed: string; expected: string; evidenceKeys: string[];
      statement: string; topic: string }
  | { key; status: "unexamined";   reason: UnexaminedReason; detail?: string };
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
peut les utiliser pour ses propres explications de périmètre. **`EvidenceRef`, `materialityTier` et
`factId` restent hors du noyau.**

### 3.3 Le registre exhaustif

```ts
const HARD_CONSTRAINT_EVALUATORS: {
  [K in HardConstraintKey]: (ctx: EvaluationContext, commune: CommuneAttributes) => HardConstraintAssessment;
} = { departements, zones, excludeZones, montagne, reliefProche, nearSea, excludeSea,
      nearPlace, communeSize, excludePlace, sizeRelativeTo };
```

Un `Record` **exhaustif sur `HardConstraintKey`** : ajouter une clé sans écrire son évaluateur devient
une erreur TypeScript, plus un trou de couverture silencieux découvert six mois plus tard à l'écran.

### 3.4 Inventaire des 11 contraintes

| Clé | Donnée | Logique (`passesHard` aujourd'hui) | Résolution nécessaire | `unexamined` si |
|---|---|---|---|---|
| `departements` | `dept` | `includes(dept)` | aucune | `dept` absent |
| `zones` (hard) | `dept` + `ZONE_TABLE` | `zoneDepts.has(dept)` | `resolveZoneAnchors` (pur, `geo-zones.ts`) | `dept` absent |
| `excludeZones` | `dept` | `excludeDepts.has(dept)` | `resolveExclusions` (pur) | `dept` absent |
| `montagne` (hard) | `altitude` | `montagnosite ≥ 50` (≈ 600 m) | aucune | altitude absente |
| `reliefProche` (hard) | `reliefProximite` | `≥ 50` | aucune | **relief absent** (aujourd'hui `?? 0`, donc exclusion) |
| `nearSea` | `distanceCoteKm` | `≤ maxKm` (**défaut 30, silencieux**) | aucune | distance absente, **ou seuil non confirmé** |
| `excludeSea` | `distanceCoteKm` | `≥ 15 km` | aucune | distance absente |
| `communeSize` | **`tailleVille`** | bornes min/max | aucune | `tailleVille` absente |
| `nearPlace` | `lat`/`lon` | haversine `> maxKm` (défaut **50, silencieux**) | label → point (+ isochrone si temps) | référence ou paramètre manquant |
| `excludePlace` | `uu` / `insee` | `excludeUU.has(uu)` | label → unité urbaine (+ table PLM) | référence non résolue |
| `sizeRelativeTo` | `tailleVille` | **replié dans `communeSize`** (mutation de `hc`) | label → population d'UU de référence | référence non résolue |

---

## 4. A2 — La référence résolue, et l'artefact d'atteignabilité

### 4.1 Deux artefacts distincts

La gare Matabiau et le polygone « 30 minutes en voiture » ne sont pas le même objet. La référence dépend
du libellé, du contexte territorial et du résolveur. L'atteignabilité dépend de la référence, du seuil,
du mode, du sens du trajet, du moteur de routage et de la simplification de la géométrie. Si le lecteur
passe de 30 à 20 minutes, la gare n'a pas bougé : seul l'artefact de mobilité se recalcule.

Ils portent donc **deux versions séparées**. Une évolution de la BAN n'invalide pas une géométrie ; une
évolution du routage n'oblige pas à ré-identifier le lieu.

```ts
export type PlaceThreshold =
  | { metric: "distance"; maxKm: number; source: "user" | "legacy_default"; confirmedByUser: boolean }
  | { metric: "travel_time"; maxMinutes: number; mode: "car" | "walk" | "bike" | null;
      direction: "to_reference"; source: "user"; confirmedByUser: boolean };

export type ResolvedPlaceReference =
  | { status: "resolved"; originalLabel: string; canonicalLabel: string;
      kind: "commune" | "station" | "address" | "poi";
      lat: number; lon: number;
      source: "commune_index" | "ban"; sourceId: string | null;
      confidence: "exact" | "high";
      resolverVersion: string; resolvedAt: string }
  | { status: "ambiguous"; originalLabel: string;
      candidates: { canonicalLabel: string; lat: number; lon: number; kind: string }[];
      resolverVersion: string }
  | { status: "unresolved"; originalLabel: string;
      reason: "no_result" | "low_confidence" | "unsupported_type";
      resolverVersion: string };

export type ReachabilityArtifact = {
  requestHash: string;          // (referenceId, metric, maxMinutes, mode, direction, engineVersion)
  referenceId: string;          // lie l'artefact À la référence qui l'a produit
  metric: "travel_time";
  maxMinutes: number;
  mode: "car" | "walk" | "bike";
  direction: "to_reference";
  geometry: GeoJsonPolygon | GeoJsonMultiPolygon;
  geometryHash: string;
  engine: "ign-valhalla";
  engineVersion: string;
  simplificationToleranceMeters: number;
  generatedAt: string;
};
```

### 4.2 Où ils vivent

**Dans le projet persisté**, à côté du label, dans `HardConstraints` :

```ts
nearPlace?: {
  label: string;                       // l'intention brute, jamais écrasée
  maxKm?: number | null;               // legacy, jamais supprimé
  threshold?: PlaceThreshold;
  resolved?: ResolvedPlaceReference;
  reachability?: ReachabilityArtifact; // seulement pour un seuil travel_time
} | null;
```

Idem pour `excludePlace[]` (référence → unité urbaine) et `sizeRelativeTo` (référence → population d'UU).
Tous les champs sont **optionnels** : les projets déjà enregistrés restent lisibles.

**La parité vient de là.** Les deux moteurs ne partagent pas une *fonction* qui pourrait répondre
différemment à deux instants (un succès ici, un timeout là, un géocodeur qui a évolué entre-temps) : ils
consomment **le même objet gelé**, jusqu'à ce qu'une version change.

### 4.3 La chaîne de résolution

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
**désambiguïser**. Il ne sert jamais à forcer un résultat : si deux candidats restent plausibles, la
référence reste `ambiguous`.

### 4.4 Le seuil, et le refus de le deviner

**« 30 minutes de la gare Matabiau » évalué par un haversine est interdit.** Une distance à vol d'oiseau
n'établit pas un temps de trajet.

| Seuil déclaré | Évaluation |
|---|---|
| `distance` + référence résolue | haversine, déterministe, aucune géométrie nécessaire |
| `travel_time` + mode + isochrone disponible | point dans le polygone |
| `travel_time` sans mode | `unexamined(missing_parameter)` |
| `travel_time` en transports collectifs | `unexamined(unsupported_metric)` (voir 4.6) |
| échec du routage | `unexamined(routing_unavailable)`, à retenter, jamais persisté comme refus |

**Le mode absent est un `missing_parameter`, jamais un `ambiguous_reference`** : la gare peut être
parfaitement identifiée, c'est un paramètre d'évaluation qui manque. Le parse émet alors une **ambiguïté**
(`ParsedProject.ambiguities`, le champ existe déjà et c'est exactement sa fonction) :

> Vos 30 minutes de la gare Matabiau : à pied, à vélo, en voiture ?

### 4.5 Les seuils inventés (50 km pour un lieu, 30 km pour la mer)

Aujourd'hui, « près de Brest » sans distance déclenche **50 km, en silence** (`matchProjects:2593`), et
« il nous faut la mer » sans distance déclenche **30 km, en silence** (`passesHard:2168`). Les deux
reçoivent la même doctrine, `nearSea` portant lui aussi un `PlaceThreshold` de métrique `distance`.

**Nouveaux projets** : une condition non négociable ne reçoit pas un seuil inventé par le produit.
Absence de distance → `unexamined(missing_parameter)` + une ambiguïté à résoudre (« quelle distance
maximale retenez-vous ? »). Une fois répondue : `source: "user"`, `confirmedByUser: true`, et la
contrainte devient **opposable**.

**Projets historiques** : le comportement est conservé transitoirement, **avec sa trace** :

```ts
// nearPlace : maxKm 50 · nearSea : maxKm 30
threshold: { metric: "distance", maxKm: 50, source: "legacy_default", confirmedByUser: false }
```

Un seuil `legacy_default` non confirmé **ne peut jamais produire une incompatibilité dans le dossier**
(il rend `unexamined(missing_parameter)`). Il sert au comparateur de rayon exploratoire provisoire,
accompagné de son message de périmètre. Le produit ne dit jamais « votre condition n'est pas respectée »
sur la foi d'un chiffre qu'il a choisi lui-même.

### 4.6 L'isochrone

`https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point={lon},{lat}&costValue={s}&costType=time&profile={car|pedestrian|bike}&direction=arrival`

Sans clé, un appel **par référence et par seuil**, jamais par commune : le polygone est calculé une fois
depuis le lieu, puis les 35 000 communes sont testées localement.

**Le sens du trajet est fixé et il entre dans le `requestHash`.** « Habiter à moins de 30 minutes de la
gare » veut dire *domicile → gare* : `direction: "to_reference"` (donc `direction=arrival` côté IGN). Si
ce sens ne peut pas être calculé honnêtement, l'évaluation reste `unsupported_metric`. Le sens inverse ne
le remplace jamais en silence.

**A se limite aux profils réellement maîtrisés** (voiture, marche, vélo). Les transports collectifs, sans
jour, heure et politique d'attente, produiraient un polygone d'une précision trompeuse :
`unexamined(unsupported_metric)` jusqu'à ce que leur doctrine soit écrite.

### 4.7 Le point réellement testé

Un point-dans-polygone n'est honnête que si le point qui représente la commune est lui-même explicite.

```ts
export type EvaluationPoint = {
  lat: number; lon: number;
  grain: "commune_reference" | "address";
  source: "commune_centroid" | "address_geocoder";
  label: string;
};
```

Les phrases restent **bornées au grain** :

> Le point de référence de {commune} se situe dans l'isochrone de 30 minutes en voiture depuis la gare
> Matabiau.

Ce qui ne dit pas, et ne doit pas laisser entendre, que *toute* la commune y est. Évaluer la géométrie
communale entière (entièrement dedans → `satisfied` ; entièrement dehors → `incompatible` ; intersection
partielle → à qualifier) est la bonne cible ; elle est **hors de ce spec**. Le point de référence suffit
à A, à condition que sa signification soit dite.

Quand une adresse est renseignée, le point évalué est **l'adresse**, et le grain le dit.

### 4.8 Read repair des projets historiques

Un projet chargé sans référence structurée est réparé **une fois, en amont des deux moteurs**, dans une
phase d'hydratation dédiée :

```
projet chargé
  → référence déjà présente : aucune résolution
  → champ absent : une tentative avec le résolveur courant
    → résultat fiable  : persistance immédiate
    → ambigu / non résolu : cet état est persisté tel quel (c'est une information, pas un échec)
    → routing_unavailable : rien n'est persisté, on retentera
```

**Ni le comparateur ni le dossier ne déclenchent ce rattrapage.** L'hydratation se fait au-dessus d'eux,
et leur passe un projet déjà résolu. `resolverVersion` permettra plus tard de ré-examiner volontairement
les vieilles résolutions, sans jamais les modifier en douce à chaque chargement.

---

## 5. A3 / A4 — Les deux adaptateurs

### 5.1 Le comparateur cesse de rendre un booléen

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

La politique de l'adaptateur comparateur :

| Canonique | Comparateur |
|---|---|
| `satisfied` | laisse passer |
| `incompatible` | **exclut** la commune |
| `unexamined(missing_data)` | **exclut** la commune (doctrine prudente actuelle, préservée : relief, altitude, population absents) |
| `unexamined(unresolved_reference \| ambiguous_reference \| missing_parameter \| unsupported_metric \| routing_unavailable)` | **ne filtre pas**, et marque `complete: false` |
| `not_declared` | ignorée |

**Pourquoi une référence non résolue ne filtre pas** : elle est **globale**, pas communale. Exclure sur
cette base exclurait *toutes* les communes, et le lecteur recevrait zéro résultat sans comprendre
pourquoi. `POP_FLOOR` (le plancher anti-hameaux) reste dans le comparateur : c'est sa doctrine de
recherche, pas une contrainte du lecteur.

**`complete: false` interdit une phrase.** Le comparateur n'a plus le droit d'écrire « ces communes
respectent toutes vos conditions non négociables ». Il écrit :

> Une condition non négociable n'a pas pu être appliquée à ces résultats : la proximité de la gare
> Matabiau.

La surface d'affichage existe déjà (`MatchOutcome.appliedPlaces` / `appliedZones` / `message`).

### 5.2 Le dossier

Une règle par clé, produite par une fabrique au-dessus du même évaluateur :

| Canonique | Dossier |
|---|---|
| `not_declared` | `not_applicable` |
| `satisfied` | `satisfied` (favorable, silencieux, **la couverture monte**) |
| `incompatible` | `incompatible` + `IncompatibilityFact` (topic, tier `decision_critical`, evidence) |
| `unexamined(*)` | `uncertain` (le critère reste **non examiné**, **le couperet mord**) |

Les six règles existantes de `materiality-rules.ts` qui portent une contrainte dure (`ruleMer`,
`ruleTaille`, `ruleDepartement`) sont **remplacées** par les règles issues de la fabrique. Les règles de
préférence (`ruleCompromis`, `ruleConfort`, `ruleInondation`) sont inchangées.

### 5.3 `ModuleFacts` porte les attributs

`ModuleFacts` gagne `dept`, `lat`, `lon`, `uu`, `tailleVille`, `reliefProximite` : il devient un
sur-ensemble de `CommuneAttributes` (les noms existants coïncident déjà). Les règles existantes
compilent sans être touchées. `mapCommuneToModuleFacts` mappe les nouveaux champs, `tailleVille` étant
résolue côté `territory-facts.ts` (l'index des unités urbaines vit dans `comparateur-vie`).

### 5.4 L'invariant de parité, testé dans les deux sens

| Canonique | Comparateur | Dossier |
|---|---|---|
| `satisfied` | la contrainte laisse passer | `satisfied` |
| `incompatible` | la commune est exclue | `incompatible` |
| `unexamined` | politique propre à l'adaptateur (divergence **assumée et documentée**) | `uncertain` |
| `not_declared` | ignorée | `not_applicable` |

Les tests de parité vérifient les **deux premières lignes dans les deux directions** :

- une commune exclue par le filtre ne peut jamais être `satisfied` dans le dossier sur cette contrainte ;
- une commune retenue par le filtre ne peut jamais être `incompatible` dans le dossier sur cette
  contrainte.

Sur un corpus figé de communes (une par cas : littorale, montagnarde, en unité urbaine, isolée, sans
relief) croisé avec un jeu de projets couvrant les 11 clés.

**Non-régression du filtre** : l'ancien `passesHard` et le nouvel adaptateur rendent le même verdict
d'éligibilité sur ce corpus, **sauf** sur les cas où l'ancien comportement était le défaut corrigé
(référence non résolue silencieusement ignorée). Ces écarts sont **énumérés** dans le test.

---

## 6. Ce que ça change à l'écran, et qu'il faut aller voir

Ajouter des règles change le verdict, mécaniquement. Ce chantier en change quatre choses :

1. **Des contraintes disparaissent du bloc « non examiné ».** Un lecteur qui déclarait « en Bretagne, à
   la montagne, pas au bord de la mer » voyait trois conditions annoncées comme non examinées : elles le
   seront.
2. **Des incompatibilités deviennent visibles.** Certaines communes qui passaient pour compatibles vont
   afficher une carte « Vos contraintes non négociables ».
3. **`communeSize` change de doctrine dans le dossier.** Des dossiers qui disaient « taille respectée »
   diront désormais que **l'agglomération** dépasse la taille posée. Le texte doit parler
   d'agglomération, jamais de population communale : la promesse faite au lecteur doit correspondre à la
   donnée réellement évaluée. La clé technique reste `communeSize` par compatibilité.
4. **La couverture `high` devient atteignable** pour la première fois sur des projets réels, donc les
   branches positives du verdict (« Bonne correspondance », « Correspondance favorable ») vont
   s'afficher. **Elles n'ont jamais été vues ailleurs que dans une table de vérité.** Les vérifier à
   l'écran fait partie de ce chantier, ce n'est pas un bonus.

**Les artefacts de conclusion déjà persistés changent** (le plan narratif change, donc son hash). Le
prompt, lui, ne change pas : **pas de bump de `DECISION_NARRATIVE_PROMPT_VERSION`**. Vérifier que
`conclusion-hash.ts` invalide bien les artefacts quand les faits changent (sinon d'anciennes conclusions
seraient resservies sur un dossier qui ne dit plus la même chose).

---

## 7. Découpage d'implémentation

- **A1** : `src/lib/hard-constraints.ts` (types, registre exhaustif, les 8 évaluateurs sans référence
  nommée : `departements`, `zones`, `excludeZones`, `montagne`, `reliefProche`, `nearSea`, `excludeSea`,
  `communeSize`) + tests unitaires purs.
- **A2** : `PlaceThreshold`, `ResolvedPlaceReference`, `ReachabilityArtifact`, le résolveur et ses
  contrôles, l'isochrone IGN et son cache, l'hydratation / read repair, l'ambiguïté au parse. Les 3
  évaluateurs à référence nommée (`nearPlace`, `excludePlace`, `sizeRelativeTo`).
- **A3** : l'adaptateur comparateur (`HardFilterResult`), l'annonce « condition non appliquée ».
- **A4** : l'adaptateur dossier (fabrique de règles), `ModuleFacts` enrichi, les tests de parité, la
  vérification à l'écran des branches nouvellement atteignables.

## 8. Critères d'acceptation

1. Les 11 clés ont un évaluateur ; en ajouter une sans évaluateur **casse le typecheck**.
2. Aucun évaluateur n'emploie `?? 0` ni de test de vérité implicite sur une donnée nullable.
3. Une référence non résolue **ne filtre pas** dans le comparateur, **est annoncée** au lecteur, et laisse
   `complete: false`.
4. Une référence non résolue rend `uncertain` dans le dossier : le critère reste non examiné et la
   couverture ne peut pas être `high`.
5. Un seuil `travel_time` n'est jamais évalué par un haversine.
6. Un seuil `legacy_default` non confirmé ne produit **jamais** d'incompatibilité dans le dossier.
7. Les tests de parité passent dans les deux directions sur le corpus.
8. `node --test src/lib/decision/*.test.ts src/lib/*.test.ts` vert, `npx tsc --noEmit` rend 0.
9. Les branches positives du verdict ont été vues **à l'écran**, sur un projet réel.

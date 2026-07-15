# `mismatch` lot 2a : les absences attestées (chantier B, suite)

**Date** : 2026-07-15 · **Statut** : spec validée (porteur, 2 tours de brainstorm) · **Prérequis** : mismatch v1
(`relative_position`, 10 critères, couverture 9 → 19) livré et poussé sur `main`.

**Ce lot livre une DEUXIÈME forme de fondement pour le rôle `mismatch` : `named_absence`.** Un lieu peut
répondre mal à une priorité déclarée parce qu'un élément recherché **n'existe tout simplement pas** à portée,
et que futur•e peut le **prouver**. Deux critères : `mobilite_quotidienne` et `vie_etudiante`. Couverture :
**19 → 21 sur 28.**

La mesure physique (`proximite_mer`), la catégorie d'agglomération (préférences de taille) et l'extension
`relative_position` d'`acces_services` sont explicitement hors de ce lot (§11).

---

## 1. Le problème, et pourquoi la v1 ne suffit pas

La v1 dit une **position relative** : « parmi les 20 % de communes les moins favorables de France ». Elle
suppose une distribution saine (un percentile a un sens). Cinq critères en sont exclus parce que leur
distribution est **dégénérée** : une masse de communes partagent la même valeur de plancher, et « parmi les
20 % les moins favorables » y serait faux (l'intervalle d'ex æquo traverse tout le bas du classement).

Deux d'entre eux ont une propriété commune : **leur plancher est une absence réelle et nommable.**

- `mobilite_quotidienne` : **82,8 %** des communes n'ont **aucune** desserte de transports en commun jugée
  crédible pour le quotidien à portée de marche (sous le plancher de crédibilité, cf. `populate-reseau-local`).
- `vie_etudiante` : **40,4 %** des communes n'ont **aucun** établissement d'enseignement supérieur (BPE C5xx)
  dans le rayon de proximité retenu.

Pour ces critères, le rang de position n'apprend rien, mais un **fait absolu** parle. Aujourd'hui, un lecteur
qui a pesé « me déplacer sans voiture » à 3 sur une commune sans réseau lit « critère non examiné » : la
donnée est là, complète, et elle atteste une absence. C'est le trou que ce lot ferme.

## 2. Le principe fondateur : une absence n'est opposable que si la recherche est prouvée

> **Une absence ne devient un fait opposable que lorsque futur•e peut aussi prouver que la recherche a
> réellement été effectuée sur tout le territoire.** Sans cette preuve, « aucun réseau à portée » n'est pas un
> constat, c'est un silence déguisé en constat.

C'est la même exigence que le chantier A a imposée en tuant les replis `?? 0` / `?? 100` : une donnée absente
ne doit jamais se transformer en verdict défavorable. Ici, `reseauLocal.acces == null` a **deux origines**
qu'il faut séparer avant de pouvoir affirmer quoi que ce soit :

```
mesure réussie, résultat sous le plancher de crédibilité   -> ABSENCE ATTESTÉE  -> mismatch
tuile OSM non traitée / erreur technique / commune non lue  -> DONNÉE INDISPONIBLE -> uncertain
```

Tant que les deux deviennent le même `null`, la phrase d'absence est potentiellement fausse. Le lot ne peut
donc pas se contenter de lire l'index actuel : il doit **transporter le statut de calcul en amont**, dans une
attestation positive et versionnée, pour **chaque** commune.

## 3. Les deux attestations, et leur sémantique exacte

Les deux producteurs de données mesurent **toutes** les communes géolocalisées (34 788) et écrivent déjà un
cache de sortie complet. On s'appuie sur ces caches, sans aucune requête OSM/BPE supplémentaire.

### 3.1 Réseau du quotidien (`communes-reseau-local.json`)

`populate-reseau-local` calcule, pour chaque commune, un accès pondéré aux arrêts TC dans 1000 m × facteur de
mode. Sous le plancher `ACCESS_FLOOR = 1.0`, le résultat est `null` (« pas un réseau du quotidien crédible »).
Le cache porte les 34 788 communes : `null` (sous plancher) ou `{acces, tram, metro, arret_km}` (desservie).

**On ne déforme pas la donnée historique pour y encoder son statut de mesure.** `reseauLocal` reste EXACTEMENT
ce qu'il est (le résultat du scoring : `null` sous plancher, objet `{acces, tram, metro, arret_km}` desservie).
On ajoute un **champ frère** de provenance, `reseauLocalMeasured: boolean`, qui répond à la seule question
nouvelle : *« le calcul réseau a-t-il réellement été exécuté pour cette commune ? »*

```
reseauLocal INCHANGÉ         : null (sous plancher) | { acces, tram, metro, arret_km } (desservie)
reseauLocalMeasured = true   : commune effectivement mesurée
absent / false               : aucune attestation de mesure -> jamais d'absence déduite
```

Le dossier lit : `reseauLocalMeasured && reseauLocal == null` → **absence attestée** ; `reseauLocalMeasured &&
reseauLocal != null` → **présent** ; sinon → **non mesuré** (uncertain).

**Bénéfice décisif** : `subScore`, `buildTerritorySignals`, `deriveCategories` et les labels distinctifs
restent INCHANGÉS (le sous-plancher reste `null`, donc `if (c.reseauLocal)` reste falsy exactement comme
aujourd'hui). Aucun collatéral dans le module `server-only` `comparateur-vie.ts`, et les tests du lot restent
PURS (rien à importer en valeur depuis `comparateur-vie`). C'est la symétrie de `etudesSup` (§3.2), qui est
lui aussi un champ frère.

### 3.2 Enseignement supérieur (`communes-bpe.json`)

`populate-bpe` compte les équipements C5xx dans un rayon **adaptatif** à la taille d'agglomération
(`5 / 10 / 15 / 25 km`). Le cache porte `etudes_acces: { score, count }` pour les 34 788 communes, où **`count`
est un ACCÈS PONDÉRÉ** (`somme des 1 - d/DMAX`, `DMAX = 25 km` fixe), **PAS un nombre d'établissements**. On ne
le renomme donc jamais « count » dans le dossier : c'est un `weightedAccess`.

**L'équivalence de l'absence, et son cas-frontière.** `weightedAccess == 0` signifie « aucun établissement
du supérieur retenu dans le rayon », à une réserve près : le poids `1 - d/DMAX` s'annule à `d = DMAX = 25 km`.
Pour une commune **non rurale** (rayon 5/10/15 < 25), tout établissement dans le rayon a `d < 25` donc un poids
`> 0` : `weightedAccess == 0` ⟺ **zéro établissement** (équivalence exacte). Pour une commune **rurale**
(rayon = 25 = DMAX), un établissement à **exactement 25,000 km** compterait dans la fenêtre en contribuant `0`
: l'égalité flottante `d == 25.0` est de **mesure nulle**, mais l'équivalence n'y est pas strictement airtight.

**La correction, sans re-run coûteux.** Le producteur calcule déjà `int(win.sum())` = le VRAI compte
d'établissements dans le rayon. On le porte en **préventif** (`establishmentCount`), et le dossier le **préfère
quand il est présent** (airtight) ; sinon il retombe sur `weightedAccess == 0` (le cas-frontière rural, de
mesure nulle, est accepté et documenté). Le cache actuel n'ayant que `weightedAccess`, ce lot fonctionne
dessus ; un futur rebuild rendra `establishmentCount` disponible.

**Attestation cible dans l'index** (le champ `etudes_acces` score est CONSERVÉ ; on AJOUTE un champ frère) :

```
etudesSup = { measured: true, weightedAccess: <float>, radiusKm: <5|10|15|25>, establishmentCount?: <entier|absent> }
```

La convention (`conventionId`) n'est PAS répétée par commune (34 788 fois) : elle est commune à tout
l'artefact et vit dans `index.meta` (§8). Une commune non mesurée n'a pas de champ `etudesSup`.

`radiusKm` est déterministe (`radius_for(tailleVille)`), mais **recomputé côté patch** : sa parité avec le
producteur Python (mêmes seuils `30k/100k/500k`, même `taille_ville = uupop[uu] sinon population`) est
**prouvée par un test aux points de rupture** (une fonction en escalier est fixée par ses seuils). La carte ne
cite le rayon qu'à cette condition.

## 4. Le fondement en union discriminée : `named_absence`

Le `basis` de `MismatchFact` (aujourd'hui un objet `relative_position` unique) devient une **union
discriminée**. Le rôle reste `mismatch` unique ; c'est le **fondement** qui gagne une variante.

```ts
type NamedAbsenceBasis = {
  kind: "named_absence";
  observedStateId:
    | "network_below_daily_credibility_floor"
    | "no_higher_education_establishment_in_radius";
  conventionId: string;       // LA DOCTRINE du plancher, ex "daily-transit-access-v1",
                              //   "higher-education-radius-adaptive-v1"
  nationalContext: {          // un RÉSULTAT de distribution DATÉ, dissocié de la convention
    prevalence: number;       // part des communes dans cet état (0..1)
    validCount: number;       // communes effectivement mesurées
    totalCount: number;       // communes de l'univers
    universe: "communes_france";
    distributionVersion: string;  // ex "absence-dist-2026-07-15"
  } | null;
};

type RelativePositionBasis = {  // la v1, adaptée à la forme union (kind ajouté)
  kind: "relative_position";
  rankLow: number; rankHigh: number;
  universe: "communes_france";
  distributionVersion: string;
};

// L'UNION ACTIVE ne porte QUE les fondements que le moteur sait produire aujourd'hui.
type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis;

// LES ATTESTATIONS (domaine, portées par ModuleFacts). Union DISCRIMINÉE sur `measured` : la branche
// `measured: false` n'a AUCUN champ de mesure, il est donc impossible par TYPE de lire un weightedAccess sur
// une donnée non mesurée (elle interdit aussi un état incohérent comme `{ measured: false, access: 72 }`). Le
// mapping pré-patch (marqueur absent) rend `measured: false`.
type LocalNetworkAttestation =
  | { measured: true; access: number | null }   // null = sous plancher ; [1,100] = desservie
  | { measured: false; access: null };
type HigherEdAttestation =
  | { measured: true; weightedAccess: number; radiusKm: number; establishmentCount: number | null }
  | { measured: false };
```

**`nationalContext` est dissocié de `conventionId`** : la prévalence (« ~83 % des communes ») n'est pas une
règle, c'est une mesure datée de la distribution ; elle bouge avec les données (millésime BPE/OSM), pas avec
la doctrine du plancher. Une évolution du plancher change `conventionId` ; une MAJ des données change
`distributionVersion`.

**On ne déclare PAS les variantes du lot 3 dans l'union de production.** `AbsoluteMeasureBasis` (mer) et
`CategoricalStateBasis` (taille) sont **figés dans cette spec** (§11) mais absents du type TypeScript tant que
le moteur ne les produit pas : une variante inerte forcerait tous les consommateurs exhaustifs à traiter un
état impossible (branche morte ou erreur artificielle). L'union grandit quand une forme devient réelle.

## 5. La doctrine asymétrique : une absence-critère est une pénalité, jamais une force

Ces règles répondent à **une seule** question : *le minimum recherché existe-t-il ?* Elles ne savent PAS
répondre à *est-ce une qualité particulièrement forte de cette commune ?* Une ligne de bus ne garantit pas une
bonne mobilité ; un établissement du supérieur proche ne garantit pas une vie étudiante riche. La présence
**ferme le motif de pénalité, sans créer artificiellement une force.**

| Donnée | outcome | carte |
|---|---|---|
| préférence absente | `not_applicable` | aucune |
| déclarée + mesure indisponible | `uncertain` | aucune, **couverture NON acquise** |
| déclarée + **absence attestée** | `mismatch` | visible (poids 2-3), silencieuse (poids 1) |
| déclarée + **élément présent** | `neutral` | silencieuse, **couverture acquise** |

**Pas de `satisfied`.** Il exigerait une convention de « présence suffisamment forte » (ex : `acces >= seuil`,
ou métro/tram présent) qui réintroduit un seuil inventé, exactement ce que ce lot combat. Les signaux
*favorables* restent le domaine des 10 critères à distribution saine de la v1. C'est le sens plein de
`neutral` : critère examiné, absence non constatée, mais pas assez d'éléments pour qualifier une
correspondance favorable.

**Gardes de valeurs (une donnée corrompue n'est jamais un verdict).** La classification rend `uncertain`, pas
`neutral`, sur : `access` non fini / négatif / `> 100` ; `weightedAccess` non fini / négatif ; `radiusKm` non
fini / `<= 0` ; `establishmentCount` (si présent) non fini / négatif. Seule une attestation propre produit
`mismatch` ou `neutral`.

## 6. Le poids : la doctrine déjà gravée, inchangée

`named_absence` ne touche pas la matérialité : elle porte sur la **signification de la donnée**, pas sur le
narratif.

```
poids 0 (absente)  -> not_applicable
poids 1 (mineure)  -> mismatch/neutral calculé : couverture acquise, AUCUN fait visible, aucun effet orientation
poids 2            -> mismatch visible, secondary
poids 3            -> mismatch visible, structuring
```

Un ensemble matériel de mismatchs (structurant, ou ≥ 2 secondaires) porte l'orientation à `arbitration`,
exactement comme en v1 : le comptage se fait sur `run.facts` (faits matériels), jamais sur les évaluations.
Aucun changement du registre `criteria-registry`.

## 7. Les formulations : le grain doit être exact

Le `statement` porte l'absence attestée et le lien au projet ; la `limitation` (champ optionnel déjà présent
sur `MismatchFact`) porte la nuance méthodologique. Le grain est **le point de référence retenu** (le
centroïde communal utilisé par les producteurs), jamais « partout dans la commune » : la donnée ne prouve pas
l'absence sur toute la superficie communale.

Contraintes de voix (mémoire) : pas de tiret cadratin ; pas d'antithèse « c'est X, pas Y ». **Absence
factuelle autorisée dans le périmètre mesuré, jugement qualitatif absolu interdit** : « aucun établissement
n'est identifié dans ce rayon » est un fait (permis) ; « la vie étudiante est insuffisante » est un jugement
(interdit). L'absence est un fait absolu DANS son périmètre, pas un verdict sur la qualité du territoire.

### Mobilité du quotidien

- **statement** : « Vous avez placé les déplacements du quotidien sans voiture parmi vos priorités. Aucune
  desserte de transports en commun considérée comme praticable au quotidien n'est identifiée à distance de
  marche du point de référence retenu pour {commune}. Cela répond moins bien à cette dimension de votre
  projet, sans rendre {commune} incompatible avec lui. »
- **limitation** : « Une desserte trop faible pour constituer une solution régulière au quotidien n'est pas
  comptée comme accessible. Cette situation concerne environ 83 % des communes françaises. »

### Vie étudiante

- **statement** : « Vous avez placé la présence d'un environnement étudiant parmi vos priorités. Aucun
  établissement d'enseignement supérieur n'est identifié dans un rayon de {radiusKm} km autour du point de
  référence retenu pour {commune}. Cet indicateur répond moins bien à cette dimension de votre projet, sans
  permettre de conclure à l'absence de vie étudiante. »
- **limitation** : « Une commune peut accueillir des étudiants ou bénéficier de l'influence d'un campus voisin
  sans accueillir elle-même d'établissement dans le périmètre mesuré. »

L'établissement du supérieur est utilisé comme **indicateur**, jamais comme définition exhaustive de « la vie
étudiante » : la formulation le dit explicitement.

## 8. L'attestation dans l'index : le patch, la complétude, l'audit

Un script de patch dédié `scripts/populate-absence-attestations.mjs`, sur le patron de
`populate-mismatch-rank` : LIT les deux caches + l'index, VALIDE, écrit ATOMIQUEMENT (tmp → round-trip →
rename), refuse sur anomalie.

**Complétude pour CHAQUE commune, jamais seulement les absences.** Le patch transporte un statut pour les
34 788 communes. Sinon l'absence de marqueur resterait ambiguë entre présence, non-calcul et « commune oubliée
par le patch ».

**Schéma de cache tolérant.** Les caches producteurs gagneront un bloc `meta` (§9) ; un `Object.keys(cache)`
naïf compterait alors `"meta"` comme un faux INSEE. Le patch lit donc `records = cache.communes ?? cache`
(accepte la forme plate actuelle ET la forme `{ meta, communes }` future), et ne fait le set-equality que sur
les codes INSEE.

**Écriture robuste (réutilise le patron du chantier gzip).** Temporaire **unique**
(`${INDEX}.${pid}.${uuid}.tmp`), nettoyage en `finally`, round-trip de relecture avant `rename`, et **garde
clone frais** (`scripts/lib/require-index-worktree.mjs`) pour ne pas rendre un `ENOENT` brut si la copie de
travail manque.

**Refus stricts (exit 1)** :
- les ensembles INSEE ne coïncident pas exactement : `index == cache réseau == cache BPE == 34 788 codes uniques` ;
- doublon, commune manquante, commune supplémentaire ;
- `weightedAccess` négatif ou non fini, `acces` non nul hors `[1,100]` (le `null` sous plancher est valide) ;
- cache dépourvu des données attendues ;
- (si `meta` présent) `complete !== true` ou une liste de tuiles en erreur non vide ;
- **les constantes de prévalence TS divergent du calcul** (voir ci-dessous).

**Rapport explicite** (contrôle visuel avant publication) :

```
34 788 communes jointes
28 803 sous le plancher réseau (82,8 %)   |  5 985 desservies
14 069 sans établissement supérieur (40,4 %)
0 manquante · 0 doublon · 0 cache incomplet
```

**Audit dans `index.meta`, avec NUMÉRATEURS (pas une prévalence arrondie).** `28803 / 34788` est reproductible,
`0.828` ne l'est pas.

```ts
absenceAttestations: {
  version: "absence-attestations-v1";
  distributionVersion: "absence-dist-2026-07-15";
  networkConventionId: "daily-transit-access-v1";           // la convention, une fois pour l'artefact
  higherEdConventionId: "higher-education-radius-adaptive-v1";
  communeCount: 34788;
  network:  { measuredCount: 34788; absentCount: 28803 };
  higherEd: { measuredCount: 34788; absentCount: 14069 };
  networkCacheSha256: string;
  bpeCacheSha256: string;
};
```

**Source unique de la prévalence.** Les constantes `ABSENCE_NATIONAL_CONTEXT` (dans `absence-facts.ts`)
alimentent la carte ; pour éviter deux vérités, le patch **recalcule** la prévalence et **refuse** si elle
diverge des constantes TS au-delà d'une tolérance. Une MAJ des caches force donc à mettre à jour les constantes
(et `ABSENCE_DISTRIBUTION_VERSION`) sous peine de refus : le texte ne peut plus dire « 83 % » quand l'index en
mesure 80 %.

Pipeline : `caches → populate-absence-attestations.mjs → validation stricte → écriture atomique →
npm run index:pack → npm run index:verify` puis commit du `.gz`.

## 9. L'invariant OSM : ce qu'on prouve, et ce qu'on documente

`fetch_tile` **lève `RuntimeError` si tous les miroirs échouent**, et l'exception se propage (non capturée) :
un échec de tuile **interrompt le script**, l'index/cache n'est jamais écrit partiellement. Donc *« le cache
existe et couvre 34 788 communes »* ⟹ *« aucune tuile n'a échoué de façon fatale »*. C'est l'invariant qui
autorise à traiter `null` comme « sous plancher » plutôt que « non lu ».

- **On PROUVE l'invariant au bon niveau** : le test asserte que `load_osm` (l'ORCHESTRATEUR des tuiles, pas
  seulement `fetch_tile`) **propage** l'échec d'une tuile et n'écrit AUCUN cache. Prouver seulement que
  `fetch_tile` lève ne suffirait pas : c'est le niveau qui boucle et écrit qui doit échouer avant publication.
  Complété par le set-equality strict du patch (§8).
- **On DOCUMENTE** le risque résiduel : une tuile terrestre renvoyant HTTP 200 avec `elements: []` (anomalie
  Overpass) serait cachée à vide et lue comme « absence » à tort. Ce risque **préexiste** (il fausse déjà le
  score du comparateur via `?? 0` aujourd'hui) ; il est accepté pour ce lot.
- **Durcissement futur (préventif)** : les producteurs écriront leur cache en `tmp → validation → rename` avec
  un bloc `meta: { complete: true, failedTiles: [], communeCount, builtAt }` ; quand ce bloc est présent, le
  patch refuse sur `complete !== true` ou `failedTiles` non vide. Non re-tourné aujourd'hui (voir §10).

## 10. Les producteurs modifiés, sans re-run (migration reproductible)

Décision « hybride propre » (porteur) : le patch enrichit l'index **maintenant** depuis les caches existants ;
en parallèle, on modifie les producteurs pour qu'un **futur** rebuild conserve directement ces champs, **sans
les relancer aujourd'hui**. Le patch devient une migration reproductible, pas une étape oubliée.

- `populate-reseau-local.py` — `--write-index` laisse `reseauLocal` INCHANGÉ et écrit le champ frère
  `reseauLocalMeasured = true` (commune géolocalisée) / `false` (non géolocalisée) ; le cache gagne le bloc
  `meta` de complétude.
- `populate-bpe.py` — `--write-index` ajoute `etudesSup = { measured: true, weightedAccess, radiusKm,
  establishmentCount }` où `establishmentCount = int(win.sum())` (le VRAI compte, airtight) et `weightedAccess`
  = l'accès pondéré brut (le champ `etudes_acces` score reste inchangé) ; le cache gagne le bloc `meta`.
  **Test d'équivalence côté producteur** : `establishmentCount == 0 ⟺ weightedAccess == 0` sur toutes les
  communes SAUF le cas-frontière rural documenté (§3.2).

**On ne re-tourne pas les producteurs dans ce lot** : re-tourner `populate-bpe` recompute les percentiles
depuis la source BPE et risquerait une dérive silencieuse d'`ecoles`/`culture`/`etudes_acces`. La reproduction
se prouve par le patch (déterministe, depuis les mêmes millésimes) et le set-equality, pas par une
régénération. Le nom du champ `acces` est conservé (pas renommé `access`) pour ne pas toucher `subScore`.

## 11. Périmètre exact

**DANS ce lot** — la forme `named_absence` sur deux critères : `mobilite_quotidienne`, `vie_etudiante`.
Couverture **19 → 21 sur 28**.

**HORS de ce lot (figé ici pour mémoire, implémenté plus tard)** :

- **Lot 2b — extension `relative_position`** : `acces_services` (distribution dégénérée au PLAFOND — 80,3 % au
  score 100 — mais queue défavorable continue : la mécanique v1 s'y applique telle quelle, il suffit de
  l'ajouter à `MISMATCH_RANK_KEYS`). Couverture 21 → 22.
- **Lot 3 — mesure physique** : `proximite_mer`. Fondement `AbsoluteMeasureBasis = { kind: "absolute_measure";
  value: number; unit: "km" | "min"; conventionId: string }`. Exige une convention de distance versionnée
  (ex 10 / 30 / 80 km) : décision produit à calibrer séparément.
- **Lot 3 — catégorie d'agglomération** : `eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`,
  lues depuis `ModuleFacts.tailleVille`. Fondement `CategoricalStateBasis = { kind: "categorical_state";
  observedCategory: string; conventionId: string }`. Trois contrats éditoriaux DISTINCTS (une agglo moyenne
  peut satisfaire `eviter_grandes_villes` sans être favorable à `prefere_grande_ville`) : pas une seule règle
  inversée.
- Restent 2 critères non couverts après le lot 3 (pour atteindre 28), à traiter ultérieurement.
- La fusion de deux mismatchs en compromis narratif, et la séparation `ProjectFit` × `DecisionConfidence`.

## 12. Critères d'acceptation

1. Le `basis` de `MismatchFact` est une union discriminée `NamedAbsenceBasis | RelativePositionBasis` ; la v1
   `relative_position` continue de passer sans régression (mêmes cartes, mêmes rangs).
2. `mobilite_quotidienne` déclarée (poids 2/3), réseau mesuré sous plancher → `mismatch` matériel : carte
   nommant l'absence au **point de référence**, `basis.kind === "named_absence"`,
   `observedStateId === "network_below_daily_credibility_floor"`, jamais un jugement absolu.
3. `vie_etudiante` déclarée, absence attestée (`establishmentCount === 0` si présent, sinon `weightedAccess
   === 0`) → `mismatch` citant le `radiusKm` exact ; jamais « aucune vie étudiante » ; la `limitation` porte la
   nuance campus voisin. Le `radiusKm` recomputé a une **parité prouvée** avec le producteur (test aux points
   de rupture).
4. Réseau/études **présents** → `neutral` silencieux (couverture acquise, aucune carte, aucun effet
   orientation). Jamais `satisfied`.
5. Mesure **indisponible** (`measured: false` / marqueur absent) → `uncertain` : couverture NON acquise,
   aucune valeur inventée. Aucun repli `?? 0` ne traverse le dossier. Une attestation à valeur corrompue
   (`NaN`/négatif/hors bornes/rayon ≤ 0) → `uncertain`, jamais un verdict.
6. Poids 1 → examiné (couverture +1), silencieux (aucune carte, pas d'arbitrage). Poids 2 → secondary, poids 3
   → structuring. Jamais `decision_critical`. Un ensemble matériel → `arbitration` (comptage sur `run.facts`).
   **Un test d'orientation** prouve qu'un mismatch d'absence de poids 1 : monte la couverture, ne crée aucune
   section, ne compte pas comme matériel, ne déclenche pas `arbitration`.
7. `populate-absence-attestations.mjs` : set-equality strict des INSEE (index == réseau == BPE == 34 788
   uniques) sur `records = cache.communes ?? cache` ; refus sur doublon/manquante/supplémentaire/valeur
   invalide / `meta.complete` faux / prévalence TS divergente ; temporaire **unique** + `finally` + garde clone
   frais ; rapport ; `index.meta.absenceAttestations` avec **numérateurs** (`absentCount`/`measuredCount`) +
   sha256 des caches. Le scoring du comparateur (`subScore`) est **inchangé**.
8. Un test au niveau `load_osm` prouve qu'un échec de tuile **propage** et n'écrit aucun cache (pas de cache
   partiel).
9. `DECISION_NARRATIVE_PROMPT_VERSION` bumpée `v7 → v8`, sonde repassée (cas absence attestée : mobilité, vie
   étudiante, + présence → neutral), artefacts invalidés.
10. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` + `node --test scripts/lib/*.test.mjs` verts,
    `npx tsc --noEmit` rend 0, `npm run index:verify` OK, `npm run build` exit 0.

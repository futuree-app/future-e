# `mismatch` lot 3b : la taille d'agglomération, un état catégoriel (chantier B, suite)

**Date** : 2026-07-16 · **Statut** : spec validée (porteur, brainstorm) · **Prérequis** : mismatch v1
(`relative_position`), lot 2a/2b (`named_absence` + extension), lot 3a (`absolute_measure`, mer) livrés et
poussés sur `main`. Couverture actuelle **23 sur 28**.

**Ce lot livre une QUATRIÈME forme de fondement pour le rôle `mismatch` : `categorical_state`.** Un lieu peut
répondre à une priorité déclarée par son **appartenance à une catégorie de taille** (village … métropole), et
la catégorie EST le fait, pas un percentile. Trois critères, **trois contrats éditoriaux distincts** :
`eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`. Couverture : **23 → 26 sur 28.**

---

## 1. Le problème, et pourquoi `categorical_state`

La taille d'agglomération est une **identité** (« c'est un village de 1 200 habitants »), pas une position
relative (« parmi les 20 % les plus petites »). Pour quelqu'un qui veut une grande ville, « parmi les 20 % les
plus petites » apprend moins que « c'est un village ». La catégorie est l'unité honnête. C'est pourquoi la v1
a explicitement exclu les préférences de taille de `relative_position` : elles relèvent d'un **état catégoriel**.

Les contraintes **dures** `communeSize` (fourchette de population) et `sizeRelativeTo` portent déjà la version
**éliminatoire**. Le `mismatch` est la version **non éliminatoire**, sur des clés de préférence **séparées**
(`eviter_grandes_villes`, `prefere_grande_ville`, `eviter_isolement`) : aucun conflit, aucun double comptage.

## 2. Le principe fondateur : deux contrats symétriques, un asymétrique

> **La catégorie de taille mesure DIRECTEMENT ce que cherchent `eviter_grandes_villes` et
> `prefere_grande_ville` (un village EST un environnement de petite taille, une métropole EST une grande
> agglomération) : ces deux règles sont SYMÉTRIQUES. Elle n'est qu'un PROXY FAIBLE de l'isolement : la taille
> établit un risque à l'extrémité basse, jamais l'absence d'isolement. `eviter_isolement` est donc ASYMÉTRIQUE
> et ne produit jamais `satisfied`.**

Un village peut être à dix minutes d'une ville moyenne, bien desservi, riche en services ; une petite
agglomération de 20 000 habitants peut avoir commerces, écoles, soins, gare, tissu associatif. La taille seule
ne permet pas d'affirmer « cette commune ne vous exposera pas à l'isolement » ; elle permet seulement de
signaler l'extrémité basse (le village). C'est la doctrine « décrire jamais juger », et la même exigence que le
chantier A : une donnée ne devient un verdict que là où elle est probante.

Comme au 3a, chaque règle est l'**unique propriétaire décisionnel** de son effet sur l'orientation ; la taille
peut apparaître ailleurs (faits identitaires, ligne distinctive) en **restitution narrative**, sans second
signal.

## 3. La convention `agglomeration-size-v1`, pure, sans réutiliser `tailleLabel`

**On NE réutilise PAS `tailleLabel` de `comparateur-vie.ts`.** Deux raisons décisives :
1. `tailleLabel` mappe `null → "petite"` : un repli métier, exactement le `?? repli` que le chantier A a tué.
   Pour le dossier, `null → uncertain`, jamais une catégorie inventée.
2. `comparateur-vie.ts` fait `import "server-only"` : l'importer dans un test pur rouvre le piège du lot 2a.

D'où une lib **pure** dédiée, avec les **mêmes bornes** (versionnées), parité prouvée par des tests de bornes
(la duplication est délibérée, comme la parité `radiusKm` du 2a) :

**La convention PILOTE le classifieur (revue porteur)** : les seuils ne sont pas répétés dans les `if`, et les
catégories sont une **constante unique** (partagée par le type dérivé ET le validateur), pour interdire toute
dérive.

```ts
// src/lib/decision/agglomeration-facts.ts
export const AGGLOMERATION_CATEGORIES = ["village", "petite", "moyenne", "grande", "metropole"] as const;
export type AgglomerationCategory = (typeof AGGLOMERATION_CATEGORIES)[number];

export const AGGLOMERATION_SIZE_CONVENTION = {
  id: "agglomeration-size-v1",
  thresholds: { villageMaxExclusive: 2_000, petiteMaxExclusive: 25_000, moyenneMaxExclusive: 100_000, grandeMaxExclusive: 500_000 },
} as const;

export function classifyAgglomerationSize(population: number | null): AgglomerationCategory | "uncertain" {
  if (population == null || !Number.isFinite(population) || population < 0) return "uncertain";
  const t = AGGLOMERATION_SIZE_CONVENTION.thresholds;
  if (population < t.villageMaxExclusive) return "village";
  if (population < t.petiteMaxExclusive) return "petite";
  if (population < t.moyenneMaxExclusive) return "moyenne";
  if (population < t.grandeMaxExclusive) return "grande";
  return "metropole";
}
```

Bornes fermées assumées : exactement 500 000 → `metropole` (pas `grande`). Donnée corrompue → `uncertain`.

## 4. Les trois contrats, en table de vérité

| Catégorie | `eviter_grandes_villes` | `prefere_grande_ville` | `eviter_isolement` |
|---|---|---|---|
| village    | satisfied | mismatch  | **mismatch** |
| petite     | satisfied | mismatch  | neutral |
| moyenne    | neutral   | neutral   | neutral |
| grande     | mismatch  | satisfied | neutral |
| métropole  | mismatch  | satisfied | neutral |

- **`eviter_grandes_villes` / `prefere_grande_ville` : symétriques.** Une agglomération de 100 000–500 000
  habitants (« grande ») est **clairement** du côté « grand » de la taxonomie : la rendre neutre pour
  `prefere_grande_ville` reviendrait à la dire « grande » dans Territoire mais pas quand l'utilisateur demande
  une grande ville. La convention ne prétend pas qu'une agglo de 120 000 habitants ressemble à Paris ; elle dit
  qu'elle appartient au côté « grand ».
- **`eviter_isolement` : asymétrique, village SEUL.** `petite` (2 000–25 000) couvre une plage immense : une
  commune de 3 000 habitants peut être collée à une ville importante, une de 20 000 peut être un vrai bourg-
  centre. Rendre toute cette catégorie `mismatch` dirait « toute agglo < 25 000 répond moins bien à votre
  souhait d'éviter l'isolement » : trop fort pour un proxy faible. Le village (< 2 000) reste un signal
  d'extrémité basse prudent mais défendable. **Jamais `satisfied`** (la taille n'établit pas l'absence
  d'isolement).

`uncertain` (population absente/corrompue) sur les trois : couverture NON acquise, aucune catégorie inventée.
Préférence non déclarée → `not_applicable`.

## 5. La provenance de la taille : `tailleVilleSource` (correctness, pas cosmétique)

`tailleVille` vaut la **population de l'unité urbaine** quand la commune en a une, **sinon** sa population
communale (`tailleVilleFrom`). Le mot **« agglomération » n'est légitime que dans le premier cas.** Sans
transporter la provenance, même la catégorie seule introduit une **erreur de grain** (« appartient à une
agglomération » alors que la classification repose sur la seule commune).

On ajoute donc à `ModuleFacts` un champ frère **NON optionnel, nullable** (comme `tailleVille`) :

```ts
tailleVilleSource: "urban_unit" | "commune" | null;
```

**Provenance EXIGÉE, jamais un repli communal silencieux (revue porteur).** Deux règles dures :

1. **`resolveTailleVille` tient l'invariant `value != null ⟺ source != null`.** Un code UU **déclaré mais absent
   ou invalide du cache** est une **anomalie** : `{ value: null, source: null }`, jamais un repli sur la
   population communale. Sinon une défaillance du cache d'unités urbaines deviendrait silencieusement une
   classification communale fausse. (Impact comparateur négligeable : cas d'incohérence de données, déjà mal
   scoré ; `tailleVilleFrom` délègue, donc son comportement d'anomalie devient « null » de façon cohérente.)
2. **`opts.tailleVilleSource` est OBLIGATOIRE au mapping** (pas de `?`, pas de `?? null`) : tout appelant est
   forcé de traiter la provenance. Et la règle **exige** la source : `tailleVille` présent mais
   `tailleVilleSource == null` (anomalie) rend **`uncertain`**, jamais un mismatch fondé sur un repli commune.

**Résolution UNIQUE (revue porteur).** `comparateur-vie.ts` expose `tailleVilleResolvedOf(entry): { value,
source }` ; `tailleVilleOf` et `tailleVilleSourceOf` en délèguent ; `territory-facts.ts` résout **une fois**
et passe les deux à `mapCommuneToModuleFacts`. Zéro divergence possible valeur/source.

```ts
export function resolveTailleVille(uu, population, uuPop): { value: number | null; source: ... | null } {
  if (uu) {
    const p = uuPop.get(uu);
    if (p == null || !Number.isFinite(p) || p < 0) return { value: null, source: null }; // anomalie
    return { value: p, source: "urban_unit" };
  }
  if (population == null || !Number.isFinite(population) || population < 0) return { value: null, source: null };
  return { value: population, source: "commune" };
}
export function tailleVilleFrom(uu, population, uuPop) { return resolveTailleVille(uu, population, uuPop).value; }
```

## 6. Le fondement : `categorical_state`

```ts
export type CategoricalStateBasis = {
  kind: "categorical_state";
  observedCategory: AgglomerationCategory;   // "village" … "metropole" : la catégorie classée, auditable
  conventionId: string;                       // "agglomeration-size-v1"
};
export type MismatchBasis =
  NamedAbsenceBasis | RelativePositionBasis | AbsoluteMeasureBasis | CategoricalStateBasis;
```

Pas de `nationalContext` (comme `absolute_measure` : le fait EST la catégorie). Le **nombre brut et sa
provenance** vivent dans l'`EvidenceRef` (`observedValue`, `grain`), pas dans le `basis`.

**Fait source CANONIQUE unique (revue porteur).** Les trois règles interprètent le **même** état territorial
(`tailleVille` + `tailleVilleSource` → catégorie). Elles partagent donc `sourceFactIds:
["territorySize.classification"]` (et le même `factId` d'`EvidenceRef`) ; seuls `fact.id`, `ruleId`,
`projectKey` diffèrent. Quand un village déclenche à la fois `prefere_grande_ville` et `eviter_isolement`, la
future fusion narrative verra immédiatement deux mismatchs du **même** état, pas deux observations
indépendantes.

`assertFactValid` case `"mismatch"` valide la nouvelle variante : `observedCategory` ∈ `AGGLOMERATION_CATEGORIES`
(constante unique, partagée avec le classifieur et le type), `conventionId` non vide.

## 7. Les formulations : catégorie nommée, provenance honnête, jamais un jugement absolu

Le `statement` nomme la **catégorie** et son effet sur le projet ; la **preuve** porte la population, son
périmètre et sa provenance. Le mot « agglomération » n'apparaît que pour `source === "urban_unit"`. Contraintes
de voix (mémoire) : pas de tiret cadratin ; pas d'antithèse « c'est X, pas Y » ; catégorie factuelle autorisée,
jugement qualitatif absolu (« trop petit », « trop grand ») interdit.

**Un FRAGMENT de phrase complet, dépendant de la source (revue porteur)** : une commune n'« appartient » pas à
une catégorie de taille communale, elle « est classée comme ». D'où `categoryStatementFragment(nom, cat,
source)`, pas un simple `label + clause` recollés :

- source `urban_unit` → « {commune} **appartient à** {libellé UU} selon la population de son unité urbaine et
  la convention de taille utilisée par futur•e » ;
- source `commune` → « {commune} **est classée comme** {libellé communal} selon sa population communale ».

**Libellés** (`labelForCategory(cat, source)`) : « agglomération » ET « métropole » n'apparaissent qu'en source
UU ; en repli commune, libellé neutre.

| Catégorie | source `urban_unit` | source `commune` |
|---|---|---|
| village   | un village | un village |
| petite    | une petite agglomération | une petite commune |
| moyenne   | une ville moyenne | une ville moyenne |
| grande    | une grande agglomération | une grande ville |
| métropole | une métropole | **une très grande ville** |

### `eviter_grandes_villes` (mismatch : grande, métropole) et `prefere_grande_ville` (mismatch : village, petite)

- **statement** : « Vous avez placé {le fait d'éviter les grandes villes | le fait de vivre dans une grande
  ville} parmi vos priorités. {fragment}. Cela répond moins bien à cette dimension de votre projet, sans rendre
  {commune} incompatible avec lui. »
- **topic** : « la taille du territoire » (**neutre** : la conclusion peut le reprendre quelle que soit la
  source).

### `eviter_isolement` (mismatch : village SEUL)

- **statement** : « Vous avez placé le fait d'éviter un environnement isolé parmi vos priorités. {fragment}.
  Cette petite taille répond moins bien à cette dimension de votre projet, sans permettre de conclure à son
  isolement effectif. »
- **limitation** : « La **catégorie de taille utilisée** ne décrit pas à elle seule l'accès aux services, aux
  transports ou aux pôles voisins. Un village peut être bien connecté à une ville proche. »
- **topic** : « l'isolement du territoire ». **Distinct** des deux autres : `eviter_isolement` peut co-occurrer
  avec `eviter_grandes_villes` (la cloche « petit mais pas isolé »), la conclusion doit pouvoir les nommer sans
  les confondre.

**`observedValue` de la preuve** (exemple, source UU) : « une grande agglomération, population de l'unité
urbaine : environ 184 000 habitants » ; **`grain` dépendant de la source (revue porteur)** :
`source === "urban_unit"` → **`"unite_urbaine"`** (nouvelle valeur de l'enum `EvidenceRef.grain`), sinon
`"commune"`. Le contrat de preuve ne prétend pas mesurer la commune quand la population affichée est celle de
l'UU.

## 8. Le poids, et la dette poids-1 baseline (notée, non corrigée)

Le poids gouverne la matérialité comme partout (0 → not_applicable ; 1 → mismatch silencieux ; 2 → secondary ;
3 → structuring ; jamais `decision_critical`). Comptage matériel sur `run.facts`. Aucun changement du registre.

**Dette pré-existante, transversale, NON corrigée ici.** `eviter_isolement` est injecté comme **plancher
implicite de poids 1** (`baseline`) sur certaines recherches. Un `satisfied` d'origine implicite ne devrait pas
faire passer un dossier en `favorable` ; ce comportement **préexiste** (toutes les règles baseline) et ne se
répare PAS en déformant les règles de taille. L'**asymétrie d'`eviter_isolement` (jamais `satisfied`) neutralise
déjà le faux positif du plancher** pour ce critère. La correction générale (distinguer `origin: "system_default"`
dans le registre, exclure les `satisfied` implicites du calcul favorable) est une dette de provenance/orientation
à traiter séparément, avec la dette jumelle du 3a (satisfied poids-1).

## 9. Câblage, prompt, sonde

- **Types** : `CategoricalStateBasis` ajouté à `MismatchBasis` ; `tailleVilleSource` ajouté à `ModuleFacts`
  (`decision-fact.ts`).
- **Libs pures** : `agglomeration-facts.ts` (convention + `classifyAgglomerationSize` + `labelForCategory`) ;
  `agglomeration-rules.ts` (fabrique de 3 règles sur le patron d'`absence-rules.ts`, un `SPECS[]` avec la table
  §4 encodée par critère), exportant `AGGLOMERATION_RULES` et `AGGLOMERATION_KEYS`.
- **Provenance** : `resolveTailleVille` (`commune-attributes.ts`), `tailleVilleSourceOf` (`comparateur-vie.ts`),
  passage dans `territory-facts.ts` + `module-facts-map.ts`.
- **REGISTRY + validation** : `...AGGLOMERATION_RULES` dans `materiality-rules.ts` ; `assertFactValid` accepte
  et valide `categorical_state`.
- **Prompt** : `conclusion-prompt.ts` gagne une consigne « mismatch de catégorie de taille » (nommer la
  catégorie, jamais « trop petit / trop grand » en jugement absolu, distinguer taille et isolement), PUIS bump
  `DECISION_NARRATIVE_PROMPT_VERSION` `v9 → v10` (`conclusion-hash.ts`). Artefacts invalidés.
- **Sonde** : `scripts/probe-conclusion.ts` gagne DEUX cas (revue porteur) : un mismatch de catégorie
  (métropole / `eviter_grandes_villes`) ET **le cas risqué** village / `eviter_isolement`, où le modèle ne doit
  JAMAIS écrire « la commune est isolée ». Contrôle éditorial manuel, lecture visuelle critique sur le second.
- **AUCUN enrichissement d'index** : `tailleVille` déjà mappé ; `tailleVilleSource` dérivé au mapping.

## 10. Périmètre exact

**DANS ce lot** — `categorical_state` sur trois critères : `eviter_grandes_villes`, `prefere_grande_ville`,
`eviter_isolement`. Couverture **23 → 26 sur 28**.

**HORS de ce lot** : les 2 critères restants pour atteindre 28 ; la fusion de deux mismatchs en compromis
narratif (la cloche « petit mais pas isolé » en est un cas d'école) ; la séparation `ProjectFit ×
DecisionConfidence` ; la dette générale du `satisfied` implicite/poids-1.

## 11. Critères d'acceptation

1. `MismatchBasis` gagne `CategoricalStateBasis` ; v1/2a/3a passent sans régression.
2. `classifyAgglomerationSize` : 5 catégories aux bornes exactes (500 000 → métropole), null/NaN/négatif →
   `uncertain`. Tests de bornes. **Ne réutilise pas `tailleLabel`** (null→uncertain, lib pure).
3. `eviter_grandes_villes` déclarée, catégorie ∈ {grande, métropole} → `mismatch` (poids ≥ 2 matériel) nommant
   la catégorie ; {village, petite} → `satisfied` silencieux ; moyenne → `neutral`. Symétrique.
4. `prefere_grande_ville` : {grande, métropole} → `satisfied` ; {village, petite} → `mismatch` ; moyenne →
   `neutral`. Symétrique.
5. `eviter_isolement` : village → `mismatch` avec la `limitation` « un village peut être bien connecté » ;
   petite/moyenne/grande/métropole → `neutral`. **Jamais `satisfied`.**
6. Provenance : `source === "commune"` → « est classée comme … selon sa population communale », **sans**
   « agglomération » ni « appartient à », grain `"commune"`, métropole → « une très grande ville » ;
   `source === "urban_unit"` → « appartient à … », « agglomération »/« métropole » autorisés, grain
   `"unite_urbaine"`. Un test le prouve pour chaque côté.
7. **Provenance EXIGÉE** : `tailleVille` null → `uncertain` ; `tailleVille` présent mais
   `tailleVilleSource == null` (anomalie) → `uncertain`, **jamais un repli commune**. `resolveTailleVille` tient
   l'invariant `value != null ⟺ source != null` (UU déclarée absente du cache → null/null) ; `tailleVilleFrom`
   délègue ; `opts.tailleVilleSource` est obligatoire au mapping.
7b. Les trois règles émettent `sourceFactIds: ["territorySize.classification"]` (fait source canonique) ; un
   test prouve que deux mismatchs d'un même village le partagent.
8. Poids 1 → mismatch silencieux (couverture +1, pas de carte, pas d'arbitrage) ; poids 2 → secondary ; poids 3
   → structuring. Un ensemble matériel → `arbitration` (comptage `run.facts`). Test d'orientation.
9. `topic` d'`eviter_isolement` distinct de celui des deux préférences de taille.
10. `DECISION_NARRATIVE_PROMPT_VERSION` bumpée `v9 → v10`, prompt réellement modifié, sonde repassée (cas
    taille), artefacts invalidés.
11. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` + `scripts/lib/*.test.mjs` verts, `npx tsc
    --noEmit` 0, `npm run build` exit 0. (Aucun `index:verify` : l'index n'est pas modifié.)

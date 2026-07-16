# `mismatch` lot 4a : l'ensoleillement, une position relative (chantier B, suite)

**Date** : 2026-07-16 · **Statut** : spec validée (porteur, brainstorm) · **Prérequis** : mismatch v1
(`relative_position`), lots 2a/2b/3a/3b livrés et poussés sur `main`.

**Ce lot étend la forme `relative_position` à un critère de plus : `ensoleillement_recherche`.** C'est le seul
des deux critères climatiques non couverts qui se prête à un percentile national honnête sans conception
nouvelle. `douceur_climat` fait l'objet d'un lot 4b séparé (refonte canonique, §7).

Ce lot ajoute aussi un **hook `limitation` optionnel** à la fabrique `relative_position`, pour porter la nuance
« climatologie observée, pas une promesse future ». Couverture **+1**.

---

## 1. Le problème, et pourquoi `relative_position` convient

`ensoleillement_recherche` est déclaré par un lecteur qui **cherche** un territoire plus ensoleillé. La donnée y
répond directement : `c.rayonnement_pct`, un **percentile national du rayonnement solaire au sol issu de la
réanalyse ERA5-Land (normale 1991-2020)**, distribution **parfaitement uniforme** (vérifié sur 34 788 communes :
p5=5, p10=10, p50=50, p90=90, p95=95, aucun `null`, aucune masse d'ex æquo). C'est exactement la forme des 11
critères de `relative_position` déjà livrés : rien à concevoir, une extension mécanique comme `acces_services`
au lot 2b.

**La direction vient de la préférence déclarée**, pas du comparateur. Le comparateur affiche l'ensoleillement
« sans gagnant » (`directionnel: false` : l'ensoleillement idéal dépend des goûts). Mais un lecteur qui déclare
`ensoleillement_recherche` a exprimé qu'il **veut** du soleil : plus de soleil = rang haut = `satisfied`, peu de
soleil = rang bas = `mismatch`. Le `mismatchRawScore` encode déjà « plus de soleil = score plus haut »
(`c.rayonnement_pct`), donc l'orientation « 0 = pire, 1 = meilleur » est correcte sans traitement spécial.

## 2. La nuance éditoriale : une climatologie de RÉFÉRENCE, jamais une promesse future

Le constat doit rester honnête sur ce qu'il est : une **position dans une climatologie de référence**, sans
prétendre connaître l'ensoleillement futur. On ne dit PAS « variable stable » (le rayonnement au sol peut
évoluer avec la nébulosité, les aérosols, les circulations) : la raison honnête de ne pas produire de
trajectoire est simplement que **futur•e utilise ici une climatologie de référence et ne dispose pas, dans
cette règle, d'une projection future équivalente et validée**.

D'où un **champ `limitation` optionnel, ajouté à la fabrique `relative_position`** (aujourd'hui elle n'en a
pas), porté par `MISMATCH_LABELS`. **L'indicator reste léger** (pour ne pas alourdir le statement) ; la
**méthode et la période vivent dans la limitation** :

```ts
type MismatchLabel = { topic: string; projectPhrase: string; indicator: string; limitation?: string };
export const MISMATCH_LABELS = {
  // … les 11 entrées existantes, inchangées (pas de limitation) …
  ensoleillement_recherche: {
    topic: "l'ensoleillement",
    projectPhrase: "un territoire ensoleillé",
    indicator: "l'ensoleillement du territoire",
    limitation: "Cette position décrit la climatologie solaire de référence issue de la réanalyse ERA5-Land, normale 1991-2020. Elle ne constitue pas une projection de l'ensoleillement futur.",
  },
} satisfies Record<string, MismatchLabel>;
```

La fabrique (`makeMismatchRule`) ajoute `...(lab.limitation ? { limitation: lab.limitation } : {})` sur le
`MismatchFact` (le champ `limitation?` existe déjà, utilisé par `named_absence` / `absolute_measure`).

### Le correctif de carte (bug pré-existant, révélé par la revue)

**`DossierDecisionSection.tsx` ne rend `limitation` QUE pour `incompatibility` et `verification`** : les
limitations des `mismatch` (donc **2a `named_absence` ET 3a `absolute_measure`**) sont **silencieusement jetées
depuis leur livraison**. Et **`buildConclusionPlan` ne lit jamais `limitation`** (0 occurrence) : les
limitations sont **card-only par conception**, la conclusion ne les a jamais vues.

Ce lot **corrige la carte** pour rendre `limitation` sur le rôle `mismatch` aussi (ce qui répare 2a/3a du même
coup). La nuance reste **card-only** (conforme au design existant) : la conclusion nomme le topic, la carte
démontre et nuance. **Aucun bump de prompt** (§5).

## 3. Le fondement, inchangé

`basis.kind === "relative_position"` (rankLow/rankHigh/universe/distributionVersion), exactement comme les 11
critères existants. **Aucun nouveau `kind`**, aucun changement de type. Le statement reste le template
générique (« Sur {indicator}, {commune} se situe parmi {rang} les moins favorables de France… ») ; seule la
`limitation` s'ajoute.

## 4. Le câblage (touche l'index, comme le 2b)

- **`src/lib/comparateur-scores.ts`** : ajouter `"ensoleillement_recherche"` à `MISMATCH_RANK_KEYS` ET un cas à
  `mismatchRawScore` : `case "ensoleillement_recherche": return c.rayonnement_pct ?? null;`. La **garantie
  anti-divergence** (mismatchRawScore doit rendre EXACTEMENT ce que `signatureScore`/`subScore` rend, cf. le
  commentaire du fichier) est respectée : `subScore("ensoleillement_recherche")` rend déjà
  `c.rayonnement_pct ?? null`. Un test d'équivalence garde ça.
- **`src/lib/decision/mismatch-rules.ts`** : ajouter `"ensoleillement_recherche"` à `MISMATCH_KEYS`.
- **`src/lib/decision/mismatch-facts.ts`** : type `MismatchLabel` (avec `limitation?`) + entrée ensoleillement,
  `MISMATCH_LABELS ... satisfies Record<string, MismatchLabel>` (garde la forme des valeurs sans casser
  l'exhaustivité).
- **`src/components/report/DossierDecisionSection.tsx`** : le correctif de carte (§2) — rendre `limitation`
  pour le rôle `mismatch`.
- **Gardes de cohérence (tests)** : `MISMATCH_KEYS` et `MISMATCH_RANK_KEYS` (deux listes, fichiers différents)
  **doivent coïncider** (une clé sans rang → uncertain) ; et **chaque `MISMATCH_KEY` a une entrée
  `MISMATCH_LABELS`** (la fabrique fait `MISMATCH_LABELS[key]!`). Deux tests l'imposent.
- **Preuve percentile ↔ rankBand** : `rayonnement_pct` EST déjà un percentile national ; le script recalcule un
  rang dessus. Le **rapport du script** prouve qu'ils décrivent le même univers : `validCount = 34 788`,
  `nullCount = 0`, `min/max ∈ [0,100]`, monotonie, et **écart `|rankMid − rayonnement_pct/100|` sous une
  tolérance** (sinon on fabriquerait une seconde convention légèrement différente). `rankMid = (low+high)/2`.
- **Enrichissement de l'index (migration mesurée, pas juste « déterministe »)** : re-lancer
  `node scripts/populate-mismatch-rank.mts`, mais **avant le repack, produire un diff sémantique** prouvant que
  les bandes des **11 clés existantes sont STRICTEMENT identiques** avant/après et qu'aucune autre propriété de
  commune ne bouge — seule `rankBands.ensoleillement_recherche` s'ajoute. Puis `npm run index:pack` +
  `npm run index:verify` + commit du `.gz`. Sur clone frais : `npm run index:unpack` d'abord.
- **`MISMATCH_DISTRIBUTION_VERSION` inchangée** : la constante est `"mismatch-dist-2026-07-15" // le MILLÉSIME`
  (vérifié : méthodologie + millésime des données classées, PAS un schéma d'artefact ni une clé de cache).
  L'ajout d'une clé ne change pas le millésime. **Auditabilité** : le `rankBands` lui-même est le registre (la
  clé EST le critère) et le **rapport du script** porte `validCount` + l'écart percentile↔rang. `populate-mismatch-rank`
  n'écrit pas de bloc `index.meta` aujourd'hui ; en ajouter un serait un motif hors périmètre 4a.

## 5. Pas de bump de prompt, mais une sonde ciblée non bloquante

La grammaire narrative ne change PAS : `relative_position` existe déjà, la conclusion sait nommer ce genre de
mismatch (topic), la section « mismatches » est en place. La limitation étant **card-only** (la conclusion ne
la reçoit pas, comme pour tout mismatch), et le hash de conclusion dépendant du plan complet (un dossier qui
gagne une carte ensoleillement voit SON hash changer → SON artefact se régénère, sans toucher les autres),
**pas de bump de `DECISION_NARRATIVE_PROMPT_VERSION`**, pas d'invalidation globale.

**Sonde ciblée, NON bloquante** : ajouter un cas ensoleillement à `probe-conclusion.ts` et vérifier
visuellement qu'aucune phrase ne bascule dans une **promesse future** (« cette commune restera moins
ensoleillée », « l'ensoleillement futur sera faible ») — la conclusion doit rester au **présent comparatif**,
comme pour les 11 autres critères `relative_position`. Non bloquante car le prompt est inchangé.

## 6. Doctrine de résultat (identique à la v1)

```
préférence absente                       -> not_applicable
rang non calculable (rayonnement absent)  -> uncertain   (jamais un rang inventé)
extrême favorable (borne basse >= 0,80)   -> satisfied   (silencieux)
centre / ex æquo à cheval                 -> neutral     (silencieux)
extrême défavorable (borne haute <= 0,20), poids 1 -> mismatch silencieux
extrême défavorable, poids 2              -> mismatch + carte secondary (+ limitation)
extrême défavorable, poids 3              -> mismatch + carte structuring (+ limitation)
```

## 7. Périmètre

**DANS ce lot** : `ensoleillement_recherche` en `relative_position` + le hook `limitation`. Couverture **+1**.

**HORS de ce lot** :
- **Lot 4b — refonte canonique de `douceur_climat`** : le score actuel est `0.6·douceur_hivernale +
  0.4·(été non extrême)`, et sa composante estivale (`NORTX35D_yr`, jours ≥ 35 °C) **double compte** avec
  `faible_chaleur`. Décision porteur : **une seule définition canonique** (douceur hivernale seule), refondue
  PARTOUT (comparateur + dossier + rankBand + deriveCategories + labels), en **lot de migration mesurée** (impact
  classement, communes emblématiques, invalidation d'artefacts). Question ouverte : douceur **monotone** (plus
  chaud = plus doux) vs **confort autour d'un optimum** (→ renommer `confort_hivernal`/`hiver_tempere`). Brainstorm
  séparé.
- **`faible_secheresse`** reste **exclu par décision documentée** (`climat-facts.ts` : distribution continue
  67-160 j, aucun seuil défendable ; le RGA est traité par Logement au grain adresse). La couverture ne vise pas
  28/28 artificiellement.

## 8. Critères d'acceptation

1. `ensoleillement_recherche` déclaré (poids 2/3), `rayonnement_pct` en extrême défavorable non ambigu →
   `mismatch` matériel : carte `relative_position` nommant le rang et l'univers, **portant la `limitation`
   ERA5-Land / normale 1991-2020 / pas une projection future** ; jamais un jugement absolu.
2. **Le `MismatchFact` porte la limitation ET la carte l'AFFICHE** : `DossierDecisionSection` rend `limitation`
   pour le rôle `mismatch` (correctif du bug qui la jetait). Un test au niveau composant OU un test de contrat
   (`fact.limitation` présent + condition de rendu couvre `mismatch`) le prouve. La conclusion ne reçoit pas la
   limitation (card-only, inchangé).
3. Extrême favorable → `satisfied` (silencieux) ; centre → `neutral` (silencieux) ; les deux font monter la
   couverture. `rayonnement_pct` absent → `uncertain` (aucun rang inventé). Poids 1 → mismatch examiné mais
   silencieux ; poids 2 → secondary, poids 3 → structuring. Jamais `decision_critical`.
4. `mismatchRawScore("ensoleillement_recherche")` === `subScore` (garantie anti-divergence, test d'équivalence
   étendu). `MISMATCH_KEYS === MISMATCH_RANK_KEYS` et chaque `MISMATCH_KEY` a une entrée `MISMATCH_LABELS`
   (deux tests de garde).
5. **Preuve percentile ↔ rang** : le rapport du script montre `validCount = 34 788`, `nullCount = 0`, bornes
   `[0,100]`, monotonie, écart `|rankMid − rayonnement_pct/100|` sous tolérance.
6. **Diff sémantique avant repack** : les bandes des 11 critères existants sont **strictement identiques**
   avant/après ; seule `rankBands.ensoleillement_recherche` s'ajoute. `MISMATCH_DISTRIBUTION_VERSION` inchangée.
   `populate-mismatch-rank.mts` + `index:pack` + `index:verify` OK ; `.gz` committé.
7. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit` 0, `npm run build`
   exit 0. **Aucun** bump de prompt. Sonde ensoleillement lancée (non bloquante) : pas de promesse future.

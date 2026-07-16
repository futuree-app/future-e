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
répond directement : `c.rayonnement_pct`, un **percentile national du rayonnement solaire réel (ERA5)**,
distribution **parfaitement uniforme** (vérifié sur 34 788 communes : p5=5, p10=10, p50=50, p90=90, p95=95,
aucun `null`, aucune masse d'ex æquo). C'est exactement la forme des 11 critères de `relative_position` déjà
livrés : rien à concevoir, une extension mécanique comme `acces_services` au lot 2b.

**La direction vient de la préférence déclarée**, pas du comparateur. Le comparateur affiche l'ensoleillement
« sans gagnant » (`directionnel: false` : l'ensoleillement idéal dépend des goûts). Mais un lecteur qui déclare
`ensoleillement_recherche` a exprimé qu'il **veut** du soleil : plus de soleil = rang haut = `satisfied`, peu de
soleil = rang bas = `mismatch`. Le `mismatchRawScore` encode déjà « plus de soleil = score plus haut »
(`c.rayonnement_pct`), donc l'orientation « 0 = pire, 1 = meilleur » est correcte sans traitement spécial.

## 2. La nuance éditoriale : une climatologie OBSERVÉE, jamais une promesse future

Le rayonnement solaire est une variable **stable** (peu affectée par le réchauffement), mais le constat doit
rester honnête sur ce qu'il est : une **position dans la climatologie observée (ERA5)**, pas une projection.
D'où un **champ `limitation` optionnel, ajouté à la fabrique `relative_position`** (aujourd'hui elle n'en a
pas), porté par `MISMATCH_LABELS` :

```ts
export const MISMATCH_LABELS: Record<string, {
  topic: string; projectPhrase: string; indicator: string; limitation?: string;
}> = {
  // … les 11 entrées existantes, inchangées (pas de limitation) …
  ensoleillement_recherche: {
    topic: "l'ensoleillement",
    projectPhrase: "un territoire ensoleillé",
    indicator: "l'ensoleillement, mesuré par le rayonnement solaire au sol (ERA5)",
    limitation: "Cette position reflète la climatologie solaire observée (ERA5), pas une projection d'ensoleillement futur.",
  },
};
```

La fabrique (`makeMismatchRule`) ajoute `...(lab.limitation ? { limitation: lab.limitation } : {})` sur le
`MismatchFact` (le champ `limitation?` existe déjà sur `MismatchFact`, utilisé par `named_absence` /
`absolute_measure`). Réutilisable par de futurs critères ; la nuance reste **distincte du constat** (elle ne se
noie pas dans la phrase de rang).

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
- **`src/lib/decision/mismatch-facts.ts`** : `limitation?` sur le type `MISMATCH_LABELS` + entrée ensoleillement.
- **Enrichissement de l'index** : re-lancer `node scripts/populate-mismatch-rank.mts` PUIS `npm run index:pack`
  PUIS committer le `.gz`. Le re-run est **déterministe pour les clés existantes** (mêmes formules, mêmes
  données → rankBands identiques) ; seule la bande `ensoleillement_recherche` s'ajoute. `MISMATCH_DISTRIBUTION_VERSION`
  **inchangée** (la méthodologie ne change pas ; on n'ajoute qu'une clé). Sur clone frais : `npm run index:unpack`
  d'abord.

## 5. Pas de bump de prompt

La grammaire narrative ne change PAS : `relative_position` existe déjà, la conclusion sait nommer ce genre de
mismatch (topic), la section « mismatches » est en place. Aucune nouvelle forme, donc **pas de bump de
`DECISION_NARRATIVE_PROMPT_VERSION`**, pas de re-passage de sonde obligatoire. Lot plus léger que 3a/3b.

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
   « climatologie observée (ERA5), pas une projection future »** ; jamais un jugement absolu.
2. Extrême favorable → `satisfied` (silencieux) ; centre → `neutral` (silencieux) ; les deux font monter la
   couverture. `rayonnement_pct` absent → `uncertain` (aucun rang inventé).
3. Poids 1 → mismatch examiné mais silencieux ; poids 2 → secondary, poids 3 → structuring. Jamais
   `decision_critical`.
4. `mismatchRawScore("ensoleillement_recherche")` === `subScore` (garantie anti-divergence, prouvée par le test
   d'équivalence existant, étendu à la nouvelle clé).
5. Les 11 critères existants **passent sans régression** (mêmes rankBands après re-run : re-run déterministe).
6. `node scripts/populate-mismatch-rank.mts` + `npm run index:pack` + `npm run index:verify` OK ; le `.gz` est
   committé.
7. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit` 0, `npm run build`
   exit 0. **Aucun** bump de prompt.

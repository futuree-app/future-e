# `douceur_climat` lot 4b : refonte canonique en douceur hivernale (chantier B, suite)

**Date** : 2026-07-16 · **Statut** : spec validée (porteur, brainstorm) · **Prérequis** : lot 4a (ensoleillement,
`relative_position` + hook `limitation`) livré et poussé sur `main`.

**Ce lot est une MIGRATION, pas une simple extension.** Il refond la définition canonique du critère
`douceur_climat` — aujourd'hui un composite opaque (`0.6·cloche_hivernale + 0.4·été_non_extrême`) qui **double
compte l'été avec `faible_chaleur`** et **pénalise à tort les hivers les plus doux de France** — en une
**douceur hivernale monotone** (position nationale de la température moyenne DJF). La refonte change le score
PARTAGÉ (comparateur + dossier + rangs + labels), puis ajoute la forme `relative_position` au dossier. Couverture
**+1** (dernier critère couvrable ; `faible_secheresse` reste exclu par décision).

---

## 1. Le problème : un composite qui ment à son propre libellé

`subScore("douceur_climat")` vaut aujourd'hui :

```ts
const w = lerp(WINTER_MILD, c.clim.NORTMm_seas_DJF); // cloche : pic à 9 °C
const s = c.pct.NORTX35D_yr == null ? 50 : 100 - c.pct.NORTX35D_yr; // été non extrême
return Math.round(0.6 * w + 0.4 * s);
```

Deux défauts indépendants, prouvés sur la donnée (34 788 communes) :

1. **La cloche contredit le mot « douceur ».** `WINTER_MILD` pique à 9 °C puis **redescend** (12 °C → 95,
   16 °C → 80). Les hivers français vont de -5,9 °C (Bessans) à 11,4 °C (Borgo, Corse) ; **~1,9 % des communes
   les plus douces (> 9 °C, Côte d'Azur / Corse) sont donc PÉNALISÉES** : une commune à 11,4 °C score moins
   qu'une à 9 °C. C'est à rebours de « douceur » (11,4 °C EST plus doux que 9 °C).
2. **La composante estivale double compte.** `NORTX35D_yr` (jours ≥ 35 °C) entre déjà dans `faible_chaleur`
   (`avgPct(["NORTX30D_yr", NORTX35D_yr, "NORTR_yr", "NORTMm_seas_JJA"])`). Une commune aux étés peu extrêmes
   reçoit donc un avantage **deux fois** (dans `faible_chaleur` ET dans `douceur_climat`).

Et le libellé du **critère** (pas seulement de l'identité) l'affiche « **Douceur à l'année** », aide « hivers
tempérés autant qu'étés sans excès » : l'UI promet explicitement une douceur annuelle. La refonte **restreint le
critère à l'hiver** et aligne le libellé.

## 2. La définition canonique (décision porteur)

> **`douceur_climat` mesure EXCLUSIVEMENT la douceur hivernale. Son score est monotone croissant avec la
> température moyenne DJF, exprimée en position nationale. Toute composante estivale est supprimée et reste
> traitée par `faible_chaleur`. La clé technique est conservée, le libellé devient « Hivers doux ».**

**Forme la plus propre, directement disponible** : `pct.NORTMm_seas_DJF`. Vérifié : orientation correcte
(Bessans -5,9 °C → pct 0 ; Borgo 11,4 °C → pct 100). Donc :

```ts
case "douceur_climat":
  return c.pct?.NORTMm_seas_DJF ?? null; // position nationale de la T° moyenne hivernale (DJF), monotone
```

`WINTER_MILD` n'est utilisée QUE par ce cas → **supprimée**. La composante `NORTX35D` disparaît de douceur (elle
reste dans `faible_chaleur`).

**Responsabilités enfin nettes** :

| Critère | Question |
|---|---|
| `douceur_climat` | Les hivers y sont-ils doux ? |
| `faible_chaleur` | Le territoire est-il peu exposé aux fortes chaleurs, notamment futures ? |
| `ensoleillement_recherche` | Quel rayonnement solaire de référence ? |

## 3. Historique, jamais une trajectoire dans le score

Le score reste une **climatologie de référence** (`NORTMm_seas_DJF` = normale DRIAS **1976-2005**, constante
`CLIMAT_REFERENCE_LABEL` déjà exportée). **On ne mêle PAS la trajectoire DRIAS au score canonique** (ce serait
recréer un composite difficile à expliquer, et « célébrer » le réchauffement des hivers). Le dossier peut
contextualiser séparément (les hivers continuent de se réchauffer ; le confort estival est chez `faible_chaleur`),
mais la trajectoire **ne modifie ni ne compense** le score de douceur. C'est le même parti que l'ensoleillement
(4a) : position historique, aucune promesse future.

## 4. La convention versionnée

```ts
export const WINTER_MILDNESS_CONVENTION = {
  id: "winter-mildness-v1",
  indicator: "NORTMm_seas_DJF",
  season: "DJF",
  direction: "higher_is_milder",
  scoring: "national_percentile",
  referencePeriod: "1976-2005",
} as const;
```

## 5. La forme dossier : `relative_position` (comme l'ensoleillement)

`douceur_climat` rejoint `MISMATCH_RANK_KEYS` + `MISMATCH_KEYS` + `MISMATCH_LABELS`. Symétrique (hiver très doux
→ satisfied ; très froid → mismatch ; centre → neutral). La direction vient de la préférence déclarée. Le hook
`limitation` (livré au 4a) porte la référence + la restriction hivernale :

```ts
douceur_climat: {
  topic: "la douceur des hivers",
  projectPhrase: "des hivers doux",
  indicator: "la douceur des hivers",
  limitation: "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.",
},
```

**Wording borné (mémoire de voix)** : « les températures moyennes hivernales y sont relativement douces à
l'échelle nationale », JAMAIS « le climat y est plus agréable ». Un hiver doux ne dit pas : climat confortable,
faible exposition aux canicules, agréable toute l'année, ni absence de pluie/vent/humidité.

**Pas de bump de prompt** : `relative_position` inchangé, limitation **card-only** (comme au 4a). Le hash de
conclusion dépend du plan ; un dossier qui gagne une carte douceur régénère SON artefact.

## 6. L'éditorial partagé à réaligner

- **Critère** (`comparateur-vie.ts` ~1363) : `label` « Douceur à l'année » → **« Hivers doux »** ;
  `paliers` `["Climat doux", "Climat contrasté", "Hivers rigoureux"]` → `["Hivers doux", "Hivers tempérés",
  "Hivers rigoureux"]` ; `aide` → « La douceur des hivers (température moyenne de décembre à février), à l'échelle
  nationale. Les étés sont notés à part (Fortes chaleurs). » ; `gp` « la douceur du climat » → « la douceur des
  hivers » ; `forte` « la douceur de son climat » → « la douceur de ses hivers ». `directionnel: true` inchangé.
- **Identité / distinctif** : les textes `douceur_climat` (~2014 « climat doux, hivers tempérés » ; ~2074
  « hivers rudes ou étés marqués ») → hiver seul (« hivers doux » ; « hivers rigoureux »).
- **Seuil `doux`** (`buildIdentiteCandidates` ~1004, `subScore("douceur_climat") >= 65`) : **réévalué** sur la
  nouvelle distribution (percentile). Présenté comme une position relative (« parmi les X % aux hivers les plus
  doux »). NE PAS conserver 65 par défaut sans vérifier ce qu'il sélectionne désormais.

## 7. La migration mesurée (exigence porteur)

Changer un score PARTAGÉ change le classement du comparateur pour quiconque pèse la douceur. Un **script
d'analyse d'impact one-off** (non committé au runtime, ou committé sous `scripts/analysis/`) mesure AVANT/APRÈS :

- corrélation ancien score ↔ nouveau (attendue positive mais imparfaite : la cloche + l'été déformaient) ;
- les communes aux plus gros écarts (dans les deux sens) ;
- combien de communes **entrent / sortent** du label « doux » (avec le seuil réévalué) ;
- 4 communes emblématiques nommées : **Méditerranée** (doit MONTER : la cloche la pénalisait), **façade
  atlantique**, **montagne** (doit rester bas), **Nord-Est continental** ;
- vérification que **le double-avantage estival a disparu** (une commune aux étés doux mais hivers froids ne
  doit plus être « douce »).

Le rapport est conservé dans le handoff / `docs/rapports-agents/` pour l'auditabilité de la décision produit.

## 8. Câblage, invalidation

- `comparateur-vie.ts` : `subScore("douceur_climat")` refondu ; `WINTER_MILD` supprimée ; label/aide/paliers/gp/
  forte + textes identité + seuil `doux` alignés.
- `comparateur-scores.ts` : `douceur_climat` dans `MISMATCH_RANK_KEYS` + cas `mismatchRawScore` (=
  `c.pct?.NORTMm_seas_DJF ?? null`, parité `subScore`).
- `mismatch-facts.ts` : entrée `MISMATCH_LABELS.douceur_climat` (+ `WINTER_MILDNESS_CONVENTION` si on la loge
  ici ou dans un `climat-facts`/`winter-facts`).
- `mismatch-rules.ts` : `douceur_climat` dans `MISMATCH_KEYS` ; gardes (KEYS == RANK_KEYS, labels) déjà en place.
- `populate-mismatch-rank.mts` : re-run (douceur ajoutée au rang) + **diff sémantique** : les 12 clés existantes
  (dont ensoleillement) **strictement inchangées**, seule `douceur_climat` s'ajoute. `index:pack` + `index:verify`
  + commit du `.gz`.
- **Artefacts** : le comparateur est recomputé à chaque requête (pas d'invalidation nécessaire) ; les artefacts
  de conclusion persistés s'invalident par hash au cas par cas (le plan d'un dossier gagnant une carte douceur
  change). Pas de bump global.

## 9. Périmètre

**DANS ce lot** : refonte canonique de `douceur_climat` (hiver seul) + sa forme `relative_position` + le
réalignement éditorial + la mesure d'impact. Couverture **+1** (dernier crit. couvrable).

**HORS de ce lot** : `faible_secheresse` (exclu documenté) ; la fusion de deux mismatchs en compromis narratif ;
`ProjectFit × DecisionConfidence` ; les dettes poids-1 / baseline ; le régime de la fonction `/rapport`.

## 10. Critères d'acceptation

1. `subScore("douceur_climat")` === `c.pct?.NORTMm_seas_DJF ?? null` (monotone, historique). `WINTER_MILD`
   supprimée. Aucune composante `NORTX35D` dans douceur. `mismatchRawScore` === `subScore` (anti-divergence).
2. `douceur_climat` déclarée, hiver en extrême défavorable → `mismatch` `relative_position` portant la
   `limitation` 1976-2005 / hiver seul / étés à part ; jamais « climat agréable ». Extrême favorable →
   `satisfied` ; centre → `neutral`. `pct` absent → `uncertain`.
3. Poids 1 → mismatch silencieux ; 2 → secondary ; 3 → structuring. Jamais `decision_critical`.
4. `MISMATCH_KEYS === MISMATCH_RANK_KEYS` (13 clés) ; chaque clé a un label (gardes existantes vertes).
5. Éditorial : le critère s'appelle « Hivers doux », l'aide/les paliers/les textes d'identité ne promettent plus
   la douceur estivale. Le seuil `doux` est réévalué et documenté sur la nouvelle distribution.
6. **Diff sémantique** : les 12 bandes existantes strictement identiques après re-run ; seule `douceur_climat`
   s'ajoute. `index:pack`/`index:verify` OK ; `.gz` committé.
7. **Rapport d'impact** produit : corrélation, plus gros mouvements, entrées/sorties du label « doux »,
   4 communes emblématiques (Méditerranée ↑, montagne bas), disparition du double-avantage estival.
8. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` + `scripts/*.test.mjs` verts ; `npx tsc --noEmit`
   0 ; `npm run build` exit 0. Pas de bump de prompt.

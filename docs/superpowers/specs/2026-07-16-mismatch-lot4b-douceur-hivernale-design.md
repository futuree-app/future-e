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

## 4. La convention versionnée, dans une lib pure UNIQUE

Une seule source de vérité, importée par le comparateur ET le dossier (aucune formule recopiée, aucun import
`server-only`) : **`src/lib/climate/winter-mildness.ts`**.

```ts
export const WINTER_MILDNESS_CONVENTION = {
  id: "winter-mildness-v1",
  indicator: "NORTMm_seas_DJF",
  season: "DJF",
  direction: "higher_is_milder",
  scoring: "national_percentile",
  referencePeriod: "1976-2005",
  identityThreshold: 0, // FIXÉ APRÈS la gate du §6.1 (rapport d'impact), jamais un 65 arbitraire.
} as const;

// Trivial, mais grave les GARDES, la DIRECTION, l'ABSENCE DE REPLI, la convention partagée.
export function winterMildnessScore(percentile: number | null | undefined): number | null {
  if (percentile == null || !Number.isFinite(percentile) || percentile < 0 || percentile > 100) return null;
  return percentile; // pct.NORTMm_seas_DJF déjà orienté 0 = plus froid, 100 = plus doux (vérifié)
}
```

`subScore` et `mismatchRawScore` délèguent à `winterMildnessScore(c.pct?.NORTMm_seas_DJF)`.

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

## 6. L'éditorial partagé à réaligner (audit EXHAUSTIF, la clé technique ment partout)

C'est une migration sémantique : la clé `douceur_climat` reste, mais **tous les contenus** qui la présentent
comme une douceur ANNUELLE (hiver + été) doivent cesser. Audit obligatoire (`rg "douceur_climat|Douceur à
l'année|climat doux|hivers tempérés|étés sans excès|douceur d'ensemble|WINTER_MILD"`), sites connus à ce jour :

- **Critère** (`comparateur-vie.ts` ~1363) : `label` « Douceur à l'année » → **« Hivers doux »** ; `aide` → « La
  douceur des hivers (température moyenne de décembre à février), à l'échelle nationale. Les étés sont notés à
  part (Étés frais). » ; `gp` « la douceur du climat » → « la douceur des hivers » ; `forte` « la douceur de son
  climat » → « la douceur de ses hivers ». `directionnel: true` inchangé.
- **Aide de `faible_chaleur`** (~1362) : « La douceur d'ensemble (hivers et étés) est notée à part » → « Les
  hivers sont notés à part (Hivers doux) » (le concept « douceur d'ensemble » disparaît).
- **Identité / distinctif** : `comparateur-vie.ts` ~1027 « Pour un climat doux une bonne partie de l'année. » →
  hiver seul ; ~2014 « climat doux, hivers tempérés » ; ~2074 « hivers rudes ou étés marqués » → hiver seul.
- **`comparateur-labels.ts`** : ~14 « un climat doux » ; **~54 « Hivers tempérés, étés sans excès. »** (à réduire
  à l'hiver).
- **`synthesize/route.ts`** ~30 : « un climat doux » → « des hivers doux ».
- **Parser** (`parse/route.ts` ~189, ~238) : voir §6.2.

**Paliers RELATIFS (revue porteur)** : le score est une position nationale, pas une classification absolue. Un
hiver breton « moins doux » n'est pas « rigoureux ». Donc `paliers` `["Climat doux", "Climat contrasté", "Hivers
rigoureux"]` → **`["Hivers parmi les plus doux", "Situation intermédiaire", "Hivers parmi les moins doux"]`**.
Idem identité : « des hivers parmi les plus doux à l'échelle nationale », jamais « des hivers doux » en absolu.

### 6.1 Le seuil identitaire `doux` : une GATE de migration, pas un choix d'implémenteur

`buildIdentiteCandidates` (~1004) fait `subScore("douceur_climat") >= 65`. Sur la nouvelle distribution
(percentile), 65 = les 35 % aux hivers les plus doux. **Processus imposé, non contournable** :

1. Le rapport d'impact (§7) calcule, pour les seuils **65 / 70 / 75 / 80 / 85** : nombre et part de communes
   retenues, répartition territoriale, communes emblématiques incluses/exclues, cohérence avec « Hivers doux ».
2. **Le porteur valide UN seuil** avant toute modification de `buildIdentiteCandidates`.
3. Le seuil retenu vit dans `WINTER_MILDNESS_CONVENTION.identityThreshold` (§4), pas en `>= 65` isolé.
4. Un test fige le seuil.

### 6.2 Le parser : « climat doux annuel » → deux critères (décision porteur)

L'ancien composite faisait implicitement le travail « hiver + été ». Après refonte, le parser
(`parse/route.ts`) doit produire **`douceur_climat` + `faible_chaleur`** pour une intention de douceur
ANNUELLE (« un climat doux et agréable toute l'année »), et `douceur_climat` seul pour une intention purement
hivernale. Les lignes ~189 (« 'climat doux' et 'agréable' relèvent de douceur_climat ») et ~238
(« douceur_climat : hivers tempérés, climat doux et agréable ») sont réécrites :
`douceur_climat = hivers doux (T° moyenne DJF)` ; une douceur explicitement ANNUELLE ajoute `faible_chaleur`.
Sans ça, la migration éditoriale est incomplète (le parser continuerait de compresser l'annuel dans un seul
critère hivernal).

## 6bis. Les projets existants : Cas A (décision porteur)

**Aucun profil de production existant ne repose sur l'ancienne définition annuelle** (pré-lancement). Aucune
migration utilisateur n'est nécessaire ; la ré-interprétation silencieuse de `douceur_climat` (annuel → hiver)
est acceptée parce qu'il n'y a personne à préserver. À graver dans le commit de migration. (Si des projets
existaient — Cas B — il faudrait versionner la préférence et la faire reconfirmer à la réouverture ; hors
périmètre ici puisque Cas A.)

## 7. La migration mesurée (exigence porteur)

Changer un score PARTAGÉ change le classement du comparateur pour quiconque pèse la douceur. Un **script
d'analyse d'impact** (`scripts/analysis/`) mesure AVANT/APRÈS et son rapport est conservé (handoff /
`docs/rapports-agents/`).

**A. Sur le score** :
- corrélation ancien ↔ nouveau (positive mais imparfaite : la cloche + l'été déformaient) ;
- les communes aux plus gros écarts (dans les deux sens) ;
- entrées / sorties du label « doux » **par seuil (65/70/75/80/85)** — nourrit la gate §6.1 ;
- 4 communes emblématiques nommées : **Méditerranée** (doit MONTER : la cloche la pénalisait), **façade
  atlantique**, **montagne** (reste bas), **Nord-Est continental** ;
- **le double-avantage estival a disparu** : une commune aux étés doux mais hivers froids n'est plus « douce ».

**B. Sur les RÉSULTATS du comparateur (revue porteur)** — l'impact produit réel est dans le classement
multi-critères, pas dans le score brut. Trois profils simulés AVANT/APRÈS (stabilité du top 10, communes
entrant/sortant du top 3, amplitude) :
1. **ciblé** : `douceur_climat` poids 3, autres secondaires ;
2. **équilibré** : `douceur_climat` poids 2 + plusieurs priorités poids 2/3 ;
3. **tension climatique** : `douceur_climat` poids 3 + `faible_chaleur` poids 3 — le plus important : il doit
   montrer que le moteur RÉVÈLE désormais un vrai arbitrage (« hivers très doux, exposition estivale moins
   favorable »), là où l'ancien composite le masquait / favorisait artificiellement un territoire.

**C. Sur la taille / le déploiement (revue porteur)** — le 4a (+1 Mo) avait fait franchir à `/rapport` la limite
de 250 Mo. La nouvelle bande douceur ajoute un delta comparable. Le rapport note : gzip index avant/après
(delta douceur), taille fonction `/rapport` avant/après. Le build local ne prouve plus le déploiement : un
**Preview Vercel doit réussir** (Large Functions déjà actives via `vercel.json`), sans inclusion accidentelle du
JSON clair (gitignoré).

## 8. Câblage, invalidation

- **`src/lib/climate/winter-mildness.ts` (NOUVEAU, pur)** : `WINTER_MILDNESS_CONVENTION` + `winterMildnessScore`.
  Source unique, importée par comparateur ET dossier.
- `comparateur-vie.ts` : `subScore("douceur_climat")` = `winterMildnessScore(c.pct?.NORTMm_seas_DJF)` ;
  `WINTER_MILD` supprimée ; label/aide/paliers/gp/forte (~1363) + aide `faible_chaleur` (~1362) + textes identité
  (~1027, ~2014, ~2074) + seuil `doux` (~1004, via `identityThreshold`) alignés.
- `comparateur-labels.ts` : ~14, ~54 (hiver seul). `synthesize/route.ts` : ~30. **`parse/route.ts`** : ~189,
  ~238 (douceur annuelle → douceur + faible_chaleur, cf. §6.2). Audit `rg` exhaustif (§6).
- `comparateur-scores.ts` : `douceur_climat` dans `MISMATCH_RANK_KEYS` + cas `mismatchRawScore` (=
  `winterMildnessScore(c.pct?.NORTMm_seas_DJF)`, parité `subScore`).
- `mismatch-facts.ts` : entrée `MISMATCH_LABELS.douceur_climat`. `mismatch-rules.ts` : `douceur_climat` dans
  `MISMATCH_KEYS` ; gardes (KEYS == RANK_KEYS, labels) déjà en place.
- `populate-mismatch-rank.mts` : re-run + **diff sémantique** (12 clés existantes strictement inchangées, seule
  `douceur_climat` s'ajoute) + **preuve percentile↔rang** étendue à douceur. `index:pack` + `index:verify` +
  commit `.gz`.
- **Artefacts** : le comparateur est recomputé à chaque requête ; les artefacts de conclusion persistés
  s'invalident par hash au cas par cas. Pas de bump global.

## 9. Périmètre

**DANS ce lot** : refonte canonique de `douceur_climat` (hiver seul) + sa forme `relative_position` + le
réalignement éditorial + la mesure d'impact. Couverture **+1** (dernier crit. couvrable).

**HORS de ce lot** : `faible_secheresse` (exclu documenté) ; la fusion de deux mismatchs en compromis narratif ;
`ProjectFit × DecisionConfidence` ; les dettes poids-1 / baseline ; le régime de la fonction `/rapport`.

## 10. Critères d'acceptation

1. `subScore("douceur_climat")` === `winterMildnessScore(c.pct?.NORTMm_seas_DJF)` (monotone, historique).
   `WINTER_MILD` supprimée. Aucune composante `NORTX35D` dans douceur. `mismatchRawScore` === `subScore`
   (anti-divergence). Convention + `winterMildnessScore` dans la lib pure `src/lib/climate/winter-mildness.ts`,
   importée par comparateur ET dossier.
2. **Tests comportementaux du dé-doublonnage (revue porteur)** : deux communes de MÊME `pct.NORTMm_seas_DJF`
   mais `NORTX35D_yr` opposés (0 vs 100) donnent le MÊME `subScore("douceur_climat")` ; monotonie (pct 20 →
   20, pct 90 → 90) ; `pct` absent → `null` (aucun repli à 50).
3. `douceur_climat` déclarée, hiver en extrême défavorable → `mismatch` `relative_position` portant la
   `limitation` 1976-2005 / hiver seul / étés à part ; jamais « climat agréable ». Favorable → `satisfied` ;
   centre → `neutral`. Poids 1 silencieux ; 2 secondary ; 3 structuring. Jamais `decision_critical`.
4. `MISMATCH_KEYS === MISMATCH_RANK_KEYS` (13 clés) ; chaque clé a un label (gardes existantes vertes).
5. **Éditorial exhaustif** : `rg` ne laisse AUCUN texte présentant `douceur_climat` comme annuelle (« Douceur à
   l'année », « étés sans excès », « climat doux et agréable », « douceur d'ensemble »…). Le critère s'appelle
   « Hivers doux », paliers **relatifs** (« parmi les plus doux / intermédiaire / parmi les moins doux »).
   **Parser** : douceur annuelle → `douceur_climat` + `faible_chaleur` ; douceur hivernale → `douceur_climat`
   seul. Topic/statement/limitation strictement hivernaux (aucune « douceur du climat » n'atteint la conclusion).
6. **Seuil identitaire = gate** : rapport par seuil (65/75/80/85), porteur valide, valeur dans
   `WINTER_MILDNESS_CONVENTION.identityThreshold`, test qui la fige. Pas de `>= 65` arbitraire.
7. **Projets existants** : Cas A gravé dans le commit (aucun profil à préserver, pré-lancement).
8. **Diff sémantique + preuve percentile↔rang** : les 12 bandes existantes strictement identiques après re-run ;
   seule `douceur_climat` s'ajoute. Le rapport du script porte, pour douceur, `validCount`/`nullCount`, plus gros
   ex æquo (~1,3 % attendu, sain), et `|rankMid − pct/100| max` sous tolérance. `index:pack`/`index:verify` OK ;
   `.gz` committé.
9. **Rapport d'impact** produit (§7 A/B/C) : score (corrélation, mouvements, label par seuil, 4 communes
   emblématiques, double-avantage disparu) ; RÉSULTATS (3 profils, dont tension climatique révélant l'arbitrage) ;
   TAILLE (gzip + fonction `/rapport` avant/après).
10. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` + `scripts/*.test.mjs` verts ; `npx tsc --noEmit`
    0 ; `npm run build` exit 0 ; **Preview Vercel réussi** (Large Functions actives, pas d'inclusion du JSON
    clair). Pas de bump de prompt.

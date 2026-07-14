# `mismatch` : le cinquième rôle de fait (chantier B)

**Date** : 2026-07-15 · **Statut** : spec validée (porteur) · **Prérequis** : chantier A (contraintes dures
canoniques) et lots de couverture climat + santé livrés.

**Ce lot livre la v1 : la forme `relative_position` sur 10 critères à distribution saine.** Les états
absolus (`absolute_state` : mobilité, mer…) et l'affinage des deux axes internes sont explicitement hors
de ce lot (§9).

---

## 1. Le problème

Le dossier de décision sait dire quatre choses : une **incompatibilité** (une condition non négociable est
enfreinte), un **compromis** (deux priorités tirent en sens opposés), une **inconnue** (la donnée manque),
une **vérification** (un risque établi dont la portée locale s'instruit). Il ne sait pas dire la situation
la plus fréquente : **un lieu répond MAL à une priorité déclarée, sans que ce soit éliminatoire.**

Un lecteur qui a pesé « les espaces naturels » à 3, sur une commune médiocre en nature, lit aujourd'hui
« critère non examiné » — alors que la donnée est là, complète, et mauvaise. C'est le trou qui laisse 19
critères de qualité (nature, écoles, soins, vie locale…) hors de portée du dossier.

> **`mismatch` est l'opposé non éliminatoire de `satisfied`.** Un critère déclaré a été effectivement
> examiné, la donnée est disponible et robuste, et le résultat se situe nettement du côté défavorable de
> la préférence, sans constituer une condition non négociable.

**Un mismatch ne dégrade pas la CERTITUDE du dossier, il dégrade l'ADÉQUATION du lieu au projet.** C'est ce
qui le distingue d'une réserve : une réserve demande d'être *vérifiée* (le constat est incomplet) ; un
mismatch demande d'être *arbitré* (le constat est établi, et aucune vérification ne le fera disparaître).

## 2. Le fondement : un percentile, mais assumé comme tel

Un mismatch a le droit de s'appuyer sur un **percentile national**, là où une incompatibilité ne l'a pas.

La raison est nette. Une incompatibilité oppose au lecteur un **fait du monde** (« cette commune est à
240 km de la mer que vous exigez ») : elle exige un seuil absolu. Un mismatch dit une **position relative**,
et l'assume. Le percentile cesse d'être caché derrière un verdict inventé (« la nature est insuffisante ici »,
qui est un jugement absolu faux) ; il **devient** le constat (« parmi les communes les moins bien dotées »),
qui est vrai. C'est la doctrine « décrire, jamais juger » déjà en place sur `croissance_demographique`.

**Interdit :** « Roubaix manque de nature. »
**Autorisé :** « Vous avez placé les espaces naturels parmi vos priorités. Sur cet indicateur, Roubaix se
situe dans le quart des communes les moins favorables de France. »

## 3. Le piège du score, et pourquoi le dossier ne peut pas lire `scores`

`ModuleFacts.scores` applique des **replis métier** : une donnée absente y devient un verdict.

```ts
case "mobilite_quotidienne": return c.reseauLocal?.acces ?? 0;   // donnée MANQUANTE -> 0
case "calme_sonore":         return c.calmeSonore?.score ?? 100; // donnée MANQUANTE -> 100
```

Une commune dont le réseau n'a pas été calculé recevrait « aucun transport en commun » ; une commune dont le
bruit n'a pas été calculé recevrait « parfaitement calme ». C'est **exactement le `?? 0` que le chantier A
a démonté**, déjà présent. Le dossier ne peut donc **pas** consommer `scores` pour produire un fait
opposable : il lui faut une source qui distingue « nul » de « non lu ».

D'où une brique de faits **nullable**, séparée du score de tri :

```ts
type RelativeCriterionFact = {
  key: PreferenceKey;
  rawValue: number | null;   // la valeur BRUTE, nullable. `null` = non lu -> uncertain, jamais un rang.
  rankLow: number | null;    // part des communes STRICTEMENT moins favorables (0..1)
  rankHigh: number | null;   // part des communes moins favorables OU ex æquo (0..1)
  universe: "communes_france";
  distributionVersion: string;
};
```

## 4. Le rang national, et l'intervalle d'ex æquo

Le rang est calculé **sur les 34 788 communes**, jamais sur la shortlist du comparateur : sinon la même
commune serait favorable ou défavorable selon la recherche. Il porte **deux bornes**, et c'est ce qui gère
les ex æquo honnêtement :

```
rankLow  = |{ communes strictement moins favorables }| / N
rankHigh = |{ communes moins favorables OU à égalité }| / N
```

Direction : chaque critère déclare si « plus haut = mieux » (nature, écoles) ou l'inverse. Le rang est
toujours orienté de sorte que **0 = le pire, 1 = le meilleur**.

**Seuil (convention de produit, nommée et versionnée)** : `EXTREME_SHARE = 0.20`.

```
la borne HAUTE de l'intervalle est <= 0,20  -> extrême DÉFAVORABLE, sans ambiguïté  -> mismatch
la borne BASSE de l'intervalle est >= 0,80  -> extrême FAVORABLE, sans ambiguïté    -> satisfied
l'intervalle CHEVAUCHE un seuil (ex æquo à cheval)                                  -> neutral
le centre de la distribution                                                        -> neutral
rawValue est null                                                                    -> uncertain
```

Le chevauchement est le garde-fou : si 83 % des communes partagent la même valeur, l'intervalle traverse
tout le bas du classement, et « parmi les 20 % les moins favorables » serait faux. Ces critères-là
(distribution dégénérée) sont **exclus de la v1** (§9) : ils relèvent de `absolute_state`, au lot 2.

**Vérifié sur la donnée réelle (34 788 communes)** : les 10 critères de la v1 ont une distribution quasi
uniforme (p10=10, p50=50, p90=90, aucun ex æquo notable). Le mécanisme de position y est exact et
symétrique.

## 5. Le nouvel outcome, et la table de vérité

`RuleOutcome` gagne **`mismatch`** et **`neutral`**.

| Fondement (v1 = position) | Observation | outcome | Carte |
|---|---|---|---|
| position | extrême défavorable, borne haute <= 0,20 | **`mismatch`** | visible |
| position | extrême favorable, borne basse >= 0,80 | `satisfied` | silencieuse |
| position | centre, ou intervalle à cheval sur un seuil | **`neutral`** | silencieuse |
| — | `rawValue` null (non lu) | `uncertain` | — |
| — | critère non déclaré | `not_applicable` | — |

**`neutral` est examiné, mais sans signal assez fort pour orienter.** Il **fait monter la couverture** et
ne produit **aucune carte**. Sans lui, on serait forcés de qualifier « favorable » un score médian, ou de
laisser « non examiné » un critère pourtant mesuré.

`EXPLOITABLE` (dans `criteria-registry.ts`) gagne `mismatch`, `neutral` et `satisfied` : les trois prouvent
que le critère a été regardé. `neutral` ne compte ni comme favorable, ni comme réserve : il est neutre au
sens plein.

## 6. Le fait, et sa carte

```ts
type MismatchFact = BaseFact & {
  role: "mismatch";
  projectKey: PreferenceKey;
  basis: { kind: "relative_position"; rankLow: number; rankHigh: number; universe: "communes_france" };
  evidence: EvidenceRef[];
};
```

Pas d'`action` (rien à aller vérifier), pas de `limitation` d'un autre type que le grain. La **matérialité
suit le poids déclaré**, jamais l'extrémité seule : `structuring` si le lecteur a pesé le critère à 3,
`secondary` sinon. **Jamais `decision_critical`** : une préférence n'est pas une condition non négociable.

**Formulation canonique** (elle dit ce qui est mesuré, la nature relative, l'univers, et le lien au projet) :

> Vous avez placé {la priorité} parmi vos priorités. Sur cet indicateur, {commune} se situe {dans le quart |
> parmi les 20 % | …} des communes les moins favorables de France. Cela répond moins bien à cette dimension
> de votre projet, sans rendre {commune} incompatible avec lui.

Le seuil de 0,20 **déclenche** le mismatch ; il ne fixe pas la **phrase**. Le libellé de rang est dérivé de
`rankHigh` et arrondi vers une fraction lisible SANS jamais surestimer la position : « parmi les 5 % » exige
`rankHigh <= 0,05`, « le quart » exige `rankHigh <= 0,25`. Une commune à `rankHigh = 0,18` se dit donc « le
cinquième » ou « les 20 % », jamais « les 5 % ». On dit toujours la fraction la plus large que la donnée
garantit, jamais la plus frappante.

**Plafond** : la section est plafonnée (comme les autres), et l'assembleur évite le dossier accusatoire de
six « correspond moins bien ». Cap proposé : 3, priorité aux `structuring` puis au rang le plus bas.

## 7. La section, et sa distinction

Une **section propre** : `key: "mismatches"`, titre **« Ce qui correspond moins bien »**. Elle est distincte
des quatre autres, et l'ordre des sections devient :

```
Vos contraintes non négociables   (incompatibilités)
Ce qui correspond moins bien      (mismatches)          <- NOUVELLE
Ce qui départage vraiment         (compromis)
Ce que nous ne savons pas encore  (inconnues)
Ce qu'il reste à vérifier         (vérifications)
```

**Un mismatch n'est pas un compromis.** Le compromis suppose une contrepartie identifiable (« moins de vie
locale, mais plus de calme ») ; le mismatch constate un écart simple, sans contrepartie. L'assembleur pourra
plus tard transformer *deux mismatchs en tension* en un compromis narratif, mais la règle primaire reste un
mismatch. Hors de ce lot.

## 8. L'orientation, refondue

`Orientation` gagne **`arbitration`**. L'ordre de décision (le premier qui matche gagne, rien ne compense) :

```
1. au moins une incompatibilité                    -> incompatible
2. couverture insuffisante / inconnue bloquante     -> indeterminate
3. ENSEMBLE MATÉRIEL de mismatchs                   -> arbitration
4. réserve (vérification/inconnue) non secondaire   -> major_reserves
5. réserve secondaire                               -> minor_reserves
6. rien de matériel                                 -> favorable
```

**« Ensemble matériel », jamais un booléen `mismatchCount > 0`** : un mismatch secondaire isolé ne fait pas
basculer un dossier par ailleurs favorable.

```ts
const hasStructuringMismatch = mismatchFacts.some((f) => f.materialityTier === "structuring");
const secondaryMismatches = mismatchFacts.filter((f) => f.materialityTier === "secondary").length;
const requiresArbitration = hasStructuringMismatch || secondaryMismatches >= 2;
```

**La double information ne se perd pas.** Si un dossier a à la fois des mismatchs matériels ET des
vérifications importantes, l'orientation est `arbitration`, mais le plan narratif **ajoute** que des points
restent à vérifier. L'ordre de l'enum ne fait pas disparaître l'autre registre : le sous-titre le porte.

> **NOTÉ POUR PLUS TARD, HORS DE CE LOT.** L'orientation mélange deux axes : l'adéquation au projet
> (favorable / arbitrages / incompatible) et la confiance du dossier (clair / réserves / indéterminé). Les
> séparer en deux résultats internes (`ProjectFit` × `DecisionConfidence`) est plus robuste, mais réécrit
> tout le calcul et double la matrice de la sonde. Ce lot garde l'enum public à six valeurs.

## 9. Le prompt, et la sonde

La grammaire narrative change : nouveau rôle, nouvelle section, nouvelle orientation. Donc :

- **bump de `DECISION_NARRATIVE_PROMPT_VERSION`** ;
- le prompt de conclusion apprend à **nommer** un mismatch (via son `topic`) sans recopier la carte, et à
  distinguer « ce qui correspond moins bien » de « ce qu'il reste à vérifier » ;
- **re-passage de la sonde** (`scripts/probe-conclusion.ts`) : la matrice gagne les cas mismatch, et on
  retrouve 15/15 (plus les nouveaux cas) avant de livrer ;
- `conclusion-hash.ts` invalide les artefacts déjà persistés (le plan narratif change) : vérifié.

**Phrases de conclusion visées :**

> Roubaix ne présente aucune réserve à instruire, mais deux de vos priorités y sont nettement moins bien
> servies qu'ailleurs : les espaces naturels et le calme. Cela appelle un arbitrage entre vos priorités,
> sans rendre Roubaix incompatible avec votre projet.

> Roubaix répond favorablement à plusieurs dimensions de votre projet, mais les espaces naturels et le
> calme y sont relativement moins favorables. Deux autres points doivent encore être vérifiés avant de
> décider.

## 10. Le rang précalculé (décision d'implémentation)

Le dossier ne peut pas trier 34 788 communes à chaud à chaque requête. Les deux bornes de rang des 10
critères de la v1 sont donc **précalculées à la construction de l'index** (`build-comparateur-index.mjs`),
sous une clé `rankBand: Record<PreferenceKey, { low, high }>`, avec `distributionVersion`. C'est le même
patron que les `pct` climat/santé déjà présents. `territory-facts` les lit et construit les
`RelativeCriterionFact` ; le mapping reste pur (les rangs viennent de l'appelant, comme `tailleVille` et
`climat`).

Un critère absent de `rankBand` (donnée non lue pour cette commune) rend `rawValue: null` -> `uncertain`.

## 11. Périmètre exact de la v1

**DANS ce lot** — la forme `relative_position` sur les 10 critères à distribution saine, vérifiée sur la
donnée : `nature`, `acces_ecoles`, `acces_soins`, `acces_culture`, `acces_transports`,
`faible_dependance_auto`, `croissance_demographique`, `vie_locale`, `cadre_calme`, `viabilite_emploi`.
Couverture : **9 -> 19 critères sur 28.**

**HORS de ce lot** :
- la forme `absolute_state` (mobilité quotidienne, mer, services, isolement…) et sa doctrine par critère
  (« que signifie 0 ? ») : lot 2 ;
- la fusion de deux mismatchs en compromis narratif ;
- la séparation `ProjectFit` × `DecisionConfidence`.

## 12. Critères d'acceptation

1. Un critère déclaré, lu, en extrême défavorable **non ambigu** rend `mismatch` : une carte comparative,
   sans jamais un jugement absolu (« insuffisant », « manque »), avec l'univers de comparaison nommé.
2. Un critère en extrême favorable rend `satisfied` (silencieux) ; au centre, `neutral` (silencieux) ; les
   deux **font monter la couverture**.
3. Un `rawValue` null rend `uncertain` : le critère reste non examiné, jamais un rang inventé. **Aucun repli
   `?? 0` / `?? 100` ne traverse le dossier.**
4. Le rang est **national**, jamais calculé sur la shortlist.
5. Un intervalle d'ex æquo à cheval sur un seuil rend `neutral`, jamais un mismatch de position.
6. Un **ensemble matériel** de mismatchs porte l'orientation à `arbitration` ; un mismatch secondaire isolé
   ne le fait pas. La matérialité suit le **poids déclaré**, jamais `decision_critical`.
7. `DECISION_NARRATIVE_PROMPT_VERSION` est bumpée, la sonde repasse à 15/15 (plus les cas mismatch), et les
   artefacts persistés sont invalidés.
8. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit` rend 0.

# La couverture, lot 1 : le climat (chaleur, feu, pluies extrêmes)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Le dossier n'examine que 3 critères de préférence sur 28. Ce lot en couvre trois de plus, les
trois qui portent le moat (le climat), avec des **constats sourcés et chiffrés**, et pas des percentiles.
Un lecteur qui déclare « des étés plus frais » cesse de lire « critère non couvert ».

**Architecture:** Une lib **pure** (`decision/climat-facts.ts`) porte la doctrine climatique : la
reconstruction de la référence (DRIAS n'expose pas de colonne « présent »), les conventions de seuil, et
les faits chiffrés. `ModuleFacts` gagne `climat`, chargé par `territory-facts` depuis les scénarios DRIAS
(déjà lus par le module Territoire). Trois règles au-dessus, dans la grammaire existante.

---

## La doctrine, tranchée avec le porteur

**Un risque n'est pas une incertitude.** Le constat est **établi** ; c'est sa **portée décisionnelle** qui
s'instruit à une échelle plus fine. D'où :

```
critère non déclaré                                        → not_applicable
critère déclaré, donnée absente                            → uncertain (non examiné)
critère déclaré, exposition SOUS le seuil                  → satisfied (silencieux, la couverture monte)
critère déclaré, exposition NOTABLE                        → verification + carte + action SPÉCIFIQUE
```

**On n'écrit jamais « le risque est à vérifier »** (il est mesuré). On écrit : *les fortes chaleurs sont un
point de vigilance ici, voici le chiffre, et voici ce qu'il faut aller regarder pour savoir ce que ça change
pour vous.*

## Ce que les données permettent, et ce qu'elles interdisent

Trois faits vérifiés, qui corrigent la formulation d'origine :

1. **DRIAS ne fournit AUCUNE valeur présente.** La période de référence est **1976-2005**, et les horizons
   sont +2 °C (2030), +2,7 °C (2050), +4 °C (2100) *en France*. La référence se **reconstruit**
   (`NOR − anomalie`, médiane des trois horizons), et le module Territoire l'affiche déjà sous le libellé
   exact **« Fin du XXᵉ siècle »**. **Il est donc interdit d'écrire « la commune connaît actuellement… ».**
2. **L'index du comparateur porte l'horizon gwl20 (2050)** : la valeur projetée est là, mais **pas les
   anomalies**. La référence exige donc de lire les scénarios DRIAS complets (`getClimatDataCommune`), ce
   que fait déjà le module Territoire.
3. **La sécheresse des sols n'a pas de seuil défendable** (distribution continue de 67 à 160 jours, et
   « 115 jours de sol sec » ne dit rien à un lecteur). `faible_secheresse` **reste non examiné**, et c'est
   assumé. Le retrait-gonflement des argiles, lui, est **déjà couvert** par le module Logement, au grain
   adresse (`logement.exposition-bati`) : ce n'est pas une mesure de la sécheresse, c'est une conséquence
   géotechnique sur certains sols, et le confondre rétablirait l'asymétrie que le chantier A démonte.

## Les seuils : la grandeur est officielle, la fréquence est une convention

Le **nombre** de jours qui déclenche une réserve est **notre** décision, calibrée sur les 34 788 communes
(horizon 2050). Elle vit donc dans une table **nommée et versionnée**, comme `PRODUCT_CONVENTIONS`, et elle
est **dite dans le texte**, jamais appliquée en silence.

| Grandeur (officielle) | Convention | Communes concernées |
|---|---|---|
| jours à plus de 35 °C | **≥ 8 / an** | 9,6 % |
| nuits tropicales (Tmin ≥ 20 °C, Météo-France) | **≥ 25 / an** | 12,5 % |
| **chaleur = l'un OU l'autre** | | **15,7 %** |
| jours d'indice forêt-météo > 40 (danger très sévère) | **≥ 9 / an** | 10,4 % |
| cumul de pluie max sur 24 h | **≥ 65 mm** | 10,2 % |

Distributions nationales (2050) : jours >35 °C médiane 3,6 / p90 7,8 / max 22,7 · nuits tropicales médiane
11 / p90 27,5 · IFM>40 médiane 3,5 / p90 9 · pluie 24 h médiane 41 mm / p90 65 mm.

## Global Constraints

- **Jamais « actuellement »** pour une valeur DRIAS : la référence est la **fin du XXᵉ siècle**.
- **Un chiffre, toujours**, dans le constat d'une réserve : « 12 jours par an au-dessus de 35 °C à
  l'horizon 2050, contre 4 à la fin du XXᵉ siècle ». Un percentile ne remplace pas une valeur.
- **Une action de vérification SPÉCIFIQUE** par risque. « Renseignez-vous » n'est pas une action. Si aucun
  approfondissement local ne peut changer la décision, ce n'est pas une `verification` : c'est le futur
  `mismatch`, et la règle n'a rien à faire ici.
- **Pas huit cartes mécaniques** : la matérialité suit l'intensité du signal et le **poids déclaré** par le
  lecteur. Aucune préférence n'est `decision_critical`.
- **Pas de tiret cadratin.** Pas de `?? 0` sur une donnée absente (une donnée manquante rend `uncertain`,
  jamais « zéro jour de chaleur »).
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit`
  rend 0, et `scripts/probe-conclusion.ts` reste à 15/15 (le prompt ne change pas ; le plan narratif, si).

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/decision/climat-facts.ts` **(créé)** | PUR. `CLIMAT_CONVENTIONS` (+ version), `reconstructReference`, `buildClimatFacts(scenarios)` → valeurs **chiffrées** (référence + 2050) par axe. Aucune I/O. |
| `src/lib/decision/decision-fact.ts` **(modifié)** | `ModuleFacts.climat?: ClimatFacts \| null`. |
| `src/lib/decision/module-facts-map.ts` **(modifié)** | Passe `climat` (fourni par l'appelant, comme `tailleVille`). |
| `src/lib/decision/territory-facts.ts` **(modifié)** | Charge les scénarios DRIAS (`getClimatDataCommune`) et construit `ClimatFacts`. |
| `src/lib/decision/materiality-rules.ts` **(modifié)** | `ruleChaleur`, `ruleFeu`, `rulePluies`. **`ruleConfort` disparaît** : elle désactivait `faible_chaleur` dès qu'une adresse existait, donc le critère cessait d'être examiné au moment où le dossier était le plus riche. |
| `src/components/report/QuartierClimatData.tsx` **(modifié)** | Réimporte `reconstructReference` de la lib pure, au lieu de sa copie locale. |

---

## Task 1 : La lib climat (pure)

**Files:** Create `src/lib/decision/climat-facts.ts`, `src/lib/decision/climat-facts.test.ts`

```ts
export const CLIMAT_CONVENTIONS_VERSION = "clim-conv-1";
export const CLIMAT_CONVENTIONS = {
  joursTresChaudsMin: 8,      // jours > 35 °C par an (9,6 % des communes)
  nuitsTropicalesMin: 25,     // nuits Tmin >= 20 °C par an (12,5 %)
  joursFeuMin: 9,             // jours d'indice forêt-météo > 40, « danger très sévère » (10,4 %)
  pluieMax24hMin: 65,         // mm en 24 h (10,2 %)
} as const;

export type ClimatAxe = {
  reference: number | null;   // fin du XXe siècle, RECONSTRUITE (projeté − anomalie)
  projete2050: number | null; // horizon gwl20
  notable: boolean;           // au-delà de la convention
};
export type ClimatFacts = {
  joursTresChauds: ClimatAxe; // > 35 °C
  nuitsTropicales: ClimatAxe;
  joursFeu: ClimatAxe;
  pluieMax24h: ClimatAxe;
  horizonLabel: string;       // « 2050 »
};

export function reconstructReference(sc: GwlScenarios | null, absKey: string, anomKey: string): number | null;
export function buildClimatFacts(sc: GwlScenarios | null): ClimatFacts | null;
```

- [ ] Step 1 : tests (la référence se reconstruit par médiane des trois horizons ; un indicateur sans
  anomalie rend `null` **et non zéro** ; les seuils déclenchent `notable` exactement aux valeurs de la
  table ; des scénarios absents rendent `null`, jamais un fait vide).
- [ ] Step 2 : implémenter (déplacer `reconstructReference` depuis `QuartierClimatData.tsx`, qui la
  réimporte ensuite : une seule doctrine de reconstruction dans le produit).
- [ ] Step 3 : vert. Step 4 : commit.

## Task 2 : Le climat entre dans les faits du dossier

**Files:** Modify `decision-fact.ts`, `module-facts-map.ts`, `territory-facts.ts` (+ tests)

`ModuleFacts.climat` est chargé **par l'appelant** (comme `tailleVille`), depuis `getClimatDataCommune` :
le mapping reste **pur**, donc testable.

- [ ] Step 1 : tests du mapping (climat absent → `null`, jamais un objet vide). Step 2 : implémenter.
  Step 3 : commit.

## Task 3 : Les trois règles

**Files:** Modify `materiality-rules.ts` (+ tests)

**`ruleChaleur`** (`faible_chaleur`) — et elle **remplace `ruleConfort`** :
```
non déclarée                          → not_applicable
climat absent                         → uncertain
ni 8 jours >35 °C, ni 25 nuits trop.  → satisfied (silencieux, la couverture monte)
sinon                                 → verification, tier structuring
```
> **topic** : les fortes chaleurs à {commune}
> **constat** : À l'horizon 2050, {commune} compterait environ **12 jours par an au-dessus de 35 °C** et
> **31 nuits tropicales**, contre 4 et 11 à la fin du XXᵉ siècle.
> **action** : vérifier le confort d'été du logement (orientation, dernier étage, inertie, protections
> solaires, possibilité de rafraîchir la nuit) et l'exposition de l'adresse aux îlots de chaleur.

**`ruleFeu`** (`faible_risque_feu`) :
> **constat** : À l'horizon 2050, {commune} compterait environ **14 jours par an** de danger d'incendie
> très sévère (indice forêt-météo supérieur à 40), contre 6 à la fin du XXᵉ siècle.
> **action** : la végétation autour du terrain, l'obligation légale de débroussaillement, l'accès des
> secours, et les matériaux de la toiture.

**`rulePluies`** (`faible_precip_extremes`) :
> **constat** : Les épisodes de pluie les plus intenses atteindraient **environ 78 mm en 24 heures** à
> l'horizon 2050, contre 61 mm à la fin du XXᵉ siècle.
> **action** : le ruissellement autour de l'adresse, la pente du terrain, le sous-sol, les réseaux
> d'évacuation, et l'historique des dégâts des eaux.

La matérialité suit le **poids déclaré** : `structuring` si le lecteur a pesé le critère à 2 ou 3,
`secondary` sinon. **Jamais `decision_critical`** : une préférence n'est pas une condition non négociable.

- [ ] Step 1 : tests (les 4 branches par règle ; le chiffre est dans le constat ; **aucun** « actuellement » ;
  `assertFactValid` passe ; le poids déclaré change le tier). Step 2 : implémenter, retirer `ruleConfort`.
  Step 3 : vert. Step 4 : commit.

## Task 4 : Vérifier à l'écran, et la couverture qui monte

- [ ] Un projet « des étés plus frais, un faible risque de feu » sur une commune du Sud : deux cartes
  chiffrées, une couverture qui monte, et le verdict qui bouge.
- [ ] La même sur une commune du Nord-Ouest : deux `satisfied` silencieux, la couverture monte **sans**
  produire de carte.
- [ ] `node --env-file=.env.local scripts/probe-conclusion.ts` → 15/15.
- [ ] Handoff.

## Critères d'acceptation

1. Un critère climat déclaré et sous le seuil rend `satisfied` : **silencieux, mais la couverture monte**
   (ne jamais rendre `not_applicable` pour dire « tout va bien » : c'est le bug corrigé en slice 2.1).
2. Une exposition notable rend `verification`, avec un **chiffre** et une **action spécifique**.
3. **Aucun texte ne dit « actuellement »** : la référence DRIAS est la fin du XXᵉ siècle.
4. La convention de seuil est **nommée dans le texte** (« au-delà de 8 jours par an, nous le signalons »),
   versionnée, et jamais appliquée en silence.
5. `faible_chaleur` est examiné **avec ou sans adresse** (le fil ouvert de `ruleConfort` est refermé).
6. `faible_secheresse` reste **non examiné**, assumé, et personne ne le maquille avec les argiles.
7. Tests verts, `tsc` à 0, sonde 15/15.

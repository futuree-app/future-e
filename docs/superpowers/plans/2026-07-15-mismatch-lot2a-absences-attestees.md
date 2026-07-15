# `mismatch` lot 2a — Absences attestées — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou
> superpowers:executing-plans pour implémenter ce plan tâche par tâche. Les étapes utilisent la syntaxe
> checkbox (`- [ ]`).

**Goal:** Le dossier apprend à dire qu'un lieu répond mal à une priorité déclarée parce qu'un élément
recherché **n'existe pas** à portée, et qu'il peut le **prouver**. Deux critères : `mobilite_quotidienne`
(aucun réseau de TC du quotidien à portée de marche) et `vie_etudiante` (aucun établissement du supérieur
dans le rayon). Couverture 19 → 21 sur 28.

**Architecture:** Un deuxième **fondement** pour le rôle `mismatch` existant : `named_absence`. Le `basis` de
`MismatchFact` devient une union discriminée (`NamedAbsenceBasis | RelativePositionBasis`). Une **attestation
positive à statut discriminé** (`measured` vs `unavailable`) est portée dans l'index par un script de patch
lisant les caches producteurs (aucun re-fetch OSM/BPE). Une **fabrique de règles** produit les 2 règles
d'absence, avec la doctrine asymétrique (absence → mismatch, présence → neutral, jamais satisfied). Tout l'aval
(section « mismatches », orientation `arbitration`/`neutral`, comptage matériel) est **déjà livré par la v1**.

**Tech Stack:** TypeScript, Next.js, `node --test`, Python (producteurs), l'index national gzip canonique
`data/comparateur-index.json.gz` (copie de travail `data/comparateur-index.json`, gitignorée, restaurée par
`npm run index:unpack`).

## Global Constraints

- **Le dossier ne re-dérive AUCUNE formule.** L'absence se lit sur une **attestation** portée par l'index,
  jamais recalculée. Le scoring du comparateur (`subScore`) reste INCHANGÉ (`acces` conservé, `etudes_acces`
  score conservé, jamais renommé `access`).
- **Une absence n'est opposable que si la recherche est prouvée.** `measured + sous plancher` → `mismatch` ;
  `unavailable` → `uncertain`. Les deux ne se confondent JAMAIS sous un même `null`.
- **`count` est un ACCÈS PONDÉRÉ (`weightedAccess`), PAS un nombre d'établissements.** Absence attestée =
  `establishmentCount === 0` si le producteur l'a porté (airtight), sinon `weightedAccess === 0` (équivalent
  hors le cas-frontière rural `d == DMAX = 25 km`, de mesure nulle).
- **Doctrine asymétrique** : absence → `mismatch`, présence → `neutral` (silencieux), **jamais `satisfied`**.
- **Gardes de valeurs** : une attestation corrompue (`NaN`/`Infinity`/négatif/`acces` hors `[1,100]`/`radiusKm
  ≤ 0`) rend `uncertain`, jamais un verdict.
- **Le POIDS gouverne la MATÉRIALITÉ, jamais l'EXAMINABILITÉ.** Poids 0 → `not_applicable`. Poids 1 → examiné
  (couverture +1), silencieux. Poids 2 → `secondary`. Poids 3 → `structuring`. **Jamais `decision_critical`.**
- **`nationalContext` (prévalence) ≠ `conventionId`** : la prévalence est un résultat de distribution DATÉ
  (`ABSENCE_DISTRIBUTION_VERSION`), source unique dans `absence-facts.ts`, gardée par le patch (refus si
  divergence).
- **L'union `MismatchBasis` ne porte QUE les fondements productibles** : `NamedAbsenceBasis |
  RelativePositionBasis`.
- **Provenance explicite** : `sourceFactIds = ["absenceAttestation.${key}"]`, `evidence[0].factId` idem, JAMAIS
  `scores.*`.
- **Voix** : pas de tiret cadratin ; pas d'antithèse « c'est X, pas Y ». **Absence factuelle autorisée dans le
  périmètre mesuré, jugement qualitatif absolu interdit** (« aucun établissement dans ce rayon » = permis ;
  « la vie étudiante est insuffisante » = interdit). Grain = « point de référence retenu ».
- **Le patch est ATOMIQUE** (tmp UNIQUE → round-trip → rename, nettoyage `finally`, garde clone frais), refuse
  sur anomalie ; set-equality strict des INSEE sur `records = cache.communes ?? cache`.
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit`
  rend 0. La sonde ne repasse qu'à la Task 9.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/comparateur-vie.ts` **(modifié)** | `IndexCommune.reseauLocal` (acces nullable + `measured` + `conventionVersion`) ; `IndexCommune.etudesSup` ; gardes des 3 sites lecteurs (714, 758, 2027). |
| `src/lib/decision/absence-facts.ts` **(créé)** | PUR. Conventions/versions, attestations à statut discriminé, `classifyNetworkAbsence`/`classifyHigherEdAbsence` (avec gardes), `NamedAbsenceBasis`, `ABSENCE_NATIONAL_CONTEXT`. |
| `src/lib/decision/decision-fact.ts` **(modifié)** | `MismatchBasis` union ; `MismatchFact.basis` typé union ; `ModuleFacts.localNetwork` + `ModuleFacts.higherEd`. |
| `src/lib/decision/mismatch-rules.ts` **(modifié)** | Le littéral `relative_position` gagne `distributionVersion`. |
| `src/lib/decision/module-facts-map.ts` **(modifié)** | Mappe `localNetwork`/`higherEd` (statut) depuis `entry`. |
| `src/lib/decision/absence-rules.ts` **(créé)** | PUR. La fabrique des 2 règles d'absence, la doctrine du poids, les libellés. |
| `src/lib/decision/materiality-rules.ts` **(modifié)** | `...ABSENCE_RULES` au REGISTRY ; `case "mismatch"` dans `assertFactValid`. |
| `scripts/lib/absence-attestations.mjs` **(créé)** | PUR. Jointure caches → attestations + validation stricte + `radiusFor`/`tailleVilleFrom` (exportés pour la parité). |
| `scripts/lib/absence-attestations.test.mjs` **(créé)** | Tests de la jointure + parité du rayon aux points de rupture. |
| `scripts/populate-absence-attestations.mts` **(créé)** | I/O (TypeScript, comme `populate-mismatch-rank.mts`) : lit caches + index, garde de prévalence (importe les constantes TS), écrit ATOMIQUEMENT, rapport, `index.meta`. |
| `scripts/populate-reseau-local.py`, `scripts/populate-bpe.py` **(modifiés)** | Préventif : `--write-index` porte les nouveaux champs ; cache écrit atomiquement + `meta`. NON re-tournés. |
| `src/lib/decision/conclusion-prompt.ts`, `conclusion-hash.ts` **(modifiés)** | Le prompt nomme une absence attestée ; bump `v7` → `v8`. |
| `scripts/probe-conclusion.ts` **(modifié)** | Cas absence attestée + présence → neutral. |

---

## Task 1 : Les types côté index, et le collatéral `comparateur-vie`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `IndexCommune`, lignes ~488-493 et ~514 ; sites lecteurs 714, 758, 2027)
- Test: `src/lib/comparateur-vie-reseau-shape.test.ts` **(créé)**

**Interfaces:**
- Produces: `IndexCommune.reseauLocal` = `{ acces: number | null; tram?: boolean; metro?: boolean; arret_km?: number; measured?: boolean; conventionVersion?: string } | null` ; `IndexCommune.etudesSup?: { measured: boolean; weightedAccess: number; radiusKm: number; establishmentCount?: number; conventionVersion?: string } | null`.

**Pourquoi cette tâche existe :** passer les communes sous plancher de `reseauLocal = null` à `{ acces: null,
measured: true }` rend `acces` nullable et l'objet présent pour 82,8 % des communes, ce qui change la
truthiness de `if (c.reseauLocal)` à 3 endroits. Ligne 758 (`buildTerritorySignals`) régresserait
sémantiquement (« desservie: true » pour une commune sans réseau). On corrige AVANT d'écrire l'attestation.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// src/lib/comparateur-vie-reseau-shape.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritorySignals, signatureScore } from "./comparateur-vie.ts";
import type { IndexCommune } from "./comparateur-vie.ts";

const base = { insee: "x", nom: "X", dept: "01", lat: 48, lon: 2 } as unknown as IndexCommune;

test("une commune MESURÉE SOUS PLANCHER (acces null, measured) n'est PAS desservie", () => {
  const c = { ...base, reseauLocal: { acces: null, measured: true } } as IndexCommune;
  const s = buildTerritorySignals(c) as { transports_commun: { desservie: boolean } };
  assert.equal(s.transports_commun.desservie, false);
  assert.equal(signatureScore("mobilite_quotidienne", c), null); // rang canonique reste null, pas de repli
});

test("une commune DESSERVIE (acces number) reste desservie", () => {
  const c = { ...base, reseauLocal: { acces: 72, tram: true, metro: false, arret_km: 0.4, measured: true } } as IndexCommune;
  const s = buildTerritorySignals(c) as { transports_commun: { desservie: boolean; tramway: boolean } };
  assert.equal(s.transports_commun.desservie, true);
  assert.equal(s.transports_commun.tramway, true);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/comparateur-vie-reseau-shape.test.ts`
  Expected: FAIL (tsc/runtime sur `acces: null`, ou `desservie` vaut `true` au premier test).

- [ ] **Step 3 : Modifier le type `IndexCommune`** (lignes ~488-493) :

```ts
  reseauLocal?: {
    acces: number | null; // null = mesurée SOUS le plancher de crédibilité (aucun réseau du quotidien)
    tram?: boolean;
    metro?: boolean;
    arret_km?: number;
    measured?: boolean; // true = commune effectivement mesurée (attestation lot 2a)
    conventionVersion?: string;
  } | null;
```

  Et AJOUTER, près de `etudes_acces` (~ligne 515) :

```ts
  // Attestation « établissements du supérieur » (lot 2a). weightedAccess = accès pondéré BRUT (somme 1 - d/DMAX ;
  // 0 <=> aucun établissement dans le rayon, hors cas-frontière rural). establishmentCount = vrai compte
  // (int(win.sum())), porté à terme par le producteur. radiusKm = rayon adaptatif effectif. Distinct de
  // etudes_acces (percentile de score).
  etudesSup?: { measured: boolean; weightedAccess: number; radiusKm: number; establishmentCount?: number; conventionVersion?: string } | null;
```

- [ ] **Step 4 : Corriger les 3 sites lecteurs** (tsc les signalera). Ligne ~714 :

```ts
  if (c.reseauLocal && (c.reseauLocal.tram || c.reseauLocal.metro || (c.reseauLocal.acces ?? 0) >= 60)) {
    cats.add('reseau_tc');
  }
```

  Ligne ~758 (`buildTerritorySignals`) — **la desserte se juge sur `acces != null`, pas sur la présence de
  l'objet** :

```ts
  if (c.reseauLocal && c.reseauLocal.acces != null) {
    const a = c.reseauLocal.acces;
    s.transports_commun = {
      desservie: true,
      tramway: c.reseauLocal.tram,
      metro: c.reseauLocal.metro,
      niveau: a >= 70 ? "réseau dense à portée de marche" : a >= 40 ? "réseau correct à portée de marche" : "réseau limité",
    };
  } else {
    s.transports_commun = { desservie: false };
  }
```

  Ligne ~2027 (label distinctif `mobilite_quotidienne`, `const r = c.reseauLocal; const mode = r?.metro ? …`)
  : `r?.metro`/`r?.tram` sont déjà nullable-safe, ce label n'est émis que pour un critère FAVORABLE (une
  commune sous plancher n'y parvient pas). **Ne rien changer** ; vérifier seulement que tsc ne le signale pas.

- [ ] **Step 5 : Lancer, vérifier** — Run: `node --test src/lib/comparateur-vie-reseau-shape.test.ts && npx tsc --noEmit`
  Expected: PASS, tsc 0. Puis la parité scoring intacte : `node --test src/lib/comparateur-scores.test.ts`.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-vie-reseau-shape.test.ts
git commit -m "feat(absence): IndexCommune porte l'attestation reseau/etudesSup, gardes des sites lecteurs"
```

---

## Task 2 : La classification d'absence (pure, à statut discriminé)

**Files:**
- Create: `src/lib/decision/absence-facts.ts`, `src/lib/decision/absence-facts.test.ts`

**Interfaces:**
- Produces:
```ts
export const NETWORK_CONVENTION_ID = "daily-transit-access-v1";
export const HIGHER_ED_CONVENTION_ID = "higher-education-radius-adaptive-v1";
export const ABSENCE_DISTRIBUTION_VERSION = "absence-dist-2026-07-15";
export type LocalNetworkAttestation = { status: "measured"; access: number | null } | { status: "unavailable" };
export type HigherEdAttestation = { status: "measured"; weightedAccess: number; radiusKm: number; establishmentCount: number | null } | { status: "unavailable" };
export type AbsenceVerdict = "mismatch" | "neutral" | "uncertain";
export type NamedAbsenceBasis = { kind: "named_absence"; observedStateId: "network_below_daily_credibility_floor" | "no_higher_education_establishment_in_radius"; conventionId: string; nationalContext: { prevalence: number; validCount: number; totalCount: number; universe: "communes_france"; distributionVersion: string } | null };
export function classifyNetworkAbsence(a: LocalNetworkAttestation): AbsenceVerdict;
export function classifyHigherEdAbsence(a: HigherEdAttestation): AbsenceVerdict;
export const ABSENCE_NATIONAL_CONTEXT: Record<"network" | "higherEd", NamedAbsenceBasis["nationalContext"]>;
```

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// src/lib/decision/absence-facts.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { classifyNetworkAbsence, classifyHigherEdAbsence, ABSENCE_NATIONAL_CONTEXT } from "./absence-facts.ts";

test("réseau : mesuré sous plancher -> mismatch ; présent -> neutral ; unavailable -> uncertain", () => {
  assert.equal(classifyNetworkAbsence({ status: "measured", access: null }), "mismatch");
  assert.equal(classifyNetworkAbsence({ status: "measured", access: 42 }), "neutral");
  assert.equal(classifyNetworkAbsence({ status: "unavailable" }), "uncertain");
});
test("réseau : access corrompu -> uncertain (jamais neutral)", () => {
  assert.equal(classifyNetworkAbsence({ status: "measured", access: Number.NaN }), "uncertain");
  assert.equal(classifyNetworkAbsence({ status: "measured", access: -1 }), "uncertain");
  assert.equal(classifyNetworkAbsence({ status: "measured", access: 101 }), "uncertain");
});
test("études : establishmentCount PRÉFÉRÉ quand présent (airtight)", () => {
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 0, radiusKm: 25, establishmentCount: 1 }), "neutral"); // count>0 gagne sur wa==0
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 3.4, radiusKm: 10, establishmentCount: 0 }), "mismatch"); // count==0 gagne
});
test("études : repli sur weightedAccess quand establishmentCount absent", () => {
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 0, radiusKm: 25, establishmentCount: null }), "mismatch");
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 2.7, radiusKm: 15, establishmentCount: null }), "neutral");
});
test("études : unavailable / valeurs corrompues -> uncertain", () => {
  assert.equal(classifyHigherEdAbsence({ status: "unavailable" }), "uncertain");
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: Number.NaN, radiusKm: 25, establishmentCount: null }), "uncertain");
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 0, radiusKm: 0, establishmentCount: null }), "uncertain"); // rayon nul
  assert.equal(classifyHigherEdAbsence({ status: "measured", weightedAccess: 1, radiusKm: 25, establishmentCount: -1 }), "uncertain");
});
test("le contexte national est daté et dissocié des conventions", () => {
  assert.equal(ABSENCE_NATIONAL_CONTEXT.network!.distributionVersion, "absence-dist-2026-07-15");
  assert.ok(ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence > 0.3 && ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence < 0.5);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/absence-facts.test.ts`
  Expected: FAIL `Cannot find module`.

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/decision/absence-facts.ts
// LA DOCTRINE DE L'ABSENCE ATTESTÉE. Lib PURE : aucune I/O, aucun LLM.
//
// Une absence n'est un fait opposable que si la recherche a été PROUVÉE. On ne rend « mismatch » que sur une
// mesure RÉUSSIE (status "measured") dont le résultat atteint le plancher d'absence ; « unavailable » ou une
// valeur corrompue restent « uncertain » (jamais un ?? 0 déguisé en verdict).

export const NETWORK_CONVENTION_ID = "daily-transit-access-v1";
export const HIGHER_ED_CONVENTION_ID = "higher-education-radius-adaptive-v1";
export const ABSENCE_DISTRIBUTION_VERSION = "absence-dist-2026-07-15";

// STATUT DISCRIMINÉ : « unavailable » n'a AUCUN champ de mesure -> impossible de lire un weightedAccess sur
// une donnée non mesurée (garantie de type, pas convention).
export type LocalNetworkAttestation =
  | { status: "measured"; access: number | null }
  | { status: "unavailable" };
export type HigherEdAttestation =
  | { status: "measured"; weightedAccess: number; radiusKm: number; establishmentCount: number | null }
  | { status: "unavailable" };

export type AbsenceVerdict = "mismatch" | "neutral" | "uncertain";

export type NamedAbsenceBasis = {
  kind: "named_absence";
  observedStateId: "network_below_daily_credibility_floor" | "no_higher_education_establishment_in_radius";
  conventionId: string;
  nationalContext:
    | { prevalence: number; validCount: number; totalCount: number; universe: "communes_france"; distributionVersion: string }
    | null;
};

export function classifyNetworkAbsence(a: LocalNetworkAttestation): AbsenceVerdict {
  if (a.status !== "measured") return "uncertain";       // non mesuré : jamais une absence inventée
  if (a.access == null) return "mismatch";               // sous plancher = absence attestée
  if (!Number.isFinite(a.access) || a.access < 0 || a.access > 100) return "uncertain"; // corrompu
  return "neutral";                                      // présent
}

export function classifyHigherEdAbsence(a: HigherEdAttestation): AbsenceVerdict {
  if (a.status !== "measured") return "uncertain";
  if (!Number.isFinite(a.radiusKm) || a.radiusKm <= 0) return "uncertain";
  // On PRÉFÈRE le vrai compte d'établissements (airtight) quand il est là ; sinon weightedAccess == 0
  // (équivalent hors le cas-frontière rural d == DMAX, de mesure nulle).
  if (a.establishmentCount != null) {
    if (!Number.isFinite(a.establishmentCount) || a.establishmentCount < 0) return "uncertain";
    return a.establishmentCount === 0 ? "mismatch" : "neutral";
  }
  if (!Number.isFinite(a.weightedAccess) || a.weightedAccess < 0) return "uncertain";
  return a.weightedAccess === 0 ? "mismatch" : "neutral";
}

// Prévalences nationales MESURÉES le 2026-07-15 sur 34 788 communes (cf. spec §3). Datées, pas doctrinales,
// et GARDÉES par le patch (refus si l'index calcule autre chose). Source unique de la prévalence affichée.
export const ABSENCE_NATIONAL_CONTEXT: Record<"network" | "higherEd", NamedAbsenceBasis["nationalContext"]> = {
  network: { prevalence: 0.828, validCount: 34788, totalCount: 34788, universe: "communes_france", distributionVersion: ABSENCE_DISTRIBUTION_VERSION },
  higherEd: { prevalence: 0.404, validCount: 34788, totalCount: 34788, universe: "communes_france", distributionVersion: ABSENCE_DISTRIBUTION_VERSION },
};
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test src/lib/decision/absence-facts.test.ts && npx tsc --noEmit`
  Expected: PASS (6 tests), tsc 0.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/absence-facts.ts src/lib/decision/absence-facts.test.ts
git commit -m "feat(absence): classification d'absence à statut discriminé (gardes de valeurs, count préféré)"
```

---

## Task 3 : Le `basis` en union discriminée, et les champs `ModuleFacts`

**Files:**
- Modify: `src/lib/decision/decision-fact.ts`, `src/lib/decision/mismatch-rules.ts`

**Interfaces:**
- Consumes: `NamedAbsenceBasis`, `LocalNetworkAttestation`, `HigherEdAttestation` (Task 2).
- Produces: `MismatchBasis = NamedAbsenceBasis | RelativePositionBasis` ; `MismatchFact.basis: MismatchBasis` ;
  `ModuleFacts.localNetwork: LocalNetworkAttestation` ; `ModuleFacts.higherEd: HigherEdAttestation`.

- [ ] **Step 1 : Modifier `decision-fact.ts`.** Import, remplacer `MismatchFact.basis`, ajouter les deux champs :

```ts
// en tête, avec les autres imports type-only :
import type {
  NamedAbsenceBasis, LocalNetworkAttestation, HigherEdAttestation,
} from "./absence-facts.ts";

// LE FONDEMENT d'un mismatch : union discriminée. On ne porte QUE les fondements productibles aujourd'hui.
export type RelativePositionBasis = {
  kind: "relative_position";
  rankLow: number; rankHigh: number;
  universe: "communes_france";
  distributionVersion: string;
};
export type MismatchBasis = NamedAbsenceBasis | RelativePositionBasis;

export type MismatchFact = BaseFact & {
  role: "mismatch";
  projectKey: PreferenceKey;
  basis: MismatchBasis;
  evidence: EvidenceRef[];
  limitation?: string;
};
```

  Et DANS `ModuleFacts`, après `rankBands` :

```ts
  // Attestations d'absence (lot 2a), chargées par le mapping depuis l'index. NON optionnelles : le statut
  // "unavailable" porte explicitement « non mesurée », il n'y a pas de troisième état implicite.
  localNetwork: LocalNetworkAttestation;
  higherEd: HigherEdAttestation;
```

- [ ] **Step 2 : Mettre le littéral `relative_position` à la forme union** — `mismatch-rules.ts` (~ligne 76),
  ajouter `distributionVersion` :

```ts
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
```

  (`MISMATCH_DISTRIBUTION_VERSION` est déjà importé dans ce fichier.)

- [ ] **Step 3 : Vérifier avec le VRAI gate** — Run: `npx tsc --noEmit`
  Expected: `tsc` désigne les constructions de `ModuleFacts` sans `localNetwork`/`higherEd` (helpers de test de
  `mismatch-rules.test.ts`, `mismatch-facts.test.ts`, et tout autre helper). Ajouter à CHAQUE helper signalé :

```ts
    localNetwork: { status: "unavailable" },
    higherEd: { status: "unavailable" },
```

  Re-lancer jusqu'à tsc 0.

- [ ] **Step 4 : Lancer la suite** — Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts && npx tsc --noEmit`
  Expected: PASS (types élargis + defaults de test, aucun comportement changé).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/decision-fact.ts src/lib/decision/mismatch-rules.ts src/lib/decision/*.test.ts
git commit -m "feat(absence): basis en union discriminée (named_absence | relative_position) + champs ModuleFacts"
```

---

## Task 4 : Le mapping `commune -> ModuleFacts`

**Files:**
- Modify: `src/lib/decision/module-facts-map.ts`
- Test: `src/lib/decision/module-facts-map.test.ts` (AJOUTER)

**Interfaces:**
- Consumes: `IndexCommune.reseauLocal`/`etudesSup` (Task 1) ; `ModuleFacts.localNetwork`/`higherEd` (Task 3).

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// module-facts-map.test.ts — AJOUTER
test("mappe l'attestation réseau : sous plancher -> {status:measured, access:null}", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0,
    reseauLocal: { acces: null, measured: true } } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.localNetwork, { status: "measured", access: null });
});
test("mappe l'attestation études : weightedAccess + establishmentCount (null si absent du champ)", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0,
    etudesSup: { measured: true, weightedAccess: 0, radiusKm: 25 } } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.higherEd, { status: "measured", weightedAccess: 0, radiusKm: 25, establishmentCount: null });
});
test("index PRÉ-PATCH (aucune attestation) -> status unavailable (jamais une absence inventée)", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0 } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.localNetwork, { status: "unavailable" });
  assert.deepEqual(mf.higherEd, { status: "unavailable" });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/module-facts-map.test.ts`
  Expected: FAIL (`mf.localNetwork` undefined).

- [ ] **Step 3 : Implémenter** — dans le retour de `mapCommuneToModuleFacts`, après `rankBands` :

```ts
    // Attestations d'absence (lot 2a). Un index PRÉ-PATCH (champ absent, ou objet sans `measured`) rend
    // status "unavailable" -> uncertain : jamais une absence inventée sur une donnée non attestée.
    localNetwork: (() => {
      const r = entry.reseauLocal;
      if (r == null || r.measured !== true) return { status: "unavailable" as const };
      return { status: "measured" as const, access: r.acces };
    })(),
    higherEd: (() => {
      const e = entry.etudesSup;
      if (e == null || e.measured !== true) return { status: "unavailable" as const };
      return { status: "measured" as const, weightedAccess: e.weightedAccess, radiusKm: e.radiusKm, establishmentCount: e.establishmentCount ?? null };
    })(),
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test src/lib/decision/module-facts-map.test.ts && npx tsc --noEmit`
  Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/module-facts-map.ts src/lib/decision/module-facts-map.test.ts
git commit -m "feat(absence): mapping des attestations reseau/etudes vers ModuleFacts (pré-patch -> unavailable)"
```

---

## Task 5 : La fabrique des 2 règles d'absence

**Files:**
- Create: `src/lib/decision/absence-rules.ts`, `src/lib/decision/absence-rules.test.ts`

**Interfaces:**
- Consumes: `classifyNetworkAbsence`/`classifyHigherEdAbsence`, `NamedAbsenceBasis`, conventions, contexte
  national (Task 2) ; `MismatchFact`, `ModuleFacts` (Task 3).
- Produces: `export const ABSENCE_RULES: DecisionRule[]` (2) ; `export const ABSENCE_KEYS: PreferenceKey[]`.

**Doctrine du poids** : poids 0 → `not_applicable` ; poids 1 → outcome calculé, `facts: []` ; poids 2 →
`secondary` ; poids 3 → `structuring`.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// src/lib/decision/absence-rules.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { ABSENCE_RULES } from "./absence-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function facts(over: Partial<ModuleFacts>): ModuleFacts {
  return {
    insee: "59512", nom: "Roubaix", dept: "59", lat: 50.69, lon: 3.18, uu: "59702",
    tailleVille: 1_050_000, reliefProximite: 0, distanceCoteKm: 90, population: 98_000, altitude: 30,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, rankBands: null,
    localNetwork: { status: "unavailable" }, higherEd: { status: "unavailable" },
    scores: {}, hasAddress: false, ...over,
  };
}
function project(prefs: { key: string; weight: number }[]): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}
const rule = (key: string) => ABSENCE_RULES.find((r) => r.id === `territoire.absence-${key}`)!;

test("la fabrique produit 2 règles", () => { assert.equal(ABSENCE_RULES.length, 2); });

test("mobilité sous plancher + poids 3 -> mismatch STRUCTURANT, named_absence, jamais un jugement absolu", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { status: "measured", access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.basis.kind, "named_absence");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /point de référence retenu/);
  assert.doesNotMatch(f.statement, /insuffisant|manque|mauvais|médiocre/i);
  assert.equal(f.evidence[0]!.factId, "absenceAttestation.mobilite_quotidienne");
  assertFactValid(f, p);
});

test("mobilité PRÉSENTE -> neutral ; NON MESURÉE -> uncertain", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { status: "measured", access: 55 } }), p, undefined as never).outcome, "neutral");
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { status: "unavailable" } }), p, undefined as never).outcome, "uncertain");
});

test("LE POIDS 1 : mismatch calculé mais SILENCIEUX", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 1 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { status: "measured", access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("priorité absente (poids 0) -> not_applicable", () => {
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { status: "measured", access: null } }), project([]), undefined as never);
  assert.equal(e.outcome, "not_applicable");
});

test("études : establishmentCount 0 + poids 2 -> mismatch SECONDARY citant le rayon exact", () => {
  const p = project([{ key: "vie_etudiante", weight: 2 }]);
  const e = rule("vie_etudiante").evaluate(facts({ higherEd: { status: "measured", weightedAccess: 0, radiusKm: 25, establishmentCount: 0 } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.materialityTier, "secondary");
  assert.match(f.statement, /rayon de 25 km/);
  assert.match(f.statement, /sans permettre de conclure à l'absence de vie étudiante/);
  assert.doesNotMatch(f.statement, /aucune vie étudiante/i);
  assertFactValid(f, p);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/absence-rules.test.ts`
  Expected: FAIL `Cannot find module`.

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/decision/absence-rules.ts
// LA FABRIQUE DES RÈGLES D'ABSENCE ATTESTÉE (named_absence). PURE.
//
// Doctrine ASYMÉTRIQUE : absence attestée -> mismatch ; élément présent -> neutral (silencieux) ; non mesuré
// -> uncertain. JAMAIS satisfied. Le POIDS gouverne la matérialité (poids 1 = silencieux), jamais l'examen.
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  classifyNetworkAbsence, classifyHigherEdAbsence, NETWORK_CONVENTION_ID, HIGHER_ED_CONVENTION_ID,
  ABSENCE_NATIONAL_CONTEXT, type AbsenceVerdict, type NamedAbsenceBasis,
} from "./absence-facts.ts";

const territoireHref = "/rapport/quartier";

type AbsenceSpec = {
  key: PreferenceKey;
  topic: string;
  observedStateId: NamedAbsenceBasis["observedStateId"];
  conventionId: string;
  nationalContext: NamedAbsenceBasis["nationalContext"];
  classify: (f: ModuleFacts) => AbsenceVerdict;
  observedValue: (f: ModuleFacts) => string;
  statement: (nom: string, f: ModuleFacts) => string;
  limitation: string;
};

// Rayon effectif de la commune (pour la phrase études) : narrowing sûr, car statement/observedValue ne sont
// appelés qu'après un verdict "mismatch" (donc status "measured").
const radiusKmOf = (f: ModuleFacts): number => (f.higherEd.status === "measured" ? f.higherEd.radiusKm : 0);

const SPECS: AbsenceSpec[] = [
  {
    key: "mobilite_quotidienne",
    topic: "les transports en commun du quotidien",
    observedStateId: "network_below_daily_credibility_floor",
    conventionId: NETWORK_CONVENTION_ID,
    nationalContext: ABSENCE_NATIONAL_CONTEXT.network,
    classify: (f) => classifyNetworkAbsence(f.localNetwork),
    observedValue: () => "aucune desserte crédible à portée de marche",
    statement: (nom) =>
      `Vous avez placé les déplacements du quotidien sans voiture parmi vos priorités. Aucune desserte de transports en commun considérée comme praticable au quotidien n'est identifiée à distance de marche du point de référence retenu pour ${nom}. Cela répond moins bien à cette dimension de votre projet, sans rendre ${nom} incompatible avec lui.`,
    limitation:
      "Une desserte trop faible pour constituer une solution régulière au quotidien n'est pas comptée comme accessible. Cette situation concerne environ 83 % des communes françaises.",
  },
  {
    key: "vie_etudiante",
    topic: "les établissements du supérieur",
    observedStateId: "no_higher_education_establishment_in_radius",
    conventionId: HIGHER_ED_CONVENTION_ID,
    nationalContext: ABSENCE_NATIONAL_CONTEXT.higherEd,
    classify: (f) => classifyHigherEdAbsence(f.higherEd),
    observedValue: (f) => `aucun établissement du supérieur dans un rayon de ${radiusKmOf(f)} km`,
    statement: (nom, f) =>
      `Vous avez placé la présence d'un environnement étudiant parmi vos priorités. Aucun établissement d'enseignement supérieur n'est identifié dans un rayon de ${radiusKmOf(f)} km autour du point de référence retenu pour ${nom}. Cet indicateur répond moins bien à cette dimension de votre projet, sans permettre de conclure à l'absence de vie étudiante.`,
    limitation:
      "Une commune peut accueillir des étudiants ou bénéficier de l'influence d'un campus voisin sans accueillir elle-même d'établissement dans le périmètre mesuré.",
  },
];

export const ABSENCE_KEYS: PreferenceKey[] = SPECS.map((s) => s.key);

function makeAbsenceRule(spec: AbsenceSpec): DecisionRule {
  const id = `territoire.absence-${spec.key}`;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [spec.key], outcome, facts, reason });

      const weight = preferenceWeight(p, spec.key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const verdict = spec.classify(f);
      if (verdict === "uncertain") return ret("uncertain", [], "absence non attestée (donnée indisponible)");

      if (verdict !== "mismatch" || weight < 2) {
        return ret(verdict, [], verdict === "mismatch" ? "absence mineure, silencieuse (poids 1)" : "élément présent");
      }

      const tier = weight >= 3 ? "structuring" : "secondary";
      const ev: EvidenceRef = {
        factId: `absenceAttestation.${spec.key}`, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: spec.observedValue(f), grain: "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${spec.key}`, ruleId: id, sourceFactIds: [`absenceAttestation.${spec.key}`],
        module: "territoire", role: "mismatch", projectKey: spec.key, materialityTier: tier,
        topic: spec.topic,
        statement: spec.statement(f.nom, f),
        basis: { kind: "named_absence", observedStateId: spec.observedStateId, conventionId: spec.conventionId, nationalContext: spec.nationalContext },
        evidence: [ev],
        limitation: spec.limitation,
      };
      return ret("mismatch", [fact], "absence attestée");
    },
  };
}

export const ABSENCE_RULES: DecisionRule[] = SPECS.map(makeAbsenceRule);
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test src/lib/decision/absence-rules.test.ts && npx tsc --noEmit`
  Expected: PASS. (`assertFactValid` gagne son `case "mismatch"` en Task 6 ; sans branche de rejet, les appels
  du test passent déjà.)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/absence-rules.ts src/lib/decision/absence-rules.test.ts
git commit -m "feat(absence): fabrique des 2 règles d'absence (asymétrique, poids 1 silencieux, rayon cité)"
```

---

## Task 6 : Brancher au REGISTRY, valider le basis, et l'orientation du poids 1

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts`
- Test: `src/lib/decision/materiality-rules.test.ts`, `src/lib/decision/criteria-registry.test.ts` (AJOUTER)

- [ ] **Step 1 : Écrire les tests qui échouent** — (1) intégration REGISTRY, (2) orientation du poids 1 :

```ts
// materiality-rules.test.ts — AJOUTER (adapter au helper de ModuleFacts/projet/contexte du fichier)
test("un projet priorisant la mobilité sur une commune SANS réseau produit un mismatch d'absence", () => {
  const f = moduleFacts({ localNetwork: { status: "measured", access: null } }); // helper existant du fichier
  const run = runRules(f, projectWith([{ key: "mobilite_quotidienne", weight: 3 }]), context());
  const mm = run.facts.find((x) => x.role === "mismatch" && x.ruleId === "territoire.absence-mobilite_quotidienne");
  assert.ok(mm, "un fait d'absence mobilité doit être émis");
  assert.equal((mm as { basis: { kind: string } }).basis.kind, "named_absence");
});
```

```ts
// criteria-registry.test.ts — AJOUTER (réutiliser projectWith / runWith du fichier)
test("un mismatch d'absence de POIDS 1 monte la couverture mais ne déclenche PAS d'arbitrage", () => {
  const p = projectWith([{ key: "mobilite_quotidienne", weight: 1 }]);
  // le poids 1 rend outcome mismatch, facts [] (aucun MismatchFact matériel)
  const run = runWith(
    [{ ruleId: "territoire.absence-mobilite_quotidienne", projectKeys: ["mobilite_quotidienne"], outcome: "mismatch", facts: [], reason: "" }],
    [], // run.facts vide -> aucun fait matériel
  );
  const s = buildCriteriaRegistry(p, run);
  assert.equal(s.registry.find((c) => c.criterionKey === "mobilite_quotidienne")!.coverage, "examined");
  assert.notEqual(s.orientation, "arbitration");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/materiality-rules.test.ts src/lib/decision/criteria-registry.test.ts`
  Expected: FAIL sur l'intégration (aucune règle d'absence au REGISTRY). Le test d'orientation du poids 1
  passe peut-être déjà (la mécanique v1 le gère) : le garder comme non-régression.

- [ ] **Step 3 : Brancher.** Import + insertion dans `REGISTRY` (après `...MISMATCH_RULES`, avant `ruleInondation`) :

```ts
import { ABSENCE_RULES } from "./absence-rules.ts";
// … dans REGISTRY :
  ...MISMATCH_RULES,
  ...ABSENCE_RULES,
  ruleInondation,
```

  Et AJOUTER le `case "mismatch"` à `assertFactValid` (dans le `switch (fact.role)`) :

```ts
    case "mismatch":
      if (fact.evidence.length === 0) throw new Error(`[decision] ${fact.ruleId}: preuve manquante`);
      if (fact.basis.kind !== "relative_position" && fact.basis.kind !== "named_absence") {
        throw new Error(`[decision] ${fact.ruleId}: basis de mismatch inconnu (${(fact.basis as { kind: string }).kind})`);
      }
      if (!declaredPreferenceKeys(project).includes(fact.projectKey)) {
        throw new Error(`[decision] ${fact.ruleId}: mismatch sur une préférence non déclarée (${fact.projectKey})`);
      }
      break;
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test src/lib/decision/*.test.ts && npx tsc --noEmit`
  Expected: PASS (l'intégration passe ; la v1 `relative_position` valide toujours ; poids 1 non-arbitration).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts src/lib/decision/criteria-registry.test.ts
git commit -m "feat(absence): règles d'absence au REGISTRY, validation du basis, orientation poids 1 non matériel"
```

---

## Task 7 : Le patch d'enrichissement (lib pure + parité rayon + script + run)

**Files:**
- Create: `scripts/lib/absence-attestations.mjs`, `scripts/lib/absence-attestations.test.mjs`,
  `scripts/populate-absence-attestations.mts`

**Interfaces:**
- Produces (lib pure) : `buildAbsenceAttestations({ communes, networkRecords, bpeRecords })` → `{ report,
  prevalence }`, MUTE `communes` en place, jette sur anomalie ; `radiusFor(taille)` ; `tailleVilleFrom(uu, pop, uuPop)`.

**Rappel** : le rayon adaptatif est `5/10/15/25 km` par `tailleVille` (seuils `30k/100k/500k`) ; `tailleVille`
= pop d'UU (somme par `uu`) si `uu ∈ uuPop`, sinon pop communale. Le cache BPE porte `etudes_acces.count`
(= weightedAccess) ; le cache réseau porte `null` (sous plancher) ou `{acces,...}` (desservie). Le cache actuel
n'a PAS `establishmentCount` : le patch écrit `etudesSup` SANS ce champ (le producteur le portera plus tard).

- [ ] **Step 1 : Écrire le test qui échoue (jointure + parité rayon)**

```js
// scripts/lib/absence-attestations.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildAbsenceAttestations, radiusFor, tailleVilleFrom } from "./absence-attestations.mjs";

function fixture() {
  const communes = [
    { insee: "1", nom: "A", uu: "u1", population: 600000 }, // agglo -> rayon 5
    { insee: "2", nom: "B", population: 800 },              // rural -> rayon 25
  ];
  const networkRecords = { "1": { acces: 80, tram: true, metro: false, arret_km: 0.3 }, "2": null };
  const bpeRecords = { "1": { etudes_acces: { score: 90, count: 12 } }, "2": { etudes_acces: { score: 40, count: 0 } } };
  return { communes, networkRecords, bpeRecords };
}

test("porte measured, access null sous plancher, weightedAccess brut, rayon adaptatif", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  buildAbsenceAttestations({ communes, networkRecords, bpeRecords });
  assert.equal(communes[0].reseauLocal.measured, true);
  assert.equal(communes[1].reseauLocal.acces, null);
  assert.equal(communes[1].reseauLocal.measured, true);
  assert.deepEqual(communes[0].etudesSup, { measured: true, weightedAccess: 12, radiusKm: 5, conventionVersion: "higher-education-radius-adaptive-v1" });
  assert.deepEqual(communes[1].etudesSup, { measured: true, weightedAccess: 0, radiusKm: 25, conventionVersion: "higher-education-radius-adaptive-v1" });
});

test("REFUSE si un INSEE de l'index manque dans un record", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  delete networkRecords["2"];
  assert.throws(() => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }), /INSEE/);
});
test("REFUSE un weightedAccess négatif ou non fini", () => {
  const { communes, networkRecords, bpeRecords } = fixture();
  bpeRecords["2"].etudes_acces.count = -1;
  assert.throws(() => buildAbsenceAttestations({ communes, networkRecords, bpeRecords }), /weightedAccess|count/);
});

// PARITÉ RAYON : une fonction en escalier est fixée par ses seuils. On les teste tous, + null/sans-uu.
test("radiusFor reproduit la table Python aux points de rupture", () => {
  assert.equal(radiusFor(500000), 5); assert.equal(radiusFor(499999), 10);
  assert.equal(radiusFor(100000), 10); assert.equal(radiusFor(99999), 15);
  assert.equal(radiusFor(30000), 15);  assert.equal(radiusFor(29999), 25);
  assert.equal(radiusFor(0), 25);      assert.equal(radiusFor(null), 25);
});
test("tailleVilleFrom : uuPop si uu connu, sinon population (réplique Python)", () => {
  const uuPop = new Map([["u1", 600000]]);
  assert.equal(tailleVilleFrom("u1", 5000, uuPop), 600000);
  assert.equal(tailleVilleFrom("uX", 5000, uuPop), 5000); // uu inconnu -> pop
  assert.equal(tailleVilleFrom(null, 5000, uuPop), 5000);
  assert.equal(tailleVilleFrom(null, null, uuPop), null);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test scripts/lib/absence-attestations.test.mjs`
  Expected: FAIL `Cannot find module`.

- [ ] **Step 3 : Implémenter la lib pure**

```js
// scripts/lib/absence-attestations.mjs
// Jointure PURE records -> attestations d'absence, avec validation stricte. Aucune I/O : reçoit les objets
// déjà lus (SANS leur bloc meta éventuel), mute `communes` en place, jette sur anomalie.
const NETWORK_CONVENTION = "daily-transit-access-v1";
const HIGHER_ED_CONVENTION = "higher-education-radius-adaptive-v1";

// Réplique EXACTE de radius_for (populate-bpe.py) : seuils 30k/100k/500k, rural par défaut.
export function radiusFor(taille) {
  if (taille == null) return 25;
  if (taille >= 500000) return 5;
  if (taille >= 100000) return 10;
  if (taille >= 30000) return 15;
  return 25;
}
// Réplique EXACTE de taille_ville (populate-bpe.py) : uuPop si uu connu, sinon population.
export function tailleVilleFrom(uu, population, uuPop) {
  if (uu && uuPop.has(uu)) return uuPop.get(uu);
  return population ?? null;
}

export function buildAbsenceAttestations({ communes, networkRecords, bpeRecords }) {
  const uuPop = new Map();
  for (const c of communes) if (c.uu && c.population != null) uuPop.set(c.uu, (uuPop.get(c.uu) ?? 0) + c.population);

  const seen = new Set();
  let netBelow = 0, supAbsent = 0;
  for (const c of communes) {
    if (seen.has(c.insee)) throw new Error(`doublon INSEE ${c.insee}`);
    seen.add(c.insee);
    if (!(c.insee in networkRecords)) throw new Error(`INSEE ${c.insee} absent du record réseau`);
    if (!(c.insee in bpeRecords)) throw new Error(`INSEE ${c.insee} absent du record BPE`);

    const r = networkRecords[c.insee];
    if (r == null) {
      c.reseauLocal = { acces: null, measured: true, conventionVersion: NETWORK_CONVENTION };
      netBelow++;
    } else {
      if (!Number.isFinite(r.acces) || r.acces < 1 || r.acces > 100) throw new Error(`acces invalide pour ${c.insee}: ${r.acces}`);
      c.reseauLocal = { ...r, measured: true, conventionVersion: NETWORK_CONVENTION };
    }

    const weightedAccess = bpeRecords[c.insee]?.etudes_acces?.count;
    if (!Number.isFinite(weightedAccess) || weightedAccess < 0) throw new Error(`weightedAccess (count) invalide pour ${c.insee}: ${weightedAccess}`);
    const radiusKm = radiusFor(tailleVilleFrom(c.uu ?? null, c.population ?? null, uuPop));
    // establishmentCount ABSENT du cache actuel : le producteur le portera (Task 8). classify retombe sur weightedAccess.
    c.etudesSup = { measured: true, weightedAccess, radiusKm, conventionVersion: HIGHER_ED_CONVENTION };
    if (weightedAccess === 0) supAbsent++;
  }

  const N = communes.length;
  return {
    report: [
      `${N} communes jointes`,
      `${netBelow} sous le plancher réseau (${(100 * netBelow / N).toFixed(1)} %)`,
      `${supAbsent} sans établissement supérieur (${(100 * supAbsent / N).toFixed(1)} %)`,
    ].join("\n"),
    prevalence: { networkAbsent: netBelow, higherEdAbsent: supAbsent, communeCount: N },
  };
}
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test scripts/lib/absence-attestations.test.mjs`
  Expected: PASS (5 tests).

- [ ] **Step 5 : Écrire le script d'I/O** (TypeScript `.mts`, garde de prévalence, tmp unique, garde clone frais)

```ts
// scripts/populate-absence-attestations.mts
// Enrichit data/comparateur-index.json avec les attestations d'absence (réseau + études), depuis les caches
// producteurs. AUCUN re-fetch OSM/BPE. ATOMIQUE : tmp UNIQUE -> round-trip -> rename (finally cleanup). REFUSE
// sur anomalie (set-equality, prévalence divergente, meta.complete faux). En .mts pour importer les constantes
// TS (source unique de la prévalence), comme populate-mismatch-rank.mts.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { buildAbsenceAttestations } from "./lib/absence-attestations.mjs";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { ABSENCE_NATIONAL_CONTEXT, ABSENCE_DISTRIBUTION_VERSION } from "../src/lib/decision/absence-facts.ts";

const ROOT = process.cwd();
const INDEX = path.join(ROOT, "data", "comparateur-index.json");
const NET = path.join(ROOT, "data", ".cache", "communes-reseau-local.json");
const BPE = path.join(ROOT, "data", ".cache", "communes-bpe.json");
const PREVALENCE_TOL = 0.005; // 0,5 point

const sha256 = (buf: string) => crypto.createHash("sha256").update(buf).digest("hex");
// Accepte la forme plate (insee->valeur) ET la forme future { meta, communes }.
const records = (cache: Record<string, unknown>) =>
  (cache.communes && typeof cache.communes === "object" ? cache.communes : cache) as Record<string, unknown>;
const metaOf = (cache: Record<string, unknown>) => (cache.meta ?? null) as { complete?: boolean; failedTiles?: unknown[] } | null;

async function main() {
  assertIndexWorktree(); // garde clone frais : message clair plutôt qu'un ENOENT brut

  const [idxRaw, netRaw, bpeRaw] = await Promise.all([fs.readFile(INDEX, "utf8"), fs.readFile(NET, "utf8"), fs.readFile(BPE, "utf8")]);
  const idx = JSON.parse(idxRaw);
  const netCache = JSON.parse(netRaw), bpeCache = JSON.parse(bpeRaw);
  const networkRecords = records(netCache), bpeRecords = records(bpeCache);

  // Si un cache porte déjà un meta de complétude, l'exiger.
  for (const [name, m] of [["réseau", metaOf(netCache)], ["BPE", metaOf(bpeCache)]] as const) {
    if (m && (m.complete !== true || (Array.isArray(m.failedTiles) && m.failedTiles.length > 0))) {
      console.error(`REFUS: cache ${name} incomplet (complete=${m.complete}, failedTiles=${m.failedTiles?.length})`); process.exit(1);
    }
  }

  // Set-equality strict : index == réseau == BPE, mêmes codes uniques.
  const idxSet = new Set(idx.communes.map((c: { insee: string }) => c.insee));
  for (const [name, rec] of [["réseau", networkRecords], ["BPE", bpeRecords]] as const) {
    const keys = Object.keys(rec);
    if (keys.length !== idxSet.size) { console.error(`REFUS: record ${name} a ${keys.length} codes, index ${idxSet.size}`); process.exit(1); }
    for (const k of keys) if (!idxSet.has(k)) { console.error(`REFUS: ${k} dans le record ${name}, absent de l'index`); process.exit(1); }
  }

  let out;
  try {
    out = buildAbsenceAttestations({ communes: idx.communes, networkRecords, bpeRecords });
  } catch (e) { console.error(`REFUS: ${(e as Error).message}`); process.exit(1); }

  // GARDE DE PRÉVALENCE : les constantes TS (source unique) doivent coller au calcul, sinon le texte ment.
  const nP = out.prevalence.networkAbsent / out.prevalence.communeCount;
  const hP = out.prevalence.higherEdAbsent / out.prevalence.communeCount;
  if (Math.abs(nP - ABSENCE_NATIONAL_CONTEXT.network!.prevalence) > PREVALENCE_TOL ||
      Math.abs(hP - ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence) > PREVALENCE_TOL) {
    console.error(`REFUS: prévalence divergente (réseau ${nP.toFixed(3)} vs ${ABSENCE_NATIONAL_CONTEXT.network!.prevalence}, études ${hP.toFixed(3)} vs ${ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence}). Mettre à jour ABSENCE_NATIONAL_CONTEXT + ABSENCE_DISTRIBUTION_VERSION.`);
    process.exit(1);
  }

  idx.meta = { ...(idx.meta ?? {}), absenceAttestations: {
    version: "absence-attestations-v1", distributionVersion: ABSENCE_DISTRIBUTION_VERSION,
    communeCount: out.prevalence.communeCount,
    network: { measuredCount: out.prevalence.communeCount, absentCount: out.prevalence.networkAbsent },
    higherEd: { measuredCount: out.prevalence.communeCount, absentCount: out.prevalence.higherEdAbsent },
    networkCacheSha256: sha256(netRaw), bpeCacheSha256: sha256(bpeRaw),
  } };

  console.log(out.report);

  const tmp = `${INDEX}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(idx));
    const check = JSON.parse(await fs.readFile(tmp, "utf8"));
    if (!check.communes.some((c: { reseauLocal?: { measured?: boolean } }) => c.reseauLocal?.measured) ||
        !check.communes.some((c: { etudesSup?: unknown }) => c.etudesSup)) {
      console.error("REFUS: attestation perdue à l'écriture"); process.exit(1);
    }
    if (!check.communes.some((c: { nature?: unknown }) => c.nature)) { console.error("REFUS: enrichissement existant perdu"); process.exit(1); }
    await fs.rename(tmp, INDEX);
  } finally {
    await fs.rm(tmp, { force: true });
  }
  console.log("✓ index patché (absenceAttestations)");
}
main();
```

- [ ] **Step 6 : Restaurer la copie de travail si besoin, puis enrichir**

```bash
[ -f data/comparateur-index.json ] || npm run index:unpack
cp data/comparateur-index.json /tmp/index-backup-absence.json
node scripts/populate-absence-attestations.mts
```

  Expected : `34788 communes jointes`, `~28803 sous le plancher réseau (82.8 %)`,
  `~14069 sans établissement supérieur (40.4 %)`, puis `✓ index patché`. (Si la prévalence réelle diffère de
  `0.828`/`0.404` de plus de 0,5 pt, le script REFUSE : ajuster `ABSENCE_NATIONAL_CONTEXT` avec les vraies
  valeurs mesurées + bumper `ABSENCE_DISTRIBUTION_VERSION`, puis relancer.)

- [ ] **Step 7 : Packer et vérifier** — Run: `npm run index:pack && npm run index:verify`
  Expected: gz reconstruit, `Index vérifié.`

- [ ] **Step 8 : Commit** (le `.gz` canonique + le code)

```bash
git add scripts/lib/absence-attestations.mjs scripts/lib/absence-attestations.test.mjs scripts/populate-absence-attestations.mts data/comparateur-index.json.gz
git commit -m "feat(absence): enrichissement des attestations (atomique, set-equality, parité rayon, garde prévalence)"
```

---

## Task 8 : Les producteurs modifiés (préventif, sans re-run) + invariant OSM au niveau load_osm

**Files:**
- Modify: `scripts/populate-reseau-local.py` (bloc `--write-index` + écriture cache), `scripts/populate-bpe.py`
  (bloc `--write-index` + écriture cache)
- Create: `scripts/populate-reseau-local.test.mjs` (invariant `load_osm`)

**But :** un FUTUR rebuild conserve ces champs. On NE re-tourne PAS les producteurs.

- [ ] **Step 1 : `populate-reseau-local.py`** — le bloc `--write-index` (fin de `main`), + `meta` de complétude
  dans le cache (écrit plus haut, à l'endroit `json.dump(rec, open(OUT_CACHE, "w"))`) :

  Cache (remplacer le `json.dump(rec, ...)`) :
```python
    json.dump({"meta": {"complete": True, "failedTiles": [], "communeCount": len(idx["communes"])}, "communes": rec}, open(OUT_CACHE, "w"))
```

  `--write-index` :
```python
    if args.write_index:
        geoloc = {c["insee"] for c in communes}  # communes réellement mesurées (lat/lon présents)
        for c in idx["communes"]:
            ins = c["insee"]
            r = rec.get(ins)
            if r is not None:
                c["reseauLocal"] = {**r, "measured": True, "conventionVersion": "daily-transit-access-v1"}
            elif ins in geoloc:
                c["reseauLocal"] = {"acces": None, "measured": True, "conventionVersion": "daily-transit-access-v1"}
            else:
                c["reseauLocal"] = None  # non géolocalisée = NON mesurée
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (reseauLocal + measured)", file=sys.stderr)
```

  **Note :** `rec` est maintenant lu ailleurs sous `{"meta", "communes"}`. Le patch (Task 7) accepte déjà les
  deux formes (`cache.communes ?? cache`). La ré-écriture du cache n'est PAS re-tournée dans ce lot : elle vaut
  pour les futurs rebuilds.

- [ ] **Step 2a : `count_within_radius` renvoie aussi le compte.** Dans `populate-bpe.py`, faire retourner à
  `count_within_radius` un tuple `(out, counts)` où `counts[i] = int((d <= radius[i]).sum())` (le vrai nombre
  d'équipements dans le rayon, distinct de la somme pondérée `out`) ; pour une commune sans voisin (`if not
  idxs: continue`), `counts[i]` reste `0`. Puis, dans la boucle des 3 champs, unpacker :

```python
    est_counts = None
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU), ("etudes_acces", SUP_TYPEQU)):
        elat, elon = load_equip_points(typeset)
        counts, ecount = count_within_radius(clat, clon, elat, elon, radius)  # (pondéré, compte)
        scores = percentile_scores(counts)
        if field == "etudes_acces":
            est_counts = ecount  # le vrai compte d'établissements du supérieur, par commune (aligné sur codes)
        for i, code in enumerate(codes):
            rec[code][field] = {"score": scores[i], "count": round(float(counts[i]), 2)}
```

- [ ] **Step 2b : `--write-index` ajoute `etudesSup`** (le rayon effectif est dans `radius`) :

```python
    if args.write_index:
        rfor = {code: int(radius[i]) for i, code in enumerate(codes)}       # rayon effectif (5/10/15/25)
        ecount = {code: int(est_counts[i]) for i, code in enumerate(codes)} # vrai compte d'établissements sup
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
            c["etudes_acces"] = r["etudes_acces"]["score"] if r else None
            if r is not None:
                c["etudesSup"] = {
                    "measured": True,
                    "weightedAccess": r["etudes_acces"]["count"], # accès pondéré brut (== 0 <=> aucun étab, hors bord)
                    "establishmentCount": ecount.get(c["insee"], 0), # vrai compte, airtight
                    "radiusKm": rfor.get(c["insee"], 25),
                    "conventionVersion": "higher-education-radius-adaptive-v1",
                }
            else:
                c["etudesSup"] = None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (ecoles + culture + etudes_acces + etudesSup)", file=sys.stderr)
```

- [ ] **Step 2c : `meta` du cache BPE** — remplacer le `json.dump(rec, open(OUT, "w"))` par :

```python
    json.dump({"meta": {"complete": True, "communeCount": len(idx["communes"])}, "communes": rec}, open(OUT, "w"))
```

- [ ] **Step 3 : Test d'équivalence côté producteur (selftest Python)** — ajouter à `selftest()` de
  `populate-bpe.py` une assertion synthétique : sur des équipements et communes fabriqués, `establishmentCount
  == 0` ⟺ `weightedAccess == 0` HORS un établissement placé à exactement `DMAX` km (cas-frontière rural). Un
  cas positif (établissement à 5 km, rayon 25) : `count == 1`, `weightedAccess == 1 - 5/25 == 0.8 > 0`. Un cas
  nul (aucun établissement) : `count == 0`, `weightedAccess == 0`.

- [ ] **Step 4 : Prouver l'invariant crash-on-failure AU NIVEAU load_osm** — un test qui monkeypatch
  `fetch_tile` pour lever, appelle `load_osm`, et vérifie que `load_osm` PROPAGE (aucun cache produit) :

```js
// scripts/populate-reseau-local.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("load_osm PROPAGE l'échec d'une tuile (aucun cache partiel)", () => {
  const py = `
import importlib.util, os
spec = importlib.util.spec_from_file_location("p", "scripts/populate-reseau-local.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.fetch_tile = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("tuile échouée"))
# force un miss de cache tuile pour que load_osm appelle fetch_tile
m.OSM_TILE_DIR = "/tmp/osm-tiles-should-not-exist-" + str(os.getpid())
try:
    m.load_osm(refresh=True)
    print("NO_RAISE")
except RuntimeError:
    print("RAISED")
`;
  const out = execFileSync(".venv-bpe/bin/python", ["-c", py], { encoding: "utf8" }).trim();
  assert.match(out, /RAISED/);
});
```

- [ ] **Step 5 : Lancer** — Run: `node --test scripts/populate-reseau-local.test.mjs`
  Expected: PASS (`RAISED`). Si `.venv-bpe/bin/python` n'existe pas, utiliser `python3`.

- [ ] **Step 6 : Commit** (aucune régénération de l'index : les scripts ne sont PAS re-tournés)

```bash
git add scripts/populate-reseau-local.py scripts/populate-bpe.py scripts/populate-reseau-local.test.mjs
git commit -m "feat(absence): producteurs portent les attestations + establishmentCount (préventif), invariant load_osm testé"
```

---

## Task 9 : Le prompt, le bump, la sonde

**Files:**
- Modify: `src/lib/decision/conclusion-hash.ts`, `src/lib/decision/conclusion-prompt.ts`, `scripts/probe-conclusion.ts`

- [ ] **Step 1 : Bump** — `conclusion-hash.ts` : `export const DECISION_NARRATIVE_PROMPT_VERSION = "v8";`.

- [ ] **Step 2 : Étendre le prompt** (verbatim, sans tiret cadratin, sans antithèse). Trouver la section
  mismatch (v7) et AJOUTER :

```
UNE ABSENCE ATTESTÉE est un mismatch fondé sur un fait vérifié : un élément recherché (un réseau de transports
en commun du quotidien, un établissement du supérieur) n'existe pas à portée, et le calcul a bien été exécuté
pour cette commune, autour du point de référence retenu. La nommer au grain mesuré (« aucun … identifié autour
du point de référence retenu »), jamais en jugement qualitatif absolu (« insuffisant », « manque », « la vie
étudiante est faible »). Ne jamais généraliser au-delà de l'indicateur : « aucun établissement du supérieur »
ne veut pas dire « aucune vie étudiante ». Comme tout mismatch, cela s'ARBITRE, jamais « à vérifier ».
```

- [ ] **Step 3 : Étendre la sonde** — dans `scripts/probe-conclusion.ts`, ajouter (sur le modèle des cas
  existants) : un dossier `arbitration` porté par une absence attestée mobilité (poids 3) ; un dossier mixte
  (absence + réserve) ; un dossier `neutral` (mobilité présente + reste médian). Construire les `MismatchFact`
  avec `basis.kind === "named_absence"` et `nationalContext` renseigné.

- [ ] **Step 4 : Lancer la sonde** — Run: `node --env-file=.env.local scripts/probe-conclusion.ts`
  Expected: cas d'origine au vert + nouveaux cas absence retenus (aucun bloc en repli). Un repli = corriger le
  prompt, relancer.

- [ ] **Step 5 : Vérifier l'invalidation** — Run: `node --test src/lib/decision/conclusion-hash.test.ts`
  Expected: le hash change avec la version (les conclusions v7 ne sont pas resservies).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/conclusion-hash.ts src/lib/decision/conclusion-prompt.ts scripts/probe-conclusion.ts
git commit -m "feat(absence): le prompt nomme une absence attestée (fait dans le périmètre, arbitrer), bump v8, sonde repassée"
```

---

## Task 10 : Vérification bout-en-bout, et handoff

- [ ] **Step 1 : Bout en bout (absence structurante)** — un projet « me déplacer sans voiture au quotidien »
  (poids 3) sur une commune rurale sans réseau ni établissement du supérieur. Vérifier (API dossier ou écran) :
  la section « Ce qui correspond moins bien » porte une carte d'absence au grain « point de référence retenu »,
  jamais un jugement qualitatif absolu ; l'orientation `arbitration`, verdict « Arbitrage » ; la couverture
  montée (mobilité examinée).

- [ ] **Step 2 : Le cas symétrique** — la même recherche sur une métropole desservie : mobilité rend `neutral`
  (silencieux), la couverture monte, aucune carte d'absence, l'orientation ne se dégrade PAS ; vie étudiante
  avec un établissement à portée → `neutral`.

- [ ] **Step 3 : Le cas « non mesuré »** — forcer un `localNetwork: { status: "unavailable" }` (commune
  pré-patch simulée) → `uncertain`, aucune carte, couverture NON acquise.

- [ ] **Step 4 : Build + suite complète** — Run:

```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts && node --test scripts/lib/*.test.mjs scripts/*.test.mjs && npx tsc --noEmit && npm run index:verify && npm run build
```

  Expected: tests verts, tsc 0, index vérifié, build exit 0.

- [ ] **Step 5 : Handoff** — `docs/handoff/CURRENT.md` : mismatch lot 2a livré (couverture 19 → 21, forme
  `named_absence` sur mobilité + vie étudiante, attestations dans l'index + `index.meta.absenceAttestations`).
  Reste : lot 2b (`acces_services` en `relative_position`), lot 3 (mer = `absolute_measure`, taille =
  `categorical_state`), les 2 critères résiduels + `ProjectFit × DecisionConfidence`. Noter le pipeline
  (`node scripts/populate-absence-attestations.mts` puis `npm run index:pack`).

## Critères d'acceptation (spec §12)

1. `MismatchFact.basis` est l'union `NamedAbsenceBasis | RelativePositionBasis` ; la v1 passe sans régression.
2. Mobilité déclarée (poids 2/3), réseau mesuré sous plancher → `mismatch` matériel, `basis.kind ===
   "named_absence"`, `observedStateId === "network_below_daily_credibility_floor"`, grain « point de référence ».
3. Vie étudiante, absence attestée (`establishmentCount === 0` si présent, sinon `weightedAccess === 0`) →
   `mismatch` citant le `radiusKm` exact (parité prouvée) ; jamais « aucune vie étudiante ».
4. Présent → `neutral` silencieux (couverture acquise, aucune carte). Jamais `satisfied`.
5. `status: "unavailable"` ou valeur corrompue → `uncertain` (couverture non acquise, aucune valeur inventée).
6. Poids 1 → examiné + silencieux (test d'orientation) ; poids 2 → secondary ; poids 3 → structuring ; jamais
   `decision_critical` ; ensemble matériel → `arbitration` (comptage sur `run.facts`).
7. Le patch : set-equality strict sur `records = cache.communes ?? cache`, refus sur anomalie / `meta.complete`
   faux / prévalence divergente, tmp unique + `finally` + garde clone frais, `index.meta` avec numérateurs.
   `subScore` INCHANGÉ.
8. Un test au niveau `load_osm` prouve la propagation de l'échec (pas de cache partiel).
9. `DECISION_NARRATIVE_PROMPT_VERSION` → `"v8"`, sonde repassée, artefacts invalidés.
10. `node --test` (src + scripts/lib) vert, `npx tsc --noEmit` rend 0, `npm run index:verify` OK,
    `npm run build` exit 0.

## Ce que ce lot ne fait PAS (rappel spec §11)

- Lot 2b : `acces_services` en `relative_position`.
- Lot 3 : `proximite_mer` (`absolute_measure`), préférences de taille (`categorical_state`).
- La fusion de deux mismatchs en compromis narratif, et `ProjectFit × DecisionConfidence`.

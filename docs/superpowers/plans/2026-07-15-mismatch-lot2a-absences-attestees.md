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
positive** (« mesurée, sous le plancher » vs « présente » vs « non mesurée ») est portée dans l'index par un
script de patch lisant les caches producteurs (aucun re-fetch OSM/BPE). Une **fabrique de règles** produit les
2 règles d'absence, avec la doctrine asymétrique (absence → mismatch, présence → neutral, jamais satisfied).
Tout l'aval (section « mismatches », orientation `arbitration`/`neutral`, comptage matériel) est **déjà livré
par la v1** : ce lot ne le retouche pas.

**Tech Stack:** TypeScript, Next.js, `node --test`, Python (producteurs), l'index national gzip canonique
`data/comparateur-index.json.gz` (copie de travail `data/comparateur-index.json`, gitignorée, restaurée par
`npm run index:unpack`).

## Global Constraints

- **Le dossier ne re-dérive AUCUNE formule.** L'absence se lit sur une **attestation** portée par l'index
  (`reseauLocal.measured` + `acces`, `etudesSup.count`), jamais recalculée.
- **Une absence n'est opposable que si la recherche est prouvée.** `mesurée + sous plancher` → `mismatch` ;
  `non mesurée / indisponible` → `uncertain`. Les deux ne doivent JAMAIS se confondre sous un même `null`.
- **Aucun repli `?? 0` / `?? 100` ne traverse le dossier.** Le scoring du comparateur (`subScore`) reste
  INCHANGÉ : le champ `acces` est conservé (jamais renommé `access`), `etudes_acces` score conservé.
- **Doctrine asymétrique** : absence → `mismatch`, présence → `neutral` (silencieux), **jamais `satisfied`**.
  Les signaux favorables restent le domaine des 10 critères v1.
- **Le POIDS gouverne la MATÉRIALITÉ, jamais l'EXAMINABILITÉ.** Poids 0 → `not_applicable`. Poids 1 → examiné
  (couverture +1), silencieux (aucune carte, pas d'arbitrage). Poids 2 → `secondary`. Poids 3 → `structuring`.
  **Jamais `decision_critical`.**
- **`nationalContext` (prévalence) ≠ `conventionId`** : la prévalence est un résultat de distribution DATÉ
  (`ABSENCE_DISTRIBUTION_VERSION`), la convention est la doctrine du plancher.
- **L'union `MismatchBasis` ne porte QUE les fondements productibles** : `NamedAbsenceBasis |
  RelativePositionBasis`. Les variantes mer/taille (lot 3) restent hors du type.
- **Union active, provenance explicite** : un fait d'absence a `sourceFactIds = ["absenceAttestation.${key}"]`
  et `evidence[0].factId = "absenceAttestation.${key}"`, JAMAIS `scores.*`.
- **Comparatif jamais absolu** (« aucun … identifié », pas « insuffisant »/« manque »). **Pas de tiret
  cadratin. Pas d'antithèse « c'est X, pas Y ».** Grain = « point de référence retenu ».
- **Le patch d'enrichissement est ATOMIQUE** (tmp → round-trip → rename), refuse sur anomalie, et le set des
  INSEE doit coïncider exactement (index == cache réseau == cache BPE == 34 788 codes uniques).
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit`
  rend 0. La sonde ne repasse qu'à la Task 9.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/comparateur-vie.ts` **(modifié)** | `IndexCommune.reseauLocal` (acces nullable + `measured` + `conventionVersion`) ; `IndexCommune.etudesSup` ; gardes des 3 sites lecteurs (714, 758, 2027). |
| `src/lib/decision/absence-facts.ts` **(créé)** | PUR. Conventions/versions, types d'attestation, `classifyNetworkAbsence`/`classifyHigherEdAbsence`, `NamedAbsenceBasis`, `ABSENCE_NATIONAL_CONTEXT`. |
| `src/lib/decision/decision-fact.ts` **(modifié)** | `MismatchBasis` union (`NamedAbsenceBasis | RelativePositionBasis`) ; `MismatchFact.basis` typé union ; `ModuleFacts.localNetwork` + `ModuleFacts.higherEd`. |
| `src/lib/decision/mismatch-rules.ts` **(modifié)** | Le littéral `relative_position` gagne `distributionVersion` (mise à la forme union). |
| `src/lib/decision/module-facts-map.ts` **(modifié)** | Mappe `localNetwork` et `higherEd` depuis `entry`. |
| `src/lib/decision/absence-rules.ts` **(créé)** | PUR. La fabrique des 2 règles d'absence, la doctrine du poids, les libellés. |
| `src/lib/decision/materiality-rules.ts` **(modifié)** | `...ABSENCE_RULES` au REGISTRY ; `case "mismatch"` dans `assertFactValid`. |
| `scripts/lib/absence-attestations.mjs` **(créé)** | PUR. La jointure caches → attestations + validation stricte (set-equality, valeurs). |
| `scripts/lib/absence-attestations.test.mjs` **(créé)** | Tests de la jointure pure. |
| `scripts/populate-absence-attestations.mjs` **(créé)** | I/O : lit caches + index, appelle la lib pure, écrit ATOMIQUEMENT, rapport, `index.meta`. |
| `scripts/populate-reseau-local.py`, `scripts/populate-bpe.py` **(modifiés)** | Préventif : `--write-index` porte les nouveaux champs ; cache gagne un bloc `meta`. NON re-tournés. |
| `src/lib/decision/conclusion-prompt.ts`, `conclusion-hash.ts` **(modifiés)** | Le prompt nomme une absence attestée ; bump `v7` → `v8`. |
| `scripts/probe-conclusion.ts` **(modifié)** | Cas absence attestée + présence → neutral. |

---

## Task 1 : Les types côté index, et le collatéral `comparateur-vie`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `IndexCommune`, lignes ~488-493 et ~514 ; sites lecteurs 714, 758, 2027)
- Test: `src/lib/comparateur-vie-reseau-shape.test.ts` **(créé)**

**Interfaces:**
- Produces: `IndexCommune.reseauLocal` = `{ acces: number | null; tram?: boolean; metro?: boolean; arret_km?: number; measured?: boolean; conventionVersion?: string } | null` ; `IndexCommune.etudesSup?: { measured: boolean; count: number; radiusKm: number; conventionVersion?: string } | null`.

**Pourquoi cette tâche existe :** l'attestation d'absence réseau se matérialise en passant les communes sous
plancher de `reseauLocal = null` à `reseauLocal = { acces: null, measured: true }`. Rendre `acces` nullable et
l'objet présent pour 82,8 % des communes change la truthiness de `if (c.reseauLocal)` à 3 endroits. Un site
(ligne 758, `buildTerritorySignals`) régresserait sémantiquement (« desservie: true » pour une commune sans
réseau). On corrige AVANT d'écrire l'attestation.

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
  // et son rang canonique reste null (pas de repli)
  assert.equal(signatureScore("mobilite_quotidienne", c), null);
});

test("une commune DESSERVIE (acces number) reste desservie", () => {
  const c = { ...base, reseauLocal: { acces: 72, tram: true, metro: false, arret_km: 0.4, measured: true } } as IndexCommune;
  const s = buildTerritorySignals(c) as { transports_commun: { desservie: boolean; tramway: boolean } };
  assert.equal(s.transports_commun.desservie, true);
  assert.equal(s.transports_commun.tramway, true);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/comparateur-vie-reseau-shape.test.ts`
  Expected: FAIL (soit `tsc`/runtime sur `acces: null`, soit `desservie` vaut `true` au premier test).

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
  // Attestation « établissements du supérieur » (lot 2a) : count BRUT (0 = aucun dans le rayon), rayon
  // adaptatif effectif, statut de mesure. Distinct de etudes_acces (percentile de score).
  etudesSup?: { measured: boolean; count: number; radiusKm: number; conventionVersion?: string } | null;
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

  Ligne ~2027 (label distinctif `mobilite_quotidienne`) — garder le mode seulement sur une commune desservie :

```ts
  mobilite_quotidienne: (c) => {
    const r = c.reseauLocal;
    const mode = r?.metro ? "métro" : r?.tram ? "tram" : "bus";
    return `réseau de ${mode} à portée de marche`;
  },
```

  (Ce label n'est émis que pour un critère FAVORABLE distinctif ; une commune sous plancher n'y parvient pas.
  Aucune modification nécessaire, `r?.metro` est déjà nullable-safe. Ne pas toucher.)

- [ ] **Step 5 : Lancer, vérifier** — Run: `node --test src/lib/comparateur-vie-reseau-shape.test.ts && npx tsc --noEmit`
  Expected: PASS, tsc 0. Puis la parité scoring intacte : `node --test src/lib/comparateur-scores.test.ts`.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-vie-reseau-shape.test.ts
git commit -m "feat(absence): IndexCommune porte l'attestation reseau/etudesSup, gardes des sites lecteurs"
```

---

## Task 2 : La classification d'absence (pure)

**Files:**
- Create: `src/lib/decision/absence-facts.ts`, `src/lib/decision/absence-facts.test.ts`

**Interfaces:**
- Produces:
```ts
export const NETWORK_CONVENTION_ID = "daily-transit-access-v1";
export const HIGHER_ED_CONVENTION_ID = "higher-education-radius-adaptive-v1";
export const ABSENCE_DISTRIBUTION_VERSION = "absence-dist-2026-07-15";
export type LocalNetworkAttestation = { measured: boolean; access: number | null };
export type HigherEdAttestation = { measured: boolean; count: number; radiusKm: number };
export type AbsenceVerdict = "mismatch" | "neutral" | "uncertain";
export type NamedAbsenceBasis = {
  kind: "named_absence";
  observedStateId: "network_below_daily_credibility_floor" | "no_higher_education_establishment_in_radius";
  conventionId: string;
  nationalContext: { prevalence: number; validCount: number; totalCount: number; universe: "communes_france"; distributionVersion: string } | null;
};
export function classifyNetworkAbsence(a: LocalNetworkAttestation | null): AbsenceVerdict;
export function classifyHigherEdAbsence(a: HigherEdAttestation | null): AbsenceVerdict;
export const ABSENCE_NATIONAL_CONTEXT: Record<"network" | "higherEd", NamedAbsenceBasis["nationalContext"]>;
```

**Notes :** la prévalence nationale est une constante DATÉE (mesurée sur les 34 788 communes le 2026-07-15,
cf. spec §3) : 82,8 % sous plancher réseau, 40,4 % sans établissement du supérieur. Elle vit ici, versionnée
par `ABSENCE_DISTRIBUTION_VERSION`, dissociée des `conventionId`.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// src/lib/decision/absence-facts.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { classifyNetworkAbsence, classifyHigherEdAbsence, ABSENCE_NATIONAL_CONTEXT } from "./absence-facts.ts";

test("réseau : mesuré sous plancher (access null) -> mismatch", () => {
  assert.equal(classifyNetworkAbsence({ measured: true, access: null }), "mismatch");
});
test("réseau : mesuré et présent (access number) -> neutral", () => {
  assert.equal(classifyNetworkAbsence({ measured: true, access: 42 }), "neutral");
});
test("réseau : non mesuré -> uncertain (jamais une absence inventée)", () => {
  assert.equal(classifyNetworkAbsence({ measured: false, access: null }), "uncertain");
  assert.equal(classifyNetworkAbsence(null), "uncertain");
});
test("études : mesuré, count 0 -> mismatch ; count > 0 -> neutral ; non mesuré -> uncertain", () => {
  assert.equal(classifyHigherEdAbsence({ measured: true, count: 0, radiusKm: 25 }), "mismatch");
  assert.equal(classifyHigherEdAbsence({ measured: true, count: 3, radiusKm: 10 }), "neutral");
  assert.equal(classifyHigherEdAbsence({ measured: false, count: 0, radiusKm: 25 }), "uncertain");
  assert.equal(classifyHigherEdAbsence(null), "uncertain");
});
test("études : count invalide (négatif / non fini) -> uncertain, jamais un verdict", () => {
  assert.equal(classifyHigherEdAbsence({ measured: true, count: -1, radiusKm: 25 }), "uncertain");
  assert.equal(classifyHigherEdAbsence({ measured: true, count: Number.NaN, radiusKm: 25 }), "uncertain");
});
test("le contexte national est daté et dissocié des conventions", () => {
  assert.equal(ABSENCE_NATIONAL_CONTEXT.network!.distributionVersion, "absence-dist-2026-07-15");
  assert.ok(ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence > 0.3 && ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence < 0.5);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/absence-facts.test.ts`
  Expected: FAIL `Cannot find module './absence-facts.ts'`.

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/decision/absence-facts.ts
// LA DOCTRINE DE L'ABSENCE ATTESTÉE. Lib PURE : aucune I/O, aucun LLM.
//
// Une absence n'est un fait opposable que si la recherche a été PROUVÉE. La classification ne rend « mismatch »
// que sur une mesure RÉUSSIE dont le résultat atteint le plancher d'absence ; une mesure indisponible reste
// « uncertain ». C'est la même exigence que le chantier A (jamais un ?? 0 déguisé en verdict).

export const NETWORK_CONVENTION_ID = "daily-transit-access-v1";       // plancher de crédibilité TC du quotidien
export const HIGHER_ED_CONVENTION_ID = "higher-education-radius-adaptive-v1"; // C5xx dans rayon 5/10/15/25 km
export const ABSENCE_DISTRIBUTION_VERSION = "absence-dist-2026-07-15"; // millésime des prévalences

export type LocalNetworkAttestation = { measured: boolean; access: number | null };
export type HigherEdAttestation = { measured: boolean; count: number; radiusKm: number };
export type AbsenceVerdict = "mismatch" | "neutral" | "uncertain";

export type NamedAbsenceBasis = {
  kind: "named_absence";
  observedStateId: "network_below_daily_credibility_floor" | "no_higher_education_establishment_in_radius";
  conventionId: string;
  nationalContext:
    | { prevalence: number; validCount: number; totalCount: number; universe: "communes_france"; distributionVersion: string }
    | null;
};

export function classifyNetworkAbsence(a: LocalNetworkAttestation | null): AbsenceVerdict {
  if (a == null || a.measured !== true) return "uncertain"; // non mesuré : jamais une absence inventée
  return a.access == null ? "mismatch" : "neutral";         // sous plancher -> mismatch ; présent -> neutral
}

export function classifyHigherEdAbsence(a: HigherEdAttestation | null): AbsenceVerdict {
  if (a == null || a.measured !== true || !Number.isFinite(a.count) || a.count < 0) return "uncertain";
  return a.count === 0 ? "mismatch" : "neutral";
}

// Prévalences nationales MESURÉES le 2026-07-15 sur 34 788 communes (cf. spec §3). Datées, pas doctrinales.
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
git commit -m "feat(absence): classification d'absence attestée (mesuré+sous plancher -> mismatch, sinon uncertain/neutral)"
```

---

## Task 3 : Le `basis` en union discriminée, et les champs `ModuleFacts`

**Files:**
- Modify: `src/lib/decision/decision-fact.ts`, `src/lib/decision/mismatch-rules.ts`

**Interfaces:**
- Consumes: `NamedAbsenceBasis` (Task 2).
- Produces: `MismatchBasis = NamedAbsenceBasis | RelativePositionBasis` ; `MismatchFact.basis: MismatchBasis` ;
  `ModuleFacts.localNetwork: LocalNetworkAttestation` ; `ModuleFacts.higherEd: HigherEdAttestation`.

- [ ] **Step 1 : Modifier `decision-fact.ts`.** Importer les types, remplacer `MismatchFact.basis`, et ajouter
  les deux champs à `ModuleFacts` :

```ts
// en tête, avec les autres imports type-only :
import type {
  NamedAbsenceBasis, LocalNetworkAttestation, HigherEdAttestation,
} from "./absence-facts.ts";

// LE FONDEMENT d'un mismatch : union discriminée. On ne porte QUE les fondements productibles aujourd'hui.
// La mesure physique (mer) et la catégorie d'agglo (taille) viendront au lot 3, avec leur propre kind.
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
  // Attestations d'absence (lot 2a), chargées par le mapping depuis l'index. NON optionnelles : `measured:
  // false` porte explicitement « non mesurée », il n'y a pas de troisième état implicite.
  localNetwork: LocalNetworkAttestation;
  higherEd: HigherEdAttestation;
```

- [ ] **Step 2 : Mettre le littéral `relative_position` à la forme union** — `mismatch-rules.ts`, dans la
  construction du `MismatchFact` (~ligne 76), ajouter `distributionVersion` :

```ts
        basis: { kind: "relative_position", rankLow: band.low, rankHigh: band.high, universe: "communes_france", distributionVersion: MISMATCH_DISTRIBUTION_VERSION },
```

  (`MISMATCH_DISTRIBUTION_VERSION` est déjà importé dans ce fichier.)

- [ ] **Step 3 : Vérifier avec le VRAI gate (les unions et champs non optionnels sont un fait de compilation)**

  Run: `npx tsc --noEmit`
  Expected: `tsc` désigne les constructions de `ModuleFacts` sans `localNetwork`/`higherEd` (helpers de test de
  `mismatch-rules.test.ts`, `mismatch-facts.test.ts`, et tout autre helper). Ajouter à CHAQUE helper signalé :

```ts
    localNetwork: { measured: false, access: null },
    higherEd: { measured: false, count: 0, radiusKm: 0 },
```

  sans plus (les mappings réels sont traités Task 4). Re-lancer jusqu'à tsc 0.

- [ ] **Step 4 : Lancer la suite** — Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts && npx tsc --noEmit`
  Expected: PASS (rien n'a changé de comportement, juste des types élargis + defaults de test).

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

- [ ] **Step 1 : Écrire le test qui échoue** (réutiliser le style du fichier) :

```ts
// module-facts-map.test.ts — AJOUTER
test("mappe l'attestation réseau : mesurée sous plancher -> {measured:true, access:null}", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0,
    reseauLocal: { acces: null, measured: true } } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.localNetwork, { measured: true, access: null });
});
test("mappe l'attestation études : count depuis etudesSup", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0,
    etudesSup: { measured: true, count: 0, radiusKm: 25 } } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.deepEqual(mf.higherEd, { measured: true, count: 0, radiusKm: 25 });
});
test("index PRÉ-PATCH (aucune attestation) -> measured:false (jamais une absence inventée)", () => {
  const entry = { insee: "1", nom: "X", dept: "01", lat: 0, lon: 0, distance_cote_km: 0 } as never;
  const mf = mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: 1000, climat: null });
  assert.equal(mf.localNetwork.measured, false);
  assert.equal(mf.higherEd.measured, false);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/module-facts-map.test.ts`
  Expected: FAIL (`mf.localNetwork` undefined).

- [ ] **Step 3 : Implémenter** — dans le retour de `mapCommuneToModuleFacts`, après `rankBands` :

```ts
    // Attestations d'absence (lot 2a). Un index PRÉ-PATCH (champ absent, ou reseauLocal sans `measured`) rend
    // measured:false -> uncertain : jamais une absence inventée sur une donnée non attestée.
    localNetwork: (() => {
      const r = entry.reseauLocal;
      if (r == null) return { measured: false, access: null };
      return { measured: r.measured === true, access: r.acces };
    })(),
    higherEd: (() => {
      const e = entry.etudesSup;
      if (e == null) return { measured: false, count: 0, radiusKm: 0 };
      return { measured: e.measured === true, count: e.count, radiusKm: e.radiusKm };
    })(),
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test src/lib/decision/module-facts-map.test.ts && npx tsc --noEmit`
  Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/module-facts-map.ts src/lib/decision/module-facts-map.test.ts
git commit -m "feat(absence): mapping des attestations reseau/etudes vers ModuleFacts (pré-patch -> non mesuré)"
```

---

## Task 5 : La fabrique des 2 règles d'absence

**Files:**
- Create: `src/lib/decision/absence-rules.ts`, `src/lib/decision/absence-rules.test.ts`

**Interfaces:**
- Consumes: `classifyNetworkAbsence`/`classifyHigherEdAbsence`, `NamedAbsenceBasis`, conventions, contexte
  national (Task 2) ; `MismatchFact`, `ModuleFacts` (Task 3).
- Produces: `export const ABSENCE_RULES: DecisionRule[]` (2) ; `export const ABSENCE_KEYS: PreferenceKey[]`.

**Doctrine du poids (gravée)** : poids 0 → `not_applicable` ; poids 1 → outcome calculé mais `facts: []`
(silencieux, couverture +1, pas d'arbitrage) ; poids 2 → `secondary` ; poids 3 → `structuring`.

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
    localNetwork: { measured: false, access: null }, higherEd: { measured: false, count: 0, radiusKm: 0 },
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

test("la fabrique produit 2 règles", () => {
  assert.equal(ABSENCE_RULES.length, 2);
});

test("mobilité sous plancher + poids 3 -> mismatch STRUCTURANT, named_absence, comparatif, jamais absolu", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  const f = e.facts[0]!;
  assert.equal(f.role, "mismatch");
  assert.equal(f.basis.kind, "named_absence");
  assert.equal(f.materialityTier, "structuring");
  assert.match(f.statement, /point de référence retenu/);
  assert.doesNotMatch(f.statement, /insuffisant|manque|mauvais|médiocre/i);
  assert.equal(f.evidence[0]!.factId, "absenceAttestation.mobilite_quotidienne"); // JAMAIS scores.*
  assertFactValid(f, p);
});

test("mobilité PRÉSENTE -> neutral silencieux ; NON MESURÉE -> uncertain", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 3 }]);
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: 55 } }), p, undefined as never).outcome, "neutral");
  assert.equal(rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: false, access: null } }), p, undefined as never).outcome, "uncertain");
});

test("LE POIDS 1 : mismatch calculé mais SILENCIEUX (aucune carte)", () => {
  const p = project([{ key: "mobilite_quotidienne", weight: 1 }]);
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), p, undefined as never);
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("priorité absente (poids 0) -> not_applicable", () => {
  const e = rule("mobilite_quotidienne").evaluate(facts({ localNetwork: { measured: true, access: null } }), project([]), undefined as never);
  assert.equal(e.outcome, "not_applicable");
});

test("études : count 0 + poids 2 -> mismatch SECONDARY citant le rayon exact", () => {
  const p = project([{ key: "vie_etudiante", weight: 2 }]);
  const e = rule("vie_etudiante").evaluate(facts({ higherEd: { measured: true, count: 0, radiusKm: 25 } }), p, undefined as never);
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
  Expected: FAIL `Cannot find module './absence-rules.ts'`.

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/decision/absence-rules.ts
// LA FABRIQUE DES RÈGLES D'ABSENCE ATTESTÉE (named_absence). PURE.
//
// Doctrine ASYMÉTRIQUE : une absence-critère est une pénalité, jamais une force. absence attestée -> mismatch ;
// élément présent -> neutral (silencieux) ; non mesuré -> uncertain. JAMAIS satisfied (pas de seuil de
// « présence forte » inventé). Le POIDS gouverne la matérialité (poids 1 = silencieux), jamais l'examinabilité.
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
    observedValue: (f) => `aucun établissement du supérieur dans un rayon de ${f.higherEd.radiusKm} km`,
    statement: (nom, f) =>
      `Vous avez placé la présence d'un environnement étudiant parmi vos priorités. Aucun établissement d'enseignement supérieur n'est identifié dans un rayon de ${f.higherEd.radiusKm} km autour du point de référence retenu pour ${nom}. Cet indicateur répond moins bien à cette dimension de votre projet, sans permettre de conclure à l'absence de vie étudiante.`,
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

      // neutral (présent) toujours silencieux ; mismatch de poids 1 examiné mais silencieux (non matériel).
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
  Expected: PASS. (Note : `assertFactValid` gagnera son `case "mismatch"` en Task 6 ; les appels du test
  passent déjà tant qu'il n'y a pas de branche qui rejette — s'ils échouent, avancer la sous-étape
  `assertFactValid` de la Task 6 ici. Le comportement final est identique.)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/absence-rules.ts src/lib/decision/absence-rules.test.ts
git commit -m "feat(absence): fabrique des 2 règles d'absence (asymétrique, poids 1 silencieux, rayon cité)"
```

---

## Task 6 : Brancher au REGISTRY, et valider le basis

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts`
- Test: `src/lib/decision/materiality-rules.test.ts` (AJOUTER un test d'intégration ; réutiliser les helpers du fichier)

- [ ] **Step 1 : Écrire le test d'intégration qui échoue** — un projet priorisant la mobilité (poids 3) sur
  une commune sous plancher produit un `MismatchFact` d'absence dans le run :

```ts
// materiality-rules.test.ts — AJOUTER (adapter au helper de ModuleFacts/projet du fichier)
test("un projet priorisant la mobilité sur une commune SANS réseau produit un mismatch d'absence", () => {
  const f = moduleFacts({ localNetwork: { measured: true, access: null } }); // helper existant du fichier
  const run = runRules(f, projectWith([{ key: "mobilite_quotidienne", weight: 3 }]), context());
  const mm = run.facts.find((x) => x.role === "mismatch" && x.ruleId === "territoire.absence-mobilite_quotidienne");
  assert.ok(mm, "un fait d'absence mobilité doit être émis");
  assert.equal((mm as { basis: { kind: string } }).basis.kind, "named_absence");
});
```

  (Si le fichier n'a pas de helper `moduleFacts`/`context`/`projectWith`, construire l'entrée à la main sur le
  modèle des autres tests du fichier, en incluant `localNetwork`/`higherEd`.)

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test src/lib/decision/materiality-rules.test.ts`
  Expected: FAIL (aucune règle d'absence dans le REGISTRY).

- [ ] **Step 3 : Brancher.** Import + insertion dans `REGISTRY` (après `...MISMATCH_RULES`, avant
  `ruleInondation`) :

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
  Expected: PASS (l'intégration passe ; la v1 `relative_position` continue de valider).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/decision/materiality-rules.ts src/lib/decision/materiality-rules.test.ts
git commit -m "feat(absence): règles d'absence au REGISTRY + validation du basis de mismatch"
```

---

## Task 7 : Le patch d'enrichissement (lib pure + script + run)

**Files:**
- Create: `scripts/lib/absence-attestations.mjs`, `scripts/lib/absence-attestations.test.mjs`,
  `scripts/populate-absence-attestations.mjs`

**Interfaces:**
- Produces (lib pure) : `buildAbsenceAttestations({ communes, networkCache, bpeCache })` → `{ report, prevalence }`
  ET MUTE `communes` en place (ajoute `reseauLocal.measured`/`conventionVersion`, `etudesSup`). Jette `Error`
  sur toute anomalie (set INSEE, doublon, valeur invalide).

**Rappel** (spec §3, §8) : le rayon adaptatif est `5/10/15/25 km` par `tailleVille` ; `tailleVille` = pop d'UU
(somme par `uu`) sinon pop communale. Le cache BPE porte `etudes_acces.count` ; le cache réseau porte
`null` (sous plancher) ou `{acces,...}` (desservie).

- [ ] **Step 1 : Écrire le test qui échoue (lib pure)**

```js
// scripts/lib/absence-attestations.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildAbsenceAttestations } from "./absence-attestations.mjs";

function fixture() {
  const communes = [
    { insee: "1", nom: "A", uu: "u1", population: 600000 }, // métropole -> rayon 5
    { insee: "2", nom: "B", population: 800 },              // rural -> rayon 25
  ];
  const networkCache = { "1": { acces: 80, tram: true, metro: false, arret_km: 0.3 }, "2": null };
  const bpeCache = { "1": { etudes_acces: { score: 90, count: 12 } }, "2": { etudes_acces: { score: 40, count: 0 } } };
  return { communes, networkCache, bpeCache };
}

test("porte measured:true pour toutes, access null sous plancher, count brut, rayon adaptatif", () => {
  const { communes, networkCache, bpeCache } = fixture();
  buildAbsenceAttestations({ communes, networkCache, bpeCache });
  assert.deepEqual(communes[0].reseauLocal.measured, true);
  assert.equal(communes[1].reseauLocal.acces, null);
  assert.equal(communes[1].reseauLocal.measured, true);
  assert.deepEqual(communes[0].etudesSup, { measured: true, count: 12, radiusKm: 5, conventionVersion: "higher-education-radius-adaptive-v1" });
  assert.deepEqual(communes[1].etudesSup, { measured: true, count: 0, radiusKm: 25, conventionVersion: "higher-education-radius-adaptive-v1" });
});

test("REFUSE si un INSEE de l'index manque dans un cache", () => {
  const { communes, networkCache, bpeCache } = fixture();
  delete networkCache["2"];
  assert.throws(() => buildAbsenceAttestations({ communes, networkCache, bpeCache }), /INSEE/);
});

test("REFUSE un count négatif ou non fini", () => {
  const { communes, networkCache, bpeCache } = fixture();
  bpeCache["2"].etudes_acces.count = -1;
  assert.throws(() => buildAbsenceAttestations({ communes, networkCache, bpeCache }), /count/);
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec** — Run: `node --test scripts/lib/absence-attestations.test.mjs`
  Expected: FAIL `Cannot find module`.

- [ ] **Step 3 : Implémenter la lib pure**

```js
// scripts/lib/absence-attestations.mjs
// Jointure PURE caches -> attestations d'absence, avec validation stricte. Aucune I/O : reçoit les objets
// déjà lus, mute `communes` en place, jette sur anomalie. La complétude est transportée pour CHAQUE commune.
const NETWORK_CONVENTION = "daily-transit-access-v1";
const HIGHER_ED_CONVENTION = "higher-education-radius-adaptive-v1";

function radiusFor(taille) {
  if (taille == null) return 25;
  if (taille >= 500000) return 5;
  if (taille >= 100000) return 10;
  if (taille >= 30000) return 15;
  return 25;
}

export function buildAbsenceAttestations({ communes, networkCache, bpeCache }) {
  const uuPop = new Map();
  for (const c of communes) if (c.uu && c.population != null) uuPop.set(c.uu, (uuPop.get(c.uu) ?? 0) + c.population);
  const tailleVille = (c) => (c.uu ? uuPop.get(c.uu) ?? c.population ?? null : c.population ?? null);

  const seen = new Set();
  let netBelow = 0, supAbsent = 0;
  for (const c of communes) {
    if (seen.has(c.insee)) throw new Error(`doublon INSEE ${c.insee}`);
    seen.add(c.insee);
    if (!(c.insee in networkCache)) throw new Error(`INSEE ${c.insee} absent du cache réseau`);
    if (!(c.insee in bpeCache)) throw new Error(`INSEE ${c.insee} absent du cache BPE`);

    // Réseau : null (sous plancher) ou objet desservi. measured:true pour toutes (mesurées).
    const r = networkCache[c.insee];
    if (r == null) {
      c.reseauLocal = { acces: null, measured: true, conventionVersion: NETWORK_CONVENTION };
      netBelow++;
    } else {
      if (!Number.isFinite(r.acces) || r.acces < 1 || r.acces > 100) throw new Error(`acces invalide pour ${c.insee}: ${r.acces}`);
      c.reseauLocal = { ...r, measured: true, conventionVersion: NETWORK_CONVENTION };
    }

    // Études : count brut, rayon adaptatif effectif.
    const count = bpeCache[c.insee]?.etudes_acces?.count;
    if (!Number.isFinite(count) || count < 0) throw new Error(`count études invalide pour ${c.insee}: ${count}`);
    const radiusKm = radiusFor(tailleVille(c));
    c.etudesSup = { measured: true, count, radiusKm, conventionVersion: HIGHER_ED_CONVENTION };
    if (count === 0) supAbsent++;
  }

  const N = communes.length;
  return {
    report: [
      `${N} communes jointes`,
      `${netBelow} sous le plancher réseau (${(100 * netBelow / N).toFixed(1)} %)`,
      `${supAbsent} sans établissement supérieur (${(100 * supAbsent / N).toFixed(1)} %)`,
    ].join("\n"),
    prevalence: { network: netBelow / N, higherEd: supAbsent / N, communeCount: N },
  };
}
```

- [ ] **Step 4 : Lancer, vérifier** — Run: `node --test scripts/lib/absence-attestations.test.mjs`
  Expected: PASS (3 tests).

- [ ] **Step 5 : Écrire le script d'I/O** (atomique, set-equality strict, rapport, `index.meta`)

```js
// scripts/populate-absence-attestations.mjs
// Enrichit data/comparateur-index.json avec les attestations d'absence (réseau + études), depuis les caches
// producteurs. AUCUN re-fetch OSM/BPE. ATOMIQUE : .tmp -> round-trip -> rename. REFUSE sur anomalie.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { buildAbsenceAttestations } from "./lib/absence-attestations.mjs";

const ROOT = process.cwd();
const INDEX = path.join(ROOT, "data", "comparateur-index.json");
const NET = path.join(ROOT, "data", ".cache", "communes-reseau-local.json");
const BPE = path.join(ROOT, "data", ".cache", "communes-bpe.json");

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

async function main() {
  const [idxRaw, netRaw, bpeRaw] = await Promise.all([fs.readFile(INDEX, "utf8"), fs.readFile(NET, "utf8"), fs.readFile(BPE, "utf8")]);
  const idx = JSON.parse(idxRaw);
  const networkCache = JSON.parse(netRaw);
  const bpeCache = JSON.parse(bpeRaw);

  // Set-equality strict : index == réseau == BPE, mêmes codes uniques.
  const idxSet = new Set(idx.communes.map((c) => c.insee));
  for (const [name, cache] of [["réseau", networkCache], ["BPE", bpeCache]]) {
    const keys = Object.keys(cache);
    if (keys.length !== idxSet.size) { console.error(`REFUS: cache ${name} a ${keys.length} codes, index ${idxSet.size}`); process.exit(1); }
    for (const k of keys) if (!idxSet.has(k)) { console.error(`REFUS: ${k} dans le cache ${name}, absent de l'index`); process.exit(1); }
  }

  let out;
  try {
    out = buildAbsenceAttestations({ communes: idx.communes, networkCache, bpeCache });
  } catch (e) {
    console.error(`REFUS: ${e.message}`); process.exit(1);
  }

  idx.meta = { ...(idx.meta ?? {}), absenceAttestations: {
    version: "absence-attestations-v1",
    networkCacheSha256: sha256(netRaw), bpeCacheSha256: sha256(bpeRaw),
    communeCount: out.prevalence.communeCount,
  } };

  console.log(out.report);

  const tmp = INDEX + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(idx));
  const check = JSON.parse(await fs.readFile(tmp, "utf8"));
  if (!check.communes.some((c) => c.reseauLocal?.measured) || !check.communes.some((c) => c.etudesSup)) {
    console.error("REFUS: attestation perdue à l'écriture"); process.exit(1);
  }
  // Garde-fou anti-régression : nature/ecoles toujours là (rien effacé).
  if (!check.communes[0].nature && !check.communes.some((c) => c.nature)) { console.error("REFUS: enrichissement existant perdu"); process.exit(1); }
  await fs.rename(tmp, INDEX);
  console.log("✓ index patché (absenceAttestations)");
}
main();
```

- [ ] **Step 6 : Restaurer la copie de travail si besoin, puis enrichir**

```bash
[ -f data/comparateur-index.json ] || npm run index:unpack
cp data/comparateur-index.json /tmp/index-backup-absence.json
node scripts/populate-absence-attestations.mjs
```

  Expected (rapport) : `34788 communes jointes`, `~28803 sous le plancher réseau (82.8 %)`,
  `~14069 sans établissement supérieur (40.4 %)`, puis `✓ index patché`.

- [ ] **Step 7 : Packer et vérifier** — Run: `npm run index:pack && npm run index:verify`
  Expected: gz reconstruit, `Index vérifié.`

- [ ] **Step 8 : Commit** (le `.gz` canonique + le code)

```bash
git add scripts/lib/absence-attestations.mjs scripts/lib/absence-attestations.test.mjs scripts/populate-absence-attestations.mjs data/comparateur-index.json.gz
git commit -m "feat(absence): enrichissement des attestations depuis les caches (atomique, set-equality, meta sha256)"
```

---

## Task 8 : Les producteurs modifiés (préventif, sans re-run) + invariant OSM testé

**Files:**
- Modify: `scripts/populate-reseau-local.py` (bloc `--write-index`), `scripts/populate-bpe.py` (bloc `--write-index`)
- Create: `scripts/populate-reseau-local.test.mjs` (test de l'invariant crash-on-failure, en Python via subprocess)

**But :** un FUTUR rebuild doit conserver ces champs sans réintroduire le défaut. On NE re-tourne PAS les
producteurs (risque de dérive des percentiles) ; on rend seulement la migration reproductible et on prouve
l'invariant OSM.

- [ ] **Step 1 : `populate-reseau-local.py`** — remplacer le bloc `if args.write_index:` (fin de `main`) :

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

- [ ] **Step 2 : `populate-bpe.py`** — dans le bloc `if args.write_index:`, AJOUTER l'attestation `etudesSup`.
  Le `count` du cache est un **accès pondéré** (somme de `1 - d/DMAX`), PAS un entier d'établissements : on le
  stocke **BRUT** (le seul test utile est `count == 0` ⟺ zéro établissement dans le rayon ; on n'arrondit
  jamais et on ne le présente jamais comme « N établissements »). C'est exactement la même valeur brute que le
  patch de la Task 7 écrit, donc patch et producteur restent cohérents. Le rayon effectif par commune est déjà
  dans `radius` :

```python
    if args.write_index:
        rfor = {code: int(radius[i]) for i, code in enumerate(codes)}  # rayon effectif (5/10/15/25) par commune
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
            c["etudes_acces"] = r["etudes_acces"]["score"] if r else None
            if r is not None:
                c["etudesSup"] = {
                    "measured": True,
                    "count": r["etudes_acces"]["count"],  # accès pondéré BRUT ; count == 0 <=> aucun établissement
                    "radiusKm": rfor.get(c["insee"], 25),
                    "conventionVersion": "higher-education-radius-adaptive-v1",
                }
            else:
                c["etudesSup"] = None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (ecoles + culture + etudes_acces + etudesSup)", file=sys.stderr)
```

- [ ] **Step 3 : Prouver l'invariant crash-on-failure** — un test qui asserte que `fetch_tile` lève sur
  échec de tous les miroirs (donc jamais de cache partiel) :

```js
// scripts/populate-reseau-local.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("fetch_tile lève RuntimeError quand tous les miroirs échouent (pas de cache partiel)", () => {
  // On exécute un mini-programme Python qui monkeypatch urlopen pour échouer, et vérifie que fetch_tile lève.
  const py = `
import sys, importlib.util
spec = importlib.util.spec_from_file_location("p", "scripts/populate-reseau-local.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
import urllib.request
def boom(*a, **k): raise OSError("réseau coupé")
urllib.request.urlopen = boom
try:
    m.fetch_tile(m.overpass_query(48,2,49,3), "/tmp/should-not-write.json")
    print("NO_RAISE")
except RuntimeError:
    print("RAISED")
`;
  const out = execFileSync("python3", ["-c", py], { encoding: "utf8" }).trim();
  assert.match(out, /RAISED/);
});
```

- [ ] **Step 4 : Lancer** — Run: `node --test scripts/populate-reseau-local.test.mjs`
  Expected: PASS (`RAISED`). Si `python3` n'est pas le bon interpréteur, utiliser `.venv-bpe/bin/python`.

- [ ] **Step 5 : Commit** (aucune régénération de l'index : les scripts ne sont PAS re-tournés)

```bash
git add scripts/populate-reseau-local.py scripts/populate-bpe.py scripts/populate-reseau-local.test.mjs
git commit -m "feat(absence): producteurs portent les attestations à --write-index (préventif) + invariant OSM testé"
```

---

## Task 9 : Le prompt, le bump, la sonde

**Files:**
- Modify: `src/lib/decision/conclusion-hash.ts`, `src/lib/decision/conclusion-prompt.ts`, `scripts/probe-conclusion.ts`

- [ ] **Step 1 : Bump** — `conclusion-hash.ts` : `export const DECISION_NARRATIVE_PROMPT_VERSION = "v8";`.

- [ ] **Step 2 : Étendre le prompt** (verbatim, sans tiret cadratin, sans antithèse). Trouver la section qui
  décrit les mismatchs (introduite en v7) et AJOUTER :

```
UNE ABSENCE ATTESTÉE est un mismatch fondé sur un fait vérifié : un élément recherché (un réseau de transports
en commun du quotidien, un établissement du supérieur) n'existe pas à portée, et la recherche a été faite sur
tout le territoire. La nommer en COMPARATIF et au grain mesuré (« aucun … identifié au point de référence
retenu »), jamais en absolu (« insuffisant », « manque »). Ne jamais généraliser au-delà de l'indicateur :
« aucun établissement du supérieur » ne veut pas dire « aucune vie étudiante ». Comme tout mismatch, cela
s'ARBITRE, jamais « à vérifier ».
```

- [ ] **Step 3 : Étendre la sonde** — dans `scripts/probe-conclusion.ts`, ajouter (sur le modèle des cas
  existants) : un dossier `arbitration` porté par une absence attestée mobilité (poids 3) ; un dossier mixte
  (absence + réserve) ; un dossier `neutral` (mobilité présente + reste médian). Construire les `MismatchFact`
  avec `basis.kind === "named_absence"`.

- [ ] **Step 4 : Lancer la sonde** — Run: `node --env-file=.env.local scripts/probe-conclusion.ts`
  Expected: les cas d'origine restent au vert + les nouveaux cas absence retenus (aucun bloc en repli). Un
  repli = corriger le prompt, relancer.

- [ ] **Step 5 : Vérifier l'invalidation** — Run: `node --test src/lib/decision/conclusion-hash.test.ts`
  Expected: le hash change avec la version (les conclusions v7 ne sont pas resservies).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/conclusion-hash.ts src/lib/decision/conclusion-prompt.ts scripts/probe-conclusion.ts
git commit -m "feat(absence): le prompt nomme une absence attestée (comparatif, arbitrer), bump v8, sonde repassée"
```

---

## Task 10 : Vérification bout-en-bout, et handoff

- [ ] **Step 1 : Bout en bout (absence structurante)** — un projet « me déplacer sans voiture au quotidien »
  (poids 3) sur une commune rurale sans réseau ni établissement du supérieur. Vérifier à l'écran
  (`/rapport/...` ou l'API dossier) : la section « Ce qui correspond moins bien » porte une carte d'absence
  au grain « point de référence retenu », jamais un jugement absolu ; l'orientation `arbitration`, verdict
  « Arbitrage » ; la couverture montée (mobilité examinée).

- [ ] **Step 2 : Le cas symétrique** — la même recherche sur une métropole desservie : mobilité rend `neutral`
  (silencieux), la couverture monte, aucune carte d'absence, l'orientation ne se dégrade PAS ; et vie
  étudiante avec un établissement à portée → `neutral`.

- [ ] **Step 3 : Le cas « non mesuré »** — forcer un `localNetwork.measured=false` (commune pré-patch simulée)
  → `uncertain`, aucune carte, couverture NON acquise. Prouve qu'une absence n'est jamais inventée.

- [ ] **Step 4 : Build + suite complète** — Run:

```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts && node --test scripts/lib/*.test.mjs scripts/*.test.mjs && npx tsc --noEmit && npm run index:verify && npm run build
```

  Expected: tests verts, tsc 0, index vérifié, build exit 0.

- [ ] **Step 5 : Handoff** — `docs/handoff/CURRENT.md` : mismatch lot 2a livré (couverture 19 → 21, forme
  `named_absence` sur mobilité + vie étudiante, attestations dans l'index). Reste : lot 2b
  (`acces_services` en `relative_position`), lot 3 (mer = `absolute_measure`, taille = `categorical_state`),
  et les 2 critères résiduels + `ProjectFit × DecisionConfidence`. Noter le pipeline d'enrichissement
  (`node scripts/populate-absence-attestations.mjs` puis `npm run index:pack`).

## Critères d'acceptation (spec §12)

1. `MismatchFact.basis` est l'union `NamedAbsenceBasis | RelativePositionBasis` ; la v1 passe sans régression.
2. Mobilité déclarée (poids 2/3), réseau mesuré sous plancher → `mismatch` matériel, `basis.kind ===
   "named_absence"`, `observedStateId === "network_below_daily_credibility_floor"`, grain « point de référence ».
3. Vie étudiante, `count === 0` → `mismatch` citant le `radiusKm` exact ; jamais « aucune vie étudiante ».
4. Présent → `neutral` silencieux (couverture acquise, aucune carte). Jamais `satisfied`.
5. Non mesuré → `uncertain` (couverture non acquise, aucune valeur inventée, aucun `?? 0` traversant).
6. Poids 1 → examiné + silencieux ; poids 2 → secondary ; poids 3 → structuring ; jamais `decision_critical` ;
   ensemble matériel → `arbitration` (comptage sur `run.facts`, déjà v1).
7. Le patch : set-equality strict des INSEE, refus sur doublon/manquante/valeur invalide, écriture atomique,
   rapport, `index.meta.absenceAttestations` (sha256). `subScore` INCHANGÉ (`acces` conservé, `etudes_acces`
   score conservé).
8. Un test asserte le crash-on-failure de `populate-reseau-local` (pas de cache partiel).
9. `DECISION_NARRATIVE_PROMPT_VERSION` → `"v8"`, sonde repassée (cas absence + présence), artefacts invalidés.
10. `node --test` vert, `npx tsc --noEmit` rend 0, `npm run index:verify` OK, `npm run build` exit 0.

## Ce que ce lot ne fait PAS (rappel spec §11)

- Lot 2b : `acces_services` en `relative_position`.
- Lot 3 : `proximite_mer` (`absolute_measure`), préférences de taille (`categorical_state`).
- La fusion de deux mismatchs en compromis narratif, et `ProjectFit × DecisionConfidence`.

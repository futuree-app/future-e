# Précision de l'adresse et du logement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sélectionner l'adresse avec précision (autocomplétion BAN) et attribuer le DPE au logement de façon honnête (liste de candidats, confirmation sauf convergence forte, choix persisté), sans jamais afficher un logement faux.

**Architecture:** Fonctions pures testées (`node --test`) pour la logique DPE/BAN, en bas ; wrappers IO fins au-dessus ; route serveur qui accepte une adresse BAN atomique et renvoie une liste de DPE candidats ; persistance du choix dans la table `logement` ; deux composants React isolés (autocomplétion, sélecteur) intégrés à `LogementModule`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Supabase (Postgres + RLS), API BAN (`api-adresse.data.gouv.fr`), API ADEME DPE (`data.ademe.fr`), `node --test` avec `--experimental-strip-types`.

## Global Constraints

- **Grain adresse = moat.** Ne jamais attribuer un DPE au logement sans convergence forte OU confirmation utilisateur. Aucun faux par défaut, jamais « un seul donc c'est le vôtre ».
- **Tests des libs pures** : `node --test --experimental-strip-types <fichier>.test.ts`. Imports `.ts` explicites (le tsconfig porte `allowImportingTsExtensions`).
- **Voix / copie (verbatim du spec)** :
  - Absence totale : « Aucun DPE retrouvé dans la base ouverte pour cette adresse. » + « Cela ne signifie pas nécessairement qu'aucun diagnostic n'existe. »
  - Après « mon logement n'est pas dans la liste » : « Aucun des diagnostics retrouvés n'a été attribué à ce logement. »
  - Confirmation : « Un DPE a été retrouvé pour cette adresse » (jamais « Voici le DPE de votre logement »).
  - Bloc bâtiment : titre « Diagnostics retrouvés à cette adresse » (jamais « repère bâtiment »).
  - Pas de tiret cadratin (—) dans la copie. Pas d'antithèse « c'est X, pas Y » comme emphase.
- **Sélecteur** déclenché par le **nombre de logements plausibles** (après dédup + collapse), pas par une différence de surface.
- **Repère bâtiment** affiché seulement si ≥ 3 diagnostics résidentiels distincts et cohérents.
- **Persistance V1** dans l'artefact `logement` : statut + id + snapshot DPE daté.
- **DPE jamais dans les prompts IA** tant que le statut n'est pas `auto_confirmed`/`user_confirmed`.
- **Rendu UI vérifié en session** (Face derrière `canAccessCompleteReport`), pas en tests unitaires.

---

### Task 1: Enrichir DpeRecord + dédup/collapse des candidats (pur)

**Files:**
- Modify: `src/lib/dpe.ts`
- Test: `src/lib/dpe.test.ts` (create)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `DpeRecord` enrichi de `etage: string | null` et `complement: string | null`.
  - `export function dedupeAndCollapseDpe(records: DpeRecord[]): DpeRecord[]`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/lib/dpe.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { dedupeAndCollapseDpe, type DpeRecord } from "./dpe.ts";

function rec(p: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "x", date_dpe: "2023-01-01", id_ban: "ban1", adresse: "1 rue X",
    etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 60, annee_construction: 1970, type_batiment: "appartement",
    etage: null, complement: null, ...p,
  };
}

test("dédup par numéro de DPE (id_dpe identique -> une seule entrée)", () => {
  const out = dedupeAndCollapseDpe([rec({ id_dpe: "a" }), rec({ id_dpe: "a" })]);
  assert.equal(out.length, 1);
});

test("collapse même unité (mêmes étage+complément+surface) -> garde le plus récent", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "old", date_dpe: "2019-01-01", etage: "3", complement: "B", surface_m2: 62 }),
    rec({ id_dpe: "new", date_dpe: "2024-01-01", etage: "3", complement: "B", surface_m2: 62 }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id_dpe, "new");
});

test("NE collapse PAS deux unités de même surface mais d'étages différents", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "a", etage: "2", complement: "A", surface_m2: 60 }),
    rec({ id_dpe: "b", etage: "5", complement: "B", surface_m2: 60 }),
  ]);
  assert.equal(out.length, 2);
});

test("en cas de doute (étage/complément absents) -> garde les deux", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "a", etage: null, complement: null, surface_m2: 60 }),
    rec({ id_dpe: "b", etage: null, complement: null, surface_m2: 60 }),
  ]);
  assert.equal(out.length, 2);
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: FAIL (`dedupeAndCollapseDpe` non exporté, champs `etage`/`complement` inexistants).

- [ ] **Step 3: Enrichir `DpeRecord` et le mapping**

Dans `src/lib/dpe.ts`, ajouter aux deux endroits :

Dans `SELECT_LOGEMENT` (tableau), ajouter les colonnes :
```ts
  "numero_etage_appartement",
  "complement_adresse_logement",
```

Dans `ApiRecord` (type), ajouter :
```ts
  numero_etage_appartement?: string | null;
  complement_adresse_logement?: string | null;
```

Dans `DpeRecord` (type), ajouter après `type_batiment` :
```ts
  etage: string | null;
  complement: string | null;
```

Dans `toRecord`, ajouter au retour :
```ts
    etage:       r.numero_etage_appartement ?? null,
    complement:  r.complement_adresse_logement ?? null,
```

Dans `toRecordLegacy`, ajouter au retour (legacy n'a pas ces champs) :
```ts
    etage:       null,
    complement:  null,
```

- [ ] **Step 4: Implémenter `dedupeAndCollapseDpe`**

Ajouter dans `src/lib/dpe.ts` (après `toRecord`) :

```ts
// Dédup par numéro de DPE, puis collapse CONSERVATEUR : deux diagnostics qui décrivent
// manifestement la même unité (même étage + même complément + même surface, tous renseignés)
// sont fusionnés en gardant le plus récent. Au moindre doute (un champ d'identification
// manquant), on garde les deux : mieux vaut un sélecteur qu'une fusion fausse.
export function dedupeAndCollapseDpe(records: DpeRecord[]): DpeRecord[] {
  const byId = new Map<string, DpeRecord>();
  for (const r of records) if (!byId.has(r.id_dpe)) byId.set(r.id_dpe, r);
  const unique = [...byId.values()];

  const sameUnitKey = (r: DpeRecord): string | null =>
    r.etage != null && r.complement != null && r.surface_m2 != null
      ? `${r.etage}|${r.complement}|${r.surface_m2}`
      : null; // identification incomplète -> jamais fusionné

  const kept = new Map<string, DpeRecord>();
  const passthrough: DpeRecord[] = [];
  for (const r of unique) {
    const key = sameUnitKey(r);
    if (key == null) { passthrough.push(r); continue; }
    const prev = kept.get(key);
    if (!prev || (r.date_dpe ?? "") > (prev.date_dpe ?? "")) kept.set(key, r);
  }
  return [...kept.values(), ...passthrough];
}
```

- [ ] **Step 5: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/dpe.ts src/lib/dpe.test.ts
git commit -m "feat(logement): DpeRecord étage/complément + dédup/collapse conservateur des DPE"
```

---

### Task 2: Règle d'attribution DPE (pur)

**Files:**
- Modify: `src/lib/dpe.ts`
- Test: `src/lib/dpe.test.ts`

**Interfaces:**
- Consumes: `DpeRecord`, `dedupeAndCollapseDpe` (Task 1).
- Produces:
  - `export type DpeAttribution = { status: "not_found" } | { status: "auto_confirmed"; dpe: DpeRecord } | { status: "selection_required"; candidates: DpeRecord[] };`
  - `export function dpeAttributionStatus(candidates: DpeRecord[], banFeatureType: string | null): DpeAttribution`

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `src/lib/dpe.test.ts` :

```ts
import { dpeAttributionStatus } from "./dpe.ts";

test("0 candidat -> not_found", () => {
  assert.deepEqual(dpeAttributionStatus([], "housenumber"), { status: "not_found" });
});

test("1 candidat maison + BAN housenumber -> auto_confirmed", () => {
  const r = rec({ id_dpe: "a", type_batiment: "maison" });
  const out = dpeAttributionStatus([r], "housenumber");
  assert.equal(out.status, "auto_confirmed");
});

test("1 candidat appartement -> selection_required (collectif)", () => {
  const r = rec({ id_dpe: "a", type_batiment: "appartement" });
  const out = dpeAttributionStatus([r], "housenumber");
  assert.equal(out.status, "selection_required");
});

test("1 candidat maison mais BAN non housenumber -> selection_required", () => {
  const r = rec({ id_dpe: "a", type_batiment: "maison" });
  const out = dpeAttributionStatus([r], "street");
  assert.equal(out.status, "selection_required");
});

test("2 candidats -> selection_required", () => {
  const out = dpeAttributionStatus([rec({ id_dpe: "a" }), rec({ id_dpe: "b" })], "housenumber");
  assert.equal(out.status, "selection_required");
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: FAIL (`dpeAttributionStatus` non exporté).

- [ ] **Step 3: Implémenter la règle**

Ajouter dans `src/lib/dpe.ts` :

```ts
export type DpeAttribution =
  | { status: "not_found" }
  | { status: "auto_confirmed"; dpe: DpeRecord }
  | { status: "selection_required"; candidates: DpeRecord[] };

const isMaison = (t: string | null): boolean => (t ?? "").toLowerCase().includes("maison");

// Convergence forte = SEUL cas d'attribution automatique : 1 candidat, maison individuelle,
// adresse BAN précise (housenumber), classe présente. Tout le reste demande confirmation,
// y compris un candidat unique en collectif.
export function dpeAttributionStatus(
  candidates: DpeRecord[],
  banFeatureType: string | null,
): DpeAttribution {
  if (candidates.length === 0) return { status: "not_found" };
  const one = candidates[0];
  const strongConvergence =
    candidates.length === 1 &&
    isMaison(one.type_batiment) &&
    banFeatureType === "housenumber" &&
    one.etiquette_dpe != null;
  return strongConvergence
    ? { status: "auto_confirmed", dpe: one }
    : { status: "selection_required", candidates };
}
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: PASS (9 tests cumulés).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dpe.ts src/lib/dpe.test.ts
git commit -m "feat(logement): règle d'attribution DPE (convergence forte vs confirmation requise)"
```

---

### Task 3: Contexte DPE de l'adresse (pur)

**Files:**
- Modify: `src/lib/dpe.ts`
- Test: `src/lib/dpe.test.ts`

**Interfaces:**
- Consumes: `DpeRecord`.
- Produces:
  - `export type AddressDpeContext = { count: number; minLabel: DpeLabel; maxLabel: DpeLabel };`
  - `export function deriveAddressDpeContext(candidates: DpeRecord[]): AddressDpeContext | null`

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `src/lib/dpe.test.ts` :

```ts
import { deriveAddressDpeContext } from "./dpe.ts";

test("≥3 diagnostics résidentiels -> fourchette de classes", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D", type_batiment: "appartement" }),
    rec({ id_dpe: "b", etiquette_dpe: "F", type_batiment: "appartement" }),
    rec({ id_dpe: "c", etiquette_dpe: "E", type_batiment: "appartement" }),
  ]);
  assert.deepEqual(out, { count: 3, minLabel: "D", maxLabel: "F" });
});

test("<3 diagnostics -> null (repère non affiché)", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D" }),
    rec({ id_dpe: "b", etiquette_dpe: "F" }),
  ]);
  assert.equal(out, null);
});

test("classes manquantes exclues ; si <3 valides -> null", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D" }),
    rec({ id_dpe: "b", etiquette_dpe: null }),
    rec({ id_dpe: "c", etiquette_dpe: null }),
  ]);
  assert.equal(out, null);
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: FAIL (`deriveAddressDpeContext` non exporté).

- [ ] **Step 3: Implémenter**

Ajouter dans `src/lib/dpe.ts` (réutilise `LABEL_ORDER` déjà défini) :

```ts
export type AddressDpeContext = { count: number; minLabel: DpeLabel; maxLabel: DpeLabel };

// « Diagnostics retrouvés à cette adresse » : n'affiche une fourchette QUE si au moins 3
// diagnostics résidentiels portent une classe. Sinon null (trop peu ou trop hétérogène pour
// constituer un repère honnête). Ne qualifie jamais le logement.
export function deriveAddressDpeContext(candidates: DpeRecord[]): AddressDpeContext | null {
  const labels = candidates
    .filter((c) => (c.type_batiment ?? "").toLowerCase() !== "tertiaire")
    .map((c) => c.etiquette_dpe)
    .filter((l): l is DpeLabel => l != null);
  if (labels.length < 3) return null;
  const idx = labels.map((l) => LABEL_ORDER.indexOf(l)).filter((i) => i >= 0);
  return {
    count: labels.length,
    minLabel: LABEL_ORDER[Math.min(...idx)],
    maxLabel: LABEL_ORDER[Math.max(...idx)],
  };
}
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/dpe.test.ts`
Expected: PASS (12 tests cumulés).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dpe.ts src/lib/dpe.test.ts
git commit -m "feat(logement): contexte DPE de l'adresse sous garde-fou ≥3 diagnostics"
```

---

### Task 4: `getDpeCandidatesByBanId` (wrapper IO)

**Files:**
- Modify: `src/lib/dpe.ts`

**Interfaces:**
- Consumes: `fetchLines` (déjà présent), `dedupeAndCollapseDpe` (Task 1).
- Produces: `export async function getDpeCandidatesByBanId(banId: string): Promise<DpeRecord[]>`

> IO réseau : pas de test unitaire (vérifié via la route en Task 7 puis en session). `getDpeByBanId`
> est conservé pour ne pas casser d'autres appelants, mais n'est plus utilisé par la route logement.

- [ ] **Step 1: Implémenter le wrapper**

Ajouter dans `src/lib/dpe.ts` :

```ts
// Renvoie TOUS les DPE rattachés à l'identifiant BAN (existant puis neuf), triés du plus
// récent au plus ancien, dédupliqués et collapsés (cf. dedupeAndCollapseDpe). Remplace le
// « plus récent unique » de getDpeByBanId côté module Logement.
export async function getDpeCandidatesByBanId(banId: string): Promise<DpeRecord[]> {
  const collected: DpeRecord[] = [];
  for (const dataset of [DS.existant, DS.neuf]) {
    const results = await fetchLines(dataset, {
      qs:     `identifiant_ban:"${banId}"`,
      size:   "30",
      sort:   "-date_etablissement_dpe",
      select: SELECT_LOGEMENT,
    });
    collected.push(...results.map(toRecord));
  }
  return dedupeAndCollapseDpe(collected)
    .sort((a, b) => (b.date_dpe ?? "").localeCompare(a.date_dpe ?? ""));
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dpe.ts
git commit -m "feat(logement): getDpeCandidatesByBanId (liste dédupliquée par identifiant BAN)"
```

---

### Task 5: Autocomplétion BAN (parse pur + wrapper IO)

**Files:**
- Modify: `src/lib/ban.ts`
- Test: `src/lib/ban.test.ts` (create)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `BanAddressResult` enrichi de `type: string | null` (feature BAN : `housenumber` | `street` | …).
  - `export function parseBanAutocomplete(features: unknown[]): BanAddressResult[]`
  - `export async function autocompleteBanAddress(query: string, signal?: AbortSignal): Promise<BanAddressResult[]>`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/lib/ban.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseBanAutocomplete } from "./ban.ts";

const feature = (over: Record<string, unknown> = {}) => ({
  geometry: { coordinates: [-1.15, 46.16] },
  properties: { id: "ban-1", label: "1 rue X, 17000 La Rochelle", city: "La Rochelle",
    citycode: "17300", postcode: "17000", type: "housenumber", ...over },
});

test("parse plusieurs features avec type et coordonnées", () => {
  const out = parseBanAutocomplete([feature(), feature({ id: "ban-2", type: "street" })]);
  assert.equal(out.length, 2);
  assert.equal(out[0].type, "housenumber");
  assert.equal(out[0].latitude, 46.16);
  assert.equal(out[0].longitude, -1.15);
  assert.equal(out[1].type, "street");
});

test("ignore une feature sans coordonnées", () => {
  const bad = { properties: { id: "x", label: "sans géo", type: "street" } };
  const out = parseBanAutocomplete([feature(), bad]);
  assert.equal(out.length, 1);
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/ban.test.ts`
Expected: FAIL (`parseBanAutocomplete` non exporté).

- [ ] **Step 3: Ajouter `type` au type + implémenter parse et wrapper**

Dans `src/lib/ban.ts` :

Ajouter `type` à `BanAddressResult` :
```ts
  type: string | null;
```
Ajouter `type` à `BanFeature["properties"]` :
```ts
    type?: string;
```
Dans `geocodeBanAddress`, au retour, ajouter :
```ts
      type: feature.properties?.type?.trim() || null,
```

Ajouter, en fin de fichier :
```ts
export function parseBanAutocomplete(features: unknown[]): BanAddressResult[] {
  const out: BanAddressResult[] = [];
  for (const f of features as BanFeature[]) {
    const c = f?.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    out.push({
      id: f.properties?.id?.trim() || null,
      label: f.properties?.label?.trim() || "",
      city: f.properties?.city?.trim() || null,
      citycode: f.properties?.citycode?.trim() || null,
      postcode: f.properties?.postcode?.trim() || null,
      type: f.properties?.type?.trim() || null,
      longitude: c[0],
      latitude: c[1],
    });
  }
  return out;
}

// Autocomplétion (plusieurs suggestions). Appelée côté client ; supporte l'annulation via
// AbortSignal (le composant annule la requête précédente à chaque frappe).
export async function autocompleteBanAddress(
  query: string,
  signal?: AbortSignal,
): Promise<BanAddressResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const url = new URL(BAN_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("autocomplete", "1");
  url.searchParams.set("limit", "6");
  const res = await fetch(url.toString(), { headers: { accept: "application/json" }, signal });
  if (!res.ok) throw new Error(`BAN autocomplete ${res.status}`);
  const payload = (await res.json()) as BanResponse;
  return parseBanAutocomplete(payload.features ?? []);
}
```

> Retirer `import "server-only";` en tête de `ban.ts` : `autocompleteBanAddress` est appelée
> côté client. Les fonctions serveur restantes n'ont pas besoin du garde `server-only`.

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/ban.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le champ `type` est optionnel côté consommateurs existants).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ban.ts src/lib/ban.test.ts
git commit -m "feat(logement): autocomplétion BAN (parse + wrapper client abortable)"
```

---

### Task 6: `SelectedBanAddress` + validateur (pur)

**Files:**
- Create: `src/lib/selected-ban-address.ts`
- Test: `src/lib/selected-ban-address.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `export type SelectedBanAddress = { banId: string; label: string; housenumber?: string; street?: string; postcode: string; city: string; citycode: string; latitude: number; longitude: number; type: string | null };`
  - `export function validateSelectedBanAddress(input: unknown): SelectedBanAddress | null`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/lib/selected-ban-address.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { validateSelectedBanAddress } from "./selected-ban-address.ts";

const ok = {
  banId: "ban-1", label: "1 rue X, 17000 La Rochelle", postcode: "17000",
  city: "La Rochelle", citycode: "17300", latitude: 46.16, longitude: -1.15, type: "housenumber",
};

test("objet complet -> validé", () => {
  assert.deepEqual(validateSelectedBanAddress(ok), { ...ok, housenumber: undefined, street: undefined });
});

test("champ requis manquant -> null", () => {
  assert.equal(validateSelectedBanAddress({ ...ok, citycode: undefined }), null);
});

test("coordonnées hors bornes -> null", () => {
  assert.equal(validateSelectedBanAddress({ ...ok, latitude: 200 }), null);
});

test("entrée non-objet -> null", () => {
  assert.equal(validateSelectedBanAddress(null), null);
  assert.equal(validateSelectedBanAddress("x"), null);
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/selected-ban-address.test.ts`
Expected: FAIL (module inexistant).

- [ ] **Step 3: Implémenter**

Créer `src/lib/selected-ban-address.ts` :

```ts
// Adresse BAN sélectionnée = objet ATOMIQUE transmis au serveur (pas trois champs
// désynchronisables). Le même objet sert à sauvegarder l'adresse, lancer les risques au
// point, chercher les DPE et générer le snapshot.
export type SelectedBanAddress = {
  banId: string;
  label: string;
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function validateSelectedBanAddress(input: unknown): SelectedBanAddress | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;
  const str = (v: unknown): v is string => typeof v === "string" && v.length > 0;
  if (!str(o.banId) || !str(o.label) || !str(o.postcode) || !str(o.city) || !str(o.citycode)) {
    return null;
  }
  const lat = o.latitude, lon = o.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    banId: o.banId, label: o.label, postcode: o.postcode, city: o.city, citycode: o.citycode,
    latitude: lat, longitude: lon,
    type: typeof o.type === "string" ? o.type : null,
    housenumber: typeof o.housenumber === "string" ? o.housenumber : undefined,
    street: typeof o.street === "string" ? o.street : undefined,
  };
}
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/selected-ban-address.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/selected-ban-address.ts src/lib/selected-ban-address.test.ts
git commit -m "feat(logement): SelectedBanAddress atomique + validateur serveur"
```

---

### Task 7: Route georisques-logement — POST + dpeCandidates + banFeatureType

**Files:**
- Modify: `src/app/api/georisques-logement/route.ts`

**Interfaces:**
- Consumes: `validateSelectedBanAddress` (Task 6), `getDpeCandidatesByBanId` (Task 4), `getDpeByCoordinates` (existant).
- Produces: réponse JSON avec `dpeCandidates: DpeRecord[]` (au lieu de `dpe`) et `banFeatureType: string | null`. Le POST accepte `{ address: SelectedBanAddress }`, le GET (repli) garde `?q=`.

> Intégration réseau : vérifiée en session, pas de test unitaire. Extraire le cœur commun dans
> une fonction locale pour que GET et POST le partagent.

- [ ] **Step 1: Refactor — extraire le cœur commun**

Dans `src/app/api/georisques-logement/route.ts`, remplacer l'import DPE :
```ts
import { getDpeCandidatesByBanId, getDpeByCoordinates } from "@/lib/dpe";
```
et ajouter :
```ts
import { validateSelectedBanAddress, type SelectedBanAddress } from "@/lib/selected-ban-address";
```

Extraire une fonction `buildReport(address, banFeatureType)` qui reprend le corps actuel du `try`
(depuis `findCadastreParcelByPoint` jusqu'au `return NextResponse.json(...)`), en remplaçant le
bloc DPE :
```ts
    const [dpeCandidates, audit] = await Promise.all([
      address.id
        ? getDpeCandidatesByBanId(address.id).catch(() => [])
        : getDpeByCoordinates(address.latitude, address.longitude).then((d) => (d ? [d] : [])).catch(() => []),
      address.id
        ? getAuditByBanId(address.id).catch(() => null)
        : getAuditByCoordinates(address.latitude, address.longitude).catch(() => null),
    ]);
```
et dans l'objet retourné, remplacer `dpe,` par :
```ts
        dpeCandidates,
        banFeatureType,
```
`address` passé à `buildReport` a la forme `{ id: string | null; label; city; citycode; postcode; latitude; longitude }` (compatible avec le résultat de `geocodeBanAddress` ET avec un `SelectedBanAddress` mappé).

- [ ] **Step 2: GET (repli) appelle le cœur**

Le `GET` existant : après `geocodeBanAddress(query)`, appeler `return buildReport(address, address.type)`.

- [ ] **Step 3: Ajouter le POST**

Ajouter :
```ts
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const sel = validateSelectedBanAddress((body as { address?: unknown })?.address);
  if (!sel) return NextResponse.json({ error: "Invalid selected address." }, { status: 400 });
  try {
    const address = {
      id: sel.banId, label: sel.label, city: sel.city, citycode: sel.citycode,
      postcode: sel.postcode, latitude: sel.latitude, longitude: sel.longitude,
    };
    return await buildReport(address, sel.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/georisques-logement/route.ts`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/georisques-logement/route.ts
git commit -m "feat(logement): route accepte une adresse BAN atomique et renvoie les DPE candidats"
```

---

### Task 8: Persistance du choix DPE (migration + store)

**Files:**
- Create: `supabase/19_logement_dpe_selection.sql`
- Modify: `src/lib/logement-store.ts`
- Test: `src/lib/logement-store.test.ts`

**Interfaces:**
- Consumes: `DpeRecord` (import type depuis `./dpe.ts`).
- Produces:
  - `LogementRow` enrichi : `dpe_selection_status`, `selected_dpe_id`, `selected_dpe_snapshot`, `selected_dpe_at`.
  - `export type DpeSelectionStatus = "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";`
  - `export function buildDpeSelectionFields(status, dpe, nowIso): { dpe_selection_status: DpeSelectionStatus; selected_dpe_id: string | null; selected_dpe_snapshot: DpeRecord | null; selected_dpe_at: string | null }`

- [ ] **Step 1: Écrire la migration**

Créer `supabase/19_logement_dpe_selection.sql` :

```sql
begin;

-- Persistance du DPE choisi par l'utilisateur pour l'adresse analysée. Le choix STRUCTURE un
-- rapport payant (classe, surface, coûts, échéances, passeport) : il doit vivre dans l'artefact,
-- pas seulement dans l'état navigateur. selected_dpe_snapshot fige la donnée à la date de
-- génération (la base DPE peut évoluer), pour que le rapport explique quelle donnée il a utilisée.
alter table public.logement
  add column if not exists dpe_selection_status text not null default 'pending'
    check (dpe_selection_status in
      ('auto_confirmed', 'user_confirmed', 'not_in_list', 'not_found', 'pending')),
  add column if not exists selected_dpe_id text,
  add column if not exists selected_dpe_snapshot jsonb,
  add column if not exists selected_dpe_at timestamptz;

commit;
```

- [ ] **Step 2: Écrire le test qui échoue**

Ajouter à `src/lib/logement-store.test.ts` :

```ts
import { buildDpeSelectionFields } from "./logement-store.ts";

test("buildDpeSelectionFields: user_confirmed fige id + snapshot + date", () => {
  const dpe = { id_dpe: "d1", etiquette_dpe: "D" } as never;
  const out = buildDpeSelectionFields("user_confirmed", dpe, "2026-07-03T10:00:00.000Z");
  assert.equal(out.dpe_selection_status, "user_confirmed");
  assert.equal(out.selected_dpe_id, "d1");
  assert.equal(out.selected_dpe_at, "2026-07-03T10:00:00.000Z");
  assert.ok(out.selected_dpe_snapshot);
});

test("buildDpeSelectionFields: not_in_list/not_found -> aucun DPE figé", () => {
  const out = buildDpeSelectionFields("not_in_list", null, "2026-07-03T10:00:00.000Z");
  assert.equal(out.selected_dpe_id, null);
  assert.equal(out.selected_dpe_snapshot, null);
});
```

- [ ] **Step 3: Lancer le test (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/logement-store.test.ts`
Expected: FAIL (`buildDpeSelectionFields` non exporté).

- [ ] **Step 4: Implémenter dans `logement-store.ts`**

Ajouter l'import de type en tête :
```ts
import type { DpeRecord } from "./dpe.ts";
```
Ajouter le type et étendre `LogementRow` :
```ts
export type DpeSelectionStatus =
  | "auto_confirmed" | "user_confirmed" | "not_in_list" | "not_found" | "pending";
```
Dans `LogementRow`, ajouter :
```ts
  dpe_selection_status: DpeSelectionStatus;
  selected_dpe_id: string | null;
  selected_dpe_snapshot: DpeRecord | null;
  selected_dpe_at: string | null;
```
Ajouter le builder pur :
```ts
// Projette l'état runtime du choix DPE vers les colonnes persistées. Ne fige un DPE (id +
// snapshot daté) que pour un choix effectif (auto_confirmed / user_confirmed).
export function buildDpeSelectionFields(
  status: DpeSelectionStatus,
  dpe: DpeRecord | null,
  nowIso: string,
): Pick<LogementRow, "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at"> {
  const keep = status === "auto_confirmed" || status === "user_confirmed";
  return {
    dpe_selection_status: status,
    selected_dpe_id: keep ? (dpe?.id_dpe ?? null) : null,
    selected_dpe_snapshot: keep ? dpe : null,
    selected_dpe_at: keep ? nowIso : null,
  };
}
```

> `upsertLogement` accepte déjà un `Omit<LogementRow, "updated_at">` ; les nouveaux champs
> passeront par le même upsert. Le composant fournira ces champs via `buildDpeSelectionFields`.

- [ ] **Step 5: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/logement-store.test.ts`
Expected: PASS.

- [ ] **Step 6: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add supabase/19_logement_dpe_selection.sql src/lib/logement-store.ts src/lib/logement-store.test.ts
git commit -m "feat(logement): persistance du choix DPE (migration + buildDpeSelectionFields)"
```

> **Note d'exécution** : appliquer la migration `19` sur Supabase (comme les précédentes) avant
> de tester le rendu en session. Signaler au porteur si l'accès Supabase manque.

---

### Task 9: Synthèse IA — n'utiliser le DPE que s'il est confirmé

**Files:**
- Modify: `src/app/api/synthesize-logement/route.ts`

**Interfaces:**
- Consumes: `dpe_selection_status` transmis dans le payload `data`.
- Produces: entrée de synthèse où le bloc `dpe` est `null` si le statut n'est pas confirmé.

- [ ] **Step 1: Repérer le bloc DPE de l'entrée**

Dans `src/app/api/synthesize-logement/route.ts`, le builder lit aujourd'hui `data.dpe`. Le module
ne fournit plus `data.dpe` mais `data.selectedDpe` + `data.dpeSelectionStatus`.

- [ ] **Step 2: Garder le DPE seulement si confirmé**

Remplacer la lecture DPE de l'entrée par :
```ts
      dpe:
        (data.dpeSelectionStatus === "auto_confirmed" || data.dpeSelectionStatus === "user_confirmed") && data.selectedDpe
          ? {
              etiquette: data.selectedDpe.etiquette_dpe,
              conso: data.selectedDpe.conso_ep_m2,
              emissions: data.selectedDpe.emission_ges_m2,
              surface: data.selectedDpe.surface_m2,
              construction: data.selectedDpe.annee_construction,
              type: data.selectedDpe.type_batiment,
            }
          : null,
```
(Adapter les noms de champs de sortie à ceux déjà attendus par le prompt ; conserver `null`
quand non confirmé, ce que le prompt traite déjà comme « non déterminé ».)

- [ ] **Step 3: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/synthesize-logement/route.ts`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/synthesize-logement/route.ts
git commit -m "feat(logement): la synthèse n'utilise le DPE que s'il est attribué au logement"
```

---

### Task 10: Composant `AddressAutocomplete`

**Files:**
- Create: `src/components/report/AddressAutocomplete.tsx`

**Interfaces:**
- Consumes: `autocompleteBanAddress`, `BanAddressResult` (Task 5).
- Produces: `export function AddressAutocomplete({ onSelect, placeholder }: { onSelect: (a: BanAddressResult) => void; placeholder?: string }): JSX.Element`

> Composant client, non testé unitairement (vérifié en session). Respecter les protections UX du spec.

- [ ] **Step 1: Écrire le composant**

Créer `src/components/report/AddressAutocomplete.tsx` :

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { autocompleteBanAddress, type BanAddressResult } from "@/lib/ban";

// Autocomplétion d'adresse : SEULE la sélection d'une suggestion (clic ou Entrée) déclenche
// l'analyse en amont. Le texte libre n'est jamais pris pour une adresse validée. Requête
// précédente annulée à chaque frappe ; réponses hors-ordre ignorées via un jeton de séquence.
export function AddressAutocomplete({
  onSelect, placeholder,
}: { onSelect: (a: BanAddressResult) => void; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<BanAddressResult[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [selected, setSelected] = useState<BanAddressResult | null>(null);
  const seq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selected || q.trim().length < 3) { setItems([]); setOpen(false); setStatus("idle"); return; }
    const my = ++seq.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("loading");
    const t = setTimeout(async () => {
      try {
        const res = await autocompleteBanAddress(q, ctrl.signal);
        if (my !== seq.current) return; // réponse hors-ordre
        setItems(res); setActive(-1); setOpen(true);
        setStatus(res.length === 0 ? "empty" : "idle");
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || my !== seq.current) return;
        setStatus("error");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, selected]);

  function choose(a: BanAddressResult) {
    setSelected(a); setQ(a.label); setOpen(false); setItems([]);
    onSelect(a);
  }

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--fg-hi)", fontWeight: 500 }}>{selected.label}</span>
        <span style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Adresse sélectionnée</span>
        <button type="button" onClick={() => { setSelected(null); setQ(""); }}
          style={{ fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Modifier l&apos;adresse
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "Entrez une adresse"}
        role="combobox" aria-expanded={open} aria-autocomplete="list"
        onKeyDown={(e) => {
          if (!open || items.length === 0) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) choose(items[active]); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
        style={{ width: "100%", padding: "12px 14px", fontSize: 15, background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, color: "var(--fg-1)" }}
      />
      {status === "loading" && <div style={hint}>Recherche…</div>}
      {status === "empty" && <div style={hint}>Aucune adresse trouvée.</div>}
      {status === "error" && <div style={hint}>Recherche d&apos;adresse momentanément indisponible.</div>}
      {open && items.length > 0 && (
        <ul role="listbox" style={{ position: "absolute", zIndex: 40, left: 0, right: 0, margin: "6px 0 0", padding: 4, listStyle: "none", background: "var(--bg-elev)", border: "1px solid var(--border-1)", borderRadius: 10, maxHeight: 280, overflowY: "auto" }}>
          {items.map((a, i) => (
            <li key={a.id ?? i} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(a); }}
              onMouseEnter={() => setActive(i)}
              style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "var(--fg-1)", background: i === active ? "var(--bg-card, rgba(255,255,255,0.05))" : "transparent" }}>
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--fg-4)", marginTop: 6 };
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/AddressAutocomplete.tsx`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/AddressAutocomplete.tsx
git commit -m "feat(logement): composant AddressAutocomplete (sélection BAN, clavier, abortable)"
```

---

### Task 11: Composant `DpeSelector`

**Files:**
- Create: `src/components/report/DpeSelector.tsx`

**Interfaces:**
- Consumes: `DpeRecord`, `AddressDpeContext` (dpe.ts).
- Produces: `export function DpeSelector({ candidates, context, onPick, onNotInList }: { candidates: DpeRecord[]; context: AddressDpeContext | null; onPick: (d: DpeRecord) => void; onNotInList: () => void }): JSX.Element`

> Composant de présentation. Wording verbatim du spec (voir Global Constraints).

- [ ] **Step 1: Écrire le composant**

Créer `src/components/report/DpeSelector.tsx` :

```tsx
"use client";

import type { DpeRecord, AddressDpeContext } from "@/lib/dpe";

const DPE_TYPE = (t: string | null) => t ?? "Logement";

// Sélecteur de DPE : l'utilisateur désigne SON logement parmi les candidats de l'adresse.
// Aucune ligne n'est présélectionnée (pas de faux par défaut).
export function DpeSelector({
  candidates, context, onPick, onNotInList,
}: {
  candidates: DpeRecord[];
  context: AddressDpeContext | null;
  onPick: (d: DpeRecord) => void;
  onNotInList: () => void;
}) {
  const many = candidates.length > 1;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        {many
          ? "Plusieurs diagnostics sont rattachés à cette adresse. Sélectionnez celui qui correspond au logement."
          : "Un diagnostic a été retrouvé à cette adresse. Est-ce celui du logement ?"}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {candidates.map((c) => (
          <button key={c.id_dpe} type="button" onClick={() => onPick(c)}
            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-1)", background: "var(--bg-elev)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 14, color: "var(--fg-1)" }}>
              {DPE_TYPE(c.type_batiment)}
              {c.surface_m2 != null ? ` · ${c.surface_m2} m²` : ""}
              {c.etage ? ` · ${c.etage}` : ""}
              {c.complement ? ` · ${c.complement}` : ""}
              {c.date_dpe ? ` · ${c.date_dpe.slice(0, 4)}` : ""}
            </span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", whiteSpace: "nowrap" }}>
              {c.etiquette_dpe ?? "—"}
            </span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onNotInList}
        style={{ justifySelf: "start", fontSize: 12.5, color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Mon logement n&apos;est pas dans cette liste
      </button>
      {context && (
        <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
          Diagnostics retrouvés à cette adresse : {context.count}. Les classes observées vont de {context.minLabel} à {context.maxLabel}. Elles ne permettent pas de qualifier votre logement.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/DpeSelector.tsx`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/DpeSelector.tsx
git commit -m "feat(logement): composant DpeSelector (choix honnête, aucun défaut présélectionné)"
```

---

### Task 12: Intégration dans `LogementModule`

**Files:**
- Modify: `src/components/report/LogementModule.tsx`

**Interfaces:**
- Consumes: `AddressAutocomplete` (T10), `DpeSelector` (T11), `dpeAttributionStatus`, `deriveAddressDpeContext`, `DpeRecord`, `DpeAttribution` (dpe.ts), `SelectedBanAddress`/`BanAddressResult`, `buildDpeSelectionFields` (store), la route POST (T7).
- Produces: parcours complet ; le passeport et la section Énergie lisent `selectedDpe`.

> Intégration UI : vérifiée en session (rendu derrière `canAccessCompleteReport`). Étapes = édition ciblée, compilation/lint entre chaque, puis vérification navigateur finale.

- [ ] **Step 1: Adapter le type `ApiResponse` et l'état**

Dans `LogementModule.tsx` : remplacer dans le type de réponse `dpe?: DpeRecord | null` par
`dpeCandidates?: DpeRecord[]; banFeatureType?: string | null;`. Ajouter les états :
```ts
const [dpeStatus, setDpeStatus] = useState<"loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error">("loading");
const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
```
Importer :
```ts
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import { DpeSelector } from "@/components/report/DpeSelector";
import { dpeAttributionStatus, deriveAddressDpeContext, type DpeRecord } from "@/lib/dpe";
import type { BanAddressResult } from "@/lib/ban";
```

- [ ] **Step 2: Remplacer le formulaire libre par l'autocomplétion**

Remplacer le `<form onSubmit={handleSubmit}>` (input + bouton Analyser) par :
```tsx
<AddressAutocomplete
  placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
  onSelect={(a) => void analyzeSelected(a)}
/>
```
Supprimer l'état `query`/`setQuery` et le handler `handleSubmit`.

- [ ] **Step 3: Nouveau handler `analyzeSelected` (POST atomique)**

Ajouter :
```ts
async function analyzeSelected(a: BanAddressResult) {
  if (!a.id) { setError("Adresse sans identifiant BAN."); return; }
  setLoading(true); setError(null); setSynthesis(null); setAutour(null);
  autourRetriedRef.current = false; setDpeStatus("loading"); setSelectedDpe(null);
  try {
    const res = await fetch("/api/georisques-logement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: {
        banId: a.id, label: a.label, postcode: a.postcode ?? "", city: a.city ?? "",
        citycode: a.citycode ?? "", latitude: a.latitude, longitude: a.longitude, type: a.type,
      } }),
    });
    const payload = (await res.json()) as ApiResponse;
    if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
    setResult(payload); setProjet(null);
    const candidates = payload.dpeCandidates ?? [];
    setDpeCandidates(candidates);
    const attribution = dpeAttributionStatus(candidates, payload.banFeatureType ?? null);
    if (attribution.status === "not_found") { setDpeStatus("not_found"); }
    else if (attribution.status === "auto_confirmed") { setSelectedDpe(attribution.dpe); setDpeStatus("auto_confirmed"); }
    else { setDpeStatus("selection_required"); }
    void requestAutour(payload, "residence");
  } catch (err) {
    setResult(null); setError(err instanceof Error ? err.message : "Erreur de chargement.");
  } finally { setLoading(false); }
}
```

- [ ] **Step 4: Rendre la section Énergie selon `dpeStatus`**

Là où la section Énergie / le passeport lisaient `result.dpe` / `dpe`, lire `selectedDpe`. Insérer,
en tête de la section Énergie, le rendu conditionnel :
```tsx
{(dpeStatus === "selection_required") && (
  <DpeSelector
    candidates={dpeCandidates}
    context={deriveAddressDpeContext(dpeCandidates)}
    onPick={(d) => { setSelectedDpe(d); setDpeStatus("confirmed"); void persistDpe("user_confirmed", d); }}
    onNotInList={() => { setSelectedDpe(null); setDpeStatus("rejected"); void persistDpe("not_in_list", null); }}
  />
)}
{dpeStatus === "not_found" && (
  <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
    Aucun DPE retrouvé dans la base ouverte pour cette adresse. Cela ne signifie pas nécessairement qu&apos;aucun diagnostic n&apos;existe.
  </p>
)}
{dpeStatus === "rejected" && (
  <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
    Aucun des diagnostics retrouvés n&apos;a été attribué à ce logement.
  </p>
)}
{dpeStatus === "auto_confirmed" && selectedDpe && (
  <p style={{ fontSize: 13, color: "var(--fg-4)", lineHeight: 1.55 }}>
    Un DPE a été retrouvé pour cette adresse.{" "}
    <button type="button" onClick={() => setDpeStatus("selection_required")} style={{ color: "var(--accent-dim, #7a6e60)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>Ce n&apos;est pas le bon diagnostic</button>.
  </p>
)}
```
Le bloc « étiquette DPE » n'est rendu que si `selectedDpe` existe ET `dpeStatus ∈ {auto_confirmed, confirmed}`.

- [ ] **Step 5: Persister le choix + le passer à la synthèse**

Ajouter le helper (persiste via un petit endpoint ou la route autour existante ; si aucun endpoint
d'écriture DPE n'existe, créer `POST /api/logement-dpe` minimal qui appelle `upsertLogement` avec
`buildDpeSelectionFields`). Version endpoint dédié :
```ts
async function persistDpe(status: "user_confirmed" | "not_in_list", dpe: DpeRecord | null) {
  const a = result?.address; if (!a?.citycode) return;
  try {
    await fetch("/api/logement-dpe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insee: a.citycode, status, dpe }),
    });
  } catch { /* échec silencieux UI, cohérence rétablie au prochain chargement */ }
}
```
Et dans `requestSynthesis`, transmettre au lieu de `data: result` :
```ts
body: JSON.stringify({ data: { ...result, selectedDpe, dpeSelectionStatus: dpeStatus === "confirmed" ? "user_confirmed" : dpeStatus } }),
```

- [ ] **Step 6: Créer l'endpoint d'écriture DPE (si absent)**

Créer `src/app/api/logement-dpe/route.ts` :
```ts
import { NextResponse } from "next/server";
import { createServerClientForRoute } from "@/lib/supabase-route"; // adapter à l'helper d'auth du projet
import { buildDpeSelectionFields, getLogement, upsertLogement } from "@/lib/logement-store";

export async function POST(request: Request) {
  const { insee, status, dpe } = await request.json();
  const sb = await createServerClientForRoute();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const existing = await getLogement(sb, user.id, insee);
  if (!existing) return NextResponse.json({ error: "no logement row" }, { status: 404 });
  const now = new Date().toISOString();
  await upsertLogement(sb, { ...existing, ...buildDpeSelectionFields(status, dpe, now) });
  return NextResponse.json({ ok: true });
}
```
> Adapter l'import du client Supabase authentifié au pattern réel du projet (regarder un endpoint
> existant qui écrit avec `auth.uid()`, ex. celui de `report_context` / `logement-autour`).

- [ ] **Step 7: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx src/app/api/logement-dpe/route.ts`
Expected: aucune erreur.

- [ ] **Step 8: Vérification en session (rendu payant)**

Lancer l'app, se placer derrière `canAccessCompleteReport`, tester : (a) une maison individuelle
(auto_confirmed + « ce n'est pas le bon »), (b) une résidence multi-DPE (sélecteur, choix, Énergie
se fige), (c) « mon logement n'est pas dans la liste » (wording d'absence + éventuel contexte
bâtiment ≥3), (d) rechargement (choix restauré). Vérifier qu'aucune classe n'apparaît avant choix.

- [ ] **Step 9: Commit**

```bash
git add src/components/report/LogementModule.tsx src/app/api/logement-dpe/route.ts
git commit -m "feat(logement): parcours précision adresse + attribution DPE honnête (intégration)"
```

---

## Self-Review (fait)

- **Couverture du spec** : §1 parcours → T2/T10/T11/T12 ; §2 machine à états → T12 ; §3 attribution
  (dédup/collapse + convergence) → T1/T2 ; §4 contexte bâtiment → T3/T11 ; §5 wording → T11/T12
  (verbatim en Global Constraints) ; §6 persistance → T8/T12 ; §7 contrat serveur → T6/T7 ;
  §8 fichiers → T1-T12 ; §9 tests → T1/T2/T3/T5/T6/T8. Hors périmètre (édition manuelle des champs)
  non planifié, volontairement.
- **Placeholders** : aucun « TODO/TBD » ; les deux points d'adaptation (client Supabase authentifié
  en T12/T6-endpoint, noms de sortie du prompt en T9) renvoient à un pattern existant précis à
  copier, pas à inventer.
- **Cohérence des types** : `DpeRecord` (étage/complément) défini T1, consommé T2/T3/T4/T8/T11/T12 ;
  `DpeAttribution` défini T2, consommé T12 ; `BanAddressResult.type` défini T5, consommé T6/T12 ;
  `SelectedBanAddress` défini T6, consommé T7/T12 ; `buildDpeSelectionFields` défini T8, consommé T12.

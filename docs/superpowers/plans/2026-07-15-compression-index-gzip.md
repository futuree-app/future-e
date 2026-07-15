# Compression au repos de l'index comparateur (gzip) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ramener `data/comparateur-index.json` de 77,5 Mo à ~10 Mo dans git en versionnant un `.gz` canonique, sans casser le runtime ni migrer les 25 scripts qui touchent l'index.

**Architecture:** `data/comparateur-index.json.gz` devient l'artefact canonique versionné et lu au runtime ; `data/comparateur-index.json` devient une copie de travail locale gitignorée. Logique pure partagée dans `scripts/lib/index-io.mjs` (pack/unpack/verify atomiques, round-trip SHA-256, gzip niveau 9 déterministe). Le chargement runtime est extrait dans un module pur `src/lib/compressed-index-loader.ts` (gunzip + mémoïsation par promise + validation racine), branché en deux lignes dans `comparateur-vie.ts`.

**Tech Stack:** Node 25 (strip-types natif pour `node --test *.test.ts`), `node:zlib`, `node:crypto`, Next.js (outputFileTracingIncludes), scripts ESM `.mjs`.

## Global Constraints

- **Le `.gz` est l'unique artefact canonique** ; le JSON local n'est jamais distribué (copie de travail régénérable). Réf. spec `docs/superpowers/specs/2026-07-15-compression-index-gzip-design.md`.
- **L'infra `index-io` reste générique** : elle ne connaît PAS `rankBands` ni aucune fonctionnalité métier. La validation d'enrichissement métier reste chez `populate-mismatch-rank.mts` (atomique, refuse sur anomalie).
- **`pack`/`unpack` écrivent atomiquement** : `<cible>.<pid>.<uuid>.tmp` puis `rename`, avec nettoyage du `.tmp` en `finally`. Jamais d'écriture en place.
- **Round-trip obligatoire** : après compression, `pack` relit le `.tmp`, décompresse, compare le **SHA-256** aux octets source ; refuse si divergence.
- **`unpack` valide le canonique** (racine + invariants) AVANT de publier la copie de travail.
- **Synchronisation vérifiée par contenu (SHA-256), jamais par `mtime`.**
- **gzip niveau 9, déterministe** (vérifié : `MTIME=0`, deux packs → même SHA). Un pack sans changement de données ne produit **aucun** diff git. Le déterminisme dépend de la version de zlib : `pack` doit tourner avec la version Node du projet (`engines`).
- **Doctrine de la promise rejetée (à graver) :** un premier chargement en échec reste mémoïsé ; les appels suivants échouent sans retry. **Ne jamais** ajouter de retry silencieux.
- **Runtime Node** (`fs` + `zlib`) : aucune route concernée n'est en `edge`.
- **Cutover atomique** : la bascule runtime (lecture du `.gz`), l'ajout du `.gz` au suivi git et le retrait du JSON se font dans **un seul commit** (jamais d'état intermédiaire cassé dans l'historique).
- Type racine : `type IndexFile = { meta: unknown; communes: IndexCommune[] }` (`src/lib/comparateur-vie.ts:540`). `IndexCommune` exporté (`:403`).
- Messages/erreurs en français, sans tiret cadratin (virgule ou deux points).
- Non-régression du projet, après le lot : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` (505 verts), `npx tsc --noEmit` (0), `node --env-file=.env.local scripts/probe-conclusion.ts` (20/20).

---

### Task 1 : Logique pure d'I/O gzip partagée (`scripts/lib/index-io.mjs`)

**Files:**
- Create: `scripts/lib/index-io.mjs`
- Test: `scripts/lib/index-io.test.mjs`

**Interfaces:**
- Produces :
  - `INDEX_JSON_PATH: string`, `INDEX_GZ_PATH: string`
  - `sha256(buf: Buffer): string`
  - `packJson(jsonBuffer: Buffer): Buffer` (gzip niveau 9)
  - `unpackGz(gzBuffer: Buffer): Buffer`
  - `parseCommunes(jsonBuffer: Buffer): object[]` (JSON.parse + `.communes` est un tableau, sinon throw)
  - `assertIndexInvariants(communes: object[], opts?: { minCount?: number, maxCount?: number }): void` — **générique, sans connaissance métier**

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `scripts/lib/index-io.test.mjs` :
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256, packJson, unpackGz, parseCommunes, assertIndexInvariants } from "./index-io.mjs";

const smallFixture = Buffer.from(JSON.stringify({
  meta: {},
  communes: [{ insee: "01001", nom: "A" }, { insee: "01002", nom: "B" }],
}));

test("round-trip pack -> unpack rend les octets d'origine", () => {
  assert.ok(unpackGz(packJson(smallFixture)).equals(smallFixture));
});

test("gzip déterministe : deux packs du même JSON -> même SHA-256", () => {
  assert.equal(sha256(packJson(smallFixture)), sha256(packJson(smallFixture)));
});

test("parseCommunes rejette une racine sans tableau communes", () => {
  assert.throws(() => parseCommunes(Buffer.from(JSON.stringify({ meta: {} }))), /communes/);
});

test("parseCommunes renvoie le tableau communes", () => {
  assert.equal(parseCommunes(smallFixture).length, 2);
});

test("invariants : rejette un code INSEE dupliqué", () => {
  const dup = [{ insee: "01001" }, { insee: "01001" }];
  assert.throws(() => assertIndexInvariants(dup, { minCount: 1, maxCount: 10 }), /dupliqué/);
});

test("invariants : rejette une commune sans code INSEE", () => {
  const bad = [{ insee: "01001" }, { nom: "sans insee" }];
  assert.throws(() => assertIndexInvariants(bad, { minCount: 1, maxCount: 10 }), /INSEE/);
});

test("invariants : rejette un effectif hors bornes (défaut 30000..40000)", () => {
  assert.throws(() => assertIndexInvariants([{ insee: "01001" }]), /effectif|communes/i);
});

test("invariants : accepte un index plausible", () => {
  const ok = [{ insee: "01001" }, { insee: "01002" }];
  assert.doesNotThrow(() => assertIndexInvariants(ok, { minCount: 1, maxCount: 10 }));
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test scripts/lib/index-io.test.mjs`
Expected: FAIL (`Cannot find module './index-io.mjs'`)

- [ ] **Step 3 : Écrire l'implémentation minimale**

Create `scripts/lib/index-io.mjs` :
```js
// Logique PURE d'I/O de l'index comparateur (gzip canonique). Aucune écriture de
// fichier ici : ces fonctions opèrent sur des Buffers, testables sans toucher
// l'index réel de 81 Mo. GÉNÉRIQUE : aucune connaissance métier (pas de rankBands).
// Les scripts index-pack/unpack/verify.mjs orchestrent l'I/O réelle par-dessus.
import zlib from "node:zlib";
import crypto from "node:crypto";
import path from "node:path";

export const INDEX_JSON_PATH = path.join(process.cwd(), "data", "comparateur-index.json");
export const INDEX_GZ_PATH = path.join(process.cwd(), "data", "comparateur-index.json.gz");

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// gzip niveau 9, déterministe (MTIME=0 dans l'en-tête Node) : un pack sans
// changement de données ne produit aucun diff git.
export function packJson(jsonBuffer) {
  return zlib.gzipSync(jsonBuffer, { level: 9 });
}

export function unpackGz(gzBuffer) {
  return zlib.gunzipSync(gzBuffer);
}

export function parseCommunes(jsonBuffer) {
  const parsed = JSON.parse(jsonBuffer.toString("utf8"));
  if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.communes)) {
    throw new Error("Index comparateur invalide : propriété communes absente ou non tableau.");
  }
  return parsed.communes;
}

// Invariants STRUCTURELS génériques (aucune fonctionnalité métier).
export function assertIndexInvariants(communes, opts = {}) {
  const { minCount = 30000, maxCount = 40000 } = opts;
  if (!Array.isArray(communes)) {
    throw new Error("Index invalide : communes n'est pas un tableau.");
  }
  if (communes.length <= minCount || communes.length >= maxCount) {
    throw new Error(`Index invalide : effectif de communes hors bornes (${communes.length}, attendu ]${minCount}, ${maxCount}[).`);
  }
  const seen = new Set();
  for (const c of communes) {
    if (typeof c.insee !== "string" || c.insee.length === 0) {
      throw new Error("Index invalide : commune sans code INSEE.");
    }
    if (seen.has(c.insee)) {
      throw new Error(`Index invalide : code INSEE dupliqué (${c.insee}).`);
    }
    seen.add(c.insee);
  }
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test scripts/lib/index-io.test.mjs`
Expected: PASS (8 tests)

- [ ] **Step 5 : Commit**

```bash
git add scripts/lib/index-io.mjs scripts/lib/index-io.test.mjs
git commit -m "feat(index): logique pure d'I/O gzip partagee, generique (pack/unpack/invariants)"
```

---

### Task 2 : Opérations fichier atomiques (`packFile`/`unpackFile`/`verifyIndex`)

**Files:**
- Modify: `scripts/lib/index-io.mjs` (ajout de 3 fonctions)
- Test: `scripts/lib/index-io.test.mjs` (ajout de tests d'intégration sur répertoire temporaire)

**Interfaces:**
- Consumes : `packJson`, `unpackGz`, `parseCommunes`, `assertIndexInvariants`, `sha256` (Task 1)
- Produces :
  - `packFile(jsonPath, gzPath, opts?): void` — JSON -> gz, atomique (tmp unique + finally), round-trip
  - `unpackFile(gzPath, jsonPath, opts?): void` — gz -> JSON, atomique, **valide invariants avant publication**
  - `verifyIndex(jsonPath, gzPath, opts?): void` — intégrité (+ synchro si JSON présent)

- [ ] **Step 1 : Écrire les tests qui échouent**

Append to `scripts/lib/index-io.test.mjs` :
```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { packFile, unpackFile, verifyIndex } from "./index-io.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "idx-io-"));
}
const bounds = { minCount: 1, maxCount: 10 };
const validIndex = JSON.stringify({ meta: {}, communes: [{ insee: "01001" }, { insee: "01002" }] });

test("packFile puis unpackFile : round-trip fichier identique", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.rmSync(jsonP);
  unpackFile(gzP, jsonP, bounds);
  assert.equal(fs.readFileSync(jsonP, "utf8"), validIndex);
});

test("packFile est déterministe : deuxième pack identique octet pour octet", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  const first = fs.readFileSync(gzP);
  packFile(jsonP, gzP, bounds);
  assert.ok(fs.readFileSync(gzP).equals(first));
});

test("packFile ne laisse aucun .tmp résiduel", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  assert.ok(fs.readdirSync(d).every((f) => !f.endsWith(".tmp")));
});

test("unpackFile refuse un canonique aux invariants violés (avant publication)", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  // gz d'un index à 2 communes, mais on exige minCount 100 -> doit refuser
  fs.writeFileSync(gzP, zlib.gzipSync(Buffer.from(validIndex)));
  assert.throws(() => unpackFile(gzP, jsonP, { minCount: 100, maxCount: 200 }), /effectif|communes/i);
  assert.ok(!fs.existsSync(jsonP)); // rien publié
});

test("verifyIndex : gz valide + JSON absent -> intégrité OK (pas de throw)", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.rmSync(jsonP);
  assert.doesNotThrow(() => verifyIndex(jsonP, gzP, bounds));
});

test("verifyIndex : JSON local divergent -> erreur demandant index:pack", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.writeFileSync(jsonP, validIndex.replace("01002", "09999"));
  assert.throws(() => verifyIndex(jsonP, gzP, bounds), /index:pack/);
});

test("verifyIndex : gz tronqué -> échec clair", () => {
  const d = tmpDir();
  const gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(gzP, Buffer.from([0x1f, 0x8b, 0x00, 0x00]));
  assert.throws(() => verifyIndex(path.join(d, "absent.json"), gzP, bounds));
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test scripts/lib/index-io.test.mjs`
Expected: FAIL (`packFile is not a function`)

- [ ] **Step 3 : Écrire l'implémentation minimale**

Append to `scripts/lib/index-io.mjs` :
```js
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";

function uniqueTmp(target) {
  return `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
}

// JSON de travail -> gz canonique. Atomique (tmp unique + rename), round-trip verifié.
export function packFile(jsonPath, gzPath, opts) {
  if (!existsSync(jsonPath)) {
    throw new Error("La copie de travail de l'index n'existe pas. Lancez `npm run index:unpack`.");
  }
  const jsonBuffer = readFileSync(jsonPath);
  assertIndexInvariants(parseCommunes(jsonBuffer), opts);
  const gz = packJson(jsonBuffer);
  const tmp = uniqueTmp(gzPath);
  try {
    writeFileSync(tmp, gz);
    if (sha256(unpackGz(readFileSync(tmp))) !== sha256(jsonBuffer)) {
      throw new Error("Round-trip gzip échoué : les octets décompressés diffèrent de la source.");
    }
    renameSync(tmp, gzPath);
  } finally {
    if (existsSync(tmp)) rmSync(tmp);
  }
}

// gz canonique -> JSON de travail. Atomique. Valide la structure ET les invariants
// AVANT de publier (le canonique doit être sain avant de devenir base de travail).
export function unpackFile(gzPath, jsonPath, opts) {
  const jsonBuffer = unpackGz(readFileSync(gzPath));
  assertIndexInvariants(parseCommunes(jsonBuffer), opts);
  const tmp = uniqueTmp(jsonPath);
  try {
    writeFileSync(tmp, jsonBuffer);
    renameSync(tmp, jsonPath);
  } finally {
    if (existsSync(tmp)) rmSync(tmp);
  }
}

// Vérifie l'intégrité du gz (+ la synchro avec le JSON local s'il existe).
export function verifyIndex(jsonPath, gzPath, opts) {
  const jsonBuffer = unpackGz(readFileSync(gzPath)); // throw si gz illisible/tronqué
  assertIndexInvariants(parseCommunes(jsonBuffer), opts);
  if (existsSync(jsonPath)) {
    if (sha256(readFileSync(jsonPath)) !== sha256(jsonBuffer)) {
      throw new Error("L'index local a été modifié mais l'artefact versionné n'a pas été repacké. Lancez `npm run index:pack`.");
    }
  }
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test scripts/lib/index-io.test.mjs`
Expected: PASS (15 tests au total)

- [ ] **Step 5 : Commit**

```bash
git add scripts/lib/index-io.mjs scripts/lib/index-io.test.mjs
git commit -m "feat(index): operations fichier atomiques (tmp unique, round-trip, unpack valide le canonique)"
```

---

### Task 3 : Scripts d'entrée + garde clone frais + commandes npm + pin Node

**Files:**
- Create: `scripts/index-pack.mjs`, `scripts/index-unpack.mjs`, `scripts/index-verify.mjs`
- Create: `scripts/lib/require-index-worktree.mjs`
- Test: `scripts/lib/require-index-worktree.test.mjs`
- Modify: `package.json` (`scripts` + `engines`)

**Interfaces:**
- Consumes : `packFile`, `unpackFile`, `verifyIndex`, `INDEX_JSON_PATH`, `INDEX_GZ_PATH` (Tasks 1-2)
- Produces : `assertIndexWorktree(jsonPath?): void` ; commandes `index:pack`, `index:unpack`, `index:verify`, `prebuild`.

- [ ] **Step 1 : Écrire le test du garde qui échoue**

Create `scripts/lib/require-index-worktree.test.mjs` :
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertIndexWorktree } from "./require-index-worktree.mjs";

test("throw le message métier si le JSON de travail manque", () => {
  assert.throws(() => assertIndexWorktree("/chemin/inexistant/idx.json"), /index:unpack/);
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test scripts/lib/require-index-worktree.test.mjs`
Expected: FAIL (module introuvable)

- [ ] **Step 3 : Écrire les scripts**

Create `scripts/lib/require-index-worktree.mjs` :
```js
// Garde optionnelle pour les scripts d'enrichissement : remplace un ENOENT brut
// par un message métier. Câblée au fil de l'eau (une ligne). Couverture best-effort
// assumée (cf. spec §4.6).
import { existsSync } from "node:fs";
import { INDEX_JSON_PATH } from "./index-io.mjs";

export function assertIndexWorktree(jsonPath = INDEX_JSON_PATH) {
  if (!existsSync(jsonPath)) {
    throw new Error("La copie de travail de l'index n'existe pas. Lancez `npm run index:unpack`.");
  }
}
```

Create `scripts/index-pack.mjs` :
```js
#!/usr/bin/env node
import { packFile, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  packFile(INDEX_JSON_PATH, INDEX_GZ_PATH);
  console.log("Index packé : data/comparateur-index.json.gz");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
```

Create `scripts/index-unpack.mjs` :
```js
#!/usr/bin/env node
import { unpackFile, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  unpackFile(INDEX_GZ_PATH, INDEX_JSON_PATH);
  console.log("Copie de travail écrite : data/comparateur-index.json");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
```

Create `scripts/index-verify.mjs` :
```js
#!/usr/bin/env node
import { verifyIndex, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  verifyIndex(INDEX_JSON_PATH, INDEX_GZ_PATH);
  console.log("Index vérifié.");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
```

- [ ] **Step 4 : Commandes npm + pin de version Node**

Modify `package.json`. Ajouter au bloc `scripts` :
```json
    "index:unpack": "node scripts/index-unpack.mjs",
    "index:pack": "node scripts/index-pack.mjs",
    "index:verify": "node scripts/index-verify.mjs",
    "prebuild": "node scripts/index-verify.mjs"
```
Ajouter (le déterminisme gzip dépend de la version zlib de Node ; le `pack` doit tourner avec la version projet) :
```json
  "engines": {
    "node": ">=25"
  }
```

- [ ] **Step 5 : Lancer le test du garde, vérifier le succès**

Run: `node --test scripts/lib/require-index-worktree.test.mjs`
Expected: PASS

- [ ] **Step 6 : Commit**

```bash
git add scripts/index-pack.mjs scripts/index-unpack.mjs scripts/index-verify.mjs scripts/lib/require-index-worktree.mjs scripts/lib/require-index-worktree.test.mjs package.json
git commit -m "feat(index): scripts pack/unpack/verify + garde clone frais + commandes npm (prebuild) + engines node"
```

---

### Task 4 : Mémoïsation par promise (`src/lib/memoize-promise.ts`)

**Files:**
- Create: `src/lib/memoize-promise.ts`
- Test: `src/lib/memoize-promise.test.ts`

**Interfaces:**
- Produces : `memoizePromise<T>(fn: () => Promise<T>): () => Promise<T>`

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `src/lib/memoize-promise.test.ts` :
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { memoizePromise } from "./memoize-promise.ts";

test("n'appelle fn qu'une fois sous appels concurrents", async () => {
  let calls = 0;
  const load = memoizePromise(async () => { calls++; await Promise.resolve(); return 42; });
  const [a, b, c] = await Promise.all([load(), load(), load()]);
  assert.equal(calls, 1);
  assert.deepEqual([a, b, c], [42, 42, 42]);
});

test("mémoïse le rejet : pas de retry après un premier échec", async () => {
  let calls = 0;
  const load = memoizePromise(async () => { calls++; throw new Error("boom"); });
  await assert.rejects(load(), /boom/);
  await assert.rejects(load(), /boom/);
  assert.equal(calls, 1);
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test src/lib/memoize-promise.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/memoize-promise.ts` :
```ts
// Mémoïse une fonction async sans argument : déduplique les appels concurrents
// (une seule exécution) et CONSERVE une promesse rejetée (pas de retry). Pour un
// artefact canonique corrompu, l'échec doit être fatal : réparer puis redémarrer.
// Ne pas transformer ceci en retry silencieux.
export function memoizePromise<T>(fn: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => (promise ??= fn());
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test src/lib/memoize-promise.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/memoize-promise.ts src/lib/memoize-promise.test.ts
git commit -m "feat(index): memoizePromise (dedup concurrent + rejet persistant)"
```

---

### Task 5 : Validation de la structure racine (`src/lib/comparateur-index-payload.ts`)

**Files:**
- Create: `src/lib/comparateur-index-payload.ts`
- Test: `src/lib/comparateur-index-payload.test.ts`

**Interfaces:**
- Consumes : `type IndexCommune` (import type-only depuis `./comparateur-vie`, effacé à l'exécution : `server-only` non chargé)
- Produces : `communesFromPayload(text: string): IndexCommune[]`

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `src/lib/comparateur-index-payload.test.ts` :
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { communesFromPayload } from "./comparateur-index-payload.ts";

test("renvoie le tableau communes d'un payload valide", () => {
  const communes = communesFromPayload(JSON.stringify({ meta: {}, communes: [{ insee: "01001" }] }));
  assert.equal(communes.length, 1);
  assert.equal(communes[0].insee, "01001");
});

test("throw si la racine n'a pas de tableau communes", () => {
  assert.throws(() => communesFromPayload(JSON.stringify({ meta: {} })), /communes/);
});

test("throw sur JSON invalide", () => {
  assert.throws(() => communesFromPayload("{pas du json"));
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test src/lib/comparateur-index-payload.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/comparateur-index-payload.ts` :
```ts
import type { IndexCommune } from "./comparateur-vie";

// Valide la structure racine (objet { communes: [...] }) au lieu de caster : un
// cast satisferait TS mais pourrait retourner le mauvais niveau. Module PUR
// (aucun server-only) : testable en isolation.
export function communesFromPayload(text: string): IndexCommune[] {
  const parsed: unknown = JSON.parse(text);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { communes?: unknown }).communes)
  ) {
    throw new Error("Index comparateur invalide : propriété communes absente.");
  }
  return (parsed as { communes: IndexCommune[] }).communes;
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test src/lib/comparateur-index-payload.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/comparateur-index-payload.ts src/lib/comparateur-index-payload.test.ts
git commit -m "feat(index): communesFromPayload (validation structure racine, module pur)"
```

---

### Task 6 : Loader runtime testable (`src/lib/compressed-index-loader.ts`)

Extrait tout le chargement hors de `comparateur-vie.ts` (server-only) pour prouver le **branchement réel** (le défaut « deux appels concurrents lisent deux fois » se teste ici, pas seulement sur la brique `memoizePromise`).

**Files:**
- Create: `src/lib/compressed-index-loader.ts`
- Test: `src/lib/compressed-index-loader.test.ts`

**Interfaces:**
- Consumes : `memoizePromise` (Task 4), `communesFromPayload` (Task 5)
- Produces : `createCompressedIndexLoader(gzPath: string, afterLoad?: (communes: IndexCommune[]) => void): () => Promise<IndexCommune[]>`

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `src/lib/compressed-index-loader.test.ts` :
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createCompressedIndexLoader } from "./compressed-index-loader.ts";

function writeGz(obj: unknown): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "cil-"));
  const p = path.join(d, "idx.json.gz");
  fs.writeFileSync(p, zlib.gzipSync(Buffer.from(JSON.stringify(obj))));
  return p;
}

test("charge et décompresse une seule fois sous appels concurrents ; afterLoad 1x", async () => {
  const gz = writeGz({ meta: {}, communes: [{ insee: "01001" }, { insee: "01002" }] });
  let afterCalls = 0;
  const load = createCompressedIndexLoader(gz, () => { afterCalls++; });
  const [a, b, c] = await Promise.all([load(), load(), load()]);
  assert.equal(afterCalls, 1);
  assert.equal(a.length, 2);
  assert.equal(b, a);
  assert.equal(c, a);
});

test("rejette une racine invalide", async () => {
  const gz = writeGz({ meta: {} });
  const load = createCompressedIndexLoader(gz);
  await assert.rejects(load(), /communes/);
});

test("mémoïse le rejet (fichier absent) : afterLoad jamais atteint, pas de retry", async () => {
  let afterCalls = 0;
  const load = createCompressedIndexLoader("/inexistant/idx.json.gz", () => { afterCalls++; });
  await assert.rejects(load());
  await assert.rejects(load());
  assert.equal(afterCalls, 0);
});
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `node --test src/lib/compressed-index-loader.test.ts`
Expected: FAIL (module introuvable)

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/compressed-index-loader.ts` :
```ts
import { readFile } from "node:fs/promises";
import zlib from "node:zlib";
import { memoizePromise } from "./memoize-promise";
import { communesFromPayload } from "./comparateur-index-payload";
import type { IndexCommune } from "./comparateur-vie";

// Assemble le chargement de l'index gzip : lecture + gunzip + validation racine,
// dédupliqué/mémoïsé (une seule lecture disque, rejet persistant). `afterLoad`
// permet à l'appelant de peupler ses caches dérivés (buildUuPop) une seule fois.
export function createCompressedIndexLoader(
  gzPath: string,
  afterLoad: (communes: IndexCommune[]) => void = () => {},
): () => Promise<IndexCommune[]> {
  return memoizePromise(async () => {
    const compressed = await readFile(gzPath);
    const communes = communesFromPayload(zlib.gunzipSync(compressed).toString("utf8"));
    afterLoad(communes);
    return communes;
  });
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test src/lib/compressed-index-loader.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/compressed-index-loader.ts src/lib/compressed-index-loader.test.ts
git commit -m "feat(index): createCompressedIndexLoader (chargement gzip memoise, teste de bout en bout)"
```

---

### Task 7 : Cutover atomique — runtime + tracing + git + hook + doc (UN commit)

Bascule la source canonique en un seul commit cohérent : aucun état intermédiaire cassé dans l'historique. Le JSON reste physiquement sur disque (copie de travail) pendant toute la vérification.

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (imports en tête ; cache `:542` ; `loadIndex` `:572-580`)
- Modify: `next.config.ts` (3 occurrences)
- Modify: `.gitignore`
- Create: `scripts/install-git-hooks.mjs`
- Modify: `package.json` (ajout `hooks:install`)
- Modify: `docs/handoff/CURRENT.md`
- Git: `git rm --cached data/comparateur-index.json` ; add `data/comparateur-index.json.gz`

**Interfaces:**
- Consumes : `createCompressedIndexLoader` (Task 6), `index:verify` (Task 3)

- [ ] **Step 1 : Générer le `.gz` canonique (JSON encore présent, non basculé)**

Run:
```bash
node scripts/index-pack.mjs
ls -la data/comparateur-index.json.gz
```
Expected: `Index packé` ; fichier `.gz` ~10 Mo présent.

- [ ] **Step 2 : Brancher `loadIndex` sur le loader**

In `src/lib/comparateur-vie.ts`, après `import path from "node:path";` (`:3`), ajouter :
```ts
import { createCompressedIndexLoader } from "@/lib/compressed-index-loader";
```
Remplacer `src/lib/comparateur-vie.ts:542` :
```ts
let indexCache: IndexCommune[] | null = null;
```
par :
```ts
const INDEX_GZ_PATH = path.join(process.cwd(), "data", "comparateur-index.json.gz");
const loadIndexOnce = createCompressedIndexLoader(INDEX_GZ_PATH, buildUuPop);
```
Remplacer le corps de `loadIndex` (`:572-580`) :
```ts
async function loadIndex(): Promise<IndexCommune[]> {
  if (indexCache) return indexCache;
  const filePath = path.join(process.cwd(), "data", "comparateur-index.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as IndexFile;
  indexCache = parsed.communes;
  buildUuPop(indexCache);
  return indexCache;
}
```
par (on conserve `function loadIndex` pour le hoisting et un diff minimal chez les appelants) :
```ts
// L'index canonique est un .gz versionné (cf. spec compression-index-gzip).
// Le loader gunzip + mémoïse + valide la racine, et appelle buildUuPop une fois.
async function loadIndex(): Promise<IndexCommune[]> {
  return loadIndexOnce();
}
```
Puis vérifier `IndexFile` : `grep -n "IndexFile" src/lib/comparateur-vie.ts`. S'il n'est plus référencé, supprimer sa déclaration (`:540`) ; sinon la laisser. Idem `fs` (`node:fs/promises`) : s'il n'est plus utilisé ailleurs, `tsc`/lint le signalera, le retirer alors.

- [ ] **Step 3 : Repointer `outputFileTracingIncludes`**

In `next.config.ts`, remplacer les **3** occurrences de :
```ts
"./data/comparateur-index.json",
```
par :
```ts
"./data/comparateur-index.json.gz",
```
(routes `/api/comparateur-vie/match`, `/rapport/quartier`, `/api/synthesize-quartier`.)

- [ ] **Step 4 : Vérifier tsc + runtime à l'écran**

Run:
```bash
npx tsc --noEmit
npm run dev
```
Charger un dossier réel (`/rapport/quartier` Roubaix, ou `/ou-vivre`). Expected: 0 erreur tsc ; page rendue sans `ENOENT`/`gunzip`.

- [ ] **Step 5 : Gitignore le JSON + script d'installation du hook**

In `.gitignore`, sous le bloc « Caches bruts régénérables » (`:60`), ajouter :
```
# Copie de travail de l'index (artefact canonique = comparateur-index.json.gz)
data/comparateur-index.json
```

Create `scripts/install-git-hooks.mjs` :
```js
#!/usr/bin/env node
// Installe un hook git pre-commit natif (pas de husky) qui lance index:verify.
// Dissuasif seulement (contournable par --no-verify). Non destructif : refuse
// d'écraser un hook existant non géré par futur•e.
import { readFileSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const MARKER = "# futur-e-managed-index-hook";
const BODY = `#!/bin/sh\n${MARKER}\nnpm run index:verify\n`;

// git rev-parse gère worktrees et configs particulières (plutôt que supposer .git/hooks).
const hooksDir = execSync("git rev-parse --git-path hooks").toString().trim();
const hookPath = path.join(path.resolve(hooksDir), "pre-commit");

if (existsSync(hookPath) && !readFileSync(hookPath, "utf8").includes(MARKER)) {
  console.error("Un hook pre-commit existe déjà sans marqueur futur•e. Intégrez `npm run index:verify` manuellement, ou supprimez le hook puis relancez `npm run hooks:install`.");
  process.exit(1);
}
writeFileSync(hookPath, BODY);
chmodSync(hookPath, 0o755);
console.log("Hook pre-commit installé (futur•e-managed) : npm run index:verify");
```
Add to `package.json` scripts :
```json
    "hooks:install": "node scripts/install-git-hooks.mjs"
```
Run:
```bash
npm run hooks:install
```
Expected: `Hook pre-commit installé`.

- [ ] **Step 6 : Note de prérequis dans le handoff**

In `docs/handoff/CURRENT.md`, remplacer l'avertissement « GitHub avertit … >50 Mo » (devenu caduc) par :
```markdown
**Index gzip :** l'artefact canonique est `data/comparateur-index.json.gz` (~10 Mo). Après un clone frais
ou avant une session d'enrichissement : `npm run index:unpack` (écrit la copie de travail
`comparateur-index.json`, gitignorée). Après un enrichissement : `npm run index:pack`, puis committer le
`.gz`. `npm run hooks:install` pose le hook pre-commit de vérification.
```

- [ ] **Step 7 : Retirer le JSON du suivi, vérifier verify + build**

Run:
```bash
git rm --cached data/comparateur-index.json
node scripts/index-verify.mjs   # JSON local présent -> régime synchro, doit passer
npm run build                   # prebuild = index:verify (intégrité) puis build Next complet
git status --short              # D (cached) comparateur-index.json ; A comparateur-index.json.gz ; M autres
```
Expected: `Index vérifié.` ; build réussi ; le JSON n'est plus suivi (mais reste sur disque).

- [ ] **Step 8 : Commit unique du cutover**

```bash
git add src/lib/comparateur-vie.ts next.config.ts .gitignore data/comparateur-index.json.gz scripts/install-git-hooks.mjs package.json docs/handoff/CURRENT.md
git commit -m "feat(index): cutover atomique gzip (77,5 Mo -> ~10 Mo) : gz canonique versionne, runtime + tracing, JSON gitignore, hook pre-commit"
```

- [ ] **Step 9 : Test d'acceptation déterminisme (aucun diff git au re-pack)**

Run:
```bash
npm run index:pack
git diff --exit-code data/comparateur-index.json.gz
```
Expected: exit 0 (aucun diff : gzip déterministe, pas de re-commit fantôme).

---

### Task 8 : Garde clone frais câblée sur les scripts d'enrichissement ESM actifs (best-effort)

**Files:**
- Modify: `scripts/populate-mismatch-rank.mts`, `scripts/populate-logement.mjs`, `scripts/populate-hlm.mjs`, `scripts/populate-rayonnement-index.mjs`, `scripts/populate-uu-pop.mjs`, `scripts/add-relief-proximite.mjs`

**Interfaces:**
- Consumes : `assertIndexWorktree` (Task 3)

- [ ] **Step 1 : Câbler la garde en tête de chaque script**

Dans chaque fichier, après les imports et **avant** la première lecture de l'index, ajouter :
```js
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
assertIndexWorktree();
```
Ne **pas** toucher la logique I/O. Les scripts `.js` CommonJS et `research/*` restent hors périmètre (ENOENT toléré, documenté au §4.6 de la spec).

- [ ] **Step 2 : Vérifier le câblage + non-régression des types**

Run:
```bash
grep -l "assertIndexWorktree" scripts/populate-*.mjs scripts/populate-mismatch-rank.mts scripts/add-relief-proximite.mjs
node scripts/index-unpack.mjs   # s'assurer que la copie de travail existe
npx tsc --noEmit
```
Expected: fichiers modifiés listés ; copie de travail présente ; 0 erreur tsc.

- [ ] **Step 3 : Commit**

```bash
git add scripts/populate-mismatch-rank.mts scripts/populate-logement.mjs scripts/populate-hlm.mjs scripts/populate-rayonnement-index.mjs scripts/populate-uu-pop.mjs scripts/add-relief-proximite.mjs
git commit -m "feat(index): garde clone frais sur les scripts d'enrichissement ESM actifs (best-effort)"
```

---

### Task 9 : Vérification de non-régression finale

**Files:** aucune modification (contrôle)

- [ ] **Step 1 : Suite de tests complète**

Run:
```bash
node --test scripts/lib/index-io.test.mjs scripts/lib/require-index-worktree.test.mjs \
  src/lib/memoize-promise.test.ts src/lib/comparateur-index-payload.test.ts src/lib/compressed-index-loader.test.ts
node --test src/lib/*.test.ts src/lib/decision/*.test.ts
```
Expected: tous verts (dont les 505 existants + les nouveaux).

- [ ] **Step 2 : Types + sonde métier**

Run:
```bash
npx tsc --noEmit
node --env-file=.env.local scripts/probe-conclusion.ts
```
Expected: 0 erreur tsc ; sonde 20/20 (le dossier lit le même index, le round-trip garantit l'identité).

- [ ] **Step 3 : Taille finale + surveillance historique**

Run:
```bash
git cat-file -s HEAD:data/comparateur-index.json.gz | awk '{printf "%.1f Mo\n", $1/1024/1024}'
git count-objects -vH | grep size-pack
```
Expected: `.gz` ~10 Mo (bien sous 50). Noter `size-pack` pour surveiller le risque deltas git (spec §6).

- [ ] **Step 4 : Vérification à l'écran (dossiers réels)**

Charger Roubaix (`arbitration`), Digne-les-Bains (`favorable`), Arbigny (`neutral`). Expected: orientations et synthèse identiques à avant la bascule.

---

## Notes de séquencement

- **Tasks 1 à 6 n'affectent pas la production** : l'app lit encore le JSON clair inchangé. Livrables isolés, aucun risque de casse. Tout le mécanisme (I/O, invariants, loader) est écrit ET testé avant de toucher au chemin de production.
- **Task 7 est le cutover atomique de la source canonique** (un seul commit : runtime + tracing + git + hook + doc). Revertable (revert du commit + JSON remis sous suivi) ; le sérieux vient de l'interdiction d'un état intermédiaire incohérent, pas d'une irréversibilité.
- **Task 8** est un raffinement best-effort, sans impact runtime : reportable sans bloquer le reste.
- **À confirmer post-déploiement** (hors périmètre code, spec §9) : le gain runtime (935 ms local chaud) au premier chargement réel sur Vercel (disque froid).

# Compression au repos de l'index comparateur (gzip) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ramener `data/comparateur-index.json` de 77,5 Mo à ~10 Mo dans git en versionnant un `.gz` canonique, sans casser le runtime ni migrer les 25 scripts qui touchent l'index.

**Architecture:** `data/comparateur-index.json.gz` devient l'artefact canonique versionné et lu au runtime ; `data/comparateur-index.json` devient une copie de travail locale gitignorée. Trois scripts `pack`/`unpack`/`verify` (atomiques, round-trip SHA-256, gzip niveau 9 déterministe) et une logique pure partagée dans `scripts/lib/index-io.mjs`. Le runtime `loadIndex()` gunzip + mémoïse par promise + valide la structure racine.

**Tech Stack:** Node 25 (strip-types natif pour `node --test *.test.ts`), `node:zlib` (gzip/gunzip), `node:crypto` (SHA-256), Next.js (outputFileTracingIncludes), scripts ESM `.mjs`.

## Global Constraints

- **Le `.gz` est l'unique artefact canonique** ; le JSON local n'est jamais distribué (copie de travail régénérable). Réf. spec `docs/superpowers/specs/2026-07-15-compression-index-gzip-design.md`.
- **`pack`/`unpack` écrivent atomiquement** : `<cible>.tmp` puis `rename`. Jamais d'écriture en place.
- **Round-trip obligatoire** : après compression, `pack` relit le `.tmp`, décompresse, et compare le **SHA-256** aux octets source ; refuse si divergence.
- **Synchronisation vérifiée par contenu (SHA-256), jamais par `mtime`.**
- **gzip niveau 9, déterministe** (vérifié : `MTIME=0`, deux packs → même SHA). Un pack sans changement de données ne produit **aucun** diff git.
- **Doctrine de la promise rejetée (à graver) :** si le premier chargement échoue, la promesse rejetée reste mémoïsée ; tous les appels suivants échouent sans retry. **Ne jamais** ajouter de retry silencieux.
- **Runtime Node** (`fs` + `zlib`) : aucune route concernée n'est en `edge`.
- Type racine de l'index : `type IndexFile = { meta: unknown; communes: IndexCommune[] }` (déjà défini `src/lib/comparateur-vie.ts:540`). `IndexCommune` est exporté (`:403`).
- Format des messages/erreurs en français, sans tiret cadratin (virgule ou deux points).
- Vérif de non-régression du projet, après le lot : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` (505 verts), `npx tsc --noEmit` (0), `node --env-file=.env.local scripts/probe-conclusion.ts` (20/20).

---

### Task 1 : Logique pure d'I/O gzip partagée (`scripts/lib/index-io.mjs`)

**Files:**
- Create: `scripts/lib/index-io.mjs`
- Test: `scripts/lib/index-io.test.mjs`

**Interfaces:**
- Produces :
  - `INDEX_JSON_PATH: string`, `INDEX_GZ_PATH: string` (chemins absolus dérivés de `process.cwd()`)
  - `sha256(buf: Buffer): string` (hex)
  - `packJson(jsonBuffer: Buffer): Buffer` (gzip niveau 9)
  - `unpackGz(gzBuffer: Buffer): Buffer`
  - `parseCommunes(jsonBuffer: Buffer): object[]` (JSON.parse + `.communes` est un tableau, sinon throw)
  - `assertIndexInvariants(communes: object[], opts?: { minCount?: number, maxCount?: number }): void`

- [ ] **Step 1 : Écrire les tests qui échouent**

Create `scripts/lib/index-io.test.mjs` :
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256, packJson, unpackGz, parseCommunes, assertIndexInvariants } from "./index-io.mjs";

const smallFixture = Buffer.from(JSON.stringify({
  meta: {},
  communes: [
    { insee: "01001", nom: "A", rankBands: { nature: [10, 20] } },
    { insee: "01002", nom: "B" },
  ],
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
  const dup = [{ insee: "01001", rankBands: {} }, { insee: "01001" }];
  assert.throws(() => assertIndexInvariants(dup, { minCount: 1, maxCount: 10 }), /dupliqué/);
});

test("invariants : rejette une commune sans code INSEE", () => {
  const bad = [{ insee: "01001", rankBands: {} }, { nom: "sans insee" }];
  assert.throws(() => assertIndexInvariants(bad, { minCount: 1, maxCount: 10 }), /INSEE/);
});

test("invariants : rejette un effectif hors bornes (défaut 30000..40000)", () => {
  assert.throws(() => assertIndexInvariants([{ insee: "01001", rankBands: {} }]), /effectif|communes/i);
});

test("invariants : rejette l'absence totale de rankBands", () => {
  const noBands = [{ insee: "01001" }, { insee: "01002" }];
  assert.throws(() => assertIndexInvariants(noBands, { minCount: 1, maxCount: 10 }), /rankBands|enrichissement/i);
});

test("invariants : accepte un index plausible", () => {
  const ok = [{ insee: "01001", rankBands: { nature: [1, 2] } }, { insee: "01002" }];
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
// fichier ici : ces fonctions opèrent sur des Buffers, ce qui les rend testables
// sans toucher l'index réel de 81 Mo. Les scripts index-pack/unpack/verify.mjs
// orchestrent l'I/O réelle par-dessus.
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
  if (!communes.some((c) => c.rankBands && Object.keys(c.rankBands).length > 0)) {
    throw new Error("Index invalide : aucun enrichissement rankBands present (rebuild non enrichi ?).");
  }
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `node --test scripts/lib/index-io.test.mjs`
Expected: PASS (9 tests)

- [ ] **Step 5 : Commit**

```bash
git add scripts/lib/index-io.mjs scripts/lib/index-io.test.mjs
git commit -m "feat(index): logique pure d'I/O gzip partagee (pack/unpack/invariants)"
```

---

### Task 2 : Opérations fichier atomiques (`pack`/`unpack`/`verify` de niveau fichier)

**Files:**
- Modify: `scripts/lib/index-io.mjs` (ajout de 3 fonctions au fichier de la Task 1)
- Test: `scripts/lib/index-io.test.mjs` (ajout de tests d'intégration sur répertoire temporaire)

**Interfaces:**
- Consumes : `packJson`, `unpackGz`, `parseCommunes`, `assertIndexInvariants`, `sha256` (Task 1)
- Produces :
  - `packFile(jsonPath: string, gzPath: string, opts?): void` — JSON -> gz canonique, atomique, round-trip
  - `unpackFile(gzPath: string, jsonPath: string): void` — gz -> JSON de travail, atomique
  - `verifyIndex(jsonPath: string, gzPath: string, opts?): void` — intégrité (+ synchro si JSON présent)

- [ ] **Step 1 : Écrire les tests qui échouent**

Append to `scripts/lib/index-io.test.mjs` :
```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { packFile, unpackFile, verifyIndex } from "./index-io.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "idx-io-"));
}
const bounds = { minCount: 1, maxCount: 10 };
const validIndex = JSON.stringify({
  meta: {}, communes: [{ insee: "01001", rankBands: { nature: [1, 2] } }, { insee: "01002" }],
});

test("packFile puis unpackFile : round-trip fichier identique", () => {
  const d = tmpDir();
  const jsonP = path.join(d, "idx.json"), gzP = path.join(d, "idx.json.gz");
  fs.writeFileSync(jsonP, validIndex);
  packFile(jsonP, gzP, bounds);
  fs.rmSync(jsonP);
  unpackFile(gzP, jsonP);
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
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";

// JSON de travail -> gz canonique. Atomique (.tmp + rename) et round-trip verifié.
export function packFile(jsonPath, gzPath, opts) {
  if (!existsSync(jsonPath)) {
    throw new Error("La copie de travail de l'index n'existe pas. Lancez `npm run index:unpack`.");
  }
  const jsonBuffer = readFileSync(jsonPath);
  assertIndexInvariants(parseCommunes(jsonBuffer), opts);
  const gz = packJson(jsonBuffer);
  const tmp = `${gzPath}.tmp`;
  writeFileSync(tmp, gz);
  if (sha256(unpackGz(readFileSync(tmp))) !== sha256(jsonBuffer)) {
    throw new Error("Round-trip gzip échoué : les octets décompressés diffèrent de la source.");
  }
  renameSync(tmp, gzPath);
}

// gz canonique -> JSON de travail. Atomique. Valide la structure avant de publier.
export function unpackFile(gzPath, jsonPath) {
  const jsonBuffer = unpackGz(readFileSync(gzPath));
  parseCommunes(jsonBuffer); // throw si structure invalide
  const tmp = `${jsonPath}.tmp`;
  writeFileSync(tmp, jsonBuffer);
  renameSync(tmp, jsonPath);
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
Expected: PASS (14 tests au total)

- [ ] **Step 5 : Commit**

```bash
git add scripts/lib/index-io.mjs scripts/lib/index-io.test.mjs
git commit -m "feat(index): operations fichier atomiques pack/unpack/verify (round-trip, deux regimes)"
```

---

### Task 3 : Scripts d'entrée + garde clone frais + commandes npm

**Files:**
- Create: `scripts/index-pack.mjs`, `scripts/index-unpack.mjs`, `scripts/index-verify.mjs`
- Create: `scripts/lib/require-index-worktree.mjs`
- Test: `scripts/lib/require-index-worktree.test.mjs`
- Modify: `package.json` (bloc `scripts`)

**Interfaces:**
- Consumes : `packFile`, `unpackFile`, `verifyIndex`, `INDEX_JSON_PATH`, `INDEX_GZ_PATH` (Tasks 1-2)
- Produces : `assertIndexWorktree(jsonPath?: string): void` (throw le message métier si le JSON de travail manque) ; commandes `index:pack`, `index:unpack`, `index:verify`, `prebuild`.

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
// par un message métier. Câblée au fil de l'eau (une ligne), sans toucher la
// logique I/O des scripts. Couverture best-effort assumée (cf. spec §4.6).
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

- [ ] **Step 4 : Ajouter les commandes npm**

Modify `package.json`, bloc `scripts` (actuel : `dev`, `build`, `start`, `lint`). Ajouter :
```json
    "index:unpack": "node scripts/index-unpack.mjs",
    "index:pack": "node scripts/index-pack.mjs",
    "index:verify": "node scripts/index-verify.mjs",
    "prebuild": "node scripts/index-verify.mjs"
```
(`prebuild` est lancé automatiquement par npm avant `build`, donc par Vercel à chaque déploiement : régime intégrité, checkout frais sans JSON local.)

- [ ] **Step 5 : Lancer le test du garde, vérifier le succès**

Run: `node --test scripts/lib/require-index-worktree.test.mjs`
Expected: PASS

- [ ] **Step 6 : Commit**

```bash
git add scripts/index-pack.mjs scripts/index-unpack.mjs scripts/index-verify.mjs scripts/lib/require-index-worktree.mjs scripts/lib/require-index-worktree.test.mjs package.json
git commit -m "feat(index): scripts pack/unpack/verify + garde clone frais + commandes npm (prebuild)"
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
// (une seule exécution), et CONSERVE une promesse rejetée (pas de retry). Pour un
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
- Consumes : `type IndexCommune` (import type-only depuis `./comparateur-vie`, effacé à l'exécution : le module `server-only` n'est pas chargé)
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

// Valide la structure racine de l'index (objet { communes: [...] }) au lieu de
// caster : un cast satisferait TS mais pourrait retourner le mauvais niveau.
// Module PUR (aucun server-only) : testable en isolation.
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

### Task 6 : Bascule runtime — `loadIndex()` lit le gz + `next.config.ts`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (imports en tête ; bloc `loadIndex` `:542`, `:572-580`)
- Modify: `next.config.ts` (3 occurrences)

**Interfaces:**
- Consumes : `memoizePromise` (Task 4), `communesFromPayload` (Task 5)
- Produces : `loadIndex(): Promise<IndexCommune[]>` inchangé en signature (le reste du fichier n'est pas touché)

- [ ] **Step 1 : Ajouter les imports**

In `src/lib/comparateur-vie.ts`, après la ligne `import path from "node:path";` (`:3`), ajouter :
```ts
import zlib from "node:zlib";
import { memoizePromise } from "@/lib/memoize-promise";
import { communesFromPayload } from "@/lib/comparateur-index-payload";
```

- [ ] **Step 2 : Remplacer le cache et loadIndex**

Replace `src/lib/comparateur-vie.ts:542` :
```ts
let indexCache: IndexCommune[] | null = null;
```
par :
```ts
let indexPromise: Promise<IndexCommune[]> | null = null;
```

Replace the body of `loadIndex` (`:572-580`) :
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
par :
```ts
// L'index canonique est un .gz versionné (cf. spec compression-index-gzip).
// Lire 10 Mo + gunzip coûte moins que lire 81 Mo de JSON clair. La mémoïsation
// par promise dédoublonne les appels concurrents ; une promesse rejetée reste
// mémoïsée (échec fatal, pas de retry : réparer l'artefact puis redémarrer).
const loadIndex = memoizePromise(readAndParseCompressedIndex);

async function readAndParseCompressedIndex(): Promise<IndexCommune[]> {
  const gzPath = path.join(process.cwd(), "data", "comparateur-index.json.gz");
  const compressed = await fs.readFile(gzPath);
  const communes = communesFromPayload(zlib.gunzipSync(compressed).toString("utf8"));
  buildUuPop(communes);
  return communes;
}
```
Note : `IndexFile` (`:540`) n'est plus utilisé par `loadIndex` ; le laisser s'il sert ailleurs, sinon `tsc` le signalera comme inutilisé (le supprimer alors). Vérifier avec `grep -n "IndexFile" src/lib/comparateur-vie.ts`.

- [ ] **Step 3 : Générer le .gz et vérifier que tsc passe**

Run:
```bash
node scripts/index-pack.mjs   # crée data/comparateur-index.json.gz depuis le JSON encore présent
npx tsc --noEmit
```
Expected: `Index packé : data/comparateur-index.json.gz` puis 0 erreur tsc.

- [ ] **Step 4 : Repointer outputFileTracingIncludes**

In `next.config.ts`, remplacer les **3** occurrences de :
```ts
"./data/comparateur-index.json",
```
par :
```ts
"./data/comparateur-index.json.gz",
```
(lignes 14, 20, 26 environ : routes `/api/comparateur-vie/match`, `/rapport/quartier`, `/api/synthesize-quartier`.)

- [ ] **Step 5 : Vérifier le chargement runtime à l'écran**

Run: `npm run dev`, puis charger un dossier réel (ex. `/ou-vivre` avec une commune, ou `/rapport/quartier` pour Roubaix). Vérifier que la commune se charge et rend comme avant (l'index lu est identique au JSON d'origine, garanti par le round-trip SHA-256).
Expected: page rendue sans erreur `ENOENT`/`gunzip`.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts next.config.ts
git commit -m "feat(index): loadIndex lit le .gz (gunzip memoise, structure validee) + trace serverless"
```

---

### Task 7 : Cutover git — gitignore le JSON, versionner le gz, hook, doc

**Files:**
- Modify: `.gitignore`
- Create: `scripts/install-git-hooks.mjs`
- Modify: `package.json` (ajout `hooks:install`)
- Modify: `docs/handoff/CURRENT.md` (note de prérequis)
- Git: `git rm --cached data/comparateur-index.json`, ajout de `data/comparateur-index.json.gz`

**Interfaces:**
- Consumes : `index:verify` (Task 3)

- [ ] **Step 1 : Gitignorer le JSON de travail**

In `.gitignore`, sous le bloc « Caches bruts régénérables » (`:60`), ajouter :
```
# Copie de travail de l'index (artefact canonique = comparateur-index.json.gz)
data/comparateur-index.json
```

- [ ] **Step 2 : Retirer le JSON du suivi git, versionner le gz**

Run:
```bash
git rm --cached data/comparateur-index.json
git add data/comparateur-index.json.gz .gitignore
git status --short   # doit montrer: D data/comparateur-index.json (cached), A data/comparateur-index.json.gz
```
Expected: le JSON n'est plus suivi (mais reste sur disque comme copie de travail) ; le `.gz` (~10 Mo) est stagé.

- [ ] **Step 3 : Script d'installation du hook pre-commit**

Create `scripts/install-git-hooks.mjs` :
```js
#!/usr/bin/env node
// Installe un hook git pre-commit natif (pas de husky) qui lance index:verify.
// Idempotent : réécrit le hook. Dissuasif seulement (contournable par --no-verify).
import { writeFileSync, chmodSync, mkdirSync } from "node:fs";
import path from "node:path";

const hookDir = path.join(process.cwd(), ".git", "hooks");
const hookPath = path.join(hookDir, "pre-commit");
mkdirSync(hookDir, { recursive: true });
writeFileSync(hookPath, "#!/bin/sh\nnpm run index:verify\n");
chmodSync(hookPath, 0o755);
console.log("Hook pre-commit installé : npm run index:verify");
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

- [ ] **Step 4 : Note de prérequis dans le handoff**

In `docs/handoff/CURRENT.md`, ajouter une ligne dans la section d'avertissement (le passage « GitHub avertit » devient caduc) :
```markdown
**Index gzip :** l'artefact canonique est `data/comparateur-index.json.gz` (~10 Mo). Après un clone frais
ou avant une session d'enrichissement : `npm run index:unpack` (écrit la copie de travail
`comparateur-index.json`, gitignorée). Après un enrichissement : `npm run index:pack`, puis committer le
`.gz`. `npm run hooks:install` pose le hook pre-commit de vérification.
```

- [ ] **Step 5 : Vérifier verify + build**

Run:
```bash
node scripts/index-verify.mjs   # JSON local présent -> régime synchro, doit passer (on vient de packer)
npm run build                   # prebuild = index:verify ; build Next complet
```
Expected: `Index vérifié.` puis build réussi.

- [ ] **Step 6 : Commit du cutover**

```bash
git add .gitignore data/comparateur-index.json.gz scripts/install-git-hooks.mjs package.json docs/handoff/CURRENT.md
git commit -m "feat(index): cutover gzip (77,5 Mo -> ~10 Mo) : gz canonique versionne, JSON gitignore, hook pre-commit"
```

- [ ] **Step 7 : Test d'acceptation déterminisme (aucun diff git au re-pack)**

Run:
```bash
npm run index:pack
git diff --exit-code data/comparateur-index.json.gz
```
Expected: exit 0 (aucun diff : gzip déterministe, pas de re-commit fantôme).

---

### Task 8 : Garde clone frais câblée sur les scripts d'enrichissement ESM actifs (best-effort)

**Files:**
- Modify: `scripts/populate-mismatch-rank.mts` (script vivant du dernier chantier)
- Modify: `scripts/populate-logement.mjs`, `scripts/populate-hlm.mjs`, `scripts/populate-rayonnement-index.mjs`, `scripts/populate-uu-pop.mjs`, `scripts/add-relief-proximite.mjs` (scripts ESM d'enrichissement actifs)

**Interfaces:**
- Consumes : `assertIndexWorktree` (Task 3)

- [ ] **Step 1 : Câbler la garde en tête de chaque script**

Dans chaque fichier listé, juste après les imports et **avant** la première lecture de l'index, ajouter :
```js
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
assertIndexWorktree();
```
(Pour `populate-mismatch-rank.mts`, l'import relatif `./lib/require-index-worktree.mjs` fonctionne sous tsx.) Ne **pas** toucher la logique I/O existante des scripts : c'est une garde d'une ligne, pas une migration. Les scripts `.js` CommonJS et `research/*` restent hors périmètre (ENOENT toléré, documenté au §4.6 de la spec).

- [ ] **Step 2 : Vérifier qu'un script refuse proprement sans copie de travail**

Run (sans supprimer la vraie copie ; test à blanc du message via un chemin bidon si besoin, ou simple lecture du diff) :
```bash
grep -l "assertIndexWorktree" scripts/populate-*.mjs scripts/populate-mismatch-rank.mts
```
Expected: les fichiers modifiés listés.

- [ ] **Step 3 : Vérifier que le pack/enrichissement fonctionne toujours (copie de travail présente)**

Run:
```bash
node scripts/index-unpack.mjs   # s'assurer que la copie de travail existe
npx tsc --noEmit                # aucune régression de types
```
Expected: copie de travail présente, 0 erreur tsc.

- [ ] **Step 4 : Commit**

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
node --test scripts/lib/index-io.test.mjs scripts/lib/require-index-worktree.test.mjs src/lib/memoize-promise.test.ts src/lib/comparateur-index-payload.test.ts
node --test src/lib/*.test.ts src/lib/decision/*.test.ts
```
Expected: tous verts (dont les 505 existants).

- [ ] **Step 2 : Types + sonde métier**

Run:
```bash
npx tsc --noEmit
node --env-file=.env.local scripts/probe-conclusion.ts
```
Expected: 0 erreur tsc ; sonde 20/20 (le dossier lit le même index, le round-trip garantit l'identité).

- [ ] **Step 3 : Taille finale + historique**

Run:
```bash
git cat-file -s HEAD:data/comparateur-index.json.gz | awk '{printf "%.1f Mo\n", $1/1024/1024}'
git count-objects -vH | grep size-pack
```
Expected: `.gz` ~10 Mo (bien sous 50). Noter la taille du pack pour la surveillance du risque deltas git (spec §6).

- [ ] **Step 4 : Vérification à l'écran (dossier réel)**

Charger Roubaix (`arbitration`), Digne-les-Bains (`favorable`), Arbigny (`neutral`) et confirmer que les orientations et la synthèse sont identiques à avant la bascule.
Expected: comportement inchangé.

---

## Notes de séquencement

- Tasks 1 à 5 sont **indépendantes du runtime** (l'app lit encore le JSON clair inchangé) : livrables isolés, aucun risque de casse.
- **Task 6** bascule le runtime sur le `.gz` : elle génère le `.gz` (`index:pack`) **avant** de rebrancher `loadIndex`, donc l'app ne se retrouve jamais sans artefact.
- **Task 7** est le cutover git irréversible en un commit (gitignore + `git rm --cached` + `.gz` versionné) : à faire seulement une fois la Task 6 vérifiée à l'écran.
- **Task 8** est un raffinement best-effort, sans valeur runtime : peut être reportée sans bloquer le reste.

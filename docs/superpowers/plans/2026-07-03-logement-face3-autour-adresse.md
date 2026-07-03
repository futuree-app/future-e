# Face 3 Logement « Autour de cette adresse » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au module Logement une Face 3 « autour de cette adresse » — équipements BPE (local), infrastructures potentiellement bruyantes et espaces verts OSM — calculée au point géocodé, persistée en artefact (logement sauvegardé + snapshot gelé), jamais dépendante d'Overpass à l'affichage.

**Architecture:** Deux libs pures testables portent le calcul (`geo-distance.ts` = distances point↔géométrie ; `geo-grid.ts` = grille spatiale). BPE est servi par des shards de points en grille (build Python) chargés au runtime. OSM est récupéré **une fois à la génération** (Overpass `out geom`), mis en cache par cellule en base (`osm_tile_cache`, service-role), puis figé dans le `snapshot` JSON d'une ligne `logement`. Le rapport ne lit que le snapshot.

**Tech Stack:** TypeScript (libs server-only + route handler Next 16.2.4), Python (pyarrow) pour les shards BPE, Supabase (2 migrations SQL + RLS), Overpass API (mirrors), `after()` de `next/server` pour le remplissage post-réponse, `node --test` pour les libs pures, PostHog pour la complétude.

## Global Constraints

- **Grain adresse only.** Aucune recopie d'agrégat communal (`vie_locale`, `nature`, `calme_sonore`, `acces_*`). La Face 3 bufferise au point ou n'existe pas.
- **Distances point↔GÉOMÉTRIE pour OSM** (segments pour lignes, contour/inclusion pour polygones), **jamais** point↔sommet. Haversine simple réservée aux points BPE.
- **Aucun score composite ni note** (ADR-0001) : liste + distances brutes à vol d'oiseau.
- **Pas d'adjectif de proximité générique en v1** (pas de « proche = 500 m »), pas de temps de marche, pas de dB.
- **Wording verbatim** : bruit absent → « Aucun axe autoroutier ou ferroviaire cartographié dans l'emprise analysée de 1,5 km. » ; verts absents → « Aucun espace vert correspondant aux catégories recherchées dans l'emprise cartographiée. » ; BPE cap dépassé → « Aucun équipement de cette catégorie recensé dans les N km analysés. » Jamais « aucun risque de bruit », jamais « pas d'espace vert à proximité ».
- **Une seule source de vérité** : le `snapshot` JSON porte résultats + `sourceStatus` + versions + `computedAt`. Pas de colonnes SQL dupliquant ces champs.
- **Panne observable, jamais muette** : `sourceStatus` par source ∈ {complete, pending, failed}. Une panne ≠ une absence de donnée.
- **Overpass jamais à l'affichage.** Live seulement à la génération ; le rapport lit le snapshot figé.
- **PostHog sans donnée localisante fine** : jamais le `tile_key` brut, maille grossière (insee/dept).
- **Harmonisation visuelle** : nouveau bloc via le kit (`ReportSection` + `GlassCard`), prose 15-16px, verre arrondi (cf. `docs/vault/recherches/inventaire-design.md`).
- **Migrations SQL** appliquées comme `15`/`16` (contre la base Supabase du projet) ; RLS own-row calquée sur `supabase/16_report_context.sql`.

---

## File Structure

**Créés :**
- `src/lib/geo-distance.ts` — maths pures : haversine point↔point, point↔segment, point↔polyligne, point-dans-polygone, point↔polygone (mètres, projection équirectangulaire locale).
- `src/lib/geo-grid.ts` — grille spatiale : clé de cellule depuis lat/lon, 8 voisines, bbox d'une cellule.
- `src/lib/logement-autour-types.ts` — `Face3Snapshot`, `Face3Category`, `Posture`, types géométrie OSM.
- `src/lib/logement-bpe.ts` — chargement des shards BPE en grille + plus proche par catégorie (compute pur injectable + loader disque).
- `src/lib/logement-osm.ts` — requête Overpass `out geom`, parse géométries, cache de cellule (service-role), calcul de proximité OSM + formulations.
- `src/lib/logement-store.ts` — upsert/get `logement`, règle d'invalidation du snapshot.
- `src/lib/logement-autour.ts` — assemblage du `Face3Snapshot` (BPE + OSM + `sourceStatus`).
- `scripts/populate-bpe.py` (MODIFY) — mode `--face3-shards` émettant `data/bpe-points/<cell>.json`.
- `supabase/17_logement.sql`, `supabase/18_osm_tile_cache.sql`.
- `src/app/api/logement-autour/route.ts` — endpoint de génération (persistance + `after()`).
- `src/components/report/LogementModule.tsx` (MODIFY) — bloc Face 3, persistance posture, états `pending` / Découverte.

**Tests :** `src/lib/*.test.ts` exécutés par `node --test` (le repo teste déjà des libs pures ainsi, cf. `src/lib/onrn-sinistralite.ts`).

---

### Task 0: Convention d'import (`.ts` explicite + flag tsconfig)

**Contexte (vérifié) :** les tests `node --test` du repo importent avec extension (`./onrn-sinistralite.ts`) car Node exécute le TS nativement et exige l'extension. `tsconfig.json` a `noEmit: true`, `moduleResolution: "bundler"`, et **exclut `**/*.test.ts` de tsc**. Les nouvelles libs Face 3 ont des imports siblings ET sont testées : pour que **tsc** (libs), **node --test** (tests) et **turbopack** (build) soient tous d'accord, on utilise `.ts` explicite partout dans les nouveaux fichiers, ce qui exige d'autoriser l'extension côté tsc.

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Autoriser les imports `.ts`**

Ajouter à `compilerOptions` (sûr car `noEmit: true`, rétrocompatible avec les imports extensionless existants) :
```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 2: Vérifier**

Run: `npx tsc --noEmit`
Expected: exit 0 (aucune régression sur le code existant).

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore(ts): autorise les imports .ts explicites (libs Face 3 + node --test)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Convention pour toute la suite du plan :** dans les nouveaux fichiers, importer les siblings **avec** l'extension `.ts` (ex. `import { haversineM } from "./geo-distance.ts"`). Les imports `@/lib/...` (alias, code applicatif comme la route/l'UI) restent **sans** extension, comme le reste du repo.

---

### Task 1: `geo-distance.ts` — distances point↔géométrie (le cœur correct)

**Files:**
- Create: `src/lib/geo-distance.ts`
- Test: `src/lib/geo-distance.test.ts`

**Interfaces:**
- Produces :
  - `type LngLat = { lat: number; lon: number }`
  - `haversineM(a: LngLat, b: LngLat): number`
  - `distancePointToPolylineM(p: LngLat, line: LngLat[]): number`
  - `distancePointToPolygonM(p: LngLat, ring: LngLat[]): number` — 0 si `p` est dans l'anneau, sinon distance au contour.

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { haversineM, distancePointToPolylineM, distancePointToPolygonM } from "./geo-distance.ts";

test("haversine ~ known distance", () => {
  // ~111 m pour 0.001° de latitude
  const d = haversineM({ lat: 48.85, lon: 2.35 }, { lat: 48.851, lon: 2.35 });
  assert.ok(Math.abs(d - 111) < 3, `attendu ~111 m, obtenu ${d}`);
});

test("polyline: distance au SEGMENT, pas au sommet", () => {
  // Ligne E-O passant à lat 48.850 ; sommets loin (lon 2.30 et 2.40),
  // point juste au sud du milieu (lon 2.35) : ~50 m du segment, ~400 m des sommets.
  const line = [ { lat: 48.850, lon: 2.30 }, { lat: 48.850, lon: 2.40 } ];
  const p = { lat: 48.8495, lon: 2.35 }; // ~55 m au sud
  const d = distancePointToPolylineM(p, line);
  assert.ok(d < 70, `attendu ~55 m (segment), obtenu ${d}`);
});

test("polygone: 0 à l'intérieur, contour à l'extérieur", () => {
  const ring = [ { lat: 48.849, lon: 2.349 }, { lat: 48.851, lon: 2.349 }, { lat: 48.851, lon: 2.351 }, { lat: 48.849, lon: 2.351 } ];
  assert.equal(distancePointToPolygonM({ lat: 48.850, lon: 2.350 }, ring), 0);
  assert.ok(distancePointToPolygonM({ lat: 48.850, lon: 2.360 }, ring) > 500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/geo-distance.test.ts`
Expected: FAIL (module/exports introuvables).

- [ ] **Step 3: Write minimal implementation**

```ts
import "server-only";

export type LngLat = { lat: number; lon: number };

const R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: LngLat, b: LngLat): number {
  const dphi = toRad(b.lat - a.lat);
  const dlmb = toRad(b.lon - a.lon);
  const s =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dlmb / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Projection équirectangulaire locale autour de `origin` -> mètres (exacte à ~qq km).
function toXY(origin: LngLat, p: LngLat): { x: number; y: number } {
  const x = toRad(p.lon - origin.lon) * Math.cos(toRad(origin.lat)) * R;
  const y = toRad(p.lat - origin.lat) * R;
  return { x, y };
}

function segDistM(origin: LngLat, a: LngLat, b: LngLat): number {
  const P = { x: 0, y: 0 }; // origin projeté sur lui-même
  const A = toXY(origin, a);
  const B = toXY(origin, b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx;
  const cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

export function distancePointToPolylineM(p: LngLat, line: LngLat[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversineM(p, line[0]);
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    min = Math.min(min, segDistM(p, line[i], line[i + 1]));
  }
  return min;
}

function pointInRing(p: LngLat, ring: LngLat[]): boolean {
  // Ray casting sur coordonnées projetées autour de p (p = origine -> (0,0)).
  const pts = ring.map((v) => toXY(p, v));
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i].y, xi = pts[i].x, yj = pts[j].y, xj = pts[j].x;
    const intersect =
      yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function distancePointToPolygonM(p: LngLat, ring: LngLat[]): number {
  if (ring.length < 3) return distancePointToPolylineM(p, ring);
  if (pointInRing(p, ring)) return 0;
  const closed = ring[0] === ring[ring.length - 1] ? ring : [...ring, ring[0]];
  return distancePointToPolylineM(p, closed);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/geo-distance.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo-distance.ts src/lib/geo-distance.test.ts
git commit -m "feat(logement): distances point↔géométrie (segments, polygones) pour Face 3

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `geo-grid.ts` — grille spatiale (clé de cellule + voisines)

**Files:**
- Create: `src/lib/geo-grid.ts`
- Test: `src/lib/geo-grid.test.ts`

**Interfaces:**
- Produces :
  - `cellKey(lat: number, lon: number, cellDeg?: number): string` — ex. `"g_552_1305"` (indices entiers de cellule).
  - `neighborKeys(lat: number, lon: number, cellDeg?: number): string[]` — la cellule + ses 8 voisines (9 clés).
  - `cellBBox(key: string, cellDeg?: number): { s: number; w: number; n: number; e: number }`.
  - `GRID_CELL_DEG = 0.18` (défaut, aligné sur `populate-bpe.py` `CELL`), `OSM_CELL_DEG` réglé en Task 7.

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { cellKey, neighborKeys, cellBBox, GRID_CELL_DEG } from "./geo-grid.ts";

test("cellKey stable et déterministe", () => {
  const k = cellKey(48.85, 2.35);
  assert.equal(k, cellKey(48.851, 2.351)); // même cellule (0.18°)
  assert.match(k, /^g_-?\d+_-?\d+$/);
});

test("neighborKeys = 9 clés dont la cellule centrale", () => {
  const ns = neighborKeys(48.85, 2.35);
  assert.equal(ns.length, 9);
  assert.ok(ns.includes(cellKey(48.85, 2.35)));
});

test("cellBBox contient le point de la cellule", () => {
  const b = cellBBox(cellKey(48.85, 2.35));
  assert.ok(b.s <= 48.85 && 48.85 < b.n && b.w <= 2.35 && 2.35 < b.e);
  assert.ok(Math.abs(b.n - b.s - GRID_CELL_DEG) < 1e-9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/geo-grid.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
import "server-only";

export const GRID_CELL_DEG = 0.18; // aligné sur populate-bpe.py CELL (BPE points)

const idx = (v: number, cell: number) => Math.floor(v / cell);

export function cellKey(lat: number, lon: number, cellDeg: number = GRID_CELL_DEG): string {
  return `g_${idx(lat, cellDeg)}_${idx(lon, cellDeg)}`;
}

export function neighborKeys(lat: number, lon: number, cellDeg: number = GRID_CELL_DEG): string[] {
  const i = idx(lat, cellDeg);
  const j = idx(lon, cellDeg);
  const out: string[] = [];
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++) out.push(`g_${i + di}_${j + dj}`);
  return out;
}

export function cellBBox(key: string, cellDeg: number = GRID_CELL_DEG): { s: number; w: number; n: number; e: number } {
  const m = key.match(/^g_(-?\d+)_(-?\d+)$/);
  if (!m) throw new Error(`clé de cellule invalide: ${key}`);
  const i = parseInt(m[1], 10);
  const j = parseInt(m[2], 10);
  return { s: i * cellDeg, w: j * cellDeg, n: (i + 1) * cellDeg, e: (j + 1) * cellDeg };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/geo-grid.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo-grid.ts src/lib/geo-grid.test.ts
git commit -m "feat(logement): grille spatiale (cellules + voisines) pour Face 3

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Shards BPE en grille (`populate-bpe.py`)

**Files:**
- Modify: `scripts/populate-bpe.py`
- Create (généré) : `data/bpe-points/<cell>.json`

**Interfaces:**
- Produces sur disque : pour chaque cellule non vide, `data/bpe-points/g_<i>_<j>.json` =
  `{ "cell": "g_i_j", "points": [ { "c": "sante"|"alimentation"|"education"|"transports"|"services", "lat": number, "lon": number } ] }`.
  Cellule = `floor(lat/0.18)`, `floor(lon/0.18)` (identique à `geo-grid.ts`).

- [ ] **Step 1: Confirmer empiriquement les codes TYPEQU Face 3**

Le module lit **la vie quotidienne à la porte**, catégories décisionnelles regroupées (pas un annuaire). Codes **candidats** (familles BPE24 A=services, B=commerces, C=enseignement, D=santé, E=transport) à confirmer sur `NOMRS` comme l'a fait la Task 1 historique du script :

```bash
python - <<'PY'
import pyarrow.parquet as pq, collections
t = pq.read_table("data/bpe24.parquet", columns=["TYPEQU","NOMRS"])
c = collections.Counter(zip(t.column("TYPEQU").to_pylist(), t.column("NOMRS").to_pylist()))
for (code, lib), n in sorted(c.items()):
    if code[:1] in "ABCDE": print(code, lib, n)
PY
```

Figer le mapping (ajuster selon la sortie) :
```python
FACE3_CATS = {
  "sante":        {"D201", "D307"},                 # médecin généraliste, pharmacie
  "alimentation": {"B101", "B102", "B201", "B203"}, # supermarché, supérette, épicerie, boulangerie
  "education":    {"C101", "C104"},                 # maternelle, élémentaire (proximité)
  "transports":   {"E107", "E108"},                 # gare / halte voyageurs
  "services":     {"A203", "A206"},                 # banque/caisse, bureau de poste
}
```

- [ ] **Step 2: Ajouter le mode `--face3-shards`**

Dans `scripts/populate-bpe.py`, ajouter (réutilise `pq`, `np`, `COL_TYPE/LAT/LON` déjà présents) :

```python
import math

FACE3_CELL = 0.18  # DOIT égaler GRID_CELL_DEG de src/lib/geo-grid.ts
FACE3_DIR = os.path.join(ROOT, "data", "bpe-points")

def write_face3_shards():
    """Émet un fichier JSON de points BPE par cellule de grille, pour la Face 3
    (plus proche par catégorie au point géocodé, calcul runtime en TS)."""
    all_types = list({c for s in FACE3_CATS.values() for c in s})
    t = pq.read_table(PARQUET, columns=[COL_TYPE, COL_LAT, COL_LON])
    types = np.array(t.column(COL_TYPE).to_pylist(), dtype=object)
    lats = np.array(t.column(COL_LAT).to_pylist(), dtype="float64")
    lons = np.array(t.column(COL_LON).to_pylist(), dtype="float64")
    keep = np.isin(types, all_types) & np.isfinite(lats) & np.isfinite(lons)
    types, lats, lons = types[keep], lats[keep], lons[keep]
    code_to_cat = {code: cat for cat, codes in FACE3_CATS.items() for code in codes}
    cells = {}
    for ty, la, lo in zip(types, lats, lons):
        cat = code_to_cat[ty]
        key = f"g_{math.floor(la / FACE3_CELL)}_{math.floor(lo / FACE3_CELL)}"
        cells.setdefault(key, []).append({"c": cat, "lat": round(float(la), 6), "lon": round(float(lo), 6)})
    os.makedirs(FACE3_DIR, exist_ok=True)
    for key, pts in cells.items():
        with open(os.path.join(FACE3_DIR, f"{key}.json"), "w") as f:
            json.dump({"cell": key, "points": pts}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Face 3 : {len(cells)} cellules, {int(keep.sum())} équipements -> {FACE3_DIR}")
```

Et dans le `argparse`/`main`, brancher `--face3-shards` pour appeler `write_face3_shards()` puis sortir.

- [ ] **Step 3: Générer et vérifier**

Run:
```bash
python scripts/populate-bpe.py --face3-shards
ls data/bpe-points | head
python - <<'PY'
import json, glob
f = sorted(glob.glob("data/bpe-points/*.json"))[0]
d = json.load(open(f)); print(f, len(d["points"]), d["points"][0])
PY
```
Expected: N fichiers `g_*.json`, chacun avec des points `{c,lat,lon}`.

- [ ] **Step 4: Ignorer les gros artefacts si besoin & committer le script**

Vérifier la taille totale (`du -sh data/bpe-points`). Si volumineux, décider avec le porteur du versionnement (commit vs génération au build). Par défaut on **commite** les shards (comme les autres `data/*.json` du repo).

```bash
git add scripts/populate-bpe.py data/bpe-points
git commit -m "data(logement): shards BPE en grille pour Face 3 (points par cellule)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `logement-bpe.ts` — plus proche par catégorie (grille + cap)

**Files:**
- Create: `src/lib/logement-autour-types.ts`
- Create: `src/lib/logement-bpe.ts`
- Test: `src/lib/logement-bpe.test.ts`

**Interfaces:**
- Produces (`logement-autour-types.ts`) :
  - `type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services"`
  - `type BpePoint = { c: Face3Cat; lat: number; lon: number }`
  - `type BpeNearest = { category: Face3Cat; nearest: { distanceMeters: number } | null; searchCapMeters: number }`
  - `type Posture = "residence" | "prospection"`
- Produces (`logement-bpe.ts`) :
  - `nearestByCategory(center: LngLat, points: BpePoint[], capM?: number): BpeNearest[]` (pur, injecté).
  - `loadBpePointsAround(center: LngLat): Promise<BpePoint[]>` (charge cellule + 8 voisines depuis `data/bpe-points`).

- [ ] **Step 1: Write the failing test (compute pur)**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { nearestByCategory } from "./logement-bpe.ts";
import type { BpePoint } from "./logement-autour-types.ts";

const C = { lat: 48.850, lon: 2.350 };

test("plus proche par catégorie + cap dépassé -> null", () => {
  const pts: BpePoint[] = [
    { c: "sante", lat: 48.8505, lon: 2.350 },   // ~55 m
    { c: "sante", lat: 48.900, lon: 2.350 },    // ~5,5 km
    { c: "education", lat: 49.10, lon: 2.35 },  // ~28 km (au-delà du cap)
  ];
  const res = nearestByCategory(C, pts, 3000);
  const sante = res.find((r) => r.category === "sante")!;
  const edu = res.find((r) => r.category === "education")!;
  assert.ok(sante.nearest && sante.nearest.distanceMeters < 80);
  assert.equal(edu.nearest, null); // rien sous 3 km
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-bpe.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write types + implementation**

`src/lib/logement-autour-types.ts` (foyer canonique de TOUS les types partagés Face 3, pour éviter les imports en avant entre libs) :
```ts
import type { LngLat } from "./geo-distance.ts";

export type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services";
export type Posture = "residence" | "prospection";
export type BpePoint = { c: Face3Cat; lat: number; lon: number };
export type BpeNearest = { category: Face3Cat; nearest: { distanceMeters: number } | null; searchCapMeters: number };

export type OsmProximity = {
  potentiallyNoisyInfrastructure: { type: "motorway" | "trunk" | "railway"; distanceMeters: number }[];
  nearestMappedGreenSpace: { distanceMeters: number } | null;
  bboxRadiusMeters: number;
};

export type Face3Snapshot = {
  center: LngLat;
  bpe: { categories: BpeNearest[] };
  osm: OsmProximity;
  sourceStatus: {
    bpe: "complete" | "failed";
    osmInfrastructure: "complete" | "pending" | "failed";
    osmGreenSpaces: "complete" | "pending" | "failed";
  };
  sources: { bpeVersion: string; osmFetchedAt: string | null; osmQueryVersion: string };
  sourcesVersion: string;
  computedAt: string;
};

export const FACE3_CATS: Face3Cat[] = ["sante", "alimentation", "education", "transports", "services"];
export const BPE_CAP_M = 3000; // cap de recherche v1 (commun). Affinable par famille plus tard.
```

`src/lib/logement-bpe.ts` :
```ts
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { haversineM, type LngLat } from "./geo-distance.ts";
import { neighborKeys } from "./geo-grid.ts";
import { FACE3_CATS, BPE_CAP_M, type BpePoint, type BpeNearest, type Face3Cat } from "./logement-autour-types.ts";

const DIR = path.join(process.cwd(), "data", "bpe-points");

export function nearestByCategory(center: LngLat, points: BpePoint[], capM: number = BPE_CAP_M): BpeNearest[] {
  const best = new Map<Face3Cat, number>();
  for (const p of points) {
    const d = haversineM(center, { lat: p.lat, lon: p.lon });
    if (d > capM) continue;
    const cur = best.get(p.c);
    if (cur === undefined || d < cur) best.set(p.c, d);
  }
  return FACE3_CATS.map((category) => {
    const d = best.get(category);
    return { category, nearest: d === undefined ? null : { distanceMeters: Math.round(d) }, searchCapMeters: capM };
  });
}

export async function loadBpePointsAround(center: LngLat): Promise<BpePoint[]> {
  const keys = neighborKeys(center.lat, center.lon);
  const chunks = await Promise.all(
    keys.map(async (k) => {
      try {
        const raw = await fs.readFile(path.join(DIR, `${k}.json`), "utf8");
        return (JSON.parse(raw) as { points: BpePoint[] }).points;
      } catch {
        return []; // cellule vide/absente = pas d'équipement (honnête)
      }
    }),
  );
  return chunks.flat();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/logement-bpe.test.ts`
Expected: PASS.

- [ ] **Step 5: Ajouter le tracing serverless des shards**

Dans `next.config.*`, ajouter `data/bpe-points/**` à `outputFileTracingIncludes` pour la route `/api/logement-autour` (même patron que la Face 2 ONRN). Vérifier le nom de clé existant dans le fichier avant d'éditer.

- [ ] **Step 6: Commit**

```bash
git add src/lib/logement-autour-types.ts src/lib/logement-bpe.ts src/lib/logement-bpe.test.ts next.config.*
git commit -m "feat(logement): plus proche BPE par catégorie (grille + cap) pour Face 3

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Migrations `logement` + `osm_tile_cache`

**Files:**
- Create: `supabase/17_logement.sql`
- Create: `supabase/18_osm_tile_cache.sql`

**Interfaces:**
- Produces : tables `public.logement (user_id, insee, address_label, latitude, longitude, parcel_code, posture, snapshot jsonb, updated_at)` et `public.osm_tile_cache (tile_key, geometries jsonb, query_version, status, fetched_at)`.

- [ ] **Step 1: Écrire `17_logement.sql`**

```sql
begin;

create table if not exists public.logement (
  user_id       uuid not null references auth.users (id) on delete cascade,
  insee         text not null,
  address_label text not null,
  latitude      double precision not null,
  longitude     double precision not null,
  parcel_code   text,
  posture       text not null default 'residence'
    check (posture in ('residence', 'prospection')),
  snapshot      jsonb,   -- photographie Face 3 gelée : résultats + sourceStatus + versions + computedAt (SOURCE CANONIQUE)
  updated_at    timestamptz not null default now(),
  primary key (user_id, insee)
);

create index if not exists logement_user_id_idx on public.logement (user_id);

alter table public.logement enable row level security;

drop policy if exists logement_select_own on public.logement;
create policy logement_select_own on public.logement for select using (auth.uid() = user_id);
drop policy if exists logement_insert_own on public.logement;
create policy logement_insert_own on public.logement for insert with check (auth.uid() = user_id);
drop policy if exists logement_update_own on public.logement;
create policy logement_update_own on public.logement for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
```

- [ ] **Step 2: Écrire `18_osm_tile_cache.sql`**

```sql
begin;

create table if not exists public.osm_tile_cache (
  tile_key      text primary key,
  geometries    jsonb not null,
  query_version text not null,
  status        text not null check (status in ('complete', 'failed')),
  fetched_at    timestamptz not null default now()
);

alter table public.osm_tile_cache enable row level security;

-- Cache partagé : lecture par tout authentifié, écriture réservée au service-role
-- (la route de génération écrit via SUPABASE_SERVICE_ROLE_KEY, qui bypasse RLS).
drop policy if exists osm_tile_cache_select_auth on public.osm_tile_cache;
create policy osm_tile_cache_select_auth on public.osm_tile_cache for select using (auth.role() = 'authenticated');

commit;
```

- [ ] **Step 3: Appliquer les migrations**

Appliquer `17` puis `18` contre la base Supabase du projet (même procédure que `15`/`16` : dashboard SQL editor ou `psql "$DATABASE_URL" -f`). Vérifier :
```sql
select count(*) from public.logement;        -- 0
select count(*) from public.osm_tile_cache;   -- 0
```

- [ ] **Step 4: Commit**

```bash
git add supabase/17_logement.sql supabase/18_osm_tile_cache.sql
git commit -m "db(logement): tables logement (artefact + snapshot) et osm_tile_cache

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `logement-store.ts` — persistance + invalidation

**Files:**
- Create: `src/lib/logement-store.ts`
- Test: `src/lib/logement-store.test.ts`

**Interfaces:**
- Consumes : `Face3Snapshot`, `Posture` (Task 4, types), client Supabase (injecté).
- Produces :
  - `type LogementRow = { user_id: string; insee: string; address_label: string; latitude: number; longitude: number; parcel_code: string | null; posture: Posture; snapshot: Face3Snapshot | null; updated_at: string }`
  - `needsRecompute(row: Pick<LogementRow,"snapshot"> | null, center: LngLat, sourcesVersion: string): boolean` (pur).
  - `SOURCES_VERSION: string` — version courante des calculs Face 3 (bump = invalidation).

- [ ] **Step 1: Write the failing test (règle pure)**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { needsRecompute, SOURCES_VERSION } from "./logement-store.ts";

const center = { lat: 48.85, lon: 2.35 };
const okSnap = { center, sources: { bpeVersion: "x", osmQueryVersion: "y", osmFetchedAt: null }, sourcesVersion: SOURCES_VERSION } as never;

test("pas de snapshot -> recompute", () => {
  assert.equal(needsRecompute(null, center, SOURCES_VERSION), true);
});
test("snapshot d'une autre position -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, { lat: 43.6, lon: 1.44 }, SOURCES_VERSION), true);
});
test("version antérieure -> recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, "v999"), true);
});
test("même position + même version -> pas de recompute", () => {
  assert.equal(needsRecompute({ snapshot: okSnap }, center, SOURCES_VERSION), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LngLat } from "./geo-distance.ts";
import { haversineM } from "./geo-distance.ts";
import type { Posture, Face3Snapshot } from "./logement-autour-types.ts";

export const SOURCES_VERSION = "face3-2026-07-03"; // bump = invalidation de tous les snapshots

export type LogementRow = {
  user_id: string; insee: string; address_label: string;
  latitude: number; longitude: number; parcel_code: string | null;
  posture: Posture; snapshot: Face3Snapshot | null; updated_at: string;
};

export function needsRecompute(
  row: { snapshot: Face3Snapshot | null } | null,
  center: LngLat,
  sourcesVersion: string,
): boolean {
  const s = row?.snapshot;
  if (!s) return true;
  if (s.sourcesVersion !== sourcesVersion) return true;
  // même position à ~10 m près (le géocodage a pu bouger)
  return haversineM(center, s.center) > 10;
}

export async function getLogement(sb: SupabaseClient, userId: string, insee: string): Promise<LogementRow | null> {
  const { data } = await sb.from("logement").select("*").eq("user_id", userId).eq("insee", insee).maybeSingle();
  return (data as LogementRow) ?? null;
}

export async function upsertLogement(
  sb: SupabaseClient,
  row: Omit<LogementRow, "updated_at">,
): Promise<void> {
  await sb.from("logement").upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id,insee" });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/logement-store.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/logement-store.ts src/lib/logement-store.test.ts
git commit -m "feat(logement): store logement + règle d'invalidation du snapshot

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: `logement-osm.ts` — Overpass + cache de cellule + proximité

**Files:**
- Create: `src/lib/logement-osm.ts`
- Test: `src/lib/logement-osm.test.ts`

**Interfaces:**
- Consumes : `distancePointToPolylineM`, `distancePointToPolygonM`, `haversineM`, `LngLat` (Task 1) ; `cellKey`, `cellBBox` (Task 2) ; `OsmProximity` (Task 4, types) ; client service-role (injecté).
- Produces :
  - `type OsmGeom = { kind: "line" | "polygon" | "node"; role: "noisy" | "green"; subtype: "motorway" | "trunk" | "railway" | "green"; pts: LngLat[] }` (local)
  - `computeOsmProximity(center: LngLat, geoms: OsmGeom[], bboxRadiusM: number): OsmProximity` (pur).
  - `OSM_QUERY_VERSION`, `OSM_BBOX_RADIUS_M`, `OSM_CELL_DEG`.
  - `parseOverpass(elements: unknown[]): OsmGeom[]`, `fetchOverpass(bbox): Promise<unknown[]>`, `getTileGeoms(sb, center): Promise<{ geoms, status }>`.

- [ ] **Step 1: Write the failing test (parse + proximité, purs)**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, computeOsmProximity } from "./logement-osm.ts";

test("parse way géométrique en polyligne rôle bruit", () => {
  const els = [{ type: "way", tags: { highway: "motorway" }, geometry: [ { lat: 48.85, lon: 2.30 }, { lat: 48.85, lon: 2.40 } ] }];
  const g = parseOverpass(els);
  assert.equal(g[0].role, "noisy");
  assert.equal(g[0].kind, "line");
  assert.equal(g[0].subtype, "motorway");
});

test("proximité: distance au SEGMENT de la voie ferrée", () => {
  const geoms = parseOverpass([{ type: "way", tags: { railway: "rail" }, geometry: [ { lat: 48.850, lon: 2.30 }, { lat: 48.850, lon: 2.40 } ] }]);
  const prox = computeOsmProximity({ lat: 48.8495, lon: 2.35 }, geoms, 1500);
  const rail = prox.potentiallyNoisyInfrastructure.find((x) => x.type === "railway")!;
  assert.ok(rail.distanceMeters < 70, `attendu ~55 m, obtenu ${rail.distanceMeters}`);
});

test("verts absents dans l'emprise -> null", () => {
  const prox = computeOsmProximity({ lat: 48.85, lon: 2.35 }, [], 1500);
  assert.equal(prox.nearestMappedGreenSpace, null);
  assert.equal(prox.potentiallyNoisyInfrastructure.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-osm.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```ts
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, distancePointToPolylineM, distancePointToPolygonM, type LngLat } from "./geo-distance.ts";
import { cellKey, cellBBox } from "./geo-grid.ts";
import type { OsmProximity } from "./logement-autour-types.ts";

export const OSM_QUERY_VERSION = "osm-v1-2026-07-03";
export const OSM_BBOX_RADIUS_M = 1500;
export const OSM_CELL_DEG = 0.005; // ~500 m ; valider en Step 6 (Paris/Lyon, ville moyenne, rural boisé)

const MIRRORS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// OsmGeom reste local (seul logement-osm.ts le manipule) ; OsmProximity vient des types partagés.
export type OsmGeom = {
  kind: "line" | "polygon" | "node";
  role: "noisy" | "green";
  subtype: "motorway" | "trunk" | "railway" | "green";
  pts: LngLat[];
};

function overpassQuery(s: number, w: number, n: number, e: number): string {
  const bb = `(${s},${w},${n},${e})`;
  return (
    "[out:json][timeout:60];(" +
    `way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]${bb};` +
    `way["railway"="rail"]${bb};` +
    `way["leisure"="park"]${bb};` +
    `way["landuse"~"^(forest|grass|recreation_ground)$"]${bb};` +
    `way["natural"="wood"]${bb};` +
    ");out geom;"
  );
}

export function parseOverpass(elements: unknown[]): OsmGeom[] {
  const out: OsmGeom[] = [];
  for (const el of elements as Array<{ type: string; tags?: Record<string, string>; geometry?: LngLat[] }>) {
    if (el.type !== "way" || !el.geometry || el.geometry.length === 0) continue;
    const t = el.tags ?? {};
    const pts = el.geometry.map((p) => ({ lat: p.lat, lon: p.lon }));
    const closed = pts.length > 2 && pts[0].lat === pts[pts.length - 1].lat && pts[0].lon === pts[pts.length - 1].lon;
    if (/^(motorway|trunk)/.test(t.highway ?? "")) {
      out.push({ kind: "line", role: "noisy", subtype: t.highway.startsWith("motorway") ? "motorway" : "trunk", pts });
    } else if (t.railway === "rail") {
      out.push({ kind: "line", role: "noisy", subtype: "railway", pts });
    } else if (t.leisure === "park" || t.natural === "wood" || ["forest", "grass", "recreation_ground"].includes(t.landuse ?? "")) {
      out.push({ kind: closed ? "polygon" : "line", role: "green", subtype: "green", pts });
    }
  }
  return out;
}

export function computeOsmProximity(center: LngLat, geoms: OsmGeom[], bboxRadiusM: number): OsmProximity {
  const distTo = (g: OsmGeom): number =>
    g.kind === "polygon" ? distancePointToPolygonM(center, g.pts)
    : g.kind === "line" ? distancePointToPolylineM(center, g.pts)
    : haversineM(center, g.pts[0]);
  // Bruit : le plus proche par sous-type, dans l'emprise.
  const noisy = new Map<"motorway" | "trunk" | "railway", number>();
  let green: number | null = null;
  for (const g of geoms) {
    const d = distTo(g);
    if (d > bboxRadiusM) continue;
    if (g.role === "noisy") {
      const st = g.subtype as "motorway" | "trunk" | "railway";
      const cur = noisy.get(st);
      if (cur === undefined || d < cur) noisy.set(st, d);
    } else if (green === null || d < green) green = d;
  }
  return {
    potentiallyNoisyInfrastructure: [...noisy.entries()].map(([type, d]) => ({ type, distanceMeters: Math.round(d) })).sort((a, b) => a.distanceMeters - b.distanceMeters),
    nearestMappedGreenSpace: green === null ? null : { distanceMeters: Math.round(green) },
    bboxRadiusMeters: bboxRadiusM,
  };
}

export async function fetchOverpass(bbox: { s: number; w: number; n: number; e: number }): Promise<unknown[]> {
  const body = new URLSearchParams({ data: overpassQuery(bbox.s, bbox.w, bbox.n, bbox.e) });
  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, { method: "POST", body, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) continue;
      const doc = (await r.json()) as { elements?: unknown[] };
      if (Array.isArray(doc.elements)) return doc.elements;
    } catch { /* miroir suivant */ }
  }
  throw new Error("Overpass indisponible");
}

// Cache de cellule : emprise = cellule + marge (>= OSM_BBOX_RADIUS_M autour de tout point).
export async function getTileGeoms(sb: SupabaseClient, center: LngLat): Promise<{ geoms: OsmGeom[]; status: "complete" | "failed" }> {
  const key = cellKey(center.lat, center.lon, OSM_CELL_DEG);
  const { data } = await sb.from("osm_tile_cache").select("geometries,status,query_version").eq("tile_key", key).maybeSingle();
  if (data && data.query_version === OSM_QUERY_VERSION && data.status === "complete") {
    return { geoms: data.geometries as OsmGeom[], status: "complete" };
  }
  const cell = cellBBox(key, OSM_CELL_DEG);
  const marginDeg = OSM_BBOX_RADIUS_M / 111_000;
  const bbox = { s: cell.s - marginDeg, w: cell.w - marginDeg, n: cell.n + marginDeg, e: cell.e + marginDeg };
  try {
    const geoms = parseOverpass(await fetchOverpass(bbox));
    await sb.from("osm_tile_cache").upsert({ tile_key: key, geometries: geoms, query_version: OSM_QUERY_VERSION, status: "complete", fetched_at: new Date().toISOString() });
    return { geoms, status: "complete" };
  } catch {
    return { geoms: [], status: "failed" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/logement-osm.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/logement-osm.ts src/lib/logement-osm.test.ts
git commit -m "feat(logement): OSM au point (Overpass out geom, cache de cellule, proximité)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 6: Valider `OSM_CELL_DEG`/marge (note d'exécution)**

Après la Task 8 (route dispo), mesurer sur 3 contextes (Paris/Lyon, ville moyenne, rural boisé) le poids `geometries` en base et la latence de `fetchOverpass`. Ajuster `OSM_CELL_DEG` si le JSON est trop lourd ou timeouts fréquents. Consigner la valeur retenue en commentaire.

---

### Task 8: Assemblage snapshot + route `/api/logement-autour`

**Files:**
- Create: `src/lib/logement-autour.ts`
- Create: `src/app/api/logement-autour/route.ts`
- Test: `src/lib/logement-autour.test.ts`

**Interfaces:**
- Consumes : `Face3Snapshot`, `BpeNearest`, `OsmProximity` (Task 4, types) ; `SOURCES_VERSION` (Task 6) ; `OSM_QUERY_VERSION`, `OSM_BBOX_RADIUS_M` (Task 7).
- Produces (`logement-autour.ts`) :
  - `assembleSnapshot(center: LngLat, bpe: BpeNearest[], osm: OsmProximity | null, osmStatus: "complete"|"pending"|"failed"): Face3Snapshot` (pur ; `Face3Snapshot` défini en Task 4 et ré-exporté ici).
- Produces (route) : `POST /api/logement-autour { insee, latitude, longitude, address_label, parcel_code?, posture }` → `{ snapshot }`.

- [ ] **Step 1: Write the failing test (assemblage pur)**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { assembleSnapshot } from "./logement-autour.ts";

const center = { lat: 48.85, lon: 2.35 };
const bpe = [{ category: "sante" as const, nearest: { distanceMeters: 420 }, searchCapMeters: 3000 }];

test("osm pending -> statuts osm pending, bpe complete", () => {
  const s = assembleSnapshot(center, bpe, null, "pending");
  assert.equal(s.sourceStatus.bpe, "complete");
  assert.equal(s.sourceStatus.osmInfrastructure, "pending");
  assert.equal(s.sourceStatus.osmGreenSpaces, "pending");
  assert.equal(s.osm.potentiallyNoisyInfrastructure.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-autour.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `logement-autour.ts`**

```ts
import "server-only";
import type { LngLat } from "./geo-distance.ts";
import type { BpeNearest, OsmProximity, Face3Snapshot } from "./logement-autour-types.ts";
import { SOURCES_VERSION } from "./logement-store.ts";
import { OSM_QUERY_VERSION, OSM_BBOX_RADIUS_M } from "./logement-osm.ts";

export type { Face3Snapshot }; // ré-export pratique pour les consommateurs

export function assembleSnapshot(
  center: LngLat,
  bpe: BpeNearest[],
  osm: OsmProximity | null,
  osmStatus: "complete" | "pending" | "failed",
): Face3Snapshot {
  const now = new Date().toISOString();
  return {
    center,
    bpe: { categories: bpe },
    osm: osm ?? { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: OSM_BBOX_RADIUS_M },
    sourceStatus: { bpe: "complete", osmInfrastructure: osmStatus, osmGreenSpaces: osmStatus },
    sources: { bpeVersion: SOURCES_VERSION, osmFetchedAt: osmStatus === "complete" ? now : null, osmQueryVersion: OSM_QUERY_VERSION },
    sourcesVersion: SOURCES_VERSION,
    computedAt: now,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/logement-autour.test.ts`
Expected: PASS.

- [ ] **Step 5: Écrire la route `/api/logement-autour/route.ts`**

Vérifier d'abord la signature de `after` : `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`.

```ts
import "server-only";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount } from "@/lib/user-account";
import { loadBpePointsAround, nearestByCategory } from "@/lib/logement-bpe";
import { getTileGeoms, computeOsmProximity, OSM_BBOX_RADIUS_M } from "@/lib/logement-osm";
import { assembleSnapshot } from "@/lib/logement-autour";
import { getLogement, upsertLogement, needsRecompute, SOURCES_VERSION } from "@/lib/logement-store";
import type { Posture } from "@/lib/logement-autour-types";

export const dynamic = "force-dynamic";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) return Response.json({ error: "forbidden" }, { status: 403 });
  const { user } = await requireCurrentUser();
  const body = (await req.json()) as { insee: string; latitude: number; longitude: number; address_label: string; parcel_code?: string; posture: Posture };
  const center = { lat: body.latitude, lon: body.longitude };

  // Snapshot déjà valide en base ? -> le renvoyer figé.
  const { supabase } = await requireCurrentUser();
  const existing = await getLogement(supabase, user.id, body.insee);
  if (existing && !needsRecompute(existing, center, SOURCES_VERSION)) {
    return Response.json({ snapshot: existing.snapshot });
  }

  // BPE (local, immédiat).
  const bpe = nearestByCategory(center, await loadBpePointsAround(center));

  // OSM : cache de cellule (service-role) ; si froid, fetch inline sous ~timeout.
  let osm = null, osmStatus: "complete" | "pending" | "failed" = "pending";
  try {
    const tile = await Promise.race([
      getTileGeoms(admin, center),
      new Promise<{ geoms: never[]; status: "pending" }>((res) => setTimeout(() => res({ geoms: [], status: "pending" }), 3500)),
    ]);
    if (tile.status === "complete") { osm = computeOsmProximity(center, tile.geoms, OSM_BBOX_RADIUS_M); osmStatus = "complete"; }
    else if (tile.status === "failed") osmStatus = "failed";
    else {
      // timeout : poursuivre le remplissage du cache après réponse (tuile chaude au retry).
      after(async () => { await getTileGeoms(admin, center).catch(() => {}); });
    }
  } catch { osmStatus = "failed"; }

  const snapshot = assembleSnapshot(center, bpe, osm, osmStatus);
  await upsertLogement(supabase, { user_id: user.id, insee: body.insee, address_label: body.address_label, latitude: body.latitude, longitude: body.longitude, parcel_code: body.parcel_code ?? null, posture: body.posture, snapshot });
  return Response.json({ snapshot });
}
```

- [ ] **Step 6: Event PostHog de complétude (sans tile_key brut)**

Dans le module (Task 9, à l'appel), capter `logement_autour` avec `{ insee, posture, status_bpe, status_osm_infra: snapshot.sourceStatus.osmInfrastructure, status_osm_green: snapshot.sourceStatus.osmGreenSpaces }`. **Ne pas** envoyer de coordonnées ni de `tile_key`.

- [ ] **Step 7: Vérifier build/typecheck**

Run: `npx tsc --noEmit && npx eslint src/app/api/logement-autour/route.ts src/lib/logement-autour.ts`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/lib/logement-autour.ts src/lib/logement-autour.test.ts src/app/api/logement-autour/route.ts
git commit -m "feat(logement): route de génération Face 3 (snapshot persisté, after() pour OSM)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: UI — bloc Face 3 dans `LogementModule.tsx`

**Files:**
- Modify: `src/components/report/LogementModule.tsx`

**Interfaces:**
- Consumes : `POST /api/logement-autour` → `{ snapshot: Face3Snapshot }`.

- [ ] **Step 1: Appeler la route à l'analyse + stocker le snapshot**

Après le `fetch` `/api/georisques-logement` réussi (dans `handleSubmit`), si `payload.address` a lat/lon/citycode, appeler `/api/logement-autour` avec `{ insee: payload.address.citycode, latitude, longitude, address_label, parcel_code, posture }` (posture par défaut `residence`, écrasée par la sonde). Stocker le snapshot dans un state `const [autour, setAutour] = useState<Face3Snapshot | null>(null)`. Émettre l'event PostHog `logement_autour` (Task 8, Step 6).

- [ ] **Step 2: Rendre le bloc Face 3 (hiérarchie 3 briques, distances brutes)**

Ajouter, dans la section RÉSULTATS (après le bloc Sinistralité, avant ZFE), un composant qui respecte la hiérarchie et le wording verbatim :

```tsx
function Face3Block({ s }: { s: Face3Snapshot }) {
  const CAT_LABEL: Record<string, string> = { sante: "Santé", alimentation: "Alimentation quotidienne", education: "Éducation", transports: "Transports", services: "Services essentiels" };
  const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`);
  return (
    <ReportSection eyebrow="Autour de cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 20 }}>
          {/* Brique 1 — vie quotidienne (socle) */}
          <div style={{ display: "grid", gap: 10 }}>
            {s.bpe.categories.map((c) => (
              <div key={c.category} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 15, color: "var(--fg-2)" }}>
                <span>{CAT_LABEL[c.category]}</span>
                <span style={{ color: "var(--fg-hi)" }}>
                  {c.nearest ? `le plus proche à environ ${km(c.nearest.distanceMeters)} à vol d'oiseau`
                    : `Aucun équipement de cette catégorie recensé dans les ${c.searchCapMeters / 1000} km analysés.`}
                </span>
              </div>
            ))}
          </div>
          {/* Brique 2 — infrastructures potentiellement bruyantes (vigilance) */}
          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {s.sourceStatus.osmInfrastructure === "pending" ? <em style={{ color: "var(--fg-4)" }}>Environnement en cours de récupération…</em>
              : s.osm.potentiallyNoisyInfrastructure.length > 0
                ? s.osm.potentiallyNoisyInfrastructure.map((x) => `À environ ${km(x.distanceMeters)} d'un axe ${x.type === "railway" ? "ferroviaire" : "autoroutier"} cartographié.`).join(" ")
                : "Aucun axe autoroutier ou ferroviaire cartographié dans l'emprise analysée de 1,5 km."}
          </div>
          {/* Brique 3 — espaces verts (repère) */}
          <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
            {s.sourceStatus.osmGreenSpaces === "pending" ? <em style={{ color: "var(--fg-4)" }}>Environnement en cours de récupération…</em>
              : s.osm.nearestMappedGreenSpace
                ? `Espace vert cartographié le plus proche à environ ${km(s.osm.nearestMappedGreenSpace.distanceMeters)}.`
                : "Aucun espace vert correspondant aux catégories recherchées dans l'emprise cartographiée."}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.8 }}>
            INSEE (BPE) · OpenStreetMap (ODbL) · distances à vol d'oiseau
          </div>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
```
Puis `{autour && <Face3Block s={autour} />}` dans le rendu.

- [ ] **Step 3: Re-demande unique si `pending`**

Si `autour.sourceStatus.osmInfrastructure === "pending"`, programmer **une** re-demande après ~4 s (`useEffect` avec un flag anti-boucle) qui rappelle `/api/logement-autour` et remplace le snapshot. Ne jamais boucler au-delà d'une tentative (le reste = incrément futur).

- [ ] **Step 4: Persister la posture via `ProjectProbe`**

Quand l'utilisateur répond à `ProjectProbe` (`achat` → `prospection`, sinon `residence`), rappeler `/api/logement-autour` avec la posture choisie (met à jour la ligne `logement`). Le mapping : `reside`→`residence`, `achat`/`location`→`prospection`.

- [ ] **Step 5: État Découverte sans logement**

Si le module est ouvert sans adresse analysée **et** que le contexte est découverte (aucune `defaultCommune` de résidence), afficher au-dessus du formulaire un encart via `GlassCard` :
> **Vous explorez la commune sans logement précis.** Les analyses à l'adresse seront disponibles lorsque vous aurez identifié un bien ou un secteur.

avec le formulaire existant comme moyen d'« ajouter un logement ». (Pas d'adresse fabriquée : l'encart accompagne, il ne bloque pas.)

- [ ] **Step 6: Vérifier tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/report/LogementModule.tsx
git commit -m "feat(logement): bloc Face 3 « autour de cette adresse » (3 briques, états pending/Découverte)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Vérification navigateur (bout en bout)

**Files:** aucun (vérification).

- [ ] **Step 1: Route dev jetable**

Créer `src/app/dev-logement-preview/page.tsx` (comme lors du chantier harmonisation) rendant `<LogementModule defaultCommune="Toulouse" />`. À supprimer après.

- [ ] **Step 2: Piloter 3 scénarios**

Avec le dev server sur :3000, via `chrome-headless-shell` (script type `drive-face2.mjs`) :
1. **Résidence avec logement** (`5 rue du Taur, Toulouse`) : les 3 briques s'affichent, distances brutes, attribution INSEE/OSM.
2. **`pending` OSM** : si Overpass lent, BPE visible + ligne « environnement en cours », puis complétion après re-demande (2ᵉ chargement instantané, tuile chaude).
3. **Découverte sans logement** : encart « Vous explorez la commune sans logement précis » + formulaire d'ajout.

Vérifier : **0 erreur console**, wording verbatim présent (grep sur le HTML rendu : « Aucun axe autoroutier ou ferroviaire cartographié dans l'emprise analysée de 1,5 km », « à vol d'oiseau », « INSEE (BPE) »), harmonisation visuelle (verre arrondi, 15-16px).

- [ ] **Step 3: Diff de déterminisme (snapshot figé)**

Recharger la même adresse : le snapshot est relu de la base (mêmes distances, aucun nouvel appel Overpass). Vérifier en base : `select posture, snapshot->'sourceStatus' from logement where insee = '31555' ;`.

- [ ] **Step 4: Supprimer la route dev + commit final**

```bash
rm -rf src/app/dev-logement-preview
git add -A && git commit -m "chore(logement): retire la route dev de vérif Face 3

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: Clôture**

`finishing-a-development-branch` → pousser sur `main` (norme de session). Mettre à jour `docs/vault/modules/logement.md` (Face 3 branchée) et `/memory/project_module_logement.md` (RESTE : Faces 1/4, dashboard PostHog, mapping INSEE 107 communes).

---

## Notes d'exécution

- **Ordre** : Tasks 1→2 (maths pures) avant tout ; 3→4 (BPE) et 5→6 (persistance) indépendants ; 7 (OSM) après 1-2 ; 8 (assemblage/route) après 4,6,7 ; 9 (UI) après 8 ; 10 en dernier.
- **Overpass** n'est jamais appelé à l'affichage (invariant). Toute latence/échec vit à la génération et est **observable** via `sourceStatus`.
- **TYPEQU Face 3** : confirmer sur `NOMRS` (Task 3 Step 1) avant de figer — le mapping candidat peut différer du réel.
- **`OSM_CELL_DEG`** : valeur de départ ~0,005° ; valider empiriquement (Task 7 Step 6) le couple poids/latence sur ville dense / moyenne / rural boisé.
- **Auth** : `/rapport/logement` et la route sont derrière `canAccessCompleteReport` ; la vérif navigateur passe par la route dev jetable.
- **`next build` complet** à lancer une fois avant push (trace serverless des shards `data/bpe-points`).

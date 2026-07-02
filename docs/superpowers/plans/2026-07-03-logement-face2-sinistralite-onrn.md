# Face 2 Logement — Sinistralité ONRN (sécheresse + inondation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher dans le module Logement un bloc « matérialité assurantielle passée » qui affiche, au grain commune et en classes verbatim gatées, le coût moyen + la fréquence des sinistres CatNat sécheresse et inondation (données ONRN 1995-2021).

**Architecture:** Une lib serveur (`onrn-sinistralite.ts`) charge deux JSON runtime en cache mémoire et encapsule tout le gating dans une fonction pure `classify`. La route API `/api/georisques-logement` l'appelle et ajoute `sinistralite` au payload. `LogementModule` rend un `SinistraliteBlock` en section sœur juste après « Risques du bâti ».

**Tech Stack:** Next.js (App Router, route handler Node), TypeScript, `node --test` (runner natif, zéro dépendance) pour la logique pure, Python (venv + openpyxl) pour le pipeline de données.

## Global Constraints

Ces règles s'appliquent à CHAQUE tâche (garde-fous doctrine, verbatim exact) :

- Classes **verbatim**, jamais un chiffre au milieu d'une classe.
- « les **biens assurés** de cette commune », jamais « les maisons d'ici » (le périmètre inclut les professionnels).
- « **répertorié** », jamais « aucun sinistre » sec.
- Aucune inférence future individuelle (« vous serez surprimé/refusé », « votre maison fissurera »).
- Aucune tendance inter-millésimes, aucun scoring `/ou-vivre`.
- Toujours nommer l'échelle (**commune**) et la période (**1995-2021**).
- Attribution exacte : « ONRN (État / CCR / Mission Risques Naturels), via Géorisques ».
- Taux CatNat exact : surprime « portée à **20 % au 1ᵉʳ janvier 2025** », présentée comme **uniforme au niveau national** (ne prédit pas la prime du lecteur).
- Gate de représentativité : ne raconter le coût/fréquence QUE si représentativité ∈ { `Entre 30 et 50%`, `> 50%` }.
- Périmètre : sécheresse (RGA) + inondation (tous types) UNIQUEMENT. Jamais S/P, jamais reconnaissances, jamais coût cumulé.

---

### Task 1: Pipeline de données — inondation consolidée + JSON runtime allégés

**Files:**
- Create: `data/source/onrn/ONRN_CoutMoyen_INON_9521.xlsx`, `ONRN_Frequence_INON_9521.xlsx`, `ONRN_SsurP_INON_9521.xlsx` (sources brutes, audit)
- Create: `data/source/onrn/consolider-inondation.py`
- Create: `data/source/onrn/onrn_inondation_consolide.json` (avec `nom`, audit)
- Create: `data/source/onrn/build-runtime-json.py`
- Create: `data/onrn-secheresse.json`, `data/onrn-inondation.json` (runtime lean `{ "<insee>": {"c","f","r"} }`)

**Interfaces:**
- Produces: deux fichiers `data/onrn-{secheresse,inondation}.json`, keyés par INSEE, valeurs `{ c: string, f: string, r: string }` (coût, fréquence, représentativité verbatim). Consommés par la lib de la Task 2/3.

- [ ] **Step 1: Récupérer les sources inondation dans le repo**

Les 3 xlsx inondation ont été téléchargés le 2026-07-03 dans le scratchpad de session. Les copier (ou re-télécharger). Re-téléchargement de référence :

```bash
cd "$(git rev-parse --show-toplevel)"
for f in ONRN_CoutMoyen_INON_9521.xlsx ONRN_Frequence_INON_9521.xlsx ONRN_SsurP_INON_9521.xlsx; do
  curl -sL --max-time 60 -o "data/source/onrn/$f" "https://files.georisques.fr/onrn/2025/$f"
done
ls -la data/source/onrn/*INON*
```
Expected: 3 fichiers ~1,7 Mo chacun.

- [ ] **Step 2: Écrire le script de consolidation inondation**

Create `data/source/onrn/consolider-inondation.py` (chemins relatifs au repo) :

```python
import openpyxl, csv, json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

def read_sheet(fname, sheet):
    wb = openpyxl.load_workbook(os.path.join(HERE, fname), read_only=True, data_only=True)
    ws = wb[sheet]; rows = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0: continue
        insee, name, val = r[0], r[1], r[2]
        if insee is None: continue
        rows.append((str(insee).strip(), (name or "").strip(),
                     val.strip() if isinstance(val, str) else val))
    wb.close(); return rows

cout = read_sheet("ONRN_CoutMoyen_INON_9521.xlsx", "Coût moy. sinistres")
rep  = read_sheet("ONRN_CoutMoyen_INON_9521.xlsx", "Représentativité")
freq = read_sheet("ONRN_Frequence_INON_9521.xlsx", "Fréq. moy. sinistres")

cout_m = {i: v for i, n, v in cout}
rep_m  = {i: v for i, n, v in rep}
freq_m = {i: v for i, n, v in freq}
name_m = {i: n for i, n, v in cout}

# Garde-fou anti-corruption : le couplage 'no sinistre' coût<->représentativité doit être ~100 %.
def is_no(v): return isinstance(v, str) and v.startswith("Pas de sinistre")
both = [i for i in cout_m if i in rep_m]
couple = sum(1 for i in both if is_no(cout_m[i]) == is_no(rep_m[i]))
pct = 100 * couple / len(both)
print("couplage cout<->repr 'no sinistre': %.3f%%" % pct)
assert pct > 99.9, "ALIGNEMENT SUSPECT : le fichier coût inondation est peut-être désaligné, arrêt."

out = {i: {"nom": name_m.get(i, ""), "cout_moyen": cout_m.get(i),
           "frequence": freq_m.get(i), "representativite": rep_m.get(i)} for i in cout_m}
with open(os.path.join(HERE, "onrn_inondation_consolide.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print("ecrit onrn_inondation_consolide.json :", len(out), "communes")
```

- [ ] **Step 3: Lancer la consolidation**

```bash
cd "$(git rev-parse --show-toplevel)"
python3 -m venv /tmp/onrn-venv && /tmp/onrn-venv/bin/pip -q install openpyxl
/tmp/onrn-venv/bin/python data/source/onrn/consolider-inondation.py
```
Expected: `couplage ... 100.000%` puis `ecrit ... 34839 communes`. (Si l'assert saute : le coût inondation est désaligné comme la sécheresse l'était → appliquer la même reconstruction par position que `reconstruire-cout-secheresse.py`.)

- [ ] **Step 4: Écrire le script de génération runtime (allégé, sans `nom`)**

Create `data/source/onrn/build-runtime-json.py` :

```python
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

def slim(src, dst):
    d = json.load(open(os.path.join(HERE, src), encoding="utf-8"))
    out = {i: {"c": v["cout_moyen"], "f": v["frequence"], "r": v["representativite"]}
           for i, v in d.items()}
    p = os.path.join(REPO, "data", dst)
    json.dump(out, open(p, "w", encoding="utf-8"), ensure_ascii=False)
    print("ecrit", dst, ":", len(out), "communes")

slim("onrn_secheresse_consolide.json", "onrn-secheresse.json")
slim("onrn_inondation_consolide.json", "onrn-inondation.json")
```

- [ ] **Step 5: Générer les fichiers runtime**

```bash
/tmp/onrn-venv/bin/python data/source/onrn/build-runtime-json.py
```
Expected: `ecrit onrn-secheresse.json : 34839` et `ecrit onrn-inondation.json : 34839`.

- [ ] **Step 6: Vérifier la forme et des valeurs connues**

```bash
python3 -c "
import json
sec=json.load(open('data/onrn-secheresse.json')); ino=json.load(open('data/onrn-inondation.json'))
assert set(sec['31555'])=={'c','f','r'}, sec['31555']
assert sec['31555']['r']=='Entre 30 et 50%', sec['31555']
assert ino['33063']['r']=='> 50%', ino['33063']
assert sec['59350']['r']=='Pas de sinistre répertorié à CCR', sec['59350']
print('OK', len(sec), len(ino))
"
```
Expected: `OK 34839 34839`.

- [ ] **Step 7: Commit**

```bash
git add data/source/onrn/ONRN_*INON*.xlsx data/source/onrn/consolider-inondation.py \
        data/source/onrn/onrn_inondation_consolide.json data/source/onrn/build-runtime-json.py \
        data/onrn-secheresse.json data/onrn-inondation.json
git commit -m "data(onrn): inondation consolidée + JSON runtime sécheresse/inondation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Lib `onrn-sinistralite.ts` — fonction pure `classify` (TDD)

**Files:**
- Create: `src/lib/onrn-sinistralite.ts`
- Create: `src/lib/onrn-sinistralite.test.ts`
- Modify: `tsconfig.json` (exclure les tests)
- Modify: `eslint.config.mjs` (ignorer les tests)

**Interfaces:**
- Produces: `export function classify(raw: OnrnRaw | undefined): PerilState` ; types `PerilState`, `OnrnSinistralite`, `OnrnRaw`.
  - `OnrnRaw = { c: string; f: string; r: string }`
  - `PerilState = { kind: "lecture"; cout: string; frequence: string; representativite: string } | { kind: "aucun" } | { kind: "faible_repr"; representativite: string } | { kind: "indispo" }`
  - `OnrnSinistralite = { secheresse: PerilState; inondation: PerilState }`

- [ ] **Step 1: Exclure les tests du typecheck et du lint**

Dans `tsconfig.json`, remplacer `"exclude": ["node_modules"]` par :
```json
"exclude": ["node_modules", "**/*.test.ts"]
```
Dans `eslint.config.mjs`, ajouter `"**/*.test.ts"` au tableau de `globalIgnores([...])` :
```js
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.test.ts",
  ]),
```

- [ ] **Step 2: Écrire le test qui échoue**

Create `src/lib/onrn-sinistralite.test.ts` :
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "./onrn-sinistralite.ts";

test("représentativité > 50% → lecture avec classes verbatim", () => {
  assert.deepEqual(
    classify({ c: "Plus de 20 k€", f: "Plus de 10 ‰", r: "> 50%" }),
    { kind: "lecture", cout: "Plus de 20 k€", frequence: "Plus de 10 ‰", representativite: "> 50%" },
  );
});

test("représentativité Entre 30 et 50% → lecture", () => {
  assert.equal(classify({ c: "Entre 10 et 20k€", f: "Entre 2 et 5 ‰", r: "Entre 30 et 50%" }).kind, "lecture");
});

test("pas de sinistre répertorié → aucun", () => {
  assert.deepEqual(
    classify({ c: "Pas de sinistre répertorié à CCR", f: "Pas de sinistre ou de risque répertoriés à CCR", r: "Pas de sinistre répertorié à CCR" }),
    { kind: "aucun" },
  );
});

test("représentativité < 15% → faible_repr", () => {
  assert.deepEqual(
    classify({ c: "Entre 5 et 10 k€", f: "Entre 1 et 2 ‰", r: "< 15%" }),
    { kind: "faible_repr", representativite: "< 15%" },
  );
});

test("représentativité Entre 15 et 30% → faible_repr", () => {
  assert.equal(classify({ c: "Entre 5 et 10 k€", f: "Entre 1 et 2 ‰", r: "Entre 15 et 30%" }).kind, "faible_repr");
});

test("donnée absente → indispo", () => {
  assert.deepEqual(classify(undefined), { kind: "indispo" });
});
```

- [ ] **Step 3: Lancer le test, vérifier l'échec**

Run: `node --test src/lib/onrn-sinistralite.test.ts`
Expected: FAIL (`Cannot find module './onrn-sinistralite.ts'` — le fichier lib n'existe pas encore).

- [ ] **Step 4: Écrire l'implémentation minimale (logique pure uniquement)**

Create `src/lib/onrn-sinistralite.ts` :
```ts
// Sinistralité assurantielle passée (ONRN/CCR via Géorisques), millésime 2025,
// période 1995-2021. Deux périls : sécheresse (RGA) et inondation (tous types).
// Classes catégorielles verbatim, gatées par la représentativité communale.
// Doctrine : docs/vault/modules/logement.md + data-curator 2026-07-02.

export type OnrnRaw = { c: string; f: string; r: string };

export type PerilState =
  | { kind: "lecture"; cout: string; frequence: string; representativite: string }
  | { kind: "aucun" }
  | { kind: "faible_repr"; representativite: string }
  | { kind: "indispo" };

export type OnrnSinistralite = { secheresse: PerilState; inondation: PerilState };

// Gate doctrine : ne raconter le coût/fréquence que si la représentativité ≥ "Entre 30 et 50%".
const GATE_REPR = new Set(["Entre 30 et 50%", "> 50%"]);
const NO_SINISTRE = "Pas de sinistre répertorié à CCR";

export function classify(raw: OnrnRaw | undefined): PerilState {
  if (!raw) return { kind: "indispo" };
  if (raw.r === NO_SINISTRE) return { kind: "aucun" };
  if (GATE_REPR.has(raw.r)) {
    return { kind: "lecture", cout: raw.c, frequence: raw.f, representativite: raw.r };
  }
  return { kind: "faible_repr", representativite: raw.r };
}
```

- [ ] **Step 5: Lancer le test, vérifier le succès**

Run: `node --test src/lib/onrn-sinistralite.test.ts`
Expected: `pass 6`, `fail 0`.

- [ ] **Step 6: Vérifier que le typecheck et le lint ignorent bien le test**

Run: `npx tsc --noEmit && npx eslint src/lib/onrn-sinistralite.ts`
Expected: exit 0, aucune erreur (et aucune plainte sur l'import `.ts` du fichier test).

- [ ] **Step 7: Commit**

```bash
git add src/lib/onrn-sinistralite.ts src/lib/onrn-sinistralite.test.ts tsconfig.json eslint.config.mjs
git commit -m "feat(logement): gating pur de la sinistralité ONRN (classify) + tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Lib `onrn-sinistralite.ts` — chargeur caché + `getOnrnSinistralite`

**Files:**
- Modify: `src/lib/onrn-sinistralite.ts`
- Modify: `src/lib/onrn-sinistralite.test.ts` (ajout d'un test d'intégration lecture disque)

**Interfaces:**
- Produces: `export async function getOnrnSinistralite(insee: string | null | undefined): Promise<OnrnSinistralite>`. Lit `data/onrn-{secheresse,inondation}.json` (cache module), applique `classify` par péril. Renvoie `{ secheresse, inondation }` tous deux `indispo` si INSEE nul.

- [ ] **Step 1: Écrire le test d'intégration qui échoue**

Ajouter à `src/lib/onrn-sinistralite.test.ts` (les fichiers `data/onrn-*.json` existent depuis la Task 1 ; `node --test` tourne depuis la racine repo, donc `process.cwd()` = racine) :
```ts
import { getOnrnSinistralite } from "./onrn-sinistralite.ts";

test("getOnrnSinistralite: Toulouse 31555 → sécheresse et inondation en lecture", async () => {
  const r = await getOnrnSinistralite("31555");
  assert.equal(r.secheresse.kind, "lecture");
  assert.equal(r.inondation.kind, "lecture");
});

test("getOnrnSinistralite: INSEE nul → indispo/indispo", async () => {
  const r = await getOnrnSinistralite(null);
  assert.deepEqual(r, { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/onrn-sinistralite.test.ts`
Expected: FAIL (`getOnrnSinistralite is not exported` / not a function).

- [ ] **Step 3: Implémenter le chargeur caché**

Ajouter à `src/lib/onrn-sinistralite.ts` (en tête, sous le commentaire de module) :
```ts
import fs from "node:fs/promises";
import path from "node:path";
```
et en bas du fichier :
```ts
type Dataset = Record<string, OnrnRaw>;
let cacheSech: Dataset | null = null;
let cacheInon: Dataset | null = null;

async function loadOne(file: string, current: Dataset | null): Promise<Dataset> {
  if (current) return current;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", file), "utf8");
    return JSON.parse(raw) as Dataset;
  } catch {
    return {}; // fichier absent (build sans la donnée) : tout tombe en indispo.
  }
}

export async function getOnrnSinistralite(
  insee: string | null | undefined,
): Promise<OnrnSinistralite> {
  if (!insee) return { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } };
  cacheSech = await loadOne("onrn-secheresse.json", cacheSech);
  cacheInon = await loadOne("onrn-inondation.json", cacheInon);
  return {
    secheresse: classify(cacheSech[insee]),
    inondation: classify(cacheInon[insee]),
  };
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/onrn-sinistralite.test.ts`
Expected: `pass 8`, `fail 0`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/onrn-sinistralite.ts src/lib/onrn-sinistralite.test.ts
git commit -m "feat(logement): chargeur caché getOnrnSinistralite (lecture disque gatée)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Câblage API — payload `sinistralite`

**Files:**
- Modify: `src/app/api/georisques-logement/route.ts`

**Interfaces:**
- Consumes: `getOnrnSinistralite` (Task 3).
- Produces: le JSON de la route porte désormais `sinistralite: OnrnSinistralite`.

- [ ] **Step 1: Importer la lib**

Dans `src/app/api/georisques-logement/route.ts`, après les imports lib existants (près de la ligne `import { getCommuneFullData } from "@/lib/commune-data";`), ajouter :
```ts
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";
```

- [ ] **Step 2: Appeler la lib dans le Promise.all communal**

Remplacer le bloc :
```ts
    const [georisquesCommune, altitude, zfe, irep, cartofriches, communeData] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      getIrepNearPoint(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getCartofrichesForCommune(address.citycode).catch(() => null) : null,
      address.citycode ? getCommuneFullData(address.citycode).catch(() => null) : null,
    ]);
```
par :
```ts
    const [georisquesCommune, altitude, zfe, irep, cartofriches, communeData, sinistralite] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      getIrepNearPoint(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getCartofrichesForCommune(address.citycode).catch(() => null) : null,
      address.citycode ? getCommuneFullData(address.citycode).catch(() => null) : null,
      getOnrnSinistralite(address.citycode).catch(() => null),
    ]);
```

- [ ] **Step 3: Ajouter `sinistralite` au payload**

Dans l'objet `NextResponse.json({ ... })`, après la ligne `communeData,`, ajouter :
```ts
        sinistralite,
```

- [ ] **Step 4: Vérifier via l'API (dev server tournant sur :3000)**

Run :
```bash
curl -s "http://localhost:3000/api/georisques-logement?q=$(python3 -c "import urllib.parse;print(urllib.parse.quote('5 rue du Taur, Toulouse'))")" \
 | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('sinistralite'), ensure_ascii=False))"
```
Expected: `{"secheresse": {"kind": "lecture", ...}, "inondation": {"kind": "lecture", ...}}`.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/georisques-logement/route.ts
git commit -m "feat(logement): expose la sinistralité ONRN dans le payload API

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Rendu — `SinistraliteBlock` dans `LogementModule`

**Files:**
- Modify: `src/components/report/LogementModule.tsx`

**Interfaces:**
- Consumes: le type `OnrnSinistralite`/`PerilState` (via `import type`), le champ `sinistralite` du payload.

- [ ] **Step 1: Importer les types (sans tirer `fs` dans le bundle client)**

En haut de `src/components/report/LogementModule.tsx`, après les imports existants, ajouter :
```ts
import type { OnrnSinistralite, PerilState } from "@/lib/onrn-sinistralite";
```
(`import type` est effacé à la compilation : aucun `node:fs` ne rejoint le bundle client.)

- [ ] **Step 2: Étendre le type `ApiResponse`**

Dans le type `ApiResponse`, ajouter un champ (après `georisques?: {...};`) :
```ts
  sinistralite?: OnrnSinistralite | null;
```

- [ ] **Step 3: Ajouter les composants de rendu**

Juste avant `// ═══ PAGE ═══` (au-dessus de `export default function LogementModule`), insérer :
```tsx
// Face 2 — matérialité assurantielle passée (ONRN/CCR, 1995-2021). Coût moyen +
// fréquence des sinistres indemnisés, classes verbatim gatées par la
// représentativité. Jamais prédictif : voir docs/vault/modules/logement.md.
function PerilLine({ peril, mecanisme, state }: { peril: string; mecanisme: string; state: PerilState }) {
  if (state.kind === "indispo") return null;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>
        {peril}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65 }}>
        {state.kind === "lecture" && (
          <>Sur 1995-2021, les sinistres {mecanisme} indemnisés au titre des catastrophes naturelles ont eu, pour les biens assurés de cette commune, un coût moyen de <strong style={{ color: "var(--fg-hi)" }}>{state.cout}</strong> et une fréquence de <strong style={{ color: "var(--fg-hi)" }}>{state.frequence}</strong>. Échantillon des assureurs (CCR) couvrant ici {state.representativite} du marché.</>
        )}
        {state.kind === "aucun" && (
          <>Aucun sinistre CatNat {peril.toLowerCase()} répertorié par la CCR pour les biens assurés de cette commune sur 1995-2021. L&apos;échantillon couvre environ la moitié du marché : un historique vide n&apos;exclut pas une exposition future.</>
        )}
        {state.kind === "faible_repr" && (
          <>Des sinistres {peril.toLowerCase()} sont répertoriés, mais l&apos;échantillon assurantiel local est trop mince (représentativité {state.representativite}) pour en tirer une lecture fiable.</>
        )}
      </div>
    </div>
  );
}

function SinistraliteBlock({ sinistralite }: { sinistralite: OnrnSinistralite }) {
  const { secheresse, inondation } = sinistralite;
  if (secheresse.kind === "indispo" && inondation.kind === "indispo") return null;
  return (
    <div>
      <SectionLabel>Ce que le passé assurantiel dit</SectionLabel>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: 18 }}>
        <PerilLine peril="Sécheresse" mecanisme="sécheresse (retrait-gonflement des argiles)" state={secheresse} />
        <PerilLine peril="Inondation" mecanisme="inondation (tous types : coulée de boue, remontée de nappe, submersion marine)" state={inondation} />
        <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-1)", fontSize: 11, color: "var(--fg-4)", lineHeight: 1.6 }}>
          Le régime CatNat finance ces indemnisations par une surprime légale, aujourd&apos;hui uniforme au niveau national (portée à 20 % au 1ᵉʳ janvier 2025) : ce passé local ne fixe pas le prix de votre assurance. Un débat en cours (rapport Langreney) pose la question d&apos;une modulation selon l&apos;exposition locale.
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.8 }}>
          ONRN (État / CCR / Mission Risques Naturels), via Géorisques — sinistres indemnisés 1995-2021, biens assurés particuliers et professionnels.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Monter le bloc juste après « Risques du bâti »**

Dans le JSX de résultats, repérer la fermeture de la section Risques (le bloc `{(allRisks.length > 0 || georisques?.seismic || georisques?.rga) && ( ... )}`). Immédiatement APRÈS ce bloc et AVANT le commentaire `{/* ZFE */}`, insérer :
```tsx
              {/* Face 2 — matérialité assurantielle passée (ONRN) */}
              {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} />}
```

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx`
Expected: exit 0.

- [ ] **Step 6: Vérification navigateur (route dev jetable + chrome-headless-shell)**

Créer une route dev jetable `src/app/dev-logement-preview/page.tsx` :
```tsx
import LogementModule from "@/components/report/LogementModule";
export const dynamic = "force-dynamic";
export default function DevLogementPreview() { return <LogementModule defaultCommune="Toulouse" />; }
```
Piloter 3 adresses couvrant les états (dev server sur :3000), via un script Playwright (`chrome-headless-shell` de ms-playwright) qui saisit l'adresse, attend le passeport, capture un screenshot pleine page :
- `5 rue du Taur, Toulouse` → sécheresse **lecture** + inondation **lecture**
- une adresse à `Bordeaux` (INSEE 33063, non-PLM) → sécheresse **faible_repr** + inondation **lecture**
- une adresse à `Lille` (INSEE 59350) → sécheresse **aucun** + inondation **faible_repr**

Regarder les screenshots : le bloc « Ce que le passé assurantiel dit » apparaît juste sous « Risques du bâti », les bonnes phrases par état, aucune section cassée, zéro erreur console. Pour le cas Toulouse, le script Playwright doit AUSSI dumper le HTML rendu (`fs.writeFileSync("rendu.html", await page.content())`) après apparition du bloc, pour l'étape suivante.

- [ ] **Step 7: Vérification des garde-fous sur le HTML rendu**

Sur le `rendu.html` de l'adresse Toulouse (dumpé au Step 6), vérifier :
```bash
# doit être présent
grep -q "ONRN (État / CCR / Mission Risques Naturels), via Géorisques" rendu.html && echo "attribution OK"
grep -q "1995-2021" rendu.html && echo "période OK"
# doit être ABSENT (garde-fous)
grep -qiE "votre maison|vous serez|les maisons d.ici" rendu.html && echo "VIOLATION" || echo "garde-fous OK"
```
Expected: `attribution OK`, `période OK`, `garde-fous OK`.

- [ ] **Step 8: Supprimer la route dev et committer**

```bash
rm -rf src/app/dev-logement-preview
git add src/components/report/LogementModule.tsx
git commit -m "feat(logement): bloc matérialité assurantielle passée (sinistralité ONRN)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Déploiement — `outputFileTracingIncludes`

**Files:**
- Modify: `next.config.ts`

**Interfaces:** aucune (config de trace serverless).

- [ ] **Step 1: Ajouter la clé de trace**

Dans `next.config.ts`, dans l'objet `outputFileTracingIncludes`, ajouter une entrée :
```ts
    "/api/georisques-logement": [
      "./data/onrn-secheresse.json",
      "./data/onrn-inondation.json",
    ],
```

- [ ] **Step 2: Vérifier que le build voit la route et trace la donnée**

Run: `npx next build 2>&1 | tail -20`
Expected: build OK (aucune erreur), la route `/api/georisques-logement` listée dans l'output. (Si `next build` est trop long/coûteux ici, au minimum `npx tsc --noEmit` doit passer et la config doit rester valide JS.)

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore(logement): trace les JSON ONRN pour la route serverless

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Passe Editorial Writer + mise à jour vault/mémoire

**Files:**
- Modify: `src/components/report/LogementModule.tsx` (rédaction ciselée)
- Modify: `docs/vault/modules/logement.md`, `docs/vault/recherches/inventaire-sources.md`, `docs/vault/paris.md`
- Modify: `/Users/quentinbrache/.claude/projects/-Users-quentinbrache-Desktop-Futur-e/memory/project_module_logement.md`

**Interfaces:** aucune (prose + doc).

- [ ] **Step 1: Lancer l'agent Editorial Writer sur la rédaction du bloc**

Dispatcher l'agent `editorial-writer` (read-only) sur les chaînes de `SinistraliteBlock`/`PerilLine` (4 états + pédagogie CatNat + attribution), en lui demandant d'écrire son rapport dans `docs/rapports-agents/editorial-writer/2026-07-03-sinistralite-onrn.md` AVANT de rendre la main (convention AGENTS.md). Question-mère : la prose fait-elle sentir qu'on comprend la situation du lecteur avant de parler donnée, sans jamais prédire ?

- [ ] **Step 2: Appliquer les réécritures retenues**

Éditer les chaînes dans `LogementModule.tsx` selon le rapport, en respectant les Global Constraints (verbatim, « biens assurés », « répertorié », pas de futur individuel). Re-vérifier au navigateur (route dev jetable) une adresse en état `lecture`.

- [ ] **Step 3: Mettre à jour le vault**

- `docs/vault/modules/logement.md` : Face 2 passe de « à construire » à « branchée : sécheresse + inondation (coût moyen + fréquence ONRN, gaté représentativité, jamais prédictif) ».
- `docs/vault/recherches/inventaire-sources.md` : ligne ONRN inondation → active (plus seulement sécheresse).
- `docs/vault/paris.md` : pari #9 → « donnée branchée en Face 2, en attente de signal d'usage ».

- [ ] **Step 4: Mettre à jour la mémoire**

Dans `project_module_logement.md` : Face 2 livrée (sécheresse + inondation), reste Faces 1/3/4 + harmonisation visuelle + mapping INSEE 107 communes.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/components/report/LogementModule.tsx docs/vault/ docs/rapports-agents/editorial-writer/
git commit -m "feat(logement): passe éditoriale sinistralité ONRN + doctrine à jour

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes d'exécution

- **Dev server** : plusieurs vérifs supposent `next dev` sur `:3000` (déjà lancé en session ; sinon `npm run dev`).
- **Pièges INSEE connus** : Paris/Lyon/Marseille = arrondissements → `indispo` (ne pas les utiliser comme cas `lecture`). Les 107 communes fusionnées 2021→courant tombent en `indispo` (limite documentée).
- **Ordre** : Task 1 (données) doit précéder Task 3 (le test d'intégration lit les fichiers) et Task 2 peut se faire en parallèle de Task 1 (logique pure, pas de fichier).

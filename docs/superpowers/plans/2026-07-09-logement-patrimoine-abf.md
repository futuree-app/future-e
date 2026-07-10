# Patrimoine protégé à cette adresse — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dire au lecteur, à son adresse, qu'il se trouve dans un périmètre patrimonial, et que les travaux qui modifient l'aspect extérieur y passent par une autorisation avec avis de l'Architecte des Bâtiments de France.

**Architecture:** Une lib pure (`gpu-servitudes.ts`) filtre et dédoublonne les familles patrimoniales renvoyées par le Géoportail de l'urbanisme. Un fetcher mince (`gpu.ts`) l'alimente depuis `apicarto.ign.fr`, appelé en parallèle des sources existantes dans la route `georisques-logement`. Le rendu s'ajoute au bloc « Statut réglementaire à cette adresse » déjà présent en Face 2, et un point s'ajoute à la checklist « À vérifier avant de décider ».

**Tech Stack:** TypeScript, Next.js App Router, `node:test` + `node:assert/strict` (les tests tournent avec `node --test <fichier>`, Node 25 strippe les types), React 19 (composants serveur/client existants), aucune dépendance nouvelle.

**Spec:** `docs/superpowers/specs/2026-07-09-logement-patrimoine-abf-design.md`

## Global Constraints

- **Ne jamais déduire les travaux autorisés ou interdits.** La lib structure ce que l'API renvoie, comme `pprn-zonage.ts`. Le verdict appartient à l'ABF.
- **Le fait est binaire, jamais énuméré.** Un point peut être dans 134 assiettes `AC1` (Place Stanislas). On dédoublonne par famille. Aucun compteur, aucun nom de monument, aucune distance.
- **Le silence n'est jamais une absence.** Aucune servitude trouvée : rien ne s'affiche. Panne : `sourceStatus: "unavailable"`, et surtout jamais une liste vide présentée comme une absence.
- **Le statut réglementaire reste frais.** Comme le PPRN, le patrimoine est re-fetché à chaque rendu. Il n'entre **pas** dans le snapshot `logement`.
- **Copie exacte, arbitrée par le porteur, à ne pas reformuler :** « Cette adresse se situe dans un périmètre patrimonial. Certains travaux modifiant l'aspect extérieur du bâtiment peuvent nécessiter une autorisation et l'avis de l'Architecte des Bâtiments de France. À vérifier en mairie avant devis ou dépôt de dossier. »
- **Typographie :** jamais de tiret cadratin (`—`) dans le texte destiné au lecteur. Virgule ou deux points.
- **Ordre des familles :** `AC1`, puis `AC4`, puis `AC2`. Convention de lecture, **non** une hiérarchie de sévérité.
- **Branche :** `feat/logement-patrimoine-abf`, depuis `main`.

---

### Task 1: Lib pure `gpu-servitudes.ts`

**Files:**
- Create: `src/lib/gpu-servitudes.ts`
- Test: `src/lib/gpu-servitudes.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `type HeritageFamily = "AC1" | "AC2" | "AC4"`
  - `type HeritageProtection = { family: HeritageFamily; label: string }`
  - `type RawSupFeature = { properties?: { idass?: string | null } | null }`
  - `function buildHeritageProtections(features: RawSupFeature[] | null | undefined): HeritageProtection[]`

- [ ] **Step 1: Write the failing test**

Create `src/lib/gpu-servitudes.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildHeritageProtections, type RawSupFeature } from "./gpu-servitudes.ts";

const feat = (idass: string): RawSupFeature => ({ properties: { idass } });

// Place Stanislas : 134 assiettes, presque toutes AC1. Le lecteur a besoin de savoir
// qu'il est dedans, jamais combien.
test("dédoublonne une famille répétée", () => {
  const features = Array.from({ length: 134 }, (_, i) => feat(`AC1-54395000${i}-1-1`));
  const out = buildHeritageProtections(features);
  assert.equal(out.length, 1);
  assert.equal(out[0].family, "AC1");
  assert.equal(out[0].label, "Abords d'un monument historique");
});

test("écarte les familles non patrimoniales", () => {
  const out = buildHeritageProtections([feat("AC1-a-1-1"), feat("PM1-b-1-1"), feat("AS1-c-1-1")]);
  assert.deepEqual(out.map((p) => p.family), ["AC1"]);
});

test("ordre stable AC1, AC4, AC2", () => {
  const out = buildHeritageProtections([feat("AC2-a-1-1"), feat("AC4-b-1-1"), feat("AC1-c-1-1")]);
  assert.deepEqual(out.map((p) => p.family), ["AC1", "AC4", "AC2"]);
});

test("entrées vides ou absentes", () => {
  assert.deepEqual(buildHeritageProtections([]), []);
  assert.deepEqual(buildHeritageProtections(null), []);
  assert.deepEqual(buildHeritageProtections(undefined), []);
});

test("idass absent, vide ou inconnu : ignoré, jamais deviné", () => {
  const out = buildHeritageProtections([
    { properties: null },
    { properties: { idass: null } },
    { properties: { idass: "" } },
    feat("XX9-a-1-1"),
    feat("ac1-minuscule-1-1"),
  ]);
  assert.deepEqual(out, []);
});

test("libellés officiels des trois familles", () => {
  const out = buildHeritageProtections([feat("AC1-a"), feat("AC2-b"), feat("AC4-c")]);
  assert.deepEqual(out.map((p) => p.label), [
    "Abords d'un monument historique",
    "Site patrimonial remarquable",
    "Site classé ou inscrit",
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/gpu-servitudes.test.ts`
Expected: FAIL, `Cannot find module './gpu-servitudes.ts'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/gpu-servitudes.ts`:

```ts
// Protections patrimoniales au point (Face 2 Logement), depuis les assiettes de servitude du
// Géoportail de l'urbanisme. Lib PURE (pas server-only) : utilisée côté serveur par `gpu.ts`, son
// TYPE est importé côté client par le rapport.
//
// Ne déduit JAMAIS les travaux autorisés ou interdits : elle filtre, dédoublonne et nomme.
//
// Sémantique vérifiée sur la donnée réelle (2026-07-09) :
//  - un point est dans autant d'assiettes qu'il y a de monuments autour (Place Stanislas : 134,
//    cathédrale de Strasbourg : 107). Le fait utile est binaire, jamais un compteur ;
//  - la famille se lit dans le préfixe de `idass` : "AC1-172014607-2401160004-1-1" -> "AC1" ;
//  - les familles non patrimoniales (PM1 risques, AS1 captages, I4, T1...) sont écartées ici :
//    les risques sont déjà portés par la brique PPRN, le reste ne change aucune décision d'habitant.

export type HeritageFamily = "AC1" | "AC2" | "AC4";

export type HeritageProtection = {
  family: HeritageFamily;
  label: string; // terme officiel, jamais un jugement de sévérité
};

export type RawSupFeature = { properties?: { idass?: string | null } | null };

const LABELS: Record<HeritageFamily, string> = {
  AC1: "Abords d'un monument historique",
  AC4: "Site patrimonial remarquable",
  AC2: "Site classé ou inscrit",
};

// Convention de LECTURE, non une hiérarchie de contrainte : un site classé (AC2) peut être plus
// contraignant que des abords (AC1).
const ORDER: HeritageFamily[] = ["AC1", "AC4", "AC2"];

function familyOf(idass: string | null | undefined): HeritageFamily | null {
  if (!idass) return null;
  const prefix = idass.split("-")[0];
  return prefix === "AC1" || prefix === "AC2" || prefix === "AC4" ? prefix : null;
}

export function buildHeritageProtections(
  features: RawSupFeature[] | null | undefined,
): HeritageProtection[] {
  const found = new Set<HeritageFamily>();
  for (const feature of features ?? []) {
    const family = familyOf(feature?.properties?.idass);
    if (family) found.add(family);
  }
  return ORDER.filter((f) => found.has(f)).map((family) => ({ family, label: LABELS[family] }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/gpu-servitudes.test.ts`
Expected: PASS, `pass 6`, `fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/lib/gpu-servitudes.ts src/lib/gpu-servitudes.test.ts
git commit -m "feat(logement): lib pure des protections patrimoniales au point

Filtre AC1/AC2/AC4 depuis les assiettes de servitude du GPU, dédoublonne par
famille (un point est dans autant d'assiettes qu'il y a de monuments autour :
134 Place Stanislas), rend un ordre stable. Ne déduit jamais les travaux.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Fetcher `gpu.ts`

**Files:**
- Create: `src/lib/gpu.ts`

**Interfaces:**
- Consumes: `buildHeritageProtections`, `HeritageProtection` (Task 1).
- Produces:
  - `type HeritageStatus = { items: HeritageProtection[]; sourceStatus: "ok" | "unavailable" }`
  - `function fetchHeritageProtections(latitude: number, longitude: number): Promise<HeritageStatus>`

Pas de test : le fetcher n'a aucune logique. Toute la logique est en Task 1, testée. Son contrat est vérifié en Task 5 (critère d'acceptation manuel).

- [ ] **Step 1: Write the implementation**

Create `src/lib/gpu.ts`:

```ts
import "server-only";
import { buildHeritageProtections, type HeritageProtection, type RawSupFeature } from "./gpu-servitudes.ts";

// Géoportail de l'urbanisme (API Carto IGN). Même hôte que `cadastre.ts`, aucune clé requise.
// Latence mesurée le 2026-07-09 : 641 ms médiane, 1 495 ms au pire, aucun rejet sur dix appels
// consécutifs. À appeler EN PARALLÈLE des autres sources, jamais en série.
const GPU_SUP_URL = "https://apicarto.ign.fr/api/gpu/assiette-sup-s";
const TIMEOUT_MS = 8000;

export type HeritageStatus = {
  items: HeritageProtection[];
  // Une panne n'est JAMAIS une absence de servitude : le rendu doit pouvoir les distinguer.
  sourceStatus: "ok" | "unavailable";
};

export async function fetchHeritageProtections(
  latitude: number,
  longitude: number,
): Promise<HeritageStatus> {
  const geom = encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [longitude, latitude] }));
  try {
    const res = await fetch(`${GPU_SUP_URL}?geom=${geom}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { items: [], sourceStatus: "unavailable" };
    const json = (await res.json()) as { features?: RawSupFeature[] };
    return { items: buildHeritageProtections(json.features), sourceStatus: "ok" };
  } catch {
    return { items: [], sourceStatus: "unavailable" };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "gpu(-servitudes)?\.ts" || echo "OK: aucune erreur sur gpu*"`
Expected: `OK: aucune erreur sur gpu*`

- [ ] **Step 3: Verify it answers on a real address (le Marais, Paris)**

Run:
```bash
node --input-type=module -e '
const geom = encodeURIComponent(JSON.stringify({type:"Point",coordinates:[2.36,48.857]}));
const r = await fetch(`https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom=${geom}`);
const j = await r.json();
const fams = [...new Set((j.features||[]).map(f => String(f.properties?.idass||"").split("-")[0]))];
console.log("familles au point :", fams.sort().join(", "));
'
```
Expected: la sortie contient `AC1` (et probablement `AC4`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/gpu.ts
git commit -m "feat(logement): fetcher des protections patrimoniales (API Carto GPU)

Sans clé, timeout 8 s, un seul essai. Une panne rend sourceStatus 'unavailable',
jamais une liste vide : le rendu doit distinguer le silence de l'absence.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Contrat de données et route serveur

**Files:**
- Modify: `src/lib/logement-report-types.ts` (ajouter le champ `heritage` au type `LogementReport`)
- Modify: `src/app/api/georisques-logement/route.ts:45-53` (ajouter l'appel au `Promise.all` existant) et le littéral `report`

**Interfaces:**
- Consumes: `fetchHeritageProtections`, `HeritageStatus` (Task 2).
- Produces: `LogementReport.heritage?: HeritageStatus | null`, consommé par les Tasks 4 et 5.

- [ ] **Step 1: Étendre le contrat partagé**

Dans `src/lib/logement-report-types.ts`, ajouter l'import et le champ. Placer le champ **juste après** `georisques`, car c'est un statut réglementaire au point, de même nature.

```ts
import type { HeritageStatus } from "./gpu.ts";
```

Attention : `gpu.ts` est `server-only`. Importer seulement le TYPE (`import type`) ne tire aucun code côté client, exactement comme `pprn-zonage.ts` le fait déjà pour `RegulatoryPlan`. Si le build s'en plaint, déplacer `HeritageStatus` dans `gpu-servitudes.ts` (lib pure) et le ré-exporter depuis `gpu.ts`.

Puis, dans `export type LogementReport = {`, après le champ `georisques?: { ... }` :

```ts
  // Protections patrimoniales au point (AC1/AC2/AC4). Statut réglementaire, comme le PPRN :
  // re-fetché à chaque rendu, jamais snapshoté. `null` = non interrogé.
  heritage?: HeritageStatus | null;
```

- [ ] **Step 2: Appeler le GPU en parallèle des autres sources**

Dans `src/app/api/georisques-logement/route.ts`, ajouter l'import en tête de fichier :

```ts
import { fetchHeritageProtections } from "@/lib/gpu";
```

Puis, dans le `Promise.all` existant (celui qui commence par `const [georisquesCommune, altitude, zfe, irep, cartofriches, communeData, sinistralite] = await Promise.all([`), ajouter la source **à la fin du tableau** et de la destructuration :

```ts
    const [georisquesCommune, altitude, zfe, irep, cartofriches, communeData, sinistralite, heritage] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      getIrepNearPoint(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getCartofrichesForCommune(address.citycode).catch(() => null) : null,
      address.citycode ? getCommuneFullData(address.citycode).catch(() => null) : null,
      getOnrnSinistralite(address.citycode).catch(() => null),
      fetchHeritageProtections(address.latitude, address.longitude).catch(
        () => ({ items: [], sourceStatus: "unavailable" as const }),
      ),
    ]);
```

Le `.catch` est redondant avec le `try/catch` interne du fetcher. Il est là parce que tout appel de ce `Promise.all` en porte un : suivre le motif du fichier plutôt que faire l'exception.

- [ ] **Step 3: Poser le champ dans la réponse**

Toujours dans `route.ts`, dans le littéral `const report: LogementReport = {`, ajouter après le bloc `georisques: { ... },` :

```ts
      heritage,
```

- [ ] **Step 4: Vérifier la compilation et le lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/lib/gpu.ts src/lib/gpu-servitudes.ts src/app/api/georisques-logement/route.ts src/lib/logement-report-types.ts`
Expected: aucune sortie (succès).

- [ ] **Step 5: Commit**

```bash
git add src/lib/logement-report-types.ts src/app/api/georisques-logement/route.ts
git commit -m "feat(logement): remonte les protections patrimoniales dans le rapport

Appel GPU en parallèle des sources existantes (jamais en série : +641 ms sinon).
Champ heritage au contrat partagé, à côté de georisques : même nature, statut
réglementaire au point, re-fetché et jamais snapshoté.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Le point de checklist

**Files:**
- Modify: `src/lib/logement-checklist.ts` (type `ChecklistFacts`, type interne des règles, tableau `RULES`, `buildDecisionChecklist`)
- Modify: `src/lib/logement-checklist.test.ts`
- Modify: `src/components/report/LogementModule.tsx:384-390` (construction de `checklistFacts`)

**Interfaces:**
- Consumes: `LogementReport.heritage` (Task 3).
- Produces: `ChecklistFacts.perimetrePatrimonial: boolean`.

**Pourquoi une modification de structure.** Les règles portent un texte par bucket (`neutre`, `achat`, `reside`, `location`) et `active()` ne connaît pas le bucket. Pour n'afficher ce point qu'aux projets d'achat, de résidence et au cas neutre, il faut un champ `buckets` optionnel sur la règle. Aucune règle existante ne le porte : le défaut vaut « tous les buckets ».

- [ ] **Step 1: Write the failing test**

Ajouter à la fin de `src/lib/logement-checklist.test.ts` (adapter l'import si le fichier importe déjà `buildDecisionChecklist`) :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildDecisionChecklist, type ChecklistFacts } from "./logement-checklist.ts";

const AUCUN: ChecklistFacts = {
  dpe: "correct",
  confortEteInsuffisant: false,
  expositionBati: false,
  zoneReglementee: false,
  sinistraliteActive: false,
  perimetrePatrimonial: false,
};

test("patrimoine : un point pour un projet d'achat", () => {
  const items = buildDecisionChecklist({ ...AUCUN, perimetrePatrimonial: true }, "achat");
  assert.deepEqual(items.map((i) => i.id), ["patrimoine"]);
  assert.match(items[0].text, /mairie/);
});

test("patrimoine : aucun point pour une location", () => {
  const items = buildDecisionChecklist({ ...AUCUN, perimetrePatrimonial: true }, "location");
  assert.deepEqual(items, []);
});

test("patrimoine : un point en neutre et en résidence", () => {
  for (const projet of [null, "reside"]) {
    const items = buildDecisionChecklist({ ...AUCUN, perimetrePatrimonial: true }, projet);
    assert.deepEqual(items.map((i) => i.id), ["patrimoine"], `projet=${projet}`);
  }
});

test("patrimoine absent : aucun point", () => {
  assert.deepEqual(buildDecisionChecklist(AUCUN, "achat"), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-checklist.test.ts`
Expected: FAIL. Le compilateur signale que `perimetrePatrimonial` n'existe pas sur `ChecklistFacts`.

- [ ] **Step 3: Write minimal implementation**

Dans `src/lib/logement-checklist.ts` :

a) Ajouter le fait, à la fin du type `ChecklistFacts` :

```ts
  perimetrePatrimonial: boolean; // AC1/AC2/AC4 au point : l'avis de l'ABF entre en jeu
```

b) Ajouter le champ `buckets` au type interne des règles. Le type est déclaré juste au-dessus du tableau `RULES` ; ajouter la ligne :

```ts
  buckets?: Bucket[]; // par défaut : tous. Restreint l'item aux projets où le geste a un sens.
```

c) Ajouter la règle à la fin du tableau `RULES` :

```ts
  {
    id: "patrimoine",
    active: (f) => f.perimetrePatrimonial,
    // Un locataire ne fait pas ces travaux.
    buckets: ["neutre", "achat", "reside"],
    text: {
      neutre: "Se renseigner en mairie sur ce que le périmètre patrimonial autorise, avant tout projet de travaux extérieurs.",
      achat: "Si vous envisagez des travaux extérieurs, isolation, menuiseries ou toiture, faites vérifier en mairie ce que le périmètre patrimonial autorise, avant tout devis.",
      reside: "Avant d'engager des travaux extérieurs, faites vérifier en mairie ce que le périmètre patrimonial autorise : l'avis de l'Architecte des Bâtiments de France peut être requis.",
      location: "",
    },
  },
```

d) Remplacer `buildDecisionChecklist` par :

```ts
export function buildDecisionChecklist(facts: ChecklistFacts, projet: string | null): ChecklistItem[] {
  const b = projetBucket(projet);
  return RULES.filter((r) => r.active(facts))
    .filter((r) => r.buckets === undefined || r.buckets.includes(b))
    .map((r) => ({ id: r.id, text: r.text[b] }));
}
```

Les règles existantes ne portent pas `buckets` : le second `filter` les laisse toutes passer.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/lib/logement-checklist.test.ts`
Expected: PASS, y compris les tests préexistants (aucune règle ne porte `buckets`, donc aucune n'est filtrée).

- [ ] **Step 5: Alimenter le fait depuis le rapport**

Dans `src/components/report/LogementModule.tsx`, dans le littéral `const checklistFacts: ChecklistFacts = {`, ajouter la ligne :

```ts
    perimetrePatrimonial: (result.heritage?.items?.length ?? 0) > 0,
```

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit -p tsconfig.json && node --test src/lib/logement-checklist.test.ts`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 7: Commit**

```bash
git add src/lib/logement-checklist.ts src/lib/logement-checklist.test.ts src/components/report/LogementModule.tsx
git commit -m "feat(logement): point de checklist pour le périmètre patrimonial

La règle ne s'applique qu'aux buckets neutre/achat/reside : un locataire ne fait
pas de travaux extérieurs. Ajoute un champ 'buckets' optionnel aux règles, sans
toucher aux règles existantes (défaut = tous les buckets).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Le rendu en Face 2

**Files:**
- Modify: `src/components/report/logement/RegulatorySection.tsx`
- Modify: `src/components/report/LogementModule.tsx:583` (passer `heritage` au bloc)

**Interfaces:**
- Consumes: `LogementReport.heritage` (Task 3), `HeritageProtection` (Task 1).
- Produces: rien pour les tâches suivantes.

**Le piège à corriger.** `RegulatoryStatusBlock` affiche aujourd'hui « Aucune règle de construction particulière à cette adresse » quand `plans.length === 0`. Une adresse peut n'avoir aucun PPRN **et** être en périmètre patrimonial : l'écran affirmerait alors une absence que le bloc suivant contredit. L'état « aucune règle » ne doit s'afficher que si **les deux** sont vides.

- [ ] **Step 1: Passer `heritage` au composant**

Dans `src/components/report/LogementModule.tsx`, ligne 583, remplacer :

```tsx
            {result.georisques && <RegulatoryStatusBlock georisques={result.georisques} />}
```

par :

```tsx
            {result.georisques && (
              <RegulatoryStatusBlock georisques={result.georisques} heritage={result.heritage ?? null} />
            )}
```

- [ ] **Step 2: Étendre la signature et corriger l'état « aucune règle »**

Dans `src/components/report/logement/RegulatorySection.tsx`, ajouter l'import de type :

```ts
import type { HeritageStatus } from "@/lib/gpu";
```

Puis remplacer la signature et la garde de l'état A :

```tsx
export function RegulatoryStatusBlock({
  georisques,
  heritage,
}: {
  georisques: LogementReport["georisques"];
  heritage: HeritageStatus | null;
}) {
  const g = georisques?.parcel ?? georisques?.address;
  const plans = g?.regulatoryPlans ?? [];
  const protections = heritage?.items ?? [];
```

Puis, dans le JSX, remplacer la condition de l'état A :

```tsx
          ) : plans.length === 0 && protections.length === 0 ? (
```

(auparavant : `plans.length === 0`). Le texte de l'état A ne change pas.

Enfin, quand `plans.length === 0 && protections.length > 0`, la branche `else` s'exécute et rend `regulatoryHeadline(plans)` avec `plans = []`. Il faut donc **ne rendre le niveau 1 et les cartes de plan que s'il y a des plans**. Envelopper le contenu existant du `else` :

```tsx
          ) : (
            <>
              {plans.length > 0 && (
                <>
                  {/* Niveau 1 : comprendre en cinq secondes */}
                  <p style={{ fontSize: 15, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>{regulatoryHeadline(plans)}</p>
                  {/* Niveau 2 : le fait précis, par plan */}
                  {plans.length === 1 ? (
                    <RegulatoryPlanCard plan={plans[0]} />
                  ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                      <RegulatoryPlanCard plan={plans[0]} roleLabel="Règle la plus contraignante" />
                      {plans.slice(1).map((p, i) => (
                        <div key={i} style={{ paddingTop: 12, borderTop: "1px solid var(--border-1)" }}>
                          <RegulatoryPlanCard plan={p} roleLabel="Autre zonage applicable" />
                        </div>
                      ))}
                      <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                        Ces zonages peuvent concerner des phénomènes ou des règlements différents.
                      </div>
                    </div>
                  )}
                </>
              )}
              {protections.length > 0 && <HeritageBlock protections={protections} withDivider={plans.length > 0} />}
            </>
          )}
```

Le niveau 3 (`<Disclosure summary="Comprendre ce classement">`) reste **inchangé et hors** de la garde
`plans.length > 0` : il itère déjà sur `plans`, et rend un contenu vide si le tableau l'est. Le
vérifier à l'étape 4 plutôt que le déplacer.

- [ ] **Step 3: Écrire le sous-bloc patrimoine**

Toujours dans `RegulatorySection.tsx`, au-dessus de `RegulatoryStatusBlock` :

```tsx
// Patrimoine protégé au point. Les familles sont NOMMÉES chacune une fois ; la phrase de procédure
// est portée UNE SEULE fois pour le bloc, sans quoi deux familles produiraient deux fois le même
// paragraphe. Aucun compteur, aucun nom de monument : un point est dans autant d'assiettes qu'il y a
// de monuments autour (134 Place Stanislas). Copie arbitrée par le porteur, ne pas reformuler.
function HeritageBlock({
  protections,
  withDivider,
}: {
  protections: HeritageProtection[];
  withDivider: boolean;
}) {
  return (
    <div style={withDivider ? { paddingTop: 12, borderTop: "1px solid var(--border-1)" } : undefined}>
      <p style={{ fontSize: 12.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 8px" }}>
        Patrimoine protégé à cette adresse
      </p>
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-hi)", margin: "0 0 8px" }}>
        {protections.map((p) => p.label).join(" · ")}
      </p>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
        Cette adresse se situe dans un périmètre patrimonial. Certains travaux modifiant l’aspect
        extérieur du bâtiment peuvent nécessiter une autorisation et l’avis de l’Architecte des
        Bâtiments de France. À vérifier en mairie avant devis ou dépôt de dossier.
      </p>
      <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, marginTop: 8 }}>
        D’après les servitudes publiées au Géoportail de l’urbanisme.
      </p>
    </div>
  );
}
```

Ajouter l'import du type en tête du fichier :

```ts
import type { HeritageProtection } from "@/lib/gpu-servitudes";
```

- [ ] **Step 4: Vérifier la compilation et le lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/components/report/logement/RegulatorySection.tsx src/components/report/LogementModule.tsx`
Expected: aucune sortie.

- [ ] **Step 5: Vérifier dans le vrai rapport**

Lancer l'application (`npm run dev`), ouvrir `/rapport/logement`, analyser **une adresse du Marais à Paris** (par exemple `10 rue des Rosiers, Paris`). Le bloc « Statut réglementaire à cette adresse » doit afficher la section « Patrimoine protégé à cette adresse », avec un ou deux intitulés et **une seule** phrase de procédure.

Puis analyser une adresse rurale sans monument (par exemple à Bord-Saint-Georges, Creuse). Aucune section patrimoine ne doit apparaître, et le rapport ne doit **nulle part** affirmer qu'il n'y a pas de protection.

- [ ] **Step 6: Commit**

```bash
git add src/components/report/logement/RegulatorySection.tsx src/components/report/LogementModule.tsx
git commit -m "feat(logement): affiche « Patrimoine protégé à cette adresse » en Face 2

Sous-bloc du statut réglementaire : familles nommées une fois chacune, phrase de
procédure portée une seule fois. Aucun compteur, aucun nom de monument.

Corrige un état trompeur : « Aucune règle de construction particulière » ne
s'affiche plus quand une servitude patrimoniale existe sans PPRN.

Le silence n'est jamais une absence : rien ne s'affiche quand rien n'est trouvé,
et la source est mentionnée une fois.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Vérification de bout en bout et documentation

**Files:**
- Modify: `docs/vault/modules/logement.md` (section « État de mise en œuvre »)

- [ ] **Step 1: Rejouer toute la suite de tests du module**

Run:
```bash
node --test src/lib/gpu-servitudes.test.ts src/lib/logement-checklist.test.ts src/lib/pprn-zonage.test.ts src/lib/logement-autour.test.ts src/lib/logement-store.test.ts
```
Expected: `fail 0`.

- [ ] **Step 2: Vérifier la latence ajoutée**

Le GPU est appelé dans le `Promise.all`, donc son coût se fond dans le plus lent des appels parallèles. Vérifier qu'aucun appel n'a été mis en série : dans `route.ts`, `fetchHeritageProtections` doit apparaître **à l'intérieur** du tableau passé à `Promise.all`, jamais dans un `await` isolé.

Run: `grep -n "fetchHeritageProtections" src/app/api/georisques-logement/route.ts`
Expected: une seule occurrence, indentée à l'intérieur du `Promise.all`.

- [ ] **Step 3: Vérifier le comportement en panne**

Simuler une panne en coupant temporairement l'accès (ou en pointant `GPU_SUP_URL` vers un hôte injoignable dans une copie locale). Le rapport doit se rendre, sans section patrimoine, sans erreur visible, et `heritage.sourceStatus` doit valoir `"unavailable"`.

- [ ] **Step 4: Consigner dans le vault**

Dans `docs/vault/modules/logement.md`, section « État de mise en œuvre », sous Face 2, ajouter :

```markdown
- **Brique « Patrimoine protégé à cette adresse » BRANCHÉE (2026-07-09).** En Face 2, dans le bloc
  « Statut réglementaire à cette adresse », après les plans de prévention. Servitudes patrimoniales
  seules (`AC1` abords d'un monument historique, `AC4` site patrimonial remarquable, `AC2` site
  classé ou inscrit), depuis `apicarto.ign.fr/api/gpu/assiette-sup-s` (sans clé, ~641 ms, appelé en
  parallèle). Lib pure testée `src/lib/gpu-servitudes.ts` (dédoublonnage par famille : un point est
  dans autant d'assiettes qu'il y a de monuments autour, 134 Place Stanislas), fetcher
  `src/lib/gpu.ts`. **Le fait est binaire** : aucun compteur, aucun nom de monument. **Ne déduit
  jamais les travaux** : la procédure est énoncée, l'issue appartient à l'ABF. **Le silence n'est
  jamais une absence** : rien ne s'affiche quand rien n'est trouvé (le GPU n'expose aucun indicateur
  de publication des servitudes), et l'état « Aucune règle de construction particulière » ne
  s'affiche plus si une protection patrimoniale existe sans PPRN. Statut réglementaire, donc
  **re-fetché comme le PPRN, jamais snapshoté**. Un point de checklist s'ajoute pour les projets
  d'achat et de résidence. Mesure : 25 % des logements sont concernés (IC 19-31 %), 55 % en ville.
  Spec : `docs/superpowers/specs/2026-07-09-logement-patrimoine-abf-design.md`.
  **Version 1.1 décidée, non faite** : secteurs de sols pollués au point (SIS / SUP sols), même
  mécanique. Mesure : 0/120 adresses dans un secteur (IC 0-3 %), 15 % à moins de 500 m. Demande une
  nuance de la frontière Logement/Santé (le fait réglementaire à l'adresse vit en Face 2,
  l'exposition du corps vit en Santé, le second renvoie au premier sans le répéter).
```

- [ ] **Step 5: Commit**

```bash
git add docs/vault/modules/logement.md
git commit -m "vault(logement): grave la brique « Patrimoine protégé à cette adresse »

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review

**Couverture de la spec.** Périmètre AC1/AC2/AC4 (Task 1). Face 2, pas Face 3 (Task 5). Fait binaire, jamais énuméré (Task 1, test des 134 assiettes). Aucune déduction sur les travaux (Task 1, commentaire de tête ; Task 5, copie exacte). Silence pur, pas d'état « on ne sait pas » (Task 5, aucun rendu si vide). Panne observable (Task 2, `sourceStatus`). Re-fetché, jamais snapshoté (Task 3, aucun passage par `logement-store`). Point de checklist réservé à l'achat et à la résidence (Task 4). Phrase de procédure portée une seule fois (Task 5, `HeritageBlock`). Mention de source une fois (Task 5). Version 1.1 consignée (Task 6).

**Un écart assumé par rapport à la spec.** La spec ne mentionnait pas que l'état « Aucune règle de construction particulière » deviendrait faux en présence d'une protection patrimoniale sans PPRN. Ce défaut a été découvert en lisant `RegulatorySection.tsx` et il est corrigé en Task 5, étape 2. C'est un vrai bug d'honnêteté, pas un ajout de périmètre.

**Types.** `HeritageProtection` et `HeritageFamily` sont définis en Task 1 et utilisés tels quels en Tasks 2 et 5. `HeritageStatus` est défini en Task 2 et utilisé en Tasks 3 et 5. `ChecklistFacts.perimetrePatrimonial` est défini en Task 4 et alimenté dans la même tâche. `buildHeritageProtections` garde le même nom partout.

**Risque connu, traité en Task 3 étape 1.** `gpu.ts` porte `import "server-only"`. Si `logement-report-types.ts` (importé côté client) ne peut pas en tirer même un type, déplacer `HeritageStatus` dans `gpu-servitudes.ts`, qui est pur. Le plan le dit explicitement plutôt que de le découvrir à l'exécution.

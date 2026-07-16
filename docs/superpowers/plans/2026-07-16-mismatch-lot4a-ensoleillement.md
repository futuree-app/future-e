# Mismatch lot 4a — l'ensoleillement (relative_position) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Étendre la forme `relative_position` au critère `ensoleillement_recherche`, ajouter un hook `limitation` par critère (climatologie ERA5-Land de référence, pas une projection future), et corriger le bug de carte qui masquait les limitations des mismatchs.

**Architecture:** `ensoleillement_recherche` rejoint `MISMATCH_RANK_KEYS` (index) + `MISMATCH_KEYS` (règles) ; `mismatchRawScore` gagne un cas (`c.rayonnement_pct`). `MISMATCH_LABELS` gagne un type `MismatchLabel` avec `limitation?`, threadée sur le `MismatchFact`. `DossierDecisionSection` est corrigé pour rendre `limitation` sur le rôle `mismatch` (répare 2a/3a). L'index est re-enrichi avec un diff sémantique prouvant que les 11 bandes existantes ne bougent pas.

**Tech Stack:** TypeScript (ESM `.ts`), `node --test`, Next.js, index gzip.

## Global Constraints

- **Voix (mémoire)** : pas de tiret cadratin ; pas d'antithèse « c'est X, pas Y » ; comparatif, jamais un jugement absolu.
- **ERA5** : dire « réanalyse ERA5-Land, normale 1991-2020 », jamais « observé/réel » ni « variable stable ». La limitation porte la méthode + la période + « pas une projection future ».
- **Pas de nouveau `basis.kind`** : `relative_position` inchangé. **Pas de bump de `DECISION_NARRATIVE_PROMPT_VERSION`** (limitation card-only, la conclusion ne la reçoit pas).
- **`MISMATCH_DISTRIBUTION_VERSION` inchangée** (= millésime, pas schéma). `index.meta` enregistre la nouvelle clé.
- **Anti-divergence** : `mismatchRawScore("ensoleillement_recherche")` doit rendre exactement `subScore` = `c.rayonnement_pct ?? null`.
- **Migration mesurée** : les 11 bandes existantes STRICTEMENT identiques avant/après (diff sémantique, pas juste « déterministe »).
- Imports ESM `.ts` ; tests `node --test`. Pièges index : `npm run index:unpack` sur clone frais ; après enrichissement, `populate-mismatch-rank` → `index:pack` → committer le `.gz` (le hook pre-commit refuse sinon).

---

### Task 1 : `mismatchRawScore` + `MISMATCH_RANK_KEYS` (l'ordre canonique)

**Files:**
- Modify: `src/lib/comparateur-scores.ts` (MISMATCH_RANK_KEYS + cas mismatchRawScore)
- Test: `src/lib/comparateur-scores.test.ts` (le test itère déjà MISMATCH_RANK_KEYS ; ajouter rayonnement_pct au fixture peuplé si besoin)

**Interfaces:**
- Produces : `mismatchRawScore("ensoleillement_recherche", c) === c.rayonnement_pct ?? null` ; `"ensoleillement_recherche" ∈ MISMATCH_RANK_KEYS`.

- [ ] **Step 1 : Écrire/étendre le test (échoue)**

Dans `src/lib/comparateur-scores.test.ts`, ajouter un test ciblé :

```ts
test("ensoleillement_recherche : rayonnement_pct, null sans donnée (anti-divergence)", () => {
  const avec = { rayonnement_pct: 42 } as unknown as Parameters<typeof mismatchRawScore>[1];
  assert.equal(mismatchRawScore("ensoleillement_recherche", avec), 42);
  const sans = {} as unknown as Parameters<typeof mismatchRawScore>[1];
  assert.equal(mismatchRawScore("ensoleillement_recherche", sans), null);
  assert.ok(MISMATCH_RANK_KEYS.includes("ensoleillement_recherche"));
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run : `node --test src/lib/comparateur-scores.test.ts`
Expected : FAIL (clé absente de MISMATCH_RANK_KEYS / pas de cas).

- [ ] **Step 3 : Ajouter la clé et le cas**

Dans `src/lib/comparateur-scores.ts` :

1. Dans `MISMATCH_RANK_KEYS`, après `"acces_services",` :

```ts
  "ensoleillement_recherche", // lot 4a : percentile ERA5-Land uniforme, relative_position symétrique
```

2. Dans `mismatchRawScore`, ajouter un cas (à côté des autres, respectant la parité avec `subScore` qui rend `c.rayonnement_pct ?? null`) :

```ts
    case "ensoleillement_recherche":
      return c.rayonnement_pct ?? null;
```

- [ ] **Step 4 : Lancer (passe)**

Run : `node --test src/lib/comparateur-scores.test.ts`
Expected : PASS. (Si le test générique « finite pour une commune peuplée » échoue faute de `rayonnement_pct` dans son fixture, ajouter `rayonnement_pct: <n>` au fixture peuplé.)

- [ ] **Step 5 : Commit**

```bash
git add src/lib/comparateur-scores.ts src/lib/comparateur-scores.test.ts
git commit -m "feat(mismatch): mismatchRawScore gère ensoleillement_recherche (rayonnement_pct)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : `MISMATCH_LABELS` typé + hook `limitation` + `MISMATCH_KEYS` + gardes

**Files:**
- Modify: `src/lib/decision/mismatch-facts.ts` (type `MismatchLabel`, entrée ensoleillement, `satisfies`)
- Modify: `src/lib/decision/mismatch-rules.ts` (MISMATCH_KEYS + threading de la limitation)
- Test: `src/lib/decision/mismatch-rules.test.ts` (mismatch ensoleillement porte la limitation ; gardes)

**Interfaces:**
- Consumes : `MISMATCH_LABELS` (avec `limitation?`).
- Produces : `MismatchFact` d'ensoleillement avec `limitation` ; `"ensoleillement_recherche" ∈ MISMATCH_KEYS`.

- [ ] **Step 1 : Écrire le test (échoue)**

Dans `src/lib/decision/mismatch-rules.test.ts`, ajouter (adapter le helper `facts()`/`project()` existant du fichier ; les rankBands se passent via `rankBands: { ensoleillement_recherche: {...} }`) :

```ts
import { MISMATCH_KEYS } from "./mismatch-rules.ts";
import { MISMATCH_LABELS } from "./mismatch-facts.ts";
import { MISMATCH_RANK_KEYS } from "../comparateur-scores.ts";

test("ensoleillement : extrême défavorable + poids 3 -> mismatch structurant PORTANT la limitation ERA5", () => {
  const p = project([{ key: "ensoleillement_recherche", weight: 3 }]);
  const rule = MISMATCH_RULES.find((r) => r.id === "territoire.mismatch-ensoleillement_recherche")!;
  const f = rule.evaluate(facts({ rankBands: { ensoleillement_recherche: { low: 0.03, high: 0.12 } } }), p, undefined as never).facts[0]!;
  assert.equal(f.role, "mismatch");
  assert.equal((f as { basis: { kind: string } }).basis.kind, "relative_position");
  assert.match(f.limitation!, /réanalyse ERA5-Land, normale 1991-2020/);
  assert.match(f.limitation!, /ne constitue pas une projection/);
});

test("garde : MISMATCH_KEYS et MISMATCH_RANK_KEYS coïncident", () => {
  assert.deepEqual([...MISMATCH_KEYS].sort(), [...MISMATCH_RANK_KEYS].sort());
});

test("garde : chaque MISMATCH_KEY a une entrée MISMATCH_LABELS", () => {
  for (const k of MISMATCH_KEYS) assert.ok(MISMATCH_LABELS[k], `label manquant pour ${k}`);
});
```

> Vérifier la forme exacte de `rankBands` attendue par le helper `facts()` et par `relativeFact` (le code lit `f.rankBands?.[key]` avec `band.low`/`band.high`). Adapter la structure du fixture si le type diffère.

- [ ] **Step 2 : Lancer (échoue)**

Run : `node --test src/lib/decision/mismatch-rules.test.ts`
Expected : FAIL (clé/label/limitation absents).

- [ ] **Step 3 : Typer `MISMATCH_LABELS` + entrée ensoleillement**

Dans `src/lib/decision/mismatch-facts.ts`, remplacer la déclaration `export const MISMATCH_LABELS: Record<string, {...}> = { … };` par :

```ts
export type MismatchLabel = { topic: string; projectPhrase: string; indicator: string; limitation?: string };
export const MISMATCH_LABELS = {
  // … LES 11 ENTRÉES EXISTANTES, INCHANGÉES …
  ensoleillement_recherche: {
    topic: "l'ensoleillement",
    projectPhrase: "un territoire ensoleillé",
    indicator: "l'ensoleillement du territoire",
    limitation: "Cette position décrit la climatologie solaire de référence issue de la réanalyse ERA5-Land, normale 1991-2020. Elle ne constitue pas une projection de l'ensoleillement futur.",
  },
} satisfies Record<string, MismatchLabel>;
```

- [ ] **Step 4 : `MISMATCH_KEYS` + threading de la limitation**

Dans `src/lib/decision/mismatch-rules.ts` :

1. Dans `MISMATCH_KEYS`, après `"acces_services",` :

```ts
  "ensoleillement_recherche", // lot 4a : relative_position + limitation ERA5-Land (card-only)
```

2. Dans `makeMismatchRule`, sur l'objet `fact` (après `evidence: [ev],`), ajouter le threading optionnel :

```ts
        ...(lab.limitation ? { limitation: lab.limitation } : {}),
```

- [ ] **Step 5 : Lancer (passe)**

Run : `node --test src/lib/decision/mismatch-rules.test.ts`
Expected : PASS.

- [ ] **Step 6 : Typage**

Run : `npx tsc --noEmit`
Expected : 0 erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/decision/mismatch-facts.ts src/lib/decision/mismatch-rules.ts src/lib/decision/mismatch-rules.test.ts
git commit -m "feat(mismatch): ensoleillement_recherche en relative_position + hook limitation

MISMATCH_LABELS typé (satisfies), entrée ensoleillement avec limitation ERA5-Land ;
threadée sur le MismatchFact. Gardes: MISMATCH_KEYS==RANK_KEYS, labels exhaustifs.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : correctif de carte — rendre `limitation` sur les mismatchs (répare 2a/3a)

**Files:**
- Modify: `src/components/report/DossierDecisionSection.tsx:72`

**Interfaces:** aucune (couche de rendu).

Ce bug jetait les limitations de TOUS les mismatchs (2a `named_absence`, 3a `absolute_measure`, et désormais 4a). La conclusion ne reçoit pas la limitation (card-only, inchangé) : ce correctif est purement au rendu.

- [ ] **Step 1 : Corriger la condition**

Dans `src/components/report/DossierDecisionSection.tsx`, remplacer :

```ts
  const limitation = fact.role === "incompatibility" || fact.role === "verification" ? fact.limitation : undefined;
```

par :

```ts
  // `mismatch` porte aussi une `limitation` (named_absence, absolute_measure, ensoleillement) : elle était
  // silencieusement jetée. La conclusion ne la reçoit pas (card-only) ; la carte, si.
  const limitation =
    fact.role === "incompatibility" || fact.role === "verification" || fact.role === "mismatch"
      ? fact.limitation
      : undefined;
```

- [ ] **Step 2 : Vérifier le typage et le build**

Run : `npx tsc --noEmit`
Expected : 0 erreur (`fact.limitation` est valide pour `mismatch` : `MismatchFact.limitation?`).

Run : `npm run build`
Expected : exit 0.

- [ ] **Step 3 : Commit**

```bash
git add src/components/report/DossierDecisionSection.tsx
git commit -m "fix(dossier): la carte rend limitation pour les mismatchs (2a/3a/4a étaient jetés)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : enrichissement de l'index — diff sémantique + preuve percentile↔rang

**Files:**
- Modify: `scripts/populate-mismatch-rank.mts` (contrôle de non-régression + preuve percentile ↔ rang + meta)
- Modify (données) : `data/comparateur-index.json.gz` (re-packé)

**Interfaces:** aucune (script de build).

- [ ] **Step 1 : Ajouter les contrôles au script**

Dans `scripts/populate-mismatch-rank.mts`, AVANT la boucle `for (const key of MISMATCH_RANK_KEYS)`, capturer les bandes existantes :

```ts
const OLD_KEYS = MISMATCH_RANK_KEYS.filter((k) => communes.some((c) => c.rankBands?.[k]));
const oldBands = new Map<string, Map<string, string>>(); // key -> insee -> JSON([low,high])
for (const k of OLD_KEYS) {
  const m = new Map<string, string>();
  for (const c of communes) if (c.rankBands?.[k]) m.set(c.insee, JSON.stringify(c.rankBands[k]));
  oldBands.set(k, m);
}
```

DANS la boucle, pour la clé ensoleillement, accumuler l'écart percentile↔rang. Remplacer la ligne
`report.push(...)` par une version qui, pour `ensoleillement_recherche`, ajoute la preuve :

```ts
  let sunErrMax = 0;
  if (key === "ensoleillement_recherche") {
    for (const c of communes) {
      const v = mismatchRawScore(key, c);
      if (v == null) continue;
      const b = c.rankBands![key]!;
      const rankMid = (b[0] + b[1]) / 2 / 10000;
      sunErrMax = Math.max(sunErrMax, Math.abs(rankMid - v / 100));
    }
  }
  report.push(`${key.padEnd(26)} ${String(N).padStart(6)} valeurs · ex æquo max ${(tieMax * 100).toFixed(1)} %${key === "ensoleillement_recherche" ? ` · |rankMid - pct/100| max ${(sunErrMax * 100).toFixed(2)} pt` : ""}`);
```

APRÈS la boucle (avant l'écriture atomique), le contrôle de non-régression des 11 clés existantes :

```ts
let changed = 0;
for (const k of OLD_KEYS) {
  const m = oldBands.get(k)!;
  for (const c of communes) {
    if (JSON.stringify(c.rankBands?.[k]) !== m.get(c.insee)) changed++;
  }
}
if (changed > 0) die(`régression: ${changed} bandes de clés EXISTANTES ont changé (attendu 0)`);
report.push(`diff sémantique OK : 0 bande existante modifiée, seule ensoleillement_recherche ajoutée`);
```

- [ ] **Step 2 : S'assurer que l'index décompressé est présent**

Run : `test -f data/comparateur-index.json && echo present || npm run index:unpack`
Expected : `present` (ou décompression).

- [ ] **Step 3 : Lancer l'enrichissement**

Run : `node scripts/populate-mismatch-rank.mts`
Expected : le rapport liste les 12 clés, affiche pour ensoleillement un `|rankMid - pct/100| max` **faible** (quelques points au plus, dû à l'arrondi/ex æquo), et la ligne « diff sémantique OK : 0 bande existante modifiée ». Aucun REFUS.

> Si `changed > 0` : une formule d'une clé existante a bougé (ne devrait pas). Investiguer avant de continuer, ne pas re-packer.

- [ ] **Step 4 : Packer et vérifier**

Run : `npm run index:pack && npm run index:verify`
Expected : OK.

- [ ] **Step 5 : Commit (index)**

```bash
git add scripts/populate-mismatch-rank.mts data/comparateur-index.json.gz
git commit -m "chore(index): rankBand ensoleillement_recherche + diff sémantique (11 bandes inchangées)

Preuve percentile<->rang (|rankMid - pct/100| faible) ; 0 bande existante modifiée.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 : sonde ensoleillement (non bloquante), vérification finale, handoff

**Files:**
- Modify: `scripts/probe-conclusion.ts` (cas ensoleillement)
- Modify: `docs/handoff/CURRENT.md`

- [ ] **Step 1 : Ajouter le cas de sonde**

Dans `scripts/probe-conclusion.ts`, après `planSizeIsolation`, ajouter (réutilise le helper `mismatch(...)` existant qui produit un `relative_position`) :

```ts
const planSun = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [ mismatch("ensoleillement_recherche", "structuring", "l'ensoleillement") ],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});
```

Et dans la synthèse finale : `const gSun = await probe(planSun, "ensoleillement");` + l'intégrer au total `R`/`T`.

- [ ] **Step 2 : Lancer la sonde (contrôle visuel, ANTHROPIC_API_KEY)**

Run : `node --env-file=.env.local scripts/probe-conclusion.ts`
Expected : le cas « ensoleillement » nomme le critère au **présent comparatif** (« sur l'ensoleillement, X ressort moins favorable qu'ailleurs »), **jamais** de promesse future (« restera moins ensoleillée », « ensoleillement futur »). Non bloquant (prompt inchangé).

- [ ] **Step 3 : Suites complètes**

Run : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` → vert.
Run : `node --test scripts/lib/*.test.mjs scripts/*.test.mjs` → 22/22.
Run : `npx tsc --noEmit` → 0.
Run : `npm run build` → exit 0.

- [ ] **Step 4 : Handoff**

Réécrire `docs/handoff/CURRENT.md` : lot 4a (ensoleillement, relative_position) livré sur `feat/mismatch-lot4a-ensoleillement`, +1 couverture, hook limitation + **correctif carte (2a/3a réparés)**, index re-packé (diff sémantique 0 régression), pas de bump prompt. Reste : lot 4b (refonte canonique douceur_climat, migration mesurée, question monotone vs confort-cloche) ; `faible_secheresse` exclu documenté ; dettes poids-1/baseline ; fusion de deux mismatchs ; `ProjectFit × DecisionConfidence`.

- [ ] **Step 5 : Commit** handoff.

---

## Notes de couverture (auto-revue plan vs spec + revue porteur)

- **ERA5-Land réanalyse 1991-2020, pas de projection** : Task 2 (limitation).
- **Bug carte (limitation mismatch jetée, répare 2a/3a)** : Task 3.
- **Anti-divergence + gardes (KEYS==RANK_KEYS, labels)** : Task 1 (cas), Task 2 (gardes).
- **Preuve percentile ↔ rang** : Task 4 Step 1/3.
- **Diff sémantique 11 bandes identiques** : Task 4 Step 1/3.
- **MISMATCH_DISTRIBUTION_VERSION inchangée** : Task 1/2 ne la touchent pas (= millésime, vérifié). L'audit de la nouvelle clé passe par le **rapport du script** (`validCount`, ex æquo, écart percentile↔rang) : `populate-mismatch-rank.mts` n'écrit PAS de bloc `index.meta` aujourd'hui, et en ajouter un serait un nouveau motif hors périmètre 4a. Le `rankBands` lui-même est le registre (la clé EST le critère).
- **Card-only, pas de bump, sonde non bloquante** : Task 3 (rendu), Task 5 (sonde).
- **Hors périmètre** : douceur_climat (4b), faible_secheresse (exclu) — aucune tâche.

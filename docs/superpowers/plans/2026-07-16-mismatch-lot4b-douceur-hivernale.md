# Douceur hivernale (lot 4b) — refonte canonique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre `douceur_climat` d'un composite annuel opaque (cloche hivernale + été double-compté) en une douceur hivernale monotone (`pct.NORTMm_seas_DJF`), aligner tout l'éditorial partagé sur « Hivers doux », l'ajouter au dossier en `relative_position`, et mesurer l'impact produit avant de figer le seuil identitaire.

**Architecture:** Une lib pure `src/lib/climate/winter-mildness.ts` (convention + `winterMildnessScore`) devient la source unique, importée par le comparateur (`subScore`, `mismatchRawScore`) et le dossier. Le critère rejoint `MISMATCH_RANK_KEYS`/`MISMATCH_KEYS`/`MISMATCH_LABELS` (forme `relative_position`, comme l'ensoleillement). Un script d'impact mesure le score ET les résultats avant que le porteur ne fige le seuil identitaire. L'index gagne une `rankBand` (diff sémantique). Preview Vercel obligatoire.

**Tech Stack:** TypeScript (ESM `.ts`), `node --test`, Next.js, index gzip.

## Global Constraints

- **Voix (mémoire)** : pas de tiret cadratin ; pas d'antithèse « c'est X, pas Y » ; wording borné (« hivers relativement doux à l'échelle nationale », JAMAIS « climat agréable / confortable »).
- **Une seule définition canonique** : `douceur_climat` = `winterMildnessScore(pct.NORTMm_seas_DJF)` (monotone, historique 1976-2005). Zéro composante estivale (`NORTX35D` reste chez `faible_chaleur`). `WINTER_MILD` supprimée.
- **Convention dans la lib pure UNIQUE** `src/lib/climate/winter-mildness.ts` ; comparateur et dossier l'importent (aucune formule recopiée, aucun `server-only`).
- **Anti-divergence** : `mismatchRawScore` === `subScore` pour douceur.
- **Historique, pas de trajectoire dans le score.** Forme dossier `relative_position`, limitation card-only, **pas de bump prompt**.
- **Cas A** : aucun projet persistant à préserver (pré-lancement) — à graver dans le commit.
- **Seuil identitaire = gate** : figé UNIQUEMENT après le rapport d'impact + validation porteur, dans `WINTER_MILDNESS_CONVENTION.identityThreshold`.
- **Migration mesurée** : diff sémantique (12 bandes existantes inchangées) + rapport d'impact (score, résultats, taille) + **Preview Vercel réussi**.
- Pièges index : `npm run index:unpack` sur clone frais ; `populate-mismatch-rank` → `index:pack` → committer `.gz`.

---

### Task 1 : `winter-mildness.ts` — convention + score (lib pure)

**Files:**
- Create: `src/lib/climate/winter-mildness.ts`
- Test: `src/lib/climate/winter-mildness.test.ts`

**Interfaces:**
- Produces : `WINTER_MILDNESS_CONVENTION` (id, indicator, season, direction, scoring, referencePeriod, identityThreshold) ; `winterMildnessScore(pct: number | null | undefined): number | null`.

- [ ] **Step 1 : Écrire le test (échoue)**

Créer `src/lib/climate/winter-mildness.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { winterMildnessScore, WINTER_MILDNESS_CONVENTION } from "./winter-mildness.ts";

test("convention winter-mildness-v1 gravée (référence 1976-2005)", () => {
  assert.equal(WINTER_MILDNESS_CONVENTION.id, "winter-mildness-v1");
  assert.equal(WINTER_MILDNESS_CONVENTION.indicator, "NORTMm_seas_DJF");
  assert.equal(WINTER_MILDNESS_CONVENTION.referencePeriod, "1976-2005");
});

test("winterMildnessScore : monotone (retourne le percentile), gardes strictes, aucun repli", () => {
  assert.equal(winterMildnessScore(0), 0);
  assert.equal(winterMildnessScore(50), 50);
  assert.equal(winterMildnessScore(100), 100);
  assert.equal(winterMildnessScore(null), null);
  assert.equal(winterMildnessScore(undefined), null);
  assert.equal(winterMildnessScore(Number.NaN), null);
  assert.equal(winterMildnessScore(-1), null);
  assert.equal(winterMildnessScore(101), null);
});
```

- [ ] **Step 2 : Lancer (échoue)** — `node --test src/lib/climate/winter-mildness.test.ts` → FAIL (module absent).

- [ ] **Step 3 : Écrire la lib**

Créer `src/lib/climate/winter-mildness.ts` :

```ts
// LA DÉFINITION CANONIQUE de la douceur hivernale. PURE. Source unique (comparateur + dossier).
//
// douceur_climat mesure EXCLUSIVEMENT la douceur des hivers : position nationale de la température moyenne
// DJF (NORTMm_seas_DJF), normale de référence DRIAS 1976-2005. Monotone (plus chaud = plus doux). L'été est
// traité par faible_chaleur. Le pct est déjà orienté 0 = plus froid, 100 = plus doux (vérifié sur la donnée).
// PAS d'`identityThreshold` ici : une décision absente ne doit pas être représentée par une fausse valeur
// provisoire. Le champ est AJOUTÉ à cette convention par la Task 5, APRÈS le rapport d'impact + validation
// porteur (la gate). Tant qu'il n'existe pas, `doux` garde son ancien seuil (non expédié).
export const WINTER_MILDNESS_CONVENTION = {
  id: "winter-mildness-v1",
  indicator: "NORTMm_seas_DJF",
  season: "DJF",
  direction: "higher_is_milder",
  scoring: "national_percentile",
  referencePeriod: "1976-2005",
} as const;

// Trivial mais grave les GARDES, la DIRECTION, l'ABSENCE DE REPLI (jamais un 50), la convention partagée.
export function winterMildnessScore(percentile: number | null | undefined): number | null {
  if (percentile == null || !Number.isFinite(percentile) || percentile < 0 || percentile > 100) return null;
  return percentile;
}
```

- [ ] **Step 4 : Lancer (passe)** — `node --test src/lib/climate/winter-mildness.test.ts` → PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/climate/winter-mildness.ts src/lib/climate/winter-mildness.test.ts
git commit -m "feat(climate): winter-mildness (convention + score, source canonique douceur hivernale)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : refonte du score partagé (`subScore` + `mismatchRawScore`) + tests comportementaux

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (`subScore` case ~1222-1227 ; suppression `WINTER_MILD` ~395)
- Modify: `src/lib/comparateur-scores.ts` (`MISMATCH_RANK_KEYS` + cas `mismatchRawScore`)
- Test: `src/lib/comparateur-scores.test.ts` (dé-doublonnage, monotonie, null)

- [ ] **Step 1 : Écrire les tests comportementaux (échouent)**

Dans `src/lib/comparateur-scores.test.ts`, ajouter :

```ts
test("douceur_climat ne dépend plus de la chaleur estivale (dé-doublonnage)", () => {
  const a = { pct: { NORTMm_seas_DJF: 70, NORTX35D_yr: 0 } } as unknown as IndexCommune;
  const b = { pct: { NORTMm_seas_DJF: 70, NORTX35D_yr: 100 } } as unknown as IndexCommune;
  assert.equal(mismatchRawScore("douceur_climat", a), mismatchRawScore("douceur_climat", b));
  assert.equal(mismatchRawScore("douceur_climat", a), 70);
});

test("douceur_climat : monotone (percentile hivernal), null sans donnée", () => {
  assert.equal(mismatchRawScore("douceur_climat", { pct: { NORTMm_seas_DJF: 20 } } as unknown as IndexCommune), 20);
  assert.equal(mismatchRawScore("douceur_climat", { pct: { NORTMm_seas_DJF: 90 } } as unknown as IndexCommune), 90);
  assert.equal(mismatchRawScore("douceur_climat", { pct: {} } as unknown as IndexCommune), null);
  assert.ok(MISMATCH_RANK_KEYS.includes("douceur_climat"));
});
```

- [ ] **Step 2 : Lancer (échoue)** — `node --test src/lib/comparateur-scores.test.ts` → FAIL.

- [ ] **Step 3 : Refondre `mismatchRawScore` + `MISMATCH_RANK_KEYS`**

Dans `src/lib/comparateur-scores.ts` :
1. Import : `import { winterMildnessScore } from "./climate/winter-mildness.ts";`
2. `MISMATCH_RANK_KEYS`, après `"ensoleillement_recherche",` : `"douceur_climat", // lot 4b : douceur hivernale monotone`
3. Cas `mismatchRawScore` (avant `default`) :

```ts
    case "douceur_climat":
      // COPIE FIDÈLE de subScore("douceur_climat") : douceur hivernale = position DJF, monotone (lot 4b).
      return winterMildnessScore(c.pct?.NORTMm_seas_DJF);
```

- [ ] **Step 4 : Refondre `subScore` + supprimer `WINTER_MILD`**

Dans `src/lib/comparateur-vie.ts` :
1. Import : `import { winterMildnessScore } from "./climate/winter-mildness.ts";`
2. Remplacer le cas (~1222-1227) :

```ts
    case "douceur_climat": {
      const w = lerp(WINTER_MILD, c.clim.NORTMm_seas_DJF);
      if (w == null) return null;
      const s = c.pct.NORTX35D_yr == null ? 50 : 100 - c.pct.NORTX35D_yr;
      return Math.round(0.6 * w + 0.4 * s);
    }
```

par :

```ts
    case "douceur_climat":
      // Douceur HIVERNALE seule (lot 4b) : position nationale de la T° moyenne DJF (1976-2005), monotone.
      // L'été (NORTX35D) est traité par faible_chaleur ; il n'entre plus ici (fin du double comptage).
      return winterMildnessScore(c.pct?.NORTMm_seas_DJF);
```

3. Supprimer la constante `WINTER_MILD` (~395) — elle n'a plus aucun consommateur (vérifier `grep -n WINTER_MILD src/lib/comparateur-vie.ts` = 0 après).

- [ ] **Step 5 : Lancer les tests + typage**

Run : `node --test src/lib/comparateur-scores.test.ts` → PASS (dé-doublonnage + monotonie + anti-divergence générique).
Run : `npx tsc --noEmit` → 0 (si `WINTER_MILD`/`lerp` deviennent inutilisés ailleurs, nettoyer l'import/const).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-scores.ts src/lib/comparateur-scores.test.ts
git commit -m "feat(climate): douceur_climat = douceur hivernale monotone (pct DJF), fin du double comptage été

subScore + mismatchRawScore délèguent à winterMildnessScore. WINTER_MILD supprimée.
Tests comportementaux: indépendance à NORTX35D, monotonie, null->null.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : le dossier — `relative_position` sur douceur_climat

**Files:**
- Modify: `src/lib/decision/mismatch-rules.ts` (MISMATCH_KEYS)
- Modify: `src/lib/decision/mismatch-facts.ts` (MISMATCH_LABELS.douceur_climat)
- Test: `src/lib/decision/mismatch-rules.test.ts`

- [ ] **Step 1 : Écrire le test (échoue)**

Dans `src/lib/decision/mismatch-rules.test.ts` : mettre à jour le compte (« produit 13 règles ») et ajouter :

```ts
test("douceur_climat : hiver froid + poids 3 -> mismatch relative_position, limitation hivernale 1976-2005", () => {
  const p = project([{ key: "douceur_climat", weight: 3 }]);
  const f = evalRule("douceur_climat", facts({ douceur_climat: { low: 0.03, high: 0.12 } }), p).facts[0]!;
  assert.equal((f as { basis: { kind: string } }).basis.kind, "relative_position");
  assert.match(f.limitation!, /1976-2005/);
  assert.match(f.limitation!, /décembre à février|hivernale/);
  assert.doesNotMatch(f.limitation!, /agréable/);
  assert.match(f.topic, /hivers/);
});
```

- [ ] **Step 2 : Lancer (échoue)** — `node --test src/lib/decision/mismatch-rules.test.ts` → FAIL.

- [ ] **Step 3 : Ajouter le label + la clé**

Dans `src/lib/decision/mismatch-facts.ts`, dans `MISMATCH_LABELS` (après ensoleillement) :

```ts
  douceur_climat: {
    topic: "la douceur des hivers",
    projectPhrase: "des hivers doux",
    indicator: "la douceur des hivers",
    limitation: "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.",
  },
```

Dans `src/lib/decision/mismatch-rules.ts`, dans `MISMATCH_KEYS`, après `"ensoleillement_recherche",` :

```ts
  "douceur_climat", // lot 4b : douceur hivernale (relative_position + limitation)
```

- [ ] **Step 4 : Lancer (passe) + typage** — `node --test src/lib/decision/mismatch-rules.test.ts` → PASS ; `npx tsc --noEmit` → 0. Les gardes (`MISMATCH_KEYS === MISMATCH_RANK_KEYS`, labels exhaustifs) restent vertes.

- [ ] **Step 5 : E2E décisionnel (chaîne complète, comme 3a/3b)**

Créer `src/lib/decision/winter-mildness-e2e.test.ts` (patron `coast-e2e.test.ts` : `entry`/`project`/`context`/
`dossierFor`, mais injecter le rang via `rankBands`). L'`entry` doit porter `clim`/`pct` pour que
`mapCommuneToModuleFacts` construise les `rankBands` — plus simple : passer `rankBands` directement dans l'entry
si le mapping les lit, sinon injecter via un `mapCommuneToModuleFacts(entry, ...)` où l'entry a
`rankBands: { douceur_climat: [low*1e4, high*1e4] }`. Trois cas :

```ts
test("E2E hiver parmi les moins doux (rang bas), poids 3 -> carte relative_position, arbitrage, limitation 1976-2005", () => {
  const d = dossierFor(entry({ rankBands: { douceur_climat: [300, 1200] } }), project([{ key: "douceur_climat", weight: 3 }]));
  const sec = d.sections.find((s) => s.key === "mismatches");
  const f = (sec?.facts ?? []).find((x) => (x as { basis?: { kind: string } }).basis?.kind === "relative_position" && x.projectKey === "douceur_climat");
  assert.ok(f, "carte douceur attendue");
  assert.match(f!.limitation!, /1976-2005/);
  assert.equal(d.criteria.orientation, "arbitration");
});
test("E2E hiver parmi les plus doux (rang haut), poids 3 -> satisfied favorable, aucune carte", () => {
  const d = dossierFor(entry({ rankBands: { douceur_climat: [8800, 9700] } }), project([{ key: "douceur_climat", weight: 3 }]));
  const crit = d.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  assert.equal(crit?.outcome, "favorable");
  assert.equal(d.criteria.orientation, "favorable");
});
test("E2E rang absent -> uncertain, aucune carte", () => {
  const d = dossierFor(entry({ rankBands: {} }), project([{ key: "douceur_climat", weight: 3 }]));
  const crit = d.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  assert.notEqual(crit?.coverage, "examined");
});
```

> Vérifier la forme exacte que `mapCommuneToModuleFacts` attend pour `rankBands` (index `[low, high]` en points de base → `{low, high}` fractions) et adapter l'entry/injection. Lancer : `node --test src/lib/decision/winter-mildness-e2e.test.ts` → PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/decision/mismatch-facts.ts src/lib/decision/mismatch-rules.ts src/lib/decision/mismatch-rules.test.ts src/lib/decision/winter-mildness-e2e.test.ts
git commit -m "feat(mismatch): douceur_climat en relative_position (limitation hivernale 1976-2005) + E2E

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : l'éditorial partagé (audit exhaustif) + le parser

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (critère ~1363, aide faible_chaleur ~1362, identité ~1027/~2014/~2074)
- Modify: `src/lib/comparateur-labels.ts` (~14, ~54)
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` (~30)
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (~189, ~238)

> **Note :** le seuil `doux` (~1004) N'EST PAS touché ici — il attend la gate (Task 5). Cette tâche ne modifie que le vocabulaire.

- [ ] **Step 1 : Réécrire le critère (comparateur-vie ~1363)**

Remplacer l'entrée de dimension `douceur` :

```ts
  { id: "douceur", label: "Douceur à l'année", themeId: "climat", key: "douceur_climat", paliers: ["Climat doux", "Climat contrasté", "Hivers rigoureux"], gp: "la douceur du climat", forte: "la douceur de son climat", aide: "La douceur d'ensemble sur l'année : hivers tempérés autant qu'étés sans excès. Les étés seuls sont notés à part.", risque: false, directionnel: true },
```

par :

```ts
  { id: "douceur", label: "Hivers doux", themeId: "climat", key: "douceur_climat", paliers: ["Hivers parmi les plus doux", "Situation intermédiaire", "Hivers parmi les moins doux"], gp: "la douceur des hivers", forte: "la douceur de ses hivers", aide: "La douceur des hivers (température moyenne de décembre à février), à l'échelle nationale. Les étés sont notés à part (Étés frais).", risque: false, directionnel: true },
```

- [ ] **Step 2 : Réécrire l'aide de `faible_chaleur` (comparateur-vie ~1362)**

Dans l'entrée `etes_frais`, l'aide « Spécifiquement les étés… La douceur d'ensemble (hivers et étés) est notée
à part. » → **« Spécifiquement les étés : l'exposition aux fortes chaleurs, actuelle et future. Les hivers sont
notés à part (Hivers doux). »** (« supportable » est un jugement subjectif — on décrit l'exposition, on ne juge
pas ; le concept « douceur d'ensemble » disparaît).

- [ ] **Step 3 : Textes d'identité (comparateur-vie ~1027, ~2014, ~2074)**

- ~1027 : `push("Pour un climat doux une bonne partie de l'année.")` → `push("Pour des hivers parmi les plus doux du pays.")`
- ~2014 : `douceur_climat: "climat doux, hivers tempérés",` → `douceur_climat: "hivers parmi les plus doux",`
- ~2074 : `douceur_climat: "hivers rudes ou étés marqués",` → `douceur_climat: "hivers parmi les moins doux",`

- [ ] **Step 4 : `comparateur-labels.ts` (~14, ~54)**

- ~14 : `douceur_climat: "un climat doux",` → `douceur_climat: "des hivers doux",`
- ~54 : `douceur_climat: "Hivers tempérés, étés sans excès.",` → `douceur_climat: "Hivers relativement doux à l'échelle nationale.",`

- [ ] **Step 5 : `synthesize/route.ts` (~30)**

`douceur_climat: "un climat doux",` → `douceur_climat: "des hivers doux",`

- [ ] **Step 6 : Le parser (`parse/route.ts` ~189, ~238)**

- ~189 : remplacer « "rechercher la douceur" (douceur_climat, hivers tempérés) … "climat doux" et "agréable" relèvent de douceur_climat, pas de faible_chaleur. » par : « "rechercher la douceur des hivers" (douceur_climat = température moyenne hivernale). Une douceur ANNUELLE ("climat doux et agréable toute l'année") se traduit par DEUX préférences : douceur_climat (hivers) + faible_chaleur (étés). »
- ~238 : `- douceur_climat : hivers tempérés, climat doux et agréable` → `- douceur_climat : hivers doux (température moyenne de décembre à février) ; une douceur annuelle ajoute aussi faible_chaleur`

- [ ] **Step 7 : Audit exhaustif (deux passes) + typage + build**

Passe 1 (formulations annuelles) : `rg -n "Douceur à l'année|climat doux et agréable|étés sans excès|douceur d'ensemble|hivers tempérés autant|WINTER_MILD"` → plus AUCUN résultat de CODE (hors specs/handoff/docs historiques).

Passe 2 (toute occurrence de la clé/concept, pour ne rien rater) : `rg -n "douceur_climat|Douceur|climat doux|hiver" src docs scripts` → examiner chaque hit : wizard, prompts extraction/synthèse, exemples de projets/seeds, SEO/métadonnées, fixtures/snapshots, analytics affichant un nom de critère. **NB vérifié : le projet n'a PAS d'i18n (aucune traduction EN/ES à migrer).**

Run : `npx tsc --noEmit` → 0 ; `npm run build` → exit 0.

- [ ] **Step 8 : Sonde du parser (le prompt d'extraction change VRAIMENT ; le texte seul ne prouve rien)**

Le parser n'a ni version ni cache (vérifié) : le changement prend effet direct. Mais modifier l'instruction ne
prouve pas que le modèle l'applique. Sonde manuelle (API) — écrire/étendre un petit script qui envoie ces
formulations à la logique de parse et vérifie le mapping (contrôle VISUEL) :

| Formulation | Attendu |
|---|---|
| « Je veux des hivers doux » | `douceur_climat` (sans `faible_chaleur`) |
| « Je veux éviter les étés très chauds » | `faible_chaleur` (sans douceur) |
| « Je veux un climat doux et agréable toute l'année » | `douceur_climat` **+** `faible_chaleur` |
| « Je supporte la chaleur mais pas le froid » | `douceur_climat`, PAS `faible_chaleur` |
| « Je veux du soleil » | `ensoleillement_recherche`, PAS de douceur automatique |

Vérifier aussi les poids et l'absence d'association indue avec `ensoleillement_recherche`. **Bloquant** : le cas
« climat doux toute l'année → deux critères » doit passer (c'est le cœur de la migration parser).

- [ ] **Step 9 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts src/app/api/comparateur-vie/synthesize/route.ts src/app/api/comparateur-vie/parse/route.ts
git commit -m "refactor(climate): éditorial douceur = hivers seuls (critère, labels, synthèse, parser)

Critère 'Douceur à l'année' -> 'Hivers doux', paliers relatifs. Parser: douceur annuelle
-> douceur_climat + faible_chaleur. Le concept 'douceur d'ensemble' disparaît.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5 : rapport d'impact → GATE seuil (validation porteur) → recâblage `doux`

**Files:**
- Create: `scripts/analysis/douceur-impact.mts`
- Modify: `src/lib/climate/winter-mildness.ts` (`identityThreshold` figé)
- Modify: `src/lib/comparateur-vie.ts` (`doux` ~1004 lit la convention)
- Modify: `src/lib/climate/winter-mildness.test.ts` (fige le seuil retenu)

- [ ] **Step 1 : Écrire le script d'impact (self-contained, lit l'index)**

Créer `scripts/analysis/douceur-impact.mts`. Il reimplémente les DEUX formules depuis les champs de l'index (indépendant de l'état du code) et rapporte le score-level (§7A) + la lisibilité de l'arbitrage (§7B partiel) + la taille (§7C) :

```ts
import fs from "node:fs/promises";
import zlib from "node:zlib";
const idx = JSON.parse(zlib.gunzipSync(await fs.readFile("data/comparateur-index.json.gz")).toString());
const WINTER_MILD: [number, number][] = [[-3,5],[1,30],[4,60],[7,88],[9,100],[12,95],[16,80]];
const lerp = (a: [number,number][], x: number|null|undefined): number|null => {
  if (x == null) return null;
  if (x <= a[0][0]) return a[0][1];
  for (let i=1;i<a.length;i++) if (x <= a[i][0]) { const [x0,y0]=a[i-1],[x1,y1]=a[i]; return y0+(y1-y0)*(x-x0)/(x1-x0); }
  return a[a.length-1][1];
};
const oldScore = (c: any): number|null => {
  const w = lerp(WINTER_MILD, c.clim?.NORTMm_seas_DJF); if (w==null) return null;
  const s = c.pct?.NORTX35D_yr==null ? 50 : 100 - c.pct.NORTX35D_yr;
  return Math.round(0.6*w + 0.4*s);
};
const newScore = (c: any): number|null => c.pct?.NORTMm_seas_DJF ?? null;
const rows = idx.communes.map((c:any)=>({insee:c.insee,nom:c.nom,region:c.region,djf:c.clim?.NORTMm_seas_DJF,old:oldScore(c),neo:newScore(c),chaleur:c.pct?.NORTX35D_yr})).filter((r:any)=>r.old!=null&&r.neo!=null);
// A. corrélation + plus gros mouvements
const mean=(xs:number[])=>xs.reduce((a,b)=>a+b,0)/xs.length;
const mo=mean(rows.map((r:any)=>r.old)),mn=mean(rows.map((r:any)=>r.neo));
const cov=mean(rows.map((r:any)=>(r.old-mo)*(r.neo-mn))), so=Math.sqrt(mean(rows.map((r:any)=>(r.old-mo)**2))), sn=Math.sqrt(mean(rows.map((r:any)=>(r.neo-mn)**2)));
console.log("corrélation old<->new :", (cov/(so*sn)).toFixed(3));
const movers=[...rows].sort((a:any,b:any)=>Math.abs(b.neo-b.old)-Math.abs(a.neo-a.old)).slice(0,10);
console.log("\n10 plus gros mouvements :"); for(const r of movers) console.log(`  ${r.nom} (${r.region}) DJF ${r.djf}°C : ${r.old} -> ${r.neo} (${r.neo-r.old>0?"+":""}${r.neo-r.old})`);
// A. label par seuil (gate §6.1)
console.log("\nlabel « doux » par seuil (part des communes) :");
for(const t of [65,70,75,80,85]) console.log(`  seuil ${t} : ${(100*rows.filter((r:any)=>r.neo>=t).length/rows.length).toFixed(1)} %`);
// Défensif : afficher les valeurs region réelles (noms complets confirmés : "Corse", "Occitanie"…).
console.log("\nvaleurs region présentes :", [...new Set(rows.map((r:any)=>r.region))].sort());
// A. communes emblématiques par INSEE (les noms varient/accentuent ; l'INSEE est stable)
const EMBL: Record<string,string> = { Nice:"06088", Ajaccio:"2A004", Bastia:"2B033", Brest:"29019", "Chamonix":"74056", Strasbourg:"67482", "La Rochelle":"17300" };
console.log("\ncommunes emblématiques (old -> new douceur, chaleur pct) :");
for(const [label,insee] of Object.entries(EMBL)){const r=rows.find((x:any)=>x.insee===insee); if(r) console.log(`  ${label} DJF ${r.djf}°C : douceur ${r.old} -> ${r.neo} · chaleur(NORTX35D pct) ${r.chaleur}`); else console.log(`  ${label} (${insee}) ABSENT`);}
// B. lisibilité de l'arbitrage (Méditerranée : douceur HAUTE + chaleur HAUTE, deux signaux séparés)
console.log("\narbitrage désormais lisible (Méditerranée : hivers doux ET étés exposés) :");
const med=rows.filter((r:any)=>["Provence-Alpes-Côte d'Azur","Corse","Occitanie"].includes(r.region)&&r.neo>=80&&r.chaleur>=80).slice(0,5);
for(const r of med) console.log(`  ${r.nom} : douceur ${r.neo} (haute) · chaleur ${r.chaleur} (haute) -> arbitrage visible`);
// C. taille
console.log("\nindex gzip actuel :", ((await fs.stat("data/comparateur-index.json.gz")).size/1048576).toFixed(2), "Mo");
```

- [ ] **Step 2 : Lancer le script + produire le rapport**

Run : `node scripts/analysis/douceur-impact.mts`
Attendu : corrélation positive mais < 1 (la cloche + l'été déformaient), la Méditerranée (Nice/Bastia/Ajaccio) MONTE en douceur, la montagne (Chamonix) reste basse, le seuil affiche une part croissante décroissante par palier, et l'arbitrage Méditerranée (douceur haute + chaleur haute) devient lisible. Conserver la sortie dans le handoff.

- [ ] **Step 3 : CHECKPOINT — validation porteur du seuil identitaire**

Présenter au porteur le tableau par seuil (65/70/75/80/85) : part de communes, communes emblématiques incluses/exclues, cohérence avec « Hivers doux ». **Attendre qu'il fige UN seuil.** Ne pas continuer sans.

- [ ] **Step 4 : `impact-B` faithful — baseline vs migration sur le MÊME code/données (revue porteur)**

**Ne PAS comparer prod ↔ local** (ça mélangerait douceur avec d'autres diffs de code/index/prompts). On fait
varier UNIQUEMENT la fonction de score, même moteur, même index, mêmes payloads :

1. Sur la branche, `git stash` (les changements de score sont remisés) OU `git checkout <commit AVANT Task 2>`
   dans un second worktree → **baseline** (ancienne douceur). `npm run dev`, lancer les 3 profils via
   `/api/comparateur-vie/match`, sauver top-10/top-3.
2. Restaurer la migration (`git stash pop` / worktree de la branche) → **migration** (nouvelle douceur).
   Relancer les MÊMES 3 payloads. Comparer.

Profils : (1) `douceur_climat` poids 3 seul ; (2) poids 2 + 2-3 autres priorités ; (3) **`douceur_climat`
poids 3 + `faible_chaleur` poids 3 — BLOQUANT** : l'arbitrage hivers doux / étés exposés doit apparaître, la
Méditerranée ne doit plus être artificiellement favorisée par le double-avantage. Consigner les écarts
(top-10 stable ?, entrées/sorties du top-3, amplitude) dans le handoff. Les profils 1-2 sont documentés ;
le profil 3 est **la preuve produit du lot**, non facultatif.

- [ ] **Step 5 : AJOUTER le seuil validé + recâbler `doux` (sans `?? 0`)**

Dans `src/lib/climate/winter-mildness.ts`, **ajouter** le champ à la convention (il n'existait pas avant la
gate) : `identityThreshold: <SEUIL VALIDÉ>,`.
Dans `src/lib/comparateur-vie.ts` (~1004), remplacer `const doux = (subScore("douceur_climat", c) ?? 0) >= 65;`
par une condition **explicite** (pas de repli `?? 0`, qui est le patron que les chantiers ont supprimé — une
donnée absente ne doit pas devenir un score 0) :

```ts
const douceurScore = subScore("douceur_climat", c);
const doux = douceurScore != null && douceurScore >= WINTER_MILDNESS_CONVENTION.identityThreshold;
```

(importer `WINTER_MILDNESS_CONVENTION` en haut de `comparateur-vie.ts`.)
Dans `src/lib/climate/winter-mildness.test.ts`, ajouter un test qui fige la valeur retenue (remplacer par le
seuil validé à la gate) :

```ts
test("identityThreshold figé après la gate d'impact", () => {
  assert.equal(WINTER_MILDNESS_CONVENTION.identityThreshold, /* SEUIL VALIDÉ à la Step 3 */);
});
```

- [ ] **Step 6 : Typage + commit**

Run : `npx tsc --noEmit` → 0.

```bash
git add scripts/analysis/douceur-impact.mts src/lib/climate/winter-mildness.ts src/lib/climate/winter-mildness.test.ts src/lib/comparateur-vie.ts
git commit -m "feat(climate): seuil identitaire douceur figé après rapport d'impact (gate)

Script d'impact (corrélation, mouvements, seuils, Méditerranée ↑, arbitrage lisible).
doux lit WINTER_MILDNESS_CONVENTION.identityThreshold.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6 : index re-enrichi (rankBand douceur + diff sémantique + preuve percentile↔rang)

**Files:**
- Modify: `scripts/populate-mismatch-rank.mts` (généraliser la preuve percentile↔rang aux clés percentile)
- Modify (données) : `data/comparateur-index.json.gz`

- [ ] **Step 1 : Généraliser la preuve percentile↔rang, AVEC des seuils d'échec durs (revue porteur)**

Dans `scripts/populate-mismatch-rank.mts`, généraliser la preuve `|rankMid - v/100|` aux clés dont le
`mismatchRawScore` est déjà un percentile 0-100 : `["ensoleillement_recherche", "douceur_climat"].includes(key)`.
« Faible » n'est pas testable → transformer en **gate qui REFUSE** (comme le reste du script). Pour ces clés,
calculer `errMax`, `errP95`, la plus grosse masse d'ex æquo, et **refuser** au-delà de bornes documentées :

```ts
if (["ensoleillement_recherche","douceur_climat"].includes(key)) {
  if (N !== communes.length) die(`${key}: validCount ${N} != ${communes.length}`);
  if (errMax > 0.02) die(`${key}: |rankMid - pct/100| max ${errMax.toFixed(4)} > 0.02 (rang ≠ percentile source)`);
  // (0.02 calibré sur la quantification 0-100 : ex æquo ~1,3 % => erreur bornée ~0,0065 ; marge x3.)
}
report.push(`${key.padEnd(26)} … · errMax ${(errMax*100).toFixed(2)} pt · errP95 ${(errP95*100).toFixed(2)} pt · ex æquo max ${(tieMax*100).toFixed(1)} %`);
```

Le seuil `0.02` est un point de départ : si le run réel le dépasse, INVESTIGUER (pas relâcher aveuglément). Le
diff sémantique (12 bandes existantes inchangées) est déjà en place ; il vérifie que seule `douceur_climat`
s'ajoute. Ne PAS figer « ~1,3 % » comme attendu avant la mesure : le rapport l'affiche, le run le confirme.

- [ ] **Step 2 : Enrichir + vérifier**

Run : `test -f data/comparateur-index.json && echo present || npm run index:unpack`
Run : `node scripts/populate-mismatch-rank.mts`
Attendu : rapport avec `douceur_climat` (ex æquo max ~1,3 %, `|rankMid - pct/100|` faible), et « diff sémantique OK : 0 bande existante modifiée » (12 clés). Aucun REFUS.
Run : `npm run index:pack && npm run index:verify` → OK.

- [ ] **Step 3 : Commit (index)**

```bash
git add scripts/populate-mismatch-rank.mts data/comparateur-index.json.gz
git commit -m "chore(index): rankBand douceur_climat + preuve percentile<->rang (diff sémantique 0 régression)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7 : vérification finale, Preview Vercel, handoff

**Files:**
- Modify: `docs/handoff/CURRENT.md`

- [ ] **Step 1 : Suites complètes**

Run : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts src/lib/climate/*.test.ts` → vert.
Run : `node --test scripts/lib/*.test.mjs scripts/*.test.mjs` → 22/22.
Run : `npx tsc --noEmit` → 0 ; `npm run build` → exit 0.

- [ ] **Step 2 : Preview Vercel — BLOQUANT (la taille de fonction est un vrai risque, cf. lot 4a)**

Pousser la branche → **Preview** Vercel automatique. Le mécanisme Large Functions est porté par
`vercel.json` (`build.env: VERCEL_SUPPORT_LARGE_FUNCTIONS=1`, déjà committé au lot précédent) — vérifier qu'il
est présent sur la branche, pas se fier à une variable de dashboard. Checklist concrète, tout doit être vrai :

```
[ ] Preview déployé (état Ready)
[ ] fonction /rapport effectivement créée (pas d'erreur de taille au « Deploying outputs »)
[ ] JSON clair (comparateur-index.json, 86 Mo) ABSENT du bundle (gitignoré → jamais tracé)
[ ] gzip présent une seule fois dans la fonction
[ ] gzip index avant/après consigné (delta douceur ~+1 Mo attendu)
[ ] taille fonction /rapport avant/après (via VERCEL_ANALYZE_BUILD_OUTPUT=1 si besoin)
```

**Ne pas merger tant que le Preview n'est pas vert.**

- [ ] **Step 3 : Handoff**

Réécrire `docs/handoff/CURRENT.md` : lot 4b livré (douceur hivernale monotone, forme relative_position, éditorial transverse aligné, parser douceur→douceur+chaleur, seuil identitaire figé à <valeur> via gate, Cas A projets, index re-packé, Preview Vercel vert). **Couverture 27/28** (dernier critère couvrable ; `faible_secheresse` exclu documenté). Reste : fusion de deux mismatchs, `ProjectFit × DecisionConfidence`, dettes poids-1/baseline, régime fonction `/rapport`, mémoire `/memory`.

- [ ] **Step 4 : Commit** handoff.

---

## Notes de couverture (plan vs spec + revue porteur)

- **Score canonique + lib pure + dé-doublonnage** : Tasks 1, 2 (+ tests comportementaux).
- **Forme relative_position + limitation hivernale** : Task 3.
- **Éditorial exhaustif + parser (douceur annuelle → 2 critères)** : Task 4 (audit `rg`).
- **Seuil = gate + validation porteur + convention** : Task 5 (checkpoint).
- **Impact : score (A) + résultats multi-critères (B, endpoint réel) + taille (C)** : Task 5 + Task 7 Step 2.
- **Cas A projets** : gravé (Task 7 handoff + commits).
- **Diff sémantique + preuve percentile↔rang (pct entier ~1,3 % ex æquo)** : Task 6.
- **Preview Vercel bloquant, pas de bump prompt** : Task 7.
- **Paliers relatifs** : Task 4 Step 1.

# Trait distinctif — palette élargie et hiérarchisée (moteur) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire du trait distinctif des cartes une vraie donnée du moteur, calculée sur une palette élargie et hiérarchisée (P1 = arbitrages utiles à un projet de vie d'abord, P2 = climat/taille en secours), au lieu de la métrique qui varie le plus.

**Architecture:** Le calcul passe CÔTÉ MOTEUR (`comparateur-vie.ts`), où tous les sous-scores par commune sont disponibles (`nature.score`, `vivpct.apl`, `emploi`, `relief_proximite`, `logement.achat.niveau`, climat) plus la jointure érosion littorale. Un champ `distinctive: string | null` est attaché à chaque `MatchResult` sur les communes affichées. Le client lit `r.distinctive` (on retire le helper client `buildDistinctiveTraits`). Le trait devient ainsi disponible pour la future synthèse sans travail supplémentaire.

**Tech Stack:** TypeScript, moteur déterministe `comparateur-vie.ts`, Next.js (App Router).

**Note de vérification :** pas de runner de test (lint/build/`tsc --noEmit` uniquement). Vérif par typecheck, lint, et un **harnais réel** parse→match sur les trios-exemples du porteur, plus contrôle manuel.

**Hors périmètre :**
- **Mobilité** : non branchée nationalement (script `dependance-auto` = top200 seulement) → reportée, pas dans la palette ici.
- **Câblage synthèse / AskFuture** : préparé (le trait est sur `MatchResult`) mais NON connecté ici (le porteur veut « laisser vivre quelques jours »).

---

## Décisions de conception (hiérarchie validée par le porteur)

Sélection : pour chaque commune affichée, on retient le candidat de **plus haute priorité** où elle est l'extrême du groupe avec une saillance suffisante. P1 prime strictement sur P2 ; P3 est supprimé. Muet si rien ne se détache.

**P1 — arbitrages à raconter (valeur projet de vie) :**

| Signal | Valeur (IndexCommune `c`) | Sens | Libellé | Échelle | Garde gagnant |
|---|---|---|---|---|---|
| nature | `c.nature?.score` (0-100) | max | la plus proche de grands espaces naturels | 22 | ≥ 60 |
| soins | `c.vivpct?.apl` | max | le meilleur accès aux médecins | 22 | ≥ 50 |
| emploi | `c.emploi ? 0.6*taille+0.4*diversite : null` | max | le bassin d'emploi le plus dynamique | 22 | ≥ 50 |
| étés supportables | moyenne de `c.pct.NORTX30D_yr` et `c.pct.NORSWI04_yr` (percentiles, haut = pire) | min | les étés les plus supportables | 22 | — |
| littoral exposé | sévérité érosion (cf. helper) | min | le littoral le moins exposé | — | ≥ 2 communes côtières dans le groupe |
| immobilier | `c.logement.achat.niveau` ordinal (tres_bas=1…tres_haut=5) | min | le marché immobilier le plus accessible | 1 | ≥ 2 communes avec `achat.dispo` |
| montagne | `c.relief_proximite` (0-100) | max | la plus proche de la montagne | 22 | ≥ 55 |

**P2 — secours (seulement si aucun P1 ne se détache pour cette commune) :**

| Signal | Valeur | Sens | Libellé | Échelle | Garde |
|---|---|---|---|---|---|
| pluie | `c.clim.NORRR_yr` | max | la plus pluvieuse | 250 | ≥ 850 |
| hivers doux | `c.clim.NORTMm_seas_DJF` | max | les hivers les plus doux | 4 | — |
| étés chauds | `c.clim.NORTX30D_yr` | max | les étés les plus chauds | 15 | — |
| petite ville | `c.population` | min (ratio) | la plus petite ville | ratio ≥ 1.6 | — |
| grande ville | `c.population` | max (ratio) | la plus grande ville | ratio ≥ 1.6 | — |

**P3 — supprimés :** distance à la côte, altitude brute, dominance de population hors « taille de ville ».

**Saillance :** pour les signaux additifs/0-100, `sal = |extrême − plus_proche| / échelle` ; plancher **0.5**. Population : `sal = log2(ratio)` (plancher ratio ≥ 1.6). Immobilier : écart d'au moins 1 cran d'ordinal. Littoral : écart d'au moins 1 classe de sévérité. Suffixe « des trois » / « des deux » selon le nombre affiché.

---

## File Structure

- Modify: `src/lib/comparateur-vie.ts` — type `MatchResult.distinctive`, helper `buildDistinctive`, injection après l'assemblage final, jointure érosion.
- Modify: `src/lib/comparateur-labels.ts` — supprimer `buildDistinctiveTraits` (remplacé par le moteur) et ses types associés.
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` — lire `r.distinctive` au lieu du helper client.

---

## Task 1 : Champ `distinctive` + helper moteur + injection

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter le champ au type `MatchResult`**

Après la ligne `logement: string | null;` du type `MatchResult`, ajouter :

```ts
  // Trait distinctif RELATIF aux communes affichées (« la plus proche de grands
  // espaces naturels des trois »). Palette hiérarchisée (P1 projet de vie > P2 climat/
  // taille). Narratif, hors score, hors tri. null si rien ne se détache. cf. buildDistinctive.
  distinctive: string | null;
```

- [ ] **Step 2 : Initialiser `distinctive: null` dans l'objet résultat**

Dans le `scored.map`, dans l'objet `result`, après la ligne `littoral: ...,` (avant `metrics: {`), ajouter :

```ts
        distinctive: null, // renseigné après l'assemblage final (relatif au groupe affiché)
```

- [ ] **Step 3 : Écrire le helper `buildDistinctive`**

Juste avant `export async function matchProjects`, ajouter le helper (pur, sur les communes affichées) :

```ts
// Sévérité d'érosion littorale (pour le signal « littoral le moins exposé »), depuis
// l'index littoral : classe → rang ; null si non concernée/non côtière.
function erosionSeverity(insee: string, littoralIndex: Map<string, LittoralSummary> | null): number | null {
  const e = littoralIndex?.get(String(insee).padStart(5, "0"))?.erosion;
  if (!e || !e.classe) return null;
  const rank: Record<string, number> = { faible: 1, "modéré": 2, "marqué": 3, "très marqué": 4 };
  return rank[e.classe] ?? null;
}

const LOGEMENT_ORDINAL: Record<string, number> = {
  tres_bas: 1, bas: 2, moyen: 3, haut: 4, tres_haut: 5,
};
function logementNiveau(c: IndexCommune): number | null {
  const a = c.logement?.achat;
  if (!a || !a.dispo) return null;
  return LOGEMENT_ORDINAL[a.niveau] ?? null;
}

type DistinctiveCand = {
  tier: 1 | 2;
  value: (c: IndexCommune) => number | null;
  dir: "min" | "max";
  scale: number; // additif ; ignoré pour les modes ratio/ordinal/classe
  mode?: "ratio" | "ordinal" | "classe";
  label: string;
  guard?: (winner: number) => boolean;
};

function avgPctPair(c: IndexCommune, a: string, b: string): number | null {
  const x = c.pct[a];
  const y = c.pct[b];
  if (x == null && y == null) return null;
  if (x == null) return y;
  if (y == null) return x;
  return (x + y) / 2;
}

const DISTINCTIVE_FLOOR = 0.5;

// Construit le trait distinctif de chaque commune AFFICHÉE, relatif au groupe.
function buildDistinctive(
  picks: IndexCommune[],
  littoralIndex: Map<string, LittoralSummary> | null,
): Record<string, string> {
  const n = picks.length;
  if (n < 2) return {};
  const suffix = n >= 3 ? " des trois" : " des deux";

  const CANDS: DistinctiveCand[] = [
    { tier: 1, value: (c) => c.nature?.score ?? null, dir: "max", scale: 22, label: "la plus proche de grands espaces naturels", guard: (w) => w >= 60 },
    { tier: 1, value: (c) => c.vivpct?.apl ?? null, dir: "max", scale: 22, label: "le meilleur accès aux médecins", guard: (w) => w >= 50 },
    { tier: 1, value: (c) => (c.emploi ? 0.6 * c.emploi.taille + 0.4 * c.emploi.diversite : null), dir: "max", scale: 22, label: "le bassin d'emploi le plus dynamique", guard: (w) => w >= 50 },
    { tier: 1, value: (c) => avgPctPair(c, "NORTX30D_yr", "NORSWI04_yr"), dir: "min", scale: 22, label: "les étés les plus supportables" },
    { tier: 1, value: (c) => erosionSeverity(c.insee, littoralIndex), dir: "min", scale: 1, mode: "classe", label: "le littoral le moins exposé" },
    { tier: 1, value: (c) => logementNiveau(c), dir: "min", scale: 1, mode: "ordinal", label: "le marché immobilier le plus accessible" },
    { tier: 1, value: (c) => c.relief_proximite ?? null, dir: "max", scale: 22, label: "la plus proche de la montagne", guard: (w) => w >= 55 },
    { tier: 2, value: (c) => c.clim.NORRR_yr ?? null, dir: "max", scale: 250, label: "la plus pluvieuse", guard: (w) => w >= 850 },
    { tier: 2, value: (c) => c.clim.NORTMm_seas_DJF ?? null, dir: "max", scale: 4, label: "les hivers les plus doux" },
    { tier: 2, value: (c) => c.clim.NORTX30D_yr ?? null, dir: "max", scale: 15, label: "les étés les plus chauds" },
    { tier: 2, value: (c) => c.population ?? null, dir: "min", scale: 1, mode: "ratio", label: "la plus petite ville" },
    { tier: 2, value: (c) => c.population ?? null, dir: "max", scale: 1, mode: "ratio", label: "la plus grande ville" },
  ];

  const cand = new Map<string, { tier: number; label: string; sal: number }[]>(
    picks.map((c) => [c.insee, []]),
  );

  for (const cd of CANDS) {
    const vals = picks
      .map((c) => ({ insee: c.insee, v: cd.value(c) }))
      .filter((x): x is { insee: string; v: number } => x.v != null);
    if (vals.length < 2) continue;
    const sorted = [...vals].sort((a, b) => a.v - b.v);
    const ext = cd.dir === "min" ? sorted[0] : sorted[sorted.length - 1];
    const nearest = cd.dir === "min" ? sorted[1] : sorted[sorted.length - 2];
    if (cd.guard && !cd.guard(ext.v)) continue;

    let sal: number;
    if (cd.mode === "ratio") {
      const ratio = cd.dir === "min" ? nearest.v / ext.v : ext.v / nearest.v;
      if (ratio < 1.6) continue;
      sal = Math.log2(ratio);
    } else if (cd.mode === "ordinal" || cd.mode === "classe") {
      if (Math.abs(ext.v - nearest.v) < 1) continue;
      sal = Math.abs(ext.v - nearest.v);
    } else {
      sal = Math.abs(ext.v - nearest.v) / cd.scale;
      if (sal < DISTINCTIVE_FLOOR) continue;
    }
    cand.get(ext.insee)!.push({ tier: cd.tier, label: cd.label + suffix, sal });
  }

  const out: Record<string, string> = {};
  for (const c of picks) {
    // tier d'abord (P1 > P2), puis saillance
    const best = (cand.get(c.insee) ?? []).sort((a, b) => a.tier - b.tier || b.sal - a.sal)[0];
    if (best) out[c.insee] = best.label;
  }
  return out;
}
```

- [ ] **Step 4 : Injecter le calcul sur les communes affichées**

Repérer l'endroit où la liste finale affichée est arrêtée (la liste `deduped` tronquée à `DISPLAY`, juste avant la construction de `MatchOutcome`). Y construire la table `byInsee` et appliquer `buildDistinctive` sur les communes réellement affichées. Ajouter, après que la liste finale (nommons-la `finalResults: MatchResult[]`) est figée et avant le `return` de l'outcome :

```ts
  // Trait distinctif (narratif, hors score) : calculé sur les seules communes
  // AFFICHÉES, relatif au groupe. Le moteur a accès à tous les sous-scores.
  const byInsee = new Map(communes.map((c) => [c.insee, c]));
  const shown = finalResults.slice(0, DISPLAY);
  const picksIdx = shown
    .map((r) => byInsee.get(r.insee))
    .filter((c): c is IndexCommune => c != null);
  const distinctiveMap = buildDistinctive(picksIdx, littoralIndex);
  for (const r of shown) r.distinctive = distinctiveMap[r.insee] ?? null;
```

> Note d'exécution : `finalResults` est le nom local de la liste d'affichage dans `matchProjects` (issue de `deduped`). Adapter au nom réel présent dans le code, et placer ce bloc une fois cette liste arrêtée, avant le `return`. `littoralIndex` existe déjà dans `matchProjects` (chargé sur intention littorale) : pour que « le littoral le moins exposé » fonctionne hors intention littorale aussi, charger l'index littoral inconditionnellement ici si `littoralIndex` est null (`const li = littoralIndex ?? (await getLittoralIndex());`).

- [ ] **Step 5 : Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` ; `npm run lint 2>&1 | grep -c "comparateur-vie"`
Expected: `0` et `0`.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): trait distinctif côté moteur, palette hiérarchisée (P1 projet de vie)"
```

---

## Task 2 : Client — lire `r.distinctive`, retirer le helper client

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`
- Modify: `src/lib/comparateur-labels.ts`

- [ ] **Step 1 : Lire `r.distinctive` au rendu**

Dans `OuVivreClient.tsx`, remplacer le rendu actuel du trait :

```tsx
                  {distinctives[r.insee] && (
                    <p className="mt-1.5 text-[11.5px] leading-snug text-accent/75 italic">
                      {distinctives[r.insee].charAt(0).toUpperCase() + distinctives[r.insee].slice(1)}.
                    </p>
                  )}
```

par :

```tsx
                  {r.distinctive && (
                    <p className="mt-1.5 text-[11.5px] leading-snug text-accent/75 italic">
                      {r.distinctive.charAt(0).toUpperCase() + r.distinctive.slice(1)}.
                    </p>
                  )}
```

- [ ] **Step 2 : Retirer la dérivation et l'import client**

Supprimer la ligne `const distinctives = buildDistinctiveTraits(top);` et retirer `buildDistinctiveTraits` de l'import depuis `@/lib/comparateur-labels` (garder `preferencesToLabels`, `preferencesToInterpreted`, `horsMesureToPhrases`).

- [ ] **Step 3 : Supprimer le helper client devenu inutile**

Dans `src/lib/comparateur-labels.ts`, supprimer `buildDistinctiveTraits`, `DISTINCTIVE_CANDIDATES`, `DISTINCTIVE_FLOOR`, et les types `DistinctiveMetrics` / `DistinctiveInput` (tout le bloc ajouté précédemment pour le trait distinctif).

- [ ] **Step 4 : Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` ; `npm run lint 2>&1 | grep -cE "OuVivreClient|comparateur-labels"`
Expected: `0` et `0`.

- [ ] **Step 5 : Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx src/lib/comparateur-labels.ts
git commit -m "refactor(comparateur): le client lit r.distinctive (helper moteur), retrait du helper client"
```

---

## Task 3 : Validation réelle sur les trios-exemples

**Files:** aucun (vérification).

- [ ] **Step 1 : Harnais parse→match imprimant `distinctive`**

Run (serveur dev sur :3000), pour chaque requête ci-dessous, afficher `nom → distinctive` :

```bash
for q in \
 "vivre près de la mer dans l'ouest, au calme" \
 "élever mes enfants proche de la nature, loin de l'agriculture intensive" \
 "vivre à la montagne dans le sud-ouest, près des médecins"; do
  echo "=== $q ===";
  P=$(curl -s localhost:3000/api/comparateur-vie/parse -X POST -H "Content-Type: application/json" -d "{\"text\":\"$q\"}");
  echo "$P" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',async()=>{const parsed=JSON.parse(s).parsed;const m=await (await fetch('http://localhost:3000/api/comparateur-vie/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parsed})})).json();(m.results||[]).slice(0,3).forEach(r=>console.log('  '+r.nom.padEnd(24)+' → '+(r.distinctive??'(rien)')));});";
done
```

Expected : chaque trio fait ressortir un arbitrage P1 quand il existe (nature, soins, emploi, montagne, littoral, immobilier, étés supportables) ; les signaux P2 (pluie, taille…) n'apparaissent que faute de P1 saillant ; jamais « la plus proche de la côte » ni l'altitude brute. Contrôle de bon sens commune par commune.

- [ ] **Step 2 : Contrôle manuel au gate**

Run: `npm run dev`, `/ou-vivre`, une recherche sortant 3 communes contrastées. Vérifier que la ligne distinctive est lisible, rare, et raconte un arbitrage utile.

---

## Self-Review

**Spec coverage :**
- Garder le système actuel → Task 1/2 (on déplace + enrichit, on ne casse pas le rendu). ✓
- Élargir la palette (nature, soins, emploi, immobilier, littoral, montagne) → P1 table, Task 1 Step 3. ✓ (mobilité explicitement reportée, hors palette).
- Reléguer pluie/population/distance-côte → pluie & taille en P2, distance-côte supprimée (P3). ✓
- Choisir l'arbitrage le plus UTILE, pas le plus variable → sélection par tier d'abord, puis saillance (Task 1 Step 3, tri `a.tier - b.tier || b.sal - a.sal`). ✓
- Préparer synthèse → `distinctive` sur `MatchResult` (dispo pour le firewall), câblage différé hors plan. ✓

**Placeholder scan :** une seule note d'exécution (nom local `finalResults` à adapter au code réel) ; pas de TODO de contenu, le helper est complet.

**Type consistency :** `MatchResult.distinctive: string | null` (Step 1) ↔ `buildDistinctive` renvoie `Record<string,string>` et `r.distinctive = map[insee] ?? null` (Step 4) ↔ client lit `r.distinctive` (Task 2). `IndexCommune`, `LittoralSummary`, `getLittoralIndex` déjà importés/définis dans `comparateur-vie.ts`. Champs lus (`c.nature.score`, `c.vivpct.apl`, `c.emploi.{taille,diversite}`, `c.relief_proximite`, `c.logement.achat.niveau`, `c.pct[...]`, `c.population`) vérifiés présents dans le type `IndexCommune`. ✓

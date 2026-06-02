# Couche Littoral V1 (rapport) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter au rapport futur•e une couche « Littoral » qui, pour les communes officiellement exposées au recul du trait de côte, révèle ce statut, le contextualise côté assurance, et le projette, sans aucun score ni critère de comparateur.

**Architecture:** Une donnée précalculée committée (`data/littoral-trait-de-cote.json`, construite depuis la liste officielle data.gouv.fr de la loi Climat et Résilience), lue par une lib serveur `src/lib/littoral.ts` (`getLittoralSummary(insee)`, patron de `drias-json.ts`), branchée dans l'agrégateur `gatherCommuneEnrichment`, et rendue par un composant serveur `LittoralModule` affiché uniquement quand la commune est dans la liste. La contextualisation assurance et la projection sont du texte fixe sourcé (aucune donnée par commune). Aucune table Supabase, aucun appel réseau au runtime.

**Tech Stack:** Next.js (App Router, Server Components), TypeScript, Node (script de build), Tailwind. Données : liste officielle « communes recul du trait de côte » (loi Climat et Résilience, data.gouv.fr).

**Note de vérification :** ce dépôt n'a aucun runner de test (seuls `npm run lint` et `npm run build` existent, cf. plans précédents). La vérification de chaque tâche se fait donc par : exécution du script de build et contrôle de son sortie, `npm run build` (typecheck), `npm run lint`, un contrôle Node ponctuel de la lib, et un contrôle manuel au rapport. Aucun framework de test introduit (hors convention du projet).

---

## Décisions V1 (réponses aux 8 questions du porteur)

1. **Quelles données récupérer :** la liste officielle des communes inscrites au titre du **recul du trait de côte** (loi Climat et Résilience, art. L321-15). C'est la traduction réglementaire de l'aléa érosion évalué par le Cerema, déjà par commune, nationale, datée. La **vitesse de recul** quantifiée (Cerema/Géolittoral, linéaire SIG) est explicitement renvoyée en V2 (jointure spatiale lourde, cf. §V2).
2. **Quelles sources :** liste data.gouv.fr (CSV, 371 communes, MAJ 18 fév. 2026, colonnes `code_commune, nom_commune, code_departement, nom_departement, code_region, nom_region, is_currently_active, trait_de_cote_historique`). Contexte assurance : **CCR** (l'érosion n'est pas couverte par le régime CatNat ; la submersion l'est). Source érosion citée : **Cerema / Géolittoral**. Jamais « Callendar ».
3. **Quelle maille :** la **commune** pour V1 (la liste est par commune). On assume cette maille parce que l'inscription est un fait administratif communal. La maille fine (bande côtière / linéaire) reste V2.
4. **Quels champs stocker :** `insee`, `nom`, `facade` (manche/atlantique/bretagne/mediterranee/outre_mer), `concernee` (bool), `decret` (numéro, url Legifrance, date de début). Petit, statique, committé.
5. **Quel rendu :** un bloc « Littoral » dans `/rapport/quartier`, visible seulement pour les communes de la liste : statut recul du trait de côte + décret, contextualisation assurance (texte fixe sourcé), phrase de projection (ton lucide, non anxiogène), chips de sources.
6. **Cas limites :** commune absente de la liste → bloc masqué (on ne parle que là où une base officielle existe). Outre-mer présent (~51 communes) → façade `outre_mer`. Échec de parse de l'historique des décrets → `decret: null`, le bloc reste affiché sur `concernee`. Biais façade (Méditerranée sous-représentée) → assumé et non corrigé en V1.
7. **Livrable rapide :** tout ce plan (liste officielle + rendu rapport). C'est une vraie brique utilisateur sans dépendre du SIG Cerema.
8. **Explicitement V2 :** vitesse de recul Cerema (linéaire SIG), couverture de toutes les communes côtières non listées (référentiel loi Littoral), submersion homogène (BRGM marée haute + IGN RGE Alti), tout score ou critère de comparateur, alimentation de la synthèse IA.

---

## File Structure

- Create: `scripts/build-littoral.js` — télécharge la liste officielle, parse, dérive la façade, écrit le JSON. Hors runtime.
- Create: `data/littoral-trait-de-cote.json` — artefact committé (≈371 entrées), lu au runtime.
- Create: `src/lib/littoral.ts` — `getLittoralSummary(insee)` + types `LittoralSummary`, cache mémoire (patron `drias-json.ts`). Serveur uniquement.
- Modify: `src/lib/commune-enrichment.ts` — branche `littoral` dans `gatherCommuneEnrichment` et `EnrichmentResult`.
- Create: `src/components/report/LittoralModule.tsx` — composant serveur de rendu (statut + assurance + projection + sources).
- Modify: `src/app/(account)/rapport/quartier/page.tsx` — rend `<LittoralModule>` quand `enrichment.littoral` existe.

---

## Task 1 : Script de build + dataset committé

**Files:**
- Create: `scripts/build-littoral.js`
- Create (généré) : `data/littoral-trait-de-cote.json`

- [ ] **Step 1 : Écrire le script de build**

Créer `scripts/build-littoral.js` :

```js
#!/usr/bin/env node
/**
 * build-littoral.js
 *
 * Construit data/littoral-trait-de-cote.json à partir de la liste officielle
 * des communes inscrites au titre du recul du trait de côte (loi Climat et
 * Résilience, art. L321-15), publiée sur data.gouv.fr.
 *
 * Source CSV (371 communes, MAJ 2026-02-18) :
 *   https://www.data.gouv.fr/api/1/datasets/r/17e130fe-85df-483a-a49a-bdb0bd0ad0e5
 *
 * Aucune dépendance runtime : artefact committé, relu par src/lib/littoral.ts.
 *
 * Usage : node scripts/build-littoral.js
 */
import fs from "node:fs/promises";
import path from "node:path";

const CSV_URL =
  "https://www.data.gouv.fr/api/1/datasets/r/17e130fe-85df-483a-a49a-bdb0bd0ad0e5";

// Façade maritime par département (informatif, pour le ton narratif).
// La Bretagne (22/29/35/56) mêle Manche et Atlantique : groupée à part.
const FACADE_BY_DEPT = {
  "62": "manche", "59": "manche", "80": "manche", "76": "manche", "14": "manche", "50": "manche",
  "22": "bretagne", "29": "bretagne", "35": "bretagne", "56": "bretagne",
  "44": "atlantique", "85": "atlantique", "17": "atlantique", "33": "atlantique", "40": "atlantique", "64": "atlantique",
  "66": "mediterranee", "11": "mediterranee", "34": "mediterranee", "30": "mediterranee",
  "13": "mediterranee", "83": "mediterranee", "06": "mediterranee", "2A": "mediterranee", "2B": "mediterranee",
};

function facadeFor(codeDept) {
  if (/^97/.test(codeDept)) return "outre_mer";
  return FACADE_BY_DEPT[codeDept] || "atlantique";
}

// Parseur CSV minimal respectant les champs entre guillemets (le dernier champ,
// trait_de_cote_historique, contient des virgules).
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Le champ historique est une repr Python ('quotes', True/False/None) : on la
// rend en JSON tolérant pour extraire le décret actif. Dégrade à null en cas d'échec.
function parseActiveDecret(raw) {
  try {
    const json = raw
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const active = arr.find((d) => d.is_active) || arr[arr.length - 1];
    if (!active) return null;
    return {
      numero: active.numero_decret ?? null,
      url: active.url_decret ?? null,
      debut: active.start_date ?? null,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("Téléchargement de la liste officielle…");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Téléchargement KO : HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);
  const iInsee = idx("code_commune");
  const iNom = idx("nom_commune");
  const iCodeDept = idx("code_departement");
  const iNomDept = idx("nom_departement");
  const iNomReg = idx("nom_region");
  const iActive = idx("is_currently_active");
  const iHist = idx("trait_de_cote_historique");

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (f.length <= iHist) continue;
    const insee = String(f[iInsee]).padStart(5, "0");
    const codeDept = String(f[iCodeDept]).padStart(2, "0").replace(/^0(2[AB])$/, "$1");
    records.push({
      insee,
      nom: f[iNom],
      departement: f[iNomDept],
      region: f[iNomReg],
      facade: facadeFor(f[iCodeDept]),
      concernee: String(f[iActive]).toLowerCase() === "true",
      decret: parseActiveDecret(f[iHist]),
    });
  }

  // On ne garde que les communes actuellement inscrites (concernee).
  const kept = records.filter((r) => r.concernee);

  const outPath = path.join(process.cwd(), "data", "littoral-trait-de-cote.json");
  await fs.writeFile(outPath, JSON.stringify(kept, null, 0) + "\n", "utf8");

  const byFacade = {};
  kept.forEach((r) => { byFacade[r.facade] = (byFacade[r.facade] || 0) + 1; });
  console.log(`Écrit ${kept.length} communes dans data/littoral-trait-de-cote.json`);
  console.log("Par façade :", byFacade);
  const laRochelle = kept.find((r) => r.insee === "17300");
  console.log("Contrôle La Rochelle (17300) :", laRochelle ? "présente" : "ABSENTE");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2 : Exécuter le script et contrôler la sortie**

Run: `node scripts/build-littoral.js`
Expected: log « Écrit 371 communes… » (ordre de grandeur), une ventilation par façade avec `bretagne` et `manche` dominants, et « Contrôle La Rochelle (17300) : présente ». Le fichier `data/littoral-trait-de-cote.json` existe.

- [ ] **Step 3 : Vérifier la forme du JSON généré**

Run: `node -e "const a=require('./data/littoral-trait-de-cote.json'); const r=a.find(x=>x.insee==='17300'); console.log('total',a.length); console.log(JSON.stringify(r)); console.log('clés', Object.keys(r));"`
Expected: `total` ≈ 371 ; l'entrée 17300 a `insee, nom, departement, region, facade:"atlantique", concernee:true, decret` (objet ou null).

- [ ] **Step 4 : Commit**

```bash
git add scripts/build-littoral.js data/littoral-trait-de-cote.json
git commit -m "feat(littoral): dataset recul du trait de côte (liste officielle loi Climat et Résilience)"
```

---

## Task 2 : Lib serveur `getLittoralSummary`

**Files:**
- Create: `src/lib/littoral.ts`

- [ ] **Step 1 : Écrire la lib**

Créer `src/lib/littoral.ts` :

```ts
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type LittoralFacade =
  | "manche"
  | "atlantique"
  | "bretagne"
  | "mediterranee"
  | "outre_mer";

export type LittoralDecret = { numero: string | null; url: string | null; debut: string | null };

export type LittoralSummary = {
  insee: string;
  facade: LittoralFacade;
  // Commune inscrite au titre du recul du trait de côte (loi Climat et Résilience,
  // art. L321-15). concernee est toujours true en V1 (on ne stocke que les inscrites),
  // le champ est conservé pour l'évolution V2.
  traitDeCote: { concernee: boolean; decret: LittoralDecret | null };
};

type LittoralRecord = {
  insee: string;
  nom: string;
  departement: string;
  region: string;
  facade: LittoralFacade;
  concernee: boolean;
  decret: LittoralDecret | null;
};

let indexCache: Map<string, LittoralRecord> | null = null;

async function loadIndex(): Promise<Map<string, LittoralRecord>> {
  if (indexCache) return indexCache;
  const file = path.join(process.cwd(), "data", "littoral-trait-de-cote.json");
  const raw = await fs.readFile(file, "utf8");
  const rows = JSON.parse(raw) as LittoralRecord[];
  const map = new Map<string, LittoralRecord>();
  for (const r of rows) map.set(String(r.insee).padStart(5, "0"), r);
  indexCache = map;
  return map;
}

// Renvoie le résumé littoral d'une commune, ou null si elle n'est pas dans la
// liste officielle (V1 : on ne parle que là où une base officielle existe).
export async function getLittoralSummary(
  inseeCode: string,
): Promise<LittoralSummary | null> {
  const insee = String(inseeCode).padStart(5, "0");
  const index = await loadIndex();
  const rec = index.get(insee);
  if (!rec) return null;
  return {
    insee: rec.insee,
    facade: rec.facade,
    traitDeCote: { concernee: rec.concernee, decret: rec.decret },
  };
}
```

- [ ] **Step 2 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build OK, aucune erreur lint dans `src/lib/littoral.ts`.

- [ ] **Step 3 : Contrôle Node de la lib**

Run: `node -e "require('esbuild')" 2>/dev/null || true` (ignore), puis contrôle indirect via le JSON déjà validé en Task 1 (la lib lit ce JSON). Contrôle logique : `node -e "const a=require('./data/littoral-trait-de-cote.json'); const m=new Map(a.map(r=>[String(r.insee).padStart(5,'0'),r])); console.log('17300 ->', m.has('17300')); console.log('75056 ->', m.has('75056'));"`
Expected: `17300 -> true` (La Rochelle, listée), `75056 -> false` (Paris, non littorale → la lib renverra null).

- [ ] **Step 4 : Commit**

```bash
git add src/lib/littoral.ts
git commit -m "feat(littoral): lib getLittoralSummary (lecture du dataset, cache mémoire)"
```

---

## Task 3 : Brancher `littoral` dans l'agrégateur

**Files:**
- Modify: `src/lib/commune-enrichment.ts`

- [ ] **Step 1 : Importer la lib**

Après le bloc d'imports existant (après l'import de `georisques`), ajouter :

```ts
import { getLittoralSummary, type LittoralSummary } from "@/lib/littoral";
```

- [ ] **Step 2 : Étendre le type `EnrichmentResult`**

Dans `EnrichmentResult`, après la ligne `catnat: GasparCatnatSummary | null;`, ajouter :

```ts
  littoral: LittoralSummary | null;
```

- [ ] **Step 3 : Ajouter le fetch au `Promise.allSettled`**

Dans `gatherCommuneEnrichment`, ajouter `getLittoralSummary(insee)` comme dernier élément du tableau passé à `Promise.allSettled`, et capturer son résultat. Le tableau de destructuration et l'appel deviennent :

```ts
  const [ademeRes, driasRes, eauRes, vigieauRes, georisquesRes, catnatRes, littoralRes] =
    await Promise.allSettled([
      getCommuneFullData(insee),
      getClimatDataCommune(insee),
      getEaufranceSummary(insee),
      getVigieauSummary(insee),
      getGeorisquesSummary(insee),
      getGasparCatnatSummary(insee),
      getLittoralSummary(insee),
    ]);
```

- [ ] **Step 4 : Ajouter au retour**

Dans l'objet retourné, après la ligne `catnat: catnatRes.status === "fulfilled" ? catnatRes.value : null,`, ajouter :

```ts
    littoral: littoralRes.status === "fulfilled" ? littoralRes.value : null,
```

- [ ] **Step 5 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build OK (le nouveau champ est typé, tous les consommateurs existants de `EnrichmentResult` restent valides car ils n'accèdent pas à `littoral`).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/commune-enrichment.ts
git commit -m "feat(littoral): brancher la couche littoral dans gatherCommuneEnrichment"
```

---

## Task 4 : Composant de rendu `LittoralModule`

**Files:**
- Create: `src/components/report/LittoralModule.tsx`

- [ ] **Step 1 : Écrire le composant serveur**

Créer `src/components/report/LittoralModule.tsx` :

```tsx
import type { LittoralSummary } from "@/lib/littoral";

const FACADE_LABEL: Record<LittoralSummary["facade"], string> = {
  manche: "façade Manche",
  atlantique: "façade atlantique",
  bretagne: "littoral breton",
  mediterranee: "façade méditerranéenne",
  outre_mer: "littoral ultramarin",
};

function formatDateFr(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ][Number(m) - 1];
  return mois ? `${Number(d)} ${mois} ${y}` : null;
}

// Bloc « Littoral » du rapport : affiché uniquement pour les communes inscrites
// au titre du recul du trait de côte. Statut officiel + contextualisation assurance
// (texte fixe sourcé) + projection. Ton lucide, non anxiogène. Aucun score.
export default function LittoralModule({
  summary,
  communeName,
}: {
  summary: LittoralSummary;
  communeName: string;
}) {
  const { facade, traitDeCote } = summary;
  const decretDate = formatDateFr(traitDeCote.decret?.debut ?? null);

  return (
    <div className="rounded-2xl border border-info/[0.18] bg-info/[0.04] p-6">
      <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
        Littoral · {FACADE_LABEL[facade]}
      </div>

      <h3
        className="font-normal text-[clamp(20px,2vw,26px)] leading-[1.2] tracking-[-0.3px] text-label mb-3"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {communeName} fait partie des communes engagées face au recul du trait de côte.
      </h3>

      <p className="text-[15px] leading-[1.7] text-muted mb-4">
        {communeName} figure sur la liste nationale des communes dont la politique
        d&apos;urbanisme doit s&apos;adapter au recul du trait de côte
        {decretDate ? `, au titre de la loi Climat et Résilience (décret en vigueur depuis le ${decretDate})` : ", au titre de la loi Climat et Résilience"}.
        Concrètement, la commune doit cartographier l&apos;exposition de son territoire
        à l&apos;érosion et en tenir compte dans ses documents d&apos;urbanisme.
      </p>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 mb-4">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2">
          Ce que beaucoup ignorent
        </div>
        <p className="text-[14px] leading-[1.65] text-muted">
          Le recul du trait de côte n&apos;est pas couvert par le régime
          catastrophes naturelles : il est considéré comme prévisible, donc exclu de
          l&apos;indemnisation. La submersion marine, elle, reste couverte, mais le coût
          des dommages pourrait être multiplié par deux à dix d&apos;ici 2050. Un projet
          de vie sur le littoral se pense donc avec cette assurabilité en tête.
        </p>
      </div>

      <p className="text-[14px] leading-[1.65] text-muted mb-5">
        Vivre près de la mer reste un projet de vie pleinement légitime. futur•e
        l&apos;éclaire simplement avec lucidité : sur ce littoral, l&apos;horizon 2050
        et 2100 fait partie de la décision, au même titre que le prix ou le cadre de vie.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          "Cerema · Géolittoral",
          "Loi Climat et Résilience · data.gouv.fr",
          "CCR · régime CatNat",
        ].map((s) => (
          <span
            key={s}
            className="font-mono text-[9px] tracking-[0.1em] uppercase text-ghost border border-white/[0.08] rounded px-2 py-1"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build OK, aucune erreur lint dans le composant.

- [ ] **Step 3 : Commit**

```bash
git add src/components/report/LittoralModule.tsx
git commit -m "feat(littoral): composant LittoralModule (statut + assurance + projection)"
```

---

## Task 5 : Afficher le bloc dans le rapport quartier

**Files:**
- Modify: `src/app/(account)/rapport/quartier/page.tsx`

- [ ] **Step 1 : Importer le composant**

Avec les autres imports de composants `report` en tête de fichier, ajouter :

```tsx
import LittoralModule from "@/components/report/LittoralModule";
```

- [ ] **Step 2 : Dériver le résumé littoral**

Près des dérivations de l'enrichissement (après `const catnat = enrichment?.catnat ?? null;`), ajouter :

```tsx
  const littoral = enrichment?.littoral ?? null;
```

- [ ] **Step 3 : Rendre le bloc après « Ce que montrent les données »**

Juste après la `</section>` qui ferme le bloc contenant `<QuartierAside ... />`, et avant la section AskFuture (`{/* Une question ? ...`), insérer :

```tsx
        {littoral && (
          <section className="pt-14">
            <LittoralModule summary={littoral} communeName={displayName} />
          </section>
        )}
```

- [ ] **Step 4 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build OK, aucune erreur lint.

- [ ] **Step 5 : Contrôle manuel**

Pré-requis : être connecté à un compte dont le territoire est une commune **listée** (ex. La Rochelle, INSEE 17300), puis ouvrir `/rapport/quartier`.
Run: `npm run dev`, naviguer vers `/rapport/quartier`.
Expected (commune listée) : sous « Ce que montrent les données » apparaît le bloc « Littoral · façade atlantique » avec le statut recul du trait de côte, l&apos;encart assurance, la phrase de projection et les trois chips de sources. Aucun tiret cadratin.
Contre-épreuve : avec un territoire **non littoral** (ex. une commune intérieure), le bloc est absent.

- [ ] **Step 6 : Commit**

```bash
git add src/app/\(account\)/rapport/quartier/page.tsx
git commit -m "feat(littoral): afficher la couche littoral dans le rapport quartier"
```

---

## Self-Review

**Spec coverage (8 questions) :**
- (1) données → Task 1 (liste recul du trait de côte). ✓
- (2) sources → Task 1 (data.gouv.fr) + Task 4 (chips Cerema/Géolittoral, loi C&R, CCR). ✓
- (3) maille commune → Task 1 (clé INSEE). ✓
- (4) champs stockés → Task 1 JSON + Task 2 type `LittoralSummary`. ✓
- (5) rendu → Task 4 + Task 5. ✓
- (6) cas limites → null hors liste (Task 2/5), `decret:null` tolérant (Task 1), façade outre_mer (Task 1). ✓
- (7) livrable rapide → l'ensemble du plan, sans SIG. ✓
- (8) V2 explicite → section « Décisions V1 » §8 (vitesse Cerema, communes côtières non listées, submersion homogène, comparateur, synthèse IA). ✓

**Placeholder scan :** aucun TBD/TODO ; chaque step porte le code exact.

**Type consistency :** `LittoralSummary` (Task 2) est le type importé par `EnrichmentResult` (Task 3) et par le composant (Task 4, prop `summary`). `facade` partage le même union partout (`FACADE_BY_DEPT` en build, `LittoralFacade` en lib, `FACADE_LABEL` au rendu, clés identiques). `getLittoralSummary` renvoie `LittoralSummary | null`, cohérent avec le `littoral: LittoralSummary | null` de l'agrégateur et le garde `{littoral && ...}` du rendu. ✓

**Garde-fou doctrine :** aucune tâche ne touche le moteur du comparateur, le scoring, ni la doctrine ; le bloc est narratif, conditionnel, et ne s'affiche que sur base officielle. Vocabulaire sans « résilience » dans l'UI ; source Cerema/Géolittoral/CCR, jamais Callendar.

---

## Execution Handoff

Plan complet et enregistré dans `docs/superpowers/plans/2026-06-02-littoral-rapport-v1.md`. Deux options d'exécution :

1. **Subagent-Driven (recommandé)** : je dispatche un sous-agent frais par tâche, revue entre les tâches, itération rapide.
2. **Inline** : exécution dans cette session via executing-plans, par lots avec points de contrôle.

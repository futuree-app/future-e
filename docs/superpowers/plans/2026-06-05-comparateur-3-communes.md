# Comparateur 3 communes (révélateur d'arbitrages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une vue « en place » dans `/ou-vivre` qui révèle les arbitrages entre les 3 communes (identité, 2 forces, 1 compromis), sans chiffre ni score, pour générer du doute intelligent vers le rapport et un placeholder Pack Décision.

**Architecture:** Deux champs déterministes ajoutés au moteur (`identite`, `compromis`), calculés comme `distinctive`/`signaux` (narratif, hors score/tri). Le reste est de la présentation : un composant client `CompareView` qui réutilise `outcome` déjà calculé, atteint par bascule d'écran dans `OuVivreClient` (le CTA existant est repointé). Aucune route nouvelle, aucun recalcul, aucune IA.

**Tech Stack:** Next.js App Router, React, TypeScript. Vérif : `npx tsc --noEmit` + eslint + sonde Node live (parse+match) sur le dev :3000 + curl de rendu.

**Doctrine de vérif (pas de runner de test) :** la « preuve » côté moteur = la sonde live qui lit `identite`/forces/`compromis` sur de vrais trios ; côté client = tsc/eslint + curl/rendu. Aucun tiret cadratin. Aucun chiffre. Décrire jamais juger.

**Spec :** `docs/superpowers/specs/2026-06-05-comparateur-3-communes-design.md`

**Note d'exécution (porteur absent, validation donnée) :** le gate sonde se fait par mon jugement, documenté pour relecture porteur ; on ne pousse PAS sur main (commits sur la branche `feat/comparateur-3-communes`, ajustements après).

---

## File Structure

- **Modify** `src/lib/comparateur-vie.ts` : type `MatchResult` (+`identite`, +`compromis`), `buildIdentite(c)` (nouveau), `assignCompromis(shownPicks, byInsee)` (nouveau), câblage dans `matchProjects`.
- **Create** `src/app/(public)/ou-vivre/CompareView.tsx` : la vue révélateur d'arbitrages (présentation pure).
- **Modify** `src/app/(public)/ou-vivre/OuVivreClient.tsx` : état de bascule `view`, repointage du CTA, rendu de `CompareView`.
- **Create** `scripts/sonde-comparateur-3.mjs` : sonde de lecture des champs sur de vrais trios.

---

## Task 1: Champs moteur `identite` et `compromis` (type + composers)

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1: Étendre le type MatchResult**

Dans `export type MatchResult = { ... }`, ajouter après `distinctive` :

```ts
  // Identité « promesse de vie » (NARRATIF, hors score/tri). Déterministe par
  // archétype (taille UU × contexte × dominante). Raconte la décision, pas la
  // géographie. cf. buildIdentite.
  identite: string;
  // Compromis TOUJOURS présent (NARRATIF, hors score/tri). tradeoff absolu si
  // worst < 50, sinon retrait relatif au groupe affiché, sinon « sans faiblesse
  // marquée ». Finalisé après assemblage (assignCompromis). cf. spec.
  compromis: string;
```

- [ ] **Step 2: Écrire buildIdentite (déterministe, par archétype)**

Ajouter près de `buildSignature` (vers la ligne 461+). Réutilise `tailleVille` (population UU) et `subScore`. Les clés de dominante sont des `PreferenceKey` existantes.

```ts
// ── Identité « promesse de vie » (narratif, hors score) ──────────────────────
// Déterministe : archétype (taille × contexte × dominante) → promesse « Pour… ».
// Raconte la décision, pas la fiche. 100 % adossé aux signaux mesurés.
function tailleLabel(pop: number | null): "village" | "petite" | "moyenne" | "grande" | "metropole" {
  if (pop == null) return "petite";
  if (pop < 2000) return "village";
  if (pop < 25000) return "petite";
  if (pop < 100000) return "moyenne";
  if (pop < 500000) return "grande";
  return "metropole";
}

function buildIdentite(c: IndexCommune): string {
  const uuPop = tailleVille(c);
  const taille = tailleLabel(uuPop);
  const coastal = c.distance_cote_km != null && c.distance_cote_km <= 15;
  const altitude = c.altitude ?? 0;
  const relief = c.relief_proximite ?? 0;
  const periurbain =
    c.population != null && uuPop != null && uuPop >= 100000 && c.population < 25000;

  // Dominante : plus haut subScore parmi un ensemble curé de traits de caractère.
  const CHAR_KEYS: PreferenceKey[] = [
    "vie_locale", "vie_etudiante", "cadre_calme", "calme_sonore", "nature",
    "acces_services", "acces_soins", "croissance_demographique",
    "faible_chaleur", "proximite_mer",
  ];
  let domKey: PreferenceKey | null = null;
  let domScore = -1;
  for (const k of CHAR_KEYS) {
    const s = subScore(k, c);
    if (s != null && s > domScore) { domScore = s; domKey = k; }
  }

  // Mapping archétype → promesse (table de départ, calibrée par sonde).
  if (periurbain && (domKey === "acces_services" || domKey === "vie_locale")) {
    return "Pour rester proche d'une grande ville sans en vivre le centre.";
  }
  if (coastal && (domKey === "proximite_mer" || domKey === "cadre_calme" || domKey === "calme_sonore")) {
    return "Pour un quotidien tourné vers la mer, à un rythme plus posé.";
  }
  if (coastal && domKey === "acces_services" && (taille === "moyenne" || taille === "grande")) {
    return "Pour la vie au bord de l'eau avec les services d'une vraie ville.";
  }
  if (domKey === "faible_chaleur" && (altitude >= 400 || relief >= 50)) {
    return "Pour chercher davantage de fraîcheur et un rythme plus posé.";
  }
  if (domKey === "vie_etudiante") {
    return "Pour une ville étudiante à taille humaine.";
  }
  if (domKey === "croissance_demographique") {
    return "Pour s'installer dans un territoire qui monte.";
  }
  if ((domKey === "nature" || domKey === "cadre_calme" || domKey === "calme_sonore") && (taille === "village" || taille === "petite")) {
    return "Pour un cadre préservé, loin de l'agitation.";
  }
  if (domKey === "vie_locale" && (taille === "petite" || taille === "moyenne")) {
    return "Pour une petite ville qui reste vraiment vivante.";
  }
  if (taille === "grande" || taille === "metropole") {
    return "Pour la vie d'une grande ville et tous ses services.";
  }
  // Repli neutre, sobre, adossé à la dominante.
  return "Pour un bon équilibre entre cadre de vie et services.";
}
```

- [ ] **Step 3: Écrire assignCompromis (compromis toujours présent, relatif au groupe)**

Ajouter près de `assignSignaux`. Réutilise `subScore` et `REASON_NEG`. Calculé sur le groupe affiché.

```ts
// ── Compromis toujours présent (narratif, hors score) ────────────────────────
// tradeoff absolu (worst < 50, déjà dans r.tradeoff) sinon le retrait le plus net
// RELATIF au groupe affiché, sinon « sans faiblesse marquée ». Jamais de chiffre,
// jamais nommer un perdant (« que dans les autres options »).
const COMPROMIS_KEYS: PreferenceKey[] = [
  "faible_chaleur", "faible_secheresse", "faible_risque_inondation", "air_sain",
  "acces_soins", "acces_services", "calme_sonore", "faible_exposition_industrielle",
  "vie_locale", "faible_dependance_auto",
];
const COMPROMIS_NEG: Partial<Record<PreferenceKey, string>> = {
  faible_chaleur: "la chaleur estivale est plus marquée",
  faible_secheresse: "la sécheresse est plus présente",
  faible_risque_inondation: "le risque d'inondation est plus présent",
  air_sain: "l'air de fond est un peu moins pur",
  acces_soins: "l'offre de soins est plus limitée",
  acces_services: "les services sont moins accessibles",
  calme_sonore: "l'environnement sonore est plus exposé",
  faible_exposition_industrielle: "les sites industriels sont plus présents",
  vie_locale: "la vie locale est plus discrète",
  faible_dependance_auto: "la voiture y est plus indispensable",
};

function assignCompromis(shownPicks: MatchResult[], byInsee: Map<string, IndexCommune>): void {
  // Scores de groupe par clé (moyenne sur les communes affichées).
  const groupMean = new Map<PreferenceKey, number>();
  for (const k of COMPROMIS_KEYS) {
    const vals: number[] = [];
    for (const r of shownPicks) {
      const c = byInsee.get(r.insee);
      const s = c ? subScore(k, c) : null;
      if (s != null) vals.push(s);
    }
    if (vals.length) groupMean.set(k, vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  for (const r of shownPicks) {
    if (r.tradeoff) {
      r.compromis = `En échange, ${r.tradeoff}.`;
      continue;
    }
    const c = byInsee.get(r.insee);
    let worstKey: PreferenceKey | null = null;
    let worstDelta = 0;
    if (c) {
      for (const k of COMPROMIS_KEYS) {
        const s = subScore(k, c);
        const mean = groupMean.get(k);
        if (s == null || mean == null || !COMPROMIS_NEG[k]) continue;
        const delta = mean - s; // positif = en retrait du groupe
        if (delta > worstDelta) { worstDelta = delta; worstKey = k; }
      }
    }
    if (worstKey && worstDelta >= 12) {
      r.compromis = `En échange, ${COMPROMIS_NEG[worstKey]} que dans les autres options.`;
    } else {
      r.compromis = "Le bon compromis des trois, sans faiblesse marquée.";
    }
  }
}
```

- [ ] **Step 4: Câbler dans matchProjects**

Dans le `scored.map`, ajouter `identite` (per-commune) à côté de `signature`, et initialiser `compromis` :

```ts
        signature: buildSignature(c),
        identite: buildIdentite(c),
        tradeoff,
        compromis: "", // finalisé après assemblage (assignCompromis)
```

Puis, juste après l'appel `assignSignaux(shownPicks, byInsee, requestedKeys);` (vers la ligne 1550), ajouter :

```ts
  assignCompromis(shownPicks, byInsee);
```

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit 2>&1 | grep -i comparateur-vie || echo "tsc OK comparateur-vie"`
Expected: `tsc OK comparateur-vie` (le Record exhaustif n'est pas requis ici, COMPROMIS_NEG est Partial).

- [ ] **Step 6: Réinitialiser le cache d'index du dev**

Le fichier `comparateur-vie.ts` est modifié, donc `indexCache` se réinitialise au prochain build. Toucher une vraie modif suffit (déjà fait par ce patch).

- [ ] **Step 7: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur-3): champs moteur identite + compromis (deterministes, hors score)"
```

---

## Task 2: Sonde de lecture sur de vrais trios (gate data)

**Files:**
- Create: `scripts/sonde-comparateur-3.mjs`

- [ ] **Step 1: Vérifier le dev**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ou-vivre`
Expected: `200`.

- [ ] **Step 2: Écrire la sonde**

Create `scripts/sonde-comparateur-3.mjs` :

```js
// Sonde du révélateur d'arbitrages : pour des projets réels, imprime par commune
// l'identite (promesse), les 2 forces (reason confirmation + signal découverte) et
// le compromis. Sert à calibrer la table d'archétypes et les phrases de compromis.
// Usage : node scripts/sonde-comparateur-3.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme près de la mer pour ma retraite, avec de bons médecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'été.",
  "Élever mes enfants dans un environnement sain, sans être isolé des services.",
  "Vivre sans voiture, dans une ville qui attire de nouveaux habitants.",
  "Rester dans le Sud sans subir les canicules, près de la nature.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const { parsed } = await pr.json();
  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  if (!mr.ok) return { text, error: `match ${mr.status}` };
  const out = await mr.json();
  return { text, top: (out.results ?? []).slice(0, 3) };
}

async function main() {
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET » " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    for (const c of r.top) {
      const signaux = Object.values(c.signaux ?? {});
      console.log(`\n  ${c.nom}`);
      console.log(`    identité : ${c.identite}`);
      console.log(`    force 1  : ${c.reasons?.[0] ?? "(aucune)"}`);
      console.log(`    découv.  : ${signaux[0] ?? "(aucun signal)"}`);
      console.log(`    compromis: ${c.compromis}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Lancer la sonde et lire les sorties**

Run: `node scripts/sonde-comparateur-3.mjs`
Expected : pour chaque commune, une identité « Pour… » plausible et non répétitive d'un trio à l'autre, une force 1 (reason) et une découverte (signal) distinctes, un compromis toujours présent et honnête. Repérer : identités identiques en série (affiner la table d'archétypes Task 1 Step 2), compromis incohérents (ajuster `COMPROMIS_NEG`/seuil 12), découverte manquante fréquente (acceptable, repli sur reason[1] géré côté client Task 3).

- [ ] **Step 4: Calibrer si besoin (jugement, porteur absent)**

Si des sorties sonnent faux : ajuster la table d'archétypes ou `COMPROMIS_NEG` dans `comparateur-vie.ts`, relancer la sonde. Documenter les sorties finales dans le message de fin de session pour relecture porteur.

- [ ] **Step 5: Commit**

```bash
git add scripts/sonde-comparateur-3.mjs src/lib/comparateur-vie.ts
git commit -m "chore(comparateur-3): sonde lecture trios + calibrage archetypes/compromis"
```

---

## Task 3: Composant CompareView (présentation pure)

**Files:**
- Create: `src/app/(public)/ou-vivre/CompareView.tsx`

- [ ] **Step 1: Écrire le composant**

Create `src/app/(public)/ou-vivre/CompareView.tsx` :

```tsx
"use client";

import type { MatchResult } from "@/lib/comparateur-vie";

// Révélateur d'arbitrages : 3 blocs (identité → 2 forces → 1 compromis), sans
// chiffre ni score. Présentation pure de outcome. cf. spec 2026-06-05-comparateur-3.

type Props = {
  results: MatchResult[];
  onBack: () => void;
  onExploreReport: (r: MatchResult, rang: number) => void;
  onPackDecision: () => void;
};

// Forces : 1 confirmation (reason[0]) + 1 découverte (1er signal ambiant, non
// demandé). Repli : si pas de découverte, reason[1]. Dédup si identiques.
function forces(r: MatchResult): string[] {
  const confirmation = r.reasons?.[0] ?? null;
  const signaux = Object.values(r.signaux ?? {});
  const decouverte = signaux[0] ?? r.reasons?.[1] ?? null;
  const out: string[] = [];
  if (confirmation) out.push(confirmation);
  if (decouverte && decouverte !== confirmation) out.push(decouverte);
  return out.slice(0, 2);
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function CompareView({ results, onBack, onExploreReport, onPackDecision }: Props) {
  const trio = results.slice(0, 3);
  return (
    <div className="pt-10">
      <button
        onClick={onBack}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir aux territoires
      </button>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
        Ce qui les distingue
      </p>
      <h2
        className="font-normal text-[clamp(24px,3.4vw,34px)] leading-[1.15] tracking-[-0.6px] text-label mb-9"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Les trois pourraient convenir à votre projet.{" "}
        <span className="italic text-accent">Mais ils ne racontent pas la même histoire.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trio.map((r, i) => (
          <div key={r.insee} className="glass rounded-2xl p-6 flex flex-col">
            <h3
              className="font-normal text-[20px] leading-[1.2] text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {r.nom}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-accent italic">
              {r.identite}
            </p>
            <ul className="mt-4 space-y-2">
              {forces(r).map((f) => (
                <li key={f} className="text-[13.5px] leading-[1.55] text-label flex gap-2">
                  <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                  <span>{cap(f)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 pt-3 border-t border-white/[0.08] text-[13px] leading-[1.55] text-muted">
              {r.compromis}
            </p>
            <button
              onClick={() => onExploreReport(r, i + 1)}
              className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.14] hover:border-white/[0.28] text-[13px] text-label transition-colors"
            >
              Débloquer le rapport de {r.nom}
              <span aria-hidden>→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Placeholder Pack Décision : élargir + trancher (produit non construit) */}
      <div
        className="mt-8 glass rounded-2xl p-7"
        style={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
      >
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">
          Bientôt · Pack Décision
        </p>
        <h3
          className="font-normal text-[20px] leading-[1.2] text-label"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Aller au bout de la décision.
        </h3>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-muted max-w-[620px]">
          Les 3 rapports détaillés, plus jusqu&apos;à 3 nouvelles idées de territoires pour le
          même projet et un rapport supplémentaire offert.
        </p>
        <button
          onClick={onPackDecision}
          className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Me prévenir au lancement
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit 2>&1 | grep -i "CompareView" || echo "tsc OK CompareView"`
Expected: `tsc OK CompareView`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/ou-vivre/CompareView.tsx"
git commit -m "feat(comparateur-3): composant CompareView (3 blocs arbitrage, sans chiffre)"
```

---

## Task 4: Câblage dans OuVivreClient (bascule, repointage CTA, analytics)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`

- [ ] **Step 1: Importer CompareView**

Après les imports existants (vers la ligne 12), ajouter :

```tsx
import { CompareView } from "./CompareView";
```

- [ ] **Step 2: Ajouter l'état de bascule**

Près des autres `useState` (vers la ligne 141-152), ajouter :

```tsx
  const [view, setView] = useState<"results" | "compare">("results");
```

- [ ] **Step 3: Remplacer le bloc CTA « Comparer » par une bascule**

Remplacer le bloc `compareHref` (lignes ~501-509) par un simple garde (on garde la condition « au moins 2 territoires ») :

```tsx
  const canCompare = top.length >= 2;
```

Et remplacer le handler `onCompare` (ligne ~511) :

```tsx
  const onCompare = () => {
    capture("life_compare_clicked", { count: top.length });
    setView("compare");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
```

- [ ] **Step 4: Repointer le CTA (de <a href> vers <button>)**

Dans le bloc « Décider : pont vers la comparaison » (lignes ~1145-1176), changer la condition `compareHref &&` en `canCompare &&`, et remplacer le `<a href={compareHref} onClick={onCompare} ...>` par un `<button onClick={onCompare} ...>` (mêmes classes, sans `href`) :

```tsx
              <button
                onClick={onCompare}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Comparer ces territoires
                <span aria-hidden>→</span>
              </button>
```

- [ ] **Step 5: Rendre CompareView quand view === "compare"**

Au début du `return (` du composant (juste après `<div className="pt-16">`, ligne ~604), insérer un court-circuit : si `view === "compare"` et qu'on a des résultats, afficher CompareView à la place du flux résultats.

Trouver `const outcome = ...` / la variable des résultats (le tableau passé à `topCards`). Insérer, juste avant le `return` principal :

```tsx
  if (view === "compare" && outcome?.results?.length) {
    return (
      <div className="pt-16">
        <CompareView
          results={outcome.results}
          onBack={() => setView("results")}
          onExploreReport={(r, rang) => {
            onExplore(r, rang);
            window.location.href = `/territoire/${r.insee}/debloquer?nom=${encodeURIComponent(r.nom)}&rank=${rang}&source=comparateur_3`;
          }}
          onPackDecision={() => capture("pack_decision_waitlist_clicked", { count: top.length })}
        />
      </div>
    );
  }
```

(Adapter `outcome` au nom réel de la variable d'état des résultats si différent ; c'est l'objet `MatchOutcome` retourné par `/match`, déjà en state.)

- [ ] **Step 6: Vérifier la compilation et le lint**

Run: `npx tsc --noEmit 2>&1 | grep -i "OuVivreClient" || echo "tsc OK"`
Expected: `tsc OK`.
Run: `npx eslint "src/app/(public)/ou-vivre/OuVivreClient.tsx" "src/app/(public)/ou-vivre/CompareView.tsx"`
Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(comparateur-3): bascule vue compare + repointage CTA + analytics"
```

---

## Task 5: Vérification de bout en bout

**Files:** aucun (vérif)

- [ ] **Step 1: Garde-fou tiret cadratin sur les fichiers touchés**

Run: `grep -n "—" "src/app/(public)/ou-vivre/CompareView.tsx" src/lib/comparateur-vie.ts "src/app/(public)/ou-vivre/OuVivreClient.tsx" | grep -v "^.*://"`
Expected : aucune nouvelle occurrence en prose dans les zones ajoutées (les commentaires préexistants de comparateur-vie.ts/OuVivreClient sont hors patch).

- [ ] **Step 2: Vérif rendu live (parcours réel)**

Lancer une recherche réelle puis le CTA via curl du parse+match, et vérifier que `identite`/`compromis` sortent côté API (le rendu client de la bascule se vérifie au navigateur) :

Run: `curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H "content-type: application/json" -d '{"text":"Un coin calme près de la mer pour ma retraite, avec de bons médecins."}' | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",async()=>{const {parsed}=JSON.parse(d);const m=await fetch("http://localhost:3000/api/comparateur-vie/match",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({parsed})});const o=await m.json();for(const r of o.results.slice(0,3))console.log(r.nom,"|",r.identite,"|",r.compromis);})'`
Expected : 3 lignes avec une identité « Pour… » et un compromis non vide chacune.

- [ ] **Step 3: Vérif navigateur (manuelle)**

Ouvrir `http://localhost:3000/ou-vivre`, lancer un projet, cliquer « Comparer ces territoires » : la vue bascule sur les 3 blocs (identité, 2 forces, compromis), le bouton « Revenir aux territoires » ramène au flux, les CTA rapport et le placeholder Pack Décision s'affichent. Aucun chiffre, aucun score.

- [ ] **Step 4: État git (PAS de push)**

Run: `git log --oneline -6 && git status --short`
Expected : commits du chantier sur `feat/comparateur-3-communes`, working tree propre. NE PAS merger/pousser sur main (attendre « push sur main » du porteur).

---

## Self-Review

**Spec coverage :**
- Zéro score, compromis toujours présent → Task 1 (assignCompromis) + Task 3 (rendu). ✓
- Identité promesse de vie déterministe par archétype → Task 1 (buildIdentite). ✓
- 2 forces (confirmation reason + découverte signal) → Task 3 (forces()). ✓
- Phrase de cadrage « pourraient convenir… pas la même histoire » → Task 3. ✓
- Vue en place, repointage CTA → Task 4. ✓
- Génération 100 % déterministe → Task 1 (aucune IA). ✓
- Résolution : rapport par territoire + placeholder Pack Décision (élargir + trancher) → Task 3 + Task 4. ✓
- Instrumentation (compare/rapport/pack) → Task 4 (capture). ✓
- Fallback similaire → assignCompromis « sans faiblesse marquée » + forces repli. ✓ (la phrase « se ressemblent beaucoup » globale est optionnelle ; couverte par les compromis individuels, suffisant V1.)
- Hors-scope (ancien /comparateur, SKU Pack réel, chiffres, wizard, route dédiée, scoring) → respecté. ✓
- Gate sonde → Task 2. ✓

**Placeholder scan :** la table d'archétypes est une table de départ concrète (code complet), calibrée en Task 2 ; pas de TODO. `outcome` est nommé « à adapter si la variable d'état diffère » : à confirmer à l'exécution (lecture de OuVivreClient state). Aucun autre flou.

**Type consistency :** `MatchResult.identite: string` + `.compromis: string` posés Task 1, lus Task 3 (`r.identite`, `r.compromis`) et Task 2 (sonde). `buildIdentite(c: IndexCommune)`, `assignCompromis(shownPicks, byInsee)`, `tailleLabel(pop)` cohérents. `PreferenceKey` et `subScore` réutilisés (existants). ✓

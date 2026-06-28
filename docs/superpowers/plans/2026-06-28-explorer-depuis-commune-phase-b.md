# Explorer à partir d'une commune — Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sur l'écran idle de `/ou-vivre`, permettre de partir d'une commune aimée, voir les traits lus, en retirer, puis lancer le trio habituel.

**Architecture:** Un endpoint serveur unique `/api/comparateur-vie/anchor` fait toute la dérivation + l'assemblage du `ParsedProject` (pas de duplication client de la phraséologie). Le client (bloc dépliant `AnchorAmorce` + `CommuneSearch` doté d'un `onSelect`) n'affiche que des chips retirables et, au lancement, passe le `parsed` reçu dans le chemin `setParsed` + `runMatch` existant. Aucun changement du moteur ni de l'aval (synthèse, AskFuture, session).

**Tech Stack:** Next.js (App Router, route handler `nodejs`), React (client component), TypeScript. Réutilise `deriveAnchorPreferences` / `anchorReformulationSuffix` / `getCommuneEntry` (Phase A) et `/api/comparateur-vie/match`.

## Global Constraints

- **Doctrine ANCRAGE ≠ similarité** : mot « similaire » BANNI en sortie ; aucun score affiché ; moteur (`matchProjects`) inchangé.
- **Retrait seul** (option C) : pas d'ajout manuel de critères ; **mono-ancre** (une commune).
- **Placement** : lien discret dépliant, sous les puces d'exemples, `phase === "idle"` uniquement (pas l'accueil).
- **Assemblage serveur** : le client ne compose ni reformulation ni `ParsedProject` ; il consomme la sortie de `/anchor`.
- **Voix `/ou-vivre`** : vouvoiement, AUCUN tiret cadratin (`—`), pas de point d'exclamation, `bindOrphans` sur les phrases.
- **Non-régression `CommuneSearch`** : sans la prop `onSelect`, comportement actuel (navigation) strictement inchangé (territoires / chaleur / inondation).
- **Vérification** : pas de framework de test (décision porteur) ; endpoint vérifié au curl, UI vérifiée en runtime + `tsc`.
- **tsc** : erreur pré-existante `.next/types/validator.ts` (`suivi-bientot`) SANS rapport — l'ignorer.
- **Sentinel taille** : la puce de gabarit de taille porte la clé `"__size"` (cohérente endpoint ↔ client).

---

### Task 1: Endpoint `/api/comparateur-vie/anchor`

**Files:**
- Create: `src/app/api/comparateur-vie/anchor/route.ts`

**Interfaces:**
- Consumes (Phase A, déjà exportés) : `getCommuneEntry(insee): Promise<IndexCommune | null>`, `deriveAnchorPreferences(entries): AnchorDerivation` (`{ preferences: Preference[]; communeSize: {min,max}|null; traits: {key,text}[] }`), `anchorReformulationSuffix(labels, traits): string`, type `ParsedProject`.
- Produces : `POST { insee: string, removedKeys?: string[] }` → `{ found: boolean, nom: string, chips: {key:string,text:string}[], parsed: ParsedProject }`. Sentinel taille = `"__size"`.

- [ ] **Step 1 : Créer le route handler**

Créer `src/app/api/comparateur-vie/anchor/route.ts` :

```ts
// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · ANCHOR (Phase B — entrée guidée « partez d'une commune »)
// POST { insee, removedKeys? } -> dérivation d'ancre assemblée en ParsedProject
// (préférences gardées + reformulation honnête + exclusion de l'ancre), prête pour
// /match. Toute la phraséologie et l'assemblage restent serveur (pas de duplication
// client). ANCRAGE, pas similarité ; moteur inchangé. cf. spec Phase B.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import {
  getCommuneEntry,
  deriveAnchorPreferences,
  anchorReformulationSuffix,
  type ParsedProject,
} from "@/lib/comparateur-vie";

export const runtime = "nodejs";

const SIZE_KEY = "__size";

export async function POST(request: NextRequest) {
  let insee: string;
  let removedKeys: string[];
  try {
    const body = await request.json();
    insee = String(body?.insee ?? "");
    removedKeys = Array.isArray(body?.removedKeys) ? body.removedKeys.map(String) : [];
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!insee.trim()) {
    return NextResponse.json({ error: "Commune manquante." }, { status: 400 });
  }

  // PLM par arrondissement / code commune hors index : ancre illisible (cf. cas limites).
  const entry = await getCommuneEntry(insee.trim());
  if (!entry) {
    return NextResponse.json({
      found: false,
      nom: "",
      chips: [],
      parsed: { reformulation: "", hardConstraints: {}, preferences: [] } as ParsedProject,
    });
  }

  const removed = new Set(removedKeys);
  const deriv = deriveAnchorPreferences([entry]);

  const preferences = deriv.preferences.filter((p) => !removed.has(p.key));
  const traits = deriv.traits.filter((t) => !removed.has(t.key));
  const keepSize = deriv.communeSize != null && !removed.has(SIZE_KEY);

  // chips affichées : traits gardés (keyés) + puce taille en dernier si gardée.
  const chips: { key: string; text: string }[] = traits.map((t) => ({ key: t.key, text: t.text }));
  if (keepSize) chips.push({ key: SIZE_KEY, text: `~ taille de ${entry.nom}` });

  const parsed: ParsedProject = {
    reformulation: anchorReformulationSuffix([entry.nom], traits.map((t) => t.text)),
    hardConstraints: {
      excludePlace: [{ label: entry.nom }],
      ...(keepSize ? { communeSize: deriv.communeSize } : {}),
    },
    preferences,
    communeAncre: [{ label: entry.nom }],
  };

  return NextResponse.json({ found: true, nom: entry.nom, chips, parsed });
}
```

- [ ] **Step 2 : Lancer le serveur de dev**

Run (arrière-plan) : `npm run dev`. Attendre « Ready ». Port 3000.

- [ ] **Step 3 : Vérifier l'endpoint (cas nominal Brest = insee 29019)**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/anchor \
  -H 'content-type: application/json' -d '{"insee":"29019"}' | python3 -m json.tool
```
Attendu : `found:true`, `nom:"Brest"`, `chips` = traits de vie (mobilité, vie locale, étudiant, bord de mer) + une puce `{"key":"__size","text":"~ taille de Brest"}` en dernier ; `parsed.hardConstraints.excludePlace=[{"label":"Brest"}]`, `parsed.hardConstraints.communeSize` présent, `parsed.preferences` non vide, `parsed.reformulation` SANS « similaire ».

- [ ] **Step 4 : Vérifier le retrait (mer et taille)**

Run :
```bash
echo "--- sans la mer ---"
curl -s -X POST http://localhost:3000/api/comparateur-vie/anchor \
  -H 'content-type: application/json' -d '{"insee":"29019","removedKeys":["proximite_mer"]}' \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("chips:",[c["key"] for c in d["chips"]]);print("prefs:",[p["key"] for p in d["parsed"]["preferences"]]);print("mer dans reformulation?","OUI" if "mer" in d["parsed"]["reformulation"].lower() else "non")'
echo "--- sans la taille ---"
curl -s -X POST http://localhost:3000/api/comparateur-vie/anchor \
  -H 'content-type: application/json' -d '{"insee":"29019","removedKeys":["__size"]}' \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("chips:",[c["key"] for c in d["chips"]]);print("communeSize:",d["parsed"]["hardConstraints"].get("communeSize"))'
```
Attendu : sans la mer → `proximite_mer` absent des chips ET de `parsed.preferences` ET « mer » absent de la reformulation. Sans la taille → pas de puce `__size`, `communeSize` absent de `parsed.hardConstraints`.

- [ ] **Step 5 : Vérifier PLM / introuvable**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/anchor \
  -H 'content-type: application/json' -d '{"insee":"75101"}' | python3 -m json.tool
```
Attendu : `found:false`, `chips:[]` (Paris 1er arrondissement, hors index).

- [ ] **Step 6 : Vérifier le bout-en-bout anchor → match**

Run :
```bash
A=$(curl -s -X POST http://localhost:3000/api/comparateur-vie/anchor \
  -H 'content-type: application/json' -d '{"insee":"29019","removedKeys":["proximite_mer"]}')
echo "$A" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(json.dumps({"parsed":d["parsed"]}))' \
  | curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
    -H 'content-type: application/json' --data-binary @- \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("TRIO:",", ".join("%s(%s)"%(r["nom"],r["dept"]) for r in d.get("results",[])));print("Brest présent?","OUI" if any("brest" in r["nom"].lower() for r in d.get("results",[])) else "non")'
```
Attendu : un trio cohérent porté par les traits gardés, **Brest absent** (exclu), et — la mer ayant été retirée — un trio **non contraint au littoral**.

- [ ] **Step 7 : Commit**

```bash
git add src/app/api/comparateur-vie/anchor/route.ts
git commit -m "feat(comparateur): endpoint /anchor (Phase B — dérivation d'ancre assemblée)

POST { insee, removedKeys? } -> { found, nom, chips, parsed }. Assemble le
ParsedProject serveur (préférences gardées, reformulation honnête, exclusion de
l'ancre) ; retrait par clé (traits, préférences, gabarit __size). PLM/hors index
-> found:false. Moteur inchangé.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `CommuneSearch` — prop `onSelect` (callback au lieu de navigation)

**Files:**
- Modify: `src/components/CommuneSearch.tsx` (interface props ~ligne 14, `handleSelect` ~ligne 66)

**Interfaces:**
- Produces : prop optionnelle `onSelect?: (commune: { code: string; nom: string }) => void`. Quand fournie, `handleSelect` appelle `onSelect` au lieu de `router.push`. `slug` devient optionnel.

- [ ] **Step 1 : Ajouter `onSelect` et rendre `slug` optionnel dans l'interface**

Dans `src/components/CommuneSearch.tsx`, remplacer l'interface :

```ts
interface CommuneSearchProps {
  slug: string;
  accent?: string;
  placeholder?: string;
  basePath?: string; // ex: '/chaleur' — override du chemin de destination
}
```
par :
```ts
interface CommuneSearchProps {
  slug?: string;
  accent?: string;
  placeholder?: string;
  basePath?: string; // ex: '/chaleur' — override du chemin de destination
  // Si fourni, on appelle ce callback au choix d'une commune AU LIEU de naviguer
  // (utilisé par l'amorce « partez d'une commune » de /ou-vivre, Phase B).
  onSelect?: (commune: { code: string; nom: string }) => void;
}
```

- [ ] **Step 2 : Brancher `onSelect` dans la signature et `handleSelect`**

Dans le même fichier, remplacer la déstructuration des props :
```ts
export function CommuneSearch({
  slug,
  accent = '#60a5fa',
  placeholder = 'Saisissez votre commune…',
  basePath,
}: CommuneSearchProps) {
```
par :
```ts
export function CommuneSearch({
  slug,
  accent = '#60a5fa',
  placeholder = 'Saisissez votre commune…',
  basePath,
  onSelect,
}: CommuneSearchProps) {
```

Puis remplacer `handleSelect` :
```ts
  function handleSelect(commune: CommuneResult) {
    setOpen(false);
    setValue(commune.nom);
    startTransition(() => {
      router.push(basePath ? `${basePath}/${commune.code}` : `/territoires/${slug}/${commune.code}`);
    });
  }
```
par :
```ts
  function handleSelect(commune: CommuneResult) {
    setOpen(false);
    setValue(commune.nom);
    if (onSelect) {
      onSelect({ code: commune.code, nom: commune.nom });
      return;
    }
    startTransition(() => {
      router.push(basePath ? `${basePath}/${commune.code}` : `/territoires/${slug}/${commune.code}`);
    });
  }
```

- [ ] **Step 3 : Vérifier la non-régression (compilation + usages existants)**

Run : `npx tsc --noEmit 2>&1 | grep -v "suivi-bientot" | grep -v "^$" || echo "OK"`
Attendu : `OK` (aucune nouvelle erreur). Les usages existants (`/territoires/[slug]`, `/chaleur`, `/inondation`) passent `slug` et pas `onSelect` → chemin de navigation inchangé.

- [ ] **Step 4 : Commit**

```bash
git add src/components/CommuneSearch.tsx
git commit -m "feat(CommuneSearch): prop onSelect optionnelle (callback au lieu de navigation)

Permet de réutiliser l'autocomplete commune sans router.push (amorce Phase B de
/ou-vivre). Sans onSelect, comportement de navigation strictement inchangé.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Bloc `AnchorAmorce` + branchement dans `OuVivreClient`

**Files:**
- Create: `src/app/(public)/ou-vivre/AnchorAmorce.tsx`
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (runMatch ~ligne 377 ; nouveau callback ; rendu sous les exemples ~ligne 800 ; import)

**Interfaces:**
- Consumes : endpoint `/api/comparateur-vie/anchor` (Task 1), `CommuneSearch` avec `onSelect` (Task 2), type `ParsedProject`, `bindOrphans`.
- Produces : `AnchorAmorce({ onLaunch })` où `onLaunch: (parsed: ParsedProject, nom: string) => void`. `OuVivreClient` branche `onLaunch` sur un reset d'aval + `setParsed` + `setSubmittedText` + `runMatch(override)`.

- [ ] **Step 1 : Créer le composant `AnchorAmorce`**

Créer `src/app/(public)/ou-vivre/AnchorAmorce.tsx` :

```tsx
"use client";

// Amorce « Partez d'une commune que vous aimez » (Phase B). Lien discret -> se déplie
// en autocomplete + traits lus RETIRABLES + lancement. Toute la dérivation/assemblage
// est serveur (/api/comparateur-vie/anchor) ; ici on n'affiche que des chips et on relaie
// le ParsedProject reçu. Voix /ou-vivre. cf. spec Phase B.

import { useState } from "react";
import { CommuneSearch } from "@/components/CommuneSearch";
import { bindOrphans } from "@/lib/typography";
import type { ParsedProject } from "@/lib/comparateur-vie";

type Chip = { key: string; text: string };

export function AnchorAmorce({
  onLaunch,
}: {
  onLaunch: (parsed: ParsedProject, nom: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<{ code: string; nom: string } | null>(null);
  const [chips, setChips] = useState<Chip[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [found, setFound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);

  async function fetchAnchor(insee: string, removedKeys: string[]) {
    const r = await fetch("/api/comparateur-vie/anchor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insee, removedKeys }),
    });
    return r.json();
  }

  async function handleSelect(commune: { code: string; nom: string }) {
    setSelected(commune);
    setRemoved(new Set());
    setLoading(true);
    try {
      const data = await fetchAnchor(commune.code, []);
      setFound(!!data.found);
      setChips(data.found ? (data.chips ?? []) : []);
    } catch {
      setFound(false);
      setChips([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleRemove(key: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function launch() {
    if (!selected) return;
    setLaunching(true);
    try {
      const data = await fetchAnchor(selected.code, [...removed]);
      if (data.found && data.parsed) onLaunch(data.parsed as ParsedProject, data.nom as string);
    } finally {
      setLaunching(false);
    }
  }

  const visibleCount = chips.filter((c) => !removed.has(c.key)).length;
  const canLaunch = !!selected && found && visibleCount > 0 && !launching;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-4 text-[13px] text-muted hover:text-label no-underline transition-colors"
        style={{ fontFamily: "'Instrument Sans', sans-serif" }}
      >
        Pas d&apos;idée ? Partez d&apos;une commune que vous aimez <span aria-hidden>→</span>
      </button>
    );
  }

  return (
    <div className="mt-4 glass rounded-2xl p-5">
      <CommuneSearch
        onSelect={handleSelect}
        placeholder="Saisissez une commune que vous aimez…"
      />
      {loading && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-ghost">Lecture de la commune…</p>
      )}
      {selected && !loading && !found && (
        <p className="mt-3 text-[13px] leading-[1.7] text-muted">
          {bindOrphans("Je n'ai pas pu lire cette commune ; décrivez plutôt ce que vous cherchez ci-dessus.")}
        </p>
      )}
      {selected && found && chips.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] text-muted mb-2">{bindOrphans(`À ${selected.nom}, ce qui ressort :`)}</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const off = removed.has(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleRemove(c.key)}
                  aria-pressed={!off}
                  className={`text-[12px] rounded-full px-3 py-1.5 border transition-colors ${
                    off
                      ? "border-white/[0.08] text-ghost line-through"
                      : "border-white/[0.18] text-label hover:border-white/[0.3]"
                  }`}
                  style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                >
                  {c.text} <span aria-hidden>{off ? "↺" : "✕"}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={launch}
              disabled={!canLaunch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
              {launching ? "Analyse en cours…" : "Explorer dans cet esprit"} <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Donner à `runMatch` un override (éviter le state périmé)**

Dans `src/app/(public)/ou-vivre/OuVivreClient.tsx`, remplacer le début de `runMatch` :
```ts
  const runMatch = useCallback(async () => {
    if (!parsed) return;
    const seq = ++runSeq.current;
    capture("life_project_confirmed");

    setPhase("matching");
    let matchOutcome: MatchOutcome;
    try {
      const r = await fetch("/api/comparateur-vie/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed }),
      });
```
par :
```ts
  const runMatch = useCallback(async (override?: { parsed: ParsedProject; submittedText: string }) => {
    const proj = override?.parsed ?? parsed;
    const subText = override?.submittedText ?? submittedText;
    if (!proj) return;
    const seq = ++runSeq.current;
    capture("life_project_confirmed");

    setPhase("matching");
    let matchOutcome: MatchOutcome;
    try {
      const r = await fetch("/api/comparateur-vie/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: proj }),
      });
```

Puis, dans le même `runMatch`, remplacer l'appel de synthèse :
```ts
      void streamSynthesis(seq, submittedText, parsed, top, {
```
par :
```ts
      void streamSynthesis(seq, subText, proj, top, {
```
(La liste de dépendances `}, [parsed, submittedText, streamSynthesis]);` reste inchangée.)

- [ ] **Step 3 : Ajouter le callback `launchFromAnchor`**

Dans `OuVivreClient`, juste APRÈS la définition de `refine` (le `useCallback` qui se termine `}, []);` vers la ligne 436), insérer :
```ts
  // Lancement depuis l'amorce commune (Phase B) : on reçoit un ParsedProject déjà
  // assemblé par /anchor, on réinitialise l'aval comme un nouveau projet, puis on passe
  // directement au matching (on saute l'étape "confirm"). cf. spec Phase B.
  const launchFromAnchor = useCallback(
    (p: ParsedProject, nom: string) => {
      setOutcome(null);
      setSynthesis("");
      setAskMessages([]);
      setAskInput("");
      setAskRemaining(FREE_ASK);
      setAskLimit(false);
      setRoutesNudge(false);
      setErrorMsg(null);
      const subText = `une ville comme ${nom}`;
      setParsed(p);
      setSubmittedText(subText);
      setText(subText);
      capture("life_anchor_launched");
      void runMatch({ parsed: p, submittedText: subText });
    },
    [runMatch],
  );
```

- [ ] **Step 4 : Importer et rendre `AnchorAmorce` sous les exemples**

Dans `OuVivreClient.tsx`, ajouter en tête de fichier (près des autres imports locaux) :
```ts
import { AnchorAmorce } from "./AnchorAmorce";
```

Puis, juste APRÈS le bloc des exemples (le `{phase === "idle" && ( ... )}` qui se ferme `)}` après la liste `EXAMPLES.map`, vers la ligne 800), insérer :
```tsx
      {phase === "idle" && <AnchorAmorce onLaunch={launchFromAnchor} />}
```

- [ ] **Step 5 : Compilation**

Run : `npx tsc --noEmit 2>&1 | grep -v "suivi-bientot" | grep -v "^$" || echo "OK"`
Attendu : `OK` (aucune nouvelle erreur).

- [ ] **Step 6 : Vérifier le rendu de la page (runtime)**

S'assurer que `npm run dev` tourne. Run :
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ou-vivre
```
Attendu : `200`. (Le parcours cliquable complet — déplier l'amorce, choisir Brest, retirer une chip, lancer, voir le trio + la synthèse — est vérifié par le porteur dans le navigateur ; la logique de données est déjà couverte par Task 1 Step 6.)

- [ ] **Step 7 : Arrêter le serveur de dev et commit**

Run : arrêter `npm run dev` (`pkill -f "next dev"`).
```bash
git add "src/app/(public)/ou-vivre/AnchorAmorce.tsx" "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(ou-vivre): amorce « partez d'une commune » (Phase B)

Bloc dépliant AnchorAmorce sous les exemples (lien discret -> autocomplete +
traits lus retirables -> lancement). Branché sur /anchor puis setParsed + runMatch
(override pour éviter le state périmé) ; aval (synthèse, AskFuture, session)
réutilisé tel quel.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage :**
- Endpoint unique `/anchor` (entrée/sortie, retrait par clé, PLM→found:false, sentinel `__size`) → Task 1. ✓
- Assemblage serveur (préférences gardées, communeSize, excludePlace, reformulation via `anchorReformulationSuffix`) → Task 1 Step 1. ✓
- `CommuneSearch` `onSelect` + `slug` optionnel + non-régression → Task 2. ✓
- `AnchorAmorce` (lien discret dépliant, chips retirables, voix /ou-vivre, message PLM, bouton désactivé si tout retiré) → Task 3 Step 1. ✓
- Flux client 2 appels (select sans removedKeys, launch avec removedKeys) → Task 3 Step 1 (`handleSelect`/`launch`). ✓
- Branchement `setParsed` + `runMatch` + `submittedText="une ville comme {nom}"` sans toucher l'aval → Task 3 Steps 2-4. ✓
- Mono-ancre, retrait seul, placement idle-only → respectés (un seul `CommuneSearch`, pas d'ajout, rendu gated `phase==="idle"`). ✓
- Vérification sans framework (curl + runtime + tsc) → Tasks 1/2/3. ✓

**2. Placeholder scan :** aucun « TBD/TODO/handle edge cases » ; tout le code est écrit (endpoint, composant, edits). Insee de test fixés (Brest 29019 ; Paris 1er 75101).

**3. Type consistency :** `{ key, text }` pour chips et traits cohérent endpoint↔client ; sentinel `"__size"` identique des deux côtés ; `onLaunch(parsed: ParsedProject, nom: string)` défini en Task 3 Step 1 et appelé en Step 3 ; `runMatch(override?: { parsed, submittedText })` défini en Step 2 et appelé en Step 3 ; `onSelect: (commune: { code, nom }) => void` cohérent entre `CommuneSearch` (Task 2) et `AnchorAmorce.handleSelect` (Task 3).

---

## Execution Handoff

Plan complet, sauvegardé dans `docs/superpowers/plans/2026-06-28-explorer-depuis-commune-phase-b.md`.

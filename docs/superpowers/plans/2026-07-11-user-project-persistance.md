# Persistance du projet utilisateur — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sauvegarder au compte le projet libre saisi sur `/ou-vivre` (aujourd'hui perdu dans le `localStorage`), l'afficher et le rendre éditable sur `/rapport`, et permettre à qui n'a jamais fait `/ou-vivre` de le décrire.

**Architecture:** Un objet `UserProject` (lib pure, testée) persisté en colonne `jsonb` sur `user_profiles`, écrit via le `PATCH /api/profile` existant (merge par champ), synchronisé depuis `/ou-vivre` par un composant calqué sur `WizardAnswersSync`, affiché et édité sur `/rapport` par une carte cliente qui rappelle `/parse`.

**Tech Stack:** TypeScript, Next.js App Router, Supabase (Postgres jsonb), `node:test` + `node:assert/strict` (`node --test <fichier>`, Node 25 strippe les types), React 19.

**Spec:** `docs/superpowers/specs/2026-07-11-user-project-persistance-design.md`

## Global Constraints

- **`rawText` survit à `parsed`.** On garde toujours le texte libre, même si `/parse` échoue (`parsed: null`).
- **Ne jamais deviner.** `normalizeUserProject` rejette (`null`) ce qui n'est pas conforme, ne complète rien.
- **Le sync n'écrase jamais un projet existant** (`user_project_if_empty`). L'édition explicite (`user_project`) écrase toujours.
- **Fire-and-forget.** Le sync n'interrompt aucun parcours ; un échec laisse l'objet en `localStorage` et retente.
- **Silence honnête.** Sans projet, le hub reste lisible, l'invitation n'est jamais bloquante.
- **Postures :** `recherche` (remplie), `adresse`, `habitant`, `recherche_quartier` (réservées, payload non requis).
- **Typographie :** jamais de tiret cadratin (`—`). Virgule ou deux points.
- **Branche :** `feat/user-project-persistance` (déjà créée).

---

### Task 1: Lib pure `user-project.ts`

**Files:**
- Create: `src/lib/user-project.ts`
- Test: `src/lib/user-project.test.ts`

**Interfaces:**
- Consumes: `type ParsedProject` de `./comparateur-vie.ts` (déjà exporté, ligne 139).
- Produces:
  - `type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier"`
  - `type ProjectIntent = "achat" | "location"`
  - `type UserProject = { posture: ProjectPosture; intent?: ProjectIntent | null; rawText: string | null; parsed: ParsedProject | null; updatedAt: string }`
  - `function normalizeUserProject(raw: unknown): UserProject | null`
  - `function mergeProjectEdit(prev, next): UserProject`

- [ ] **Step 1: Write the failing test**

Create `src/lib/user-project.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProject, mergeProjectEdit, type UserProject } from "./user-project.ts";

const PARSED = { reformulation: "Vous cherchez une ville au calme, proche de la mer." } as never;

test("normalize : objet valide conservé", () => {
  const raw = { posture: "recherche", intent: null, rawText: "au calme près de la mer", parsed: PARSED, updatedAt: "2026-07-11T00:00:00.000Z" };
  const out = normalizeUserProject(raw);
  assert.equal(out?.posture, "recherche");
  assert.equal(out?.rawText, "au calme près de la mer");
  assert.ok(out?.parsed);
});

test("normalize : les quatre postures acceptées", () => {
  for (const posture of ["recherche", "adresse", "habitant", "recherche_quartier"]) {
    const out = normalizeUserProject({ posture, rawText: "x", parsed: null, updatedAt: "2026-07-11T00:00:00.000Z" });
    assert.equal(out?.posture, posture, `posture ${posture}`);
  }
});

test("normalize : posture inconnue -> null", () => {
  assert.equal(normalizeUserProject({ posture: "autre", rawText: "x", parsed: null, updatedAt: "z" }), null);
});

test("normalize : parsed malformé -> parsed null mais rawText gardé", () => {
  const out = normalizeUserProject({ posture: "recherche", rawText: "gardé", parsed: 42, updatedAt: "2026-07-11T00:00:00.000Z" });
  assert.equal(out?.parsed, null);
  assert.equal(out?.rawText, "gardé");
});

test("normalize : null / undefined / non-objet -> null", () => {
  assert.equal(normalizeUserProject(null), null);
  assert.equal(normalizeUserProject(undefined), null);
  assert.equal(normalizeUserProject("x"), null);
});

test("normalize : rawText absent -> null (rawText), reste valide", () => {
  const out = normalizeUserProject({ posture: "recherche", parsed: PARSED, updatedAt: "2026-07-11T00:00:00.000Z" });
  assert.equal(out?.rawText, null);
  assert.ok(out?.parsed);
});

test("merge : conserve posture/intent, réécrit rawText/parsed/updatedAt", () => {
  const prev: UserProject = { posture: "adresse", intent: "achat", rawText: "vieux", parsed: null, updatedAt: "2026-01-01T00:00:00.000Z" };
  const out = mergeProjectEdit(prev, { rawText: "neuf", parsed: PARSED });
  assert.equal(out.posture, "adresse");
  assert.equal(out.intent, "achat");
  assert.equal(out.rawText, "neuf");
  assert.ok(out.parsed);
  assert.notEqual(out.updatedAt, prev.updatedAt);
});

test("merge : prev null -> projet posture recherche par défaut", () => {
  const out = mergeProjectEdit(null, { rawText: "neuf", parsed: PARSED });
  assert.equal(out.posture, "recherche");
  assert.equal(out.rawText, "neuf");
});

test("merge : posture/intent explicites priment sur prev", () => {
  const prev: UserProject = { posture: "recherche", rawText: "x", parsed: null, updatedAt: "z" };
  const out = mergeProjectEdit(prev, { rawText: "y", parsed: null, posture: "adresse", intent: "location" });
  assert.equal(out.posture, "adresse");
  assert.equal(out.intent, "location");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/user-project.test.ts`
Expected: FAIL, `Cannot find module './user-project.ts'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/user-project.ts`:

```ts
// Projet de l'utilisateur, persisté au compte (colonne jsonb user_project sur user_profiles).
// Lib PURE (pas server-only) : normalise ce qui vient du client ou de la base, son TYPE est lu
// côté client par le hub. Ne devine jamais : un objet non conforme est rejeté (null), un `parsed`
// malformé retombe sur null en conservant le `rawText` (le texte libre survit au parse, comme la
// source DVF survit à sa version).

import type { ParsedProject } from "./comparateur-vie.ts";

export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location";

export type UserProject = {
  posture: ProjectPosture;
  intent?: ProjectIntent | null;
  rawText: string | null;
  parsed: ParsedProject | null;
  updatedAt: string;
};

const POSTURES: ProjectPosture[] = ["recherche", "adresse", "habitant", "recherche_quartier"];
const INTENTS: ProjectIntent[] = ["achat", "location"];

// `parsed` valide = objet portant au moins une `reformulation` string. On ne re-valide pas tout le
// ParsedProject ici (il a son propre producteur, /parse) : on garde ou on jette.
function coerceParsed(v: unknown): ParsedProject | null {
  if (v && typeof v === "object" && typeof (v as { reformulation?: unknown }).reformulation === "string") {
    return v as ParsedProject;
  }
  return null;
}

export function normalizeUserProject(raw: unknown): UserProject | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.posture !== "string" || !POSTURES.includes(r.posture as ProjectPosture)) return null;
  const intent = typeof r.intent === "string" && INTENTS.includes(r.intent as ProjectIntent) ? (r.intent as ProjectIntent) : null;
  return {
    posture: r.posture as ProjectPosture,
    intent,
    rawText: typeof r.rawText === "string" ? r.rawText : null,
    parsed: coerceParsed(r.parsed),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date(0).toISOString(),
  };
}

export function mergeProjectEdit(
  prev: UserProject | null,
  next: { rawText: string; parsed: ParsedProject | null; posture?: ProjectPosture; intent?: ProjectIntent | null },
): UserProject {
  return {
    posture: next.posture ?? prev?.posture ?? "recherche",
    intent: next.intent ?? prev?.intent ?? null,
    rawText: next.rawText,
    parsed: coerceParsed(next.parsed),
    updatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/user-project.test.ts`
Expected: PASS, `pass 9`, `fail 0`

*Note : `mergeProjectEdit` utilise `new Date()`. Ce n'est PAS dans un workflow-script (interdit là-bas), c'est du code applicatif normal : autorisé.*

- [ ] **Step 5: Commit**

```bash
git add src/lib/user-project.ts src/lib/user-project.test.ts
git commit -m "feat(compte): lib pure UserProject (normalize + merge)

Objet projet à 4 postures (recherche remplie, adresse/habitant/recherche_quartier
réservées). rawText survit au parse. normalizeUserProject rejette le non conforme,
ne devine jamais.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Migration SQL

**Files:**
- Create: `supabase/17_add_user_project.sql`

- [ ] **Step 1: Écrire la migration**

Create `supabase/17_add_user_project.sql` (calquée sur `14_add_wizard_answers.sql`) :

```sql
begin;

-- Projet de l'utilisateur (UserProject), persisté par compte. Amorcé par le texte libre de
-- /ou-vivre (posture "recherche", payload ParsedProject), éditable sur /rapport, comblé pour qui
-- n'a jamais fait /ou-vivre. Écriture via /api/profile (field "user_project" et
-- "user_project_if_empty"), lecture par /rapport. Forme : src/lib/user-project.ts.
alter table public.user_profiles
  add column if not exists user_project jsonb;

commit;
```

- [ ] **Step 2: Appliquer la migration**

L'appliquer sur la base de dev (selon le flux du projet : `supabase db push`, éditeur SQL, ou MCP Supabase `apply_migration`). Vérifier ensuite que la colonne existe.

Run (si CLI Supabase locale) : `supabase db push` puis vérifier `\d user_profiles` contient `user_project | jsonb`.
Expected: colonne `user_project` présente, nullable.

- [ ] **Step 3: Commit**

```bash
git add supabase/17_add_user_project.sql
git commit -m "feat(compte): migration colonne jsonb user_project

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Écriture serveur dans `/api/profile`

**Files:**
- Modify: `src/app/api/profile/route.ts` (bloc PATCH, après le cas `wizard_answers`)

**Interfaces:**
- Consumes: `normalizeUserProject` (Task 1), colonne `user_project` (Task 2).
- Produces: deux `field` PATCH acceptés : `"user_project"` (écrase) et `"user_project_if_empty"` (n'écrit que si nul).

- [ ] **Step 1: Ajouter l'import**

En tête de `src/app/api/profile/route.ts`, à côté des autres imports de types/libs :

```ts
import { normalizeUserProject } from "@/lib/user-project";
```

- [ ] **Step 2: Ajouter les deux cas dans le PATCH**

Juste après le bloc `if (field === "wizard_answers") { ... }` (repérable par sa structure), insérer :

```ts
    // Projet de l'utilisateur : édition explicite (écrase) depuis /rapport.
    if (field === "user_project") {
      const normalized = normalizeUserProject(body.value);
      if (!normalized) {
        return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
      }
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_project: normalized, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] PATCH user_project error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Projet de l'utilisateur : amorçage depuis /ou-vivre, n'écrit QUE si aucun projet en base
    // (ne jamais écraser un projet déjà édité). Retourne `written` pour l'observabilité.
    if (field === "user_project_if_empty") {
      const normalized = normalizeUserProject(body.value);
      if (!normalized) {
        return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("user_project")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing?.user_project) {
        return NextResponse.json({ success: true, written: false });
      }
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_project: normalized, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] PATCH user_project_if_empty error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      return NextResponse.json({ success: true, written: true });
    }
```

- [ ] **Step 3: Compiler et linter**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/app/api/profile/route.ts src/lib/user-project.ts`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/profile/route.ts
git commit -m "feat(compte): /api/profile écrit user_project (écrase) et user_project_if_empty (si vide)

Merge par champ (pattern wizard_answers). Le sync depuis /ou-vivre n'écrase jamais un
projet existant ; l'édition explicite écrase toujours. Payload normalisé côté serveur.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Sync `/ou-vivre` → compte

**Files:**
- Create: `src/components/OuVivreProjectSync.tsx`
- Modify: `src/app/(account)/rapport/page.tsx` (monter le composant, lui passer `hasServerProject`)

**Interfaces:**
- Consumes: la clé `localStorage` `"futuree:ouvivre:session"` (payload `{ parsed, ... , submittedText }` de `OuVivreClient.tsx`), le PATCH `user_project_if_empty` (Task 3).
- Produces: rien (composant sans rendu).

- [ ] **Step 1: Écrire le composant**

Create `src/components/OuVivreProjectSync.tsx` (calqué sur `WizardAnswersSync`) :

```tsx
"use client";

import { useEffect, useRef } from "react";

// Pousse le projet libre de /ou-vivre (localStorage) vers le compte, une seule fois, si le serveur
// n'en a pas encore. Monté sur /rapport. Sans rendu. Fire-and-forget : un échec laisse l'objet en
// localStorage et retente à la prochaine visite. /ou-vivre est public : la persistance a lieu ici,
// à la première page connectée, comme WizardAnswersSync.
const SESSION_KEY = "futuree:ouvivre:session";

export function OuVivreProjectSync({ hasServerProject }: { hasServerProject: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || hasServerProject) return;
    let payload: { parsed?: unknown; submittedText?: string } | null = null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
    if (!payload?.parsed) return; // rien de riche à sauvegarder
    done.current = true;
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: "user_project_if_empty",
        value: {
          posture: "recherche",
          intent: null,
          rawText: typeof payload.submittedText === "string" ? payload.submittedText : null,
          parsed: payload.parsed,
          updatedAt: new Date().toISOString(),
        },
      }),
    }).catch(() => {
      done.current = false; // retentera
    });
  }, [hasServerProject]);

  return null;
}
```

- [ ] **Step 2: Vérifier le nom exact du champ texte dans le payload localStorage**

Run: `grep -nE "submittedText|SESSION_KEY|localStorage.setItem" "src/app/(account)/../../app/(public)/ou-vivre/OuVivreClient.tsx" 2>/dev/null || grep -nE "submittedText|setItem\(SESSION" "src/app/(public)/ou-vivre/OuVivreClient.tsx"`
Expected: confirme que le payload sérialisé contient bien `submittedText` (sinon adapter le champ lu dans le composant au nom réel du texte libre).

- [ ] **Step 3: Monter le composant sur `/rapport`**

Dans `src/app/(account)/rapport/page.tsx`, là où le profil est déjà chargé (`profile` contient `wizard_answers`), étendre la sélection pour lire `user_project`, puis monter le sync près de `WizardAnswersSync`.

Étendre le `select` (repérer `select(\`${TERRITORY_SELECT}, wizard_answers\`)`) :

```ts
    .select(`${TERRITORY_SELECT}, wizard_answers, user_project`)
```

Ajouter l'import :

```ts
import { OuVivreProjectSync } from "@/components/OuVivreProjectSync";
```

Et, à côté de `<WizardAnswersSync ... />` :

```tsx
        <OuVivreProjectSync hasServerProject={Boolean(profile?.user_project)} />
```

- [ ] **Step 4: Compiler et linter**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/components/OuVivreProjectSync.tsx "src/app/(account)/rapport/page.tsx"`
Expected: aucune sortie.

- [ ] **Step 5: Commit**

```bash
git add src/components/OuVivreProjectSync.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(compte): sync du projet /ou-vivre vers le compte (non écrasant)

Calqué sur WizardAnswersSync : à la 1re page connectée, pousse le ParsedProject du
localStorage vers user_project_if_empty. Fire-and-forget.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Carte projet sur `/rapport` (affichage, comblement, édition)

**Files:**
- Create: `src/components/report/ProjectSummaryCard.tsx`
- Modify: `src/app/(account)/rapport/page.tsx` (rendre la carte en tête, lui passer le projet normalisé)

**Interfaces:**
- Consumes: `UserProject`, `normalizeUserProject` (Task 1) ; `/parse` (POST, existant) ; `/api/profile` `field: "user_project"` (Task 3).
- Produces: rien pour les tâches suivantes.

- [ ] **Step 1: Écrire la carte cliente**

Create `src/components/report/ProjectSummaryCard.tsx` :

```tsx
"use client";

import { useState } from "react";
import type { UserProject } from "@/lib/user-project";

// Carte « Votre projet » en tête du hub. Trois états : projet présent (reformulation + Affiner),
// absent (invitation non bloquante), édition (champ texte -> /parse -> /api/profile). rawText est
// conservé même si /parse échoue. La reformulation est corrigeable : la prémisse est réfutable.
export function ProjectSummaryCard({ initial }: { initial: UserProject | null }) {
  const [project, setProject] = useState<UserProject | null>(initial);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial?.rawText ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const raw = text.trim();
    if (!raw) return;
    setBusy(true);
    // 1) parse (best-effort). 2) persist. rawText survit à un parse en échec.
    let parsed: unknown = null;
    try {
      const r = await fetch("/api/comparateur-vie/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: raw }),
      });
      if (r.ok) parsed = (await r.json())?.parsed ?? (await Promise.resolve(null));
    } catch {
      parsed = null;
    }
    const value: UserProject = {
      posture: project?.posture ?? "recherche",
      intent: project?.intent ?? null,
      rawText: raw,
      parsed: (parsed && typeof parsed === "object") ? (parsed as UserProject["parsed"]) : null,
      updatedAt: new Date().toISOString(),
    };
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "user_project", value }),
      });
    } catch {
      // non bloquant : l'UI reflète quand même la saisie
    }
    setProject(value);
    setEditing(false);
    setBusy(false);
  }

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  if (!editing && project && reformulation) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 6px" }}>Votre projet</p>
        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>{reformulation}</p>
        <button type="button" onClick={() => { setText(project.rawText ?? ""); setEditing(true); }}
          style={{ marginTop: 10, background: "none", border: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: 13 }}>
          Affiner
        </button>
      </div>
    );
  }

  if (!editing && !project) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.6, margin: "0 0 10px" }}>
          Décrivez votre projet pour une lecture qui parle de votre situation.
        </p>
        <button type="button" onClick={() => setEditing(true)}
          style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 10, padding: "8px 14px", color: "var(--fg-1)", cursor: "pointer", fontSize: 14 }}>
          Décrire mon projet
        </button>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, color: "var(--fg-1)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button type="button" onClick={save} disabled={busy || !text.trim()}
          style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#060812", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: busy || !text.trim() ? 0.5 : 1 }}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button type="button" onClick={() => setEditing(false)}
            style={{ background: "none", border: "none", padding: 0, color: "var(--fg-4)", cursor: "pointer", fontSize: 13 }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le contrat de `/parse` (nom du champ d'entrée et de sortie)**

Run: `grep -nE "req.json|body\\.|query|texte|parsed|reformulation|NextResponse.json" src/app/api/comparateur-vie/parse/route.ts | head -20`
Expected: confirme le nom du champ d'entrée (attendu `query`) et que la réponse porte `parsed` (ou adapter le `body`/lecture dans la carte au contrat réel).

- [ ] **Step 3: Rendre la carte sur `/rapport`**

Dans `src/app/(account)/rapport/page.tsx`, normaliser le projet lu et rendre la carte en tête du contenu (au-dessus de la grille des modules).

Ajouter les imports :

```ts
import { ProjectSummaryCard } from "@/components/report/ProjectSummaryCard";
import { normalizeUserProject } from "@/lib/user-project";
```

Après la lecture du profil :

```ts
  const userProject = normalizeUserProject(profile?.user_project ?? null);
```

Rendre `<ProjectSummaryCard initial={userProject} />` en tête de la zone de contenu principale (juste après `<WizardAnswersSync />` / `<OuVivreProjectSync />`, avant la grille des modules). Choisir l'emplacement exact en lisant la structure JSX autour de la grille.

- [ ] **Step 4: Compiler et linter**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/components/report/ProjectSummaryCard.tsx "src/app/(account)/rapport/page.tsx"`
Expected: aucune sortie.

- [ ] **Step 5: Vérifier dans l'app**

Lancer `npm run dev`. Se connecter (compte de test). Sur `/rapport` sans projet : l'invitation s'affiche. Décrire un projet, enregistrer : la reformulation apparaît. Recharger : elle persiste. « Affiner », modifier, enregistrer : la reformulation change. Faire une recherche `/ou-vivre` en étant connecté, revenir sur `/rapport` : la reformulation y est sans re-saisie.

- [ ] **Step 6: Commit**

```bash
git add src/components/report/ProjectSummaryCard.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(compte): carte « Votre projet » sur le hub (affichage, comblement, édition)

Trois états : présent (reformulation + Affiner), absent (invitation non bloquante),
édition (texte -> /parse -> /api/profile). rawText survit à un parse en échec.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Vérification de bout en bout et vault

**Files:**
- Modify: `docs/vault/modules/` ou une note de doctrine (mention brève que le projet est désormais persisté au compte).

- [ ] **Step 1: Rejouer les tests de la lib**

Run: `node --test src/lib/user-project.test.ts`
Expected: `fail 0`.

- [ ] **Step 2: Contrôle statique global**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint src/lib/user-project.ts src/app/api/profile/route.ts src/components/OuVivreProjectSync.tsx src/components/report/ProjectSummaryCard.tsx "src/app/(account)/rapport/page.tsx"`
Expected: aucune sortie.

- [ ] **Step 3: Vérifier les 6 critères d'acceptation de la spec** (manuellement dans l'app), en insistant sur le non-écrasement : avec un projet déjà en base, refaire `/ou-vivre` ne doit PAS l'écraser (le sync passe par `user_project_if_empty`).

- [ ] **Step 4: Commit de clôture** (si une note de vault a été ajoutée)

```bash
git add -A docs/
git commit -m "docs: le projet utilisateur est persisté au compte (clé de voûte posée)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review

**Couverture de la spec.** Objet `UserProject` 4 postures + `normalize`/`merge` (Task 1). Colonne `jsonb` (Task 2). Écriture `user_project` (écrase) + `user_project_if_empty` (si vide) (Task 3). Sync `/ou-vivre` non écrasant (Task 4). Affichage + comblement + édition via `/parse`, `rawText` survivant (Task 5). Silence honnête et invitation non bloquante (Task 5, état « absent »). Vérification des 6 critères (Task 6). **Hors scope** (branchement génération, payloads adresse/habitant, multi-projet, auth `/ou-vivre`) : non traité, conforme.

**Deux vérifications de contrat portées dans le plan**, parce qu'elles dépendent de code que je n'ai pas relu ligne à ligne : le nom du champ texte dans le payload `localStorage` de `OuVivreClient` (Task 4 step 2) et le contrat d'entrée/sortie de `/parse` (Task 5 step 2). Si l'un diffère, l'étape le dit et l'implémenteur adapte le champ, sans changer la logique.

**Types.** `UserProject`, `ProjectPosture`, `ProjectIntent`, `normalizeUserProject`, `mergeProjectEdit` définis en Task 1, utilisés tels quels en Tasks 3, 4, 5. `field: "user_project"` / `"user_project_if_empty"` cohérents entre Task 3 (serveur), Task 4 (sync) et Task 5 (édition).

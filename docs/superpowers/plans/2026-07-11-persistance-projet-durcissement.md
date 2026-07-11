# Durcissement de la persistance du projet (prémisse fiable) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (exécution inline). Steps en `- [ ]`.

**Goal:** Rendre fiable l'objet `UserProject` persisté (la prémisse de toutes les conclusions personnalisées), en corrigeant six défauts relevés en revue du code déjà livré.

**Architecture:** Séparer l'ENTRÉE client (`UserProjectInput`) du PERSISTÉ (`UserProject`, estampillé serveur avec `schemaVersion` + `updatedAt`). Écriture `if_empty` atomique en SQL. Sauvegarde explicite honnête côté carte (jamais « enregistré » sans confirmation serveur). Aucune posture devinée (sélecteur léger).

**Tech Stack:** TypeScript, Next.js App Router, Supabase, tests `node --test`.

**Revue source :** les six points confirmés ligne par ligne (édition qui ment sur le succès ; carte non rafraîchie ; `if_empty` non atomique ; `rawText` sans `parsed` abandonné ; `mergeProjectEdit` mort/bogué ; posture devinée).

## Global Constraints

- **Ne jamais deviner.** Posture requise (rejet, jamais défaut `recherche`). Intent invalide → rejet, jamais coercition silencieuse. Absence de date → `null`, jamais 1970.
- **Ne jamais mentir sur le succès.** Une édition explicite n'affiche « enregistré » qu'après confirmation serveur (`response.ok`).
- **`rawText` survit à `parsed`.** Le texte libre est la source primaire.
- **Estampille serveur.** `updatedAt` et `schemaVersion` produits par le serveur, jamais par le client.
- Conventions : imports `.ts` en lib, `@/` en composant. FR sans tiret cadratin.

**Vérif :** `npx tsc --noEmit` · `node --test src/lib/user-project.test.ts`.

---

## Task 1: Contrat `UserProject` (Input/Persisté, versioning, sans mergeProjectEdit)

**Files:**
- Modify: `src/lib/user-project.ts`
- Modify: `src/lib/user-project.test.ts`

**Interfaces produced:** `UserProjectInput`, `UserProject` (avec `schemaVersion?: 1`, `updatedAt: string | null`), `normalizeUserProjectInput(raw): UserProjectInput | null`, `stampUserProject(input, now): UserProject`, `normalizeUserProject(raw): UserProject | null`. Suppression de `mergeProjectEdit`.

- [ ] **Step 1: Réécrire les tests** (remplacer les tests `merge` par les tests d'entrée)

Dans `src/lib/user-project.test.ts`, remplacer l'import et les tests `merge` :

```ts
import { normalizeUserProjectInput, normalizeUserProject, stampUserProject } from "./user-project.ts";
```

Retirer les trois tests `merge : ...`. Ajouter :

```ts
test("input : posture absente -> null (jamais de défaut)", () => {
  assert.equal(normalizeUserProjectInput({ rawText: "x", parsed: null }), null);
});

test("input : intent invalide -> rejet (jamais coercition)", () => {
  assert.equal(normalizeUserProjectInput({ posture: "recherche", intent: "peut-etre", rawText: "x", parsed: null }), null);
});

test("input : intent absent/null accepté", () => {
  assert.equal(normalizeUserProjectInput({ posture: "recherche", rawText: "x", parsed: null })?.intent, null);
});

test("input : rawText seul persistable, parsed null", () => {
  const out = normalizeUserProjectInput({ posture: "recherche", rawText: "au calme", parsed: null });
  assert.equal(out?.rawText, "au calme");
  assert.equal(out?.parsed, null);
});

test("stamp : le serveur pose schemaVersion et updatedAt", () => {
  const out = stampUserProject({ posture: "recherche", intent: null, rawText: "x", parsed: null }, "2026-07-11T10:00:00.000Z");
  assert.equal(out.schemaVersion, 1);
  assert.equal(out.updatedAt, "2026-07-11T10:00:00.000Z");
});

test("read : updatedAt absent -> null (jamais 1970)", () => {
  const out = normalizeUserProject({ posture: "recherche", rawText: "x", parsed: null });
  assert.equal(out?.updatedAt, null);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — `node --test src/lib/user-project.test.ts` → FAIL.

- [ ] **Step 3: Réécrire `src/lib/user-project.ts`**

```ts
// Projet de l'utilisateur, persisté au compte (colonne jsonb user_project). Lib PURE.
// On sépare l'ENTRÉE client (UserProjectInput) du PERSISTÉ (UserProject, estampillé serveur avec
// schemaVersion + updatedAt). Doctrine : on ne devine jamais (posture requise, intent invalide rejeté,
// date absente -> null jamais inventée) ; rawText survit à un parse en échec.
import type { ParsedProject } from "./comparateur-vie.ts";

export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location";

export type UserProjectInput = {
  posture: ProjectPosture;
  intent: ProjectIntent | null;
  rawText: string | null;
  parsed: ParsedProject | null;
};

export type UserProject = UserProjectInput & {
  schemaVersion?: 1;         // optionnel pour l'ergonomie de construction ; le serveur l'écrit toujours
  updatedAt: string | null;  // estampille serveur ; null = inconnue (jamais une date inventée)
};

const POSTURES: ProjectPosture[] = ["recherche", "adresse", "habitant", "recherche_quartier"];
const INTENTS: ProjectIntent[] = ["achat", "location"];

function coerceParsed(v: unknown): ParsedProject | null {
  if (v && typeof v === "object" && typeof (v as { reformulation?: unknown }).reformulation === "string") {
    return v as ParsedProject;
  }
  return null;
}

// Validation de l'ENTRÉE client. posture requise (rejet), intent absent/null OK / présent-invalide
// rejet, rawText absent/null OK / présent non-string rejet, parsed malformé -> null (rawText gardé).
export function normalizeUserProjectInput(raw: unknown): UserProjectInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.posture !== "string" || !POSTURES.includes(r.posture as ProjectPosture)) return null;
  let intent: ProjectIntent | null = null;
  if (r.intent != null) {
    if (typeof r.intent !== "string" || !INTENTS.includes(r.intent as ProjectIntent)) return null;
    intent = r.intent as ProjectIntent;
  }
  let rawText: string | null = null;
  if (r.rawText != null) {
    if (typeof r.rawText !== "string") return null;
    rawText = r.rawText;
  }
  return { posture: r.posture as ProjectPosture, intent, rawText, parsed: coerceParsed(r.parsed) };
}

// Estampille SERVEUR. Le temps vient de l'appelant (lib pure, testable).
export function stampUserProject(input: UserProjectInput, now: string): UserProject {
  return { ...input, schemaVersion: 1, updatedAt: now };
}

// Lecture DB, tolérante au legacy. schemaVersion -> 1. updatedAt absent -> null (jamais 1970).
export function normalizeUserProject(raw: unknown): UserProject | null {
  const input = normalizeUserProjectInput(raw);
  if (!input) return null;
  const r = raw as Record<string, unknown>;
  return { ...input, schemaVersion: 1, updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null };
}
```

(Suppression de `mergeProjectEdit` : abstraction morte et bogée. La carte et l'API construisent l'entrée directement.)

- [ ] **Step 4: Lancer, vérifier le succès + typecheck** — `node --test src/lib/user-project.test.ts` → PASS ; `npx tsc --noEmit` → **attendu : erreurs** dans `route.ts` et les composants (contrat changé). Elles sont corrigées Tasks 2-4. Ne pas committer avant Task 4.

---

## Task 2: `/api/profile` (estampille serveur, `if_empty` atomique, retourne le projet)

**Files:**
- Modify: `src/app/api/profile/route.ts`

- [ ] **Step 1: Import**

Remplacer `import { normalizeUserProject } from "@/lib/user-project";` par :

```ts
import { normalizeUserProjectInput, stampUserProject } from "@/lib/user-project";
```

- [ ] **Step 2: Branche `user_project` (écrase, estampille, retourne)**

Remplacer le bloc `if (field === "user_project") { ... }` par :

```ts
    if (field === "user_project") {
      const input = normalizeUserProjectInput(body.value);
      if (!input) return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
      const now = new Date().toISOString();
      const project = stampUserProject(input, now);
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_project: project, updated_at: now })
        .eq("user_id", user.id);
      if (error) {
        console.error("[profile] PATCH user_project error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      return NextResponse.json({ success: true, project });
    }
```

- [ ] **Step 3: Branche `user_project_if_empty` (atomique)**

Remplacer le bloc par une seule requête conditionnelle (`.is("user_project", null)`), qui garantit le « n'écrase jamais » au niveau SQL et retourne ce qui a été écrit :

```ts
    if (field === "user_project_if_empty") {
      const input = normalizeUserProjectInput(body.value);
      if (!input) return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
      const now = new Date().toISOString();
      const project = stampUserProject(input, now);
      // Atomique : n'écrit QUE si user_project est null. Deux amorçages concurrents ne peuvent plus
      // écraser (la garde est SQL, pas espérée par le code). data non-null = ligne effectivement écrite.
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ user_project: project, updated_at: now })
        .eq("user_id", user.id)
        .is("user_project", null)
        .select("user_id")
        .maybeSingle();
      if (error) {
        console.error("[profile] PATCH user_project_if_empty error:", error);
        return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
      }
      const written = Boolean(data);
      return NextResponse.json({ success: true, written, project: written ? project : null });
    }
```

- [ ] **Step 4: Typecheck** — `npx tsc --noEmit` → les erreurs de `route.ts` disparaissent (restent celles des composants, Tasks 3-4).

---

## Task 3: `OuVivreProjectSync` (rawText sans parsed, rafraîchissement)

**Files:**
- Modify: `src/components/OuVivreProjectSync.tsx`

- [ ] **Step 1: Réécrire le composant**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Pousse le projet libre de /ou-vivre (localStorage) vers le compte, une seule fois, si le serveur
// n'en a pas encore. Monté sur /rapport. rawText survit même sans parsed. Après une écriture réussie,
// on rafraîchit pour que la carte serveur reflète le projet sans rechargement manuel.
const SESSION_KEY = "futuree:ouvivre:session";

export function OuVivreProjectSync({ hasServerProject }: { hasServerProject: boolean }) {
  const done = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (done.current || hasServerProject) return;
    let payload: { parsed?: unknown; submittedText?: string } | null = null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
    const rawText = typeof payload?.submittedText === "string" && payload.submittedText.trim()
      ? payload.submittedText.trim()
      : null;
    if (!rawText && !payload?.parsed) return; // rien à sauvegarder
    done.current = true;
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: "user_project_if_empty",
        value: { posture: "recherche", intent: null, rawText, parsed: payload?.parsed ?? null },
      }),
    })
      .then(async (r) => {
        if (!r.ok) { done.current = false; return; }
        const data = (await r.json().catch(() => null)) as { written?: boolean } | null;
        if (data?.written) router.refresh(); // la carte serveur reprend le projet
      })
      .catch(() => { done.current = false; });
  }, [hasServerProject, router]);

  return null;
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit`.

---

## Task 4: `ProjectSummaryCard` (sauvegarde honnête + sélecteur de posture)

**Files:**
- Modify: `src/components/report/ProjectSummaryCard.tsx`

- [ ] **Step 1: Réécrire le composant**

Sauvegarde honnête (vérifie `response.ok`, garde l'éditeur ouvert et affiche une erreur sobre en cas d'échec, ne met à jour l'état qu'avec le projet retourné par le serveur) et sélecteur de posture (aucun défaut deviné pour un nouveau projet).

```tsx
"use client";

import { useState } from "react";
import type { UserProject, ProjectPosture } from "@/lib/user-project";

const POSTURE_OPTIONS: { value: ProjectPosture; label: string }[] = [
  { value: "recherche", label: "Je cherche où vivre" },
  { value: "adresse", label: "J'étudie ce lieu pour acheter ou louer" },
  { value: "habitant", label: "J'y habite déjà" },
];

// Carte « Votre projet » en tête du hub. Trois états : projet présent, absent (invitation),
// édition. La sauvegarde explicite ne prétend JAMAIS avoir réussi sans confirmation serveur :
// en cas d'échec l'éditeur reste ouvert avec un message. La posture est choisie, jamais devinée.
export function ProjectSummaryCard({ initial }: { initial: UserProject | null }) {
  const [project, setProject] = useState<UserProject | null>(initial);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial?.rawText ?? "");
  const [posture, setPosture] = useState<ProjectPosture | null>(initial?.posture ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const raw = text.trim();
    if (!raw || !posture) return;
    setBusy(true);
    setError(null);
    // 1) parse (best-effort). 2) persist. rawText survit à un parse en échec.
    let parsed: UserProject["parsed"] = null;
    try {
      const r = await fetch("/api/comparateur-vie/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      if (r.ok) {
        const data = (await r.json()) as { parsed?: unknown };
        if (data.parsed && typeof data.parsed === "object") parsed = data.parsed as UserProject["parsed"];
      }
    } catch {
      parsed = null;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "user_project", value: { posture, intent: project?.intent ?? null, rawText: raw, parsed } }),
      });
      if (!res.ok) { setError("Enregistrement impossible pour le moment. Réessayez."); setBusy(false); return; }
      const data = (await res.json()) as { project?: UserProject };
      if (!data.project) { setError("Enregistrement impossible pour le moment. Réessayez."); setBusy(false); return; }
      setProject(data.project); // uniquement le projet confirmé par le serveur
      setEditing(false);
    } catch {
      setError("Enregistrement impossible pour le moment. Réessayez.");
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  if (!editing && project && reformulation) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 6px" }}>Votre projet</p>
        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>{reformulation}</p>
        <button type="button" onClick={() => { setText(project.rawText ?? ""); setPosture(project.posture); setEditing(true); }}
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {POSTURE_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setPosture(o.value)}
            style={{ background: posture === o.value ? "var(--accent)" : "none", color: posture === o.value ? "#060812" : "var(--fg-1)", border: "1px solid var(--border-2)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
            {o.label}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, color: "var(--fg-1)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
      {error ? <p style={{ color: "var(--red)", fontSize: 13, margin: "8px 0 0" }}>{error}</p> : null}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button type="button" onClick={save} disabled={busy || !text.trim() || !posture}
          style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#060812", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: busy || !text.trim() || !posture ? 0.5 : 1 }}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button type="button" onClick={() => { setEditing(false); setError(null); }}
            style={{ background: "none", border: "none", padding: 0, color: "var(--fg-4)", cursor: "pointer", fontSize: 13 }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck complet + tests + commit**

`npx tsc --noEmit` → exit 0 (toutes les erreurs de contrat résorbées). `node --test src/lib/user-project.test.ts` → PASS.

```bash
git add src/lib/user-project.ts src/lib/user-project.test.ts "src/app/api/profile/route.ts" src/components/OuVivreProjectSync.tsx src/components/report/ProjectSummaryCard.tsx
git commit -m "fix(compte): durcit la persistance du projet (prémisse fiable)

Sauvegarde honnête (response.ok, éditeur ouvert sur échec, projet retourné par
le serveur) ; if_empty atomique (garde SQL) ; rawText persisté sans parsed +
router.refresh ; estampille serveur (schemaVersion + updatedAt) ; sélecteur de
posture (aucun défaut deviné) ; mergeProjectEdit retiré.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Vérification finale

- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `node --test src/lib/user-project.test.ts` → PASS.
- [ ] `npm run build` → réussi.
- [ ] Comportement (skill verify) : (1) retour de `/ou-vivre` vers `/rapport` : le projet apparaît sans rechargement manuel ; (2) une édition qui échoue (couper le réseau) garde l'éditeur ouvert et affiche l'erreur, ne prétend pas enregistrer ; (3) créer un projet depuis le hub exige de choisir une posture.

# Synthèse Logement auto/streamée/artefact — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner la synthèse Logement sur le modèle Quartier (prose streamée, auto-déclenchée, traitée en artefact régénéré seulement quand un fait du logement change, avec cache persistant).

**Architecture:** La route `synthesize-logement` passe de la réponse JSON (Anthropic SDK) à un stream AI SDK `streamText` (patron `synthesize-quartier`), avec lecture de cache par hash de faits dans la table `logement` et persistance via `after()`. Une lib pure `logement-synthesis-cache` fournit le hash de faits déterministe et l'assemblage du payload. Un composant `LogementSynthesis` (miroir de `QuartierSynthesis`) consomme le stream, gate par hash, respecte `AUTO_SYNTHESIS`.

**Tech Stack:** TypeScript, Next.js App Router, AI SDK (`ai` + `@ai-sdk/anthropic`, Sonnet 4.6), Supabase (table `logement`, RLS own), `node --test --experimental-strip-types` pour les libs pures, PostHog.

## Global Constraints

- **Périmètre 1a = la synthèse uniquement.** Le réordonnancement (remonter la synthèse en tête, remonter le `DpeSelector`) = spec 1b, HORS de ce plan : la synthèse reste à sa position actuelle. Le mini-intake = spec B, hors plan.
- **Règle artefact :** la synthèse est régénérée uniquement quand un FAIT du logement change. La **posture ne déclenche jamais** d'appel LLM (elle n'entre pas dans le hash). Le hash de faits = `hash(point géocodé, dpe_id | "none", versionSources, versionPrompt)`.
- **Déclenchement :** génère quand les données sont stabilisées ET le DPE dans un état terminal (`auto_confirmed`, `confirmed`, `not_found`) ; attend tant que `selection_required`. Respecte `AUTO_SYNTHESIS` (auto seulement si le flag est `"true"` ; sinon bouton). Bouton « régénérer » conservé.
- **Payload :** faits déjà montrés uniquement. **Ajouter** le snapshot autour (Face 3). **Retirer** `irep` et `friches` (frontière Santé).
- **`SYSTEM_PROMPT`** = celui de l'Editorial Writer, repris VERBATIM (fourni intégralement en Task 3). Le prompt ne nomme aucune source et ne mentionne jamais « futur•e ».
- **Modèle :** Sonnet 4.6, `providerOptions.anthropic { effort: "medium", thinking: { type: "disabled" } }` (comme Quartier).
- Tests libs pures : `import test from "node:test"; import assert from "node:assert/strict";`, imports `.ts`, `node --test --experimental-strip-types <fichier>`.
- Vérif finale : `npx tsc --noEmit` + `npx eslint <fichiers touchés>` + `npm run build`.

---

### Task 1: Migration 20 + colonnes synthèse dans le store

**Files:**
- Create: `supabase/20_logement_synthese.sql`
- Modify: `src/lib/logement-store.ts` (type `LogementRow` ~15-28 ; ajout d'une fonction `saveSynthesis`)

**Interfaces:**
- Produces : colonnes `synthesis_text` / `synthesis_fact_hash` / `synthesis_generated_at` sur `public.logement` ; `LogementRow` gagne ces 3 champs (nullable) ; `saveSynthesis(sb, userId, insee, fields)` écrit ces colonnes.

- [ ] **Step 1: Écrire la migration**

Créer `supabase/20_logement_synthese.sql` :

```sql
-- Synthèse Logement persistée comme ARTEFACT (cf. spec 1a). Régénérée seulement quand un fait
-- du logement change : on stocke le texte, le hash de faits qui l'a produit, et la date.
-- Patron report_context/logement : clé (user_id, insee), RLS own déjà en place (migration 17).
alter table public.logement
  add column if not exists synthesis_text         text,
  add column if not exists synthesis_fact_hash    text,
  add column if not exists synthesis_generated_at timestamptz;
```

- [ ] **Step 2: Appliquer la migration**

Run (ou via le MCP Supabase / dashboard selon le workflow porteur) :
`psql "$DATABASE_URL" -f supabase/20_logement_synthese.sql`
Expected : `ALTER TABLE` (idempotent grâce à `if not exists`).
Note : si l'application se fait côté porteur, laisser la migration commitée et signaler qu'elle doit être appliquée avant le déploiement.

- [ ] **Step 3: Étendre le type `LogementRow`**

Dans `src/lib/logement-store.ts`, à la fin du type `LogementRow` (après `updated_at: string;`) :

```ts
  synthesis_text: string | null;
  synthesis_fact_hash: string | null;
  synthesis_generated_at: string | null;
```

- [ ] **Step 4: Ajouter `saveSynthesis`**

Dans `src/lib/logement-store.ts`, à la fin du fichier :

```ts
// Écrit uniquement les colonnes de synthèse sur la ligne (user, insee) existante. UPDATE ciblé
// (pas upsert) : si la ligne n'existe pas encore (course avec la création par « autour »), c'est
// un no-op silencieux, toléré (le client affiche quand même la synthèse ce tour-là). Limitation
// V1 assumée, alignée sur la course DPE déjà documentée.
export async function saveSynthesis(
  sb: SupabaseClient,
  userId: string,
  insee: string,
  fields: { synthesis_text: string; synthesis_fact_hash: string; synthesis_generated_at: string },
): Promise<void> {
  await sb
    .from("logement")
    .update(fields)
    .eq("user_id", userId)
    .eq("insee", insee);
}
```

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS (les 3 nouveaux champs obligatoires sur `LogementRow` obligent les constructeurs de `LogementRow` à les fournir ; `getLogement` fait `select("*")` donc les lit sans changement, mais tsc peut signaler des littéraux `LogementRow` incomplets ailleurs — le cas échéant, ajouter `synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null` à ces littéraux).

- [ ] **Step 6: Commit**

```bash
git add supabase/20_logement_synthese.sql src/lib/logement-store.ts
git commit -m "feat(logement): migration 20 + saveSynthesis (colonnes artefact synthèse)"
```

---

### Task 2: Lib pure `logement-synthesis-cache` (hash de faits + payload) — TDD

**Files:**
- Create: `src/lib/logement-synthesis-cache.ts`
- Test: `src/lib/logement-synthesis-cache.test.ts`

**Interfaces:**
- Consumes : `SOURCES_VERSION` (de `logement-store.ts`), `thermalEvidenceSummary` + `deriveThermalEvidence` (de `thermal-evidence.ts`).
- Produces :
  ```ts
  const SYNTHESIS_PROMPT_VERSION = "v1";
  function buildFactHash(input: { latitude: number; longitude: number; dpeId: string | null; sourcesVersion: string; promptVersion: string }): string;
  function buildSynthesisPayload(data: SynthesisData): Record<string, unknown>; // faits, +autour, -irep/friches, confortEte gaté
  ```

- [ ] **Step 1: Écrire les tests (échec attendu)**

Créer `src/lib/logement-synthesis-cache.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION } from "./logement-synthesis-cache.ts";

test("buildFactHash déterministe : mêmes entrées -> même hash", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  assert.equal(a, b);
});

test("buildFactHash change si le DPE change", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X2", sourcesVersion: "s1", promptVersion: "v1" });
  assert.notEqual(a, b);
});

test("buildFactHash change si la version de prompt change", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v2" });
  assert.notEqual(a, b);
});

test("buildFactHash : dpeId null -> 'none', stable", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: null, sourcesVersion: "s1", promptVersion: "v1" });
  assert.match(a, /none/);
});

function fullData(over = {}) {
  return {
    address: { label: "10 rue X, Lyon" },
    altitude: 170,
    dpeSelectionStatus: "user_confirmed",
    selectedDpe: {
      id_dpe: "X1", type_batiment: "appartement", methode_dpe: "dpe appartement individuel",
      confort_ete: "moyen", etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: 250, emission_ges_m2: 30,
      surface_m2: 60, annee_construction: 1970, date_dpe: "2024-01-01", traversant: true,
      protection_solaire: null, ventilation: "VMC simple flux", inertie: "moyenne", isolation_toiture: null,
      brasseur_air: null, isolation_murs: "bonne", isolation_menuiseries: "moyenne",
      id_ban: null, adresse: null, etage: null, complement: null,
    },
    georisques: { parcel: { risks: { labels: ["sismicité modérée"] }, pprn: { labels: [] }, seismic: { label: "modérée" }, rga: { label: "exposition forte" } } },
    sinistralite: { secheresse: { coutMoyen: "10 000 à 20 000 €" } },
    irep: { count: 3 },
    cartofriches: { count: 2, friches: [{ sol_pollue: true }] },
    autour: { bpe: [{ category: "sante", nearest: { typeLabel: "Pharmacie", distanceMeters: 220 } }], osm: { nearestMappedGreenSpace: { kind: "park", distanceMeters: 300 } } },
    communeData: { commune: { nom: "Lyon", population: 500000 } },
    posture: "prospection",
    ...over,
  };
}

test("buildSynthesisPayload inclut l'autour et exclut irep/friches/posture", () => {
  const p = buildSynthesisPayload(fullData());
  assert.ok(p.autour, "autour présent");
  assert.equal("irep" in p, false);
  assert.equal("friches" in p, false);
  assert.equal("posture" in p, false);
});

test("buildSynthesisPayload : confortEte sous verrou DPE confirmé", () => {
  const confirmed = buildSynthesisPayload(fullData());
  assert.ok(confirmed.confortEte, "confortEte présent si confirmé");
  const pending = buildSynthesisPayload(fullData({ dpeSelectionStatus: "selection_required" }));
  assert.equal(pending.confortEte, null);
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/logement-synthesis-cache.test.ts`
Expected: FAIL (`Cannot find module './logement-synthesis-cache.ts'`).

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/logement-synthesis-cache.ts` :

```ts
// Cache de la synthèse Logement traitée en ARTEFACT (cf. spec 1a). Deux fonctions pures :
// - buildFactHash : clé stable des FAITS du logement (la posture n'y entre pas -> ne régénère jamais).
// - buildSynthesisPayload : assemble les faits déjà montrés pour le prompt (+autour, -irep/friches).
// Pas de `server-only` : buildFactHash est aussi utilisé côté client pour le gating en session.

import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

export const SYNTHESIS_PROMPT_VERSION = "v1";

// Clé de faits : point géocodé (arrondi ~1 m), DPE attribué, version des sources autour, version
// du prompt. Lisible et déterministe ; sert de clé de cache ET de gate en session.
export function buildFactHash(input: {
  latitude: number;
  longitude: number;
  dpeId: string | null;
  sourcesVersion: string;
  promptVersion: string;
}): string {
  const lat = input.latitude.toFixed(5);
  const lon = input.longitude.toFixed(5);
  const dpe = input.dpeId ?? "none";
  return `syn:${lat}:${lon}:${dpe}:${input.sourcesVersion}:${input.promptVersion}`;
}

// Forme d'entrée (sous-ensemble de ce que le client poste). Champs optionnels/défensifs.
export type SynthesisData = {
  address?: { label?: string | null } | null;
  altitude?: number | null;
  dpeSelectionStatus?: string | null;
  selectedDpe?: DpeRecord | null;
  georisques?: { parcel?: { risks?: { labels?: string[] }; pprn?: { labels?: string[] }; seismic?: { label?: string | null }; rga?: { label?: string | null } } } | null;
  sinistralite?: unknown;
  autour?: {
    bpe?: Array<{ category?: string; nearest?: { typeLabel?: string | null; distanceMeters?: number } | null }>;
    osm?: { nearestMappedGreenSpace?: { kind?: string | null; distanceMeters?: number } | null } | null;
  } | null;
  communeData?: { commune?: { nom?: string | null; population?: number | null } } | null;
  // irep / cartofriches / posture : volontairement ignorés (frontière Santé / posture ≠ fait).
};

const DPE_CONFIRMED = (s: string | null | undefined) =>
  s === "auto_confirmed" || s === "user_confirmed";

export function buildSynthesisPayload(data: SynthesisData): Record<string, unknown> {
  const dpe = DPE_CONFIRMED(data.dpeSelectionStatus) && data.selectedDpe;
  const parcel = data.georisques?.parcel;
  return {
    address: data.address?.label ?? null,
    altitude: data.altitude ?? null,
    dpe: dpe
      ? {
          etiquette: data.selectedDpe!.etiquette_dpe,
          ges: data.selectedDpe!.etiquette_ges,
          conso: data.selectedDpe!.conso_ep_m2,
          emissions: data.selectedDpe!.emission_ges_m2,
          surface: data.selectedDpe!.surface_m2,
          construction: data.selectedDpe!.annee_construction,
          type: data.selectedDpe!.type_batiment,
        }
      : null,
    confortEte: dpe ? thermalEvidenceSummary(deriveThermalEvidence(data.selectedDpe!)) : null,
    risks: [...(parcel?.risks?.labels ?? []), ...(parcel?.pprn?.labels ?? [])],
    seismic: parcel?.seismic?.label ?? null,
    rga: parcel?.rga?.label ?? null,
    sinistralite: data.sinistralite ?? null,
    autour: data.autour
      ? {
          proximites: (data.autour.bpe ?? [])
            .filter((b) => b.nearest)
            .map((b) => ({ categorie: b.category, type: b.nearest?.typeLabel ?? null, metres: b.nearest?.distanceMeters ?? null })),
          espaceVert: data.autour.osm?.nearestMappedGreenSpace
            ? { nature: data.autour.osm.nearestMappedGreenSpace.kind, metres: data.autour.osm.nearestMappedGreenSpace.distanceMeters }
            : null,
        }
      : null,
    commune: data.communeData?.commune
      ? { name: data.communeData.commune.nom, population: data.communeData.commune.population }
      : null,
  };
}
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/logement-synthesis-cache.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/logement-synthesis-cache.ts src/lib/logement-synthesis-cache.test.ts
git commit -m "feat(logement): lib pure synthesis-cache (buildFactHash + buildSynthesisPayload)"
```

---

### Task 3: Route `synthesize-logement` streamée + cache

**Files:**
- Modify (réécriture complète) : `src/app/api/synthesize-logement/route.ts`

**Interfaces:**
- Consumes : `buildFactHash`, `buildSynthesisPayload`, `SYNTHESIS_PROMPT_VERSION` (Task 2) ; `getLogement`, `saveSynthesis`, `SOURCES_VERSION` (Task 1) ; auth `getCurrentUserAccount`/`requireCurrentUser`, `canAccessCompleteReport`.
- Produces : POST renvoie un stream `text/plain` (prose) ; sur cache touché, renvoie le texte figé. Corps attendu : `{ data, insee, latitude, longitude, dpeId }`.

- [ ] **Step 1: Réécrire la route**

Remplacer TOUT le contenu de `src/app/api/synthesize-logement/route.ts` par :

```ts
// Route de synthèse Logement — prose streamée (patron synthesize-quartier), traitée en ARTEFACT.
// Cache par hash de faits dans la table `logement` : hit -> texte figé, zéro LLM ; miss -> stream
// + persistance via after(). Modèle Sonnet 4.6 medium, thinking off. Routing : Anthropic direct
// tant que le produit n'est pas en vente (cf. mémoire synthesis_model_routing).

import { NextRequest, after } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { getLogement, saveSynthesis, SOURCES_VERSION } from "@/lib/logement-store";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION, type SynthesisData } from "@/lib/logement-synthesis-cache";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `<<COPIER-COLLER VERBATIM le bloc de la section B du rapport
docs/rapports-agents/editorial-writer/2026-07-07-synthese-logement-prompt.md (lignes 36 à 110),
entre backticks. Reproduit intégralement ci-dessous.>>`;

type Body = {
  data?: SynthesisData;
  insee?: string;
  latitude?: number;
  longitude?: number;
  dpeId?: string | null;
};

export async function POST(req: NextRequest) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) {
    return new Response("forbidden", { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }
  if (!body?.data || !body.insee || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return new Response("data/insee/latitude/longitude requis", { status: 400 });
  }

  const { supabase, user } = await requireCurrentUser();
  const factHash = buildFactHash({
    latitude: body.latitude,
    longitude: body.longitude,
    dpeId: body.dpeId ?? null,
    sourcesVersion: SOURCES_VERSION,
    promptVersion: SYNTHESIS_PROMPT_VERSION,
  });

  // Cache touché : texte figé, zéro LLM.
  const existing = await getLogement(supabase, user.id, body.insee);
  if (existing?.synthesis_fact_hash === factHash && existing.synthesis_text) {
    return new Response(existing.synthesis_text, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // Cache raté : streamer la prose ET persister à la fin (after()).
  const payload = buildSynthesisPayload(body.data);
  const userMessage = `Voici les faits déjà présentés pour ce logement. Produisez la lecture selon vos règles. Ne récitez pas le payload, servez-vous-en.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: { anthropic: { effort: "medium", thinking: { type: "disabled" } } },
    system: SYSTEM_PROMPT,
    prompt: userMessage,
    onError: ({ error }) => console.error("[synthesize-logement] streamText error:", error),
  });

  // Probe le premier chunk : IA down -> 502 franc (le client bascule sur son état d'erreur).
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[synthesize-logement] first chunk failed:", err);
    return new Response("AI provider unavailable.", { status: 502 });
  }
  if (firstChunk.done) {
    return new Response("Empty stream from AI provider.", { status: 502 });
  }

  const encoder = new TextEncoder();
  let full = firstChunk.value;
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(firstChunk.value));
      try {
        while (true) {
          const next = await iter.next();
          if (next.done) break;
          full += next.value;
          controller.enqueue(encoder.encode(next.value));
        }
        controller.close();
      } catch (err) {
        try { controller.error(err); } catch { /* client déjà parti */ }
      }
    },
  });

  // Persistance post-réponse : le texte complet est prêt quand after() s'exécute (stream clos).
  after(async () => {
    if (!full.trim()) return;
    await saveSynthesis(supabase, user.id, body.insee!, {
      synthesis_text: full,
      synthesis_fact_hash: factHash,
      synthesis_generated_at: new Date().toISOString(),
    }).catch((e) => console.error("[synthesize-logement] persist failed:", e));
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 2: Coller le `SYSTEM_PROMPT` verbatim**

Ouvrir `docs/rapports-agents/editorial-writer/2026-07-07-synthese-logement-prompt.md`, copier le bloc entre backticks de la section B (« Vous êtes l'analyste éditorial de futur•e… » jusqu'à « …Servez-vous-en sans le réciter. »), et remplacer la valeur placeholder de `SYSTEM_PROMPT` par ce texte, entre backticks. Ne rien reformuler.

- [ ] **Step 3: Vérifier compilation + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS (route reconnue comme dynamique streamée).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/synthesize-logement/route.ts
git commit -m "feat(logement): synthèse route streamée + cache artefact (modèle Quartier)"
```

---

### Task 4: Composant `LogementSynthesis`

**Files:**
- Create: `src/components/report/LogementSynthesis.tsx`

**Interfaces:**
- Consumes : `buildFactHash`, `SYNTHESIS_PROMPT_VERSION` (Task 2) ; `SOURCES_VERSION` (`logement-store`) ; `AUTO_SYNTHESIS` (`auto-synthesis`) ; `ReportSection` (`kit`).
- Produces :
  ```ts
  function LogementSynthesis(props: {
    ready: boolean;              // données stabilisées + DPE terminal
    data: unknown;               // faits à poster
    insee: string;
    latitude: number;
    longitude: number;
    dpeId: string | null;
  }): JSX.Element
  ```

- [ ] **Step 1: Écrire le composant**

Créer `src/components/report/LogementSynthesis.tsx` :

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ReportSection } from "@/components/report/kit";
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";
import { SOURCES_VERSION } from "@/lib/logement-store";
import { buildFactHash, SYNTHESIS_PROMPT_VERSION } from "@/lib/logement-synthesis-cache";

type State = "idle" | "streaming" | "done" | "error";

export function LogementSynthesis({
  ready, data, insee, latitude, longitude, dpeId,
}: {
  ready: boolean;
  data: unknown;
  insee: string;
  latitude: number;
  longitude: number;
  dpeId: string | null;
}) {
  const posthog = usePostHog();
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const lastHashRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const factHash = buildFactHash({ latitude, longitude, dpeId, sourcesVersion: SOURCES_VERSION, promptVersion: SYNTHESIS_PROMPT_VERSION });

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastHashRef.current = factHash;
    setText("");
    setState("streaming");
    posthog?.capture("logement_ai_summary_started", { insee });
    try {
      const res = await fetch("/api/synthesize-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, insee, latitude, longitude, dpeId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setText(buffer);
      }
      setState("done");
      posthog?.capture("logement_ai_summary_completed", { insee, char_count: buffer.length });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState("error");
      posthog?.capture("logement_ai_summary_failed", { insee, error: err instanceof Error ? err.message : "unknown" });
    }
  }, [data, insee, latitude, longitude, dpeId, factHash, posthog]);

  // Auto-déclenchement : données prêtes, flag actif, et le hash de faits a changé (gating).
  useEffect(() => {
    if (!ready || !AUTO_SYNTHESIS) return;
    if (lastHashRef.current === factHash) return;
    run();
  }, [ready, factHash, run]);

  if (!ready) return <></>;

  return (
    <ReportSection eyebrow="Lecture de ce logement" tone="accent">
      <div style={{ padding: "4px 0" }}>
        {state === "idle" && !AUTO_SYNTHESIS && (
          <button
            onClick={run}
            style={{ fontSize: 14, padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border-1)", background: "var(--bg-elev)", color: "var(--fg-hi)", cursor: "pointer" }}
          >
            Générer la lecture
          </button>
        )}
        {text && (
          <div style={{ fontSize: 16, lineHeight: 1.75, color: "var(--fg-2)", whiteSpace: "pre-wrap" }}>{text}</div>
        )}
        {state === "streaming" && !text && (
          <p style={{ fontSize: 14, color: "var(--fg-4)" }}>Lecture en cours…</p>
        )}
        {state === "error" && (
          <p style={{ fontSize: 14, color: "var(--fg-3)" }}>La lecture n'a pas pu être générée. Réessayez dans un instant.</p>
        )}
        {(state === "done" || state === "error") && (
          <button
            onClick={run}
            style={{ marginTop: 14, fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-1)", background: "transparent", color: "var(--fg-3)", cursor: "pointer" }}
          >
            Régénérer
          </button>
        )}
      </div>
    </ReportSection>
  );
}
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementSynthesis.tsx`
Expected: PASS (échapper toute apostrophe en texte JSX via `&apos;` si eslint `react/no-unescaped-entities` proteste ; ici « n'a » est dans une chaîne JSX texte -> écrire `n&apos;a`).

- [ ] **Step 3: Commit**

```bash
git add src/components/report/LogementSynthesis.tsx
git commit -m "feat(logement): composant LogementSynthesis (prose streamée, gating, régénérer)"
```

---

### Task 5: Câblage dans `LogementModule`

**Files:**
- Modify: `src/components/report/LogementModule.tsx` (imports ; suppression de l'ancien état/handler de synthèse ; remplacement du bloc « Lecture personnalisée » ~1032-1051)

**Interfaces:**
- Consumes : `LogementSynthesis` (Task 4). Variables locales déjà présentes : `dpe` (DPE attribué), `dpeStatus`, `result`, `autour`, `projet`.

- [ ] **Step 1: Importer le composant**

Dans `src/components/report/LogementModule.tsx`, après l'import de `ThermalComfortSection` :

```ts
import { LogementSynthesis } from "@/components/report/LogementSynthesis";
```

- [ ] **Step 2: Calculer l'état « prêt » et les faits postés**

Juste après le calcul de `thermalEvidence`/`communeName`/`dpeYear` (~882), ajouter :

```ts
  // Synthèse artefact : prête quand l'analyse est là ET le DPE dans un état terminal
  // (auto_confirmed / confirmed / not_found). On attend tant que l'utilisateur choisit.
  const dpeTerminal = dpeStatus === "auto_confirmed" || dpeStatus === "confirmed" || dpeStatus === "not_found";
  const synthesisReady = Boolean(result) && dpeTerminal;
  const synthesisData = {
    address: result?.address,
    altitude: result?.altitude,
    dpeSelectionStatus: dpeStatus === "confirmed" ? "user_confirmed" : dpeStatus,
    selectedDpe: dpe,
    georisques: result?.georisques,
    sinistralite: result?.sinistralite,
    autour,
    communeData: result?.communeData,
  };
```

- [ ] **Step 3: Remplacer le bloc « Lecture personnalisée » manuel par le composant**

Localiser le bloc `<ReportSection eyebrow="Lecture personnalisée" …>` avec le bouton « Générer la lecture » (~1032-1051 avant modifications) et le remplacer intégralement par :

```tsx
          <LogementSynthesis
            ready={synthesisReady}
            data={synthesisData}
            insee={result.communeData?.commune?.inseeCode ?? ""}
            latitude={result.address?.latitude ?? 0}
            longitude={result.address?.longitude ?? 0}
            dpeId={dpe?.id_dpe ?? null}
          />
```

- [ ] **Step 4: Supprimer l'ancien état/handler de synthèse**

Retirer les déclarations devenues mortes : `const [synthesis, setSynthesis] = useState…`, `synthLoading`, `synthError`, la fonction `requestSynthesis`, le type `SynthesisResponse`, et toute ligne `setSynthesis(null)` dans le reset. Laisser tsc guider : après suppression, `npx tsc --noEmit` doit ne signaler aucune référence orpheline.

- [ ] **Step 5: Vérifier compilation + lint + build**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/report/LogementModule.tsx
git commit -m "feat(logement): câble la synthèse auto artefact (remplace le bouton manuel, position inchangée)"
```

---

### Task 6: Vérification finale intégrée

**Files:** aucun (vérification).

- [ ] **Step 1: Tests libs**

Run: `node --test --experimental-strip-types src/lib/logement-synthesis-cache.test.ts src/lib/thermal-evidence.test.ts`
Expected: PASS (7 + 10).

- [ ] **Step 2: Type + lint (fichiers touchés) + build**

Run: `npx tsc --noEmit && npx eslint src/lib/logement-synthesis-cache.ts src/components/report/LogementSynthesis.tsx src/components/report/LogementModule.tsx src/app/api/synthesize-logement/route.ts src/lib/logement-store.ts && npm run build`
Expected: PASS (0 erreur sur les fichiers touchés).

- [ ] **Step 3: (manuel, session payante, flag ON) Vérifier le comportement artefact**

Poser `NEXT_PUBLIC_AUTO_SYNTHESIS=true` en local. Analyser une adresse (ex. A `8 Rue de Gros-réderching 57412 Achen`) : (a) la synthèse se génère seule en prose streamée, sans bouton ; (b) elle ne parle jamais de futur•e ni ne récite les chiffres ; (c) changer la posture (sonde projet) NE relance PAS d'appel réseau (onglet Network) ; (d) recharger la page rend la synthèse instantanément (cache touché) ; (e) choisir un autre DPE (adresse multi-candidats, ex. Lyon) régénère.

---

## Self-Review

**Spec coverage :** forme prose streamée ✓ (T3/T4) ; progression fixe/longueur variable + garde-fous ✓ (SYSTEM_PROMPT verbatim T3) ; règle artefact + déclenchement DPE terminal + posture jamais ✓ (T5 `dpeTerminal` + T2 hash sans posture) ; AUTO_SYNTHESIS + bouton régénérer ✓ (T4) ; cache hash + gating session + persistance durable ✓ (T1/T2/T3) ; payload +autour −irep/friches ✓ (T2 `buildSynthesisPayload` + tests) ; abandon JSON verdict/signals ✓ (T3 réécriture, T5 suppression état) ; migration 20 ✓ (T1) ; hors-scope réordonnancement/intake non touchés ✓.

**Placeholder scan :** le seul placeholder volontaire est la valeur de `SYSTEM_PROMPT` en T3 Step 1, résolu explicitement en T3 Step 2 (copie verbatim d'un fichier commité) — ce n'est pas un « TODO » flou mais une instruction de copie d'un artefact existant.

**Type consistency :** `buildFactHash`/`buildSynthesisPayload`/`SYNTHESIS_PROMPT_VERSION`/`SynthesisData` identiques entre T2 (déf), T3 et T4 (conso) ; `saveSynthesis` + champs `synthesis_*` identiques entre T1 (déf) et T3 (conso) ; `LogementSynthesis` props identiques entre T4 (déf) et T5 (conso).

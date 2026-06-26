# Comparateur mode choix — Synthèse + explorateur de thèmes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre le résultat gratuit du comparateur « mode choix » : synthèse générée (effet wow) en tête, puis 3 cartes villes, puis un explorateur de thèmes (un seul thème dévoilé à la fois, le reste verrouillé), et un accueil qui explique ce qu'on compare.

**Architecture:** La page `comparateur/page.tsx` reste un Server Component qui appelle `seedComparaison`. Deux nouveaux composants client : `ModeChoixSynthese` (fetch streamé d'une route dédiée) et `ThemeExplorer` (état du thème ouvert + règle de déverrouillage déterministe, zéro LLM). Une nouvelle route `synthesize-choix` réutilise la plomberie de streaming existante avec un SYSTEM prompt réécrit pour le départage. Le moteur (`comparateur-vie.ts`) reçoit une repondération du thème par défaut.

**Tech Stack:** Next.js (App Router, Server + Client Components), TypeScript, AI SDK (`ai` + `@ai-sdk/anthropic`), Tailwind. Pas de framework de test dans ce repo : la vérification se fait par `npx tsc --noEmit`, `npx eslint <fichiers>`, et un test runtime sur le serveur de dev.

## Global Constraints

- **Aucun tiret cadratin** (`—`) nulle part : virgule ou deux points. (CLAUDE.md / mémoire.)
- **Pas de couronnement** dans la synthèse : jamais « la meilleure », « top », « classement », « coche le plus de cases », « le bon compromis idéal », ni prescription. (invariant n°2 ; cf. spec 2.3.bis.)
- **Largeur du texte** : pas de `max-w-[NNNpx]` plus étroit que le bloc bordé qui entoure le texte. (AGENTS.md.)
- **Typo FR** : phrases importantes passées par `bindOrphans` de `@/lib/typography`.
- **Vérification par tâche** : `npx tsc --noEmit 2>&1 | grep -v suivi-bientot` (doit ne rien afficher de lié au comparateur ; l'erreur `suivi-bientot/page.js` est un artefact `.next` préexistant et hors-sujet), puis `npx eslint "<fichiers touchés>"` (doit ne rien afficher).
- **Modèle synthèse** : parcours gratuit, modèle léger (Sonnet 4.6 effort `low`, thinking `disabled`). cf. mémoire `synthesis_model_routing`.
- **Référence design/édito** : spec `docs/superpowers/specs/2026-06-26-comparateur-synthese-explorateur-design.md` et rapport `docs/rapports-agents/editorial-writer/2026-06-26-comparateur-synthese-choix.md`.

---

## File Structure

- `src/lib/comparateur-vie.ts` (modify) — repondération du thème par défaut de la divergence ; export de `THEME_ORDER`.
- `src/app/api/comparateur-vie/synthesize-choix/route.ts` (create) — route de synthèse départage (streaming).
- `src/app/(public)/comparateur/ModeChoixSynthese.tsx` (create) — composant client : fetch streamé + fallback.
- `src/app/(public)/comparateur/ThemeExplorer.tsx` (create) — composant client : thème ouvert + vitrine cliquable + règle de déverrouillage.
- `src/app/(public)/comparateur/page.tsx` (modify) — accueil enrichi + nouvel ordre des résultats ; retrait de l'UI v2 (fracture à deux pôles, thème dévoilé seul, vitrine verrouillée).

---

### Task 1: Repondération du thème par défaut + export `THEME_ORDER`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (sort de divergence ~1334-1343 ; déclaration `THEME_ORDER` ~1076)

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: `export const THEME_ORDER: { id: string; titre: string; gp: string }[]` (rendu public). `divergence.themeId` reste le champ lu par l'UI ; sa valeur est désormais repondérée (un risque de niche comme `feu` ne s'impose plus comme défaut).

- [ ] **Step 1: Exporter `THEME_ORDER`**

Dans `src/lib/comparateur-vie.ts`, ajouter `export` devant la déclaration (~ligne 1076) :

```ts
export const THEME_ORDER: { id: string; titre: string; gp: string }[] = [
```

- [ ] **Step 2: Ajouter la pénalité de pertinence et changer le tri**

Juste avant le bloc `const sortedCands = [...divCands].sort(` (~ligne 1334), ajouter :

```ts
  // Pertinence décisionnelle du DÉFAUT dévoilé : un risque de niche à fort écart (feu,
  // pluies, sécheresse) ne doit pas s'imposer comme thème par défaut devant un thème
  // largement décisif. Pénalité d'écart (pas une exclusion : le lecteur peut toujours
  // l'ouvrir via l'explorateur). cf. spec 2.5.
  const LOW_RELEVANCE_DIMS = new Set(["feu", "pluies", "secheresse"]);
  const relScore = (c: (typeof divCands)[number]) =>
    c.spread - (LOW_RELEVANCE_DIMS.has(c.dimId) ? 1 : 0);
```

Puis remplacer le tri existant :

```ts
  const sortedCands = [...divCands].sort(
    (a, b) =>
      b.spread - a.spread ||
      Number(b.risque) - Number(a.risque) ||
      a.themeIdx - b.themeIdx,
  );
```

par :

```ts
  const sortedCands = [...divCands].sort(
    (a, b) => relScore(b) - relScore(a) || a.themeIdx - b.themeIdx,
  );
```

- [ ] **Step 3: Vérifier tsc + eslint**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint src/lib/comparateur-vie.ts`
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): défaut de divergence repondéré + export THEME_ORDER"
```

---

### Task 2: Route de synthèse dédiée `synthesize-choix`

**Files:**
- Create: `src/app/api/comparateur-vie/synthesize-choix/route.ts`
- Reference (ne pas modifier) : `src/app/api/comparateur-vie/synthesize/route.ts` (plomberie streaming à copier)

**Interfaces:**
- Consumes: rien (route HTTP).
- Produces: `POST /api/comparateur-vie/synthesize-choix` qui streame du `text/plain`. Corps attendu :
  `{ communes: { nom: string; region: string | null; identite: string; compromis: string; distinctive: string | null }[]; divergence: { domine: boolean; dominatorInsee: string | null } | null }`. Répond 502 si l'IA est down (le client bascule sur un fallback).

- [ ] **Step 1: Créer la route avec le SYSTEM prompt départage**

Créer `src/app/api/comparateur-vie/synthesize-choix/route.ts` :

```ts
// ════════════════════════════════════════════════════════════════════════════
// Comparateur · SYNTHÈSE MODE CHOIX (départage)
//
// Le lecteur a NOMMÉ 2-3 communes entre lesquelles il hésite. Pas de projet, pas
// de préférences. La synthèse INTERPRÈTE l'arbitrage entre CES communes, sans en
// couronner aucune. Prompt distinct de /ou-vivre (qui tourne autour du « projet »).
// cf. spec 2.3.bis + rapports-agents/editorial-writer/2026-06-26-comparateur-synthese-choix.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Vous écrivez la synthèse du comparateur de communes de futur•e, en mode départage.

Le lecteur a NOMMÉ 2 à 3 communes entre lesquelles il hésite. Il n'a donné AUCUN projet,
aucune préférence, aucun critère. Le moteur a déjà tout calculé de façon déterministe. Vous
INTERPRÉTEZ l'arbitrage entre ces communes, vous n'en classez aucune, vous n'en ajoutez aucune.

OBJECTIF
Faire sentir au lecteur que vous comprenez son hésitation, en nommant l'arbitrage réel entre
ces communes. Vous créez une question, vous n'apportez pas une réponse complète.

INTERDIT DE COURONNER (règle la plus importante)
Vous ne désignez JAMAIS une commune comme la meilleure, la plus équilibrée, le meilleur
compromis, ni « le bon choix ». Formes interdites, frontales ou déguisées : « la plus
équilibrée », « le meilleur compromis », « coche le plus de cases », « réunit le plus
d'atouts », « ressort en tête », « globalement X s'impose », « le juste milieu idéal »,
classement par énumération, et toute prescription (« vous ne vous tromperez pas avec… »,
« autant partir sur… », « le choix le plus sûr »). Le verbe qui décide reste TOUJOURS au
lecteur.

NE PRÊTEZ AUCUN PROJET AU LECTEUR
Il n'a donné que des noms de communes. N'écrivez JAMAIS « vous cherchez… », « votre priorité
semble… », « vous voulez… ». Vous décrivez les OPTIONS et ce qui les sépare, jamais les
motivations du lecteur. Le miroir, ici, c'est l'hésitation reconnue, pas un projet deviné.

NE COMMENTEZ QUE CE QUI VOUS EST FOURNI
Pour chaque commune vous recevez une identité, un compromis, parfois un trait distinctif.
N'affirmez ni ne niez jamais une caractéristique absente de ces éléments. N'inventez aucun
chiffre, aucun pourcentage, aucun horizon daté. Vocabulaire qualitatif uniquement.

NE RÉCITEZ PAS LES THÈMES
Le détail thème par thème est donné juste en dessous par un explorateur. Restez au niveau de
l'arbitrage d'ensemble. Pas d'inventaire des dimensions.

CAS « UNE COMMUNE RESSORT PRESQUE PARTOUT » (quand une_commune_ressort_presque_partout est vrai)
Vous pouvez décrire que l'écart penche nettement d'un côté et que l'arbitrage se réduit à un
point (souvent ce que l'autre commune est seule à offrir), puis reformuler en question, en
rendant la main. INTERDIT : « peu à hésiter », « le choix le plus sûr », « s'impose
naturellement », tout superlatif absolu. Test : si la phrase peut être remplacée par « donc
prenez celle-là », elle est de trop.

CAS « COMMUNES TRÈS PROCHES »
Si les identités et compromis se ressemblent, dites-le simplement et situez l'arbitrage sur les
nuances. Ne fabriquez jamais une divergence pour le spectacle.

STRUCTURE (110 à 170 mots, 1 à 2 paragraphes)
1. Ces communes ne proposent pas la même vie : caractérisez-les (depuis leur identité).
2. Le compromis honnête de chacune (ce qu'elle coûte). C'est là que naît la confiance.
3. Reformulez l'hésitation en arbitrage, pas en classement.
4. Renvoyez vers les thèmes ci-dessous sans les inventorier.
5. Rendez la décision au lecteur, explicitement.
Variez la construction d'une commune à l'autre (évitez le tempo mécanique « identité, mais
compromis » répété à l'identique).

TON
Intelligent mais simple et direct. Phrases courtes, mots concrets. Pas d'aphorismes, pas
d'antithèses « ce n'est pas X, c'est Y ». Une personne pressée comprend du premier coup.

INTERDITS DE FORME
Vouvoiement. AUCUN tiret cadratin (virgule ou deux points). AUCUN point d'exclamation. Pas de
termes techniques internes (percentile, palier, score). Formules bannies : « en résumé »,
« globalement », « en somme », « pour conclure ».`;

type Body = {
  communes?: { nom: string; region?: string | null; identite?: string; compromis?: string; distinctive?: string | null }[];
  divergence?: { domine?: boolean; dominatorInsee?: string | null } | null;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return new Response("Corps invalide.", { status: 400 });
  }

  const communes = Array.isArray(body.communes) ? body.communes : [];
  if (communes.length < 2) {
    return new Response("Au moins deux communes sont nécessaires.", { status: 400 });
  }

  // Payload sobre, sans chiffre. Les communes arrivent déjà nommées (pas d'INSEE ici).
  const payload = {
    communes: communes.map((c) => ({
      commune: c.nom,
      region: c.region ?? null,
      identite: c.identite ?? null,
      compromis: c.compromis ?? null,
      trait_distinctif: c.distinctive ?? null,
    })),
    une_commune_ressort_presque_partout: body.divergence?.domine === true,
  };

  const userMessage = `Interprétez ce départage selon vos règles. Ne récitez pas le payload, ne citez aucun chiffre.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    // Parcours gratuit : modèle léger. Sonnet 4.6 effort low, thinking off.
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: {
      anthropic: {
        effort: "low",
        thinking: { type: "disabled" },
      },
    },
    system: SYSTEM,
    prompt: userMessage,
    onError: ({ error }) => {
      console.error("[synthesize-choix] streamText error:", error);
    },
  });

  // Probe du premier chunk : vrai 502 si l'IA est down (le client bascule sur un fallback).
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[synthesize-choix] first chunk failed:", err);
    return new Response("AI provider unavailable.", { status: 502 });
  }
  if (firstChunk.done) {
    return new Response("Empty stream from AI provider.", { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(firstChunk.value));
      try {
        for (;;) {
          const next = await iter.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
        controller.close();
      } catch (err) {
        try {
          controller.error(err);
        } catch {
          /* stream déjà terminé côté client */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 2: Vérifier tsc + eslint**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint "src/app/api/comparateur-vie/synthesize-choix/route.ts"`
Expected: aucune sortie.

- [ ] **Step 3: Test runtime de la route**

Démarrer le dev server si besoin (`npm run dev`), puis :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/synthesize-choix \
  -H "Content-Type: application/json" \
  -d '{"communes":[{"nom":"Rennes","identite":"Une vraie ville, dynamique.","compromis":"En échange, plus urbaine."},{"nom":"Saint-Malo","identite":"Au bord de la mer.","compromis":"En échange, plus excentrée."}],"divergence":{"domine":false,"dominatorInsee":null}}'
```

Expected: une synthèse en français se streame, ~110-170 mots, sans couronner, sans tiret cadratin. (Si 502 : vérifier la clé API Anthropic ; ce n'est pas un bug du code.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/comparateur-vie/synthesize-choix/route.ts
git commit -m "feat(comparateur): route de synthèse dédiée au mode choix (départage)"
```

---

### Task 3: Composant `ModeChoixSynthese` (client, fetch streamé + fallback)

**Files:**
- Create: `src/app/(public)/comparateur/ModeChoixSynthese.tsx`
- Reference : `src/app/(public)/ou-vivre/OuVivreClient.tsx:276-331` (pattern de lecture du stream)

**Interfaces:**
- Consumes: la route `POST /api/comparateur-vie/synthesize-choix` (Task 2).
- Produces: `export function ModeChoixSynthese(props: { communes: { nom: string; region: string | null; identite: string; compromis: string; distinctive: string | null }[]; divergence: { domine: boolean; dominatorInsee: string | null } | null }): JSX.Element`.

- [ ] **Step 1: Créer le composant**

Créer `src/app/(public)/comparateur/ModeChoixSynthese.tsx` :

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { bindOrphans } from "@/lib/typography";

type Commune = { nom: string; region: string | null; identite: string; compromis: string; distinctive: string | null };
type Props = { communes: Commune[]; divergence: { domine: boolean; dominatorInsee: string | null } | null };

// Repli déterministe si l'IA est indisponible : on assemble identité + compromis, sobrement.
function fallbackSynthese(communes: Commune[]): string {
  const phrases = communes.map((c) => `${c.nom} : ${c.identite} ${c.compromis}`.trim());
  return `Ces communes ne proposent pas la même vie. ${phrases.join(" ")} Aucune ne réunit tout : à vous de voir quel compromis vous ressemble le plus.`;
}

export function ModeChoixSynthese({ communes, divergence }: Props) {
  const [text, setText] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // une seule génération par montage (cf. spec 2.4)
    ran.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/comparateur-vie/synthesize-choix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ communes, divergence }),
        });
        if (!res.ok || !res.body) throw new Error("synthese indisponible");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelled) return;
          acc += decoder.decode(value, { stream: true });
          setText(acc);
        }
      } catch {
        if (!cancelled) setText(fallbackSynthese(communes));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [communes, divergence]);

  return (
    <section className="mt-10">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-3">En un coup d&apos;œil</p>
      <p className="text-[17px] leading-[1.7] text-label" style={{ textWrap: "pretty" }}>
        {text ? bindOrphans(text) : "futur•e regarde vos communes…"}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier tsc + eslint**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint "src/app/(public)/comparateur/ModeChoixSynthese.tsx"`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/comparateur/ModeChoixSynthese.tsx"
git commit -m "feat(comparateur): composant synthèse streamée (mode choix)"
```

---

### Task 4: Composant `ThemeExplorer` (client, déverrouillage déterministe)

**Files:**
- Create: `src/app/(public)/comparateur/ThemeExplorer.tsx`
- Reference : `src/app/(public)/comparateur/page.tsx:178-213` (markup v2 du thème dévoilé + vitrine, à reprendre)

**Interfaces:**
- Consumes: `ThemeMatrix` de `./ThemeMatrix` ; types `ComparaisonTheme`, `MatchResult` de `@/lib/comparateur-vie`.
- Produces: `export function ThemeExplorer(props: { themes: ComparaisonTheme[]; trio: MatchResult[]; defaultThemeId: string }): JSX.Element`.

- [ ] **Step 1: Créer le composant**

Créer `src/app/(public)/comparateur/ThemeExplorer.tsx` :

```tsx
"use client";

import { useState } from "react";
import type { ComparaisonTheme, MatchResult } from "@/lib/comparateur-vie";
import { ThemeMatrix } from "./ThemeMatrix";
import { bindOrphans } from "@/lib/typography";

type Props = { themes: ComparaisonTheme[]; trio: MatchResult[]; defaultThemeId: string };

export function ThemeExplorer({ themes, trio, defaultThemeId }: Props) {
  const initial = themes.find((t) => t.id === defaultThemeId) ?? themes[0];
  const [openId, setOpenId] = useState(initial.id);
  // Une seule redirection : après le 1er clic délibéré, le sélecteur se verrouille (cf. spec 2.4).
  const [redirected, setRedirected] = useState(false);
  const open = themes.find((t) => t.id === openId) ?? themes[0];
  const locked = themes.filter((t) => t.id !== open.id);
  const canRedirect = !redirected;

  function reveal(id: string) {
    if (redirected) return;
    setOpenId(id);
    setRedirected(true);
  }

  return (
    <section className="mt-12">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent mb-2">Là où ça se joue</p>

      {/* Thème ouvert : la vraie grammaire (paliers + avantages), les 2-3 communes. */}
      <h3 className="font-normal text-[23px] leading-[1.1] text-label mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {open.titre}
      </h3>
      <p className="text-[14.5px] leading-[1.55] text-muted italic mb-4" style={{ textWrap: "pretty" }}>
        {bindOrphans(open.synthese)}
      </p>
      <ThemeMatrix theme={open} trio={trio} />

      {/* Vitrine : les autres thèmes. Cliquables tant qu'aucune redirection n'a eu lieu. */}
      {locked.length > 0 && (
        <>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-8 mb-4">
            {canRedirect ? "Dévoilez le thème qui compte pour vous" : `Les ${locked.length} autres thèmes`}
          </p>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${trio.length === 2 ? "" : "lg:grid-cols-3"} gap-3`}>
            {locked.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => reveal(th.id)}
                disabled={!canRedirect}
                className={`glass rounded-xl px-4 py-4 flex flex-col text-left transition-colors ${
                  canRedirect ? "hover:border-accent/40 cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] leading-[1.15] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {th.titre}
                  </p>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ghost shrink-0" aria-hidden>
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-ghost">{th.lignes.map((l) => l.label).join(" · ")}</p>
              </button>
            ))}
          </div>
          {!canRedirect && (
            <p className="mt-4 text-[12.5px] leading-[1.55] text-muted">
              {bindOrphans("Vous avez dévoilé votre thème. Les autres se détaillent dans le Pack, critère par critère.")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Vérifier tsc + eslint**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint "src/app/(public)/comparateur/ThemeExplorer.tsx"`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/comparateur/ThemeExplorer.tsx"
git commit -m "feat(comparateur): explorateur de thèmes (un dévoilé, vitrine cliquable, 1 redirection)"
```

---

### Task 5: Restructurer les résultats dans `page.tsx`

**Files:**
- Modify: `src/app/(public)/comparateur/page.tsx` (imports ; bloc de résultats ~107-246)

**Interfaces:**
- Consumes: `ModeChoixSynthese` (Task 3), `ThemeExplorer` (Task 4).
- Produces: nouvel ordre de résultats : synthèse → 3 cartes → explorateur → AskFuture → CTA. L'UI v2 (fracture à deux pôles, thème dévoilé isolé, vitrine verrouillée) est retirée.

- [ ] **Step 1: Ajouter les imports**

Dans `src/app/(public)/comparateur/page.tsx`, après `import { ModeChoixAsk } from "./ModeChoixAsk";` :

```tsx
import { ModeChoixSynthese } from "./ModeChoixSynthese";
import { ThemeExplorer } from "./ThemeExplorer";
```

- [ ] **Step 2: Remplacer le bloc de résultats**

Dans le `return` du chemin résultats, remplacer TOUT le bloc qui va du commentaire `{/* 1. LA LIGNE DE FRACTURE ... */}` jusqu'à la fin de la section `{/* 4. LE RESTE, VERROUILLÉ ... */}` (les 3 blocs : fracture `div &&`, face-à-face `trio.map`, thème dévoilé `section`, et reste verrouillé `lockedThemes`) par :

```tsx
      {/* 1. SYNTHÈSE générée (effet wow), une seule fois par chargement. */}
      <ModeChoixSynthese
        communes={trio.map((r) => ({
          nom: r.nom,
          region: r.region,
          identite: r.identite,
          compromis: r.compromis,
          distinctive: r.distinctive,
        }))}
        divergence={comparaison.divergence ? { domine: comparaison.divergence.domine, dominatorInsee: comparaison.divergence.dominatorInsee } : null}
      />

      {/* 2. LE FACE-À-FACE : une signature (offre) + un revers (compromis) par commune. */}
      <div className={`mt-8 grid grid-cols-1 ${colsClass} gap-4`}>
        {trio.map((r, i) => (
          <div key={r.insee} className="glass rounded-2xl p-5 flex flex-col">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-mono text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[20px] leading-[1.1] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {r.nom}
              </span>
            </div>
            <p className="text-[14px] leading-[1.55] text-accent italic">{r.identite}</p>
            <p className="mt-3 pt-3 border-t border-white/[0.08] text-[13px] leading-[1.55] text-muted">
              {r.compromis}
            </p>
          </div>
        ))}
      </div>

      {/* 3. L'EXPLORATEUR : un thème dévoilé (défaut repondéré), le reste en vitrine cliquable. */}
      <ThemeExplorer themes={comparaison.themes} trio={trio} defaultThemeId={revealedThemeId} />
```

- [ ] **Step 3: Calculer `revealedThemeId` et retirer les variables v2 inutiles**

Plus haut dans la fonction (zone ~100-105 qui calcule `div`, `revealed`, `lockedThemes`), remplacer :

```tsx
  // Le thème DÉVOILÉ = celui qui porte la fracture (le plus parlant). Repli : 1er thème.
  const div = comparaison.divergence;
  const nomBy = new Map(trio.map((r) => [r.insee, r.nom]));
  const revealed =
    (div && comparaison.themes.find((t) => t.id === div.themeId)) ?? comparaison.themes[0];
  const lockedThemes = comparaison.themes.filter((t) => t.id !== revealed.id);
```

par :

```tsx
  // Thème ouvert par défaut dans l'explorateur : celui de la divergence repondérée (cf. Task 1).
  // Repli : 1er thème. L'explorateur gère ensuite l'ouverture/verrouillage côté client.
  const revealedThemeId = comparaison.divergence?.themeId ?? comparaison.themes[0].id;
```

(Ceci supprime `div`, `nomBy`, `revealed`, `lockedThemes`, qui ne servaient qu'à l'UI v2 désormais retirée.)

- [ ] **Step 4: Vérifier tsc + eslint (chasse aux variables/iimports orphelins)**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint "src/app/(public)/comparateur/page.tsx"`
Expected: aucune sortie. (Si eslint signale `MatrixHeader`/`ThemeMatrix`/`bindOrphans` non utilisés suite au retrait, ajuster les imports en conséquence. `ThemeMatrix` n'est plus utilisé directement par `page.tsx` : retirer son import ; `bindOrphans` reste utilisé par le hero et le CTA.)

- [ ] **Step 5: Test runtime**

Sur le dev server, charger `http://localhost:3000/comparateur?communes=17300,35238,56121`.
Expected, de haut en bas : synthèse qui se streame, 3 cartes villes, « Là où ça se joue » avec un thème ouvert (matrice montrant les 3 communes) et les autres thèmes cliquables ; cliquer un thème verrouillé l'ouvre et fige le sélecteur ; AskFuture ; CTA Pack.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/comparateur/page.tsx"
git commit -m "feat(comparateur): résultat v3 (synthèse → cartes → explorateur), retrait UI v2"
```

---

### Task 6: Enrichir l'accueil (hero réécrit + 7 thèmes)

**Files:**
- Modify: `src/app/(public)/comparateur/page.tsx` (composant `Hero` ~39-66 ; import de `THEME_ORDER`)

**Interfaces:**
- Consumes: `THEME_ORDER` (Task 1, désormais exporté).
- Produces: accueil non vide qui explique ce qu'on compare (les 7 thèmes), hero sans « pas un score de plus ».

- [ ] **Step 1: Importer `THEME_ORDER`**

Dans `src/app/(public)/comparateur/page.tsx`, ajouter à l'import existant de `@/lib/comparateur-vie` :

```tsx
import { seedComparaison, THEME_ORDER } from "@/lib/comparateur-vie";
```

- [ ] **Step 2: Réécrire le sous-titre du hero plein**

Dans le `Hero` (branche non-`compact`), remplacer le `<p>` du sous-titre :

```tsx
      <p className="mt-4 text-[15px] leading-[1.6] text-muted" style={{ textWrap: "pretty" }}>
        {bindOrphans("Nommez les communes que vous avez en tête. On les met face à face sur près de 30 critères, du climat aux risques, du cadre de vie à la mobilité, et on montre ce que chacune vous fait gagner ou perdre.")}
      </p>
```

- [ ] **Step 3: Afficher les 7 thèmes sous le hero (état accueil seulement)**

Toujours dans `Hero` (branche non-`compact`), juste avant la balise fermante `</div>` du hero, ajouter :

```tsx
      <div className="mt-7">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ghost mb-3">Ce qu&apos;on compare</p>
        <div className="flex flex-wrap gap-2">
          {THEME_ORDER.map((t) => (
            <span key={t.id} className="text-[12.5px] leading-none text-muted border border-white/[0.1] rounded-full px-3 py-1.5">
              {t.titre}
            </span>
          ))}
        </div>
      </div>
```

- [ ] **Step 4: Vérifier tsc + eslint**

Run: `npx tsc --noEmit 2>&1 | grep -v suivi-bientot ; npx eslint "src/app/(public)/comparateur/page.tsx"`
Expected: aucune sortie.

- [ ] **Step 5: Test runtime**

Charger `http://localhost:3000/comparateur` (sans communes).
Expected : hero réécrit (plus de « pas un score de plus »), une rangée de 7 thèmes sous le sous-titre, puis la saisie. La page ne paraît plus vide.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/comparateur/page.tsx"
git commit -m "feat(comparateur): accueil enrichi (hero réécrit + 7 thèmes affichés)"
```

---

## Notes de fin

- **Hors périmètre (parqué, spec §4)** : cadrage de la valeur du Pack, rapport-de-preuve sur une commune, suppression du module Métier. Ne PAS toucher au CTA Pack ici.
- **À re-juger après build** : passer 10-15 générations réelles de la synthèse (modèle léger) devant l'agent éditorial avant de figer le prompt (cf. spec 2.3.bis). Tester aussi le cas `domine` (2 communes dont une domine) et le cas « communes proches ».
- **Type `Divergence`** : laissé intact (les champs leader/exposé restent peuplés mais ne sont plus lus par l'UI). Ne pas le simplifier sans vérifier les consommateurs du Pack et de /ou-vivre.

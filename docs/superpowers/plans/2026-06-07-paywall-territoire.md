# Paywall territoire (rapport 14 €) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la page paywall `debloquer` en page de conviction honnête : remise en contexte, aperçu RÉEL du module prêt (Quartier, via données par INSEE), perso hybride, copie honnête sur le périmètre, CTA langage produit.

**Architecture:** Page serveur. Une fonction serveur `getQuartierPreview(insee)` réutilise `gatherCommuneEnrichment` (déjà INSEE-based, sans auth) pour bâtir des cartes d'aperçu déterministes et gatées sur la présence réelle des données. Un composant serveur les affiche (verrouillées), un composant client ajoute une ligne perso depuis `localStorage`. Le panneau Stripe et le flux compte restent inchangés.

**Tech Stack:** TypeScript, Next.js 16 (App Router, Server Components), React 19, Tailwind v4. Pas de framework de test : vérification par `npx tsc --noEmit`, `npm run lint`, et `curl` de la page sur le dev server.

**Spec :** `docs/superpowers/specs/2026-06-07-paywall-territoire-design.md`

**Doctrine :** honnêteté (que du vrai, ne promettre que ce qui est livré), pas de chiffre dans l'aperçu, pas de tiret cadratin, langage produit jusqu'au CTA, largeur de texte = conteneur de page.

---

## File Structure

- `src/lib/quartier-preview.ts` (créer) — `getQuartierPreview(insee)` + types `QuartierPreview`/`QuartierPreviewCard`.
- `src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx` (créer) — composant serveur, cartes verrouillées (présentation pure).
- `src/app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx` (créer) — composant client, ligne perso depuis `localStorage`.
- `src/lib/checkout-products.ts` (modifier) — `features` honnêtes pour `rapport-complet`.
- `src/app/(public)/territoire/[insee]/debloquer/page.tsx` (modifier) — nouvelle structure de page.
- `src/app/(public)/ou-vivre/OuVivreClient.tsx` (modifier) — dépose les libellés du projet en `localStorage` au clic explorer.

Le contenu profond du rapport, le paiement (`TerritoryUnlockPanel`, `PaymentWrapper`) et l'activation restent inchangés.

---

## Task 1: Offre honnête (checkout-products)

**Files:**
- Modify: `src/lib/checkout-products.ts`

- [ ] **Step 1: Réécrire les features et le sous-titre du produit `rapport-complet`**

Remplacer le `subtitle` et le tableau `features` du produit `"rapport-complet"` (qui annonce « six modules » non construits) par un périmètre honnête :

```typescript
    subtitle:
      "Une lecture interactive de ce que le territoire devient, à conserver et à enrichir.",
    amount: 14,
    priceLabel: "14 € une fois",
    productType: "one-shot",
    ctaLabel: "Débloquer le rapport",
    features: [
      "La lecture du territoire : ce qu'il devient face au climat (canicule, inondation, sécheresse)",
      "Les sources publiques croisées et rendues lisibles pour cette commune",
      "AskFuture — 3 questions pour approfondir le territoire",
      "À conserver, et qui s'enrichit au fil des prochains modules",
    ],
```

(Laisser le produit `suivi` inchangé.)

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS, zéro erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/checkout-products.ts
git commit -m "feat(paywall): offre rapport honnete (perimetre reel, plus de '6 modules')"
```

---

## Task 2: Aperçu réel du module Quartier (`getQuartierPreview`)

**Files:**
- Create: `src/lib/quartier-preview.ts`

Réutilise `gatherCommuneEnrichment(insee)` (déjà INSEE-based, sans contexte utilisateur, chaque source a son propre cache) et `deriveQuartierSources` (chips de sources réelles). Les `constat` sont des phrases déterministes, SANS chiffre, GATÉES sur la présence réelle de la donnée : on ne fabrique rien, on décrit ce que le module couvre pour cette commune. L'analyse incarnée (et les chiffres) reste dans le rapport.

- [ ] **Step 1: Écrire la fonction**

```typescript
import "server-only";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { deriveQuartierSources } from "@/lib/quartier-signals";

export type QuartierPreviewCard = { titre: string; constat: string };
export type QuartierPreview = { cards: QuartierPreviewCard[]; sources: string[] };

// Garde-fou latence : une paywall doit rester rapide. L'enrichissement fait des appels
// externes (DRIAS, Géorisques…) ; on plafonne l'attente et, au-delà, on rend null (la page
// masque le bloc aperçu). Jamais d'erreur bloquante, jamais de rendu retardé au-delà du cap.
const PREVIEW_TIMEOUT_MS = 1200;

// Aperçu RÉEL du module Quartier pour un INSEE. Cartes déterministes gatées sur la présence
// de la donnée (pas de fabrication, pas de chiffre). null = pas d'aperçu exploitable OU trop
// lent -> la page masque le bloc. cf. spec 2026-06-07-paywall-territoire.
export async function getQuartierPreview(insee: string): Promise<QuartierPreview | null> {
  const enrichment = await Promise.race([
    gatherCommuneEnrichment(insee).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), PREVIEW_TIMEOUT_MS)),
  ]);
  if (!enrichment) return null;

  const georisques = enrichment.georisques ?? null;
  const catnat = enrichment.catnat ?? null;
  const sources = deriveQuartierSources(enrichment, georisques, catnat, "gwl30");

  const cards: QuartierPreviewCard[] = [];

  if (enrichment.drias?.commune?.s) {
    cards.push({
      titre: "Le climat à venir",
      constat:
        "La trajectoire climatique de cette commune est projetée à plusieurs horizons : étés plus chauds, saisons qui se déforment.",
    });
  }
  if (georisques?.flags?.flood || georisques?.flags?.marineSubmersion || (catnat && catnat.total > 0)) {
    cards.push({
      titre: "Inondation et catastrophes naturelles",
      constat:
        "Le territoire porte un historique de catastrophes naturelles reconnues, que le rapport replace dans son contexte.",
    });
  }
  if (enrichment.vigieau?.maxLevel || enrichment.eau?.drought) {
    cards.push({
      titre: "Sécheresse et ressource en eau",
      constat:
        "La ressource en eau et les sols connaissent des tensions, suivies par les restrictions et l'état des nappes.",
    });
  }
  if (georisques) {
    cards.push({
      titre: "Les risques du secteur",
      constat:
        "Les risques naturels et technologiques recensés autour de l'adresse sont passés en revue, un par un.",
    });
  }

  if (cards.length === 0) return null;
  return { cards: cards.slice(0, 4), sources };
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS. Si une propriété d'`enrichment` n'existe pas sous ce nom (ex. `drias.commune.s`), aligner sur la forme réelle utilisée dans `src/app/(account)/rapport/quartier/page.tsx` (qui lit `enrichment?.drias?.commune.s`, `enrichment?.georisques`, `enrichment?.catnat`, `enrichment?.vigieau`, `enrichment?.eau?.drought`).

- [ ] **Step 3: Vérifier le lint**

Run: `npx eslint src/lib/quartier-preview.ts`
Expected: aucune sortie (clean).

- [ ] **Step 4: Commit**

```bash
git add src/lib/quartier-preview.ts
git commit -m "feat(paywall): getQuartierPreview (apercu reel par INSEE, gate sur la donnee)"
```

---

## Task 3: Composant d'aperçu verrouillé (`TerritoryUnlockPreview`)

**Files:**
- Create: `src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx`

Présentation pure : cartes titre + constat tronqué par un fondu + cadenas, et la liste des sources réelles mobilisées. Composant serveur (pas de `"use client"`).

- [ ] **Step 1: Écrire le composant**

```tsx
import type { QuartierPreview } from "@/lib/quartier-preview";

// Aperçu verrouillé du rapport (module Quartier réel). Le constat est visible (preuve),
// l'analyse est masquée par un fondu + cadenas. Présentation pure. cf. spec.
export function TerritoryUnlockPreview({
  preview,
  commune,
}: {
  preview: QuartierPreview;
  commune: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {preview.cards.map((card) => (
          <div
            key={card.titre}
            className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5"
          >
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-2">
              {card.titre}
            </p>
            <p className="text-[14px] leading-[1.6] text-label/90">{card.constat}</p>
            {/* Le reste de l'analyse, masqué */}
            <div className="mt-2 h-12 relative">
              <div className="space-y-1.5" aria-hidden>
                <div className="h-2.5 w-[92%] rounded bg-white/[0.06]" />
                <div className="h-2.5 w-[78%] rounded bg-white/[0.06]" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-canvas" />
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost">
              <span aria-hidden>🔒</span> Lecture complète dans le rapport
            </p>
          </div>
        ))}
      </div>
      {preview.sources.length > 0 && (
        <p className="mt-4 text-[12px] text-ghost">
          Sources mobilisées pour {commune} : {preview.sources.join(" · ")}.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx"`
Expected: PASS, aucune sortie eslint. (Le composant n'est pas encore importé ; il compile seul.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx"
git commit -m "feat(paywall): composant apercu verrouille du rapport"
```

---

## Task 4: Touche personnalisée (`PersonalTouch`)

**Files:**
- Create: `src/app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx`

Client. Lit `localStorage["futuree:projet:labels"]` (tableau de libellés humains, déposé par `/ou-vivre`). Si présent, affiche UNE ligne perso ; sinon ne rend rien. Aucune donnée sensible (juste des gloses de préférences, déjà client-safe).

- [ ] **Step 1: Écrire le composant**

```tsx
"use client";

import { useEffect, useState } from "react";

// Ligne personnalisée optionnelle : reprend les priorités du projet (si l'utilisateur en a
// tapé un sur /ou-vivre) pour relier l'aperçu à SA décision. Best-effort, jamais bloquant.
export function PersonalTouch({ commune }: { commune: string }) {
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("futuree:projet:labels");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLabels(parsed.filter((x): x is string => typeof x === "string").slice(0, 4));
      }
    } catch {
      // ignore : pas de perso, l'aperçu commune suffit
    }
  }, []);

  if (labels.length === 0) return null;

  return (
    <p className="mb-4 text-[14px] leading-[1.6] text-muted">
      <span className="text-accent">Vu vos priorités</span> ({labels.join(", ")}), le rapport
      situe {commune} sur chacun de ces points.
    </p>
  );
}
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx"`
Expected: PASS, aucune sortie eslint.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx"
git commit -m "feat(paywall): PersonalTouch (ligne perso depuis localStorage)"
```

---

## Task 5: Déposer le projet en localStorage (OuVivreClient)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (fonction `onExplore`, ligne 503)

- [ ] **Step 1: Vérifier l'import de `preferencesToLabels`**

En haut de `OuVivreClient.tsx`, s'assurer que `preferencesToLabels` est importé depuis `@/lib/comparateur-labels`. S'il ne l'est pas déjà, ajouter à l'import existant de ce module, ou ajouter :

```typescript
import { preferencesToLabels } from "@/lib/comparateur-labels";
```

- [ ] **Step 2: Écrire les libellés du projet au clic explorer**

Remplacer la fonction `onExplore` (ligne 503) par :

```typescript
  const onExplore = (r: MatchResult, rang: number) => {
    capture("life_explore_clicked", { rang, insee: r.insee });
    // Dépose les priorités du projet (libellés client-safe) pour la touche perso de la paywall.
    try {
      const labels = preferencesToLabels(parsed?.preferences ?? null);
      if (labels.length > 0) {
        window.localStorage.setItem("futuree:projet:labels", JSON.stringify(labels));
      }
    } catch {
      // best-effort, jamais bloquant
    }
  };
```

- [ ] **Step 3: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(public)/ou-vivre/OuVivreClient.tsx"`
Expected: PASS, aucune sortie eslint.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(paywall): depose les priorites du projet en localStorage au clic explorer"
```

---

## Task 6: Refonte de la page paywall (`debloquer/page.tsx`)

**Files:**
- Modify: `src/app/(public)/territoire/[insee]/debloquer/page.tsx`

Nouvelle structure de conviction. On garde le bloc auth/panneau Stripe existant (lignes 97-127 actuelles) et les imports/garde-fous INSEE.

- [ ] **Step 1: Ajouter les imports du preview**

Sous les imports existants, ajouter :

```typescript
import { getQuartierPreview } from "@/lib/quartier-preview";
import { TerritoryUnlockPreview } from "./TerritoryUnlockPreview";
import { PersonalTouch } from "./PersonalTouch";
```

- [ ] **Step 2: Charger l'aperçu (server) après la résolution de l'INSEE**

Dans `TerritoryUnlockPage`, après la ligne `const product = getCheckoutProduct("rapport-complet")!;`, ajouter :

```typescript
  const preview = await getQuartierPreview(insee);
```

- [ ] **Step 3: Remplacer le `<main>` par la nouvelle structure**

Remplacer tout le bloc `<main className="max-w-[760px] mx-auto px-6 py-16"> … </main>` par :

```tsx
      <main className="max-w-[760px] mx-auto px-6 py-16">
        <Link
          href="/ou-vivre"
          className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost hover:text-muted no-underline"
        >
          ← Retour aux territoires
        </Link>

        {/* 1. Hero de continuité */}
        <p className="mt-10 font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
          Rapport de territoire · {displayName} · 14 € une fois
        </p>
        <h1
          className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-label"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Avant de choisir <span className="italic text-accent">{displayName}</span>, regardez ce
          que les données racontent vraiment.
        </h1>
        <p className="mt-5 max-w-[52ch] text-[16px] leading-[1.7] text-muted">
          Vous avez vu pourquoi {displayName} ressort dans votre recherche. Le rapport va plus
          loin : il met à plat ce que ce territoire devient face au climat, et ce que ça implique
          concrètement pour un projet de vie.
        </p>

        {/* 2. Ce que le rapport permet de vérifier (honnête, sans liste de modules) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { t: "Comprendre le territoire", d: "Ce que la commune devient : canicule, inondation, sécheresse, risques du secteur." },
            { t: "Situer les principaux compromis", d: "Ce qui joue en sa faveur, ce qui demande vigilance, ce qui dépend de votre projet." },
            { t: "Poser vos questions", d: "3 questions à AskFuture pour approfondir le territoire." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5">
              <p className="text-[15px] text-label" style={{ fontFamily: "var(--font-serif)" }}>{c.t}</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">{c.d}</p>
            </div>
          ))}
        </div>

        {/* 3. Aperçu réel (masqué si indisponible) */}
        {preview && (
          <section className="mt-14">
            <h2 className="text-[22px] text-label mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              Aperçu du rapport de {displayName}
            </h2>
            <p className="text-[13px] text-muted mb-5">
              Le constat est visible, l&apos;analyse complète se débloque avec le rapport.
            </p>
            <PersonalTouch commune={displayName} />
            <TerritoryUnlockPreview preview={preview} commune={displayName} />
          </section>
        )}

        {/* 4. AskFuture par l'exemple */}
        <section className="mt-14">
          <h2 className="text-[22px] text-label mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Vous pourrez demander
          </h2>
          <ul className="flex flex-col gap-2.5">
            {[
              `${displayName} est-elle adaptée à mon projet ?`,
              "Quels sont les compromis les plus importants ?",
              "Quels risques regarder avant d'acheter ou de louer ?",
              "Que faudrait-il vérifier sur place ?",
            ].map((q) => (
              <li key={q} className="flex items-start gap-3 text-[14px] text-label/90">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Pourquoi 14 € + réassurance */}
        <section className="mt-14 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-2">
            Pourquoi ce rapport est payant ?
          </p>
          <p className="text-[14px] leading-[1.7] text-muted">
            futur·e croise des données publiques dispersées, les rend lisibles commune par
            commune et les applique à votre projet. Vous ne payez pas l&apos;accès aux données
            publiques, vous payez leur croisement, leur mise en perspective et leur lecture.
          </p>
          <p className="mt-4 text-[14px] leading-[1.7] text-muted">
            <span className="text-label">Aucun engagement.</span> Débloquer ce rapport
            n&apos;ajoute pas {displayName} comme commune de résidence : vous l&apos;ouvrez
            simplement pour la lire, la comparer et la conserver.
          </p>
        </section>

        {/* 6. CTA paiement (langage produit : « Explorer », pas « Débloquer » qui sonne SaaS) */}
        <h2 className="mt-14 text-[22px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
          Explorer le rapport de {displayName}
        </h2>
        <div className="mt-5 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
          {user ? (
            <TerritoryUnlockPanel
              insee={insee}
              commune={commune}
              rank={rank}
              amount={product.amount}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-[20px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                Ouvrez d&apos;abord votre espace.
              </h3>
              <p className="text-[14px] leading-[1.6] text-muted">
                Le rapport est rattaché à votre compte pour que vous le retrouviez à tout moment.
              </p>
              <Link
                href={`/inscription?next=${encodeURIComponent(backHref)}`}
                className="flex items-center justify-center rounded-lg bg-accent px-6 py-4 font-mono text-[12px] tracking-[0.12em] uppercase font-semibold text-canvas no-underline"
              >
                Créer mon compte puis débloquer
              </Link>
              <Link
                href={`/connexion?next=${encodeURIComponent(backHref)}`}
                className="flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3.5 text-[14px] text-muted no-underline"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] tracking-[0.06em] text-ghost">
          Stripe · sécurisé · TVA incluse · paiement unique
        </p>
      </main>
```

(La liste générique `product.features` n'est plus rendue : la page porte désormais sa propre copie honnête. `product` reste utilisé pour `amount`.)

- [ ] **Step 4: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/(public)/territoire/[insee]/debloquer/page.tsx"`
Expected: PASS, aucune sortie eslint.

- [ ] **Step 5: Vérifier le rendu serveur (dev)**

Avec `npm run dev` en cours :

Run: `curl -s -m 90 "http://localhost:3000/territoire/38185/debloquer?nom=Grenoble" | grep -o "Avant de choisir.\{0,40\}\|Aperçu du rapport.\{0,30\}\|Pourquoi ce rapport est payant\|Explorer le rapport de.\{0,20\}"`
Expected : on voit le hero (« Avant de choisir … Grenoble »), le bloc « Pourquoi ce rapport est payant », le CTA « Explorer le rapport de Grenoble », et (si l'enrichissement Grenoble répond) « Aperçu du rapport ». Si l'aperçu manque, ce n'est pas une erreur (repli prévu) ; vérifier alors avec une autre commune (`35238`/Rennes) que l'aperçu apparaît au moins une fois.

- [ ] **Step 6: Vérifier dans le navigateur**

Sur `http://localhost:3000/ou-vivre` : lancer une recherche, cliquer « Découvrir ce territoire » sur une fiche. Vérifier sur la paywall : hero de continuité, 3 cartes « ce que vous vérifiez », aperçu verrouillé (constat lisible + fondu + cadenas), la **ligne perso** (« Vu vos priorités … ») présente puisqu'on arrive depuis un projet, les questions AskFuture, « pourquoi 14 € », et le CTA « Débloquer le rapport de {commune} ». Aucun chiffre dans l'aperçu, pas de mention de modules non construits.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/territoire/[insee]/debloquer/page.tsx"
git commit -m "feat(paywall): refonte conviction (hero continuite, apercu reel, pourquoi 14e, CTA produit)"
```

---

## Notes de fin de plan

- **Aperçu sobre assumé** : tant que le rapport est surtout « Quartier », l'aperçu reste sobre. C'est le prix de l'honnêteté ; il s'enrichira quand les modules arriveront (ajouter des cartes à `getQuartierPreview`, ou un `getReportPreview` multi-modules).
- **Constats déterministes, pas de prose extraite** : les `constat` décrivent ce que le module couvre pour la commune, gatés sur la donnée réelle, sans chiffre ni fabrication. La vraie prose éditoriale (IA, côté rapport) reste verrouillée. C'est volontaire et honnête.
- **CTA Stripe** : le bouton de paiement lui-même (dans `PaymentWrapper`) peut rester « Payer 14 € » au moment de l'acte d'achat (réassurance bancaire) ; le langage produit est porté par le titre de section « Débloquer le rapport de {commune} ».
- **Perso** : best-effort. La page reste juste et honnête sans projet en `localStorage`.
- Hors périmètre rappelé : Pack Décision 39 €, finir les modules du rapport, aperçu Logement (adresse), exemple d'une autre commune.

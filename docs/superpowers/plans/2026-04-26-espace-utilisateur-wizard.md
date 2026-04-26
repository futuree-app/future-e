# Espace utilisateur & Wizard rapport — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre l'architecture de dossiers (route groups Next.js), unifier le design system (tokens CSS + Tailwind sur toutes les pages existantes), et implémenter le Wizard "Générer mon rapport" en overlay `<dialog>` natif.

**Architecture:** Route groups `(auth)`, `(account)`, `(dashboard)`, `(public)` pour l'organisation. Token CSS dans `globals.css` + `@theme` Tailwind v4 pour la cohérence visuelle. Wizard en `<dialog>` natif orchestré par `ReportWizard`, état en `sessionStorage`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Supabase SSR — aucune dépendance nouvelle.

**Spec de référence:** `docs/superpowers/specs/2026-04-26-espace-utilisateur-wizard-design.md`

---

## Carte des fichiers

### Créés
| Fichier | Responsabilité |
|---|---|
| `src/app/(auth)/layout.tsx` | Shell visuel auth (orbs, brand, story) |
| `src/app/(account)/layout.tsx` | Shell sombre authentifié (pass-through) |
| `src/app/(dashboard)/layout.tsx` | Shell dashboard (pass-through) |
| `src/app/(public)/layout.tsx` | Shell public (pass-through) |
| `src/components/AccountNav.tsx` | Nav partagée entre compte/ et rapport/ |
| `src/components/wizard/types.ts` | WizardState, WizardAnswers |
| `src/components/wizard/WizardStepper.tsx` | Barre de progression |
| `src/components/wizard/WizardStep.tsx` | Écran d'une question (6 configs) |
| `src/components/wizard/WizardTeaser.tsx` | Aperçu personnalisé + paywall |
| `src/components/wizard/ReportWizard.tsx` | Orchestrateur dialog + sessionStorage |

### Déplacés (git mv)
| Source | Destination |
|---|---|
| `src/app/connexion/` | `src/app/(auth)/connexion/` |
| `src/app/inscription/` | `src/app/(auth)/inscription/` |
| `src/app/compte/` | `src/app/(account)/compte/` |
| `src/app/rapport/` | `src/app/(account)/rapport/` |
| `src/app/dashboard/` | `src/app/(dashboard)/dashboard/` |
| `src/app/page.tsx` | `src/app/(public)/page.tsx` |
| `src/app/savoir/` | `src/app/(public)/savoir/` |
| `src/app/territoires/` | `src/app/(public)/territoires/` |
| `src/app/agir/` | `src/app/(public)/agir/` |

### Modifiés
| Fichier | Changement |
|---|---|
| `src/app/globals.css` | `@theme` Tailwind v4 + `--c-*` vars + `.glass` + animations dialog |
| `src/app/(auth)/connexion/page.tsx` | Simplification (AuthShell → layout) |
| `src/app/(auth)/inscription/page.tsx` | Simplification (AuthShell → layout) |
| `src/app/(account)/compte/page.tsx` | Réécriture Tailwind + tokens, suppression inline styles |
| `src/app/(account)/rapport/page.tsx` | Réécriture Tailwind + tokens, suppression `@ts-nocheck` |
| `src/app/(dashboard)/dashboard/page.tsx` | Alignement tokens CSS |
| `src/components/FutureELanding.tsx` | Ajout trigger Wizard |

---

## Groupe A — Fondation & Structure

### Task 1 : CSS tokens + design system dans globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1 : Ajouter le bloc `@theme` Tailwind v4 après `@import "tailwindcss"`**

```css
@import "tailwindcss";

@theme {
  --color-canvas:  #060812;
  --color-label:   #e9ecf2;
  --color-muted:   #9ba3b4;
  --color-ghost:   #6b7388;
  --color-orange:  #fb923c;
  --color-danger:  #f87171;
  --color-violet:  #a78bfa;
  --color-success: #4ade80;
  --color-info:    #60a5fa;
}
```

Cela génère automatiquement les utilities Tailwind : `bg-canvas`, `text-label`, `text-muted`, `text-ghost`, `text-orange`, `bg-orange`, `border-orange`, `text-info`, `text-violet`, etc.

- [ ] **Step 2 : Ajouter les variables CSS `--c-*` et les utilitaires partagés après le bloc `@theme`**

```css
:root {
  --c-bg:          #060812;
  --c-bg-elevated: rgba(255,255,255,0.03);
  --c-border:      rgba(255,255,255,0.08);
  --c-text:        #e9ecf2;
  --c-muted:       #9ba3b4;
  --c-dim:         #6b7388;
  --c-orange:      #fb923c;
  --c-red:         #f87171;
  --c-violet:      #a78bfa;
  --c-green:       #4ade80;
  --c-blue:        #60a5fa;
}

/* Glassmorphism — remplace la fonction glass() inline dans les pages */
.glass {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Wizard step animation */
@keyframes step-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.wizard-step {
  animation: step-enter 0.22s ease-out both;
}

/* Dialog natif — styles non reproductibles en Tailwind */
dialog.wizard-dialog {
  background: #0d1120;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 0;
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100dvh - 64px);
  overflow: hidden;
}
dialog.wizard-dialog::backdrop {
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
}
/* Scroll-lock quand dialog ouvert */
body:has(dialog.wizard-dialog[open]) {
  overflow: hidden;
}
```

- [ ] **Step 3 : Vérifier que le build passe**

```bash
cd "/Users/quentinbrache/Desktop/Futur·e" && npm run build
```

Expected : `✓ Compiled successfully` (ou uniquement des erreurs non liées aux CSS)

- [ ] **Step 4 : Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS design tokens and glass utility to globals.css"
```

---

### Task 2 : Route group `(auth)` + simplification AuthShell

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Move+simplify: `src/app/(auth)/connexion/page.tsx`
- Move+simplify: `src/app/(auth)/inscription/page.tsx`

- [ ] **Step 1 : Déplacer les pages auth**

```bash
mkdir -p "/Users/quentinbrache/Desktop/Futur·e/src/app/(auth)/connexion"
mkdir -p "/Users/quentinbrache/Desktop/Futur·e/src/app/(auth)/inscription"
git mv "src/app/connexion/page.tsx" "src/app/(auth)/connexion/page.tsx"
git mv "src/app/inscription/page.tsx" "src/app/(auth)/inscription/page.tsx"
```

- [ ] **Step 2 : Créer `src/app/(auth)/layout.tsx`**

Ce layout prend en charge tout ce que `AuthShell` faisait, y compris les orbs, le branding et la colonne gauche (auth-story). Les pages n'utilisent plus `<AuthShell>`.

```tsx
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-orb auth-shell-orb-primary" />
      <div className="auth-shell-orb auth-shell-orb-secondary" />
      <div className="auth-shell-orb auth-shell-orb-tertiary" />

      <div className="auth-shell-stage">
        <div className="auth-shell-brand">
          <Link className="auth-brandmark" href="/">
            futur<span>•</span>e
          </Link>
          <p className="auth-brand-kicker">Projection climatique personnelle</p>
        </div>

        <div className="auth-grid">
          <section className="auth-story">
            <p className="auth-story-label">Connexion sécurisée</p>
            <h2 className="auth-story-title">
              Une entrée simple, dans la même atmosphère que le rapport.
            </h2>
            <p className="auth-story-copy">
              futur•e n&apos;ouvre pas une simple session. Vous retrouvez un
              espace personnel où la commune, les tensions et le suivi restent
              lisibles, sobres et tracés.
            </p>
            <div className="auth-story-card">
              <p className="auth-story-card-label">Ce que vous retrouvez</p>
              <ul className="auth-story-list">
                <li>vos projections locales et leurs scénarios DRIAS</li>
                <li>un accès direct au compte, au dashboard et au rapport</li>
                <li>un accès classique par email et mot de passe</li>
              </ul>
            </div>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Simplifier `src/app/(auth)/connexion/page.tsx`**

La page ne wrappe plus dans `<AuthShell>` — le layout s'en charge. Elle rend uniquement la carte.

```tsx
import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signInWithPasswordAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <div className="auth-card auth-card-wide">
      <Link className="auth-back" href="/">
        Retour à l&apos;accueil
      </Link>
      <PasswordForm
        action={signInWithPasswordAction}
        title="Connexion"
        subtitle="Entrez votre email et votre mot de passe pour retrouver votre espace futur•e."
        submitLabel="Se connecter"
        pendingLabel="Connexion..."
        passwordAutoComplete="current-password"
      />
      <p className="auth-alt">
        Pas encore de compte ?{" "}
        <Link className="auth-link" href="/inscription">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4 : Simplifier `src/app/(auth)/inscription/page.tsx`**

```tsx
import Link from "next/link";
import { PasswordForm } from "@/components/AuthForms";
import { signUpWithPasswordAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <div className="auth-card auth-card-wide">
      <Link className="auth-back" href="/">
        Retour à l&apos;accueil
      </Link>
      <PasswordForm
        action={signUpWithPasswordAction}
        title="Créer un compte"
        subtitle="Choisissez votre email et un mot de passe pour ouvrir votre espace futur•e."
        submitLabel="Créer mon compte"
        pendingLabel="Création..."
        passwordAutoComplete="new-password"
      />
      <p className="auth-alt">
        Vous avez déjà un compte ?{" "}
        <Link className="auth-link" href="/connexion">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5 : Vérifier les URLs**

```bash
npm run build
```

Expected : pas d'erreur TypeScript sur les pages auth. Les routes `/connexion` et `/inscription` restent valides (les route groups sont transparents au routing).

- [ ] **Step 6 : Commit**

```bash
git add "src/app/(auth)/"
git commit -m "refactor: move auth pages to (auth) route group, layout hosts AuthShell"
```

---

### Task 3 : Route group `(account)`

**Files:**
- Create: `src/app/(account)/layout.tsx`
- Move: `src/app/(account)/compte/`
- Move: `src/app/(account)/rapport/`

- [ ] **Step 1 : Déplacer les répertoires**

```bash
mkdir -p "/Users/quentinbrache/Desktop/Futur·e/src/app/(account)"
git mv "src/app/compte" "src/app/(account)/compte"
git mv "src/app/rapport" "src/app/(account)/rapport"
```

- [ ] **Step 2 : Créer `src/app/(account)/layout.tsx`**

Layout minimal — les pages gardent leur propre nav pour l'instant (refactorisée en Task 6).

```tsx
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3 : Corriger les imports dans les pages déplacées**

Dans `src/app/(account)/compte/page.tsx`, l'import de `QuartierWorkbook` devient relatif :
```tsx
// Avant
import { QuartierWorkbook } from "@/app/compte/QuartierWorkbook";
// Après
import { QuartierWorkbook } from "./QuartierWorkbook";
```

Dans `src/app/(account)/rapport/page.tsx`, aucun import interne à corriger (tous en `@/lib/`).

- [ ] **Step 4 : Build**

```bash
npm run build
```

Expected : `✓ Compiled` — routes `/compte` et `/rapport` toujours valides.

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(account)/"
git commit -m "refactor: move compte and rapport to (account) route group"
```

---

### Task 4 : Route group `(dashboard)`

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Move: `src/app/(dashboard)/dashboard/`

- [ ] **Step 1 : Déplacer**

```bash
mkdir -p "/Users/quentinbrache/Desktop/Futur·e/src/app/(dashboard)"
git mv "src/app/dashboard" "src/app/(dashboard)/dashboard"
```

- [ ] **Step 2 : Créer `src/app/(dashboard)/layout.tsx`**

```tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3 : Build + commit**

```bash
npm run build
git add "src/app/(dashboard)/"
git commit -m "refactor: move dashboard to (dashboard) route group"
```

---

### Task 5 : Route group `(public)`

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Move: `src/app/(public)/page.tsx`, `savoir/`, `territoires/`, `agir/`

- [ ] **Step 1 : Déplacer**

```bash
mkdir -p "/Users/quentinbrache/Desktop/Futur·e/src/app/(public)"
git mv "src/app/page.tsx" "src/app/(public)/page.tsx"
git mv "src/app/savoir" "src/app/(public)/savoir"
git mv "src/app/territoires" "src/app/(public)/territoires"
git mv "src/app/agir" "src/app/(public)/agir"
```

- [ ] **Step 2 : Créer `src/app/(public)/layout.tsx`**

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3 : Build et vérifier les routes clés**

```bash
npm run build
```

Expected : routes `/`, `/savoir/*`, `/territoires/*`, `/agir/*` compilent sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add "src/app/(public)/"
git commit -m "refactor: move public pages to (public) route group"
```

---

## Groupe B — Migration design system

### Task 6 : Composant `AccountNav` + réécriture `compte/page.tsx`

**Files:**
- Create: `src/components/AccountNav.tsx`
- Modify: `src/app/(account)/compte/page.tsx`

- [ ] **Step 1 : Créer `src/components/AccountNav.tsx`**

```tsx
import Link from "next/link";

type Cta = { href: string; label: string };

export function AccountNav({
  secondaryCta,
  primaryCta,
}: {
  secondaryCta: Cta;
  primaryCta: Cta;
}) {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/[0.08]"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(6,8,18,0.72)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-7 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="no-underline tracking-[-0.3px]"
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontStyle: "italic", color: "#e9ecf2" }}
        >
          futur<span className="text-orange not-italic">•</span>e
        </Link>

        <div className="flex items-center gap-8">
          {[
            { label: "Le produit", href: "/" },
            { label: "Pages Savoir", href: "/savoir" },
            { label: "Tarifs", href: "/#pricing" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted no-underline"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={secondaryCta.href}
            className="px-3.5 py-2 rounded-full border border-white/[0.08] text-label no-underline font-mono text-[11px] tracking-[0.08em] uppercase bg-white/[0.02]"
          >
            {secondaryCta.label}
          </Link>
          <Link
            href={primaryCta.href}
            className="px-5 py-2 rounded-md bg-orange text-canvas font-semibold text-[13px] no-underline"
            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
          >
            {primaryCta.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2 : Réécrire `src/app/(account)/compte/page.tsx`**

Supprimer intégralement les blocs `C`, `MODULE_COLORS` (remplacé par classes Tailwind), `glass()`, et `S`. Réécrire le JSX avec Tailwind + tokens. Utiliser `AccountNav`. Contenu du fichier complet :

```tsx
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { QuartierWorkbook } from "./QuartierWorkbook";
import { AccountNav } from "@/components/AccountNav";
import {
  canAccessDashboard,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount } from "@/lib/user-account";

const MODULE_ICONS: Record<string, string> = {
  quartier: "🏘", logement: "🏠", metier: "💼",
  sante: "🫁", mobilite: "🚗", projets: "🗓",
};

const MODULE_BENEFIT: Record<string, string> = {
  logement: "Votre logement vaut-il encore ce que vous pensez en 2040 ? DPE, assurance, risques physiques par adresse.",
  metier: "Ce que le changement climatique fait à votre secteur. Certains métiers se fragilisent. D'autres gagnent en importance.",
  sante: "Cadmium, pollens, chaleur, qualité de l'air. Ce que votre environnement fait à votre corps, données à l'appui.",
  mobilite: "Votre dépendance à la voiture est-elle une fragilité ? Une lecture honnête du territoire.",
  projets: "Achat, déménagement, retraite. Est-ce que vos projets sont cohérents avec ce que ce lieu va devenir ?",
};

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);
  const QUARTIER_MODULE = PRODUCT_MODULES.find((m) => m.id === "quartier")!;
  const LOCKED_MODULES = PRODUCT_MODULES.filter((m) => m.id !== "quartier");

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-orange/[0.12] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-violet/[0.10] blur-[88px] opacity-30 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/rapport", label: "Mon rapport" }}
        primaryCta={{ href: "/#pricing", label: "Passer au complet" }}
      />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">

        {/* ── Hero ── */}
        <section className="grid grid-cols-[1fr_380px] gap-14 items-start py-20">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-orange mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange shadow-[0_0_12px_var(--color-orange)] shrink-0" />
              Compte gratuit
            </div>
            <h1
              className="font-normal text-[clamp(34px,3.8vw,52px)] leading-[1.1] tracking-[-1.2px] mb-5 text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Votre lecture de La Rochelle<br />
              <span className="italic text-orange">ne disparaît plus.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-8 max-w-[480px]">
              Le rapport partiel est sauvegardé ici, sans limite de temps. Vous pouvez y revenir, le compléter, le partager.
            </p>
            <div className="flex gap-2 flex-wrap mb-7">
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-ghost">
                {getPlanLabel(account.plan)}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-ghost">
                {account.email}
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                Relire mon rapport
              </Link>
              <Link href="#quartier" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Compléter Quartier
              </Link>
            </div>
          </div>

          <aside className="glass rounded-2xl p-7 relative overflow-hidden">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">Ce que le compte gratuit garde</p>
            <h2 className="font-normal text-[20px] leading-[1.2] text-label mb-5 tracking-[-0.2px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Un fil continu, pas un faux dashboard.
            </h2>
            <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-white/[0.08] mb-5">
              {[
                { val: "1", label: "ville de référence" },
                { val: "2", label: "dimensions ouvertes" },
                { val: "∞", label: "lecture retrouvable" },
              ].map((m, i) => (
                <div key={m.label} className={`px-3 py-3.5 text-center ${i < 2 ? "border-r border-white/[0.08]" : ""}`}>
                  <span className="block text-[26px] text-orange leading-none mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>{m.val}</span>
                  <span className="block font-mono text-[9px] tracking-[0.08em] text-ghost uppercase leading-[1.4]">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[14px] leading-[1.7] text-muted">
              Le compte sauvegarde votre rapport, fournit un lien de partage permanent et peut signaler une mise à jour si les données changent pour votre commune.
            </p>
          </aside>
        </section>

        <div className="border-t border-white/[0.08]" />

        {/* ── Ce que le compte garde ── */}
        <section className="pt-14">
          <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Dans votre accès gratuit</p>
              <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Trois choses concrètes que ce compte vous donne.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Pas un espace vide en attente de paiement. Un point de départ qui reste utile.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            {[
              { accent: "border-t-orange", title: "Rapport sauvegardé sans limite", copy: "Vous retrouvez la synthèse globale et le module Quartier sans repasser par la landing." },
              { accent: "border-t-info", title: "Lien de partage permanent", copy: "Partagez une lecture datée et sourcée sur La Rochelle, sans lien qui expire." },
              { accent: "border-t-violet", title: "Une alerte si les données changent", copy: "Si une donnée significative évolue pour votre commune, le compte gratuit peut en donner le signal." },
            ].map((k) => (
              <article key={k.title} className={`glass rounded-xl p-5 border-t-2 ${k.accent}`}>
                <h3 className="font-normal text-[17px] text-label mb-2.5 leading-[1.3]" style={{ fontFamily: "'Instrument Serif', serif" }}>{k.title}</h3>
                <p className="text-[14px] text-muted leading-[1.65]">{k.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Module Quartier ── */}
        <section className="pt-14" id="quartier">
          <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Module ouvert</p>
              <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Quartier : ce que La Rochelle devient autour de vous.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              C&apos;est le module le plus immédiat du produit. Chaleur, eau, cadre de vie.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-8 items-start">
            <div className="flex flex-col gap-5">
              <p className="text-[16px] leading-[1.75] text-muted">
                Le module Quartier lit ce qui se passe à l&apos;échelle du territoire, pas de votre logement. C&apos;est la porte d&apos;entrée naturelle avant de lire Logement, Santé ou Projets.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUARTIER_MODULE.signals.map((signal: string) => (
                  <span key={signal} className="px-2.5 py-1 rounded bg-info/[0.08] border border-info/[0.15] font-mono text-[11px] text-info">
                    {signal}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <article className="glass rounded-lg p-4">
                  <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2">Pourquoi commencer ici</p>
                  <p className="text-[13px] text-muted leading-[1.65]">Le territoire concentre déjà chaleur, eau et cadre de vie.</p>
                </article>
                <article className="glass rounded-lg p-4">
                  <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2">Ce que vous ajoutez</p>
                  <p className="text-[13px] text-muted leading-[1.65]">Vos observations de terrain croisent les données sans les remplacer.</p>
                </article>
              </div>
            </div>
            <QuartierWorkbook userKey={account.userId} />
          </div>
        </section>

        {/* ── Modules fermés ── */}
        <section className="pt-14">
          <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Cinq dimensions fermées</p>
              <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Ce que le rapport complet lit pour vous.
              </h2>
            </div>
            <p className="text-[15px] text-muted leading-[1.65]">
              Chaque module croise votre profil avec les données disponibles pour La Rochelle.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LOCKED_MODULES.map((module, i) => (
              <article key={module.id} className="glass rounded-xl p-5 opacity-50">
                <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[15px] mb-3 grayscale">
                  {MODULE_ICONS[module.id]}
                </div>
                <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-0.5 uppercase">Module 0{i + 2}</p>
                <h3 className="font-normal text-[18px] text-muted mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                <p className="text-[12px] text-ghost leading-[1.6] mb-3">{MODULE_BENEFIT[module.id] ?? module.summary}</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost bg-white/[0.03] border border-white/[0.08] rounded-full px-2 py-1">
                  Fermé
                </span>
              </article>
            ))}
          </div>

          {/* Upgrade band */}
          <div className="glass rounded-2xl p-10 border-orange/[0.12] grid grid-cols-[1fr_180px] gap-12 items-center mt-10 relative overflow-hidden">
            <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-orange/[0.08] pointer-events-none" />
            <div>
              <h2 className="font-normal text-[clamp(20px,2.2vw,26px)] leading-[1.2] tracking-[-0.4px] text-label mb-2.5" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Six lectures de votre vie à La Rochelle. Sourcées. Personnalisées.
              </h2>
              <p className="text-[15px] text-muted leading-[1.7]">
                Le rapport complet ne produit pas un score. Il garde les dimensions distinctes pour que vos arbitrages restent les vôtres.
              </p>
            </div>
            <div className="text-center">
              <span className="block text-[44px] text-label leading-none tracking-[-1.5px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                14<span className="text-[20px] text-ghost ml-0.5">€</span>
              </span>
              <span className="block font-mono text-[10px] text-ghost tracking-[0.04em] mt-1 mb-4">une fois · ou 9 €/mois</span>
              <Link href="/#pricing" className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-orange text-canvas font-semibold text-[13px] no-underline w-full" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                Voir les formules
              </Link>
              <p className="mt-2.5 font-mono text-[10px] text-ghost tracking-[0.04em] text-center leading-[1.6]">
                Les 14 € sont déductibles si vous passez en Suivi.
              </p>
            </div>
          </div>
        </section>

        {/* Footer nav */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-white/[0.08]">
          <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            Lire mon rapport
          </Link>
          {hasDashboard && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
              {isInteractive ? "Dashboard interactif" : "Dashboard"}
            </Link>
          )}
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2">
            Retour au site
          </Link>
          <form action={signOutAction} className="ml-auto">
            <button type="submit" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost bg-transparent border-none cursor-pointer py-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-white/[0.08]">
        <div className="max-w-[1100px] mx-auto px-7 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-[20px] italic text-label tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            futur<span className="text-orange not-italic">•</span>e
          </div>
          <div className="flex gap-5 flex-wrap">
            {[
              { label: "Manifeste", href: "/manifeste" },
              { label: "Méthodologie", href: "/methodologie" },
              { label: "Pages Savoir", href: "/savoir" },
              { label: "Contact", href: "/contact" },
              { label: "Mentions légales", href: "/mentions-legales" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="font-mono text-[11px] text-ghost no-underline tracking-[0.06em] uppercase">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="font-mono text-[11px] text-ghost tracking-[0.04em]">
            Données publiques françaises · Aucune publicité
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3 : Build TypeScript**

```bash
npm run build
```

Expected : aucune erreur TypeScript sur `compte/page.tsx`.

- [ ] **Step 4 : Vérification visuelle**

```bash
npm run dev
```

Ouvrir `/compte` dans le navigateur. Vérifier : fond sombre, nav correcte, hero 2 colonnes, cards glassmorphism, modules fermés, upgrade band.

- [ ] **Step 5 : Commit**

```bash
git add src/components/AccountNav.tsx "src/app/(account)/compte/page.tsx"
git commit -m "refactor: rewrite compte/page.tsx with Tailwind tokens, extract AccountNav"
```

---

### Task 7 : Réécriture `rapport/page.tsx` — suppression `@ts-nocheck`

**Files:**
- Modify: `src/app/(account)/rapport/page.tsx`

- [ ] **Step 1 : Supprimer le `@ts-nocheck` et les blocs de styles**

Retirer les lignes 1–3 (`/* eslint-disable */`, `// @ts-nocheck`, commentaire) et les blocs `C`, `MODULE_COLORS`, `MODULE_ICONS`, `MODULE_BENEFIT`, `glass()`, `S` (lignes ~17–615).

- [ ] **Step 2 : Réécrire le fichier avec Tailwind**

Le fichier suit la même structure que `compte/page.tsx`. Points clés :

**Imports à ajouter :**
```tsx
import { AccountNav } from "@/components/AccountNav";
```

**Remplacer la nav inline par :**
```tsx
<AccountNav
  secondaryCta={{ href: "/compte", label: "Mon compte" }}
  primaryCta={{ href: "/dashboard", label: "Dashboard" }}
/>
```

**Pattern pour les constantes de couleurs (typées, sans objet `C`) :**
```tsx
const MODULE_COLORS: Record<string, string> = {
  quartier: "#60a5fa",
  logement: "#fb923c",
  metier: "#a78bfa",
  sante: "#4ade80",
  mobilite: "#f87171",
  projets: "#fb923c",
};
```

**Pattern pour `glass()` → `.glass` className :**
```tsx
// Avant : style={glass({ borderRadius: 16, padding: '28px' })}
// Après :
<div className="glass rounded-2xl p-7">
```

**Pattern pour les inline styles dynamiques (ex: couleur de module) :**
```tsx
// Avant : style={S.moduleCard(col, open)}
// Après :
<article
  className={`glass rounded-xl p-6 relative transition-opacity ${open ? "opacity-100" : "opacity-50"}`}
  style={{ borderTop: `2px solid ${open ? col : "rgba(255,255,255,0.06)"}` }}
>
```

**Pattern pour la section hero (fullReport conditionnel) :**
```tsx
<section className="grid grid-cols-[1fr_400px] gap-16 items-start py-20">
  <div>
    <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-orange mb-5">
      <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
      {fullReport ? "Rapport complet" : "Rapport partiel"}
    </div>
    {fullReport ? (
      <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-5 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Votre vie à La Rochelle<br />
        <span className="italic text-orange">en 2050, dimension par dimension.</span>
      </h1>
    ) : (
      <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-5 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Ce que La Rochelle devient.<br />
        <span className="italic text-orange">Les premiers signaux, sans détours.</span>
      </h1>
    )}
    ...
  </div>
  ...
</section>
```

Appliquer le même principe pour toutes les sections du fichier en remplaçant les objets `S.xxx` par des classes Tailwind équivalentes.

- [ ] **Step 3 : Build TypeScript strict**

```bash
npm run build
```

Expected : `✓ Compiled` sans erreur TypeScript — le `@ts-nocheck` n'est plus là pour masquer les erreurs, donc tout doit passer en strict.

- [ ] **Step 4 : Vérification visuelle**

```bash
npm run dev
```

Ouvrir `/rapport` en tant qu'utilisateur anonyme (rapport partiel) et en tant que payant (rapport complet). Vérifier l'affichage conditionnel des modules, les signaux dans le panel hero, la grille de modules fermés.

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(account)/rapport/page.tsx"
git commit -m "refactor: rewrite rapport/page.tsx with Tailwind, remove @ts-nocheck"
```

---

### Task 8 : Alignement `dashboard/page.tsx` sur les tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1 : Mettre à jour les classes CSS `.account-*` dans `globals.css` pour utiliser les tokens**

Dans `globals.css`, remplacer les valeurs hardcodées dans les blocs `.account-shell`, `.account-card`, `.account-kicker`, `.account-title`, `.account-copy`, etc. par les variables `--c-*` :

```css
/* Avant */
.account-shell {
  background:
    radial-gradient(circle at top, rgba(251, 146, 60, 0.14), transparent 24%),
    linear-gradient(180deg, #060812 0%, #0d1322 100%);
}

/* Après */
.account-shell {
  background:
    radial-gradient(circle at top, rgba(251, 146, 60, 0.14), transparent 24%),
    linear-gradient(180deg, var(--c-bg) 0%, #0d1322 100%);
}
```

Faire de même pour toutes les couleurs hardcodées dans les classes `.account-*` et `.gating-*`.

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected : aucune régression sur `/dashboard`.

- [ ] **Step 3 : Commit**

```bash
git add src/app/globals.css "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "refactor: align dashboard CSS classes to use design tokens"
```

---

## Groupe C — Wizard

### Task 9 : Types du Wizard

**Files:**
- Create: `src/components/wizard/types.ts`

- [ ] **Step 1 : Créer `src/components/wizard/types.ts`**

```typescript
export type WizardAnswers = {
  quartier: string | null;
  logement: { type: "maison" | "appartement"; year: number } | null;
  metier: string | null;
  sante: string[];
  mobilite: "voiture" | "transport" | "velo" | "mixte" | null;
  projets: "achat" | "retraite" | "demenagement" | "autre" | null;
};

export type WizardState = {
  step: number;           // 0–5 = questions, 6 = teaser
  context: string | null; // slug module initial (ex : "logement")
  answers: WizardAnswers;
};

export const WIZARD_INITIAL_ANSWERS: WizardAnswers = {
  quartier: null,
  logement: null,
  metier: null,
  sante: [],
  mobilite: null,
  projets: null,
};

export const WIZARD_STORAGE_KEY = "futur-e:wizard";
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/wizard/types.ts
git commit -m "feat: add Wizard types and constants"
```

---

### Task 10 : `WizardStepper`

**Files:**
- Create: `src/components/wizard/WizardStepper.tsx`

- [ ] **Step 1 : Créer `src/components/wizard/WizardStepper.tsx`**

```tsx
export function WizardStepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < currentStep
              ? "w-6 bg-orange"
              : i === currentStep
                ? "w-8 bg-orange"
                : "w-4 bg-white/[0.12]"
          }`}
        />
      ))}
      {currentStep < totalSteps && (
        <span className="ml-2 font-mono text-[10px] tracking-[0.08em] text-ghost">
          {currentStep + 1} / {totalSteps}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/wizard/WizardStepper.tsx
git commit -m "feat: add WizardStepper progress indicator"
```

---

### Task 11 : `WizardStep` — 6 questions avec animations

**Files:**
- Create: `src/components/wizard/WizardStep.tsx`

- [ ] **Step 1 : Créer `src/components/wizard/WizardStep.tsx`**

```tsx
"use client";

import type { WizardAnswers } from "./types";

type StepConfig =
  | { key: "quartier"; module: string; step: string; question: string; type: "text"; placeholder: string }
  | { key: "logement"; module: string; step: string; question: string; type: "logement" }
  | { key: "metier" | "mobilite" | "projets"; module: string; step: string; question: string; type: "select"; options: string[] }
  | { key: "sante"; module: string; step: string; question: string; type: "multi"; options: string[] };

const STEPS: StepConfig[] = [
  {
    key: "quartier",
    module: "Quartier",
    step: "01",
    question: "Quelle est votre ville ou votre code postal ?",
    type: "text",
    placeholder: "Ex : La Rochelle, 17000…",
  },
  {
    key: "logement",
    module: "Logement",
    step: "02",
    question: "Quel est votre type de logement et son année de construction ?",
    type: "logement",
  },
  {
    key: "metier",
    module: "Métier",
    step: "03",
    question: "Quel est votre secteur d'activité principal ?",
    type: "select",
    options: [
      "Agriculture / Alimentaire",
      "Santé / Social",
      "BTP / Immobilier",
      "Transport / Logistique",
      "Tourisme / Hôtellerie",
      "Enseignement / Recherche",
      "Finance / Assurance",
      "Industrie / Énergie",
      "Services / Numérique",
      "Autre",
    ],
  },
  {
    key: "sante",
    module: "Santé",
    step: "04",
    question: "Avez-vous des sensibilités environnementales ?",
    type: "multi",
    options: [
      "Allergies polliniques",
      "Asthme / Troubles respiratoires",
      "Sensibilité à la chaleur",
      "Pathologie chronique",
      "Aucune sensibilité particulière",
    ],
  },
  {
    key: "mobilite",
    module: "Mobilité",
    step: "05",
    question: "Quel est votre mode de transport quotidien prédominant ?",
    type: "select",
    options: ["voiture", "transport", "velo", "mixte"],
  },
  {
    key: "projets",
    module: "Projets",
    step: "06",
    question: "Quel est votre projet de vie majeur à 5 ans ?",
    type: "select",
    options: ["achat", "retraite", "demenagement", "autre"],
  },
];

const MOBILITE_LABELS: Record<string, string> = {
  voiture: "Voiture (seul)",
  transport: "Covoiturage / Transports en commun",
  velo: "Vélo / Marche",
  mixte: "Mixte",
};

const PROJETS_LABELS: Record<string, string> = {
  achat: "Achat immobilier",
  retraite: "Retraite / Semi-retraite",
  demenagement: "Déménagement",
  autre: "Aucun projet majeur",
};

export function WizardStep({
  step,
  answers,
  onAnswer,
  onNext,
  onPrev,
}: {
  step: number;
  answers: WizardAnswers;
  onAnswer: (key: keyof WizardAnswers, value: WizardAnswers[keyof WizardAnswers]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const config = STEPS[step];
  const current = answers[config.key];

  const canNext =
    config.type === "multi"
      ? (current as string[]).length > 0
      : current !== null && current !== "";

  return (
    <div className="wizard-step">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-orange mb-1">
        Module {config.step} · {config.module}
      </p>
      <h2
        className="font-normal text-[clamp(22px,2.8vw,32px)] leading-[1.2] tracking-[-0.4px] text-label mb-8"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {config.question}
      </h2>

      {/* Text input (Quartier) */}
      {config.type === "text" && (
        <input
          type="text"
          placeholder={config.placeholder}
          value={(current as string) ?? ""}
          onChange={(e) => onAnswer(config.key, e.target.value || null)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-orange/50 transition-colors"
          autoFocus
        />
      )}

      {/* Logement (type + année) */}
      {config.type === "logement" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {(["maison", "appartement"] as const).map((t) => {
              const selected = (current as WizardAnswers["logement"])?.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onAnswer(config.key, {
                      type: t,
                      year: (current as WizardAnswers["logement"])?.year ?? 2000,
                    })
                  }
                  className={`px-4 py-3 rounded-xl border text-[14px] font-medium transition-colors capitalize ${
                    selected
                      ? "bg-orange/[0.08] border-orange/40 text-orange"
                      : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                  }`}
                >
                  {t === "maison" ? "Maison" : "Appartement"}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2">
              Année de construction
            </label>
            <input
              type="number"
              min={1800}
              max={2024}
              placeholder="Ex : 1978"
              value={(current as WizardAnswers["logement"])?.year ?? ""}
              onChange={(e) =>
                onAnswer(config.key, {
                  type: (current as WizardAnswers["logement"])?.type ?? "appartement",
                  year: parseInt(e.target.value) || 2000,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-label text-[15px] placeholder:text-ghost focus:outline-none focus:border-orange/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Select (Métier, Mobilité, Projets) */}
      {config.type === "select" && (
        <div className="flex flex-col gap-2">
          {config.options.map((opt) => {
            const label =
              config.key === "mobilite"
                ? MOBILITE_LABELS[opt]
                : config.key === "projets"
                  ? PROJETS_LABELS[opt]
                  : opt;
            const selected = current === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onAnswer(config.key, opt as WizardAnswers[typeof config.key])}
                className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] transition-colors ${
                  selected
                    ? "bg-orange/[0.08] border-orange/40 text-orange"
                    : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-select (Santé) */}
      {config.type === "multi" && (
        <div className="flex flex-col gap-2">
          {config.options.map((opt) => {
            const selected = ((current as string[]) ?? []).includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const prev = (current as string[]) ?? [];
                  onAnswer(
                    config.key,
                    selected ? prev.filter((x) => x !== opt) : [...prev, opt],
                  );
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border text-[14px] transition-colors ${
                  selected
                    ? "bg-orange/[0.08] border-orange/40 text-orange"
                    : "bg-white/[0.03] border-white/[0.08] text-muted hover:border-white/[0.2]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
        {step > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost hover:text-muted transition-colors"
          >
            ← Retour
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="px-6 py-2.5 rounded-lg bg-orange text-canvas font-semibold text-[13px] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          {step < 5 ? "Continuer →" : "Voir mon aperçu →"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Build**

```bash
npm run build
```

Expected : pas d'erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/components/wizard/WizardStep.tsx
git commit -m "feat: add WizardStep with 6 question configs and step-enter animation"
```

---

### Task 12 : `WizardTeaser`

**Files:**
- Create: `src/components/wizard/WizardTeaser.tsx`

- [ ] **Step 1 : Créer `src/components/wizard/WizardTeaser.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { WizardAnswers } from "./types";

const CONTEXT_RISK_LABELS: Record<string, string> = {
  logement: "Exposition du logement",
  metier: "Vulnérabilité professionnelle",
  sante: "Sensibilité santé-environnement",
  mobilite: "Dépendance à la voiture",
  projets: "Cohérence des projets de vie",
  quartier: "Tension climatique territoriale",
};

function computeRisks(answers: WizardAnswers, context: string | null): string[] {
  const risks: string[] = [];

  if (answers.logement && answers.logement.year < 1980)
    risks.push("Exposition du logement (DPE, rénovation obligatoire)");
  if (
    answers.sante.length > 0 &&
    !answers.sante.includes("Aucune sensibilité particulière")
  )
    risks.push("Sensibilité santé-environnement (pollens, chaleur, air)");
  if (answers.mobilite === "voiture")
    risks.push("Dépendance à la voiture (coût carburant, mobilité future)");
  if (context && CONTEXT_RISK_LABELS[context]) {
    const contextRisk = CONTEXT_RISK_LABELS[context];
    if (!risks.some((r) => r.startsWith(contextRisk.split(" ")[0])))
      risks.unshift(contextRisk);
  }
  if (risks.length === 0) risks.push("Tension climatique territoriale");
  return risks.slice(0, 3);
}

export function WizardTeaser({
  answers,
  context,
  onRestart,
}: {
  answers: WizardAnswers;
  context: string | null;
  onRestart: () => void;
}) {
  const ville = answers.quartier || "votre commune";
  const risks = computeRisks(answers, context);

  return (
    <div className="wizard-step">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-orange mb-2">
        Aperçu personnalisé · {ville}
      </p>

      <h2
        className="font-normal text-[clamp(24px,3vw,36px)] leading-[1.1] tracking-[-0.5px] text-label mb-6"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Votre profil présente{" "}
        <span className="italic text-orange">
          {risks.length > 1 ? `${risks.length} expositions` : "une exposition"}
        </span>{" "}
        identifiées.
      </h2>

      {/* Risk cards */}
      <div className="flex flex-col gap-3 mb-8">
        {risks.map((risk) => (
          <div
            key={risk}
            className="flex items-start gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08]"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-label mb-0.5 leading-snug">{risk}</p>
              <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">
                Analyse complète dans le rapport
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu flou verrouillé */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <div
          className="px-5 py-4 bg-white/[0.02] border border-white/[0.08] select-none"
          style={{ filter: "blur(3px)" }}
          aria-hidden
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ghost mb-1">
            Analyse complète
          </p>
          <p className="text-[13px] text-muted leading-relaxed">
            Votre logement présente un DPE estimé F–G. Le coût de rénovation obligatoire d&apos;ici 2034 est compris entre 18 000 et 35 000 €. La valeur de revente est exposée à une décote progressive…
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 backdrop-blur-[1px]">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted border border-white/[0.1] rounded-full px-3 py-1.5 bg-canvas/80">
            Contenu verrouillé
          </span>
        </div>
      </div>

      {/* Paywall */}
      <div className="rounded-2xl border border-orange/[0.18] p-6 relative overflow-hidden" style={{ background: "rgba(251,146,60,0.04)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange/[0.08] blur-3xl pointer-events-none" />
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-orange mb-3">
          Rapport complet
        </p>
        <p
          className="text-[18px] font-normal text-label mb-2 leading-snug"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Accédez à votre analyse complète, vos 6 modules de suivi et votre guide d&apos;action personnalisé.
        </p>
        <p className="text-[13px] text-muted mb-5 leading-relaxed">
          Sourcé sur les données publiques françaises. Personnalisé sur votre profil. Sans publicité.
        </p>
        <div className="flex items-end gap-4 mb-5">
          <div>
            <span
              className="text-[44px] text-label leading-none tracking-[-1.5px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              14
            </span>
            <span className="text-[18px] text-ghost ml-0.5">€</span>
          </div>
          <div className="pb-1.5">
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">paiement unique</p>
            <p className="font-mono text-[10px] text-ghost tracking-[0.04em]">ou 9 €/mois en Suivi</p>
          </div>
        </div>
        <Link
          href="/paiement"
          className="flex w-full items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange text-canvas font-semibold text-[14px] no-underline"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Débloquer mon rapport complet — 14€
        </Link>
        <p className="mt-3 text-center font-mono text-[10px] text-ghost tracking-[0.04em]">
          Les 14 € sont déductibles si vous passez en Suivi mensuel
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-4 w-full text-center font-mono text-[10px] tracking-[0.06em] uppercase text-ghost hover:text-muted transition-colors py-2"
      >
        Recommencer
      </button>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/wizard/WizardTeaser.tsx
git commit -m "feat: add WizardTeaser with personalized risk preview and paywall"
```

---

### Task 13 : `ReportWizard` — orchestrateur dialog

**Files:**
- Create: `src/components/wizard/ReportWizard.tsx`

- [ ] **Step 1 : Créer `src/components/wizard/ReportWizard.tsx`**

```tsx
"use client";

import { forwardRef, useCallback, useEffect, useReducer } from "react";
import {
  type WizardAnswers,
  type WizardState,
  WIZARD_INITIAL_ANSWERS,
  WIZARD_STORAGE_KEY,
} from "./types";
import { WizardStepper } from "./WizardStepper";
import { WizardStep } from "./WizardStep";
import { WizardTeaser } from "./WizardTeaser";

function loadFromStorage(): Partial<WizardState> {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<WizardState>) : {};
  } catch {
    return {};
  }
}

function saveToStorage(state: WizardState): void {
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage indisponible (mode privé, quota dépassé)
  }
}

type Action =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_ANSWER"; key: keyof WizardAnswers; value: WizardAnswers[keyof WizardAnswers] }
  | { type: "RESET" };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, 6) };
    case "PREV":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "SET_ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value },
      };
    case "RESET":
      return { step: 0, context: state.context, answers: { ...WIZARD_INITIAL_ANSWERS } };
    default:
      return state;
  }
}

export const ReportWizard = forwardRef<HTMLDialogElement, { initialContext?: string | null }>(
  function ReportWizard({ initialContext = null }, ref) {
    const stored = loadFromStorage();

    const [state, dispatch] = useReducer(reducer, {
      step: stored.step ?? 0,
      context: initialContext,
      answers: { ...WIZARD_INITIAL_ANSWERS, ...(stored.answers ?? {}) },
    });

    useEffect(() => {
      saveToStorage(state);
    }, [state]);

    const handleClose = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
    }, [ref]);

    return (
      <dialog
        ref={ref}
        className="wizard-dialog"
        onClose={() => dispatch({ type: "RESET" })}
      >
        <div className="flex flex-col" style={{ maxHeight: "calc(100dvh - 64px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-white/[0.08]">
            <WizardStepper currentStep={state.step} totalSteps={6} />
            <button
              type="button"
              onClick={handleClose}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost hover:text-muted transition-colors"
            >
              Fermer ×
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-7">
            {state.step < 6 ? (
              <WizardStep
                key={state.step}
                step={state.step}
                answers={state.answers}
                onAnswer={(key, value) => dispatch({ type: "SET_ANSWER", key, value })}
                onNext={() => dispatch({ type: "NEXT" })}
                onPrev={() => dispatch({ type: "PREV" })}
              />
            ) : (
              <WizardTeaser
                answers={state.answers}
                context={state.context}
                onRestart={() => dispatch({ type: "RESET" })}
              />
            )}
          </div>
        </div>
      </dialog>
    );
  },
);
```

- [ ] **Step 2 : Build TypeScript**

```bash
npm run build
```

Expected : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/components/wizard/ReportWizard.tsx
git commit -m "feat: add ReportWizard dialog with sessionStorage state and 6-step flow"
```

---

### Task 14 : Câblage du Wizard dans la landing

**Files:**
- Modify: `src/components/FutureELanding.tsx`

- [ ] **Step 1 : Ajouter les imports en tête de `FutureELanding.tsx`**

```tsx
import { useRef, useState, useCallback } from "react";
import { ReportWizard } from "@/components/wizard/ReportWizard";
```

`useRef` et `useState` sont peut-être déjà importés — vérifier et compléter si besoin.

- [ ] **Step 2 : Ajouter les hooks au début du composant `FutureELanding`**

Localiser la déclaration du composant (`export default function FutureELanding`) et ajouter après les hooks existants :

```tsx
const wizardRef = useRef<HTMLDialogElement>(null);
const [wizardContext, setWizardContext] = useState<string | null>(null);

const openWizard = useCallback((context: string) => {
  setWizardContext(context);
  // Délai minimal pour que React mette à jour wizardContext avant showModal
  setTimeout(() => wizardRef.current?.showModal(), 0);
}, []);
```

- [ ] **Step 3 : Ajouter une section "Questions de tension" dans la landing**

Trouver le CTA principal existant ("Générer mon rapport" ou équivalent) dans `FutureELanding.tsx` et ajouter après lui, ou trouver la section hero et ajouter un bloc de questions tension. Insérer ce JSX :

```tsx
{/* Questions de tension — Wizard trigger */}
<div className="mt-8 flex flex-col gap-3 max-w-lg">
  <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-1">
    Choisissez votre angle d&apos;entrée
  </p>
  {[
    { label: "Mon logement est-il exposé au risque climatique ?", context: "logement" },
    { label: "Quelle est la résilience de mon secteur professionnel ?", context: "metier" },
    { label: "Mon territoire est-il vulnérable d'ici 2050 ?", context: "quartier" },
  ].map((q) => (
    <button
      key={q.context}
      type="button"
      onClick={() => openWizard(q.context)}
      className="w-full text-left px-5 py-3.5 rounded-xl glass border border-white/[0.08] hover:border-orange/30 transition-colors group"
    >
      <span className="text-[14px] text-muted group-hover:text-label transition-colors">
        {q.label}
      </span>
      <span className="block mt-1 font-mono text-[10px] text-ghost tracking-[0.04em]">
        Évaluer mon exposition → Rapport personnalisé
      </span>
    </button>
  ))}
</div>
```

- [ ] **Step 4 : Monter `<ReportWizard>` à la fin du JSX retourné, juste avant le `</>`**

```tsx
<ReportWizard ref={wizardRef} initialContext={wizardContext} />
```

- [ ] **Step 5 : Build**

```bash
npm run build
```

Expected : `✓ Compiled`.

- [ ] **Step 6 : Test de bout en bout**

```bash
npm run dev
```

Tester le flux complet :
1. Ouvrir `/`
2. Cliquer une question de tension → dialog s'ouvre
3. Compléter les 6 étapes — vérifier l'animation `step-enter` à chaque transition
4. Étape 6 → WizardTeaser : aperçu personnalisé + paywall visible
5. Fermer (×) ou Escape → dialog se ferme, état réinitialisé
6. Rouvrir → wizard repart à l'étape 0 (state RESET à la fermeture)
7. Rafraîchir la page en milieu de wizard (étape 3) → les réponses survivent en `sessionStorage`
8. Fermer l'onglet et rouvrir → wizard repart à 0 (sessionStorage vidé)

- [ ] **Step 7 : Commit**

```bash
git add src/components/FutureELanding.tsx
git commit -m "feat: wire ReportWizard to landing page with tension question triggers"
```

---

## Auto-review

### Couverture spec
| Exigence spec | Task |
|---|---|
| Route group (auth) | Task 2 |
| Route group (account) | Task 3 |
| Route group (dashboard) | Task 4 |
| Route group (public) | Task 5 |
| CSS tokens `--c-*` + `@theme` | Task 1 |
| `.glass` utilitaire | Task 1 |
| Migration compte/page.tsx | Task 6 |
| Migration rapport/page.tsx + @ts-nocheck | Task 7 |
| Alignement dashboard | Task 8 |
| AccountNav partagé | Task 6 |
| WizardState + types | Task 9 |
| WizardStepper | Task 10 |
| WizardStep (6 questions) | Task 11 |
| WizardTeaser + paywall | Task 12 |
| ReportWizard dialog + sessionStorage | Task 13 |
| Wizard câblé sur la landing | Task 14 |
| Animations step-enter | Task 1 + Task 11 |
| URLs publiques inchangées | Invariant route groups Tasks 2–5 |
| initialContext → personnalise teaser seulement | Task 13 (context passé à WizardTeaser) |

### Notes
- **Stripe / /success / email PDF** : hors scope, comme défini dans la spec.
- **Pages auth (connexion, inscription)** : la migration vers Tailwind pur n'est pas dans le scope — elles gardent leurs classes `.auth-*`.
- **Aucune dépendance nouvelle** à installer.

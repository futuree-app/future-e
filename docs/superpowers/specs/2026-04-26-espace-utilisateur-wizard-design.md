# Spec — Refonte espace utilisateur & Wizard rapport

**Date :** 2026-04-26
**Statut :** Approuvé

---

## Contexte

L'espace utilisateur actuel est un patchwork de trois design systems coexistants :
- `compte/page.tsx` et `rapport/page.tsx` : inline styles massifs (800–1 000+ lignes de CSS-in-JS), chacun avec sa propre nav et son propre footer dupliqués, palette `C` redéfinie localement
- `dashboard/page.tsx` : classes CSS dans `globals.css`
- Pages auth : classes CSS distinctes dans `globals.css`

Dette technique identifiée : `rapport/page.tsx` contient un `@ts-nocheck` en tête. Pas de route groups Next.js. Aucun composant Wizard pour le tunnel de conversion.

---

## Objectifs

1. Unifier l'architecture de dossiers via les route groups Next.js
2. Harmoniser le design system (tokens CSS + Tailwind) sur toutes les pages existantes
3. Implémenter le Wizard "Générer mon rapport personnalisé" en overlay `<dialog>` natif
4. Clarifier les deux parcours produit (one-shot 14€ / abonnement Suivi)

---

## 1. Structure de dossiers

### Après refonte

```
src/app/
├── (auth)/
│   ├── layout.tsx                   ← AuthShell comme layout partagé
│   ├── connexion/page.tsx
│   └── inscription/page.tsx
│
├── (account)/
│   ├── layout.tsx                   ← nav authentifiée commune + protection auth
│   ├── compte/
│   │   ├── page.tsx
│   │   └── QuartierWorkbook.tsx
│   └── rapport/page.tsx
│
├── (dashboard)/
│   ├── layout.tsx                   ← protection auth + styles dashboard
│   └── dashboard/
│       ├── page.tsx
│       └── DashboardExperience.tsx
│
├── (public)/
│   ├── layout.tsx                   ← Navbar + Footer partagés
│   ├── page.tsx                     ← landing (avec Wizard trigger)
│   ├── savoir/
│   ├── territoires/
│   └── agir/
│
├── auth/                            ← hors route group (callbacks Supabase)
│   ├── actions.ts
│   ├── callback/route.ts
│   └── shared.ts
│
├── api/
├── globals.css
└── layout.tsx                       ← root layout (fonts, meta)
```

**Invariants :**
- Les URLs publiques restent identiques — les route groups n'affectent pas le routing
- `auth/actions.ts`, `lib/`, `middleware.ts` ne sont pas touchés
- Chaque layout de groupe centralise la nav/footer correspondante, supprimant les duplications actuelles

---

## 2. Design system — harmonisation complète

### Tokens CSS (`globals.css`)

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

.glass {
  background: var(--c-bg-elevated);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--c-border);
}
```

### Scope de migration

| Fichier | Action |
|---|---|
| `globals.css` | Ajout tokens + `.glass` |
| `compte/page.tsx` | Suppression bloc `C` + inline styles → Tailwind + tokens |
| `rapport/page.tsx` | Idem + suppression `@ts-nocheck` + typage complet |
| `dashboard/page.tsx` | Alignement sur tokens (migration légère, déjà en classes CSS) |
| Nouveaux composants Wizard | Tokens + Tailwind dès l'écriture |

Les pages auth (`connexion/`, `inscription/`) utilisent déjà les classes `.auth-*` de `globals.css` — elles ne sont pas dans le scope de réécriture, mais leurs classes existantes sont conservées.

---

## 3. Wizard "Générer mon rapport personnalisé"

### Déclenchement

Depuis la landing : l'utilisateur clique une question de tension (ex : DPE/Logement) → réponse pédagogique courte → CTA contextuel → `dialogRef.current?.showModal()`.

```tsx
<ReportWizard ref={dialogRef} initialContext="logement" />
```

`initialContext` est un slug de module (`'logement'`, `'sante'`, etc.). Il ne modifie pas l'ordre des 6 étapes (toujours fixe). Il personnalise uniquement le titre et le contenu du `WizardTeaser` final (ex : "Votre logement présente une exposition forte aux risques X, Y").

La protection auth des layouts `(account)` et `(dashboard)` s'appuie sur `requireCurrentUser()` déjà appelé dans chaque `page.tsx` — les layouts n'ont pas besoin de logique de redirection supplémentaire.

### Composants (`src/components/wizard/`)

```
wizard/
├── ReportWizard.tsx      ← <dialog> natif, orchestre l'état
├── WizardStepper.tsx     ← barre de progression (6 étapes)
├── WizardStep.tsx        ← layout générique d'une question
├── WizardTeaser.tsx      ← aperçu personnalisé + paywall
└── types.ts
```

### Types (`types.ts`)

```typescript
export type WizardAnswers = {
  quartier: string | null;
  logement: { type: 'maison' | 'appartement'; year: number } | null;
  metier: string | null;
  sante: string[];
  mobilite: 'voiture' | 'transport' | 'velo' | 'mixte' | null;
  projets: 'achat' | 'retraite' | 'demenagement' | 'autre' | null;
};

export type WizardState = {
  step: number;           // 0–5 = questions, 6 = teaser
  context: string | null; // slug du module initial (ex : 'logement')
  answers: WizardAnswers;
};
```

### Les 6 étapes

| # | Module | Question |
|---|---|---|
| 0 | Quartier | Quel est votre code postal ou votre ville ? |
| 1 | Logement | Type de logement (maison/appart) et année de construction ? |
| 2 | Métier | Quel est votre secteur d'activité principal ? |
| 3 | Santé | Avez-vous des sensibilités environnementales (allergies, qualité air…) ? |
| 4 | Mobilité | Quel est votre mode de transport quotidien prédominant ? |
| 5 | Projets | Quel est votre projet de vie majeur à 5 ans ? |

### Stockage de l'état

`sessionStorage` clé `futur-e:wizard`. Les réponses survivent aux rechargements accidentels, pas à la fermeture de l'onglet — comportement intentionnel.

### Mécanique `<dialog>`

- Ouverture : `ref.current?.showModal()` — top layer natif, focus trap automatique
- Fermeture : `ref.current?.close()` ou touche Escape
- Scroll-lock : `body:has(dialog[open]) { overflow: hidden; }` en CSS

### Animations entre étapes

```css
@keyframes step-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.wizard-step {
  animation: step-enter 0.22s ease-out both;
}
```

Une prop `key={step}` sur `<WizardStep>` force le re-mount et rejoue l'animation à chaque changement d'étape.

---

## 4. Parcours utilisateur post-Wizard

### Parcours one-shot (14€)

```
WizardTeaser
  └─ CTA "Débloquer mon rapport complet — 14€"
       └─ Stripe Checkout (email obligatoire, compte non requis)
            └─ /success
                 ├─ Téléchargement PDF immédiat
                 ├─ Envoi PDF par email (Stripe)
                 ├─ CTA "Créer un compte" (optionnel — sauvegarder + affiner)
                 └─ CTA "Passer au Suivi — 9€/mois" (upsell, 14€ déduits)
```

### Parcours abonné Suivi

L'utilisateur avec un plan `suivi` ou `foyer` actif accède au dashboard complet (`/dashboard`) avec les 6 modules interactifs, newsletter mensuelle et données mises à jour.

### Utilisateur inscrit qui relance le Wizard

Si un utilisateur connecté (plan `free`) rouvre le Wizard, les réponses pré-remplissent les champs connus (commune depuis `user_accounts` si disponible). À la fin, le CTA devient "Accéder à mon rapport complet" avec les 14€ déductibles si passage en Suivi.

---

## 5. Ce qui est hors scope

- Réécriture des pages `savoir/`, `territoires/`, `agir/`
- Implémentation Stripe (scope séparé)
- Envoi email PDF (scope séparé)
- Page `/success` (scope séparé, dépend de Stripe)
- Migration des pages auth (`connexion/`, `inscription/`) vers Tailwind pur

---

## 6. Critères de succès

- Toutes les pages du scope (`compte/`, `rapport/`, `dashboard/`) utilisent les tokens CSS — aucun objet `C` inline restant
- `rapport/page.tsx` compile en TypeScript strict sans `@ts-nocheck`
- Le Wizard s'ouvre en overlay sur la landing, complète 6 étapes, affiche le teaser, persiste les réponses en `sessionStorage`
- Les animations step-enter jouent à chaque transition d'étape
- Les URLs publiques (`/connexion`, `/compte`, `/dashboard`) sont inchangées après le refactoring route groups

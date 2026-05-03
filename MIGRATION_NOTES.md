# Design System Integration — Notes de migration

## Ce qui a été fait (4 étapes)

### Étape 1 — Installation des tokens

- `public/fonts/InstrumentSerif-Regular.ttf` et `InstrumentSerif-Italic.ttf` copiés depuis `Futur.e Design System/fonts/`
- `src/app/design-tokens.css` créé à partir de `colors_and_type.css` avec chemins corrigés (`/fonts/...`)
- `src/app/globals.css` — `@import "./design-tokens.css"` ajouté en tête
- `src/app/layout.tsx` — `<html data-theme="dark">` + script inline anti-flash (lit `localStorage('futuree-theme')` avant le premier rendu)
- `src/lib/useTheme.ts` — hook React `useTheme()` : lit/écrit `data-theme` + persiste en localStorage
- `src/components/ThemeToggle.tsx` — bouton ◐/◑ utilisant le hook

### Étape 2 — Migration hex → tokens

Fichiers modifiés : `globals.css`, `FutureELanding.tsx`, `DashboardExperience.tsx`, `rapport/page.tsx`

Mapping principal appliqué :

| Hex / rgba | Token |
|---|---|
| `#f6f4ef`, `#f4f1ec` | `var(--fg-hi)` |
| `#e9ecf2` | `var(--fg-1)` |
| `#c6cfdb`, `#b7c1cf`, `#d9e1eb` | `var(--fg-2)` |
| `#9ba3b4` | `var(--fg-3)` |
| `#6b7388` | `var(--fg-4)` |
| `#fb923c` | `var(--orange)` |
| `#fdba74` | `var(--orange-soft)` |
| `rgba(251,146,60,0.12)` | `var(--orange-tint)` |
| `rgba(251,146,60,0.18)` | `var(--orange-tint-2)` |
| `rgba(251,146,60,0.36)` | `var(--orange-ring)` |
| `rgba(255,255,255,0.08)` | `var(--border-1)` |
| `rgba(255,255,255,0.12)` | `var(--border-2)` |
| `rgba(255,255,255,0.03)` | `var(--bg-elev)` |
| `rgba(255,255,255,0.04)` | `var(--bg-elev-2)` |
| `rgba(10,15,28,0.72)` | `var(--bg-card)` |
| `rgba(248,113,113,0.12)` | `var(--red-tint)` |
| `rgba(74,222,128,0.12)` | `var(--green-tint)` |
| `rgba(96,165,250,0.12)` | `var(--blue-tint)` |

Les anciens tokens `--c-bg`, `--c-border`, etc. dans globals.css sont maintenant des **alias** vers les nouveaux tokens (rétrocompatibilité).

### Étape 3 — ThemeToggle dans la navbar

`ThemeToggle` inséré dans `Navbar.tsx` dans la zone `.nb-actions` (visible desktop + mobile), avant les CTAs connexion/inscription.

### Étape 4 — QA

Build propre (`npm run build`) — aucune erreur, 1 warning CSS corrigé (ordre `@import`).

---

## Valeurs intentionnellement laissées en dur

| Fichier | Valeur | Raison |
|---|---|---|
| `globals.css @theme` | `#060812`, `#fb923c`, etc. | Tokens Tailwind — doivent être des valeurs littérales |
| `DashboardExperience.tsx` | `rgba(255,255,255,0.62)` etc. | Échelle d'opacités spécifique au proto dashboard, pas de token équivalent |
| `FutureELanding.tsx` | `rgba(6,8,18,0.02/0.14)` | Gradient overlay très subtil, valeur non-couverte par les tokens |
| `rapport/page.tsx` | `rgba(251,146,60,0.07)` | Box-shadow très diffuse, hors palette token |

---

## Comment ajouter le mode clair à une nouvelle page

1. Utiliser uniquement les tokens CSS (`var(--bg)`, `var(--fg-1)`, etc.)
2. Ne pas hardcoder de couleurs hex ni de rgba dans les styles inline
3. Le ThemeToggle dans la navbar change `data-theme` sur `<html>` — tout ce qui est tokenisé bascule automatiquement

## Comment changer le thème par défaut

Dans `src/app/layout.tsx`, changer `data-theme="dark"` en `data-theme="light"`.

---
name: futur-e-design-system
description: Design system for futur•e — a French climate projection web app that crosses public climate data (DRIAS, Géorisques, ANSES, INSEE) with user profile to make climate change concrete, local and personal. Use whenever designing marketing pages, auth flows, dashboards, reports or any UI for futur•e.
---

# futur•e Design System — Skill

Load this skill when designing anything for **futur•e** (repo `futuree-app/future-e`). It gives you the content voice, visual tokens, components and examples to produce on-brand surfaces in one pass.

## Quick product context

futur•e is a **sober, editorial French web app** that translates raw climate data into tranchés verdicts and four "tensions" (faut-il acheter sur le littoral, mes enfants sont-ils exposés, ma retraite ici lisible, mon métier tient-il le coup). Dark, almost night-sky aesthetic. Serif + mono typography. Orange accent only.

## Files in this design system

- `README.md` — full brand brief (content fundamentals + visual foundations + iconography)
- `colors_and_type.css` — all design tokens (CSS vars) — `@import` this
- `fonts/` — self-hosted Instrument Serif (regular + italic); Instrument Sans + JetBrains Mono from Google Fonts
- `assets/` — favicon + Next.js placeholder SVGs from repo
- `preview/*.html` — swatch cards for Type / Colors / Spacing / Components / Brand
- `ui_kits/futuree_web/` — React JSX components (Landing, AuthShell, Dashboard) + click-through demo at `index.html`

## Checklist when making a new surface

1. `@import url("colors_and_type.css")` (or copy the `:root` block). All values below come from it — prefer vars, not hex.
2. Background **always** `#060812` base + 3 blurred orbs (orange `#fb923c`, violet `#a78bfa`, blue/red). `filter: blur(80-100px)`, opacity 0.2-0.45.
3. Typography stack:
   - Display / titles → `Instrument Serif` 400, italic only as accent inside a title, `letter-spacing: -0.03em`, `line-height: 0.96-1.1`
   - Body / UI → `Instrument Sans` 400-600
   - Kickers, labels, data → `JetBrains Mono` 11px, `letter-spacing: 0.12em`, UPPERCASE, often prefixed with `·`
4. Color discipline: **one accent only — orange `#fb923c`**. Semantic colors only on data (red=heat, blue=water, green=mobility, violet=work, yellow=projects).
5. Cards: `rgba(255,255,255,0.04)` bg, `1px solid rgba(255,255,255,0.08)` border, `backdrop-filter: blur(12-18px)` if floating over an orb. Radius 12-22px.
6. CTA buttons: `#fb923c` fill on `#060812` text, radius 6-10px (rectangle) or 999px (pill).
7. Copy structure: verdict (italic, 1 line) → chiffre + source in parens → nuance humaine. French only. Tutoiement inside the product, vouvoiement on landing.

## Brand do / don't

✅ Use the wordmark `futur<span style="color:#fb923c">•</span>e` — minuscules, puce orange
✅ Say "tensions", "lecture", "signaux", "projections"
✅ Name horizons "Accords tenus" (+1,5°C) / "Trajectoire actuelle" (+2,7°C) / "Statu quo" (+4°C)
✅ `Intl.NumberFormat('fr-FR')` for every number
❌ No emojis in body / titles / cards (they exist in the codebase on module icons — **replace with Lucide line-art**)
❌ No purple-blue gradient clichés — orbs yes, gradient backgrounds no
❌ No marketing superlatives (révolutionnaire, unique, meilleur)
❌ No anglicisms: "dashboard" tolerated, everything else translated

## When in doubt

Read `README.md` — it has full content rules, visual foundations and iconography guidelines with canonical examples and banned patterns.

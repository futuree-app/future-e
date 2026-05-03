# futur•e — Design System

> **futur•e** est une application web qui croise des données climatiques publiques
> (DRIAS / Météo-France, Géorisques / BRGM, ANSES, INSEE…) avec le profil d'un
> utilisateur pour rendre le changement climatique **concret, local et personnel**.
> Pas une carte générale du climat — une lecture située de votre commune, de
> votre logement, de votre métier, de votre santé.

## Produit

futur•e se présente comme une application sobre, presque éditoriale, où les
données brutes (chiffres DRIAS, risques officiels) sont traduites en **verdicts
tranchés** et en tensions — « faut-il acheter sur le littoral ? », « mes
enfants sont-ils exposés ? ». Le ton est direct, apaisant, institutionnel.

Surfaces actuellement livrées :

| Surface | Route | Description |
|---|---|---|
| **Landing** | `/` | Recherche de commune (API BAN), 4 tensions prioritaires, réponse éditoriale générée via Claude + Supabase |
| **Authentification** | `/connexion`, `/inscription` | Magic link + mot de passe, glass-card sombre |
| **Compte** | `/compte` | Hub personnel : quartier, profil, suivi, carnet |
| **Dashboard** | `/dashboard` | Projections compactes 3 scénarios (gwl15 / gwl20 / gwl30) |
| **Rapport** | `/rapport` | 6 modules : Quartier, Logement, Métier, Santé, Mobilité, Projets |

## Sources explorées

- **Codebase** : GitHub `futuree-app/future-e` (branche `main`)
  - `src/app/globals.css` — système de classes `.auth-*`, `.account-*`, `.gating-*`
  - `src/components/FutureELanding.tsx` — landing, 70 Ko, styles inline + palette `C.*`
  - `src/app/dashboard/DashboardExperience.tsx` — dashboard 3 scénarios
  - `src/components/AuthForms.tsx` — formulaires auth
  - `src/app/rapport/page.tsx`, `src/app/compte/page.tsx` — pages premium
  - Stack : **Next.js 16**, React 19, Tailwind 4, Supabase, Vercel Analytics
- **Repo proto** (privé, non importé) : `futuree-app/futuree-protos`

> ℹ️ **Instrument Serif** (regular + italic) est livré **self-hosted** dans
> `fonts/`. **Instrument Sans** et **JetBrains Mono** restent chargées depuis
> Google Fonts — fournir les fichiers officiels si précision woff2 nécessaire.
> Le codebase déclare `Avenir Next` en fallback mais utilise partout Instrument
> via CSS inline dans les composants.

---

## Index de ce design system

```
Design System/
├── README.md                 ← vous êtes ici
├── SKILL.md                  ← Agent Skill (Claude Code compatible)
├── colors_and_type.css       ← variables CSS (palette + typographie + tokens)
├── fonts/                    ← Instrument Serif self-hosted (regular + italic)
├── assets/                   ← favicon, SVG placeholders importés du repo
├── preview/                  ← cards du Design System (Type / Colors / Spacing / Components / Brand)
└── ui_kits/
    └── futuree_web/          ← UI kit : landing, auth, dashboard
        ├── index.html        ← démo click-through
        ├── Primitives.jsx    ← Brandmark, Kicker, Orbs, Button, Chip
        ├── Landing.jsx
        ├── AuthShell.jsx
        └── Dashboard.jsx
```

## Modes : dark & light

futur•e existe officiellement en **deux modes**. Le **dark** reste la
signature de la marque (atmosphère nocturne, observatoire) ; le **light**
est une version diurne, lisible en plein soleil ou en réunion projetée, qui
préserve la même structure typographique et le même accent orange.

### Token system
Tous les tokens sont définis dans `colors_and_type.css` autour de **trois
blocs** :

```css
:root {
  /* invariants : --orange, --red, --blue, --green, --violet, --yellow + tints */
}

:root,                       /* dark = défaut */
[data-theme="dark"] { … }

[data-theme="light"] { … }   /* override explicite */

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { … }   /* auto-switch si l'utilisateur n'a rien forcé */
}
```

L'accent orange et la palette sémantique (rouge / bleu / vert / violet /
jaune) sont **invariants cross-mode**. Seuls changent : `--bg*`, `--fg*`,
`--border*`, `--shadow*` et les `--orb-*` (atmosphère).

### Règles d'usage
- **Dark = défaut.** L'app s'ouvre en dark sauf signal contraire.
- **Auto-switch OS** : si l'utilisateur a réglé son OS sur light *et* qu'il
  n'a pas explicitement choisi un mode dans futur•e, on bascule sur light via
  `prefers-color-scheme`.
- **Override utilisateur** : un toggle dans la nav (UI kit) écrit
  `document.documentElement.dataset.theme = 'dark' | 'light'`. La préférence
  doit être persistée (`localStorage.setItem('futuree-theme', …)`) côté
  intégration.
- **Une fois choisi, le mode prime** sur `prefers-color-scheme`.

### Palette light · récap
| Rôle | Dark | Light |
|---|---|---|
| `--bg` | `#060812` | `#faf8f3` (ivoire chaud) |
| `--bg-deep` | `#0d1322` | `#f2ede4` |
| `--fg-hi` | `#f6f4ef` | `#1a1d28` (slate sombre) |
| `--fg-1` | `#e9ecf2` | `#2b3040` |
| `--fg-3` | `#9ba3b4` | `#5b6373` |
| `--border-1` | `rgba(255,255,255,0.08)` | `rgba(26,29,40,0.08)` |
| `--shadow-card` | `0 8px 24px rgba(0,0,0,0.24)` | `0 6px 20px rgba(26,29,40,0.06)` |

### Atmosphère / orbes
Les orbes (`.orb`) utilisent les tokens `--orb-orange`, `--orb-violet`,
`--orb-blue` et `--orb-opacity`.

- **Dark** : addition lumineuse — opacités hautes (0.35-0.45), opacity
  globale 1.
- **Light** : pastels plus opaques mais opacity globale réduite (0.8) pour
  éviter l'effet "tâche grisée" qu'on obtient en transposant directement les
  couleurs dark.

### Composants & inline styles
Les trois composants JSX (`Landing`, `AuthShell`, `Dashboard`) ont été
refactorés : tous les hex et `rgba(...)` codés en dur ont été remplacés par
les variables CSS (`var(--fg-hi)`, `var(--orange)`, `var(--bg-card)`, etc.).
Un nouveau composant qui ne respecte pas cette règle ne supportera pas
automatiquement le mode light.

### Preview cards
Les cards du dossier `preview/` exposent toutes la classe `card-dual` avec
deux moitiés `data-theme="dark"` et `data-theme="light"`, pour qu'un
reviewer voie les deux modes côte-à-côte sans toggle.

---

## Caveats & next steps

- **Fonts** : Instrument Serif self-hosted (TTF) ; fallback Avenir Next ignoré.
  Sans & Mono encore depuis Google Fonts — substituer avec des `.woff2`
  officiels si dispo.
- **Icônes** : les 6 modules utilisent des emojis dans le codebase, l'UI kit
  ici les garde en placeholders SVG inline. Mapping Lucide proposé dans
  ICONOGRAPHY.
- **Rapport** : non inclus dans l'UI kit (trop volumineux, 6 modules × 3
  scénarios). Le Dashboard couvre le modèle de lecture ; le Rapport est une
  version longue à développer.
- **Data** : toutes les valeurs affichées sont **extraites des fallbacks
  statiques** du repo (`STATIC_ANSWERS`, `SCENARIO_DATA`). Aucun appel
  Supabase / DRIAS / API BAN en live.
- **Responsive** : l'UI kit est optimisé desktop. Les breakpoints mobile
  existent dans le codebase mais ne sont pas retranscrits ici.

---

## CONTENT FUNDAMENTALS

### Langue & voix
- **Français uniquement.** Ton direct, sans jargon académique ni emphase
  marketing. Phrases courtes, parfois très courtes.
- **Tutoiement dans les modules produit** ("Ton quartier", "Ta santé", "Tes
  projets") — mais **vouvoiement dans la landing et les emails** ("Pour vous
  aider à décider", "Vous retrouvez votre espace").
- Cette dualité est volontaire : la landing est une conversation d'expert à
  client, le produit est un journal intime.

### Structure d'une phrase futur•e
Trois mouvements, dans cet ordre :
1. **Verdict tranché** en une ligne, souvent en italique : « À acheter avec les yeux ouverts. »
2. **Données chiffrées + source** : « +31 % en scénario médian 2050 (DRIAS, Géorisques). »
3. **Nuance humaine** : « Rien d'irrémédiable, mais autant le savoir tôt. »

### Vocabulaire signature
- **« futur•e »** — toujours en minuscules, avec la puce médiane `•` orange.
  Jamais "Future" ou "Futur-e".
- **« tensions »** — les 4 questions principales. Pas des "risques", des "tensions".
- **« lecture »** — « une lecture de votre territoire », « une lecture
  climatique personnelle ». Pas "analyse", pas "diagnostic".
- **« signaux »** — « trois signaux méritent votre attention ».
- **« projections »** — DRIAS parle de projections, pas de prédictions.
- Horizons nommés : **« Accords tenus » (+1,5°C)**, **« Trajectoire actuelle » (+2,7°C)**, **« Statu quo » (+4°C)**.

### Ce qui est BANNI
- Emojis en body copy (OK dans les icônes de module comme `🏘 🏠 💼 🫁 🚗 🗓` mais c'est à remplacer par des SVG propres — flagué ci-dessous).
- Majuscules intempestives sauf kickers mono (`PROJECTIONS CLIMATIQUES COMPACTES`).
- Mots anxiogènes non suivis d'une nuance : "catastrophe", "effondrement",
  "mortifère" n'apparaissent jamais seuls.
- Superlatifs marketing : pas de "révolutionnaire", "unique", "le meilleur".

### Casse & typographie
- **Titres** (`.account-title`, `.auth-title`, `.h1`) : en Instrument Serif
  régulier, `letter-spacing: -0.03em`, `line-height: 0.96`. Pas italique par
  défaut — l'italique est réservé aux **accents** au sein d'un titre.
- **Kickers** : `JetBrains Mono`, `11px`, `letter-spacing: 0.12em`, UPPERCASE,
  couleur orange ou gris clair. Souvent préfixés par `·` — « · projections climatiques compactes · ».
- **Labels de formulaire** : mono, 11px, UPPERCASE, couleur `#9ba3b4`.
- **Chiffres** : jamais de séparateur anglais. `Intl.NumberFormat('fr-FR')`.
  « 34 jours/an », « +2,7°C », « 31 % ».

### Exemples canoniques
> « La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). »

> « Rien d'irrémédiable, mais autant le savoir tôt. »

> « Pas des généralités : votre situation, dans La Rochelle. »

> « Quatre angles de lecture pour comprendre ce que le climat change concrètement ici. »

---

## VISUAL FOUNDATIONS

### Ambiance
**Minimaliste, scientifique, calme, transparent, nocturne.** futur•e vit sur
fond sombre (`#060812`) avec des orbes lumineuses diffuses (orange / violet /
bleu) floutées à `blur(80-100px)`. L'effet est celui d'un observatoire : on est
dans la nuit avant un lever de soleil, mais le soleil est une donnée.

### Couleurs
- **Fond principal** : `#060812` (nuit bleutée, pas noir pur). Gradient
  secondaire vers `#0d1322`.
- **Accent primaire** : `#fb923c` (orange Tailwind 400). Utilisé pour :
  brandmark `•`, CTAs, liens, kickers de section, focus ring.
- **Sémantique** :
  - Rouge `#f87171` → chaleur, santé, canicule
  - Bleu `#60a5fa` → eau, submersion, quartier
  - Vert `#4ade80` → mobilité, scénario optimiste, succès
  - Violet `#a78bfa` → métier, secondaire
  - Jaune `#fbbf24` → projets
- **Texte** : `#e9ecf2` (titre `#f6f4ef`), muted `#9ba3b4`, dim `#6b7388`.
- **Cards** : `rgba(255,255,255,0.04)` fond + `rgba(255,255,255,0.08)` bordure.

### Typographie
- **Display / titres** : `Instrument Serif` (régulier 400, italique quand
  accentué). Clamp jusqu'à 82px sur hero compte.
- **Body / UI** : `Instrument Sans` (substitution de "Avenir Next" déclaré
  dans globals.css — flagué). Poids 400 / 500 / 600.
- **Mono / données** : `JetBrains Mono`. Labels, kickers, meta, chiffres
  secondaires, source bar.

### Espacement & rythme
- Conteneurs max : 860px (éditorial) / 1100px (landing) / 1280px (compte).
- Padding de section : `80px 28px` desktop, `40px 20px` mobile.
- Gap entre cards : 12-18px. Entre sections : 80-100px.
- Radii : **petits pour les contrôles** (6-10px boutons, 8-12px inputs),
  **moyens pour les cards** (12-22px), **généreux pour les bands** (24-34px).
- Pills arrondies : `999px` (chips, badges, tensions actives).

### Backgrounds & orbes
- **Orbes** : 3 cercles flous par surface, positionnés aux coins, `filter:
  blur(80-100px)`, opacity 0.18-0.45. Couleurs : orange + violet + bleu/rouge.
- **Tracking souris** : l'orbe 1 se translate légèrement avec la souris
  (`transform: translate(mouseX*30, mouseY*30)`, `transition: 0.3s ease`).
- **Pas d'image photo** pour le moment. Pas de texture, pas de grain.
- **Pas de gradient cliché bleu-violet** malgré les orbes — les orbes sont
  ponctuelles, la base reste une seule couleur `#060812`.

### Animations
- **Transitions standard** : `150ms ease` (hover), `200ms ease` (cards),
  `300ms ease` (orbes souris), `800ms linear infinite` (spinner).
- **Sources bar** : défilement horizontal `25s linear infinite`.
- **Hover card tension** : `transform: translateY(-1px)` + bordure passe à
  `rgba(251,146,60,0.3)`.
- **Active/press** : simple changement de background, pas de shrink.
- **Spinner** : 18×18, cercle gris avec top orange, `0.8s` par tour.

### Borders & shadows
- **Bordures par défaut** : `1px solid rgba(255,255,255,0.08)`.
- **Bordures actives** : `rgba(251,146,60,0.36)` à `0.45`.
- **Inner shadow** (cards claires sur sombre) : `inset 0 1px 0 rgba(255,255,255,0.03-0.05)`.
- **Outer shadow** : `0 30px 90px rgba(2, 6, 23, 0.42)` pour cards hero,
  `0 8px 24px <accent>15` pour cards hover.
- **Top-border coloré** sur module cards : `borderTop: 2px solid <moduleColor>`.

### Transparence & blur
- **Cards** : `backdrop-filter: blur(12-18px)` + fond `rgba(255,255,255,0.03-0.06)`.
- **Nav sticky** : `blur(16px)` + `rgba(6,8,18,0.7)`.
- **Auth card** : `blur(18px)` + `rgba(10,15,28,0.72)`.
- Règle : **si l'élément flotte sur un orbe, il blurre**. Sinon non.

### Corner radii (récapitulatif)
| Usage | Radius |
|---|---|
| Input auth | 18px |
| Input landing | 10px |
| Bouton rectangle | 6-10px |
| CTA pill / chip / badge | 999px |
| Card UI | 12px (landing) / 18-22px (compte) |
| Band hero | 24-34px |
| Sources bar | 0 (full-bleed) |

### Iconographie de module (à retravailler)
Les 6 modules utilisent actuellement des emojis : `🏘 🏠 💼 🫁 🚗 🗓`. **Ces
emojis doivent être remplacés par des SVG line-art sobres** (voir section
ICONOGRAPHY). Flagué.

---

## ICONOGRAPHY

### État actuel
Le codebase ne déclare **aucun système d'icônes structuré** — pas de fichier
d'icônes, pas de lib lucide/heroicons, pas de sprite SVG. Les seuls SVG sont
les placeholders Next.js (`file.svg`, `globe.svg`, `next.svg`, `window.svg`,
`vercel.svg`) qui ne servent pas dans l'app.

**Les modules produit utilisent actuellement des emojis littéraux** : `🏘 🏠
💼 🫁 🚗 🗓`. C'est un anti-pattern pour une app data-viz climatique — incohérent
entre plateformes, et visuellement trop chaud/enfantin pour le ton futur•e.

### Recommandation (substitution flaguée)
Utiliser **Lucide** (`https://unpkg.com/lucide@0.400.0`) — stroke 1.5-1.75,
line-art, cohérent avec l'esthétique sobre. Mapping proposé :

| Module | Emoji actuel | Lucide icon |
|---|---|---|
| Quartier | 🏘 | `map-pin` ou `layers` |
| Logement | 🏠 | `home` |
| Métier | 💼 | `briefcase` |
| Santé | 🫁 | `activity` ou `heart-pulse` |
| Mobilité | 🚗 | `car` ou `route` |
| Projets | 🗓 | `calendar` |

Autres usages : `search` (loupe landing), `arrow-right` (CTA), `map-pin`
(commune chip), `check` (planFeature), `chevron-right` (navigation).

### Autres assets visuels
- **Logo** : textuel uniquement — `futur` + `•` orange + `e`. Polices :
  Instrument Serif italique. Pas de logo graphique.
- **Favicon** : `src/app/favicon.ico` (importé dans `assets/`).
- **Unicode chars** utilisés : `•` (brandmark), `·` (séparateur kicker),
  `°` (température), `/` (unités).
- **Pas d'illustrations.** Pas de photos. Pas de patterns.

### Règles
- Stroke-based SVG seulement, jamais remplis.
- Taille : 16-20px inline, 24-36px dans les module cards.
- Couleur : héritée du contexte (muted par défaut, accent si état actif).
- Pas d'emoji dans les titres, kickers, cards. L'emoji est toléré
  *uniquement* dans du texte utilisateur libre (notes carnet).

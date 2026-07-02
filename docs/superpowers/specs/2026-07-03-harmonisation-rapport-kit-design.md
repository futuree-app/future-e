# Harmonisation visuelle du rapport : kit de cartes partagé + migration Logement

> Spec de design, 2026-07-03. Le rapport futur•e est **un seul produit** : ses modules
> (Territoire, Logement, à venir Santé…) doivent partager le même langage de cartes. Aujourd'hui
> Territoire est déjà sur ce langage (`.glass rounded-xl`, intertitre à puce mono), mais Logement
> rend ses sections de résultat en `var(--bg-card)` coins-droits, style hérité : « on dirait une
> autre app ». Ce chantier extrait un **kit de primitives partagé** (source unique du langage) et
> **migre Logement** dessus. Territoire n'est pas touché (il adoptera le kit plus tard).

## Problème / valeur

Le haut de Logement (hero, passeport, aside, formulaire) est déjà harmonisé (`.glass`, arrondi,
Serif). L'écart est **entièrement dans les sections de résultat** de `LogementModule.tsx` :
10 conteneurs en `var(--bg-card)` opaque à coins droits (Énergie, Risques, Sinistralité, ZFE,
Lecture personnalisée, Actions, Savoir, sonde projet, verdict). Les faire passer au verre
arrondi de Territoire supprime la rupture de produit. En extrayant les primitives dans un kit,
tout futur module en hérite au lieu de re-copier du Tailwind inline.

## Périmètre

**Intègre :**
- Un kit `src/components/report/kit.tsx` : `ReportSection` (intertitre) + `GlassCard` (carte verre).
- La migration des sections de résultat de `LogementModule.tsx` vers ces primitives.
- La documentation du kit comme standard (en-tête + `inventaire-design.md`).

**Exclut (décision porteur) :**
- **Territoire n'est pas modifié.** `QuartierClimatData`, `QuartierSynthesis`, etc. gardent leur
  `.glass` inline. Le kit est écrit pour matcher leur ADN ; leur adoption est un fast-follow
  documenté, pas ce chantier (zéro risque sur l'écran fraîchement livré).
- **Aucun changement de contenu, de prose, de données, de logique.** Seul le *chrome* des cartes
  change (fond, coins, bordure, intertitre). Le texte, les valeurs, les états, les events, les
  liens restent identiques.
- Le passeport, l'aside « briques », le hero, le formulaire de Logement (déjà glass) : inchangés.
- `MetricTile` / unification de `Block` : **hors périmètre** (YAGNI ; `Block` reste tel quel).

## Principe directeur

- **Structure partagée, accent propre au module.** Le kit unifie la *structure* (carte verre,
  intertitre à puce). Chaque module garde son **accent** : Territoire = info/bleu (`--color-info`
  #60a5fa), **Logement = taupe** (`--accent` fallback #c8b89a, déjà porté par le passeport). La
  migration ne change PAS l'accent taupe de Logement.
- **Markup identique à Territoire.** `GlassCard` rend `.glass rounded-xl` (+ padding) comme les
  cartes Territoire, pour que le kit soit adoptable par Territoire plus tard sans changement
  visuel.

## Le kit — `src/components/report/kit.tsx`

Deux primitives, plus une table de tons. Tons mappés sur des tokens **confirmés existants**
(`src/app/design-tokens.css` + `@theme` de `globals.css`).

```tsx
import type { ReactNode } from "react";

export type ReportTone =
  | "info" | "accent" | "orange" | "red" | "green" | "blue" | "violet" | "neutral";

const TONE: Record<ReportTone, string> = {
  info: "var(--color-info)",     // #60a5fa (Territoire)
  accent: "var(--accent, #c8b89a)", // taupe (Logement)
  orange: "var(--orange)",
  red: "var(--red)",
  green: "var(--green)",
  blue: "var(--blue)",
  violet: "var(--violet)",
  neutral: "var(--fg-4)",
};

// Intertitre de section : puce + mono majuscules (ADN Territoire). Remplace
// l'ancien SectionLabel de Logement (mono + filet). Le contenu de la section
// (une GlassCard, une grille, …) est passé en children.
export function ReportSection(
  { eyebrow, tone = "neutral", children }:
  { eyebrow: string; tone?: ReportTone; children: ReactNode },
) {
  return (
    <section>
      <div
        className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase mb-4"
        style={{ color: TONE[tone] }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE[tone] }} />
        {eyebrow}
      </div>
      {children}
    </section>
  );
}

// Carte verre du rapport : .glass rounded-xl, padding réglable, liseré haut
// coloré optionnel (façon border-t-2 de la card-answer). Remplace les
// conteneurs var(--bg-card) coins-droits de Logement.
export function GlassCard(
  { children, pad = "md", accentTop, className = "" }:
  { children: ReactNode; pad?: "sm" | "md" | "lg"; accentTop?: ReportTone; className?: string },
) {
  const padCls = pad === "lg" ? "p-8" : pad === "sm" ? "p-4" : "p-6";
  return (
    <div
      className={`glass rounded-xl ${padCls} ${className}`.trim()}
      style={accentTop ? { borderTop: `2px solid ${TONE[accentTop]}` } : undefined}
    >
      {children}
    </div>
  );
}
```

Notes :
- `pad="md"` = `p-6` (24px, = l'actuel `padding: 24`). `p-4` (16px) pour les cartes denses,
  `p-8` (32px) pour un bloc d'appui.
- `accentTop` optionnel : pour un liseré coloré discret (ex. Lecture personnalisée en taupe).
- Pas d'état, pas de logique : primitives pures, testables à l'œil.

## Migration `LogementModule.tsx`

Chaque section suit le patron : `ReportSection` (intertitre + puce tonale) enveloppe une
`GlassCard`. Table de correspondance (emplacements actuels) :

| Section (ligne actuelle) | Avant | Après | Ton |
|---|---|---|---|
| Verdict (108) | `div var(--bg-card)` + borderLeft | `GlassCard accentTop={level}` | selon level |
| ProjectProbe (230) | `div var(--bg-card)` radius 12 | `GlassCard pad="sm"` | — |
| Sinistralité (287) | `div var(--bg-card)` | `ReportSection`+`GlassCard` | neutral |
| Lecture perso vide (529) | `div var(--bg-card)` | `GlassCard` | — |
| Lecture perso loading (558) | `div var(--bg-card)` | `GlassCard` | — |
| Énergie (622) | `div var(--bg-card)` | `ReportSection`+`GlassCard` | orange |
| Risques du bâti (669) | `div var(--bg-card)` | `ReportSection`+`GlassCard` | red |
| ZFE (699) | `div var(--bg-card)` | `ReportSection`+`GlassCard` | blue |
| Actions documentées (721) | grille de `ActionCard` | `ReportSection` autour | neutral |
| Pages Savoir (781) | `div var(--bg-card)` | `ReportSection`+`GlassCard pad="sm"` | neutral |

- **`SectionLabel` (l.80) est supprimé**, remplacé par `ReportSection` (les intertitres passent
  du filet-mono à la puce-mono de Territoire : c'est la part visible de l'harmonisation).
- **`Block` (l.119) reste inchangé** (sous-élément label/valeur, pas une carte).
- **`ActionCard` (l.129)** : le variant `primary` remplace `background: var(--bg-card)` +
  coins droits par la classe `glass` + `rounded-xl` (arrondi + verre) ; le variant normal
  (`var(--bg-elev)`) est conservé tel quel. `ActionCard` garde sa propre structure interne
  (pas de passage par `GlassCard`, il a son padding/hover propres).
- **`Verdict` (l.104)** : conteneur → `GlassCard` avec `accentTop` de la couleur de niveau
  (le liseré gauche coloré devient un liseré haut, cohérent avec `card-answer`).
- **Sinistralité** : le bloc livré aujourd'hui adopte `ReportSection`+`GlassCard` comme les
  autres (son intertitre « Ce que le risque a déjà coûté ici » passe en puce mono).

Ton des intertitres : aligné sur les puces de l'aside « briques » (Énergie=orange, Risques=red,
Assurance/ZFE=blue). Les sections sans couleur naturelle (Sinistralité, Actions, Savoir, Lecture
perso) = `neutral` (`--fg-4`), comme l'actuel.

## Ce qui NE change pas (garde-fous anti-régression)

- Le **contenu** de chaque carte (textes, valeurs, DPE, classes ONRN, liens, events PostHog).
- Les **conditions de rendu** (`{result.sinistralite && …}`, gating, etc.).
- L'**accent taupe** du module (passeport, boutons, `--accent`).
- Le **hero, le passeport, l'aside, le formulaire** (déjà glass).
- **Territoire** entièrement.

## Architecture / isolation

- `kit.tsx` : primitives pures sans dépendance (juste `react`). Aucune lecture disque, aucun
  état. Consommable client ou serveur.
- `LogementModule.tsx` importe `{ ReportSection, GlassCard }` depuis `@/components/report/kit`.
- Frontière nette : le kit décrit *à quoi ressemble* une carte ; le module décrit *ce qu'il y a
  dedans*.

## Tests / vérification

Pas de logique → vérification visuelle + statique (le repo n'a pas de runner de composants) :
1. **tsc + eslint** verts sur `kit.tsx` et `LogementModule.tsx`.
2. **Navigateur** (route dev jetable + `chrome-headless-shell`, les 3 adresses déjà utilisées :
   Toulouse/Bordeaux/Lille). Comparer avant/après : **seul le chrome des cartes change** (verre
   translucide, coins arrondis, intertitre à puce) ; le texte, les valeurs, l'ordre, les états
   sont identiques. Aucune erreur console.
3. **Diff de contenu** : `grep` sur le HTML rendu que les libellés/valeurs clés sont toujours là
   (attribution ONRN, « 1995-2021 », DPE, etc.) — le chrome change, pas le fond.
4. Contrôle visuel qualitatif : le module Logement et une capture de référence Territoire se
   lisent comme le même produit (cartes verre, mêmes intertitres).

## Fichiers touchés

- **Nouveau** `src/components/report/kit.tsx`
- **Modifié** `src/components/report/LogementModule.tsx` (migration des sections + suppression de
  `SectionLabel`, retouche `ActionCard`/`Verdict`)
- **Modifié** `docs/vault/recherches/inventaire-design.md` (le kit = standard du rapport ;
  Territoire adoptera ; règle « structure partagée, accent par module »)

## Différé / hors périmètre (documenté)

- **Adoption du kit par Territoire** (`QuartierClimatData`, `QuartierSynthesis`) : fast-follow,
  mécanique (markup identique), à faire quand on peut vérifier Territoire au navigateur.
- **`MetricTile`** / unification de `Block` et des métriques Territoire : plus tard si besoin.
- **Modules futurs (Santé…)** : consomment le kit dès leur création.

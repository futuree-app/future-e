# Harmonisation rapport — kit de cartes partagé + migration Logement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extraire un kit de primitives de carte partagé (`ReportSection` + `GlassCard`) et migrer les sections de résultat de `LogementModule.tsx` du style `var(--bg-card)` coins-droits vers le verre arrondi de Territoire, pour que le rapport se lise comme un seul produit.

**Architecture:** Deux primitives présentationnelles pures dans `src/components/report/kit.tsx` (aucune logique, aucun état), consommées par `LogementModule.tsx`. Territoire n'est pas touché : le kit est écrit pour matcher son ADN (`.glass rounded-xl`, intertitre à puce mono) et l'adoptera plus tard.

**Tech Stack:** React (composants présentationnels), Tailwind (classes `.glass`, `rounded-xl`), tokens CSS de `design-tokens.css`. Vérification : `tsc --noEmit`, `eslint`, navigateur (`chrome-headless-shell` via `playwright-core`).

## Global Constraints

- **Aucun changement de contenu** : textes, valeurs (DPE, classes ONRN, etc.), conditions de rendu, events PostHog, liens = strictement identiques. Seul le *chrome* des cartes change.
- **Accent taupe de Logement conservé** : `var(--accent, #c8b89a)` reste l'accent du module (passeport, boutons). La migration ne le change pas.
- **Markup `GlassCard` = ADN Territoire** : `.glass rounded-xl` (+ padding), pour adoption ultérieure sans changement visuel.
- **Ne pas toucher** : hero, passeport, aside « briques », formulaire (déjà glass) ; Territoire entièrement ; `Block` (l.119, sous-élément label/valeur).
- **Tons mappés sur tokens confirmés** : `info→var(--color-info)`, `accent→var(--accent, #c8b89a)`, `orange→var(--orange)`, `red→var(--red)`, `blue→var(--blue)`, `green→var(--green)`, `violet→var(--violet)`, `neutral→var(--fg-4)`.
- Pas de runner de composants dans le repo → vérification = tsc + eslint + navigateur + diff de contenu.

---

### Task 1: Créer le kit `src/components/report/kit.tsx`

**Files:**
- Create: `src/components/report/kit.tsx`

**Interfaces:**
- Produces :
  - `type ReportTone = "info" | "accent" | "orange" | "red" | "green" | "blue" | "violet" | "neutral"`
  - `ReportSection({ eyebrow: string; tone?: ReportTone; children: ReactNode }): JSX.Element`
  - `GlassCard({ children: ReactNode; pad?: "sm" | "md" | "lg"; accentTop?: ReportTone; className?: string }): JSX.Element`

- [ ] **Step 1: Écrire le kit**

Create `src/components/report/kit.tsx` :
```tsx
import type { ReactNode } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Kit de cartes du rapport futur•e — SOURCE UNIQUE du langage visuel des modules.
// Territoire est la référence (déjà en .glass) ; Logement adopte ici ; tout futur
// module (Santé…) hérite. Règle : STRUCTURE partagée, ACCENT propre au module
// (Territoire = info/bleu, Logement = taupe). Doctrine : docs/vault/recherches/
// inventaire-design.md + spec 2026-07-03-harmonisation-rapport-kit-design.md.
// Primitives pures : aucune logique, aucun état, aucune lecture disque.
// ════════════════════════════════════════════════════════════════════════════

export type ReportTone =
  | "info" | "accent" | "orange" | "red" | "green" | "blue" | "violet" | "neutral";

const TONE: Record<ReportTone, string> = {
  info: "var(--color-info)",
  accent: "var(--accent, #c8b89a)",
  orange: "var(--orange)",
  red: "var(--red)",
  green: "var(--green)",
  blue: "var(--blue)",
  violet: "var(--violet)",
  neutral: "var(--fg-4)",
};

// Intertitre de section : puce + mono majuscules (ADN Territoire). Le contenu
// de la section (une GlassCard, une grille…) est passé en children.
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
// coloré optionnel. Remplace les conteneurs var(--bg-card) coins-droits.
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

- [ ] **Step 2: Vérifier tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/components/report/kit.tsx`
Expected: exit 0, aucune erreur. (Primitives présentationnelles : pas de test unitaire ; la preuve visuelle vient à la Task 2.)

- [ ] **Step 3: Commit**

```bash
git add src/components/report/kit.tsx
git commit -m "feat(report): kit de cartes partagé (ReportSection + GlassCard)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Migrer `LogementModule.tsx` vers le kit

**Files:**
- Modify: `src/components/report/LogementModule.tsx`

**Interfaces:**
- Consumes: `ReportSection`, `GlassCard`, `ReportTone` (Task 1).

**Patron de transformation.** Chaque section suivait :
```tsx
<div>
  <SectionLabel>Titre</SectionLabel>
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: N }}>
    …contenu inchangé…
  </div>
</div>
```
devient :
```tsx
<ReportSection eyebrow="Titre" tone="…">
  <GlassCard>
    <div style={{ display: "grid", gap: N }}>
      …contenu inchangé…
    </div>
  </GlassCard>
</ReportSection>
```
Le `background`/`border`/`padding` du conteneur disparaissent (portés par `GlassCard`) ; **tout le contenu interne reste identique**.

- [ ] **Step 1: Importer le kit et supprimer `SectionLabel`**

En haut de `LogementModule.tsx`, sous `import type { OnrnSinistralite, PerilState } from "@/lib/onrn-sinistralite";`, ajouter :
```ts
import { ReportSection, GlassCard } from "@/components/report/kit";
```
Puis SUPPRIMER entièrement la fonction `SectionLabel` (l.~80, le composant `function SectionLabel({ children }: { children: React.ReactNode }) { … }`). Toutes ses utilisations `<SectionLabel>…</SectionLabel>` seront remplacées par `ReportSection` dans les steps suivants.

- [ ] **Step 2: Migrer le bloc Sinistralité (Face 2)**

Remplacer :
```tsx
    <div>
      <SectionLabel>Ce que le risque a déjà coûté ici</SectionLabel>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24, display: "grid", gap: 18 }}>
```
par :
```tsx
    <ReportSection eyebrow="Ce que le risque a déjà coûté ici">
      <GlassCard>
        <div style={{ display: "grid", gap: 18 }}>
```
et fermer en conséquence (la `</div>` du conteneur + `</div>` externe deviennent `</div></GlassCard></ReportSection>`). Le contenu (`PerilLine`, pédagogie CatNat, attribution) est inchangé.

- [ ] **Step 3: Migrer les sections « dimensions réelles » (Énergie, Risques, ZFE)**

Pour chacune, appliquer le patron de transformation. Tons :
- **Énergie & rénovation** → `tone="orange"`, `gap: 18`.
- **Risques du bâti** → `tone="red"`, `gap: 16`.
- **Zone à faibles émissions** → `tone="blue"`, `gap: 12`.

Exemple complet pour Énergie (les deux autres suivent le même patron avec leur gap/tone) :
```tsx
<ReportSection eyebrow="Énergie & rénovation" tone="orange">
  <GlassCard>
    <div style={{ display: "grid", gap: 18 }}>
      …contenu Énergie inchangé (DpeBadge, Block, audit scenarios)…
    </div>
  </GlassCard>
</ReportSection>
```

- [ ] **Step 4: Migrer la Lecture personnalisée (états vide + loading) et le Verdict**

- État vide (« Générer la lecture ») et état loading : leur conteneur `<div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", padding: 24|32, textAlign: "center" }}>` devient `<GlassCard><div style={{ textAlign: "center" }}>…</div></GlassCard>`. L'intertitre `<SectionLabel>Lecture personnalisée</SectionLabel>` devient l'enveloppe `<ReportSection eyebrow="Lecture personnalisée" tone="accent">…</ReportSection>` autour des trois états (vide/loading/verdict).
- `Verdict` (l.~104) : remplacer le conteneur
```tsx
<div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderLeft: `3px solid ${colors[level]}`, padding: "24px 28px" }}>
```
par une `GlassCard` avec liseré haut de la couleur du niveau :
```tsx
<GlassCard accentTop={level === "good" ? "green" : level === "bad" ? "red" : "orange"} className="px-7 py-6">
```
(le `padding: "24px 28px"` inline est remplacé par `className="px-7 py-6"`). Le contenu (titre Serif + detail) est inchangé.

- [ ] **Step 5: Migrer la sonde projet, les Actions et les Pages Savoir**

- **ProjectProbe** (l.~221) : `<div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderRadius: 12, padding: "18px 20px" }}>` → `<GlassCard pad="sm">` (contenu inchangé : question + boutons).
- **Actions documentées** : `<SectionLabel>Actions documentées</SectionLabel>` + la grille → `<ReportSection eyebrow="Actions documentées">` autour de la grille `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>…</div>`.
- **ActionCard** (l.~129) : sur le div interne, ajouter `className={primary ? "glass rounded-xl" : ""}` et, dans le `style`, remplacer `background: primary ? "var(--bg-card)" : "var(--bg-elev)"` par `background: primary ? "transparent" : "var(--bg-elev)"` (le verre vient de la classe `glass` quand primary ; le non-primary garde `var(--bg-elev)` + sa bordure). Le contenu (titre + desc) est inchangé.
- **Pages Savoir associées** : `<SectionLabel>Pages Savoir associées</SectionLabel>` + `<div style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>` (liste de liens) → `<ReportSection eyebrow="Pages Savoir associées"><GlassCard pad="sm" className="!p-0 overflow-hidden">…liste inchangée…</GlassCard></ReportSection>` (la liste a ses propres paddings de lignes ; `!p-0` évite le double padding, `overflow-hidden` respecte l'arrondi).

- [ ] **Step 6: Vérifier tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx`
Expected: exit 0.

- [ ] **Step 7: Vérification navigateur (route dev jetable + 3 adresses)**

Créer `src/app/dev-logement-preview/page.tsx` :
```tsx
import LogementModule from "@/components/report/LogementModule";
export const dynamic = "force-dynamic";
export default function DevLogementPreview() { return <LogementModule defaultCommune="Toulouse" />; }
```
Avec le dev server sur :3000, piloter via `chrome-headless-shell` (script Playwright type `drive-face2.mjs` de la session) les adresses `5 rue du Taur, Toulouse`, `Place Pey-Berland, Bordeaux`, `Place du Théâtre, Lille`. Pour chacune : saisir l'adresse, attendre le passeport, capturer un screenshot pleine page + dumper le HTML rendu. Regarder les screenshots : **les cartes de résultat sont en verre translucide + coins arrondis + intertitre à puce** (comme Territoire), le contenu (texte, valeurs, ordre, états) est identique à avant, aucune erreur console.

- [ ] **Step 8: Diff de contenu (le fond n'a pas bougé)**

Sur le HTML Toulouse dumpé, vérifier que les contenus clés sont toujours là :
```bash
for s in "Ce que le risque a déjà coûté ici" "ONRN (État / CCR / Mission Risques Naturels), via Géorisques" "1995-2021" "Énergie & rénovation" "Risques du bâti" "Étiquette D" "Pages Savoir associées"; do
  grep -qF "$s" rendu.html && echo "OK: $s" || echo "MANQUE: $s"
done
# le style carré ne doit plus servir dans les sections migrées :
grep -c "var(--bg-card)" rendu.html
```
Expected: tous `OK`. (Le compteur `var(--bg-card)` peut rester > 0 si d'autres composants de page l'utilisent, mais aucune des sections migrées ne doit le porter.)

- [ ] **Step 9: Supprimer la route dev et committer**

```bash
rm -rf src/app/dev-logement-preview
git add src/components/report/LogementModule.tsx
git commit -m "feat(logement): migre les sections de résultat vers le kit de cartes

Sections Énergie/Risques/Sinistralité/ZFE/Actions/Savoir/sonde/lecture passées
de var(--bg-card) coins-droits au verre arrondi de Territoire (ReportSection +
GlassCard). Contenu, données, logique et accent taupe inchangés.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Documenter le kit comme standard

**Files:**
- Modify: `docs/vault/recherches/inventaire-design.md`

**Interfaces:** aucune (doc).

- [ ] **Step 1: Ajouter la règle du kit à l'inventaire design**

Ajouter une section à `docs/vault/recherches/inventaire-design.md` (près des invariants / signatures durables) :
```markdown
## Kit de cartes du rapport (standard partagé, 2026-07-03)

Le langage de cartes du rapport vit dans `src/components/report/kit.tsx`
(`ReportSection` = intertitre à puce mono ; `GlassCard` = `.glass rounded-xl`).
C'est la SOURCE UNIQUE : tout module du rapport le consomme, tout futur module
(Santé…) en hérite. Règle : **structure partagée, accent propre au module**
(Territoire = info/bleu, Logement = taupe #c8b89a). Territoire n'a pas encore
migré (il est déjà en .glass inline, markup identique au kit) : adoption =
fast-follow mécanique, à faire quand on peut vérifier Territoire au navigateur.
Ne pas réintroduire de carte `var(--bg-card)` coins-droits dans le rapport.
```

- [ ] **Step 2: Commit**

```bash
git add docs/vault/recherches/inventaire-design.md
git commit -m "docs(design): kit de cartes du rapport = standard partagé

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes d'exécution

- **Dev server** requis sur :3000 pour la vérif navigateur (déjà lancé en session).
- **Piège** : ne migrer QUE les conteneurs de section. Ne pas toucher le passeport (`rounded-2xl`
  tint), l'aside « briques » (déjà `.glass`), le formulaire (déjà `.glass`), ni `Block`.
- **Preuve d'harmonisation** : à la fin, le module Logement et une capture Territoire doivent se
  lire comme le même produit (cartes verre, mêmes intertitres à puce).

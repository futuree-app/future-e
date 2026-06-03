# Hiérarchie d'information du bloc « critères identifiés » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la glose permanente sous chaque puce de critère par trois niveaux d'information : puces nues (N1), bulle positive au survol/tap sur les puces à nuance (N2), panneau repliable « Ce que ces critères mesurent » pour les limites de périmètre (N3).

**Architecture:** Pur affichage, zéro impact moteur. La source de contenu (`comparateur-labels.ts`) éclate `PREFERENCE_INTERPRETATIONS` en deux maps (`PREFERENCE_TOOLTIP` positif / `PREFERENCE_CAVEAT` limite positive). Un nouveau composant `ChipTooltip` (puce = déclencheur, soulignement pointillé, bulle, calqué sur `MetricTooltip`) porte le N2. `OuVivreClient` consomme la nouvelle forme `{label, tooltip, caveat}` et rend le `<details>` N3.

**Tech Stack:** React/Next (App Router, client component), TypeScript, Tailwind. Vérification : `npx tsc --noEmit` + `npm run lint` + contrôle visuel sur le dev (port 3000). PAS de runner de test (cf. AGENTS.md). `grep -c` renvoie exit 1 sur 0 match (ne pas chaîner en `&&`).

**Spec :** `docs/superpowers/specs/2026-06-03-hierarchie-criteres-design.md`

---

## Task 1 : Composant `ChipTooltip` (N2)

**Files:**
- Create: `src/components/ChipTooltip.tsx`

- [ ] **Step 1 : Créer le composant**

Calqué sur `src/components/MetricTooltip.tsx` (même logique open/close : survol + focus + tap + Échap + clic extérieur), mais le déclencheur est la **puce entière** (soulignement pointillé), pas une icône ⓘ.

```tsx
"use client";

// Tooltip de puce (critères /ou-vivre) — la puce ENTIÈRE est le déclencheur, avec un
// soulignement pointillé qui signale la nuance (style « définition »). Survol + focus
// clavier + tap (mobile) ouvrent la bulle ; Échap / clic extérieur ferment. Pur affichage.
// Distinct de MetricTooltip (icône ⓘ pour les cartes-indicateurs).

import { useEffect, useId, useRef, useState } from "react";

export function ChipTooltip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  // Fermeture au clic extérieur / Échap (utile pour l'ouverture au tap mobile).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="chip-tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="chip-tip-btn"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </button>
      {open && (
        <span role="tooltip" id={id} className="chip-tip-bubble">
          {text}
        </span>
      )}

      <style>{`
        .chip-tip { position: relative; display: inline-flex; }
        .chip-tip-btn {
          font-size: 12px; line-height: 1.2; cursor: help;
          color: rgba(233,236,242,0.9);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 9999px; padding: 4px 12px;
          background: transparent;
          text-decoration: underline dotted rgba(255,255,255,0.3);
          text-underline-offset: 3px;
          transition: border-color 0.15s, color 0.15s;
          font-family: inherit;
        }
        .chip-tip-btn:hover { border-color: rgba(255,255,255,0.22); color: #e9ecf2; }
        .chip-tip-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        .chip-tip-bubble {
          position: absolute; bottom: calc(100% + 8px); left: 0; z-index: 50;
          width: max-content; max-width: 240px;
          background: #0b101c; color: #c6cfdb;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 10px 12px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 12.5px; line-height: 1.5; font-weight: 400;
          letter-spacing: normal; text-transform: none;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          animation: chip-tip-in 0.14s ease;
        }
        @keyframes chip-tip-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </span>
  );
}
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected : clean (le composant est autonome, aucun consommateur encore).

Run: `npm run lint 2>&1 | grep -i "ChipTooltip"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 3 : Commit**

```bash
git add src/components/ChipTooltip.tsx
git commit -m "feat(ou-vivre): composant ChipTooltip (puce a nuance, bulle positive)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Couche données + rendu UI (changement cohérent, un seul commit)

Le changement de signature de `preferencesToInterpreted` casse son consommateur (`OuVivreClient`) ; les deux fichiers doivent donc changer ensemble pour rester `tsc`-vert.

**Files:**
- Modify: `src/lib/comparateur-labels.ts` (remplacer `PREFERENCE_INTERPRETATIONS` ~l.38-73 + `preferencesToInterpreted` ~l.94-108)
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (import ~l.6-10 ; bloc critères ~l.682-709)

- [ ] **Step 1 : Éclater les maps dans `comparateur-labels.ts`**

Remplacer tout le bloc `PREFERENCE_INTERPRETATIONS` (du commentaire « Interprétations visibles » l.38 jusqu'à la fin de l'objet l.73) par :

```ts
// N2 — glose positive affichée au survol/tap de la puce (cf. ChipTooltip). Courte,
// orientée compréhension du SENS du critère, jamais de négation. null = puce nue
// (le libellé suffit, anti-bloat). Pur affichage, aucun impact sur le score.
export const PREFERENCE_TOOLTIP: Record<string, string | null> = {
  vie_etudiante: "Présence d'établissements d'enseignement supérieur et d'une population étudiante active.",
  acces_transports: "Présence et fréquentation des gares à proximité.",
  faible_dependance_auto: "Part des trajets domicile-travail faits autrement qu'en voiture.",
  cadre_calme: "Environnement peu dense, propice à un rythme plus calme.",
  douceur_climat: "Hivers tempérés, étés sans excès.",
  ensoleillement_recherche: "Plus chaud et plus sec.",
  proximite_mer: "Accès rapide à la côte.",
  eviter_isolement: "Présence d'un bassin de vie offrant services et activités du quotidien.",
  nature: "Forêts, prairies et milieux naturels autour.",
  acces_culture: "Présence d'équipements culturels à proximité.",
  acces_ecoles: "Collèges et lycées accessibles alentour.",
  eviter_grandes_villes: "Taille de l'agglomération (unité urbaine).",
  prefere_grande_ville: "Taille de l'agglomération (unité urbaine).",
  faible_risque_inondation: "Historique d'inondations observé sur le territoire.",
  faible_precip_extremes: "Pluies intenses projetées par le climat.",
  // self-évidents (le libellé = la mesure) : pas de bulle
  faible_chaleur: null,
  faible_secheresse: null,
  faible_risque_feu: null,
  air_sain: null,
  acces_soins: null,
  acces_services: null,
  faible_pression_agricole: null,
  viabilite_emploi: null,
};

// N3 — limite de périmètre, affichée dans le panneau repliable « Ce que ces critères
// mesurent ». Formulée en POSITIF (« mesure X, sans évaluer Y »), jamais en « pas… ».
// null = pas de caveat (pas de ligne N3). Les caveats hors-mesure plus larges (qualité
// des écoles/culture côté facette non mesurée) restent au gate (HORS_MESURE_PHRASES).
export const PREFERENCE_CAVEAT: Record<string, string | null> = {
  vie_etudiante: "mesure la présence d'établissements et d'étudiants, sans évaluer les formations",
  acces_transports: "mesure la présence et la fréquentation des gares, sans détailler horaires ni correspondances",
  faible_dependance_auto: "mesure les habitudes de déplacement du territoire",
  nature: "mesure le couvert naturel dans les environs de la commune",
  acces_culture: "mesure la présence d'équipements culturels, sans évaluer l'activité culturelle locale",
  acces_ecoles: "mesure l'accès aux collèges et lycées, sans évaluer la qualité des établissements",
  eviter_grandes_villes: "mesure la taille de l'agglomération entière (unité urbaine)",
  prefere_grande_ville: "mesure la taille de l'agglomération entière (unité urbaine)",
  faible_risque_inondation: "mesure l'historique d'inondations observé, sans préjuger des crues futures",
  faible_precip_extremes: "mesure les pluies intenses projetées, distinctes du risque d'inondation réel",
};
```

- [ ] **Step 2 : Mettre à jour `preferencesToInterpreted`**

Remplacer la fonction `preferencesToInterpreted` (l.93-108, du commentaire « Variante portant l'interprétation » à la fin) par :

```ts
// Variante portant l'interprétation pour le bloc critères : libellé + glose positive N2
// (tooltip) + limite de périmètre N3 (caveat), sans doublon de libellé.
export function preferencesToInterpreted(
  preferences: { key: string }[] | null | undefined,
): { label: string; tooltip: string | null; caveat: string | null }[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: { label: string; tooltip: string | null; caveat: string | null }[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push({
        label,
        tooltip: PREFERENCE_TOOLTIP[p.key] ?? null,
        caveat: PREFERENCE_CAVEAT[p.key] ?? null,
      });
    }
  }
  return out;
}
```

- [ ] **Step 3 : Importer `ChipTooltip` dans `OuVivreClient`**

Après l'import `geo-zones` (l.11), ajouter :

```tsx
import { ChipTooltip } from "@/components/ChipTooltip";
```

- [ ] **Step 4 : Réécrire le bloc « critères identifiés »**

Remplacer le bloc complet (du commentaire `{/* Les critères identifiés */}` l.682 à sa `)}` fermante l.710) par :

```tsx
          {/* Les critères identifiés */}
          {criteres.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-emerald-400">✓</span> Les critères identifiés
              </p>
              {/* N1 : puces seules. N2 : une puce à nuance porte un soulignement
                  pointillé + bulle positive au survol/tap (ChipTooltip) ; les évidentes
                  restent nues. Pur affichage, aucun impact sur le score. */}
              <div className="flex flex-wrap gap-2">
                {criteres.map((c) =>
                  c.tooltip ? (
                    <ChipTooltip key={c.label} label={c.label} text={c.tooltip} />
                  ) : (
                    <span
                      key={c.label}
                      className="text-[12px] text-label/90 border border-white/[0.12] rounded-full px-3 py-1"
                    >
                      {c.label}
                    </span>
                  ),
                )}
              </div>
              {/* N3 : aide secondaire repliée (limites de périmètre), fermée par défaut.
                  N'apparaît que si au moins un critère demandé porte un caveat. */}
              {criteres.some((c) => c.caveat) && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer list-none font-mono text-[10px] tracking-[0.14em] uppercase text-ghost hover:text-label/70 transition-colors">
                    <span className="text-accent/60 group-open:hidden">+ </span>
                    <span className="hidden group-open:inline text-accent/60">– </span>
                    Ce que ces critères mesurent
                  </summary>
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {criteres
                      .filter((c) => c.caveat)
                      .map((c) => (
                        <li key={c.label} className="text-[12.5px] leading-snug text-label/55">
                          <span className="text-label/80">{c.label}</span> : {c.caveat}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          )}
```

- [ ] **Step 5 : Vérifier la compilation + lint**

Run: `npx tsc --noEmit`
Expected : clean (le consommateur utilise désormais `c.tooltip`/`c.caveat`, plus `c.gloss`).

Run: `npm run lint 2>&1 | grep -iE "comparateur-labels|OuVivreClient"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 6 : Contrôle visuel sur le dev (port 3000)**

Ouvrir `/ou-vivre`, lancer une recherche multi-critères, ex :
« je cherche une ville étudiante au calme, près de la mer, avec un bon accès au train ».
Vérifier de visu :
- **N1** : les puces (« une ville étudiante », « un cadre calme », « la proximité de la mer », « l'accès au train et aux gares ») s'affichent **sans** ligne de glose permanente dessous.
- **N2** : « une ville étudiante », « un cadre calme », « l'accès au train et aux gares » portent un **soulignement pointillé** ; au survol (desktop) et au tap (mobile), une **bulle positive** s'ouvre ; une puce self-évidente (ex « des étés plus frais » si demandée) n'a ni pointillé ni bulle.
- **N3** : sous les puces, le panneau « Ce que ces critères mesurent » est **fermé** par défaut ; déplié, il liste les caveats des seuls critères demandés qui en ont un (ville étudiante, accès au train…).

- [ ] **Step 7 : Commit**

```bash
git add src/lib/comparateur-labels.ts src/app/\(public\)/ou-vivre/OuVivreClient.tsx
git commit -m "feat(ou-vivre): hierarchie criteres (puces N1 / tooltip positif N2 / panneau N3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Vérification finale + intégration

**Files:** aucun (vérification) puis mémoire.

- [ ] **Step 1 : Pas de référence résiduelle à l'ancien champ**

```bash
grep -rn "PREFERENCE_INTERPRETATIONS\|\.gloss\b" src/; echo "exit:$? (exit 1 = aucune occurrence, attendu)"
```
Expected : aucune occurrence (exit 1) — l'ancien nom et le champ `gloss` ont disparu.

- [ ] **Step 2 : Non-régression AskFuture**

`preferencesToLabels` est inchangé : les libellés humains partent toujours vers AskFuture. Vérifier qu'aucun appel n'a été touché :

```bash
grep -n "preferencesToLabels" src/app/\(public\)/ou-vivre/OuVivreClient.tsx
```
Expected : l'appel `criteres: preferencesToLabels(parsed.preferences)` (~l.424) est intact.

- [ ] **Step 3 : Lint global sur les fichiers touchés**

```bash
npm run lint 2>&1 | grep -iE "ChipTooltip|comparateur-labels|OuVivreClient"; echo "exit:$?"
```
Expected : aucune ligne (exit 1).

- [ ] **Step 4 : git status + log**

```bash
git status --short; git log --oneline -4
```
Expected : working tree propre, 2 commits feature + le commit de spec.

- [ ] **Step 5 : finishing-a-development-branch**

Invoquer `superpowers:finishing-a-development-branch`, présenter les options. Sur « push sur main » du porteur :

```bash
git checkout main && git merge --ff-only feat/hierarchie-criteres && git push origin main && git branch -d feat/hierarchie-criteres
```

- [ ] **Step 6 : Mémoire (après merge)**

Mettre à jour [[feedback_tooltip_no_sources]] : ajouter la doctrine de hiérarchie (N1 puce / N2 tooltip positif quand il y a une nuance / N3 panneau « Ce que ces critères mesurent » pour les limites de périmètre, formulées en positif jamais en « pas… »). Pas de nouvelle entrée roadmap (chantier d'UX hors des 6 modules).

---

## Self-review (couverture spec)

- N1 puces nues, suppression glose permanente → Task 2 Step 4.
- N2 puce soulignée pointillé + bulle positive, réutilise MetricTooltip → Task 1 + Task 2 Step 4.
- N2 seulement sur puces à nuance, évidentes nues → Task 2 Step 1 (`null`) + Step 4 (branche `c.tooltip ?`).
- N3 panneau `<details>` « Ce que ces critères mesurent », fermé, conditionnel → Task 2 Step 4.
- Éclatement en `PREFERENCE_TOOLTIP` / `PREFERENCE_CAVEAT`, suppression `PREFERENCE_INTERPRETATIONS` → Task 2 Step 1 + Task 3 Step 1.
- `preferencesToInterpreted` renvoie `{label, tooltip, caveat}` → Task 2 Step 2.
- Contenu (table spec, 5 recalages porteur) → Task 2 Step 1 (valeurs exactes).
- `preferencesToLabels` / AskFuture inchangés → Task 3 Step 2.
- Hors-périmètre (gate, prompts, cartes, MetricTooltip, moteur) → aucune tâche ne les touche.

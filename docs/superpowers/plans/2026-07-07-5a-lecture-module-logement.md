# 5a — La lecture du module Logement · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réordonner le module Logement en 5 beats de lecture (identité → synthèse → preuves en 2 familles → autour → à vérifier), et remplacer l'implication Face 2 par une checklist déterministe globale par projet.

**Architecture:** Le gros du travail est un ré-ordonnancement du JSX de composition dans `LogementModule.tsx` (les faces sont déjà des composants extraits). Une nouvelle lib pure `logement-checklist.ts` (testée `node --test`) produit les points « À vérifier » à partir des faits déjà montrés × le projet ; un composant `DecisionChecklist.tsx` la rend. Quelques retouches de copie et de registre visuel (passeport compacté, « Risques du bâti » dé-dramatisé, sinistralité cadrée, hero/intro nettoyés).

**Tech Stack:** Next.js (App Router, version à breaking changes — lire `node_modules/next/dist/docs/` au besoin), React, TypeScript, styles inline `var(--token)`, tests `node --test` sur `.ts` (imports `.ts` explicites).

## Global Constraints

- **Doctrine gravée** : la synthèse décrit le LOGEMENT (posture-neutre) ; la checklist « À vérifier » décrit la RELATION (personne × projet). La personnalisation par projet vit UNIQUEMENT dans la checklist.
- **Voix** : vouvoiement ; **jamais de tiret cadratin** (virgule/deux-points) ; **jamais d'antithèse d'emphase** (« ce n'est pas X, c'est Y ») ; pas de tournures d'IA ; partir du lecteur, jamais de l'offre en sujet ; ne jamais nommer une quantité de contenu.
- **Checklist** : verbes de vérification (vérifier/demander/documenter/comparer/obtenir les pièces) ; **jamais les euros**, jamais « vous devriez », jamais un futur prédit, toujours l'échelle ; **zéro compteur**, **jamais de coche verte / croix rouge**.
- **Jamais** de score/verdict global (ADR-0001), jamais de prédiction (assurance/valeur/température vécue).
- **Séparateurs de famille** : un rang au-dessus des eyebrows, discrets (label mono `--fg-4` + filet fin, **sans puce**, jamais la puce `ReportSection`, jamais de couleur).
- Vérif fin de chaque tâche touchant du `.ts`/`.tsx` : `npx tsc --noEmit` + `npx eslint <fichiers>` ; les libs testées via `node --test`.
- Hors périmètre 5a : rehydratation (5b), persistance des faits serveur, fusion des blocs d'exposition, synthèse adressée au projet.

---

### Task 1: Lib pure `logement-checklist.ts`

**Files:**
- Create: `src/lib/logement-checklist.ts`
- Test: `src/lib/logement-checklist.test.ts`

**Interfaces:**
- Produces:
  - `type Bucket = "neutre" | "achat" | "reside" | "location"`
  - `type ChecklistFacts = { dpe: "passoire" | "energivore" | "correct" | "absent"; confortEteInsuffisant: boolean; expositionBati: boolean; zoneReglementee: boolean; sinistraliteActive: boolean }`
  - `type ChecklistItem = { id: string; text: string }`
  - `energyState(etiquette: string | null): "passoire" | "energivore" | "correct" | "absent"`
  - `projetBucket(projet: string | null): Bucket`
  - `buildDecisionChecklist(facts: ChecklistFacts, projet: string | null): ChecklistItem[]`
  - `checklistIntro(projet: string | null): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/logement-checklist.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  energyState, projetBucket, buildDecisionChecklist, checklistIntro, type ChecklistFacts,
} from "./logement-checklist.ts";

const NONE: ChecklistFacts = {
  dpe: "correct", confortEteInsuffisant: false, expositionBati: false,
  zoneReglementee: false, sinistraliteActive: false,
};

test("energyState mappe les étiquettes", () => {
  assert.equal(energyState("G"), "passoire");
  assert.equal(energyState("f"), "passoire");
  assert.equal(energyState("E"), "energivore");
  assert.equal(energyState("C"), "correct");
  assert.equal(energyState(null), "absent");
});

test("projetBucket : achat/reside/location connus, autre et null -> neutre", () => {
  assert.equal(projetBucket("achat"), "achat");
  assert.equal(projetBucket("reside"), "reside");
  assert.equal(projetBucket("location"), "location");
  assert.equal(projetBucket("autre"), "neutre");
  assert.equal(projetBucket(null), "neutre");
});

test("aucun fait saillant -> checklist vide", () => {
  assert.deepEqual(buildDecisionChecklist(NONE, "achat"), []);
});

test("un item par face déclenchée, dans l'ordre des preuves", () => {
  const all: ChecklistFacts = {
    dpe: "passoire", confortEteInsuffisant: true, expositionBati: true,
    zoneReglementee: true, sinistraliteActive: true,
  };
  const ids = buildDecisionChecklist(all, "achat").map((i) => i.id);
  assert.deepEqual(ids, ["energie", "confort", "bati", "reglementaire", "sinistralite"]);
});

test("le texte change avec le projet ; autre == neutre", () => {
  const f: ChecklistFacts = { ...NONE, zoneReglementee: true };
  const achat = buildDecisionChecklist(f, "achat")[0].text;
  const reside = buildDecisionChecklist(f, "reside")[0].text;
  const neutre = buildDecisionChecklist(f, null)[0].text;
  const autre = buildDecisionChecklist(f, "autre")[0].text;
  assert.notEqual(achat, reside);
  assert.notEqual(achat, neutre);
  assert.equal(autre, neutre);
});

test("dpe correct ou absent -> pas d'item énergie", () => {
  assert.equal(buildDecisionChecklist({ ...NONE, dpe: "correct" }, "achat").length, 0);
  assert.equal(buildDecisionChecklist({ ...NONE, dpe: "absent" }, "achat").length, 0);
});

test("checklistIntro distingue neutre et projet choisi", () => {
  assert.notEqual(checklistIntro(null), checklistIntro("achat"));
  assert.equal(checklistIntro("autre"), checklistIntro(null));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/logement-checklist.test.ts`
Expected: FAIL (module `./logement-checklist.ts` introuvable).

- [ ] **Step 3: Write the implementation**

Create `src/lib/logement-checklist.ts`:

```ts
// « À vérifier avant de décider » (beat 5, spec 5a). Lib PURE : à partir des faits déjà montrés
// (état normalisé) et du PROJET, produit des points de vérification déterministes. La synthèse
// décrit le logement ; cette checklist décrit la RELATION (personne × projet). Extensible :
// ajouter un axe de personnalisation = ajouter une règle, jamais toucher au prompt IA.

export type Bucket = "neutre" | "achat" | "reside" | "location";

export type ChecklistFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent";
  confortEteInsuffisant: boolean;
  expositionBati: boolean; // RGA/argile à exposition notable
  zoneReglementee: boolean; // au moins un zonage PPRN au point
  sinistraliteActive: boolean; // un péril indemnisé lisible à l'échelle commune
};

export type ChecklistItem = { id: string; text: string };

export function energyState(etiquette: string | null): ChecklistFacts["dpe"] {
  if (!etiquette) return "absent";
  const e = etiquette.toUpperCase();
  if (e === "F" || e === "G") return "passoire";
  if (e === "E") return "energivore";
  return "correct";
}

export function projetBucket(projet: string | null): Bucket {
  return projet === "achat" ? "achat"
    : projet === "location" ? "location"
    : projet === "reside" ? "reside"
    : "neutre";
}

// Une règle par face. `active` gate sur le fait ; `text` porte la formulation par bucket.
// L'ordre du tableau = l'ordre des preuves (énergie -> chaleur -> bâti -> réglementaire -> sinistralité).
const RULES: { id: string; active: (f: ChecklistFacts) => boolean; text: Record<Bucket, string> }[] = [
  {
    id: "energie",
    active: (f) => f.dpe === "passoire" || f.dpe === "energivore",
    text: {
      neutre: "Vérifier le diagnostic énergétique complet et sa date.",
      achat: "Demandez le diagnostic énergétique complet et faites chiffrer les travaux d'amélioration avant de vous engager.",
      reside: "Conservez le diagnostic énergétique et documentez tout travail d'amélioration engagé.",
      location: "Demandez le diagnostic énergétique complet au bailleur et vérifiez sa date avant signature.",
    },
  },
  {
    id: "confort",
    active: (f) => f.confortEteInsuffisant,
    text: {
      neutre: "Se renseigner sur le confort du logement en période de forte chaleur.",
      achat: "Demandez comment le logement se comporte l'été et faites vérifier l'isolation et la ventilation.",
      reside: "Suivez le confort du logement lors des épisodes de chaleur et notez les pièces les plus exposées.",
      location: "Observez comment le logement se comporte l'été et demandez au bailleur les protections existantes.",
    },
  },
  {
    id: "bati",
    active: (f) => f.expositionBati,
    text: {
      neutre: "Regarder les signes visibles sur le bâti, l'exposition au retrait-gonflement des argiles étant relevée à cette adresse.",
      achat: "Demandez l'historique des fissures et des sinistres, et faites vérifier les fondations avant de vous engager.",
      reside: "Surveillez et photographiez d'éventuelles fissures dans le temps, et conservez les justificatifs de travaux.",
      location: "Observez l'état des murs et signalez au bailleur toute fissure apparente.",
    },
  },
  {
    id: "reglementaire",
    active: (f) => f.zoneReglementee,
    text: {
      neutre: "Lire le règlement de la zone, cette adresse relevant d'un plan de prévention.",
      achat: "Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension : lui seul dit ce qui est autorisé à cette adresse.",
      reside: "Vérifiez le règlement de la zone avant d'engager une extension ou une rénovation lourde.",
      location: "Demandez au bailleur si le logement est concerné par des prescriptions particulières.",
    },
  },
  {
    id: "sinistralite",
    active: (f) => f.sinistraliteActive,
    text: {
      neutre: "Garder en tête que les sinistres indemnisés sont lus à l'échelle de la commune, pas du logement.",
      achat: "Demandez au vendeur l'état des risques et l'historique des sinistres du bien : la commune en a connu, sans que cela concerne forcément ce logement.",
      reside: "Conservez les déclarations de sinistres et d'indemnisation : elles documentent l'exposition réelle du bien, au-delà de la statistique communale.",
      location: "Demandez au bailleur l'état des risques et signalez tout sinistre survenu pendant la location.",
    },
  },
];

export function buildDecisionChecklist(facts: ChecklistFacts, projet: string | null): ChecklistItem[] {
  const b = projetBucket(projet);
  return RULES.filter((r) => r.active(facts)).map((r) => ({ id: r.id, text: r.text[b] }));
}

export function checklistIntro(projet: string | null): string {
  return projetBucket(projet) === "neutre"
    ? "Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis."
    : "Voici les points que la lecture de ce logement fait remonter, à documenter selon votre projet.";
}
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `node --test src/lib/logement-checklist.test.ts`
Expected: PASS (7 tests).
Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logement-checklist.ts src/lib/logement-checklist.test.ts
git commit -m "feat(logement): lib checklist déterministe par projet (5a)"
```

---

### Task 2: Composant `DecisionChecklist`

**Files:**
- Create: `src/components/report/logement/DecisionChecklist.tsx`

**Interfaces:**
- Consumes: `buildDecisionChecklist`, `checklistIntro`, `type ChecklistFacts` (Task 1) ; `ReportSection`, `GlassCard` (`@/components/report/kit`).
- Produces: `DecisionChecklist({ facts, projet }: { facts: ChecklistFacts; projet: string | null })`.

- [ ] **Step 1: Write the component**

Create `src/components/report/logement/DecisionChecklist.tsx`:

```tsx
import { ReportSection, GlassCard } from "@/components/report/kit";
import { buildDecisionChecklist, checklistIntro, type ChecklistFacts } from "@/lib/logement-checklist";

// Beat 5 — « À vérifier avant de décider ». Sortie d'engagement du module : chaque point est un
// geste, jamais un champ. Aucun compteur, aucune coche verte / croix rouge (pas de score de
// complétude, ADR-0001). Toujours visible ; la version neutre s'affiche avant tout choix de projet.
export function DecisionChecklist({ facts, projet }: { facts: ChecklistFacts; projet: string | null }) {
  const items = buildDecisionChecklist(facts, projet);
  return (
    <ReportSection eyebrow="À vérifier avant de décider" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>{checklistIntro(projet)}</p>
          {items.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.65, margin: 0 }}>
              Cette lecture ne fait remonter aucun point particulier à vérifier pour ce logement.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {items.map((it) => (
                <li key={it.id} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  <span aria-hidden style={{ color: "var(--fg-4)", flexShrink: 0 }}>▸</span>
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
    </ReportSection>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` → no output.
Run: `npx eslint src/components/report/logement/DecisionChecklist.tsx` → no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/logement/DecisionChecklist.tsx
git commit -m "feat(logement): composant DecisionChecklist (beat 5, 5a)"
```

---

### Task 3: `FamilyHeading` (séparateur de sous-famille) dans kit

**Files:**
- Modify: `src/components/report/logement/kit.tsx`

**Interfaces:**
- Produces: `FamilyHeading({ children }: { children: React.ReactNode })`.

- [ ] **Step 1: Ajouter le composant**

À la fin de `src/components/report/logement/kit.tsx`, ajouter :

```tsx
// Séparateur de sous-famille (beat 3, spec 5a). Un rang AU-DESSUS des eyebrows de bloc, discret :
// label mono quiet + filet fin, SANS puce, jamais coloré. But : chunker les preuves, pas re-segmenter.
export function FamilyHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", whiteSpace: "nowrap" }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--border-1)" }} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` → no output.
Run: `npx eslint src/components/report/logement/kit.tsx` → no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/logement/kit.tsx
git commit -m "feat(logement): FamilyHeading séparateur de sous-famille (5a)"
```

---

### Task 4: Compacter le Passeport (beat 1)

**Files:**
- Modify: `src/components/report/logement/PropertyPassport.tsx`

- [ ] **Step 1: Couper les champs inertes + la caption DPE redondante**

Dans `PropertyPassport.tsx`, retirer les deux `fields.push` inertes. Remplacer :

```tsx
  if (altitude != null) fields.push({ label: "Altitude", value: `${altitude} m NGF` });
  if (address?.citycode) fields.push({ label: "Commune", value: `${address.city ?? ""} · INSEE ${address.citycode}` });
```

par (les deux lignes supprimées) :

```tsx
```

(Ne rien mettre : ces deux champs disparaissent. La ligne `if (parcel?.parcelCode) …` juste au-dessus reste le dernier `fields.push`.)

- [ ] **Step 2: Retirer la caption mono « DPE {lettre} », garder la phrase « Classé {lettre} »**

Remplacer :

```tsx
          <p className="text-right font-mono text-[9px] tracking-[0.1em] uppercase text-ghost/70">
            {dpeLetter ? `DPE ${dpeLetter}` : "DPE non trouvé"}
          </p>
```

par :

```tsx
          {!dpeLetter && (
            <p className="text-right font-mono text-[9px] tracking-[0.1em] uppercase text-ghost/70">DPE non trouvé</p>
          )}
```

(La phrase « Classé {dpeLetter} au diagnostic énergétique. » plus bas est CONSERVÉE : c'est la lecture en clair, identitaire.)

- [ ] **Step 3: `altitude` devient inutilisé — retirer la prop**

`altitude` n'est plus lu. Retirer de la signature et de la déstructuration. Remplacer l'en-tête de fonction :

```tsx
export function PropertyPassport({
  address,
  parcel,
  dpe,
  altitude,
}: {
  address: LogementReport["address"];
  parcel: LogementReport["parcel"];
  dpe: DpeRecord | null;
  altitude: LogementReport["altitude"];
}) {
```

par :

```tsx
export function PropertyPassport({
  address,
  parcel,
  dpe,
}: {
  address: LogementReport["address"];
  parcel: LogementReport["parcel"];
  dpe: DpeRecord | null;
}) {
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit`
Expected: UNE erreur attendue dans `LogementModule.tsx` (`altitude` passé en prop mais retiré) — sera corrigée en Task 8. Vérifier qu'il n'y a PAS d'autre erreur dans `PropertyPassport.tsx`.
Run: `npx eslint src/components/report/logement/PropertyPassport.tsx` → no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/logement/PropertyPassport.tsx
git commit -m "refactor(logement): passeport compacté — coupe altitude/commune/caption DPE (5a)"
```

(Le `tsc` rouge sur LogementModule est attendu et se résout en Task 8 ; les tâches 5-7 ne touchent pas ce couplage.)

---

### Task 5: Sinistralité cadrée comme contexte communal

**Files:**
- Modify: `src/components/report/logement/SinistraliteSection.tsx`

- [ ] **Step 1: Durcir la N1**

Remplacer :

```tsx
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
          Ce que les assureurs ont historiquement indemnisé dans la commune. Ces chiffres ne prédisent ni un sinistre pour ce logement, ni le prix de son assurance.
        </p>
```

par :

```tsx
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
          À l&apos;échelle de la commune, voici ce que les assureurs ont indemnisé par le passé. Ces montants ne disent rien de ce logement en particulier, ni du prix de son assurance.
        </p>
```

- [ ] **Step 2: Faire voyager l'échelle avec le chiffre**

Dans `PerilLine`, remplacer :

```tsx
          <Metric value={onrnLabel(ONRN_COUT_LABEL, state.cout)} caption="coût moyen d’un sinistre indemnisé" />
```

par :

```tsx
          <Metric value={onrnLabel(ONRN_COUT_LABEL, state.cout)} caption="coût moyen d’un sinistre indemnisé dans la commune" />
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` (l'erreur LogementModule de Task 4 reste, RAS ailleurs).
Run: `npx eslint src/components/report/logement/SinistraliteSection.tsx` → no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/logement/SinistraliteSection.tsx
git commit -m "refactor(logement): sinistralité cadrée contexte communal — N1 + échelle sur le chiffre (5a)"
```

---

### Task 6: Nettoyage `RegulatorySection` (tiret cadratin + phrase UI)

**Files:**
- Modify: `src/components/report/logement/RegulatorySection.tsx`

- [ ] **Step 1: Remplacer le tiret cadratin rendu à l'écran**

Dans `zoneLabel`, remplacer :

```tsx
  if (zoneCode && name) return `Zone ${zoneCode} — ${name}`;
```

par :

```tsx
  if (zoneCode && name) return `Zone ${zoneCode} : ${name}`;
```

- [ ] **Step 2: Couper la phrase qui décrit l'UI**

Remplacer :

```tsx
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                    Ces zonages peuvent concerner des phénomènes ou des règlements différents. Leur ordre sert la lecture.
                  </div>
```

par :

```tsx
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55 }}>
                    Ces zonages peuvent concerner des phénomènes ou des règlements différents.
                  </div>
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` (erreur LogementModule de Task 4 encore présente, RAS ailleurs).
Run: `npx eslint src/components/report/logement/RegulatorySection.tsx` → no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/logement/RegulatorySection.tsx
git commit -m "fix(logement): tiret cadratin zoneLabel + phrase UI retirée (5a)"
```

---

### Task 7: Relibeller la sonde projet

**Files:**
- Modify: `src/components/report/logement/ProjectProbe.tsx`

- [ ] **Step 1: Changer le libellé**

Remplacer :

```tsx
        Quel est votre projet sur ce logement ?
```

par :

```tsx
        Que comptez-vous faire de ce logement ?
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx eslint src/components/report/logement/ProjectProbe.tsx` → no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/logement/ProjectProbe.tsx
git commit -m "refactor(logement): sonde projet relibellée (5a)"
```

---

### Task 8: Intégration `LogementModule` — ré-ordonnancement aux 5 beats

**Files:**
- Modify: `src/components/report/LogementModule.tsx`
- Modify: `src/components/report/logement/RegulatorySection.tsx` (retirer `Face2Implication`)

**Interfaces:**
- Consumes: `DecisionChecklist` (Task 2), `FamilyHeading` (Task 3), `energyState` + `type ChecklistFacts` (Task 1).

- [ ] **Step 1: Supprimer `Face2Implication` de `RegulatorySection.tsx`**

Retirer entièrement la fonction exportée `Face2Implication` (le bloc `// « Ce que cela mérite de vérifier » …` jusqu'à sa `}` finale) ET son import devenu inutile. En tête de fichier, `POSTURE_FOR_PROJET` n'est plus utilisé que par `Face2Implication` : retirer aussi `import { POSTURE_FOR_PROJET } from "./posture";` et `import type { OnrnSinistralite } from "@/lib/onrn-sinistralite";` s'ils ne servent plus (les vérifier : `RegulatoryStatusBlock` ne les utilise pas).

Run après coup : `npx eslint src/components/report/logement/RegulatorySection.tsx` doit être vert (aucun import inutilisé).

- [ ] **Step 2: Mettre à jour les imports de `LogementModule.tsx`**

Remplacer :

```tsx
import { RegulatoryStatusBlock, Face2Implication } from "@/components/report/logement/RegulatorySection";
import { Face3Block } from "@/components/report/logement/AutourSection";
```

par :

```tsx
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { Face3Block } from "@/components/report/logement/AutourSection";
import { DecisionChecklist } from "@/components/report/logement/DecisionChecklist";
import { energyState, type ChecklistFacts } from "@/lib/logement-checklist";
```

Puis, sur la ligne d'import de `Block` existante, ajouter `FamilyHeading` (même module — NE PAS créer un second import du même chemin, eslint `no-duplicate-imports`). Remplacer :

```tsx
import { Block } from "@/components/report/logement/kit";
```

par :

```tsx
import { Block, FamilyHeading } from "@/components/report/logement/kit";
```

- [ ] **Step 3: Retirer `allRisks` (devenu inutilisé) et calculer `checklistFacts`**

Supprimer la ligne :

```tsx
  const allRisks = (georisques?.risks?.labels ?? []).filter((v, i, a) => a.indexOf(v) === i);
```

Juste après le calcul de `georisques` (et de `dpeYear`/`communeName`/`thermalEvidence`), ajouter :

```tsx
  // Faits normalisés pour la checklist « À vérifier » (beat 5). expositionBati gate sur une
  // exposition RGA notable (moyen/fort) pour ne pas se déclencher partout.
  const sini = result?.sinistralite ?? null;
  const checklistFacts: ChecklistFacts = {
    dpe: energyState(dpe?.etiquette_dpe ?? null),
    confortEteInsuffisant: thermalEvidence.indicator === "insuffisant",
    expositionBati: Boolean(georisques?.rga?.label && /moyen|fort|élev/i.test(georisques.rga.label)),
    zoneReglementee: (georisques?.regulatoryPlans?.length ?? 0) > 0,
    sinistraliteActive:
      sini != null &&
      [sini.secheresse.kind, sini.inondation.kind].some((k) => k === "lecture" || k === "faible_repr"),
  };
```

- [ ] **Step 4: Remplacer tout le bloc résultats par la composition en 5 beats**

Remplacer l'intégralité du bloc `{result && ( <section …> … </section> )}` (de la ligne `{/* ── RÉSULTATS ── */}` jusqu'à la `</section>` fermante qui précède le commentaire `{/* ═════ AGIR ═════ */}`) par :

```tsx
      {/* ── RÉSULTATS : lecture en 5 beats (spec 5a) ── */}
      {result && (
        <section style={{ padding: "24px 0 96px", display: "grid", gap: 40 }}>

          {/* Beat 1 — Identité : quel logement ? (passeport compacté, tilt conservé) */}
          <PropertyPassport
            address={result.address}
            parcel={result.parcel}
            dpe={dpe}
          />

          {/* Note informative si l'adresse est dans une commune ≠ résidence (commune débloquée, cf. 4.5). */}
          {defaultCommune && result.address?.city &&
            result.address.city.toLowerCase() !== defaultCommune.toLowerCase() && (
            <div style={{
              padding: "12px 16px",
              background: "var(--bg-elev)", border: "1px solid var(--border-1)",
              borderRadius: 10,
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65,
            }}>
              <strong style={{ color: "var(--fg-4)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Analyse d&apos;un bien à {result.address.city}
              </strong>
              <br />
              Cette analyse porte sur ce bien à <strong>{result.address.city}</strong>. Votre commune principale reste <strong>{defaultCommune}</strong>.
            </div>
          )}

          {/* Beat 2 — Synthèse : qu'est-ce que je retiens ? (posture-neutre) */}
          <LogementSynthesis
            ready={synthesisReady}
            data={synthesisData}
            logementId={result.address?.id ?? ""}
            insee={result.address?.citycode ?? ""}
          />

          {/* Beat 3 — Les preuves : pourquoi ? (2 sous-familles) */}
          <div style={{ display: "grid", gap: 36 }}>

            <FamilyHeading>Le logement lui-même</FamilyHeading>

            <EnergieSection
              dpeStatus={dpeStatus}
              dpe={dpe}
              dpeCandidates={dpeCandidates}
              audit={result.audit}
              onPick={(d) => { setSelectedDpe(d); setDpeStatus("confirmed"); void persistDpe("user_confirmed", d); }}
              onNotInList={() => { setSelectedDpe(null); setDpeStatus("rejected"); void persistDpe("not_in_list", null); }}
              onReselect={() => setDpeStatus("selection_required")}
            />

            <ThermalComfortSection
              evidence={thermalEvidence}
              communeName={communeName}
              dpeYear={dpeYear}
            />

            <FamilyHeading>Ce à quoi cette adresse est exposée</FamilyHeading>

            {/* Risques du bâti — registre sobre (dé-dramatisé) : plus de rouge, plus de chips
                « Risques référencés » (redondantes avec le réglementaire et les Block ci-dessous). */}
            {(georisques?.seismic?.label || georisques?.rga?.label) && (
              <ReportSection eyebrow="Risques du bâti">
                <GlassCard>
                  <div style={{ display: "grid", gap: 14 }}>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
                      Ce que les bases publiques recensent sur l&apos;exposition du bâti à cette adresse.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                      {georisques?.seismic?.label && <Block label="Sismicité" value={georisques.seismic.label} />}
                      {georisques?.rga?.label && <Block label="Retrait-gonflement des argiles" value={georisques.rga.label} sub="Gonflement puis rétraction des sols argileux, qui peut fissurer le bâti." />}
                    </div>
                  </div>
                </GlassCard>
              </ReportSection>
            )}

            {result.georisques && <RegulatoryStatusBlock georisques={result.georisques} />}

            {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} />}
          </div>

          {/* Beat 4 — Autour : qu'y a-t-il autour ? */}
          {autour && <Face3Block s={autour} />}

          {/* Beat 5 — À vérifier avant de décider : et moi, je fais quoi ? */}
          <div style={{ display: "grid", gap: 16 }}>
            <ProjectProbe
              answered={projet}
              onAnswer={(v) => {
                setProjet(v);
                posthog?.capture("logement_projet_declare", { projet: v, insee: result.address?.citycode ?? null });
                void requestAutour(result, POSTURE_FOR_PROJET[v] ?? "residence");
              }}
            />
            <DecisionChecklist facts={checklistFacts} projet={projet} />
          </div>

        </section>
      )}
```

- [ ] **Step 5: Réécrire le hero sub (ne pas énumérer le module)**

Remplacer :

```tsx
              Une adresse suffit. Vous y lisez la performance énergétique du bien, son exposition aux risques naturels, ce que les sinistres ont déjà coûté à assurer dans la commune, et ce qui entoure la porte.
```

par :

```tsx
              Une adresse suffit. Vous lisez ce qui pèse vraiment sur ce logement : sa performance énergétique, ce à quoi son adresse est exposée, et ce qui l&apos;entoure.
```

- [ ] **Step 6: Supprimer l'intro d'énumération de la 2ᵉ section**

Supprimer le paragraphe (doublon du hero) :

```tsx
            <p className="text-[15px] text-muted leading-[1.65] mt-3 max-w-[640px]">
              Entrez une adresse pour lire ce logement précis : sa performance énergétique, les risques du bâti, ce que le passé a coûté à assurer, et ce qui se trouve autour.
            </p>
```

(Retirer ce `<p>…</p>` en entier. Le titre `h2` « Analyser un logement précis. » juste au-dessus reste.)

- [ ] **Step 7: Typecheck + lint + build**

Run: `npx tsc --noEmit`
Expected: no output (l'erreur `altitude` de Task 4 est résolue, `Face2Implication`/`allRisks` supprimés proprement).
Run: `npx eslint src/components/report/LogementModule.tsx src/components/report/logement/RegulatorySection.tsx`
Expected: no output.
Run: `npm run build 2>&1 | grep -iE "Compiled successfully|Failed to compile|Type error"`
Expected: `✓ Compiled successfully`.

- [ ] **Step 8: Commit**

```bash
git add src/components/report/LogementModule.tsx src/components/report/logement/RegulatorySection.tsx
git commit -m "feat(logement): lecture en 5 beats — réordonnancement + familles + checklist + nettoyages (5a)"
```

---

### Task 9: Vérification finale + suite de tests complète

**Files:** aucun (vérification).

- [ ] **Step 1: Suite de tests libs**

Run: `node --test src/lib/*.test.ts 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: `fail 0`, `tests` ≥ ancien total + 7.

- [ ] **Step 2: Typecheck + build de bout en bout**

Run: `npx tsc --noEmit` → no output.
Run: `npm run build 2>&1 | grep -iE "Compiled successfully|Failed to compile"` → `✓ Compiled successfully`.

- [ ] **Step 3: Revue visuelle (session payante, à faire par le porteur avant merge)**

Checklist de contrôle (documenter le résultat, ne pas merger sans) :
1. Ordre des 5 beats : identité → synthèse → preuves (2 familles) → autour → à vérifier.
2. Passeport compacté (plus d'Altitude ni Commune/INSEE ni caption « DPE X »), phrase « Classé X » conservée, tilt 3D toujours là.
3. Séparateurs de famille discrets (pas de puce, pas de couleur).
4. « Risques du bâti » sobre (plus de rouge, plus de chips « Risques référencés »), gloss RGA visible.
5. Sinistralité lue comme contexte communal (N1 + « dans la commune » sur le chiffre).
6. Beat 5 : sonde relibellée, checklist neutre par défaut, qui se re-taille après un choix de projet ; état vide géré.
7. Hero sub réécrit, intro de 2ᵉ section supprimée, note inter-commune sans langage archi, plus de tiret cadratin dans les zones réglementaires.

## Notes de self-review (couverture spec)

- Beat 1 compact + tilt conservé → Task 4 (+ Task 8 supprime la prop `altitude` à l'appel).
- Beat 2 synthèse position 2 → Task 8.
- Beat 3 familles + ordre + dé-dramatisation Risques + sinistralité → Tasks 3, 5, 8.
- Beat 4 Autour → Task 8.
- Beat 5 sonde relibellée + checklist déterministe par projet (neutre par défaut, fact-gated, sans compteur/coche) → Tasks 1, 2, 7, 8.
- Suppression `Face2Implication` → Task 8.
- Nettoyages éditoriaux (hero, intro, note, « Leur ordre… », em-dash) → Tasks 6, 8.
- Hors périmètre (rehydratation, fusion exposition, persistance faits) : non traité, conforme à la spec.
```

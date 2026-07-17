# Prose du dossier : arbitrage nommé, condition remontée, preuves opposables, patron argiles+PPR

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les six défauts de prose du dossier « En une minute » validés sur le cas Toulouse (retour relecture du 2026-07-17), sans toucher aux garanties du déterministe.

**Architecture:** Tout passe par la table déterministe (`conclusion-plan.ts`), le registre de règles (`materiality-rules.ts`) et le registre de patrons de composition (`fact-compositions.ts`). Aucune liberté nouvelle donnée au LLM. Le rendu (`ConclusionBlock.tsx`) réaligne l'ordre des strates sur la hiérarchie que le plan documente déjà.

**Tech Stack:** TypeScript pur (`node --test`), Next.js App Router. Tests : `node --test src/lib/decision/*.test.ts src/lib/*.test.ts src/lib/climate/*.test.ts` ; `npx tsc --noEmit` = 0 ; `npm run build` vert.

## Global Constraints

- Jamais de tiret cadratin dans les copies ; jamais d'antithèse « c'est X, pas Y » comme emphase ; vouvoiement.
- Le verdict n'est JAMAIS généré (generable: false) ; aucune phrase ne promet un positif non prouvé (`hasFavorable`/`favorableCount`).
- Une composition se DÉCLARE (patron codé), elle ne se découvre pas ; les faits absorbés restent lisibles au dépliable.
- `node --test` : jamais value-importer `comparateur-vie.ts` depuis un fichier testé.
- Branche `feat/prose-conclusion-dossier`, un commit par tâche. Pas de push main sans demande.

---

### Task 1 : Verdict d'arbitrage : nommer le côté favorable prouvé

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts:217-227` (branche `arbitration`)
- Modify: `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance-design.md` (table §5, ligne arbitration)
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: `ConclusionPlanInput.hasFavorable`, `favorableCount`, `mismatchTotal`, `reservesShown` (existants).
- Produces: texte verdict `arbitration` en 3 variantes (favorableCount >= 2, === 1, hasFavorable false). Label reste « Arbitrage », tone `neutral`.

- [ ] **Step 1 : test qui échoue** : arbitration + favorableCount 2 → le texte contient « répond à plusieurs dimensions de votre projet » ET « nettement moins bien servie » ; arbitration + favorableCount 1 → « présente un élément favorable » ; arbitration + hasFavorable false → texte actuel inchangé.
- [ ] **Step 2 : run** `node --test src/lib/decision/conclusion-plan.test.ts` → FAIL.
- [ ] **Step 3 : implémentation** dans la branche arbitration :

```ts
if (input.orientation === "arbitration") {
  const m = input.mismatchTotal;
  const combien = m > 1 ? `${m} de vos priorités sont` : `une de vos priorités est`;
  const suite = input.reservesShown > 0
    ? ` ${input.reservesShown > 1 ? `${input.reservesShown} points restent` : "un point reste"} par ailleurs à vérifier.`
    : "";
  const ouverture = input.hasFavorable
    ? (input.favorableCount >= 2
        ? `${nom} répond à plusieurs dimensions de votre projet et aucune incompatibilité n'a été établie`
        : `${nom} présente un élément favorable pour votre projet et aucune incompatibilité n'a été établie`)
    : `Aucune incompatibilité n'a été établie sur ${nom}`;
  return {
    label: "Arbitrage", tone: "neutral",
    text: `${ouverture}, mais ${combien} nettement moins bien servie${m > 1 ? "s" : ""} qu'ailleurs. Cela appelle un arbitrage entre vos priorités, sans rendre ${nom} incompatible avec votre projet.${suite}`,
  };
}
```

- [ ] **Step 4 : run tests** → PASS (adapter les tests arbitration existants si leurs fixtures ont hasFavorable true).
- [ ] **Step 5 : spec** : reporter les 3 variantes dans la table §5 du spec 2.1. **Commit.**

### Task 2 : Strate d'attention : porter la relation « N parmi M »

**Files:**
- Modify: `src/lib/decision/conclusion-plan.ts:391-410` (branche `tied`)
- Test: `src/lib/decision/conclusion-plan.test.ts`

**Interfaces:**
- Consumes: `input.reservesShown` (total affiché, celui que le verdict annonce), `lead.facts.length`.
- Produces: fallback `tied` : si `reservesShown > n` → « Parmi ces {M} points, {N} pèsent le plus : {topics}. » ; sinon texte actuel. `allowedNumbers` = numberForms(n) ∪ numberForms(reservesShown).

- [ ] **Step 1 : test qui échoue** : 4 réserves affichées dont 3 au rang max → fallback commence par « Parmi ces quatre points, trois pèsent le plus : » ; allowedNumbers contient « 4 », « quatre », « 3 », « trois ». Cas égalité (3/3) → phrase actuelle inchangée.
- [ ] **Step 2 : run** → FAIL.
- [ ] **Step 3 : implémentation** :

```ts
} else if (lead.kind === "tied") {
  const n = lead.facts.length;
  const total = input.reservesShown;
  const sujets = joinFr(lead.facts.map((f) => f.topic));
  const fallbackText = total > n
    ? `Parmi ces ${numberForms(total)[1] ?? String(total)} points, ${numberForms(n)[1] ?? String(n)} pèsent le plus : ${sujets}.`
    : `${capitalize(numberForms(n)[1] ?? String(n))} points demandent votre attention : ${sujets}.`;
  blocks.push({
    key: "reserves_found",
    fallbackText,
    sourceIds: lead.facts.map((f) => f.factId),
    requiredPhrases: lead.facts.map((f) => coreLabel(f.topic)),
    allowedNumbers: total > n ? [...numberForms(n), ...numberForms(total)] : numberForms(n),
    maxChars: 340,
    generable: true,
  });
}
```

- [ ] **Step 4 : run tests** → PASS. **Step 5 : Commit.**

### Task 3 : Preuve inondation opposable (remplace 100/100)

**Files:**
- Modify: `src/lib/decision/materiality-rules.ts:95` (EvidenceRef de `ruleInondation`)
- Test: `src/lib/decision/materiality-rules.test.ts:69-78`

- [ ] **Step 1 : test qui échoue** : inondationRisque 80 + catnat 6 → `evidence[0].observedValue === "exposition élevée · 6 arrêtés CatNat depuis 1982"` ; catnat null → `"exposition élevée"`.
- [ ] **Step 2 : run** → FAIL.
- [ ] **Step 3 : implémentation** :

```ts
const observed = f.catnatInondation != null
  ? `exposition élevée · ${f.catnatInondation} arrêtés CatNat depuis 1982`
  : "exposition élevée";
const ev: EvidenceRef = { factId: "inondation.risque", module: "territoire", label: `Territoire · ${f.nom}`, observedValue: observed, grain: "commune", href: territoireHref };
```

- [ ] **Step 4 : run tests** → PASS. **Step 5 : Commit.**

### Task 4 : ConclusionBlock : condition non vérifiée remontée et renommée

**Files:**
- Modify: `src/components/report/ConclusionBlock.tsx:80-99`

- [ ] **Step 1 :** déplacer le bloc `limite` AVANT le bloc `poids` (juste sous le verdict, conformément à l'en-tête de conclusion-plan.ts) ; étiquette « Une condition reste à vérifier » (ajuster selon rapport design-critic s'il est arrivé). Aucun test node (composant) : `tsc` + build valident.
- [ ] **Step 2 : Commit.**

### Task 5 : Patron 3 : `clay_regulation_grouped` (argiles + PPR sécheresse, grain adresse)

**Files:**
- Modify: `src/lib/decision/fact-composition.ts` (type `GroupedVerificationComposition`, union)
- Modify: `src/lib/decision/fact-compositions.ts` (constructeur + registre + validateur)
- Modify: `src/lib/decision/decision-assembler.ts:102-130,146-148` (comptes + evidence)
- Modify: `src/lib/decision/conclusion-plan.ts:138-143` (selectLead : candidat)
- Modify: `src/components/report/FactCompositionCard.tsx` (variante items via SideBlock)
- Modify: `docs/superpowers/specs/2026-07-17-composition-faits-lies-design.md` (§5bis)
- Test: `src/lib/decision/fact-compositions.test.ts`, `decision-assembler.test.ts`, `conclusion-plan.test.ts`

**Interfaces:**
- Produces:

```ts
export type GroupedVerificationComposition = {
  id: string;
  kind: "grouped_verification";
  patternId: "clay_regulation_grouped";
  title: string;    // « Argiles et réglementation sécheresse »
  summary: string;
  items: CompositionSide[]; // réutilise la brique existante (statement/evidence/action/limitation)
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier; // max des tiers absorbés
  displaySection: "verifications";
};
```

- Gates (déclarés) : fait `logement:exposition-bati` présent (verification) ET fait `logement:zone-reglementee` présent ET `facts.logement.pprnLabel` matche `/sécheresse|argile|tassement/i`. Un PPR d'une autre nature (inondation…) ne compose JAMAIS : sujet décisionnel différent.
- Comptes assembleur : une composition groupée = UNE carte-réserve (`reservesShown`, `majorReserveCount`), evidence = `items.flatMap(i => i.evidence)`.
- selectLead : candidat comme le tradeoff (topic = title, statement = summary).

- [ ] **Step 1 : tests qui échouent** (fact-compositions.test.ts) : les deux faits + PPR « PPR Sécheresse - Territoire 1 » → composition 2 items, 2 absorbés, tier structuring ; PPR « PPRI Garonne » → null ; argiles seul → null. (decision-assembler.test.ts) : carte en section verifications, reservesShown compte 1. (conclusion-plan.test.ts) : composition groupée candidate au lead.
- [ ] **Step 2 : run** → FAIL. **Step 3 : implémentation** (types → constructeur → validateur → assembleur → selectLead → carte). **Step 4 : run + tsc** → PASS. **Step 5 : spec §5bis + Commit.**

### Task 6 : Passe éditoriale mismatch + chaleur (rapports agents)

**Files:**
- Read: `docs/rapports-agents/editorial-writer/2026-07-17-mismatch-chaleur.md`, `docs/rapports-agents/design-critic/2026-07-17-conclusion-block.md`
- Modify: `src/lib/decision/mismatch-facts.ts`, `src/lib/decision/materiality-rules.ts` (chaleur), éventuellement titre de section `decision-assembler.ts:91`
- Test: suites existantes des fichiers touchés

- [ ] **Step 1 :** lire les deux rapports sur disque. Appliquer ce qui est défendable dans les contraintes (gabarits déterministes, opposabilité, seuils de signalement conservés quelque part de visible). TDD par changement de gabarit.
- [ ] **Step 2 :** suites + tsc + build. **Commit.**

### Vérification finale

- [ ] `npx tsc --noEmit` = 0 ; suite complète verte ; `npm run build` vert.
- [ ] Sonde `node --env-file=.env.local scripts/probe-conclusion.ts` si l'environnement est disponible (le bloc tied généré a changé de fallback). Sinon le dire dans le handoff.

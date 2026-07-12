# Dossier de décision slice 1.5 (faits Logement) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (exécution inline). Steps en `- [ ]`.

**Goal:** Enrichir le dossier « En une minute » avec les faits Logement (DPE, RGA, PPRN, cavités, patrimoine, sinistralité) au grain adresse quand une analyse logement existe pour la commune active, via une augmentation serveur différée sous `<Suspense>`, sans ralentir le hub ni figer le statut réglementaire.

**Architecture:** Le cœur de `/api/georisques-logement` est extrait en lib serveur `fetchLogementReport`. `ModuleFacts` gagne un bloc `logement?` ; six règles Logement (rôle `verification` seulement) l'exploitent via LE MÊME `runRules`/assembleur. Le hub rend le dossier communal immédiatement ; un Server Component async streamé (fallback provisoire) charge le rapport FRAIS, réassemble en `commune+adresse`, et remplace toute la section. `try/catch` → `unavailable`.

**Tech Stack:** TypeScript, Next.js App Router (Server Components, Suspense), tests `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-12-dossier-logement-slice-1-5-design.md`.

## Global Constraints

- **Aucune règle Logement n'émet `incompatibility`** (arbitrage porteur). Rôle `verification` (ou `unknown` scopée).
- **Bloc `logement` absent → dossier communal STRICTEMENT inchangé** (mêmes faits/état qu'au slice 1).
- **Statut réglementaire FRAIS, jamais snapshoté.** Le DPE (persisté) est un fait distinct.
- **Une panne ne devient jamais un signal d'absence de risque** : une source absente n'émet rien ; l'échec du rapport → `logementStatus: "unavailable"` + note, jamais silence.
- **Fallback `pending` explicitement provisoire** ; la section entière est remplacée après résolution (pas d'ajout de carte sous une conclusion déjà lue).
- Conventions : imports `.ts` en lib, `@/` en composant/page. FR sans tiret cadratin, sans antithèse « X, pas Y ».
- Piège `server-only` : `fetchLogementReport` (server lib) et `DossierAvecLogement` ne sont pas node-testés ; l'adaptateur `logement-facts.ts` et les règles `logement-rules.ts` restent purs (type-only comparateur + value-import `energyState` de `logement-checklist.ts`, qui est pur).

**Vérif :** `npx tsc --noEmit` · `node --test src/lib/decision/*.test.ts` · `npm run build`.

---

## Task 1: Extraire `fetchLogementReport` en lib serveur

**Files:**
- Create: `src/lib/server/georisques-logement.ts`
- Modify: `src/app/api/georisques-logement/route.ts`

**Interfaces produced:** `ResolvedAddress`, `fetchLogementReport(address, banFeatureType): Promise<LogementReport>`, `fetchLogementReportWithTimeout(address, banFeatureType, ms?): Promise<LogementReport>`.

- [ ] **Step 1: Créer la lib**

Create `src/lib/server/georisques-logement.ts`. Déplacer VERBATIM le corps de `buildReport` de la route (lignes 34-122), en le renommant `fetchLogementReport`, en **retournant l'objet `report`** (pas `NextResponse.json`), avec ses imports. Ajouter le type `ResolvedAddress` et le wrapper timeout :

```ts
// Cœur serveur partagé : construit le LogementReport à partir d'une adresse résolue. Utilisé par
// la route /api/georisques-logement (client) ET par le dossier de décision (slice 1.5), sans détour
// HTTP interne. Statut réglementaire FRAIS à chaque appel (aucun cache Next : à vérifier Step 3).
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import {
  getGeorisquesAddressSummary, getGeorisquesParcelSummary, getGeorisquesSummary,
  fetchCavitesNearPoint, fetchMvtNearPoint,
} from "@/lib/georisques";
import { buildPointHazards, communalResidualFromLabels, isMvtFlagged } from "@/lib/point-hazards";
import { getAltitude } from "@/lib/ign";
import { fetchHeritageProtections } from "@/lib/gpu";
import { getDpeCandidatesByBanId, getDpeByCoordinates } from "@/lib/dpe";
import { getZfeForPoint } from "@/lib/zfe";
import { getIrepNearPoint } from "@/lib/irep";
import { getAuditByBanId, getAuditByCoordinates } from "@/lib/audit";
import { getCartofrichesForCommune } from "@/lib/cartofriches";
import { getCommuneFullData } from "@/lib/commune-data";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";
import type { LogementReport } from "@/lib/logement-report-types";

export type ResolvedAddress = {
  id: string | null; label: string; city: string | null; citycode: string | null;
  postcode: string | null; latitude: number; longitude: number;
};

export async function fetchLogementReport(address: ResolvedAddress, banFeatureType: string | null): Promise<LogementReport> {
  // ⟵ COLLER ICI le corps de buildReport (route lignes 35-122), mais `return report;` à la fin
  //    (au lieu de `return NextResponse.json(report, { headers: … })`).
  //    Ne rien changer d'autre à la logique de fetch.
}

// Protège le hub : un dépassement REJETTE (capté par le try/catch de l'augmentation -> "unavailable").
export function fetchLogementReportWithTimeout(address: ResolvedAddress, banFeatureType: string | null, ms = 4000): Promise<LogementReport> {
  return Promise.race([
    fetchLogementReport(address, banFeatureType),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("logement-report-timeout")), ms)),
  ]);
}
```

- [ ] **Step 2: La route importe la lib**

Dans `src/app/api/georisques-logement/route.ts` : retirer `buildReport` local + les imports désormais dans la lib (garder ceux encore utilisés par la route : `getCurrentUserAccount`, `canAccessCompleteReport`, `canAnalyzeCommune`, `validateSelectedBanAddress`, `requireCurrentUser`, `NextResponse`). Ajouter :

```ts
import { fetchLogementReport, type ResolvedAddress } from "@/lib/server/georisques-logement";
```

Dans `POST`, remplacer `return await buildReport(address, sel.type);` par :

```ts
    const report = await fetchLogementReport(address, sel.type);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
```

- [ ] **Step 3: Fraîcheur du cache**

Vérifier que les fetchers externes appelés dans `fetchLogementReport` n'utilisent pas le data-cache Next (pas de `next: { revalidate }`, pas de `cache: "force-cache"`). `grep -rn "revalidate\|force-cache" src/lib/{georisques,gpu,onrn-sinistralite}.ts`. Si un cache est posé sur du réglementaire, ajouter `cache: "no-store"`. Sinon (défaut Next = non caché), ne rien changer et le noter.

- [ ] **Step 4: Typecheck + build + commit**

`npx tsc --noEmit` (exit 0). `npm run build` (route compile, « ✓ Compiled successfully »).

```bash
git add src/lib/server/georisques-logement.ts "src/app/api/georisques-logement/route.ts"
git commit -m "refactor(logement): extrait fetchLogementReport en lib serveur partagée

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `LogementFacts` + adaptateur `buildLogementFacts`

**Files:**
- Modify: `src/lib/decision/decision-fact.ts` (types)
- Create: `src/lib/decision/logement-facts.ts`
- Create: `src/lib/decision/logement-facts.test.ts`

**Interfaces produced:** `LogementFacts`, `ModuleFacts.logement?`, `buildLogementFacts(report, savedDpe, project): LogementFacts`.

- [ ] **Step 1: Types dans `decision-fact.ts`**

Ajouter, avant `ModuleFacts` :

```ts
export type LogementFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent"; // du DPE SAUVEGARDÉ (fait persisté distinct)
  dpeLabel: string | null; // l'étiquette exacte (F/G/E…) pour la preuve
  expositionBati: boolean; // RGA/argile exposition notable (moyen/fort)
  zoneReglementee: boolean; // >= 1 zonage PPRN au point
  sinistraliteActive: boolean; // péril indemnisé lisible à l'échelle commune
  caviteProche: boolean; // >= 1 cavité recensée à moins de 500 m
  perimetrePatrimonial: boolean; // AC1/AC2/AC4 au point (ABF)
  addressLabel: string; // pour la preuve (grain "adresse")
};
```

et le champ optionnel dans `ModuleFacts` :

```ts
  hasAddress: boolean;
  logement?: LogementFacts; // slice 1.5 : présent seulement quand une analyse adresse est là
};
```

- [ ] **Step 2: Test de l'adaptateur (échoue)**

Create `src/lib/decision/logement-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildLogementFacts } from "./logement-facts.ts";
import type { LogementReport } from "../logement-report-types.ts";
import type { DpeRecord } from "../dpe.ts";
import type { UserProject } from "../user-project.ts";

const project = { posture: "recherche", intent: null, rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] }, updatedAt: null } as unknown as UserProject;

function report(over: Partial<LogementReport> = {}): LogementReport {
  return { address: { id: null, label: "7 Rue du Taur 31000 Toulouse", city: "Toulouse", citycode: "31555", postcode: "31000", latitude: 43.6, longitude: 1.44 }, ...(over as LogementReport) };
}

test("buildLogementFacts : DPE depuis l'artefact sauvegardé + label", () => {
  const dpe = { etiquette_dpe: "G" } as DpeRecord;
  const f = buildLogementFacts(report(), dpe, project);
  assert.equal(f.dpe, "passoire");
  assert.equal(f.dpeLabel, "G");
  assert.equal(f.addressLabel, "7 Rue du Taur 31000 Toulouse");
});

test("buildLogementFacts : RGA moyen -> expositionBati, PPRN -> zoneReglementee", () => {
  const f = buildLogementFacts(report({
    georisques: { address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [{} as never], rga: { code: "2", label: "Aléa moyen" }, seismic: null } },
  } as unknown as Partial<LogementReport>), null, project);
  assert.equal(f.expositionBati, true);
  assert.equal(f.zoneReglementee, true);
  assert.equal(f.dpe, "absent");
});

test("buildLogementFacts : cavités + patrimoine", () => {
  const f = buildLogementFacts(report({
    pointHazards: { cavites: { count: 2 } } as never,
    heritage: { items: [{}], sourceStatus: "available" } as never,
  } as unknown as Partial<LogementReport>), null, project);
  assert.equal(f.caviteProche, true);
  assert.equal(f.perimetrePatrimonial, true);
});

test("buildLogementFacts : sources absentes -> tout false (jamais 'aucun risque' fabriqué ici)", () => {
  const f = buildLogementFacts(report(), null, project);
  assert.equal(f.expositionBati, false);
  assert.equal(f.zoneReglementee, false);
  assert.equal(f.caviteProche, false);
  assert.equal(f.perimetrePatrimonial, false);
  assert.equal(f.sinistraliteActive, false);
});
```

- [ ] **Step 3: Lancer, vérifier l'échec** — `node --test src/lib/decision/logement-facts.test.ts` → FAIL.

- [ ] **Step 4: Écrire l'adaptateur**

Create `src/lib/decision/logement-facts.ts` :

```ts
// Adaptateur PUR : LogementReport (frais) + DPE sauvegardé + projet -> LogementFacts. Généralise la
// construction des ChecklistFacts de LogementModule.tsx. Imports type-only (LogementReport, DpeRecord,
// UserProject) + value-import energyState de logement-checklist.ts (pur), donc node-testable.
import { energyState } from "../logement-checklist.ts";
import type { LogementReport } from "../logement-report-types.ts";
import type { DpeRecord } from "../dpe.ts";
import type { UserProject } from "../user-project.ts";
import type { LogementFacts } from "./decision-fact.ts";

export function buildLogementFacts(report: LogementReport, savedDpe: DpeRecord | null, _project: UserProject): LogementFacts {
  const g = report.georisques?.parcel ?? report.georisques?.address ?? null;
  const rgaLabel = g?.rga?.label ?? null;
  const sini = report.sinistralite ?? null;
  return {
    dpe: energyState(savedDpe?.etiquette_dpe ?? null),
    dpeLabel: savedDpe?.etiquette_dpe ?? null,
    expositionBati: Boolean(rgaLabel && /moyen|fort|élev/i.test(rgaLabel)),
    zoneReglementee: (g?.regulatoryPlans?.length ?? 0) > 0,
    sinistraliteActive:
      sini != null &&
      [sini.secheresse.kind, sini.inondation.kind].some((k) => k === "lecture" || k === "faible_repr"),
    caviteProche: (report.pointHazards?.cavites?.count ?? 0) > 0,
    perimetrePatrimonial: (report.heritage?.items?.length ?? 0) > 0,
    addressLabel: report.address?.label ?? "cette adresse",
  };
}
```

- [ ] **Step 5: Lancer, succès + typecheck + commit**

`node --test src/lib/decision/logement-facts.test.ts` → PASS (4). `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/decision-fact.ts src/lib/decision/logement-facts.ts src/lib/decision/logement-facts.test.ts
git commit -m "feat(decision): LogementFacts + adaptateur (DPE persisté + rapport frais)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Les six règles Logement (rôle verification)

**Files:**
- Create: `src/lib/decision/logement-rules.ts`
- Create: `src/lib/decision/logement-rules.test.ts`
- Modify: `src/lib/decision/materiality-rules.ts` (ajoute les règles au `REGISTRY`)

**Interfaces produced:** `LOGEMENT_RULES: DecisionRule[]` ajoutées au `REGISTRY`.

- [ ] **Step 1: Tests (échoue)**

Create `src/lib/decision/logement-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts, LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function lf(over: Partial<LogementFacts> = {}): LogementFacts {
  return { dpe: "correct", dpeLabel: null, expositionBati: false, zoneReglementee: false, sinistraliteActive: false, caviteProche: false, perimetrePatrimonial: false, addressLabel: "7 Rue du Taur", ...over };
}
function facts(logement?: LogementFacts): ModuleFacts {
  return { insee: "31555", nom: "Toulouse", distanceCoteKm: 150, population: 500000, altitude: 146, catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: true, logement };
}
function project(over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"], updatedAt: null, ...over };
}

test("bloc logement absent -> aucune règle Logement n'émet", () => {
  const r = runRules(facts(undefined), project());
  assert.equal(r.facts.some((f) => f.ruleId.startsWith("logement.")), false);
});

test("DPE passoire -> verification établie avec action et preuve grain adresse", () => {
  const r = runRules(facts(lf({ dpe: "passoire", dpeLabel: "G" })), project({ intent: "achat" }));
  const f = r.facts.find((x) => x.ruleId === "logement.dpe-faible");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].grain, "adresse");
  assert.ok(f.action.label.length > 0);
  assert.match(f.statement, /G/);
});

test("aucune règle Logement n'émet incompatibility (invariant)", () => {
  const r = runRules(facts(lf({ dpe: "passoire", expositionBati: true, zoneReglementee: true, caviteProche: true, perimetrePatrimonial: true, sinistraliteActive: true })), project({ intent: "achat" }));
  assert.equal(r.facts.some((f) => f.ruleId.startsWith("logement.") && f.role === "incompatibility"), false);
});

test("patrimoine : pas de fait en location", () => {
  const r = runRules(facts(lf({ perimetrePatrimonial: true })), project({ intent: "location" }));
  assert.equal(r.facts.some((x) => x.ruleId === "logement.patrimoine"), false);
});

test("texte posture-aware : achat parle de travaux, location de bailleur (exposition bâti)", () => {
  const achat = runRules(facts(lf({ expositionBati: true })), project({ intent: "achat" })).facts.find((x) => x.ruleId === "logement.exposition-bati");
  const loc = runRules(facts(lf({ expositionBati: true })), project({ intent: "location" })).facts.find((x) => x.ruleId === "logement.exposition-bati");
  assert.match(achat!.action.label, /fondation|sinistre|antécédent/i);
  assert.match(loc!.action.label, /bailleur/i);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL (`logement.` règles absentes).

- [ ] **Step 3: Écrire les règles**

Create `src/lib/decision/logement-rules.ts` :

```ts
// Règles Logement (slice 1.5). Gate sur facts.logement, rôle VERIFICATION seulement (jamais
// incompatibility : arbitrage porteur). Posture-aware. Chaque fait porte le constat établi (statement)
// et l'action (un fait établi n'est pas présenté comme incertain ; sa conséquence reste à faire).
import type { DecisionRule, VerificationFact, EvidenceRef, RuleEvaluation, MaterialityTier, LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

type Bucket = "neutre" | "achat" | "reside" | "location";
function bucket(p: UserProject): Bucket {
  if (p.intent === "achat") return "achat";
  if (p.intent === "location") return "location";
  if (p.posture === "habitant") return "reside";
  return "neutre";
}
function ev(l: LogementFacts, observedValue?: string): EvidenceRef {
  return { factId: "logement", module: "logement", label: l.addressLabel, observedValue, grain: "adresse", href: "/rapport/logement" };
}
function verif(id: string, l: LogementFacts, tier: MaterialityTier, statement: string, actionLabel: string, opts: { limitation?: string; observedValue?: string } = {}): VerificationFact {
  return {
    id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement",
    role: "verification", materialityTier: tier, statement, evidence: [ev(l, opts.observedValue)],
    action: { type: "obtenir_document", label: actionLabel }, ...(opts.limitation ? { limitation: opts.limitation } : {}),
  };
}
function na(id: string): RuleEvaluation {
  return { ruleId: `logement.${id}`, projectKeys: [], outcome: "not_applicable", facts: [], reason: "non applicable" };
}
function emit(id: string, fact: VerificationFact): RuleEvaluation {
  return { ruleId: `logement.${id}`, projectKeys: [], outcome: "verification", facts: [fact], reason: "fait logement" };
}

const dpeAction: Record<Bucket, string> = {
  achat: "Faites chiffrer les travaux d'amélioration avant de vous engager.",
  location: "Vérifiez la date du diagnostic et les charges auprès du bailleur avant signature.",
  reside: "Documentez les travaux d'amélioration engagés.",
  neutre: "Regardez le détail du diagnostic énergétique et sa date.",
};
const batiAction: Record<Bucket, string> = {
  achat: "Demandez l'historique des fissures et sinistres, faites vérifier les fondations.",
  location: "Signalez au bailleur toute fissure apparente.",
  reside: "Surveillez et photographiez d'éventuelles fissures dans le temps.",
  neutre: "Regardez les signes visibles sur le bâti.",
};
const pprnAction: Record<Bucket, string> = {
  achat: "Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension.",
  location: "Demandez au bailleur si le logement est concerné par des prescriptions particulières.",
  reside: "Vérifiez le règlement de la zone avant une extension ou une rénovation lourde.",
  neutre: "Lisez le règlement de la zone en mairie.",
};
const siniAction: Record<Bucket, string> = {
  achat: "Demandez l'état des risques et l'historique des sinistres du bien.",
  location: "Demandez au bailleur l'état des risques et signalez tout sinistre survenu.",
  reside: "Conservez les déclarations de sinistres et d'indemnisation du bien.",
  neutre: "Consultez l'état des risques de la commune.",
};

export const LOGEMENT_RULES: DecisionRule[] = [
  {
    id: "logement.dpe-faible", module: "logement",
    evaluate: (f, p) => {
      const l = f.logement;
      if (!l || (l.dpe !== "passoire" && l.dpe !== "energivore")) return na("dpe-faible");
      const cls = l.dpe === "passoire" ? "F ou G (passoire énergétique)" : "E (énergivore)";
      const stmt = l.dpeLabel ? `Le diagnostic choisi classe ce logement en ${l.dpeLabel}, ${cls}.` : `Le diagnostic choisi classe ce logement ${cls}.`;
      return emit("dpe-faible", verif("dpe-faible", l, "structuring", stmt, dpeAction[bucket(p)], { observedValue: l.dpeLabel ? `DPE ${l.dpeLabel}` : undefined }));
    },
  },
  {
    id: "logement.exposition-bati", module: "logement",
    evaluate: (f, p) => {
      const l = f.logement;
      if (!l || !l.expositionBati) return na("exposition-bati");
      return emit("exposition-bati", verif("exposition-bati", l, "structuring",
        "Cette adresse est exposée au retrait-gonflement des argiles (aléa moyen ou fort).",
        batiAction[bucket(p)], { limitation: "L'exposition de la zone ne prouve pas un dommage sur ce bien." }));
    },
  },
  {
    id: "logement.zone-reglementee", module: "logement",
    evaluate: (f, p) => {
      const l = f.logement;
      if (!l || !l.zoneReglementee) return na("zone-reglementee");
      return emit("zone-reglementee", verif("zone-reglementee", l, "structuring",
        "Cette adresse relève d'au moins un plan de prévention des risques.", pprnAction[bucket(p)]));
    },
  },
  {
    id: "logement.cavite", module: "logement",
    evaluate: (f) => {
      const l = f.logement;
      if (!l || !l.caviteProche) return na("cavite");
      return emit("cavite", verif("cavite", l, "structuring",
        "Une ou plusieurs cavités souterraines sont recensées à moins de 500 m.",
        "Faites vérifier l'état du sol et des fondations.",
        { limitation: "Recensement d'événements/ouvrages proches, pas une preuve sous ce logement." }));
    },
  },
  {
    id: "logement.patrimoine", module: "logement",
    evaluate: (f, p) => {
      const l = f.logement;
      if (!l || !l.perimetrePatrimonial || bucket(p) === "location") return na("patrimoine");
      return emit("patrimoine", verif("patrimoine", l, "secondary",
        "Cette adresse est dans un périmètre patrimonial protégé.",
        "Avant des travaux extérieurs, vérifiez en mairie ce que le périmètre autorise (avis de l'ABF possible)."));
    },
  },
  {
    id: "logement.sinistralite", module: "logement",
    evaluate: (f, p) => {
      const l = f.logement;
      if (!l || !l.sinistraliteActive) return na("sinistralite");
      return emit("sinistralite", verif("sinistralite", l, "secondary",
        "La commune a connu des sinistres indemnisés lisibles à son échelle (sécheresse ou inondation).",
        siniAction[bucket(p)], { limitation: "Lu à l'échelle de la commune, pas de ce logement." }));
    },
  },
];
```

- [ ] **Step 4: Ajouter au registre**

Dans `src/lib/decision/materiality-rules.ts`, importer et concaténer :

```ts
import { LOGEMENT_RULES } from "./logement-rules.ts";
```

Remplacer la ligne `export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleCompromis, ruleConfort, ruleInondation];` par :

```ts
export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleCompromis, ruleConfort, ruleInondation, ...LOGEMENT_RULES];
```

- [ ] **Step 5: Lancer, succès + typecheck + commit**

`node --test src/lib/decision/logement-rules.test.ts` → PASS (5). `node --test src/lib/decision/*.test.ts` → tout PASS. `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/logement-rules.ts src/lib/decision/logement-rules.test.ts src/lib/decision/materiality-rules.ts
git commit -m "feat(decision): six règles Logement (verification, posture-aware, jamais incompatibility)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Assembleur — conclusion double grain + titre neutralisé

**Files:**
- Modify: `src/lib/decision/decision-assembler.ts`
- Modify: `src/lib/decision/decision-assembler.test.ts`

- [ ] **Step 1: Test (échoue)** — append à `decision-assembler.test.ts` :

```ts
test("scope commune+adresse : conclusion préfixée « commune et de l'adresse »", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse");
  assert.match(d.conclusion, /commune et de l'adresse/i);
});

test("titre vérifications non-habitant : « À examiner avant de vous engager »", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /à examiner/i);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL.

- [ ] **Step 3: Implémenter**

Dans `decision-assembler.ts`, `labels()` : remplacer le `verifTitle` non-habitant par `"À examiner avant de vous engager"` (garder habitant `"Ce que ces données invitent à comprendre ou surveiller"`).

`conclusionText(...)` prend le `scope`. Modifier sa signature et son usage :

```ts
function conclusionText(state: ConclusionState, facts: DecisionFact[], project: UserProject, uncovered: { label: string }[], scope: "commune" | "commune+adresse"): string {
  const scopeClause = scope === "commune+adresse" ? "À l'échelle de la commune et de l'adresse," : "À l'échelle de la commune,";
  const l = labels(project);
  switch (state) {
    // … remplacer chaque occurrence de la constante `scope`/"À l'échelle de la commune," par `scopeClause` …
```

(Remplacer la variable locale `const scope = "À l'échelle de la commune,";` par le paramètre `scopeClause` ; renommer le paramètre de fonction pour ne pas masquer.) Dans `assembleDossier`, passer le scope : `conclusion: conclusionText(state, facts, project, uncovered, scope),`.

- [ ] **Step 4: Lancer, succès + typecheck + commit**

`node --test src/lib/decision/decision-assembler.test.ts` → PASS. `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(decision): conclusion double grain (commune+adresse) + titre section neutralisé

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Composant — `logementStatus` (pending / unavailable)

**Files:**
- Modify: `src/components/report/DossierDecisionSection.tsx`

- [ ] **Step 1: Ajouter le prop + bannières**

Ajouter au type de props : `logementStatus?: "none" | "pending" | "done" | "unavailable";` (défaut `"none"`).

Juste après l'ouverture de `<section … id="dossier-decision">` et l'en-tête (avant la carte verdict), insérer une bannière conditionnelle :

```tsx
      {logementStatus === "pending" ? (
        <div className="glass rounded-xl p-4 mb-3.5 flex items-center gap-3" style={{ borderLeft: "2px solid var(--info)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0 animate-pulse" />
          <p className="text-[13px] text-muted">Première lecture à l&apos;échelle de la commune. L&apos;analyse du logement et de son environnement immédiat est en cours.</p>
        </div>
      ) : null}
      {logementStatus === "unavailable" ? (
        <div className="glass rounded-xl p-4 mb-3.5" style={{ borderLeft: "2px solid var(--ghost)" }}>
          <p className="text-[13px] text-muted">L&apos;analyse réglementaire de cette adresse n&apos;a pas pu être actualisée. La conclusion ci-dessous reste limitée à la commune.</p>
        </div>
      ) : null}
```

Signature du composant : `export function DossierDecisionSection({ dossier, logement, logementStatus = "none" }: { dossier: Dossier; logement?: { href: string; label: string } | null; logementStatus?: "none" | "pending" | "done" | "unavailable" })`.

- [ ] **Step 2: Typecheck + commit**

`npx tsc --noEmit` → 0.

```bash
git add src/components/report/DossierDecisionSection.tsx
git commit -m "feat(decision): bannières logementStatus (pending/unavailable) sur le dossier

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Augmentation streamée (Server Component + Suspense)

**Files:**
- Create: `src/components/report/DossierAvecLogement.tsx`
- Modify: `src/app/(account)/rapport/page.tsx`

**Interfaces produced:** `<DossierAvecLogement …>` (Server Component async).

- [ ] **Step 1: Le Server Component async**

Create `src/components/report/DossierAvecLogement.tsx` :

```tsx
// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce try/catch gère le "unavailable". Statut réglementaire FRAIS (fetchLogementReportWithTimeout).
import { fetchLogementReportWithTimeout, type ResolvedAddress } from "@/lib/server/georisques-logement";
import { loadModuleFacts } from "@/lib/decision/territory-facts";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import type { Dossier } from "@/lib/decision/decision-fact";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

export async function DossierAvecLogement({
  inseeCode, project, address, savedDpe, communeDossier, logementLink,
}: {
  inseeCode: string;
  project: UserProject;
  address: ResolvedAddress;
  savedDpe: DpeRecord | null;
  communeDossier: Dossier;
  logementLink: { href: string; label: string } | null;
}) {
  try {
    const [report, communeFacts] = await Promise.all([
      fetchLogementReportWithTimeout(address, null),
      loadModuleFacts(inseeCode, { hasAddress: true }),
    ]);
    if (!communeFacts) return <DossierDecisionSection dossier={communeDossier} logement={logementLink} logementStatus="unavailable" />;
    const facts = { ...communeFacts, logement: buildLogementFacts(report, savedDpe, project) };
    const dossier = assembleDossier(runRules(facts, project), project, "commune+adresse");
    return <DossierDecisionSection dossier={dossier} logement={logementLink} logementStatus="done" />;
  } catch {
    return <DossierDecisionSection dossier={communeDossier} logement={logementLink} logementStatus="unavailable" />;
  }
}
```

- [ ] **Step 2: Câbler le hub sous Suspense**

Dans `src/app/(account)/rapport/page.tsx` :

Imports :

```ts
import { Suspense } from "react";
import { DossierAvecLogement } from "@/components/report/DossierAvecLogement";
import type { ResolvedAddress } from "@/lib/server/georisques-logement";
```

Après le calcul de `logementForCommune` (déjà présent), construire l'adresse résolue :

```ts
  const dossierAddress: ResolvedAddress | null = logementForCommune
    ? {
        id: logementForCommune.logement_id, label: logementForCommune.address_label,
        city: logementForCommune.city, citycode: logementForCommune.insee,
        postcode: logementForCommune.postcode, latitude: logementForCommune.latitude, longitude: logementForCommune.longitude,
      }
    : null;
```

Remplacer le rendu actuel `{dossier ? <DossierDecisionSection dossier={dossier} logement={dossierLogementLink} /> : null}` par :

```tsx
        {dossier ? (
          dossierAddress && logementForCommune ? (
            <Suspense fallback={<DossierDecisionSection dossier={dossier} logement={dossierLogementLink} logementStatus="pending" />}>
              <DossierAvecLogement
                inseeCode={inseeCode!}
                project={userProject!}
                address={dossierAddress}
                savedDpe={logementForCommune.selected_dpe_snapshot}
                communeDossier={dossier}
                logementLink={dossierLogementLink}
              />
            </Suspense>
          ) : (
            <DossierDecisionSection dossier={dossier} logement={dossierLogementLink} logementStatus="none" />
          )
        ) : null}
```

(`inseeCode!`/`userProject!` : non-null garantis par la condition `dossier` qui les exige déjà.)

- [ ] **Step 3: Typecheck + build**

`npx tsc --noEmit` → 0. `npm run build` → « ✓ Compiled successfully » (les timeouts SSG legacy /inondation, /chaleur sont pré-existants et hors sujet).

- [ ] **Step 4: Vérification comportementale (skill verify, compte payant avec adresse)**

Sur `/rapport` (compte avec analyse logement) : le dossier communal apparaît d'abord ; la section se remplace par `commune+adresse` avec des points « à examiner » au logement (DPE, etc.), conclusion préfixée « à l'échelle de la commune et de l'adresse » ; en coupant le réseau vers les API réglementaires, la bannière `unavailable` s'affiche et le scope reste communal. Noter l'observé.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/DossierAvecLogement.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(decision): augmentation Logement streamée sous Suspense (commune+adresse)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Vérification finale

- [ ] `npx tsc --noEmit` → 0.
- [ ] `node --test src/lib/decision/*.test.ts` → tout PASS.
- [ ] `npm run build` → compile.
- [ ] Invariants spec §10 : bloc absent → dossier commune inchangé ; règles Logement jamais `incompatibility` ; source absente → aucun « pas de risque » ; échec → `commune` + `unavailable` ; succès → `commune+adresse` ; DPE persisté vs réglementaire frais distingués dans les preuves ; textes achat/location/habitant distincts ; fallback provisoire + remplacement de toute la section.
